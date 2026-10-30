import { type MeshBuilder, capPolygonWithHoles } from '../../../buildings.ts'
import { prism, type Rgb } from '../../../models.ts'
import { beam, block, hex, lathe, shade } from '../../kit.ts'
import { edgeAt, signText } from '../../parts.ts'
import type { Fit } from '../../fit.ts'
import { fitted } from '../palaces/common.ts'
import { ccw, FIXED, ring, UV, walls, type P2 } from './common.ts'
import { G } from './plaza-common.ts'

/*
 * LA DÉFENSE, which the owner asked for by name, beside the Grande Arche of modern.ts: the CNIT's great vault, the Quatre Temps
 * on its podium with the glass ball of the Dôme Imax, one tower for the skyline, and the two sculptures every photograph of the
 * parvis has in it. (Not many skyscrapers, by the owner's word: the others are the bake's own.) Rings in the model's frame from
 * OSM (osmium, 2026-10-30), simplified, at the `front` of the entry.
 */

// ---------------------------------------------------------------------------------------------------------------
/**
 * THE CNIT (Camelot, de Mailly and Zehrfuss, the engineers Esquillan and Faessel, Prouvé's curtain walls; 1956–58): the thin
 * double concrete shell on three abutments, a triangle of 218 m a side (OSM relation 3071527: 215), 46.3 m at its crown
 * (Wikipedia fr; OSM rounds to 50). What a rider sees: three huge glazed arches, each rising steep from a corner, the shell's
 * white rim over them, the shell itself in its three lobes. The rim's curve is by eye from a 1991 Commons photograph (Details in
 * Paris in October 1991 12.jpg); the shell's surface is an interpolation, not a survey.
 * −z faces bearing 206 (the side toward the Quatre Temps).
 */
const CN_A: P2 = { x: -107.7, z: -93.0 }
const CN_B: P2 = { x: 107.7, z: -93.0 }
const CN_C: P2 = { x: -2.2, z: 93.9 }
const CN_H = 46.3
const CN_SHELL: Rgb = hex('#cbc6b8')
const CN_RIM: Rgb = hex('#e8e4d8')
const CN_GLASS: Rgb = hex('#6f8d9a')
const CN_BAR: Rgb = hex('#cfd8db')
const CN_INSIDE: Rgb = hex('#47535a')

/** The shell's height at barycentric (a, b, c): 0 at a corner, the crown at the centre, the edges' arches between. */
const shellY = (a: number, b: number, c: number): number => {
  const m = Math.max(a, b, c)
  const v = Math.min(1, Math.max(0, (m - 1 / 3) / (2 / 3)))
  return CN_H * Math.pow(1 - v * v, 0.75)
}

