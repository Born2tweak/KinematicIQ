from __future__ import annotations

import copy
import sys
import unittest
from pathlib import Path

import yaml


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "program"))

from verify_artifact_structure import ArtifactStructureError, verify_manifest  # noqa: E402


class ArtifactStructureTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        with (ROOT / "docs/program/artifacts/kq-003.yaml").open(encoding="utf-8") as handle:
            cls.manifest = yaml.safe_load(handle)

    def test_repository_layout_passes(self) -> None:
        verify_manifest(self.manifest, ROOT)

    def test_competing_authority_fails_closed(self) -> None:
        manifest = copy.deepcopy(self.manifest)
        manifest["prohibited_competing_paths"] = ["docs/program/milestone_registry.yaml"]
        with self.assertRaisesRegex(ArtifactStructureError, "competing authority exists"):
            verify_manifest(manifest, ROOT)


if __name__ == "__main__":
    unittest.main()
