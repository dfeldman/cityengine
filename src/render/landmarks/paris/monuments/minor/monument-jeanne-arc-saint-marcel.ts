import type { MeshBuilder } from '../../../../buildings.ts'
import { prism, type Rgb } from '../../../../models.ts'
import { block, hex, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { FIXED } from '../common.ts'
import { G } from '../plaza-common.ts'
import { plaque } from './monument-kit.ts'

/*
 * JEANNE D'ARC 1412-1431 (boulevard Saint-Marcel at the rue Jeanne-d'Arc, Paris 13e; Charles-Auguste Lebourg): a standing
 * bronze Jeanne with banner and shield on a round limestone pedestal (stepped foot, moulded plinth, a waisted shaft with a
 * cartouche reading JEANNE D'ARC 1412-1431, a cornice) on a paved traffic island. The figure: Modly
 * `jeanne-marcel-statue` (paris-statues.json, attached at STATUE_AT). Frame: −z the cartouche face, y up from the ground (G).
 * Dimensions are scaled by eye off one 2008 Commons photograph, not surveyed.
 */
export const HX = 1.5
export const HZ = 1.5

// tunables (metres; radii of the 14-sided drums)
const SIDES = 14
const ISLAND_R = 1.45, ISLAND_H = 0.12          // paved island disc the pedestal stands on
const FOOT: [number, number][] = [[1.12, 0.2], [0.98, 0.3]]   // [radius, height] stepped foot, widest first
const PLINTH_R0 = 0.84, PLINTH_R1 = 0.7, PLINTH_H = 0.32       // moulded plinth tapering in
const SHAFT_R0 = 0.56, SHAFT_R1 = 0.5, SHAFT_H = 1.8           // waisted shaft
const COR: [number, number, number][] = [[0.5, 0.64, 0.2], [0.64, 0.64, 0.1], [0.58, 0.58, 0.12]]  // cornice [rBottom, rTop, h]
const CART_W = 0.42, CART_H = 0.5, CART_Y = 0.55           // cartouche on the shaft
export const STATUE_AT: [number, number, number] = [0, 0, 0]

const STONE: Rgb = hex('#cdc4ad')
const SETT: Rgb = hex('#8d8a84')

function top(): number {
  return ISLAND_H + FOOT.reduce((s, [, h]) => s + h, 0) + PLINTH_H + SHAFT_H + COR.reduce((s, [, , h]) => s + h, 0)
}
STATUE_AT[1] = G + top()

function draw(q: MeshBuilder): void {
  let y = G
  prism(q, 0, 0, y, y + ISLAND_H, ISLAND_R, 24, SETT, FIXED, ISLAND_R, true)
  y += ISLAND_H
  FOOT.forEach(([r, h], i) => {
    prism(q, 0, 0, y, y + h, r, SIDES, shade(STONE, 0.9 + 0.03 * i), FIXED, r, true)
    y += h
  })
  prism(q, 0, 0, y, y + PLINTH_H, PLINTH_R0, SIDES, shade(STONE, 0.97), FIXED, PLINTH_R1, true)
  y += PLINTH_H
  const y0 = y
  prism(q, 0, 0, y, y + SHAFT_H, SHAFT_R0, SIDES, STONE, FIXED, SHAFT_R1, true)
  const rAt = (v: number): number => SHAFT_R0 + (SHAFT_R1 - SHAFT_R0) * (v / SHAFT_H)
  // cartouche on the −z face (the shaft face at that height, plus the facet's sagitta)
  const cz = -(rAt(CART_Y + CART_H / 2) * Math.cos(Math.PI / SIDES)) + 0.01
  plaque(q, { x: 0, z: cz, y0: y0 + CART_Y, w: CART_W, h: CART_H, panel: shade(STONE, 1.06), frame: shade(STONE, 0.86), letters: shade(STONE, 0.5), lines: [0.9, 0.6, 0.8] })
  y += SHAFT_H
  COR.forEach(([r0, r1, h], i) => {
    prism(q, 0, 0, y, y + h, r0, SIDES, shade(STONE, 1.02 - 0.03 * i), FIXED, r1, true)
    y += h
  })
  // thin dark plate under the figure
  block(q, -0.4, 0.4, -0.4, 0.4, y, y + 0.01, shade(STONE, 0.7))
}

export function monumentJeanneArcSaintMarcel(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
