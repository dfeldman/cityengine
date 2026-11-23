import type { MeshBuilder } from '../../../../buildings.ts'
import { prism, type Rgb } from '../../../../models.ts'
import { block, hex, lathe, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { basin, falls, G, octagon } from '../plaza-common.ts'
import { fountainBowl, jetRing } from './monument-kit.ts'

/*
 * THE FONTAINE LOUVOIS (square Louvois, rue de Richelieu; Louis Visconti, sculptor Klagmann, cast iron by Calla, 1844;
 * Wikidata Q3076038): an octagonal basin; a square pedestal with a triton on a dolphin at each corner under a wide bowl
 * (zodiac signs between water-spitting mascarons round its rim); above the bowl a second, square pedestal inscribed with
 * the rivers' names and the four river goddesses (Seine, Loire, Saône, Garonne) back to back, holding up the top bowl and
 * its finial — the goddesses with the top bowl are a Modly model (statues manifest: louvois-group). The tritons likewise.
 * Frame: −z toward the rue de Richelieu's front (OSM's basin octagon has vertices near east, so the entry turns 25 deg),
 * y up from the base, pavement at G. Basin ~6.4 m circumradius from OSM way 26277959 (a sloppy polygon, ±1 m); the
 * bowls' and pedestals' sizes are scaled off Commons photographs against the 3.6 m goddess group, not surveyed.
 */
export const R = 7.1

// tunables
const BASIN_R = 6.0          // octagon, centre to flat
const BASIN_H = 0.55
const STEP = 0.2             // the kerb step outside the basin wall
const PED = 0.95             // half-width of the lower pedestal
const PED_Y = 2.0            // its height above the basin floor
const BOWL_R = 2.6
const BOWL_D = 1.05
const STEM_UP = 1.1          // the pillar above the bowl's rim, to the upper pedestal
const UPED = 0.7             // half-width of the upper pedestal
const UPED_H = 0.65
const MASCARONS = 16
const JETS = 10

const IRON: Rgb = hex('#a98a62')
const STONE: Rgb = hex('#c9c2b0')
const KERB: Rgb = hex('#b8b2a2')
const WATER: Rgb = hex('#6d93a0')
const FALL: Rgb = hex('#c4d8dc')
const MASK: Rgb = hex('#7d6444')

/** where the pieces stand (landmark frame, y above the base): for the statues manifest */
export const GROUP_AT: [number, number, number] = [0, G + 0.05 + PED_Y + BOWL_D + STEM_UP - 0.15 + UPED_H, 0]
export const TRITON_R = PED + 0.2

function draw(q: MeshBuilder): void {
  // the basin and its kerb step
  basin(q, octagon(BASIN_R + 0.55), octagon(BASIN_R + 0.15), 0, G + STEP, KERB, WATER)
  basin(q, octagon(BASIN_R), octagon(BASIN_R - 0.4), 0, G + BASIN_H, STONE, WATER)
  falls(q, octagon(BASIN_R), G + 0.1, G + BASIN_H - 0.05, FALL)
  const y0 = G + 0.05
  // the lower pedestal: a plinth, the die with a pilaster at each corner, a cornice under the bowl
  block(q, -PED - 0.25, PED + 0.25, -PED - 0.25, PED + 0.25, y0, y0 + 0.3, shade(STONE, 0.95))
  block(q, -PED, PED, -PED, PED, y0 + 0.3, y0 + PED_Y - 0.25, STONE)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) block(q, sx * PED - 0.12, sx * PED + 0.12, sz * PED - 0.12, sz * PED + 0.12, y0 + 0.3, y0 + PED_Y - 0.25, shade(STONE, 0.9))
  block(q, -PED - 0.15, PED + 0.15, -PED - 0.15, PED + 0.15, y0 + PED_Y - 0.25, y0 + PED_Y, shade(STONE, 1.05))
  // the wide bowl, its zodiac band and mascarons round the rim, jets from them into the basin
  const yb = y0 + PED_Y
  const rim = fountainBowl(q, 0, 0, yb, BOWL_R, { depth: BOWL_D, stem: PED * 0.8, body: IRON, water: WATER })
  for (let i = 0; i < MASCARONS; i++) {
    const a = (i / MASCARONS) * Math.PI * 2
    const m = i % 2 === 0
    prism(q, Math.sin(a) * (BOWL_R * 1.03), Math.cos(a) * (BOWL_R * 1.03), rim - 0.55, rim - 0.33, m ? 0.1 : 0.13, 6, m ? MASK : shade(IRON, 0.9), undefined, m ? 0.08 : 0.11, true)
  }
  jetRing(q, 0, 0, MASCARONS / 2, BOWL_R * 1.05, rim - 0.45, BOWL_R + 1.7, y0 + BASIN_H - 0.15, { rise: 0.3, c: FALL, phase: Math.PI / MASCARONS })
  // the pillar from the bowl up to the upper pedestal
  const yu = rim + STEM_UP - 0.15
  lathe(q, 0, 0, [[0.5, rim - 0.1], [0.42, rim + 0.3], [0.4, yu]], 12, shade(IRON, 0.95))
  block(q, -UPED, UPED, -UPED, UPED, yu, yu + UPED_H, STONE)
  block(q, -UPED - 0.1, UPED + 0.1, -UPED - 0.1, UPED + 0.1, yu, yu + 0.12, shade(STONE, 1.05))
  block(q, -UPED - 0.1, UPED + 0.1, -UPED - 0.1, UPED + 0.1, yu + UPED_H - 0.1, yu + UPED_H, shade(STONE, 1.05))
  // jets from the top bowl (the model's rim ~ 1 m out, 2.4 m over the pedestal) down into the wide bowl
  jetRing(q, 0, 0, JETS, 1.0, yu + UPED_H + 2.7, BOWL_R * 0.78, rim - 0.1, { rise: 0.35, c: FALL, phase: 0.1 })
}

export function fontaineLouvois(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, R, R, draw)
}
