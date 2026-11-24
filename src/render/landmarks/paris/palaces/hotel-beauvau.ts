import type { MeshBuilder } from '../../../buildings.ts'
import type { Rgb } from '../../../models.ts'
import { prism } from '../../../models.ts'
import { block, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { extrude, fitted, palette, pts } from './common.ts'
import { wallOn } from './wall.ts'

/** the design footprint: OSM way 67353073's box (the Hôtel de Beauvau itself, not the ministry's plot), long axis NNE */
const HX = 21.8
const HZ = 6.9
const EAVES = 15.2
/** tunables */
const GATE_LEN = 15
const PIER = 1.1
const BAR_GAP = 0.16

/** the hôtel's outline in the frame (long axis x, court front −z), with its rounded garden end at +x */
const RING = pts([-18.2, 4.8, -18.6, 2.9, -19.5, 0.3, -20.5, -2.2, -21.8, -4.7, -17.5, -6.9, 5.9, -6.9, 21.8, -6.8, 21.8, -0.3, 21.5, 0, 19.4, 0.4,
  18.2, 0.8, 16.9, 1.4, 15.9, 1.9, 14.8, 2.8, 13.3, 4.2, 12.4, 5.4, 11.5, 6.9, -10.7, 6.8, -10.6, 3.9, -14.9, 3.9])

/**
 * The Hôtel de Beauvau (Le Camus de Mézières, 1770; the Ministry of the Interior's residence). From the street the rider sees the
 * gate with its grille and piers and the court front, a stone range of two storeys and an attic under a slate mansard, with a
 * pedimented avant-corps in the middle. The rest of the ministry stands behind and is not part of this model. Plan: OSM, the
 * long axis turned NNE; the gate is across the court at the SSW end, on the Rue du Faubourg Saint-Honoré side.
 */
export function hotelBeauvau(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

function draw(out: MeshBuilder): void {
  const p = palette('#e0d4ba', '#33393f')
  extrude(out, [RING], p, { eaves: EAVES, bay: 3.9, win: 1.5, rise: 5.2, inset: 2.0, dormers: true,
    storeys: [{ y: 0.6, h: 3.6 }, { y: 5.6, h: 4.2 }, { y: 10.4, h: 2.8 }] })
  const iron: Rgb = [0.1, 0.1, 0.1]
  // the court front: a plinth line, balconies, the pedimented avant-corps
  const w = wallOn(out, { x: -17.5, z: -HZ }, { x: HX, z: -HZ })
  const d = 0.22
  w.slab(0, w.L, 0, EAVES, d, p.stone, 0.05)
  for (let y = 0.6; y < 4.8; y += 0.6) w.rect(0, w.L, y - 0.04, y + 0.04, p.deep, d + 0.03)
  w.slab(-0.05, w.L + 0.05, 4.8, 5.1, d + 0.12, p.trim)
  const n = Math.round(w.L / 3.9)
  const step = w.L / n
  const mid = Math.round(n / 2)
  for (let i = 0; i < n; i++) {
    const m = step * (i + 0.5)
    const centre = i === mid || i === mid - 1
    w.rect(m - 0.85, m + 0.85, 0.9, 4.2, p.trim, d + 0.03)
    w.arch(m, 0.9, 1.4, 3.3, p.glass, d + 0.06)
    w.rect(m - 0.8, m + 0.8, 5.9, 9.9, p.trim, d + 0.03)
    w.rect(m - 0.6, m + 0.6, 6.0, 9.8, p.glass, d + 0.06)
    w.rect(m - 0.7, m + 0.7, 6.0, 6.9, iron, d + 0.22)
    w.slab(m - 0.95, m + 0.95, 9.9, 10.1, d + 0.15, p.trim)
    if (!centre) { w.rect(m - 0.65, m + 0.65, 10.7, 12.8, p.trim, d + 0.03); w.rect(m - 0.45, m + 0.45, 10.8, 12.7, p.glass, d + 0.06) }
  }
  w.slab(-0.1, w.L + 0.1, EAVES - 0.9, EAVES, d + 0.55, p.trim)
  // the avant-corps over the middle two bays, a pediment on it, pilasters
  const c = step * mid
  w.slab(c - step, c + step, 0, EAVES, 0.85, shade(p.stone, 1.03))
  for (const s of [-1, 1]) for (const u of [0.35, step - 0.35]) w.slab(c + s * u - 0.3, c + s * u + 0.3, 5.1, EAVES - 0.9, 1.1, p.trim)
  w.slab(c - step - 0.2, c + step + 0.2, EAVES - 0.9, EAVES + 0.3, 1.15, p.trim)
  w.ped(c - step - 0.2, c + step + 0.2, EAVES + 0.3, 3.2, 1.15, p.trim)
  w.rect(c - 1, c + 1, 5.9, 9.9, p.trim, 0.9)
  w.rect(c - 0.8, c + 0.8, 6, 9.8, p.glass, 0.93)
  w.rect(c - 1.7, c + 1.7, 0.9, 4.3, p.trim, 0.9)
  w.rect(c - 1.4, c + 1.4, 1, 4.2, p.glass, 0.93)
  // the gate across the court at the street end: stone piers with urns, a low wall, a grille, the gate leaves
  const gx = -HX - 2.2
  const z0 = -HZ - GATE_LEN
  const z1 = -HZ + 0.5
  const wall = (x0: number, x1: number, za: number, zb: number): void => block(out, x0, x1, za, zb, 0, 1.0, p.stone)
  wall(gx - 0.35, gx + 0.35, z0, z1)
  const bars = Math.floor((z1 - z0) / BAR_GAP / 4)
  for (let i = 0; i <= bars; i++) {
    const z = z0 + ((z1 - z0) * i) / bars
    block(out, gx - 0.04, gx + 0.04, z - 0.025, z + 0.025, 1.0, 3.3, iron)
  }
  block(out, gx - 0.05, gx + 0.05, z0, z1, 3.1, 3.2, iron)
  block(out, gx - 0.05, gx + 0.05, z0, z1, 1.3, 1.4, iron)
  const piers = [z0, z0 + GATE_LEN * 0.36, z0 + GATE_LEN * 0.64, z1]
  for (const z of piers) {
    block(out, gx - PIER / 2, gx + PIER / 2, z - PIER / 2, z + PIER / 2, 0, 3.6, p.stone)
    block(out, gx - PIER / 2 - 0.1, gx + PIER / 2 + 0.1, z - PIER / 2 - 0.1, z + PIER / 2 + 0.1, 3.6, 3.9, p.trim)
    prism(out, gx, z, 3.9, 4.8, 0.32, 8, shade(p.stone, 0.95), 0, 0.2)
  }
  // the gate leaves between the middle piers, taller, with a crest
  block(out, gx - 0.06, gx + 0.06, piers[1] + PIER / 2, piers[2] - PIER / 2, 0.4, 3.9, iron)
  block(out, gx - 0.1, gx + 0.1, piers[1] + PIER / 2, piers[2] - PIER / 2, 3.9, 4.3, [0.78, 0.62, 0.25])
}
