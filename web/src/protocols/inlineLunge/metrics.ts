import { makeConfidence } from '../../core/confidence'
import type { MetricDefinition, MetricResult } from '../../core/metric'
import type { Provenance } from '../../core/provenance'
import type { InlineLungeSide, InlineLungeTrial } from './types'

export const INLINE_LUNGE_METRIC_DEFINITIONS: MetricDefinition[] = [
  { id: 'forwardLungeStrideReturn.trial.count', label: 'Complete trials', unit: 'count', evidenceCategory: 'temporal', validationTier: 'experimental', confidenceBasis: ['protocol-compliance', 'sample-coverage'], description: 'Complete step-to-return trials observed in this set.', included: true },
  { id: 'forwardLungeStrideReturn.tempo.trial-duration', label: 'Trial duration (avg)', unit: 's', evidenceCategory: 'temporal', validationTier: 'experimental', confidenceBasis: ['temporal-stability', 'sample-coverage'], description: 'Average time from step initiation to stable return across complete trials.', included: true },
  { id: 'forwardLungeStrideReturn.tempo.descent', label: 'Descent duration (avg)', unit: 's', evidenceCategory: 'temporal', validationTier: 'experimental', confidenceBasis: ['temporal-stability', 'sample-coverage'], description: 'Average time from descent start to the bottom event in complete trials.', included: true },
  { id: 'forwardLungeStrideReturn.tempo.ascent', label: 'Ascent duration (avg)', unit: 's', evidenceCategory: 'temporal', validationTier: 'experimental', confidenceBasis: ['temporal-stability', 'sample-coverage'], description: 'Average time from ascent start to stable return in complete trials.', included: true },
  { id: 'forwardLungeStrideReturn.knee.bottom-angle', label: 'Lead-knee angle at bottom (avg)', unit: 'deg', evidenceCategory: 'kinematic-geometry', validationTier: 'experimental', confidenceBasis: ['landmark-visibility', 'protocol-compliance'], description: 'Average projected lead-knee angle at the detected bottom, from this side view; research estimate only.', included: true },
  { id: 'forwardLungeStrideReturn.tempo.duration-cv', label: 'Trial-duration consistency (CV)', unit: 'percent', evidenceCategory: 'variability', validationTier: 'experimental', confidenceBasis: ['temporal-stability', 'sample-coverage'], description: 'Within-set variation in trial duration; emitted only with at least three complete trials.', included: true },
]

const mean = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null
const cv = (values: number[]) => {
  const average = mean(values)
  if (average === null || average === 0 || values.length < 3) return null
  const variance = values.reduce((sum, value) => sum + (value - average) ** 2, 0) / values.length
  return Math.sqrt(variance) / average * 100
}

export function buildInlineLungeMetricResults(trials: readonly InlineLungeTrial[], leadSide: InlineLungeSide, provenance: Provenance): MetricResult[] {
  const completed = trials.filter((trial) => trial.status === 'completed')
  const durations = completed.map((trial) => (trial.returnTimestamp - trial.stepTimestamp) / 1000)
  const values = new Map<string, number | null>([
    ['forwardLungeStrideReturn.trial.count', completed.length],
    ['forwardLungeStrideReturn.tempo.trial-duration', mean(durations)],
    ['forwardLungeStrideReturn.tempo.descent', mean(completed.map((trial) => (trial.bottomTimestamp - trial.descentTimestamp) / 1000))],
    ['forwardLungeStrideReturn.tempo.ascent', mean(completed.map((trial) => (trial.returnTimestamp - trial.ascentTimestamp) / 1000))],
    ['forwardLungeStrideReturn.knee.bottom-angle', mean(completed.flatMap((trial) => trial.leadKneeAngleAtBottom === null ? [] : [trial.leadKneeAngleAtBottom]))],
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
      confidence: makeConfidence(value === null ? 0 : Math.min(0.74, coverage), definition.confidenceBasis),
      provenance,
      validationTier: definition.validationTier,
      qualityFlags: value === null ? ['insufficient-research-evidence'] : ['research-only'],
    }
  })
}
