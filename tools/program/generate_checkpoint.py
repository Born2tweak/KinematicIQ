from __future__ import annotations

import argparse
import hashlib
import json
from collections import Counter
from pathlib import Path

import yaml


TRIGGERS = ["push", "lifecycle_transition", "replan", "release_change", "blocker_change"]
COMPLETED_STATUSES = {"Passed", "SkippedByDecision", "Retired"}
BLOCKED_STATUSES = {"BlockedHuman", "BlockedExternal", "FailedTechnical"}


def _text_hash(path: Path) -> str:
    text = path.read_text(encoding="utf-8").replace("\r\n", "\n")
    return hashlib.sha256(text.encode()).hexdigest()


def _yaml(path: Path) -> dict:
    return yaml.safe_load(path.read_text(encoding="utf-8"))


def _explicit_dispositions(evidence: list[dict]) -> dict:
    """Derive lifecycle/release only from explicit, passing scientific evidence."""
    transitions: list[dict] = []
    release_eligible: set[str] = set()
    failed_gate: set[str] = set()
    blocked: dict[str, str] = {}
    for item in evidence:
        if not item.get("all_required_checks_passed") or not item.get("protocol_id"):
            continue
        protocol_id = str(item["protocol_id"])
        result = item.get("result_code")
        lifecycle = item.get("protocol_lifecycle")
        if lifecycle:
            transitions.append(
                {"milestone_id": item.get("milestone_id"), "protocol_id": protocol_id, "lifecycle": lifecycle, "result_code": result}
            )
        if result == "RELEASE_ELIGIBLE" and item.get("upstream_result_code") == "GATE_PASS":
            release_eligible.add(protocol_id)
        elif result == "GATE_FAIL_RECORDED":
            failed_gate.add(protocol_id)
        elif result in {"BLOCKED_HUMAN_WITH_OWNER", "BLOCKED_EXTERNAL_WITH_OWNER"}:
            blocked[protocol_id] = result
    return {
        "transitions": sorted(transitions, key=lambda item: (item["protocol_id"], item.get("milestone_id") or "")),
        "release_eligible_protocols": sorted(release_eligible),
        "failed_gate_protocols": sorted(failed_gate),
        "blocked_protocols": dict(sorted(blocked.items())),
    }


