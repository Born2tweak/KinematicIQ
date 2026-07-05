/**
 * Professional replay system for the Results screen: timeline scrub,
 * frame-stepping, slow-motion playback, and event markers, driven by the
 * pose tape replayed through the production pipeline (eval/replayHarness).
 *
 * Presentation-layer only: the replay derives every value from analysis
 * outputs and never feeds anything back. Demo Mode toggles visual effects
 * (ghost poses, hip trajectory) at draw time — analysis outputs are
 * bit-identical either way (see replayModel + demo-identity test).
 */
import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { getJointAngles } from '../../analysis/angles'
import { replayTape } from '../../eval/replayHarness'
import type { PoseTape } from '../../eval/poseTape'
import { createEmptyPose3DRef, hipCenter } from '../../cv/pose3d'
import { drawReplayFrame } from './drawReplayFrame'
import {
  PLAYBACK_SPEEDS,
  buildReplayEvents,
  buildReplayViewModel,
  frameDelayMs,
  type PlaybackSpeed,
  type ReplayEvent,
} from './replayModel'

const PoseScene3D = lazy(() => import('../PoseScene3D'))

const CANVAS_WIDTH = 960
const CANVAS_HEIGHT = 540
const HIP_TRAIL_MAX = 90

interface SessionReplayProps {
  tape: PoseTape
  /** Notifies the parent so linked views (rep chart) can highlight. */
  onActiveRepChange?: (repNumber: number | null) => void
}

const EVENT_GLYPH: Record<ReplayEvent['kind'], string> = {
  descent: '▼',
  bottom: '●',
  ascent: '▲',
  'rep-counted': '✓',
  rejection: '✕',
}

function formatSeconds(seconds: number): string {
  const s = Math.max(0, seconds)
  const mins = Math.floor(s / 60)
  const secs = (s % 60).toFixed(1)
  return `${mins}:${secs.padStart(4, '0')}`
}

