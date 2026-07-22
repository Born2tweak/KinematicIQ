# Phase 4 Evidence-Closure Execution Roadmap

> **Repository-status reconciliation (2026-07-15):** The `8d8a77d` observations below were historically correct. `master` has now been fast-forwarded without conflict through the five pushed Phase 2/3 commits to the authoritative implementation frontier `f49558e`. That commit contains the unavailable experimental six-state seam in `web/src/protocols/inlineLunge/`; it does not provide participant validity, synchronized evidence, live/upload/session/results integration, coaching authority, or availability. Squat remains the only available protocol. Current naming and milestone authority comes from ADR-011 through ADR-015 and the canonical Phase 4 package index.
> **HISTORICAL AUTHORITY NOTICE:** Retained as evidence of the P4-M00-P4-M14 closure plan. Current execution authority is `KINEMATICIQ_MASTER_EXECUTION_ROADMAP.md`, `docs/program/milestone_registry.yaml`, and `docs/status/program_status.json`; the recorded Forward Lunge blocker remains binding.

**Status:** proposed execution sequence; no milestone in this document is implemented or authorized by the document itself
**Repository baselines reconciled:** fetched `master`/`origin/master` remain at `8d8a77d`; the current-repository audit verifies the unavailable prototype five commits ahead at `f49558e` on `agent/phase2-runtime-and-validation`. The Phase 4 research package is basis-correct for `8d8a77d` and must not be used to erase the later branch evidence.
**Protocol availability at baseline:** `squat` only; the `inlineLunge` research seam is executable offline but is not a public `ProtocolRuntime`
**Identity input:** approved: **Forward lunge with stride and return**, code ID `forwardLungeStrideReturn`, dataset/task version `forward-lunge-stride-return-v1`, and observation ID `side-view-forward-lunge-stride-return-v1`
**Objective:** move the existing unavailable experimental step-to-return lunge research protocol toward validated internal evaluation using the smallest dependency-correct sequence, without conflating engineering completion, scientific validation, claims approval, or public availability.

## 1. Evidence reconciliation and controlling assumptions

### Evidence read

This roadmap reconciles the current repository evidence represented by:

- `docs/00_context_pack.md`, the Phase 2 and Phase 3 roadmaps/handoffs, and `docs/implementation/progress/M99-M115-inline-lunge-research-runtime.md`;
- `docs/research/INLINE_LUNGE_PROTOCOL_RESEARCH.md`, `docs/research/05_Validation_Reliability_and_Scientific_Benchmarking_Handbook.md`, and `docs/research/PUBLIC_MOVEMENT_DATASET_RESEARCH.md`;
- `docs/validation/INLINE_LUNGE_LABELING_PROTOCOL.md`, `PHASE3_INLINE_LUNGE_EXECUTION_PACKAGE.md`, `RELIABILITY_STUDY_TEMPLATE.md`, `METRIC_VALIDATION_STATUS.md`, and `PROPRIETARY_CORPUS_GOVERNANCE.md`;
- `reports/audits/KINEMATICIQ_POST_DATASET_RESEARCH_AUDIT.md`, the dataset registry/corpus-manifest contracts, ADR-006, ADR-007, and ADR-010;
- the checked-in `inlineLunge` research engine, pose-tape contract, synthetic evaluator, validation statistics, tracking baseline, and dataset/manifest validators.
- `PHASE_4_LUNGE_RESEARCH_TO_CODE_RECONCILIATION.md`, including its ref audit, current-session 45-test focused run, 580-test full run, release-readiness E2E, module inventory, contradictions, threshold audit, and ranked gaps;
- the 2026-07-14 Phase 4 package: `INLINE_LUNGE_EVIDENCE_UPDATE.md`, `SINGLE_CAMERA_LUNGE_OBSERVABILITY_REVIEW.md`, `TEMPORAL_TRACKING_FAILURE_AND_RECOVERY_REVIEW.md`, `INLINE_LUNGE_FIELD_VALIDATION_PROTOCOL.md`, `INLINE_LUNGE_DATASET_AND_CAPTURE_SPEC.md`, and `INLINE_LUNGE_EVENT_LABELING_HANDBOOK.md`;
- `LUNGE_PROTOCOL_IDENTITY_DECISION.md`, `FORWARD_LUNGE_DATASET_ACCESS_AND_UTILITY_AUDIT.md`, `DIRECT_MEDIAPIPE_FORWARD_LUNGE_VALIDITY_REVIEW.md`, `PHASE_4_PREREGISTERED_GATE_REGISTRY.md` (`flsr-gates-v0.1`), and `FORWARD_LUNGE_SAMPLE_SIZE_AND_CAPTURE_SCHEDULE.md`.

The named Phase 4 inputs now exist. The identity is approved; numerical registry `flsr-gates-v0.1` is approved only as provisional development input and is not lock-ready. P4-M00 imports them into canonical repository authority, reconciles their `8d8a77d` snapshot with the later unavailable research seam, and records supersession links before migration or new implementation work.

### Reconciled baseline

1. The `f49558e` engine recognizes a **step, descent, pelvis-defined bottom, ascent, and stable return**. It lacks the Phase 4 handbook's distinct visible-plant and return-initiation events, uses a six-state Phase 3 contract, and must not silently inherit a product identity merely because it is currently named `inlineLunge`.
2. Synthetic exact counts establish deterministic code behavior only. They provide no human event validity, threshold validity, joint-angle validity, reliability, or availability evidence.
3. LLM-FMS m05/m06 are ontology-only. They provide neither timed event truth nor permission to import FMS scores.
4. Original timed UI-PRMD media is unavailable in the repository and was previously blocked at the official endpoint. A substitute source requires a new provenance/license decision; it cannot be silently treated as equivalent.
5. The current pose-tape shape is additive and loosely validated. It lacks a declared tape schema version, protocol-parameter identity, source-media checksum, capture-condition record, perturbation lineage, and protocol event-label envelope needed for locked evaluation.
6. Current inline-lunge thresholds are provisional constants in `segmenter.ts`; live recovery is inactive; raw observations remain authoritative.
7. The Phase 4 handbook requires two independent raters, preserved raw labels, agreement before adjudication, and qualification on real development recordings. No rater is qualified yet. The `flsr-gates-v0.1` rater thresholds are approved provisional development inputs, not scientifically validated or locked gates.
8. The executable sample plan proposes 24/40/60 development subjects, 60/120/310 untouched locked subjects, 30/50/80 usable synchronized-reference subjects, and 40/60/90 completed repeat-session subjects. The working budget is 40 development plus 120 locked, but development-derived variance, clustering, unusable rate, event prevalence, count-MAE variability, device floors, and signed precision targets control the final calculation.
9. Public data is evaluation input; strong commercial evidence requires appropriately consented proprietary or expressly permitted data. Raw media, participant identifiers, and restricted data remain outside Git.
10. Squat parity, full abstention, MediaPipe, raw pose-tape replayability, local-first behavior, no composite score, and claims-policy prohibitions remain invariants.
11. No audited public dataset alone closes locked activation. The 2026 synchronized smartphone/OptiTrack dataset is the best provisional RGB-angle lead but lacks a published exact lunge protocol and event labels; SIAT-LLMD closely matches the step/retract task but has no RGB; protocol-matched original KinematicIQ capture remains necessary.
12. The direct-validity review found no study matching MediaPipe/BlazePose + dynamic forward lunge + one consumer RGB camera + synchronized criterion reference. Adjacent OpenPose/MediaPipe studies justify experiments and caution, not validity transfer.

