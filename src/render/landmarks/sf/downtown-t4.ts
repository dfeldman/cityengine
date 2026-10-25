/**
 * DOWNTOWN, TIER 4 — the most prominent buildings still drawn generic or refaced in SoMa by Market, Union Square, the
 * Tenderloin, Civic Center, Chinatown, the FiDi's north edge and lower Nob Hill (docs/TIER4-QUEUE.md; owner,
 * 2026-10-25: "All 158. Do one subagent at a time"). Each builder replaces a `restyle` (reface) or nothing; its manifest
 * entry is in public/landmarks/san-francisco/downtown-t4.json, and its notes say which photographs it was drawn from.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { tower, towerRing, type Face } from '../tower.ts'
import { boxAlong, colonnade, edgeAt, edgeFacing, signText } from '../parts.ts'
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

/** 239 Brannan Street (way/148551351): a light grey stucco residential tower of eighteen storeys over a glazed podium, with rounded balconies at the corner. (Mapillary 1317021873378469, 737060835919391.) */
function t4b28_148551351(out: MeshBuilder, fit: Fit): void {
  const GREY: Rgb = [0.78, 0.77, 0.74]
  const face = { kind: 'punched' as const, wall: GREY, glass: [0.22, 0.27, 0.3] as Rgb, pitch: 3.6, floor: 3, solid: 0.6, material: 'stucco' as const }
  tower(out, fit, {
    height: 54,
    base: { height: 4, face: { kind: 'curtain', wall: [0.2, 0.22, 0.22], glass: [0.2, 0.3, 0.32], pitch: 3, floor: 4, material: 'metal' } },
    tiers: [{ to: 0.9, face }, { to: 1, inset: 1.5, face }],
    crown: { kind: 'parapet', height: 1, colour: GREY, material: 'stucco' },
  })
}

/** 229 Brannan Street (way/148551346): a tan stone residential tower of about eighteen storeys with horizontal bands of glazing, stepped in at the top. (Mapillary 1606209050374360, 1722338381729281.) */
function t4b28_148551346(out: MeshBuilder, fit: Fit): void {
  const TAN: Rgb = [0.72, 0.66, 0.56]
  const face = { kind: 'bands' as const, wall: TAN, glass: [0.25, 0.3, 0.33] as Rgb, floor: 3.2, solid: 0.55, material: 'stucco' as const }
  tower(out, fit, {
    height: 56,
    base: { height: 4, face: { kind: 'punched', wall: [0.62, 0.58, 0.52], glass: [0.2, 0.23, 0.25], pitch: 4, floor: 4, solid: 0.5, material: 'stucco' } },
    tiers: [{ to: 0.75, face }, { to: 1, inset: 2, face }],
    crown: { kind: 'parapet', height: 1.5, colour: [0.55, 0.48, 0.4], material: 'stucco' },
  })
}

/** 501 Second Street (way/112758588): a cream stucco block with tall multi-pane windows, a dentilled cornice and a stepped-back top, on a granite base. (Mapillary 1300814448372879, 1118129256925107.) */
function t4b29_112758588(out: MeshBuilder, fit: Fit): void {
  const CREAM: Rgb = [0.9, 0.88, 0.82]
  const face = { kind: 'punched' as const, wall: CREAM, glass: [0.2, 0.24, 0.28] as Rgb, pitch: 3.2, floor: 4, solid: 0.5, material: 'stucco' as const }
  tower(out, fit, {
    height: 33,
    base: { height: 4, face: { kind: 'punched', wall: [0.6, 0.58, 0.54], glass: [0.2, 0.23, 0.26], pitch: 3.2, floor: 4, solid: 0.5, material: 'granite' } },
    tiers: [{ to: 0.85, face }, { to: 1, inset: 1.5, face }],
    cornices: [{ at: 0.85, depth: 0.5, colour: CREAM }],
    crown: { kind: 'parapet', height: 1.2, colour: CREAM, material: 'stucco' },
  })
}

/** An unnamed tower (way/1487160484, a building:part inside the 345 Spear outline): a buff stone tower of fifteen storeys, stepped back twice at the top. (Mapillary 1712954926220969, 564785099920670.) */
function t4b30_1487160484(out: MeshBuilder, fit: Fit): void {
  const BUFF: Rgb = [0.78, 0.7, 0.58]
  const face = { kind: 'punched' as const, wall: BUFF, glass: [0.2, 0.22, 0.25] as Rgb, pitch: 3.4, floor: 3.6, solid: 0.55, material: 'stucco' as const }
  tower(out, fit, {
    height: 60,
    base: { height: 4, face: { kind: 'punched', wall: [0.5, 0.45, 0.4], glass: [0.2, 0.22, 0.24], pitch: 4, floor: 4, solid: 0.5, material: 'granite' } },
    tiers: [{ to: 0.75, face }, { to: 0.9, inset: 2.5, face }, { to: 1, inset: 2.5, face }],
    crown: { kind: 'stepped', steps: 2, height: 2.4, inset: 1.2, face },
  })
}

/** An unnamed five-storey brick building (relation/12734194), 345 Spear Street: red brick with tall multi-pane windows under a flat parapet, on the old coffee-works site. (Mapillary 2233593180487972, 2053859341740339.) */
function t4b30_12734194(out: MeshBuilder, fit: Fit): void {
  const RED: Rgb = [0.55, 0.28, 0.2]
  tower(out, fit, {
    height: 20,
    tiers: [{ to: 1, face: { kind: 'punched', wall: RED, glass: [0.2, 0.22, 0.22], pitch: 3.2, floor: 4, solid: 0.55, material: 'brick' } }],
    cornices: [{ at: 0.25, depth: 0.2, colour: [0.7, 0.66, 0.6] }],
    crown: { kind: 'parapet', height: 1, colour: [0.6, 0.55, 0.5], material: 'concrete' },
  })
}

/** 120 Howard Street (way/192026937): a red-brown brick office block of eleven storeys, its top floors glazed in blue, on Howard Street. (Mapillary 1308123510268509, 533670838619176.) */
function t4b31Howard120(out: MeshBuilder, fit: Fit): void {
  const BRICK: Rgb = [0.6, 0.34, 0.25]
  const face = { kind: 'punched' as const, wall: BRICK, glass: [0.22, 0.28, 0.34] as Rgb, pitch: 3.6, floor: 4, solid: 0.6, material: 'brick' as const }
  tower(out, fit, {
    height: 44,
    base: { height: 4, face: { kind: 'curtain', wall: [0.2, 0.22, 0.22], glass: [0.25, 0.32, 0.36], pitch: 3, floor: 4, material: 'metal' } },
    tiers: [{ to: 0.85, face }, { to: 1, inset: 1, face: { kind: 'bands', wall: BRICK, glass: [0.2, 0.3, 0.4], floor: 3.6, solid: 0.45, material: 'metal' } }],
    crown: { kind: 'parapet', height: 1, colour: [0.5, 0.5, 0.5], material: 'metal' },
  })
}

