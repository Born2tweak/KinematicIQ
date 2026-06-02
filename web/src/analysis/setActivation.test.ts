import { describe, expect, it } from 'vitest'
import {
  activateAnalysisPipeline,
  createFreshAnalysisPipeline,
  inferSquatPhaseAtActivation,
} from './setActivation'
import { makeAngles, makeFrame } from '../test/squatFixtures'

describe('setActivation', () => {
  it('infers BOTTOM when knee is very bent at activation', () => {
    expect(inferSquatPhaseAtActivation(95, 0.55, 0.4)).toBe('BOTTOM')
  })

  it('infers DESCENDING for mid-descent knee angle', () => {
    expect(inferSquatPhaseAtActivation(130, 0.46, 0.4)).toBe('DESCENDING')
  })

  it('seeds rep counter with active rep on mid-descent activation', () => {
    const frame = makeFrame(0, 0)
    const angles = makeAngles(125)
    const { repCounter, initialPhase } = activateAnalysisPipeline({
      frame,
      angles,
      hipY: 0.5,
      calibratedHipY: 0.4,
      trackingKneeAngle: 125,
      standingKneeAngle: 168,
    })
    expect(initialPhase).toBe('DESCENDING')
    expect(repCounter.activeRep).not.toBeNull()
    expect(repCounter.previousPhase).toBe('DESCENDING')
  })

  it('fresh pipeline starts empty at STANDING', () => {
    const { phaseDetector, repCounter } = createFreshAnalysisPipeline()
    expect(phaseDetector.phase).toBe('STANDING')
    expect(repCounter.activeRep).toBeNull()
    expect(repCounter.repCount).toBe(0)
  })
})
