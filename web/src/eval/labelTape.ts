/**
 * Ground-truth labeling (M15) — attach hand-labeled truth to a pose tape
 * WITHOUT touching frames or any other meta. Labels are additive and carry
 * provenance (who/when/how), per the labeling protocol in
 * eval-tapes/README.md. The CLI wrapper lives in scripts/labelTape.ts.
 */
import { deserializeTape, serializeTape } from './poseTape'
import type { PoseTape, PoseTapeMeta } from './poseTape'

export type TruthLabel = NonNullable<PoseTapeMeta['truth']>

export interface LabelInput {
  repCount?: number
  bottomFrameIndices?: number[]
  labeledBy: string
  method: string
  notes?: string
}

function validateLabel(input: LabelInput, frameCount: number): void {
  if (input.repCount === undefined && input.bottomFrameIndices === undefined) {
    throw new Error('label must set repCount and/or bottomFrameIndices')
  }
  if (
    input.repCount !== undefined &&
    (!Number.isInteger(input.repCount) || input.repCount < 0)
  ) {
    throw new Error(`repCount must be a non-negative integer, got ${input.repCount}`)
  }
  if (input.bottomFrameIndices !== undefined) {
    for (const idx of input.bottomFrameIndices) {
      if (!Number.isInteger(idx) || idx < 0 || idx >= frameCount) {
        throw new Error(
          `bottom frame index ${idx} outside tape (0..${frameCount - 1})`,
        )
      }
    }
    if (
      input.repCount !== undefined &&
      input.bottomFrameIndices.length !== input.repCount
    ) {
      throw new Error(
        `bottomFrameIndices length (${input.bottomFrameIndices.length}) must match repCount (${input.repCount})`,
      )
    }
  }
  if (!input.labeledBy.trim()) throw new Error('labeledBy is required')
  if (!input.method.trim()) throw new Error('method is required')
}

/** Return a NEW tape with the truth label applied; input tape is not mutated. */
export function applyTruthLabel(tape: PoseTape, input: LabelInput): PoseTape {
  validateLabel(input, tape.frames.length)
  const truth: TruthLabel = {
    ...(input.repCount !== undefined ? { repCount: input.repCount } : {}),
    ...(input.bottomFrameIndices !== undefined
      ? { bottomFrameIndices: [...input.bottomFrameIndices] }
      : {}),
    labeledBy: input.labeledBy,
    labeledAt: new Date().toISOString(),
    method: input.method,
    ...(input.notes ? { notes: input.notes } : {}),
  }
  return { ...tape, meta: { ...tape.meta, truth } }
}

/** JSON-string convenience used by the CLI: parse, label, re-serialize. */
export function labelTapeJson(json: string, input: LabelInput): string {
  return serializeTape(applyTruthLabel(deserializeTape(json), input))
}
