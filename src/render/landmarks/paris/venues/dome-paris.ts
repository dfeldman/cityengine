/**
 * The DÔME DE PARIS - PALAIS DES SPORTS at the Porte de Versailles (Pierre Dufau, Victor de Larivière, on R. Buckminster
 * Fuller's geodesic process; metal structure by Entreprise Eiffel, 1959–60: Wikipedia fr, which gives about 70 m across and
 * 1,100 aluminium panels). OSM: way/44326511 with its building:parts: height 29, roof:height 21, the dome's part 60 m
 * round, the ring round it 68 m at 8 m, low annexes at 3.5–6 m.
 *
 * The dome reads from the whole boulevard: a shallow cap of aluminium panels, each a triangle dished in to its centre, with
 * dark seams between (Commons "DÔME de Paris"). Drawn as a true geodesic sphere of frequency 14, cut at its base plane, and
 * so about the panel count the source gives. Round its foot, the low corrugated annexes on OSM's outline, with the blue
 * boards facing the Place de la Porte de Versailles (Commons "Dôme de Paris (Palais des Sports) façade").
 *
 * Placed by point and size: `front` 45, local −z north-east to the place.
 */
import { capPolygon, type MeshBuilder } from '../../../buildings.ts'
import { box, prism, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { signText } from '../../parts.ts'
import { ccw, jitter, plan } from '../museums/shapes.ts'
import { groundMid, quadN, type V3 } from './bowl.ts'
import { edgesOf, row, walls } from './shell.ts'

const PANEL: Rgb = [0.74, 0.76, 0.76]
const SEAM: Rgb = [0.34, 0.36, 0.38]
const WALL: Rgb = [0.66, 0.68, 0.68]
const RIB: Rgb = [0.56, 0.58, 0.58]
const DARK: Rgb = [0.13, 0.15, 0.17]
const ROOF: Rgb = [0.5, 0.51, 0.5]
const BOARD: Rgb = [0.08, 0.26, 0.5]

/** OSM's outline in this frame, bay notches and all */
const OUTLINE: [number, number][] = [[20, 35], [-13, 30], [-27, 21], [-31, 23], [-37, 11], [-40, -3], [-35, -19], [-29, -27], [-20, -35], [-18, -31],
  [-11, -34], [3, -35], [12, -33], [19, -29], [28, -19], [34, -23], [39, -12], [36, -11], [37, 4], [40, 5], [36, 16], [34, 17], [29, 14], [25, 21], [30, 25]]

const ICO_V: V3[] = (() => {
  // an icosahedron with a vertex at the top, so the dome has a true pole
  const a = Math.atan(1 / 2)
  const v: V3[] = [[0, 1, 0]]
  for (let i = 0; i < 5; i++) v.push([Math.cos(a) * Math.cos((i * 2 * Math.PI) / 5), Math.sin(a), Math.cos(a) * Math.sin((i * 2 * Math.PI) / 5)])
  for (let i = 0; i < 5; i++) v.push([Math.cos(a) * Math.cos(((i + 0.5) * 2 * Math.PI) / 5), -Math.sin(a), Math.cos(a) * Math.sin(((i + 0.5) * 2 * Math.PI) / 5)])
  v.push([0, -1, 0])
  return v
})()
const ICO_F: [number, number, number][] = (() => {
  const f: [number, number, number][] = []
  for (let i = 0; i < 5; i++) {
    const j = (i + 1) % 5
    f.push([0, 1 + i, 1 + j], [1 + i, 6 + i, 1 + j], [1 + j, 6 + i, 6 + j], [11, 6 + j, 6 + i])
  }
  return f
})()

const unit = (p: V3): V3 => { const l = Math.hypot(p[0], p[1], p[2]); return [p[0] / l, p[1] / l, p[2] / l] }

/** the geodesic sphere's triangles above the plane y = `cut` (unit sphere), as unit-sphere corners */
function geodesic(freq: number, cut: number): [V3, V3, V3][] {
  const tris: [V3, V3, V3][] = []
  for (const [ia, ib, ic] of ICO_F) {
    const [A, B, C] = [ICO_V[ia], ICO_V[ib], ICO_V[ic]]
    const at = (i: number, j: number): V3 => {
      const k = freq - i - j
      return unit([(A[0] * k + B[0] * i + C[0] * j) / freq, (A[1] * k + B[1] * i + C[1] * j) / freq, (A[2] * k + B[2] * i + C[2] * j) / freq])
    }
    for (let i = 0; i < freq; i++) {
      for (let j = 0; j < freq - i; j++) {
        const cand: [V3, V3, V3][] = [[at(i, j), at(i + 1, j), at(i, j + 1)]]
        if (i + j < freq - 1) cand.push([at(i + 1, j), at(i + 1, j + 1), at(i, j + 1)])
        for (const t of cand) if (Math.max(t[0][1], t[1][1], t[2][1]) > cut) tris.push(t)
      }
    }
  }
  return tris
}

export function domeParis(out: MeshBuilder, fit: Fit): void {
  const metal = surfaceTag('metal')
  const conc = surfaceTag('concrete')
  const glass = surfaceTag('glass')
  const g = groundMid(fit)
  const sx = fit.hx / 40
  const sz = fit.hz / 35.4
  const ring = ccw(plan(OUTLINE, sx, sz))
  const k = Math.min(sx, sz)
  const baseY = g + 7

  // ---- the annexes: ribbed walls, a dark band of windows, a flat roof
  walls(out, ring, g - 0.5, baseY + 0.5, WALL, metal)
  capPolygon(out, ring, baseY + 0.5, ROOF, conc)
  for (const e of edgesOf(ring)) {
    row(out, e, g, baseY - g + 0.4, 1.9, 0.5, 0.05, RIB, metal, 0.4)
    row(out, e, g + 4.6, 0.9, 5, 3.6, 0.1, DARK, glass, 1)
  }

  // ---- the dome: base radius 33, rise 22, up to OSM's 29 m, on a true sphere
  const r = 33 * k
  const rise = 22 * Math.min(k, 1)
  const R = (r * r + rise * rise) / (2 * rise)
  const cx = 0.4 * sx
  const cz = -1.8 * sz
  const cy = baseY + rise - R
  const cut = (baseY - cy) / R
  prism(out, cx, cz, baseY, baseY + 1.1, r + 0.5, 48, RIB, metal)
  const P = (u: V3, f = 1): V3 => [cx + u[0] * R * f, Math.max(cy + u[1] * R * f, baseY), cz + u[2] * R * f]
  let n = 0
  for (const [a, b, c] of geodesic(14, cut)) {
    const want: V3 = unit([a[0] + b[0] + c[0], a[1] + b[1] + c[1], a[2] + b[2] + c[2]])
    // the seam behind, then the panel: three facets inset from the corners and dished in to the centre
    quadN(out, [P(a), P(b), P(c), P(c)], want, SEAM, metal)
    const m: V3 = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3]
    const inset = (q: V3): V3 => [m[0] + (q[0] - m[0]) * 0.955, m[1] + (q[1] - m[1]) * 0.955, m[2] + (q[2] - m[2]) * 0.955]
    const mid = P(unit(m), 0.986)
    const lift = 1.006
    const [A, B, C] = [P(inset(a), lift), P(inset(b), lift), P(inset(c), lift)]
    const tone = 0.95 + jitter(n++, 3) * 0.1
    const col: Rgb = [PANEL[0] * tone, PANEL[1] * tone, PANEL[2] * tone]
    quadN(out, [A, B, mid, mid], want, col, metal)
    quadN(out, [B, C, mid, mid], want, col, metal)
    quadN(out, [C, A, mid, mid], want, col, metal)
  }

  // ---- the front to the place: the two blue boards over the doors, the dark glass under them
  const zf = -35 * sz
  for (const [x, t] of [[-9, 'LE DOME DE PARIS'], [9, 'PALAIS DES SPORTS']] as [number, string][]) {
    box(out, x * sx, g + 5.4, zf - 0.3, 8.2, 3.4, 0.2, BOARD, metal)
    signText(out, t, x * sx, g + 5.4, zf - 0.55, 1.1, [0.95, 0.96, 0.97], { heading: Math.PI })
  }
  box(out, 0, g + 1, zf - 0.1, 16, 1.2, 0.1, DARK, glass)
}
