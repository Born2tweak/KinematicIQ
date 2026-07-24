from __future__ import annotations

import argparse
import json
from pathlib import Path

import yaml

from evidence_integrity import COMPLETED_STATUSES, compile_projection


def main() -> int:
    parser = argparse.ArgumentParser(description="Live-verify milestone evidence schema v2.")
    parser.add_argument("--all", action="store_true", dest="verify_all")
    parser.add_argument("--id", dest="milestone_id")
    parser.add_argument("--exclude", action="append", default=[])
    args = parser.parse_args()
    if not args.verify_all and not args.milestone_id:
        parser.error("provide --all or --id")
    root = Path(__file__).resolve().parents[2]
    registry = yaml.safe_load(
        (root / "docs/program/milestone_registry.yaml").read_text(encoding="utf-8")
    )
    projection = compile_projection(root, registry["milestones"])
    completed = {
        item["id"] for item in registry["milestones"]
        if item["milestone_status"] in COMPLETED_STATUSES
    }
    targets = sorted(
        (completed if args.verify_all else {args.milestone_id}) - set(args.exclude)
    )
    results = {
        milestone_id: projection["states"].get(
            milestone_id, {"validity": "ReverificationRequired", "reason": "No evidence state."}
        )
        for milestone_id in targets
    }
    failed = {
        milestone_id: value
        for milestone_id, value in results.items()
        if value["validity"] != "Current"
    }
    print(json.dumps({
        "total": len(targets),
        "current": len(targets) - len(failed),
        "failed": len(failed),
        "results": results,
        "verification_errors": {
            key: value for key, value in projection["verification_errors"].items()
            if key in targets
        },
    }, indent=2, sort_keys=True))
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
