/**
 * Which generic Paris buildings to restyle from Panoramax photos (plans/paris-restyle-panoramax.md): tall or modern,
 * fronting a main street, not already a landmark or a hand look, and mostly outside the Haussmann centre. Clusters
 * them and writes one aim point per cluster, on the main street it fronts.
 *
 *   npx tsx tools/paris-restyle-list.ts <name> <minLon,minLat,maxLon,maxLat>
 *
 * Writes plans/restyle/<name>.tsv (one row per building, with its cluster) and prints the panoramax.py arguments.
 */
import { execFileSync } from 'node:child_process'
import { createReadStream, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { createInterface } from 'node:readline'

// ---- tunables ----
const TALL_M = 35            // a building this tall qualifies whatever its date (31 m is a ten-level Haussmann block)
const MODERN_YEAR = 1960     // or one built this year or later
const CENTRE_TALL_M = 50     // inside the centre ring only this tall
const MID_LEVELS = 8         // outside the centre ring, this many storeys qualifies (the Aurélium: 8, untagged date)
const CENTRE_LEVELS = 10     // inside it, this many (Haussmann tops out at 7–8 with the attic)
const CENTRE_MODERN_YEAR = 1955 // inside it, a dated postwar build qualifies too
const CENTRE = { lat: 48.8584, lon: 2.3470 } // Châtelet
const CENTRE_R = 2500        // m
const FRONT_M = 40           // within this of a main street
const MIN_AREA = 150         // m²
const CLUSTER_M = 300        // grid cell for one look
const LEVEL_M = 3.1
const NEIGH_M = 60            // an untagged-height neighbour comes along only this close to a kept one
const MAIN = /^(trunk|primary|secondary)(_link)?$/
const MAIN_NAME = /^(Boulevard|Avenue|Quai|Cours) /
const MODERN_TAGS = /^(glass|concrete|metal|steel|panel)/

const [name, bbox] = process.argv.slice(2)
if (!name || !bbox) { console.error('usage: paris-restyle-list.ts <name> <minLon,minLat,maxLon,maxLat>'); process.exit(1) }
const ROOT = resolve(import.meta.dirname, '..')
const X = (lon: number): number => (lon - CENTRE.lon) * 73270
const Z = (lat: number): number => (lat - CENTRE.lat) * 111320
type P = [number, number]
const segDist = (p: P, a: P, b: P): number => {
  const dx = b[0] - a[0], dz = b[1] - a[1], l = dx * dx + dz * dz
  const t = l ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / l)) : 0
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dz)
}
const area = (r: P[]): number => { let a = 0; for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += (r[j][0] + r[i][0]) * (r[j][1] - r[i][1]); return Math.abs(a / 2) }

// ---- already handled: landmark manifests (refs and point entries) and hand-looks ids ----
const taken = new Set<string>(), takenPts: P[] = []
const lmDir = resolve(ROOT, 'public/landmarks/paris')
for (const f of [resolve(ROOT, 'public/landmarks/paris.json'), ...readdirSync(lmDir).filter((f) => f.endsWith('.json')).map((f) => resolve(lmDir, f))]) {
  const d = JSON.parse(readFileSync(f, 'utf8')); if (!Array.isArray(d)) continue
  for (const e of d) {
    const refs: string[] = e.osm === undefined ? [] : Array.isArray(e.osm) ? e.osm : [e.osm]
    for (const r of refs) taken.add(r)
    if (!refs.length && e.lat && e.lon) takenPts.push([X(e.lon), Z(e.lat)])
  }
}
for (const m of readFileSync(resolve(ROOT, 'src/city/hand-looks.ts'), 'utf8').matchAll(/\b(\d{6,})\b/g)) taken.add(`way/${m[1]}`)
const where = readFileSync(resolve(ROOT, 'public/landmarks/paris.where.json'), 'utf8')

// ---- OSM ----
const dir = mkdtempSync(resolve(tmpdir(), 'rlist-'))
const box = resolve(dir, 'b.pbf'), flt = resolve(dir, 'f.pbf'), seq = resolve(dir, 'f.seq')
execFileSync('osmium', ['extract', '-b', bbox, '--overwrite', '-o', box, resolve(ROOT, 'tools/cache/osm/ile-de-france-latest.osm.pbf')], { stdio: 'ignore' })
execFileSync('osmium', ['tags-filter', box, 'a/building', 'w/highway', '--overwrite', '-o', flt], { stdio: 'ignore' })
execFileSync('osmium', ['export', flt, '-f', 'geojsonseq', '--add-unique-id=type_id', '--overwrite', '-o', seq], { stdio: 'ignore' })
interface B { ref: string; id: number; t: Record<string, string>; ring: P[]; cx: number; cz: number; lat: number; lon: number; h: number; why: string[] }
const blds: B[] = [], streets: { name: string; a: P; b: P }[] = []
for await (const l of createInterface({ input: createReadStream(seq) })) {
  const s = l.replace(/^\x1e/, '').trim(); if (!s) continue
  const f = JSON.parse(s), t = f.properties as Record<string, string>, g = f.geometry
  if (t.highway && g.type === 'LineString') {
    if (!MAIN.test(t.highway) && !MAIN_NAME.test(t.name ?? '')) continue
    const c = g.coordinates.map(([lo, la]: number[]) => [X(lo), Z(la)] as P)
    for (let i = 1; i < c.length; i++) streets.push({ name: t.name ?? t.ref ?? t.highway, a: c[i - 1], b: c[i] })
    continue
  }
  if (!t.building || (g.type !== 'Polygon' && g.type !== 'MultiPolygon')) continue
  const num = Number(f.id.slice(1)), isWay = num % 2 === 0, id = isWay ? num / 2 : (num - 1) / 2
  const ref = `${isWay ? 'way' : 'relation'}/${id}`
  const outer: number[][] = g.type === 'Polygon' ? g.coordinates[0] : g.coordinates[0][0]
  const ring = outer.map(([lo, la]) => [X(lo), Z(la)] as P)
  if (area(ring) < MIN_AREA) continue
  let cx = 0, cz = 0; for (const [x, z] of ring) { cx += x; cz += z }
  cx /= ring.length; cz /= ring.length
  const h = parseFloat(t.height) || (parseFloat(t['building:levels']) ? parseFloat(t['building:levels']) * LEVEL_M : 0)
  blds.push({ ref, id, t, ring, cx, cz, lat: CENTRE.lat + cz / 111320, lon: CENTRE.lon + cx / 73270, h, why: [] })
}
rmSync(dir, { recursive: true, force: true })

