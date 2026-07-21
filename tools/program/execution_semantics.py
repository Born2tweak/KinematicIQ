"""Deterministic execution semantics for the Expanded-10 milestone program.

This module deliberately has no repository-write behavior.  It reduces immutable
fixture/state records into a ready queue and per-protocol lifecycle view, while
rejecting state combinations which could accidentally authorize release.
"""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from typing import Any


PASSING_STATUSES = frozenset({"Passed", "SkippedByDecision"})
BLOCKED_STATUSES = frozenset({"BlockedHuman", "BlockedExternal"})
SKIP_DECISION_FIELDS = frozenset(
    {
        "decision_id",
        "authority",
        "rationale",
        "affected_scope",
        "evidence",
        "reconsideration_trigger",
    }
)
STAGE_PRECEDENCE = (
    "Researched",
    "ProtocolLocked",
    "ImplementedInternal",
    "EngineeringComplete",
    "FrozenCandidate",
    "Validated",
)


class SemanticsError(ValueError):
    """Raised when execution state violates the normative semantics contract."""


def _nonempty(value: Any) -> bool:
    if value is None:
        return False
    if isinstance(value, str):
        return bool(value.strip())
    if isinstance(value, (Mapping, Sequence)):
        return bool(value)
    return True


def _validate_skip(milestone: Mapping[str, Any]) -> None:
    if milestone.get("status") != "SkippedByDecision":
        return
    decision = milestone.get("skip_decision")
    if not isinstance(decision, Mapping):
        raise SemanticsError(f"{milestone['id']}: skip requires decision metadata")
    missing = sorted(field for field in SKIP_DECISION_FIELDS if not _nonempty(decision.get(field)))
    if missing:
        raise SemanticsError(f"{milestone['id']}: incomplete skip decision metadata: {', '.join(missing)}")


def _index_milestones(scenario: Mapping[str, Any]) -> dict[str, Mapping[str, Any]]:
    milestones = scenario.get("milestones", [])
    if not isinstance(milestones, Sequence) or isinstance(milestones, (str, bytes)):
        raise SemanticsError("milestones must be a sequence")
    indexed: dict[str, Mapping[str, Any]] = {}
    for milestone in milestones:
        if not isinstance(milestone, Mapping) or not _nonempty(milestone.get("id")):
            raise SemanticsError("every milestone requires an id")
        milestone_id = str(milestone["id"])
        if milestone_id in indexed:
            raise SemanticsError(f"duplicate milestone id: {milestone_id}")
        _validate_skip(milestone)
        indexed[milestone_id] = milestone
    return indexed


def dependency_satisfied(
    consumer: Mapping[str, Any], dependency: Mapping[str, Any], predecessor: Mapping[str, Any]
) -> bool:
    """Return whether one dependency edge is satisfied.

    Blocked inputs are consumable only by an explicitly marked release-disposition
    node.  A technical failure never satisfies an edge.  Skips require complete
    signed decision metadata even when the edge lists that status as acceptable.
    """

    status = predecessor.get("status", "Pending")
    if status == "FailedTechnical":
        return False
    accepted = set(dependency.get("accepted_statuses", ["Passed"]))
    if status == "SkippedByDecision":
        _validate_skip(predecessor)
    if status in PASSING_STATUSES:
        return status in accepted
    return bool(
        status in BLOCKED_STATUSES
        and consumer.get("kind") == "release_disposition"
        and dependency.get("allow_blocked_disposition") is True
        and status in accepted
    )


def ready_queue(scenario: Mapping[str, Any]) -> list[str]:
    """Compute a stable ID-sorted queue of pending milestones whose edges pass."""

    indexed = _index_milestones(scenario)
    ready: list[str] = []
    for milestone_id, milestone in indexed.items():
        if milestone.get("status", "Pending") != "Pending":
            continue
        dependencies = milestone.get("dependencies", [])
        satisfied = True
        for dependency in dependencies:
            predecessor_id = dependency.get("id")
            predecessor = indexed.get(predecessor_id)
            if predecessor is None:
                raise SemanticsError(f"{milestone_id}: unknown dependency {predecessor_id}")
            if not dependency_satisfied(milestone, dependency, predecessor):
                satisfied = False
                break
        if satisfied:
            ready.append(milestone_id)
    return sorted(ready)


def _signed(record: Mapping[str, Any]) -> bool:
    return all(_nonempty(record.get(field)) for field in ("signed_by", "signed_at"))


