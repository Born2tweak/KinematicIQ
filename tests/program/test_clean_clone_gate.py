from __future__ import annotations

import os
import subprocess
import sys
import tempfile
import time
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "program"))

from verify_clean_clone import (  # noqa: E402
    STALE_CLONE_SECONDS,
    _remove_tree,
    _sweep_stale_clones,
    unpushed_subject,
)


def _git(root: Path, *args: str) -> str:
    return subprocess.run(
        ["git", *args], cwd=root, check=True, capture_output=True, text=True
    ).stdout.strip()


class CleanCloneOrderingTests(unittest.TestCase):
    """An unpushed subject is an ordering failure, not a repository defect."""

    def _origin_and_clone(self, tmp: str) -> tuple[Path, Path]:
        origin = Path(tmp) / "origin.git"
        work = Path(tmp) / "work"
        subprocess.run(
            ["git", "init", "--bare", "--initial-branch", "main", str(origin)],
            check=True, capture_output=True,
        )
        work.mkdir()
        (work / "seed.txt").write_text("one\n", encoding="utf-8")
        for args in (
            ("init", "--initial-branch", "main"),
            ("config", "user.email", "test@example.com"),
            ("config", "user.name", "test"),
            ("add", "-A"),
            ("commit", "-m", "seed"),
            ("remote", "add", "origin", str(origin)),
            ("push", "origin", "main"),
        ):
            _git(work, *args)
        return origin, work

    def test_pushed_subject_passes_the_precondition(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            origin, work = self._origin_and_clone(tmp)
            self.assertIsNone(unpushed_subject(work, str(origin), "main"))

    def test_unpushed_subject_is_named_an_ordering_failure(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            origin, work = self._origin_and_clone(tmp)
            (work / "seed.txt").write_text("two\n", encoding="utf-8")
            _git(work, "add", "-A")
            _git(work, "commit", "-m", "unpushed")
            message = unpushed_subject(work, str(origin), "main")
            self.assertIsNotNone(message)
            self.assertIn("operator ordering failure", message)
            self.assertIn(_git(work, "rev-parse", "HEAD")[:12], message)

    def test_missing_remote_branch_is_reported_before_cloning(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            origin, work = self._origin_and_clone(tmp)
            message = unpushed_subject(work, str(origin), "absent")
            self.assertIsNotNone(message)
            self.assertIn("has no branch absent", message)


if __name__ == "__main__":
    unittest.main()


class CloneCleanupTests(unittest.TestCase):
    """Abandoned clones are ~180 MB each; silent leaks must be reported or swept."""

    def test_remove_tree_deletes_and_reports_success(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            target = Path(tmp) / "kinematiciq-clean-clone-alpha"
            (target / "nested").mkdir(parents=True)
            (target / "nested" / "file.txt").write_text("x", encoding="utf-8")
            self.assertTrue(_remove_tree(target))
            self.assertFalse(target.exists())

    def test_sweep_removes_stale_siblings_only(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            current = root / "kinematiciq-clean-clone-current"
            stale = root / "kinematiciq-clean-clone-stale"
            fresh = root / "kinematiciq-clean-clone-fresh"
            unrelated = root / "some-other-tempdir"
            for path in (current, stale, fresh, unrelated):
                path.mkdir()
            old = time.time() - (STALE_CLONE_SECONDS + 600)
            os.utime(stale, (old, old))
            _sweep_stale_clones(current)
            self.assertFalse(stale.exists())
            self.assertTrue(current.exists())
            self.assertTrue(fresh.exists())
            self.assertTrue(unrelated.exists())
