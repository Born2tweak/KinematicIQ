# Phase 4 Lunge Research-to-Code Reconciliation

> **Repository-status reconciliation (2026-07-15):** The `8d8a77d` observations below were historically correct. `master` has now been fast-forwarded without conflict through the five pushed Phase 2/3 commits to the authoritative implementation frontier `f49558e`. That commit contains the unavailable experimental six-state seam in `web/src/protocols/inlineLunge/`; it does not provide participant validity, synchronized evidence, live/upload/session/results integration, coaching authority, or availability. Squat remains the only available protocol. Current naming and milestone authority comes from ADR-011 through ADR-015 and the canonical Phase 4 package index.
**Audit date:** 2026-07-14
**Audit type:** repository audit and implementation planning; no production changes
**Research basis:** six Phase 4 documents produced against `8d8a77d`
**Newer implementation frontier audited:** `f49558edec40ca6a972ec65bd6ff07898c161c4b` on `agent/phase2-runtime-and-validation`
**Pre-integration `master` / `origin/master` frontier:** `8d8a77d8ab0a6ab0c240f8327ef51e467dfd4cc2`
**P4-M00 authoritative implementation frontier:** `f49558edec40ca6a972ec65bd6ff07898c161c4b` on `master`

## Executive reconciliation

The reported Phase 3 implementation exists. At the original audit it was not on `master`: fetched local and remote `master` pointed to `8d8a77d`, while the work was five commits ahead on `agent/phase2-runtime-and-validation` at `f49558e`. P4-M00 verified that `master` had no unique commits and fast-forwarded it to `f49558e` without conflict. The research package was correct about its stated baseline, but its repeated present-tense claims that no lunge implementation exists are stale at the authoritative frontier.

The newer branch contains a deterministic, isolated research analyzer for a **forward lunge with stride and return**. It is not an FMS inline lunge and not a split squat. The code begins from bilateral standing, detects lead-foot displacement, pelvis lowering/reversal/rise, and requires the lead foot to return to its calibrated standing region. It does not implement the fixed heel-to-toe setup, dowel constraints, rear-knee contact, or FMS score of an FMS inline lunge. It also rejects a stationary split squat by construction because a step displacement is required, although there is no direct split-squat negative fixture.

The implementation has six named states, synthetic bilateral fixtures, explicit complete/rejected trials, an offline evaluation harness, six experimental metrics, bounded findings, and strong public-availability gates. These claims have source and direct test evidence in `web/src/protocols/inlineLunge/*`, `web/src/eval/inlineLungeEvaluation*`, registry/runtime tests, and the release-readiness E2E.

The implementation is materially narrower than the new research requirements. It lacks visible-plant and return-initiation events, protocol/view/side verification, timestamp validation, elapsed-time gap handling, recovery quarantine, identity/mirror checks, wrong-movement negatives, per-event landmark sufficiency, subject-held-out data, and real-device/biomechanical validation. Its active dropout policy is only “reject after more than three consecutive unreadable samples”; short gaps resume without reacquisition checks. All runtime segmentation thresholds are heuristic and lack empirical lunge evidence.

No lunge movement conclusion reaches the normal UI today. The landing page shows only an informational, non-actionable “Inline lunge” research card. Public profile/runtime lookup throws, capture modes are empty, and only squat is in the runtime map. The research analyzer is callable only by direct code import and the offline evaluator. Session/result/export compatibility is type-shaped or theoretical, not end-to-end lunge parity.

## Status vocabulary

| Status | Meaning in this audit |
|---|---|
| `implemented` | Behavior exists and has a direct source file plus a test that exercises the claim. |
| `partial` | Some code/test evidence exists, but the research contract or an end-to-end path is incomplete. |
| `missing` | No implementation was found at the audited frontier. |
| `contradicted` | Repository evidence conflicts with a document, label, or claimed behavior. |
| `blocked` | Completion depends on unavailable data, human authority, device work, expert review, or another external gate. |
| `unverified` | Code or documentation suggests behavior, but no direct test/current-session evidence proves it. |

## 1. Verified repository frontier and commit

### 1.1 Pre-integration ref state

| Ref | Commit | Finding |
|---|---:|---|
| `master` | `8d8a77d` | Pre-integration state: matched the research package baseline and contained no lunge implementation. P4-M00 fast-forwarded this ref to `f49558e`. |
| `origin/master` after `git fetch --prune origin` | `8d8a77d` | Remote default branch is not newer. |
| `agent/phase2-runtime-and-validation` | `f49558e` | Contains Phase 2 and Phase 3 work, including the lunge research analyzer. |
| `origin/agent/phase2-runtime-and-validation` | `f49558e` | Newer branch is published to its matching remote branch. |
| Merge base of `master` and audited branch | `8d8a77d` | Phase 2/3 branch is five commits ahead of current master. |

The canonical roadmap on the newer branch says the isolated deterministic implementation is complete through M115 and remains planned/non-actionable (`docs/implementation/KINEMATICIQ_MASTER_EXECUTION_ROADMAP.md`, lines 4081-4090). The branch-specific roadmap and handoff say the same (`docs/implementation/KINEMATICIQ_PHASE3_EXECUTION_ROADMAP.md`; `docs/implementation/KINEMATICIQ_PHASE3_HANDOFF.md`).

### 1.2 Working-tree state and audit boundary

The canonical newer checkout already contained untracked generated `web/coverage/` and `web/test-results/`; this audit did not alter or delete them. During final verification, an unrelated untracked `docs/implementation/PHASE_4_EVIDENCE_CLOSURE_ROADMAP.md` also appeared concurrently. This audit did not create, edit, or treat that untracked file as canonical; `AGENTS.md` identifies `KINEMATICIQ_MASTER_EXECUTION_ROADMAP.md` as the program roadmap. The six Phase 4 research documents existed as uncommitted files in the separate `8d8a77d` research checkout and are not part of `f49558e`. They were treated as research inputs, not as repository truth about the newer branch.

The Aurelian compatibility state is stale: `.aurelian/project-state.md` still reports a 2026-07-10 post-M60/master state and does not mention Phase 2/3 or `f49558e`. `.aurelian/decision-log.md` remains useful for benchmark-first, protocol-seam, and visualization decisions, but it is not current project status. Status: `contradicted` for current-state claims; source: `.aurelian/project-state.md`; corroborating frontier: `git rev-parse`/`git log` in this audit; no code test applies.

### 1.3 Current-session verification

| Check | Result |
|---|---|
| Focused lunge/runtime/governance Vitest set | 8 files, 45 tests passed |
| Full Vitest suite | 91 files, 580 tests passed |
| Chromium release-readiness lunge non-actionability E2E | 1 passed |
| Remote/ref verification | Fetch succeeded; `master` and `origin/master` both `8d8a77d`; audited branch and remote branch both `f49558e` |

