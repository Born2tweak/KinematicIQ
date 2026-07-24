from __future__ import annotations

import sys
import unittest
from pathlib import Path
from unittest.mock import patch


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "program"))

from execution_authority import (  # noqa: E402
    ExecutionAuthorityError,
    assert_executable,
    executable_frontier,
    verify_active_wave,
)
from transition_wave import build_active_wave  # noqa: E402


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
