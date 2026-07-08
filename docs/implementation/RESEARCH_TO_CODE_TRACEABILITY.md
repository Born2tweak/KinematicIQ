# Research-to-Code Traceability Matrix

**Living document.** Maps research concepts (R01–R11, see
`docs/research/INDEX.md`) to the code that implements them, the milestones
that built them, and their current validation tier.

**Maintenance rule (binding):** every future milestone that changes source
behavior must update the affected rows in the same commit. A matrix that
lags the code is worse than none — treat a stale row as a defect. Status
claims require file references; no row may say `implemented` without naming
the files.

**Status values:** `implemented` · `partial` · `planned` · `deferred` ·
`rejected`.

**Validation tiers** (R05): `experimental` (Tier 0) · `production` (Tier 1)
· `research` (Tier 2) · `clinical` (Tier 3). Everything shipped today is
experimental unless stated.

## Core schemas (R08 §3/§5, R03, R05)

| Research concept | Source | Code | Milestones | Status | Tier |
|---|---|---|---|---|---|
| Confidence value/level/basis vocabulary | R03, R08 §5 | `web/src/core/confidence.ts` | M3 | implemented | — (infrastructure) |
| Provenance (capture source, model, filter, versions) | R05, R08 §5 `Versioned` | `web/src/core/provenance.ts` | M3 | implemented | — |
| MetricDefinition / MetricResult (+ exclusion records) | R03 §1–3 | `web/src/core/metric.ts` | M3, M6 | implemented | — |
| ProtocolDefinition, protocol status, NotImplementedError | R08 protocol engine | `web/src/core/protocol.ts` | M3, M5 | implemented | — |
| Finding (observation statement + evidence chain) | R04 §4–7 | `web/src/core/finding.ts` | M3, M7 | implemented | — |

## Perception & capture (R06, R02)

| Research concept | Source | Code | Milestones | Status | Tier |
|---|---|---|---|---|---|
| On-device pose estimation (MediaPipe) | R06 | `web/src/cv/poseEngine.ts` | M3 (orig) | implemented | experimental |
| Temporal landmark filtering (one-euro live) | R02, R06 | `web/src/cv/landmarkFilter.ts` | M12–M14 | implemented | experimental |
| Live filtering upgrade (Butterworth etc.) | R02 | — | M27 | **deferred** — needs candidate + tape benchmark (`docs/doctrine/deferred-scope.md`) | — |
| Capture readiness v2 (camera geometry checks) | R06, R11 | `web/src/cv/captureReadiness.ts`, `captureGuidance.ts` | M4, M25 | implemented (thresholds provisional until M44–M45) | experimental |
| Per-frame landmark quality scoring | R06 | `web/src/cv/landmarkQuality.ts` | M26 | implemented | experimental |
| Pluggable camera sources / fixture-driven testing | R08 testing strategy | `web/src/camera/` | camera-testing commit `e14a793` | implemented | — |
| Pose-model swap (RTMPose etc.) | R06 model-swap discipline, R10 | — | — | **deferred** — replay-harness benchmark required first | — |

## Analysis & segmentation (R01, R02)

