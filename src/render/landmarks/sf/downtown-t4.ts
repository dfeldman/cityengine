/**
 * DOWNTOWN, TIER 4 — the most prominent buildings still drawn generic or refaced in SoMa by Market, Union Square, the
 * Tenderloin, Civic Center, Chinatown, the FiDi's north edge and lower Nob Hill (docs/TIER4-QUEUE.md; owner,
 * 2026-10-25: "All 158. Do one subagent at a time"). Each builder replaces a `restyle` (reface) or nothing; its manifest
 * entry is in public/landmarks/san-francisco/downtown-t4.json, and its notes say which photographs it was drawn from.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { tower, towerRing, type Face } from '../tower.ts'
import { boxAlong, colonnade, edgeAt, signText } from '../parts.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { box, prism, type Rgb } from '../../models.ts'

void tower; void towerRing; void boxAlong; void colonnade; void edgeAt; void signText; void surfaceTag; void box; void prism
export type { Face, Rgb }

/**
 * 5th and Mission Garage (way/156123224), 833 Mission Street at Fifth: a grey-beige concrete parking garage, its open
 * decks behind deep punched openings with square piers between, under a flat eaved roof. (Mapillary 123627807026137.)
 */
function t4b1_156123224(out: MeshBuilder, fit: Fit): void {
  const CONCRETE: Rgb = [0.84, 0.79, 0.67]
  tower(out, fit, {
    height: 36,
    tiers: [{ to: 1, face: { kind: 'punched', wall: CONCRETE, material: 'concrete', glass: [0.3, 0.3, 0.3], pitch: 5, solid: 0.45, floor: 3.6 } }],
    crown: { kind: 'parapet', height: 1, colour: [0.76, 0.74, 0.69], material: 'concrete' },
  })
}

/**
 * The Bay Area Metro Center (way/192328858), 375 Beale Street: a white stucco block of about seven storeys, its ribbon
 * windows set in blue-tinted glass, on a dark granite base. (Mapillary 1298617837852392, 763572406286252.)
 */
function t4b2_192328858(out: MeshBuilder, fit: Fit): void {
  const WHITE: Rgb = [0.9, 0.9, 0.88]
  tower(out, fit, {
    height: 43,
    base: { height: 4, face: { kind: 'punched', wall: [0.42, 0.42, 0.42], material: 'granite', glass: [0.2, 0.22, 0.25], pitch: 4, solid: 0.5, floor: 4 } },
    tiers: [{ to: 1, face: { kind: 'bands', wall: WHITE, material: 'stucco', glass: [0.25, 0.4, 0.55], floor: 3.6, solid: 0.5 } }],
    crown: { kind: 'parapet', height: 1.2, colour: WHITE, material: 'stucco' },
  })
}

/**
 * The Clift Royal Sonesta (way/71504442), 495 Geary Street: a 1913 seventeen-storey hotel of buff-grey brick, regular
 * punched windows over an arched stone base. (Mapillary 1078267750731072.)
 */
function t4b4_71504442(out: MeshBuilder, fit: Fit): void {
  const BUFF: Rgb = [0.85, 0.8, 0.68]
  tower(out, fit, {
    height: 64,
    base: { height: 8, face: { kind: 'punched', wall: [0.7, 0.66, 0.58], material: 'ashlar', glass: [0.2, 0.22, 0.24], pitch: 4.5, solid: 0.4, arched: true, floor: 4 } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: BUFF, material: 'brick', glass: [0.26, 0.3, 0.34], pitch: 2.8, solid: 0.55, floor: 3.6 } }],
    crown: { kind: 'parapet', height: 2.5, colour: [0.6, 0.56, 0.5], material: 'brick' },
  })
}

/**
 * BEI Hotel (way/35176131), 50 Eighth Street: a dark slate-grey block with a dark-mullioned glass curtain wall above a
 * blank dark base. (Mapillary 1660392567959950.) OSM gives 58 m; the photograph reads nearer nine storeys, so the
 * height is left to the manifest (see its note).
 */
function t4b5_35176131(out: MeshBuilder, fit: Fit): void {
  const DARK: Rgb = [0.2, 0.22, 0.24]
  tower(out, fit, {
    height: 58,
    base: { height: 6, face: { kind: 'blank', wall: DARK, material: 'concrete' } },
    tiers: [{ to: 1, face: { kind: 'curtain', wall: DARK, glass: [0.3, 0.4, 0.46], pitch: 3.3, floor: 3.2, material: 'metal' } }],
    crown: { kind: 'parapet', height: 1, colour: DARK, material: 'metal' },
  })
}

