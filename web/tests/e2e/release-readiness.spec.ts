import { expect, test } from '@playwright/test'

test.describe('release readiness', () => {
  test('320px reflow keeps the primary landing flow in bounds', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 })
    await page.goto('/')

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible()
    const layout = await page.evaluate(() => ({
      viewport: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))
    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.viewport)
  })

  test('landing copy does not imply clinical or laboratory validation', async ({ page }) => {
    await page.goto('/')
    const copy = (await page.locator('main').innerText()).toLowerCase()
    for (const prohibited of [
      'physical therapists',
      'patients',
      'motion lab',
      'validated reps',
    ]) {
      expect(copy).not.toContain(prohibited)
    }
    await page.getByRole('tab', { name: /Measure/ }).click()
    await expect(page.getByText('not laboratory measurements')).toBeVisible()
  })

  test('keyboard focus is visible on the first interactive control', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Tab')

    const focused = await page.evaluate(() => {
      const element = document.activeElement
      if (!(element instanceof HTMLElement)) return null
      const style = getComputedStyle(element)
      return {
        tag: element.tagName,
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
      }
    })
    expect(focused).not.toBeNull()
    expect(['A', 'BUTTON', 'INPUT']).toContain(focused?.tag)
    expect(focused?.outlineStyle).not.toBe('none')
    expect(Number.parseFloat(focused?.outlineWidth ?? '0')).toBeGreaterThan(0)
  })

  test('reduced-motion preference collapses animation durations', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')

    const maximumDurationMs = await page.evaluate(() => {
      const toMs = (value: string) =>
        value.split(',').reduce((maximum, token) => {
          const duration = token.trim()
          const milliseconds = duration.endsWith('ms')
            ? Number.parseFloat(duration)
            : Number.parseFloat(duration) * 1000
          return Math.max(maximum, Number.isFinite(milliseconds) ? milliseconds : 0)
        }, 0)
      return Array.from(document.querySelectorAll<HTMLElement>('*')).reduce(
        (maximum, element) => {
          const style = getComputedStyle(element)
          return Math.max(
            maximum,
            toMs(style.animationDuration),
            toMs(style.transitionDuration),
          )
        },
        0,
      )
    })
    expect(maximumDurationMs).toBeLessThanOrEqual(0.01)
  })
})
