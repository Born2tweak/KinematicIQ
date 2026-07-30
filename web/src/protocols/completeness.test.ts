import { describe, expect, it } from 'vitest'
import { SQUAT_RUNTIME, getProtocolRuntime, hasProtocolRuntime } from './runtime'
import { getProtocol, listProtocolsByStatus } from './registry'
import {
  assertRegisteredProtocolsComplete,
  lintProtocolCompleteness,
} from './completeness'

describe('protocol completeness and activation lint', () => {
  it('accepts current registry while squat alone is available', () => {
    expect(() => assertRegisteredProtocolsComplete()).not.toThrow()
    expect(listProtocolsByStatus('available').map(({ definition }) => definition.id)).toEqual(['squat'])
  })

  it('rejects an available definition without executable declarations', () => {
    const squat = getProtocol('squat')
    const malformed = {
      ...squat,
      definition: {
        ...squat.definition,
        metrics: [],
        findingRuleIds: [],
      },
    }
    expect(lintProtocolCompleteness(malformed, SQUAT_RUNTIME).map((issue) => issue.field)).toEqual(
      expect.arrayContaining(['metrics', 'findingRuleIds']),
    )
  })

  it('rejects missing runtime, capture, confidence, provenance, and acceptance declarations', () => {
    const squat = getProtocol('squat')
    const metric = squat.definition.metrics[0]!
    const malformed = {
      definition: {
        ...squat.definition,
        capture: { ...squat.definition.capture, inputModes: [], viewInstruction: '', setupInstructions: [] },
        metrics: [{ ...metric, confidenceBasis: [], description: '' }],
        evidence: {
          ...squat.definition.evidence,
          evidenceRefs: [],
          validationGates: [],
          acceptanceThresholds: { provenance: 'not-defined' as const, evidenceRefs: [] },
        },
      },
      profile: squat.profile,
    }
    const fields = lintProtocolCompleteness(malformed).map((issue) => issue.field)
    expect(fields).toEqual(expect.arrayContaining([
      'runtime',
      'capture.inputModes',
      'capture.viewInstruction',
      'capture.setupInstructions',
      `${metric.id ? `metrics.${metric.id}.confidenceBasis` : ''}`,
      'evidence.evidenceRefs',
      'evidence.validationGates',
      'evidence.acceptanceThresholds',
      'evidence.acceptanceThresholds.evidenceRefs',
    ]))
  })

  it('keeps every protocol without an implementation metadata-only', () => {
    for (const protocol of listProtocolsByStatus('planned')) {
      if (hasProtocolRuntime(protocol.definition.id)) continue
      expect(lintProtocolCompleteness(protocol)).toEqual([])
      expect(protocol.profile).toBeNull()
      expect(protocol.definition.capture.inputModes).toEqual([])
    }
  })

  it('refuses an input path with no runtime behind it', () => {
    // This is the invariant the old `status === 'planned'` rule was protecting:
    // a movement a user can select must have an implementation.
    const lunge = getProtocol('forwardLungeStrideReturn')
    expect(lunge.definition.capture.inputModes.length).toBeGreaterThan(0)
    expect(lintProtocolCompleteness(lunge).map((issue) => issue.field)).toEqual([
      'runtime',
      'runtime.outcomeKinds',
    ])
    expect(
      lintProtocolCompleteness(lunge, getProtocolRuntime('forwardLungeStrideReturn')),
    ).toEqual([])
  })
})