These tests prove deterministic repository behavior only. They do not provide human validity, timed source data, subject-held-out accuracy, physical-device accessibility, biomechanics review, or activation approval.

## 2. Exact file/module inventory

### 2.1 Governing state, decisions, and Phase 3 records

| Path | Role | Audit disposition |
|---|---|---|
| `AGENTS.md` | Canonical loader, project boundaries, verification commands | Current and binding. |
| `.aurelian/project-state.md` | Aurelian state index | Stale at post-M60/master; `contradicted` as current state. |
| `.aurelian/decision-log.md` | Accepted project decisions | Applicable benchmark/protocol guardrails; lacks Phase 3 decisions. |
| `.aurelian/evidence-log.md` | Prior session evidence | Historical only; not substituted for current-session tests. |
| `.aurelian/resource-index.md` | Canonical resource pointers | Useful, but predates Phase 3. |
| `.aurelian/traceability.md` | Research-to-roadmap graph | Stops at M61-M74 and is stale for Phase 3. |
| `docs/implementation/KINEMATICIQ_MASTER_EXECUTION_ROADMAP.md` | Canonical program roadmap | Updated on newer branch with M99-M115 continuation. |
| `docs/implementation/KINEMATICIQ_PHASE3_EXECUTION_ROADMAP.md` | M99-M115 plan | Direct Phase 3 design record. |
| `docs/implementation/KINEMATICIQ_PHASE3_HANDOFF.md` | Phase 3 evidence and external gates | Direct implementation/handoff record. |
| `docs/implementation/progress/M99-M115-inline-lunge-research-runtime.md` | Progress record | Direct completion and verification summary. |
| `docs/implementation/RESEARCH_TO_CODE_TRACEABILITY.md` | Canonical research/code matrix | Updated with lunge rows, but some outcomes overstate integration; see Section 7. |
| `docs/validation/INLINE_LUNGE_LABELING_PROTOCOL.md` | Phase 3 labeling/gate protocol | Six-event, numeric predeclared engineering gates; superseded in detail by the Phase 4 package. |
| `docs/validation/PHASE3_INLINE_LUNGE_EXECUTION_PACKAGE.md` | Human/device/dataset execution forms | External work remains pending/blocked. |

### 2.2 Direct lunge production and test modules

| Production/source file | Exact responsibility | Direct test/evidence | Status |
|---|---|---|---|
| `web/src/protocols/inlineLunge/types.ts` | Side, six phase names, signal/trial/result types | `web/src/protocols/inlineLunge/inlineLunge.test.ts` serializes and inspects trials/results | `implemented` |
| `web/src/protocols/inlineLunge/signals.ts` | Median standing calibration, visibility gating, foot displacement, pelvis drop, projected lead-knee angle | `inlineLunge.test.ts` covers successful left/right analysis and calibration failure | `partial` |
| `web/src/protocols/inlineLunge/segmenter.ts` | Heuristic FSM, completion, active-dropout rejection, stream-end rejection | `inlineLunge.test.ts` covers ordered completion and four-unreadable rejection; no direct stream-end or gap/timestamp tests | `partial` |
| `web/src/protocols/inlineLunge/metrics.ts` | Six experimental metric definitions/results, nulls, confidence cap | `inlineLunge.test.ts` covers count, CV null/three-trial emission, and all-experimental serialization | `implemented` for synthetic assembly; scientific validity `blocked` |
| `web/src/protocols/inlineLunge/findings.ts` | Up to three observation findings for count, mean duration, duration CV | `inlineLunge.test.ts` covers three-trial finding count and full withholding after rejection | `partial` because copy uses disputed “inline lunge” identity and CV promotion conflicts with research |
| `web/src/protocols/inlineLunge/index.ts` | Planned protocol metadata and `analyzeInlineLungeResearch` assembly | `inlineLunge.test.ts` covers provenance refusal, analysis, abstention, serialization, and public fail-close | `implemented` as isolated research seam |
| `web/src/protocols/inlineLunge/fixtures.ts` | Deterministic left/right, multi-trial, and active unreadable-frame fixtures | `inlineLunge.test.ts`; `inlineLungeEvaluation.test.ts` | `partial`; adjacent movements and most failures are absent |
| `web/src/protocols/inlineLunge/inlineLunge.test.ts` | Seven direct protocol tests | Current session: passed | Test inventory |

### 2.3 Registry, runtime, evaluation, UI, and governance seams

| Path | Lunge relevance | Direct test | Status |
|---|---|---|---|
| `web/src/core/protocol.ts` | Adds `inlineLunge`, planned/available lifecycle, capture modes, evidence metadata | `web/src/core/protocol.test.ts` | `implemented` contract; activation authority check is `partial` |
| `web/src/protocols/registry.ts` | Registers lunge metadata/profile-null, keeps squat active | `web/src/protocols/registry.test.ts` | `implemented` |
| `web/src/protocols/runtime.ts` | Public runtime map contains squat only | `web/src/protocols/runtime.test.ts`; `inlineLunge.test.ts` | `implemented` fail-close |
| `web/src/protocols/completeness.ts` | Planned protocols must have no profile/input modes; available protocols need declarations/runtime | `web/src/protocols/completeness.test.ts`; `inlineLunge.test.ts` | `implemented`, but does not require all external gates or signed owner approval |
| `web/src/protocols/outcome.ts` | Neutral transition outcome schema | `web/src/protocols/outcome.test.ts`; lunge serialization in `inlineLunge.test.ts` | `partial` lunge compatibility |
| `web/src/eval/inlineLungeEvaluation.ts` | Offline per-sequence count, bottom error, false activation, dropout, rejection report | `web/src/eval/inlineLungeEvaluation.test.ts` | `implemented` for synthetic cases |
| `web/scripts/runInlineLungeEvaluation.ts` | Runs three checked-in synthetic cases and writes M109 JSON | `inlineLungeEvaluation.test.ts`; checked-in `web/eval/benchmark-results/m109-inline-lunge-synthetic-evaluation-v1.json` | `partial`; no approved timed corpus |
| `web/src/eval/datasets/llmFmsOntology.ts` | Ontology-only m05/m06 bridge, excludes FMS scores | `web/src/eval/datasets/llmFmsOntology.test.ts` | `implemented` ontology boundary |
| `web/src/governance/traceability.ts` | Marks lunge thresholds heuristic and copy observational | `web/src/governance/traceability.test.ts` | `implemented` trace coverage; threshold evidence remains missing |
| `web/src/components/protocolPickerModel.ts` | Splits available vs research protocols | `web/src/components/protocolPickerModel.test.ts` | `implemented` |
| `web/src/components/ProtocolPicker.tsx` | Renders research protocols as non-interactive articles | `web/tests/e2e/release-readiness.spec.ts` | `implemented` |
| `web/src/screens/CameraScreen.tsx` | Requires a public `ProtocolRuntime` and live cyclic runtime | Runtime fail-close tests; no lunge camera test because lunge cannot enter | Lunge path `missing` by design |
| `web/src/screens/UploadScreen.tsx` | Runs squat-shaped video analysis then selected public runtime result assembly | `runtime.test.ts` proves no lunge runtime; no lunge upload test | Lunge path `missing` |
| `web/src/session/buildSessionResult.ts` | Generic protocol ID, but non-squat keyed metrics are forced empty and legacy summary is squat-shaped | Existing session tests are squat-only; lunge test only JSON-serializes its separate result type | Lunge integration `missing` |
| `web/src/session/sessionArtifact.ts` | Protocol ID envelope; legacy keyed metric adapter is squat-only | `web/src/session/sessionArtifact.test.ts` is squat-only | Lunge integration `unverified` |
| `web/src/storage/sessionStore.ts` | Stores a generic `SessionResult` and protocol ID | `web/src/storage/sessionStore.test.ts` is squat-only | Lunge integration `unverified` |
| `web/src/screens/ResultsScreen.tsx` and `web/src/components/report/resultsNarrative.ts` | Render `SessionResult` and repetition language | Existing tests use squat-shaped results; no lunge result test | Lunge integration `missing` |
| `web/src/export/sessionReport.ts`, `metricCsv.ts` | Generic keyed export envelopes | Export tests are squat-only | Lunge integration `unverified` |

