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

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      // Allow re-picking the same file later.
      event.target.value = ''
      if (!file) return

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
    <div className="stack-lg">
      <header className="results-page__header">
        <h1 className="page-title">Analyze a video</h1>
        <DisclaimerBanner />
      </header>

      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {status === 'error' && error && (
        <Card>
          <h2 className="card__title" style={{ color: 'var(--color-text)' }}>
            Couldn’t analyze this video
          </h2>
          <p className="card__subtitle">{error}</p>
          <div className="btn-group btn-group--row" style={{ marginTop: 'var(--space-md)' }}>
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
        <Card
          title="Pick a squat video"
          subtitle="Choose a clip from this device. It stays on your device — nothing is uploaded."
        >
          <button
            type="button"
            className="upload-dropzone"
            onClick={openFilePicker}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--space-sm)',
              width: '100%',
              padding: 'var(--space-xl)',
              border: '2px dashed var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              background: 'transparent',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: '2rem' }} aria-hidden>
              🎬
            </span>
            <span>Tap to choose an MP4, MOV, or WebM</span>
            <span style={{ fontSize: '0.85rem' }}>
              Film one set from the side, full body in frame.
            </span>
          </button>
        </Card>
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
          <Card>
            <div className="upload-preview">
              <video
                src={previewUrl}
                controls={status === 'ready'}
                playsInline
                muted
                className="upload-preview__media"
              />
            </div>
            <div className="detail-rows" style={{ marginTop: 'var(--space-md)' }}>
              {fileName && (
                <div className="detail-row">
                  <span className="detail-row__label">File</span>
                  <span className="detail-row__value">{fileName}</span>
                </div>
              )}
              {durationSeconds !== null && (
                <div className="detail-row">
                  <span className="detail-row__label">Length</span>
                  <span className="detail-row__value">
                    {formatDuration(durationSeconds)}
                  </span>
                </div>
              )}
              {dimensions && (
                <div className="detail-row">
                  <span className="detail-row__label">Resolution</span>
                  <span className="detail-row__value">
                    {dimensions.w}×{dimensions.h}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {warnings.length > 0 && status === 'ready' && (
            <Card>
              <ul className="stack" style={{ margin: 0, paddingLeft: '1.1rem' }}>
                {warnings.map((warning) => (
                  <li key={warning} className="card__subtitle">
                    {warning}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {status === 'analyzing' ? (
            <Card
              variant="status"
              title={`Analyzing… ${progress}%`}
              subtitle="Detecting pose, counting reps, and scoring your set on-device."
            >
              <div
                className="confidence__bar"
                style={{ marginTop: 'var(--space-md)' }}
              >
                <div
                  className="confidence__fill confidence__fill--high"
                  style={{ width: `${progress}%` }}
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
              <div
                className="btn-group btn-group--row"
                style={{ marginTop: 'var(--space-md)' }}
              >
                <Button variant="ghost" onClick={handleCancelAnalysis}>
                  Cancel analysis
                </Button>
              </div>
            </Card>
          ) : (
            <div className="camera-actions">
              <div className="btn-group btn-group--row">
                <Button
                  variant="primary"
                  onClick={handleAnalyze}
                  disabled={isModelLoading}
                >
                  {isModelLoading ? 'Preparing model…' : 'Analyze squat'}
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
