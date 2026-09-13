"""
SkillForge — Data Cleaning Engine
Core logic for ingesting, cleaning, and validating JSONL training data.

Implements:
- Deduplication (exact prompt match)
- R7: Length gate (prompt_tokens > max_seq_length - 200)
- Format normalization (<think>/answer wrapping)
- Domain purity heuristics
"""

import hashlib
import json
import re
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path


# ============================================================================
# Tokenizer (Qwen2.5-Coder-14B-Instruct)
# ============================================================================

class TokenCounter:
    """Token counter using Qwen tokenizer."""
    
    def __init__(self, model_name: str = "Qwen/Qwen2.5-Coder-14B-Instruct"):
        try:
            from transformers import AutoTokenizer
            self.tokenizer = AutoTokenizer.from_pretrained(model_name)
            print(f"[TOKENIZER] Loaded {model_name}")
        except Exception as e:
            print(f"[TOKENIZER] Failed to load {model_name}: {e}")
            print(f"[TOKENIZER] Falling back to character-based estimation")
            self.tokenizer = None
    
    def count_tokens(self, text: str) -> int:
        """Count tokens in text."""
        if self.tokenizer:
            return len(self.tokenizer.encode(text))
        else:
            # Rough estimation: ~4 chars per token for English
            return len(text) // 4


# ============================================================================
# Deduplication
# ============================================================================

def compute_prompt_hash(prompt: str) -> str:
    """Compute SHA256 hash of prompt for deduplication."""
    return hashlib.sha256(prompt.strip().encode()).hexdigest()


def deduplicate(rows: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], int]:
    """
    Remove exact duplicate prompts.
    Returns (deduplicated_rows, duplicate_count).
    """
    seen_hashes = set()
    deduped = []
    dup_count = 0
    
    for row in rows:
        prompt = row.get("prompt", "")
        prompt_hash = compute_prompt_hash(prompt)
        
        if prompt_hash in seen_hashes:
            dup_count += 1
            row["_is_duplicate"] = True
        else:
            seen_hashes.add(prompt_hash)
            row["_is_duplicate"] = False
        
        deduped.append(row)
    
    return deduped, dup_count


# ============================================================================
# R7: Length Gate
# ============================================================================

def apply_length_gate(
    rows: List[Dict[str, Any]],
    token_counter: TokenCounter,
    max_seq_length: int = 1024,
) -> Tuple[List[Dict[str, Any]], int]:
    """
    R7: Flag or reject rows where prompt_tokens > (max_seq_length - 200).
    Returns (rows_with_token_counts, over_length_count).
    """
    threshold = max_seq_length - 200
    over_count = 0
    
    for row in rows:
        prompt = row.get("prompt", "")
        token_count = token_counter.count_tokens(prompt)
        row["_token_count"] = token_count
        
        if token_count > threshold:
            over_count += 1
            row["_exceeds_length"] = True
        else:
            row["_exceeds_length"] = False
    
    return rows, over_count


# ============================================================================
# Format Normalization
# ============================================================================

def normalize_format(row: Dict[str, Any]) -> Dict[str, Any]:
    """
    Ensure the assistant response follows the canonical format:
    <think>...reasoning...</think>\n<answer>...exact answer...</answer>
    
    If missing, auto-wrap or flag.
    """
    target = row.get("target", "")
    
    # Check if already in correct format
    has_think = "<think>" in target and "</think>" in target
    has_answer = "<answer>" in target and "</answer>" in target
    
    if has_think and has_answer:
        row["_format_valid"] = True
        return row
    
    # Try to auto-wrap
    if not has_think and not has_answer:
        # Wrap entire target in answer tags
        row["target"] = f"<think>Auto-wrapped by SkillForge.</think>\n<answer>{target}</answer>"
        row["_format_valid"] = True
        row["_format_auto_wrapped"] = True
    elif has_think and not has_answer:
        # Has think but no answer — extract the last line as answer
        parts = target.split("</think>")
        if len(parts) == 2:
            think_part = parts[0] + "</think>"
            answer_part = parts[1].strip()
            row["target"] = f"{think_part}\n<answer>{answer_part}</answer>"
            row["_format_valid"] = True
            row["_format_auto_wrapped"] = True
    else:
        # Can't auto-fix
        row["_format_valid"] = False
    
    return row


