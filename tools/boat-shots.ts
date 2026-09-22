/** Photographs the moving boats (render/river-traffic.ts), each from the quai side as it passes: node --experimental-strip-types tools/boat-shots.ts [0,3,5] */
import { chromium } from 'playwright'
const out = '/Users/dfeldman/streetrunner/docs/shots/'
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 1400, height: 800 } })
page.on('pageerror', (e) => console.log('page error:', e.message.slice(0, 200)))
await page.goto('http://localhost:5200/?city=paris-centre&freeze=1')
await page.waitForFunction('window.gameReady === true && window.riderReady === true', null, { timeout: 180_000 })
await page.addStyleTag({ content: 'body > *:not(canvas):not(#app) , #minimap { visibility: hidden !important }' })
await page.waitForTimeout(2000)
const boats = await page.evaluate('window.__boats()') as { kind: string; x: number; z: number; heading: number }[]
console.log(boats.map((b) => `${b.kind} ${b.x.toFixed(0)},${b.z.toFixed(0)}`).join('\n'))
const want = process.argv[2] ? process.argv[2].split(',').map(Number) : [0, 1, 2, 3, 5]
for (const i of want) {
  // follow it for a few seconds: aim at where it is, let the tiles come in, re-aim, shoot
  for (let k = 0; k < 6; k++) {
    const b = (await page.evaluate('window.__boats()') as typeof boats)[i]
    const side = b.heading + Math.PI * 0.62
    await page.evaluate(`window.__viewLocal([${b.x + Math.sin(side) * 60}, 5, ${b.z + Math.cos(side) * 60}], [${b.x}, 1, ${b.z}])`)
    await page.waitForTimeout(k === 0 ? 5000 : 700)
  }
  const b = (await page.evaluate('window.__boats()') as (typeof boats[0] & { drawn: boolean })[])[i]
  console.log(i, b.kind, 'drawn', b.drawn)
  await page.screenshot({ path: `${out}LP-boat-${i}-${b.kind}.png` })
}
await browser.close()
