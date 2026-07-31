/**
 * Synthetic frames that exercise forward-lunge *segmentation*. Not a lunge.
 *
 * Read this before quoting any number these frames produce. The generator moves
 * a foot forward and drops a pelvis, which is exactly what the segmenter keys
 * on, so it drives the six-phase state machine end to end and is genuinely
 * useful for that. What it does not do is bend a knee: the hip, knee and ankle
 * stay close to collinear throughout, and the lead-knee angle at the detected
 * bottom is about 175° — a straight leg — against roughly 80–120° for a real
 * forward lunge.
 *
 * That gap is the whole point of keeping this note here. A tape from this
 * generator can show trials, phases, durations and consistency, and none of it
 * is evidence that the analysis measures a lunge correctly on human video. The
 * lead-knee metric now abstains on this geometry rather than reporting the 175°
 * (see `LEAD_KNEE_FLEXION_IMPLAUSIBLE_ABOVE_DEG`), and a test pins that.
 *
 * Fixing the geometry means giving the leg consistent segment lengths across
 * the motion and a pelvis drop deep enough to match the knee flexion, which
 * changes the signals the segmenter thresholds were set against. That is a
 * deliberate piece of work, not a tweak, and it should be done against real
 * recordings rather than by tuning one fixture until it looks right.
 */
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
  /** Readable standing preroll. Must cover the calibration window. */
  standingFrames?: number
  /** Unreadable frames appended after the last trial (drives coverage down). */
  trailingUnreadableFrames?: number
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
  for (let i = 0; i < (options.standingFrames ?? 15); i++) push(0, 0)
  for (let trial = 0; trial < trialCount; trial++) {
    ;[0.07, 0.10, 0.12].forEach((foot) => push(foot, 0.005))
    ;[0.03, 0.04, 0.055, 0.07, 0.085].forEach((drop) => push(0.12, drop))
    for (let i = 0; i < (options.unreadableActiveFrames ?? 0); i++) push(0.12, 0.08, 0.1)
    ;[0.08, 0.07, 0.055, 0.04, 0.02, 0.01].forEach((drop) => push(0.12, drop))
    ;[0.09, 0.06, 0.03, 0.01, 0, 0, 0, 0].forEach((foot) => push(foot, 0.005))
  }
  for (let i = 0; i < (options.trailingUnreadableFrames ?? 0); i++) push(0, 0, 0.1)
  return frames
}
