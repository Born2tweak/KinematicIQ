import type { MetricDefinition } from '../core/metric'
import type { ProductTrace } from './traceability'

export interface TraceabilityIssue { path: string; message: string }

export function lintTraceability(input: {
  traces: readonly ProductTrace[]
  metrics: readonly MetricDefinition[]
  findingRuleIds: readonly string[]
}): TraceabilityIssue[] {
  const issues: TraceabilityIssue[] = []
  const tracesByMetric = new Map(input.traces.map((trace) => [trace.metricId, trace]))
  for (const metric of input.metrics.filter((item) => item.included)) {
    const trace = tracesByMetric.get(metric.id)
    if (!trace) { issues.push({ path: `metrics.${metric.id}`, message: 'active metric is orphaned' }); continue }
    if (!trace.source.ref || !trace.source.status) issues.push({ path: trace.id, message: 'source citation and evidence status are required' })
    if (!trace.signals.length || !trace.failureModes.length || !trace.validationRequirement) issues.push({ path: trace.id, message: 'purpose, signals, failure modes, and validation gate are required' })
    if (!trace.threshold.basis) issues.push({ path: `${trace.id}.threshold`, message: 'threshold basis is unclassified' })
    if (metric.validationTier === 'experimental' && trace.copyStrength !== 'observation') issues.push({ path: `${trace.id}.copyStrength`, message: 'experimental metrics may only support observation copy' })
  }
  for (const ruleId of input.findingRuleIds) {
    if (!input.traces.some((trace) => trace.coachingRuleId === ruleId)) issues.push({ path: `rules.${ruleId}`, message: 'coaching rule has no measurable traced input' })
  }
  return issues
}
