import type { MeshBuilder } from '../../../../buildings.ts'
import { type Rgb } from '../../../../models.ts'
import { block, hex, lathe, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { G } from '../plaza-common.ts'
import { plaque } from './monument-kit.ts'

/*
 * THE FONTAINE ALFRED-STEVENS (passage Alfred-Stevens, end of the rue Alfred-Stevens, 9e; disused; no Wikidata id): a
 * freestanding screen wall closing the dead-end street between the houses — a yellow-stone footing, a cream rendered upper
 * wall with two pink recessed panels, and a central pavilion with an arched, blank panel under a segmental pediment
 * crowned by a scroll cartouche; below, a small console with a carved mascaron (a Modly model: statues manifest
 * `alfred-stevens-mascaron`) over a shallow arched niche and a round-fronted stone basin. Frame: −z the front (the street),
 * x across, y up, pavement at G. Dimensions are read off Commons photographs (P1150212/P1150214 Paris IX fontaine
 * Alfred-Stevens rwk) against the street width (~10 m between the houses), not surveyed.
 */
export const HX = 5.2
export const HZ = 2.0

// tunables (metres above the pavement)
const WALL_Z = 0.7            // the wall's front face
const WALL_T = 0.6
const HALF_W = 5.0            // half the wall's length (street width)
const FOOT_H = 1.9            // yellow-stone footing
const WALL_H = 4.3            // top of the side wings
const PAV_HW = 2.15           // pavilion half-width
const PAV_SHOULDER = 6.3      // pavilion cornice
const PAV_PROUD = 0.18
const PANEL_X0 = 2.4, PANEL_X1 = 3.9, PANEL_Y0 = 2.45, PANEL_Y1 = 3.5   // the pink wing panels
const ARCH_HW = 1.1, ARCH_SPRING = 4.55
const BASIN_R = 1.15, BASIN_H = 0.95, BASIN_Z = WALL_Z - 0.05
export const MASK_Y = 1.5       // the mascaron's base (above G); the model is MASK_H tall
const MASK_H = 1.3

const FOOT: Rgb = hex('#cdbf93')
const CREAM: Rgb = hex('#e3dccb')
const PINK: Rgb = hex('#c9a39c')
const STONE: Rgb = hex('#d6d0c0')
const WATER: Rgb = hex('#6d8d98')

/** The mascaron's attach point in the landmark frame (statues manifest `at`). */
export const MASK_AT: [number, number, number] = [0, G + MASK_Y, WALL_Z - 0.05]

function draw(q: MeshBuilder): void {
  const y = (v: number): number => G + v
  const zf = WALL_Z - WALL_T
  const zb = WALL_Z
  // footing and string course, the wings, the cornice
  block(q, -HALF_W, HALF_W, zf, zb, 0, y(FOOT_H), FOOT)
  block(q, -HALF_W - 0.05, HALF_W + 0.05, zf - 0.08, zb, y(FOOT_H), y(FOOT_H + 0.15), shade(FOOT, 0.92))
  block(q, -HALF_W, HALF_W, zf, zb, y(FOOT_H + 0.15), y(WALL_H), CREAM)
  block(q, -HALF_W - 0.08, HALF_W + 0.08, zf - 0.12, zb, y(WALL_H), y(WALL_H + 0.18), shade(CREAM, 0.95))
  // pink recessed panels (a dark margin, then the panel set back)
  for (const s of [-1, 1]) {
    const x0 = Math.min(s * PANEL_X0, s * PANEL_X1), x1 = Math.max(s * PANEL_X0, s * PANEL_X1)
    block(q, x0 - 0.1, x1 + 0.1, zf - 0.02, zf + 0.0, y(PANEL_Y0 - 0.1), y(PANEL_Y1 + 0.1), shade(CREAM, 0.85))
    block(q, x0, x1, zf - 0.03, zf + 0.0, y(PANEL_Y0), y(PANEL_Y1), PINK)
  }
  // the pavilion: a thicker central block with pilasters, arched panel, segmental pediment
  const zp = zf - PAV_PROUD
  block(q, -PAV_HW, PAV_HW, zp, zb, y(FOOT_H + 0.15), y(PAV_SHOULDER), CREAM)
  block(q, -PAV_HW - 0.12, PAV_HW + 0.12, zp - 0.1, zb, y(PAV_SHOULDER), y(PAV_SHOULDER + 0.2), STONE)
  for (const s of [-1, 1]) block(q, s * (PAV_HW - 0.35) - 0.17, s * (PAV_HW - 0.35) + 0.17, zp - 0.06, zp, y(FOOT_H + 0.15), y(PAV_SHOULDER), STONE)
  // segmental pediment: stacked slabs
  const N = 18
  const ph = 0.75
  for (let i = 0; i < N; i++) {
    const xa = -PAV_HW + (2 * PAV_HW * i) / N, xb = -PAV_HW + (2 * PAV_HW * (i + 1)) / N, xm = (xa + xb) / 2
    const t = 1 - (xm / PAV_HW) ** 2
    block(q, xa, xb, zp - 0.08, zb, y(PAV_SHOULDER + 0.2), y(PAV_SHOULDER + 0.2 + ph * Math.sqrt(Math.max(0, t))), STONE)
  }
  // crest: a scroll cartouche, finials at the shoulders
  block(q, -0.3, 0.3, zp - 0.1, zp + 0.1, y(PAV_SHOULDER + 0.2 + ph), y(PAV_SHOULDER + 0.2 + ph + 0.55), STONE)
  block(q, -0.18, 0.18, zp - 0.14, zp + 0.1, y(PAV_SHOULDER + 0.2 + ph + 0.55), y(PAV_SHOULDER + 0.2 + ph + 0.8), shade(STONE, 1.03))
  for (const s of [-1, 1]) lathe(q, s * (PAV_HW - 0.15), zp + 0.1, [[0, y(PAV_SHOULDER + 0.2)], [0.18, y(PAV_SHOULDER + 0.2)], [0.12, y(PAV_SHOULDER + 0.5)], [0.15, y(PAV_SHOULDER + 0.62)], [0, y(PAV_SHOULDER + 0.7)]], 10, STONE)
  // the arched blank panel: moulding, a recessed face, a plaque near the crown
  const N2 = 20
  for (let i = 0; i < N2; i++) {
    const xa = -ARCH_HW + (2 * ARCH_HW * i) / N2, xb = -ARCH_HW + (2 * ARCH_HW * (i + 1)) / N2, xm = (xa + xb) / 2
    const top = ARCH_SPRING + Math.sqrt(Math.max(0, ARCH_HW * ARCH_HW - xm * xm))
    block(q, xa, xb, zp - 0.03, zp, y(FOOT_H + 0.4), y(top), shade(CREAM, 0.93))
    block(q, xa, xb, zp - 0.07, zp - 0.03, y(top), y(top + 0.12), STONE)
  }
  for (const s of [-1, 1]) block(q, s * ARCH_HW - (s > 0 ? 0 : 0.12), s * ARCH_HW + (s > 0 ? 0.12 : 0), zp - 0.07, zp - 0.03, y(FOOT_H + 0.4), y(ARCH_SPRING), STONE)
  plaque(q, { x: 0, z: zp - 0.03, y0: y(ARCH_SPRING + 0.35), w: 0.55, h: 0.3, panel: shade(PINK, 1.05), frame: STONE, fw: 0.03, letters: shade(STONE, 0.5), lines: [0.8] })
  // the console and niche above the basin
  block(q, -0.75, 0.75, zp - 0.04, zb, y(MASK_Y - 0.1), y(MASK_Y + MASK_H), shade(STONE, 0.94))
  block(q, -0.85, 0.85, zp - 0.14, zb, y(MASK_Y + MASK_H), y(MASK_Y + MASK_H + 0.12), STONE)
  // shallow arched niche (dark back) low in the footing
  const N3 = 10
  for (let i = 0; i < N3; i++) {
    const xa = -0.62 + (1.24 * i) / N3, xb = -0.62 + (1.24 * (i + 1)) / N3, xm = (xa + xb) / 2
    const top = 0.6 + Math.sqrt(Math.max(0, 0.62 * 0.62 - xm * xm))
    block(q, xa, xb, zp + 0.03, zp + 0.06, y(0.25), y(top), shade(FOOT, 0.55))
  }
  // basin: a half-round stone bowl against the wall, water in it
  lathe(q, 0, BASIN_Z, [[0.0, y(0)], [BASIN_R * 0.75, y(0)], [BASIN_R * 0.85, y(BASIN_H * 0.4)], [BASIN_R, y(BASIN_H * 0.8)], [BASIN_R * 1.05, y(BASIN_H)], [BASIN_R * 0.86, y(BASIN_H + 0.03)]], 24, STONE)
  lathe(q, 0, BASIN_Z, [[0, y(BASIN_H - 0.12)], [BASIN_R * 0.88, y(BASIN_H - 0.12)]], 24, WATER)
}

export function fontaineAlfredStevens(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
