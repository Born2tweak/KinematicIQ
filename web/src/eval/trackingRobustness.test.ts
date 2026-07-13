import { describe, expect, it } from 'vitest'
import { buildCleanSquatPoseTape } from '../camera/fixtures/cleanSquatPoseTape'
import { buildTrackingRobustnessBaseline } from './trackingRobustness'

describe('tracking robustness baseline', () => {
  it('is deterministic and records immutable input/version metadata', () => {
    const input = { file: 'clean.posetape.json', sha256: 'abc123', tape: buildCleanSquatPoseTape() }
    const first = buildTrackingRobustnessBaseline([input])
    const second = buildTrackingRobustnessBaseline([input])
    expect(first).toEqual(second)
    expect(first.schemaVersion).toBe(1)
    expect(first.tapes[0].sha256).toBe('abc123')
    expect(first.tapes[0].input.frames).toBeGreaterThan(0)
  })

  it('reports raw/filter parity and corpus limitations explicitly', () => {
    const baseline = buildTrackingRobustnessBaseline([
      { file: 'clean.posetape.json', sha256: 'abc123', tape: buildCleanSquatPoseTape() },
    ])
    expect(baseline.aggregate.repParityTapes).toBe(1)
    expect(baseline.aggregate.repMismatchTapes).toEqual([])
    expect(baseline.corpus.limitations.join(' ')).toContain('OCHuman')
    expect(baseline.corpus.limitations.join(' ')).toContain('not population or clinical validation')
  })

  it('rejects an empty corpus instead of emitting a misleading baseline', () => {
    expect(() => buildTrackingRobustnessBaseline([])).toThrow(/at least one tape/)
  })
})
