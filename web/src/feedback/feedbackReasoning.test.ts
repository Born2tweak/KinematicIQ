import { describe, expect, it } from 'vitest'
import type { SetMetricsSummary } from '../session/types'
import { buildBiomechanicalCue } from './feedbackReasoning'
import { sampleRep } from '../test/fixtures/poseFixtures'

function metrics(overrides: Partial<SetMetricsSummary>): SetMetricsSummary {
  return {
    repCount: 3,
    reps: [sampleRep({ repNumber: 1 }), sampleRep({ repNumber: 2 }), sampleRep({ repNumber: 3 })],
    avgDepth: 125,
    avgTrunkLean: 28,
    depthCV: 6,
    minDepth: 118,
    maxDepth: 132,
    avgHipShift: 0.02,
    avgKneeAsymmetry: 4,
    avgShoulderAsymmetry: 0.01,
    overallConfidence: 82,
    excludedRepNumbers: [],
    ...overrides,
  }
}

describe('feedbackReasoning', () => {
  it('explains shallow depth with a measured observation', () => {
    const cue = buildBiomechanicalCue(
      'depth',
      metrics({
        avgDepth: 125,
        minDepth: 120,
        maxDepth: 130,
        depthCV: 4,
      }),
      'High',
    )
    expect(cue.observed).toMatch(/125°|above roughly parallel/i)
    expect(cue.whyItMatters).toMatch(/hip|depth|quads|glutes/i)
    expect(cue.tryNext).toMatch(/hips slightly lower|hips back/i)
    expect(cue.confidenceNote).toBeNull()
  })

  it('explains knee tracking asymmetry with sided observation', () => {
    const cue = buildBiomechanicalCue(
      'kneeTracking',
      metrics({
        avgKneeAsymmetry: 18,
        reps: [
          sampleRep({ minLeftKneeAngle: 88, minRightKneeAngle: 108 }),
          sampleRep({ minLeftKneeAngle: 90, minRightKneeAngle: 110 }),
          sampleRep({ minLeftKneeAngle: 92, minRightKneeAngle: 112 }),
        ],
      }),
      'Medium',
    )
    expect(cue.observed).toMatch(/left knee|18°/i)
    expect(cue.whyItMatters).toMatch(/even|not a medical/i)
    expect(cue.whyItMatters).not.toMatch(/load|force|stress|torque/i)
    expect(cue.tryNext).toMatch(/knee|feet|second toe/i)
    expect(cue.confidenceNote).toMatch(/moderate|directional/i)
  })

  it('reframes an implausible knee asymmetry as a camera-setup check at Low confidence', () => {
    // 2026-07-06 batch eval: a 61° avg L/R difference on an angled stock clip
    // was coached at High confidence — a viewing-angle artifact, not movement.
    const cue = buildBiomechanicalCue(
      'kneeTracking',
      metrics({
        avgKneeAsymmetry: 61,
        reps: [
          sampleRep({ minLeftKneeAngle: 150, minRightKneeAngle: 89 }),
          sampleRep({ minLeftKneeAngle: 152, minRightKneeAngle: 91 }),
          sampleRep({ minLeftKneeAngle: 148, minRightKneeAngle: 87 }),
        ],
      }),
      'High',
    )
    expect(cue.confidence).toBe('Low')
    expect(cue.observed).toMatch(/camera angle/i)
    expect(cue.confidenceNote).toMatch(/camera-setup check/i)
    expect(cue.tryNext).toMatch(/re-record|facing the camera/i)
    // No confident movement coaching from an artifact read.
    expect(cue.tryNext).not.toMatch(/spread the floor/i)
  })

  it('caps every cue at Low confidence when its primary read is missing, even at High session confidence', () => {
    const sparse = metrics({
      repCount: 1,
      reps: [sampleRep({ repNumber: 1 })],
      avgDepth: null,
      avgTrunkLean: null,
      depthCV: null,
      minDepth: null,
      maxDepth: null,
      avgHipShift: null,
      avgKneeAsymmetry: null,
    })
    const issueKeys = [
      'depth',
      'trunkControl',
      'kneeTracking',
      'consistency',
      'symmetry',
    ] as const

    for (const key of issueKeys) {
      const cue = buildBiomechanicalCue(key, sparse, 'High')
      expect(cue.confidence, `${key} cue must not inherit session confidence`).toBe('Low')
      expect(cue.confidenceNote, `${key} cue must explain the missing read`).toMatch(
        /did not capture enough/i,
      )
    }
  })

  it('keeps session confidence when the claim data exists', () => {
    const cue = buildBiomechanicalCue('depth', metrics({}), 'High')
    expect(cue.confidence).toBe('High')
    expect(cue.confidenceNote).toBeNull()
  })

  it('never uses kinetic or score language in any coaching copy', () => {
    const issueKeys = [
      'depth',
      'trunkControl',
      'kneeTracking',
      'consistency',
      'symmetry',
    ] as const

    // Representative inputs: clean set, problem set (triggers the flagged
    // branches of every builder), and a sparse set (fallback branches).
    const inputs: SetMetricsSummary[] = [
      metrics({}),
      metrics({
        avgDepth: 130,
        minDepth: 120,
        maxDepth: 140,
        depthCV: 14,
        avgTrunkLean: 45,
        avgHipShift: 0.12,
        avgKneeAsymmetry: 18,
        reps: [
          sampleRep({ minLeftKneeAngle: 88, minRightKneeAngle: 108 }),
          sampleRep({ minLeftKneeAngle: 90, minRightKneeAngle: 110 }),
        ],
      }),
      metrics({
        repCount: 1,
        reps: [sampleRep({ repNumber: 1 })],
        avgDepth: null,
        avgTrunkLean: null,
        depthCV: null,
        minDepth: null,
        maxDepth: null,
        avgHipShift: null,
        avgKneeAsymmetry: null,
      }),
    ]

    // Kinetics (load/force/stress/torque/power) can't be measured from a
    // camera, and the composite score was deleted — neither may appear in
    // user-facing copy. No legitimate uses exist in current strings, so the
    // word-boundary regexes are unscoped on purpose.
    const kineticLanguage = /\b(load|force|stress|torque|power)\b/i
    const scoreLanguage = /\bscore(d|s)?\b/i

    for (const input of inputs) {
      for (const key of issueKeys) {
        for (const level of ['High', 'Medium', 'Low'] as const) {
          const cue = buildBiomechanicalCue(key, input, level)
          const textFields = [
            cue.issue,
            cue.observed,
            cue.whyItMatters,
            cue.tryNext,
            cue.confidenceNote ?? '',
          ]
          for (const text of textFields) {
            expect(text).not.toMatch(kineticLanguage)
            expect(text).not.toMatch(scoreLanguage)
          }
        }
      }
    }
  })
})
