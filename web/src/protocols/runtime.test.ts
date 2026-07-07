import { describe, expect, it } from 'vitest'
import {
  SQUAT_RUNTIME,
  getProtocolRuntime,
} from './runtime'
import { NotImplementedError, type ProtocolId } from '../core/protocol'
import { runPipelineOnFrames } from '../analysis/videoAnalyzer'
import { assessSetQuality } from '../session/setQualityGate'
import { collectSetMetrics } from '../analysis/metricCollector'
import {
  buildSessionResult,
  buildResultsSummary,
} from '../session/buildSessionResult'
import { buildCleanSquatPoseTape } from '../camera/fixtures/cleanSquatPoseTape'

describe('getProtocolRuntime', () => {
  it('returns the squat runtime', () => {
    const runtime = getProtocolRuntime('squat')
    expect(runtime.protocolId).toBe('squat')
    expect(runtime).toBe(SQUAT_RUNTIME)
  })

  it.each(['hipHinge', 'jump', 'sprint'] as const)(
    'throws NotImplementedError for planned protocol %s',
    (id) => {
      expect(() => getProtocolRuntime(id)).toThrow(NotImplementedError)
    },
  )

  it('throws for unknown protocol ids', () => {
    expect(() => getProtocolRuntime('yoga' as ProtocolId)).toThrow(
      /not registered/,
    )
  })
})

describe('squat runtime adapter parity', () => {
  // Deterministic synthetic session: the clean-squat fixture tape used by
  // the autonomous camera tests (3 reps, no webcam required).
  const frames = buildCleanSquatPoseTape().frames

  it('segmentFrames matches runPipelineOnFrames exactly', () => {
    const viaRuntime = SQUAT_RUNTIME.segmentFrames(frames)
    const direct = runPipelineOnFrames(frames)
    expect(viaRuntime).toEqual(direct)
    // Sanity: the fixture actually produces reps, so parity is meaningful.
    expect(direct.reps.length).toBeGreaterThan(0)
  })

  it('assessQuality matches assessSetQuality exactly', () => {
    const { reps, repRejections } = runPipelineOnFrames(frames)
    expect(SQUAT_RUNTIME.assessQuality(reps, repRejections)).toEqual(
      assessSetQuality(reps, repRejections),
    )
  })

  it('collectMetrics matches collectSetMetrics exactly', () => {
    const { reps } = runPipelineOnFrames(frames)
    const excluded = new Set<number>()
    expect(
      SQUAT_RUNTIME.collectMetrics({
        reps,
        sessionConfidenceScore: 85,
        excludedRepNumbers: excluded,
      }),
    ).toEqual(collectSetMetrics(reps, 85, excluded))
  })

  it('buildReportMetadata carries the protocol label and verdict headline', () => {
    const { reps, poseConfidenceSamples, postureSamples, repRejections } =
      runPipelineOnFrames(frames)
    const result = buildSessionResult(
      reps,
      poseConfidenceSamples,
      postureSamples,
      repRejections,
    )
    const metadata = SQUAT_RUNTIME.buildReportMetadata(result)
    expect(metadata.protocolId).toBe('squat')
    expect(metadata.protocolLabel.length).toBeGreaterThan(0)
    expect(metadata.headline).toBe(buildResultsSummary(result))
  })

  it('deriveFindings fully abstains on an invalid quality verdict', () => {
    const { reps, poseConfidenceSamples, postureSamples, repRejections } =
      runPipelineOnFrames(frames)
    const result = buildSessionResult(
      reps,
      poseConfidenceSamples,
      postureSamples,
      repRejections,
    )
    expect(result.scoring).not.toBeNull()
    const output = SQUAT_RUNTIME.deriveFindings({
      components: result.scoring!,
      sessionConfidence: result.sessionConfidence,
      metrics: result.metrics,
      metricResults: result.metricResults,
      quality: { ...result.quality, verdict: 'invalid' },
    })
    expect(output.findings).toEqual([])
    expect(output.cues).toEqual([])
  })
})
