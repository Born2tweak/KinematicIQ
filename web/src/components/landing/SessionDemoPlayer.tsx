import { useEffect, useRef, useState } from 'react'
import { SquatFigure } from './SquatFigure'
import { squatCycle, CYCLE_TOTAL_MS } from './squatPose'

/**
 * The "demo video" slot. If a real recording exists at /demo.mp4
 * (drop one into web/public/), it plays that. Otherwise it runs a
 * scripted simulation of a full analysis session.
 */
export function SessionDemoPlayer() {
  const [hasVideo, setHasVideo] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/demo.mp4', { method: 'HEAD' })
      .then((res) => {
        const type = res.headers.get('content-type') ?? ''
        if (!cancelled) setHasVideo(res.ok && type.startsWith('video'))
      })
      .catch(() => {
        if (!cancelled) setHasVideo(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (hasVideo) {
    return (
      <div className="demo-player">
        <div className="demo-player__chrome">
          <span className="demo-player__chrome-dot" />
          <span className="demo-player__chrome-dot" />
          <span className="demo-player__chrome-dot" />
          <span className="demo-player__chrome-url">kinematiq · product demo</span>
        </div>
        <video className="demo-player__video" src="/demo.mp4" controls playsInline />
      </div>
    )
  }

  return <ScriptedSessionDemo />
}

/* ---------- Scripted session simulation ---------- */

type Stage = 'idle' | 'calibrating' | 'ready' | 'active' | 'finishing' | 'results'

const CALIBRATE_MS = 1600
const READY_MS = 900
const TOTAL_REPS = 3
const ACTIVE_MS = TOTAL_REPS * CYCLE_TOTAL_MS
const COUNTDOWN_STEP_MS = 800
const FINISH_MS = COUNTDOWN_STEP_MS * 3
const FINAL_SCORE = 88

interface SessionState {
  stage: Stage
  depth: number
  reps: number
  calibrateProgress: number
  countdown: number
  score: number
}

const IDLE_STATE: SessionState = {
  stage: 'idle',
  depth: 0,
  reps: 0,
  calibrateProgress: 0,
  countdown: 3,
  score: 0,
}

function sampleSession(elapsed: number): SessionState {
  if (elapsed < CALIBRATE_MS) {
    return {
      ...IDLE_STATE,
      stage: 'calibrating',
      calibrateProgress: elapsed / CALIBRATE_MS,
    }
  }
  let t = elapsed - CALIBRATE_MS
  if (t < READY_MS) {
    return { ...IDLE_STATE, stage: 'ready', calibrateProgress: 1 }
  }
  t -= READY_MS
  if (t < ACTIVE_MS) {
    const sample = squatCycle(t)
    return {
      ...IDLE_STATE,
      stage: 'active',
      depth: sample.depth,
      reps: Math.floor(t / CYCLE_TOTAL_MS),
    }
  }
  t -= ACTIVE_MS
  if (t < FINISH_MS) {
    return {
      ...IDLE_STATE,
      stage: 'finishing',
      reps: TOTAL_REPS,
      countdown: 3 - Math.floor(t / COUNTDOWN_STEP_MS),
    }
  }
  t -= FINISH_MS
  // Score counts up over 1.2s, then holds.
  const scoreT = Math.min(1, t / 1200)
  return {
    ...IDLE_STATE,
    stage: 'results',
    reps: TOTAL_REPS,
    score: Math.round(FINAL_SCORE * (1 - Math.pow(1 - scoreT, 3))),
  }
}

const STATUS_TEXT: Record<Stage, { title: string; subtitle: string }> = {
  idle: { title: 'Product demo', subtitle: 'Press play to watch a full session.' },
  calibrating: {
    title: 'Calibrating…',
    subtitle: 'Hold still — learning your standing baseline.',
  },
  ready: { title: 'Ready', subtitle: 'Begin your first rep whenever you like.' },
  active: { title: 'Tracking', subtitle: 'Reps are counted and validated automatically.' },
  finishing: { title: 'Stand still to finish', subtitle: 'Auto-finish countdown…' },
  results: {
    title: 'Session complete',
    subtitle: 'Scored across depth, trunk control, knee tracking, consistency, and symmetry.',
  },
}

export function ScriptedSessionDemo() {
  const [state, setState] = useState<SessionState>(IDLE_STATE)
  const [running, setRunning] = useState(false)
  const startRef = useRef(0)

  useEffect(() => {
    if (!running) return
    // Interval + wall clock (not rAF) so the timeline keeps advancing even
    // when the tab is throttled or occluded mid-demo.
    startRef.current = performance.now()
    const interval = window.setInterval(() => {
      const next = sampleSession(performance.now() - startRef.current)
      setState(next)
      if (next.stage === 'results' && next.score >= FINAL_SCORE) {
        setRunning(false)
      }
    }, 33)
    return () => window.clearInterval(interval)
  }, [running])

  const start = () => {
    setState({ ...IDLE_STATE, stage: 'calibrating' })
    setRunning(true)
  }

  const status = STATUS_TEXT[state.stage]
  const showOverlayButton = state.stage === 'idle' || (state.stage === 'results' && !running)

  return (
    <div className="demo-player">
      <div className="demo-player__chrome">
        <span className="demo-player__chrome-dot" />
        <span className="demo-player__chrome-dot" />
        <span className="demo-player__chrome-dot" />
        <span className="demo-player__chrome-url">kinematiq · simulated session</span>
      </div>

      <div className="demo-player__stage">
        <SquatFigure depth={state.depth} className="demo-player__figure" />

        {state.stage !== 'idle' && (
          <div className="demo-player__reps">
            <span className="demo-player__reps-label">Reps</span>
            <span className="demo-player__reps-value">{state.reps}</span>
          </div>
        )}

        {state.stage === 'finishing' && (
          <div className="demo-player__countdown">
            <span>{Math.max(1, state.countdown)}</span>
          </div>
        )}

        {state.stage === 'results' && (
          <div className="demo-player__results">
            <div className="demo-player__score-ring">
              <svg viewBox="0 0 100 100" aria-hidden>
                <circle cx="50" cy="50" r="44" className="demo-player__ring-track" />
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  className="demo-player__ring-fill"
                  strokeDasharray={`${(state.score / 100) * 276.5} 276.5`}
                />
              </svg>
              <div className="demo-player__score-center">
                <span className="demo-player__score-value">{state.score}</span>
                <span className="demo-player__score-band">Excellent</span>
              </div>
            </div>
            <ul className="demo-player__score-chips">
              <li>Depth ✓</li>
              <li>Trunk control ✓</li>
              <li>Consistency ✓</li>
            </ul>
          </div>
        )}

        {showOverlayButton && (
          <button type="button" className="demo-player__play" onClick={start}>
            <span className="demo-player__play-icon">▶</span>
            {state.stage === 'idle' ? 'Play demo' : 'Replay demo'}
          </button>
        )}
      </div>

      <div className={`demo-player__status demo-player__status--${state.stage}`}>
        <p className="demo-player__status-title">{status.title}</p>
        <p className="demo-player__status-subtitle">{status.subtitle}</p>
        {state.stage === 'calibrating' && (
          <div className="demo-player__progress">
            <div
              className="demo-player__progress-fill"
              style={{ width: `${Math.round(state.calibrateProgress * 100)}%` }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
