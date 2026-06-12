import { useEffect, useRef, useState } from 'react'
import { SquatFigure } from './SquatFigure'
import {
  phaseForDepth,
  squatCycle,
  squatPose,
  type DemoPhase,
} from './squatPose'

const PHASE_LABELS: Record<DemoPhase, string> = {
  STANDING: 'Standing',
  DESCENT: 'Descent',
  BOTTOM: 'Bottom',
  ASCENT: 'Ascent',
}

export function LiveSquatDemo() {
  const [depth, setDepth] = useState(0)
  const [descending, setDescending] = useState(false)
  const [playing, setPlaying] = useState(true)
  const [reps, setReps] = useState(0)

  const lastProgressRef = useRef(0)

  useEffect(() => {
    if (!playing) return

    // Interval + wall clock (not rAF) so the loop keeps running even when
    // the tab is throttled or occluded.
    const start = performance.now()
    lastProgressRef.current = 0
    const interval = window.setInterval(() => {
      const sample = squatCycle(performance.now() - start)
      // A rep completes when the cycle wraps after having passed the bottom.
      if (sample.cycleProgress < lastProgressRef.current) {
        setReps((r) => r + 1)
      }
      lastProgressRef.current = sample.cycleProgress
      setDepth(sample.depth)
      setDescending(sample.descending)
    }, 33)
    return () => window.clearInterval(interval)
  }, [playing])

  const pose = squatPose(depth)
  const phase = phaseForDepth(pose.kneeAngle, descending)

  const handleScrub = (value: number) => {
    setPlaying(false)
    setDescending(value > depth)
    setDepth(value)
  }

  return (
    <div className="live-demo" aria-label="Interactive squat analysis demo">
      <div className="live-demo__header">
        <span className="live-demo__dot" aria-hidden />
        <span className="live-demo__title">Live analysis</span>
        <span className={`live-demo__phase live-demo__phase--${phase.toLowerCase()}`}>
          {PHASE_LABELS[phase]}
        </span>
      </div>

      <div className="live-demo__stage">
        <SquatFigure depth={depth} showKneeAngle className="live-demo__figure" />
        <div className="live-demo__reps" aria-label={`${reps} reps counted`}>
          <span className="live-demo__reps-label">Reps</span>
          <span className="live-demo__reps-value">{reps}</span>
        </div>
      </div>

      <div className="live-demo__metrics">
        <div className="live-demo__metric">
          <span className="live-demo__metric-label">Knee angle</span>
          <span className="live-demo__metric-value">{Math.round(pose.kneeAngle)}°</span>
        </div>
        <div className="live-demo__metric">
          <span className="live-demo__metric-label">Hip angle</span>
          <span className="live-demo__metric-value">{Math.round(pose.hipAngle)}°</span>
        </div>
        <div className="live-demo__metric">
          <span className="live-demo__metric-label">Depth target</span>
          <span className="live-demo__metric-value">&lt; 105°</span>
        </div>
      </div>

      <div className="live-demo__controls">
        <button
          type="button"
          className="live-demo__play"
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? 'Pause demo' : 'Play demo'}
        >
          {playing ? '❚❚' : '▶'}
        </button>
        <input
          type="range"
          className="live-demo__slider"
          min={0}
          max={100}
          value={Math.round(depth * 100)}
          onChange={(e) => handleScrub(Number(e.target.value) / 100)}
          aria-label="Scrub squat depth"
        />
      </div>
      <p className="live-demo__hint">
        Drag the slider — this is the same joint geometry the analyzer measures
        on every frame.
      </p>
    </div>
  )
}
