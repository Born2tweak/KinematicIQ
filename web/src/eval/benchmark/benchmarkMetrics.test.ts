import { describe, expect, it } from 'vitest'
import {
  boneLengthCv,
  crossViewVariance,
  dropoutRuns,
  eventLagMs,
  jitterRms,
  waveformError,
} from './benchmarkMetrics'

describe('benchmark metric primitives', () => {
  it('computes known waveform error without hiding bias', () => {
    expect(waveformError([2, 4, 6], [1, 4, 8])).toEqual({
      sampleCount: 3,
      mae: 1,
      rmse: Math.sqrt(5 / 3),
      bias: -1 / 3,
    })
  })

  it('rejects unmatched waveform alignment', () => {
    expect(() => waveformError([1], [1, 2])).toThrow(/equal length/)
  })

  it('computes RMS first-difference jitter', () => {
    expect(jitterRms([0, 1, 0])).toBe(1)
    expect(jitterRms([4])).toBe(0)
  })

  it('reports dropout runs and recovery explicitly', () => {
    expect(dropoutRuns([true, false, false, true, false])).toEqual([
      { startIndex: 1, endIndex: 2, length: 2, recoveredAtIndex: 3 },
      { startIndex: 4, endIndex: 4, length: 1, recoveredAtIndex: null },
    ])
  })

  it('computes bone-length coefficient of variation and abstains on invalid data', () => {
    expect(boneLengthCv([10, 10, 10])).toBe(0)
    expect(boneLengthCv([10])).toBeNull()
    expect(boneLengthCv([10, 0])).toBeNull()
  })

  it('preserves signed event lag', () => {
    expect(eventLagMs(1040, 1000)).toBe(40)
    expect(eventLagMs(950, 1000)).toBe(-50)
  })

  it('computes cross-view sample variance without inventing a single-view result', () => {
    expect(crossViewVariance([10, 12])).toBe(2)
    expect(crossViewVariance([10])).toBeNull()
  })
})

