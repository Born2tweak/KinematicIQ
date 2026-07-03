/**
 * Pose tapes — serialized raw pose sequences used to replay the analysis
 * pipeline deterministically and offline (see docs/23, M18 benchmark).
 *
 * A tape is the durable substrate: raw landmarks + world landmarks + visibility
 * + timestamps, exactly as MediaPipe produced them. Any pipeline variant (raw,
 * One-Euro, Butterworth, future models) replays the SAME tape, so improvements
 * are measured, not assumed.
 */
import type { PoseFrame } from '../cv/types'

export interface PoseTapeMeta {
  /** Sampling rate of the sequence in Hz. */
  fps: number
  label?: string
  source?: string
  /** Optional hand-labeled ground truth for benchmarking. */
  truth?: {
    repCount?: number
    /** Frame index of the deepest point of each rep. */
    bottomFrameIndices?: number[]
  }
}

export interface PoseTape {
  meta: PoseTapeMeta
  frames: PoseFrame[]
}

export function createTape(frames: PoseFrame[], meta: PoseTapeMeta): PoseTape {
  return { meta, frames }
}

export function serializeTape(tape: PoseTape): string {
  return JSON.stringify(tape)
}

export function deserializeTape(json: string): PoseTape {
  const parsed = JSON.parse(json) as PoseTape
  if (!parsed || typeof parsed !== 'object' || !parsed.meta || !Array.isArray(parsed.frames)) {
    throw new Error('Invalid pose tape: expected { meta, frames[] }')
  }
  if (typeof parsed.meta.fps !== 'number' || parsed.meta.fps <= 0) {
    throw new Error('Invalid pose tape: meta.fps must be a positive number')
  }
  return parsed
}

export interface TapeRecorder {
  /** Capture a raw frame as it streams from `detect()`. */
  record(frame: PoseFrame): void
  readonly count: number
  build(meta: PoseTapeMeta): PoseTape
  reset(): void
}

/**
 * Accumulate raw frames into a tape. Tap this alongside `poseEngine.detect` in a
 * live or offline session to capture a replayable recording.
 */
export function createTapeRecorder(): TapeRecorder {
  let frames: PoseFrame[] = []
  return {
    record(frame: PoseFrame): void {
      frames.push(frame)
    },
    get count(): number {
      return frames.length
    },
    build(meta: PoseTapeMeta): PoseTape {
      return { meta, frames: frames.slice() }
    },
    reset(): void {
      frames = []
    },
  }
}