### 2.4 Phase 4 research inputs reconciled

- `INLINE_LUNGE_EVIDENCE_UPDATE.md`
- `SINGLE_CAMERA_LUNGE_OBSERVABILITY_REVIEW.md`
- `TEMPORAL_TRACKING_FAILURE_AND_RECOVERY_REVIEW.md`
- `INLINE_LUNGE_FIELD_VALIDATION_PROTOCOL.md`
- `INLINE_LUNGE_DATASET_AND_CAPTURE_SPEC.md`
- `INLINE_LUNGE_EVENT_LABELING_HANDBOOK.md`

All six correctly identify the target task as a proposed forward lunge with stride and return, insist on fail-closed evidence behavior, and prohibit clinical/kinetic/normative claims. Their “no implementation exists” statements are basis-correct for `8d8a77d` but stale against `f49558e`.

## 3. Implemented movement identity

### Finding

The implementation is a **forward lunge with stride and return**, mislabeled in code/UI metadata as “Inline lunge.” Status: `contradicted` identity label, `implemented` movement skeleton.

Evidence and test:

- Starts from calibrated bilateral standing; `signals.ts` calibrates a lead-foot x anchor and pelvis y baseline. Successful analysis and calibration failure are tested in `inlineLunge.test.ts`.
- Requires declared lead-foot displacement of at least `0.06` to start; stationary split-stance motion cannot start a trial. Ordered left/right completion is tested in `inlineLunge.test.ts`.
- Requires pelvis descent and ascent plus stable foot return to the calibrated region. Completion is tested for both lead sides in `inlineLunge.test.ts`.
- Does not encode FMS heel-to-toe spacing, tibia-length setup, dowel position, rear-knee floor contact, or FMS score. No test claims any of those.

### Classification against candidate identities

| Identity | Repository fit | Status | Evidence/test |
|---|---|---|---|
| FMS inline lunge | Does not fit fixed split stance, dowel, or rear-knee contact. | `contradicted` | `index.ts`, `segmenter.ts`; left/right step-return test in `inlineLunge.test.ts` |
| Forward lunge | Broadly fits, but implementation specifically requires return to start. | `partial` label | Same source/test |
| Split squat | Does not fit because a step displacement is mandatory. | `contradicted` | `segmenter.ts`; positive step-return test, but no direct split-squat negative test |
| Forward lunge with stride and return | Exact behavioral fit. | `implemented` on synthetic fixtures | `signals.ts`, `segmenter.ts`, `fixtures.ts`; ordered left/right test in `inlineLunge.test.ts` |

The Phase 4 name/identity conclusion should therefore be accepted. A human owner decision is still `blocked`, but the existing code already embodies one side of that decision and should not continue under the FMS-confusable product label without an explicit disposition.

## 4. Phase/event model found in code

### 4.1 Declared model

`types.ts` and `index.ts` declare six ordered phase names:

`standing -> stepping -> descending -> bottom -> ascending -> returning`

The direct left/right test verifies six stored event frame indices are unique and ordered (`inlineLunge.test.ts`). Status: `implemented` for the synthetic fixture ordering.

### 4.2 Actual transition semantics

| Stored state/event | Actual code observation | Research alignment | Status | Source/test |
|---|---|---|---|---|
| Standing anchor | Last readable sample with lead foot inside return region; no standing dwell or knee/velocity stability | Only a weak subset of required stable bilateral setup | `partial` | `segmenter.ts`; indirect ordered-event test in `inlineLunge.test.ts` |
| Step initiation | First readable sample with absolute lead-foot x displacement `>= 0.06` | Matches sustained foot departure concept only partially; persistence is not required to open the trial | `partial` | `segmenter.ts`; synthetic completion test |
| Visible plant | No distinct event or foot-stability window | Required by Phase 4 labeling/event ontology | `missing` | No source/test |
| Descent start | Sample at which pelvis drop has met `>= 0.025` for two samples; stored frame is the later confirmation sample | Does not record the first frame of the sustained interval | `partial` | `segmenter.ts`; only order tested |
| Bottom | Greatest pelvis drop seen while descending, accepted after two samples of decreasing drop and only if peak drop `>= 0.06` | Research defines bottom primarily by maximum lead-knee flexion with plateau/tie/ambiguity rules | `contradicted` construct | `segmenter.ts`; no bottom-label accuracy test |
| Ascent start | Sample at which rise from stored bottom is `>= 0.015` for two samples | Later confirmation, not first sustained reversal | `partial` | `segmenter.ts`; only order tested |
| Return initiation | No distinct event | Required by Phase 4 handbook | `missing` | No source/test |
| Returning | Entered after pelvis drop is `<= 0.025` for two samples | A torso/pelvis recovery state, not foot return initiation | `partial` | `segmenter.ts`; only order tested |
| Stable return/completion | Three readable samples with foot displacement `<= 0.035` and pelvis drop `<= 0.025` | Captures lead-foot/pelvis return but not both-foot anchors, knees, velocity, mirror/side, or timestamp validity | `partial` | `segmenter.ts`; completed left/right test |
| Rejection | More than three consecutive unreadable active samples, or active trial at stream end | Only two reasons; research taxonomy is much larger | `partial` | Dropout rejection directly tested; stream-end path lacks a direct test |

