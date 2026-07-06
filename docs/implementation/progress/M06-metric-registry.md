# M06 — Metric Registry v1

Date: 2026-07-05. Replace the fixed squat metric shape with keyed `MetricResult[]`, dual-written alongside the legacy `SetMetricsSummary`.

## What changed

- **`web/src/metrics/squatMetrics.ts`** (new) — 6 included `MetricDefinition`s (depth/min-knee-angle, depth CV, trunk lean, hip shift, knee asymmetry, shoulder asymmetry) each with unit, evidence category, validation tier, and confidence basis; plus 2 documented **excluded** metrics (knee-load kinetics, segmental spine) with `included:false` + `exclusionReason` per MD #3 §12 / thoracic honesty. `buildSquatMetricResults(summary, provenance)` emits `MetricResult[]` by reading values out of the SAME legacy summary (no recomputation ⇒ values agree by construction). Tiers: sagittal depth/knee metrics `production`; front-view trunk/shift/shoulder `experimental` (weakly observable in 2D).
- **`web/src/metrics/registry.ts`** (new) — `getMetricDefinitions`, `getExcludedMetricDefinitions`, `getMetricDefinition(protocolId, id)`; squat populated, other protocols empty.
- **`web/src/session/types.ts`** + **`buildSessionResult.ts`** — added `metricResults: MetricResult[]` to `SessionResult`; built in `buildSessionResult` from the legacy summary with a `Provenance` (captureSource live, protocolId front-view-squat-v1) and attached to both return branches. Legacy `SetMetricsSummary`/`ComponentScores` untouched (ResultsScreen still reads them until M8).
- **`web/src/metrics/squatMetrics.test.ts`** (new) — one-result-per-definition, keyed↔legacy value agreement, confidence/provenance/tier presence, null-as-abstention (not zero), excluded-metric documentation, and registry resolution.

## Files touched

- `web/src/metrics/{squatMetrics.ts,registry.ts,squatMetrics.test.ts}` (new)
- `web/src/session/types.ts`, `web/src/session/buildSessionResult.ts` (modified — dual-write metricResults)

## Decisions / conflicts

- **Additive dual-write** exactly as Section E mandates for the highest-risk change: legacy fields stay; `MetricResult[]` added beside them. No UI change this milestone.
- Values are read from the legacy summary rather than recomputed, so the tape regression (M2) is unaffected and legacy/keyed agree without a second code path.
- Confidence per result derives from the session's `overallConfidence` (0–100 → [0,1]) tagged with the metric's basis; a per-metric confidence model can refine this later without a shape change.
- Excluded metrics are cataloged, never silently dropped (metric rule, docs/24 §5).

## Tests

Before: 38 files / 211 tests. After: **39 files / 219 tests**, all green. `npm run build` clean; coverage 84.12% lines/stmts, 84.55% branches, 92.26% funcs — passes thresholds.
