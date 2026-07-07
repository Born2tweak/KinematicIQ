/**
 * Model and algorithm version registry (M46).
 *
 * THE single source for every version identifier stamped into artifacts —
 * provenance, session artifacts, pose tapes, and report exports all read
 * from here (R05 version tracking, R08 artifact versioning, R03 metric
 * provenance). Change a pipeline's behavior → bump its identifier here →
 * every downstream artifact carries it automatically.
 *
 * Dependency-free by design (imports nothing) so any module can use it
 * without cycles. Schema-version constants for STORED shapes stay next to
 * their readers (sessionStore, sessionArtifact, sessionReport, poseTape) —
 * a reader must own the version it checks; this registry owns the
 * behavioral identifiers.
 */

/** App/build identifier. Matches web/package.json; update together. */
export const APP_VERSION = 'kinematiq-web@0.1.0'

/** The MediaPipe model this build ships (do not swap without a benchmark). */
export const POSE_MODEL_VERSION = 'mediapipe-tasks-vision-0.10'

/**
 * Analysis pipeline identifier: segmentation FSMs + rep gates + metric
 * derivations. Bump when any of them changes observable behavior (the M45
 * benchmark gate decides whether the change lands).
 */
export const ANALYSIS_ALGORITHM_VERSION = 'squat-pipeline-v1.m33'

/** Claims-policy revision the shipped copy was audited against (M38). */
export const CLAIM_POLICY_VERSION = 'claims-policy-v1'

/** Landmark filter variants the pipeline can apply (Provenance.filterVariant). */
export const FILTER_VARIANTS = [
  'raw',
  'one-euro-live',
  'butterworth-offline',
] as const

/** One snapshot object for artifacts that want the full set. */
export const VERSIONS = {
  app: APP_VERSION,
  poseModel: POSE_MODEL_VERSION,
  algorithm: ANALYSIS_ALGORITHM_VERSION,
  claimPolicy: CLAIM_POLICY_VERSION,
} as const

export type VersionSnapshot = typeof VERSIONS