The code is therefore a six-state FSM, but not the Phase 4 handbook's richer eight-event label model. “Six-event complete trial” in `RESEARCH_TO_CODE_TRACEABILITY.md` is defensible only for the Phase 3 event contract, not for the updated Phase 4 contract.

## 5. Metric and claims inventory

### 5.1 Emitted research metrics

| Metric ID | Calculation | Code tier | UI reach today | Audit status | Source/test |
|---|---|---|---|---|---|
| `inlineLunge.trial.count` | Number of completed trials | `experimental` | None; offline/direct research only | `implemented` synthetically | `metrics.ts`; count assertion in `inlineLunge.test.ts`, exact-count evaluator test |
| `inlineLunge.tempo.trial-duration` | Mean step timestamp to stable-return timestamp | `experimental` | None | `partial`; timestamps are not validated | `metrics.ts`; finding presence via three-trial test, no gap/reversal test |
| `inlineLunge.tempo.descent` | Mean stored descent to stored bottom | `experimental` | None | `partial`; event constructs differ from handbook | `metrics.ts`; no direct arithmetic/event-label test |
| `inlineLunge.tempo.ascent` | Mean stored ascent to stable return | `experimental` | None | `partial` | `metrics.ts`; no direct arithmetic/event-label test |
| `inlineLunge.knee.bottom-angle` | Mean 2D lead hip-knee-ankle included angle at pelvis-defined bottom | `experimental` | None | `contradicted` tier; Phase 4 research says analyst-only pending synchronized validation | `signals.ts`, `metrics.ts`; no reference-validity test |
| `inlineLunge.tempo.duration-cv` | Population CV of durations, emitted with at least three complete trials | `experimental` | None | `contradicted` tier/claim readiness; Phase 4 says analyst-only until repeatability evidence | `metrics.ts`; one-vs-three test in `inlineLunge.test.ts` |

All result values carry provenance, confidence, a validation tier, and `research-only` or `insufficient-research-evidence` quality flags. This assembly is directly exercised in `inlineLunge.test.ts`. The confidence number is heuristic and capped at `0.74`; it is not a calibrated probability.

### 5.2 Findings and claim reach

`findings.ts` can produce at most three observations: complete trial count, average trial duration, and within-set duration CV. `inlineLunge.test.ts` verifies three findings after three synthetic trials and verifies zero findings after an unreadable-trial rejection. Status: `implemented` as research output; `partial` against Phase 4 claims policy because:

- completion copy says “inline-lunge” although the implemented task is step-to-return forward lunge;
- average duration is based on unvalidated event boundaries and unchecked timestamps;
- CV is surfaced despite absent repeat-session reliability;
- there is no questionable/invalid set-quality state—only findings present or absent based on completed count.

No knee-angle finding, FMS score, correctness grade, diagnosis, injury risk, kinetics, frontal valgus, balance, mobility, rear-knee contact, or composite score exists. Source: `metrics.ts`, `findings.ts`, `index.ts`; guard tests: `governance/traceability.test.ts`, `inlineLunge.test.ts`, and `eval/datasets/llmFmsOntology.test.ts`. Status: `implemented` prohibition boundary.

### 5.3 What can reach users

Only metadata reaches the normal UI: the name “Inline lunge” and “Research only — validation pending.” The card has no button/link and clicking it does not navigate. Source: `ProtocolPicker.tsx`; tests: `protocolPickerModel.test.ts` and `tests/e2e/release-readiness.spec.ts` (current Chromium run passed). Movement metrics/findings cannot reach Camera, Upload, Results, History, session storage, or export through normal routes because no public lunge runtime exists. Source: `runtime.ts`; tests: `runtime.test.ts` and `inlineLunge.test.ts`.

## 6. Research-to-code traceability matrix

