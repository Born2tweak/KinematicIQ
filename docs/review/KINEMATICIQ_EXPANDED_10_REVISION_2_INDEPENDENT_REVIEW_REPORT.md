# KinematicIQ Expanded-10 Revision 2 — Independent Review Report

**Reviewed artifact:** `KINEMATICIQ_AUTONOMOUS_EXPANDED_10_MASTER_PROGRAM.md`
**Review date:** 2026-07-21
**Review scope:** document quality, scientific rigor, architecture, milestone executability, autonomous operation, sequencing, resource realism, and canonical-readiness
**Review limitation:** this is a document-level audit. Claims about the live repository, branch, commit, tests, and existing artifacts were not independently re-verified against a checked-out repository in this review.

## Executive verdict

**Overall document rating: 8.6/10**
**Immediate autonomous-execution readiness: 7.2/10**
**Decision: conditionally approve as the canonical program specification; do not yet treat it as the executable roadmap registry.**

Revision 2 is a substantial improvement over the 7.8/10 first edition. It fixes the most important conceptual problems: engineering completion is separated from scientific release, experimental public shortcuts are eliminated, release eligibility is separated from merge/deploy/public states, model and hybrid expansion are evidence-triggered, every protocol receives a bounded core-claim contract, and scientific/resource blockers are localized instead of halting the whole program.

The remaining gap is no longer vision. It is instantiation. The document defines the schemas and behavior of a strong autonomous system, but the actual `milestone_registry.yaml`, dependency edges, per-node acceptance checks, protocol evidence packs, validation manifests, resource commitments, and scheduler inputs are not present in the document. Revision 2 is therefore a strong operating constitution and program design—not yet a self-executing 175-node plan.

## Scorecard

| Dimension | Score | Assessment |
|---|---:|---|
| Product direction and scope discipline | 9.3 | Clear population, hardware, input, processing, claims, and non-goal boundaries |
| Scientific and validation governance | 9.2 | Conservative, traceable, preregistered, fail-closed, and metric-specific |
| Architecture | 8.8 | Strong shared contracts, versioning, provenance, observability, and abstention design |
| Research system design | 8.5 | Bounded jobs, source hierarchy, synthesis, deduplication, triggers, and replan rules are well designed |
| Autonomy and human-gate policy | 8.8 | Routine work is automatic; legitimate participant, credential, legal, and scientific gates remain human |
| Protocol-specific planning | 8.4 | All ten protocols now have real task, core-claim, view, reference, failure, and eight-stage train definitions |
| Milestone executability | 7.1 | Tables remain summaries; most required registry fields, commands, artifacts, dependencies, and acceptance assertions are absent |
| Dependency and scheduling integrity | 6.8 | Ordering strategy exists, but no actual graph or critical path is supplied or validated |
| Resource and validation feasibility | 7.0 | Required resources are recognized, but acquisition owners, targets, costs, lead times, and fallback triggers remain unspecified |
| Speed realism | 7.3 | Parallelism is materially improved, but governance work and real validation resources still dominate the critical path |
| Clarity and internal consistency | 9.0 | Honest status language and lifecycle distinctions; a few scope and timing tensions remain |
| Source posture | 8.2 | Sources are correctly treated as seeds rather than transferred validity, but ten protocol evidence packs still need to be produced |

## What Revision 2 successfully fixed

### 1. It separates engineering progress from scientific claims

`EngineeringComplete` and `ReleaseEligible` are now distinct. This is the right answer to the earlier false choice between moving quickly and preserving scientific rigor. All ten protocols can progress through research, internal implementation, deterministic replay, UX, and development evaluation while human/reference evidence proceeds independently.

### 2. It removes the public experimental shortcut

The document respects the owner's decision that all public movements must meet the same classes of validation. Internal candidate states remain available without presenting unvalidated outputs as public science.

### 3. It operationalizes metric-level abstention

View, model, device, quality, and processing-path observability are first-class. The architecture does not equate “any camera position” with universal metric recoverability. Unsupported values are withheld with reasons and recovery guidance.

### 4. It sharply improves protocol specificity

The ten protocol rows and KQ-086–KQ-165 trains now identify:

- a standardized task to lock;
- a minimum useful core claim set;
- initial camera/view cells;
- human and instrument reference tiers;
- development, freeze, locked-study, and release stages;
- fail-closed behavior.

