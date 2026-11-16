import { d3, type D3Look } from './kit.ts'

/**
 * DEFENSE3 CLUSTER 1 (docs/landmarks/defense3-cluster1.tsv): the lesser buildings round the Grande Arche — the
 * Michelet/Arche-sud blocks, Les Quatre Temps' east end, Le Belvédère, the Palatins, Le Vinci and the Rue Nélaton
 * wing. Heights are BD TOPO (manifest). Each look is set from that building's own Panoramax frame
 * (tools/panoramax.py, 2026-11-16; scratch d3/pmx/<osm id>_0.jpg) — colours are named so they can be tuned.
 */

// Arche-sud blocks (way/68127484, -505, -514, -524): dark grey granite drums, small punched windows
const GRANITE = '#62666b', GRANITE_WIN = '#363e45'
const graniteBlock = (pitch: number): D3Look => ({
  face: { kind: 'punched', wall: GRANITE, glass: GRANITE_WIN, floor: 3.3, pitch, solid: 0.62 },
  lobby: { h: 4.5, wall: '#4c5156', glass: '#2f383f' }, roof: '#77797b', parapet: { h: 0.8 },
})
// the curved glass drums on a grey granite plinth (way/68127509, -529, -536, -550): sky-blue reflective glass
const SKY_GLASS = '#93abc0', SKY_MULL = '#a7b0b7', PLINTH = '#71767c'
const glassDrum = (pitch: number): D3Look => ({
  face: { kind: 'curtain', wall: SKY_MULL, glass: SKY_GLASS, floor: 3.4, pitch },
  lobby: { h: 7.5, wall: PLINTH, glass: '#5e666d' }, roof: '#85878a', parapet: { h: 0.6, colour: SKY_MULL },
})

export const d3ArcheSudA = d3(graniteBlock(2.4)) // way/68127505
export const d3ArcheSudB = d3(graniteBlock(2.6)) // way/68127514
export const d3ArcheSudC = d3(graniteBlock(2.4)) // way/68127524
export const d3ArcheSudD = d3({ ...graniteBlock(2.8), lobby: { h: 6, wall: '#555a5f', glass: '#4a5864' } }) // way/68127484: glazed foot
export const d3ArcheSudE = d3(glassDrum(1.6)) // way/68127509
export const d3ArcheSudF = d3(glassDrum(1.6)) // way/68127529
export const d3ArcheSudG = d3({ ...glassDrum(1.8), plant: 1 }) // way/68127536 (office)
export const d3ArcheSudH = d3(glassDrum(1.6)) // way/68127550
// way/68127482 and -491: the plaza side, a white panel wall (frame 68127482_0 shows its pale edge), 8 storeys
export const d3ArcheSudI = d3({ face: { kind: 'punched', wall: '#d5d6d3', glass: '#5d6a74', floor: 3.6, pitch: 1.8, solid: 0.45 }, roof: '#8a8b8c' })
export const d3ArcheSudJ = d3({ face: { kind: 'bands', wall: '#d0d2d0', glass: '#6a7c8a', floor: 3.6, solid: 0.42 }, lobby: { h: 5, wall: '#9fa4a8' }, roof: '#8a8b8c' })

// Les Quatre Temps, east end (way/68127494 Auchan drum, way/68127544 Westfield front): pale grey perforated panels
export const d3QuatreTempsDrum = d3({ face: { kind: 'punched', wall: '#c4c8ca', glass: '#7d8489', floor: 4.2, pitch: 2.2, solid: 0.88 }, roof: '#9a9c9d', parapet: { h: 1.2 } })
export const d3QuatreTempsFront = d3({ cutDome: true, face: { kind: 'blank', wall: '#e2e3e1' }, lobby: { h: 6, wall: '#bfc3c5', glass: '#4f5a62' }, roof: '#9a9c9d', parapet: { h: 1.5, colour: '#ecedeb' } })

// Le Belvédère (1-7 Cours Valmy, 1997, ex-KPMG): crescent of blue glass behind silver horizontal louvres
export const d3Belvedere = d3({
  face: { kind: 'bands', wall: '#c3c8cc', glass: '#6e8fae', floor: 3.4, solid: 0.22, depth: 0.5 },
  lobby: { h: 5, wall: '#a9b0b5', glass: '#3f5262' }, roof: '#8b8d90', parapet: { h: 1, colour: '#c3c8cc' }, plant: 1,
})

