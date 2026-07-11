# KinematicIQ Post-Dataset-Research Audit

**Audit date:** 2026-07-10

**Repository:** `C:\Users\acetu\KinematicIQ`

**Branch/commit:** `master` at `d0532036216f78c2194723b55a10159880909993`

**Remote state:** fetch and `pull --ff-only origin master` reported current; local branch is 17 commits ahead of `origin/master`.

**Scope:** repository, architecture, product workflows, tracking/validation, camera UX, results UX, protocol readiness, tests, documentation, and Aurelian integration.

**Non-goals:** no product feature implementation, threshold retuning, model replacement, dataset download, license acceptance, push, deploy, or publication.

## Executive summary

KinematicIQ is a credible evidence-first squat product with unusually strong deterministic tests, pose-tape replay, quality abstention, traceability, local-only persistence, and claims doctrine. The next move should **not** be another movement or a pose-model swap. It should be two coordinated workstreams:

1. **Evidence foundation:** dataset governance, skeleton/coordinate adapters, a versioned benchmark baseline, and failure-mode diagnosis.
2. **Product clarity:** resolve front/side camera contradictions, reduce mobile camera overlay density, compact the Results information architecture, and finish the protocol execution seam that current metadata only partially abstracts.

The critical architecture finding is that protocol awareness is incomplete. `ProtocolRuntime` and `analyzeFramesForProtocol` exist, but `CameraScreen` and `UploadScreen` still execute squat-specific segmentation and session assembly directly. A route-state `protocolId` can therefore label a result without selecting a genuinely different runtime. The current UI prevents planned protocols from reaching that path, so this is not a shipped mislabeling bug today; it is a hard blocker for protocol two.

The critical product finding is inconsistency rather than missing functionality. The live readiness contract says front view, the upload screen requests a side view, and generated coaching can request side filming even though the active observation protocol is `front-view-squat-v1`. On mobile, the camera HUD is crowded and the navigation wraps/clips. The Evidence report repeats the same conclusions across coach questions, posture profile, metric rows, component summaries, and coaching, producing a 6,500+ px page in the exercised fixture.

The recommended first additional movement remains **sit-to-stand**, but only after the protocol execution contract is complete and a research package exists. It has the best public evidence portfolio (UI-PRMD, KIMORE, OpenCap) and exercises new setup, chair/contact, seated activation, transition events, completion, and functional-claims boundaries. It should not be forced through the current squat start/finish assumptions or marketed as a clinical test.

## Evidence inspected

### Repository and instructions

- `git status`, branch, remote, fetch/pull, SHA, and recent commit history.
- Root `CLAUDE.md`, `README.md`, tracked Markdown inventory, package/config files, scripts, nested source/test trees, and `.gitignore`.
- No tracked root `AGENTS.md` or `.aurelian/` existed before this task. No nested `AGENTS.md` files were found.
- Pre-existing untracked files were preserved: `.agent/`, multiple `.claude/`/`.cursor/` paths, bootstrap scripts, `docs/review/`, `web/coverage/`, `web/test-results/`, and related agent tooling.

### Canonical documentation

- Full master roadmap (3,549 lines), next execution package, traceability matrix, progress notes M39-M60, ADRs, doctrine, domain boundaries/backlogs, validation board/corpus, UX audit/design system, research index, Aurelian current source and project template.
- New public dataset report was read and added under `docs/research/` for repository-local traceability.

### Runtime and tests

