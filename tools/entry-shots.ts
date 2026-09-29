/**
 * Photographs ONE manifest entry's procedural model on its own real footprint, from cameras that are NOT
 * spun by the entry's `front` bearing.
 *
 *   node --experimental-strip-types tools/entry-shots.ts --entry="San Francisco Museum of Modern Art" \
 *     --out=docs/shots/sfmoma [--city=san-francisco] [--front=45] [--prefix=model-]
 *
 * This exists because `tools/model-shots.ts --entry=` is wrong for an entry whose manifest carries a NUMERIC
 * `front` (BUGS.md #117), in two separate ways:
 *
 *  - its cameras subtract the city's `spin` from `alpha`, although `fitForEntry` has ALREADY turned the ring
 *    into the model's own frame and `?model=` applies no rotation of its own — so the "front" view looks at
 *    the model from `front + 180` degrees off, which for SFMOMA was 240 degrees, i.e. from behind;
 *  - inside `fitForEntry` the local `arg()` is shadowed so that `front` resolves to the empty `frontArg`,
 *    never to `e.front`, and the bearing falls back to the LONGEST edge of the footprint. For an L-shaped
 *    plan whose street frontage is its short side, that is the wrong elevation.
 *
 * So this tool passes the bearing to `fitForEntry` explicitly (`--front=`, else the entry's own number), and
 * points the cameras at the middle of the street edge rather than at the centre of the bounding box, which
 * on an L-shaped plan is not in front of the building at all. Front faces +z in the model frame, so the
 * frontal camera is `alpha = PI/2` with no correction.
 *
 * Views: `front` (square on the street elevation), `corner`, `street` (a rider's eye across the road), and
 * `detail` (close and high, for whatever stands on the roof). It drives the same `?model=` page as
 * `tools/model-shots.ts` — no city is loaded and it is cheap to run at any time.
 */
import { chromium } from 'playwright'
import { mkdirSync, existsSync, readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { fitForEntry } from './model-shots.ts'

const arg = (n: string, f = ''): string => (process.argv.find((a) => a.startsWith(`--${n}=`)) ?? `=${f}`).split('=').slice(1).join('=')
const BASE = process.env.SHOTS_BASE ?? 'http://localhost:5200'
const entry = arg('entry')
const city = arg('city', 'san-francisco')
const out = arg('out', 'docs/shots/models')
const prefix = arg('prefix', 'model-')
if (!entry) throw new Error('--entry="<manifest name>" is required')
mkdirSync(out, { recursive: true })

/** the entry's own `front`, unless one is given: `fitForEntry` will not read it for itself (BUGS.md #117) */
function frontOf(): string {
  if (arg('front')) return arg('front')
  const dir = resolve(import.meta.dirname, '..', 'public', 'landmarks', city)
  if (!existsSync(dir)) return ''
  for (const f of readdirSync(dir)) {
    if (!f.endsWith('.json')) continue
    const rows = JSON.parse(readFileSync(resolve(dir, f), 'utf8')) as { name: string; front?: number | string }[]
    const e = rows.find((r) => r.name === entry)
    if (e && typeof e.front === 'number') return String(e.front)
  }
  return ''
}
const front = frontOf()

const got = await fitForEntry(entry, city, front)
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 1400, height: 800 } })
page.on('pageerror', (e) => console.log('page error:', e.message.slice(0, 300)))
await page.goto(`${BASE}/?model=${got.model}`)
await page.waitForFunction('window.modelReady === true', null, { timeout: 60_000 })
const b = await page.evaluate(`window.__rebuild(${JSON.stringify(got.fit)})`) as { min: number[]; max: number[]; triangles: number }
console.log(`${got.model}  ${b.triangles} triangles  ${b.max[1].toFixed(1)} m tall`)

// the middle of the street edge: the edge of the ring whose outward normal points most nearly at +z
const ring = got.fit.ring
let bi = 0
let best = -Infinity
for (let i = 0; i < ring.length; i++) {
  const a = ring[i]
  const c = ring[(i + 1) % ring.length]
  const L = Math.hypot(c.x - a.x, c.z - a.z) || 1
  const score = -(c.x - a.x) / L + L * 0.02
  if (score > best) { best = score; bi = i }
}
const fa = ring[bi]
const fb = ring[(bi + 1) % ring.length]
const FX = (fa.x + fb.x) / 2
const FZ = (fa.z + fb.z) / 2
const H = b.max[1]
const R = Math.max(b.max[0] - b.min[0], b.max[2] - b.min[2], H)

const views: [string, number, number, number, number, number, number][] = [
  ['front', Math.PI / 2, 1.35, R * 1.3, FX, H * 0.4, FZ],
  ['corner', Math.PI / 2 - 0.8, 1.3, R * 1.5, FX, H * 0.4, FZ],
  ['street', Math.PI / 2 + 0.25, 1.62, 40, FX, 11, FZ],
  ['detail', Math.PI / 2 - 0.3, 1.15, R * 0.8, FX, H * 0.65, FZ],
]
for (const [n, alpha, beta, r, tx, ty, tz] of views) {
  await page.evaluate(`window.__modelView(${alpha}, ${beta}, ${r}, ${tx}, ${ty}, ${tz})`)
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${out}/${prefix}${n}.png` })
  console.log('  ', `${prefix}${n}.png`)
}
await browser.close()
