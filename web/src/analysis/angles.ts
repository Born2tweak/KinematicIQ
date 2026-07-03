import {
  CONFIDENCE_THRESHOLD,
  JointAngles,
  LANDMARK_INDICES,
  PoseFrame,
} from '../cv/types'
import { angleBetweenThreePoints, landmarkConfidence, midpoint, safeLandmark } from './geometry'

const getAngleFromLandmarks = (
  frame: PoseFrame,
  firstIndex: number,
  vertexIndex: number,
  thirdIndex: number,
  minConfidence: number,
): number | null => {
  const first = safeLandmark(frame, firstIndex, minConfidence)
  const vertex = safeLandmark(frame, vertexIndex, minConfidence)
  const third = safeLandmark(frame, thirdIndex, minConfidence)

  if (!first || !vertex || !third) {
    return null
  }

  return angleBetweenThreePoints(first, vertex, third)
}

/**
 * Returns the left knee angle in degrees from hip, knee, and ankle landmarks.
 */
export function leftKneeAngle(
  frame: PoseFrame,
  minConfidence: number = CONFIDENCE_THRESHOLD,
): number | null {
  return getAngleFromLandmarks(
    frame,
    LANDMARK_INDICES.LEFT_HIP,
    LANDMARK_INDICES.LEFT_KNEE,
    LANDMARK_INDICES.LEFT_ANKLE,
    minConfidence,
  )
}

/**
 * Returns the right knee angle in degrees from hip, knee, and ankle landmarks.
 */
export function rightKneeAngle(
  frame: PoseFrame,
  minConfidence: number = CONFIDENCE_THRESHOLD,
): number | null {
  return getAngleFromLandmarks(
    frame,
    LANDMARK_INDICES.RIGHT_HIP,
    LANDMARK_INDICES.RIGHT_KNEE,
    LANDMARK_INDICES.RIGHT_ANKLE,
    minConfidence,
  )
}

/**
 * Returns the left hip angle in degrees from shoulder, hip, and knee landmarks.
 */
export function leftHipAngle(
  frame: PoseFrame,
  minConfidence: number = CONFIDENCE_THRESHOLD,
): number | null {
  return getAngleFromLandmarks(
    frame,
    LANDMARK_INDICES.LEFT_SHOULDER,
    LANDMARK_INDICES.LEFT_HIP,
    LANDMARK_INDICES.LEFT_KNEE,
    minConfidence,
  )
}

/**
 * Returns the right hip angle in degrees from shoulder, hip, and knee landmarks.
 */
export function rightHipAngle(
  frame: PoseFrame,
  minConfidence: number = CONFIDENCE_THRESHOLD,
): number | null {
  return getAngleFromLandmarks(
    frame,
    LANDMARK_INDICES.RIGHT_SHOULDER,
    LANDMARK_INDICES.RIGHT_HIP,
    LANDMARK_INDICES.RIGHT_KNEE,
    minConfidence,
  )
}

/**
 * Returns the left ankle angle in degrees from knee, ankle, and foot index landmarks.
 */
export function leftAnkleAngle(
  frame: PoseFrame,
  minConfidence: number = CONFIDENCE_THRESHOLD,
): number | null {
  return getAngleFromLandmarks(
    frame,
    LANDMARK_INDICES.LEFT_KNEE,
    LANDMARK_INDICES.LEFT_ANKLE,
    LANDMARK_INDICES.LEFT_FOOT_INDEX,
    minConfidence,
  )
}

/**
 * Returns the right ankle angle in degrees from knee, ankle, and foot index landmarks.
 */
export function rightAnkleAngle(
  frame: PoseFrame,
  minConfidence: number = CONFIDENCE_THRESHOLD,
): number | null {
  return getAngleFromLandmarks(
    frame,
    LANDMARK_INDICES.RIGHT_KNEE,
    LANDMARK_INDICES.RIGHT_ANKLE,
    LANDMARK_INDICES.RIGHT_FOOT_INDEX,
    minConfidence,
  )
}

/**
 * Returns the trunk angle in degrees relative to vertical using shoulder and hip midpoints.
 */
