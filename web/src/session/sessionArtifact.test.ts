import { describe, expect, it } from 'vitest'
import {
  ANALYSIS_ALGORITHM_VERSION,
  LEGACY_ALGORITHM_VERSION,
  SESSION_ARTIFACT_SCHEMA_VERSION,
  buildSessionArtifact,
  legacyMetricResults,
  metricResultsForArtifact,
  toSessionArtifact,
} from './sessionArtifact'
import {
  SESSION_STORE_SCHEMA_VERSION,
  buildStoredSession,
  createMemorySessionStore,
  isReadableRecord,
  type StoredSession,
} from '../storage/sessionStore'
import { buildHistoryRows } from '../storage/historyView'
import { makeConfidence } from '../core/confidence'
import { makeProvenance } from '../core/provenance'
import type { MetricResult } from '../core/metric'
import type { SessionResult, SetMetricsSummary } from './types'

const NOW = new Date('2026-07-06T12:00:00Z')

function makeMetrics(overrides: Partial<SetMetricsSummary> = {}): SetMetricsSummary {
  return {
    repCount: 5,
    reps: [],
    excludedRepNumbers: [],
    avgDepth: 95,
    avgTrunkLean: 30,
    depthCV: 4,
    minDepth: 90,
    maxDepth: 100,
    avgHipShift: 0.01,
    avgKneeAsymmetry: 3,
    avgShoulderAsymmetry: 2,
    overallConfidence: 0.9,
    ...overrides,
  }
}

function makeMetricResult(): MetricResult {
  return {
    metricId: 'squat.depth.min-knee-angle',
    label: 'Depth (bottom knee angle)',
    value: 95,
    unit: 'deg',
    side: 'bilateral',
    confidence: makeConfidence(0.85, ['landmark-visibility']),
    provenance: makeProvenance({ captureSource: 'live' }),
    validationTier: 'experimental',
  }
}

function makeResult(overrides: Partial<SessionResult> = {}): SessionResult {
  return {
    protocolId: 'squat',
    metrics: makeMetrics(),
    metricResults: [makeMetricResult()],
    findings: [],
    scoring: null,
    feedback: [],
    sessionConfidence: 'High',
    sessionConfidenceScore: 85,
    insufficientData: false,
    noRepsDetected: false,
    posture: null,
    baseline: null,
    quality: {
      verdict: 'valid',
      reasons: [],
      captureFixes: [],
      untrustedReps: [],
      untrustedRepNumbers: [],
      trustedRepCount: 5,
      phantomCandidateCount: 0,
    },
    ...overrides,
  }
}

/** A record exactly as the pre-M40 store wrote it: v1, no algorithmVersion. */
function legacyV1Record(result: SessionResult = makeResult()): StoredSession {
  return {
    id: 'legacy-1',
    schemaVersion: 1,
    protocolId: result.protocolId,
    timestamp: NOW.getTime() - 86_400_000,
    result,
    provenance: makeProvenance({ captureSource: 'live' }),
  }
}

describe('buildSessionArtifact', () => {
  it('wraps a fresh result as an explicitly versioned artifact', () => {
    const artifact = buildSessionArtifact(makeResult(), { now: NOW })
    expect(artifact.schemaVersion).toBe(SESSION_ARTIFACT_SCHEMA_VERSION)
    expect(artifact.algorithmVersion).toBe(ANALYSIS_ALGORITHM_VERSION)
    expect(artifact.protocolId).toBe('squat')
    expect(artifact.createdAt).toBe('2026-07-06T12:00:00.000Z')
  })
})

describe('stored record versioning', () => {
  it('new records are saved at schema v2 with the algorithm version', () => {
    const record = buildStoredSession(makeResult(), { now: NOW.getTime() })
    expect(record.schemaVersion).toBe(SESSION_STORE_SCHEMA_VERSION)
    expect(record.schemaVersion).toBe(2)
    expect(record.algorithmVersion).toBe(ANALYSIS_ALGORITHM_VERSION)
  })

  it('keeps v1 AND v2 records readable; unknown versions are skipped', () => {
    expect(isReadableRecord(legacyV1Record())).toBe(true)
    expect(isReadableRecord(buildStoredSession(makeResult()))).toBe(true)
    expect(
      isReadableRecord({ ...legacyV1Record(), schemaVersion: 3 }),
    ).toBe(false)
  })

  it('lists mixed v1 + v2 records together, newest first', async () => {
    const store = createMemorySessionStore()
    const v1 = legacyV1Record()
    const v2 = buildStoredSession(makeResult(), { now: NOW.getTime() })
    await store.save(v1)
    await store.save(v2)
    const listed = await store.list()
    expect(listed.map((r) => r.id)).toEqual([v2.id, v1.id])
  })
})

describe('toSessionArtifact (read adapter, no on-disk migration)', () => {
  it('normalizes a v1 record with the legacy algorithm marker', () => {
    const record = legacyV1Record()
    const artifact = toSessionArtifact(record)
    expect(artifact.schemaVersion).toBe(1)
    expect(artifact.algorithmVersion).toBe(LEGACY_ALGORITHM_VERSION)
    expect(artifact.result).toBe(record.result)
    // The stored record itself is untouched.
    expect(record.algorithmVersion).toBeUndefined()
  })

  it('carries a v2 record through unchanged', () => {
    const record = buildStoredSession(makeResult(), { now: NOW.getTime() })
    const artifact = toSessionArtifact(record)
    expect(artifact.schemaVersion).toBe(2)
    expect(artifact.algorithmVersion).toBe(ANALYSIS_ALGORITHM_VERSION)
  })
})

describe('metric results survive serialization', () => {
  it('round-trips keyed results through JSON intact', () => {
    const record = buildStoredSession(makeResult(), { now: NOW.getTime() })
    const revived = JSON.parse(JSON.stringify(record)) as StoredSession
    expect(revived.result.metricResults).toEqual(record.result.metricResults)
    expect(toSessionArtifact(revived).result.metricResults[0].value).toBe(95)
  })
})

describe('legacy summary → keyed results adapter', () => {
  it('derives squat metric results for pre-dual-write records', () => {
    const artifact = toSessionArtifact(
      legacyV1Record(makeResult({ metricResults: [] })),
    )
    const derived = metricResultsForArtifact(
      artifact,
      makeProvenance({ captureSource: 'live' }),
    )
    expect(derived.length).toBeGreaterThan(0)
    expect(derived.some((m) => m.metricId === 'squat.depth.min-knee-angle')).toBe(
      true,
    )
  })

  it('returns existing keyed results untouched when present', () => {
    const artifact = toSessionArtifact(legacyV1Record())
    const results = metricResultsForArtifact(
      artifact,
      makeProvenance({ captureSource: 'live' }),
    )
    expect(results).toBe(artifact.result.metricResults)
  })

  it('never invents results for non-squat protocols or empty sets', () => {
    const provenance = makeProvenance({ captureSource: 'live' })
    expect(
      legacyMetricResults('hipHinge', makeMetrics(), provenance),
    ).toEqual([])
    expect(
      legacyMetricResults('squat', makeMetrics({ repCount: 0 }), provenance),
    ).toEqual([])
  })
})

describe('history UI renders old and new sessions', () => {
  it('buildHistoryRows handles mixed v1 + v2 records', () => {
    const rows = buildHistoryRows([
      buildStoredSession(makeResult(), { now: NOW.getTime() }),
      legacyV1Record(),
    ])
    expect(rows).toHaveLength(2)
    for (const row of rows) {
      expect(row.repCount).toBe(5)
      expect(row.verdict).toBe('valid')
    }
  })
})
