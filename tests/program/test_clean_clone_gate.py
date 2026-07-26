from __future__ import annotations

import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "program"))

from verify_clean_clone import unpushed_subject  # noqa: E402


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
