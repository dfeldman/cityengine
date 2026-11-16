import { d3, type D3Look } from './kit.ts'

/**
 * DEFENSE3 CLUSTER 4 (docs/landmarks/defense3-cluster4.tsv): the Courbevoie edge east of the Esplanade — the
 * Faubourg de l'Arche blocks (Ellipse, Lafayette, Lavoisier, the white chequer pair), the Rue de Bezons/Rue Louis
 * Blanc flats, and the Puteaux side (Les Trois Arbres, Le Galilée, Euronext, Monge, Le Moretti, Vision 80).
 * Heights are BD TOPO (manifest). Looks from each building's own Panoramax frame (tools/panoramax.py, 2026-11-16;
 * scratch d3c4/pmx/<osm id>_0.jpg); where the frame missed the building the look is the street's type, marked "~".
 */

// shared palette (tunable)
const SKY_GLASS = '#8eaac2', SILVER = '#b9c0c6', ROOF = '#8b8d8f'
const CREAM = '#ddd6c6', WHITE = '#e6e6e2', BUFF = '#c8b796'

// white residential slabs with ribbon balconies (Rue de Bezons / Louis Blanc)
const flats = (wall: string, glass = '#5f6b74'): D3Look => ({
  face: { kind: 'bands', wall, glass, floor: 2.9, solid: 0.5, depth: 0.6 },
  lobby: { h: 4, wall: '#8d9296', glass: '#3c454c' }, roof: ROOF, parapet: { h: 1 },
})
// the two white chequer-glass ovals (way/82485980, -6058): white panels, staggered square windows
const chequer: D3Look = {
  face: { kind: 'punched', wall: '#e9eae8', glass: '#6f8494', floor: 3.3, pitch: 1.5, solid: 0.55 },
  lobby: { h: 4.5, wall: '#c9ccce', glass: '#45525c' }, roof: ROOF, parapet: { h: 0.8 },
}
// blue reflective curved curtain (way/50027232, -66934)
const blueMirror: D3Look = {
  face: { kind: 'curtain', wall: SILVER, glass: SKY_GLASS, floor: 3.4, pitch: 1.5 },
  roof: ROOF, parapet: { h: 0.6, colour: SILVER },
}

