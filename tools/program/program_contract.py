from __future__ import annotations

import hashlib
import json
import os
import platform
import re
import subprocess
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

import jsonschema
import yaml


VERIFIER_VERSION = "1.0.0"
PREDICATE_CATALOG_VERSION = 1
ALLOWED_PREDICATES = {
    "all_artifacts_exist_and_nonempty",
    "current_run_evidence_matches_head",
    "contract_output_assertion_passes",
    "command_exit_code_equals",
    "regression_floor_passes",
    "validation_disposition_is_signed_and_allowed",
    "release_eligibility_requires_gate_pass_only",
}
SKIP_REQUIRED_FIELDS = {
    "decision_id",
    "authority",
    "rationale",
    "affected_scope",
    "evidence",
    "reconsideration_trigger",
}
RELEASE_RESULT = "RELEASE_ELIGIBLE"
GATE_PASS = "GATE_PASS"


class ContractError(ValueError):
    pass


@dataclass(frozen=True)
class LoadedProgram:
    root: Path
    registry_path: Path
    schema_path: Path
    registry: dict[str, Any]
    schema: dict[str, Any]

    @property
    def milestones(self) -> list[dict[str, Any]]:
        return self.registry["milestones"]

    @property
    def by_id(self) -> dict[str, dict[str, Any]]:
        return {item["id"]: item for item in self.milestones}


