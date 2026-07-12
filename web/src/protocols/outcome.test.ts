import { describe, expect, it } from 'vitest'
import {
  validateProtocolTrialOutcomeSet,
  type ProtocolTrialKind,
  type ProtocolTrialOutcomeSetV1,
} from './outcome'

const kinds: ProtocolTrialKind[] = [
  'repetition',
  'transition',
  'ballistic-event',
  'stride',
]

function fixture(): ProtocolTrialOutcomeSetV1 {
  return {
    schemaVersion: 1,
    protocolId: 'squat',
    trials: kinds.map((kind, index) => ({
      id: `${kind}-${index + 1}`,
      kind,
      status: 'completed',
      startFrameIndex: index * 10,
      endFrameIndex: index * 10 + 9,
    })),
  }
}

describe('ProtocolTrialOutcomeSetV1', () => {
  it('accepts deterministic fixtures for every trial kind', () => {
    const outcome = fixture()
    expect(validateProtocolTrialOutcomeSet(outcome)).toBe(outcome)
    expect(outcome.trials.map((trial) => trial.kind)).toEqual(kinds)
  })

  it('accepts explicit rejection and missingness', () => {
    const outcome: ProtocolTrialOutcomeSetV1 = {
      schemaVersion: 1,
      protocolId: 'jump',
      trials: [
        { id: 'attempt-1', kind: 'ballistic-event', status: 'rejected', startFrameIndex: 2, endFrameIndex: 8, rejectionReason: 'landing landmarks unavailable' },
        { id: 'attempt-2', kind: 'ballistic-event', status: 'missing', startFrameIndex: null, endFrameIndex: null, missingReason: 'takeoff event not observed' },
      ],
    }
    expect(validateProtocolTrialOutcomeSet(outcome)).toBe(outcome)
  })

  it('rejects out-of-order or overlapping observed trials', () => {
    const outcome = fixture()
    const second = outcome.trials[1]
    if (!second || second.status === 'missing') throw new Error('invalid fixture')
    outcome.trials[1] = { ...second, startFrameIndex: 5 }
    expect(() => validateProtocolTrialOutcomeSet(outcome)).toThrow(/ordered and non-overlapping/)
  })

  it('rejects missing events without a reason', () => {
    const outcome: ProtocolTrialOutcomeSetV1 = {
      schemaVersion: 1,
      protocolId: 'sprint',
      trials: [{ id: 'stride-1', kind: 'stride', status: 'missing', startFrameIndex: null, endFrameIndex: null, missingReason: ' ' }],
    }
    expect(() => validateProtocolTrialOutcomeSet(outcome)).toThrow(/requires a reason/)
  })

  it('rejects duplicate trial ids', () => {
    const outcome = fixture()
    const first = outcome.trials[0]
    const second = outcome.trials[1]
    if (!first || !second) throw new Error('invalid fixture')
    outcome.trials[1] = { ...second, id: first.id }
    expect(() => validateProtocolTrialOutcomeSet(outcome)).toThrow(/unique/)
  })
})
