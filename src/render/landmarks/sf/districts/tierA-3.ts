/**
 * San Francisco's individually modelled buildings: tierA-3 (docs/BUILDINGS.md). Mostly recipes from ../recipes.ts with
 * the colours and crown taken from a photograph; the shared parts (../../parts.ts) for anything more.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { fromRecipe } from '../recipes.ts'
import { tower, towerRing } from '../../tower.ts'
import { cupola } from '../../parts.ts'

export const TIERA_3: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /** St Mary the Virgin Episcopal Church (1891, Cow Hollow): rustic brown wood-shingle Arts & Crafts, a hip roof. */
  stMaryTheVirginEpiscopalChurch: fromRecipe('brick-loft', {
    height: 8,
    wall: [0.42, 0.32, 0.22],
    material: 'stucco',
    crown: { kind: 'hip', height: 3, inset: 2, colour: [0.3, 0.22, 0.18] },
  }),

  /** Buddhist Church of San Francisco (1935, Pine Street): cream terracotta over a steel frame, a gilded stupa on the roof. */
  buddhistChurchOfSanFrancisco: (out: MeshBuilder, fit: Fit): void => {
    tower(out, fit, {
      height: 12,
      base: { height: 4, face: { kind: 'curtain', wall: [0.3, 0.28, 0.24], glass: [0.2, 0.22, 0.24], pitch: 3, floor: 4 } },
      tiers: [{ to: 1, face: { kind: 'punched', wall: [0.86, 0.82, 0.72], glass: [0.24, 0.26, 0.28], pitch: 2.6, solid: 0.5, floor: 3.6, material: 'terracotta' } }],
      roof: [0.5, 0.46, 0.4],
      crown: { kind: 'parapet', height: 0.8 },
    })
    const ring = towerRing(fit)
    const cx = ring.reduce((s, p) => s + p.x, 0) / ring.length
    const cz = ring.reduce((s, p) => s + p.z, 0) / ring.length
    // the gilded stupa housing the Holy Relics, centred on the roof
    cupola(out, { x: cx, z: cz }, 12, 1.8, { drum: 1.4, dome: 2.6, colour: [0.86, 0.82, 0.72], domeColour: [0.75, 0.62, 0.22], domeMaterial: 'copper' })
  },

  /** InterContinental Mark Hopkins (1926, Nob Hill): cream terracotta French Chateau tower under a steep copper mansard. */
  intercontinentalMarkHopkins: fromRecipe('edwardian-terracotta', {
    height: 93,
    wall: [0.86, 0.81, 0.7],
    base: 8,
    crown: { kind: 'mansard', height: 12, inset: 4, colour: [0.32, 0.28, 0.24], material: 'copper', dormers: 6 },
  }),

  /** Stock Exchange Tower, 155 Sansome (1930, Miller & Pflueger): grey granite Art Deco Moderne, setbacks near the top. */
  stockExchangeTower: fromRecipe('deco-setback', { height: 55, wall: [0.62, 0.6, 0.58], baseWall: [0.5, 0.48, 0.46] }),

  /** 100 California Street (1960s): a pale precast midcentury slab, dark glass bands, a plain podium. */
  oneHundredCalifornia: fromRecipe('midcentury-slab', { height: 59, wall: [0.8, 0.79, 0.75] }),

  /** 233;241 Sansome Street: a Financial District midcentury office slab, precast bands over a glazed base. */
  twoThirtyThreeSansome: fromRecipe('midcentury-slab', { height: 53, wall: [0.78, 0.76, 0.72] }),

  /** 1310 Mission Street: a contemporary SoMa residential tower, blue-green curtain wall, flat top. */
  thirteenTenMission: fromRecipe('glass-tower', { height: 55, wall: [0.58, 0.62, 0.66], glass: [0.32, 0.44, 0.54] }),

  /** 417 Montgomery Street: an early-20th-century Financial District office block, cream terracotta over a bronze shopfront base. */
  fourSeventeenMontgomery: fromRecipe('edwardian-terracotta', { height: 41 }),

  /** Royal Insurance Building (1908, Renaissance Revival): granite base, cream terracotta shaft, a moulded cornice. */
  royalInsuranceBuilding: fromRecipe('edwardian-terracotta', { height: 41, baseWall: [0.5, 0.46, 0.42], base: 7 }),

  /** Hotel Spero (historic Financial District hotel tower): cream terracotta punched windows, a moulded cornice. */
  hotelSpero: fromRecipe('edwardian-terracotta', { height: 55, wall: [0.82, 0.78, 0.68] }),
}
