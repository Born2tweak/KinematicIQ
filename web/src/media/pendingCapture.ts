/**
 * The capture artifacts of the analysis that just finished, waiting to be
 * written under a session id (P3).
 *
 * There is a genuine ordering problem here: the camera and upload screens
 * produce the video and the pose tape, but the session id is minted on the
 * results screen when the record is persisted (ADR-018). Rather than invent a
 * second identifier at capture time and reconcile it later, the producer
 * parks its artifacts here and `useResultsSession` drains them under the real
 * record id.
 *
 * Module-level and deliberately not persistent: this is a hand-off across one
 * navigation, and the durable copy is `media/captureMediaStore.ts`. `take`
 * clears as it reads so a second analysis can never inherit the first one's
 * footage.
 */
import type { PoseTape } from '../eval/poseTape'
import type { CaptureMediaSource } from './captureMediaStore'

export interface PendingCaptureMedia {
  blob: Blob
  mimeType: string
  source: CaptureMediaSource
  durationMs: number | null
}

export interface PendingCapture {
  media: PendingCaptureMedia | null
  tape: PoseTape | null
}

let pending: PendingCapture = { media: null, tape: null }

export function setPendingCaptureMedia(media: PendingCaptureMedia | null): void {
  pending = { ...pending, media }
}

export function setPendingCaptureTape(tape: PoseTape | null): void {
  pending = { ...pending, tape }
}

/** Read and clear. Returns whatever was parked, possibly nothing. */
export function takePendingCapture(): PendingCapture {
  const taken = pending
  pending = { media: null, tape: null }
  return taken
}

export function clearPendingCapture(): void {
  pending = { media: null, tape: null }
}
