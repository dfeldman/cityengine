import type { MeshBuilder } from '../../../../buildings.ts'
import { type Rgb } from '../../../../models.ts'
import { block, hex, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { basin, circle, falls, G } from '../plaza-common.ts'

/*
 * THE FONTAINE DU SQUARE TOLSTOÏ (square Tolstoï, boulevard Suchet, 16e; the square laid out 1934; Wikidata Q3076299):
 * "three hexagonal basins nested like Russian dolls" (fr.wikipedia), light limestone, under Charles Georges Cassou's marble
 * Femme et enfant of 1934 (a Modly model: statues manifest tolstoi-femme-enfant). Wikidata/OSM give only a point
 * (OSM node 6943355178), no basin outline. Sizes are estimated by eye off Commons photos (Fontaine du square Tolstoï,
 * Paris 16e 2 and 3) against the ~1.9 m figure: not surveyed. Frame: the plan is a regular hexagon with vertices on ±x;
 * the figure faces −z (the manifest's `front` turns that toward the square). Pavement at G.
 */
// tunables: hexagon circumradius, rim height above the pavement, wall width
const R0 = 3.5, H0 = 0.4, W0 = 0.4      // outer basin
const R1 = 1.75, H1 = 0.95, W1 = 0.3     // middle basin
const R2 = 0.95, H2 = 1.3, W2 = 0.25     // top basin
const PED = 0.6, PED_H = 0.3             // the pedestal block the figure stands on
const APOTHEM = Math.sqrt(3) / 2
export const HX = R0
export const HZ = R0 * APOTHEM
/** Where the figure's feet go (landmark frame): for the statues manifest */
export const FIGURE_AT: [number, number, number] = [0, G + H2 + PED_H, 0]

const STONE: Rgb = hex('#d9d3c2')
const WATER: Rgb = hex('#6f8f93')
const FALL: Rgb = hex('#c4d8dc')
const FALLS_ON = true

function draw(q: MeshBuilder): void {
  const hexa = (r: number) => circle(r, 6)
  basin(q, hexa(R0), hexa(R0 - W0), G, G + H0, STONE, WATER)
  basin(q, hexa(R1), hexa(R1 - W1), G, G + H1, shade(STONE, 1.02), WATER)
  basin(q, hexa(R2), hexa(R2 - W2), G, G + H2, shade(STONE, 1.04), WATER)
  if (FALLS_ON) {
    falls(q, hexa(R2), G + H1, G + H2 - 0.07, FALL)
    falls(q, hexa(R1), G + H0, G + H1 - 0.07, FALL)
  }
  block(q, -PED / 2, PED / 2, -PED / 2, PED / 2, G + H2 - 0.07, G + H2 + PED_H, shade(STONE, 0.97))
}

export function fontaineSquareTolstoi(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
