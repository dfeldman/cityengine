/**
 * THE MAISON DES INDUSTRIES AGRICOLES ET ALIMENTAIRES — FRANCIS THIEULIN & XAVIER DE VIGAN (1956): a long, cranked,
 * flat-roofed slab of pale cream render, a ground storey and four upper storeys of near-continuous ribbon windows
 * with white mullions, a thin white parapet; the stair cores show as narrow buff-rendered jogs with tall slot
 * glazing, the glazed entrance at the foot of the one on the garden (west) side.
 * Ref: Commons "Maison des industries agricoles et alimentaires.jpg" (docs/landmarks/refs/citeu/industries-agricoles/).
 * Plan from OSM way 28754151; local −z is the garden front (bearing 280.6).
 */
import earcut from 'earcut'
import type { MeshBuilder } from '../../../buildings.ts'
import { FIXED } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { hex, type Rgb } from '../../kit.ts'

const RENDER: Rgb = hex('#ece6d6'), CORE: Rgb = hex('#d8c49a'), GLASS: Rgb = hex('#3f4a52'), FRAME: Rgb = hex('#f4f2ec')
const ROOF: Rgb = hex('#8e8b85'), BAND: Rgb = hex('#e2dccb')
const plaster = surfaceTag('stucco'), glassTag = surfaceTag('glass')

const STOREYS = 5, GF = 3.4, FL = 2.9     // ground storey, upper storeys
const BAY = 3.0, WIN_W = 2.55, WIN_H = 1.45, SILL = 0.85, GF_WIN_H = 2.2
const PARAPET = 0.6, CORE_MAX = 4.5       // walls shorter than this read as stair-core jogs
const SLOT_W = 0.9, DOOR_W = 3.2

type P = { x: number; z: number }
type N = [number, number, number]

function onWall(out: MeshBuilder, a: P, b: P, n: N, t0: number, t1: number, y0: number, y1: number, c: Rgb, d: number, tag = FIXED): void {
  const L = Math.hypot(b.x - a.x, b.z - a.z), ux = (b.x - a.x) / L, uz = (b.z - a.z) / L
  const p = (t: number, y: number): [number, number, number] => [a.x + ux * t + n[0] * d, y, a.z + uz * t + n[2] * d]
  out.quad([p(t0, y0), p(t1, y0), p(t1, y1), p(t0, y1)], n, [[0, 0], [t1 - t0, 0], [t1 - t0, y1 - y0], [0, y1 - y0]], c, tag)
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

export function maisonIndustriesAgricoles(out: MeshBuilder, fit: Fit): void {
  const ring = ringOf(fit), g = 0, top = g + GF + (STOREYS - 1) * FL
  let area = 0
  for (let i = 0; i < ring.length; i++) { const a = ring[i], b = ring[(i + 1) % ring.length]; area += a.x * b.z - b.x * a.z }
  const ccw = area > 0
  // the entrance: the front-facing core jog nearest the middle
  let door = -1, best = Infinity
  ring.forEach((a, i) => {
    const b = ring[(i + 1) % ring.length], L = Math.hypot(b.x - a.x, b.z - a.z)
    const nz = (ccw ? -(b.x - a.x) : b.x - a.x) / L
    if (L >= DOOR_W + 0.4 && L < CORE_MAX && nz < -0.8 && Math.abs(a.x + b.x) < best) { best = Math.abs(a.x + b.x); door = i }
  })
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length], L = Math.hypot(b.x - a.x, b.z - a.z)
    if (L < 0.3) continue
    const dx = (b.x - a.x) / L, dz = (b.z - a.z) / L
    const n: N = ccw ? [dz, 0, -dx] : [-dz, 0, dx]
    const core = L < CORE_MAX
    onWall(out, a, b, n, 0, L, -0.3, top + PARAPET, core ? CORE : RENDER, 0, plaster)
    onWall(out, a, b, n, 0, L, top, top + PARAPET, FRAME, 0.03)
    if (core) {
      if (L < SLOT_W + 0.4) continue
      // tall slot glazing up the stair core, the entrance below on the garden side
      const y0 = i === door ? g + GF + 0.3 : g + 0.9
      onWall(out, a, b, n, L / 2 - SLOT_W / 2, L / 2 + SLOT_W / 2, y0, top - 0.6, GLASS, 0.05, glassTag)
      if (i === door) onWall(out, a, b, n, L / 2 - DOOR_W / 2, L / 2 + DOOR_W / 2, g, g + GF - 0.2, GLASS, 0.05, glassTag)
      continue
    }
    const cols = Math.max(1, Math.round(L / BAY)), step = L / cols
    for (let s = 0; s < STOREYS; s++) {
      const fy = s === 0 ? g : g + GF + (s - 1) * FL
      const wy = s === 0 ? fy + 0.7 : fy + SILL, wh = s === 0 ? GF_WIN_H : WIN_H
      // a ribbon band per storey, the windows set in it
      onWall(out, a, b, n, 0.25, L - 0.25, wy - 0.12, wy + wh + 0.12, FRAME, 0.02)
      if (s > 0) onWall(out, a, b, n, 0, L, fy - 0.05, fy + 0.12, BAND, 0.025)
      for (let k = 0; k < cols; k++) {
        const t = (k + 0.5) * step, w = Math.min(WIN_W, step - 0.3)
        onWall(out, a, b, n, t - w / 2, t + w / 2, wy, wy + wh, GLASS, 0.04, glassTag)
      }
    }
  }
  cap(out, ring, top + PARAPET - 0.15, ROOF)   // the parapet walls stand proud of the roof
}
