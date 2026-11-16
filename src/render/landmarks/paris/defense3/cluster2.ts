import { d3, type D3Look } from './kit.ts'

/**
 * DEFENSE3 CLUSTER 2 (docs/landmarks/defense3-cluster2.tsv): Les Collines de l'Arche (the Opéra/Triangle office
 * village north-west of the Arche, Puteaux side), and the big glass volumes of Les Quatre Temps west of the CNIT.
 * Heights are BD TOPO (manifest). Each look is set from that building's own Panoramax frame (tools/panoramax.py,
 * 2026-11-16; scratch d3c2/pmx/<osm id>_0.jpg). Colours are named constants so they can be tuned.
 */

// Collines de l'Arche: curved blue reflective glass drums with silver mullions, grey or brown granite flanks
const COL_GLASS = '#7f9fbf', COL_MULL = '#b4bcc3', COL_STONE = '#9c9a94', COL_BROWN = '#7a5a4c', COL_ROOF = '#8a8c8e'
const colDrum = (glass = COL_GLASS, pitch = 1.6): D3Look => ({
  face: { kind: 'curtain', wall: COL_MULL, glass, floor: 3.4, pitch },
  lobby: { h: 5, wall: COL_STONE, glass: '#4b5965' }, roof: COL_ROOF, parapet: { h: 0.6, colour: COL_MULL },
})
const colStone = (wall: string, glass = '#56656f'): D3Look => ({
  face: { kind: 'punched', wall, glass, floor: 3.4, pitch: 1.8, solid: 0.55 },
  lobby: { h: 4.5, wall, glass: '#3f4b54' }, roof: COL_ROOF, parapet: { h: 0.8 },
})

export const d3ColRoof = d3({ ...colDrum('#8aa8c4'), lobby: undefined }) // way/68851269: glass block by the footbridge
export const d3ColCurve = d3(colDrum('#7f98ae', 1.8)) // way/68853050: curved silver-grey glass shell
export const d3ColOpera = d3({ ...colStone(COL_BROWN, '#6b8299'), setbacks: [{ at: 0.55, inset: 0, face: { kind: 'curtain', wall: COL_MULL, glass: COL_GLASS, floor: 3.4, pitch: 1.6 } }] }) // way/68850026 Opéra: brown granite + glass vault
export const d3ColAtrium = d3(colDrum('#86a5c2', 1.4)) // way/68849934: glazed atrium court
export const d3ColGreyDrum = d3({ face: { kind: 'punched', wall: '#7d7f80', glass: '#3f4a52', floor: 3.3, pitch: 2.4, solid: 0.78 }, roof: COL_ROOF, parapet: { h: 0.6 } }) // way/68850503: grey drum, small square windows
export const d3ColPale = d3({ ...colStone('#c9c7c0'), plant: 1 }) // way/68852749: pale stone grid
export const d3ColCable = d3(colDrum('#7a9cbc')) // way/109227970: blue glass block by the cable mast
export const d3ColPorch = d3({ ...colDrum('#8aa6c0'), lobby: { h: 7, wall: '#a8adb1', glass: '#4f5f6c' } }) // way/68850160: drum over pillars
export const d3ColBand = d3({ face: { kind: 'bands', wall: '#a9b1b8', glass: '#6f8ca8', floor: 3.4, solid: 0.25 }, lobby: { h: 5, wall: '#8d9296' }, roof: COL_ROOF }) // way/68849965
export const d3ColWhite = d3({ ...colStone('#d3d4d1', '#5f6f7b'), lobby: { h: 4.5, wall: '#b9bcbd', glass: '#46525b' } }) // way/637247371: white panels
export const d3ColBlack = d3({ face: { kind: 'punched', wall: '#34383c', glass: '#5d6e7c', floor: 3.3, pitch: 1.7, solid: 0.6 }, lobby: { h: 4.5, wall: '#7a6658' }, roof: '#77797b', parapet: { h: 0.6 } }) // way/68849838: black cube, glazed side
export const d3ColBlueA = d3(colDrum('#6f96c4', 1.5)) // way/68851037: bright blue glass
export const d3ColBrick = d3(colStone('#7a4f42', '#4e5c66')) // way/68853142: red-brown block
export const d3ColCircle = d3({ ...colDrum('#7d9cba'), lobby: { h: 7, wall: '#a49684', glass: '#3c4750' } }) // way/68851709: glass bow over beige stone
export const d3ColWedge = d3({ ...colDrum('#7d97ad', 1.8), lobby: { h: 6, wall: '#9da2a6', glass: '#3e4952' } }) // way/109227985
const TRIANGLE: D3Look = { face: { kind: 'punched', wall: '#e1e2df', glass: '#7e93a6', floor: 3.4, pitch: 1.5, solid: 0.42 }, lobby: { h: 5, wall: '#c4c7c8', glass: '#4b5a66' }, roof: COL_ROOF, parapet: { h: 1 } }
export const d3ColTriangleA = d3(TRIANGLE) // way/637247370: white grid
export const d3ColTriangle = d3(TRIANGLE) // way/637247372 Le Triangle
export const d3ColArche = d3(colDrum('#86a4c0', 1.5)) // way/68853487 Collines de l'Arche: glass bow

