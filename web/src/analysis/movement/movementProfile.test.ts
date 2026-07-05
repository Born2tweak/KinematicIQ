import { describe, expect, it } from 'vitest'
import { SQUAT_AUTO_FINISH_CONFIG } from '../autoFinish'
import { SQUAT_AUTO_START_CONFIG } from '../autoStart'
import { SQUAT_PHASE_CONFIG, createPhaseDetectorState } from '../phaseDetector'
import { SQUAT_REP_GATES, createRepCounterState } from '../repCounter'
import { SQUAT_ACTIVATION_CONFIG } from '../setActivation'
import { SQUAT_SCORING_CONFIG } from '../../scoring/scoringConfig'
import { computeComponentScores } from '../../scoring/scoringEngine'
import type { SetMetricsSummary } from '../../session/types'
import { getActiveProfile, getMovementProfile } from './registry'

const SAMPLE_METRICS: SetMetricsSummary = {
  repCount: 4,
  reps: [  ],
  avgDepth: 102,
  avgTrunkLean: 38,
  depthCV: 7,
  minDepth: 95,
  maxDepth: 112,
  avgHipShift: 0.03,
  avgKneeAsymmetry: 9,
  avgShoulderAsymmetry: 0.01,
  overallConfidence: 82,
  excludedRepNumbers: [],
}

describe('movement registry', () => {
  it('resolves squat as the active cyclic profile', () => {
    const profile = getActiveProfile()
    expect(profile.id).toBe('squat')
    expect(profile.kind).toBe('cyclic')
    expect(getMovementProfile('squat')).toBe(profile)
  })

  it('throws for unregistered movements', () => {
    expect(() => getMovementProfile('sprint')).toThrow(/not registered/)
  })
})

describe('squat profile is behavior-preserving', () => {
  it('bundles the exact module defaults (no threshold drift)', () => {
    const profile = getActiveProfile()
    expect(profile.phase).toBe(SQUAT_PHASE_CONFIG)
    expect(profile.repGates).toBe(SQUAT_REP_GATES)
    expect(profile.autoStart).toBe(SQUAT_AUTO_START_CONFIG)
    expect(profile.autoFinish).toBe(SQUAT_AUTO_FINISH_CONFIG)
    expect(profile.activation).toBe(SQUAT_ACTIVATION_CONFIG)
    expect(profile.scoring).toBe(SQUAT_SCORING_CONFIG)
  })

  it('scores components identically through the profile and through the defaults', () => {
    const viaDefaults = computeComponentScores(SAMPLE_METRICS)
    const viaProfile = computeComponentScores(SAMPLE_METRICS, getActiveProfile().scoring)
    expect(viaProfile).toEqual(viaDefaults)
  })

  it('seeds identical FSM state through the profile and the defaults', () => {
    const profile = getActiveProfile()
    expect(createPhaseDetectorState(profile.phase)).toEqual(
      createPhaseDetectorState(),
    )
    expect(createRepCounterState(profile.repGates)).toEqual(
      createRepCounterState(),
    )
  })
})
