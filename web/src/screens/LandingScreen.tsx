import { useState } from 'react'
import { Button } from '../components/Button'
import { LiveSquatDemo } from '../components/landing/LiveSquatDemo'
import { SessionDemoPlayer } from '../components/landing/SessionDemoPlayer'

const PIPELINE_STEPS = [
  {
    title: 'Capture',
    short: 'Any camera',
    text: 'Use your webcam live or upload a recorded video. No sensors, no markers, no special hardware — a laptop or phone camera is the whole setup.',
  },
  {
    title: 'Track',
    short: '33 landmarks',
    text: 'On-device pose estimation locks onto 33 body landmarks every frame. Your video never leaves the browser — nothing is uploaded, ever.',
  },
  {
    title: 'Measure',
    short: 'Joint angles',
    text: 'Knee and hip angles, trunk lean, and left/right symmetry are computed from real geometry on every frame — the same math a motion lab uses, minus the lab.',
  },
  {
    title: 'Detect',
    short: 'Phases & reps',
    text: 'A movement state machine identifies descent, bottom, and ascent, then counts reps — and rejects ones that don\'t qualify, so partial reps never inflate your numbers.',
  },
  {
    title: 'Report',
    short: 'Posture profile',
    text: 'Each set becomes a posture profile with per-area observations — depth, trunk control, knee tracking, consistency, and symmetry — each with the exact measurements and confidence behind it.',
  },
  {
    title: 'Coach',
    short: 'Plain language',
    text: 'Results become coaching: what the camera observed, why it matters biomechanically, and one cue to focus on next set — with an honest confidence level attached.',
  },
] as const

const AUDIENCES = [
  {
    icon: '🩺',
    title: 'Physical therapists',
    text: 'Objective movement baselines and visible progress you can show patients — no motion lab, no extra appointment time.',
  },
  {
    icon: '🦵',
    title: 'Rehab & recovery',
    text: 'Patients watch their own mechanics improve session to session, which keeps home exercise programs honest and motivating.',
  },
  {
    icon: '📋',
    title: 'Coaches & trainers',
    text: 'Screen movement mechanics for an entire roster with nothing but a laptop. Surface asymmetries and deviations from an athlete\'s own pattern — the reads worth a closer look.',
  },
  {
    icon: '🏃',
    title: 'Athletes',
    text: 'Instant, honest feedback on depth, control, and symmetry — every single rep, without booking time with a specialist.',
  },
] as const

const BENEFITS = [
  {
    title: 'Private by design',
    text: 'All analysis runs in your browser. Video is processed on your device and never uploaded — there is no server to send it to.',
  },
  {
    title: 'Zero hardware',
    text: 'No wearables, force plates, or reflective markers. If you have a camera, you have a movement lab.',
  },
  {
    title: 'Transparent analysis',
    text: 'No black box. Every observation shows its evidence, confidence, and the exact angle thresholds it measured against.',
  },
  {
    title: 'Honest about confidence',
    text: 'When the camera view limits what can be measured, the analysis says so — and lowers its confidence instead of guessing.',
  },
] as const

const STATS = [
  { value: '33', label: 'body landmarks tracked per frame' },
  { value: '5', label: 'movement areas observed per set' },
  { value: '0', label: 'videos uploaded — fully on-device' },
  { value: '100%', label: 'browser-based, nothing to install' },
] as const

