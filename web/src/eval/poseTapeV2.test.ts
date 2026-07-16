import { describe, expect, it } from 'vitest'
import { buildSyntheticInlineLungeFrames } from '../protocols/inlineLunge/fixtures'
import { createEvidenceTapeV2, deserializeTape, serializeTape, type PoseTapeEvidenceV2 } from './poseTape'

const sha = 'a'.repeat(64)
const evidence = (overrides: Partial<PoseTapeEvidenceV2> = {}): PoseTapeEvidenceV2 => ({
  protocolId: 'forwardLungeStrideReturn', observationProtocolId: 'side-view-forward-lunge-stride-return-v1',
  protocolParameters: { leadSide: 'left' }, rawFrameAuthority: true, sourceSha256: sha,
  subjectKey: 'subject-001', sessionKey: 'session-001', device: { class: 'synthetic', fps: 30, view: 'side' },
  captureVersion: 'capture-v1', processingVersion: 'raw-v1', transformations: [], labelSets: [], split: 'validation', frozen: true,
  ...overrides,
})

describe('PoseTape v2 evidence envelope', () => {
  it('round trips a canonical raw evidence tape', () => {
    const tape = createEvidenceTapeV2(buildSyntheticInlineLungeFrames(), { fps: 30, source: 'synthetic' }, evidence())
    const restored = deserializeTape(serializeTape(tape))
    expect(restored.schemaVersion).toBe(2)
    expect(restored.evidence?.protocolId).toBe('forwardLungeStrideReturn')
    expect(restored.meta.framesFiltered).toBe(false)
  })
  it('normalizes legacy observation ids without rewriting source JSON', () => {
    const restored = deserializeTape(JSON.stringify({ meta: { fps: 30, protocolId: 'side-view-inline-lunge-v1' }, frames: [] }))
    expect(restored.schemaVersion).toBe(1)
    expect(restored.meta.protocolId).toBe('side-view-forward-lunge-stride-return-v1')
  })
  it('rejects unsafe identity, missing checksums, lead-side mismatch, and tuning leakage', () => {
    expect(() => createEvidenceTapeV2([], { fps: 30 }, evidence({ sourceSha256: 'bad' }))).toThrow(/SHA-256/)
    expect(() => createEvidenceTapeV2([], { fps: 30 }, evidence({ subjectKey: '../person' }))).toThrow(/safe key/)
    expect(() => createEvidenceTapeV2([], { fps: 30 }, evidence({ protocolParameters: {} }))).toThrow(/leadSide/)
    expect(() => createEvidenceTapeV2([], { fps: 30 }, evidence({ split: 'development', frozen: true }))).toThrow(/development/)
  })
})
