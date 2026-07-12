import type { ProtocolId } from '../core/protocol'

export type ProtocolTrialKind =
  | 'repetition'
  | 'transition'
  | 'ballistic-event'
  | 'stride'

interface TrialIdentity {
  id: string
  kind: ProtocolTrialKind
}

interface ObservedFrames {
  startFrameIndex: number
  endFrameIndex: number
}

export type ProtocolTrialOutcome =
  | (TrialIdentity & ObservedFrames & {
      status: 'completed'
      rejectionReason?: never
      missingReason?: never
    })
  | (TrialIdentity & ObservedFrames & {
      status: 'rejected'
      rejectionReason: string
      missingReason?: never
    })
  | (TrialIdentity & {
      status: 'missing'
      startFrameIndex: null
      endFrameIndex: null
      rejectionReason?: never
      missingReason: string
    })

/** Additive neutral envelope; no current SessionResult or tape uses it yet. */
export interface ProtocolTrialOutcomeSetV1 {
  schemaVersion: 1
  protocolId: ProtocolId
  trials: ProtocolTrialOutcome[]
}

export function validateProtocolTrialOutcomeSet(
  outcome: ProtocolTrialOutcomeSetV1,
): ProtocolTrialOutcomeSetV1 {
  if (outcome.schemaVersion !== 1) {
    throw new Error('Unsupported protocol trial outcome schema.')
  }

  const ids = new Set<string>()
  let previousEnd = -1
  for (const trial of outcome.trials) {
    if (!trial.id || ids.has(trial.id)) {
      throw new Error(`Trial ids must be non-empty and unique: "${trial.id}".`)
    }
    ids.add(trial.id)

    if (trial.status === 'missing') {
      if (!trial.missingReason.trim()) {
        throw new Error(`Missing trial "${trial.id}" requires a reason.`)
      }
      continue
    }
    if (!Number.isInteger(trial.startFrameIndex) ||
        !Number.isInteger(trial.endFrameIndex) ||
        trial.startFrameIndex < 0 ||
        trial.endFrameIndex < trial.startFrameIndex) {
      throw new Error(`Trial "${trial.id}" has an invalid frame range.`)
    }
    if (trial.startFrameIndex <= previousEnd) {
      throw new Error(`Observed trials must be ordered and non-overlapping.`)
    }
    if (trial.status === 'rejected' && !trial.rejectionReason.trim()) {
      throw new Error(`Rejected trial "${trial.id}" requires a reason.`)
    }
    previousEnd = trial.endFrameIndex
  }
  return outcome
}
