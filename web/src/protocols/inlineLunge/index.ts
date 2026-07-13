import { LANDMARK_INDICES } from '../../cv/types'
import type { PoseFrame } from '../../cv/types'
import type { Protocol, ProtocolDefinition } from '../types'
import { validateProtocolTrialOutcomeSet, type ProtocolTrialOutcome } from '../outcome'
import { calibrateInlineLunge, extractInlineLungeSignals } from './signals'
import { segmentInlineLungeTrials } from './segmenter'
import { buildInlineLungeMetricResults, INLINE_LUNGE_METRIC_DEFINITIONS } from './metrics'
import { deriveInlineLungeResearchFindings } from './findings'
import type { InlineLungeAnalysisOptions, InlineLungeAnalysisResult } from './types'

export const INLINE_LUNGE_PROTOCOL_DEFINITION: ProtocolDefinition = {
  id: 'inlineLunge', label: 'Inline lunge', kind: 'cyclic', status: 'planned',
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
    inputModes: [], cameraView: 'side',
    viewInstruction: 'Research protocol: side view near hip height, with the full body and both feet visible.',
    setupInstructions: ['Declare the lead side before capture.', 'Begin in a stable standing position.', 'Step, descend, ascend, and return the lead foot to the starting region.', 'This protocol cannot be started in the product until validation and activation gates pass.'],
  },
  metrics: INLINE_LUNGE_METRIC_DEFINITIONS,
  findingRuleIds: ['rule.inlineLunge.completion', 'rule.inlineLunge.timing', 'rule.inlineLunge.consistency'],
  defaultObservationProtocolId: 'side-view-inline-lunge-v1',
}

export const INLINE_LUNGE_PROTOCOL: Protocol = { definition: INLINE_LUNGE_PROTOCOL_DEFINITION, profile: null }

/** Executable research seam. It is intentionally not registered as a public ProtocolRuntime. */
export function analyzeInlineLungeResearch(frames: readonly PoseFrame[], options: InlineLungeAnalysisOptions): InlineLungeAnalysisResult {
  if (options.provenance.protocolId !== 'side-view-inline-lunge-v1') {
    throw new Error('Inline-lunge research analysis requires side-view-inline-lunge-v1 provenance.')
  }
  const calibration = calibrateInlineLunge(frames, options.leadSide, options.calibrationFrames)
  const signals = extractInlineLungeSignals(frames, options.leadSide, calibration)
  // Retain the final calibration sample as the explicit standing anchor for
  // the first step; calibration itself is never eligible to create a trial.
  const trials = segmentInlineLungeTrials(signals.slice(calibration.frameCount - 1), options.leadSide)
  const outcomes = validateProtocolTrialOutcomeSet({
    schemaVersion: 1, protocolId: 'inlineLunge',
    trials: trials.map((trial): ProtocolTrialOutcome => trial.status === 'rejected'
      ? { id: `inline-lunge-${options.leadSide}-${trial.trialIndex}`, kind: 'transition', status: 'rejected', startFrameIndex: trial.stepInitiationFrame, endFrameIndex: trial.stableReturnFrame, rejectionReason: trial.rejectionReason ?? 'rejected' }
      : { id: `inline-lunge-${options.leadSide}-${trial.trialIndex}`, kind: 'transition', status: 'completed', startFrameIndex: trial.stepInitiationFrame, endFrameIndex: trial.stableReturnFrame }),
  })
  const metricResults = buildInlineLungeMetricResults(trials, options.leadSide, options.provenance)
  const completed = trials.filter((trial) => trial.status === 'completed').length
  const abstentionReasons = completed === 0 ? ['No complete step-to-stable-return trial was observed.'] : []
  return { schemaVersion: 1, protocolId: 'inlineLunge', leadSide: options.leadSide, calibration, signals, trials, outcomes, metricResults, findings: completed ? deriveInlineLungeResearchFindings(metricResults) : [], abstentionReasons }
}
