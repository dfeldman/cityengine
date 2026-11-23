import type { MeshBuilder } from '../../../../buildings.ts'
import { prism, type Rgb } from '../../../../models.ts'
import { block, hex, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { FIXED } from '../common.ts'
import { G } from '../plaza-common.ts'
import { roundBasin } from './monument-kit.ts'

/*
 * LA FONTAINE DE L'AVRIL (square Brignole-Galliera, 16e; Pierre Roche, 1906; Wikidata Q3076179; OSM way 262367200,
 * amenity=fountain + natural=water, ring radius ~4.5 m measured): a low round pale-stone basin, a stepped stone foot in
 * the middle, a tall tapering verdigris-bronze pylon (Art nouveau leaf ornament, the inscription "Il est gentil le mois
 * d'avril..."), and on top Roche's bronze girl with a flower hat (Modly: statues manifest `avril-fillette`).
 * Frame: x across, y up from the pavement (G), basin centred. Basin radius from OSM; the heights and the pylon's width
 * are by eye off Commons photos (Fontaine d'Avril - Galliera, Statue 01) against the Palais Galliera's plinth, not surveyed.
 */
export const HX = 4.7
export const HZ = 4.7

// tunables (metres)
const BASIN_R = 4.5, RIM_W = 0.4, RIM_H = 0.42
const FOOT_R = 1.0, FOOT_H = 0.5, FOOT2_R = 0.62, FOOT2_H = 0.35
const PYL_W0 = 0.5, PYL_W1 = 0.3, PYL_H = 2.3
const BOSS_W = 0.62, BOSS_H = 0.3 // the leafy collar under the statue's block
const CAP_W = 0.34, CAP_H = 0.16
export const STATUE_AT: [number, number, number] = [0, G + RIM_H - 0.12 + FOOT_H + FOOT2_H + PYL_H + BOSS_H + CAP_H, 0]

const STONE: Rgb = hex('#d9d5c8')
const WATER: Rgb = hex('#86a8ae')
const VERDI: Rgb = hex('#5f9a86')
const JET: Rgb = hex('#dfeaec')

function draw(q: MeshBuilder): void {
  const y0 = G
  roundBasin(q, 0, 0, y0, BASIN_R, { rim: RIM_W, depth: RIM_H, lip: 0.04, stone: STONE, water: WATER, sides: 40 })
  // the foot: two stone drums standing in the water
  let y = y0 + RIM_H - 0.12
  prism(q, 0, 0, y, y + FOOT_H, FOOT_R, 20, shade(STONE, 0.97), FIXED, FOOT_R * 0.8, true); y += FOOT_H
  prism(q, 0, 0, y, y + FOOT2_H, FOOT2_R, 16, STONE, FIXED, FOOT2_R * 0.85, true); y += FOOT2_H
  // the pylon: tapering square shaft, verdigris, with a darker ribbed band low down
  prism(q, 0, 0, y, y + PYL_H, PYL_W0 * 0.7, 4, VERDI, FIXED, PYL_W1 * 0.7, true, Math.PI / 4)
  prism(q, 0, 0, y, y + 0.35, PYL_W0 * 0.78, 4, shade(VERDI, 0.8), FIXED, PYL_W0 * 0.74, true, Math.PI / 4)
  y += PYL_H
  // leafy collar flaring under the statue's block
  prism(q, 0, 0, y, y + BOSS_H, PYL_W1 * 0.7, 4, shade(VERDI, 0.85), FIXED, BOSS_W * 0.7, true, Math.PI / 4); y += BOSS_H
  block(q, -CAP_W / 2, CAP_W / 2, -CAP_W / 2, CAP_W / 2, y, y + CAP_H, shade(STONE, 0.6))
  // the single central jet, a thin column of water
  prism(q, 0, 0, y0 + RIM_H - 0.1, y0 + RIM_H + 0.0, 0.01, 6, JET, FIXED, 0.01, true)
}

export function fontaineAvril(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
