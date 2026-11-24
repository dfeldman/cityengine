import type { MeshBuilder } from '../../../../buildings.ts'
import type { Rgb } from '../../../../models.ts'
import { block, hex, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { G } from '../plaza-common.ts'

/*
 * LE MONUMENT A LA GLOIRE DE L'EXPANSION COLONIALE FRANCAISE (Jardin d'agronomie tropicale, Paris 12e; Wikidata
 * Q20055095; Jean-Baptiste Belloc, 1913-22): taken down in 1961 and now NOT a monument but five weathered stone pieces
 * lying in an arc on the gravel near the garden's entrance, among shrubs: the seated Republic group, a Gallic cockerel on a
 * globe among trophies, a standing draped woman, a reclining fragment and a fifth piece. The pieces are the Modly models
 * `coloniale-*` (attached in paris-statues.json at PIECES); this builder lays the broken-socle slabs they rest on. Positions
 * are the five OSM artwork nodes (fragments), frame centred on their centroid, x east, z north. Slab sizes are guessed.
 */
export const HX = 7.0
export const HZ = 7.0

/** [id, x, z, slab half-width, slab half-depth, slab height] per piece (metres, frame centred on the centroid). */
export const PIECES: Record<string, [number, number, number, number, number]> = {
  republique: [-4.9, 3.3, 1.0, 0.8, 0.14],
  coq: [-1.6, 4.4, 0.85, 0.75, 0.12],
  femme: [1.7, 1.1, 0.8, 0.7, 0.12],
  couchee: [3.5, -2.8, 1.6, 0.7, 0.1],
}
export const SLAB_TOP = 0.14

const SLAB: Rgb = hex('#7e796e')
const DARK: Rgb = hex('#5b574f')

function draw(q: MeshBuilder): void {
  for (const [x, z, hw, hd, h] of Object.values(PIECES)) {
    block(q, x - hw, x + hw, z - hd, z + hd, G, G + h, SLAB)
    block(q, x - hw * 0.9, x + hw * 0.7, z - hd * 0.8, z + hd * 0.9, G + h, G + h + 0.04, shade(DARK, 1.1))
  }
}

export function monumentExpansionColoniale(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
