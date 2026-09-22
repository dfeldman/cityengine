/**
 * Photographs one procedural landmark on its own (src/model-showcase.ts) from named views, for comparing with
 * its reference photographs.
 *   node --experimental-strip-types tools/model-shots.ts --model=goldenGateBridge --views=bridge [--out=docs/shots/models]
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
const arg = (n: string, f = ''): string => (process.argv.find((a) => a.startsWith(`--${n}=`)) ?? `=${f}`).split('=').slice(1).join('=')
let model = arg('model')
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
  sign: [['front', -1.57, 1.5, 14, 0, 4.5, 0], ['three-quarter', -1.0, 1.45, 16, 0, 4.5, 0]],
  vehicle: [['side', 0.1, 1.45, 14, 0, 1.5, 0], ['front-three-quarter', 0.9, 1.35, 12, 0, 1.5, 1], ['high', 0.6, 0.95, 16, 0, 1, 0]],
  mast: [['far', -1.57, 1.45, 900, 0, 150, 0], ['side', -1.05, 1.45, 700, 0, 150, 0], ['crossarm', -1.3, 1.3, 180, 0, 200, 0]],
}
let views = SETS[arg('views', 'tower')] ?? SETS.tower
/**
 * `--entry="Phelan Building"` (with `--city=`, default san-francisco): the manifest entry's model, built to its own
 * footprint (from the Overpass cache — the entry's first osm id) and height, photographed from views framed on
 * its bounds: `front` (from the south), `corner`, `street` (a rider's eye across the street), `top`.
 */
const entryName = arg('entry')
let fitFor: { hx: number; hz: number; height: number; ring: { x: number; z: number }[] } | null = null
if (entryName) {
  const { readManifestFile } = await import('../src/city/manifest.ts')
  const { readdirSync, readFileSync, existsSync } = await import('node:fs')
  const { resolve } = await import('node:path')
  const city = arg('city', 'san-francisco')
  const mf = [city, city.split('-')[0]].map((n) => resolve(import.meta.dirname, '..', 'public', 'landmarks', `${n}.json`)).find((f) => existsSync(f))!
  const e = (await readManifestFile<{ name: string; osm?: string | string[]; procedural?: string; height?: number }>(mf)).find((x) => x.name === entryName)
  if (!e?.procedural) throw new Error(`no procedural entry "${entryName}"`)
  model = e.procedural
  const ids = (Array.isArray(e.osm) ? e.osm : e.osm ? [e.osm] : [])
  type G = { lat: number; lon: number }
  type El = { type: string; id: number; geometry?: G[]; members?: { role: string; geometry?: G[] }[] }
  let geom: G[] | null = null
  const cache = resolve(import.meta.dirname, 'cache')
  for (const f of readdirSync(cache)) {
    if (!f.startsWith('overpass-') || geom) continue
    let d: { elements?: El[] }
    try { d = JSON.parse(readFileSync(resolve(cache, f), 'utf8')) } catch { continue }
    const want = ids[0]
    const el = d.elements?.find((x) => `${x.type}/${x.id}` === want)
    if (!el) continue
    if (el.geometry) geom = el.geometry
    else {
      // a multipolygon: its largest outer way
      const outers = (el.members ?? []).filter((m) => m.role === 'outer' && m.geometry && m.geometry.length > 3).map((m) => m.geometry!)
      outers.sort((a, b) => b.length - a.length)
      geom = outers[0] ?? null
    }
  }
  if (!geom) throw new Error(`footprint of ${ids[0]} not in the Overpass cache`)
  const lat0 = geom.reduce((a, g) => a + g.lat, 0) / geom.length
  const lon0 = geom.reduce((a, g) => a + g.lon, 0) / geom.length
  const kx = 111320 * Math.cos((lat0 * Math.PI) / 180)
  let ring = geom.map((g) => ({ x: (g.lon - lon0) * kx, z: (g.lat - lat0) * 110540 }))
  if (Math.hypot(ring[0].x - ring[ring.length - 1].x, ring[0].z - ring[ring.length - 1].z) < 0.3) ring = ring.slice(0, -1)
  const xs = ring.map((p) => p.x)
  const zs = ring.map((p) => p.z)
  fitFor = { hx: (Math.max(...xs) - Math.min(...xs)) / 2, hz: (Math.max(...zs) - Math.min(...zs)) / 2, height: e.height ?? 30, ring }
}
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 1400, height: 800 } })
page.on('pageerror', (e) => console.log('page error:', e.message.slice(0, 300)))
await page.goto(`http://localhost:5200/?model=${model}${arg('size') ? `&size=${arg('size')}` : ''}`)
await page.waitForFunction('window.modelReady === true', null, { timeout: 60_000 })
if (fitFor) {
  const b = await page.evaluate(`window.__rebuild(${JSON.stringify(fitFor)})`) as { min: number[]; max: number[]; triangles: number }
  const H = b.max[1]
  const R = Math.max(b.max[0] - b.min[0], b.max[2] - b.min[2], H)
  const cy = H * 0.45
  views = [['front', -Math.PI / 2, 1.42, R * 1.9, 0, cy, 0], ['corner', -Math.PI / 4, 1.3, R * 1.8, 0, cy, 0],
    // (from across the street: the target on the south face, the camera 28 m out from it, looking up)
    ['street', -Math.PI / 2 - 0.35, 1.72, 28, 0, Math.min(14, H * 0.35), b.min[2]], ['top', 0.6, 0.8, R * 1.8, 0, cy, 0]]
}
console.log(model, await page.evaluate('window.__modelTris'), 'triangles')
for (const [name, ...v] of views) {
  await page.evaluate(`window.__modelView(${v.join(',')})`)
  await page.waitForTimeout(700)
  await page.screenshot({ path: `${out}/${model}-${name}.png` })
  console.log(' ', name)
}
await browser.close()
