/**
 * Protocol runtime contract v2 (M39).
 *
 * The pluggable runtime a protocol provides so future movements can supply
 * their own segmentation, metric collection, finding rules, quality
 * assessment, and report copy — without forking the pipeline (R01 §6.3
 * movement-agnostic/-specific split; R08 §3 plugin contracts).
 *
 * M39 scope: contract + squat adapter only. The squat runtime WRAPS the
 * existing modules — every method delegates to the exact function the
 * pipeline already uses, so outputs are identical by construction and
 * existing call sites are NOT migrated yet (that is M43's job). The legacy
 * `MovementProfile` on `Protocol` stays untouched for compatibility.
 *
 * Planned protocols have no runtime: `getProtocolRuntime` throws
 * `NotImplementedError` so nothing upstream can run an unvalidated analysis
 * (same rule as `getProtocolProfile`).
 */
import {
  runPipelineOnFrames,
  type PipelineInitialState,
} from '../analysis/videoAnalyzer'
import { collectSetMetrics } from '../analysis/metricCollector'
import type { RepRejection } from '../analysis/repCounter'
import { deriveCoaching, type CoachingOutput } from '../findings/engine'
import { assessSetQuality } from '../session/setQualityGate'
import { buildResultsSummary } from '../session/buildSessionResult'
import { NotImplementedError, type ProtocolId } from '../core/protocol'
import type { ComponentScores, ConfidenceLevel } from '../session/types'
import type {
  SessionResult,
  SetMetricsSummary,
} from '../session/types'
import type { SetQualityAssessment } from '../session/setQualityGate'
import type { MetricResult } from '../core/metric'
import type { PoseFrame, RepMetrics } from '../cv/types'
import { getProtocol } from './registry'

/** Everything segmentation produces — shape-identical to `runPipelineOnFrames`. */
export type SegmentationOutput = ReturnType<typeof runPipelineOnFrames>

export interface CollectMetricsInput {
  reps: RepMetrics[]
  sessionConfidenceScore: number
  /** Reps excluded from aggregates (untrusted + outlier), always disclosed. */
  excludedRepNumbers: Set<number>
}

export interface DeriveFindingsInput {
  components: ComponentScores
  sessionConfidence: ConfidenceLevel
  metrics: SetMetricsSummary
  metricResults: readonly MetricResult[]
  quality: SetQualityAssessment
}

/** Protocol-specific copy the report layer needs beyond the result itself. */
export interface ReportMetadata {
  protocolId: ProtocolId
  /** User-facing movement name from the protocol definition. */
  protocolLabel: string
  /** Verdict-aware headline (abstain copy included) for this result. */
  headline: string
}

/**
 * The five stages a protocol must provide to run end-to-end. Contract only in
 * M39 — the assembly order (segment → quality → metrics → findings → report)
 * stays owned by the caller until M43 introduces the protocol-aware entry
 * point.
 */
export interface ProtocolRuntime {
  protocolId: ProtocolId
  /** Frames → reps + per-frame streams (FSM segmentation). */
  segmentFrames(
    frames: readonly PoseFrame[],
    initial?: PipelineInitialState,
  ): SegmentationOutput
  /** Aggregate per-rep data into the set summary. */
  collectMetrics(input: CollectMetricsInput): SetMetricsSummary
  /** Metrics → observation-language findings + cues (abstain-aware). */
  deriveFindings(input: DeriveFindingsInput): CoachingOutput
  /** Report-level valid/questionable/invalid classification. */
  assessQuality(
    reps: RepMetrics[],
    rejections: RepRejection[],
  ): SetQualityAssessment
  /** Protocol copy for the report layer (label, verdict-aware headline). */
  buildReportMetadata(result: SessionResult): ReportMetadata
}

/**
 * Squat runtime — pure delegation to the modules the pipeline already uses.
 * No thresholds, no logic, no reordering lives here: if this adapter ever
 * diverges from the direct calls, that is a defect (parity-tested).
 */
export const SQUAT_RUNTIME: ProtocolRuntime = {
  protocolId: 'squat',
  segmentFrames: (frames, initial) => runPipelineOnFrames(frames, initial),
  collectMetrics: ({ reps, sessionConfidenceScore, excludedRepNumbers }) =>
    collectSetMetrics(reps, sessionConfidenceScore, excludedRepNumbers),
  deriveFindings: (input) => deriveCoaching({ protocolId: 'squat', ...input }),
  assessQuality: (reps, rejections) => assessSetQuality(reps, rejections),
  buildReportMetadata: (result) => ({
    protocolId: 'squat',
    protocolLabel: getProtocol('squat').definition.label,
    headline: buildResultsSummary(result),
  }),
}

const RUNTIMES: Partial<Record<ProtocolId, ProtocolRuntime>> = {
  squat: SQUAT_RUNTIME,
}

/**
 * Runtime lookup. Mirrors `getProtocolProfile`'s safety rule: planned
 * protocols throw `NotImplementedError`; unregistered ids throw via
 * `getProtocol`. Lives here (not registry.ts) to keep the registry free of
 * an import cycle through session/buildSessionResult.
 */
export function getProtocolRuntime(id: ProtocolId): ProtocolRuntime {
  const runtime = RUNTIMES[id]
  if (runtime) {
    return runtime
  }
  // Throws for unregistered ids; distinguishes planned from broken below.
  const { definition } = getProtocol(id)
  if (definition.status === 'planned') {
    throw new NotImplementedError(definition.id)
  }
  throw new Error(
    `Protocol "${id}" is available but has no registered runtime — register it in protocols/runtime.ts.`,
  )
}
