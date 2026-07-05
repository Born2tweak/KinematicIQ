import type { RepRejection } from '../analysis/repCounter'

/**
 * Coach-facing copy for a rep-gate rejection reason. Keeps normal mode free of
 * monospace gate dumps while still explaining why a rep was not counted.
 */
export function coachRejectionMessage(reason: string): string {
  if (reason.startsWith('Bottom not held')) {
    return 'Rep not counted — hold the bottom position a little longer'
  }
  if (reason.startsWith('Too fast')) {
    return 'Rep not counted — that rep was too quick to count'
  }
  if (reason.startsWith('Too slow')) {
    return 'Rep not counted — finish the rep at a steady pace'
  }
  if (reason.startsWith('Pose confidence')) {
    return 'Rep not counted — tracking lost; check framing and lighting'
  }
  if (reason.startsWith('Knee lift')) {
    return 'Rep not counted — keep both feet planted through the rep'
  }
  if (reason.startsWith('Movement looked seated')) {
    return 'Rep not counted — stay upright; avoid sitting back into the squat'
  }
  if (reason.startsWith('Tracking lost')) {
    return 'Rep not counted — body left the frame or tracking dropped'
  }
  if (reason.startsWith('Knee angle never passed')) {
    return 'Rep not counted — stand all the way up to finish the rep'
  }
  if (reason.startsWith('Did not return')) {
    return 'Rep not counted — return fully to standing'
  }
  return `Rep not counted — ${reason.charAt(0).toLowerCase()}${reason.slice(1)}`
}

export interface RepFeedbackHudInput {
  phase: string
  isAnalyst: boolean
  lastMissedReason: string | null
  rejectionCount: number
  completedRepThisFrame: boolean
  previousRejectionCount: number
  previousMissedReason: string | null
}

export interface RepFeedbackHudResult {
  message: string | null
  rejectionCount: number
  lastMissedReason: string | null
}

/**
 * Derives whether the normal-mode HUD should show a new rep-feedback line.
 * Pure function so the rAF loop can diff against the previous frame cheaply.
 */
export function nextRepFeedbackHud(
  input: RepFeedbackHudInput,
): RepFeedbackHudResult {
  const {
    phase,
    isAnalyst,
    lastMissedReason,
    rejectionCount,
    completedRepThisFrame,
    previousRejectionCount,
    previousMissedReason,
  } = input

  if (isAnalyst || phase !== 'ACTIVE') {
    return {
      message: null,
      rejectionCount,
      lastMissedReason,
    }
  }

  if (completedRepThisFrame) {
    return {
      message: null,
      rejectionCount,
      lastMissedReason,
    }
  }

  const rejectionIncreased = rejectionCount > previousRejectionCount
  const reasonChanged =
    lastMissedReason !== null && lastMissedReason !== previousMissedReason

  if ((rejectionIncreased || reasonChanged) && lastMissedReason) {
    return {
      message: coachRejectionMessage(lastMissedReason),
      rejectionCount,
      lastMissedReason,
    }
  }

  return {
    message: null,
    rejectionCount,
    lastMissedReason,
  }
}

/** Latest diagnostic rejection for analyst-facing summaries (not shown in normal mode). */
export function latestRejectionSummary(rejections: RepRejection[]): string | null {
  const latest = rejections[rejections.length - 1]
  if (!latest) return null
  return coachRejectionMessage(latest.reason)
}

/**
 * Rejections representing real rep attempts. Phantom candidates (phase
 * jitter with no hip descent) stay in the ledger for audit but are never
 * surfaced as "rejected reps" — a coach reading "15 rejections" on a clean
 * set would distrust a counter that was actually right.
 */
export function realRejections(rejections: RepRejection[]): RepRejection[] {
  return rejections.filter((rejection) => !rejection.phantom)
}

/** Reason of the most recent non-phantom rejection, or null. */
export function lastRealRejectionReason(
  rejections: RepRejection[],
): string | null {
  const real = realRejections(rejections)
  return real.length > 0 ? real[real.length - 1].reason : null
}
