import type { JointAngles, NormalizedLandmark, PoseFrame } from '../../cv/types'
import { LANDMARK_INDICES } from '../../cv/types'
import type { CalibrationResult } from '../../cv/drawCalibration'

const LANDMARK_COUNT = 33

export function createLandmark(
  x: number,
  y: number,
  visibility = 0.95,
): NormalizedLandmark {
  return { x, y, z: 0, visibility }
}

/** Empty MediaPipe-sized landmark array with optional overrides by index. */
export function createLandmarks(
  overrides: Partial<Record<number, NormalizedLandmark>> = {},
): NormalizedLandmark[] {
  const landmarks: NormalizedLandmark[] = Array.from({ length: LANDMARK_COUNT }, () =>
    createLandmark(0, 0, 0),
  )
  for (const [index, landmark] of Object.entries(overrides)) {
    if (landmark !== undefined) {
      landmarks[Number(index)] = landmark
    }
  }
  return landmarks
}

/** Squat-ready landmarks: hips, knees, ankles, shoulders visible at standing pose. */
export function createSquatLandmarks(opts?: {
  hipY?: number
  kneeY?: number
  ankleY?: number
}): NormalizedLandmark[] {
  const hipY = opts?.hipY ?? 0.45
  const kneeY = opts?.kneeY ?? 0.58
  const ankleY = opts?.ankleY ?? 0.72
  const vis = 0.92

  return createLandmarks({
    [LANDMARK_INDICES.LEFT_SHOULDER]: createLandmark(0.42, 0.28, vis),
    [LANDMARK_INDICES.RIGHT_SHOULDER]: createLandmark(0.58, 0.28, vis),
    [LANDMARK_INDICES.LEFT_HIP]: createLandmark(0.44, hipY, vis),
    [LANDMARK_INDICES.RIGHT_HIP]: createLandmark(0.56, hipY, vis),
    [LANDMARK_INDICES.LEFT_KNEE]: createLandmark(0.44, kneeY, vis),
    [LANDMARK_INDICES.RIGHT_KNEE]: createLandmark(0.56, kneeY, vis),
    [LANDMARK_INDICES.LEFT_ANKLE]: createLandmark(0.44, ankleY, vis),
    [LANDMARK_INDICES.RIGHT_ANKLE]: createLandmark(0.56, ankleY, vis),
    [LANDMARK_INDICES.LEFT_FOOT_INDEX]: createLandmark(0.44, ankleY + 0.04, vis),
    [LANDMARK_INDICES.RIGHT_FOOT_INDEX]: createLandmark(0.56, ankleY + 0.04, vis),
  })
}

export function createPoseFrame(opts: {
  frameIndex?: number
  timestamp?: number
  kneeAngle?: number
  hipY?: number
  poseConfidence?: number
  landmarks?: NormalizedLandmark[]
}): PoseFrame {
  const hipY = opts.hipY ?? 0.45
  const landmarks =
    opts.landmarks ??
    createSquatLandmarks({ hipY, kneeY: hipY + 0.13 })

  return {
    frameIndex: opts.frameIndex ?? 0,
    timestamp: opts.timestamp ?? 0,
    landmarks,
    worldLandmarks: [],
    poseConfidence: opts.poseConfidence ?? 0.85,
  }
}

export function makeJointAngles(
  knee: number,
  overrides: Partial<JointAngles> = {},
): JointAngles {
  return {
    leftKnee: knee,
    rightKnee: knee,
    leftHip: 170,
    rightHip: 170,
    leftAnkle: 90,
    rightAnkle: 90,
    trunkAngle: 12,
    trunkLean: 12,
    pelvisTilt: null,
    ...overrides,
  }
}

export function calibratedBody(): CalibrationResult {
  return {
    isCalibrated: true,
    missingJoints: [],
  }
}

export function sampleRep(overrides: Partial<import('../../cv/types').RepMetrics> = {}) {
  return {
    repNumber: 1,
    startFrameIndex: 0,
    bottomFrameIndex: 10,
    endFrameIndex: 40,
    startTimestamp: 0,
    endTimestamp: 2000,
    minLeftKneeAngle: 92,
    minRightKneeAngle: 94,
    averageTrunkLean: 18,
    maxTrunkLean: 22,
    hipShiftAtBottom: 0.02,
    shoulderAsymmetryAtBottom: 0.01,
    kneeAsymmetry: 2,
    confidence: 0.75,
    durationMs: 2000,
    ...overrides,
  }
}
