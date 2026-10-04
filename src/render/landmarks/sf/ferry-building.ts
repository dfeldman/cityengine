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
 * - the "SAN FRANCISCO" letters on the roof, facing the bay.
 *
 * Local frame: long axis x, the Embarcadero (city) front toward −z, the bay +z; fitted to OSM's way.
 */
import type { MeshBuilder } from '../../buildings.ts'
import { box, prism, type Rgb } from '../../models.ts'
import type { Fit } from '../fit.ts'
import { clockFace } from '../parts.ts'

const STONE: Rgb = [0.88, 0.84, 0.74]   // Colusa sandstone: a warm pale buff, not grey (2026-10-03)
const STONE_DARK: Rgb = [0.75, 0.71, 0.61]
const ROOF: Rgb = [0.5, 0.55, 0.55]
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
  // the roof: low, with the nave's clerestory down its middle
  box(out, 0, eaves + 2, 0, hx - 18, 1.6, hz - 2, ROOF, 0)
  box(out, 0, eaves + 4.2, 0, hx - 22, 1.2, 5, [0.62, 0.7, 0.72], 0)
  // the arcade at the street and the arched windows over it, both long fronts
  for (const s of [-1, 1]) {
    arcade(out, -hx + 18, hx - 18, s * hz, s, 22, 0.3, 6.6, 4.2)
    arcade(out, -hx + 18, hx - 18, s * hz, s, 22, 8.2, 13.6, 3.2)
    box(out, 0, 7.4, s * (hz + 0.2), hx, 0.25, 0.2, STONE_DARK, 0)       // the string course
  }
  // the SAN FRANCISCO letters on their frame over the bay front
  box(out, 0, eaves + 6.5, hz - 3, 34, 0.15, 0.3, DARK, 0)
  for (let i = 0; i < 13; i++) {
    if (i === 3) continue                                                   // the space between the words
    box(out, -30 + i * 5, eaves + 4.6, hz - 2.8, 1.6, 1.8, 0.25, DARK, 0)
  }
  // the tower, over the middle of the city front
  const tz = -hz + 6
  const w = 7.2
  box(out, 0, 24, tz, w, 24, w, STONE, 0)
  for (const [dx, dz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) box(out, dx * (w - 0.6), 24, tz + dz * (w - 0.6), 0.9, 24, 0.9, STONE_DARK, 0)
  // the clocks, one each face — telling the real time (render/clocks.ts)
  for (const [nx, nz] of [[0, -1], [0, 1], [1, 0], [-1, 0]]) clockFace(out, nx * w, 33, tz + nz * w, nx, nz, 3, { dial: CLOCK, rim: DARK, out: 0.12 })
  // the cornice and its balustrade
  box(out, 0, 48.6, tz, w + 0.8, 0.6, w + 0.8, STONE_DARK, 0)
  box(out, 0, 49.8, tz, w + 0.5, 0.6, w + 0.5, STONE, 0)
  // the belfry: an open colonnade, four columns a side, and its entablature
  const colonnade = (y0: number, y1: number, half: number, n: number, r: number): void => {
    box(out, 0, (y0 + y1) / 2, tz, half - 1.4, (y1 - y0) / 2, half - 1.4, [0.5, 0.51, 0.53], 0)   // the shadowed core
    for (let i = 0; i < n; i++) {
      const t = -half + (2 * half * i) / (n - 1)
      for (const [x, z] of [[t, -half], [t, half], [-half, t], [half, t]]) prism(out, x, tz + z, y0, y1, r, 6, STONE, 0)
    }
    box(out, 0, y1 + 0.5, tz, half + 0.4, 0.5, half + 0.4, STONE_DARK, 0)
  }
  colonnade(50.4, 57, 6.2, 4, 0.45)
  box(out, 0, 58.2, tz, 5.2, 0.7, 5.2, STONE, 0)
  colonnade(58.9, 64, 4.2, 3, 0.35)
  // the lantern, its little dome, the flag
  prism(out, 0, tz, 64.8, 69.5, 2.2, 8, STONE, 0)
  prism(out, 0, tz, 69.5, 71.5, 2.4, 8, STONE_DARK, 0, 0.6)
  prism(out, 0, tz, 71.5, 78, 0.08, 4, DARK, 0)
  box(out, 0.9, 77.2, tz, 0.8, 0.5, 0.02, [0.7, 0.2, 0.2], 0)
}
