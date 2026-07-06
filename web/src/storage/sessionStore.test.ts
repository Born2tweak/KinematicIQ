import { describe, expect, it } from 'vitest'
import {
  SESSION_STORE_SCHEMA_VERSION,
  buildStoredSession,
  createMemorySessionStore,
  isReadableRecord,
  type StoredSession,
} from './sessionStore'
import { buildHistoryRows, historyObservation } from './historyView'
import { makeConfidence } from '../core/confidence'
import { makeProvenance } from '../core/provenance'
import type { SessionResult, SetMetricsSummary } from '../session/types'

function makeResult(overrides: Partial<SessionResult> = {}): SessionResult {
  const metrics: SetMetricsSummary = {
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
  }
  return {
    protocolId: 'squat',
    metrics,
    metricResults: [],
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

function stored(
  overrides: Partial<StoredSession> & { timestamp: number },
  result: SessionResult = makeResult(),
): StoredSession {
  return buildStoredSession(result, {
    now: overrides.timestamp,
    id: overrides.id,
  })
}

describe('storage/sessionStore', () => {
  it('buildStoredSession stamps schema version, protocol, and provenance', () => {
    const record = buildStoredSession(makeResult(), { now: 1000, id: 'r1' })
    expect(record.schemaVersion).toBe(SESSION_STORE_SCHEMA_VERSION)
    expect(record.protocolId).toBe('squat')
    expect(record.timestamp).toBe(1000)
    expect(record.provenance.captureSource).toBe('live')
  })

  it('buildStoredSession inherits provenance from metric results when present', () => {
    const result = makeResult({
      metricResults: [
        {
          metricId: 'm',
          label: 'm',
          value: 1,
          unit: 'deg',
          side: 'none',
          confidence: makeConfidence(0.9),
          provenance: makeProvenance({ captureSource: 'upload' }),
          validationTier: 'production',
        },
      ],
    })
    expect(buildStoredSession(result).provenance.captureSource).toBe('upload')
  })

  it('memory store round-trips records newest first and delete-all clears', async () => {
    const store = createMemorySessionStore()
    await store.save(stored({ id: 'old', timestamp: 100 }))
    await store.save(stored({ id: 'new', timestamp: 200 }))
    const listed = await store.list()
    expect(listed.map((r) => r.id)).toEqual(['new', 'old'])

    await store.deleteAll()
    expect(await store.list()).toEqual([])
  })

  it('list skips records from unknown schema versions', async () => {
    const store = createMemorySessionStore()
    const future = { ...stored({ id: 'future', timestamp: 300 }), schemaVersion: 99 }
    await store.save(future)
    await store.save(stored({ id: 'current', timestamp: 200 }))
    expect((await store.list()).map((r) => r.id)).toEqual(['current'])
    expect(isReadableRecord(future)).toBe(false)
  })
})

describe('storage/historyView', () => {
  it('buildHistoryRows maps stored sessions to display rows', () => {
    const rows = buildHistoryRows([stored({ id: 'a', timestamp: 100 })])
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      id: 'a',
      protocolId: 'squat',
      repCount: 5,
      trustedRepCount: 5,
      verdict: 'valid',
      confidenceLevel: 'High',
    })
  })

  it('historyObservation abstains with fewer than two comparable sessions', () => {
    expect(historyObservation([])).toBeNull()
    expect(historyObservation([stored({ id: 'a', timestamp: 100 })])).toBeNull()
  })

  it('historyObservation excludes invalid sessions from comparison', () => {
    const invalid = stored(
      { id: 'bad', timestamp: 200 },
      makeResult({
        quality: {
          verdict: 'invalid',
          reasons: [],
          captureFixes: [],
          untrustedReps: [],
          untrustedRepNumbers: [],
          trustedRepCount: 0,
          phantomCandidateCount: 0,
        },
      }),
    )
    expect(historyObservation([invalid, stored({ id: 'a', timestamp: 100 })])).toBeNull()
  })

  it('historyObservation hedges and reports depth direction', () => {
    const older = stored(
      { id: 'older', timestamp: 100 },
      makeResult({ metrics: { ...makeResult().metrics, avgDepth: 105 } }),
    )
    const newer = stored(
      { id: 'newer', timestamp: 200 },
      makeResult({ metrics: { ...makeResult().metrics, avgDepth: 92 } }),
    )
    const text = historyObservation([older, newer])
    expect(text).toContain('deeper average bottom position')
    expect(text).toContain('not a trend claim')
    expect(text).not.toMatch(/injury|risk|diagnos/i)
  })

  it('historyObservation reads sub-threshold depth deltas as within noise (M32)', () => {
    const older = stored(
      { id: 'older', timestamp: 100 },
      makeResult({ metrics: { ...makeResult().metrics, avgDepth: 95 } }),
    )
    const newer = stored(
      { id: 'newer', timestamp: 200 },
      makeResult({ metrics: { ...makeResult().metrics, avgDepth: 92 } }),
    )
    const text = historyObservation([older, newer])
    expect(text).toContain('similar bottom depth')
    expect(text).toContain('within measurement noise')
    expect(text).toContain('heuristic')
    expect(text).not.toMatch(/deeper|shallower/)
  })
})
