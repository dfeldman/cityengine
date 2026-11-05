/**
 * Batch 9's towers (2026-10-31, claude-sonnet-5-5). Each skin is read from a photograph where one was found, and says so; where none was, the skin is a plain concrete guess and the comment says that too.
 *   hyattEtoile: photo (Commons, Hyatt Regency Paris Étoile, Jan 2023): a round shaft of white-silver ribs and gold-tan glass, a lettered ring at the top, a mast.
 *   pullmanMontparnasse: photo (fr.wikipedia, Oct 2020): white vertical panels with narrow dark window strips, stepped skyline.
 *   superChapelle: photo (Commons, Porte de la Chapelle, 2022): pale grey-cream concrete, small regular windows.
 *   tourAlbert: photo (fr.wikipedia): white panels and glazed bands on a steel frame, an open dark storey a third of the way up.
 *   tourSequana: photo (Commons): an ellipse of blue-teal glass with a dark band at every floor.
 *   superMontparnasse, tourBagnolet, tourItalie37, tourVandrezanne: NO usable photo; a plain concrete grid, heights from OSM and APUR. Their look is unverified.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { simplifyRing, tower, type Face, type TowerSpec } from '../../tower.ts'

const face = (kind: Face['kind'], wall: string, glass: string, pitch: number, solid: number, floor: number, depth = 0.3, material: Face['material'] = 'concrete'): Face =>
  ({ kind, wall: hex(wall), glass: hex(glass), pitch, solid, floor, depth, material })
const cont = (f: Face): Face => ({ ...f, continuous: true })
const make = (spec: TowerSpec) => (out: MeshBuilder, fit: Fit): void => tower(out, fit, spec)
const plinth = (h: number, c: string) => ({ height: h, face: { kind: 'blank' as const, wall: hex(c), material: 'concrete' as const } })

/** Hyatt Regency Paris Étoile, ex Concorde Lafayette (1974, Michel Proux, Pierre Dufau, Pierre Duterrier? unverified): the shaft to APUR's 119 m roof, the lettered ring and the mast up to 137 m. */
export const hyattEtoile = make({
  height: 119, roof: hex('#8a8985'), base: plinth(6, '#5d5c59'),
  tiers: [{ to: 1, face: cont(face('fins', '#fbfaf6', '#d9a24e', 2.0, 0.36, 3.4, 0.25, 'stucco')) }],
  crown: { kind: 'lantern', height: 3.6, inset: 0.4, face: { kind: 'blank', wall: hex('#cac7c0') }, cap: { kind: 'mast', height: 14, colour: hex('#9b9b9b'), width: 0.5 } },
})

/** Pullman Paris Montparnasse, ex Méridien (1974): white panels, dark strips, a stepped roof. */
export const pullmanMontparnasse = make({
  height: 116, roof: hex('#8d8d8a'), base: plinth(5, '#6f6e6a'),
  tiers: [{ to: 1, face: cont(face('fins', '#fbfbf8', '#0f1215', 3.0, 0.68, 3.8, 0.3, 'stucco')) }],
  crown: { kind: 'stepped', steps: 2, height: 5, inset: 3.5, face: face('blank', '#dedcd6', '#444', 3, 0.5, 3) },
  penthouse: 1,
})

/** Résidence Super Montparnasse (Zehrfuss, 1966-68, 29 levels): no photo found; concrete grid, a guess. */
export const superMontparnasse = make({
  height: 90, roof: hex('#7e7b73'), base: plinth(4.5, '#8a8478'),
  tiers: [{ to: 1, face: cont(face('fins', '#f6f5f0', '#14181b', 4.0, 0.76, 3.1, 0.3, 'stucco')) }],
  crown: { kind: 'parapet', height: 1.1, colour: hex('#a8a193') }, penthouse: 1,
})

/** Tour Super-Chapelle (Remondet, 1968, 28 levels): pale grey-cream, small windows in a regular grid. */
export const superChapelle = make({
  height: 78, roof: hex('#85837d'), base: plinth(4, '#8f8b81'),
  tiers: [{ to: 1, face: face('punched', '#d9d3c5', '#56606a', 3, 0.62, 2.8) }],
  crown: { kind: 'parapet', height: 1.2, colour: hex('#bdb8aa') }, penthouse: 1,
})

