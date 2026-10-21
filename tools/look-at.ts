/**
 * Freeze, then point the camera at the first thin instance of a named mesh and screenshot it — for
 * checking a model that is somewhere in the city but not in any spot's view.
 *   npx tsx tools/look-at.ts --city=san-francisco --mesh=trams --out=/path/shot.png
 *   node --experimental-strip-types tools/look-at.ts --city=paris-marais --start=35 --at=-360,-452 --out=…
 *     (--at looks at a world point instead of a mesh; the rider starts on the street nearest it, so its tiles stream)
 */
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
const arg = (n: string, f = ''): string => {
  const h = process.argv.slice(2).find((a) => a.startsWith(`--${n}=`))
  return h ? h.slice(n.length + 3) : f
}
const city = arg('city', 'san-francisco')
const at = arg('at') ? arg('at').split(',').map(Number) : null
/*
 * Where the rider starts. `?start=<edge>` only takes when that edge's tile is in the graph at load, so a point
 * away from the city's own start (Civic Center, 2026-10-21) silently fell back to Nob Hill: the tiles round the
 * point never streamed and every shot was an empty field. `?at=lat,lon` searches the whole city, so --at starts
 * there, converted through the baked index's origin.
 */
let place = arg('start') ? `&start=${arg('start')}&freeze=1` : ''
if (at) {
  const { origin } = JSON.parse(readFileSync(resolve(import.meta.dirname, '..', 'public', 'cities', city, 'v3', 'index.json'), 'utf8')) as { origin: { lat: number; lon: number } }
  const R = 6371000
  const k = (Math.PI / 180) * R
  place = `&at=${(origin.lat + at[1] / k).toFixed(7)},${(origin.lon + at[0] / (k * Math.cos((origin.lat * Math.PI) / 180))).toFixed(7)}&freeze=1`
}
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 1400, height: 800 } })
await page.goto(`${process.env.SHOTS_BASE ?? 'http://localhost:5200'}/?city=${city}${place}${arg('without') ? `&without=${arg('without')}` : ''}${arg('extra') ? `&${arg('extra')}` : ''}`)
await page.waitForFunction('window.riderReady === true', null, { timeout: 90_000 })
// the tiles round the rider, and the landmarks on them, arrive after the rider does
await page.waitForFunction('window.__cityIdle && window.__cityIdle()', null, { timeout: 90_000 }).catch(() => {})
await page.waitForTimeout(3000)
// the HUD, the pause banner and the delivery offer: the picture is of the city
await page.addStyleTag({ content: 'body * { visibility: hidden !important } canvas { visibility: visible !important }' })
await page.keyboard.press('KeyF')
await page.waitForTimeout(300)
// a world point is on the GROUND there, not at y = 0 (Civic Center's ground is −66 m in SF's frame: a camera
// "3.5 × dist up" from 0 stood under the terrain)
const found = at ? [at[0], await page.evaluate(`window.__heightAt(${at[0]}, ${at[1]})`) as number, at[1]] : await page.evaluate(`(() => {
  const sc = window.__scene
  const m = sc.meshes.find((x) => x.name === '${arg('mesh', 'trams')}')
  if (!m || !m.thinInstanceCount) return null
  const b = m._thinInstanceDataStorage.matrixData
  return [b[12], b[13], b[14]]
})()`)
if (!found) { console.log('no instance'); process.exit(0) }
const [x, y, z] = found as number[]
// --dist=8 stands the camera eight times further off, for something the size of a building
const k = Number(arg('dist', '1'))
// --bearing=23 stands the camera out along that compass bearing from the point (to face a facade that faces it)
const b = arg('bearing') ? (Number(arg('bearing')) * Math.PI) / 180 : null
const cx = b === null ? x + 9 * k : x + Math.sin(b) * 11.4 * k
const cz = b === null ? z + 7 * k : z + Math.cos(b) * 11.4 * k
const lift = Number(arg('lift', '1.5'))
// --height=60 puts the camera that many metres up (instead of 3.5 × dist), looking down at the point at
// --pitch degrees below the horizon: the way to see a landmark over the roofs round it
const height = arg('height') ? Number(arg('height')) : null
const pitch = arg('pitch') ? (Number(arg('pitch')) * Math.PI) / 180 : null
let px = cx, py = y + 3.5 * k, pz = cz
// --from=x,z,h stands the camera exactly there, h metres above the looked-at point's ground
let ty = y
if (arg('from')) {
  const [fx, fz, fh] = arg('from')!.split(',').map(Number)
  px = fx; pz = fz
  // h above the GROUND there, and the looked-at point on its ground too
  py = (await page.evaluate(`window.__heightAt(${fx}, ${fz})`) as number) + fh
  ty = await page.evaluate(`window.__heightAt(${x}, ${z})`) as number
}
if (height !== null && pitch !== null && b !== null) {
  const back = height / Math.tan(pitch)
  px = x + Math.sin(b) * back
  pz = z + Math.cos(b) * back
  py = y + height
}
await page.evaluate(`(() => {
  const sc = window.__scene
  const cam = sc.activeCamera
  window.__lookHold = () => { cam.position.set(${px}, ${py}, ${pz}); cam.setTarget(new cam.position.constructor(${x}, ${ty} + ${height !== null ? 8 : lift * k}, ${z})) }
  sc.onBeforeRenderObservable.add(window.__lookHold)
})()`)
await page.waitForTimeout(1500)
await page.screenshot({ path: arg('out') })
// --probe=x,y reports which building is drawn at that screen point (needs --extra=pick=1)
if (arg('probe')) {
  const [px2, py2] = arg('probe')!.split(',').map(Number)
  console.log('probe', JSON.stringify(await page.evaluate(`window.__pickBuilding(${px2}, ${py2})`)))
  // and whatever mesh at all is drawn there
  console.log('any', JSON.stringify(await page.evaluate(`(() => { const s = window.__scene; for (const m of s.meshes) m.isPickable = true; const h = s.pick(${px2}, ${py2}); return h && h.hit ? { mesh: h.pickedMesh.name, at: h.pickedPoint.asArray().map((v) => Math.round(v * 10) / 10) } : null })()`)))
}
console.log('instance at', found)
await browser.close()
