import { describe, expect, it } from 'vitest'
import { deriveCaptureGuidance } from './captureGuidance'
import { LANDMARK_INDICES, type NormalizedLandmark, type PoseFrame } from './types'

const HIDDEN: NormalizedLandmark = { x: 0, y: 0, z: 0, visibility: 0 }

function frameWith(
  parts: Partial<Record<keyof typeof LANDMARK_INDICES, { x: number; y: number }>>,
): PoseFrame {
  const landmarks: NormalizedLandmark[] = Array.from({ length: 33 }, () => ({
    ...HIDDEN,
  }))
  for (const [name, pos] of Object.entries(parts)) {
    const index = LANDMARK_INDICES[name as keyof typeof LANDMARK_INDICES]
    landmarks[index] = { x: pos.x, y: pos.y, z: 0, visibility: 1 }
  }
  return { landmarks, worldLandmarks: [], poseConfidence: 1, timestamp: 0, frameIndex: 0 }
}

/** A well-framed standing body: head near top, feet near bottom, centered. */
function wellFramedBody(offsetX = 0): PoseFrame {
  return frameWith({
    NOSE: { x: 0.5 + offsetX, y: 0.12 },
    LEFT_SHOULDER: { x: 0.45 + offsetX, y: 0.25 },
    RIGHT_SHOULDER: { x: 0.55 + offsetX, y: 0.25 },
    LEFT_HIP: { x: 0.46 + offsetX, y: 0.5 },
    RIGHT_HIP: { x: 0.54 + offsetX, y: 0.5 },
    LEFT_KNEE: { x: 0.46 + offsetX, y: 0.7 },
    RIGHT_KNEE: { x: 0.54 + offsetX, y: 0.7 },
    LEFT_ANKLE: { x: 0.46 + offsetX, y: 0.88 },
    RIGHT_ANKLE: { x: 0.54 + offsetX, y: 0.88 },
  })
}

describe('deriveCaptureGuidance', () => {
  it('asks the athlete to step into frame when there is no pose', () => {
    const guidance = deriveCaptureGuidance(null)
    expect(guidance.ok).toBe(false)
    expect(guidance.instruction).toMatch(/step into frame/i)
    expect(guidance.detail).toMatch(/hip height/i)
  })

  it('reports ready for a well-framed full body', () => {
    const guidance = deriveCaptureGuidance(wellFramedBody())
    expect(guidance.ok).toBe(true)
    expect(guidance.instruction).toMatch(/full body detected/i)
  })

  it('says step back when feet are cut off and hips sit low in frame', () => {
    const frame = wellFramedBody()
    frame.landmarks[LANDMARK_INDICES.LEFT_ANKLE] = { ...HIDDEN }
    frame.landmarks[LANDMARK_INDICES.RIGHT_ANKLE] = { ...HIDDEN }
    frame.landmarks[LANDMARK_INDICES.LEFT_HIP] = { x: 0.46, y: 0.85, z: 0, visibility: 1 }
    frame.landmarks[LANDMARK_INDICES.RIGHT_HIP] = { x: 0.54, y: 0.85, z: 0, visibility: 1 }
    const guidance = deriveCaptureGuidance(frame)
    expect(guidance.ok).toBe(false)
    expect(guidance.instruction).toMatch(/step back/i)
  })

  it('says tilt the camera down when feet are cut off but hips are high', () => {
    const frame = wellFramedBody()
    frame.landmarks[LANDMARK_INDICES.LEFT_ANKLE] = { ...HIDDEN }
    frame.landmarks[LANDMARK_INDICES.RIGHT_ANKLE] = { ...HIDDEN }
    const guidance = deriveCaptureGuidance(frame)
    expect(guidance.ok).toBe(false)
    expect(guidance.instruction).toMatch(/tilt the camera down/i)
  })

  it('says tilt the camera up when the head is cut off but shoulders are not at the top edge', () => {
    const frame = wellFramedBody()
    frame.landmarks[LANDMARK_INDICES.NOSE] = { ...HIDDEN }
    const guidance = deriveCaptureGuidance(frame)
    expect(guidance.ok).toBe(false)
    expect(guidance.instruction).toMatch(/tilt the camera up/i)
  })

  it('asks for centering when the body is far off to one side', () => {
    const guidance = deriveCaptureGuidance(wellFramedBody(0.25))
    expect(guidance.ok).toBe(false)
    expect(guidance.instruction).toMatch(/center of the frame/i)
  })

  it('asks the athlete to step closer when the body is tiny in frame', () => {
    const frame = frameWith({
      NOSE: { x: 0.5, y: 0.4 },
      LEFT_SHOULDER: { x: 0.48, y: 0.44 },
      RIGHT_SHOULDER: { x: 0.52, y: 0.44 },
      LEFT_HIP: { x: 0.48, y: 0.52 },
      RIGHT_HIP: { x: 0.52, y: 0.52 },
      LEFT_KNEE: { x: 0.48, y: 0.58 },
      RIGHT_KNEE: { x: 0.52, y: 0.58 },
      LEFT_ANKLE: { x: 0.48, y: 0.64 },
      RIGHT_ANKLE: { x: 0.52, y: 0.64 },
    })
    const guidance = deriveCaptureGuidance(frame)
    expect(guidance.ok).toBe(false)
    expect(guidance.instruction).toMatch(/step closer/i)
  })
})
