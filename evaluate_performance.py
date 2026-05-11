"""
AI Requirements-to-Diagram - Performance Evaluation Script
Data Analyst Task: TP/FP/FN measurement on 50+ user story samples
"""
import sys
import io
# Force UTF-8 output to avoid Windows cp1254 encode errors
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

import os
import json
import time
import random
import re
from pathlib import Path
from datetime import datetime

# Path setup
ROOT_DIR    = Path(__file__).parent
BACKEND_DIR = ROOT_DIR / "backend"
DATASET_DIR = ROOT_DIR / "dataset"
sys.path.insert(0, str(ROOT_DIR))
sys.path.insert(0, str(BACKEND_DIR))

# Load env
from dotenv import load_dotenv
load_dotenv(BACKEND_DIR / ".env")

from ai_service import analyze_with_ai

DIAGRAM_TYPES = ["usecase", "class", "sequence", "activity"]

# ─────────────────────────────────────────────────────────────
def load_all_stories():
    """Load all User Stories from dataset txt files."""
    stories = []
    for txt_file in sorted(DATASET_DIR.glob("*.txt")):
        for enc in ("utf-8", "latin-1", "cp1252"):
            try:
                with open(txt_file, "r", encoding=enc) as f:
                    for line in f:
                        line = line.strip()
                        if len(line) > 30 and line.lower().startswith("as a"):
                            stories.append({"text": line, "source": txt_file.stem})
                break
            except UnicodeDecodeError:
                continue
    return stories


def extract_actor(text: str) -> str:
    m = re.match(r"as an?\s+([^,]+),", text, re.IGNORECASE)
    return m.group(1).strip().lower() if m else ""


def extract_action(text: str) -> str:
    m = re.search(r"i want to\s+(.+?)(?:,\s*so that|$)", text, re.IGNORECASE)
    return m.group(1).strip().lower() if m else ""


