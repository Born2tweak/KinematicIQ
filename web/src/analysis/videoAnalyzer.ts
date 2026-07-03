/**
 * Orchestrates squat analysis over a pre-recorded video by reusing the exact
 * same pipeline as the live camera: phase detection → rep counting, producing
 * the `RepMetrics[]` + pose-confidence samples that `buildSessionResult`
 * consumes. No camera, no DOM, no MediaPipe imports here — `seek` and `detect`
 * are injected so this module stays pure and unit-testable.
 *
 * The video timeline is sampled at a fixed FPS (forward-only). Each sampled
 * frame is seeked, detected, and fed through `updatePhaseDetector` /
 * `updateRepCounter` identically to `CameraScreen`'s per-frame loop.
 */
import { getJointAngles } from './angles'
import { safeLandmark } from './geometry'
import {
  createPhaseDetectorState,
  updatePhaseDetector,
} from './phaseDetector'
import {
  createRepCounterState,
  updateRepCounter,
} from './repCounter'
import { filterFrameSequence } from '../cv/landmarkFilter'
import { LANDMARK_INDICES, type JointAngles, type PoseFrame, type RepMetrics } from '../cv/types'
import {
  extractPostureFrame,
  type PostureFrameSample,
} from './posture/postureFrame'
import {
  createFrameTraceCollector,
  type FrameTraceSample,
} from './frameTrace'

/** Analysis sampling rate — fewer inferences than display FPS, still smooth. */
export const DEFAULT_ANALYSIS_FPS = 15

export interface VideoAnalysisDeps {
  /** Total video length in seconds. */
  durationSeconds: number
  /** Frames per second to sample for analysis (defaults to 15). */
  fps?: number
  /** Seek the underlying source to `seconds`; resolves when the frame is ready. */
  seek: (seconds: number) => Promise<void>
  /** Run pose detection on the currently-seeked frame. */
  detect: (timestampMs: number, frameIndex: number) => PoseFrame | null
  /**
   * Monotonic base (ms) added to every frame timestamp. Pass `performance.now()`
   * so uploaded-video timestamps stay ahead of any prior live-camera session
   * sharing the same MediaPipe landmarker instance.
   */
  timestampBaseMs?: number
  /** Progress callback in [0, 1] as the timeline is processed. */
  onProgress?: (fraction: number) => void
  /** Abort signal to cancel an in-flight analysis. */
  signal?: AbortSignal
  /**
   * Apply zero-phase Butterworth landmark filtering (+ gap-interp + Hampel) over
   * the full captured sequence before running the FSM. Off by default so callers
   * opt in explicitly and existing behavior is preserved. See `cv/landmarkFilter`.
   */
  filterLandmarks?: boolean
}

export interface VideoAnalysisResult {
  reps: RepMetrics[]
  poseConfidenceSamples: number[]
  /** Per-frame 3D posture samples (empty when worldLandmarks are unavailable). */
  postureSamples: PostureFrameSample[]
  /** Per-frame 2D reconstruction stream (see analysis/frameTrace). */
  frameTrace: FrameTraceSample[]
  /** Total frames sampled from the timeline. */
  framesAnalyzed: number
  /** Frames where a pose was actually detected. */
  framesWithPose: number
}

/** Smallest knee angle (deepest side) used to drive phase detection. */
function trackingKneeAngle(angles: JointAngles): number | null {
  const knees = [angles.leftKnee, angles.rightKnee].filter(
    (value): value is number => value !== null,
  )
  return knees.length === 0 ? null : Math.min(...knees)
}

/** Average hip Y (normalized) — null when either hip is not confidently tracked. */
function computeHipY(frame: PoseFrame): number | null {
  const leftHip = safeLandmark(frame, LANDMARK_INDICES.LEFT_HIP)
  const rightHip = safeLandmark(frame, LANDMARK_INDICES.RIGHT_HIP)
  return leftHip && rightHip ? (leftHip.y + rightHip.y) / 2 : null
}

/**
 * Run the phase-detection + rep-counting FSM over an ordered list of detected
 * pose frames. This is the single source of truth for the analysis loop, shared
 * by {@link runVideoAnalysis} and the offline replay harness so both exercise the
 * exact same logic. Pure: no seeking, no detection, no DOM.
 */
