/**
 * Recipes: a tower spec per building TYPE, so that most of a city's buildings are a recipe plus a few overrides
 * taken from a photograph — its colour, its height, its crown — rather than a spec written from nothing. The
 * types are the ones San Francisco was built in, and between them they cover most of what stands downtown.
 *
 *     chevronTower: fromRecipe('midcentury-slab', { height: 175, wall: [0.82, 0.8, 0.76], glass: [0.3, 0.36, 0.4] }),
 *
 * What to override, always from the reference photo: `height` (OSM's), `wall` and `glass` (the real colours),
 * `material` where the recipe's guess is wrong, `crown`, `base.height`, and `pitch`/`floor` where the bays are
 * plainly wider or the storeys taller. Anything a recipe cannot say — a rotunda, a marquee, a dome, a clock
 * tower — is its own geometry in the district file, on top of the recipe's tower if that helps.
 *
 * Shared with the district batches (docs/sf-batches/BRIEF.md).
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { tower, type Crown, type Face, type TowerSpec } from '../tower.ts'
import type { Rgb } from '../../models.ts'

export interface RecipeOverrides {
  height?: number
  /** the wall's colour, from the photograph */
  wall?: Rgb
  /** the glass's colour */
  glass?: Rgb
  /** the wall's material, where the recipe's is wrong */
  material?: Face['material']
  /** bay width and floor height, metres */
  pitch?: number
  floor?: number
  /** how much of a bay (or floor) is wall, 0..1: a heavier or lighter facade */
  solid?: number
  crown?: Crown
  /** the podium's height in metres, 0 for none */
  base?: number
  /** the podium's colour, where it differs (a granite or bronze shopfront) */
  baseWall?: Rgb
  /** mechanical boxes on the roof */
  penthouse?: number
}

type Recipe = (o: RecipeOverrides) => TowerSpec

const CREAM: Rgb = [0.87, 0.84, 0.76]
const BUFF: Rgb = [0.85, 0.79, 0.67]
const PALE_CONCRETE: Rgb = [0.82, 0.81, 0.78]
const DARK_GLASS: Rgb = [0.24, 0.28, 0.33]
const BLUE_GLASS: Rgb = [0.36, 0.47, 0.57]
const BRONZE: Rgb = [0.19, 0.16, 0.14]
const GRANITE_RED: Rgb = [0.4, 0.24, 0.21]