The pull and rotation ambiguities from the first edition are also handled correctly through a trade study and a standardized target/tempo task.

### 5. It prevents speculative infrastructure work

The adapter boundary is built first, MediaPipe remains the baseline, one challenger is allowed only after a registered failure cluster, and hybrid compute opens only after an evidence-backed need. This materially reduces the risk of spending the week building platform machinery instead of movement protocols.

### 6. It fixes release-state ambiguity

`ReleaseEligible`, `Merged`, `Deployed`, and `Public` are separate states. Scientific eligibility may be automatic without implying automatic production deployment.

### 7. It creates a credible autonomy policy

The approval matrix matches the user's intent. Research, implementation, tests, documentation, replanning, commits, and dedicated-branch pushes are automatic. Consent, qualified labels, instrumented capture, credentials, legal attestations, and genuine scientific/product conflicts remain legitimate interruptions.

## Priority findings

### Critical 1 — The 175 milestones are still not instantiated as full executable contracts

Section 9 says every registry record must include dependencies, requirements, evidence inputs, scope, artifacts, acceptance checks, verification, failure behavior, state updates, commit policy, and successors. The visible milestone tables contain only IDs, titles/outcomes, and short exit statements.

This is a major improvement over title-only milestones, but it does not satisfy the document's own registry schema. An executor still has to design the missing fields before beginning most nodes.

**Required correction:** generate and validate `docs/program/milestone_registry.yaml` with all 175 records fully populated. The Markdown roadmap should be generated from that registry rather than maintained independently.

### Critical 2 — The dependency graph and critical path do not exist yet

The roadmap describes phases and a sensible ordering strategy, but it does not identify explicit dependencies and successors for each node. For example, it is unclear exactly which subset of KQ-016–KQ-075 blocks each protocol's A–H train, which protocol nodes can begin before Phase E, and which resource tracks should open immediately.

Without those edges, the scheduler cannot reliably compute ready work, localize blockers, or prove that replanning preserves completed evidence.

**Required correction:** populate `dependencies`, `unlocks`, `resource_dependencies`, and `soft_dependencies` for every node; run cycle, orphan, unreachable-node, and ready-queue tests; publish the actual critical path and first two execution waves.

### High 3 — “Runnable research service” is a specification, not an implemented service

The job schema, worker roles, budgets, deduplication, retry behavior, synthesis contract, triggers, and watch frequency are strong. However, the document does not provide the queue implementation, worker launch mechanism, schema validators, citation checker, synthesis patch format, or replan compiler behavior as executable artifacts.

**Required correction:** treat the research loop as a small vertical slice: one real decision question should flow through job creation, bounded primary-source retrieval, deduplication, synthesis, affected-node patching, human-readable replan diff, and registry recompilation before broad protocol research begins.

### High 4 — Validation resources are recognized but not acquired

Participants, two qualified raters, repeat sessions, consumer devices, synchronized kinematics, force/contact systems, timing gates, instrumented walkway access, and institutional partners are all correctly named. Yet the document has no owners, candidate facilities/partners, budgets, lead-time estimates, outreach status, minimum viable acquisition path, or cutoff rule for narrowing claims.

This is the dominant constraint on equal scientific release—not code.

**Required correction:** create a resource registry with required-by dates, owner role, access status, cost ceiling, candidate partner, alternative reference, and exact affected claims. Start squat/lunge plus the shared force/timing/kinematic acquisition tracks immediately.

### High 5 — The program does not provide a time-boxed shipping interpretation

The document wisely avoids promising scientific validation “this week,” but the user's urgency still needs an operational target. The first wave—ten A/B/C contracts and six deterministic replays—is an outcome, not a time-boxed capacity plan.

**Required correction:** add a seven-day engineering sprint overlay that does not weaken validation. It should identify which governance nodes are the minimum executable kernel, which six protocols are the fastest internal vertical slices, expected parallel capacity, and the exact end-of-week artifacts. Scientific release remains evidence-driven rather than date-driven.

### High 6 — Phase A risks becoming another governance detour

Fifteen Phase A nodes plus extensive contract/platform work could consume the week before movement delivery. Several are valuable, but the program needs an explicit “minimum control kernel” that allows protocol identity, evidence, and internal implementation work to start while less critical automation infrastructure is completed.

