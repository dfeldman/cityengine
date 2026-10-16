/**
 * IVY, and anything else that grows over a wall: one mantle for every builder (owner, 2026-10-16: "we should come up
 * with a better rendering system for ivy on buildings since it keeps coming up").
 *
 * Before this, each builder that wanted ivy invented it — green boxes in a row (Embarcadero Center), per-cell quads
 * with a hand-tuned ragged top (Bohemian Club), a disabled copy of that (Olympic Club) — and none of them looked
 * like leaves: flat green with straight edges, and gone from a glancing angle. A mantle here is
 *
 *  - an OUTLINE: a ragged edge (three sines and a little noise, so it wanders in big lobes and small ones), the
 *    mantle tapering into the wall at its ends and stopping where the builder says (a door, a hedge);
 *  - two LAYERS: a sheet a few centimetres off the wall, and over it clumps standing further out as shallow boxes,
 *    scattered over it like leaf masses, so it has a thickness and a silhouette when seen along the wall;
 *  - the `foliage` SURFACE (cartoon-material.ts): leaves in the shader — dark gaps, a sheen, clumps of tone — so it
 *    reads as leaves near to and as a mottled green further off, at no cost in triangles.
 *
 * A mantle climbs from the ground (`from: 'ground'`: Boston ivy on a club's lower storeys) or hangs from a parapet
 * (`from: 'top'`: a planter's trailing ivy over a podium wall). Colours are a dark leaf green by default; the
 * shader varies them, so pass one green, not a palette.
 */
import type { MeshBuilder } from '../buildings.ts'
import type { Rgb } from '../models.ts'
import { surfaceTag } from '../cartoon-material.ts'

type P2 = { x: number; z: number }
type V3 = [number, number, number]
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

export const IVY_GREEN: Rgb = [0.21, 0.33, 0.16]

export interface IvyOpts {
  /** climbing from the ground, or hanging from the top */
  from: 'ground' | 'top'
  /** where it grows from: the ground's y for `ground` (usually 0), the parapet's for `top` */
  y: number
  /** how far it reaches from there on average, metres */
  reach: number
  /** how much the reach wanders, metres (default a third of `reach`) */
  vary?: number
  /** the most it may reach (a cornice it stops under); default unlimited */
  max?: number
  /** a different shape altogether: the reach at `u` metres along the wall (replaces reach/vary); < 0.3 is bare */
  extent?: (u: number) => number
  /** bare wall at `u` (a doorway, a window to keep clear, a hedge in front) */
  skip?: (u: number) => boolean
  /** how far its ends taper into the wall, metres (default 1.4; 0 for a mantle that runs on round a corner) */
  taper?: number
  colour?: Rgb
  seed?: number
}

const hash = (x: number): number => { const s = Math.sin(x * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s) }

/**
 * Ivy over the wall from `a` to `b` whose outward normal is `n` (unit, horizontal). Writes into `m` with the
 * foliage surface; about 14 triangles a half-metre of wall.
 */
