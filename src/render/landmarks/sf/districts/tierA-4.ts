/**
 * San Francisco's individually modelled buildings: tierA-4 (docs/BUILDINGS.md). Mostly recipes from ../recipes.ts with
 * the colours and crown taken from a photograph; the shared parts (../../parts.ts) for anything more.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { fromRecipe } from '../recipes.ts'
import { tower, towerRing } from '../../tower.ts'
import { cupola } from '../../parts.ts'

export const TIERA_4: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /** Ukrainian Orthodox Church of Saint Michael (345 7th St, ex-Holy Trinity Greek Orthodox 1904): cream stucco under a small blue dome on its drum. */
  ukrainianOrthodoxStMichael: (out: MeshBuilder, fit: Fit): void => {
    tower(out, fit, {
      height: 12,
      tiers: [{ to: 1, face: { kind: 'punched', wall: [0.86, 0.82, 0.74], glass: [0.2, 0.22, 0.24], pitch: 2.8, solid: 0.5, floor: 3.8, material: 'stucco' } }],
      roof: [0.86, 0.82, 0.74],
      crown: { kind: 'flat' },
    })
    const ring = towerRing(fit)
    const cx = ring.reduce((s, p) => s + p.x, 0) / ring.length
    const cz = ring.reduce((s, p) => s + p.z, 0) / ring.length
    cupola(out, { x: cx, z: cz }, 12, 2.2, { drum: 2.6, dome: 3, colour: [0.86, 0.82, 0.74], domeColour: [0.22, 0.32, 0.5], domeMaterial: 'tile' })
  },

  /** Jasper (2015, Rincon Hill, HKS/Saitowitz): a slender glass-balcony residential tower, flat topped. */
  jasper: fromRecipe('modern-slender', { height: 131, wall: [0.68, 0.72, 0.76], glass: [0.4, 0.5, 0.58], crown: { kind: 'flat' } }),

  /** The Spear (Rincon area, 2000s): a blue-green curtain-wall residential tower, flat topped. */
  theSpear: fromRecipe('glass-tower', { height: 60, wall: [0.6, 0.64, 0.68], glass: [0.32, 0.44, 0.54] }),

  /** 70 4th Street, SoMa: a stucco mid-rise hotel/apartment block, punched windows, flat topped. */
  seventyFourthStreet: fromRecipe('hotel-punched', { height: 54, wall: [0.78, 0.76, 0.7] }),

  /** 98 9th Street, SoMa: a plain stucco mid-rise apartment block. */
  ninetyEightNinthStreet: fromRecipe('hotel-punched', { wall: [0.74, 0.72, 0.68] }),

  /** 530;540;546;550 Kearny Street, Financial District: a Chicago-frame brick-and-stone commercial block. */
  kearnyStreetBlock: fromRecipe('chicago-block', { height: 42 }),

  /** Mint Plaza building (5th & Mission): a modern blue-green curtain-wall infill block over the plaza. */
  mintPlaza: fromRecipe('glass-tower', { height: 39, wall: [0.58, 0.62, 0.66], glass: [0.34, 0.46, 0.55] }),

  /** (unnamed) way/260286443, Financial District: a plain 1970s/80s stucco apartment tower, punched windows. */
  unnamedFidiTower51m: fromRecipe('hotel-punched', { height: 51, wall: [0.8, 0.78, 0.74] }),
}
