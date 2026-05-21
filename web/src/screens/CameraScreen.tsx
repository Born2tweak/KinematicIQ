import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { RepCounter } from '../components/RepCounter'
import {
  SkeletonOverlay,
  clearSkeleton,
  drawSkeleton,
} from '../components/SkeletonOverlay'
import { getJointAngles } from '../analysis/angles'
import { safeLandmark } from '../analysis/geometry'
import {
  createPhaseDetectorState,
  updatePhaseDetector,
} from '../analysis/phaseDetector'
import {
  createRepCounterState,
  updateRepCounter,
} from '../analysis/repCounter'
import {
  type AutoStartPhase,
  createAutoStartState,
  updateAutoStart,
} from '../analysis/autoStart'
import { poseEngine } from '../cv/poseEngine'
import {
  LANDMARK_INDICES,
  type PoseFrame,
  type RepMetrics,
  type SquatState,
} from '../cv/types'
import { drawCalibrationGuides, checkCalibration } from '../cv/drawCalibration'
import { drawDebugOverlay, type DebugOverlayData } from '../cv/drawDebugOverlay'

export function CameraScreen() {
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const phaseDetectorRef = useRef(createPhaseDetectorState())
  const repCounterRef = useRef(createRepCounterState())
  const autoStartRef = useRef(createAutoStartState())

  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isModelLoading, setIsModelLoading] = useState(true)
  const [missingJoints, setMissingJoints] = useState<string[]>(['Full Body'])
  const [autoStartPhase, setAutoStartPhase] = useState<AutoStartPhase>('WAITING')
  const [currentPhase, setCurrentPhase] = useState<SquatState>('STANDING')
  const [repCount, setRepCount] = useState(0)
  const [completedReps, setCompletedReps] = useState<RepMetrics[]>([])
  /** Calibration progress 0-100 shown during CALIBRATING phase. */
  const [calibrationProgress, setCalibrationProgress] = useState(0)

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

    async function startCamera() {
      setIsLoading(true)
      setError(null)
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
          },
          audio: false,
        })

        activeStream = mediaStream

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
        }
      } catch (err: unknown) {
        console.error('Error accessing camera:', err)
        const error = err as { name?: string; message?: string }
        if (
          error.name === 'NotAllowedError' ||
          error.name === 'PermissionDeniedError'
        ) {
          setError(
            'Camera permission denied. Please allow camera access in your browser settings to continue.',
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
        setIsLoading(false)
      }
    }

    startCamera()

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  const handleCancel = () => navigate('/')

  useEffect(() => {
    let animationFrameId: number
    let frameIndex = 0

    function computeHipY(poseFrame: PoseFrame): number | null {
      const leftHip = safeLandmark(poseFrame, LANDMARK_INDICES.LEFT_HIP)
      const rightHip = safeLandmark(poseFrame, LANDMARK_INDICES.RIGHT_HIP)
      return leftHip && rightHip ? (leftHip.y + rightHip.y) / 2 : null
    }

    /** Returns the smoothed knee angle for the debug overlay. */
    function runAnalysis(
      poseFrame: PoseFrame,
      angles: ReturnType<typeof getJointAngles>,
      hipY: number | null,
    ): number | null {
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

      setCurrentPhase((prev) =>
        prev === phaseResult.phase ? prev : phaseResult.phase,
      )

      const repResult = updateRepCounter(repCounterRef.current, {
        phase: phaseResult.phase,
        transitioned: phaseResult.transitioned,
        frame: poseFrame,
        angles,
      })
      repCounterRef.current = repResult.state

      setRepCount((prev) =>
        prev === repResult.repCount ? prev : repResult.repCount,
      )

      if (repResult.completedRep) {
        setCompletedReps(repResult.reps)
      }

      return phaseResult.smoothedKneeAngle
    }

    function runLoop() {
      const video = videoRef.current
      const canvas = canvasRef.current

      if (video && video.readyState >= 2 && poseEngine.getReadyState() && canvas) {
        const timestamp = performance.now()
        const poseFrame = poseEngine.detect(video, timestamp, frameIndex)

        const ctx = canvas.getContext('2d')
        if (ctx && canvas.width > 0 && canvas.height > 0) {
          let currentMissing: string[] = ['Full Body']

          if (poseFrame) {
            drawSkeleton(ctx, poseFrame.landmarks, canvas.width, canvas.height)

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

            // On transition to ACTIVE, reset analysis pipeline
            if (autoResult.transitioned && autoResult.phase === 'ACTIVE') {
              phaseDetectorRef.current = createPhaseDetectorState()
              repCounterRef.current = createRepCounterState()
              setCurrentPhase('STANDING')
              setRepCount(0)
              setCompletedReps([])
            }

            // Update UI phase
            setAutoStartPhase((prev) =>
              prev === autoResult.phase ? prev : autoResult.phase,
            )

            // Update calibration progress during CALIBRATING phase
            if (autoResult.phase === 'CALIBRATING') {
              const progress = Math.round(
                (autoResult.state.stableFrameCount / 60) * 100,
              )
              setCalibrationProgress((prev) =>
                prev === progress ? prev : progress,
              )
            }

            // Run analysis pipeline when ACTIVE
            let smoothedKnee: number | null =
              phaseDetectorRef.current.emaKneeAngle
            if (autoResult.phase === 'ACTIVE') {
              smoothedKnee = runAnalysis(poseFrame, angles, hipY)
            }

            // ── Debug overlay (always drawn) ─────────────────────
            const debugData: DebugOverlayData = {
              autoStartPhase: autoResult.phase,
              squatPhase: phaseDetectorRef.current.phase,
              emaKneeAngle: smoothedKnee,
              hipY,
              repCount: repCounterRef.current.repCount,
              poseConfidence: poseFrame.poseConfidence,
            }
            drawDebugOverlay(ctx, debugData, canvas.width)

            frameIndex++
          } else {
            clearSkeleton(ctx, canvas.width, canvas.height)
          }

          drawCalibrationGuides(ctx, poseFrame, canvas.width, canvas.height)

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
  }, [isLoading, isModelLoading, error])

  const handleLoadedMetadata = () => {
    if (videoRef.current && canvasRef.current) {
      canvasRef.current.width = videoRef.current.videoWidth
      canvasRef.current.height = videoRef.current.videoHeight
    }
  }

  const handleDone = () => {
    autoStartRef.current = createAutoStartState()
    setAutoStartPhase('WAITING')
    setCalibrationProgress(0)
  }

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
      ) : autoStartPhase === 'ACTIVE' ? (
        <Card
          variant="status"
          title={`Analyzing Set: ${repCount} rep${repCount === 1 ? '' : 's'}`}
          subtitle={`Current phase: ${currentPhase}. Press Done when your set is complete.`}
        />
      ) : autoStartPhase === 'READY' ? (
        <Card
          variant="status"
          title="Ready"
          subtitle="Begin squatting to start the set. Your first descent will start tracking automatically."
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', color: '#22c55e', fontSize: '0.875rem', fontWeight: 600 }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
            Calibrated — start moving when ready
          </div>
        </Card>
      ) : autoStartPhase === 'CALIBRATING' ? (
        <Card
          variant="status"
          title="Calibrating..."
          subtitle="Hold still in an upright standing position."
        >
          <div style={{ marginTop: '12px' }}>
            <div style={{
              height: '4px',
              borderRadius: '2px',
              background: 'rgba(255,255,255,0.1)',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${calibrationProgress}%`,
                background: '#facc15',
                borderRadius: '2px',
                transition: 'width 0.15s ease-out',
              }} />
            </div>
            <p style={{ color: '#facc15', fontSize: '0.75rem', marginTop: '6px', fontWeight: 600 }}>
              {calibrationProgress}% — stay still
            </p>
          </div>
        </Card>
      ) : (
        <Card
          variant="status"
          title="Positioning Body..."
          subtitle={`Step back until your entire body is visible. Missing: ${missingJoints.join(', ')}`}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', color: '#ef4444', fontSize: '0.875rem', fontWeight: 600 }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 8px #ef4444' }} />
            Align shoulders, hips, knees & feet
          </div>
        </Card>
      )}

      <div className="camera-preview" style={{ overflow: 'hidden', padding: 0, position: 'relative' }}>
        {(isLoading || isModelLoading) && !error && (
          <div className="stack" style={{ alignItems: 'center' }}>
            <p className="camera-preview__label">
              {isModelLoading ? 'Loading AI Model...' : 'Loading camera feed...'}
            </p>
          </div>
        )}

        {error && (
          <div
            className="stack"
            style={{ alignItems: 'center', padding: 'var(--space-md)' }}
          >
            <p
              className="camera-preview__label"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Webcam preview unavailable
            </p>
          </div>
        )}

        {!isLoading && !isModelLoading && !error && (
          <div className="camera-preview__stage">
            <RepCounter repCount={repCount} isAnalyzing={autoStartPhase === 'ACTIVE'} />
            <video
              ref={videoRef}
              className="camera-preview__media"
              autoPlay
              playsInline
              muted
              onLoadedMetadata={handleLoadedMetadata}
            />
            <SkeletonOverlay ref={canvasRef} />
          </div>
        )}
      </div>

      <div className="btn-group btn-group--row">
        <Button
          variant="secondary"
          onClick={handleDone}
          disabled={autoStartPhase !== 'ACTIVE'}
        >
          Done
        </Button>
        <Button variant="ghost" onClick={handleCancel}>
          Cancel
        </Button>
      </div>

      {completedReps.length > 0 && (
        <Card
          title="Captured Reps"
          subtitle={`${completedReps.length} completed rep${completedReps.length === 1 ? '' : 's'} recorded in this set.`}
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
