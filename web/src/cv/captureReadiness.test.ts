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
    expect(a.protocolCompliance).toBe('notReady')
    expect(a.geometryChecks).toHaveLength(5)
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
    // M25: ideal front-view framing passes every geometry check.
    expect(a.protocolCompliance).toBe('ready')
    expect(a.geometryChecks.every((c) => c.status === 'pass')).toBe(true)
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
    // M25: geometry mirrors the clipped feet — margin check fails hard.
    expect(a.geometryChecks.find((c) => c.id === 'feet-visible')?.status).toBe('fail')
    expect(a.protocolCompliance).toBe('notReady')
  })

  describe('M25 geometry checks', () => {
    /** Full-body-visible frame with configurable placement. */
    function frameAt(opts: {
      noseY?: number
      hipY?: number
      ankleY?: number
      shoulderHalfSpread?: number
      hipHalfSpread?: number
    }) {
      const noseY = opts.noseY ?? 0.16
      const hipY = opts.hipY ?? 0.45
      const ankleY = opts.ankleY ?? 0.8
      const sh = opts.shoulderHalfSpread ?? 0.08
      const hh = opts.hipHalfSpread ?? 0.06
      const landmarks = createLandmarks({
        [LANDMARK_INDICES.NOSE]: createLandmark(0.5, noseY, 0.95),
        [LANDMARK_INDICES.LEFT_SHOULDER]: createLandmark(0.5 - sh, noseY + 0.12, 0.92),
        [LANDMARK_INDICES.RIGHT_SHOULDER]: createLandmark(0.5 + sh, noseY + 0.12, 0.92),
        [LANDMARK_INDICES.LEFT_HIP]: createLandmark(0.5 - hh, hipY, 0.92),
        [LANDMARK_INDICES.RIGHT_HIP]: createLandmark(0.5 + hh, hipY, 0.92),
        [LANDMARK_INDICES.LEFT_KNEE]: createLandmark(0.5 - hh, (hipY + ankleY) / 2, 0.92),
        [LANDMARK_INDICES.RIGHT_KNEE]: createLandmark(0.5 + hh, (hipY + ankleY) / 2, 0.92),
        [LANDMARK_INDICES.LEFT_ANKLE]: createLandmark(0.5 - hh, ankleY, 0.92),
        [LANDMARK_INDICES.RIGHT_ANKLE]: createLandmark(0.5 + hh, ankleY, 0.92),
      })
      return createPoseFrame({ landmarks })
    }

    it('flags a likely side view and demotes ready to marginal', () => {
      // Whole body visible and well framed, but shoulders/hips have almost no
      // horizontal spread — the athlete is side-on.
      const frame = frameAt({ shoulderHalfSpread: 0.015, hipHalfSpread: 0.012 })
      const a = assessCaptureReadiness(frame)
      const frontView = a.geometryChecks.find((c) => c.id === 'front-view')
      expect(frontView?.status).toBe('fail')
      expect(a.protocolCompliance).toBe('notReady')
      expect(a.state).toBe('marginal')
      expect(a.reasons.some((r) => r.includes('side-on'))).toBe(true)
      expect(a.fixes.some((f) => f.includes('front view'))).toBe(true)
    })

    it('warns on a slightly angled body without failing', () => {
      // Spread ratio between fail (0.09) and pass (0.14) thresholds.
      const frame = frameAt({ shoulderHalfSpread: 0.038, hipHalfSpread: 0.03 })
      const a = assessCaptureReadiness(frame)
      expect(a.geometryChecks.find((c) => c.id === 'front-view')?.status).toBe('warn')
      expect(a.protocolCompliance).toBe('marginal')
      // Warns are hints — they never block ready on their own.
      expect(a.state).toBe('ready')
    })

    it('flags too-far framing through the body-occupancy band', () => {
      // Nose→ankle 0.3: below both the protocol band and the v1 distance band.
      const frame = frameAt({ noseY: 0.35, hipY: 0.48, ankleY: 0.65 })
      const a = assessCaptureReadiness(frame)
      expect(a.geometryChecks.find((c) => c.id === 'body-occupancy')?.status).toBe('fail')
      expect(a.checklist.find((c) => c.id === 'distance')?.ok).toBe(false)
      expect(a.state).toBe('marginal')
      expect(a.fixes.some((f) => f.includes('Step closer'))).toBe(true)
    })

    it('flags too-close framing and missing floor margin', () => {
      // Nose→ankle 0.95 overflows the frame; ankles hug the bottom edge.
      const frame = frameAt({ noseY: 0.03, hipY: 0.5, ankleY: 0.98 })
      const a = assessCaptureReadiness(frame)
      expect(a.geometryChecks.find((c) => c.id === 'body-occupancy')?.status).toBe('fail')
      expect(a.geometryChecks.find((c) => c.id === 'feet-visible')?.status).toBe('warn')
      expect(a.protocolCompliance).toBe('notReady')
      expect(a.state).toBe('marginal')
      expect(a.fixes.some((f) => f.includes('Step back'))).toBe(true)
    })

    it('hints when the camera is not at hip height, without blocking', () => {
      // Hips placed high in the nose→ankle span → placement ratio below band.
      const frame = frameAt({ noseY: 0.16, hipY: 0.33, ankleY: 0.8 })
      const a = assessCaptureReadiness(frame)
      const cameraHeight = a.geometryChecks.find((c) => c.id === 'camera-height')
      expect(cameraHeight?.status).toBe('warn')
      expect(cameraHeight?.fix).toContain('hip height')
      expect(a.protocolCompliance).toBe('marginal')
      expect(a.state).toBe('ready')
    })

    it('fails symmetry visibility when one side is occluded', () => {
      // Occlude the left knee only — base checklist knees fails too.
      const occluded = createPoseFrame({
        landmarks: frameAt({}).landmarks.map((lm, i) =>
          i === LANDMARK_INDICES.LEFT_KNEE ? createLandmark(0, 0, 0) : lm,
        ),
      })
      const a = assessCaptureReadiness(occluded)
      expect(a.geometryChecks.find((c) => c.id === 'symmetry-visible')?.status).toBe('fail')
      expect(a.protocolCompliance).toBe('notReady')
      expect(a.reasons.some((r) => r.includes('Both sides'))).toBe(true)
    })
  })
})
