/**
 * The movement player (P3): one synchronized surface for a finished session.
 *
 * Replaces the analyst-only `SessionReplay` panel. One timeline, one playback
 * state, one speed and one selected frame drive every view — the source video,
 * the 2D skeleton overlay, and the 3D reconstruction — so nothing can drift
 * out of agreement with anything else.
 *
 * Progressive disclosure, per the approved reference:
 *
 *   mini      a small card that does not dominate the report; click to expand
 *   expanded  full transport, markers, frame stepping, readout
 *   split     source + skeleton beside the synchronized 3D reconstruction
 *
 * Honesty constraints this component holds:
 *
 *   - The skeleton is always drawn from the LANDMARK frame, never inferred
 *     from the video position, so the overlay stays truthful if the video
 *     lags. Video/landmark alignment is approximate (see `playerModel`).
 *   - The 3D view is capability-gated on real world landmarks. A tape without
 *     them offers no split view rather than rendering an empty scene.
 *   - No source video is an ordinary state, not an error: replayed pose tapes
 *     and browsers that refuse to record both land there, and the player says
 *     so plainly instead of showing a broken frame.
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
import { useObjectUrl } from '../../media/useObjectUrl'
import { drawReplayFrame } from './drawReplayFrame'
import {
  PLAYBACK_SPEEDS,
  buildReplayEvents,
  buildReplayViewModel,
  frameDelayMs,
  type PlaybackSpeed,
  type ReplayEvent,
} from './replayModel'
import {
  collapseMode,
  expandMode,
  needsSeek,
  showsFullControls,
  showsScene3D,
  videoTimeForFrame,
  type PlayerMode,
} from './playerModel'

const PoseScene3D = lazy(() => import('../PoseScene3D'))

const CANVAS_WIDTH = 960
const CANVAS_HEIGHT = 540
const HIP_TRAIL_MAX = 90

interface MovementPlayerProps {
  tape: PoseTape
  /** The session's own footage. Null is ordinary — see the header. */
  videoBlob: Blob | null
  /** Notifies the parent so linked views (the rep chart) can highlight. */
  onActiveRepChange?: (repNumber: number | null) => void
  /** External evidence link: a rep to open at its bottom frame. */
  requestedRepNumber?: number | null
  /**
   * Notifies the parent of the disclosure step. Results pairs the mini
   * player with the rep chart in one row and gives the player the full
   * width once it expands, so the layout has to follow the mode.
   */
  onModeChange?: (mode: PlayerMode) => void
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

