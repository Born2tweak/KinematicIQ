import { normalizeObservationProtocolId, normalizeProtocolId, type ProtocolId } from '../core/protocol'

export type StudySplit = 'development' | 'validation' | 'test'
export interface StudySource { id: string; sha256: string; subjectKey: string; sessionKey: string; protocolId: ProtocolId; observationProtocolId: string; leadSide?: 'left' | 'right'; split: StudySplit; consent: 'synthetic' | 'consented-study' | 'licensed-public'; use: 'development' | 'locked-validation' | 'reliability'; frozen: boolean; relativePath: string }
export interface StudyLabelSet { id: string; sourceId: string; sha256: string; raterKey: string; frozen: boolean }
export interface StudyTransformation { id: string; sourceId: string; parentId: 'raw' | string; sha256: string; kind: string; version: string; seed?: number; parameters: Record<string, unknown> }
export interface ProtocolStudyManifestV1 { schemaVersion: 1; studyId: string; sources: StudySource[]; labelSets: StudyLabelSet[]; transformations: StudyTransformation[] }

const SHA = /^[a-f0-9]{64}$/
const KEY = /^[a-z0-9][a-z0-9_-]*$/i
const object = (v: unknown, where: string): Record<string, unknown> => { if (!v || typeof v !== 'object' || Array.isArray(v)) throw new Error(`${where} must be an object.`); return v as Record<string, unknown> }
const string = (v: unknown, where: string) => { if (typeof v !== 'string' || !v) throw new Error(`${where} must be a string.`); return v }
const checksum = (v: unknown, where: string) => { const s = string(v, where); if (!SHA.test(s)) throw new Error(`${where} must be lowercase SHA-256.`); return s }
const safeKey = (v: unknown, where: string) => { const s = string(v, where); if (!KEY.test(s) || s.includes('..')) throw new Error(`${where} must be pseudonymous and path-safe.`); return s }
const relativePath = (v: unknown, where: string) => { const s = string(v, where); if (/^(?:[a-z]:|[/\\])|\.\./i.test(s) || s.includes('\\')) throw new Error(`${where} must be a safe relative path.`); return s }

export function parseProtocolStudyManifest(raw: unknown): ProtocolStudyManifestV1 {
  const root = object(raw, 'manifest')
  if (root.schemaVersion !== 1) throw new Error('Unsupported protocol-study manifest version.')
  const ids = new Set<string>()
  const unique = (id: string) => { if (ids.has(id)) throw new Error(`Duplicate id ${id}.`); ids.add(id); return id }
  if (!Array.isArray(root.sources) || !Array.isArray(root.labelSets) || !Array.isArray(root.transformations)) throw new Error('Manifest arrays are required.')
  const sources = root.sources.map((v, i): StudySource => {
    const x = object(v, `sources[${i}]`); const protocolId = normalizeProtocolId(x.protocolId); const split = string(x.split, 'split') as StudySplit; const use = string(x.use, 'use') as StudySource['use']; const frozen = x.frozen === true
    if (!['development', 'validation', 'test'].includes(split)) throw new Error('Invalid split.')
    if (!['development', 'locked-validation', 'reliability'].includes(use)) throw new Error('Invalid use.')
    if ((split === 'validation' || split === 'test') && use === 'development') throw new Error('Locked/test records cannot be tuning inputs.')
    if (frozen && use === 'development') throw new Error('Frozen records cannot be development inputs.')
    const consent = string(x.consent, 'consent') as StudySource['consent']; if (!['synthetic', 'consented-study', 'licensed-public'].includes(consent)) throw new Error('Invalid consent/use boundary.')
    const leadSide = x.leadSide as StudySource['leadSide']; if (protocolId === 'forwardLungeStrideReturn' && !['left', 'right'].includes(leadSide ?? '')) throw new Error('Forward Lunge source requires leadSide.')
    return { id: unique(safeKey(x.id, 'source id')), sha256: checksum(x.sha256, 'source checksum'), subjectKey: safeKey(x.subjectKey, 'subjectKey'), sessionKey: safeKey(x.sessionKey, 'sessionKey'), protocolId, observationProtocolId: normalizeObservationProtocolId(x.observationProtocolId), leadSide, split, consent, use, frozen, relativePath: relativePath(x.relativePath, 'relativePath') }
  })
  const subjectSplits = new Map<string, StudySplit>(); for (const s of sources) { const prior = subjectSplits.get(s.subjectKey); if (prior && prior !== s.split) throw new Error(`Subject ${s.subjectKey} crosses splits.`); subjectSplits.set(s.subjectKey, s.split) }
  const sourceIds = new Set(sources.map(s => s.id))
  const labelSets = root.labelSets.map((v, i): StudyLabelSet => { const x = object(v, `labelSets[${i}]`); const sourceId = string(x.sourceId, 'label source'); if (!sourceIds.has(sourceId)) throw new Error(`Missing source ${sourceId}.`); return { id: unique(safeKey(x.id, 'label id')), sourceId, sha256: checksum(x.sha256, 'label checksum'), raterKey: safeKey(x.raterKey, 'raterKey'), frozen: x.frozen === true } })
  const transformations = root.transformations.map((v, i): StudyTransformation => { const x = object(v, `transformations[${i}]`); const sourceId = string(x.sourceId, 'transformation source'); if (!sourceIds.has(sourceId)) throw new Error(`Missing source ${sourceId}.`); return { id: unique(safeKey(x.id, 'transformation id')), sourceId, parentId: string(x.parentId, 'parentId'), sha256: checksum(x.sha256, 'transformation checksum'), kind: string(x.kind, 'kind'), version: string(x.version, 'version'), seed: typeof x.seed === 'number' ? x.seed : undefined, parameters: object(x.parameters ?? {}, 'parameters') } })
  const transformationsById = new Map(transformations.map(x => [x.id, x])); for (const t of transformations) { const seen = new Set([t.id]); let parent = t.parentId; while (parent !== 'raw') { if (seen.has(parent)) throw new Error('Transformation lineage must be acyclic.'); seen.add(parent); const p = transformationsById.get(parent); if (!p || p.sourceId !== t.sourceId) throw new Error(`Missing transformation parent ${parent}.`); parent = p.parentId } }
  return { schemaVersion: 1, studyId: safeKey(root.studyId, 'studyId'), sources, labelSets, transformations }
}