| Command | Current-session result |
|---|---|
| `npm install` | Up to date; audit reported 9 vulnerabilities: 1 low, 3 moderate, 3 high, 2 critical. No auto-fix run. |
| `npm run build` | Passed; Vite warned about chunks >500 kB. Main index ~498 kB minified; `PoseScene3D` ~907 kB minified. |
| `npm test` | Passed: 72 files, 472 tests. Logs are very noisy because phase/rep debug output is emitted during tests. |
| `npm run test:coverage` | Passed: 88.56% statements/lines, 86.34% branches, 94.4% functions. CV is 75.52% lines; `poseEngine.ts`, `drawSkeleton.ts`, and `videoFrameSource.ts` are not exercised by the coverage scope/runtime. |
| `npm run eval:tapes` | Passed execution: 11 tapes, 0 errors; 9 labeled, 9/9 exact rep count; no bottom-frame MAE labels; no saved baseline, so acceptance is undecided rather than passing. |
| `npm run test:e2e:camera` | Passed: 3/3 Chromium fixture tests (clean squat, missing feet, permission denial). |

Four real-tape assertions use `skipIf` only when their local tape is absent. In this workspace they executed. Two fake-webcam Chromium tests contain explicit runtime skips for unsupported launch conditions. There is no lint script, automated accessibility checker, visual-regression suite, or mobile Playwright project.

### Browser walkthrough

Directly exercised:

- landing page at desktop and 390×844;
- clean-squat fixture from camera through results;
- missing-feet fixture at 390×844;
- Summary and Evidence report tabs;
- browser console warning/error check (none captured during walkthrough).

The browser evidence supports layout/workflow findings below; it does not establish behavior on real webcams, Safari, Firefox, slow devices, screen readers, or touch-only hardware.

## Current architecture and product flow

### Implemented and protected

- Browser-only React 18/TypeScript/Vite application with routes `/`, `/camera`, `/upload`, `/results`, `/history`.
- MediaPipe Tasks Vision `PoseLandmarker` full float16 model, GPU delegate, VIDEO mode, one pose.
- Live One-Euro filtering and offline gap/Hampel/zero-phase Butterworth filtering.
- Squat phase FSM, rep counter, gates, frame traces, posture proxies, set metrics, findings, feedback, root causes, quality gate, and versioned artifacts.
- Full abstention on invalid capture; questionable capture suppresses coaching.
- Pose-tape record/replay, local corpus manifest, label/eval tooling, benchmark-report generator, and reliability calculator/template.
- Summary/Evidence/Expert report disclosure, local IndexedDB opt-in history, JSON/HTML/CSV exports, and analyst replay/3D inspection.
- Claims policy, metric validation board, ADRs, research traceability, functional boundaries, and future R&D ledger.

These contracts should remain protected: `repCounter.ts`, `phaseDetector.ts`, pose-tape compatibility, verdict-or-abstain, versioned stored/exported schemas, MediaPipe configuration until benchmark evidence, and no-composite-score doctrine.

### Partially implemented

#### Protocol architecture

`ProtocolDefinition`, registry, stubs, `ProtocolRuntime`, shared cyclic engine, workflow model, and protocol-aware offline API exist. The gap is execution ownership:

- `CameraScreen.tsx` imports and drives `updatePhaseDetector`, `updateRepCounter`, squat auto-start/finish, squat debug vocabulary, and `buildSessionResult` directly.
- `UploadScreen.tsx` invokes squat-configured `runVideoAnalysis` and `buildSessionResult` directly.
- `analyzeFramesForProtocol` is tested but not the actual live/upload orchestration seam.
- `ProtocolRuntime.SegmentationOutput` is typed as the return of squat-configured `runPipelineOnFrames` and `CollectMetricsInput` assumes `RepMetrics[]`.
- `buildSessionResult` owns squat metric builders, squat quality gate, squat scoring, and squat-specific abstain copy.
- `SessionResult.metrics` remains a legacy squat-shaped summary.
- planned IDs are a closed union of squat/hipHinge/jump/sprint; sit-to-stand is absent.

This architecture supports a safe migration but is not yet a genuine universal runtime.

#### Workflow model

`assessmentWorkflow.ts` models nine stages, but `CameraScreen` derives a display attribute from existing state rather than owning transitions through the reducer. It improves vocabulary/testing but does not yet reduce the 995-line component or separate protocol setup/capture behavior.

