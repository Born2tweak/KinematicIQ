from __future__ import annotations

import copy
import sys
import unittest
from pathlib import Path

import yaml


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "program"))
from verify_history_import import HistoryImportError, verify_manifest  # noqa: E402


class HistoryImportTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        with (ROOT / "docs/program/artifacts/kq-005.yaml").open(encoding="utf-8") as handle:
            cls.manifest = yaml.safe_load(handle)

    def test_authoritative_history_import_passes(self) -> None:
        verify_manifest(self.manifest, ROOT)

    def test_not_executed_legacy_gap_cannot_be_promoted(self) -> None:
        manifest = copy.deepcopy(self.manifest)
        gap = next(item for item in manifest["records"] if item.get("start") == 27)
        gap["disposition"] = "historical_scope_complete"
        with self.assertRaisesRegex(HistoryImportError, "M27 must remain historical_not_executed"):
            verify_manifest(manifest, ROOT, check_git=False)

    def test_missing_special_id_fails_closed(self) -> None:
        manifest = copy.deepcopy(self.manifest)
        manifest["records"] = [item for item in manifest["records"] if item.get("ids") != ["M83W"]]
        with self.assertRaisesRegex(HistoryImportError, "historical ID universe mismatch"):
            verify_manifest(manifest, ROOT, check_git=False)

    def test_current_proof_claim_fails_closed(self) -> None:
        manifest = copy.deepcopy(self.manifest)
        manifest["records"][0]["current_behavior_proven"] = True
        with self.assertRaisesRegex(HistoryImportError, "incorrectly claims current proof"):
            verify_manifest(manifest, ROOT, check_git=False)


if __name__ == "__main__":
    unittest.main()
