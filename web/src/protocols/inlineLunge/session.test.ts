import { describe, expect, it } from 'vitest'
import { analyzeCaptureForProtocol, packetsFromFrames } from '../../analysis/analyzeProtocol'
import { buildCleanSquatPoseTape } from '../../camera/fixtures/cleanSquatPoseTape'
import type { PoseFrame } from '../../cv/types'
import { getProtocolRuntime } from '../runtime'
import { buildSyntheticInlineLungeFrames } from './fixtures'
import { buildForwardLungeSessionResult } from './session'
import { UNVALIDATED_CONFIDENCE_CEILING } from './profile'

const upload = { captureSource: 'upload', filterVariant: 'raw' } as const

/** Fixture frames carry no envelope, so they enter through ingestion here. */
const packetize = (frames: readonly PoseFrame[]) =>
  packetsFromFrames(frames, { source: 'fixture-video', captureId: 'test-capture' })

const analyze = (
  frames: ReturnType<typeof buildSyntheticInlineLungeFrames>,
  leadSide: 'left' | 'right' = 'left',
) => buildForwardLungeSessionResult({ packets: packetize(frames), capture: upload, leadSide })

describe('forward-lunge session assembly', () => {
  it('reports trials, metrics, findings and coaching from a complete set', () => {
    const result = analyze(buildSyntheticInlineLungeFrames({ trials: 3 }))

    expect(result.protocolId).toBe('forwardLungeStrideReturn')
    expect(result.metrics.repCount).toBe(3)
    expect(result.noRepsDetected).toBe(false)
    expect(result.quality.verdict).toBe('valid')
    expect(result.insufficientData).toBe(false)

    const trialCount = result.metricResults.find(
      (metric) => metric.metricId === 'forwardLungeStrideReturn.trial.count',
    )
    expect(trialCount?.value).toBe(3)
    expect(
      result.metricResults.find(
        (metric) => metric.metricId === 'forwardLungeStrideReturn.tempo.trial-duration',
      )?.value,
    ).toBeGreaterThan(0)
    expect(result.findings.length).toBeGreaterThan(0)
    expect(result.feedback.length).toBeGreaterThan(0)
  })

  it('carries the required observation provenance on every metric', () => {
    const result = analyze(buildSyntheticInlineLungeFrames({ trials: 3 }))
    expect(result.metricResults.length).toBeGreaterThan(0)
    for (const metric of result.metricResults) {
      expect(metric.provenance.protocolId).toBe('side-view-forward-lunge-stride-return-v1')
      expect(metric.provenance.captureSource).toBe('upload')
      expect(metric.validationTier).toBe('experimental')
    }
  })

  it('never reports a High-confidence read while validation is blocked', () => {
    const result = analyze(buildSyntheticInlineLungeFrames({ trials: 3 }))
    // Every frame in this fixture is readable, so only the ceiling can hold
    // the chip down.
    expect(result.sessionConfidence).not.toBe('High')
    expect(result.sessionConfidenceScore).toBe(
      Math.round(UNVALIDATED_CONFIDENCE_CEILING * 100),
    )
    for (const metric of result.metricResults) {
      expect(metric.confidence.value).toBeLessThanOrEqual(UNVALIDATED_CONFIDENCE_CEILING)
    }
  })

  it('tracks the declared lead side', () => {
    const right = analyze(buildSyntheticInlineLungeFrames({ leadSide: 'right', trials: 3 }), 'right')
    expect(right.metrics.repCount).toBe(3)
    // Declaring the wrong lead leg means the analysis watches a leg that never
    // stepped, so no trial completes — it does not silently guess.
    const mismatched = analyze(buildSyntheticInlineLungeFrames({ leadSide: 'right', trials: 3 }), 'left')
    expect(mismatched.metrics.repCount).toBe(0)
  })
})