def _protocol_milestones(
    milestones: Mapping[str, Mapping[str, Any]], protocol_id: str
) -> list[Mapping[str, Any]]:
    return [item for item in milestones.values() if item.get("protocol_id") == protocol_id]


def _valid_release(
    decision: Mapping[str, Any], milestones: Mapping[str, Mapping[str, Any]], protocol_id: str
) -> bool:
    if decision.get("kind") != "release" or decision.get("result_code") != "RELEASE_ELIGIBLE" or not _signed(decision):
        return False
    source_id = decision.get("locked_study_id")
    source = milestones.get(source_id)
    return bool(
        source
        and source.get("protocol_id") == protocol_id
        and source.get("status") == "Passed"
        and source.get("result_code") == "GATE_PASS"
    )


def reduce_protocol(
    protocol: Mapping[str, Any], milestones: Mapping[str, Mapping[str, Any]]
) -> dict[str, Any]:
    """Derive one protocol's lifecycle and orthogonal readiness flags."""

    protocol_id = protocol.get("id")
    if not _nonempty(protocol_id):
        raise SemanticsError("every protocol requires an id")
    related = _protocol_milestones(milestones, str(protocol_id))
    decisions = protocol.get("decisions", [])

    invalidations = [d for d in decisions if d.get("kind") in {"invalidated", "retired"} and _signed(d)]
    release_decisions = [d for d in decisions if d.get("kind") == "release" and _signed(d)]
    invalid_release = [d for d in release_decisions if not _valid_release(d, milestones, str(protocol_id))]
    if invalid_release:
        raise SemanticsError(f"{protocol_id}: ReleaseEligible requires a signed GATE_PASS locked-study input")

    if invalidations:
        lifecycle = "Invalidated" if any(d["kind"] == "invalidated" for d in invalidations) else "Retired"
    elif release_decisions:
        lifecycle = "ReleaseEligible"
    elif any(d.get("kind") == "failed_gate" and _signed(d) for d in decisions):
        lifecycle = "FailedGate"
    else:
        owned_blockers = [
            d
            for d in decisions
            if d.get("kind") in {"BlockedHuman", "BlockedExternal"}
            and d.get("current") is True
            and _nonempty(d.get("owner"))
            and _nonempty(d.get("next_action"))
        ]
        if owned_blockers:
            lifecycle = "BlockedHuman" if any(d["kind"] == "BlockedHuman" for d in owned_blockers) else "BlockedExternal"
        else:
            passed_stages = {
                item.get("stage")
                for item in related
                if item.get("status") == "Passed" and item.get("evidence_bearing") is True
            }
            lifecycle = next((stage for stage in reversed(STAGE_PRECEDENCE) if stage in passed_stages), "Candidate")

    data_ready = any(
        item.get("status") == "Passed" and item.get("stage") == "DataReady" and item.get("evidence_bearing") is True
        for item in related
    )
    engineering_ready = any(
        item.get("status") == "Passed"
        and item.get("stage") == "EngineeringComplete"
        and item.get("evidence_bearing") is True
        for item in related
    )
    validation_ready = bool(data_ready and engineering_ready and protocol.get("preregistration_locked") is True)
    if validation_ready and lifecycle in {"DataReady", "EngineeringComplete"}:
        lifecycle = "ValidationReady"
    return {
        "lifecycle": lifecycle,
        "data_ready": data_ready,
        "engineering_ready": engineering_ready,
        "validation_ready": validation_ready,
    }


def evaluate_scenario(scenario: Mapping[str, Any]) -> dict[str, Any]:
    """Evaluate a complete fixture into deterministic, JSON-compatible output."""

    milestones = _index_milestones(scenario)
    protocols = scenario.get("protocols", [])
    protocol_states = {
        str(protocol["id"]): reduce_protocol(protocol, milestones)
        for protocol in sorted(protocols, key=lambda item: str(item.get("id", "")))
    }
    terminal_dispositions = {
        str(protocol_id): state["lifecycle"]
        for protocol_id, state in protocol_states.items()
        if state["lifecycle"] in {"ReleaseEligible", "FailedGate", "BlockedHuman", "BlockedExternal", "Invalidated", "Retired"}
    }
    return {
        "ready_queue": ready_queue(scenario),
        "protocols": protocol_states,
        "terminal_dispositions": terminal_dispositions,
    }
