import copy
import unittest
from pathlib import Path

import yaml

from tools.program.execution_semantics import SemanticsError, evaluate_scenario


FIXTURE_DIR = Path(__file__).parent / "fixtures" / "execution"


class ExecutionFixtureTests(unittest.TestCase):
    def test_all_ten_normative_fixtures(self):
        fixtures = sorted(FIXTURE_DIR.glob("*.yaml"))
        self.assertEqual(10, len(fixtures), "the normative suite must contain exactly ten fixtures")
        for fixture_path in fixtures:
            with self.subTest(fixture=fixture_path.stem):
                fixture = yaml.safe_load(fixture_path.read_text(encoding="utf-8"))
                actual = evaluate_scenario(fixture)
                self.assertEqual(fixture["expected"], actual)

    def test_skip_without_complete_decision_metadata_is_rejected(self):
        fixture = yaml.safe_load((FIXTURE_DIR / "06_negative_model.yaml").read_text(encoding="utf-8"))
        broken = copy.deepcopy(fixture)
        broken["milestones"][0]["skip_decision"].pop("authority")
        with self.assertRaisesRegex(SemanticsError, "incomplete skip decision metadata"):
            evaluate_scenario(broken)

    def test_release_without_gate_pass_is_rejected(self):
        fixture = yaml.safe_load((FIXTURE_DIR / "01_happy.yaml").read_text(encoding="utf-8"))
        broken = copy.deepcopy(fixture)
        broken["milestones"][0]["result_code"] = "GATE_FAIL_RECORDED"
        with self.assertRaisesRegex(SemanticsError, "requires a signed GATE_PASS"):
            evaluate_scenario(broken)


if __name__ == "__main__":
    unittest.main()
