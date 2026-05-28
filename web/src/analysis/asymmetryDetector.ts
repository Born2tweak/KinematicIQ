import { midpoint, safeLandmark } from './geometry'
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

const average = (values: number[]): number | null => {
  if (values.length === 0) return null
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

/** Aggregate asymmetry metrics captured per rep at bottom position. */
export function summarizeSetAsymmetry(reps: RepMetrics[]): SetAsymmetrySummary {
  const hipShifts = reps
    .map((rep) => rep.hipShiftAtBottom)
    .filter((value): value is number => value !== null)
  const shoulderValues = reps
    .map((rep) => rep.shoulderAsymmetryAtBottom)
    .filter((value): value is number => value !== null)
  const kneeValues = reps
    .map((rep) => rep.kneeAsymmetry)
    .filter((value): value is number => value !== null)

  return {
    avgHipShift: average(hipShifts),
    avgShoulderAsymmetry: average(shoulderValues),
    avgKneeAsymmetry: average(kneeValues),
  }
}
