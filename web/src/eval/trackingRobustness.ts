import { CRITICAL_LANDMARKS, CONFIDENCE_THRESHOLD, type PoseFrame } from '../cv/types'
import { assessSequenceQuality, summarizeLandmarkQuality } from '../cv/landmarkQuality'
import { LIVE_ONE_EURO } from '../cv/landmarkFilter'
import { dropoutRuns } from './benchmark/benchmarkMetrics'
import { landmarkJitter, meanAbsError } from './metrics'
import { runVariant } from './replayHarness'
import type { PoseTape } from './poseTape'

export interface TrackingRobustnessInput {
  file: string
  sha256: string
  tape: PoseTape
}

interface DistributionSummary {
  mean: number | null
  p95: number | null
  max: number | null
}

export interface TrackingRobustnessTapeResult {
  file: string
  sha256: string
  input: {
    frames: number
    fps: number
    appVersion: string | null
    algorithmVersion: string | null
    declaredFiltering: string
    labeledRepCount: number | null
    labeledBottomEvents: number
  }
  frameIntervalsMs: DistributionSummary
  criticalLandmarks: {
    meanCoverage: number | null
    framesMissing: number
    dropoutRuns: number
    longestDropoutFrames: number
    recoveredRuns: number
  }
  raw: { jitter: number; implausibleJumpFrames: number; repCount: number; bottomFrames: number[] }
  oneEuro: { jitter: number; implausibleJumpFrames: number; repCount: number; bottomFrames: number[] }
  parity: { repCountDelta: number; pairedBottomFrameMae: number | null }
}

export interface TrackingRobustnessBaselineV1 {
  schemaVersion: 1
  evaluator: {
    id: 'kinematiciq-tracking-robustness'
    version: '1.0.0'
    filter: typeof LIVE_ONE_EURO
    criticalLandmarkIndices: readonly number[]
    visibilityThreshold: number
  }
  corpus: {
    tapeCount: number
    labeledRepCountTapes: number
    labeledBottomEventTapes: number
    limitations: string[]
  }
  aggregate: {
    frameCount: number
    meanCriticalCoverage: number | null
    rawJitterMean: number | null
    oneEuroJitterMean: number | null
    rawImplausibleJumpFrames: number
    oneEuroImplausibleJumpFrames: number
    repParityTapes: number
    repMismatchTapes: string[]
  }
  tapes: TrackingRobustnessTapeResult[]
}

function distribution(values: number[]): DistributionSummary {
  if (values.length === 0) return { mean: null, p95: null, max: null }
  const sorted = [...values].sort((a, b) => a - b)
  return {
    mean: values.reduce((sum, value) => sum + value, 0) / values.length,
    p95: sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))],
    max: sorted[sorted.length - 1],
  }
}

function mean(values: number[]): number | null {
  return values.length === 0
    ? null
    : values.reduce((sum, value) => sum + value, 0) / values.length
}

function criticalJitter(frames: readonly PoseFrame[]): number {
  const values = CRITICAL_LANDMARKS.flatMap((index) => [
    landmarkJitter(frames, index, 'x'),
    landmarkJitter(frames, index, 'y'),
  ])
  return mean(values) ?? 0
}

