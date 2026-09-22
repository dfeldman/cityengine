/**
 * Load a city and print every console warning and error, for chasing a fault the user sees in their own
 * browser (a shader that will not compile, say) that no screenshot shows.
 *
 *   node --experimental-strip-types tools/console-check.ts paris-marais [high]
 */
import { chromium, webkit } from 'playwright'

const BASE = process.env.SHOTS_BASE ?? 'http://localhost:5200'
const city = process.argv[2] ?? 'paris-marais'
const q = process.argv[3]
// HEADFUL=1 opens a real window on the real GPU — some shader faults only show there; CHANNEL=chrome uses
// the installed Google Chrome rather than Playwright's Chromium
const browser = await (process.env.WEBKIT ? webkit : chromium).launch({
  headless: !process.env.HEADFUL,
  ...(process.env.CHANNEL ? { channel: process.env.CHANNEL } : {}),
  args: process.env.HEADFUL || process.env.WEBKIT ? [] : ['--use-gl=angle', '--use-angle=metal', '--enable-unsafe-webgpu', '--ignore-gpu-blocklist'],
})
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
const seen = new Set<string>()
page.on('console', (m) => {
  if (m.type() !== 'error' && m.type() !== 'warning') return
  const t = m.text().slice(0, 1500)
  if (seen.has(t)) return
  seen.add(t)
  console.log(`[${m.type()}] ${t}\n`)
})
page.on('pageerror', (e) => console.log(`[threw] ${e.message}\n${e.stack ?? ''}\n`))
// Vite answers a missing file with index.html and a 200, so a missing shader or JSON shows up as HTML
page.on('response', async (r) => {
  const type = r.headers()['content-type'] ?? ''
  const url = r.url()
  if (type.includes('text/html') && !url.endsWith('/') && !url.includes('?city=')) console.log(`[html for] ${url}\n`)
  if (r.status() >= 400) console.log(`[${r.status()}] ${url}\n`)
})
await page.goto(`${BASE}/?city=${city}${q ? `&q=${q}` : ''}`)
await page.waitForFunction(() => (window as unknown as { gameReady?: boolean }).gameReady, null, { timeout: 90_000 }).catch(() => console.log('[never became ready]'))
await page.waitForTimeout(Number(process.env.WAIT ?? 12) * 1000)
console.log(`${city}${q ? ` q=${q}` : ''}: ${seen.size} distinct warnings/errors`)
await browser.close()
