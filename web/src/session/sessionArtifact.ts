/**
 * Session artifact v2 (M40).
 *
 * A `SessionArtifact` is the explicitly versioned wrapper around a
 * `SessionResult`: schema version + analysis algorithm version + protocol +
 * creation time. It makes a session a protocol artifact (R08 artifact
 * strategy/versioning, R03) instead of a bare squat-shaped summary.
 *
 * Storage keeps the flat `StoredSession` layout for compatibility; this
 * module is the read adapter that presents ANY readable stored record —
 * v1 (pre-M40, no algorithm version) or v2 — as a well-formed artifact.
 * No on-disk migration is performed: v1 records stay byte-identical and are
 * normalized in memory only (roadmap risk: storage migration bugs can hide
 * user history — so we don't migrate storage at all).
 */
import { ANALYSIS_ALGORITHM_VERSION } from '../core/versioning'
import { normalizeProtocolId, type ProtocolId } from '../core/protocol'
import type { Provenance } from '../core/provenance'
import type { MetricResult } from '../core/metric'
import { buildSquatMetricResults } from '../metrics/squatMetrics'
import type { StoredSession } from '../storage/sessionStore'
import type { SessionResult, SetMetricsSummary } from './types'

/** Current artifact schema. v1 = pre-M40 stored sessions (no algo version). */
export const SESSION_ARTIFACT_SCHEMA_VERSION = 2

/** Single source is the M46 registry; re-exported for existing imports. */
export { ANALYSIS_ALGORITHM_VERSION }

/** Stamped on artifacts read from records saved before versioning existed. */
export const LEGACY_ALGORITHM_VERSION = 'unversioned-legacy'

export interface SessionArtifact {
  /** Artifact schema version (2 = current; 1 = normalized legacy record). */
  schemaVersion: number
  /** Analysis pipeline version that produced `result`. */
  algorithmVersion: string
  protocolId: ProtocolId
  /** ISO-8601 creation time. */
  createdAt: string
  result: SessionResult
}

export interface BuildArtifactOptions {
  now?: Date
  algorithmVersion?: string
}

/** Wrap a freshly computed result as a current-version artifact. */
export function buildSessionArtifact(
  result: SessionResult,
  options: BuildArtifactOptions = {},
): SessionArtifact {
  return {
    schemaVersion: SESSION_ARTIFACT_SCHEMA_VERSION,
    algorithmVersion: options.algorithmVersion ?? ANALYSIS_ALGORITHM_VERSION,
    protocolId: result.protocolId,
    createdAt: (options.now ?? new Date()).toISOString(),
    result,
  }
}

/**
 * Present a stored record as an artifact. v1 records (saved before M40)
 * carry no algorithm version — they are stamped `unversioned-legacy` rather
 * than being guessed at. The stored record itself is never modified.
 */
export function toSessionArtifact(record: StoredSession): SessionArtifact {
  return {
    schemaVersion: record.schemaVersion,
    algorithmVersion: record.algorithmVersion ?? LEGACY_ALGORITHM_VERSION,
    protocolId: normalizeProtocolId(record.protocolId),
    createdAt: new Date(record.timestamp).toISOString(),
    result: record.result,
  }
}

/**
 * Adapter: derive keyed `MetricResult[]` from a legacy `SetMetricsSummary`
 * for records saved before dual-write existed (empty `metricResults`).
 * Squat is the only protocol with metric definitions; other protocols
 * return [] rather than inventing results. Existing keyed results are
 * returned untouched — this never overwrites real data.
 */
export function metricResultsForArtifact(
  artifact: SessionArtifact,
  provenance: Provenance,
): MetricResult[] {
  if (artifact.result.metricResults.length > 0) {
    return artifact.result.metricResults
  }
  return legacyMetricResults(
    artifact.protocolId,
    artifact.result.metrics,
    provenance,
  )
}

/** Legacy-summary → keyed results (squat only; [] otherwise, never faked). */
export function legacyMetricResults(
  protocolId: ProtocolId,
  metrics: SetMetricsSummary,
  provenance: Provenance,
): MetricResult[] {
  if (protocolId !== 'squat' || metrics.repCount === 0) {
    return []
  }
  return buildSquatMetricResults(metrics, provenance)
}
