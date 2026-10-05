/**
 * San Francisco's individually modelled buildings: tierA-5 (docs/BUILDINGS.md). Mostly recipes from ../recipes.ts with
 * the colours and crown taken from a photograph; the shared parts (../../parts.ts) for anything more.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { fromRecipe } from '../recipes.ts'
import { tower, towerRing, insetRing } from '../../tower.ts'
import { signText, longestEdge, edgeAt } from '../../parts.ts'
import { box } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'

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

  /**
   * UC Law SF McAllister Tower (1930, the former Empire Hotel / Methodist temple): tan Gothic Art Deco brick,
   * 114 m (Mapillary way-256042681-03.jpg, kept, confirmed on McAllister Street: a slab tower, plain punched
   * windows on the shaft, a stepped-back crown with vertical fin piers rising past the roofline into pointed
   * caps, and a slim central finial silhouetted against the sky). The recipe `deco-setback` said the setbacks
   * but had no word for the fins or the finial, which are what make the skyline silhouette read as Gothic
   * rather than plain deco — hand-added at the crown, on top of `tower()`'s ordinary shaft and steps.
   */
  mcallisterTower: (out: MeshBuilder, fit: Fit): void => {
    // buff, not yellow: the old [0.82, 0.76, 0.6] read as a yellow box in sun (campus audit 2026-10-05, Mapillary
    // way-256042681-03 and the review refs: greyish buff brick, the shaft ribbed by deep piers between window strips)
    const wall: [number, number, number] = [0.73, 0.67, 0.55]
    const baseWall: [number, number, number] = [0.66, 0.6, 0.49]
    const glass: [number, number, number] = [0.18, 0.22, 0.22]
    const H = fit.height || 114
    const crownH = H * 0.09
    const steps = 3
    tower(out, fit, {
      height: H,
      base: { height: 15, face: { kind: 'punched', wall: baseWall, glass, pitch: 3, floor: 4, solid: 0.42, material: 'ashlar' } },
      tiers: [{ to: 1 - crownH / H, face: { kind: 'fins', wall, glass, pitch: 2.8, floor: 3.4, solid: 0.45, depth: 0.5, material: 'brick' } }],
      roof: wall,
      crown: { kind: 'stepped', steps, height: crownH, inset: 2.4,
        face: { kind: 'punched', wall, glass, pitch: 2.6, floor: 3, solid: 0.35, material: 'brick' } },
    })
    // Walk the same inset/step sequence tower()'s 'stepped' crown just drew, to find each step's own ring —
    // a fin pier stands at every corner of every step, tallest at the base step and shortest at the top.
    let r = towerRing(fit)
    let y = H - crownH   // the tiers stop at H − crownH and the stepped crown rises from there
    const each = crownH / steps
    for (let k = 0; k < steps; k++) {
      r = insetRing(r, 2.4)
      // square corner piers standing a metre over each step's parapet (the spikes they were read as floating
      // clear of the crown from the street, 2026-10-05)
      const finH = each + 1.2
      for (const p of r) box(out, p.x, y + finH / 2, p.z, 0.7, finH / 2, 0.7, wall, surfaceTag('brick'))
      y += each
    }
    // the flagpole the photographs show on the top step
    let cx = 0, cz = 0
    for (const p of r) { cx += p.x; cz += p.z }
    cx /= r.length; cz /= r.length
    box(out, cx, y + 4, cz, 0.06, 4, 0.06, [0.75, 0.75, 0.75], surfaceTag('metal'))
  },

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
