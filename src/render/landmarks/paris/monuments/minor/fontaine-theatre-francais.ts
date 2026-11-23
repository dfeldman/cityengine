import type { MeshBuilder } from '../../../../buildings.ts'
import { prism, type Rgb } from '../../../../models.ts'
import { hex, lathe, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { FIXED } from '../common.ts'
import { G } from '../plaza-common.ts'
import { fountainBowl, jetRing, roundBasin, steppedBase } from './monument-kit.ts'

/*
 * LES DEUX FONTAINES DU THÉÂTRE-FRANÇAIS (place André-Malraux, 1er; Davioud 1872-74; the Nymphe marine, Q28861346 / Q3076333,
 * OSM way 664173645, and the Nymphe fluviale, Q28861345, OSM way 664173647, each amenity=fountain + natural=water, ~11.3 m
 * across, 42 m apart): the two are the same design, so one drawing serves both. A wide low round basin; at its centre a drum
 * with four seated bronze putti (Eude on the marine one, Gauthier on the fluviale; Modly), a tapering pier, a wide shallow
 * lower bowl, a column with a collar and medallions, an upper small bowl on lion masks that spit into the lower one, and
 * on its cap the bronze nymph (Carrier-Belleuse's Nymphe marine with an oar, Moreau's winged Nymphe fluviale with a reed;
 * Modly). Frame: x across, y up from the pavement (G), basin centred. Measured: the basin width (OSM). Every height and the
 * bowl/column widths are by eye off Commons photos (Fontaine Nymphe Marine 2026-08-12 1/2, Nymphe Fluviale Paris 2/5/9).
 */
export const HX = 5.7
export const HZ = 5.7

// tunables (metres above the pavement)
const BASIN_R = 5.55, RIM_W = 0.6, WALL_H = 0.62
const DRUM_R = 1.75, DRUM_H = 0.95            // the drum the putti sit on
const PIER_R0 = 1.1, PIER_R1 = 0.8, PIER_TOP = 2.55
const BOWL_R = 3.0, BOWL_D = 0.85, BOWL_STEM = 0.8
const COLLAR_R = 0.7, SHAFT_R = 0.4, SHAFT_TOP = 6.0
const UP_R = 1.15, UP_D = 0.55
const MASKS = 8
export const STATUE_H = 2.3
export const PUTTI_AT = DRUM_H                 // seat height, relative to the pavement

const STONE: Rgb = hex('#b7b0a0')
const BOWL: Rgb = hex('#8d8a7e')
const WATER: Rgb = hex('#7fa3ad')
const JET: Rgb = hex('#dfeaec')
const BRONZE: Rgb = hex('#4d5a4c')

/** the nymph's plinth: top of the cap, above the pavement (the statues manifest's `at` y) */
export const STATUE_AT: [number, number, number] = [0, SHAFT_TOP + UP_D + 0.35, 0]

function draw(q: MeshBuilder): void {
  const y = (v: number): number => G + v
  roundBasin(q, 0, 0, y(0), BASIN_R, { rim: RIM_W, depth: WALL_H, lip: 0.05, stone: STONE, water: WATER, sides: 56 })
  // the drum under the putti: two courses and a cornice
  steppedBase(q, 0, 0, y(0.3), [[DRUM_R + 0.15, 0.1], [DRUM_R, DRUM_H - 0.5], [DRUM_R + 0.1, 0.1]], STONE, true)
  // the pier: a tapering body with a collar into the bowl's stem
  lathe(q, 0, 0, [[PIER_R0, y(DRUM_H)], [PIER_R0 * 1.05, y(DRUM_H + 0.15)], [PIER_R1, y(DRUM_H + 0.45)], [PIER_R1 * 0.95, y(PIER_TOP - 0.25)], [PIER_R1 * 1.2, y(PIER_TOP)]], 28, STONE)
  // lower bowl: wide, shallow, ribbed underneath
  const lowRim = fountainBowl(q, 0, 0, y(PIER_TOP), BOWL_R, { depth: BOWL_D, stem: BOWL_STEM, drop: 0.12, sides: 48, body: BOWL, water: WATER })
  // collar rising from the bowl's water, then the shaft with its rings and medallions
  lathe(q, 0, 0, [[COLLAR_R * 0.85, lowRim - 0.1], [COLLAR_R, lowRim + 0.15], [COLLAR_R * 0.8, lowRim + 0.55], [SHAFT_R * 1.25, lowRim + 0.75], [SHAFT_R, lowRim + 0.9]], 24, STONE)
  const shaftY0 = lowRim + 0.9
  prism(q, 0, 0, shaftY0, y(SHAFT_TOP), SHAFT_R, 20, STONE, FIXED, SHAFT_R, true)
  for (const yy of [shaftY0 + 0.1, y(SHAFT_TOP) - 0.1]) prism(q, 0, 0, yy, yy + 0.12, SHAFT_R * 1.18, 20, shade(STONE, 1.06), FIXED, SHAFT_R * 1.18, true)
  // medallions on the shaft, on each of the four faces
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4, s = Math.sin(a), c = Math.cos(a)
    for (const dy of [0.45, 0.95]) prism(q, s * (SHAFT_R + 0.01), c * (SHAFT_R + 0.01), shaftY0 + 0.7 + dy * 2.4, shaftY0 + 0.7 + dy * 2.4 + 0.3, 0.15, 10, shade(STONE, 0.82), FIXED, 0.15, true)
  }
  // upper bowl on its lion masks
  const upRim = fountainBowl(q, 0, 0, y(SHAFT_TOP), UP_R, { depth: UP_D, stem: SHAFT_R * 0.9, drop: 0.1, sides: 36, body: BOWL, water: WATER })
  for (let i = 0; i < MASKS; i++) {
    const a = (i / MASKS) * Math.PI * 2, s = Math.sin(a), c = Math.cos(a)
    prism(q, s * (SHAFT_R + 0.28), c * (SHAFT_R + 0.28), y(SHAFT_TOP) - 0.22, y(SHAFT_TOP) + 0.08, 0.1, 6, shade(BRONZE, 1.1), FIXED, 0.09, true)
  }
  // the cap the nymph stands on
  lathe(q, 0, 0, [[0.2, upRim - 0.1], [0.42, upRim], [0.3, upRim + 0.15], [0.36, upRim + 0.3], [0.3, upRim + 0.35]], 16, STONE)
  // water: the masks spit into the lower bowl, the upper bowl spills, the lower bowl falls into the basin
  jetRing(q, 0, 0, MASKS, SHAFT_R + 0.35, y(SHAFT_TOP) - 0.1, 2.1, lowRim - 0.05, { rise: 0.35, r: 0.03, c: JET })
  jetRing(q, 0, 0, 20, UP_R, upRim - 0.06, UP_R + 0.2, y(SHAFT_TOP) - 0.05, { rise: 0.04, r: 0.02, c: JET, phase: 0.1 })
  jetRing(q, 0, 0, 72, BOWL_R, lowRim - 0.04, BOWL_R + 0.55, y(WALL_H) - 0.05, { rise: 0.1, r: 0.02, c: JET })
}

function fontaine(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}

/** the Nymphe marine fountain (Carrier-Belleuse's nymph with an oar), place André-Malraux at the Faubourg-Saint-Honoré end */
export function fontaineTheatreFrancaisMarine(out: MeshBuilder, fit: Fit): void { fontaine(out, fit) }
/** the Nymphe fluviale fountain (Moreau's winged nymph with a reed), at the rue de Richelieu end: the same drawing */
export function fontaineTheatreFrancaisFluviale(out: MeshBuilder, fit: Fit): void { fontaine(out, fit) }
