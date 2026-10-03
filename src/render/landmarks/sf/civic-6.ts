/**
 * CIVIC-6: Municipal and institutional buildings (2026-10-03). Each from a Mapillary frame, built with the
 * tower kit. Mostly small civic buildings: car rental, police, libraries, recreation centers, fire station.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { tower } from '../tower.ts'

/** FLEXDRIVE car rental garage, 37.774501, -122.40996 (way/243464467): 4-storey modern garage, light grey
 *  concrete and stucco exterior with large dark-tinted windows and a dark glass base. Mapillary 611612311782945.
 */
export function flexdrive(out: MeshBuilder, fit: Fit): void {
  // white-painted three-storey loft: big dark steel windows, a black band at the first floor
  tower(out, { ...fit, height: 14 }, {
    height: 14,
    base: { height: 4.4, face: { kind: 'punched', wall: [0.14, 0.14, 0.15], glass: [0.16, 0.2, 0.22], pitch: 4.2, floor: 4.4, solid: 0.4, material: 'concrete' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: [0.88, 0.88, 0.86], glass: [0.16, 0.2, 0.24], pitch: 4.2, floor: 4.2, solid: 0.45, material: 'concrete' } }],
    crown: { kind: 'parapet', height: 0.8, colour: [0.86, 0.86, 0.84], material: 'concrete' },
  })
}

/** MULTI-SERVICE CENTER SOUTH, 37.777685, -122.399855 (way/218185111): 3-storey civic building, light blue
 *  stucco with large windows, a red/brown roof, modern institutional style. Mapillary 1428143598303790.
 */
export function multiServiceCenterSouth(out: MeshBuilder, fit: Fit): void {
  // painted mid blue over a darker blue base, a red band under the eaves, punched windows under little awnings
  tower(out, { ...fit, height: 11 }, {
    height: 11,
    base: { height: 3.6, face: { kind: 'punched', wall: [0.16, 0.24, 0.52], glass: [0.18, 0.2, 0.24], pitch: 4, floor: 3.6, solid: 0.7, material: 'stucco' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: [0.42, 0.54, 0.76], glass: [0.26, 0.3, 0.36], pitch: 3.6, floor: 3.4, solid: 0.5, material: 'stucco' } }],
    crown: { kind: 'parapet', height: 0.9, colour: [0.62, 0.16, 0.16], material: 'metal' },
  })
}

/** TENDERLOIN RECREATION CENTER, 37.784794, -122.415607 (way/71209420): 2-storey brick building with a
 *  distinctive bay window projecting from the facade, reddish-brown brick walls, ground-floor recreation
 *  center with large windows. Mapillary 675057162268761.
 */
export function tenderloinRecreationCenter(out: MeshBuilder, fit: Fit): void {
  tower(out, { ...fit, height: 10 }, {
    height: 10,
    tiers: [{ to: 1, face: { kind: 'bays', wall: [0.48, 0.32, 0.26], glass: [0.28, 0.32, 0.38], pitch: 3.2, floor: 3.5, material: 'brick' } }],
    crown: { kind: 'parapet', height: 0.7, colour: [0.42, 0.28, 0.22], material: 'brick' },
  })
}

/** NORTHERN POLICE STATION, 37.780217, -122.432533 (way/161385043): A 7-metre municipal facility building.
 *  Photo did not show building clearly; built plainly with standard civic materials.
 */
export function northernPoliceStation(out: MeshBuilder, fit: Fit): void {
  // grey concrete, nearly blind, a blue band with the city's seals along it
  tower(out, { ...fit, height: 7 }, {
    height: 7,
    base: { height: 3, face: { kind: 'punched', wall: [0.5, 0.56, 0.6], glass: [0.2, 0.26, 0.3], pitch: 4.5, floor: 3, solid: 0.7, material: 'concrete' } },
    tiers: [{ to: 1, face: { kind: 'blank', wall: [0.62, 0.62, 0.62], material: 'concrete' } }],
    crown: { kind: 'parapet', height: 0.6, colour: [0.2, 0.36, 0.62], material: 'metal' },
  })
}

/** CALIFORNIA HIGHWAY PATROL, 37.773246, -122.40738 (way/158827841): A 6-metre service building with red
 *  brick lower section and cream/white upper storeys, a practical civic facility. Mapillary 1327946379330635.
 */
export function californiaHighwayPatrol(out: MeshBuilder, fit: Fit): void {
  tower(out, { ...fit, height: 6 }, {
    height: 6,
    base: { height: 2.5, face: { kind: 'punched', wall: [0.44, 0.3, 0.26], glass: [0.2, 0.24, 0.28], pitch: 2.8, floor: 2.5, solid: 0.5, material: 'brick' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: [0.88, 0.86, 0.82], glass: [0.3, 0.36, 0.42], pitch: 3, floor: 3, solid: 0.4, material: 'concrete' } }],
    crown: { kind: 'parapet', height: 0.5, colour: [0.8, 0.78, 0.74], material: 'concrete' },
  })
}

/** CRISSY FIELD CENTER, 37.805788, -122.449104 (way/288374432): A 5-metre visitor facility in the Crissy
 *  Field area. Photo did not show building clearly; built with natural/earthy tones suitable for a waterfront
 *  educational center.
 */
export function crissyFieldCenter(out: MeshBuilder, fit: Fit): void {
  tower(out, { ...fit, height: 5 }, {
    height: 5,
    tiers: [{ to: 1, face: { kind: 'punched', wall: [0.86, 0.84, 0.78], glass: [0.3, 0.36, 0.42], pitch: 3, floor: 4.5, solid: 0.5, material: 'stucco' } }],
    crown: { kind: 'parapet', height: 0.5, colour: [0.6, 0.56, 0.5], material: 'concrete' },
  })
}