function cnit(q: MeshBuilder): void {
  const corners: P2[] = [CN_A, CN_B, CN_C]
  const at = (a: number, b: number, c: number): [number, number, number] => [
    a * CN_A.x + b * CN_B.x + c * CN_C.x, shellY(a, b, c), a * CN_A.z + b * CN_B.z + c * CN_C.z,
  ]
  // the shell, in facets from a triangular grid, each shaded by which lobe it belongs to
  const N = 20
  const tri = (p0: [number, number, number], p1: [number, number, number], p2: [number, number, number], c: Rgb): void => {
    const u = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]]
    const v = [p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2]]
    let n: [number, number, number] = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]
    if (n[1] < 0) n = [-n[0], -n[1], -n[2]]
    const l = Math.hypot(n[0], n[1], n[2]) || 1
    q.quad([p0, p1, p2, p2], [n[0] / l, n[1] / l, n[2] / l], UV, c, FIXED)
  }
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N - i; j++) {
      const k = N - i - j
      const a = i / N
      const b = j / N
      const c = k / N
      const d = 1 / N
      const lobe = a >= b && a >= c ? 1 : b >= c ? 0.985 : 0.97
      tri(at(a, b, c), at(a + d, b, c - d), at(a, b + d, c - d), shade(CN_SHELL, lobe))
      if (k > 1) tri(at(a + d, b, c - d), at(a, b + d, c - d), at(a + d, b + d, c - 2 * d), shade(CN_SHELL, lobe * 1.03))
    }
  }
  // the ribs of the double shell, from the crown to each abutment
  for (const w of [0, 1, 2]) {
    const n = 8
    let prev = at(1 / 3, 1 / 3, 1 / 3)
    for (let i = 1; i <= n; i++) {
      const t = i / n
      const m = 1 / 3 + (t * 2) / 3
      const o = (1 - m) / 2
      const l: [number, number, number] = [w === 0 ? m : o, w === 1 ? m : o, w === 2 ? m : o]
      const p = at(l[0], l[1], l[2])
      beam(q, [prev[0], prev[1] + 0.25, prev[2]], [p[0], p[1] + 0.25, p[2]], 0.5, shade(CN_SHELL, 0.86), 0.25)
      prev = p
    }
  }
  // the three facades: the glass under each arch, its grid, the rim above it
  for (let e = 0; e < 3; e++) {
    const a = corners[e]
    const b = corners[(e + 1) % 3]
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    const tx = (b.x - a.x) / L
    const tz = (b.z - a.z) / L
    // the outward normal: away from the third corner
    const third = corners[(e + 2) % 3]
    const s0 = (third.x - a.x) * tz - (third.z - a.z) * tx
    const nx = s0 > 0 ? -tz : tz
    const nz = s0 > 0 ? tx : -tx
    const K = 36
    const edgeY = (s: number): number => CN_H * Math.pow(1 - Math.min(1, ((Math.max(s, 1 - s) - 1 / 3) / (2 / 3)) ** 2), 0.75)
    const P = (s: number, y: number, d: number): [number, number, number] => [a.x + tx * L * s + nx * d, y, a.z + tz * L * s + nz * d]
    const norm: [number, number, number] = [nx, 0, nz]
    for (let i = 0; i < K; i++) {
      const s0k = i / K
      const s1k = (i + 1) / K
      const y0 = edgeY(s0k)
      const y1 = edgeY(s1k)
      // the glass, set back a metre under the rim; its lower storeys darker, the concourse behind them
      const yl = Math.min(y0, y1, 7.5)
      q.quad([P(s0k, yl, -1), P(s1k, yl, -1), P(s1k, Math.max(yl, y1 - 0.8), -1), P(s0k, Math.max(yl, y0 - 0.8), -1)], norm, UV, CN_GLASS, FIXED)
      q.quad([P(s0k, 0, -1), P(s1k, 0, -1), P(s1k, yl, -1), P(s0k, yl, -1)], norm, UV, CN_INSIDE, FIXED)
      // the mullion
      const my = Math.max(0.01, y0 - 0.8)
      const w = 0.2 / L
      q.quad([P(s0k - w, 0, -0.85), P(s0k + w, 0, -0.85), P(s0k + w, my, -0.85), P(s0k - w, my, -0.85)], norm, UV, CN_BAR, FIXED)
      // the rim: its face, and the band of white on the shell behind it
      q.quad([P(s0k, y0 - 1.5, 0), P(s1k, y1 - 1.5, 0), P(s1k, y1 + 0.5, 0), P(s0k, y0 + 0.5, 0)], norm, UV, CN_RIM, FIXED)
      const ya = y0 + 0.5
      const yb = y1 + 0.5
      q.quad([P(s0k, ya, 0), P(s1k, yb, 0), P(s1k, yb, -4), P(s0k, ya, -4)], [nx * 0.25, 0.97, nz * 0.25], UV, CN_RIM, FIXED)
    }
    // the transoms: at each level, between where the arch comes down to them
    for (let y = 5; y < CN_H - 2; y += 4.5) {
      let lo = 0
      let hi = 0.5
      for (let it = 0; it < 18; it++) {
        const m = (lo + hi) / 2
        if (edgeY(m) - 1 < y) lo = m
        else hi = m
      }
      const s0t = hi
      const s1t = 1 - hi
      q.quad([P(s0t, y, -0.8), P(s1t, y, -0.8), P(s1t, y + 0.2, -0.8), P(s0t, y + 0.2, -0.8)], norm, UV, CN_BAR, FIXED)
    }
  }
  // the three abutments, where everything comes down
  for (const c of corners) {
    const dx = -c.x / Math.hypot(c.x, c.z)
    const dz = -c.z / Math.hypot(c.x, c.z)
    block(q, c.x + dx * 4 - 5, c.x + dx * 4 + 5, c.z + dz * 4 - 5, c.z + dz * 4 + 5, 0, 3.4, hex('#a29d90'))
  }
}