def normalize_all_formats(rows: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], int]:
    """Apply format normalization to all rows. Returns (rows, invalid_count)."""
    invalid_count = 0
    
    for row in rows:
        row = normalize_format(row)
        if not row.get("_format_valid", False):
            invalid_count += 1
    
    return rows, invalid_count


# ============================================================================
# Domain Purity Heuristics
# ============================================================================

# Keywords that suggest cross-domain contamination
DOMAIN_KEYWORDS = {
    "math": {
        "suspicious": [
            r"\bSELECT\b", r"\bFROM\b", r"\bWHERE\b",  # SQL
            r"rm\s+-rf", r"chmod", r"chown",  # Bash
            r"/etc/passwd", r"/etc/shadow",  # File paths
            r"def\s+\w+\(", r"class\s+\w+",  # Code
        ],
        "expected": [
            r"\d+\s*[\+\-\*\/\=]",  # Math operations
            r"solve", r"equation", r"derivative", r"integral",
            r"limit", r"function", r"theorem",
        ],
    },
    "code": {
        "suspicious": [
            r"\bSELECT\b", r"\bFROM\b",  # SQL in non-SQL domain
        ],
        "expected": [
            r"def\s+\w+\(", r"class\s+\w+", r"import\s+\w+",
            r"function\s+\w+", r"const\s+\w+",
        ],
    },
}


def check_domain_purity(
    row: Dict[str, Any],
    domain: str,
) -> List[str]:
    """
    Check for cross-domain contamination.
    Returns list of flags (empty if clean).
    """
    prompt = row.get("prompt", "")
    target = row.get("target", "")
    text = f"{prompt} {target}"
    
    flags = []
    
    if domain in DOMAIN_KEYWORDS:
        keywords = DOMAIN_KEYWORDS[domain]
        
        # Check for suspicious keywords
        for pattern in keywords["suspicious"]:
            if re.search(pattern, text, re.IGNORECASE):
                # Extract the matched keyword
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    matched_text = match.group(0)
                    if "SELECT" in matched_text.upper():
                        flags.append("sql-leak")
                    elif "rm" in matched_text or "chmod" in matched_text:
                        flags.append("bash-command")
                    elif "/etc/" in matched_text:
                        flags.append("file-path")
                    else:
                        flags.append("security-keyword")
                break
    
    return flags


def apply_domain_purity(
    rows: List[Dict[str, Any]],
    domain: str,
) -> Tuple[List[Dict[str, Any]], int]:
    """Apply domain purity checks. Returns (rows, flagged_count)."""
    flagged_count = 0
    
    for row in rows:
        flags = check_domain_purity(row, domain)
        row["_domain_flags"] = flags
        if flags:
            flagged_count += 1
    
    return rows, flagged_count


# ============================================================================
# Main Cleaning Pipeline
# ============================================================================

