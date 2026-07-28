"""Close a verified milestone through the normal execution path.

Before this module, only ``migrate_phase_a_evidence.py`` could move a milestone
to ``Current``, and it is hardcoded to KQ-001..KQ-015. ``run_contract_checks.py``
wrote an immutable v2 record but never wrote its declared ``--evidence-out``
status artifact and never appended a validity event, so ``compile_projection``
returned nothing for any newly executed milestone and its acceptance predicates
failed on a file no tool produced. This closes that gap for every registered
milestone without extending the Phase A workaround.

Ordering is the safety property. Everything before the validity-event append is
derived state that a rerun recomputes; the single-line append is the commit
point; everything after is idempotent refresh. An interruption therefore either
leaves the milestone un-closed (rerun closes it) or closed with possibly stale
projections (rerun refreshes them). No interruption can produce a milestone that
is ``Current`` without a verified record behind it.
"""

from __future__ import annotations

import argparse
import json
import os
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from evidence_integrity import (
    VALIDITY_LOG,
    compile_projection,
    latest_records_by_milestone,
    load_events,
    load_records,
    verify_record,
    write_json,
)
from compile_status import compile_status
from generate_checkpoint import compile_checkpoint
from program_contract import LoadedProgram, git_output


class FinalizationError(RuntimeError):
    """Raised when a milestone cannot be closed. Always fails closed."""


TERMINAL_STATUSES = {"Passed"}


def _atomic_write_json(path: Path, value: Any) -> None:
    """Write via temp file + replace so a crash cannot leave a partial file."""
    path.parent.mkdir(parents=True, exist_ok=True)
    handle = tempfile.NamedTemporaryFile(
        "w", encoding="utf-8", newline="\n", dir=path.parent, delete=False, suffix=".tmp"
    )
    try:
        with handle:
            json.dump(value, handle, indent=2, sort_keys=True)
            handle.write("\n")
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(handle.name, path)
    except BaseException:
        Path(handle.name).unlink(missing_ok=True)
        raise


