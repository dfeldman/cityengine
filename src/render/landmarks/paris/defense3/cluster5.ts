import { d3, type D3Look } from './kit.ts'

/**
 * DEFENSE3 CLUSTER 5 (docs/landmarks/defense3-cluster5.tsv): Courbevoie's edge of La Défense — the Faubourg de
 * l'Arche apartment blocks (rue de Bezons / av. Gambetta), Balzac, Résidence Neuilly Défense, and the low blocks by
 * the boulevard Circulaire. Heights are BD TOPO (manifest). Looks from each building's Panoramax frame
 * (tools/panoramax.py, 2026-11-16; scratch d3c5/pmx/<osm id>_0.jpg). Several frames along the rue de Bezons
 * fence are the same view, so those blocks share the white-render apartment look seen there.
 */

// white rendered apartment slabs with ribbon balconies (most frames along rue de Bezons)
const WHITE = '#e3e1dc', WHITE_WIN = '#5e6870'
const whiteFlats = (pitch = 1.6): D3Look => ({
  face: { kind: 'punched', wall: WHITE, glass: WHITE_WIN, floor: 2.9, pitch, solid: 0.5 },
  lobby: { h: 3.5, wall: '#b9b8b3', glass: '#3e464c' }, roof: '#8d8c89', parapet: { h: 1 },
  bands: [{ at: 0.33, depth: 0.5 }, { at: 0.66, depth: 0.5 }],
})
// pale pink-beige stone flats with shops below (82322863, 82323109, 82322668)
const BEIGE = '#d9cbbd'
const beigeFlats: D3Look = {
  face: { kind: 'punched', wall: BEIGE, glass: '#596169', floor: 2.9, pitch: 1.5, solid: 0.55 },
  lobby: { h: 4, wall: '#a8998c', glass: '#3c4246' }, roof: '#8e8b87', parapet: { h: 0.8 },
}
// white-and-red banded 1970s blocks behind site hoarding (82322850, 82323033)
const redBand: D3Look = {
  face: { kind: 'bands', wall: '#e6e3df', glass: '#6a6f75', floor: 2.9, solid: 0.55 },
  lobby: { h: 3.5, wall: '#c9c5c0', glass: '#41484d' }, roof: '#8e8c8a', parapet: { h: 0.8 },
  bands: [{ at: 0.5, depth: 0.3, colour: '#b7484a' }],
}

export const d3BezonsA = d3(beigeFlats) // way/82322668
export const d3BezonsB = d3(redBand) // way/82322850
export const d3BezonsC = d3({ ...beigeFlats, face: { ...beigeFlats.face, wall: '#d5c4b4' } }) // way/82323109
// way/82322682: salmon-brick court with glazed stair bays and white flats opposite
export const d3BezonsCourt = d3({ face: { kind: 'punched', wall: '#c9a291', glass: '#7d97ad', floor: 2.9, pitch: 1.6, solid: 0.45 }, roof: '#8a8784', parapet: { h: 0.8 } })
export const d3BezonsD = d3(beigeFlats) // way/82322863
export const d3BezonsE = d3(redBand) // way/82323033
// way/82323070: curved cream balcony fronts
export const d3BezonsCurve = d3({ ...whiteFlats(1.8), face: { kind: 'bands', wall: '#e8e4da', glass: '#5d666c', floor: 2.9, solid: 0.5, depth: 0.6 } })
// way/82322960 and 82323156: grey concrete slab over a covered parking deck
const GREY_SLAB: D3Look = { face: { kind: 'punched', wall: '#bdbab3', glass: '#565e64', floor: 2.9, pitch: 1.5, solid: 0.5 }, lobby: { h: 4, wall: '#8c8a85', glass: '#2f3539' }, roof: '#8a8986', parapet: { h: 0.8 } }
export const d3BezonsSlab = d3(GREY_SLAB) // way/82322960
export const d3BezonsSlabB = d3(GREY_SLAB) // way/82323156
export const d3GambettaA = d3(whiteFlats()) // way/82322813
export const d3GambettaB = d3(whiteFlats(1.5)) // way/82323203
export const d3GambettaC = d3(whiteFlats()) // way/82323250
export const d3GambettaD = d3(whiteFlats(1.7)) // way/82323192
export const d3GambettaE = d3(whiteFlats()) // way/82322966
export const d3GambettaF = d3(whiteFlats(1.5)) // way/82322987

// way/50027246: the white office block on the Esplanade edge (pale panels, ribbon glass)
export const d3EsplanadeWhite = d3({ face: { kind: 'bands', wall: '#e5e6e4', glass: '#7f93a5', floor: 3.4, solid: 0.45 }, lobby: { h: 5, wall: '#c3c6c7', glass: '#47535c' }, roof: '#8f9092' })
// Balzac (way/82467071): round drum, dark blue-grey glass panels with silver mullions
export const d3Balzac = d3({ face: { kind: 'curtain', wall: '#a9b1b8', glass: '#4f6274', floor: 3.4, pitch: 1.5 }, lobby: { h: 5, wall: '#8b9196', glass: '#3a4752' }, roof: '#86888b', parapet: { h: 0.7 } })
// Résidence Neuilly Défense (way/82467095): curved white balcony bands, glazed ground floor
export const d3NeuillyDefense = d3({ face: { kind: 'bands', wall: '#e4e2dd', glass: '#7a8892', floor: 2.9, solid: 0.5, depth: 0.8 }, lobby: { h: 4, wall: '#c5bfb4', glass: '#4a554f' }, roof: '#8d8c8a' })
// way/82467012: cream terraced block by the footbridge
export const d3FootbridgeBlock = d3({ face: { kind: 'punched', wall: '#d9d3c6', glass: '#5b636a', floor: 3, pitch: 1.6, solid: 0.5 }, roof: '#8c8a87', parapet: { h: 0.8 } })
// way/82467051: off-white stepped concrete block (frame shows the terraced curve beyond)
export const d3SteppedWhite = d3({ face: { kind: 'bands', wall: '#d8d6d0', glass: '#5d656b', floor: 3, solid: 0.55 }, setbacks: [{ at: 0.75, inset: 2 }], roof: '#8b8a88' })

export const CLUSTER5 = {
  d3BezonsA, d3BezonsB, d3BezonsC, d3BezonsCourt, d3BezonsD, d3BezonsE, d3BezonsCurve, d3BezonsSlab, d3BezonsSlabB,
  d3GambettaA, d3GambettaB, d3GambettaC, d3GambettaD, d3GambettaE, d3GambettaF,
  d3EsplanadeWhite, d3Balzac, d3NeuillyDefense, d3FootbridgeBlock, d3SteppedWhite,
}
