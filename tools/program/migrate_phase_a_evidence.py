from __future__ import annotations

import argparse
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

from evidence_integrity import (
    VALIDITY_LOG,
    VALIDITY_PROJECTION,
    compile_projection,
    latest_records_by_milestone,
    load_events,
    write_json,
)
from compile_status import compile_status
from generate_checkpoint import compile_checkpoint
from program_contract import load_program


def _append_event(path: Path, event: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8", newline="\n") as handle:
        handle.write(json.dumps(event, sort_keys=True) + "\n")


def _refresh_generated_state(root: Path, milestones: list[dict]) -> None:
    write_json(root / VALIDITY_PROJECTION, compile_projection(root, milestones))
    write_json(root / "docs/status/program_status.json", compile_status(root))
    write_json(root / "docs/status/program_checkpoint.json", compile_checkpoint(root))


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Reverify Phase A into immutable evidence schema v2."
    )
    parser.add_argument("--through", type=int, choices=range(1, 16), default=15)
    parser.add_argument("--command-cache", required=True)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[2]
    log_path = root / VALIDITY_LOG
    events = load_events(root)
    existing_events = {event["event_id"] for event in events}
    event_states: dict[str, str | None] = {}
    for event in events:
        event_states[event["milestone_id"]] = event["to"]
    program = load_program(
        "docs/program/milestone_registry.yaml",
        "docs/program/milestone_schema.yaml",
        root,
    )
    projection = compile_projection(root, program.milestones)
    for number in range(1, args.through + 1):
        milestone_id = f"KQ-{number:03d}"
        if milestone_id in {"KQ-009", "KQ-013"}:
            _refresh_generated_state(root, program.milestones)
        migration_event = f"VAL-{milestone_id}-LEGACY-MIGRATION"
        if projection["states"].get(milestone_id, {}).get("validity") == "Current":
            continue
        prior_state = event_states.get(milestone_id)
        if prior_state != "ReverificationRequired":
            now = datetime.now(timezone.utc).isoformat()
            reverify_event = (
                migration_event if prior_state is None
                else f"VAL-{milestone_id}-REVERIFY-{now.replace(':', '').replace('+', '-')}"
            )
            if reverify_event not in existing_events:
                _append_event(log_path, {
                    "event_id": reverify_event,
                    "milestone_id": milestone_id,
                    "evidence_id": (
                        f"legacy:{milestone_id}"
                        if prior_state is None
                        else projection["states"][milestone_id]["evidence_id"]
                    ),
                    "from": prior_state,
                    "to": "ReverificationRequired",
                    "trigger": (
                        "evidence_schema_v2_migration"
                        if prior_state is None
                        else "live_provenance_validation_failed"
                    ),
                    "rationale": (
                        "Legacy evidence is preserved as history but cannot satisfy current dependencies."
                        if prior_state is None
                        else "Previously current evidence no longer matches the live controller scope."
                    ),
                    "affected_scope": ["milestone_evidence", "downstream_dependencies"],
                    "recorded_at": now,
                })
                existing_events.add(reverify_event)
                event_states[milestone_id] = "ReverificationRequired"
        command = [
            sys.executable,
            "tools/program/run_contract_checks.py",
            "--id",
            milestone_id,
            "--evidence-out",
            f"docs/status/milestones/{milestone_id}.json",
            "--execute-declared",
            "--bootstrap-repair",
            "--command-cache",
            args.command_cache,
        ]
        result = subprocess.run(command, cwd=root)
        if result.returncode:
            return result.returncode
        record = latest_records_by_milestone(root)[milestone_id]
        now = datetime.now(timezone.utc).isoformat()
        current_event = f"VAL-{record['evidence_id']}-CURRENT"
        _append_event(log_path, {
            "event_id": current_event,
            "milestone_id": milestone_id,
            "evidence_id": (
                f"legacy:{milestone_id}"
                if prior_state is None
                else projection["states"][milestone_id]["evidence_id"]
            ),
            "replacement_evidence_id": record["evidence_id"],
            "from": "ReverificationRequired",
            "to": "Current",
            "trigger": "live_reverification_pass",
            "rationale": (
                "Evidence schema v2 provenance and all declared milestone checks passed."
            ),
            "affected_scope": record["scope"]["paths"],
            "recorded_at": now,
        })
        existing_events.add(current_event)
        event_states[milestone_id] = "Current"
        print(f"PASS: migrated {milestone_id} -> {record['evidence_id']}")
    _refresh_generated_state(root, program.milestones)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
