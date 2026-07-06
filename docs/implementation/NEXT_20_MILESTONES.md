# Next 20 milestones — M15–M34 (planned 2026-07-06)

Derived from the 11 research MDs (`docs/research/`), the deferred-scope ledger
(`docs/doctrine/deferred-scope.md`), the M0–M11 final summary, the M12–M14
batch-eval findings, and the interview-locked decisions (coach-question
pipeline, verdict-or-abstain, no composite score ever, front-view protocol
first, report-first).

Every milestone honors the standing gates: `npm run build` clean + `npm test`
green from `web\`, one commit per milestone, progress note per milestone,
never push without an explicit ask, never `git add -A`. Rep gates and phase
thresholds may only change in milestones that cite labeled-tape evidence
(M16/M17); nothing else touches them. No composite 0–100 score, no injury
prediction, no diagnosis, no backend, no pose-model swap.

## Phase A — Validation & data foundation (MD05, MD02)

### M15 — Ground-truth labeling workflow + labeled tape suite
MD05 (benchmark protocol, dataset/QA discipline); unblocks open findings #5/#6.
- `eval-tapes/README.md`: labeling protocol (what counts as a rep, bottom-frame
  definition, labeler provenance).
- `npm run eval:label -- <tape> --reps N [--bottoms i,j,k]` CLI that writes
  `meta.truth` (+ `labeledBy`/`labeledAt`/method provenance) additively —
  tape frames untouched, format version preserved.
- Seed `eval-tapes/` with the 2026-07-06 stock tapes (local, gitignored like
  the session-c tape) and label them from the source videos.
- Acceptance: `npm run eval:tapes` reports repCountError / bottom-frame MAE
  on ≥ 5 labeled tapes.

### M16 — Upload cold-start guard (findings #5/#6, first labeled-data fix)
Quality gate contract says rep-gate changes require labeled data — M15
provides it. Stock tape (1) counted 4 standing "reps" at clip start.
- Reproduce on labeled tapes; add an upload-path activation guard (require a
  genuine first descent before candidates count), measured before/after with
  `eval:tapes` (rep-count error must fall; no valid tape may regress).
- Session-c snapshot updated only with justification in the progress note.

### M17 — Variable-FPS & timestamp-driven gates
MD02 §3.3 common mistakes: "using fixed FPS when browser frame intervals
vary". Upload tapes all replay at fps=15 regardless of source.
- Audit every duration/hold gate for frame-count vs milliseconds assumptions;
  make them timestamp-driven; honor source fps in upload sampling metadata.
- Replay harness proves rep counts/bottoms unchanged on the labeled suite.

## Phase B — Metric engine expansion (MD03 §3/§11 minimum viable set)

### M18 — Tempo & phase-timing metrics
MD03 minimum set: "tempo, cadence, phase duration".
- Per-rep descent/bottom-hold/ascent durations + set cadence as keyed
  `MetricResult`s (display tier), from existing phase transitions only.
- Results UI rows + finding rule for erratic tempo (observation language).

### M19 — ROM & peak-angle metrics beyond the knee
MD03 minimum set: "ROM and peak/min angles; hip, ankle proxy where visible".
- Hip-flexion proxy ROM and ankle proxy (where landmarks support it), each
  with per-metric confidence and abstain-on-missing.

### M20 — Path & smoothness metrics v1
MD03 §5 (smoothness: velocity peaks; path length), display-tier only per
MD05 validation tiers.
- Hip-path length, descent/ascent peak-velocity proxy, jerk proxy from
  FILTERED trajectories (MD02: never derivatives on raw pose).
- Explicitly labeled expert-review tier in UI; no coaching cues from these
  until validated.

### M21 — Posture metric set v1
MD03 §4 basic posture: forward-head, shoulder elevation, pelvic/hip shift.
- Extend `postureCollector` with forward-head and shoulder-elevation proxies
  (front view), observation copy, per-metric confidence.

## Phase C — Coaching intelligence (MD04 §4–5, interview decisions)

### M22 — Root-cause concept cards
MD04 §5 (concept cards: ankle mobility, hip strategy, trunk control, balance,
fatigue) — plausibility language, never diagnosis.
- `findings/rootCauses.ts`: map finding combinations to candidate-explanation
  cards with evidence chains and "possible contributor" phrasing; claims
  policy gate in tests (no diagnosis/injury/medical words).

### M23 — Evidence-strength finding ranking (retire score-based ranking)
MD04 §2/§4.5; design-review decision "delete score entirely".
- Rank findings by evidence strength (magnitude vs threshold × consistency
  across reps × metric confidence) instead of lowest-ComponentScore; keep
  cue copy identical; scoringEngine reduced to threshold classification.

### M24 — Coach-question report organization
Interview-locked coach-question pipeline; findings already carry `question`.
- Group report findings under movement-completion / posture-organization /
  load-symmetry sections with per-question abstain states ("nothing the
  camera can vouch for here").

## Phase D — Capture & CV (MD06, MD11 §4)

### M25 — Capture readiness v2: camera-geometry checks
MD06 Part 3 (browser handling for unknown cameras); MD11 capture UX.
- Estimate camera height/angle cues from landmark geometry (horizon proxy,
  body-frame occupancy, foot visibility) pre-capture; per-protocol view
  check (front-view squat v1); retake-flow copy.

### M26 — Per-frame landmark quality scoring
MD06 Part 4 (confidence framework).
- Visibility/stability/plausibility subscores per frame feeding the
  existing confidence `basis` array; exposed in analyst mode + eval reports.

### M27 — Live filtering stack upgrade (benchmark-gated)
MD02 §3.3 real-time stack: spike rejection + ≤150 ms gap fill before
One-Euro. Deferred-scope rule: adopt only if the replay harness proves
variance drops with rep count/bottom timing unchanged on the labeled suite.

## Phase E — Protocol expansion (MD07 Part 4/8, MD08 plugin contracts)

### M28 — Sit-to-Stand protocol v1
MD07: "First MVP clinical test… high browser feasibility." Functional, not
clinical claims.
- New protocol via the registry: 30-second chair-stand style capture, count
  + completion-time metrics, chair/arm-use guidance copy, observation-only
  findings. Proves the protocol engine on a second cyclic movement.

### M29 — Hip-hinge protocol v1 (activate the M10 stub)
MD01 ontology (hinge primitive), MD03 metrics.
- Phase profile + trunk/hip metrics reusing the cyclic engine; honest
  minimal findings; picker unlocks from stub.

### M30 — Jump/CMJ protocol v1 (activate the M10 stub)
MD07 CMJ row (trend-first, proxy metrics).
- Countermovement depth + flight-time proxy (display tier), average-of-trials
  reporting; no readiness claims.

## Phase F — Longitudinal intelligence & product surface (MD07 Part 7, MD05, MD11)

### M31 — Personal baseline v1
FINAL_SUMMARY open item: `SessionResult.baseline` still null.
- Populate baseline from IndexedDB history (same protocol only), honest
  small-N handling (no baseline under 3 sessions), delta copy in report.

### M32 — Trend reporting with MDC-aware change detection
MD05 (SEM/MDC), MD07 Part 7 dashboards.
- Per-metric trend view in history; "changed vs within measurement noise"
  copy using conservative MDC proxies; no readiness/fatigue claims.

### M33 — Local session report export
MD08 §9 artifact strategy (allowed: local, self-contained; no C3D/FHIR).
- Export a session as self-contained HTML + JSON (findings, metrics,
  confidence, provenance, app/protocol versions) — shareable audit trail,
  no backend.

### M34 — Docs, doctrine & roadmap sync
M11 pattern: README/architecture sync for M12–M33, deferred-scope ledger
update, validation session-log additions (batch-eval findings), refresh of
this roadmap with actuals.

## Explicitly still deferred (unchanged)
Pose-model swap, SMPL/avatars, kinetics/GRF, FHIR/clinical, injury
prediction, wearables, backend/accounts, embeddings, composite score
(never). See `docs/doctrine/deferred-scope.md`.
