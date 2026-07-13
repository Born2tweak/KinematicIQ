import type { NormalizedLandmark, PoseFrame } from '../../cv/types'
import { LANDMARK_INDICES } from '../../cv/types'
import type { InlineLungeSide } from './types'

function landmark(x = 0.5, y = 0.5, visibility = 0.99): NormalizedLandmark {
  return { x, y, z: 0, visibility }
}

export function buildSyntheticInlineLungeFrames(options: {
  leadSide?: InlineLungeSide
  trials?: number
  unreadableActiveFrames?: number
} = {}): PoseFrame[] {
  const side = options.leadSide ?? 'left'
  const trialCount = options.trials ?? 1
  const frames: PoseFrame[] = []
  let frameIndex = 0
  const push = (footOffset: number, pelvisDrop: number, visibility = 0.99) => {
    const points = Array.from({ length: 33 }, () => landmark())
    const leftLead = side === 'left'
    points[LANDMARK_INDICES.LEFT_HIP] = landmark(0.48, 0.45 + pelvisDrop)
    points[LANDMARK_INDICES.RIGHT_HIP] = landmark(0.52, 0.45 + pelvisDrop)
    points[LANDMARK_INDICES.LEFT_KNEE] = landmark(leftLead ? 0.48 + footOffset * 0.45 : 0.48, 0.66 + pelvisDrop * 0.35, visibility)
    points[LANDMARK_INDICES.RIGHT_KNEE] = landmark(leftLead ? 0.52 : 0.52 + footOffset * 0.45, 0.66 + pelvisDrop * 0.35, visibility)
    points[LANDMARK_INDICES.LEFT_ANKLE] = landmark(leftLead ? 0.48 + footOffset * 0.85 : 0.48, 0.88, visibility)
    points[LANDMARK_INDICES.RIGHT_ANKLE] = landmark(leftLead ? 0.52 : 0.52 + footOffset * 0.85, 0.88, visibility)
    points[LANDMARK_INDICES.LEFT_FOOT_INDEX] = landmark(leftLead ? 0.49 + footOffset : 0.49, 0.92, visibility)
    points[LANDMARK_INDICES.RIGHT_FOOT_INDEX] = landmark(leftLead ? 0.53 : 0.53 + footOffset, 0.92, visibility)
    frames.push({ timestamp: frameIndex * 33, frameIndex, landmarks: points, worldLandmarks: points, poseConfidence: visibility })
    frameIndex++
  }
  for (let i = 0; i < 15; i++) push(0, 0)
  for (let trial = 0; trial < trialCount; trial++) {
    ;[0.07, 0.10, 0.12].forEach((foot) => push(foot, 0.005))
    ;[0.03, 0.04, 0.055, 0.07, 0.085].forEach((drop) => push(0.12, drop))
    for (let i = 0; i < (options.unreadableActiveFrames ?? 0); i++) push(0.12, 0.08, 0.1)
    ;[0.08, 0.07, 0.055, 0.04, 0.02, 0.01].forEach((drop) => push(0.12, drop))
    ;[0.09, 0.06, 0.03, 0.01, 0, 0, 0, 0].forEach((foot) => push(foot, 0.005))
  }
  return frames
}
