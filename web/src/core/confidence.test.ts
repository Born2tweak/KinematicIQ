import { describe, expect, it } from 'vitest'
import {
  clampConfidence,
  combineConfidence,
  confidenceLevel,
  makeConfidence,
  type Confidence,
} from './confidence'

describe('core/confidence', () => {
  it('clamps out-of-range and NaN values into [0,1]', () => {
    expect(clampConfidence(-0.5)).toBe(0)
    expect(clampConfidence(1.5)).toBe(1)
    expect(clampConfidence(0.42)).toBe(0.42)
    expect(clampConfidence(Number.NaN)).toBe(0)
  })

  it('maps values to the three-level chip at documented thresholds', () => {
    expect(confidenceLevel(0.9)).toBe('High')
    expect(confidenceLevel(0.75)).toBe('High')
    expect(confidenceLevel(0.6)).toBe('Medium')
    expect(confidenceLevel(0.5)).toBe('Medium')
    expect(confidenceLevel(0.49)).toBe('Low')
    expect(confidenceLevel(0)).toBe('Low')
  })

  it('makeConfidence derives the chip and preserves basis + uncertainty', () => {
    const c = makeConfidence(0.8, ['landmark-visibility'], 0.05)
    expect(c.value).toBe(0.8)
    expect(c.level).toBe('High')
    expect(c.basis).toEqual(['landmark-visibility'])
    expect(c.uncertainty).toBe(0.05)
  })

  it('makeConfidence omits uncertainty when not provided', () => {
    const c = makeConfidence(0.3)
    expect('uncertainty' in c).toBe(false)
    expect(c.level).toBe('Low')
  })

  it('combines contributors multiplicatively and unions bases', () => {
    const parts: Confidence[] = [
      makeConfidence(0.8, ['landmark-visibility']),
      makeConfidence(0.5, ['protocol-compliance', 'landmark-visibility']),
    ]
    const combined = combineConfidence(parts)
    expect(combined.value).toBeCloseTo(0.4, 10)
    expect(combined.level).toBe('Low')
    expect(new Set(combined.basis)).toEqual(
      new Set(['landmark-visibility', 'protocol-compliance']),
    )
  })

  it('treats empty combination as zero confidence, never 1', () => {
    expect(combineConfidence([]).value).toBe(0)
  })
})
