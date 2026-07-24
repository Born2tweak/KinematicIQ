from __future__ import annotations

import argparse
import json
from pathlib import Path

import jsonschema
import yaml


class ReplanImpactError(ValueError):
    pass


def compile_impact(event: dict, registry: dict, schema: dict) -> list[str]:
    candidate = {key: value for key, value in event.items() if key != "expected"}
    errors = sorted(jsonschema.Draft202012Validator(schema).iter_errors(candidate), key=lambda item: list(item.path))
    if errors:
        raise ReplanImpactError("; ".join(error.message for error in errors))
    milestones = {item["id"]: item for item in registry["milestones"]}
    missing = sorted(set(event["affected_seeds"]) - set(milestones))
    if missing:
        raise ReplanImpactError(f"unknown affected seeds: {missing}")
    reverse = {item: [] for item in milestones}
    for milestone in milestones.values():
        for dependency in milestone["dependencies"]:
            reverse[dependency["id"]].append(milestone["id"])
    selected = set(event["affected_seeds"])
    if event["propagation"] == "descendants":
        pending = list(event["affected_seeds"])
        while pending:
            current = pending.pop()
            for child in reverse[current]:
                if child not in selected:
                    selected.add(child)
                    pending.append(child)
    return sorted(selected)


def main() -> int:
    parser = argparse.ArgumentParser(description="Compile deterministic unresolved-node impact from an inflection event.")
    parser.add_argument("--event", required=True)
    parser.add_argument("--registry", default="docs/program/milestone_registry.yaml")
    parser.add_argument("--schema", default="docs/program/inflection_schema.yaml")
    parser.add_argument("--verify-fixture", action="store_true")
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[2]
    event = yaml.safe_load((root / args.event).read_text(encoding="utf-8"))
    registry = yaml.safe_load((root / args.registry).read_text(encoding="utf-8"))
    schema = yaml.safe_load((root / args.schema).read_text(encoding="utf-8"))
    try:
        affected = compile_impact(event, registry, schema)
        if args.verify_fixture:
            expected = event.get("expected", {})
            minimum = expected.get("minimum_affected_count", 1)
            required_reopened = set(expected.get("reopened_completed", []))
            missing_reopened = sorted(required_reopened - set(affected))
            if len(affected) < minimum or missing_reopened:
                raise ReplanImpactError(
                    f"fixture mismatch: affected_count={len(affected)}, "
                    f"missing_reopened={missing_reopened}"
                )
    except ReplanImpactError as error:
        print(f"FAIL: {error}")
        return 1
    print(json.dumps({"event_id": event["event_id"], "affected_unresolved_ids": affected}, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
