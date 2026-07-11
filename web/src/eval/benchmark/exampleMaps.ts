/**
 * Hand-authored example skeleton maps (M62 fixtures).
 *
 * Two MATERIALLY DIFFERENT source skeletons, kept as contract fixtures (not
 * dataset downloads): COCO-17 (no feet, has ears, pelvis must be derived) and
 * a Kinect-style 25-joint skeleton (has a real pelvis and foot joints, no
 * ears, an only-ambiguous nose). They exercise every mapping kind — direct,
 * derived, ambiguous, unavailable — and show the same canonical joint being
 * derived in one source and direct in the other.
 *
 * These are illustrative contracts for M62's tests and a starting point for
 * M63 adapters; they are not authoritative dataset schemas.
 */
import { parseSkeletonMap, type SkeletonMap } from './skeletonMap'

/** COCO-17 keypoint names. */
const COCO_17 = [
  'nose',
  'left_eye',
  'right_eye',
  'left_ear',
  'right_ear',
  'left_shoulder',
  'right_shoulder',
  'left_elbow',
  'right_elbow',
  'left_wrist',
  'right_wrist',
  'left_hip',
  'right_hip',
  'left_knee',
  'right_knee',
  'left_ankle',
  'right_ankle',
]

export const COCO_17_MAP: SkeletonMap = parseSkeletonMap({
  id: 'coco17-to-canonical',
  version: '1',
  sourceSkeletonId: 'coco-17',
  targetSkeletonId: 'kinematiq-canonical-v1',
  sourceJoints: COCO_17,
  joints: {
    nose: { kind: 'direct', sourceJoint: 'nose' },
    left_ear: { kind: 'direct', sourceJoint: 'left_ear' },
    right_ear: { kind: 'direct', sourceJoint: 'right_ear' },
    left_shoulder: { kind: 'direct', sourceJoint: 'left_shoulder' },
    right_shoulder: { kind: 'direct', sourceJoint: 'right_shoulder' },
    left_hip: { kind: 'direct', sourceJoint: 'left_hip' },
    right_hip: { kind: 'direct', sourceJoint: 'right_hip' },
    left_knee: { kind: 'direct', sourceJoint: 'left_knee' },
    right_knee: { kind: 'direct', sourceJoint: 'right_knee' },
    left_ankle: { kind: 'direct', sourceJoint: 'left_ankle' },
    right_ankle: { kind: 'direct', sourceJoint: 'right_ankle' },
    left_heel: { kind: 'unavailable', note: 'COCO-17 has no heel keypoint.' },
    right_heel: { kind: 'unavailable', note: 'COCO-17 has no heel keypoint.' },
    left_foot_index: { kind: 'unavailable', note: 'COCO-17 has no foot keypoint.' },
    right_foot_index: { kind: 'unavailable', note: 'COCO-17 has no foot keypoint.' },
    pelvis_mid: {
      kind: 'derived',
      from: ['left_hip', 'right_hip'],
      method: 'midpoint',
      note: 'COCO-17 has no pelvis; midpoint of the two hips.',
    },
  },
  provenance: { tool: 'm62-example-maps', note: 'Illustrative COCO-17 contract.' },
})

/** Kinect-style 25-joint names (subset relevant to canonical mapping). */
const KINECT_25 = [
  'Head',
  'Neck',
  'SpineShoulder',
  'ShoulderLeft',
  'ShoulderRight',
  'SpineMid',
  'SpineBase',
  'HipLeft',
  'HipRight',
  'KneeLeft',
  'KneeRight',
  'AnkleLeft',
  'AnkleRight',
  'FootLeft',
  'FootRight',
]

export const KINECT_25_MAP: SkeletonMap = parseSkeletonMap({
  id: 'kinect25-to-canonical',
  version: '1',
  sourceSkeletonId: 'kinect-25',
  targetSkeletonId: 'kinematiq-canonical-v1',
  sourceJoints: KINECT_25,
  joints: {
    // Kinect 'Head' is a head-centroid, not the nose tip — correspondence
    // exists but is not safe to assert as the nose.
    nose: { kind: 'ambiguous', candidates: ['Head'], note: 'Kinect Head ≈ head centroid, not nose tip.' },
    left_ear: { kind: 'unavailable', note: 'Kinect-25 has no ear joint.' },
    right_ear: { kind: 'unavailable', note: 'Kinect-25 has no ear joint.' },
    left_shoulder: { kind: 'direct', sourceJoint: 'ShoulderLeft' },
    right_shoulder: { kind: 'direct', sourceJoint: 'ShoulderRight' },
    left_hip: { kind: 'direct', sourceJoint: 'HipLeft' },
    right_hip: { kind: 'direct', sourceJoint: 'HipRight' },
    left_knee: { kind: 'direct', sourceJoint: 'KneeLeft' },
    right_knee: { kind: 'direct', sourceJoint: 'KneeRight' },
    left_ankle: { kind: 'direct', sourceJoint: 'AnkleLeft' },
    right_ankle: { kind: 'direct', sourceJoint: 'AnkleRight' },
    left_heel: { kind: 'unavailable', note: 'Kinect foot joint is toe-side, not heel.' },
    right_heel: { kind: 'unavailable', note: 'Kinect foot joint is toe-side, not heel.' },
    left_foot_index: { kind: 'direct', sourceJoint: 'FootLeft' },
    right_foot_index: { kind: 'direct', sourceJoint: 'FootRight' },
    // Unlike COCO, Kinect has a real pelvis joint — direct, not derived.
    pelvis_mid: { kind: 'direct', sourceJoint: 'SpineBase' },
  },
  provenance: { tool: 'm62-example-maps', note: 'Illustrative Kinect-25 contract.' },
})
