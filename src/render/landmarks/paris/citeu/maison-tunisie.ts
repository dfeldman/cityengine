/**
 * THE MAISON DE LA TUNISIE — JEAN SEBAG (1953): two plain wings at a right angle meeting at the boulevard Jourdan
 * corner, six storeys plus a ground storey in pale stone cladding under a flat roof; a regular grid of square-ish
 * windows set in the face, a dark full-height glazed stair bay on the long front near the corner, a glazed ground
 * storey along the front, and blank end walls (one carries the house's name and emblem).
 * Refs: Commons "Maison de la tunisie.jpg", "Façade Maison de la Tunisie-1.jpg" (docs/landmarks/refs/citeu/tunisie/).
 * Plan from OSM way 52874391 (name "Maison de la Tunisie", 6 levels, flat roof); front faces bearing ~18.5 (the boulevard Jourdan).
 */
import earcut from 'earcut'
import type { MeshBuilder } from '../../../buildings.ts'
import { FIXED } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { hex, type Rgb } from '../../kit.ts'

const STONE: Rgb = hex('#ddd6c6'), COPE: Rgb = hex('#c9c1ae'), GLASS: Rgb = hex('#353c45'), FRAME: Rgb = hex('#9a958a')
const ROOF: Rgb = hex('#55544f'), STAIR: Rgb = hex('#2c333b'), MULLION: Rgb = hex('#6d6a63')
const stoneTag = surfaceTag('ashlar'), glassTag = surfaceTag('glass')

const STOREYS = 7, GF = 3.6, FL = 2.95                 // ground storey + six upper (OSM levels 6 + ground)
const PARAPET = 0.7, COPE_H = 0.35, COPE_OUT = 0.1
const BAY = 3.1, WIN_W = 1.6, WIN_H = 1.55, SILL = 0.8, FRAME_D = 0.12, GLASS_D = 0.06
const BLANK_UNDER = 15                                  // edges shorter than this are the blank end walls
const STAIR_W = 3.2, STAIR_AT = 6.5, STAIR_OUT = 0.35   // dark glazed stair bay, metres from the corner end of the front
const GF_GLASS_H = 2.7

export type P = { x: number; z: number }
export type V = [number, number, number]

export function onWall(out: MeshBuilder, a: P, b: P, n: V, t0: number, t1: number, y0: number, y1: number, c: Rgb, d: number, tag = FIXED): void {
  const L = Math.hypot(b.x - a.x, b.z - a.z), ux = (b.x - a.x) / L, uz = (b.z - a.z) / L
  const p = (t: number, y: number): V => [a.x + ux * t + n[0] * d, y, a.z + uz * t + n[2] * d]
  out.quad([p(t0, y0), p(t1, y0), p(t1, y1), p(t0, y1)], n, [[0, 0], [t1 - t0, 0], [t1 - t0, y1 - y0], [0, y1 - y0]], c, tag)
}

export function cap(out: MeshBuilder, ring: P[], y: number, c: Rgb): void {
  const ix = earcut(ring.flatMap(p => [p.x, p.z]))
  for (let i = 0; i < ix.length; i += 3) {
    const p = ring[ix[i]], q = ring[ix[i + 1]], r = ring[ix[i + 2]]
    out.quad([[p.x, y, p.z], [q.x, y, q.z], [r.x, y, r.z], [r.x, y, r.z]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], c, FIXED)
  }
}

/** the ring, its edge lengths and outward normals */
export function edges(fit: Fit): { ring: P[]; len: number[]; nrm: V[] } {
  const ring: P[] = fit.ring && fit.ring.length >= 3 ? fit.ring : [
    { x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  const N = ring.length
  let area = 0
  for (let i = 0; i < N; i++) { const a = ring[i], b = ring[(i + 1) % N]; area += a.x * b.z - b.x * a.z }
  const len = ring.map((a, i) => { const b = ring[(i + 1) % N]; return Math.hypot(b.x - a.x, b.z - a.z) })
  const nrm = ring.map((a, i): V => {
    const b = ring[(i + 1) % N], L = len[i] || 1, dx = (b.x - a.x) / L, dz = (b.z - a.z) / L
    return area > 0 ? [dz, 0, -dx] : [-dz, 0, dx]
  })
  return { ring, len, nrm }
}

export function maisonTunisie(out: MeshBuilder, fit: Fit): void {
  const { ring, len, nrm } = edges(fit), N = ring.length
  const eave = GF + (STOREYS - 1) * FL, top = eave + PARAPET
  // the front: the long edge whose normal looks most nearly along −z (the model's front)
  let front = 0
  for (let i = 0; i < N; i++) if (len[i] > BLANK_UNDER && -nrm[i][2] > -nrm[front][2]) front = i
  for (let i = 0; i < N; i++) {
    const a = ring[i], b = ring[(i + 1) % N], L = len[i], n = nrm[i]
    if (L < 0.2) continue
    onWall(out, a, b, n, 0, L, -0.3, top, STONE, 0, stoneTag)
    onWall(out, a, b, n, 0, L, top - COPE_H, top, COPE, COPE_OUT)
    if (L < BLANK_UNDER) continue
    if (i === front) onWall(out, a, b, n, 0.6, L - 0.6, 0.3, 0.3 + GF_GLASS_H, GLASS, GLASS_D, glassTag)
    // the stair bay sits at the end of the front nearest the other wing (the corner): the end shared with a long edge
    const corner = i === front ? (len[(i + 1) % N] > BLANK_UNDER ? L - STAIR_AT : STAIR_AT) : -99
    const cols = Math.max(1, Math.round(L / BAY)), step = L / cols
    for (let s = i === front ? 1 : 0; s < STOREYS; s++) {
      const wy = (s === 0 ? 0 : GF + (s - 1) * FL) + SILL
      for (let k = 0; k < cols; k++) {
        const t = (k + 0.5) * step
        if (Math.abs(t - corner) < STAIR_W / 2 + 0.5) continue
        onWall(out, a, b, n, t - WIN_W / 2 - 0.1, t + WIN_W / 2 + 0.1, wy - 0.1, wy + WIN_H + 0.1, FRAME, FRAME_D)
        onWall(out, a, b, n, t - WIN_W / 2, t + WIN_W / 2, wy, wy + WIN_H, GLASS, FRAME_D + GLASS_D, glassTag)
      }
    }
    if (corner > 0) {   // dark glazed stair bay, full height, proud of the face, with mullion bands
      onWall(out, a, b, n, corner - STAIR_W / 2, corner + STAIR_W / 2, GF, top + 0.4, STAIR, STAIR_OUT, glassTag)
      for (let s = 1; s < STOREYS; s++) {
        const y = GF + (s - 1) * FL
        onWall(out, a, b, n, corner - STAIR_W / 2, corner + STAIR_W / 2, y - 0.1, y + 0.1, MULLION, STAIR_OUT + 0.03)
      }
    }
  }
  cap(out, ring, eave, ROOF)   // roof deck sunk below the parapet
}
