import type { MeshBuilder } from '../../../buildings.ts'
import type { Rgb } from '../../../models.ts'
import { box } from '../../../models.ts'
import { shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { boxAlong, edgeAt } from '../../parts.ts'
import { extrude, palette, pts, type Pal } from './common.ts'
import { wallOn, type Wall } from './wall.ts'

/** tunables (metres) */
const EAVES = 11.4
const RISE = 7.6
const INSET = 3.8
const BAY = 3.7
const PROJ = 1.3
const PED_RISE = 1.6
const TROPHY = 2.4
/** warm grey ashlar of the hôtel (photographs: grey-buff, not beige) */
const STONE = '#cbbfaa'
const QUOIN = 0.16

type P2 = { x: number; z: number }
const area = (r: P2[]): number => r.reduce((s, p, i) => { const q = r[(i + 1) % r.length]; return s + p.x * q.z - q.x * p.z }, 0) / 2
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

/**
 * The Hôtel Salé (Jean de Boullier, 1656–60; the Musée Picasso), Rue de Thorigny. Plan from OSM way 57745739 through the
 * loader's `fit.ring`, `front` turned so −z is the COURT front of the corps de logis (the side facing the cour d'honneur).
 * On that front: two storeys of tall windows over a plinth, the three-bay avant-corps standing 1.3 m proud with a segmental
 * pediment and the sculpted trophy over it, big dormers with oeil-de-boeuf windows on the steep slate roof.
 */
export function hotelSale(out: MeshBuilder, fit: Fit): void {
  const p = palette(STONE, '#454c52')
  const ring0 = fit.ring && fit.ring.length > 2 ? fit.ring : pts([-fit.hx, -fit.hz, fit.hx, -fit.hz, fit.hx, fit.hz, -fit.hx, fit.hz])
  const outer = area(ring0) > 0 ? ring0 : [...ring0].reverse()
  const holes = (fit.holes ?? []).map((h) => (area(h) < 0 ? h : [...h].reverse()))
  extrude(out, [outer, ...holes], p, { eaves: EAVES, bay: BAY, win: 1.35, rise: RISE, inset: INSET, dormers: false,
    storeys: [{ y: 0.5, h: 3.4 }, { y: 5.6, h: 4.4 }] })
  const all = outer.map((_, i) => edgeAt(outer, i))
  // dormers up the slate on every long wall, one in two bays, standing a third of the way up the slope
  for (const e of all) {
    if (e.L < 6) continue
    const nb = Math.max(1, Math.round((e.L - 1.2) / BAY))
    const stp = (e.L - 1.2) / nb
    for (let j = 0; j < nb; j += 2) {
      const u = 0.6 + stp * (j + 0.5)
      const k = 0.4
      const x = e.a.x + e.tx * u - e.nx * INSET * k, z = e.a.z + e.tz * u - e.nz * INSET * k
      const y = EAVES + RISE * k
      boxAlong(out, x, y + 1.0, z, 0.7, 1.0, 0.55, e.heading, p.trim)
      boxAlong(out, x + e.nx * 0.58, y + 1.0, z + e.nz * 0.58, 0.45, 0.7, 0.02, e.heading, p.glass)
      boxAlong(out, x - e.nx * 0.1, y + 2.15, z - e.nz * 0.1, 0.85, 0.15, 0.8, e.heading, p.slate)
    }
  }
  // the court front (faces −z) and the garden front opposite it (faces +z): the run of edges truest to that way, jogs of up to
  // 3 edges allowed inside a run, the longest chosen
  for (const sgn of [-1, 1]) {
    const fe = all.map((e, i) => ({ e, i })).filter(({ e }) => e.nz * sgn > 0.9 && e.L > 1.2)
    const runs: { e: typeof all[number]; i: number }[][] = []
    for (const f of fe) {
      const r = runs[runs.length - 1]
      if (r && f.i - r[r.length - 1].i <= 4) r.push(f); else runs.push([f])
    }
    if (!runs.length) continue
    const score = (r: typeof runs[number]): number => r.reduce((t, { e }) => t + e.L * (e.nz * sgn > 0.99 ? 3 : 1), 0)
    const run = [...runs].sort((p, q) => score(q) - score(p))[0]
    const A = run[0].e.a
    const B = run[run.length - 1].e.b
    const w = wallOn(out, A, B)
    court(out, w, edgeAt([A, B], 0).heading, p)
  }
}

/** a segmental pediment: the face under an arc rising `rise` over u0..u1 */
function segPed(out: MeshBuilder, w: Wall, u0: number, u1: number, y0: number, rise: number, d: number, c: Rgb): void {
  const n = 10
  const e = [w.at(0, 0), w.at(1, 0)]
  const nx = -(e[1].z - e[0].z), nz = e[1].x - e[0].x
  const l = Math.hypot(nx, nz) || 1
  const N: [number, number, number] = [nx / l, 0, nz / l]
  const P = (u: number, y: number): [number, number, number] => { const q = w.at(u, d); return [q.x, y, q.z] }
  for (let i = 0; i < n; i++) {
    const ta = i / n, tb = (i + 1) / n
    const ya = y0 + rise * (1 - (2 * ta - 1) ** 2), yb = y0 + rise * (1 - (2 * tb - 1) ** 2)
    const ua = u0 + (u1 - u0) * ta, ub = u0 + (u1 - u0) * tb
    out.quad([P(ua, y0), P(ub, y0), P(ub, yb), P(ua, ya)], N, UV, c, 0)
  }
}

function court(out: MeshBuilder, w: Wall, heading: number, p: Pal): void {
  const d = 0.2
  const iron: Rgb = [0.1, 0.1, 0.1]
  w.slab(0, w.L, 0, EAVES, d, p.stone, 0.05)
  // rusticated quoins at both ends: alternate long and short stones, proud of the wall
  for (const end of [0, 1]) for (let y = 0.6, k = 0; y < EAVES - 0.8; y += 0.95, k++) {
    const lw = k % 2 ? 0.55 : 1.0
    const u0 = end ? w.L - lw : 0
    w.rect(u0, u0 + lw, y, y + 0.85, shade(p.stone, k % 2 ? 0.93 : 1.02), d + QUOIN)
  }
  // plinth, string course between the storeys, the cornice
  w.slab(-0.05, w.L + 0.05, 0, 0.6, d + 0.08, shade(p.stone, 0.9))
  w.slab(-0.05, w.L + 0.05, 5.0, 5.3, d + 0.12, p.trim)
  w.slab(-0.15, w.L + 0.15, EAVES - 0.5, EAVES, d + 0.5, p.trim)
  const n = Math.max(3, Math.round(w.L / BAY))
  const step = w.L / n
  const mid = (n - 1) / 2
  for (let i = 0; i < n; i++) {
    const m = step * (i + 0.5)
    const hw = 0.7
    // ground floor: tall arched-less windows with plain surrounds; first floor taller, with a keystone band
    w.rect(m - hw - 0.18, m + hw + 0.18, 0.8, 4.4, p.trim, d + 0.03)
    w.rect(m - hw, m + hw, 0.95, 4.3, p.glass, d + 0.06)
    w.rect(m - hw - 0.18, m + hw + 0.18, 5.9, 10.4, p.trim, d + 0.03)
    w.rect(m - hw, m + hw, 6.05, 10.3, p.glass, d + 0.06)
    w.rect(m - hw - 0.1, m + hw + 0.1, 6.05, 6.9, iron, d + 0.2)
    w.slab(m - hw - 0.3, m + hw + 0.3, 10.4, 10.65, d + 0.15, p.trim)
    // roof dormer over every second bay: a stone face with an oeil-de-boeuf, a small slate hood
    if (Math.abs(i - mid) > 1.1 && i % 2 === 0) dormer(out, w, heading, m, p)
  }
  // the avant-corps: three bays proud, doubled pilasters, entablature, segmental pediment, the trophy
  const c = step * (mid + 0.5)
  const half = step * 1.5
  const dd = d + PROJ
  w.slab(c - half, c + half, 0, EAVES, dd, shade(p.stone, 1.04), 0.05)
  w.slab(c - half - 0.1, c + half + 0.1, 0, 0.6, dd + 0.08, shade(p.stone, 0.9))
  w.slab(c - half - 0.1, c + half + 0.1, 5.0, 5.3, dd + 0.12, p.trim)
  for (let k = -1; k <= 1; k++) {
    const m = c + k * step
    w.rect(m - 0.9, m + 0.9, 0.8, 4.4, p.trim, dd + 0.03)
    w.rect(m - 0.7, m + 0.7, 0.95, 4.3, k === 0 ? shade(p.dark, 1.2) : p.glass, dd + 0.06)
    w.rect(m - 0.9, m + 0.9, 5.9, 10.4, p.trim, dd + 0.03)
    w.rect(m - 0.7, m + 0.7, 6.05, 10.3, p.glass, dd + 0.06)
    w.rect(m - 0.8, m + 0.8, 6.05, 6.9, iron, dd + 0.2)
    w.slab(m - 1.0, m + 1.0, 10.4, 10.7, dd + 0.15, p.trim)
  }
  for (const s of [-1, 1]) for (const o of [0.25, 0.9]) w.slab(c + s * (half - o) - 0.2, c + s * (half - o) + 0.2, 0.6, EAVES - 0.5, dd + 0.2, p.trim)
  w.slab(c - half - 0.3, c + half + 0.3, EAVES - 0.7, EAVES + 0.3, dd + 0.45, p.trim)
  segPed(out, w, c - half - 0.3, c + half + 0.3, EAVES + 0.3, PED_RISE + 0.9, dd + 0.45, shade(p.trim, 1.03))
  segPed(out, w, c - half + 0.4, c + half - 0.4, EAVES + 0.5, PED_RISE + 0.3, dd + 0.5, shade(p.stone, 0.88))
  // the trophy: a stack of stone forms over the crown of the pediment (arms and a shield), then a finial
  const t = w.at(c, dd + 0.3)
  const y = EAVES + 0.3 + PED_RISE + 0.9
  box(out, t.x, y + 0.5, t.z, 1.8, 1.0, 0.5, p.trim, 0)
  box(out, t.x, y + 1.4, t.z, 1.1, 0.9, 0.45, shade(p.trim, 1.05), 0)
  box(out, t.x, y + TROPHY - 0.1, t.z, 0.5, 1.4, 0.4, shade(p.trim, 0.97), 0)
  for (const s of [-1, 1]) { const q = w.at(c + s * 1.1, dd + 0.3); box(out, q.x, y + 0.8, q.z, 0.35, 1.6, 0.35, shade(p.trim, 0.95), 0) }
  // side urns on the pediment's feet
  for (const s of [-1, 1]) { const q = w.at(c + s * (half + 0.1), dd + 0.3); box(out, q.x, EAVES + 1.1, q.z, 0.6, 1.0, 0.6, p.trim, 0) }
}

/** a dormer rising out of the cornice at u: a stone face in the wall plane with an oeil-de-boeuf, a slate hood over it */
function dormer(out: MeshBuilder, w: Wall, heading: number, u: number, p: Pal): void {
  const f = w.at(u, -0.55)
  boxAlong(out, f.x, EAVES + 1.5, f.z, 0.95, 1.5, 0.55, heading, p.trim)
  const h = w.at(u, -0.5)
  boxAlong(out, h.x, EAVES + 3.15, h.z, 1.1, 0.2, 0.9, heading, p.slate)
  const g = w.at(u, 0.0)
  void g
  segPed(out, w, u - 0.7, u + 0.7, EAVES + 3.0, 0.55, 0.02, p.trim)
  w.rect(u - 0.55, u - 0.35, EAVES + 0.4, EAVES + 2.9, shade(p.trim, 0.95), 0.05)
  w.rect(u + 0.35, u + 0.55, EAVES + 0.4, EAVES + 2.9, shade(p.trim, 0.95), 0.05)
  w.disc(u, EAVES + 1.6, 0.6, p.trim, 0.06)
  w.disc(u, EAVES + 1.6, 0.42, p.glass, 0.09)
}
