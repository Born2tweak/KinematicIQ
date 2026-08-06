import { describe, expect, it } from 'vitest'
import {
  collapseMode,
  expandMode,
  needsSeek,
  showsFullControls,
  showsScene3D,
  videoTimeForFrame,
} from './playerModel'
import type { PoseFrame } from '../../cv/types'

const frames = (timestamps: number[]): PoseFrame[] =>
  timestamps.map(
    (timestamp, frameIndex) =>
      ({
        timestamp,
        frameIndex,
        landmarks: [],
        worldLandmarks: [],
        poseConfidence: 1,
      }) as PoseFrame,
  )

describe('player mode ladder', () => {
  it('expands mini → expanded → split and stops at split', () => {
    expect(expandMode('mini')).toBe('expanded')
    expect(expandMode('expanded')).toBe('split')
    expect(expandMode('split')).toBe('split')
  })

  it('collapses split → expanded → mini and stops at mini', () => {
    expect(collapseMode('split')).toBe('expanded')
    expect(collapseMode('expanded')).toBe('mini')
    expect(collapseMode('mini')).toBe('mini')
  })

  it('mounts the 3D scene only in split view', () => {
    expect(showsScene3D('mini')).toBe(false)
    expect(showsScene3D('expanded')).toBe(false)
    expect(showsScene3D('split')).toBe(true)
  })

  it('hides the full transport in the mini card', () => {
    expect(showsFullControls('mini')).toBe(false)
    expect(showsFullControls('expanded')).toBe(true)
    expect(showsFullControls('split')).toBe(true)
  })
})

describe('videoTimeForFrame', () => {
  it('measures from the first analyzed frame, not from zero', () => {
    // Live captures start at an arbitrary performance.now() value.
    const f = frames([10_000, 10_033, 10_066])
    expect(videoTimeForFrame(f, 0)).toBeCloseTo(0)
    expect(videoTimeForFrame(f, 2)).toBeCloseTo(0.066)
  })

  it('never returns a negative time', () => {
    const f = frames([500, 100])
    expect(videoTimeForFrame(f, 1)).toBe(0)
  })

  it('returns null when there is no such frame', () => {
    expect(videoTimeForFrame([], 0)).toBeNull()
    expect(videoTimeForFrame(frames([0]), 5)).toBeNull()
  })
})

describe('needsSeek', () => {
  it('tolerates small drift so playback is not fought frame by frame', () => {
    expect(needsSeek(1.0, 1.1)).toBe(false)
  })

  it('corrects once drift exceeds the tolerance', () => {
    expect(needsSeek(1.0, 2.0)).toBe(true)
    expect(needsSeek(5.0, 1.0)).toBe(true)
  })
})
