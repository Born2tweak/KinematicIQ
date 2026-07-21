from __future__ import annotations

import argparse
import subprocess
from pathlib import Path

from program_contract import (
    evidence_record,
    load_program,
    milestone_artifact,
    print_errors,
    validate_schema,
    validate_semantics,
    write_json,
)


def main() -> int:
    parser = argparse.ArgumentParser(description="Run and record milestone contract checks.")
    parser.add_argument("--id", required=True, dest="milestone_id")
    parser.add_argument("--registry", default="docs/program/milestone_registry.yaml")
    parser.add_argument("--schema", default="docs/program/milestone_schema.yaml")
    parser.add_argument("--evidence-out", required=True)
    parser.add_argument("--execute-declared", action="store_true")
    args = parser.parse_args()

    program = load_program(args.registry, args.schema)
    milestone = program.by_id.get(args.milestone_id)
    if milestone is None:
        print_errors([f"unknown milestone {args.milestone_id}"])
        return 1

    schema_errors = validate_schema(program)
    semantic_errors = validate_semantics(program)
    checks = [
        {"id": "schema", "passed": not schema_errors, "detail": schema_errors},
        {"id": "semantics", "passed": not semantic_errors, "detail": semantic_errors},
    ]
    try:
        artifact = milestone_artifact(program, milestone)
        assertion = next(
            item for item in artifact.get("assertions", [])
            if item.get("id") == f"{milestone['id']}-OUTCOME"
        )
        expected = milestone["in_scope"][0]
        checks.append({
            "id": "registry_owned_outcome",
            "passed": assertion.get("actual") == expected,
            "detail": {"expected": expected, "actual": assertion.get("actual")},
        })
    except (OSError, StopIteration, TypeError, ValueError) as error:
        checks.append({"id": "registry_owned_outcome", "passed": False, "detail": str(error)})

    commands: dict[str, dict[str, object]] = {}
    if args.execute_declared:
        for item in milestone["verification"]["automated"]:
            if item["id"] in {"registry_contract", "targeted_contract_checks"}:
                continue
            result = subprocess.run(
                item["command"], cwd=program.root, shell=True, capture_output=True, text=True
            )
            commands[item["id"]] = {
                "exit_code": result.returncode,
                "stdout": result.stdout,
                "stderr": result.stderr,
            }
            checks.append({
                "id": item["id"],
                "passed": result.returncode == 0,
                "detail": f"exit_code={result.returncode}",
            })

    evidence = evidence_record(program, milestone, checks, commands)
    output_path = (program.root / Path(args.evidence_out)).resolve()
    write_json(output_path, evidence)
    if not evidence["all_required_checks_passed"]:
        print_errors(["one or more contract checks failed"])
        return 1
    print(output_path.relative_to(program.root))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
