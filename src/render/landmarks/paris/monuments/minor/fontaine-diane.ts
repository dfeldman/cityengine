import type { MeshBuilder } from '../../../../buildings.ts'
import { hex } from '../../../kit.ts'
import type { Rgb } from '../../../../models.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { G } from '../plaza-common.ts'
import { hittorffFountain } from './monument-kit.ts'

/*
 * LA FONTAINE DE DIANE (also "fontaine Ledoyen"; jardin des Champs-Élysées beside the Pavillon Ledoyen, 8e; Jacques Hittorff 1840,
 * Diane chasseresse by Louis Desprez; Wikidata Q3076128; OSM way 1136105125, amenity=fountain + natural=water, ring radius ~3.0 m):
 * one of Hittorff's four sister fountains here (Diane, Cirque, Ambassadeurs, Grille du Coq): a low round pale-stone basin, an
 * octagonal cast-metal pedestal with a shell panel on each face, a foliage neck with four dolphins, a wide shallow vasque with
 * twelve lion-mask lugs and a thin ring of falls, and on a tuft of reeds the standing Diane (Modly: statues manifest `diane-diane`).
 * Frame: x across, y up from the pavement (G), the basin centred. Basin from OSM; every other size is by eye off Commons photos
 * ("Fontaine de Diane Paris 8e 001–003") against the basin (~6 m across): not surveyed.
 */
export const HX = 3.2
export const HZ = 3.2

// tunables (metres)
const BASIN_R = 3.0
const WALL = 0.75
const PED_W = 1.35, PED_H = 0.85, NECK_H = 0.95
const VASQUE_R = 1.85, VASQUE_D = 0.6
export const STATUE_H = 1.8

const STONE: Rgb = hex('#b9b3a2')
const METAL: Rgb = hex('#8f938a')
const WATER: Rgb = hex('#6f9096')
const JET: Rgb = hex('#dfeaec')

function draw(q: MeshBuilder): void {
  hittorffFountain(q, 0, 0, G, { basinR: BASIN_R, wall: WALL, pedW: PED_W, pedH: PED_H, neckH: NECK_H, vasqueR: VASQUE_R, vasqueDepth: VASQUE_D, stone: STONE, metal: METAL, water: WATER, jet: JET })
}

export function fontaineDiane(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
