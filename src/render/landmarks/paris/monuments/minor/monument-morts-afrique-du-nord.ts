import type { MeshBuilder } from '../../../../buildings.ts'
import type { Rgb } from '../../../../models.ts'
import { block, hex, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { G } from '../plaza-common.ts'
import { plaque } from './monument-kit.ts'

/*
 * LE MONUMENT AUX MORTS POUR LA FRANCE EN AFRIQUE DU NORD DE 1952 A 1962 (Père-Lachaise, division 88; Wikidata Q96091551):
 * a paved court in grey-green stone, entered by two low steps, closed at the back by a two-tier wall (a plain lower wall,
 * and above it, standing proud on a shadow gap, a band of name panels between a base bar and a coping), with a wing of
 * inclined slabs each side and, central, a tall rough-faced inscribed stele standing on a low ledger. Read off Commons
 * photos Division 88 01-03. Frame: −z the open front, x across, y up from the ground (G). Sizes estimated by eye.
 */
export const HX = 4.0
export const HZ = 2.6

// tunables (metres)
const COURT_HW = 3.7, COURT_Z0 = -2.3, COURT_Z1 = 2.3        // paved court extent
const STEP_H = 0.1, STEP_D = 0.35                              // two entry steps
const WALL_HW = 3.2, WALL_Z = 1.9, WALL_T = 0.32, WALL_H = 0.95 // lower back wall
const GAP_H = 0.1                                              // shadow gap under the band
const BAND_Z_OUT = 0.1, BAND_BASE = 0.14, BAND_PANEL = 0.5, BAND_COPE = 0.14 // band proud of the wall, bars and panels
const PANELS = 7                                               // name panels along the band
const WING_X0 = 3.2, WING_X1 = 3.7, WING_Z0 = -1.6, WING_STEPS = 8 // inclined side wings: x range, front z, slices
const STELE_HW = 0.55, STELE_T = 0.11, STELE_H = 2.3, STELE_Z = 1.1 // stele half-width, half-thickness, height, centre z
const LEDGER_HW = 0.65, LEDGER_Z0 = 0.35, LEDGER_Z1 = 1.35, LEDGER_H = 0.28 // low ledger slab before the stele

const STONE: Rgb = hex('#8e9690')
const PAVE: Rgb = hex('#7f8782')
const DARK: Rgb = hex('#3a3d3b')

function draw(q: MeshBuilder): void {
  const y = (v: number): number => G + v
  // court floor and two entry steps
  block(q, -COURT_HW, COURT_HW, COURT_Z0 + 2 * STEP_D, COURT_Z1, y(0), y(2 * STEP_H), PAVE)
  block(q, -COURT_HW, COURT_HW, COURT_Z0, COURT_Z0 + STEP_D, y(0), y(STEP_H), shade(PAVE, 0.92))
  block(q, -COURT_HW, COURT_HW, COURT_Z0 + STEP_D, COURT_Z0 + 2 * STEP_D, y(0), y(STEP_H * 1.5), shade(PAVE, 0.96))
  const f = 2 * STEP_H // floor height
  // lower back wall
  block(q, -WALL_HW, WALL_HW, WALL_Z - WALL_T / 2, WALL_Z + WALL_T / 2, y(f), y(f + WALL_H), STONE)
  // upper band: dark gap, base bar, panels, coping
  const bz0 = WALL_Z - WALL_T / 2 - BAND_Z_OUT, bz1 = WALL_Z + WALL_T / 2
  const b0 = f + WALL_H
  block(q, -WALL_HW, WALL_HW, WALL_Z - WALL_T / 2 + 0.05, bz1, y(b0), y(b0 + GAP_H), DARK)
  const y1 = b0 + GAP_H
  block(q, -WALL_HW, WALL_HW, bz0, bz1, y(y1), y(y1 + BAND_BASE), shade(STONE, 1.06))
  const pw = (2 * WALL_HW) / PANELS
  for (let i = 0; i < PANELS; i++) {
    const x0 = -WALL_HW + i * pw
    block(q, x0 + 0.02, x0 + pw - 0.02, bz0 + 0.03, bz1, y(y1 + BAND_BASE), y(y1 + BAND_BASE + BAND_PANEL), i % 2 ? shade(STONE, 0.94) : shade(STONE, 1.0))
    plaque(q, { x: x0 + pw / 2, z: bz0 + 0.03, y0: y(y1 + BAND_BASE + 0.05), w: pw * 0.62, h: BAND_PANEL - 0.1, panel: shade(STONE, 0.9), letters: shade(STONE, 0.62), lines: [0.8, 0.7, 0.8, 0.75, 0.8, 0.7, 0.8, 0.6, 0.8, 0.7] })
  }
  block(q, -WALL_HW, WALL_HW, bz0, bz1, y(y1 + BAND_BASE + BAND_PANEL), y(y1 + BAND_BASE + BAND_PANEL + BAND_COPE), shade(STONE, 1.08))
  // inclined side wings: stepped slices rising from the court front to the wall
  for (const s of [-1, 1]) {
    const xa = Math.min(s * WING_X0, s * WING_X1), xb = Math.max(s * WING_X0, s * WING_X1)
    const len = WALL_Z - WING_Z0
    for (let i = 0; i < WING_STEPS; i++) {
      const z0 = WING_Z0 + (len * i) / WING_STEPS, z1 = WING_Z0 + (len * (i + 1)) / WING_STEPS
      block(q, xa, xb, z0, z1, y(f), y(f + (WALL_H * 1.05 * (i + 1)) / WING_STEPS), shade(STONE, 1.02 + 0.02 * (i % 2)))
    }
  }
  // ledger and stele
  block(q, -LEDGER_HW, LEDGER_HW, LEDGER_Z0, LEDGER_Z1, y(f), y(f + LEDGER_H), shade(STONE, 0.85))
  block(q, -STELE_HW, STELE_HW, STELE_Z - STELE_T, STELE_Z + STELE_T, y(f), y(f + STELE_H), shade(STONE, 0.97))
  plaque(q, { x: 0, z: STELE_Z - STELE_T - 0.001, y0: y(f + 1.3), w: 0.8, h: 0.65, panel: shade(STONE, 0.94), letters: hex('#b89a4a'), lines: [0.5, 0.8, 0.85, 0.8, 0.7, 0.3] })
}

export function monumentMortsAfriqueDuNord(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
