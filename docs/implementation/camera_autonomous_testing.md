# Camera Autonomous Testing

## Why webcam-only testing is insufficient

`/camera` is stateful and timing-sensitive (setup guidance, auto-start, rep counting, auto-finish, and results navigation). Relying only on a physical webcam makes regressions hard to catch because:

- CI runners and many developer machines do not have a stable camera setup.
- Live camera framing, lighting, and user motion are non-deterministic.
- Permission prompts and browser device behavior vary across environments.

To keep production behavior intact while making tests reliable, camera input is now source-injected behind a `CameraSource` contract.

## Source selection model

Selection policy lives in `web/src/camera/cameraSourceSelection.ts` and is the only place that reads query params plus environment:

- Default source is always `real-camera`.
- Fixture sources are allowed only when either:
  - `import.meta.env.DEV` is true, or
  - `VITE_ENABLE_CAMERA_FIXTURES === 'true'`.
- Unknown/disallowed fixture requests fall back to `real-camera`.
- Production behavior therefore remains webcam-first unless fixtures are explicitly enabled for controlled test runs.

Factory wiring is in `web/src/camera/cameraSourceFactory.ts`, and `CameraScreen` consumes a source instance rather than directly owning media acquisition/detection.

## Fixture URLs

Use these routes in dev/test:

- `http://localhost:4173/camera?source=pose-tape&fixture=clean-squat`
- `http://localhost:4173/camera?source=pose-tape&fixture=missing-feet`

When fixture mode is active, the HUD shows a visible label:

- `Fixture camera: clean-squat`
- `Fixture camera: missing-feet`

## Running tests

From `web/`:

1. `npm test` (unit/integration including camera source selection and pose-tape loop simulation)
2. `npm run test:e2e:camera` (fixture e2e coverage for `/camera`)

Optional full e2e suite:

- `npm run test:e2e`

Playwright config is in `web/playwright.config.ts` and keeps traces/screenshots/videos on failure.

## Optional fake-webcam smoke test

`web/tests/e2e/camera-fake-webcam.chromium.spec.ts` validates the real `getUserMedia` route with:

- `--use-fake-device-for-media-stream`
- `--use-fake-ui-for-media-stream`
- `--use-file-for-fake-video-capture=<path-to-y4m>`

It loads plain `/camera` and asserts the permission-denied error copy never appears. It looks for a local clip at `web/tests/e2e/fixtures/fake-webcam.y4m` and skips gracefully when the file is absent. It runs as part of `npm run test:e2e` but is not included in `npm run test:e2e:camera`. This is intentionally optional because it requires a local `.y4m` fixture file (never committed) and browser-specific flags; pose-tape e2e tests provide deterministic baseline coverage without any physical camera.

## Privacy guardrails

- Do not commit personal webcam recordings.
- Fixture pose tapes are synthetic/test-only inputs.
- Live capture remains browser-local and follows existing user-facing permission/error handling.
- Autonomous tests should prefer deterministic fixtures over recording real user footage.