## 2. Phase boundaries and single-milestone rule

Only one Phase 4 milestone may have status `in progress`. A milestone may start only when every dependency is accepted and its manual start gate is signed. A failed acceptance criterion keeps the milestone open or closes it as `failed/returned-to-development`; it never permits work to skip ahead.

| Boundary | Milestones | Completion means | Explicitly does not mean |
|---|---|---|---|
| A — Engineering completion | P4-M00 through P4-M05 | Identity, schemas, validators, perturbations, diagnostics, and the blind labeling tool are ready | Human validity, rater qualification, threshold fitness, claims approval, or availability |
| B — Scientific development and validation | P4-M06 through P4-M12 | Real development evidence qualifies raters and freezes choices before locked datasets answer predeclared questions | Claim promotion, clinical validity, or product activation |
| C — Claims approval | P4-M13 | Qualified reviewers approve a bounded evidence/copy disposition | Product availability |
| D — Availability decision | P4-M14 | Product/evidence owner records an explicit decision after auditing all prior gates | Deployment, release, publication, or broader protocol claims |

Critical path:

`M00 -> M01 -> M02 -> M03 -> M04 -> M05 -> M06 -> M07 -> M08 -> M09 -> M10 -> M11 -> M12 -> M13 -> M14`

P4-M11 and P4-M12 are designed in the same frozen package but execute serially under the one-milestone rule. M12 evaluates only metrics whose prerequisite validity and missingness dispositions permit reliability analysis; neither result may tune the other.

## 3. Gate registry

| Gate | Earliest owner | Closes at | Pass condition | Failure effect |
|---|---|---|---|---|
| G-ID identity | Product + protocol research owner | M00 | Product task, canonical label/ID, legacy meaning, and LLM-FMS relationship recorded | M01 and all protocol-specific data work blocked |
| G-DATA rights/provenance | Dataset custodian + privacy/legal owner | M00, rechecked M07/M10 | Allowed use, consent, storage, checksum, subject key, and source namespace valid | Affected records excluded; no replacement by convenience |
| G-MIG migration | Engineering owner | M01 | Approved rename migrated additively or documented no-op; old artifacts remain readable | M02 blocked |
| G-SCHEMA evidence substrate | Engineering owner | M02 | Versioned tape/manifest readers reject unsafe data and read legacy tapes | Human collection/labeling blocked |
| G-DIAG temporal diagnostics | CV owner | M04 | Deterministic perturbation/diagnostic reports expose failure modes without changing runtime | Human development may proceed, runtime tuning may not |
| G-PILOT development adequacy | Validation + CV owners | M06 | The approved development pilot supplies real capture/tool/schema evidence and disjoint real qualification cases; no locked data are inspected | Return to M02-M05 with a new version; no rater qualification or threshold experiment |
| G-RATER qualification | Validation owner | M07 | Two raters meet the frozen `RAT-*` qualification gates independently on real development recordings | Development collection may continue only as non-evaluative QA; labels cannot enter threshold experiments |
| G-EXPERIMENT candidate selection | CV + statistics owners | M08 | One declared filter/threshold candidate selected on development data only | Baseline retained; M09 blocked |
| G-FREEZE protocol/statistics | Independent validation owner | M09 | Code, model, filter, thresholds, labels, exclusions, splits, hypotheses, gates, and precision-based N frozen | Locked validation prohibited |
| G-LOCK locked count/event validation | Independent validation owner | M10 | Predeclared count/event/false-activation/dropout and missingness gates pass | Research-only; return to a new development cycle, never retune on locked set |
| G-ANGLE synchronized subset | Biomechanics + statistics owners | M11 | Dataset-scoped angle agreement gates pass with stated uncertainty | Angle remains hidden/experimental; count/event track may continue |
| G-REL repeat-session reliability | Statistics owner | M12 | Predeclared ICC/SEM/MDC and failure-rate criteria pass for stated setup | Consistency/change claims remain unavailable |
| G-CLAIMS | Qualified biomechanics/claims reviewers | M13 | Every metric, finding, setup instruction, and limitation has an approved disposition | Availability blocked |
| G-AVAIL | Product/evidence owner | M14 | Explicit written available/defer/reject decision with complete evidence links | Default is unavailable/fail-closed |

## 4. Milestones

### P4-M00 — Reconcile stale documents and freeze protocol identity input

**Disposition:** Complete 2026-07-15; see `progress/P4-M00-phase4-documentation-reconciliation.md`. P4-M01 remains pending.

**Objective:** establish one current evidence ledger and obtain the protocol-identity decision that controls every later identifier, label, dataset mapping, and claim.

**User or research outcome:** maintainers and researchers can tell what exists, what is only planned, what evidence is missing, and which real-world task the engine is intended to evaluate.

**Evidence addressed:** the verified split frontier (`master`/`origin/master` at `8d8a77d`, Phase 3 branch at `f49558e`); Phase 3 handoff and synthetic report; stale M73/M78 and Phase 4 statements that say “no code” or “not approved for implementation” without a commit qualifier; the mismatch between `inlineLunge` terminology and step-to-stable-return behavior; the supplied but not yet canonical identity, dataset, direct-validity, gate, and sample-size records.

**In scope:** inventory every canonical status statement; identify/import the requested Phase 4 records; compare each claim with code and Git state; record the approved task definition, canonical human label, canonical protocol ID, observation protocol ID, legacy alias meaning, source-dataset namespace, and rename disposition; mark superseded documents without deleting history; create a contradiction table and evidence-gap register.

**Out of scope:** identifier/code migration, threshold changes, data acquisition, participant recruitment, labeling, validation, claims promotion, and availability.

**Dependencies:** the `f49558e` Phase 3 artifacts and `8d8a77d` research-package basis are both identifiable and auditable. The branch was cleanly fast-forwarded into local `master` during P4-M00; no merge/rebase decision remains.

**Affected files:** this roadmap; `docs/00_context_pack.md`; `docs/implementation/NEXT_EXECUTION_PACKAGE.md`; `KINEMATICIQ_MASTER_EXECUTION_ROADMAP.md`; `KINEMATICIQ_PHASE3_HANDOFF.md`; `RESEARCH_TO_CODE_TRACEABILITY.md`; `docs/research/INLINE_LUNGE_PROTOCOL_RESEARCH.md`; `.aurelian/project-state.md`, `decision-log.md`, `evidence-log.md`, and `traceability.md`; new `docs/adr/ADR-011-lunge-protocol-identity.md` if no supplied accepted decision already serves that role.

**Acceptance criteria:**

1. Every contradictory status statement is classified `current`, `historical`, or `superseded-by` with a link to current truth.
2. G-ID records one unambiguous movement task and explicitly says whether rename is approved, rejected, or still blocked.
3. The identity record distinguishes product protocol IDs from dataset movement IDs and forbids score import.
4. The evidence-gap register explicitly marks timed human data, rater qualification, synchronized reference angles, repeat sessions, physical-device evidence, claims review, and availability as absent unless artifacts prove otherwise.
5. No file claims that synthetic results constitute scientific validation.

