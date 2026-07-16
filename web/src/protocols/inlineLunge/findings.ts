import type { Finding } from '../../core/finding'
import type { MetricResult } from '../../core/metric'

export function deriveInlineLungeResearchFindings(metrics: readonly MetricResult[]): Finding[] {
  const count = metrics.find((metric) => metric.metricId === 'forwardLungeStrideReturn.trial.count')
  const duration = metrics.find((metric) => metric.metricId === 'forwardLungeStrideReturn.tempo.trial-duration')
  const consistency = metrics.find((metric) => metric.metricId === 'forwardLungeStrideReturn.tempo.duration-cv')
  const findings: Finding[] = []
  if (count?.value !== null && count?.value !== undefined) findings.push({
    id: 'forwardLungeStrideReturn.completion.observed-trials', question: 'movement-completion',
    statement: `${count.value} complete Forward Lunge ${count.value === 1 ? 'trial was' : 'trials were'} observed in this set.`,
    evidence: [{ metricId: count.metricId, observed: `${count.value} complete step-to-return trials` }], confidence: count.confidence, priority: 'primary',
    provenance: { ruleId: 'rule.forwardLungeStrideReturn.completion', sourceDocs: ['docs/research/INLINE_LUNGE_PROTOCOL_RESEARCH.md'], reviewStatus: 'internally-tested' },
  })
  if (duration?.value !== null && duration?.value !== undefined) findings.push({
    id: 'forwardLungeStrideReturn.timing.average-duration', question: 'strategy-selection',
    statement: `Complete trials averaged ${duration.value.toFixed(2)} seconds from step to stable return in this set.`,
    evidence: [{ metricId: duration.metricId, observed: `${duration.value.toFixed(2)} s average` }], confidence: duration.confidence, priority: 'secondary',
    provenance: { ruleId: 'rule.forwardLungeStrideReturn.timing', sourceDocs: ['docs/validation/INLINE_LUNGE_LABELING_PROTOCOL.md'], reviewStatus: 'internally-tested' },
  })
  if (consistency?.value !== null && consistency?.value !== undefined) findings.push({
    id: 'forwardLungeStrideReturn.timing.within-set-variation', question: 'strategy-selection',
    statement: `Trial-duration variation was ${consistency.value.toFixed(1)}% within this set.`,
    evidence: [{ metricId: consistency.metricId, observed: `${consistency.value.toFixed(1)}% duration CV` }], confidence: consistency.confidence, priority: 'informational',
    provenance: { ruleId: 'rule.forwardLungeStrideReturn.consistency', sourceDocs: ['docs/research/INLINE_LUNGE_PROTOCOL_RESEARCH.md'], reviewStatus: 'internally-tested' },
  })
  return findings.slice(0, 3)
}
