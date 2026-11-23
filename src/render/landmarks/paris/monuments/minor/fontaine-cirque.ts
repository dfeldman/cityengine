import type { MeshBuilder } from '../../../../buildings.ts'
import { prism, type Rgb } from '../../../../models.ts'
import { hex, lathe, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { FIXED } from '../common.ts'
import { G } from '../plaza-common.ts'
import { fountainBowl, jetRing, roundBasin } from './monument-kit.ts'

/*
 * LA FONTAINE DU CIRQUE ("des Quatre-Saisons", jardins des Champs-Élysées by the Carré Marigny; Hittorff and sculptor Barre,
 * cast iron by Calla, 1839, altered by Davioud 1863; Wikidata Q3076259; OSM way 67036988): the same body as its three sister
 * fountains (Diane, Ambassadeurs, Grille du Coq) — a wide low round stone basin, an octagonal cast-iron pedestal with dolphins,
 * a big bowl whose rim carries twelve lion-head mascarons spilling into the basin — and here four children (the Seasons:
 * wheat sheaf, grapes, a cloak, two doves) back to back holding up a smaller bowl with dog and wolf heads. The children
 * are a Modly model (statues manifest: cirque-saisons); the bowls, pedestal, mascarons and water are procedural.
 * Frame: x across, y up from the pavement (G), basin centred. Sizes by eye off Commons photos (people and a bench as scale,
 * OSM's water ring is only ~3 m radius but the photographed basin is ~8 m across): not surveyed.
 */
export const HX = 4.4
export const HZ = 4.4

// tunables (metres)
const BASIN_R = 4.15, RIM_W = 0.75, BASIN_H = 0.65
const PED_R = 0.85, PED_TOP = 1.3            // octagonal pedestal (circumradius), top above the basin floor
const BOWL_R = 2.1, BOWL_D = 1.15, BOWL_STEM = 0.75
const MASCARONS = 12
const DRUM_R = 0.6                           // the drum the children stand on, inside the big bowl
const GROUP_H = 1.5                          // the Modly group's height
const UP_R = 1.3, UP_D = 0.6, UP_STEM = 0.5, UP_HEADS = 8

const STONE: Rgb = hex('#c9c2ae')
const BOWL: Rgb = hex('#8f8c7e')
const IRON: Rgb = hex('#667060')
const WATER: Rgb = hex('#7a9aa2')
const JET: Rgb = hex('#dfeaec')
const MASK: Rgb = hex('#5a604f')

const yb = G + PED_TOP
const lowRim = yb + BOWL_D
const drumTop = lowRim - 0.08
const upBase = drumTop + GROUP_H - 0.12
/** where the group of children stands (landmark frame, y above the base): for the statues manifest */
export const GROUP_AT: [number, number, number] = [0, drumTop, 0]
const WATER_R = 0.93

function draw(q: MeshBuilder): void {
  roundBasin(q, 0, 0, G, BASIN_R, { rim: RIM_W, depth: BASIN_H, lip: 0.05, stone: STONE, water: WATER, sides: 48 })
  // octagonal pedestal: plinth, die, cornice, then a necked stem into the bowl
  const ph = G + 0.06
  prism(q, 0, 0, ph, ph + 0.3, PED_R * 1.12, 8, shade(IRON, 1.05), FIXED, PED_R * 1.12, true, Math.PI / 8)
  prism(q, 0, 0, ph + 0.3, G + PED_TOP - 0.18, PED_R, 8, IRON, FIXED, PED_R * 0.92, true, Math.PI / 8)
  prism(q, 0, 0, G + PED_TOP - 0.18, G + PED_TOP, PED_R * 1.06, 8, shade(IRON, 1.08), FIXED, PED_R * 1.06, true, Math.PI / 8)
  // four dolphins' curved tails: ribs at the die's alternate faces
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 8 * 0
    prism(q, Math.sin(a) * PED_R * 0.97, Math.cos(a) * PED_R * 0.97, ph + 0.4, G + PED_TOP - 0.3, 0.1, 6, shade(IRON, 0.85), FIXED, 0.08, true)
  }
  // the big lower bowl with its mascarons, spilling into the basin
  const rim = fountainBowl(q, 0, 0, yb, BOWL_R, { depth: BOWL_D, stem: BOWL_STEM, body: BOWL, water: WATER })
  for (let i = 0; i < MASCARONS; i++) {
    const a = (i / MASCARONS) * Math.PI * 2
    prism(q, Math.sin(a) * BOWL_R * 1.04, Math.cos(a) * BOWL_R * 1.04, rim - 0.32, rim - 0.06, 0.1, 6, MASK, FIXED, 0.08, true)
  }
  jetRing(q, 0, 0, MASCARONS, BOWL_R * 1.08, rim - 0.2, BOWL_R + 1.35, G + BASIN_H - 0.12, { rise: 0.18, c: JET, r: 0.02 })
  // the drum the four children stand on, in the bowl
  prism(q, 0, 0, rim - 0.4, drumTop, DRUM_R, 8, shade(IRON, 1.05), FIXED, DRUM_R * 0.92, true, Math.PI / 8)
  // the small upper bowl, its dog and wolf heads, the water down into the big bowl, a finial
  const upRim = fountainBowl(q, 0, 0, upBase, UP_R, { depth: UP_D, stem: UP_STEM, body: BOWL, water: WATER })
  for (let i = 0; i < UP_HEADS; i++) {
    const a = (i / UP_HEADS) * Math.PI * 2
    prism(q, Math.sin(a) * UP_R * 1.04, Math.cos(a) * UP_R * 1.04, upRim - 0.24, upRim - 0.04, 0.08, 6, MASK, FIXED, 0.06, true)
  }
  jetRing(q, 0, 0, UP_HEADS, UP_R * 1.06, upRim - 0.15, BOWL_R * WATER_R, rim - 0.1, { rise: 0.2, c: JET, r: 0.015, phase: Math.PI / UP_HEADS })
  lathe(q, 0, 0, [[0.14, upRim - 0.05], [0.08, upRim + 0.12], [0.1, upRim + 0.22], [0.04, upRim + 0.42], [0.0, upRim + 0.5]], 8, IRON)
}

export function fontaineCirque(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
