import { describe, expect, it } from 'vitest'

import {
  ProtocolPackageError,
  type ProtocolPackage,
  assertClaimsPermitted,
  deriveReleaseState,
  isSelectable,
  releaseDetail,
  releaseLabel,
  validateProtocolPackage,
} from './package'

const pkg = (overrides: Partial<ProtocolPackage> = {}): ProtocolPackage => ({
  packageVersion: 1,
  identity: { id: 'squat', label: 'Bodyweight squat', kind: 'cyclic', version: '1.0.0' },
  lifecycle: { engineering: 'complete', validation: 'validated', blockedBy: [] },
  phases: ['descent', 'bottom', 'ascent'],
  requiredLandmarks: [23, 25, 27],
  metrics: ['squat.knee.bottom-angle'],
  allowedClaims: [],
  ...overrides,
})

describe('release state derivation', () => {
  it('requires complete engineering before anything is selectable', () => {
    for (const engineering of ['absent', 'partial'] as const) {
      const candidate = pkg({
        lifecycle: { engineering, validation: 'validated', blockedBy: [] },
      })
      expect(deriveReleaseState(candidate.lifecycle)).toBe('unavailable')
      expect(isSelectable(candidate)).toBe(false)
    }
  })

  it('reaches experimental on engineering alone, never released', () => {
    // The whole point: working software is usable without implying validation.
    for (const validation of ['unvalidated', 'blocked', 'in-progress'] as const) {
      const candidate = pkg({
        lifecycle: {
          engineering: 'complete',
          validation,
          blockedBy: validation === 'blocked' ? ['RES-CORPUS'] : [],
        },
      })
      expect(deriveReleaseState(candidate.lifecycle)).toBe('experimental')
      expect(isSelectable(candidate)).toBe(true)
    }
  })

  it('reaches released only with validation evidence', () => {
    expect(deriveReleaseState(pkg().lifecycle)).toBe('released')
  })

  it('cannot be promoted to released by blocked validation', () => {
    const blocked = pkg({
      lifecycle: { engineering: 'complete', validation: 'blocked', blockedBy: ['RES-CORPUS'] },
    })
    expect(deriveReleaseState(blocked.lifecycle)).not.toBe('released')
  })
})

describe('user-facing labels', () => {
  it('names the blocking resource instead of implying an oversight', () => {
    const lunge = pkg({
      identity: { id: 'forwardLungeStrideReturn', label: 'Forward lunge', kind: 'cyclic', version: '0.1.0' },
      lifecycle: { engineering: 'complete', validation: 'blocked', blockedBy: ['RES-CORPUS'] },
    })
    expect(releaseLabel(lunge)).toBe(
      'Experimental — results have not yet been benchmarked',
    )
    // The resource id is developer vocabulary and must not reach the athlete.
    expect(releaseLabel(lunge)).not.toContain('RES-CORPUS')
    expect(releaseDetail(lunge)).toContain('RES-CORPUS')
  })

  it('labels an unvalidated package experimental without blockers', () => {
    const candidate = pkg({
      lifecycle: { engineering: 'complete', validation: 'unvalidated', blockedBy: [] },
    })
    expect(releaseLabel(candidate)).toBe('Experimental — results have not yet been benchmarked')
  })

  it('labels unavailable and released packages plainly', () => {
    expect(
      releaseLabel(pkg({ lifecycle: { engineering: 'partial', validation: 'unvalidated', blockedBy: [] } })),
    ).toBe('In development — not yet available')
    expect(releaseLabel(pkg())).toBe('Benchmarked')
  })
})

describe('claim gating', () => {
  it('refuses accuracy language on an experimental package', () => {
    const candidate = pkg({
      lifecycle: { engineering: 'complete', validation: 'blocked', blockedBy: ['RES-CORPUS'] },
      allowedClaims: ['Provides accurate knee angles'],
    })
    expect(() => assertClaimsPermitted(candidate)).toThrow(/implies accuracy/)
  })

  it.each(['validated depth', 'clinical screening', 'diagnostic result', 'reliable output', 'proven method'])(
    'refuses "%s" before release',
    (claim) => {
      const candidate = pkg({
        lifecycle: { engineering: 'complete', validation: 'unvalidated', blockedBy: [] },
        allowedClaims: [claim],
      })
      expect(() => assertClaimsPermitted(candidate)).toThrow(ProtocolPackageError)
    },
  )

  it('permits descriptive claims on an experimental package', () => {
    // Saying what it computes is fine; saying how right it is is not.
    const candidate = pkg({
      lifecycle: { engineering: 'complete', validation: 'unvalidated', blockedBy: [] },
      allowedClaims: ['Reports the smallest knee angle observed in each repetition'],
    })
    expect(() => assertClaimsPermitted(candidate)).not.toThrow()
  })

  it('permits accuracy language once released', () => {
    expect(() =>
      assertClaimsPermitted(pkg({ allowedClaims: ['Validated against reference kinematics'] })),
    ).not.toThrow()
  })
})

describe('package validation', () => {
  it('accepts a well-formed package', () => {
    expect(validateProtocolPackage(pkg())).toBeTruthy()
  })

  it('refuses an unsupported package version', () => {
    expect(() => validateProtocolPackage(pkg({ packageVersion: 2 as never }))).toThrow(
      /Unsupported protocol package version/,
    )
  })

  it('refuses a missing label or non-semantic version', () => {
    expect(() =>
      validateProtocolPackage(pkg({ identity: { id: 'squat', label: '  ', kind: 'cyclic', version: '1.0.0' } })),
    ).toThrow(/user-facing label/)
    expect(() =>
      validateProtocolPackage(pkg({ identity: { id: 'squat', label: 'Squat', kind: 'cyclic', version: 'v1' } })),
    ).toThrow(/must be semantic/)
  })

  it('refuses empty or duplicated phases', () => {
    expect(() => validateProtocolPackage(pkg({ phases: [] }))).toThrow(/at least one phase/)
    expect(() => validateProtocolPackage(pkg({ phases: ['a', 'a'] }))).toThrow(/unique/)
  })

  it('refuses missing or malformed required landmarks', () => {
    expect(() => validateProtocolPackage(pkg({ requiredLandmarks: [] }))).toThrow(
      /at least one required landmark/,
    )
    expect(() => validateProtocolPackage(pkg({ requiredLandmarks: [-1] }))).toThrow(
      /non-negative integers/,
    )
  })

  it('requires blocked validation to name its blockers', () => {
    expect(() =>
      validateProtocolPackage(
        pkg({ lifecycle: { engineering: 'complete', validation: 'blocked', blockedBy: [] } }),
      ),
    ).toThrow(/must name the blocking resources/)
  })

  it('refuses blockers on a non-blocked package', () => {
    expect(() =>
      validateProtocolPackage(
        pkg({ lifecycle: { engineering: 'complete', validation: 'validated', blockedBy: ['RES-CORPUS'] } }),
      ),
    ).toThrow(/only blocked validation/)
  })

  it('refuses a complete implementation that emits nothing measurable', () => {
    expect(() => validateProtocolPackage(pkg({ metrics: [] }))).toThrow(
      /at least one metric/,
    )
  })

  it('rejects a package whose claims outrun its release state', () => {
    expect(() =>
      validateProtocolPackage(
        pkg({
          lifecycle: { engineering: 'complete', validation: 'unvalidated', blockedBy: [] },
          allowedClaims: ['Clinically accurate'],
        }),
      ),
    ).toThrow(/implies accuracy/)
  })
})
