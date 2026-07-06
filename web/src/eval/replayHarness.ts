/**
 * Replay harness (M18): run a pose tape through pipeline variants and compare
 * them, so filtering (M19) is adopted only if it measurably lowers variance
 * without changing rep count / bottom timing.
 *
 * Reuses the SAME analysis loop as production via `runPipelineOnFrames`, and the
 * SAME filters the app uses (`cv/landmarkFilter`). No duplicated logic.
 */
import { createLiveStreamFilter, filterFrameSequence } from '../cv/landmarkFilter'
import { runPipelineOnFrames } from '../analysis/videoAnalyzer'
import { getJointAngles } from '../analysis/angles'
import { safeLandmark } from '../analysis/geometry'
import { activateAnalysisPipeline } from '../analysis/setActivation'
import type { RepRejection } from '../analysis/repCounter'
import type { LandmarkQualityFrame, RepMetrics } from '../cv/types'
import type { FrameTraceSample } from '../analysis/frameTrace'
import { LANDMARK_INDICES, type PoseFrame } from '../cv/types'
import type { PoseTape, PoseTapeEntryState } from './poseTape'
import { bottomFrames, depthCV, landmarkJitter } from './metrics'

export type Variant = 'raw' | 'oneEuro' | 'butterworth'

export interface VariantResult {
  variant: Variant
  repCount: number
  depthCV: number | null
  /** Jitter of the hip-Y trajectory (variance proxy; lower is smoother). */
  hipJitter: number
  bottomFrames: number[]
  frames: PoseFrame[]
}

function applyVariant(tape: PoseTape, variant: Variant): PoseFrame[] {
  switch (variant) {
    case 'raw':
      return tape.frames
    case 'butterworth':
      return filterFrameSequence(tape.frames, { fps: tape.meta.fps })
    case 'oneEuro': {
      const filter = createLiveStreamFilter()
      return tape.frames.map((f) => filter.filter(f))
    }
  }
}

export function runVariant(tape: PoseTape, variant: Variant): VariantResult {
  const frames = applyVariant(tape, variant)
  const { reps } = runPipelineOnFrames(frames)
  return {
    variant,
    repCount: reps.length,
    depthCV: depthCV(reps),
    hipJitter: landmarkJitter(frames, LANDMARK_INDICES.LEFT_HIP, 'y'),
    bottomFrames: bottomFrames(reps),
    frames,
  }
}

export function compareVariants(
  tape: PoseTape,
  variants: Variant[] = ['raw', 'oneEuro', 'butterworth'],
): VariantResult[] {
  return variants.map((v) => runVariant(tape, v))
}

// ── Live-parity replay (finding #7) ─────────────────────────────────
//
// `runVariant` above is the FILTER benchmark: it deliberately cold-starts
// the pipeline to compare filter variants against each other. Auditing a
// LIVE session is different — the live pipeline consumed One-Euro-filtered
// frames and was seeded at activation (calibration snapshot +
// `beginSetDuringDescent`). `replayTape` reproduces both so the same tape
// yields the same reps, phases, candidates, and rejections as the session
// that recorded it.

export interface ReplayTapeOptions {
  /**
   * 'live'  — reproduce the recording session's pipeline: apply the tape's
   *           declared filtering to the raw frames and seed the entry state
   *           (from `meta.entryState` when present, else reconstructed).
   *   'cold' — raw frames, cold-start FSM (the old replay behavior).
   * Default 'live'.
   */
  mode?: 'live' | 'cold'
}

export interface ReplayTapeResult {
  reps: RepMetrics[]
  repRejections: RepRejection[]
  frameTrace: FrameTraceSample[]
  poseConfidenceSamples: number[]
  /** Per-frame landmark quality over the frames the FSM consumed (M26). */
  landmarkQuality: LandmarkQualityFrame[]
  /** Frames the FSM actually consumed (post-filtering). */
  analyzedFrames: PoseFrame[]
  /** How the replay was configured — for reports and debugging. */
  applied: {
    filtering: 'none' | 'one-euro' | 'butterworth'
    entry: 'cold' | 'seeded-from-meta' | 'seeded-reconstructed'
  }
}

function frameHipY(frame: PoseFrame): number | null {
  const leftHip = safeLandmark(frame, LANDMARK_INDICES.LEFT_HIP)
  const rightHip = safeLandmark(frame, LANDMARK_INDICES.RIGHT_HIP)
  return leftHip && rightHip ? (leftHip.y + rightHip.y) / 2 : null
}

function frameTrackingKnee(frame: PoseFrame): number | null {
  const angles = getJointAngles(frame)
  const knees = [angles.leftKnee, angles.rightKnee].filter(
    (value): value is number => value !== null,
  )
  return knees.length === 0 ? null : Math.min(...knees)
}

