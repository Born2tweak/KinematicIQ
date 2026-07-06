/**
 * Capture quality (M26) — Expert-tab disclosure of per-frame landmark quality,
 * derived on view from the session pose tape (the audit artifact). Neutral
 * diagnostics that explain missing or low-confidence evidence; never a scare
 * warning and never a movement-quality claim.
 */
import { useMemo } from 'react'
import {
  assessSequenceQuality,
  summarizeLandmarkQuality,
} from '../../cv/landmarkQuality'
import type { PoseFrame } from '../../cv/types'

export function CaptureQualityPanel({ frames }: { frames: readonly PoseFrame[] }) {
  const summary = useMemo(
    () => summarizeLandmarkQuality(assessSequenceQuality(frames)),
    [frames],
  )

  if (summary.frameCount === 0) return null

  const pct = (value: number | null) =>
    value === null ? 'n/a' : `${Math.round(value * 100)}%`

  return (
    <div className="detail-rows" aria-label="Capture quality">
      <h3 className="results-panel__heading">Capture quality</h3>
      <p className="results-panel__intro">
        How much of the body the camera could vouch for, frame by frame — the
        evidence behind confidence, not a movement read.
      </p>
      <div className="detail-row">
        <span className="detail-row__label">Key joints tracked</span>
        <span className="detail-row__value">
          {pct(summary.meanCriticalCoverage)} average across{' '}
          {summary.frameCount} frames
        </span>
      </div>
      <div className="detail-row">
        <span className="detail-row__label">Whole-body visibility</span>
        <span className="detail-row__value">
          {pct(summary.meanVisibilityCoverage)} of all landmarks on average
        </span>
      </div>
      <div className="detail-row">
        <span className="detail-row__label">Frames with a key joint missing</span>
        <span className="detail-row__value">
          {summary.framesMissingCritical} of {summary.frameCount}
          {summary.mostMissedLandmarks.length > 0
            ? ` — most often: ${summary.mostMissedLandmarks.join(', ')}`
            : ''}
        </span>
      </div>
      <div className="detail-row">
        <span className="detail-row__label">Implausible tracking jumps</span>
        <span className="detail-row__value">
          {summary.implausibleJumpFrames === 0
            ? 'none detected'
            : `${summary.implausibleJumpFrames} frame${summary.implausibleJumpFrames === 1 ? '' : 's'} — likely tracker glitches, not movement`}
        </span>
      </div>
    </div>
  )
}