describe('forward-lunge abstention states', () => {
  it('refuses a recording captured under a different observation protocol', () => {
    const result = buildForwardLungeSessionResult({
      packets: packetize(buildSyntheticInlineLungeFrames({ trials: 3 })),
      capture: { captureSource: 'replay', filterVariant: 'raw' },
      leadSide: 'left',
      observationProtocolId: 'front-view-squat-v1',
    })
    expect(result.quality.verdict).toBe('invalid')
    expect(result.metricResults).toEqual([])
    expect(result.findings).toEqual([])
    expect(result.feedback).toEqual([])
    expect(result.quality.reasons[0].detail).toMatch(/front-view-squat-v1/)
    expect(result.quality.captureFixes.length).toBeGreaterThan(0)
  })

  it('accepts the legacy inline-lunge observation id', () => {
    const result = buildForwardLungeSessionResult({
      packets: packetize(buildSyntheticInlineLungeFrames({ trials: 3 })),
      capture: { captureSource: 'replay', filterVariant: 'raw' },
      leadSide: 'left',
      observationProtocolId: 'side-view-inline-lunge-v1',
    })
    expect(result.metrics.repCount).toBe(3)
  })

  it('finds no lunge trial in a squat recording instead of reporting one', () => {
    // The landmarks are all readable, so this is not an unreadable recording —
    // it is a readable recording of a different movement, and the honest
    // outcome is zero completed trials.
    const result = buildForwardLungeSessionResult({
      packets: packetize(buildCleanSquatPoseTape().frames),
      capture: upload,
      leadSide: 'left',
    })
    expect(result.metrics.repCount).toBe(0)
    expect(result.noRepsDetected).toBe(true)
    expect(result.quality.verdict).toBe('invalid')
    expect(result.findings).toEqual([])
    expect(result.feedback).toEqual([])
    // Only the trial count is readable, and it reads zero; every derived
    // timing and angle metric abstains rather than averaging nothing.
    expect(
      result.metricResults.find(
        (metric) => metric.metricId === 'forwardLungeStrideReturn.trial.count',
      )?.value,
    ).toBe(0)
    expect(
      result.metricResults
        .filter((metric) => metric.metricId !== 'forwardLungeStrideReturn.trial.count')
        .every((metric) => metric.value === null),
    ).toBe(true)
  })

  it('abstains on a recording too short to calibrate', () => {
    const result = analyze(buildSyntheticInlineLungeFrames({ standingFrames: 10, trials: 0 }))
    expect(result.quality.verdict).toBe('invalid')
    expect(result.quality.reasons[0].detail).toMatch(/at least 30/)
  })

  it('reports no completed repetition without inventing one', () => {
    const result = analyze(buildSyntheticInlineLungeFrames({ standingFrames: 60, trials: 0 }))
    expect(result.metrics.repCount).toBe(0)
    expect(result.noRepsDetected).toBe(true)
    expect(result.quality.verdict).toBe('invalid')
    expect(result.quality.reasons.map((reason) => reason.id)).toContain('no-reps')
    expect(result.findings).toEqual([])
  })

  it('withholds interpretation on a low-confidence set but keeps the evidence', () => {
    const result = analyze(
      buildSyntheticInlineLungeFrames({ trials: 3, trailingUnreadableFrames: 140 }),
    )
    expect(result.sessionConfidence).toBe('Low')
    expect(result.insufficientData).toBe(true)
    // Trials were still observed and their metrics are still exported…
    expect(result.metrics.repCount).toBeGreaterThan(0)
    expect(result.metricResults.length).toBeGreaterThan(0)
    // …but no finding or cue is surfaced from them.
    expect(result.findings).toEqual([])
    expect(result.feedback).toEqual([])
  })

  it('rejects a trial that loses its critical landmarks mid-movement', () => {
    const result = analyze(
      buildSyntheticInlineLungeFrames({ trials: 1, unreadableActiveFrames: 4 }),
    )
    expect(result.metrics.repCount).toBe(0)
    expect(result.quality.reasons.map((reason) => reason.detail).join(' ')).toMatch(
      /critical-landmarks-unreadable/,
    )
  })
})

describe('forward lunge through the shared analysis entry point', () => {
  it('routes to the whole-session runtime and returns no rep segmentation', () => {
    const { segmentation, result } = analyzeCaptureForProtocol(
      'forwardLungeStrideReturn',
      packetize(buildSyntheticInlineLungeFrames({ trials: 3 })),
      { capture: upload, parameters: { leadSide: 'left' } },
    )
    expect(segmentation).toBeNull()
    expect(result.protocolId).toBe('forwardLungeStrideReturn')
    expect(result.metrics.repCount).toBe(3)
  })

  it('ignores an unusable lead-side parameter instead of trusting it', () => {
    const runtime = getProtocolRuntime('forwardLungeStrideReturn')
    const result = runtime.analyzeSession!({
      packets: packetize(buildSyntheticInlineLungeFrames({ trials: 3 })),
      capture: upload,
      parameters: { leadSide: 'sideways' },
    })
    // Falls back to the profile default rather than passing junk downstream.
    expect(result.metrics.repCount).toBe(3)
  })

  it('produces a trial-based report headline, not a rep count', () => {
    const runtime = getProtocolRuntime('forwardLungeStrideReturn')
    const result = analyze(buildSyntheticInlineLungeFrames({ trials: 3 }))
    const metadata = runtime.buildReportMetadata!(result)
    expect(metadata.protocolLabel).toBe('Forward Lunge')
    expect(metadata.headline).toMatch(/3 complete step-to-stable-return trials/)
    expect(metadata.headline).not.toMatch(/\brep\b/)
  })
})
