import type { MeshBuilder } from '../../../../buildings.ts'
import { type Rgb } from '../../../../models.ts'
import { archedPane, block, hex, lathe, pane, roof, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { G } from '../plaza-common.ts'

/*
 * THE REGARD DE LA PRISE DES EAUX DU PRÉ-SAINT-GERVAIS (place Anatole-France / rue André-Joineau, Le Pré-Saint-Gervais, 93;
 * Wikidata Q3076279 "fontaine du Pré-Saint-Gervais"; monument historique inscrit 1899, Mérimée PA00079946): the stone
 * inspection house of the old Pré-Saint-Gervais aqueduct, with a public fountain in its front. A square stone body of ashlar
 * courses under a low hipped tile roof; in front a lower porch with a moulded cornice carrying a pine-cone finial, and in
 * the porch an arched niche with the spout over a sill; above, a recessed blank tablet. Frame: −z the front (it faces west,
 * to the rue André-Joineau), x across, y up, pavement at G. Footprint from OSM way 73248961 (building, claimed): 3.3 m across
 * the front, 4.3 m deep (osmium, 2026-11-23). Heights read off the Commons photograph "Regard de la fontaine du Pré-Saint-
 * Gervais.jpg" against the bollards (~80 px/m): about 5.0 m to the eaves, 5.7 m to the roof top, porch cornice ~2.6 m;
 * estimates, not surveyed. No sculpture on it (the finial is a lathe).
 */
export const HX = 1.65
export const HZ = 2.15

// tunables
const BODY_Z0 = -1.55         // front face of the body (the porch projects in front of it)
const EAVES = 5.0
const ROOF_H = 0.7
const ROOF_OUT = 0.18
const ROOF_INSET = 1.0        // the hip's inset, front/back and sides: a low pyramid with a small flat top
const PLINTH_H = 0.35
const PLINTH_OUT = 0.07
const COURSE = 0.45           // an ashlar course
const PORCH_HX = 0.95         // half-width of the porch
const PORCH_H = 2.45          // to the cornice
const CORN_H = 0.22
const CORN_OUT = 0.1
const NICHE_W = 1.15
const NICHE_H = 1.85
const NICHE_Y = 0.3
const TABLET_W = 0.8
const TABLET_Y = 3.15
const TABLET_H = 1.15
const SPOUT_Y = 0.85

const STONE: Rgb = hex('#bfb18f')
const PALE: Rgb = hex('#cbbf9f')
const DARKER: Rgb = hex('#a39673')
const TILE: Rgb = hex('#4d4742')
const SHADOW: Rgb = hex('#6f6755')
const IRON: Rgb = hex('#3a3a38')
const WATER: Rgb = hex('#a9c3cb')

function draw(q: MeshBuilder): void {
  const y = (v: number): number => G + v
  const pz0 = BODY_Z0 - 0.6         // porch front face
  // plinth and body
  block(q, -HX - PLINTH_OUT, HX + PLINTH_OUT, -HZ - PLINTH_OUT, HZ + PLINTH_OUT, y(0), y(PLINTH_H), DARKER)
  block(q, -HX, HX, BODY_Z0, HZ, y(PLINTH_H), y(EAVES), STONE)
  // ashlar course lines, thin proud bands on the three faces of the body
  for (let h = PLINTH_H + COURSE; h < EAVES - 0.1; h += COURSE) {
    block(q, -HX - 0.015, HX + 0.015, BODY_Z0 - 0.015, HZ + 0.015, y(h), y(h) + 0.035, shade(STONE, 0.9))
  }
  // porch
  block(q, -PORCH_HX, PORCH_HX, pz0, BODY_Z0, y(PLINTH_H), y(PORCH_H), PALE)
  for (let h = PLINTH_H + COURSE; h < PORCH_H - 0.1; h += COURSE) {
    block(q, -PORCH_HX - 0.015, PORCH_HX + 0.015, pz0 - 0.015, BODY_Z0, y(h), y(h) + 0.035, shade(PALE, 0.9))
  }
  block(q, -PORCH_HX - PLINTH_OUT, PORCH_HX + PLINTH_OUT, pz0 - PLINTH_OUT, BODY_Z0, y(0), y(PLINTH_H), DARKER)
  // porch cornice, with a cap and the finial
  block(q, -PORCH_HX - CORN_OUT, PORCH_HX + CORN_OUT, pz0 - CORN_OUT, BODY_Z0, y(PORCH_H), y(PORCH_H + CORN_H), shade(PALE, 1.04))
  block(q, -PORCH_HX - CORN_OUT * 0.4, PORCH_HX + CORN_OUT * 0.4, pz0 - CORN_OUT * 0.4, BODY_Z0, y(PORCH_H + CORN_H), y(PORCH_H + CORN_H + 0.1), PALE)
  const cz = pz0 + 0.3
  lathe(q, 0, cz, [[0.1, y(PORCH_H + CORN_H + 0.1)], [0.16, y(PORCH_H + CORN_H + 0.2)], [0.14, y(PORCH_H + CORN_H + 0.36)], [0.06, y(PORCH_H + CORN_H + 0.5)], [0.0, y(PORCH_H + CORN_H + 0.54)]], 10, PALE)
  // the niche: a dark arched recess in the porch front, an iron spout, a sill and the falling water
  archedPane(q, pz0, 0, y(NICHE_Y), NICHE_W, NICHE_H, shade(SHADOW, 0.8))
  block(q, -NICHE_W / 2 - 0.06, NICHE_W / 2 + 0.06, pz0 - 0.1, pz0, y(NICHE_Y) - 0.12, y(NICHE_Y), PALE)   // sill/basin lip
  block(q, -0.04, 0.04, pz0 - 0.16, pz0 - 0.04, y(SPOUT_Y), y(SPOUT_Y) + 0.07, IRON)
  pane(q, '-z', pz0, 0, y(NICHE_Y), 0.07, SPOUT_Y - NICHE_Y, WATER, 0.07)
  // the tablet over the porch: a recessed blank panel with a round head
  archedPane(q, BODY_Z0, 0, y(TABLET_Y), TABLET_W, TABLET_H, shade(STONE, 0.78))
  // eaves cornice and the low hipped roof
  block(q, -HX - 0.08, HX + 0.08, BODY_Z0 - 0.08, HZ + 0.08, y(EAVES - 0.2), y(EAVES), shade(STONE, 1.05))
  roof(q, -HX - ROOF_OUT, HX + ROOF_OUT, BODY_Z0 - ROOF_OUT, HZ + ROOF_OUT, y(EAVES), ROOF_H, ROOF_INSET, ROOF_INSET, TILE)
}

export function fontainePreSaintGervais(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
