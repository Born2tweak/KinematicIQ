/**
 * Neutral benchmark-sequence schema (M62).
 *
 * A source-agnostic representation of one external movement trial, kept
 * DELIBERATELY SEPARATE from `PoseTape` and `RepMetrics`: a pose tape is
 * KinematicIQ's own raw MediaPipe capture for squat replay; this schema
 * describes any dataset's sequence in canonical joints, with explicit
 * missingness, arbitrary labels/events, and full transformation provenance —
 * without assuming cyclic repetitions or squat phases (ADR-006, ADR-007).
 *
 * Missingness is always explicit: every frame lists every canonical joint
 * with a `state`; a dropped joint is `missing`/`dropout` with null
 * coordinates, never an omitted entry. Timestamps are carried verbatim and
 * may be nonuniform — the schema never silently resamples or compresses.
 *
 * The schema version lives here, next to its reader, per the versioning
 * doctrine (behavioral identifiers live in `core/versioning.ts`; STORED-shape
 * versions live with the code that parses them).
 */
import {
  AXIS_DIRECTIONS,
  CANONICAL_JOINT_SET,
  CANONICAL_JOINTS,
  CANONICAL_SKELETON_ID,
  LENGTH_UNITS,
  type CanonicalJoint,
  type CoordinateSystem,
} from './canonicalSkeleton'

export const BENCHMARK_SEQUENCE_VERSION = 1

/** Runtime state of a canonical joint on a frame. */
export type JointState =
  | 'observed' // tracked/measured this frame
  | 'derived' // computed from source joints (carries derivedFrom)
  | 'missing' // source had it but it is absent/low-confidence this frame
  | 'dropout' // a tracked-then-lost gap (temporal loss)
  | 'unavailable' // the source skeleton has no such joint at all

export const JOINT_STATES: ReadonlySet<string> = new Set([
  'observed',
  'derived',
  'missing',
  'dropout',
  'unavailable',
])

/** A canonical joint's value on one frame. Coordinates are null unless present. */
export interface JointSample {
  joint: CanonicalJoint
  x: number | null
  y: number | null
  z: number | null
  confidence: number | null
  state: JointState
  /** Source joints a `derived` sample came from (derivation provenance). */
  derivedFrom?: string[]
}

export interface BenchmarkFrame {
  index: number
  /** Source timestamp in ms. Preserved verbatim; may be nonuniform. */
  timestampMs: number
  joints: JointSample[]
}

export type BenchmarkEventType =
  | 'repetition'
  | 'phase'
  | 'transition' // e.g. sit-to-stand — a non-cyclic movement event
  | 'event'

export interface BenchmarkLabelEvent {
  type: BenchmarkEventType
  label: string
  startFrame: number
  endFrame?: number
}

export interface BenchmarkLabels {
  /** Activity/movement class, e.g. 'sit-to-stand', 'deep-squat'. */
  activity?: string
  events: BenchmarkLabelEvent[]
  provenance: { labeledBy: string; method: string; note?: string }
}

/** One recorded transformation step — the adaptation audit trail. */
export interface TransformationRecord {
  tool: string
  version: string
  note: string
}

export interface BenchmarkSource {
  datasetId: string
  datasetVersion: string
  sequenceId: string
  /** Pseudonym only — never a real participant identifier. */
  subjectPseudonym: string
  /** Preserve the dataset's own split so leakage-safe evaluation is possible. */
  split: 'train' | 'validation' | 'test' | 'unspecified'
}

export interface BenchmarkCapture {
  coordinateSystem: CoordinateSystem
  imageWidth?: number
  imageHeight?: number
  cameraView?: string
  /** Declared source rate, or null when unknown; timestamps remain source-of-truth. */
  sourceFrameRateHz: number | null
}

export interface BenchmarkSkeletonRef {
  sourceSkeletonId: string
  canonicalSkeletonId: string
  skeletonMapId: string
  skeletonMapVersion: string
}

export interface BenchmarkSequence {
  schemaVersion: number
  source: BenchmarkSource
  capture: BenchmarkCapture
  skeleton: BenchmarkSkeletonRef
  frames: BenchmarkFrame[]
  labels: BenchmarkLabels
  transformations: TransformationRecord[]
}