| Phase 4 research requirement | Status | Reconciliation | Source and test evidence |
|---|---|---|---|
| Resolve task as forward lunge with stride and return | `contradicted` | Code behavior matches, but ID/label remain `inlineLunge` / “Inline lunge”; owner decision absent. | `inlineLunge/index.ts`, `segmenter.ts`; left/right step-return test |
| One protocol with declared left/right lead | `implemented` | One ID plus required `leadSide` analysis option. | `types.ts`, `index.ts`; parameterized left/right test |
| Validate declared side against observed side | `missing` | Side selects landmark indices; no trajectory conflict check. | `signals.ts`; no mismatch test |
| Preserve raw/display mirror metadata | `missing` | Provenance only checks a protocol string; no mirror contract. | `index.ts`; provenance-mismatch test does not cover mirror |
| Near-sagittal side view | `partial` | Metadata and exact provenance string require side-view protocol; geometry is never measured. | `index.ts`; provenance refusal test |
| Fixed camera/full body/both feet/travel corridor | `partial` | UI metadata says full body/both feet; analyzer does not check camera motion, framing margins, heels, or travel corridor. | `index.ts`; picker metadata test only |
| Standing calibration | `partial` | Median lead-foot x and pelvis y over first 15 frames; requires 80% visible, but no stance stability/dwell/velocity. | `signals.ts`; calibration-failure test |
| Step initiation | `partial` | Lead foot displacement starts trial, without persistent departure. | `segmenter.ts`; completion test |
| Visible plant | `missing` | No event/state. | No source/test |
| Descent onset | `partial` | Pelvis drop and two-frame persistence, but stored at confirmation frame. | `segmenter.ts`; order-only test |
| Bottom by maximum lead-knee flexion with plateau rule | `contradicted` | Bottom is maximum pelvis drop; no plateau/ambiguity representation. | `segmenter.ts`; no direct label-accuracy test |
| Ascent onset | `partial` | Rise-from-bottom threshold and persistence; stored late. | `segmenter.ts`; order-only test |
| Return initiation | `missing` | No event/state. | No source/test |
| Stable bilateral return | `partial` | Lead foot plus pelvis thresholds; no rear-foot/knee/low-velocity checks. | `segmenter.ts`; completion test |
| Completed/rejected neutral outcome | `implemented` | Transition outcomes serialize as completed/rejected. | `index.ts`; completion, rejection, and serialization tests |
| Shallow complete stays descriptive | `contradicted` | `bottomPelvisDrop >= 0.06` is mandatory; shallow target motions below it end rejected/incomplete, not `shallow_complete`. | `segmenter.ts`; no shallow fixture/test |
| Aborted/incomplete-return/false-start categories | `partial` | Stream-end can reject as incomplete; no category taxonomy or direct test. | `segmenter.ts`; no category-specific tests |
| Wrong-movement negatives | `missing` | No squat/split/FMS/reverse/lateral/walking/side-switch fixtures or classifier. | `fixtures.ts`, evaluator script; tests cover only valid and unreadable negative |
| Per-event landmark sufficiency | `missing` | One global readable mask for lead leg/foot plus both hips. | `signals.ts`; no per-event occlusion tests |
| Reason-coded metric-specific nulls | `partial` | Null metrics use one generic quality flag; one trial failure with another completed trial does not suppress all aggregates. | `metrics.ts`; CV-null test only |
| Invalid set fully abstains; questionable set does not coach | `partial` | Zero completed trials withholds findings and gives a text reason, but there is no lunge set-quality verdict or questionable state. | `index.ts`; unreadable rejection/abstention test |
| Experimental count and timing | `implemented` synthetically | Definitions/results/evaluator exist. | `metrics.ts`, `inlineLungeEvaluation.ts`; direct tests |
| Projected knee angle analyst-only | `contradicted` | Code declares it `experimental`, not analyst-only, and has no reference gate. | `metrics.ts`; experimental-tier serialization test reveals current tier |
| Timing variability only after reliability | `contradicted` | CV emits after three trials without repeat-session evidence. | `metrics.ts`; three-trial emission test |
| Original timed data/checksums | `blocked` | UI-PRMD timed source unavailable; LLM-FMS is ontology-only. | `PHASE3_INLINE_LUNGE_EXECUTION_PACKAGE.md`; ontology tests only |
| Independent A/B labels and adjudication | `blocked` | Protocol/forms exist; no completed labels. | Validation docs; no scientific test |
| Subject-held-out evaluation | `blocked` | Evaluator exists, but checked-in cases are synthetic only. | `runInlineLungeEvaluation.ts`, M109 JSON; evaluator test |
| Temporal fault state machine/recovery quarantine | `missing` | Phase 2 landmark taxonomy exists separately and is not imported by lunge. | `cv/landmarkState.ts`; its tests prove only isolated classification |
| Live/upload/replay parity | `missing` | No public lunge runtime or input modes; evaluator is offline only. | `runtime.ts`; fail-close tests |
| Session/result/report/export parity | `partial` | Research result JSON serializes; it is not a `SessionResult` and no lunge UI/storage/export test exists. | `inlineLunge.test.ts` serialization; session/export tests are squat-only |
| Public non-actionability | `implemented` | Planned, empty input modes, null profile, no runtime, informational card. | `index.ts`, `registry.ts`, `runtime.ts`, `ProtocolPicker.tsx`; unit and E2E tests |
| Human/device/expert/owner activation | `blocked` | Blank forms and explicit blocked gates only. | Phase 3 handoff/execution package; no autonomous test can pass these |

## 7. Contradictions and stale statements

### 7.1 Research package statements now stale against `f49558e`

The following statements appear repeatedly in the six-document package and are `contradicted` when read as claims about the newer branch:

- no `inlineLunge` protocol ID or registry entry exists;
- no lunge runtime/analysis seam exists;
- no phase FSM, metrics, findings, fixtures, tests, or evaluation harness exists;
- six phases are annotation candidates only;
- no research-selection UI metadata exists.

They remain historically correct for `master` at `8d8a77d`. The reconciliation should preserve the basis date/commit rather than retroactively calling the original audit negligent.

### 7.2 Phase 3 statements overstated against code

| Statement | Audit finding | Status |
|---|---|---|
| “Calibrated side-view signal model” | Calibrated image-space signals exist, but side-view compliance is provenance text only. | `partial` |
| “Six-event segmentation” | Six stored event frames exist, but visible plant and return initiation are missing and Phase 4 bottom semantics differ. | `partial` |
| “Full abstention research assembly” | Findings abstain at zero complete trials; metrics still include a zero count and no lunge set-quality verdict exists. | `partial` |
| “Result/replay compatibility” | JSON serialization is tested; no replay, `SessionResult`, result UI, storage, history, report, or export lunge path is tested. | `contradicted` as end-to-end parity |
| “Protocol required landmarks” | Registry declares bilateral knees/ankles/feet, but signal readability uses only declared lead chain/foot plus both hips. | `contradicted` contract/implementation alignment |
| “Threshold ledger” | Trace rows correctly say heuristic, but they create per-metric threshold rows rather than tracing each FSM constant and its effect. | `partial` |

### 7.3 Research/code contradictions requiring a decision

1. **Name:** `inlineLunge` versus `forward lunge with stride and return`.
2. **Bottom:** maximum pelvis drop in code versus maximum lead-knee flexion/plateau in Phase 4 labels.
3. **Event ontology:** six Phase 3 frames versus visible plant and return initiation in Phase 4.
4. **Shallow trials:** mandatory pelvis-depth threshold versus descriptive `shallow_complete` category.
5. **Knee angle tier:** code `experimental` versus Phase 4 `analyst-only`.
6. **Duration CV tier:** code `experimental` finding versus Phase 4 reliability-gated analyst output.
7. **Landmark contract:** declared bilateral lower-body landmarks versus actual lead-chain-plus-both-hips readability.

## 8. Threshold provenance audit

No lunge runtime threshold has empirical KinematicIQ lunge evidence. `governance/traceability.ts` correctly labels the basis `heuristic`, and `governance/traceability.test.ts` verifies that designation. Synthetic determinism is not threshold validity.

