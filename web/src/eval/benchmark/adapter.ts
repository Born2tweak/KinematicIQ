/**
 * Adapter contract: raw source frames → neutral benchmark sequence (M62).
 *
 * Applies a validated `SkeletonMap` to per-frame source landmarks, producing
 * canonical joint samples with explicit state. The adapter never guesses:
 * `direct` copies a present source joint (else `missing`); `derived` computes
 * only when every input is present (else `missing`) and records
 * `derivedFrom`; `ambiguous` and `unavailable` never yield a coordinate.
 * Timestamps and frame indices pass through verbatim, so nonuniform sampling
 * and dropped frames survive adaptation. Only tiny hand-authored fixtures are
 * adapted here — no public corpus is downloaded (ADR-006).
 */
import {
  CANONICAL_JOINTS,
  type CanonicalJoint,
} from './canonicalSkeleton'
import type { SkeletonMap } from './skeletonMap'
import {
  parseBenchmarkSequence,
  type BenchmarkFrame,
  type BenchmarkSequence,
  type JointSample,
  type BenchmarkCapture,
  type BenchmarkLabels,
  type BenchmarkSource,
} from './benchmarkSequence'

/** A raw source landmark; null/absent means the source did not report it. */
export interface SourceLandmark {
  x: number
  y: number
  z: number
  confidence: number
}

export interface SourceFrame {
  index: number
  timestampMs: number
  /** Keyed by SOURCE joint name. Missing key or null = not reported. */
  joints: Record<string, SourceLandmark | null>
}

export interface AdapterInput {
  source: BenchmarkSource
  capture: BenchmarkCapture
  labels: BenchmarkLabels
  frames: SourceFrame[]
  map: SkeletonMap
  /** Tool identity recorded in the transformation history. */
  adapterVersion: string
}

function midpoint(points: SourceLandmark[]): SourceLandmark {
  const n = points.length
  const sum = points.reduce(
    (acc, p) => ({
      x: acc.x + p.x,
      y: acc.y + p.y,
      z: acc.z + p.z,
      confidence: acc.confidence + p.confidence,
    }),
    { x: 0, y: 0, z: 0, confidence: 0 },
  )
  return { x: sum.x / n, y: sum.y / n, z: sum.z / n, confidence: sum.confidence / n }
}

function sampleFor(
  joint: CanonicalJoint,
  map: SkeletonMap,
  srcJoints: Record<string, SourceLandmark | null>,
): JointSample {
  const mapping = map.joints[joint]
  const absent = (name: string): boolean =>
    srcJoints[name] === undefined || srcJoints[name] === null

  switch (mapping.kind) {
    case 'unavailable':
      return { joint, x: null, y: null, z: null, confidence: null, state: 'unavailable' }
    case 'ambiguous':
      // A correspondence may exist, but asserting it would invent certainty.
      return { joint, x: null, y: null, z: null, confidence: null, state: 'missing' }
    case 'direct': {
      if (absent(mapping.sourceJoint)) {
        return { joint, x: null, y: null, z: null, confidence: null, state: 'missing' }
      }
      const p = srcJoints[mapping.sourceJoint] as SourceLandmark
      return { joint, x: p.x, y: p.y, z: p.z, confidence: p.confidence, state: 'observed' }
    }
    case 'derived': {
      if (mapping.from.some(absent)) {
        return { joint, x: null, y: null, z: null, confidence: null, state: 'missing' }
      }
      if (mapping.method !== 'midpoint') {
        // Unknown derivations are not fabricated — abstain explicitly.
        return { joint, x: null, y: null, z: null, confidence: null, state: 'missing' }
      }
      const pts = mapping.from.map((n) => srcJoints[n] as SourceLandmark)
      const m = midpoint(pts)
      return {
        joint,
        x: m.x,
        y: m.y,
        z: m.z,
        confidence: m.confidence,
        state: 'derived',
        derivedFrom: [...mapping.from],
      }
    }
  }
}

/**
 * Adapt raw source frames into a validated `BenchmarkSequence`. The result is
 * round-tripped through `parseBenchmarkSequence`, so an adapter that produced
 * an invalid sequence fails loudly rather than emitting bad benchmark data.
 */
export function adaptToBenchmark(input: AdapterInput): BenchmarkSequence {
  const frames: BenchmarkFrame[] = input.frames.map((f) => ({
    index: f.index,
    timestampMs: f.timestampMs,
    joints: CANONICAL_JOINTS.map((j) => sampleFor(j, input.map, f.joints)),
  }))

  const sequence: BenchmarkSequence = {
    schemaVersion: 1,
    source: input.source,
    capture: input.capture,
    skeleton: {
      sourceSkeletonId: input.map.sourceSkeletonId,
      canonicalSkeletonId: input.map.targetSkeletonId,
      skeletonMapId: input.map.id,
      skeletonMapVersion: input.map.version,
    },
    frames,
    labels: input.labels,
    transformations: [
      {
        tool: input.adapterVersion,
        version: `${input.map.id}@${input.map.version}`,
        note: `Adapted ${input.map.sourceSkeletonId} to ${input.map.targetSkeletonId} via skeleton map.`,
      },
    ],
  }

  // Validate what we built — parse throws on any contract violation.
  return parseBenchmarkSequence(sequence)
}
