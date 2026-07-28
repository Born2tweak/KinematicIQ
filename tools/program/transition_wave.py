from __future__ import annotations

import argparse
from pathlib import Path

import yaml

from execution_authority import ACTIVE_WAVE, verify_active_wave


# Wave 3 commits the corpus-independent Phase B engineering program.
#
# Lane A (W1) carries the protocol package and runtime; lane B (W2) carries the
# ingestion spine. The two lanes touch disjoint trees until they converge on the
# result shape, so they can mutate in parallel. Sequence numbers encode the
# dependency order inside each lane; cross-lane order is enforced by the registry
# dependencies, not by this file.
#
# KQ-016, KQ-017 and KQ-176 are deliberately absent: they are BlockedExternal on
# RES-CORPUS and cannot be committed to a wave. KQ-035 here is the engineering
# parity gate only.
WAVE_3 = [
    # Lane B - ingestion spine
    {"id": "KQ-018", "hours": 6, "worker_id": "W2", "mutation_lane": "B", "sequence": 1},
    {"id": "KQ-019", "hours": 6, "worker_id": "W2", "mutation_lane": "B", "sequence": 2},
    {"id": "KQ-020", "hours": 6, "worker_id": "W2", "mutation_lane": "B", "sequence": 3},
    {"id": "KQ-021", "hours": 6, "worker_id": "W2", "mutation_lane": "B", "sequence": 4},
    {"id": "KQ-022", "hours": 6, "worker_id": "W2", "mutation_lane": "B", "sequence": 5},
    {"id": "KQ-023", "hours": 6, "worker_id": "W2", "mutation_lane": "B", "sequence": 6},
    {"id": "KQ-024", "hours": 6, "worker_id": "W2", "mutation_lane": "B", "sequence": 7},
    {"id": "KQ-025", "hours": 6, "worker_id": "W2", "mutation_lane": "B", "sequence": 8},
    # Lane A - shared protocol package and runtime
    {"id": "KQ-026", "hours": 6, "worker_id": "W1", "mutation_lane": "A", "sequence": 1},
    {"id": "KQ-027", "hours": 6, "worker_id": "W1", "mutation_lane": "A", "sequence": 2},
    {"id": "KQ-028", "hours": 6, "worker_id": "W1", "mutation_lane": "A", "sequence": 3},
    {"id": "KQ-029", "hours": 6, "worker_id": "W1", "mutation_lane": "A", "sequence": 4},
    {"id": "KQ-030", "hours": 6, "worker_id": "W1", "mutation_lane": "A", "sequence": 5},
    {"id": "KQ-031", "hours": 6, "worker_id": "W1", "mutation_lane": "A", "sequence": 6},
    {"id": "KQ-032", "hours": 6, "worker_id": "W1", "mutation_lane": "A", "sequence": 7},
    {"id": "KQ-033", "hours": 6, "worker_id": "W1", "mutation_lane": "A", "sequence": 8},
    {"id": "KQ-034", "hours": 6, "worker_id": "W1", "mutation_lane": "A", "sequence": 9},
    # Convergence - squat and lunge parity proven in the browser
    {"id": "KQ-035", "hours": 8, "worker_id": "W1", "mutation_lane": "A", "sequence": 10},
]


def build_active_wave() -> dict:
    value = {
        "schema_version": 2,
        "program_id": "kinematiciq-expanded-10",
        "wave_id": "expanded-10-wave-3",
        "previous_wave": "docs/program/ACTIVE_WAVE.yaml",
        "capacity_hours": 134,
        "committed": [dict(item) for item in WAVE_3],
        "reserved_roles": {
            "W3": "corpus and provenance review",
            "W4": "evidence review, synthesis, and replanning",
        },
        "deferred_ready_ids": ["KQ-056"],
        "promotion_rule": (
            "Only committed, assigned, dependency-valid, resource-ready IDs may mutate; "
            "KQ-056 remains deferred until Phase B data and observability contracts exist. "
            "KQ-016, KQ-017 and KQ-176 are excluded because they are BlockedExternal on "
            "RES-CORPUS; no engineering milestone in this wave may assert dataset parity, "
            "accuracy, reliability, or generalization."
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
