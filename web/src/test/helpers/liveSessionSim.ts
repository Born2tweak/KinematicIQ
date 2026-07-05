/**
 * Live-session simulator for replay-parity tests (finding #7).
 *
 * Reproduces CameraScreen's per-frame loop over synthetic RAW frames: One-Euro
 * filtering, auto-start (WAITING → CALIBRATING → READY → ACTIVE), the filter
 * reset + tape-recording rules at READY, activation seeding
 * (`activateAnalysisPipeline` / `beginSetDuringDescent`), and the analysis FSM
 * while ACTIVE. Produces both the live outputs AND the pose tape exactly as a
 * real session stores it, so tests can assert `replayTape(tape)` reproduces
 * the live results bit-for-bit.
 *
 * Any behavior change in CameraScreen's loop must be mirrored here — this
 * helper is the executable specification of the live entry state.
 */
import { getJointAngles } from '../../analysis/angles'
import { safeLandmark } from '../../analysis/geometry'
import {
  updatePhaseDetector,
  type PhaseDetectorState,
} from '../../analysis/phaseDetector'
import {
  updateRepCounter,
  type RepCounterState,
  type RepRejection,
} from '../../analysis/repCounter'
import {
  createAutoStartState,
  updateAutoStart,
} from '../../analysis/autoStart'
import {
  activateAnalysisPipeline,
  createFreshAnalysisPipeline,
} from '../../analysis/setActivation'
import { checkCalibration } from '../../cv/drawCalibration'
import { createLiveStreamFilter } from '../../cv/landmarkFilter'
import {
  createTape,
  createTapeRecorder,
  estimateFps,
  type PoseTape,
  type PoseTapeEntryState,
} from '../../eval/poseTape'
import {
  LANDMARK_INDICES,
  type NormalizedLandmark,
  type PoseFrame,
  type RepMetrics,
  type SquatState,
} from '../../cv/types'
import { createLandmarks, createLandmark } from '../fixtures/poseFixtures'

// ── Geometric squat frame synthesis ─────────────────────────────────
// Landmarks are placed so `getJointAngles` reads real knee/trunk angles
// from geometry — required because tape replay recomputes angles from
// landmarks rather than accepting injected values.

const KNEE_Y = 0.6
const ANKLE_Y = 0.75
const SEGMENT = 0.15
const VIS = 0.92

/** Build a full-body frame whose knee landmarks encode `kneeAngleDeg`. */
export function syntheticSquatFrame(opts: {
  frameIndex: number
  timestamp: number
  kneeAngleDeg: number
  poseConfidence?: number
}): PoseFrame {
  const { kneeAngleDeg } = opts
  // Hip sits on a circle around the knee: angle between the (downward)
  // knee→ankle vector and the knee→hip vector equals the knee angle.
  const phi = ((180 - kneeAngleDeg) * Math.PI) / 180
  const hipDx = Math.sin(phi) * SEGMENT
  const hipDy = -Math.cos(phi) * SEGMENT
  const hipY = KNEE_Y + hipDy

  const leg = (kneeX: number, hipX: number): Record<string, NormalizedLandmark> => ({
    hip: createLandmark(hipX, hipY, VIS),
    knee: createLandmark(kneeX, KNEE_Y, VIS),
    ankle: createLandmark(kneeX, ANKLE_Y, VIS),
    foot: createLandmark(kneeX, ANKLE_Y + 0.04, VIS),
  })

  const left = leg(0.44, 0.44 + hipDx)
  const right = leg(0.56, 0.56 + hipDx)

  const landmarks = createLandmarks({
    [LANDMARK_INDICES.LEFT_SHOULDER]: createLandmark(
      0.44 + hipDx,
      hipY - 0.28,
      VIS,
    ),
    [LANDMARK_INDICES.RIGHT_SHOULDER]: createLandmark(
      0.56 + hipDx,
      hipY - 0.28,
      VIS,
    ),
    [LANDMARK_INDICES.LEFT_HIP]: left.hip,
    [LANDMARK_INDICES.RIGHT_HIP]: right.hip,
    [LANDMARK_INDICES.LEFT_KNEE]: left.knee,
    [LANDMARK_INDICES.RIGHT_KNEE]: right.knee,
    [LANDMARK_INDICES.LEFT_ANKLE]: left.ankle,
    [LANDMARK_INDICES.RIGHT_ANKLE]: right.ankle,
    [LANDMARK_INDICES.LEFT_FOOT_INDEX]: left.foot,
    [LANDMARK_INDICES.RIGHT_FOOT_INDEX]: right.foot,
  })

  return {
    frameIndex: opts.frameIndex,
    timestamp: opts.timestamp,
    landmarks,
    worldLandmarks: [],
    poseConfidence: opts.poseConfidence ?? 0.85,
  }
}

/** Knee-angle script for a full session: calibration hold then squat cycles. */
export function syntheticSessionKneeScript(repCount = 3): number[] {
  const script: number[] = []
  // Calibration: >60 stable upright frames (auto-start requirement).
  for (let i = 0; i < 70; i++) script.push(172)
  for (let rep = 0; rep < repCount; rep++) {
    for (const angle of [150, 138, 125, 112]) script.push(angle) // descent
    for (let i = 0; i < 6; i++) script.push(95) // bottom hold
    for (const angle of [112, 128, 142, 156]) script.push(angle) // ascent
    for (let i = 0; i < 10; i++) script.push(172) // lockout hold
  }
  for (let i = 0; i < 6; i++) script.push(172)
  return script
}

