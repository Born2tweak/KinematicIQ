from __future__ import annotations

import copy
import sys
import unittest
from pathlib import Path

import yaml


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "program"))
from validate_traceability import TraceabilityError, validate_bundle, validate_contract  # noqa: E402


class TraceabilityValidatorTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.contract = yaml.safe_load((ROOT / "docs/program/traceability_contract.yaml").read_text(encoding="utf-8"))
        cls.bundle = yaml.safe_load((ROOT / "tests/program/fixtures/traceability/valid.yaml").read_text(encoding="utf-8"))

    def test_bootstrap_contract_and_bundle_pass(self) -> None:
        validate_contract(self.contract, ROOT)
        validate_bundle(self.bundle, self.contract, ROOT)

    def test_unknown_evidence_target_fails_closed(self) -> None:
        bundle = copy.deepcopy(self.bundle)
        bundle["links"][0]["to"] = "EVD-MISSING"
        with self.assertRaisesRegex(TraceabilityError, "unknown link endpoint"):
            validate_bundle(bundle, self.contract, ROOT)

    def test_active_metric_orphan_fails_closed(self) -> None:
        bundle = copy.deepcopy(self.bundle)
        bundle["links"] = [item for item in bundle["links"] if item["type"] != "gate_metric"]
        with self.assertRaisesRegex(TraceabilityError, "active orphan node"):
            validate_bundle(bundle, self.contract, ROOT)

    def test_wrong_namespace_and_gate_pass_id_fail_closed(self) -> None:
        bundle = copy.deepcopy(self.bundle)
        bundle["nodes"][3]["id"] = "GATE_PASS"
        bundle["links"][2]["from"] = "GATE_PASS"
        bundle["links"][3]["to"] = "GATE_PASS"
        bundle["links"][0]["to"] = "MET-FIXTURE-001"
        with self.assertRaises(TraceabilityError):
            validate_bundle(bundle, self.contract, ROOT)


if __name__ == "__main__":
    unittest.main()
