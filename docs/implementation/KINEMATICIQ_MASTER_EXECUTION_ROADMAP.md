# KinematicIQ Master Execution Roadmap

Generated 2026-07-06 from a live clone of `https://github.com/Born2tweak/KinematicIQ.git`, branch `master`, at commit `898d7c4`.

This roadmap is an execution plan, not an implementation. It starts from the codebase as it exists now, preserves the completed M00-M24 and M31 work, and defines the next milestones required to turn KinematicIQ into the research-grounded movement-intelligence product described in `docs/research/`.

## 1. Executive Summary

KinematicIQ is no longer only a browser-only MediaPipe squat analyzer. It is a browser-only, local-first React/TypeScript movement-analysis app with a working squat protocol, quality gate, metric registry, findings engine, progressive results UI, replay/eval harness, local session history, planned protocol stubs, baseline comparison, and a large research corpus.

The most important current truth: the first architecture wave is already built. The old `IMPLEMENTATION_PLAN_AND_FABLE_PROMPT.md` was accurate for its time, but the repo has advanced through later commits:

- M00-M24 are implemented.
- M31 personal baseline v1 is implemented.
- M25-M30 and M32-M34 remain from `NEXT_20_MILESTONES.md`.
- The repo has 50 Vitest files, 277 passing tests, 4 skipped tests.
- `npm run build`, `npm test`, and `npm run test:coverage` pass after `npm install`.
- The real `eval-tapes/live-session-2026-07-05.posetape.json` is intentionally absent from git, so real-tape parity/regression tests skip in a fresh clone.

The next product leap is not a rewrite. The execution path is:

1. Finish the remaining validation/CV/protocol/documentation milestones already scoped in M25-M30 and M32-M34.
2. Convert research preservation from passive docs into living traceability, ADRs, source-to-code maps, and validation status tables.
3. Generalize the protocol runtime beyond squat metadata stubs, without weakening the squat path.
4. Build a defensible validation dataset and benchmark workflow before model swaps, new protocols, or stronger claims.
5. Expand product UX around protocol workflows, local audit artifacts, trend interpretation, and accessibility.
6. Defer or reject unsafe concepts: backend/auth/cloud in the near term, medical diagnosis, injury prediction, force/torque claims, composite scores, unbenchmarked model swaps, and avatar-first work.

## 2. Current Repo Audit

### Repository and package state

| Area | Current state |
|---|---|
| App root | `web/` |
| Framework | Vite 5, React 18, TypeScript 5.6 |
| Routing | `react-router-dom` routes `/`, `/camera`, `/upload`, `/results`, `/history` in `web/src/App.tsx` |
| Pose engine | MediaPipe `@mediapipe/tasks-vision` in `web/src/cv/poseEngine.ts` |
| Client model | Browser-only, no backend, no auth, no cloud storage |
| Persistence | Opt-in local IndexedDB session history in `web/src/storage/sessionStore.ts` |
| Tests | Vitest + jsdom, coverage through V8 |
| Scripts | `dev`, `build`, `preview`, `test`, `test:watch`, `test:coverage`, `eval:tapes`, `eval:label` |
| Build gate | `npm run build` runs `tsc && vite build` |
| Coverage gate | Includes `src/cv/**`, `src/analysis/**`, `src/session/**`, `src/eval/**`; thresholds 75/80/75/75 |
| Current verified gates | Build, tests, and coverage pass after `npm install` |
| Dependency audit | `npm install` reports 9 vulnerabilities; roadmap treats dependency hygiene as a planned maintenance milestone, not a product behavior change |

### Folder structure

| Folder | Live role |
|---|---|
| `web/src/analysis/` | Angles, geometry, phase detector, rep counter, auto-start/finish, activation, set metrics, frame trace, video analyzer, posture analysis |
| `web/src/analysis/movement/` | Compatibility layer and `MovementProfile` config seam |
| `web/src/components/` | App shell, controls, camera/report components, replay, landing visuals, 3D inspection |
| `web/src/core/` | Confidence, provenance, metric, protocol, finding core types |
| `web/src/cv/` | Pose engine, landmark filters, capture guidance/readiness, drawing helpers, 3D pose helpers |
| `web/src/eval/` | Pose tapes, replay harness, batch eval, labeling, metrics, tape store/download |
| `web/src/feedback/` | Cue templates and feedback reasoning |
| `web/src/findings/` | Finding engine, squat rules, evidence strength, root-cause cards |
| `web/src/metrics/` | Metric registry, squat metric results, posture metric results |
| `web/src/protocols/` | Protocol registry, squat protocol, planned hip hinge/jump/sprint stubs |
| `web/src/scoring/` | Per-component evidence, not a composite score |
| `web/src/screens/` | Camera, upload, results, history, landing |
| `web/src/session/` | Session result builder, quality gate, baseline, types |
| `web/src/storage/` | Local session store and history view models |
| `docs/research/` | 11 source research/specification docs and README |
| `docs/doctrine/` | Claims policy, deferred scope, movement ontology |
| `docs/implementation/` | Previous implementation plans, progress notes, this master roadmap |
| `eval-tapes/` | README is tracked; athlete pose tapes are gitignored |

### Current app flow

1. Landing shows product framing and protocol entry.
2. Camera screen initializes MediaPipe, checks capture readiness, auto-calibrates, auto-starts, applies One Euro filtering, counts reps, records a pose tape, and navigates to results.
3. Upload screen analyzes a pre-recorded video through the shared `runVideoAnalysis`/`runPipelineOnFrames` path with offline Butterworth filtering.
4. Results screen renders summary/evidence/expert disclosure tabs, quality verdicts, metric rows, findings, feedback, root-cause cards, replay, pose tape export, rep timeline, and opt-in local save.
5. History screen lists saved local sessions and gives a hedged two-session observation.

### Current pose and analysis pipeline

The production analysis loop remains squat-cyclic:

- `poseEngine.detect()` returns `PoseFrame`.
- Live path filters with `createLiveStreamFilter()`.
- Upload path samples frames, optionally filters with `filterFrameSequence()`.
- `getJointAngles()` computes joint angles.
- `updatePhaseDetector()` segments standing/descending/bottom/ascending.
- `updateRepCounter()` validates candidates and emits `RepMetrics`.
- `runPipelineOnFrames()` is the shared live/replay core.
- `buildSessionResult()` creates quality, metrics, scoring evidence, findings, feedback, posture reads, root causes, and baseline placeholder.

Important coupling: `runPipelineOnFrames()` does not accept a protocol runtime. Protocols currently wrap metadata and the squat `MovementProfile`; planned protocols are blocked at registry/UI boundaries.

### Current scoring, evidence, feedback, and safety model

- There is no composite 0-100 movement score.
- `scoring/` produces per-component evidence only.
- `session/setQualityGate.ts` can return `valid`, `questionable`, or `invalid`.
- Invalid reports fully abstain from metrics/coaching and show reasons/fixes.
- Questionable reports suppress coaching.
- Findings cite metric evidence.
- Feedback cues are derived from findings.
- Root-cause cards use possible-contributor language and do not diagnose.
- Claims policy forbids injury prediction, diagnosis, kinetics, internal tissue claims, and fake precision.

### Current validation and eval harness

- Pose tape format exists with metadata, entry-state support, truth labels, diagnostics, and serialization.
- Replay harness supports cold/live replay and filter variants.
- Batch eval CLI exists through `npm run eval:tapes`.
- Label CLI exists through `npm run eval:label`.
- Real athlete tapes are intentionally gitignored.
- Fresh clone caveat: tests that expect `eval-tapes/live-session-2026-07-05.posetape.json` skip because the tape is absent.

### Fragile areas and areas not to refactor yet

Do not casually refactor these:

- `web/src/analysis/repCounter.ts` and `web/src/analysis/phaseDetector.ts`: open validation findings #5/#6/#8 require labeled data and careful benchmark gates.
- `web/src/cv/poseEngine.ts`: MediaPipe model swaps require benchmark proof first.
- `web/src/eval/poseTape.ts`: extend additively only; pose tapes are audit artifacts.
- `web/src/session/setQualityGate.ts`: full-abstain behavior is a product trust commitment.
- `web/src/screens/CameraScreen.tsx`: large and stateful; split only under a focused workflow/refactor milestone with parity tests.
- `web/src/session/types.ts`: still carries legacy `SetMetricsSummary`; remove only after storage/versioning migration exists.

## 3. Research Document Review

| Doc | Core thesis | Implementation ideas | Product/science implications | Already exists | Missing / soon / deferred / rejected | Milestones |
|---|---|---|---|---|---|---|
| `01_Foundations_of_Human_Movement.md` | Movement is a constrained, phase-aware, goal-directed control problem; seven gym patterns are insufficient. | Multi-axis ontology, movement-agnostic vs movement-specific split, phase-aware interpretation, variability categories. | Do not score template deviation blindly; track longitudinal adaptation. | `docs/doctrine/movement-ontology.md`, protocol stubs, findings questions. | Soon: runtime protocol state and second protocol. Deferred: broad universal ontology UI. Rejected: universal scalar quality score. | M28-M30, M35-M39, M42-M43, M55 |
| `02_Mathematical_Algorithmic_Biomechanics_Spec.md` | Biomechanics must be explicit about coordinate systems, filtering, segmentation, derivatives, uncertainty. | Confidence-aware filtering, timestamp-driven gates, metric abstention, derivative caution. | Kinematic metrics are allowed; kinetics are not from single RGB. | Angle math, One Euro live filter, Butterworth upload filter, timestamp-driven gate work. | Soon: per-frame quality, geometry metadata, filter benchmark gate. Deferred: IK/COM beyond cautious proxies. Rejected: force/torque/power claims. | M26-M27, M40-M41, M44-M47 |
| `03_Metric_Engine_Spec.md` | Metrics need definitions, units, validation tiers, confidence, provenance, and explicit exclusions. | Metric registry, `MetricResult[]`, exclusions for single-RGB. | Report evidence, not grades; no composite score. | `core/metric.ts`, `metrics/squatMetrics.ts`, `metricResults` in session. | Soon: retire legacy rendering dependence, add versioned metric governance. Deferred: movement fingerprinting. Rejected: composite and kinetics. | M34-M38, M40, M48-M49, M53 |
| `04_Coaching_Intelligence_Engine_Spec.md` | Coaching is metrics-to-meaning-to-cue reasoning with evidence strength and uncertainty. | Finding rules, evidence chains, root-cause concept cards, priority ranking. | Explain why a cue appears and what evidence supports it. | `findings/`, root causes, coach-question grouping, feedback from findings. | Soon: rule provenance, copy lint, intervention library with constraints. Deferred: ML coaching. Rejected: diagnosis-like cause attribution. | M35-M38, M50-M52, M56 |
| `05_Validation_Reliability_and_Scientific_Benchmarking_Handbook.md` | Scientific trust requires validation tiers, benchmark protocols, data splits, reliability, and confidence framework. | Dataset matrix, replay regression, SEM/MDC, drift detection, validation reports. | Product claims are gated by evidence tier. | Quality gate, replay harness, batch eval, coverage. | Soon: tracked validation corpus manifest, MDC-aware trends, validation report templates. Deferred: formal research-grade validation until data exists. | M32, M35-M38, M44-M49 |
| `06_CV_Subsystem_Technical_Spec.md` | CV subsystem must score capture quality, camera geometry, robust tracking, and benchmark model changes. | Capture readiness, per-frame landmark quality, model-swap benchmark discipline. | Bad capture must block/abstain rather than fake insight. | `captureReadiness`, capture guidance, filters, replay variants. | Soon: camera geometry checks, landmark quality stream, worker/perf budget. Deferred: model replacement. | M25-M27, M41, M46-M47 |
| `07_Domain_Intelligence_Spec.md` | Domain profiles can extend universal movement analysis, but clinical and injury claims need strict guardrails. | Sports/functional modules, domain contexts, longitudinal athlete intelligence. | No diagnosis, no injury prediction, no return-to-play. | Claims policy, planned protocols, local history. | Soon: functional but non-clinical sit-to-stand; domain metadata. Deferred: clinical modules, return-to-play, population norms. | M28-M30, M55-M58 |
| `08_Software_Architecture_and_Engineering_Specification.md` | Build deterministic scientific core, plugin-like protocol contracts, immutable artifacts, versioning, ADRs. | Protocol engine, evented pipeline, artifact strategy, local persistence, ADR template. | Every claim should be reproducible from versioned artifacts. | `core/`, `protocols/`, pose tapes, local store. | Soon: ADRs, traceability map, protocol runtime abstraction, worker architecture. Deferred: backend artifact service. | M34-M43, M51-M54 |
| `09_Competitive_Intelligence_and_Product_Strategy.md` | Win with honest evidence-first movement intelligence, not overclaiming or clone features. | Trust-first reports, validation moat, avoid vanity 3D/AI. | Product positioning depends on transparent uncertainty. | Disclaimer, quality gate, progressive reports. | Soon: exportable local report, evidence status badges, clearer onboarding. Deferred: enterprise dashboards. Rejected: avatar arms race. | M35, M50-M54, M59 |
| `10_Future_of_Movement_Intelligence_Roadmap.md` | Long horizon includes embeddings, digital humans, sensor fusion, prediction, and data flywheel, but not before foundations. | Deferral ledger, research agenda, validation partnerships. | Most ambitious ideas are research tracks, not current product features. | `deferred-scope.md`, local history, pose tape substrate. | Soon: future backlog governance. Deferred: embeddings, SMPL, sensors, predictive models. Rejected now: injury prediction and backend creep. | M35-M38, M57-M60 |
| `11_Product_Experience_Bible.md` | Trust is the product: guided workflow, visible confidence, progressive disclosure, calm dense UI. | Capture readiness, Summary/Evidence/Expert, finding cards, design system, accessibility. | Product should feel like a calibrated instrument, not a gimmick. | Results tabs, finding cards, capture readiness, history. | Soon: protocol workflow state machine, accessibility, export, design tokens. Deferred: team/clinic IA. | M25, M51-M56 |
| Additional docs in `docs/` | Existing PRD, architecture, scoring, feedback, validation, doctrine, and strategy docs encode earlier decisions. | Keep them synchronized with live code and research. | Repo must tell the truth to future agents. | Many docs exist, but some are stale or partial. | Soon: `INDEX`, traceability table, ADRs, README/architecture sync. | M34-M38 |

## 4. Gap Analysis Matrix

| Area | Current state | Desired state | Gap | Risk | Priority | Research source | Milestones |
|---|---|---|---|---|---|---|---|
| Movement ontology | Doctrine exists; code has protocol ids and planned stubs | Multi-axis ontology reflected in protocol metadata and UI | Runtime still squat-cyclic | Medium | High | 01, 08 | M35-M43 |
| Protocol engine | Registry wraps squat profile; stubs blocked | Protocol runtime selects segmentation, metrics, quality, report copy | `runPipelineOnFrames` not protocol-aware | High | High | 01, 08 | M39-M43 |
| Metric engine | Keyed `MetricResult[]` dual-written with legacy summary | Metrics are primary render/storage interface with versioning | Legacy `SetMetricsSummary` still central | Medium | High | 03 | M34, M40, M48 |
| Confidence and uncertainty | Numeric/chip confidence; quality gate | Per-frame, per-metric, per-finding uncertainty lineage | Confidence basis is broad and not always computed from raw evidence | Medium | High | 02, 05, 06 | M26, M44, M48 |
| Validation/reliability | Synthetic tests, batch eval, local real tapes gitignored | Versioned validation corpus manifest, reliability reports, MDC gates | Fresh clone lacks real-tape fixture | High | High | 05 | M32, M44-M49 |
| Capture quality | Readiness v1 and guidance | Camera geometry and protocol compliance checks before capture | View and camera geometry not strongly encoded | Medium | High | 06, 11 | M25-M26 |
| CV subsystem | MediaPipe + filters | Worker/performance budget, landmark quality stream, benchmarked filter changes | Large UI thread CameraScreen; no worker plan | Medium | Medium | 06, 08 | M26-M27, M41, M47 |
| Biomechanics math | Angles, ROM proxies, path/speed proxies | Explicit coordinate conventions and metric eligibility docs | Some assumptions live in comments/tests only | Medium | Medium | 02 | M35-M38, M48 |
| Scoring/evidence | Per-component evidence, no composite | Threshold classifications as internal evidence only | `scoring` naming may imply scoring | Low | Medium | 03, 04 | M34, M50 |
| Coaching intelligence | Findings, evidence strength, root causes | Rule provenance, intervention library, personalization boundaries | Rules are squat-only | Medium | High | 04 | M50-M52 |
| Results UX | Summary/Evidence/Expert with metrics, findings, replay | Report artifacts, accessible tables, traceable evidence cards | No local report export yet | Medium | Medium | 11 | M33, M51-M54 |
| Capture UX | Camera HUD and readiness | Protocol-specific preparation state machine and retake/quality review | Flow state is embedded in CameraScreen | Medium | High | 11 | M25, M41, M51 |
| Replay/evaluation | Replay harness and batch CLI | Corpus manifest, benchmark dashboards, CI-safe redacted fixtures | Real tapes are local-only and skipped | High | High | 05, 06 | M44-M47 |
| Testing | 277 passing tests, coverage passing | Browser-flow tests, copy-policy tests, protocol parity suites | No visual/e2e testing; console noise in tests | Medium | Medium | 05, 08, 11 | M45, M51, M56 |
| Local history | IndexedDB, baseline v1 | MDC-aware trends and exportable audit history | No MDC/change threshold; delete-all only | Medium | Medium | 05, 07, 11 | M32-M33, M55 |
| Future protocol expansion | Hip hinge/jump/sprint stubs | Sit-to-stand, hip hinge, jump as validated protocols | Runtime still cyclic squat; no labeled protocol data | High | High | 01, 07, 08 | M28-M30, M42-M46 |
| Domain intelligence | Guardrails and broad roadmap | Domain metadata and non-clinical functional modules | No domain context model | Medium | Medium | 07 | M55-M58 |
| Design system | CSS and components exist | Tokenized, accessible, reusable workflow components | Large CSS and screen components | Medium | Medium | 11 | M51-M56 |
| Documentation | Strong docs but partly fragmented | Living research-to-code traceability and ADRs | `docs/research/INDEX.md` and traceability table missing | Low | High | 08, 10 | M34-M38 |
| Safety/claims policy | Doctrine and copy practices exist | Automated/user-facing copy checks and status badges | Copy policy not enforced by tests globally | Medium | High | 05, 07, 11 | M35, M56 |
| Research traceability | Research README exists | Source doc -> code -> milestone -> status table | Traceability is distributed across plans/comments | Low | High | 08, 10 | M35-M38 |

