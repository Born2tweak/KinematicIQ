from __future__ import annotations

import argparse
from pathlib import Path

import yaml


class ResearchWorkflowError(ValueError):
    pass


REQUIRED = {"question_id", "record_class", "trigger_id", "status", "decision_question", "affected_objects", "source_policy", "budget", "exit_criteria", "synthesis", "decision_impact", "scientific_evidence", "completed_evidence_pack"}


def validate_question(question: dict) -> None:
    errors: list[str] = []
    missing = REQUIRED - set(question)
    if missing:
        errors.append(f"missing workflow fields: {sorted(missing)}")
    if not str(question.get("question_id", "")).startswith("RQ-"):
        errors.append("question_id must use RQ namespace")
    if not question.get("exit_criteria") or not question.get("affected_objects"):
        errors.append("exit criteria and affected objects must be nonempty")
    source_policy = question.get("source_policy", {})
    if not source_policy.get("priority") or not source_policy.get("excluded"):
        errors.append("source priority and exclusions are required")
    budget = question.get("budget", {})
    if budget.get("max_sources", 0) < 1 or not 0 <= budget.get("max_worker_retries", -1) <= 2 or budget.get("max_parallel_workers", 0) < 1:
        errors.append("research budget is invalid")
    synthesis = question.get("synthesis", {})
    if set(synthesis) != {"confirmed", "changed", "invalidated", "unresolved"}:
        errors.append("synthesis must classify confirmed, changed, invalidated, and unresolved objects")
    impact = question.get("decision_impact", {})
    if impact.get("completed_nodes_changed") != [] or impact.get("public_claims_changed") != []:
        errors.append("fixture cannot mutate completed nodes or public claims")
    if question.get("record_class") == "orchestration_fixture_only" and (question.get("scientific_evidence") or question.get("completed_evidence_pack")):
        errors.append("orchestration fixture cannot claim scientific evidence")
    if errors:
        raise ResearchWorkflowError("; ".join(errors))


def verify_registry(registry: dict) -> None:
    questions = registry.get("questions")
    if not isinstance(questions, list):
        raise ResearchWorkflowError("questions must be a list")
    ids = [item.get("question_id") for item in questions]
    if len(ids) != len(set(ids)):
        raise ResearchWorkflowError("question IDs must be unique")
    for question in questions:
        validate_question(question)


def main() -> int:
    parser = argparse.ArgumentParser(description="Verify bounded research-question workflow records.")
    parser.add_argument("--registry", required=True)
    parser.add_argument("--fixture", required=True)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[2]
    registry = yaml.safe_load((root / args.registry).read_text(encoding="utf-8"))
    fixture = yaml.safe_load((root / args.fixture).read_text(encoding="utf-8"))
    try:
        verify_registry(registry)
        validate_question(fixture)
    except ResearchWorkflowError as error:
        print(f"FAIL: {error}")
        return 1
    print("PASS: research registry and orchestration-only fixture satisfy the bounded workflow")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
