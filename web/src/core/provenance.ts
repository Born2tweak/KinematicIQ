/**
 * Core provenance vocabulary (M3).
 *
 * Every result the platform emits must be traceable to how it was captured and
 * processed — which is what makes pose tapes an audit trail and validation
 * scoped to (question, protocol) pairs (docs/doctrine/movement-ontology.md P5,
 * docs/research/05...Handbook.md production standard, docs/research/08 §5
 * `Versioned`).
 *
 * Types-only + pure helpers.
 */
import {
  ANALYSIS_ALGORITHM_VERSION,
  APP_VERSION,
  POSE_MODEL_VERSION,
} from './versioning'

/** Where the frames came from. Mirrors `PoseTapeMeta.source` values. */
export type CaptureSource = 'live' | 'upload' | 'replay' | 'synthetic'

/** Landmark filtering the analysis consumed. Mirrors `PoseTapeMeta.filtering`. */
export type FilterVariant = 'raw' | 'one-euro-live' | 'butterworth-offline'

export interface Provenance {
  /** How the frames were captured. */
  captureSource: CaptureSource
  /** Pose model identifier (e.g. 'mediapipe-tasks-vision-0.10'). */
  modelVersion: string
  /** Filtering variant applied before analysis. */
  filterVariant: FilterVariant
  /** Observation protocol claimed by the capture (e.g. 'front-view-squat-v1'). */
  protocolId?: string
  /** Tape identifier when this result derives from a replayable tape. */
  tapeId?: string
  /** App/build identifier for reproducibility. */
  appVersion?: string
  /** ISO-8601 capture time. */
  recordedAt?: string
  /** Analysis/algorithm version, when tracked separately from the model. */
  algorithmVersion?: string
}

/**
 * How a session's frames were captured and filtered, supplied by the capture
 * surface (camera / upload / replay) so exported provenance reflects what
 * actually happened — never a hardcoded default contradicting the pose tape.
 */
export interface CaptureContext {
  captureSource: CaptureSource
  filterVariant: FilterVariant
}

/** Re-exported from the M46 registry — kept for existing imports. */
export const DEFAULT_MODEL_VERSION = POSE_MODEL_VERSION

/**
 * Build a provenance record with sensible defaults from the version
 * registry (core/versioning.ts, M46). Callers override only what they
 * know; unknown fields stay absent rather than being faked.
 */
export function makeProvenance(
  partial: Partial<Provenance> & Pick<Provenance, 'captureSource'>,
): Provenance {
  return {
    modelVersion: POSE_MODEL_VERSION,
    filterVariant: 'raw',
    appVersion: APP_VERSION,
    algorithmVersion: ANALYSIS_ALGORITHM_VERSION,
    ...partial,
  }
}