#### Landmark quality

Per-frame quality captures visibility, critical coverage, missing critical landmarks, and implausible image-space speed. It is observational and does not gate the FSM. Bone-length instability, dropout-run duration, recovery time, cross-view error, world-landmark stability, and filter lag are not measured as first-class benchmark outputs.

#### Validation

The local tape suite is valuable and currently exact on rep counts, but:

- no saved comparison baseline was supplied to the benchmark;
- bottom events are not labeled, so bottom-frame MAE is unavailable;
- tapes are squat/web-video oriented, not synchronized anatomical ground truth;
- no cross-view paired trials, occlusion labels, camera-device matrix, or repeated-measures study exists;
- “production” metric tiers are based mainly on internal tape behavior, not independent lab validation.

### Missing

- Dataset registry/ledger separating metadata-only, evaluation-only, research-only, commercial-reviewed, manual-access, and future-ML roles.
- External skeleton/coordinate mappings and MediaPipe-to-dataset adapters.
- Ground-truth angle benchmark against OpenCap/BML-MoVi/UI-PRMD or equivalent.
- Jitter, dropout, recovery, bone-length, filter-lag, cross-view, camera-distance, and occlusion benchmark outputs.
- CI-safe external-data fixtures with provenance and redistribution approval.
- A saved immutable benchmark baseline artifact and regression thresholds by failure mode.
- Real device/browser performance profile and responsive/visual baselines.
- Protocol-owned setup/calibration/activation/completion/report configuration.
- Evidence-linked report moments and validated waveforms/phase timelines.

## Track A: Tracking reliability and validation

### Current limiting factors

1. **Evidence coverage, not lack of filters.** The repository already has sophisticated filtering. It cannot tell whether a different filter improves anatomical accuracy, reduces jitter, or merely smooths peaks because the benchmark lacks synchronized reference signals and event labels.
2. **Confidence is visibility-heavy.** Pose confidence averages critical landmark visibility. It does not quantify landmark anatomical bias, temporal lag, camera-view sensitivity, or world-coordinate validity.
3. **Normalized/world coordinate limits.** Image-space normalized distances vary with camera geometry. MediaPipe world landmarks are hip-centered model estimates, not calibrated global lab coordinates. Existing comments and claims must not turn them into universal metric depth.
4. **Single-person selection is implicit.** `numPoses: 1` limits output but does not guarantee the intended person is chosen when a bystander enters. Public crowd/occlusion data can stress the detector, but a consumer-specific bystander fixture is still needed.
5. **Dropped detections disappear from offline sequences.** Upload analysis collects detected frames only. Missing time points are not represented as explicit gaps before filtering, so dropout-run and temporal spacing behavior need careful benchmark treatment.
6. **Live/offline paths differ materially.** Live is display-rate rAF + One Euro; upload samples 15 fps + Butterworth. Parity means deterministic replay of each contract, not identical outputs across those filters.
7. **Provisional heuristics remain.** Capture view, distance, camera height, phase, rep gates, impossible-angle boundaries, and MDC-like thresholds are product-safe guardrails but not externally validated truths.

### Dataset mapping

| Failure mode | Immediate dataset/input | Why |
|---|---|---|
| Jitter/filter lag | local pose tapes with added event labels; BML-MoVi/OpenCap paired signals | Same motion over time; compare raw/candidate/reference waveforms |
| Dropout/recovery | PoseTrack, OCHuman, local scripted occlusion fixtures | Visibility/temporal tracks and product-specific recovery cases |
| Camera angle | BML-MoVi/MoVi, MPI-INF-3DHP, Human3.6M, SportsPose | Paired or broad views with 3D reference |
| Angle accuracy | OpenCap validation, BML-MoVi processed through OpenSim, UI-PRMD Vicon | Marker/lab reference and movements close to product scope |
| Bystanders/occlusion | PoseTrack, CrowdPose/OCHuman, Panoptic samples, local two-person fixtures | Tracking/visibility stress; public data alone does not test product selection UX |
| Rep/event segmentation | UI-PRMD, Penn Action, local source-video labels | Repeated movement and temporal events |
| Clinical variability | KIMORE, Parkinson/stroke gait data | Protocol research/robustness only; no diagnostic claims |

