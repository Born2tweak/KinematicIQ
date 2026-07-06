/**
 * Capture readiness v1 (M4).
 *
 * Turns the live pose frame into a SCORED readiness state — `ready` /
 * `marginal` / `notReady` — with a per-item checklist, reasons, and concrete
 * fixes. Mirrors the `SetQualityAssessment` shape (session/setQualityGate.ts)
 * so the pre-capture experience speaks the same verdict-or-abstain language as
 * the post-capture report.
 *
 * Builds on `deriveCaptureGuidance` (the single live instruction) rather than
 * rewriting it, and does NOT touch autoStart thresholds — this only informs the
 * pre-capture checklist UX (docs/research/06 capture quality, docs/research/11
 * §4 capture experience; docs/doctrine/claims-policy.md observation language).
 *
 * Pure and dependency-free.
 */
import { deriveCaptureGuidance, type CaptureGuidance } from './captureGuidance'
import { CONFIDENCE_THRESHOLD, LANDMARK_INDICES, type PoseFrame } from './types'

export type CaptureReadinessState = 'ready' | 'marginal' | 'notReady'

export type CaptureChecklistId =
  | 'head'
  | 'upperBody'
  | 'hips'
  | 'knees'
  | 'feet'
  | 'centered'
  | 'distance'

export interface CaptureChecklistItem {
  id: CaptureChecklistId
  /** Coach-readable label ("Head in frame"). */
  label: string
  ok: boolean
}

export interface CaptureReadinessAssessment {
  state: CaptureReadinessState
  /** The single live instruction (from deriveCaptureGuidance) for the HUD. */
  guidance: CaptureGuidance
  /** Every readiness check with pass/fail, for the pre-capture checklist. */
  checklist: CaptureChecklistItem[]
  /** Which checks are failing, in observation language. */
  reasons: string[]
  /** Concrete capture changes that would reach `ready`. */
  fixes: string[]
}

function visible(frame: PoseFrame, index: number): boolean {
  const lm = frame.landmarks[index]
  return lm !== undefined && lm.visibility >= CONFIDENCE_THRESHOLD
}

function avg(frame: PoseFrame, a: number, b: number, axis: 'x' | 'y'): number | null {
  const la = frame.landmarks[a]
  const lb = frame.landmarks[b]
  if (!la || !lb) return null
  return (la[axis] + lb[axis]) / 2
}

const FIX_LIBRARY: Record<CaptureChecklistId, string> = {
  head: 'Tilt the camera up or step back so your head stays in frame.',
  upperBody: 'Face the camera so both shoulders are visible.',
  hips: 'Make sure your hips are in frame and unobstructed.',
  knees: 'Keep both knees visible — avoid baggy clothing that hides them.',
  feet: 'Step back or tilt the camera down so your feet stay in frame.',
  centered: 'Move to the center of the frame.',
  distance: 'Adjust your distance — aim for 3–4 m so your whole body fills the frame.',
}

const LABELS: Record<CaptureChecklistId, string> = {
  head: 'Head in frame',
  upperBody: 'Shoulders visible',
  hips: 'Hips visible',
  knees: 'Knees visible',
  feet: 'Feet in frame',
  centered: 'Centered in frame',
  distance: 'Good distance',
}

/**
 * Assess capture readiness from the current frame. Deterministic and pure.
 *
 * - `ready`      — full body framed well; `deriveCaptureGuidance` is ok.
 * - `marginal`   — whole body is visible but framing needs a small tweak
 *                  (off-center or distance), so the athlete is close.
 * - `notReady`   — a body region the analysis needs is not visible yet.
 */
export function assessCaptureReadiness(
  frame: PoseFrame | null,
): CaptureReadinessAssessment {
  const guidance = deriveCaptureGuidance(frame)

  if (!frame || frame.landmarks.length === 0) {
    const checklist = (Object.keys(LABELS) as CaptureChecklistId[]).map((id) => ({
      id,
      label: LABELS[id],
      ok: false,
    }))
    return {
      state: 'notReady',
      guidance,
      checklist,
      reasons: ['No one is in frame yet.'],
      fixes: ['Step into frame with the camera at hip height, 3–4 m away.'],
    }
  }

  const {
    NOSE,
    LEFT_SHOULDER,
    RIGHT_SHOULDER,
    LEFT_HIP,
    RIGHT_HIP,
    LEFT_KNEE,
    RIGHT_KNEE,
    LEFT_ANKLE,
    RIGHT_ANKLE,
  } = LANDMARK_INDICES

  const checks: Record<CaptureChecklistId, boolean> = {
    head: visible(frame, NOSE),
    upperBody: visible(frame, LEFT_SHOULDER) && visible(frame, RIGHT_SHOULDER),
    hips: visible(frame, LEFT_HIP) && visible(frame, RIGHT_HIP),
    knees: visible(frame, LEFT_KNEE) && visible(frame, RIGHT_KNEE),
    feet: visible(frame, LEFT_ANKLE) && visible(frame, RIGHT_ANKLE),
    centered: true,
    distance: true,
  }

  // Framing quality checks only meaningful once the body is on screen.
  const centerX = avg(frame, LEFT_HIP, RIGHT_HIP, 'x')
  if (centerX !== null) {
    checks.centered = Math.abs(centerX - 0.5) <= 0.2
  }
  const noseY = frame.landmarks[NOSE]?.y ?? null
  const ankleY = avg(frame, LEFT_ANKLE, RIGHT_ANKLE, 'y')
  const bodyHeight = noseY !== null && ankleY !== null ? ankleY - noseY : null
  if (bodyHeight !== null) {
    checks.distance = bodyHeight >= 0.4 && bodyHeight <= 0.92
  }

  const checklist: CaptureChecklistItem[] = (
    Object.keys(LABELS) as CaptureChecklistId[]
  ).map((id) => ({ id, label: LABELS[id], ok: checks[id] }))

  const failing = checklist.filter((item) => !item.ok)
  const reasons = failing.map((item) => `${item.label} — not yet.`)
  const fixes = [...new Set(failing.map((item) => FIX_LIBRARY[item.id]))]

  const bodyVisible =
    checks.head && checks.upperBody && checks.hips && checks.knees && checks.feet

  let state: CaptureReadinessState
  if (guidance.ok && failing.length === 0) {
    state = 'ready'
  } else if (bodyVisible) {
    // Whole body visible; only framing tweaks remain.
    state = 'marginal'
  } else {
    state = 'notReady'
  }

  return { state, guidance, checklist, reasons, fixes }
}
