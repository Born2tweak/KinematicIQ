from __future__ import annotations

import argparse
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

from evidence_integrity import (
    VALIDITY_LOG,
    latest_records_by_milestone,
    load_events,
)


def _append_event(path: Path, event: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8", newline="\n") as handle:
        handle.write(json.dumps(event, sort_keys=True) + "\n")


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Reverify Phase A into immutable evidence schema v2."
    )
    parser.add_argument("--through", type=int, choices=range(1, 16), default=15)
    parser.add_argument("--command-cache", required=True)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[2]
    log_path = root / VALIDITY_LOG
    existing_events = {event["event_id"] for event in load_events(root)}
    for number in range(1, args.through + 1):
        milestone_id = f"KQ-{number:03d}"
        migration_event = f"VAL-{milestone_id}-LEGACY-MIGRATION"
        current_event = f"VAL-{milestone_id}-V2-CURRENT"
        if current_event in existing_events:
            continue
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
        if migration_event not in existing_events:
            _append_event(log_path, {
                "event_id": migration_event,
                "milestone_id": milestone_id,
                "evidence_id": f"legacy:{milestone_id}",
                "from": None,
                "to": "ReverificationRequired",
                "trigger": "evidence_schema_v2_migration",
                "rationale": (
                    "Legacy evidence is preserved as history but cannot satisfy current dependencies."
                ),
                "affected_scope": ["milestone_evidence", "downstream_dependencies"],
                "recorded_at": now,
            })
            existing_events.add(migration_event)
        _append_event(log_path, {
            "event_id": current_event,
            "milestone_id": milestone_id,
            "evidence_id": f"legacy:{milestone_id}",
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
        print(f"PASS: migrated {milestone_id} -> {record['evidence_id']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
