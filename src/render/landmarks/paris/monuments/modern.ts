import type { MeshBuilder } from '../../../buildings.ts'
import { box, prism, type Rgb } from '../../../models.ts'
import { beam, block, shade } from '../../kit.ts'
import { edgeAt } from '../../parts.ts'
import type { Fit } from '../../fit.ts'
import { fitted } from '../palaces/common.ts'
import { ccw, FIXED, ring, UV, walls } from './common.ts'

/*
 * The two modern things on Paris's skyline that every view has in it: the Grande Arche closing the axis at La Défense,
 * and the Tour Montparnasse. Both drawn in their own design metres from OSM's footprint (osmium, 2026-10-29) and fitted.
 */

// ---------------------------------------------------------------------------------------------------------------
/**
 * LA GRANDE ARCHE DE LA DÉFENSE (Johan Otto von Spreckelsen and Paul Andreu, 1985–89): a hollow cube 110 m high, 107 m
 * wide and 112 m deep, turned 6.33° off the historical axis it closes, its two legs and its roof thirty-five storeys of
 * offices. What everyone knows of it:
 *
 * - the FRAME: the outer faces in white Carrara marble on a square grid of grey windows, the faces inside the opening
 *   in glass, the roof's soffit stepping down toward the middle (OSM's parts: 108 m at the faces to 100 m inside);
 * - the great STEPS up from the parvis to the platform under it, 8.3 m in thirteen 63 cm treads (OSM's parts
 *   225694296…225694337), on both faces;
 * - the CLOUD (le Nuage, Peter Rice), the white tensile canopy hung in the opening over the platform;
 * - the glass panoramic LIFTS climbing their mast from the cloud to the roof.
 *
 * OSM way 19441489 in this frame: the legs at x ±34.7…±53.4, the opening through along z, −z toward Paris (bearing 122.1).
 */
const AX = 53.4
const AZ = 56.1
export function grandeArche(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, AX, AZ, (q) => arche(q))
}

