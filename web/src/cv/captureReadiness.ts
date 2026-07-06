/**
 * Capture readiness v2 (M4 baseline + M25 camera geometry checks).
 *
 * Turns the live pose frame into a SCORED readiness state — `ready` /
 * `marginal` / `notReady` — with a per-item checklist, reasons, and concrete
 * fixes. Mirrors the `SetQualityAssessment` shape (session/setQualityGate.ts)
 * so the pre-capture experience speaks the same verdict-or-abstain language as
 * the post-capture report.
 *
 * M25 adds protocol geometry checks derived from landmark geometry only
 * (docs/25_capture_protocol_front_squat.md §1): front-view compliance, a
 * camera-height hint, body occupancy band, foot margin, and left/right
 * symmetry visibility. These are capture-quality observations, NOT calibrated
 * camera-pose estimates, and they never change auto-start thresholds — they
 * only inform the pre-capture checklist and copy.
 *
 * Builds on `deriveCaptureGuidance` (the single live instruction) rather than
 * rewriting it (docs/research/06 capture quality, docs/research/11 §4 capture
 * experience; docs/doctrine/claims-policy.md observation language).
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

export type GeometryCheckId =
  | 'front-view'
  | 'camera-height'
  | 'body-occupancy'
  | 'feet-visible'
  | 'symmetry-visible'

/**
 * `pass` — protocol geometry looks compliant.
 * `warn` — approximate heuristic suggests a small setup tweak; never blocks.
 * `fail` — geometry very likely violates the front-view protocol.
 */
export type GeometryCheckStatus = 'pass' | 'warn' | 'fail'

export interface GeometryCheck {
  id: GeometryCheckId
  /** Coach-readable label ("Facing the camera"). */
  label: string
  status: GeometryCheckStatus
  /** Observation-language reason, present when status is not `pass`. */
  reason: string | null
  /** Concrete capture change, present when status is not `pass`. */
  fix: string | null
}

export interface CaptureReadinessAssessment {
  state: CaptureReadinessState
  /** The single live instruction (from deriveCaptureGuidance) for the HUD. */
  guidance: CaptureGuidance
  /** Every readiness check with pass/fail, for the pre-capture checklist. */
  checklist: CaptureChecklistItem[]
  /** Protocol camera-geometry checks (M25) — advisory capture quality only. */
  geometryChecks: GeometryCheck[]
  /** Roll-up of `geometryChecks`: fail→notReady, warn→marginal, else ready. */
  protocolCompliance: CaptureReadinessState
  /** Which checks are failing, in observation language. */
  reasons: string[]
  /** Concrete capture changes that would reach `ready`. */
  fixes: string[]
}

// --- Protocol geometry thresholds -----------------------------------------
// All ratios are normalized-image units relative to nose→ankle body height,
// which is roughly 90% of full standing height. Provenance:
// docs/25_capture_protocol_front_squat.md §1 (front view ±15°, camera at hip
// height with level lens, body fills ~70–80% of frame height, feet in frame
// with floor margin). Values are provisional heuristics from single RGB —
// deliberately loose to avoid over-gating valid recordings.

/** Shoulder/hip horizontal spread ÷ body height: square-on adult ≈ 0.22–0.3. */
const FRONT_VIEW_SPREAD_PASS = 0.14
/** Below this the athlete is very likely side-on (spread collapses < ~0.08). */
const FRONT_VIEW_SPREAD_FAIL = 0.09
/** Hip vertical placement (hipY − noseY) ÷ body height ≈ 0.45 when the lens
 * sits level at hip height; drifting outside this band hints at a high/low or
 * tilted camera. Hint only — never a hard failure. */
const HIP_PLACEMENT_MIN = 0.36
const HIP_PLACEMENT_MAX = 0.6
/** Nose→ankle occupancy band mapping the protocol's ~70–80% full-body frame
 * height; the outer band matches the existing v1 `distance` check. */
const OCCUPANCY_PASS_MIN = 0.5
const OCCUPANCY_PASS_MAX = 0.85
const OCCUPANCY_WARN_MIN = 0.4
const OCCUPANCY_WARN_MAX = 0.92
/** Ankles below this y are hugging the frame edge — no floor margin left. */
const FOOT_MARGIN_MAX_Y = 0.96

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

