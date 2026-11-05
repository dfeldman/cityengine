/**
 * Hyatt Regency Paris Étoile (ex-Concorde La Fayette, Henri Beauclair 1974), Porte Maillot. Pale ribbed concrete tower,
 * dark window bands, on a podium filling the relation's footprint. Measured from IGN lidar MNS (2026-11-04): roof 130 m
 * above street (the entry's 131 includes the rim), podium roof 17 m, tower plan a rounded convex triangle ~53×40 m standing
 * off-centre (south-east) on the podium — TOWER is that outline in the fit frame (box centre 48.880216, 2.284241).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { box, hex, prism, type Rgb } from '../../kit.ts'
import { capPolygon } from '../../../buildings.ts'

type P = [number, number]
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
const wall = (out: MeshBuilder, a: P, b: P, y0: number, y1: number, c: Rgb, off = 0): void => {
  const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1, nx = dz / l, nz = -dx / l
  out.quad([[a[0] + nx * off, y0, a[1] + nz * off], [b[0] + nx * off, y0, b[1] + nz * off], [b[0] + nx * off, y1, b[1] + nz * off], [a[0] + nx * off, y1, a[1] + nz * off]], [nx, 0, nz], UV, c, 0)
}
const cap = (out: MeshBuilder, pts: P[], y: number, col: Rgb): void => capPolygon(out, pts.map(([x, z]) => ({ x, z })), y, col, 0)
/* lidar outline of the tower (fit frame, metres east/north), rounded by Chaikin passes */
const TOWER: P[] = [[-14.5, 9.2], [1.5, 9.2], [13.5, 2.2], [22.5, -7.8], [25.5, -18.8], [19.5, -27.8], [11.5, -30.8], [1.5, -28.8],
  [-10.5, -21.8], [-20.5, -11.8], [-27.5, -0.8], [-22.5, 5.2]]
const chaikin = (p: P[]): P[] => p.flatMap((a, i) => { const b = p[(i + 1) % p.length]; return [[a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]] as P[] })

export const HYATT = {
  PODIUM_H: 17, SMOOTH: 2, RIB_EVERY: 2, DX: 0, DZ: 0, /* nudge the lidar outline */
  FLOOR: 3.4, BASE_GAP: 4, MAST_H: 50, CROWN: 6, RIBS: 6,
}

export const hyattEtoile = (out: MeshBuilder, fit: Fit): void => {
  const K = HYATT, H = fit.height, conc = hex('#d8d2c4'), rib = hex('#ebe6da'), glass = hex('#3a4650'), pod = hex('#b9b2a2'), podG = hex('#2e383f'), roofC = hex('#8f897c')
  // podium: the relation's ring extruded
  const ring: P[] = fit.ring?.length ? fit.ring.map((p) => [p.x, p.z]) : [[-fit.hx, -fit.hz], [fit.hx, -fit.hz], [fit.hx, fit.hz], [-fit.hx, fit.hz]]
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length]
    wall(out, a, b, 0, K.PODIUM_H, pod)
    if (Math.hypot(b[0] - a[0], b[1] - a[1]) > 3) wall(out, a, b, 1, K.PODIUM_H - 3, podG, 0.05)
  }
  cap(out, ring, K.PODIUM_H, roofC)
  // tower: the lidar outline, rounded
  let pts: P[] = [...TOWER].reverse().map(([x, z]) => [x + K.DX, z + K.DZ])
  for (let i = 0; i < K.SMOOTH; i++) pts = chaikin(pts)
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cz = pts.reduce((s, p) => s + p[1], 0) / pts.length
  const y0 = K.PODIUM_H, top = H - K.CROWN, n = Math.floor((top - y0 - K.BASE_GAP) / K.FLOOR)
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length]
    wall(out, a, b, y0, H, conc)
    for (let f = 0; f < n; f++) {
      const y = y0 + K.BASE_GAP + f * K.FLOOR
      wall(out, a, b, y + 0.9, y + K.FLOOR - 0.5, glass, 0.04)
    }
    if (i % K.RIB_EVERY === 0) { // vertical ribs
      const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz)
      box(out, a[0] + dz / l * 0.35, (y0 + top) / 2, a[1] - dx / l * 0.35, 0.35, (top - y0) / 2, 0.35, rib)
    }
  }
  cap(out, pts, H, roofC)
  // crown and mast
  for (let i = 0; i < pts.length; i++) wall(out, pts[i], pts[(i + 1) % pts.length], H, H + 1.2, rib)
  box(out, cx, H + 2.5, cz, 6, 2.5, 6, conc)
  prism(out, cx, cz, H + 5, H + 5 + K.MAST_H, 0.6, 6, hex('#c8c4bc'), 0, 0.4)
}
