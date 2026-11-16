import { d3, type D3Look } from './kit.ts'

/**
 * DEFENSE3 NAMED (docs/landmarks/DEFENSE-UNMODELLED.tsv, rows with a name, 2026-11-16): the named Défense / Courbevoie /
 * Puteaux buildings the first passes left to the generic bake. One shared parametric kit: each building is a preset
 * (office / apartment / mall / shop / school / utility) with per-building colour and grid overrides, set from the
 * Défense's usual palettes and the building's use (no per-building photo was taken, see defense3.json notes). Heights are in the
 * manifest (BD TOPO, else OSM levels x LEVEL_H, else a use default). Everything tunable is a named constant.
 */

const LEVEL_H = 3.2

const glassOffice = (wall: string, glass: string, floor = 3.6, pitch = 1.5): D3Look => ({
  face: { kind: 'curtain', wall, glass, floor, pitch },
  lobby: { h: 5, wall: '#9aa3a8' }, roof: '#8a8c8e', parapet: { h: 0.8 }, plant: 1,
})
const bandOffice = (wall: string, glass: string, solid = 0.45): D3Look => ({
  face: { kind: 'bands', wall, glass, floor: 3.5, solid, depth: 0.35 },
  lobby: { h: 4.5, wall: '#a9b0b4', glass: '#5d6f7a' }, roof: '#8d9094', parapet: { h: 0.9 },
})
const apartments = (wall: string, glass = '#6f7a83', solid = 0.55, depth = 0.5): D3Look => ({
  face: { kind: 'punched', wall, glass, floor: LEVEL_H - 0.2, pitch: 2.1, solid, depth },
  lobby: { h: 4, wall: '#a8a398', glass: '#4a5157' }, roof: '#85837f', parapet: { h: 1 },
})
const balconyBlock = (wall: string): D3Look => ({
  face: { kind: 'bands', wall, glass: '#7a8791', floor: LEVEL_H - 0.2, solid: 0.55, depth: 0.6 },
  roof: '#85837f', parapet: { h: 1 },
})
const lowShop = (wall: string, glass = '#6a7f8c'): D3Look => ({
  face: { kind: 'curtain', wall, glass, floor: 4, pitch: 2.4 }, roof: '#7c7e80', parapet: { h: 0.5 },
})

