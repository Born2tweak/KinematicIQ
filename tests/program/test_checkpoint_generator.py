from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "program"))
from generate_checkpoint import TRIGGERS, _explicit_dispositions, compile_checkpoint  # noqa: E402


class CheckpointGeneratorTests(unittest.TestCase):
    def test_checkpoint_covers_every_required_trigger(self) -> None:
        checkpoint = compile_checkpoint(ROOT)
        self.assertEqual(checkpoint["triggers"], TRIGGERS)
        self.assertEqual(
            set(checkpoint),
            {
                "schema_version",
                "program_id",
                "triggers",
                "source_hashes",
                "push_summary",
                "lifecycle_summary",
                "research_summary",
                "replan_summary",
                "release_summary",
                "blocker_summary",
            },
        )

    def test_checkpoint_preserves_release_and_public_protocol_invariants(self) -> None:
        checkpoint = compile_checkpoint(ROOT)
        self.assertEqual(checkpoint["lifecycle_summary"]["public_protocols"], ["squat"])
        self.assertEqual(checkpoint["release_summary"]["release_eligible_protocols"], [])
        self.assertFalse(checkpoint["release_summary"]["automatic_production_deploy"])

    def test_push_summary_contains_required_checkpoint_fields(self) -> None:
        summary = compile_checkpoint(ROOT)["push_summary"]
        self.assertTrue({"completed_ids", "objective_evidence", "verification_failures", "subject_commits", "active_work_ids", "next_executable_range"} <= set(summary))
        self.assertEqual(summary["objective_evidence"]["missing_ids"], [])

    def test_release_requires_explicit_gate_pass_evidence(self) -> None:
        unsupported = [{"milestone_id": "KQ-999", "protocol_id": "lunge", "result_code": "RELEASE_ELIGIBLE", "all_required_checks_passed": True}]
        self.assertEqual(_explicit_dispositions(unsupported)["release_eligible_protocols"], [])
        supported = [{**unsupported[0], "upstream_result_code": "GATE_PASS", "protocol_lifecycle": "ReleaseEligible"}]
        self.assertEqual(_explicit_dispositions(supported)["release_eligible_protocols"], ["lunge"])

    def test_blocker_summary_includes_all_milestone_blocker_classes(self) -> None:
        blockers = compile_checkpoint(ROOT)["blocker_summary"]["milestone_blockers"]
        self.assertEqual(set(blockers), {"BlockedHuman", "BlockedExternal", "FailedTechnical"})

    def test_checked_in_checkpoint_matches_compiler_when_present(self) -> None:
        path = ROOT / "docs/status/program_checkpoint.json"
        if path.is_file():
            self.assertEqual(json.loads(path.read_text(encoding="utf-8")), compile_checkpoint(ROOT))


if __name__ == "__main__":
    unittest.main()
