import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { buildSessionResult } from '../session/buildSessionResult'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { RepCounter } from '../components/RepCounter'
import { SessionStatusCard } from '../components/SessionStatusCard'
import {
  SkeletonOverlay,
  clearSkeleton,
  drawSkeleton,
} from '../components/SkeletonOverlay'
import { getJointAngles } from '../analysis/angles'
import {
  createAutoFinishState,
  updateAutoFinish,
} from '../analysis/autoFinish'
import { safeLandmark } from '../analysis/geometry'
import {
  standingKneeThreshold,
  updatePhaseDetector,
} from '../analysis/phaseDetector'
import {
  updateRepCounter,
} from '../analysis/repCounter'
import {
  STABLE_FRAMES_REQUIRED,
  createAutoStartState,
  updateAutoStart,
} from '../analysis/autoStart'
import {
  activateAnalysisPipeline,
  createFreshAnalysisPipeline,
} from '../analysis/setActivation'
import { poseEngine } from '../cv/poseEngine'
import {
  LANDMARK_INDICES,
  type PoseFrame,
  type RepMetrics,
} from '../cv/types'
import { drawCalibrationGuides, checkCalibration } from '../cv/drawCalibration'
import { drawDebugOverlay, type DebugOverlayData } from '../cv/drawDebugOverlay'
import {
  type CameraSessionPhase,
  getSessionStatusCopy,
} from './cameraSessionUi'

const FRONT_CAMERA_MIRROR = false

function syncCanvasToVideo(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
): boolean {
  const { videoWidth, videoHeight } = video
  if (videoWidth <= 0 || videoHeight <= 0) {
    return false
  }

  if (canvas.width !== videoWidth || canvas.height !== videoHeight) {
    canvas.width = videoWidth
    canvas.height = videoHeight
  }

  return true
}

