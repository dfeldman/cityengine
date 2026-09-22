/**
 * San Francisco's individually modelled buildings: tierA-5 (docs/BUILDINGS.md). Mostly recipes from ../recipes.ts with
 * the colours and crown taken from a photograph; the shared parts (../../parts.ts) for anything more.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { fromRecipe } from '../recipes.ts'
import { tower, towerRing } from '../../tower.ts'
import { signText, longestEdge, edgeAt } from '../../parts.ts'

/** A small SFFD fire station: a dark brick apparatus base under a painted wall band with the company number. */
function fireStation(wall: [number, number, number], number: string): (out: MeshBuilder, fit: Fit) => void {
  return (out: MeshBuilder, fit: Fit): void => {
    tower(out, fit, {
      height: fit.height || 12,
      base: { height: 4.5, face: { kind: 'blank', wall: [0.16, 0.14, 0.13], material: 'brick' } },
      tiers: [{ to: 1, face: { kind: 'punched', wall, glass: [0.2, 0.22, 0.24], pitch: 2.6, floor: 3.4, solid: 0.5, material: 'stucco' } }],
      roof: [0.4, 0.4, 0.4],
      crown: { kind: 'parapet', height: 0.6 },
    })
    const ring = towerRing(fit)
    const e = edgeAt(ring, longestEdge(ring))
    signText(out, number, e.mid.x + e.nx * 0.1, fit.height * 0.55, e.mid.z + e.nz * 0.1, 1.4, [0.92, 0.9, 0.86], { heading: e.heading })
  }
}

export const TIERA_5: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /** SFJAZZ Center (2013): a plain grey precast-panel box, banded dark glass, flat glazed corner (Commons photograph). */
  sfjazzCenter: fromRecipe('midcentury-slab', { height: 13, base: 0, wall: [0.58, 0.58, 0.58], glass: [0.14, 0.16, 0.18], floor: 3.6, penthouse: 0 }),

  /** SFFD Engine Co. 3, a small red-walled firehouse over dark apparatus bays, its number over the doors. */
  fireStation3: fireStation([0.5, 0.16, 0.13], '3'),
  /** SFFD Engine Co. 16, the same kit in a plainer cream wall. */
  fireStation16: fireStation([0.78, 0.74, 0.66], '16'),

  /** UC Law SF McAllister Tower (1930): tan Gothic-deco brick, tall pointed-arch base, a jagged stepped crown (Commons photograph). */
  mcallisterTower: fromRecipe('deco-setback', { height: 114, wall: [0.82, 0.76, 0.6], glass: [0.18, 0.22, 0.22], base: 15, baseWall: [0.72, 0.66, 0.5], crown: { kind: 'stepped', steps: 3, height: 10, inset: 2 } }),

  /** Phillip Burton Federal Building (1959): a grey precast tower with deep vertical piers in shadow, flat top, blank podium (Commons photograph). */
  phillipBurtonFederal: fromRecipe('concrete-piers', { height: 95, wall: [0.72, 0.72, 0.7], glass: [0.2, 0.22, 0.25], baseWall: [0.68, 0.67, 0.64] }),

  /** An unnamed waterfront residential tower (13 storeys): a plain blue-glass curtain box, no reference photo found. */
  embarcaderoResidential: fromRecipe('glass-tower', { height: 61, wall: [0.62, 0.65, 0.68], glass: [0.32, 0.42, 0.5] }),

  /** Edith Witt Senior Community (2018), 11 storeys of affordable senior housing: plain beige stucco, punched windows (no photo, description only). */
  edithWittSenior: fromRecipe('hotel-punched', { height: 55, wall: [0.82, 0.78, 0.7], glass: [0.22, 0.25, 0.28], baseWall: [0.4, 0.38, 0.35] }),

  /** Mills Building (1891, Burnham & Root): ornate tan terracotta and brick, tiers of round-arched windows, heavy cornice (Commons/HABS photograph). */
  millsBuilding: fromRecipe('edwardian-terracotta', { height: 47, wall: [0.78, 0.7, 0.56], glass: [0.16, 0.18, 0.2], base: 8, baseWall: [0.7, 0.64, 0.52] }),

  /** 108;110 Sutter Street: a Sutter Street commercial tower of the 1910s–20s, cream terracotta, no reference photo found. */
  oneOhEightSutter: fromRecipe('chicago-block', { height: 39, wall: [0.72, 0.66, 0.56], glass: [0.2, 0.22, 0.24] }),

  /** 552 Montgomery Street (Bank of Italy Building, 1908): white Beaux-Arts granite, round-arched banking floor, deep cornice (Commons photograph). */
  bankOfItaly: fromRecipe('edwardian-terracotta', { height: 35, wall: [0.84, 0.82, 0.76], glass: [0.18, 0.2, 0.22], base: 9, baseWall: [0.78, 0.76, 0.7], material: 'ashlar' }),

  /** 330;332 Pine Street (the Orient Building, 1912, George Applegarth): a tan terracotta commercial highrise, no reference photo found. */
  orientBuilding: fromRecipe('edwardian-terracotta', { height: 38, wall: [0.8, 0.74, 0.6], glass: [0.18, 0.2, 0.22] }),
}