### Recommended scope

Build metadata, adapters, benchmark metrics, and a baseline before changing the filter or MediaPipe settings. M27 is superseded by M65: multiple candidate changes can be tested, but adoption remains optional and evidence-gated.

## Track B: Camera and session UX

### Current workflow

Landing → live/upload choice → implicit squat → camera permission/model → readiness overlay → calibration/ready → auto activation → live rep/status feedback → auto-finish or Finish Now → results. Planned protocols appear only in the landing section and are disabled.

### Findings

1. **View contract conflict (high).** `front-view-squat-v1` and readiness demand square front view; upload helper and generated depth coaching say film from the side. Metric eligibility should depend on an explicit view, not contradictory global copy.
2. **Mobile camera crowding (high).** At 390×844 the top navigation occupies two rows; status, long readiness checklist, rep count, analyst toggle, action bar, disclaimer, and skeleton share one screen. Analyst control partially competes with bottom actions. The user’s primary setup correction is visually diluted.
3. **Navigation clipping/wrapping (medium-high).** Mobile landing screenshot showed only part of the nav at the top before the remaining links wrapped below. Camera screenshot displayed two nav rows. This changes the assumed fixed navbar height used by camera positioning.
4. **State model is not the orchestration model (medium).** A typed workflow exists, but the component still coordinates many refs, effects, analysis states, recorder states, and UI toggles.
5. **Finish/cancel recovery is present but retake is late (medium).** Quality-review guidance occurs in results rather than a dedicated pre-report transition. That may be acceptable, but it should be a deliberate product decision after usability testing.
6. **Protocol selection is not prominent (medium).** Main CTAs navigate directly to squat. The picker is lower on the landing page, so future multi-protocol users may enter without an explicit movement/view contract.
7. **Debug/analyst surface is user reachable (medium).** Analyst mode reveals 3D and DBG controls in the product UI. This is useful internally but adds cognitive load and can expose experimental data without a clear audience boundary.

### Decomposition decision

`CameraScreen` exceeds the roadmap’s own split threshold (995 lines) and directly owns acquisition, inference, filter state, calibration, analysis FSMs, recording, quality streams, 3D state, navigation, and rendering. Decomposition is justified only along behavior-pinning seams:

- protocol session controller/hook (pure state and protocol contract);
- frame-loop adapter (camera/inference/filter handoff);
- capture HUD/presentation components;
- analyst tools kept lazy and isolated.

Do not rewrite the loop. Add characterization/e2e/parity coverage, extract one seam at a time, and keep thresholds untouched.

## Track C: Results, interpretation, and visualization

### What works

- Summary answers “what happened” compactly.
- Invalid/questionable states are explicit.
- Findings carry evidence/confidence/provenance.
- Export, replay, rep timeline, history, and analyst evidence exist.

### What does not yet work well

1. **Evidence repetition.** The same depth/trunk conclusions appear in coach questions, posture profile, keyed metrics, component summaries, coaching cards, and rep detail.
2. **No deterministic synthesis layer.** `buildResultsSummary` is a short squat string, while the rest is a stack of independent sections. There is no protocol report configuration deciding which source is canonical and which views link to it.
3. **Validation tier vs confidence can confuse.** A metric can show “High confidence” and “experimental” together. The first is camera evidence quality; the second is scientific validation. The UI should explicitly distinguish them.
4. **Positive language can outrun evidence.** “Looks good,” “working depth looks solid,” and “inside the expected range” can read as normative even when thresholds are internal and camera-dependent.
5. **Angles are ambiguous.** “98° knee bend” is presented for an included knee angle. The metric definition and user language should distinguish joint angle from amount of flexion.
6. **No evidence-linked moment.** Replay exists, but findings do not link to the representative rep/frame that generated them.
7. **Charts should wait for contracts.** Angle waveforms and phase timelines become useful only after event alignment, coordinate/view definitions, decimation, and low-confidence behavior are validated.