## 5. Full Phased Roadmap

### Completed Foundation — Do Not Re-run

Completed in git history: M00-M24 and M31. Treat these as baseline architecture unless a later milestone explicitly migrates them.

### Phase A — Finish The Current Validation/CV/Protocol Wave

M25-M30 and M32-M34 complete the remaining items already identified in `NEXT_20_MILESTONES.md`.

### Phase B — Research Preservation And Governance

M35-M38 make research traceability, ADRs, status, and claims governance living repo artifacts.

### Phase C — Protocol Runtime Generalization

M39-M43 move protocol support from metadata stubs to a runtime architecture that can safely host more than squat.

### Phase D — Validation And Benchmarking Infrastructure

M44-M49 turn local tapes, labels, reliability, benchmark reports, and metric validation tiers into repeatable engineering gates.

### Phase E — Product Experience, Accessibility, And Artifacts

M50-M56 make the product workflow more coherent and user-trustworthy without adding backend scope.

### Phase F — Domain Intelligence And Future R&D Governance

M57-M60 define safe domain modules and long-horizon research tracks without prematurely building unsafe or unvalidated features.

## 5A. Chief Architect Operating Model

This roadmap is the project operating manual, not a fixed checklist. The initial milestone count is assumed to be wrong. Every implementation agent is responsible for discovering the correct next step from the live codebase, research corpus, validation evidence, and current roadmap state.

The Chief Architect rule:

> Derive the optimal execution roadmap from first principles, continuously updating it as implementation progresses.

Before starting any milestone, the implementing agent must challenge it with these questions:

| Question | Required answer |
|---|---|
| Why does this milestone exist? | Name the research requirement, code gap, validation need, product need, or risk it closes. |
| Why now? | Explain why it belongs before the neighboring milestones and what it unblocks. |
| Why not later? | Explain the cost of postponing it. If postponing is cheaper, reorder it. |
| Why not earlier? | Explain what prerequisite evidence, architecture, or tests were needed first. |
| What debt might this introduce? | Identify new coupling, migrations, temporary adapters, or duplicated logic. |
| How does it preserve optionality? | State how the change keeps future protocols, validation, and local-first constraints open. |
| Can it be smaller? | Split it if one agent cannot complete, test, and explain it cleanly. |
| Can it be merged or deleted? | Merge duplicated milestones and delete milestones made obsolete by repo discoveries. |
| What invalidates this milestone? | Name the discoveries that would cause a rewrite, deferral, or rejection. |

Every completed milestone must update the roadmap if it changes any of these:

- Current architecture
- Gap analysis
- Dependency graph
- Remaining milestone list
- Deferred or rejected ideas
- Technical debt ledger
- Research traceability
- Risk register
- Validation status
- Performance assumptions
- Overall vision coverage percentage

Milestones may be split, merged, reordered, removed, or created whenever the architecture demands it. The roadmap should fit reality; reality must not be forced to fit the roadmap.

### Single Source Of Truth Rule

`docs/implementation/KINEMATICIQ_MASTER_EXECUTION_ROADMAP.md` is the program-level source of truth after it lands. Supporting docs remain authoritative for their domain, but the roadmap must point to them and summarize their current execution status:

| Domain | Supporting source | Roadmap obligation |
|---|---|---|
| Research corpus | `docs/research/` | Keep vision coverage and traceability current. |
| Product/safety doctrine | `docs/doctrine/` | Keep constraints, deferrals, and claims policy synchronized. |
| Architecture decisions | `docs/adr/` | Add or update ADR rows when a milestone makes a durable decision. |
| Validation evidence | `docs/validation/`, `eval-tapes/` | Record what evidence exists, what is missing, and which tests skip. |
| Implementation progress | `docs/implementation/progress/` | Link each milestone note back into roadmap status. |
| Code truth | `web/src/`, `web/package.json`, tests | Audit live source before changing roadmap status. |

### Vision Coverage Status

Every major idea in every research document must be classified with one of these statuses:

| Status | Meaning |
|---|---|
| Implemented | Already exists in the repo and is covered by tests/docs. |
| Planned | Assigned to milestone(s) in this roadmap. |
| Deferred | Intentionally postponed with a reconsideration gate. |
| Rejected | Intentionally excluded, usually for safety/science/scope reasons. |
| Needs Research | Cannot responsibly implement until data, validation, or expert review exists. |

Initial vision coverage map:

| Research idea | Status | Evidence / milestone |
|---|---|---|
| Browser-only MediaPipe squat analysis | Implemented | `cv/poseEngine.ts`, `analysis/`, `CameraScreen.tsx` |
| Verdict-or-abstain quality gate | Implemented | `session/setQualityGate.ts` |
| No composite movement score | Implemented | `session/types.ts`, doctrine |
| Keyed metric results with confidence/tier | Implemented | `core/metric.ts`, `metrics/` |
| Findings from metric evidence | Implemented | `findings/` |
| Progressive Summary/Evidence/Expert report | Implemented | `components/report/`, `ResultsScreen.tsx` |
| Local session history | Implemented | `storage/sessionStore.ts`, `HistoryScreen.tsx` |
| Personal baseline | Implemented | `session/baseline.ts` |
| Camera geometry readiness | Implemented | M25 — `cv/captureReadiness.ts` geometry checks + `docs/implementation/progress/M25-capture-readiness-v2.md` |
| Per-frame landmark quality | Implemented | M26 — `cv/landmarkQuality.ts` + `docs/implementation/progress/M26-landmark-quality.md` |
| Benchmark-gated filtering | Planned | M27 |
| Sit-to-stand / hip hinge / jump protocols | Planned | M28-M30 |
| MDC-aware trend language | Planned | M32 |
| Local report export | Planned | M33 |
| Research index and traceability | Planned | M35-M36 |
| ADR system | Planned | M37 |
| Automated copy audit | Planned | M38 |
| Protocol runtime v2 | Planned | M39-M43 |
| Validation corpus manifest and benchmark reports | Planned | M44-M45 |
| Reliability calculator | Planned | M49 |
| Constraint-based coaching | Planned | M52 |
| Domain context model | Planned | M55 |
| Domain module governance | Planned | M57-M58 |
| Foundation movement model / embeddings | Deferred | M59; needs proprietary data and research program |
| Wearables / sensor fusion | Deferred | Requires scope change and sensor architecture |
| Backend, auth, cloud sync | Deferred | Violates near-term local-first constraints |
| Pose model swap | Deferred | Requires benchmark superiority on labeled corpus |
| OpenSim / inverse dynamics | Deferred | Requires calibrated/instrumented data |
| Normative population comparisons | Deferred | Requires population validation and bias evaluation |
| Medical diagnosis | Rejected | Claims policy |
| Injury prediction | Rejected | Claims policy |
| Force/torque/load from single RGB | Rejected | Metric spec exclusions |
| Composite 0-100 movement score | Rejected | Permanent doctrine |
| Segmental spine claims from MediaPipe | Rejected | Claims policy / validation strategy |

The vision coverage percentage is not code coverage. It is:

`(Implemented + Planned-with-milestone + Deferred-with-gate + Rejected-with-reason) / total classified research ideas`

`Needs Research` counts as covered only when the research question, data requirement, and decision gate are written down.

## 5B. Dependency Graph And Critical Path

### Milestone Dependency Graph

| Milestone | Depends on | Unblocks | Notes |
|---|---|---|---|
| M25 | Existing capture readiness | M28-M30, M51 | New protocols need trustworthy protocol-specific capture. |
| M26 | Existing `PoseFrame`, confidence model | M27, M44-M49 | Per-frame quality strengthens validation and metric confidence. |
| M27 | M26 preferred; replay harness | Later filter/model changes | Must not adopt default changes without benchmark evidence. |
| M28 | M25, M39-M43 if analysis ships | Functional assessment track | Can remain blocked/planned if runtime is not ready. |
| M29 | M39-M43, M42 | First real training-pattern expansion | Should not ship via squat-specific runtime. |
| M30 | M39-M43 or separate ballistic engine | Ballistic protocol family | Highest protocol runtime risk. |
| M32 | M31 baseline | M49, longitudinal UX | Uses conservative heuristics until validation exists. |
| M33 | Current results/session artifact | M53 | Local export foundation. |
| M34 | M25-M33 actuals | M35-M43 | Truth reset before deeper architecture work. |
| M35 | Current research docs | M36-M38 | Source index before traceability. |
| M36 | M35 | M37, M48, M60 | Traceability table becomes maintenance gate. |
| M37 | M36 preferred | M39-M43 | ADRs should exist before durable architecture decisions expand. |
| M38 | Claims policy | M50-M52, M55-M58 | Copy guard before more domain/coaching language. |
| M39 | M34-M37 | M40-M43 | Runtime contract before migration. |
| M40 | M39 preferred, M33 awareness | M43, M53 | Session artifact versioning before protocol-aware storage/export. |
| M41 | M25, M39 preferred | M43, M51 | Workflow model before multi-protocol capture UI. |
| M42 | M39 | M29, M43 | Shared cyclic engine before hip hinge runtime. |
| M43 | M39-M42 | M28-M30 fully available | Protocol-aware analysis entry point. |
| M44 | Current eval harness | M45-M49 | Validation corpus metadata before benchmark summaries. |
| M45 | M44 | M27 adoption, model/gate changes | Benchmark reports become acceptance evidence. |
| M46 | M40 preferred | M33, M45, M48 | Versioning supports all artifacts. |
| M47 | M41 preferred | Worker implementation future | Planning only; avoids premature compute move. |
| M48 | M36, M46 preferred | Metric tier changes | Prevents hidden validation upgrades. |
| M49 | M32, M44-M45 preferred | Future validated trend thresholds | Turns heuristics into measurable reliability work. |
| M50 | M36, M38 | M52 | Finding provenance before richer coaching. |
| M51 | M41, quality gate | Better capture/results recovery | Can be UI-only after workflow model. |
| M52 | M38, M50 | Richer coaching UX | Needs copy safety and provenance first. |
| M53 | M33, M46 preferred | Expert workflows | CSV follows export/versioning. |
| M54 | Existing UI | All future UX | Can run anytime, but best after export/report surface stabilizes. |
| M55 | M40 preferred, M38 | M57-M58 | Context must be stored safely and not drive medical advice. |
| M56 | Existing components | Future protocol UX | Can run alongside M54 if scope is controlled. |
| M57 | M35-M38 | M58-M59 | Domain backlog after traceability/safety are explicit. |
| M58 | M57, M28 if present | Safe functional protocols | Boundary doc prevents clinical drift. |
| M59 | M57 | Future research governance | Keeps speculative ideas out of product execution. |
| M60 | All completed/blocked milestones | Next execution package | Roadmap refresh and program checkpoint. |

### Critical Path

The shortest path to a credible multi-protocol movement-intelligence platform is:

1. M25-M26: capture and landmark quality become protocol-ready.
2. M34-M38: docs, traceability, ADRs, and claims governance become the program control layer.
3. M39-M43: protocol runtime becomes real rather than metadata-only.
4. M44-M45: validation corpus and benchmark reporting become the acceptance gate.
5. M29 or M28: a second protocol proves the architecture.
6. M48-M49: metric validation status and reliability work prevent claim creep.
7. M60: roadmap refresh after reality has changed.

Non-critical but high-value parallel work:

- M32-M33: trend/export product value.
- M50-M56: report, coaching, accessibility, and design-system polish.
- M57-M59: governance for domain and future R&D expansion.

### Phase Exit Criteria

| Phase | Exit criteria |
|---|---|
| Phase A | M25-M30 and M32-M34 are either complete or explicitly rewritten/blocked with evidence; build/test green; docs reflect actual status. |
| Phase B | Research index, traceability matrix, ADR directory, and copy audit exist; every R01-R11 major idea has a status. |
| Phase C | Squat runs through a protocol-aware runtime without behavior regression; planned protocols cannot accidentally analyze. |
| Phase D | Local validation corpus is manifest-tracked; benchmark reports exist; versioning and metric validation status are documented. |
| Phase E | Results/export/coaching/accessibility improvements preserve claims policy and local-only scope. |
| Phase F | Domain and future R&D backlogs classify all speculative ideas as planned, deferred, rejected, or needs research. |

## 5C. Program Risk Register

| Risk | Likelihood | Impact | Mitigation | Owner milestone(s) |
|---|---:|---:|---|---|
| Protocol runtime breaks squat behavior | Medium | High | Golden synthetic, replay, and build/test gates before any migration | M39-M43 |
| New protocols ship with weak validation | Medium | High | Planned/experimental status, blocked UI, validation corpus gates | M28-M30, M44-M49 |
| Real-tape tests skip silently | High in fresh clone | Medium | Manifest, explicit skip messaging, benchmark report | M44-M45 |
| Copy drifts into diagnosis/injury claims | Medium | High | Copy audit, claims ADR, review status | M38, M50, M52, M58 |
| Legacy `SetMetricsSummary` blocks generic protocols | High | Medium | Versioned session artifact and adapter strategy | M40 |
| CameraScreen becomes unmaintainable | High | Medium | Workflow reducer, later focused extraction only | M41 |
| Filter improvements change timing/counts | Medium | High | Benchmark-gated adoption only | M27, M45 |
| Metric confidence remains too generic | Medium | Medium | Per-frame quality and metric validation board | M26, M48 |
| Local storage schema breaks old sessions | Low | High | Versioned artifacts and compatibility tests | M40, M46 |
| Design-system work becomes broad refactor | Medium | Medium | Extract only repeated components and keep visual scope narrow | M56 |
| Performance degrades as protocols grow | Medium | Medium | Performance budget and worker plan before heavy compute | M47 |
| Research docs drift from code | High | Medium | Traceability matrix and roadmap update requirement | M35-M36, M60 |

## 5D. Assumptions, Known Unknowns, Budgets, And Ledgers

### Architecture Decision Record Register

M37 creates the ADR directory. Until then, these are the required initial ADRs and their owning decisions:

| ADR | Decision | Current status | Related milestones |
|---|---|---|---|
| ADR-001 | Browser-only, local-first pipeline | Planned | M37, M40, M55 |
| ADR-002 | Verdict-or-abstain quality gate | Planned | M37, M51 |
| ADR-003 | No composite movement score | Planned | M37, M38, M48 |
| ADR-004 | Pose tape as audit artifact | Planned | M37, M44-M46 |
| ADR-005 | Worker boundaries and performance budgets | Planned | M47 |
| ADR-006 | Protocol runtime contract | Planned after runtime design | M39-M43 |
| ADR-007 | Session artifact versioning | Planned after artifact migration | M40, M46 |

