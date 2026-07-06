import { describe, expect, it } from 'vitest'
import {
  assessLandmarkQuality,
  assessSequenceQuality,
  summarizeLandmarkQuality,
} from './landmarkQuality'
import {
  createLandmark,
  createPoseFrame,
  createSquatLandmarks,
} from '../test/fixtures/poseFixtures'
import { CRITICAL_LANDMARKS, LANDMARK_INDICES, type PoseFrame } from './types'

/** Frame with every one of the 33 landmarks confidently visible. */
function allVisibleFrame(opts: { frameIndex?: number; timestamp?: number } = {}): PoseFrame {
  return createPoseFrame({
    ...opts,
    landmarks: Array.from({ length: 33 }, () => createLandmark(0.5, 0.5, 0.9)),
  })
}

describe('cv/landmarkQuality', () => {
  it('reports full coverage for an all-visible frame', () => {
    const q = assessLandmarkQuality(allVisibleFrame())
    expect(q.visibilityCoverage).toBe(1)
    expect(q.criticalCoverage).toBe(1)
    expect(q.missingCritical).toHaveLength(0)
    // First frame has no predecessor to compare against.
    expect(q.maxCriticalSpeed).toBeNull()
    expect(q.implausibleJump).toBe(false)
  })

  it('names missing knees in observation language', () => {
    const landmarks = createSquatLandmarks().map((lm, i) =>
      i === LANDMARK_INDICES.LEFT_KNEE || i === LANDMARK_INDICES.RIGHT_KNEE
        ? createLandmark(0, 0, 0)
        : lm,
    )
    const q = assessLandmarkQuality(createPoseFrame({ landmarks }))
    expect(q.criticalCoverage).toBeCloseTo(6 / 8)
    expect(q.missingCritical).toContain('left knee')
    expect(q.missingCritical).toContain('right knee')
  })

  it('names clipped feet through missing ankles', () => {
    const landmarks = createSquatLandmarks().map((lm, i) =>
      i === LANDMARK_INDICES.LEFT_ANKLE || i === LANDMARK_INDICES.RIGHT_ANKLE
        ? createLandmark(0, 0, 0)
        : lm,
    )
    const q = assessLandmarkQuality(createPoseFrame({ landmarks }))
    expect(q.missingCritical).toEqual(['left ankle', 'right ankle'])
  })

  it('reports zero coverage when every landmark is low-visibility', () => {
    const landmarks = Array.from({ length: 33 }, () =>
      createLandmark(0.5, 0.5, 0.3),
    )
    const q = assessLandmarkQuality(createPoseFrame({ landmarks }))
    expect(q.visibilityCoverage).toBe(0)
    expect(q.criticalCoverage).toBe(0)
    expect(q.missingCritical).toHaveLength(CRITICAL_LANDMARKS.length)
  })

  it('flags an implausible jump but not plausible motion', () => {
    const prev = allVisibleFrame({ frameIndex: 0, timestamp: 0 })
    // Teleport: every landmark moves 0.5 units in 100 ms → 5 units/s.
    const teleported = createPoseFrame({
      frameIndex: 1,
      timestamp: 100,
      landmarks: prev.landmarks.map((lm) =>
        createLandmark(lm.x + 0.5, lm.y, lm.visibility),
      ),
    })
    const jumped = assessLandmarkQuality(teleported, prev)
    expect(jumped.maxCriticalSpeed).toBeCloseTo(5)
    expect(jumped.implausibleJump).toBe(true)

    // Plausible: 0.02 units in 100 ms → 0.2 units/s.
    const moved = createPoseFrame({
      frameIndex: 1,
      timestamp: 100,
      landmarks: prev.landmarks.map((lm) =>
        createLandmark(lm.x + 0.02, lm.y, lm.visibility),
      ),
    })
    const smooth = assessLandmarkQuality(moved, prev)
    expect(smooth.implausibleJump).toBe(false)
  })

  it('never judges motion across a long gap', () => {
    const prev = allVisibleFrame({ frameIndex: 0, timestamp: 0 })
    const afterGap = createPoseFrame({
      frameIndex: 1,
      timestamp: 1000, // 1 s gap — not comparable
      landmarks: prev.landmarks.map((lm) =>
        createLandmark(lm.x + 0.5, lm.y, lm.visibility),
      ),
    })
    const q = assessLandmarkQuality(afterGap, prev)
    expect(q.maxCriticalSpeed).toBeNull()
    expect(q.implausibleJump).toBe(false)
  })

  it('ignores landmarks not visible in both frames when measuring speed', () => {
    const prev = allVisibleFrame({ frameIndex: 0, timestamp: 0 })
    // Only the left hip "teleports", but it is invisible in the new frame —
    // garbage coordinates are not motion evidence.
    const next = createPoseFrame({
      frameIndex: 1,
      timestamp: 100,
      landmarks: prev.landmarks.map((lm, i) =>
        i === LANDMARK_INDICES.LEFT_HIP
          ? createLandmark(lm.x + 0.8, lm.y, 0)
          : lm,
      ),
    })
    const q = assessLandmarkQuality(next, prev)
    expect(q.implausibleJump).toBe(false)
  })

  it('does not mutate the input frames', () => {
    const prev = allVisibleFrame({ frameIndex: 0, timestamp: 0 })
    const frame = allVisibleFrame({ frameIndex: 1, timestamp: 66 })
    const prevSnapshot = JSON.stringify(prev)
    const frameSnapshot = JSON.stringify(frame)
    assessLandmarkQuality(frame, prev)
    expect(JSON.stringify(prev)).toBe(prevSnapshot)
    expect(JSON.stringify(frame)).toBe(frameSnapshot)
    expect(frame.quality).toBeUndefined()
  })

  it('assesses a sequence frame-by-frame against predecessors', () => {
    const frames = [0, 66, 133].map((timestamp, i) =>
      allVisibleFrame({ frameIndex: i, timestamp }),
    )
    const stream = assessSequenceQuality(frames)
    expect(stream).toHaveLength(3)
    expect(stream[0].maxCriticalSpeed).toBeNull()
    expect(stream[1].maxCriticalSpeed).not.toBeNull()
  })

  describe('summarizeLandmarkQuality', () => {
    it('abstains cleanly on an empty stream', () => {
      const s = summarizeLandmarkQuality([])
      expect(s.frameCount).toBe(0)
      expect(s.meanVisibilityCoverage).toBeNull()
      expect(s.meanCriticalCoverage).toBeNull()
      expect(s.framesMissingCritical).toBe(0)
      expect(s.implausibleJumpFrames).toBe(0)
      expect(s.mostMissedLandmarks).toEqual([])
    })

    it('aggregates coverage, missing frames, jumps, and most-missed landmarks', () => {
      const clean = assessLandmarkQuality(allVisibleFrame())
      const missingKnees = assessLandmarkQuality(
        createPoseFrame({
          landmarks: createSquatLandmarks().map((lm, i) =>
            i === LANDMARK_INDICES.LEFT_KNEE || i === LANDMARK_INDICES.RIGHT_KNEE
              ? createLandmark(0, 0, 0)
              : lm,
          ),
        }),
      )
      const s = summarizeLandmarkQuality([clean, missingKnees, missingKnees])
      expect(s.frameCount).toBe(3)
      expect(s.framesMissingCritical).toBe(2)
      expect(s.meanCriticalCoverage).toBeCloseTo((1 + 0.75 + 0.75) / 3)
      expect(s.mostMissedLandmarks).toContain('left knee')
      expect(s.mostMissedLandmarks.length).toBeLessThanOrEqual(3)
      expect(s.implausibleJumpFrames).toBe(0)
    })
  })
})
