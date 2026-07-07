import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  ANALYSIS_ALGORITHM_VERSION,
  APP_VERSION,
  CLAIM_POLICY_VERSION,
  POSE_MODEL_VERSION,
  VERSIONS,
} from './versioning'
import { makeProvenance } from './provenance'
import { createTape, deserializeTape, serializeTape } from '../eval/poseTape'

describe('version registry', () => {
  it('every identifier is a non-empty string', () => {
    for (const [key, value] of Object.entries(VERSIONS)) {
      expect(typeof value, key).toBe('string')
      expect(value.length, key).toBeGreaterThan(0)
    }
  })

  it('APP_VERSION matches web/package.json', () => {
    const pkg = JSON.parse(
      readFileSync(join(__dirname, '../../package.json'), 'utf8'),
    ) as { name: string; version: string }
    expect(APP_VERSION).toBe(`${pkg.name}@${pkg.version}`)
  })
})

describe('provenance carries registry versions', () => {
  it('defaults model, app, and algorithm versions from the registry', () => {
    const provenance = makeProvenance({ captureSource: 'live' })
    expect(provenance.modelVersion).toBe(POSE_MODEL_VERSION)
    expect(provenance.appVersion).toBe(APP_VERSION)
    expect(provenance.algorithmVersion).toBe(ANALYSIS_ALGORITHM_VERSION)
  })

  it('explicit caller values still win over defaults', () => {
    const provenance = makeProvenance({
      captureSource: 'replay',
      algorithmVersion: 'experiment-x',
    })
    expect(provenance.algorithmVersion).toBe('experiment-x')
  })
})

describe('pose tape version stamping (additive)', () => {
  it('new tapes carry app + algorithm versions', () => {
    const tape = createTape([], { fps: 30, source: 'live' })
    expect(tape.meta.appVersion).toBe(APP_VERSION)
    expect(tape.meta.algorithmVersion).toBe(ANALYSIS_ALGORITHM_VERSION)
  })

  it('old tapes without version fields remain fully readable', () => {
    // Serialized exactly as a pre-M46 tape would be — no version fields.
    const legacyJson = JSON.stringify({
      meta: { fps: 15, source: 'upload' },
      frames: [],
    })
    const tape = deserializeTape(legacyJson)
    expect(tape.meta.appVersion).toBeUndefined()
    expect(tape.meta.algorithmVersion).toBeUndefined()
    // Round-trips untouched — deserialize/serialize never injects fields.
    expect(JSON.parse(serializeTape(tape))).toEqual(JSON.parse(legacyJson))
  })
})

describe('report export carries registry versions', () => {
  it('claims-policy version is the registry value', async () => {
    const { CLAIM_POLICY_VERSION: reExported } = await import(
      '../export/sessionReport'
    )
    expect(reExported).toBe(CLAIM_POLICY_VERSION)
  })
})
