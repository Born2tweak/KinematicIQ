# Metric Validation Status Board (M48)

**Living document** — the one place that says what each metric may claim
and what promotion would take (R03 metric ontology, R05 validation tiers,
claims-policy tier-gated language).

**Maintenance rule (binding):** adding, excluding, or re-tiering any metric
updates this board in the same commit. **No tier moves up without the
evidence row filled in** — an empty evidence cell with a raised tier is
claim creep, which this board exists to prevent.

Tier meanings (R05): `experimental` = internal estimate, hidden from
high-stakes copy · `production` = coaching-cue language, backed by internal
benchmarks · `research` = independently validated for a stated
(question, protocol) pair · `clinical` = out of product scope, permanently.

## Included metrics — squat (`web/src/metrics/squatMetrics.ts`)

Product surface: Evidence-tab "Measured metrics" list (with tier chip),
finding rules, M31/M32 baseline deltas, M33 report export.

| Metric id | Tier | Evidence behind tier | Required landmarks | Known failure modes |
|---|---|---|---|---|
| `squat.depth.min-knee-angle` | production | 9-tape labeled corpus, rep-exact 9/9; report-level trust gates catch impossible bottoms | hips, knees, ankles | phase-jitter "standing bottoms" (≥170°), extreme-flexion artifacts (≤30°) — both caught by setQualityGate |
| `squat.depth.cv` | production | derives from depth above; variability math unit-tested | same | small samples (<3 trusted reps) → gated to abstain |
| `squat.trunk.avg-lean` | experimental | 2D image-space proxy; no labeled trunk ground truth yet | shoulders, hips | out-of-plane capture inflates lean; camera height sensitivity |
| `squat.symmetry.hip-shift` | experimental | no labeled asymmetry ground truth | hips, ankles | close/front framing compresses signal; normalized units not body-scaled |
| `squat.symmetry.knee-asymmetry` | production | labeled-corpus benchmark; bilateral gate exercised on tapes | knees (both) | tight angled framing produces artifactual asymmetry (corpus README, tape "squatting-stock…") |
| `squat.symmetry.shoulder-asymmetry` | experimental | no ground truth | shoulders | rotation vs elevation ambiguity in 2D |
| `squat.tempo.rep-duration` | production | timestamp-driven (M17/M18); deterministic on replay | knees, hips | none observed beyond rep-boundary correctness (inherits depth gates) |
| `squat.tempo.descent` | production | M18, bottomTimestamp-based | same | missing bottomTimestamp on pre-M18 sessions → abstain |
| `squat.tempo.ascent` | production | M18 | same | same |
| `squat.tempo.cadence` | production | M18, set-span math | same | single-rep sets → abstain |
| `squat.path.hip-path-length` | experimental | display-tier only (M20) | hips | normalized image units — camera distance changes magnitude |
| `squat.path.peak-hip-speed` | experimental | display-tier only (M20) | hips | frame-rate sensitivity; filtering variant changes peaks |
| `squat.rom.hip-flexion` | experimental | proxy angle (shoulder–hip–knee), no goniometry comparison | shoulders, hips, knees | trunk rotation contaminates proxy |
| `squat.rom.ankle-dorsiflexion` | experimental | proxy (knee–ankle–foot), no ground truth | knees, ankles, feet | foot landmarks are MediaPipe's least stable; heel lift unmodeled |

## Included metrics — posture (`web/src/metrics/postureMetrics.ts`)

| Metric id | Tier | Evidence behind tier | Required landmarks | Known failure modes |
|---|---|---|---|---|
| `posture.head.forward-angle` | experimental | 3D worldLandmarks proxy (M21); no validated reference | nose/ears, shoulders | worldLandmark depth noise; absent stream → abstain |
| `posture.shoulder.elevation-ratio` | experimental | M21 proxy | shoulders, hips | same |

## Included metrics — Forward Lunge experimental research seam

These metrics use the canonical `forwardLungeStrideReturn` identity; the legacy
`inlineLunge` value remains read-compatible only. They are unavailable to the
product and have only synthetic verification. None is approved for coaching or
scientific claims. The P4-M04 temporal baseline exposes, but does not resolve,
FPS sensitivity, missingness, raw/filter lag, and event-frame sensitivity.

| Metric family | Tier | Evidence | Blocking gaps |
|---|---|---|---|
| Trial count/completion | experimental | deterministic fixtures and M109 evaluator | human labels, wrong-movement prevalence, subject-held-out validation |
| Trial/event timing | experimental | ordered synthetic states | first-sustained-frame labels, FPS/discontinuity/reacquisition validation |
| Projected lead-knee angle at bottom | experimental | synthetic computation only | synchronized reference, bottom-construct comparison, camera sensitivity |
| Within-set variation | experimental | unit/synthetic tests | repeat-session reliability and minimum usable-trial evidence |

No tier may move until the applicable `flsr-gates-v0.1` successor is frozen and passed.

## Excluded metrics (cataloged, never computed — R03 §12)

| Metric id | Why excluded | Stays excluded until |
|---|---|---|
| `squat.kinetics.knee-load` | Kinetics (force/load/torque) are not defensible from single-RGB video; claims-policy forbidden | Multi-modal capture (force plate/IMU) — out of product scope (deferred ledger) |
| `squat.spine.segmental-angle` | MediaPipe cannot resolve segmental spine; trunk-level drift only (thoracic honesty) | A pose model with validated spine segments + benchmark (model-swap gate) |

## Promotion criteria

**experimental → production** (all required):
1. Labeled-corpus benchmark (M45) covering the metric's failure modes, with
   acceptance gates passing against a saved baseline.
2. Reliability bounds from the M49 study workflow (SEM/MDC for that metric),
   replacing the M32 heuristic thresholds for its baseline deltas.
3. Copy audit (M38) confirms the metric's surfaces use tier-appropriate
   language.

**production → research:** independent gold-standard comparison (e.g. 3D
motion capture) for a stated (question, protocol, population) — requires
external partnership; none scheduled. **→ clinical:** never (deferred-scope
ledger; not a product goal).

## Cross-references

`RESEARCH_TO_CODE_TRACEABILITY.md` (concept→code), `eval-tapes/README.md`
(labeled corpus + per-tape notes), `docs/validation/validation-corpus.md`
(corpus manifest), `docs/doctrine/claims-policy.md` (tier-gated language).
