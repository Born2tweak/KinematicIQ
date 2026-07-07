/**
 * Pose-tape camera source (CAM-A3) — replays a deterministic PoseTape as if
 * it were live camera frames. Never calls getUserMedia and never touches
 * MediaPipe; the camera screen's auto-start, phase detection, rep counting,
 * overlay, and finish flow all run unchanged on the recorded landmarks.
 *
 * Timing model: the first getFrame() call anchors the tape to the caller's
 * clock; afterwards the tape frame for a timestamp is a pure function of
 * elapsed time, so replay is deterministic for a given call schedule.
 * Returned frames carry the CALLER's timestamp/frameIndex so time-based
 * gates (rep duration, standing holds, auto-finish) run on wall clock,
 * exactly as with a real camera.
 */
import type { PoseFrame } from '../../cv/types'
import type { PoseTape } from '../../eval/poseTape'
import type { CameraSource } from '../cameraSource'

export interface PoseTapeCameraSourceOptions {
  /** Loop when the tape ends (default true). False holds the last frame. */
  loop?: boolean
  /** Frame index to wrap to when looping (default 0), e.g. past a preroll. */
  loopToFrame?: number
}

const PLACEHOLDER_WIDTH = 640
const PLACEHOLDER_HEIGHT = 360

/**
 * Attach a harmless synthetic feed to the video element so the camera
 * screen's existing gates (readyState, videoWidth) work unchanged. Uses
 * canvas.captureStream when available (real browsers); silently does nothing
 * in environments without it (jsdom) — unit tests drive getFrame directly.
 */
function createPlaceholderFeed(label: string): {
  stream: MediaStream | null
  stop(): void
} {
  if (
    typeof document === 'undefined' ||
    typeof HTMLCanvasElement === 'undefined'
  ) {
    return { stream: null, stop: () => {} }
  }

  const canvas = document.createElement('canvas')
  canvas.width = PLACEHOLDER_WIDTH
  canvas.height = PLACEHOLDER_HEIGHT
  if (typeof canvas.captureStream !== 'function') {
    return { stream: null, stop: () => {} }
  }

  const ctx = canvas.getContext('2d')
  const draw = () => {
    if (!ctx) return
    ctx.fillStyle = '#10151b'
    ctx.fillRect(0, 0, PLACEHOLDER_WIDTH, PLACEHOLDER_HEIGHT)
    ctx.fillStyle = '#39434f'
    ctx.font = '14px monospace'
    ctx.fillText(`pose-tape fixture: ${label}`, 16, 28)
  }
  draw()

  const stream = canvas.captureStream(30)
  // Keep redrawing so the capture stream keeps emitting frames and the
  // video element reaches (and holds) readyState >= 2.
  const intervalId = setInterval(draw, 250)

  return {
    stream,
    stop: () => {
      clearInterval(intervalId)
      stream.getTracks().forEach((track) => track.stop())
    },
  }
}

export function createPoseTapeCameraSource(
  tape: PoseTape,
  label: string,
  options: PoseTapeCameraSourceOptions = {},
): CameraSource {
  const loop = options.loop ?? true
  const fps = tape.meta.fps > 0 ? tape.meta.fps : 30
  const frameDurationMs = 1000 / fps

  let startTimestamp: number | null = null
  let feed: { stream: MediaStream | null; stop(): void } | null = null
  let videoElement: HTMLVideoElement | null = null

  function tapeIndexFor(timestampMs: number): number | null {
    const frameCount = tape.frames.length
    if (frameCount === 0) return null
    if (startTimestamp === null) startTimestamp = timestampMs

    const elapsed = Math.max(0, timestampMs - startTimestamp)
    const raw = Math.floor(elapsed / frameDurationMs)
    if (raw < frameCount) return raw
    if (!loop) return frameCount - 1

    const loopStart = Math.min(
      Math.max(options.loopToFrame ?? 0, 0),
      frameCount - 1,
    )
    const loopLength = frameCount - loopStart
    return loopStart + ((raw - loopStart) % loopLength)
  }

  return {
    kind: 'pose-tape',
    label,
    requiresPoseModel: false,

    async attach(video: HTMLVideoElement): Promise<void> {
      videoElement = video
      if (feed?.stream && video.srcObject === feed.stream) return

      feed?.stop()
      feed = createPlaceholderFeed(label)
      if (!feed.stream) return

      video.srcObject = feed.stream
      try {
        await video.play()
      } catch {
        // Muted autoplay should always be allowed; a placeholder that fails
        // to play only degrades the backdrop, never the analysis.
      }
    },

    getFrame(timestampMs: number, frameIndex: number): PoseFrame | null {
      const index = tapeIndexFor(timestampMs)
      if (index === null) return null
      const frame = tape.frames[index]
      return { ...frame, timestamp: timestampMs, frameIndex }
    },

    stop(): void {
      feed?.stop()
      feed = null
      if (videoElement) {
        videoElement.srcObject = null
        videoElement = null
      }
      startTimestamp = null
    },
  }
}
