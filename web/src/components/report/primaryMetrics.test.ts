import { describe, expect, it } from 'vitest'
import {
  MAX_PRIMARY_METRICS,
  dedupeKey,
  formatMetricValue,
  primaryMetrics,
} from './primaryMetrics'
import { makeConfidence } from '../../core/confidence'
import type { MetricResult } from '../../core/metric'
import type { SessionResult } from '../../session/types'

function metric(overrides: Partial<MetricResult> & { metricId: string }): MetricResult {
  return {
    label: overrides.metricId,
    value: 90,
    unit: 'deg',
    side: 'none',
    confidence: makeConfidence(0.9),
    provenance: {
      captureSource: 'live',
      protocolId: 'squat',
      algorithmVersion: 'test',
    },
    validationTier: 'heuristic',
    ...overrides,
  } as MetricResult
}

function invalidQuality(): SessionResult['quality'] {
  return {
    verdict: 'invalid',
    reasons: [],
    captureFixes: [],
    trustedRepCount: 0,
    untrustedReps: [],
    untrustedRepNumbers: [],
    phantomCandidateCount: 0,
  }
}

function session(overrides: Partial<SessionResult> = {}): SessionResult {
  return {
    protocolId: 'squat',
    metricResults: [],
    findings: [],
    quality: { ...invalidQuality(), verdict: 'valid', trustedRepCount: 3 },
    ...overrides,
  } as unknown as SessionResult
}

describe('formatMetricValue', () => {
  it('suffixes degrees and percent without a space', () => {
    expect(formatMetricValue(27.916, 'deg')).toBe('27.92°')
    expect(formatMetricValue(11, 'percent')).toBe('11%')
  })

  it('spaces a unit that reads as a word', () => {
    expect(formatMetricValue(3.5, 's')).toBe('3.5 s')
  })
})

describe('dedupeKey', () => {
  it('collapses per-side variants onto one concept', () => {
    expect(dedupeKey('squat.depth.knee.left')).toBe('squat.depth.knee')
    expect(dedupeKey('squat.depth.knee.right')).toBe('squat.depth.knee')
  })

  it('leaves a non-sided id alone', () => {
    expect(dedupeKey('squat.trunk.lean')).toBe('squat.trunk.lean')
  })
})

describe('primaryMetrics', () => {
  it('abstains entirely for an invalid set', () => {
    const result = session({
      metricResults: [metric({ metricId: 'squat.trunk.lean' })],
      quality: invalidQuality(),
    })
    expect(primaryMetrics(result)).toEqual([])
  })

  it('drops metrics that could not be computed rather than showing a zero', () => {
    const result = session({
      metricResults: [
        metric({ metricId: 'squat.trunk.lean', value: 43.6 }),
        metric({ metricId: 'squat.dorsiflexion', value: null }),
      ],
    })
    const rail = primaryMetrics(result)
    expect(rail.map((m) => m.metricId)).toEqual(['squat.trunk.lean'])
  })

  it('keeps one entry per concept, preferring the higher-confidence side', () => {
    const result = session({
      metricResults: [
        metric({
          metricId: 'squat.depth.knee.left',
          confidence: makeConfidence(0.3),
        }),
        metric({
          metricId: 'squat.depth.knee.right',
          confidence: makeConfidence(0.92),
        }),
      ],
    })
    const rail = primaryMetrics(result)
    expect(rail).toHaveLength(1)
    expect(rail[0].metricId).toBe('squat.depth.knee.right')
  })

  it('orders by confidence before anything else', () => {
    const result = session({
      metricResults: [
        metric({
          metricId: 'a.low',
          confidence: makeConfidence(0.2),
        }),
        metric({
          metricId: 'b.high',
          confidence: makeConfidence(0.95),
        }),
        metric({
          metricId: 'c.medium',
          confidence: makeConfidence(0.6),
        }),
      ],
    })
    expect(primaryMetrics(result).map((m) => m.metricId)).toEqual([
      'b.high',
      'c.medium',
      'a.low',
    ])
  })

  it('caps the rail at the reference capacity', () => {
    const result = session({
      metricResults: Array.from({ length: 9 }, (_, i) =>
        metric({ metricId: `squat.metric-${i}` }),
      ),
    })
    expect(primaryMetrics(result)).toHaveLength(MAX_PRIMARY_METRICS)
  })

  it('marks a one-sided read so the rail can qualify it', () => {
    const result = session({
      metricResults: [metric({ metricId: 'squat.knee.left', side: 'left' })],
    })
    expect(primaryMetrics(result)[0].sided).toBe(true)
  })
})
