import { describe, expect, it } from 'vitest'
import { buildSyntheticInlineLungeFrames } from '../protocols/inlineLunge/fixtures'
import { buildLungeTemporalBaseline } from './lungeTemporalDiagnostics'

const input = (frames = buildSyntheticInlineLungeFrames()) => ({ sequenceId: 'left-clean', sourceSha256: 'a'.repeat(64), transformationId: 'identity', perturbationVersion: 'pose-perturbation-v1', leadSide: 'left' as const, frames })

describe('forward-lunge temporal diagnostics', () => {
  it('is deterministic and reports denominators, filters, kinematics, sensitivity, and worst cases', () => {
    const first = buildLungeTemporalBaseline([input()])
    expect(first).toEqual(buildLungeTemporalBaseline([input()]))
    expect(first.denominators).toEqual({ sequences: 1, frames: 37, landmarks: 33 })
    expect(first.rows[0].raw.completedTrials).toBe(1)
    expect(first.rows[0].oneEuro.filter).toBe('one-euro-live')
    expect(first.rows[0].landmarks[25].maxVelocity).not.toBeNull()
    expect(first.aggregate.worstCases).toHaveLength(1)
  })

  it('keeps missingness and irregular timestamp failures visible', () => {
    const frames = buildSyntheticInlineLungeFrames()
    frames[20].landmarks[25].visibility = 0
    frames[3].timestamp = frames[2].timestamp
    const report = buildLungeTemporalBaseline([input(frames)])
    expect(report.rows[0].timestamp.nonPositiveIntervals).toBe(1)
    expect(report.rows[0].landmarks[25].missingFrames).toBe(1)
  })

  it('rejects empty baselines', () => expect(() => buildLungeTemporalBaseline([])).toThrow('at least one'))
})
