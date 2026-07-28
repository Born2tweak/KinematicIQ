"""Adversarial coverage for milestone finalization.

Finalization is the only path that can move a milestone to ``Current`` on the
normal execution path, so every way it could lie has to be a test.
"""

from __future__ import annotations

import copy
import json
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "program"))

from finalize_milestone import (  # noqa: E402
    FinalizationError,
    _atomic_write_json,
    finalize,
)
from program_contract import load_program  # noqa: E402


def _program():
    return load_program(
        "docs/program/milestone_registry.yaml",
        "docs/program/milestone_schema.yaml",
        ROOT,
    )


class FinalizationGuardTests(unittest.TestCase):
    """Each test drives one failure mode and asserts it fails closed."""

    def setUp(self) -> None:
        self.program = _program()
        self.milestone = self.program.by_id["KQ-018"]
        self.record = {
            "evidence_id": "KQ-018-deadbeefcafe",
            "milestone_id": "KQ-018",
            "subject_commit": "deadbeefcafe" + "0" * 28,
            "all_required_checks_passed": True,
            "scope": {"paths": ["docs/"]},
        }

    def _finalize(self, out="docs/status/milestones/KQ-018.test.json"):
        return finalize(self.program, self.milestone, out)

    def test_missing_record_fails_closed(self) -> None:
        with patch("finalize_milestone.latest_records_by_milestone", return_value={}):
            with self.assertRaisesRegex(FinalizationError, "no evidence record"):
                self._finalize()

    def test_stale_subject_commit_fails_closed(self) -> None:
        """Evidence from an older commit must not close the current tree."""
        with patch(
            "finalize_milestone.latest_records_by_milestone",
            return_value={"KQ-018": self.record},
        ), patch("finalize_milestone.git_output", return_value="f" * 40):
            with self.assertRaisesRegex(FinalizationError, "is not HEAD"):
                self._finalize()

    def test_failed_checks_cannot_be_closed(self) -> None:
        record = copy.deepcopy(self.record)
        record["all_required_checks_passed"] = False
        with patch(
            "finalize_milestone.latest_records_by_milestone",
            return_value={"KQ-018": record},
        ), patch("finalize_milestone.git_output", return_value=record["subject_commit"]):
            with self.assertRaisesRegex(FinalizationError, "failed checks"):
                self._finalize()

    def test_invalid_record_cannot_be_closed(self) -> None:
        """A record that no longer verifies against its declared inputs is refused."""
        with patch(
            "finalize_milestone.latest_records_by_milestone",
            return_value={"KQ-018": self.record},
        ), patch(
            "finalize_milestone.git_output", return_value=self.record["subject_commit"]
        ), patch("finalize_milestone.load_records", return_value={}), patch(
            "finalize_milestone.verify_record", return_value=["input hash drifted"]
        ):
            with self.assertRaisesRegex(FinalizationError, "input hash drifted"):
                self._finalize()

    def test_dependency_drift_blocks_closure(self) -> None:
        """A dependency whose evidence went stale must block the dependent."""
        with patch(
            "finalize_milestone.latest_records_by_milestone",
            return_value={"KQ-018": self.record},
        ), patch(
            "finalize_milestone.git_output", return_value=self.record["subject_commit"]
        ), patch("finalize_milestone.load_records", return_value={}), patch(
            "finalize_milestone.verify_record", return_value=[]
        ), patch(
            "finalize_milestone.compile_projection",
            return_value={"states": {
                "KQ-001": {"validity": "ReverificationRequired", "evidence_id": "x"},
                "KQ-003": {"validity": "Current", "evidence_id": "y"},
            }},
        ):
            with self.assertRaisesRegex(FinalizationError, "unmet dependency"):
                self._finalize()

    def test_dependency_with_no_evidence_blocks_closure(self) -> None:
        with patch(
            "finalize_milestone.latest_records_by_milestone",
            return_value={"KQ-018": self.record},
        ), patch(
            "finalize_milestone.git_output", return_value=self.record["subject_commit"]
        ), patch("finalize_milestone.load_records", return_value={}), patch(
            "finalize_milestone.verify_record", return_value=[]
        ), patch(
            "finalize_milestone.compile_projection", return_value={"states": {}}
        ):
            with self.assertRaisesRegex(FinalizationError, "no evidence"):
                self._finalize()

    def test_projection_not_current_after_write_fails_closed(self) -> None:
        """If the claimed transition did not happen, say so instead of passing."""
        states = {
            "KQ-001": {"validity": "Current", "evidence_id": "a"},
            "KQ-003": {"validity": "Current", "evidence_id": "b"},
        }
        with patch(
            "finalize_milestone.latest_records_by_milestone",
            return_value={"KQ-018": self.record},
        ), patch(
            "finalize_milestone.git_output", return_value=self.record["subject_commit"]
        ), patch("finalize_milestone.load_records", return_value={}), patch(
            "finalize_milestone.verify_record", return_value=[]
        ), patch(
            "finalize_milestone.compile_projection",
            return_value={"states": states},
        ), patch("finalize_milestone._append_event"), patch(
            "finalize_milestone._refresh_projections"
        ), patch("finalize_milestone._atomic_write_json"):
            with self.assertRaisesRegex(FinalizationError, "did not produce Current"):
                self._finalize()

    def test_projection_pointing_at_another_record_fails_closed(self) -> None:
        """Closure must not accept a projection that names different evidence."""
        calls = []

        def projection(*_args, **_kwargs):
            calls.append(1)
            base = {
                "KQ-001": {"validity": "Current", "evidence_id": "a"},
                "KQ-003": {"validity": "Current", "evidence_id": "b"},
            }
            if len(calls) > 1:
                base["KQ-018"] = {
                    "validity": "Current",
                    "evidence_id": "KQ-018-someotherrecord",
                }
            return {"states": base}

        with patch(
            "finalize_milestone.latest_records_by_milestone",
            return_value={"KQ-018": self.record},
        ), patch(
            "finalize_milestone.git_output", return_value=self.record["subject_commit"]
        ), patch("finalize_milestone.load_records", return_value={}), patch(
            "finalize_milestone.verify_record", return_value=[]
        ), patch(
            "finalize_milestone.compile_projection", side_effect=projection
        ), patch("finalize_milestone._append_event"), patch(
            "finalize_milestone._refresh_projections"
        ), patch("finalize_milestone._atomic_write_json"):
            with self.assertRaisesRegex(FinalizationError, "projection points at"):
                self._finalize()

    def test_duplicate_run_appends_no_second_event(self) -> None:
        """Idempotence: closing an already-current milestone writes no new event."""
        states = {
            "KQ-001": {"validity": "Current", "evidence_id": "a"},
            "KQ-003": {"validity": "Current", "evidence_id": "b"},
            "KQ-018": {
                "validity": "Current",
                "evidence_id": self.record["evidence_id"],
            },
        }
        with patch(
            "finalize_milestone.latest_records_by_milestone",
            return_value={"KQ-018": self.record},
        ), patch(
            "finalize_milestone.git_output", return_value=self.record["subject_commit"]
        ), patch("finalize_milestone.load_records", return_value={}), patch(
            "finalize_milestone.verify_record", return_value=[]
        ), patch(
            "finalize_milestone.compile_projection",
            return_value={"states": states},
        ), patch("finalize_milestone._append_event") as append, patch(
            "finalize_milestone._refresh_projections"
        ), patch("finalize_milestone._atomic_write_json"):
            summary = self._finalize()
        append.assert_not_called()
        self.assertTrue(summary["already_current"])

    def test_interrupted_run_recovers_without_duplicate_event(self) -> None:
        """A crash after the append must not double-append on the retry."""
        states = {
            "KQ-001": {"validity": "Current", "evidence_id": "a"},
            "KQ-003": {"validity": "Current", "evidence_id": "b"},
        }
        event_id = f"VAL-{self.record['evidence_id'].upper()}-CURRENT"

        def after(*_args, **_kwargs):
            merged = dict(states)
            merged["KQ-018"] = {
                "validity": "Current",
                "evidence_id": self.record["evidence_id"],
            }
            return {"states": merged}

        with patch(
            "finalize_milestone.latest_records_by_milestone",
            return_value={"KQ-018": self.record},
        ), patch(
            "finalize_milestone.git_output", return_value=self.record["subject_commit"]
        ), patch("finalize_milestone.load_records", return_value={}), patch(
            "finalize_milestone.verify_record", return_value=[]
        ), patch(
            "finalize_milestone.compile_projection", side_effect=after
        ), patch(
            "finalize_milestone.load_events",
            return_value=[{"event_id": event_id}],
        ), patch("finalize_milestone._append_event") as append, patch(
            "finalize_milestone._refresh_projections"
        ), patch("finalize_milestone._atomic_write_json"):
            self._finalize()
        append.assert_not_called()


class AtomicWriteTests(unittest.TestCase):
    def test_partial_write_leaves_no_file(self) -> None:
        """A serialization failure must not leave a truncated artifact behind."""
        import tempfile

        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "out.json"

            class Unserializable:
                pass

            with self.assertRaises(TypeError):
                _atomic_write_json(target, {"bad": Unserializable()})
            self.assertFalse(target.exists())
            self.assertEqual(list(Path(directory).glob("*.tmp")), [])

    def test_write_replaces_existing_atomically(self) -> None:
        import tempfile

        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "out.json"
            _atomic_write_json(target, {"a": 1})
            _atomic_write_json(target, {"a": 2})
            self.assertEqual(json.loads(target.read_text(encoding="utf-8")), {"a": 2})
            self.assertEqual(list(Path(directory).glob("*.tmp")), [])


if __name__ == "__main__":
    unittest.main()
