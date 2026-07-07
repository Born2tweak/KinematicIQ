/**
 * Camera source selection policy (CAM-A1) — the ONLY place that turns route
 * query params + build environment into a camera source decision.
 *
 * Rules:
 * - Default is always `real-camera`. No query param can change that in a
 *   production build unless `VITE_ENABLE_CAMERA_FIXTURES === 'true'`.
 * - `pose-tape` (and, later, `fixture-video`) are dev/test-only substitutes.
 * - Any unknown, incomplete, or disallowed request falls back to
 *   `real-camera` — never to a fixture.
 */
import type { CameraSourceKind } from './cameraSource'

export type CameraFixtureId = 'clean-squat' | 'missing-feet'

export const CAMERA_FIXTURE_IDS: readonly CameraFixtureId[] = [
  'clean-squat',
  'missing-feet',
]

/** Why the selection landed where it did — for tests, logs, and debugging. */
export type CameraSourceSelectionReason =
  | 'default'
  | 'fixture-requested'
  | 'fixtures-disabled'
  | 'unknown-source'
  | 'unknown-fixture'
  | 'source-unavailable'

export interface CameraSourceSelection {
  kind: CameraSourceKind
  fixture: CameraFixtureId | null
  reason: CameraSourceSelectionReason
}

export interface CameraSourceSelectionEnv {
  /** `import.meta.env.DEV` — true for `vite dev`, false for production builds. */
  isDev: boolean
  /** `import.meta.env.VITE_ENABLE_CAMERA_FIXTURES` — opt-in for test builds. */
  enableCameraFixtures: string | undefined
}

export function defaultSelectionEnv(): CameraSourceSelectionEnv {
  return {
    isDev: import.meta.env.DEV,
    enableCameraFixtures: import.meta.env.VITE_ENABLE_CAMERA_FIXTURES as
      | string
      | undefined,
  }
}

/** Fixture sources are allowed only in dev or explicitly flagged test builds. */
export function cameraFixturesEnabled(env: CameraSourceSelectionEnv): boolean {
  return env.isDev || env.enableCameraFixtures === 'true'
}

const REAL_CAMERA: CameraSourceSelection = {
  kind: 'real-camera',
  fixture: null,
  reason: 'default',
}

function isKnownFixture(value: string | null): value is CameraFixtureId {
  return value !== null && (CAMERA_FIXTURE_IDS as readonly string[]).includes(value)
}

/**
 * Decide the camera source from a location search string (e.g.
 * `?source=pose-tape&fixture=clean-squat`). Pure; env is injected for tests.
 */
export function selectCameraSource(
  search: string,
  env: CameraSourceSelectionEnv,
): CameraSourceSelection {
  let params: URLSearchParams
  try {
    params = new URLSearchParams(search)
  } catch {
    return REAL_CAMERA
  }

  const requestedSource = params.get('source')
  if (requestedSource === null || requestedSource === 'real-camera') {
    return REAL_CAMERA
  }

  if (requestedSource !== 'pose-tape' && requestedSource !== 'fixture-video') {
    return { ...REAL_CAMERA, reason: 'unknown-source' }
  }

  if (!cameraFixturesEnabled(env)) {
    return { ...REAL_CAMERA, reason: 'fixtures-disabled' }
  }

  // fixture-video is part of the source contract but has no implementation
  // yet (CAM-A3 ships pose-tape only) — fall back rather than half-work.
  if (requestedSource === 'fixture-video') {
    return { ...REAL_CAMERA, reason: 'source-unavailable' }
  }

  const fixture = params.get('fixture')
  if (!isKnownFixture(fixture)) {
    return { ...REAL_CAMERA, reason: 'unknown-fixture' }
  }

  return { kind: 'pose-tape', fixture, reason: 'fixture-requested' }
}
