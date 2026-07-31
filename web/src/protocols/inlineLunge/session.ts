/**
 * Forward-lunge session assembly (KQ-027) — frames in, `SessionResult` out.
 *
 * This is the seam that connects the existing research analysis
 * (`analyzeInlineLungeResearch`) to the session orchestrator the product
 * already renders. Nothing about the analysis changes here: the segmenter,
 * six-phase state machine, metrics, confidence and findings are invoked
 * exactly as the research tests exercise them. What this module adds is the
 * translation into the shape `ResultsScreen`, the report exporter and the
 * session store already understand.
 *
 * Three rules shape every branch below.
 *
 *  1. Frames enter through `FramePacket` v1. Production frames arrive from an
 *     uploaded video or a stored tape, and the packet boundary is where a
 *     malformed timestamp or frame index is refused — while the producer is
 *     still on the stack, not as an unexplained gap in a report.
 *
 *  2. Provenance is not negotiable. The analysis refuses any observation
 *     protocol other than `side-view-forward-lunge-stride-return-v1`, so a
 *     squat recording routed here fails closed instead of producing numbers.
 *
 *  3. Abstention is a first-class outcome. An unreadable recording, a set with
 *     no completed trial, and a low-confidence set each produce a real report
 *     that says what is missing — never an empty report that looks like a
 *     clean one.
 */
import { confidenceLevel } from '../../core/confidence'
import type { MetricResult } from '../../core/metric'
import type { Finding } from '../../core/finding'
import { normalizeObservationProtocolId } from '../../core/protocol'
import { makeProvenance, type CaptureContext } from '../../core/provenance'
import type { PoseFrame } from '../../cv/types'
import {
  assertPacketSequence,
  posesFromPackets,
  type FramePacket,
} from '../../ingest/framePacket'
import type { SessionResult, SetMetricsSummary } from '../../session/types'
import type { SetQualityAssessment, SetQualityReason } from '../../session/setQualityGate'
import { analyzeInlineLungeResearch } from '.'
import { deriveForwardLungeCues } from './coaching'
import { leadKneeAngleAtBottom } from './metrics'
import { FORWARD_LUNGE_PROFILE } from './profile'
import type { InlineLungeAnalysisResult, InlineLungeSide } from './types'

export interface ForwardLungeSessionInput {
  /** The capture as the ingestion envelope produced it (see ingest/framePacket). */
  packets: readonly FramePacket[]
  capture: CaptureContext
  /** Declared before capture; the analysis is undefined without it. */
  leadSide?: InlineLungeSide
  /**
   * Observation protocol the recording itself claims, when it carries one (a
   * stored pose tape does). A recording captured under a different observation
   * protocol is refused rather than reinterpreted — a front-view squat tape is
   * not a side-view lunge capture just because both contain legs.
   */
  observationProtocolId?: string
}

const CAPTURE_FIXES = [
  'Record from the side, near hip height, with the whole body and both feet visible.',
  'Stand still for about a second before the first step so the analysis can calibrate.',
  'Keep the camera still and the lighting even for the whole set.',
  'Confirm the lead leg you selected matches the leg you actually stepped with.',
]

/**
 * Read the capture through the ingestion boundary and hand back its poses.
 *
 * Until now this *built* packets from bare frames and immediately discarded
 * them, which validated one field and threw away every other thing a packet
 * knows. Packets are now stamped by the producer, so this only has to check
 * that what arrived is one coherent, ordered capture — and it deliberately
 * does not catch: a sequence the ingestion layer cannot vouch for must stop
 * the analysis, and the caller turns it into an explicit "this recording could
 * not be read" report.
 */
export function readCaptureSequence(packets: readonly FramePacket[]): PoseFrame[] {
  assertPacketSequence(packets)
  return posesFromPackets(packets)
}

const emptyMetrics = (repCount: number, overallConfidence: number): SetMetricsSummary => ({
  repCount,
  // A forward-lunge trial is not a squat rep and never pretends to be one:
  // the legacy per-rep array stays empty rather than carrying invented reps.
  reps: [],
  excludedRepNumbers: [],
  avgDepth: null,
  avgTrunkLean: null,
  depthCV: null,
  minDepth: null,
  maxDepth: null,
  avgHipShift: null,
  avgKneeAsymmetry: null,
  avgShoulderAsymmetry: null,
  overallConfidence,
})

