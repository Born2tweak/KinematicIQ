/**
 * Source-video recording for live camera sessions (P3).
 *
 * The live path previously produced landmarks only, so a camera session's
 * report could never show the footage it was drawn from. This records the
 * same `MediaStream` the preview is showing, entirely in memory, and hands
 * back a Blob the caller stores locally. Nothing is uploaded.
 *
 * Three things this deliberately does NOT do:
 *
 *   1. It never gates capture. `MediaRecorder` support, codec availability,
 *      and recording errors are all non-fatal — analysis is driven by the
 *      pose pipeline and must run identically whether or not video was kept.
 *      A failed recording costs the replay, never the report.
 *   2. It does not re-encode or resize. The bytes are whatever the browser
 *      produced from the live stream.
 *   3. It records only from a real camera stream. Fixture sources expose no
 *      stream, so a deterministic test run stores no video rather than
 *      fabricating one.
 */

/** Preference order: VP9 is smallest, H.264 is the widest to play back later. */
const CANDIDATE_MIME_TYPES = [
  'video/webm;codecs=vp9',
  'video/webm;codecs=vp8',
  'video/webm',
  'video/mp4',
] as const

export interface CaptureRecording {
  blob: Blob
  mimeType: string
  durationMs: number
}

export interface CaptureRecorder {
  /** False when the browser refused to start; the caller carries on regardless. */
  readonly recording: boolean
  /** Resolves null when nothing usable was captured. */
  stop(): Promise<CaptureRecording | null>
}

export function isRecordingSupported(): boolean {
  return (
    typeof MediaRecorder !== 'undefined' &&
    typeof MediaRecorder.isTypeSupported === 'function'
  )
}

/** The first candidate this browser accepts, or null when none work. */
export function pickMimeType(
  isSupported: (type: string) => boolean = (type) =>
    MediaRecorder.isTypeSupported(type),
): string | null {
  for (const type of CANDIDATE_MIME_TYPES) {
    try {
      if (isSupported(type)) return type
    } catch {
      // A browser that throws on an unknown type simply does not support it.
    }
  }
  return null
}

/**
 * Begin recording `stream`. Returns a recorder whose `recording` flag reports
 * whether anything is actually being captured — callers must treat `false` as
 * an ordinary outcome, not an error.
 */
export function startCaptureRecording(
  stream: MediaStream | null,
): CaptureRecorder {
  const inert: CaptureRecorder = {
    recording: false,
    async stop() {
      return null
    },
  }

  if (!stream || !isRecordingSupported()) return inert

  const mimeType = pickMimeType()
  if (!mimeType) return inert

  let recorder: MediaRecorder
  try {
    recorder = new MediaRecorder(stream, { mimeType })
  } catch {
    return inert
  }

  const chunks: Blob[] = []
  let failed = false
  recorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) chunks.push(event.data)
  }
  recorder.onerror = () => {
    failed = true
  }

  const startedAt = performance.now()
  try {
    // One chunk per second: an interrupted session still yields playable
    // bytes, rather than a single blob that only materializes on stop.
    recorder.start(1000)
  } catch {
    return inert
  }

  let stopping: Promise<CaptureRecording | null> | null = null

  return {
    get recording() {
      return recorder.state !== 'inactive' && !failed
    },
    stop() {
      // Idempotent: the camera screen can finish a set through auto-finish and
      // an unmount in the same tick.
      if (stopping) return stopping
      stopping = new Promise<CaptureRecording | null>((resolve) => {
        const finish = () => {
          if (failed || chunks.length === 0) {
            resolve(null)
            return
          }
          const blob = new Blob(chunks, { type: mimeType })
          resolve(
            blob.size > 0
              ? { blob, mimeType, durationMs: performance.now() - startedAt }
              : null,
          )
        }
        if (recorder.state === 'inactive') {
          finish()
          return
        }
        recorder.onstop = finish
        try {
          recorder.stop()
        } catch {
          resolve(null)
        }
      })
      return stopping
    },
  }
}
