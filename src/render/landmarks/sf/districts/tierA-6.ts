/**
 * San Francisco's individually modelled buildings: tierA-6 (docs/BUILDINGS.md). Mostly recipes from ../recipes.ts with
 * the colours and crown taken from a photograph; the shared parts (../../parts.ts) for anything more.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { fromRecipe } from '../recipes.ts'
import { tower, towerRing } from '../../tower.ts'
import { spireOn, colonnade, edgeAt } from '../../parts.ts'

export const TIERA_6: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /** Golden Gate Valley Branch Library (1918, Ernest Coxhead, Carnegie library): cream Classical Revival box, arched windows, red tile hip roof, a small entrance portico. */
  goldenGateValleyLibrary: (out: MeshBuilder, fit: Fit): void => {
    fromRecipe('edwardian-terracotta', { height: 9, base: 2, wall: [0.85, 0.81, 0.71], baseWall: [0.6, 0.52, 0.4], crown: { kind: 'hip', height: 3, inset: 0.5, colour: [0.55, 0.28, 0.22], material: 'tile' } })(out, fit)
    const ring = towerRing(fit)
    const e = edgeAt(ring, 0)
    colonnade(out, e.a, e.b, 0, 3.2, 4, { colour: [0.85, 0.81, 0.71] })
  },

  /** Haas-Lilienthal House (1886, Peter Schmidt, Queen Anne): lavender-grey wood siding, steep gables, a round corner turret with a witch's-hat roof. */
  haasLilienthalHouse: (out: MeshBuilder, fit: Fit): void => {
    tower(out, fit, {
      height: 12,
      tiers: [{ to: 1, face: { kind: 'punched', wall: [0.68, 0.66, 0.7], glass: [0.2, 0.22, 0.25], pitch: 2.6, solid: 0.55, floor: 3.4, material: 'clapboard' } }],
      roof: [0.4, 0.3, 0.28],
      crown: { kind: 'mansard', height: 3, inset: 0.6, colour: [0.4, 0.3, 0.28], material: 'tile' },
    })
    const ring = towerRing(fit)
    spireOn(out, ring[0], 12, 1.4, 3, 3.5, { colour: [0.68, 0.66, 0.7], spireColour: [0.4, 0.3, 0.28], sides: 8, belfry: false })
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
  fontanaEast: fromRecipe('hotel-punched', { height: 55, wall: [0.86, 0.85, 0.82], glass: [0.24, 0.27, 0.3], baseWall: [0.75, 0.74, 0.71] }),

  /** Twelve Hundred California (2022): a slender blue-green glass condo tower on Nob Hill, flat crown. */
  twelveHundredCalifornia: fromRecipe('glass-tower', { height: 88, wall: [0.6, 0.66, 0.7], glass: [0.32, 0.44, 0.5] }),

  /** Nob Hill Community Apartments: a 1970s stucco-and-punched-window residential slab, flat top. */
  nobHillCommunityApartments: fromRecipe('hotel-punched', { height: 74, wall: [0.78, 0.75, 0.68], glass: [0.25, 0.27, 0.3] }),

  /** Blu Condos: a 2000s blue-green curtain-wall condo tower, flat top. */
  bluCondos: fromRecipe('glass-tower', { height: 82, wall: [0.64, 0.68, 0.72], glass: [0.3, 0.42, 0.5] }),
}
