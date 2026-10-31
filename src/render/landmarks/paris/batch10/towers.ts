/**
 * Batch 10's towers (2026-10-31, claude-sonnet-5-5). Skins read from Street View frames where one existed.
 *   tourVandrezanne2 (ways 64384784, 1072935717): frame g2-12: white tower, recessed balconies in a grid, glass ground floor.
 *   tourQuaiSeine (way 1527120955): frame g2-13: white, stepped top, seen through trees; the grid is a guess.
 *   tourBlanqui: frame g2-15: beige-cream, far off, small regular windows.
 *   tourBred: frame g2-18: white, fine grid over a stone base (seen only at its foot).
 *   tourBoisLePretre: NO photo of it (g2-19 shows a dark-clad neighbour); Lacaton & Vassal's glazed winter gardens round a 1960s tower, from memory of the Wikipedia picture: pale glass and white frames.
 *   tourFetes (way 227927908): frame g2-20: tan tower, fine grid, glass podium.
 *   marriottRiveGauche: NO photo; pale concrete with window bands, a guess.
 * Skipped: way 229412474 (Gare Montparnasse) is a building:part, layer 4, glass, height 78: an overlay on the station, not a tower. Way 75390823 is an industrial cadastre block with no height tag.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower, type Face, type TowerSpec } from '../../tower.ts'

const face = (kind: Face['kind'], wall: string, glass: string, pitch: number, solid: number, floor: number, depth = 0.3, material: Face['material'] = 'concrete'): Face =>
  ({ kind, wall: hex(wall), glass: hex(glass), pitch, solid, floor, depth, material })
const make = (spec: TowerSpec) => (out: MeshBuilder, fit: Fit): void => tower(out, fit, spec)

/** Rue Vandrezanne's two white towers (92 m and 90 m): deep recessed balconies in a grid, a glazed base. */
export const tourVandrezanne2 = make({
  height: 91, roof: hex('#8a8985'),
  base: { height: 7, face: face('curtain', '#3d4348', '#4d6270', 2.2, 0.3, 3.5, 0.2, 'metal') },
  tiers: [{ to: 1, face: face('punched', '#fbfaf6', '#2f353a', 3.2, 0.48, 3, 0.4, 'stucco') }],
  crown: { kind: 'parapet', height: 1.1, colour: hex('#e8e6df') }, penthouse: 1,
})

/** Quai de la Seine, 31 levels: white, stepped top. */
export const tourQuaiSeine = make({
  height: 93, roof: hex('#8a8985'),
  tiers: [{ to: 1, face: face('punched', '#fbfaf6', '#4f5a63', 2.8, 0.55, 3, 0.3, 'stucco') }],
  crown: { kind: 'stepped', steps: 2, height: 5, inset: 2.5, face: face('blank', '#ebe9e2', '#444', 3, 0.5, 3) }, penthouse: 1,
})

/** Tour Blanqui Corvisart (22 levels): beige-cream, small windows. */
export const tourBlanqui = make({
  height: 66, roof: hex('#85817a'), base: { height: 4, face: { kind: 'blank', wall: hex('#b3a78f'), material: 'concrete' } },
  tiers: [{ to: 1, face: face('punched', '#eadcbc', '#59626a', 2.6, 0.55, 3, 0.3, 'stucco') }],
  crown: { kind: 'parapet', height: 1.1, colour: hex('#d6c8a6') }, penthouse: 1,
})

/** Tour Bred (16 levels, 63 m): fine white grid over a stone base. */
export const tourBred = make({
  height: 63, roof: hex('#8a8985'), base: { height: 8, face: { kind: 'blank', wall: hex('#bdb29c'), material: 'concrete' } },
  tiers: [{ to: 1, face: face('punched', '#fbfaf6', '#3f484f', 1.5, 0.5, 3.9, 0.2, 'stucco') }],
  crown: { kind: 'parapet', height: 1.2, colour: hex('#e4e2da') }, penthouse: 1,
})

/** Tour Bois-le-Prêtre (Lacaton & Vassal, 2011): winter gardens of glass and pale frames wrapped round the old tower. */
export const tourBoisLePretre = make({
  height: 51, roof: hex('#9a9a96'),
  tiers: [{ to: 1, face: face('curtain', '#e6e8e6', '#9fb2b8', 2.4, 0.4, 3, 0.2, 'metal') }],
  crown: { kind: 'parapet', height: 1.0, colour: hex('#cfd2d0') },
})

/** Place des Fêtes tower (85 m): tan, a fine grid, a glass podium. */
export const tourFetes = make({
  height: 85, roof: hex('#7f7a70'),
  base: { height: 8, face: face('curtain', '#4a4f52', '#6f858f', 2.4, 0.3, 4, 0.2, 'metal') },
  tiers: [{ to: 1, face: face('punched', '#cdb48c', '#4d555b', 1.7, 0.55, 3, 0.2) }],
  crown: { kind: 'parapet', height: 1.1, colour: hex('#b79f78') }, penthouse: 1,
})

/** Paris Marriott Rive Gauche (Bd Saint-Jacques, 18 levels): no photo; pale concrete with window bands, a guess. */
export const marriottRiveGauche = make({
  height: 54, roof: hex('#85837d'),
  tiers: [{ to: 1, face: face('bands', '#d8d2c4', '#4d5a63', 3, 0.5, 3) }],
  crown: { kind: 'parapet', height: 1.1, colour: hex('#bdb8aa') }, penthouse: 1,
})
