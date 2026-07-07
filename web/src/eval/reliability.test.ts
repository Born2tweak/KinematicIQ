import { describe, expect, it } from 'vitest'
import {
  mdc95Like,
  mean,
  sampleStandardDeviation,
  semLike,
  summarizeMetricReliability,
  summarizeReliability,
  type ReliabilityMeasurement,
} from './reliability'

describe('eval/reliability (M49)', () => {
  it('computes mean, sample SD, SEM-like, and MDC95-like estimates', () => {
    const values = [10, 12, 14]
    expect(mean(values)).toBe(12)
    expect(sampleStandardDeviation(values)).toBeCloseTo(2, 6)
    expect(semLike(values)).toBeCloseTo(2 / Math.sqrt(3), 6)
    expect(mdc95Like(values)).toBeCloseTo(
      1.96 * Math.sqrt(2) * (2 / Math.sqrt(3)),
      6,
    )
  })

  it('excludes missing and non-finite values deterministically', () => {
    const values = [10, null, Number.NaN, 14, undefined]
    expect(mean(values)).toBe(12)
    expect(sampleStandardDeviation(values)).toBeCloseTo(Math.sqrt(8), 6)
  })

  it('returns null estimates for empty or insufficient data, never zeros', () => {
    expect(mean([])).toBeNull()
    expect(sampleStandardDeviation([42])).toBeNull()
    expect(semLike([42])).toBeNull()
    expect(mdc95Like([42])).toBeNull()
  })

  it('summarizes repeated participant sessions by metric', () => {
    const rows: ReliabilityMeasurement[] = [
      { participantId: 'p1', sessionId: 'a', metricId: 'depth', value: 90 },
      { participantId: 'p1', sessionId: 'b', metricId: 'depth', value: 94 },
      { participantId: 'p2', sessionId: 'a', metricId: 'depth', value: 80 },
      { participantId: 'p2', sessionId: 'b', metricId: 'depth', value: 84 },
      { participantId: 'p3', sessionId: 'a', metricId: 'depth', value: null },
      { participantId: 'p3', sessionId: 'b', metricId: 'depth', value: 100 },
      { participantId: 'p1', sessionId: 'a', metricId: 'tempo', value: 1.2 },
    ]

    const summary = summarizeMetricReliability(rows, 'depth')
    expect(summary.observationCount).toBe(5)
    expect(summary.participantCount).toBe(3)
    expect(summary.repeatPairCount).toBe(2)
    expect(summary.mean).toBeCloseTo(89.6, 6)
    expect(summary.meanAbsoluteRepeatDifference).toBe(4)
    expect(summary.limitations.join(' ')).toMatch(/descriptive estimates/i)
  })

  it('sorts metric summaries for stable offline reports', () => {
    const summaries = summarizeReliability([
      { participantId: 'p1', sessionId: 'a', metricId: 'tempo', value: 1.2 },
      { participantId: 'p1', sessionId: 'a', metricId: 'depth', value: 90 },
    ])
    expect(summaries.map((s) => s.metricId)).toEqual(['depth', 'tempo'])
  })

  it('names limitations when repeat sessions are unavailable', () => {
    const summary = summarizeMetricReliability(
      [{ participantId: 'p1', sessionId: 'a', metricId: 'depth', value: 90 }],
      'depth',
    )
    expect(summary.sampleStandardDeviation).toBeNull()
    expect(summary.meanAbsoluteRepeatDifference).toBeNull()
    expect(summary.limitations).toContain(
      'Fewer than two usable observations; variability is not estimated.',
    )
    expect(summary.limitations).toContain(
      'No repeated participant sessions; repeat difference is not estimated.',
    )
  })
})
