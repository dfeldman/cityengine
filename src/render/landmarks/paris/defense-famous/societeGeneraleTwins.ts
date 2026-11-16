/**
 * TOURS SOCIÉTÉ GÉNÉRALE — ALICANTE (north) and CHASSAGNE (south), Michel Andrault & Pierre Parat, 1995; 2 × 167 m,
 * 37 floors (fr.wikipedia "Tours Société Générale"). Each plan is a quarter-round: a curved back and a straight inner
 * front notched by a recessed dark slot; the two fronts face each other across a ~50 m joint base. Each top is one
 * steep skillion plane falling ~30 m from the curved back down to the inner front (OSM roof:direction 160 / -20,
 * roof:height 30; IGN LiDAR HD MNS: back edge ~158-170 m, front eave ~130-137 m, base between them 40-55 m), so the
 * pair's crowns slope towards each other: the "wild" crown.
 * Colour (Commons/fr.wiki photos "Tours_Chassagne_Alicante_Aout_2022.jpeg", "Tours_Granite_Chassagne_et_Alicante_
 * (vue_Parc_Nanterre).JPG"): the curved faces read silver-blue with strong floor bands; the straight inner fronts and
 * the slot are much darker tinted glass, the owner's "dark" towers.
 * Drawn in an east/north frame registered on the OSM ring (enframe.ts), so the slope keeps its real compass bearing.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { hex, shade, type Rgb } from '../../kit.ts'
import { registerRing, type P2, type V3 } from '../museums/enframe.ts'

const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
const GLASS = surfaceTag('glass')
const METAL = surfaceTag('metal')

// tunables
const SG_HEIGHT = 167
const SG_ROOF = 30            // skillion drop, back edge to front eave
const SG_FLOOR = 4.2          // floor-band pitch
const SG_BAND_H = 0.7
const SG_CURVED = '#8ea2b6'   // silver-blue curved back, sky-reflecting
const SG_FRONT = '#3e5068'    // dark tinted straight fronts
const SG_SLOT = '#26323f'     // the recessed slot
const SG_BAND = '#c3ccd3'     // floor bands
const SG_TOP = '#6f8496'      // the sloped glass crown
const SG_TOP_RIB = '#b8c2c9'
const SG_TOP_RIBS = 7
const SG_BASE_H = 48          // the joint base (MNS 40-55 m)
const SG_BASE_REACH = 9       // how far each tower's half of the base reaches towards the other
const SG_BASE = '#55636e'
const SG_LONG = 8             // an edge longer than this is a straight front

// OSM rings, metres east/north of each way's vertex centroid (way/226235094, way/226235095)
const ALICANTE: P2[] = [[-35.7, -25.1], [-32.0, -23.8], [-10.2, -16.0], [-4.2, -18.8], [4.2, -22.7], [7.9, -15.3], [11.3, -8.3], [30.2, -1.6], [33.9, -0.3], [32.2, 1.8], [30.4, 3.7], [28.5, 5.6], [26.3, 7.2], [24.1, 8.8], [22.5, 9.7], [21.2, 10.5], [18.9, 11.7], [16.9, 12.6], [15.3, 13.2], [11.6, 14.4], [6.3, 15.2], [1.0, 15.4], [-4.1, 14.8], [-9.1, 13.5], [-14.1, 11.5], [-18.7, 8.8], [-22.9, 5.6], [-26.3, 2.1], [-29.4, -1.9], [-31.8, -6.2], [-33.7, -10.7], [-35.0, -15.3], [-35.6, -20.2]]
const CHASSAGNE: P2[] = [[-38.8, -0.2], [-36.5, -2.9], [-33.9, -5.4], [-33.3, -5.9], [-31.8, -7.1], [-28.9, -8.8], [-26.7, -10.2], [-24.3, -11.5], [-21.8, -12.6], [-19.4, -13.5], [-15.4, -14.5], [-11.6, -15.1], [-8.8, -15.3], [-6.3, -15.2], [-2.2, -14.9], [1.6, -14.1], [4.3, -13.4], [6.7, -12.5], [10.4, -10.8], [13.7, -8.8], [16.0, -7.1], [17.9, -5.5], [20.8, -2.6], [23.2, 0.4], [24.8, 2.7], [26.0, 4.9], [27.2, 7.3], [28.0, 9.2], [29.0, 12.3], [29.7, 15.0], [30.1, 17.5], [30.5, 21.5], [30.4, 25.5], [26.2, 24.0], [7.2, 17.1], [0.1, 20.2], [-7.0, 23.3], [-9.8, 16.3], [-12.5, 9.5], [-35.2, 1.1]]

export function alicante(out: MeshBuilder, fit: Fit): void { twin(out, fit, ALICANTE, 160) }
export function chassagne(out: MeshBuilder, fit: Fit): void { twin(out, fit, CHASSAGNE, -20) }

function ccw(r: P2[]): P2[] {
  let A = 0
  for (let i = 0; i < r.length; i++) { const p = r[i], q = r[(i + 1) % r.length]; A += p[0] * q[1] - q[0] * p[1] }
  return A < 0 ? [...r].reverse() : r
}

function twin(out: MeshBuilder, fit: Fit, ring0: P2[], roofDir: number): void {
  const F = registerRing(ring0, fit)
  const r = ccw(ring0)
  const H = fit.height > 150 && fit.height < 185 ? fit.height : SG_HEIGHT
  // downslope unit vector (towards the inner front)
  const de = Math.sin(roofDir * Math.PI / 180), dn = Math.cos(roofDir * Math.PI / 180)
  const s = (p: P2): number => p[0] * de + p[1] * dn
  let s0 = Infinity, s1 = -Infinity
  for (const p of r) { s0 = Math.min(s0, s(p)); s1 = Math.max(s1, s(p)) }
  const top = (p: P2): number => H - SG_ROOF * (s(p) - s0) / (s1 - s0)

  const quad = (q: V3[], nEN: V3, col: Rgb, kind: number): void => {
    out.quad([F.p(...q[0]), F.p(...q[1]), F.p(...q[2]), F.p(...q[3])], F.n(nEN), UV, col, kind)
  }
  // which edges are the slot (the short edges between the two long front runs)
  const n = r.length
  const len = (i: number): number => { const a = r[i], b = r[(i + 1) % n]; return Math.hypot(b[0] - a[0], b[1] - a[1]) }
  const front = (i: number): boolean => s(r[i]) > s0 + 0.6 * (s1 - s0) && s(r[(i + 1) % n]) > s0 + 0.6 * (s1 - s0)

  for (let i = 0; i < n; i++) {
    const a = r[i], b = r[(i + 1) % n], L = len(i)
    if (L < 0.05) continue
    const nx = (b[1] - a[1]) / L, ny = -(b[0] - a[0]) / L
    const isFront = front(i)
    const col = hex(isFront ? (L > SG_LONG ? SG_FRONT : SG_SLOT) : SG_CURVED)
    const ta = top(a), tb = top(b)
    // per-face tone from the face's bearing (sky light from the south-west)
    const t = 0.9 + 0.12 * (nx * -0.5 + ny * -0.7)
    quad([[a[0], a[1], 0], [b[0], b[1], 0], [b[0], b[1], tb], [a[0], a[1], ta]], [nx, ny, 0], shade(col, t), GLASS)
    // floor bands (not on the slot)
    if (isFront && L <= SG_LONG) continue
    const o = 0.08, band = hex(SG_BAND)
    for (let y = SG_FLOOR; y < Math.min(ta, tb) - 1; y += SG_FLOOR) {
      quad([[a[0] + nx * o, a[1] + ny * o, y], [b[0] + nx * o, b[1] + ny * o, y], [b[0] + nx * o, b[1] + ny * o, y + SG_BAND_H], [a[0] + nx * o, a[1] + ny * o, y + SG_BAND_H]], [nx, ny, 0], shade(band, t), METAL)
    }
  }

  // the skillion crown: a fan from the centroid (the plan is star-shaped about it)
  let ce = 0, cn = 0
  for (const p of r) { ce += p[0] / n; cn += p[1] / n }
  const c: P2 = [ce, cn]
  const slope = SG_ROOF / (s1 - s0)
  const up: V3 = [de * slope, dn * slope, 1]
  const ul = Math.hypot(...up)
  const nUp: V3 = [up[0] / ul, up[1] / ul, up[2] / ul]
  const topCol = hex(SG_TOP)
  for (let i = 0; i < n; i++) {
    const a = r[i], b = r[(i + 1) % n]
    quad([[c[0], c[1], top(c)], [a[0], a[1], top(a)], [b[0], b[1], top(b)], [b[0], b[1], top(b)]], nUp, topCol, GLASS)
  }
  // horizontal ribs across the slope (the stepped glazing): lines of equal height
  const rib = hex(SG_TOP_RIB)
  const pe = -dn, pn = de // along the contour
  for (let k = 1; k < SG_TOP_RIBS; k++) {
    const sk = s0 + (s1 - s0) * k / SG_TOP_RIBS
    // the contour's extent across the plan
    let lo = Infinity, hi = -Infinity
    for (let i = 0; i < n; i++) {
      const a = r[i], b = r[(i + 1) % n], sa = s(a), sb = s(b)
      if ((sa - sk) * (sb - sk) > 0 || sa === sb) continue
      const u = (sk - sa) / (sb - sa), pe0 = a[0] + (b[0] - a[0]) * u, pn0 = a[1] + (b[1] - a[1]) * u
      const w = pe0 * pe + pn0 * pn; lo = Math.min(lo, w); hi = Math.max(hi, w)
    }
    if (!(hi > lo)) continue
    const y = H - SG_ROOF * k / SG_TOP_RIBS + 0.15
    const P = (w: number, ds: number): V3 => [de * (sk + ds) + pe * w, dn * (sk + ds) + pn * w, y - ds * slope]
    quad([P(lo, -0.4), P(hi, -0.4), P(hi, 0.4), P(lo, 0.4)], nUp, rib, METAL)
  }

  // this tower's half of the joint base: the front strip pushed towards the partner
  const strip = r.filter((p) => s(p) > s1 - 12)
  if (strip.length >= 2) {
    let w0 = Infinity, w1 = -Infinity
    for (const p of strip) { const w = p[0] * pe + p[1] * pn; w0 = Math.min(w0, w); w1 = Math.max(w1, w) }
    const sa = s1 - 10, sb = s1 + SG_BASE_REACH
    const B = (w: number, ss: number, h: number): V3 => [de * ss + pe * w, dn * ss + pn * w, h]
    const bc = hex(SG_BASE)
    const box: [P2, P2][] = [[[w0, sa], [w1, sa]], [[w1, sa], [w1, sb]], [[w1, sb], [w0, sb]], [[w0, sb], [w0, sa]]]
    for (const [[wa, ssa], [wb, ssb]] of box) {
      const ex = (de * (ssb - ssa) + pe * (wb - wa)), en = (dn * (ssb - ssa) + pn * (wb - wa)), l = Math.hypot(ex, en) || 1
      quad([B(wa, ssa, 0), B(wb, ssb, 0), B(wb, ssb, SG_BASE_H), B(wa, ssa, SG_BASE_H)], [en / l, -ex / l, 0], shade(bc, 0.95), GLASS)
    }
    quad([B(w0, sa, SG_BASE_H), B(w1, sa, SG_BASE_H), B(w1, sb, SG_BASE_H), B(w0, sb, SG_BASE_H)], [0, 0, 1], shade(bc, 0.8), METAL)
  }
}