function abstainingResult(
  reasons: SetQualityReason[],
  detailForNarrative: string,
): SessionResult {
  return {
    protocolId: 'forwardLungeStrideReturn',
    metrics: emptyMetrics(0, 0),
    metricResults: [],
    findings: [],
    scoring: null,
    feedback: [],
    sessionConfidence: 'Low',
    sessionConfidenceScore: 0,
    insufficientData: true,
    // The recording was read but could not be analyzed at all. That is not the
    // same as "no repetition was performed", so this is not a no-reps report —
    // it routes to the full-abstain panel with the reason above.
    noRepsDetected: false,
    posture: null,
    baseline: null,
    quality: {
      verdict: 'invalid',
      reasons: reasons.length
        ? reasons
        : [{ id: 'artifact-heavy-set', detail: detailForNarrative }],
      captureFixes: CAPTURE_FIXES,
      untrustedReps: [],
      untrustedRepNumbers: [],
      trustedRepCount: 0,
      phantomCandidateCount: 0,
    },
  }
}

function assessQuality(
  analysis: InlineLungeAnalysisResult,
  completed: number,
  readableRatio: number,
): SetQualityAssessment {
  const rejected = analysis.trials.filter((trial) => trial.status === 'rejected')
  const reasons: SetQualityReason[] = []
  if (completed === 0) {
    reasons.push({
      id: 'no-reps',
      detail:
        'No step-to-stable-return trial completed all six phases in this recording.',
    })
  }
  if (rejected.length > 0) {
    reasons.push({
      id: 'artifact-heavy-set',
      detail: `${rejected.length} trial attempt${rejected.length === 1 ? '' : 's'} could not be followed to a stable return (${[...new Set(rejected.map((trial) => trial.rejectionReason ?? 'rejected'))].join(', ')}).`,
    })
  }
  // A completed trial whose lead knee never bent is a readable recording of
  // something that is not a forward lunge. The trial count still stands — the
  // step and return happened — but the depth read is withheld and said so.
  const completedTrials = analysis.trials.filter((trial) => trial.status === 'completed')
  const bottomAngles = completedTrials.flatMap((trial) =>
    trial.leadKneeAngleAtBottom === null ? [] : [trial.leadKneeAngleAtBottom],
  )
  if (
    bottomAngles.length > 0 &&
    leadKneeAngleAtBottom(completedTrials) === null
  ) {
    const average = bottomAngles.reduce((sum, angle) => sum + angle, 0) / bottomAngles.length
    reasons.push({
      id: 'artifact-heavy-set',
      detail: `The lead knee stayed near straight at the detected bottom (about ${Math.round(average)}°), so no depth read is reported for this recording. Check that the camera is square to your side and that the lead leg is fully visible.`,
    })
  }
  if (readableRatio < FORWARD_LUNGE_PROFILE.minimumReadableRatio) {
    reasons.push({
      id: 'artifact-heavy-set',
      detail: `Only ${Math.round(readableRatio * 100)}% of frames had all required lead-leg and pelvis landmarks visible.`,
    })
  }
  const verdict =
    completed === 0 ? 'invalid' : reasons.length > 0 ? 'questionable' : 'valid'
  return {
    verdict,
    reasons,
    captureFixes: reasons.length > 0 ? CAPTURE_FIXES : [],
    untrustedReps: [],
    untrustedRepNumbers: [],
    trustedRepCount: completed,
    phantomCandidateCount: 0,
  }
}

/**
 * Observation line for a forward-lunge report.
 *
 * The squat summary counts reps and quotes an average depth; neither exists
 * here. This states the trial count, the observed timing, and the confidence
 * caveat, in the same voice.
 */
export function buildForwardLungeSummary(result: SessionResult): string {
  if (result.quality.verdict === 'invalid' && !result.noRepsDetected) {
    return 'This recording could not support a forward-lunge report.'
  }
  const trials = result.metrics.repCount
  if (trials === 0) {
    return 'No complete step-to-stable-return trial was observed in this recording.'
  }
  const duration = result.metricResults.find(
    (metric) => metric.metricId === 'forwardLungeStrideReturn.tempo.trial-duration',
  )?.value
  const timing =
    duration === null || duration === undefined
      ? ''
      : ` averaging ${duration.toFixed(2)}s from step to stable return`
  const tail =
    result.sessionConfidence === 'Low'
      ? ' Low camera confidence — use as a rough guide, not a precise read.'
      : ' Forward Lunge is experimental: this describes the recording, not measured accuracy.'
  return `${trials} complete step-to-stable-return trial${trials === 1 ? '' : 's'} observed from this side view${timing}.${tail}`
}

