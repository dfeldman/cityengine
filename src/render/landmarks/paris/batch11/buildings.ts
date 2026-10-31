/**
 * Batch 11's ten (2026-10-31, claude-sonnet-5-5). For each, the one feature that makes it recognisable comes first; the skin follows a photograph where one was found (Commons), else is a guess and says so.
 *   mouchotte (photo, Commons "La fête à Mouchotte"): a long slab of white-framed glazed grid, grey-blue glass, a dark open ground floor.
 *   chateauEauMontmartre (photo, Commons): a tall round shaft of pink stucco with slit windows, a wider tank drum on a corbel with an arcade band, a conical cap and lantern.
 *   usineElevatrice (photo, Commons 2021): a red-brick Art Deco pumping hall, a white window band under a flat roof, a flight of steps in front. OSM's 28 m is not what the photo shows (two storeys); built to ~13 m.
 *   archivesParis: NO photo found. Massing only: a blank stack tower with slit windows over a glazed reading-room base.
 *   fondationEtatsUnis (photo, Commons, a close view): Georgian-revival brick with white stucco bays and iron balconies, a hipped slate roof.
 *   maisonCambodge (photo, Commons 2010): a long pale block with window bands, a projecting entrance bay up steps, a small spire above the middle.
 *   heronBuilding: NO photo found. Massing only: a dark glazed slab, stepped at the top.
 *   perretFranklin (photo, Commons, 25 bis rue Franklin): pale tile-faced concrete frame, a glazed bay up the middle, set-backs at the top under a roof garden.
 *   woodUp: NO photo found. Massing only: a slender timber-slatted tower with a stepped terrace crown.
 *   boisLePretre (photo, Commons, a close view): the 1960s tower wrapped in glazed winter gardens, a glass shell stood off a plain core.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { box, hex, prism } from '../../kit.ts'
import { insetRing, tower, type Face, type TowerSpec } from '../../tower.ts'

const face = (kind: Face['kind'], wall: string, glass: string, pitch: number, solid: number, floor: number, depth = 0.3, material: Face['material'] = 'concrete'): Face =>
  ({ kind, wall: hex(wall), glass: hex(glass), pitch, solid, floor, depth, material })
const plinth = (h: number, c: string) => ({ height: h, face: { kind: 'blank' as const, wall: hex(c), material: 'concrete' as const } })
const make = (spec: TowerSpec) => (out: MeshBuilder, fit: Fit): void => tower(out, fit, spec)

/** Tour Mouchotte (Maine-Montparnasse, Beaudouin and Lods, 1960s): the long glazed slab. Feature: white-framed grid of grey-blue glass over a dark open ground floor. */
export const mouchotte = (out: MeshBuilder, fit: Fit): void => {
  tower(out, fit, {
    height: 49, roof: hex('#8a8a86'), base: plinth(4.5, '#3d3f41'),
    tiers: [{ to: 1, face: { ...face('curtain', '#f2f1ec', '#7e93a1', 2.4, 0.5, 3.4, 0.25, 'metal'), continuous: false } }],
    cornices: Array.from({ length: 12 }, (_, k) => ({ at: 4.5 + 3.4 * (k + 1), depth: 0.2, height: 0.5, colour: hex('#ecebe5') })),
    crown: { kind: 'parapet', height: 1.2, colour: hex('#cfcec8') }, penthouse: 2,
  })
  // the plant box set back on the roof, and a service stair-tower at one end
  box(out, -fit.hx * 0.5, 49 + 1.8, 0, fit.hx * 0.22, 1.8, fit.hz * 0.45, hex('#9a9a96'))
  box(out, fit.hx * 0.7, 49 + 2.4, 0, fit.hx * 0.08, 2.4, fit.hz * 0.4, hex('#b4b3ad'))
}

/** Château d'eau de Montmartre (1930s): round, built here as prisms about the footprint's centre, whatever OSM's ring is. */
export const chateauEauMontmartre = (out: MeshBuilder, fit: Fit): void => {
  const r = Math.min(Math.min(fit.hx, fit.hz), 6.5)
  const pink = hex('#dca98e'), stone = hex('#b9aea0'), dark = hex('#4d403b'), roof = hex('#6f7c76')
  prism(out, 0, 0, 0, 3, r * 1.08, 20, stone)
  prism(out, 0, 0, 3, 31, r, 20, pink, 0, r * 0.82)               // the shaft narrows a little as it rises
  const top = r * 0.82
  for (let y = 7; y < 29; y += 3.6) for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {   // slit windows up the shaft
    const rr = r - (r - top) * ((y - 3) / 28) - 0.05
    box(out, dx * rr, y, dz * rr, dx ? 0.14 : 0.3, 0.9, dz ? 0.14 : 0.3, dark)
  }
  prism(out, 0, 0, 31, 33, top * 1.28, 20, stone)                  // corbel
  prism(out, 0, 0, 33, 42, top * 1.22, 20, pink)                    // the tank drum
  prism(out, 0, 0, 36.5, 39.5, top * 1.235, 20, dark)              // its arcade, a dark band
  prism(out, 0, 0, 42, 43.2, top * 1.34, 20, stone)                 // cornice
  prism(out, 0, 0, 43.2, 47.4, top * 1.2, 20, roof, 0, top * 0.2)   // the conical cap
  prism(out, 0, 0, 47.4, 49.2, top * 0.24, 8, hex('#d9d6cd'))       // lantern
  prism(out, 0, 0, 49.2, 52, 0.12, 4, hex('#555'), 0, 0.02)        // finial
}

