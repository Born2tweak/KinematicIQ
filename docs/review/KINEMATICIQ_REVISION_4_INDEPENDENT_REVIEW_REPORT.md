# KinematicIQ Expanded-10 Revision 4 — Independent Review Report

**Review date:** 2026-07-21
**Reviewed artifacts:** Revision 4 master program, milestone schema and registry, execution-semantics fixtures, capacity forecast, resource registry, protocol-validation work queue, and Revision 4 self-report
**Review posture:** independent audit of the artifacts themselves; prior self-ratings were not treated as evidence

## Executive verdict

**Overall program-bundle rating: 8.6/10**
**Immediate autonomous-execution readiness: 7.1/10**
**Decision: conditionally approve Revision 4 as the canonical candidate specification, but do not yet grant scheduler authority.**

Revision 4 materially improves the program. It corrects the most serious Revision 3 defect by separating milestone execution status, scientific result, and protocol lifecycle. A properly executed locked study can now fail scientifically without being misclassified as a technical execution failure, and blocked studies can reach an auditable disposition without qualifying for release.

The bundle is not yet directly runnable. Its registry depends on verifier programs and per-milestone contract artifacts that do not exist in this bundle; several acceptance rules delegate their meaning to those future artifacts; every dependency accepts `SkippedByDecision` even though no declared outcome produces that state or constrains its authorization; and the seven-day forecast does not map committed outcomes to milestone IDs or prove their dependency closure fits the stated capacity.

The correct next step is one repository-integration pass with executable fixtures—not another conceptual rewrite.

## Ratings

| Dimension | Rating | Assessment |
|---|---:|---|
| Product direction and scope control | 9.2/10 | Clear Expanded-10 scope, conservative claims, distinct engineering and scientific finish lines |
| Scientific and validation governance | 9.1/10 | Strong U1–U12 framework, preregistration, locked evidence, metric-level abstention, criterion-reference discipline |
| Architecture | 8.7/10 | Good shared protocol architecture, live/upload convergence, evidence-triggered model and hybrid expansion |
| Milestone decomposition | 8.0/10 | 175 real records with concrete artifacts and protocol trains, but many semantic fields remain generated boilerplate |
| Execution semantics | 7.8/10 | Three-dimensional state model is sound; skip production and result-aware dependency enforcement remain incomplete |
| Verification design | 7.0/10 | Commands and predicate IDs exist, but the essential verifier implementations and contract assertion bodies are absent |
| Schedule realism | 7.0/10 | Former infeasible promise is withdrawn; the replacement forecast is not yet an ID-level resource-constrained schedule |
| Resource feasibility | 6.7/10 | Honest unresolved tracks and named accountability, but no confirmed contacts/access and a zero-dollar authority constraint |
| Continuous research design | 8.4/10 | Decision-triggered, source-ranked, bounded, deduplicated, and replan-aware; still awaiting executable orchestration |

## What Revision 4 successfully fixes

### 1. Scientific failure no longer equals executor failure

The bundle now correctly represents a locked study that misses a threshold as:

- milestone status: `Passed`;
- result code: `GATE_FAIL_RECORDED`;
- protocol state: `FailedGate`.

This is the right semantic model. It preserves negative scientific evidence, prevents post-hoc threshold weakening, and allows unaffected protocol work to continue.

### 2. Release eligibility is separated from publication

`ReleaseEligible`, `Merged`, `Deployed`, and `Public` are distinct states. The dedicated branch may receive automatic milestone pushes, while master merge, deployment, and public activation remain outside the granted authority. This resolves the earlier ambiguity between scientific eligibility and actual public release.

### 3. The registry is structurally substantial

The audit confirmed:

- 175 unique milestone records;
- 759 dependency edges;
- one root (`KQ-001`);
- no missing dependency or unlock references;
- exact dependency/unlock reversibility;
- no dependency cycles;
- 1,098 modeled worker-hours across the full program;
- 80 protocol-train milestones totaling 530 hours;
- all ten protocol trains use separate research/identity, observability, data, implementation, product integration, freeze, locked study, and release-disposition stages.

This is a real improvement over a roadmap containing only repeated milestone labels.

### 4. Validation remains conservative and appropriately claim-specific

The protocol-validation registry keeps thresholds and participant-level sample rules explicitly open and blocking. It does not disguise incomplete preregistration as validation. It also distinguishes count, event-time, continuous-kinematic, spatiotemporal, categorical-interpretation, and intervention-effect reporting requirements.

