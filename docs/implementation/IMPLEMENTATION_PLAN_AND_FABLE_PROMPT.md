# KinematicIQ — Implementation Plan & Master Fable Prompt

Generated 2026-07-05 from a live audit of the repo (`master`, all 180 tests green) and a skim of the 11 research/spec MDs. This is the single source for turning the current squat analyzer into a protocol-driven movement-intelligence platform, milestone by milestone.

---

## A. Current Architecture Review (grounded, as-found)

### Layout

- **App root is `web/`** — Vite 5 + React 18 + TypeScript 5.6 + `react-router-dom` 7 + `@mediapipe/tasks-vision` 0.10 + `three`/`@react-three/fiber`/`@react-three/drei`.
- Repo-root `src/` (`api/ core/ models/ services/ utils/`) and root `tests/` contain **only `.gitkeep` placeholders** — legacy scaffold, not used. All real code lives in `web/src/`.
- `docs/` already holds substantial doctrine: `docs/strategy/` (product-thesis, movement-expansion, execution-roadmap, safety-claims, report-design, posture-metric-model, validation-strategy), `docs/validation/` (session-log.md with numbered findings, scientific-validation-kickoff), plus numbered research docs (`24_movement_ontology.md`, `25_capture_protocol_front_squat.md`, etc.).
- `eval-tapes/` holds a real captured pose tape (`live-session-2026-07-05.posetape.json`).

### Commands (verified)

All run from `C:\Users\acetu\KinematicIQ\web`:

| Purpose | Command | Notes |
|---|---|---|
| Install | `npm install` | `package-lock.json` present |
| Build | `npm run build` | `tsc && vite build` — typecheck is part of the build gate |
| Test | `npm test` | `vitest run`; **30 files / 180 tests, all passing** as of this audit |
| Coverage | `npm run test:coverage` | v8; thresholds 80% lines/functions/branches scoped to `src/cv/**` only |
| Dev | `npm run dev` | Vite, COOP/COEP headers set for MediaPipe WASM |

There is **no lint script** — the build's `tsc` pass is the only static gate.

### Module map (`web/src/`)

