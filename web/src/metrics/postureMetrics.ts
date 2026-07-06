/**
 * Posture metric emission (M21) — keyed MetricResults from the 3D posture
 * set summary: forward-head and shoulder-elevation proxies (MD03 §4 basic
 * posture). Experimental tier; observation language only; abstains when the
 * 3D stream produced no usable reps.
 */
import { makeConfidence } from '../core/confidence'
import type { MetricDefinition, MetricResult } from '../core/metric'
import type { Provenance } from '../core/provenance'
import type { PostureSetSummary } from '../analysis/posture/postureCollector'

export const POSTURE_METRIC_DEFINITIONS: MetricDefinition[] = [
  {
    id: 'posture.head.forward-angle',
    label: 'Forward head (avg)',
    unit: 'deg',
    evidenceCategory: 'kinematic-geometry',
    validationTier: 'experimental',
    confidenceBasis: ['landmark-visibility', 'sample-coverage'],
    description:
      'Average degrees the head sits ahead of the trunk line across usable reps (3D stream). 0° = stacked over the trunk.',
    included: true,
  },
  {
    id: 'posture.shoulder.elevation-ratio',
    label: 'Shoulder elevation ratio (avg)',
    unit: 'ratio',
    evidenceCategory: 'kinematic-geometry',
    validationTier: 'experimental',
    confidenceBasis: ['landmark-visibility', 'sample-coverage'],
    description:
      'Head-to-shoulder distance over trunk length — lower values read as shoulders held closer to the ears. Trend-wise observation only.',
    included: true,
  },
]

/**
 * Emit posture MetricResults from the set summary. Confidence reflects how
 * much of the set carried a usable 3D read (sample coverage).
 */
export function buildPostureMetricResults(
  posture: PostureSetSummary | null,
  provenance: Provenance,
): MetricResult[] {
  if (posture === null) return []
  const confidence = makeConfidence(
    Math.min(1, Math.max(0, posture.sampleCoverage)),
    ['landmark-visibility', 'sample-coverage'],
  )
  const values: Record<string, number | null> = {
    'posture.head.forward-angle': posture.avgForwardHeadAngle,
    'posture.shoulder.elevation-ratio': posture.avgShoulderElevationRatio,
  }
  return POSTURE_METRIC_DEFINITIONS.map((def) => ({
    metricId: def.id,
    label: def.label,
    value: values[def.id] ?? null,
    unit: def.unit,
    side: 'none' as const,
    confidence,
    provenance,
    validationTier: def.validationTier,
  }))
}
