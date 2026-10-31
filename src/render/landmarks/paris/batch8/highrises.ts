/**
 * Batch 8's high-rises (2026-10-31; owner: "many, many tall and large buildings that are drawn as generics right now. I don't think they're famous buildings in the normal sense but they are large and prominent and not generic"; "tons of high rises in bercy too"). The 13th's towers of 1964-77 round the Place d'Italie, the Gobelins and the Porte de Bagnolet: precast concrete on a grid, cream or white, a flat roof with its lift head, and none of the dark glass the bake gave every generic.
 * The one Mapillary frame that showed one (Rue de Tolbiac, Palerme) had a pale, almost white shaft with ribbons of small windows; the rest I could not get a photograph of, so which tower is cream, which white or grey is from the aerial's roofs and memory: the part worth a street-view check. All made by claude-sonnet-5-5, on OSM's outline and APUR's height.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower, type Face, type TowerSpec } from '../../tower.ts'

const face = (kind: Face['kind'], wall: string, glass: string, pitch: number, solid: number, floor: number, depth = 0.3): Face =>
  ({ kind, wall: hex(wall), glass: hex(glass), pitch, solid, floor, depth, material: 'concrete' })
const build = (f: Face, roof: string, crown: string, height = 95): TowerSpec => ({
  height, roof: hex(roof),
  base: { height: 4.5, face: { kind: 'blank', wall: hex('#8b867a'), material: 'concrete' } },
  tiers: [{ to: 1, face: f }],
  crown: { kind: 'parapet', height: 1.1, colour: hex(crown), material: 'concrete' },
  penthouse: 1,
})
const make = (spec: TowerSpec) => (out: MeshBuilder, fit: Fit): void => tower(out, fit, spec)

/** cream concrete, ribbon windows between solid spandrels: the commonest of them */
export const highriseCream = make(build(face('bands', '#d9d0b8', '#4a4f52', 3, 0.6, 3.0), '#8d887b', '#c4baa0'))
/** white precast, punched windows on a 3.6 m bay (the Italie 13 shafts, Rue de Tolbiac) */
export const highriseWhite = make(build(face('punched', '#e4e0d4', '#46494b', 3.6, 0.58, 3.0), '#8e8b82', '#d2cdbf'))
/** a grey-beige concrete, punched */
export const highriseGrey = make(build(face('punched', '#bcb7aa', '#3d4144', 3.6, 0.56, 3.0), '#7d7a72', '#a8a395'))
/** a buff, sandy tone, ribbons */
export const highriseSand = make(build(face('bands', '#cdbc98', '#44474a', 3, 0.58, 3.0), '#867e6a', '#b8a982'))
/** white with dark window bands: the broad ribbons of the 1970s slabs */
export const highriseBands = make(build(face('bands', '#e6e3da', '#33383b', 3, 0.55, 3.1), '#8b8a84', '#d8d4c8'))
/** white with fins stood proud: the balcony-pier towers */
export const highriseFins = make(build(face('fins', '#e0dccf', '#3a3e41', 3.2, 0.5, 3.0, 0.5), '#8c8a82', '#cfcabb'))
/** a pinkish-cream punched grid */
export const highriseGrid = make(build(face('punched', '#d4c3b0', '#45484a', 3.6, 0.58, 3.0), '#85796d', '#c0aea0'))
