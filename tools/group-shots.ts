/**
 * Photographs SEVERAL manifest entries TOGETHER, at their true relative offsets, with nothing else in the
 * scene — the check `model-shots.ts --entry=` cannot do (one entry only) and `views.ts` cannot do either
 * (the whole city, where a landmark's own neighbouring towers block every angle — as they do in real life
 * too, per the owner: "this site is surrounded by tall towers, so it is hard to get clear shots even in real
 * life"). Built for Embarcadero Center's plaza network (four decks + the five towers they sit between, none
 * of which agree with each other unless seen as a group), but kept generic — Yerba Buena, Moscone and
 * Portsmouth Square have the identical verification problem: a single entry looks fine alone, and the only
 * way to see whether several entries actually meet each other correctly is to place them all at once.
 *
 *     node --experimental-strip-types tools/group-shots.ts --out=docs/shots/models/groups --name=embarcadero \
 *       --entries="Embarcadero Center — plaza deck (West / One)|Embarcadero Center — plaza deck (One / Two)|\
 *                  Embarcadero Center — plaza deck (Two / Three)|Embarcadero Center — plaza deck (Three / Four)|\
 *                  One Maritime Plaza Park|Embarcadero Center West|Embarcadero Center 1|Embarcadero Center 2|\
 *                  Embarcadero Center 3|Embarcadero Center 4"
 *
 * `--entries` is a `|`-separated list (not comma: several manifest names contain commas) of manifest NAME
 * fields — the same string `fitForEntry`/`model-shots.ts --entry=` key off, NOT the `procedural` id: several
 * of Embarcadero's own towers share one `procedural: "embarcaderoCenter"` preset, so procedural ids cannot
 * tell them apart, but their manifest names can. Each entry's fit comes from `fitForEntry`; each entry's
 * PLACEMENT comes from its own manifest lat/lon (`size`+`lat`+`lon` entries) or, for an OSM-fitted entry (the
 * five towers), the centroid of its own Overpass footprint — both resolved by `resolveEntry` below. The FIRST
 * entry named is the group's own origin; every other entry is placed at its offset from it, in metres, using
 * the SAME `111320*cos(lat)` / `110540` projection constants `fitForEntry` and `tools/bake.ts` use, so a
 * group render and the live bake agree on where things land.
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { fitForEntry } from './model-shots.ts'

const BASE = process.env.SHOTS_BASE ?? 'http://localhost:5200'
const arg = (n: string, f = ''): string => (process.argv.find((a) => a.startsWith(`--${n}=`)) ?? `=${f}`).split('=').slice(1).join('=')
const out = arg('out', 'docs/shots/models/groups')
mkdirSync(out, { recursive: true })
const groupName = arg('name', 'group')
const city = arg('city', 'san-francisco')

const entryNames = arg('entries').split('|').map((s) => s.trim()).filter(Boolean)
if (entryNames.length === 0) throw new Error('--entries=NameA|NameB|NameC is required — a `|`-separated list of manifest NAME fields')

/*
 * `fitForEntry` gives back a FOOTPRINT (a `Fit`), not a lat/lon — it is built to hand a single model to
 * `?model=`. To place several of them relative to each other we need each entry's own centre lat/lon too.
 * A standalone entry (`size`+`lat`+`lon`, no OSM id) declares it directly. An OSM-fitted entry (the five
 * Embarcadero towers, none of which have a `lat`/`lon` field at all) does not — its centre is the centroid of
 * its own Overpass footprint, the same geometry `fitForEntry` already reads, so it is recomputed here rather
 * than invented.
 */