/** Usine élévatrice des eaux, Pantin (1930s): red brick hall, a white window band, a stair up to its door. */
export const usineElevatrice = (out: MeshBuilder, fit: Fit): void => {
  const white = hex('#ecebe4'), glass = hex('#4a5961'), grey = hex('#a5a49e')
  const hx = fit.hx, hz = fit.hz, h = 13
  box(out, 0, 0.6, 0, hx, 0.6, hz, grey)                                                             // podium
  tower(out, fit, { height: h, roof: hex('#7d7d78'), base: plinth(1.2, '#a5a49e'),
    tiers: [{ to: 1, face: face('bands', '#a2452f', '#4a5961', 5, 0.32, 6.4, 0.2, 'brick') }],
    cornices: [{ at: 12.2, depth: 0.35, height: 0.5, colour: white }], crown: { kind: 'parapet', height: 0.8, colour: white } })
  box(out, 0, 8.5, -hz - 0.15, hx * 0.62, 1.4, 0.2, white)                                           // the long white window band, standing proud on the front
  box(out, 0, 8.5, -hz - 0.2, hx * 0.58, 1.1, 0.12, glass)
  for (let i = 0; i < 6; i++) box(out, 0, 0.2 + i * 0.2, -hz - 1.4 + i * 0.01 - (6 - i) * 0.4 + 2.4, hx * 0.3, 0.1, 0.4, grey)   // steps
  box(out, 0, 4, -hz - 0.1, hx * 0.1, 2.6, 0.12, hex('#2d2b29'))                                    // the door
}

/** Archives de Paris, boulevard Sérurier (2000s): no photograph. Stacks tower: blank pale tower with slit windows. */
export const archivesParis = make({
  height: 29, roof: hex('#86857f'), base: plinth(1, '#8d8a82'),
  tiers: [
    { to: 8, face: face('curtain', '#c9c4b8', '#5c7480', 3, 0.25, 4, 0.25, 'metal') },
    { to: 1, face: face('punched', '#d6d0c0', '#2c3033', 6, 0.9, 4.8, 0.3, 'concrete'), inset: 0.6 },
  ],
  crown: { kind: 'parapet', height: 1.1, colour: hex('#b3ada0') }, penthouse: 1,
})

/** Fondation des États-Unis (Cité universitaire, 1930, Georgian-revival): brick, white stucco bays and iron balconies, a hipped slate roof, a pedimented centre. */
export const fondationEtatsUnis = (out: MeshBuilder, fit: Fit): void => {
  tower(out, fit, { height: 19, roof: hex('#4c5359'),
    tiers: [{ to: 15, face: face('punched', '#b5573d', '#e9e7e0', 3.2, 0.62, 3.4, 0.35, 'brick'), cornice: { depth: 0.5, height: 0.6, colour: hex('#ebe8de') } }],
    cornices: [{ at: 3.4, depth: 0.25, height: 0.35, colour: hex('#ebe8de') }],
    crown: { kind: 'hip', height: 4.2, inset: 2.2, colour: hex('#4c5359'), material: 'metal', dormers: 6 } })
  const hz = fit.hz, wh = hex('#efece2')
  for (const dx of [-0.55, 0, 0.55]) box(out, dx * fit.hx, 7, -hz - 0.35, 1.1, 5, 0.4, wh)       // three white stucco bays on the front, two storeys each
  box(out, 0, 3.7, -hz - 1.3, 2.4, 0.15, 1.1, hex('#ebe8de'))                                      // porch slab
  for (const dx of [-1.6, 1.6]) box(out, dx, 1.9, -hz - 1.6, 0.2, 1.8, 0.2, wh)                    // its piers
}

/** Maison du Cambodge (Cité universitaire, 1950s): a long pale block with window bands, a projecting entrance bay up steps, a small spire above the middle. */
export const maisonCambodge = (out: MeshBuilder, fit: Fit): void => {
  tower(out, fit, { height: 20, roof: hex('#7b7a75'), base: plinth(3, '#cbc7bb'),
    tiers: [{ to: 1, face: face('bands', '#e2dfd2', '#6d7b82', 4, 0.5, 3.2, 0.25, 'stucco') }],
    crown: { kind: 'parapet', height: 1.1, colour: hex('#d6d2c4') } })
  const hz = fit.hz
  box(out, 0, 8, -hz - 1.2, fit.hx * 0.14, 8, 1.4, hex('#ddd9cb'))                                   // the entrance bay, full height
  box(out, 0, 6, -hz - 1.95, fit.hx * 0.11, 3, 0.1, hex('#58666d'))                                 // its glazing
  for (let i = 0; i < 5; i++) box(out, 0, 0.15 + i * 0.3, -hz - 3.2 + i * 0.5, fit.hx * 0.18, 0.15, 0.5, hex('#bdb9ac'))   // the steps
  prism(out, 0, 0, 20.9, 23.2, 1.5, 4, hex('#d6d2c4'), 0, 1.0)                                        // the small pinnacle over the middle of the roof
  prism(out, 0, 0, 23.2, 26, 1.0, 4, hex('#9a8f6a'), 0, 0.05)
}