| Threshold/policy | Value | Purpose | Provenance finding | Status |
|---|---:|---|---|---|
| `VISIBILITY_MIN` | `0.5` | Global landmark readability | No lunge visibility/error calibration; model visibility is not coordinate accuracy. | `unverified` |
| Default calibration window | `15` frames | Standing median | Frame-count based; no FPS/duration basis. | `unverified` |
| Minimum calibration option | `5` frames | Input guard | Engineering guard only. | `unverified` |
| Calibration usable fraction | `80%` | Permit median calibration | No stability, task, body, or device evidence. | `unverified` |
| Step displacement | `0.06` normalized x | Open trial | Camera distance/perspective sensitive; no body-scale normalization or data basis. | `unverified` |
| Descent pelvis drop | `0.025` normalized y | Enter descending | No empirical event agreement basis. | `unverified` |
| Bottom pelvis drop | `0.06` normalized y | Permit bottom | Conflicts with descriptive shallow-trial research policy. | `contradicted` |
| Ascent rise from bottom | `0.015` normalized y | Enter ascending | No event-label basis. | `unverified` |
| Return pelvis drop | `0.025` normalized y | Return state/completion | No standing-dwell validation. | `unverified` |
| Return foot displacement | `0.035` normalized x | Standing/return region | No camera/body-scale evidence. | `unverified` |
| Phase persistence | `2` frames | Transition confirmation | Frame-count based; changes duration with FPS. | `unverified` |
| Stable-return persistence | `3` frames | Complete trial | Frame-count based; does not match elapsed-time handbook contract. | `unverified` |
| Max unreadable run | `3` frames | Reject on fourth unreadable sample | Frame-count based; no phase/elapsed-time/reacquisition evidence. | `unverified` |
| CV minimum sample | `3` complete trials | Emit duration CV | Arithmetic minimum, not repeatability evidence. | `partial` |
| Confidence cap | `0.74` | Cap heuristic confidence | No calibration curve or lunge validity prior. | `unverified` |
| Finding cap | `3` | Bound research observations | Product-policy bound, not a biomechanical threshold. | `implemented` policy; `inlineLunge.test.ts` covers three findings |

The numeric gates in `docs/validation/INLINE_LUNGE_LABELING_PROTOCOL.md` (for example 95% count agreement, kappa 0.80, and held-out count/event/dropout gates) are predeclared governance targets, not demonstrated evidence. The Phase 4 validation protocol intentionally replaces fixed inherited targets with a signed `G_*` registry chosen before locked evaluation. Until that registry and data exist, those Phase 3 numbers are `unverified`, not passes.

## 9. Temporal-failure coverage audit

### 9.1 Actual lunge behavior

| Failure mode | Actual behavior | Status | Source/test |
|---|---|---|---|
| Low visibility in calibration | Throws calibration error if fewer than 80% of requested frames are usable. | `implemented` | `signals.ts`; calibration-failure test |
| Low visibility during active trial, 1-3 consecutive samples | Resets phase persistence and then resumes the same active trial on the next readable sample; no quarantine/reseed. | `unverified` | `segmenter.ts`; no direct short-gap test |
| Low visibility during active trial, 4+ consecutive samples | Rejects `critical-landmarks-unreadable`, clears standing anchor, and findings abstain if no completed trial. | `implemented` | `segmenter.ts`, `index.ts`; direct rejection test and evaluator test |
| Missing/unreadable samples before a trial | Ignored except readable samples may refresh standing anchor. | `unverified` | `segmenter.ts`; no direct test |
| Stream ends during active trial | Rejects `incomplete-trial-at-stream-end`. | `unverified` | `segmenter.ts`; no direct test |
| Timestamp equality/reversal | No validation; samples can advance FSM and produce zero/negative durations. | `missing` | `segmenter.ts`, `metrics.ts`; no test |
| Large timestamp gap | No gap classification; event FSM is frame-count based and durations include the gap. | `missing` | Same; no test |
| Dropped callbacks/absent frames | Not represented unless caller inserts an unreadable `PoseFrame`; array gaps alone are invisible. | `missing` | `types.ts`, `segmenter.ts`; no test |
| Reacquisition | No identity/geometry quarantine or filter reset contract. | `missing` | No lunge import of `cv/landmarkState.ts`; no test |
| Partial occlusion | Treated only through a single visibility threshold on the global required subset. | `partial` | `signals.ts`; calibration/dropout tests only |
| Plausible-but-wrong inferred landmarks | Not detected. | `missing` | No continuity/bone/swap logic or tests |
| Lead/rear identity swap | Not detected; declared side chooses indices. | `missing` | `signals.ts`; no test |
| Mirror mismatch | Not detected. | `missing` | No mirror field/check/test |
| Out-of-frame coordinate with high visibility | Coordinates are accepted by lunge signals; shared `landmarkState.ts` can classify this but is not consumed. | `missing` integration | `signals.ts`, `landmarkState.ts`; only isolated landmark-state tests |
| Camera movement/orientation epoch | Not detected. | `missing` | No source/test |
| Low/variable FPS | No gate; persistence duration changes with sample rate. | `missing` | `segmenter.ts`; no test |
| Wrong but well-tracked movement | Can satisfy heuristics; only one synthetic unreadable “negative” is evaluated. | `missing` | `fixtures.ts`, evaluator script/test |

### 9.2 Relationship to Phase 2 tracking work

`web/src/cv/landmarkState.ts` implements a useful observation vocabulary (`observed`, `low-confidence`, `short-gap`, `recovered`, `missing`, `out-of-frame`, `ambiguous-side`, `rejected`) and direct tests pass in `landmarkState.test.ts`. `web/src/eval/shortGapRecoveryExperiment.ts` contains an offline one/two-sample interpolation experiment with tests. However, repository searches show neither is imported by the lunge analyzer. M86 and M87 progress notes explicitly say the contracts are not consumed/enabled in live analysis. Therefore lunge recovery coverage is `missing`, not inherited from Phase 2.

### 9.3 Research requirement disposition

The temporal review's upstream fail-closed state machine, explicit missingness, elapsed-time policy, filter reset, recovery quarantine, identity checks, and event-critical gap rejection remain `missing`. Its recommendation that interpolation never create events/extrema is not violated by lunge code because lunge does not interpolate, but short unreadable runs may bridge a trial without marking the event interval unavailable. That is `partial` fail-close behavior.

## 10. Live/upload/replay parity audit

| Path | Current lunge behavior | Consistency finding | Status | Source/test |
|---|---|---|---|---|
| Live camera | No lunge input mode/runtime; `CameraScreen` requires `ProtocolRuntime.liveCyclic`; public lookup throws first. | Fail-closed, but no lunge parity. | `missing` execution / `implemented` safety | `CameraScreen.tsx`, `runtime.ts`; runtime and E2E tests |
| Upload | No lunge runtime; upload analysis is squat-shaped before result assembly. | Fail-closed, no lunge analysis parity. | `missing` | `UploadScreen.tsx`, `runtime.ts`; runtime tests |
| Replay | No lunge replay adapter or pose-tape path. | Offline evaluator is not replay parity. | `missing` | No lunge replay source/test |
| Offline research evaluation | Directly calls `analyzeInlineLungeResearch` on in-memory `PoseFrame[]`. | Deterministic synthetic path exists. | `implemented` synthetic | evaluator source/test |
| Session result | `InlineLungeAnalysisResult` is separate from `SessionResult`; generic session builder suppresses non-squat metrics. | Phase 3 “session compatibility” is not end-to-end. | `missing` | `types.ts`, `session/buildSessionResult.ts`; no lunge session test |
| Result UI | Expects squat-shaped `SessionResult`, repetition language, set quality, scoring fields. | Cannot directly consume research result. | `missing` | `ResultsScreen.tsx`, `resultsNarrative.ts`; no lunge test |
| Storage/history | Generic protocol ID exists, but tests/results are squat-only and history copy uses protocol ID strings. | Schema envelope may be additive; behavior unproved. | `unverified` | storage source/tests |
| JSON/HTML report | Generic metric/finding envelope exists, but no lunge session/report construction. | Theoretical compatibility only. | `unverified` | export source/tests |
| CSV | Can serialize keyed metric results, but no lunge export test/path. | Theoretical compatibility only. | `unverified` | `metricCsv.ts` and squat-only test |