export function trunkAngle(
  frame: PoseFrame,
  minConfidence: number = CONFIDENCE_THRESHOLD,
): number | null {
  const leftShoulder = safeLandmark(frame, LANDMARK_INDICES.LEFT_SHOULDER, minConfidence)
  const rightShoulder = safeLandmark(frame, LANDMARK_INDICES.RIGHT_SHOULDER, minConfidence)
  const leftHip = safeLandmark(frame, LANDMARK_INDICES.LEFT_HIP, minConfidence)
  const rightHip = safeLandmark(frame, LANDMARK_INDICES.RIGHT_HIP, minConfidence)

  if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) {
    return null
  }

  const shoulderMidpoint = midpoint(leftShoulder, rightShoulder)
  const hipMidpoint = midpoint(leftHip, rightHip)
  const verticalReference = {
    x: hipMidpoint.x,
    y: hipMidpoint.y - 1,
  }

  return angleBetweenThreePoints(shoulderMidpoint, hipMidpoint, verticalReference)
}

/**
 * Returns the set of squat-relevant joint angles for a pose frame.
 */
export function getJointAngles(
  frame: PoseFrame,
  minConfidence: number = CONFIDENCE_THRESHOLD,
): JointAngles {
  const trunk = trunkAngle(frame, minConfidence)

  return {
    leftKnee: leftKneeAngle(frame, minConfidence),
    rightKnee: rightKneeAngle(frame, minConfidence),
    leftHip: leftHipAngle(frame, minConfidence),
    rightHip: rightHipAngle(frame, minConfidence),
    leftAnkle: leftAnkleAngle(frame, minConfidence),
    rightAnkle: rightAnkleAngle(frame, minConfidence),
    trunkAngle: trunk,
    trunkLean: trunk,
    pelvisTilt: null,
  }
}

/**
 * Per-angle tracking confidence in [0, 1] — the minimum landmark visibility
 * among the landmarks that define each angle. Parallel to {@link getJointAngles}
 * (same keys) so callers can weight metrics by how well an angle was tracked
 * instead of hard-dropping it. `pelvisTilt` is not computed, so its confidence
 * is null.
 */
export interface JointAngleConfidences {
  leftKnee: number
  rightKnee: number
  leftHip: number
  rightHip: number
  leftAnkle: number
  rightAnkle: number
  trunkAngle: number
  trunkLean: number
  pelvisTilt: number | null
}

const minConfidenceOf = (frame: PoseFrame, ...indices: number[]): number =>
  Math.min(...indices.map((i) => landmarkConfidence(frame, i)))

export function getJointAngleConfidences(frame: PoseFrame): JointAngleConfidences {
  const trunk = minConfidenceOf(
    frame,
    LANDMARK_INDICES.LEFT_SHOULDER,
    LANDMARK_INDICES.RIGHT_SHOULDER,
    LANDMARK_INDICES.LEFT_HIP,
    LANDMARK_INDICES.RIGHT_HIP,
  )

  return {
    leftKnee: minConfidenceOf(
      frame,
      LANDMARK_INDICES.LEFT_HIP,
      LANDMARK_INDICES.LEFT_KNEE,
      LANDMARK_INDICES.LEFT_ANKLE,
    ),
    rightKnee: minConfidenceOf(
      frame,
      LANDMARK_INDICES.RIGHT_HIP,
      LANDMARK_INDICES.RIGHT_KNEE,
      LANDMARK_INDICES.RIGHT_ANKLE,
    ),
    leftHip: minConfidenceOf(
      frame,
      LANDMARK_INDICES.LEFT_SHOULDER,
      LANDMARK_INDICES.LEFT_HIP,
      LANDMARK_INDICES.LEFT_KNEE,
    ),
    rightHip: minConfidenceOf(
      frame,
      LANDMARK_INDICES.RIGHT_SHOULDER,
      LANDMARK_INDICES.RIGHT_HIP,
      LANDMARK_INDICES.RIGHT_KNEE,
    ),
    leftAnkle: minConfidenceOf(
      frame,
      LANDMARK_INDICES.LEFT_KNEE,
      LANDMARK_INDICES.LEFT_ANKLE,
      LANDMARK_INDICES.LEFT_FOOT_INDEX,
    ),
    rightAnkle: minConfidenceOf(
      frame,
      LANDMARK_INDICES.RIGHT_KNEE,
      LANDMARK_INDICES.RIGHT_ANKLE,
      LANDMARK_INDICES.RIGHT_FOOT_INDEX,
    ),
    trunkAngle: trunk,
    trunkLean: trunk,
    pelvisTilt: null,
  }
}
