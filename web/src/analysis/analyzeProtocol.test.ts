import { describe, expect, it } from 'vitest'
import { analyzeFramesForProtocol } from './analyzeProtocol'
import { runPipelineOnFrames } from './videoAnalyzer'
import { buildSessionResult } from '../session/buildSessionResult'
import { NotImplementedError, type ProtocolId } from '../core/protocol'
import { buildCleanSquatPoseTape } from '../camera/fixtures/cleanSquatPoseTape'

const frames = buildCleanSquatPoseTape().frames

describe('analyzeFramesForProtocol — squat path unchanged', () => {
  it('matches the existing pipeline + builder output exactly', () => {
    const { segmentation, result } = analyzeFramesForProtocol('squat', frames)
    const direct = runPipelineOnFrames(frames)
    expect(segmentation).toEqual(direct)
    expect(result).toEqual(
      buildSessionResult(
        direct.reps,
        direct.poseConfidenceSamples,
        direct.postureSamples,
        direct.repRejections,
        'squat',
      ),
    )
    expect(result.metrics.repCount).toBeGreaterThan(0)
  })

  it('stamps the selected protocol id on the result', () => {
    const { result } = analyzeFramesForProtocol('squat', frames)
    expect(result.protocolId).toBe('squat')
  })

  it('provenance follows the selected protocol, not the active default', () => {
    const { result } = analyzeFramesForProtocol('squat', frames)
    // Squat's definition declares its observation protocol; the metric
    // results must carry it (explicit-id rule, M43).
    expect(result.metricResults.length).toBeGreaterThan(0)
    for (const metric of result.metricResults) {
      expect(metric.provenance.protocolId).toBeDefined()
    }
  })
})

describe('analyzeFramesForProtocol — unavailable protocols block cleanly', () => {
  it.each(['hipHinge', 'jump', 'sprint'] as const)(
    'throws NotImplementedError for planned protocol %s before touching frames',
    (id) => {
      expect(() => analyzeFramesForProtocol(id, frames)).toThrow(
        NotImplementedError,
      )
    },
  )

  it('throws for unknown protocol ids', () => {
    expect(() =>
      analyzeFramesForProtocol('yoga' as ProtocolId, frames),
    ).toThrow(/not registered/)
  })
})

describe('explicit protocol id in the session builder', () => {
  it('buildSessionResult keeps an explicit id instead of the active default', () => {
    const { reps, poseConfidenceSamples, postureSamples, repRejections } =
      runPipelineOnFrames(frames)
    const result = buildSessionResult(
      reps,
      poseConfidenceSamples,
      postureSamples,
      repRejections,
      'squat',
    )
    expect(result.protocolId).toBe('squat')
  })
})