def load_yaml(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as handle:
        return yaml.safe_load(handle)


def repository_root(start: Path | None = None) -> Path:
    location = (start or Path.cwd()).resolve()
    result = subprocess.run(
        ["git", "rev-parse", "--show-toplevel"],
        cwd=location,
        check=True,
        capture_output=True,
        text=True,
    )
    return Path(result.stdout.strip()).resolve()


def load_program(registry: str, schema: str, root: Path | None = None) -> LoadedProgram:
    repo = root or repository_root()
    registry_path = (repo / registry).resolve()
    schema_path = (repo / schema).resolve()
    return LoadedProgram(
        root=repo,
        registry_path=registry_path,
        schema_path=schema_path,
        registry=load_yaml(registry_path),
        schema=load_yaml(schema_path),
    )


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256_file(path: Path) -> str:
    return sha256_bytes(path.read_bytes())


def git_output(root: Path, *args: str) -> str:
    result = subprocess.run(
        ["git", *args], cwd=root, check=True, capture_output=True, text=True
    )
    return result.stdout.strip()


def git_head(root: Path) -> str:
    return git_output(root, "rev-parse", "HEAD")


def is_ancestor(root: Path, ancestor: str, descendant: str = "HEAD") -> bool:
    return subprocess.run(
        ["git", "merge-base", "--is-ancestor", ancestor, descendant],
        cwd=root,
        capture_output=True,
    ).returncode == 0


def validate_schema(program: LoadedProgram) -> list[str]:
    jsonschema.Draft202012Validator.check_schema(program.schema)
    errors = jsonschema.Draft202012Validator(program.schema).iter_errors(program.registry)
    return [f"{'.'.join(str(part) for part in error.path)}: {error.message}" for error in errors]


def _cycles(by_id: dict[str, dict[str, Any]]) -> list[list[str]]:
    visiting: set[str] = set()
    visited: set[str] = set()
    path: list[str] = []
    found: list[list[str]] = []

    def visit(node_id: str) -> None:
        if node_id in visiting:
            index = path.index(node_id)
            found.append(path[index:] + [node_id])
            return
        if node_id in visited:
            return
        visiting.add(node_id)
        path.append(node_id)
        for dependency in by_id[node_id]["dependencies"]:
            if dependency["id"] in by_id:
                visit(dependency["id"])
        path.pop()
        visiting.remove(node_id)
        visited.add(node_id)

    for milestone_id in by_id:
        visit(milestone_id)
    return found


def _command_target_exists(root: Path, command: str) -> bool:
    python_match = re.match(r"^python\s+([^\s]+\.py)(?:\s|$)", command)
    if python_match:
        return (root / python_match.group(1)).is_file()
    npm_match = re.match(r"^npm\s+--prefix\s+(\S+)\s+run\s+(\S+)", command)
    if npm_match:
        package_path = root / npm_match.group(1) / "package.json"
        if not package_path.is_file():
            return False
        scripts = json.loads(package_path.read_text(encoding="utf-8")).get("scripts", {})
        return npm_match.group(2) in scripts
    npm_test_match = re.match(r"^npm\s+--prefix\s+(\S+)\s+test(?:\s|$)", command)
    if npm_test_match:
        package_path = root / npm_test_match.group(1) / "package.json"
        return package_path.is_file() and "test" in json.loads(
            package_path.read_text(encoding="utf-8")
        ).get("scripts", {})
    return False


def validate_semantics(program: LoadedProgram) -> list[str]:
    errors: list[str] = []
    milestones = program.milestones
    by_id = program.by_id
    ids = [item["id"] for item in milestones]
    if len(ids) != 175:
        errors.append(f"registry must contain 175 milestones, found {len(ids)}")
    duplicates = sorted({item for item in ids if ids.count(item) > 1})
    if duplicates:
        errors.append(f"duplicate milestone IDs: {duplicates}")
    roots = [item["id"] for item in milestones if not item["dependencies"]]
    if roots != ["KQ-001"]:
        errors.append(f"expected sole root KQ-001, found {roots}")

    reverse: dict[str, list[str]] = {item: [] for item in ids}
    for milestone in milestones:
        for dependency in milestone["dependencies"]:
            upstream = dependency["id"]
            if upstream not in by_id:
                errors.append(f"{milestone['id']} references missing dependency {upstream}")
                continue
            reverse[upstream].append(milestone["id"])
            accepts_skip = "SkippedByDecision" in dependency["accepted_milestone_statuses"]
            skip_policy = by_id[upstream].get("skip_policy")
            if accepts_skip and not skip_policy:
                errors.append(f"{milestone['id']} illegally accepts skip from non-skippable {upstream}")
            if skip_policy and accepts_skip and dependency.get("edge_class") != "conditional_decision":
                errors.append(f"{milestone['id']} skip edge from {upstream} is not conditional_decision")
        expected_unlocks = sorted(reverse.get(milestone["id"], []))
        # Checked after reverse index is fully built below.

    for milestone in milestones:
        expected_unlocks = sorted(reverse[milestone["id"]])
        if sorted(milestone["unlocks"]) != expected_unlocks:
            errors.append(
                f"{milestone['id']} unlocks mismatch: expected {expected_unlocks}, got {sorted(milestone['unlocks'])}"
            )
        skip_policy = milestone.get("skip_policy")
        decision_skip = milestone["outcomes"].get("decision_skip")
        if bool(skip_policy) != bool(decision_skip):
            errors.append(f"{milestone['id']} skip_policy and decision_skip outcome must appear together")
        if skip_policy:
            missing = SKIP_REQUIRED_FIELDS - set(skip_policy)
            if missing:
                errors.append(f"{milestone['id']} skip policy missing {sorted(missing)}")
            if decision_skip.get("milestone_status") != "SkippedByDecision":
                errors.append(f"{milestone['id']} decision_skip must produce SkippedByDecision")

        for acceptance in milestone["acceptance"]:
            if acceptance["predicate"] not in ALLOWED_PREDICATES:
                errors.append(f"{milestone['id']} uses unknown predicate {acceptance['predicate']}")

        pass_outcome = milestone["outcomes"]["pass"]
        if pass_outcome.get("result_code") == RELEASE_RESULT:
            gate_predicates = [
                item for item in milestone["acceptance"]
                if item["predicate"] == "release_eligibility_requires_gate_pass_only"
            ]
            if len(gate_predicates) != 1:
                errors.append(f"{milestone['id']} release outcome lacks one gate-pass predicate")
            if not any(
                GATE_PASS in dependency.get("accepted_result_codes", [])
                for dependency in milestone["dependencies"]
            ):
                errors.append(f"{milestone['id']} release outcome has no GATE_PASS dependency")

        for check in milestone["verification"]["automated"]:
            if not _command_target_exists(program.root, check["command"]):
                errors.append(f"{milestone['id']} command target does not exist: {check['command']}")

    for cycle in _cycles(by_id):
        errors.append(f"dependency cycle: {' -> '.join(cycle)}")
    return errors


def milestone_artifact(program: LoadedProgram, milestone: dict[str, Any]) -> dict[str, Any]:
    artifact_path = program.root / milestone["artifacts"][0]
    if not artifact_path.is_file():
        raise ContractError(f"missing contract artifact {artifact_path.relative_to(program.root)}")
    artifact = load_yaml(artifact_path)
    if not isinstance(artifact, dict):
        raise ContractError("contract artifact must be an object")
    return artifact


def _assertion_actual(artifact: dict[str, Any], assertion_id: str) -> Any:
    assertions = artifact.get("assertions", [])
    matches = [item for item in assertions if item.get("id") == assertion_id]
    if len(matches) != 1:
        raise ContractError(f"expected exactly one assertion {assertion_id}")
    return matches[0].get("actual")


def verify_evidence_provenance(
    program: LoadedProgram, milestone: dict[str, Any], evidence: dict[str, Any]
) -> None:
    required = {
        "schema_version",
        "milestone_id",
        "subject_commit",
        "generated_at",
        "environment",
        "verifier_version",
        "verifier_hashes",
        "predicate_catalog_version",
        "command_hashes",
        "input_hashes",
        "checks",
        "all_required_checks_passed",
    }
    missing = required - set(evidence)
    if missing:
        raise ContractError(f"evidence missing provenance fields {sorted(missing)}")
    if evidence["milestone_id"] != milestone["id"]:
        raise ContractError("evidence milestone_id mismatch")
    if evidence["verifier_version"] != VERIFIER_VERSION:
        raise ContractError("evidence verifier version is stale")
    for relative, expected_hash in evidence["verifier_hashes"].items():
        path = program.root / relative
        if not path.is_file() or sha256_file(path) != expected_hash:
            raise ContractError(f"evidence verifier is missing or stale: {relative}")
    if evidence["predicate_catalog_version"] != PREDICATE_CATALOG_VERSION:
        raise ContractError("evidence predicate catalog is stale")
    if not is_ancestor(program.root, evidence["subject_commit"]):
        raise ContractError("evidence subject_commit is not current HEAD or an ancestor")
    expected_commands = {
        item["id"]: sha256_bytes(item["command"].encode("utf-8"))
        for item in milestone["verification"]["automated"]
    }
    if evidence["command_hashes"] != expected_commands:
        raise ContractError("evidence command hashes do not match registry")
    for relative, expected_hash in evidence["input_hashes"].items():
        path = program.root / relative
        if not path.is_file() or sha256_file(path) != expected_hash:
            raise ContractError(f"evidence input is missing or stale: {relative}")


def evaluate_acceptance(program: LoadedProgram, milestone: dict[str, Any]) -> list[dict[str, Any]]:
    results: list[dict[str, Any]] = []
    artifact: dict[str, Any] | None = None
    evidence: dict[str, Any] | None = None

    for acceptance in milestone["acceptance"]:
        predicate = acceptance["predicate"]
        passed = False
        detail = ""
        try:
            if predicate == "all_artifacts_exist_and_nonempty":
                bad = [
                    item for item in acceptance["inputs"]
                    if not (program.root / item).is_file() or (program.root / item).stat().st_size == 0
                ]
                passed = not bad
                detail = "all artifacts exist and are nonempty" if passed else f"missing/empty: {bad}"
            elif predicate == "current_run_evidence_matches_head":
                evidence = json.loads((program.root / acceptance["evidence"]).read_text(encoding="utf-8"))
                verify_evidence_provenance(program, milestone, evidence)
                passed = all(evidence.get(key) == value for key, value in acceptance["expected"].items())
                detail = "provenance and expected evidence fields match"
            elif predicate == "contract_output_assertion_passes":
                artifact = artifact or milestone_artifact(program, milestone)
                actual = _assertion_actual(artifact, acceptance["assertion_id"])
                expected = milestone["in_scope"][0]
                passed = actual == expected
                detail = "artifact assertion matches registry-owned expected outcome"
            elif predicate == "command_exit_code_equals":
                evidence = evidence or json.loads(
                    (program.root / milestone["artifacts"][1]).read_text(encoding="utf-8")
                )
                actual = evidence["commands"][acceptance["command_id"]]["exit_code"]
                passed = actual == acceptance["expected"]
                detail = f"exit code {actual}"
            elif predicate == "regression_floor_passes":
                evidence = evidence or json.loads(
                    (program.root / milestone["artifacts"][1]).read_text(encoding="utf-8")
                )
                passed = all(evidence["commands"][item]["exit_code"] == 0 for item in acceptance["command_ids"])
                detail = "all declared regression commands exited zero"
            elif predicate == "validation_disposition_is_signed_and_allowed":
                evidence = evidence or json.loads(
                    (program.root / milestone["artifacts"][1]).read_text(encoding="utf-8")
                )
                passed = bool(evidence.get("signatures")) and evidence.get("result_code") in acceptance["allowed_result_codes"]
                detail = "signed validation disposition is allowed"
            elif predicate == "release_eligibility_requires_gate_pass_only":
                evidence = evidence or json.loads(
                    (program.root / milestone["artifacts"][1]).read_text(encoding="utf-8")
                )
                passed = not (
                    evidence.get("result_code") == acceptance["release_result"]
                    and evidence.get("upstream_result_code") != acceptance["required_upstream_result"]
                )
                detail = "release outcome is gated by upstream GATE_PASS"
        except (ContractError, KeyError, OSError, ValueError, json.JSONDecodeError) as error:
            detail = str(error)
            passed = False
        results.append({"id": acceptance["id"], "predicate": predicate, "passed": passed, "detail": detail})
    return results


def evidence_record(
    program: LoadedProgram,
    milestone: dict[str, Any],
    checks: list[dict[str, Any]],
    commands: dict[str, dict[str, Any]] | None = None,
) -> dict[str, Any]:
    input_paths = [
        program.registry_path,
        program.schema_path,
        program.root / "docs/program/predicate_catalog.yaml",
        program.root / milestone["artifacts"][0],
    ]
    verifier_paths = [
        program.root / "tools/program/program_contract.py",
        program.root / "tools/program/run_contract_checks.py",
        program.root / "tools/program/verify_milestone.py",
    ]
    return {
        "schema_version": 1,
        "milestone_id": milestone["id"],
        "subject_commit": git_head(program.root),
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "environment": {
            "platform": platform.platform(),
            "python": platform.python_version(),
            "cwd": str(program.root),
        },
        "verifier_version": VERIFIER_VERSION,
        "verifier_hashes": {
            str(path.relative_to(program.root)).replace("\\", "/"): sha256_file(path)
            for path in verifier_paths
        },
        "predicate_catalog_version": PREDICATE_CATALOG_VERSION,
        "command_hashes": {
            item["id"]: sha256_bytes(item["command"].encode("utf-8"))
            for item in milestone["verification"]["automated"]
        },
        "input_hashes": {
            str(path.relative_to(program.root)).replace("\\", "/"): sha256_file(path)
            for path in input_paths
        },
        "checks": checks,
        "commands": commands or {},
        "all_required_checks_passed": all(item["passed"] for item in checks),
    }


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def print_errors(errors: Iterable[str]) -> None:
    for error in errors:
        print(f"ERROR: {error}", file=sys.stderr)
