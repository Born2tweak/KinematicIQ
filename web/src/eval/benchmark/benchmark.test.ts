import { describe, expect, it } from 'vitest'
import {
  CANONICAL_JOINTS,
  CANONICAL_SKELETON_ID,
} from './canonicalSkeleton'
import { parseSkeletonMap } from './skeletonMap'
import { COCO_17_MAP, KINECT_25_MAP } from './exampleMaps'
import {
  adaptToBenchmark,
  type AdapterInput,
  type SourceFrame,
  type SourceLandmark,
} from './adapter'
import {
  BENCHMARK_SEQUENCE_VERSION,
  parseBenchmarkSequence,
  serializeBenchmarkSequence,
  type BenchmarkSequence,
} from './benchmarkSequence'
import { bridgeToCyclicSquat } from './benchmarkBridge'

function lm(x: number, y: number, z = 0, confidence = 0.9): SourceLandmark {
  return { x, y, z, confidence }
}

/** Full COCO-17 frame with every source joint present. */
function cocoFrame(index: number, timestampMs: number): SourceFrame {
  const joints: Record<string, SourceLandmark | null> = {}
  for (const name of COCO_17_MAP.sourceJoints) {
    joints[name] = lm(0.5, 0.5)
  }
  return { index, timestampMs, joints }
}

/** Full Kinect-25 frame with every source joint present. */
function kinectFrame(index: number, timestampMs: number): SourceFrame {
  const joints: Record<string, SourceLandmark | null> = {}
  for (const name of KINECT_25_MAP.sourceJoints) {
    joints[name] = lm(100, 200, 50)
  }
  return { index, timestampMs, joints }
}

function cocoInput(frames: SourceFrame[]): AdapterInput {
  return {
    source: {
      datasetId: 'ui-prmd',
      datasetVersion: '2018-release',
      sequenceId: 'seq-01',
      subjectPseudonym: 'subj-a',
      split: 'unspecified',
    },
    capture: {
      coordinateSystem: {
        units: 'normalized-image',
        xAxis: 'right',
        yAxis: 'down',
        zAxis: 'forward',
        origin: 'image-top-left',
      },
      imageWidth: 1920,
      imageHeight: 1080,
      cameraView: 'frontal',
      sourceFrameRateHz: 30,
    },
    labels: {
      activity: 'deep-squat',
      events: [{ type: 'repetition', label: 'rep-1', startFrame: 0, endFrame: 2 }],
      provenance: { labeledBy: 'fixture-author', method: 'hand-authored' },
    },
    frames,
    map: COCO_17_MAP,
    adapterVersion: 'm62-test-adapter@1',
  }
}

function kinectInput(frames: SourceFrame[]): AdapterInput {
  return {
    ...cocoInput(frames),
    capture: {
      coordinateSystem: {
        units: 'millimeters',
        xAxis: 'right',
        yAxis: 'up',
        zAxis: 'backward',
        origin: 'sensor',
      },
      sourceFrameRateHz: null,
    },
    map: KINECT_25_MAP,
  }
}

describe('skeleton maps', () => {
  it('both example maps address every canonical joint', () => {
    for (const map of [COCO_17_MAP, KINECT_25_MAP]) {
      for (const joint of CANONICAL_JOINTS) {
        expect(map.joints[joint]).toBeDefined()
      }
      expect(map.targetSkeletonId).toBe(CANONICAL_SKELETON_ID)
    }
  })

  it('the two fixtures are materially different skeletons', () => {
    // COCO derives the pelvis; Kinect has a real one.
    expect(COCO_17_MAP.joints.pelvis_mid.kind).toBe('derived')
    expect(KINECT_25_MAP.joints.pelvis_mid.kind).toBe('direct')
    // COCO has ears; Kinect does not. Kinect has feet; COCO does not.
    expect(COCO_17_MAP.joints.left_ear.kind).toBe('direct')
    expect(KINECT_25_MAP.joints.left_ear.kind).toBe('unavailable')
    expect(COCO_17_MAP.joints.left_foot_index.kind).toBe('unavailable')
    expect(KINECT_25_MAP.joints.left_foot_index.kind).toBe('direct')
  })

  it('rejects a map missing a canonical joint', () => {
    const raw = JSON.parse(JSON.stringify(COCO_17_MAP)) as Record<string, unknown>
    delete (raw.joints as Record<string, unknown>).pelvis_mid
    expect(() => parseSkeletonMap(raw)).toThrow(/pelvis_mid/)
  })

  it('rejects a direct mapping to an undeclared source joint (no invented anatomy)', () => {
    const raw = JSON.parse(JSON.stringify(COCO_17_MAP)) as {
      joints: Record<string, unknown>
    }
    raw.joints.left_heel = { kind: 'direct', sourceJoint: 'left_heel_bone' }
    expect(() => parseSkeletonMap(raw)).toThrow(/not a declared source joint/)
  })

  it('rejects a derivation from an undeclared source joint', () => {
    const raw = JSON.parse(JSON.stringify(COCO_17_MAP)) as {
      joints: Record<string, unknown>
    }
    raw.joints.pelvis_mid = {
      kind: 'derived',
      from: ['left_hip', 'sacrum'],
      method: 'midpoint',
      note: 'x',
    }
    expect(() => parseSkeletonMap(raw)).toThrow(/sacrum/)
  })
})

