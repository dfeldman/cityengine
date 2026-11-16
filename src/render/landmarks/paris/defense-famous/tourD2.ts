/**
 * TOUR D2 (Anthony Béchu & Tom Sheehan, 2014; 171 m, 39 storeys): a spindle in a pale steel diagrid. The plan is a rounded lozenge on the OSM ring's principal axes, fattest a little below mid-height and drawn in at foot and crown; the exoskeleton is white/pale grey diagonals over pale blue-grey glass, and the top closes in a pointed bullet nose (the roof garden sits inside it).
 * Diagrid as geometry: one quad per strut per row (shared strips, no node boxes), ~40 segs × 41 storeys of glass.
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

// tunables (photos: fr.wikipedia Tour_D2_Septembre_2022.jpeg, Commons La-defense-2016-2.jpg)
const D2 = {
  height: 171,
  squareness: 2.3,            // plan superellipse exponent (2 = ellipse)
  foot: 0.9, bulge: 1.03, shoulder: 0.96, bulgeAt: 0.4, // plan scale: foot, widest, and where the nose starts
  noseAt: 0.66,               // fraction of H where the bullet nose begins
  tip: 0.1,                   // plan scale at the very top
  storey: 4.2, segs: 40,
  gridPitch: 15, gridRise: 12.5, gridWidth: 1.7, gridOff: 0.8, // diagrid: m round the foot, m per half-diamond, strut width, standoff
  glass: '#7f9bad', floorLine: '#8597a2', roof: '#9aa6ab', steel: '#f1f2ef',
}

function loft(out: MeshBuilder, at: (y: number) => P[], y0: number, y1: number, step: number, glass: Rgb, line: Rgb, roof: Rgb): void {
  const n = Math.max(1, Math.round((y1 - y0) / step)), h = (y1 - y0) / n
  for (let k = 0; k < n; k++) {
    const ya = y0 + k * h, yb = ya + h, ra = at(ya), rb = at(yb), t = 0.7 / h
    for (let i = 0; i < ra.length; i++) {
      const j = (i + 1) % ra.length, a = ra[i], b = ra[j], c = rb[j], d = rb[i]
      const L = Math.hypot(b.x - a.x, b.z - a.z); if (L < 0.1) continue
      const nx = (b.z - a.z) / L, nz = -(b.x - a.x) / L, o = 0.06
      out.quad([[a.x, ya, a.z], [b.x, ya, b.z], [c.x, yb, c.z], [d.x, yb, d.z]], [nx, 0, nz], UV, glass, GLASS)
      const e = { x: a.x + (d.x - a.x) * t, z: a.z + (d.z - a.z) * t }, f = { x: b.x + (c.x - b.x) * t, z: b.z + (c.z - b.z) * t }
      out.quad([[a.x + nx * o, ya, a.z + nz * o], [b.x + nx * o, ya, b.z + nz * o], [f.x + nx * o, ya + 0.7, f.z + nz * o], [e.x + nx * o, ya + 0.7, e.z + nz * o]], [nx, 0, nz], UV, line, METAL)
    }
  }
  capPolygon(out, at(y1), y1, roof, 0)
}

/** diagonal struts both ways round a ring that changes with height; each row's struts cross on the row line */
function diagrid(out: MeshBuilder, at: (y: number) => P[], y0: number, y1: number, colour: Rgb): void {
  const perim = (r: P[]): number => r.reduce((s, p, i) => s + Math.hypot(r[(i + 1) % r.length].x - p.x, r[(i + 1) % r.length].z - p.z), 0)
  const pt = (r: P[], tot: number, t: number): { x: number; z: number; nx: number; nz: number } => {
    let s = (((t % 1) + 1) % 1) * tot
    for (let i = 0; i < r.length; i++) {
      const a = r[i], b = r[(i + 1) % r.length], L = Math.hypot(b.x - a.x, b.z - a.z)
      if (s <= L && L > 0) { const u = s / L, nx = (b.z - a.z) / L, nz = -(b.x - a.x) / L; return { x: a.x + (b.x - a.x) * u + nx * D2.gridOff, z: a.z + (b.z - a.z) * u + nz * D2.gridOff, nx, nz } }
      s -= L
    }
    return { x: r[0].x, z: r[0].z, nx: 1, nz: 0 }
  }
  const cols = Math.max(4, Math.round(perim(at(y0)) / D2.gridPitch))
  const rows = Math.max(1, Math.round((y1 - y0) / D2.gridRise)), h = (y1 - y0) / rows, w = D2.gridWidth / 2
  for (let row = 0; row < rows; row++) {
    const ya = y0 + row * h, yb = ya + h, ra = at(ya), rb = at(yb), pa = perim(ra), pb = perim(rb)
    for (let c = 0; c < cols; c++) for (const dir of [1, -1]) {
      const ta = (c + (row % 2 ? 0.5 : 0)) / cols, a = pt(ra, pa, ta), b = pt(rb, pb, ta + (dir * 0.5) / cols)
      const sx = a.nz * w, sz = -a.nx * w, bx = b.nz * w, bz = -b.nx * w
      out.quad([[a.x - sx, ya, a.z - sz], [a.x + sx, ya, a.z + sz], [b.x + bx, yb, b.z + bz], [b.x - bx, yb, b.z - bz]], [a.nx, 0, a.nz], UV, colour, METAL)
    }
  }
}
const signedArea = (r: P[]): number => { let a = 0; for (let i = 0; i < r.length; i++) { const p = r[i], q = r[(i + 1) % r.length]; a += p.x * q.z - q.x * p.z } return a / 2 }

