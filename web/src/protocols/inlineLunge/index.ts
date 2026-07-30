import { LANDMARK_INDICES } from '../../cv/types'
import type { PoseFrame } from '../../cv/types'
import type { Protocol, ProtocolDefinition } from '../types'
import { validateProtocolTrialOutcomeSet, type ProtocolTrialOutcome } from '../outcome'
import { calibrateInlineLunge, extractInlineLungeSignals } from './signals'
import { segmentInlineLungeTrials } from './segmenter'
import { buildInlineLungeMetricResults, INLINE_LUNGE_METRIC_DEFINITIONS } from './metrics'
import { deriveInlineLungeResearchFindings } from './findings'
import { FORWARD_LUNGE_PROFILE } from './profile'
import type { InlineLungeAnalysisOptions, InlineLungeAnalysisResult } from './types'
import { FORWARD_LUNGE_OBSERVATION_PROTOCOL_ID, normalizeObservationProtocolId } from '../../core/protocol'

export const INLINE_LUNGE_PROTOCOL_DEFINITION: ProtocolDefinition = {
  // 'transition', not 'cyclic': the segmenter emits step-to-stable-return
  // trials, and every outcome it produces is already kind 'transition'.
  id: 'forwardLungeStrideReturn', label: 'Forward Lunge', kind: 'transition', status: 'planned',
  evidence: {
    schemaVersion: 2, researchState: 'research-only',
    evidenceRefs: ['docs/research/INLINE_LUNGE_PROTOCOL_RESEARCH.md', 'docs/validation/INLINE_LUNGE_LABELING_PROTOCOL.md'],
    datasetProvenance: [{ datasetId: 'llm-fms', role: 'ontology-only' }],
    cameraAssumptions: { validationState: 'unvalidated', evidenceRefs: ['docs/research/INLINE_LUNGE_PROTOCOL_RESEARCH.md'] },
    validationGates: [
      { id: 'synthetic-runtime', state: 'passed', evidenceRefs: ['web/src/protocols/inlineLunge/inlineLunge.test.ts'] },
      { id: 'subject-held-out-timed-data', state: 'blocked', evidenceRefs: ['docs/validation/INLINE_LUNGE_LABELING_PROTOCOL.md'] },
      { id: 'human-device-expert-review', state: 'pending', evidenceRefs: ['docs/implementation/KINEMATICIQ_PHASE3_HANDOFF.md'] },
    ],
    acceptanceThresholds: { provenance: 'provisional', evidenceRefs: ['docs/validation/INLINE_LUNGE_LABELING_PROTOCOL.md'] },
  },
  phases: ['standing', 'stepping', 'descending', 'bottom', 'ascending', 'returning'],
  requiredLandmarks: [LANDMARK_INDICES.LEFT_HIP, LANDMARK_INDICES.RIGHT_HIP, LANDMARK_INDICES.LEFT_KNEE, LANDMARK_INDICES.RIGHT_KNEE, LANDMARK_INDICES.LEFT_ANKLE, LANDMARK_INDICES.RIGHT_ANKLE, LANDMARK_INDICES.LEFT_FOOT_INDEX, LANDMARK_INDICES.RIGHT_FOOT_INDEX],
  capture: {
    // Upload and stored-tape replay are the paths this protocol can genuinely
    // execute today: both hand it a complete ordered frame sequence, which is
    // what its calibration window and six-phase segmenter require. Live camera
    // is deliberately absent — the live surface drives the cyclic rep engine,
    // and forward lunge has no cyclic runtime to drive it with.
    inputModes: ['upload', 'replay'], cameraView: 'side',
    parameters: [{
      id: 'leadSide',
      label: 'Lead leg',
      description: 'Foot displacement and knee angle are measured on the leg that steps. The analysis is undefined without it.',
      options: [{ value: 'left', label: 'Left leg steps forward' }, { value: 'right', label: 'Right leg steps forward' }],
      defaultValue: 'left',
    }],
    viewInstruction: 'Record from the side, near hip height, with your whole body and both feet in frame.',
    setupInstructions: [
      'Place the camera to your side at about hip height, 3–4 m away.',
      'Stand still for about a second before the first step so the analysis can calibrate.',
      'Step forward, descend, ascend, and return the lead foot to where it started.',
      'Record at least three complete lunges with the same lead leg in one continuous clip.',
    ],
    recoveryInstructions: {
      'out-of-frame': 'Step back until your whole body and both feet are visible from the side.',
      missing: 'Move into view and keep your lead leg and hips visible.',
      'low-confidence': 'Improve the lighting and keep your lead-side hip, knee, ankle, and foot visible.',
      'ambiguous-side': 'Keep the camera square to your side and only one person in frame.',
      rejected: 'Return to a stable standing position before the next lunge.',
      'short-gap': 'Hold your position briefly while tracking recovers.',
      recovered: 'Keep your position steady.',
    },
  },
  metrics: INLINE_LUNGE_METRIC_DEFINITIONS,
  findingRuleIds: ['rule.forwardLungeStrideReturn.completion', 'rule.forwardLungeStrideReturn.timing', 'rule.forwardLungeStrideReturn.consistency'],
  // Nothing here measures trunk position or side-to-side load, so those
  // questions are not claimed — reporting them as "inside the expected range"
  // would state a read that was never taken.
  coachQuestionIds: ['movement-completion', 'strategy-selection'],
  defaultObservationProtocolId: 'side-view-forward-lunge-stride-return-v1',
}

