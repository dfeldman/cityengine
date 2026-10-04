/**
 * BUILDINGS DRAWN INSIDE EACH OTHER (owner, 2026-10-03: "another custom building intersecting a generic building. we
 * should audit for these" — and a run of reports after it, half of them z-fighting where two walls share a plane).
 *
 *   npx tsx tools/building-overlaps.ts [city] [--min=15] [--json=out.json]
 *
 * Two lists, from the baked package (public/cities/<city>/tiles) and the landmark manifests:
 *
 *   1. LANDMARK vs GENERIC — a modelled building (a `procedural` entry that claims OSM buildings: its footprint is the
 *      union of the rings it claims; a standalone lat/lon entry: its rotated box) whose footprint overlaps a baked
 *      building it does not claim, and which the city therefore still draws. One of the two is wrong: the model
 *      should claim it, or a placeholder should hide it, or (a podium, a building on a roof) the heights keep them
 *      apart and it is fine — pairs whose height ranges do not overlap are not listed.
 *   2. GENERIC vs GENERIC — two baked buildings, neither a part of the other, whose footprints overlap: usually OSM
 *      mapping one building twice (an old outline and a new one, a building and an unrelated building:part), which
 *      draws two sets of walls in nearly the same place — the z-fighting family.
 *
 * Overlap is AREA, measured on a 0.5 m raster over each candidate pair; a pair is listed from `--min` square metres
 * (default 15) and 10% of the smaller footprint. Each line gives a lat/lon to go and look at.
 */
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { Projection } from '../src/city/geo.ts'

type P = { x: number; z: number }
interface Baked { id: number; ring: P[]; h: number; minH: number; partOf?: number; x0: number; x1: number; z0: number; z1: number }
interface Entry {
  name?: string; osm?: string | string[]; procedural?: string; restyle?: string; include?: string
  lat?: number; lon?: number; size?: [number, number]; rotateDeg?: number; height?: number; base?: number
}

const args = process.argv.slice(2)
const city = args.find((a) => !a.startsWith('--')) ?? 'san-francisco'
const MIN = Number(args.find((a) => a.startsWith('--min='))?.slice(6) ?? 15)
const jsonOut = args.find((a) => a.startsWith('--json='))?.slice(7)
const ROOT = resolve(import.meta.dirname, '..')

// ---- the baked buildings
const tilesDir = resolve(ROOT, 'public/cities', city, 'tiles')
const index = JSON.parse(readFileSync(resolve(ROOT, 'public/cities', city, 'index.json'), 'utf8')) as { origin?: { lat: number; lon: number } }
const v3 = resolve(ROOT, 'public/cities', city, 'v3/index.json')
const origin = index.origin ?? (existsSync(v3) ? (JSON.parse(readFileSync(v3, 'utf8')) as { origin: { lat: number; lon: number } }).origin : null)
if (!origin) throw new Error('no origin in the city index')
const proj = new Projection(origin)
const buildings = new Map<number, Baked>()
for (const f of readdirSync(tilesDir)) {
  if (!f.endsWith('.json')) continue
  const t = JSON.parse(readFileSync(resolve(tilesDir, f), 'utf8')) as { buildings?: { id: number; ring: number[]; height?: number; minHeight?: number; partOf?: number }[] }
  for (const b of t.buildings ?? []) {
    if (buildings.has(b.id)) continue
    const ring: P[] = []
    for (let i = 0; i < b.ring.length; i += 2) ring.push({ x: b.ring[i], z: b.ring[i + 1] })
    const xs = ring.map((q) => q.x), zs = ring.map((q) => q.z)
    buildings.set(b.id, { id: b.id, ring, h: b.height ?? 10, minH: b.minHeight ?? 0, partOf: b.partOf,
      x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs) })
  }
}

