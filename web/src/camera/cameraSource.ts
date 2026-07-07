/**
 * Camera source contract (CAM-A1) — separates WHERE frames come from (real
 * webcam, local fixture video, deterministic pose tape) from what the camera
 * screen does with them (auto-start, phase detection, rep counting, overlay).
 *
 * Production always uses the real-camera source. Fixture sources exist so
 * autonomous agents and e2e tests can exercise the live `/camera` flow
 * without a physical webcam, a permission prompt, or MediaPipe — see
 * docs/implementation/camera_autonomous_testing.md.
 */
import type { PoseFrame } from '../cv/types'

export type CameraSourceKind = 'real-camera' | 'fixture-video' | 'pose-tape'

export interface CameraSource {
  kind: CameraSourceKind
  /** Short human label; fixture sources surface it as "Fixture camera: <label>". */
  label: string
  /**
   * True when `getFrame` runs the MediaPipe pose model on the attached video
   * element, so the caller must initialize the model first. Pose-tape sources
   * return recorded frames directly and never load the model.
   */
  requiresPoseModel: boolean
  /**
   * Bind the source to the on-screen `<video>` element: acquire the webcam
   * stream (real camera) or attach a harmless placeholder feed (pose tape).
   * Idempotent — calling again with the same element resumes the preview.
   * Rejects with an Error whose `message` is user-facing copy.
   */
  attach(video: HTMLVideoElement): Promise<void>
  /**
   * Produce the pose frame for the current animation-loop tick.
   * `timestampMs` is the caller's wall clock (performance.now()); returned
   * frames carry that timestamp so downstream time-based gates (rep duration,
   * standing holds, auto-finish) behave identically across sources.
   */
  getFrame(timestampMs: number, frameIndex: number): PoseFrame | null
  /** Release the stream/placeholder and reset so attach() can run again. */
  stop(): void
}
