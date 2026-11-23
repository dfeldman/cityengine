import type { MeshBuilder } from '../../../../buildings.ts'
import { hex } from '../../../kit.ts'
import type { Rgb } from '../../../../models.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { G } from '../plaza-common.ts'
import { hittorffFountain } from './monument-kit.ts'

/*
 * LA FONTAINE DE LA GRILLE DU COQ (jardins des Champs-Élysées, 8e, facing the Grille du Coq of the Élysée garden; Hittorff 1840;
 * Wikidata Q3076190; OSM way 67092064, amenity=fountain + natural=water, ring radius ~3.0 m; NOT the Ambassadeurs fountain, whose
 * point the Wikidata/frwiki coordinates copy): the fourth sister (Diane, Cirque, Ambassadeurs), and the only one with no
 * sculpture: basin, octagonal metal pedestal with shell panels, foliage neck with four dolphins, wide vasque with twelve lion
 * masks, one plain jet from the middle (kit hittorffFountain, jetH). Frame: x across, y up from G. Basin from OSM; the rest is
 * the sisters' proportions by eye (frwiki text), not surveyed. No Modly piece: nothing sculptural to make.
 */
export const HX = 3.2
export const HZ = 3.2

// tunables (metres)
const BASIN_R = 3.0
const WALL = 0.75
const PED_W = 1.35, PED_H = 0.85, NECK_H = 0.95
const VASQUE_R = 1.85, VASQUE_D = 0.6
const JET_H = 1.3

const STONE: Rgb = hex('#b9b3a2')
const METAL: Rgb = hex('#8f938a')
const WATER: Rgb = hex('#6f9096')
const JET: Rgb = hex('#dfeaec')

function draw(q: MeshBuilder): void {
  hittorffFountain(q, 0, 0, G, { basinR: BASIN_R, wall: WALL, pedW: PED_W, pedH: PED_H, neckH: NECK_H, vasqueR: VASQUE_R, vasqueDepth: VASQUE_D, jetH: JET_H, stone: STONE, metal: METAL, water: WATER, jet: JET })
}

export function fontaineGrilleCoq(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
