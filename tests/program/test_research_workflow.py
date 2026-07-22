from __future__ import annotations

import copy
import sys
import unittest
from pathlib import Path

import yaml


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "program"))
from verify_research_workflow import ResearchWorkflowError, validate_question, verify_registry  # noqa: E402


class ResearchWorkflowTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.registry = yaml.safe_load((ROOT / "docs/research/research_questions.yaml").read_text(encoding="utf-8"))
        cls.fixture = yaml.safe_load((ROOT / "tests/program/fixtures/research_workflow/jump.yaml").read_text(encoding="utf-8"))

    def test_empty_canonical_registry_and_fixture_pass(self) -> None:
        verify_registry(self.registry)
        validate_question(self.fixture)

    def test_missing_exit_criteria_fails_closed(self) -> None:
        question = copy.deepcopy(self.fixture)
        question["exit_criteria"] = []
        with self.assertRaisesRegex(ResearchWorkflowError, "exit criteria"):
            validate_question(question)

    def test_fixture_cannot_claim_scientific_evidence(self) -> None:
        question = copy.deepcopy(self.fixture)
        question["scientific_evidence"] = True
        with self.assertRaisesRegex(ResearchWorkflowError, "cannot claim scientific evidence"):
            validate_question(question)


if __name__ == "__main__":
    unittest.main()
