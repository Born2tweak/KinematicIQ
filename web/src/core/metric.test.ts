import { describe, expect, it } from 'vitest'
import { hasValue, type MetricDefinition, type MetricResult } from './metric'
import { makeConfidence } from './confidence'
import { makeProvenance } from './provenance'

const depthDef: MetricDefinition = {
  id: 'squat.depth.min-knee-angle',
  label: 'Squat depth (min knee angle)',
  unit: 'deg',
  evidenceCategory: 'kinematic-geometry',
  validationTier: 'production',
  confidenceBasis: ['landmark-visibility', 'sample-coverage'],
  description: 'Deepest knee flexion reached at the bottom of the rep.',
  included: true,
}

const excludedDef: MetricDefinition = {
  id: 'squat.kinetics.knee-load',
  label: 'Knee joint load',
  unit: 'ratio',
  evidenceCategory: 'kinematic-geometry',
  validationTier: 'experimental',
  confidenceBasis: [],
  description: 'Internal joint load.',
  exclusionReason: 'Kinetics are not defensible from single RGB (MD #3 §12).',
  included: false,
}

function makeResult(value: number | null): MetricResult {
  return {
    metricId: depthDef.id,
    label: depthDef.label,
    value,
    unit: 'deg',
    side: 'bilateral',
    confidence: makeConfidence(0.8, ['landmark-visibility']),
    provenance: makeProvenance({ captureSource: 'replay' }),
    validationTier: 'production',
  }
}

describe('core/metric', () => {
  it('models included metric definitions', () => {
    expect(depthDef.included).toBe(true)
    expect(depthDef.validationTier).toBe('production')
  })

  it('keeps excluded metrics with a documented reason, never silently dropped', () => {
    expect(excludedDef.included).toBe(false)
    expect(excludedDef.exclusionReason).toContain('single RGB')
  })

  it('hasValue narrows a computed result to a number', () => {
    const computed = makeResult(92)
    const abstained = makeResult(null)
    expect(hasValue(computed)).toBe(true)
    expect(hasValue(abstained)).toBe(false)
    if (hasValue(computed)) {
      // Type narrows: value is number here.
      expect(computed.value.toFixed(0)).toBe('92')
    }
  })

  it('carries confidence, provenance, and validation tier on every result', () => {
    const r = makeResult(88)
    expect(r.confidence.level).toBe('High')
    expect(r.provenance.captureSource).toBe('replay')
    expect(r.validationTier).toBe('production')
  })
})
