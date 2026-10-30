/**
 * The PALAIS DES CONGRÈS at the Porte Maillot (Guillaume Gillet, Serge Maloletenkov, Yves Betin, Henri Guibout, 1970–74;
 * extended 1997–99 by Christian de Portzamparc: Wikipedia fr). OSM: relation/3074644, with relation/3074648 (height 40) and
 * relation/3074646 (height 21); the Hyatt's tower stands behind it, a building of its own, and is not claimed.
 *
 * Wikipedia fr gives the thing a rider on the Place de la Porte-Maillot sees: "son imposante façade en plan incliné", Portzamparc's
 * great sloping plane, with the inverted cone of the Bordeaux amphitheatre showing on it. Commons "L'escalier du Palais des
 * Congrés à Paris" shows the cone's underside in grey panels and an open steel stair at the foot. The plane rises from over the
 * forecourt to the top of the 1974 block behind, a fan of pale concrete and dark bands of window on OSM's plan.
 *
 * Placed by point and size: `front` 208, local −z south-south-west to the place, the plan nearly symmetric about x = 0. The
 * plane's height comes from OSM's 21 m and 40 m, its foot and its glass from memory, the cone's place left of the middle from
 * memory: no elevation was checked.
 */
import { capPolygon, type MeshBuilder } from '../../../buildings.ts'
import { box, prism, strut, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { signText } from '../../parts.ts'
import { ccw, plan } from '../museums/shapes.ts'
import { groundMid, quadN, type V3 } from './bowl.ts'
import { edgesOf, row, sheet, walls } from './shell.ts'

const HX = 86.8
const HZ = 90.6
/** the 40 m block, relation/3074648 in this frame */
const BLOCK: [number, number][] = [[-51, -41], [17, -36], [53, -41], [55, -11], [49, 24], [39, 53], [27, 73], [33, 78], [25, 90], [20, 87], [-1, 82], [-12, 84], [-23, 90], [-31, 78], [-25, 74], [-41, 42], [-51, 7]]
/** the low front along the place, the outline's south strip */
const FRONT: [number, number][] = [[-87, -90], [-42, -90], [-42, -85], [50, -86], [50, -90], [87, -90], [76, -58], [-76, -58]]

const CONC: Rgb = [0.74, 0.73, 0.69]
const CONC_DK: Rgb = [0.56, 0.56, 0.54]
const GLASS: Rgb = [0.15, 0.2, 0.25]
const GLASS2: Rgb = [0.22, 0.29, 0.34]
const PANEL: Rgb = [0.74, 0.75, 0.75]
const PANEL2: Rgb = [0.68, 0.69, 0.7]
const ROOF: Rgb = [0.48, 0.48, 0.47]
const STEEL: Rgb = [0.36, 0.38, 0.4]

const clampY = (y: number, lo: number, hi: number): number => Math.min(Math.max(y, lo), hi)

export function palaisCongres(out: MeshBuilder, fit: Fit): void {
  const conc = surfaceTag('concrete')
  const glass = surfaceTag('glass')
  const metal = surfaceTag('metal')
  const g = groundMid(fit)
  const sx = fit.hx / HX
  const sz = fit.hz / HZ
  const H = g + 40

  // ---- the 1974 block: pale concrete, its floors in dark bands, a roof with its plant
  const block = ccw(plan(BLOCK, sx, sz))
  walls(out, block, g - 0.5, H, CONC, conc)
  capPolygon(out, block, H, ROOF, conc)
  for (const e of edgesOf(block)) {
    if (e.L < 6) continue
    for (let f = 0; f < 7; f++) {
      const y = g + 6 + f * 4.8
      sheet(out, e, 0.8, e.L - 0.8, y, y + 2.4, 0.06, GLASS, glass)
      row(out, e, y, 2.4, 3.6, 0.3, 0.12, CONC_DK, conc, 0.8)
    }
  }
  box(out, 0, H + 1.6, 10 * sz, 22 * sx, 1.6, 16 * sz, CONC_DK, conc)

  // ---- the low front along the place: stone and glass, a terrace on it
  const front = ccw(plan(FRONT, sx, sz))
  const fH = g + 5
  walls(out, front, g - 0.5, fH, CONC, conc)
  capPolygon(out, front, fH, CONC_DK, conc)
  for (const e of edgesOf(front)) {
    if (e.L < 8) continue
    sheet(out, e, 1, e.L - 1, g + 0.2, g + 3.8, 0.06, GLASS, glass)
    row(out, e, g + 0.2, 3.6, 4.8, 0.4, 0.14, PANEL, conc, 1)
  }

  // ---- the inclined plane: from over the terrace up to the block's top, a shallow fan of glass bands on a steel grid
  const xs = 66 * sx
  const footY = g + 9
  const topZ = -41 * sz
  const nx = 22
  const nr = 9
  const P = (i: number, r: number, off = 0): V3 => {
    const x = -xs + (2 * xs * i) / nx
    const f = r / nr
    const z0 = -66 * sz - 6 * sz * (x / xs) ** 2      // the plane's foot: its ends stand forward of its middle
    return [x, footY + (H - footY) * f + off, z0 + (topZ - z0) * f - off]
  }
  const want: V3 = [0, 0.7, -0.7]
  for (let r = 0; r < nr; r++) {
    for (let i = 0; i < nx; i++) {
      const c = (i + r) % 3 === 0 ? GLASS2 : GLASS
      quadN(out, [P(i, r), P(i + 1, r), P(i + 1, r + 1), P(i, r + 1)], want, c, glass)
      // its back, the grey panels seen from under it
      quadN(out, [P(i, r, -0.5), P(i + 1, r, -0.5), P(i + 1, r + 1, -0.5), P(i, r + 1, -0.5)], [0, -0.7, 0.7], PANEL, metal)
    }
  }
  for (let i = 0; i <= nx; i++) strut(out, P(i, 0, 0.12), P(i, nr, 0.12), 0.34, 0.34, STEEL, metal, false)
  for (let r = 0; r <= nr; r++) strut(out, P(0, r, 0.12), P(nx, r, 0.12), 0.26, 0.26, STEEL, metal, false)
  // the plane's cheeks, closing it to the block, and the heavy eave at its top
  for (const [i, s] of [[0, -1], [nx, 1]] as [number, number][]) {
    const a = P(i, 0)
    const b = P(i, nr)
    quadN(out, [a, b, [b[0], H, 18 * sz], [a[0], footY, 18 * sz]], [s, 0, 0], CONC, conc)
  }
  box(out, 0, H + 0.4, topZ - 0.2, xs + 0.8, 0.8, 1.6, CONC, conc)
  signText(out, 'PALAIS DES CONGRES', 0, H - 3.8, topZ - 4, 3.2, [0.96, 0.96, 0.94], { heading: Math.PI })
  // the slim columns under the plane's foot
  for (let i = 2; i <= nx - 2; i += 3) {
    const a = P(i, 0, -0.5)
    strut(out, [a[0], g, a[2]], a, 0.9, 0.9, CONC, conc)
  }

  // ---- the inverted cone of the Bordeaux amphitheatre, left of the middle: it hangs under the plane over the forecourt, in grey
  // panels (the Commons photograph), and shows through the glass as a pale round where it meets the plane
  const cx = -24 * sx
  const cz = -50 * sz
  const y0 = g + 3
  const flare = 0.5
  const planeZ = (x: number, yy: number): number => {
    const z0p = -66 * sz - 6 * sz * (x / xs) ** 2
    return z0p + (topZ - z0p) * ((yy - footY) / (H - footY))
  }
  // the height where a generator of the cone comes up to the plane's back
  const seam = (a: number): number => {
    let lo = y0
    let hi = H - 2
    for (let it = 0; it < 18; it++) {
      const y = (lo + hi) / 2
      const r = 2 + (y - y0) * flare
      if (cz + Math.sin(a) * r > planeZ(cx + Math.cos(a) * r, y)) lo = y
      else hi = y
    }
    return lo
  }
  const C = (a: number, f: number): V3 => {
    const y = y0 + (seam(a) - y0) * f
    const r = 2 + (y - y0) * flare
    return [cx + Math.cos(a) * r, y, cz + Math.sin(a) * r]
  }
  const ns = 28
  for (let i = 0; i < ns; i++) {
    const a0 = (i / ns) * Math.PI * 2
    const a1 = ((i + 1) / ns) * Math.PI * 2
    const m = (a0 + a1) / 2
    for (let k = 0; k < 4; k++) {
      quadN(out, [C(a0, k / 4), C(a1, k / 4), C(a1, (k + 1) / 4), C(a0, (k + 1) / 4)], [Math.cos(m), -0.12, Math.sin(m)], (i + k) % 2 ? PANEL : PANEL2, metal)
    }
    // the round on the plane, a shade paler than the glass, and its rim
    const proud = 0.18
    const R = (a: number, f: number): V3 => {
      const y = y0 + (seam(a) - y0) * f
      const r = 2 + (y - y0) * flare
      const x = cx + Math.cos(a) * r * 1.02
      const yy = clampY(y, footY, g + 27)
      return [x, yy + proud, planeZ(x, yy) - proud]
    }
    quadN(out, [[cx, g + 18, planeZ(cx, g + 18) - proud], R(a0, 1), R(a1, 1), R(a1, 1)], want, i % 2 ? PANEL : PANEL2, metal)
    strut(out, R(a0, 1), R(a1, 1), 0.3, 0.3, STEEL, metal, false)
  }
  prism(out, cx, cz, y0 - 0.2, y0, 0.01, 12, STEEL, metal, 2)

  // ---- the open steel stair from the place up to the terrace, with its glass balustrades
  const sx0 = 22 * sx
  const z0 = -90 * sz
  const zT = z0 - 11
  for (let s = 0; s < 14; s++) {
    const f = s / 14
    box(out, sx0, g + f * 5 + 0.1, zT + (z0 - zT) * f, 3, 0.1, 0.42, [0.62, 0.62, 0.6], metal)
  }
  for (const d of [-3.1, 3.1]) {
    strut(out, [sx0 + d, g + 1, zT], [sx0 + d, fH + 1, z0], 0.14, 0.14, STEEL, metal, false)
    strut(out, [sx0 + d, g, zT], [sx0 + d, fH, z0], 0.3, 0.5, STEEL, metal, false)
  }
}
