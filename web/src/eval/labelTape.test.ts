import { describe, expect, it } from 'vitest'
import type { PoseFrame } from '../cv/types'
import { createTape, deserializeTape } from './poseTape'
import { applyTruthLabel, labelTapeJson } from './labelTape'

function frames(n: number): PoseFrame[] {
  return Array.from({ length: n }, (_, i) => ({
    frameIndex: i,
    timestamp: i * 66,
    landmarks: [],
    worldLandmarks: [],
    poseConfidence: 0.9,
  }))
}

const BASE = { labeledBy: 'tester', method: 'unit-test' }

describe('applyTruthLabel (M15)', () => {
  it('writes truth with provenance and leaves frames + other meta untouched', () => {
    const tape = createTape(frames(100), { fps: 15, label: 'x', source: 'upload' })
    const labeled = applyTruthLabel(tape, {
      ...BASE,
      repCount: 4,
      bottomFrameIndices: [10, 30, 55, 80],
      notes: 'clip starts at bottom',
    })
    expect(labeled.meta.truth?.repCount).toBe(4)
    expect(labeled.meta.truth?.bottomFrameIndices).toEqual([10, 30, 55, 80])
    expect(labeled.meta.truth?.labeledBy).toBe('tester')
    expect(labeled.meta.truth?.labeledAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(labeled.meta.truth?.notes).toBe('clip starts at bottom')
    expect(labeled.frames).toBe(tape.frames)
    expect(labeled.meta.label).toBe('x')
    // Original tape not mutated (immutability).
    expect(tape.meta.truth).toBeUndefined()
  })

  it('rejects bottoms outside the tape and count mismatches', () => {
    const tape = createTape(frames(50), { fps: 15 })
    expect(() =>
      applyTruthLabel(tape, { ...BASE, repCount: 1, bottomFrameIndices: [99] }),
    ).toThrow(/outside tape/)
    expect(() =>
      applyTruthLabel(tape, { ...BASE, repCount: 2, bottomFrameIndices: [10] }),
    ).toThrow(/must match repCount/)
    expect(() => applyTruthLabel(tape, { ...BASE })).toThrow(/repCount and\/or/)
  })

  it('round-trips through JSON for the CLI', () => {
    const tape = createTape(frames(20), { fps: 15 })
    const out = labelTapeJson(JSON.stringify(tape), { ...BASE, repCount: 2 })
    expect(deserializeTape(out).meta.truth?.repCount).toBe(2)
  })
})