export interface LiveSessionSimResult {
  /** The pose tape exactly as CameraScreen stores it at finish. */
  tape: PoseTape
  reps: RepMetrics[]
  rejections: RepRejection[]
  /** FSM phase per ACTIVE frame, in order (for phase-parity assertions). */
  phases: SquatState[]
  entryState: PoseTapeEntryState | null
}

function computeHipY(frame: PoseFrame): number | null {
  const leftHip = safeLandmark(frame, LANDMARK_INDICES.LEFT_HIP)
  const rightHip = safeLandmark(frame, LANDMARK_INDICES.RIGHT_HIP)
  return leftHip && rightHip ? (leftHip.y + rightHip.y) / 2 : null
}

/** Run raw frames through the exact live camera loop (see module docs). */
export function simulateLiveSession(
  rawFrames: readonly PoseFrame[],
): LiveSessionSimResult {
  const filter = createLiveStreamFilter()
  const recorder = createTapeRecorder()
  let autoStart = createAutoStartState()
  let pipeline: {
    phaseDetector: PhaseDetectorState
    repCounter: RepCounterState
  } = createFreshAnalysisPipeline()
  let entryState: PoseTapeEntryState | null = null
  let analysisStartFrameIndex: number | null = null
  const phases: SquatState[] = []

  for (const rawFrame of rawFrames) {
    const poseFrame = filter.filter(rawFrame)
    const calResult = checkCalibration(poseFrame)
    const angles = getJointAngles(poseFrame)
    const hipY = computeHipY(poseFrame)

    const autoResult = updateAutoStart(autoStart, {
      calibration: calResult,
      angles,
      hipY,
      poseConfidence: poseFrame.poseConfidence,
    })
    autoStart = autoResult.state

    if (autoResult.transitioned && autoResult.phase === 'READY') {
      pipeline = createFreshAnalysisPipeline()
      filter.reset()
      recorder.reset()
      analysisStartFrameIndex = null
    }

    if (autoResult.transitioned && autoResult.phase === 'ACTIVE') {
      entryState = {
        calibratedHipY: autoStart.calibratedHipY,
        standingKneeAngle: pipeline.phaseDetector.standingKneeAngle,
        activatedByDescent: autoResult.activatedByDescent,
      }
      analysisStartFrameIndex = recorder.count

      const kneeAngles = [angles.leftKnee, angles.rightKnee].filter(
        (value): value is number => value !== null,
      )
      const trackingKneeAngle =
        kneeAngles.length === 0 ? null : Math.min(...kneeAngles)

      if (autoResult.activatedByDescent) {
        pipeline = activateAnalysisPipeline({
          frame: poseFrame,
          angles,
          hipY,
          calibratedHipY: autoStart.calibratedHipY,
          trackingKneeAngle,
          standingKneeAngle: pipeline.phaseDetector.standingKneeAngle,
        })
      } else {
        pipeline = createFreshAnalysisPipeline()
      }
    }

    if (autoResult.phase === 'ACTIVE') {
      const kneeAngles = [angles.leftKnee, angles.rightKnee].filter(
        (value): value is number => value !== null,
      )
      const trackingKneeAngle =
        kneeAngles.length === 0 ? null : Math.min(...kneeAngles)

      const phaseResult = updatePhaseDetector(pipeline.phaseDetector, {
        kneeAngle: trackingKneeAngle,
        hipY,
        timestamp: poseFrame.timestamp,
      })
      const repResult = updateRepCounter(pipeline.repCounter, {
        phase: phaseResult.phase,
        transitioned: phaseResult.transitioned,
        frame: poseFrame,
        angles,
        hipY,
        smoothedKneeAngle: phaseResult.smoothedKneeAngle,
        standingKneeBaseline: phaseResult.state.standingKneeAngle,
        standingHipY: phaseResult.state.standingHipY,
      })
      pipeline = { phaseDetector: phaseResult.state, repCounter: repResult.state }
      phases.push(phaseResult.phase)
    }

    const tapeThisFrame =
      (autoResult.phase === 'READY' && !autoResult.transitioned) ||
      autoResult.phase === 'ACTIVE'
    if (tapeThisFrame) {
      recorder.record(rawFrame)
    }
  }

  const frames = recorder.build({ fps: 0 }).frames
  const tape = createTape(
    frames,
    {
      fps: estimateFps(frames),
      label: 'live-session-sim',
      source: 'live',
      filtering: 'one-euro-live',
      entryState: entryState ?? undefined,
      analysisStartFrameIndex: analysisStartFrameIndex ?? 0,
    },
    {
      countedReps: pipeline.repCounter.reps.length,
      rejections: pipeline.repCounter.rejections,
    },
  )

  return {
    tape,
    reps: pipeline.repCounter.reps,
    rejections: pipeline.repCounter.rejections,
    phases,
    entryState,
  }
}
