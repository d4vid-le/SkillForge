"""
SkillForge — Data Pipeline FastAPI Server
Stage 1 endpoints: ingest, clean, review, export.

Usage:
    uvicorn data_pipeline_api:app --reload --port 8001
"""

import json
import tempfile
import uuid
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

from cleaning import clean_dataset, export_clean_data

app = FastAPI(title="SkillForge Data Pipeline API", version="0.1.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# State (in-memory for demo; use DB in production)
# ============================================================================

class ProcessingSession:
    def __init__(self):
        self.id: str = ""
        self.domain: str = ""
        self.rows: List[dict] = []
        self.stats: dict = {}
        self.user_decisions: dict = {}  # row_id -> "keep" | "reject"
        self.user_edits: dict = {}      # row_id -> {prompt, target}

sessions: dict[str, ProcessingSession] = {}

# ============================================================================
# Models
# ============================================================================

class ProcessRequest(BaseModel):
    domain: str
    max_seq_length: int = 1024
    deduplicate: bool = True
    auto_format: bool = True
    domain_purity_check: bool = True

class RowDecision(BaseModel):
    row_id: str
    decision: str  # "keep" | "reject"

class RowEdit(BaseModel):
    row_id: str
    prompt: str
    target: str

class ExportRequest(BaseModel):
    session_id: str
    domain: str

# ============================================================================
# Endpoints
# ============================================================================

@app.post("/api/data/upload")
async def upload_and_process(
    file: UploadFile = File(...),
    domain: str = Form(...),
    max_seq_length: int = Form(1024),
    deduplicate: bool = Form(True),
    auto_format: bool = Form(True),
    domain_purity_check: bool = Form(True),
):
    """Upload JSONL and run the cleaning pipeline."""
    if not file.filename or not file.filename.endswith(('.jsonl', '.json')):
        raise HTTPException(status_code=400, detail="File must be .jsonl or .json")
    
    # Save uploaded file temporarily
    session_id = str(uuid.uuid4())[:8]
    temp_dir = Path(tempfile.gettempdir()) / "skillforge"
    temp_dir.mkdir(exist_ok=True)
    temp_path = temp_dir / f"{session_id}_raw.jsonl"
    
    content = await file.read()
    with open(temp_path, "wb") as f:
        f.write(content)
    
    # Run cleaning pipeline
    try:
        result = clean_dataset(
            input_path=str(temp_path),
            domain=domain,
            max_seq_length=max_seq_length,
            deduplicate=deduplicate,
            auto_format=auto_format,
            domain_purity_check=domain_purity_check,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cleaning failed: {str(e)}")
    
    # Store session
    session = ProcessingSession()
    session.id = session_id
    session.domain = domain
    session.rows = result["rows"]
    session.stats = result["stats"]
    sessions[session_id] = session
    
    # Clean up temp file
    temp_path.unlink()
    
    # Format rows for frontend
    formatted_rows = []
    for i, row in enumerate(session.rows):
        formatted_rows.append({
            "id": f"row-{i+1:03d}",
            "prompt": row.get("prompt", ""),
            "target": row.get("target", ""),
            "source": file.filename,
            "tokenCount": row.get("_token_count", 0),
            "isDuplicate": row.get("_is_duplicate", False),
            "formatValid": row.get("_format_valid", True),
            "domainFlags": row.get("_domain_flags", []),
            "exceedsLength": row.get("_exceeds_length", False),
        })
    
    return {
        "session_id": session_id,
        "rows": formatted_rows,
        "stats": result["stats"],
    }


@app.get("/api/data/session/{session_id}")
async def get_session(session_id: str):
    """Get session data."""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = sessions[session_id]
    return {
        "session_id": session.id,
        "domain": session.domain,
        "stats": session.stats,
        "row_count": len(session.rows),
    }


@app.post("/api/data/row/decide")
async def decide_row(decision: RowDecision):
    """Mark a row as keep or reject."""
    # In a real app, this would update the session's user_decisions
    return {"status": "ok", "row_id": decision.row_id, "decision": decision.decision}


@app.post("/api/data/row/edit")
async def edit_row(edit: RowEdit):
    """Edit a row's prompt and/or target."""
    return {"status": "ok", "row_id": edit.row_id}


@app.post("/api/data/export")
async def export_data(request: ExportRequest):
    """Export clean data as JSONL."""
    if request.session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = sessions[request.session_id]
    
    # Apply user decisions
    for row in session.rows:
        row_id = row.get("_row_id", "")
        if row_id in session.user_decisions:
            row["_user_decision"] = session.user_decisions[row_id]
        if row_id in session.user_edits:
            edits = session.user_edits[row_id]
            if "prompt" in edits:
                row["prompt"] = edits["prompt"]
            if "target" in edits:
                row["target"] = edits["target"]
    
    # Export
    temp_dir = Path(tempfile.gettempdir()) / "skillforge"
    output_path = temp_dir / f"{request.domain}-clean.jsonl"
    
    count = export_clean_data(session.rows, str(output_path), request.domain)
    
    return FileResponse(
        path=str(output_path),
        filename=f"{request.domain}-clean.jsonl",
        media_type="application/jsonl",
    )


@app.get("/api/data/health")
async def health():
    return {"status": "ok", "sessions": len(sessions)}


# ============================================================================
# Entry Point
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
