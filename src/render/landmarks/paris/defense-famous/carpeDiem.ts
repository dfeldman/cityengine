/**
 * TOUR CARPE DIEM (Robert A. M. Stern Architects with SRA, 2013; 166 m), Place des Corolles, Courbevoie, on the
 * Boulevard Circulaire. A crystal prism on an irregular five-sided plan: every face is folded into big flat triangles
 * along diagonal creases running many storeys (white creases on blue-silver glass), the corners lean alternately out
 * and in, and the facets run on past the roof as an open glass screen whose top slants up to points, round a planted
 * roof terrace and a central plant block. A low wing at the south-west foot.
 * Sources: Panoramax street photo 2024 (api.panoramax.xyz, near 48.8914,2.2458, the tower behind its "Carpe Diem" sign:
 * the diagonal creases, the slanted crown screen, the colour); IGN LiDAR HD MNS (tools/ign-mns.ts, 2026-11-16): roof
 * terraces 145-149 m, crown screen tips 159-165 m, central block 162 m, the wing ~25 m, all above the ground; plan from
 * the MNS >130 m hull and OSM way/851434516 + 518.
 * Drawn in an east/north frame (metres from 48.89139 N, 2.24583 E) registered onto the fitted footprint (enframe.ts).
 * Shading is per plane: each facet takes one tone from its own normal.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { hex, shade, type Rgb } from '../../kit.ts'
import { registerRing, type P2, type V3 } from '../museums/enframe.ts'

const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
const GLASS = surfaceTag('glass')
const METAL = surfaceTag('metal')

// ---- tunables ----
const CD_GLASS = '#a3bad0'      // silver-blue glass with the sky in it
const CD_SCREEN = '#b8cad9'     // the crown screen, sky behind it
const CD_RIB = '#eef0f0'        // white creases and corner edges
const CD_MULL = '#c9d5de'       // fine vertical mullions
const CD_LOBBY = '#5f707a'      // lobby glass, interior showing
const CD_WING = '#d9d6cc'       // the low wing's pale cladding
const CD_WING_GLASS = '#8ea4b4'
const CD_GREEN = '#5d7f45'      // planted terrace
const CD_PLANT = '#cfd3d4'      // central plant block
const CD_ROOF = 147             // terrace roof (MNS 145-149)
const CD_TIP = 164              // crown screen tips (MNS 159-165)
const CD_LOW = 155              // crown screen at the other corners
const CD_CORE = 162             // central block (MNS 162)
const CD_FOLD_AT = 0.5          // share of the shaft where the folds turn
const CD_LEAN = 3.2             // m each corner leans out/in
const CD_LOBBY_H = 9
const CD_WING_H = 25            // MNS ~24-26
const CD_MULL_EVERY = 3.0
const CD_MULL_W = 0.22
const CD_RIB_W = 0.8
const CD_CORE_K = 0.42          // the plant block's share of the plan

// plan, east/north metres (MNS >130 m hull, OSM 516+518), anticlockwise
const TOWER: P2[] = [[-33, -6], [-7, -17], [15, 27], [-1, 50], [-11, 42]]
const WING: P2[] = [[-34, -7], [-42, -22], [-25, -25], [-16, -13]]
// the whole site the loader fits (OSM 516 ∪ 517 ∪ 518 hull)
const SITE: P2[] = [[-41.7, -21.8], [-25.4, -25.2], [-16.7, -14.2], [15.4, 26.9], [-0.5, 51.2], [-9.3, 45.1], [-11.8, 40], [-34, -5.9]]

export function carpeDiem(out: MeshBuilder, fit: Fit): void {
  const F = registerRing(SITE, fit)
  const P = (v: V3): V3 => F.p(v[0], v[1], v[2])
  const k = fit.height > 140 && fit.height < 190 ? fit.height / 166 : 1
  const ROOF = CD_ROOF * k, TIP = CD_TIP * k, LOW = CD_LOW * k, CORE = CD_CORE * k
  let ce = 0, cn = 0
  for (const [e, n] of TOWER) { ce += e / TOWER.length; cn += n / TOWER.length }

  const face = (pts: V3[], col: Rgb, tag: number, hint?: V3, lit = true): void => {
    const [a, b, c] = pts
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]]
    let n: V3 = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]
    const L = Math.hypot(...n) || 1; n = [n[0] / L, n[1] / L, n[2] / L]
    const h: V3 = hint ?? [(a[0] + b[0] + c[0]) / 3 - ce, (a[1] + b[1] + c[1]) / 3 - cn, 0]
    if (n[0] * h[0] + n[1] * h[1] + n[2] * h[2] < 0) n = [-n[0], -n[1], -n[2]]
    const t = lit ? 0.84 + 0.12 * (n[0] * -0.6 + n[1] * -0.8) + 0.2 * n[2] : 1
    const q = pts.length === 3 ? [pts[0], pts[1], pts[2], pts[2]] : pts
    out.quad(q.map(P) as [V3, V3, V3, V3], F.n(n), UV, shade(col, t), tag)
  }
  const strip = (a: V3, b: V3, w: number, col: Rgb, off = 0.15): void => {
    const om = [(a[0] + b[0]) / 2 - ce, (a[1] + b[1]) / 2 - cn], ol = Math.hypot(om[0], om[1]) || 1
    const o: V3 = [om[0] / ol, om[1] / ol, 0]
    const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]
    let wx = d[1] * o[2] - d[2] * o[1], wy = d[2] * o[0] - d[0] * o[2], wz = d[0] * o[1] - d[1] * o[0]
    const wl = Math.hypot(wx, wy, wz) || 1; wx *= w / 2 / wl; wy *= w / 2 / wl; wz *= w / 2 / wl
    const A: V3 = [a[0] + o[0] * off, a[1] + o[1] * off, a[2]], B: V3 = [b[0] + o[0] * off, b[1] + o[1] * off, b[2]]
    face([[A[0] - wx, A[1] - wy, A[2] - wz], [B[0] - wx, B[1] - wy, B[2] - wz], [B[0] + wx, B[1] + wy, B[2] + wz], [A[0] + wx, A[1] + wy, A[2] + wz]], col, METAL, o, false)
  }
  const push = (p: P2, d: number): P2 => { const de = p[0] - ce, dn = p[1] - cn, l = Math.hypot(de, dn) || 1; return [p[0] + de / l * d, p[1] + dn / l * d] }

  const glass = hex(CD_GLASS), rib = hex(CD_RIB), mull = hex(CD_MULL)
  // three rings: foot, fold, roof; corners lean alternately
  const lean = (s: number): P2[] => TOWER.map((p, i) => push(p, (i % 2 ? -1 : 1) * s * CD_LEAN))
  const yF = CD_LOBBY_H, yM = CD_LOBBY_H + (ROOF - CD_LOBBY_H) * CD_FOLD_AT
  const levels: [P2[], number][] = [[lean(-0.6), yF], [lean(0.8), yM], [lean(-0.5), ROOF]]

  // lobby: inset glass under the foot ring, white soffit
  const foot = levels[0][0], lob = foot.map((p) => push(p, -1.5))
  for (let i = 0; i < lob.length; i++) {
    const a = lob[i], b = lob[(i + 1) % lob.length]
    face([[a[0], a[1], 0], [b[0], b[1], 0], [b[0], b[1], yF], [a[0], a[1], yF]], hex(CD_LOBBY), GLASS, undefined, false)
    strip([a[0], a[1], 0], [a[0], a[1], yF], 0.6, rib)
  }
  face(foot.map((p) => [p[0], p[1], yF] as V3).reverse().slice(0, 3), rib, METAL, [0, 0, -1], false)
  for (let i = 1; i + 1 < foot.length; i++) face([[foot[0][0], foot[0][1], yF], [foot[i][0], foot[i][1], yF], [foot[i + 1][0], foot[i + 1][1], yF]], rib, METAL, [0, 0, -1], false)

  // shaft: each face of each segment two flat triangles, the crease alternating, ribs on creases and corners
  for (let s = 0; s < 2; s++) {
    const [r0, h0] = levels[s], [r1, h1] = levels[s + 1]
    for (let i = 0; i < r0.length; i++) {
      const j = (i + 1) % r0.length
      const a: V3 = [r0[i][0], r0[i][1], h0], b: V3 = [r0[j][0], r0[j][1], h0], c: V3 = [r1[j][0], r1[j][1], h1], d: V3 = [r1[i][0], r1[i][1], h1]
      if ((i + s) % 2) { face([a, b, c], glass, GLASS); face([a, c, d], glass, GLASS); strip(a, c, CD_RIB_W, rib) }
      else { face([a, b, d], glass, GLASS); face([b, c, d], glass, GLASS); strip(b, d, CD_RIB_W, rib) }
      strip(a, d, CD_RIB_W, rib)
      // fine mullions: lines from the bottom edge to the top edge (in the face's plane only if planar; offset hides the twist)
      const L = Math.hypot(b[0] - a[0], b[1] - a[1]), m = Math.max(2, Math.round(L / CD_MULL_EVERY))
      for (let f = 1; f < m; f++) {
        const u = f / m
        strip([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, h0], [d[0] + (c[0] - d[0]) * u, d[1] + (c[1] - d[1]) * u, h1], CD_MULL_W, mull, 0.35)
      }
    }
  }

  // crown: the roof ring's facets run up as an open screen to tips at alternate corners
  const top = levels[2][0], screen = hex(CD_SCREEN)
  const tipH = (i: number): number => (i % 2 ? LOW : TIP)
  for (let i = 0; i < top.length; i++) {
    const j = (i + 1) % top.length, a = top[i], b = top[j]
    const q: V3[] = [[a[0], a[1], ROOF], [b[0], b[1], ROOF], [b[0], b[1], tipH(j)], [a[0], a[1], tipH(i)]]
    face(q, screen, GLASS)
    face([...q].reverse(), shade(screen, 0.8), GLASS, [ce - (a[0] + b[0]) / 2, cn - (a[1] + b[1]) / 2, 0], false)
    strip(q[3], q[2], CD_RIB_W, rib)
    strip(q[0], q[3], CD_RIB_W, rib)
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]), m = Math.max(2, Math.round(L / CD_MULL_EVERY))
    for (let f = 1; f < m; f++) { const u = f / m; strip([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, ROOF], [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, tipH(i) + (tipH(j) - tipH(i)) * u], CD_MULL_W, mull, 0.35) }
  }
  // planted terrace and the central block
  for (let i = 1; i + 1 < top.length; i++) face([[top[0][0], top[0][1], ROOF], [top[i][0], top[i][1], ROOF], [top[i + 1][0], top[i + 1][1], ROOF]], hex(CD_GREEN), METAL, [0, 0, 1], false)
  const core = TOWER.map((p): P2 => [ce + (p[0] - ce) * CD_CORE_K, cn + (p[1] - cn) * CD_CORE_K])
  const plant = hex(CD_PLANT)
  for (let i = 0; i < core.length; i++) {
    const a = core[i], b = core[(i + 1) % core.length]
    face([[a[0], a[1], ROOF], [b[0], b[1], ROOF], [b[0], b[1], CORE], [a[0], a[1], CORE]], plant, METAL)
  }
  for (let i = 1; i + 1 < core.length; i++) face([[core[0][0], core[0][1], CORE], [core[i][0], core[i][1], CORE], [core[i + 1][0], core[i + 1][1], CORE]], shade(plant, 0.9), METAL, [0, 0, 1], false)

  // the low wing at the south-west foot: pale bands and glass, a green roof
  const wing = hex(CD_WING), wg = hex(CD_WING_GLASS)
  let we = 0, wn = 0
  for (const [e, n] of WING) { we += e / 4; wn += n / 4 }
  for (let i = 0; i < WING.length; i++) {
    const a = WING[i], b = WING[(i + 1) % WING.length], o: V3 = [(a[0] + b[0]) / 2 - we, (a[1] + b[1]) / 2 - wn, 0]
    for (let f = 0; f < 6; f++) {
      const h0 = (CD_WING_H / 6) * f, h1 = h0 + CD_WING_H / 6
      face([[a[0], a[1], h0], [b[0], b[1], h0], [b[0], b[1], h0 + 1.2], [a[0], a[1], h0 + 1.2]], wing, METAL, o)
      face([[a[0], a[1], h0 + 1.2], [b[0], b[1], h0 + 1.2], [b[0], b[1], h1], [a[0], a[1], h1]], wg, GLASS, o)
    }
  }
  face([[WING[0][0], WING[0][1], CD_WING_H], [WING[1][0], WING[1][1], CD_WING_H], [WING[2][0], WING[2][1], CD_WING_H], [WING[3][0], WING[3][1], CD_WING_H]], hex(CD_GREEN), METAL, [0, 0, 1], false)
}
