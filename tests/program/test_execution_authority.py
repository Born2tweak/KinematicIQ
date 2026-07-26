from __future__ import annotations

import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "program"))

from execution_authority import (  # noqa: E402
    ExecutionAuthorityError,
    assert_declared_branch,
    assert_executable,
    executable_frontier,
    verify_active_wave,
)
from transition_wave import build_active_wave  # noqa: E402


class DeclaredBranchPreconditionTests(unittest.TestCase):
    """Branch binding must gate evidence generation, not just KQ-007."""

    def _repository(self, tmp: str, branch: str) -> Path:
        root = Path(tmp)
        (root / "docs/program").mkdir(parents=True)
        (root / "docs/program/execution_policy.yaml").write_text(
            "git:\n  work_branch: agent/evidence-integrity-wave-2\n",
            encoding="utf-8",
        )
        for command in (
            ["git", "init", "--initial-branch", branch],
            ["git", "config", "user.email", "test@example.com"],
            ["git", "config", "user.name", "test"],
            ["git", "add", "-A"],
            ["git", "commit", "-m", "seed"],
        ):
            subprocess.run(command, cwd=root, check=True, capture_output=True)
        return root

    def test_declared_branch_is_accepted(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = self._repository(tmp, "agent/evidence-integrity-wave-2")
            assert_declared_branch(root)

    def test_other_branch_is_refused(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = self._repository(tmp, "wave2-reverify")
            with self.assertRaises(ExecutionAuthorityError) as caught:
                assert_declared_branch(root)
            self.assertIn("differs from declared work branch", str(caught.exception))


class ExecutionAuthorityTests(unittest.TestCase):
    def test_wave_two_is_capacity_feasible_and_assigned(self) -> None:
        wave = build_active_wave()
        verify_active_wave(wave)
        self.assertEqual(
            [item["id"] for item in wave["committed"]],
            ["KQ-016", "KQ-017", "KQ-026"],
        )
        self.assertNotIn("KQ-056", [item["id"] for item in wave["committed"]])

    def test_missing_worker_or_capacity_overrun_fails_closed(self) -> None:
        wave = build_active_wave()
        wave["committed"][0]["worker_id"] = None
        with self.assertRaisesRegex(ExecutionAuthorityError, "missing mutation worker"):
            verify_active_wave(wave)
        wave = build_active_wave()
        wave["capacity_hours"] = 1
        with self.assertRaisesRegex(ExecutionAuthorityError, "exceeds capacity"):
            verify_active_wave(wave)

    @patch("execution_authority.active_wave")
    @patch("execution_authority.dependency_ready_ids")
    def test_worker_frontier_serializes_lane_and_rejects_unslotted(
        self, ready_mock, wave_mock
    ) -> None:
        ready_mock.return_value = (["KQ-016", "KQ-017", "KQ-026", "KQ-056"], {})
        wave_mock.return_value = build_active_wave()
        frontier = executable_frontier(ROOT)
        self.assertEqual(frontier["allowed_executable_ids"], ["KQ-016", "KQ-017"])
        self.assertEqual(frontier["next_executable_id"], "KQ-016")
        assert_executable(ROOT, "KQ-017")
        with self.assertRaisesRegex(ExecutionAuthorityError, "not an allowed"):
            assert_executable(ROOT, "KQ-026")
        with self.assertRaisesRegex(ExecutionAuthorityError, "not an allowed"):
            assert_executable(ROOT, "KQ-056")

    @patch("execution_authority.active_wave")
    @patch("execution_authority.dependency_ready_ids")
    def test_every_exclusion_carries_a_machine_readable_reason(
        self, ready_mock, wave_mock
    ) -> None:
        """A milestone left out of the frontier must say which rule excluded it."""
        ready_mock.return_value = (["KQ-016", "KQ-017", "KQ-026", "KQ-056"], {})
        wave_mock.return_value = build_active_wave()
        frontier = executable_frontier(ROOT)
        reasons = frontier["scheduling_reasons"]
        self.assertEqual(
            sorted(reasons), ["KQ-016", "KQ-017", "KQ-026", "KQ-056"]
        )
        allowed = set(frontier["allowed_executable_ids"])
        for milestone_id, reason in reasons.items():
            self.assertIn(reason["state"], {"allowed", "eligible_but_not_scheduled", "blocked"})
            self.assertTrue(reason["reason"])
            self.assertEqual(reason["state"] == "allowed", milestone_id in allowed)
        self.assertEqual(reasons["KQ-026"]["reason"], "worker_slot_occupied")
        self.assertEqual(reasons["KQ-026"]["detail"]["worker_id"], "W1")
        self.assertEqual(reasons["KQ-026"]["detail"]["occupied_by"], "KQ-016")
        self.assertEqual(
            reasons["KQ-056"]["reason"], "not_committed_to_active_wave"
        )

    @patch("execution_authority.active_wave")
    @patch("execution_authority.dependency_ready_ids")
    def test_freed_worker_slot_promotes_the_next_committed_id(
        self, ready_mock, wave_mock
    ) -> None:
        """Serialisation is per worker: KQ-026 waits for W1, not forever."""
        ready_mock.return_value = (["KQ-017", "KQ-026"], {})
        wave_mock.return_value = build_active_wave()
        frontier = executable_frontier(ROOT)
        self.assertIn("KQ-026", frontier["allowed_executable_ids"])
        self.assertEqual(
            frontier["scheduling_reasons"]["KQ-026"]["reason"], "scheduled"
        )

    @patch("execution_authority.executable_frontier")
    def test_null_frontier_rejects_all_execution(self, frontier_mock) -> None:
        frontier_mock.return_value = {
            "next_executable_id": None,
            "allowed_executable_ids": [],
        }
        with self.assertRaisesRegex(ExecutionAuthorityError, "is null"):
            assert_executable(ROOT, "KQ-016")


if __name__ == "__main__":
    unittest.main()
