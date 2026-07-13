import { CRITICAL_LANDMARKS, CONFIDENCE_THRESHOLD, type NormalizedLandmark, type PoseFrame } from '../cv/types'
import { assessSequenceQuality, summarizeLandmarkQuality } from '../cv/landmarkQuality'
import { meanAbsError } from './metrics'
import { runVariant } from './replayHarness'
import type { PoseTape } from './poseTape'
import type { TrackingRobustnessInput } from './trackingRobustness'

export const SHORT_GAP_RECOVERY_CANDIDATE = {
  id: 'critical-landmark-linear-short-gap',
  version: '1.0.0',
  maxGapFrames: 2,
  visibilityThreshold: CONFIDENCE_THRESHOLD,
} as const

export const SHORT_GAP_ACCEPTANCE_GATES = {
  minimumRecoveredLandmarks: 1,
  requireLowerMissingCriticalFrames: true,
  requireNoAdditionalImplausibleJumps: true,
  requireRepCountParityOnEveryTape: true,
  requireNoBottomEventTimingRegression: true,
} as const

function usable(landmark: NormalizedLandmark | undefined): landmark is NormalizedLandmark {
  return Boolean(
    landmark &&
    [landmark.x, landmark.y, landmark.z, landmark.visibility].every(Number.isFinite) &&
    landmark.visibility >= CONFIDENCE_THRESHOLD,
  )
}

function interpolate(left: NormalizedLandmark, right: NormalizedLandmark, ratio: number): NormalizedLandmark {
  return {
    x: left.x + (right.x - left.x) * ratio,
    y: left.y + (right.y - left.y) * ratio,
    z: left.z + (right.z - left.z) * ratio,
    visibility: Math.min(left.visibility, right.visibility),
  }
}

export function recoverBoundedShortGaps(frames: readonly PoseFrame[]): {
  frames: PoseFrame[]
  recoveredLandmarks: number
} {
  const recovered = frames.map((frame) => ({ ...frame, landmarks: frame.landmarks.map((value) => ({ ...value })) }))
  let recoveredLandmarks = 0

  for (const landmarkIndex of CRITICAL_LANDMARKS) {
    let index = 0
    while (index < frames.length) {
      if (usable(frames[index].landmarks[landmarkIndex])) {
        index += 1
        continue
      }
      const start = index
      while (index < frames.length && !usable(frames[index].landmarks[landmarkIndex])) index += 1
      const end = index - 1
      const length = end - start + 1
      const left = frames[start - 1]?.landmarks[landmarkIndex]
      const right = frames[index]?.landmarks[landmarkIndex]
      if (length > SHORT_GAP_RECOVERY_CANDIDATE.maxGapFrames || !usable(left) || !usable(right)) continue

      for (let offset = 0; offset < length; offset += 1) {
        recovered[start + offset].landmarks[landmarkIndex] = interpolate(left, right, (offset + 1) / (length + 1))
        recoveredLandmarks += 1
      }
    }
  }
  return { frames: recovered, recoveredLandmarks }
}

export interface ShortGapRecoveryExperimentV1 {
  schemaVersion: 1
  candidate: typeof SHORT_GAP_RECOVERY_CANDIDATE
  acceptanceGates: typeof SHORT_GAP_ACCEPTANCE_GATES
  aggregate: {
    tapeCount: number
    recoveredLandmarks: number
    baselineMissingCriticalFrames: number
    candidateMissingCriticalFrames: number
    baselineImplausibleJumpFrames: number
    candidateImplausibleJumpFrames: number
    repParityTapes: number
    bottomEventNonRegressionTapes: number
  }
  decision: 'accepted' | 'rejected'
  failedGates: string[]
}

export function runShortGapRecoveryExperiment(inputs: readonly TrackingRobustnessInput[]): ShortGapRecoveryExperimentV1 {
  if (inputs.length === 0) throw new Error('Short-gap recovery experiment requires at least one tape.')
  let recoveredLandmarks = 0
  let baselineMissing = 0
  let candidateMissing = 0
  let baselineJumps = 0
  let candidateJumps = 0
  let repParity = 0
  let bottomNonRegression = 0

  for (const input of inputs) {
    const baselineRun = runVariant(input.tape, 'raw')
    const recovery = recoverBoundedShortGaps(input.tape.frames)
    const candidateTape: PoseTape = { ...input.tape, frames: recovery.frames }
    const candidateRun = runVariant(candidateTape, 'raw')
    const baselineQuality = summarizeLandmarkQuality(assessSequenceQuality(baselineRun.frames))
    const candidateQuality = summarizeLandmarkQuality(assessSequenceQuality(candidateRun.frames))
    const candidateBottomDelta = meanAbsError(candidateRun.bottomFrames, baselineRun.bottomFrames)
    recoveredLandmarks += recovery.recoveredLandmarks
    baselineMissing += baselineQuality.framesMissingCritical
    candidateMissing += candidateQuality.framesMissingCritical
    baselineJumps += baselineQuality.implausibleJumpFrames
    candidateJumps += candidateQuality.implausibleJumpFrames
    if (candidateRun.repCount === baselineRun.repCount) repParity += 1
    if (
      candidateRun.bottomFrames.length === baselineRun.bottomFrames.length &&
      (!Number.isFinite(candidateBottomDelta) || candidateBottomDelta === 0)
    ) bottomNonRegression += 1
  }

  const failedGates: string[] = []
  if (recoveredLandmarks < SHORT_GAP_ACCEPTANCE_GATES.minimumRecoveredLandmarks) failedGates.push('minimum-recovered-landmarks')
  if (candidateMissing >= baselineMissing) failedGates.push('missing-critical-frames-not-improved')
  if (candidateJumps > baselineJumps) failedGates.push('implausible-jump-regression')
  if (repParity !== inputs.length) failedGates.push('rep-count-regression')
  if (bottomNonRegression !== inputs.length) failedGates.push('bottom-event-timing-regression')

  return {
    schemaVersion: 1,
    candidate: SHORT_GAP_RECOVERY_CANDIDATE,
    acceptanceGates: SHORT_GAP_ACCEPTANCE_GATES,
    aggregate: {
      tapeCount: inputs.length,
      recoveredLandmarks,
      baselineMissingCriticalFrames: baselineMissing,
      candidateMissingCriticalFrames: candidateMissing,
      baselineImplausibleJumpFrames: baselineJumps,
      candidateImplausibleJumpFrames: candidateJumps,
      repParityTapes: repParity,
      bottomEventNonRegressionTapes: bottomNonRegression,
    },
    decision: failedGates.length === 0 ? 'accepted' : 'rejected',
    failedGates,
  }
}
