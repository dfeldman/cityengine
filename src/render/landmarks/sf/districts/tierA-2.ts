/**
 * San Francisco's individually modelled buildings: tierA-2 (docs/BUILDINGS.md). Mostly recipes from ../recipes.ts with
 * the colours and crown taken from a photograph; the shared parts (../../parts.ts) for anything more.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { fromRecipe } from '../recipes.ts'
import { tower, towerRing, type TowerSpec } from '../../tower.ts'
import { marquee, bladeSign, edgeFacing } from '../../parts.ts'

const spec = (s: TowerSpec) => (out: MeshBuilder, fit: Fit): void => tower(out, fit, s)

export const TIERA_2: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /** Academy of Art University, New Montgomery St (1907-ish): a tan Edwardian block with white-trimmed bay windows, floor after floor. */
  academyOfArtUniversity: fromRecipe('edwardian-terracotta', { height: 24, wall: [0.74, 0.72, 0.67], baseWall: [0.2, 0.19, 0.18] }),

  /** Club Fugazi (1912, North Beach): a small cream Beaux-Arts hall, a colonnaded entrance porch, the name over the doors. */
  clubFugazi: (out: MeshBuilder, fit: Fit): void => {
    tower(out, fit, {
      height: 16,
      base: { height: 5, face: { kind: 'blank', wall: [0.1, 0.1, 0.1], material: 'metal' } },
      tiers: [{ to: 1, face: { kind: 'punched', wall: [0.88, 0.85, 0.78], glass: [0.2, 0.22, 0.24], pitch: 3, solid: 0.55, floor: 4, material: 'ashlar' } }],
      roof: [0.7, 0.68, 0.62],
      crown: { kind: 'parapet', height: 1 },
    })
    const ring = towerRing(fit)
    const e = edgeFacing(ring, 0)
    bladeSign(out, (ring[e].x + ring[(e + 1) % ring.length].x) / 2, 8, (ring[e].z + ring[(e + 1) % ring.length].z) / 2, 3, 'CLUB FUGAZI', { width: 1.2 })
  },

  /** United States Appraisers Building (1940, Streamline Moderne, Battery St): plain grey granite federal block. */
  usAppraisersBuilding: fromRecipe('chicago-block', { height: 10, wall: [0.55, 0.55, 0.54], material: 'granite', baseWall: [0.4, 0.4, 0.4], crown: { kind: 'flat' } }),

  /** Great Star Theater (1925, Chinatown): a cream and jade pagoda-roofed front, a red marquee, its blade sign climbing the parapet. */
  greatStarTheater: (out: MeshBuilder, fit: Fit): void => {
    tower(out, fit, {
      height: 9,
      base: { height: 3, face: { kind: 'blank', wall: [0.35, 0.55, 0.58], material: 'brick' } },
      tiers: [{ to: 1, face: { kind: 'punched', wall: [0.92, 0.9, 0.84], glass: [0.2, 0.22, 0.24], pitch: 2.6, solid: 0.4, floor: 5.5, material: 'stucco' } }],
      roof: [0.3, 0.45, 0.4],
      crown: { kind: 'hip', height: 2.5, inset: 1.5, colour: [0.3, 0.45, 0.4], material: 'tile' },
    })
    const ring = towerRing(fit)
    const e = edgeFacing(ring, 0)
    marquee(out, (ring[e].x + ring[(e + 1) % ring.length].x) / 2, 4.5, (ring[e].z + ring[(e + 1) % ring.length].z) / 2, 4.5, 2, 'GREAT STAR THEATER', { body: [0.75, 0.15, 0.13] })
    bladeSign(out, ring[e].x, 9.5, ring[e].z, 5, 'GREAT STAR', { width: 1.3 })
  },

  /** DMV San Francisco, Fell St: a plain 1970s stucco-and-concrete government box. */
  dmvSanFrancisco: fromRecipe('hotel-punched', { height: 8, wall: [0.7, 0.68, 0.64], base: 0, crown: { kind: 'flat' }, penthouse: 0 }),

  /** Tenderloin Police Station: a squat 1970s concrete-block station house. */
  tenderloinPoliceStation: fromRecipe('hotel-punched', { height: 6, wall: [0.62, 0.6, 0.58], material: 'concrete', base: 0, crown: { kind: 'flat' }, penthouse: 0 }),

  /** The Independent, Divisadero St: a plain stucco former hall behind its black marquee. */
  theIndependent: (out: MeshBuilder, fit: Fit): void => {
    tower(out, fit, {
      height: 7,
      tiers: [{ to: 1, face: { kind: 'blank', wall: [0.82, 0.8, 0.76], material: 'stucco' } }],
      roof: [0.4, 0.4, 0.4],
      crown: { kind: 'parapet', height: 0.8 },
    })
    const ring = towerRing(fit)
    const e = edgeFacing(ring, 0)
    marquee(out, (ring[e].x + ring[(e + 1) % ring.length].x) / 2, 3.6, (ring[e].z + ring[(e + 1) % ring.length].z) / 2, 3.6, 1.6, 'THE INDEPENDENT', { body: [0.08, 0.08, 0.09] })
  },

  /** Glad Tidings Temple (1920s, Tenderloin): a cream stucco gable front, tall arched windows, its blade sign climbing the wall. */
  gladTidingsChurch: (out: MeshBuilder, fit: Fit): void => {
    tower(out, fit, {
      height: 11,
      tiers: [{ to: 1, face: { kind: 'punched', wall: [0.85, 0.82, 0.74], glass: [0.2, 0.22, 0.24], pitch: 3, solid: 0.5, floor: 6, arched: true, material: 'stucco' } }],
      roof: [0.5, 0.48, 0.44],
      crown: { kind: 'hip', height: 2, inset: 1.5, colour: [0.85, 0.82, 0.74] },
    })
    const ring = towerRing(fit)
    const e = edgeFacing(ring, 0)
    bladeSign(out, ring[e].x, 10, ring[e].z, 6, 'GLAD TIDINGS', { width: 1.2, body: [0.15, 0.14, 0.14] })
  },

  /** Church for the Fellowship of All Peoples (1943, Larkin St): a tall white octagonal bell tower over three arched doors. */
  churchForFellowshipOfAllPeoples: spec({
    height: 18,
    tiers: [{ to: 1, face: { kind: 'punched', wall: [0.9, 0.88, 0.82], glass: [0.2, 0.22, 0.24], pitch: 2.6, solid: 0.6, floor: 4.5, arched: true, material: 'stucco' } }],
    roof: [0.4, 0.15, 0.13],
    crown: { kind: 'pyramid', height: 4, inset: 1, colour: [0.4, 0.15, 0.13] },
  }),

  /** Fo Guang Shan San Bao Temple: a modest converted Chinatown storefront. */
  foGuangShanSanBaoTemple: fromRecipe('chicago-block', { height: 12, wall: [0.78, 0.2, 0.18], material: 'stucco', baseWall: [0.15, 0.12, 0.1] }),

  /** 1500 Mission (2016): a pale precast residential slab with a sliced-off top corner. */
  fifteenHundredMission: fromRecipe('modern-slender', { height: 121, wall: [0.78, 0.78, 0.76], glass: [0.4, 0.46, 0.52], crown: { kind: 'flat' } }),

  /** San Francisco Fire Station 10: a small red-brick firehouse with its apparatus bay doors. */
  sfFireStation10: fromRecipe('brick-loft', { height: 10, wall: [0.5, 0.3, 0.24], base: 0 }),

  /** 1188 Mission Street (2016): a blue-glass curtain-wall residential tower, flat topped. */
  elevenEightyEightMission: fromRecipe('glass-tower', { height: 87, wall: [0.56, 0.6, 0.64], glass: [0.32, 0.44, 0.56] }),

  /** W San Francisco (1999, Howard St): a grey precast punched tower with notched setback corners and a stepped top. */
  wSanFrancisco: fromRecipe('hotel-punched', { height: 96, wall: [0.72, 0.72, 0.7], baseWall: [0.2, 0.18, 0.18], crown: { kind: 'stepped', steps: 2, height: 4, inset: 1.5 } }),

  /** Hotel Zetta (1913, the Fredericks Building): cream terracotta over a dark shopfront base. */
  hotelZetta: fromRecipe('edwardian-terracotta', { height: 62 }),

  /** 1190 Mission Street (2015): a light stucco-and-metal apartment mid-rise, punched windows, flat topped. */
  elevenNinetyMission: fromRecipe('hotel-punched', { height: 62, wall: [0.74, 0.72, 0.68], material: 'stucco' }),

  /** 180 Howard Street (1965): a pale concrete-banded midcentury office slab. */
  oneEightyHoward: fromRecipe('midcentury-slab', { height: 57, wall: [0.78, 0.77, 0.73] }),

  /** 260 California Street (1980s): polished red granite in a punched grid, a stone crown. */
  twoSixtyCalifornia: fromRecipe('granite-eighties', { height: 45, wall: [0.58, 0.5, 0.46] }),

  /** 222 Kearny Street: an ordinary brick-and-stone Chicago-frame block, Financial District. */
  twoTwentyTwoKearny: fromRecipe('chicago-block', { height: 42 }),

  /** 343 Sansome Street, the Stock Exchange Tower (1930, Miller & Pflueger): buff terracotta with deco setbacks. */
  threeFortyThreeSansome: fromRecipe('deco-setback', { height: 41 }),

  /** 246 2nd Street: a blue-green curtain-wall office tower, flat topped. */
  twoFortySixSecond: fromRecipe('glass-tower', { height: 73, wall: [0.6, 0.64, 0.68], glass: [0.34, 0.46, 0.56] }),
}
