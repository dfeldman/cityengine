/**
 * Score building FOOTPRINTS for forms the slot kit cannot express (PLAN.md §Soon.0, docs/LADDER.md).
 *
 *   node --experimental-strip-types tools/ring-forms.ts --around=docs/sf-batches/exp/BUILDINGS-20.md
 *   node --experimental-strip-types tools/ring-forms.ts --box=37.788,-122.406,37.795,-122.396 --top=40
 *
 * `facade()` is a grammar for flat walls on the polygon edges of an outline. Two of the five forms it cannot
 * say leave a signature in the outline itself, and the outline is already on disk for every building in the
 * city — so this half of the triage is free and works in any city. The other three (twist/taper, vaulted
 * roofs, temple fronts) are INVISIBLE from above and need a photograph; this tool cannot find them and does
 * not pretend to.
 *
 * Per ring, with edge lengths in metres and signed turning angles at each vertex:
 *
 *   ortho   fraction of vertices turning within 12 deg of 0/90/180. The NEGATIVE filter and the most useful
 *           number here: downtown is full of 40-vertex outlines that are pure right-angle jogs — light
 *           wells, rear setbacks, party walls — and every one of those is kit-shaped. High ortho means the
 *           vertex count is meaningless.
 *   arc     the longest run of >= 4 consecutive vertices all turning the SAME way by 6..45 deg ON EDGES
 *           UNDER 8 m, in METRES of perimeter. Both halves matter: the angle window says "curving", the
 *           edge cap says "sampled", and without the cap a chamfered corner between two long walls (Fugazi
 *           Bank: five 1.3 m edges between a 45 m wall and a 33 m one) scores 52 m of arc.
 *   stair   the longest run of ALTERNATING near-right-angle turns on edges under 2.5 m that keeps turning
 *           overall (|net| > 60 deg) — a curve some mapper digitised as a staircase. 101 California is a
 *           cylinder drawn as a hundred 1 m steps; it has NO arc at all and `ortho` calls it 0.75
 *           orthogonal. Without this score the most obviously round building downtown is invisible.
 *           The run must be LONG (>= 16 steps): an odd-length rear jog can sum to more than 60 deg of net
 *           turn by accident, and at 49 Stevenson Street one did.
 *           `arc + stair` is the curved-plan number; the printed % is their sum over the perimeter.
 *   saw     the longest run of ALTERNATING turns > 30 deg made of REGULAR teeth 2-6 m across (>= 10 of
 *           them, edge-length spread under 0.35) that does NOT turn overall. This is the only footprint
 *           signature of per-BAY depth: a row of projecting bays cuts the outline into a square wave, and
 *           the kit varies depth per storey and never per bay. The regularity test is what keeps out a rear
 *           light well, whose handful of jogs are all different sizes; the net-turn test is what keeps out
 *           a staircased curve, which alternates just as hard.
 *
 * Nothing here scores twist or taper. A footprint is one horizontal slice; a plan that changes with height
 * is by construction not in it. Same for a barrel vault and for a temple front, both of which sit on
 * perfectly ordinary rectangles.
 *
 * Buildings already hand-modelled (a `procedural` entry in public/landmarks/<city>.json or that city's
 * directory beside it) are marked
 * `claimed`: they have left the kit's world already and are not candidates. A `restyle` entry is NOT
 * claimed — that is a style applied without anybody looking at the building.
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { CITIES } from './cities.ts'
import { RING_FORMS, scoreRing, thresholds, type MetreRing } from '../src/city/ring-forms.ts'

const ROOT = resolve(import.meta.dirname, '..')
const arg = (n: string, f = ''): string => (process.argv.find((a) => a.startsWith(`--${n}=`)) ?? `=${f}`).split('=').slice(1).join('=')

const CITY = arg('city', 'san-francisco')
const TOP = Number(arg('top', '30'))
const MIN_H = Number(arg('minh', String(RING_FORMS.minHeight)))
const MARGIN = Number(arg('margin', '250'))
// the thresholds, overridable per city (tools/cities.ts `ringForms`) and on the command line for this box
const T = thresholds({ ...CITIES.find((c) => c.id === CITY)?.ringForms, minHeight: MIN_H })

type El = { type: string; id: number; tags?: Record<string, string>; geometry?: { lat: number; lon: number }[] }
type Ring = [number, number][]

// ------------------------------------------------------------------ every building outline we have on disk
const cache = resolve(ROOT, 'tools', 'cache')
const all = new Map<string, El>()
for (const f of readdirSync(cache)) {
  if (!f.startsWith('overpass-') && !f.startsWith('shape-')) continue
  let d: { elements?: El[] }
  try { d = JSON.parse(readFileSync(resolve(cache, f), 'utf8')) } catch { continue }
  for (const e of d.elements ?? []) {
    if (!e.tags?.building || !e.geometry || e.geometry.length < 4) continue
    all.set(`${e.type}/${e.id}`, e)
  }
}
const ringOf = (e: El): Ring => (e.geometry ?? []).map((g) => [g.lat, g.lon] as [number, number])

// ------------------------------------------------------------------------------------- the box to look in
let box: { s: number; w: number; n: number; e: number }
const around = arg('around')
if (arg('box')) {
  const [s, w, n, e] = arg('box').split(',').map(Number)
  box = { s, w, n, e }
} else if (around) {
  // the bounding box of the ways named in a batch doc, grown by --margin metres: the "downtown core and its
  // surroundings" without anybody typing a coordinate
  const ids = [...readFileSync(resolve(ROOT, around), 'utf8').matchAll(/`(\d{6,})`/g)].map((m) => `way/${m[1]}`)
  const pts = ids.flatMap((i) => (all.has(i) ? ringOf(all.get(i)!) : []))
  if (pts.length === 0) throw new Error(`none of the ${ids.length} ids in ${around} are in the cache`)
  const dLat = MARGIN / 111320
  const dLon = MARGIN / (111320 * Math.cos((pts[0][0] * Math.PI) / 180))
  box = {
    s: Math.min(...pts.map((p) => p[0])) - dLat, n: Math.max(...pts.map((p) => p[0])) + dLat,
    w: Math.min(...pts.map((p) => p[1])) - dLon, e: Math.max(...pts.map((p) => p[1])) + dLon,
  }
  console.log(`box from ${ids.length} ids in ${around} (+${MARGIN} m): ${box.s.toFixed(5)},${box.w.toFixed(5)} .. ${box.n.toFixed(5)},${box.e.toFixed(5)}`)
} else throw new Error('need --box=s,w,n,e or --around=<batch doc>')

// ------------------------------------------------------------------------------------------ claimed by hand
const claimed = new Set<string>()
// BOTH files: `public/landmarks/<city>.json` holds the city's own hand-modelled landmarks (Transamerica,
// 555 California, 101 California), and `public/landmarks/<city>/*.json` holds the district batches. Reading
// only the directory misses the most important buildings in the city, which is the opposite of what a
// `claimed` flag is for — this cost a wrong conclusion once already.
const files: string[] = []
const lm = resolve(ROOT, 'public', 'landmarks', CITY)
if (existsSync(lm)) for (const f of readdirSync(lm)) files.push(resolve(lm, f))
if (existsSync(`${lm}.json`)) files.push(`${lm}.json`)
for (const path of files) {
  const f = path
  if (!f.endsWith('.json')) continue
  let rows: { osm?: string[]; procedural?: string }[]
  try { rows = JSON.parse(readFileSync(f, 'utf8')) } catch { continue }
  // ONLY a `procedural` entry is hand-modelled. A `restyle` entry has been given a facade style without
  // anybody looking at the building (LADDER.md §3a: downtown, that counts as NOT DONE), so it is still a
  // candidate — the Savings Union Bank, a domed classical banking hall, is one of those.
  for (const r of rows) if (r.procedural) for (const o of r.osm ?? []) claimed.add(o)
}

// ------------------------------------------------------------------------------------------------- scoring
/** the ring in local metres, which is what the scorer takes (src/city/ring-forms.ts) */
function metres(ring: Ring): MetreRing {
  const mLat = 111320, mLon = 111320 * Math.cos((ring[0][0] * Math.PI) / 180)
  return ring.map(([la, lo]) => ({ x: lo * mLon, z: la * mLat }))
}

