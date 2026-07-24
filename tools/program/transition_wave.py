from __future__ import annotations

import argparse
from pathlib import Path

import yaml

from execution_authority import ACTIVE_WAVE, verify_active_wave


WAVE_2 = [
    {"id": "KQ-016", "hours": 6, "worker_id": "W1", "mutation_lane": "A", "sequence": 1},
    {"id": "KQ-017", "hours": 6, "worker_id": "W2", "mutation_lane": "B", "sequence": 1},
    {"id": "KQ-026", "hours": 6, "worker_id": "W1", "mutation_lane": "A", "sequence": 2},
]


def build_active_wave() -> dict:
    value = {
        "schema_version": 2,
        "program_id": "kinematiciq-expanded-10",
        "wave_id": "expanded-10-wave-2",
        "previous_wave": "docs/program/WAVE_1_SCHEDULE.yaml",
        "capacity_hours": 134,
        "committed": [dict(item) for item in WAVE_2],
        "reserved_roles": {
            "W3": "corpus and provenance review",
            "W4": "evidence review, synthesis, and replanning",
        },
        "deferred_ready_ids": ["KQ-056"],
        "promotion_rule": (
            "Only committed, assigned, dependency-valid, resource-ready IDs may mutate; "
            "KQ-056 remains deferred until Phase B data and observability contracts exist."
        ),
    }
    verify_active_wave(value)
    return value


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate or verify the active Wave 2 schedule.")
    parser.add_argument("--output", default=ACTIVE_WAVE.as_posix())
    parser.add_argument("--verify", action="store_true")
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[2]
    output = root / args.output
    expected = build_active_wave()
    if args.verify:
        if not output.is_file():
            print(f"FAIL: {args.output} is missing")
            return 1
        actual = yaml.safe_load(output.read_text(encoding="utf-8"))
        verify_active_wave(actual)
        if actual != expected:
            print(f"FAIL: {args.output} is stale")
            return 1
        print(f"PASS: verified {args.output}")
        return 0
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(
        yaml.safe_dump(expected, sort_keys=False, allow_unicode=True),
        encoding="utf-8",
        newline="\n",
    )
    print(f"PASS: generated {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