def _append_event(path: Path, event: dict) -> None:
    """Append one event and fsync. This is the commit point."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8", newline="\n") as handle:
        handle.write(json.dumps(event, sort_keys=True) + "\n")
        handle.flush()
        os.fsync(handle.fileno())


def _refresh_projections(root: Path, milestones: list[dict]) -> None:
    from evidence_integrity import VALIDITY_PROJECTION

    write_json(root / VALIDITY_PROJECTION, compile_projection(root, milestones))
    write_json(root / "docs/status/program_status.json", compile_status(root))
    write_json(root / "docs/status/program_checkpoint.json", compile_checkpoint(root))


def _dependency_states(
    program: LoadedProgram, milestone: dict, projection: dict
) -> list[str]:
    """Reject closure when any dependency is not itself currently evidenced."""
    problems: list[str] = []
    for dependency in milestone["dependencies"]:
        dep_id = dependency["id"]
        dep = program.by_id.get(dep_id)
        if dep is None:
            problems.append(f"{dep_id}: not in registry")
            continue
        accepted = dependency.get("accepted_milestone_statuses") or list(TERMINAL_STATUSES)
        if dep["milestone_status"] not in accepted:
            problems.append(
                f"{dep_id}: status={dep['milestone_status']} not in {accepted}"
            )
            continue
        state = projection["states"].get(dep_id)
        if not state or state["validity"] != "Current":
            validity = state["validity"] if state else "no evidence"
            problems.append(f"{dep_id}: evidence={validity}")
    return problems


def finalize(
    program: LoadedProgram,
    milestone: dict,
    evidence_out: str,
) -> dict[str, Any]:
    """Close ``milestone``, or raise. Safe to call repeatedly.

    Returns a summary describing whether this call performed the transition or
    found it already done.
    """
    root = program.root
    milestone_id = milestone["id"]

    record = latest_records_by_milestone(root).get(milestone_id)
    if record is None:
        raise FinalizationError(
            f"{milestone_id}: no evidence record; run contract checks first"
        )

    # Commit-bound: evidence must describe the tree being closed.
    head = git_output(root, "rev-parse", "HEAD")
    if record["subject_commit"] != head:
        raise FinalizationError(
            f"{milestone_id}: evidence subject_commit {record['subject_commit'][:12]} "
            f"is not HEAD {head[:12]}; commit the scope and re-run the checks"
        )

    if not record.get("all_required_checks_passed"):
        raise FinalizationError(
            f"{milestone_id}: evidence records failed checks and cannot be closed"
        )

    records = load_records(root)
    errors = verify_record(root, milestone, record, records)
    if errors:
        raise FinalizationError(f"{milestone_id}: invalid evidence: {'; '.join(errors)}")

    projection = compile_projection(root, program.milestones)
    problems = _dependency_states(program, milestone, projection)
    if problems:
        raise FinalizationError(
            f"{milestone_id}: unmet dependency evidence: {'; '.join(problems)}"
        )

    state = projection["states"].get(milestone_id)
    already = bool(
        state
        and state["validity"] == "Current"
        and state["evidence_id"] == record["evidence_id"]
    )

    # Derived state first: recomputable, so an interruption here is harmless.
    _atomic_write_json(root / evidence_out, record)

    if not already:
        event_id = f"VAL-{record['evidence_id'].upper()}-CURRENT"
        existing = {event["event_id"] for event in load_events(root)}
        if event_id not in existing:
            prior = state["validity"] if state else None
            _append_event(root / VALIDITY_LOG, {
                "event_id": event_id,
                "milestone_id": milestone_id,
                "evidence_id": (
                    state["evidence_id"] if state else record["evidence_id"]
                ),
                "replacement_evidence_id": record["evidence_id"],
                "from": prior,
                "to": "Current",
                "trigger": "live_verification_pass",
                "rationale": (
                    "Evidence schema v2 provenance and all declared milestone "
                    "checks passed on the normal execution path."
                ),
                "affected_scope": record["scope"]["paths"],
                "recorded_at": datetime.now(timezone.utc).isoformat(),
            })

    _refresh_projections(root, program.milestones)

    # Verify the state we just claimed, rather than assuming the write worked.
    final = compile_projection(root, program.milestones)["states"].get(milestone_id)
    if not final or final["validity"] != "Current":
        raise FinalizationError(
            f"{milestone_id}: closure did not produce Current evidence "
            f"(got {final['validity'] if final else 'nothing'})"
        )
    if final["evidence_id"] != record["evidence_id"]:
        raise FinalizationError(
            f"{milestone_id}: projection points at {final['evidence_id']}, "
            f"expected {record['evidence_id']}"
        )
    return {
        "milestone_id": milestone_id,
        "evidence_id": record["evidence_id"],
        "already_current": already,
        "evidence_out": evidence_out,
    }


def main() -> int:
    from program_contract import load_program

    parser = argparse.ArgumentParser(description="Close a verified milestone.")
    parser.add_argument("--id", required=True, dest="milestone_id")
    parser.add_argument("--registry", default="docs/program/milestone_registry.yaml")
    parser.add_argument("--schema", default="docs/program/milestone_schema.yaml")
    parser.add_argument("--evidence-out")
    args = parser.parse_args()

    program = load_program(args.registry, args.schema)
    milestone = program.by_id.get(args.milestone_id)
    if milestone is None:
        print(f"FAIL: unknown milestone {args.milestone_id}")
        return 1
    evidence_out = args.evidence_out or milestone["artifacts"][1]
    try:
        summary = finalize(program, milestone, evidence_out)
    except FinalizationError as error:
        print(f"FAIL: {error}")
        return 1
    verb = "already current" if summary["already_current"] else "closed"
    print(f"PASS: {summary['milestone_id']} {verb} -> {summary['evidence_id']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
