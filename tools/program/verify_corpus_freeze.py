"""Fail-closed gate for a frozen movement corpus.

A milestone titled "freeze <movement> corpus" must not pass on artifacts alone.
Without this gate KQ-016 and KQ-017 are satisfiable by writing a contract YAML
and a status JSON, which would publish a frozen-corpus claim with no recordings
behind it. This gate makes the claim unsatisfiable until real assets exist,
carry checksums that match, and declare license, consent, capture and
governance metadata.

The gate is deliberately unforgiving about absence: a missing manifest is a
RES-CORPUS blocker, reported as such, and never a pass.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from collections import Counter
from pathlib import Path
from typing import Any

CONSENTS = frozenset({"owner", "participant-consented", "public-stock", "licensed-third-party"})
SOURCES = frozenset({"live", "upload", "stock-video", "partner-capture"})
SPLITS = frozenset({"development", "validation", "test"})
USES = frozenset({"regression", "benchmark", "exploratory"})

ENTRY_FIELDS = (
    "id", "file", "sha256", "bytes", "source", "consent", "license",
    "capture", "split", "subject_key", "validation_use",
)
CAPTURE_FIELDS = ("device", "fps", "resolution", "view", "distance_m")
GOVERNANCE_FIELDS = (
    "accountable_owner", "retention_policy", "privacy_review",
    "allowed_claims", "forbidden_claims",
)

BLOCKER = (
    "RES-CORPUS is unresolved: {detail}. This milestone freezes a corpus and "
    "cannot pass without one. Record the blocker and continue other executable "
    "work; do not synthesise placeholder evidence."
)


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _check_entry(root: Path, index: int, entry: Any) -> list[str]:
    where = f"entries[{index}]"
    if not isinstance(entry, dict):
        return [f"{where} is not an object"]
    errors = [f"{where} is missing {field}" for field in ENTRY_FIELDS if field not in entry]
    if errors:
        return errors
    if entry["consent"] not in CONSENTS:
        errors.append(f"{where} has unknown consent {entry['consent']!r}")
    if entry["source"] not in SOURCES:
        errors.append(f"{where} has unknown source {entry['source']!r}")
    if entry["split"] not in SPLITS:
        errors.append(f"{where} has unknown split {entry['split']!r}")
    if entry["validation_use"] not in USES:
        errors.append(f"{where} has unknown validation_use {entry['validation_use']!r}")
    if not str(entry["license"]).strip():
        errors.append(f"{where} declares no license")
    if not str(entry["subject_key"]).strip():
        errors.append(f"{where} declares no subject_key, so split leakage cannot be checked")
    capture = entry["capture"]
    if not isinstance(capture, dict):
        errors.append(f"{where}.capture is not an object")
    else:
        errors.extend(
            f"{where}.capture is missing {field}"
            for field in CAPTURE_FIELDS if field not in capture
        )
    asset = root / entry["file"]
    if not asset.is_file():
        errors.append(f"{where} references a missing asset: {entry['file']}")
        return errors
    actual = _sha256(asset)
    if actual != entry["sha256"]:
        errors.append(
            f"{where} checksum mismatch for {entry['file']}: "
            f"declared {entry['sha256'][:12]}, actual {actual[:12]}"
        )
    size = asset.stat().st_size
    if size != entry["bytes"]:
        errors.append(f"{where} size mismatch for {entry['file']}: declared {entry['bytes']}, actual {size}")
    return errors


def _check_governance(manifest: dict[str, Any]) -> list[str]:
    governance = manifest.get("governance")
    if not isinstance(governance, dict):
        return ["governance is missing or is not an object"]
    errors = [
        f"governance is missing {field}"
        for field in GOVERNANCE_FIELDS if field not in governance
    ]
    for field in ("allowed_claims", "forbidden_claims"):
        value = governance.get(field)
        if field in governance and (not isinstance(value, list) or not value):
            errors.append(f"governance.{field} must be a non-empty list")
    return errors


def _check_splits(entries: list[dict[str, Any]]) -> list[str]:
    """A subject in two splits leaks between them and invalidates any benchmark."""
    seen: dict[str, str] = {}
    errors: list[str] = []
    for entry in entries:
        subject = entry.get("subject_key")
        split = entry.get("split")
        if not isinstance(subject, str) or not isinstance(split, str):
            continue
        if subject in seen and seen[subject] != split:
            errors.append(
                f"subject {subject!r} appears in both {seen[subject]} and {split} splits"
            )
        seen.setdefault(subject, split)
    return errors


def verify_corpus_freeze(root: Path, manifest_path: Path, protocol_id: str) -> dict[str, Any]:
    if not manifest_path.is_file():
        return {
            "passed": False,
            "blocked_on": "RES-CORPUS",
            "errors": [BLOCKER.format(
                detail=f"no freeze manifest at {manifest_path.as_posix()}"
            )],
        }
    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except (OSError, ValueError) as error:
        return {"passed": False, "blocked_on": None, "errors": [f"manifest is unreadable: {error}"]}
    if not isinstance(manifest, dict):
        return {"passed": False, "blocked_on": None, "errors": ["manifest is not an object"]}

    errors: list[str] = []
    for field in ("freeze_id", "protocol_id", "frozen_at", "license", "governance", "entries"):
        if field not in manifest:
            errors.append(f"manifest is missing {field}")
    if manifest.get("protocol_id") != protocol_id:
        errors.append(
            f"manifest protocol_id {manifest.get('protocol_id')!r} does not match {protocol_id!r}"
        )
    errors.extend(_check_governance(manifest))

    entries = manifest.get("entries")
    if not isinstance(entries, list) or not entries:
        errors.append(BLOCKER.format(detail="the freeze manifest declares no recordings"))
        return {"passed": False, "blocked_on": "RES-CORPUS", "errors": errors}

    for index, entry in enumerate(entries):
        errors.extend(_check_entry(root, index, entry))
    objects = [item for item in entries if isinstance(item, dict)]
    for field in ("id", "sha256"):
        duplicates = sorted(
            value for value, count in Counter(
                item.get(field) for item in objects
            ).items() if count > 1 and value is not None
        )
        if duplicates:
            errors.append(f"duplicate entry {field}: {duplicates}")
    errors.extend(_check_splits(objects))

    return {
        "passed": not errors,
        "blocked_on": None,
        "errors": errors,
        "entry_count": len(entries),
        "subject_count": len({item.get("subject_key") for item in objects}),
        "manifest_sha256": _sha256(manifest_path),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Verify a frozen movement corpus.")
    parser.add_argument("--protocol", required=True)
    parser.add_argument("--manifest", required=True)
    parser.add_argument("--evidence-out")
    args = parser.parse_args()

    root = Path(__file__).resolve().parents[2]
    result = verify_corpus_freeze(root, root / args.manifest, args.protocol)
    payload = {
        "protocol_id": args.protocol,
        "manifest": args.manifest,
        **result,
    }
    if args.evidence_out:
        out = root / args.evidence_out
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(
            json.dumps(payload, indent=2, sort_keys=True) + "\n",
            encoding="utf-8",
            newline="\n",
        )
    print(json.dumps(payload, indent=2, sort_keys=True))
    return 0 if result["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
