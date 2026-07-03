import type { RepMetrics } from '../cv/types'

interface RepTimelineProps {
  reps: RepMetrics[]
  /** Analyst mode: annotate bars with the measured angles. */
  showAngles?: boolean
}

/** Bar heights map knee angle to visual depth: smaller angle = deeper = taller. */
const DEEPEST_ANGLE = 60
const STANDING_ANGLE = 180

function repDepth(rep: RepMetrics): number {
  return Math.min(rep.minLeftKneeAngle ?? 180, rep.minRightKneeAngle ?? 180)
}

function depthFraction(angle: number): number {
  const clamped = Math.min(Math.max(angle, DEEPEST_ANGLE), STANDING_ANGLE)
  return (STANDING_ANGLE - clamped) / (STANDING_ANGLE - DEEPEST_ANGLE)
}

/**
 * Visual rep-by-rep timeline: one bar per rep, taller = deeper.
 * Replaces the plain text rows; exact angles only appear in analyst mode.
 */
export function RepTimeline({ reps, showAngles = false }: RepTimelineProps) {
  if (reps.length === 0) return null

  return (
    <div className="rep-timeline" role="img" aria-label={`Depth per rep across ${reps.length} reps`}>
      <div className="rep-timeline__bars">
        {reps.map((rep) => {
          const depth = repDepth(rep)
          const fraction = depthFraction(depth)
          const heightPercent = Math.max(8, Math.round(fraction * 100))
          return (
            <div key={rep.repNumber} className="rep-timeline__item">
              {showAngles && (
                <span className="rep-timeline__angle">{Math.round(depth)}°</span>
              )}
              <div
                className="rep-timeline__bar"
                style={{ height: `${heightPercent}%` }}
                title={
                  showAngles
                    ? `Rep ${rep.repNumber}: ${Math.round(depth)}° bottom knee angle`
                    : `Rep ${rep.repNumber}`
                }
              />
              <span className="rep-timeline__label">{rep.repNumber}</span>
            </div>
          )
        })}
      </div>
      <p className="rep-timeline__caption">
        Taller bar = deeper rep{showAngles ? ' (bottom-of-rep knee angle)' : ''} — relative to your own set.
      </p>
    </div>
  )
}
