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
type FitFor = { hx: number; hz: number; height: number; ring: { x: number; z: number }[] }

/**
 * Resolve one manifest entry to its builder and the footprint to build it on. Exported so a batch tool can
 * keep ONE browser for hundreds of models instead of launching one per building — the launch, not the
 * rendering, is what made a contact sheet of the whole city take hours.
 */
/*
 * `spin` is the rotation the CITY applies to this model (render/landmarks.ts): rotateDeg, or front+180 where
 * the entry gives a bearing. A camera must turn by -spin to see the face the street sees. Without it the shot
 * tools photographed the unrotated model, so any builder whose front is turned by its manifest entry — the
 * Assemblee nationale's portico, the Ecole Militaire's — was photographed from BEHIND and came back as a
 * featureless dark slab, on the very contact sheet meant to catch exactly that kind of fault.
 */
export async function fitForEntry(entryName: string, cityArg = 'san-francisco', frontArg = ''): Promise<{ model: string; fit: FitFor; spin: number }> {
  let model = ''
  let fitFor: FitFor | null = null
  let spin = 0
  const arg = (n: string, f = ''): string => (n === 'city' ? cityArg : n === 'front' ? (frontArg || f) : f)
  {
  const { readManifestFile } = await import('../src/city/manifest.ts')
  const { readdirSync, readFileSync, existsSync } = await import('node:fs')
  const { resolve } = await import('node:path')
  const city = arg('city', 'san-francisco')
  const mf = [city, city.split('-')[0]].map((n) => resolve(import.meta.dirname, '..', 'public', 'landmarks', `${n}.json`)).find((f) => existsSync(f))!
  const e = (await readManifestFile<{ name: string; osm?: string | string[]; procedural?: string; height?: number; size?: [number, number]; lat?: number; lon?: number; rotateDeg?: number; front?: number | string }>(mf)).find((x) => x.name === entryName)
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
  /*
   * A STANDALONE entry has no OSM building to stand on — a statue, a sign, a fountain, the courtyard of a
   * complex that is mapped as six separate ways. Those carry a `size` instead, so photograph them on a
   * rectangle of that size rather than refusing.
   */
  if (!geom && e.size && e.lat !== undefined && e.lon !== undefined) {
    const [w, d2] = e.size
    const hw = w / 2 / (111320 * Math.cos((e.lat * Math.PI) / 180))
    const hd = d2 / 2 / 110540
    geom = [{ lat: e.lat - hd, lon: e.lon - hw }, { lat: e.lat - hd, lon: e.lon + hw },
      { lat: e.lat + hd, lon: e.lon + hw }, { lat: e.lat + hd, lon: e.lon - hw }]
  }
  if (!geom) throw new Error(ids.length === 0
    ? `"${e.name}" has no osm id and no size+lat+lon — a standalone entry needs all three`
    : `footprint of ${ids[0]} not in the Overpass cache`)
  const lat0 = geom.reduce((a, g) => a + g.lat, 0) / geom.length
  const lon0 = geom.reduce((a, g) => a + g.lon, 0) / geom.length
  const kx = 111320 * Math.cos((lat0 * Math.PI) / 180)
  let ring = geom.map((g) => ({ x: (g.lon - lon0) * kx, z: (g.lat - lat0) * 110540 }))
  if (Math.hypot(ring[0].x - ring[ring.length - 1].x, ring[0].z - ring[ring.length - 1].z) < 0.3) ring = ring.slice(0, -1)
  /*
   * Turned into the model's own frame, as the city turns it (render/landmarks.ts fitAt). The FRONT FACES +z:
   * `edgeFacing(ring, 0)` is the street front, which is what the `front` and `street` cameras look at and what
   * every district builder uses. (This comment and the one in render/landmarks.ts both said −z until
   * 2026-09-22, when an agent checked it empirically — with bearing 0 a porch appears in the front shot and
   * with 180 it does not. The convention was right in the code and wrong in both comments.) The
   * tool used to pass the footprint north-up, so a builder that dresses its front dressed whichever side happened
   * to face north and the shots showed detail on the wrong side (reported by two batches, 2026-09-22).
   *
   * The front is the longest edge's outward side, which is what `front: "street"` comes to for a building that
   * fronts a street; `--front=<bearing>` says otherwise.
   */
  let bearing = Number(arg('front', 'NaN'))
  if (!Number.isFinite(bearing)) {
    let longest = 0
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i]
      const b = ring[(i + 1) % ring.length]
      const L = Math.hypot(b.x - a.x, b.z - a.z)
      if (L > longest) { longest = L; bearing = (Math.atan2((b.z - a.z) / L, -(b.x - a.x) / L) * 180) / Math.PI }
    }
  }
  const rot = (bearing * Math.PI) / 180 + Math.PI
  const cosr = Math.cos(rot)
  const sinr = Math.sin(rot)
  const cx0 = ring.reduce((t, p) => t + p.x, 0) / ring.length
  const cz0 = ring.reduce((t, p) => t + p.z, 0) / ring.length
  ring = ring.map((p) => ({ x: (p.x - cx0) * cosr - (p.z - cz0) * sinr, z: (p.x - cx0) * sinr + (p.z - cz0) * cosr }))
  const xs = ring.map((p) => p.x)
  const zs = ring.map((p) => p.z)
  const mx = (Math.max(...xs) + Math.min(...xs)) / 2
  const mz = (Math.max(...zs) + Math.min(...zs)) / 2
  ring = ring.map((p) => ({ x: p.x - mx, z: p.z - mz }))
  fitFor = { hx: (Math.max(...xs) - Math.min(...xs)) / 2, hz: (Math.max(...zs) - Math.min(...zs)) / 2, height: e.height ?? 30, ring }
  // the same rotation render/landmarks.ts gives a standalone entry, so the cameras below can undo it
  spin = e.rotateDeg !== undefined ? (e.rotateDeg * Math.PI) / 180
    : typeof e.front === 'number' ? ((e.front + 180) * Math.PI) / 180 : 0
  }
  return { model, fit: fitFor!, spin }
}

