import { describe, expect, it } from 'vitest'
import { deriveCoaching } from './engine'
import type { ComponentScores, SetMetricsSummary } from '../session/types'
import type { SetQualityAssessment } from '../session/setQualityGate'

const components: ComponentScores = {
  depth: 40,
  trunkControl: 55,
  kneeTracking: 90,
  consistency: 88,
  symmetry: 92,
}

const metrics: SetMetricsSummary = {
  repCount: 5,
  reps: [],
  excludedRepNumbers: [],
  avgDepth: 120,
  avgTrunkLean: 40,
  depthCV: 12,
  minDepth: 108,
  maxDepth: 132,
  avgHipShift: 0.05,
  avgKneeAsymmetry: 4,
  avgShoulderAsymmetry: 0.01,
  overallConfidence: 82,
}

function quality(verdict: SetQualityAssessment['verdict']): SetQualityAssessment {
  return {
    verdict,
    reasons: [],
    captureFixes: [],
    untrustedReps: [],
    untrustedRepNumbers: [],
    trustedRepCount: 5,
    phantomCandidateCount: 0,
  }
}

describe('findings/engine', () => {
  it('fully abstains on an invalid set (zero findings and cues)', () => {
    const out = deriveCoaching({
      protocolId: 'squat',
      components,
      sessionConfidence: 'High',
      metrics,
      metricResults: [],
      quality: quality('invalid'),
    })
    expect(out.findings).toEqual([])
    expect(out.cues).toEqual([])
  })

  it('produces findings + cues for a valid squat set', () => {
    const out = deriveCoaching({
      protocolId: 'squat',
      components,
      sessionConfidence: 'High',
      metrics,
      metricResults: [],
      quality: quality('valid'),
    })
    expect(out.findings.length).toBeGreaterThan(0)
    expect(out.cues.length).toBe(out.findings.length)
  })

  it('returns nothing for planned protocols', () => {
    const out = deriveCoaching({
      protocolId: 'jump',
      components,
      sessionConfidence: 'High',
      metrics,
      metricResults: [],
      quality: quality('valid'),
    })
    expect(out).toEqual({ findings: [], cues: [] })
  })
})
