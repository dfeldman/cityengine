import type { MeshBuilder } from '../../../buildings.ts'
import type { Rgb } from '../../../models.ts'
import { prism } from '../../../models.ts'
import { block, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { boxAlong, edgeAt } from '../../parts.ts'
import { extrude, palette, pts, type Pal } from './common.ts'
import { wallOn, type Wall } from './wall.ts'

/** tunables (metres) */
const EAVES = 20
const BASE = 6.8
const BAY = 4.6
const COLS = 6
const COL_SP = 4.1

type P2 = { x: number; z: number }
const area = (r: P2[]): number => r.reduce((s, p, i) => { const q = r[(i + 1) % r.length]; return s + p.x * q.z - q.x * p.z }, 0) / 2

/**
 * The Hôtel de la Monnaie (Jacques-Denis Antoine, 1768–75), 117 m along the Quai de Conti: a rusticated, arcaded ground storey, two
 * storeys of tall windows over it, a strong cornice and balustrade, the slate roof behind; in the middle a projecting avant-corps
 * carried by six giant Ionic columns under an entablature with statues on the balustrade. Plan from OSM relation 967664 through the
 * loader's `fit.ring` (front faces −z); the long river front and its centre are found on that ring, so the builder follows the
 * footprint wherever the loader turns it.
 */
export function hotelMonnaie(out: MeshBuilder, fit: Fit): void {
  const p = palette('#d9cdb4', '#4b5359')
  const ring0 = fit.ring && fit.ring.length > 2 ? fit.ring : pts([-fit.hx, -fit.hz, fit.hx, -fit.hz, fit.hx, fit.hz, -fit.hx, fit.hz])
  const outer = area(ring0) > 0 ? ring0 : [...ring0].reverse()
  const holes = (fit.holes ?? []).map((h) => (area(h) < 0 ? h : [...h].reverse()))
  extrude(out, [outer, ...holes], p, { eaves: EAVES, bay: BAY, win: 1.5, rise: 3.2, inset: 2.6, dormers: false,
    storeys: [{ y: 0.5, h: 3.4 }, { y: 7.8, h: 5.6 }, { y: 14.8, h: 3.4 }] })
  // the river front: the edges that face −z, the most forward of them the centre
  const all = outer.map((_, i) => edgeAt(outer, i))
  const sideLen = (sg: number): number => all.filter((e) => e.nz * sg > 0.9 && e.L > 2).reduce((t, e) => t + e.L, 0)
  // (the quai side is the long one; with the loader's `front` right it is −z, and if it is not, the long side is still found)
  const sg = sideLen(-1) >= sideLen(1) ? -1 : 1
  const edges = all.filter((e) => e.nz * sg > 0.9 && e.L > 2)
  if (!edges.length) return
  // runs of collinear front edges (OSM breaks the centre into two); the centre is the run standing furthest out from the chord of the whole front
  const runs: { a: P2; b: P2; L: number }[] = []
  for (const e of edges) {
    const r = runs[runs.length - 1]
    const dx = r ? r.b.x - r.a.x : 0, dz = r ? r.b.z - r.a.z : 0
    if (r && Math.abs(dx * e.tz - dz * e.tx) / (r.L || 1) < 0.03 && Math.hypot(e.a.x - r.b.x, e.a.z - r.b.z) < 0.5) { r.b = e.b; r.L = Math.hypot(r.b.x - r.a.x, r.b.z - r.a.z) } else runs.push({ a: e.a, b: e.b, L: e.L })
  }
  const A = runs[0].a, B = runs[runs.length - 1].b
  // the centre: the run of 15 m or more nearest the middle of the front
  const mid = (A.x + B.x) / 2
  const cand = runs.filter((r) => r.L > 15 && r.L < 45)
  const centre = [...(cand.length ? cand : runs)].sort((p, q) => Math.abs((p.a.x + p.b.x) / 2 - mid) - Math.abs((q.a.x + q.b.x) / 2 - mid))[0]
  const iron: Rgb = [0.12, 0.12, 0.12]
  for (const e of edges) {
    const w = wallOn(out, e.a, e.b)
    front(w, p, iron)
  }
  if (centre.L > 14) avantCorps(out, wallOn(out, centre.a, centre.b), p)
}

/** a stretch of the front: rusticated arcaded base, tall windows, a shorter row over, cornice and balustrade */
function front(w: Wall, p: Pal, iron: Rgb): void {
  const d = 0.25
  w.slab(0, w.L, 0, EAVES, d, p.stone, 0.05)
  for (let y = 0.6; y < BASE; y += 0.6) w.rect(0, w.L, y - 0.04, y + 0.04, p.deep, d + 0.03)
  w.slab(-0.05, w.L + 0.05, BASE, BASE + 0.4, d + 0.3, p.trim)
  const n = Math.max(1, Math.round(w.L / BAY))
  const step = w.L / n
  for (let i = 0; i < n; i++) {
    const m = step * (i + 0.5)
    const hw = Math.min(1.05, step * 0.23)
    // ground floor: an arched opening in a rusticated pier
    w.arch(m, 0, hw * 1.9, BASE - 1.1, shade(p.stone, 0.8), d + 0.04)
    w.arch(m, 0, hw * 1.5, BASE - 1.5, p.glass, d + 0.07)
    // first floor: a tall window with balcony, a pediment on every other one
    w.rect(m - hw - 0.2, m + hw + 0.2, 8.1, 13.9, p.trim, d + 0.03)
    w.rect(m - hw, m + hw, 8.3, 13.7, p.glass, d + 0.06)
    w.rect(m - hw - 0.1, m + hw + 0.1, 8.3, 9.2, iron, d + 0.25)
    w.slab(m - hw - 0.35, m + hw + 0.35, 13.9, 14.15, d + 0.2, p.trim)
    if (i % 2 === 0) w.ped(m - hw - 0.4, m + hw + 0.4, 14.15, 0.8, d + 0.18, p.trim)
    // second floor: shorter, plain
    w.rect(m - hw + 0.1, m + hw - 0.1, 15.3, 18.4, p.trim, d + 0.03)
    w.rect(m - hw + 0.3, m + hw - 0.3, 15.45, 18.25, p.glass, d + 0.06)
  }
  w.slab(0, w.L, 14.5, 14.75, d + 0.12, p.trim)
  w.slab(-0.1, w.L + 0.1, EAVES - 1.3, EAVES - 0.8, d + 0.4, shade(p.trim, 0.96))
  w.slab(-0.2, w.L + 0.2, EAVES - 0.8, EAVES, d + 0.85, p.trim)
  // the balustrade: a rail, a base, and posts
  w.slab(-0.1, w.L + 0.1, EAVES, EAVES + 0.25, d + 0.6, p.trim)
  w.slab(-0.1, w.L + 0.1, EAVES + 1.05, EAVES + 1.25, d + 0.6, p.trim)
  const k = Math.floor(w.L / 1.6)
  for (let i = 0; i <= k; i++) { const u = (i * w.L) / k; w.slab(u - 0.18, u + 0.18, EAVES + 0.25, EAVES + 1.05, d + 0.5, shade(p.stone, 1.02)) }
}

/** the projecting centre: giant Ionic columns, an entablature, statues over */
function avantCorps(out: MeshBuilder, w: Wall, p: Pal): void {
  const mid = w.L / 2
  const proj = 1.9
  const y0 = BASE + 0.4
  const y1 = EAVES - 1.3
  const half = (COLS - 1) * COL_SP / 2
  w.slab(mid - half - 1.6, mid + half + 1.6, y0 - 0.5, y0, proj + 0.6, p.trim)
  for (let i = 0; i < COLS; i++) {
    const c = w.at(mid - half + i * COL_SP, 0.6 + proj)
    prism(out, c.x, c.z, y0, y1, 0.8, 10, p.stone, 0, 0.68)
    prism(out, c.x, c.z, y0 - 0.25, y0 + 0.4, 0.8, 8, p.trim, 0, 0.8)
    prism(out, c.x, c.z, y1 - 0.4, y1 + 0.1, 0.78, 8, p.trim, 0, 0.78)
  }
  w.slab(mid - half - 1.3, mid + half + 1.3, y1, EAVES - 0.1, proj + 1.3, shade(p.trim, 1.02))
  w.slab(mid - half - 1.3, mid + half + 1.3, EAVES - 0.1, EAVES + 0.35, proj + 1.3, p.trim)
  // the dark loggia behind the columns, and the statues on the balustrade over each column
  w.rect(mid - half, mid + half, y0 + 0.4, y1 - 0.3, shade(p.stone, 0.8), 0.55)
  for (let i = 0; i < COLS; i++) {
    const c = w.at(mid - half + i * COL_SP, proj + 0.6)
    block(out, c.x - 0.45, c.x + 0.45, c.z - 0.45, c.z + 0.45, EAVES + 0.35, EAVES + 2.9, shade(p.stone, 0.95))
    boxAlong(out, c.x, EAVES + 3.5, c.z, 0.3, 0.6, 0.3, 0, shade(p.stone, 0.9))
  }
}
