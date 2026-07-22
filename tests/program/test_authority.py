from __future__ import annotations

import copy
import sys
import tempfile
import unittest
from pathlib import Path

import yaml


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "program"))
from verify_authority import AuthorityError, verify_manifest  # noqa: E402


class AuthorityTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.manifest = yaml.safe_load((ROOT / "docs/program/artifacts/kq-011.yaml").read_text(encoding="utf-8"))

    def test_authoritative_manifest_passes(self) -> None:
        verify_manifest(self.manifest, ROOT)

    def test_overlap_fails_closed(self) -> None:
        manifest = copy.deepcopy(self.manifest)
        manifest["historical_documents"].append(manifest["current_authorities"][0])
        with self.assertRaisesRegex(AuthorityError, "overlap"):
            verify_manifest(manifest, ROOT)

    def test_missing_notice_fails_closed(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "current.md").write_text("current", encoding="utf-8")
            (root / "old.md").write_text("old roadmap", encoding="utf-8")
            manifest = {"notice": "HISTORICAL AUTHORITY NOTICE", "notice_scan_lines": 12, "current_authorities": ["current.md"], "historical_documents": ["old.md"]}
            with self.assertRaisesRegex(AuthorityError, "notice missing"):
                verify_manifest(manifest, root)


if __name__ == "__main__":
    unittest.main()
