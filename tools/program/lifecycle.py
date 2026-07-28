"""Derive milestone completion from evidence instead of storing it.

The registry used to carry ``milestone_status: Passed``, which meant a milestone
was only complete once a human edited the registry after execution. That edit
changed the milestone's contract hash, which staled the record that had just
been produced, and it changed a declared input of KQ-015, which revoked the
whole Phase A chain. Completion was mutable state maintained by hand, so every
closure cost a full reverification cycle.

Here the registry declares *intent* only — planned, blocked, retired, skipped —
and completion is a function of the verified evidence projection. A milestone is
Passed exactly when its evidence is Current. Nothing needs to be written back.

``Passed`` declared in the registry is treated as legacy intent and carries no
authority: a milestone whose evidence is not Current reads as Pending no matter
what the file says. That is the point — the projection is the only thing that
can make something complete.
"""

from __future__ import annotations

from typing import Any, Mapping

# Statuses the registry may legitimately declare. Each records a decision or a
# blocker that no amount of passing evidence should override.
INTENT_STATUSES = frozenset({
    "BlockedExternal",
    "BlockedHuman",
    "Retired",
    "SkippedByDecision",
    "FailedTechnical",
})

# Statuses that mean "this milestone is done" for dependency and scheduling.
COMPLETED_STATUSES = frozenset({"Passed", "SkippedByDecision", "Retired"})

# The only status the registry must never assert for itself.
DERIVED_ONLY_STATUSES = frozenset({"Passed"})


def effective_status(
    milestone: Mapping[str, Any],
    states: Mapping[str, Mapping[str, Any]],
) -> str:
    """Return the milestone's real status given the evidence projection.

    ``states`` is ``compile_projection(...)["states"]``.
    """
    declared = milestone["milestone_status"]
    if declared in INTENT_STATUSES:
        return declared
    state = states.get(milestone["id"])
    if state and state.get("validity") == "Current":
        return "Passed"
    # A registry that still claims Passed without current evidence is not
    # trusted; it reads as outstanding work.
    return "Pending" if declared in DERIVED_ONLY_STATUSES else declared


def effective_statuses(
    milestones: list[Mapping[str, Any]],
    states: Mapping[str, Mapping[str, Any]],
) -> dict[str, str]:
    return {item["id"]: effective_status(item, states) for item in milestones}


def is_complete(
    milestone: Mapping[str, Any],
    states: Mapping[str, Mapping[str, Any]],
) -> bool:
    return effective_status(milestone, states) in COMPLETED_STATUSES
