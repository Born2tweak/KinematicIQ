import { expect, test, type Page } from '@playwright/test'

const CAMERA_PERMISSION_DENIED_COPY =
  'Camera permission denied. Click the camera icon in the address bar, allow access for this site, then press Try again.'

async function repCount(page: Page): Promise<number> {
  const value = await page.locator('.rep-counter__value').innerText()
  return Number.parseInt(value, 10) || 0
}

test.describe('camera fixtures', () => {
  test('clean-squat exits setup, counts reps, and reaches results', async ({
    page,
  }) => {
    await page.goto('/camera?source=pose-tape&fixture=clean-squat')

    await expect(page.getByTestId('fixture-camera-label')).toContainText(
      'Fixture camera: clean-squat',
    )
    await expect(page.locator('.rep-counter__label')).toBeVisible()

    await expect(
      page.getByText('Set in progress', { exact: true }),
    ).toBeVisible({ timeout: 30_000 })

    await expect
      .poll(() => repCount(page), {
        timeout: 30_000,
        message: 'expected fixture run to count at least one rep',
      })
      .toBeGreaterThanOrEqual(1)

    await page.getByRole('button', { name: 'Finish Now' }).click()
    await expect(page).toHaveURL(/\/results$/)
    await expect(page.getByRole('heading', { name: 'Your set' })).toBeVisible()
  })

  test('missing-feet keeps setup guidance and never auto-starts reps', async ({
    page,
  }) => {
    await page.goto('/camera?source=pose-tape&fixture=missing-feet')

    await expect(page.getByTestId('fixture-camera-label')).toContainText(
      'Fixture camera: missing-feet',
    )
    await expect(
      page.getByText(/feet are out of frame|tilt the camera down/i),
    ).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('Set in progress')).toHaveCount(0)

    await expect
      .poll(() => repCount(page), {
        timeout: 10_000,
        message: 'expected missing-feet fixture to stay at zero reps',
      })
      .toBe(0)
    await expect(page).toHaveURL(/\/camera\?source=pose-tape&fixture=missing-feet/)
  })

  test('camera permission denied path preserves user-facing recovery copy', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      if (!navigator.mediaDevices) {
        Object.defineProperty(navigator, 'mediaDevices', {
          configurable: true,
          value: {},
        })
      }
      const mediaDevices = navigator.mediaDevices as Record<string, unknown>

      Object.defineProperty(mediaDevices, 'getUserMedia', {
        configurable: true,
        value: async () => {
          const error = new Error('Permission denied by test override') as Error & {
            name: string
          }
          error.name = 'NotAllowedError'
          throw error
        },
      })
    })

    await page.goto('/camera')

    await expect(
      page.getByRole('heading', { name: 'Camera error' }),
    ).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText(CAMERA_PERMISSION_DENIED_COPY)).toBeVisible()

    await page.getByRole('button', { name: 'Try again' }).click()
    await expect(page.getByText(CAMERA_PERMISSION_DENIED_COPY)).toBeVisible()
  })
})
