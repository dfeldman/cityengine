/**
 * THE MAISON DES ARTS ET MÉTIERS — URBAIN CASSAN, MAX BOURGOIN & GEORGES PAUL (1950, and the later "nouvelle" house
 * across Avenue Pierre Masse): flat-roofed slabs clad in square stone panels laid as an irregular checker of pale
 * grey-beige, pinkish and tan, punched by a strict grid of small square windows, taller glazing on the ground storey.
 * The ancienne is a cranked eight-storey block along the avenue, the entrance under a sign in its recessed middle;
 * the nouvelle a seven-storey slab whose two narrow end blocks rise a storey higher.
 * Refs: Commons "France Paris Cite Universitaire Maison AM 1 01 / AM 2 01", "Maisons des Arts et Métiers 2010"
 * (docs/landmarks/refs/citeu/arts-metiers/). Plans from OSM ways 35282633 (ancienne) and 35282600 (nouvelle).
 * Both use the fit's ring; local −z is the front (bearing 46.5 for the ancienne, 226.5 for the nouvelle).
 */
import earcut from 'earcut'
import type { MeshBuilder } from '../../../buildings.ts'
import { FIXED } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { hex, type Rgb } from '../../kit.ts'

const BASE: Rgb = hex('#ddd5c8'), PINK: Rgb = hex('#d6bfb0'), TAN: Rgb = hex('#cbb39c'), GREY: Rgb = hex('#e6e2d8')
const GLASS: Rgb = hex('#3c454c'), FRAME: Rgb = hex('#e4e1d8'), ROOF: Rgb = hex('#8d8a84'), DOOR: Rgb = hex('#2c3236')
const SIGN: Rgb = hex('#6a5a3e')
const stone = surfaceTag('panel'), glassTag = surfaceTag('glass')

const GF = 3.6, FL = 2.9                  // ground storey, upper storeys
const BAY = 2.9                           // window module along every wall
const WIN_W = 1.25, WIN_H = 1.45, SILL = 0.8, GF_WIN_H = 2.4
const PARAPET = 0.5
const MIX = [0.45, 0.25, 0.2, 0.1]        // checker share: base, pink, tan, grey
const ANC_STOREYS = 8, NOUV_STOREYS = 7, END_W = 13.8, END_EXTRA = 1

type P = { x: number; z: number }
type N = [number, number, number]

const hash = (a: number, b: number, c: number): number => {
  const s = Math.sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453
  return s - Math.floor(s)
}
function pick(r: number): Rgb | null {
  if (r < MIX[0]) return null
  if (r < MIX[0] + MIX[1]) return PINK
  return r < MIX[0] + MIX[1] + MIX[2] ? TAN : GREY
}

/** a quad on the wall a→b (outward n), from t0..t1 along it and y0..y1, stood off by d */
function onWall(out: MeshBuilder, a: P, b: P, n: N, t0: number, t1: number, y0: number, y1: number, c: Rgb, d: number, tag = FIXED): void {
  const L = Math.hypot(b.x - a.x, b.z - a.z), ux = (b.x - a.x) / L, uz = (b.z - a.z) / L
  const p = (t: number, y: number): [number, number, number] => [a.x + ux * t + n[0] * d, y, a.z + uz * t + n[2] * d]
  out.quad([p(t0, y0), p(t1, y0), p(t1, y1), p(t0, y1)], n, [[0, 0], [t1 - t0, 0], [t1 - t0, y1 - y0], [0, y1 - y0]], c, tag)
}