export function CameraScreen() {
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const initialPipelineRef = useRef(createFreshAnalysisPipeline())
  const phaseDetectorRef = useRef(initialPipelineRef.current.phaseDetector)
  const repCounterRef = useRef(initialPipelineRef.current.repCounter)
  const autoStartRef = useRef(createAutoStartState())
  const autoFinishRef = useRef(createAutoFinishState())
  const poseConfidenceSamplesRef = useRef<number[]>([])
  const isFinishingRef = useRef(false)
  const streamRef = useRef<MediaStream | null>(null)

  const [error, setError] = useState<string | null>(null)
  const [cameraAttempt, setCameraAttempt] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isModelLoading, setIsModelLoading] = useState(true)
  const [missingJoints, setMissingJoints] = useState<string[]>(['Full Body'])
  const [autoStartPhase, setAutoStartPhase] =
    useState<CameraSessionPhase>('WAITING')
  const [repCount, setRepCount] = useState(0)
  const [completedReps, setCompletedReps] = useState<RepMetrics[]>([])
  const [calibrationProgress, setCalibrationProgress] = useState(0)
  const [autoFinishPending, setAutoFinishPending] = useState(false)
  const [finishCountdown, setFinishCountdown] = useState<number | null>(null)
  const [isFinishing, setIsFinishing] = useState(false)
  const [showDebug, setShowDebug] = useState(false)

  useEffect(() => {
    async function initModel() {
      setIsModelLoading(true)
      try {
        await poseEngine.initialize()
      } catch (err: unknown) {
        console.error('Error initializing Pose Engine:', err)
        setError(
          'Failed to load the tracking model. Please check your internet connection and refresh.',
        )
      } finally {
        setIsModelLoading(false)
      }
    }
    initModel()
  }, [])

  useEffect(() => {
    let activeStream: MediaStream | null = null
    let cancelled = false

    async function attachStreamToVideo(stream: MediaStream): Promise<boolean> {
      const video = videoRef.current
      if (!video) return false

      video.srcObject = stream
      try {
        await video.play()
        return true
      } catch (playErr: unknown) {
        console.error('Error playing camera preview:', playErr)
        return false
      }
    }

    async function startCamera() {
      setIsLoading(true)
      setError(null)
      streamRef.current = null

      if (!navigator.mediaDevices?.getUserMedia) {
        setError(
          'Camera access is not available. Open this site over HTTPS and use a supported browser.',
        )
        setIsLoading(false)
        return
      }

      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
          },
          audio: false,
        })

        if (cancelled) {
          mediaStream.getTracks().forEach((track) => track.stop())
          return
        }

        activeStream = mediaStream
        streamRef.current = mediaStream

        const attached = await attachStreamToVideo(mediaStream)
        if (!attached && !cancelled) {
          setError(
            'Could not start the camera preview. Allow camera access in your browser, then try again.',
          )
        }
      } catch (err: unknown) {
        console.error('Error accessing camera:', err)
        const error = err as { name?: string; message?: string }
        if (
          error.name === 'NotAllowedError' ||
          error.name === 'PermissionDeniedError'
        ) {
          setError(
            'Camera permission denied. Click the camera icon in the address bar, allow access for this site, then press Try again.',
          )
        } else if (
          error.name === 'NotFoundError' ||
          error.name === 'DevicesNotFoundError'
        ) {
          setError(
            'No camera device found. Please connect a webcam and try again.',
          )
        } else {
          setError(`Unable to access camera: ${error.message || 'Unknown error'}`)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    startCamera()

    return () => {
      cancelled = true
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop())
      }
      streamRef.current = null
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
    }
  }, [cameraAttempt])

  useEffect(() => {
    const stream = streamRef.current
    if (!stream || isLoading || error) return

    void (async () => {
      const video = videoRef.current
      if (!video || video.srcObject === stream) return

      video.srcObject = stream
      try {
        await video.play()
      } catch (playErr: unknown) {
        console.error('Error resuming camera preview:', playErr)
      }
    })()
  }, [isLoading, isModelLoading, error])

  useEffect(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || isLoading || isModelLoading || error) {
      return
    }

    const sync = () => {
      if (videoRef.current && canvasRef.current) {
        syncCanvasToVideo(videoRef.current, canvasRef.current)
      }
    }

    sync()
    video.addEventListener('loadedmetadata', sync)
    video.addEventListener('resize', sync)

    return () => {
      video.removeEventListener('loadedmetadata', sync)
      video.removeEventListener('resize', sync)
    }
  }, [isLoading, isModelLoading, error])

  const handleCancel = () => navigate('/')

  const finishSet = useCallback(() => {
    if (isFinishingRef.current) return
    isFinishingRef.current = true
    setIsFinishing(true)

    const reps = repCounterRef.current.reps
    const result = buildSessionResult(
      reps,
      poseConfidenceSamplesRef.current,
    )

    autoStartRef.current = createAutoStartState()
    autoFinishRef.current = createAutoFinishState()
    phaseDetectorRef.current = createFreshAnalysisPipeline().phaseDetector
    repCounterRef.current = createFreshAnalysisPipeline().repCounter
    poseConfidenceSamplesRef.current = []
    setAutoStartPhase('WAITING')
    setCalibrationProgress(0)
    setRepCount(0)
    setCompletedReps([])
    setAutoFinishPending(false)
    setFinishCountdown(null)

    navigate('/results', { state: { result } })
  }, [navigate])

  const finishSetRef = useRef(finishSet)
  finishSetRef.current = finishSet

  useEffect(() => {
    let animationFrameId: number
    let frameIndex = 0

    function computeHipY(poseFrame: PoseFrame): number | null {
      const leftHip = safeLandmark(poseFrame, LANDMARK_INDICES.LEFT_HIP)
      const rightHip = safeLandmark(poseFrame, LANDMARK_INDICES.RIGHT_HIP)
      return leftHip && rightHip ? (leftHip.y + rightHip.y) / 2 : null
    }

    /** Returns the smoothed knee angle and whether a rep completed this frame. */
    function runAnalysis(
      poseFrame: PoseFrame,
      angles: ReturnType<typeof getJointAngles>,
      hipY: number | null,
    ): { smoothedKnee: number | null; completedRep: boolean } {
      const kneeAngles = [angles.leftKnee, angles.rightKnee].filter(
        (value): value is number => value !== null,
      )
      const trackingKneeAngle =
        kneeAngles.length === 0
          ? null
          : Math.min(...kneeAngles)

      const phaseResult = updatePhaseDetector(
        phaseDetectorRef.current,
        { kneeAngle: trackingKneeAngle, hipY, timestamp: poseFrame.timestamp },
      )
      phaseDetectorRef.current = phaseResult.state

      const repResult = updateRepCounter(repCounterRef.current, {
        phase: phaseResult.phase,
        transitioned: phaseResult.transitioned,
        frame: poseFrame,
        angles,
        hipY,
        smoothedKneeAngle: phaseResult.smoothedKneeAngle,
        standingKneeBaseline: phaseDetectorRef.current.standingKneeAngle,
        standingHipY: phaseDetectorRef.current.standingHipY,
      })
      repCounterRef.current = repResult.state

      setRepCount((prev) =>
        prev === repResult.repCount ? prev : repResult.repCount,
      )

      if (repResult.completedRep) {
        console.log(`[CameraScreen] completedRep emitted #${repResult.completedRep.repNumber}, repCount=${repResult.repCount}`)
        setCompletedReps(repResult.reps)
      }

      return { smoothedKnee: phaseResult.smoothedKneeAngle, completedRep: repResult.completedRep !== null }
    }

    function runLoop() {
      const video = videoRef.current
      const canvas = canvasRef.current

      if (video && video.readyState >= 2 && poseEngine.getReadyState() && canvas) {
        if (!syncCanvasToVideo(video, canvas)) {
          animationFrameId = requestAnimationFrame(runLoop)
          return
        }

        const timestamp = performance.now()
        const poseFrame = poseEngine.detect(video, timestamp, frameIndex)
        const overlayMirrored = FRONT_CAMERA_MIRROR
        const setupPhase = autoStartRef.current.phase === 'WAITING'

        const ctx = canvas.getContext('2d')
        if (ctx && canvas.width > 0 && canvas.height > 0) {
          let currentMissing: string[] = ['Full Body']

          if (poseFrame) {
            drawSkeleton(ctx, poseFrame.landmarks, canvas.width, canvas.height, {
              mirrored: overlayMirrored,
            })

            const calResult = checkCalibration(poseFrame)
            currentMissing = calResult.missingJoints

            const angles = getJointAngles(poseFrame)
            const hipY = computeHipY(poseFrame)

            // Drive the auto-start state machine every frame
            const autoResult = updateAutoStart(autoStartRef.current, {
              calibration: calResult,
              angles,
              hipY,
              poseConfidence: poseFrame.poseConfidence,
            })
            autoStartRef.current = autoResult.state

            if (autoResult.transitioned && autoResult.phase === 'READY') {
              const fresh = createFreshAnalysisPipeline()
              phaseDetectorRef.current = fresh.phaseDetector
              repCounterRef.current = fresh.repCounter
              autoFinishRef.current = createAutoFinishState()
              setAutoFinishPending(false)
              setFinishCountdown(null)
              setRepCount(0)
              setCompletedReps([])
            }

            if (autoResult.transitioned && autoResult.phase === 'ACTIVE') {
              autoFinishRef.current = createAutoFinishState()
              setAutoFinishPending(false)
              setFinishCountdown(null)
              poseConfidenceSamplesRef.current = []

              const kneeAngles = [angles.leftKnee, angles.rightKnee].filter(
                (value): value is number => value !== null,
              )
              const trackingKneeAngle =
                kneeAngles.length === 0
                  ? null
                  : Math.min(...kneeAngles)

              if (autoResult.activatedByDescent) {
                const activated = activateAnalysisPipeline({
                  frame: poseFrame,
                  angles,
                  hipY,
                  calibratedHipY: autoStartRef.current.calibratedHipY,
                  trackingKneeAngle,
                  standingKneeAngle:
                    phaseDetectorRef.current.standingKneeAngle,
                })
                phaseDetectorRef.current = activated.phaseDetector
                repCounterRef.current = activated.repCounter
              } else {
                const fresh = createFreshAnalysisPipeline()
                phaseDetectorRef.current = fresh.phaseDetector
                repCounterRef.current = fresh.repCounter
              }
              setRepCount(0)
              setCompletedReps([])
            }

            if (autoResult.phase === 'ACTIVE' && poseFrame) {
              poseConfidenceSamplesRef.current.push(poseFrame.poseConfidence)
            }

            // Update UI phase
            setAutoStartPhase((prev) =>
              prev === autoResult.phase ? prev : autoResult.phase,
            )

            // Update calibration progress during CALIBRATING phase
            if (autoResult.phase === 'CALIBRATING') {
              const progress = Math.round(
                (autoResult.state.stableFrameCount / STABLE_FRAMES_REQUIRED) *
                  100,
              )
              setCalibrationProgress((prev) =>
                prev === progress ? prev : progress,
              )
            }

            // Run analysis pipeline when ACTIVE
            let smoothedKnee: number | null =
              phaseDetectorRef.current.emaKneeAngle
            let completedRepThisFrame = false
            if (
              autoResult.phase === 'ACTIVE' &&
              !isFinishingRef.current
            ) {
              const analysisResult = runAnalysis(poseFrame, angles, hipY)
              smoothedKnee = analysisResult.smoothedKnee
              completedRepThisFrame = analysisResult.completedRep

              const finishResult = updateAutoFinish(autoFinishRef.current, {
                timestamp: poseFrame.timestamp,
                squatPhase: phaseDetectorRef.current.phase,
                kneeAngle: smoothedKnee,
                completedRepCount: repCounterRef.current.repCount,
                isActive: true,
              })
              autoFinishRef.current = finishResult.state
              setAutoFinishPending(finishResult.pending)
              setFinishCountdown(finishResult.countdown)

              if (finishResult.shouldFinish) {
                finishSetRef.current()
              }
            }

            // ── Debug overlay (dev toggle) ─────────────────────
            const startHipY = repCounterRef.current.activeRep?.startHipY ?? null
            const currentHipDrop =
              startHipY !== null && hipY !== null ? hipY - startHipY : null

            const rcState = repCounterRef.current

            const pdState = phaseDetectorRef.current

            const debugData: DebugOverlayData = {
              autoStartPhase: autoResult.phase,
              squatPhase: pdState.phase,
              emaKneeAngle: smoothedKnee,
              leftKneeAngle: angles.leftKnee,
              rightKneeAngle: angles.rightKnee,
              hipY,
              hipDrop: currentHipDrop,
              repCount: rcState.repCount,
              repCountDisplayed: repCount,
              poseConfidence: poseFrame.poseConfidence,
              lastValidation: rcState.lastValidation,
              candidateRepActive: rcState.activeRep !== null,
              reachedBottom: rcState.reachedBottom,
              awaitingStandingCompletion:
                rcState.activeRep !== null &&
                rcState.reachedBottom &&
                rcState.standingCompletionFrames < 4,
              standingFrames: rcState.standingCompletionFrames,
              standingKneeBaseline: pdState.standingKneeAngle,
              lockoutKneeThreshold: standingKneeThreshold(pdState),
              blockingGate: rcState.blockingGate,
              lastMissedRepReason: rcState.lastMissedRepReason,
              completedRepThisFrame,
              previousPhase: rcState.previousPhase,
              seatedLive: rcState.activeRep?.seatedMovementDetected ?? false,
              maxHipDropLive: rcState.activeRep?.maxHipDrop ?? 0,
            }
            if (showDebug) {
              drawDebugOverlay(ctx, debugData, canvas.width)
            }

            frameIndex++
          } else {
            clearSkeleton(ctx, canvas.width, canvas.height)
          }

          if (setupPhase) {
            drawCalibrationGuides(ctx, poseFrame, canvas.width, canvas.height, {
              mirrored: overlayMirrored,
            })
          }

          setMissingJoints((prev) => {
            if (JSON.stringify(prev) !== JSON.stringify(currentMissing)) {
              return currentMissing
            }
            return prev
          })
        }
      }

      animationFrameId = requestAnimationFrame(runLoop)
    }

    if (!isLoading && !isModelLoading && !error) {
      animationFrameId = requestAnimationFrame(runLoop)
    }

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [isLoading, isModelLoading, error, showDebug])

  const handleLoadedMetadata = () => {
    if (videoRef.current && canvasRef.current) {
      syncCanvasToVideo(videoRef.current, canvasRef.current)
    }
  }

  const displayPhase: CameraSessionPhase = isFinishing
    ? 'FINISHED'
    : autoFinishPending
      ? 'AUTO_FINISH_PENDING'
      : autoStartPhase

  const statusCopy = getSessionStatusCopy(displayPhase, {
    repCount,
    finishCountdown,
    missingJoints,
  })

  return (
    <div className="stack-lg">
      <h1 className="page-title">Camera</h1>

      {error ? (
        <Card>
          <h2
            className="card__title"
            style={{
              color: 'var(--color-text)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)',
            }}
          >
            <span
              style={{
                width: '0.5rem',
                height: '0.5rem',
                borderRadius: 'var(--radius-full)',
                background: '#ef4444',
                boxShadow: '0 0 8px #ef4444',
              }}
            />
            Camera Error
          </h2>
          <p className="card__subtitle">{error}</p>
          <div className="btn-group btn-group--row" style={{ marginTop: 'var(--space-md)' }}>
            <Button variant="secondary" onClick={() => setCameraAttempt((n) => n + 1)}>
              Try again
            </Button>
            <Button variant="ghost" onClick={handleCancel}>
              Back to home
            </Button>
          </div>
        </Card>
      ) : isModelLoading ? (
        <Card
          variant="status"
          title="Initializing AI Model..."
          subtitle="Downloading and preparing on-device neural network (WASM)..."
        />
      ) : isLoading ? (
        <Card
          variant="status"
          title="Initializing Camera..."
          subtitle="Please grant webcam access to start the analysis."
        />
      ) : (
        <SessionStatusCard
          phase={displayPhase}
          title={statusCopy.title}
          subtitle={statusCopy.subtitle}
          calibrationProgress={calibrationProgress}
          missingJoints={missingJoints}
        />
      )}

      <div className="camera-preview" style={{ overflow: 'hidden', padding: 0, position: 'relative' }}>
        {(isLoading || isModelLoading) && !error && (
          <div className="stack" style={{ alignItems: 'center' }}>
            <p className="camera-preview__label">
              {isModelLoading ? 'Loading AI Model...' : 'Loading camera feed...'}
            </p>
          </div>
        )}

        <div
          className="camera-preview__stage"
          style={{
            visibility: error ? 'hidden' : 'visible',
          }}
        >
          <video
            ref={videoRef}
            className={`camera-preview__media${FRONT_CAMERA_MIRROR ? ' camera-preview__media--mirror' : ''}`}
            autoPlay
            playsInline
            muted
            onLoadedMetadata={handleLoadedMetadata}
          />
          {!isLoading && !isModelLoading && !error && (
            <>
              <RepCounter repCount={repCount} isAnalyzing={autoStartPhase === 'ACTIVE'} />
              <SkeletonOverlay ref={canvasRef} />
              {finishCountdown !== null && autoStartPhase === 'ACTIVE' && (
                <div className="camera-finish-countdown" aria-live="polite">
                  <p className="camera-finish-countdown__text">
                    Finishing in {finishCountdown}…
                  </p>
                </div>
              )}
              {import.meta.env.DEV && (
                <button
                  type="button"
                  className={`camera-debug-toggle${showDebug ? ' camera-debug-toggle--on' : ''}`}
                  onClick={() => setShowDebug((prev) => !prev)}
                  aria-pressed={showDebug}
                  aria-label={showDebug ? 'Hide developer debug overlay' : 'Show developer debug overlay'}
                  title="Developer debug overlay"
                >
                  {showDebug ? 'DBG' : 'dbg'}
                </button>
              )}
            </>
          )}
        </div>

        {error && (
          <div className="camera-preview__overlay">
            <p className="camera-preview__label">Webcam preview unavailable</p>
          </div>
        )}
      </div>

      <div className="camera-actions">
        <div className="btn-group btn-group--row">
          <Button
            variant="secondary"
            onClick={finishSet}
            disabled={autoStartPhase !== 'ACTIVE' || isFinishing}
          >
            Finish Now
          </Button>
          <Button variant="ghost" onClick={handleCancel}>
            Cancel
          </Button>
        </div>
        <p className="camera-actions__hint">
          Sets usually end when you stand still after your last rep. Use Finish Now if you need to stop early.
        </p>
      </div>

      {completedReps.length > 0 && (
        <Card
          title="Reps so far"
          subtitle={`${completedReps.length} counted in this set`}
        >
          <div className="detail-rows">
            {completedReps.map((rep) => (
              <div key={rep.repNumber} className="detail-row">
                <span className="detail-row__label">Rep {rep.repNumber}</span>
                <span className="detail-row__value">
                  Depth {Math.round(Math.min(rep.minLeftKneeAngle ?? 180, rep.minRightKneeAngle ?? 180))}° ·
                  {' '}
                  Trunk {rep.averageTrunkLean === null ? 'n/a' : `${Math.round(rep.averageTrunkLean)}°`}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
