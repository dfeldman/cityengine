import { d3, type D3Look } from './kit.ts'

/**
 * DEFENSE3 TIER C (docs/landmarks/defense3-tierC.txt): the 34 unnamed ≥37 m blocks round the core — mostly Puteaux /
 * Courbevoie / Nanterre residential slabs. Heights are BD TOPO (manifest). Looks from one Panoramax frame each or per
 * group (tools/panoramax.py, 2026-11-16; scratch d3c8/pmx/<osm id>_0.jpg). Colours are named so they can be tuned.
 */

// Puteaux's neo-classical residences (owner bugs 17/18, "tall fake classical buildings"): cream stone, arched loggias,
// a darker zinc attic. Frames 170823628, 68853378, 68853097, 68853223, 63969741.
const STONE = '#dccfae', STONE_WARM = '#e0d2b0', STONE_PALE = '#e6dcc4', STONE_WIN = '#6c7b88', ZINC = '#6f7479', ZINC_WIN = '#3e464d'
const classical = (wall = STONE, pitch = 2.4): D3Look => ({
  face: { kind: 'punched', wall, glass: STONE_WIN, floor: 2.9, pitch, solid: 0.58 },
  lobby: { h: 5, wall: '#c9b98f', glass: '#5a636a' }, roof: '#6e7377', parapet: { h: 1 },
  setbacks: [{ at: 0.9, inset: 1.4, face: { kind: 'punched', wall: ZINC, glass: ZINC_WIN, floor: 2.9, pitch, solid: 0.6 } }],
  bands: [{ at: 5, depth: 0.5, colour: '#efe6cf' }],
})
// brick-and-white-balcony 1960s blocks (frames 68850467, 68850504)
const BRICK = '#a05c48', BRICK_WIN = '#b4aea4'
const brick: D3Look = { face: { kind: 'bands', wall: BRICK, glass: BRICK_WIN, floor: 2.9, solid: 0.5, depth: 0.5 }, lobby: { h: 4, wall: '#8c5340', glass: '#4a5157' }, roof: '#7d7f81', parapet: { h: 0.8 } }
// white balcony slabs
const WHITE = '#e6e5e0', WHITE_WIN = '#76828b'
const whiteSlab = (floor = 2.9, depth = 0.6): D3Look => ({ face: { kind: 'bands', wall: WHITE, glass: WHITE_WIN, floor, solid: 0.5, depth }, lobby: { h: 4, wall: '#bdbdb8', glass: '#4a5157' }, roof: '#8d8d8b', parapet: { h: 0.9 } })

// Puteaux, rue des Bergères / boulevard Circulaire (2.219–2.2285, 48.886–48.888): the classical family
export const d3cBergeres1 = d3(classical(STONE))           // way/170823628, 20 storeys
export const d3cBergeres2 = d3(classical(STONE_WARM))      // way/68853378
export const d3cBergeres3 = d3(classical(STONE))           // way/68853097
export const d3cBergeres4 = d3(classical(STONE_PALE))      // way/68853223
export const d3cBergeres5 = d3(classical(STONE_WARM))      // way/63969741
export const d3cBergeresTower = d3({ ...classical('#cdbfa0', 2.2), setbacks: [{ at: 0.92, inset: 1, face: { kind: 'punched', wall: '#d8cdb0', glass: STONE_WIN, floor: 2.9, pitch: 2.2, solid: 0.6 } }] }) // way/68850640: rubble-stone corner tower
// the same estate, west of the Pont de Neuilly axis (frames on the road show only parapets; same stone family assumed)
export const d3cBergeres6 = d3(classical(STONE_PALE))     // way/75179619
export const d3cBergeres7 = d3(classical(STONE))           // way/104212415
export const d3cBergeres8 = d3(classical(STONE_WARM))      // way/104212825
export const d3cBergeres9 = d3(classical(STONE))           // way/104213069
export const d3cBergeres10 = d3(classical(STONE_PALE))     // way/104213469
export const d3cBergeres11 = d3(classical(STONE_WARM))     // way/104213561
export const d3cBergeres12 = d3(classical(STONE))          // way/304921831
export const d3cBergeres13 = d3(classical(STONE_WARM))     // way/104212986 (18 storeys)
export const d3cBergeres14 = d3(classical(STONE_PALE))     // way/104213389
export const d3cBergeres15 = d3(classical(STONE))          // way/355710848

