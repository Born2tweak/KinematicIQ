import { describe, expect, it } from 'vitest'
import { deriveSquatCoaching } from './squatRules'
import { buildBiomechanicalCue } from '../feedback/feedbackReasoning'
import { rankIssuesByEvidence } from './evidenceStrength'
import { buildSquatMetricResults } from '../metrics/squatMetrics'
import { makeProvenance } from '../core/provenance'
import type { ComponentScores, SetMetricsSummary } from '../session/types'

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

describe('findings/squatRules', () => {
  it('appends an informational tempo finding when rep timing is erratic (M18)', () => {
    const erratic: SetMetricsSummary = {
      ...metrics,
      avgRepDurationMs: 2500,
      repDurationCV: 55,
    }
    const metricResults = buildSquatMetricResults(
      erratic,
      makeProvenance({ captureSource: 'replay' }),
    )
    const out = deriveSquatCoaching(components, 'High', erratic, metricResults, 2)
    const tempo = out.findings.find((f) => f.id === 'squat.tempo')
    expect(tempo).toBeDefined()
    expect(tempo?.priority).toBe('informational')
    expect(tempo?.statement).toMatch(/55%/)
    // Informational only: it never displaces coaching cues.
    expect(out.cues).toHaveLength(2)
  })

  it('stays silent about tempo when timing is steady or the sample is small', () => {
    const steady: SetMetricsSummary = { ...metrics, repDurationCV: 10 }
    expect(
      deriveSquatCoaching(components, 'High', steady, [], 2).findings.some(
        (f) => f.id === 'squat.tempo',
      ),
    ).toBe(false)
    const smallSample: SetMetricsSummary = { ...metrics, repCount: 2, repDurationCV: 80 }
    expect(
      deriveSquatCoaching(components, 'High', smallSample, [], 2).findings.some(
        (f) => f.id === 'squat.tempo',
      ),
    ).toBe(false)
  })

  it('returns nothing at Low session confidence', () => {
    const out = deriveSquatCoaching(components, 'Low', metrics)
    expect(out.findings).toEqual([])
    expect(out.cues).toEqual([])
  })

  it('derives cues byte-identical to the direct cue builder', () => {
    const out = deriveSquatCoaching(components, 'High', metrics, [], 2)
    const keys = rankIssuesByEvidence(metrics, 2)
    const expected = keys.map((key) => {
      const cue = buildBiomechanicalCue(key, metrics, 'High')
      return {
        issue: cue.issue,
        observed: cue.observed,
        whyItMatters: cue.whyItMatters,
        tryNext: cue.tryNext,
        confidence: cue.confidence,
        confidenceNote: cue.confidenceNote,
      }
    })
    expect(out.cues).toEqual(expected)
  })

  it('builds one finding per cue with priority and evidence chain', () => {
    const metricResults = buildSquatMetricResults(
      metrics,
      makeProvenance({ captureSource: 'replay' }),
    )
    const out = deriveSquatCoaching(components, 'High', metrics, metricResults, 2)
    expect(out.findings).toHaveLength(out.cues.length)
    expect(out.findings[0].priority).toBe('primary')
    expect(out.findings[1].priority).toBe('secondary')
    for (const finding of out.findings) {
      expect(finding.id).toMatch(/^squat\./)
      expect(finding.evidence.length).toBeGreaterThan(0)
      expect(finding.question).toBeTruthy()
      // No risk field on findings.
      expect(finding).not.toHaveProperty('risk')
    }
    // Lowest component is depth → first finding cites the depth metric.
    expect(out.findings[0].evidence.some((e) => e.metricId.startsWith('squat.depth'))).toBe(
      true,
    )
  })

  it('gives every finding rule provenance with a review status (M50)', () => {
    const erratic: SetMetricsSummary = {
      ...metrics,
      avgRepDurationMs: 2500,
      repDurationCV: 55,
    }
    const out = deriveSquatCoaching(components, 'High', erratic, [], 2)
    expect(out.findings.length).toBeGreaterThan(0)
    for (const finding of out.findings) {
      expect(finding.provenance).toBeDefined()
      expect(finding.provenance!.ruleId).toMatch(/^rule\.squat\./)
      expect(finding.provenance!.sourceDocs.length).toBeGreaterThan(0)
      expect(finding.provenance!.reviewStatus).toBeTruthy()
      // Nothing in the app may claim validation yet.
      expect(finding.provenance!.reviewStatus).not.toBe('validated')
    }
    // The authored tempo threshold is heuristic; component rules are tested.
    const tempo = out.findings.find((f) => f.id === 'squat.tempo')
    expect(tempo?.provenance?.reviewStatus).toBe('heuristic')
    const primary = out.findings[0]
    expect(primary.provenance?.reviewStatus).toBe('internally-tested')
  })
})