/** extrude a ring y0..y1: checkered stone walls, window grid from storey s0, parapet and flat roof */
function slab(out: MeshBuilder, ring: P[], g: number, y0: number, s0: number, storeys: number, seed: number, entrance: boolean): void {
  let area = 0
  for (let i = 0; i < ring.length; i++) { const a = ring[i], b = ring[(i + 1) % ring.length]; area += a.x * b.z - b.x * a.z }
  const ccw = area > 0, top = g + GF + (storeys - 1) * FL
  let doorEdge = -1, best = Infinity
  ring.forEach((a, i) => {
    const b = ring[(i + 1) % ring.length], L = Math.hypot(b.x - a.x, b.z - a.z)
    const dz = b.z - a.z, dx = b.x - a.x
    const nz = ccw ? -dx / L : dx / L
    if (L > 6 && nz < -0.9 && Math.abs((a.x + b.x) / 2) < best) { best = Math.abs((a.x + b.x) / 2); doorEdge = i }
    void dz
  })
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length], L = Math.hypot(b.x - a.x, b.z - a.z)
    if (L < 0.3) continue
    const dx = (b.x - a.x) / L, dz = (b.z - a.z) / L
    const n: N = ccw ? [dz, 0, -dx] : [-dz, 0, dx]
    // the wall, the parapet
    onWall(out, a, b, n, 0, L, y0, top + PARAPET, BASE, 0, stone)
    const cols = Math.max(1, Math.round(L / BAY)), step = L / cols
    for (let s = s0; s < storeys; s++) {
      const fy = s === 0 ? g : g + GF + (s - 1) * FL, fh = s === 0 ? GF : FL
      for (let k = 0; k < cols; k++) {
        const t = (k + 0.5) * step
        const c = pick(hash(seed + i, k, s))
        if (c) onWall(out, a, b, n, k * step, (k + 1) * step, fy, fy + fh, c, 0.02, stone)
        if (L < 2) continue
        if (entrance && i === doorEdge && s === 0 && Math.abs(t - L / 2) < 4) continue
        const wy = s === 0 ? fy + 0.6 : fy + SILL, wh = s === 0 ? GF_WIN_H : WIN_H
        onWall(out, a, b, n, t - WIN_W / 2 - 0.1, t + WIN_W / 2 + 0.1, wy - 0.1, wy + wh + 0.1, FRAME, 0.04)
        onWall(out, a, b, n, t - WIN_W / 2, t + WIN_W / 2, wy, wy + wh, GLASS, 0.06, glassTag)
      }
    }
    if (entrance && i === doorEdge) {
      // the glazed entrance with its sign
      onWall(out, a, b, n, L / 2 - 3.5, L / 2 + 3.5, g, g + GF + 0.4, DOOR, 0.08, glassTag)
      onWall(out, a, b, n, L / 2 - 1.8, L / 2 + 1.8, g + GF + 0.7, g + GF + 1.4, SIGN, 0.08)
    }
  }
  cap(out, ring, top + PARAPET, FRAME)
  cap(out, ring, top + 0.05, ROOF)
}

function cap(out: MeshBuilder, ring: P[], y: number, c: Rgb): void {
  const ix = earcut(ring.flatMap(p => [p.x, p.z]))
  for (let i = 0; i < ix.length; i += 3) {
    const p = ring[ix[i]], q = ring[ix[i + 1]], r = ring[ix[i + 2]]
    out.quad([[p.x, y, p.z], [q.x, y, q.z], [r.x, y, r.z], [r.x, y, r.z]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], c, FIXED)
  }
}

const ringOf = (fit: Fit): P[] => fit.ring && fit.ring.length >= 3 ? fit.ring : [
  { x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]

export function maisonArtsMetiers(out: MeshBuilder, fit: Fit): void {
  slab(out, ringOf(fit), 0, -0.3, 0, ANC_STOREYS, 3, true)
}

export function maisonArtsMetiersNouvelle(out: MeshBuilder, fit: Fit): void {
  const ring = ringOf(fit), g = 0
  slab(out, ring, g, -0.3, 0, NOUV_STOREYS, 41, false)
  // the two end blocks one storey higher
  const xs = ring.map(p => p.x), x0 = Math.min(...xs), x1 = Math.max(...xs)
  for (const [a, b] of [[x0, x0 + END_W], [x1 - END_W, x1]]) {
    const zs = ring.filter(p => p.x >= a - 0.3 && p.x <= b + 0.3 && Math.abs(p.x - (a === x0 ? b : a)) > 1).map(p => p.z)
    if (zs.length < 2) continue
    const z0 = Math.min(...zs), z1 = Math.max(...zs), top = g + GF + (NOUV_STOREYS - 1) * FL
    const box: P[] = [{ x: a, z: z0 }, { x: b, z: z0 }, { x: b, z: z1 }, { x: a, z: z1 }]
    slab(out, box, g, top, NOUV_STOREYS, NOUV_STOREYS + END_EXTRA, 77 + a, false)
  }
}