def compile_checkpoint(root: Path) -> dict:
    paths = {
        "status": root / "docs/status/program_status.json",
        "registry": root / "docs/program/milestone_registry.yaml",
        "validation": root / "docs/validation/protocol_validation_registry.yaml",
        "resources": root / "docs/program/resource_registry.yaml",
        "research": root / "docs/research/research_questions.yaml",
        "inflections": root / "docs/program/inflection_log.ndjson",
    }
    status = json.loads(paths["status"].read_text(encoding="utf-8"))
    registry = _yaml(paths["registry"])
    validation = _yaml(paths["validation"])
    resources = _yaml(paths["resources"])
    research = _yaml(paths["research"])
    inflections = [json.loads(line) for line in paths["inflections"].read_text(encoding="utf-8").splitlines() if line.strip()]
    evidence_paths = sorted((root / "docs/status/milestones").glob("KQ-*.json"))
    evidence = [json.loads(path.read_text(encoding="utf-8")) for path in evidence_paths]
    evidence_by_id = {item.get("milestone_id"): item for item in evidence if item.get("milestone_id")}

    milestones = registry["milestones"]
    completed = sorted(item["id"] for item in milestones if item["milestone_status"] in COMPLETED_STATUSES)
    active = sorted(item["id"] for item in milestones if item["milestone_status"] in {"Ready", "Running"})
    status_blockers = {
        state: sorted(item["id"] for item in milestones if item["milestone_status"] == state)
        for state in sorted(BLOCKED_STATUSES)
    }
    missing_evidence = sorted(item for item in completed if item not in evidence_by_id)
    failed_evidence = sorted(
        item for item, record in evidence_by_id.items() if not record.get("all_required_checks_passed", False)
    )
    verified_evidence = sorted(
        item for item, record in evidence_by_id.items() if record.get("all_required_checks_passed", False)
    )
    subject_commits = sorted({record["subject_commit"] for record in evidence if record.get("subject_commit")})

    contracts = Counter(item["contract_status"] for item in validation["protocols"].values())
    evidence_packs = Counter(item["evidence_pack_status"] for item in validation["protocols"].values())
    resource_states = Counter(item["status"] for item in resources["resources"])
    resource_blocked = status["milestones"]["resource_blocked"]
    dispositions = _explicit_dispositions(evidence)

    accepted_research: list[dict] = []
    conflicting_research: list[dict] = []
    unresolved_research: list[dict] = []
    for question in research["questions"]:
        synthesis = question.get("synthesis", {})
        accepted_research.extend({"question_id": question["question_id"], "finding": value} for value in synthesis.get("confirmed", []))
        conflicting_research.extend({"question_id": question["question_id"], "finding": value} for value in synthesis.get("invalidated", []))
        unresolved_research.extend({"question_id": question["question_id"], "finding": value} for value in synthesis.get("unresolved", []))

    source_paths = list(paths.values()) + evidence_paths
    next_range = status["milestones"]["committed_wave_ready_ids"] or status["milestones"]["dependency_ready_ids"]
    return {
        "schema_version": 1,
        "program_id": status["program_id"],
        "triggers": TRIGGERS,
        "source_hashes": {path.relative_to(root).as_posix(): _text_hash(path) for path in source_paths},
        "push_summary": {
            "branch": status["authority"]["branch"],
            "completed_ids": completed,
            "objective_evidence": {
                "verified_ids": verified_evidence,
                "missing_ids": missing_evidence,
                "failed_ids": failed_evidence,
            },
            "verification_failures": failed_evidence,
            "subject_commits": subject_commits,
            "active_work_ids": active,
            "next_executable_range": next_range,
        },
        "lifecycle_summary": {
            "public_protocols": status["protocols"]["available"],
            "unavailable_protocols": status["protocols"]["unavailable"],
            "explicit_protocol_state_changes": dispositions["transitions"],
            "validation_contract_status_counts": dict(sorted(contracts.items())),
            "evidence_pack_status_counts": dict(sorted(evidence_packs.items())),
        },
        "research_summary": {
            "open_question_ids": sorted(question["question_id"] for question in research["questions"]),
            "accepted": accepted_research,
            "conflicting": conflicting_research,
            "unresolved": unresolved_research,
        },
        "replan_summary": {
            "recorded_inflection_count": len(inflections),
            "roadmap_changes": [
                {"event_id": event["event_id"], "changed_fields": event["changed_fields"], "affected_seeds": event["affected_seeds"]}
                for event in inflections
            ],
            "dependency_ready_ids": status["milestones"]["dependency_ready_ids"],
            "committed_wave_ready_ids": status["milestones"]["committed_wave_ready_ids"],
        },
        "release_summary": {
            "rule": status["protocols"]["release_rule"],
            "release_eligible_protocols": dispositions["release_eligible_protocols"],
            "failed_gate_protocols": dispositions["failed_gate_protocols"],
            "blocked_protocols": dispositions["blocked_protocols"],
            "automatic_production_deploy": status["authority"]["automatic_production_deploy"],
        },
        "blocker_summary": {
            "milestone_blockers": status_blockers,
            "resource_status_counts": dict(sorted(resource_states.items())),
            "resource_blocked_milestone_count": len(resource_blocked),
            "resource_blocked_milestone_ids": sorted(resource_blocked),
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate or verify the deterministic Expanded-10 checkpoint.")
    parser.add_argument("--output", default="docs/status/program_checkpoint.json")
    parser.add_argument("--verify", action="store_true")
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[2]
    output = root / args.output
    expected = compile_checkpoint(root)
    if args.verify:
        if not output.is_file() or json.loads(output.read_text(encoding="utf-8")) != expected:
            print(f"FAIL: {args.output} is missing or stale")
            return 1
        print(f"PASS: verified {args.output}")
        return 0
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(expected, indent=2, sort_keys=True) + "\n", encoding="utf-8", newline="\n")
    print(f"PASS: generated {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