/** the oriented bounding box, so "38 x 84 m" means the building's own axes and not the compass's */
function obb(ring: Ring): [number, number] {
  const p = ring.slice()
  const mLat = 111320, mLon = 111320 * Math.cos((p[0][0] * Math.PI) / 180)
  const xy = p.map(([la, lo]) => [lo * mLon, la * mLat] as [number, number])
  let best: [number, number] = [Infinity, Infinity], bestA = Infinity
  for (let d = 0; d < 90; d += 1) {
    const t = (d * Math.PI) / 180, cs = Math.cos(t), sn = Math.sin(t)
    const xs = xy.map((q) => q[0] * cs + q[1] * sn), ys = xy.map((q) => -q[0] * sn + q[1] * cs)
    const w = Math.max(...xs) - Math.min(...xs), h = Math.max(...ys) - Math.min(...ys)
    if (w * h < bestA) { bestA = w * h; best = [Math.min(w, h), Math.max(w, h)] }
  }
  return best
}

type Row = {
  id: string; name: string; h: number; dims: [number, number]
  n: number; perim: number; ortho: number
  arcM: number; arcN: number; arcShare: number
  stairM: number; stairN: number
  sawM: number; sawN: number; claimed: boolean
}

const rows: Row[] = []
for (const [id, e] of all) {
  const ring = ringOf(e)
  const c: [number, number] = [ring.reduce((s, p) => s + p[0], 0) / ring.length, ring.reduce((s, p) => s + p[1], 0) / ring.length]
  if (c[0] < box.s || c[0] > box.n || c[1] < box.w || c[1] > box.e) continue
  const t = e.tags!
  const h = parseFloat(String(t.height ?? t["building:height"] ?? "")) || (Number(t['building:levels']) || 0) * 3.5
  if (!(h >= T.minHeight)) continue
  const sc = scoreRing(metres(ring), T)
  if (!sc) continue
  const { n, perimeter: perim, ortho, arc: arcM, arcN, stair: stairM, stairN, saw: sawM, sawN } = sc

  rows.push({
    id, name: t.name ?? '—', h, dims: obb(ring), n, perim, ortho,
    arcM, arcN, arcShare: (arcM + stairM) / perim, stairM, stairN, sawM, sawN, claimed: claimed.has(id),
  })
}