export const NAMED: Record<string, ReturnType<typeof d3>> = {
  d3nResidenceDefense: d3(balconyBlock('#d6cdb8')),                    // relation/405756, 8 storeys
  d3nBoieldieu: d3(apartments('#d9d2c0')),                            // relation/405777, 31 m BD TOPO
  d3nOasis: d3(apartments('#cfc7b4', '#6f7a83', 0.5, 0.6)),            // way/68849937
  d3nPalaisJeunesse: d3({ ...apartments('#c8c6c0'), setbacks: [{ at: 0.7, inset: 1.2 }] }), // way/68850745
  d3nSilverIsland: d3(lowShop('#b9bec2', '#7f94a2')),                  // way/68851140 low commercial, lidar ~5 m
  d3nDiamant: d3(glassOffice('#cfd6da', '#8fb0c0', 3.4, 1.4)),         // way/68851393
  d3nCentralTel: d3({ face: { kind: 'bands', wall: '#bfbcb4', glass: '#6f7a83', floor: 3.7, solid: 0.7, depth: 0.3 }, roof: '#7c7e80', parapet: { h: 1 }, plant: 2 }), // way/68851558 telephone exchange: heavy, few windows
  d3nAltiplano: d3(bandOffice('#dcdcd8', '#6f8fa0', 0.4)),            // relation/1082711
  d3nLinea: d3(apartments('#dcd6c8', '#78858f', 0.5, 0.45)),          // way/68852021
  d3nCBC: d3(glassOffice('#c3ccd1', '#7d97a6', 3.5, 1.5)),            // way/68852052, 8 storeys
  d3nTriangle: d3({ ...glassOffice('#c9d3d8', '#86a3b3', 3.4, 1.5), bands: [{ at: 0.5 }] }), // relation/4105
  d3nWilson: d3(bandOffice('#d3d3cf', '#6f8696', 0.45)),              // way/68852225
  d3nJulesVerne: d3({ face: { kind: 'curtain', wall: '#b6b9ba', glass: '#7d97a6', floor: 4.5, pitch: 1.8 }, roof: '#80838a', parapet: { h: 0.6 } }), // relation/1082746 library
  d3nBellini: d3(apartments('#d0c3a8')),                              // way/68853067
  d3nSagittaire: d3({ ...bandOffice('#d8d4c8', '#7a8791', 0.5), lobby: { h: 5, wall: '#8e9498', glass: '#7f9aa8' } }), // way/82322880 (retail ground)
  d3nDestinationCourbevoie: d3(lowShop('#c8cdd0', '#7f94a2')),        // way/82323040 info pavilion
  d3nCharras: d3({ face: { kind: 'bands', wall: '#c9c6bc', glass: '#6f7a83', floor: 5, solid: 0.65, depth: 0.3 }, roof: '#80838a', parapet: { h: 1.2 } }), // way/82323172 shopping centre
  d3nChancellerie2: d3(apartments('#d6cfc0')),                        // way/82323199
  d3nBalconsAlma: d3(balconyBlock('#d9d1bd')),                        // way/82323249
  d3nAncre: d3(apartments('#d4cdbd')),                                // relation/1239831
  d3nPosteAlsace: d3({ face: { kind: 'punched', wall: '#a6a49e', glass: '#4a5157', floor: 4, pitch: 4, solid: 0.9 }, roof: '#6f7072', parapet: 'none' }), // way/82467033 substation
  d3nLorraine: d3(apartments('#cdc3ae', '#6f7a83', 0.55, 0.6)),       // relation/1239835
  d3nCapG: d3(glassOffice('#d0d8dc', '#8fb0c0', 3.4, 1.4)),           // way/82486048
  d3nFlorian: d3(apartments('#e0d9c8')),                              // way/82486067
  d3nGuynemer: d3(bandOffice('#d6d6d2', '#6f8696', 0.4)),             // way/82486096
  d3nSGAM: d3({ ...bandOffice('#d0cfca', '#6d8494', 0.45), setbacks: [{ at: 0.85, inset: 1.5 }] }), // relation/1240026
  d3nDeVinci: d3({ face: { kind: 'curtain', wall: '#c4ccd0', glass: '#7d97a6', floor: 4, pitch: 1.8 }, lobby: { h: 5, wall: '#8e9498' }, roof: '#80838a', parapet: { h: 0.8 } }), // way/82486165 university
  d3nLatitude: d3(glassOffice('#c5ced3', '#7d97a6', 3.5, 1.5)),       // way/82486342
  d3nMarelle: d3({ face: { kind: 'punched', wall: '#d9c9a8', glass: '#6f7a83', floor: 3.2, pitch: 2.2, solid: 0.55 }, roof: '#8a6a58', parapet: 'none' }), // relation/1240028 nursery school
  d3nTheOne: d3(apartments('#e2e0da', '#6a7780', 0.5, 0.5)),         // way/337236544
  d3nCitizenM: d3({ face: { kind: 'curtain', wall: '#8a8f94', glass: '#7f94a2', floor: 3.1, pitch: 3.2 }, roof: '#6f7072', parapet: { h: 0.6 } }), // way/355710829 hotel, tall glazed bays
  d3nCarrefourCity: d3(lowShop('#d9d9d4', '#7f94a2')),                // way/628777992
  d3nEspace21: d3(glassOffice('#c8d0d5', '#7f9ab0', 3.3, 1.5)),       // relation/8844380
  d3nTerrasseValmy: d3(lowShop('#bfc4c7')),                           // relation/6595075
  d3nBillyBilly: d3(lowShop('#a9a49a', '#6a7f8c')),                   // way/697749039
  d3nCoface: d3(glassOffice('#cdd5d9', '#8aa9ba', 3.4, 1.5)),         // relation/10983459, 9 storeys
  d3nMirage: d3(lowShop('#b8b2a4')),                                  // way/1207308119
  d3nIntermarche: d3(lowShop('#d6d3cb', '#6a7f8c')),                  // way/1293099937
}