**Automated tests:** repository link/path check for all evidence references; search assertions that historical “no code” statements carry a supersession marker; existing docs/traceability tests if present. No application test is a substitute for the manual reconciliation review.

**Manual/human gates:** product owner, protocol research owner, and evidence owner sign G-ID; dataset custodian confirms which Phase 4 inputs are authoritative.

**Rollback behavior:** revert documentation/ADR changes. Reverting restores ambiguity and therefore blocks M01; it does not restore authority to stale statements.

**Documentation updates:** all affected status/index/decision files above; add date, commit, decision owners, and unresolved questions.

**Explicit non-authorization:** this milestone does not authorize a rename, runtime change, data access, recruitment, claims, activation, merge, deploy, release, or publication.

### P4-M01 — Execute the approved protocol rename as an additive migration, or close as a documented no-op

**Objective:** if G-ID approves a new canonical identity, migrate without breaking legacy artifacts; otherwise prove that no rename work is needed.

**User or research outcome:** new research artifacts use the approved task name while old tapes, reports, manifests, and local sessions remain readable and cannot accidentally activate a protocol.

**Evidence addressed:** current closed `ProtocolId` union, `inlineLunge` module paths and output IDs, registry status `planned`, null profile, empty input modes, and versioned artifact policy.

**In scope:** expand with the approved canonical ID/label and observation protocol ID; add an explicit legacy-ID normalization map at deserialization/import boundaries; migrate internal research/eval identifiers and filenames; retain read compatibility for `inlineLunge`; update dataset/traceability namespaces; add deprecation diagnostics; only contract the legacy writer after corpus audit proves no current writer depends on it.

**Out of scope:** changing segmentation behavior, thresholds, public runtime maps, stored user data in place, deleting legacy aliases, or making the protocol selectable/actionable.

**Dependencies:** M00 and signed G-ID. If rename is rejected, this milestone is a verification/documentation no-op and proceeds directly to acceptance.

**Affected files:** `web/src/core/protocol.ts`; `web/src/protocols/registry.ts` and tests; `web/src/protocols/inlineLunge/**` or its approved canonical successor; `web/src/eval/inlineLungeEvaluation.ts`; `web/scripts/runInlineLungeEvaluation.ts`; session/outcome deserializers that carry `ProtocolId`; `web/eval/datasets/registry.json`; local manifest examples; protocol architecture, labeling, traceability, metric-status, and handoff docs. Existing local/private artifacts are audited, not committed.

**Acceptance criteria:**

1. Approved rename: new writers emit only the canonical ID; legacy fixtures deserialize to the same internal protocol; unknown IDs fail closed; legacy and canonical IDs cannot both register as independently available protocols.
2. No-rename decision: a current-session search proves no migration edit is required and the identity rationale is linked.
3. Registry status remains `planned`, profile remains null, capture input modes remain empty, and public runtime/profile lookup still throws.
4. Squat session/tape/eval outputs are byte- or semantic-parity equivalent under the existing tests.
5. A rollback/contract plan names the evidence required before removing the legacy reader.

**Automated tests:** legacy/canonical serialization round trips; registry uniqueness and fail-closed tests; old session/outcome/tape fixture reads; inline research evaluation determinism; full unit suite, build, coverage, and pose-tape replay.

**Manual/human gates:** evidence owner verifies representative private/local manifests and exports can be read without exposing them; product owner confirms displayed research label matches G-ID.

**Rollback behavior:** keep the legacy reader and revert canonical-writer/module changes. Never rewrite or delete user/local artifacts during rollback.

**Documentation updates:** identity ADR/decision, context pack, architecture, research package, labeling protocol, traceability, metric board, Phase 3 handoff supersession note, and a new milestone progress record.

**Explicit non-authorization:** the migration does not authorize availability, public selection, new capture modes, data conversion in place, claim strengthening, or legacy-reader removal.

### P4-M02 — Extend pose-tape and dataset-manifest schemas for auditable human evidence

**Objective:** create the versioned evidence substrate required by perturbation, labeling, locked splits, synchronized reference, and repeat-session studies.

**User or research outcome:** every evaluation record can be traced to the exact source, protocol, participant/session key, capture conditions, algorithm/filter version, consent/use boundary, labels, and transformations without committing identifying media.

**Evidence addressed:** additive but unversioned pose-tape reader; squat-only `meta.truth`; corpus manifest v1; dataset registry v1; missing protocol parameters, media checksum, capture conditions, split/freeze state, perturbation lineage, event-label linkage, and reference/repeat-session linkage.

**In scope:** additive PoseTape v2 envelope with explicit schema version; canonical protocol/observation ID plus protocol parameters such as lead side; raw-frame authority flag; source artifact SHA-256; pseudonymous subject/session/visit keys; device/view/setup metadata; capture and processing versions; transformation/perturbation lineage; detached label-set references/checksums; reference-system synchronization metadata; split/use/freeze status; CorpusManifest v2 and protocol-study manifest validator; deterministic v1-to-v2 in-memory normalization; privacy/path/checksum/namespace invariants.

**Out of scope:** embedding raw video, contact details, re-link keys, labels from unqualified raters, changing landmarks, automatically upgrading local files, or changing analysis results.

**Dependencies:** M01.

**Affected files:** `web/src/eval/poseTape.ts` and tests; `web/src/eval/corpusManifest.ts` and tests; `web/src/eval/datasetRegistry.ts` and tests; new `web/src/eval/protocolStudyManifest.ts` and tests; `eval-tapes/MANIFEST.example.json`; `docs/validation/validation-corpus.md`; `DATASET_OPERATOR_RUNBOOK.md`; `PROPRIETARY_CORPUS_GOVERNANCE.md`; ADR-004/006/010 amendment or successor ADR; export/import boundaries that deserialize pose tapes.

**Acceptance criteria:**

1. All checked-in legacy tapes and synthetic fixtures remain readable with documented default/unknown values; new v2 writers emit a stable canonical shape.
2. Validators reject duplicate IDs, cross-split subjects, unsafe paths, missing required checksums, invalid consent/use combinations, inconsistent protocol/lead-side identities, and references to nonexistent label or source IDs.
3. Raw frames are never mislabeled as filtered; transformations form an acyclic lineage rooted in a raw artifact.
4. Locked/test records cannot be marked development/tuning inputs.
5. Repository examples contain no real participant, absolute path, credential, restricted bytes, or re-link key.

**Automated tests:** schema parse/round-trip and legacy fixtures; property/fuzz cases for invalid manifests; checksum format/path traversal/privacy tests; cross-record referential integrity tests; tape replay parity; full unit/coverage/build/eval-tapes matrix.

**Manual/human gates:** dataset custodian and privacy owner review the v2 fields, purpose limitation, storage convention, withdrawal handling, and example records before any human collection.

**Rollback behavior:** disable v2 writing and retain dual-read support; no collected v2 artifact is deleted. A reader rollback that makes accepted evidence unreadable is prohibited.

