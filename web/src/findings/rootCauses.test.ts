import { describe, expect, it } from 'vitest'
import type { Finding } from '../core/finding'
import type { MetricResult } from '../core/metric'
import type { SetMetricsSummary } from '../session/types'
import { makeConfidence } from '../core/confidence'
import { makeProvenance } from '../core/provenance'
import { ROOT_CAUSE_FRAMING, deriveRootCauses } from './rootCauses'

const metrics = {
  repCount: 5,
  reps: [],
  excludedRepNumbers: [],
  avgDepth: 120,
  avgTrunkLean: 40,
  depthCV: 12,
  minDepth: 108,
  maxDepth: 132,
  avgHipShift: 0.05,
  avgKneeAsymmetry: 4,
  avgShoulderAsymmetry: 0.01,
  overallConfidence: 82,
} satisfies SetMetricsSummary

function finding(id: string): Finding {
  return {
    id,
    question: 'movement-completion',
    statement: 'x',
    evidence: [],
    confidence: makeConfidence(0.8),
    priority: 'primary',
    tryNext: 'y',
  }
}

function metric(metricId: string, value: number | null): MetricResult {
  return {
    metricId,
    label: metricId,
    value,
    unit: 'deg',
    side: 'none',
    confidence: makeConfidence(0.8),
    provenance: makeProvenance({ captureSource: 'replay' }),
    validationTier: 'experimental',
  }
}

describe('root-cause concept cards (M22)', () => {
  it('returns nothing without findings (abstaining sets get no cards)', () => {
    expect(deriveRootCauses([], metrics, [])).toEqual([])
  })

  it('suggests ankle mobility when depth is flagged and the ankle read is shallow', () => {
    const cards = deriveRootCauses(
      [finding('squat.depth')],
      metrics,
      [metric('squat.rom.ankle-dorsiflexion', 130)],
    )
    expect(cards.map((c) => c.id)).toContain('root.ankle-mobility')
  })

  it('stays silent about ankles when the ankle read is deep or missing', () => {
    expect(
      deriveRootCauses([finding('squat.depth')], metrics, [
        metric('squat.rom.ankle-dorsiflexion', 95),
      ]).map((c) => c.id),
    ).not.toContain('root.ankle-mobility')
    expect(
      deriveRootCauses([finding('squat.depth')], metrics, []).map((c) => c.id),
    ).not.toContain('root.ankle-mobility')
  })

  it('links balance card to whichever laterality findings fired', () => {
    const cards = deriveRootCauses(
      [finding('squat.symmetry'), finding('squat.kneeTracking')],
      metrics,
      [],
    )
    const balance = cards.find((c) => c.id === 'root.balance-coordination')
    expect(balance?.linkedFindingIds).toEqual(['squat.symmetry', 'squat.kneeTracking'])
  })

  it('suggests fatigue only when tempo AND depth/consistency both fired', () => {
    expect(
      deriveRootCauses([finding('squat.tempo')], metrics, []).map((c) => c.id),
    ).not.toContain('root.fatigue')
    expect(
      deriveRootCauses(
        [finding('squat.tempo'), finding('squat.consistency')],
        metrics,
        [],
      ).map((c) => c.id),
    ).toContain('root.fatigue')
  })

  it('never uses diagnosis, injury, or medical language (claims policy)', () => {
    const cards = deriveRootCauses(
      [
        finding('squat.depth'),
        finding('squat.trunkControl'),
        finding('squat.symmetry'),
        finding('squat.tempo'),
        finding('squat.consistency'),
      ],
      metrics,
      [
        metric('squat.rom.ankle-dorsiflexion', 130),
        metric('squat.rom.hip-flexion', 110),
      ],
    )
    expect(cards.length).toBeGreaterThanOrEqual(4)
    // The framing line legitimately contains "not a diagnosis"; the
    // substantive copy must not use the vocabulary at all.
    const text = cards
      .map((c) => `${c.title} ${c.plausibleBecause} ${c.selfCheck}`)
      .join(' ')
      .toLowerCase()
    for (const forbidden of ['diagnos', 'injur', 'patholog', 'medical', 'dysfunction', 'risk']) {
      expect(text, `must not contain "${forbidden}"`).not.toContain(forbidden)
    }
    for (const card of cards) {
      expect(card.framing).toBe(ROOT_CAUSE_FRAMING)
    }
  })
})
