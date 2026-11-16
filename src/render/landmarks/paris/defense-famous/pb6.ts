/**
 * TOUR PB6 / EDF (now Légende; Pei Cobb Freed with Rouit & Saubot, 2001; 165 m, 41 storeys). Lens plan ~70 × 32 m on the
 * OSM ring's principal axes; a vertical cone is scooped out of the north tip over the first 26 storeys, so the tip
 * edge leans out as it rises and meets the full lens at the cone's apex (≈ Grande Arche ceiling height). Over the
 * north entrance a 24 m round canopy (dark bronze dish) on a single column. Skin: pale silver-blue glass in
 * alternating horizontal steel bands.
 * Sources: fr.wikipedia "Tour Légende" (165 m, lens 70×32, cone on 26 floors, canopy 24 m); Commons
 * "Tour EDF and neighboring buildings, La Défense, Paris.jpg", "EDF Tower 1/2, La Défense, July 2013.jpg".
 */
import { capPolygon, type MeshBuilder } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { hex, type Rgb } from '../../kit.ts'
import { towerRing } from '../../tower.ts'

type P = { x: number; z: number }
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
const GLASS = surfaceTag('glass')
const METAL = surfaceTag('metal')

// tunables
const PB6 = {
  height: 165, storey: 3.95, segs: 72,
  lensSharp: 1.6,            // plan exponent: <2 pinches the tips toward a lens (2 = ellipse)
  coneTop: 105,              // m: apex of the scooped cone (26 storeys)
  coneDepth: 17,             // m cut back from the tip at ground
  coneAxisOut: 6,            // m: cone axis sits this far beyond the north tip
  band: 1.8,                 // m steel spandrel band per storey
  canopyR: 12, canopyY: 8.5, canopyDish: 1.6, canopyOut: 4, // m: canopy radius, rim height, dish depth, centre beyond cut face
  glass: '#c6d6e2', bandCol: '#eef1f3', roof: '#a9b0b5', canopy: '#4a3c33', canopyTop: '#8d9195', column: '#6b6f72',
}

function loft(out: MeshBuilder, at: (y: number) => P[], y0: number, y1: number, glass: Rgb, band: Rgb): void {
  const n = Math.max(1, Math.round((y1 - y0) / PB6.storey)), h = (y1 - y0) / n
  for (let k = 0; k < n; k++) {
    const ya = y0 + k * h, yb = ya + h, ym = ya + PB6.band, ra = at(ya), rb = at(yb), rm = at(ym)
    for (let i = 0; i < ra.length; i++) {
      const j = (i + 1) % ra.length
      const L = Math.hypot(ra[j].x - ra[i].x, ra[j].z - ra[i].z); if (L < 0.05) continue
      const nx = (ra[j].z - ra[i].z) / L, nz = -(ra[j].x - ra[i].x) / L
      out.quad([[ra[i].x, ya, ra[i].z], [ra[j].x, ya, ra[j].z], [rm[j].x, ym, rm[j].z], [rm[i].x, ym, rm[i].z]], [nx, 0, nz], UV, band, METAL)
      out.quad([[rm[i].x, ym, rm[i].z], [rm[j].x, ym, rm[j].z], [rb[j].x, yb, rb[j].z], [rb[i].x, yb, rb[i].z]], [nx, 0, nz], UV, glass, GLASS)
    }
  }
}
const signedArea = (r: P[]): number => { let a = 0; for (let i = 0; i < r.length; i++) { const p = r[i], q = r[(i + 1) % r.length]; a += p.x * q.z - q.x * p.z } return a / 2 }

