import { describe, expect, it } from 'vitest'
import { SQUAT_PROTOCOL_DEFINITION } from '../protocols/squat'
import { buildCameraSessionViewModel } from './cameraSessionController'

describe('camera session controller', () => {
  it('uses protocol-owned view copy when no live guidance exists', () => {
    const model = buildCameraSessionViewModel({
      protocol: SQUAT_PROTOCOL_DEFINITION,
      phase: 'WAITING',
      repCount: 0,
      finishCountdown: null,
      missingJoints: ['Full Body'],
      guidance: null,
      readiness: null,
    })
    expect(model.workflowStage).toBe('cameraCheck')
    expect(model.status.title).toMatch(/Face the camera square-on/)
    expect(model.setupInstructions).toContain(
      'Place the camera near hip height, about 3–4 m away.',
    )
  })

  it('preserves dynamic readiness guidance when available', () => {
    const model = buildCameraSessionViewModel({
      protocol: SQUAT_PROTOCOL_DEFINITION,
      phase: 'WAITING',
      repCount: 0,
      finishCountdown: null,
      missingJoints: [],
      guidance: { ok: false, instruction: 'Move back', detail: 'Keep feet visible.' },
      readiness: null,
    })
    expect(model.status).toEqual({ title: 'Move back', subtitle: 'Keep feet visible.' })
  })
})

