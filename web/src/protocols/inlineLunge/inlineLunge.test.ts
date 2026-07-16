import { describe, expect, it } from 'vitest'
import { NotImplementedError } from '../../core/protocol'
import { lintProtocolCompleteness } from '../completeness'
import { getProtocol, getProtocolProfile } from '../registry'
import { getProtocolRuntime } from '../runtime'
import { buildSyntheticInlineLungeFrames } from './fixtures'
import { analyzeInlineLungeResearch, INLINE_LUNGE_PROTOCOL } from '.'
import { makeProvenance } from '../../core/provenance'

const provenance = makeProvenance({ captureSource: 'synthetic', protocolId: 'side-view-forward-lunge-stride-return-v1' })

describe('inline-lunge research protocol', () => {
  it.each(['left', 'right'] as const)('segments a complete %s-lead trial with ordered events', (leadSide) => {
    const result = analyzeInlineLungeResearch(buildSyntheticInlineLungeFrames({ leadSide }), { leadSide, provenance })
    expect(result.trials).toHaveLength(1)
    const trial = result.trials[0]
    expect(trial.status).toBe('completed')
    expect([trial.standingStartFrame, trial.stepInitiationFrame, trial.descentStartFrame, trial.bottomFrame, trial.ascentStartFrame, trial.stableReturnFrame]).toEqual([...new Set([trial.standingStartFrame, trial.stepInitiationFrame, trial.descentStartFrame, trial.bottomFrame, trial.ascentStartFrame, trial.stableReturnFrame])].sort((a, b) => a - b))
    expect(result.outcomes.trials[0].kind).toBe('transition')
    expect(result.metricResults.find((metric) => metric.metricId === 'forwardLungeStrideReturn.trial.count')?.value).toBe(1)
  })

  it('emits within-set consistency only with at least three trials', () => {
    const one = analyzeInlineLungeResearch(buildSyntheticInlineLungeFrames(), { leadSide: 'left', provenance })
    const three = analyzeInlineLungeResearch(buildSyntheticInlineLungeFrames({ trials: 3 }), { leadSide: 'left', provenance })
    expect(one.metricResults.find((metric) => metric.metricId.endsWith('duration-cv'))?.value).toBeNull()
    expect(three.metricResults.find((metric) => metric.metricId.endsWith('duration-cv'))?.value).toBe(0)
    expect(three.findings).toHaveLength(3)
  })

  it('rejects a trial after a sustained critical-landmark dropout and abstains', () => {
    const result = analyzeInlineLungeResearch(buildSyntheticInlineLungeFrames({ unreadableActiveFrames: 4 }), { leadSide: 'left', provenance })
    expect(result.trials[0]).toMatchObject({ status: 'rejected', rejectionReason: 'critical-landmarks-unreadable' })
    expect(result.findings).toEqual([])
    expect(result.abstentionReasons).toHaveLength(1)
  })

  it('remains planned, non-actionable, complete as a stub, and fail-closed publicly', () => {
    expect(getProtocol('forwardLungeStrideReturn').definition.status).toBe('planned')
    expect(getProtocol('forwardLungeStrideReturn').definition.capture.inputModes).toEqual([])
    expect(lintProtocolCompleteness(INLINE_LUNGE_PROTOCOL)).toEqual([])
    expect(() => getProtocolProfile('forwardLungeStrideReturn')).toThrow(NotImplementedError)
    expect(() => getProtocolRuntime('forwardLungeStrideReturn')).toThrow(NotImplementedError)
    expect(getProtocol('forwardLungeStrideReturn').definition.evidence.datasetProvenance).toEqual([{ datasetId: 'llm-fms', role: 'ontology-only' }])
  })

  it('serializes research outcomes without changing the session-artifact schema', () => {
    const result = analyzeInlineLungeResearch(buildSyntheticInlineLungeFrames(), { leadSide: 'left', provenance })
    const restored = JSON.parse(JSON.stringify(result)) as typeof result
    expect(restored.protocolId).toBe('forwardLungeStrideReturn')
    expect(restored.outcomes.trials[0]).toMatchObject({ kind: 'transition', status: 'completed' })
    expect(restored.metricResults.every((metric) => metric.validationTier === 'experimental')).toBe(true)
  })

  it('accepts legacy observation provenance but emits canonical provenance', () => {
    const result = analyzeInlineLungeResearch(buildSyntheticInlineLungeFrames(), {
      leadSide: 'left',
      provenance: makeProvenance({ captureSource: 'replay', protocolId: 'side-view-inline-lunge-v1' }),
    })
    expect(result.protocolId).toBe('forwardLungeStrideReturn')
    expect(result.metricResults.every((metric) => metric.provenance.protocolId === 'side-view-forward-lunge-stride-return-v1')).toBe(true)
  })

  it('fails calibration when the declared lead leg is unreadable', () => {
    const frames = buildSyntheticInlineLungeFrames()
    for (const frame of frames.slice(0, 15)) frame.landmarks[31].visibility = 0
    expect(() => analyzeInlineLungeResearch(frames, { leadSide: 'left', provenance })).toThrow(/Calibration failed/)
  })

  it('rejects capture provenance for a different observation protocol', () => {
    expect(() => analyzeInlineLungeResearch(buildSyntheticInlineLungeFrames(), {
      leadSide: 'left',
      provenance: makeProvenance({ captureSource: 'replay', protocolId: 'front-view-squat-v1' }),
    })).toThrow(/side-view-forward-lunge-stride-return-v1 provenance/)
  })
})
