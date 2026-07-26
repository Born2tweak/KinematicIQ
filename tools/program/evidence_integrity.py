from __future__ import annotations

import hashlib
import io
import json
import platform
import re
import shutil
import subprocess
import tarfile
from contextlib import contextmanager
from datetime import datetime, timezone
from functools import lru_cache
from pathlib import Path
from typing import Any, Iterable, Iterator

import jsonschema
import yaml


SCHEMA_VERSION = 2
VALIDITY_STATES = {
    "Current",
    "ReverificationRequired",
    "Invalidated",
    "Superseded",
    "Retired",
}
COMPLETED_STATUSES = {"Passed", "SkippedByDecision", "Retired"}
EVIDENCE_ROOT = Path("docs/status/evidence")
VALIDITY_LOG = Path("docs/status/evidence_validity_events.ndjson")
VALIDITY_PROJECTION = Path("docs/status/evidence_validity.json")
TEXT_SUFFIXES = {
    ".css", ".html", ".js", ".json", ".md", ".mjs", ".py", ".ts", ".tsx",
    ".txt", ".yaml", ".yml",
}


class EvidenceIntegrityError(ValueError):
    pass


def _run(root: Path, *args: str) -> str:
    command = list(args)
    if command and command[0] == "npm":
        command[0] = shutil.which("npm.cmd") or shutil.which("npm") or "npm"
    result = subprocess.run(
        command, cwd=root, check=True, capture_output=True, text=True
    )
    return result.stdout.strip()


def git_output(root: Path, *args: str) -> str:
    return _run(root, "git", *args)


def canonical_bytes(path: Path) -> bytes:
    raw = path.read_bytes()
    return canonical_content(raw, path.suffix)


def canonical_content(raw: bytes, suffix: str) -> bytes:
    if suffix.lower() in TEXT_SUFFIXES:
        return raw.replace(b"\r\n", b"\n").replace(b"\r", b"\n")
    return raw


_WORKTREE_HASHES: dict[Path, str] | None = None


@contextmanager
def _stable_worktree() -> Iterator[None]:
    """Reuse working-tree hashes for the duration of one read-only pass.

    Milestone scopes overlap by design, so a single projection otherwise hashes
    the same file once per record. The cache exists only inside this block,
    which never writes to the tree, so it cannot mask a later mutation.
    """
    global _WORKTREE_HASHES
    if _WORKTREE_HASHES is not None:
        yield
        return
    _WORKTREE_HASHES = {}
    try:
        yield
    finally:
        _WORKTREE_HASHES = None


def canonical_hash(path: Path) -> str:
    cache = _WORKTREE_HASHES
    if cache is None:
        return hashlib.sha256(canonical_bytes(path)).hexdigest()
    key = path.resolve()
    if key not in cache:
        cache[key] = hashlib.sha256(canonical_bytes(path)).hexdigest()
    return cache[key]


_SCHEMA_VALIDATORS: dict[str, jsonschema.Draft202012Validator] = {}


def schema_validator(path: Path) -> jsonschema.Draft202012Validator | None:
    """Compile a JSON Schema once per distinct schema content.

    Every validity event is validated against the same schema file, so keying
    on the file's canonical content rather than its path or mtime makes repeat
    validation free while making a rewritten schema impossible to miss.
    """
    if not path.is_file():
        return None
    raw = canonical_bytes(path)
    key = hashlib.sha256(raw).hexdigest()
    validator = _SCHEMA_VALIDATORS.get(key)
    if validator is None:
        validator = jsonschema.Draft202012Validator(yaml.safe_load(raw.decode("utf-8")))
        _SCHEMA_VALIDATORS[key] = validator
    return validator


_COMMIT_TREES: dict[tuple[Path, str], str] = {}


def commit_tree(root: Path, commit: str) -> str:
    """Resolve a commit's tree, caching only immutable full object names.

    A 40-hex commit names fixed content, so its tree can never change. Anything
    else may be a moving ref and is resolved fresh every time.
    """
    if not re.fullmatch(r"[0-9a-f]{40}", commit):
        return git_output(root, "rev-parse", f"{commit}^{{tree}}")
    key = (root.resolve(), commit)
    if key not in _COMMIT_TREES:
        _COMMIT_TREES[key] = git_output(root, "rev-parse", f"{commit}^{{tree}}")
    return _COMMIT_TREES[key]


@lru_cache(maxsize=None)
def _git_tree_hashes(root: Path, commit: str) -> dict[str, str]:
    """Read and canonically hash a committed tree with one Git process."""
    result = subprocess.run(
        ["git", "archive", "--format=tar", commit],
        cwd=root,
        check=True,
        capture_output=True,
    )
    hashes: dict[str, str] = {}
    with tarfile.open(fileobj=io.BytesIO(result.stdout), mode="r:") as archive:
        for member in archive.getmembers():
            if not member.isfile():
                continue
            stream = archive.extractfile(member)
            if stream is None:
                continue
            hashes[member.name] = hashlib.sha256(
                canonical_content(stream.read(), Path(member.name).suffix)
            ).hexdigest()
    return hashes


