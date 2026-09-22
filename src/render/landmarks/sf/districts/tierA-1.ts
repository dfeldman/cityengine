/**
 * San Francisco's individually modelled buildings: tierA-1 (docs/BUILDINGS.md). Mostly recipes from ../recipes.ts with
 * the colours and crown taken from a photograph; the shared parts (../../parts.ts) for anything more.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { fromRecipe } from '../recipes.ts'
import { tower, towerRing, type TowerSpec } from '../../tower.ts'
import { cupola } from '../../parts.ts'

const spec = (s: TowerSpec) => (out: MeshBuilder, fit: Fit): void => tower(out, fit, s)

export const TIERA_1: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /** First Chinese Baptist Church (1908, Waverly Place): dark clinker brick, Gothic arches, a stepped parapet. */
  firstChineseBaptistChurch: fromRecipe('brick-loft', {
    height: 14,
    wall: [0.32, 0.18, 0.15],
    material: 'brick',
    crown: { kind: 'parapet', height: 1.4, colour: [0.32, 0.18, 0.15] },
  }),

  /** Holy Trinity Orthodox Cathedral (1909): a cream Georgian-balustraded block under a gilded onion dome and drum, its open bell tower beside it. */
  holyTrinityOrthodoxCathedral: (out: MeshBuilder, fit: Fit): void => {
    tower(out, fit, {
      height: 12,
      tiers: [{ to: 1, face: { kind: 'punched', wall: [0.88, 0.85, 0.78], glass: [0.2, 0.22, 0.24], pitch: 3, solid: 0.5, floor: 4, material: 'ashlar' } }],
      roof: [0.7, 0.6, 0.3],
      crown: { kind: 'flat' },
    })
    const ring = towerRing(fit)
    const cx = ring.reduce((s, p) => s + p.x, 0) / ring.length
    const cz = ring.reduce((s, p) => s + p.z, 0) / ring.length
    // the main dome, gilded, on its drum
    cupola(out, { x: cx, z: cz }, 12, 3.2, { drum: 3, dome: 4, colour: [0.88, 0.85, 0.78], domeColour: [0.7, 0.6, 0.2], domeMaterial: 'copper' })
    // the open bell tower, taller and thinner, off to one side
    cupola(out, { x: cx + 4, z: cz - 3 }, 8, 1.4, { drum: 5, dome: 2.5, colour: [0.88, 0.85, 0.78], domeColour: [0.7, 0.6, 0.2], domeMaterial: 'copper' })
  },

  /** Hamilton Square Baptist Church (Geary at Franklin): cream stucco, a Mission-revival base under a needle-thin louvered spire. */
  hamiltonSquareBaptistChurch: fromRecipe('hotel-punched', {
    height: 14,
    wall: [0.88, 0.84, 0.74],
    material: 'stucco',
    base: 0,
    crown: { kind: 'spire', height: 16, inset: 3, colour: [0.88, 0.84, 0.74] },
  }),

  /** San Francisco 4th & King Street (1975/1999): a plain glazed station house under a light-blue steel canopy. */
  sf4thKingStreetStation: spec({
    height: 8,
    base: { height: 6, face: { kind: 'curtain', wall: [0.55, 0.6, 0.66], glass: [0.35, 0.45, 0.5], pitch: 2.4, floor: 5.5 }, canopy: { depth: 2.5, colour: [0.5, 0.62, 0.72] } },
    tiers: [{ to: 1, face: { kind: 'blank', wall: [0.55, 0.6, 0.66], material: 'metal' } }],
    roof: [0.5, 0.55, 0.6],
    crown: { kind: 'flat' },
  }),

  /** (unnamed) way/80296716, SoMa: a 1990s–2000s blue-green curtain-wall residential tower, flat topped. */
  somaCurtainTower99m: fromRecipe('glass-tower', { height: 99, wall: [0.6, 0.66, 0.72], glass: [0.34, 0.46, 0.56] }),

  /** 75 Hawthorne Street / Hawthorne Plaza (1987, EPA Region 9 HQ): polished pink granite in a punched grid, a plain podium. */
  seventyFiveHawthorne: fromRecipe('granite-eighties', { height: 99, wall: [0.6, 0.52, 0.48], glass: [0.32, 0.4, 0.48] }),

  /** 311 California Street, the Robert Dollar Building (1910/1919): cream terracotta, paired punched windows, a moulded cornice. */
  robertDollarBuilding: fromRecipe('edwardian-terracotta', { height: 51 }),

  /** 115 Sansome Street (1915, Beaux-Arts, Standard Oil): Colusa sandstone base, buff brick shaft, terracotta columns under a copper cornice. */
  oneFifteenSansome: fromRecipe('edwardian-terracotta', { height: 53, wall: [0.78, 0.68, 0.54], baseWall: [0.66, 0.6, 0.5], base: 6 }),

  /** 1338 Mission Street, SoMa: a stucco mid-rise of punched windows, flat topped. */
  thirteenThirtyEightMission: fromRecipe('hotel-punched', { height: 55, wall: [0.76, 0.72, 0.66] }),

  /** 1340 Mission Street, SoMa: the twin next door, a shade cooler. */
  thirteenFortyMission: fromRecipe('hotel-punched', { height: 55, wall: [0.7, 0.7, 0.68] }),

  /** 240;244 Kearny Street, Financial District: an ordinary brick-and-stone Chicago-frame block. */
  twoFortyKearny: fromRecipe('chicago-block', { height: 36 }),

  /** The Civic, Civic Center (2020s apartments): a glazed mid-rise over Polk Street, a flat top with its roof deck. */
  theCivic: fromRecipe('glass-tower', { height: 44, wall: [0.58, 0.62, 0.66], glass: [0.36, 0.46, 0.54] }),

  /** Martin Luther Tower (1960s, senior housing, Cathedral Hill): a precast slab of punched windows, floor after floor, flat topped. */
  martinLutherTower: fromRecipe('hotel-punched', { height: 93, wall: [0.82, 0.8, 0.76] }),
}
