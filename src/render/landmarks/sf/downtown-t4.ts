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

/** 219 Brannan Street (way/148551352): a light grey stucco residential tower of about eighteen storeys, its corner rounded, balconies in columns, over a dark ground floor. (Mapillary 1706367537432692.) */
function t4b17_148551352(out: MeshBuilder, fit: Fit): void {
  const GREY: Rgb = [0.76, 0.75, 0.73]
  tower(out, fit, {
    height: 53,
    base: { height: 5, face: { kind: 'blank', wall: [0.3, 0.3, 0.31], material: 'concrete' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: GREY, glass: [0.22, 0.3, 0.36], pitch: 3.6, floor: 3.1, solid: 0.5, material: 'stucco' } }],
    crown: { kind: 'parapet', height: 1, colour: GREY, material: 'stucco' },
  })
}

/** California Institute of Integral Studies (way/35115837), Mission Street: a cream stucco Beaux-Arts block of six or seven storeys, a red terracotta storefront, a deep dentilled cornice. (Mapillary 204524338632290, 1970394017056717.) */
function t4b19_35115837(out: MeshBuilder, fit: Fit): void {
  const CREAM: Rgb = [0.9, 0.85, 0.72]
  tower(out, fit, {
    height: 43,
    base: { height: 5, face: { kind: 'punched', wall: [0.55, 0.3, 0.24], material: 'terracotta', glass: [0.22, 0.24, 0.26], pitch: 4, solid: 0.3, floor: 5 } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: CREAM, glass: [0.25, 0.28, 0.3], pitch: 3, floor: 3.8, solid: 0.5, material: 'stucco' } }],
    cornices: [{ at: 0.9, depth: 0.4, colour: CREAM }],
    crown: { kind: 'parapet', height: 1.5, colour: CREAM, material: 'stucco' },
  })
}

/** 1401 and 1415 Mission Street (way/397182870), at Tenth: a red-brown framed corner block of about nine storeys, its mullioned blue glass set in deep brown-red piers. (Mapillary 538988697384531, 1736130537045823.) */
function t4b19_397182870(out: MeshBuilder, fit: Fit): void {
  const RED: Rgb = [0.5, 0.2, 0.14]
  tower(out, fit, {
    height: 40,
    base: { height: 4, face: { kind: 'curtain', wall: [0.2, 0.12, 0.1], glass: [0.18, 0.22, 0.26], pitch: 4, floor: 4, material: 'metal' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: RED, glass: [0.25, 0.35, 0.45], pitch: 4.2, floor: 3.8, solid: 0.22, material: 'terracotta' } }],
    crown: { kind: 'parapet', height: 0.8, colour: RED, material: 'terracotta' },
  })
}

/** 50 Jones Street (way/32864968), at Golden Gate: a white stucco apartment block of about twelve storeys, its windows in regular punched rows, over a plain base. (Mapillary 891230432254711.) No street view stored for this one. */
function t4b20_32864968(out: MeshBuilder, fit: Fit): void {
  const WHITE: Rgb = [0.92, 0.92, 0.9]
  tower(out, fit, {
    height: 48,
    base: { height: 4, face: { kind: 'blank', wall: [0.5, 0.45, 0.4], material: 'concrete' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: WHITE, glass: [0.2, 0.26, 0.3], pitch: 3.2, floor: 3.2, solid: 0.5, material: 'stucco' } }],
    crown: { kind: 'parapet', height: 1, colour: WHITE, material: 'stucco' },
  })
}

/** 360 Third Street (way/25759090): a charcoal office-residential block of about seven storeys, pale concrete ground floor, dark spandrel bands between ribbon windows. (Mapillary 1301354864707821, 914141256849611.) No street view stored for this one. */
function t4b21_25759090(out: MeshBuilder, fit: Fit): void {
  const CHAR: Rgb = [0.36, 0.37, 0.39]
  tower(out, fit, {
    height: 27,
    base: { height: 4, face: { kind: 'punched', wall: [0.8, 0.8, 0.78], glass: [0.2, 0.23, 0.27], pitch: 3, floor: 4, solid: 0.45, material: 'concrete' } },
    tiers: [{ to: 1, face: { kind: 'bands', wall: CHAR, glass: [0.2, 0.23, 0.27], floor: 3.6, solid: 0.6, material: 'concrete' } }],
    crown: { kind: 'parapet', height: 1, colour: CHAR, material: 'concrete' },
  })
}

