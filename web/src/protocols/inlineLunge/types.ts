import type { MetricResult } from '../../core/metric'
import type { Finding } from '../../core/finding'
import type { Provenance } from '../../core/provenance'
import type { ProtocolTrialOutcomeSetV1 } from '../outcome'

export type InlineLungeSide = 'left' | 'right'
export type InlineLungePhase = 'standing' | 'stepping' | 'descending' | 'bottom' | 'ascending' | 'returning'

export interface InlineLungeAnalysisOptions {
  leadSide: InlineLungeSide
  provenance: Provenance
  calibrationFrames?: number
}

export interface InlineLungeSignalSample {
  frameIndex: number
  timestamp: number
  readable: boolean
  footDisplacement: number | null
  pelvisDrop: number | null
  leadKneeAngle: number | null
}

export interface InlineLungeTrial {
  trialIndex: number
  leadSide: InlineLungeSide
  status: 'completed' | 'rejected'
  rejectionReason?: string
  standingStartFrame: number
  stepInitiationFrame: number
  descentStartFrame: number
  bottomFrame: number
  ascentStartFrame: number
  stableReturnFrame: number
  startTimestamp: number
  stepTimestamp: number
  descentTimestamp: number
  bottomTimestamp: number
  ascentTimestamp: number
  returnTimestamp: number
  leadKneeAngleAtBottom: number | null
  readableFrameRatio: number
}

export interface InlineLungeAnalysisResult {
  schemaVersion: 1
  protocolId: 'forwardLungeStrideReturn'
  leadSide: InlineLungeSide
  calibration: { frameCount: number; leadFootX: number; pelvisY: number }
  signals: InlineLungeSignalSample[]
  trials: InlineLungeTrial[]
  outcomes: ProtocolTrialOutcomeSetV1
  metricResults: MetricResult[]
  findings: Finding[]
  abstentionReasons: string[]
}
