import { describe, expect, it } from 'vitest'
import {
  SQUAT_EXCLUDED_METRICS,
  SQUAT_METRIC_DEFINITIONS,
  buildSquatMetricResults,
} from './squatMetrics'
import {
  getExcludedMetricDefinitions,
  getMetricDefinition,
  getMetricDefinitions,
} from './registry'
import { hasValue } from '../core/metric'
import { makeProvenance } from '../core/provenance'
import type { SetMetricsSummary } from '../session/types'

const summary: SetMetricsSummary = {
  repCount: 5,
  reps: [],
  excludedRepNumbers: [],
  avgDepth: 96,
  avgTrunkLean: 22,
  depthCV: 6.5,
  minDepth: 90,
  maxDepth: 104,
  avgHipShift: 0.03,
  avgKneeAsymmetry: 8,
  avgShoulderAsymmetry: 0.02,
  overallConfidence: 82,
}

describe('metrics/squatMetrics', () => {
  it('emits one MetricResult per included definition', () => {
    const results = buildSquatMetricResults(summary, makeProvenance({ captureSource: 'replay' }))
    expect(results).toHaveLength(SQUAT_METRIC_DEFINITIONS.length)
    expect(results.map((r) => r.metricId).sort()).toEqual(
      SQUAT_METRIC_DEFINITIONS.map((d) => d.id).sort(),
    )
  })

  it('keyed values agree with the legacy summary', () => {
    const results = buildSquatMetricResults(summary, makeProvenance({ captureSource: 'replay' }))
    const byId = new Map(results.map((r) => [r.metricId, r.value]))
    expect(byId.get('squat.depth.min-knee-angle')).toBe(96)
    expect(byId.get('squat.depth.cv')).toBe(6.5)
    expect(byId.get('squat.trunk.avg-lean')).toBe(22)
    expect(byId.get('squat.symmetry.hip-shift')).toBe(0.03)
    expect(byId.get('squat.symmetry.knee-asymmetry')).toBe(8)
    expect(byId.get('squat.symmetry.shoulder-asymmetry')).toBe(0.02)
  })

  it('every result carries confidence, provenance, and validation tier', () => {
    const results = buildSquatMetricResults(summary, makeProvenance({ captureSource: 'live' }))
    for (const r of results) {
      expect(r.confidence.value).toBeCloseTo(0.82, 5)
      expect(r.confidence.basis.length).toBeGreaterThan(0)
      expect(r.provenance.captureSource).toBe('live')
      expect(['production', 'experimental']).toContain(r.validationTier)
    }
  })

  it('passes null values through as abstentions, not zeros', () => {
    const sparse: SetMetricsSummary = { ...summary, avgTrunkLean: null, depthCV: null }
    const results = buildSquatMetricResults(sparse, makeProvenance({ captureSource: 'replay' }))
    const trunk = results.find((r) => r.metricId === 'squat.trunk.avg-lean')!
    expect(hasValue(trunk)).toBe(false)
    expect(trunk.value).toBeNull()
  })

  it('keeps excluded metrics with documented single-RGB reasons', () => {
    expect(SQUAT_EXCLUDED_METRICS.length).toBeGreaterThanOrEqual(2)
    for (const def of SQUAT_EXCLUDED_METRICS) {
      expect(def.included).toBe(false)
      expect(def.exclusionReason).toBeTruthy()
    }
  })
})

describe('metrics/registry', () => {
  it('resolves squat metric definitions', () => {
    expect(getMetricDefinitions('squat').length).toBe(SQUAT_METRIC_DEFINITIONS.length)
    expect(getExcludedMetricDefinitions('squat').length).toBe(
      SQUAT_EXCLUDED_METRICS.length,
    )
  })

  it('resolves a single definition by id (included or excluded)', () => {
    expect(getMetricDefinition('squat', 'squat.depth.cv')?.unit).toBe('percent')
    expect(getMetricDefinition('squat', 'squat.kinetics.knee-load')?.included).toBe(
      false,
    )
    expect(getMetricDefinition('squat', 'nope')).toBeUndefined()
  })

  it('returns empty for unpopulated protocols', () => {
    expect(getMetricDefinitions('jump')).toEqual([])
  })
})
