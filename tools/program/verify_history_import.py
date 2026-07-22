from __future__ import annotations

import argparse
import subprocess
from pathlib import Path

import yaml


ALLOWED_DISPOSITIONS = {
    "historical_scope_complete",
    "historical_scope_complete_with_external_gate_open",
    "historical_engineering_complete_with_human_gate_open",
    "historical_partial",
    "historical_blocked",
    "historical_fail_closed_disposition",
    "historical_not_executed",
}


class HistoryImportError(ValueError):
    pass


def _ids(record: dict[str, object]) -> list[str]:
    if "ids" in record:
        return list(record["ids"])
    prefix = record["prefix"]
    return [f"{prefix}{value:02d}" for value in range(record["start"], record["end"] + 1)]


def _git_ok(root: Path, *args: str) -> bool:
    return subprocess.run(["git", *(str(item) for item in args)], cwd=root, capture_output=True).returncode == 0


def verify_manifest(manifest: dict[str, object], root: Path, check_git: bool = True) -> None:
    errors: list[str] = []
    if manifest.get("history_mode") != "retained_historical_evidence":
        errors.append("history_mode must retain historical evidence")
    if manifest.get("reexecution_performed") is not False or manifest.get("current_behavior_proven") is not False:
        errors.append("history import cannot claim reexecution or current behavior")

    source_sets = {item["id"]: item for item in manifest.get("source_sets", [])}
    resolved_sources: set[Path] = set()
    for source_set in source_sets.values():
        for pattern in source_set.get("globs", []):
            matches = list(root.glob(pattern))
            if not matches:
                errors.append(f"source glob matched nothing: {pattern}")
            resolved_sources.update(matches)
        for relative in source_set.get("paths", []):
            resolved_sources.add(root / relative)
    for source in resolved_sources:
        relative = source.relative_to(root).as_posix()
        if not source.is_file() or source.stat().st_size == 0:
            errors.append(f"missing or empty historical source: {relative}")
        elif check_git and not _git_ok(root, "ls-files", "--error-unmatch", relative):
            errors.append(f"historical source is not tracked: {relative}")

    imported: list[str] = []
    for record in manifest.get("records", []):
        record_ids = _ids(record)
        imported.extend(record_ids)
        if record.get("disposition") not in ALLOWED_DISPOSITIONS:
            errors.append(f"unknown historical disposition: {record.get('disposition')}")
        if record.get("current_behavior_proven", False) or record.get("reexecution_performed", False):
            errors.append(f"record {record_ids[0]} incorrectly claims current proof")
        for source_set_id in record.get("source_sets", []):
            if source_set_id not in source_sets:
                errors.append(f"record {record_ids[0]} references unknown source set {source_set_id}")
        if record.get("disposition") != "historical_scope_complete" and not record.get("open_gates"):
            errors.append(f"qualified record {record_ids[0]} requires an open gate or gap")
        if check_git:
            for commit in record.get("commits", []):
                if not _git_ok(root, "cat-file", "-e", f"{commit}^{{commit}}"):
                    errors.append(f"missing historical commit: {commit}")
                elif not _git_ok(root, "merge-base", "--is-ancestor", commit, "HEAD"):
                    errors.append(f"historical commit is not an ancestor: {commit}")

    expected = {f"M{value:02d}" for value in range(116)} | {"M83W"} | {
        f"P4-M{value:02d}" for value in range(15)
    }
    duplicates = sorted({item for item in imported if imported.count(item) > 1})
    if duplicates:
        errors.append(f"duplicate historical IDs: {duplicates}")
    if set(imported) != expected:
        errors.append(f"historical ID universe mismatch; missing={sorted(expected - set(imported))}, extra={sorted(set(imported) - expected)}")
    dispositions = {item: record["disposition"] for record in manifest.get("records", []) for item in _ids(record)}
    for item in ("M27", "M28", "M29", "M30"):
        if dispositions.get(item) != "historical_not_executed":
            errors.append(f"{item} must remain historical_not_executed")
    if dispositions.get("P4-M14") != "historical_fail_closed_disposition":
        errors.append("P4-M14 must remain a fail-closed historical disposition")
    if manifest.get("availability_preserved", {}).get("available") != ["squat"]:
        errors.append("history import must preserve squat-only availability")
    if errors:
        raise HistoryImportError("; ".join(errors))


def main() -> int:
    parser = argparse.ArgumentParser(description="Verify the retained legacy milestone history import.")
    parser.add_argument("--manifest", required=True)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[2]
    with (root / args.manifest).open(encoding="utf-8") as handle:
        manifest = yaml.safe_load(handle)
    try:
        verify_manifest(manifest, root)
    except HistoryImportError as error:
        print(f"FAIL: {error}")
        return 1
    print(f"PASS: retained {len(manifest['records'])} bounded groups across the exact legacy ID universe")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
