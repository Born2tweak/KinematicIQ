import { describe, expect, it } from 'vitest'
import { makeProvenance } from '../core/provenance'
import type { PostureSetSummary } from '../analysis/posture/postureCollector'
import { buildPostureMetricResults } from './postureMetrics'

const summary: PostureSetSummary = {
  repPosture: [],
  avgHingeRatio: 0.9,
  avgTrunkVariability: 4,
  avgNormalizedJerk: 60,
  avgForwardHeadAngle: 14,
  avgShoulderElevationRatio: 0.31,
  mostDeviantRep: null,
  sampleCoverage: 0.8,
}

describe('posture metrics (M21)', () => {
  it('emits forward-head and shoulder-elevation results with coverage-based confidence', () => {
    const results = buildPostureMetricResults(
      summary,
      makeProvenance({ captureSource: 'replay' }),
    )
    const byId = new Map(results.map((r) => [r.metricId, r]))
    expect(byId.get('posture.head.forward-angle')?.value).toBe(14)
    expect(byId.get('posture.shoulder.elevation-ratio')?.value).toBe(0.31)
    for (const r of results) {
      expect(r.confidence.value).toBeCloseTo(0.8, 5)
      expect(r.validationTier).toBe('experimental')
    }
  })

  it('abstains (null values) when the 3D stream produced no usable read', () => {
    const results = buildPostureMetricResults(
      { ...summary, avgForwardHeadAngle: null, avgShoulderElevationRatio: null, sampleCoverage: 0 },
      makeProvenance({ captureSource: 'replay' }),
    )
    expect(results.every((r) => r.value === null)).toBe(true)
    expect(results.every((r) => r.confidence.value === 0)).toBe(true)
  })

  it('emits nothing without a posture summary', () => {
    expect(
      buildPostureMetricResults(null, makeProvenance({ captureSource: 'live' })),
    ).toEqual([])
  })
})
