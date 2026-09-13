# SkillForge
Skillforge isn't a just a trainer. It's a skill library OS for one frozen local model. It's a local-first training and inference engine that solves catastrophic forgetting by treating it as an architecture problem rather than an optimization problem. Instead of updating a model's core weights, SkillForge keeps the base model strictly frozen and encapsulates specialized skills into independent, domain-pure LoRA adapters. At inference, a bounded gating mechanism (`MultiAdapterLinear`) dynamically routes inputs to the correct skill chips.

## Core Principles

- **Zero Forgetting by Construction:** The base model is immutable. Forgetting is structurally impossible; a bad skill is disabled (gated to 0), not unlearned.
- **Orthogonal Isolation:** Prevents gradient interference by isolating skills into separate rank-8 subspaces. Separation of concerns wins over raw capacity.
- **Hot-Swappable Inference:** Load, unload, or blend skills per-request without restarting the server or merging weights.
- **Defensive Training Pipeline:** Enforces strict data gates (NaN-trap prevention, purity audits) and gates promotion on robustness (temp 0.3, n=6), not just greedy accuracy.
- **Local-First:** Optimized for consumer hardware (Apple Silicon) via MLX.

## The Mechanism: Le-Gates

The forward pass for a gated stack is defined as:

$$y = W_{base}(x) + \sum_{k} (gate_k \cdot scale_k \cdot (B_k \circ A_k) \cdot x)$$

Where $W_{base}$ is frozen, $A_k$ and $B_k$ are the low-rank deltas for skill $k$, and $gate_k$ is bounded such that $\sum gate_k \le 1$.