Every durable architecture decision after M37 must either create a new ADR or update an existing ADR. A milestone that changes a decision without updating the ADR register is incomplete.

### Research Assumptions

| Assumption | Status | Validation / decision gate |
|---|---|---|
| Single RGB can support useful coaching observations for constrained front-view squat. | Supported by current implementation, still limited. | Continue tape/eval validation; no stronger claims without data. |
| Protocol-specific metrics can share core confidence/provenance/finding types. | Plausible and partially implemented. | Prove with second protocol before expanding broadly. |
| Movement quality should remain multidimensional. | Accepted doctrine. | No composite score milestone may override this. |
| Root-cause cards can be useful if framed as possible contributors. | Heuristic. | Needs expert review before stronger product prominence. |
| Longitudinal local history can reveal useful self-referenced changes. | Plausible. | Needs reliability/MDC work before change claims strengthen. |

### Validation Assumptions

| Assumption | Current evidence | Gap |
|---|---|---|
| Synthetic fixtures catch core regressions. | 277 passing tests. | Real tape coverage absent in fresh clone. |
| Labeled local tapes support rep-gate decisions. | M15-M16 history says 9/9 exact locally. | Manifest and reproducible benchmark report needed. |
| Metric validation tiers are correctly assigned. | Tiers in metric definitions and docs. | Need metric validation status board and promotion criteria. |
| Confidence chips are meaningful enough for UX. | Current confidence model works broadly. | Need per-frame quality and uncertainty lineage. |
| MDC-like trend language can be conservative. | M32 planned. | Needs reliability estimates before claims strengthen. |

### Known Unknowns

| Unknown | Why it matters | Discovery path |
|---|---|---|
| Whether hip hinge can reuse cyclic engine safely. | Determines abstraction validity. | M29 synthetic and real-tape validation. |
| Whether jump proxies are stable enough from browser RGB. | Prevents false precision. | M30 as experimental; later force-plate comparison only if available. |
| How much per-frame quality improves metric confidence. | Confidence should be evidence-based. | M26 + benchmark reports. |
| Whether users understand abstention as trust rather than failure. | Product adoption risk. | Quality review UX, user testing later. |
| Whether local-only exports satisfy coach workflows. | Product value without backend. | M33/M53 usage feedback. |

### Performance Budgets

Initial budgets are targets, not verified guarantees. M47 must refine them with measurement.

| Surface | Budget | Rationale |
|---|---:|---|
| Live camera UI frame feedback | 30 fps visual target; analysis may sample lower | Preserve capture confidence and usability. |
| Live pose analysis | 10-15 analysis fps minimum | Matches current upload/default assumptions. |
| Camera guidance update | Under 150 ms perceived latency | Guidance must feel responsive. |
| Results initial render | Under 1 s for normal sessions | Reports should feel local and immediate. |
| Upload analysis progress | Continuous progress updates; no frozen UI over 500 ms | Upload may be slower but must not feel hung. |
| Replay interaction | Under 100 ms control response | Expert review must be inspectable. |
| Main bundle warning | Track chunks over 500 kB | Current build warns on large chunks; future work should not worsen without reason. |

### Technical Debt Ledger

| Debt | Current impact | Paydown milestone |
|---|---|---|
| `CameraScreen.tsx` owns too many responsibilities | Harder multi-protocol capture changes | M41, later focused extraction |
| `runPipelineOnFrames()` is squat-cyclic | Blocks true protocol runtime | M39-M43 |
| `SetMetricsSummary` remains central | Generic protocols and storage are constrained | M40 |
| Real validation tapes are local and invisible to CI | Fresh clone skips key assertions | M44-M45 |
| Test logs are noisy from phase/rep console output | Harder to read failures | Future test hygiene milestone after M45 |
| `scoring` folder name may imply scores | Product doctrine says evidence, not grades | M34/M50 naming docs; later rename only if low-risk |
| CSS is broad in `index.css` | Design changes risk global regressions | M56 |
| Dependency audit reports vulnerabilities | Maintenance/security debt | Future dependency-audit milestone; avoid breaking scientific pipeline casually |

### Refactor Opportunities

Refactors require tests first and must not be bundled into feature work unless the milestone explicitly says so.

| Opportunity | Trigger |
|---|---|
| Split CameraScreen into capture loop, workflow view model, and controls | After M41 reducer proves stable. |
| Move cyclic segmentation to `analysis/cyclic/` | M42 only, behavior-preserving. |
| Rename score/evidence surfaces | After M40/M50 clarify artifacts and UI. |
| Extract report table/card primitives | M56, only for repeated patterns. |
| Centralize downloads/exports | After M33 and M53 both exist. |

### Deletion Opportunities

Deletion is valuable when it reduces false architecture or stale doctrine.

| Candidate | Delete when |
|---|---|
| Thin `analysis/movement/registry.ts` shim | All call sites use protocol runtime and tests prove no behavior change. |
| Legacy result UI reads from `SetMetricsSummary` | MetricResult rendering and stored-session migration are complete. |
| Stale `NEXT_20_MILESTONES.md` sections | M34/M60 supersede them with this roadmap and actuals. |
| Old context-pack claims like "no persistence" | Regenerate/update context pack. |
| Unused score terminology | Evidence terminology is fully migrated and tests updated. |

### Rollback Strategy

Every implementation milestone must be reversible without corrupting user data or pose tapes.

| Change type | Rollback rule |
|---|---|
| Docs-only | Revert the specific docs commit. |
| Metric additions | Keep additive fields; hide from UI before deleting data shape. |
| Session storage changes | Version schema; never make old sessions unreadable. |
| Pose tape metadata changes | Add optional fields only; old tapes must deserialize. |
| Protocol runtime changes | Keep squat compatibility adapter until new runtime has parity. |
| Filter/gate changes | Require benchmark report; rollback by returning previous variant/config. |
| UI workflow changes | Preserve direct results route and existing router state until replacement is proven. |

## 5E. Decision Framework And Engineering Principles

This roadmap is the single source of truth only while it remains willing to correct itself. Every milestone must be treated as a hypothesis about the best next step, not as a commandment. The implementation agent must keep the product moving, but the Chief Architect duty is to preserve scientific validity, user trust, and architectural coherence when new evidence contradicts the plan.

### Decision Hierarchy

When priorities conflict, use this order:

| Rank | Principle | Meaning |
|---:|---|---|
| 1 | Scientific validity | Do not ship claims, metrics, or explanations that the evidence cannot support. |
| 2 | User trust and safety | Avoid medical diagnosis, injury prediction, fake certainty, or overconfident coaching. |
| 3 | Squat continuity | Existing squat capture, upload, analysis, replay, history, and results must keep working after every milestone. |
| 4 | Architectural simplicity | Prefer direct, testable modules over framework-heavy abstractions. |
| 5 | Future optionality | Create seams for protocols, metrics, validation, and findings without forcing speculative products. |
| 6 | Maintainability | Keep code readable, typed, documented where needed, and easy to delete. |
| 7 | UX clarity | Prefer evidence-first progressive disclosure over impressive but confusing visualizations. |
| 8 | Performance | Maintain browser responsiveness and bundle discipline. |
| 9 | Nice-to-have polish | Defer cosmetic upgrades that do not improve comprehension or trust. |

### Conflict Resolution Rules

| Conflict | Default decision |
|---|---|
| Research ambition vs. validation evidence | Classify as `Needs Research` or `Deferred`; do not implement as user-facing truth. |
| Protocol generality vs. squat stability | Keep squat as the golden reference until protocol parity is proven by tests and replay. |
| New abstraction vs. local clarity | Add the abstraction only if two or more current call sites benefit or a documented future milestone requires it. |
| UX richness vs. scientific confidence | Show evidence, uncertainty, and abstentions before adding visual spectacle. |
| Refactor urge vs. roadmap momentum | Refactor only when it directly reduces risk for the current or next milestone. |
| Performance optimization vs. correctness | First prove correctness and observability; then optimize measured bottlenecks. |
| Dependency convenience vs. browser-only durability | Add dependencies only with bundle, license, maintenance, and replacement analysis. |

### Engineering Principles

- Preserve truthful uncertainty. A lower-confidence result is preferable to an unsupported confident result.
- Prefer explicit data contracts over implicit shape-carrying objects.
- Prefer deletion to accommodation when legacy code no longer has a tested role.
- Keep pure analysis logic separate from React UI and browser APIs.
- Treat every metric as a claim with provenance, validation tier, confidence, and abstention rules.
- Make rollout reversible through adapters, compatibility tests, and exportable local data.
- Build interfaces narrow enough that a future implementation can replace internals without changing product semantics.
- Avoid "platform" code until two real use cases exist inside the repo.
- Keep generated or replayable evidence near every behavior change.
- Add comments only where they preserve reasoning that tests cannot express.

### First Principles Checklist

Before starting, splitting, merging, or deleting a milestone, answer:

| Question | Required answer |
|---|---|
| What user or scientific trust problem does this solve? | Name the concrete risk or capability. |
| Which current file or behavior proves the need exists? | Cite source files, tests, docs, or replay results. |
| Why now? | Explain why preceding milestones are sufficient and later deferral would increase risk. |
| Why before adjacent milestones? | Name the dependency relationship or risk ordering. |
| What optionality does it create? | Explain future work made easier without committing to unsafe scope. |
| What debt could it introduce? | Name the likely debt and the mitigation. |
| What can be deleted after it lands? | Identify obsolete adapters, duplicate code, or stale docs if known. |
| How will we know it worked? | Define tests, replay gates, UX checks, and documentation updates. |
| What would make us stop? | Name the signal that would downgrade the item to `Deferred`, `Rejected`, or `Needs Research`. |

### Chief Architect Review Loop

After every completed milestone, before starting the next one, the implementing agent must update this roadmap or a progress note with a Chief Architect review:

1. What did this milestone teach us that the roadmap had wrong or incomplete?
2. Which future milestones should be split, merged, reordered, deleted, or newly created?
3. Did the implementation reveal a simpler architecture than the one planned?
4. Which assumptions were validated?
5. Which assumptions were invalidated?
6. If starting today, would we still choose the same design?
7. What new risks emerged?
8. What risks became less important?
9. What technical debt was introduced?
10. What technical debt was eliminated?
11. What research questions became more important?
12. What research questions became less important?
13. What changed in validation status, confidence, or claims posture?
14. What changed in the dependency graph or critical path?

The answer may be short for small milestones, but it must exist. A milestone is not complete until its progress note contains this review.

### Continuous Challenge Cadence

| Moment | Required challenge |
|---|---|
| Before milestone start | Revalidate current repo state, dependencies, neighboring order, and acceptance gates. |
| During implementation | Split or pause the milestone if new coupling, missing tests, or scientific ambiguity appears. |
| Before completion | Run quality gates, update progress note, update traceability, and record new risks or debt. |
| After completion | Re-score remaining roadmap order and update this file when future milestones changed materially. |
| Every phase boundary | Re-audit architecture, gap matrix, risk register, code health dashboard, and phase exit criteria. |

## 5F. Complexity Budget And Code Health Dashboard

KinematicIQ must avoid becoming an impressive but brittle research prototype. Complexity is allowed only when it buys validation, clarity, reliability, or future protocol leverage. Every milestone should make the system either more capable or easier to reason about.

### Complexity Budget

| Item | Preferred | Warning | Requires split/refactor milestone |
|---|---:|---:|---:|
| Source file length | <= 500 lines | > 700 lines | > 900 lines |
| React component length | <= 250 lines | > 350 lines | > 500 lines |
| Function length | <= 50 lines | > 80 lines | > 120 lines |
| Cyclomatic branches in one function | <= 8 | > 12 | > 18 |
| Nested control depth | <= 3 | 4 | >= 5 |
| Component props | <= 8 | > 12 | > 16 |
| Direct imports in one module | <= 15 | > 22 | > 30 |
| New runtime dependency | 0 by default | Justified by ADR | Requires replacement/deletion plan |
| Main bundle warning | < 500 kB chunk target | Vite warning present | Must create performance milestone |
| Local storage schema changes | Versioned | Compatibility adapter needed | Migration/export milestone required |

The budget is not a punishment system. It is an early warning system. A milestone may exceed a budget only when the progress note explains why and opens a follow-up refactor or deletion milestone.

### Code Health Dashboard

Initial qualitative snapshot from the live repo audit:

| Dimension | Current score | Trend target | Notes |
|---|---:|---|---|
| Architecture coherence | 9.3 / 10 | Maintain | Strong local-first separation; protocol abstractions are emerging but not complete. |
| Squat product stability | 9.0 / 10 | Maintain | Good tests and replay harness; real tape fixture absent in fresh clone. |
| Scientific claims discipline | 8.5 / 10 | Improve | Composite score already removed; provenance and validation tiers still need stronger traceability. |
| Metric extensibility | 7.5 / 10 | Improve | Registry exists; richer canonical contracts and calibrated confidence remain. |
| Protocol extensibility | 7.0 / 10 | Improve | MovementProfile/protocol seeds exist; runtime is still squat-centered. |
| Validation infrastructure | 7.0 / 10 | Improve | Synthetic and deterministic harnesses exist; real labeled corpus is missing. |
| UX evidence clarity | 8.0 / 10 | Improve | Results and capture guidance are strong; progressive disclosure can become more rigorous. |
| Performance discipline | 7.0 / 10 | Improve | Build passes; Vite chunk warning remains. |
| Documentation health | 9.0 / 10 | Maintain | Strong planning docs; traceability must become living infrastructure. |
| Deletion discipline | 6.5 / 10 | Improve | Future milestones must actively remove duplicate adapters and stale abstractions. |

Update this dashboard at every phase boundary and whenever a milestone materially changes architecture, bundle shape, validation posture, or product claims.

### Repository Fitness Score

Each progress note should include a lightweight fitness delta:

| Signal | Record |
|---|---|
| Files added/modified/deleted | Count and names of important files. |
| Lines added/removed | Approximate diff size and whether it improved clarity. |
| Tests added/changed | Unit, integration, replay, UI, or fixture coverage. |
| Coverage delta | Include `npm run test:coverage` when relevant. |
| Bundle delta | Note Vite warnings or measured chunk changes when UI or dependencies change. |
| Runtime performance delta | Note analysis latency, capture responsiveness, or replay time when touched. |
| Dependency delta | New, removed, upgraded, or rejected dependencies. |
| Type health | New casts, `any`, suppressed errors, or stricter contracts. |
| Deletion delta | Dead code removed or newly identified. |
| Documentation delta | Roadmap, ADRs, traceability, research index, and progress note updates. |

The repository fitness score is not a single vanity number. It is a trend record that shows whether the product is becoming easier or harder to change safely.

### Architectural Smell Watchlist

Agents must scan touched areas for these smells and record findings in progress notes:

| Smell | Why it matters | Default response |
|---|---|---|
| God component | UI becomes impossible to test or reason about | Extract only around stable responsibilities. |
| God analysis module | Scientific logic becomes coupled and fragile | Separate pure metric, finding, and confidence layers. |
| Duplicate thresholds | Conflicting claims and inconsistent coaching | Centralize in registry/protocol definitions. |
| Magic numbers | Untraceable biomechanics assumptions | Add named constants with provenance. |
| Circular imports | Protocol expansion becomes brittle | Break with narrow data contracts. |
| Hidden mutable state | Replay determinism breaks | Move to explicit session state or pure functions. |
| Broad `any` or unchecked casts | Type contracts stop protecting research claims | Create explicit domain types. |
| UI copy as logic | Claims cannot be audited | Move claims and caveats into typed content/traceability records. |
| Unversioned local storage | Future migration risk | Version schemas and add export/migration tests. |
| Untested adapters | Compatibility layers may silently drift | Add parity tests or delete adapter. |
| Orphaned docs | Research traceability decays | Update index/status or remove stale doc. |

## 5G. Research Debt And Opportunity Register

Research debt is not technical debt. It is the gap between what the product wants to say and what the evidence can responsibly support. KinematicIQ must make that debt visible rather than hiding it behind confident UX.

### Research Debt Register

