from __future__ import annotations

import copy
import sys
import unittest
from pathlib import Path

import yaml


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "program"))
from replan_impact import ReplanImpactError, compile_impact  # noqa: E402


class ReplanImpactTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.event = yaml.safe_load((ROOT / "tests/program/fixtures/replan/valid.yaml").read_text(encoding="utf-8"))
        cls.registry = yaml.safe_load((ROOT / "docs/program/milestone_registry.yaml").read_text(encoding="utf-8"))
        cls.schema = yaml.safe_load((ROOT / "docs/program/inflection_schema.yaml").read_text(encoding="utf-8"))

    def test_fixture_is_deterministic_and_excludes_completed_seed(self) -> None:
        first = compile_impact(self.event, self.registry, self.schema)
        second = compile_impact(self.event, self.registry, self.schema)
        self.assertEqual(first, second)
        self.assertNotIn("KQ-006", first)
        self.assertGreaterEqual(len(first), self.event["expected"]["minimum_affected_count"])
        self.assertEqual(first, sorted(first))

    def test_unknown_seed_fails_closed(self) -> None:
        event = copy.deepcopy(self.event)
        event["affected_seeds"] = ["KQ-999"]
        with self.assertRaisesRegex(ReplanImpactError, "unknown affected seeds"):
            compile_impact(event, self.registry, self.schema)

    def test_invalid_trigger_type_fails_schema(self) -> None:
        event = copy.deepcopy(self.event)
        event["trigger_type"] = "routine_whim"
        with self.assertRaises(ReplanImpactError):
            compile_impact(event, self.registry, self.schema)


if __name__ == "__main__":
    unittest.main()
