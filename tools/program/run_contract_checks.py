from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path

from program_contract import (
    load_program,
    milestone_artifact,
    print_errors,
    validate_schema,
    validate_semantics,
)
from evidence_integrity import (
    build_record,
    evidence_path,
    git_output,
    latest_records_by_milestone,
    load_records,
    verify_record,
    write_json,
)
from execution_authority import (
    ExecutionAuthorityError,
    assert_declared_branch,
    assert_executable,
)


def main() -> int:
    parser = argparse.ArgumentParser(description="Run and record milestone contract checks.")
    parser.add_argument("--id", required=True, dest="milestone_id")
    parser.add_argument("--registry", default="docs/program/milestone_registry.yaml")
    parser.add_argument("--schema", default="docs/program/milestone_schema.yaml")
    parser.add_argument("--evidence-out", required=True)
    parser.add_argument("--execute-declared", action="store_true")
    parser.add_argument("--bootstrap-repair", action="store_true")
    parser.add_argument("--command-cache")
    args = parser.parse_args()

    program = load_program(args.registry, args.schema)
    milestone = program.by_id.get(args.milestone_id)
    if milestone is None:
        print_errors([f"unknown milestone {args.milestone_id}"])
        return 1
    try:
        assert_declared_branch(program.root)
    except ExecutionAuthorityError as error:
        print_errors([str(error)])
        return 1
    if not args.bootstrap_repair:
        try:
            assert_executable(program.root, milestone["id"])
        except ExecutionAuthorityError as error:
            print_errors([str(error)])
            return 1
    subject_commit = git_output(program.root, "rev-parse", "HEAD")
    existing_path = evidence_path(
        program.root,
        milestone["id"],
        f"{milestone['id']}-{subject_commit[:12]}",
    )
    if existing_path.is_file():
        existing = json.loads(existing_path.read_text(encoding="utf-8"))
        existing_errors = verify_record(
            program.root,
            milestone,
            existing,
            load_records(program.root),
        )
        if existing_errors:
            print_errors([
                f"{existing_path.relative_to(program.root)} is immutable but invalid; "
                "commit the changed scope before producing replacement evidence.",
                *existing_errors,
            ])
            return 1
        print(existing_path.relative_to(program.root))
        return 0

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

    cache_path = Path(args.command_cache).resolve() if args.command_cache else None
    command_cache = (
        json.loads(cache_path.read_text(encoding="utf-8"))
        if cache_path and cache_path.is_file()
        else {}
    )
    commands: dict[str, dict[str, object]] = {}
    if args.execute_declared:
        for item in milestone["verification"]["automated"]:
            if item["id"] in {"registry_contract", "targeted_contract_checks"}:
                continue
            cache_key = f"{subject_commit}:{item['command']}"
            cached = command_cache.get(cache_key)
            if cached is None or cached.get("exit_code") != 0:
                result = subprocess.run(
                    item["command"], cwd=program.root, shell=True, capture_output=True, text=True
                )
                command_cache[cache_key] = {
                    "exit_code": result.returncode,
                    "stdout": result.stdout,
                    "stderr": result.stderr,
                }
                if cache_path:
                    write_json(cache_path, command_cache)
            commands[item["id"]] = command_cache[cache_key]
            checks.append({
                "id": item["id"],
                "passed": commands[item["id"]]["exit_code"] == 0,
                "detail": f"exit_code={commands[item['id']]['exit_code']}",
            })

    targeted_passed = all(item["passed"] for item in checks)
    commands["targeted_contract_checks"] = {
        "exit_code": 0 if targeted_passed else 1,
        "stdout": "repository-bound schema, semantics, artifact, and declared checks completed",
        "stderr": "" if targeted_passed else "one or more internal checks failed",
    }
    checks.append({
        "id": "targeted_contract_checks",
        "passed": targeted_passed,
        "detail": f"exit_code={commands['targeted_contract_checks']['exit_code']}",
    })

    try:
        evidence = build_record(
            program.root,
            milestone,
            checks,
            commands,
            latest_records_by_milestone(program.root),
        )
    except ValueError as error:
        print_errors([str(error)])
        return 1
    output_path = evidence_path(
        program.root, milestone["id"], evidence["evidence_id"]
    )
    write_json(output_path, evidence)
    if not evidence["all_required_checks_passed"]:
        print_errors(["one or more contract checks failed"])
        return 1
    print(output_path.relative_to(program.root))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