/** Mosso, 900 Folsom Street (way/151980461): a pale grey eight-storey block of flats with balconies in bands and dark teal glazing. (Mapillary 1134070058616705, 2924653254443478.) */
function t4b32Mosso(out: MeshBuilder, fit: Fit): void {
  const WHITE: Rgb = [0.84, 0.85, 0.83]
  const face = { kind: 'bands' as const, wall: WHITE, glass: [0.18, 0.3, 0.34] as Rgb, floor: 3.2, solid: 0.5, material: 'stucco' as const }
  tower(out, fit, {
    height: 26,
    tiers: [{ to: 0.75, face }, { to: 1, inset: 1.5, face }],
    crown: { kind: 'parapet', height: 1.5, colour: [0.35, 0.42, 0.46], material: 'stucco' },
  })
}

/** Courtyard by Marriott, 761 Post Street (way/256058407): a grey-buff hotel tower of sixteen storeys with bay windows up its face, on a dark grey arched base. (Mapillary 5584683278266371, 716617371286313.) */
function t4b33Courtyard761(out: MeshBuilder, fit: Fit): void {
  const BUFF: Rgb = [0.72, 0.7, 0.66]
  tower(out, fit, {
    height: 54,
    base: { height: 5, face: { kind: 'punched', wall: [0.3, 0.3, 0.32], glass: [0.18, 0.2, 0.22], pitch: 3.6, floor: 5, solid: 0.6, arched: true, material: 'granite' } },
    tiers: [{ to: 1, face: { kind: 'bays', wall: BUFF, glass: [0.2, 0.24, 0.28], floor: 3.4, pitch: 3.6, material: 'stucco', bay: { depth: 0.8, round: true } } }],
    crown: { kind: 'parapet', height: 1.5, colour: BUFF, material: 'stucco' },
  })
}

/** 747 Post Street (way/197354891): a cream stucco tower of sixteen storeys, its windows small and irregular, stepped back at the top. (Mapillary 1110994654336561, 1286566192952128.) */
function t4b33Post747(out: MeshBuilder, fit: Fit): void {
  const CREAM: Rgb = [0.9, 0.88, 0.8]
  const face = { kind: 'punched' as const, wall: CREAM, glass: [0.2, 0.22, 0.25] as Rgb, pitch: 3.2, floor: 3.4, solid: 0.6, material: 'stucco' as const }
  tower(out, fit, {
    height: 54,
    base: { height: 4, face: { kind: 'punched', wall: [0.6, 0.58, 0.54], glass: [0.2, 0.22, 0.25], pitch: 3.6, floor: 4, solid: 0.5, material: 'granite' } },
    tiers: [{ to: 0.8, face }, { to: 1, inset: 2, face }],
    crown: { kind: 'parapet', height: 1.5, colour: CREAM, material: 'stucco' },
  })
}

/** The Alcazar Theatre, 650 Geary Street (way/33570646): a Moorish-style cream and red-brick theatre of two storeys with arched windows and a dome over the roof. (Mapillary 361431495535509, 4133528923595589.) */
function t4b33Alcazar(out: MeshBuilder, fit: Fit): void {
  const BUFF: Rgb = [0.86, 0.8, 0.64]
  const RED: Rgb = [0.6, 0.3, 0.22]
  tower(out, fit, {
    height: 22,
    base: { height: 3, face: { kind: 'punched', wall: RED, glass: [0.15, 0.15, 0.16], pitch: 3, floor: 3, solid: 0.6, arched: true, material: 'brick' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: BUFF, glass: [0.2, 0.2, 0.24], pitch: 3, floor: 3.2, solid: 0.6, arched: true, material: 'stucco' } }],
    crown: { kind: 'dome', height: 5, radius: 4.5, colour: [0.9, 0.88, 0.82], drum: 1 },
  })
}

/** Saint Francis Memorial Hospital tower, Hyde at Bush (way/436474725): a cream precast tower of twelve storeys, deep-set windows, over a lower podium. (Mapillary 1110629127691728, 4127803807505281.) */
function t4b34SaintFrancisTower(out: MeshBuilder, fit: Fit): void {
  const CREAM: Rgb = [0.9, 0.86, 0.76]
  const face = { kind: 'punched' as const, wall: CREAM, glass: [0.22, 0.24, 0.26] as Rgb, pitch: 4.2, floor: 3.6, solid: 0.6, material: 'stucco' as const }
  tower(out, fit, {
    height: 48,
    base: { height: 8, face: { kind: 'punched', wall: [0.86, 0.82, 0.72], glass: [0.2, 0.22, 0.24], pitch: 4.2, floor: 3.6, solid: 0.55, material: 'stucco' } },
    tiers: [{ to: 1, face }],
    crown: { kind: 'parapet', height: 1.2, colour: CREAM, material: 'stucco' },
  })
}

/** 1 Harrison Street (way/32862740): a six-storey office block in buff concrete, its floors banded in glass with balconies at the upper levels, on a glazed ground floor. (Mapillary 1039344697975158, 1264269668705238.) */
function t4b35Harrison1(out: MeshBuilder, fit: Fit): void {
  const BUFF: Rgb = [0.8, 0.78, 0.72]
  const face = { kind: 'bands' as const, wall: BUFF, glass: [0.22, 0.28, 0.32] as Rgb, floor: 4.5, solid: 0.5, depth: 0.6, material: 'concrete' as const }
  tower(out, fit, {
    height: 27,
    base: { height: 4.5, face: { kind: 'curtain', wall: [0.2, 0.22, 0.24], glass: [0.25, 0.3, 0.34], pitch: 3, floor: 4.5, material: 'metal' } },
    tiers: [{ to: 1, face }],
    crown: { kind: 'parapet', height: 1, colour: BUFF, material: 'concrete' },
  })
}

/**
 * 1360 Mission Street (way/35174714): a four-storey cream block of 1930, its garage door and blank wall at street level,
 * and a teal glass-rail roof terrace over it, the rail sitting on a pergola. The OSM 55 m is a bulk tag; the photographs
 * and the 2010 LiDAR (about 18 m) agree on a low block. (Photographs 01 and 02 of way-35174714.)
 */
function t4b36_35174714(out: MeshBuilder, fit: Fit): void {
  const CREAM: Rgb = [0.9, 0.88, 0.82]
  tower(out, fit, {
    height: 18,
    tiers: [{ to: 1, face: { kind: 'bands', wall: CREAM, glass: [0.5, 0.62, 0.6], floor: 4.5, solid: 0.7, material: 'stucco' } }],
    crown: { kind: 'parapet', height: 1.6, colour: [0.45, 0.66, 0.64], material: 'metal' },
  })
}

/**
 * 1328 Mission Street (way/173237459): a pale rendered block of about four storeys with some modern glazing, its
 * primary facade not glass-dominated. The OSM 55 m is a bulk tag; the LiDAR gives about 16 m. (Photographs 01 and 02
 * of way-173237459.)
 */
