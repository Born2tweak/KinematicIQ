from __future__ import annotations

import argparse
import hashlib
import json
from collections import Counter
from pathlib import Path

import yaml


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
        "schedule": root / "docs/program/WAVE_1_SCHEDULE.yaml",
        "charter": root / "docs/program/artifacts/kq-002.yaml",
    }
    registry = _yaml(paths["milestones"])
    resources = _yaml(paths["resources"])
    schedule = _yaml(paths["schedule"])
    charter = _yaml(paths["charter"])
    milestones = {item["id"]: item for item in registry["milestones"]}
    resource_status = {item["id"]: item["status"] for item in resources["resources"]}

    ready: list[str] = []
    blocked_resources: dict[str, list[str]] = {}
    for milestone in registry["milestones"]:
        if milestone["milestone_status"] not in {"Pending", "Ready", "FailedTechnical"}:
            continue
        unresolved = sorted(item for item in milestone["resource_dependencies"] if resource_status.get(item) != "READY")
        if unresolved:
            blocked_resources[milestone["id"]] = unresolved
            continue
        dependencies_ok = True
        for dependency in milestone["dependencies"]:
            upstream = milestones[dependency["id"]]
            if upstream["milestone_status"] not in dependency["accepted_milestone_statuses"]:
                dependencies_ok = False
                break
            accepted_codes = dependency.get("accepted_result_codes")
            if accepted_codes:
                evidence_path = root / f"docs/status/milestones/{upstream['id']}.json"
                if not evidence_path.is_file() or json.loads(evidence_path.read_text(encoding="utf-8")).get("result_code") not in accepted_codes:
                    dependencies_ok = False
                    break
        if dependencies_ok:
            ready.append(milestone["id"])

    committed_ids = schedule["bands"]["committed"]["ids"]
    committed_order = [item["id"] for item in schedule["bands"]["committed"]["schedule"]]
    wave_ready = [item for item in committed_order if item in ready]
    status_counts = dict(sorted(Counter(item["milestone_status"] for item in registry["milestones"]).items()))
    availability = charter["product_contract"]["availability_at_lock"]
    return {
        "schema_version": 1,
        "program_id": registry["program_id"],
        "source_hashes": {path.relative_to(root).as_posix(): _hash(path) for path in paths.values()},
        "milestones": {
            "total": len(milestones),
            "status_counts": status_counts,
            "dependency_ready_ids": sorted(ready),
            "committed_wave_ready_ids": wave_ready,
            "next_executable_id": wave_ready[0] if wave_ready else None,
            "resource_blocked": blocked_resources,
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
