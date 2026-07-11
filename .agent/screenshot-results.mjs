// Dev-only screenshot capture of the new Results surfaces. Not committed.
import { chromium } from 'file:///C:/Users/acetu/AppData/Roaming/npm/node_modules/playwright/index.mjs'

const OUT = 'C:/Users/acetu/KinematicIQ/docs/review/screenshots'
import { mkdirSync } from 'node:fs'
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ channel: 'chrome' })
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })

page.on('console', (msg) => {
  if (msg.type() === 'error') console.log('[page error]', msg.text())
})

await page.goto('http://localhost:5173/dev-seed')
await page.waitForURL('**/results', { timeout: 20000 })
await page.waitForSelector('.session-replay', { timeout: 30000 })
await page.waitForTimeout(1500)

// 1. Full results page (top)
await page.screenshot({ path: `${OUT}/results-top.png` })

// 2. Replay section, mid-set frame with Demo Mode on
const replay = page.locator('.session-replay')
await replay.scrollIntoViewIfNeeded()
const scrub = page.locator('.session-replay__scrub')
const max = Number(await scrub.getAttribute('max'))
await scrub.fill(String(Math.floor(max * 0.45)))
await page.getByRole('button', { name: 'Demo Mode' }).click()
await page.waitForTimeout(500)
await replay.screenshot({ path: `${OUT}/replay-demo-mode.png` })

// 3. Replay with 3D scene open (linked views)
await page.getByRole('button', { name: '3D', exact: true }).click()
await page.waitForTimeout(2500)
await replay.screenshot({ path: `${OUT}/replay-3d-linked.png` })

// 4. Evidence-first verdict card expanded
const evidence = page.locator('.posture-chip__evidence-toggle').first()
if (await evidence.count()) {
  await evidence.scrollIntoViewIfNeeded()
  await evidence.click()
  await page.waitForTimeout(400)
  await page
    .locator('.report-hero')
    .screenshot({ path: `${OUT}/report-evidence-expanded.png` })
} else {
  console.log('No evidence toggle found (posture profile absent)')
}

// 5. Rep chart with active-rep highlight while scrubbed into a rep
await replay.scrollIntoViewIfNeeded()
await page
  .locator('.results-reps-card')
  .screenshot({ path: `${OUT}/rep-chart-linked.png` })

await browser.close()
console.log('Screenshots written to', OUT)