function t4b36_173237459(out: MeshBuilder, fit: Fit): void {
  const PALE: Rgb = [0.87, 0.84, 0.79]
  tower(out, fit, {
    height: 16,
    base: { height: 4, face: { kind: 'blank', wall: [0.45, 0.42, 0.4], material: 'concrete' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: PALE, glass: [0.22, 0.3, 0.36], pitch: 3.4, floor: 3.4, solid: 0.5, material: 'stucco' } }],
    crown: { kind: 'parapet', height: 1, colour: PALE, material: 'stucco' },
  })
}

/**
 * Hotel Des Arts (way/474341709), 447 Bush Street: a narrow post-fire hotel of about seven storeys, its pale painted
 * walls and tall windows over a shopfront, the fire escape down the front. (Photographs 01 and 02 of way-474341709.)
 * The OSM 55 m is a bulk tag; the height here is read from the photographs.
 */
function t4b37_474341709(out: MeshBuilder, fit: Fit): void {
  const CREAM: Rgb = [0.86, 0.8, 0.7]
  tower(out, fit, {
    height: 24,
    base: { height: 4, face: { kind: 'blank', wall: [0.4, 0.34, 0.3], material: 'concrete' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: CREAM, glass: [0.22, 0.25, 0.3], pitch: 3.2, floor: 3.2, solid: 0.55, material: 'stucco' } }],
    crown: { kind: 'parapet', height: 1.2, colour: CREAM, material: 'stucco' },
  })
}

/**
 * Hotel Triton (way/135174116), 342 Grant Avenue: a brown brick hotel of about eight storeys, its fire escapes and
 * window air conditioners on the front, a cornice at the top and a dark shopfront with an awning on the ground floor.
 * (Photographs 01 and 02 of way-135174116.)
 */
function t4b37_135174116(out: MeshBuilder, fit: Fit): void {
  const BRICK: Rgb = [0.55, 0.42, 0.32]
  tower(out, fit, {
    height: 26,
    base: { height: 4, face: { kind: 'curtain', wall: [0.3, 0.12, 0.1], glass: [0.2, 0.22, 0.24], pitch: 3, floor: 4, material: 'metal' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: BRICK, glass: [0.22, 0.24, 0.26], pitch: 3.2, floor: 3.2, solid: 0.6, material: 'brick' } }],
    cornices: [{ at: 0.95, depth: 0.6, colour: [0.82, 0.78, 0.7] }],
    crown: { kind: 'parapet', height: 1.2, colour: [0.82, 0.78, 0.7], material: 'concrete' },
  })
}

/**
 * French American International School (way/256720468), 150 Oak Street: a block of about seven storeys, its upper
 * walls white with blue-painted bands of windows and a blue lower storey on the Oak side. (Photographs 01 and 02 of
 * way-256720468.) An earlier note reads it as deep red; the photographs taken for this model show white and blue.
 */
function t4b38_256720468(out: MeshBuilder, fit: Fit): void {
  const WHITE: Rgb = [0.9, 0.9, 0.88]
  tower(out, fit, {
    height: 23,
    base: { height: 4, face: { kind: 'blank', wall: [0.2, 0.36, 0.62], material: 'stucco' } },
    tiers: [{ to: 1, face: { kind: 'bands', wall: WHITE, glass: [0.2, 0.36, 0.6], floor: 3.4, solid: 0.5, material: 'stucco' } }],
    crown: { kind: 'parapet', height: 1, colour: [0.2, 0.36, 0.62], material: 'stucco' },
  })
}

/**
 * 199 New Montgomery Street (way/79377152): a tower of about fifteen storeys on a buff stone base, its walls of red
 * brick piers between tall dark glazing, with a cornice at the top. (Photographs 01 and 03 of way-79377152.)
 */
function t4b39_79377152(out: MeshBuilder, fit: Fit): void {
  const BRICK: Rgb = [0.62, 0.36, 0.28]
  const TAN: Rgb = [0.78, 0.72, 0.6]
  tower(out, fit, {
    height: 46,
    base: { height: 6, face: { kind: 'punched', wall: TAN, glass: [0.2, 0.22, 0.24], pitch: 4, floor: 3, solid: 0.5, material: 'ashlar' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: BRICK, glass: [0.2, 0.24, 0.3], pitch: 4.2, floor: 3.2, solid: 0.3, material: 'brick' } }],
    cornices: [{ at: 0.93, depth: 0.6, colour: TAN }],
    crown: { kind: 'parapet', height: 1.5, colour: TAN, material: 'stucco' },
  })
}

/**
 * 606, 608 and 612 Howard Street (way/79377194): a charcoal grey block of about six storeys, its punched windows and
 * fire escapes on the front, a dark ground floor with a shopfront. (Photographs 01 and 02 of way-79377194.)
 */
function t4b39_79377194(out: MeshBuilder, fit: Fit): void {
  const CHAR: Rgb = [0.36, 0.38, 0.42]
  tower(out, fit, {
    height: 26,
    base: { height: 4, face: { kind: 'punched', wall: [0.3, 0.3, 0.32], glass: [0.2, 0.22, 0.25], pitch: 3.6, floor: 4, solid: 0.5, material: 'concrete' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: CHAR, glass: [0.22, 0.25, 0.3], pitch: 3.2, floor: 3.2, solid: 0.5, material: 'concrete' } }],
    crown: { kind: 'parapet', height: 1, colour: [0.3, 0.32, 0.35], material: 'metal' },
  })
}

/**
 * 340 Bryant Street (way/112864753): a light grey concrete block of about five storeys, punched windows in long
 * horizontal bands, its ground floor glazed under the I-80 ramp. OSM says 34 m; the photographs do not show that.
 */
function t4b40_112864753(out: MeshBuilder, fit: Fit): void {
  tower(out, fit, {
    height: 22,
    tiers: [{ to: 1, face: { kind: 'punched', wall: [0.8, 0.8, 0.78], glass: [0.2, 0.22, 0.24], pitch: 4.2, floor: 4.4, solid: 0.55, material: 'concrete' } }],
    crown: { kind: 'parapet', height: 0.8, colour: [0.8, 0.8, 0.78], material: 'concrete' },
  })
}

/**
 * 195 and 199 Grant Avenue (way/149757921): a cream stucco-faced block of about nine storeys, a moulded cornice
 * high up, fire escapes on the side, shopfronts at street level (Mapillary 192745923291674, 673119174401379).
 */
function t4b41_149757921(out: MeshBuilder, fit: Fit): void {
  const CREAM: Rgb = [0.84, 0.79, 0.68]
  tower(out, fit, {
    height: 30,
    base: { height: 4, face: { kind: 'punched', wall: [0.5, 0.42, 0.34], glass: [0.16, 0.18, 0.2], pitch: 4, floor: 4, solid: 0.4, material: 'stucco' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: CREAM, glass: [0.2, 0.24, 0.28], pitch: 2.8, floor: 3.4, solid: 0.5, material: 'stucco' } }],
    cornices: [{ at: 26, depth: 0.5, colour: [0.9, 0.86, 0.78] }],
    crown: { kind: 'parapet', height: 1.2, colour: CREAM, material: 'stucco' },
  })
}

/**
 * 95 Hawthorne Street (way/113347426): a glass tower of about ten storeys, its curtain wall dressed with white
 * angled fins, on a white concrete base with a recessed entrance (Mapillary 1462379361559423, 477179352040959).
 */
