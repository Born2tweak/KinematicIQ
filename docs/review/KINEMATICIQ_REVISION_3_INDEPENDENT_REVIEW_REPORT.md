# KinematicIQ Expanded-10 Revision 3 — Independent Review Report

**Review date:** 2026-07-21
**Reviewed bundle:** Revision 3 master program plus milestone, resource, protocol-validation, execution-wave, and research/replan artifacts
**Decision:** conditionally approve as a program-design bundle; do not yet treat it as a runnable autonomous scheduler contract

## Executive verdict

**Overall document and bundle rating: 8.2/10**
**Immediate autonomous-execution readiness: 6.8/10**

Revision 3 materially improves the program. It supplies real YAML records, a syntactically valid dependency graph, resource objects, protocol claim seeds, a seven-day engineering overlay, and a research/replan example. The strategy is coherent, scientifically conservative, and much better aligned with the owner's desire for long-horizon autonomous execution.

However, the bundle's strongest claim—"175 fully instantiated milestone contracts"—is not yet supported by its own normative schema. All 175 records exist, but most remain scheduler-shaped summaries rather than independently executable engineering contracts. The graph is structurally valid but does not correctly model failed, blocked, skipped, or conditionally satisfied terminal outcomes. The seven-day wave also exceeds its own four-worker capacity model.

The correct next action is a focused **execution-semantics and verifier integration pass**, not another strategic rewrite.

## Scorecard

| Dimension | Rating | Assessment |
|---|---:|---|
| Product direction and scope control | 9.2/10 | Clear Expanded-10 scope, conservative claims, coach configuration, and explicit non-goals |
| Scientific governance | 9.0/10 | Strong U1–U12 gates, frozen evidence, metric-level abstention, and separation of measurement validity from coaching efficacy |
| Architecture | 8.7/10 | Good shared contracts, MediaPipe baseline, evidence-triggered model expansion, view adaptation, and hybrid restraint |
| Protocol planning | 8.2/10 | Ten distinct task/claim/reference seeds exist, but protocol evidence packs and numeric validation manifests are intentionally unresolved |
| Autonomy and research governance | 8.1/10 | Useful triggers, bounded jobs, synthesis rules, and localized replanning; only one illustrative vertical slice exists |
| Dependency-graph structure | 8.0/10 | 175 unique nodes, 759 reciprocal edges, one root, no missing references, and no cycles |
| Dependency-graph semantics | 6.4/10 | Pass-only dependencies conflict with blocked/failed terminal paths and independent protocol completion |
| Milestone executability | 6.3/10 | Records lack multiple fields required by the master schema and mostly verify documentation assertions rather than code behavior |
| Schedule realism | 6.0/10 | Seven-day wave is directionally useful but not capacity-feasible under the supplied hour model |
| Resource acquisition readiness | 6.2/10 | Roles and candidate sources exist, but no named owners, contacts, commitments, approved channels, or feasible zero-cost plan exists |
| Repository integration readiness | 5.5/10 | Target paths are defined, but program tooling, clean-clone execution, live-repo reconciliation, and branch push remain unproven |

## What Revision 3 genuinely fixes

### 1. The program now has a real structural spine

The milestone registry parses and contains:

- 175 unique IDs;
- 759 unique dependency edges;
- 759 matching reverse `unlocks` edges;
- one root (`KQ-001`);
- no missing references;
- no graph cycles;
- 1,098 modeled work-hours across the whole program.

This is a meaningful advance over a prose-only roadmap.

### 2. The scientific release model is strong

The bundle correctly requires:

- a minimum useful core claim set;
- claim-specific validity and reliability;
- participant-level inference rather than frame-count inflation;
- locked development and validation evidence;
- supported view/device/input cells;
- false-confidence and abstention gates;
- separation of `EngineeringComplete`, `ReleaseEligible`, merge, deployment, and public exposure;
- independent intervention-effect evidence before claiming that coaching changes movement.

The source posture is also conservative. Google's Pose Landmarker documentation establishes image, video, and live-stream landmark outputs, not KinematicIQ-level biomechanical validity. OpenCap is properly treated as a comparator because it uses two or more synchronized smartphones and materially different biomechanical processing. The jump and gait studies are correctly presented as research seeds rather than transferred validation.

### 3. Premature platform work is controlled

The model-adapter boundary precedes challenger implementation, and hybrid processing is conditional on a measured local failure plus privacy/product justification. This avoids turning "model agnostic" into an immediate multi-model infrastructure project.

### 4. External blockers are localized

The resource registry identifies participants, raters, devices, repeat sessions, privacy, kinematics, force/contact equipment, timing systems, a calibrated landing platform, and institutional partners. Its fail-closed fallback rules are appropriate: narrow claims or withhold outputs, never weaken the standard.

### 5. The research loop is materially clearer

The jump vertical slice demonstrates the intended path from trigger to bounded question, source classification, synthesis, registered unknowns, localized registry patch, and unaffected parallel work. It is explicitly labeled as an orchestration fixture rather than scientific evidence.

## Critical findings

### P0-1 — The registry does not implement the master document's required schema

