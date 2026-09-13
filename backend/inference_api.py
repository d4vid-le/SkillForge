"""
SkillForge — Inference & Routing API
Stage 3 backend: chat, routing, and robustness probe endpoints.

Usage:
    uvicorn inference_api:app --reload --port 8002
"""

import asyncio
import json
import random
import time
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

app = FastAPI(title="SkillForge Inference API", version="0.1.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# Mock State (simulating MLX inference server)
# ============================================================================

class InferenceState:
    def __init__(self):
        self.base_model = "llama-3.2-3b-instruct-bf16"
        self.active_adapters = {
            "sql-query": {"gate": 0.6, "loaded": True, "size_mb": 42},
            "code-review": {"gate": 0.4, "loaded": True, "size_mb": 42},
            "math-reasoning": {"gate": 0.0, "loaded": False, "size_mb": 42},
        }
        self.memory_usage = {
            "base": 6.2,  # GB
            "adapters": 0.084,  # GB (2 adapters loaded)
            "total": 6.284,
            "system": 64.0,
        }

state = InferenceState()

# ============================================================================
# Models
# ============================================================================

class ChatRequest(BaseModel):
    prompt: str
    system_prompt: Optional[str] = None
    gate_vector: Dict[str, float]  # domain -> gate value
    temperature: float = 0.7
    max_tokens: int = 512

class RouteRequest(BaseModel):
    prompt: str
    router_mode: str = "keyword_v3"  # keyword_v3 | v3q_diagnostic | oracle

class ProbeRequest(BaseModel):
    prompt: str
    system_prompt: Optional[str] = None
    gate_vector: Dict[str, float]
    n_samples: int = 6
    temperature: float = 0.3

class GateVectorResponse(BaseModel):
    gates: Dict[str, float]
    sum: float
    active_adapters: List[str]
    router_mode: str

class ProbeResponse(BaseModel):
    greedy_response: str
    robust_samples: List[str]
    robustness_score: int
    robustness_pass: bool
    ttft_ms: float
    tokens_per_sec: float

# ============================================================================
# Routing Logic (Simulated)
# ============================================================================

def route_prompt(prompt: str, router_mode: str) -> Dict[str, float]:
    """
    Route a prompt through the router and return gate vector.
    Simulates keyword_v3, v3q_diagnostic, and oracle routers.
    """
    prompt_lower = prompt.lower()
    gates = {domain: 0.0 for domain in state.active_adapters.keys()}
    
    if router_mode == "keyword_v3":
        # Simple keyword matching
        if any(kw in prompt_lower for kw in ["select", "from", "where", "sql", "query", "database"]):
            gates["sql-query"] = 1.0
        elif any(kw in prompt_lower for kw in ["code", "function", "class", "debug", "review", "python", "javascript"]):
            gates["code-review"] = 1.0
        elif any(kw in prompt_lower for kw in ["solve", "equation", "derivative", "integral", "math"]):
            gates["math-reasoning"] = 1.0
        else:
            # Default: distribute among loaded adapters
            loaded = [d for d, info in state.active_adapters.items() if info["loaded"]]
            if loaded:
                share = 1.0 / len(loaded)
                for domain in loaded:
                    gates[domain] = share
    
    elif router_mode == "v3q_diagnostic":
        # More sophisticated: confidence-based routing
        if "sql" in prompt_lower or "query" in prompt_lower:
            gates["sql-query"] = 0.9
            gates["code-review"] = 0.1
        elif "code" in prompt_lower or "function" in prompt_lower:
            gates["code-review"] = 0.85
            gates["sql-query"] = 0.15
        else:
            gates["sql-query"] = 0.5
            gates["code-review"] = 0.5
    
    elif router_mode == "oracle":
        # Perfect routing (for testing)
        if "sql" in prompt_lower:
            gates["sql-query"] = 1.0
        elif "code" in prompt_lower:
            gates["code-review"] = 1.0
        elif "math" in prompt_lower or "solve" in prompt_lower:
            gates["math-reasoning"] = 1.0
    
    # Enforce Σ ≤ 1.0
    total = sum(gates.values())
    if total > 1.0:
        for domain in gates:
            gates[domain] /= total
    
    return gates


# ============================================================================
# Mock Generation (Simulating MLX inference)
# ============================================================================

def generate_response(prompt: str, gate_vector: Dict[str, float], temperature: float) -> str:
    """
    Generate a mock response based on the active adapter.
    In production, this would call the MLX inference server.
    """
    # Determine which adapter is most active
    active_domain = max(gate_vector.items(), key=lambda x: x[1])[0] if any(v > 0 for v in gate_vector.values()) else None
    
    # Generate domain-specific mock response
    if active_domain == "sql-query":
        responses = [
            "SELECT * FROM users WHERE age > 25 ORDER BY name;",
            "To optimize this query, add an index on the 'created_at' column.",
            "The JOIN operation is causing a cartesian product. Use INNER JOIN with proper conditions.",
        ]
    elif active_domain == "code-review":
        responses = [
            "The function has a time complexity of O(n²). Consider using a hash map for O(n).",
            "This code has a potential null pointer exception on line 15.",
            "Refactor this into smaller functions for better testability.",
        ]
    elif active_domain == "math-reasoning":
        responses = [
            "<think>Using the quadratic formula: x = (-b ± √(b²-4ac)) / 2a.</think>\n<answer>x = 2 or x = -3</answer>",
            "<think>The derivative of x³ is 3x² by the power rule.</think>\n<answer>3x²</answer>",
        ]
    else:
        responses = [
            "I can help with that. Let me analyze your question.",
            "Based on the context, here's my response.",
        ]
    
    # Add temperature-based variation
    if temperature > 0:
        response = random.choice(responses)
        # Simulate some variation at higher temperatures
        if temperature > 0.5 and random.random() > 0.7:
            response += " (Note: this is a simulated response for testing.)"
    else:
        # Greedy: always pick first
        response = responses[0]
    
    return response


async def stream_response(prompt: str, gate_vector: Dict[str, float], temperature: float):
    """
    Stream a response token-by-token.
    In production, this would stream from MLX.
    """
    full_response = generate_response(prompt, gate_vector, temperature)
    words = full_response.split()
    
    for i, word in enumerate(words):
        # Simulate token generation delay
        await asyncio.sleep(0.05)
        
        # Stream word by word (simplified tokenization)
        yield json.dumps({"token": word + " ", "done": i == len(words) - 1}) + "\n"


# ============================================================================
# Endpoints
# ============================================================================

@app.post("/api/route")
async def route(request: RouteRequest):
    """Route a prompt and return the gate vector."""
    gates = route_prompt(request.prompt, request.router_mode)
    
    return GateVectorResponse(
        gates=gates,
        sum=sum(gates.values()),
        active_adapters=[d for d, g in gates.items() if g > 0],
        router_mode=request.router_mode,
    )


@app.post("/api/chat")
async def chat(request: ChatRequest):
    """Stream a chat response."""
    # Validate gate vector
    gate_sum = sum(request.gate_vector.values())
    if gate_sum > 1.0 + 0.001:  # floating point tolerance
        raise HTTPException(status_code=400, detail=f"Gate vector sum exceeds 1.0: {gate_sum}")
    
    return StreamingResponse(
        stream_response(request.prompt, request.gate_vector, request.temperature),
        media_type="application/x-ndjson",
    )


@app.post("/api/probe")
async def probe(request: ProbeRequest):
    """Run robustness probe: 1 greedy + 6 at temperature."""
    start_time = time.time()
    
    # Greedy generation (temp 0.0)
    greedy_response = generate_response(request.prompt, request.gate_vector, temperature=0.0)
    
    # Robust samples (temp 0.3)
    robust_samples = []
    for _ in range(request.n_samples):
        sample = generate_response(request.prompt, request.gate_vector, temperature=request.temperature)
        robust_samples.append(sample)
    
    # Calculate robustness score
    # Count how many samples match the greedy response
    matches = sum(1 for s in robust_samples if s == greedy_response)
    robustness_score = matches
    robustness_pass = matches >= 5  # At least 5/6 must match
    
    # Performance metrics
    ttft_ms = (time.time() - start_time) * 1000 + 50  # Simulated
    tokens_per_sec = 45.0 + random.uniform(-5, 5)  # Simulated
    
    return ProbeResponse(
        greedy_response=greedy_response,
        robust_samples=robust_samples,
        robustness_score=robustness_score,
        robustness_pass=robustness_pass,
        ttft_ms=ttft_ms,
        tokens_per_sec=tokens_per_sec,
    )


@app.get("/api/status")
async def get_status():
    """Get inference server status."""
    return {
        "base_model": state.base_model,
        "active_adapters": state.active_adapters,
        "memory": state.memory_usage,
        "available_routers": ["keyword_v3", "v3q_diagnostic", "oracle"],
    }


@app.post("/api/adapters/update")
async def update_adapter_gates(gates: Dict[str, float]):
    """Update adapter gate values."""
    # Validate sum
    total = sum(gates.values())
    if total > 1.0 + 0.001:
        raise HTTPException(status_code=400, detail=f"Gate sum exceeds 1.0: {total}")
    
    for domain, gate in gates.items():
        if domain in state.active_adapters:
            state.active_adapters[domain]["gate"] = gate
            # Auto-load if gate > 0
            if gate > 0:
                state.active_adapters[domain]["loaded"] = True
    
    # Update memory usage
    loaded_adapters = [a for a in state.active_adapters.values() if a["loaded"]]
    adapter_memory = sum(a["size_mb"] for a in loaded_adapters) / 1024  # Convert MB to GB
    state.memory_usage["adapters"] = adapter_memory
    state.memory_usage["total"] = state.memory_usage["base"] + adapter_memory
    
    return {"status": "ok", "memory": state.memory_usage}


@app.get("/api/health")
async def health():
    return {"status": "ok"}


# ============================================================================
# Entry Point
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
