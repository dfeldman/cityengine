import { d3, type D3Look } from './kit.ts'

/**
 * DEFENSE3 CLUSTER 6 (docs/landmarks/defense3-cluster6.tsv): the Courbevoie edge north-west of the core — the
 * Faubourg de l'Arche housing along Rue Arago / bd Circulaire, the long pale curved slab with grey ribbon bands
 * (CA-CIB side), the Citadines residence, the Lycée Lucie Aubrac and the evangelical church. Heights are BD TOPO
 * (manifest). Looks from one Panoramax frame each (tools/panoramax.py, 2026-11-16; scratch d3c6/pmx/<osm id>_0.jpg).
 * Nearly everything here is LIGHT: cream render with balconies, white towers, pale grey bands, pale glass.
 */

// Faubourg de l'Arche housing: cream render, deep balcony bands, darker window strips
const CREAM = '#e3d7c2', CREAM_WIN = '#8a9198'
const housing = (floor: number, solid = 0.58, wall = CREAM): D3Look => ({
  face: { kind: 'bands', wall, glass: CREAM_WIN, floor, solid, depth: 0.6 },
  lobby: { h: 4, wall: '#b9ad99', glass: '#4a5157' }, roof: '#8f8a83', parapet: { h: 1 },
})
// white housing towers (two tall white slabs in frame 82323227)
const WHITE = '#e9e9e5', WHITE_WIN = '#5f6a73'
const whiteTower: D3Look = { face: { kind: 'punched', wall: WHITE, glass: WHITE_WIN, floor: 2.9, pitch: 1.6, solid: 0.5 }, roof: '#8d8d8b', parapet: { h: 1 } }
// the long curved slab with pale grey ribbon bands (frames 82467019/-45/-72 …)
const SLAB = '#cfd1cf', SLAB_WIN = '#93a2ad'
const slab = (solid: number, glass = SLAB_WIN): D3Look => ({
  face: { kind: 'bands', wall: SLAB, glass, floor: 3.4, solid, depth: 0.4 },
  lobby: { h: 5, wall: '#a6aaac', glass: '#4a545b' }, roof: '#8b8c8c', parapet: { h: 0.8 },
})

export const d3Citadines = d3({ face: { kind: 'bands', wall: '#d9c39a', glass: '#6c6f70', floor: 2.9, solid: 0.45, depth: 0.7 }, lobby: { h: 4.5, wall: '#a99573' }, roof: '#8a857c', parapet: { h: 1.2 } }) // way/82466986: ochre-cream curved residence
export const d3EgliseEvangelique = d3({ face: { kind: 'punched', wall: '#e6e6e2', glass: '#6a737a', floor: 4, pitch: 3, solid: 0.8 }, roof: '#8f8f8d', parapet: { h: 0.8 } }) // way/852354007: white panel box
export const d3ArceauxGlass = d3({ face: { kind: 'curtain', wall: '#b8c2c8', glass: '#9cb3c4', floor: 3.4, pitch: 1.5 }, lobby: { h: 5, wall: '#9aa3a8' }, roof: '#8a8c8e', parapet: { h: 0.8 }, plant: 1 }) // way/375240430: pale blue glass office
export const d3AragoApts = d3({ ...housing(2.9), face: { kind: 'punched', wall: '#8a8e91', glass: '#4f585e', floor: 2.9, pitch: 1.5, solid: 0.5 } }) // way/82466961: grey-clad apartments
export const d3AragoA = d3(slab(0.5)) // way/82467076
export const d3AragoB = d3(slab(0.48)) // way/82467052
export const d3AragoC = d3(slab(0.5, '#808d96')) // way/82467072
export const d3AragoD = d3(slab(0.46)) // way/82467048
export const d3CaCib = d3({ ...slab(0.42, '#8a9ba8'), plant: 1 }) // way/850085632: CA-CIB, grey bands over blue-grey glass
export const d3AragoLow = d3({ face: { kind: 'bands', wall: '#c4c6c4', glass: '#5d676e', floor: 3.4, solid: 0.5 }, roof: '#8b8c8c' }) // way/82467044
export const d3WhiteTowerN = d3(whiteTower) // way/82323131
export const d3AragoE = d3(slab(0.5)) // way/82467098
export const d3AragoF = d3(slab(0.5)) // way/82467019
export const d3AragoG = d3(slab(0.46)) // way/82467045
export const d3FaubourgA = d3(housing(2.9)) // way/82322843
export const d3WhiteTowerS = d3({ ...whiteTower, face: { ...whiteTower.face, pitch: 1.7 } }) // way/82322925
export const d3FaubourgB = d3(housing(2.9, 0.52)) // way/82323227
export const d3FaubourgC = d3(housing(2.9, 0.5, '#e6dccb')) // way/82322711
export const d3FaubourgD = d3(housing(2.9, 0.48)) // way/82323264
export const d3ArcheStone = d3({ face: { kind: 'curtain', wall: '#d2d0ca', glass: '#8fa3b2', floor: 3.5, pitch: 1.6 }, lobby: { h: 5, wall: '#c7c3ba' }, roof: '#8b8b89', parapet: { h: 1, colour: '#d2d0ca' } }) // way/375239229: pale stone frame, light glass
export const d3FaubourgE = d3(housing(2.9)) // way/82467074
export const d3FaubourgF = d3(housing(2.9, 0.5, '#e6dccb')) // way/82467007
export const d3LyceeAubrac = d3({ face: { kind: 'curtain', wall: '#e2e4e3', glass: '#91a7b5', floor: 3.8, pitch: 1.8 }, roof: '#8d8e8e', parapet: { h: 1 } }) // way/732948290: glass and white panels
export const d3TealGlass = d3({ face: { kind: 'curtain', wall: '#a9b8b8', glass: '#86a8a8', floor: 3.4, pitch: 1.5 }, lobby: { h: 5, wall: '#8e9a9b' }, roof: '#898b8b', parapet: { h: 0.8 }, plant: 1 }) // way/82466982: green-blue glass

export const CLUSTER6 = {
  d3Citadines, d3EgliseEvangelique, d3ArceauxGlass, d3AragoApts, d3AragoA, d3AragoB, d3AragoC, d3AragoD, d3CaCib, d3AragoLow,
  d3WhiteTowerN, d3AragoE, d3AragoF, d3AragoG, d3FaubourgA, d3WhiteTowerS, d3FaubourgB, d3FaubourgC, d3FaubourgD,
  d3ArcheStone, d3FaubourgE, d3FaubourgF, d3LyceeAubrac, d3TealGlass,
}
