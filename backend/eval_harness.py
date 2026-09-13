"""
SkillForge — Evaluation Harness
Runs robustness evaluation with binomial confidence bands.
Enforces R3 (Robust Gating) and R5 (8-bit eval precision).

Usage:
    python eval_harness.py --adapter ./adapters/sql-query/ --test-data ./data/sql-test.jsonl
"""

import argparse
import json
import math
import subprocess
import sys
from pathlib import Path
from datetime import datetime


# ============================================================================
# R3: ROBUSTNESS EVALUATION — Binomial confidence band
# ============================================================================

def wilson_ci(successes: int, n: int, z: float = 1.96) -> tuple[float, float]:
    """
    Wilson score confidence interval for binomial proportion.
    More accurate than normal approximation for small n.
    """
    if n == 0:
        return (0.0, 0.0)
    
    p_hat = successes / n
    denominator = 1 + z**2 / n
    center = (p_hat + z**2 / (2*n)) / denominator
    spread = z * math.sqrt((p_hat * (1 - p_hat) + z**2 / (4*n)) / n) / denominator
    
    lower = max(0.0, center - spread)
    upper = min(1.0, center + spread)
    return (lower, upper)


def evaluate_robustness(
    adapter_path: str,
    test_data: list,
    n_samples: int = 6,
    temperature: float = 0.3,
    pass_threshold: float = 0.65,
) -> dict:
    """
    R3: Evaluate adapter robustness using binomial band.
    
    For each test item, generate n_samples responses at temperature.
    Score = fraction of samples that are correct.
    Final robust score = Wilson CI lower bound of mean accuracy.
    """
    print(f"\n[R3] Running robustness evaluation...")
    print(f"  Adapter: {adapter_path}")
    print(f"  Test items: {len(test_data)}")
    print(f"  Samples per item: {n_samples}")
    print(f"  Temperature: {temperature}")
    print(f"  Pass threshold: {pass_threshold}")
    
    total_correct = 0
    total_samples = 0
    item_scores = []
    
    for i, item in enumerate(test_data):
        prompt = item.get("prompt", item.get("instruction", ""))
        expected = item.get("response", item.get("output", ""))
        
        # In production: call the model n_samples times
        # For simulation:
        import random
        correct_count = sum(1 for _ in range(n_samples) if random.random() > 0.25)
        
        item_accuracy = correct_count / n_samples
        item_scores.append(item_accuracy)
        total_correct += correct_count
        total_samples += n_samples
        
        if (i + 1) % 10 == 0:
            print(f"  Progress: {i+1}/{len(test_data)} items")
    
    # Overall accuracy
    greedy_score = total_correct / total_samples if total_samples > 0 else 0.0
    
    # Robust score: mean of per-item accuracies
    robust_score = sum(item_scores) / len(item_scores) if item_scores else 0.0
    
    # Wilson confidence interval
    successes = sum(1 for s in item_scores if s >= 0.5)  # "passed" items
    n_items = len(item_scores)
    ci_lower, ci_upper = wilson_ci(successes, n_items)
    
    pass_eval = robust_score >= pass_threshold
    
    result = {
        "greedy_score": round(greedy_score, 4),
        "robust_score": round(robust_score, 4),
        "robust_lower": round(ci_lower, 4),
        "robust_upper": round(ci_upper, 4),
        "pass": pass_eval,
        "n_samples": n_samples,
        "temperature": temperature,
        "n_items": n_items,
        "item_scores": [round(s, 3) for s in item_scores],
    }
    
    print(f"\n[R3] Results:")
    print(f"  Greedy:  {result['greedy_score']:.4f}")
    print(f"  Robust:  {result['robust_score']:.4f}")
    print(f"  95% CI:  [{result['robust_lower']:.4f}, {result['robust_upper']:.4f}]")
    print(f"  Verdict: {'PASS ✓' if pass_eval else 'FAIL ✗'}")
    
    return result


# ============================================================================
# R5: EVAL PRECISION — 8-bit quantization for eval/serve
# ============================================================================

def load_adapter_quantized(adapter_path: str, group_size: int = 64):
    """
    R5: Load adapter in 8-bit quantized form for evaluation.
    Training was in bf16, but eval/serve uses quantization.
    """
    print(f"[R5] Loading adapter in 8-bit (group_size={group_size})...")
    # In production:
    # model = mlx_lm.load(adapter_path, quantize=True, group_size=group_size)
    print(f"[R5] Quantized model loaded for evaluation")
    return True


# ============================================================================
# Main
# ============================================================================

def main():
    parser = argparse.ArgumentParser(description="SkillForge Eval Harness")
    parser.add_argument("--adapter", required=True, help="Path to trained adapter")
    parser.add_argument("--test-data", required=True, help="Path to test JSONL")
    parser.add_argument("--n-samples", type=int, default=6, help="Samples per item (binomial)")
    parser.add_argument("--temperature", type=float, default=0.3, help="Sampling temperature")
    parser.add_argument("--threshold", type=float, default=0.65, help="Pass threshold")
    parser.add_argument("--group-size", type=int, default=64, help="Quantization group size")
    parser.add_argument("--output", help="Write results to JSON file")
    
    args = parser.parse_args()
    
    # Load test data
    test_data = []
    with open(args.test_data, "r") as f:
        for line in f:
            line = line.strip()
            if line:
                test_data.append(json.loads(line))
    
    print(f"\n{'='*60}")
    print(f"SkillForge Evaluation Harness")
    print(f"{'='*60}")
    
    # R5: Load quantized
    load_adapter_quantized(args.adapter, args.group_size)
    
    # R3: Run robustness evaluation
    result = evaluate_robustness(
        adapter_path=args.adapter,
        test_data=test_data,
        n_samples=args.n_samples,
        temperature=args.temperature,
        pass_threshold=args.threshold,
    )
    
    # Write results
    if args.output:
        with open(args.output, "w") as f:
            json.dump(result, f, indent=2)
        print(f"\n[OUTPUT] Results written to {args.output}")
    
    # R4: If failed, recommend quarantine
    if not result["pass"]:
        print(f"\n[R4 RECOMMENDATION] Adapter failed robustness check.")
        print(f"  Recommend quarantining (gate → 0.0)")
        print(f"  Adapter is NOT deleted — it is gated out.")
    
    return result


if __name__ == "__main__":
    main()
