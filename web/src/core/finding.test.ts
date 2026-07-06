import { describe, expect, it } from 'vitest'
import { sortFindings, type Finding } from './finding'
import { makeConfidence } from './confidence'

function finding(
  id: string,
  priority: Finding['priority'],
  confidence: number,
): Finding {
  return {
    id,
    statement: `${id} appears to show a self-referenced observation in this set.`,
    evidence: [{ metricId: `${id}.metric`, observed: 'observed value' }],
    confidence: makeConfidence(confidence),
    priority,
  }
}

describe('core/finding', () => {
  it('orders primary before secondary before informational', () => {
    const sorted = sortFindings([
      finding('c', 'informational', 0.9),
      finding('a', 'primary', 0.6),
      finding('b', 'secondary', 0.7),
    ])
    expect(sorted.map((f) => f.id)).toEqual(['a', 'b', 'c'])
  })

  it('breaks priority ties by confidence descending', () => {
    const sorted = sortFindings([
      finding('low', 'primary', 0.5),
      finding('high', 'primary', 0.95),
    ])
    expect(sorted.map((f) => f.id)).toEqual(['high', 'low'])
  })

  it('does not mutate the input array', () => {
    const input = [finding('a', 'secondary', 0.5), finding('b', 'primary', 0.5)]
    const snapshot = input.map((f) => f.id)
    sortFindings(input)
    expect(input.map((f) => f.id)).toEqual(snapshot)
  })

  it('finding carries evidence refs and no risk field', () => {
    const f = finding('squat.posture.trunk-drift', 'primary', 0.8)
    expect(f.evidence[0].metricId).toContain('metric')
    expect(f).not.toHaveProperty('risk')
    expect(f).not.toHaveProperty('injuryRisk')
  })
})