export function tourD2(out: MeshBuilder, fit: Fit): void {
  const r = towerRing(fit), H = fit.height > 140 && fit.height < 200 ? fit.height : D2.height
  let cx = 0, cz = 0
  for (const p of r) { cx += p.x / r.length; cz += p.z / r.length }
  let sxx = 0, szz = 0, sxz = 0
  for (const p of r) { const dx = p.x - cx, dz = p.z - cz; sxx += dx * dx; szz += dz * dz; sxz += dx * dz }
  const th = 0.5 * Math.atan2(2 * sxz, sxx - szz), ux = Math.cos(th), uz = Math.sin(th)
  let A = 0, B = 0
  for (const p of r) { const dx = p.x - cx, dz = p.z - cz; A = Math.max(A, Math.abs(dx * ux + dz * uz)); B = Math.max(B, Math.abs(-dx * uz + dz * ux)) }
  const e = 2 / D2.squareness, plan: P[] = []
  for (let i = 0; i < D2.segs; i++) {
    const t = (i / D2.segs) * Math.PI * 2, c = Math.cos(t), s = Math.sin(t)
    const u = A * Math.sign(c) * Math.abs(c) ** e, v = B * Math.sign(s) * Math.abs(s) ** e
    plan.push({ x: u * ux - v * uz, z: u * uz + v * ux })
  }
  if (signedArea(plan) * signedArea(r) < 0) plan.reverse()
  const scale = (y: number): number => {
    const t = y / H
    if (t >= D2.noseAt) { const u = Math.min(1, (t - D2.noseAt) / (1 - D2.noseAt)); return Math.max(D2.tip, D2.shoulder * Math.sqrt(1 - u * u)) }
    return t < D2.bulgeAt
      ? D2.foot + (D2.bulge - D2.foot) * Math.sin((t / D2.bulgeAt) * Math.PI / 2)
      : D2.shoulder + (D2.bulge - D2.shoulder) * Math.cos(((t - D2.bulgeAt) / (D2.noseAt - D2.bulgeAt)) * Math.PI / 2)
  }
  const at = (y: number): P[] => { const k = scale(y); return plan.map((p) => ({ x: cx + p.x * k, z: cz + p.z * k })) }
  loft(out, at, 0, H, D2.storey, hex(D2.glass), hex(D2.floorLine), hex(D2.roof))
  diagrid(out, at, 0, H, hex(D2.steel))
}
