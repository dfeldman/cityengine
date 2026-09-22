/**
 * Views of a placed landmark computed from where the model actually stands (its fitted centre, half-sizes and
 * turn, from `window.__placed`): FRONT (on the model's −z axis), each SIDE, BACK, a three-quarter view and one
 * from above — written into views/<city>.json as "<name> — model front" etc., replacing earlier ones.
 *   node --experimental-strip-types tools/model-views.ts --city=paris-centre --name="Notre-Dame" [--dist=40 --h=1.8]
 */
import { chromium } from 'playwright'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Projection } from '../src/city/geo.ts'
const arg = (n: string, f = ''): string => {
  const h = process.argv.slice(2).find((a) => a.startsWith(`--${n}=`))
  return h ? h.slice(n.length + 3) : f
}
const city = arg('city', 'paris-centre')
const name = arg('name')
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 1400, height: 800 } })
await page.goto(`http://localhost:${arg('port', '5200')}/?city=${city}&freeze=1&without=life`)
await page.waitForFunction('window.gameReady === true && window.riderReady === true', null, { timeout: 180_000 })
const origin = await page.evaluate('window.__pkg.origin') as { lat: number; lon: number }
// the landmark may be in a tile not yet in: look at it first
const entry = (JSON.parse(readFileSync(resolve(import.meta.dirname, '..', 'public', 'landmarks', `${city.split('-')[0]}.json`), 'utf8')) as { name: string; lat?: number; lon?: number }[]).find((e) => e.name === name)
if (entry?.lat !== undefined) {
  await page.evaluate(`window.__view([${entry.lat}, ${entry.lon}, 200], [${entry.lat}, ${entry.lon}, 0])`)
  await page.waitForTimeout(3000)
}
const l = await page.evaluate(`window.__placed().find((q) => q.name === ${JSON.stringify(name)})`) as { x: number; z: number; hx: number; hz: number; rotation: number; height: number } | undefined
// every building ring near the landmark, to keep the cameras out of them
const rings = await page.evaluate(`(() => {
  const out = []
  for (const t of window.__tiles.values()) for (const b of t.buildings) {
    if ((b.minHeight ?? 0) > 3) continue
    const r = b.ring
    if (Math.hypot(r[0] - ${l?.x ?? 0}, r[1] - ${l?.z ?? 0}) < 400) out.push(r)
  }
  return out
})()`) as number[][]
await browser.close()
const inside = (x: number, z: number): boolean => rings.some((r) => {
  let o = false
  for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
    if ((r[i + 1] > z) !== (r[j + 1] > z) && x < ((r[j] - r[i]) * (z - r[i + 1])) / (r[j + 1] - r[i + 1]) + r[i]) o = !o
  }
  return o
})
if (!l) { console.log('not placed:', name); process.exit(1) }
const proj = new Projection(origin)
// the model's axes in the world: local −z (its front) and local +x
const fwd = { x: -Math.sin(l.rotation), z: -Math.cos(l.rotation) }
const right = { x: Math.cos(l.rotation), z: -Math.sin(l.rotation) }
const d = Number(arg('dist', String(Math.max(30, l.hz * 0.9))))
const eye = Number(arg('h', '1.8'))
const tgt = Math.min(l.height * 0.35, 30)
const ll = (x: number, z: number, h: number): [number, number, number] => {
  const g = proj.toLatLon({ x, z })
  return [Math.round(g.lat * 1e6) / 1e6, Math.round(g.lon * 1e6) / 1e6, h]
}
/** a camera `dist` out along (a, b) in the model's frame — moved in, then out, until it stands clear */
const at = (a: number, b: number, dist: number, h: number): [number, number, number] => {
  const n = Math.hypot(a, b) || 1
  const dx = (fwd.x * a + right.x * b) / n
  const dz = (fwd.z * a + right.z * b) / n
  for (const k of [1, 0.9, 0.8, 0.7, 1.15, 1.3, 1.5, 0.6, 1.75, 2]) {
    const x = l.x + dx * dist * k
    const z = l.z + dz * dist * k
    // clear of buildings for 4 m round, so the near plane does not cut into a wall
    if (![[0, 0], [4, 0], [-4, 0], [0, 4], [0, -4]].some(([ox, oz]) => inside(x + ox, z + oz))) return ll(x, z, h)
  }
  return ll(l.x + dx * dist, l.z + dz * dist, h)
}
const to = ll(l.x, l.z, tgt)
const made = [
  { name: `${name} — model front`, from: at(1, 0, l.hz + d, eye), to: ll(l.x + fwd.x * l.hz, l.z + fwd.z * l.hz, tgt) },
  { name: `${name} — model three-quarter`, from: at(0.75, 0.65, l.hz + d * 1.4, eye + 2), to },
  { name: `${name} — model side`, from: at(0.1, 1, l.hx + d * 1.6, eye + 2), to },
  { name: `${name} — model back`, from: at(-1, 0.3, l.hz + d * 1.2, eye + 2), to },
  { name: `${name} — model above`, from: at(0.8, 0.6, l.hz + d * 2.2, l.height * 1.3), to },
]
const file = resolve(import.meta.dirname, '..', 'views', `${city}.json`)
const views = (JSON.parse(readFileSync(file, 'utf8')) as { name: string }[]).filter((v) => !made.some((m) => m.name === v.name))
views.push(...made.map((m) => ({ ...m, group: 'landmark' })))
writeFileSync(file, `${JSON.stringify(views, null, 1).replace(/\[\n\s+([-\d.]+),\n\s+([-\d.]+),\n\s+([-\d.]+)\n\s+\]/g, '[$1, $2, $3]')}\n`)
console.log(`${made.length} views for ${name} → views/${city}.json`)
