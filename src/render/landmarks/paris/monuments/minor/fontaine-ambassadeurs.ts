import type { MeshBuilder } from '../../../../buildings.ts'
import { prism, type Rgb } from '../../../../models.ts'
import { block, hex, lathe, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { FIXED } from '../common.ts'
import { G } from '../plaza-common.ts'
import { fountainBowl, jetRing, roundBasin } from './monument-kit.ts'

/*
 * LA FONTAINE DES AMBASSADEURS (jardins des Champs-Élysées, 8e; Hittorff 1840, cast-iron bowl and bronze nymph; Wikidata
 * Q3076221; OSM way 67091995, amenity=fountain + natural=water, 5.6 m across): a low round stone basin, a square panelled
 * stone pedestal rising from the water, a cluster of reeds and masks, a wide shallow cast-iron bowl with mascarons round its
 * rim spilling sheets of water into the basin, and on a crown of reeds the bronze nymph (Modly: statues manifest
 * `ambassadeurs-nymphe`). Frame: x across, y up from the pavement (G), basin centred.
 * Only the basin width is measured (OSM); every height and the bowl/pedestal widths are by eye off Commons photos
 * (Fontaine des Ambassadeurs Paris 8e 001/003) against the basin wall (~0.75 m).
 */
export const HX = 3.2
export const HZ = 3.2

// tunables (metres)
const BASIN_R = 2.8, RIM_W = 0.42, WALL_H = 0.75
const PED_W = 1.1, PED_FOOT_H = 0.25, PED_H = 0.95, PED_TOP = 0.12, PED_Y0 = 0.15
const REED_H = 0.55, REED_R0 = 0.52, REED_R1 = 0.2
const BOWL_R = 1.55, BOWL_D = 0.5, BOWL_STEM = 0.3
const MASKS = 8, MASK_R = 0.11
const CROWN_H = 0.35, CROWN_R = 0.34
const JET_RISE = 0.18
export const STATUE_H = 1.9
export const STATUE_AT_Y = PED_Y0 + PED_FOOT_H + PED_H + PED_TOP + REED_H + BOWL_D + CROWN_H

const STONE: Rgb = hex('#cfc7b2')
const IRON: Rgb = hex('#5f6b5f')
const WATER: Rgb = hex('#7fa3ad')
const JET: Rgb = hex('#dfeaec')
const REED: Rgb = hex('#4f5b4a')

function draw(q: MeshBuilder): void {
  const y = (v: number): number => G + v
  roundBasin(q, 0, 0, y(0), BASIN_R, { rim: RIM_W, depth: WALL_H, lip: 0.05, stone: STONE, water: WATER, sides: 40 })
  // square panelled pedestal rising from the water
  let h = PED_Y0
  const w = PED_W
  block(q, -w * 0.62, w * 0.62, -w * 0.62, w * 0.62, y(h), y(h + PED_FOOT_H), shade(STONE, 0.92))
  h += PED_FOOT_H
  block(q, -w / 2, w / 2, -w / 2, w / 2, y(h), y(h + PED_H), STONE)
  // a shallow panel on each face
  const pw = w * 0.34, ph = PED_H * 0.3, py = h + PED_H * 0.35, pf = w / 2 + 0.02
  const panel = shade(STONE, 0.84)
  block(q, -pw, pw, -pf, -w / 2, y(py), y(py + ph), panel)
  block(q, -pw, pw, w / 2, pf, y(py), y(py + ph), panel)
  block(q, -pf, -w / 2, -pw, pw, y(py), y(py + ph), panel)
  block(q, w / 2, pf, -pw, pw, y(py), y(py + ph), panel)
  h += PED_H
  block(q, -w * 0.58, w * 0.58, -w * 0.58, w * 0.58, y(h), y(h + PED_TOP), shade(STONE, 1.04))
  h += PED_TOP
  // reeds and masks cluster, narrowing up into the bowl's stem
  lathe(q, 0, 0, [[REED_R0, y(h)], [REED_R0 * 0.9, y(h + REED_H * 0.3)], [REED_R1 * 1.3, y(h + REED_H * 0.7)], [REED_R1, y(h + REED_H)]], 20, REED)
  h += REED_H
  // the wide shallow cast-iron bowl
  const top = fountainBowl(q, 0, 0, y(h), BOWL_R, { depth: BOWL_D, stem: BOWL_STEM, drop: 0.08, body: IRON, water: WATER })
  // mascarons round the rim, and a sheet of water from each into the basin
  for (let i = 0; i < MASKS; i++) {
    const a = ((i + 0.5) / MASKS) * Math.PI * 2, r = BOWL_R * 1.04
    prism(q, Math.sin(a) * r, Math.cos(a) * r, top - 0.28, top - 0.28 + MASK_R * 1.6, MASK_R, 8, shade(IRON, 1.12), FIXED, MASK_R, true)
  }
  jetRing(q, 0, 0, MASKS * 2, BOWL_R * 1.04, top - 0.2, BOWL_R + 0.75, y(WALL_H - 0.12), { rise: JET_RISE, r: 0.018, c: JET, phase: 0.2 })
  // crown of reeds the nymph stands on
  lathe(q, 0, 0, [[BOWL_R * 0.3, top], [CROWN_R, top + CROWN_H * 0.4], [CROWN_R * 0.7, top + CROWN_H]], 14, REED)
}

export function fontaineAmbassadeurs(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