export function SessionReplay({ tape, onActiveRepChange }: SessionReplayProps) {
  // Deterministic replay of the session's own tape (Stream 2 parity work).
  const replay = useMemo(() => replayTape(tape), [tape])
  const events = useMemo(
    () => buildReplayEvents(replay.frameTrace, replay.reps, replay.repRejections),
    [replay],
  )

  const [sampleIndex, setSampleIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState<PlaybackSpeed>(1)
  const [demoMode, setDemoMode] = useState(false)
  const [show3D, setShow3D] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const pose3DRef = useRef(createEmptyPose3DRef())

  const frames = replay.analyzedFrames
  const lastIndex = Math.max(0, frames.length - 1)
  const view = useMemo(
    () =>
      buildReplayViewModel(frames, replay.frameTrace, replay.reps, sampleIndex),
    [frames, replay, sampleIndex],
  )

  // Playback clock honoring real frame gaps at the selected speed.
  useEffect(() => {
    if (!playing) return
    if (sampleIndex >= lastIndex) {
      setPlaying(false)
      return
    }
    const timer = window.setTimeout(
      () => setSampleIndex((i) => Math.min(i + 1, lastIndex)),
      frameDelayMs(frames, sampleIndex, speed),
    )
    return () => window.clearTimeout(timer)
  }, [playing, sampleIndex, speed, frames, lastIndex])

  // 2D canvas render for the current frame (+ Demo Mode effects).
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    drawReplayFrame(ctx, frames, sampleIndex, canvas.width, canvas.height, {
      demoMode,
    })
  }, [frames, sampleIndex, demoMode])

  // Linked views: hand the current pose to the 3D scene + notify the chart.
  useEffect(() => {
    if (!view) return
    const pose3D = pose3DRef.current
    pose3D.worldLandmarks = view.frame.worldLandmarks
    pose3D.angles = getJointAngles(view.frame)
    pose3D.timestamp = view.frame.timestamp
    pose3D.poseConfidence = view.frame.poseConfidence
    if (view.frame.worldLandmarks.length > 0) {
      pose3D.hipTrail.push(hipCenter(view.frame.worldLandmarks))
      if (pose3D.hipTrail.length > HIP_TRAIL_MAX) pose3D.hipTrail.shift()
    }
    onActiveRepChange?.(view.activeRepNumber)
  }, [view, onActiveRepChange])

  const step = useCallback(
    (delta: number) => {
      setPlaying(false)
      setSampleIndex((i) => Math.max(0, Math.min(i + delta, lastIndex)))
    },
    [lastIndex],
  )

  if (frames.length === 0 || !view) return null

  const fraction = lastIndex === 0 ? 0 : sampleIndex / lastIndex

  return (
    <section className="session-replay" aria-label="Session replay">
      <div className="session-replay__head">
        <h2 className="results-panel__heading">Session replay</h2>
        <div className="session-replay__toggles">
          <button
            type="button"
            className={`hud-tool${demoMode ? ' hud-tool--on' : ''}`}
            onClick={() => setDemoMode((v) => !v)}
            aria-pressed={demoMode}
            title="Demo Mode adds motion trails and the hip path — visuals only, analysis unchanged"
          >
            Demo Mode
          </button>
          <button
            type="button"
            className={`hud-tool${show3D ? ' hud-tool--on' : ''}`}
            onClick={() => setShow3D((v) => !v)}
            aria-pressed={show3D}
            title="3D pose view synced to the timeline"
          >
            3D
          </button>
        </div>
      </div>
      <p className="results-panel__intro">
        Replay of the tracked landmarks from this recording, frame by frame —
        the same data the analysis read. Depth and 3D are on-device estimates,
        not validated measurements.
      </p>

      <div className={`session-replay__stage${show3D ? ' session-replay__stage--split' : ''}`}>
        <div className="session-replay__canvas-wrap">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="session-replay__canvas"
          />
          <div className="session-replay__readout">
            <span>{formatSeconds(view.elapsedSeconds)}</span>
            <span>Phase {view.trace.phase}</span>
            <span>
              Knee{' '}
              {view.trace.kneeAngle === null
                ? '—'
                : `${Math.round(view.trace.kneeAngle)}°`}
            </span>
            <span>
              Trunk{' '}
              {view.trace.trunkLean === null
                ? '—'
                : `${Math.round(view.trace.trunkLean)}°`}
            </span>
            <span>Conf {Math.round(view.frame.poseConfidence * 100)}%</span>
            <span>
              {view.activeRepNumber === null
                ? 'Between reps'
                : `Rep ${view.activeRepNumber}`}
            </span>
          </div>
        </div>
        {show3D && (
          <div className="session-replay__scene3d">
            <Suspense fallback={null}>
              <PoseScene3D poseRef={pose3DRef} />
            </Suspense>
          </div>
        )}
      </div>

      <div className="session-replay__timeline">
        <input
          type="range"
          min={0}
          max={lastIndex}
          value={sampleIndex}
          onChange={(e) => {
            setPlaying(false)
            setSampleIndex(Number(e.target.value))
          }}
          className="session-replay__scrub"
          aria-label="Replay timeline"
        />
        <div className="session-replay__markers" aria-hidden>
          {events.map((event, i) => (
            <button
              key={`${event.kind}-${event.sampleIndex}-${i}`}
              type="button"
              className={`session-replay__marker session-replay__marker--${event.kind}`}
              style={{
                left: `${lastIndex === 0 ? 0 : (event.sampleIndex / lastIndex) * 100}%`,
              }}
              title={event.label}
              onClick={() => {
                setPlaying(false)
                setSampleIndex(event.sampleIndex)
              }}
            >
              {EVENT_GLYPH[event.kind]}
            </button>
          ))}
        </div>
      </div>

      <div className="session-replay__controls">
        <button type="button" className="hud-tool" onClick={() => step(-1)} title="Previous frame">
          ⏮ Frame
        </button>
        <button
          type="button"
          className={`hud-tool${playing ? ' hud-tool--on' : ''}`}
          onClick={() => {
            if (!playing && sampleIndex >= lastIndex) setSampleIndex(0)
            setPlaying((v) => !v)
          }}
        >
          {playing ? 'Pause' : 'Play'}
        </button>
        <button type="button" className="hud-tool" onClick={() => step(1)} title="Next frame">
          Frame ⏭
        </button>
        <div className="session-replay__speeds" role="group" aria-label="Playback speed">
          {PLAYBACK_SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              className={`hud-tool${speed === s ? ' hud-tool--on' : ''}`}
              onClick={() => setSpeed(s)}
            >
              {s}×
            </button>
          ))}
        </div>
        <span className="session-replay__frame-count">
          Frame {sampleIndex + 1}/{frames.length} ·{' '}
          {Math.round(fraction * 100)}%
        </span>
      </div>
    </section>
  )
}

export default SessionReplay
