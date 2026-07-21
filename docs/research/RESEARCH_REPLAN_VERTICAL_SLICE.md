# KinematicIQ Autonomous Research/Replan Vertical Slice

**Purpose:** deterministic acceptance fixture for KQ-012, KQ-060, and KQ-175
**Status:** orchestration demonstration—not scientific evidence and not a completed jump evidence pack

## Trigger

`INF-TEST-001`: KQ-143 cannot lock an eligible consumer-camera frame-rate cell for flight-time and conditional jump-height claims.

## Bounded research job

```yaml
job_id: RQ-JUMP-001
decision_question: What evidence is required before consumer-camera flight time or derived jump height can enter the jump core/optional claim matrix?
affected_objects: [KQ-143, KQ-144, KQ-145, KQ-147, KQ-148, jump.flight_time, jump.jump_height]
source_priority: [primary_validation_studies, official_camera_timestamp_documentation]
excluded_sources: [search_snippets, unsourced_blogs, GitHub_readmes_as_scientific_authority]
budget: {max_sources: 12, max_worker_retries: 2, max_parallel_workers: 2}
exit_criteria:
  - identify the exact reference measurement and synchronization method;
  - identify frame-rate/timestamp error mechanisms relevant to event timing;
  - determine whether published thresholds transfer directly to KinematicIQ;
  - produce claim, algorithm, validation, and registry impacts.
```

## Retrieval and deduplication result

- Candidate primary seed: *Measuring Vertical Jump Height With Artificial Intelligence* (`PMID 38953840`).
- Existing program source reused rather than duplicated.
- A GitHub pose implementation may inform engineering but is rejected as scientific authority.
- No source is permitted to transfer validity from its population, camera, algorithm, setup, or reference system directly to KinematicIQ.

## Synthesis patch

```yaml
confirmed:
  - flight-time and derived-height claims require direct criterion comparison and timestamp/frame-rate error reporting.
changed:
  - jump_height remains optional and separately withholdable.
  - eligible frame-rate/device cells must be frozen in KQ-147 before locked evaluation.
invalidated: []
unresolved:
  - id: UNK-JUMP-001
    question: Smallest decision-relevant event-time error and height error for the locked product use.
    blocks: [KQ-143, KQ-147]
  - id: UNK-JUMP-002
    question: Available force/contact and synchronized high-speed reference access.
    blocks: [KQ-144, KQ-148]
registry_patch:
  KQ-143:
    add_acceptance: [frame_rate_error_model, timestamp_provenance, separate_flight_time_and_height_gates]
  KQ-144:
    add_resource_dependencies: [RES-FORCE_CONTACT, RES-DEVICES, RES-REPEAT, RES-PRIVACY]
  KQ-145:
    add_acceptance: [timestamp_uncertainty_propagates_to_every_event_derived_output]
  KQ-147:
    add_acceptance: [eligible_device_and_frame_rate_cells_are_immutable]
  KQ-148:
    add_acceptance: [participant_level_event_and_height_error_by_device_cell]
```

## Deterministic replan result

- Completed evidence and public behavior: unchanged.
- KQ-143 and KQ-147: `BlockedKnowledge` until UNK-JUMP-001 is resolved.
- KQ-144 and KQ-148: `BlockedExternal` until RES-FORCE_CONTACT and participant/privacy requirements are ready.
- KQ-145: remains ready for event-engine and uncertainty implementation using development fixtures.
- All unrelated protocol trains: unchanged and still eligible for scheduling.
- Human interruption: none until instrument access, consent, or a material product threshold choice is actually required.

## Acceptance assertions

1. The same trigger and frontier produce the same job ID, deduplication outcome, synthesis object, affected nodes, and replan diff.
2. No completed node, locked evidence, or public claim changes.
3. Missing evidence becomes an explicit blocker; no threshold is invented.
4. Low-value research that changes no registered decision is rejected.
5. A failed worker retries within budget, then localizes failure without stopping other ready work.
6. The human-readable diff and machine patch agree exactly.

This fixture proves orchestration behavior only. KQ-143 still requires a complete, appraised, protocol-specific evidence pack before it can pass.