The paths are consistent only in one sense: all public capture paths fail closed because lunge has no runtime. They are not behaviorally equivalent for lunge analysis.

## 11. Availability and safety audit

### 11.1 Current availability

Current public availability is safely `implemented` as off:

- definition status is `planned`;
- research state is `research-only`;
- capture input modes are `[]`;
- profile is `null`;
- `getProtocolProfile('inlineLunge')` throws;
- `getProtocolRuntime('inlineLunge')` throws;
- active protocol is hard-coded squat;
- picker renders lunge as a non-interactive article;
- Chromium E2E verifies it has no link/button and clicking does not navigate.

Sources: `inlineLunge/index.ts`, `registry.ts`, `runtime.ts`, `ProtocolPicker.tsx`. Tests: `inlineLunge.test.ts`, `registry.test.ts`, `runtime.test.ts`, `completeness.test.ts`, `protocolPickerModel.test.ts`, and `tests/e2e/release-readiness.spec.ts`.

### 11.2 Can lunge accidentally become public?

**With the current committed state and normal UI routes: no.** A user cannot select or run it, and route-state injection would encounter the missing runtime rather than execute research analysis.

**As a governance invariant against future code edits: only partially protected.** `validateProtocolDefinition` does not require every validation gate to be passed, does not represent signed owner activation, and does not reject an `available` protocol merely because some gates are `blocked`/`pending`. `lintProtocolCompleteness` requires at least one passed gate; lunge already has a passed synthetic-runtime gate. A future multi-field edit could therefore satisfy structural checks without proving the external gates unless activation authority is encoded and tested. Status: `partial`; sources: `core/protocol.ts`, `protocols/completeness.ts`; tests currently cover missing declarations/runtime, not all-gates-passed or signed authorization.

Additional safety findings:

- The exact research analyzer is exported and callable by internal code. This is intentional and not user access, but it is not capability-isolated beyond module boundaries.
- No URL query parameter, feature flag, or persisted protocol selection exposes lunge today.
- The disputed “Inline lunge” label is already public metadata. This can mislead users about the movement even though analysis is unavailable.
- Experimental knee-angle and CV definitions are dormant from UI, which contains the present scientific risk.

## 12. Ranked implementation gaps

The ranking below is planning guidance only. It does not authorize implementation, threshold changes, protocol activation, data acquisition, or roadmap edits.

| Rank | Gap | Why it outranks later work | Status |
|---:|---|---|---|
| 1 | Resolve and record movement identity/name | Every event, label, negative class, study, UI string, and claims boundary depends on whether this is forward stride-return or FMS inline lunge. Existing behavior already chooses stride-return while naming the other task. | `blocked` on owner decision |
| 2 | Reconcile Phase 3 six-event contract with Phase 4 handbook | Visible plant, return initiation, bottom definition, shallow semantics, and ambiguity rules change ground truth and algorithm acceptance. Validation cannot proceed against two ontologies. | `blocked` on identity/biomechanics decision |
| 3 | Replace frame-count/normalized-image heuristics with an explicitly versioned development hypothesis set | Current thresholds are view/FPS/body-scale sensitive and scientifically unsupported. Freeze names and experiment questions before tuning; do not silently change values. | `missing` evidence |
| 4 | Build complete negative/adversarial synthetic fixtures | Wrong-movement false activation is the largest immediate deterministic safety gap: split squat, FMS inline, squat, walking/reverse/lateral, step-only, side switch, incomplete/aborted/shallow, mirror, view, and timestamp cases. | `missing` |
| 5 | Add explicit temporal-quality inputs and fail-closed behavior | Timestamp reversal/gaps, absent frames, reacquisition, phase-boundary gaps, and side swaps can currently alter counts/timing silently. Integrate the Phase 2 observation vocabulary without enabling interpolation. | `missing` |
| 6 | Align declared and consumed landmark contracts | Required bilateral knees/ankles/feet are not actually checked; heels/shoulders/view continuity required by research are absent. Define per-event dependency masks and reason-coded nulls. | `contradicted`/`missing` |
| 7 | Correct dormant metric tiers/claim copy | Knee angle and duration CV are too strong for current evidence, and “inline lunge” wording is misleading. Keep them internal/analyst-only until their gates pass. | `contradicted` |
| 8 | Implement manifest/label/adjudication tooling and obtain approved timed data | Synthetic exact counts cannot validate event accuracy or thresholds. Data access, consent/license, independent raters, and subject splits are external prerequisites. | `blocked` |
| 9 | Run subject-held-out event/count/abstention evaluation | Required before any claim of robustness or accuracy. Include attempted-case denominators and false activation by negative class. | `blocked` |
| 10 | Prove offline/replay parity before live/upload | Research analyzer currently has only in-memory offline cases. Preserve timestamps, missingness, provenance, and identical outputs before adding live timing complexity. | `missing` |
| 11 | Design lunge-native session/result/report contracts | Current product result model is squat/repetition-shaped; JSON serialization alone is insufficient. | `missing` |
| 12 | Encode activation authority as a hard invariant | Availability validation should require the applicable evidence gates and an explicit human approval record, not merely structurally complete metadata. | `partial` safety |
| 13 | Physical device/accessibility, expert claims review, and activation decision | These cannot be passed autonomously and remain final external gates. | `blocked` |

## 13. Recommended Phase 4 milestone sequence

This sequence preserves the current non-availability invariant and separates reversible engineering from scientific/human authority.

### P4.0 — Frontier and identity decision

- Record that `master` is `8d8a77d` and Phase 3 is on `f49558e`; decide merge/rebase separately from this audit.
- Designated owner chooses `forward lunge with stride and return` or actual FMS inline lunge.
- If stride-return is selected, rename protocol/research/UI terminology in a later authorized implementation; preserve dataset aliases as provenance only.
- Verification: decision record, consistent terminology search, no runtime/availability change.

### P4.1 — Event and claim contract freeze