describe('adapter', () => {
  it('adapts a COCO frame: direct joints observed, feet unavailable, pelvis derived with provenance', () => {
    const seq = adaptToBenchmark(cocoInput([cocoFrame(0, 0), cocoFrame(1, 33)]))
    const frame = seq.frames[0]
    const byJoint = new Map(frame.joints.map((j) => [j.joint, j]))

    expect(byJoint.get('left_hip')?.state).toBe('observed')
    // Unavailable joints REMAIN unavailable.
    expect(byJoint.get('left_heel')?.state).toBe('unavailable')
    expect(byJoint.get('left_heel')?.x).toBeNull()
    // Derived joints retain derivation provenance.
    const pelvis = byJoint.get('pelvis_mid')
    expect(pelvis?.state).toBe('derived')
    expect(pelvis?.derivedFrom).toEqual(['left_hip', 'right_hip'])
    expect(pelvis?.x).toBeCloseTo(0.5)
  })

  it('adapts a Kinect frame: pelvis direct, ears unavailable, nose abstains (ambiguous)', () => {
    const seq = adaptToBenchmark(kinectInput([kinectFrame(0, 0)]))
    const byJoint = new Map(seq.frames[0].joints.map((j) => [j.joint, j]))
    expect(byJoint.get('pelvis_mid')?.state).toBe('observed')
    expect(byJoint.get('left_ear')?.state).toBe('unavailable')
    // Ambiguous never yields a coordinate.
    expect(byJoint.get('nose')?.state).toBe('missing')
    expect(byJoint.get('nose')?.x).toBeNull()
  })

  it('landmark dropout stays explicit: a missing hip yields missing hip AND missing derived pelvis', () => {
    const dropped = cocoFrame(1, 33)
    dropped.joints.left_hip = null
    const seq = adaptToBenchmark(cocoInput([cocoFrame(0, 0), dropped, cocoFrame(2, 66)]))
    const byJoint = new Map(seq.frames[1].joints.map((j) => [j.joint, j]))
    expect(byJoint.get('left_hip')?.state).toBe('missing')
    expect(byJoint.get('left_hip')?.x).toBeNull()
    // Derivation refuses when an input is absent — no fabricated pelvis.
    expect(byJoint.get('pelvis_mid')?.state).toBe('missing')
    expect(byJoint.get('pelvis_mid')?.x).toBeNull()
    // Neighboring frames are untouched.
    const before = new Map(seq.frames[0].joints.map((j) => [j.joint, j]))
    expect(before.get('pelvis_mid')?.state).toBe('derived')
  })

  it('nonuniform timestamps and missing frames survive adaptation verbatim', () => {
    // Frame index 2 is absent (a dropped frame) and sampling is irregular.
    const seq = adaptToBenchmark(
      cocoInput([cocoFrame(0, 0), cocoFrame(1, 33), cocoFrame(3, 140), cocoFrame(4, 152)]),
    )
    expect(seq.frames.map((f) => f.index)).toEqual([0, 1, 3, 4])
    expect(seq.frames.map((f) => f.timestampMs)).toEqual([0, 33, 140, 152])
  })
})

