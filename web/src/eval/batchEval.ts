/**
 * Batch tape evaluation (M12) — replay a directory of pose tapes through the
 * production pipeline and report what the app would have told the athlete.
 *
 * This is the standing companion to the per-tape regression net: point it at
 * any folder of `.posetape.json` files (`npm run eval:tapes -- <dir>`) and it
 * produces one row per tape — verdict, reps, quality reasons, findings — plus
 * a ground-truth comparison for tapes that carry `meta.truth`. Pure functions
 * here; file I/O lives in `scripts/evalTapes.ts`.
 */
import { deserializeTape, type PoseTape } from './poseTape'
import { replayTape } from './replayHarness'
import { bottomFrames, meanAbsError } from './metrics'
import { buildSessionResult } from '../session/buildSessionResult'
import {
  summarizeLandmarkQuality,
  type LandmarkQualitySummary,
} from '../cv/landmarkQuality'

/** Ground-truth comparison for a single tape, when `meta.truth` is present. */
export interface TruthComparison {
  truthRepCount: number | null
  repCountError: number | null
  /** MAE between predicted and labeled bottom-frame indices, paired in order. */
  bottomFrameMAE: number | null
}

export interface TapeEvalRow {
  file: string
  label: string | null
  source: string | null
  fps: number
  frames: number
  applied: { filtering: string; entry: string }
  repCount: number
  bottomFrames: number[]
  rejectionCount: number
  verdict: string
  qualityReasons: string[]
  trustedRepCount: number
  untrustedRepNumbers: number[]
  phantomCandidateCount: number
  sessionConfidence: string
  sessionConfidenceScore: number
  avgDepth: number | null
  findingIds: string[]
  truth: TruthComparison | null
  /** Aggregate per-frame landmark quality over the replayed frames (M26). */
  landmarkQuality: LandmarkQualitySummary
}

export interface TapeEvalError {
  file: string
  error: string
}

export type TapeEvalOutcome = TapeEvalRow | TapeEvalError

export function isEvalError(outcome: TapeEvalOutcome): outcome is TapeEvalError {
  return 'error' in outcome
}

function compareTruth(tape: PoseTape, predictedBottoms: number[], repCount: number): TruthComparison | null {
  const truth = tape.meta.truth
  if (!truth) return null
  const truthRepCount = truth.repCount ?? null
  const mae =
    truth.bottomFrameIndices && truth.bottomFrameIndices.length > 0
      ? meanAbsError(predictedBottoms, truth.bottomFrameIndices)
      : null
  return {
    truthRepCount,
    repCountError: truthRepCount === null ? null : repCount - truthRepCount,
    bottomFrameMAE: Number.isFinite(mae ?? NaN) ? mae : null,
  }
}

/** Replay one tape through the production pipeline and summarize the report. */
export function evaluateTape(tape: PoseTape, file: string): TapeEvalRow {
  const replay = replayTape(tape)
  const result = buildSessionResult(
    replay.reps,
    replay.poseConfidenceSamples,
    [],
    replay.repRejections,
    undefined,
    // Replays inherit the filtering the original analysis consumed.
    { captureSource: 'replay', filterVariant: tape.meta.filtering ?? 'raw' },
  )
  const bottoms = bottomFrames(replay.reps)
  return {
    file,
    label: tape.meta.label ?? null,
    source: tape.meta.source ?? null,
    fps: tape.meta.fps,
    frames: tape.frames.length,
    applied: replay.applied,
    repCount: replay.reps.length,
    bottomFrames: bottoms,
    rejectionCount: replay.repRejections.length,
    verdict: result.quality.verdict,
    qualityReasons: result.quality.reasons.map((r) => r.id),
    trustedRepCount: result.quality.trustedRepCount,
    untrustedRepNumbers: result.quality.untrustedRepNumbers,
    phantomCandidateCount: result.quality.phantomCandidateCount,
    sessionConfidence: result.sessionConfidence,
    sessionConfidenceScore: result.sessionConfidenceScore,
    avgDepth: result.metrics.avgDepth,
    findingIds: result.findings.map((f) => f.id),
    truth: compareTruth(tape, bottoms, replay.reps.length),
    landmarkQuality: summarizeLandmarkQuality(replay.landmarkQuality),
  }
}

/** Evaluate a set of already-read tape files (name → JSON string). */
export function evaluateTapes(
  files: ReadonlyArray<{ file: string; json: string }>,
): TapeEvalOutcome[] {
  return files.map(({ file, json }) => {
    try {
      return evaluateTape(deserializeTape(json), file)
    } catch (err) {
      return { file, error: err instanceof Error ? err.message : String(err) }
    }
  })
}

/** One line per tape, aligned for terminal reading. */
export function formatBatchReport(outcomes: readonly TapeEvalOutcome[]): string {
  const lines: string[] = []
  for (const o of outcomes) {
    if (isEvalError(o)) {
      lines.push(`${o.file}: ERROR ${o.error}`)
      continue
    }
    const reasons = o.qualityReasons.length ? ` reasons=[${o.qualityReasons.join(',')}]` : ''
    const truth =
      o.truth && o.truth.truthRepCount !== null
        ? ` truthReps=${o.truth.truthRepCount} (Δ${o.truth.repCountError})` +
          (o.truth.bottomFrameMAE !== null
            ? ` bottomMAE=${o.truth.bottomFrameMAE.toFixed(1)}`
            : '')
        : ''
    const quality =
      o.landmarkQuality.meanCriticalCoverage === null
        ? ''
        : ` critCov=${Math.round(o.landmarkQuality.meanCriticalCoverage * 100)}%` +
          (o.landmarkQuality.implausibleJumpFrames > 0
            ? ` jumps=${o.landmarkQuality.implausibleJumpFrames}`
            : '')
    lines.push(
      `${o.file}: reps=${o.repCount} verdict=${o.verdict}${reasons} conf=${o.sessionConfidence}(${o.sessionConfidenceScore})${truth}${quality}`,
    )
  }
  const errors = outcomes.filter(isEvalError).length
  lines.push(`${outcomes.length} tape${outcomes.length === 1 ? '' : 's'}, ${errors} error${errors === 1 ? '' : 's'}`)
  return lines.join('\n')
}
