from __future__ import annotations

import copy
import json
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "program"))

from evidence_integrity import (  # noqa: E402
    canonical_content,
    canonical_json_hash,
    compile_projection,
    verify_record,
)
from program_contract import load_program  # noqa: E402


class EvidenceIntegrityTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.program = load_program(
            "docs/program/milestone_registry.yaml",
            "docs/program/milestone_schema.yaml",
            ROOT,
        )

    def test_text_hashing_is_line_ending_independent(self) -> None:
        lf = canonical_content(b"one\ntwo\n", ".py")
        crlf = canonical_content(b"one\r\ntwo\r\n", ".py")
        self.assertEqual(lf, crlf)

    def test_declared_input_is_required(self) -> None:
        milestone = self.program.by_id["KQ-002"]
        record = {
            "schema_version": 2,
            "evidence_id": "KQ-002-test",
            "milestone_id": "KQ-002",
            "subject_commit": "HEAD",
            "subject_tree": "wrong",
            "generated_at": "2026-07-23T00:00:00Z",
            "milestone_contract_sha256": canonical_json_hash(milestone),
            "dependency_evidence": {},
            "input_hashes": {},
            "output_hashes": {},
            "scope": {"kind": "control_only", "paths": [], "justification": "test"},
            "toolchain": {},
            "checks": [{"passed": True}],
            "commands": {},
            "all_required_checks_passed": True,
        }
        errors = verify_record(ROOT, milestone, record, {})
        self.assertTrue(any("declared evidence inputs are unhashed" in item for item in errors))

    def test_historical_true_flag_does_not_create_current_validity(self) -> None:
        projection = compile_projection(ROOT, self.program.milestones)
        self.assertEqual(
            projection["states"]["KQ-001"]["validity"],
            "ReverificationRequired",
        )

    def test_invalid_current_record_is_demoted(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "docs/status/evidence/KQ-001").mkdir(parents=True)
            (root / "docs/status").mkdir(parents=True, exist_ok=True)
            bad = {
                "schema_version": 2,
                "evidence_id": "KQ-001-bad",
                "milestone_id": "KQ-001",
            }
            (root / "docs/status/evidence/KQ-001/KQ-001-bad.json").write_text(
                json.dumps(bad), encoding="utf-8"
            )
            events = [
                {
                    "event_id": "E1",
                    "milestone_id": "KQ-001",
                    "evidence_id": "legacy:KQ-001",
                    "from": None,
                    "to": "ReverificationRequired",
                    "rationale": "Legacy migration requires new evidence.",
                },
                {
                    "event_id": "E2",
                    "milestone_id": "KQ-001",
                    "evidence_id": "legacy:KQ-001",
                    "replacement_evidence_id": "KQ-001-bad",
                    "from": "ReverificationRequired",
                    "to": "Current",
                    "rationale": "Purported reverification.",
                },
            ]
            (root / "docs/status/evidence_validity_events.ndjson").write_text(
                "\n".join(json.dumps(item) for item in events) + "\n",
                encoding="utf-8",
            )
            milestone = copy.deepcopy(self.program.by_id["KQ-001"])
            projection = compile_projection(root, [milestone])
            self.assertEqual(
                projection["states"]["KQ-001"]["validity"],
                "ReverificationRequired",
            )
            self.assertIn("KQ-001", projection["verification_errors"])


if __name__ == "__main__":
    unittest.main()
