/**
 * Point-in-water, fast (BUGS.md #179).
 *
 * `groundOccluder` asks "is this point wet, and at what level" a few dozen times per terrain cell — five
 * probes per cell, each of which may fan out to nine seam probes (BUGS.md #36) — over every cell of the
 * rideable box. San Francisco: ~577 000 cells, so ~2.6 x 10^7 lookups. Each lookup used to walk EVERY
 * water polygon's ring point by point, and the bay's own ring is ~3 600 points whose bounding box covers
 * the entire city, so nothing rejected it: ~10^11 edge tests, and the occluder took about two minutes of
 * the cold load on its own.
 *
 * The even-odd test with a +x ray only ever cares about edges that STRADDLE the query's z. So each ring is
 * bucketed once by z into rows, and a lookup walks only its own row — about ten edges instead of 3 600.
 * The answer is bit-for-bit the one the linear scan gave: this is an index, not an approximation, so the
 * occluder's geometry is unchanged (it is also the subject of BUGS.md #169 — do not change its shape).
 */

export interface Point { x: number; z: number }

/** one water polygon as the occluder and the quays hold it: outer ring, island holes, bbox, water level */
export interface WetBody {
  ring: Point[]
  holes: Point[][]
  x0: number
  x1: number
  z0: number
  z1: number
  level: number
}

/** a ring bucketed by z: `rows[k]` lists the index `i` of every edge (ring[i], ring[i-1]) crossing row k */
interface RingIndex {
  ring: Point[]
  z0: number
  h: number
  rows: Int32Array[]
}

function indexRing(ring: Point[]): RingIndex {
  let z0 = Infinity
  let z1 = -Infinity
  for (const p of ring) { if (p.z < z0) z0 = p.z; if (p.z > z1) z1 = p.z }
  // roughly one row per edge: enough that a row holds a handful of edges, few enough to build cheaply
  const n = Math.max(1, Math.min(4096, ring.length))
  const span = Math.max(1e-6, z1 - z0)
  const h = span / n
  const counts = new Int32Array(n)
  const row = (z: number): number => Math.min(n - 1, Math.max(0, Math.floor((z - z0) / h)))
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i]
    const b = ring[j]
    if (a.z === b.z) continue // a horizontal edge never straddles a z, and the even-odd test skips it anyway
    const lo = row(Math.min(a.z, b.z))
    const hi = row(Math.max(a.z, b.z))
    for (let k = lo; k <= hi; k++) counts[k]++
  }
  const rows: Int32Array[] = Array.from({ length: n }, (_, k) => new Int32Array(counts[k]))
  const fill = new Int32Array(n)
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i]
    const b = ring[j]
    if (a.z === b.z) continue
    const lo = row(Math.min(a.z, b.z))
    const hi = row(Math.max(a.z, b.z))
    for (let k = lo; k <= hi; k++) rows[k][fill[k]++] = i
  }
  return { ring, z0, h, rows }
}

/** even-odd, against this ring's z row only — identical result to walking every edge */
function insideIndexed(ix: RingIndex, x: number, z: number): boolean {
  const n = ix.rows.length
  const k = Math.floor((z - ix.z0) / ix.h)
  if (k < 0 || k >= n) return false
  const bucket = ix.rows[k]
  const ring = ix.ring
  const last = ring.length - 1
  let hit = false
  for (let e = 0; e < bucket.length; e++) {
    const i = bucket[e]
    const a = ring[i]
    const b = ring[i === 0 ? last : i - 1]
    if ((a.z > z) !== (b.z > z) && x < ((b.x - a.x) * (z - a.z)) / (b.z - a.z) + a.x) hit = !hit
  }
  return hit
}

/**
 * The lowest water level at a point, or null on dry land — the same rule the occluder has always used:
 * OSM maps a river twice over in places, with different lowest banks, so the LOWEST wins (BUGS.md #36).
 */
export function waterLookup(bodies: WetBody[]): (x: number, z: number) => number | null {
  const built = bodies.map((w) => ({ w, ring: indexRing(w.ring), holes: w.holes.map(indexRing) }))
  /*
   * And a broad phase over the bodies themselves. Most probes are on dry land nowhere near water, and each
   * one walked all 49 bodies' bounding boxes — and the occluder asks nine times per dry probe, looking for
   * the thin seam of BUGS.md #36. A 200 m grid of candidate lists answers those in one lookup, and a point
   * outside the water's own bounds answers without touching a body at all.
   */
  const G = 200
  let gx0 = Infinity, gx1 = -Infinity, gz0 = Infinity, gz1 = -Infinity
  for (const w of bodies) {
    gx0 = Math.min(gx0, w.x0); gx1 = Math.max(gx1, w.x1)
    gz0 = Math.min(gz0, w.z0); gz1 = Math.max(gz1, w.z1)
  }
  const cols = bodies.length ? Math.max(1, Math.ceil((gx1 - gx0) / G) + 1) : 0
  const rows = bodies.length ? Math.max(1, Math.ceil((gz1 - gz0) / G) + 1) : 0
  const cells: (typeof built)[] = Array.from({ length: cols * rows }, () => [])
  for (const b of built) {
    const c0 = Math.floor((b.w.x0 - gx0) / G), c1 = Math.floor((b.w.x1 - gx0) / G)
    const r0 = Math.floor((b.w.z0 - gz0) / G), r1 = Math.floor((b.w.z1 - gz0) / G)
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) cells[r * cols + c].push(b)
  }
  return (x: number, z: number): number | null => {
    if (x < gx0 || x > gx1 || z < gz0 || z > gz1) return null
    const here = cells[Math.floor((z - gz0) / G) * cols + Math.floor((x - gx0) / G)]
    if (!here || here.length === 0) return null
    let lv: number | null = null
    for (const b of here) {
      const w = b.w
      if (x < w.x0 || x > w.x1 || z < w.z0 || z > w.z1) continue
      if (!insideIndexed(b.ring, x, z)) continue
      let holed = false
      for (const h of b.holes) if (insideIndexed(h, x, z)) { holed = true; break }
      if (!holed) lv = lv === null || w.level < lv ? w.level : lv
    }
    return lv
  }
}
