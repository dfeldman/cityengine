/**
 * A benchmark building's footprint in the model's frame, from OSM — so scale is given, never guessed.
 *
 *   node --experimental-strip-types tools/benchmark/modeling/plan.ts [id…]     prints each plan
 *
 * The frame is dsl.ts's: origin at the plan's bounding-box centre, front on −z, +x on the right of someone facing
 * the front, so the plan reads like a map turned until the front is at the bottom. One OSM way gives its own ring;
 * several (a relation, or the parts of a stadium or a church) give the convex hull of all of them, which loses a
 * courtyard but keeps the extent — the prompt calls it approximate. Shapes come through tools/osm-shape.ts and
 * its download cache.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { resolveOsm, type Shape } from '../../osm-shape.ts'
import type { XZ } from './dsl.ts'
import { loadBuildings, type Building } from './buildings.ts'

export interface Plan {
  /** [width along x, depth along z], metres */
  size: XZ
  /** the outline, counter-clockwise seen from above, at most ~40 points */
  outline: XZ[]
  /** true when the outline is a hull of several OSM objects rather than one way's ring */
  hull: boolean
  /** degrees the frame was turned to square it to the building: the model’s −z faces compass bearing `front − turn` */
  turn: number
}

const R = 6371008.8
const rad = (d: number): number => (d * Math.PI) / 180

function hull(p: XZ[]): XZ[] {
  const pts = [...p].sort((a, b) => a[0] - b[0] || a[1] - b[1])
  const cr = (o: XZ, a: XZ, b: XZ): number => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const lo: XZ[] = [], hi: XZ[] = []
  for (const q of pts) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q) }
  for (const q of pts.reverse()) { while (hi.length >= 2 && cr(hi[hi.length - 2], hi[hi.length - 1], q) <= 0) hi.pop(); hi.push(q) }
  return [...lo.slice(0, -1), ...hi.slice(0, -1)]
}

/** Douglas–Peucker on a closed ring */
function simplify(ring: XZ[], tol: number): XZ[] {
  if (ring.length <= 4) return ring
  const dp = (pts: XZ[]): XZ[] => {
    if (pts.length <= 2) return pts
    const [a, b] = [pts[0], pts[pts.length - 1]]
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1e-9
    let worst = 0, at = 0
    for (let i = 1; i < pts.length - 1; i++) {
      const d = Math.abs((b[0] - a[0]) * (a[1] - pts[i][1]) - (a[0] - pts[i][0]) * (b[1] - a[1])) / L
      if (d > worst) { worst = d; at = i }
    }
    return worst <= tol ? [a, b] : [...dp(pts.slice(0, at + 1)).slice(0, -1), ...dp(pts.slice(at))]
  }
  // split at the point farthest from the first, so the closed ring has two open halves
  let far = 0
  ring.forEach((p, i) => { if (Math.hypot(p[0] - ring[0][0], p[1] - ring[0][1]) > Math.hypot(ring[far][0] - ring[0][0], ring[far][1] - ring[0][1])) far = i })
  const a = dp(ring.slice(0, far + 1)), b = dp([...ring.slice(far), ring[0]])
  return [...a.slice(0, -1), ...b.slice(0, -1)]
}

/** degrees (−45, 45] to turn the plan by so its minimum-area bounding rectangle is axis-aligned */
function squareUp(ring: XZ[]): number {
  const h = hull(ring)
  let best = { a: 0, area: Infinity }
  for (let i = 0; i < h.length; i++) {
    const [ax, az] = h[i], [bx, bz] = h[(i + 1) % h.length]
    const th = Math.atan2(bz - az, bx - ax), c = Math.cos(-th), s = Math.sin(-th)
    const xs = h.map(([x, z]) => x * c - z * s), zs = h.map(([x, z]) => x * s + z * c)
    const ar = (Math.max(...xs) - Math.min(...xs)) * (Math.max(...zs) - Math.min(...zs))
    if (ar < best.area - 1e-6) best = { a: th, area: ar }
  }
  let deg = (best.a * 180) / Math.PI
  while (deg > 45) deg -= 90
  while (deg <= -45) deg += 90
  return deg
}

const area = (p: XZ[]): number => p.reduce((s, a, i) => { const b = p[(i + 1) % p.length]; return s + a[0] * b[1] - b[0] * a[1] }, 0) / 2

