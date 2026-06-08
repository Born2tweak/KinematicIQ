import { Button } from '../components/Button'
import { Card } from '../components/Card'

const features = [
  {
    icon: '📷',
    title: 'Capture',
    text: 'Record your movement with the camera to collect pose data for analysis.',
  },
  {
    icon: '⚡',
    title: 'Analyze',
    text: 'On-device biomechanics processing evaluates form, symmetry, and quality.',
  },
  {
    icon: '📊',
    title: 'Review Results',
    text: 'View scores, confidence levels, and actionable insights from your session.',
  },
] as const

export function LandingScreen() {
  return (
    <div className="stack-xl">
      <section className="hero">
        <h1 className="hero__title">KinematicIQ</h1>
        <p className="hero__description">
          Biomechanics made simple. From Camera to understanding your movement. 
        </p>
        <div className="hero__actions">
          <Button to="/camera" variant="primary">
            Start Camera
          </Button>
          <Button to="/upload" variant="secondary">
            Analyze Video
          </Button>
          <Button to="/results" variant="ghost">
            View Results
          </Button>
        </div>
      </section>

      <section className="grid-features" aria-label="How it works">
        {features.map((feature) => (
          <Card key={feature.title}>
            <div className="feature-card__icon" aria-hidden>
              {feature.icon}
            </div>
            <h3 className="feature-card__title">{feature.title}</h3>
            <p className="feature-card__text">{feature.text}</p>
          </Card>
        ))}
      </section>
    </div>
  )
}