/*
 * Everything below is the command-line tool. It is guarded because `fitForEntry` above is imported by
 * tools/model-sheet.ts, and without the guard that import launched a browser and ran a whole photo session as
 * a side effect of loading the module.
 */
if (process.argv[1]?.endsWith('model-shots.ts')) {
  const entryName = arg('entry')
  let fitFor: FitFor | null = null
  // the city's own rotation for this entry, undone by the cameras so 'front' really is the front (see fitForEntry)
  let spin = 0
  if (entryName) {
    const got = await fitForEntry(entryName, arg('city', 'san-francisco'), arg('front'))
    model = got.model
    fitFor = got.fit
    spin = got.spin
  }
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] })
  const page = await browser.newPage({ viewport: { width: 1400, height: 800 } })
  page.on('pageerror', (e) => console.log('page error:', e.message.slice(0, 300)))
  await page.goto(`http://localhost:5200/?model=${model}${arg('size') ? `&size=${arg('size')}` : ''}${arg('time') ? `&time=${arg('time')}` : ''}`)
  await page.waitForFunction('window.modelReady === true', null, { timeout: 60_000 })
  // --views=auto: framed on the model's own bounds, whatever it is (furniture, a vehicle, a landmark at --size)
  // --fit=hx,hz,height: a footprint by hand, for a builder whose shape depends on it (a pier: long and narrow)
  const byHand = arg('fit') ? arg('fit').split(',').map(Number) : null
  if (byHand) fitFor = { hx: byHand[0], hz: byHand[1], height: byHand[2] ?? 12, ring: [] as { x: number; z: number }[] }
  if (fitFor || arg('views') === 'auto') {
    const s0 = Number(arg('size', '200'))
    const fitNow = fitFor && fitFor.ring.length === 0 ? { hx: fitFor.hx, hz: fitFor.hz, height: fitFor.height } : fitFor
    const b = await page.evaluate(`window.__rebuild(${JSON.stringify(fitNow ?? { hx: s0 / 2, hz: s0 / 2, height: s0 })})`) as { min: number[]; max: number[]; triangles: number }
    const H = b.max[1]
    const R = Math.max(b.max[0] - b.min[0], b.max[2] - b.min[2], H)
    const cy = H * 0.45
    views = [['front', Math.PI / 2 - spin, 1.42, R * 1.9, 0, cy, 0], ['corner', Math.PI / 2 - 0.9 - spin, 1.3, R * 1.8, 0, cy, 0],
      // (from across the street: the target on the south face, the camera 28 m out from it, looking up)
      ['street', Math.PI / 2 + 0.35 - spin, 1.72, 28, 0, Math.min(14, H * 0.35), b.max[2]], ['top', 0.6 - spin, 0.8, R * 1.8, 0, cy, 0]]
  }
  console.log(model, await page.evaluate('window.__modelTris'), 'triangles')
  for (const [name, ...v] of views) {
    await page.evaluate(`window.__modelView(${v.join(',')})`)
    await page.waitForTimeout(700)
    await page.screenshot({ path: `${out}/${model}-${name}${arg('time') ? `-${arg('time')}` : ''}.png` })
    console.log(' ', name)
  }
  await browser.close()

}
