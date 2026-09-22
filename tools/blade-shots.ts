/**
 * The first hanging sign the city built (render/signs.ts `probe`), photographed square-on from each face, to check
 * both read the right way round (BUGS.md #50).
 *   node --experimental-strip-types tools/blade-shots.ts [--city=san-francisco]
 */
import { chromium } from 'playwright'
const city = (process.argv.find((a) => a.startsWith('--city='))?.slice(7)) ?? 'san-francisco'
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 900, height: 700 } })
await page.goto(`http://localhost:5200/?city=${city}&freeze=1&without=life,trees`)
await page.waitForFunction('window.gameReady === true && window.riderReady === true', null, { timeout: 180_000 })
await page.waitForFunction('window.__signs.probe.x !== undefined', null, { timeout: 60_000 })
const p = await page.evaluate('window.__signs.probe') as { x: number; y: number; z: number; ax: number; az: number }
const g = await page.evaluate(`window.__heightAt(${p.x}, ${p.z})`) as number
for (const [name, s] of [['front', 1], ['back', -1]] as const) {
  await page.evaluate(`window.__viewLocal([${p.x + p.ax * 4 * s}, ${p.y - g}, ${p.z + p.az * 4 * s}], [${p.x}, ${p.y - g}, ${p.z}])`)
  await page.waitForTimeout(1500)
  await page.screenshot({ path: `docs/shots/B50-${name}.png` })
  console.log(name)
}
await browser.close()