/** WESTERN ADDITION BRANCH LIBRARY, 37.784143, -122.437549 (way/160833254): A small 3-metre library building
 *  with white/light facade, shaded by large trees. Modern library design with minimal detail. Mapillary 1338257691222198.
 */
export function westernAdditionBranchLibrary(out: MeshBuilder, fit: Fit): void {
  // one storey, white, low and wide under the trees, a shallow metal fascia
  tower(out, { ...fit, height: 4.5 }, {
    height: 4.5,
    tiers: [{ to: 1, face: { kind: 'punched', wall: [0.9, 0.9, 0.88], glass: [0.3, 0.36, 0.4], pitch: 3.6, floor: 4.5, solid: 0.45, material: 'concrete' } }],
    crown: { kind: 'parapet', height: 0.6, colour: [0.6, 0.62, 0.64], material: 'metal' },
  })
}

/** PACIFIC HEIGHTS SCHOOL, 37.792899, -122.433492 (relation/3528184): A 4-storey Beaux-Arts style institutional
 *  building with pale cream-coloured stone or concrete facade, a distinctive arched entrance portal with white
 *  columns and classical detailing, horizontal bands separating floors. Mapillary 537480817879710.
 */
export function pacificHeightsSchool(out: MeshBuilder, fit: Fit): void {
  tower(out, { ...fit, height: 14 }, {
    height: 14,
    base: { height: 4, face: { kind: 'punched', wall: [0.86, 0.84, 0.78], glass: [0.28, 0.32, 0.36], pitch: 3.4, floor: 4, solid: 0.45, material: 'ashlar' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: [0.88, 0.86, 0.8], glass: [0.32, 0.38, 0.44], pitch: 3.2, floor: 3.6, solid: 0.48, head: 'pediment', material: 'ashlar' }, cornice: { depth: 1.2, height: 1 } }],
    crown: { kind: 'parapet', height: 1, colour: [0.84, 0.82, 0.76], material: 'ashlar' },
  })
}

/** UNITED PLAYAZ, 37.779223, -122.408266 (way/260358486): A 5-6 storey mixed-use civic building with a brick
 *  base and cream/white upper storeys, modern institutional design serving youth and community programs. Mapillary 1330384805328132.
 */
export function unitedPlayaz(out: MeshBuilder, fit: Fit): void {
  // a cream stucco block of flats with stacked bay windows over a ground floor of shopfronts
  tower(out, { ...fit, height: 18 }, {
    height: 18,
    base: { height: 4, face: { kind: 'curtain', wall: [0.3, 0.28, 0.26], glass: [0.2, 0.22, 0.24], pitch: 3.2, floor: 4 } },
    tiers: [{ to: 1, face: { kind: 'bays', wall: [0.9, 0.86, 0.76], glass: [0.34, 0.4, 0.44], pitch: 4.2, floor: 3.2, solid: 0.4, material: 'stucco' } }],
    crown: { kind: 'parapet', height: 0.8, colour: [0.88, 0.84, 0.74], material: 'stucco' },
  })
}

/** SAN FRANCISCO FIRE STATION 1, 37.77942, -122.404059 (way/225733614): A modern 4-storey fire station building
 *  with a dark grey/charcoal facade, large windows, and the "SFFD 1" sign visible on the front, located downtown.
 *  Mapillary 735181952768559.
 */
export function sanFranciscoFireStation1(out: MeshBuilder, fit: Fit): void {
  // charcoal panels, almost windowless, a glazed stair slot, the apparatus bay's red door at street level
  tower(out, { ...fit, height: 14 }, {
    height: 14,
    base: { height: 5, face: { kind: 'punched', wall: [0.24, 0.24, 0.26], glass: [0.62, 0.14, 0.12], pitch: 5.5, floor: 5, solid: 0.35, material: 'metal' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: [0.28, 0.28, 0.3], glass: [0.24, 0.3, 0.34], pitch: 4.6, floor: 3, solid: 0.78, material: 'metal' } }],
    crown: { kind: 'parapet', height: 0.7, colour: [0.24, 0.24, 0.26], material: 'metal' },
  })
}

/** TOWN SCHOOL FOR BOYS, 37.791999, -122.440234 (way/262074929): A 4-5 storey school building with cream/tan
 *  stone base, large glass upper storeys, and modern mixed-use design reflecting its use as both an educational
 *  and community facility. Mapillary 703376794258615.
 */
export function townSchoolForBoys(out: MeshBuilder, fit: Fit): void {
  // tan stucco over a stone base, a glazed stair tower, a rooftop play deck behind a glass rail
  tower(out, { ...fit, height: 16 }, {
    height: 16,
    base: { height: 3.5, face: { kind: 'punched', wall: [0.52, 0.46, 0.38], glass: [0.24, 0.28, 0.32], pitch: 3.4, floor: 3.5, solid: 0.5, material: 'ashlar' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: [0.84, 0.76, 0.6], glass: [0.3, 0.38, 0.44], pitch: 3.6, floor: 3.6, solid: 0.45, material: 'stucco' } }],
    crown: { kind: 'parapet', height: 1.2, colour: [0.6, 0.72, 0.76], material: 'glass' },
  })
}

export const CIVIC_6: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  flexdrive,
  multiServiceCenterSouth,
  tenderloinRecreationCenter,
  northernPoliceStation,
  californiaHighwayPatrol,
  crissyFieldCenter,
  westernAdditionBranchLibrary,
  pacificHeightsSchool,
  unitedPlayaz,
  sanFranciscoFireStation1,
  townSchoolForBoys,
}
