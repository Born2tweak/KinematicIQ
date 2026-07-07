/**
 * CAM-A6 (optional smoke test) — verifies the REAL getUserMedia path on plain
 * /camera using Chromium's fake webcam device, fed from a local .y4m file.
 *
 * This does NOT replace the pose-tape fixture tests (camera-fixture.spec.ts):
 * those cover the analysis pipeline deterministically. This spec only proves
 * that the production camera-acquisition path does not land on the
 * permission-denied error when a (fake) camera device is present.
 *
 * The .y4m fixture is intentionally NOT committed (no real webcam footage in
 * the repo). Drop any short .y4m clip at tests/e2e/fixtures/fake-webcam.y4m
 * to enable this test; otherwise it skips cleanly.
 */
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test } from '@playwright/test'

// Playwright transpiles this spec as CommonJS (no "type": "module"), so
// __dirname is available while import.meta is not.
const FAKE_WEBCAM_Y4M = resolve(__dirname, 'fixtures', 'fake-webcam.y4m')
const fixtureExists = existsSync(FAKE_WEBCAM_Y4M)

const CAMERA_PERMISSION_DENIED_COPY =
  'Camera permission denied. Click the camera icon in the address bar, allow access for this site, then press Try again.'

test.use({
  launchOptions: {
    args: [
      '--use-fake-device-for-media-stream',
      '--use-fake-ui-for-media-stream',
      `--use-file-for-fake-video-capture=${FAKE_WEBCAM_Y4M}`,
    ],
  },
})

test.describe('camera fake webcam smoke (chromium)', () => {
  test('plain /camera does not hit permission denied under a fake webcam', async ({
    page,
    browserName,
  }) => {
    test.skip(
      browserName !== 'chromium',
      'Fake webcam flags are Chromium-only',
    )
    test.skip(
      !fixtureExists,
      `Fake webcam fixture missing: ${FAKE_WEBCAM_Y4M} — drop a .y4m clip there to enable this smoke test (never commit real webcam footage)`,
    )

    await page.goto('/camera')

    // The camera stage should render without the permission-denied error.
    // Model loading may still be in flight; only the acquisition path is
    // under test here, so assert the error copy never shows up.
    await expect(page.getByText(CAMERA_PERMISSION_DENIED_COPY)).toHaveCount(0)
    await expect(
      page.getByRole('heading', { name: 'Camera error' }),
    ).toHaveCount(0)

    // Give acquisition a moment to fail if it were going to, then re-assert.
    await page.waitForTimeout(3_000)
    await expect(page.getByText(CAMERA_PERMISSION_DENIED_COPY)).toHaveCount(0)
  })
})
