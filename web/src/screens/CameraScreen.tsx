import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { buildSessionResult } from '../session/buildSessionResult'
import { Button } from '../components/Button'
import { DisclaimerBanner } from '../components/DisclaimerBanner'
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
import { createLiveStreamFilter } from '../cv/landmarkFilter'
import {
  createTape,
  createTapeRecorder,
  estimateFps,
  type PoseTapeEntryState,
} from '../eval/poseTape'
import { storeSessionTape } from '../eval/tapeStore'
import { createEmptyPose3DRef, hipCenter } from '../cv/pose3d'
import {
  LANDMARK_INDICES,
  type PoseFrame,
} from '../cv/types'
import { checkCalibration } from '../cv/drawCalibration'
import {
  drawCaptureStateBorder,
  type CaptureGuidance,
} from '../cv/captureGuidance'
import {
  assessCaptureReadiness,
  type CaptureReadinessAssessment,
} from '../cv/captureReadiness'
import { drawDebugOverlay, type DebugOverlayData } from '../cv/drawDebugOverlay'
import { DepthSparkline } from '../components/DepthSparkline'
import { useAnalystMode } from '../hooks/useAnalystMode'
import {
  extractPostureFrame,
  type PostureFrameSample,
} from '../analysis/posture/postureFrame'
import {
  type CameraSessionPhase,
  getSessionStatusCopy,
} from './cameraSessionUi'
import {
  lastRealRejectionReason,
  nextRepFeedbackHud,
  realRejections,
} from './repRejectionUi'

// Lazy: keeps three.js/@react-three/fiber out of the main bundle until toggled on.
const PoseScene3D = lazy(() => import('../components/PoseScene3D'))

