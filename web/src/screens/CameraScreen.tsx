import { useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card } from '../components/Card'

function CameraIcon() {
  return (
    <svg
      className="camera-preview__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}

export function CameraScreen() {
  const navigate = useNavigate()

  const goToResults = () => navigate('/results')

  return (
    <div className="stack-lg">
      <h1 className="page-title">Camera</h1>

      <Card
        variant="status"
        title="Camera is ready"
        subtitle="Position yourself in frame. Real camera access will be enabled in a future update."
      />

      <div className="camera-preview">
        <CameraIcon />
        <p className="camera-preview__label">Camera Preview</p>
      </div>

      <div className="btn-group btn-group--row">
        <Button variant="primary" onClick={goToResults}>
          Capture
        </Button>
        <Button variant="secondary" onClick={goToResults}>
          Use Sample Image
        </Button>
      </div>
    </div>
  )
}