const SPLITS: ReadonlySet<string> = new Set([
  'train',
  'validation',
  'test',
  'unspecified',
])
const EVENT_TYPES: ReadonlySet<string> = new Set([
  'repetition',
  'phase',
  'transition',
  'event',
])

function str(value: unknown, where: string): string {
  if (typeof value !== 'string' || value === '') {
    throw new Error(`${where} must be a non-empty string.`)
  }
  return value
}

function finiteNum(value: unknown, where: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${where} must be a finite number.`)
  }
  return value
}

function parseCoordinateSystem(raw: unknown, where: string): CoordinateSystem {
  const c = (raw ?? {}) as Record<string, unknown>
  if (typeof c.units !== 'string' || !LENGTH_UNITS.has(c.units)) {
    throw new Error(`${where}.units must be one of ${[...LENGTH_UNITS].join(', ')}.`)
  }
  for (const axis of ['xAxis', 'yAxis', 'zAxis'] as const) {
    if (typeof c[axis] !== 'string' || !AXIS_DIRECTIONS.has(c[axis] as string)) {
      throw new Error(`${where}.${axis} must be a valid axis direction.`)
    }
  }
  return {
    units: c.units as CoordinateSystem['units'],
    xAxis: c.xAxis as CoordinateSystem['xAxis'],
    yAxis: c.yAxis as CoordinateSystem['yAxis'],
    zAxis: c.zAxis as CoordinateSystem['zAxis'],
    origin: str(c.origin, `${where}.origin`),
  }
}

function parseJointSample(raw: unknown, where: string): JointSample {
  const j = (raw ?? {}) as Record<string, unknown>
  const joint = str(j.joint, `${where}.joint`)
  if (!CANONICAL_JOINT_SET.has(joint)) {
    throw new Error(`${where}.joint "${joint}" is not a canonical joint.`)
  }
  if (typeof j.state !== 'string' || !JOINT_STATES.has(j.state)) {
    throw new Error(`${where}.state must be one of ${[...JOINT_STATES].join(', ')}.`)
  }
  const state = j.state as JointState
  const hasCoords = state === 'observed' || state === 'derived'
  const coords: Record<'x' | 'y' | 'z', number | null> = { x: null, y: null, z: null }
  for (const axis of ['x', 'y', 'z'] as const) {
    if (hasCoords) {
      coords[axis] = finiteNum(j[axis], `${where}.${axis}`)
    } else if (j[axis] !== null && j[axis] !== undefined) {
      throw new Error(
        `${where}.${axis} must be null when state is "${state}" (missingness is explicit).`,
      )
    }
  }
  let confidence: number | null = null
  if (hasCoords) {
    confidence = finiteNum(j.confidence, `${where}.confidence`)
    if (confidence < 0 || confidence > 1) {
      throw new Error(`${where}.confidence must be within [0, 1].`)
    }
  } else if (j.confidence !== null && j.confidence !== undefined) {
    throw new Error(`${where}.confidence must be null when state is "${state}".`)
  }
  const sample: JointSample = { joint: joint as CanonicalJoint, ...coords, confidence, state }
  if (state === 'derived') {
    if (!Array.isArray(j.derivedFrom) || j.derivedFrom.length === 0) {
      throw new Error(`${where}.derivedFrom is required for a derived joint.`)
    }
    sample.derivedFrom = j.derivedFrom.map((v, i) => str(v, `${where}.derivedFrom[${i}]`))
  } else if (j.derivedFrom !== undefined) {
    throw new Error(`${where}.derivedFrom is only valid for a derived joint.`)
  }
  return sample
}

function parseFrame(raw: unknown, where: string): BenchmarkFrame {
  const f = (raw ?? {}) as Record<string, unknown>
  const index = finiteNum(f.index, `${where}.index`)
  const timestampMs = finiteNum(f.timestampMs, `${where}.timestampMs`)
  if (!Array.isArray(f.joints)) {
    throw new Error(`${where}.joints must be an array.`)
  }
  const joints = f.joints.map((j, i) => parseJointSample(j, `${where}.joints[${i}]`))
  // Missingness is explicit: every canonical joint must appear exactly once.
  const seen = new Set(joints.map((j) => j.joint))
  if (seen.size !== joints.length) {
    throw new Error(`${where}.joints has a duplicate canonical joint.`)
  }
  for (const canonical of CANONICAL_JOINTS) {
    if (!seen.has(canonical)) {
      throw new Error(`${where}.joints is missing canonical joint "${canonical}".`)
    }
  }
  return { index, timestampMs, joints }
}

/**
 * Parse + validate a raw benchmark sequence. Throws on the first problem.
 * Enforces strictly increasing frame indices and timestamps so no missing
 * frame is silently compressed away.
 */
export function parseBenchmarkSequence(raw: unknown): BenchmarkSequence {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('Benchmark sequence must be a JSON object.')
  }
  const seq = raw as Record<string, unknown>
  if (seq.schemaVersion !== BENCHMARK_SEQUENCE_VERSION) {
    throw new Error(
      `Unsupported benchmark sequence version ${String(seq.schemaVersion)} — this reader understands v${BENCHMARK_SEQUENCE_VERSION}.`,
    )
  }

  const s = (seq.source ?? {}) as Record<string, unknown>
  if (typeof s.split !== 'string' || !SPLITS.has(s.split)) {
    throw new Error(`source.split must be one of ${[...SPLITS].join(', ')}.`)
  }
  const source: BenchmarkSource = {
    datasetId: str(s.datasetId, 'source.datasetId'),
    datasetVersion: str(s.datasetVersion, 'source.datasetVersion'),
    sequenceId: str(s.sequenceId, 'source.sequenceId'),
    subjectPseudonym: str(s.subjectPseudonym, 'source.subjectPseudonym'),
    split: s.split as BenchmarkSource['split'],
  }

  const cap = (seq.capture ?? {}) as Record<string, unknown>
  const capture: BenchmarkCapture = {
    coordinateSystem: parseCoordinateSystem(cap.coordinateSystem, 'capture.coordinateSystem'),
    sourceFrameRateHz:
      cap.sourceFrameRateHz === null || cap.sourceFrameRateHz === undefined
        ? null
        : finiteNum(cap.sourceFrameRateHz, 'capture.sourceFrameRateHz'),
  }
  if (cap.imageWidth !== undefined) {
    capture.imageWidth = finiteNum(cap.imageWidth, 'capture.imageWidth')
  }
  if (cap.imageHeight !== undefined) {
    capture.imageHeight = finiteNum(cap.imageHeight, 'capture.imageHeight')
  }
  if (cap.cameraView !== undefined) {
    capture.cameraView = str(cap.cameraView, 'capture.cameraView')
  }

  const sk = (seq.skeleton ?? {}) as Record<string, unknown>
  const skeleton: BenchmarkSkeletonRef = {
    sourceSkeletonId: str(sk.sourceSkeletonId, 'skeleton.sourceSkeletonId'),
    canonicalSkeletonId: str(sk.canonicalSkeletonId, 'skeleton.canonicalSkeletonId'),
    skeletonMapId: str(sk.skeletonMapId, 'skeleton.skeletonMapId'),
    skeletonMapVersion: str(sk.skeletonMapVersion, 'skeleton.skeletonMapVersion'),
  }
  if (skeleton.canonicalSkeletonId !== CANONICAL_SKELETON_ID) {
    throw new Error(
      `skeleton.canonicalSkeletonId must be "${CANONICAL_SKELETON_ID}".`,
    )
  }

  if (!Array.isArray(seq.frames)) {
    throw new Error('frames must be an array.')
  }
  const frames = seq.frames.map((f, i) => parseFrame(f, `frames[${i}]`))
  for (let i = 1; i < frames.length; i++) {
    if (frames[i].index <= frames[i - 1].index) {
      throw new Error(
        `frames[${i}].index must strictly increase (missing frames stay explicit, never compressed).`,
      )
    }
    if (frames[i].timestampMs <= frames[i - 1].timestampMs) {
      throw new Error(`frames[${i}].timestampMs must strictly increase.`)
    }
  }

  const lab = (seq.labels ?? {}) as Record<string, unknown>
  if (!Array.isArray(lab.events)) {
    throw new Error('labels.events must be an array.')
  }
  const events = lab.events.map((e, i) => {
    const ev = (e ?? {}) as Record<string, unknown>
    if (typeof ev.type !== 'string' || !EVENT_TYPES.has(ev.type)) {
      throw new Error(`labels.events[${i}].type must be one of ${[...EVENT_TYPES].join(', ')}.`)
    }
    const event: BenchmarkLabelEvent = {
      type: ev.type as BenchmarkEventType,
      label: str(ev.label, `labels.events[${i}].label`),
      startFrame: finiteNum(ev.startFrame, `labels.events[${i}].startFrame`),
    }
    if (ev.endFrame !== undefined) {
      event.endFrame = finiteNum(ev.endFrame, `labels.events[${i}].endFrame`)
    }
    return event
  })
  const prov = (lab.provenance ?? {}) as Record<string, unknown>
  const labels: BenchmarkLabels = {
    events,
    provenance: {
      labeledBy: str(prov.labeledBy, 'labels.provenance.labeledBy'),
      method: str(prov.method, 'labels.provenance.method'),
    },
  }
  if (lab.activity !== undefined) labels.activity = str(lab.activity, 'labels.activity')
  if (prov.note !== undefined) {
    labels.provenance.note = str(prov.note, 'labels.provenance.note')
  }

  if (!Array.isArray(seq.transformations)) {
    throw new Error('transformations must be an array.')
  }
  const transformations = seq.transformations.map((t, i) => {
    const tr = (t ?? {}) as Record<string, unknown>
    return {
      tool: str(tr.tool, `transformations[${i}].tool`),
      version: str(tr.version, `transformations[${i}].version`),
      note: str(tr.note, `transformations[${i}].note`),
    }
  })

  return { schemaVersion: BENCHMARK_SEQUENCE_VERSION, source, capture, skeleton, frames, labels, transformations }
}

/**
 * Deterministic serialization. Reconstructs each object with a fixed key
 * order so `serialize(x) === serialize(parse(serialize(x)))` byte-for-byte,
 * independent of the input object's key insertion order.
 */
export function serializeBenchmarkSequence(seq: BenchmarkSequence): string {
  const orderedJoint = (j: JointSample) => {
    const o: Record<string, unknown> = {
      joint: j.joint,
      x: j.x,
      y: j.y,
      z: j.z,
      confidence: j.confidence,
      state: j.state,
    }
    if (j.derivedFrom !== undefined) o.derivedFrom = [...j.derivedFrom]
    return o
  }
  const ordered = {
    schemaVersion: seq.schemaVersion,
    source: {
      datasetId: seq.source.datasetId,
      datasetVersion: seq.source.datasetVersion,
      sequenceId: seq.source.sequenceId,
      subjectPseudonym: seq.source.subjectPseudonym,
      split: seq.source.split,
    },
    capture: {
      coordinateSystem: {
        units: seq.capture.coordinateSystem.units,
        xAxis: seq.capture.coordinateSystem.xAxis,
        yAxis: seq.capture.coordinateSystem.yAxis,
        zAxis: seq.capture.coordinateSystem.zAxis,
        origin: seq.capture.coordinateSystem.origin,
      },
      ...(seq.capture.imageWidth !== undefined ? { imageWidth: seq.capture.imageWidth } : {}),
      ...(seq.capture.imageHeight !== undefined ? { imageHeight: seq.capture.imageHeight } : {}),
      ...(seq.capture.cameraView !== undefined ? { cameraView: seq.capture.cameraView } : {}),
      sourceFrameRateHz: seq.capture.sourceFrameRateHz,
    },
    skeleton: {
      sourceSkeletonId: seq.skeleton.sourceSkeletonId,
      canonicalSkeletonId: seq.skeleton.canonicalSkeletonId,
      skeletonMapId: seq.skeleton.skeletonMapId,
      skeletonMapVersion: seq.skeleton.skeletonMapVersion,
    },
    frames: seq.frames.map((f) => ({
      index: f.index,
      timestampMs: f.timestampMs,
      joints: f.joints.map(orderedJoint),
    })),
    labels: {
      ...(seq.labels.activity !== undefined ? { activity: seq.labels.activity } : {}),
      events: seq.labels.events.map((e) => ({
        type: e.type,
        label: e.label,
        startFrame: e.startFrame,
        ...(e.endFrame !== undefined ? { endFrame: e.endFrame } : {}),
      })),
      provenance: {
        labeledBy: seq.labels.provenance.labeledBy,
        method: seq.labels.provenance.method,
        ...(seq.labels.provenance.note !== undefined ? { note: seq.labels.provenance.note } : {}),
      },
    },
    transformations: seq.transformations.map((t) => ({
      tool: t.tool,
      version: t.version,
      note: t.note,
    })),
  }
  return JSON.stringify(ordered)
}
