/**
 * Photographs one procedural landmark on its own (src/model-showcase.ts) from named views, for comparing with
 * its reference photographs.
 *   node --experimental-strip-types tools/model-shots.ts --model=goldenGateBridge --views=bridge [--out=docs/shots/models]
 */
import { chromium } from 'playwright'

/* The dev server to drive; SHOTS_BASE lets a worktree agent point at its own port. */
const BASE = process.env.SHOTS_BASE ?? 'http://localhost:5200'
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
    // rider-height, on the east span's deck near a tower (BUGS.md #154): the near view that shows whether
    // the deck's own subdivision actually broke up the depth-fighting up close
    ['deck-near-tower', -0.4, 1.52, 40, 0, 74, -383],
  ],
  tall: [['front', -1.57, 1.35, 520, 0, 160, 0], ['street', -1.2, 1.75, 180, 0, 160, 0]],
  small: [['front', -1.57, 1.45, 120, 0, 32, 0], ['three-quarter', -0.9, 1.35, 110, 0, 32, 0], ['top', -1.3, 1.25, 40, 0, 56, 0]],
  long: [['city-front', -1.57, 1.45, 260, 0, 25, 0], ['back', 1.57, 1.45, 260, 0, 25, 0], ['three-quarter', -0.9, 1.35, 240, 0, 25, 0], ['tower', -1.4, 1.4, 90, 0, 45, -20]],
  // a 30 m round tower: the elevation of the long-lens photograph, three-quarter from the plaza, and from under the eaves
  pagoda: [['elevation', -1.57, 1.5, 85, 0, 15, 0], ['plaza', -0.9, 1.4, 55, 0, 13, 0], ['under', -1.2, 1.92, 22, 0, 12, 0]],
  // the de Young (owner's satellite view, 2026-10-27): straight down to compare with it, from the concourse (+z, the
  // south-east front and its hedges), from the north over the tower, and low by the canopy
  deyoung: [['top', -1.57, 0.02, 230, 0, 0, 0], ['concourse', 1.15, 1.2, 190, 0, 8, 10], ['tower', -2.2, 1.2, 150, -50, 25, 0], ['canopy', 0.5, 1.45, 70, 55, 6, 10]],
  // the Millwright's Cottage (millwright.ts): front −z, as the photographs from the windmill see it
  cottage: [['front', -1.9, 1.4, 26, 0, 3, 0], ['end', -0.4, 1.35, 24, 0, 3, 0]],
  // the Garfield monument (garfield.ts): its front is local −z, so alpha −π/2 looks at it head-on
  garfield: [['front', -1.57, 1.45, 16, 0, 4.5, 0], ['three-quarter', -2.2, 1.4, 16, 0, 4.5, 0], ['mourner', -1.57, 1.5, 6, 0, 2.2, -1.5]],
  // the LOVE Blocks and the jacks (misfit-toys.ts): from the south-west, where the owner's photographs were taken
  toys: [['sw', -2.2, 1.35, 22, 0, 1, 0], ['low', -2.0, 1.5, 12, 0, 1, 0]],
  // a fire alarm box (us-furniture.ts): its front is +z, so alpha +π/2 looks at it head-on
  callbox: [['front', 1.57, 1.5, 3, 0, 1.1, 0], ['three-quarter', 0.9, 1.35, 3.4, 0, 1.1, 0], ['close', 1.2, 1.3, 1.5, 0, 1.3, 0]],
  // Pomodoro's sphere (de-young-garden.ts): at the rift (its bearing 150, so alpha −1.05) and from the side
  sphere: [['rift', -1.05, 1.45, 4.2, 0, 1.75, 0], ['side', 0.3, 1.35, 4.5, 0, 1.6, 0], ['close', -1.05, 1.1, 1.8, 0, 1.75, 0]],
  gems: [['three-quarter', 0.4, 1.2, 22, 0, 2, 0], ['portal', 0.35, 1.45, 12, 0, 1.5, 0], ['top', 0.4, 0.15, 20, 0, 3, 0], ['inside', 0.4, 2.3, 2.4, 0, 3.4, 0]],
  sign: [['front', -1.57, 1.5, 14, 0, 4.5, 0], ['three-quarter', -1.0, 1.45, 16, 0, 4.5, 0]],
  vehicle: [['side', 0.1, 1.45, 14, 0, 1.5, 0], ['front-three-quarter', 0.9, 1.35, 12, 0, 1.5, 1], ['high', 0.6, 0.95, 16, 0, 1, 0]],
  /*
   * RIDER'S EYE, for between-levels work. A stair, a ramp, a terraced bowl or a raised walkway is the one
   * kind of thing the auto views cannot show: they frame the model's bounding box from outside it, and from
   * up there a flat plane and a terraced park look the same. These four stand a rider ON the model, close,
   * with the camera barely above the horizontal, and they target the model's own ORIGIN — which is where a
   * builder of a piece of landscape puts the thing the landscape is about.
   */
  rider: [
    ['bowl', -2.36, 1.50, 32, 0, 5, 0],
    ['wall', 0.79, 1.50, 46, 0, 6, 0],
    ['walk', 0.79, 1.30, 78, 0, 8, 0],
    ['along', 0.79, 1.46, 130, 0, 6, 0],
  ],
  mast: [['far', -1.57, 1.45, 900, 0, 150, 0], ['side', -1.05, 1.45, 700, 0, 150, 0], ['crossarm', -1.3, 1.3, 180, 0, 200, 0],
    // rider-height, close to a leg's foot (BUGS.md #154 extended to Sutro Tower, 2026-09-24): the near view
    // that shows whether the leg/frame subdivision actually broke up the long thin quads up close
    ['base-close', 0.4, 1.48, 22, 0, 10, 0]],
  /*
   * A STAIRWAY run (BUGS.md #213a): long, narrow and steep, so the useful views are DOWN THE AXIS from the
   * head — which is the shot that decides whether the hedges step — plus one rider-height view of a single
   * flight and one broadside that shows the green staircase against the stone one.
   */
  // NOTE the targets are tuned to `lyonStreetSteps`' own bounds (a 145 m run dropping 31 m northward).
  // Another stairway needs its own numbers, or `--views=auto`: on a shorter run these all look at the sky.
  steps: [
    // down the axis from the head, which is the view the stairway exists for
    ['axis-down', 1.5708, 1.287, 125, 0, 10, -30],
    ['axis-head', 1.5708, 1.270, 61, 0, 14, 10],
    // looking UP one flight from its foot: the framing of the reference photographs
    ['flight-up', -1.5708, 1.51, 25, 0, 20, 40],
    ['terrace', 1.1, 1.30, 30, 0, 17, 0],
    // broadside, where a hedge that steps and one that ramps are told apart at a glance
    ['broadside', 0.02, 1.42, 140, 0, 17, 0],
  ],
  /*
   * A SPORTS COURT (BUGS.md #214): flat, so the view that matters is the PLAN — it is the only one that
   * shows whether the markings table is right and whether the court sits square inside the traced polygon
   * drawn round it. Then a three-quarter for the net and the hoops, and a rider's eye from the baseline,
   * which is the height a court is actually passed at.
   */
  // a museum of 80-200 m (render/landmarks/paris/museums): its −z front, three-quarter from the south-west, the west
  // end close (the Concorde ends of the Tuileries pavilions), from the north-east and from above
  museum: [['front', -1.57, 1.42, 170, 0, 10, 0], ['sw', -2.4, 1.3, 170, 0, 10, 0], ['west-end', 3.14, 1.45, 70, -20, 7, 0],
    ['ne', 0.8, 1.2, 190, 0, 10, 0], ['top', -1.2, 0.6, 220, 0, 0, 0]],
  /*
   * A PALACE (paris/palaces/): a long low building with a front (local −z) and a back worth seeing, 100–160 m across —
   * head-on to both, a three-quarter to each, from a rider across its street, and from above for the plan.
   * `palace-big` is the same for the Invalides' 270 m.
   */
  palace: [['front', -1.57, 1.4, 250, 0, 14, 0], ['front-3q', -2.25, 1.3, 230, 0, 14, 0], ['back', 1.57, 1.4, 250, 0, 14, 0],
    ['back-3q', 0.85, 1.3, 230, 0, 14, 0], ['top', -1.4, 0.55, 300, 0, 0, 0], ['street', -1.9, 1.52, 120, 0, 16, -40]],
  'palace-big': [['front', -1.57, 1.4, 420, 0, 14, 0], ['front-3q', -2.25, 1.3, 380, 0, 14, 0], ['back', 1.57, 1.4, 420, 0, 14, 0],
    ['back-3q', 0.85, 1.3, 380, 0, 14, 0], ['top', -1.4, 0.55, 480, 0, 0, 0], ['street', -1.9, 1.52, 170, 0, 16, -90]],
  court: [
    ['plan', -1.57, 0.04, 34, 0, 0, 0],
    ['three-quarter', -0.9, 1.15, 34, 0, 1, 0],
    ['rider', 0.45, 1.50, 26, 0, 1.4, 0],
  ],
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
   * BUGS.md #160. `Fit.ring` is documented anticlockwise (`landmarks/fit.ts:8`) and `faceBand` relies on it:
   * a clockwise ring turns every wall's normal inward, so backface culling makes the walls INVISIBLE while
   * the roof and anything hand-placed still draw.
   *
   * `tools/bake.ts` normalises (its `ccw()` at :526, :539, :645), and so does `tools/footprint.ts` (:123) —
   * so the LIVE GAME is fine. This path does not: it builds the ring straight from Overpass geometry, whose
   * winding OSM does not guarantee. So only the RENDER TOOL was affected, which is the worst place for it:
   * a run on 2026-09-24 rendered the SF Armory, saw no walls, and had to diagnose a winding bug before it
   * could trust its own evidence. A render that lies costs more than a render that is missing.
   */
  let twice = 0
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length]
    twice += a.x * b.z - b.x * a.z
  }
  if (twice < 0) ring = ring.reverse()
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
  await page.goto(`${BASE}/?model=${model}${arg('size') ? `&size=${arg('size')}` : ''}${arg('time') ? `&time=${arg('time')}` : ''}`)
  await page.waitForFunction('window.modelReady === true', null, { timeout: 60_000 })
  // --views=auto: framed on the model's own bounds, whatever it is (furniture, a vehicle, a landmark at --size)
  // --fit=hx,hz,height: a footprint by hand, for a builder whose shape depends on it (a pier: long and narrow)
  const byHand = arg('fit') ? arg('fit').split(',').map(Number) : null
  if (byHand) fitFor = { hx: byHand[0], hz: byHand[1], height: byHand[2] ?? 12, ring: [] as { x: number; z: number }[] }
  /*
   * An EXPLICIT `--views` wins over the entry's auto-framed set. It used to be silently discarded whenever
   * `--entry` was given, so there was no way to aim a camera at anything but the model's bounding box — and
   * a 190 m park's four auto views are all from outside it, which is the one place a level change cannot be
   * seen from (docs/RENDERING.md: fix the tool, do not fork it). `--views=sign` and `--views=vehicle` are
   * now usable as rider's-eye sets on a landmark entry, since both target the model's own origin up close.
   */
  /*
   * `--view=<name>:<alpha>,<beta>,<radius>,<tx>,<ty>,<tz>` — ONE camera, said outright. The named sets and
   * the auto framing both aim at the model's centre or its bounding box, and a landscape model's interesting
   * part (a ramp off a wall, a stair between two decks) is neither. Added rather than forked, and rather
   * than adding a park-shaped entry to SETS that no other model could use.
   */
  const one = arg('view')
  const viewsAsked = (arg('views') !== '' && arg('views') !== 'auto') || one !== ''
  if (fitFor || arg('views') === 'auto') {
    const s0 = Number(arg('size', '200'))
    const fitNow = fitFor && fitFor.ring.length === 0 ? { hx: fitFor.hx, hz: fitFor.hz, height: fitFor.height } : fitFor
    // the rebuild happens whatever the views are: the model has to stand on its own footprint either way
    const b = await page.evaluate(`window.__rebuild(${JSON.stringify(fitNow ?? { hx: s0 / 2, hz: s0 / 2, height: s0 })})`) as { min: number[]; max: number[]; triangles: number }
    const H = b.max[1]
    const R = Math.max(b.max[0] - b.min[0], b.max[2] - b.min[2], H)
    const cy = H * 0.45
    const auto: V[] = [['front', Math.PI / 2 - spin, 1.42, R * 1.9, 0, cy, 0], ['corner', Math.PI / 2 - 0.9 - spin, 1.3, R * 1.8, 0, cy, 0],
      // (from across the street: the target on the south face, the camera 28 m out from it, looking up)
      ['street', Math.PI / 2 + 0.35 - spin, 1.72, 28, 0, Math.min(14, H * 0.35), b.max[2]], ['top', 0.6 - spin, 0.8, R * 1.8, 0, cy, 0]]
    if (!viewsAsked) views = auto
  }
  if (one) {
    const [nm, nums] = one.includes(':') ? [one.split(':')[0], one.split(':')[1]] : ['view', one]
    const n = nums.split(',').map(Number)
    if (n.length < 3 || n.some((q) => !Number.isFinite(q))) throw new Error('--view=<name>:<alpha>,<beta>,<radius>[,<tx>,<ty>,<tz>]')
    views = [[nm, n[0], n[1], n[2], n[3] ?? 0, n[4] ?? 0, n[5] ?? 0]]
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
