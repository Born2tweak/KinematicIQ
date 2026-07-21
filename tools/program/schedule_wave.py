#!/usr/bin/env python3
"""Generate and verify the deterministic Expanded-10 Wave 1 schedule."""

from __future__ import annotations

import argparse
import hashlib
import json
import math
from pathlib import Path
from typing import Any, Iterable

import yaml


COMMITTED_IDS = tuple(f"KQ-{number:03d}" for number in range(1, 16))
PROBABLE_IDS = (
    "KQ-016", "KQ-017", "KQ-018", "KQ-019", "KQ-022",
    "KQ-025", "KQ-026", "KQ-029", "KQ-030",
)
STRETCH_IDS = (
    "KQ-020", "KQ-021", "KQ-023", "KQ-024", "KQ-027",
    "KQ-028", "KQ-031", "KQ-032", "KQ-033", "KQ-034", "KQ-035",
)
WORKERS = (
    {"id": "W1", "capabilities": ["code_and_architecture", "program_contracts"], "mutation_lane": "A"},
    {"id": "W2", "capabilities": ["code_and_architecture", "verification_and_fixtures"], "mutation_lane": "B"},
    {"id": "W3", "capabilities": ["program_contracts", "research_and_docs"], "mutation_lane": None},
    {"id": "W4", "capabilities": ["review", "synthesis", "replanning"], "mutation_lane": None},
)
OVERHEAD = (
    {"id": "OH-REVIEW", "hours": 7, "worker_id": "W4", "window": "distributed_across_days_1_7", "start_condition": "each review follows a coherent milestone diff", "purpose": "Daily diff and unsupported-claim review"},
    {"id": "OH-SYNTHESIS", "hours": 5, "worker_id": "W4", "window": "at_integration_boundaries_days_3_7", "start_condition": "two or more research, fixture, or integration outputs require synthesis", "purpose": "Fixture and integration synthesis"},
    {"id": "OH-REPLAN", "hours": 4, "worker_id": "W4", "window": "at_checkpoint_or_state_transition", "start_condition": "a pass, block, failure, estimate change, or checkpoint produces new evidence", "purpose": "Checkpoint evidence and dependency replan"},
)
POLICY = {
    "worker_count": 4,
    "productive_hours_per_worker_day": 6,
    "wave_days": 7,
    "gross_capacity_hours": 168,
    "planning_utilization_percent": 80,
    "committed_capacity_hours": 134,
    "maximum_concurrent_code_mutations": 2,
    "maximum_concurrent_research_jobs": 3,
    "reserved_review_synthesis_workers": 1,
}


class ScheduleError(ValueError):
    """Raised when a schedule violates its executable contract."""


