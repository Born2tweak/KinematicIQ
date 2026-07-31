/**
 * What the lead-knee metric means, and when it refuses to mean anything.
 *
 * The value shipped in the last checkpoint was 174.92°, which reads as a
 * plausible number until you notice it describes a straight leg. These tests
 * pin down the definition, the arithmetic, and the abstention that stops the
 * figure reaching an athlete labelled "at bottom".
 */
import { describe, expect, it } from 'vitest'

import {
  LEAD_KNEE_FLEXION_IMPLAUSIBLE_ABOVE_DEG,
  buildInlineLungeMetricResults,
  leadKneeAngleAtBottom,
} from './metrics'
import { extractInlineLungeSignals, calibrateInlineLunge } from './signals'
import { buildSyntheticInlineLungeFrames } from './fixtures'
import { buildForwardLungeSessionResult } from './session'
import { packetsFromFrames } from '../../analysis/analyzeProtocol'
import { makeProvenance } from '../../core/provenance'
import type { InlineLungeTrial } from './types'

const upload = { captureSource: 'upload', filterVariant: 'raw' } as const

const packetize = (frames: ReturnType<typeof buildSyntheticInlineLungeFrames>) =>
  packetsFromFrames(frames, { source: 'fixture-video', captureId: 'test-capture' })

const trial = (angle: number | null): InlineLungeTrial =>
  ({
    status: 'completed',
    leadKneeAngleAtBottom: angle,
    readableFrameRatio: 1,
    stepTimestamp: 0,
    descentTimestamp: 100,
    bottomTimestamp: 200,
    ascentTimestamp: 300,
    returnTimestamp: 600,
  }) as unknown as InlineLungeTrial

describe('the metric measures the interior hip–knee–ankle angle', () => {
  it('reads near 180° for the synthetic fixture, because its leg is straight', () => {
    const frames = buildSyntheticInlineLungeFrames({ trials: 3, leadSide: 'left' })
    const calibration = calibrateInlineLunge(frames, 'left', 15)
    const angles = extractInlineLungeSignals(frames, 'left', calibration)
      .flatMap((sample) => (sample.leadKneeAngle === null ? [] : [sample.leadKneeAngle]))
    // Not a range assertion about lunges — an assertion about this fixture, so
    // that a future change to its geometry shows up here rather than silently
    // making the abstention below stop firing.
    expect(Math.min(...angles)).toBeGreaterThan(170)
  })
})

describe('a straight leg produces no depth read', () => {
  it('abstains above the plausibility line', () => {
    expect(leadKneeAngleAtBottom([trial(174.92)])).toBeNull()
    expect(leadKneeAngleAtBottom([trial(LEAD_KNEE_FLEXION_IMPLAUSIBLE_ABOVE_DEG + 0.1)])).toBeNull()
  })

  it('reports the average when the knee actually bent', () => {
    expect(leadKneeAngleAtBottom([trial(96), trial(104)])).toBe(100)
    expect(leadKneeAngleAtBottom([trial(LEAD_KNEE_FLEXION_IMPLAUSIBLE_ABOVE_DEG)])).toBe(
      LEAD_KNEE_FLEXION_IMPLAUSIBLE_ABOVE_DEG,
    )
  })

  it('abstains when no trial carried a readable bottom angle', () => {
    expect(leadKneeAngleAtBottom([trial(null)])).toBeNull()
    expect(leadKneeAngleAtBottom([])).toBeNull()
  })

  it('emits the metric as null rather than omitting it', () => {
    // The metric still appears in the result — absence of a value is itself
    // reportable evidence, and a missing row would just look like a bug.
    const results = buildInlineLungeMetricResults(
      [trial(174.92)],
      'left',
      makeProvenance({ ...upload, protocolId: 'side-view-forward-lunge-stride-return-v1' }),
    )
    const knee = results.find(
      (metric) => metric.metricId === 'forwardLungeStrideReturn.knee.bottom-angle',
    )
    expect(knee).toBeDefined()
    expect(knee?.value).toBeNull()
    expect(knee?.qualityFlags).toContain('insufficient-research-evidence')
  })
})

describe('the whole-session report on straight-leg geometry', () => {
  const result = buildForwardLungeSessionResult({
    packets: packetize(buildSyntheticInlineLungeFrames({ trials: 3 })),
    capture: upload,
    leadSide: 'left',
  })

  it('still counts the trials it genuinely observed', () => {
    expect(result.metrics.repCount).toBe(3)
  })

  it('withholds the depth read', () => {
    expect(
      result.metricResults.find(
        (metric) => metric.metricId === 'forwardLungeStrideReturn.knee.bottom-angle',
      )?.value,
    ).toBeNull()
  })

  it('says why, instead of leaving a silent blank', () => {
    expect(result.quality.reasons.map((reason) => reason.detail).join(' ')).toMatch(
      /lead knee stayed near straight/i,
    )
  })

  it('never quotes an angle it refused to report', () => {
    const spoken = [
      ...result.feedback.map((cue) => `${cue.issue} ${cue.observed}`),
      ...result.findings.map((finding) => JSON.stringify(finding)),
    ].join(' ')
    expect(spoken).not.toMatch(/17[0-9](\.[0-9]+)?°/)
  })
})