**Required correction:** classify shared nodes as `blocking_kernel`, `parallel_enabler`, or `deferred_hardening`. Start protocol A/B/C work after the smallest valid registry, traceability, status, and replan skeleton exists—not after every automation convenience is finished.

### Medium 7 — A mandatory coaching cue may block otherwise valid measurement protocols

Every protocol's core set includes “one cue.” A measurement can be valid and reliable while the intervention value of a coaching cue remains unproven or context-dependent. Making a cue mandatory may turn a coaching-efficacy question into a blocker for measurement release.

**Required correction:** distinguish an evidence-bounded interpretation from a validated coaching intervention. Require at least one understandable interpretation, but claim that a cue improves movement only after a separate intervention-effect gate.

### Medium 8 — The privacy/security closeout occurs too late for hybrid work

KQ-053/KQ-054 mention consent, encryption, retention, deletion, and parity, while the full security/privacy threat-model closeout is KQ-171. A hybrid prototype may therefore appear before a complete threat assessment.

**Required correction:** require a minimum hybrid threat model and data-flow approval before any real video leaves the device. Keep KQ-171 as the final cross-system closeout.

### Medium 9 — Equal rigor needs clearer cross-protocol comparability rules

The document correctly says equal rigor does not mean identical thresholds. It still needs a common classification for what “validated” means across count, event timing, angles, spatiotemporal measures, and cues so one protocol is not released on materially weaker consequence thresholds.

**Required correction:** add a metric-class gate taxonomy with required reporting fields and threshold-rationale review rules. Each protocol may use different numbers but must satisfy the same consequence and evidence-quality discipline.

### Medium 10 — The evidence basis remains intentionally incomplete

The general and seed references support the program's caution and evaluation posture. They do not establish the ten task definitions, selected core claims, thresholds, camera cells, or coaching interpretations. The document acknowledges this correctly, so this is not a scientific defect; it is an execution blocker that must be visible in the ready queue.

**Required correction:** make each protocol A node produce a signed evidence pack and decision table, not a narrative literature review. No B node should open until exact evidence gaps and conflicts are registered.

## Internal consistency observations

1. The document honestly labels itself a “canonical execution program candidate” and ends by saying it is not self-validating evidence. That status is correct and should remain until the registry compiles.
2. “All ten equally governed” is consistent with metric-specific reference standards; equal governance does not imply identical metrics or thresholds.
3. “Any camera position” is correctly narrowed to view-adaptive support and abstention. Initial release cells remain constrained, so unrestricted position support is a long-term outcome, not a first-release promise.
4. Automatic release is correctly limited to scientific eligibility. Merge, deploy, and public exposure still require separate authority.
5. The claim that revision 2 gives every milestone a full contract is overstated. It defines the contract schema and substantially deepens protocol nodes, but the actual contracts remain to be generated.

## Recommended canonicalization gate

Do not rewrite the strategy again. Complete one focused integration pass containing these seven deliverables:

1. Fully populated and schema-valid `milestone_registry.yaml` for KQ-001–KQ-175.
2. Explicit dependency graph with no cycles, orphans, or unreachable required nodes.
3. A computed critical path plus a seven-day engineering wave plan.
4. One end-to-end autonomous research/replan demonstration.
5. Resource registry for participants, raters, devices, reference instruments, repeat sessions, privacy, and partners.
6. Per-protocol evidence-pack and `validation_manifest.yaml` templates instantiated with registered unknowns—never silent placeholders.
7. Clean-clone status compilation proving the same frontier, blockers, ready queue, and next node.

When these pass, change the status from `canonical execution program candidate` to `canonical executable program` and begin KQ execution. No third conceptual redesign should be necessary unless repository evidence contradicts a core assumption.

## Final assessment

Revision 2 is scientifically mature, strategically coherent, and much more aligned with the desired autonomous operating model. It successfully transforms the earlier serial one-movement validation process into shared infrastructure plus independent protocol trains without lowering the public evidence standard.

Its remaining weakness is precise and fixable: **the document describes the executable system, but the executable system's data has not yet been instantiated.** Calling it 9.2/10 blurred that distinction. An **8.6/10 document score** and **7.2/10 immediate execution-readiness score** better reflect reality.

After the seven-item canonicalization pass, the program should reasonably reach **9.3–9.5/10** and become suitable for continuous autonomous execution without another wholesale roadmap rewrite.
