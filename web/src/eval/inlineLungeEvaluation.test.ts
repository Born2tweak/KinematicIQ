import { describe, expect, it } from 'vitest'
import { buildSyntheticInlineLungeFrames } from '../protocols/inlineLunge/fixtures'
import { evaluateInlineLungeCases } from './inlineLungeEvaluation'
import { makeProvenance } from '../core/provenance'

const provenance = makeProvenance({ captureSource: 'synthetic', protocolId: 'side-view-inline-lunge-v1' })

describe('inline-lunge offline evaluation', () => {
  it('reports exact counts and declared negative behavior deterministically', () => {
    const report = evaluateInlineLungeCases([
      { sequenceId: 'left-three', leadSide: 'left', provenance, frames: buildSyntheticInlineLungeFrames({ trials: 3 }), expectedCompleteTrials: 3, negative: false },
      { sequenceId: 'dropout-negative', leadSide: 'right', provenance, frames: buildSyntheticInlineLungeFrames({ leadSide: 'right', unreadableActiveFrames: 4 }), expectedCompleteTrials: 0, negative: true },
    ])
    expect(report.summary).toEqual({ sequenceCount: 2, exactCountRate: 1, countMae: 0, falseActivationRate: 0, dropoutRate: 0 })
    expect(report.rows[1].rejectionReasons).toContain('critical-landmarks-unreadable')
  })

  it('rejects an empty evaluation manifest', () => {
    expect(() => evaluateInlineLungeCases([])).toThrow(/at least one/)
  })
})
