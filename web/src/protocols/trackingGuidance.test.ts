import { describe, expect, it } from 'vitest'
import type { LandmarkObservation } from '../cv/landmarkState'
import { SQUAT_PROTOCOL_DEFINITION } from './squat'
import { deriveProtocolTrackingGuidance } from './trackingGuidance'

function observation(state: LandmarkObservation['state'], landmarkIndex: number, frameIndex = 1): LandmarkObservation {
  return { state, landmarkIndex, frameIndex, raw: null, recovered: null, reason: state }
}

describe('protocol tracking guidance', () => {
  it('emits one deterministic highest-priority protocol-owned instruction', () => {
    const result = deriveProtocolTrackingGuidance([
      observation('low-confidence', 25),
      observation('out-of-frame', 27),
      observation('missing', 28),
    ], SQUAT_PROTOCOL_DEFINITION.capture)
    expect(result?.state).toBe('out-of-frame')
    expect(result?.instruction).toBe(SQUAT_PROTOCOL_DEFINITION.capture.recoveryInstructions?.['out-of-frame'])
  })

  it('returns sorted analyst evidence without anatomical-error claims', () => {
    const result = deriveProtocolTrackingGuidance([
      observation('low-confidence', 28, 4),
      observation('low-confidence', 25, 3),
      observation('low-confidence', 25, 4),
    ], SQUAT_PROTOCOL_DEFINITION.capture)
    expect(result?.evidence).toEqual({ affectedLandmarkIndices: [25, 28], affectedFrameIndices: [3, 4], observationCount: 3 })
    expect(result?.instruction).not.toMatch(/injury|fault|incorrect|anatom/i)
  })

  it('abstains for direct observations or absent protocol copy', () => {
    expect(deriveProtocolTrackingGuidance([observation('observed', 25)], SQUAT_PROTOCOL_DEFINITION.capture)).toBeNull()
    expect(deriveProtocolTrackingGuidance([observation('missing', 25)], {
      inputModes: ['live'], cameraView: 'front', viewInstruction: 'Front', setupInstructions: ['Setup'],
    })).toBeNull()
  })
})
