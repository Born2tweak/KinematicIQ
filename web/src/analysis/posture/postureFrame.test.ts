import { describe, expect, it } from 'vitest'
import { LANDMARK_INDICES, type PoseFrame, type WorldLandmark } from '../../cv/types'
import { angleAt3D, extractPostureFrame } from './postureFrame'

/** World space is meters, hip-centered, Y-down (larger y = lower). */
function makeWorldLandmarks(
  overrides: Partial<Record<number, Partial<WorldLandmark>>> = {},
  visibility = 1,
): WorldLandmark[] {
  const landmarks: WorldLandmark[] = Array.from({ length: 33 }, () => ({
    x: 0,
    y: 0,
    z: 0,
    visibility,
  }))
  const base: Record<number, Partial<WorldLandmark>> = {
    [LANDMARK_INDICES.LEFT_SHOULDER]: { x: -0.15, y: -0.5 },
    [LANDMARK_INDICES.RIGHT_SHOULDER]: { x: 0.15, y: -0.5 },
    [LANDMARK_INDICES.LEFT_HIP]: { x: -0.1, y: 0 },
    [LANDMARK_INDICES.RIGHT_HIP]: { x: 0.1, y: 0 },
    [LANDMARK_INDICES.LEFT_KNEE]: { x: -0.1, y: 0.45 },
    [LANDMARK_INDICES.RIGHT_KNEE]: { x: 0.1, y: 0.45 },
    [LANDMARK_INDICES.LEFT_ANKLE]: { x: -0.1, y: 0.9 },
    [LANDMARK_INDICES.RIGHT_ANKLE]: { x: 0.1, y: 0.9 },
  }
  for (const [index, lm] of Object.entries(base)) {
    Object.assign(landmarks[Number(index)], lm)
  }
  for (const [index, lm] of Object.entries(overrides)) {
    Object.assign(landmarks[Number(index)], lm)
  }
  return landmarks
}

function frameWith(worldLandmarks: WorldLandmark[], timestamp = 1000): PoseFrame {
  return {
    timestamp,
    frameIndex: 0,
    landmarks: [],
    worldLandmarks,
    poseConfidence: 0.9,
  }
}

describe('angleAt3D', () => {
  it('measures a right angle', () => {
    const angle = angleAt3D(
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
    )
    expect(angle).toBeCloseTo(90, 5)
  })

  it('returns null for degenerate rays', () => {
    const p = { x: 0, y: 0, z: 0 }
    expect(angleAt3D(p, p, { x: 1, y: 0, z: 0 })).toBeNull()
  })
})

describe('extractPostureFrame', () => {
  it('reads a standing pose as near-zero flexion and vertical trunk', () => {
    const sample = extractPostureFrame(frameWith(makeWorldLandmarks()))
    expect(sample).not.toBeNull()
    expect(sample!.hipFlexion).toBeLessThan(15)
    expect(sample!.kneeFlexion).toBeLessThan(5)
    expect(sample!.trunkAngle).toBeLessThan(5)
  })

  it('reads a hinge pose as hip-dominant with a pitched trunk', () => {
    // Trunk pitched ~60° forward (toward −z), knees nearly straight.
    const hinge = makeWorldLandmarks({
      [LANDMARK_INDICES.LEFT_SHOULDER]: { x: -0.15, y: -0.25, z: -0.43 },
      [LANDMARK_INDICES.RIGHT_SHOULDER]: { x: 0.15, y: -0.25, z: -0.43 },
    })
    const sample = extractPostureFrame(frameWith(hinge))
    expect(sample).not.toBeNull()
    expect(sample!.trunkAngle).toBeGreaterThan(50)
    expect(sample!.hipFlexion).toBeGreaterThan(sample!.kneeFlexion + 20)
  })

  it('reads a deep squat as knee-dominant relative to a hinge', () => {
    const squat = makeWorldLandmarks({
      [LANDMARK_INDICES.LEFT_SHOULDER]: { x: -0.15, y: -0.43, z: -0.25 },
      [LANDMARK_INDICES.RIGHT_SHOULDER]: { x: 0.15, y: -0.43, z: -0.25 },
      [LANDMARK_INDICES.LEFT_KNEE]: { x: -0.1, y: 0.15, z: -0.35 },
      [LANDMARK_INDICES.RIGHT_KNEE]: { x: 0.1, y: 0.15, z: -0.35 },
      [LANDMARK_INDICES.LEFT_ANKLE]: { x: -0.1, y: 0.55, z: -0.1 },
      [LANDMARK_INDICES.RIGHT_ANKLE]: { x: 0.1, y: 0.55, z: -0.1 },
    })
    const sample = extractPostureFrame(frameWith(squat))
    expect(sample).not.toBeNull()
    expect(sample!.kneeFlexion).toBeGreaterThan(60)
  })

  it('returns null when the 3D stream is missing or below confidence', () => {
    expect(extractPostureFrame(frameWith([]))).toBeNull()
    expect(
      extractPostureFrame(frameWith(makeWorldLandmarks({}, 0.2))),
    ).toBeNull()
  })
})
