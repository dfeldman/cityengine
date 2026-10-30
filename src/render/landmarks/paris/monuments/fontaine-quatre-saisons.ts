import type { MeshBuilder } from '../../../buildings.ts'
import { type Rgb } from '../../../models.ts'
import { beam, block, classicalColumn, hex, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { fitted } from '../palaces/common.ts'
import { archAlong, figure, FIXED, UV } from './common.ts'
import { blob, G, seated, set } from './plaza-common.ts'

/*
 * THE FONTAINE DES QUATRE-SAISONS (Edme Bouchardon, 1739–45), 57–59 rue de Grenelle: a palace front on a street, not a basin.
 * The curve is OSM's: way 64952163 is the wall itself, an arc of radius 22 m concave to the street, and its neighbours' corners
 * take it to about 29 m across. On the centre, a block standing out of the curve 3.6 m: a rusticated base with its four bronze
 * mascarons and over it the ledge with the group — seated Paris, the Seine and the Marne lying either side — and above them
 * two pairs of fluted Ionic columns, the black inscription to Louis XV between, the entablature and the pediment. In each wing,
 * a banded ground floor with a dark portal, a niche with a Season and a relief under it, the arms of Paris in a panel over the
 * portal, a dentil cornice, an attic. Elevation from Commons (4 saisons vue d'ensembleG.jpg and two details); Wikipedia fr has
 * "une dizaine de mètres" for the height and "près de vingt mètres" for the width, which OSM's outline does not bear out. The
 * wall is on the south side of the street, facing bearing 33 (osmium). No water shows: a trickle from the mascarons in life.
 */
const STONE: Rgb = hex('#c2b89f')
const PALE: Rgb = hex('#d4cbb4')
const BAND: Rgb = hex('#9f9681')
const DOOR: Rgb = hex('#2a3a3e')
const SLATE: Rgb = hex('#27292d')
const BRONZE: Rgb = hex('#3b3f39')
const FIGURE: Rgb = hex('#d8d3c5')

const HX = 14.6
const HZ = 4.6
/** The arc: radius 22 about a centre out in the street. */
const RAD = 22
const Z0 = 0.95
const zAt = (t: number): number => Z0 - (RAD - Math.sqrt(RAD * RAD - t * t))
const norm = (t: number): [number, number, number] => {
  const z = zAt(t)
  const cz = Z0 - RAD
  return [-t / RAD, 0, (cz - z) / RAD]
}
/** The point on the wall at t along it, d proud of it, at height y. */
const P = (t: number, y: number, d = 0): [number, number, number] => {
  const n = norm(t)
  return [t + n[0] * d, y, zAt(t) + n[2] * d]
}

/** A band of wall along the curve from t0 to t1, `d` proud, in n pieces. */
function strip(q: MeshBuilder, t0: number, t1: number, n: number, y0: number, y1: number, d: number, c: Rgb): void {
  for (let i = 0; i < n; i++) {
    const a = t0 + ((t1 - t0) * i) / n
    const b = t0 + ((t1 - t0) * (i + 1)) / n
    q.quad([P(a, y0, d), P(b, y0, d), P(b, y1, d), P(a, y1, d)], norm((a + b) / 2), UV, c, FIXED)
  }
}

/** A cornice along the curve: its face and its top. */
function ledge(q: MeshBuilder, t0: number, t1: number, n: number, y: number, h: number, d: number, c: Rgb): void {
  strip(q, t0, t1, n, y, y + h, d, c)
  for (let i = 0; i < n; i++) {
    const a = t0 + ((t1 - t0) * i) / n
    const b = t0 + ((t1 - t0) * (i + 1)) / n
    q.quad([P(a, y + h, d), P(b, y + h, d), P(b, y + h, -0.1), P(a, y + h, -0.1)], [0, 1, 0], UV, shade(c, 1.04), FIXED)
    q.quad([P(a, y, d), P(b, y, d), P(b, y, -0.1), P(a, y, -0.1)], [0, -1, 0], UV, shade(c, 0.7), FIXED)
  }
}

/** One wing's bays, from the centre out; `s` is which way along x. */
function wing(q: MeshBuilder, s: number): void {
  const T = (t: number): number => s * t
  const flat = (t: number): [number, number] => {
    const n = norm(T(t))
    return [-n[2], n[0]]   // the wall's direction at t, +x-ward
  }
  // the portal, with its arch and voussoirs, and the arms of Paris in the panel over it
  const tp = 9.1
  const [fx, fz] = flat(tp)
  const pp = P(T(tp), 0, 0.06)
  archAlong(q, pp[0], pp[2], fx, fz, norm(T(tp))[0], norm(T(tp))[2], G, 2.5, 4.3, DOOR)
  const pe = P(T(tp), 0, 0.09)
  for (let i = 0; i < 5; i++) {
    const a0 = (i / 5) * Math.PI
    const a1 = ((i + 1) / 5) * Math.PI
    const sy = G + 3.05
    const r = 1.42
    beam(q, [pe[0] + fx * Math.cos(a0) * r, sy + Math.sin(a0) * r, pe[2] + fz * Math.cos(a0) * r],
      [pe[0] + fx * Math.cos(a1) * r, sy + Math.sin(a1) * r, pe[2] + fz * Math.cos(a1) * r], 0.14, PALE)
  }
  strip(q, T(tp - 1.15), T(tp + 1.15), 2, 5.7, 8.3, 0.05, PALE)
  strip(q, T(tp - 0.92), T(tp + 0.92), 2, 5.92, 8.08, 0.1, STONE)
  const a = P(T(tp), 7.05, 0.2)
  blob(q, a[0], a[1], a[2], 0.55, 0.78, 0.18, BAND, 6, 4)
  // the two Seasons: a niche with a figure on its console, the relief panel under it
  for (const t of [5.0, 12.9]) {
    const [nx, nz] = [norm(T(t))[0], norm(T(t))[2]]
    const [dx, dz] = flat(t)
    const w = P(T(t), 0, 0.05)
    archAlong(q, w[0], w[2], dx, dz, nx, nz, 5.5, 1.75, 3.15, SLATE)
    const rr = 0.92
    const sy = 5.5 + 3.15 - 0.875
    const e = P(T(t), 0, 0.09)
    for (let i = 0; i < 4; i++) {
      const a0 = (i / 4) * Math.PI
      const a1 = ((i + 1) / 4) * Math.PI
      beam(q, [e[0] + dx * Math.cos(a0) * rr, sy + Math.sin(a0) * rr, e[2] + dz * Math.cos(a0) * rr],
        [e[0] + dx * Math.cos(a1) * rr, sy + Math.sin(a1) * rr, e[2] + dz * Math.cos(a1) * rr], 0.07, PALE)
    }
    const f = P(T(t), 0, 0.3)
    block(q, f[0] - 0.45, f[0] + 0.45, f[2] - 0.32, f[2] + 0.32, 5.25, 5.62, PALE)
    figure(q, f[0], 5.62, f[2], 2.1, FIGURE)
    // the relief of putti at work
    strip(q, T(t - 0.95), T(t + 0.95), 2, 3.95, 5.05, 0.05, PALE)
    strip(q, T(t - 0.82), T(t + 0.82), 2, 4.05, 4.95, 0.08, BAND)
  }
  // the end of the wing: a plain return, and the pilasters between the bays
  for (const t of [3.15, 7.2, 11.0, 14.5]) strip(q, T(t - 0.22), T(t + 0.22), 1, 3.85, 9.0, 0.08, PALE)
}

function draw(q: MeshBuilder): void {
  const n = 6
  for (const s of [-1, 1]) {
    const a = s * 3.0
    const b = s * 14.6
    // the wall, and a thick back to it so it stands by itself in the shots; the banded ground floor; the string course
    strip(q, a, b, n * 2, 0, 10.2, 0, STONE)
    strip(q, a, b, n * 2, 0, 3.6, 0.04, PALE)
    for (let y = 0.55; y < 3.5; y += 0.5) strip(q, a, b, n * 2, y, y + 0.08, 0.06, BAND)
    ledge(q, a, b, n, 3.6, 0.3, 0.16, PALE)
    // the cornice with its dentils in shadow under it; the attic
    ledge(q, a, b, n, 9.0, 0.32, 0.26, PALE)
    strip(q, a, b, n, 8.82, 9.0, 0.1, BAND)
    strip(q, a, b, n, 9.32, 10.2, -0.3, shade(STONE, 1.06))
    ledge(q, a, b, n, 10.2, 0.12, -0.2, PALE)
    wing(q, s)
    // the wing's end stands against its neighbour: a return face
    const e = P(b, 0)
    const m = norm(b)
    q.quad([[e[0], 0, e[2]], [e[0] + m[2] * s * 4, 0, e[2] - m[0] * s * 4], [e[0] + m[2] * s * 4, 10.32, e[2] - m[0] * s * 4], [e[0], 10.32, e[2]]], [s, 0, 0], UV, STONE, FIXED)
  }
  // a back wall over the top, for from behind it: dark, and only ever seen over the buildings behind
  block(q, -HX, HX, 3.5, HZ, 0, 10.2, shade(STONE, 0.8))

  // the centre block, standing out of the curve
  const w = 3.0
  const zf = -2.65
  const zb = 1.5
  block(q, -w, w, zf, zb, 0, 3.75, PALE)
  for (let y = 0.55; y < 3.6; y += 0.5) block(q, -w - 0.02, w + 0.02, zf - 0.02, zb, y, y + 0.08, BAND)
  // its mascarons, low on the base, each with its stain of water under it
  for (const x of [-2.1, -0.7, 0.7, 2.1]) {
    blob(q, x, G + 0.82, zf - 0.09, 0.2, 0.25, 0.12, BRONZE, 6, 3)
    q.quad([[x + 0.1, G, zf - 0.03], [x - 0.1, G, zf - 0.03], [x - 0.1, G + 0.7, zf - 0.03], [x + 0.1, G + 0.7, zf - 0.03]], [0, 0, -1], UV, shade(BAND, 0.8), FIXED)
  }
  // the tablet on the base, and the ledge over it, carried out
  block(q, -1.35, 1.35, zf - 0.07, zf, 1.9, 3.1, PALE)
  block(q, -3.3, 3.3, zf - 0.65, zb, 3.75, 4.2, PALE)
  block(q, -3.45, 3.45, zf - 0.75, zb, 4.2, 4.32, BAND)
  // Paris on her throne and the two rivers lying at her feet
  set(q, 0, 4.32, zf - 0.1, Math.PI, 2.5, (m) => seated(m, FIGURE))
  for (const s of [-1, 1]) {
    const y = 4.32
    beam(q, [s * 0.6, y + 0.35, zf - 0.4], [s * 2.7, y + 0.25, zf - 0.45], 0.32, FIGURE, 0.26)
    blob(q, s * 0.75, y + 0.9, zf - 0.4, 0.34, 0.45, 0.3, FIGURE, 6, 3)
    blob(q, s * 0.75, y + 1.45, zf - 0.38, 0.17, 0.2, 0.17, FIGURE, 6, 3)
    blob(q, s * 2.6, y + 0.25, zf - 0.4, 0.3, 0.3, 0.32, BAND, 6, 3)   // the river's urn
  }
  // the upper storey of the block: the wall, the inscription, the paired columns, the entablature and pediment
  const y0 = 4.32
  const yc = 8.45
  block(q, -w, w, zf + 0.75, zb, y0, yc + 1.5, STONE)
  q.quad([[1.0, y0 + 1.75, zf + 0.72], [-1.0, y0 + 1.75, zf + 0.72], [-1.0, yc - 0.15, zf + 0.72], [1.0, yc - 0.15, zf + 0.72]], [0, 0, -1], UV, SLATE, FIXED)
  block(q, -1.2, 1.2, zf + 0.66, zf + 0.75, yc + 0.0, yc + 0.18, PALE)
  for (const x of [-2.5, -1.55, 1.55, 2.5]) classicalColumn(q, x, zf + 0.42, y0, yc, 0.27, STONE, { order: 'ionic', tier: 'near', flutes: true, trim: PALE })
  block(q, -3.15, 3.15, zf, zb, yc, yc + 0.95, STONE)
  block(q, -3.3, 3.3, zf - 0.15, zb, yc + 0.95, yc + 1.2, PALE)
  block(q, -3.45, 3.45, zf - 0.26, zb, yc + 1.2, yc + 1.34, BAND)
  const yp = yc + 1.34
  q.quad([[3.45, yp, zf - 0.26], [-3.45, yp, zf - 0.26], [0, yp + 1.25, zf - 0.26], [0, yp + 1.25, zf - 0.26]], [0, 0, -1], UV, PALE, FIXED)
  q.quad([[-3.45, yp, zf - 0.26], [-3.45, yp, zb], [0, yp + 1.25, zb], [0, yp + 1.25, zf - 0.26]], [-0.34, 0.94, 0], UV, shade(STONE, 0.9), FIXED)
  q.quad([[3.45, yp, zf - 0.26], [3.45, yp, zb], [0, yp + 1.25, zb], [0, yp + 1.25, zf - 0.26]], [0.34, 0.94, 0], UV, shade(STONE, 0.9), FIXED)
  blob(q, 0, yp + 0.5, zf - 0.3, 0.42, 0.42, 0.08, BAND, 8, 3)     // the wreath in the tympanum
}

export function fontaineQuatreSaisons(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
