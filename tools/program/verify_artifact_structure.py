from __future__ import annotations

import argparse
from pathlib import Path

import yaml


class ArtifactStructureError(ValueError):
    pass


def verify_manifest(manifest: dict[str, object], root: Path) -> None:
    errors: list[str] = []
    required_paths = manifest.get("required_paths", [])
    if not isinstance(required_paths, list) or not required_paths:
        errors.append("required_paths must be a nonempty list")
        required_paths = []

    roles: set[str] = set()
    for item in required_paths:
        if not isinstance(item, dict):
            errors.append("required_paths entries must be objects")
            continue
        relative = item.get("path")
        kind = item.get("kind")
        role = item.get("role")
        if not isinstance(relative, str) or not isinstance(role, str):
            errors.append("required path entries need string path and role")
            continue
        if role in roles:
            errors.append(f"duplicate required role: {role}")
        roles.add(role)
        target = root / relative
        if kind == "directory" and not target.is_dir():
            errors.append(f"missing required directory: {relative}")
        elif kind == "file" and not target.is_file():
            errors.append(f"missing required file: {relative}")
        elif kind not in {"directory", "file"}:
            errors.append(f"unsupported path kind for {relative}: {kind}")
        for entry in item.get("required_entries", []):
            if not (target / entry).exists():
                errors.append(f"missing required entry: {relative}/{entry}")

    if roles != {"control", "research", "validation", "status"}:
        errors.append("required roles must be exactly control, research, validation, and status")

    authority_ids: set[str] = set()
    authority_paths: set[str] = set()
    for item in manifest.get("canonical_authorities", []):
        authority_id = item.get("id")
        relative = item.get("path")
        if authority_id in authority_ids:
            errors.append(f"duplicate authority id: {authority_id}")
        if relative in authority_paths:
            errors.append(f"duplicate authority path: {relative}")
        authority_ids.add(authority_id)
        authority_paths.add(relative)
        if not isinstance(relative, str) or not (root / relative).is_file():
            errors.append(f"missing canonical authority: {relative}")

    for relative in manifest.get("prohibited_competing_paths", []):
        if (root / relative).exists():
            errors.append(f"competing authority exists: {relative}")

    if errors:
        raise ArtifactStructureError("; ".join(errors))


def main() -> int:
    parser = argparse.ArgumentParser(description="Verify canonical Expanded-10 artifact paths.")
    parser.add_argument("--manifest", required=True)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[2]
    manifest_path = root / args.manifest
    with manifest_path.open(encoding="utf-8") as handle:
        manifest = yaml.safe_load(handle)
    try:
        verify_manifest(manifest, root)
    except ArtifactStructureError as error:
        print(f"FAIL: {error}")
        return 1
    print(f"PASS: verified {args.manifest}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
