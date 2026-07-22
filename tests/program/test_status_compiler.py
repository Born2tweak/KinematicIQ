from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "program"))
from compile_status import compile_status  # noqa: E402


class StatusCompilerTests(unittest.TestCase):
    def test_compiled_frontier_preserves_authority_and_availability(self) -> None:
        status = compile_status(ROOT)
        self.assertEqual(status["milestones"]["total"], 175)
        self.assertEqual(status["protocols"]["available"], ["squat"])
        self.assertFalse(status["authority"]["automatic_production_deploy"])
        self.assertTrue(set(status["milestones"]["committed_wave_ready_ids"]) <= set(status["milestones"]["dependency_ready_ids"]))

    def test_committed_frontier_next_is_first_or_phase_is_complete(self) -> None:
        status = compile_status(ROOT)
        ready = status["milestones"]["committed_wave_ready_ids"]
        if ready:
            self.assertEqual(status["milestones"]["next_executable_id"], ready[0])
        else:
            self.assertIsNone(status["milestones"]["next_executable_id"])
            self.assertTrue(status["milestones"]["dependency_ready_ids"])

    def test_checked_in_status_matches_compiler_when_present(self) -> None:
        path = ROOT / "docs/status/program_status.json"
        if path.is_file():
            self.assertEqual(json.loads(path.read_text(encoding="utf-8")), compile_status(ROOT))


if __name__ == "__main__":
    unittest.main()