**Documentation updates:** schema reference, operator runbook, corpus governance, ADRs, context pack, traceability, and migration note with supported versions.

**Explicit non-authorization:** schema readiness does not authorize collecting people, accepting licenses, downloading data, treating metadata as truth, changing filters, validation, or availability.

### P4-M03 — Build a deterministic perturbation library

**Objective:** produce reproducible, provenance-preserving transformations that isolate temporal tracking failure modes before human threshold work.

**User or research outcome:** engineers can replay exactly the same raw tape under declared dropout, jitter, timestamp, crop/occlusion-mask, confidence, and frame-rate stressors and attribute changes to one transformation.

**Evidence addressed:** synthetic lunge fixture determinism, M85 tracking baseline, M87 short-gap candidate, current failure taxonomy, and the absence of a general perturbation contract.

**In scope:** pure seeded transformations for contiguous and intermittent landmark dropout, visibility degradation, coordinate jitter, timestamp jitter, frame duplication/removal, FPS resampling, bounded crop/occlusion masks, and deterministic composition; immutable raw input; typed perturbation manifest; version/seed/parameters/checksum lineage; protocol-agnostic APIs plus lunge fixtures.

**Out of scope:** photorealistic video generation, claiming perturbations model population behavior, enabling interpolation/recovery in production, changing MediaPipe, or tuning thresholds.

**Dependencies:** M02.

**Affected files:** new `web/src/eval/perturbations/` modules/tests; `web/src/eval/poseTape.ts` lineage types; new `web/scripts/runPerturbationMatrix.ts`; `web/package.json`; benchmark-results schema/docs; tracking evaluation fixtures.

**Acceptance criteria:** same input/version/seed/parameters yields byte-identical transformed frames and manifest; different seeds change only declared stochastic operations; identity transform preserves exact tape; compositions are ordered and replayable; timestamps remain monotonic unless the named negative case intentionally violates them and the validator rejects it; raw source checksum never changes.

**Automated tests:** golden fixtures per perturbation; determinism/reversibility where mathematically possible; bounds, monotonicity, no-mutation, composition-order, malformed-parameter, left/right parity, and identity tests; build/unit/coverage/tape replay.

**Manual/human gates:** CV owner reviews whether each perturbation corresponds to an observed or explicitly hypothetical failure mode and signs the library version for diagnostic use.

**Rollback behavior:** remove the perturbation runner/library from experiment configuration while preserving generated manifests/reports; production runtime is unaffected because the library is eval-only.

**Documentation updates:** perturbation catalog, limitations, versioning policy, examples, traceability, and progress evidence.

**Explicit non-authorization:** passing synthetic perturbations does not authorize live recovery, filter changes, threshold changes, human-validity claims, or availability.

### P4-M04 — Add temporal tracking diagnostics and freeze an engineering baseline

**Objective:** quantify landmark continuity and event sensitivity across raw and perturbed tapes without selecting a new production behavior.

**User or research outcome:** researchers can see where event/count results depend on dropout, timestamp/FPS behavior, landmark jumps, side ambiguity, or filter lag, including worst cases rather than aggregate-only success.

**Evidence addressed:** M85 raw-versus-One-Euro parity, M86 state taxonomy, M87 bounded recovery experiment, provisional lunge event thresholds, and the need for temporal diagnostics before field data collection.

**In scope:** per-landmark readable-run/dropout distributions; coordinate jump/velocity/acceleration outliers; timestamp/FPS integrity; side continuity; phase-transition persistence; raw-to-filter lag; event/count sensitivity curves; missingness by phase; per-sequence and aggregate redacted report with algorithm/filter/perturbation versions; immutable baseline.

**Out of scope:** choosing thresholds, enabling recovery, hiding failed sequences, converting synthetic robustness into human validation, or changing product output.

**Dependencies:** M03.

**Affected files:** `web/src/eval/trackingRobustness.ts` and tests; new lunge temporal diagnostic module/tests; `web/scripts/runTrackingRobustnessBaseline.ts` or a new protocol-specific runner; `web/eval/benchmark-results/`; `docs/validation/METRIC_VALIDATION_STATUS.md`; tracking progress/handoff docs.

**Acceptance criteria:** report includes denominators, sample/tape counts, per-sequence rows, median/p95/max, missingness, and worst cases; raw and every candidate filter are separately identified; rerun from the same manifest is byte-identical except an explicitly excluded generation timestamp; event/count outputs link to exact tape and transformation; failures remain visible; production configuration is unchanged.

**Automated tests:** metric math/golden reports; empty/irregular/nonmonotonic sequences; phase-boundary dropout; FPS variants; perturbation matrix determinism; regression against M85/M87 fixtures; unit/coverage/build/eval-tapes.

**Manual/human gates:** CV and validation owners review the baseline and classify each failure as measurement, capture, label, or unresolved; unresolved defects are entered before M05.

**Rollback behavior:** revert diagnostic code/report registration while retaining the prior immutable report for audit; no production rollback is required.

**Documentation updates:** diagnostic definitions, baseline record, failure taxonomy, risk register, metric board, traceability, and operator interpretation warnings.

**Explicit non-authorization:** this milestone does not select filters/thresholds, enable short-gap recovery, qualify data, validate events, or authorize availability.

### P4-M05 — Deliver the independent event-labeling tool

**Objective:** let blinded raters create, validate, freeze, compare, and adjudicate protocol event labels against original timed media without seeing KinematicIQ output.

**User or research outcome:** raters can efficiently mark the frozen Phase 4 event ontology—standing anchor, step initiation, visible plant, descent onset, bottom, ascent onset, return initiation, and stable return—plus completeness/exclusion, lead side, occlusion/crop, ambiguity, and notes with frame-accurate provenance and preserved raw opinions.

**Evidence addressed:** labeling protocol CSV shapes and independence rules; current squat-only in-place CLI; current absence of a lunge video labeling surface and immutable label-set contract.

**In scope:** local-only labeling UI/CLI; video/frame navigation and keyboard controls; source-FPS/time display; explicit null/missing events; ordered-event and manifest validation; blinded mode; autosave/recovery; immutable raw export; SHA-256; compare mode only after freeze; adjudication as a third record; audit log; accessible workflow; import/export of the M02 label schema.

**Out of scope:** automated prelabels, showing model predictions/FMS scores, overwriting raw labels, cloud storage, participant recruitment, rater qualification, or treating tool usability as agreement evidence.

**Dependencies:** M02; M04 informs diagnostic overlays but model outputs remain hidden from raters.

**Affected files:** new `web/src/eval/eventLabels.ts` and tests; new local labeling screen/tool and tests under `web/src/`; new runner script; `web/package.json`; `docs/validation/INLINE_LUNGE_LABELING_PROTOCOL.md`; `DATASET_OPERATOR_RUNBOOK.md`; label schema/example files; accessibility test suite.

**Acceptance criteria:** complete keyboard-only labeling of a fixture; frame/time mapping is exact at declared FPS; nulls are preserved; impossible ordering and source/checksum mismatch fail closed; frozen raw files are immutable; adjudication creates a new linked record; blinded mode exposes no KinematicIQ or FMS result; crash recovery never silently changes accepted labels.