export function cnitVault(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, 107.7, 93.9, cnit)
}

// ---------------------------------------------------------------------------------------------------------------
/**
 * TOUR FIRST (the 1974 Tour UAP of Pierre Dufau, on its plan of three wings 120° apart; rebuilt by Kohn Pedersen Fox with SRA,
 * 2007–11): 225 m to its roof, 231 to its spike (Wikipedia fr). A simple model, for the skyline: OSM way 82466977's outline in
 * its pale blue glass (OSM's own colour #A2E1FA), a fine grain of mullions, a band every twelfth floor, and the crown stepped back in
 * two tiers (as a Commons skyline photograph shows it) under its spike. The building:parts=vertical parts are not followed.
 */
const FIRST = ring([-36.1, -3.4, -30.6, -9.1, -21.3, -14.8, -21.8, -16.1, -10.7, -28.3, -1.1, -33.6, 2.4, -34.7, 2.4, -33.6, 28.7, -34.4, 28.6, -26.7, 28.4, 10.0, 27.1, 12.2, 37.6, 19.1, 28.4, 34.6, 19.7, 30.2, -27.5, 30.8, -37.4, 8.2])
const FIRST_GLASS: Rgb = hex('#7fb4cc')
const FIRST_BAR: Rgb = hex('#c9e2ec')
const FIRST_BAND: Rgb = hex('#a2c8d8')

export function tourFirst(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, 37.6, 34.7, (q) => {
    const r = ccw(FIRST)
    const roof = 225
    const shrink = (k: number): P2[] => r.map((p) => ({ x: p.x * k, z: p.z * k }))
    // the lobby, set back, and the tower over it
    walls(q, shrink(0.94), 0, 7, hex('#3b4c56'))
    walls(q, r, 7, 203, FIRST_GLASS)
    block(q, -6, 6, -6, 6, 0, 7, hex('#3b4c56'))
    capPolygonWithHoles(q, [r], 7, hex('#5e7a88'), FIXED)
    for (let i = 0; i < r.length; i++) {
      const e = edgeAt(r, i)
      if (e.L < 0.8) continue
      const P = (u: number, y: number, d: number): [number, number, number] => [e.a.x + e.tx * u + e.nx * d, y, e.a.z + e.tz * u + e.nz * d]
      const n: [number, number, number] = [e.nx, 0, e.nz]
      const m = Math.max(1, Math.round(e.L / 2.7))
      for (let k = 0; k <= m; k++) {
        const u = (e.L * k) / m
        q.quad([P(Math.max(0, u - 0.09), 7, 0.08), P(Math.min(e.L, u + 0.09), 7, 0.08), P(Math.min(e.L, u + 0.09), 203, 0.08), P(Math.max(0, u - 0.09), 203, 0.08)], n, UV, FIRST_BAR, FIXED)
      }
      for (let y = 7; y < 203; y += 49) q.quad([P(0, y, 0.1), P(e.L, y, 0.1), P(e.L, y + 1.2, 0.1), P(0, y + 1.2, 0.1)], n, UV, FIRST_BAND, FIXED)
    }
    // the crown: two glass tiers stepped in, each with its parapet, and the plant between
    walls(q, shrink(0.84), 203, 214, FIRST_GLASS, hex('#e1e8eb'))
    walls(q, shrink(0.62), 214, roof, FIRST_BAND, hex('#e1e8eb'))
    for (const [k, y] of [[0.97, 203], [0.82, 214]] as const) walls(q, shrink(k), y, y + 1.1, FIRST_BAR)
    prism(q, 0, 0, roof, 231, 0.55, 8, hex('#d7dde0'), FIXED, 0.12)
  })
}