export function ivyWall(m: MeshBuilder, a: P2, b: P2, n: P2, o: IvyOpts): void {
  const L = Math.hypot(b.x - a.x, b.z - a.z)
  if (L < 0.6) return
  const tx = (b.x - a.x) / L, tz = (b.z - a.z) / L
  const seed = o.seed ?? Math.round(a.x * 7 + a.z * 13)
  const ph = hash(seed) * 6.283
  const vary = o.vary ?? o.reach / 3
  const taper = o.taper ?? 1.4
  const tag = surfaceTag('foliage')
  const base = o.colour ?? IVY_GREEN
  const reachAt = (u: number): number => {
    if (o.skip?.(u)) return 0
    let r = o.extent ? o.extent(u) : o.reach + vary * (0.55 * Math.sin(u * 0.21 + ph) + 0.3 * Math.sin(u * 0.53 + ph * 2.3) + 0.15 * Math.sin(u * 1.37 + ph * 3.1))
    if (taper > 0) r *= Math.min(1, u / taper, (L - u) / taper)
    return Math.min(o.max ?? Infinity, r)
  }
  const up = o.from === 'ground' ? 1 : -1
  const P = (u: number, y: number, off: number): V3 => [a.x + tx * u + n.x * off, y, a.z + tz * u + n.z * off]
  const cell = 0.45
  const nc = Math.max(1, Math.round(L / cell)), du = L / nc
  // the edge, jittered once per column boundary so neighbouring cells share it
  const edge: number[] = []
  for (let c = 0; c <= nc; c++) {
    const r = reachAt(c * du)
    edge.push(r < 0.3 ? 0 : Math.max(0, r + (hash(seed + c * 3.7) - 0.5) * 0.3))
  }
  const tone = (c: number, k: number): Rgb => { const s = 0.9 + hash(seed * 0.37 + c * 1.9 + k) * 0.16; return [base[0] * s, base[1] * s, base[2] * s] }
  for (let c = 0; c < nc; c++) {
    const r0 = edge[c], r1 = edge[c + 1]
    if (r0 <= 0 && r1 <= 0) continue
    const u0 = c * du, u1 = u0 + du
    // the sheet, 6 cm off the wall
    const e0 = o.y + up * r0, e1 = o.y + up * r1
    const q: V3[] = up > 0 ? [P(u0, o.y, 0.06), P(u1, o.y, 0.06), P(u1, e1, 0.06), P(u0, e0, 0.06)]
      : [P(u0, e0, 0.06), P(u1, e1, 0.06), P(u1, o.y, 0.06), P(u0, o.y, 0.06)]
    m.quad(q, [n.x, 0, n.z], UV, tone(c, 0), tag)
  }
  // clumps standing out of the sheet: blobs scattered over the mantle on a ~1 m grid, kept inside its edge
  const lerpEdge = (u: number): number => { const k = Math.min(nc - 1, Math.max(0, Math.floor(u / du))), f = u / du - k; return edge[k] * (1 - f) + edge[k + 1] * f }
  const gu = 1.05, gy = 0.95
  for (let i = 0; i * gu < L; i++) {
    for (let j = 0; ; j++) {
      const h1 = hash(seed + i * 13.1 + j * 7.7), h2 = hash(seed + i * 5.3 + j * 11.9), h3 = hash(seed + i * 2.9 + j * 3.3)
      const u = (i + 0.2 + h1 * 0.6) * gu, d = (j + 0.25 + h2 * 0.5) * gy
      const r = lerpEdge(Math.min(u, L - 0.01))
      if (d > r - 0.35 || j > 60) break
      if (h3 < 0.42) continue
      const w = 0.45 + h1 * 0.6, hh = 0.35 + h2 * 0.5, off = 0.12 + h3 * 0.14
      const w0 = Math.max(0, u - w / 2), w1 = Math.min(L, u + w / 2)
      const y0 = o.y + up * (d - hh / 2), y1 = o.y + up * (d + hh / 2)
      const lo = Math.min(y0, y1), hi = Math.max(y0, y1)
      const t = tone(i * 7 + j, 1), col: Rgb = [t[0] * 1.06, t[1] * 1.06, t[2] * 1.04]
      m.quad([P(w0, lo, off), P(w1, lo, off), P(w1, hi, off), P(w0, hi, off)], [n.x, 0, n.z], UV, col, tag)              // face
      m.quad([P(w0, hi, 0.06), P(w0, hi, off), P(w1, hi, off), P(w1, hi, 0.06)], [0, 1, 0], UV, tone(i + j, 2), tag)                // top
      m.quad([P(w1, lo, 0.06), P(w1, lo, off), P(w0, lo, off), P(w0, lo, 0.06)], [0, -1, 0], UV, tone(i + j, 2), tag)   // underside
      m.quad([P(w0, lo, 0.06), P(w0, lo, off), P(w0, hi, off), P(w0, hi, 0.06)], [-tx, 0, -tz], UV, tone(i + j, 3), tag) // ends
      m.quad([P(w1, hi, 0.06), P(w1, hi, off), P(w1, lo, off), P(w1, lo, 0.06)], [tx, 0, tz], UV, tone(i + j, 3), tag)
    }

  }
}