// ---- the manifests
const LM = resolve(ROOT, 'public/landmarks')
function entriesOf(file: string): Entry[] {
  const raw = JSON.parse(readFileSync(file, 'utf8')) as Entry[] | { entries?: Entry[] }
  const list = Array.isArray(raw) ? raw : raw.entries ?? []
  return list.flatMap((e) => (e.include ? entriesOf(resolve(LM, e.include)) : [e]))
}
const entries = entriesOf(resolve(LM, `${city}.json`))
const idsOf = (e: Entry): number[] => (Array.isArray(e.osm) ? e.osm : e.osm ? [e.osm] : []).map((s) => {
  const [k, n] = s.split('/')
  return k === 'relation' ? 2 * Number(n) + 1 : Number(n)
})
// (a RESTYLE is still drawn by the city, in a new style: only a model or a placeholder takes a building away)
const claimed = new Set<number>()
for (const e of entries) if (!e.restyle) for (const id of idsOf(e)) claimed.add(id)
// a part of a claimed outline is claimed with it
const isClaimed = (b: Baked): boolean => claimed.has(b.id) || (b.partOf !== undefined && claimed.has(b.partOf))

// ---- geometry
function inside(r: P[], x: number, z: number): boolean {
  let c = false
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const a = r[i], b = r[j]
    if ((a.z > z) !== (b.z > z) && x < a.x + ((z - a.z) * (b.x - a.x)) / (b.z - a.z)) c = !c
  }
  return c
}
const area = (r: P[]): number => Math.abs(r.reduce((s, p, i) => { const q = r[(i + 1) % r.length]; return s + p.x * q.z - q.x * p.z }, 0)) / 2
const box = (rs: P[][]): { x0: number; x1: number; z0: number; z1: number } => {
  const all = rs.flat()
  return { x0: Math.min(...all.map((q) => q.x)), x1: Math.max(...all.map((q) => q.x)), z0: Math.min(...all.map((q) => q.z)), z1: Math.max(...all.map((q) => q.z)) }
}
/** the area inside both shapes (each a union of rings), and its centre, on a 0.5 m raster */
function overlap(a: P[][], b: P[][]): { area: number; x: number; z: number } {
  const A = box(a), B = box(b)
  const x0 = Math.max(A.x0, B.x0), x1 = Math.min(A.x1, B.x1), z0 = Math.max(A.z0, B.z0), z1 = Math.min(A.z1, B.z1)
  if (x0 >= x1 || z0 >= z1) return { area: 0, x: 0, z: 0 }
  const S = 0.5
  let n = 0, sx = 0, sz = 0
  for (let x = x0 + S / 2; x < x1; x += S) for (let z = z0 + S / 2; z < z1; z += S) {
    if (a.some((r) => inside(r, x, z)) && b.some((r) => inside(r, x, z))) { n++; sx += x; sz += z }
  }
  return { area: n * S * S, x: n ? sx / n : 0, z: n ? sz / n : 0 }
}
const at = (x: number, z: number): string => { const ll = proj.toLatLon({ x, z }); return `${ll.lat.toFixed(6)}, ${ll.lon.toFixed(6)}` }

// ---- a spatial index over the unclaimed, drawn buildings
const CELL = 40
const grid = new Map<string, Baked[]>()
const drawn = [...buildings.values()].filter((b) => !isClaimed(b))
for (const b of drawn) {
  for (let i = Math.floor(b.x0 / CELL); i <= Math.floor(b.x1 / CELL); i++) for (let j = Math.floor(b.z0 / CELL); j <= Math.floor(b.z1 / CELL); j++) {
    const k = `${i},${j}`
    const l = grid.get(k)
    if (l) l.push(b); else grid.set(k, [b])
  }
}
function near(bx: { x0: number; x1: number; z0: number; z1: number }): Set<Baked> {
  const out = new Set<Baked>()
  for (let i = Math.floor(bx.x0 / CELL); i <= Math.floor(bx.x1 / CELL); i++) for (let j = Math.floor(bx.z0 / CELL); j <= Math.floor(bx.z1 / CELL); j++) {
    for (const b of grid.get(`${i},${j}`) ?? []) if (!(b.x1 < bx.x0 || b.x0 > bx.x1 || b.z1 < bx.z0 || b.z0 > bx.z1)) out.add(b)
  }
  return out
}

