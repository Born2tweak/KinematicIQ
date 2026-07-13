import { describe, expect, it } from 'vitest'
import { buildCleanSquatPoseTape } from '../camera/fixtures/cleanSquatPoseTape'
import { recoverBoundedShortGaps, runShortGapRecoveryExperiment } from './shortGapRecoveryExperiment'

describe('bounded short-gap recovery experiment', () => {
  it('interpolates only bounded gaps with valid endpoints without mutating raw frames', () => {
    const tape = buildCleanSquatPoseTape()
    const original = tape.frames[4].landmarks[23]
    tape.frames[4].landmarks[23] = { ...original, visibility: 0 }
    const result = recoverBoundedShortGaps(tape.frames)
    expect(result.recoveredLandmarks).toBe(1)
    expect(result.frames[4].landmarks[23].visibility).toBeGreaterThanOrEqual(0.5)
    expect(tape.frames[4].landmarks[23].visibility).toBe(0)
  })

  it('does not fill gaps longer than the declared two-frame bound', () => {
    const tape = buildCleanSquatPoseTape()
    for (const index of [4, 5, 6]) tape.frames[index].landmarks[23].visibility = 0
    expect(recoverBoundedShortGaps(tape.frames).recoveredLandmarks).toBe(0)
  })

  it('rejects an unevidenced candidate when the corpus offers no eligible gaps', () => {
    const tape = buildCleanSquatPoseTape()
    const report = runShortGapRecoveryExperiment([{ file: 'clean', sha256: 'abc', tape }])
    expect(report.decision).toBe('rejected')
    expect(report.failedGates).toContain('minimum-recovered-landmarks')
    expect(report.aggregate.repParityTapes).toBe(1)
  })
})