export const INLINE_LUNGE_PROTOCOL: Protocol = {
  definition: INLINE_LUNGE_PROTOCOL_DEFINITION,
  // A transition profile, not a MovementProfile: this protocol has a real
  // runtime configuration, it is simply not one the cyclic rep engine reads.
  profile: FORWARD_LUNGE_PROFILE,
}

/**
 * The forward-lunge analysis: calibration → signals → six-phase segmentation →
 * trial outcomes → metrics → findings, with abstention when no trial completes.
 *
 * Reached in the product through `FORWARD_LUNGE_RUNTIME` (./runtime.ts), which
 * wraps this in the session assembly the orchestrator renders. It stays
 * directly callable for the evaluation harness, which needs the raw trials.
 */
export function analyzeInlineLungeResearch(frames: readonly PoseFrame[], options: InlineLungeAnalysisOptions): InlineLungeAnalysisResult {
  const observationProtocolId = normalizeObservationProtocolId(options.provenance.protocolId)
  if (observationProtocolId !== FORWARD_LUNGE_OBSERVATION_PROTOCOL_ID) {
    throw new Error('Forward-lunge research analysis requires side-view-forward-lunge-stride-return-v1 provenance.')
  }
  const calibration = calibrateInlineLunge(frames, options.leadSide, options.calibrationFrames)
  const signals = extractInlineLungeSignals(frames, options.leadSide, calibration)
  // Retain the final calibration sample as the explicit standing anchor for
  // the first step; calibration itself is never eligible to create a trial.
  const trials = segmentInlineLungeTrials(signals.slice(calibration.frameCount - 1), options.leadSide)
  const outcomes = validateProtocolTrialOutcomeSet({
    schemaVersion: 1, protocolId: 'forwardLungeStrideReturn',
    trials: trials.map((trial): ProtocolTrialOutcome => trial.status === 'rejected'
      ? { id: `forward-lunge-stride-return-${options.leadSide}-${trial.trialIndex}`, kind: 'transition', status: 'rejected', startFrameIndex: trial.stepInitiationFrame, endFrameIndex: trial.stableReturnFrame, rejectionReason: trial.rejectionReason ?? 'rejected' }
      : { id: `forward-lunge-stride-return-${options.leadSide}-${trial.trialIndex}`, kind: 'transition', status: 'completed', startFrameIndex: trial.stepInitiationFrame, endFrameIndex: trial.stableReturnFrame }),
  })
  const provenance = { ...options.provenance, protocolId: observationProtocolId }
  const metricResults = buildInlineLungeMetricResults(trials, options.leadSide, provenance)
  const completed = trials.filter((trial) => trial.status === 'completed').length
  const abstentionReasons = completed === 0 ? ['No complete step-to-stable-return trial was observed.'] : []
  return { schemaVersion: 1, protocolId: 'forwardLungeStrideReturn', leadSide: options.leadSide, calibration, signals, trials, outcomes, metricResults, findings: completed ? deriveInlineLungeResearchFindings(metricResults) : [], abstentionReasons }
}
