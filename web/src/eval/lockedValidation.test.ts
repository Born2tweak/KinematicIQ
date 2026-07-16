import { describe, expect, it } from 'vitest'
import { buildLockedValidationReport, preflightLockedValidation, recomputeLockedSummary, type LockedGateResult, type LockedRunInput, type LockedSequenceResult } from './lockedValidation'
import { REQUIRED_LOCKED_GATE_IDS } from './validationFreeze'

const sha = 'a'.repeat(64)
const manifest = { schemaVersion: 1 as const, studyId: 'locked-fixture', sources: [{ id: 'source-1', sha256: sha, subjectKey: 'subject-1', sessionKey: 'session-1', protocolId: 'forwardLungeStrideReturn' as const, observationProtocolId: 'side-view-forward-lunge-stride-return-v1', leadSide: 'left' as const, split: 'test' as const, consent: 'consented-study' as const, use: 'locked-validation' as const, frozen: true, relativePath: 'private/source-1.json' }], labelSets: ['a', 'b', 'adjudicator'].map(raterKey => ({ id: `labels-${raterKey}`, sourceId: 'source-1', sha256: sha, raterKey, frozen: true })), transformations: [] }
const input = (): LockedRunInput => ({ certificate: { schemaVersion: 1, packageId: 'freeze-v1', packageSha256: sha, status: 'frozen', blockers: [], subjectCounts: { locked: 1 } }, expectedPackageSha256: sha, observedPackageSha256: sha, manifest })
const row: LockedSequenceResult = { sourceId: 'source-1', subjectKey: 'subject-1', expectedCount: 1, observedCount: 1, expectedComplete: true, observedComplete: true, invalidCapture: false, abstained: false, wrongMovement: false, sideInversion: false, timestampViolation: false, excluded: false, exclusionReason: null }
const gates: LockedGateResult[] = REQUIRED_LOCKED_GATE_IDS.map(id => ({ id, disposition: 'inconclusive', estimate: null, ci95: null, denominator: 1, note: 'Synthetic schema fixture; no locked inference.' }))

describe('locked count/event validation safeguards', () => {
  it('blocks unsigned, mismatched, nonconsented, or incomplete inputs before outcomes run', () => {
    expect(preflightLockedValidation({ ...input(), certificate: { ...input().certificate, status: 'blocked', packageSha256: null } })).toContain('Validation package is not frozen.')
    expect(preflightLockedValidation({ ...input(), observedPackageSha256: 'b'.repeat(64) })).toContain('Freeze/code/config hash mismatch.')
    expect(preflightLockedValidation({ ...input(), manifest: { ...manifest, sources: [{ ...manifest.sources[0], consent: 'synthetic' as const }] } }).join(' ')).toContain('lacks consented-study')
  })
  it('accounts every row and independently recomputes the summary', () => {
    const report = buildLockedValidationReport(input(), [row], gates)
    expect(report.summary).toEqual(recomputeLockedSummary(report.rows))
    expect(report.denominators).toEqual({ subjects: 1, sequences: 1, excluded: 0, invalid: 0 })
    expect(report.gates.every(gate => gate.disposition === 'inconclusive')).toBe(true)
  })
  it('rejects missing sources and favorable pass claims without confidence intervals', () => {
    expect(() => buildLockedValidationReport(input(), [], gates)).toThrow('exactly once')
    expect(() => buildLockedValidationReport(input(), [row], gates.map((gate, index) => index ? gate : { ...gate, disposition: 'pass' }))).toThrow('without uncertainty')
  })
})
