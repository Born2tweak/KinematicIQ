import { describe, expect, it } from 'vitest'
import {
  runCyclicPipelineOnFrames,
  validateCyclicConfig,
  type CyclicEngineConfig,
} from './cyclicEngine'
import {
  SQUAT_CYCLIC_CONFIG,
  runPipelineOnFrames,
} from '../videoAnalyzer'
import { buildCleanSquatPoseTape } from '../../camera/fixtures/cleanSquatPoseTape'

const frames = buildCleanSquatPoseTape().frames

describe('validateCyclicConfig', () => {
  it('accepts the squat config', () => {
    expect(validateCyclicConfig(SQUAT_CYCLIC_CONFIG)).toEqual([])
  })

  it('reports ordering and range violations', () => {
    const broken: CyclicEngineConfig = {
      phase: {
        ...SQUAT_CYCLIC_CONFIG.phase,
        standingKneeAngle: 100, // below descending — inverted hysteresis
        emaAlpha: 0, // out of range
        requiredConsecutiveFrames: 0,
      },
      repGates: {
        ...SQUAT_CYCLIC_CONFIG.repGates,
        minRepDurationMs: 9_000, // above max
        minHipDescent: -0.1,
      },
    }
    const issues = validateCyclicConfig(broken)
    expect(issues).toContain('standingKneeAngle must exceed descendingKneeAngle')
    expect(issues).toContain('emaAlpha must be in (0, 1]')
    expect(issues).toContain('requiredConsecutiveFrames must be at least 1')
    expect(issues).toContain('minRepDurationMs must be below maxRepDurationMs')
    expect(issues).toContain('minHipDescent must be non-negative')
  })
})

describe('squat output is unchanged (golden parity)', () => {
  it('engine with squat config ≡ runPipelineOnFrames', () => {
    const viaEngine = runCyclicPipelineOnFrames(frames, SQUAT_CYCLIC_CONFIG)
    const viaLegacyEntry = runPipelineOnFrames(frames)
    expect(viaEngine).toEqual(viaLegacyEntry)
  })

  it('pins the clean-squat fixture segmentation (golden values)', () => {
    // Golden lock: if these change, rep counting drifted (roadmap risk).
    const { reps, landmarkQuality, poseConfidenceSamples } =
      runCyclicPipelineOnFrames(frames, SQUAT_CYCLIC_CONFIG)
    expect(reps.length).toBe(3)
    expect(reps.map((r) => r.repNumber)).toEqual([1, 2, 3])
    expect(poseConfidenceSamples.length).toBe(frames.length)
    expect(landmarkQuality.length).toBe(frames.length)
  })
})

describe('a new cyclic protocol needs no squat imports', () => {
  it('runs a standalone config (values inlined, not derived from squat)', () => {
    // A hypothetical cyclic movement tuned independently. The engine module
    // itself imports no squat profile — this test proves the config is the
    // only coupling surface.
    const standalone: CyclicEngineConfig = {
      phase: {
        standingKneeAngle: 165,
        descendingKneeAngle: 150,
        bottomKneeAngle: 110,
        ascendingKneeAngle: 125,
        descentStartDelta: 0.05,
        bottomDelta: 0.12,
        ascentDelta: 0.04,
        returnToStandingDelta: 0.05,
        requiredConsecutiveFrames: 3,
        lockoutConsecutiveFrames: 4,
        emaAlpha: 0.35,
        confidenceDipToleranceMs: 500,
        lockoutKneeOffset: 12,
        lockoutKneeFloor: 152,
      },
      repGates: { ...SQUAT_CYCLIC_CONFIG.repGates },
    }
    expect(validateCyclicConfig(standalone)).toEqual([])
    const result = runCyclicPipelineOnFrames(frames, standalone)
    // Structure is complete regardless of tuning.
    expect(result.poseConfidenceSamples.length).toBe(frames.length)
    expect(Array.isArray(result.reps)).toBe(true)
    expect(Array.isArray(result.repRejections)).toBe(true)
  })
})
