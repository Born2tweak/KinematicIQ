/**
 * Shared cyclic segmentation engine (M42).
 *
 * The phase-FSM + rep-counting loop for cyclic movements (reps with a clear
 * bottom: squat, hip hinge, sit-to-stand), extracted from
 * `analysis/videoAnalyzer.runPipelineOnFrames` and parameterized by
 * `CyclicEngineConfig` so new cyclic protocols reuse the machinery without
 * importing squat concepts (R01 phase-aware models, R02 motion segmentation,
 * R08 plugin contracts).
 *
 * The loop body is MOVED, not rewritten — `runPipelineOnFrames` now
 * delegates here with the squat config, and the tape-regression + replay
 * parity suites pin the outputs. No thresholds changed (roadmap "do not
 * retune").
 */
import { getJointAngles } from '../angles'
import { safeLandmark } from '../geometry'
import {
  createPhaseDetectorState,
  updatePhaseDetector,
  type CyclicPhaseConfig,
  type PhaseDetectorState,
} from '../phaseDetector'
import {
  createRepCounterState,
  updateRepCounter,
  type RepCounterState,
  type RepGateConfig,
  type RepRejection,
} from '../repCounter'
import { assessLandmarkQuality } from '../../cv/landmarkQuality'
import {
  LANDMARK_INDICES,
  type JointAngles,
  type LandmarkQualityFrame,
  type PoseFrame,
  type RepMetrics,
} from '../../cv/types'
import {
  extractPostureFrame,
  type PostureFrameSample,
} from '../posture/postureFrame'
import {
  createFrameTraceCollector,
  type FrameTraceSample,
} from '../frameTrace'

/** Everything a cyclic movement needs to segment a frame stream. */
export interface CyclicEngineConfig {
  phase: CyclicPhaseConfig
  repGates: RepGateConfig
}

/**
 * Optional pipeline entry state. Live sessions can activate mid-descent with
 * seeded FSM state (analysis/setActivation); replay passes the same seeds so
 * the tape reproduces the live session (finding #7). Omit for a cold start.
 * Seeded states carry their own configs, fixed at creation.
 */
export interface CyclicInitialState {
  phaseDetector?: PhaseDetectorState
  repCounter?: RepCounterState
}

export interface CyclicSegmentationResult {
  reps: RepMetrics[]
  poseConfidenceSamples: number[]
  postureSamples: PostureFrameSample[]
  frameTrace: FrameTraceSample[]
  repRejections: RepRejection[]
  /** Per-frame landmark quality (M26) — observational, one entry per frame. */
  landmarkQuality: LandmarkQualityFrame[]
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
 * Config sanity checks for new cyclic protocols. Returns human-readable
 * issues (empty = valid). Deliberately structural only — it validates
 * ordering/range invariants, never "good" values; tuning quality is a
 * benchmark question (R05), not a type question.
 */
export function validateCyclicConfig(config: CyclicEngineConfig): string[] {
  const issues: string[] = []
  const { phase, repGates } = config
  if (!(phase.standingKneeAngle > phase.descendingKneeAngle)) {
    issues.push('standingKneeAngle must exceed descendingKneeAngle')
  }
  if (!(phase.descendingKneeAngle > phase.bottomKneeAngle)) {
    issues.push('descendingKneeAngle must exceed bottomKneeAngle')
  }
  if (!(phase.ascendingKneeAngle > phase.bottomKneeAngle)) {
    issues.push('ascendingKneeAngle must exceed bottomKneeAngle')
  }
  if (!(phase.emaAlpha > 0 && phase.emaAlpha <= 1)) {
    issues.push('emaAlpha must be in (0, 1]')
  }
  if (phase.requiredConsecutiveFrames < 1) {
    issues.push('requiredConsecutiveFrames must be at least 1')
  }
  if (!(repGates.minRepDurationMs < repGates.maxRepDurationMs)) {
    issues.push('minRepDurationMs must be below maxRepDurationMs')
  }
  if (!(repGates.minHipDescent >= 0)) {
    issues.push('minHipDescent must be non-negative')
  }
  return issues
}

/**
 * Run the cyclic phase-detection + rep-counting FSM over an ordered list of
 * detected pose frames. The single source of truth for the cyclic analysis
 * loop — squat's `runPipelineOnFrames` and the replay harness both land
 * here. Pure: no seeking, no detection, no DOM.
 */
export function runCyclicPipelineOnFrames(
  frames: readonly PoseFrame[],
  config: CyclicEngineConfig,
  initial: CyclicInitialState = {},
): CyclicSegmentationResult {
  let phaseDetector =
    initial.phaseDetector ?? createPhaseDetectorState(config.phase)
  let repCounter = initial.repCounter ?? createRepCounterState(config.repGates)
  const poseConfidenceSamples: number[] = []
  const postureSamples: PostureFrameSample[] = []
  const frameTrace = createFrameTraceCollector()
  const landmarkQuality: LandmarkQualityFrame[] = []
  let prevFrame: PoseFrame | null = null

  for (const inputFrame of frames) {
    // Per-frame quality (M26): derived alongside the loop, attached to a COPY
    // of the frame (inputs are never mutated), and never consulted by the FSM.
    const quality = assessLandmarkQuality(inputFrame, prevFrame)
    landmarkQuality.push(quality)
    prevFrame = inputFrame
    const frame: PoseFrame = inputFrame.quality
      ? inputFrame
      : { ...inputFrame, quality }

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
    repRejections: repCounter.rejections,
    landmarkQuality,
  }
}
