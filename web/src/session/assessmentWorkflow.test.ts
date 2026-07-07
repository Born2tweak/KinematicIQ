import { describe, expect, it } from 'vitest'
import {
  advanceWorkflow,
  createAssessmentWorkflow,
  workflowStageForCameraPhase,
  type AssessmentEvent,
  type AssessmentWorkflowState,
} from './assessmentWorkflow'
import type { CameraSessionPhase } from '../screens/cameraSessionUi'

function run(
  state: AssessmentWorkflowState,
  events: AssessmentEvent[],
): AssessmentWorkflowState {
  return events.reduce(advanceWorkflow, state)
}

describe('createAssessmentWorkflow', () => {
  it('starts at select with no protocol', () => {
    expect(createAssessmentWorkflow()).toEqual({
      stage: 'select',
      protocolId: null,
      error: null,
    })
  })

  it('starts at prepare when a protocol is preselected (squat today)', () => {
    expect(createAssessmentWorkflow('squat').stage).toBe('prepare')
  })
})

describe('advanceWorkflow — nominal capture path', () => {
  it('walks select → results through every stage', () => {
    let state = createAssessmentWorkflow()
    const path: Array<[AssessmentEvent, string]> = [
      [{ type: 'protocolSelected', protocolId: 'squat' }, 'prepare'],
      [{ type: 'preparationDone' }, 'cameraCheck'],
      [{ type: 'cameraReady' }, 'calibrate'],
      [{ type: 'calibrationComplete' }, 'ready'],
      [{ type: 'captureStarted' }, 'capture'],
      [{ type: 'finishPending' }, 'autoFinishPending'],
      [{ type: 'captureFinished' }, 'qualityReview'],
      [{ type: 'reviewAccepted' }, 'results'],
    ]
    for (const [event, expectedStage] of path) {
      state = advanceWorkflow(state, event)
      expect(state.stage).toBe(expectedStage)
    }
    expect(state.protocolId).toBe('squat')
    expect(state.error).toBeNull()
  })
})

describe('advanceWorkflow — cancel, retake, error, finish', () => {
  const atCapture = run(createAssessmentWorkflow('squat'), [
    { type: 'preparationDone' },
    { type: 'cameraReady' },
    { type: 'calibrationComplete' },
    { type: 'captureStarted' },
  ])

  it('cancelling a pending finish returns to capture (squat again)', () => {
    const pending = advanceWorkflow(atCapture, { type: 'finishPending' })
    expect(pending.stage).toBe('autoFinishPending')
    expect(advanceWorkflow(pending, { type: 'finishCancelled' }).stage).toBe(
      'capture',
    )
  })

  it('finishing from capture or pending reaches qualityReview', () => {
    expect(
      advanceWorkflow(atCapture, { type: 'captureFinished' }).stage,
    ).toBe('qualityReview')
    const pending = advanceWorkflow(atCapture, { type: 'finishPending' })
    expect(
      advanceWorkflow(pending, { type: 'captureFinished' }).stage,
    ).toBe('qualityReview')
  })

  it('retake from review or results goes back to cameraCheck', () => {
    const review = advanceWorkflow(atCapture, { type: 'captureFinished' })
    expect(
      advanceWorkflow(review, { type: 'retakeRequested' }).stage,
    ).toBe('cameraCheck')
    const results = advanceWorkflow(review, { type: 'reviewAccepted' })
    expect(
      advanceWorkflow(results, { type: 'retakeRequested' }).stage,
    ).toBe('cameraCheck')
  })

  it('camera failure from any camera-bound stage records the error', () => {
    const failed = advanceWorkflow(atCapture, {
      type: 'cameraFailed',
      message: 'Camera permission denied.',
    })
    expect(failed.stage).toBe('cameraCheck')
    expect(failed.error).toBe('Camera permission denied.')
    const retried = advanceWorkflow(failed, { type: 'cameraRetry' })
    expect(retried.stage).toBe('cameraCheck')
    expect(retried.error).toBeNull()
  })

  it('reset returns to the initial state for the current protocol', () => {
    const reset = advanceWorkflow(atCapture, { type: 'reset' })
    expect(reset).toEqual(createAssessmentWorkflow('squat'))
  })
})

describe('advanceWorkflow — illegal events are no-ops', () => {
  it('ignores out-of-order camera events without corrupting state', () => {
    const initial = createAssessmentWorkflow('squat')
    // None of these are legal from `prepare`.
    const events: AssessmentEvent[] = [
      { type: 'captureFinished' },
      { type: 'finishPending' },
      { type: 'reviewAccepted' },
      { type: 'calibrationComplete' },
    ]
    for (const event of events) {
      expect(advanceWorkflow(initial, event)).toBe(initial)
    }
  })
})

describe('workflowStageForCameraPhase', () => {
  it('maps every existing camera phase onto the model', () => {
    const expected: Record<CameraSessionPhase, string> = {
      WAITING: 'cameraCheck',
      CALIBRATING: 'calibrate',
      READY: 'ready',
      ACTIVE: 'capture',
      AUTO_FINISH_PENDING: 'autoFinishPending',
      FINISHED: 'results',
    }
    for (const [phase, stage] of Object.entries(expected)) {
      expect(workflowStageForCameraPhase(phase as CameraSessionPhase)).toBe(
        stage,
      )
    }
  })
})