const FRONT_CAMERA_MIRROR = false
const HIP_TRAIL_MAX_SAMPLES = 90
const DEPTH_HISTORY_MAX_SAMPLES = 300

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
  const postureSamplesRef = useRef<PostureFrameSample[]>([])
  const isFinishingRef = useRef(false)
  const streamRef = useRef<MediaStream | null>(null)
  const liveFilterRef = useRef(createLiveStreamFilter())
  const pose3DRef = useRef(createEmptyPose3DRef())
  const tapeRecorderRef = useRef(createTapeRecorder())
  /** Pipeline entry state at set activation — tape replay parity (finding #7). */
  const tapeEntryStateRef = useRef<PoseTapeEntryState | null>(null)
  /** Index into the tape where the analysis FSM began (preroll before it). */
  const tapeAnalysisStartRef = useRef<number | null>(null)

  const [error, setError] = useState<string | null>(null)
  const [cameraAttempt, setCameraAttempt] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isModelLoading, setIsModelLoading] = useState(true)
  const [missingJoints, setMissingJoints] = useState<string[]>(['Full Body'])
  const [autoStartPhase, setAutoStartPhase] =
    useState<CameraSessionPhase>('WAITING')
  const [repCount, setRepCount] = useState(0)
  /** Mirrors `repCount` synchronously for canvas debug HUD (avoids stale closures). */
  const repCountDisplayRef = useRef(0)
  const repFeedbackSyncRef = useRef({
    rejectionCount: 0,
    lastMissedReason: null as string | null,
  })
  const [repFeedback, setRepFeedback] = useState<string | null>(null)
  const [calibrationProgress, setCalibrationProgress] = useState(0)
  const [autoFinishPending, setAutoFinishPending] = useState(false)
  const [finishCountdown, setFinishCountdown] = useState<number | null>(null)
  const [isFinishing, setIsFinishing] = useState(false)
  const [showDebug, setShowDebug] = useState(false)
  const [show3D, setShow3D] = useState(false)
  const [expand3D, setExpand3D] = useState(false)
  const [guidance, setGuidance] = useState<CaptureGuidance | null>(null)
  const [readiness, setReadiness] = useState<CaptureReadinessAssessment | null>(
    null,
  )
  const [isAnalyst, toggleAnalyst] = useAnalystMode()
  const isAnalystRef = useRef(isAnalyst)
  isAnalystRef.current = isAnalyst
  const repFeedbackMessageRef = useRef<string | null>(null)

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
      postureSamplesRef.current,
      repCounterRef.current.rejections,
    )

    // Preserve the raw session as a replayable pose tape (same substrate as
    // the upload path) so live sets feed the validation dataset directly.
    const recorder = tapeRecorderRef.current
    if (recorder.count > 0) {
      const frames = recorder.build({ fps: 0 }).frames
      storeSessionTape(
        createTape(
          frames,
          {
            fps: estimateFps(frames),
            label: 'live-session',
            source: 'live',
            recordedAt: new Date().toISOString(),
            filtering: 'one-euro-live',
            entryState: tapeEntryStateRef.current ?? undefined,
            analysisStartFrameIndex: tapeAnalysisStartRef.current ?? 0,
          },
          {
            countedReps: reps.length,
            rejections: repCounterRef.current.rejections,
          },
        ),
      )
    }
    recorder.reset()
    tapeEntryStateRef.current = null
    tapeAnalysisStartRef.current = null

    autoStartRef.current = createAutoStartState()
    autoFinishRef.current = createAutoFinishState()
    phaseDetectorRef.current = createFreshAnalysisPipeline().phaseDetector
    repCounterRef.current = createFreshAnalysisPipeline().repCounter
    liveFilterRef.current.reset()
    poseConfidenceSamplesRef.current = []
    postureSamplesRef.current = []
    setAutoStartPhase('WAITING')
    setCalibrationProgress(0)
    setRepCount(0)
    repCountDisplayRef.current = 0
    repFeedbackSyncRef.current = { rejectionCount: 0, lastMissedReason: null }
    repFeedbackMessageRef.current = null
    setRepFeedback(null)
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

      if (repResult.repCount !== repCountDisplayRef.current) {
        repCountDisplayRef.current = repResult.repCount
      }
      setRepCount((prev) =>
        prev === repResult.repCount ? prev : repResult.repCount,
      )

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
        const rawFrame = poseEngine.detect(video, timestamp, frameIndex)
        // Smooth landmark jitter in real time (One-Euro) before any analysis.
        const poseFrame = rawFrame ? liveFilterRef.current.filter(rawFrame) : null
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

            // Hand off to the 3D overlay via a mutable ref (no React re-render).
            // Written unconditionally and cheaply so toggling `show3D` never
            // depends on this loop's effect deps.
            const pose3D = pose3DRef.current
            pose3D.worldLandmarks = poseFrame.worldLandmarks
            pose3D.angles = angles
            pose3D.timestamp = poseFrame.timestamp
            pose3D.poseConfidence = poseFrame.poseConfidence
            if (poseFrame.worldLandmarks.length > 0) {
              pose3D.hipTrail.push(hipCenter(poseFrame.worldLandmarks))
              if (pose3D.hipTrail.length > HIP_TRAIL_MAX_SAMPLES) {
                pose3D.hipTrail.shift()
              }
            }
            if (hipY !== null) {
              pose3D.depthHistory.push({ t: poseFrame.timestamp, y: hipY })
              if (pose3D.depthHistory.length > DEPTH_HISTORY_MAX_SAMPLES) {
                pose3D.depthHistory.shift()
              }
            }

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
              liveFilterRef.current.reset()
              // Tape from READY onward: the preroll before activation warms
              // the One-Euro filter exactly as live replay needs (finding #7).
              tapeRecorderRef.current.reset()
              tapeAnalysisStartRef.current = null
              pose3DRef.current.hipTrail = []
              pose3DRef.current.depthHistory = []
              phaseDetectorRef.current = fresh.phaseDetector
              repCounterRef.current = fresh.repCounter
              autoFinishRef.current = createAutoFinishState()
              setAutoFinishPending(false)
              setFinishCountdown(null)
              setRepCount(0)
              repCountDisplayRef.current = 0
              repFeedbackSyncRef.current = {
                rejectionCount: 0,
                lastMissedReason: null,
              }
              repFeedbackMessageRef.current = null
              setRepFeedback(null)
            }

            if (autoResult.transitioned && autoResult.phase === 'ACTIVE') {
              // Snapshot the entry state BEFORE re-seeding the pipeline so
              // the tape can replay this session exactly (finding #7).
              tapeEntryStateRef.current = {
                calibratedHipY: autoStartRef.current.calibratedHipY,
                standingKneeAngle: phaseDetectorRef.current.standingKneeAngle,
                activatedByDescent: autoResult.activatedByDescent,
              }
              autoFinishRef.current = createAutoFinishState()
              setAutoFinishPending(false)
              setFinishCountdown(null)
              poseConfidenceSamplesRef.current = []
              postureSamplesRef.current = []
              // Frames recorded so far are calibration preroll; the frame
              // recorded later this pass is the activation frame.
              tapeAnalysisStartRef.current = tapeRecorderRef.current.count

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
              repCountDisplayRef.current = 0
              repFeedbackSyncRef.current = {
                rejectionCount: 0,
                lastMissedReason: null,
              }
              repFeedbackMessageRef.current = null
              setRepFeedback(null)
            }

            if (autoResult.phase === 'ACTIVE' && poseFrame) {
              poseConfidenceSamplesRef.current.push(poseFrame.poseConfidence)
              const postureSample = extractPostureFrame(poseFrame)
              if (postureSample) {
                postureSamplesRef.current.push(postureSample)
              }
            }

            // Tape the RAW frame (pre One-Euro) — the tape substrate is
            // always exactly what MediaPipe produced. Recording spans READY
            // (calibration preroll, warms the replay filter) through ACTIVE.
            // The READY-transition frame itself is skipped: it was filtered
            // BEFORE the filter reset above, so taping from the next frame
            // keeps replay's fresh filter bit-identical with live.
            const tapeThisFrame =
              (autoResult.phase === 'READY' && !autoResult.transitioned) ||
              autoResult.phase === 'ACTIVE'
            if (tapeThisFrame && rawFrame) {
              tapeRecorderRef.current.record(rawFrame)
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

            // Phantom (zero-descent) candidates never reach the coach-facing
            // HUD — only real rep attempts count as rejections there.
            const realRejectionCount = realRejections(rcState.rejections).length

            const feedbackSync = repFeedbackSyncRef.current
            const feedbackResult = nextRepFeedbackHud({
              phase: autoResult.phase,
              isAnalyst: isAnalystRef.current,
              lastMissedReason: lastRealRejectionReason(rcState.rejections),
              rejectionCount: realRejectionCount,
              completedRepThisFrame,
              previousRejectionCount: feedbackSync.rejectionCount,
              previousMissedReason: feedbackSync.lastMissedReason,
            })
            repFeedbackSyncRef.current = {
              rejectionCount: feedbackResult.rejectionCount,
              lastMissedReason: feedbackResult.lastMissedReason,
            }
            if (feedbackResult.message !== repFeedbackMessageRef.current) {
              repFeedbackMessageRef.current = feedbackResult.message
              setRepFeedback(feedbackResult.message)
            }

            const debugData: DebugOverlayData = {
              autoStartPhase: autoResult.phase,
              squatPhase: pdState.phase,
              emaKneeAngle: smoothedKnee,
              leftKneeAngle: angles.leftKnee,
              rightKneeAngle: angles.rightKnee,
              hipY,
              hipDrop: currentHipDrop,
              repCount: rcState.repCount,
              repCountDisplayed: repCountDisplayRef.current,
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
              rejectionCount: realRejectionCount,
              hudLeftReservePx: Math.round(canvas.height * 0.28),
            }
            if (showDebug) {
              drawDebugOverlay(ctx, debugData, canvas.width, canvas.height)
            }

            frameIndex++
          } else {
            clearSkeleton(ctx, canvas.width, canvas.height)
          }

          if (setupPhase) {
            const nextReadiness = assessCaptureReadiness(poseFrame)
            const nextGuidance = nextReadiness.guidance
            drawCaptureStateBorder(
              ctx,
              nextGuidance.ok,
              canvas.width,
              canvas.height,
            )
            setGuidance((prev) =>
              prev?.instruction === nextGuidance.instruction &&
              prev?.ok === nextGuidance.ok
                ? prev
                : nextGuidance,
            )
            setReadiness((prev) => {
              const sameState = prev?.state === nextReadiness.state
              const sameChecklist =
                prev !== null &&
                prev.checklist.length === nextReadiness.checklist.length &&
                prev.checklist.every(
                  (item, i) => item.ok === nextReadiness.checklist[i].ok,
                )
              return sameState && sameChecklist ? prev : nextReadiness
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
    guidance,
    readinessState: readiness?.state ?? null,
  })

  const showReadinessChecklist =
    displayPhase === 'WAITING' && readiness !== null

  const stageLayoutClass = [
    'camera-stage',
    isAnalyst && 'camera-stage--analyst',
    isAnalyst && show3D && 'camera-stage--analyst-3d',
    isAnalyst && show3D && expand3D && 'camera-stage--analyst-3d-expanded',
    isAnalyst && showDebug && 'camera-stage--analyst-debug',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={stageLayoutClass}>
      <video
        ref={videoRef}
        className={`camera-stage__media${FRONT_CAMERA_MIRROR ? ' camera-stage__media--mirror' : ''}`}
        autoPlay
        playsInline
        muted
        onLoadedMetadata={handleLoadedMetadata}
      />
      <SkeletonOverlay ref={canvasRef} />
      <div className="camera-stage__vignette" aria-hidden />

      {error ? (
        <div className="camera-stage__notice" role="alert">
          <div className="camera-stage__notice-panel">
            <h2 className="camera-stage__notice-title">Camera error</h2>
            <p className="camera-stage__notice-text">{error}</p>
            <div className="btn-group btn-group--row">
              <Button
                variant="secondary"
                onClick={() => setCameraAttempt((n) => n + 1)}
              >
                Try again
              </Button>
              <Button variant="ghost" onClick={handleCancel}>
                Back to home
              </Button>
            </div>
          </div>
        </div>
      ) : isModelLoading || isLoading ? (
        <div className="camera-stage__notice">
          <div className="camera-stage__notice-panel">
            <h2 className="camera-stage__notice-title">
              {isModelLoading ? 'Preparing movement model…' : 'Starting camera…'}
            </h2>
            <p className="camera-stage__notice-text">
              {isModelLoading
                ? 'Loading the on-device tracking model — nothing leaves this device.'
                : 'Allow camera access in your browser to begin.'}
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="camera-hud--top-left">
            <SessionStatusCard
              compact
              phase={displayPhase}
              title={statusCopy.title}
              subtitle={statusCopy.subtitle}
              calibrationProgress={calibrationProgress}
              missingJoints={missingJoints}
              repFeedback={repFeedback}
            />
            {showReadinessChecklist && readiness && (
              <div
                className={`capture-readiness capture-readiness--${readiness.state}`}
                aria-live="polite"
              >
                <p className="capture-readiness__heading">
                  {readiness.state === 'ready'
                    ? 'Ready to record'
                    : readiness.state === 'marginal'
                      ? 'Almost ready'
                      : 'Get set up'}
                </p>
                <ul className="capture-readiness__list">
                  {readiness.checklist.map((item) => (
                    <li
                      key={item.id}
                      className={`capture-readiness__item${item.ok ? ' capture-readiness__item--ok' : ''}`}
                    >
                      <span aria-hidden className="capture-readiness__mark">
                        {item.ok ? '✓' : '○'}
                      </span>
                      {item.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <RepCounter
            repCount={repCount}
            isAnalyzing={autoStartPhase === 'ACTIVE'}
          />

          {finishCountdown !== null && autoStartPhase === 'ACTIVE' && (
            <div className="camera-finish-countdown" aria-live="polite">
              <p className="camera-finish-countdown__text">
                Finishing in {finishCountdown}…
              </p>
            </div>
          )}

          <div className="camera-hud--tools">
            <button
              type="button"
              className={`hud-tool${isAnalyst ? ' hud-tool--on' : ''}`}
              onClick={toggleAnalyst}
              aria-pressed={isAnalyst}
              title="Analyst mode reveals the 3D pose view and debug tools"
            >
              Analyst
            </button>
            {isAnalyst && (
              <button
                type="button"
                className={`hud-tool${show3D ? ' hud-tool--on' : ''}`}
                onClick={() => setShow3D((prev) => !prev)}
                aria-pressed={show3D}
                aria-label={show3D ? 'Hide live 3D pose view' : 'Show live 3D pose view'}
                title="Live 3D pose view"
              >
                3D
              </button>
            )}
            {isAnalyst && (
              <button
                type="button"
                className={`hud-tool${showDebug ? ' hud-tool--on' : ''}`}
                onClick={() => setShowDebug((prev) => !prev)}
                aria-pressed={showDebug}
                aria-label={
                  showDebug
                    ? 'Hide developer debug overlay'
                    : 'Show developer debug overlay'
                }
                title="Developer debug overlay"
              >
                DBG
              </button>
            )}
          </div>

          {isAnalyst && show3D && (
            <div
              className={`camera-3d-panel${expand3D ? ' camera-3d-panel--expanded' : ''}`}
            >
              <button
                type="button"
                className="camera-3d-expand"
                onClick={() => setExpand3D((prev) => !prev)}
                aria-pressed={expand3D}
                title={
                  expand3D
                    ? 'Collapse the 3D inspection view'
                    : 'Expand the 3D view for inspection'
                }
              >
                {expand3D ? 'Collapse' : 'Expand'}
              </button>
              <Suspense fallback={null}>
                <PoseScene3D poseRef={pose3DRef} mirror={FRONT_CAMERA_MIRROR} />
              </Suspense>
              <DepthSparkline dataRef={pose3DRef} />
            </div>
          )}

          <div className="camera-hud--bottom">
            <div className="camera-action-bar">
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
            {displayPhase !== 'ACTIVE' && <DisclaimerBanner />}
          </div>
        </>
      )}
    </div>
  )
}