export function MovementPlayer({
  tape,
  videoBlob,
  onActiveRepChange,
  requestedRepNumber = null,
  onModeChange,
}: MovementPlayerProps) {
  const replay = useMemo(() => replayTape(tape), [tape])
  const events = useMemo(
    () => buildReplayEvents(replay.frameTrace, replay.reps, replay.repRejections),
    [replay],
  )

  const [mode, setMode] = useState<PlayerMode>('mini')
  useEffect(() => {
    onModeChange?.(mode)
  }, [mode, onModeChange])
  const [sampleIndex, setSampleIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState<PlaybackSpeed>(1)
  const [demoMode, setDemoMode] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const pose3DRef = useRef(createEmptyPose3DRef())

  const videoUrl = useObjectUrl(videoBlob)
  const frames = replay.analyzedFrames
  const lastIndex = Math.max(0, frames.length - 1)
  const view = useMemo(
    () => buildReplayViewModel(frames, replay.frameTrace, replay.reps, sampleIndex),
    [frames, replay, sampleIndex],
  )

  // 3D is offered only when the tape actually carries world landmarks. A
  // protocol or a legacy tape without them must not present an empty scene.
  const has3D = useMemo(
    () => frames.some((frame) => frame.worldLandmarks.length > 0),
    [frames],
  )

  // Evidence link: selecting a rep elsewhere seeks here and opens the player.
  useEffect(() => {
    if (requestedRepNumber === null) return
    const rep = replay.reps.find((r) => r.repNumber === requestedRepNumber)
    if (!rep) return
    const exact = replay.analyzedFrames.findIndex(
      (frame) => frame.frameIndex === rep.bottomFrameIndex,
    )
    if (exact >= 0) {
      setPlaying(false)
      setSampleIndex(exact)
      // A seek the athlete cannot see is not a seek — step the mini card up.
      setMode((current) => (current === 'mini' ? 'expanded' : current))
    }
  }, [requestedRepNumber, replay])

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

  // 2D skeleton for the current frame (+ Demo Mode effects). Transparent, so
  // it composites over the video when there is one.
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    drawReplayFrame(ctx, frames, sampleIndex, canvas.width, canvas.height, {
      demoMode,
    })
  }, [frames, sampleIndex, demoMode, mode])

  // Keep the source video with the timeline. During playback the video runs on
  // its own clock and is only corrected past the drift tolerance; while paused
  // or scrubbing it is seeked exactly.
  useEffect(() => {
    const video = videoRef.current
    if (!video || !videoUrl) return
    const target = videoTimeForFrame(frames, sampleIndex)
    if (target === null) return
    if (!playing) {
      video.pause()
      if (needsSeek(video.currentTime, target, 0.01)) video.currentTime = target
      return
    }
    if (needsSeek(video.currentTime, target)) video.currentTime = target
    video.playbackRate = speed
    void video.play().catch(() => {
      // Autoplay policies can refuse; the skeleton timeline still advances.
    })
  }, [videoUrl, frames, sampleIndex, playing, speed])

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

  const isMini = mode === 'mini'
  const fraction = lastIndex === 0 ? 0 : sampleIndex / lastIndex

  const stage = (
    <div className="movement-player__stage">
      <div className="movement-player__source">
        {videoUrl ? (
          <video
            ref={videoRef}
            className="movement-player__video"
            src={videoUrl}
            muted
            playsInline
            preload="auto"
          />
        ) : (
          <div className="movement-player__no-video" aria-hidden />
        )}
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="movement-player__canvas"
        />
        {!isMini && (
          <div className="movement-player__readout">
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
        )}
      </div>

      {showsScene3D(mode) && has3D && (
        <div className="movement-player__scene3d">
          <Suspense fallback={null}>
            <PoseScene3D poseRef={pose3DRef} />
          </Suspense>
        </div>
      )}
    </div>
  )

  return (
    <section
      className={`movement-player movement-player--${mode}`}
      aria-label="Movement player"
    >
      <div className="movement-player__head">
        <div className="movement-player__title">
          <span className="movement-player__label">
            {videoUrl ? 'Source + 2D skeleton' : '2D skeleton'}
            {showsScene3D(mode) && has3D ? ' · 3D reconstruction' : ''}
          </span>
          {!videoUrl && (
            <span className="movement-player__note">
              No source video was kept for this session — the tracked landmarks
              are shown on their own.
            </span>
          )}
        </div>
        <div className="movement-player__modes">
          {!isMini && (
            <>
              <button
                type="button"
                className={`hud-tool${demoMode ? ' hud-tool--on' : ''}`}
                onClick={() => setDemoMode((v) => !v)}
                aria-pressed={demoMode}
                title="Demo Mode adds motion trails and the hip path — visuals only, analysis unchanged"
              >
                Trails
              </button>
              <button
                type="button"
                className="hud-tool"
                onClick={() => setMode(collapseMode(mode))}
              >
                Shrink
              </button>
            </>
          )}
          {/* 3D is only offered when the data supports it. */}
          {(mode !== 'split' || !has3D) && (
            <button
              type="button"
              className="hud-tool"
              onClick={() => setMode(expandMode(mode))}
              disabled={mode === 'expanded' && !has3D}
              title={
                mode === 'expanded' && !has3D
                  ? 'This recording carries no 3D landmark data'
                  : undefined
              }
            >
              {mode === 'mini' ? 'Expand' : 'Split with 3D'}
            </button>
          )}
        </div>
      </div>

      {isMini ? (
        <button
          type="button"
          className="movement-player__mini-hit"
          onClick={() => setMode('expanded')}
          aria-label="Expand the movement player"
        >
          {stage}
        </button>
      ) : (
        stage
      )}

      <div className="movement-player__timeline">
        <input
          type="range"
          min={0}
          max={lastIndex}
          value={sampleIndex}
          onChange={(e) => {
            setPlaying(false)
            setSampleIndex(Number(e.target.value))
          }}
          className="movement-player__scrub"
          aria-label="Movement timeline"
        />
        {showsFullControls(mode) && (
          <div className="movement-player__markers" aria-hidden>
            {events.map((event, i) => (
              <button
                key={`${event.kind}-${event.sampleIndex}-${i}`}
                type="button"
                className={`movement-player__marker movement-player__marker--${event.kind}`}
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
        )}
      </div>

      <div className="movement-player__controls">
        {showsFullControls(mode) && (
          <button
            type="button"
            className="hud-tool"
            onClick={() => step(-1)}
            title="Previous frame"
          >
            ⏮ Frame
          </button>
        )}
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
        {showsFullControls(mode) && (
          <>
            <button
              type="button"
              className="hud-tool"
              onClick={() => step(1)}
              title="Next frame"
            >
              Frame ⏭
            </button>
            <div
              className="movement-player__speeds"
              role="group"
              aria-label="Playback speed"
            >
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
          </>
        )}
        <span className="movement-player__frame-count">
          {showsFullControls(mode)
            ? `Frame ${sampleIndex + 1}/${frames.length} · ${Math.round(fraction * 100)}%`
            : formatSeconds(view.elapsedSeconds)}
        </span>
      </div>
    </section>
  )
}

export default MovementPlayer
