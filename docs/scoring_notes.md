# KinematicIQ scoring notes (developer)

Client-side, deterministic scoring for **bodyweight squats** from a **single side camera view**. This document explains what each component measures, how the total score is built, and known limitations.

## Total score

```
total = depth×0.30 + trunkControl×0.25 + kneeTracking×0.20 + consistency×0.15 + symmetry×0.10
```

Each component is scored **0–100** from set metrics, then combined with fixed weights in `web/src/scoring/scoringConfig.ts` (`SCORE_WEIGHTS`).

Bands (`bandFromScore`):

| Total | Band |
|-------|------|
| 80–100 | Excellent |
| 60–79 | Good |
| 40–59 | Needs Work |
| 0–39 | Poor |

Piecewise mapping for each metric uses `scoreLowerIsBetter` in `scoringEngine.ts`: excellent → 100, good band → 80–100, needs-work band → 50–80, beyond needs-work → 0–49.

## Components

### Depth (30%)

- **Measures:** Average of per-rep minimum knee angles (smaller = deeper).
- **Source:** `SetMetricsSummary.avgDepth`, `minDepth`, `maxDepth` from `metricCollector`.
- **Thresholds (degrees):** excellent ≤90, good ≤110, needs-work ≤130.
- **Affects total:** Largest weight; shallow sets (high knee angles) cap the score even if other areas look fine.

### Trunk control (25%)

- **Measures:** Average forward lean (shoulder–hip angle vs vertical).
- **Source:** `avgTrunkLean` per rep.
- **Thresholds (degrees):** excellent ≤30, good ≤45, needs-work ≤60.
- **Affects total:** Second-largest weight; excessive chest pitch lowers the score.

### Knee tracking (20%)

- **Measures:** Average absolute difference between left and right minimum knee angles at the bottom.
- **Source:** `avgKneeAsymmetry` from `asymmetryDetector`.
- **Thresholds (degrees):** excellent ≤8, good ≤15, needs-work ≤25.
- **Not:** Clinical valgus/varus diagnosis — only left/right bend mismatch in 2D.
- **Missing data:** Neutral score 50 (`MISSING_METRIC_NEUTRAL_SCORE`).

### Consistency (15%)

- **Measures:** Coefficient of variation of per-rep depth (%): `std(depths) / mean(depths) × 100`.
- **Thresholds (%):** excellent ≤5, good ≤10, needs-work ≤20.
- **Single rep:** Default 70 (`SINGLE_REP_CONSISTENCY_SCORE`) — variation cannot be computed.
- **Affects total:** Penalizes rep-to-rep depth drift, not tempo or rest time.

### Symmetry (10%)

- **Measures:** Average horizontal hip shift at bottom (normalized 0–1 frame width).
- **Source:** Hip midpoint vs ankle midpoint in image space.
- **Thresholds:** excellent ≤0.02, good ≤0.05, needs-work ≤0.10.
- **Smallest weight:** Still surfaces obvious lateral bias.

## Observation confidence

Separate from movement quality score. Computed in `confidenceCalculator.ts` from rep landmark confidence and optional live pose samples.

| Score | Level | UI behavior |
|-------|--------|-------------|
| ≥75 | High | Full results + coaching |
| 50–74 | Medium | Scores + coaching with disclaimer |
| <50 | Low | Scores shown; coaching hidden (`insufficientData`) |

Thresholds: `SESSION_CONFIDENCE_THRESHOLDS` in `scoringConfig.ts`.

## Known limitations

1. **2D side view only** — Depth is inferred from knee angle, not bar path or femur length. Trunk lean is projected, not true sagittal angle if the user rotates.
2. **No barbell / load** — Bodyweight squat assumptions; loaded squats may look different without model changes.
3. **Landmark noise** — MediaPipe jitter affects angles, especially ankles and hips at distance.
4. **Chair / seated heuristics** — Rep counter may reject seated patterns; scoring does not run on rejected reps.
5. **Single-rep sets** — Consistency uses a neutral default, not a measured value.
6. **Asymmetry proxy** — Knee angle difference ≠ medical knee tracking assessment.

## Camera setup (for trustworthy scores)

- Full body in frame: head to feet.
- **Side view** (~45–90°), camera at hip height when possible.
- 6–8 ft distance, even lighting, plain background.
- Phone stable (tripod or lean) to reduce jitter.

## Directional, not clinical

Scores and bands are for **coaching and trend comparison** between sets in similar conditions. They are not:

- Medical or diagnostic
- Suitable for return-to-play decisions
- Invariant to camera zoom, lens, or clothing

When confidence is low, treat numbers as rough indicators only.

## Code map

| File | Role |
|------|------|
| `web/src/scoring/scoringConfig.ts` | Weights, thresholds, bands |
| `web/src/scoring/scoringEngine.ts` | Component + total score |
| `web/src/scoring/scoringExplanations.ts` | User-facing “why this score” copy |
| `web/src/analysis/metricCollector.ts` | Set aggregates from reps |
| `web/src/feedback/confidenceCalculator.ts` | Observation confidence |
| `web/src/screens/ResultsScreen.tsx` | Score + breakdown UI |

## Calibration history

- **M14C:** Documented thresholds; transparent results breakdown; confidence messaging aligned to `SESSION_CONFIDENCE_THRESHOLDS`.
