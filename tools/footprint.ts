/**
 * A building's REAL outline, read from the baked city on disk (the bake-private v2 tiles, tools/bake-files.ts), in the frame a builder is fitted in.
 *
 * Every tool that renders one builder on its own has to answer the same question — what plot does it stand
 * on — and getting it wrong is not a cosmetic matter. `?model=` builds on a square plot unless it is handed
 * something better (`src/model-showcase.ts`), so a block-face building came out a slender tower, a flatiron
 * came out a box, and a 17-corner plan came out a rectangle. An experiment judged on that is judging the
 * harness, and a modelling agent iterating against it is correcting a building that was never wrong.
 *
 * The lookup is offline on purpose: `?model=` loads no city, so nothing here may depend on a running one.
 *
 *     const plan = await planFor('san-francisco', 256067734)
 *     // { hx, hz, ring: [{x, z}, …] }  ready for window.__rebuild
 *
 * Three sources, in order, because the obvious one misses the buildings that matter most:
 *   1. the building's own packed footprint;
 *   2. the hull of its `building:part`s, where `tools/bake.ts` dropped an outline its parts cover
 *      (`superseded`, BUGS.md #100 — Salesforce Tower is ten of them and has no ring of its own);
 *   3. nothing, and the caller keeps whatever fallback it had.
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { Projection } from '../src/city/geo.ts'
import { TILE, type CityIndex } from '../src/city/tiles.ts'
import { readV2, readV2Tile } from './bake-files.ts'

const ROOT = resolve(import.meta.dirname, '..')

export interface Plan {
  /** half-length along the long axis (local x) and half-width across it, metres */
  hx: number
  hz: number
  /** the outline in the model's own frame, anticlockwise — what `Fit.ring` wants */
  ring: { x: number; z: number }[]
  /** how many corners the real plan has: 4 means the rectangle was not a lie */
  corners: number
  /** where it came from, for a tool that wants to say so */
  source: 'outline' | 'parts'
}

interface PackedLike { id: number; ring: number[]; partOf?: number; height?: number }

const tiles = new Map<string, PackedLike[]>()
let proj: Projection | null = null
let index: CityIndex | null = null
let city = ''

function load(id: string): void {
  if (city === id) return
  // the v2 index, checked fresh (it throws, saying what to bake, when the city is not baked or is stale)
  index = readV2(id, false).index
  proj = new Projection(index.origin)
  tiles.clear()
  city = id
}

function tileAt(tx: number, tz: number): PackedLike[] {
  const key = `${tx}_${tz}`
  const got = tiles.get(key)
  if (got) return got
  // (load() has checked the bake fresh)
  const out = ((readV2Tile(city, tx, tz) as { buildings?: PackedLike[] } | null)?.buildings ?? [])
  tiles.set(key, out)
  return out
}

/** The convex hull of a set of points — the same shape render/landmarks.ts fits a union of parts to. */
function hull(pts: [number, number][]): [number, number][] {
  if (pts.length < 3) return pts
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1])
  const cross = (o: [number, number], a: [number, number], b: [number, number]): number =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const lower: [number, number][] = []
  for (const q of p) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop(); lower.push(q) }
  const upper: [number, number][] = []
  for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop(); upper.push(q) }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)]
}

/**
 * A ring in world metres → the minimum-area box round it and the outline in that box's frame.
 * `render/landmarks.ts inFrame`: world = centre + (x cos θ + z sin θ, −x sin θ + z cos θ).
 */
export function frameRing(pts: [number, number][]): Plan {
  let cx = 0
  let cz = 0
  for (const [x, z] of pts) { cx += x; cz += z }
  cx /= pts.length
  cz /= pts.length
  let best: { area: number; x0: number; x1: number; z0: number; z1: number; c: number; s: number } | null = null
  for (let a = 0; a < 180; a += 1) {
    const th = (a * Math.PI) / 180
    const c = Math.cos(th)
    const s = Math.sin(th)
    let x0 = Infinity
    let x1 = -Infinity
    let z0 = Infinity
    let z1 = -Infinity
    for (const [x, z] of pts) {
      const dx = x - cx
      const dz = z - cz
      const X = dx * c - dz * s
      const Z = dx * s + dz * c
      x0 = Math.min(x0, X); x1 = Math.max(x1, X); z0 = Math.min(z0, Z); z1 = Math.max(z1, Z)
    }
    const area = (x1 - x0) * (z1 - z0)
    if (!best || area < best.area) best = { area, x0, x1, z0, z1, c, s }
  }
  const b = best!
  const mx = (b.x0 + b.x1) / 2
  const mz = (b.z0 + b.z1) / 2
  const ring = pts.map(([x, z]) => {
    const dx = x - cx
    const dz = z - cz
    return { x: dx * b.c - dz * b.s - mx, z: dx * b.s + dz * b.c - mz }
  })
  let twice = 0
  for (let i = 0; i < ring.length; i++) {
    const j = (i + 1) % ring.length
    twice += ring[i].x * ring[j].z - ring[j].x * ring[i].z
  }
  return {
    hx: (b.x1 - b.x0) / 2,
    hz: (b.z1 - b.z0) / 2,
    ring: twice < 0 ? ring.reverse() : ring,
    corners: ring.length,
    source: 'outline',
  }
}

/**
 * The plan for one OSM way id. `near` is a lat/lon to start the tile search from; without one the whole
 * baked city is scanned, which is 100k files and slow, so pass it when you have it (the archetype CSV has
 * lat/lon for every building the bake saw).
 */
export function planFor(cityId: string, id: number, near?: { lat: number; lon: number }): Plan | null {
  load(cityId)
  const around: PackedLike[] = []
  if (near) {
    const p = proj!.toLocal(near)
    const tx = Math.floor(p.x / TILE)
    const tz = Math.floor(p.z / TILE)
    for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) around.push(...tileAt(tx + dx, tz + dz))
  } else {
    for (const t of index!.tiles) if (t.buildings) around.push(...tileAt(t.tx, t.tz))
  }
  const own = around.find((b) => b.id === id)
  if (own && own.ring.length >= 6) {
    const pts: [number, number][] = []
    for (let i = 0; i + 1 < own.ring.length; i += 2) pts.push([own.ring[i], own.ring[i + 1]])
    return frameRing(pts)
  }
  // a superseded outline: the building IS its parts, and the fit is their hull
  const pts: [number, number][] = []
  for (const b of around) {
    if (b.partOf !== id) continue
    for (let i = 0; i + 1 < b.ring.length; i += 2) pts.push([b.ring[i], b.ring[i + 1]])
  }
  if (pts.length < 3) return null
  const plan = frameRing(hull(pts))
  plan.source = 'parts'
  return plan
}

/** lat/lon per bare way id, from the bake's archetype table — the cheap way to know which tile to open. */
export function archetypePositions(cityId: string): Map<number, { lat: number; lon: number }> {
  const f = resolve(ROOT, 'docs', `${cityId}-archetypes.csv`)
  const out = new Map<number, { lat: number; lon: number }>()
  if (!existsSync(f)) return out
  for (const line of readFileSync(f, 'utf8').split('\n').slice(1)) {
    const c = line.split(',')
    if (c.length < 3) continue
    out.set(Number(c[0]), { lat: Number(c[1]), lon: Number(c[2]) })
  }
  return out
}
