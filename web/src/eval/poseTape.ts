/**
 * Pose tapes — serialized raw pose sequences used to replay the analysis
 * pipeline deterministically and offline (see docs/23, M18 benchmark).
 *
 * A tape is the durable substrate: raw landmarks + world landmarks + visibility
 * + timestamps, exactly as MediaPipe produced them. Any pipeline variant (raw,
 * One-Euro, Butterworth, future models) replays the SAME tape, so improvements
 * are measured, not assumed.
 */
import type { PoseFrame } from '../cv/types'
import type { RepRejection } from '../analysis/repCounter'
import {
  ANALYSIS_ALGORITHM_VERSION,
  APP_VERSION,
} from '../core/versioning'
import { normalizeObservationProtocolId, normalizeProtocolId, type ProtocolId } from '../core/protocol'

export interface PoseTapeEvidenceV2 {
  protocolId: ProtocolId
  observationProtocolId: string
  protocolParameters: { leadSide?: 'left' | 'right' }
  rawFrameAuthority: true
  sourceSha256: string
  subjectKey: string
  sessionKey: string
  visitKey?: string
  device: { class: string; browser?: string; fps: number; view: string }
  captureVersion: string
  processingVersion: string
  transformations: Array<{ id: string; parentId: string; kind: string; version: string; seed?: number; parameters: Record<string, unknown>; sha256: string }>
  labelSets: Array<{ id: string; sha256: string }>
  split: 'development' | 'validation' | 'test'
  frozen: boolean
}

/**
 * Pipeline entry state at the moment the set activated, captured so replay
 * can reproduce the live session exactly (finding #7: live auto-start /
 * calibration / beginSetDuringDescent vs cold-start replay).
 */
export interface PoseTapeEntryState {
  /** Auto-start calibrated standing hip Y (normalized) at activation. */
  calibratedHipY: number | null
  /** Upright knee baseline learned before descent, if any. */
  standingKneeAngle: number | null
  /** True when READY → ACTIVE fired because a descent was already underway. */
  activatedByDescent: boolean
}

export interface PoseTapeMeta {
  /** Sampling rate of the sequence in Hz (estimated for live capture). */
  fps: number
  label?: string
  /** Capture path: 'upload' (offline video) or 'live' (camera session). */
  source?: string
  /** ISO-8601 capture time — dataset provenance (see docs/25 capture protocol). */
  recordedAt?: string
  /** Observation protocol the session claims (e.g. 'front-view-squat-v1'). */
  protocolId?: string
  /** Landmark filtering mode the ANALYSIS used. Tape frames are always raw. */
  filtering?: 'raw' | 'one-euro-live' | 'butterworth-offline'
  /**
   * True when the SAVED frames already carry the filtering named above
   * (legacy tapes). Replay must not filter such tapes again. Default
   * false: frames are raw and replay re-applies `filtering` to match
   * what the live analysis actually consumed.
   */
  framesFiltered?: boolean
  /** Pipeline entry state at set activation — replay parity (finding #7). */
  entryState?: PoseTapeEntryState
  /**
   * Index into `frames` where the analysis FSM began (the set-activation
   * frame). Frames before it are calibration preroll, recorded from the
   * READY transition onward so replay can warm the One-Euro filter with
   * exactly the frames the live filter saw. Absent = 0 (no preroll).
   */
  analysisStartFrameIndex?: number
  /** Build identifier for provenance, when available. */
  appVersion?: string
  /**
   * Analysis pipeline identifier at recording time (M46 registry). Additive:
   * old tapes lack it and remain fully readable — readers never require it.
   */
  algorithmVersion?: string
  /** Optional hand-labeled ground truth for benchmarking. */
  truth?: {
    repCount?: number
    /** Frame index of the deepest point of each rep. */
    bottomFrameIndices?: number[]
    /** Who produced the label (person or tool identifier). */
    labeledBy?: string
    /** ISO-8601 time the label was written. */
    labeledAt?: string
    /** How the label was derived (e.g. 'video-contact-sheet-review'). */
    method?: string
    /** Edge cases: clip-start bottoms, cut-off descents, second people. */
    notes?: string
  }
}

/** Session diagnostics carried with the tape for offline audit. */
export interface PoseTapeDiagnostics {
  countedReps: number
  /** Every rejected rep candidate with the gate that fired (see repCounter). */
  rejections: RepRejection[]
}

export interface PoseTape {
  schemaVersion?: 1 | 2
  meta: PoseTapeMeta
  frames: PoseFrame[]
  diagnostics?: PoseTapeDiagnostics
  evidence?: PoseTapeEvidenceV2
}

export function createTape(
  frames: PoseFrame[],
  meta: PoseTapeMeta,
  diagnostics?: PoseTapeDiagnostics,
): PoseTape {
  // Version stamping (M46): additive defaults from the registry; explicit
  // caller values win. Old tapes without these fields stay fully readable.
  const stamped: PoseTapeMeta = {
    appVersion: APP_VERSION,
    algorithmVersion: ANALYSIS_ALGORITHM_VERSION,
    ...meta,
  }
  return diagnostics
    ? { meta: stamped, frames, diagnostics }
    : { meta: stamped, frames }
}

