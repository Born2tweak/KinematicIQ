import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { poseEngine } from '../cv/poseEngine'

export function CameraScreen() {
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isModelLoading, setIsModelLoading] = useState(true)

  // Initialize MediaPipe Pose Model on mount
  useEffect(() => {
    async function initModel() {
      setIsModelLoading(true)
      try {
        await poseEngine.initialize()
      } catch (err: any) {
        console.error('Error initializing Pose Engine:', err)
        setError('Failed to load the tracking model. Please check your internet connection and refresh.')
      } finally {
        setIsModelLoading(false)
      }
    }
    initModel()
  }, [])

  // Start webcam feed on mount
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
      } catch (err: any) {
        console.error('Error accessing camera:', err)
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError('Camera permission denied. Please allow camera access in your browser settings to continue.')
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setError('No camera device found. Please connect a webcam and try again.')
        } else {
          setError(`Unable to access camera: ${err.message || 'Unknown error'}`)
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

  // Real-time inference frame loop
  useEffect(() => {
    let animationFrameId: number
    let frameIndex = 0

    function runLoop() {
      if (
        videoRef.current &&
        videoRef.current.readyState >= 2 &&
        poseEngine.getReadyState()
      ) {
        const timestamp = performance.now()
        const poseFrame = poseEngine.detect(videoRef.current, timestamp, frameIndex)
        
        if (poseFrame) {
          console.log(
            `[PoseFrame #${frameIndex}] Confidence: ${(poseFrame.poseConfidence * 100).toFixed(1)}%`,
            poseFrame
          )
          frameIndex++
        }
      }
      animationFrameId = requestAnimationFrame(runLoop)
    }

    if (!isLoading && !isModelLoading && !error) {
      animationFrameId = requestAnimationFrame(runLoop)
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [isLoading, isModelLoading, error])

  // Sync canvas size with video resolution once video metadata is loaded
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
        <Card variant="status" title="Initializing AI Model..." subtitle="Downloading and preparing on-device neural network (WASM)..." />
      ) : isLoading ? (
        <Card variant="status" title="Initializing Camera..." subtitle="Please grant webcam access to start the analysis." />
      ) : (
        <Card variant="status" title="Camera & AI Model Active" subtitle="Position yourself in frame so your full body is visible." />
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
          <div className="stack" style={{ alignItems: 'center', padding: 'var(--space-md)' }}>
            <p className="camera-preview__label" style={{ color: 'var(--color-text-muted)' }}>
              Webcam preview unavailable
            </p>
          </div>
        )}

        {!isLoading && !isModelLoading && !error && (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              onLoadedMetadata={handleLoadedMetadata}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: 'var(--radius-lg)',
              }}
            />
            <canvas
              ref={canvasRef}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                borderRadius: 'var(--radius-lg)',
              }}
            />
          </>
        )}
      </div>

      <div className="btn-group btn-group--row">
        <Button variant="primary" onClick={goToResults} disabled={!!error || isLoading || isModelLoading}>
          Capture (Simulate)
        </Button>
        <Button variant="secondary" onClick={handleCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