/**
 * Run the forward-lunge analysis over a captured frame sequence and assemble
 * the session result the product renders.
 */
export function buildForwardLungeSessionResult(
  input: ForwardLungeSessionInput,
): SessionResult {
  const leadSide = input.leadSide ?? FORWARD_LUNGE_PROFILE.defaultLeadSide

  if (input.observationProtocolId !== undefined) {
    let declared: string | null = null
    try {
      declared = normalizeObservationProtocolId(input.observationProtocolId)
    } catch {
      declared = null
    }
    if (declared !== FORWARD_LUNGE_PROFILE.observationProtocolId) {
      return abstainingResult(
        [{
          id: 'artifact-heavy-set',
          detail: `This recording was captured under the "${input.observationProtocolId}" observation protocol, not ${FORWARD_LUNGE_PROFILE.observationProtocolId}. Forward-lunge reads are only defined for the side-view capture.`,
        }],
        'This recording was captured under a different observation protocol.',
      )
    }
  }

  let frames: PoseFrame[]
  try {
    frames = readCaptureSequence(input.packets)
  } catch (error) {
    return abstainingResult(
      [{
        id: 'artifact-heavy-set',
        detail: `This recording could not be read as a frame sequence: ${error instanceof Error ? error.message : String(error)}`,
      }],
      'This recording could not be read as a frame sequence.',
    )
  }

  if (frames.length < FORWARD_LUNGE_PROFILE.minimumFrames) {
    return abstainingResult(
      [{
        id: 'artifact-heavy-set',
        detail: `Only ${frames.length} tracked frames were available; at least ${FORWARD_LUNGE_PROFILE.minimumFrames} are needed to calibrate a standing position and observe a trial.`,
      }],
      'This recording was too short to analyze.',
    )
  }

  const provenance = makeProvenance({
    ...input.capture,
    protocolId: FORWARD_LUNGE_PROFILE.observationProtocolId,
  })

  let analysis: InlineLungeAnalysisResult
  try {
    analysis = analyzeInlineLungeResearch(frames, {
      leadSide,
      provenance,
      calibrationFrames: FORWARD_LUNGE_PROFILE.calibrationFrames,
    })
  } catch (error) {
    // Calibration failure and provenance mismatch both land here. Both mean
    // the recording is not a forward-lunge capture this analysis is defined
    // for, so the report abstains rather than reporting on something else.
    return abstainingResult(
      [{
        id: 'artifact-heavy-set',
        detail: `This recording is not compatible with the ${FORWARD_LUNGE_PROFILE.observationProtocolId} protocol: ${error instanceof Error ? error.message : String(error)}`,
      }],
      'This recording is not compatible with the forward-lunge protocol.',
    )
  }

  const completed = analysis.trials.filter((trial) => trial.status === 'completed').length
  const readableRatio = analysis.signals.length
    ? analysis.signals.filter((sample) => sample.readable).length / analysis.signals.length
    : 0
  // Confidence describes landmark visibility only, and can never reach the
  // High chip while validation is blocked (profile ceiling).
  const confidenceValue = Math.min(FORWARD_LUNGE_PROFILE.confidenceCeiling, readableRatio)
  const sessionConfidence = confidenceLevel(confidenceValue)
  const sessionConfidenceScore = Math.round(confidenceValue * 100)
  const quality = assessQuality(analysis, completed, readableRatio)

  // Abstention mirrors the squat builder: a low-confidence or invalid set keeps
  // its measured evidence but withholds interpretation.
  const abstains = sessionConfidence === 'Low' || quality.verdict === 'invalid'
  const findings: Finding[] = abstains ? [] : analysis.findings
  const metricResults: MetricResult[] = analysis.metricResults

  return {
    protocolId: 'forwardLungeStrideReturn',
    metrics: emptyMetrics(completed, sessionConfidenceScore),
    metricResults,
    findings,
    scoring: null,
    feedback: deriveForwardLungeCues(metricResults, findings),
    sessionConfidence,
    sessionConfidenceScore,
    insufficientData: abstains,
    noRepsDetected: completed === 0,
    posture: null,
    baseline: null,
    quality,
  }
}
