import { describe, expect, it } from 'vitest'
import {
  HEURISTIC_CHANGE_THRESHOLDS,
  MIN_TREND_SESSIONS,
  changeThreshold,
  classifyMetricChange,
} from './changeDetection'

const DEPTH = 'squat.depth.min-knee-angle'
const okContext = { sessionCount: 4, currentConfidence: 'High' as const }

describe('session/changeDetection (M32)', () => {
  it('classifies a small depth delta as within noise', () => {
    const a = classifyMetricChange(DEPTH, 3, okContext)
    expect(a.classification).toBe('within-noise')
    expect(a.threshold).toBe(HEURISTIC_CHANGE_THRESHOLDS[DEPTH])
    expect(a.basis).toBe('heuristic')
    expect(a.copy).toContain('measurement noise')
    expect(a.copy).toContain('provisional')
  })

  it('classifies a large delta as possible change with hedged copy', () => {
    const a = classifyMetricChange(DEPTH, -12, okContext)
    expect(a.classification).toBe('possible-change')
    expect(a.copy).toContain('possible change, not a confirmed one')
    // Never certainty or progress language (M32 acceptance).
    expect(a.copy).not.toMatch(/improv|progress|real change|confirmed change/i)
  })

  it('abstains under the minimum session count', () => {
    const a = classifyMetricChange(DEPTH, 20, {
      ...okContext,
      sessionCount: MIN_TREND_SESSIONS - 1,
    })
    expect(a.classification).toBe('insufficient-history')
    expect(a.copy).toContain('Not enough saved sessions')
  })

  it('abstains when current camera confidence is low', () => {
    const a = classifyMetricChange(DEPTH, 20, {
      ...okContext,
      currentConfidence: 'Low',
    })
    expect(a.classification).toBe('insufficient-history')
    expect(a.copy).toContain('confidence')
  })

  it('abstains for metrics with no established threshold', () => {
    const a = classifyMetricChange('squat.unknown.metric', 999, okContext)
    expect(a.classification).toBe('insufficient-history')
    expect(a.threshold).toBeNull()
    expect(a.copy).toContain('No noise threshold')
  })

  it('exposes thresholds for every included squat metric', () => {
    // Every threshold is a positive number in the metric's own unit.
    for (const [id, value] of Object.entries(HEURISTIC_CHANGE_THRESHOLDS)) {
      expect(value, id).toBeGreaterThan(0)
      expect(changeThreshold(id)).toBe(value)
    }
    expect(changeThreshold('nope')).toBeNull()
  })

  it('a delta exactly at the threshold reads as possible change', () => {
    const t = HEURISTIC_CHANGE_THRESHOLDS[DEPTH]
    expect(classifyMetricChange(DEPTH, t, okContext).classification).toBe(
      'possible-change',
    )
    expect(classifyMetricChange(DEPTH, t - 0.01, okContext).classification).toBe(
      'within-noise',
    )
  })
})