The master declares the following fields normative for every milestone:

- `objective`;
- `user_visible_outcome`;
- `in_scope`;
- `out_of_scope`;
- manual verification gate;
- rollback or abstention behavior;
- research trigger;
- `state_updates`.

Across all 175 registry records:

- `objective`: present in 0;
- `user_visible_outcome`: present in 0;
- `in_scope`: present in 0;
- `out_of_scope`: present in 0;
- `state_updates`: present in 0;
- manual-gate field: present in 0;
- rollback/abstention field: present in 0;
- research-trigger field: present in 0.

Every record instead has one broad `scope` string. Therefore, the canonicalization report's statement that all required contract fields are present is false relative to the master program's own schema.

**Required correction:** choose one schema as authoritative, implement it in all records, validate it with JSON Schema or equivalent, and generate the human tables from that source.

### P0-2 — Acceptance checks are mostly assertions, not executable predicates

Every milestone has exactly two acceptance entries:

1. a restatement of the milestone's one-line outcome;
2. the same generic provenance sentence.

All 175 milestones invoke the same registry verifier pattern, and all declared artifacts are documentation/status YAML or JSON paths. No acceptance entry directly names the affected source files, test suites, fixtures, commands, expected outputs, performance bounds, or observable product behavior needed to prove completion.

Examples such as "contracts pass," "parity passes," and "accessibility contracts pass" are not machine checks until decomposed into exact assertions and evidence paths.

**Required correction:** each engineering milestone needs concrete code/test/evaluation commands and result predicates. The registry verifier should validate evidence produced by those commands, not treat an assertion string as evidence.

### P0-3 — Failure and blocked-state semantics break the advertised graph behavior

Dependencies generally require earlier nodes to be `PASS` or conditionally skipped. That creates several contradictions:

- A locked validation node transitions only from `Pending` to `Validated`; its failure action blocks locally.
- The downstream release-decision node depends on the locked validation node, so a failed validation cannot naturally reach the node intended to record `FailedGate`.
- The final release-candidate audit depends on all ten release-decision nodes, so one protocol that remains legitimately `BlockedExternal` can prevent the program-level audit from completing.
- The stated objective—each protocol independently ending as release-eligible, failed, or legitimately blocked—is therefore not encoded by ordinary dependency completion.

**Required correction:** add outcome-aware edges and terminal-state predicates. A downstream audit should accept explicit terminal outcomes such as `PASS`, `FAILED_GATE_RECORDED`, `BLOCKED_EXTERNAL_WITH_OWNER`, `RETIRED`, or `INVALIDATED`, while release eligibility must still require only the pass path.

### P0-4 — The seven-day wave is not feasible under the supplied capacity model

The wave assumes four bounded workers. Using the registry's own hour estimates:

- The unique dependency closure for the six named internal packages is **339 worker-hours**.
- Even with perfect four-worker utilization, that is an absolute lower bound of **84.75 elapsed work-hours**.
- The closure for six `EngineeringComplete` packages is **476 worker-hours**, or a **119-hour** four-worker lower bound.
- All ten internal packages require a 435-hour closure; all ten engineering-complete packages require 604 hours.

These lower bounds exclude research latency, code review, merge conflicts, failed tests, environment setup, and external waits. A seven-day calendar may contain 168 clock hours, but four autonomous workers cannot safely provide continuous productive utilization, and the document describes engineering days rather than 24-hour compute windows.

**Required correction:** run a resource-constrained schedule using worker availability, parallelism limits, task types, critical-path precedence, review overhead, and historical velocity. Express the seven-day output as committed tiers: guaranteed control/parity foundation, probable protocol candidates, and stretch candidates.

### P0-5 — Lifecycle states and registry transitions disagree

The master lifecycle includes `Candidate`, `Researched`, `ProtocolLocked`, `ImplementedInternal`, `EngineeringComplete`, `DataReady`, `ValidationRunning`, `Validated`, and `ReleaseEligible`. Registry transitions begin at `Pending`, use `Verified` for identity, claim, and resource nodes, and never transition a protocol to `DataReady` or `ValidationRunning`.

The resource-readiness C stage may finish before internal implementation, but the visual lifecycle places `DataReady` after `EngineeringComplete`. Either ordering can work, but the current documents encode both.

**Required correction:** separate milestone status from protocol lifecycle state. Define an explicit reducer that derives protocol state from completed milestone outcomes and resource states.

## High-priority findings

### P1-1 — Resource ownership is role-based, not operational

The resource registry adds owner roles and candidate source classes but no named accountable person, contact, outreach artifact, approval route, due date, or confirmed access. Every cost ceiling is $0, including participant recruitment, qualified raters, instrumented facilities, and repeat sessions. That may be a constraint, but it is not yet a feasible acquisition strategy.

**Required correction:** create acquisition milestones with named owner, first-contact target, outreach status, escalation date, consent/legal dependency, fallback source, and the point at which zero-budget infeasibility becomes an owner decision.

### P1-2 — The validation registry contains protocol seeds, not locked contracts

