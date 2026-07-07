/**
 * Test-only camera loop simulator — mirrors the analysis decisions of
 * CameraScreen's requestAnimationFrame loop (filter → calibration →
 * auto-start → activation → phase → rep counter → auto-finish) against any
 * CameraSource, without a DOM, canvas, or React.
 *
 * Exists so pose-tape fixtures are proven against the REAL pipeline before
 * any browser e2e runs: if the clean-squat tape can't count a rep here, it
 * can't count one in Playwright either.
 */
import { getJointAngles } from '../../analysis/angles'
import {
  createAutoFinishState,
  updateAutoFinish,
} from '../../analysis/autoFinish'
import {
  createAutoStartState,
  updateAutoStart,
  type AutoStartPhase,
} from '../../analysis/autoStart'
import { safeLandmark } from '../../analysis/geometry'
import { updatePhaseDetector } from '../../analysis/phaseDetector'
import { updateRepCounter } from '../../analysis/repCounter'
import {
  activateAnalysisPipeline,
  createFreshAnalysisPipeline,
} from '../../analysis/setActivation'
import {
  assessCaptureReadiness,
  type CaptureReadinessState,
} from '../../cv/captureReadiness'
import { checkCalibration } from '../../cv/drawCalibration'
import { createLiveStreamFilter } from '../../cv/landmarkFilter'
import { LANDMARK_INDICES, type PoseFrame } from '../../cv/types'
import type { CameraSource } from '../cameraSource'

export interface CameraLoopSimResult {
  autoStartPhase: AutoStartPhase
  repCount: number
  /** Guidance instructions observed while in setup (WAITING). */
  setupInstructions: string[]
  /** Readiness states observed while in setup (WAITING). */
  readinessStates: CaptureReadinessState[]
  /** True if auto-finish ever requested navigation during the run. */
  autoFinishFired: boolean
}

function computeHipY(frame: PoseFrame): number | null {
  const leftHip = safeLandmark(frame, LANDMARK_INDICES.LEFT_HIP)
  const rightHip = safeLandmark(frame, LANDMARK_INDICES.RIGHT_HIP)
  return leftHip && rightHip ? (leftHip.y + rightHip.y) / 2 : null
}

function trackingKnee(angles: ReturnType<typeof getJointAngles>): number | null {
  const knees = [angles.leftKnee, angles.rightKnee].filter(
    (value): value is number => value !== null,
  )
  return knees.length === 0 ? null : Math.min(...knees)
}

/**
 * Run the camera analysis loop against a source for `durationMs` of simulated
 * wall clock at `stepMs` per tick (default ≈60fps rAF cadence).
 */
export function simulateCameraLoop(
  source: CameraSource,
  durationMs: number,
  stepMs = 1000 / 60,
): CameraLoopSimResult {
  const filter = createLiveStreamFilter()
  let autoStart = createAutoStartState()
  let autoFinish = createAutoFinishState()
  let pipeline = createFreshAnalysisPipeline()
  let phaseDetector = pipeline.phaseDetector
  let repCounter = pipeline.repCounter
  let autoFinishFired = false

  const setupInstructions = new Set<string>()
  const readinessStates = new Set<CaptureReadinessState>()

  let frameIndex = 0
  const startMs = 1000
  for (let t = startMs; t < startMs + durationMs; t += stepMs) {
    const rawFrame = source.getFrame(t, frameIndex)
    const poseFrame = rawFrame ? filter.filter(rawFrame) : null
    const setupPhase = autoStart.phase === 'WAITING'

    if (setupPhase) {
      const readiness = assessCaptureReadiness(poseFrame)
      setupInstructions.add(readiness.guidance.instruction)
      readinessStates.add(readiness.state)
    }

    if (!poseFrame) {
      frameIndex++
      continue
    }

    const calibration = checkCalibration(poseFrame)
    const angles = getJointAngles(poseFrame)
    const hipY = computeHipY(poseFrame)

    const autoResult = updateAutoStart(autoStart, {
      calibration,
      angles,
      hipY,
      poseConfidence: poseFrame.poseConfidence,
    })
    autoStart = autoResult.state

    if (autoResult.transitioned && autoResult.phase === 'READY') {
      const fresh = createFreshAnalysisPipeline()
      filter.reset()
      phaseDetector = fresh.phaseDetector
      repCounter = fresh.repCounter
      autoFinish = createAutoFinishState()
    }

    if (autoResult.transitioned && autoResult.phase === 'ACTIVE') {
      autoFinish = createAutoFinishState()
      if (autoResult.activatedByDescent) {
        const activated = activateAnalysisPipeline({
          frame: poseFrame,
          angles,
          hipY,
          calibratedHipY: autoStart.calibratedHipY,
          trackingKneeAngle: trackingKnee(angles),
          standingKneeAngle: phaseDetector.standingKneeAngle,
        })
        phaseDetector = activated.phaseDetector
        repCounter = activated.repCounter
      } else {
        pipeline = createFreshAnalysisPipeline()
        phaseDetector = pipeline.phaseDetector
        repCounter = pipeline.repCounter
      }
    }

    if (autoResult.phase === 'ACTIVE') {
      const phaseResult = updatePhaseDetector(phaseDetector, {
        kneeAngle: trackingKnee(angles),
        hipY,
        timestamp: poseFrame.timestamp,
      })
      phaseDetector = phaseResult.state

      const repResult = updateRepCounter(repCounter, {
        phase: phaseResult.phase,
        transitioned: phaseResult.transitioned,
        frame: poseFrame,
        angles,
        hipY,
        smoothedKneeAngle: phaseResult.smoothedKneeAngle,
        standingKneeBaseline: phaseDetector.standingKneeAngle,
        standingHipY: phaseDetector.standingHipY,
      })
      repCounter = repResult.state

      const finishResult = updateAutoFinish(autoFinish, {
        timestamp: poseFrame.timestamp,
        squatPhase: phaseDetector.phase,
        kneeAngle: phaseResult.smoothedKneeAngle,
        completedRepCount: repCounter.repCount,
        isActive: true,
      })
      autoFinish = finishResult.state
      if (finishResult.shouldFinish) {
        autoFinishFired = true
      }
    }

    frameIndex++
  }

  return {
    autoStartPhase: autoStart.phase,
    repCount: repCounter.repCount,
    setupInstructions: [...setupInstructions],
    readinessStates: [...readinessStates],
    autoFinishFired,
  }
}
