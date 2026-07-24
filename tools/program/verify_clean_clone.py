from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


def run(command: list[str], cwd: Path) -> dict[str, Any]:
    try:
        result = subprocess.run(command, cwd=cwd, capture_output=True, text=True)
    except OSError as error:
        return {
            "command": command,
            "exit_code": 127,
            "accepted": False,
            "stdout": "",
            "stderr": str(error),
        }
    return {
        "command": command,
        "exit_code": result.returncode,
        "accepted": result.returncode == 0,
        "stdout": result.stdout,
        "stderr": result.stderr,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Verify Expanded-10 from a clean single-branch clone.")
    parser.add_argument("--repository", default="https://github.com/Born2tweak/KinematicIQ.git")
    parser.add_argument("--branch", default="agent/evidence-integrity-wave-2")
    parser.add_argument("--evidence-out")
    parser.add_argument("--keep-clone", action="store_true")
    parser.add_argument("--pending-evidence-id", action="append", default=[])
    args = parser.parse_args()

    temp_root = Path(tempfile.mkdtemp(prefix="kinematiciq-clean-clone-"))
    clone = temp_root / "KinematicIQ"
    npm = shutil.which("npm.cmd") or shutil.which("npm") or "npm"
    checks: list[dict[str, Any]] = []
    try:
        checks.append(run(["git", "clone", "--branch", args.branch, "--single-branch", args.repository, str(clone)], temp_root))
        if not checks[-1]["accepted"]:
            raise RuntimeError("clone failed")
        evidence_command = ["python", "tools/program/verify_evidence.py", "--all"]
        for milestone_id in args.pending_evidence_id:
            evidence_command.extend(["--exclude", milestone_id])
        commands = [
            ["python", "-m", "pip", "install", "-r", "requirements-program.txt"],
            ["python", "tools/program/verify_milestone.py", "--structure-only"],
            ["python", "-m", "unittest", "discover", "-s", "tests/program", "-p", "test_*.py", "-v"],
            ["python", "tools/program/schedule_wave.py", "--verify", "--output", "docs/program/WAVE_1_SCHEDULE.yaml"],
            ["python", "tools/program/transition_wave.py", "--verify", "--output", "docs/program/ACTIVE_WAVE.yaml"],
            ["python", "tools/program/compile_evidence_validity.py", "--verify"],
            evidence_command,
            ["python", "tools/program/compile_status.py", "--verify", "--output", "docs/status/program_status.json"],
            ["python", "tools/program/generate_checkpoint.py", "--verify", "--output", "docs/status/program_checkpoint.json"],
            ["python", "tools/program/verify_authority.py", "--manifest", "docs/program/artifacts/kq-011.yaml"],
            ["python", "tools/program/verify_execution_policy.py", "--policy", "docs/program/execution_policy.yaml"],
            ["python", "tools/program/validate_traceability.py", "--contract", "docs/program/traceability_contract.yaml"],
            [npm, "--prefix", "web", "ci"],
            [npm, "--prefix", "web", "run", "build"],
            [npm, "--prefix", "web", "test", "--", "--run", "--reporter=dot"],
            ["git", "diff", "--exit-code"],
            ["git", "status", "--porcelain", "--untracked-files=all"],
        ]
        for command in commands:
            record = run(command, clone)
            if command[:3] == ["git", "status", "--porcelain"]:
                record["accepted"] = record["exit_code"] == 0 and not record["stdout"].strip()
            checks.append(record)
            if not record["accepted"]:
                break
        head = run(["git", "rev-parse", "HEAD"], clone)
        status = run(["git", "status", "--short", "--ignored"], clone)
        frontier_path = clone / "docs/status/program_status.json"
        checkpoint_path = clone / "docs/status/program_checkpoint.json"
        payload = {
            "schema_version": 1,
            "branch": args.branch,
            "repository": args.repository,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "clone_head": head["stdout"].strip(),
            "reproduced_frontier": json.loads(frontier_path.read_text(encoding="utf-8")) if frontier_path.is_file() else None,
            "reproduced_checkpoint": json.loads(checkpoint_path.read_text(encoding="utf-8")) if checkpoint_path.is_file() else None,
            "checks": checks,
            "ignored_status": status["stdout"].splitlines(),
            "all_required_checks_passed": all(item["accepted"] for item in checks),
            "replay_policy": "Corpus evaluation is deferred to KQ-016/KQ-017; this gate verifies controller, build, tests, evidence validity, and worktree integrity.",
        }
        rendered = json.dumps(payload, indent=2, sort_keys=True) + "\n"
        if args.evidence_out:
            evidence_path = Path(args.evidence_out).resolve()
            evidence_path.parent.mkdir(parents=True, exist_ok=True)
            evidence_path.write_text(rendered, encoding="utf-8")
        print(rendered, end="")
        return 0 if payload["all_required_checks_passed"] else 1
    except RuntimeError as error:
        print(json.dumps({"error": str(error), "checks": checks}, indent=2))
        return 1
    finally:
        if args.keep_clone:
            print(f"clone retained at {clone}")
        else:
            shutil.rmtree(temp_root, ignore_errors=True)


if __name__ == "__main__":
    raise SystemExit(main())
