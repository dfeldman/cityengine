/**
 * The Ferry Building (A. Page Brown, 1898; SF_PLAN.md §4) at the foot of Market Street, from photographs (Wikimedia
 * Commons: "San Francisco Ferry Building 1"): the long grey-white terminal and its clock tower, modelled on the
 * Giralda of Seville, 75 m to the flag.
 *
 * - the **terminal**: two storeys, some 200 m along the Embarcadero, an arcade of round arches at the street, tall
 *   arched windows over it, a low roof with the nave's clerestory, end pavilions a little taller;
 * - the **tower** over the middle of the Embarcadero front: a square shaft with a clock on each face three-fifths of
 *   the way up, a balustraded cornice, an open colonnaded belfry, a smaller colonnaded stage above that, and the
 *   lantern with its flag;
 * - the PORT OF and SAN FRANCISCO roof signs either side of the tower, facing the bay.
 *
 * Local frame: long axis x, the Embarcadero (city) front toward −z, the bay +z; fitted to OSM's way.
 */
import type { MeshBuilder } from '../../buildings.ts'
import { box, prism, type Rgb } from '../../models.ts'
import type { Fit } from '../fit.ts'
import { clockFace } from '../parts.ts'
import { sign } from '../signage.ts'

const STONE: Rgb = [0.88, 0.84, 0.74]   // Colusa sandstone: a warm pale buff, not grey (2026-10-03)
const STONE_DARK: Rgb = [0.75, 0.71, 0.61]
const ROOF: Rgb = [0.4, 0.42, 0.44]   // dark slate grey with its solar panels (2026 photo)
const DARK: Rgb = [0.24, 0.25, 0.27]
const CLOCK: Rgb = [0.92, 0.92, 0.88]

/** Round-arched openings along a face at z = zf (facing sign s), from x0 to x1, `n` of them, sill y0 to crown y1. */
function arcade(out: MeshBuilder, x0: number, x1: number, zf: number, s: number, n: number, y0: number, y1: number, w: number): void {
  for (let i = 0; i < n; i++) {
    const x = x0 + ((x1 - x0) * (i + 0.5)) / n
    box(out, x, (y0 + y1 - w / 2) / 2, zf + s * 0.05, w / 2, (y1 - w / 2 - y0) / 2, 0.06, DARK, 0)
    // the arch's head: a small stack standing in for the semicircle
    for (let k = 1; k <= 3; k++) {
      const hw = (w / 2) * Math.cos((k / 4) * (Math.PI / 2))
      box(out, x, y1 - w / 2 + (k * w) / 8, zf + s * 0.05, hw, w / 16, 0.06, DARK, 0)
    }
  }
}

