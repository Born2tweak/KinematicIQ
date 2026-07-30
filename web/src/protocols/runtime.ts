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
import { normalizeProtocolId, NotImplementedError, type ProtocolId, type ProtocolIdInput } from '../core/protocol'
import type { ComponentScores, ConfidenceLevel } from '../session/types'
import type {
  SessionResult,
  SetMetricsSummary,
} from '../session/types'
import type { SetQualityAssessment } from '../session/setQualityGate'
import type { MetricResult } from '../core/metric'
import type { PoseFrame, RepMetrics } from '../cv/types'
import type { PostureFrameSample } from '../analysis/posture/postureFrame'
import type { CaptureContext } from '../core/provenance'
import { buildSessionResult } from '../session/buildSessionResult'
import { getProtocol } from './registry'
import { createAutoFinishState, updateAutoFinish } from '../analysis/autoFinish'
import { STABLE_FRAMES_REQUIRED, createAutoStartState, updateAutoStart } from '../analysis/autoStart'
import { standingKneeThreshold, updatePhaseDetector } from '../analysis/phaseDetector'
import { updateRepCounter } from '../analysis/repCounter'
import { activateAnalysisPipeline, createFreshAnalysisPipeline } from '../analysis/setActivation'
import {
  validateProtocolTrialOutcomeSet,
  type ProtocolTrialOutcome,
  type ProtocolTrialOutcomeSetV1,
} from './outcome'
import { FORWARD_LUNGE_RUNTIME } from './inlineLunge/runtime'

/** Everything segmentation produces — shape-identical to `runPipelineOnFrames`. */
export type SegmentationOutput = ReturnType<typeof runPipelineOnFrames>

export interface BuildProtocolSessionInput {
  reps: RepMetrics[]
  poseConfidenceSamples?: number[]
  postureSamples?: PostureFrameSample[]
  repRejections?: RepRejection[]
  capture?: CaptureContext
}

/** Compatibility seam for today's cyclic live engine; owned by the squat adapter. */
export interface LiveCyclicRuntime {
  stableFramesRequired: number
  createAutoStart: typeof createAutoStartState
  updateAutoStart: typeof updateAutoStart
  createAutoFinish: typeof createAutoFinishState
  updateAutoFinish: typeof updateAutoFinish
  createPipeline: typeof createFreshAnalysisPipeline
  activatePipeline: typeof activateAnalysisPipeline
  updatePhase: typeof updatePhaseDetector
  updateRep: typeof updateRepCounter
  standingKneeThreshold: typeof standingKneeThreshold
}

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

/** Capture parameters the athlete declares before a recording means anything. */
export interface ProtocolSessionParameters {
  /** Forward lunge: which leg steps. The analysis is undefined without it. */
  leadSide?: string
}

/** Everything a whole-session runtime needs to analyze a captured sequence. */
export interface ProtocolSessionInput {
  frames: readonly PoseFrame[]
  capture: CaptureContext
  parameters?: ProtocolSessionParameters
  /** Stable id for the capture these frames belong to (FramePacket identity). */
  captureId?: string
  /** Observation protocol the recording claims, when it carries one. */
  observationProtocolId?: string
}

/**
 * What a protocol provides to run end-to-end.
 *
 * Two shapes are legal, and a runtime must satisfy exactly one of them.
 *
 *   Cyclic rep protocols implement the five squat-shaped stages (segment →
 *   quality → metrics → findings → report) plus `buildSessionResult`; the
 *   assembly order stays owned by the caller.
 *
 *   Protocols the cyclic rep engine cannot express implement `analyzeSession`
 *   and own the whole frames→result path themselves.
 *
 * The stage methods are optional rather than mandatory-and-throwing because a
 * runtime that declares `segmentFrames` and then refuses to segment is a
 * contract that lies. Absence is the accurate statement. `CyclicProtocolRuntime`
 * below restores them as required for the protocols that do have them.
 */
export interface ProtocolRuntime {
  protocolId: ProtocolId
  outcomeKinds: ProtocolTrialOutcome['kind'][]
  liveCyclic?: LiveCyclicRuntime
  /** Additive adapter; legacy segmentation output remains unchanged. */
  buildTrialOutcomes?(segmentation: SegmentationOutput): ProtocolTrialOutcomeSetV1
  /** Frames → reps + per-frame streams (FSM segmentation). */
  segmentFrames?(
    frames: readonly PoseFrame[],
    initial?: PipelineInitialState,
  ): SegmentationOutput
  /** Aggregate per-rep data into the set summary. */
  collectMetrics?(input: CollectMetricsInput): SetMetricsSummary
  /** Metrics → observation-language findings + cues (abstain-aware). */
  deriveFindings?(input: DeriveFindingsInput): CoachingOutput
  /** Report-level valid/questionable/invalid classification. */
  assessQuality?(
    reps: RepMetrics[],
    rejections: RepRejection[],
  ): SetQualityAssessment
  /** Protocol copy for the report layer (label, verdict-aware headline). */
  buildReportMetadata?(result: SessionResult): ReportMetadata
  buildSessionResult?(input: BuildProtocolSessionInput): SessionResult
  /** Whole-session path for protocols with their own segmentation engine. */
  analyzeSession?(input: ProtocolSessionInput): SessionResult
}