// the Palatins (Courbevoie): Palatin II & III and its neighbour way/68849395 are a long green-blue curtain over a pale stone base
const PALATIN_GLASS = '#7f9fa3', PALATIN_MULL = '#b3bab8', PALATIN_STONE = '#cbc4b4'
export const d3Palatin2 = d3({ face: { kind: 'curtain', wall: PALATIN_MULL, glass: PALATIN_GLASS, floor: 3.3, pitch: 1.5 }, lobby: { h: 6.5, wall: PALATIN_STONE, glass: '#59666b' }, roof: '#8d8f8e', parapet: { h: 0.7, colour: PALATIN_MULL } })
export const d3Palatin2East = d3({ face: { kind: 'curtain', wall: PALATIN_MULL, glass: '#86a3a8', floor: 3.3, pitch: 1.5 }, lobby: { h: 6.5, wall: PALATIN_STONE, glass: '#59666b' }, roof: '#8d8f8e', parapet: { h: 0.7, colour: PALATIN_MULL } })
// Le Palatin, Madeleine and the roof block way/68852637: charcoal panel grids with glazed corner bays and atrium
const CHARCOAL = '#5c6065', CHARCOAL_WIN = '#3d474f'
export const d3Palatin = d3({ face: { kind: 'punched', wall: '#686c70', glass: '#4d6070', floor: 3.4, pitch: 1.6, solid: 0.45 }, lobby: { h: 6, wall: '#7e8f9c', glass: '#6a8aa3' }, roof: '#7d7f81', parapet: { h: 0.8 } })
export const d3Madeleine = d3({ face: { kind: 'punched', wall: CHARCOAL, glass: CHARCOAL_WIN, floor: 3.3, pitch: 1.5, solid: 0.5 }, lobby: { h: 4.5, wall: '#4b5055', glass: '#4a5a66' }, roof: '#7d7f81', parapet: { h: 0.8 } })
export const d3PalatinRoof = d3({ face: { kind: 'punched', wall: CHARCOAL, glass: CHARCOAL_WIN, floor: 3.3, pitch: 1.5, solid: 0.5 }, setbacks: [{ at: 0.8, inset: 1.5, face: { kind: 'curtain', wall: '#9ea8af', glass: '#7f9db4', floor: 3.3, pitch: 1.5 } }], roof: '#7d7f81' })
// way/68850129: a blue glass drum (3 storeys over the dalle)
export const d3BlueDrum = d3({ face: { kind: 'curtain', wall: '#a5b0b9', glass: '#7898b8', floor: 3.5, pitch: 1.6 }, roof: '#888a8c', parapet: { h: 0.6 } })
// way/68849712: blue glass behind closely spaced silver fins, sharp prow
export const d3SilverFins = d3({ face: { kind: 'fins', wall: '#c2c7cb', glass: '#6f8eaa', floor: 3.5, pitch: 1.4, solid: 0.18, depth: 0.45 }, lobby: { h: 5, wall: '#8d9398' }, roof: '#8b8d90' })
// Le Vinci (north of the Arche): red-brown polished granite with a curved blue glass bay
export const d3Vinci = d3({ face: { kind: 'punched', wall: '#7b4c3d', glass: '#6e8ca3', floor: 3.5, pitch: 1.8, solid: 0.55 }, lobby: { h: 5, wall: '#5e3b30', glass: '#3f4d58' }, roof: '#7a6e69', parapet: { h: 1, colour: '#6e4436' } })

// Puteaux, Rue Nélaton / bd Circulaire: way/68850163, a blue-grey glass drum over a grey concrete foot
export const d3NelatonDrum = d3({ face: { kind: 'curtain', wall: '#9ea8b0', glass: '#8199b0', floor: 3.4, pitch: 1.5 }, lobby: { h: 4.5, wall: '#8a8d90', glass: '#3e474e' }, roof: '#87898b', parapet: { h: 0.6 } })
// the low wing along Rue Nélaton (13 & 15, -2195, -3396): dark vertical fins under a deep grey concrete overhang
const NELATON: D3Look = {
  face: { kind: 'fins', wall: '#5a6065', glass: '#6c7a84', floor: 3.2, pitch: 1.2, solid: 0.3, depth: 0.4 },
  lobby: { h: 4, wall: '#7f8285', glass: '#2f363b' }, roof: '#8a8c8d', parapet: { h: 1.6, colour: '#9a9c9b' },
  bands: [{ at: 0.97, depth: 2.2, colour: '#9a9c9b' }],
}
export const d3Nelaton13 = d3(NELATON) // way/68849638
export const d3Nelaton15 = d3(NELATON) // way/68849716 — same wing, same frame
export const d3NelatonB = d3({ ...NELATON, face: { ...NELATON.face, pitch: 1.3 } }) // way/68852195
export const d3NelatonC = d3({ ...NELATON, face: { ...NELATON.face, glass: '#76838c' } }) // way/68853396

export const CLUSTER1 = {
  d3ArcheSudA, d3ArcheSudB, d3ArcheSudC, d3ArcheSudD, d3ArcheSudE, d3ArcheSudF, d3ArcheSudG, d3ArcheSudH, d3ArcheSudI, d3ArcheSudJ,
  d3QuatreTempsDrum, d3QuatreTempsFront, d3Belvedere, d3Palatin2, d3Palatin2East, d3Palatin, d3Madeleine, d3PalatinRoof,
  d3BlueDrum, d3SilverFins, d3Vinci, d3NelatonDrum, d3Nelaton13, d3Nelaton15, d3NelatonB, d3NelatonC,
}