export function LandingScreen() {
  const [activeStep, setActiveStep] = useState(0)
  const step = PIPELINE_STEPS[activeStep]

  return (
    <div className="landing">
      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-hero__copy">
          <p className="landing-eyebrow">Movement intelligence · in your browser</p>
          <h1 className="landing-hero__title">
            See what your movement is <span className="landing-hero__highlight">telling you</span>
          </h1>
          <p className="landing-hero__lead">
            KinematicIQ turns any camera into a movement-intelligence layer:
            posture-first reads in coaching language — tall chest, even base,
            repeatable depth — with honest confidence on every observation.
            Built for coaches, performance staff, and training professionals.
          </p>
          <div className="landing-hero__actions">
            <Button to="/camera" variant="primary">
              Try live analysis
            </Button>
            <Button to="/upload" variant="secondary">
              Analyze a video
            </Button>
          </div>
          <ul className="landing-hero__trust">
            <li>No hardware</li>
            <li>No installs</li>
            <li>No video ever leaves your device</li>
          </ul>
        </div>
        <div className="landing-hero__demo">
          <LiveSquatDemo />
        </div>
      </section>

      {/* Stats band */}
      <section className="landing-stats" aria-label="Product facts">
        {STATS.map((stat) => (
          <div key={stat.label} className="landing-stat">
            <span className="landing-stat__value">{stat.value}</span>
            <span className="landing-stat__label">{stat.label}</span>
          </div>
        ))}
      </section>

      {/* Demo video */}
      <section className="landing-section" id="demo">
        <p className="landing-eyebrow">Product demo</p>
        <h2 className="landing-section__title">Watch a full session, start to report</h2>
        <p className="landing-section__lead">
          Calibration, tracking, validated reps, auto-finish, and a transparent
          movement report — all in under a minute, all on your own device.
        </p>
        <SessionDemoPlayer />
      </section>

      {/* How it works */}
      <section className="landing-section" id="how-it-works">
        <p className="landing-eyebrow">How it works</p>
        <h2 className="landing-section__title">From camera to coaching in six steps</h2>
        <div className="pipeline">
          <div className="pipeline__steps" role="tablist" aria-label="Analysis pipeline">
            {PIPELINE_STEPS.map((s, i) => (
              <button
                key={s.title}
                type="button"
                role="tab"
                aria-selected={i === activeStep}
                className={`pipeline__step${i === activeStep ? ' pipeline__step--active' : ''}`}
                onClick={() => setActiveStep(i)}
              >
                <span className="pipeline__step-num">{i + 1}</span>
                <span className="pipeline__step-title">{s.title}</span>
                <span className="pipeline__step-short">{s.short}</span>
              </button>
            ))}
          </div>
          <div className="pipeline__detail" role="tabpanel">
            <h3 className="pipeline__detail-title">
              {activeStep + 1}. {step.title}
            </h3>
            <p className="pipeline__detail-text">{step.text}</p>
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="landing-section" id="who-its-for">
        <p className="landing-eyebrow">Who it&apos;s for</p>
        <h2 className="landing-section__title">
          Built for the people who build people back up
        </h2>
        <div className="landing-grid landing-grid--audiences">
          {AUDIENCES.map((a) => (
            <div key={a.title} className="audience-card">
              <span className="audience-card__icon" aria-hidden>
                {a.icon}
              </span>
              <h3 className="audience-card__title">{a.title}</h3>
              <p className="audience-card__text">{a.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why KinematicIQ */}
      <section className="landing-section" id="why">
        <p className="landing-eyebrow">Why KinematicIQ</p>
        <h2 className="landing-section__title">
          Lab-grade insight without the lab
        </h2>
        <div className="landing-grid landing-grid--benefits">
          {BENEFITS.map((b) => (
            <div key={b.title} className="benefit-card">
              <h3 className="benefit-card__title">{b.title}</h3>
              <p className="benefit-card__text">{b.text}</p>
            </div>
          ))}
        </div>
        <p className="landing-section__note">
          Starting with the bodyweight squat — the reference movement behind
          nearly every strength and rehab program. Hip hinge, jump, and sprint
          are next, each with its own movement-specific reads.
        </p>
      </section>

      {/* Final CTA */}
      <section className="landing-cta">
        <h2 className="landing-cta__title">Ready to see your movement clearly?</h2>
        <p className="landing-cta__text">
          Open your camera, move through a set, and get a transparent,
          posture-first movement report in under a minute.
        </p>
        <div className="landing-cta__actions">
          <Button to="/camera" variant="primary">
            Start a live session
          </Button>
          <Button to="/upload" variant="ghost">
            Upload a video instead
          </Button>
        </div>
      </section>

      <footer className="landing-footer">
        <p>
          KinematicIQ provides movement insights for training and education. It
          is not a medical device and does not replace clinical judgment.
        </p>
      </footer>
    </div>
  )
}
