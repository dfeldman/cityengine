/**
 * Photographs the trains (render/life.ts, the region's rolling stock): each métro train standing at a viaduct
 * station, and one of each other kind running, from the side.
 *   node --experimental-strip-types tools/train-shots.ts [--city=paris-centre] [--n=2]
 */
import { chromium } from 'playwright'
const arg = (n: string, f = ''): string => (process.argv.find((a) => a.startsWith(`--${n}=`)) ?? `=${f}`).split('=').slice(1).join('=')
const city = arg('city', 'paris-centre')
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 1400, height: 800 } })
page.on('pageerror', (e) => console.log('page error:', e.message.slice(0, 200)))
await page.goto(`http://localhost:5200/?city=${city}&freeze=1${arg('time') ? `&time=${arg('time')}` : ''}`)
await page.waitForFunction('window.gameReady === true && window.riderReady === true', null, { timeout: 180_000 })
await page.addStyleTag({ content: 'body > *:not(canvas):not(#app), #minimap { visibility: hidden !important }' })
// first to the métro viaduct (Line 6 by Dupleix), so its tiles and their rails come in
if (arg('at') || city.startsWith('paris')) {
  const [lat, lon] = (arg('at') || '48.85045,2.29378').split(',').map(Number)
  await page.evaluate(`window.__view([${lat + 0.0006}, ${lon + 0.0006}, 60], [${lat}, ${lon}, 5])`)
  await page.waitForTimeout(12000)
}
type T = { kind: number; x: number; z: number; heading: number; v: number; wait: number; stops: number }
const trains = async (): Promise<T[]> => await page.evaluate('window.__trains()') as T[]
const all = await trains()
console.log(all.length, 'trains;', all.filter((t) => t.stops > 0).length, 'on lines with stops')
const shoot = async (i: number, name: string): Promise<void> => {
  for (let k = 0; k < 5; k++) {
    const t = (await trains())[i]
    // ahead of it and a little to one side, looking back along the line (a viaduct runs down the middle of
    // its boulevard, so along it is the clear view)
    const fx = Math.sin(t.heading)
    const fz = Math.cos(t.heading)
    await page.evaluate(`window.__viewLocal([${t.x + fx * 45 + fz * 9}, 13, ${t.z + fz * 45 - fx * 9}], [${t.x - fx * 25}, 6, ${t.z - fz * 25}])`)
    await page.waitForTimeout(k === 0 ? 5000 : 600)
  }
  const t = (await trains())[i]
  console.log(name, `v=${t.v.toFixed(1)} wait=${t.wait.toFixed(0)}`)
  await page.screenshot({ path: `docs/shots/LP-train-${name}.png` })
}
// wait until a métro train is standing in a station
const n = Number(arg('n', '1'))
let done = 0
for (let tries = 0; tries < 60 && done < n; tries++) {
  const ts = await trains()
  const i = ts.findIndex((t) => t.kind === 1 && t.wait > 8)
  if (i >= 0) { await shoot(i, `metro-station-${done}`); done++ }
  else await page.waitForTimeout(2000)
}
for (const kind of [0, 2]) {
  const i = (await trains()).findIndex((t) => t.kind === kind)
  if (i >= 0) await shoot(i, ['rail', 'metro', 'tram'][kind])
}
await browser.close()
