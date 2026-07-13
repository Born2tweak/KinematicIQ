import { SQUAT_METRIC_DEFINITIONS } from '../metrics/squatMetrics'
import { SQUAT_PROTOCOL_DEFINITION } from '../protocols/squat'
import { INLINE_LUNGE_PROTOCOL_DEFINITION } from '../protocols/inlineLunge'
import { INLINE_LUNGE_METRIC_DEFINITIONS } from '../protocols/inlineLunge/metrics'

export type EvidenceStatus = 'internal-tested' | 'provisional' | 'rejected'
export type ThresholdBasis = 'literature' | 'dataset' | 'expert' | 'heuristic' | 'user-calibrated'

export interface ProductTrace {
  id: string
  source: { ref: string; status: EvidenceStatus }
  concept: string
  signals: string[]
  metricId: string
  threshold: { id: string; basis: ThresholdBasis; interpretation: string }
  coachingRuleId: string
  copyStrength: 'observation' | 'suggestion'
  validationRequirement: string
  failureModes: string[]
}

const conceptFor = (id: string): string => id.split('.')[1] ?? 'movement'

export const SQUAT_PRODUCT_TRACES: ProductTrace[] = SQUAT_METRIC_DEFINITIONS.map((metric, index) => ({
  id: `trace.${metric.id}`,
  source: { ref: 'docs/research/03_Metric_Engine_Spec.md', status: 'provisional' },
  concept: conceptFor(metric.id),
  signals: [...SQUAT_PROTOCOL_DEFINITION.requiredLandmarks.map(String), 'timestamp'],
  metricId: metric.id,
  threshold: {
    id: `threshold.${metric.id}`,
    basis: 'heuristic',
    interpretation: 'Provisional product interpretation; not a clinical cutoff.',
  },
  coachingRuleId: SQUAT_PROTOCOL_DEFINITION.findingRuleIds[index % SQUAT_PROTOCOL_DEFINITION.findingRuleIds.length],
  copyStrength: metric.validationTier === 'production' ? 'suggestion' : 'observation',
  validationRequirement: `Human/device validation required for ${metric.id}.`,
  failureModes: ['low landmark visibility', 'view dependence', 'insufficient trusted repetitions'],
}))

export const INLINE_LUNGE_RESEARCH_TRACES: ProductTrace[] = INLINE_LUNGE_METRIC_DEFINITIONS.map((metric, index) => ({
  id: `trace.${metric.id}`,
  source: { ref: 'docs/research/INLINE_LUNGE_PROTOCOL_RESEARCH.md', status: 'provisional' },
  concept: conceptFor(metric.id),
  signals: ['declared lead side', 'lead foot x', 'pelvis midpoint y', 'lead hip/knee/ankle', 'timestamp'],
  metricId: metric.id,
  threshold: {
    id: `threshold.${metric.id}`,
    basis: 'heuristic',
    interpretation: 'Provisional research-runtime threshold; subject-held-out validation required before product use.',
  },
  coachingRuleId: INLINE_LUNGE_PROTOCOL_DEFINITION.findingRuleIds[index % INLINE_LUNGE_PROTOCOL_DEFINITION.findingRuleIds.length],
  copyStrength: 'observation',
  validationRequirement: `Independent labels and subject-held-out timed evaluation required for ${metric.id}.`,
  failureModes: ['incorrect declared lead side', 'cropped feet', 'out-of-plane motion', 'landmark dropout', 'camera movement'],
}))

export const REJECTED_PRODUCT_TRACES = [{
  id: 'trace.squat.kinetics.knee-load',
  source: { ref: 'docs/research/03_Metric_Engine_Spec.md', status: 'rejected' as const },
  reason: 'Single-RGB video cannot support internal joint-load claims.',
}]

export function serializeProductTraces(traces: readonly ProductTrace[]): string {
  return JSON.stringify([...traces].sort((a, b) => a.id.localeCompare(b.id)), null, 2)
}
