import { describe, expect, it } from 'vitest'
import type { SetMetricsSummary } from '../../session/types'
import { buildPostureConcepts } from './postureConcepts'

function summary(overrides: Partial<SetMetricsSummary> = {}): SetMetricsSummary {
  return {
    repCount: 5,
    reps: [],
    avgDepth: 95,
    avgTrunkLean: 32,
    depthCV: 4,
    minDepth: 88,
    maxDepth: 104,
    avgHipShift: 0.015,
    avgKneeAsymmetry: 5,
    avgShoulderAsymmetry: 0.01,
    overallConfidence: 90,
    ...overrides,
  }
}

describe('buildPostureConcepts', () => {
  it('returns all five Phase 1 concepts in stable order', () => {
    const concepts = buildPostureConcepts(summary(), 'High')
    expect(concepts.map((c) => c.id)).toEqual([
      'workingDepth',
      'tallChest',
      'evenBase',
      'evenDrive',
      'repeatable',
    ])
  })

  it('marks every concept ok for a clean set and carries session confidence', () => {
    const concepts = buildPostureConcepts(summary(), 'High')
    expect(concepts.every((c) => c.status === 'ok')).toBe(true)
    expect(concepts.every((c) => c.confidence === 'High')).toBe(true)
  })

  it('flags shallow depth as watch with the measured angle in the copy', () => {
    const concepts = buildPostureConcepts(summary({ avgDepth: 131 }), 'Medium')
    const depth = concepts.find((c) => c.id === 'workingDepth')
    expect(depth?.status).toBe('watch')
    expect(depth?.observation).toContain('131°')
    expect(depth?.confidence).toBe('Medium')
  })

  it('flags heavy trunk lean as watch', () => {
    const concepts = buildPostureConcepts(summary({ avgTrunkLean: 52 }), 'High')
    expect(concepts.find((c) => c.id === 'tallChest')?.status).toBe('watch')
  })

  it('flags off-center hips and uneven knees as watch', () => {
    const concepts = buildPostureConcepts(
      summary({ avgHipShift: 0.08, avgKneeAsymmetry: 18 }),
      'High',
    )
    expect(concepts.find((c) => c.id === 'evenBase')?.status).toBe('watch')
    expect(concepts.find((c) => c.id === 'evenDrive')?.status).toBe('watch')
  })

  it('flags inconsistent depth as watch', () => {
    const concepts = buildPostureConcepts(summary({ depthCV: 14 }), 'High')
    expect(concepts.find((c) => c.id === 'repeatable')?.status).toBe('watch')
  })

  it('degrades missing metrics to unavailable with low confidence', () => {
    const concepts = buildPostureConcepts(
      summary({
        avgDepth: null,
        avgTrunkLean: null,
        avgHipShift: null,
        avgKneeAsymmetry: null,
        depthCV: null,
      }),
      'High',
    )
    expect(concepts.every((c) => c.status === 'unavailable')).toBe(true)
    expect(concepts.every((c) => c.confidence === 'Low')).toBe(true)
  })

  it('uses observation language, never medical claims', () => {
    const concepts = buildPostureConcepts(
      summary({
        avgDepth: 140,
        avgTrunkLean: 65,
        avgHipShift: 0.12,
        avgKneeAsymmetry: 30,
        depthCV: 25,
      }),
      'Low',
    )
    const text = concepts.map((c) => c.observation).join(' ')
    for (const banned of ['injur', 'risk', 'diagnos', 'abnormal', 'danger']) {
      expect(text.toLowerCase()).not.toContain(banned)
    }
    // Set-scoped observation language is present on flagged concepts.
    expect(text).toContain('in this set')
  })
})