The ten protocol records are useful starts, but they still contain `OpenBlocking` evidence status and unresolved threshold, sample, view, task, device, and resource questions. No numeric validation threshold or participant-level sample rule is supplied—which is scientifically appropriate before research—but this means the bundle is not ready to execute locked studies.

**Required correction:** explicitly classify the registry as a pre-registration work queue. Create one separate `validation_manifest.yaml` per protocol only after evidence synthesis, sample planning, reference access, and signature requirements are complete.

### P1-3 — Equal rigor risks becoming equal burden

Every protocol lists repeat sessions and broad device requirements, and seven protocols default to synchronized kinematics. Equal rigor should mean equal decision discipline, not identical instrumentation for claims that may need different reference tiers.

**Required correction:** require claim-level reference justification. Event/count claims may use qualified raters or contact/timing references when those are the correct criterion; joint/segment kinematics require synchronized kinematic reference. Do not force every claim through the most expensive protocol-level resource set.

### P1-4 — Research autonomy is demonstrated only once

The jump fixture proves the intended shape of orchestration, but it does not establish behavior for source conflicts, licensing ambiguity, retractions, duplicate evidence with different populations, failed agents, source retrieval failure, or a change that invalidates a completed public claim.

**Required correction:** add a small test suite of replan fixtures covering at least technical failure, evidence conflict, dataset-license rejection, locked-data contamination, and public-claim invalidation.

### P1-5 — Cross-protocol closeout remains overly centralized

KQ-174 waits on all ten release decisions plus the full clean-clone audit. That is useful for program closeout but should not be required to continuously operate or release an independently eligible protocol.

**Required correction:** distinguish per-protocol terminal audit, rolling program dashboard, and final Expanded-10 completion audit.

## Medium-priority findings

### P2-1 — The registry has substantial generated duplication

There are only four unique `requirements` patterns, two `failure` patterns, one commit policy, and two acceptance entries per node. Repetition is not inherently wrong, but maintaining 175 hand-authored copies will invite drift.

**Recommendation:** encode defaults at the schema/program level and keep only per-node overrides. Generate reverse unlocks instead of storing both graph directions as independent authoritative data.

### P2-2 — Commit policy is too uniform

Every node has `commit_on_pass`, `push_on_pass`, and `batchable` set to true. Scientific manifest freezes, privacy decisions, generated status updates, and small registry-only nodes may require different commit atomicity or reviewer signatures.

**Recommendation:** define commit classes such as `code_atomic`, `generated_status_batch`, `scientific_freeze_signed`, and `privacy_human_gate`.

### P2-3 — Source coverage is intentionally shallow for ten protocols

The master includes a responsible seed layer, but it is not yet a ten-protocol evidence library. Rotation, pull, landing, sprint acceleration, hip hinge, and push-up have no dedicated source packs in this bundle.

**Recommendation:** retain the source section as orientation only and prevent a protocol A node from passing until its dedicated primary-source pack and conflict audit exist.

## Required revision gate

Revision 3 should become canonical only after the following pass:

1. The milestone registry validates against one authoritative full schema.
2. Every engineering node includes real commands, evidence paths, and measurable predicates.
3. Outcome-aware dependency semantics allow pass, failed, blocked, retired, and invalidated terminal paths without weakening release gates.
4. Protocol lifecycle is derived consistently from milestone and resource state.
5. A resource-constrained schedule replaces the optimistic four-worker seven-day overlay.
6. Resource acquisition becomes operational, with named accountability and outreach/approval paths.
7. Clean-clone execution proves registry compilation, ready-queue calculation, localized failure, replan diffs, and continuation.
8. Live-repository reconciliation determines which nodes are already satisfied and replaces generic estimates with observed effort.

## Recommended execution sequence

This is a correction pass, not a new roadmap rewrite:

1. Integrate the bundle into a dedicated branch without declaring it canonical.
2. Implement and test the registry schema/compiler.
3. Correct state and dependency semantics with synthetic pass/fail/block fixtures.
4. Convert the first vertical path—preferably squat plus forward lunge—into genuinely executable contracts.
5. Run those contracts from a clean clone and measure actual effort.
6. Regenerate the schedule and remaining protocol contracts from the proven pattern.
7. Begin parallel protocol engineering and resource acquisition.

## Final decision

Revision 3 is the best version of the KinematicIQ Expanded-10 program so far. It is strong enough to guide integration and disciplined enough to prevent false scientific release. It is not yet safe to hand to an autonomous scheduler as the sole executable authority.

**Approve for focused integration and correction. Do not approve the current bundle as fully canonical or execution-ready.**

Expected rating after the correction gate: **9.1–9.4/10**, with autonomous-execution readiness above **8.8/10** once clean-clone evidence and live-repository commands exist.

## External source check

- [Google Pose Landmarker documentation](https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker)
- [OpenCap validation paper](https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1011462)
- [Vertical-jump validity and reliability study](https://pubmed.ncbi.nlm.nih.gov/38953840/)
- [Smartphone gait validation seed](https://pmc.ncbi.nlm.nih.gov/articles/PMC11138199/)
- [Camera-viewing-angle validation seed](https://pmc.ncbi.nlm.nih.gov/articles/PMC11819822/)
