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

export function CameraScreen() {
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isModelLoading, setIsModelLoading] = useState(true)

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
          if (poseFrame) {
            drawSkeleton(ctx, poseFrame.landmarks, canvas.width, canvas.height)
            frameIndex++
          } else {
            clearSkeleton(ctx, canvas.width, canvas.height)
          }
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

  const goToResults = () => navigate('/results')
  const handleCancel = () => navigate('/')

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
      ) : (
        <Card
          variant="status"
          title="Camera & AI Model Active"
          subtitle="Position yourself in frame so your full body is visible."
        />
      )}

      <div className="camera-preview" style={{ overflow: 'hidden', padding: 0 }}>
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
          disabled={!!error || isLoading || isModelLoading}
        >
          Capture (Simulate)
        </Button>
        <Button variant="secondary" onClick={handleCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
