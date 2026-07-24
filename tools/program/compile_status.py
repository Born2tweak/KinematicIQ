from __future__ import annotations

import argparse
import hashlib
import json
from collections import Counter
from pathlib import Path

import yaml

from evidence_integrity import VALIDITY_PROJECTION, compile_projection
from execution_authority import ACTIVE_WAVE, executable_frontier


class StatusCompilerError(ValueError):
    pass


def _yaml(path: Path) -> dict:
    return yaml.safe_load(path.read_text(encoding="utf-8"))


def _hash(path: Path) -> str:
    return hashlib.sha256(path.read_text(encoding="utf-8").replace("\r\n", "\n").encode()).hexdigest()


def compile_status(root: Path) -> dict:
    paths = {
        "milestones": root / "docs/program/milestone_registry.yaml",
        "resources": root / "docs/program/resource_registry.yaml",
        "schedule": root / ACTIVE_WAVE,
        "charter": root / "docs/program/artifacts/kq-002.yaml",
        "validity": root / VALIDITY_PROJECTION,
    }
    registry = _yaml(paths["milestones"])
    resources = _yaml(paths["resources"])
    schedule = _yaml(paths["schedule"])
    charter = _yaml(paths["charter"])
    milestones = {item["id"]: item for item in registry["milestones"]}
    projection = compile_projection(root, registry["milestones"])
    frontier = executable_frontier(root)
    committed_ids = [item["id"] for item in schedule["committed"]]
    status_counts = dict(sorted(Counter(item["milestone_status"] for item in registry["milestones"]).items()))
    availability = charter["product_contract"]["availability_at_lock"]
    return {
        "schema_version": 1,
        "program_id": registry["program_id"],
        "source_hashes": {path.relative_to(root).as_posix(): _hash(path) for path in paths.values()},
        "milestones": {
            "total": len(milestones),
            "status_counts": status_counts,
            **frontier,
            "evidence_validity_counts": {
                key: len(value) for key, value in projection["summary"].items()
            },
        },
        "protocols": {
            "available": availability["available"],
            "unavailable": availability["unavailable"],
            "release_rule": registry["registry_policy"]["release_rule"],
        },
        "authority": {
            "branch": registry["registry_policy"]["default_branch"],
            "automatic_production_deploy": registry["registry_policy"]["automatic_production_deploy"],
            "committed_wave_ids": committed_ids,
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Compile or verify the concise Expanded-10 program frontier.")
    parser.add_argument("--output", required=True)
    parser.add_argument("--verify", action="store_true")
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[2]
    output = root / args.output
    expected = compile_status(root)
    if args.verify:
        if not output.is_file() or json.loads(output.read_text(encoding="utf-8")) != expected:
            print(f"FAIL: {args.output} is missing or stale")
            return 1
        print(f"PASS: verified {args.output}")
        return 0
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(expected, indent=2, sort_keys=True) + "\n", encoding="utf-8", newline="\n")
    print(f"PASS: generated {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