- Reconcile six-state runtime with the Phase 4 handbook's visible plant, return initiation, knee-flexion bottom, plateau, shallow, aborted, incomplete, and ambiguity semantics.
- Freeze metric tiers: count/timing experimental; projected knee angle and timing variability analyst-only until their specific gates pass.
- Verification: versioned schema/ontology review by engineering, biomechanics, and claims owners; no threshold tuning.

### P4.2 — Deterministic failure/negative fixture expansion

- Add all target, partial, wrong-movement, view, side/mirror, crop/occlusion, timestamp, gap, and reacquisition synthetic cases.
- Require no false completion on named negative classes and no event creation through invalid time/missingness.
- Verification: targeted unit/evaluator tests plus unchanged squat/full suite; synthetic status explicitly retained.

### P4.3 — Temporal-quality and per-event observability integration

- Feed explicit timestamp/missingness/landmark states into lunge segmentation.
- Freeze on suspect/missing intervals; reject event-critical gaps; quarantine reacquisition; do not interpolate events/extrema.
- Make landmark eligibility event/metric specific and reason coded.
- Verification: timestamp reversal/gap/FPS/occlusion/swap/camera-epoch tests, clean synthetic parity, full squat regression. Do not change public availability.

### P4.4 — Data, manifest, and labeling readiness

- Implement validators, checksum/split scanning, immutable A/B/adjudication artifacts, and approved local-only loaders.
- Obtain identity, privacy, consent/license, custodian, retention, rater, and study approvals before acquiring participant/restricted bytes.
- Verification: schema/checksum/leakage tests and signed blank-to-active gate transitions; no scientific pass from synthetic data.

### P4.5 — Development pilot and threshold experiment

- Collect/use approved development-only data; run rater pilot, view/device/gap/negative experiments, and sample-size planning.
- Select provisional threshold hypotheses and matching windows from development only; freeze before lock.
- Verification: immutable development report, agreement report, versioned threshold ledger with sensitivity/failure strata.

### P4.6 — Locked subject-held-out validation

- Run frozen code against untouched subjects and adjudicated labels.
- Report exact count, event errors, completion/false completion, abstention, false activation, dropout, missingness, and strata with subject-clustered uncertainty.
- Verification: all input/code/gate hashes match; any failed primary gate keeps research-only without tuning on the locked set.

### P4.7 — Offline/replay integration and parity

- Only after count/event gates justify continuation, add pose-tape/replay integration using raw timestamps and missingness.
- Verification: identical offline/replay outputs for the same frames/events, backward-compatible tape readers, negative/failure corpus, full squat parity.

### P4.8 — Session/result/report research integration

- Add a transition-trial result shape without forcing lunge into squat `RepMetrics`, scoring, or repetition narrative.
- Keep research results internal/non-actionable; verify storage/export round trips and claim withholding.
- Verification: lunge-specific session/result/history/export tests plus invalid/questionable abstention tests.

### P4.9 — Live/upload research parity

- Add live/upload only after offline/replay behavior is stable; preserve capture epochs, inference timing, effective FPS, and gap decisions.
- Verification: live/upload/replay parity on fixed tapes and real approved device cases; no public selection.

### P4.10 — Metric-specific validity, reliability, and human gates

- Run synchronized angle validation before promoting knee angle.
- Run repeat-session reliability before exposing variability/change interpretations.
- Complete Windows/NVDA, physical iPhone/Safari/VoiceOver, biomechanics, claims, privacy, and usability evidence.
- Verification: signed evidence packages; autonomous tests cannot mark this milestone passed.

### P4.11 — Separate activation decision

- Encode a human approval artifact and require every applicable gate to be passed before any status/input-mode/runtime/UI activation change.
- Activation must be a dedicated, auditable change with public-route E2E, claims review, rollback, and full release verification.
- Until then, squat remains the only available protocol.

## Final answers to the audit questions

1. **What exists?** An isolated, synthetic-tested stride-and-return forward-lunge research analyzer with six states, trials, metrics, findings, and offline evaluation at implementation frontier `f49558e`, now contained in `master` through a clean P4-M00 fast-forward.
2. **What is metadata-only/experimental/unavailable/user-accessible?** Registry/UI card metadata is user-visible but non-actionable; analyzer/metrics/findings are experimental internal code; public runtime and all capture modes are unavailable.
3. **Movement identity?** Forward lunge with stride and return, not FMS inline lunge or split squat.
4. **Phases/events?** Standing anchor, step, descending, pelvis-defined bottom, ascending, returning/stable return; no visible plant or return-initiation event.
5. **Landmarks/view?** Actual signal mask uses declared lead hip/knee/ankle/foot index plus both hips at visibility `>=0.5`; registry declares bilateral hips/knees/ankles/foot indices. Side view is asserted by metadata/provenance, not validated.
6. **Metrics?** Complete count, mean trial/descent/ascent time, projected lead-knee angle at pelvis-defined bottom, and duration CV.
7. **UI conclusions?** None. Only research status/name metadata reaches the UI.
8. **Abstention?** Calibration/provenance throw; zero completed trials yields no findings and one text reason; metric results still include count zero/nulls.
9. **Temporal failures?** Four unreadable active samples reject; shorter unreadable runs resume. Timestamp gaps/reversals, absent frames, reacquisition, identity/side swaps, and camera epochs are not handled.
10. **Already implemented?** ID/metadata, lead-side input, calibration/signals, synthetic six-state completion/rejection, research metrics/findings, offline evaluator, ontology boundary, public fail-close.
11. **Partial/missing/contradicted/unverified?** Detailed in Sections 6-10; largest gaps are identity/event reconciliation, temporal fail-close, negative fixtures, empirical data, and end-to-end integration.
12. **Unsupported thresholds?** Every lunge runtime numeric threshold and confidence cap lacks empirical target-task evidence.
13. **Path consistency?** Public paths consistently fail closed, but no lunge live/upload/replay/session/result/export parity exists.
14. **Accidental public availability?** Not in the current state/normal routes. Future activation governance is only partially encoded because not all external gates and signed owner approval are mandatory in the lifecycle validator.

## Audit conclusion

The correct Phase 4 starting point is neither “no lunge code exists” nor “lunge is production-shaped except for activation.” The evidence-supported position is:

> A deterministic stride-and-return research prototype exists at `f49558e` on `master`. It is safely unavailable. P4-M00 reconciles its movement name and documentation authority; event ontology, landmark contract, temporal failure policy, metric evidence, and product integrations remain later gated work.

The next work should begin with identity/event-contract decisions and deterministic failure coverage, while keeping thresholds unchanged and lunge unavailable. Human/data/scientific gates remain blockers for field validation and activation, not excuses to treat the current synthetic analyzer as absent.
