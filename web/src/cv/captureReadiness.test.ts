import { describe, expect, it } from 'vitest'
import { assessCaptureReadiness } from './captureReadiness'
import { createLandmark, createLandmarks, createPoseFrame } from '../test/fixtures/poseFixtures'
import { LANDMARK_INDICES } from './types'

describe('cv/captureReadiness', () => {
  it('reports notReady with a full failing checklist when no frame', () => {
    const a = assessCaptureReadiness(null)
    expect(a.state).toBe('notReady')
    expect(a.checklist.every((c) => !c.ok)).toBe(true)
    expect(a.fixes.length).toBeGreaterThan(0)
  })

  it('reports ready for a well-framed standing squat pose', () => {
    // createPoseFrame uses createSquatLandmarks; add a visible head (nose)
    // so the head check passes and framing is centered/good distance.
    const landmarks = createLandmarks({
      [LANDMARK_INDICES.NOSE]: createLandmark(0.5, 0.16, 0.95),
      [LANDMARK_INDICES.LEFT_SHOULDER]: createLandmark(0.42, 0.28, 0.92),
      [LANDMARK_INDICES.RIGHT_SHOULDER]: createLandmark(0.58, 0.28, 0.92),
      [LANDMARK_INDICES.LEFT_HIP]: createLandmark(0.44, 0.45, 0.92),
      [LANDMARK_INDICES.RIGHT_HIP]: createLandmark(0.56, 0.45, 0.92),
      [LANDMARK_INDICES.LEFT_KNEE]: createLandmark(0.44, 0.62, 0.92),
      [LANDMARK_INDICES.RIGHT_KNEE]: createLandmark(0.56, 0.62, 0.92),
      [LANDMARK_INDICES.LEFT_ANKLE]: createLandmark(0.44, 0.8, 0.92),
      [LANDMARK_INDICES.RIGHT_ANKLE]: createLandmark(0.56, 0.8, 0.92),
    })
    const frame = createPoseFrame({ landmarks })
    const a = assessCaptureReadiness(frame)
    expect(a.state).toBe('ready')
    expect(a.checklist.every((c) => c.ok)).toBe(true)
    expect(a.reasons).toHaveLength(0)
    expect(a.guidance.ok).toBe(true)
  })

  it('reports marginal when the whole body is visible but off-center', () => {
    const shifted = createLandmarks({
      [LANDMARK_INDICES.NOSE]: createLandmark(0.2, 0.16, 0.95),
      [LANDMARK_INDICES.LEFT_SHOULDER]: createLandmark(0.12, 0.28, 0.92),
      [LANDMARK_INDICES.RIGHT_SHOULDER]: createLandmark(0.28, 0.28, 0.92),
      [LANDMARK_INDICES.LEFT_HIP]: createLandmark(0.14, 0.45, 0.92),
      [LANDMARK_INDICES.RIGHT_HIP]: createLandmark(0.26, 0.45, 0.92),
      [LANDMARK_INDICES.LEFT_KNEE]: createLandmark(0.14, 0.62, 0.92),
      [LANDMARK_INDICES.RIGHT_KNEE]: createLandmark(0.26, 0.62, 0.92),
      [LANDMARK_INDICES.LEFT_ANKLE]: createLandmark(0.14, 0.8, 0.92),
      [LANDMARK_INDICES.RIGHT_ANKLE]: createLandmark(0.26, 0.8, 0.92),
    })
    const frame = createPoseFrame({ landmarks: shifted })
    const a = assessCaptureReadiness(frame)
    expect(a.state).toBe('marginal')
    expect(a.checklist.find((c) => c.id === 'centered')?.ok).toBe(false)
    expect(a.reasons.some((r) => r.includes('Centered'))).toBe(true)
  })

  it('reports notReady when feet are out of frame', () => {
    const noFeet = createLandmarks({
      [LANDMARK_INDICES.NOSE]: createLandmark(0.5, 0.16, 0.95),
      [LANDMARK_INDICES.LEFT_SHOULDER]: createLandmark(0.42, 0.28, 0.92),
      [LANDMARK_INDICES.RIGHT_SHOULDER]: createLandmark(0.58, 0.28, 0.92),
      [LANDMARK_INDICES.LEFT_HIP]: createLandmark(0.44, 0.45, 0.92),
      [LANDMARK_INDICES.RIGHT_HIP]: createLandmark(0.56, 0.45, 0.92),
      [LANDMARK_INDICES.LEFT_KNEE]: createLandmark(0.44, 0.62, 0.92),
      [LANDMARK_INDICES.RIGHT_KNEE]: createLandmark(0.56, 0.62, 0.92),
      // ankles left at (0,0,0) visibility 0 → not visible
    })
    const frame = createPoseFrame({ landmarks: noFeet })
    const a = assessCaptureReadiness(frame)
    expect(a.state).toBe('notReady')
    expect(a.checklist.find((c) => c.id === 'feet')?.ok).toBe(false)
  })
})