/** A runtime driven by the shared cyclic rep engine; every stage is present. */
export interface CyclicProtocolRuntime extends ProtocolRuntime {
  buildTrialOutcomes(segmentation: SegmentationOutput): ProtocolTrialOutcomeSetV1
  segmentFrames(
    frames: readonly PoseFrame[],
    initial?: PipelineInitialState,
  ): SegmentationOutput
  collectMetrics(input: CollectMetricsInput): SetMetricsSummary
  deriveFindings(input: DeriveFindingsInput): CoachingOutput
  assessQuality(
    reps: RepMetrics[],
    rejections: RepRejection[],
  ): SetQualityAssessment
  buildReportMetadata(result: SessionResult): ReportMetadata
  buildSessionResult(input: BuildProtocolSessionInput): SessionResult
}

/** True when this runtime can produce a report from frames on its own. */
export function isRunnableRuntime(runtime: ProtocolRuntime): boolean {
  return Boolean(runtime.analyzeSession ?? (runtime.segmentFrames && runtime.buildSessionResult))
}

/**
 * Squat runtime — pure delegation to the modules the pipeline already uses.
 * No thresholds, no logic, no reordering lives here: if this adapter ever
 * diverges from the direct calls, that is a defect (parity-tested).
 */
export const SQUAT_RUNTIME: CyclicProtocolRuntime = {
  protocolId: 'squat',
  outcomeKinds: ['repetition'],
  liveCyclic: {
    stableFramesRequired: STABLE_FRAMES_REQUIRED,
    createAutoStart: createAutoStartState,
    updateAutoStart,
    createAutoFinish: createAutoFinishState,
    updateAutoFinish,
    createPipeline: createFreshAnalysisPipeline,
    activatePipeline: activateAnalysisPipeline,
    updatePhase: updatePhaseDetector,
    updateRep: updateRepCounter,
    standingKneeThreshold,
  },
  buildTrialOutcomes: (segmentation) => adaptSquatTrialOutcomes(segmentation),
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
  buildSessionResult: (input) =>
    buildSessionResult(
      input.reps,
      input.poseConfidenceSamples ?? [],
      input.postureSamples ?? [],
      input.repRejections ?? [],
      'squat',
      input.capture,
    ),
}

export function adaptSquatTrialOutcomes(
  segmentation: SegmentationOutput,
): ProtocolTrialOutcomeSetV1 {
  const observed: ProtocolTrialOutcome[] = [
    ...segmentation.reps.map((rep, index): ProtocolTrialOutcome => ({
      id: `squat-repetition-${index + 1}`,
      kind: 'repetition',
      status: 'completed',
      startFrameIndex: rep.startFrameIndex,
      endFrameIndex: rep.endFrameIndex,
    })),
    ...segmentation.repRejections.map((rejection, index): ProtocolTrialOutcome => ({
      id: `squat-rejection-${index + 1}`,
      kind: 'repetition',
      status: 'rejected',
      startFrameIndex: rejection.startFrameIndex,
      endFrameIndex: rejection.endFrameIndex,
      rejectionReason: rejection.reason,
    })),
  ].sort((left, right) => {
    const startDelta = (left.startFrameIndex ?? Infinity) - (right.startFrameIndex ?? Infinity)
    return startDelta || left.id.localeCompare(right.id)
  })

  return validateProtocolTrialOutcomeSet({
    schemaVersion: 1,
    protocolId: 'squat',
    trials: observed,
  })
}

const RUNTIMES: Partial<Record<ProtocolId, ProtocolRuntime>> = {
  squat: SQUAT_RUNTIME,
  forwardLungeStrideReturn: FORWARD_LUNGE_RUNTIME,
}

/**
 * Whether a protocol has an implementation at all.
 *
 * This is the honest input to `deriveEngineeringState`: a runtime exists or it
 * does not. The legacy binary `status` flag cannot answer this question — it
 * conflates "implemented" with "scientifically validated", which is exactly the
 * conflation the protocol package schema (KQ-026) separates.
 */
export function hasProtocolRuntime(id: ProtocolIdInput): boolean {
  try {
    return RUNTIMES[normalizeProtocolId(id)] !== undefined
  } catch {
    return false
  }
}

/**
 * Runtime lookup. Mirrors `getProtocolProfile`'s safety rule: protocols with
 * no implementation throw `NotImplementedError`; unregistered ids throw via
 * `getProtocol`. Lives here (not registry.ts) to keep the registry free of
 * an import cycle through session/buildSessionResult.
 */
export function getProtocolRuntime(id: ProtocolIdInput): ProtocolRuntime {
  const canonicalId = normalizeProtocolId(id)
  const runtime = RUNTIMES[canonicalId]
  if (runtime) {
    return runtime
  }
  // Throws for unregistered ids; distinguishes planned from broken below.
  const { definition } = getProtocol(canonicalId)
  if (definition.status === 'planned') {
    throw new NotImplementedError(definition.id)
  }
  throw new Error(
    `Protocol "${canonicalId}" is available but has no registered runtime — register it in protocols/runtime.ts.`,
  )
}

/**
 * Runtime lookup for callers that specifically need the cyclic rep stages
 * (replay harness, live camera session). Refuses a runtime that does not have
 * them rather than letting an undefined method surface as a crash mid-analysis.
 */
export function getCyclicProtocolRuntime(id: ProtocolIdInput): CyclicProtocolRuntime {
  const runtime = getProtocolRuntime(id)
  if (!runtime.segmentFrames || !runtime.buildSessionResult) {
    throw new Error(
      `Protocol "${runtime.protocolId}" is not segmented by the cyclic rep engine — use its analyzeSession runtime instead.`,
    )
  }
  return runtime as CyclicProtocolRuntime
}
