/**
 * Core protocol vocabulary (M3).
 *
 * `ProtocolDefinition` is the movement-agnostic superset of the existing
 * `MovementProfile` (analysis/movement/types.ts): it describes a movement as
 * configuration — its kind, phases, required landmarks, the metrics it emits,
 * and the finding rules that interpret them — plus a lifecycle `status` so the
 * registry (M5) can list validated vs planned protocols (M10) without forking
 * the pipeline.
 *
 * Design sources: docs/research/08...Architecture...Specification.md §3
 * (protocol engine / plugin contract), docs/research/01 §6.3 (movement-agnostic
 * vs -specific split), docs/doctrine/movement-ontology.md.
 *
 * Types-only: this defines the contract M5's registry conforms to. It does not
 * import or alter the existing `MovementProfile` — M5 designs the adapter so
 * squat keeps working unchanged.
 *
 * The behavioral counterpart is `protocols/runtime.ts` (M39 `ProtocolRuntime`):
 * the five-stage pluggable runtime (segment → metrics → findings → quality →
 * report metadata) a protocol provides. This module stays types-only.
 */
import type { MetricDefinition } from './metric'

/** Movement identifiers the platform knows about. Matches analysis MovementId. */
export type ProtocolId = 'squat' | 'sitToStand' | 'hipHinge' | 'jump' | 'sprint'

/**
 * Segmentation engine kind (matches analysis/movement/types.ts `MovementKind`):
 * cyclic (reps with a bottom), ballistic (flight + landing), gait (strides).
 */
export type ProtocolKind = 'cyclic' | 'transition' | 'ballistic' | 'gait'

/**
 * Lifecycle status. `available` = validated enough to analyze; `planned` =
 * defined but its analyze entry point throws (M10 stubs) and the UI shows
 * honest "in development — not yet validated" copy.
 */
export type ProtocolStatus = 'available' | 'planned'

export type ProtocolInputMode = 'live' | 'upload' | 'replay'
export type ProtocolCameraView = 'front' | 'side' | 'either' | 'multi-view'

export type ProtocolEvidenceState = 'implemented' | 'research-only'
export type ProtocolValidationState = 'passed' | 'pending' | 'blocked'

/**
 * Versioned evidence metadata. This is governance metadata, not an activation
 * mechanism: `status` remains the only availability switch.
 */
export interface ProtocolEvidenceMetadataV2 {
  schemaVersion: 2
  researchState: ProtocolEvidenceState
  evidenceRefs: string[]
  datasetProvenance: Array<{
    datasetId: string
    role: 'development' | 'benchmark' | 'ontology-only'
  }>
  cameraAssumptions: {
    validationState: 'validated' | 'provisional' | 'unvalidated'
    evidenceRefs: string[]
  }
  validationGates: Array<{
    id: string
    state: ProtocolValidationState
    evidenceRefs: string[]
  }>
  acceptanceThresholds: {
    provenance: 'evidence-backed' | 'provisional' | 'not-defined'
    evidenceRefs: string[]
  }
}

/** Capture/setup contract consumed by every input surface. */
export interface ProtocolCaptureConfig {
  inputModes: ProtocolInputMode[]
  cameraView: ProtocolCameraView
  viewInstruction: string
  setupInstructions: string[]
}

export interface ProtocolDefinition {
  id: ProtocolId
  /** User-facing movement name. */
  label: string
  kind: ProtocolKind
  status: ProtocolStatus
  /** Additive M81 governance contract; does not make a protocol available. */
  evidence: ProtocolEvidenceMetadataV2
  /** Phase vocabulary for this movement's segmentation kind, in order. */
  phases: string[]
  /**
   * MediaPipe landmark indices the analysis needs present to run. Feeds the
   * capture-readiness model (M4) and abstention reasons.
   */
  requiredLandmarks: number[]
  /** One canonical source for camera/upload setup and view wording. */
  capture: ProtocolCaptureConfig
  /** Metric definitions this protocol emits (M6 populates the registry). */
  metrics: MetricDefinition[]
  /** IDs of the finding rules that interpret this protocol's metrics (M7). */
  findingRuleIds: string[]
  /** Observation protocol this definition is validated for, if any (P5). */
  defaultObservationProtocolId?: string
}

/** Reject contradictory governance/availability combinations at the boundary. */
export function validateProtocolDefinition(
  protocol: ProtocolDefinition,
): ProtocolDefinition {
  const { evidence } = protocol
  if (evidence.schemaVersion !== 2) {
    throw new Error(`Protocol "${protocol.id}" has an unsupported evidence schema.`)
  }
  if (protocol.status === 'available') {
    if (evidence.researchState !== 'implemented') {
      throw new Error(`Available protocol "${protocol.id}" must be implemented.`)
    }
    if (evidence.cameraAssumptions.validationState === 'unvalidated') {
      throw new Error(`Available protocol "${protocol.id}" cannot use an unvalidated camera contract.`)
    }
    if (evidence.acceptanceThresholds.provenance === 'not-defined') {
      throw new Error(`Available protocol "${protocol.id}" must declare threshold provenance.`)
    }
  } else {
    if (evidence.researchState !== 'research-only') {
      throw new Error(`Planned protocol "${protocol.id}" must remain research-only.`)
    }
    if (protocol.capture.inputModes.length > 0) {
      throw new Error(`Planned protocol "${protocol.id}" cannot expose input modes.`)
    }
  }
  return protocol
}

/** True when a protocol is validated enough to analyze. Narrows nothing structurally. */
export function isAvailable(protocol: ProtocolDefinition): boolean {
  return protocol.status === 'available'
}

/** Raised when a `planned` protocol's analyze entry point is invoked (M10). */
export class NotImplementedError extends Error {
  readonly protocolId: ProtocolId
  constructor(protocolId: ProtocolId) {
    super(`Protocol "${protocolId}" is defined but not yet implemented (planned).`)
    this.name = 'NotImplementedError'
    this.protocolId = protocolId
  }
}
