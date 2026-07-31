import { makeConfidence } from '../../core/confidence'
import type { MetricDefinition, MetricResult } from '../../core/metric'
import type { Provenance } from '../../core/provenance'
import { UNVALIDATED_CONFIDENCE_CEILING } from './profile'
import type { InlineLungeSide, InlineLungeTrial } from './types'

export const INLINE_LUNGE_METRIC_DEFINITIONS: MetricDefinition[] = [
  { id: 'forwardLungeStrideReturn.trial.count', label: 'Complete trials', unit: 'count', evidenceCategory: 'temporal', validationTier: 'experimental', confidenceBasis: ['protocol-compliance', 'sample-coverage'], description: 'Complete step-to-return trials observed in this set.', included: true },
  { id: 'forwardLungeStrideReturn.tempo.trial-duration', label: 'Trial duration (avg)', unit: 's', evidenceCategory: 'temporal', validationTier: 'experimental', confidenceBasis: ['temporal-stability', 'sample-coverage'], description: 'Average time from step initiation to stable return across complete trials.', included: true },
  { id: 'forwardLungeStrideReturn.tempo.descent', label: 'Descent duration (avg)', unit: 's', evidenceCategory: 'temporal', validationTier: 'experimental', confidenceBasis: ['temporal-stability', 'sample-coverage'], description: 'Average time from descent start to the bottom event in complete trials.', included: true },
  { id: 'forwardLungeStrideReturn.tempo.ascent', label: 'Ascent duration (avg)', unit: 's', evidenceCategory: 'temporal', validationTier: 'experimental', confidenceBasis: ['temporal-stability', 'sample-coverage'], description: 'Average time from ascent start to stable return in complete trials.', included: true },
  { id: 'forwardLungeStrideReturn.knee.bottom-angle', label: 'Lead-knee angle at bottom (avg)', unit: 'deg', evidenceCategory: 'kinematic-geometry', validationTier: 'experimental', confidenceBasis: ['landmark-visibility', 'protocol-compliance'], description: 'Average projected lead-knee angle at the detected bottom, from this side view; research estimate only.', included: true },
  { id: 'forwardLungeStrideReturn.tempo.duration-cv', label: 'Trial-duration consistency (CV)', unit: 'percent', evidenceCategory: 'variability', validationTier: 'experimental', confidenceBasis: ['temporal-stability', 'sample-coverage'], description: 'Within-set variation in trial duration; emitted only with at least three complete trials.', included: true },
]

/**
 * Above this, the lead knee did not meaningfully bend at the detected bottom.
 *
 * The angle is the interior hip–knee–ankle angle, so 180° is a straight leg and
 * a forward lunge that actually descends reads somewhere around 80–120°. A
 * value in the 170s does not mean "shallow lunge"; it means the geometry the
 * tracker saw is not a lunge bottom at all — the pelvis dropped and the foot
 * moved forward while the lead leg stayed straight.
 *
 * The segmenter finds the bottom from pelvis drop and foot displacement and
 * never consults the knee, so it will happily complete six phases over exactly
 * that geometry. This gate is what stops the resulting number from being
 * printed next to the words "at bottom" as though it measured depth.
 *
 * 150° is deliberately permissive. It is not a form threshold and must never
 * be tuned toward one — it is the line past which the *measurement* is
 * self-contradictory, and any value below it is reported without comment.
 */
export const LEAD_KNEE_FLEXION_IMPLAUSIBLE_ABOVE_DEG = 150

const mean = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null
const cv = (values: number[]) => {
  const average = mean(values)
  if (average === null || average === 0 || values.length < 3) return null
  const variance = values.reduce((sum, value) => sum + (value - average) ** 2, 0) / values.length
  return Math.sqrt(variance) / average * 100
}

/**
 * Average lead-knee angle at the detected bottom, or null when that average
 * would describe a leg that never bent.
 *
 * Abstaining is the honest output here: there is no correction to apply, and
 * reporting the number with a caveat still puts a depth-shaped figure in front
 * of an athlete. The quality reason attached alongside says what happened.
 */
export function leadKneeAngleAtBottom(
  completed: readonly InlineLungeTrial[],
): number | null {
  const angles = completed.flatMap((trial) =>
    trial.leadKneeAngleAtBottom === null ? [] : [trial.leadKneeAngleAtBottom],
  )
  const average = mean(angles)
  if (average === null) return null
  return average > LEAD_KNEE_FLEXION_IMPLAUSIBLE_ABOVE_DEG ? null : average
}

export function buildInlineLungeMetricResults(trials: readonly InlineLungeTrial[], leadSide: InlineLungeSide, provenance: Provenance): MetricResult[] {
  const completed = trials.filter((trial) => trial.status === 'completed')
  const durations = completed.map((trial) => (trial.returnTimestamp - trial.stepTimestamp) / 1000)
  const values = new Map<string, number | null>([
    ['forwardLungeStrideReturn.trial.count', completed.length],
    ['forwardLungeStrideReturn.tempo.trial-duration', mean(durations)],
    ['forwardLungeStrideReturn.tempo.descent', mean(completed.map((trial) => (trial.bottomTimestamp - trial.descentTimestamp) / 1000))],
    ['forwardLungeStrideReturn.tempo.ascent', mean(completed.map((trial) => (trial.returnTimestamp - trial.ascentTimestamp) / 1000))],
    ['forwardLungeStrideReturn.knee.bottom-angle', leadKneeAngleAtBottom(completed)],
    ['forwardLungeStrideReturn.tempo.duration-cv', cv(durations)],
  ])
  const coverage = completed.length ? mean(completed.map((trial) => trial.readableFrameRatio)) ?? 0 : 0
  return INLINE_LUNGE_METRIC_DEFINITIONS.map((definition) => {
    const value = values.get(definition.id) ?? null
    return {
      metricId: definition.id,
      label: definition.label,
      value,
      unit: definition.unit,
      side: definition.id.includes('knee') ? leadSide : 'none',
      confidence: makeConfidence(value === null ? 0 : Math.min(UNVALIDATED_CONFIDENCE_CEILING, coverage), definition.confidenceBasis),
      provenance,
      validationTier: definition.validationTier,
      qualityFlags: value === null ? ['insufficient-research-evidence'] : ['research-only'],
    }
  })
}
