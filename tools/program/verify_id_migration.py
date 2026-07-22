from __future__ import annotations

import argparse
import re
import subprocess
from pathlib import Path

import yaml


class IdMigrationError(ValueError):
    pass


def _tracked(root: Path, path: Path) -> bool:
    relative = path.relative_to(root).as_posix()
    return subprocess.run(["git", "ls-files", "--error-unmatch", relative], cwd=root, capture_output=True).returncode == 0


def verify_manifest(manifest: dict, root: Path, check_git: bool = True) -> None:
    errors: list[str] = []
    rules = manifest.get("rules", {})
    known_decisions: set[str] = set()
    known_evidence: set[str] = set()
    for kind, prefix, stable_prefix, known in (
        ("decisions", "ADR-", "DEC-ADR-", known_decisions),
        ("evidence", "P4-M", "EVD-P4-M", known_evidence),
    ):
        rule = rules.get(kind, {})
        bounds = rule.get("expected_numbers", {})
        for number in range(bounds.get("start", 0), bounds.get("end", -1) + 1):
            width = 3 if kind == "decisions" else 2
            legacy_id = f"{prefix}{number:0{width}d}"
            stable_id = f"{stable_prefix}{number:0{width}d}"
            known.add(stable_id)
            pattern = rule.get("source_glob", "").replace("{number:03d}", f"{number:03d}").replace("{number:02d}", f"{number:02d}")
            matches = list(root.glob(pattern))
            if len(matches) != 1:
                errors.append(f"{legacy_id} must resolve to exactly one source, found {len(matches)}")
            elif not matches[0].is_file() or matches[0].stat().st_size == 0:
                errors.append(f"{legacy_id} source is missing or empty")
            elif check_git and not _tracked(root, matches[0]):
                errors.append(f"{legacy_id} source is not tracked")
        if rule.get("source_glob") is None:
            errors.append(f"{kind} source glob is required")
    if rules.get("source_records_are_immutable") is not True or rules.get("central_mapping_is_additive") is not True:
        errors.append("migration must be additive and preserve source records")

    seen_decisions: set[str] = set()
    referenced_evidence: set[str] = set()
    for link in manifest.get("cross_links", []):
        decision_id = link.get("decision_id")
        if decision_id in seen_decisions:
            errors.append(f"duplicate cross-link decision: {decision_id}")
        seen_decisions.add(decision_id)
        if decision_id not in known_decisions:
            errors.append(f"unknown decision target: {decision_id}")
        for evidence_id in link.get("evidence_ids", []):
            referenced_evidence.add(evidence_id)
            if evidence_id not in known_evidence:
                errors.append(f"unknown evidence target: {evidence_id}")
    if not {f"DEC-ADR-{number:03d}" for number in range(11, 17)} <= seen_decisions:
        errors.append("Phase 4 ADR decisions 011 through 016 require cross-links")
    if referenced_evidence != known_evidence:
        errors.append(f"Phase 4 evidence cross-link coverage mismatch: {sorted(known_evidence - referenced_evidence)}")
    if manifest.get("claims", {}).get("cross_link_means_current_validation") is not False:
        errors.append("cross-links cannot claim current validation")
    if errors:
        raise IdMigrationError("; ".join(errors))


def main() -> int:
    parser = argparse.ArgumentParser(description="Verify stable ADR and Phase 4 evidence ID migration.")
    parser.add_argument("--manifest", required=True)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[2]
    manifest = yaml.safe_load((root / args.manifest).read_text(encoding="utf-8"))
    try:
        verify_manifest(manifest, root)
    except IdMigrationError as error:
        print(f"FAIL: {error}")
        return 1
    print("PASS: mapped 16 ADR decisions and 15 Phase 4 evidence records")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