| Research debt | Current status | Risk | Owner milestone(s) | Required evidence to close |
|---|---|---|---|---|
| Real labeled squat corpus | Missing in fresh clone | Replay confidence may overfit synthetic cases | M53-M56 | Versioned fixtures with labels, anonymization policy, CI-compatible subset. |
| Metric confidence calibration | Partially heuristic | False certainty in coaching and results | M44-M48, M53-M56 | Empirical agreement, error bands, validation tiers, abstention rates. |
| Cross-device/camera reliability | Not fully benchmarked | Capture advice may fail on user devices | M25-M30, M55 | Device matrix and quality sensitivity tests. |
| Protocol transfer assumptions | Early stubs only | Squat abstractions may not generalize | M39-M43, M57-M60 | At least one non-squat protocol fixture and parity tests. |
| Domain-specific interpretation | Not implemented | Role-specific claims could overreach | M57-M60 | Domain claim matrix and source-grounded content review. |
| Clinical/medical boundary | Policy exists, enforcement incomplete | User trust and liability risk | M35-M38, M49-M52 | Claims inventory, UI copy audit, rejected claims ledger. |
| Biomechanics model limits | Documented but not enforced everywhere | Unsupported force/torque inference | M36-M38, M44-M48 | Metric provenance and blocked-claim tests. |
| Human expert agreement | Not measured | Coaching priority may not match expert judgment | M53-M56 | Expert annotation protocol and inter-rater reliability targets. |

### Validation Assumption Register

| Assumption | Current confidence | Consequence if false | Test or research needed |
|---|---|---|---|
| 2D pose landmarks are sufficient for current squat quality findings | Medium | Findings may be angle- or camera-dependent | Camera-angle stratified replay and abstention tests. |
| Synthetic fixtures cover major phase/rep transitions | Medium | Runtime could pass tests while failing real users | Real tape suite and adversarial fixture generation. |
| Capture guidance can reduce low-quality sessions | Medium | UX may frustrate without improving analysis | Before/after quality gate telemetry in local eval. |
| Registry-based metrics can preserve legacy behavior | High | Results drift during migration | Golden summary parity tests. |
| Protocol abstraction can emerge without rewriting squat | Medium | Later protocols may force churn | Non-squat protocol spike with rollback criteria. |

### Opportunity Register

| Opportunity | Impact | Difficulty | Blocked by | Status |
|---|---:|---:|---|---|
| Redacted fixture generator for real sessions | High | Medium | Privacy policy and tape schema | Planned |
| Benchmark dashboard for replay/eval trends | High | Medium | Stable validation corpus | Planned |
| Protocol authoring manifest preview | Medium | Medium | Protocol engine maturity | Deferred |
| Web Worker analysis offload | Medium | Medium | Measured main-thread bottleneck | Needs Research |
| WebCodecs upload performance path | Medium | High | Browser support and current upload bottleneck evidence | Needs Research |
| Generated local report templates | Medium | Low | Results schema stability | Deferred |
| Multi-camera calibration | High | Very high | Product scope change and validation corpus | Deferred |
| Wearable/IMU fusion | High | Very high | Sensor scope, data model, validation | Deferred |
| 3D body model visualization | Medium | High | Proven interpretive value | Deferred |
| Professional coach review workflow | High | High | Auth/backend decision | Deferred |

Opportunities become roadmap milestones only when they solve a current bottleneck, have a defensible validation path, and preserve the browser-only/local-first constraints unless an ADR explicitly changes those constraints.

## 5H. Architecture Evolution Timeline And Product Identity

The roadmap should evolve the product in disciplined layers. Each layer must remain useful without requiring the next one to exist.

### Architecture Evolution Timeline

| Stage | Identity | Architectural center | Exit signal |
|---|---|---|---|
| V1 | Browser squat analyzer | MediaPipe, squat analysis, local results | Already achieved. |
| V2 | Evidence-first squat analyzer | Capture quality, validation tiers, metric provenance, abstentions | Squat remains stable while confidence and claims become auditable. |
| V3 | Protocol-capable movement analyzer | MovementProfile, protocol runtime, canonical metric/finding contracts | Squat runs through protocol-compatible architecture with parity tests. |
| V4 | Local movement intelligence platform | Multiple protocols, local history, longitudinal trends | At least one additional validated protocol exists without backend dependency. |
| V5 | Validation platform | Benchmark corpus, reliability handbook, CI replay dashboards | Metrics have traceable reliability and regression thresholds. |
| V6 | Domain intelligence system | Domain modules, goal/role overlays, safe content rules | Domain guidance is source-grounded and claim-bounded. |
| V7 | Movement foundation R&D track | Multi-modal data, richer models, possible backend/cloud | Deferred until validation, privacy, and product constraints change. |

### Things We Refuse To Become

- A fake medical diagnostic tool.
- An injury prediction product without longitudinal clinical validation.
- A perfect-movement score generator.
- A 3D avatar showcase that outruns scientific interpretation.
- A black-box coaching app that cannot explain why it said something.
- A pile of thresholds with no provenance.
- A backend-first SaaS before local value and validation are proven.
- A research graveyard where specs disappear after implementation.
- A brittle demo where the squat analyzer breaks while chasing future protocols.
- A product that implies force, torque, pathology, or readiness from unsupported RGB-only evidence.

### Things We Are Building Toward

- A browser-first movement intelligence system.
- An evidence-first coaching experience.
- A protocol-aware metric and finding engine.
- A validation-aware results system that can abstain.
- A research-traceable codebase where every important claim has a source.
- A local-first product that can later justify cloud, auth, or pro workflows through evidence rather than ambition.

## 5I. Execution Governance Dashboards

Do not add governance for its own sake. These dashboards exist to make milestone reviews measurable, deletion-minded, and scientifically honest. Keep each update short enough that future agents will actually maintain it.

### Success Metrics Dashboard

Update this table after every milestone that touches runtime behavior, validation, UX flow, performance, or tests. Use `N/A` for metrics the milestone did not affect; do not invent numbers.

| Metric | Current baseline | Goal | Update cadence | Owner milestone(s) |
|---|---|---|---|---|
| Build time | Record latest `npm run build` duration from local run | Stable or improving; investigate sustained regressions > 20% | Every milestone | All |
| Test duration | Record latest `npm test` duration | Stable or improving; noisy tests identified | Every milestone | All |
| Bundle size | Vite reports `PoseScene3D` chunk > 500 kB in current audit | No unreviewed growth; create performance milestone if warnings worsen | UI/dependency milestones | M47, M51-M56 |
| Coverage | `npm run test:coverage` passes in current audit | Coverage does not decline for touched core modules | Relevant core milestones | M44-M49 |
| Replay accuracy | Synthetic replay passes; real tape skips in fresh clone | Versioned corpus reports explicit pass/fail, not silent skips | Replay milestones | M44-M47, M53-M56 |
| Rep accuracy | Current unit/replay expectations pass | No regression against golden squat fixtures | Analysis/protocol milestones | M25-M30, M39-M49 |
| Quality gate precision | Current quality gate tests pass | False blocks and false passes tracked by fixture class | Capture/CV milestones | M25-M27, M55 |
| Camera pass rate | Not measured | Local eval fixtures define acceptable pass/abstain behavior | Capture milestones | M25-M26 |
| User task completion | Not measured | Capture -> analysis -> results path remains direct and understandable | UX milestones | M51-M56 |
| Abstention quality | Partially heuristic | Abstentions increase when evidence weakens without hiding valid reps | Confidence milestones | M44-M48 |

### Principle Of Deletion

Every milestone should attempt to remove at least as much unnecessary complexity as it introduces. This is not a forced line-count target; it is a design habit.

For every milestone, the progress note must answer:

1. What code, docs, thresholds, adapters, or UI states became unnecessary?
2. What was deleted in this milestone?
3. If nothing was deleted, why is the added complexity still justified?
4. What can be deleted after the next dependent milestone lands?
5. Did this milestone reduce or increase the number of concepts a future engineer must understand?

Deletion is especially valuable when it removes stale score language, duplicate thresholds, untested adapters, dead protocol shims, outdated docs, or compatibility code after parity is proven.

### Scientific Claim Levels

Every user-facing finding, report section, coaching cue, and metric explanation should eventually declare a claim level. M35-M38 and M44-M49 own the first pass; later milestones must keep it current.

| Level | Meaning | Allowed product language | Required evidence |
|---|---|---|---|
| A | Directly measured from available landmarks or session timing | "measured", "detected", "observed" | Deterministic computation from pose/session data with tests. |
| B | Derived from validated metric relationships | "suggests", "is consistent with" | Metric provenance, validation tier, confidence, and replay coverage. |
| C | Heuristic observation from limited evidence | "may indicate", "appears" | Rule source, confidence caveat, abstention path, and copy review. |
| D | Research hypothesis or future product concept | Internal only | Research backlog entry; not shown as product truth. |
| Rejected | Unsupported or unsafe claim | Not allowed | Rejected/deferred ledger entry. |

Claims that imply diagnosis, injury prediction, readiness, joint force, torque, pathology, or clinical outcome from single RGB must remain `Rejected` unless a future ADR changes product scope and validation evidence.

### Competitive Watch

KinematicIQ should stay informed without becoming reactive. Competitive watch is a quarterly research activity, not a reason to copy features immediately.

| Competitor or category | Track | What to capture | Decision rule |
|---|---|---|---|
| Consumer fitness form apps | UX patterns and claims | New capture flows, coaching language, monetization, disclaimers | Borrow only patterns that improve trust or clarity. |
| Sports performance platforms | Validation posture | Metrics offered, evidence cited, hardware assumptions | Do not copy claims without matching evidence. |
| Physical therapy / clinical tools | Safety boundaries | Clinical disclaimers, assessment protocols, documentation workflows | Keep medical scope rejected unless validated and approved. |
| Pose/CV SDKs | Model capability and benchmarks | Landmark stability, browser support, model size, licensing | No model swap without M27/M47 benchmark gates. |
| 3D avatar products | Visualization value | Whether 3D improves interpretation or only presentation | Defer unless validated interpretation improves. |

Each competitive note should classify ideas as `Investigate`, `Planned`, `Deferred`, or `Do Not Copy`, with a short reason.

### Research Questions Backlog

These questions are not implementation tasks until a milestone defines evidence, fixtures, and acceptance gates.

| Question | Why it matters | Current status | Potential owner |
|---|---|---|---|
| Can frontal-view posture predict movement consistency across sessions? | Could strengthen longitudinal findings without overclaiming | Needs Research | M55-M58 |
| Which confidence thresholds maximize useful abstention rather than frustrating users? | Confidence gates shape trust | Needs Research | M44-M48 |
| Which cues do coaches actually act on first? | Coaching priority should match human expertise | Needs Research | M50-M56 |
| How stable are squat metrics across cameras, distances, and lighting? | Determines claim strength and capture guidance | Needs Research | M25-M27, M55 |
| Which metrics remain reliable for non-squat protocols from single RGB? | Prevents protocol expansion from becoming fake generality | Needs Research | M39-M43, M57-M60 |
| What minimum labeled corpus is enough for regression confidence? | Prevents validation work from being endless | Needs Research | M44-M47 |

### If We Had To Ship Tomorrow

Run this exercise at every phase boundary. It keeps the roadmap honest by separating essential product truth from ambition.

| Question | Required answer |
|---|---|
| What would we keep? | Name the smallest trustworthy product surface. |
| What would we remove? | Name incomplete, risky, or confusing features to hide or defer. |
| What is absolutely essential? | Capture, analysis, results, safety copy, and replay gates that must survive. |
| What is still experimental? | Anything with low validation, unclear UX value, or missing traceability. |
| What claims would we downgrade? | Any claim whose evidence level is C, D, missing, or disputed. |
| What follow-up would we promise? | Only work already supported by roadmap, evidence, and constraints. |

The preferred shipped product is smaller and more truthful, not larger and more speculative.

## 6. Detailed Milestones

### M25 — Capture readiness v2: camera geometry checks

**Status: Complete (2026-07-06).** See `docs/implementation/progress/M25-capture-readiness-v2.md`.

**Purpose**

Improve pre-capture trust by detecting camera geometry and protocol-view problems before auto-start can produce a weak recording.

**Research basis**

`06_CV_Subsystem_Technical_Spec.md` camera geometry and robust tracking; `11_Product_Experience_Bible.md` capture readiness; `25_capture_protocol_front_squat.md`.

**Current repo state**

`web/src/cv/captureReadiness.ts` checks body visibility, centering, and distance. `CameraScreen.tsx` renders readiness. Front-view squat protocol metadata exists but camera geometry is shallow.

**Gap**

No explicit front-view protocol compliance score, camera height/tilt hint, body occupancy band by protocol, or retake guidance tied to geometry.

**Files to inspect**

- `web/src/cv/captureReadiness.ts`
- `web/src/cv/captureGuidance.ts`
- `web/src/screens/CameraScreen.tsx`
- `web/src/screens/cameraSessionUi.ts`
- `docs/25_capture_protocol_front_squat.md`

**Files to create or modify**

- Modify `web/src/cv/captureReadiness.ts`
- Modify `web/src/cv/captureReadiness.test.ts`
- Modify `web/src/screens/CameraScreen.tsx`
- Modify `web/src/screens/cameraSessionUi.ts`
- Create `docs/implementation/progress/M25-capture-readiness-v2.md`

**Implementation steps**

1. Add `geometryChecks` to `CaptureReadinessAssessment` with ids `front-view`, `camera-height`, `body-occupancy`, `feet-visible`, and `symmetry-visible`.
2. Compute a protocol-compliance state: `ready`, `marginal`, `notReady`.
3. Use landmark geometry only: shoulder/hip horizontal spread, ankle visibility, body bounding box, and hip/nose/ankle vertical placement.
4. Add reason/fix copy scoped to capture, not movement quality.
5. Render the geometry reasons in the existing camera checklist without changing auto-start thresholds.
6. Keep `deriveCaptureGuidance()` as the one-line HUD instruction.

**Testing requirements**

- Unit tests for ideal front-view squat framing.
- Unit tests for too-close, too-far, clipped feet, off-center, and likely side-view cases.
- Camera UI copy test through pure view-model helpers if possible.

**Acceptance criteria**

- Readiness v2 returns actionable geometry reasons.
- Capture guidance still works for all existing tests.
- Squat recording flow still reaches ACTIVE on valid framing.

**Quality gates**

```bash
cd web
npm run build
npm test
```

Include:

```bash
npm run test:coverage
```

**Risks**

Over-gating could block valid recordings; camera geometry is approximate from single RGB.

**Do not do**

Do not change phase detection, rep counting, or MediaPipe. Do not claim calibrated camera pose.

**Progress note**

Require the implementing agent to write `docs/implementation/progress/M25-capture-readiness-v2.md`.

### M26 — Per-frame landmark quality scoring

**Status: Complete (2026-07-06).** See `docs/implementation/progress/M26-landmark-quality.md`.

**Purpose**

Make confidence more evidence-based by carrying landmark visibility, stability, plausibility, and missingness through analysis and eval.

**Research basis**

`02_Mathematical_Algorithmic_Biomechanics_Spec.md` uncertainty propagation; `05_Validation...Handbook.md` confidence framework; `06_CV_Subsystem_Technical_Spec.md` robust tracking.

**Current repo state**

`PoseFrame.poseConfidence` is average critical landmark visibility. Metric confidence often reuses session confidence. Analyst views show some diagnostics.

**Gap**

No per-frame quality object; metric confidence lacks direct lineage to missing joints and plausibility events.

**Files to inspect**

- `web/src/cv/types.ts`
- `web/src/cv/landmarkFilter.ts`
- `web/src/analysis/videoAnalyzer.ts`
- `web/src/session/buildSessionResult.ts`
- `web/src/eval/batchEval.ts`

**Files to create or modify**

- Create `web/src/cv/landmarkQuality.ts`
- Create `web/src/cv/landmarkQuality.test.ts`
- Modify `web/src/cv/types.ts`
- Modify `web/src/analysis/videoAnalyzer.ts`
- Modify `web/src/eval/batchEval.ts`
- Modify `web/src/components/report` or analyst report model as needed

**Implementation steps**

1. Define `LandmarkQualityFrame` with visibility coverage, critical coverage, jitter/plausibility flags, and missing critical landmarks.
2. Compute the object from a `PoseFrame` without mutating landmarks.
3. Add optional `quality` to `PoseFrame` additively.
4. Populate quality in live, upload, and replay paths.
5. Include aggregate quality fields in batch eval rows.
6. Surface quality only in Evidence/Expert UI, not as a scare warning.

**Testing requirements**

- Synthetic frames for all-visible, missing knees, clipped feet, low visibility, and implausible jumps.
- Replay tests proving quality metadata does not change rep counts.
- Batch eval test proving quality fields serialize.

**Acceptance criteria**

- Existing tests remain behaviorally unchanged.
- Quality fields explain missing/low-confidence evidence.
- No metric or finding becomes stronger because quality exists.

**Quality gates**

```bash
cd web
npm run build
npm test
npm run test:coverage
```

**Risks**

Adding fields to pose tapes can break old tapes if not optional.

**Do not do**

Do not require old tapes to contain quality. Do not silently fill long gaps.

**Progress note**

Require the implementing agent to write `docs/implementation/progress/M26-landmark-quality.md`.