/** Heron Building (1970s office, avenue du Maine): no photograph. A dark glazed slab, stepped at the top; look unverified. */
export const heronBuilding = make({
  height: 68, roof: hex('#6e6f70'), base: plinth(6, '#3b3d3f'),
  tiers: [
    { to: 0.8, face: face('curtain', '#2a2d30', '#4d6270', 1.5, 0.45, 3.4, 0.25, 'metal') },
    { to: 1, face: face('curtain', '#2a2d30', '#4d6270', 1.5, 0.45, 3.4, 0.25, 'metal'), inset: 3 },
  ],
  crown: { kind: 'parapet', height: 1.2, colour: hex('#2c2e30') }, penthouse: 2,
})

/** Immeuble des frères Perret, 25 bis rue Franklin's neighbour (OSM 33 m): pale tile-faced frame, a glazed bay up the middle, set-backs under a roof garden. */
export const perretFranklin = (out: MeshBuilder, fit: Fit): void => {
  tower(out, fit, { height: 33, roof: hex('#8a8a85'), base: plinth(4.5, '#9e9a8e'),
    tiers: [
      { to: 24, face: face('punched', '#d8d4c4', '#6e8392', 2.4, 0.5, 3.0, 0.3, 'terracotta') },
      { to: 28.5, face: face('punched', '#d8d4c4', '#6e8392', 2.4, 0.5, 3.0, 0.3, 'terracotta'), inset: 1.4 },
      { to: 1, face: face('punched', '#d8d4c4', '#6e8392', 2.4, 0.5, 3.0, 0.3, 'terracotta'), inset: 1.4 },
    ],
    cornices: [{ at: 4.5, depth: 0.3, height: 0.4, colour: hex('#c4bfae') }],
    crown: { kind: 'parapet', height: 1, colour: hex('#b8b3a4') } })
  const hz = fit.hz, hx = fit.hx
  box(out, 0, 15, -hz - 0.45, hx * 0.3, 10.5, 0.5, hex('#cfd7da'))                                // the glazed bay, projecting up the middle
  box(out, 0, 15, -hz - 0.75, hx * 0.24, 10, 0.1, hex('#5d7684'))
  for (const dx of [-0.6, 0.6]) box(out, dx * hx, 34.2, 0, 0.7, 0.9, 0.7, hex('#4d6b3e'))        // roof-garden shrubs
}

/** Wood'Up (Paris 13e, 2022): no photograph. A timber-slatted slender tower with recessed balcony bands, a stepped terrace crown. */
export const woodUp = make({
  height: 50, roof: hex('#7a6a58'), base: plinth(4, '#3f3b36'),
  tiers: [
    { to: 0.85, face: face('fins', '#b98b58', '#5f7078', 1.2, 0.6, 3, 0.35, 'metal') },
    { to: 1, face: face('fins', '#b98b58', '#5f7078', 1.2, 0.6, 3, 0.35, 'metal'), inset: 2.5 },
  ],
  crown: { kind: 'parapet', height: 1.1, colour: hex('#8e6b44') }, penthouse: 1,
})

/** Tour Bois-le-Prêtre (Druot, Lacaton and Vassal's 2011 transformation): a plain 1960s core inside a glazed shell of winter gardens, floor by floor. */
export const boisLePretre = (out: MeshBuilder, fit: Fit): void => {
  const ring = fit.ring && fit.ring.length >= 3 ? fit.ring : undefined
  const core: Fit = ring ? { ...fit, ring: insetRing(ring, 1.6) } : fit
  tower(out, core, { height: 51, roof: hex('#7d7e7c'),
    tiers: [{ to: 1, face: face('punched', '#d3d0c6', '#4a5459', 3.2, 0.7, 3.0, 0.3, 'concrete') }],
    crown: { kind: 'parapet', height: 0.6, colour: hex('#b4b2a8') } })
  tower(out, fit, { height: 51, roof: hex('#9aa4a8'), base: plinth(3.2, '#555a5c'),
    tiers: [{ to: 1, face: { ...face('bands', '#e7eaea', '#a9c3cf', 4, 0.2, 3.0, 0.5, 'metal'), continuous: false } }],
    crown: { kind: 'parapet', height: 1, colour: hex('#c9cfd1'), material: 'metal' } })
}
