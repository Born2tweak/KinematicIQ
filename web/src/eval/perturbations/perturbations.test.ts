import { describe, expect, it } from 'vitest'
import { buildSyntheticInlineLungeFrames } from '../../protocols/inlineLunge/fixtures'
import { applyPerturbations, validateTimestamps, type Perturbation } from '.'

const operations: Perturbation[] = [
  { kind: 'dropout', startFrame: 2, endFrame: 8, every: 2, landmarkIndices: [25] },
  { kind: 'visibility', startFrame: 3, endFrame: 4, visibility: 0.2, landmarkIndices: [26] },
  { kind: 'coordinateJitter', startFrame: 1, endFrame: 5, amplitude: 0.01, landmarkIndices: [25, 26] },
  { kind: 'timestampJitter', amplitudeMs: 2 },
  { kind: 'duplicateFrames', frameIndices: [4] },
  { kind: 'removeFrames', frameIndices: [1] },
  { kind: 'occlusionMask', startFrame: 0, endFrame: 2, xMin: 0.4, xMax: 0.6, yMin: 0.4, yMax: 0.7 },
]

describe('perturbation library', () => {
  it('is deterministic, immutable, checksummed, composable, and monotonic', async () => {
    const input = buildSyntheticInlineLungeFrames()
    const before = JSON.stringify(input)
    const left = await applyPerturbations(input, operations, { seed: 42 })
    const right = await applyPerturbations(input, operations, { seed: 42 })
    expect(left).toEqual(right)
    expect(left.manifest.sourceSha256).toHaveLength(64)
    expect(left.manifest.outputSha256).not.toBe(left.manifest.sourceSha256)
    expect(JSON.stringify(input)).toBe(before)
    expect(() => validateTimestamps(left.frames)).not.toThrow()
    expect(left.frames[1].landmarks[25].visibility).toBe(0)
  })

  it('changes stochastic operations with the seed and preserves identity values', async () => {
    const input = buildSyntheticInlineLungeFrames({ leadSide: 'right' })
    const jitter: Perturbation[] = [{ kind: 'coordinateJitter', startFrame: 0, endFrame: 3, amplitude: 0.01 }]
    expect((await applyPerturbations(input, jitter, { seed: 1 })).frames).not.toEqual((await applyPerturbations(input, jitter, { seed: 2 })).frames)
    const identity = await applyPerturbations(input, [{ kind: 'identity' }], { seed: 1 })
    expect(identity.frames).toEqual(input)
  })

  it('resamples FPS and rejects malformed or unintended nonmonotonic inputs', async () => {
    const input = buildSyntheticInlineLungeFrames()
    const result = await applyPerturbations(input, [{ kind: 'fpsResample', targetFps: 15 }], { seed: 1 })
    expect(result.frames.length).toBeLessThan(input.length)
    await expect(applyPerturbations(input, [{ kind: 'visibility', startFrame: 4, endFrame: 2, visibility: 0.5 }], { seed: 1 })).rejects.toThrow('ordered')
    const bad = input.slice(0, 2).map(frame => ({ ...frame }))
    bad[1].timestamp = bad[0].timestamp
    expect(() => validateTimestamps(bad)).toThrow('Nonmonotonic')
  })
})
