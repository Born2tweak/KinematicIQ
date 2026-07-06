/**
 * Squat metric definitions + MetricResult emission (M6).
 *
 * Replaces the fixed squat `SetMetricsSummary` shape with a keyed
 * `MetricResult[]` carrying confidence, provenance, and validation tier, while
 * the legacy summary is kept for the current ResultsScreen (dual-write until
 * M8). Values are read from the SAME `SetMetricsSummary` the pipeline already
 * produces — no recomputation, so legacy and keyed views agree by construction.
 *
 * Design sources: docs/research/03_Metric_Engine_Spec.md §1–3 + §12 (single-RGB
 * exclusions), docs/research/02...Biomechanics_Spec.md §5–6, docs/research/05
 * (validation tiers). Observation language + no composite (claims-policy).
 */
import { makeConfidence, type Confidence } from '../core/confidence'
import type { MetricDefinition, MetricResult, MetricSide } from '../core/metric'
import type { Provenance } from '../core/provenance'
import type { SetMetricsSummary } from '../session/types'

/**
 * Included squat metrics. Tiers reflect single-RGB defensibility: sagittal
 * knee/depth reads are `production`; front-view trunk lean and normalized
 * shift/asymmetry are `experimental` (weakly observable in 2D — docs/research/03
 * §12, docs/24 §3.4 front-view forward-lean caveat).
 */
export const SQUAT_METRIC_DEFINITIONS: MetricDefinition[] = [
  {
    id: 'squat.depth.min-knee-angle',
    label: 'Depth (avg min knee angle)',
    unit: 'deg',
    evidenceCategory: 'kinematic-geometry',
    validationTier: 'production',
    confidenceBasis: ['landmark-visibility', 'sample-coverage'],
    description:
      'Average deepest knee flexion across trusted reps, in this set. Lower angle = deeper squat.',
    included: true,
  },
  {
    id: 'squat.depth.cv',
    label: 'Depth consistency (CV)',
    unit: 'percent',
    evidenceCategory: 'variability',
    validationTier: 'production',
    confidenceBasis: ['sample-coverage', 'temporal-stability'],
    description:
      'Coefficient of variation of per-rep depth — how repeatable depth was across this set.',
    included: true,
  },
  {
    id: 'squat.trunk.avg-lean',
    label: 'Trunk lean (avg)',
    unit: 'deg',
    evidenceCategory: 'kinematic-geometry',
    validationTier: 'experimental',
    confidenceBasis: ['landmark-visibility'],
    description:
      'Average trunk lean from vertical, in this set. Front-view lean is weakly observable in 2D; trunk-level only (thoracic honesty).',
    included: true,
  },
  {
    id: 'squat.symmetry.hip-shift',
    label: 'Hip shift at bottom (avg)',
    unit: 'normalized',
    evidenceCategory: 'laterality',
    validationTier: 'experimental',
    confidenceBasis: ['landmark-visibility', 'internal-agreement'],
    description:
      'Average lateral hip offset at the bottom of the rep, self-referenced across the set.',
    included: true,
  },
  {
    id: 'squat.symmetry.knee-asymmetry',
    label: 'Knee asymmetry (avg)',
    unit: 'deg',
    evidenceCategory: 'laterality',
    validationTier: 'production',
    confidenceBasis: ['landmark-visibility', 'internal-agreement'],
    description:
      'Average left/right knee-angle difference across the set — a laterality observation only.',
    included: true,
  },
  {
    id: 'squat.symmetry.shoulder-asymmetry',
    label: 'Shoulder level asymmetry (avg)',
    unit: 'normalized',
    evidenceCategory: 'laterality',
    validationTier: 'experimental',
    confidenceBasis: ['landmark-visibility'],
    description:
      'Average shoulder-height difference at the bottom of the rep, self-referenced.',
    included: true,
  },
]

/**
 * Metrics cataloged but EXCLUDED as not defensible from single RGB (kept for
 * the record, never silently dropped — docs/research/03 §12, claims-policy).
 */
export const SQUAT_EXCLUDED_METRICS: MetricDefinition[] = [
  {
    id: 'squat.kinetics.knee-load',
    label: 'Knee joint load',
    unit: 'ratio',
    evidenceCategory: 'kinematic-geometry',
    validationTier: 'experimental',
    confidenceBasis: [],
    description: 'Internal joint load / force at the knee.',
    exclusionReason:
      'Kinetics (force/load/torque) are not defensible from single-RGB video (MD #3 §12; claims-policy forbids it).',
    included: false,
  },
  {
    id: 'squat.spine.segmental-angle',
    label: 'Segmental spine angle',
    unit: 'deg',
    evidenceCategory: 'kinematic-geometry',
    validationTier: 'experimental',
    confidenceBasis: [],
    description: 'Upper- vs lower-thoracic spine segmental angles.',
    exclusionReason:
      'MediaPipe cannot resolve segmental spine; trunk-level drift only (thoracic honesty).',
    included: false,
  },
]

/** Side each metric describes (bilateral/none for aggregates). */
const METRIC_SIDE: Record<string, MetricSide> = {
  'squat.depth.min-knee-angle': 'bilateral',
  'squat.depth.cv': 'none',
  'squat.trunk.avg-lean': 'none',
  'squat.symmetry.hip-shift': 'bilateral',
  'squat.symmetry.knee-asymmetry': 'bilateral',
  'squat.symmetry.shoulder-asymmetry': 'bilateral',
}

/** Read a metric's value out of the legacy summary. Null ⇒ metric abstains. */
function valueFor(id: string, summary: SetMetricsSummary): number | null {
  switch (id) {
    case 'squat.depth.min-knee-angle':
      return summary.avgDepth
    case 'squat.depth.cv':
      return summary.depthCV
    case 'squat.trunk.avg-lean':
      return summary.avgTrunkLean
    case 'squat.symmetry.hip-shift':
      return summary.avgHipShift
    case 'squat.symmetry.knee-asymmetry':
      return summary.avgKneeAsymmetry
    case 'squat.symmetry.shoulder-asymmetry':
      return summary.avgShoulderAsymmetry
    default:
      return null
  }
}

/**
 * Emit keyed `MetricResult[]` from the legacy squat summary. Every result
 * carries the same session confidence (0–100 → [0,1]) tagged with the metric's
 * confidence basis, plus the supplied provenance and the definition's tier.
 */
export function buildSquatMetricResults(
  summary: SetMetricsSummary,
  provenance: Provenance,
): MetricResult[] {
  const sessionConfidence = makeConfidence(
    Math.min(1, Math.max(0, summary.overallConfidence / 100)),
  )
  return SQUAT_METRIC_DEFINITIONS.map((def): MetricResult => {
    const confidence: Confidence = makeConfidence(
      sessionConfidence.value,
      def.confidenceBasis,
    )
    return {
      metricId: def.id,
      label: def.label,
      value: valueFor(def.id, summary),
      unit: def.unit,
      side: METRIC_SIDE[def.id] ?? 'none',
      confidence,
      provenance,
      validationTier: def.validationTier,
    }
  })
}
