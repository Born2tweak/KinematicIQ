import type { RepMetrics } from '../cv/types'
import { activateAnalysisPipeline } from '../analysis/setActivation'
import {
  createPhaseDetectorState,
  updatePhaseDetector,
  type PhaseDetectorState,
} from '../analysis/phaseDetector'
import {
  createRepCounterState,
  updateRepCounter,
  type RepCounterState,
} from '../analysis/repCounter'
import {
  makeAngles,
  makeFrame,
  landmarksWithHipVisibility,
  repeat,
} from './squatFixtures'

export interface SquatFrameSpec {
  knee: number
  hip: number
  poseConfidence?: number
  /** When set, hips use low visibility (chair / seated heuristic). */
  hipVisibility?: number
}

export interface PipelineRunOptions {
  calibratedHipY?: number
  standingKneeBaseline?: number
  /** Seed phase + rep counter mid-descent (READY → ACTIVE). */
  activateMidDescent?: boolean
  frameMs?: number
}

export interface PipelineRunResult {
  phaseState: PhaseDetectorState
  repState: RepCounterState
  repCount: number
  reps: RepMetrics[]
}

/**
 * Drive phase detector + rep counter with synthetic knee/hip scripts (no camera).
 */
export function runSquatPipeline(
  script: SquatFrameSpec[],
  options: PipelineRunOptions = {},
): PipelineRunResult {
  const frameMs = options.frameMs ?? 33
  const calibratedHipY = options.calibratedHipY ?? 0.4

  let phaseState = createPhaseDetectorState()
  if (options.standingKneeBaseline != null) {
    phaseState = {
      ...phaseState,
      standingKneeAngle: options.standingKneeBaseline,
      standingHipY: calibratedHipY,
    }
  }

  let repState = createRepCounterState()
  let startIndex = 0

  if (options.activateMidDescent && script.length > 0) {
    const first = script[0]
    const frame = makeFrame(0, 0, first.poseConfidence ?? 0.85)
    if (first.hipVisibility !== undefined) {
      frame.landmarks = landmarksWithHipVisibility(first.hipVisibility)
    }
    const angles = makeAngles(first.knee)
    const activated = activateAnalysisPipeline({
      frame,
      angles,
      hipY: first.hip,
      calibratedHipY,
      trackingKneeAngle: first.knee,
      standingKneeAngle: options.standingKneeBaseline ?? 168,
    })
    phaseState = activated.phaseDetector
    repState = activated.repCounter
    startIndex = 1
  }

  let t = startIndex * frameMs

  for (let i = startIndex; i < script.length; i++) {
    const spec = script[i]
    const frame = makeFrame(i, t, spec.poseConfidence ?? 0.85)
    if (spec.hipVisibility !== undefined) {
      frame.landmarks = landmarksWithHipVisibility(spec.hipVisibility)
    }
    const angles = makeAngles(spec.knee)

    const phaseResult = updatePhaseDetector(phaseState, {
      kneeAngle: spec.knee,
      hipY: spec.hip,
      timestamp: t,
    })
    phaseState = phaseResult.state

    const repResult = updateRepCounter(repState, {
      phase: phaseResult.phase,
      transitioned: phaseResult.transitioned,
      frame,
      angles,
      hipY: spec.hip,
      smoothedKneeAngle: phaseResult.smoothedKneeAngle,
      standingKneeBaseline: phaseState.standingKneeAngle,
      standingHipY: phaseState.standingHipY,
    })
    repState = repResult.state
    t += frameMs
  }

  return {
    phaseState,
    repState,
    repCount: repState.repCount,
    reps: repState.reps,
  }
}

/** One full deep squat: stand → descend → bottom → return upright. */
export function deepSquatRepScript(): SquatFrameSpec[] {
  return [
    ...repeat(6, { knee: 170, hip: 0.4 }),
    ...repeat(4, { knee: 145, hip: 0.46 }),
    ...repeat(4, { knee: 125, hip: 0.5 }),
    ...repeat(5, { knee: 95, hip: 0.56 }),
    ...repeat(4, { knee: 115, hip: 0.52 }),
    ...repeat(4, { knee: 135, hip: 0.48 }),
    ...repeat(8, { knee: 168, hip: 0.41 }),
  ]
}

/** Shallow bend — never reaches bottom threshold. */
export function partialSquatScript(): SquatFrameSpec[] {
  return [
    ...repeat(6, { knee: 170, hip: 0.4 }),
    ...repeat(5, { knee: 135, hip: 0.46 }),
    ...repeat(6, { knee: 168, hip: 0.41 }),
  ]
}

/** Chair bounce: large hip drop with low hip landmark visibility (≥500ms). */
export function chairBounceScript(): SquatFrameSpec[] {
  return [
    ...repeat(8, { knee: 170, hip: 0.4 }),
    ...repeat(18, { knee: 115, hip: 0.74, hipVisibility: 0.15 }),
    ...repeat(10, { knee: 168, hip: 0.41 }),
  ]
}