### Recommended information hierarchy

- Summary: verdict, one deterministic narrative, top 1-3 findings, one next action, confidence/limitations.
- Evidence: one canonical evidence card per finding with linked metric(s), representative rep/moment, and concise rep comparison.
- Expert: complete table, validation/provenance, waveform/phase views where validated, replay, rejected candidates, exports.

M68 should remove duplication before M69 adds visualization.

## Track D: Protocol expansion readiness

### Candidate assessment

Scoring: 1 low/weak to 5 high/strong. “Architecture value” means how much useful generality the protocol proves, not implementation ease.

| Candidate | User value | Public evidence | Ground truth | Complexity/risk | Architecture value | Squat reuse | Recommendation |
|---|---:|---:|---:|---:|---:|---:|---|
| Sit-to-stand | 5 | 5 | 4 | 3 | 5 | 3 | **First**, after M70/M71 gates |
| Hip hinge | 5 | 2 | 2 | 3 | 3 | 4 | Second training protocol after proprietary labels |
| Lunge | 4 | 4 (UI-PRMD/FMS) | 3 | 4 | 4 | 3 | Strong third candidate; unilateral/view complexity |
| Push-up | 4 | 3 | 1 | 3 | 4 | 2 | Useful floor/sagittal test; weak biomechanics labels |
| Jump/landing | 5 | 4 | 3 | 5 | 5 | 1 | Later; ballistic, event/FPS and unsupported power risk |
| Gait/running | 5 | 5 | 5 | 5 | 5 | 1 | Research/validation-rich but too broad for protocol two |
| Sprint | 4 | 2 | 2 | 5 | 5 | 1 | Defer; fast motion, moving field, event precision |
| Rotation | 3 | 2 | 1 | 5 | 4 | 1 | Defer; axial rotation is weak in monocular landmarks |
| Overhead movement | 4 | 3 | 2 | 4 | 4 | 2 | After upper-body/partial-body capture contracts |
| Pull movement | 3 | 2 | 1 | 5 | 4 | 1 | Defer; equipment/occlusion and hanging support state |

### Why sit-to-stand wins after challenge

- It has better public validation/protocol inputs than hip hinge: UI-PRMD includes Vicon/Kinect, KIMORE adds patient/clinician context, and OpenCap provides kinematic workflows.
- It creates real architecture pressure: chair/contact, seated readiness, transition events, alternate start/end state, timing/completion, and functional-claims boundaries.
- It can ship useful observations without normative or medical conclusions: count, completion time, phase timing, and within-set consistency.
- It should be framed as a repeated chair-rise movement protocol, not as a 5xSTS/30s clinical score unless a later validated clinical scope exists.

Its drawback is also why it is a good test: the current squat activation assumes upright calibration and descent. M71 must decide whether repeated sit-to-stand is modeled as a transition-trial engine or a cyclic engine with seated/standing phases; that decision requires labeled data, not analogy.

## Documentation and milestone state

### Accurate/canonical

- Master roadmap and progress notes preserve M00-M60 history.
- ADRs/doctrine/validation/UX/backlogs are strong.
- README is broadly aligned with shipped features.

### Stale or conflicting