/** Tour Albert / Croulebarbe (Édouard Albert, 1958-60, 22 levels): white panels on an exposed steel frame (dark ledges every two floors), the open dark storey, the upper floors standing a little proud of it. */
const albertFace = face('punched', '#fbfaf6', '#7d929d', 3.4, 0.42, 3.0, 0.3, 'stucco')
export const tourAlbert = make({
  height: 66, roof: hex('#6e7072'), base: plinth(3.5, '#4a4c4e'),
  tiers: [
    { to: 22, face: albertFace },
    { to: 27, inset: 1.2, face: face('xbrace', '#1f2224', '#16191b', 3, 0.5, 3.6, 0.3, 'metal') },
    { to: 1, inset: -1.2, face: albertFace },
  ],
  cornices: [...Array.from({ length: 7 }, (_, k) => 6 + k * 3), ...Array.from({ length: 13 }, (_, k) => 30 + k * 3)].map((at) => ({ at, depth: 0.3, height: 0.4, colour: hex('#2a2d30') })),
  crown: { kind: 'parapet', height: 1.6, colour: hex('#3c3f42'), material: 'metal' },
})

/** Les Mercuriales' tower, Bagnolet (1975; OSM 114 m, glass): Street View shows a slim tower of dark bronze-framed grey-blue curtain wall with a twin beside it. */
export const tourBagnolet = make({
  height: 114, roof: hex('#6f5f52'),
  tiers: [{ to: 1, face: face('curtain', '#2a2018', '#4c5d69', 1.6, 0.5, 3.7, 0.3, 'metal') }],
  crown: { kind: 'parapet', height: 1.4, colour: hex('#2e241c') }, penthouse: 1,
})

/** the 37-level tower of 1977 off the Avenue de Choisy (APUR 97.9 m): no photo; the Italie 13 brutalist style: pale precast, strong floor slabs every 4th level, dark ribbons, plant boxes. */
const ITALIE37 = { slabEvery: 4 * 2.8, podium: 4 }
export const tourItalie37 = make({
  height: 104, roof: hex('#7f7b72'), base: plinth(ITALIE37.podium, '#9a978e'),
  tiers: [{ to: 1, face: { kind: 'bands', wall: hex('#dcd9ce'), glass: hex('#2f3437'), pitch: 3, solid: 0.5, floor: 2.8, depth: 0.2, material: 'concrete' } }],
  cornices: Array.from({ length: 8 }, (_, k) => ({ at: ITALIE37.podium + ITALIE37.slabEvery * (k + 1), depth: 0.35, height: 0.55, colour: hex('#e8e5dc') })),
  crown: { kind: 'parapet', height: 1.0, colour: hex('#e8e5dc'), material: 'concrete' }, penthouse: 3,
})

/** Tours Jade and Onyx, Rue Vandrezanne (1976, 31 levels, APUR 90 m): the one Commons street view shows a pale cream tower with a regular small-window grid, perhaps one of them (unconfirmed). */
export const tourVandrezanne = make({
  height: 92, roof: hex('#82807a'), base: plinth(4, '#908a7e'),
  tiers: [{ to: 1, face: face('punched', '#fbfaf6', '#6a7278', 2.4, 0.55, 2.9) }],
  crown: { kind: 'parapet', height: 1.1, colour: hex('#cfcabd') }, penthouse: 1,
})

/** Tour Sequana, Issy-les-Moulineaux (Arquitectonica, 2010, 100 m, 23-24 levels): an ellipse of bright blue reflective glass, a dark band every other floor, narrowing toward the top; the outline thinned to 16 points. */
const sequanaFace = face('bands', '#24425a', '#58b0e6', 1.5, 0.2, 4.2, 0.3, 'metal')
export const tourSequana = (out: MeshBuilder, fit: Fit): void => {
  const ring = fit.ring ? simplifyRing(fit.ring, 7, 0.14) : undefined
  tower(out, { ...fit, ring }, {
    height: 100, roof: hex('#5b6266'),
    tiers: [{ to: 36, face: sequanaFace }, { to: 68, inset: 0.9, face: sequanaFace }, { to: 1, inset: 0.9, face: sequanaFace }],
    crown: { kind: 'parapet', height: 1.2, colour: hex('#2a3a44'), material: 'metal' }, penthouse: 1,
  })
}
