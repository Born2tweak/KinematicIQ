import { describe, expect, it } from 'vitest'
import { getJointAngles } from './angles'
import {
  deepSquatLegLandmarks,
  makeFrame,
  standingLegLandmarks,
} from '../test/squatFixtures'

describe('getJointAngles', () => {
  it('returns high knee angles for upright standing pose', () => {
    const frame = makeFrame(0, 0)
    frame.landmarks = standingLegLandmarks()
    const angles = getJointAngles(frame)
    expect(angles.leftKnee).not.toBeNull()
    expect(angles.rightKnee).not.toBeNull()
    expect(angles.leftKnee!).toBeGreaterThan(150)
    expect(angles.rightKnee!).toBeGreaterThan(150)
  })

  it('returns lower knee angles for deep squat pose', () => {
    const frame = makeFrame(0, 0)
    frame.landmarks = deepSquatLegLandmarks()
    const angles = getJointAngles(frame)
    expect(angles.leftKnee).not.toBeNull()
    expect(angles.rightKnee).not.toBeNull()
    const standingFrame = makeFrame(1, 0)
    standingFrame.landmarks = standingLegLandmarks()
    const standing = getJointAngles(standingFrame)
    expect(angles.leftKnee!).toBeLessThan(standing.leftKnee!)
    expect(angles.leftKnee!).toBeLessThan(120)
  })

  it('includes trunk lean from shoulder–hip geometry', () => {
    const frame = makeFrame(0, 0)
    frame.landmarks = standingLegLandmarks()
    const angles = getJointAngles(frame)
    expect(angles.trunkLean).not.toBeNull()
    expect(angles.trunkAngle).toBe(angles.trunkLean)
  })
})
