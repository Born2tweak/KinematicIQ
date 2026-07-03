import { midpoint, safeLandmark } from './geometry'
import { weightedMean } from './stats'
import type { PoseFrame, RepMetrics } from '../cv/types'
import { LANDMARK_INDICES } from '../cv/types'

export interface FrameAsymmetry {
  hipShift: number | null
  shoulderAsymmetry: number | null
}

/** Hip shift and shoulder level difference at the current frame (e.g. bottom). */
export function measureFrameAsymmetry(frame: PoseFrame): FrameAsymmetry {
  const leftHip = safeLandmark(frame, LANDMARK_INDICES.LEFT_HIP)
  const rightHip = safeLandmark(frame, LANDMARK_INDICES.RIGHT_HIP)
  const leftAnkle = safeLandmark(frame, LANDMARK_INDICES.LEFT_ANKLE)
  const rightAnkle = safeLandmark(frame, LANDMARK_INDICES.RIGHT_ANKLE)
  const leftShoulder = safeLandmark(frame, LANDMARK_INDICES.LEFT_SHOULDER)
  const rightShoulder = safeLandmark(frame, LANDMARK_INDICES.RIGHT_SHOULDER)

  let hipShift: number | null = null
  if (leftHip && rightHip && leftAnkle && rightAnkle) {
    const hipMid = midpoint(leftHip, rightHip)
    const footMid = midpoint(leftAnkle, rightAnkle)
    hipShift = Math.abs(hipMid.x - footMid.x)
  }

  let shoulderAsymmetry: number | null = null
  if (leftShoulder && rightShoulder) {
    shoulderAsymmetry = Math.abs(leftShoulder.y - rightShoulder.y)
  }

  return { hipShift, shoulderAsymmetry }
}

export interface SetAsymmetrySummary {
  avgHipShift: number | null
  avgShoulderAsymmetry: number | null
  avgKneeAsymmetry: number | null
}

/**
 * Aggregate asymmetry metrics captured per rep at bottom position, weighted by
 * each rep's pose confidence so poorly-tracked reps contribute less.
 */
export function summarizeSetAsymmetry(reps: RepMetrics[]): SetAsymmetrySummary {
  const hipPairs: Array<[number, number]> = []
  const shoulderPairs: Array<[number, number]> = []
  const kneePairs: Array<[number, number]> = []
  for (const rep of reps) {
    if (rep.hipShiftAtBottom !== null) hipPairs.push([rep.hipShiftAtBottom, rep.confidence])
    if (rep.shoulderAsymmetryAtBottom !== null) {
      shoulderPairs.push([rep.shoulderAsymmetryAtBottom, rep.confidence])
    }
    if (rep.kneeAsymmetry !== null) kneePairs.push([rep.kneeAsymmetry, rep.confidence])
  }

  return {
    avgHipShift: weightedMean(hipPairs),
    avgShoulderAsymmetry: weightedMean(shoulderPairs),
    avgKneeAsymmetry: weightedMean(kneePairs),
  }
}