// ---- filter ----
const kept: (B & { street: string; sp: P })[] = []
for (const b of blds) {
  if (taken.has(b.ref) || where.includes(`"${b.ref}"`) || where.includes(`/${b.id}"`)) continue
  if (takenPts.some(([x, z]) => Math.hypot(x - b.cx, z - b.cz) < 30)) continue
  const year = parseInt(b.t.start_date ?? b.t['building:start_date'] ?? '')
  const central = Math.hypot(b.cx, b.cz) < CENTRE_R
  const tall = b.h >= (central ? CENTRE_TALL_M : TALL_M)
  const lv = parseFloat(b.t['building:levels'] ?? '') || 0
  const storeys = lv >= (central ? CENTRE_LEVELS : MID_LEVELS)
  const modern = central ? (year >= CENTRE_MODERN_YEAR || storeys) : (storeys || year >= MODERN_YEAR || MODERN_TAGS.test(b.t['building:material'] ?? b.t['building:facade:material'] ?? ''))
  if (!tall && !modern) continue
  if (tall) b.why.push(`${Math.round(b.h)} m`); if (modern) b.why.push(year ? `${year}` : b.t['building:material'] ?? 'modern')
  let best = Infinity, st = '', sp: P = [0, 0]
  for (const s of streets) for (const p of b.ring) {
    const d = segDist(p, s.a, s.b)
    if (d < best) { best = d; st = s.name; sp = p }
  }
  if (best > FRONT_M) continue
  kept.push({ ...b, street: st, sp })
}
// untagged-height neighbours inside a qualifying cluster come along (Boulogne: the Pont de Sèvres towers)
const cell = (x: number, z: number): string => `${Math.floor(x / CLUSTER_M)},${Math.floor(z / CLUSTER_M)}`
const cells = new Set(kept.map((b) => cell(b.cx, b.cz)))
const keptRefs = new Set(kept.map((b) => b.ref))
const extra = blds.filter((b) => !keptRefs.has(b.ref) && !b.h && cells.has(cell(b.cx, b.cz)) && area(b.ring) > 400 && !taken.has(b.ref)
  && !b.t.amenity && !b.t.name && kept.some((k) => Math.hypot(k.cx - b.cx, k.cz - b.cz) < NEIGH_M))
  .map((b) => ({ ...b, street: '', sp: [b.cx, b.cz] as P, why: ['untagged, in cluster'] }))

// ---- write ----
const all = [...kept, ...extra].sort((a, b) => cell(a.cx, a.cz).localeCompare(cell(b.cx, b.cz)) || b.h - a.h)
const rows = ['cluster\tway\theight\tlatlon\tstreet\tname\twhy']
const aims = new Map<string, string>()
for (const b of all) {
  const c = cell(b.cx, b.cz).replace(',', '_').replace(/-/g, 'm')
  rows.push(`${c}\t${b.ref}\t${Math.round(b.h)}\t${b.lat.toFixed(5)},${b.lon.toFixed(5)}\t${b.street}\t${b.t.name ?? ''}\t${b.why.join('; ')}`)
  // the aim is the cluster's tallest building, at the point of its ring nearest its street
  if (!aims.has(c) && b.street) aims.set(c, `${name}_${c}=${(CENTRE.lat + b.sp[1] / 111320).toFixed(5)},${(CENTRE.lon + b.sp[0] / 73270).toFixed(5)}`)
}
mkdirSync(resolve(ROOT, 'plans/restyle'), { recursive: true })
writeFileSync(resolve(ROOT, `plans/restyle/${name}.tsv`), rows.join('\n') + '\n')
// per-building targets for tools/paris-looks.py: the footprint (lat,lon) so a photo can mark the building's edges
const ll = ([x, z]: P): [number, number] => [+(CENTRE.lat + z / 111320).toFixed(6), +(CENTRE.lon + x / 73270).toFixed(6)]
writeFileSync(resolve(ROOT, `plans/restyle/${name}.json`), JSON.stringify(all.map((b) => ({
  id: b.id, ref: b.ref, h: Math.round(b.h), name: b.t.name ?? '', street: b.street, why: b.why.join('; '),
  levels: b.t['building:levels'] ?? '', ring: b.ring.map(ll) }))))
console.log(`${kept.length} kept + ${extra.length} cluster neighbours in ${aims.size} clusters → plans/restyle/${name}.tsv`)
console.log([...aims.values()].join(' '))