**Automated tests:** parser/validator/round-trip; frame-time conversion at common and variable FPS; ordering/missingness; freeze/immutability/adjudication; checksum mismatch; keyboard/accessibility; browser support; build/unit/coverage.

**Manual/human gates:** two non-developer users complete a usability dry run on synthetic or expressly non-study media; accessibility owner executes the relevant Windows/browser workflow; validation owner confirms blinding.

**Rollback behavior:** export/recover all draft labels, revert the tool, and retain schema-readable files. Never delete or overwrite rater work.

**Documentation updates:** rater manual, tool quick start, label schema, adjudication rules, privacy/storage instructions, and progress evidence.

**Explicit non-authorization:** tool completion does not qualify raters, authorize study media, permit model-assisted labels, validate the protocol, or make it available.

### P4-M06 — Run the consented field-development pilot

**Objective:** retire capture, metadata, tool, schema, and failure-taxonomy risks on development-only human data and create real recordings for rater training and qualification before choosing filters or thresholds.

**User or research outcome:** the team knows whether ordinary consumer capture can produce labelable step-to-return trials and negatives across declared setup/device nuisance conditions, without contaminating locked validation.

**Evidence addressed:** proprietary corpus governance; the dataset audit’s conclusion that no public source alone closes the protocol; the sample plan’s 8-subject shakedown, 24-subject minimum variance block, conditional 40-subject expected block, and maximum 60-subject high block; unvalidated camera assumptions and absent protocol-matched timed human evidence.

**In scope:** approved adult development-only cohort; the prespecified 13-recording/14-attempt first-session package or its signed successor; both lead sides; complete/partial/wrong-movement/invalid-capture cases; device/view/lighting/clothing/setup matrix; original media plus raw pose tapes; training/pilot labels with preserved rater status; exclusions/missingness/complaints; operational timing; real qualification cases held apart from later threshold experiments; no locked subjects.

**Out of scope:** efficacy, diagnosis, injury/pain research, population norms, locked reporting, final threshold selection, confirmatory rater agreement, angle-reference claims, repeat-session claims, or public recruitment promises.

**Dependencies:** M02, M04, M05, signed identity/consent/privacy/license/storage/retention/custodian/incident plans, named device access, and G-DATA. Synthetic examples may teach the tool but cannot replace real development recordings.

**Affected files:** local/private development manifest and media store; redacted aggregate report under `web/eval/benchmark-results/` if approved; `docs/validation/PROPRIETARY_CORPUS_GOVERNANCE.md`; field-pilot protocol/report; capture manual; handbook example index; dataset registry/corpus examples only for schema changes; risk, evidence, and metric-board records.

**Acceptance criteria:** the first 8 subjects close consent, capture-duration, synchronization, metadata, safety, schema, and tool defects; at least 24 subjects complete the variance block; expansion to 40 or 60 occurs only under the prespecified triggers; required failure families and device/condition cells have readable examples or explicit shortfalls; qualification packets are real, rights-approved, development-only, and disjoint from locked data; all attempts remain in denominators; all protocol/tool changes are versioned.

**Automated tests:** manifest/source/consent/checksum integrity; split/source-group leakage; tape/label schema validation; deterministic derivation; completeness/missingness reports; secret/path/identifier scan of tracked outputs; no-raw-media-in-Git check; regression suite.

**Manual/human gates:** privacy/legal/product pre-collection approval; participant consent and stop authority; custodian access audit; biomechanics/CV review after each planned block; statistician approves any expansion; G-PILOT sign-off.

**Rollback behavior:** stop collection; quarantine, withdraw, or delete data only under the approved consent/retention procedure; preserve permitted redacted failure evidence; never move a development subject into locked validation; revert code/tool changes separately.

**Documentation updates:** approved protocol/capture schedule, sampling matrix, deviations, exclusions, feasibility report, failure taxonomy, example provenance, storage/access/retention record, and risk/evidence logs.

**Explicit non-authorization:** the pilot does not qualify raters, validate performance, set thresholds, promote metrics, justify availability, permit model training, or authorize broader collection.

### P4-M07 — Qualify raters and lock the labeling procedure

**Objective:** demonstrate that at least two independent raters can apply the frozen definitions consistently on real development recordings before their labels enter threshold experiments or locked validation.

**User or research outcome:** event/count truth is produced by a documented, reproducible human process rather than by developers, synthetic-only practice, or model output.

**Evidence addressed:** Phase 4 dual-rater/adjudication workflow; `flsr-gates-v0.1` `RAT-CATEGORY`, `RAT-EVENT`, `RAT-LEAD`, `RAT-CAPTURE`, `RAT-AMBIG`, and `RAT-QUAL`; low/expected/high qualification subsets of 16/24/36 development subjects and 128/192/288 double-labeled recordings; absence of a qualified pool.

**In scope:** training packet with feedback; two non-overlapping blinded qualification packets per rater; both sides and all critical categories/failure families; category, side, capture, event, ambiguity, completeness, and tool-error reports; retraining on new development cases; named adjudicator; drift/requalification triggers; handbook/schema/tool version lock.

**Out of scope:** threshold tuning, labeling locked test data, using qualification cases as locked outcomes, changing model behavior, or qualifying clinical judgment.

**Dependencies:** M06 provides approved real development recordings and closes blocking tool/definition defects. Qualification cases remain outside the locked set and outside algorithm threshold evaluation.

**Affected files:** `docs/validation/INLINE_LUNGE_EVENT_LABELING_HANDBOOK.md`; new rater-qualification protocol/report; local-only qualification manifests/labels; validation statistics/tests only if required math is absent; gate registry results; evidence and progress records.

**Acceptance criteria:** two raters independently pass the signed `RAT-*` criteria on real held-out development packets; no critical anatomical-side inversion or omitted attempt occurs; raw files/checksums are preserved; agreement is computed before adjudication; failed packets remain evidence; tool/definition defects increment versions and trigger a new qualification; adjudicator, retraining threshold, and drift policy are recorded. Provisional `flsr-gates-v0.1` numbers must be signed or replaced before the first qualification packet opens.

**Automated tests:** agreement/event-error calculations on golden cases; subject/case separation validator; raw/adjudicated linkage and checksum checks; ambiguity/missingness accounting; report reproducibility.

**Manual/human gates:** biomechanics lead, rater coordinator, and statistician sign the qualification criteria/results for two pseudonymous rater IDs and an adjudicator role; G-RATER closes only through human approval.

**Rollback behavior:** revoke qualification for affected versions, preserve results as failed evidence, revise definitions/tool under a new version, and requalify on new development cases.

**Documentation updates:** locked handbook, qualification protocol/report, labeling/tool versions, rater role matrix, drift policy, gate registry, and evidence log.

**Explicit non-authorization:** qualified raters do not authorize locked collection, threshold selection, scientific passage, claims, clinical labels, or availability.

### P4-M08 — Run development-only threshold and filter experiments

**Objective:** select at most one candidate configuration for freeze using only development data and deterministic stress evidence.

**User or research outcome:** the candidate balances event/count behavior, false activation, dropout, lag, and abstention against the declared task instead of relying on synthetic intuition.

