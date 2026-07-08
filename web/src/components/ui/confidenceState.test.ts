import { describe, expect, it } from 'vitest'
import type { ConfidenceLevel } from '../../core/confidence'
import { confidenceBadgeClass, confidenceLabel } from './confidenceState'

const LEVELS: ConfidenceLevel[] = ['High', 'Medium', 'Low']

describe('confidenceState primitive (M56)', () => {
  it('maps each level to its base + modifier class', () => {
    expect(confidenceBadgeClass('High')).toBe('confidence-badge confidence-badge--high')
    expect(confidenceBadgeClass('Medium')).toBe('confidence-badge confidence-badge--medium')
    expect(confidenceBadgeClass('Low')).toBe('confidence-badge confidence-badge--low')
  })

  it('always includes the shared base class for every level', () => {
    for (const level of LEVELS) {
      expect(confidenceBadgeClass(level)).toContain('confidence-badge ')
    }
  })

  it('labels carry the word "confidence" so color is never the sole signal', () => {
    for (const level of LEVELS) {
      expect(confidenceLabel(level)).toBe(`${level} confidence`)
    }
  })
})
