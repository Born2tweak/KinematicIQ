import { getProtocol } from '../../protocols/registry'
import { getProtocolRuntime } from '../../protocols/runtime'
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

/**
 * The observation line for this set.
 *
 * A transition protocol counts trials, not reps, and has no depth read to
 * quote, so its runtime owns this copy. Asking the squat summary to describe it
 * would report "0 reps" for a set that completed three trials.
 */
function observedLine(result: SessionResult, kind: string): string {
  if (kind !== 'transition') return buildResultsSummary(result)
  return (
    getProtocolRuntime(result.protocolId).buildReportMetadata?.(result).headline ??
    buildResultsSummary(result)
  )
}

/** One deterministic narrative; every fact has one canonical Summary home. */
export function buildResultsNarrative(result: SessionResult): ResultsNarrative {
  const protocol = getProtocol(result.protocolId).definition
  const verdict = result.quality.verdict
  // What this protocol calls one observation. Reporting "reps" for a
  // step-to-stable-return trial would name a unit the analysis never produced.
  const unit = protocol.kind === 'transition' ? 'trial' : 'rep'
  const observed = observedLine(result, protocol.kind)
  const count = result.metrics.repCount
  const tiers = new Set(result.metricResults.map((metric) => metric.validationTier))
  const validation = tiers.size === 0
    ? 'Scientific validation: no movement metric was eligible for this recording.'
    : `Scientific validation: ${[...tiers].join(' and ')} metric evidence; this is separate from camera confidence.`
  const cameraConfidence =
    `Camera confidence: ${result.sessionConfidence} (${result.sessionConfidenceScore}%) describes landmark visibility and tracking, not movement validity.`

  if (result.noRepsDetected) {
    return {
      headline: `No ${protocol.label.toLowerCase()} ${unit === 'trial' ? 'trials' : 'repetitions'} were confirmed`,
      observed,
      why: `The analysis did not receive a complete ${unit} that passed its capture and completion gates.`,
      next: result.quality.captureFixes[0] ?? protocol.capture.viewInstruction,
      cameraConfidence,
      validation,
    }
  }
  if (verdict === 'invalid') {
    return {
      headline: 'No movement report from this recording',
      observed,
      why: result.quality.reasons[0]?.detail ?? 'The recording did not support a trustworthy movement read.',
      next: result.quality.captureFixes[0] ?? protocol.capture.viewInstruction,
      cameraConfidence,
      validation,
    }
  }
  if (verdict === 'questionable') {
    return {
      headline: `${count} observed ${unit}${count === 1 ? '' : 's'} — capture check only`,
      observed,
      why: result.quality.reasons[0]?.detail ?? 'Part of the recording could not be trusted.',
      next: result.quality.captureFixes[0] ?? 'Record another set before comparing movement observations.',
      cameraConfidence,
      validation,
    }
  }
  const primary = result.findings[0]
  return {
    headline: `${count} observed ${unit}${count === 1 ? '' : 's'}`,
    observed,
    why: primary?.statement ?? 'No reviewed finding rule produced a notable observation.',
    next: primary?.tryNext ?? 'Use the Evidence tab to inspect the measured set details.',
    cameraConfidence,
    validation,
  }
}
