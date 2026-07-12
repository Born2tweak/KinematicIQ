import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

async function expectNoWcagViolations(page: Page, route: string) {
  await page.goto(route)
  await expect(page.locator('main')).toBeVisible()

  const results = await new AxeBuilder({ page })
    .withTags(WCAG_TAGS)
    .analyze()

  expect(
    results.violations,
    results.violations
      .map(
        (violation) =>
          `${violation.id} (${violation.impact ?? 'unknown'}): ${violation.help}\n` +
          violation.nodes.map((node) => `  ${node.target.join(' ')}`).join('\n'),
      )
      .join('\n\n'),
  ).toEqual([])
}

test.describe('automated WCAG checks', () => {
  test('landing route has no detectable WCAG A/AA violations', async ({ page }) => {
    await expectNoWcagViolations(page, '/')
  })

  test('upload route has no detectable WCAG A/AA violations', async ({ page }) => {
    await expectNoWcagViolations(page, '/upload')
  })

  test('history route has no detectable WCAG A/AA violations', async ({ page }) => {
    await expectNoWcagViolations(page, '/history')
  })

  test('camera setup has no detectable WCAG A/AA violations', async ({ page }) => {
    await expectNoWcagViolations(
      page,
      '/camera?source=pose-tape&fixture=missing-feet',
    )
  })
})
