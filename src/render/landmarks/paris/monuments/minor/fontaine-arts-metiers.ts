import type { MeshBuilder } from '../../../../buildings.ts'
import { prism, type Rgb } from '../../../../models.ts'
import { beam, block, hex, lathe, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { basin, falls, G } from '../plaza-common.ts'
import { stadiumPlan } from './monument-kit.ts'

/*
 * THE FONTAINE DES ARTS ET MÉTIERS (square Émile-Chautemps, boulevard de Sébastopol facing the Conservatoire national des
 * arts et métiers, 3e; Gabriel Davioud 1860; Wikidata Q3076248): two parallel oblong Jura-stone basins, each with a stone
 * plinth in its middle carrying a round pedestal (lion-mascaron garlands, a cup and a small vasque with a jet) and two
 * seated bronze allegories back to back, one at each end of the plinth. North basin: l'Agriculture and le Travail
 * (Gumery); south basin: Mercure and Euterpe (Ottin). The four bronzes are Modly models (statues manifest: arts-metiers-*).
 * Frame: x along the basins' long axis, z across (north basin at +z), y up, pavement at G; the entry is turned 21 deg.
 * Basin plans from OSM ways 30612728 (north) and 30612729 (south): 20.4 x 6.6 m ovals, 27.7 m apart. Heights and the
 * plinth/pedestal sizes are scaled off Commons photographs against the figures (~1 m), not surveyed.
 */
export const HX = 11.5
export const HZ = 18

// tunables
export const BASIN_HL = 10.2       // half-length over all
export const BASIN_HW = 3.3        // half-width
export const BASIN_DZ = 13.85      // each basin's centre from the middle, across
const RIM = 0.42                   // coping width
const WALL_H = 0.4                 // wall above the pavement
const PLINTH_HX = 2.15             // half-length of the plinth
const PLINTH_HZ = 0.95             // half-width
const PLINTH_H = 0.75              // block, from the basin floor (G)
const LEDGE = 0.2                  // the cornice on top of it, which the figures sit on
const PED_R = 0.75                 // round pedestal's foot radius
const CUP_UP = 1.0                 // rim of its cup above the ledge
const VASQUE_UP = 1.55             // top of the little vasque above the ledge
const JET_H = 1.7
const FIG_X = 1.45                 // the figures' distance from the centre along x

const STONE: Rgb = hex('#d4cfc0')
const PLINTH: Rgb = hex('#c4bfae')
const BRONZE: Rgb = hex('#4f6b5c')
const WATER: Rgb = hex('#6f929c')
const FALL: Rgb = hex('#cfe0e3')

/** where the four bronzes stand: [north-basin −x, north +x, south −x, south +x] (landmark frame, y above the base) */
export const FIG_Y = G + PLINTH_H + LEDGE
export const FIGS: { at: [number, number, number]; tag: string }[] = [
  { at: [-FIG_X, FIG_Y, BASIN_DZ], tag: 'travail' },
  { at: [FIG_X, FIG_Y, BASIN_DZ], tag: 'agriculture' },
  { at: [-FIG_X, FIG_Y, -BASIN_DZ], tag: 'euterpe' },
  { at: [FIG_X, FIG_Y, -BASIN_DZ], tag: 'mercure' },
]

function one(q: MeshBuilder, cz: number): void {
  const plan = stadiumPlan(0, cz, BASIN_HL, BASIN_HW)
  const inner = stadiumPlan(0, cz, BASIN_HL - RIM, BASIN_HW - RIM)
  basin(q, plan, inner, 0, G + WALL_H, STONE, WATER)
  falls(q, inner, G + 0.05, G + WALL_H - 0.1, FALL)
  const y0 = G
  // the plinth: block, projecting cornice, then the stepped ledge the figures sit on
  block(q, -PLINTH_HX, PLINTH_HX, cz - PLINTH_HZ, cz + PLINTH_HZ, y0 - 0.1, y0 + PLINTH_H, PLINTH)
  block(q, -PLINTH_HX - 0.08, PLINTH_HX + 0.08, cz - PLINTH_HZ - 0.08, cz + PLINTH_HZ + 0.08, y0 + PLINTH_H, y0 + PLINTH_H + LEDGE, shade(PLINTH, 1.06))
  const yl = y0 + PLINTH_H + LEDGE
  // the round pedestal: a swelling foot, a neck with the mascaron band, a cup, a stem and the vasque
  lathe(q, 0, cz, [[PED_R + 0.1, yl], [PED_R, yl + 0.12], [PED_R * 0.75, yl + 0.4], [PED_R * 0.68, yl + 0.55], [PED_R * 0.8, yl + 0.8], [PED_R, yl + CUP_UP - 0.1], [PED_R * 1.05, yl + CUP_UP]], 20, STONE)
  prism(q, 0, cz, yl + CUP_UP - 0.04, yl + CUP_UP, PED_R * 0.95, 20, WATER, undefined, PED_R * 0.95, true)
  lathe(q, 0, cz, [[0.14, yl + CUP_UP], [0.1, yl + CUP_UP + 0.15], [0.22, yl + CUP_UP + 0.3], [0.3, yl + VASQUE_UP - 0.1], [0.34, yl + VASQUE_UP]], 12, shade(STONE, 0.95))
  // lion-mascaron heads (stone) on the neck, front and back, with the garlands either side
  for (const s of [-1, 1]) {
    prism(q, 0, cz + s * (PED_R * 0.78), yl + 0.55, yl + 0.8, 0.13, 6, shade(STONE, 0.85), undefined, 0.12, true)
    for (const g of [-1, 1]) beam(q, [g * 0.12, yl + 0.5, cz + s * PED_R * 0.76], [g * 0.5, yl + 0.35, cz + s * PED_R * 0.65], 0.05, BRONZE)
  }
  // the jet and the sheets from the cup into the basin
  beam(q, [0, yl + VASQUE_UP, cz], [0, yl + VASQUE_UP + JET_H, cz], 0.025, FALL)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.2
    beam(q, [Math.cos(a) * PED_R * 1.0, yl + CUP_UP - 0.1, cz + Math.sin(a) * PED_R], [Math.cos(a) * (PED_R + 0.55), y0 + 0.28, cz + Math.sin(a) * (PED_R + 0.55)], 0.03, FALL)
  }
}

function draw(q: MeshBuilder): void {
  one(q, BASIN_DZ)
  one(q, -BASIN_DZ)
}

export function fontaineArtsMetiers(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
