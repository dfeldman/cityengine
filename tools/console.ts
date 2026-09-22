/** Load a ride and print every console message and page error — warnings included. */
import { chromium } from 'playwright'
const q = process.argv[2] ?? ''
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 1200, height: 700 } })
page.on('console', (m) => { if (m.type() !== 'debug') console.log(`[${m.type()}]`, m.text().slice(0, 300)) })
page.on('pageerror', (e) => console.log('[pageerror]', e.message))
await page.goto(`http://localhost:5200/?city=paris-marais&start=4106${q}`)
await page.waitForTimeout(25000)
const s = await page.evaluate(`({ rider: window.riderReady, crowd: window.crowdReady,
  meshes: window.__scene.meshes.filter((m) => /player|crowd/.test(m.name)).map((m) => m.name + (m.isEnabled() ? '' : ' (off)')).slice(0, 12) })`)
console.log(JSON.stringify(s, null, 1))
await browser.close()