// ---------------------------------------------------------------------------------------------------------------
/**
 * LES QUATRE TEMPS, the shopping centre under the parvis at the Grande Arche end: OSM way 396802664's 58,000 m². Most of it is
 * below the slab; what a rider sees is its grey podium and, on the parvis, the long flight of steps up to the glass porch of LE
 * DÔME, as in a Commons photograph (Le Dôme - 4 Temps, La Défense 6 April 2013.jpg). The roof's level is taken from the
 * parvis at the foot of the steps, 13 m over it by eye, or a metre over the ground where that is higher: the terrain here is a
 * coarse 25 m grid that has the slab in it. +z, north-north-east, is the side of the steps (and the sphere, to their west).
 */
const QT = ring([-262.8, 27.5, -192.0, -73.5, -156.7, -57.5, -133.7, -57.3, -133.8, -76.1, -114.7, -76.2, -114.6, -92.5, -102.3, -92.5, -103.3, -77.6, -43.9, -75.6, -35.2, -85.7, 3.5, -102.3, 19.4, -93.6, 69.9, -11.7, 189.7, -11.0, 189.2, 16.3, 252.3, 16.2, 252.3, -8.9, 263.3, -6.7, 260.1, 84.5, 152.9, 82.1, 150.6, 102.3, 131.2, 102.0, 133.7, 81.3, 83.6, 81.0, 83.5, 96.5, -38.9, 95.9, -38.8, 80.4, -70.6, 80.2, -68.8, 45.9, -100.7, 45.8, -106.1, 36.5, -253.8, 37.2])
const QT_WALL: Rgb = hex('#8e918f')
const QT_ROOF: Rgb = hex('#878986')
const QT_GLASS: Rgb = hex('#37474f')
const QT_STEP: Rgb = hex('#a39e92')
/** Where OSM's wide flights come down to the parvis, in this frame: lat 48.89142, lon 2.2365 (osmium). */
const QT_STEPS_X = -110

export function quatreTemps(out: MeshBuilder, fit: Fit): void {
  const sx = fit.hx > 0 ? fit.hx / 263.3 : 1
  const sz = fit.hz > 0 ? fit.hz / 102.3 : 1
  const at = (x: number, z: number): number => (fit.groundAt ? fit.groundAt(x * sx, z * sz) : 0)
  // the foot of the steps, on the parvis north of them; the roof clears the ground the coarse grid gives anywhere under it
  const foot = at(QT_STEPS_X, 80)
  let top = foot + 13
  for (const p of QT) top = Math.max(top, at(p.x, p.z) + 1)
  for (const [x, z] of [[-200, 10], [-100, 0], [0, 0], [100, 30], [200, 40]]) top = Math.max(top, at(x, z) + 1)
  fitted(out, fit, 263.3, 102.3, (q) => {
    const r = ccw(QT)
    walls(q, r, 0, top, QT_WALL)
    capPolygonWithHoles(q, [r], top, QT_ROOF, FIXED)
    // a dark line under the coping, round every long run of the podium
    for (let i = 0; i < r.length; i++) {
      const e = edgeAt(r, i)
      if (e.L < 8) continue
      const P = (u: number, y: number): [number, number, number] => [e.a.x + e.tx * u + e.nx * 0.08, y, e.a.z + e.tz * u + e.nz * 0.08]
      q.quad([P(0, top - 1.1), P(e.L, top - 1.1), P(e.L, top - 0.5), P(0, top - 0.5)], [e.nx, 0, e.nz], UV, shade(QT_WALL, 0.72), FIXED)
    }
    // the rooflights in rows, along the malls
    for (const [x0, x1, z] of [[-230, -110, 2], [-100, 60, 28], [70, 240, 42]] as const) {
      for (let x = x0; x < x1; x += 22) block(q, x, x + 16, z - 3, z + 3, top, top + 1.4, hex('#7e969f'))
    }
    // the steps down to the parvis on +z (OSM's two flights 12 m wide, side by side, bearing 26), the planted slopes either side
    const X = QT_STEPS_X
    const w = 13
    const z1 = 78
    const z0 = 42
    const rise = 11.5
    const steps = 24
    for (let k = 0; k < steps; k++) {
      const z = z1 - (k * (z1 - z0)) / steps
      block(q, X - w, X + w, z0 - 6, z, 0, foot + ((k + 1) * rise) / steps, k % 2 ? QT_STEP : shade(QT_STEP, 1.06))
    }
    for (const s of [-1, 1]) {
      const x0 = X + s * (w + 4)
      block(q, x0 - 4, x0 + 4, z0 - 6, z1 - 3, 0, foot + 4.2, hex('#4a5d3b'))
      block(q, x0 - 4, x0 + 4, z0 - 6, z0 + 14, foot + 4.2, foot + 9, hex('#4a5d3b'))
    }
    // the porch, LE DÔME: a dark glass box under a thin canopy with the name on it
    const py = foot + rise
    block(q, X - 14, X + 14, z0 - 14, z0 - 3, py, py + 6.5, QT_GLASS)
    block(q, X - 16, X + 16, z0 - 16, z0 - 0.5, py + 6.5, py + 7.2, hex('#3c4043'))
    // the shops at the parvis's level either side of the steps
    for (const s of [-1, 1]) block(q, X + s * 37 - 14, X + s * 37 + 14, 45.6, 46.3, foot, foot + 4.2, QT_GLASS)
  })
  // (the name goes on after the fit is known: it stands in the model's own frame, facing +z)
  signText(out, 'LE DÔME', QT_STEPS_X * sx, foot + 11.5 + 6.85, (42 - 0.45) * sz, 0.8, [0.97, 0.97, 0.97], { heading: 0 })
}

