/**
 * Forward-lunge runtime profile (KQ-027).
 *
 * `MovementProfile` describes a cyclic rep movement: a phase FSM keyed on knee
 * angle, rep gates, auto-start/auto-finish on a standing baseline, and squat
 * component scoring. Forward lunge is none of those — it is a transition
 * protocol whose unit of observation is a step-to-stable-return trial produced
 * by its own segmenter. Filling a `MovementProfile` for it would mean inventing
 * squat thresholds that nothing measured, which is exactly the fabrication the
 * evidence rules forbid.
 *
 * So this profile declares only what the forward-lunge runtime actually
 * consumes: the observation protocol it is valid for, the capture parameter the
 * athlete must declare before the recording means anything (lead side), the
 * calibration window, the segmenter thresholds it runs on, and the confidence
 * ceiling it may never exceed while validation is blocked.
 */
import { FORWARD_LUNGE_OBSERVATION_PROTOCOL_ID } from '../../core/protocol'
import { INLINE_LUNGE_THRESHOLDS } from './segmenter'
import type { InlineLungePhase, InlineLungeSide } from './types'

/**
 * Hard ceiling on any confidence this protocol reports.
 *
 * No frozen corpus exists (RES-CORPUS), so nothing here has measured accuracy.
 * `Confidence` maps >= 0.75 to the "High" chip; staying strictly below that
 * means an unvalidated protocol can never render a High-confidence read however
 * clean the landmarks were.
 */
export const UNVALIDATED_CONFIDENCE_CEILING = 0.74

/**
 * Runtime configuration for a protocol segmented as discrete transitions
 * rather than as reps. Discriminated by `kind`, which `MovementProfile` can
 * never hold ('cyclic' | 'ballistic' | 'gait').
 */
export interface TransitionProtocolProfile {
  kind: 'transition'
  id: 'forwardLungeStrideReturn'
  label: string
  /** The only observation protocol this analysis is defined for. */
  observationProtocolId: typeof FORWARD_LUNGE_OBSERVATION_PROTOCOL_ID
  /** Used when the capture surface did not collect an explicit lead side. */
  defaultLeadSide: InlineLungeSide
  /** Standing frames consumed to anchor foot position and pelvis height. */
  calibrationFrames: number
  /** Below this the recording cannot calibrate and the report fully abstains. */
  minimumFrames: number
  /** Fraction of readable frames below which the set abstains as low-confidence. */
  minimumReadableRatio: number
  /** Segmentation thresholds; owned by the segmenter, referenced not copied. */
  thresholds: typeof INLINE_LUNGE_THRESHOLDS
  confidenceCeiling: number
  phases: readonly InlineLungePhase[]
}

export const FORWARD_LUNGE_PROFILE: TransitionProtocolProfile = {
  kind: 'transition',
  id: 'forwardLungeStrideReturn',
  label: 'Forward Lunge',
  observationProtocolId: FORWARD_LUNGE_OBSERVATION_PROTOCOL_ID,
  defaultLeadSide: 'left',
  calibrationFrames: 15,
  // Calibration needs its own window plus enough movement to hold a trial.
  minimumFrames: 30,
  minimumReadableRatio: 0.6,
  thresholds: INLINE_LUNGE_THRESHOLDS,
  confidenceCeiling: UNVALIDATED_CONFIDENCE_CEILING,
  phases: ['standing', 'stepping', 'descending', 'bottom', 'ascending', 'returning'],
}
