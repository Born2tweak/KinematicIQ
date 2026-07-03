import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { DisclaimerBanner } from '../components/DisclaimerBanner'
import { runVideoAnalysis } from '../analysis/videoAnalyzer'
import { poseEngine } from '../cv/poseEngine'
import {
  disposeVideo,
  isLikelySupportedVideo,
  loadVideoFile,
  seekVideo,
  type LoadedVideo,
} from '../cv/videoFrameSource'
import { buildSessionResult } from '../session/buildSessionResult'

// ── Advisory limits (warn, never silently block) ───────────────────
const MAX_RECOMMENDED_DURATION_S = 90
const LARGE_FILE_BYTES = 75 * 1024 * 1024
const HIGH_RESOLUTION_HEIGHT = 1080

type UploadStatus = 'idle' | 'loading' | 'ready' | 'analyzing' | 'error'

/** Pipeline stages lit progressively as offline analysis advances. */
const ANALYZE_STEPS = [
  { label: 'Capture', at: 2 },
  { label: 'Track', at: 20 },
  { label: 'Measure', at: 45 },
  { label: 'Detect', at: 70 },
  { label: 'Score', at: 92 },
] as const

function formatDuration(seconds: number): string {
  const total = Math.round(seconds)
  const mins = Math.floor(total / 60)
  const secs = total % 60
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
}

function buildWarnings(loaded: LoadedVideo): string[] {
  const warnings: string[] = []
  if (loaded.durationSeconds > MAX_RECOMMENDED_DURATION_S) {
    warnings.push(
      `This clip is ${formatDuration(loaded.durationSeconds)} — analysis works best on a single set under ${MAX_RECOMMENDED_DURATION_S}s.`,
    )
  }
  if (loaded.height > HIGH_RESOLUTION_HEIGHT) {
    warnings.push('High-resolution video may be slow to analyze — 720p works well.')
  }
  if (loaded.fileSizeBytes > LARGE_FILE_BYTES) {
    warnings.push('Large file — analysis may take a little while.')
  }
  return warnings
}