// ---------------------------------------------------------------------------------------------------------------
/**
 * LE DÔME IMAX (1992), the 38 m glass ball beside the Grande Arche: OSM's part way 186981683 (height 27). The pale green grid of
 * its panes as in the photograph of Le Dôme above; it sits behind and over the Quatre Temps's roof.
 */
export function domeImax(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, 19, 19, (q) => {
    const glass = hex('#73aaa6')
    const bar = hex('#b9d5d0')
    const R = 19
    const yc = 27 - R
    const prof: [number, number][] = []
    for (let k = -3; k <= 9; k++) {
      const p = (k / 9) * (Math.PI / 2)
      prof.push([Math.max(0.05, Math.cos(p) * R), yc + Math.sin(p) * R])
    }
    lathe(q, 0, 0, prof, 36, glass)
    // the meridians and parallels of its grid, proud of the glass
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2
      for (let k = -3; k < 8; k++) {
        const p0 = (k / 9) * (Math.PI / 2)
        const p1 = ((k + 1) / 9) * (Math.PI / 2)
        const P = (p: number): [number, number, number] => [Math.sin(a) * Math.cos(p) * (R + 0.06), yc + Math.sin(p) * (R + 0.06), Math.cos(a) * Math.cos(p) * (R + 0.06)]
        beam(q, P(p0), P(p1), 0.09, bar)
      }
    }
    for (let k = -2; k < 9; k += 2) {
      const p = (k / 9) * (Math.PI / 2)
      const r = Math.cos(p) * (R + 0.08)
      const y = yc + Math.sin(p) * (R + 0.08)
      lathe(q, 0, 0, [[r, y - 0.09], [r, y + 0.09]], 36, bar)
    }
  })
}

// ---------------------------------------------------------------------------------------------------------------
/**
 * L'ARAIGNÉE ROUGE (Alexander Calder, 1976; OSM alt_name "Le Grand Stabile Rouge", way 186981704, height 15): sheet steel in
 * vermilion. Its silhouette traced from a Commons photograph (Araignée rouge, La Défense.jpg), at 28.3 px to the metre: the two big
 * arches to one side and the mass of fins to the other. That is one view: the cross plates that give it its depth are from
 * memory of its form and OSM's irregular 25 × 17 m outline, not traced. −z is the photograph's side.
 */
