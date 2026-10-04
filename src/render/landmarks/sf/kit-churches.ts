/**
 * Churches the mechanical "rule 2: place of worship → classical" restyle (lowrise.json) had dressed as office blocks —
 * the very failures church.ts's header names. Each said in the church kit's slots from a Mapillary frame on its street
 * (2026-10-04); fronts are the bearing from the footprint to the street the entrance is on.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { church } from '../church.ts'

/** National Shrine of Saint Francis of Assisi (1860), Vallejo at Columbus: white Gothic Revival, two square towers
 *  finished in clusters of pinnacles, a tall lancet window over the portal. */
export function shrineOfSaintFrancis(out: MeshBuilder, fit: Fit): void {
  church(out, fit, {
    nave: { bays: 5, storeys: 1, roof: 'gable', pitch: 'steep' },
    aisles: null,
    transept: null,
    chancel: { kind: 'square' },
    tower: { at: 'twin', stages: 3, plan: 'square', top: 'parapet' },
    front: { kind: 'gable', portal: 'triple', window: 'lancets', steps: 3 },
    walls: { material: 'stucco', openings: 'lancet', buttresses: 'plain' },
  })
}

/** Nuestra Señora de Guadalupe (1912), Broadway: white Spanish-colonial baroque, the curved gable with its painted
 *  medallion, twin belfries with open stages and small domes, raised on a stair over the street. */
export function guadalupeChurch(out: MeshBuilder, fit: Fit): void {
  church(out, fit, {
    nave: { bays: 4, storeys: 2, roof: 'gable', pitch: 'low' },
    aisles: null,
    transept: null,
    chancel: { kind: 'apse' },
    tower: { at: 'twin', stages: 3, plan: 'square', top: 'dome' },
    front: { kind: 'baroque', portal: 'triple', window: 'medallion', steps: 6 },
    walls: { material: 'stucco', openings: 'round', buttresses: 'none' },
  })
}

/** Saint Dominic's (1928), Bush at Steiner: grey granite Gothic, flying buttresses down the nave, a great square
 *  tower, traceried windows. */
export function saintDominics(out: MeshBuilder, fit: Fit): void {
  church(out, fit, {
    nave: { bays: 7, storeys: 2, roof: 'gable', pitch: 'steep' },
    aisles: { roof: 'lean-to' },
    transept: { ends: 'projecting' },
    chancel: { kind: 'apse' },
    tower: { at: 'front-corner', stages: 4, plan: 'square', top: 'parapet' },
    front: { kind: 'gable', portal: 'triple', window: 'rose', steps: 3 },
    walls: { material: 'granite', openings: 'tracery', buttresses: 'flying' },
  })
}

/** Temple Sherith Israel (1905), California at Webster: buff sandstone Romanesque, the great round-arched window in
 *  its deep arch over an arcade, a dome over the sanctuary. */
export function sherithIsrael(out: MeshBuilder, fit: Fit): void {
  church(out, fit, {
    nave: { bays: 3, storeys: 2, roof: 'flat', pitch: 'low' },
    aisles: null,
    transept: null,
    chancel: null,
    tower: { at: 'crossing', stages: 1, plan: 'octagon', top: 'dome' },
    front: { kind: 'plain', portal: 'triple', window: 'wheel', steps: 3 },
    walls: { material: 'sandstone', openings: 'round', buttresses: 'none' },
  })
}

/** Saint Brigid (1904), Van Ness at Broadway: grey granite Romanesque, tall round-arched windows, a square tower. */
export function saintBrigid(out: MeshBuilder, fit: Fit): void {
  church(out, fit, {
    nave: { bays: 5, storeys: 2, roof: 'gable', pitch: 'low' },
    aisles: null,
    transept: null,
    chancel: { kind: 'square' },
    tower: { at: 'front-corner', stages: 4, plan: 'square', top: 'pyramid' },
    front: { kind: 'gable', portal: 'triple', window: 'wheel', steps: 4 },
    walls: { material: 'granite', openings: 'round', buttresses: 'none' },
  })
}

/** Saint Vincent de Paul (1916), Green at Steiner: red brick below, cream above, a great arched window with a roundel
 *  in the gable, a tall corner tower under a broad bracketed cap. */
export function saintVincentDePaul(out: MeshBuilder, fit: Fit): void {
  church(out, fit, {
    nave: { bays: 5, storeys: 2, roof: 'gable', pitch: 'moderate' },
    aisles: null,
    transept: null,
    chancel: { kind: 'apse' },
    tower: { at: 'front-corner', stages: 4, plan: 'square', top: 'belfry' },
    front: { kind: 'gable', portal: 'triple', window: 'lancets', steps: 5 },
    walls: { material: 'brick', openings: 'round', buttresses: 'none' },
  })
}

/** Saint Mark's Lutheran (1895), O'Farrell Street: red brick Romanesque, a tall square corner tower, a rose window
 *  over the triple-arched portal, a broad stair up from the street. */
export function saintMarksLutheran(out: MeshBuilder, fit: Fit): void {
  church(out, fit, {
    nave: { bays: 4, storeys: 1, roof: 'gable', pitch: 'steep' },
    aisles: null,
    transept: null,
    chancel: { kind: 'apse' },
    tower: { at: 'front-corner', stages: 4, plan: 'square', top: 'parapet' },
    front: { kind: 'gable', portal: 'triple', window: 'rose', steps: 8 },
    walls: { material: 'brick', openings: 'round', buttresses: 'none' },
  })
}

