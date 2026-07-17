import { describe, expect, it } from 'vitest'
import { buildSynchronizedAngleReport, toSignedDegrees, type AnglePairInput } from './synchronizedAngle'

const pair = (index: number, overrides: Partial<AnglePairInput> = {}): AnglePairInput => ({ subjectKey: `subject-${index}`, deviceClass: 'desktop', estimatedValue: 90 + index, estimatedUnit: 'degrees', estimatedSign: 1, referenceValue: Math.PI / 2 + index * Math.PI / 180, referenceUnit: 'radians', referenceSign: 1, cameraTimestampMs: 1000, referenceTimestampMs: 1002, ...overrides })
const plan = (approved = false) => ({ version: 'angle-plan-v1', freezeSha256: 'a'.repeat(64), referenceApproved: approved, referenceCalibrationSha256: 'b'.repeat(64), synchronizationToleranceMs: 10, eventMatchingToleranceMs: 20, minimumUsableSubjects: 30 as const, signedRoles: approved ? ['biomechanics-owner', 'statistics-owner', 'claims-owner'] : [] })

describe('synchronized angle evaluation', () => {
  it('converts units/signs and reports agreement with uncertainty', () => { expect(toSignedDegrees(Math.PI / 2, 'radians', -1)).toBeCloseTo(-90); const report = buildSynchronizedAngleReport(plan(true), Array.from({ length: 30 }, (_, index) => pair(index))); expect(report.agreement?.mae).toBeCloseTo(0); expect(report.agreement?.biasCi95).not.toBeNull(); expect(report.disposition).toBe('tier-proposal-pending-claims') })
  it('keeps missing, synchronization failures, sensitivity, and worst cases visible', () => { const report = buildSynchronizedAngleReport(plan(), [pair(1), pair(2, { estimatedValue: null }), pair(3, { referenceTimestampMs: 1100 })]); expect(report.missingPairs).toBe(1); expect(report.outsideSynchronizationTolerance).toBe(1); expect(report.sensitivity).toHaveLength(3); expect(report.disposition).toBe('blocked') })
  it('rejects malformed plans and empty pairs', () => { expect(() => buildSynchronizedAngleReport({ ...plan(), freezeSha256: 'bad' }, [pair(1)])).toThrow('invalid'); expect(() => buildSynchronizedAngleReport(plan(), [])).toThrow('requires') })
})