export function ferryBuilding(out: MeshBuilder, fit: Fit): void {
  const hx = Math.min(110, Math.max(80, fit.hx))
  const hz = Math.min(30, Math.max(18, fit.hz))
  const eaves = 15
  // the terminal
  box(out, 0, eaves / 2, 0, hx, eaves / 2, hz, STONE, 0)
  box(out, 0, eaves + 0.5, 0, hx + 0.4, 0.5, hz + 0.4, STONE_DARK, 0)
  // the end pavilions
  for (const s of [-1, 1]) box(out, s * (hx - 9), (eaves + 3) / 2, 0, 9, (eaves + 3) / 2, hz + 0.6, STONE, 0)
  for (const s of [-1, 1]) {
    box(out, s * (hx - 9), eaves + 3.4, 0, 9.3, 0.4, hz + 0.9, STONE_DARK, 0)              // their cornice
    box(out, s * (hx - 9), eaves + 4.6, 0, 8.4, 0.8, hz - 0.2, ROOF, 0)                    // and low slate roof
    for (const f of [-1, 1]) {                                                              // the arcades run on round them
      arcade(out, s > 0 ? hx - 17 : -hx + 1, s > 0 ? hx - 1 : -hx + 17, f * (hz + 0.6), f, 4, 0.3, 6.6, 3.6)
      arcade(out, s > 0 ? hx - 17 : -hx + 1, s > 0 ? hx - 1 : -hx + 17, f * (hz + 0.6), f, 4, 8.2, 14.2, 2.8)
    }
  }
  // the roof: low, with the nave's clerestory down its middle
  box(out, 0, eaves + 2, 0, hx - 18, 1.6, hz - 2, ROOF, 0)
  box(out, 0, eaves + 4.2, 0, hx - 22, 1.2, 5, [0.72, 0.76, 0.78], 0)
  // the arcade at the street and the arched windows over it, both long fronts
  for (const s of [-1, 1]) {
    arcade(out, -hx + 18, hx - 18, s * hz, s, 22, 0.3, 6.6, 4.2)
    arcade(out, -hx + 18, hx - 18, s * hz, s, 22, 8.2, 13.6, 3.2)
    box(out, 0, 7.4, s * (hz + 0.2), hx, 0.25, 0.2, STONE_DARK, 0)       // the string course
  }
  // the two roof signs facing the bay, either side of the tower: PORT OF to the south (+x, the reader's left from
  // the water), SAN FRANCISCO to the north — dark letters by day, red neon by night, on open steel frames
  // (Commons "Ferry Building San Francisco from Hyatt Regency ... 2026 dllu" and "Ferry Building at night";
  // docs/shots/refs/notable/ferry-signs). Sizes from the 2026 photo, scaled by the tower's 14.4 m.
  const sz = hz - 6, sy = eaves + 6.6, cap = 3.2
  for (const [text, cx, w] of [['PORT OF', 26, 21], ['SAN FRANCISCO', -38, 42]] as [string, number, number][]) {
    sign(out, { type: 'flat', text, h: cap, w, face: 'grotesque', weight: 'bold', colour: [0.13, 0.13, 0.14], lit: 'self', standoff: 0.15, twoSided: true },
      { x: cx, y: sy, z: sz, heading: 0 })
    box(out, cx, sy - cap / 2 - 0.5, sz - 0.1, w / 2 + 0.6, 0.12, 0.12, DARK, 0)                  // the bottom rail
    box(out, cx, sy + cap / 2 + 0.4, sz - 0.1, w / 2 + 0.6, 0.08, 0.08, DARK, 0)                  // the top rail
    const n = Math.round(w / 3)
    for (let i = 0; i <= n; i++) {                                                                 // the posts
      const x = cx - w / 2 - 0.4 + ((w + 0.8) * i) / n
      box(out, x, (eaves + 3.2 + sy + cap / 2 + 0.4) / 2, sz - 0.1, 0.07, (sy + cap / 2 + 0.4 - eaves - 3.2) / 2, 0.07, DARK, 0)
      if (i < n) box(out, x + (w + 0.8) / n / 2, sy, sz - 0.25, (w + 0.8) / n / 2, 0.05, 0.05, DARK, 0)   // the bracing
    }
  }
  // the entrance pavilion under the tower, standing forward of the city front: three giant arched windows over three
  // square doorways, paired columns between, a cornice and balustrade a little over the wings' (2026 Commons photo
  // "Ferry Building San Francisco from Hyatt Regency ... dllu", docs/shots/refs/notable/ferry-signs)
  const pz = -hz - 2.4, pw = 21, ph = 17
  box(out, 0, ph / 2, (pz + (-hz + 8)) / 2, pw, ph / 2, ((-hz + 8) - pz) / 2, STONE, 0)
  box(out, 0, ph + 0.4, pz + 5, pw + 0.5, 0.4, 5.5, STONE_DARK, 0)                       // the cornice
  for (let i = 0; i <= 20; i++) box(out, -pw + (2 * pw * i) / 20, ph + 1.2, pz + 0.1, 0.12, 0.45, 0.12, STONE, 0)   // balusters
  box(out, 0, ph + 1.75, pz + 0.1, pw, 0.12, 0.18, STONE, 0)                               // the rail
  for (const x of [-11, 0, 11]) {
    box(out, x, 2.6, pz - 0.05, 2.1, 2.6, 0.08, DARK, 0)                                   // the doorways
    arcade(out, x - 2.5, x + 2.5, pz, -1, 1, 8.2, 14.6, 4.8)                               // the great arched window
    for (let k = -1; k <= 1; k++) box(out, x + k * 0.8, 11, pz - 0.1, 0.05, 3, 0.05, STONE_DARK, 0)   // its mullions
  }
  arcade(out, -19, -15.4, pz, -1, 1, 0.3, 5.6, 3)                                          // the side doors, arched
  arcade(out, 15.4, 19, pz, -1, 1, 0.3, 5.6, 3)
  for (const x of [-16.6, -5.5, 5.5, 16.6]) for (const d of [-0.75, 0.75]) prism(out, x + d, pz - 0.45, 6.4, 16.2, 0.38, 8, STONE, 0)
  box(out, 0, 6.6, pz - 0.15, pw, 0.3, 0.3, STONE_DARK, 0)                                 // the string course
  // flags along the roof's city edge (the Port's: the Stars and Stripes, California's, San Francisco's gold)
  const FLAGS: Rgb[] = [[0.75, 0.2, 0.2], [0.88, 0.86, 0.8], [0.85, 0.7, 0.25], [0.75, 0.2, 0.2], [0.85, 0.7, 0.25], [0.88, 0.86, 0.8]]
  ;[-86, -62, -36, 36, 62, 86].forEach((x, i) => {
    prism(out, x, -hz + 1.5, eaves + 1, eaves + 8.5, 0.06, 4, DARK, 0)
    box(out, x + 0.85, eaves + 7.6, -hz + 1.5, 0.8, 0.5, 0.02, FLAGS[i], 0)
  })
  // the tower: from the pavilion, ~10.5 m square (the photo, against its 75 m to the flag)
  const tz = -hz + 2.9
  const w = 5.2
  box(out, 0, 22, tz, w, 22, w, STONE, 0)
  for (const [dx, dz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) box(out, dx * (w - 0.45), 22, tz + dz * (w - 0.45), 0.7, 22, 0.7, STONE_DARK, 0)
  box(out, 0, 18.2, tz, w + 0.25, 0.3, w + 0.25, STONE_DARK, 0)                              // a band at the roofline
  for (const [nx, nz] of [[0, -1], [0, 1], [1, 0], [-1, 0]]) {
    // the clock, big, in a square stone surround — telling the real time (render/clocks.ts)
    box(out, nx * (w + 0.1), 34, tz + nz * (w + 0.1), nx ? 0.12 : 4.1, 4.1, nz ? 0.12 : 4.1, STONE_DARK, 0)
    clockFace(out, nx * (w + 0.22), 34, tz + nz * (w + 0.22), nx, nz, 3.6, { dial: CLOCK, rim: DARK, out: 0.12 })
    // three arched openings over it
    for (const t of [-2.6, 0, 2.6]) {
      const cx = nx ? nx * (w + 0.06) : t, cz = tz + (nz ? nz * (w + 0.06) : t)
      box(out, cx, 40.2, cz, nx ? 0.06 : 0.8, 1.8, nz ? 0.06 : 0.8, DARK, 0)
      box(out, cx, 42.2, cz, nx ? 0.06 : 0.55, 0.25, nz ? 0.06 : 0.55, DARK, 0)
      box(out, cx, 42.5, cz, nx ? 0.06 : 0.3, 0.12, nz ? 0.06 : 0.3, DARK, 0)
    }
  }
  // the cornice and its balustrade
  box(out, 0, 44.3, tz, w + 0.8, 0.5, w + 0.8, STONE_DARK, 0)
  box(out, 0, 45.4, tz, w + 0.6, 0.6, w + 0.6, STONE, 0)
  // the belfry: an open colonnade, four columns a side, and its entablature
  const colonnade = (y0: number, y1: number, half: number, n: number, r: number): void => {
    box(out, 0, (y0 + y1) / 2, tz, half - 1.2, (y1 - y0) / 2, half - 1.2, [0.5, 0.51, 0.53], 0)   // the shadowed core
    for (let i = 0; i < n; i++) {
      const t = -half + (2 * half * i) / (n - 1)
      for (const [x, z] of [[t, -half], [t, half], [-half, t], [half, t]]) prism(out, x, tz + z, y0, y1, r, 6, STONE, 0)
    }
    box(out, 0, y1 + 0.5, tz, half + 0.4, 0.5, half + 0.4, STONE_DARK, 0)
  }
  colonnade(46, 52.6, 4.4, 4, 0.38)
  box(out, 0, 53.8, tz, 3.8, 0.7, 3.8, STONE, 0)
  colonnade(54.5, 59.4, 3.0, 3, 0.3)
  // the lantern, its little dome, the flag
  prism(out, 0, tz, 60.4, 64.6, 1.7, 8, STONE, 0)
  prism(out, 0, tz, 64.6, 66.6, 1.9, 8, STONE_DARK, 0, 0.6)
  prism(out, 0, tz, 66.6, 75, 0.08, 4, DARK, 0)
  box(out, 0.9, 74.2, tz, 0.8, 0.5, 0.02, [0.7, 0.2, 0.2], 0)
}