def git_blob_hash(root: Path, commit: str, path: str) -> str:
    """Hash one committed path from the process-cached tree.

    Milestone scopes intentionally overlap. Loading one archive per subject
    commit avoids thousands of identical Git subprocesses on Windows.
    """
    hashes = _git_tree_hashes(root.resolve(), commit)
    if path not in hashes:
        raise subprocess.CalledProcessError(128, ["git", "archive", commit, path])
    return hashes[path]


def canonical_json_hash(value: Any) -> str:
    payload = json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def relative(root: Path, path: Path) -> str:
    return path.resolve().relative_to(root.resolve()).as_posix()


def _python_target(root: Path, command: str) -> Path | None:
    match = re.match(r"^python\s+([^\s]+\.py)(?:\s|$)", command)
    if not match:
        return None
    target = (root / match.group(1)).resolve()
    return target if target.is_file() else None


def tracked_paths(root: Path, commit: str = "HEAD") -> frozenset[str]:
    """Paths tracked by the commit under attestation.

    Scope must follow the subject commit rather than the index: an evidence
    record attests a commit, so a staged or stale index must not be able to
    widen or narrow what that record claims to cover.
    """
    return frozenset(_git_tree_hashes(root.resolve(), commit))


def _expand_scope_path(root: Path, value: str, commit: str = "HEAD") -> list[Path]:
    normalized = Path(value).as_posix().rstrip("/")
    tracked = tracked_paths(root.resolve(), commit)
    if normalized in tracked:
        path = root / normalized
        return [path] if path.is_file() else []
    prefix = f"{normalized}/"
    return [
        root / item
        for item in sorted(tracked)
        if item.startswith(prefix) and (root / item).is_file()
    ]


def scope_paths(root: Path, milestone: dict[str, Any], commit: str = "HEAD") -> list[Path]:
    declared = {
        "docs/program/milestone_schema.yaml",
        "docs/program/predicate_catalog.yaml",
        "docs/program/evidence_v2.schema.yaml",
        "docs/program/evidence_validity_event.schema.yaml",
        milestone["artifacts"][0],
        *milestone.get("evidence_inputs", []),
        "tools/program/program_contract.py",
        "tools/program/run_contract_checks.py",
        "tools/program/verify_milestone.py",
        "tools/program/evidence_integrity.py",
        "tools/program/execution_authority.py",
        "tools/program/compile_evidence_validity.py",
        "tools/program/compile_status.py",
        "tools/program/generate_checkpoint.py",
    }
    commands = [item["command"] for item in milestone["verification"]["automated"]]
    for command in commands:
        target = _python_target(root, command)
        if target:
            declared.add(relative(root, target))
        if command.startswith("npm --prefix web"):
            declared.update({"web/package.json", "web/package-lock.json", "web/src", "web/tests"})
    if any("verify_clean_clone.py" in command for command in commands):
        declared.update({"tools/program", "tests/program", "docs/program", "docs/validation"})
    paths = {
        item.resolve()
        for value in declared
        for item in _expand_scope_path(root, value, commit)
        if EVIDENCE_ROOT.as_posix() not in relative(root, item)
        and relative(root, item) not in {VALIDITY_LOG.as_posix(), VALIDITY_PROJECTION.as_posix()}
    }
    return sorted(paths)


def evidence_path(root: Path, milestone_id: str, evidence_id: str) -> Path:
    return root / EVIDENCE_ROOT / milestone_id / f"{evidence_id}.json"


def load_records(root: Path) -> dict[str, dict[str, Any]]:
    records: dict[str, dict[str, Any]] = {}
    base = root / EVIDENCE_ROOT
    if not base.is_dir():
        return records
    for path in sorted(base.glob("KQ-*/*.json")):
        record = json.loads(path.read_text(encoding="utf-8"))
        evidence_id = record.get("evidence_id")
        if evidence_id:
            records[evidence_id] = record
    return records


def latest_records_by_milestone(root: Path) -> dict[str, dict[str, Any]]:
    latest: dict[str, dict[str, Any]] = {}
    for record in load_records(root).values():
        milestone_id = record["milestone_id"]
        if milestone_id not in latest or record["generated_at"] > latest[milestone_id]["generated_at"]:
            latest[milestone_id] = record
    return latest


def load_events(root: Path) -> list[dict[str, Any]]:
    path = root / VALIDITY_LOG
    if not path.is_file():
        return []
    return [
        json.loads(line)
        for line in path.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]


