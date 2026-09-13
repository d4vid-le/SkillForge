# SkillForge — Le-Gates Continual Learning Engine

A two-stage pipeline for growing a local LLM (Apple Silicon via MLX) by adding isolated, domain-specific skills without forgetting previous knowledge.

## Two-Stage Pipeline

### Stage 1: Data Pipeline
Ingest, clean, review, and export training-ready JSONL data.

**Features:**
- Upload raw JSONL files
- Auto-cleaning: deduplication, R7 length gate, format normalization, domain purity checks
- Interactive review queue with keep/reject/edit actions
- Export to MLX/Unsloth SFT format

**Backend:**
```bash
cd backend
pip install -r requirements.txt

# Run data pipeline API
python data_pipeline_api.py  # :8001
```

**Core modules:**
- `cleaning.py` — Deduplication, tokenization (Qwen2.5-Coder-14B-Instruct), R7 length gate, format normalization, domain purity heuristics
- `data_pipeline_api.py` — FastAPI endpoints for upload, process, review, export

### Stage 2: Training Engine
Train domain-specific LoRA adapters with the Le-Gates architecture.

**Features:**
- Base model lock (R1: checksum verification)
- Recipe presets (smoke-0.5B, standard-3B, port-14B)
- Coupled gate routing (Σ ≤ 1.0 enforced)
- Robustness evaluation (R3: binomial confidence bands)
- Quarantine system (R4: bad adapters gated to 0, not deleted)

**Backend:**
```bash
cd backend

# Run training API
python server.py  # :8000

# Train adapter
python train_lora.py \
  --base-model /models/llama-3.2-3b-instruct-bf16 \
  --data /data/sql-train.jsonl \
  --domain sql-query

# Validate data (R2 + R7)
python data_validator.py --data /data/sql-train.jsonl --domain sql-query

# Evaluate (R3: robustness)
python eval_harness.py --adapter ./adapters/sql-query/ --test-data ./data/sql-test.jsonl
```

**Core modules:**
- `train_lora.py` — MLX LoRA training with R1 (base lock), R5 (bf16), R6 (scale math), holdout-gated checkpointing
- `data_validator.py` — R2 (domain purity) and R7 (length gate) enforcement
- `eval_harness.py` — R3 robustness evaluation with Wilson score confidence intervals
- `server.py` — FastAPI training API

## Frontend

```bash
npm install
npm run dev     # :5173
npm run build   # production
```

**Navigation:**
- Top nav toggles between "Data" (Stage 1) and "Forge" (Stage 2)
- Stage 1: Upload → Review → Export
- Stage 2: Train → Route → Eval → Registry

## The Le-Gates Architecture

```
y = W_base(x) + Σ_k (gate_k · scale_k · (B_k @ A_k) @ x)
```

- **W_base**: Frozen base model (read-only, checksum-verified)
- **Adapters**: Independent rank-8 LoRA per domain
- **Gating**: Router sets gate_k ∈ [0,1], Σ gate_k ≤ 1
- **Quarantine**: Bad adapters gated to 0, never deleted

## The 8 Immutable Rules (Doctrine)

The doctrine is **invisible** — baked into interface constraints, not displayed as badges.

| Rule | Stage 1 Enforcement | Stage 2 Enforcement |
|------|---------------------|---------------------|
| R1 Base Lock | — | Checksum auto-verified. Train button blocked until verified. |
| R2 Domain Purity | Domain purity heuristics flag cross-domain rows. | Data validator rejects cross-domain rows before training. |
| R3 Robust Gating | — | Eval shows both greedy and robust scores with threshold badges. |
| R4 Quarantine | — | Disabled adapters show at reduced opacity, gate locked to 0.0. |
| R5 Precision | — | bf16 label shown, 8-bit for eval. No toggle — it's the only option. |
| R6 Scale Math | — | Scale field is read-only, derived from α/rank. Cannot be overridden. |
| R7 Data Gate | Length gate flags rows > max_seq_length - 200 tokens. | Data gate drops long rows silently. Count shown in audit log. |
| R8 Audit | — | Full-width timestamped log at bottom. Color-coded by severity. |

## Design System

```
Background:   #1e1e1e
Panels:       #2d2d2d
Elevated:     #3a3a3a
Text:         #ffffff (data) / #8e8e93 (secondary) / #636366 (muted)
Accent:       #0a84ff (active/selected only)
Success:      #30d158 (pass badges only)
Error:        #ff453a (violations only)
Warning:      #ffd60a (warnings only)
```

## Requirements

- macOS with Apple Silicon (M1–M4)
- Python 3.11+, MLX, mlx-lm, transformers
- Node.js 18+

## Project Structure

```
├── src/                          # React frontend
│   ├── App.tsx                   # Navigation wrapper
│   ├── components/
│   │   ├── DataStage.tsx         # Stage 1 container
│   │   ├── UploadPanel.tsx       # File upload + config
│   │   ├── ReviewQueue.tsx       # Card list with actions
│   │   ├── ExportPanel.tsx       # Export button
│   │   ├── ForgeStage.tsx        # Stage 2 container
│   │   ├── HeaderBar.tsx         # Model + checksum + memory
│   │   ├── TrainPanel.tsx        # Training config + sparkline
│   │   ├── RoutePanel.tsx        # Gate sliders + hot-swap
│   │   ├── EvalPanel.tsx         # Scores + baselines + Δ
│   │   ├── RegistryPanel.tsx     # Adapter table
│   │   └── LogPanel.tsx          # Audit log
│   ├── store.ts                  # Stage 2 state
│   ├── dataStore.ts              # Stage 1 state
│   └── types.ts                  # TypeScript types
├── backend/                      # Python backend
│   ├── cleaning.py               # Data cleaning engine
│   ├── data_pipeline_api.py      # Stage 1 FastAPI
│   ├── train_lora.py             # MLX training (R1, R5, R6)
│   ├── data_validator.py         # R2 + R7 validation
│   ├── eval_harness.py           # R3 robustness eval
│   ├── server.py                 # Stage 2 FastAPI
│   └── requirements.txt
└── README.md
```
