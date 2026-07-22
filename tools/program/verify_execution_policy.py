from __future__ import annotations

import argparse
import subprocess
from pathlib import Path

import yaml


INTERRUPTIONS = {
    "participant_consent_or_privacy", "inaccessible_credentials", "fee_or_payment",
    "qualified_human_labeling", "instrumented_reference_capture", "legal_or_license_acceptance",
    "materially_conflicting_product_choice", "failed_preregistered_gate_product_decision",
    "production_deployment_authority",
}
RECOVERY_FORBIDDEN = {
    "force_push", "rewrite_published_history", "delete_evidence", "weaken_gate",
    "retune_locked_evidence", "change_public_behavior_to_pass",
}


class ExecutionPolicyError(ValueError):
    pass


def verify_policy(policy: dict, registry: dict, root: Path, check_worktree: bool = False) -> None:
    errors: list[str] = []
    registry_policy = registry["registry_policy"]
    git = policy.get("git", {})
    deployment = policy.get("deployment", {})
    if git.get("work_branch") != registry_policy["default_branch"]:
        errors.append("work branch differs from registry policy")
    if git.get("force_push") != "forbidden" or git.get("history_rewrite") != "forbidden":
        errors.append("force push and history rewrite must be forbidden")
    if git.get("direct_master_merge") != "separate_authority_required":
        errors.append("direct master merge requires separate authority")
    if deployment != {"automatic": False, "production": "separate_authority_required", "public_activation": "separate_authority_required"}:
        errors.append("deployment and public activation must require separate authority")
    if registry_policy["automatic_commit"] is not True or registry_policy["automatic_push"] is not True:
        errors.append("registry must authorize verified milestone commit and push")
    if registry_policy["automatic_production_deploy"] is not False:
        errors.append("automatic production deployment must remain disabled")

    retries = policy.get("retries", {})
    for milestone in registry["milestones"]:
        expected = retries.get("locked_evidence_additional_attempts") if milestone["failure"]["locked_evidence_retuning_forbidden"] else retries.get("default_additional_attempts")
        if milestone["failure"]["retry_budget"] != expected:
            errors.append(f"{milestone['id']} retry budget differs from execution policy")
        if not milestone["commit_policy"]["commit_on_pass"] or not milestone["commit_policy"]["push_on_pass"]:
            errors.append(f"{milestone['id']} disables automatic commit or push")
    if retries.get("nonretryable") is None or "scientific_gate_result" not in retries["nonretryable"]:
        errors.append("scientific gate results must be nonretryable")

    recovery = policy.get("recovery", {})
    if not RECOVERY_FORBIDDEN <= set(recovery.get("forbidden", [])) or recovery.get("preserve_negative_evidence") is not True:
        errors.append("recovery must preserve evidence and forbid destructive/gate-weakening actions")
    if set(policy.get("interruptions", {}).get("gates", [])) != INTERRUPTIONS:
        errors.append("genuine interruption gate set is incomplete or expanded")
    continuation = policy.get("continuation", {})
    if continuation.get("continue_unaffected_ready_queue") is not True or continuation.get("global_pause") is not False:
        errors.append("unaffected ready work must continue without a global pause")
    if policy.get("abstention", {}).get("insufficient_observability") != "metric_level":
        errors.append("insufficient observability must use metric-level abstention")
    scheduling = policy.get("scheduling", {})
    capacity = scheduling.get("capacity", {})
    if capacity.get("worker_count") != len(scheduling.get("workers", [])) or capacity.get("committed_capacity_hours") != 134:
        errors.append("scheduling capacity does not match the registered Wave 1 model")
    if check_worktree:
        branch = subprocess.run(["git", "branch", "--show-current"], cwd=root, check=True, capture_output=True, text=True).stdout.strip()
        if branch != git.get("work_branch"):
            errors.append(f"active branch {branch} differs from work branch")
    if errors:
        raise ExecutionPolicyError("; ".join(errors))


def main() -> int:
    parser = argparse.ArgumentParser(description="Verify the executable Expanded-10 autonomy policy.")
    parser.add_argument("--policy", required=True)
    parser.add_argument("--registry", default="docs/program/milestone_registry.yaml")
    parser.add_argument("--check-worktree", action="store_true")
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[2]
    policy = yaml.safe_load((root / args.policy).read_text(encoding="utf-8"))
    registry = yaml.safe_load((root / args.registry).read_text(encoding="utf-8"))
    try:
        verify_policy(policy, registry, root, args.check_worktree)
    except ExecutionPolicyError as error:
        print(f"FAIL: {error}")
        return 1
    print(f"PASS: verified {args.policy}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