export function pb6(out: MeshBuilder, fit: Fit): void {
  const r = towerRing(fit), H = fit.height > 140 && fit.height < 190 ? fit.height : PB6.height
  let cx = 0, cz = 0
  for (const p of r) { cx += p.x / r.length; cz += p.z / r.length }
  let sxx = 0, szz = 0, sxz = 0
  for (const p of r) { const dx = p.x - cx, dz = p.z - cz; sxx += dx * dx; szz += dz * dz; sxz += dx * dz }
  const th = 0.5 * Math.atan2(2 * sxz, sxx - szz)
  let ux = Math.cos(th), uz = Math.sin(th)
  if (uz < 0) { ux = -ux; uz = -uz }       // +u points to the north tip (+z is north)
  let A = 0, B = 0
  for (const p of r) { const dx = p.x - cx, dz = p.z - cz; A = Math.max(A, Math.abs(dx * ux + dz * uz)); B = Math.max(B, Math.abs(-dx * uz + dz * ux)) }
  const e = 2 / PB6.lensSharp, plan: P[] = []
  for (let i = 0; i < PB6.segs; i++) {
    const t = (i / PB6.segs) * Math.PI * 2, c = Math.cos(t), s = Math.sin(t)
    const u = A * Math.sign(c) * Math.abs(c) ** e, v = B * Math.sign(s) * Math.abs(s) ** e
    plan.push({ x: cx + u * ux - v * uz, z: cz + u * uz + v * ux })
  }
  if (signedArea(plan) * signedArea(r) < 0) plan.reverse()
  // cone: axis beyond the north tip, radius shrinking to (axisOut) at coneTop so it just kisses the tip there
  const ax = { x: cx + ux * (A + PB6.coneAxisOut), z: cz + uz * (A + PB6.coneAxisOut) }
  const coneR = (y: number): number => y >= PB6.coneTop ? 0 : PB6.coneAxisOut + (PB6.coneDepth) * (1 - y / PB6.coneTop)
  const at = (y: number): P[] => {
    const R = coneR(y)
    return plan.map((p) => {
      const dx = p.x - ax.x, dz = p.z - ax.z, d = Math.hypot(dx, dz)
      return d < R && d > 1e-6 ? { x: ax.x + (dx / d) * R, z: ax.z + (dz / d) * R } : p
    })
  }
  const glass = hex(PB6.glass), band = hex(PB6.bandCol)
  loft(out, at, 0, PB6.coneTop, glass, band)
  loft(out, at, PB6.coneTop, H, glass, band)
  capPolygon(out, at(H), H, hex(PB6.roof), 0)
  // canopy: shallow dish (dark underside) on one column, in front of the cut face
  const k = PB6.coneAxisOut + PB6.coneDepth - PB6.canopyOut
  const cc = { x: ax.x - ux * k, z: ax.z - uz * k }
  const N = 32, Rr = PB6.canopyR, yr = PB6.canopyY, yc = yr - PB6.canopyDish, under = hex(PB6.canopy), top = hex(PB6.canopyTop)
  for (let i = 0; i < N; i++) {
    const a0 = (i / N) * Math.PI * 2, a1 = ((i + 1) / N) * Math.PI * 2
    const p0 = [cc.x + Math.cos(a0) * Rr, yr, cc.z + Math.sin(a0) * Rr] as [number, number, number]
    const p1 = [cc.x + Math.cos(a1) * Rr, yr, cc.z + Math.sin(a1) * Rr] as [number, number, number]
    const q0 = [cc.x + Math.cos(a0) * Rr * 0.08, yc, cc.z + Math.sin(a0) * Rr * 0.08] as [number, number, number]
    const q1 = [cc.x + Math.cos(a1) * Rr * 0.08, yc, cc.z + Math.sin(a1) * Rr * 0.08] as [number, number, number]
    out.quad([q0, q1, p1, p0], [0, -1, 0], UV, under, METAL)
    const t0 = [p0[0], yr + 0.5, p0[2]] as [number, number, number], t1 = [p1[0], yr + 0.5, p1[2]] as [number, number, number]
    out.quad([p0, p1, t1, t0], [Math.cos(a0), 0, Math.sin(a0)], UV, top, METAL)
  }
  const disc: P[] = []
  for (let i = 0; i < N; i++) disc.push({ x: cc.x + Math.cos((i / N) * Math.PI * 2) * Rr, z: cc.z + Math.sin((i / N) * Math.PI * 2) * Rr })
  capPolygon(out, disc, yr + 0.5, top, 0)
  const cw = 0.6, col = hex(PB6.column)
  for (let i = 0; i < 8; i++) {
    const a0 = (i / 8) * Math.PI * 2, a1 = ((i + 1) / 8) * Math.PI * 2
    out.quad([[cc.x + Math.cos(a0) * cw, 0, cc.z + Math.sin(a0) * cw], [cc.x + Math.cos(a1) * cw, 0, cc.z + Math.sin(a1) * cw],
      [cc.x + Math.cos(a1) * cw, yc, cc.z + Math.sin(a1) * cw], [cc.x + Math.cos(a0) * cw, yc, cc.z + Math.sin(a0) * cw]], [Math.cos(a0), 0, Math.sin(a0)], UV, col, METAL)
  }
}
