import { describe, expect, it } from 'vitest'
import { buildFieldPilotReport, preflightFieldPilot, scanTrackedPilotArtifact, type FieldPilotAttempt, type PilotApproval } from './fieldPilot'

const attempt = (overrides: Partial<FieldPilotAttempt> = {}): FieldPilotAttempt => ({ sourceId: 'source-1', sourceSha256: 'a'.repeat(64), subjectKey: 'subject-1', attemptIndex: 0, consent: 'synthetic', developmentOnly: true, rightsApproved: false, leadSide: 'left', deviceClass: 'desktop', conditionIds: ['standard'], durationMs: 3000, readable: true, complete: true, exclusionReason: null, complaint: false, ...overrides })

describe('field-development pilot safeguards', () => {
  it('blocks collection until every human approval role signs', () => {
    expect(preflightFieldPilot([]).readyForCollection).toBe(false)
    const roles: PilotApproval['role'][] = ['privacy', 'legal', 'product', 'custodian', 'biomechanics']
    const approvals = roles.map(role => ({ role, signerKey: `${role}-owner`, signedAt: '2026-07-16T00:00:00Z', approved: true }))
    expect(preflightFieldPilot(approvals).readyForCollection).toBe(true)
  })
  it('keeps all attempts in deterministic denominators and exposes coverage shortfalls', () => {
    const report = buildFieldPilotReport([attempt(), attempt({ sourceId: 'source-2', attemptIndex: 1, leadSide: 'right', readable: false, complete: false, exclusionReason: 'severe-occlusion' })], ['severe-occlusion', 'wrong-movement'])
    expect(report).toEqual(buildFieldPilotReport([attempt(), attempt({ sourceId: 'source-2', attemptIndex: 1, leadSide: 'right', readable: false, complete: false, exclusionReason: 'severe-occlusion' })], ['severe-occlusion', 'wrong-movement']))
    expect(report.attempts).toBe(2)
    expect(report.missingFailureFamilies).toEqual(['wrong-movement'])
    expect(report.syntheticOnly).toBe(true)
  })
  it('rejects unapproved human evidence and unsafe tracked artifacts', () => {
    expect(() => buildFieldPilotReport([attempt({ consent: 'consented-study' })])).toThrow('rights')
    expect(() => scanTrackedPilotArtifact('C:\\private\\person.mp4')).toThrow('must not expose')
  })
})
