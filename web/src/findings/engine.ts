/**
 * Finding engine (M7) — the protocol-agnostic entry point that turns a set's
 * evidence into findings + cues, honoring the quality-gate abstain.
 *
 * `invalid` set ⇒ zero findings and zero cues (full abstain, verdict-or-abstain,
 * commit 2408a58). Low session confidence ⇒ zero (matches pre-M7 behavior).
 * Otherwise it dispatches to the active protocol's rules (squat today).
 */
import type { ComponentScores, ConfidenceLevel, SetMetricsSummary } from '../session/types'
import type { SetQualityAssessment } from '../session/setQualityGate'
import type { ProtocolId } from '../core/protocol'
import type { MetricResult } from '../core/metric'
import type { Finding } from '../core/finding'
import type { CoachingCue } from '../session/types'
import { deriveSquatCoaching } from './squatRules'

export interface CoachingInput {
  protocolId: ProtocolId
  components: ComponentScores
  sessionConfidence: ConfidenceLevel
  metrics: SetMetricsSummary
  metricResults: readonly MetricResult[]
  quality: SetQualityAssessment
  maxCues?: number
}

export interface CoachingOutput {
  findings: Finding[]
  cues: CoachingCue[]
}

const EMPTY: CoachingOutput = { findings: [], cues: [] }

/**
 * Build findings + derived cues for a set. Fully abstains on an invalid quality
 * verdict, then dispatches to the protocol's rules.
 */
export function deriveCoaching(input: CoachingInput): CoachingOutput {
  if (input.quality.verdict === 'invalid') {
    return EMPTY
  }
  switch (input.protocolId) {
    case 'squat':
      return deriveSquatCoaching(
        input.components,
        input.sessionConfidence,
        input.metrics,
        input.metricResults,
        input.maxCues ?? 2,
      )
    case 'hipHinge':
    case 'jump':
    case 'sprint':
      return EMPTY
    default:
      return EMPTY
  }
}
