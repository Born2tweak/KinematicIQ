/**
 * Clean-squat pose tape fixture (CAM-A3) — a synthetic, deterministic
 * front-view squat session for `/camera?source=pose-tape&fixture=clean-squat`.
 *
 * Designed against the real pipeline thresholds so the live camera flow
 * behaves exactly as with a well-framed athlete:
 * - standing preroll passes checkCalibration + capture readiness and holds
 *   still long enough for auto-start calibration (60 stable loop frames);
 * - each rep descends to ~98° knee / ~0.13 normalized hip drop (below the
 *   105° bottom threshold, above the 0.03 min hip descent, safely under the
 *   0.2–0.3 seated heuristics), holds the bottom, and returns to lockout;
 * - between-rep standing stays ≤1.5 s so auto-finish (5 s + countdown) never
 *   fires while the tape loops reps forever.
 *
 * Reuses the eval PoseTape substrate — the same shape live sessions record.
 */
import type { PoseTape } from '../../eval/poseTape'
import type { PoseFrame } from '../../cv/types'
import {
  interpolatePose,
  skeletonFrame,
  type SkeletonPose,
} from './fixtureSkeleton'

export const CLEAN_SQUAT_FPS = 30

/** Upright standing, well framed: body fills ~64% of frame height, centered. */
const STANDING: SkeletonPose = {
  nose: { x: 0.5, y: 0.18 },
  shoulder: { x: 0.42, y: 0.26 },
  hip: { x: 0.44, y: 0.47 },
  knee: { x: 0.44, y: 0.645 },
  ankle: { x: 0.44, y: 0.82 },
}

/** Deep squat bottom: knee ≈ 98°, hip drop ≈ 0.13, knees tracking outward. */
const BOTTOM: SkeletonPose = {
  nose: { x: 0.5, y: 0.31 },
  shoulder: { x: 0.42, y: 0.39 },
  hip: { x: 0.46, y: 0.6 },
  knee: { x: 0.38, y: 0.64 },
  ankle: { x: 0.44, y: 0.82 },
}

const SECONDS = CLEAN_SQUAT_FPS

/** Frames of standing preroll before the first rep (auto-start calibration). */
export const CLEAN_SQUAT_PREROLL_FRAMES = 6 * SECONDS

/**
 * When looping, wrap back to the first rep instead of the calibration
 * preroll: mid-set the athlete keeps squatting, they don't re-calibrate.
 * Keeps continuous standing ≤ ~1.5 s so auto-finish never triggers.
 */
export const CLEAN_SQUAT_LOOP_TO_FRAME = CLEAN_SQUAT_PREROLL_FRAMES

const REPS = 3
const DESCEND_FRAMES = 21 // 0.7 s
const BOTTOM_FRAMES = 18 // 0.6 s
const ASCEND_FRAMES = 21 // 0.7 s
const STAND_FRAMES = 45 // 1.5 s

function pushPose(frames: PoseFrame[], pose: SkeletonPose): void {
  frames.push(skeletonFrame(pose, frames.length, CLEAN_SQUAT_FPS))
}

export function buildCleanSquatPoseTape(): PoseTape {
  const frames: PoseFrame[] = []

  for (let i = 0; i < CLEAN_SQUAT_PREROLL_FRAMES; i++) {
    pushPose(frames, STANDING)
  }

  for (let rep = 0; rep < REPS; rep++) {
    for (let i = 0; i < DESCEND_FRAMES; i++) {
      pushPose(frames, interpolatePose(STANDING, BOTTOM, (i + 1) / DESCEND_FRAMES))
    }
    for (let i = 0; i < BOTTOM_FRAMES; i++) {
      pushPose(frames, BOTTOM)
    }
    for (let i = 0; i < ASCEND_FRAMES; i++) {
      pushPose(frames, interpolatePose(BOTTOM, STANDING, (i + 1) / ASCEND_FRAMES))
    }
    for (let i = 0; i < STAND_FRAMES; i++) {
      pushPose(frames, STANDING)
    }
  }

  return {
    meta: {
      fps: CLEAN_SQUAT_FPS,
      label: 'fixture-clean-squat',
      source: 'fixture',
      recordedAt: '2026-07-06T00:00:00.000Z',
    },
    frames,
  }
}