describe('benchmark sequence schema', () => {
  it('round-trip serialization is deterministic (byte-for-byte)', () => {
    const seq = adaptToBenchmark(cocoInput([cocoFrame(0, 0), cocoFrame(1, 33)]))
    const first = serializeBenchmarkSequence(seq)
    const reparsed = parseBenchmarkSequence(JSON.parse(first))
    const second = serializeBenchmarkSequence(reparsed)
    expect(second).toBe(first)
  })

  it('serialization is independent of input key order', () => {
    const seq = adaptToBenchmark(cocoInput([cocoFrame(0, 0)]))
    const canonical = serializeBenchmarkSequence(seq)
    // Rebuild the object with keys inserted in a different order.
    const shuffled = JSON.parse(canonical) as Record<string, unknown>
    const reordered = {
      transformations: shuffled.transformations,
      labels: shuffled.labels,
      frames: shuffled.frames,
      skeleton: shuffled.skeleton,
      capture: shuffled.capture,
      source: shuffled.source,
      schemaVersion: shuffled.schemaVersion,
    }
    expect(serializeBenchmarkSequence(parseBenchmarkSequence(reordered))).toBe(canonical)
  })

  it('refuses unknown schema versions', () => {
    const seq = adaptToBenchmark(cocoInput([cocoFrame(0, 0)]))
    const raw = JSON.parse(serializeBenchmarkSequence(seq)) as Record<string, unknown>
    raw.schemaVersion = BENCHMARK_SEQUENCE_VERSION + 1
    expect(() => parseBenchmarkSequence(raw)).toThrow(/version/)
  })

  it('rejects non-increasing timestamps (no silent frame compression)', () => {
    const seq = adaptToBenchmark(cocoInput([cocoFrame(0, 0), cocoFrame(1, 33)]))
    const raw = JSON.parse(serializeBenchmarkSequence(seq)) as {
      frames: { timestampMs: number }[]
    }
    raw.frames[1].timestampMs = 0
    expect(() => parseBenchmarkSequence(raw)).toThrow(/strictly increase/)
  })

  it('rejects a frame missing a canonical joint (missingness must be explicit)', () => {
    const seq = adaptToBenchmark(cocoInput([cocoFrame(0, 0)]))
    const raw = JSON.parse(serializeBenchmarkSequence(seq)) as {
      frames: { joints: unknown[] }[]
    }
    raw.frames[0].joints.pop()
    expect(() => parseBenchmarkSequence(raw)).toThrow(/missing canonical joint/)
  })

  it('rejects coordinates on a missing joint (a null state cannot smuggle data)', () => {
    const seq = adaptToBenchmark(cocoInput([cocoFrame(0, 0)]))
    const raw = JSON.parse(serializeBenchmarkSequence(seq)) as {
      frames: { joints: { joint: string; state: string; x: number | null }[] }[]
    }
    const heel = raw.frames[0].joints.find((j) => j.joint === 'left_heel')
    if (!heel) throw new Error('fixture missing left_heel')
    heel.x = 0.5
    expect(() => parseBenchmarkSequence(raw)).toThrow(/must be null/)
  })

  it('expresses a sit-to-stand transition trial without squat phases or RepMetrics', () => {
    const input = kinectInput([kinectFrame(0, 0), kinectFrame(1, 40), kinectFrame(2, 90)])
    input.labels = {
      activity: 'sit-to-stand',
      events: [{ type: 'transition', label: 'sit-to-stand', startFrame: 0, endFrame: 2 }],
      provenance: { labeledBy: 'fixture-author', method: 'hand-authored' },
    }
    const seq = adaptToBenchmark(input)
    expect(seq.labels.activity).toBe('sit-to-stand')
    expect(seq.labels.events[0].type).toBe('transition')
    // The serialized artifact carries no squat vocabulary and no RepMetrics.
    const json = serializeBenchmarkSequence(seq)
    expect(json).not.toMatch(/DESCENDING|ASCENDING|BOTTOM|repNumber|RepMetrics/)
  })
})

describe('bridge into the replay layer', () => {
  function squatSequence(): BenchmarkSequence {
    return adaptToBenchmark(
      cocoInput([cocoFrame(0, 0), cocoFrame(1, 33), cocoFrame(2, 66)]),
    )
  }

  it('accepts a squat-labeled sequence with observed lower-limb joints', () => {
    const result = bridgeToCyclicSquat(squatSequence())
    expect(result.eligible).toBe(true)
    expect(result.reasons).toEqual([])
  })

  it('abstains on a sit-to-stand transition trial instead of fabricating squat phases', () => {
    const input = kinectInput([kinectFrame(0, 0), kinectFrame(1, 40)])
    input.labels = {
      activity: 'sit-to-stand',
      events: [{ type: 'transition', label: 'sit-to-stand', startFrame: 0, endFrame: 1 }],
      provenance: { labeledBy: 'fixture-author', method: 'hand-authored' },
    }
    const result = bridgeToCyclicSquat(adaptToBenchmark(input))
    expect(result.eligible).toBe(false)
    expect(result.reasons.join(' ')).toMatch(/not squat/)
    expect(result.reasons.join(' ')).toMatch(/transition/)
  })

  it('abstains when a required lower-limb joint is never observed', () => {
    const frames = [cocoFrame(0, 0), cocoFrame(1, 33)]
    for (const f of frames) f.joints.left_knee = null
    const result = bridgeToCyclicSquat(adaptToBenchmark(cocoInput(frames)))
    expect(result.eligible).toBe(false)
    expect(result.reasons.join(' ')).toMatch(/left_knee/)
  })
})
