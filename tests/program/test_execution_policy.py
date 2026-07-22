from __future__ import annotations

import copy
import sys
import unittest
from pathlib import Path

import yaml


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "program"))
from verify_execution_policy import ExecutionPolicyError, verify_policy  # noqa: E402


class ExecutionPolicyTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.policy = yaml.safe_load((ROOT / "docs/program/execution_policy.yaml").read_text(encoding="utf-8"))
        cls.registry = yaml.safe_load((ROOT / "docs/program/milestone_registry.yaml").read_text(encoding="utf-8"))

    def mutated(self):
        return copy.deepcopy(self.policy), copy.deepcopy(self.registry)

    def test_authoritative_policy_passes(self) -> None:
        verify_policy(self.policy, self.registry, ROOT)

    def test_direct_master_or_deploy_authority_fails_closed(self) -> None:
        policy, registry = self.mutated()
        policy["git"]["direct_master_merge"] = "automatic"
        policy["deployment"]["automatic"] = True
        with self.assertRaises(ExecutionPolicyError):
            verify_policy(policy, registry, ROOT)

    def test_interruption_expansion_fails_closed(self) -> None:
        policy, registry = self.mutated()
        policy["interruptions"]["gates"].append("routine_test_fix")
        with self.assertRaisesRegex(ExecutionPolicyError, "interruption"):
            verify_policy(policy, registry, ROOT)

    def test_locked_evidence_retry_and_global_pause_fail_closed(self) -> None:
        policy, registry = self.mutated()
        locked = next(item for item in registry["milestones"] if item["failure"]["locked_evidence_retuning_forbidden"])
        locked["failure"]["retry_budget"] = 1
        policy["continuation"]["global_pause"] = True
        with self.assertRaises(ExecutionPolicyError):
            verify_policy(policy, registry, ROOT)


if __name__ == "__main__":
    unittest.main()
