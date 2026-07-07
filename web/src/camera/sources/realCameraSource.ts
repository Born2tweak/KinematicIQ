/**
 * Real webcam camera source (CAM-A2) — the production default.
 *
 * Wraps the exact `getUserMedia` acquisition, video attachment, stream
 * cleanup, and `poseEngine.detect` behavior that previously lived inline in
 * CameraScreen. User-facing error copy is unchanged: attach() rejects with an
 * Error whose message is exactly what the camera error panel should display.
 */
import { poseEngine } from '../../cv/poseEngine'
import type { CameraSource } from '../cameraSource'

const CAMERA_CONSTRAINTS: MediaStreamConstraints = {
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    facingMode: 'user',
  },
  audio: false,
}

export const CAMERA_UNAVAILABLE_MESSAGE =
  'Camera access is not available. Open this site over HTTPS and use a supported browser.'
export const CAMERA_PERMISSION_DENIED_MESSAGE =
  'Camera permission denied. Click the camera icon in the address bar, allow access for this site, then press Try again.'
export const CAMERA_NOT_FOUND_MESSAGE =
  'No camera device found. Please connect a webcam and try again.'
export const CAMERA_PREVIEW_FAILED_MESSAGE =
  'Could not start the camera preview. Allow camera access in your browser, then try again.'

/** Map a getUserMedia rejection to the existing user-facing error copy. */
function mapGetUserMediaError(err: unknown): Error {
  const error = err as { name?: string; message?: string }
  if (
    error.name === 'NotAllowedError' ||
    error.name === 'PermissionDeniedError'
  ) {
    return new Error(CAMERA_PERMISSION_DENIED_MESSAGE)
  }
  if (
    error.name === 'NotFoundError' ||
    error.name === 'DevicesNotFoundError'
  ) {
    return new Error(CAMERA_NOT_FOUND_MESSAGE)
  }
  return new Error(`Unable to access camera: ${error.message || 'Unknown error'}`)
}

export function createRealCameraSource(): CameraSource {
  let stream: MediaStream | null = null
  let videoElement: HTMLVideoElement | null = null
  /** True once stop() runs; a getUserMedia resolving afterwards is discarded. */
  let stopped = false

  return {
    kind: 'real-camera',
    label: 'Live camera',
    requiresPoseModel: true,

    async attach(video: HTMLVideoElement): Promise<void> {
      stopped = false
      videoElement = video

      // Idempotent resume: the stream is live and already on this element.
      if (stream && video.srcObject === stream) return

      if (!stream) {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error(CAMERA_UNAVAILABLE_MESSAGE)
        }

        let mediaStream: MediaStream
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia(
            CAMERA_CONSTRAINTS,
          )
        } catch (err: unknown) {
          console.error('Error accessing camera:', err)
          throw mapGetUserMediaError(err)
        }

        if (stopped) {
          // stop() ran while the permission prompt was pending — release
          // the tracks silently, exactly as the old effect cleanup did.
          mediaStream.getTracks().forEach((track) => track.stop())
          return
        }
        stream = mediaStream
      }

      video.srcObject = stream
      try {
        await video.play()
      } catch (playErr: unknown) {
        console.error('Error playing camera preview:', playErr)
        throw new Error(CAMERA_PREVIEW_FAILED_MESSAGE)
      }
    },

    getFrame(timestampMs: number, frameIndex: number) {
      if (!videoElement) return null
      return poseEngine.detect(videoElement, timestampMs, frameIndex)
    },

    stop(): void {
      stopped = true
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
        stream = null
      }
      if (videoElement) {
        videoElement.srcObject = null
        videoElement = null
      }
    },
  }
}
