import { describe, expect, it } from 'vitest'
import { buildUiPrmdPilotBaseline, parseUiPrmdTrials } from './uiPrmdReduced'

describe('UI-PRMD reduced adapter', () => {
  const matrix = ['0,1,0', '1,2,1', '2,3,2', '3,4,3'].join('\n')
  const labels = '0.9\n0.8\n'

  it('reconstructs trials from dimension-major rows', () => {
    const trials = parseUiPrmdTrials(matrix, labels, 'demonstrated', 2, 3)
    expect(trials).toHaveLength(2)
    expect(trials[1].signals).toEqual([[2, 3, 2], [3, 4, 3]])
    expect(trials[1].sourceQualityLabel).toBe(0.8)
  })

  it('rejects mismatched labels and dimensions', () => {
    expect(() => parseUiPrmdTrials(matrix, '0.9\n', 'demonstrated', 2, 3)).toThrow(/labels/)
    expect(() => parseUiPrmdTrials(matrix, labels, 'demonstrated', 3, 3)).toThrow(/divisible/)
  })

  it('builds a deterministic dataset-scoped baseline without a composite score', () => {
    const demonstrated = parseUiPrmdTrials(matrix, labels, 'demonstrated', 2, 3)
    const nonOptimal = parseUiPrmdTrials('1,2,1\n2,3,2\n3,4,3\n4,5,4', '0.7\n0.6\n', 'non-optimal', 2, 3)
    const baseline = buildUiPrmdPilotBaseline({
      demonstrated,
      nonOptimal,
      version: 'fixture',
      sourceCommit: 'abc',
      acquiredArtifacts: { 'data.csv': 'deadbeef' },
    })
    expect(baseline.cohort).toMatchObject({ trialsPerClass: 2, dimensions: 2, normalizedSamples: 3 })
    expect(baseline.waveform.pairedSampleCount).toBe(12)
    expect(baseline).not.toHaveProperty('score')
  })
})

