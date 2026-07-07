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
import type { PhaseDetectorState } from './phaseDetector'
import { SQUAT_PHASE_CONFIG } from './phaseDetector'
import type { RepCounterState } from './repCounter'
import { SQUAT_REP_GATES } from './repCounter'
import {
  runCyclicPipelineOnFrames,
  type CyclicEngineConfig,
} from './cyclic/cyclicEngine'
import { filterFrameSequence } from '../cv/landmarkFilter'
import type {
  LandmarkQualityFrame,
  PoseFrame,
  RepMetrics,
} from '../cv/types'
import type { PostureFrameSample } from './posture/postureFrame'
import type { FrameTraceSample } from './frameTrace'
import type { RepRejection } from './repCounter'

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
   * the full captured sequence before running the FSM. ON by default — upload is
   * the multi-pass, highest-fidelity path (M19 two-tier tracking). Pass `false`
   * only to replay the raw pipeline (eval variants). See `cv/landmarkFilter`.
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
  /**
   * Raw detected frames exactly as MediaPipe produced them (pre-filtering).
   * This is the pose-tape substrate: replaying these frames through any
   * pipeline variant reproduces the analysis deterministically (eval/poseTape).
   */
  rawFrames: PoseFrame[]
  /** Rejected rep candidates with gate diagnostics (see analysis/repCounter). */
  repRejections: RepRejection[]
  /** Per-frame landmark quality over the analyzed sequence (M26). */
  landmarkQuality: LandmarkQualityFrame[]
}

/**
 * Squat's cyclic-engine config — the same threshold objects the FSMs used
 * before the M42 extraction (no retuning; see cyclic/cyclicEngine.ts).
 */
export const SQUAT_CYCLIC_CONFIG: CyclicEngineConfig = {
  phase: SQUAT_PHASE_CONFIG,
  repGates: SQUAT_REP_GATES,
}

/**
 * Optional pipeline entry state. Live sessions can activate mid-descent with
 * seeded FSM state (analysis/setActivation); replay passes the same seeds so
 * the tape reproduces the live session (finding #7). Omit for a cold start.
 */
export interface PipelineInitialState {
  phaseDetector?: PhaseDetectorState
  repCounter?: RepCounterState
}

/**
 * Run the phase-detection + rep-counting FSM over an ordered list of detected
 * pose frames. This is the single source of truth for the analysis loop, shared
 * by {@link runVideoAnalysis} and the offline replay harness so both exercise the
 * exact same logic. Pure: no seeking, no detection, no DOM.
 *
 * Since M42 the loop itself lives in the shared cyclic engine
 * (analysis/cyclic/cyclicEngine.ts); this is the squat-configured entry point
 * with a stable signature for every existing import.
 */
export function runPipelineOnFrames(
  frames: readonly PoseFrame[],
  initial: PipelineInitialState = {},
): {
  reps: RepMetrics[]
  poseConfidenceSamples: number[]
  postureSamples: PostureFrameSample[]
  frameTrace: FrameTraceSample[]
  repRejections: RepRejection[]
  /** Per-frame landmark quality (M26) — observational, one entry per frame. */
  landmarkQuality: LandmarkQualityFrame[]
} {
  return runCyclicPipelineOnFrames(frames, SQUAT_CYCLIC_CONFIG, initial)
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

  // ── Filtering over the full captured sequence (default on) ───────
  const analyzedFrames = (deps.filterLandmarks ?? true)
    ? filterFrameSequence(detectedFrames, { fps })
    : detectedFrames

  // ── Pass 2: analyze ──────────────────────────────────────────────
  const {
    reps,
    poseConfidenceSamples,
    postureSamples,
    frameTrace,
    repRejections,
    landmarkQuality,
  } = runPipelineOnFrames(analyzedFrames)

  return {
    reps,
    poseConfidenceSamples,
    postureSamples,
    frameTrace,
    framesAnalyzed,
    framesWithPose: detectedFrames.length,
    rawFrames: detectedFrames,
    repRejections,
    landmarkQuality,
  }
}
