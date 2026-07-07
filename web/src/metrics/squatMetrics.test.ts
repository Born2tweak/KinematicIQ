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
  avgRepDurationMs: 2400,
  repDurationCV: 12,
  avgDescentMs: 1100,
  avgAscentMs: 900,
  cadenceRepsPerMin: 20,
  avgMinHipAngle: 78,
  avgMinAnkleAngle: 102,
  avgHipPathLength: 0.42,
  avgPeakHipSpeed: 0.55,
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
    // Tempo metrics (M18): durations surface in seconds.
    expect(byId.get('squat.tempo.rep-duration')).toBe(2.4)
    expect(byId.get('squat.tempo.descent')).toBe(1.1)
    expect(byId.get('squat.tempo.ascent')).toBe(0.9)
    expect(byId.get('squat.tempo.cadence')).toBe(20)
    // ROM proxies (M19).
    expect(byId.get('squat.rom.hip-flexion')).toBe(78)
    expect(byId.get('squat.rom.ankle-dorsiflexion')).toBe(102)
    // Path & speed proxies (M20).
    expect(byId.get('squat.path.hip-path-length')).toBe(0.42)
    expect(byId.get('squat.path.peak-hip-speed')).toBe(0.55)
  })

  it('tempo metrics abstain on pre-M18 summaries (fields absent)', () => {
    const legacy = { ...summary }
    delete legacy.avgRepDurationMs
    delete legacy.avgDescentMs
    delete legacy.avgAscentMs
    delete legacy.cadenceRepsPerMin
    const results = buildSquatMetricResults(legacy, makeProvenance({ captureSource: 'replay' }))
    const byId = new Map(results.map((r) => [r.metricId, r.value]))
    expect(byId.get('squat.tempo.rep-duration')).toBeNull()
    expect(byId.get('squat.tempo.descent')).toBeNull()
    expect(byId.get('squat.tempo.ascent')).toBeNull()
    expect(byId.get('squat.tempo.cadence')).toBeNull()
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

  it('an abstaining metric never carries the session confidence', () => {
    // 2026-07-06 live export: knee asymmetry was null (right knee untracked)
    // yet shipped with a High confidence chip — a false claim.
    const sparse: SetMetricsSummary = { ...summary, avgKneeAsymmetry: null }
    const results = buildSquatMetricResults(sparse, makeProvenance({ captureSource: 'replay' }))
    const asym = results.find((r) => r.metricId === 'squat.symmetry.knee-asymmetry')!
    expect(asym.value).toBeNull()
    expect(asym.confidence.value).toBe(0)
    expect(asym.confidence.level).toBe('Low')
    // Metrics that DID read still carry the session confidence.
    const depth = results.find((r) => r.metricId === 'squat.depth.min-knee-angle')!
    expect(depth.confidence.value).toBeCloseTo(0.82, 5)
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
