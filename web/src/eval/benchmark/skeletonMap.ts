/**
 * Versioned source-to-canonical skeleton maps (M62).
 *
 * A map states, for EVERY canonical joint, how it is obtained from a source
 * skeleton: `direct` (one source joint), `derived` (a documented computation
 * over source joints), `ambiguous` (a correspondence exists but is not safe
 * to assert), or `unavailable` (the source has no such joint). The map never
 * invents anatomy — derived and direct references must name joints the source
 * skeleton actually declares, and ambiguous/unavailable joints yield no
 * coordinate at adaptation time.
 */
import {
  CANONICAL_JOINTS,
  CANONICAL_SKELETON_ID,
  type CanonicalJoint,
} from './canonicalSkeleton'

export type JointMappingKind =
  | 'direct'
  | 'derived'
  | 'ambiguous'
  | 'unavailable'

export interface DirectMapping {
  kind: 'direct'
  sourceJoint: string
}

export interface DerivedMapping {
  kind: 'derived'
  /** Source joints the derivation consumes (all must be present at runtime). */
  from: string[]
  /** How they combine, e.g. 'midpoint'. */
  method: string
  /** Human note retained as derivation provenance. */
  note: string
}

export interface AmbiguousMapping {
  kind: 'ambiguous'
  /** Plausible but non-authoritative source correspondences. */
  candidates: string[]
  note: string
}

export interface UnavailableMapping {
  kind: 'unavailable'
  note: string
}

export type JointMapping =
  | DirectMapping
  | DerivedMapping
  | AmbiguousMapping
  | UnavailableMapping

export interface SkeletonMap {
  id: string
  version: string
  sourceSkeletonId: string
  targetSkeletonId: string
  /** The joints the SOURCE skeleton declares — references validate against this. */
  sourceJoints: string[]
  /** One mapping per canonical joint. All canonical joints must be present. */
  joints: Record<CanonicalJoint, JointMapping>
  provenance: { tool: string; note?: string }
}

const KINDS: ReadonlySet<string> = new Set([
  'direct',
  'derived',
  'ambiguous',
  'unavailable',
])

function requireString(value: unknown, where: string): string {
  if (typeof value !== 'string' || value === '') {
    throw new Error(`${where} must be a non-empty string.`)
  }
  return value
}

function requireStringArray(value: unknown, where: string): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${where} must be a non-empty array of strings.`)
  }
  value.forEach((v, i) => requireString(v, `${where}[${i}]`))
  return value as string[]
}

function parseMapping(
  raw: unknown,
  where: string,
  sourceJointSet: ReadonlySet<string>,
): JointMapping {
  const m = (raw ?? {}) as Record<string, unknown>
  if (typeof m.kind !== 'string' || !KINDS.has(m.kind)) {
    throw new Error(`${where}.kind must be one of ${[...KINDS].join(', ')}.`)
  }
  switch (m.kind as JointMappingKind) {
    case 'direct': {
      const sourceJoint = requireString(m.sourceJoint, `${where}.sourceJoint`)
      if (!sourceJointSet.has(sourceJoint)) {
        throw new Error(
          `${where}.sourceJoint "${sourceJoint}" is not a declared source joint (no invented anatomy).`,
        )
      }
      return { kind: 'direct', sourceJoint }
    }
    case 'derived': {
      const from = requireStringArray(m.from, `${where}.from`)
      for (const f of from) {
        if (!sourceJointSet.has(f)) {
          throw new Error(
            `${where}.from references "${f}", not a declared source joint (no invented anatomy).`,
          )
        }
      }
      return {
        kind: 'derived',
        from,
        method: requireString(m.method, `${where}.method`),
        note: requireString(m.note, `${where}.note`),
      }
    }
    case 'ambiguous': {
      const candidates = requireStringArray(m.candidates, `${where}.candidates`)
      for (const c of candidates) {
        if (!sourceJointSet.has(c)) {
          throw new Error(
            `${where}.candidates references "${c}", not a declared source joint.`,
          )
        }
      }
      return { kind: 'ambiguous', candidates, note: requireString(m.note, `${where}.note`) }
    }
    case 'unavailable':
      return { kind: 'unavailable', note: requireString(m.note, `${where}.note`) }
  }
}

/**
 * Parse + validate a raw skeleton map. Throws on the first problem. Every
 * canonical joint must be addressed; every source reference must exist in
 * `sourceJoints`.
 */
export function parseSkeletonMap(raw: unknown): SkeletonMap {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('Skeleton map must be a JSON object.')
  }
  const map = raw as Record<string, unknown>
  const id = requireString(map.id, 'id')
  const version = requireString(map.version, 'version')
  const sourceSkeletonId = requireString(map.sourceSkeletonId, 'sourceSkeletonId')
  const targetSkeletonId = requireString(map.targetSkeletonId, 'targetSkeletonId')
  if (targetSkeletonId !== CANONICAL_SKELETON_ID) {
    throw new Error(
      `targetSkeletonId must be "${CANONICAL_SKELETON_ID}" (found "${targetSkeletonId}").`,
    )
  }
  const sourceJoints = requireStringArray(map.sourceJoints, 'sourceJoints')
  const sourceJointSet = new Set(sourceJoints)

  const rawJoints = (map.joints ?? {}) as Record<string, unknown>
  const joints = {} as Record<CanonicalJoint, JointMapping>
  for (const joint of CANONICAL_JOINTS) {
    if (!(joint in rawJoints)) {
      throw new Error(`joints is missing canonical joint "${joint}".`)
    }
    joints[joint] = parseMapping(rawJoints[joint], `joints.${joint}`, sourceJointSet)
  }

  const prov = (map.provenance ?? {}) as Record<string, unknown>
  const provenance: SkeletonMap['provenance'] = {
    tool: requireString(prov.tool, 'provenance.tool'),
  }
  if (prov.note !== undefined) {
    provenance.note = requireString(prov.note, 'provenance.note')
  }

  return {
    id,
    version,
    sourceSkeletonId,
    targetSkeletonId,
    sourceJoints,
    joints,
    provenance,
  }
}
