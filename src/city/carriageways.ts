/**
 * Where the carriageways are: every surface street's centreline segments with their half-width and pavement,
 * bucketed, so "is this point in the road?" and "which street's pavement is this on?" are cheap. Shared by
 * everything that seats a thing at the kerb — the city's listed street trees (city/plantings.ts), hydrants and
 * other furniture (render/city.ts) — because a street mapped as two parallel ways puts one way's kerb in the
 * middle of the other, and only a test against all of them catches it (BUGS.md #45, #47).
 */
import { onSurface, unpackPoints, type PackedEdge } from './package.ts'

export interface Seg { ax: number; az: number; bx: number; bz: number; half: number; walk: number; edge: number }
export interface Near { s: Seg; d: number; t: number; side: number }

const CELL = 24

export class Carriageways {
  private readonly grid = new Map<string, Seg[]>()

  /**
   * `includeFoot` takes the FOOTWAYS in as well, which the kerb-side callers must not have — a hydrant is
   * placed relative to a street, and a park trail is not a street. It exists for the opposite question,
   * "is this point on something built?" (`onPaving`), where a concrete trail counts as much as a road:
   * BUGS.md #196, small plants growing up through the asphalt in Golden Gate Park.
   */
  constructor(edges: Pick<PackedEdge, 'id' | 'points' | 'width' | 'walk' | 'foot' | 'tunnel' | 'layer' | 'bridge' | 'kind'>[],
    includeFoot = false) {
    for (const e of edges) {
      if ((e.foot && !includeFoot) || !onSurface(e)) continue
      const p = unpackPoints(e.points)
      for (let i = 1; i < p.length; i++) {
        const s: Seg = { ax: p[i - 1].x, az: p[i - 1].z, bx: p[i].x, bz: p[i].z, half: e.width / 2, walk: e.walk, edge: e.id }
        const r = s.half + s.walk + 3
        for (let gi = Math.floor((Math.min(s.ax, s.bx) - r) / CELL); gi <= Math.floor((Math.max(s.ax, s.bx) + r) / CELL); gi++) {
          for (let gj = Math.floor((Math.min(s.az, s.bz) - r) / CELL); gj <= Math.floor((Math.max(s.az, s.bz) + r) / CELL); gj++) {
            const k = `${gi},${gj}`
            const l = this.grid.get(k) ?? []
            l.push(s)
            this.grid.set(k, l)
          }
        }
      }
    }
  }

  /** every segment whose corridor might reach the point, with the distance to it, where along, and which side */
  near(x: number, z: number): Near[] {
    const out: Near[] = []
    for (const s of this.grid.get(`${Math.floor(x / CELL)},${Math.floor(z / CELL)}`) ?? []) {
      const dx = s.bx - s.ax
      const dz = s.bz - s.az
      const L2 = dx * dx + dz * dz
      if (L2 < 1e-4) continue
      const t = Math.max(0, Math.min(1, ((x - s.ax) * dx + (z - s.az) * dz) / L2))
      const side = Math.sign(dx * (z - s.az) - dz * (x - s.ax)) || 1
      out.push({ s, d: Math.hypot(x - (s.ax + dx * t), z - (s.az + dz * t)), t, side })
    }
    return out
  }

  /**
   * Somewhere STREET FURNITURE must not stand (owner, 2026-10-01: "benches and utility poles in the middle of the
   * street"): in any carriageway, or in a MEDIAN — a carriageway on each side, running parallel, each within `reach` of
   * its edge. A road OSM maps as two one-way ways puts each way's inner "pavement" in the median, the middle of the
   * road; Geary's island had newsracks and a bin. Whoever placed the thing (our kerbside rules or an OSM point), the
   * test is the same. A corner, with the cross street at right angles, still allows it.
   */
  noFurniture(x: number, z: number, reach = 4): boolean { return this.whyNoFurniture(x, z, reach) !== null }

