/**
 * Photographs the palms (src/palm-showcase.ts): the row from street distance, a close look up into a crown of
 * each species, and the far levels of detail.
 *   node --experimental-strip-types tools/palm-shots.ts [--out=docs/shots/palms]
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
const arg = (n: string, f = ''): string => (process.argv.find((a) => a.startsWith(`--${n}=`)) ?? `=${f}`).split('=').slice(1).join('=')
const out = arg('out', 'docs/shots/palms')
mkdirSync(out, { recursive: true })
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 1400, height: 800 } })
page.on('pageerror', (e) => console.log('page error:', e.message.slice(0, 300)))
const shots: [string, number, [number, number, number, number, number?, number?]][] = [
  ['row', 0, [Math.PI / 2, 1.32, 62, 8]],
  ['canary-close', 0, [Math.PI / 2 + 0.3, 1.4, 20, 8, -12, 0]],
  ['canary-under', 0, [Math.PI / 2 + 0.2, 1.9, 9, 10, -12, 0]],
  ['fan-close', 0, [Math.PI / 2 + 0.3, 1.45, 18, 17, -10, 9]],
  ['row-lod1', 1, [Math.PI / 2, 1.32, 62, 8]],
  ['row-lod2', 2, [Math.PI / 2, 1.32, 62, 8]],
]
let loaded = -1
for (const [name, lod, v] of shots) {
  if (loaded !== lod) {
    await page.goto(`http://localhost:5200/?palms=1&lod=${lod}`)
    await page.waitForFunction('window.palmsReady === true', null, { timeout: 60_000 })
    loaded = lod
  }
  await page.evaluate(`window.__palmView(${v.join(',')})`)
  await page.waitForTimeout(900)
  await page.screenshot({ path: `${out}/${name}.png` })
  console.log(name)
}
await browser.close()