function t4b42_113347426(out: MeshBuilder, fit: Fit): void {
  const WHITE: Rgb = [0.86, 0.86, 0.84]
  tower(out, fit, {
    height: 39,
    base: { height: 4, face: { kind: 'punched', wall: WHITE, glass: [0.22, 0.27, 0.32], pitch: 4, floor: 4, solid: 0.6, material: 'concrete' } },
    tiers: [{ to: 1, face: { kind: 'fins', wall: [0.7, 0.74, 0.78], glass: [0.2, 0.28, 0.34], floor: 3.9, pitch: 2.2, solid: 0.4, depth: 0.5, material: 'metal' } }],
    crown: { kind: 'parapet', height: 1.0, colour: [0.7, 0.74, 0.78], material: 'metal' },
  })
}

/**
 * 620 Folsom Street (way/113347425): a red-brown brick block of about four storeys, tall round-arched windows, a dark
 * ground floor under street trees (Mapillary 1312116589999498). Photograph 02 shows the neighbour at 606 Howard.
 */
function t4b42_113347425(out: MeshBuilder, fit: Fit): void {
  const BRICK: Rgb = [0.5, 0.27, 0.2]
  tower(out, fit, {
    height: 16,
    tiers: [{ to: 1, face: { kind: 'punched', wall: BRICK, glass: [0.2, 0.22, 0.22], pitch: 3.4, floor: 4, solid: 0.6, arched: true, material: 'brick' } }],
    cornices: [{ at: 13.5, depth: 0.2, colour: [0.56, 0.42, 0.34] }],
    crown: { kind: 'parapet', height: 1, colour: [0.42, 0.26, 0.2], material: 'brick' },
  })
}

/**
 * Saybrook University, 733 Front Street (way/32947670): a charcoal grey block of about six storeys, its upper floors
 * set back with terraces, punched windows below (Mapillary 4624566957577507). OSM 26 m, agreed by the photographs.
 */
function t4b43_32947670(out: MeshBuilder, fit: Fit): void {
  const CHAR: Rgb = [0.3, 0.31, 0.33]
  tower(out, fit, {
    height: 26,
    tiers: [
      { to: 0.75, face: { kind: 'punched', wall: CHAR, glass: [0.2, 0.22, 0.25], pitch: 3.4, floor: 3.6, solid: 0.5, material: 'concrete' } },
      { to: 1, inset: 2, face: { kind: 'bands', wall: CHAR, glass: [0.22, 0.26, 0.3], floor: 3.6, solid: 0.5, material: 'concrete' } },
    ],
    crown: { kind: 'parapet', height: 0.8, colour: CHAR, material: 'concrete' },
  })
}

/**
 * Kelly Cullen Community, 220 Golden Gate Avenue (way/260140485): a beige stucco block of about eight storeys with
 * punched windows in pilaster bays. The photographs were unclear, so the height is OSM's (Mapillary 4201021399975680).
 */
function t4b44_260140485(out: MeshBuilder, fit: Fit): void {
  const BEIGE: Rgb = [0.82, 0.76, 0.64]
  tower(out, fit, {
    height: 32,
    base: { height: 4, face: { kind: 'punched', wall: [0.6, 0.56, 0.5], glass: [0.2, 0.22, 0.24], pitch: 3.6, floor: 4, solid: 0.5, material: 'stucco' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: BEIGE, glass: [0.22, 0.24, 0.26], pitch: 3.2, floor: 3.8, solid: 0.5, material: 'stucco' } }],
    crown: { kind: 'parapet', height: 1.2, colour: BEIGE, material: 'stucco' },
  })
}

/**
 * 145 TL Residences, Leavenworth Street (way/1258857968): a grey stucco residential block of about eight storeys with
 * black balcony rails, beside the Page Hotel (Mapillary 1954460135096796, 1872781716645666).
 */
function t4b44_1258857968(out: MeshBuilder, fit: Fit): void {
  const GREY: Rgb = [0.58, 0.6, 0.62]
  tower(out, fit, {
    height: 28,
    base: { height: 4, face: { kind: 'punched', wall: [0.36, 0.36, 0.38], glass: [0.2, 0.22, 0.25], pitch: 4, floor: 4, solid: 0.5, material: 'concrete' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: GREY, glass: [0.18, 0.2, 0.24], pitch: 3.4, floor: 3.1, solid: 0.45, material: 'stucco' } }],
    crown: { kind: 'parapet', height: 0.8, colour: GREY, material: 'stucco' },
  })
}

/**
 * Relation 3492934, unnamed parking garage (OSM 28 m): grey concrete decks behind deep horizontal slots between piers,
 * a dark grille ground floor and a driveway under a red PARK sign (Mapillary 557648302090268, 214309943862148).
 */
function t4b46_3492934(out: MeshBuilder, fit: Fit): void {
  const CONCRETE: Rgb = [0.62, 0.62, 0.6]
  tower(out, fit, {
    height: 28,
    base: { height: 4, face: { kind: 'punched', wall: CONCRETE, glass: [0.3, 0.3, 0.3], pitch: 5, floor: 4, solid: 0.5, material: 'concrete' } },
    tiers: [{ to: 1, face: { kind: 'bands', wall: CONCRETE, glass: [0.14, 0.14, 0.14], floor: 3.2, solid: 0.4, depth: 0.5, material: 'concrete' } }],
    crown: { kind: 'parapet', height: 1, colour: CONCRETE, material: 'concrete' },
  })
}

/**
 * Way 132125160, the Galleria Park Hotel (Hotel Sutter, 1911; OSM 32 m): about ten storeys of tan brick with tall
 * windows, arched at the top, iron balconies and a dentilled cornice, over a dark stone ground floor with a red awning
 * (Mapillary 874593757053218, 149460807516467). Front: Sutter Street.
 */
function t4b47_132125160(out: MeshBuilder, fit: Fit): void {
  const BRICK: Rgb = [0.72, 0.6, 0.46]
  const TRIM: Rgb = [0.25, 0.22, 0.22]
  tower(out, fit, {
    height: 32,
    base: { height: 4.5, face: { kind: 'punched', wall: [0.25, 0.25, 0.26], glass: [0.2, 0.2, 0.22], pitch: 4, floor: 4.5, solid: 0.6, material: 'granite' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: BRICK, glass: [0.2, 0.22, 0.25], pitch: 3.2, floor: 3.2, solid: 0.5, depth: 0.4, arched: true, material: 'brick' } }],
    cornices: [{ at: 0.85, depth: 0.6, height: 0.8, colour: TRIM }],
    crown: { kind: 'parapet', height: 1.8, colour: TRIM, material: 'concrete' },
  })
}

/**
 * Relation 15336268, 85 Second Street at Mission (OSM 38 m): an eight-storey brown brick office block of the 1910s, two
 * storeys of pale stone at the base, tall paired windows in piers and a dark dentilled cornice
 * (Mapillary 1418257265212146, 4310440992517645).
 */
