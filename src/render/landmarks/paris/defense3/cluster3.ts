import { d3, type D3Look } from './kit.ts'

/**
 * DEFENSE3 CLUSTER 3 (docs/landmarks/defense3-cluster3.tsv): the Courbevoie side east of Les Quatre Temps — the
 * Cojean/Action pavilions, Vive le Vent, Watt and Ampère E+ on the Rue Delarivière-Lefoullon side, the Gallieni
 * and Platanes housing and the beige curved apartment block by Ampère. Heights are BD TOPO (manifest). Looks from
 * each building's own Panoramax frame (tools/panoramax.py, 2026-11-16; scratch d3c3/pmx/<osm id>_0.jpg).
 * Five tsv rows were already claimed (Les 4 Temps: 68252296, 68086780, 636957675, 636957678; Cœur Défense:
 * 226276932) and are not built here.
 */

// pale concrete / stone housing
const CREAM = '#d8d2c4', CREAM_WIN = '#58626a'
const BEIGE_STONE = '#c3b49c', BEIGE_WIN = '#4f5961'
const housing = (wall: string, win: string, pitch = 2.6, floor = 2.9): D3Look => ({
  face: { kind: 'punched', wall, glass: win, floor, pitch, solid: 0.55 }, roof: '#8d8b87', parapet: { h: 0.8 },
})
// white panel checker of the Ampère/Watt campus (frames 82486019, 82486206)
const AMPERE_WHITE = '#e6e8e8', AMPERE_GLASS = '#7f93a6'
const ampere: D3Look = {
  face: { kind: 'punched', wall: AMPERE_WHITE, glass: AMPERE_GLASS, floor: 3.4, pitch: 2.4, solid: 0.42 },
  lobby: { h: 4.5, wall: '#b9bec2', glass: '#46525c' }, roof: '#8e9092', parapet: { h: 0.8 },
}
// reflective sky-blue glass curtains
const SKY = '#88a6c0', SKY_MULL = '#aeb7be'
const blueCurtain = (pitch = 1.5, glass = SKY): D3Look => ({
  face: { kind: 'curtain', wall: SKY_MULL, glass, floor: 3.4, pitch },
  lobby: { h: 5, wall: '#8e959b', glass: '#40505c' }, roof: '#87898b', parapet: { h: 0.6, colour: SKY_MULL },
})

export const d3CourbevoieSlab = d3(housing(CREAM, CREAM_WIN, 2.8)) // way/68851353: pale concrete slab, 5 storeys
// Cojean (way/628760514): blue-green glass box behind tall silver fins
export const d3Cojean = d3({ face: { kind: 'fins', wall: '#c4cacd', glass: '#6f93a3', floor: 5.2, pitch: 1.1, solid: 0.15, depth: 0.5 }, roof: '#8b8d90', parapet: { h: 0.5 } })
// Action (way/628760505): curved clear-glass grid pavilion
export const d3ActionPavilion = d3({ face: { kind: 'curtain', wall: '#9aa3aa', glass: '#8aa1b2', floor: 5.2, pitch: 2.4 }, roof: '#8b8d90', parapet: 'none' })
export const d3QuatreTempsEast = d3({ face: { kind: 'bands', wall: '#c8c9c6', glass: '#6d7f8c', floor: 3.6, solid: 0.45 }, lobby: { h: 5, wall: '#a3a7aa' }, roof: '#8a8b8c' }) // way/68849340
export const d3CourbevoieRoof = d3(housing('#cfc9bd', CREAM_WIN, 2.6, 3.2)) // way/68850701 (frame in an underpass; pale concrete)
export const d3OfficeDelariviere = d3(blueCurtain(1.6, '#7f97ab')) // way/82468276 (frame dark; office glass)
export const d3TerracedBrown = d3({ ...housing('#a99880', '#4b545b', 2.4, 3.0), bands: [{ at: 0.5, depth: 0.8 }] }) // way/68851310
export const d3ViveLeVent = d3(blueCurtain(1.5)) // way/82468249: curved blue glass curtain
export const d3ResidenceGallieni = d3({ face: { kind: 'bands', wall: '#d6d3cb', glass: '#5f6b74', floor: 2.9, solid: 0.5 }, roof: '#8d8b87' }) // way/68849654
export const d3Watt = d3(blueCurtain(2.2, '#7d9fbe')) // way/82486159: curved blue glass grid
export const d3SilverTower = d3({ face: { kind: 'curtain', wall: '#b8bfc4', glass: '#9cb0c0', floor: 3.4, pitch: 1.5 }, lobby: { h: 5, wall: '#8e959b', glass: '#40505c' }, roof: '#87898b', plant: 1 }) // way/68851134
export const d3AmpereEPlus = d3(ampere) // way/82486019
export const d3ChimneyVegetale = d3({ face: { kind: 'blank', wall: '#8f978a' }, roof: '#6f8a5c', parapet: { h: 1.2, colour: '#7d8f6c' } }) // way/186981680: planted vent stack
export const d3CourbevoieTower = d3(housing('#d3cab8', BEIGE_WIN, 2.6)) // way/463852629: pale residential tower
export const d3GlassCrest = d3({ ...blueCurtain(1.8), lobby: { h: 9, wall: '#9a9c9a', glass: '#7a7e80' } }) // way/68850305: glass top on a concrete wall
export const d3LesPlatanes = d3(housing(CREAM, CREAM_WIN, 2.6)) // way/50009536
export const d3BeigeCurveA = d3(housing(BEIGE_STONE, BEIGE_WIN, 1.9, 3.0)) // way/334470345
export const d3BeigeCurveB = d3(housing(BEIGE_STONE, BEIGE_WIN, 1.9, 3.0)) // way/334470346
export const d3BeigeCurveC = d3(housing(BEIGE_STONE, BEIGE_WIN, 1.9, 3.0)) // way/334470348
export const d3AmpereWest = d3(ampere) // way/82486206
export const d3BeigeBlock = d3(housing('#bfb29d', BEIGE_WIN, 2.2, 3.2)) // way/82486305

export const CLUSTER3 = {
  d3CourbevoieSlab, d3Cojean, d3ActionPavilion, d3QuatreTempsEast, d3CourbevoieRoof, d3OfficeDelariviere, d3TerracedBrown,
  d3ViveLeVent, d3ResidenceGallieni, d3Watt, d3SilverTower, d3AmpereEPlus, d3ChimneyVegetale, d3CourbevoieTower,
  d3GlassCrest, d3LesPlatanes, d3BeigeCurveA, d3BeigeCurveB, d3BeigeCurveC, d3AmpereWest, d3BeigeBlock,
}