- `docs/08_ai_rules.md` still prohibits session persistence, while opt-in IndexedDB history is shipped and documented elsewhere.
- `RESEARCH_TO_CODE_TRACEABILITY.md` marked M41, M44, M45, and M49 planned despite their code, tests, and progress notes existing; current-session inspection verifies them.
- `NEXT_EXECUTION_PACKAGE.md` treats the reliability study and M27 filter as immediate but does not incorporate the new public-data research, protocol execution gap, or browser UX findings.
- `eval-tapes/README.md` preserves “pipeline at labeling” counts that differ from the current 9/9 exact result; the historical label is useful but needs a current-status note.
- Landing copy contains stronger lab/clinical implications than doctrine supports (“same math a motion lab uses, minus the lab,” “you have a movement lab,” patient/progress framing).

## Aurelian installation decision

**Decision: compatibility layer.** Full install would duplicate superior project-specific systems. Added root Codex loader and `.aurelian` indexes; updated stale global path in `CLAUDE.md`. Existing canonical roadmap, doctrine, research, ADR, validation, UX, and progress files remain authoritative. Untracked user-owned agent scaffolds were untouched.

## Risk-ranked findings

1. **High:** second protocol could be mislabeled/incorrect if route ID threading is mistaken for runtime selection.
2. **High:** no independent biomechanical/cross-view benchmark exists for tracking or angle claims.
3. **High:** camera-view instructions conflict across live, upload, and findings.
4. **High:** public dataset licensing/privacy could be mishandled without a role/approval registry.
5. **Medium-high:** mobile camera overlays and navigation reduce setup clarity.
6. **Medium-high:** Results Evidence is repetitive and obscures what matters.
7. **Medium:** “High confidence” can be confused with validation status.
8. **Medium:** no saved benchmark baseline, bottom-event truth, or real device matrix.
9. **Medium:** dependency audit reports 2 critical and 3 high vulnerabilities; ownership/exploitability not assessed.
10. **Medium:** no visual regression, automated accessibility, or mobile e2e project.

## Protected contracts and likely edit surfaces

| Protect | Why | Future edit seam |
|---|---|---|
| `repCounter.ts`, `phaseDetector.ts` thresholds | behavior and tapes depend on them | Candidate variants behind benchmark config only |
| pose-tape schema | audit artifact | additive versioned metadata/adapters |
| invalid full abstain | trust doctrine | protocol-specific quality adapter preserving decision |
| stored/exported schemas | local user data | expand/read/contract migration |
| MediaPipe model/config | all benchmarks depend on it | versioned candidate behind M65 gate |
| `CameraScreen` frame loop | live behavior | characterization then incremental controller/view extraction |
| `SessionResult` legacy fields | history/results compatibility | protocol artifact adapter before removal |

Likely next-wave files: `web/src/eval/`, new dataset metadata/adapters outside raw data, `protocols/runtime.ts`, `analysis/analyzeProtocol.ts`, `CameraScreen.tsx` and camera UI models, `UploadScreen.tsx`, `buildSessionResult.ts`, Results/report models, CSS/navigation, canonical docs and ADRs.

## What should happen next

1. M61 dataset governance and legal/access classification.
2. M62 common benchmark/skeleton contracts and CI-safe fixture policy.
3. In parallel after characterization: M66 camera workflow decomposition/copy-contract fix.
4. M63 pilot OpenCap/UI-PRMD/OCHuman/PoseTrack integrations and saved baseline.
5. M64 diagnosis report; only then M65 candidate tracking changes.
6. M67 camera responsive redesign and M68 report compaction can improve the product before protocol two.
7. M70 completes protocol execution ownership; M71 produces sit-to-stand evidence; M72 activates it only if gates close.

## What was not checked

- Real webcam permissions/capture on physical devices.
- Safari/Firefox/low-end device performance.
- Screen-reader output, measured color contrast, touch-target sizes, and reduced-motion behavior with assistive technology.
- Vercel production headers/deployment.
- `npm audit` exploit paths or remediation candidates.
- Dataset downloads, official click-through terms at action time, or adapter feasibility on real files.
- Independent expert review of biomechanics/coaching thresholds.
