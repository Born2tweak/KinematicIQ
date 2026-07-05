/**
 * Pure model for the Results replay system: event markers, frame lookup, and
 * the per-frame view model the replay UI renders.
 *
 * Presentation-layer only (Stream: demo/visual). Everything here DERIVES from
 * the analysis outputs (`replayTape` results: frameTrace, reps, rejections) —
 * it never feeds back into them, and none of it depends on Demo Mode. That
 * independence is what the demo-identity test asserts.
 */
import type { FrameTraceSample } from '../../analysis/frameTrace'
import type { RepRejection } from '../../analysis/repCounter'
import type { PoseFrame, RepMetrics, SquatState } from '../../cv/types'

export const PLAYBACK_SPEEDS = [0.25, 0.5, 1, 2] as const
export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number]

export type ReplayEventKind =
  | 'descent'
  | 'bottom'
  | 'ascent'
  | 'rep-counted'
  | 'rejection'

export interface ReplayEvent {
  /** Position in the frameTrace/frames arrays (NOT the tape frameIndex). */
  sampleIndex: number
  timestamp: number
  kind: ReplayEventKind
  label: string
  repNumber?: number
}

/** Map a tape frameIndex to its position in the analyzed-frame arrays. */
function samplePositionByFrameIndex(
  trace: readonly FrameTraceSample[],
): Map<number, number> {
  const map = new Map<number, number>()
  trace.forEach((sample, position) => {
    map.set(sample.frameIndex, position)
  })
  return map
}

const PHASE_EVENT: Partial<Record<SquatState, { kind: ReplayEventKind; label: string }>> = {
  DESCENDING: { kind: 'descent', label: 'Descent' },
  BOTTOM: { kind: 'bottom', label: 'Bottom' },
  ASCENDING: { kind: 'ascent', label: 'Ascent' },
}

/**
 * Event markers for the replay timeline: phase transitions, counted reps,
 * and rejected candidates — every marker addresses a frame the scrubber can
 * jump to. Sorted by sample position.
 */
export function buildReplayEvents(
  trace: readonly FrameTraceSample[],
  reps: readonly RepMetrics[],
  rejections: readonly RepRejection[],
): ReplayEvent[] {
  const events: ReplayEvent[] = []
  const positionOf = samplePositionByFrameIndex(trace)

  let previousPhase: SquatState | null = null
  trace.forEach((sample, position) => {
    if (sample.phase !== previousPhase) {
      const spec = PHASE_EVENT[sample.phase]
      if (spec && previousPhase !== null) {
        events.push({
          sampleIndex: position,
          timestamp: sample.timestamp,
          kind: spec.kind,
          label: spec.label,
        })
      }
      previousPhase = sample.phase
    }
  })

  for (const rep of reps) {
    const position = positionOf.get(rep.endFrameIndex)
    if (position !== undefined) {
      events.push({
        sampleIndex: position,
        timestamp: rep.endTimestamp,
        kind: 'rep-counted',
        label: `Rep ${rep.repNumber} counted`,
        repNumber: rep.repNumber,
      })
    }
  }

  for (const rejection of rejections) {
    if (rejection.phantom) continue // never surface phantom churn as events
    const position = positionOf.get(rejection.endFrameIndex)
    if (position !== undefined) {
      events.push({
        sampleIndex: position,
        timestamp: rejection.endTimestamp,
        kind: 'rejection',
        label: `Candidate rejected — ${rejection.reason}`,
      })
    }
  }

  return events.sort((a, b) => a.sampleIndex - b.sampleIndex)
}

/** Rep whose [start, end] timestamp window contains the sample, if any. */
export function repAtTimestamp(
  reps: readonly RepMetrics[],
  timestamp: number,
): number | null {
  for (const rep of reps) {
    if (timestamp >= rep.startTimestamp && timestamp <= rep.endTimestamp) {
      return rep.repNumber
    }
  }
  return null
}

/**
 * Everything the replay surfaces render for one frame. Derived purely from
 * analysis outputs + the scrub position — Demo Mode is not an input, so
 * enabling visual effects cannot change any value here.
 */
export interface ReplayFrameViewModel {
  sampleIndex: number
  frame: PoseFrame
  trace: FrameTraceSample
  /** Seconds since the first analyzed frame. */
  elapsedSeconds: number
  activeRepNumber: number | null
}

export function buildReplayViewModel(
  frames: readonly PoseFrame[],
  trace: readonly FrameTraceSample[],
  reps: readonly RepMetrics[],
  sampleIndex: number,
): ReplayFrameViewModel | null {
  if (frames.length === 0 || trace.length !== frames.length) return null
  const clamped = Math.max(0, Math.min(sampleIndex, frames.length - 1))
  const frame = frames[clamped]
  const sample = trace[clamped]
  return {
    sampleIndex: clamped,
    frame,
    trace: sample,
    elapsedSeconds: (frame.timestamp - frames[0].timestamp) / 1000,
    activeRepNumber: repAtTimestamp(reps, frame.timestamp),
  }
}

/** Wall-clock ms until the next frame at a given playback speed. */
export function frameDelayMs(
  frames: readonly PoseFrame[],
  sampleIndex: number,
  speed: PlaybackSpeed,
): number {
  const current = frames[sampleIndex]
  const next = frames[sampleIndex + 1]
  if (!current || !next) return 66 / speed
  const gap = Math.max(next.timestamp - current.timestamp, 1)
  return gap / speed
}
