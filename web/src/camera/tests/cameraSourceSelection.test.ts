import { describe, expect, it } from 'vitest'
import {
  cameraFixturesEnabled,
  selectCameraSource,
  type CameraSourceSelectionEnv,
} from '../cameraSourceSelection'

const DEV: CameraSourceSelectionEnv = { isDev: true, enableCameraFixtures: undefined }
const PROD: CameraSourceSelectionEnv = { isDev: false, enableCameraFixtures: undefined }
const PROD_FLAGGED: CameraSourceSelectionEnv = {
  isDev: false,
  enableCameraFixtures: 'true',
}

describe('cameraFixturesEnabled', () => {
  it('is enabled in dev builds', () => {
    expect(cameraFixturesEnabled(DEV)).toBe(true)
  })

  it('is disabled in production builds by default', () => {
    expect(cameraFixturesEnabled(PROD)).toBe(false)
  })

  it('is enabled in production only with the exact string "true"', () => {
    expect(cameraFixturesEnabled(PROD_FLAGGED)).toBe(true)
    expect(
      cameraFixturesEnabled({ isDev: false, enableCameraFixtures: 'TRUE' }),
    ).toBe(false)
    expect(
      cameraFixturesEnabled({ isDev: false, enableCameraFixtures: '1' }),
    ).toBe(false)
    expect(
      cameraFixturesEnabled({ isDev: false, enableCameraFixtures: 'false' }),
    ).toBe(false)
  })
})

describe('selectCameraSource', () => {
  it('defaults to real-camera with no query params', () => {
    expect(selectCameraSource('', DEV)).toEqual({
      kind: 'real-camera',
      fixture: null,
      reason: 'default',
    })
    expect(selectCameraSource('', PROD)).toEqual({
      kind: 'real-camera',
      fixture: null,
      reason: 'default',
    })
  })

  it('defaults to real-camera for unrelated query params', () => {
    expect(selectCameraSource('?utm_source=x&foo=bar', DEV).kind).toBe(
      'real-camera',
    )
  })

  it('accepts an explicit real-camera request everywhere', () => {
    expect(selectCameraSource('?source=real-camera', PROD)).toEqual({
      kind: 'real-camera',
      fixture: null,
      reason: 'default',
    })
  })

  it('selects pose-tape with a known fixture in dev', () => {
    expect(
      selectCameraSource('?source=pose-tape&fixture=clean-squat', DEV),
    ).toEqual({
      kind: 'pose-tape',
      fixture: 'clean-squat',
      reason: 'fixture-requested',
    })
    expect(
      selectCameraSource('?source=pose-tape&fixture=missing-feet', DEV).fixture,
    ).toBe('missing-feet')
  })

  it('falls back to real-camera when fixtures are requested in production', () => {
    expect(
      selectCameraSource('?source=pose-tape&fixture=clean-squat', PROD),
    ).toEqual({
      kind: 'real-camera',
      fixture: null,
      reason: 'fixtures-disabled',
    })
  })

  it('allows pose-tape in production when VITE_ENABLE_CAMERA_FIXTURES=true', () => {
    expect(
      selectCameraSource('?source=pose-tape&fixture=clean-squat', PROD_FLAGGED),
    ).toEqual({
      kind: 'pose-tape',
      fixture: 'clean-squat',
      reason: 'fixture-requested',
    })
  })

  it('falls back to real-camera for an unknown source kind', () => {
    expect(selectCameraSource('?source=matrix', DEV)).toEqual({
      kind: 'real-camera',
      fixture: null,
      reason: 'unknown-source',
    })
  })

  it('falls back to real-camera for a missing or unknown fixture id', () => {
    expect(selectCameraSource('?source=pose-tape', DEV).reason).toBe(
      'unknown-fixture',
    )
    expect(
      selectCameraSource('?source=pose-tape&fixture=nope', DEV),
    ).toEqual({
      kind: 'real-camera',
      fixture: null,
      reason: 'unknown-fixture',
    })
  })

  it('falls back to real-camera for fixture-video until it is implemented', () => {
    expect(
      selectCameraSource('?source=fixture-video&fixture=clean-squat', DEV),
    ).toEqual({
      kind: 'real-camera',
      fixture: null,
      reason: 'source-unavailable',
    })
  })

  it('checks the production gate before fixture validity', () => {
    // In production without the flag, even a malformed fixture request must
    // report the gate, not leak fixture parsing details.
    expect(selectCameraSource('?source=pose-tape&fixture=nope', PROD).reason).toBe(
      'fixtures-disabled',
    )
  })
})
