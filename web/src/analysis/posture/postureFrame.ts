/**
 * Per-frame 3D posture extraction from MediaPipe worldLandmarks
 * (metric space, hip-centered, Y-down). This is the first analysis
 * consumer of the 3D stream — previously visualization-only.
 *
 * Pure functions, no DOM/MediaPipe imports; unit-testable on synthetic
 * landmarks.
 */
import type { Vector3Like } from '../../cv/pose3d'
import {
  CONFIDENCE_THRESHOLD,
  LANDMARK_INDICES,
  type PoseFrame,
  type WorldLandmark,
} from '../../cv/types'

export interface PostureFrameSample {
  timestamp: number
  /** Hip flexion in degrees (0 = standing tall, larger = more hip bend). Average of sides. */
  hipFlexion: number
  /** Knee flexion in degrees (0 = straight leg, larger = more knee bend). Average of sides. */
  kneeFlexion: number
  /** Trunk angle vs vertical in degrees, measured in 3D world space. */
  trunkAngle: number
  /** Hip-center position in world space (center-of-mass proxy). */
  hipCenter: Vector3Like
  /** Minimum visibility among the landmarks used, in [0, 1]. */
  confidence: number
}

function sub(a: Vector3Like, b: Vector3Like): Vector3Like {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }
}

function norm(v: Vector3Like): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)
}

function dot(a: Vector3Like, b: Vector3Like): number {
  return a.x * b.x + a.y * b.y + a.z * b.z
}

/** Interior angle at vertex `b` (degrees) between rays b→a and b→c, in 3D. */
export function angleAt3D(
  a: Vector3Like,
  b: Vector3Like,
  c: Vector3Like,
): number | null {
  const u = sub(a, b)
  const v = sub(c, b)
  const lu = norm(u)
  const lv = norm(v)
  if (lu < 1e-9 || lv < 1e-9) return null
  const cos = Math.max(-1, Math.min(1, dot(u, v) / (lu * lv)))
  return (Math.acos(cos) * 180) / Math.PI
}

function mid(a: WorldLandmark, b: WorldLandmark): Vector3Like {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2 }
}

const REQUIRED = [
  LANDMARK_INDICES.LEFT_SHOULDER,
  LANDMARK_INDICES.RIGHT_SHOULDER,
  LANDMARK_INDICES.LEFT_HIP,
  LANDMARK_INDICES.RIGHT_HIP,
  LANDMARK_INDICES.LEFT_KNEE,
  LANDMARK_INDICES.RIGHT_KNEE,
  LANDMARK_INDICES.LEFT_ANKLE,
  LANDMARK_INDICES.RIGHT_ANKLE,
] as const

/**
 * Extract a 3D posture sample from a pose frame, or null when the 3D
 * stream is missing or the required landmarks are below confidence.
 * 2D analysis never depends on this — 3D is additive, not a gate.
 */
export function extractPostureFrame(
  frame: PoseFrame,
  minConfidence: number = CONFIDENCE_THRESHOLD,
): PostureFrameSample | null {
  const w = frame.worldLandmarks
  if (!w || w.length === 0) return null

  let confidence = 1
  for (const index of REQUIRED) {
    const lm = w[index]
    if (!lm) return null
    confidence = Math.min(confidence, lm.visibility)
  }
  if (confidence < minConfidence) return null

  const ls = w[LANDMARK_INDICES.LEFT_SHOULDER]
  const rs = w[LANDMARK_INDICES.RIGHT_SHOULDER]
  const lh = w[LANDMARK_INDICES.LEFT_HIP]
  const rh = w[LANDMARK_INDICES.RIGHT_HIP]
  const lk = w[LANDMARK_INDICES.LEFT_KNEE]
  const rk = w[LANDMARK_INDICES.RIGHT_KNEE]
  const la = w[LANDMARK_INDICES.LEFT_ANKLE]
  const ra = w[LANDMARK_INDICES.RIGHT_ANKLE]

  // Interior angles per side, then flexion = 180 − interior.
  const leftHipInterior = angleAt3D(ls, lh, lk)
  const rightHipInterior = angleAt3D(rs, rh, rk)
  const leftKneeInterior = angleAt3D(lh, lk, la)
  const rightKneeInterior = angleAt3D(rh, rk, ra)
  if (
    leftHipInterior === null ||
    rightHipInterior === null ||
    leftKneeInterior === null ||
    rightKneeInterior === null
  ) {
    return null
  }

  const hipFlexion =
    180 - (leftHipInterior + rightHipInterior) / 2
  const kneeFlexion =
    180 - (leftKneeInterior + rightKneeInterior) / 2

  // Trunk vs vertical: world space is Y-down, so "up" is −Y.
  const hipMid = mid(lh, rh)
  const shoulderMid = mid(ls, rs)
  const trunk = sub(shoulderMid, hipMid)
  const trunkLen = norm(trunk)
  if (trunkLen < 1e-9) return null
  const cosVertical = Math.max(-1, Math.min(1, -trunk.y / trunkLen))
  const trunkAngle = (Math.acos(cosVertical) * 180) / Math.PI

  return {
    timestamp: frame.timestamp,
    hipFlexion,
    kneeFlexion,
    trunkAngle,
    hipCenter: hipMid,
    confidence,
  }
}