export function runPipelineOnFrames(frames: readonly PoseFrame[]): {
  reps: RepMetrics[]
  poseConfidenceSamples: number[]
  postureSamples: PostureFrameSample[]
  frameTrace: FrameTraceSample[]
} {
  let phaseDetector = createPhaseDetectorState()
  let repCounter = createRepCounterState()
  const poseConfidenceSamples: number[] = []
  const postureSamples: PostureFrameSample[] = []
  const frameTrace = createFrameTraceCollector()

  for (const frame of frames) {
    poseConfidenceSamples.push(frame.poseConfidence)

    // 3D posture stream is additive — never gates the 2D pipeline.
    const postureSample = extractPostureFrame(frame)
    if (postureSample) {
      postureSamples.push(postureSample)
    }

    const angles = getJointAngles(frame)
    const hipY = computeHipY(frame)

    const phaseResult = updatePhaseDetector(phaseDetector, {
      kneeAngle: trackingKneeAngle(angles),
      hipY,
      timestamp: frame.timestamp,
    })
    phaseDetector = phaseResult.state

    const repResult = updateRepCounter(repCounter, {
      phase: phaseResult.phase,
      transitioned: phaseResult.transitioned,
      frame,
      angles,
      hipY,
      smoothedKneeAngle: phaseResult.smoothedKneeAngle,
      standingKneeBaseline: phaseDetector.standingKneeAngle,
      standingHipY: phaseDetector.standingHipY,
    })
    repCounter = repResult.state

    frameTrace.record(frame, angles, phaseResult.phase)
  }

  return {
    reps: repCounter.reps,
    poseConfidenceSamples,
    postureSamples,
    frameTrace: frameTrace.build(),
  }
}

/**
 * Analyze a video timeline and return the reps + confidence samples needed to
 * build a `SessionResult`. Forward-only; throws `AbortError` if `signal` aborts.
 *
 * Two passes: (1) seek + detect every sampled frame into an ordered array, then
 * optionally filter the whole sequence (zero-phase Butterworth needs the full
 * signal); (2) run the shared FSM via {@link runPipelineOnFrames}.
 */
export async function runVideoAnalysis(
  deps: VideoAnalysisDeps,
): Promise<VideoAnalysisResult> {
  const fps = deps.fps && deps.fps > 0 ? deps.fps : DEFAULT_ANALYSIS_FPS
  const step = 1 / fps
  const base = deps.timestampBaseMs ?? 0
  const duration = Math.max(deps.durationSeconds, 0)

  let framesAnalyzed = 0
  let lastTimestampMs = -1
  const detectedFrames: PoseFrame[] = []

  // Compute the frame count up front so floating-point drift on the timeline
  // can't add or drop a sample. Always includes t = 0 and t = duration.
  const totalFrames = Math.max(1, Math.floor(duration / step + 1e-9) + 1)

  // ── Pass 1: capture ──────────────────────────────────────────────
  for (let i = 0; i < totalFrames; i++) {
    if (deps.signal?.aborted) {
      throw new DOMException('Video analysis was cancelled.', 'AbortError')
    }

    const clamped = Math.min(i * step, duration)
    await deps.seek(clamped)

    // Strictly-monotonic ms timestamps keep MediaPipe's VIDEO mode happy.
    let timestampMs = Math.round(base + clamped * 1000)
    if (timestampMs <= lastTimestampMs) {
      timestampMs = lastTimestampMs + 1
    }
    lastTimestampMs = timestampMs

    const frame = deps.detect(timestampMs, framesAnalyzed)
    framesAnalyzed++

    if (frame) {
      detectedFrames.push(frame)
    }

    deps.onProgress?.(duration > 0 ? Math.min(clamped / duration, 1) : 1)
  }

  // ── Optional filtering over the full captured sequence ───────────
  const analyzedFrames = deps.filterLandmarks
    ? filterFrameSequence(detectedFrames, { fps })
    : detectedFrames

  // ── Pass 2: analyze ──────────────────────────────────────────────
  const { reps, poseConfidenceSamples, postureSamples, frameTrace } =
    runPipelineOnFrames(analyzedFrames)

  return {
    reps,
    poseConfidenceSamples,
    postureSamples,
    frameTrace,
    framesAnalyzed,
    framesWithPose: detectedFrames.length,
  }
}