**Evidence addressed:** provisional `INLINE_LUNGE_THRESHOLDS`, raw/One-Euro tracking evidence, inactive short-gap recovery candidate, M04 diagnostics, and M07 labels/failure modes.

**In scope:** predeclare candidate grid and primary/guardrail metrics; compare current baseline, justified filters, persistence/return/dropout thresholds, and optionally the already-isolated bounded recovery candidate; participant-grouped development resampling; per-failure-mode and worst-case results; latency/lag; abstention; choose one candidate or retain baseline; record all attempted configurations.

**Out of scope:** viewing locked validation/test results, unlimited search, optimizing projected knee-angle error, changing MediaPipe/model, claim promotion, or enabling a candidate in the public runtime.

**Dependencies:** M07.

**Affected files:** `web/src/protocols/<canonical-lunge>/segmenter.ts`; filter/recovery experiment configuration under `web/src/eval/`; evaluation runner/report schema; immutable development reports; protocol traceability, metric board, risk register, and experiment decision record. Production defaults remain unchanged until a later separately authorized integration.

**Acceptance criteria:** hypotheses/grid/selection rule are timestamped before results; subjects are grouped in resampling; every candidate is run on identical manifests; report includes confidence intervals, denominators, missingness, negatives, lag, worst cases, and perturbation results; one candidate is selected by the frozen rule or baseline is retained; selection does not inspect future locked data; source and configuration hashes are recorded.

**Automated tests:** candidate/config parser; deterministic matrix and grouped bootstrap; boundary fixtures; negative movements; left/right; filter-lag calculations; report snapshot; full unit/coverage/build/eval-tapes and squat parity.

**Manual/human gates:** CV, statistics, and validation owners review experiment multiplicity, practical tradeoffs, and leakage audit; sign G-EXPERIMENT.

**Rollback behavior:** retain current baseline configuration, archive candidate reports as rejected/development evidence, and revert experiment-only code. A failed candidate never becomes a silent default.

**Documentation updates:** experiment protocol/results, accepted/rejected hypotheses, threshold provenance, filter version ledger, metric board, traceability, and progress record.

**Explicit non-authorization:** candidate selection does not authorize production integration, locked-set retuning, angle claims, reliability claims, coaching, or availability.

### P4-M09 — Freeze gates, analysis package, splits, and precision-based sample sizes

**Objective:** create the immutable validation package before any locked outcomes are inspected.

**User or research outcome:** final internal evaluation answers prespecified questions with enough data for interpretable uncertainty and cannot be moved after results are known.

**Evidence addressed:** the proposed human-authority registry `flsr-gates-v0.1`; its explicit `pass`, `fail`, `inconclusive`, and `blocked` vocabulary; the executable low/expected/high sample plan; validation-handbook precision and ICC guidance; and separation of development, qualification, locked benchmark, synchronized-reference, repeat-session, and stress sets.

**In scope:** review, amend if necessary, approve, and hash one successor to `flsr-gates-v0.1` rather than creating a competing registry; freeze canonical protocol and label versions; algorithm/model/filter/threshold/perturbation versions; source manifests/checksums; subject/site/device-disjoint allocations; primary and secondary endpoints; exclusions/missing-data rules; all applicable `RAT-*`, `ALG-*`, `ROB-*`, `TMP-*`, and `ANG-*` gates; confidence-interval methods; subgroup/stress reporting; multiplicity; precision calculations and low/expected/high recruitment triggers for locked count/event evaluation (60/120/310), synchronized-angle subset (30/50/80 usable), and repeat-session reliability (40/60/90 complete); stop/replacement rules; analysis scripts; claims that each endpoint could support.

**Out of scope:** running/peeking at locked outputs, changing labels after freeze, reusing development subjects as locked evidence, promising research-grade generalization, or setting a sample size solely from a generic rule of thumb.

**Dependencies:** M08 and source availability sufficient to calculate attainable precision.

**Affected files:** canonical repository import or explicitly versioned successor of `PHASE_4_PREREGISTERED_GATE_REGISTRY.md` (`flsr-gates-v0.1`); canonical import or signed successor of `FORWARD_LUNGE_SAMPLE_SIZE_AND_CAPTURE_SCHEDULE.md`; frozen study manifests/configs outside Git with redacted hashes in Git; evaluator/statistics configs/tests; labeling protocol; metric board; evidence/decision/traceability logs.

**Acceptance criteria:** one signed registry preserves stable gate IDs and supersession history; each gate has endpoint, unit of analysis, population/setup, threshold, CI method, denominator, missingness rule, owner, evidence path, and consequence; the locked plan explicitly includes `ALG-COUNT-EXACT`, `ALG-COUNT-MAE`, `ALG-BOTTOM-PRF/MED/P95`, `ALG-COMP-SENS/SPEC`, `ALG-FALSE-COMP`, `ALG-ABSTAIN-INVALID`, `ALG-FALSE-ABSTAIN`, `ALG-WRONG-MOVE`, `ALG-SIDE-INVERT`, `ALG-TIME-DISC`, and applicable `ROB-*`/`TMP-*` gates; each N is derived from expected variance/rate and desired CI precision with assumptions/sensitivity table; the working budget of 40 development plus 120 locked is retained only if pilot estimates support it, with 60/120/310 locked, 30/50/80 synchronized, and 40/60/90 reliability scenarios recorded; the plan distinguishes participants, sessions, sequences, trials, and negative cases; all subjects/splits and hashes freeze before first locked run; outcome-informed amendment invalidates confirmatory status.

**Automated tests:** split leakage and allocation reproducibility; manifest/config/hash validation; sample-size calculator golden cases and assumption bounds; gate completeness lint; analysis dry run on synthetic/development fixtures; report schema snapshot.

**Manual/human gates:** independent statistics reviewer, dataset custodian, validation owner, privacy owner, and protocol/biomechanics owner sign G-FREEZE. Developers relinquish access to locked outcomes until the run.

**Rollback behavior:** before locked execution, issue a new version and new hashes; after any peek/run, never overwrite the freeze—close the package as exploratory and create a genuinely new locked cohort/package.

**Documentation updates:** gate registry, sample-size/analysis plan, freeze certificate, access matrix, deviation policy, metric board, risk/evidence/decision logs.

**Explicit non-authorization:** freeze approval does not assert gates passed, authorize outcome-driven changes, validate claims, activate the protocol, or authorize publication.

### P4-M10 — Execute locked count/event validation

**Objective:** evaluate the frozen candidate once on independent locked human sequences and declared negatives.

**User or research outcome:** the team obtains an auditable internal answer for complete-trial count, the frozen Phase 4 event ontology, false activation, dropout, abstention, and capture failure within the frozen population/setup.

**Evidence addressed:** synthetic M109 results, qualified labels, field-pilot development evidence, and the frozen gate/sample package.

**In scope:** custodian-controlled run of the exact frozen package; adjudicated labels; all frozen `ALG-*`, applicable `ROB-*`, and `TMP-*` endpoints; per-sequence and aggregate results; participant-grouped confidence intervals; missingness/exclusions; subgroup/device/stress results as predeclared; integrity/deviation log; `pass`/`fail`/`inconclusive`/`blocked` disposition per gate; immutable raw and redacted reports.