def build_record(
    root: Path,
    milestone: dict[str, Any],
    checks: list[dict[str, Any]],
    commands: dict[str, dict[str, Any]],
    dependency_records: dict[str, dict[str, Any]],
) -> dict[str, Any]:
    subject_commit = git_output(root, "rev-parse", "HEAD")
    subject_tree = git_output(root, "rev-parse", f"{subject_commit}^{{tree}}")
    paths = scope_paths(root, milestone, subject_commit)
    inputs = {
        relative(root, path): canonical_hash(path)
        for path in paths
    }
    missing_declared = sorted(
        value for value in milestone.get("evidence_inputs", [])
        if value not in inputs
    )
    if missing_declared:
        raise EvidenceIntegrityError(
            f"{milestone['id']}: missing declared evidence inputs: {missing_declared}"
        )
    dependencies: dict[str, dict[str, str]] = {}
    for dependency in milestone["dependencies"]:
        upstream = dependency_records.get(dependency["id"])
        if upstream is None:
            raise EvidenceIntegrityError(
                f"{milestone['id']}: no v2 dependency evidence for {dependency['id']}"
            )
        dependencies[dependency["id"]] = {
            "evidence_id": upstream["evidence_id"],
            "sha256": canonical_json_hash(upstream),
        }
    evidence_id = f"{milestone['id']}-{subject_commit[:12]}"
    return {
        "schema_version": SCHEMA_VERSION,
        "evidence_id": evidence_id,
        "milestone_id": milestone["id"],
        "subject_commit": subject_commit,
        "subject_tree": subject_tree,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "milestone_contract_sha256": canonical_json_hash(milestone),
        "dependency_evidence": dependencies,
        "input_hashes": inputs,
        "output_hashes": {
            milestone["artifacts"][0]: canonical_hash(root / milestone["artifacts"][0])
        },
        "scope": {
            "kind": "affected_paths",
            "paths": sorted(inputs),
            "justification": (
                "The milestone is valid only while its declared inputs, verifier closure, "
                "contract artifact, and exercised web surface remain unchanged."
            ),
        },
        "toolchain": {
            "python": platform.python_version(),
            "node": _run(root, "node", "--version"),
            "npm": _run(root, "npm", "--version"),
        },
        "checks": checks,
        "commands": commands,
        "all_required_checks_passed": all(item.get("passed") is True for item in checks),
    }


def verify_record(
    root: Path,
    milestone: dict[str, Any],
    record: dict[str, Any],
    records: dict[str, dict[str, Any]] | None = None,
) -> list[str]:
    errors: list[str] = []
    validator = schema_validator(root / "docs/program/evidence_v2.schema.yaml")
    if validator is not None:
        schema_errors = sorted(
            validator.iter_errors(record),
            key=lambda item: list(item.path),
        )
        errors.extend(
            f"schema {'.'.join(str(part) for part in item.path)}: {item.message}"
            for item in schema_errors
        )
    required = {
        "schema_version", "evidence_id", "milestone_id", "subject_commit",
        "subject_tree", "generated_at", "milestone_contract_sha256",
        "dependency_evidence", "input_hashes", "output_hashes", "scope",
        "toolchain", "checks", "commands", "all_required_checks_passed",
    }
    missing = required - set(record)
    if missing:
        return [f"missing fields: {sorted(missing)}"]
    if record["schema_version"] != SCHEMA_VERSION:
        errors.append("unsupported evidence schema version")
    if record["milestone_id"] != milestone["id"]:
        errors.append("milestone ID mismatch")
    if record["milestone_contract_sha256"] != canonical_json_hash(milestone):
        errors.append("milestone contract is stale")
    try:
        expected_tree = commit_tree(root, record["subject_commit"])
    except subprocess.CalledProcessError:
        errors.append("subject commit is missing or invalid")
    else:
        if record["subject_tree"] != expected_tree:
            errors.append("subject tree does not match subject commit")
    scope = record["scope"]
    if scope.get("kind") not in {"whole_tree", "affected_paths", "control_only"}:
        errors.append("unknown validity scope")
    if scope.get("kind") == "control_only" and not str(scope.get("justification", "")).strip():
        errors.append("control-only scope requires justification")
    declared_inputs = set(milestone.get("evidence_inputs", []))
    if not declared_inputs <= set(record["input_hashes"]):
        errors.append(
            f"declared evidence inputs are unhashed: {sorted(declared_inputs - set(record['input_hashes']))}"
        )
    for value, expected in record["input_hashes"].items():
        path = root / value
        if not path.is_file() or canonical_hash(path) != expected:
            errors.append(f"input is missing or stale: {value}")
            continue
        try:
            subject_hash = git_blob_hash(root, record["subject_commit"], value)
        except subprocess.CalledProcessError:
            errors.append(f"input is absent from subject commit: {value}")
        else:
            if subject_hash != expected:
                errors.append(f"input does not match subject commit: {value}")
    for value, expected in record["output_hashes"].items():
        path = root / value
        if not path.is_file() or canonical_hash(path) != expected:
            errors.append(f"output is missing or stale: {value}")
    if not record["all_required_checks_passed"]:
        errors.append("required checks did not pass")
    if any(item.get("passed") is not True for item in record["checks"]):
        errors.append("one or more recorded checks failed")
    known = records or {}
    for dependency in milestone["dependencies"]:
        binding = record["dependency_evidence"].get(dependency["id"])
        if not binding:
            errors.append(f"missing dependency evidence: {dependency['id']}")
            continue
        upstream = known.get(binding["evidence_id"])
        if upstream is None or canonical_json_hash(upstream) != binding["sha256"]:
            errors.append(f"dependency evidence is missing or stale: {dependency['id']}")
    return errors


