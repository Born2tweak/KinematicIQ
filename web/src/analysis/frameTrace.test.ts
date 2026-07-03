import { describe, expect, it } from 'vitest'
import {
  buildFrameTraceSample,
  createFrameTraceCollector,
  signedHipOffsetX,
} from './frameTrace'
import { LANDMARK_INDICES } from '../cv/types'
import {
  createLandmark,
  createLandmarks,
  createPoseFrame,
  createSquatLandmarks,
  makeJointAngles,
} from '../test/fixtures/poseFixtures'

/** Squat landmarks with hips shifted laterally by `dx` (ankles stay centered). */
function shiftedHipLandmarks(dx: number) {
  const landmarks = createSquatLandmarks()
  landmarks[LANDMARK_INDICES.LEFT_HIP] = createLandmark(0.44 + dx, 0.45, 0.92)
  landmarks[LANDMARK_INDICES.RIGHT_HIP] = createLandmark(0.56 + dx, 0.45, 0.92)
  return landmarks
}

describe('signedHipOffsetX', () => {
  it('reads ~0 when hips are centered over ankles', () => {
    const frame = createPoseFrame({ landmarks: createSquatLandmarks() })
    expect(signedHipOffsetX(frame)).toBeCloseTo(0, 5)
  })

  it('preserves direction and normalizes by hip width', () => {
    // Hips shifted +0.03 with hip width 0.12 → offset ratio +0.25.
    const shiftedRight = createPoseFrame({ landmarks: shiftedHipLandmarks(0.03) })
    expect(signedHipOffsetX(shiftedRight)).toBeCloseTo(0.25, 5)

    const shiftedLeft = createPoseFrame({ landmarks: shiftedHipLandmarks(-0.03) })
    expect(signedHipOffsetX(shiftedLeft)).toBeCloseTo(-0.25, 5)
  })

  it('returns null when the athlete is side-on (hip width collapses)', () => {
    const landmarks = createSquatLandmarks()
    landmarks[LANDMARK_INDICES.LEFT_HIP] = createLandmark(0.5, 0.45, 0.92)
    landmarks[LANDMARK_INDICES.RIGHT_HIP] = createLandmark(0.505, 0.45, 0.92)
    const frame = createPoseFrame({ landmarks })
    expect(signedHipOffsetX(frame)).toBeNull()
  })

  it('returns null when required landmarks are missing', () => {
    const frame = createPoseFrame({ landmarks: createLandmarks() })
    expect(signedHipOffsetX(frame)).toBeNull()
  })
})

describe('buildFrameTraceSample', () => {
  it('captures frame identity, phase, and per-frame signals', () => {
    const frame = createPoseFrame({
      frameIndex: 7,
      timestamp: 466,
      poseConfidence: 0.9,
      landmarks: shiftedHipLandmarks(0.03),
    })
    const sample = buildFrameTraceSample(frame, makeJointAngles(120), 'DESCENDING')

    expect(sample.frameIndex).toBe(7)
    expect(sample.timestamp).toBe(466)
    expect(sample.phase).toBe('DESCENDING')
    expect(sample.kneeAngle).toBe(120)
    expect(sample.trunkLean).toBe(12)
    expect(sample.signedHipOffsetX).toBeCloseTo(0.25, 5)
    expect(sample.hipY).toBeCloseTo(0.45, 5)
    expect(sample.poseConfidence).toBe(0.9)
  })

  it('uses the deeper knee as the tracking knee angle', () => {
    const frame = createPoseFrame({})
    const angles = makeJointAngles(120, { leftKnee: 95, rightKnee: 130 })
    expect(buildFrameTraceSample(frame, angles, 'BOTTOM').kneeAngle).toBe(95)
  })

  it('records null knee angle when neither knee is tracked', () => {
    const frame = createPoseFrame({})
    const angles = makeJointAngles(120, { leftKnee: null, rightKnee: null })
    expect(buildFrameTraceSample(frame, angles, 'STANDING').kneeAngle).toBeNull()
  })
})

describe('createFrameTraceCollector', () => {
  it('accumulates samples in order and resets cleanly', () => {
    const collector = createFrameTraceCollector()
    const angles = makeJointAngles(150)

    collector.record(createPoseFrame({ frameIndex: 0 }), angles, 'STANDING')
    collector.record(createPoseFrame({ frameIndex: 1 }), angles, 'DESCENDING')
    expect(collector.count).toBe(2)

    const built = collector.build()
    expect(built.map((s) => s.frameIndex)).toEqual([0, 1])
    expect(built.map((s) => s.phase)).toEqual(['STANDING', 'DESCENDING'])

    collector.reset()
    expect(collector.count).toBe(0)
    // Previously built snapshot is unaffected by reset.
    expect(built).toHaveLength(2)
  })
})
