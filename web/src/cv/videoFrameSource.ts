/**
 * DOM adapter for analyzing a local video file frame-by-frame.
 *
 * All bytes stay on the device: the file is read via an in-memory object URL
 * (`URL.createObjectURL`) and decoded by a detached `<video>` element. Nothing
 * is uploaded. The analyzer (see `analysis/videoAnalyzer.ts`) seeks this element
 * forward in time and feeds each decoded frame to the existing pose engine.
 */

/** Extensions we accept when a browser does not report a MIME type. */
const VIDEO_EXTENSION_PATTERN = /\.(mp4|mov|m4v|webm)$/i

export interface LoadedVideo {
  video: HTMLVideoElement
  objectUrl: string
  durationSeconds: number
  width: number
  height: number
  fileSizeBytes: number
}

/** True when the file looks like a video we can hand to a `<video>` element. */
export function isLikelySupportedVideo(file: File): boolean {
  if (file.type) {
    return file.type.startsWith('video/')
  }
  return VIDEO_EXTENSION_PATTERN.test(file.name)
}

/**
 * Load a local video file into a detached `<video>` element via an object URL
 * and resolve once metadata (duration / dimensions) is known.
 */
export function loadVideoFile(file: File): Promise<LoadedVideo> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.preload = 'auto'
    video.muted = true
    video.playsInline = true
    // Avoid CORS taint surprises if a frame is ever drawn to a canvas.
    video.crossOrigin = 'anonymous'

    const cleanupListeners = () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata)
      video.removeEventListener('error', onError)
    }

    const onError = () => {
      cleanupListeners()
      URL.revokeObjectURL(objectUrl)
      reject(
        new Error(
          'This video could not be opened. Try re-exporting it as an H.264 MP4.',
        ),
      )
    }

    const onLoadedMetadata = () => {
      cleanupListeners()
      if (!Number.isFinite(video.duration) || video.duration <= 0) {
        URL.revokeObjectURL(objectUrl)
        reject(new Error('Could not read this video’s length. Try a different file.'))
        return
      }
      resolve({
        video,
        objectUrl,
        durationSeconds: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        fileSizeBytes: file.size,
      })
    }

    video.addEventListener('loadedmetadata', onLoadedMetadata, { once: true })
    video.addEventListener('error', onError, { once: true })
    video.src = objectUrl
  })
}

/**
 * Seek the video to `seconds` and resolve once the frame is decoded.
 *
 * Analysis is forward-only; seeking backward in MediaPipe's VIDEO running mode
 * can confuse temporal tracking, so callers should only advance time.
 */
export function seekVideo(video: HTMLVideoElement, seconds: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      video.removeEventListener('seeked', onSeeked)
      video.removeEventListener('error', onError)
    }
    const onSeeked = () => {
      cleanup()
      resolve()
    }
    const onError = () => {
      cleanup()
      reject(new Error('Failed to read a frame from the video.'))
    }

    // Re-assigning the same currentTime does not fire `seeked`; resolve directly.
    if (Math.abs(video.currentTime - seconds) < 1e-3) {
      resolve()
      return
    }

    video.addEventListener('seeked', onSeeked, { once: true })
    video.addEventListener('error', onError, { once: true })
    video.currentTime = seconds
  })
}

/** Release the object URL and detach the source so the file can be GC'd. */
export function disposeVideo(loaded: LoadedVideo | null): void {
  if (!loaded) return
  try {
    loaded.video.pause()
    loaded.video.removeAttribute('src')
    loaded.video.load()
  } finally {
    URL.revokeObjectURL(loaded.objectUrl)
  }
}