export const d3cBalconyStack = d3(whiteSlab(3, 0.9))       // way/637810233: stacked cantilevered white balconies (frame)
export const d3cGorkiTower = d3(whiteSlab())               // way/58255258: 20 storeys by Espace Gorki
export const d3cBrickA = d3(brick)                         // way/68850467
export const d3cBrickB = d3(brick)                         // way/68850504
export const d3cBrickC = d3({ ...brick, lobby: { h: 4, wall: '#8c5340', glass: '#4a5157' } }) // way/68849603
export const d3cDiscSlabA = d3({ face: { kind: 'punched', wall: '#d8d9d6', glass: '#6f7a83', floor: 2.9, pitch: 2, solid: 0.55 }, roof: '#8d8d8b' }) // way/68852351
export const d3cDiscSlabB = d3({ face: { kind: 'punched', wall: '#d4d6d3', glass: '#6f7a83', floor: 2.9, pitch: 2, solid: 0.55 }, roof: '#8d8d8b' }) // way/68853490
export const d3cRotundaOffice = d3({ face: { kind: 'curtain', wall: '#d6dde0', glass: '#9db7c4', floor: 3.5, pitch: 1.6 }, lobby: { h: 5, wall: '#e8e8e6', glass: '#6a7f8c' }, roof: '#8d9094', parapet: { h: 0.6 } }) // way/68851009: round glass drum on white columns
export const d3cWhiteOverGlass = d3({ face: { kind: 'punched', wall: '#e8e8e4', glass: '#6a7780', floor: 3.2, pitch: 2, solid: 0.6 }, lobby: { h: 4.5, wall: '#c8cfd2', glass: '#7f9aa8' }, roof: '#8d8d8b' }) // way/68851055: white shaft over a glazed rotunda
export const d3cBalconyEstate = d3(whiteSlab(2.9, 0.7))    // way/68851156
export const d3cWhiteSlabDefense = d3(whiteSlab(2.9, 0.6)) // way/68852608
export const d3cNanterreSlabA = d3(whiteSlab(2.9, 0.5))    // way/82322709
export const d3cNanterreSlabB = d3({ ...whiteSlab(2.9, 0.5), face: { kind: 'bands', wall: '#dedcd5', glass: '#6f7a83', floor: 2.9, solid: 0.5, depth: 0.5 } }) // way/82323129
export const d3cReedBlock = d3({ face: { kind: 'bands', wall: '#cfd2d3', glass: '#7f94a2', floor: 3.4, solid: 0.4, depth: 0.3 }, lobby: { h: 5, wall: '#a9b0b4', glass: '#6fa5ab' }, roof: '#8d9094' }) // way/729340305: beside the teal-glass Reed Expositions hall
export const d3cHotelGrid = d3({ face: { kind: 'punched', wall: '#b9bdc0', glass: '#6f8296', floor: 3, pitch: 1.8, solid: 0.55 }, lobby: { h: 4.5, wall: '#8e9498', glass: '#4f5f6c' }, roof: '#80838a', plant: 1 }) // relation/5584008: Mercure hotel tower
export const d3cBeigeBalconies = d3({ face: { kind: 'bands', wall: '#d9ccb0', glass: '#8a9198', floor: 2.9, solid: 0.55, depth: 0.6 }, lobby: { h: 4, wall: '#b3a68c', glass: '#4a5157' }, roof: '#8f8a83', parapet: { h: 1 } }) // way/1361938169
export const d3cGlassOffice = d3({ face: { kind: 'curtain', wall: '#b8c2c8', glass: '#a9b8c4', floor: 3.5, pitch: 1.5 }, lobby: { h: 5, wall: '#9aa3a8' }, roof: '#8a8c8e', parapet: { h: 0.8 } }) // way/1359865609
export const d3cNanterreTower = d3({ ...whiteSlab(2.9, 0.5), face: { kind: 'bands', wall: '#e0dfd8', glass: '#6f7a83', floor: 2.9, solid: 0.5, depth: 0.5 } }) // way/1389195390

export const TIERC: Record<string, ReturnType<typeof d3>> = {
  d3cBergeres1, d3cBergeres2, d3cBergeres3, d3cBergeres4, d3cBergeres5, d3cBergeresTower,
  d3cBergeres6, d3cBergeres7, d3cBergeres8, d3cBergeres9, d3cBergeres10, d3cBergeres11, d3cBergeres12, d3cBergeres13, d3cBergeres14, d3cBergeres15,
  d3cBalconyStack, d3cGorkiTower, d3cBrickA, d3cBrickB, d3cBrickC, d3cDiscSlabA, d3cDiscSlabB, d3cRotundaOffice, d3cWhiteOverGlass,
  d3cBalconyEstate, d3cWhiteSlabDefense, d3cNanterreSlabA, d3cNanterreSlabB, d3cReedBlock, d3cHotelGrid, d3cBeigeBalconies, d3cGlassOffice, d3cNanterreTower,
}
