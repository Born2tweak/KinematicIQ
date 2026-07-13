import type { NormalizedLandmark, PoseFrame } from '../../cv/types'
import { LANDMARK_INDICES } from '../../cv/types'
import type { InlineLungeSide, InlineLungeSignalSample } from './types'

const VISIBILITY_MIN = 0.5

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

function angle(a: NormalizedLandmark, b: NormalizedLandmark, c: NormalizedLandmark): number {
  const bax = a.x - b.x
  const bay = a.y - b.y
  const bcx = c.x - b.x
  const bcy = c.y - b.y
  const denominator = Math.hypot(bax, bay) * Math.hypot(bcx, bcy)
  if (denominator === 0) return Number.NaN
  const cosine = Math.max(-1, Math.min(1, (bax * bcx + bay * bcy) / denominator))
  return Math.acos(cosine) * 180 / Math.PI
}

const indicesFor = (side: InlineLungeSide) => side === 'left'
  ? { hip: LANDMARK_INDICES.LEFT_HIP, knee: LANDMARK_INDICES.LEFT_KNEE, ankle: LANDMARK_INDICES.LEFT_ANKLE, foot: LANDMARK_INDICES.LEFT_FOOT_INDEX }
  : { hip: LANDMARK_INDICES.RIGHT_HIP, knee: LANDMARK_INDICES.RIGHT_KNEE, ankle: LANDMARK_INDICES.RIGHT_ANKLE, foot: LANDMARK_INDICES.RIGHT_FOOT_INDEX }

export interface InlineLungeCalibration { frameCount: number; leadFootX: number; pelvisY: number }

export function calibrateInlineLunge(frames: readonly PoseFrame[], side: InlineLungeSide, frameCount = 15): InlineLungeCalibration {
  if (!Number.isInteger(frameCount) || frameCount < 5) throw new Error('Inline-lunge calibration requires at least 5 frames.')
  const indices = indicesFor(side)
  const usable = frames.slice(0, frameCount).filter((frame) => {
    const required = [indices.hip, indices.knee, indices.ankle, indices.foot, LANDMARK_INDICES.LEFT_HIP, LANDMARK_INDICES.RIGHT_HIP]
    return required.every((index) => (frame.landmarks[index]?.visibility ?? 0) >= VISIBILITY_MIN)
  })
  if (usable.length < Math.ceil(frameCount * 0.8)) throw new Error('Calibration failed: lead leg and pelvis must remain visible while standing.')
  return {
    frameCount,
    leadFootX: median(usable.map((frame) => frame.landmarks[indices.foot].x)),
    pelvisY: median(usable.map((frame) => (frame.landmarks[LANDMARK_INDICES.LEFT_HIP].y + frame.landmarks[LANDMARK_INDICES.RIGHT_HIP].y) / 2)),
  }
}

export function extractInlineLungeSignals(frames: readonly PoseFrame[], side: InlineLungeSide, calibration: InlineLungeCalibration): InlineLungeSignalSample[] {
  const indices = indicesFor(side)
  return frames.map((frame) => {
    const landmarks = frame.landmarks
    const required = [indices.hip, indices.knee, indices.ankle, indices.foot, LANDMARK_INDICES.LEFT_HIP, LANDMARK_INDICES.RIGHT_HIP]
    const readable = required.every((index) => (landmarks[index]?.visibility ?? 0) >= VISIBILITY_MIN)
    if (!readable) return { frameIndex: frame.frameIndex, timestamp: frame.timestamp, readable: false, footDisplacement: null, pelvisDrop: null, leadKneeAngle: null }
    const kneeAngle = angle(landmarks[indices.hip], landmarks[indices.knee], landmarks[indices.ankle])
    return {
      frameIndex: frame.frameIndex,
      timestamp: frame.timestamp,
      readable: Number.isFinite(kneeAngle),
      footDisplacement: Math.abs(landmarks[indices.foot].x - calibration.leadFootX),
      pelvisDrop: ((landmarks[LANDMARK_INDICES.LEFT_HIP].y + landmarks[LANDMARK_INDICES.RIGHT_HIP].y) / 2) - calibration.pelvisY,
      leadKneeAngle: Number.isFinite(kneeAngle) ? kneeAngle : null,
    }
  })
}
