from __future__ import annotations

import copy
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "program"))

from evidence_integrity import (  # noqa: E402
    canonical_content,
    canonical_hash,
    canonical_json_hash,
    commit_tree,
    compile_projection,
    schema_validator,
    scope_paths,
    tracked_paths,
    verify_record,
    _stable_worktree,
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

    def test_tracked_paths_follow_subject_commit_not_index(self) -> None:
        """Scope must attest the subject commit, not whatever the index holds."""
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "kept.txt").write_text("kept\n", encoding="utf-8")
            for command in (
                ["git", "init"],
                ["git", "config", "user.email", "test@example.com"],
                ["git", "config", "user.name", "test"],
                ["git", "add", "-A"],
                ["git", "commit", "-m", "seed"],
            ):
                subprocess.run(command, cwd=root, check=True, capture_output=True)
            subject = subprocess.run(
                ["git", "rev-parse", "HEAD"],
                cwd=root,
                check=True,
                capture_output=True,
                text=True,
            ).stdout.strip()
            (root / "staged.txt").write_text("staged\n", encoding="utf-8")
            subprocess.run(["git", "add", "staged.txt"], cwd=root, check=True, capture_output=True)
            paths = tracked_paths(root, subject)
            self.assertIn("kept.txt", paths)
            self.assertNotIn("staged.txt", paths)

    def test_directory_scope_contains_only_tracked_content(self) -> None:
        paths = scope_paths(ROOT, self.program.by_id["KQ-015"])
        relative_paths = {
            path.relative_to(ROOT).as_posix()
            for path in paths
        }
        self.assertTrue(relative_paths)
        self.assertFalse(any("__pycache__" in item for item in relative_paths))
        tracked = {
            item
            for item in subprocess.run(
                ["git", "ls-files"],
                cwd=ROOT,
                check=True,
                capture_output=True,
                text=True,
            ).stdout.splitlines()
            if item
        }
        self.assertLessEqual(relative_paths, tracked)

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
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            legacy = root / "docs/status/milestones/KQ-001.json"
            legacy.parent.mkdir(parents=True)
            legacy.write_text(
                json.dumps({
                    "milestone_id": "KQ-001",
                    "all_required_checks_passed": True,
                }),
                encoding="utf-8",
            )
            milestone = copy.deepcopy(self.program.by_id["KQ-001"])
            projection = compile_projection(root, [milestone])
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


class VerificationCacheTests(unittest.TestCase):
    """Memoisation must never outlive the state it was computed from."""

    def test_repeated_hash_inside_one_pass_reads_the_file_once(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "scoped.py"
            target.write_text("one\n", encoding="utf-8")
            with _stable_worktree():
                first = canonical_hash(target)
                target.write_text("two\n", encoding="utf-8")
                self.assertEqual(canonical_hash(target), first)

    def test_mutated_input_invalidates_the_hash_between_passes(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "scoped.py"
            target.write_text("one\n", encoding="utf-8")
            with _stable_worktree():
                first = canonical_hash(target)
            target.write_text("two\n", encoding="utf-8")
            with _stable_worktree():
                self.assertNotEqual(canonical_hash(target), first)

    def test_changed_verifier_schema_compiles_a_new_validator(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            schema = Path(directory) / "evidence.schema.yaml"
            schema.write_text("type: object\nrequired: [a]\n", encoding="utf-8")
            first = schema_validator(schema)
            self.assertIs(schema_validator(schema), first)
            schema.write_text("type: object\nrequired: [b]\n", encoding="utf-8")
            second = schema_validator(schema)
            self.assertIsNot(second, first)
            self.assertTrue(list(second.iter_errors({"a": 1})))

    def test_commit_tree_caches_immutable_names_only(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "seed.txt").write_text("one\n", encoding="utf-8")
            for command in (
                ["git", "init"],
                ["git", "config", "user.email", "test@example.com"],
                ["git", "config", "user.name", "test"],
                ["git", "add", "-A"],
                ["git", "commit", "-m", "seed"],
            ):
                subprocess.run(command, cwd=root, check=True, capture_output=True)

            def rev(*args: str) -> str:
                return subprocess.run(
                    ["git", "rev-parse", *args],
                    cwd=root,
                    check=True,
                    capture_output=True,
                    text=True,
                ).stdout.strip()

            first_commit = rev("HEAD")
            first_tree = commit_tree(root, first_commit)
            self.assertEqual(first_tree, rev("HEAD^{tree}"))
            (root / "seed.txt").write_text("two\n", encoding="utf-8")
            for command in (["git", "add", "-A"], ["git", "commit", "-m", "second"]):
                subprocess.run(command, cwd=root, check=True, capture_output=True)
            self.assertEqual(commit_tree(root, first_commit), first_tree)
            second_tree = commit_tree(root, rev("HEAD"))
            self.assertNotEqual(second_tree, first_tree)
            self.assertEqual(commit_tree(root, "HEAD"), second_tree)


if __name__ == "__main__":
    unittest.main()