def clean_dataset(
    input_path: str,
    domain: str,
    max_seq_length: int = 1024,
    deduplicate: bool = True,
    auto_format: bool = True,
    domain_purity_check: bool = True,
) -> Dict[str, Any]:
    """
    Main cleaning pipeline.
    
    Returns:
        {
            "rows": [...],
            "stats": {
                "total": int,
                "duplicates": int,
                "over_length": int,
                "format_invalid": int,
                "domain_flagged": int,
            }
        }
    """
    print(f"\n{'='*60}")
    print(f"SkillForge Data Cleaning Pipeline")
    print(f"{'='*60}")
    print(f"Input: {input_path}")
    print(f"Domain: {domain}")
    print(f"Max seq length: {max_seq_length}")
    
    # Load JSONL
    rows = []
    with open(input_path, "r") as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    rows.append(json.loads(line))
                except json.JSONDecodeError as e:
                    print(f"[ERROR] Invalid JSON: {e}")
    
    total = len(rows)
    print(f"\n[LOAD] Loaded {total} rows")
    
    # Initialize token counter
    token_counter = TokenCounter()
    
    # Step 1: Deduplication
    if deduplicate:
        rows, dup_count = deduplicate(rows)
        print(f"[DEDUP] {dup_count} duplicates found")
    else:
        dup_count = 0
    
    # Step 2: Length gate (R7)
    rows, over_count = apply_length_gate(rows, token_counter, max_seq_length)
    print(f"[R7] {over_count} rows exceed length threshold ({max_seq_length - 200} tokens)")
    
    # Step 3: Format normalization
    if auto_format:
        rows, format_invalid = normalize_all_formats(rows)
        print(f"[FORMAT] {format_invalid} rows have invalid format")
    else:
        format_invalid = 0
    
    # Step 4: Domain purity
    if domain_purity_check:
        rows, domain_flagged = apply_domain_purity(rows, domain)
        print(f"[DOMAIN] {domain_flagged} rows flagged for domain contamination")
    else:
        domain_flagged = 0
    
    # Summary
    print(f"\n{'='*60}")
    print(f"CLEANING COMPLETE")
    print(f"  Total: {total}")
    print(f"  Duplicates: {dup_count}")
    print(f"  Over-length: {over_count}")
    print(f"  Format invalid: {format_invalid}")
    print(f"  Domain flagged: {domain_flagged}")
    print(f"{'='*60}")
    
    return {
        "rows": rows,
        "stats": {
            "total": total,
            "duplicates": dup_count,
            "over_length": over_count,
            "format_invalid": format_invalid,
            "domain_flagged": domain_flagged,
        },
    }


# ============================================================================
# Export
# ============================================================================

def export_clean_data(
    rows: List[Dict[str, Any]],
    output_path: str,
    domain: str,
) -> int:
    """
    Export kept rows to JSONL in MLX/Unsloth SFT format.
    
    Output format:
    {
        "messages": [
            {"role": "user", "content": "..."},
            {"role": "assistant", "content": "..."}
        ]
    }
    
    Returns: number of rows exported.
    """
    # Filter to kept rows only
    kept_rows = [
        r for r in rows
        if not r.get("_is_duplicate", False)
        and not r.get("_exceeds_length", False)
        and r.get("_format_valid", True)
        and not r.get("_domain_flags", [])
    ]
    
    # Convert to SFT format
    sft_rows = []
    for row in kept_rows:
        sft_row = {
            "messages": [
                {"role": "user", "content": row.get("prompt", "")},
                {"role": "assistant", "content": row.get("target", "")},
            ]
        }
        sft_rows.append(sft_row)
    
    # Write JSONL
    with open(output_path, "w") as f:
        for sft_row in sft_rows:
            f.write(json.dumps(sft_row) + "\n")
    
    print(f"\n[EXPORT] Wrote {len(sft_rows)} rows to {output_path}")
    return len(sft_rows)


# ============================================================================
# CLI
# ============================================================================

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="SkillForge Data Cleaning Pipeline")
    parser.add_argument("--input", required=True, help="Input JSONL file")
    parser.add_argument("--output", required=True, help="Output JSONL file")
    parser.add_argument("--domain", required=True, help="Domain name")
    parser.add_argument("--max-seq-length", type=int, default=1024, help="Max sequence length")
    parser.add_argument("--no-dedup", action="store_true", help="Skip deduplication")
    parser.add_argument("--no-format", action="store_true", help="Skip format normalization")
    parser.add_argument("--no-purity", action="store_true", help="Skip domain purity check")
    
    args = parser.parse_args()
    
    # Clean
    result = clean_dataset(
        input_path=args.input,
        domain=args.domain,
        max_seq_length=args.max_seq_length,
        deduplicate=not args.no_dedup,
        auto_format=not args.no_format,
        domain_purity_check=not args.no_purity,
    )
    
    # Export
    export_clean_data(result["rows"], args.output, args.domain)