export const RECIPES: Record<string, Recipe> = {
  /**
   * 1900s–1915, the rebuilt city: cream glazed terracotta over a steel frame, a dark shopfront base, paired
   * punched windows between fine piers, a moulded cornice, an attic storey. (The Phelan, the Hobart, the
   * Humboldt, most of Market Street's older blocks.)
   */
  'edwardian-terracotta': (o) => ({
    height: o.height ?? 45,
    base: { height: o.base ?? 8, face: { kind: 'curtain', wall: o.baseWall ?? BRONZE, glass: [0.2, 0.24, 0.27], pitch: 3, floor: 4 } },
    tiers: [
      { to: 0.9, face: { kind: 'punched', wall: o.wall ?? CREAM, glass: o.glass ?? [0.26, 0.28, 0.3], pitch: o.pitch ?? 2.4, solid: o.solid ?? 0.45, floor: o.floor ?? 3.8, material: o.material ?? 'terracotta' } },
      { to: 1, face: { kind: 'punched', wall: o.wall ?? CREAM, glass: o.glass ?? [0.26, 0.28, 0.3], pitch: o.pitch ?? 2.4, solid: 0.5, arched: true, floor: 4, material: o.material ?? 'terracotta' }, cornice: { depth: 1.1, height: 1.2 } },
    ],
    roof: [0.5, 0.48, 0.45],
    crown: o.crown ?? { kind: 'parapet', height: 1 },
    penthouse: o.penthouse,
  }),
  /**
   * 1925–1931, Art Deco: buff terracotta, strong vertical piers with the spandrels recessed, setbacks as it
   * rises, a stepped or lantern crown. (The Shell Building, 450 Sutter, the Russ Building.)
   */
  'deco-setback': (o) => ({
    height: o.height ?? 90,
    base: { height: o.base ?? 9, face: { kind: 'punched', wall: o.baseWall ?? GRANITE_RED, pitch: 3, floor: 4.5, solid: 0.5, material: 'granite' } },
    tiers: [
      { to: 0.72, face: { kind: 'fins', wall: o.wall ?? BUFF, glass: o.glass ?? [0.28, 0.29, 0.31], pitch: o.pitch ?? 2.2, solid: o.solid ?? 0.5, depth: 0.25, floor: o.floor ?? 3.6, material: o.material ?? 'terracotta' } },
      { to: 0.88, inset: 3, face: { kind: 'fins', wall: o.wall ?? BUFF, glass: o.glass ?? [0.28, 0.29, 0.31], pitch: o.pitch ?? 2.2, solid: 0.55, depth: 0.25, material: o.material ?? 'terracotta' } },
      { to: 1, inset: 3, face: { kind: 'fins', wall: o.wall ?? BUFF, glass: o.glass ?? [0.28, 0.29, 0.31], pitch: o.pitch ?? 2.2, solid: 0.6, depth: 0.25, material: o.material ?? 'terracotta' }, cornice: { depth: 0.8, height: 0.9 } },
    ],
    roof: [0.48, 0.46, 0.43],
    crown: o.crown ?? { kind: 'stepped', steps: 2, height: 7, inset: 2.5 },
    penthouse: o.penthouse,
  }),
  /**
   * 1900s–1920s commercial block, the Chicago frame: a stone or brick shaft of wide "Chicago" windows in a
   * grid, a heavy cornice, three or four to twelve storeys. (Most of the unnamed blocks on Market and Mission.)
   */
  'chicago-block': (o) => ({
    height: o.height ?? 30,
    base: { height: o.base ?? 7, face: { kind: 'curtain', wall: o.baseWall ?? BRONZE, glass: [0.22, 0.26, 0.29], pitch: 3.4, floor: 4.5 } },
    tiers: [
      { to: 1, face: { kind: 'punched', wall: o.wall ?? [0.72, 0.66, 0.58], glass: o.glass ?? [0.25, 0.28, 0.3], pitch: o.pitch ?? 3.4, solid: o.solid ?? 0.35, floor: o.floor ?? 3.9, material: o.material ?? 'brick' }, cornice: { depth: 1, height: 1 } },
    ],
    roof: [0.45, 0.44, 0.42],
    crown: o.crown ?? { kind: 'parapet', height: 0.9 },
  }),
  /**
   * 1955–1975: the banded slab. Precast or aluminium spandrels a floor apart, dark glass between, a flat top
   * with its mechanical penthouse, a plain podium. (Most of the Financial District's middle rank.)
   */
  'midcentury-slab': (o) => ({
    height: o.height ?? 120,
    base: { height: o.base ?? 7, face: { kind: 'curtain', wall: o.baseWall ?? [0.3, 0.3, 0.32], glass: [0.26, 0.3, 0.34], pitch: 4, floor: 5 } },
    tiers: [
      { to: 1, face: { kind: 'bands', wall: o.wall ?? PALE_CONCRETE, glass: o.glass ?? DARK_GLASS, pitch: o.pitch ?? 3, solid: o.solid ?? 0.42, floor: o.floor ?? 3.5, material: o.material ?? 'concrete' } },
    ],
    roof: [0.42, 0.42, 0.44],
    crown: o.crown ?? { kind: 'parapet', height: 1.2 },
    penthouse: o.penthouse ?? 1,
  }),
  /**
   * 1965–1980, the concrete tower: deep vertical piers all the way up, the glass in shadow behind them, a
   * blank base. (The Embarcadero Center, the Hilton's towers, Parc 55's neighbours.)
   */
  'concrete-piers': (o) => ({
    height: o.height ?? 130,
    base: { height: o.base ?? 9, face: { kind: 'blank', wall: o.baseWall ?? [0.72, 0.71, 0.68], material: 'concrete' } },
    tiers: [
      { to: 1, face: { kind: 'fins', wall: o.wall ?? [0.85, 0.84, 0.81], glass: o.glass ?? [0.28, 0.31, 0.35], pitch: o.pitch ?? 3.1, solid: o.solid ?? 0.45, depth: 0.35, floor: o.floor ?? 3.4, material: o.material ?? 'concrete' } },
    ],
    roof: [0.5, 0.5, 0.5],
    crown: o.crown ?? { kind: 'flat' },
    penthouse: o.penthouse ?? 1,
  }),
  /**
   * 1980s postmodern: polished granite in a punched grid, setbacks near the top, often a stone crown. (101
   * California's neighbours, 580 California, the Four Seasons.)
   */
  'granite-eighties': (o) => ({
    height: o.height ?? 140,
    base: { height: o.base ?? 10, face: { kind: 'punched', wall: o.baseWall ?? [0.5, 0.45, 0.43], pitch: 4, floor: 5, solid: 0.45, material: 'granite' } },
    tiers: [
      { to: 0.9, face: { kind: 'punched', wall: o.wall ?? [0.62, 0.56, 0.53], glass: o.glass ?? [0.3, 0.34, 0.4], pitch: o.pitch ?? 3, solid: o.solid ?? 0.4, floor: o.floor ?? 3.5, material: o.material ?? 'granite' } },
      { to: 1, inset: 2.5, face: { kind: 'punched', wall: o.wall ?? [0.62, 0.56, 0.53], glass: o.glass ?? [0.3, 0.34, 0.4], pitch: o.pitch ?? 3, solid: 0.45, material: o.material ?? 'granite' }, cornice: { depth: 0.7, height: 0.8 } },
    ],
    roof: [0.45, 0.43, 0.42],
    crown: o.crown ?? { kind: 'parapet', height: 1.4 },
    penthouse: o.penthouse,
  }),
  /**
   * 1990s–2000s: the curtain-wall tower. A fine mullion grid of blue-green glass, a glazed lobby, a flat or
   * stepped top. (Most of the towers built since 1990, and the residential ones at Rincon Hill.)
   */
  'glass-tower': (o) => ({
    height: o.height ?? 150,
    base: { height: o.base ?? 8, face: { kind: 'curtain', wall: o.baseWall ?? [0.4, 0.42, 0.44], glass: [0.34, 0.44, 0.5], pitch: 3, floor: 5.5 } },
    tiers: [
      { to: 1, face: { kind: 'curtain', wall: o.wall ?? [0.62, 0.66, 0.7], glass: o.glass ?? BLUE_GLASS, pitch: o.pitch ?? 1.6, solid: o.solid ?? 0.12, floor: o.floor ?? 3.3, material: o.material ?? 'metal' } },
    ],
    roof: [0.4, 0.42, 0.44],
    crown: o.crown ?? { kind: 'parapet', height: 1.2 },
    penthouse: o.penthouse,
  }),
  /**
   * 2010s: the slender tower. All glass, stepping in once or twice near the top, a mast or a sloped crown, a
   * tall glazed podium. (Millennium, 181 Fremont, the Transbay towers.)
   */
  'modern-slender': (o) => ({
    height: o.height ?? 190,
    base: { height: o.base ?? 12, face: { kind: 'curtain', wall: o.baseWall ?? [0.5, 0.52, 0.55], glass: [0.4, 0.5, 0.56], pitch: 3, floor: 6 } },
    tiers: [
      { to: 0.86, face: { kind: 'curtain', wall: o.wall ?? [0.66, 0.7, 0.74], glass: o.glass ?? [0.42, 0.53, 0.62], pitch: o.pitch ?? 1.5, solid: o.solid ?? 0.1, floor: o.floor ?? 3.3, material: o.material ?? 'metal' } },
      { to: 1, inset: 2.5, face: { kind: 'curtain', wall: o.wall ?? [0.66, 0.7, 0.74], glass: o.glass ?? [0.42, 0.53, 0.62], pitch: o.pitch ?? 1.5, solid: 0.1, material: o.material ?? 'metal' } },
    ],
    roof: [0.42, 0.44, 0.46],
    crown: o.crown ?? { kind: 'mast', height: 10, width: 0.6 },
  }),
  /**
   * The brick warehouse or loft: SoMa, the waterfront, Jackson Square. Brick with a regular grid of big
   * segmental windows, a corbelled cornice, three to seven storeys, a loading base.
   */
  'brick-loft': (o) => ({
    height: o.height ?? 22,
    base: { height: o.base ?? 5, face: { kind: 'punched', wall: o.baseWall ?? [0.44, 0.31, 0.26], glass: [0.2, 0.22, 0.24], pitch: 4, floor: 5, solid: 0.4, material: 'brick' } },
    tiers: [
      { to: 1, face: { kind: 'punched', wall: o.wall ?? [0.52, 0.32, 0.26], glass: o.glass ?? [0.24, 0.26, 0.28], pitch: o.pitch ?? 3.6, solid: o.solid ?? 0.38, floor: o.floor ?? 3.9, arched: true, material: o.material ?? 'brick' }, cornice: { depth: 0.6, height: 0.7 } },
    ],
    roof: [0.4, 0.38, 0.36],
    crown: o.crown ?? { kind: 'parapet', height: 0.8 },
  }),
  /**
   * The hotel or apartment tower, 1960s–80s: punched windows in a stucco or precast wall, floor after floor,
   * a flat top. (The Hiltons, the Holiday Inns, the big apartment slabs.)
   */
  'hotel-punched': (o) => ({
    height: o.height ?? 60,
    base: { height: o.base ?? 6, face: { kind: 'curtain', wall: o.baseWall ?? [0.35, 0.34, 0.33], glass: [0.26, 0.3, 0.34], pitch: 3.2, floor: 4.5 } },
    tiers: [
      { to: 1, face: { kind: 'punched', wall: o.wall ?? [0.8, 0.78, 0.74], glass: o.glass ?? [0.26, 0.29, 0.33], pitch: o.pitch ?? 2.6, solid: o.solid ?? 0.42, floor: o.floor ?? 3, material: o.material ?? 'stucco' } },
    ],
    roof: [0.44, 0.44, 0.44],
    crown: o.crown ?? { kind: 'parapet', height: 1 },
    penthouse: o.penthouse ?? 1,
  }),
}

export type RecipeName = keyof typeof RECIPES

/** A builder from a recipe and what the photograph says is different about this one. */
export function fromRecipe(name: RecipeName, o: RecipeOverrides = {}): (out: MeshBuilder, fit: Fit) => void {
  const spec = RECIPES[name](o)
  return (out: MeshBuilder, fit: Fit): void => tower(out, fit, spec)
}
