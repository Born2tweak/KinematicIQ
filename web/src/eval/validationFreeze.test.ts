import { describe, expect, it } from 'vitest'
import { createValidationFreeze, lintGateRegistry, meanPrecisionSampleSize, proportionPrecisionSampleSize, REQUIRED_LOCKED_GATE_IDS, zeroEventSampleSize, type GateDefinition, type ValidationFreezeInput } from './validationFreeze'

const gates = (): GateDefinition[] => REQUIRED_LOCKED_GATE_IDS.map(id => ({ id, endpoint: 'endpoint', unitOfAnalysis: 'subject', populationSetup: 'frozen setup', threshold: 'signed threshold', ciMethod: 'subject-clustered 95% CI', denominator: 'all attempts', missingnessRule: 'reported and not imputed', ownerRole: 'validation', evidencePath: 'redacted/report.json', consequence: 'fail remains research-only' }))
const input = (signed = false): ValidationFreezeInput => ({ packageId: 'flsr-freeze-v1', registryVersion: 'flsr-gates-v1', supersedes: 'flsr-gates-v0.1', protocolVersion: 'flsr-v1', labelVersion: 'labels-v1', algorithmVersion: 'algorithm-v1', modelVersion: 'model-v1', filterVersion: 'raw-v1', thresholdVersion: 'threshold-v1', perturbationVersion: 'pose-perturbation-v1', manifestSha256: 'a'.repeat(64), analysisSha256: 'b'.repeat(64), gates: gates(), allocations: [{ subjectKey: 'subject-locked-1', split: 'locked', siteKey: 'site-1', deviceClass: 'desktop' }], signatures: signed ? (['statistics', 'custodian', 'validation', 'privacy', 'biomechanics'] as const).map(role => ({ role, signerKey: `${role}-owner`, signedAt: '2026-07-16T00:00:00Z' })) : [], humanAuthorityConfirmed: signed })

describe('validation freeze package', () => {
  it('lints all required gates and fails incomplete registries', () => { expect(() => lintGateRegistry(gates())).not.toThrow(); expect(() => lintGateRegistry(gates().slice(1))).toThrow('incomplete') })
  it('reproduces precision calculations and assumption bounds', () => {
    expect(zeroEventSampleSize(0.05)).toBe(59)
    expect(proportionPrecisionSampleSize(0.5, 0.05)).toBe(385)
    expect(meanPrecisionSampleSize(1, 0.2)).toBe(97)
    expect(() => zeroEventSampleSize(0)).toThrow('0..1')
  })
  it('blocks unsigned packages and deterministically hashes a fully signed fixture', async () => {
    expect((await createValidationFreeze(input())).status).toBe('blocked')
    const first = await createValidationFreeze(input(true))
    expect(first).toEqual(await createValidationFreeze(input(true)))
    expect(first.status).toBe('frozen')
    expect(first.packageSha256).toHaveLength(64)
  })
})
