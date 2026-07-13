import type { InlineLungePhase, InlineLungeSignalSample, InlineLungeSide, InlineLungeTrial } from './types'

export const INLINE_LUNGE_THRESHOLDS = {
  stepDisplacement: 0.06,
  descentPelvisDrop: 0.025,
  bottomPelvisDrop: 0.06,
  ascentRiseFromBottom: 0.015,
  returnPelvisDrop: 0.025,
  returnFootDisplacement: 0.035,
  persistentFrames: 2,
  stableReturnFrames: 3,
  maxUnreadableFrames: 3,
} as const

interface ActiveTrial {
  phase: InlineLungePhase
  standing: InlineLungeSignalSample
  step: InlineLungeSignalSample
  descent: InlineLungeSignalSample
  bottom: InlineLungeSignalSample
  ascent: InlineLungeSignalSample
  readable: number
  total: number
  unreadableRun: number
  persistent: number
}

const observed = (value: number | null): value is number => value !== null

export function segmentInlineLungeTrials(signals: readonly InlineLungeSignalSample[], leadSide: InlineLungeSide): InlineLungeTrial[] {
  const trials: InlineLungeTrial[] = []
  let lastStanding: InlineLungeSignalSample | null = null
  let active: ActiveTrial | null = null

  const finish = (sample: InlineLungeSignalSample, status: 'completed' | 'rejected', reason?: string) => {
    if (!active) return
    trials.push({
      trialIndex: trials.length + 1,
      leadSide,
      status,
      rejectionReason: reason,
      standingStartFrame: active.standing.frameIndex,
      stepInitiationFrame: active.step.frameIndex,
      descentStartFrame: active.descent.frameIndex,
      bottomFrame: active.bottom.frameIndex,
      ascentStartFrame: active.ascent.frameIndex,
      stableReturnFrame: sample.frameIndex,
      startTimestamp: active.standing.timestamp,
      stepTimestamp: active.step.timestamp,
      descentTimestamp: active.descent.timestamp,
      bottomTimestamp: active.bottom.timestamp,
      ascentTimestamp: active.ascent.timestamp,
      returnTimestamp: sample.timestamp,
      leadKneeAngleAtBottom: active.bottom.leadKneeAngle,
      readableFrameRatio: active.total ? active.readable / active.total : 0,
    })
    active = null
    // A rejected stream cannot reuse the pre-rejection standing anchor. A new
    // trial requires a newly observed stable return region first.
    lastStanding = status === 'completed' ? sample : null
  }

  for (const sample of signals) {
    if (!active) {
      if (sample.readable && observed(sample.footDisplacement) && sample.footDisplacement < INLINE_LUNGE_THRESHOLDS.returnFootDisplacement) lastStanding = sample
      if (lastStanding && sample.readable && observed(sample.footDisplacement) && sample.footDisplacement >= INLINE_LUNGE_THRESHOLDS.stepDisplacement) {
        active = { phase: 'stepping', standing: lastStanding, step: sample, descent: sample, bottom: sample, ascent: sample, readable: 1, total: 1, unreadableRun: 0, persistent: 1 }
      }
      continue
    }

    active.total++
    if (!sample.readable) {
      active.unreadableRun++
      active.persistent = 0
      if (active.unreadableRun > INLINE_LUNGE_THRESHOLDS.maxUnreadableFrames) finish(sample, 'rejected', 'critical-landmarks-unreadable')
      continue
    }
    active.readable++
    active.unreadableRun = 0
    const foot = sample.footDisplacement ?? 0
    const drop = sample.pelvisDrop ?? 0

    if (active.phase === 'stepping') {
      active.persistent = drop >= INLINE_LUNGE_THRESHOLDS.descentPelvisDrop ? active.persistent + 1 : 0
      if (active.persistent >= INLINE_LUNGE_THRESHOLDS.persistentFrames) { active.phase = 'descending'; active.descent = sample; active.bottom = sample; active.persistent = 0 }
    } else if (active.phase === 'descending') {
      if ((sample.pelvisDrop ?? -Infinity) >= (active.bottom.pelvisDrop ?? -Infinity)) active.bottom = sample
      const previousDrop = signals[Math.max(0, signals.indexOf(sample) - 1)]?.pelvisDrop
      active.persistent = observed(previousDrop) && drop < previousDrop && (active.bottom.pelvisDrop ?? 0) >= INLINE_LUNGE_THRESHOLDS.bottomPelvisDrop ? active.persistent + 1 : 0
      if (active.persistent >= INLINE_LUNGE_THRESHOLDS.persistentFrames) { active.phase = 'bottom'; active.persistent = 0 }
    } else if (active.phase === 'bottom') {
      active.persistent = (active.bottom.pelvisDrop ?? 0) - drop >= INLINE_LUNGE_THRESHOLDS.ascentRiseFromBottom ? active.persistent + 1 : 0
      if (active.persistent >= INLINE_LUNGE_THRESHOLDS.persistentFrames) { active.phase = 'ascending'; active.ascent = sample; active.persistent = 0 }
    } else if (active.phase === 'ascending') {
      active.persistent = drop <= INLINE_LUNGE_THRESHOLDS.returnPelvisDrop ? active.persistent + 1 : 0
      if (active.persistent >= INLINE_LUNGE_THRESHOLDS.persistentFrames) { active.phase = 'returning'; active.persistent = 0 }
    } else if (active.phase === 'returning') {
      active.persistent = foot <= INLINE_LUNGE_THRESHOLDS.returnFootDisplacement && drop <= INLINE_LUNGE_THRESHOLDS.returnPelvisDrop ? active.persistent + 1 : 0
      if (active.persistent >= INLINE_LUNGE_THRESHOLDS.stableReturnFrames) finish(sample, 'completed')
    }
  }
  if (active) finish(signals[signals.length - 1] ?? active.step, 'rejected', 'incomplete-trial-at-stream-end')
  return trials
}