### M27 — Benchmark-gated live filtering stack upgrade

**Purpose**

Upgrade live filtering only if labeled/replay evidence proves it reduces noise without changing counts or bottom timing.

**Research basis**

`02_Mathematical_Algorithmic_Biomechanics_Spec.md` filtering stack; `05_Validation...Handbook.md` regression testing; `06_CV_Subsystem_Technical_Spec.md` model/change benchmark discipline.

**Current repo state**

Live path uses One Euro. Upload path uses gap interpolation, Hampel, and Butterworth. Replay harness compares variants.

**Gap**

Live path lacks spike rejection/short-gap handling before One Euro, and adoption criteria are not formalized.

**Files to inspect**

- `web/src/cv/landmarkFilter.ts`
- `web/src/eval/replayHarness.ts`
- `web/src/eval/metrics.ts`
- `web/src/eval/batchEval.ts`
- `eval-tapes/README.md`

**Files to create or modify**

- Modify `web/src/cv/landmarkFilter.ts`
- Modify `web/src/cv/landmarkFilter.test.ts`
- Modify `web/src/eval/replayHarness.ts`
- Modify `web/src/eval/batchEval.ts`
- Create `docs/implementation/progress/M27-filter-benchmark.md`

**Implementation steps**

1. Add a candidate live prefilter path behind a named variant, not as default.
2. Extend replay comparison to include `oneEuroWithPrefilter`.
3. Define benchmark acceptance: same rep count, bottom frame drift within current tolerance, lower hip/knee jitter on labeled suite.
4. Run batch eval on available local tapes.
5. Adopt candidate as live default only if all acceptance metrics pass.
6. If local real tapes are absent, keep feature off and record blocked benchmark evidence.

**Testing requirements**

- Unit tests for spike rejection and short-gap handling.
- Replay variant tests on synthetic tapes.
- Batch eval report snapshot for synthetic truth.

**Acceptance criteria**

- Default live filtering changes only with benchmark evidence.
- Old `one-euro-live` tapes remain replayable.
- Progress note records measured before/after.

**Quality gates**

```bash
cd web
npm run build
npm test
npm run test:coverage
```

**Risks**

Filtering can improve smoothness while damaging timing. This milestone must be evidence-gated.

**Do not do**

Do not tune rep gates. Do not adopt a filter based on visual preference.

**Progress note**

Require the implementing agent to write `docs/implementation/progress/M27-filter-benchmark.md`.

### M28 — Sit-to-stand protocol v1

**Purpose**

Prove the protocol engine on a second movement with high functional value while keeping claims non-clinical.

**Research basis**

`07_Domain_Intelligence_Spec.md` functional assessment modules; `01_Foundations...` transition/load-management ontology; claims policy.

**Current repo state**

Only squat is available. Hip hinge, jump, and sprint are planned stubs. There is no sit-to-stand protocol.

**Gap**

Protocol expansion has not yet exercised a new runtime or non-squat reporting copy.

**Files to inspect**

- `web/src/protocols/registry.ts`
- `web/src/protocols/types.ts`
- `web/src/analysis/videoAnalyzer.ts`
- `web/src/session/buildSessionResult.ts`
- `web/src/components/ProtocolPicker.tsx`

**Files to create or modify**

- Create `web/src/protocols/sitToStand/index.ts`
- Create `web/src/protocols/sitToStand/sitToStand.test.ts`
- Modify `web/src/core/protocol.ts`
- Modify `web/src/protocols/registry.ts`
- Add minimal metrics/findings files only if runtime support exists
- Create `docs/implementation/progress/M28-sit-to-stand.md`

**Implementation steps**

1. Add `sitToStand` to `ProtocolId`.
2. Register a planned or experimental protocol with chair-stand metadata.
3. If runtime abstraction is not ready, block analysis with honest "not validated" UI and do not fake results.
4. If runtime abstraction is ready by this point, implement only count/completion-time observations.
5. Ensure all copy says functional movement observation, not clinical test/diagnosis.
6. Add tests for registry status and blocked/available behavior.

**Testing requirements**

- Registry tests for sit-to-stand.
- UI test/model test proving unavailable protocol cannot start analysis.
- If analysis ships, synthetic transition tape tests for count and timing.

**Acceptance criteria**

- Squat remains default and unchanged.
- Sit-to-stand never produces medical claims.
- Protocol picker status is honest.

**Quality gates**

```bash
cd web
npm run build
npm test
```

**Risks**

Clinical framing can creep in because sit-to-stand is common in clinical settings.

**Do not do**

Do not call it a diagnostic test. Do not compare to age norms.

**Progress note**

Require the implementing agent to write `docs/implementation/progress/M28-sit-to-stand.md`.

### M29 — Hip hinge protocol v1

**Purpose**

Activate the hip hinge stub as the first training-pattern expansion, using a different interpretation of similar landmarks.

**Research basis**

`01_Foundations...` movement primitives; `03_Metric_Engine_Spec.md` task-specific metrics; `04_Coaching...` movement-specific cues.

**Current repo state**

`web/src/protocols/hipHinge/index.ts` is a planned stub with no profile or analysis.

**Gap**

No hip-hinge phase config, metrics, findings, capture copy, or report copy exists.

**Files to inspect**

- `web/src/protocols/hipHinge/index.ts`
- `web/src/analysis/movement/profiles/squat.ts`
- `web/src/analysis/phaseDetector.ts`
- `web/src/analysis/repCounter.ts`
- `web/src/metrics/squatMetrics.ts`
- `web/src/findings/squatRules.ts`

**Files to create or modify**

- Create `web/src/analysis/movement/profiles/hipHinge.ts`
- Modify `web/src/protocols/hipHinge/index.ts`
- Create `web/src/metrics/hipHingeMetrics.ts`
- Create `web/src/findings/hipHingeRules.ts`
- Add tests next to each
- Create `docs/implementation/progress/M29-hip-hinge.md`

**Implementation steps**

1. Define minimal hinge profile with cyclic phases and conservative gates.
2. Add hinge-specific metrics: hip-dominant fold, knee-bend restraint, trunk line consistency.
3. Add evidence-only findings with no spine segment claims.
4. Add picker UI that enables hinge only after tests demonstrate synthetic behavior.
5. Use a small synthetic hinge fixture; do not rely on squat fixtures as truth.
6. Keep legacy squat tests unchanged.

**Testing requirements**

- Synthetic hinge counts one clear hinge.
- Squat fixture is not interpreted as a successful hinge unless criteria allow it.
- Hinge findings do not use squat-specific depth copy.
- Existing squat regression and replay tests pass.

**Acceptance criteria**

- Hinge is available only when minimal runtime and tests exist.
- Report labels identify hip hinge.
- No injury, spine, force, or mobility-capacity claims.

**Quality gates**

```bash
cd web
npm run build
npm test
npm run test:coverage
```

**Risks**

Reusing squat cyclic gates may produce misleading hinge reps.

**Do not do**

Do not retune squat gates while implementing hinge. Do not claim hamstring/glute weakness.

**Progress note**

Require the implementing agent to write `docs/implementation/progress/M29-hip-hinge.md`.

### M30 — Jump / countermovement jump protocol v1

**Purpose**

Introduce a ballistic protocol without overclaiming jump height, power, or landing injury risk.

**Research basis**

`07_Domain_Intelligence_Spec.md` sports assessments; `03_Metric_Engine_Spec.md` single-RGB limitations; `05_Validation...` instrument-comparison tier.

**Current repo state**

`web/src/protocols/jump/index.ts` is a planned ballistic stub. The pipeline is cyclic.

**Gap**

No ballistic segmentation engine, flight/takeoff/landing events, or trial averaging.

**Files to inspect**

- `web/src/protocols/jump/index.ts`
- `web/src/analysis/videoAnalyzer.ts`
- `web/src/analysis/frameTrace.ts`
- `web/src/cv/types.ts`
- `web/src/eval/replayHarness.ts`

**Files to create or modify**

- Create `web/src/analysis/ballistic/jumpDetector.ts`
- Create `web/src/analysis/ballistic/jumpDetector.test.ts`
- Modify protocol registry/types as needed
- Create `web/src/metrics/jumpMetrics.ts`
- Create `docs/implementation/progress/M30-jump-cmj.md`

**Implementation steps**

1. Build a separate ballistic detector; do not force jump through squat rep counter.
2. Detect countermovement, takeoff proxy, flight window proxy, and landing stabilization from hip/ankle trajectories.
3. Emit only display-tier proxy metrics.
4. Label jump height/power as excluded from single RGB unless instrumented.
5. Add trial averaging with explicit small-N copy.
6. Keep jump protocol hidden/planned until synthetic detector tests pass.

**Testing requirements**

- Synthetic ballistic fixture with one countermovement and landing.
- Negative test for squat-like movement.
- Metric exclusion test for jump height/power claims.
- Existing squat tests pass unchanged.

**Acceptance criteria**

- Jump can be listed as experimental/available only if detector works on synthetic fixtures.
- No power, force, or injury-risk copy appears.
- Batch eval can ignore unsupported protocols cleanly.

**Quality gates**

```bash
cd web
npm run build
npm test
npm run test:coverage
```

**Risks**

Flight-time from video is fragile; false precision would damage trust.

**Do not do**

Do not estimate ground reaction force, watts, torque, or injury risk.

**Progress note**

Require the implementing agent to write `docs/implementation/progress/M30-jump-cmj.md`.

### M32 — Trend reporting with MDC-aware change detection

**Purpose**

Upgrade local history from raw deltas to conservative change interpretation that respects measurement noise.

**Research basis**

`05_Validation...Handbook.md` SEM/MDC and "Is a change real?"; `07_Domain_Intelligence_Spec.md` longitudinal athlete intelligence.

**Current repo state**

`session/baseline.ts` computes personal baseline from at least three local sessions. Results UI states small differences are usually measurement noise.

**Gap**

No per-metric MDC thresholds or "within noise" labels.

**Files to inspect**

- `web/src/session/baseline.ts`
- `web/src/storage/historyView.ts`
- `web/src/screens/HistoryScreen.tsx`
- `web/src/screens/ResultsScreen.tsx`
- `web/src/metrics/squatMetrics.ts`

**Files to create or modify**

- Create `web/src/session/changeDetection.ts`
- Create `web/src/session/changeDetection.test.ts`
- Modify `web/src/session/baseline.ts`
- Modify `web/src/storage/historyView.ts`
- Modify results/history UI copy
- Create `docs/implementation/progress/M32-mdc-trends.md`

**Implementation steps**

1. Add conservative default MDC-like thresholds per metric id, marked `heuristic`.
2. Classify deltas as `within-noise`, `possible-change`, or `insufficient-history`.
3. Add confidence and sample-count requirements.
4. Render change language only for same-protocol local history.
5. Document that thresholds are provisional until validation study data exists.
6. Keep raw deltas inspectable in Expert/Evidence.

**Testing requirements**

- Baseline under three sessions remains null.
- Invalid sessions remain excluded.
- Small depth deltas classify as within noise.
- Large deltas classify as possible change with hedged copy.

**Acceptance criteria**

- No "progress score" or normative comparison is introduced.
- Trend UI uses "possible change" language, not certainty.

**Quality gates**

```bash
cd web
npm run build
npm test
npm run test:coverage
```

**Risks**

Heuristic MDC could look like validated reliability if copy is sloppy.

**Do not do**

Do not claim a real improvement without validation-derived SEM/MDC.

**Progress note**

Require the implementing agent to write `docs/implementation/progress/M32-mdc-trends.md`.

### M33 — Local session report export

**Purpose**

Create a shareable, local-only audit artifact containing metrics, findings, confidence, provenance, and caveats.

**Research basis**

`08_Software_Architecture...` artifact strategy; `11_Product_Experience_Bible.md` export/review workflow; `05_Validation...` reproducibility.

**Current repo state**

Users can save sessions locally and download pose tapes in analyst mode. No polished report export exists.

**Gap**

No self-contained HTML/JSON report artifact.

**Files to inspect**

- `web/src/screens/ResultsScreen.tsx`
- `web/src/session/types.ts`
- `web/src/eval/downloadTape.ts`
- `web/src/storage/sessionStore.ts`

**Files to create or modify**

- Create `web/src/export/sessionReport.ts`
- Create `web/src/export/sessionReport.test.ts`
- Modify `web/src/screens/ResultsScreen.tsx`
- Add CSS only if needed
- Create `docs/implementation/progress/M33-local-report-export.md`

**Implementation steps**

1. Define `ExportedSessionReport` JSON schema with app version, protocol id, metric results, findings, quality, provenance, and claim policy version.
2. Generate a self-contained HTML report string with no external network dependencies.
3. Add buttons: `Export report HTML` and `Export report JSON`.
4. Include invalid/questionable abstain state exactly as rendered.
5. Ensure exported copy includes "not medical advice" and validation tiers.
6. Do not include raw pose frames unless user separately exports pose tape.

**Testing requirements**

- Export schema test for valid, questionable, invalid sessions.
- Copy-policy test for forbidden terms.
- Browser URL/download helper test.

**Acceptance criteria**

- Report export works without backend.
- JSON is stable and versioned.
- HTML report contains enough provenance for audit.

**Quality gates**

```bash
cd web
npm run build
npm test
```

**Risks**

Export may imply clinical authority if copy is too polished.

**Do not do**

Do not add PDF generation, cloud sharing, auth, or FHIR.

**Progress note**

Require the implementing agent to write `docs/implementation/progress/M33-local-report-export.md`.

### M34 — Docs, doctrine, and architecture sync for M12-M33

**Purpose**

Bring existing docs up to the current repo state before the next architecture wave begins.

**Research basis**

`08_Software_Architecture...` documentation and ADR discipline; all source docs.

**Current repo state**

Many docs exist, but `00_context_pack.md` is stale relative to M24/M31, and progress notes are grouped for M17-M23 rather than every later milestone.

**Gap**

New agents can misread the current state if they rely on older docs.

**Files to inspect**

- `README.md`
- `docs/00_context_pack.md`
- `docs/07_architecture.md`
- `docs/implementation/NEXT_20_MILESTONES.md`
- `docs/implementation/progress/`
- `docs/doctrine/`

**Files to create or modify**

- Modify `README.md`
- Modify `docs/07_architecture.md`
- Modify `docs/00_context_pack.md` by running `scripts/generate-context-pack.ps1` if it is the canonical generator
- Modify `docs/doctrine/deferred-scope.md`
- Create `docs/implementation/progress/M34-docs-sync.md`

**Implementation steps**

1. Update repo status, commands, routes, modules, and test counts.
2. Mark M25-M30 and M32-M33 actual status after completion.
3. Reconcile `NEXT_20_MILESTONES.md` with this master roadmap.
4. Add a current "do not refactor yet" section.
5. Update deferred ledger with any new rejected or deferred ideas.
6. Keep research docs immutable.

**Testing requirements**

- Docs-only, but run build and tests.
- If context pack generator changes output, inspect diff manually.

**Acceptance criteria**

- README and architecture docs match live code.
- No stale statement claims "no persistence" or "squat only" without qualification.

**Quality gates**

```bash
cd web
npm run build
npm test
```

**Risks**

Generated context docs can overwrite hand edits.

**Do not do**

Do not edit the 11 research source docs.

**Progress note**

Require the implementing agent to write `docs/implementation/progress/M34-docs-sync.md`.

### M35 — Research index and source preservation

**Purpose**

Make the research corpus easy to navigate and immutable by convention.

**Research basis**

All research docs; `08_Software_Architecture...` documentation discipline; `10_Future...` data governance.

**Current repo state**

`docs/research/README.md` exists, but `docs/research/INDEX.md` does not.

**Gap**

Future agents must scan many long docs manually and may miss source authority.

**Files to inspect**

- `docs/research/README.md`
- `docs/research/*.md`
- `docs/doctrine/*.md`

**Files to create or modify**

- Create `docs/research/INDEX.md`
- Modify `docs/research/README.md` only if needed
- Create `docs/implementation/progress/M35-research-index.md`

**Implementation steps**

1. List all research/spec docs with stable ids R01-R11.
2. Add sections for thesis, engineering constructs, product constructs, safety constraints, validation requirements, and deferred concepts.
3. Add "do not edit source specs" guidance.
4. Link each doc to doctrine and roadmap sections.
5. Add a "how to cite research in progress notes" convention.

**Testing requirements**

- Docs-only; run build and tests.
- Manually verify every research doc appears exactly once.

**Acceptance criteria**

- `docs/research/INDEX.md` exists and references all 11 source docs.
- The index distinguishes source specs from implementation docs.

**Quality gates**

```bash
cd web
npm run build
npm test
```

**Risks**