function evaluateInput(input: TrackingRobustnessInput): TrackingRobustnessTapeResult {
  const raw = runVariant(input.tape, 'raw')
  const filtered = runVariant(input.tape, 'oneEuro')
  const rawQuality = summarizeLandmarkQuality(assessSequenceQuality(raw.frames))
  const filteredQuality = summarizeLandmarkQuality(assessSequenceQuality(filtered.frames))
  const observed = input.tape.frames.map((frame) =>
    CRITICAL_LANDMARKS.every(
      (index) => (frame.landmarks[index]?.visibility ?? 0) >= CONFIDENCE_THRESHOLD,
    ),
  )
  const dropouts = dropoutRuns(observed)
  const intervals = input.tape.frames
    .slice(1)
    .map((frame, index) => frame.timestamp - input.tape.frames[index].timestamp)
    .filter((value) => Number.isFinite(value) && value > 0)
  const bottomMae = meanAbsError(filtered.bottomFrames, raw.bottomFrames)

  return {
    file: input.file,
    sha256: input.sha256,
    input: {
      frames: input.tape.frames.length,
      fps: input.tape.meta.fps,
      appVersion: input.tape.meta.appVersion ?? null,
      algorithmVersion: input.tape.meta.algorithmVersion ?? null,
      declaredFiltering: input.tape.meta.filtering ?? 'raw',
      labeledRepCount: input.tape.meta.truth?.repCount ?? null,
      labeledBottomEvents: input.tape.meta.truth?.bottomFrameIndices?.length ?? 0,
    },
    frameIntervalsMs: distribution(intervals),
    criticalLandmarks: {
      meanCoverage: rawQuality.meanCriticalCoverage,
      framesMissing: rawQuality.framesMissingCritical,
      dropoutRuns: dropouts.length,
      longestDropoutFrames: Math.max(0, ...dropouts.map((run) => run.length)),
      recoveredRuns: dropouts.filter((run) => run.recoveredAtIndex !== null).length,
    },
    raw: {
      jitter: criticalJitter(raw.frames),
      implausibleJumpFrames: rawQuality.implausibleJumpFrames,
      repCount: raw.repCount,
      bottomFrames: raw.bottomFrames,
    },
    oneEuro: {
      jitter: criticalJitter(filtered.frames),
      implausibleJumpFrames: filteredQuality.implausibleJumpFrames,
      repCount: filtered.repCount,
      bottomFrames: filtered.bottomFrames,
    },
    parity: {
      repCountDelta: filtered.repCount - raw.repCount,
      pairedBottomFrameMae: Number.isFinite(bottomMae) ? bottomMae : null,
    },
  }
}

export function buildTrackingRobustnessBaseline(
  inputs: readonly TrackingRobustnessInput[],
): TrackingRobustnessBaselineV1 {
  if (inputs.length === 0) throw new Error('Tracking robustness baseline requires at least one tape.')
  const tapes = inputs.map(evaluateInput)
  const totalFrames = tapes.reduce((sum, tape) => sum + tape.input.frames, 0)
  const weightedCoverage = tapes.reduce(
    (sum, tape) => sum + (tape.criticalLandmarks.meanCoverage ?? 0) * tape.input.frames,
    0,
  )
  const mismatch = tapes.filter((tape) => tape.parity.repCountDelta !== 0)
  const labeledBottomEventTapes = tapes.filter((tape) => tape.input.labeledBottomEvents > 0).length
  const limitations = [
    'OCHuman raw images/annotations are not locally acquired; occlusion stress metrics are absent.',
    labeledBottomEventTapes === 0
      ? 'No current tape has labeled bottom-frame events; event accuracy cannot be estimated.'
      : `${labeledBottomEventTapes}/${tapes.length} tapes have labeled bottom-frame events.`,
    'This baseline measures the current tape corpus only; it is not population or clinical validation.',
  ]

  return {
    schemaVersion: 1,
    evaluator: {
      id: 'kinematiciq-tracking-robustness',
      version: '1.0.0',
      filter: LIVE_ONE_EURO,
      criticalLandmarkIndices: CRITICAL_LANDMARKS,
      visibilityThreshold: CONFIDENCE_THRESHOLD,
    },
    corpus: {
      tapeCount: tapes.length,
      labeledRepCountTapes: tapes.filter((tape) => tape.input.labeledRepCount !== null).length,
      labeledBottomEventTapes,
      limitations,
    },
    aggregate: {
      frameCount: totalFrames,
      meanCriticalCoverage: totalFrames === 0 ? null : weightedCoverage / totalFrames,
      rawJitterMean: mean(tapes.map((tape) => tape.raw.jitter)),
      oneEuroJitterMean: mean(tapes.map((tape) => tape.oneEuro.jitter)),
      rawImplausibleJumpFrames: tapes.reduce((sum, tape) => sum + tape.raw.implausibleJumpFrames, 0),
      oneEuroImplausibleJumpFrames: tapes.reduce((sum, tape) => sum + tape.oneEuro.implausibleJumpFrames, 0),
      repParityTapes: tapes.length - mismatch.length,
      repMismatchTapes: mismatch.map((tape) => tape.file),
    },
    tapes,
  }
}