function arche(out: MeshBuilder): void {
  const marble: Rgb = [0.93, 0.93, 0.92]
  const grey: Rgb = [0.4, 0.45, 0.5]
  const glass: Rgb = [0.36, 0.43, 0.5]
  const mullion: Rgb = [0.78, 0.8, 0.82]
  const xi = 34.7
  const top = 110
  // the steps on both faces, and the platform between the legs
  for (let k = 0; k < 13; k++) {
    const t = k / 12
    const hz = AZ - t * (AZ - 36.5)
    block(out, -xi, xi, -hz, hz, 0, 0.63 * (k + 1), k % 2 ? [0.82, 0.8, 0.77] : [0.86, 0.84, 0.8])
  }
  // the legs, from the ground to the roof's soffit, and the roof slab with its soffit stepping in (OSM: 100 → 108)
  for (const s of [-1, 1]) block(out, s > 0 ? xi : -AX, s > 0 ? AX : -xi, -AZ, AZ, 0, 100, marble)
  block(out, -AX, AX, -36.6, 36.6, 100, top, marble)
  for (let k = 0; k < 9; k++) {
    const z0 = 36.6 + k * 2.17
    const z1 = z0 + 2.17
    for (const s of [-1, 1]) block(out, -AX, AX, s > 0 ? z0 : -z1, s > 0 ? z1 : -z0, 100 + k, top, marble)
  }
  // the outer faces: white marble on a square grid of grey windows — drawn as the grey, with the marble's grid over it
  const grid = (f: 'x' | 'z', plane: number, s: number, t0: number, t1: number, y0: number, y1: number, pane: Rgb, bar: Rgb, pitch: number, w: number): void => {
    const d = s * 0.06
    const Q = (a: number, b: number, ya: number, yb: number, dd: number, c: Rgb): void => {
      const P = (t: number, y: number): [number, number, number] => (f === 'z' ? [t, y, plane + dd] : [plane + dd, y, t])
      out.quad([P(a, ya), P(b, ya), P(b, yb), P(a, yb)], f === 'z' ? [0, 0, s] : [s, 0, 0], UV, c, FIXED)
    }
    Q(t0, t1, y0, y1, d, pane)
    for (let t = t0; t <= t1 + 0.01; t += pitch) Q(Math.max(t0, t - w / 2), Math.min(t1, t + w / 2), y0, y1, d * 2, bar)
    for (let y = y0; y <= y1 + 0.01; y += pitch) Q(t0, t1, Math.max(y0, y - w / 2), Math.min(y1, y + w / 2), d * 2, bar)
  }
  for (const s of [-1, 1]) {
    // each leg's outer side, the whole 112 m by 110
    grid('x', s * AX, s, -AZ + 1, AZ - 1, 8.3, top - 1, grey, marble, 3.05, 2.1)
    for (const f of [-1, 1]) {
      // the frame's face toward Paris and away: the legs' ends and the roof's edge
      grid('z', f * AZ, f, s > 0 ? xi + 0.8 : -AX + 1, s > 0 ? AX - 1 : -xi - 0.8, 8.3, top - 1, grey, marble, 3.05, 2.1)
    }
  }
  for (const f of [-1, 1]) grid('z', f * AZ, f, -xi, xi, 101.5, top - 1, grey, marble, 3.05, 2.1)
  // inside the opening: the legs' inner faces and the soffit, in glass with fine mullions
  for (const s of [-1, 1]) grid('x', s * xi, -s, -AZ + 0.5, AZ - 0.5, 8.3, 99.5, glass, mullion, 1.8, 0.18)
  {
    const y = 99.98
    out.quad([[-xi, y, -36.6], [xi, y, -36.6], [xi, y, 36.6], [-xi, y, 36.6]], [0, -1, 0], UV, glass, FIXED)
  }
  // the parapet round the roof
  for (const [x0, x1, z0, z1] of [[-AX, AX, -AZ, -AZ + 0.6], [-AX, AX, AZ - 0.6, AZ], [-AX, -AX + 0.6, -AZ, AZ], [AX - 0.6, AX, -AZ, AZ]]) block(out, x0, x1, z0, z1, top, top + 1.2, marble)
  block(out, -20, 20, -14, 14, top, top + 3.5, shade(marble, 0.92))                       // the rooftop pavilion

  // the cloud: a white membrane in ridges and valleys, hung on cables from the legs, over the platform
  const cw = 31
  const cz0 = -24
  const cz1 = 22
  const ridges = 6
  const yc = 26
  const sail: Rgb = [0.97, 0.97, 0.96]
  for (let i = 0; i < ridges; i++) {
    const za = cz0 + ((cz1 - cz0) * i) / ridges
    const zb = cz0 + ((cz1 - cz0) * (i + 0.5)) / ridges
    const zc = cz0 + ((cz1 - cz0) * (i + 1)) / ridges
    for (let j = 0; j < 4; j++) {
      const xa = -cw + (2 * cw * j) / 4
      const xb = -cw + (2 * cw * (j + 1)) / 4
      const lift = (j % 2) * 1.2
      out.quad([[xa, yc + lift, za], [xb, yc + 1.2 - lift, za], [xb, yc + 2.6 - lift, zb], [xa, yc + 1.4 + lift, zb]], [0, 0.8, -0.5], UV, sail, FIXED)
      out.quad([[xa, yc + 1.4 + lift, zb], [xb, yc + 2.6 - lift, zb], [xb, yc + 1.2 - lift, zc], [xa, yc + lift, zc]], [0, 0.8, 0.5], UV, sail, FIXED)
    }
  }
  for (const s of [-1, 1]) for (const z of [cz0, (cz0 + cz1) / 2, cz1]) {
    beam(out, [s * cw, yc + 1, z], [s * xi, yc + 9, z], 0.06, [0.3, 0.3, 0.32])
    beam(out, [s * cw, yc + 1, z], [s * (cw - 4), 8.3, z], 0.05, [0.3, 0.3, 0.32])
  }
  // the panoramic lifts: a steel mast from the cloud to the roof, two glass cabins on it
  const steel: Rgb = [0.55, 0.57, 0.6]
  for (const x of [-3.2, 3.2]) {
    prism(out, x, 6, yc + 2, 100, 0.25, 6, steel, FIXED)
    prism(out, x, 8.4, yc + 2, 100, 0.25, 6, steel, FIXED)
  }
  for (let y = yc + 6; y < 99; y += 7) beam(out, [-3.2, y, 6], [3.2, y + 3.5, 8.4], 0.08, steel)
  for (const [x, y] of [[-3.2, 48], [3.2, 71]]) box(out, x, y, 9.4, 1.3, 1.5, 1.0, [0.62, 0.72, 0.78], FIXED)
}

// ---------------------------------------------------------------------------------------------------------------
/**
 * The plan of the TOUR MONTPARNASSE, OSM way 16406633 in this frame (osmium, 2026-10-29), simplified to 20 cm: the two
 * long faces bowed out (x ±19.6), the narrow ends with their recessed middle bays (z ±26.3…±31).
 */