The source posture is correct. [Google's Pose Landmarker documentation](https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker) establishes image, video, and live-stream landmark outputs, including normalized and world-coordinate landmarks; it does not establish KinematicIQ's protocol-level biomechanical validity. [OpenCap](https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1011462) validates a materially different architecture using two or more synchronized smartphones and cloud biomechanical processing, so its validity cannot be transferred to KinematicIQ's monocular routes.

### 5. Premature platform expansion is controlled

MediaPipe remains the baseline. A challenger adapter is conditional on a measured failure cluster, and hybrid processing is conditional on a validated local capability gap plus privacy and product-value gates. This avoids another infrastructure detour before movement delivery.

### 6. Resources are represented honestly

Participant, rater, device, repeat-session, privacy, kinematic, force/contact, timing, platform, and partner tracks are explicit. Missing resources block only affected work, and the registry records an accountable owner, execution role, first action, lead time, cutoff behavior, and escalation rule.

## Material findings that remain open

### Finding 1 — `SkippedByDecision` is both globally accepted and impossible to produce

All 759 dependency edges accept both `Passed` and `SkippedByDecision`, including essential scientific, privacy, reproducibility, and release-related dependencies. However, none of the 175 milestone outcome maps produces `SkippedByDecision`.

This causes two opposite defects:

1. A conforming scheduler has no declared transition by which a legitimate negative decision becomes `SkippedByDecision`.
2. If an implementation invents that transition, the graph currently permits every dependency—including mandatory gates—to be skipped without a machine-readable authorization policy.

Required correction:

- add an explicit `decision_skip` outcome only to eligible conditional nodes;
- require decision ID, authority, rationale, affected scope, evidence, and expiry/reconsideration trigger;
- remove `SkippedByDecision` from every mandatory safety, privacy, validation, reproducibility, and release dependency;
- make the schema reject skip acceptance on non-skippable edge classes.

This is the highest-priority semantic defect.

### Finding 2 — Acceptance remains partly self-referential

Every milestone uses three common predicates:

- `all_artifacts_exist_and_nonempty`;
- `current_run_evidence_matches_head`;
- `contract_output_assertion_passes`.

For many milestones, the third predicate points to the same contract artifact the milestone is expected to create. Without an externally defined assertion type and verifier, a contract can effectively declare its own success. Of 175 milestones, 49 contain only these three generic predicates; 106 add common build/test regression predicates; locked-study and release nodes add stronger disposition predicates.

The unique IDs do not make the checks unique: most semantic specificity still lives in future `docs/program/artifacts/kq-*.yaml` files and future verifier code.

Required correction:

- define a closed predicate catalog with typed inputs and outputs;
- encode per-milestone expected values in the registry or a versioned external specification that the milestone cannot rewrite;
- prohibit a produced artifact from being the sole authority for its own expected result;
- make evidence records include command hash, commit hash, environment, timestamp, inputs, outputs, and verifier version;
- prove negative fixtures where a nonempty but incorrect artifact fails.

### Finding 3 — The authoritative schema is still under-constrained

The YAML registry parses, and a deterministic structural audit can confirm key presence and graph properties. The supplied JSON Schema, however, leaves several important structures weakly typed:

- `registry_policy` and `verification_profiles` are generic objects;
- `failure` requires keys but does not define their types or reject extra keys;
- `commit_policy` requires keys but does not define their allowed values;
- outcome objects permit undeclared properties;
- acceptance predicates are free strings rather than an enum or discriminated union;
- dependency rules constrain milestone status but not upstream result code;
- cross-field rules such as “`RELEASE_ELIGIBLE` requires upstream `GATE_PASS`” are delegated to future code.

The Revision 4 self-report accurately admits that formal repository validation and verifier implementation remain pending. Until those exist, “full schema” should mean complete field coverage, not complete executable validation.

### Finding 4 — The seven-day forecast is not yet schedulable

The forecast correctly withdraws the former six-package promise and declares 134 committed worker-hours. However, its committed, probable, and stretch bands contain prose outcomes rather than milestone IDs, dependency closures, worker assignments, start/finish windows, or hour totals.

The registry demonstrates why this matters:

- KQ-001 through KQ-015 alone total 58 hours;
- the ancestor closure for the squat internal package KQ-089 is 219 hours;
- the closure for lunge KQ-097 is also 219 hours;
- their combined unique closure is 243 hours;
- squat plus lunge product integration through KQ-090/KQ-098 has a 348-hour closure.

Therefore, the committed phrase “convert squat and forward lunge into the first genuinely executable milestone vertical slices” is feasible within 134 hours only if it means a narrower integration fixture than completing the registered internal packages. The forecast must say exactly which IDs it commits to.

Required correction:

- publish an initial wave manifest containing milestone IDs, satisfied/imported nodes, remaining hours, worker capability, mutation lane, and start conditions;
- compute ancestor closure after importing live repository evidence;
- ensure the committed set totals no more than 134 scheduled hours including review/integration overhead;
- label all other IDs probable, stretch, external-wait, or deferred;
- regenerate after observed completion time.

### Finding 5 — Resource accountability is named, but acquisition is not yet viable

The resource registry is honest, but every named contact is null. The accountable owner is Andrian Kolliegbo for all ten resource tracks, while execution owners are symbolic agent roles. Lead times range from 7 to 30 days, all cost ceilings are $0, and participant consent, qualified raters, repeat sessions, instrument access, and partner commitments are unresolved.

This means equal scientific release rigor cannot be scheduled from the current artifacts. Engineering can progress, but release timelines remain unknowable until real access paths exist.

Additional issues:

- `RES-PARTNER` is defined but unused by any milestone resource dependency;
- relative due rules such as “within 2 execution days” are not actual dated actions until a start trigger is recorded;
- no fallback reference has yet been scientifically accepted for failed acquisition;
- a single owner across every external track creates a coordination bottleneck even if agents prepare the work.

Required correction:

- bind `RES-PARTNER` where institutional access is required or remove it;
- instantiate dated actions when triggers fire;
- record contact candidates and outreach status before claiming an acquisition track is active;
- separate zero-dollar authority from zero expected cost and surface funding/partnership decisions early;
- report resource-critical paths separately from engineering critical paths.

### Finding 6 — Milestone fields meet the schema more than the Aurelian intent

All objectives are unique only because each repeats `Produce and verify one bounded outcome: <title>`. Requirements have only four unique shapes across 175 milestones, failure behavior has two shapes, and 155 milestones set `user_visible_outcome` to `none`.

The first `in_scope` item and the human milestone tables often contain useful specifics, so this is not empty planning. Still, the machine-readable contract does not consistently express:

- the precise decision or behavior change;
- the external requirement or evidence row addressed;
- milestone-specific risks;
- measurable expected values;
- a user, developer, scientist, or operator-visible outcome.

Required correction: enrich only the first executable wave and the ten protocol A/B contracts during repository integration. Do not rewrite all 175 records before starting work; use the proven compiler to enforce richer contracts as nodes enter `Ready`.

### Finding 7 — Repository integration remains the actual readiness gate

The registry commands reference:

- `tools/program/verify_milestone.py`;
- `tools/program/run_contract_checks.py`;
- repository-target copies under `docs/program/`;
- generated evidence under `docs/status/milestones/`.

Those implementations and outputs are not present in this review bundle. Consequently, the ten required execution fixtures are specifications, not executed tests. The bundle correctly labels itself a candidate; the Revision 4 report should not be interpreted as proof of runnable autonomy.

## Scientific-source assessment

The source layer is appropriate for a master program, but not sufficient to close any new protocol. Its strongest quality is epistemic restraint:

- implementation documentation is not treated as biomechanical validation;
- multi-camera and monocular systems are not treated as equivalent;
- protocol-specific evidence packs are mandatory;
- exact metric, task, population, camera geometry, and reference method must match;
- unresolved thresholds remain blocking;
- papers, datasets, GitHub implementations, and official specifications are classified differently.

The master program should retain this posture. The next research work should produce one evidence pack per protocol and one claim-level traceability row per visible output; adding more general markerless-motion sources to the master document itself would not materially improve execution.

## Prioritized correction gate

Revision 4 should pass the following gate before scheduler authority:

1. **Fix skip semantics.** Restrict and explicitly produce `SkippedByDecision`; remove it from mandatory edges.
2. **Implement the schema/compiler and state reducer.** Validate all 175 records plus cross-field release invariants.
3. **Implement typed predicates and negative fixtures.** Prove incorrect, stale, self-authored, blocked, failed, and contaminated evidence cannot pass.
4. **Publish an ID-level Wave 1 schedule.** Fit actual unsatisfied dependency closure within 134 hours.
5. **Bind squat and lunge to real repository commands.** Use them as the first end-to-end scheduler fixtures.
6. **Activate resource records honestly.** Add dated actions and candidate contacts; connect or retire the unused partner resource.
7. **Run a clean clone.** Capture schema, graph, fixture, build, test, replay, branch push, and evidence-reproduction outputs.

No additional redesign of the product philosophy, universal validation standard, movement set, or architecture is needed before this gate.

## Final assessment

Revision 4 is the best version of the Expanded-10 program so far. It is scientifically responsible, structurally substantial, and much more honest about capacity and external evidence than Revision 3. The three-dimensional state model is a genuine architectural improvement, not cosmetic documentation.

Its remaining gap is the final one between a specification and an operating system: executable predicate semantics, controlled skip authority, repository-bound verifier code, and an ID-level first schedule. Because those pieces are missing, the bundle should remain **canonical candidate** rather than **scheduler-authoritative**.

**Final rating: 8.6/10 overall; 7.1/10 for immediate autonomous execution.**
