/**
 * Ride edges that pass through a building footprint (generic or landmark), each matched to the OSM way it was
 * drawn from and classified by that way's tags — rerun after a bake.
 *   npx tsx tools/route-through-buildings.ts [--city=paris-centre] [--bbox=48.884,2.226,48.897,2.258] [--min=4] [--stale]
 * Reads the SHIPPED bike ride graph (what the game rides) and the bake package's footprints; OSM tags come from
 * the local pbf (tools/cache/osm/ile-de-france-latest.osm.pbf) via osmium, extracted fresh each run.
 * Classes:  passage  tunnel=building_passage / covered=yes / passage flag — needs an opening in the model
 *           deck     bridge / layer>0 — a walkway over: check deck heights clear the model
 *           under    tunnel / layer<0 — below the building
 *           indoor   indoor / highway=corridor / level≠0 — should not be rideable
 *           arched   passage through a GENERIC building: render/passages.ts draws the vault — fine
 *           vaulted  passage through a plain-extrusion landmark (render/prepare.ts VAULT_BUILDERS): vault drawn — fine
 *           passage  (what is left) a landmark that must cut its own opening: check the model
 *           raised   the footprint is a part lifted ≥4 m (min_height): rideable under it
 *           plain    an at-grade way with none of those — mis-mapped footprint or mis-routed edge: look
 */
import { readFileSync, readdirSync, mkdtempSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { resolve, join } from 'node:path'
import { tmpdir } from 'node:os'
import { shippedDir, readPackage, packageFile } from './bake-files.ts'
import { VAULT_BUILDERS } from '../src/render/prepare.ts'
import type { CityPackage } from '../src/city/package.ts'
import { unpackRide, type RideFile } from '../src/city/ridefile.ts'
import { Projection } from '../src/city/geo.ts'

const arg = (n: string, f = ''): string => (process.argv.find((a) => a.startsWith(`--${n}=`)) ?? `=${f}`).split('=').slice(1).join('=')
const city = arg('city', 'paris-centre')
const [la0, lo0, la1, lo1] = arg('bbox', '48.884,2.226,48.897,2.258').split(',').map(Number)
const MIN_INSIDE_M = Number(arg('min', '4')) // a run this long inside one footprint counts
const STEP_M = 1 // sample spacing along an edge
const MATCH_M = 4 // an OSM way within this of the run's midpoint is its source
const PBF = 'tools/cache/osm/ile-de-france-latest.osm.pbf'

// --stale: footprints from the bake-private package even when it is not the shipped bake (another session mid-bake)
const pkg: CityPackage = process.argv.includes('--stale') ? JSON.parse(readFileSync(packageFile(city), 'utf8')) as CityPackage : readPackage(city)
const proj = new Projection(pkg.origin)
const g = unpackRide(JSON.parse(readFileSync(resolve(shippedDir(city), 'ride-bike.json'), 'utf8')) as RideFile)
const ll = (x: number, z: number): string => { const p = proj.toLatLon({ x, z }); return `${p.lat.toFixed(6)},${p.lon.toFixed(6)}` }
const A = proj.toLocal({ lat: la0, lon: lo0 }), B = proj.toLocal({ lat: la1, lon: lo1 })
const X0 = Math.min(A.x, B.x), X1 = Math.max(A.x, B.x), Z0 = Math.min(A.z, B.z), Z1 = Math.max(A.z, B.z)
const inBox = (x: number, z: number): boolean => x >= X0 && x <= X1 && z >= Z0 && z <= Z1

// landmark entries: OSM way id -> name
const landmarkOf = new Map<number, string>()
for (const f of readdirSync('public/landmarks/paris')) if (f.endsWith('.json')) {
  for (const e of JSON.parse(readFileSync(join('public/landmarks/paris', f), 'utf8')) as { osm?: string[]; name?: string; procedural?: string }[])
    for (const o of e.osm ?? []) { const m = /^way\/(\d+)$/.exec(o); if (m) landmarkOf.set(Number(m[1]), `${e.procedural ?? '?'}`) }
}

type Fp = { id: number; r: number[]; x0: number; x1: number; z0: number; z1: number; minH: number }
const fps: Fp[] = []
for (const b of pkg.buildings) {
  const r = b.ring as unknown as number[]
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9
  for (let i = 0; i < r.length; i += 2) { x0 = Math.min(x0, r[i]); x1 = Math.max(x1, r[i]); z0 = Math.min(z0, r[i + 1]); z1 = Math.max(z1, r[i + 1]) }
  if (x1 < X0 || x0 > X1 || z1 < Z0 || z0 > Z1) continue
  fps.push({ id: b.id, r, x0, x1, z0, z1, minH: b.minHeight ?? 0 })
}
const inside = (x: number, z: number, r: number[]): boolean => {
  let c = false
  for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
    if ((r[i + 1] > z) !== (r[j + 1] > z) && x < ((r[j] - r[i]) * (z - r[i + 1])) / (r[j + 1] - r[i + 1]) + r[i]) c = !c
  }
  return c
}

