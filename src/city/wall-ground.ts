/**
 * THE GROUND AT A QUAY WALL (owner, 2026-11-09: "because they aren't tesselated finely enough, they really break the rendering").
 *
 * A wall's job is to interrupt the ground. The shipped ground is a grid of posts (1 m in a deck zone's tiles), read bilinearly, and
 * drawn in triangles a metre or more across: between the last post on the low side and the first on the high side it is a SLOPE,
 * which stood out of the wall's face in front (a wedge) or left a trench behind its cap (a slot). Here every point within a wall's
 * reach reads the ground on ITS OWN side, clear of the post cell the wall cuts: the high side flat up to the stone, the low side
 * flat up to its toe, the step at the middle of the stone. The renderer refines its triangles across that step
 * (render/city.ts `refineAtWalls`) so the step stays inside the stone.
 *
 * The stone (render/quays.ts, THE SHIPPED WALLS): QW_THICK on the high side (the RIGHT of a → b), and a deck zone's wall (parapet
 * set) QW_DECK_TOE more on the low side.
 */
import type { QuayWall } from './package.ts'
import type { Terrain } from './terrain.ts'

/** what refineAtWalls needs of a mesh builder (render/buildings.ts MeshBuilder) */
export interface Mesh3 { positions: number[]; normals: number[]; uvs: number[]; colors: number[]; indices: number[] }

/** off: the ground read as shipped */
export const WG_ON = true
/** the stone's thickness on the high side, and a deck zone's toe on the low side (render/quays.ts QW_THICK, QW_DECK_TOE) */
export const WG_THICK = 0.6, WG_TOE = 1.1
/** a point this far past the stone (m, and at least WG_CLEAR_CELLS post cells) reads the ground as shipped; nearer, it reads it there */
export const WG_CLEAR = 1.5, WG_CLEAR_CELLS = 1.45
/** not over ground shipped coarser than this (m): a 20 m post cell is no wall's to fix */
export const WG_MAX_STEP = 4
/** a piece reaches this far past its ends along its line (m; QW_OVERLAP and a little) */
export const WG_END = 0.3
/** the index's cell (m) */
const WG_CELL = 8

interface Piece { ax: number; az: number; ux: number; uz: number; len: number; toe: number }