/** 580 McAllister Street (way/256477871), at Franklin: a buff brick apartment block of 1912, its angled bay windows running up the corner under a deep dentilled cornice. (Mapillary 1111936931083709, 1073875107802486.) */
function t4b22_256477871(out: MeshBuilder, fit: Fit): void {
  const BUFF: Rgb = [0.7, 0.62, 0.52]
  tower(out, fit, {
    height: 26,
    base: { height: 3, face: { kind: 'punched', wall: [0.66, 0.6, 0.5], glass: [0.22, 0.24, 0.26], pitch: 4, solid: 0.5, floor: 3, material: 'ashlar' } },
    tiers: [{ to: 1, face: { kind: 'bays', wall: BUFF, glass: [0.22, 0.24, 0.26], pitch: 4, floor: 4.2, material: 'brick', bay: { depth: 0.8 } } }],
    crown: { kind: 'parapet', height: 1.2, colour: BUFF, material: 'brick' },
  })
}

/** Museum Parc Apartments (way/288716386), 300 Third Street at Folsom: a pale grey concrete apartment block of about twelve storeys, its corner rounded, the balconies curving round every floor. (Mapillary 449083788193612, 192500539980638.) */
function t4b23_288716386(out: MeshBuilder, fit: Fit): void {
  const GREY: Rgb = [0.66, 0.65, 0.62]
  tower(out, fit, {
    height: 40,
    base: { height: 4, face: { kind: 'punched', wall: [0.42, 0.41, 0.39], glass: [0.2, 0.23, 0.27], pitch: 4, floor: 4, solid: 0.5, material: 'concrete' } },
    tiers: [{ to: 1, face: { kind: 'bays', wall: GREY, glass: [0.25, 0.3, 0.34], pitch: 5, floor: 3.2, material: 'concrete', bay: { depth: 1, round: true } } }],
    crown: { kind: 'parapet', height: 1.2, colour: GREY, material: 'concrete' },
  })
}

/** The Clancy (way/112774492), 299 Second Street: a charcoal punched tower of seventeen storeys, stepped back at the top, over a low base. (Mapillary 573364793800440, 1137873745069540.) */
function t4b24_112774492(out: MeshBuilder, fit: Fit): void {
  const CHAR: Rgb = [0.34, 0.34, 0.36]
  const face = { kind: 'punched' as const, wall: CHAR, glass: [0.2, 0.23, 0.27] as Rgb, pitch: 3.4, floor: 3.2, solid: 0.45, material: 'concrete' as const }
  tower(out, fit, {
    height: 50,
    base: { height: 4, face: { kind: 'punched', wall: [0.5, 0.48, 0.45], glass: [0.2, 0.23, 0.27], pitch: 4, floor: 4, solid: 0.5, material: 'stucco' } },
    tiers: [{ to: 0.8, face }, { to: 1, inset: 3, face }],
    crown: { kind: 'parapet', height: 1, colour: CHAR, material: 'concrete' },
  })
}

/** 360 Spear Street Data Center (way/192307107): a white block of five floors of large multi-pane windows over a grey base. (Mapillary 1039344697975158, 4156731871261743.) */
function t4b25_192307107(out: MeshBuilder, fit: Fit): void {
  const WHITE: Rgb = [0.9, 0.9, 0.88]
  tower(out, fit, {
    height: 30,
    base: { height: 4, face: { kind: 'punched', wall: [0.45, 0.46, 0.47], glass: [0.2, 0.24, 0.28], pitch: 4, floor: 4, solid: 0.4, material: 'concrete' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: WHITE, glass: [0.22, 0.28, 0.34], pitch: 5, floor: 5.2, solid: 0.35, material: 'stucco' } }],
    crown: { kind: 'parapet', height: 1, colour: WHITE, material: 'stucco' },
  })
}


/** An unnamed mixed-use block (way/617990577) on Tehama Street: a dark grey panelled block of about ten storeys, stepped back at the top. (Mapillary 608030268857016, 1135342773776664.) */
function t4b27_617990577(out: MeshBuilder, fit: Fit): void {
  const DGREY: Rgb = [0.36, 0.37, 0.39]
  const face = { kind: 'bands' as const, wall: DGREY, glass: [0.2, 0.23, 0.27] as Rgb, floor: 3.4, solid: 0.6, material: 'metal' as const }
  tower(out, fit, {
    height: 37,
    base: { height: 4, face: { kind: 'punched', wall: [0.55, 0.56, 0.55], glass: [0.2, 0.23, 0.27], pitch: 4, floor: 4, solid: 0.5, material: 'concrete' } },
    tiers: [{ to: 0.8, face }, { to: 1, inset: 2.5, face }],
    crown: { kind: 'parapet', height: 1.2, colour: [0.3, 0.3, 0.32], material: 'metal' },
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
  t4b17_148551352,
  t4b19_35115837,
  t4b19_397182870,
  t4b20_32864968,
  t4b21_25759090,
  t4b22_256477871,
  t4b23_288716386,
  t4b24_112774492,
  t4b25_192307107,
  t4b27_617990577,
}