/** First Church of Christ, Scientist (1912, Edgar Mathews), Franklin at California: buff-brown brick Romanesque, a
 *  corbel-arched gable with a rose window over two arched doors, a square corner campanile with an arcaded belfry under
 *  a bracketed cap (Mapillary on Franklin and California). */
export function firstChurchOfChristScientist(out: MeshBuilder, fit: Fit): void {
  church(out, fit, {
    nave: { bays: 4, storeys: 1, roof: 'gable', pitch: 'low' },
    aisles: null,
    transept: null,
    chancel: { kind: 'square' },
    tower: { at: 'front-corner', stages: 4, plan: 'square', top: 'belfry' },
    front: { kind: 'gable', portal: 'triple', window: 'rose', steps: 3 },
    walls: { material: 'brick', openings: 'round', buttresses: 'none', colour: [0.6, 0.48, 0.38] },
  })
}

/** Saint Agnes (1913), Masonic at Page: Indiana limestone baroque, statues and carving over the triple entrance, a red
 *  tile roof and the tall corner tower under its green copper onion (churchofsaintagnes.org; a Mapillary frame on
 *  Masonic shows the carved cream portal). */
export function saintAgnes(out: MeshBuilder, fit: Fit): void {
  church(out, fit, {
    nave: { bays: 5, storeys: 2, roof: 'gable', pitch: 'low' },
    aisles: null,
    transept: null,
    chancel: { kind: 'apse' },
    tower: { at: 'front-corner', stages: 5, plan: 'square', top: 'dome' },
    front: { kind: 'pediment', portal: 'triple', window: 'medallion', steps: 4 },
    walls: { material: 'limestone', openings: 'round', buttresses: 'none' },
  })
}

/** Saint Francis Lutheran (1905, built as Danish St Ansgar), 152 Church Street: Danish Gothic in red brick over a
 *  timber frame, the tall wooden steeple at the middle of the front (Wikipedia; noehill SF Landmark #39; under
 *  scaffolding in the Mapillary frame, red brick behind it). */
export function saintFrancisLutheran(out: MeshBuilder, fit: Fit): void {
  church(out, fit, {
    nave: { bays: 4, storeys: 1, roof: 'gable', pitch: 'steep' },
    aisles: null,
    transept: null,
    chancel: { kind: 'square' },
    tower: { at: 'front-centre', stages: 3, plan: 'square', top: 'spire' },
    front: { kind: 'gable', portal: 'single', window: 'lancets', steps: 3 },
    walls: { material: 'brick', openings: 'lancet', buttresses: 'plain' },
  })
}

/** The Presidio's Chapel of Our Lady (1864, remodelled 1952 in the Spanish colonial manner), Moraga Avenue: white
 *  stucco under red tile, a small white belfry with round openings and a cross on the gable (Mapillary on Moraga). */
export function presidioChapel(out: MeshBuilder, fit: Fit): void {
  church(out, fit, {
    nave: { bays: 5, storeys: 1, roof: 'gable', pitch: 'low' },
    aisles: null,
    transept: null,
    chancel: { kind: 'square' },
    tower: { at: 'front-centre', stages: 2, plan: 'square', top: 'belfry' },
    front: { kind: 'gable', portal: 'single', window: 'oculus', steps: 2 },
    walls: { material: 'stucco', openings: 'round', buttresses: 'none', colour: [0.93, 0.92, 0.88] },
  })
}

/** The Swedenborgian Church (1895, A. Page Brown with Bernard Maybeck and A. C. Schweinfurth), Lyon at Washington:
 *  Arts and Crafts — one storey of red sand-cast brick with dark clinkers under a red tile roof, a small corbelled
 *  brick bell tower set to one side of the Lyon Street front, an arched tiled portico before it (Wikipedia; NRHP
 *  #04001154). */
export function swedenborgianChurch(out: MeshBuilder, fit: Fit): void {
  church(out, fit, {
    nave: { bays: 4, storeys: 1, roof: 'gable', pitch: 'moderate' },
    aisles: null,
    transept: null,
    chancel: { kind: 'square' },
    tower: { at: 'front-corner', stages: 2, plan: 'square', top: 'pyramid' },
    front: { kind: 'gable', portal: 'porch', window: 'none', steps: 1 },
    walls: { material: 'brick', openings: 'round', buttresses: 'none', colour: [0.55, 0.3, 0.24] },
  })
}

/** San Francisco Central Seventh-day Adventist Church (1892, survived 1906): pink stucco over a red brick base, a gable
 *  front of tall round-arched windows over a brick arched porch, a square corner tower finished with corner
 *  pinnacles (Mapillary, three frames on the corner; sfcentral.org for the date). */
export function centralAdventist(out: MeshBuilder, fit: Fit): void {
  church(out, fit, {
    nave: { bays: 4, storeys: 1, roof: 'gable', pitch: 'steep' },
    aisles: null,
    transept: null,
    chancel: { kind: 'square' },
    tower: { at: 'front-corner', stages: 3, plan: 'square', top: 'parapet' },
    front: { kind: 'gable', portal: 'porch', window: 'lancets', steps: 2 },
    walls: { material: 'stucco', openings: 'round', buttresses: 'none', colour: [0.84, 0.7, 0.66] },
  })
}

export const KIT_CHURCHES: Record<string, (out: MeshBuilder, fit: Fit) => void> = { shrineOfSaintFrancis, guadalupeChurch, saintDominics, sherithIsrael, saintBrigid, saintVincentDePaul, saintMarksLutheran, firstChurchOfChristScientist, saintAgnes, saintFrancisLutheran, presidioChapel, swedenborgianChurch, centralAdventist }