export class WallGround {
  private readonly cells = new Map<number, Piece[]>()
  readonly count: number
  /** `land`: how much further the reach runs on the high side (m) — the water's cut (render/city.ts dropDryWater) stops a river ring at
   *  the wall well inland of the stone; the ground's reads keep 0 */
  constructor(walls: readonly QuayWall[], readonly land = 0) {
    const reach = WG_TOE + WG_CLEAR + WG_MAX_STEP * WG_CLEAR_CELLS + land
    let n = 0
    for (const w of walls) {
      const len = Math.hypot(w.bx - w.ax, w.bz - w.az)
      if (len < 0.2) continue
      const p: Piece = { ax: w.ax, az: w.az, ux: (w.bx - w.ax) / len, uz: (w.bz - w.az) / len, len, toe: w.parapet !== undefined ? WG_TOE : 0 }
      n++
      for (let cx = Math.floor((Math.min(w.ax, w.bx) - reach) / WG_CELL); cx <= Math.floor((Math.max(w.ax, w.bx) + reach) / WG_CELL); cx++)
        for (let cz = Math.floor((Math.min(w.az, w.bz) - reach) / WG_CELL); cz <= Math.floor((Math.max(w.az, w.bz) + reach) / WG_CELL); cz++) {
          const k = WallGround.key(cx, cz)
          const l = this.cells.get(k)
          if (l) l.push(p); else this.cells.set(k, [p])
        }
    }
    this.count = n
  }
  private static key(cx: number, cz: number): number { return ((cx & 0xffff) << 16) | (cz & 0xffff) }
  /** the nearest piece whose reach (`clear` m past the stone) holds the point: its along-line t (m) and signed s (+ = high side) */
  private find(x: number, z: number, clear: number): { p: Piece; s: number } | null {
    const l = this.cells.get(WallGround.key(Math.floor(x / WG_CELL), Math.floor(z / WG_CELL)))
    if (!l) return null
    let best: Piece | null = null, bs = 0, bd = Infinity
    for (const p of l) {
      const dx = x - p.ax, dz = z - p.az, t = dx * p.ux + dz * p.uz
      if (t < -WG_END || t > p.len + WG_END) continue
      const s = dx * p.uz - dz * p.ux
      if (s > WG_THICK + clear + this.land || s < -p.toe - clear) continue
      const d = Math.abs(s - (WG_THICK - p.toe) / 2)
      if (d < bd) { bd = d; best = p; bs = s }
    }
    return best ? { p: best, s: bs } : null
  }
  private clearFor(step: number): number { return Math.max(WG_CLEAR, step * WG_CLEAR_CELLS) }
  /** where to read the ground for a point near a wall (null: where it is), for ground shipped at `step` m */
  readAt(x: number, z: number, step: number): [number, number] | null {
    if (step > WG_MAX_STEP) return null
    const c = this.clearFor(step), f = this.find(x, z, c)
    if (!f) return null
    const { p, s } = f, mid = (WG_THICK - p.toe) / 2
    const to = s >= mid ? Math.max(s, WG_THICK + c) : Math.min(s, -p.toe - c)
    if (to === s) return null
    return [x + p.uz * (to - s), z - p.ux * (to - s)]
  }
  /** signed metres from the walls' steps, + on a high side: the MOST landward over every wall whose reach holds the point (a lower quai
   *  is the river wall's land even where it lies in the upper wall's toe reach), null out of every reach */
  signed(x: number, z: number, step: number): number | null {
    if (step > WG_MAX_STEP) return null
    const l = this.cells.get(WallGround.key(Math.floor(x / WG_CELL), Math.floor(z / WG_CELL)))
    if (!l) return null
    const clear = this.clearFor(step)
    let best: number | null = null
    for (const p of l) {
      const dx = x - p.ax, dz = z - p.az, t = dx * p.ux + dz * p.uz
      if (t < -WG_END || t > p.len + WG_END) continue
      const s = dx * p.uz - dz * p.ux
      if (s > WG_THICK + clear + this.land || s < -p.toe - clear) continue
      const v = s - (WG_THICK - p.toe) / 2
      if (best === null || v > best) best = v
    }
    return best
  }
  /** which side of the nearest wall's step the point is on (+1 high, −1 low), 0 out of every wall's reach */
  side(x: number, z: number, step: number): number {
    if (step > WG_MAX_STEP) return 0
    const f = this.find(x, z, this.clearFor(step))
    return f ? (f.s >= (WG_THICK - f.p.toe) / 2 ? 1 : -1) : 0
  }
}

/**
 * THE GROUND AT A QUAY WALL, DRAWN (owner, 2026-11-09; city/wall-ground.ts reads the ground side by side there). Every triangle of a
 * draped builder within a wall's reach is split (longest-edge bisection, before draping) to WT_NEAR_EDGE m, and one across the
 * wall's step — vertices on both sides of it — on to WT_EDGE m, so the step stands inside the stone, not as a slope out of its face
 * or a trench behind its cap. Nothing changes away from the walls. Returns the triangles added.
 */
export const WT_ON = true, WT_NEAR_EDGE = 4, WT_EDGE = 0.4
/** …and any triangle across a STEEP DROP — a trench wall's top, a tunnel mouth's cut, a road's corridor edge over the ground beside
 *  it (owner, 2026-11-10: "the ground needs more tesselation whenever there is a steep dropoff"): corners differing by WT_DROP_MIN m and
 *  more than WT_DROP_GRADE per metre are split on down to WT_DROP_EDGE m, so the drop is a step, not a ramp of big triangles */
export const WT_TUNE = { drop: true, dropMin: 0.5, dropGrade: 1.0, dropEdge: 0.4, dropScan: 1, dropStepFrac: 0.5, walls: true }
/** (WT_TUNE: drop on/off, WT_DROP_MIN, WT_DROP_GRADE, WT_DROP_EDGE, the scan step along a long edge (m), the walls' own refinement on/off) */
/** triangles refineAtWalls has added so far (the heap report's question: what the walls' fine ground costs) */
export let wallTrianglesAdded = 0
/** `marked`: the triangles split here (out.indices offsets of their first corner) are pushed to it — render/city.ts draws them again as
 *  depth only in the building group, so ground at a drop hides the walls behind it */
