/**
 * Synthetic skeleton generator for camera fixtures (CAM-A3).
 *
 * Produces MediaPipe-shaped 33-landmark frames from a small set of named key
 * joints, so pose-tape fixtures are readable geometry specs instead of opaque
 * number dumps. Purely synthetic — no recorded human footage is involved
 * (privacy guardrail in docs/implementation/camera_autonomous_testing.md).
 */
import {
  CRITICAL_LANDMARKS,
  LANDMARK_INDICES,
  type NormalizedLandmark,
  type PoseFrame,
} from '../../cv/types'

export interface Point2D {
  x: number
  y: number
}

/**
 * Named key joints for one side-symmetric pose. `left`/`right` legs and arms
 * are mirrored around x = 0.5 unless overridden per side.
 */
export interface SkeletonPose {
  nose: Point2D
  /** Left-side joints; right side mirrors x around 0.5. */
  shoulder: Point2D
  hip: Point2D
  knee: Point2D
  ankle: Point2D
  /** Visibility for ankle/heel/foot landmarks (default `visibility`). */
  footVisibility?: number
  /** Ankle/heel/foot can sit off-frame (y > 1) for cropped-feet fixtures. */
}

const DEFAULT_VISIBILITY = 0.95
const FILLER_VISIBILITY = 0.9

function mirror(p: Point2D): Point2D {
  return { x: 1 - p.x, y: p.y }
}

function lm(p: Point2D, visibility: number): NormalizedLandmark {
  return { x: p.x, y: p.y, z: 0, visibility }
}

/** Linear interpolation between two poses (per named joint). */
export function interpolatePose(
  a: SkeletonPose,
  b: SkeletonPose,
  t: number,
): SkeletonPose {
  const mix = (pa: Point2D, pb: Point2D): Point2D => ({
    x: pa.x + (pb.x - pa.x) * t,
    y: pa.y + (pb.y - pa.y) * t,
  })
  return {
    nose: mix(a.nose, b.nose),
    shoulder: mix(a.shoulder, b.shoulder),
    hip: mix(a.hip, b.hip),
    knee: mix(a.knee, b.knee),
    ankle: mix(a.ankle, b.ankle),
    footVisibility: a.footVisibility ?? b.footVisibility,
  }
}

/** Build the full 33-landmark array for a pose. */
export function skeletonLandmarks(
  pose: SkeletonPose,
  visibility: number = DEFAULT_VISIBILITY,
): NormalizedLandmark[] {
  const footVisibility = pose.footVisibility ?? visibility
  const {
    nose,
    shoulder: lShoulder,
    hip: lHip,
    knee: lKnee,
    ankle: lAnkle,
  } = pose

  // Filler for face/hand landmarks the analysis never reads: parked near the
  // matching body region so the drawn skeleton looks sane.
  const landmarks: NormalizedLandmark[] = Array.from({ length: 33 }, () =>
    lm({ x: nose.x, y: nose.y + 0.02 }, FILLER_VISIBILITY),
  )

  const set = (index: number, p: Point2D, v: number = visibility) => {
    landmarks[index] = lm(p, v)
  }

  const I = LANDMARK_INDICES
  set(I.NOSE, nose)
  set(I.LEFT_EAR, { x: nose.x - 0.03, y: nose.y })
  set(I.RIGHT_EAR, { x: nose.x + 0.03, y: nose.y })
  set(I.LEFT_SHOULDER, lShoulder)
  set(I.RIGHT_SHOULDER, mirror(lShoulder))
  set(I.LEFT_HIP, lHip)
  set(I.RIGHT_HIP, mirror(lHip))
  set(I.LEFT_KNEE, lKnee)
  set(I.RIGHT_KNEE, mirror(lKnee))
  set(I.LEFT_ANKLE, lAnkle, footVisibility)
  set(I.RIGHT_ANKLE, mirror(lAnkle), footVisibility)
  set(I.LEFT_HEEL, { x: lAnkle.x, y: lAnkle.y + 0.025 }, footVisibility)
  set(I.RIGHT_HEEL, mirror({ x: lAnkle.x, y: lAnkle.y + 0.025 }), footVisibility)
  set(I.LEFT_FOOT_INDEX, { x: lAnkle.x - 0.01, y: lAnkle.y + 0.035 }, footVisibility)
  set(
    I.RIGHT_FOOT_INDEX,
    mirror({ x: lAnkle.x - 0.01, y: lAnkle.y + 0.035 }),
    footVisibility,
  )

  // Arms relaxed at the sides, riding with the shoulders.
  const elbow = { x: lShoulder.x - 0.03, y: lShoulder.y + 0.12 }
  const wrist = { x: lShoulder.x - 0.04, y: lShoulder.y + 0.23 }
  set(13, elbow, FILLER_VISIBILITY)
  set(14, mirror(elbow), FILLER_VISIBILITY)
  set(15, wrist, FILLER_VISIBILITY)
  set(16, mirror(wrist), FILLER_VISIBILITY)

  return landmarks
}

/** poseConfidence exactly as PoseEngine computes it: mean critical visibility. */
function criticalConfidence(landmarks: NormalizedLandmark[]): number {
  let sum = 0
  CRITICAL_LANDMARKS.forEach((index) => {
    if (landmarks[index]) sum += landmarks[index].visibility
  })
  return sum / CRITICAL_LANDMARKS.length
}

/** Build a PoseFrame at 30 fps tape time from a pose. */
export function skeletonFrame(pose: SkeletonPose, frameIndex: number, fps = 30): PoseFrame {
  const landmarks = skeletonLandmarks(pose)
  return {
    timestamp: (frameIndex * 1000) / fps,
    frameIndex,
    landmarks,
    worldLandmarks: [],
    poseConfidence: criticalConfidence(landmarks),
  }
}
