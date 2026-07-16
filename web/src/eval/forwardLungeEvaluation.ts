import type { PoseFrame } from '../cv/types'
import { analyzeInlineLungeResearch } from '../protocols/inlineLunge'
import type { InlineLungeSide } from '../protocols/inlineLunge/types'
import type { Provenance } from '../core/provenance'

export interface InlineLungeEvaluationCase {
  sequenceId: string
  leadSide: InlineLungeSide
  provenance: Provenance
  frames: PoseFrame[]
  expectedCompleteTrials: number
  expectedBottomFrames?: number[]
  negative: boolean
}

export interface InlineLungeEvaluationRow {
  sequenceId: string
  expectedCompleteTrials: number
  observedCompleteTrials: number
  countAbsoluteError: number
  bottomFrameAbsoluteErrors: number[]
  falseActivation: boolean
  dropout: boolean
  rejectionReasons: string[]
}

export interface InlineLungeEvaluationReport {
  schemaVersion: 1
  protocolId: 'forwardLungeStrideReturn'
  rows: InlineLungeEvaluationRow[]
  summary: { sequenceCount: number; exactCountRate: number; countMae: number; falseActivationRate: number; dropoutRate: number }
}

export function evaluateInlineLungeCases(cases: readonly InlineLungeEvaluationCase[]): InlineLungeEvaluationReport {
  if (cases.length === 0) throw new Error('Inline-lunge evaluation requires at least one declared case.')
  const rows = cases.map((item): InlineLungeEvaluationRow => {
    const result = analyzeInlineLungeResearch(item.frames, { leadSide: item.leadSide, provenance: item.provenance })
    const completed = result.trials.filter((trial) => trial.status === 'completed')
    return {
      sequenceId: item.sequenceId,
      expectedCompleteTrials: item.expectedCompleteTrials,
      observedCompleteTrials: completed.length,
      countAbsoluteError: Math.abs(completed.length - item.expectedCompleteTrials),
      bottomFrameAbsoluteErrors: (item.expectedBottomFrames ?? []).map((frame, index) => completed[index] ? Math.abs(completed[index].bottomFrame - frame) : Number.NaN),
      falseActivation: item.negative && completed.length > 0,
      dropout: item.expectedCompleteTrials > 0 && completed.length === 0,
      rejectionReasons: result.trials.flatMap((trial) => trial.status === 'rejected' ? [trial.rejectionReason ?? 'rejected'] : []),
    }
  })
  const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length
  return {
    schemaVersion: 1, protocolId: 'forwardLungeStrideReturn', rows,
    summary: {
      sequenceCount: rows.length,
      exactCountRate: average(rows.map((row) => Number(row.countAbsoluteError === 0))),
      countMae: average(rows.map((row) => row.countAbsoluteError)),
      falseActivationRate: average(rows.filter((_, index) => cases[index].negative).map((row) => Number(row.falseActivation)).concat([0]).slice(0, Math.max(1, cases.filter((item) => item.negative).length))),
      dropoutRate: average(rows.filter((_, index) => cases[index].expectedCompleteTrials > 0).map((row) => Number(row.dropout)).concat([0]).slice(0, Math.max(1, cases.filter((item) => item.expectedCompleteTrials > 0).length))),
    },
  }
}
