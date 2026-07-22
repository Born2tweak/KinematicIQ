from __future__ import annotations

import copy
import sys
import unittest
from pathlib import Path

import yaml


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "program"))
from verify_id_migration import IdMigrationError, verify_manifest  # noqa: E402


class IdMigrationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.manifest = yaml.safe_load((ROOT / "docs/program/artifacts/kq-006.yaml").read_text(encoding="utf-8"))

    def test_authoritative_migration_passes(self) -> None:
        verify_manifest(self.manifest, ROOT)

    def test_unknown_evidence_target_fails_closed(self) -> None:
        manifest = copy.deepcopy(self.manifest)
        manifest["cross_links"][0]["evidence_ids"].append("EVD-P4-M99")
        with self.assertRaisesRegex(IdMigrationError, "unknown evidence target"):
            verify_manifest(manifest, ROOT, check_git=False)

    def test_unlinked_phase4_record_fails_closed(self) -> None:
        manifest = copy.deepcopy(self.manifest)
        for link in manifest["cross_links"]:
            link["evidence_ids"] = [item for item in link["evidence_ids"] if item != "EVD-P4-M12"]
        with self.assertRaisesRegex(IdMigrationError, "coverage mismatch"):
            verify_manifest(manifest, ROOT, check_git=False)


if __name__ == "__main__":
    unittest.main()
