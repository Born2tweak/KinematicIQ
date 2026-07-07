/**
 * Assessment workflow state model (M41).
 *
 * The typed, protocol-agnostic capture workflow (R11 workflow states; R08
 * evented pipeline), extracted so protocol-specific preparation, quality
 * review, and retake flows can be added without growing CameraScreen's
 * ref/state tangle. Pure: no DOM, no camera, no React.
 *
 * M41 scope: model + reducer + camera-phase mapping only. CameraScreen uses
 * it for DISPLAY state (a `data-workflow-stage` attribute); the detection
 * loop and existing auto-start/auto-finish state stay exactly where they
 * are. The `qualityReview` stage exists in the model but is not routed to by
 * the live flow yet — the M51 quality-review screen will enter it; today the
 * quality gate runs inside results.
 */
import type { ProtocolId } from '../core/protocol'
import type { CameraSessionPhase } from '../screens/cameraSessionUi'

/** The nine workflow stages, in the order a nominal assessment visits them. */
export type AssessmentStage =
  | 'select'
  | 'prepare'
  | 'cameraCheck'
  | 'calibrate'
  | 'ready'
  | 'capture'
  | 'autoFinishPending'
  | 'qualityReview'
  | 'results'

export type AssessmentEvent =
  | { type: 'protocolSelected'; protocolId: ProtocolId }
  | { type: 'preparationDone' }
  | { type: 'cameraReady' }
  | { type: 'cameraFailed'; message: string }
  | { type: 'cameraRetry' }
  | { type: 'calibrationStarted' }
  | { type: 'calibrationComplete' }
  | { type: 'captureStarted' }
  | { type: 'finishPending' }
  | { type: 'finishCancelled' }
  | { type: 'captureFinished' }
  | { type: 'reviewAccepted' }
  | { type: 'retakeRequested' }
  | { type: 'reset' }

export interface AssessmentWorkflowState {
  stage: AssessmentStage
  /** Selected movement; null before selection (squat is preselected today). */
  protocolId: ProtocolId | null
  /** Camera/setup error to surface; null when none. */
  error: string | null
}

export function createAssessmentWorkflow(
  protocolId: ProtocolId | null = null,
): AssessmentWorkflowState {
  return {
    stage: protocolId === null ? 'select' : 'prepare',
    protocolId,
    error: null,
  }
}

/**
 * Legal transitions per stage. Events not listed for the current stage are
 * ignored (reducer returns the state unchanged) — camera callbacks can fire
 * out of order and must never corrupt the workflow.
 */
const TRANSITIONS: Record<
  AssessmentStage,
  Partial<Record<AssessmentEvent['type'], AssessmentStage>>
> = {
  select: { protocolSelected: 'prepare' },
  prepare: { preparationDone: 'cameraCheck' },
  cameraCheck: {
    cameraReady: 'calibrate',
    calibrationStarted: 'calibrate',
    cameraFailed: 'cameraCheck',
    cameraRetry: 'cameraCheck',
  },
  calibrate: {
    calibrationComplete: 'ready',
    cameraFailed: 'cameraCheck',
  },
  ready: {
    captureStarted: 'capture',
    cameraFailed: 'cameraCheck',
  },
  capture: {
    finishPending: 'autoFinishPending',
    captureFinished: 'qualityReview',
    cameraFailed: 'cameraCheck',
  },
  autoFinishPending: {
    finishCancelled: 'capture',
    captureFinished: 'qualityReview',
    cameraFailed: 'cameraCheck',
  },
  qualityReview: {
    reviewAccepted: 'results',
    retakeRequested: 'cameraCheck',
  },
  results: {
    retakeRequested: 'cameraCheck',
  },
}

/**
 * Pure transition reducer. Illegal events for the current stage are no-ops;
 * `reset` is always legal and returns to the initial state for the current
 * protocol; `cameraFailed`/`cameraRetry` manage the error field wherever the
 * transition table allows them.
 */
export function advanceWorkflow(
  state: AssessmentWorkflowState,
  event: AssessmentEvent,
): AssessmentWorkflowState {
  if (event.type === 'reset') {
    return createAssessmentWorkflow(state.protocolId)
  }

  const nextStage = TRANSITIONS[state.stage][event.type]
  if (nextStage === undefined) {
    return state
  }

  switch (event.type) {
    case 'protocolSelected':
      return { stage: nextStage, protocolId: event.protocolId, error: null }
    case 'cameraFailed':
      return { ...state, stage: nextStage, error: event.message }
    case 'cameraRetry':
      return { ...state, stage: nextStage, error: null }
    default:
      return { ...state, stage: nextStage, error: null }
  }
}

/**
 * Map today's camera-session phase onto the workflow model — the bridge that
 * lets CameraScreen report a workflow stage without moving any behavior.
 * FINISHED maps to `results` (not `qualityReview`): the live flow currently
 * routes straight to the report, where the quality gate renders its verdict.
 */
export function workflowStageForCameraPhase(
  phase: CameraSessionPhase,
): AssessmentStage {
  switch (phase) {
    case 'WAITING':
      return 'cameraCheck'
    case 'CALIBRATING':
      return 'calibrate'
    case 'READY':
      return 'ready'
    case 'ACTIVE':
      return 'capture'
    case 'AUTO_FINISH_PENDING':
      return 'autoFinishPending'
    case 'FINISHED':
      return 'results'
  }
}