def _load_yaml(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8") as stream:
        value = yaml.safe_load(stream)
    if not isinstance(value, dict):
        raise ScheduleError(f"{path} must contain a YAML mapping")
    return value


def _sha256(path: Path) -> str:
    canonical_text = path.read_text(encoding="utf-8").replace("\r\n", "\n")
    return hashlib.sha256(canonical_text.encode("utf-8")).hexdigest()


def _milestone_map(registry: dict[str, Any]) -> dict[str, dict[str, Any]]:
    milestones = registry.get("milestones")
    if not isinstance(milestones, list):
        raise ScheduleError("registry milestones must be a list")
    result = {item["id"]: item for item in milestones}
    if len(result) != len(milestones):
        raise ScheduleError("registry milestone IDs must be unique")
    return result


def _dependencies(milestone: dict[str, Any]) -> list[str]:
    return [dependency["id"] for dependency in milestone.get("dependencies", [])]


def _ancestor_closure(milestone_id: str, milestones: dict[str, dict[str, Any]]) -> list[str]:
    found: set[str] = set()

    def visit(current_id: str, stack: set[str]) -> None:
        if current_id in stack:
            raise ScheduleError(f"dependency cycle contains {current_id}")
        for dependency_id in _dependencies(milestones[current_id]):
            if dependency_id not in milestones:
                raise ScheduleError(f"{current_id} references unknown dependency {dependency_id}")
            if dependency_id not in found:
                found.add(dependency_id)
                visit(dependency_id, stack | {current_id})

    visit(milestone_id, set())
    return sorted(found)


def _imported_satisfied(
    milestones: dict[str, dict[str, Any]], registry_path: Path
) -> tuple[list[str], list[dict[str, str]]]:
    """Import only registry-passed milestones backed by an explicit passing evidence file."""
    root = registry_path.resolve().parents[2]
    imported: list[str] = []
    evidence: list[dict[str, str]] = []
    for milestone_id, milestone in sorted(milestones.items()):
        if milestone.get("milestone_status") != "Passed":
            continue
        candidate = root / "docs" / "status" / "milestones" / f"{milestone_id}.json"
        if not candidate.is_file():
            continue
        try:
            record = json.loads(candidate.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        if record.get("milestone_id") == milestone_id and record.get("all_required_checks_passed") is True:
            imported.append(milestone_id)
            evidence.append({"id": milestone_id, "path": candidate.relative_to(root).as_posix(), "sha256": _sha256(candidate)})
    return imported, evidence


def _required_capability(milestone: dict[str, Any]) -> str:
    if milestone.get("commit_policy", {}).get("class") == "code_atomic":
        return "code_and_architecture"
    if milestone.get("class") == "blocking_kernel":
        return "program_contracts"
    return "research_and_docs"


def _schedule_committed(
    milestones: dict[str, dict[str, Any]], imported: set[str]
) -> list[dict[str, Any]]:
    worker_available = {worker["id"]: 0.0 for worker in WORKERS if worker["id"] != "W4"}
    finish: dict[str, float] = {milestone_id: 0.0 for milestone_id in imported}
    pending = [milestone_id for milestone_id in COMMITTED_IDS if milestone_id not in imported]
    scheduled: list[dict[str, Any]] = []

    downstream: dict[str, list[str]] = {milestone_id: [] for milestone_id in COMMITTED_IDS}
    for milestone_id in COMMITTED_IDS:
        for dependency_id in _dependencies(milestones[milestone_id]):
            if dependency_id in downstream:
                downstream[dependency_id].append(milestone_id)

    critical_tail_cache: dict[str, float] = {}

    def critical_tail_hours(milestone_id: str) -> float:
        if milestone_id not in critical_tail_cache:
            own_hours = float(milestones[milestone_id]["expected_work_hours"])
            child_tail = max((critical_tail_hours(child) for child in downstream[milestone_id]), default=0.0)
            critical_tail_cache[milestone_id] = own_hours + child_tail
        return critical_tail_cache[milestone_id]

    while pending:
        ready = [
            milestone_id for milestone_id in pending
            if all(dependency in finish for dependency in _dependencies(milestones[milestone_id]))
        ]
        if not ready:
            unresolved = {mid: _dependencies(milestones[mid]) for mid in pending}
            raise ScheduleError(f"committed dependency closure cannot be scheduled: {unresolved}")
        milestone_id = min(ready, key=lambda item: (-critical_tail_hours(item), item))
        milestone = milestones[milestone_id]
        capability = _required_capability(milestone)
        eligible = [
            worker for worker in WORKERS
            if worker["id"] != "W4" and capability in worker["capabilities"]
        ]
        dependency_finish = max((finish[dep] for dep in _dependencies(milestone)), default=0.0)
        worker = min(eligible, key=lambda item: (max(worker_available[item["id"]], dependency_finish), item["id"]))
        start = max(worker_available[worker["id"]], dependency_finish)
        hours = float(milestone["expected_work_hours"])
        end = start + hours
        worker_available[worker["id"]] = end
        finish[milestone_id] = end
        pending.remove(milestone_id)
        scheduled.append({
            "id": milestone_id,
            "title": milestone["title"],
            "hours": int(hours) if hours.is_integer() else hours,
            "dependencies": _dependencies(milestone),
            "unsatisfied_ancestor_closure_at_wave_start": [
                ancestor for ancestor in _ancestor_closure(milestone_id, milestones) if ancestor not in imported
            ],
            "required_capability": capability,
            "worker_id": worker["id"],
            "mutation_lane": worker["mutation_lane"] if capability == "code_and_architecture" else None,
            "start_condition": "all dependencies have an accepted passing or controlled-skip disposition",
            "window": {
                "start_productive_hour": int(start) if start.is_integer() else start,
                "finish_productive_hour": int(end) if end.is_integer() else end,
                "earliest_start_day": int(start // 6) + 1,
                "latest_finish_day": int(math.ceil(end / 6)),
            },
        })
    return scheduled


def _band_entries(
    ids: Iterable[str], band: str, milestones: dict[str, dict[str, Any]], imported: set[str]
) -> list[dict[str, Any]]:
    entries = []
    for milestone_id in ids:
        milestone = milestones[milestone_id]
        resources = list(milestone.get("resource_dependencies", []))
        unsatisfied_ancestors = [
            ancestor for ancestor in _ancestor_closure(milestone_id, milestones) if ancestor not in imported
        ]
        if band == "external_wait":
            condition = "all listed resources are READY and all dependencies have accepted dispositions"
        elif band == "probable":
            condition = "promote only after committed evidence preserves capacity; then satisfy all dependencies"
        elif band == "stretch":
            condition = "promote only from measured throughput after committed and probable work; then satisfy all dependencies"
        else:
            condition = "promote in a later replan; satisfy all dependencies and resource gates before start"
        entry = {
            "id": milestone_id,
            "title": milestone["title"],
            "hours": milestone["expected_work_hours"],
            "dependencies": _dependencies(milestone),
            "unsatisfied_ancestor_count_at_wave_start": len(unsatisfied_ancestors),
            "required_capability": _required_capability(milestone),
            "worker_id": None,
            "mutation_lane": None,
            "resource_dependencies": resources,
            "start_condition": condition,
            "window": "not_committed_or_slotted",
        }
        if band in {"probable", "stretch"}:
            entry["unsatisfied_ancestor_closure_at_wave_start"] = unsatisfied_ancestors
        entries.append(entry)
    return entries


def build_manifest(registry_path: Path, resource_path: Path) -> dict[str, Any]:
    registry = _load_yaml(registry_path)
    resources = _load_yaml(resource_path)
    milestones = _milestone_map(registry)
    expected = set(COMMITTED_IDS) | set(PROBABLE_IDS) | set(STRETCH_IDS)
    missing = expected - set(milestones)
    if missing:
        raise ScheduleError(f"registry is missing scheduled IDs: {sorted(missing)}")

    imported_ids, imported_evidence = _imported_satisfied(milestones, registry_path)
    imported = set(imported_ids)
    resource_status = {item["id"]: item["status"] for item in resources.get("resources", [])}
    direct_external = {
        milestone_id for milestone_id, milestone in milestones.items()
        if any(resource_status.get(resource_id) != "READY" for resource_id in milestone.get("resource_dependencies", []))
    }
    classified = expected | direct_external
    deferred_ids = sorted(set(milestones) - classified)
    committed_schedule = _schedule_committed(milestones, imported)
    committed_hours = sum(item["hours"] for item in committed_schedule)
    overhead_hours = sum(item["hours"] for item in OVERHEAD)

    manifest = {
        "schema_version": 1,
        "program_id": registry.get("program_id"),
        "wave_id": "expanded-10-wave-1",
        "sources": {
            "milestone_registry": registry_path.as_posix(),
            "milestone_registry_sha256": _sha256(registry_path),
            "resource_registry": resource_path.as_posix(),
            "resource_registry_sha256": _sha256(resource_path),
        },
        "policy": POLICY,
        "workers": list(WORKERS),
        "imported_satisfied": {
            "ids": imported_ids,
            "evidence": imported_evidence,
            "explanation": (
                "Only registry-Passed milestones with a matching passing status artifact are imported. "
                + ("Evidence-backed imports are listed above." if imported_ids else "No such evidence exists; no milestone is assumed satisfied.")
            ),
        },
        "capacity": {
            "committed_milestone_hours": committed_hours,
            "review_synthesis_replan_overhead_hours": overhead_hours,
            "committed_scheduled_hours": committed_hours + overhead_hours,
            "committed_capacity_hours": POLICY["committed_capacity_hours"],
            "uncommitted_capacity_hours": POLICY["committed_capacity_hours"] - committed_hours - overhead_hours,
        },
        "review_synthesis_constraints": {
            "reserved_worker_id": "W4",
            "rule": "W4 receives no milestone mutation assignment and remains the review/synthesis slot.",
            "overhead": list(OVERHEAD),
        },
        "bands": {
            "committed": {
                "ids": list(COMMITTED_IDS),
                "hours": committed_hours,
                "schedule": committed_schedule,
            },
            "probable": {
                "ids": list(PROBABLE_IDS),
                "hours": sum(milestones[mid]["expected_work_hours"] for mid in PROBABLE_IDS if mid not in imported),
                "items": _band_entries(PROBABLE_IDS, "probable", milestones, imported),
            },
            "stretch": {
                "ids": list(STRETCH_IDS),
                "hours": sum(milestones[mid]["expected_work_hours"] for mid in STRETCH_IDS if mid not in imported),
                "items": _band_entries(STRETCH_IDS, "stretch", milestones, imported),
            },
            "external_wait": {
                "ids": sorted(direct_external),
                "hours": sum(milestones[mid]["expected_work_hours"] for mid in direct_external if mid not in imported),
                "items": _band_entries(sorted(direct_external), "external_wait", milestones, imported),
            },
            "deferred": {
                "ids": deferred_ids,
                "hours": sum(milestones[mid]["expected_work_hours"] for mid in deferred_ids if mid not in imported),
                "items": _band_entries(deferred_ids, "deferred", milestones, imported),
            },
        },
        "scope_notes": [
            "KQ-001 through KQ-015 are the only committed milestone IDs.",
            "Probable and stretch IDs are forecasts, not promises or capacity reservations.",
            "Squat and forward-lunge full package IDs are outside committed work because their dependency closures exceed this wave's capacity.",
            "A direct unresolved resource dependency is external-wait; descendants remain deferred until their dependency and resource closures are ready.",
        ],
    }
    verify_manifest(manifest, registry, resources)
    return manifest


def verify_manifest(manifest: dict[str, Any], registry: dict[str, Any], resources: dict[str, Any]) -> None:
    milestones = _milestone_map(registry)
    bands = manifest["bands"]
    category_ids = {name: list(value["ids"]) for name, value in bands.items()}
    flattened = [milestone_id for ids in category_ids.values() for milestone_id in ids]
    if len(flattened) != len(set(flattened)):
        raise ScheduleError("milestone IDs appear in more than one forecast band")
    if set(flattened) != set(milestones):
        raise ScheduleError("forecast bands must classify every registry milestone exactly once")
    if category_ids["committed"] != list(COMMITTED_IDS):
        raise ScheduleError("committed IDs must be KQ-001 through KQ-015 in order")
    imported = set(manifest["imported_satisfied"]["ids"])
    for band_name, band_ids in category_ids.items():
        expected_hours = sum(milestones[mid]["expected_work_hours"] for mid in band_ids if mid not in imported)
        if bands[band_name]["hours"] != expected_hours:
            raise ScheduleError(f"{band_name} hour total does not match its unsatisfied IDs")

    committed = set(category_ids["committed"])
    for milestone_id in committed:
        closure = set(_ancestor_closure(milestone_id, milestones)) - imported
        if not closure <= committed:
            raise ScheduleError(f"committed dependency closure violation for {milestone_id}: {sorted(closure - committed)}")

    capacity = manifest["capacity"]
    calculated = capacity["committed_milestone_hours"] + capacity["review_synthesis_replan_overhead_hours"]
    if calculated != capacity["committed_scheduled_hours"]:
        raise ScheduleError("committed capacity accounting does not add up")
    if calculated > manifest["policy"]["committed_capacity_hours"]:
        raise ScheduleError("committed schedule exceeds 134 worker-hours")
    if manifest["review_synthesis_constraints"]["reserved_worker_id"] != "W4":
        raise ScheduleError("W4 must be reserved for review and synthesis")

    schedule = bands["committed"]["schedule"]
    finish = {milestone_id: 0 for milestone_id in imported}
    for item in schedule:
        start = item["window"]["start_productive_hour"]
        for dependency in item["dependencies"]:
            if dependency not in finish or finish[dependency] > start:
                raise ScheduleError(f"{item['id']} starts before {dependency} finishes")
        if item["worker_id"] == "W4":
            raise ScheduleError("reserved review/synthesis worker cannot own a milestone")
        finish[item["id"]] = item["window"]["finish_productive_hour"]
    wave_productive_hours = manifest["policy"]["productive_hours_per_worker_day"] * manifest["policy"]["wave_days"]
    if any(value > wave_productive_hours for value in finish.values()):
        raise ScheduleError("committed dependency-aware windows exceed the seven-day wave")

    mutations = [item for item in schedule if item["mutation_lane"] is not None]
    for point in sorted({item["window"][edge] for item in mutations for edge in ("start_productive_hour", "finish_productive_hour")}):
        concurrent = sum(
            item["window"]["start_productive_hour"] <= point < item["window"]["finish_productive_hour"]
            for item in mutations
        )
        if concurrent > manifest["policy"]["maximum_concurrent_code_mutations"]:
            raise ScheduleError(f"mutation concurrency exceeds policy at hour {point}")

    resource_status = {item["id"]: item["status"] for item in resources.get("resources", [])}
    expected_external = {
        mid for mid, milestone in milestones.items()
        if any(resource_status.get(resource) != "READY" for resource in milestone.get("resource_dependencies", []))
    }
    if set(category_ids["external_wait"]) != expected_external:
        raise ScheduleError("external-wait IDs do not match direct unresolved resource dependencies")


def _write_manifest(path: Path, manifest: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    text = yaml.safe_dump(manifest, sort_keys=False, allow_unicode=True, width=120)
    path.write_text(text, encoding="utf-8", newline="\n")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--registry", type=Path, default=Path("docs/program/milestone_registry.yaml"))
    parser.add_argument("--resources", type=Path, default=Path("docs/program/resource_registry.yaml"))
    parser.add_argument("--output", type=Path, default=Path("docs/program/WAVE_1_SCHEDULE.yaml"))
    parser.add_argument("--verify", action="store_true", help="Verify the existing output instead of regenerating it")
    args = parser.parse_args(argv)

    registry = _load_yaml(args.registry)
    resources = _load_yaml(args.resources)
    if args.verify:
        existing = _load_yaml(args.output)
        expected = build_manifest(args.registry, args.resources)
        verify_manifest(existing, registry, resources)
        if existing != expected:
            raise ScheduleError(f"{args.output} is valid but stale; regenerate it")
        print(f"PASS: verified {args.output}")
    else:
        manifest = build_manifest(args.registry, args.resources)
        _write_manifest(args.output, manifest)
        print(f"PASS: generated and verified {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