function t4b48_15336268(out: MeshBuilder, fit: Fit): void {
  const BROWN: Rgb = [0.5, 0.36, 0.28]
  tower(out, fit, {
    height: 38,
    base: { height: 8, face: { kind: 'punched', wall: [0.72, 0.72, 0.7], glass: [0.25, 0.28, 0.3], pitch: 3.5, floor: 4, solid: 0.6, material: 'ashlar' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: BROWN, glass: [0.2, 0.22, 0.24], pitch: 3, floor: 3.6, solid: 0.55, depth: 0.4, material: 'brick' } }],
    crown: { kind: 'parapet', height: 1.5, colour: [0.3, 0.26, 0.24], material: 'concrete' },
  })
}

/**
 * Way 71739089, 840 Post Street at Hyde (OSM building:levels 9, height unclear): a cream brick corner block with a
 * dark shopfront at street level, a dentilled band over the ground floor and tall sash windows (Mapillary
 * 4165249430265509, 185795553486613). Trees hide much of the upper floors, so the height is a judgement.
 */
function t4b49_71739089(out: MeshBuilder, fit: Fit): void {
  const CREAM: Rgb = [0.86, 0.82, 0.74]
  tower(out, fit, {
    height: 24,
    base: { height: 4, face: { kind: 'punched', wall: [0.2, 0.2, 0.2], glass: [0.2, 0.25, 0.28], pitch: 4, floor: 4, solid: 0.5, material: 'concrete' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: CREAM, glass: [0.25, 0.28, 0.32], pitch: 3, floor: 3.2, solid: 0.5, depth: 0.4, material: 'brick' } }],
    cornices: [{ at: 0.2, depth: 0.5, height: 0.6, colour: CREAM }],
    crown: { kind: 'parapet', height: 1, colour: CREAM, material: 'stucco' },
  })
}

/**
 * Way 33571523, Mason O'Farrell Garage (325 Mason Street; OSM 25 m, nine levels): a white-grey concrete parking garage
 * with curved, banded decks round its corner, a rounded tower, a tall SELF PARKING sign and ENTER at the street
 * (Mapillary 1133772608095765, 1175785819964786). Front: Mason Street.
 */
function t4b50_33571523(out: MeshBuilder, fit: Fit): void {
  const CREAM: Rgb = [0.9, 0.89, 0.85]
  tower(out, fit, {
    height: 25,
    base: { height: 4.5, face: { kind: 'punched', wall: CREAM, glass: [0.15, 0.15, 0.16], pitch: 6, floor: 4.5, solid: 0.5, material: 'concrete' } },
    tiers: [{ to: 1, face: { kind: 'bands', wall: CREAM, glass: [0.3, 0.3, 0.3], floor: 3.2, solid: 0.45, depth: 0.5, material: 'concrete' } }],
    crown: { kind: 'parapet', height: 1.5, colour: CREAM, material: 'concrete' },
  })
}

/**
 * Way 93817363, 600 and 620 Harrison Street (OSM 24 m): a cream stone office block of about six storeys, its upper
 * corners stepped up into little pavilions, a glass band on the top floors and an arcade of dark glass at street level
 * (Mapillary 2728216087509511, 1066102998173956). Front: Harrison Street.
 */
function t4b51_93817363(out: MeshBuilder, fit: Fit): void {
  const STONE: Rgb = [0.86, 0.82, 0.72]
  tower(out, fit, {
    height: 24,
    base: { height: 4.5, face: { kind: 'curtain', wall: [0.25, 0.27, 0.3], glass: [0.25, 0.3, 0.34], pitch: 3, floor: 4.5, material: 'metal' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: STONE, glass: [0.3, 0.36, 0.4], pitch: 3.2, floor: 3.6, solid: 0.6, depth: 0.4, material: 'ashlar' } }],
    crown: { kind: 'parapet', height: 1.5, colour: STONE, material: 'ashlar' },
  })
}

/**
 * Way 243356609, the Canopy by Hilton at 250 Fourth Street (OSM 12 levels; height taken as 44 m): a dark teal glass
 * curtain-wall hotel of about twelve storeys, cream vertical piers between the glass, a concrete base with a glass
 * canopy (Mapillary 252054650049364, 4143737855746761). Front: Fourth Street.
 */
function t4b52_243356609(out: MeshBuilder, fit: Fit): void {
  const TEAL: Rgb = [0.22, 0.34, 0.36]
  tower(out, fit, {
    height: 44,
    base: { height: 4, face: { kind: 'punched', wall: [0.6, 0.6, 0.58], glass: [0.2, 0.25, 0.28], pitch: 4, floor: 4, solid: 0.5, material: 'concrete' } },
    tiers: [{ to: 1, face: { kind: 'fins', wall: [0.85, 0.84, 0.78], glass: TEAL, floor: 3.6, pitch: 3.5, solid: 0.2, depth: 0.5, material: 'metal' } }],
    crown: { kind: 'parapet', height: 1.2, colour: [0.8, 0.8, 0.78], material: 'metal' },
  })
}

/**
 * Way 173886663, 875 Howard Street (OSM 27 m): a taupe-grey render block of about seven storeys, its punched
 * windows in tall pairs, a shopfront with trees at street level (Mapillary 1262146154633121, 695154651966191).
 * Front: Howard Street.
 */
function t4b53_173886663(out: MeshBuilder, fit: Fit): void {
  const TAUPE: Rgb = [0.55, 0.53, 0.5]
  tower(out, fit, {
    height: 27,
    base: { height: 4, face: { kind: 'punched', wall: [0.2, 0.2, 0.2], glass: [0.2, 0.25, 0.28], pitch: 4, floor: 4, solid: 0.5, material: 'concrete' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: TAUPE, glass: [0.3, 0.42, 0.5], pitch: 3, floor: 3.4, solid: 0.6, depth: 0.3, material: 'concrete' } }],
    crown: { kind: 'parapet', height: 1, colour: TAUPE, material: 'concrete' },
  })
}

/**
 * Way 123646088, the Hotel Carlton at 1075 Sutter Street (OSM 38 m): a red brick lower block of about nine storeys
 * with a cream stucco tower stepped back above it, the name on the roof and a vertical HOTEL CARLTON sign on the brick
 * (Mapillary 1124349679610449, 1512788483226408). Front: Sutter Street.
 */
function t4b54_123646088(out: MeshBuilder, fit: Fit): void {
  const BRICK: Rgb = [0.6, 0.3, 0.22]
  const CREAM: Rgb = [0.9, 0.86, 0.74]
  tower(out, fit, {
    height: 38,
    base: { height: 4, face: { kind: 'punched', wall: [0.3, 0.25, 0.22], glass: [0.2, 0.22, 0.25], pitch: 4, floor: 4, solid: 0.5, material: 'concrete' } },
    tiers: [
      { to: 0.6, face: { kind: 'punched', wall: BRICK, glass: [0.22, 0.24, 0.27], pitch: 3.2, floor: 3.2, solid: 0.6, depth: 0.4, material: 'brick' } },
      { to: 1, inset: 3, face: { kind: 'punched', wall: CREAM, glass: [0.25, 0.27, 0.3], pitch: 3.6, floor: 3.2, solid: 0.7, depth: 0.3, material: 'stucco' } },
    ],
    cornices: [{ at: 0.6, depth: 0.5, height: 0.6, colour: CREAM }],
    crown: { kind: 'parapet', height: 1.2, colour: CREAM, material: 'stucco' },
  })
}

