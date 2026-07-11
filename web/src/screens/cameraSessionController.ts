import type { ProtocolDefinition } from '../core/protocol'
import { workflowStageForCameraPhase } from '../session/assessmentWorkflow'
import type { CaptureGuidance } from '../cv/captureGuidance'
import type { CaptureReadinessAssessment } from '../cv/captureReadiness'
import { getSessionStatusCopy, type CameraSessionPhase } from './cameraSessionUi'

export interface CameraSessionViewModelInput {
  protocol: ProtocolDefinition
  phase: CameraSessionPhase
  repCount: number
  finishCountdown: number | null
  missingJoints: string[]
  guidance: CaptureGuidance | null
  readiness: CaptureReadinessAssessment | null
}

/** Pure UI/controller boundary; no React, DOM, camera, or MediaPipe dependency. */
export function buildCameraSessionViewModel(input: CameraSessionViewModelInput) {
  const geometryFix =
    input.readiness?.geometryChecks.find((check) => check.status === 'fail')?.fix ?? null
  const status = getSessionStatusCopy(input.phase, {
    repCount: input.repCount,
    finishCountdown: input.finishCountdown,
    missingJoints: input.missingJoints,
    guidance: input.guidance,
    readinessState: input.readiness?.state ?? null,
    geometryFix,
  })
  return {
    workflowStage: workflowStageForCameraPhase(input.phase),
    status: input.phase === 'WAITING' && !input.guidance
      ? { title: input.protocol.capture.viewInstruction, subtitle: input.protocol.capture.setupInstructions[0] ?? '' }
      : status,
    showReadinessChecklist: input.phase === 'WAITING' && input.readiness !== null,
    viewInstruction: input.protocol.capture.viewInstruction,
    setupInstructions: [...input.protocol.capture.setupInstructions],
  }
}