/**
 * Apply the filtering the ANALYSIS used during capture. Tape frames are raw
 * by contract; legacy tapes whose frames were saved post-filter set
 * `meta.framesFiltered` and are never filtered again.
 */
function applyTapeFiltering(tape: PoseTape): {
  frames: PoseFrame[]
  filtering: 'none' | 'one-euro' | 'butterworth'
} {
  if (tape.meta.framesFiltered) {
    return { frames: tape.frames.slice(), filtering: 'none' }
  }
  switch (tape.meta.filtering) {
    case 'one-euro-live': {
      const filter = createLiveStreamFilter()
      return {
        frames: tape.frames.map((f) => filter.filter(f)),
        filtering: 'one-euro',
      }
    }
    case 'butterworth-offline':
      return {
        frames: filterFrameSequence(tape.frames, { fps: tape.meta.fps }),
        filtering: 'butterworth',
      }
    default:
      return { frames: tape.frames.slice(), filtering: 'none' }
  }
}

/**
 * Entry state for tapes recorded before `meta.entryState` existed. Live
 * capture starts taping at the ACTIVE transition, which fires when a descent
 * is already underway — so the first frame approximates the calibrated
 * standing pose closely enough to seed activation deterministically.
 */
function reconstructEntryState(firstFrame: PoseFrame): PoseTapeEntryState {
  return {
    calibratedHipY: frameHipY(firstFrame),
    standingKneeAngle: null,
    activatedByDescent: true,
  }
}

/**
 * Replay a pose tape through the production pipeline, reproducing the
 * recording session's filtering and entry state so tapes work as regression
 * fixtures (finding #7). Deterministic: same tape, same options → identical
 * reps, phases, candidates, rejections, and metrics.
 */
export function replayTape(
  tape: PoseTape,
  options: ReplayTapeOptions = {},
): ReplayTapeResult {
  const mode = options.mode ?? 'live'
  // Frames before the activation index are calibration preroll: they warm
  // the filter exactly as the live session did, but the FSM never sees them.
  const startIndex = Math.min(
    Math.max(tape.meta.analysisStartFrameIndex ?? 0, 0),
    tape.frames.length,
  )

  if (mode === 'cold' || tape.frames.length === 0) {
    const analysisFrames = tape.frames.slice(startIndex)
    const result = runPipelineOnFrames(analysisFrames)
    return {
      ...result,
      analyzedFrames: analysisFrames,
      applied: { filtering: 'none', entry: 'cold' },
    }
  }

  const { frames: filteredFrames, filtering } = applyTapeFiltering(tape)
  const frames = filteredFrames.slice(startIndex)

  const isLiveTape =
    tape.meta.source === 'live' || tape.meta.filtering === 'one-euro-live'
  const entryState =
    tape.meta.entryState ??
    (isLiveTape && frames.length > 0
      ? reconstructEntryState(frames[0])
      : undefined)

  if (frames.length === 0 || !entryState || !entryState.activatedByDescent) {
    // Upload-path tapes (and live sets that started from standing) ran a
    // cold pipeline; replay does the same.
    const result = runPipelineOnFrames(frames)
    return {
      ...result,
      analyzedFrames: frames,
      applied: { filtering, entry: 'cold' },
    }
  }

  const first = frames[0]
  const activated = activateAnalysisPipeline({
    frame: first,
    angles: getJointAngles(first),
    hipY: frameHipY(first),
    calibratedHipY: entryState.calibratedHipY,
    trackingKneeAngle: frameTrackingKnee(first),
    standingKneeAngle: entryState.standingKneeAngle,
  })

  const result = runPipelineOnFrames(frames, {
    phaseDetector: activated.phaseDetector,
    repCounter: activated.repCounter,
  })
  return {
    ...result,
    analyzedFrames: frames,
    applied: {
      filtering,
      entry: tape.meta.entryState ? 'seeded-from-meta' : 'seeded-reconstructed',
    },
  }
}

/** Human-readable comparison table for the benchmark report. */
export function formatComparison(tape: PoseTape, results: VariantResult[]): string {
  const lines: string[] = [
    `Tape: ${tape.meta.label ?? 'unlabeled'} — ${tape.frames.length} frames @ ${tape.meta.fps}fps`,
  ]
  if (tape.meta.truth?.repCount != null) {
    lines.push(`Ground-truth reps: ${tape.meta.truth.repCount}`)
  }
  lines.push('variant       reps   depthCV(%)   hipJitter')
  for (const r of results) {
    const cv = r.depthCV == null ? '   n/a' : r.depthCV.toFixed(2).padStart(6)
    lines.push(
      `${r.variant.padEnd(12)} ${String(r.repCount).padStart(4)}   ${cv}     ${r.hipJitter.toExponential(2)}`,
    )
  }
  return lines.join('\n')
}
