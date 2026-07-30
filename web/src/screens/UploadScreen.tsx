import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { ProtocolId } from '../core/protocol'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { DisclaimerBanner } from '../components/DisclaimerBanner'
import { DEFAULT_ANALYSIS_FPS, runVideoAnalysis } from '../analysis/videoAnalyzer'
import { analyzeFramesForProtocol } from '../analysis/analyzeProtocol'
import { poseEngine } from '../cv/poseEngine'
import { createTape, deserializeTape, type PoseTape } from '../eval/poseTape'
import { storeSessionTape } from '../eval/tapeStore'
import {
  disposeVideo,
  isLikelySupportedVideo,
  loadVideoFile,
  seekVideo,
  type LoadedVideo,
} from '../cv/videoFrameSource'
import { getProtocol } from '../protocols/registry'
import { getProtocolRuntime } from '../protocols/runtime'
import { buildProtocolPackage } from '../protocols/packageRegistry'
import { releaseGuidance, releaseLabel } from '../protocols/package'

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
  { label: 'Report', at: 92 },
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
  const location = useLocation()
  // Selected protocol from route state (M43); squat stays the default.
  const selectedProtocolId: ProtocolId =
    (location.state as { protocolId?: ProtocolId } | null)?.protocolId ??
    'squat'
  // Setup guidance belongs to the SELECTED protocol. Reading squat's capture
  // contract here would tell someone recording a side-view lunge to face the
  // camera square-on.
  const definition = getProtocol(selectedProtocolId).definition
  const capture = definition.capture
  const runtime = getProtocolRuntime(selectedProtocolId)
  const pkg = buildProtocolPackage(definition, {
    hasRuntime: true,
    version: '1.0.0',
  })
  /** Stored pose tapes are a real input path when the protocol declares it. */
  const acceptsTape = capture.inputModes.includes('replay')
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const loadedRef = useRef<LoadedVideo | null>(null)
  const tapeRef = useRef<PoseTape | null>(null)
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
  const [frameCount, setFrameCount] = useState<number | null>(null)
  // Capture parameters the protocol declares (forward lunge: lead leg).
  const [parameters, setParameters] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      (capture.parameters ?? []).map((parameter) => [parameter.id, parameter.defaultValue]),
    ),
  )

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
    tapeRef.current = null
    setPreviewUrl(null)
    setProgress(0)
    setFrameCount(null)
  }, [])

  const isTapeFile = useCallback(
    (file: File) =>
      acceptsTape &&
      (file.type === 'application/json' || file.name.toLowerCase().endsWith('.json')),
    [acceptsTape],
  )

  const processFile = useCallback(
    async (file: File) => {
      resetLoadedVideo()
      setError(null)
      setWarnings([])

      if (isTapeFile(file)) {
        setFileName(file.name)
        setStatus('loading')
        try {
          const tape = deserializeTape(await file.text())
          if (tape.frames.length === 0) {
            throw new Error('This pose tape contains no tracked frames.')
          }
          tapeRef.current = tape
          setFrameCount(tape.frames.length)
          setDurationSeconds(
            tape.meta.fps > 0 ? tape.frames.length / tape.meta.fps : null,
          )
          setDimensions(null)
          setWarnings([
            'Pose-tape input: this replays landmarks recorded earlier instead of tracking a new video. It is the deterministic path, not a real-world capture.',
          ])
          setStatus('ready')
        } catch (err: unknown) {
          setError(
            err instanceof Error
              ? `Could not read this pose tape: ${err.message}`
              : 'Could not read this pose tape.',
          )
          setStatus('error')
        }
        return
      }

      if (!isLikelySupportedVideo(file)) {
        setError(
          acceptsTape
            ? 'Unsupported file. Please choose an MP4, MOV, or WebM video, or a recorded pose tape (.json).'
            : 'Unsupported file. Please choose an MP4, MOV, or WebM video.',
        )
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
    [resetLoadedVideo, isTapeFile, acceptsTape],
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
    const tape = tapeRef.current
    if (!loaded && !tape) return

    setError(null)
    setProgress(0)
    setStatus('analyzing')

    // Pose-tape replay needs no model and no seeking: the landmarks already
    // exist, so the protocol runtime consumes them directly.
    if (tape) {
      try {
        setProgress(50)
        storeSessionTape(tape)
        const { result } = analyzeFramesForProtocol(selectedProtocolId, tape.frames, {
          capture: {
            captureSource: 'replay',
            filterVariant: tape.meta.filtering ?? 'raw',
          },
          parameters,
          captureId: fileName ?? 'pose-tape',
          // A tape that declares its own observation protocol is checked
          // against the selected one instead of being reinterpreted.
          observationProtocolId: tape.meta.protocolId,
        })
        setProgress(100)
        navigate('/results', { state: { result } })
      } catch (err: unknown) {
        console.error('Error analyzing pose tape:', err)
        setError(
          err instanceof Error
            ? err.message
            : 'Something went wrong while analyzing this pose tape.',
        )
        setStatus('error')
      }
      return
    }
    if (!loaded) return

    try {
      // Ensure the model is ready (mount-time init may still be in flight).
      await poseEngine.initialize()

      const controller = new AbortController()
      abortRef.current = controller

      const result = await runVideoAnalysis({
        durationSeconds: loaded.durationSeconds,
        // Zero-phase Butterworth filtering is the default for the offline path.
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
          `No person detected in this video. ${capture.viewInstruction} Use good lighting.`,
        )
        setStatus('error')
        return
      }

      // Keep the raw (pre-filter) frames as a replayable pose tape so the
      // results screen can offer it for download (validation dataset capture).
      storeSessionTape(
        createTape(
          result.rawFrames,
          {
            fps: DEFAULT_ANALYSIS_FPS,
            label: fileName ?? undefined,
            source: 'upload',
            recordedAt: new Date().toISOString(),
            filtering: 'butterworth-offline',
          },
          {
            countedReps: result.reps.length,
            rejections: result.repRejections,
          },
        ),
      )

      // A protocol with its own segmentation engine consumes the raw detected
      // frames, so its provenance says 'raw' — the Butterworth pass above feeds
      // the cyclic rep pipeline only, and claiming it here would be false.
      const sessionResult = runtime.analyzeSession
        ? runtime.analyzeSession({
            frames: result.rawFrames,
            capture: { captureSource: 'upload', filterVariant: 'raw' },
            parameters,
            captureId: fileName ?? 'uploaded-video',
          })
        : getProtocolRuntime(selectedProtocolId).buildSessionResult!({
            reps: result.reps,
            poseConfidenceSamples: result.poseConfidenceSamples,
            postureSamples: result.postureSamples,
            repRejections: result.repRejections,
            capture: { captureSource: 'upload', filterVariant: 'butterworth-offline' },
          })
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
  }, [navigate, fileName, selectedProtocolId, runtime, parameters, capture.viewInstruction])

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
        <h1 className="page-title">Analyze a {definition.label.toLowerCase()} recording</h1>
        <p className="protocol-card__status protocol-card__status--available">
          {releaseLabel(pkg)}
        </p>
        <DisclaimerBanner />
      </header>

      <section className="results-panel" aria-label="Camera setup">
        <h2 className="results-panel__heading">
          {capture.cameraView === 'side' ? 'Side-camera setup' : 'Camera setup'}
        </h2>
        <p className="results-panel__intro">{capture.viewInstruction}</p>
        <ul className="results-abstain__reasons">
          {capture.setupInstructions.map((instruction) => (
            <li key={instruction} className="results-abstain__reason">
              {instruction}
            </li>
          ))}
        </ul>
        {/* Athlete-facing wording only — releaseDetail names registry
            resources and belongs in evidence records, not here. */}
        <p className="results-panel__intro">{releaseGuidance(pkg)}</p>
      </section>

      {(capture.parameters ?? []).map((parameter) => (
        <fieldset key={parameter.id} className="results-panel" aria-label={parameter.label}>
          <legend className="results-panel__heading">{parameter.label}</legend>
          <p className="results-panel__intro">{parameter.description}</p>
          <div className="btn-group btn-group--row">
            {parameter.options.map((option) => (
              <label key={option.value} className="stat-pill">
                <input
                  type="radio"
                  name={parameter.id}
                  value={option.value}
                  checked={parameters[parameter.id] === option.value}
                  onChange={() =>
                    setParameters((current) => ({ ...current, [parameter.id]: option.value }))
                  }
                />
                <span className="stat-pill__value">{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}

      <input
        ref={fileInputRef}
        type="file"
        accept={
          acceptsTape
            ? 'video/mp4,video/webm,video/quicktime,video/*,application/json,.json'
            : 'video/mp4,video/webm,video/quicktime,video/*'
        }
        onChange={handleFileChange}
        className="upload-file-input"
      />

      {status === 'error' && error && (
        <Card>
          <h2 className="card__title card__title--plain">
            Couldn’t analyze this recording
          </h2>
          <p className="card__subtitle">{error}</p>
          <div className="btn-group btn-group--row card__footer-actions">
            <Button variant="primary" onClick={handleChooseAnother}>
              Choose another recording
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
          <span className="upload-drop__title">Drop a recording here</span>
          <span className="upload-drop__sub">
            {acceptsTape
              ? 'or tap to choose an MP4, MOV, WebM, or a recorded pose tape (.json)'
              : 'or tap to choose an MP4, MOV, or WebM'}
          </span>
          <span className="upload-drop__meta">
            One continuous set. {capture.viewInstruction}{' '}
            Everything stays on this device — nothing is uploaded.
          </span>
        </button>
      )}

      {status === 'loading' && (
        <Card
          variant="status"
          title="Reading recording…"
          subtitle={fileName ?? 'Loading file details.'}
        />
      )}

      {(status === 'ready' || status === 'analyzing') &&
        (previewUrl !== null || frameCount !== null) && (
        <div className="stack-lg">
          <div className="upload-preview-panel">
            {previewUrl !== null && (
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
            )}
            <div className="stat-pills">
              {frameCount !== null && (
                <div className="stat-pill">
                  <span className="stat-pill__label">Tracked frames</span>
                  <span className="stat-pill__value">{frameCount}</span>
                </div>
              )}
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
                reps, and reading this set&apos;s movement.
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
                  // A pose tape needs no tracking model, so it is never blocked
                  // on the model warm-up.
                  disabled={isModelLoading && frameCount === null}
                >
                  {isModelLoading && frameCount === null
                    ? 'Preparing model…'
                    : 'Analyze movement'}
                </Button>
                <Button variant="ghost" onClick={handleChooseAnother}>
                  Choose another
                </Button>
              </div>
              <p className="camera-actions__hint">
                {capture.viewInstruction} {capture.setupInstructions[2]}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
