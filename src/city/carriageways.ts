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
        const sideB = Math.sign(crossB)
        if (sideA !== 0 && sideB !== 0 && sideA !== sideB) return 'median'
      }
    }
    return null
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
