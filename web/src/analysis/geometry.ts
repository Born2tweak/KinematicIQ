import { CONFIDENCE_THRESHOLD, PoseFrame, NormalizedLandmark } from '../cv/types'

export interface Point2D {
  x: number
  y: number
}

const isFinitePoint = (point: Point2D): boolean =>
  Number.isFinite(point.x) && Number.isFinite(point.y)

/**
 * Returns the Euclidean distance between two 2D points.
 */
export function distance2D(a: Point2D, b: Point2D): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

/**
 * Returns the midpoint between two 2D points.
 */
export function midpoint(a: Point2D, b: Point2D): Point2D {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  }
}

/**
 * Returns the angle in degrees formed by three 2D points with the vertex at pointB.
 * Returns null when the angle cannot be calculated safely.
 */
export function angleBetweenThreePoints(
  pointA: Point2D,
  pointB: Point2D,
  pointC: Point2D,
): number | null {
  if (!isFinitePoint(pointA) || !isFinitePoint(pointB) || !isFinitePoint(pointC)) {
    return null
  }

  const vectorBA = {
    x: pointA.x - pointB.x,
    y: pointA.y - pointB.y,
  }
  const vectorBC = {
    x: pointC.x - pointB.x,
    y: pointC.y - pointB.y,
  }

  const magnitudeBA = Math.hypot(vectorBA.x, vectorBA.y)
  const magnitudeBC = Math.hypot(vectorBC.x, vectorBC.y)

  if (magnitudeBA === 0 || magnitudeBC === 0) {
    return null
  }

  const dotProduct = vectorBA.x * vectorBC.x + vectorBA.y * vectorBC.y
  const cosine = dotProduct / (magnitudeBA * magnitudeBC)
  const clampedCosine = Math.min(1, Math.max(-1, cosine))
  const angleDegrees = Math.acos(clampedCosine) * (180 / Math.PI)

  return Number.isFinite(angleDegrees) ? angleDegrees : null
}

/**
 * Safely returns a landmark when it exists and meets the minimum visibility threshold.
 */
export function safeLandmark(
  frame: PoseFrame,
  index: number,
  minConfidence: number = CONFIDENCE_THRESHOLD,
): NormalizedLandmark | null {
  const landmark = frame.landmarks[index]

  if (!landmark) {
    return null
  }

  if (
    !Number.isFinite(landmark.x) ||
    !Number.isFinite(landmark.y) ||
    !Number.isFinite(landmark.z) ||
    !Number.isFinite(landmark.visibility)
  ) {
    return null
  }

  return landmark.visibility >= minConfidence ? landmark : null
}
