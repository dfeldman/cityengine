/**
 * THE OPEN BART PLAZAS on Mission Street (owner, 2026-10-03, with an aerial of 24th & Mission: "we are rendering the same
 * BART station entrances as we did downtown. the reality is they are huge holes with stairs going down, exposed to the
 * air"). At 16th and at 24th the station entrances are sunken plazas on two opposite corners: a round (24th SW) or
 * squarish plaza of red brick paving, a deep circular or oblong WELL in it ringed by a low wall with a rail, and in the
 * well the stairs and escalators going down in the open, planting round them.
 *
 * The terrain cannot be dug here, so the well is drawn as what is seen of it: the parapet and rail, a dark floor a hand
 * above the ground with the treads of the stair across it, the planted ledge round it. `coversRaised` on the entry
 * claims the corner: the city's downtown-style entrance kiosks at OSM's subway_entrance nodes inside it are not drawn.
 *
 * Local frame: x east, z north (front 180), the stair descending toward −z.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { box, prism, strut, type Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'

const BRICK: Rgb = [0.6, 0.3, 0.24]
const WALL: Rgb = [0.72, 0.68, 0.62]
const RAIL: Rgb = [0.3, 0.32, 0.34]
const PIT: Rgb = [0.16, 0.15, 0.15]
const TREAD: Rgb = [0.36, 0.35, 0.33]
const PLANT: Rgb = [0.26, 0.42, 0.22]

function disc(out: MeshBuilder, r: number, y: number, c: Rgb, tag: number, n = 32): void {
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2
    out.quad([[0, y, 0], [Math.cos(a1) * r, y, Math.sin(a1) * r], [Math.cos(a0) * r, y, Math.sin(a0) * r], [0, y, 0]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], c, tag)
  }
}

/** the round plaza (24th St, south-west corner): brick disc, the circular well, the stair across it */
export function bartPlazaRound(out: MeshBuilder, fit: Fit): void {
  const R = Math.max(10, Math.min(fit.hx, fit.hz))
  const W = R * 0.52
  const brick = surfaceTag('brick'), conc = surfaceTag('concrete')
  disc(out, R, 0.04, BRICK, brick)
  // the planted ledge, then the dark well floor, inside the parapet
  // (each layer 8 cm over the last: 2 cm apart they shimmered against each other at a distance)
  disc(out, W, 0.12, PLANT, 0)
  disc(out, W * 0.82, 0.2, PIT, 0)
  // the stair and the escalators, descending south across the well: treads as pale bars on the dark floor
  for (let k = 0; k < 16; k++) {
    const z = W * 0.75 - k * (W * 1.5) / 16
    box(out, -W * 0.15, 0.24, z, W * 0.32, 0.01, 0.12, TREAD, conc)
  }
  for (const x of [W * 0.3, W * 0.45]) box(out, x, 0.26, 0, 0.35, 0.01, W * 0.75, [0.5, 0.5, 0.52], surfaceTag('metal'))
  // the parapet round the well, and the rail on it
  const n = 28
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2
    const p = (a: number, r: number, y: number): [number, number, number] => [Math.cos(a) * r, y, Math.sin(a) * r]
    const am = (a0 + a1) / 2
    box(out, Math.cos(am) * W, 0.45, Math.sin(am) * W, (W * Math.PI) / n + 0.05, 0.45, 0.2, WALL, conc)
    strut(out, p(a0, W, 1.05), p(a1, W, 1.05), 0.05, 0.05, RAIL)
    if (i % 2 === 0) strut(out, p(a0, W, 0.9), p(a0, W, 1.05), 0.03, 0.03, RAIL)
  }
  // the station sign on its pylon at the plaza's edge
  prism(out, R * 0.75, -R * 0.4, 0, 3.2, 0.12, 6, RAIL)
  box(out, R * 0.75, 3.0, -R * 0.4, 0.5, 0.35, 0.06, [0.15, 0.35, 0.65], 0)
}

/** the oblong well (24th St north-east corner, and 16th St): a brick plaza with a long open stair down its middle */
export function bartPlazaLong(out: MeshBuilder, fit: Fit): void {
  const hx = Math.max(8, fit.hx), hz = Math.max(6, fit.hz)
  const brick = surfaceTag('brick'), conc = surfaceTag('concrete')
  box(out, 0, 0.04, 0, hx, 0.04, hz, BRICK, brick)
  const wx = hx * 0.55, wz = hz * 0.4
  // (a box has a floor as well as a lid: each layer's bottom 6 cm clear of the lid below)
  box(out, 0, 0.16, 0, wx + 0.6, 0.02, wz + 0.6, PLANT, 0)
  box(out, 0, 0.26, 0, wx, 0.02, wz, PIT, 0)
  for (let k = 0; k < 18; k++) box(out, -wx + (k + 0.5) * (2 * wx) / 18, 0.34, 0, 0.12, 0.01, wz * 0.6, TREAD, conc)
  for (const s of [-1, 1]) {
    box(out, 0, 0.45, s * (wz + 0.7), wx + 0.8, 0.45, 0.15, WALL, conc)
    strut(out, [-wx - 0.8, 1.05, s * (wz + 0.7)], [wx + 0.8, 1.05, s * (wz + 0.7)], 0.05, 0.05, RAIL)
    box(out, s * (wx + 0.7), 0.45, 0, 0.15, 0.45, wz + 0.8, WALL, conc)
  }
  prism(out, hx * 0.8, hz * 0.8, 0, 3.2, 0.12, 6, RAIL)
  box(out, hx * 0.8, 3.0, hz * 0.8, 0.5, 0.35, 0.06, [0.15, 0.35, 0.65], 0)
}

/** one name per plaza (a builder named by several entries reads as a dead duplicate to the audits) */
export const BART_PLAZAS: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  bartPlaza24thSW: bartPlazaRound, bartPlaza24thNE: bartPlazaLong, bartPlaza16thNE: bartPlazaLong, bartPlaza16thSW: bartPlazaLong,
}
