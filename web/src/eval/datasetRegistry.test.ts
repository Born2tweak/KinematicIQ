import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { DATASET_REGISTRY_VERSION, parseDatasetRegistry } from './datasetRegistry'

const REGISTRY_PATH = join(__dirname, '../../eval/datasets/registry.json')

function validEntry() {
  return {
    id: 'ui-prmd',
    version: '2018-release',
    role: 'evaluation-only',
    approvalStatus: 'metadata-only',
    source: {
      officialUrl: 'https://webpages.uidaho.edu/ui-prmd/',
      citation: 'Vakanski et al., UI-PRMD.',
    },
    license: {
      name: 'custom-research-terms',
      commercialUse: 'unclear',
      redistribution: 'unclear',
      accessRequirement: 'registration',
    },
    content: {
      approxSize: 'small-moderate',
      modalities: ['vicon-markers', 'kinect-skeleton'],
      skeleton: 'vicon-markers+kinect-25',
      views: ['single-view'],
      movementLabels: ['deep-squat'],
    },
    use: {
      allowedUses: ['rep-segmentation-reference'],
      prohibitedClaimUses: ['clinical-validity-claim'],
    },
    localPathConvention: 'datasets/local/ui-prmd/',
  }
}

function validRaw() {
  return {
    registryVersion: DATASET_REGISTRY_VERSION,
    storageNote: 'Metadata only; nothing acquired.',
    entries: [validEntry()],
  }
}

describe('parseDatasetRegistry', () => {
  it('parses the committed registry.json', () => {
    const raw = JSON.parse(readFileSync(REGISTRY_PATH, 'utf8')) as unknown
    const registry = parseDatasetRegistry(raw)
    expect(registry.registryVersion).toBe(DATASET_REGISTRY_VERSION)
    // Acceptance: at least two metadata-only candidate records validate.
    const metadataOnly = registry.entries.filter(
      (e) => e.approvalStatus === 'metadata-only',
    )
    expect(metadataOnly.length).toBeGreaterThanOrEqual(2)
  })

  it('records the approved UI-PRMD pilot with immutable checksums', () => {
    const raw = JSON.parse(readFileSync(REGISTRY_PATH, 'utf8')) as unknown
    const registry = parseDatasetRegistry(raw)
    const uiPrmd = registry.entries.find((entry) => entry.id === 'ui-prmd')
    expect(uiPrmd?.approvalStatus).toBe('approved')
    expect(uiPrmd?.checksums).toHaveLength(5)
    expect(uiPrmd?.license.name).toContain('PDDL')
  })

  it('does not confuse OCHuman approval with corpus acquisition', () => {
    const raw = JSON.parse(readFileSync(REGISTRY_PATH, 'utf8')) as unknown
    const registry = parseDatasetRegistry(raw)
    const ochuman = registry.entries.find((entry) => entry.id === 'ochuman')
    expect(ochuman?.approvalStatus).toBe('approved')
    expect(ochuman?.checksums).toBeUndefined()
    expect(ochuman?.notes).toMatch(/remains unavailable locally/)
  })

  it('every committed entry declares allowed and prohibited-claim uses', () => {
    const raw = JSON.parse(readFileSync(REGISTRY_PATH, 'utf8')) as unknown
    const registry = parseDatasetRegistry(raw)
    for (const entry of registry.entries) {
      expect(entry.use.allowedUses.length).toBeGreaterThan(0)
      expect(entry.use.prohibitedClaimUses.length).toBeGreaterThan(0)
    }
  })

  it('parses a minimal valid registry', () => {
    const registry = parseDatasetRegistry(validRaw())
    expect(registry.entries[0].id).toBe('ui-prmd')
  })

  it('refuses unknown registry versions rather than misreading them', () => {
    expect(() =>
      parseDatasetRegistry({ ...validRaw(), registryVersion: 99 }),
    ).toThrow(/version/)
  })

  it('rejects duplicate ids', () => {
    const raw = validRaw()
    raw.entries.push(validEntry())
    expect(() => parseDatasetRegistry(raw)).toThrow(/duplicate id/)
  })

  it('rejects a missing license (provenance/license required)', () => {
    const raw = validRaw()
    delete (raw.entries[0] as Record<string, unknown>).license
    expect(() => parseDatasetRegistry(raw)).toThrow(/license/)
  })

  it('rejects a missing commercial-use status', () => {
    const raw = validRaw()
    delete (raw.entries[0].license as Record<string, unknown>).commercialUse
    expect(() => parseDatasetRegistry(raw)).toThrow(/commercialUse/)
  })

  it('rejects missing provenance (officialUrl / citation)', () => {
    const raw = validRaw()
    delete (raw.entries[0].source as Record<string, unknown>).officialUrl
    expect(() => parseDatasetRegistry(raw)).toThrow(/officialUrl/)
  })

  it('rejects an entry with no intended-use declaration', () => {
    const raw = validRaw()
    raw.entries[0].use.prohibitedClaimUses = []
    expect(() => parseDatasetRegistry(raw)).toThrow(/prohibitedClaimUses/)
  })

  it('rejects an absolute local path (no user names or drives in git)', () => {
    const raw = validRaw()
    raw.entries[0].localPathConvention = 'C:/Users/someone/ui-prmd/'
    expect(() => parseDatasetRegistry(raw)).toThrow(/relative path/)
  })

  it('rejects a home-directory local path', () => {
    const raw = validRaw()
    raw.entries[0].localPathConvention = '~/datasets/ui-prmd/'
    expect(() => parseDatasetRegistry(raw)).toThrow(/home-directory/)
  })

  it('rejects a local path that escapes the cache root', () => {
    const raw = validRaw()
    raw.entries[0].localPathConvention = 'datasets/../../secret/'
    expect(() => parseDatasetRegistry(raw)).toThrow(/\.\./)
  })

  it('rejects invalid role enum values', () => {
    const raw = validRaw()
    ;(raw.entries[0] as Record<string, unknown>).role = 'download-everything'
    expect(() => parseDatasetRegistry(raw)).toThrow(/role/)
  })

  it('refuses checksums on an un-approved dataset (defends the approval boundary)', () => {
    const raw = validRaw()
    ;(raw.entries[0] as Record<string, unknown>).checksums = [
      { algorithm: 'sha256', value: 'abc123', covers: 'archive.zip' },
    ]
    expect(() => parseDatasetRegistry(raw)).toThrow(/approvalStatus/)
  })

  it('forbids a metadata-only role from being marked approved', () => {
    const raw = validRaw()
    raw.entries[0].role = 'metadata-only'
    raw.entries[0].approvalStatus = 'approved'
    expect(() => parseDatasetRegistry(raw)).toThrow(/metadata-only/)
  })

  it('accepts checksums once a dataset is approved', () => {
    const raw = validRaw()
    raw.entries[0].role = 'evaluation-only'
    raw.entries[0].approvalStatus = 'approved'
    ;(raw.entries[0] as Record<string, unknown>).checksums = [
      { algorithm: 'sha256', value: 'deadbeef', covers: 'archive.zip' },
    ]
    const registry = parseDatasetRegistry(raw)
    expect(registry.entries[0].checksums?.[0].covers).toBe('archive.zip')
  })

  it('rejects a non-hex checksum digest', () => {
    const raw = validRaw()
    raw.entries[0].approvalStatus = 'approved'
    ;(raw.entries[0] as Record<string, unknown>).checksums = [
      { algorithm: 'sha256', value: 'NOT-HEX!!', covers: 'archive.zip' },
    ]
    expect(() => parseDatasetRegistry(raw)).toThrow(/hex/)
  })
})
