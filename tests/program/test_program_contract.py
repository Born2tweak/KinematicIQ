from __future__ import annotations

import copy
import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "program"))

from program_contract import LoadedProgram, validate_schema, validate_semantics  # noqa: E402


class ProgramContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        from program_contract import load_program

        cls.program = load_program(
            "docs/program/milestone_registry.yaml", "docs/program/milestone_schema.yaml", ROOT
        )

    def mutated(self) -> LoadedProgram:
        return LoadedProgram(
            root=self.program.root,
            registry_path=self.program.registry_path,
            schema_path=self.program.schema_path,
            registry=copy.deepcopy(self.program.registry),
            schema=self.program.schema,
        )

    def test_authoritative_registry_passes_schema_and_semantics(self) -> None:
        self.assertEqual(validate_schema(self.program), [])
        self.assertEqual(validate_semantics(self.program), [])

    def test_unknown_predicate_fails_closed(self) -> None:
        program = self.mutated()
        program.registry["milestones"][0]["acceptance"][0]["predicate"] = "artifact_says_it_passed"
        self.assertTrue(validate_schema(program))

    def test_mandatory_dependency_cannot_accept_skip(self) -> None:
        program = self.mutated()
        dependency = program.registry["milestones"][1]["dependencies"][0]
        dependency["accepted_milestone_statuses"].append("SkippedByDecision")
        errors = validate_semantics(program)
        self.assertTrue(any("illegally accepts skip" in item for item in errors))

    def test_skip_requires_declared_policy_and_outcome(self) -> None:
        program = self.mutated()
        milestone = program.by_id["KQ-042"]
        del milestone["skip_policy"]["authority"]
        errors = validate_semantics(program)
        self.assertTrue(any("skip policy missing" in item for item in errors))

    def test_release_outcome_requires_gate_pass_dependency(self) -> None:
        program = self.mutated()
        milestone = program.by_id["KQ-093"]
        milestone["dependencies"][0].pop("accepted_result_codes")
        errors = validate_semantics(program)
        self.assertTrue(any("has no GATE_PASS dependency" in item for item in errors))

    def test_acceptance_cannot_reference_undeclared_command(self) -> None:
        program = self.mutated()
        acceptance = program.by_id["KQ-004"]["acceptance"][3]
        acceptance["command_id"] = "imaginary_check"
        errors = validate_semantics(program)
        self.assertTrue(any("references undeclared command imaginary_check" in item for item in errors))

    def test_artifact_and_evidence_bindings_fail_closed(self) -> None:
        program = self.mutated()
        program.by_id["KQ-004"]["acceptance"][1]["evidence"] = "docs/status/wrong.json"
        errors = validate_semantics(program)
        self.assertTrue(any("evidence predicate must bind its status artifact" in item for item in errors))

    def test_duplicate_verification_ids_fail_closed(self) -> None:
        program = self.mutated()
        checks = program.by_id["KQ-004"]["verification"]["automated"]
        checks[2]["id"] = "targeted_contract_checks"
        errors = validate_semantics(program)
        self.assertTrue(any("duplicate automated verification IDs" in item for item in errors))


if __name__ == "__main__":
    unittest.main()
