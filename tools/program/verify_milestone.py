from __future__ import annotations

import argparse
import json

from program_contract import (
    evaluate_acceptance,
    load_program,
    print_errors,
    validate_schema,
    validate_semantics,
)


def main() -> int:
    parser = argparse.ArgumentParser(description="Verify an Expanded-10 milestone contract.")
    parser.add_argument("--registry", default="docs/program/milestone_registry.yaml")
    parser.add_argument("--schema", default="docs/program/milestone_schema.yaml")
    parser.add_argument("--id", dest="milestone_id")
    parser.add_argument("--structure-only", action="store_true")
    args = parser.parse_args()

    program = load_program(args.registry, args.schema)
    errors = validate_schema(program) + validate_semantics(program)
    if errors:
        print_errors(errors)
        return 1

    payload: dict[str, object] = {
        "schema_valid": True,
        "semantic_contract_valid": True,
        "milestone_count": len(program.milestones),
    }
    if args.milestone_id:
        milestone = program.by_id.get(args.milestone_id)
        if milestone is None:
            print_errors([f"unknown milestone {args.milestone_id}"])
            return 1
        if not args.structure_only:
            checks = evaluate_acceptance(program, milestone)
            payload["acceptance"] = checks
            if not all(item["passed"] for item in checks):
                print(json.dumps(payload, indent=2))
                return 1
    print(json.dumps(payload, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
