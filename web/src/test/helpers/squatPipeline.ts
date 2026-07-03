import {
  createPhaseDetectorState,
  updatePhaseDetector,
  type PhaseDetectorState,
} from '../../analysis/phaseDetector'
import {
  createRepCounterState,
  updateRepCounter,
  type RepCounterState,
} from '../../analysis/repCounter'
import type { JointAngles, PoseFrame, RepMetrics } from '../../cv/types'
import { createPoseFrame, makeJointAngles } from '../fixtures/poseFixtures'

export interface SquatFrameSpec {
  kneeAngle: number
  hipY: number
  /** Ms since session start; auto-incremented by frameDurationMs if omitted. */
  timestamp?: number
  angles?: JointAngles
  poseConfidence?: number
}

export interface PipelineRunResult {
  phaseDetector: PhaseDetectorState
  repCounter: RepCounterState
  lastPhase: string
  reps: RepMetrics[]
}

const DEFAULT_FRAME_MS = 33

function repeatFrames(spec: SquatFrameSpec, count: number): SquatFrameSpec[] {
  return Array.from({ length: count }, () => ({ ...spec }))
}

/**
 * Expand a keyframe script with debounce padding so phase transitions register.
 */
export function expandWithDebounce(
  keyframes: Array<{ spec: SquatFrameSpec; hold: number }>,
): SquatFrameSpec[] {
  const out: SquatFrameSpec[] = []
  for (const { spec, hold } of keyframes) {
    out.push(...repeatFrames(spec, hold))
  }
  return out
}

/** Standard bodyweight squat: stand → descend → bottom → ascend → lockout. */
export function fullSquatKeyframes(standingHipY = 0.4): SquatFrameSpec[] {
  const stand = { kneeAngle: 170, hipY: standingHipY }
  const descend = { kneeAngle: 130, hipY: standingHipY + 0.08 }
  const bottom = { kneeAngle: 95, hipY: standingHipY + 0.16 }
  const ascend = { kneeAngle: 125, hipY: standingHipY + 0.1 }

  return expandWithDebounce([
    { spec: stand, hold: 8 },
    { spec: descend, hold: 4 },
    { spec: bottom, hold: 5 },
    { spec: ascend, hold: 4 },
    { spec: stand, hold: 10 },
  ])
}

export function runSquatFrames(
  frames: SquatFrameSpec[],
  options?: {
    phaseDetector?: PhaseDetectorState
    repCounter?: RepCounterState
    frameDurationMs?: number
    startTimestamp?: number
  },
): PipelineRunResult {
  let phaseDetector = options?.phaseDetector ?? createPhaseDetectorState()
  let repCounter = options?.repCounter ?? createRepCounterState()
  const frameMs = options?.frameDurationMs ?? DEFAULT_FRAME_MS
  let t = options?.startTimestamp ?? 0
  let lastPhase = phaseDetector.phase

  frames.forEach((spec, index) => {
    if (spec.timestamp !== undefined) {
      t = spec.timestamp
    }
    const frame: PoseFrame = createPoseFrame({
      frameIndex: index,
      timestamp: t,
      kneeAngle: spec.kneeAngle,
      hipY: spec.hipY,
      poseConfidence: spec.poseConfidence ?? 0.85,
    })
    const angles = spec.angles ?? makeJointAngles(spec.kneeAngle)

    const phaseResult = updatePhaseDetector(phaseDetector, {
      kneeAngle: spec.kneeAngle,
      hipY: spec.hipY,
      timestamp: t,
    })
    phaseDetector = phaseResult.state
    lastPhase = phaseResult.phase

    const repResult = updateRepCounter(repCounter, {
      phase: phaseResult.phase,
      transitioned: phaseResult.transitioned,
      frame,
      angles,
      hipY: spec.hipY,
      smoothedKneeAngle: phaseResult.smoothedKneeAngle,
      standingKneeBaseline: phaseDetector.standingKneeAngle,
      standingHipY: phaseDetector.standingHipY,
    })
    repCounter = repResult.state

    if (spec.timestamp === undefined) {
      t += frameMs
    }
  })

  return {
    phaseDetector,
    repCounter,
    lastPhase,
    reps: repCounter.reps,
  }
}
