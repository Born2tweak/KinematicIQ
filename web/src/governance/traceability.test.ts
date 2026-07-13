import { describe, expect, it } from 'vitest'
import { SQUAT_METRIC_DEFINITIONS } from '../metrics/squatMetrics'
import { SQUAT_PROTOCOL_DEFINITION } from '../protocols/squat'
import { SQUAT_PRODUCT_TRACES, serializeProductTraces } from './traceability'
import { lintTraceability } from './traceabilityLint'

describe('research-to-product traceability', () => {
  it('covers all active squat metrics and rules deterministically', () => {
    expect(lintTraceability({ traces: SQUAT_PRODUCT_TRACES, metrics: SQUAT_METRIC_DEFINITIONS, findingRuleIds: SQUAT_PROTOCOL_DEFINITION.findingRuleIds })).toEqual([])
    expect(serializeProductTraces(SQUAT_PRODUCT_TRACES)).toBe(serializeProductTraces([...SQUAT_PRODUCT_TRACES].reverse()))
  })

  it('rejects orphan metrics and over-strength experimental copy', () => {
    const malformed = SQUAT_PRODUCT_TRACES.slice(1).map((trace) =>
      trace.metricId === 'squat.trunk.avg-lean'
        ? { ...trace, copyStrength: 'suggestion' as const }
        : trace,
    )
    const issues = lintTraceability({ traces: malformed, metrics: SQUAT_METRIC_DEFINITIONS, findingRuleIds: SQUAT_PROTOCOL_DEFINITION.findingRuleIds })
    expect(issues.some((issue) => /orphaned/.test(issue.message))).toBe(true)
    expect(issues.some((issue) => /observation copy/.test(issue.message))).toBe(true)
  })
})
