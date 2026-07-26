from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import yaml

from evidence_integrity import compile_projection, git_output


ACTIVE_WAVE = Path("docs/program/ACTIVE_WAVE.yaml")
EXECUTION_POLICY = Path("docs/program/execution_policy.yaml")


class ExecutionAuthorityError(ValueError):
    pass


def _yaml(path: Path) -> dict[str, Any]:
    return yaml.safe_load(path.read_text(encoding="utf-8"))


def assert_declared_branch(root: Path) -> None:
    """Refuse to produce evidence outside the declared work branch.

    Branch binding used to be enforced only by KQ-007's declared execution
    policy check, so any milestone that did not declare that check could be
    attested from a branch the policy forbids. Making it a precondition of
    evidence generation closes that gap for every milestone.
    """
    policy = _yaml(root / EXECUTION_POLICY)
    declared = policy.get("git", {}).get("work_branch")
    if not declared:
        raise ExecutionAuthorityError("execution policy declares no work branch")
    active = git_output(root, "rev-parse", "--abbrev-ref", "HEAD")
    if active != declared:
        raise ExecutionAuthorityError(
            f"active branch {active} differs from declared work branch {declared}; "
            "evidence cannot be generated off the declared branch"
        )


def dependency_ready_ids(root: Path) -> tuple[list[str], dict[str, list[str]]]:
    registry = _yaml(root / "docs/program/milestone_registry.yaml")
    resources = _yaml(root / "docs/program/resource_registry.yaml")
    projection = compile_projection(root, registry["milestones"])
    milestones = {item["id"]: item for item in registry["milestones"]}
    completed = {
        item["id"]
        for item in registry["milestones"]
        if item["milestone_status"] in {"Passed", "SkippedByDecision", "Retired"}
    }
    if completed - set(projection["summary"]["Current"]):
        return [], {}
    resource_status = {item["id"]: item["status"] for item in resources["resources"]}
    ready: list[str] = []
    blocked: dict[str, list[str]] = {}
    for milestone in registry["milestones"]:
        if milestone["milestone_status"] not in {"Pending", "Ready", "FailedTechnical"}:
            continue
        unresolved_resources = sorted(
            item for item in milestone["resource_dependencies"]
            if resource_status.get(item) != "READY"
        )
        if unresolved_resources:
            blocked[milestone["id"]] = unresolved_resources
            continue
        satisfied = True
        for dependency in milestone["dependencies"]:
            upstream = milestones[dependency["id"]]
            validity = projection["states"].get(dependency["id"], {}).get("validity")
            if (
                upstream["milestone_status"] not in dependency["accepted_milestone_statuses"]
                or validity != "Current"
            ):
                satisfied = False
                break
            accepted_codes = dependency.get("accepted_result_codes")
            if accepted_codes:
                legacy = root / f"docs/status/milestones/{upstream['id']}.json"
                if (
                    not legacy.is_file()
                    or json.loads(legacy.read_text(encoding="utf-8")).get("result_code")
                    not in accepted_codes
                ):
                    satisfied = False
                    break
        if satisfied:
            ready.append(milestone["id"])
    return sorted(ready), blocked


def active_wave(root: Path) -> dict[str, Any]:
    path = root / ACTIVE_WAVE
    if not path.is_file():
        raise ExecutionAuthorityError("ACTIVE_WAVE.yaml is missing")
    value = _yaml(path)
    verify_active_wave(value)
    return value


def verify_active_wave(value: dict[str, Any]) -> None:
    if value.get("schema_version") != 2:
        raise ExecutionAuthorityError("active wave must use schema version 2")
    schedule = value.get("committed", [])
    ids = [item.get("id") for item in schedule]
    if not ids or len(ids) != len(set(ids)):
        raise ExecutionAuthorityError("active wave committed IDs must be nonempty and unique")
    allowed_workers = {"W1", "W2"}
    allowed_lanes = {"A", "B"}
    for item in schedule:
        if item.get("worker_id") not in allowed_workers:
            raise ExecutionAuthorityError(f"{item.get('id')}: missing mutation worker")
        if item.get("mutation_lane") not in allowed_lanes:
            raise ExecutionAuthorityError(f"{item.get('id')}: missing mutation lane")
        if item.get("hours", 0) <= 0:
            raise ExecutionAuthorityError(f"{item.get('id')}: invalid hours")
    if sum(item["hours"] for item in schedule) > value.get("capacity_hours", 0):
        raise ExecutionAuthorityError("active wave exceeds capacity")


def executable_frontier(root: Path) -> dict[str, Any]:
    ready, blocked = dependency_ready_ids(root)
    wave = active_wave(root)
    ready_set = set(ready)
    allowed: list[str] = []
    for worker in ("W1", "W2"):
        for item in wave["committed"]:
            if item["worker_id"] == worker and item["id"] in ready_set:
                allowed.append(item["id"])
                break
    committed_order = [item["id"] for item in wave["committed"]]
    ordered_allowed = [item for item in committed_order if item in allowed]
    return {
        "dependency_ready_ids": ready,
        "committed_wave_ready_ids": [
            item for item in committed_order if item in ready_set
        ],
        "allowed_executable_ids": ordered_allowed,
        "next_executable_id": ordered_allowed[0] if ordered_allowed else None,
        "resource_blocked": blocked,
    }


def assert_executable(root: Path, milestone_id: str) -> None:
    frontier = executable_frontier(root)
    if frontier["next_executable_id"] is None:
        raise ExecutionAuthorityError("execution rejected: next_executable_id is null")
    if milestone_id not in frontier["allowed_executable_ids"]:
        raise ExecutionAuthorityError(
            f"execution rejected: {milestone_id} is not an allowed executable ID; "
            f"allowed={frontier['allowed_executable_ids']}"
        )