export function UploadScreen() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const loadedRef = useRef<LoadedVideo | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const [status, setStatus] = useState<UploadStatus>('idle')
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [fileName, setFileName] = useState<string | null>(null)
  const [durationSeconds, setDurationSeconds] = useState<number | null>(null)
  const [dimensions, setDimensions] = useState<{ w: number; h: number } | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [isModelLoading, setIsModelLoading] = useState(true)

  // Warm up the on-device model as soon as the screen mounts.
  useEffect(() => {
    let cancelled = false
    poseEngine
      .initialize()
      .catch((err: unknown) => {
        console.error('Error initializing Pose Engine:', err)
        if (!cancelled) {
          setError(
            'Failed to load the tracking model. Check your connection and refresh.',
          )
          setStatus('error')
        }
      })
      .finally(() => {
        if (!cancelled) setIsModelLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Release the video + any in-flight analysis on unmount.
  useEffect(() => {
    return () => {
      abortRef.current?.abort()
      disposeVideo(loadedRef.current)
      loadedRef.current = null
    }
  }, [])

  const resetLoadedVideo = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    disposeVideo(loadedRef.current)
    loadedRef.current = null
    setPreviewUrl(null)
    setProgress(0)
  }, [])

  const processFile = useCallback(
    async (file: File) => {
      resetLoadedVideo()
      setError(null)
      setWarnings([])

      if (!isLikelySupportedVideo(file)) {
        setError('Unsupported file. Please choose an MP4, MOV, or WebM video.')
        setStatus('error')
        return
      }

      setFileName(file.name)
      setStatus('loading')

      try {
        const loaded = await loadVideoFile(file)
        loadedRef.current = loaded
        setDurationSeconds(loaded.durationSeconds)
        setDimensions({ w: loaded.width, h: loaded.height })
        setPreviewUrl(loaded.objectUrl)
        setWarnings(buildWarnings(loaded))
        setStatus('ready')
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Could not open this video.'
        setError(message)
        setStatus('error')
      }
    },
    [resetLoadedVideo],
  )

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      // Allow re-picking the same file later.
      event.target.value = ''
      if (file) void processFile(file)
    },
    [processFile],
  )

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      setIsDragging(false)
      const file = event.dataTransfer.files?.[0]
      if (file) void processFile(file)
    },
    [processFile],
  )

  const handleAnalyze = useCallback(async () => {
    const loaded = loadedRef.current
    if (!loaded) return

    setError(null)
    setProgress(0)
    setStatus('analyzing')

    try {
      // Ensure the model is ready (mount-time init may still be in flight).
      await poseEngine.initialize()

      const controller = new AbortController()
      abortRef.current = controller

      const result = await runVideoAnalysis({
        durationSeconds: loaded.durationSeconds,
        // Offline path can afford the full-signal zero-phase Butterworth filter.
        filterLandmarks: true,
        seek: (seconds) => seekVideo(loaded.video, seconds),
        detect: (timestampMs, frameIndex) =>
          poseEngine.detect(loaded.video, timestampMs, frameIndex),
        // Stay ahead of any prior live-camera timestamps on the shared engine.
        timestampBaseMs: performance.now(),
        onProgress: (fraction) => setProgress(Math.round(fraction * 100)),
        signal: controller.signal,
      })

      if (result.framesWithPose === 0) {
        setError(
          'No person detected in this video. Make sure your whole body is in frame from the side, with good lighting.',
        )
        setStatus('error')
        return
      }

      const sessionResult = buildSessionResult(
        result.reps,
        result.poseConfidenceSamples,
        result.postureSamples,
      )
      navigate('/results', { state: { result: sessionResult } })
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // User cancelled — return to the ready state.
        setStatus('ready')
        setProgress(0)
        return
      }
      console.error('Error analyzing video:', err)
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong while analyzing this video.',
      )
      setStatus('error')
    } finally {
      abortRef.current = null
    }
  }, [navigate])

  const handleCancelAnalysis = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const handleChooseAnother = useCallback(() => {
    resetLoadedVideo()
    setStatus('idle')
    setError(null)
    setWarnings([])
    setFileName(null)
    setDurationSeconds(null)
    setDimensions(null)
  }, [resetLoadedVideo])

  const openFilePicker = () => fileInputRef.current?.click()

  return (
    <div className="stack-lg upload-page">
      <header className="upload-header">
        <p className="landing-eyebrow">Video analysis</p>
        <h1 className="page-title">Analyze a movement video</h1>
        <DisclaimerBanner />
      </header>

      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/*"
        onChange={handleFileChange}
        className="upload-file-input"
      />

      {status === 'error' && error && (
        <Card>
          <h2 className="card__title card__title--plain">
            Couldn’t analyze this video
          </h2>
          <p className="card__subtitle">{error}</p>
          <div className="btn-group btn-group--row card__footer-actions">
            <Button variant="primary" onClick={handleChooseAnother}>
              Choose another video
            </Button>
            <Button variant="ghost" onClick={() => navigate('/')}>
              Home
            </Button>
          </div>
        </Card>
      )}

      {status === 'idle' && (
        <button
          type="button"
          className={`upload-drop${isDragging ? ' upload-drop--drag' : ''}`}
          onClick={openFilePicker}
          onDragOver={handleDragOver}
          onDragEnter={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <span className="upload-drop__icon" aria-hidden>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 16V4" />
              <path d="m7 9 5-5 5 5" />
              <path d="M4 16.5V19a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 19v-2.5" />
            </svg>
          </span>
          <span className="upload-drop__title">Drop a video here</span>
          <span className="upload-drop__sub">
            or tap to choose an MP4, MOV, or WebM
          </span>
          <span className="upload-drop__meta">
            One set, filmed from the side, full body in frame.
            Everything stays on this device — nothing is uploaded.
          </span>
        </button>
      )}

      {status === 'loading' && (
        <Card
          variant="status"
          title="Reading video…"
          subtitle={fileName ?? 'Loading file details.'}
        />
      )}

      {(status === 'ready' || status === 'analyzing') && previewUrl && (
        <div className="stack-lg">
          <div className="upload-preview-panel">
            <div className="upload-preview">
              <video
                src={previewUrl}
                controls={status === 'ready'}
                playsInline
                muted
                className="upload-preview__media"
              />
              <div className="upload-preview__glow" aria-hidden />
            </div>
            <div className="stat-pills">
              {fileName && (
                <div className="stat-pill">
                  <span className="stat-pill__label">File</span>
                  <span className="stat-pill__value">{fileName}</span>
                </div>
              )}
              {durationSeconds !== null && (
                <div className="stat-pill">
                  <span className="stat-pill__label">Length</span>
                  <span className="stat-pill__value">
                    {formatDuration(durationSeconds)}
                  </span>
                </div>
              )}
              {dimensions && (
                <div className="stat-pill">
                  <span className="stat-pill__label">Resolution</span>
                  <span className="stat-pill__value">
                    {dimensions.w}×{dimensions.h}
                  </span>
                </div>
              )}
            </div>
            {warnings.length > 0 && status === 'ready' && (
              <div className="upload-warnings">
                {warnings.map((warning) => (
                  <p key={warning} className="upload-warning">
                    {warning}
                  </p>
                ))}
              </div>
            )}
          </div>

          {status === 'analyzing' ? (
            <div className="upload-analyzing" aria-live="polite">
              <div className="upload-steps">
                {ANALYZE_STEPS.map((step) => (
                  <span
                    key={step.label}
                    className={`upload-step${progress >= step.at ? ' upload-step--done' : ''}`}
                  >
                    {step.label}
                  </span>
                ))}
              </div>
              <div
                className="upload-progress"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="upload-progress__fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="upload-analyzing__caption">
                Analyzing on-device — {progress}%. Tracking pose, counting
                reps, and scoring this set.
              </p>
              <div className="btn-group btn-group--row">
                <Button variant="ghost" onClick={handleCancelAnalysis}>
                  Cancel analysis
                </Button>
              </div>
            </div>
          ) : (
            <div className="camera-actions">
              <div className="btn-group btn-group--row">
                <Button
                  variant="primary"
                  onClick={handleAnalyze}
                  disabled={isModelLoading}
                >
                  {isModelLoading ? 'Preparing model…' : 'Analyze movement'}
                </Button>
                <Button variant="ghost" onClick={handleChooseAnother}>
                  Choose another
                </Button>
              </div>
              <p className="camera-actions__hint">
                A side-on view with your whole body in frame gives the most reliable read.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
