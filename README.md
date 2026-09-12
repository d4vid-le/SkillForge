# SkillForge — Le-Gates Continual Learning Engine

A local, minimalist training dashboard for growing a local LLM (Apple Silicon via MLX) by adding isolated, domain-specific skills without forgetting previous knowledge.

## The Forward Pass

```
y = W_base(x) + Σ_k (gate_k · scale_k · (B_k @ A_k) @ x)
```

W_base is frozen. Each skill k is an independent rank-8 LoRA. Gates are hot-swappable. Bad skills are disabled (gate=0), not unlearned.

## Design Philosophy

The 8 doctrine rules (R1–R8) are **invisible** — baked into the interface constraints, not displayed as badges.

| Rule | How it's enforced in the UI |
|------|-----------------------------|
| R1 Base Lock | Checksum auto-verified. Train button blocked until verified. |
| R2 Domain Purity | Data validator rejects cross-domain rows before training starts. |
| R3 Robust Gating | Eval shows both greedy and robust scores with threshold badges. |
| R4 Quarantine | Disabled adapters show at reduced opacity, gate locked to 0.0. |
| R5 Precision | bf16 label shown, 8-bit for eval. No toggle — it's the only option. |
| R6 Scale Math | Scale field is read-only, derived from α/rank. Cannot be overridden. |
| R7 Data Gate | Rows dropped silently during validation. Count shown in audit log. |
| R8 Audit | Full-width timestamped log at bottom. Color-coded by severity. |

## Color System

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

## Layout

```
┌─────────────────────────────────────────────────────┐
│  base model · checksum · memory gauge · formula     │
├──────────────────────┬──────────────────────────────┤
│  TRAIN               │  ROUTE                       │
│  domain, data,       │  gate sliders (coupled Σ≤1)  │
│  recipe preset,      │  router mode selector        │
│  read-only scale,    │  hot-swap test input         │
│  loss sparkline,     │                              │
│  checkpoint display  │                              │
├──────────────────────┼──────────────────────────────┤
│  EVAL                │  REGISTRY                    │
│  greedy + base       │  domain, status, rank, size  │
│  robust + base       │  greedy/robust vs base       │
│  Δ (separated − M1)  │  subtle quarantine (opacity) │
│  holdout per domain  │  gate → 0.0 mechanism        │
│  pass/fail badges    │                              │
├──────────────────────┴──────────────────────────────┤
│  AUDIT (full width, timestamped, severity-coded)    │
└─────────────────────────────────────────────────────┘
```

## Frontend

```bash
npm install
npm run dev     # :5173
npm run build   # production
```

## Backend (Python / MLX)

```bash
cd backend
pip install -r requirements.txt

# API server
python server.py

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

## Requirements

- macOS with Apple Silicon (M1–M4)
- Python 3.11+, MLX, mlx-lm
- Node.js 18+
