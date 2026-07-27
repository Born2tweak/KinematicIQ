from __future__ import annotations

import hashlib
import json
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "program"))

from verify_corpus_freeze import verify_corpus_freeze  # noqa: E402


def _write_asset(root: Path, name: str, payload: bytes) -> dict:
    path = root / name
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(payload)
    return {
        "id": name.rsplit("/", 1)[-1].split(".")[0],
        "file": name,
        "sha256": hashlib.sha256(payload).hexdigest(),
        "bytes": len(payload),
        "source": "live",
        "consent": "participant-consented",
        "license": "participant consent, internal validation use only",
        "capture": {
            "device": "iPhone 13",
            "fps": 60,
            "resolution": "1920x1080",
            "view": "front",
            "distance_m": 2.5,
        },
        "split": "development",
        "subject_key": "S01",
        "validation_use": "regression",
    }


def _manifest(entries: list[dict]) -> dict:
    return {
        "freeze_id": "squat-golden-v1",
        "protocol_id": "squat",
        "frozen_at": "2026-07-26T00:00:00+00:00",
        "license": "internal validation use only",
        "governance": {
            "accountable_owner": "Andrian Kolliegbo",
            "retention_policy": "retained until the freeze is superseded",
            "privacy_review": "pending",
            "allowed_claims": ["regression stability"],
            "forbidden_claims": ["clinical accuracy"],
        },
        "entries": entries,
    }


class CorpusFreezeGateTests(unittest.TestCase):
    """A corpus freeze must be unsatisfiable without real, checksummed assets."""

    def _run(self, tmp: str, manifest: dict | None) -> dict:
        root = Path(tmp)
        path = root / "eval-tapes/CORPUS_FREEZE.squat.json"
        if manifest is not None:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(json.dumps(manifest), encoding="utf-8")
        return verify_corpus_freeze(root, path, "squat")

    def test_missing_manifest_is_a_res_corpus_blocker_not_a_pass(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            result = self._run(tmp, None)
            self.assertFalse(result["passed"])
            self.assertEqual(result["blocked_on"], "RES-CORPUS")
            self.assertIn("no freeze manifest", result["errors"][0])

    def test_manifest_with_no_recordings_is_a_res_corpus_blocker(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            result = self._run(tmp, _manifest([]))
            self.assertFalse(result["passed"])
            self.assertEqual(result["blocked_on"], "RES-CORPUS")

    def test_declared_asset_that_does_not_exist_fails(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            entry = _write_asset(Path(tmp), "eval-tapes/s01.tape.json", b"frames")
            (Path(tmp) / "eval-tapes/s01.tape.json").unlink()
            result = self._run(tmp, _manifest([entry]))
            self.assertFalse(result["passed"])
            self.assertTrue(any("missing asset" in item for item in result["errors"]))

    def test_checksum_mismatch_fails(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            entry = _write_asset(Path(tmp), "eval-tapes/s01.tape.json", b"frames")
            entry = {**entry, "sha256": "0" * 64}
            result = self._run(tmp, _manifest([entry]))
            self.assertFalse(result["passed"])
            self.assertTrue(any("checksum mismatch" in item for item in result["errors"]))

    def test_missing_license_or_consent_fails(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            entry = _write_asset(Path(tmp), "eval-tapes/s01.tape.json", b"frames")
            result = self._run(tmp, _manifest([{**entry, "license": "  ", "consent": "unknown"}]))
            self.assertFalse(result["passed"])
            self.assertTrue(any("declares no license" in item for item in result["errors"]))
            self.assertTrue(any("unknown consent" in item for item in result["errors"]))

    def test_incomplete_capture_metadata_fails(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            entry = _write_asset(Path(tmp), "eval-tapes/s01.tape.json", b"frames")
            capture = {k: v for k, v in entry["capture"].items() if k != "fps"}
            result = self._run(tmp, _manifest([{**entry, "capture": capture}]))
            self.assertFalse(result["passed"])
            self.assertTrue(any("capture is missing fps" in item for item in result["errors"]))

    def test_missing_governance_fails(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            entry = _write_asset(Path(tmp), "eval-tapes/s01.tape.json", b"frames")
            manifest = _manifest([entry])
            manifest["governance"] = {k: v for k, v in manifest["governance"].items() if k != "privacy_review"}
            result = self._run(tmp, manifest)
            self.assertFalse(result["passed"])
            self.assertTrue(any("governance is missing privacy_review" in item for item in result["errors"]))

    def test_subject_spanning_two_splits_fails(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            first = _write_asset(Path(tmp), "eval-tapes/s01-a.tape.json", b"frames-a")
            second = _write_asset(Path(tmp), "eval-tapes/s01-b.tape.json", b"frames-b")
            result = self._run(tmp, _manifest([first, {**second, "split": "test"}]))
            self.assertFalse(result["passed"])
            self.assertTrue(any("both development and test splits" in item for item in result["errors"]))

    def test_duplicate_entry_ids_fail(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            first = _write_asset(Path(tmp), "eval-tapes/s01-a.tape.json", b"frames-a")
            second = _write_asset(Path(tmp), "eval-tapes/s01-b.tape.json", b"frames-b")
            result = self._run(tmp, _manifest([first, {**second, "id": first["id"]}]))
            self.assertFalse(result["passed"])
            self.assertTrue(any("duplicate entry id" in item for item in result["errors"]))

    def test_a_complete_freeze_passes(self) -> None:
        """The gate must be satisfiable, or it would block the milestone forever."""
        with tempfile.TemporaryDirectory() as tmp:
            first = _write_asset(Path(tmp), "eval-tapes/s01.tape.json", b"frames-a")
            second = _write_asset(Path(tmp), "eval-tapes/s02.tape.json", b"frames-b")
            second = {**second, "subject_key": "S02", "split": "validation"}
            result = self._run(tmp, _manifest([first, second]))
            self.assertEqual(result["errors"], [])
            self.assertTrue(result["passed"])
            self.assertEqual(result["entry_count"], 2)
            self.assertEqual(result["subject_count"], 2)

    def test_protocol_mismatch_fails(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            entry = _write_asset(Path(tmp), "eval-tapes/s01.tape.json", b"frames")
            manifest = _manifest([entry])
            manifest["protocol_id"] = "forward_lunge"
            result = self._run(tmp, manifest)
            self.assertFalse(result["passed"])
            self.assertTrue(any("does not match" in item for item in result["errors"]))


if __name__ == "__main__":
    unittest.main()