const CAL_RED: Rgb = hex('#c42a1d')
const px = (x: number, y: number): [number, number] => [(x - 440) / 28.3, (515 - y) / 28.3]

/** Catmull-Rom through the traced points: the steel's curves are curves. */
const smooth = (p: [number, number][], n = 4): [number, number][] => {
  const out: [number, number][] = []
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[Math.max(0, i - 1)]
    const b = p[i]
    const c = p[i + 1]
    const d = p[Math.min(p.length - 1, i + 2)]
    for (let k = 0; k < n; k++) {
      const t = k / n
      const f = (u: number, v: number, w: number, x: number): number => 0.5 * (2 * v + (w - u) * t + (2 * u - 5 * v + 4 * w - x) * t * t + (3 * v - u - 3 * w + x) * t * t * t)
      out.push([f(a[0], b[0], c[0], d[0]), f(a[1], b[1], c[1], d[1])])
    }
  }
  out.push(p[p.length - 1])
  return out
}

/** A flat plate as a fan round `c`, in the plane z = z0, both faces. */
function plate(q: MeshBuilder, pts: [number, number][], c: [number, number], z0: number): void {
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]
    const b = pts[(i + 1) % pts.length]
    for (const s of [-1, 1]) {
      q.quad([[a[0], a[1], z0 + s * 0.06], [b[0], b[1], z0 + s * 0.06], [c[0], c[1], z0 + s * 0.06], [c[0], c[1], z0 + s * 0.06]], [0, 0, s], UV, CAL_RED, FIXED)
    }
  }
}

/** A strip between two polylines of the same length, in z = z0. */
function arch(q: MeshBuilder, outer: [number, number][], inner: [number, number][], z0: number): void {
  for (let i = 0; i < outer.length - 1; i++) {
    for (const s of [-1, 1]) {
      q.quad([[outer[i][0], outer[i][1], z0 + s * 0.06], [outer[i + 1][0], outer[i + 1][1], z0 + s * 0.06], [inner[i + 1][0], inner[i + 1][1], z0 + s * 0.06], [inner[i][0], inner[i][1], z0 + s * 0.06]], [0, 0, s], UV, CAL_RED, FIXED)
    }
  }
}

export function araigneeRouge(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, 12.5, 8.5, (q) => {
    const mass = ([[100, 265], [135, 310], [240, 250], [258, 205], [263, 240], [330, 210], [395, 130], [445, 160], [445, 300], [385, 420], [345, 513], [315, 513], [250, 440], [165, 420]] as [number, number][]).map(([x, y]) => px(x, y))
    plate(q, mass, px(310, 330), 0)
    plate(q, ([[65, 513], [125, 513], [165, 420], [100, 265]] as [number, number][]).map(([x, y]) => px(x, y)), px(115, 420), 0)
    plate(q, ([[215, 515], [255, 515], [262, 440], [225, 440]] as [number, number][]).map(([x, y]) => px(x, y)), px(240, 480), 0)
    const a1o = ([[430, 520], [432, 300], [440, 200], [510, 90], [570, 130], [610, 230], [640, 420], [668, 517]] as [number, number][]).map(([x, y]) => px(x, y))
    const a1i = ([[462, 520], [465, 300], [470, 210], [510, 160], [545, 190], [585, 290], [615, 440], [640, 515]] as [number, number][]).map(([x, y]) => px(x, y))
    arch(q, smooth(a1o), smooth(a1i), 0)
    const a2o = ([[590, 190], [690, 140], [760, 180], [805, 300], [815, 528]] as [number, number][]).map(([x, y]) => px(x, y))
    const a2i = ([[600, 240], [690, 198], [745, 240], [775, 320], [785, 528]] as [number, number][]).map(([x, y]) => px(x, y))
    arch(q, smooth(a2o), smooth(a2i), 0)
    // the cross plates, square to the silhouette, that stand it up: a fin down each leg, and two across the mass
    const cross = (x: number, y0: number, y1: number, z0: number, z1: number): void => {
      for (const sd of [-1, 1]) {
        q.quad([[x + sd * 0.06, y0, z0], [x + sd * 0.06, y0, z1], [x + sd * 0.06, y1, z1 * 0.12], [x + sd * 0.06, y1, z0 * 0.12]], [sd, 0, 0], UV, CAL_RED, FIXED)
      }
    }
    cross(px(445, 0)[0], 0, 8.5, -2.6, 2.6)
    cross(px(655, 0)[0], 0, 7, -3, 2.4)
    cross(px(800, 0)[0], 0, 7.5, -2.4, 4)
    cross(px(85, 0)[0], 0, 6.5, -4, 2)
    cross(px(330, 0)[0], 2.5, 10.5, -3.4, 3.4)
  })
}

