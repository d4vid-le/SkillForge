# SkillForge — Le-Gates Continual Learning Engine

A local, minimalist training dashboard and engine for growing a local LLM (Apple Silicon via MLX) by adding isolated, domain-specific skills without forgetting previous knowledge.

## Architecture

```
y = W_base(x) + Σ_k (gate_k * scale_k * (B_k @ A_k) @ x)
```

- **W_base**: Frozen base model (read-only, checksum-verified)
- **Adapters**: Independent rank-8 LoRA per domain
- **Gating**: Router sets gate_k ∈ [0,1], Σ gate_k ≤ 1
- **Quarantine**: Bad adapters gated to 0, never deleted

## The 8 Immutable Rules (Doctrine)

| Rule | Name | Enforcement |
|------|------|-------------|
| R1 | Base Lock | Checksums verified before/after every run |
| R2 | Domain Purity | One adapter per narrow domain, no cross-domain data |
| R3 | Robust Gating | Evaluated on robustness (temp 0.3, n=6 binomial band) |
| R4 | Quarantine | Bad adapters gated to 0, never deleted |
| R5 | Precision | Train in bf16 only. 8-bit for eval/serve |
| R6 | Scale Math | LoRA scale = α/rank. No manual overrides |
| R7 | Data Gate | Drop rows where tokens > max_seq_length - 200 |
| R8 | Audit | Every run writes config + metrics to REPRO_LOG.md |

## Project Structure

```
├── src/                    # React frontend (Vite + Tailwind)
│   ├── App.tsx            # Main dashboard (5 panels)
│   ├── components/        # Panel components
│   ├── store.ts           # State management
│   └── types.ts           # TypeScript types
├── backend/               # Python backend (FastAPI + MLX)
│   ├── server.py          # FastAPI REST API
│   ├── train_lora.py      # Core MLX training (R1, R5, R6)
│   ├── data_validator.py  # Data validation (R2, R7)
│   └── eval_harness.py    # Robustness evaluation (R3)
└── README.md
```

## Frontend (Dashboard)

```bash
npm install
npm run dev     # Development server on :5173
npm run build   # Production build
```

## Backend (Training Engine)

```bash
cd backend
pip install -r requirements.txt

# Start API server
python server.py

# Train an adapter
python train_lora.py \
  --base-model /models/llama-3.2-3b-instruct-bf16 \
  --data /data/sql-train.jsonl \
  --domain sql-query

# Validate data
python data_validator.py \
  --data /data/sql-train.jsonl \
  --domain sql-query

# Run evaluation
python eval_harness.py \
  --adapter ./adapters/sql-query/ \
  --test-data ./data/sql-test.jsonl
```

## Design System

- **Background**: `#0b0e14`
- **Panels**: `#12161f`
- **Borders**: `#232a38`
- **Cyan** (active): `#53c2ff`
- **Green** (pass): `#3ddc84`
- **Orange** (warn): `#ffb454`
- **Red** (fail): `#ff6060`
- **UI Font**: Inter
- **Data Font**: JetBrains Mono

## Requirements

- macOS with Apple Silicon (M1/M2/M3/M4)
- Python 3.11+
- MLX framework (`pip install mlx mlx-lm`)
- Node.js 18+
