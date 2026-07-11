import { getProtocol } from '../../protocols/registry'
import type { SessionResult } from '../../session/types'
import { buildResultsSummary } from '../../session/buildSessionResult'

export interface ResultsNarrative {
  headline: string
  observed: string
  why: string
  next: string
  cameraConfidence: string
  validation: string
}

/** One deterministic narrative; every fact has one canonical Summary home. */
export function buildResultsNarrative(result: SessionResult): ResultsNarrative {
  const protocol = getProtocol(result.protocolId).definition
  const verdict = result.quality.verdict
  const tiers = new Set(result.metricResults.map((metric) => metric.validationTier))
  const validation = tiers.size === 0
    ? 'Scientific validation: no movement metric was eligible for this recording.'
    : `Scientific validation: ${[...tiers].join(' and ')} metric evidence; this is separate from camera confidence.`
  const cameraConfidence =
    `Camera confidence: ${result.sessionConfidence} (${result.sessionConfidenceScore}%) describes landmark visibility and tracking, not movement validity.`

  if (result.noRepsDetected) {
    return {
      headline: `No ${protocol.label.toLowerCase()} repetitions were confirmed`,
      observed: buildResultsSummary(result),
      why: 'The analysis did not receive a complete repetition that passed its capture and completion gates.',
      next: result.quality.captureFixes[0] ?? protocol.capture.viewInstruction,
      cameraConfidence,
      validation,
    }
  }
  if (verdict === 'invalid') {
    return {
      headline: 'No movement report from this recording',
      observed: buildResultsSummary(result),
      why: result.quality.reasons[0]?.detail ?? 'The recording did not support a trustworthy movement read.',
      next: result.quality.captureFixes[0] ?? protocol.capture.viewInstruction,
      cameraConfidence,
      validation,
    }
  }
  if (verdict === 'questionable') {
    return {
      headline: `${result.metrics.repCount} observed rep${result.metrics.repCount === 1 ? '' : 's'} — capture check only`,
      observed: buildResultsSummary(result),
      why: result.quality.reasons[0]?.detail ?? 'Part of the recording could not be trusted.',
      next: result.quality.captureFixes[0] ?? 'Record another set before comparing movement observations.',
      cameraConfidence,
      validation,
    }
  }
  const primary = result.findings[0]
  return {
    headline: `${result.metrics.repCount} observed rep${result.metrics.repCount === 1 ? '' : 's'}`,
    observed: buildResultsSummary(result),
    why: primary?.statement ?? 'No reviewed finding rule produced a notable observation.',
    next: primary?.tryNext ?? 'Use the Evidence tab to inspect the measured set details.',
    cameraConfidence,
    validation,
  }
}