// Les Quatre Temps west volumes: green-grey glazed vault and steel arcs over the mall fronts
const QT_GLASS = '#8ea4ae', QT_MULL = '#b8bec1', QT_ROOF = '#9a9c9d'
const qtGlass = (glass = QT_GLASS): D3Look => ({
  face: { kind: 'curtain', wall: QT_MULL, glass, floor: 4.5, pitch: 2.2 },
  lobby: { h: 7, wall: '#c5c7c5', glass: '#3f4a51' }, roof: QT_ROOF, parapet: { h: 1, colour: QT_MULL },
})
export const d3QtWestA = d3(qtGlass('#93a8b4')) // way/628785928
export const d3QtWestB = d3(qtGlass()) // way/628785927: LES QUATRE TEMPS lettering front
export const d3QtWestC = d3(qtGlass('#8aa1ac')) // way/68086786
export const d3QtArcA = d3({ face: { kind: 'curtain', wall: '#8f979c', glass: '#5b6f7e', floor: 5, pitch: 3 }, roof: QT_ROOF, parapet: 'none' }) // way/628760501: steel-ribbed glass arc
export const d3QtRetail = d3({ face: { kind: 'curtain', wall: '#d8dcdd', glass: '#a9bccb', floor: 3.6, pitch: 1.4 }, roof: QT_ROOF }) // way/109227987: white fins
export const d3QtWestD = d3({ ...qtGlass('#91a6b0'), bands: [{ at: 0.6, depth: 0.6, colour: '#6f8f5a' }] }) // way/68086783
export const d3QtArcB = d3({ face: { kind: 'curtain', wall: '#9aa2a7', glass: '#6a8295', floor: 5, pitch: 3 }, roof: QT_ROOF, parapet: 'none' }) // way/628591476
export const d3QtWestE = d3({ ...qtGlass('#8299a4'), lobby: { h: 7, wall: '#5f8a4c', glass: '#3f4a51' } }) // way/68094166: green panel front

export const CLUSTER2 = {
  d3ColRoof, d3ColCurve, d3ColOpera, d3ColAtrium, d3ColGreyDrum, d3ColPale, d3ColCable, d3ColPorch, d3ColBand, d3ColWhite,
  d3ColBlack, d3ColBlueA, d3ColBrick, d3ColCircle, d3ColWedge, d3ColTriangleA, d3ColTriangle, d3ColArche,
  d3QtWestA, d3QtWestB, d3QtWestC, d3QtArcA, d3QtRetail, d3QtWestD, d3QtArcB, d3QtWestE,
}