interface Row { kind: 'landmark' | 'generic'; a: string; b: number; area: number; frac: number; at: string }
const rows: Row[] = []

// ---- 1. landmarks against what the city still draws
/** areas, not buildings: a marina, a plaza deck, a park — they stand among buildings by design */
const AREA = /marina|harbo|yacht|plaza|park|deck|podium|court|garden|bridge|pier|square|steps|labyrinth|paddock/i
for (const e of entries) {
  if (!e.procedural || (e as { kind?: string }).kind || AREA.test(`${e.name ?? ''} ${e.procedural}`)) continue
  let shape: P[][]
  const ids = idsOf(e)
  if (ids.length) {
    shape = ids.map((id) => buildings.get(id)?.ring).filter((r): r is P[] => !!r)
    if (!shape.length) continue
  } else if (e.lat !== undefined && e.lon !== undefined && e.size) {
    const c = proj.toLocal({ lat: e.lat, lon: e.lon })
    const r = ((e.rotateDeg ?? 0) * Math.PI) / 180
    const cos = Math.cos(r), sin = Math.sin(r)
    const [hx, hz] = [e.size[0] / 2, e.size[1] / 2]
    // model frame → world as render/landmarks.ts places it (Babylon's rotation.y)
    shape = [[[-hx, -hz], [hx, -hz], [hx, hz], [-hx, hz]].map(([x, z]) => ({ x: c.x + x * cos + z * sin, z: c.z - x * sin + z * cos }))]
  } else continue
  const lo = e.base ?? 0, hi = lo + (e.height ?? 20)
  for (const b of near(box(shape))) {
    if (b.minH >= hi - 0.5 || b.h <= lo + 0.5) continue
    const o = overlap(shape, [b.ring])
    const frac = o.area / Math.max(1, area(b.ring))
    if (o.area >= MIN && frac >= 0.1) rows.push({ kind: 'landmark', a: e.name ?? e.procedural, b: b.id, area: Math.round(o.area), frac: Math.round(frac * 100) / 100, at: at(o.x, o.z) })
  }
}

// ---- 2. generic against generic
const seen = new Set<string>()
for (const a of drawn) {
  for (const b of near(a)) {
    if (b.id <= a.id) continue
    // a part and its outline, or two parts of one building, are meant to share ground
    if (a.partOf === b.id || b.partOf === a.id || (a.partOf !== undefined && a.partOf === b.partOf)) continue
    if (a.minH >= b.h - 0.5 || b.minH >= a.h - 0.5) continue
    const key = `${a.id}:${b.id}`
    if (seen.has(key)) continue
    seen.add(key)
    const o = overlap([a.ring], [b.ring])
    const frac = o.area / Math.max(1, Math.min(area(a.ring), area(b.ring)))
    if (o.area >= MIN && frac >= 0.1) rows.push({ kind: 'generic', a: String(a.id), b: b.id, area: Math.round(o.area), frac: Math.round(frac * 100) / 100, at: at(o.x, o.z) })
  }
}

rows.sort((p, q) => q.area - p.area)
for (const kind of ['landmark', 'generic'] as const) {
  const list = rows.filter((r) => r.kind === kind)
  console.log(`\n== ${kind === 'landmark' ? 'LANDMARK vs GENERIC' : 'GENERIC vs GENERIC'} — ${list.length}`)
  for (const r of list) console.log(`  ${String(r.area).padStart(6)} m²  ${String(Math.round(r.frac * 100)).padStart(3)}%  ${r.a}  ×  ${r.b}   (${r.at})`)
}
if (jsonOut) writeFileSync(jsonOut, JSON.stringify(rows, null, 1))
