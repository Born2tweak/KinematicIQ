import { describe, expect, it } from 'vitest'
import { makeConfidence } from '../../core/confidence'
import type { Finding } from '../../core/finding'
import { buildFindingCardModel } from './findingCardModel'

const finding: Finding = {
  id: 'squat.depth',
  question: 'movement-completion',
  statement: 'Depth appears limited in this set.',
  evidence: [{ metricId: 'squat.depth.min-knee-angle', observed: 'Min knee angle: 120°' }],
  confidence: makeConfidence(0.8),
  priority: 'primary',
  tryNext: 'Try a box target.',
  provenance: {
    ruleId: 'rule.squat.depth',
    sourceDocs: ['docs/research/04_Coaching_Intelligence_Engine_Spec.md'],
    reviewStatus: 'internally-tested',
    lastReviewed: '2026-07-07',
  },
}

describe('findingCardModel provenance (M50)', () => {
  it('omits the provenance line by default — Summary stays uncluttered', () => {
    expect(buildFindingCardModel(finding).provenance).toBeNull()
  })

  it('renders review status + rule id when the caller opts in (Evidence/Expert)', () => {
    const model = buildFindingCardModel(finding, { showProvenance: true })
    expect(model.provenance).toBe('internally tested rule · rule.squat.depth')
  })

  it('stays null when the finding has no provenance', () => {
    const bare: Finding = { ...finding, provenance: undefined }
    expect(buildFindingCardModel(bare, { showProvenance: true }).provenance).toBeNull()
  })
})
