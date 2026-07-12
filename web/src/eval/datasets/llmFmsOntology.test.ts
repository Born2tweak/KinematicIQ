import { describe, expect, it } from 'vitest'
import { buildLlmFmsInlineLungeOntology } from './llmFmsOntology'

const rule = {
  ruleType: 'angle',
  ruleName: 'Torso inclination',
  ruleQuestion: 'Is the torso parallel to the vertical axis?',
  ruleOptions: ['Parallel', 'Not parallel'],
  bodyParts: ['Torso'],
}

const fixture = {
  m05: { actionName: 'Inline Lunge (Left)', view: 'side', rules: { r01: rule } },
  m06: { actionName: 'Inline Lunge (Right)', view: 'side', rules: { r01: rule } },
}

describe('LLM-FMS inline-lunge ontology', () => {
  it('extracts only namespaced left/right inline-lunge rules', () => {
    const report = buildLlmFmsInlineLungeOntology({
      rawRules: fixture,
      version: 'fixture-v1',
      rulesSha256: 'deadbeef',
    })
    expect(report.movements.map((movement) => [movement.sourceMovementId, movement.leadSide])).toEqual([
      ['m05', 'left'],
      ['m06', 'right'],
    ])
    expect(report.movements[0].rules[0]).toMatchObject({
      id: 'r01',
      type: 'angle',
      options: ['Parallel', 'Not parallel'],
    })
    expect(report).not.toHaveProperty('score')
    expect(JSON.stringify(report)).not.toContain('ruleResults')
  })

  it('rejects movement-id drift instead of silently importing the wrong action', () => {
    const wrong = structuredClone(fixture)
    wrong.m05.actionName = 'Hurdle Step (Left)'
    expect(() =>
      buildLlmFmsInlineLungeOntology({
        rawRules: wrong,
        version: 'fixture-v1',
        rulesSha256: 'deadbeef',
      }),
    ).toThrow(/must be Inline Lunge/)
  })

  it('rejects empty options and unsupported rule types', () => {
    const empty = structuredClone(fixture)
    empty.m05.rules.r01.ruleOptions = []
    expect(() =>
      buildLlmFmsInlineLungeOntology({
        rawRules: empty,
        version: 'fixture-v1',
        rulesSha256: 'deadbeef',
      }),
    ).toThrow(/non-empty/)

    const unsupported = structuredClone(fixture)
    unsupported.m06.rules.r01.ruleType = 'score'
    expect(() =>
      buildLlmFmsInlineLungeOntology({
        rawRules: unsupported,
        version: 'fixture-v1',
        rulesSha256: 'deadbeef',
      }),
    ).toThrow(/unsupported/)
  })
})