/**
 * Way 33617520, the Ellis O'Farrell Garage (OSM 25 m, multi-storey parking): a cream concrete garage whose open decks
 * show as bands, a wide dark opening at the ground floor (Mapillary 1319428179591776, 757609483546063). Front taken as
 * Ellis Street, the garage's first-named street; not confirmed.
 */
function t4b55_33617520(out: MeshBuilder, fit: Fit): void {
  const CREAM: Rgb = [0.82, 0.8, 0.74]
  tower(out, fit, {
    height: 25,
    base: { height: 4.5, face: { kind: 'punched', wall: CREAM, glass: [0.12, 0.12, 0.13], pitch: 6, floor: 4.5, solid: 0.4, material: 'concrete' } },
    tiers: [{ to: 1, face: { kind: 'bands', wall: CREAM, glass: [0.3, 0.3, 0.3], floor: 3.2, solid: 0.45, depth: 0.5, material: 'concrete' } }],
    crown: { kind: 'parapet', height: 1.2, colour: CREAM, material: 'concrete' },
  })
}

/**
 * Way 941560578, the CitizenM hotel at 72 Ellis Street (OSM 11 levels; height taken as 44 m): a narrow tower of pale
 * panels and tall vertical glazing, a dark glass ground floor (Mapillary 983250193688138, 297681015446862). Front: Ellis
 * Street.
 */
function t4b55_941560578(out: MeshBuilder, fit: Fit): void {
  const PALE: Rgb = [0.86, 0.86, 0.84]
  tower(out, fit, {
    height: 44,
    base: { height: 4, face: { kind: 'curtain', wall: [0.25, 0.27, 0.3], glass: [0.25, 0.3, 0.34], pitch: 3, floor: 4, material: 'metal' } },
    tiers: [{ to: 1, face: { kind: 'curtain', wall: PALE, glass: [0.3, 0.4, 0.48], pitch: 3, floor: 3.4, solid: 0.3, depth: 0.3, material: 'metal' } }],
    crown: { kind: 'parapet', height: 1.2, colour: PALE, material: 'metal' },
  })
}

/**
 * Way 147689078, the Elevated Shops building (OSM 24 m): a cream stone block of about six storeys on a corner, its
 * cornice dentilled and a dark glass shopfront below (Mapillary 1117758543133409, 1649515515956605). Front taken as
 * O'Farrell Street, the nearest street; the Powell Street face is the other.
 */
function t4b55_147689078(out: MeshBuilder, fit: Fit): void {
  const CREAM: Rgb = [0.88, 0.85, 0.78]
  tower(out, fit, {
    height: 24,
    base: { height: 4.5, face: { kind: 'punched', wall: [0.2, 0.22, 0.24], glass: [0.2, 0.22, 0.24], pitch: 4, floor: 4.5, solid: 0.5, material: 'granite' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: CREAM, glass: [0.3, 0.34, 0.38], pitch: 3.4, floor: 3.2, solid: 0.55, depth: 0.4, material: 'stucco' } }],
    cornices: [{ at: 0.85, depth: 0.6, height: 0.8, colour: CREAM }],
    crown: { kind: 'parapet', height: 1.5, colour: CREAM, material: 'stucco' },
  })
}

/**
 * Way 35536720, the Fashion Institute of Design and Merchandising at 55 Stockton Street (OSM 38 m): a pale grey
 * concrete block of about seven storeys with a rounded corner, tall windows in deep piers and a black awning over a
 * dark shopfront (Mapillary 802711638788174, 1355830096099336). Front: Stockton Street. The rounded corner is not drawn.
 */
function t4b56_35536720(out: MeshBuilder, fit: Fit): void {
  const GREY: Rgb = [0.78, 0.78, 0.76]
  tower(out, fit, {
    height: 38,
    base: { height: 4.5, face: { kind: 'punched', wall: [0.2, 0.2, 0.22], glass: [0.15, 0.2, 0.24], pitch: 4, floor: 4.5, solid: 0.5, material: 'granite' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: GREY, glass: [0.3, 0.34, 0.38], pitch: 3.4, floor: 3.6, solid: 0.55, depth: 0.5, material: 'concrete' } }],
    crown: { kind: 'parapet', height: 1.5, colour: GREY, material: 'concrete' },
  })
}

/**
 * Way 80296763, the Academy of Art University Game Development building at 180 New Montgomery Street (OSM 31 m, eight
 * levels): a cream block of about eight storeys with tall punched windows over a brown shopfront, the school's banner
 * on its face (Mapillary 1195107194415167, 1299197131880920). Front: New Montgomery Street.
 */
function t4b57_80296763(out: MeshBuilder, fit: Fit): void {
  const CREAM: Rgb = [0.86, 0.82, 0.74]
  tower(out, fit, {
    height: 31,
    base: { height: 4, face: { kind: 'punched', wall: [0.4, 0.28, 0.2], glass: [0.2, 0.22, 0.24], pitch: 4, floor: 4, solid: 0.5, material: 'concrete' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: CREAM, glass: [0.25, 0.28, 0.32], pitch: 3, floor: 3.4, solid: 0.55, depth: 0.4, material: 'stucco' } }],
    crown: { kind: 'parapet', height: 1.2, colour: CREAM, material: 'stucco' },
  })
}

/**
 * Way 260155572, 201 Turk Street, the Chinatown CDC building (OSM 26 m, photographs ~8 storeys and a stepped top): a
 * taupe-grey stucco block of projecting bay windows, paired and stacked, a brown shopfront base with a takeaway and a
 * halal shop, and a dentilled cornice at the top (Mapillary 683340666394897, 1118393568862137). Front: Turk Street.
 */
function t4b58_260155572(out: MeshBuilder, fit: Fit): void {
  const TAUPE: Rgb = [0.5, 0.46, 0.42]
  tower(out, fit, {
    height: 27,
    base: { height: 4.5, face: { kind: 'punched', wall: [0.3, 0.22, 0.18], glass: [0.18, 0.2, 0.22], pitch: 4, floor: 4.5, solid: 0.5, material: 'concrete' } },
    tiers: [{ to: 1, face: { kind: 'bays', wall: TAUPE, glass: [0.2, 0.25, 0.3], pitch: 3.2, floor: 3.1, solid: 0.5, material: 'stucco' } }],
    cornices: [{ at: 0.82, depth: 0.35, height: 0.5, colour: [0.56, 0.52, 0.48] }],
    crown: { kind: 'parapet', height: 1.4, colour: [0.56, 0.52, 0.48], material: 'stucco' },
  })
}

/**
 * Way 288648571, 2 Townsend Street, South Beach Marina Apartments BLDG 1 (OSM 36 m, about ten storeys): a tall pale
 * tower of stucco over a dark grey upper block with stacked, recessed balconies, set back from a shorter stucco base
 * (Mapillary 24347962461524776, 1193217436160957). Front: Townsend Street. Unsure of the exact stepping.
 */