| Folder | Responsibility |
|---|---|
| `cv/` | MediaPipe pose engine (`poseEngine.ts`), `captureGuidance.ts` (Kinect-style live setup guidance), `landmarkFilter.ts` (One-Euro + Butterworth), `pose3d.ts`, skeleton/debug drawing, `videoFrameSource.ts`, `types.ts` (`PoseFrame`, `RepMetrics`, `LANDMARK_INDICES`) |
| `analysis/` | `angles`, `geometry`, `phaseDetector` (STANDING/DESCENDING/BOTTOM FSM), `repCounter` (+ rejection ledger with diagnostics), `autoStart`/`autoFinish`/`setActivation`, `metricCollector`, `stats`, `frameTrace`, `videoAnalyzer` (`runPipelineOnFrames` — the shared live/replay pipeline) |
| `analysis/movement/` | **`MovementProfile` abstraction already exists**: `types.ts` (profile = config bundle: phase/repGate/autoStart/autoFinish/activation/scoring/concepts/feedback builder; `MovementKind = cyclic \| ballistic \| gait`), `registry.ts` (squat only; throws for unregistered), `profiles/squat.ts` |
| `analysis/posture/` | Posture concepts, per-frame posture reads, smoothness, posture set summary |
| `scoring/` | `scoringConfig/Engine/Explanations` — produces per-component evidence (`ComponentScores`: depth, trunkControl, kneeTracking, consistency, symmetry). **Deliberately no composite 0–100** (ontology §6 #15) |
| `feedback/` | `confidenceCalculator`, `feedbackEngine`, `feedbackReasoning`, `feedbackTemplates` — cues carry observed/whyItMatters/tryNext/confidence/confidenceNote |
| `session/` | `types.ts` (`SessionResult`, `SetMetricsSummary`, `CoachingCue`, `ConfidenceLevel`, `SessionBaseline` seam), `buildSessionResult.ts`, **`setQualityGate.ts` — valid/questionable/invalid report verdict with FULL ABSTAIN on invalid** (reasons, capture fixes, untrusted reps) |
| `eval/` | **Tape replay eval harness**: `poseTape.ts`, `replayHarness.ts` (runs tape through raw/oneEuro/butterworth variants via the same `runPipelineOnFrames`), `replayParity.test.ts` (live-parity), `tapeStore.ts`, `downloadTape.ts`, `metrics.ts` |
| `screens/` | `LandingScreen`, `CameraScreen` (+ `cameraSessionUi`, `repRejectionUi`), `UploadScreen`, `ResultsScreen`; routes `/`, `/camera`, `/upload`, `/results` in `App.tsx` |
| `components/` | `report/verdictEvidence`, `replay/` (SessionReplay + replay model), `PoseScene3D` (3D inspection), `ConfidenceBadge`, `DisclaimerBanner`, `FeedbackCard`, `SessionStatusCard`, `RepTimeline`, `landing/` squat demos |
| `test/` | `squatFixtures`, `squatSimulation`, `helpers/squatPipeline`, `helpers/liveSessionSim`, `fixtures/poseFixtures` |

### What already matches the vision (do NOT rebuild)

- **Movement/protocol seam exists**: `MovementProfile` + registry treats a movement as configuration, not a forked pipeline. This is the embryo of the protocol engine — extend it, don't replace it.
- **Verdict-or-abstain**: `setQualityGate.ts` classifies whole reports valid/questionable/invalid and fully abstains on invalid. This IS the Validation Handbook's confidence framework, at v1.
- **Confidence everywhere**: `ConfidenceLevel` on session and per-cue; cue confidence gated by claim data (commit `4df8ad4`).
- **Non-overclaiming language**: commit `a57131f` removed lab-grade claims/muscle attribution; `DisclaimerBanner`, "observation language only" comments in the quality gate.
- **Eval/benchmark harness**: pose tapes with provenance + replay harness with live parity tests — this is the Validation Handbook's benchmarking loop, already running.
- **Capture guidance**: dynamic Kinect-style guidance + camera HUD already shipped (commit `6b2e521`).
- **No composite score**: `SessionResult.scoring` is per-component evidence only, with explicit comments forbidding a 0–100 total.

### Squat-specific coupling (the actual refactor surface)

- `registry.ts` → `getActiveProfile()` hardcodes `SQUAT_PROFILE`; no movement selection anywhere.
- `session/types.ts` → `SetMetricsSummary` field names are squat metrics (`avgDepth`, `avgTrunkLean`, `avgKneeAsymmetry`); `ComponentScores` is a fixed 5-key squat shape. Any protocol engine needs a keyed/dynamic metric map instead.
- `scoring/scoringConfig.ts` thresholds, `feedback/feedbackTemplates.ts` copy, and `analysis/phaseDetector`/`repCounter` defaults are squat-tuned (profile already injects most of them — good).
- `screens/ResultsScreen.tsx` and report components render the squat metric fields directly.
- `test/squat*` fixtures and `landing/` demo components are squat-only (fine — squat stays the flagship protocol).

### What NOT to refactor yet

- The rep-counting gates and phase FSM thresholds — `setQualityGate.ts` explicitly leaves findings #5/#6 open pending labeled data. Don't "fix" segmentation as a side effect of protocol work.
- The MediaPipe engine (`cv/poseEngine.ts`) — no model swap (RTMPose etc.) without the replay-harness benchmark demanded by the CV spec.
- The eval/tape format — it's the audit trail; only extend additively (versioned fields).
- The 3D/replay/demo layer (commit `91f7129`) — cosmetic churn now would burn budget with no protocol payoff.

### Repo hygiene note

Working tree has untracked agent-tooling files (`.agent/`, `.claude/`, `.cursor/`, `bootstrap.ps1`, `START-HERE.txt`, etc.) and `master` is 1 commit ahead of `origin/master`. Fable must scope every `git add` to explicit paths and never `git add -A`.

---

## B. MD → Milestone Mapping

| # | Document | Engineering constructs it implies | Feeds milestones |
|---|---|---|---|
| 1 | `Research_01_Foundations_of_Human_Movement_Report.md` | Universal movement ontology, movement primitives/phases hierarchy, movement-agnostic vs -specific split, "quality scores fail when oversimplified" | M1, M3, M5, M10 |
| 2 | `KinematicIQ_Mathematical_Algorithmic_Biomechanics_Spec.md` | Joint-angle math, signal filtering, motion segmentation FSMs, confidence/uncertainty propagation, v1 implementation recipe | M3, M5, M6 (validates existing `analysis/` math; mostly confirms) |
| 3 | `KinematicIQ_metric_engine_spec.md` | Universal metric ontology, `MetricResult`+confidence types, metric relationships, "metrics not defensible from single RGB" exclusion list, scoring philosophy (no composite) | M3, M6, M7 |
| 4 | `KinematicIQ_Coaching_Intelligence_Engine_Spec.md` | Evidence-strength framework, metrics→meaning reasoning pipeline, root-cause concept cards, cue generation, explainable-AI, TypeScript decision architecture | M7, M8 |
| 5 | `KinematicIQ_Validation_Reliability_and_Scientific_Benchmarking_Handbook.md` | Validation tiers, benchmark harness, dataset design, confidence framework, continuous QA | M1, M2 (existing `eval/` harness folds in), M3 (validation-tier field), M11 |
| 6 | `KinematicIQ_CV_Subsystem_Technical_Spec.md` | Capture/landmark quality scoring, camera geometry checks, robust tracking, model-swap benchmarking discipline | M4, M2 (benchmark gate), deferred: model swaps |
| 7 | `KinematicIQ_Research_07_Domain_Intelligence_Spec.md` | Domain profiles (sport/clinical), functional assessment modules, guardrails (no injury prediction, no diagnosis) | M1 (guardrails), M10 (protocol stubs); clinical features deferred |
| 8 | `KinematicIQ_Software_Architecture_and_Engineering_Specification.md` | Module/plugin contracts, protocol engine, domain model, data flow/versioning, testing strategy, ADR template | M0, M3, M5, M6, M9 |
| 9 | `KinematicIQ_Competitive_Intelligence_and_Product_Strategy.md` | Positioning ("honest evidence-first analyzer"), feature-gap priorities, what not to clone | M1 (doctrine), informs milestone ordering; no direct code |
| 10 | `KinematicIQ_Future_of_Movement_Intelligence_Roadmap.md` | Long-horizon bets (embeddings, foundation model, digital humans, sensor fusion) + explicit "do not build yet" list | M1, M11 (roadmap doc); everything else deferred |
| 11 | `KinematicIQ_Product_Experience_Bible.md` | Capture readiness UX, progressive disclosure (Summary/Evidence/Expert), finding cards, design tokens, anti-patterns | M4, M8, M9 |

---

## C. The Master Fable Prompt

Copy everything inside the fence below into Fable, verbatim.

````text
You are the lead engineer on KinematicIQ. Work autonomously, milestone by milestone, until every milestone below is done. Do not ask for permission between milestones.

## Repo & environment
- Repo: C:\Users\acetu\KinematicIQ  (branch: master, remote: https://github.com/Born2tweak/KinematicIQ.git)
- The app lives in web\ (Vite + React 18 + TypeScript). Root-level src\ and tests\ are empty .gitkeep scaffolds — IGNORE them, never put code there.
- Commands (always run from C:\Users\acetu\KinematicIQ\web):
  - Install:  npm install
  - Build:    npm run build        (runs `tsc && vite build` — typecheck included)
  - Test:     npm test             (vitest run; baseline: 30 files / 180 tests, all green)
- There is no lint script; the tsc step in build is the static gate.
- The working tree contains untracked agent-tooling files (.agent/, .claude/, .cursor/, bootstrap.ps1, START-HERE.txt, INSTALL-NOW.cmd, JULES_REPORT.md, etc.). NEVER `git add -A` or `git add .` — always stage explicit paths you created or edited. Never push.

## Mission
Evolve KinematicIQ from a squat-only analyzer into a protocol-driven movement-intelligence platform. Squat becomes the FIRST protocol inside a protocol engine — do not preserve squat-only structures where they block generalization, but keep squat fully working at every milestone.

## Hard constraints (violating any of these is failure)
1. Browser-only. No backend, auth, cloud, or server storage. Local persistence (localStorage/IndexedDB) only where a milestone says so.
2. No medical diagnosis, no injury prediction, no "injury risk" scores. Observation language only.
3. No composite 0–100 "movement quality" score, ever. Per-metric evidence + confidence only (this is already codified in web\src\session\types.ts — keep it).
4. Do not replace or remove MediaPipe (web\src\cv\poseEngine.ts). Model swaps require a replay-harness benchmark first; that is out of scope.
5. Do not build enterprise features, 3D avatars (SMPL/digital humans), wearable/sensor fusion, OpenSim, FHIR, or embeddings. Defer all of it.
6. Do not retune the rep-counting gates or phase-detector thresholds (web\src\analysis\repCounter.ts, phaseDetector.ts). Validation findings #5/#6 in docs\validation\session-log.md are intentionally open pending labeled data.
7. Do not modify the pose-tape format (web\src\eval\poseTape.ts) except additively with a version bump — tapes in eval-tapes\ must stay replayable.
8. Preserve existing honest-reporting behavior: the quality gate's full abstain (web\src\session\setQualityGate.ts), confidence gating of cues, and DisclaimerBanner copy.

## What already exists — build on it, don't duplicate it
- web\src\analysis\movement\{types.ts,registry.ts,profiles\squat.ts}: a MovementProfile registry (movement = configuration, not a fork). This is the seed of the protocol engine.
- web\src\session\setQualityGate.ts: valid/questionable/invalid report verdict with full abstain.
- web\src\eval\: pose-tape replay harness with live-parity tests — this is the benchmarking foundation; extend it, never fork the pipeline (it reuses runPipelineOnFrames from web\src\analysis\videoAnalyzer.ts).
- web\src\cv\captureGuidance.ts: live capture guidance; upgrade it in M4 rather than rewriting.
- docs\strategy\ and docs\validation\: existing doctrine — new docs must cite and stay consistent with them.

## Source specs (read the relevant ones at the start of each milestone)
1.  c:\Users\acetu\Documents\Codex\2026-07-05\do\outputs\Research_01_Foundations_of_Human_Movement_Report.md
2.  c:\Users\acetu\Documents\Codex\2026-07-05\ru\outputs\KinematicIQ_Mathematical_Algorithmic_Biomechanics_Spec.md
3.  c:\Users\acetu\Documents\Codex\2026-07-05\r\outputs\KinematicIQ_metric_engine_spec.md
4.  c:\Users\acetu\Documents\Codex\2026-07-05\ru-3\outputs\KinematicIQ_Coaching_Intelligence_Engine_Spec.md
5.  c:\Users\acetu\Documents\Codex\2026-07-05\run\outputs\KinematicIQ_Validation_Reliability_and_Scientific_Benchmarking_Handbook.md
6.  c:\Users\acetu\Documents\Codex\2026-07-05\ru-2\outputs\KinematicIQ_CV_Subsystem_Technical_Spec.md
7.  c:\Users\acetu\Documents\Codex\2026-07-05\run-2\outputs\KinematicIQ_Research_07_Domain_Intelligence_Spec.md
8.  c:\Users\acetu\Documents\Codex\2026-07-05\ru-4\outputs\KinematicIQ_Software_Architecture_and_Engineering_Specification.md
9.  c:\Users\acetu\Documents\Codex\2026-07-05\ru-5\outputs\KinematicIQ_Competitive_Intelligence_and_Product_Strategy.md
10. c:\Users\acetu\Documents\Codex\2026-07-05\run-3\outputs\KinematicIQ_Future_of_Movement_Intelligence_Roadmap.md
11. c:\Users\acetu\Documents\Codex\2026-07-05\run-4\outputs\KinematicIQ_Product_Experience_Bible.md
If a spec conflicts with the constraints above or with existing validation findings, the constraints and findings win; log the conflict in the milestone progress note.

## Working protocol (repeat for EVERY milestone)
1. Read the milestone's entry in docs\implementation\IMPLEMENTATION_PLAN_AND_FABLE_PROMPT.md (section D) and the mapped spec docs.
2. Implement it. New platform code goes under web\src\ in the folders named by the playbook. Add/extend Vitest tests for everything you add (colocated *.test.ts, matching the existing style).
3. Gate: from web\ run `npm install` (first milestone only, or if deps changed), then `npm run build`, then `npm test`. ALL must pass with zero TypeScript errors and zero test failures. If red, fix and rerun. Never proceed or commit while red.
4. Write a progress note to docs\implementation\progress\M<NN>-<slug>.md: what changed, files touched, test counts before/after, decisions/conflicts, anything deferred.
5. Commit ONLY when green: stage the explicit files you touched, commit message `feat(m<NN>): <summary>` (or docs()/test() as appropriate), matching existing conventional-commit style. One commit per milestone (plus fix-up commits if a later milestone reveals a defect). Do not push.
6. Move to the next milestone. If a milestone is genuinely blocked, write the blocker in its progress note, skip it, and continue with milestones that don't depend on it; revisit at the end.

## Milestones (execute in order; full play-by-play in section D of docs\implementation\IMPLEMENTATION_PLAN_AND_FABLE_PROMPT.md)
- M0  Repo audit & integration map (docs only — verify the playbook against the live tree, write docs\implementation\progress\M00-audit.md)
- M1  Doctrine docs (docs\doctrine\: ontology, claims policy, deferred-scope ledger — reconciled with docs\strategy\)
- M2  Testing & benchmark foundation (raise coverage scope, tape fixtures as regression suite, fold in existing eval\ harness)
- M3  Core schemas: web\src\core\ — Confidence, Provenance, MetricResult, ProtocolDefinition, Finding types (types + tests only, no behavior change)
- M4  Capture readiness v1 (upgrade cv\captureGuidance.ts into a scored readiness model + pre-capture checklist UX)
- M5  Protocol engine v1 (generalize analysis\movement\ into web\src\protocols\; squat is protocol #1; ResultsScreen unchanged behavior)
- M6  Metric registry v1 (metric definitions with id/units/confidence/validation-tier; adapt metricCollector output into MetricResult[])
- M7  Finding engine v1 (rules that turn MetricResults into Findings with evidence + confidence; feedbackEngine consumes findings)
- M8  Results UX v1 (Summary / Evidence / Expert progressive-disclosure tabs, finding cards; keep quality-gate abstain behavior)
- M9  Local session history (IndexedDB via a small wrapper; session list + trends; no accounts, no cloud)
- M10 Protocol expansion stubs (hipHinge/jump/sprint ProtocolDefinitions that throw "not implemented" with honest UI copy)
- M11 Docs sync (update README.md, docs\07_architecture.md, doctrine, deferred ledger; final progress summary)

## Definition of done
All milestones complete (or explicitly logged as blocked), `npm run build` and `npm test` green from web\, squat analysis works end-to-end at least as well as baseline (verify via the replay-parity tests and eval-tapes\ tape), one commit per milestone on master, nothing pushed, and docs\implementation\progress\ contains a note per milestone.
````

---

## D. Milestone Playbook (play-by-play)

Conventions: paths are relative to repo root; "gate" always means `npm run build` && `npm test` from `web\`, green before commit.

### M0 — Repo audit & integration map
- **Goal:** Fable independently verifies this plan against the live tree and records deltas, so later milestones don't act on stale assumptions.
- **Files:** create `docs/implementation/progress/M00-audit.md` only. No source changes.
- **Do:** enumerate `web/src` modules; confirm the squat-coupling list in section A; confirm test count baseline; list any drift from this document.
- **Accept:** audit note exists; explicitly confirms or corrects the section-A coupling map.
- **Gate:** build+test (should be trivially green — this proves the baseline).

### M1 — Doctrine docs
- **Goal:** Codify the non-negotiables so later code reviews have a written standard.
- **Files:** create `docs/doctrine/movement-ontology.md` (distilled from MD #1 Part 6 + existing `docs/24_movement_ontology.md`), `docs/doctrine/claims-policy.md` (from MD #5 Part 9, MD #7 guardrails, existing `docs/strategy/safety-claims.md`), `docs/doctrine/deferred-scope.md` (from MD #10 "What KinematicIQ Should Not Build": RTMPose swap, SMPL, OpenSim, FHIR, wearables, enterprise, embeddings).
- **Accept:** each doc ≤ ~2 pages, cites its source MDs, and cross-references (not contradicts) `docs/strategy/product-thesis.md`.
- **Gate:** build+test (docs-only, still run it).

### M2 — Testing & benchmark foundation
- **Goal:** Make the existing eval harness the official regression net before refactors begin.
- **Files:** modify `web/vite.config.ts` (extend coverage `include` beyond `src/cv/**` to at least `src/analysis/**`, `src/session/**`; keep thresholds achievable — measure first); add `web/src/eval/tapeRegression.test.ts` that replays `eval-tapes/live-session-2026-07-05.posetape.json` (copy it into `web/src/test/fixtures/` or load via fs in the test) and snapshots rep count, quality verdict, and bottom frames.
- **Accept:** tape regression test locks current pipeline behavior; coverage runs clean; existing `replayParity.test.ts` untouched and green.
- **Gate:** build+test (+ `npm run test:coverage` must pass its thresholds).

### M3 — Core schemas
- **Goal:** The shared type vocabulary for everything after (from MD #3 §1–2, MD #8 §3/§5, MD #5 Part 6).
- **Files:** create `web/src/core/confidence.ts` (confidence value + basis/provenance), `web/src/core/provenance.ts` (capture source, model version, filter variant, tape id), `web/src/core/metric.ts` (`MetricDefinition`, `MetricResult` with value/units/confidence/validationTier — tiers from the Validation Handbook), `web/src/core/protocol.ts` (`ProtocolDefinition`: id, label, kind, phases, requiredLandmarks, metrics, findingsRules — designed as a superset of the existing `MovementProfile`), `web/src/core/finding.ts` (`Finding`: id, statement in observation language, evidence: MetricResult refs, confidence, severity-as-priority NOT risk), plus colocated `*.test.ts` for each.
- **Types-only milestone:** no existing module changes behavior; existing `session/types.ts` stays as-is for now.
- **Accept:** all new types compile, tests cover construction + narrowing; no `any`; no runtime coupling into screens yet.
- **Gate:** build+test.

### M4 — Capture readiness v1
- **Goal:** Turn capture guidance into a scored readiness model (MD #6 capture quality, MD #11 §4 capture experience).
- **Files:** create `web/src/cv/captureReadiness.ts` (+test): consumes existing `captureGuidance` signals + landmark visibility into a readiness state (`ready | marginal | notReady`, with reasons and fixes — mirror the `SetQualityAssessment` shape); modify `web/src/screens/CameraScreen.tsx` and `web/src/screens/cameraSessionUi.ts` to show a pre-capture readiness checklist and gate auto-start messaging on it. Do NOT change `autoStart` thresholds themselves.
- **Accept:** readiness unit-tested against synthetic landmark fixtures (`web/src/test/fixtures/poseFixtures.ts`); camera flow still records; capture guidance behavior preserved for the in-set HUD.
- **Gate:** build+test.

### M5 — Protocol engine v1 (squat as first protocol)
- **Goal:** Generalize `analysis/movement/` into a protocol engine; squat becomes `protocols/squat/`.
- **Files:** create `web/src/protocols/types.ts` (re-export/extend `core/protocol.ts`), `web/src/protocols/registry.ts` (typed registry + `getProtocol(id)`, `listProtocols()`, active-protocol selection with squat default), `web/src/protocols/squat/index.ts` (wraps/absorbs `analysis/movement/profiles/squat.ts`); modify `web/src/analysis/movement/registry.ts` to delegate to the new registry (or migrate call sites in `videoAnalyzer.ts`, `setActivation.ts`, screens — whichever is the smaller diff, keep old module as a thin shim if needed); thread a `protocolId` through `session/buildSessionResult.ts` into `SessionResult`.
- **Explicitly NOT:** no movement-selection UI yet (that's M10's stub surface), no metric-shape changes (M6).
- **Accept:** all existing tests green unchanged (behavioral no-op for squat); `movementProfile.test.ts` and `squatRegressions.test.ts` pass; M2 tape regression identical output; new registry tests prove unknown protocol throws.
- **Gate:** build+test.

### M6 — Metric registry v1
- **Goal:** Replace the fixed squat metric shape with keyed `MetricResult[]` (MD #3 §1–3, MD #2 §5–6).
- **Files:** create `web/src/metrics/registry.ts` + `web/src/metrics/squatMetrics.ts` (definitions: depth, trunk lean, depth CV, hip shift, knee/shoulder asymmetry — each with units, confidence basis, validation tier, and the MD #3 §12 "not defensible from single RGB" exclusions documented); modify `web/src/analysis/metricCollector.ts` to also emit `MetricResult[]`; modify `web/src/session/types.ts` + `buildSessionResult.ts` to carry `metricResults: MetricResult[]` alongside the legacy `SetMetricsSummary` (keep legacy fields — ResultsScreen still reads them until M8).
- **Accept:** every metric result carries confidence + provenance; legacy summary values and new MetricResults agree on the tape regression; no UI change.
- **Gate:** build+test.

### M7 — Finding engine v1
- **Goal:** Metrics → meaning: rule-based findings with evidence chains (MD #4 §4–7, §9).
- **Files:** create `web/src/findings/engine.ts` (evaluates a protocol's finding rules over `MetricResult[]` + quality gate output → `Finding[]`), `web/src/findings/squatRules.ts` (port the logic in `feedback/feedbackReasoning.ts`/`feedbackEngine.ts` into declarative rules; each finding cites the MetricResults that triggered it); modify `web/src/feedback/feedbackEngine.ts` to derive `CoachingCue`s FROM findings (cue = finding + tryNext template) so copy stays identical; add `findings: Finding[]` to `SessionResult`.
- **Accept:** cues rendered today are byte-identical (or improvements are itemized in the progress note); findings respect quality-gate abstain (invalid set ⇒ zero findings); confidence gating preserved (low-confidence claims suppressed, as per commit 4df8ad4 behavior).
- **Gate:** build+test.

### M8 — Results UX v1
- **Goal:** Progressive disclosure per MD #11 §3/§5: Summary / Evidence / Expert tabs + finding cards.
- **Files:** create `web/src/components/report/FindingCard.tsx` (statement, observed evidence, confidence badge, tryNext), `web/src/components/report/ResultsTabs.tsx`; modify `web/src/screens/ResultsScreen.tsx`: Summary = verdict + top findings; Evidence = MetricResults, rep timeline, posture profile, excluded/untrusted reps disclosure; Expert = existing analyst content (frame trace, rejection ledger, replay, `PoseScene3D`) — fold `hooks/useAnalystMode.ts` into the Expert tab. Add design tokens to `web/src/index.css` only as far as MD #11 §8 maps onto existing styles (no visual rebrand).
- **Accept:** invalid sets still fully abstain (only reasons/fixes/diagnostics visible); DisclaimerBanner retained; replay + 3D layers still reachable under Expert; component tests for tab gating + FindingCard.
- **Gate:** build+test.

### M9 — Local session history
- **Goal:** Longitudinal memory, local-only (fulfills the `SessionBaseline` seam in `session/types.ts`; MD #11 information architecture; MD #8 §9 persistence — IndexedDB flavor only).
- **Files:** create `web/src/storage/sessionStore.ts` (+test with fake IndexedDB or in-memory adapter): versioned schema `{schemaVersion, protocolId, timestamp, SessionResult, provenance}`; create `web/src/screens/HistoryScreen.tsx` + route `/history` in `web/src/App.tsx` + nav in `components/AppShell.tsx`; modify `ResultsScreen`/session finish flow to offer "save session" (explicit user action, not silent).
- **Accept:** sessions persist across reload; delete-all control exists (privacy); no network calls; baseline comparison may populate `SessionBaseline` for same-protocol history but must be confidence-hedged and observation-language.
- **Gate:** build+test.

### M10 — Protocol expansion stubs
- **Goal:** Prove the engine is multi-protocol without shipping unvalidated analysis (MD #1 taxonomy, MD #7 domain profiles).
- **Files:** create `web/src/protocols/hipHinge/index.ts`, `web/src/protocols/jump/index.ts`, `web/src/protocols/sprint/index.ts` — real `ProtocolDefinition` metadata (kind: cyclic/ballistic/gait per `analysis/movement/types.ts`), but their analyze entry points throw `NotImplementedError`; registry lists them as `status: 'planned'`; minimal protocol-picker UI (landing or camera screen) showing squat as available, others visibly "in development — not yet validated".
- **Accept:** selecting a stub never crashes the app into a broken analysis (UI blocks start with honest copy); registry tests cover status filtering; squat path untouched.
- **Gate:** build+test.

### M11 — Docs sync
- **Goal:** Repo tells the truth about itself.
- **Files:** modify `README.md` (protocol-platform framing, real commands, folder map), `docs/07_architecture.md` (new module diagram: core/ protocols/ metrics/ findings/ storage/), doctrine docs updated with anything learned; create `docs/implementation/progress/FINAL_SUMMARY.md` (per-milestone commits, test counts baseline→final, deferred items, open validation findings still open).
- **Accept:** a new contributor can go from clone → dev → test using only README; deferred-scope ledger current.
- **Gate:** build+test one final time; final commit.

---

## E. Notes & Risks

**Things that could break the app**
- `SetMetricsSummary`/`ComponentScores` reshaping (M6) is the highest-risk change — `ResultsScreen`, `verdictEvidence`, `FeedbackCard`, and many tests read those fields. Mitigation: additive dual-write (legacy + `MetricResult[]`) until M8, deleting legacy fields only if M8 finishes cleanly.
- The live/replay parity invariant: any change inside `runPipelineOnFrames` or its callees silently invalidates `eval/replayParity.test.ts` and all captured tapes. M2's tape regression test exists precisely to catch this — treat a changed snapshot as a defect unless deliberately justified.
- COOP/COEP headers in `vite.config.ts` are load-bearing for MediaPipe WASM — don't touch them while editing the config for coverage.
- Router changes (M9 `/history`) interact with `vercel.json` SPA rewrites — verify deep links after adding routes.
- Quality-gate regressions: several milestones touch the report path; the "invalid ⇒ full abstain" behavior is a product commitment (commit `2408a58`) and must survive every milestone.
- Coverage thresholds (80% on `src/cv/**`) will start failing if coverage scope is widened carelessly in M2 — measure before setting thresholds on new folders.

**Explicitly deferred (do not build, per MD #10's own "should not build" list and owner constraints)**
- RTMPose / any pose-model swap (needs replay-harness benchmark first, and MediaPipe stays until then)
- SMPL / digital humans / 3D avatars beyond the existing `PoseScene3D` inspection view
- OpenSim musculoskeletal modeling; force/torque estimates (not defensible from single RGB — MD #3 §12)
- FHIR / clinical integrations, medical diagnosis, injury prediction or risk scores
- Wearables / IMU sensor fusion
- Enterprise features, accounts, cloud sync, backend of any kind
- Movement embeddings / foundation-model work (MD #10 long-horizon only)

**Open questions logged for the owner**
- Validation findings #5/#6 (rep gates counting standing/impossible-flexion reps) remain open pending labeled ground-truth data. The protocol/metric refactor must not paper over them; they stay visible in the quality gate.
- Whether to eventually delete the legacy `SetMetricsSummary` fields after M8, or keep them as a stable serialization surface for saved sessions (M9). Recommendation: keep them versioned inside the stored schema so old saved sessions stay readable.
- Coverage threshold policy for the new `core/`, `protocols/`, `metrics/`, `findings/` folders — set per-folder thresholds only after M2 measures real numbers.
