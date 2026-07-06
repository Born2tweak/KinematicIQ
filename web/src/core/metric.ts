/**
 * Core metric vocabulary (M3).
 *
 * A `MetricDefinition` is the catalog entry (what a metric IS, movement-
 * agnostic); a `MetricResult` is one computed value carrying its confidence,
 * provenance, and validation tier. This is the keyed replacement for the fixed
 * squat `SetMetricsSummary` shape — adopted incrementally in M6, defined here
 * with no runtime coupling.
 *
 * Design sources: docs/research/03_Metric_Engine_Spec.md §1–3 (metric ontology,
 * MetricResult), docs/research/02...Biomechanics_Spec.md §5–6 (confidence
 * propagation), docs/research/05...Handbook.md (validation tiers),
 * docs/research/08 §3/§5 (`MetricResult`, `Unit`).
 *
 * No composite score type exists here by design (claims-policy: no composite
 * 0–100 movement-quality score, ever).
 *
 * Types-only.
 */
import type { Confidence, ConfidenceBasis } from './confidence'
import type { Provenance } from './provenance'

/** Units a metric can report. Superset of docs/research/08 §5 `Unit`. */
export type MetricUnit =
  | 'deg'
  | 'rad'
  | 'm'
  | 'cm'
  | 'px'
  | 's'
  | 'ms'
  | 'ratio'
  | 'percent'
  | 'count'
  | 'normalized'

/**
 * Validation tier from docs/research/05...Handbook.md. Gates the language a
 * metric's result is allowed to use (see docs/doctrine/claims-policy.md).
 * KinematicIQ ships at experimental/production today.
 */
export type ValidationTier =
  | 'experimental' // Tier 0 — internal tests / synthetic / pilots
  | 'production' // Tier 1 — reliability + benchmark; "coaching cue"
  | 'research' // Tier 2 — independent gold-standard validation
  | 'clinical' // Tier 3 — clinical decision support (out of scope)

/** Which body side a metric describes. */
export type MetricSide = 'left' | 'right' | 'bilateral' | 'none'

/** Evidence category a metric contributes to (docs/24 §3.10). */
export type MetricEvidenceCategory =
  | 'kinematic-geometry'
  | 'temporal'
  | 'variability'
  | 'laterality'
  | 'capture-quality'

/**
 * Catalog entry: the movement-agnostic definition of a metric. Concrete
 * per-movement definitions (with thresholds/bands) live in the metric registry
 * (M6); this is the shape they conform to.
 */
export interface MetricDefinition {
  /** Stable machine key, e.g. 'squat.depth.min-knee-angle'. */
  id: string
  /** Human-readable label for reports. */
  label: string
  unit: MetricUnit
  evidenceCategory: MetricEvidenceCategory
  /** Highest tier this metric's results may currently claim. */
  validationTier: ValidationTier
  /** Which confidence contributors are relevant to this metric. */
  confidenceBasis: ConfidenceBasis[]
  /** Short description of what is measured, in observation language. */
  description: string
  /**
   * Documented reason this metric is NOT defensible from single RGB, when it
   * is excluded on those grounds (docs/research/03 §12). Absent for included
   * metrics; present + `included: false` for exclusions kept for the record.
   */
  exclusionReason?: string
  /** False only for cataloged-but-excluded metrics (kept, never silently dropped). */
  included: boolean
}

/** One computed metric value with full trust metadata. */
export interface MetricResult {
  /** References the `MetricDefinition.id` this result instantiates. */
  metricId: string
  label: string
  /** Null when the metric could not be computed (abstain, not zero). */
  value: number | null
  unit: MetricUnit
  side: MetricSide
  confidence: Confidence
  provenance: Provenance
  validationTier: ValidationTier
  /** Optional phase/rep/time window this value describes. */
  window?: MetricWindow
  /** Machine-readable quality flags (e.g. 'low-coverage', 'out-of-plane'). */
  qualityFlags?: string[]
}

/** Where in the movement a metric value applies. */
export interface MetricWindow {
  phase?: string
  repNumbers?: number[]
  startTimeMs?: number
  endTimeMs?: number
}

/** True when a result carries a usable value. Narrows `value` to number. */
export function hasValue(
  result: MetricResult,
): result is MetricResult & { value: number } {
  return result.value !== null
}
