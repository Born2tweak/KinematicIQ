/**
 * Per-frame landmark quality scoring (M26).
 *
 * Makes confidence evidence-based by measuring, for every frame, how much of
 * the body the tracker could vouch for (visibility coverage, critical-landmark
 * coverage, which critical landmarks are missing) and whether motion since the
 * previous frame was physically plausible (docs/research/02 uncertainty
 * propagation, docs/research/05 confidence framework, docs/research/06 robust
 * tracking).
 *
 * Strictly observational: quality never gates, filters, or alters the analysis
 * pipeline, and no metric or finding becomes STRONGER because quality exists —
 * it only explains missing or low-confidence evidence (M26 acceptance).
 *
 * Pure and dependency-free; never mutates input frames.
 */
import {
  CONFIDENCE_THRESHOLD,
  CRITICAL_LANDMARKS,
  LANDMARK_INDICES,
  type LandmarkQualityFrame,
  type PoseFrame,
} from './types'

export type { LandmarkQualityFrame }

// --- Plausibility thresholds -----------------------------------------------
// Normalized-image units per second. A bodyweight squat moves critical
// landmarks (shoulders/hips/knees/ankles) at well under ~1.5 units/s even at
// fast tempos; a tracking glitch teleports a landmark across a large fraction
// of the frame between samples (e.g. 0.4 units in 66 ms ≈ 6 units/s).
// Deliberately loose so real athletic motion is never flagged.
const IMPLAUSIBLE_SPEED_UNITS_PER_S = 4
/**
 * Frames further apart than this are not comparable: quality reports null
 * speed rather than judging across a gap it cannot see (M26 "do not silently
 * fill long gaps").
 */
const MAX_COMPARABLE_GAP_MS = 500

/** Coach-readable names for the critical landmark set. */
const CRITICAL_LANDMARK_NAMES: Record<number, string> = {
  [LANDMARK_INDICES.LEFT_SHOULDER]: 'left shoulder',
  [LANDMARK_INDICES.RIGHT_SHOULDER]: 'right shoulder',
  [LANDMARK_INDICES.LEFT_HIP]: 'left hip',
  [LANDMARK_INDICES.RIGHT_HIP]: 'right hip',
  [LANDMARK_INDICES.LEFT_KNEE]: 'left knee',
  [LANDMARK_INDICES.RIGHT_KNEE]: 'right knee',
  [LANDMARK_INDICES.LEFT_ANKLE]: 'left ankle',
  [LANDMARK_INDICES.RIGHT_ANKLE]: 'right ankle',
}

function isVisible(frame: PoseFrame, index: number): boolean {
  const lm = frame.landmarks[index]
  return lm !== undefined && lm.visibility >= CONFIDENCE_THRESHOLD
}

/**
 * Fastest critical-landmark motion between two frames, normalized units/s.
 * Only landmarks visible in BOTH frames count — coordinates of an invisible
 * landmark are not evidence. Null when the frames are not comparable
 * (non-positive or over-long time gap, or no shared visible landmark).
 */
function maxCriticalSpeed(frame: PoseFrame, prev: PoseFrame): number | null {
  const dtMs = frame.timestamp - prev.timestamp
  if (dtMs <= 0 || dtMs > MAX_COMPARABLE_GAP_MS) return null

  let max: number | null = null
  for (const index of CRITICAL_LANDMARKS) {
    if (!isVisible(frame, index) || !isVisible(prev, index)) continue
    const a = prev.landmarks[index]
    const b = frame.landmarks[index]
    const speed = Math.hypot(b.x - a.x, b.y - a.y) / (dtMs / 1000)
    max = max === null ? speed : Math.max(max, speed)
  }
  return max
}

/**
 * Assess one frame's landmark quality against its predecessor. Pure —
 * returns a new object and never mutates either frame.
 */
export function assessLandmarkQuality(
  frame: PoseFrame,
  prev: PoseFrame | null = null,
): LandmarkQualityFrame {
  const total = frame.landmarks.length
  const visibleCount = frame.landmarks.filter(
    (lm) => lm.visibility >= CONFIDENCE_THRESHOLD,
  ).length

  const missingCritical: string[] = []
  let criticalVisible = 0
  for (const index of CRITICAL_LANDMARKS) {
    if (isVisible(frame, index)) {
      criticalVisible++
    } else {
      missingCritical.push(CRITICAL_LANDMARK_NAMES[index])
    }
  }

  const speed = prev ? maxCriticalSpeed(frame, prev) : null

  return {
    frameIndex: frame.frameIndex,
    timestamp: frame.timestamp,
    visibilityCoverage: total === 0 ? 0 : visibleCount / total,
    criticalCoverage: criticalVisible / CRITICAL_LANDMARKS.length,
    missingCritical,
    maxCriticalSpeed: speed,
    implausibleJump: speed !== null && speed > IMPLAUSIBLE_SPEED_UNITS_PER_S,
  }
}

/** Quality stream for an ordered frame sequence (each frame vs its predecessor). */
export function assessSequenceQuality(
  frames: readonly PoseFrame[],
): LandmarkQualityFrame[] {
  return frames.map((frame, i) =>
    assessLandmarkQuality(frame, i > 0 ? frames[i - 1] : null),
  )
}

/**
 * Aggregate quality over a session/tape — the shape batch eval rows and the
 * Expert capture-quality panel consume. All fields are observations.
 */
export interface LandmarkQualitySummary {
  frameCount: number
  /** Mean fraction of all landmarks visible per frame; null when no frames. */
  meanVisibilityCoverage: number | null
  /** Mean fraction of critical landmarks visible per frame; null when no frames. */
  meanCriticalCoverage: number | null
  /** Frames where at least one critical landmark was below threshold. */
  framesMissingCritical: number
  /** Frames flagged with implausible critical-landmark motion. */
  implausibleJumpFrames: number
  /** Critical landmarks most often missing, most-missed first (max 3). */
  mostMissedLandmarks: string[]
}

const MOST_MISSED_LIMIT = 3

export function summarizeLandmarkQuality(
  frames: readonly LandmarkQualityFrame[],
): LandmarkQualitySummary {
  if (frames.length === 0) {
    return {
      frameCount: 0,
      meanVisibilityCoverage: null,
      meanCriticalCoverage: null,
      framesMissingCritical: 0,
      implausibleJumpFrames: 0,
      mostMissedLandmarks: [],
    }
  }

  const missedCounts = new Map<string, number>()
  let visibilitySum = 0
  let criticalSum = 0
  let framesMissingCritical = 0
  let implausibleJumpFrames = 0

  for (const frame of frames) {
    visibilitySum += frame.visibilityCoverage
    criticalSum += frame.criticalCoverage
    if (frame.missingCritical.length > 0) framesMissingCritical++
    if (frame.implausibleJump) implausibleJumpFrames++
    for (const name of frame.missingCritical) {
      missedCounts.set(name, (missedCounts.get(name) ?? 0) + 1)
    }
  }

  const mostMissedLandmarks = [...missedCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, MOST_MISSED_LIMIT)
    .map(([name]) => name)

  return {
    frameCount: frames.length,
    meanVisibilityCoverage: visibilitySum / frames.length,
    meanCriticalCoverage: criticalSum / frames.length,
    framesMissingCritical,
    implausibleJumpFrames,
    mostMissedLandmarks,
  }
}