async function entryLatLon(name: string): Promise<{ lat: number; lon: number }> {
  const { readManifestFile } = await import('../src/city/manifest.ts')
  const { resolve } = await import('node:path')
  const { readdirSync, readFileSync, existsSync } = await import('node:fs')
  const mf = [city, city.split('-')[0]].map((n) => resolve(import.meta.dirname, '..', 'public', 'landmarks', `${n}.json`)).find((f) => existsSync(f))!
  const e = (await readManifestFile<{ name: string; osm?: string | string[]; lat?: number; lon?: number }>(mf)).find((x) => x.name === name)
  if (!e) throw new Error(`no manifest entry named "${name}"`)
  if (e.lat !== undefined && e.lon !== undefined) return { lat: e.lat, lon: e.lon }
  const ids = Array.isArray(e.osm) ? e.osm : e.osm ? [e.osm] : []
  if (ids.length === 0) throw new Error(`"${name}" has no lat/lon and no osm id — cannot place it in a group`)
  type G = { lat: number; lon: number }
  type El = { type: string; id: number; geometry?: G[] }
  const cache = resolve(import.meta.dirname, 'cache')
  for (const f of readdirSync(cache)) {
    if (!f.startsWith('overpass-')) continue
    let d: { elements?: El[] }
    try { d = JSON.parse(readFileSync(resolve(cache, f), 'utf8')) } catch { continue }
    const el = d.elements?.find((x) => `${x.type}/${x.id}` === ids[0])
    if (el?.geometry) {
      const lat = el.geometry.reduce((s, g) => s + g.lat, 0) / el.geometry.length
      const lon = el.geometry.reduce((s, g) => s + g.lon, 0) / el.geometry.length
      return { lat, lon }
    }
  }
  throw new Error(`footprint of ${ids[0]} (for "${name}") not in the Overpass cache`)
}

type Entry = { model: string; fit: { hx: number; hz: number; height: number; ring: { x: number; z: number }[] }; dx: number; dz: number }

const resolved: Entry[] = []
let origin: { lat: number; lon: number } | null = null
for (const name of entryNames) {
  const [{ model, fit }, ll] = await Promise.all([fitForEntry(name, city), entryLatLon(name)])
  if (!origin) origin = ll
  const kx = 111320 * Math.cos((origin.lat * Math.PI) / 180)
  const kz = 110540
  const dx = (ll.lon - origin.lon) * kx
  const dz = (ll.lat - origin.lat) * kz
  resolved.push({ model, fit, dx, dz })
  console.log(`  ${name} -> ${model}  offset (${dx.toFixed(1)}, ${dz.toFixed(1)})`)
}

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 1400, height: 800 } })
page.on('pageerror', (e) => console.log('page error:', e.message.slice(0, 300)))
// the model= param just needs SOME valid builder to boot the scene; __rebuildGroup replaces its geometry entirely
await page.goto(`${BASE}/?model=${resolved[0].model}`)
await page.waitForFunction('window.modelReady === true', null, { timeout: 60_000 })
const b = await page.evaluate(`window.__rebuildGroup(${JSON.stringify(resolved)})`) as { min: number[]; max: number[]; triangles: number }
console.log(groupName, b.triangles, 'triangles, bounds', b.min, '..', b.max)

const H = Math.max(1, b.max[1] - b.min[1])
const cx = (b.min[0] + b.max[0]) / 2
const cz = (b.min[2] + b.max[2]) / 2
const cy = (b.min[1] + b.max[1]) / 2
const R = Math.max(b.max[0] - b.min[0], b.max[2] - b.min[2], H)

/*
 * Several angles, INCLUDING STRAIGHT DOWN (beta near 0) — the owner named this explicitly: a top-down view is
 * the only one that is not fighting the surrounding towers, in the game or in real life. `north`/`south`/
 * `east`/`west` are the four horizontal look directions (in the ARC camera's alpha, 0 faces +z) so a stretched
 * network like Embarcadero's can be read along its own long axis from either end, not just obliquely.
 */
const views: [string, number, number, number, number, number, number][] = [
  ['top', 0.7, 0.08, R * 1.5 + 40, cx, cy, cz],
  ['top-close', -0.9, 0.15, R * 0.9 + 20, cx, cy, cz],
  ['oblique-a', Math.PI / 4, 1.0, R * 1.6 + 60, cx, cy * 1.1, cz],
  ['oblique-b', -Math.PI / 4 * 3, 1.0, R * 1.6 + 60, cx, cy * 1.1, cz],
  ['north', 0, 1.35, R * 1.4 + 50, cx, cy, cz],
  ['south', Math.PI, 1.35, R * 1.4 + 50, cx, cy, cz],
  ['east', Math.PI / 2, 1.35, R * 1.4 + 50, cx, cy, cz],
  ['west', -Math.PI / 2, 1.35, R * 1.4 + 50, cx, cy, cz],
]
for (const [name, ...v] of views) {
  await page.evaluate(`window.__modelView(${v.join(',')})`)
  await page.waitForTimeout(700)
  await page.screenshot({ path: `${out}/${groupName}-${name}.png` })
  console.log(' ', name)
}
await browser.close()
