/**
 * Canonical joint vocabulary and coordinate conventions (M62).
 *
 * The neutral target every source dataset skeleton maps INTO. It is
 * deliberately small — the joints KinematicIQ actually reasons about
 * (mirroring `cv/types.ts` LANDMARK_INDICES) plus one explicitly derived
 * joint (`pelvis_mid`). It is NOT MediaPipe's 33-landmark set and NOT a
 * universal anatomy: a source that lacks a canonical joint maps it to
 * `unavailable`, never to an invented coordinate.
 *
 * This module is dependency-free by design so schema, maps, and adapters can
 * all import it without cycles.
 */

/** The canonical joints. `pelvis_mid` is the only inherently derived one. */
export const CANONICAL_JOINTS = [
  'nose',
  'left_ear',
  'right_ear',
  'left_shoulder',
  'right_shoulder',
  'left_hip',
  'right_hip',
  'left_knee',
  'right_knee',
  'left_ankle',
  'right_ankle',
  'left_heel',
  'right_heel',
  'left_foot_index',
  'right_foot_index',
  'pelvis_mid',
] as const

export type CanonicalJoint = (typeof CANONICAL_JOINTS)[number]

export const CANONICAL_SKELETON_ID = 'kinematiq-canonical-v1'

export const CANONICAL_JOINT_SET: ReadonlySet<string> = new Set(CANONICAL_JOINTS)

export function isCanonicalJoint(value: string): value is CanonicalJoint {
  return CANONICAL_JOINT_SET.has(value)
}

/**
 * A coordinate axis semantic. Adapters must state what +x/+y/+z mean so a
 * sagittal metric is never computed against a mislabeled axis.
 */
export type AxisDirection =
  | 'right'
  | 'left'
  | 'up'
  | 'down'
  | 'forward'
  | 'backward'

export type LengthUnit =
  | 'normalized-image' // 0..1 image-relative (MediaPipe normalized style)
  | 'pixels'
  | 'meters'
  | 'millimeters'

export const AXIS_DIRECTIONS: ReadonlySet<string> = new Set([
  'right',
  'left',
  'up',
  'down',
  'forward',
  'backward',
])
export const LENGTH_UNITS: ReadonlySet<string> = new Set([
  'normalized-image',
  'pixels',
  'meters',
  'millimeters',
])

/**
 * Explicit coordinate frame for a sequence. Never assumed — a benchmark
 * sequence that does not state its axes and units cannot be compared.
 */
export interface CoordinateSystem {
  units: LengthUnit
  xAxis: AxisDirection
  yAxis: AxisDirection
  zAxis: AxisDirection
  /** Where the origin sits, e.g. 'image-top-left', 'pelvis', 'lab-origin'. */
  origin: string
}