const GEOMETRY_LABELS: Record<GeometryCheckId, string> = {
  'front-view': 'Facing the camera',
  'camera-height': 'Camera at hip height',
  'body-occupancy': 'Fills the frame well',
  'feet-visible': 'Feet clear of frame edge',
  'symmetry-visible': 'Both sides visible',
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

function spread(frame: PoseFrame, a: number, b: number): number | null {
  const la = frame.landmarks[a]
  const lb = frame.landmarks[b]
  if (!la || !lb) return null
  return Math.abs(la.x - lb.x)
}

function geometryCheck(
  id: GeometryCheckId,
  status: GeometryCheckStatus,
  reason: string | null = null,
  fix: string | null = null,
): GeometryCheck {
  return { id, label: GEOMETRY_LABELS[id], status, reason, fix }
}

function assessFrontView(frame: PoseFrame, bodyHeight: number | null): GeometryCheck {
  const { LEFT_SHOULDER, RIGHT_SHOULDER, LEFT_HIP, RIGHT_HIP } = LANDMARK_INDICES
  const shouldersVisible = visible(frame, LEFT_SHOULDER) && visible(frame, RIGHT_SHOULDER)
  const hipsVisible = visible(frame, LEFT_HIP) && visible(frame, RIGHT_HIP)
  const shoulderSpread = shouldersVisible ? spread(frame, LEFT_SHOULDER, RIGHT_SHOULDER) : null
  const hipSpread = hipsVisible ? spread(frame, LEFT_HIP, RIGHT_HIP) : null
  const widest = Math.max(shoulderSpread ?? 0, hipSpread ?? 0)

  if (bodyHeight === null || bodyHeight <= 0 || (shoulderSpread === null && hipSpread === null)) {
    return geometryCheck(
      'front-view',
      'warn',
      'Can’t judge your camera angle yet — full body not visible.',
      'Step into frame facing the camera square-on.',
    )
  }

  const ratio = widest / bodyHeight
  if (ratio >= FRONT_VIEW_SPREAD_PASS) {
    return geometryCheck('front-view', 'pass')
  }
  if (ratio < FRONT_VIEW_SPREAD_FAIL) {
    return geometryCheck(
      'front-view',
      'fail',
      'You appear side-on to the camera.',
      'Turn to face the camera square-on — this protocol needs a front view.',
    )
  }
  return geometryCheck(
    'front-view',
    'warn',
    'You may be angled away from the camera.',
    'Square your shoulders and hips toward the camera.',
  )
}

function assessCameraHeight(
  frame: PoseFrame,
  bodyHeight: number | null,
  noseY: number | null,
): GeometryCheck {
  const { LEFT_HIP, RIGHT_HIP } = LANDMARK_INDICES
  const hipY = avg(frame, LEFT_HIP, RIGHT_HIP, 'y')
  if (bodyHeight === null || bodyHeight <= 0 || hipY === null || noseY === null) {
    return geometryCheck(
      'camera-height',
      'warn',
      'Can’t judge camera height yet — full body not visible.',
      'Set the camera at hip height with the lens level, 3–4 m away.',
    )
  }
  const placement = (hipY - noseY) / bodyHeight
  if (placement >= HIP_PLACEMENT_MIN && placement <= HIP_PLACEMENT_MAX) {
    return geometryCheck('camera-height', 'pass')
  }
  return geometryCheck(
    'camera-height',
    'warn',
    'Camera height looks off — your hips aren’t sitting mid-body in frame.',
    'Set the camera at hip height and keep the lens level (no tilt).',
  )
}

function assessBodyOccupancy(bodyHeight: number | null): GeometryCheck {
  if (bodyHeight === null || bodyHeight <= 0) {
    return geometryCheck(
      'body-occupancy',
      'fail',
      'Your full body isn’t visible yet.',
      'Step into frame with the camera 3–4 m away.',
    )
  }
  if (bodyHeight >= OCCUPANCY_PASS_MIN && bodyHeight <= OCCUPANCY_PASS_MAX) {
    return geometryCheck('body-occupancy', 'pass')
  }
  if (bodyHeight < OCCUPANCY_PASS_MIN) {
    const status: GeometryCheckStatus = bodyHeight >= OCCUPANCY_WARN_MIN ? 'warn' : 'fail'
    return geometryCheck(
      'body-occupancy',
      status,
      'You look far away — your body fills too little of the frame.',
      'Step closer (or move the camera closer) so your body fills about three-quarters of the frame height.',
    )
  }
  const status: GeometryCheckStatus = bodyHeight <= OCCUPANCY_WARN_MAX ? 'warn' : 'fail'
  return geometryCheck(
    'body-occupancy',
    status,
    'You look too close — your body almost overflows the frame.',
    'Step back so your whole body fits with margin above your head and below your feet.',
  )
}

function assessFeetMargin(frame: PoseFrame): GeometryCheck {
  const { LEFT_ANKLE, RIGHT_ANKLE } = LANDMARK_INDICES
  const anklesVisible = visible(frame, LEFT_ANKLE) && visible(frame, RIGHT_ANKLE)
  if (!anklesVisible) {
    return geometryCheck(
      'feet-visible',
      'fail',
      'Your feet aren’t visible.',
      'Step back or tilt the camera down so your feet stay clearly in frame.',
    )
  }
  const ankleY = avg(frame, LEFT_ANKLE, RIGHT_ANKLE, 'y')
  if (ankleY !== null && ankleY > FOOT_MARGIN_MAX_Y) {
    return geometryCheck(
      'feet-visible',
      'warn',
      'Your feet are hugging the bottom edge of the frame.',
      'Step back slightly so there is floor margin below your feet.',
    )
  }
  return geometryCheck('feet-visible', 'pass')
}

function assessSymmetryVisibility(frame: PoseFrame): GeometryCheck {
  const {
    LEFT_SHOULDER,
    RIGHT_SHOULDER,
    LEFT_HIP,
    RIGHT_HIP,
    LEFT_KNEE,
    RIGHT_KNEE,
    LEFT_ANKLE,
    RIGHT_ANKLE,
  } = LANDMARK_INDICES
  const pairsVisible =
    visible(frame, LEFT_SHOULDER) &&
    visible(frame, RIGHT_SHOULDER) &&
    visible(frame, LEFT_HIP) &&
    visible(frame, RIGHT_HIP) &&
    visible(frame, LEFT_KNEE) &&
    visible(frame, RIGHT_KNEE) &&
    visible(frame, LEFT_ANKLE) &&
    visible(frame, RIGHT_ANKLE)
  if (!pairsVisible) {
    return geometryCheck(
      'symmetry-visible',
      'fail',
      'Both sides of your body aren’t fully visible.',
      'Make sure nothing blocks one side of your body — symmetry checks need both sides.',
    )
  }
  return geometryCheck('symmetry-visible', 'pass')
}

/** Advisory protocol geometry checks from landmark geometry only (M25). */
function assessProtocolGeometry(frame: PoseFrame): GeometryCheck[] {
  const { NOSE, LEFT_ANKLE, RIGHT_ANKLE } = LANDMARK_INDICES
  const noseY = visible(frame, NOSE) ? (frame.landmarks[NOSE]?.y ?? null) : null
  const ankleY =
    visible(frame, LEFT_ANKLE) && visible(frame, RIGHT_ANKLE)
      ? avg(frame, LEFT_ANKLE, RIGHT_ANKLE, 'y')
      : null
  const bodyHeight = noseY !== null && ankleY !== null ? ankleY - noseY : null

  return [
    assessFrontView(frame, bodyHeight),
    assessCameraHeight(frame, bodyHeight, noseY),
    assessBodyOccupancy(bodyHeight),
    assessFeetMargin(frame),
    assessSymmetryVisibility(frame),
  ]
}

function rollUpCompliance(checks: GeometryCheck[]): CaptureReadinessState {
  if (checks.some((c) => c.status === 'fail')) return 'notReady'
  if (checks.some((c) => c.status === 'warn')) return 'marginal'
  return 'ready'
}

function emptyGeometryChecks(): GeometryCheck[] {
  return [
    geometryCheck('front-view', 'warn', 'No one is in frame yet.', null),
    geometryCheck('camera-height', 'warn', 'No one is in frame yet.', null),
    geometryCheck('body-occupancy', 'fail', 'No one is in frame yet.', null),
    geometryCheck('feet-visible', 'fail', 'No one is in frame yet.', null),
    geometryCheck('symmetry-visible', 'fail', 'No one is in frame yet.', null),
  ]
}

/**
 * Assess capture readiness from the current frame. Deterministic and pure.
 *
 * - `ready`      — full body framed well; `deriveCaptureGuidance` is ok and no
 *                  geometry check hard-fails. Geometry `warn`s do not block —
 *                  they are approximate single-RGB hints.
 * - `marginal`   — whole body is visible but framing needs a tweak
 *                  (off-center, distance, or a protocol-geometry failure such
 *                  as a likely side view).
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
      geometryChecks: emptyGeometryChecks(),
      protocolCompliance: 'notReady',
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

  const geometryChecks = assessProtocolGeometry(frame)
  const protocolCompliance = rollUpCompliance(geometryChecks)

  const failing = checklist.filter((item) => !item.ok)
  const geometryIssues = geometryChecks.filter((c) => c.status !== 'pass')
  const reasons = [
    ...failing.map((item) => `${item.label} — not yet.`),
    ...geometryIssues.flatMap((c) => (c.reason ? [c.reason] : [])),
  ]
  const fixes = [
    ...new Set([
      ...failing.map((item) => FIX_LIBRARY[item.id]),
      ...geometryIssues.flatMap((c) => (c.fix ? [c.fix] : [])),
    ]),
  ]

  const bodyVisible =
    checks.head && checks.upperBody && checks.hips && checks.knees && checks.feet
  const geometryFailed = geometryChecks.some((c) => c.status === 'fail')

  let state: CaptureReadinessState
  if (guidance.ok && failing.length === 0 && !geometryFailed) {
    state = 'ready'
  } else if (bodyVisible) {
    // Whole body visible; only framing/geometry tweaks remain.
    state = 'marginal'
  } else {
    state = 'notReady'
  }

  return {
    state,
    guidance,
    checklist,
    geometryChecks,
    protocolCompliance,
    reasons,
    fixes,
  }
}