def compile_projection(
    root: Path,
    milestones: Iterable[dict[str, Any]],
) -> dict[str, Any]:
    """Project live validity, hashing each scoped file once for the whole pass."""
    with _stable_worktree():
        return _compile_projection(root, milestones)


def _compile_projection(
    root: Path,
    milestones: Iterable[dict[str, Any]],
) -> dict[str, Any]:
    milestone_map = {item["id"]: item for item in milestones}
    records = load_records(root)
    states: dict[str, dict[str, Any]] = {}
    event_validator = schema_validator(
        root / "docs/program/evidence_validity_event.schema.yaml"
    )
    for event in load_events(root):
        if event_validator is not None:
            errors = list(event_validator.iter_errors(event))
            if errors:
                raise EvidenceIntegrityError(
                    f"{event.get('event_id', '<unknown>')}: "
                    + "; ".join(item.message for item in errors)
                )
        milestone_id = event["milestone_id"]
        if milestone_id not in milestone_map:
            raise EvidenceIntegrityError(f"unknown validity-event milestone: {milestone_id}")
        if event["to"] not in VALIDITY_STATES:
            raise EvidenceIntegrityError(f"unknown validity state: {event['to']}")
        previous = states.get(milestone_id, {}).get("validity")
        if event.get("from") != previous:
            raise EvidenceIntegrityError(
                f"{event['event_id']}: expected from={previous!r}, got {event.get('from')!r}"
            )
        evidence_id = event.get("replacement_evidence_id") or event["evidence_id"]
        states[milestone_id] = {
            "validity": event["to"],
            "evidence_id": evidence_id,
            "event_id": event["event_id"],
            "reason": event["rationale"],
        }
    verification_errors: dict[str, list[str]] = {}
    for milestone_id, state in states.items():
        if state["validity"] != "Current":
            continue
        record = records.get(state["evidence_id"])
        if record is None:
            verification_errors[milestone_id] = ["current evidence record is missing"]
            state["validity"] = "ReverificationRequired"
            continue
        errors = verify_record(root, milestone_map[milestone_id], record, records)
        if errors:
            verification_errors[milestone_id] = errors
            state["validity"] = "ReverificationRequired"
    changed = True
    while changed:
        changed = False
        for milestone_id, state in states.items():
            if state["validity"] != "Current":
                continue
            record = records.get(state["evidence_id"])
            if record is None:
                continue
            dependency_errors: list[str] = []
            for dependency in milestone_map[milestone_id]["dependencies"]:
                upstream_state = states.get(dependency["id"])
                binding = record["dependency_evidence"].get(dependency["id"], {})
                if (
                    not upstream_state
                    or upstream_state["validity"] != "Current"
                    or binding.get("evidence_id") != upstream_state.get("evidence_id")
                ):
                    dependency_errors.append(
                        f"dependency is not bound to current evidence: {dependency['id']}"
                    )
            if dependency_errors:
                verification_errors.setdefault(milestone_id, []).extend(dependency_errors)
                state["validity"] = "ReverificationRequired"
                changed = True
    completed = sorted(
        item["id"] for item in milestone_map.values()
        if item["milestone_status"] in COMPLETED_STATUSES
    )
    for milestone_id in completed:
        states.setdefault(
            milestone_id,
            {
                "validity": "ReverificationRequired",
                "evidence_id": f"legacy:{milestone_id}",
                "event_id": None,
                "reason": "Legacy evidence has not been migrated to evidence schema v2.",
            },
        )
    return {
        "schema_version": 1,
        "program_id": "kinematiciq-expanded-10",
        "states": dict(sorted(states.items())),
        "verification_errors": dict(sorted(verification_errors.items())),
        "summary": {
            state: sorted(mid for mid, value in states.items() if value["validity"] == state)
            for state in sorted(VALIDITY_STATES)
        },
    }


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(value, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
        newline="\n",
    )
