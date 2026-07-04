import { describe, expect, it } from 'vitest'
import { tapeFilename } from './downloadTape'
import {
  createTape,
  deserializeTape,
  estimateFps,
  serializeTape,
} from './poseTape'
import { clearSessionTape, getSessionTape, storeSessionTape } from './tapeStore'
import type { PoseFrame } from '../cv/types'

const tape = (label?: string, recordedAt?: string) =>
  createTape([], { fps: 15, label, source: 'upload', recordedAt })

describe('tapeFilename', () => {
  it('slugifies the label and appends the capture date', () => {
    expect(tapeFilename(tape('Squat Set 3.mp4', '2026-07-04T10:00:00Z'))).toBe(
      'squat-set-3-2026-07-04.posetape.json',
    )
  })

  it('falls back to a generic name when the label is missing or empty', () => {
    expect(tapeFilename(tape(undefined, '2026-07-04T10:00:00Z'))).toBe(
      'session-2026-07-04.posetape.json',
    )
    expect(tapeFilename(tape('...', '2026-07-04T10:00:00Z'))).toBe(
      'session-2026-07-04.posetape.json',
    )
  })
})

describe('tapeStore', () => {
  it('stores, returns, and clears the session tape', () => {
    clearSessionTape()
    expect(getSessionTape()).toBeNull()

    const stored = tape('a.mp4', '2026-07-04T10:00:00Z')
    storeSessionTape(stored)
    expect(getSessionTape()).toBe(stored)

    clearSessionTape()
    expect(getSessionTape()).toBeNull()
  })
})

describe('tape meta round-trip', () => {
  it('preserves recordedAt through serialize/deserialize', () => {
    const original = tape('a.mp4', '2026-07-04T10:00:00Z')
    const roundTripped = deserializeTape(serializeTape(original))
    expect(roundTripped.meta.recordedAt).toBe('2026-07-04T10:00:00Z')
  })

  it('preserves diagnostics through serialize/deserialize', () => {
    const original = createTape(
      [],
      { fps: 15, source: 'live', filtering: 'one-euro-live' },
      {
        countedReps: 3,
        rejections: [
          {
            gate: 'bottom',
            reason: 'Bottom not held long enough',
            startFrameIndex: 10,
            endFrameIndex: 40,
            startTimestamp: 1000,
            endTimestamp: 3000,
            durationMs: 2000,
            values: {
              minLeftKneeAngle: 110,
              minRightKneeAngle: 115,
              maxHipDrop: 0.04,
              bottomHoldMs: 0,
              avgConfidence: 0.7,
              reachedBottom: false,
            },
          },
        ],
      },
    )
    const roundTripped = deserializeTape(serializeTape(original))
    expect(roundTripped.diagnostics?.countedReps).toBe(3)
    expect(roundTripped.diagnostics?.rejections[0].gate).toBe('bottom')
    expect(roundTripped.meta.filtering).toBe('one-euro-live')
  })
})

describe('estimateFps', () => {
  const frameAt = (timestamp: number): PoseFrame => ({
    landmarks: [],
    worldLandmarks: [],
    poseConfidence: 1,
    timestamp,
    frameIndex: 0,
  })

  it('estimates the rate from frame timestamps', () => {
    // 31 frames across 1000ms → 30 fps.
    const frames = Array.from({ length: 31 }, (_, i) => frameAt(i * (1000 / 30)))
    expect(estimateFps(frames)).toBeCloseTo(30, 0)
  })

  it('falls back for degenerate sequences', () => {
    expect(estimateFps([])).toBe(30)
    expect(estimateFps([frameAt(5)])).toBe(30)
    expect(estimateFps([frameAt(5), frameAt(5)])).toBe(30)
  })
})
