/**
 * San Francisco's individually modelled buildings: tierA-6 (docs/BUILDINGS.md). Mostly recipes from ../recipes.ts with
 * the colours and crown taken from a photograph; the shared parts (../../parts.ts) for anything more.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { fromRecipe } from '../recipes.ts'
import { towerRing } from '../../tower.ts'
import { colonnade, edgeAt, offsetRing } from '../../parts.ts'
import { capPolygon } from '../../../buildings.ts'
import { faceBand, insetRing } from '../../tower.ts'

const FONTANA_WHITE: [number, number, number] = [0.9, 0.89, 0.86]

function fontanaTower(out: MeshBuilder, fit: Fit): void {
  const ring = towerRing(fit)
  const H = 55, LOBBY = 4.6, FLOOR = (H - 2.4 - LOBBY) / 17
  const glass: [number, number, number] = [0.3, 0.36, 0.41]
  // a glazed lobby set under the first balcony
  faceBand(out, ring, 0, LOBBY, { kind: 'curtain', wall: [0.8, 0.79, 0.76], glass, pitch: 2.4, material: 'concrete' })
  // the floors: glass between thin white slab edges
  faceBand(out, ring, LOBBY, H - 2.4, { kind: 'bands', wall: FONTANA_WHITE, glass, floor: FLOOR, solid: 0.38, material: 'concrete' })
  // a balcony slab round every floor, and its rail
  const lip = offsetRing(ring, 1.5)
  const railRing = offsetRing(ring, 1.42)
  for (let k = 0; k <= 17; k++) {
    const y = LOBBY + k * FLOOR
    faceBand(out, lip, y - 0.45, y, { kind: 'blank', wall: FONTANA_WHITE, material: 'concrete' })
    capPolygon(out, lip, y, [0.82, 0.81, 0.78], 0)
    if (k < 17) faceBand(out, railRing, y + 0.9, y + 1.08, { kind: 'blank', wall: [0.95, 0.95, 0.93], material: 'metal' })
  }
  // a plain parapet and the lift and plant house on the roof
  faceBand(out, ring, H - 2.4, H, { kind: 'blank', wall: FONTANA_WHITE, material: 'concrete' })
  capPolygon(out, ring, H, [0.7, 0.7, 0.68], 0)
  const plant = insetRing(ring, 6)
  faceBand(out, plant, H, H + 3.5, { kind: 'blank', wall: [0.84, 0.83, 0.8], material: 'concrete' })
  capPolygon(out, plant, H + 3.5, [0.66, 0.66, 0.64], 0)
}

export const TIERA_6: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /** Golden Gate Valley Branch Library (1918, Ernest Coxhead, Carnegie library): cream Classical Revival box, arched windows, red tile hip roof, a small entrance portico. */
  goldenGateValleyLibrary: (out: MeshBuilder, fit: Fit): void => {
    fromRecipe('edwardian-terracotta', { height: 9, base: 2, wall: [0.85, 0.81, 0.71], baseWall: [0.6, 0.52, 0.4], crown: { kind: 'hip', height: 3, inset: 0.5, colour: [0.55, 0.28, 0.22], material: 'tile' } })(out, fit)
    const ring = towerRing(fit)
    const e = edgeAt(ring, 0)
    colonnade(out, e.a, e.b, 0, 3.2, 4, { colour: [0.85, 0.81, 0.71] })
  },

  /** 1051 3rd Street (Muni/rail substation, roof=pyramidal): a plain brick box under a pyramidal roof. */
  thirdStreetSubstation: fromRecipe('brick-loft', { height: 7, base: 0, wall: [0.5, 0.32, 0.27], crown: { kind: 'pyramid', height: 3, colour: [0.35, 0.32, 0.3], material: 'tile' } }),

  /**
   * Fairmont Hotel Tower, 950 Mason St (1961, Mario Gaidano): the 23-storey cream-concrete slab raised behind
   * the 1907 Fairmont on Nob Hill — a modern addition to the hotel, not the hotel itself; way/436477702 is the
   * tower's own OSM outline (`building:part=yes`, no `building=*`), separate from the Edwardian block's, and
   * binds to its own footprint. Punched windows in even ranks, a plain flat top, a flagpole from the photograph.
   */
  fairmontHotelTower: fromRecipe('hotel-punched', {
    height: 108,
    wall: [0.86, 0.85, 0.8],
    glass: [0.22, 0.24, 0.27],
    solid: 0.5,
    base: 4,
    baseWall: [0.3, 0.29, 0.28],
    crown: { kind: 'mast', height: 6, width: 0.15, colour: [0.85, 0.85, 0.85] },
  }),

  /** Unnamed 83 m tower (way/288645261), no name or use on record: a plain pale mid-century slab, generic by height. */
  unnamedEightyThreeMeterTower: fromRecipe('midcentury-slab', { height: 83, wall: [0.8, 0.79, 0.76], glass: [0.28, 0.32, 0.36] }),

  /** Fontana East (1963-64): one of the twin white concrete slabs at Aquatic Park whose bulk got SF its 40-ft waterfront height limit; punched windows, flat top. */
  /**
   * The FONTANA TOWERS (1963-64), the twin curved slabs at Aquatic Park whose bulk brought in the waterfront's 40-ft
   * height limit: white concrete, a balcony slab wrapping each of the eighteen floors, floor-to-ceiling glass behind.
   * The two are identical (owner, 2026-10-17: "these two semicircular towers are in fact identical in real life, we
   * show one of the two as a generic building") — East was a punched-window recipe, West a haiku 'chicago' reface in
   * brown; both now this one builder, each on its own footprint.
   */
  fontanaEast: (out: MeshBuilder, fit: Fit): void => fontanaTower(out, fit),
  fontanaWest: (out: MeshBuilder, fit: Fit): void => fontanaTower(out, fit),

  /** Twelve Hundred California (2022): a slender blue-green glass condo tower on Nob Hill, flat crown. */
  twelveHundredCalifornia: fromRecipe('glass-tower', { height: 88, wall: [0.6, 0.66, 0.7], glass: [0.32, 0.44, 0.5] }),

  /** Nob Hill Community Apartments: a 1970s stucco-and-punched-window residential slab, flat top. */
  nobHillCommunityApartments: fromRecipe('hotel-punched', { height: 74, wall: [0.78, 0.75, 0.68], glass: [0.25, 0.27, 0.3] }),

  /** Blu Condos: a 2000s blue-green curtain-wall condo tower, flat top. */
  bluCondos: fromRecipe('glass-tower', { height: 82, wall: [0.64, 0.68, 0.72], glass: [0.3, 0.42, 0.5] }),
}
