import { describe, expect, it } from 'vitest'
import { parseProtocolStudyManifest } from './protocolStudyManifest'
const sha = 'b'.repeat(64)
const valid = () => ({ schemaVersion: 1, studyId: 'flsr-study-example', sources: [{ id: 'source-1', sha256: sha, subjectKey: 'subject-1', sessionKey: 'session-1', protocolId: 'forwardLungeStrideReturn', observationProtocolId: 'side-view-forward-lunge-stride-return-v1', leadSide: 'left', split: 'validation', consent: 'synthetic', use: 'locked-validation', frozen: true, relativePath: 'sources/example.posetape.json' }], labelSets: [{ id: 'labels-1', sourceId: 'source-1', sha256: sha, raterKey: 'rater-a', frozen: true }], transformations: [{ id: 'dropout-1', sourceId: 'source-1', parentId: 'raw', sha256: sha, kind: 'dropout', version: '1', seed: 1, parameters: {} }] })
describe('protocol study manifest', () => {
  it('parses canonical evidence and normalizes legacy ids', () => { const v = valid(); v.sources[0].protocolId = 'inlineLunge'; v.sources[0].observationProtocolId = 'side-view-inline-lunge-v1'; expect(parseProtocolStudyManifest(v).sources[0].protocolId).toBe('forwardLungeStrideReturn') })
  it.each([
    ['duplicate ids', (v: ReturnType<typeof valid>) => v.labelSets[0].id = 'source-1', /Duplicate/],
    ['unsafe path', (v: ReturnType<typeof valid>) => v.sources[0].relativePath = '../private.mov', /relative path/],
    ['bad checksum', (v: ReturnType<typeof valid>) => v.sources[0].sha256 = 'bad', /SHA-256/],
    ['missing source', (v: ReturnType<typeof valid>) => v.labelSets[0].sourceId = 'absent', /Missing source/],
    ['tuning leakage', (v: ReturnType<typeof valid>) => { v.sources[0].use = 'development'; v.sources[0].frozen = true }, /development|tuning/],
  ])('rejects %s', (_, mutate, pattern) => { const v = valid(); mutate(v); expect(() => parseProtocolStudyManifest(v)).toThrow(pattern) })
  it('rejects cross-split subjects and cyclic lineage', () => { const v = valid(); v.sources.push({ ...v.sources[0], id: 'source-2', sessionKey: 'session-2', split: 'test' }); expect(() => parseProtocolStudyManifest(v)).toThrow(/crosses splits/); const c = valid(); c.transformations.push({ ...c.transformations[0], id: 'dropout-2', parentId: 'dropout-1' }); c.transformations[0].parentId = 'dropout-2'; expect(() => parseProtocolStudyManifest(c)).toThrow(/acyclic/) })
})
