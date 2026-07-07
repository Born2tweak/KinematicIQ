/**
 * Missing-feet pose tape fixture (CAM-A3) — an athlete standing too close to
 * the camera with their feet cropped out of frame, for
 * `/camera?source=pose-tape&fixture=missing-feet`.
 *
 * Ankles/heels/feet sit below the frame with near-zero visibility, so:
 * - checkCalibration fails on Ankles/Feet → auto-start stays in WAITING;
 * - capture guidance says "Step back — your feet are out of frame"
 *   (hips sit below y=0.7, the too-close branch in captureGuidance);
 * - the readiness checklist shows "Feet in frame" unchecked;
 * - no rep is ever counted and no auto-navigation happens.
 */
import type { PoseTape } from '../../eval/poseTape'
import type { PoseFrame } from '../../cv/types'
import { skeletonFrame, type SkeletonPose } from './fixtureSkeleton'

export const MISSING_FEET_FPS = 30

/** Too close: hips low in frame (y > 0.7), feet cropped below the frame. */
const TOO_CLOSE_FEET_CROPPED: SkeletonPose = {
  nose: { x: 0.5, y: 0.1 },
  shoulder: { x: 0.4, y: 0.25 },
  hip: { x: 0.43, y: 0.72 },
  knee: { x: 0.43, y: 0.93 },
  ankle: { x: 0.43, y: 1.04 },
  footVisibility: 0.05,
}

const FRAME_COUNT = 60 // 2 s, looped by the source

export function buildMissingFeetPoseTape(): PoseTape {
  const frames: PoseFrame[] = []
  for (let i = 0; i < FRAME_COUNT; i++) {
    frames.push(skeletonFrame(TOO_CLOSE_FEET_CROPPED, i, MISSING_FEET_FPS))
  }

  return {
    meta: {
      fps: MISSING_FEET_FPS,
      label: 'fixture-missing-feet',
      source: 'fixture',
      recordedAt: '2026-07-06T00:00:00.000Z',
    },
    frames,
  }
}