Duplicating summaries can drift from sources.

**Do not do**

Do not rewrite research docs. Do not delete `docs/research/README.md`.

**Progress note**

Require the implementing agent to write `docs/implementation/progress/M35-research-index.md`.

### M36 — Research-to-code traceability matrix

**Purpose**

Create the living table mapping research docs to source files, milestones, implementation status, and validation tier.

**Research basis**

`08_Software_Architecture...` versioning/documentation; `05_Validation...` traceability and validation status.

**Current repo state**

Mappings exist in old plans and comments but not in one maintained matrix.

**Gap**

No single source answers: "which code implements this research concept?"

**Files to inspect**

- `docs/research/INDEX.md`
- `docs/implementation/IMPLEMENTATION_PLAN_AND_FABLE_PROMPT.md`
- `docs/implementation/NEXT_20_MILESTONES.md`
- `web/src/core/`
- `web/src/protocols/`
- `web/src/metrics/`
- `web/src/findings/`

**Files to create or modify**

- Create `docs/implementation/RESEARCH_TO_CODE_TRACEABILITY.md`
- Create `docs/implementation/progress/M36-traceability.md`

**Implementation steps**

1. Define status values: `implemented`, `partial`, `planned`, `deferred`, `rejected`.
2. Create a table: research doc -> concept -> source files -> milestones -> status -> validation tier.
3. Include explicit rows for rejected ideas such as force, torque, diagnosis, injury prediction, composite score, and model swap.
4. Link to progress notes where implementation decisions were made.
5. Add maintenance instructions: update the matrix in every future milestone touching source behavior.

**Testing requirements**

- Docs-only; run build and tests.
- Verify every `web/src/core` type has at least one traceability row.

**Acceptance criteria**

- Traceability file exists and contains source files plus milestone ids.
- Deferred/rejected items are visible, not silently omitted.

**Quality gates**

```bash
cd web
npm run build
npm test
```

**Risks**

Traceability can become performative if not maintained.

**Do not do**

Do not claim implementation status without file references.

**Progress note**

Require the implementing agent to write `docs/implementation/progress/M36-traceability.md`.

### M37 — Architecture Decision Records foundation

**Purpose**

Add ADRs for the architectural decisions that make KinematicIQ trustworthy and constrain future work.

**Research basis**

`08_Software_Architecture...` ADR template; claims policy; validation handbook.

**Current repo state**

No `docs/adr/` directory exists.

**Gap**

Key decisions live in plans/comments but are not durable decision records.

**Files to inspect**

- `docs/research/08_Software_Architecture_and_Engineering_Specification.md`
- `docs/doctrine/*.md`
- `docs/strategy/*.md`
- `web/src/eval/poseTape.ts`
- `web/src/session/setQualityGate.ts`

**Files to create or modify**

- Create `docs/adr/README.md`
- Create `docs/adr/ADR-001-browser-only-local-first.md`
- Create `docs/adr/ADR-002-verdict-or-abstain.md`
- Create `docs/adr/ADR-003-no-composite-score.md`
- Create `docs/adr/ADR-004-pose-tape-as-audit-artifact.md`
- Create `docs/implementation/progress/M37-adrs.md`

**Implementation steps**

1. Use one ADR template for status, context, decision, consequences, and references.
2. Record browser-only/local-first scope.
3. Record invalid-report full abstain.
4. Record permanent no-composite-score policy.
5. Record pose tape compatibility and additive-only changes.
6. Link ADRs from traceability matrix.

**Testing requirements**

- Docs-only; run build and tests.
- Verify ADR ids are unique and links work.

**Acceptance criteria**

- `docs/adr/` exists with at least four ADRs.
- ADRs cite source docs and source files.

**Quality gates**

```bash
cd web
npm run build
npm test
```

**Risks**

ADRs can be too vague to guide implementation.

**Do not do**

Do not use ADRs to reopen settled constraints.

**Progress note**

Require the implementing agent to write `docs/implementation/progress/M37-adrs.md`.

### M38 — Claims-policy automated copy audit

**Purpose**

Protect the safety boundary with tests that scan user-facing copy for prohibited claims.

**Research basis**

`05_Validation...` responsible communication; `07_Domain_Intelligence...` guardrails; `docs/doctrine/claims-policy.md`.

**Current repo state**

Claims policy exists, and many tests verify specific copy, but there is no broad audit.

**Gap**

Unsafe language can enter UI strings without a focused test.

**Files to inspect**

- `docs/doctrine/claims-policy.md`
- `web/src/feedback/`
- `web/src/findings/`
- `web/src/screens/`
- `web/src/components/`

**Files to create or modify**

- Create `web/src/test/claimsCopyAudit.test.ts`
- Create `web/src/test/claimsForbiddenTerms.ts`
- Create `docs/implementation/progress/M38-copy-audit.md`

**Implementation steps**

1. Define a small forbidden phrase list from claims policy: injury risk, diagnosis, abnormal, damaged, torque, force measured, joint load, readiness to play, return to play, weak glutes.
2. Scan known copy modules and exported template strings.
3. Allow documented exceptions only for exclusion explanations, policy docs, or tests.
4. Add comments explaining that this is a guardrail, not a full legal review.
5. Fail on new violations.

**Testing requirements**

- The audit test itself.
- Test that exclusion copy can mention forbidden concepts only as "not measured/not claimed".

**Acceptance criteria**

- Running `npm test` catches prohibited user-facing claim text.
- Existing safe exclusions still pass.

**Quality gates**

```bash
cd web
npm run build
npm test
npm run test:coverage
```

**Risks**

Naive scanning can create false positives.

**Do not do**

Do not scan immutable research docs as product copy.

**Progress note**

Require the implementing agent to write `docs/implementation/progress/M38-copy-audit.md`.

### M39 — Protocol runtime contract v2

**Purpose**

Define the runtime contract that lets protocols select segmentation, metrics, findings, quality rules, and report copy.

**Research basis**

`01_Foundations...` movement-agnostic/specific split; `08_Software_Architecture...` plugin contracts.

**Current repo state**

`ProtocolDefinition` is metadata; `MovementProfile` config drives squat. `runPipelineOnFrames()` is squat-cyclic.

**Gap**

New protocols cannot safely provide alternate segmentation or report builders.

**Files to inspect**

- `web/src/core/protocol.ts`
- `web/src/protocols/types.ts`
- `web/src/protocols/registry.ts`
- `web/src/analysis/videoAnalyzer.ts`
- `web/src/session/buildSessionResult.ts`

**Files to create or modify**

- Modify `web/src/core/protocol.ts`
- Modify `web/src/protocols/types.ts`
- Modify `web/src/protocols/registry.ts`
- Create `web/src/protocols/runtime.ts`
- Create `web/src/protocols/runtime.test.ts`
- Create `docs/implementation/progress/M39-protocol-runtime-v2.md`

**Implementation steps**

1. Define `ProtocolRuntime` with `segmentFrames`, `collectMetrics`, `deriveFindings`, `assessQuality`, and `buildReportMetadata`.
2. Make squat runtime wrap existing behavior without changing outputs.
3. Keep planned protocols with no runtime unavailable.
4. Add `getProtocolRuntime(id)` that throws `NotImplementedError` for planned protocols.
5. Do not migrate all call sites yet; this milestone creates the contract and adapter.

**Testing requirements**

- Runtime registry tests for squat, planned protocols, and unknown ids.
- Squat adapter test comparing current `runPipelineOnFrames()` output on synthetic frames.

**Acceptance criteria**

- Protocol runtime contract compiles and is tested.
- No UI behavior changes.

**Quality gates**

```bash
cd web
npm run build
npm test
```

**Risks**

Over-abstracting before second protocol data exists.

**Do not do**

Do not remove `MovementProfile` compatibility in this milestone.

**Progress note**

Require the implementing agent to write `docs/implementation/progress/M39-protocol-runtime-v2.md`.

### M40 — SessionResult protocol artifact v2

**Purpose**

Make session results versioned protocol artifacts rather than squat-shaped summaries with extra arrays.

**Research basis**

`03_Metric_Engine_Spec.md`; `08_Software_Architecture...` artifact strategy and versioning.

**Current repo state**

`SessionResult` contains `metrics: SetMetricsSummary`, `metricResults`, `findings`, quality, and protocol id. Storage persists full result.

**Gap**

Legacy `SetMetricsSummary` remains the primary summary and stored shape.

**Files to inspect**

- `web/src/session/types.ts`
- `web/src/session/buildSessionResult.ts`
- `web/src/storage/sessionStore.ts`
- `web/src/screens/ResultsScreen.tsx`
- `web/src/components/report/`

**Files to create or modify**

- Modify `web/src/session/types.ts`
- Create `web/src/session/sessionArtifact.ts`
- Create `web/src/session/sessionArtifact.test.ts`
- Modify `web/src/storage/sessionStore.ts`
- Create migration helpers if needed
- Create `docs/implementation/progress/M40-session-artifact-v2.md`

**Implementation steps**

1. Add `schemaVersion` and `algorithmVersion` to `SessionResult` or a wrapper artifact.
2. Add `legacyMetrics` naming or comment if `SetMetricsSummary` remains.
3. Keep old stored sessions readable.
4. Add adapter functions from legacy summary to metric results.
5. Document when legacy fields may be removed, likely not until a storage schema v2 migration.

**Testing requirements**

- Build artifact from current squat session.
- Read legacy stored session.
- Ensure metric results survive serialization.
- Results UI still renders old and new sessions.

**Acceptance criteria**

- Session artifacts are explicitly versioned.
- No saved session data becomes unreadable.

**Quality gates**

```bash
cd web
npm run build
npm test
npm run test:coverage
```

**Risks**

Storage migration bugs can hide user history.

**Do not do**

Do not delete legacy fields without migration and UI tests.

**Progress note**

Require the implementing agent to write `docs/implementation/progress/M40-session-artifact-v2.md`.

### M41 — Assessment workflow state model

**Purpose**

Extract the capture workflow state from `CameraScreen.tsx` into a typed model that can support multiple protocols.

**Research basis**

`11_Product_Experience_Bible.md` workflow states; `08_Software_Architecture...` evented pipeline.

**Current repo state**

Camera flow is a large React component with refs/state for model, camera, readiness, calibration, active set, finish countdown, tape recording, and analyst UI.

**Gap**

Protocol-specific preparation, quality review, and retake flows are hard to add safely.

**Files to inspect**

- `web/src/screens/CameraScreen.tsx`
- `web/src/screens/cameraSessionUi.ts`
- `web/src/analysis/autoStart.ts`
- `web/src/analysis/autoFinish.ts`
- `web/src/eval/poseTape.ts`

**Files to create or modify**

- Create `web/src/session/assessmentWorkflow.ts`
- Create `web/src/session/assessmentWorkflow.test.ts`
- Modify `web/src/screens/CameraScreen.tsx` minimally
- Create `docs/implementation/progress/M41-assessment-workflow.md`

**Implementation steps**

1. Define states: `select`, `prepare`, `cameraCheck`, `calibrate`, `ready`, `capture`, `autoFinishPending`, `qualityReview`, `results`.
2. Add pure transition reducer for protocol-agnostic state.
3. Map existing auto-start phases into workflow states.
4. Use reducer in CameraScreen only for display/state labels first.
5. Do not move detection loop yet.

**Testing requirements**

- Reducer transition tests for normal capture, cancel, retake, camera error, and finish.
- Camera status copy tests.
- Existing camera behavior tests if present remain green.

**Acceptance criteria**

- Workflow state is testable without DOM/camera.
- CameraScreen diff is small and behavior-preserving.

**Quality gates**

```bash
cd web
npm run build
npm test
```

**Risks**

Touching CameraScreen can break live capture.

**Do not do**

Do not rewrite CameraScreen wholesale.

**Progress note**

Require the implementing agent to write `docs/implementation/progress/M41-assessment-workflow.md`.

### M42 — Shared cyclic segmentation engine

**Purpose**

Extract squat's cyclic phase/rep machinery into a shared cyclic engine configurable by protocol.

**Research basis**

`01_Foundations...` phase-aware models; `08_Software_Architecture...` plugin contracts; `02_Biomechanics...` motion segmentation.

**Current repo state**

`phaseDetector` and `repCounter` are configurable but still semantically squat-oriented.

**Gap**

Cyclic protocols like hip hinge and sit-to-stand cannot reuse the pipeline without importing squat concepts.

**Files to inspect**

- `web/src/analysis/phaseDetector.ts`
- `web/src/analysis/repCounter.ts`
- `web/src/analysis/setActivation.ts`
- `web/src/analysis/videoAnalyzer.ts`
- `web/src/analysis/movement/profiles/squat.ts`

**Files to create or modify**

- Create `web/src/analysis/cyclic/cyclicEngine.ts`
- Create `web/src/analysis/cyclic/cyclicEngine.test.ts`
- Move or wrap existing functions with minimal behavior change
- Modify `web/src/analysis/videoAnalyzer.ts`
- Create `docs/implementation/progress/M42-cyclic-engine.md`

**Implementation steps**

1. Define generic `CyclicEngineConfig` using existing phase/rep/activation configs.
2. Create `runCyclicPipelineOnFrames(frames, config, initial)`.
3. Make `runPipelineOnFrames()` call the squat cyclic engine for backward compatibility.
4. Prove synthetic squat output is identical before/after.
5. Keep imports stable for tests.

**Testing requirements**

- Golden synthetic squat pipeline output.
- Existing squat regression tests.
- New cyclic engine config validation tests.
- Replay parity tests.

**Acceptance criteria**

- Squat outputs are unchanged.
- New cyclic protocols can call the engine without squat profile imports.

**Quality gates**

```bash
cd web
npm run build
npm test
npm run test:coverage
```

**Risks**

Behavior drift in rep counting.

**Do not do**

Do not retune thresholds.

**Progress note**

Require the implementing agent to write `docs/implementation/progress/M42-cyclic-engine.md`.

### M43 — Protocol-aware analysis entry point

**Purpose**

Allow live, upload, and replay analysis to run a selected available protocol through the same high-level API.

**Research basis**

`08_Software_Architecture...` data flow; `11_Product_Experience_Bible.md` protocol workflow.

**Current repo state**

Active protocol is effectively squat. Upload/live build squat session results.

**Gap**

Protocol picker cannot reliably select different analysis runtimes.

**Files to inspect**

- `web/src/analysis/videoAnalyzer.ts`
- `web/src/protocols/runtime.ts`
- `web/src/screens/CameraScreen.tsx`
- `web/src/screens/UploadScreen.tsx`
- `web/src/session/buildSessionResult.ts`

**Files to create or modify**

- Create `web/src/analysis/analyzeProtocol.ts`
- Create `web/src/analysis/analyzeProtocol.test.ts`
- Modify live/upload screens to carry selected `protocolId`
- Modify `buildSessionResult` to avoid defaulting to active protocol when explicit id exists
- Create `docs/implementation/progress/M43-protocol-aware-analysis.md`

**Implementation steps**

1. Add `analyzeFramesForProtocol(protocolId, frames, options)`.
2. Route squat through existing cyclic runtime.
3. Throw honest unavailable errors for planned protocols.
4. Thread protocol id through Camera and Upload route state.
5. Ensure result protocol id equals selected protocol id.
6. Keep squat as default.

**Testing requirements**

- Squat protocol analysis matches existing output.
- Planned protocol selection blocks cleanly.
- Upload and camera builder tests for explicit protocol id.

**Acceptance criteria**

- Analysis API is protocol-aware.
- Squat path remains unchanged.

**Quality gates**

```bash
cd web
npm run build
npm test
```

**Risks**

Default active protocol can mask missing id bugs.

**Do not do**

Do not enable unvalidated protocols by default.

**Progress note**

Require the implementing agent to write `docs/implementation/progress/M43-protocol-aware-analysis.md`.

### M44 — Validation corpus manifest

**Purpose**

Track local, gitignored athlete tapes with metadata, labels, availability, and validation status without committing motion data.

**Research basis**

`05_Validation...` dataset design; `08_Software_Architecture...` artifact strategy; privacy guardrails.

**Current repo state**

`eval-tapes/README.md` exists; actual tapes are gitignored. Fresh clone skips real-tape tests.

**Gap**

No tracked manifest explains which local tapes exist, which labels are expected, and which tests skip when absent.

**Files to inspect**

- `eval-tapes/README.md`
- `web/src/eval/tapeRegression.test.ts`
- `web/src/eval/replayParity.test.ts`
- `docs/validation/session-log.md`

**Files to create or modify**

- Create `eval-tapes/MANIFEST.example.json`
- Create `docs/validation/validation-corpus.md`
- Modify eval tests to report manifest-aware skip messages
- Create `docs/implementation/progress/M44-validation-corpus.md`