function t4b59_288648571(out: MeshBuilder, fit: Fit): void {
  const PALE: Rgb = [0.8, 0.79, 0.76]
  tower(out, fit, {
    height: 36,
    tiers: [
      { to: 0.7, face: { kind: 'bays', wall: PALE, glass: [0.2, 0.25, 0.3], pitch: 3.4, floor: 3.2, solid: 0.6, depth: 0.5, material: 'stucco' } },
      { to: 1, inset: 4, face: { kind: 'punched', wall: [0.4, 0.42, 0.44], glass: [0.16, 0.18, 0.2], pitch: 3.6, floor: 3.2, solid: 0.7, depth: 0.5, material: 'concrete' } },
    ],
    crown: { kind: 'parapet', height: 1.2, colour: PALE, material: 'stucco' },
  })
}

/**
 * Way 260142631, 455 Eddy Street, Mosser Towers (OSM 41 m, about twelve storeys): white-grey concrete towers in
 * stepped blocks, curved fronts with glass bays and grey bands between the floors, a pale stucco base with iron balcony
 * rails (Mapillary 811428324562774, 1104480550209422). Front: Eddy Street. Its second way, 350 Turk Street (way/260142634,
 * 41 m, also "Mosser Towers"), is not modelled here.
 */
function t4b60_260142631(out: MeshBuilder, fit: Fit): void {
  const WHITE: Rgb = [0.9, 0.89, 0.86]
  tower(out, fit, {
    height: 41,
    base: { height: 4, face: { kind: 'punched', wall: [0.84, 0.82, 0.78], glass: [0.22, 0.26, 0.3], pitch: 3.6, floor: 4, solid: 0.5, material: 'stucco' } },
    tiers: [
      { to: 0.55, face: { kind: 'bands', wall: WHITE, glass: [0.42, 0.5, 0.56], floor: 3.2, solid: 0.74, material: 'stucco' } },
      { to: 1, inset: 2.5, face: { kind: 'bands', wall: WHITE, glass: [0.42, 0.5, 0.56], floor: 3.2, solid: 0.74, material: 'stucco' } },
    ],
    cornices: [{ at: 0.55, depth: 0.3, height: 0.4, colour: [0.62, 0.64, 0.66] }],
    crown: { kind: 'parapet', height: 1, colour: WHITE, material: 'stucco' },
  })
}

/**
 * Way 32947055, 1000 Mason Street, the Brocklebank Apartments (1925, Weeks & Day; OSM 40 m, ten levels): a cream stucco
 * block round an open court, punched windows with architraves, corbelled cornice bands at the floor lines, a
 * stepped wing and a tiled hipped crown with turrets (Mapillary 401660938757216, 832156170997069). Front: Mason Street.
 */
function t4b61_32947055(out: MeshBuilder, fit: Fit): void {
  const CREAM: Rgb = [0.9, 0.84, 0.72]
  tower(out, fit, {
    height: 38,
    base: { height: 3.5, face: { kind: 'punched', wall: [0.8, 0.75, 0.64], glass: [0.22, 0.25, 0.28], pitch: 3.4, floor: 3.5, solid: 0.6, material: 'stucco' } },
    tiers: [
      { to: 0.7, face: { kind: 'punched', wall: CREAM, glass: [0.24, 0.27, 0.3], pitch: 4, floor: 3.4, solid: 0.62, depth: 0.35, material: 'stucco' }, cornice: { depth: 0.5, height: 0.45, colour: [0.82, 0.76, 0.64] } },
      { to: 1, inset: 2, face: { kind: 'punched', wall: CREAM, glass: [0.24, 0.27, 0.3], pitch: 4, floor: 3.4, solid: 0.62, depth: 0.35, material: 'stucco' } },
    ],
    crown: { kind: 'hip', height: 3.5, inset: 0.6, colour: [0.52, 0.3, 0.22], material: 'tile' },
  })
}

/**
 * Way 32947763, 815-875 Battery Street, KPIX TV (OSM 23 m, five storeys): a tan-grey stone block of about five
 * storeys on a darker ground floor, deep horizontal rustication, tall windows with dark glass, a pedimented parapet
 * carrying the station's name on the Battery front and a mast behind (Mapillary 3971769626468138, 471239961566786).
 * Front: Battery Street.
 */
function t4b62_32947763(out: MeshBuilder, fit: Fit): void {
  const STONE: Rgb = [0.66, 0.61, 0.52]
  tower(out, fit, {
    height: 23,
    base: { height: 4.5, face: { kind: 'punched', wall: [0.34, 0.32, 0.3], glass: [0.14, 0.16, 0.18], pitch: 4.5, floor: 4.5, solid: 0.45, material: 'ashlar' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: STONE, glass: [0.18, 0.2, 0.22], pitch: 4.5, floor: 4.1, solid: 0.5, depth: 0.5, material: 'ashlar' } }],
    crown: { kind: 'parapet', height: 1.6, colour: STONE, material: 'ashlar' },
  })
  const ring = towerRing(fit), e = edgeAt(ring, edgeFacing(ring, 180))
  signText(out, 'KPIX', e.mid.x + e.nx * 0.08, 21.6, e.mid.z + e.nz * 0.08, 1.1, [0.95, 0.95, 0.95], { heading: e.heading, lit: true })
}

/**
 * Way 25759093, 795 Folsom Street (OSM 24 m, six levels above a ground floor): a white precast office block of seven
 * storeys with a regular grid of arched recesses, each window a dark square inside a round-headed opening, and a
 * recessed ground floor with a shop front of arched glass (Mapillary 1069169575285304, 1510932602941561). Front: Folsom
 * Street.
 */
function t4b63_25759093(out: MeshBuilder, fit: Fit): void {
  const WHITE: Rgb = [0.92, 0.92, 0.9]
  tower(out, fit, {
    height: 24,
    base: { height: 4.5, face: { kind: 'punched', wall: WHITE, glass: [0.14, 0.16, 0.18], pitch: 3.2, floor: 4.5, solid: 0.4, depth: 0.5, arched: true, material: 'concrete' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: WHITE, glass: [0.14, 0.16, 0.18], pitch: 3.2, floor: 3.3, solid: 0.4, depth: 0.5, arched: true, material: 'concrete' } }],
    crown: { kind: 'parapet', height: 1, colour: WHITE, material: 'concrete' },
  })
}

/**
 * Beale Street, unnamed in OSM (way/939460954), 28 m: the Natalie Gubb Commons affordable housing, a seven-storey
 * block in beige-grey stucco, its windows in recessed bays with louvred panels between, over a dark ground floor
 * with a metal grille. (Mapillary 1961791404557242, 1121771060006331.)
 */
