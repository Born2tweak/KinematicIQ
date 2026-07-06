/**
 * Pure view model for the local history screen (M9).
 *
 * Longitudinal copy follows the claims policy: camera-based observations with
 * hedged language, never progress grades or medical framing
 * (docs/doctrine/claims-policy.md; docs/research/11 §history/trends).
 */

import type { StoredSession } from './sessionStore'

export interface HistoryRow {
  id: string
  /** e.g. "Jul 5, 2026, 10:12 PM" (locale-formatted). */
  dateLabel: string
  protocolId: string
  repCount: number
  trustedRepCount: number
  verdict: string
  confidenceLevel: string
}

export function buildHistoryRows(sessions: StoredSession[]): HistoryRow[] {
  return sessions.map((session) => ({
    id: session.id,
    dateLabel: new Date(session.timestamp).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }),
    protocolId: session.protocolId,
    repCount: session.result.metrics.repCount,
    trustedRepCount: session.result.quality.trustedRepCount,
    verdict: session.result.quality.verdict,
    confidenceLevel: session.result.sessionConfidence,
  }))
}

/**
 * One hedged, observation-language sentence comparing the two most recent
 * trustworthy sessions of the same protocol. Null when there is nothing
 * defensible to say (fewer than two comparable sessions). Invalid sets are
 * excluded — an abstained report contributes no longitudinal evidence.
 */
export function historyObservation(sessions: StoredSession[]): string | null {
  const comparable = sessions
    .filter((s) => s.result.quality.verdict !== 'invalid')
    .sort((a, b) => b.timestamp - a.timestamp)
  if (comparable.length < 2) return null
  const [latest] = comparable
  const previous = comparable.find(
    (s) => s !== latest && s.protocolId === latest.protocolId,
  )
  if (!previous) return null

  const latestDepth = latest.result.metrics.avgDepth
  const previousDepth = previous.result.metrics.avgDepth
  if (latestDepth === null || previousDepth === null) {
    return (
      `Across your last two ${latest.protocolId} sessions the camera logged ` +
      `${previous.result.quality.trustedRepCount} then ` +
      `${latest.result.quality.trustedRepCount} trusted reps — a capture ` +
      `observation, not a progress grade.`
    )
  }

  const delta = latestDepth - previousDepth
  const direction =
    Math.abs(delta) < 3
      ? 'similar bottom depth'
      : delta < 0
        ? 'a deeper average bottom position'
        : 'a shallower average bottom position'
  return (
    `Compared with your previous ${latest.protocolId} session, the camera ` +
    `read ${direction} in this one (${Math.round(previousDepth)}° → ` +
    `${Math.round(latestDepth)}° knee angle). Camera-based observation from ` +
    `two sessions — not a trend claim or a progress grade.`
  )
}
