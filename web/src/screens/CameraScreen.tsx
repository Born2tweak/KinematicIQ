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
import { poseEngine } from '../cv/poseEngine'
import {
  LANDMARK_INDICES,
  type PoseFrame,
  type RepMetrics,
  type SquatState,
} from '../cv/types'
import { drawCalibrationGuides, checkCalibration } from '../cv/drawCalibration'

export function CameraScreen() {
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const phaseDetectorRef = useRef(createPhaseDetectorState())
  const repCounterRef = useRef(createRepCounterState())

  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isModelLoading, setIsModelLoading] = useState(true)
  const [isCalibrated, setIsCalibrated] = useState(false)
  const [missingJoints, setMissingJoints] = useState<string[]>(['Full Body'])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [currentPhase, setCurrentPhase] = useState<SquatState>('STANDING')
  const [repCount, setRepCount] = useState(0)
  const [completedReps, setCompletedReps] = useState<RepMetrics[]>([])

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

    function updateAnalysis(poseFrame: PoseFrame) {
      const angles = getJointAngles(poseFrame)
      const kneeAngles = [angles.leftKnee, angles.rightKnee].filter(
        (value): value is number => value !== null,
      )
      const trackingKneeAngle =
        kneeAngles.length === 0
          ? null
          : Math.min(...kneeAngles)
      const leftHip = safeLandmark(poseFrame, LANDMARK_INDICES.LEFT_HIP)
      const rightHip = safeLandmark(poseFrame, LANDMARK_INDICES.RIGHT_HIP)
      const hipY =
        leftHip && rightHip ? (leftHip.y + rightHip.y) / 2 : null

      const phaseResult = updatePhaseDetector(
        phaseDetectorRef.current,
        {
          kneeAngle: trackingKneeAngle,
          hipY,
        },
      )
      phaseDetectorRef.current = phaseResult.state

      setCurrentPhase((previousPhase) =>
        previousPhase === phaseResult.phase ? previousPhase : phaseResult.phase,
      )

      const repResult = updateRepCounter(repCounterRef.current, {
        phase: phaseResult.phase,
        transitioned: phaseResult.transitioned,
        frame: poseFrame,
        angles,
      })
      repCounterRef.current = repResult.state

      setRepCount((previousCount) =>
        previousCount === repResult.repCount ? previousCount : repResult.repCount,
      )

      if (repResult.completedRep) {
        setCompletedReps(repResult.reps)
      }
    }

    function runLoop() {
      const video = videoRef.current
      const canvas = canvasRef.current

      if (video && video.readyState >= 2 && poseEngine.getReadyState() && canvas) {
        const timestamp = performance.now()
        const poseFrame = poseEngine.detect(video, timestamp, frameIndex)

        const ctx = canvas.getContext('2d')
        if (ctx && canvas.width > 0 && canvas.height > 0) {
          let currentCalibrated = false
          let currentMissing: string[] = ['Full Body']

          if (poseFrame) {
            drawSkeleton(ctx, poseFrame.landmarks, canvas.width, canvas.height)
            const calResult = checkCalibration(poseFrame)
            currentCalibrated = calResult.isCalibrated
            currentMissing = calResult.missingJoints

            if (isAnalyzing) {
              updateAnalysis(poseFrame)
            }

            frameIndex++
          } else {
            clearSkeleton(ctx, canvas.width, canvas.height)
          }

          drawCalibrationGuides(ctx, poseFrame, canvas.width, canvas.height)
          setIsCalibrated((prev) => {
            if (prev !== currentCalibrated) return currentCalibrated
            return prev
          })

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
  }, [isLoading, isModelLoading, error, isAnalyzing])

  const handleLoadedMetadata = () => {
    if (videoRef.current && canvasRef.current) {
      canvasRef.current.width = videoRef.current.videoWidth
      canvasRef.current.height = videoRef.current.videoHeight
    }
  }

  const handleBeginSet = () => {
    phaseDetectorRef.current = createPhaseDetectorState()
    repCounterRef.current = createRepCounterState()
    setCurrentPhase('STANDING')
    setRepCount(0)
    setCompletedReps([])
    setIsAnalyzing(true)
  }

  const handleDone = () => {
    setIsAnalyzing(false)
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
      ) : isAnalyzing ? (
        <Card
          variant="status"
          title={`Analyzing Set: ${repCount} rep${repCount === 1 ? '' : 's'}`}
          subtitle={`Current phase: ${currentPhase}. Press Done when your set is complete.`}
        />
      ) : isCalibrated ? (
        <Card
          variant="status"
          title="Calibration Successful"
          subtitle="Tracking is stable. Press Begin Set when you are ready to squat."
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', color: '#22c55e', fontSize: '0.875rem', fontWeight: 600 }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
            Ready to begin a set
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
            <RepCounter repCount={repCount} isAnalyzing={isAnalyzing} />
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
          variant="primary"
          onClick={handleBeginSet}
          disabled={!!error || isLoading || isModelLoading || !isCalibrated || isAnalyzing}
        >
          {isCalibrated ? 'Begin Set' : 'Awaiting Calibration'}
        </Button>
        <Button
          variant="secondary"
          onClick={handleDone}
          disabled={!isAnalyzing}
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
