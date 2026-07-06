import { describe, expect, it } from 'vitest'
import { DEFAULT_MODEL_VERSION, makeProvenance } from './provenance'

describe('core/provenance', () => {
  it('fills defaults for model version and filter variant', () => {
    const p = makeProvenance({ captureSource: 'live' })
    expect(p.captureSource).toBe('live')
    expect(p.modelVersion).toBe(DEFAULT_MODEL_VERSION)
    expect(p.filterVariant).toBe('raw')
  })

  it('lets callers override any field', () => {
    const p = makeProvenance({
      captureSource: 'replay',
      filterVariant: 'one-euro-live',
      protocolId: 'front-view-squat-v1',
      tapeId: 'session-c',
      recordedAt: '2026-07-05T00:00:00Z',
    })
    expect(p.filterVariant).toBe('one-euro-live')
    expect(p.protocolId).toBe('front-view-squat-v1')
    expect(p.tapeId).toBe('session-c')
    expect(p.recordedAt).toBe('2026-07-05T00:00:00Z')
  })

  it('does not fabricate unknown optional fields', () => {
    const p = makeProvenance({ captureSource: 'synthetic' })
    expect('protocolId' in p).toBe(false)
    expect('tapeId' in p).toBe(false)
  })
})