// --------------------------------------------------------------------------------------------- the report
const curved = (r: Row): boolean => r.arcM + r.stairM >= T.curvedM
const flagged = rows.filter((r) => curved(r) || r.sawM >= T.sawM)
console.log(`\n${rows.length} buildings over ${MIN_H} m in the box; ${flagged.length} flagged (arc+stair >= ${T.curvedM} m, or saw >= ${T.sawM} m), ${flagged.filter((r) => !r.claimed).length} of them unclaimed\n`)

const fmt = (r: Row): string =>
  `${r.claimed ? 'C' : ' '} ${r.id.padEnd(16)} ${String(Math.round(r.h)).padStart(4)} m  ` +
  `${`${Math.round(r.dims[0])}x${Math.round(r.dims[1])}`.padStart(8)}  n=${String(r.n).padStart(3)} ` +
  `P=${String(Math.round(r.perim)).padStart(4)}m ortho=${r.ortho.toFixed(2)} ` +
  `arc=${r.arcM.toFixed(0).padStart(3)}m stair=${r.stairM.toFixed(0).padStart(3)}m (${(r.arcShare * 100).toFixed(0).padStart(3)}%) ` +
  `saw=${r.sawM.toFixed(0).padStart(3)}m/${String(r.sawN).padStart(2)}  ${r.name}`

console.log('— curved plan (arc, or a staircased curve) —')
for (const r of [...flagged].filter(curved).sort((a, b) => b.arcShare - a.arcShare).slice(0, TOP)) console.log(fmt(r))
console.log('\n— per-bay depth (sawtooth) —')
for (const r of [...flagged].filter((x) => x.sawM >= T.sawM).sort((a, b) => b.sawM - a.sawM).slice(0, TOP)) console.log(fmt(r))
console.log('\n— high vertex count but orthogonal (the kit CAN say these; shown to make the point) —')
for (const r of [...rows].filter((x) => x.ortho > 0.9).sort((a, b) => b.n - a.n).slice(0, 5)) console.log(fmt(r))

/*
 * A free last pass on TAGS, not geometry. `roof:shape` is the only place OSM ever says "vault" or "dome",
 * and `building:part` with a `min_height`/`min_level` is the only place it says the plan CHANGES WITH
 * HEIGHT — the two criteria the ring itself cannot see. Neither is reliable (both are tagged on a small
 * minority of buildings), so a hit is a lead and a miss is not evidence of absence. It is printed because
 * it costs nothing and because a downtown with no curved roof tag at all is itself worth knowing.
 */
const curvedRoof = new Set(['dome', 'onion', 'round', 'quadruple_saltbox', 'cone'])
const leads: string[] = []
for (const f of readdirSync(cache)) {
  if (!f.startsWith('overpass-') && !f.startsWith('shape-')) continue
  let d: { elements?: El[] }
  try { d = JSON.parse(readFileSync(resolve(cache, f), 'utf8')) } catch { continue }
  for (const e of d.elements ?? []) {
    const t = e.tags
    if (!t || !e.geometry?.length) continue
    const roof = t['roof:shape'] ?? ''
    const raised = t['building:part'] && (t.min_height || t['building:min_level'])
    if (!curvedRoof.has(roof) && !raised) continue
    const g = e.geometry
    const la = g.reduce((s, p) => s + p.lat, 0) / g.length, lo = g.reduce((s, p) => s + p.lon, 0) / g.length
    if (la < box.s || la > box.n || lo < box.w || lo > box.e) continue
    leads.push(`  ${`${e.type}/${e.id}`.padEnd(16)} ${(roof || '—').padEnd(10)} ${raised ? `from ${t.min_height ?? `level ${t['building:min_level']}`}` : ''} ${t.name ?? ''}`)
  }
}
console.log(`\n— tag leads: curved roofs, and parts that start above the ground (${leads.length}) —`)
for (const l of [...new Set(leads)].sort()) console.log(l)