| Research concept | Source | Code | Milestones | Status | Tier |
|---|---|---|---|---|---|
| Joint-angle math (pure functions) | R02 | `web/src/analysis/angles.ts`, `geometry.ts`, `stats.ts` | orig M5 | implemented | experimental |
| Phase FSM (standing/descending/bottom/ascending) | R01 phases, R02 FSMs | `web/src/analysis/phaseDetector.ts` | orig M6 | implemented — **thresholds evidence-gated, do not tune** | experimental |
| Rep counting + validation gates | R02 | `web/src/analysis/repCounter.ts` | orig M7 | implemented — **gates evidence-gated (open findings #5/#6)** | experimental |
| Timestamp-driven completion/seating gates | R02 | `web/src/analysis/` (M17 changes) | M17 | implemented | experimental |
| Asymmetry / laterality (2D image-space) | R01, R03 | `web/src/analysis/asymmetryDetector.ts` | orig M12 | implemented | experimental |
| 3D posture reads (hinge ratio, trunk stability, smoothness) | R01, R02 | `web/src/analysis/posture/` | M21 wave | implemented | experimental |
| Shared cyclic segmentation engine (movement-agnostic) | R01, R02 | `web/src/analysis/cyclic/cyclicEngine.ts` (+ `analysis/movement/` profiles) | M42 | implemented — squat parity golden-locked | experimental |

## Metric engine (R03)

| Research concept | Source | Code | Milestones | Status | Tier |
|---|---|---|---|---|---|
| Metric registry keyed by protocol (incl. excluded metrics kept for the record) | R03 §12 | `web/src/metrics/registry.ts`, `squatMetrics.ts` | M6 | implemented | experimental |
| Tempo & phase-timing metrics | R03 | `squatMetrics.ts` + `analysis/metricCollector.ts` | M18 | implemented | experimental |
| ROM proxies (hip flexion, ankle dorsiflexion) | R03 | same | M19 | implemented | experimental |
| Hip-path length / peak hip speed (display tier) | R03 | same | M20 | implemented | experimental |
| Posture metrics (forward-head, shoulder-elevation proxies) | R03, R01 | `web/src/metrics/postureMetrics.ts` | M21 | implemented | experimental |
| Kinetics: force / load / torque / power from video | R03 §12 | — | — | **rejected** — not defensible from single RGB; claims-policy forbidden | never |
| Muscle activation estimates | R03 §12 | — | — | **rejected** — same grounds | never |

## Coaching intelligence (R04, R07)

| Research concept | Source | Code | Milestones | Status | Tier |
|---|---|---|---|---|---|
| Finding rules, abstain-aware dispatch | R04 §4–7 | `web/src/findings/engine.ts`, `squatRules.ts` | M7 | implemented | experimental |
| Evidence-strength ranking (threshold exceedance) | R04 §9 | `web/src/findings/evidenceStrength.ts` | M23 | implemented | experimental |
| Root-cause concept cards (plausibility only) | R04, R07 guardrails | `web/src/findings/rootCauses.ts` | M22 | implemented | experimental |
| Coach-question report organization | R04, R11 | `web/src/components/report/resultsTabsModel.ts` | M24 | implemented | — |
| Finding rule provenance (rule id + review status) | R04 evidence strength, R05 | `web/src/core/finding.ts` (`RuleReviewStatus`), `findings/squatRules.ts`, `rootCauses.ts` | M50 | implemented — Evidence/Expert only | experimental |
| Constraint-based coaching library | R01 constraints-led, R04 | `web/src/coaching/constraintsLibrary.ts` | M52 | implemented — one "next set" cue/finding, Evidence only | experimental |
| Diagnosis / pathology / injury-risk conclusions | R07 guardrails | — | — | **rejected** — permanently forbidden (claims-policy) | never |

## Session, quality, and history (R05, R11)

| Research concept | Source | Code | Milestones | Status | Tier |
|---|---|---|---|---|---|
| Set quality gate — valid/questionable/invalid, full abstain | R05, product thesis | `web/src/session/setQualityGate.ts` | quality-gate wave | implemented | — |
| SessionResult assembly (dual-write legacy + keyed results) | R08 | `web/src/session/buildSessionResult.ts`, `types.ts` | M8 | implemented | — |
| Versioned session artifact + legacy read adapter | R08 versioning, R03 | `web/src/session/sessionArtifact.ts`, `web/src/storage/sessionStore.ts` (schema v2, v1 readable) | M40 | implemented | — |
| Per-component evidence, **no composite score** | R03 no-composite | `web/src/scoring/` | design review 2026-07-03 | implemented (composite **rejected — never**) | — |
| Personal baseline (self-referenced history) | R11 history/trends | `web/src/session/baseline.ts` | M31 | implemented | experimental |
| MDC-aware change classification (heuristic thresholds) | R05 SEM/MDC | `web/src/session/changeDetection.ts` | M32 | implemented — thresholds heuristic until M49 | experimental |
| Local opt-in session store (versioned records) | R08 §9 local-first | `web/src/storage/sessionStore.ts`, `historyView.ts` | M9 | implemented | — |
| Session report export artifact (JSON + offline HTML) | R08 artifact strategy, R11 export | `web/src/export/sessionReport.ts`, `sessionReportHtml.ts` | M33 | implemented | — |
| Evidence metric CSV export (provenance columns, local-only) | R08 export formats, R03 | `web/src/export/metricCsv.ts` | M53 | implemented — Expert tab | — |
| Domain context model (optional, non-medical, display/provenance only) | R01 context precedes interpretation, R07 | `web/src/domain/context.ts`, `storage/sessionStore.ts` (schema v3) | M55 | implemented — no analysis effect in v1 | — |
| Assessment workflow state model | R08, R11 | — | M41 | planned | — |

## Validation & benchmarking (R05)

| Research concept | Source | Code | Milestones | Status | Tier |
|---|---|---|---|---|---|
| Pose-tape record/replay harness (live/replay parity) | R05 benchmark harness | `web/src/eval/` | M2, M12–M14 | implemented | — |
| Labeled ground-truth suite + labeling CLI | R05 dataset QA | `web/scripts/labelTape.ts`, `eval-tapes/` | M15–M16 | implemented (9/9 exact since M16) | — |
| Validation corpus manifest / benchmark report generator | R05 | — | M44–M45 | planned | — |
| Reliability study (real SEM/MDC) | R05 | — | M49 | planned | — |

## Experience layer (R11)

| Research concept | Source | Code | Milestones | Status | Tier |
|---|---|---|---|---|---|
| Progressive disclosure (Summary/Evidence/Expert tabs) | R11 | `web/src/components/report/ResultsTabs.tsx`, `resultsTabsModel.ts` | M8, M24 | implemented | — |
| Finding cards with confidence chips | R11, R04 | `web/src/components/report/FindingCard.tsx` | M8 | implemented | — |
| Disclaimer + tier-gated language in UI | R05, claims-policy | `web/src/components/DisclaimerBanner.tsx` + copy throughout | ongoing | implemented — mechanized audit lands in M38 | — |
| Quality review / retake screen model | R11 | `web/src/session/qualityReview.ts` (+ Summary retake CTA) | M51 | implemented — invalid full abstain unchanged | — |
| Accessibility & interaction audit | R11, WCAG | `docs/ux/ACCESSIBILITY_AUDIT.md`, `index.css` focus rings | M54 | implemented — audit + focus-visible; manual browser checks listed | — |
| Design system v1 (tokens + primitives) | R11 design system | `docs/ux/DESIGN_SYSTEM.md`, `web/src/components/ui/confidenceState.ts` | M56 | implemented — confidence tokens extracted, no visual change | — |

## Strategy & long-horizon (R09, R10)

| Research concept | Source | Code | Milestones | Status | Tier |
|---|---|---|---|---|---|
| Protocol-aware analysis entry point (select → runtime → result) | R08, R11 | `web/src/analysis/analyzeProtocol.ts`, `protocols/runtime.ts`, picker/camera/upload route-state threading | M39–M43 | implemented | — |
| Protocol expansion: sit-to-stand / hip hinge / jump | R01, R07 | `web/src/protocols/hipHinge|jump|sprint/` (stubs, analyze throws) | M10; M28–M30 unblocked by M39–M43, still need validation evidence | partial (stubs only) | — |
| Movement embeddings / foundation models | R10 | — | — | **deferred** — gated in `docs/research/FUTURE_R_AND_D_BACKLOG.md` (M59) | — |
| SMPL / digital humans / wearables / sensor fusion | R10 | — | — | **deferred** — R&D ledger (M59) + `docs/doctrine/deferred-scope.md` | — |
| Backend / accounts / cloud sync / FHIR | R10, R07 | — | — | **rejected for this product scope** (ledger) | — |
| Domain module governance (sports/functional/clinical) | R07, R10 | `docs/domain/DOMAIN_MODULE_BACKLOG.md`, `FUNCTIONAL_ASSESSMENT_BOUNDARIES.md` | M57, M58 | implemented (governance docs) — no modules built | — |

## Per-metric validation status

Tier-by-tier detail (evidence behind each tier, failure modes, promotion
criteria) lives in `docs/validation/METRIC_VALIDATION_STATUS.md` (M48) —
update it in the same commit as any metric change, same rule as this matrix.

## Where decisions were recorded

Implementation decisions live in `docs/implementation/progress/` (one note
per milestone from M25 on; grouped notes for M12–M23). Doctrine-level
decisions: `docs/doctrine/claims-policy.md`, `docs/doctrine/deferred-scope.md`,
and the memory-logged design review of 2026-07-03 (composite score deleted,
report-first). Architecture decisions are recorded in `docs/adr/` (M37):
ADR-001 browser-only/local-first, ADR-002 verdict-or-abstain, ADR-003
no-composite-score (permanent), ADR-004 pose-tape-as-audit-artifact. Governance
backlogs (M57–M59): `docs/domain/DOMAIN_MODULE_BACKLOG.md`,
`docs/domain/FUNCTIONAL_ASSESSMENT_BOUNDARIES.md`,
`docs/research/FUTURE_R_AND_D_BACKLOG.md`. Program status + next work:
`KINEMATICIQ_MASTER_EXECUTION_ROADMAP.md` §2A and
`docs/implementation/NEXT_EXECUTION_PACKAGE.md` (M60).