**Out of scope:** threshold/filter/code changes, relabeling because the model disagrees, hiding exclusions, angle validity, repeat-session reliability, claims approval, or availability.

**Dependencies:** M09, target N achieved or prespecified under-recruitment rule invoked, and locked access control verified.

**Affected files:** frozen local manifests/labels/media; versioned evaluator config/runner; immutable redacted result under `web/eval/benchmark-results/` if rights permit; gate registry result fields; metric board; validation report; evidence/risk/handoff records. No raw participant data enters Git.

**Acceptance criteria:** input/code/config hashes match freeze; one confirmatory run is recorded; every sequence is accounted for; raw rater and adjudicated labels remain preserved; every applicable gate reports `pass`, `fail`, `inconclusive`, or `blocked` with CI and denominators; a favorable point estimate with inadequate CI precision is `inconclusive`; prohibited false completion, side inversion, or timestamp behavior cannot be averaged away; failures and deviations remain visible; no outcome-informed rerun is called confirmatory; dataset scope and limitations are explicit.

**Automated tests:** preflight hash/freeze/split checks; evaluator golden tests; independent recomputation of summary from row output; grouped CI calculations; report schema and completeness; secret/identifier scan; full regression and squat parity at frozen commit.

**Manual/human gates:** custodian witnesses run; independent statistics reviewer reproduces summaries; validation owner signs G-LOCK disposition. Any failed hard gate returns the protocol to research-only development under a new roadmap cycle.

**Rollback behavior:** results are immutable and cannot be rolled back. Operational code may be reverted, but evidence is superseded only by a separately frozen study; failures remain in the ledger.

**Documentation updates:** locked validation report, gate outcomes, deviations, metric board, risk/evidence/traceability logs, and handoff.

**Explicit non-authorization:** passing count/event gates does not validate the projected knee angle, repeatability, coaching, clinical meaning, claims, or availability.

### P4-M11 — Evaluate the synchronized angle subset

**Objective:** quantify agreement of the projected lead-knee sagittal angle against a synchronized approved reference for the frozen subset.

**User or research outcome:** the team knows whether the angle can remain an internal experimental estimate, advance within a narrowly stated setup, or must be removed/suppressed.

**Evidence addressed:** current 2D projected knee angle at the pelvis-defined bottom; the direct-validity review's finding that no exact MediaPipe/dynamic-forward-lunge/consumer-RGB/synchronized-reference study was found; `ANG-LEAD-KNEE-v0.1`; the provisional 30/50/80 usable-subject synchronized plan; and camera/setup sensitivity.

**In scope:** approved synchronized 3D motion-capture or justified reference; clock/frame synchronization audit; coordinate/sign/unit/event alignment; predeclared bottom-event matching; MAE, RMSE, bias, Bland-Altman limits with CIs, ICC model/CI where justified, missingness, and per-subject/device worst cases; sensitivity analysis for synchronization tolerance; disposition of the metric.

**Out of scope:** frontal/transverse angles, forces/loads, inverse dynamics, using correlation alone, changing the estimator, post-hoc event selection, or generalizing beyond the frozen setup/population.

**Dependencies:** M09 frozen angle plan and data; executed after M10 under the single-milestone rule. M10 failure does not automatically invalidate a scientifically separable angle subset, but the decision to continue must be recorded and cannot support availability while count/event gates fail.

**Affected files:** local synchronized dataset/manifests; reference adapter and tests under `web/src/eval/datasets/`; alignment/agreement runner; immutable angle report; `METRIC_VALIDATION_STATUS.md`; protocol research/traceability/gate/evidence records.

**Acceptance criteria:** synchronization error is measured and within frozen tolerance; participant-level pairing is correct; missing pairs are reported; 30 usable subjects is only the first decision point, with expansion to 50 or 80 controlled by the frozen repeated-measures limits-of-agreement precision rule; `ANG-LEAD-KNEE-v0.1` or its signed successor is applied without estimator tuning; report includes MAE/RMSE/bias/limits of agreement/CI and ICC only with appropriate design; metric disposition is `suppress`, `experimental for [scope]`, or evidence-supported tier proposal pending M13—never automatically promoted.

**Automated tests:** coordinate/unit/sign adapters; synchronization alignment fixtures; event pairing; agreement/CI golden calculations; missing/outlier cases; input/hash/split integrity; reproducible report.

**Manual/human gates:** biomechanics lab owner confirms reference validity/calibration; statistics reviewer signs analysis; claims reviewer records preliminary wording constraints; G-ANGLE closes.

**Rollback behavior:** suppress or retain the angle at its prior experimental/internal state; preserve failed evidence; do not substitute a different reference or tolerance without a new freeze.

**Documentation updates:** reference protocol, synchronization QA, agreement report, metric board, limitations, gate registry, risk/evidence/traceability logs.

**Explicit non-authorization:** an angle pass does not authorize kinetics, joint health, normative correctness, FMS scoring, clinical claims, coaching, or availability.

### P4-M12 — Run repeat-session reliability

**Objective:** estimate session-to-session reliability and measurement error for eligible frozen outputs under the stated consumer setup.

**User or research outcome:** the team knows whether count, timing, and any eligible angle/consistency output are stable enough for internal longitudinal interpretation and what change is smaller than measurement noise.

**Evidence addressed:** within-set consistency requirement, current reliability helpers/template, lack of repeat sessions, handbook ICC(2,1)/SEM/MDC guidance, and the frozen precision plan.

**In scope:** 40/60/90 complete-participant low/expected/high scenarios under the frozen precision rule; same participants across at least two prespecified sessions; same and any explicitly compared device/operator setup; capture failure and abstention; ICC model justified by design, CI, SEM, MDC95, within-subject absolute difference, Bland-Altman where appropriate, and categorical/count stability; per-metric eligibility; attrition/missingness; no tuning.

**Out of scope:** responsiveness to training, fatigue attribution, normative change, exposing MDC to users, changing thresholds, or pooling incompatible setup variants.

**Dependencies:** M09 frozen reliability plan; executed serially after M10/M11 as scheduled. Only metrics that passed their prerequisite validity gate are eligible for reliability-based claim review.

**Affected files:** `web/src/eval/reliability.ts` and tests; `web/src/validation/statistics.ts`; local repeat-session manifest; immutable reliability report; `RELIABILITY_STUDY_TEMPLATE.md`; `METRIC_VALIDATION_STATUS.md`; gate/evidence/traceability records.

**Acceptance criteria:** achieved participant/session counts meet the frozen 40/60/90 decision rule or invoke its prespecified under-recruitment consequence; ICC model/unit/averaging match intended use; CIs, SEM, MDC, failure/abstention, and missingness are reported; results are metric- and setup-specific; no failed validity metric is rehabilitated by high repeatability; gates close `pass`, `fail`, `inconclusive`, or `blocked` exactly as frozen.

**Automated tests:** ICC/SEM/MDC and grouped-pair golden cases; unbalanced/missing/constant data; participant/session leakage; report recomputation and hashes; regression suite.

**Manual/human gates:** statistics owner approves model/interpretation; validation owner verifies session protocol and attrition; G-REL closes.

