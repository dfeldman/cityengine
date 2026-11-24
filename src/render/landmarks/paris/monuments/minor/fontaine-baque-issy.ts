import type { MeshBuilder } from '../../../../buildings.ts'
import { prism, type Rgb } from '../../../../models.ts'
import { block, hex, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { G } from '../plaza-common.ts'
import { roundBasin, sweptTube } from './monument-kit.ts'

/*
 * THE FONTAINE OF THE RUE PRUDENT-JASSEDÉ, Issy-les-Moulineaux (Pierre Baqué, 1992, stainless steel and masonry, on the
 * site of the town's oldest fountain; OSM node 4962502455 "Fontaine", only two Commons photographs, both from above): in
 * the stepped pedestrian lane below the place de l'Église a round brick-lipped basin holds a cluster of leaning
 * stainless-steel spikes; round it stand ruin-like columns of banded limestone drums — three tall ones, two of them
 * carrying a stepped lintel, the third a lone capital block — and a few stumps. Frame: y up, +z = back of the court.
 * All sizes are estimates off the photographs (basin ~3 m across, tall columns ~2.9 m), not measured.
 */
export const R = 4.2

// tunables
const BASIN_R = 1.55
const BASIN_H = 0.4
const COL_R = 0.23
const COL_H = 2.7
const DRUMS = 9               // drum joints on a tall column
const SPIKES = 9
const SPIKE_H = 1.5

const STONE: Rgb = hex('#c9c3b2')
const BRICK: Rgb = hex('#9a5f47')
const STEEL: Rgb = hex('#9aa0a4')
const WATER: Rgb = hex('#6f8f94')

/** tall columns [x, z], then stumps [x, z, height] */
const TALL: [number, number][] = [[-1.9, 1.5], [0.2, 2.0], [2.3, 1.1]]
const STUMPS: [number, number, number][] = [[-1.9, -0.3, 0.95], [-1.3, -1.5, 0.8], [1.9, 0.0, 1.1], [1.6, -1.2, 0.75]]

function column(q: MeshBuilder, x: number, z: number, y0: number, h: number, r: number): void {
  const n = Math.max(2, Math.round(h / 0.3))
  for (let i = 0; i < n; i++) {
    const a = y0 + (h * i) / n
    prism(q, x, z, a, a + h / n - 0.012, r, 10, shade(STONE, i % 2 ? 0.97 : 1.03), undefined, r, true)
  }
}

function draw(q: MeshBuilder): void {
  const y0 = G
  // flagged court, a square of paving round the basin
  block(q, -3.6, 3.6, -3.0, 3.6, y0 - 0.12, y0, shade(STONE, 0.86))
  const top = roundBasin(q, 0, 0, y0, BASIN_R, { rim: 0.3, depth: BASIN_H, lip: 0.06, stone: BRICK, water: WATER })
  // the spikes: thin leaning steel rods from the basin's middle
  for (let i = 0; i < SPIKES; i++) {
    const a = i * 2.4
    const lean = 0.15 + 0.12 * (i % 3)
    const h = SPIKE_H * (0.55 + 0.45 * ((i * 5) % 7) / 6)
    sweptTube(q, [[Math.sin(a) * 0.1, y0 + 0.05, Math.cos(a) * 0.1], [Math.sin(a) * (0.1 + lean * h), y0 + 0.05 + h, Math.cos(a) * (0.1 + lean * h)]], { r: 0.03, sides: 4, c: STEEL })
  }
  // the tall columns of drums, each on a square foot, with a thin capital slab
  TALL.forEach(([x, z], i) => {
    block(q, x - 0.34, x + 0.34, z - 0.34, z + 0.34, y0, y0 + 0.14, shade(STONE, 0.92))
    column(q, x, z, y0 + 0.14, COL_H, COL_R)
    const yc = y0 + 0.14 + COL_H
    block(q, x - 0.4, x + 0.4, z - 0.4, z + 0.4, yc, yc + 0.22, shade(STONE, 1.06))
    if (i === 2) block(q, x - 0.3, x + 0.3, z - 0.3, z + 0.3, yc + 0.22, yc + 0.5, shade(STONE, 0.98))
  })
  // the lintel across the first two columns, stepped
  const [a, b] = [TALL[0], TALL[1]]
  const yl = y0 + 0.14 + COL_H + 0.22
  const lx0 = Math.min(a[0], b[0]) - 0.45, lx1 = Math.max(a[0], b[0]) + 0.45
  block(q, lx0, lx1, Math.min(a[1], b[1]) - 0.45, Math.max(a[1], b[1]) + 0.45, yl, yl + 0.28, shade(STONE, 0.98))
  block(q, lx0 + 0.12, lx1 - 0.12, Math.min(a[1], b[1]) - 0.33, Math.max(a[1], b[1]) + 0.33, yl + 0.28, yl + 0.42, shade(STONE, 1.04))
  // the stumps
  for (const [x, z, h] of STUMPS) {
    column(q, x, z, y0, h, COL_R * 0.95)
    block(q, x - 0.3, x + 0.3, z - 0.3, z + 0.3, y0 + h, y0 + h + 0.14, shade(STONE, 1.05))
  }
  void top
}

export function fontaineBaqueIssy(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, R, R, draw)
}