// ---------------------------------------------------------------------------------------------------------------
/**
 * LE POUCE (César, a 12 m bronze thumb; OSM way 186981693, height 12, 4.4 × 4.5 m): the nail on −z, the pad toward +z, the
 * wrinkled joint a little under halfway. Its form from what it is, a thumb: the proportion and the lean are not traced from
 * anything (the reference fetched for it was not of the sculpture). On a low stone plinth at the height of the place.
 */
export function lePouce(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, 2.25, 2.25, (q) => {
    const bronze = hex('#8a6a45')
    const dark = hex('#6b5135')
    const nail = hex('#a58a62')
    block(q, -2.25, 2.25, -2.25, 2.25, 0, G + 0.2, hex('#7f7a70'))
    // the thumb, rings of ellipses leaning back a little over its height: y, half-width, half-depth, lean; the top rounded right over
    const rows: [number, number, number, number][] = [
      [0.2, 1.75, 1.45, 0], [1.4, 1.8, 1.55, 0.05], [3.0, 1.72, 1.55, 0.1], [4.6, 1.78, 1.5, 0.12], [5.5, 1.82, 1.48, 0.12], [6.4, 1.7, 1.45, 0.14],
      [8.0, 1.62, 1.42, 0.25], [9.4, 1.58, 1.38, 0.34], [10.5, 1.46, 1.28, 0.42], [11.2, 1.22, 1.08, 0.48], [11.7, 0.84, 0.76, 0.52], [12.0, 0.36, 0.34, 0.54], [12.05, 0.03, 0.03, 0.55],
    ]
    const sides = 16
    const P = (t: number, y: number, a: number, b: number, l: number, k = 1): [number, number, number] => [Math.sin(t) * a * k, G + y, Math.cos(t) * b * k + l]
    for (let k = 0; k < rows.length - 1; k++) {
      const [y0, a0, b0, l0] = rows[k]
      const [y1, a1, b1, l1] = rows[k + 1]
      const c = k === 3 || k === 4 ? dark : bronze
      for (let i = 0; i < sides; i++) {
        const t0 = (i / sides) * Math.PI * 2
        const t1 = ((i + 1) / sides) * Math.PI * 2
        const tm = (t0 + t1) / 2
        const ny = (a0 - a1) / Math.max(0.3, y1 - y0)
        const n: [number, number, number] = [Math.sin(tm), ny, Math.cos(tm)]
        q.quad([P(t0, y0, a0, b0, l0), P(t1, y0, a0, b0, l0), P(t1, y1, a1, b1, l1), P(t0, y1, a1, b1, l1)], n, UV, c, FIXED)
        // the nail: the same surface a little proud, on the back of the thumb (−z), from the top joint to the tip
        const off = Math.abs(tm - Math.PI)
        if (k >= 6 && k <= 9 && off < 0.95) q.quad([P(t0, y0, a0, b0, l0, 1.015), P(t1, y0, a0, b0, l0, 1.015), P(t1, y1, a1, b1, l1, 1.015), P(t0, y1, a1, b1, l1, 1.015)], n, UV, nail, FIXED)
      }
    }
    // the creases of the joint, across and round
    for (const y of [4.75, 5.15, 5.55]) lathe(q, 0, 0.12, [[1.85, G + y], [1.87, G + y + 0.1]], 16, shade(dark, 0.8))
  })
}
