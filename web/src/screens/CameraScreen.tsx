import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import {
  SkeletonOverlay,
  clearSkeleton,
  drawSkeleton,
} from '../components/SkeletonOverlay'
import { poseEngine } from '../cv/poseEngine'
import { drawCalibrationGuides, checkCalibration } from '../cv/drawCalibration'

export function CameraScreen() {
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isModelLoading, setIsModelLoading] = useState(true)
  
  // Calibration and Capture Validation States (Milestones 5 & 6)
  const [isCalibrated, setIsCalibrated] = useState(false)
  const [missingJoints, setMissingJoints] = useState<string[]>(['Full Body'])
  
  // Auto-Calibration Trigger Countdown State & Ref
  const [countdown, setCountdown] = useState<number | null>(null)
  const calibrationStartTimeRef = useRef<number | null>(null)

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

  const goToResults = () => navigate('/results')
  const handleCancel = () => navigate('/')

  const goToResultsRef = useRef(goToResults)
  useEffect(() => {
    goToResultsRef.current = goToResults
  })

  useEffect(() => {
    let animationFrameId: number
    let frameIndex = 0

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
            frameIndex++
          } else {
            clearSkeleton(ctx, canvas.width, canvas.height)
          }

          // Draw the calibration guidelines on top (Milestone 5)
          drawCalibrationGuides(ctx, poseFrame, canvas.width, canvas.height)

          // Auto-trigger analysis countdown if calibration is stable
          if (currentCalibrated) {
            if (calibrationStartTimeRef.current === null) {
              calibrationStartTimeRef.current = timestamp
            }
            const elapsed = timestamp - calibrationStartTimeRef.current
            const targetSeconds = 3
            const remaining = Math.max(0, targetSeconds - Math.floor(elapsed / 1000))
            
            if (remaining === 0) {
              // Trigger analysis capture automatically
              calibrationStartTimeRef.current = null
              setCountdown(null)
              goToResultsRef.current()
            } else {
              setCountdown(remaining)
            }
          } else {
            calibrationStartTimeRef.current = null
            setCountdown(null)
          }

          // Diff-check state changes to avoid unnecessary React re-renders at 60 FPS
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
  }, [isLoading, isModelLoading, error])

  const handleLoadedMetadata = () => {
    if (videoRef.current && canvasRef.current) {
      canvasRef.current.width = videoRef.current.videoWidth
      canvasRef.current.height = videoRef.current.videoHeight
    }
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
      ) : isCalibrated ? (
        <Card
          variant="status"
          title="Calibration Successful"
          subtitle="All tracking coordinates are locked in. Step back and stay still."
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', color: '#22c55e', fontSize: '0.875rem', fontWeight: 600 }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
            Ready for squat analysis
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
        {countdown !== null && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(4px)',
            borderRadius: 'var(--radius-lg)',
            zIndex: 10,
          }}>
            <div style={{
              fontSize: '6rem',
              fontWeight: 800,
              color: '#22c55e',
              textShadow: '0 0 24px rgba(34, 197, 94, 0.7)',
            }}>
              {countdown}
            </div>
            <p style={{
              fontSize: '1.125rem',
              fontWeight: 600,
              color: 'var(--color-text)',
              marginTop: '12px',
              letterSpacing: '0.05em',
            }}>
              HOLD POSITION...
            </p>
          </div>
        )}

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
          onClick={goToResults}
          disabled={!!error || isLoading || isModelLoading || !isCalibrated}
        >
          {isCalibrated ? 'Start Analysis' : 'Awaiting Calibration'}
        </Button>
        <Button variant="secondary" onClick={handleCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
