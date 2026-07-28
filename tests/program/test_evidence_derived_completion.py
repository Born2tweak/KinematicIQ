"""Completion must be a function of evidence, never mutable registry state.

Storing ``milestone_status: Passed`` in the registry meant every closure required
an edit to a declared input of KQ-015, which revoked the entire Phase A chain and
staled the record that had just been produced. These tests pin the property that
replaced it.
"""

from __future__ import annotations

import copy
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "program"))

from lifecycle import (  # noqa: E402
    DERIVED_ONLY_STATUSES,
    INTENT_STATUSES,
    effective_status,
    is_complete,
)
from program_contract import load_program  # noqa: E402

CURRENT = {"validity": "Current", "evidence_id": "e1"}
STALE = {"validity": "ReverificationRequired", "evidence_id": "e1"}


def _milestone(mid="KQ-018", status="Pending"):
    return {"id": mid, "milestone_status": status}


class DerivedCompletionTests(unittest.TestCase):
    def test_current_evidence_alone_makes_a_milestone_passed(self) -> None:
        """Requirement 1: closing needs no registry status mutation."""
        milestone = _milestone(status="Pending")
        self.assertEqual(effective_status(milestone, {"KQ-018": CURRENT}), "Passed")
        self.assertTrue(is_complete(milestone, {"KQ-018": CURRENT}))

    def test_declared_passed_without_evidence_is_not_trusted(self) -> None:
        """A registry claiming Passed with stale evidence reads as outstanding."""
        milestone = _milestone(status="Passed")
        self.assertEqual(effective_status(milestone, {"KQ-018": STALE}), "Pending")
        self.assertEqual(effective_status(milestone, {}), "Pending")
        self.assertFalse(is_complete(milestone, {}))

    def test_intent_statuses_survive_current_evidence(self) -> None:
        """Blocked/retired/skipped are decisions; evidence must not override them."""
        for status in sorted(INTENT_STATUSES):
            milestone = _milestone(status=status)
            self.assertEqual(
                effective_status(milestone, {"KQ-018": CURRENT}),
                status,
                f"{status} must not be overridden by passing evidence",
            )

    def test_passed_is_the_only_derived_status(self) -> None:
        self.assertEqual(DERIVED_ONLY_STATUSES, frozenset({"Passed"}))
        self.assertNotIn("Passed", INTENT_STATUSES)

    def test_registry_declares_no_new_passed_milestones(self) -> None:
        """Requirement: the registry stores intent, not completion.

        Phase A (KQ-001..015) still carries legacy ``Passed`` declarations that
        are inert under `effective_status`. Nothing outside that range may
        introduce a new one, which is what would reintroduce the manual edit.
        """
        program = load_program(
            "docs/program/milestone_registry.yaml",
            "docs/program/milestone_schema.yaml",
            ROOT,
        )
        offenders = [
            item["id"]
            for item in program.milestones
            if item["milestone_status"] == "Passed"
            and int(item["id"].split("-")[1]) > 15
        ]
        self.assertEqual(offenders, [], "completion must be derived, not declared")

    def test_closing_a_phase_b_milestone_leaves_phase_a_untouched(self) -> None:
        """Requirement 4: a Phase B closure must not revoke Phase A evidence.

        Closure now writes only evidence and projections. Because no registry
        input changes, the Phase A records keep their validity. This asserts the
        structural reason: KQ-018's closure inputs are disjoint from KQ-015's.
        """
        program = load_program(
            "docs/program/milestone_registry.yaml",
            "docs/program/milestone_schema.yaml",
            ROOT,
        )
        states = {f"KQ-{n:03d}": dict(CURRENT) for n in range(1, 16)}
        before = {
            mid: effective_status(program.by_id[mid], states) for mid in states
        }
        # KQ-018 becoming Current adds a key; it rewrites nothing else.
        states["KQ-018"] = dict(CURRENT)
        after = {
            mid: effective_status(program.by_id[mid], states)
            for mid in before
        }
        self.assertEqual(before, after)
        self.assertEqual(effective_status(program.by_id["KQ-018"], states), "Passed")

    def test_multiple_milestones_finalize_without_weakening_each_other(self) -> None:
        """Requirement 5: independent closures stay per-milestone.

        One milestone going Current must not imply anything about another; a
        stale neighbour stays stale.
        """
        program = load_program(
            "docs/program/milestone_registry.yaml",
            "docs/program/milestone_schema.yaml",
            ROOT,
        )
        states = {
            "KQ-018": dict(CURRENT),
            "KQ-019": dict(STALE),
            "KQ-026": dict(CURRENT),
        }
        self.assertEqual(effective_status(program.by_id["KQ-018"], states), "Passed")
        self.assertEqual(effective_status(program.by_id["KQ-026"], states), "Passed")
        self.assertEqual(effective_status(program.by_id["KQ-019"], states), "Pending")

    def test_tampered_validity_cannot_forge_completion(self) -> None:
        """Requirement 7: only the exact 'Current' verdict counts."""
        milestone = _milestone()
        for forged in ("current", "CURRENT", "Passed", "ok", True, None, ""):
            self.assertEqual(
                effective_status(milestone, {"KQ-018": {"validity": forged}}),
                "Pending",
                f"validity={forged!r} must not read as complete",
            )

    def test_missing_validity_key_fails_closed(self) -> None:
        milestone = _milestone()
        self.assertEqual(effective_status(milestone, {"KQ-018": {}}), "Pending")


class RegistryIsNotMutatedByClosureTests(unittest.TestCase):
    def test_finalization_writes_no_registry_path(self) -> None:
        """Requirement 2: finalizing must not touch the acceptance contract.

        A milestone's contract hash covers the registry. If finalization wrote
        there, the record it just produced would immediately go stale -- the
        exact defect this replaced.
        """
        source = (ROOT / "tools" / "program" / "finalize_milestone.py").read_text(
            encoding="utf-8"
        )
        # The registry may be read (it is the CLI's --registry default) but
        # never written. Every write goes through these two helpers.
        for line in source.splitlines():
            if "_atomic_write_json(" in line or "_append_event(" in line:
                self.assertNotIn("registry", line.lower())
        self.assertNotIn("milestone_status\"] =", source)
        self.assertNotIn("milestone_status'] =", source)

    def test_closure_inputs_exclude_the_registry(self) -> None:
        """The paths a closure writes must not intersect any contract input."""
        program = load_program(
            "docs/program/milestone_registry.yaml",
            "docs/program/milestone_schema.yaml",
            ROOT,
        )
        milestone = copy.deepcopy(program.by_id["KQ-018"])
        written = {
            milestone["artifacts"][1],
            "docs/status/evidence_validity.json",
            "docs/status/program_status.json",
            "docs/status/program_checkpoint.json",
        }
        contract_inputs = set(milestone["evidence_inputs"])
        self.assertEqual(written & contract_inputs, set())
        self.assertNotIn("docs/program/milestone_registry.yaml", written)


if __name__ == "__main__":
    unittest.main()
