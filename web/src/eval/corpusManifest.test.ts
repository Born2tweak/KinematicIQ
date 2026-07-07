import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  CORPUS_MANIFEST_VERSION,
  parseCorpusManifest,
} from './corpusManifest'

const EXAMPLE_PATH = join(
  __dirname,
  '../../../eval-tapes/MANIFEST.example.json',
)

function validRaw() {
  return {
    manifestVersion: CORPUS_MANIFEST_VERSION,
    storageNote: 'Local tapes only.',
    entries: [
      {
        id: 'stock-01',
        file: 'clip.posetape.json',
        protocolId: 'squat',
        source: 'stock-video',
        hasTruth: true,
        truthRepCount: 4,
        consent: 'public-stock',
        validationUse: 'benchmark',
      },
    ],
  }
}

describe('parseCorpusManifest', () => {
  it('parses the committed example manifest (keeps the example valid)', () => {
    const raw = JSON.parse(readFileSync(EXAMPLE_PATH, 'utf8')) as unknown
    const manifest = parseCorpusManifest(raw)
    expect(manifest.manifestVersion).toBe(CORPUS_MANIFEST_VERSION)
    expect(manifest.entries.length).toBeGreaterThan(0)
    // The committed example must never reference a real tape: every file
    // must be an example-* placeholder (no athlete data in git).
    for (const entry of manifest.entries) {
      expect(entry.file.startsWith('example-')).toBe(true)
    }
  })

  it('parses a minimal valid manifest', () => {
    const manifest = parseCorpusManifest(validRaw())
    expect(manifest.entries[0].id).toBe('stock-01')
    expect(manifest.entries[0].truthRepCount).toBe(4)
  })

  it('refuses unknown manifest versions rather than misreading them', () => {
    expect(() =>
      parseCorpusManifest({ ...validRaw(), manifestVersion: 99 }),
    ).toThrow(/version/)
  })

  it('rejects duplicate ids', () => {
    const raw = validRaw()
    raw.entries.push({ ...raw.entries[0] })
    expect(() => parseCorpusManifest(raw)).toThrow(/duplicate id/)
  })

  it('rejects paths in filenames (local layout stays out of git)', () => {
    const raw = validRaw()
    raw.entries[0].file = 'C:/Users/someone/clip.posetape.json'
    expect(() => parseCorpusManifest(raw)).toThrow(/bare filename/)
  })

  it('requires truthRepCount when hasTruth is set', () => {
    const raw = validRaw()
    delete (raw.entries[0] as Record<string, unknown>).truthRepCount
    expect(() => parseCorpusManifest(raw)).toThrow(/truthRepCount/)
  })

  it('rejects invalid enum values', () => {
    const raw = validRaw()
    raw.entries[0].consent = 'scraped'
    expect(() => parseCorpusManifest(raw)).toThrow(/consent/)
  })
})