const TOWER = ring([
  -12.4, -31.0, -2.3, -27.4, -1.6, -26.4, 0.1, -26.3, 1.8, -26.3, 2.5, -27.2, 13.0, -30.8, 15.6, -22.8, 16.8, -23.0,
  19.1, -10.9, 19.6, 0.8, 19.2, 6.3, 16.2, 23.3, 15.0, 23.0, 12.5, 30.9, 1.8, 27.5, 1.4, 26.6, -2.1, 26.6, -2.3, 27.5,
  -13.1, 31.0, -15.6, 22.8, -16.8, 23.1, -17.9, 18.3, -19.0, 11.1, -19.6, 0.1, -19.3, -6.7, -18.5, -14.4, -16.4, -23.3,
  -15.1, -23.0,
])

/**
 * The TOUR MONTPARNASSE (Beaudouin, Cassan, de Marien and Saubot, 1969–73): 210 m and 59 storeys of dark bronze glass,
 * the only skyscraper in Paris proper, on its curved-sided plan. What it is from anywhere in the city: the dark slab,
 * bowed faces catching the light, a fine vertical grain of mullions, the top floors' lighter band and the roof terrace
 * with its masts. At its foot: the recessed lobby on its pilotis, set back under the first floors.
 */
const MX = 19.6
const MZ = 31.0
export function montparnasseFull(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, MX, MZ, (q) => tower(q))
}

function tower(out: MeshBuilder): void {
  const glass: Rgb = [0.1, 0.1, 0.11]
  const mull: Rgb = [0.24, 0.22, 0.2]
  const band: Rgb = [0.36, 0.36, 0.36]
  const top = 210
  const r = ccw(TOWER)
  // the lobby, set back under the first floors, its pilotis
  const inner = r.map((p) => ({ x: p.x * 0.88, z: p.z * 0.9 }))
  walls(out, inner, 0, 7, [0.32, 0.36, 0.38])
  for (let i = 0; i < r.length; i += 2) prism(out, r[i].x * 0.97, r[i].z * 0.97, 0, 7, 0.45, 8, mull, FIXED)
  // the shaft: dark glass, the mullions every 1.6 m up every face, a darker floor line every eleventh storey
  walls(out, r, 7, top, glass, shade(glass, 0.8))
  block(out, -12, 12, -20, 20, 6.6, 7.2, mull)
  for (let i = 0; i < r.length; i++) {
    const e = edgeAt(r, i)
    if (e.L < 0.8) continue
    const n = Math.max(1, Math.round(e.L / 1.6))
    for (let k = 0; k <= n; k++) {
      const u = (e.L * k) / n
      const x = e.a.x + e.tx * u + e.nx * 0.08
      const z = e.a.z + e.tz * u + e.nz * 0.08
      out.quad([[x - e.tx * 0.12, 7, z - e.tz * 0.12], [x + e.tx * 0.12, 7, z + e.tz * 0.12], [x + e.tx * 0.12, top - 9, z + e.tz * 0.12], [x - e.tx * 0.12, top - 9, z - e.tz * 0.12]],
        [e.nx, 0, e.nz], UV, mull, FIXED)
    }
    for (const y of [7.2, 46, 85, 124, 163, top - 9]) {
      const P = (u: number, yy: number): [number, number, number] => [e.a.x + e.tx * u + e.nx * 0.1, yy, e.a.z + e.tz * u + e.nz * 0.1]
      out.quad([P(0, y), P(e.L, y), P(e.L, y + 0.6), P(0, y + 0.6)], [e.nx, 0, e.nz], UV, band, FIXED)
    }
    // the top floors' band of louvres, lighter, and the terrace's glass parapet
    const P = (u: number, yy: number, d: number): [number, number, number] => [e.a.x + e.tx * u + e.nx * d, yy, e.a.z + e.tz * u + e.nz * d]
    out.quad([P(0, top - 8.4, 0.12), P(e.L, top - 8.4, 0.12), P(e.L, top, 0.12), P(0, top, 0.12)], [e.nx, 0, e.nz], UV, band, FIXED)
    out.quad([P(0, top, 0), P(e.L, top, 0), P(e.L, top + 2.2, 0), P(0, top + 2.2, 0)], [e.nx, 0, e.nz], UV, [0.55, 0.62, 0.66], FIXED)
  }
  // on the roof: the plant rooms, the masts
  block(out, -9, 9, -14, 14, top, top + 4.5, band)
  prism(out, 0, 0, top + 4.5, top + 14, 0.45, 6, [0.85, 0.85, 0.85], FIXED, 0.15)
  for (const z of [-9, 9]) prism(out, 4, z, top + 4.5, top + 13, 0.25, 6, [0.8, 0.3, 0.25], FIXED, 0.1)
}
