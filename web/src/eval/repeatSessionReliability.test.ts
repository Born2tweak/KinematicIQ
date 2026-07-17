import { describe, expect, it } from 'vitest'
import { buildRepeatSessionReport, type RepeatSessionMeasurement } from './repeatSessionReliability'

const measurements = (count: number, validityGate: RepeatSessionMeasurement['validityGate'] = 'pass'): RepeatSessionMeasurement[] => Array.from({ length: count }, (_, index) => ['session-1', 'session-2'].map((sessionKey, session) => ({ participantKey: `participant-${index}`, sessionKey, metricId: 'count', setupId: 'consumer-setup', deviceClass: 'desktop', value: index + session * 0.1, validityGate, captureFailed: false, abstained: false }))).flat()
const plan = (real = false) => ({ version: 'reliability-v1', frozen: real, realRepeatSessions: real, expectedParticipants: 40, requiredCompleteParticipants: 40 as const, bootstrapSamples: 200, seed: 9, signedRoles: real ? ['statistics-owner', 'validation-owner'] : [] })

describe('repeat-session reliability', () => {
  it('reports ICC CI, SEM, MDC95, differences, and attrition deterministically', () => { const first = buildRepeatSessionReport(plan(true), measurements(40)); expect(first).toEqual(buildRepeatSessionReport(plan(true), measurements(40))); expect(first.metrics[0].icc95Ci).not.toBeNull(); expect(first.metrics[0].sem).not.toBeNull(); expect(first.metrics[0].mdc95).not.toBeNull(); expect(first.attrition).toBe(0); expect(first.disposition).toBe('ready-for-owner-disposition') })
  it('blocks synthetic/unfrozen evidence and reports under-recruitment', () => { const report = buildRepeatSessionReport(plan(), measurements(20)); expect(report.disposition).toBe('blocked'); expect(report.metrics[0].limitations.join(' ')).toContain('below frozen target'); expect(report.attrition).toBe(20) })
  it('never rehabilitates a metric that failed validity', () => { const report = buildRepeatSessionReport(plan(true), measurements(40, 'fail')); expect(report.metrics[0].eligible).toBe(false); expect(report.metrics[0].icc21).toBeNull(); expect(report.disposition).toBe('inconclusive') })
})