export function refineAtWalls(out: Mesh3, terrain: Terrain, marked?: number[]): number {
  const W = terrain.walls
  const D = WT_TUNE
  if (!WT_ON || ((!W || !D.walls) && !D.drop) || out.indices.length === 0 || terrain.flat) return 0
  const P = out.positions, N = out.normals, U = out.uvs, C = out.colors, I = out.indices.splice(0), n0 = I.length / 3
  const mid = (a: number, b: number): number => {
    const k = P.length / 3
    for (let d = 0; d < 3; d++) { P.push((P[a * 3 + d] + P[b * 3 + d]) / 2); N.push((N[a * 3 + d] + N[b * 3 + d]) / 2) }
    for (let d = 0; d < 2; d++) U.push((U[a * 2 + d] + U[b * 2 + d]) / 2)
    for (let d = 0; d < 4; d++) C.push((C[a * 4 + d] + C[b * 4 + d]) / 2)
    return k
  }
  const side = (x: number, z: number): number => W && D.walls ? W.side(x, z, terrain.stepAt(x, z)) : 0
  const hs = new Map<number, number>()
  const hOf = (v: number): number => { let h = hs.get(v); if (h === undefined) { h = terrain.heightAt(P[v * 3], P[v * 3 + 2]); hs.set(v, h) } return h }
  // (a long edge is scanned every D.dropScan m: a drop between two samples that steep, a trench thinner than the triangle)
  // (no finer than half the ground's own post spacing — a bilinear surface has nothing finer to show — unless the drop is a street's
  //  level against the ground: a cut's or a grade's edge is sharp at any spacing)
  const sharp = (v: number): boolean => Math.abs(hOf(v) - terrain.rawHeightAt(P[v * 3], P[v * 3 + 2])) > 0.05
  const steep = (a: number, b: number, l: number): boolean => {
    if (l <= Math.max(D.dropEdge, terrain.stepAt(P[a * 3], P[a * 3 + 2]) * D.dropStepFrac) && !sharp(a) && !sharp(b)) return false
    const ha = hOf(a), hb = hOf(b), d = Math.abs(ha - hb)
    if (d >= D.dropMin && d > D.dropGrade * l) return true
    if (l <= D.dropScan * 1.5) return false
    const n = Math.ceil(l / D.dropScan), st = l / n, ax = P[a * 3], az = P[a * 3 + 2], dx = (P[b * 3] - ax) / n, dz = (P[b * 3 + 2] - az) / n
    let prev = ha
    for (let k = 1; k <= n; k++) {
      const h = k === n ? hb : terrain.heightAt(ax + dx * k, az + dz * k)
      if (Math.abs(h - prev) >= D.dropMin && Math.abs(h - prev) > D.dropGrade * st) return true
      prev = h
    }
    return false
  }
  const len = (a: number, b: number): number => Math.hypot(P[a * 3] - P[b * 3], P[a * 3 + 2] - P[b * 3 + 2])
  const split = (a: number, b: number, c: number, depth: number): void => {
    const ab = len(a, b), bc = len(b, c), ca = len(c, a), m = Math.max(ab, bc, ca)
    if (m > WT_EDGE && depth < 16) {
      // the sides at the corners, the edges' middles and the centre: a wall's reach is ~4 m across, a triangle here up to ~6 m
      const xs = [P[a * 3], P[b * 3], P[c * 3]], zs = [P[a * 3 + 2], P[b * 3 + 2], P[c * 3 + 2]]
      let lo = false, hi = false
      const look = (x: number, z: number): void => { const v = side(x, z); if (v < 0) lo = true; else if (v > 0) hi = true }
      for (let i = 0; i < 3; i++) { look(xs[i], zs[i]); look((xs[i] + xs[(i + 1) % 3]) / 2, (zs[i] + zs[(i + 1) % 3]) / 2) }
      look((xs[0] + xs[1] + xs[2]) / 3, (zs[0] + zs[1] + zs[2]) / 3)
      if ((lo && hi) || ((lo || hi) && m > WT_NEAR_EDGE) || (D.drop && m > D.dropEdge && (steep(a, b, ab) || steep(b, c, bc) || steep(c, a, ca)))) {
        if (m === ab) { const q = mid(a, b); split(a, q, c, depth + 1); split(q, b, c, depth + 1) }
        else if (m === bc) { const q = mid(b, c); split(b, q, a, depth + 1); split(q, c, a, depth + 1) }
        else { const q = mid(c, a); split(c, q, b, depth + 1); split(q, a, b, depth + 1) }
        return
      }
    }
    if (marked && depth > 0) marked.push(out.indices.length)
    out.indices.push(a, b, c)
  }
  for (let i = 0; i < I.length; i += 3) split(I[i], I[i + 1], I[i + 2], 0)
  const added = out.indices.length / 3 - n0
  wallTrianglesAdded += added
  return added
}

