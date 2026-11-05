/**
 * Lumière (ex-Bercy Expo, H. La Fonta, 1993), avenue des Terroirs-de-France / place Saint-Estèphe, Paris 12e. A 350 m
 * ship-shaped office block between the avenue and the Bercy rail yard: eight storeys of blue-green glass curtain wall,
 * a grey metal canopy band along the avenue, and a central glazed atrium (52,000 m³) between the Garonne and Seine wings
 * whose roof is covered in solar panels. IGN lidar MNS (2026-11-04): wings' roof ~29 m above the avenue (35 m above the
 * rail yard; the yard side drops ~6 m), the atrium roof ~35 m, spanning about x −60..+42 of the OSM box and inset ~7 m
 * from both long faces; two round glass skylights near the ends (aerial). Facade from Commons "Avenue des Terroirs-de-France,
 * Bercy - Paris 2012-04-09". Plan is OSM's outline.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { capPolygon } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { box, disc, hex, type Rgb } from '../../kit.ts'
import { offsetRing } from '../../parts.ts'
import { simplifyRing } from '../../tower.ts'

type P = { x: number; z: number }
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

export const LUMIERE = {
  FLOOR: 3.4, BASE: 5.5, BAND: 0.35, BAND_OFF: 0.12, MULLION: 6, MULL_W: 0.25, MULL_OFF: 0.15,
  CANOPY_Y: 5.2, CANOPY_T: 0.8, CANOPY_OFF: 1.6, PARAPET: 1.0,
  ATRIUM_X0: -60, ATRIUM_X1: 42, ATRIUM_INSET: 7, ATRIUM_UP: 6, PANEL_ROWS: 14,
  SKY_X: 0.78, SKY_R: 5, PLANT: [[-0.55, 0.25, 4, 3], [0.62, -0.2, 5, 3], [0.4, 0.2, 3, 2.5]] as [number, number, number, number][],
}

const wall = (out: MeshBuilder, a: P, b: P, y0: number, y1: number, c: Rgb, off = 0): void => {
  const dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1, nx = dz / l, nz = -dx / l
  out.quad([[a.x + nx * off, y0, a.z + nz * off], [b.x + nx * off, y0, b.z + nz * off], [b.x + nx * off, y1, b.z + nz * off], [a.x + nx * off, y1, a.z + nz * off]], [nx, 0, nz], UV, c, 0)
}

/** Sutherland–Hodgman clip of a ring to x0 ≤ x ≤ x1. */
const clipX = (ring: P[], x0: number, x1: number): P[] => {
  const cut = (pts: P[], keep: (p: P) => boolean, xc: number): P[] => {
    const r: P[] = []
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length], ka = keep(a), kb = keep(b)
      if (ka) r.push(a)
      if (ka !== kb) { const t = (xc - a.x) / (b.x - a.x); r.push({ x: xc, z: a.z + t * (b.z - a.z) }) }
    }
    return r
  }
  return cut(cut(ring, (p) => p.x >= x0, x0), (p) => p.x <= x1, x1)
}

export const lumiereBercy = (out: MeshBuilder, fit: Fit): void => {
  const K = LUMIERE, H = fit.height
  const glass = hex('#5f8a95'), band = hex('#c9ccc8'), mull = hex('#9aa3a5'), canopy = hex('#8e9496'), roofC = hex('#9b9a94')
  const atrGlass = hex('#5d7d88'), solar = hex('#28344a'), skyC = hex('#9fc3cf'), plant = hex('#b5b3ab')
  const ring = fit.ring?.length ? fit.ring : [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  const floors = Math.max(1, Math.round((H - K.BASE - K.PARAPET) / K.FLOOR))
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length], l = Math.hypot(b.x - a.x, b.z - a.z)
    if (l < 0.3) continue
    wall(out, a, b, 0, H, glass)
    wall(out, a, b, H - K.PARAPET, H, band, K.BAND_OFF)
    for (let f = 0; f <= floors; f++) { const y = K.BASE + f * K.FLOOR; wall(out, a, b, y - K.BAND, y, band, K.BAND_OFF) }
    if (l > 25) wall(out, a, b, K.CANOPY_Y, K.CANOPY_Y + K.CANOPY_T, canopy, K.CANOPY_OFF) // the grey metal canopy band
    const n = Math.floor(l / K.MULLION), ux = (b.x - a.x) / l, uz = (b.z - a.z) / l
    for (let m = 1; m < n; m++) {
      const s = (m * l) / n, p = { x: a.x + ux * (s - K.MULL_W), z: a.z + uz * (s - K.MULL_W) }, q = { x: a.x + ux * (s + K.MULL_W), z: a.z + uz * (s + K.MULL_W) }
      wall(out, p, q, K.BASE, H - K.PARAPET, mull, K.MULL_OFF)
    }
  }
  capPolygon(out, ring, H, roofC, 0)
  // the central atrium: a raised glazed box carrying rows of solar panels
  const atr = offsetRing(simplifyRing(clipX(ring, K.ATRIUM_X0, K.ATRIUM_X1), 4), -K.ATRIUM_INSET)
  const top = H + K.ATRIUM_UP
  for (let i = 0; i < atr.length; i++) wall(out, atr[i], atr[(i + 1) % atr.length], H, top, atrGlass)
  capPolygon(out, atr, top, atrGlass, 0)
  let zMin = Infinity, zMax = -Infinity
  for (const p of atr) { zMin = Math.min(zMin, p.z); zMax = Math.max(zMax, p.z) }
  const ax0 = K.ATRIUM_X0 + K.ATRIUM_INSET + 2, ax1 = K.ATRIUM_X1 - K.ATRIUM_INSET - 2, step = (ax1 - ax0) / K.PANEL_ROWS
  for (let r = 0; r < K.PANEL_ROWS; r++) {
    const cx = ax0 + (r + 0.5) * step
    const strip = clipX(atr, cx - step * 0.35, cx + step * 0.35)
    let z0 = Infinity, z1 = -Infinity
    for (const p of strip) { z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z) }
    if (z1 - z0 > 4) box(out, cx, top + 0.35, (z0 + z1) / 2, step * 0.35, 0.3, (z1 - z0) / 2 - 1.5, solar)
  }
  // round glass skylights near both ends, and plant blocks on the wings
  for (const s of [-1, 1]) disc(out, s * fit.hx * K.SKY_X, H + 0.6, 0, K.SKY_R, skyC)
  for (const [fx, fz, hw, hh] of K.PLANT) box(out, fx * fit.hx, H + hh / 2, fz * fit.hz, hw, hh / 2, hw * 0.7, plant)
}
