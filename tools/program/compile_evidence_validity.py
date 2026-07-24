from __future__ import annotations

import argparse
import json
from pathlib import Path

import yaml

from evidence_integrity import VALIDITY_PROJECTION, compile_projection, write_json


def main() -> int:
    parser = argparse.ArgumentParser(description="Compile the current evidence-validity projection.")
    parser.add_argument("--output", default=VALIDITY_PROJECTION.as_posix())
    parser.add_argument("--verify", action="store_true")
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[2]
    registry = yaml.safe_load(
        (root / "docs/program/milestone_registry.yaml").read_text(encoding="utf-8")
    )
    projection = compile_projection(root, registry["milestones"])
    output = root / args.output
    if args.verify:
        if not output.is_file() or json.loads(output.read_text(encoding="utf-8")) != projection:
            print(f"FAIL: {args.output} is missing or stale")
            return 1
        print(f"PASS: verified {args.output}")
        return 0
    write_json(output, projection)
    print(f"PASS: generated {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