**Implementation steps**

1. Define a redacted manifest schema: id, label, source, protocol, truth presence, local path hint, consent status, validation use.
2. Add example manifest with no athlete data.
3. Document where local tapes live outside git.
4. Update tests to explain skipped real-tape assertions and how to enable them.
5. Add `npm run eval:tapes` instructions tied to manifest.

**Testing requirements**

- Manifest schema parser test if implemented.
- Eval tests still pass when no real tapes are present.

**Acceptance criteria**

- Fresh clone clearly explains skipped real-tape tests.
- No athlete motion data is committed.

**Quality gates**

```bash
cd web
npm run build
npm test
```

**Risks**

Accidentally committing sensitive local paths or athlete data.

**Do not do**

Do not unignore pose tapes.

**Progress note**

Require the implementing agent to write `docs/implementation/progress/M44-validation-corpus.md`.

### M45 — Benchmark report generator

**Purpose**

Create repeatable benchmark reports for protocol changes, filter changes, and rep-gate fixes.

**Research basis**

`05_Validation...` benchmark protocol and continuous QA; `06_CV...` model-change discipline.

**Current repo state**

`npm run eval:tapes` prints rows and writes JSON outcomes.

**Gap**

No higher-level report summarizes pass/fail gates, deltas from baseline, or acceptance decisions.

**Files to inspect**

- `web/src/eval/batchEval.ts`
- `web/scripts/evalTapes.ts`
- `web/src/eval/metrics.ts`
- `eval-tapes/README.md`

**Files to create or modify**

- Create `web/src/eval/benchmarkReport.ts`
- Create `web/src/eval/benchmarkReport.test.ts`
- Modify `web/scripts/evalTapes.ts`
- Create `docs/implementation/progress/M45-benchmark-report.md`

**Implementation steps**

1. Define report summary fields: tape count, labeled count, exact rep count rate, bottom frame MAE, verdict distribution, skipped/unavailable.
2. Add optional baseline JSON comparison.
3. Print a concise markdown report in addition to JSON.
4. Include acceptance flags for filter/model/gate changes.
5. Keep CLI backward-compatible.

**Testing requirements**

- Synthetic outcomes generate correct report.
- Error rows are counted but do not crash report.
- Baseline comparison flags regressions.

**Acceptance criteria**

- A future agent can run one command and know if a change is acceptable.

**Quality gates**

```bash
cd web
npm run build
npm test
npm run test:coverage
```

**Risks**

Benchmark summary can hide per-tape failures if too aggregated.

**Do not do**

Do not change analysis behavior.

**Progress note**

Require the implementing agent to write `docs/implementation/progress/M45-benchmark-report.md`.

### M46 — Model and algorithm version registry

**Purpose**

Make every output traceable to pose model, filter, algorithm, metric, protocol, and claims-policy versions.

**Research basis**

`05_Validation...` version tracking; `08_Software_Architecture...` artifact versioning; `03_Metric...` metric provenance.

**Current repo state**

`core/provenance.ts` has model/filter fields and optional app/algorithm version. Many values default.

**Gap**

Versions are not centralized, and algorithm changes may not appear in exported artifacts.

**Files to inspect**

- `web/src/core/provenance.ts`
- `web/src/core/metric.ts`
- `web/src/session/buildSessionResult.ts`
- `web/src/eval/poseTape.ts`
- `web/package.json`

**Files to create or modify**

- Create `web/src/core/versioning.ts`
- Create `web/src/core/versioning.test.ts`
- Modify `web/src/core/provenance.ts`
- Modify session/tape/export builders
- Create `docs/implementation/progress/M46-version-registry.md`

**Implementation steps**

1. Define constants for app schema, algorithm, protocol schema, metric schema, claims policy, MediaPipe model, filter variants.
2. Use the constants in provenance builders.
3. Add versions to pose tape metadata additively.
4. Add versions to report export artifacts.
5. Add tests proving versions are non-empty and stable.

**Testing requirements**

- Version constants test.
- Session result provenance test.
- Pose tape backwards compatibility test.

**Acceptance criteria**

- Every new result artifact includes version metadata.

**Quality gates**

```bash
cd web
npm run build
npm test
```

**Risks**

Changing tape metadata incorrectly can break old tapes.

**Do not do**

Do not require old tapes to have new fields.

**Progress note**

Require the implementing agent to write `docs/implementation/progress/M46-version-registry.md`.

### M47 — Performance and worker architecture plan

**Purpose**

Prepare for heavier protocols by defining performance budgets and worker boundaries before moving compute.

**Research basis**

`06_CV...` performance engineering; `08_Software_Architecture...` worker-based compute ADR.

**Current repo state**

MediaPipe and analysis run in browser; no worker split. CameraScreen is large.

**Gap**

No measured latency budget or worker migration plan.

**Files to inspect**

- `web/src/screens/CameraScreen.tsx`
- `web/src/cv/poseEngine.ts`
- `web/src/analysis/videoAnalyzer.ts`
- `web/vite.config.ts`
- `docs/research/08_Software_Architecture_and_Engineering_Specification.md`

**Files to create or modify**

- Create `docs/architecture/PERFORMANCE_AND_WORKER_PLAN.md`
- Create `docs/adr/ADR-005-worker-boundaries.md`
- Optionally add lightweight timing helper tests if pure
- Create `docs/implementation/progress/M47-performance-worker-plan.md`

**Implementation steps**

1. Document current main-thread responsibilities.
2. Define target latency budgets for camera, inference, analysis, rendering.
3. Identify worker-safe pure modules.
4. Define migration sequence without implementing worker movement yet.
5. List browser constraints for MediaPipe/WASM/COOP/COEP.

**Testing requirements**

- Docs-only; run build and tests.

**Acceptance criteria**

- Worker migration has a staged plan and ADR.

**Quality gates**

```bash
cd web
npm run build
npm test
```

**Risks**

Premature worker implementation can destabilize camera flow.

**Do not do**

Do not move MediaPipe into a worker in this milestone.

**Progress note**

Require the implementing agent to write `docs/implementation/progress/M47-performance-worker-plan.md`.

### M48 — Metric validation status board

**Purpose**

Expose metric validation tier, evidence status, and required validation work in one maintained artifact.

**Research basis**

`03_Metric_Engine_Spec.md`; `05_Validation...` metric validation; claims policy.

**Current repo state**

Metric definitions include validation tiers and exclusions. UI displays tiers.

**Gap**

No human-readable board lists validation evidence, data status, and promotion criteria.

**Files to inspect**

- `web/src/metrics/squatMetrics.ts`
- `web/src/metrics/postureMetrics.ts`
- `docs/strategy/validation-strategy.md`
- `docs/implementation/RESEARCH_TO_CODE_TRACEABILITY.md`

**Files to create or modify**

- Create `docs/validation/METRIC_VALIDATION_STATUS.md`
- Modify traceability matrix to link it
- Create `docs/implementation/progress/M48-metric-validation-status.md`

**Implementation steps**

1. List every metric id.
2. Add current validation tier, source file, product surface, required landmarks, known failure modes.
3. Add promotion criteria from experimental to production/research.
4. Include excluded metrics and why they remain excluded.
5. Add maintenance instructions for any new metric.

**Testing requirements**

- Docs-only; run build and tests.
- Manual check: every included metric id appears.

**Acceptance criteria**

- Metric status board prevents hidden claim creep.

**Quality gates**

```bash
cd web
npm run build
npm test
```

**Risks**

Status board drifts if not updated with metrics.

**Do not do**

Do not upgrade any validation tier without evidence.

**Progress note**

Require the implementing agent to write `docs/implementation/progress/M48-metric-validation-status.md`.

### M49 — Reliability study template and offline calculator

**Purpose**

Prepare KinematicIQ to compute reliability summaries from repeated local sessions and labeled validation datasets.

**Research basis**

`05_Validation...` ICC, SEM, MDC, Bland-Altman, test-retest reliability.

**Current repo state**

Baseline and history exist; no reliability calculator exists.

**Gap**

MDC thresholds are heuristic until validation data can feed reliability estimates.

**Files to inspect**

- `web/src/session/changeDetection.ts` if M32 exists
- `web/src/eval/batchEval.ts`
- `docs/validation/scientific-validation-kickoff.md`

**Files to create or modify**

- Create `web/src/eval/reliability.ts`
- Create `web/src/eval/reliability.test.ts`
- Create `docs/validation/RELIABILITY_STUDY_TEMPLATE.md`
- Create `docs/implementation/progress/M49-reliability-template.md`

**Implementation steps**

1. Implement pure helpers for mean, SD, SEM-like estimate, MDC-like estimate, and mean absolute repeat difference.
2. Accept arrays grouped by participant/session/metric.
3. Avoid full ICC unless data shape supports it; document limitations.
4. Add a study template for collecting repeated sessions.
5. Link outputs to M32 trend thresholds.

**Testing requirements**

- Known small dataset calculations.
- Missing values excluded deterministically.
- Empty/insufficient data returns nulls, not zeros.

**Acceptance criteria**

- Reliability helpers are ready for validation data without changing product claims.

**Quality gates**

```bash
cd web
npm run build
npm test
npm run test:coverage
```

**Risks**

Statistical outputs can be overinterpreted.

**Do not do**

Do not display reliability stats to normal users yet.

**Progress note**

Require the implementing agent to write `docs/implementation/progress/M49-reliability-template.md`.

### M50 — Finding rule provenance and review status

**Purpose**

Make every finding rule explain where it came from and whether it is heuristic, internally tested, expert-reviewed, or validated.

**Research basis**

`04_Coaching...` evidence strength framework; `05_Validation...` recommendation confidence.

**Current repo state**

Findings cite metric evidence and confidence, but rule provenance is implicit.

**Gap**

Users/agents cannot tell which findings are evidence-backed vs coaching heuristic.

**Files to inspect**

- `web/src/findings/squatRules.ts`
- `web/src/findings/rootCauses.ts`
- `web/src/core/finding.ts`
- `web/src/components/report/FindingCard.tsx`

**Files to create or modify**

- Modify `web/src/core/finding.ts`
- Modify `web/src/findings/squatRules.ts`
- Modify `web/src/findings/rootCauses.ts`
- Modify report card model/UI as needed
- Add tests
- Create `docs/implementation/progress/M50-finding-provenance.md`

**Implementation steps**

1. Add optional `provenance` to `Finding`: rule id, source docs, review status, last reviewed date.
2. Populate squat finding rules.
3. Populate root-cause cards with `heuristic` status.
4. Render review status in Expert or Evidence only.
5. Keep Summary uncluttered.

**Testing requirements**

- Finding construction tests.
- Squat rules include provenance.
- Root-cause cards never claim validation.

**Acceptance criteria**

- Every produced finding has a rule id and review status.

**Quality gates**

```bash
cd web
npm run build
npm test
```

**Risks**

UI may become too dense.

**Do not do**

Do not change cue ranking or thresholds.

**Progress note**

Require the implementing agent to write `docs/implementation/progress/M50-finding-provenance.md`.

### M51 — Quality review / retake screen model

**Purpose**

Insert a clear quality-review step before results when capture is questionable or invalid.

**Research basis**

`11_Product_Experience_Bible.md` quality review and recovery paths; `05_Validation...` verdict-or-abstain.

**Current repo state**

Results screen shows invalid/questionable states after analysis. There is no intermediate accept/retake quality review.

**Gap**

Users may see an abstained report only after the whole flow, instead of being guided to retake.

**Files to inspect**

- `web/src/session/setQualityGate.ts`
- `web/src/session/buildSessionResult.ts`
- `web/src/screens/ResultsScreen.tsx`
- `web/src/screens/CameraScreen.tsx`
- `web/src/screens/UploadScreen.tsx`

**Files to create or modify**

- Create `web/src/session/qualityReview.ts`
- Create `web/src/session/qualityReview.test.ts`
- Optionally create `web/src/screens/QualityReviewScreen.tsx`
- Modify routes only if implementing a screen
- Create `docs/implementation/progress/M51-quality-review.md`

**Implementation steps**

1. Build a pure model that maps `SetQualityAssessment` to `showResults`, `recommendRetake`, or `blockReport`.
2. Add retake guidance and "inspect anyway" option for analyst mode.
3. If adding a route, pass `SessionResult` through router state.
4. Keep existing ResultsScreen abstain behavior.
5. Do not discard pose tapes automatically.

**Testing requirements**

- Valid result goes to results.
- Questionable result recommends retake but allows observation view.
- Invalid result blocks movement report and shows fixes.

**Acceptance criteria**

- Recovery path is explicit.
- No report claim is shown earlier than the quality gate allows.

**Quality gates**

```bash
cd web
npm run build
npm test
```

**Risks**

Extra step can annoy users if too aggressive.

**Do not do**

Do not weaken invalid full abstain.

**Progress note**

Require the implementing agent to write `docs/implementation/progress/M51-quality-review.md`.

### M52 — Constraint-based coaching library v1

**Purpose**

Add a small library of task/environment cues tied to findings, without diagnosis or exercise prescription claims.

**Research basis**

`01_Foundations...` constraints-led recommendations; `04_Coaching...` cue generation; `11_Product...` recommendations.

**Current repo state**

Feedback cue text is generated from findings and templates.

**Gap**

Recommendations are mostly single cues, not structured constraints or progressions.

**Files to inspect**

- `web/src/feedback/feedbackTemplates.ts`
- `web/src/feedback/feedbackReasoning.ts`
- `web/src/findings/squatRules.ts`
- `web/src/components/FeedbackCard.tsx`

**Files to create or modify**

- Create `web/src/coaching/constraintsLibrary.ts`
- Create `web/src/coaching/constraintsLibrary.test.ts`
- Modify finding/cue derivation to attach constraint suggestions
- Modify UI carefully
- Create `docs/implementation/progress/M52-constraints-coaching.md`

**Implementation steps**

1. Define `ConstraintCue` with type `environment`, `task`, `attention`, or `tempo`.
2. Add squat-safe cues: stance check, tempo target, box/target depth, camera retake suggestion.
3. Tie cues to finding ids and confidence.
4. Render at most one extra cue per finding in Evidence, not Summary.
5. Keep language as "try next set", not prescription.

**Testing requirements**

- Each finding maps to zero or more safe constraint cues.
- No cue contains forbidden terms.
- Invalid/questionable reports do not show coaching constraints.

**Acceptance criteria**

- Coaching becomes more actionable while staying observation-based.

**Quality gates**

```bash
cd web
npm run build
npm test
```

**Risks**

Suggestions can drift toward rehab prescription.

**Do not do**

Do not create exercise programs or medical interventions.

**Progress note**

Require the implementing agent to write `docs/implementation/progress/M52-constraints-coaching.md`.

### M53 — Evidence table and CSV export

**Purpose**

Give expert users a clean local CSV export of metrics, confidence, validation tiers, and provenance.

**Research basis**

`11_Product...` expert workflow; `08_Software_Architecture...` export formats; `03_Metric...` reporting.

**Current repo state**

Metrics render in results; HTML/JSON report export is planned in M33.

**Gap**

No tabular export for coaches/biomechanists.

**Files to inspect**

- `web/src/screens/ResultsScreen.tsx`
- `web/src/core/metric.ts`
- `web/src/export/sessionReport.ts` if M33 exists

**Files to create or modify**

- Create `web/src/export/metricCsv.ts`
- Create `web/src/export/metricCsv.test.ts`
- Add ResultsScreen export control in Expert tab
- Create `docs/implementation/progress/M53-csv-export.md`

**Implementation steps**

1. Define stable CSV columns: protocolId, metricId, label, value, unit, confidence, validationTier, captureSource, modelVersion, filterVariant.
2. Escape CSV values correctly.
3. Include null metric values as blank with `not_readable` flag.
4. Add local download button in Expert.
5. Document no cloud upload.

**Testing requirements**

- CSV escaping test.
- Null metric test.
- Provenance columns test.

**Acceptance criteria**

- Expert users can export evidence without raw pose frames.

**Quality gates**

```bash
cd web
npm run build
npm test
```

**Risks**

CSV can be misused outside context.

**Do not do**

Do not export normative grades or composite scores.

**Progress note**

Require the implementing agent to write `docs/implementation/progress/M53-csv-export.md`.

### M54 — Accessibility and interaction audit

**Purpose**

Make capture, results, history, and export flows usable with keyboard, screen readers, high contrast, and reduced motion.

**Research basis**

`11_Product_Experience_Bible.md` accessibility; WCAG references in source doc.

**Current repo state**

Components have some aria labels and semantic structure; no dedicated accessibility test plan exists.

**Gap**

