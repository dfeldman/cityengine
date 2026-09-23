/** The queue's opus tier: what the other tiers bailed out of, or could not be done from a facade style. */
import { capPolygon, type MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { fromRecipe } from '../recipes.ts'
import { faceBand, insetRing, tower, towerRing, type TowerSpec } from '../../tower.ts'
import { boxAlong, edgeAt, edgeFacing, spireOn } from '../../parts.ts'
import { surfaceTag } from '../../../cartoon-material.ts'

const spec = (s: TowerSpec) => (out: MeshBuilder, fit: Fit): void => tower(out, fit, s)

const STONE: [number, number, number] = [0.76, 0.74, 0.69]

export const MODEL_OPUS: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /**
   * Esplanade Main Stage, Yerba Buena Gardens (750 Howard): not a building at all — OSM has it `building=no`,
   * `amenity=theatre`, "outdoor ground level performance stage". Its footprint is a 12 m stone oval, so that is
   * all this draws: a low paved deck with its stone rim and a darker stage floor. No canopy, no back wall — no
   * source shows one.
   */
  esplanadeMainStage: (out: MeshBuilder, fit: Fit): void => {
    const ring = fit.ring && fit.ring.length >= 3 ? fit.ring : towerRing(fit)
    faceBand(out, ring, 0, 0.45, { kind: 'blank', wall: STONE, material: 'ashlar' })
    capPolygon(out, ring, 0.45, STONE, surfaceTag('ashlar'))
    capPolygon(out, insetRing(ring, 0.7), 0.5, [0.34, 0.31, 0.29], surfaceTag('concrete'))
  },

  /**
   * 555 Montgomery Street (1983, SOM), at Clay: an 18-storey block of pale precast, square windows punched in an
   * even grid, the corners notched back, a bronze-glass shopfront and a slightly stepped flat top.
   */
  montgomery555: fromRecipe('granite-eighties', {
    height: 93, wall: [0.85, 0.83, 0.78], glass: [0.3, 0.38, 0.46], material: 'concrete',
    pitch: 3, solid: 0.42, floor: 3.9, base: 9, baseWall: [0.3, 0.29, 0.3],
    crown: { kind: 'stepped', steps: 2, height: 4.5, inset: 1.6, material: 'concrete' },
  }),

  /**
   * InterContinental San Francisco (2008, Patri Merker / Hornberger + Worstell), 888 Howard: a 32-storey hotel
   * whose whole shaft is rounded blue-green glass bays, ribbed top to bottom, standing on a buff precast podium
   * with a deep canopy over the entrance.
   */
  interContinentalSF: spec({
    height: 104,
    base: { height: 14, face: { kind: 'punched', wall: [0.82, 0.76, 0.63], glass: [0.24, 0.4, 0.44], pitch: 5, floor: 4.7, solid: 0.34, material: 'concrete' },
      canopy: { depth: 2.2, colour: [0.82, 0.76, 0.63] } },
    tiers: [
      { to: 1, face: { kind: 'fins', wall: [0.7, 0.73, 0.71], glass: [0.3, 0.55, 0.58], pitch: 5.5, solid: 0.16, depth: 0.85, floor: 3.1, material: 'metal' } },
    ],
    roof: [0.3, 0.36, 0.38],
    crown: { kind: 'parapet', height: 1.6, colour: [0.72, 0.75, 0.73], material: 'metal' },
  }),

  /**
   * 745 Buchanan Street: a one-storey former church — now the Korean American Community Center and Addis Kidan
   * Lutheran — a long grey-painted nave with tall paired round-arched windows, a flat parapet, a pointed-arch
   * entrance and a small spirelet standing over it.
   */
  buchanan745: (out: MeshBuilder, fit: Fit): void => {
    tower(out, fit, {
      height: 10,
      base: { height: 2.4, face: { kind: 'blank', wall: [0.72, 0.73, 0.69], material: 'brick' } },
      tiers: [
        { to: 1, face: { kind: 'punched', wall: [0.74, 0.75, 0.71], glass: [0.2, 0.22, 0.22], pitch: 4.2, solid: 0.62, floor: 7.6, arched: true, material: 'brick' } },
      ],
      roof: [0.5, 0.5, 0.48],
      crown: { kind: 'parapet', height: 0.7, colour: [0.74, 0.75, 0.71], material: 'brick' },
    })
    // the entrance porch and the spirelet behind it, both on the middle of the street front
    const ring = towerRing(fit)
    const e = edgeAt(ring, edgeFacing(ring, 0))
    boxAlong(out, e.mid.x + e.nx * 0.45, 2.7, e.mid.z + e.nz * 0.45, 2, 2.7, 0.55, e.heading, [0.63, 0.64, 0.6], surfaceTag('brick'))
    boxAlong(out, e.mid.x + e.nx * 0.35, 5.6, e.mid.z + e.nz * 0.35, 1.2, 0.5, 0.45, e.heading, [0.63, 0.64, 0.6], surfaceTag('brick'))
    boxAlong(out, e.mid.x + e.nx * 0.65, 1.8, e.mid.z + e.nz * 0.65, 1.05, 1.8, 0.2, e.heading, [0.3, 0.2, 0.15], surfaceTag('clapboard'))
    spireOn(out, { x: e.mid.x - e.nx * 2.5, z: e.mid.z - e.nz * 2.5 }, 10.2, 0.9, 2.6, 3.4,
      { colour: [0.74, 0.75, 0.71], spireColour: [0.52, 0.53, 0.5], material: 'brick', spireMaterial: 'tile' })
  },

  /**
   * Children's Creativity Museum (Zeum, 1998, Adèle Naudé Santos), 221 Fourth over Moscone: two storeys of pale
   * mauve stucco on the Yerba Buena roof terrace, with deep flat eyebrow canopies cantilevered off the upper
   * floor on their lens-shaped soffits. (The murals and steps below it are the garden's, not the building's.)
   */
  childrensCreativityMuseum: spec({
    height: 10,
    base: { height: 4.6, face: { kind: 'punched', wall: [0.78, 0.71, 0.73], glass: [0.2, 0.24, 0.28], pitch: 3.6, solid: 0.58, floor: 4.6, material: 'stucco' } },
    tiers: [
      { to: 1, face: { kind: 'punched', wall: [0.82, 0.75, 0.77], glass: [0.24, 0.3, 0.34], pitch: 3.2, solid: 0.42, floor: 5.4, material: 'stucco' },
        // the eyebrow: the deep flat canopy that runs right round the upper floor
        cornice: { depth: 1.7, height: 0.35, colour: [0.86, 0.82, 0.81] } },
    ],
    roof: [0.62, 0.58, 0.58],
    crown: { kind: 'parapet', height: 0.5, colour: [0.82, 0.75, 0.77], material: 'stucco' },
  }),
}
