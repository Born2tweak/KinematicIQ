import type { JointAngles, NormalizedLandmark, PoseFrame } from '../cv/types'
import { LANDMARK_INDICES } from '../cv/types'

/** Empty MediaPipe-style landmark array (33 joints). */
export function emptyLandmarks(): NormalizedLandmark[] {
  return Array.from({ length: 33 }, () => ({
    x: 0.5,
    y: 0.5,
    z: 0,
    visibility: 1,
  }))
}

export function makeAngles(
  knee: number,
  rightKnee: number = knee,
  overrides: Partial<JointAngles> = {},
): JointAngles {
  return {
    leftKnee: knee,
    rightKnee: rightKnee,
    leftHip: 170,
    rightHip: 170,
    leftAnkle: 90,
    rightAnkle: 90,
    trunkAngle: 18,
    trunkLean: 18,
    pelvisTilt: null,
    ...overrides,
  }
}

export function makeFrame(
  frameIndex: number,
  timestamp: number,
  poseConfidence = 0.85,
): PoseFrame {
  return {
    frameIndex,
    timestamp,
    landmarks: emptyLandmarks(),
    worldLandmarks: [],
    poseConfidence,
  }
}

/** Low hip visibility triggers seated / chair-bounce heuristics in rep counter. */
export function landmarksWithHipVisibility(hipVisibility: number): NormalizedLandmark[] {
  const landmarks = emptyLandmarks()
  const hip = { x: 0.5, y: 0.55, z: 0, visibility: hipVisibility }
  landmarks[LANDMARK_INDICES.LEFT_HIP] = { ...hip, x: 0.45 }
  landmarks[LANDMARK_INDICES.RIGHT_HIP] = { ...hip, x: 0.55 }
  landmarks[LANDMARK_INDICES.LEFT_SHOULDER] = { x: 0.45, y: 0.25, z: 0, visibility: 1 }
  landmarks[LANDMARK_INDICES.RIGHT_SHOULDER] = { x: 0.55, y: 0.25, z: 0, visibility: 1 }
  landmarks[LANDMARK_INDICES.LEFT_KNEE] = { x: 0.45, y: 0.45, z: 0, visibility: 1 }
  landmarks[LANDMARK_INDICES.RIGHT_KNEE] = { x: 0.55, y: 0.45, z: 0, visibility: 1 }
  landmarks[LANDMARK_INDICES.LEFT_ANKLE] = { x: 0.45, y: 0.7, z: 0, visibility: 1 }
  landmarks[LANDMARK_INDICES.RIGHT_ANKLE] = { x: 0.55, y: 0.7, z: 0, visibility: 1 }
  landmarks[LANDMARK_INDICES.LEFT_FOOT_INDEX] = { x: 0.45, y: 0.75, z: 0, visibility: 1 }
  landmarks[LANDMARK_INDICES.RIGHT_FOOT_INDEX] = { x: 0.55, y: 0.75, z: 0, visibility: 1 }
  return landmarks
}

/** Straight leg in image space — knee angle near 180°. */
export function standingLegLandmarks(): NormalizedLandmark[] {
  const landmarks = emptyLandmarks()
  const set = (idx: number, x: number, y: number) => {
    landmarks[idx] = { x, y, z: 0, visibility: 1 }
  }
  set(LANDMARK_INDICES.LEFT_SHOULDER, 0.45, 0.2)
  set(LANDMARK_INDICES.RIGHT_SHOULDER, 0.55, 0.2)
  set(LANDMARK_INDICES.LEFT_HIP, 0.45, 0.38)
  set(LANDMARK_INDICES.RIGHT_HIP, 0.55, 0.38)
  set(LANDMARK_INDICES.LEFT_KNEE, 0.45, 0.55)
  set(LANDMARK_INDICES.RIGHT_KNEE, 0.55, 0.55)
  set(LANDMARK_INDICES.LEFT_ANKLE, 0.45, 0.72)
  set(LANDMARK_INDICES.RIGHT_ANKLE, 0.55, 0.72)
  set(LANDMARK_INDICES.LEFT_FOOT_INDEX, 0.45, 0.78)
  set(LANDMARK_INDICES.RIGHT_FOOT_INDEX, 0.55, 0.78)
  return landmarks
}

/** Bent knee — smaller interior angle at the knee (hip–knee–ankle). */
export function deepSquatLegLandmarks(): NormalizedLandmark[] {
  const landmarks = emptyLandmarks()
  const set = (idx: number, x: number, y: number) => {
    landmarks[idx] = { x, y, z: 0, visibility: 1 }
  }
  set(LANDMARK_INDICES.LEFT_SHOULDER, 0.42, 0.2)
  set(LANDMARK_INDICES.RIGHT_SHOULDER, 0.58, 0.2)
  set(LANDMARK_INDICES.LEFT_HIP, 0.44, 0.36)
  set(LANDMARK_INDICES.RIGHT_HIP, 0.56, 0.36)
  set(LANDMARK_INDICES.LEFT_KNEE, 0.62, 0.54)
  set(LANDMARK_INDICES.RIGHT_KNEE, 0.62, 0.54)
  set(LANDMARK_INDICES.LEFT_ANKLE, 0.52, 0.72)
  set(LANDMARK_INDICES.RIGHT_ANKLE, 0.52, 0.72)
  set(LANDMARK_INDICES.LEFT_FOOT_INDEX, 0.52, 0.78)
  set(LANDMARK_INDICES.RIGHT_FOOT_INDEX, 0.52, 0.78)
  return landmarks
}

export function repeat<T>(count: number, value: T): T[] {
  return Array.from({ length: count }, () => value)
}