Canvas-heavy camera/replay UI can exclude users if text alternatives and focus states are weak.

**Files to inspect**

- `web/src/components/`
- `web/src/screens/`
- `web/src/index.css`
- `docs/research/11_Product_Experience_Bible.md`

**Files to create or modify**

- Create `docs/ux/ACCESSIBILITY_AUDIT.md`
- Modify CSS/components for focus states and reduced motion
- Add tests for pure components where feasible
- Create `docs/implementation/progress/M54-accessibility.md`

**Implementation steps**

1. Audit keyboard navigation for routes and buttons.
2. Add or fix visible focus states.
3. Ensure color is not the only confidence/status signal.
4. Add text alternatives for canvas-only guidance.
5. Respect `prefers-reduced-motion` for nonessential motion.
6. Document remaining browser/manual checks.

**Testing requirements**

- Component tests for tabs/buttons labels where applicable.
- Manual checklist in progress note.

**Acceptance criteria**

- Critical workflow is keyboard reachable.
- Capture instructions exist as text, not only overlay.

**Quality gates**

```bash
cd web
npm run build
npm test
```

**Risks**

Visual changes can accidentally clutter the dense UI.

**Do not do**

Do not redesign the app visually beyond accessibility fixes.

**Progress note**

Require the implementing agent to write `docs/implementation/progress/M54-accessibility.md`.

### M55 — Domain context model v1

**Purpose**

Add optional, local, non-medical context fields that can scope interpretation without making diagnosis or readiness claims.

**Research basis**

`01_Foundations...` context precedes interpretation; `07_Domain_Intelligence...` domain profiles; claims policy.

**Current repo state**

Session results do not capture user goal, load, pain, fatigue, sport, or environment. Claims policy forbids medical use.

**Gap**

Findings cannot be conditioned by declared task context, and future domain modules lack a safe context model.

**Files to inspect**

- `web/src/session/types.ts`
- `web/src/storage/sessionStore.ts`
- `web/src/screens/CameraScreen.tsx`
- `web/src/screens/ResultsScreen.tsx`

**Files to create or modify**

- Create `web/src/domain/context.ts`
- Create `web/src/domain/context.test.ts`
- Add optional context to session artifact/storage
- Add minimal local UI only if low-risk
- Create `docs/implementation/progress/M55-domain-context.md`

**Implementation steps**

1. Define `AssessmentContext` with optional goal, equipment/load descriptor, environment, user note, and self-reported discomfort as a note only.
2. Ensure discomfort note cannot trigger medical advice.
3. Store context locally with session if provided.
4. Use context only for display/provenance in v1.
5. Add copy explaining context changes interpretation but is not diagnosis.

**Testing requirements**

- Context serializes/deserializes.
- Forbidden medical fields are absent.
- No finding changes based on discomfort note in v1.

**Acceptance criteria**

- Context model exists and is safe.

**Quality gates**

```bash
cd web
npm run build
npm test
```

**Risks**

Pain/discomfort fields can imply clinical reasoning.

**Do not do**

Do not generate medical recommendations from context.

**Progress note**

Require the implementing agent to write `docs/implementation/progress/M55-domain-context.md`.

### M56 — Design system extraction v1

**Purpose**

Stabilize common UI primitives so future protocol screens stay consistent and accessible.

**Research basis**

`11_Product_Experience_Bible.md` design system and dense operational UI.

**Current repo state**

`Button`, `Card`, `ConfidenceBadge`, tabs, report cards, and CSS exist, but many styles live in `index.css`.

**Gap**

New protocol UI risks duplicating styles or creating inconsistent states.

**Files to inspect**

- `web/src/components/Button.tsx`
- `web/src/components/Card.tsx`
- `web/src/components/ConfidenceBadge.tsx`
- `web/src/components/report/`
- `web/src/index.css`

**Files to create or modify**

- Create `web/src/components/ui/` only if helpful
- Create `docs/ux/DESIGN_SYSTEM.md`
- Modify `index.css` for named tokens/classes
- Add small component tests
- Create `docs/implementation/progress/M56-design-system.md`

**Implementation steps**

1. Inventory existing reusable controls.
2. Document tokens: color semantics, spacing, focus, typography, confidence states.
3. Extract only duplicated UI patterns used in at least two places.
4. Add disabled/loading/focus states where missing.
5. Keep visual changes restrained.

**Testing requirements**

- Component render tests for extracted components.
- No route build regressions.

**Acceptance criteria**

- New protocol screens can reuse documented primitives.

**Quality gates**

```bash
cd web
npm run build
npm test
```

**Risks**

Design-system work can become a broad refactor.

**Do not do**

Do not create a landing-page redesign or nested card-heavy UI.

**Progress note**

Require the implementing agent to write `docs/implementation/progress/M56-design-system.md`.

### M57 — Domain module backlog and validation gates

**Purpose**

Create a safe backlog for sports, functional, and future clinical-adjacent modules with explicit evidence gates.

**Research basis**

`07_Domain_Intelligence_Spec.md`; `10_Future...`; claims policy.

**Current repo state**

Domain ideas exist in research and strategy docs but are not operationalized.

**Gap**

Future agents may implement attractive domain features before evidence and guardrails exist.

**Files to inspect**

- `docs/research/07_Domain_Intelligence_Spec.md`
- `docs/research/10_Future_of_Movement_Intelligence_Roadmap.md`
- `docs/doctrine/claims-policy.md`
- `docs/doctrine/deferred-scope.md`

**Files to create or modify**

- Create `docs/domain/DOMAIN_MODULE_BACKLOG.md`
- Modify `docs/doctrine/deferred-scope.md`
- Create `docs/implementation/progress/M57-domain-backlog.md`

**Implementation steps**

1. List candidate modules: training squat/hinge/jump, functional sit-to-stand, balance screen, sprint mechanics, throw/reach future modules.
2. Add required data, validation, product surface, and forbidden claims for each.
3. Classify as `now`, `next`, `research`, `deferred`, or `rejected`.
4. Add gates for any clinical-adjacent module.
5. Link to traceability.

**Testing requirements**

- Docs-only; run build and tests.

**Acceptance criteria**

- Domain expansion has a governed backlog.

**Quality gates**

```bash
cd web
npm run build
npm test
```

**Risks**

Backlog can look like commitment to build everything.

**Do not do**

Do not implement modules in this milestone.

**Progress note**

Require the implementing agent to write `docs/implementation/progress/M57-domain-backlog.md`.

### M58 — Safe functional assessment track

**Purpose**

Define non-clinical functional assessment product boundaries before adding more functional protocols.

**Research basis**

`07_Domain_Intelligence_Spec.md` functional assessment modules; `05_Validation...` medical boundaries.

**Current repo state**

Sit-to-stand may be added in M28, but clinical framing is prohibited.

**Gap**

No dedicated boundary doc for functional assessments.

**Files to inspect**

- `docs/domain/DOMAIN_MODULE_BACKLOG.md`
- `docs/doctrine/claims-policy.md`
- `web/src/protocols/sitToStand/` if M28 exists

**Files to create or modify**

- Create `docs/domain/FUNCTIONAL_ASSESSMENT_BOUNDARIES.md`
- Add tests only if code copy exists
- Create `docs/implementation/progress/M58-functional-boundaries.md`

**Implementation steps**

1. Define allowed terms: functional movement observation, completion, timing, consistency.
2. Define forbidden terms: diagnosis, fall risk, frailty, impairment, return-to-play, clinical score.
3. Define validation gates for any normative comparison.
4. Link sit-to-stand protocol copy to this boundary.
5. Add a checklist future protocols must pass.

**Testing requirements**

- Docs-only unless protocol copy changed; run build and tests.

**Acceptance criteria**

- Functional protocols have written safety boundaries.

**Quality gates**

```bash
cd web
npm run build
npm test
```

**Risks**

Boundary doc can be ignored unless linked from protocol work.

**Do not do**

Do not add normative tables.

**Progress note**

Require the implementing agent to write `docs/implementation/progress/M58-functional-boundaries.md`.

### M59 — Future R&D backlog ledger

**Purpose**

Separate future research bets from product roadmap work so speculative concepts do not leak into implementation.

**Research basis**

`10_Future_of_Movement_Intelligence_Roadmap.md`.

**Current repo state**

Deferred scope ledger exists, but long-horizon research ideas are spread across docs.

**Gap**

No single living backlog for embeddings, sensor fusion, digital humans, prediction, OpenSim, and foundation models.

**Files to inspect**

- `docs/research/10_Future_of_Movement_Intelligence_Roadmap.md`
- `docs/doctrine/deferred-scope.md`
- `docs/research/INDEX.md`

**Files to create or modify**

- Create `docs/research/FUTURE_R_AND_D_BACKLOG.md`
- Modify `docs/doctrine/deferred-scope.md`
- Create `docs/implementation/progress/M59-future-rd-ledger.md`

**Implementation steps**

1. List each future idea with readiness: proven, emerging, speculative.
2. Add "gate to reconsider" for each.
3. Mark items that are permanently rejected for current product claims.
4. Link to deferred-scope ledger.
5. Include owner decision points for future scope changes.

**Testing requirements**

- Docs-only; run build and tests.

**Acceptance criteria**

- Future ideas are visible without becoming current scope.

**Quality gates**

```bash
cd web
npm run build
npm test
```

**Risks**

The backlog may invite premature work.

**Do not do**

Do not implement future R&D features.

**Progress note**

Require the implementing agent to write `docs/implementation/progress/M59-future-rd-ledger.md`.

### M60 — Master roadmap refresh and next execution package

**Purpose**

Close this roadmap wave by updating the master roadmap with actual results and producing the next actionable package.

**Research basis**

`08_Software_Architecture...` lifecycle documentation; all source docs.

**Current repo state**

This file will be the master roadmap; it will drift as milestones execute.

**Gap**

Future agents need a current execution order, completed/blocked ledger, and remaining scope.

**Files to inspect**

- `docs/implementation/KINEMATICIQ_MASTER_EXECUTION_ROADMAP.md`
- `docs/implementation/progress/`
- `docs/implementation/RESEARCH_TO_CODE_TRACEABILITY.md`
- `docs/adr/`

**Files to create or modify**

- Modify this roadmap
- Create `docs/implementation/progress/M60-roadmap-refresh.md`
- Optionally create `docs/implementation/NEXT_EXECUTION_PACKAGE.md`

**Implementation steps**

1. Mark completed milestones and blocked items.
2. Update current repo audit and test counts.
3. Update deferred/rejected ledger.
4. Update traceability links.
5. Create the next execution package for remaining work.

**Testing requirements**

- Docs-only; run build and tests.

**Acceptance criteria**

- The roadmap remains trustworthy after execution.

**Quality gates**

```bash
cd web
npm run build
npm test
```

**Risks**

Roadmap updates can become vague if not tied to commits and files.

**Do not do**

Do not rewrite history or remove completed progress notes.

**Progress note**

Require the implementing agent to write `docs/implementation/progress/M60-roadmap-refresh.md`.

## 7. Research-To-Code Traceability Plan

Create and maintain these artifacts:

| Artifact | Purpose | First milestone |
|---|---|---|
| `docs/research/README.md` | Existing source spec index | Existing, refine in M35 |
| `docs/research/INDEX.md` | Detailed source concept index | M35 |
| `docs/implementation/RESEARCH_TO_CODE_TRACEABILITY.md` | Source docs -> concepts -> files -> milestones -> status | M36 |
| `docs/adr/` | Durable architecture decisions | M37 |
| `docs/validation/METRIC_VALIDATION_STATUS.md` | Metric tier/status board | M48 |
| `docs/domain/DOMAIN_MODULE_BACKLOG.md` | Safe domain expansion governance | M57 |
| `docs/research/FUTURE_R_AND_D_BACKLOG.md` | Long-horizon R&D separation | M59 |

Minimum traceability table columns:

| Research doc | Concept | Source file(s) | Milestone(s) | Status | Validation tier | Notes |
|---|---|---|---|---|---|---|

Status values:

- `implemented`
- `partial`
- `planned`
- `deferred`
- `rejected`
- `needs-research`

Every future implementation milestone must update traceability if it creates, modifies, defers, or rejects a research concept.

## 8. Safety And Claims Policy

Safety rules for every milestone:

- Browser-only unless a later explicit scope change is approved.
- No backend, auth, cloud storage, or account system in near-term roadmap.
- No medical diagnosis.
- No injury prediction or injury-risk score.
- No return-to-play/readiness judgment.
- No fake precision.
- No unsupported force, torque, power, load, joint stress, or muscle activation claims from single RGB.
- No composite "perfect movement" or 0-100 quality score.
- No pose-model swap without replay-harness benchmarking.
- No 3D avatar arms race before validated interpretation.
- Keep squat working after every milestone.

Allowed language:

- "appears"
- "suggests"
- "from this camera angle"
- "in this set"
- "camera-based observation"
- "confidence was low/medium/high"
- "not readable"
- "possible contributor, not a diagnosis"

Forbidden product language:

- diagnosis, abnormal, pathological, damaged
- injury risk, likely injury, predicts injury
- weak glutes, muscle activation, tissue state
- measured force, measured torque, joint load from video
- return to play, readiness to play
- clinical score, fall risk, frailty unless future regulated/validated scope exists

## 9. Deferred / Rejected Ideas Ledger

| Idea | Decision | Reason | Reconsideration gate |
|---|---|---|---|
| Composite movement quality score | Rejected permanently | Hides multidimensional evidence and uncertainty | Never in current doctrine |
| Injury prediction | Rejected for product | Requires prospective validation and medical/regulatory scope | Dedicated validated medical/research track |
| Medical diagnosis | Rejected | Not a medical device | Regulatory pathway and clinical validation |
| Force/torque/joint load from RGB | Rejected | Not defensible from single RGB | Instrumented capture and validation |
| MediaPipe model swap | Deferred | Would invalidate tapes and metrics | Benchmark superiority on labeled corpus |
| SMPL/digital humans | Deferred | Presentation complexity before interpretation value | Post-validation R&D decision |
| OpenSim/IK/inverse dynamics | Deferred | Needs calibrated/instrumented data | Multi-modal validation |
| Wearables/IMU fusion | Deferred | Violates near-term browser-only/single-camera scope | Sensor architecture scope change |
| Backend/accounts/cloud sync | Deferred | Near-term local-first constraint | Security/privacy/backend roadmap |
| FHIR/EHR integrations | Deferred | Clinical/enterprise scope | Regulatory and enterprise roadmap |
| Embeddings/foundation movement model | Deferred | Requires data moat and research program | Dedicated R&D track |
| Normative population comparisons | Deferred | Needs population-specific validation | Dataset, reliability, bias evaluation |
| Avatar-first UI | Deferred | Risk of spectacle over trust | Validated interpretation need |

## 10. Testing And Validation Strategy

Required gates for every milestone:

```bash
cd web
npm run build
npm test
```

Use coverage when touching analysis, cv, session, eval, protocol runtime, metric emission, or test configuration:

```bash
cd web
npm run test:coverage
```

Validation layers:

1. Unit tests for pure math, quality, metric, finding, and workflow helpers.
2. Integration tests for session result construction and report gating.
3. Replay tests for live/upload parity and synthetic pose tapes.
4. Batch eval against local real tapes when available.
5. Benchmark report before accepting filter, gate, or model changes.
6. Copy-policy tests for safety-sensitive user-facing strings.
7. Manual browser walkthrough for camera, upload, results, history, and exports when UI changes.

Fresh clone caveat:

- Real pose tapes are gitignored for privacy.
- Tests that depend on `eval-tapes/live-session-2026-07-05.posetape.json` skip if absent.
- M44 must make this explicit with a manifest and clearer test output.

## 11. Final Recommended Execution Order

This order is the current best critical path, not a frozen queue. After every milestone, run the Chief Architect Review Loop in Section 5E, then update this order if the live codebase, validation evidence, dependency graph, or research assumptions changed.

1. Finish M25-M27 before changing protocol runtime: capture quality and landmark confidence are foundational.
2. Finish M28-M30 only when each protocol can stay honest; blocked stubs are better than fake movement reports.
3. Finish M32-M34 to close the current roadmap wave and update docs.
4. Execute M35-M38 before deeper architecture work, so research and claims guardrails are traceable.
5. Execute M39-M43 to unlock safe protocol runtime generalization.
6. Execute M44-M49 before any major model/filter/gate changes.
7. Execute M50-M56 to make the product more trustworthy and usable.
8. Execute M57-M60 to govern future domain expansion and refresh the roadmap.

The guiding rule: every milestone must leave squat working, preserve verdict-or-abstain, preserve pose-tape replayability, and improve traceability between research, code, validation, and product claims.
