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
import { LANDMARK_INDICES, type PoseFrame } from '../cv/types'
import type { PoseTape } from './poseTape'
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
