import { describe, expect, it } from 'vitest'
import { binaryClassification, confusionMatrix, exactCountAccuracy, icc21, pairedAgreement } from './statistics'

describe('validation statistics', () => {
  it('matches hand-calculated paired and classification fixtures', () => {
    const agreement = pairedAgreement([1, 2, 3], [2, 2, 4])!
    expect(agreement.mae).toBeCloseTo(2 / 3)
    expect(agreement.rmse).toBeCloseTo(Math.sqrt(2 / 3))
    expect(agreement.bias).toBeCloseTo(2 / 3)
    expect(agreement.correlation).toBeCloseTo(0.8660254)
    expect(binaryClassification([true, true, false, false], [true, false, true, false])).toEqual({ tp: 1, fp: 1, tn: 1, fn: 1, precision: 0.5, recall: 0.5, f1: 0.5 })
    expect(confusionMatrix(['a', 'b'], ['a', 'a', 'b'], ['a', 'b', 'b'])).toEqual([[1, 1], [0, 1]])
    expect(exactCountAccuracy([1, 2, 3], [1, 4, 3])).toBeCloseTo(2 / 3)
  })

  it('states ICC assumptions and abstains on degenerate inputs', () => {
    expect(icc21([[1, 1.1], [2, 2.1], [3, 3.1]])?.variant).toBe('ICC(2,1)')
    expect(icc21([[1]])).toBeNull()
    expect(pairedAgreement([], [])).toBeNull()
    expect(() => pairedAgreement([1], [1, 2])).toThrow(/equal length/)
  })
})
