import { expect, test } from '@playwright/test'

test.describe('release readiness', () => {
  test('inline lunge is research information and cannot start analysis', async ({ page }) => {
    await page.goto('/')
    const research = page.getByRole('listitem').filter({ hasText: 'Inline lunge' })
    await expect(research).toContainText('Research only')
    await expect(research.getByRole('button')).toHaveCount(0)
    await expect(research.getByRole('link')).toHaveCount(0)
    await research.click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('button', { name: /Bodyweight squat/ })).toHaveCount(1)
  })

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

  test('keyboard traversal keeps visible focus through the primary landing controls', async ({ page }) => {
    await page.goto('/')
    const traversal: Array<{
      identity: string
      tag: string
      outlineStyle: string
      outlineWidth: string
    }> = []
    for (let index = 0; index < 30; index += 1) {
      await page.keyboard.press('Tab')
      const focused = await page.evaluate(() => {
        const element = document.activeElement
        if (!(element instanceof HTMLElement)) return null
        const style = getComputedStyle(element)
        return {
          identity: `${element.tagName}:${element.innerText || element.getAttribute('aria-label') || element.getAttribute('href') || ''}`,
          tag: element.tagName,
          outlineStyle: style.outlineStyle,
          outlineWidth: style.outlineWidth,
        }
      })
      expect(focused).not.toBeNull()
      if (!focused) continue
      // WebKit temporarily returns focus to the document body at the end of
      // its tab cycle before wrapping to the first interactive control.
      if (focused.tag === 'BODY') break
      if (traversal.some((item) => item.identity === focused.identity)) break
      traversal.push(focused)
    }

    // Browser focus conventions differ (notably Safari/WebKit), so validate
    // the entire cycle instead of assuming an arbitrary 12-control minimum.
    expect(traversal.length).toBeGreaterThanOrEqual(8)
    for (const focused of traversal) {
      expect(['A', 'BUTTON', 'INPUT']).toContain(focused.tag)
      expect(focused.outlineStyle).not.toBe('none')
      expect(Number.parseFloat(focused.outlineWidth)).toBeGreaterThan(0)
    }
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

  test('primary landing text meets rendered WCAG AA contrast', async ({ page }) => {
    await page.goto('/')

    const samples = await page.evaluate(() => {
      type Rgba = { r: number; g: number; b: number; a: number }
      const parse = (value: string): Rgba => {
        const parts = value.match(/[\d.]+/g)?.map(Number) ?? []
        return {
          r: parts[0] ?? 0,
          g: parts[1] ?? 0,
          b: parts[2] ?? 0,
          a: parts[3] ?? 1,
        }
      }
      const over = (foreground: Rgba, background: Rgba): Rgba => ({
        r: foreground.r * foreground.a + background.r * (1 - foreground.a),
        g: foreground.g * foreground.a + background.g * (1 - foreground.a),
        b: foreground.b * foreground.a + background.b * (1 - foreground.a),
        a: foreground.a + background.a * (1 - foreground.a),
      })
      const backgroundFor = (element: Element): Rgba => {
        const layers: Rgba[] = []
        let current: Element | null = element
        while (current) {
          layers.push(parse(getComputedStyle(current).backgroundColor))
          current = current.parentElement
        }
        return layers
          .reverse()
          .reduce(
            (background, foreground) => over(foreground, background),
            { r: 255, g: 255, b: 255, a: 1 },
          )
      }
      const luminance = ({ r, g, b }: Rgba) => {
        const channel = (value: number) => {
          const normalized = value / 255
          return normalized <= 0.04045
            ? normalized / 12.92
            : ((normalized + 0.055) / 1.055) ** 2.4
        }
        return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
      }
      const contrast = (first: Rgba, second: Rgba) => {
        const light = Math.max(luminance(first), luminance(second))
        const dark = Math.min(luminance(first), luminance(second))
        return (light + 0.05) / (dark + 0.05)
      }

      return [
        '.landing-hero__lead',
        '.landing-eyebrow',
        '.navbar__links a',
        '.landing-hero__actions .btn--primary',
        '.landing-hero__actions .btn--secondary',
      ].flatMap((selector) =>
        Array.from(document.querySelectorAll<HTMLElement>(selector)).map(
          (element) => {
            const style = getComputedStyle(element)
            const gradientStops =
              style.backgroundImage.match(/rgba?\([^)]+\)/g)?.map(parse) ?? []
            const backgrounds =
              gradientStops.length > 0
                ? gradientStops.map((stop) => ({ ...stop, a: 1 }))
                : [backgroundFor(element)]
            const fontSize = Number.parseFloat(style.fontSize)
            const fontWeight = Number.parseInt(style.fontWeight, 10) || 400
            const large = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700)
            return {
              selector,
              text: element.innerText.trim(),
              ratio: Math.min(
                ...backgrounds.map((background) =>
                  contrast(over(parse(style.color), background), background),
                ),
              ),
              required: large ? 3 : 4.5,
            }
          },
        ),
      )
    })

    expect(samples.length).toBeGreaterThan(0)
    for (const sample of samples) {
      expect(
        sample.ratio,
        `${sample.selector} (${sample.text}) contrast ${sample.ratio.toFixed(2)}:1`,
      ).toBeGreaterThanOrEqual(sample.required)
    }
  })
})
