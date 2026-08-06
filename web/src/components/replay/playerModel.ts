/**
 * Pure model for the movement player's presentation state (P3).
 *
 * The player is one synchronized surface with three sizes. Keeping the mode
 * machine and the video/landmark alignment out of the component makes both
 * testable without a DOM, a canvas, or WebGL.
 */
import type { PoseFrame } from '../../cv/types'

/**
 * `mini` is the default: a small card that does not dominate the report.
 * Clicking it steps up to `expanded`; `split` adds the synchronized 3D
 * reconstruction beside the source view.
 */
export type PlayerMode = 'mini' | 'expanded' | 'split'

export const PLAYER_MODES: readonly PlayerMode[] = ['mini', 'expanded', 'split']

/** One step up the disclosure ladder; `split` is the top and stays there. */
export function expandMode(mode: PlayerMode): PlayerMode {
  if (mode === 'mini') return 'expanded'
  return 'split'
}

/** One step down; `mini` is the floor. */
export function collapseMode(mode: PlayerMode): PlayerMode {
  if (mode === 'split') return 'expanded'
  return 'mini'
}

/** Only the split view mounts the 3D scene — WebGL is not free. */
export function showsScene3D(mode: PlayerMode): boolean {
  return mode === 'split'
}

/** The full transport (frame stepping, speeds, markers) needs the room. */
export function showsFullControls(mode: PlayerMode): boolean {
  return mode !== 'mini'
}

/**
 * Where the source video should be for a given analyzed frame, in seconds.
 *
 * IMPORTANT — this alignment is approximate, and callers must not present it
 * as frame-accurate. Landmarks carry the capture's own clock; the recording
 * has its own. For an uploaded file the two share an origin because analysis
 * samples from t=0, so the mapping is exact up to the sampling interval. For
 * a live session the recorder starts on the same transition the pose tape
 * starts on, so the offset is small but real — a few frames of drift are
 * expected and are not a defect.
 *
 * The SKELETON is always drawn from the landmark frame, never from the video
 * position, so the overlay stays truthful even when the video lags.
 */
export function videoTimeForFrame(
  frames: readonly PoseFrame[],
  sampleIndex: number,
): number | null {
  const first = frames[0]
  const current = frames[sampleIndex]
  if (!first || !current) return null
  return Math.max(0, (current.timestamp - first.timestamp) / 1000)
}

/**
 * True when the video is far enough from where it should be to need a seek.
 *
 * Seeking on every frame fights the browser's own decode pipeline and stalls
 * playback, so during playback the video is left to run and only corrected
 * when it drifts past this tolerance.
 */
export const VIDEO_DRIFT_TOLERANCE_S = 0.25

export function needsSeek(
  currentTime: number,
  targetTime: number,
  tolerance = VIDEO_DRIFT_TOLERANCE_S,
): boolean {
  return Math.abs(currentTime - targetTime) > tolerance
}
