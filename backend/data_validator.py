"""
SkillForge — Data Validator
Enforces R2 (Domain Purity) and R7 (Data Gate) before training.

Usage:
    python data_validator.py --data /data/sql-train.jsonl --domain sql-query --max-seq-length 2048
"""

import argparse
import json
import sys
from pathlib import Path
from collections import Counter


def load_jsonl(path: str) -> list:
    """Load JSONL file."""
    data = []
    with open(path, "r") as f:
        for line_num, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            try:
                row = json.loads(line)
                row["_line_num"] = line_num
                data.append(row)
            except json.JSONDecodeError as e:
                print(f"[ERROR] Invalid JSON at line {line_num}: {e}")
                sys.exit(1)
    return data


# ============================================================================
# R2: DOMAIN PURITY — One adapter per narrow domain
# ============================================================================

def check_domain_purity(data: list, expected_domain: str) -> bool:
    """
    R2: Verify that all training rows belong to the expected domain.
    Reject any cross-domain contamination.
    """
    print(f"\n[R2] Checking domain purity for: {expected_domain}")
    
    violations = []
    domain_counts = Counter()
    
    for row in data:
        # Check for domain field
        row_domain = row.get("domain", row.get("category", row.get("skill", None)))
        
        if row_domain is not None:
            domain_counts[row_domain] += 1
            if row_domain != expected_domain:
                violations.append({
                    "line": row.get("_line_num"),
                    "found_domain": row_domain,
                    "expected_domain": expected_domain,
                })
    
    if violations:
        print(f"[R2 VIOLATION] Found {len(violations)} cross-domain rows!")
        print(f"  Domain distribution: {dict(domain_counts)}")
        for v in violations[:5]:
            print(f"  Line {v['line']}: found '{v['found_domain']}', expected '{v['expected_domain']}'")
        if len(violations) > 5:
            print(f"  ... and {len(violations) - 5} more")
        return False
    
    print(f"[R2] Domain purity verified: all {len(data)} rows are '{expected_domain}'")
    return True


# ============================================================================
# R7: DATA GATE — Drop rows where prompt tokens exceed max_seq_length - 200
# ============================================================================

def estimate_token_count(text: str) -> int:
    """
    Rough token count estimation.
    In production, use the actual tokenizer: len(tokenizer.encode(text))
    Approximation: ~4 chars per token for English text.
    """
    return len(text) // 4


def enforce_data_gate(data: list, max_seq_length: int = 2048) -> list:
    """
    R7: Drop any training row where the prompt tokens exceed max_seq_length - 200.
    This prevents 0/0 NaN loss from truncated sequences.
    """
    threshold = max_seq_length - 200
    print(f"\n[R7] Enforcing data gate: threshold = {max_seq_length} - 200 = {threshold} tokens")
    
    kept = []
    dropped = []
    
    for row in data:
        # Combine prompt fields for token estimation
        prompt = row.get("prompt", "") + row.get("instruction", "") + row.get("input", "")
        token_count = estimate_token_count(prompt)
        
        if token_count > threshold:
            dropped.append({
                "line": row.get("_line_num"),
                "estimated_tokens": token_count,
                "threshold": threshold,
            })
        else:
            row["token_count"] = token_count
            kept.append(row)
    
    print(f"[R7] Data gate: {len(data)} → {len(kept)} rows ({len(dropped)} dropped)")
    
    if dropped:
        print(f"  First 5 dropped rows:")
        for d in dropped[:5]:
            print(f"    Line {d['line']}: ~{d['estimated_tokens']} tokens (threshold: {d['threshold']})")
    
    return kept


# ============================================================================
# Data Format Validation
# ============================================================================

def validate_format(data: list) -> bool:
    """Validate that each row has the required fields."""
    print(f"\n[FORMAT] Validating data format...")
    
    valid = True
    for row in data:
        # Must have either prompt+response or messages format
        has_prompt_response = "prompt" in row and "response" in row
        has_messages = "messages" in row and isinstance(row["messages"], list)
        has_instruction = "instruction" in row and "output" in row
        
        if not (has_prompt_response or has_messages or has_instruction):
            print(f"[FORMAT ERROR] Line {row.get('_line_num')}: Missing required fields")
            print(f"  Expected: {{prompt, response}} or {{messages: [...]}} or {{instruction, output}}")
            print(f"  Got keys: {list(row.keys())}")
            valid = False
    
    if valid:
        print(f"[FORMAT] All {len(data)} rows have valid format")
    
    return valid


# ============================================================================
# Main Validation Pipeline
# ============================================================================

def validate(data_path: str, domain: str, max_seq_length: int = 2048) -> dict:
    """Run the full validation pipeline."""
    print(f"\n{'='*60}")
    print(f"SkillForge Data Validator")
    print(f"  Data: {data_path}")
    print(f"  Domain: {domain}")
    print(f"  Max Seq Length: {max_seq_length}")
    print(f"{'='*60}")
    
    # Load data
    data = load_jsonl(data_path)
    print(f"\n[LOAD] Loaded {len(data)} rows from {data_path}")
    
    # Validate format
    format_ok = validate_format(data)
    if not format_ok:
        print("\n[ABORT] Format validation failed. Fix data and retry.")
        sys.exit(1)
    
    # R2: Domain purity
    domain_ok = check_domain_purity(data, domain)
    if not domain_ok:
        print("\n[ABORT] R2 violation: cross-domain contamination detected.")
        print("  Remove rows from other domains or split into separate files.")
        sys.exit(1)
    
    # R7: Data gate
    filtered_data = enforce_data_gate(data, max_seq_length)
    if len(filtered_data) == 0:
        print("\n[ABORT] R7: All rows exceed the token threshold. No data to train on.")
        sys.exit(1)
    
    # Summary
    print(f"\n{'='*60}")
    print(f"VALIDATION PASSED")
    print(f"  Rows: {len(data)} → {len(filtered_data)} (after R7 gate)")
    print(f"  Domain: {domain} ✓")
    print(f"  Format: valid ✓")
    print(f"{'='*60}")
    
    return {
        "total_rows": len(data),
        "valid_rows": len(filtered_data),
        "domain": domain,
        "max_seq_length": max_seq_length,
        "data": filtered_data,
    }


# ============================================================================
# CLI Entry Point
# ============================================================================

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="SkillForge Data Validator (R2 + R7)")
    parser.add_argument("--data", required=True, help="Path to training JSONL file")
    parser.add_argument("--domain", required=True, help="Expected domain name")
    parser.add_argument("--max-seq-length", type=int, default=2048, help="Max sequence length")
    parser.add_argument("--output", help="Optional: write filtered data to this path")
    
    args = parser.parse_args()
    
    result = validate(args.data, args.domain, args.max_seq_length)
    
    if args.output:
        with open(args.output, "w") as f:
            for row in result["data"]:
                # Remove internal fields
                clean_row = {k: v for k, v in row.items() if not k.startswith("_")}
                f.write(json.dumps(clean_row) + "\n")
        print(f"\n[OUTPUT] Filtered data written to {args.output}")
