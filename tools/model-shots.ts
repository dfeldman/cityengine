/**
 * Photographs one procedural landmark on its own (src/model-showcase.ts) from named views, for comparing with
 * its reference photographs.
 *   node --experimental-strip-types tools/model-shots.ts --model=goldenGateBridge --views=bridge [--out=docs/shots/models]
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
const arg = (n: string, f = ''): string => (process.argv.find((a) => a.startsWith(`--${n}=`)) ?? `=${f}`).split('=').slice(1).join('=')
const model = arg('model')
const out = arg('out', 'docs/shots/models')
mkdirSync(out, { recursive: true })
type V = [string, number, number, number, number, number, number]
// alpha, beta, radius, target x, y, z
const SETS: Record<string, V[]> = {
  bridge: [
    // from Battery Spencer: above the north end, looking south along the bridge
    ['spencer', 1.25, 1.35, 900, 0, 90, 380],
    // from Battery East / Fort Point: low, south-east of the south tower
    ['battery-east', -1.0, 1.45, 1300, 0, 110, -300],
    ['tower-close', -0.6, 1.4, 260, 0, 120, -640],
    ['deck', -1.35, 1.52, 90, 0, 72, -560],
    ['broadside', 0.02, 1.5, 2600, 0, 120, 0],
  ],
  tower: [['front', -1.57, 1.3, 400, 0, 120, 0], ['three-quarter', -0.9, 1.3, 400, 0, 120, 0], ['up', -1.2, 1.85, 120, 0, 150, 0]],
  baybridge: [
    // from Coit Tower: high, off the bridge's west side, looking across it
    ['coit', -1.1, 1.38, 2600, 0, 60, 0],
    ['tower-close', -0.25, 1.45, 330, 0, 90, -383],
    ['broadside', 0.0, 1.5, 3200, 0, 80, 0],
  ],
  tall: [['front', -1.57, 1.35, 520, 0, 160, 0], ['street', -1.2, 1.75, 180, 0, 160, 0]],
  small: [['front', -1.57, 1.45, 120, 0, 32, 0], ['three-quarter', -0.9, 1.35, 110, 0, 32, 0], ['top', -1.3, 1.25, 40, 0, 56, 0]],
  long: [['city-front', -1.57, 1.45, 260, 0, 25, 0], ['back', 1.57, 1.45, 260, 0, 25, 0], ['three-quarter', -0.9, 1.35, 240, 0, 25, 0], ['tower', -1.4, 1.4, 90, 0, 45, -20]],
  mast: [['far', -1.57, 1.45, 900, 0, 150, 0], ['side', -1.05, 1.45, 700, 0, 150, 0], ['crossarm', -1.3, 1.3, 180, 0, 200, 0]],
}
const views = SETS[arg('views', 'tower')] ?? SETS.tower
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 1400, height: 800 } })
page.on('pageerror', (e) => console.log('page error:', e.message.slice(0, 300)))
await page.goto(`http://localhost:5200/?model=${model}${arg('size') ? `&size=${arg('size')}` : ''}`)
await page.waitForFunction('window.modelReady === true', null, { timeout: 60_000 })
console.log(model, await page.evaluate('window.__modelTris'), 'triangles')
for (const [name, ...v] of views) {
  await page.evaluate(`window.__modelView(${v.join(',')})`)
  await page.waitForTimeout(700)
  await page.screenshot({ path: `${out}/${model}-${name}.png` })
  console.log(' ', name)
}
await browser.close()