export const d3Ellipse = d3({ ...blueMirror, face: { ...blueMirror.face, glass: '#86a3bd', pitch: 1.4 }, lobby: { h: 5, wall: '#a8b0b6', glass: '#455866' }, plant: 1 }) // way/82486290 ~ glass oval
export const d3TroisArbres = d3({ face: { kind: 'bands', wall: CREAM, glass: '#6d7f8c', floor: 3.4, solid: 0.45 }, lobby: { h: 5, wall: '#b0aea6', glass: '#46535c' }, roof: ROOF, plant: 1 }) // way/186981697
export const d3Chequer1 = d3(chequer) // way/82485980
export const d3Chequer2 = d3(chequer) // way/82486058
export const d3BuffDrum = d3({ face: { kind: 'punched', wall: BUFF, glass: '#4f5a62', floor: 3.2, pitch: 1.6, solid: 0.6 }, lobby: { h: 4.5, wall: '#a8987a', glass: '#3b444b' }, roof: ROOF }) // way/82486196
export const d3Courbevoie18 = d3({ face: { kind: 'punched', wall: '#d8d5cc', glass: '#58646d', floor: 3.2, pitch: 1.8, solid: 0.5 }, roof: ROOF }) // way/82486254 ~
export const d3LouisBlanc = d3(flats('#ece9e1')) // way/82486088
export const d3WhiteHall = d3({ face: { kind: 'blank', wall: '#e4e5e3' }, roof: '#9a9c9d', parapet: { h: 1.2, colour: '#eeeeec' } }) // way/82322968: white ribbed metal box
export const d3Galilee = d3({ face: { kind: 'punched', wall: '#cfccc4', glass: '#4e5961', floor: 3.4, pitch: 1.8, solid: 0.55, depth: 0.5 }, lobby: { h: 6, wall: '#a7a49d', glass: '#3a434a' }, roof: ROOF }) // way/50029603
export const d3Bezons337 = d3(flats(WHITE)) // way/334470337
export const d3Vision80 = d3({ face: { kind: 'punched', wall: '#c9c8c3', glass: '#4b555c', floor: 2.9, pitch: 1.5, solid: 0.55 }, setbacks: [{ at: 0.9, inset: 1, face: { kind: 'bands', wall: '#55595d', glass: '#3c454c', floor: 2.9, solid: 0.4 } }], lobby: { h: 4, wall: '#8e8d89', glass: '#353d43' }, roof: ROOF }) // way/82468233
export const d3Euronext = d3({ face: { kind: 'fins', wall: '#ddd5c4', glass: '#5f8a8e', floor: 3.5, pitch: 1.6, solid: 0.35, depth: 0.5 }, lobby: { h: 7, wall: '#cfc6b3', glass: '#3f6468' }, roof: ROOF, parapet: { h: 1.2 } }) // way/386007522
export const d3Capucine = d3(flats('#cdc6b8', '#56616a')) // way/334470338: beige flats, café at foot
export const d3Monge = d3({ face: { kind: 'curtain', wall: '#8fa2a8', glass: '#5f8aa0', floor: 3.5, pitch: 1.5 }, setbacks: [{ at: 0.86, inset: 2 }], lobby: { h: 5, wall: '#7f8c92', glass: '#3c5260' }, roof: ROOF, parapet: { h: 0.8, colour: '#a2b0b5' } }) // way/82467060
const DALLE_CONCRETE: D3Look = { face: { kind: 'punched', wall: '#9d9b95', glass: '#4a5157', floor: 3.3, pitch: 2, solid: 0.65 }, roof: '#85878a', parapet: { h: 1.1, colour: '#b0aea8' } }
export const d3DalleEdgeA = d3(DALLE_CONCRETE) // way/82466993: concrete under the dalle
export const d3DalleEdgeB = d3({ ...DALLE_CONCRETE, face: { ...DALLE_CONCRETE.face, wall: '#a7a49c' } }) // way/82467046 ~
export const d3LouisBlanc419 = d3(flats('#e3e0d8')) // way/334718419 ~
export const d3BeigeTower = d3({ ...flats('#cbbfa6', '#4e575e'), face: { kind: 'bands', wall: '#cbbfa6', glass: '#4e575e', floor: 2.9, solid: 0.55, depth: 0.8 } }) // way/82467038: beige concrete balconies
export const d3BlueMirrorA = d3(blueMirror) // way/50027232
export const d3Moretti = d3({ face: { kind: 'punched', wall: '#d9d1c0', glass: '#5a6670', floor: 3.3, pitch: 1.7, solid: 0.5 }, lobby: { h: 5, wall: '#b8b0a0', glass: '#3e474e' }, roof: ROOF }) // way/82467008 ~
export const d3Lafayette = d3({ face: { kind: 'punched', wall: '#9a6a55', glass: '#7e98ab', floor: 3.4, pitch: 2.4, solid: 0.38 }, lobby: { h: 4.5, wall: '#7c5646', glass: '#48565f' }, roof: ROOF, parapet: { h: 0.9 } }) // way/82322823: brown panels, big glass bays
export const d3BeigeRibbon = d3({ face: { kind: 'bands', wall: '#cbbd9f', glass: '#7590a6', floor: 3.3, solid: 0.55 }, roof: ROOF }) // way/82323212
export const d3Lavoisier = d3({ face: { kind: 'curtain', wall: '#a0786a', glass: '#9fb2c0', floor: 3.4, pitch: 1.8 }, lobby: { h: 4.5, wall: '#8a5f50', glass: '#4b5963' }, roof: ROOF, parapet: { h: 0.8 } }) // way/93571577: silver glass bow on brown brick
export const d3BlueMirrorB = d3({ ...blueMirror, face: { ...blueMirror.face, glass: '#7f9cb5' } }) // way/82466934
export const d3Bezons984 = d3({ ...flats('#ebe9e4'), bands: [{ at: 0.5, depth: 0.3, colour: '#b5524a' }] }) // way/82322984: white with a red band
export const d3Office64 = d3({ face: { kind: 'punched', wall: '#dcd8cf', glass: '#5b6872', floor: 3.4, pitch: 1.6, solid: 0.55 }, lobby: { h: 5, wall: '#b3b0a9', glass: '#3f4950' }, roof: ROOF, plant: 1 }) // way/64226470

export const CLUSTER4 = {
  d3Ellipse, d3TroisArbres, d3Chequer1, d3Chequer2, d3BuffDrum, d3Courbevoie18, d3LouisBlanc, d3WhiteHall,
  d3Galilee, d3Bezons337, d3Vision80, d3Euronext, d3Capucine, d3Monge, d3DalleEdgeA, d3DalleEdgeB, d3LouisBlanc419,
  d3BeigeTower, d3BlueMirrorA, d3Moretti, d3Lafayette, d3BeigeRibbon, d3Lavoisier, d3BlueMirrorB, d3Bezons984, d3Office64,
}