const SHA256 = /^[a-f0-9]{64}$/
const safeKey = (value: string) => /^[a-z0-9][a-z0-9_-]*$/i.test(value) && !value.includes('..')

/** New evidence writers use v2; legacy tapes remain readable without on-disk mutation. */
export function createEvidenceTapeV2(frames: PoseFrame[], meta: PoseTapeMeta, evidence: PoseTapeEvidenceV2, diagnostics?: PoseTapeDiagnostics): PoseTape {
  validatePoseTapeEvidence(evidence)
  const tape = createTape(frames, { ...meta, protocolId: normalizeObservationProtocolId(evidence.observationProtocolId), framesFiltered: false }, diagnostics)
  return { ...tape, schemaVersion: 2, evidence: { ...evidence, protocolId: normalizeProtocolId(evidence.protocolId), observationProtocolId: normalizeObservationProtocolId(evidence.observationProtocolId), rawFrameAuthority: true } }
}

export function validatePoseTapeEvidence(evidence: PoseTapeEvidenceV2): PoseTapeEvidenceV2 {
  normalizeProtocolId(evidence.protocolId)
  if (!SHA256.test(evidence.sourceSha256)) throw new Error('PoseTape v2 requires a lowercase SHA-256 source checksum.')
  for (const [name, value] of [['subjectKey', evidence.subjectKey], ['sessionKey', evidence.sessionKey], ['visitKey', evidence.visitKey]] as const) {
    if (value !== undefined && !safeKey(value)) throw new Error(`${name} must be a pseudonymous safe key.`)
  }
  if (evidence.protocolId === 'forwardLungeStrideReturn' && !evidence.protocolParameters.leadSide) throw new Error('Forward Lunge evidence requires leadSide.')
  if (evidence.frozen && evidence.split === 'development') throw new Error('Frozen evidence cannot be a development/tuning input.')
  const ids = new Set<string>()
  for (const item of evidence.transformations) {
    if (!safeKey(item.id) || ids.has(item.id) || !SHA256.test(item.sha256)) throw new Error('Transformation ids/checksums must be unique and valid.')
    if (item.parentId === item.id) throw new Error('Transformation lineage must be acyclic.')
    ids.add(item.id)
  }
  for (const item of evidence.transformations) if (item.parentId !== 'raw' && !ids.has(item.parentId)) throw new Error(`Missing transformation parent ${item.parentId}.`)
  return evidence
}

export function normalizePoseTapeV2(tape: PoseTape): PoseTape {
  if (tape.schemaVersion === 2 && tape.evidence) { validatePoseTapeEvidence(tape.evidence); return tape }
  if (!tape.meta.protocolId) return tape
  return { ...tape, schemaVersion: tape.schemaVersion ?? 1, meta: { ...tape.meta, protocolId: normalizeObservationProtocolId(tape.meta.protocolId) } }
}

/**
 * Estimate the effective sampling rate of a live (rAF-driven) capture from
 * frame timestamps. Falls back to `fallback` for empty/degenerate sequences.
 */
export function estimateFps(frames: readonly PoseFrame[], fallback = 30): number {
  if (frames.length < 2) return fallback
  const spanMs = frames[frames.length - 1].timestamp - frames[0].timestamp
  if (spanMs <= 0) return fallback
  return Math.round(((frames.length - 1) / spanMs) * 1000 * 10) / 10
}

export function serializeTape(tape: PoseTape): string {
  return JSON.stringify(tape)
}

export function deserializeTape(json: string): PoseTape {
  const parsed = JSON.parse(json) as PoseTape
  if (!parsed || typeof parsed !== 'object' || !parsed.meta || !Array.isArray(parsed.frames)) {
    throw new Error('Invalid pose tape: expected { meta, frames[] }')
  }
  if (typeof parsed.meta.fps !== 'number' || parsed.meta.fps <= 0) {
    throw new Error('Invalid pose tape: meta.fps must be a positive number')
  }
  return normalizePoseTapeV2(parsed)
}

export interface TapeRecorder {
  /** Capture a raw frame as it streams from `detect()`. */
  record(frame: PoseFrame): void
  readonly count: number
  build(meta: PoseTapeMeta): PoseTape
  reset(): void
}

/**
 * Accumulate raw frames into a tape. Tap this alongside `poseEngine.detect` in a
 * live or offline session to capture a replayable recording.
 */
export function createTapeRecorder(): TapeRecorder {
  let frames: PoseFrame[] = []
  return {
    record(frame: PoseFrame): void {
      frames.push(frame)
    },
    get count(): number {
      return frames.length
    },
    build(meta: PoseTapeMeta): PoseTape {
      return { meta, frames: frames.slice() }
    },
    reset(): void {
      frames = []
    },
  }
}