function t4b64_939460954(out: MeshBuilder, fit: Fit): void {
  const BEIGE: Rgb = [0.76, 0.74, 0.7]
  tower(out, fit, {
    height: 28,
    base: { height: 4, face: { kind: 'punched', wall: [0.42, 0.42, 0.42], material: 'concrete', glass: [0.22, 0.24, 0.27], pitch: 4, solid: 0.5, floor: 4 } },
    tiers: [{ to: 1, face: { kind: 'bands', wall: BEIGE, material: 'stucco', glass: [0.3, 0.36, 0.42], floor: 3.2, solid: 0.45 } }],
    crown: { kind: 'parapet', height: 1, colour: BEIGE, material: 'stucco' },
  })
}

/**
 * Folsom Street, Transbay Block 2 West (way/1389915136), 36 m: a pale grey nine-storey block with a grid of
 * windows, behind a tensile-canopied plaza and a granite-dark ground floor. The OSM outline is a provisional
 * construction placeholder, so the massing is taken from the photographs and may be wrong.
 * (Mapillary 2784160035054264, 153587530716997.)
 */
function t4b65_1389915136(out: MeshBuilder, fit: Fit): void {
  const PALE: Rgb = [0.86, 0.85, 0.82]
  tower(out, fit, {
    height: 36,
    base: { height: 4.5, face: { kind: 'punched', wall: [0.5, 0.5, 0.5], material: 'concrete', glass: [0.2, 0.23, 0.26], pitch: 4, solid: 0.5, floor: 4.5 } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: PALE, material: 'stucco', glass: [0.25, 0.3, 0.36], pitch: 3.2, floor: 3.4, solid: 0.5 } }],
    crown: { kind: 'parapet', height: 1, colour: PALE, material: 'stucco' },
  })
}

/**
 * 77 Dow Place (way/114709400), 42 m: a striped block with orange-brown vertical bands between cream piers, its
 * upper storeys set back under a cream parapet. (Mapillary 522353390782684, 779869278404043.)
 */
function t4b66_114709400(out: MeshBuilder, fit: Fit): void {
  const CREAM: Rgb = [0.92, 0.9, 0.86], TERRA: Rgb = [0.74, 0.42, 0.28]
  tower(out, fit, {
    height: 42,
    base: { height: 4.5, face: { kind: 'punched', wall: [0.7, 0.66, 0.6], material: 'concrete', glass: [0.2, 0.22, 0.25], pitch: 4, solid: 0.5, floor: 4.5 } },
    tiers: [
      { to: 0.64, face: { kind: 'fins', wall: CREAM, glass: TERRA, pitch: 2.6, depth: 0.25, solid: 0.6, floor: 3.4, material: 'terracotta' } },
      { to: 1, inset: 3, face: { kind: 'punched', wall: CREAM, glass: [0.3, 0.34, 0.4], pitch: 2.8, floor: 3.4, solid: 0.5, material: 'stucco' }, cornice: { depth: 0.5, height: 0.5, colour: CREAM } },
    ],
    crown: { kind: 'parapet', height: 1, colour: CREAM, material: 'stucco' },
  })
}

/**
 * The Barnes, 225 Powell Street (way/35024381), 30 m: a cream stucco Beaux-Arts hotel of seven storeys over a tan
 * stone ground floor, with architraves round the windows and a moulded cornice under a parapet, on the Powell and
 * O'Farrell corner. (Mapillary 2085621448247025, 1705386196683831.)
 */
function t4b67_35024381(out: MeshBuilder, fit: Fit): void {
  const CREAM: Rgb = [0.9, 0.87, 0.8], TAN: Rgb = [0.78, 0.66, 0.46]
  tower(out, fit, {
    height: 30,
    base: { height: 5, face: { kind: 'punched', wall: TAN, material: 'ashlar', glass: [0.16, 0.18, 0.2], pitch: 4, solid: 0.45, floor: 5 } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: CREAM, material: 'stucco', glass: [0.2, 0.22, 0.26], pitch: 4, floor: 3.2, solid: 0.45 }, cornice: { depth: 0.7, height: 0.7, colour: CREAM } }],
    crown: { kind: 'parapet', height: 1.2, colour: CREAM, material: 'stucco' },
  })
}

/**
 * Rincon Green, 333 Harrison Street (relation/19306631), 21 m: a seven-storey cream apartment block with recessed
 * balcony bays and window bands, and an ochre entrance at street level. (Mapillary 1269521654891486.)
 */
function t4b68_19306631(out: MeshBuilder, fit: Fit): void {
  const CREAM: Rgb = [0.9, 0.89, 0.85]
  tower(out, fit, {
    height: 21,
    base: { height: 4, face: { kind: 'punched', wall: [0.84, 0.72, 0.38], material: 'stucco', glass: [0.22, 0.25, 0.28], pitch: 4, solid: 0.5, floor: 4 } },
    tiers: [{ to: 1, face: { kind: 'bands', wall: CREAM, material: 'stucco', glass: [0.3, 0.34, 0.38], floor: 3, solid: 0.4 } }],
    crown: { kind: 'parapet', height: 0.8, colour: CREAM, material: 'stucco' },
  })
}

/**
 * Eastern Park Apartments, 640 Polk Street (way/288532297), 36 m: a 1970s tan tower of about twelve storeys with
 * long ribbons of windows over a plain wall, on the corner of Polk and Eddy. (Mapillary 233293378796095,
 * 363939151904411.)
 */
function t4b69_288532297(out: MeshBuilder, fit: Fit): void {
  const TAN: Rgb = [0.84, 0.78, 0.66]
  tower(out, fit, {
    height: 36,
    tiers: [{ to: 1, face: { kind: 'bands', wall: TAN, material: 'concrete', glass: [0.22, 0.26, 0.3], floor: 3.2, solid: 0.4 } }],
    crown: { kind: 'parapet', height: 1, colour: TAN, material: 'concrete' },
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
  t4b28_148551351,
  t4b28_148551346,
  t4b29_112758588,
  t4b30_1487160484,
  t4b30_12734194,
  t4b31Howard120,
  t4b32Mosso,
  t4b33Courtyard761,
  t4b33Post747,
  t4b33Alcazar,
  t4b34SaintFrancisTower,
  t4b35Harrison1,
  t4b36_35174714,
  t4b36_173237459,
  t4b37_474341709,
  t4b37_135174116,
  t4b38_256720468,
  t4b39_79377152,
  t4b39_79377194,
  t4b40_112864753,
  t4b41_149757921,
  t4b42_113347426,
  t4b42_113347425,
  t4b43_32947670,
  t4b44_260140485,
  t4b44_1258857968,
  t4b46_3492934,
  t4b47_132125160,
  t4b48_15336268,
  t4b49_71739089,
  t4b50_33571523,
  t4b51_93817363,
  t4b52_243356609,
  t4b53_173886663,
  t4b54_123646088,
  t4b55_33617520,
  t4b55_941560578,
  t4b55_147689078,
  t4b56_35536720,
  t4b57_80296763,
  t4b58_260155572,
  t4b59_288648571,
  t4b60_260142631,
  t4b61_32947055,
  t4b62_32947763,
  t4b63_25759093,
  t4b64_939460954,
  t4b65_1389915136,
  t4b66_114709400,
  t4b67_35024381,
  t4b68_19306631,
  t4b69_288532297,
}