/** 55 Hawthorne Street (way/80296753): beige stone office, horizontal bands of recessed windows, dark base. */
function t4b7_80296753(out: MeshBuilder, fit: Fit): void {
  const STONE: Rgb = [0.83, 0.77, 0.66]
  tower(out, fit, {
    height: 57,
    base: { height: 4, face: { kind: 'blank', wall: [0.32, 0.26, 0.2], material: 'granite' } },
    tiers: [{ to: 1, face: { kind: 'bands', wall: STONE, glass: [0.22, 0.26, 0.28], floor: 3.6, solid: 0.6, material: 'granite' } }],
    crown: { kind: 'parapet', height: 1.2, colour: STONE, material: 'granite' },
  })
}

/** 633 Folsom Street (way/93817371): a glass-skinned tower with a sloping crown, blue-grey mullions. */
function t4b9_93817371(out: MeshBuilder, fit: Fit): void {
  tower(out, fit, {
    height: 48,
    base: { height: 5, face: { kind: 'punched', wall: [0.62, 0.62, 0.6], material: 'concrete', glass: [0.2, 0.25, 0.3], pitch: 4, solid: 0.4, floor: 5 } },
    tiers: [{ to: 1, face: { kind: 'curtain', wall: [0.4, 0.46, 0.52], glass: [0.2, 0.33, 0.46], pitch: 2.2, floor: 3.6, material: 'metal' } }],
    crown: { kind: 'sliced', height: 3, colour: [0.4, 0.46, 0.5], material: 'metal' },
  })
}

/** Unnamed block at Howard and Tehama (way/1258806534): a sixteen-storey residential tower, white balcony boxes and dark panels in a checker, on a blank dark base. */
function t4b10_1258806534(out: MeshBuilder, fit: Fit): void {
  const WHITE: Rgb = [0.9, 0.9, 0.88]
  tower(out, fit, {
    height: 52,
    base: { height: 5, face: { kind: 'blank', wall: [0.34, 0.33, 0.35], material: 'concrete' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: WHITE, glass: [0.26, 0.26, 0.3], pitch: 3, floor: 3.2, solid: 0.5, material: 'stucco' } }],
    crown: { kind: 'parapet', height: 1, colour: WHITE, material: 'stucco' },
  })
}

/** 1TENth (way/35111958): a beige-grey concrete office of about ten storeys, horizontal ribbon windows. */
function t4b12_35111958(out: MeshBuilder, fit: Fit): void {
  const BEIGE: Rgb = [0.78, 0.75, 0.68]
  tower(out, fit, {
    height: 38,
    base: { height: 4, face: { kind: 'blank', wall: [0.6, 0.57, 0.5], material: 'concrete' } },
    tiers: [{ to: 1, face: { kind: 'bands', wall: BEIGE, glass: [0.25, 0.3, 0.34], floor: 3.8, solid: 0.55, material: 'concrete' } }],
    crown: { kind: 'parapet', height: 1.2, colour: BEIGE, material: 'concrete' },
  })
}

/** 201 Third Street (way/80296729): a charcoal residential tower of about sixteen storeys with white balcony boxes, over a glass-fronted podium. */
function t4b13_80296729(out: MeshBuilder, fit: Fit): void {
  const CHARCOAL: Rgb = [0.3, 0.29, 0.32]
  tower(out, fit, {
    height: 46,
    base: { height: 12, face: { kind: 'curtain', wall: [0.2, 0.22, 0.24], glass: [0.25, 0.3, 0.34], pitch: 2.5, floor: 4, material: 'metal' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: CHARCOAL, glass: [0.22, 0.24, 0.28], pitch: 3, floor: 3.2, solid: 0.5, material: 'stucco' } }],
    crown: { kind: 'parapet', height: 1, colour: CHARCOAL, material: 'stucco' },
  })
}

/** The White House (way/333827281), Grant and Sutter: a white stone and terracotta department store, rounded corner, a rusticated base and an attic. */
function t4b14_333827281(out: MeshBuilder, fit: Fit): void {
  const WHITE: Rgb = [0.94, 0.93, 0.9]
  tower(out, fit, {
    height: 30,
    base: { height: 5, face: { kind: 'punched', wall: [0.86, 0.84, 0.8], material: 'ashlar', glass: [0.2, 0.24, 0.26], pitch: 3.5, solid: 0.45, floor: 5 } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: WHITE, glass: [0.26, 0.3, 0.32], pitch: 4.5, floor: 3.8, solid: 0.5, material: 'stucco' } }],
    cornices: [{ at: 0.85, depth: 0.4, colour: WHITE }],
    crown: { kind: 'parapet', height: 1.5, colour: WHITE, material: 'stucco' },
  })
}

export const DOWNTOWN_T4: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  t4b1_156123224,
  t4b2_192328858,
  t4b4_71504442,
  t4b5_35176131,
  t4b7_80296753,
  t4b9_93817371,
  t4b10_1258806534,
  t4b12_35111958,
  t4b13_80296729,
  t4b14_333827281,
}