# ─────────────────────────────────────────────────────────────
def evaluate_single(story: dict, diagram_type: str) -> dict:
    """
    Run system on one User Story and compute TP / FP / FN.

    Ground-truth rules (pattern-based):
      - Expected actor  -> must appear in actor node labels
      - Expected action -> key words must appear in action node labels
      - At least 1 edge must be produced
    """
    text            = story["text"]
    expected_actor  = extract_actor(text)
    expected_action = extract_action(text)

    t0 = time.time()
    try:
        result  = analyze_with_ai(text, diagram_type)
        elapsed = round(time.time() - t0, 3)
        nodes   = result.get("nodes", [])
        edges   = result.get("edges", [])

        actor_nodes  = [n for n in nodes if n.get("type") == "actor"]
        action_nodes = [n for n in nodes if n.get("type") in
                        ("usecase", "activity", "sequence", "class")]

        actor_labels  = " ".join(n.get("label", "").lower() for n in actor_nodes)
        action_labels = " ".join(n.get("label", "").lower() for n in action_nodes)

        # Actor match: any word of expected actor found in labels
        actor_found = expected_actor and any(
            w in actor_labels for w in expected_actor.split()
        )

        # Action match: at least half of meaningful words found
        action_words  = [w for w in expected_action.split() if len(w) > 3][:4]
        match_count   = sum(1 for w in action_words if w in action_labels)
        action_found  = match_count >= max(1, len(action_words) // 2)

        # TP / FP / FN calculation
        # 3 expected items: [actor, action, edge]
        tp = fp = fn = 0

        if actor_nodes:
            tp += 1 if actor_found else 0
            fp += 0 if actor_found else 1
            fn += 0 if actor_found else 1
        else:
            fn += 1

        if action_nodes:
            tp += 1 if action_found else 0
            fp += 0 if action_found else 1
            fn += 0 if action_found else 1
        else:
            fn += 1

        if edges:
            tp += 1
        else:
            fn += 1

        # Excess nodes penalised as FP (1 FP per 3 extra nodes)
        excess = max(0, len(nodes) - 6)
        fp += excess // 3

        status = "OK"
        error  = None

    except Exception as exc:
        elapsed = round(time.time() - t0, 3)
        nodes = edges = []
        tp, fp, fn = 0, 0, 3
        status = "ERROR"
        error  = str(exc)[:120]

    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall    = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1        = (2 * precision * recall / (precision + recall)
                 if (precision + recall) > 0 else 0.0)

    return {
        "id":           story.get("id"),
        "source":       story.get("source"),
        "text":         text[:80] + ("..." if len(text) > 80 else ""),
        "diagram_type": diagram_type,
        "nodes_count":  len(nodes),
        "edges_count":  len(edges),
        "tp":           tp,
        "fp":           fp,
        "fn":           fn,
        "precision":    round(precision, 4),
        "recall":       round(recall,    4),
        "f1":           round(f1,        4),
        "elapsed_sec":  elapsed,
        "status":       status,
        "error":        error,
    }


# ─────────────────────────────────────────────────────────────
def run_evaluation(sample_size: int = 55, seed: int = 42):
    print("=" * 65)
    print("  AI Requirements-to-Diagram - Performance Evaluation")
    print(f"  Date : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 65)

    all_stories = load_all_stories()
    print(f"\n[INFO] Total dataset size  : {len(all_stories)} User Stories")

    random.seed(seed)
    sample = random.sample(all_stories, min(sample_size, len(all_stories)))

    diagram_cycle = (DIAGRAM_TYPES * (sample_size // len(DIAGRAM_TYPES) + 1))
    for i, s in enumerate(sample):
        s["id"]           = i + 1
        s["diagram_type"] = diagram_cycle[i]

    print(f"[INFO] Sample size         : {len(sample)}")
    print(f"[INFO] Diagram types       : {', '.join(DIAGRAM_TYPES)}")
    print("-" * 65)

    results = []
    for idx, story in enumerate(sample, 1):
        diag  = story["diagram_type"]
        short = story["text"][:52]
        print(f"[{idx:02d}/{len(sample)}] ({diag:10s}) {short}...")

        row = evaluate_single(story, diag)
        results.append(row)

        tag = "[OK] " if row["status"] == "OK" else "[ERR]"
        print(f"         {tag} nodes={row['nodes_count']:2d}  "
              f"edges={row['edges_count']:2d}  "
              f"TP={row['tp']} FP={row['fp']} FN={row['fn']}  "
              f"F1={row['f1']:.3f}  t={row['elapsed_sec']}s")

        time.sleep(1.5)  # rate-limit

    # ── Aggregate Metrics ────────────────────────────────────
    total_tp = sum(r["tp"] for r in results)
    total_fp = sum(r["fp"] for r in results)
    total_fn = sum(r["fn"] for r in results)

    macro_p  = sum(r["precision"] for r in results) / len(results)
    macro_r  = sum(r["recall"]    for r in results) / len(results)
    macro_f1 = sum(r["f1"]        for r in results) / len(results)

    micro_p  = total_tp / (total_tp + total_fp) if (total_tp + total_fp) > 0 else 0
    micro_r  = total_tp / (total_tp + total_fn) if (total_tp + total_fn) > 0 else 0
    micro_f1 = (2 * micro_p * micro_r / (micro_p + micro_r)
                if (micro_p + micro_r) > 0 else 0)

    avg_time    = sum(r["elapsed_sec"] for r in results) / len(results)
    ok_count    = sum(1 for r in results if r["status"] == "OK")
    error_count = len(results) - ok_count

    by_type = {}
    for diag in DIAGRAM_TYPES:
        rows = [r for r in results if r["diagram_type"] == diag]
        if rows:
            by_type[diag] = {
                "count":         len(rows),
                "avg_f1":        round(sum(r["f1"]        for r in rows) / len(rows), 4),
                "avg_precision": round(sum(r["precision"] for r in rows) / len(rows), 4),
                "avg_recall":    round(sum(r["recall"]    for r in rows) / len(rows), 4),
            }

    summary = {
        "evaluation_date":     datetime.now().isoformat(),
        "sample_size":         len(results),
        "total_tp":            total_tp,
        "total_fp":            total_fp,
        "total_fn":            total_fn,
        "macro_precision":     round(macro_p,  4),
        "macro_recall":        round(macro_r,  4),
        "macro_f1":            round(macro_f1, 4),
        "micro_precision":     round(micro_p,  4),
        "micro_recall":        round(micro_r,  4),
        "micro_f1":            round(micro_f1, 4),
        "avg_response_time_s": round(avg_time, 3),
        "success_count":       ok_count,
        "error_count":         error_count,
        "by_diagram_type":     by_type,
        "per_sample":          results,
    }

    # ── Print Summary ────────────────────────────────────────
    print("\n" + "=" * 65)
    print("  RESULTS SUMMARY")
    print("=" * 65)
    print(f"  Sample         : {len(results)}")
    print(f"  Success / Error: {ok_count} / {error_count}")
    print(f"  Total TP       : {total_tp}")
    print(f"  Total FP       : {total_fp}")
    print(f"  Total FN       : {total_fn}")
    print("-" * 65)
    print(f"  Macro Precision: {macro_p:.4f}")
    print(f"  Macro Recall   : {macro_r:.4f}")
    print(f"  Macro F1-Score : {macro_f1:.4f}")
    print("-" * 65)
    print(f"  Micro Precision: {micro_p:.4f}")
    print(f"  Micro Recall   : {micro_r:.4f}")
    print(f"  Micro F1-Score : {micro_f1:.4f}")
    print("-" * 65)
    print(f"  Avg. Response  : {avg_time:.3f} sec")
    print("\n  By Diagram Type:")
    for diag, stats in by_type.items():
        print(f"    {diag:12s}-> n={stats['count']:2d}  "
              f"P={stats['avg_precision']:.3f}  "
              f"R={stats['avg_recall']:.3f}  "
              f"F1={stats['avg_f1']:.3f}")
    print("=" * 65)

    out_path = ROOT_DIR / "evaluation_results.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)
    print(f"\n[INFO] Results saved -> {out_path}")

    return summary


if __name__ == "__main__":
    run_evaluation(sample_size=55, seed=42)