  /** `noFurniture`, and why: in a road, or in a median */
  whyNoFurniture(x: number, z: number, reach = 4): 'road' | 'median' | null {
    const near = this.near(x, z).filter((n) => n.d < n.s.half + reach)
    if (near.some((n) => n.d < n.s.half + 0.15)) return 'road'
    // a carriageway on EACH side, running the same way (either direction), each within `reach` of its edge: a median
    for (const a of near) {
      const ax = a.s.bx - a.s.ax, az = a.s.bz - a.s.az
      const al = Math.hypot(ax, az) || 1
      const sideA = Math.sign(ax * (z - a.s.az) - az * (x - a.s.ax))
      for (const b of near) {
        if (b.s.edge === a.s.edge) continue
        const bx = b.s.bx - b.s.ax, bz = b.s.bz - b.s.az
        if (Math.abs((ax * bx + az * bz) / (al * (Math.hypot(bx, bz) || 1))) < 0.85) continue
        // which side of a's line b's nearest point is on
        const t = b.t
        const qx = b.s.ax + bx * t, qz = b.s.az + bz * t
        const crossB = (ax * (qz - a.s.az) - az * (qx - a.s.ax)) / al
        // …and genuinely BESIDE it — two carriageways apart, not the next piece of the same street round a slight bend
        // at a junction, which is nearly on a's own line (that was half of what this took out on Nob Hill's plain grid)
        if (Math.abs(crossB) < a.s.half + b.s.half + 0.5) continue
        // the point is BETWEEN the two lines: b lies on the point's own side of a, further out than the point (2026-10-17:
        // this asked for opposite sides, which a point between two carriageways never is — the median rule caught nothing,
        // and Drumm Street's kerbside hydrant stood on the strip between its two one-way carriageways)
        const sideB = Math.sign(crossB)
        const crossP = (ax * (z - a.s.az) - az * (x - a.s.ax)) / al
        if (sideA !== 0 && sideA === sideB && Math.abs(crossP) < Math.abs(crossB)) return 'median'
      }
    }
    return null
  }

  /**
   * The nearest point ON A PAVEMENT to (x, z): between a street's kerb (0.5 m in from it) and its pavement's outer edge,
   * clear of every carriageway — for a pole (owner, 2026-10-14: "street sign poles are always affixed to the sidewalk.
   * in our game, they are usually a short distance away from the sidewalk"; and Muni stops standing in the traffic
   * lane). Clear of the carriageways was the old test, and it is not enough: at a big or slanted junction the corner
   * between the kerb lines is open asphalt that is no street's carriageway, and a pole there stood in the road. A point
   * already on a pavement stays; a street with no pavement does not count; with none near, the point is returned as
   * it is.
   */
  toPavement(x: number, z: number): { x: number; z: number } {
    if (this.onPavement(x, z)) return { x, z }
    // candidates: onto each nearby street's pavement band, and — at a corner, where one street's pavement is in the
    // other's carriageway — onto one then the other; the nearest that is truly on a pavement wins
    const near = this.near(x, z).filter((n) => n.s.walk > 0.5)
    let best: { x: number; z: number } | null = null
    let bestD = Infinity
    const take = (q: { x: number; z: number }): void => {
      const d = Math.hypot(q.x - x, q.z - z)
      if (d < bestD && d < 16 && this.onPavement(q.x, q.z)) { bestD = d; best = q }
    }
    for (const a of near) {
      const qa = this.ontoBand(a, x, z)
      take(qa)
      for (const n of this.near(qa.x, qa.z)) if (n.s.walk > 0.5 && n.s.edge !== a.s.edge) take(this.ontoBand(n, qa.x, qa.z))
    }
    return best ?? { x, z }
  }

  /** on a pavement: in no carriageway, and within some street's pavement band */
  onPavement(x: number, z: number): boolean {
    const near = this.near(x, z)
    if (near.some((n) => n.d < n.s.half + 0.3)) return false
    return near.some((n) => n.s.walk > 0.5 && n.d >= n.s.half + 0.3 && n.d <= n.s.half + n.s.walk + 0.05)
  }

  /** (x, z) moved along the perpendicular from `n`'s street onto its pavement band (0.5 m in from the kerb at least) */
  private ontoBand(n: Near, x: number, z: number): { x: number; z: number } {
    const { s } = n
    const dx = s.bx - s.ax
    const dz = s.bz - s.az
    const l2 = dx * dx + dz * dz || 1e-9
    const t = Math.max(0, Math.min(1, ((x - s.ax) * dx + (z - s.az) * dz) / l2))
    const qx = s.ax + dx * t
    const qz = s.az + dz * t
    let ux = x - qx
    let uz = z - qz
    const ul = Math.hypot(ux, uz)
    if (ul < 1e-3) { const l = Math.sqrt(l2); ux = (-dz / l) * n.side; uz = (dx / l) * n.side } else { ux /= ul; uz /= ul }
    const want = Math.min(s.half + s.walk - 0.2, Math.max(s.half + 0.5, ul))
    return { x: qx + ux * want, z: qz + uz * want }
  }

  /** in some street's carriageway (within `margin` of its edge) */
  inside(x: number, z: number, margin = 0.3): boolean {
    return this.near(x, z).some((n) => n.d < n.s.half + margin)
  }

  /**
   * On anything BUILT — the carriageway or the pavement beside it. The wider test of the two, and the one a
   * planter wants: nothing grows through asphalt or concrete, whichever of the two it is. Built with
   * `includeFoot` it also covers the park's trails, which are footways and are exactly where the owner saw
   * plants standing in the path (BUGS.md #196, 37.759199 -122.509773).
   */
  onPaving(x: number, z: number, margin = 0.4): boolean {
    return this.near(x, z).some((n) => n.d < n.s.half + n.s.walk + margin)
  }
}