/**
 * The OSM geometry, from our own copy once fetched: osm-shape.ts asks Overpass first every time, and Overpass
 * answering 429 cost minutes a run. A download cache under tools/cache, keyed by the building and its ids.
 */
async function shapesFor(b: Building): Promise<Map<string, Shape>> {
  const dir = resolve(import.meta.dirname, '..', '..', 'cache', 'benchmark-osm')
  const file = resolve(dir, `${b.id}.json`)
  if (existsSync(file)) {
    const saved = JSON.parse(readFileSync(file, 'utf8')) as { ids: string[]; shapes: Shape[] }
    if (saved.ids.join() === b.osm.join()) return new Map(saved.shapes.map((s) => [s.id, s]))
  }
  const got = await resolveOsm(b.osm)
  mkdirSync(dir, { recursive: true })
  writeFileSync(file, JSON.stringify({ ids: b.osm, shapes: [...got.values()] }))
  return got
}

export async function planFor(b: Building): Promise<Plan> {
  if (b.rect) {
    const [w, d] = b.rect
    return { size: [w, d], outline: [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]], hull: true, turn: 0 }
  }
  const shapes = await shapesFor(b)
  const rings = b.osm.map((id) => shapes.get(id)?.ring ?? []).filter((r) => r.length >= 3)
  if (rings.length === 0) throw new Error(`${b.id}: no OSM geometry for ${b.osm.join(', ')}`)
  const all = rings.flat()
  const lat0 = all.reduce((s, p) => s + p[0], 0) / all.length, lon0 = all.reduce((s, p) => s + p[1], 0) / all.length
  // compass unit vectors in (east, north): u(b) = (sin b, cos b). +x points to bearing front−90, −z to the front.
  const th = rad(b.front)
  const ux: XZ = [Math.sin(th - Math.PI / 2), Math.cos(th - Math.PI / 2)], uf: XZ = [Math.sin(th), Math.cos(th)]
  const local = ([la, lo]: [number, number]): XZ => {
    const e = rad(lo - lon0) * R * Math.cos(rad(lat0)), n = rad(la - lat0) * R
    return [e * ux[0] + n * ux[1], -(e * uf[0] + n * uf[1])]
  }
  const one = rings.length === 1 && b.osm.length === 1 && b.osm[0].startsWith('way/')
  let ring = one ? rings[0].map(local) : hull(all.map(local))
  if (one && ring.length > 1 && Math.hypot(ring[0][0] - ring[ring.length - 1][0], ring[0][1] - ring[ring.length - 1][1]) < 0.01) ring = ring.slice(0, -1)
  if (area(ring) < 0) ring.reverse()
  // square the frame to the building: turn by the angle of its minimum-area bounding rectangle, when that is a small
  // correction to the given bearing (cities' grids are not true north, and the bearings are read off a map). A model
  // can then write axis-aligned boxes instead of rotating every one.
  let turn = squareUp(ring)
  if (Math.abs(turn) > 20) turn = 0
  if (turn) ring = ring.map(([x, z]) => { const a = (-turn * Math.PI) / 180; return [x * Math.cos(a) - z * Math.sin(a), x * Math.sin(a) + z * Math.cos(a)] as XZ })
  let tol = 0.5, out = simplify(ring, tol)
  while (out.length > 40) out = simplify(ring, (tol *= 1.5))
  const xs = out.map((p) => p[0]), zs = out.map((p) => p[1])
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cz = (Math.min(...zs) + Math.max(...zs)) / 2
  const r1 = (n: number): number => Math.round(n * 10) / 10
  return {
    size: [r1(Math.max(...xs) - Math.min(...xs)), r1(Math.max(...zs) - Math.min(...zs))],
    outline: out.map(([x, z]) => [r1(x - cx), r1(z - cz)]),
    hull: !one,
    turn: Math.round(turn * 10) / 10,
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const ids = process.argv.slice(2)
  for (const b of loadBuildings().filter((x) => ids.length === 0 || ids.includes(x.id))) {
    const p = await planFor(b)
    console.log(`${b.id.padEnd(24)} ${String(p.size[0]).padStart(6)} × ${String(p.size[1]).padEnd(6)} h ${String(b.height).padEnd(5)} ${p.outline.length} pts${p.hull ? ' (hull)' : ''}`)
  }
}
