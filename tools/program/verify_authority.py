from __future__ import annotations

import argparse
from pathlib import Path

import yaml


class AuthorityError(ValueError):
    pass


def verify_manifest(manifest: dict, root: Path) -> None:
    errors: list[str] = []
    current = manifest.get("current_authorities", [])
    historical = manifest.get("historical_documents", [])
    if set(current) & set(historical):
        errors.append("current and historical authority sets overlap")
    for relative in current:
        path = root / relative
        if not path.is_file() or path.stat().st_size == 0:
            errors.append(f"missing current authority: {relative}")
    notice = manifest.get("notice")
    scan_lines = manifest.get("notice_scan_lines", 12)
    required_targets = ["KINEMATICIQ_MASTER_EXECUTION_ROADMAP.md", "milestone_registry.yaml", "program_status.json"]
    for relative in historical:
        path = root / relative
        if not path.is_file():
            errors.append(f"missing historical document: {relative}")
            continue
        opening = "\n".join(path.read_text(encoding="utf-8").splitlines()[:scan_lines])
        if notice not in opening:
            errors.append(f"historical authority notice missing: {relative}")
        for target in required_targets:
            if target not in opening:
                errors.append(f"historical notice does not name {target}: {relative}")
    if errors:
        raise AuthorityError("; ".join(errors))


def main() -> int:
    parser = argparse.ArgumentParser(description="Verify current and historical repository authority markers.")
    parser.add_argument("--manifest", required=True)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[2]
    manifest = yaml.safe_load((root / args.manifest).read_text(encoding="utf-8"))
    try:
        verify_manifest(manifest, root)
    except AuthorityError as error:
        print(f"FAIL: {error}")
        return 1
    print(f"PASS: verified {len(manifest['current_authorities'])} current and {len(manifest['historical_documents'])} historical authorities")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
