import { describe, expect, it } from 'vitest'
import { canManuallyFinish, getSessionStatusCopy } from './cameraSessionUi'
import type { CaptureGuidance } from '../cv/captureGuidance'

const okGuidance: CaptureGuidance = {
  ok: true,
  instruction: 'Full body detected — hold still',
  detail: null,
}

describe('screens/cameraSessionUi', () => {
  it('keeps manual finish available while automatic finish is pending', () => {
    expect(canManuallyFinish('ACTIVE')).toBe(true)
    expect(canManuallyFinish('AUTO_FINISH_PENDING')).toBe(true)
    expect(canManuallyFinish('READY')).toBe(false)
    expect(canManuallyFinish('FINISHED')).toBe(false)
  })
  it('uses the live guidance instruction as the WAITING title', () => {
    const guidance: CaptureGuidance = {
      ok: false,
      instruction: 'Step back a little',
      detail: null,
    }
    const copy = getSessionStatusCopy('WAITING', {
      repCount: 0,
      finishCountdown: null,
      missingJoints: [],
      guidance,
    })
    expect(copy.title).toBe('Step back a little')
  })

  it('surfaces the geometry fix as the marginal WAITING subtitle (M25)', () => {
    const copy = getSessionStatusCopy('WAITING', {
      repCount: 0,
      finishCountdown: null,
      missingJoints: [],
      guidance: okGuidance,
      readinessState: 'marginal',
      geometryFix:
        'Turn to face the camera square-on — this protocol needs a front view.',
    })
    expect(copy.subtitle).toBe(
      'Turn to face the camera square-on — this protocol needs a front view.',
    )
  })

  it('keeps the generic marginal subtitle when no geometry fix exists', () => {
    const copy = getSessionStatusCopy('WAITING', {
      repCount: 0,
      finishCountdown: null,
      missingJoints: [],
      guidance: okGuidance,
      readinessState: 'marginal',
      geometryFix: null,
    })
    expect(copy.subtitle).toContain('Almost there')
  })

  it('does not inject geometry copy outside the marginal state', () => {
    const copy = getSessionStatusCopy('WAITING', {
      repCount: 0,
      finishCountdown: null,
      missingJoints: [],
      guidance: { ...okGuidance, detail: 'Camera at hip height, 3–4 m away, facing you.' },
      readinessState: 'ready',
      geometryFix: 'Step back slightly so there is floor margin below your feet.',
    })
    expect(copy.subtitle).toBe('Camera at hip height, 3–4 m away, facing you.')
  })
})