**Rollback behavior:** keep outputs experimental/hidden and preserve the result; operational helpers can be reverted, but a new reliability claim requires a new frozen study.

**Documentation updates:** reliability protocol/report, metric board, setup scope, gate registry, claims-input packet, risk/evidence/traceability logs.

**Explicit non-authorization:** reliability does not prove accuracy, responsiveness, causation, clinical utility, meaningful improvement, or availability.

### P4-M13 — Conduct independent claims and interpretation review

**Objective:** after scientific gate dispositions are signed, convert the complete evidence packet into an explicit allowed/suppressed/revise/reject claims disposition for every research output and proposed statement without reopening or reinterpreting failed science.

**User or research outcome:** any future internal evaluation or product proposal uses language no stronger than the evidence and clearly states task, population, setup, uncertainty, and abstention limits.

**Evidence addressed:** M10 count/event results, M11 angle disposition, M12 reliability, claims policy, forbidden FMS/clinical/kinetic/normative claims, and the Phase 3 expert-review script.

**In scope:** claims-focused independent review of the already signed scientific dispositions for task definition, event semantics, camera/setup, filters/thresholds, missingness, metrics, findings, confidence, abstention, report/camera copy, limitations, failure cases, evidence tier, and provenance; line-by-line disposition `approve-internal`, `approve-bounded-copy`, `revise`, `suppress`, or `reject`; unresolved minority opinion; copy snapshot/checksum. A biomechanics reviewer checks scientific fidelity but cannot turn a failed or inconclusive gate into a pass.

**Out of scope:** changing algorithms or data, inventing a passing interpretation, legal/regulatory clearance, availability, deployment, or publication.

**Dependencies:** M10 and completed dispositions from M11/M12; all hard failures visible.

**Affected files:** new `docs/validation/PHASE4_LUNGE_CLAIMS_REVIEW.md`; `docs/doctrine/claims-policy.md` only if policy clarification is approved; `METRIC_VALIDATION_STATUS.md`; protocol definition/copy proposals (not activated); traceability; gate/evidence/decision/handoff records.

**Acceptance criteria:** every metric/finding/string has evidence links and disposition; projected angle and repeat-session language follow their specific gates; no forbidden claim or FMS score remains; scope qualifiers and uncertainty are explicit; abstention behavior is approved; failed, inconclusive, or blocked evidence cannot receive stronger copy; reviewers disclose qualifications/conflicts and sign G-CLAIMS.

**Automated tests:** claims vocabulary/strength lint on proposed strings; metric-to-evidence and finding-to-metric trace completeness; snapshot/checksum of reviewed copy; tests that failed/suppressed metrics cannot enter proposed available configuration.

**Manual/human gates:** qualified biomechanics reviewer, claims/product-safety reviewer, and evidence owner approve; legal/regulatory review is separately required if the intended use changes.

**Rollback behavior:** revert proposed copy/config; retain the signed review and keep the protocol research-only. Revised copy requires a new review version.

**Documentation updates:** signed claims review, metric board, protocol evidence record, traceability, limitations, decision/evidence logs, and availability packet.

**Explicit non-authorization:** claims approval does not authorize protocol availability, UI activation, medical framing, publication, deployment, or release.

### P4-M14 — Make a separate protocol availability decision

**Objective:** decide explicitly whether to keep unavailable, authorize a later guarded internal-only integration milestone, or reject the protocol based on the complete gate packet.

**User or research outcome:** availability is a deliberate owner decision with a precise supported scope and rollback trigger, never a side effect of schemas, tests, or favorable scientific results.

**Evidence addressed:** all G-ID through G-CLAIMS outcomes; current fail-closed registry/profile/runtime; device/accessibility gates; dataset rights; residual risks; availability doctrine in ADR-007.

**In scope:** audit every gate and deviation; verify source rights and intended use; define candidate availability scope (`remain unavailable`, `internal-evaluation only`, or a separately planned guarded product activation); list monitoring/revalidation/rollback triggers; record dissent and residual risk; if and only if approved, authorize creation of a new implementation roadmap/milestone.

**Out of scope:** changing registry status, adding input modes/runtime/profile/UI actions, deploying, releasing, publishing claims, or assuming physical accessibility/performance evidence is satisfied. Those are later implementation/release actions.

**Dependencies:** M13; all mandatory gates have dispositions; physical Windows/iPhone accessibility and target-device evidence are passed or explicitly treated as blockers for any product-facing option.

**Affected files:** new availability ADR/decision record; `KINEMATICIQ_MASTER_EXECUTION_ROADMAP.md`; context pack; next execution package; protocol handoff; metric board; risk/evidence/decision/traceability logs. No source/runtime file changes belong to this milestone.

**Acceptance criteria:** one signed decision states scope, evidence, failed/waived gates (hard scientific/privacy/claims gates cannot be waived), residual risks, expiry/revalidation date, rollback trigger, and next authorized action; default on missing signature/evidence is `remain unavailable`; any approved integration is a new milestone with its own tests/manual gates and keeps public release separate.

**Automated tests:** evidence-link and gate-completeness lint; current fail-closed registry tests rerun to prove this decision milestone itself changed no availability; repository diff check shows documentation/decision files only.

**Manual/human gates:** product/evidence owner signs G-AVAIL; privacy/legal, validation, biomechanics/claims, accessibility, and engineering owners countersign their domains. A public release requires a later explicit release/deploy authorization.

**Rollback behavior:** withdraw the decision record under a new superseding decision, retain audit history, and default to fail-closed/unavailable. No data or evidence is deleted.

**Documentation updates:** availability ADR, canonical roadmap/status/handoff, next execution package, gate registry, risks, evidence, and decision logs.

**Explicit non-authorization:** this milestone does not itself change availability or authorize implementation, merge, deployment, release, publication, data reuse, training, broader populations, or stronger claims.

## 5. Execution and reporting rules

1. At milestone start, record branch/commit, owners, dependencies, approved inputs, data access state, and the sole milestone marked `in progress`.
2. At milestone close, record commands and current-session outputs, actual changed files, acceptance evidence, human signatures, deviations, rollback readiness, and explicit remaining non-authorizations.
3. Every behavior/filter/model/threshold change requires before/after reports from identical versioned manifests and squat regression evidence.
4. Development failures may change the next version. Locked failures may not tune the frozen version; they create a new development cycle and remain in the evidence ledger.
5. Raw media, restricted datasets, participant identifiers, consent records, rater identities, access credentials, and re-link keys stay outside Git. Only approved schemas, synthetic examples, redacted aggregates, and hashes enter the repository.
6. No metric tier, copy strength, protocol status, capture input mode, profile, or runtime mapping changes merely because a milestone earlier than M13/M14 passes.
7. Engineering completion, scientific validation, claims approval, guarded integration, public release, and publication are separate verbs and require separate evidence and authority.

## 6. Phase 4 completion definition

Phase 4 evidence closure is complete only when P4-M00 through P4-M14 each has an immutable disposition and the final availability decision is recorded. A scientifically failed, inconclusive, or blocked protocol may still complete Phase 4 correctly if it remains unavailable and the negative evidence is preserved. “All tests passed” is never a substitute for the human, scientific, claims, privacy, accessibility, or owner gates above.