// OSM highways in the box, with tags
const dir = mkdtempSync(join(tmpdir(), 'rtb-'))
execFileSync('osmium', ['extract', '-b', `${lo0},${la0},${lo1},${la1}`, PBF, '-o', join(dir, 'a.pbf'), '--overwrite'], { stdio: 'ignore' })
execFileSync('osmium', ['tags-filter', join(dir, 'a.pbf'), 'w/highway', '-o', join(dir, 'h.pbf'), '--overwrite'], { stdio: 'ignore' })
execFileSync('osmium', ['export', join(dir, 'h.pbf'), '-f', 'geojsonseq', '-o', join(dir, 'h.geojsonseq'), '--overwrite', '-a', 'type,id', '--geometry-types=linestring'], { stdio: 'ignore' })
type Way = { id: number; tags: Record<string, string>; pts: { x: number; z: number }[] }
const ways: Way[] = readFileSync(join(dir, 'h.geojsonseq'), 'utf8').split('\n').filter((l) => l.trim()).map((l) => {
  const f = JSON.parse(l.replace(/^\x1e/, '')) as { properties: Record<string, string>; geometry: { coordinates: [number, number][] } }
  const { '@id': id, '@type': _t, ...tags } = f.properties
  return { id: Number(id), tags, pts: f.geometry.coordinates.map(([lon, lat]) => proj.toLocal({ lat, lon })) }
})
const segD = (p: { x: number; z: number }, a: { x: number; z: number }, b: { x: number; z: number }): number => {
  const dx = b.x - a.x, dz = b.z - a.z, L = dx * dx + dz * dz
  const t = L ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / L)) : 0
  return Math.hypot(p.x - a.x - t * dx, p.z - a.z - t * dz)
}
// stacked ways (decks over streets over tunnels) are common here: a way of the edge's own name wins, then one of a
// plausible class; steps/corridors only when nothing else is near
const ODD = new Set(['steps', 'corridor', 'elevator'])
const nearestWay = (p: { x: number; z: number }, name?: string): Way | undefined => {
  let best: Way | undefined, bs = Infinity
  for (const w of ways) for (let i = 1; i < w.pts.length; i++) {
    const d = segD(p, w.pts[i - 1], w.pts[i]); if (d > MATCH_M) continue
    const s = d + (name && w.tags.name !== name ? 10 : 0) + (ODD.has(w.tags.highway) ? 20 : 0)
    if (s < bs) { bs = s; best = w }
  }
  return best
}
export function classOf(t: Record<string, string>): string {
  if (t.indoor && t.indoor !== 'no' || t.highway === 'corridor' || (t.level && !/^0(;|$)/.test(t.level))) return 'indoor'
  if (t.tunnel === 'building_passage' || t.covered === 'yes' || t.covered === 'arcade') return 'passage'
  if (t.bridge && t.bridge !== 'no' || Number(t.layer ?? 0) > 0) return 'deck'
  if (t.tunnel && t.tunnel !== 'no' || Number(t.layer ?? 0) < 0) return 'under'
  return 'plain'
}

const rows: string[] = []
for (const e of g.edges.values()) {
  const ps = e.points
  if (!ps.some((q) => inBox(q.x, q.z))) continue
  // per footprint, the longest run inside it
  let cur: Fp | undefined, run = 0, mid = { x: 0, z: 0 }, start = { x: 0, z: 0 }
  const flush = (): void => {
    if (cur && run >= MIN_INSIDE_M) {
      const w = nearestWay(mid, e.name)
      const t = w?.tags ?? {}
      const keys = ['highway', 'tunnel', 'covered', 'bridge', 'layer', 'level', 'indoor'].filter((k) => t[k]).map((k) => `${k}=${t[k]}`).join(' ')
      const lm = landmarkOf.get(cur.id)
      const cls0 = w ? classOf(t) : (e.passage ? 'passage' : 'no-osm')
      // a generic ground building over a passage way gets its vault from render/passages.ts; a landmark must cut its own
      const cls = cur.minH >= 4 && cls0 !== 'deck' ? 'raised' : cls0 === 'passage' && !lm && cur.minH <= 7 ? 'arched' : cls0 === 'passage' && lm && VAULT_BUILDERS.test(lm) ? 'vaulted' : cls0
      rows.push(`${cls}\t${ll(mid.x, mid.z)}\t${run} m\tride ${e.id} ${e.name ?? ''}${e.passage ? ' [passage]' : ''}${e.bridge ? ' [bridge]' : ''}${e.tunnel ? ' [tunnel]' : ''}\tway/${w?.id ?? '-'} ${keys}\tin ${lm ? 'LANDMARK ' + lm : 'b'}:${cur.id}${cur.minH ? ` minH ${cur.minH}` : ''}`)
    }
  }
  for (let i = 1; i < ps.length; i++) {
    const a = ps[i - 1], b = ps[i], n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / STEP_M))
    for (let k = 0; k < n; k++) {
      const x = a.x + ((b.x - a.x) * k) / n, z = a.z + ((b.z - a.z) * k) / n
      const f = inBox(x, z) ? fps.find((q) => x >= q.x0 && x <= q.x1 && z >= q.z0 && z <= q.z1 && inside(x, z, q.r)) : undefined
      if (f !== cur) { flush(); cur = f; run = 0; start = { x, z } }
      if (f) { run += STEP_M; mid = { x: (start.x + x) / 2, z: (start.z + z) / 2 } }
    }
  }
  flush()
}
rows.sort()
console.log('class\tat\tinside\tride edge\tosm way\tfootprint')
for (const r of rows) console.log(r)
const by = new Map<string, number>(); for (const r of rows) by.set(r.split('\t')[0], (by.get(r.split('\t')[0]) ?? 0) + 1)
console.log(`${rows.length} crossings: ${[...by].map(([k, v]) => `${k} ${v}`).join(', ')}`)
