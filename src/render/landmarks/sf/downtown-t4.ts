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

/**
 * Geary Courtyard Apartments (way/56723860), Geary at Jones: a cream stucco apartment block of about seven storeys, its
 * windows in pairs over a shopfront of halal takeaways and a dark stone-clad ground floor. (Mapillary 1760910134793733,
 * 670454199360792.)
 */
function t4b71_56723860(out: MeshBuilder, fit: Fit): void {
  const CREAM: Rgb = [0.84, 0.82, 0.76]
  tower(out, fit, {
    height: 32,
    base: { height: 4, face: { kind: 'punched', wall: [0.62, 0.6, 0.56], material: 'ashlar', glass: [0.2, 0.22, 0.24], pitch: 4, solid: 0.5, floor: 4 } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: CREAM, material: 'stucco', glass: [0.26, 0.3, 0.34], pitch: 3, solid: 0.55, floor: 3.2 } }],
    crown: { kind: 'parapet', height: 1, colour: CREAM, material: 'stucco' },
  })
}

/**
 * 2 Townsend Street (way/288647982): a pale stucco block of about ten storeys on a grey base of tall columns and a
 * gated courtyard entrance, with horizontal ribbons of windows above. (Mapillary 1308405944232990, one photograph.)
 */
function t4b72_288647982(out: MeshBuilder, fit: Fit): void {
  const PALE: Rgb = [0.86, 0.82, 0.8]
  tower(out, fit, {
    height: 35,
    base: { height: 4, face: { kind: 'blank', wall: [0.6, 0.58, 0.54], material: 'concrete' } },
    tiers: [{ to: 1, face: { kind: 'bands', wall: PALE, glass: [0.3, 0.36, 0.4], floor: 3.2, solid: 0.55, material: 'stucco' } }],
    crown: { kind: 'parapet', height: 1, colour: PALE, material: 'stucco' },
  })
}

/**
 * 333 Main Street (way/421816058): a glass tower of about eight storeys in long curving ribbons of blue-green glass,
 * set on a granite base, with a grey panelled block beside it on Main. (Mapillary 559204368454231, 2208969706272805.)
 */
function t4b73_421816058(out: MeshBuilder, fit: Fit): void {
  const STEEL: Rgb = [0.36, 0.44, 0.46]
  tower(out, fit, {
    height: 35,
    base: { height: 6, face: { kind: 'blank', wall: [0.4, 0.4, 0.4], material: 'granite' } },
    tiers: [{ to: 1, face: { kind: 'curtain', wall: STEEL, glass: [0.2, 0.38, 0.42], pitch: 3.2, floor: 3.4, material: 'metal' } }],
    crown: { kind: 'parapet', height: 1, colour: STEEL, material: 'metal' },
  })
}

/**
 * Orchard Hotel (way/256499427), 466 Bush Street: a cream-stucco hotel of about nine storeys with a terracotta band
 * across the middle, an arched entrance and flagged shopfronts at street level. (Mapillary 758581069964458,
 * 1191346849689345.)
 */
function t4b74_256499427(out: MeshBuilder, fit: Fit): void {
  const CREAM: Rgb = [0.88, 0.84, 0.76]
  const TERRA: Rgb = [0.7, 0.42, 0.32]
  tower(out, fit, {
    height: 32,
    base: { height: 4, face: { kind: 'punched', wall: TERRA, material: 'brick', glass: [0.22, 0.2, 0.2], pitch: 4, solid: 0.5, arched: true, floor: 4 } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: CREAM, material: 'stucco', glass: [0.26, 0.3, 0.34], pitch: 3.2, solid: 0.5, floor: 3.2 } }],
    cornices: [{ at: 0.45, depth: 0.5, height: 0.6, colour: TERRA }],
    crown: { kind: 'parapet', height: 1.2, colour: CREAM, material: 'stucco' },
  })
}

/**
 * 500 Third Street (way/147508936): a six-storey cream loft with tall many-paned steel-sash windows set in a plain
 * stucco wall, over a dark grey base of shopfronts. (Mapillary 1488574945895417, 1434473814298601.)
 */
function t4b75_147508936(out: MeshBuilder, fit: Fit): void {
  const CREAM: Rgb = [0.84, 0.8, 0.7]
  tower(out, fit, {
    height: 23,
    base: { height: 4, face: { kind: 'blank', wall: [0.3, 0.31, 0.33], material: 'concrete' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: CREAM, material: 'stucco', glass: [0.3, 0.35, 0.4], pitch: 3.4, solid: 0.3, floor: 3.8 } }],
    crown: { kind: 'parapet', height: 1.2, colour: CREAM, material: 'stucco' },
  })
}

/**
 * Sterne School, Gibb Street (way/256072725): a three-storey tan brick school with a plain row of punched windows,
 * a deep roof overhang and a glazed top floor set back under it, the entrance under a stone-faced porch. (Mapillary
 * 1620177758609515, 660152552448628.) OSM gives 56 m, but the photographs show the school alone at about three storeys.
 */
function t4b76_256072725(out: MeshBuilder, fit: Fit): void {
  const TAN: Rgb = [0.76, 0.6, 0.46]
  tower(out, fit, {
    height: 16,
    tiers: [{ to: 1, face: { kind: 'punched', wall: TAN, material: 'brick', glass: [0.2, 0.24, 0.28], pitch: 3.2, solid: 0.5, floor: 3.6 } }],
    crown: { kind: 'parapet', height: 1, colour: TAN, material: 'brick' },
  })
}

/**
 * An early-century office block on the corner of Post and Grant (way/135174117): a white Beaux-Arts block of about
 * twelve storeys, its windows in regular bays between pilasters, with a deep modillioned cornice over a set-back top.
 * (Mapillary 2891196621134196, 1349217525969101.)
 */
function t4b77_135174117(out: MeshBuilder, fit: Fit): void {
  const WHITE: Rgb = [0.92, 0.9, 0.86]
  tower(out, fit, {
    height: 44,
    base: { height: 4, face: { kind: 'punched', wall: [0.7, 0.68, 0.64], material: 'ashlar', glass: [0.2, 0.22, 0.25], pitch: 4, solid: 0.45, floor: 4 } },
    tiers: [
      { to: 0.8, face: { kind: 'punched', wall: WHITE, material: 'stucco', glass: [0.24, 0.28, 0.32], pitch: 3.6, solid: 0.6, floor: 3.4 } },
      { to: 1, inset: 1.5, face: { kind: 'punched', wall: WHITE, material: 'stucco', glass: [0.24, 0.28, 0.32], pitch: 3.6, solid: 0.6, floor: 3.4 } },
    ],
    cornices: [{ at: 0.8, depth: 0.6, height: 0.8, colour: WHITE }],
    crown: { kind: 'parapet', height: 2.2, colour: WHITE, material: 'stucco' },
  })
}

/**
 * North Ping Yuen (way/288487237): a white render slab of about ten storeys with teal balcony bands, over a blank
 * ground floor, flat-topped. (Mapillary 1276284967319206, 572060157464655.)
 */
function t4b78_288487237(out: MeshBuilder, fit: Fit): void {
  const WHITE: Rgb = [0.92, 0.91, 0.88]
  tower(out, fit, {
    height: 32,
    base: { height: 3, face: { kind: 'blank', wall: [0.7, 0.7, 0.68], material: 'concrete' } },
    tiers: [{ to: 1, face: { kind: 'bands', wall: WHITE, glass: [0.3, 0.6, 0.57], floor: 3.2, solid: 0.5, material: 'stucco' } }],
    crown: { kind: 'parapet', height: 1, colour: WHITE, material: 'stucco' },
  })
}

/**
 * 645 Harrison Street (way/93817372): a grey painted concrete block of four storeys, its steel-sash windows in long
 * ribbons, a flat parapet over. (Mapillary 535117415951522, 2254287138333361.)
 */
function t4b79_93817372(out: MeshBuilder, fit: Fit): void {
  const GREY: Rgb = [0.5, 0.52, 0.54]
  tower(out, fit, {
    height: 17,
    tiers: [{ to: 1, face: { kind: 'bands', wall: GREY, glass: [0.42, 0.46, 0.5], floor: 4.2, solid: 0.3, material: 'concrete' } }],
    crown: { kind: 'parapet', height: 0.8, colour: [0.4, 0.42, 0.44], material: 'concrete' },
  })
}

/**
 * The Salvation Army Railton Place (way/256047252), on Jones and Turk: a tan brick Edwardian block of six storeys,
 * a heavy dark green cornice under its top and dark shopfronts at street level. (Mapillary 2887971414799460,
 * 898992477719021.) OSM gives 32 m; the photographs show about 24 m.
 */
function t4b80_256047252(out: MeshBuilder, fit: Fit): void {
  const TAN: Rgb = [0.74, 0.62, 0.48]
  const GREEN: Rgb = [0.2, 0.27, 0.22]
  tower(out, fit, {
    height: 24,
    base: { height: 4, face: { kind: 'blank', wall: GREEN, material: 'concrete' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: TAN, material: 'brick', glass: [0.2, 0.24, 0.26], pitch: 3, solid: 0.5, floor: 3.2 } }],
    cornices: [{ at: 0.9, depth: 0.7, height: 0.9, colour: GREEN }],
    crown: { kind: 'parapet', height: 1.2, colour: GREEN, material: 'brick' },
  })
}

/**
 * 150 Post Street (way/172250614): a cream stone office block of about nine storeys, its windows in pilastered bays
 * with architrave heads, over a glazed retail base. (Mapillary 1870777336595233, 1307463840559633.)
 */
function t4b81_172250614(out: MeshBuilder, fit: Fit): void {
  const STONE: Rgb = [0.82, 0.78, 0.68]
  tower(out, fit, {
    height: 30,
    base: { height: 4.5, face: { kind: 'curtain', wall: [0.2, 0.22, 0.22], glass: [0.2, 0.24, 0.28], pitch: 3, floor: 4.5, material: 'metal' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: STONE, material: 'ashlar', glass: [0.24, 0.28, 0.32], pitch: 4.2, solid: 0.55, floor: 3.3 } }],
    cornices: [{ at: 0.92, depth: 0.8, height: 1, colour: STONE }],
    crown: { kind: 'parapet', height: 1.5, colour: STONE, material: 'ashlar' },
  })
}

/**
 * 832 Folsom Street (way/151980105): a taupe panelled block of about ten storeys, white horizontal bands between its
 * rows of dark windows, over a brown ground floor. (Mapillary 136543378612459, 540240982482475.)
 */
function t4b82_151980105(out: MeshBuilder, fit: Fit): void {
  const TAUPE: Rgb = [0.62, 0.58, 0.53]
  const WHITE: Rgb = [0.9, 0.9, 0.88]
  tower(out, fit, {
    height: 35,
    base: { height: 4, face: { kind: 'blank', wall: [0.36, 0.3, 0.26], material: 'concrete' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: TAUPE, material: 'stucco', glass: [0.25, 0.25, 0.27], pitch: 3.2, solid: 0.6, floor: 3.2 } }],
    cornices: [
      { at: 0.3, depth: 0.25, height: 0.5, colour: WHITE },
      { at: 0.6, depth: 0.25, height: 0.5, colour: WHITE },
      { at: 0.9, depth: 0.25, height: 0.5, colour: WHITE },
    ],
    crown: { kind: 'parapet', height: 1.2, colour: TAUPE, material: 'stucco' },
  })
}

/**
 * An early office block at Post and Stockton (way/135174114): a white Beaux-Arts block of six storeys with pilasters,
 * a deep cornice and a balustrade on top, over a dark granite and glass ground floor. (Mapillary 865009077774593,
 * 785216741134107.)
 */
function t4b83_135174114(out: MeshBuilder, fit: Fit): void {
  const WHITE: Rgb = [0.92, 0.9, 0.86]
  tower(out, fit, {
    height: 27,
    base: { height: 5, face: { kind: 'curtain', wall: [0.14, 0.14, 0.15], glass: [0.2, 0.22, 0.25], pitch: 3.5, floor: 5, material: 'granite' } },
    tiers: [
      { to: 0.84, face: { kind: 'punched', wall: WHITE, material: 'stucco', glass: [0.22, 0.25, 0.3], pitch: 4.2, solid: 0.55, floor: 3.6 } },
      { to: 1, inset: 1, face: { kind: 'punched', wall: WHITE, material: 'stucco', glass: [0.22, 0.25, 0.3], pitch: 4.2, solid: 0.55, floor: 3.6 } },
    ],
    cornices: [{ at: 0.84, depth: 0.8, height: 0.9, colour: WHITE }],
    crown: { kind: 'balustrade', height: 1.6, colour: WHITE, material: 'stucco', pier: true },
  })
}

/**
 * 361 TL Residences (way/1059931715): a narrow cream block of about eight storeys, its front a run of curved bay
 * windows, with a dark plinth. (Mapillary 620847924428577, 654496813911990.) OSM gives 32 m; the photographs about 26 m.
 */
function t4b84_1059931715(out: MeshBuilder, fit: Fit): void {
  const CREAM: Rgb = [0.9, 0.87, 0.8]
  tower(out, fit, {
    height: 26,
    base: { height: 4, face: { kind: 'blank', wall: [0.25, 0.25, 0.26], material: 'concrete' } },
    tiers: [{ to: 1, face: { kind: 'bays', wall: CREAM, glass: [0.3, 0.36, 0.4], floor: 3.2, pitch: 3, material: 'stucco', bay: { depth: 0.9, round: true } } }],
    crown: { kind: 'parapet', height: 1, colour: CREAM, material: 'stucco' },
  })
}

/**
 * Cruise, Brannan Street (way/346093777): a red-brick office block of five storeys, punched windows in a regular
 * grid with dark sunshade heads, a glazed ground floor and a blue-fenced terrace on the street. (Mapillary 1536294064396978, 593164780395398.)
 */
function t4b85_346093777(out: MeshBuilder, fit: Fit): void {
  const BRICK: Rgb = [0.62, 0.3, 0.2]
  tower(out, fit, {
    height: 16,
    base: { height: 4, face: { kind: 'curtain', wall: [0.2, 0.21, 0.22], glass: [0.3, 0.36, 0.4], pitch: 4, floor: 4, material: 'metal' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: BRICK, glass: [0.22, 0.26, 0.3], pitch: 3.6, floor: 3.2, solid: 0.5, material: 'brick' } }],
    crown: { kind: 'parapet', height: 0.8, colour: BRICK, material: 'brick' },
  })
}

/**
 * 111 Jones Street (way/260155577): a cream and peach stucco block of about eight storeys at the Golden Gate corner,
 * its front a run of teal-framed curved bay windows over a dark stone base. (Mapillary 2885772338418851, 161063956131550.)
 */
function t4b86_260155577(out: MeshBuilder, fit: Fit): void {
  const CREAM: Rgb = [0.9, 0.84, 0.74]
  tower(out, fit, {
    height: 26,
    base: { height: 4.5, face: { kind: 'blank', wall: [0.3, 0.26, 0.24], material: 'granite' } },
    tiers: [{ to: 1, face: { kind: 'bays', wall: CREAM, glass: [0.18, 0.36, 0.36], floor: 3, pitch: 4, material: 'stucco', bay: { depth: 1, round: true } } }],
    crown: { kind: 'parapet', height: 1, colour: CREAM, material: 'stucco' },
  })
}

/**
 * 625;635 2nd Street (way/112927453): an 1905 red-brick warehouse of four storeys, round-headed windows, iron fire
 * escapes on the front and a black painted ground floor with big shopfront glass. (Mapillary 753423557617684, 2171383733332224.)
 */
function t4b87_112927453(out: MeshBuilder, fit: Fit): void {
  const BRICK: Rgb = [0.68, 0.3, 0.2]
  tower(out, fit, {
    height: 16,
    base: { height: 4.5, face: { kind: 'blank', wall: [0.16, 0.16, 0.17], material: 'concrete' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: BRICK, glass: [0.22, 0.26, 0.3], pitch: 3.2, floor: 3.4, solid: 0.6, arched: true, material: 'brick' } }],
    crown: { kind: 'parapet', height: 0.8, colour: BRICK, material: 'brick' },
  })
}

/**
 * Unnamed block between Zeno Place and Beale Street (way/192883910): a tan terracotta-coloured office block of about
 * five storeys with a dark ground floor and a canopied entrance, the windows in bands. (Mapillary 867377578839576, 570983052270115.)
 */
function t4b88_192883910(out: MeshBuilder, fit: Fit): void {
  const TAN: Rgb = [0.72, 0.52, 0.36]
  tower(out, fit, {
    height: 20,
    base: { height: 4.2, face: { kind: 'curtain', wall: [0.25, 0.25, 0.25], glass: [0.3, 0.34, 0.36], pitch: 4, floor: 4.2, material: 'metal' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: TAN, glass: [0.22, 0.26, 0.3], pitch: 4, floor: 3.4, solid: 0.5, material: 'concrete' } }],
    crown: { kind: 'parapet', height: 0.8, colour: TAN, material: 'concrete' },
  })
}

/**
 * Taylor and Pine (way/259925713): a beige brick-textured residential tower of about fourteen storeys over a garage
 * podium with a brick-screen wall, its vertical piers and punched windows stepping in its wings. (Mapillary 200630898702566, 302357684975726.)
 * The stepped wings are drawn as one block; unsure of the setbacks.
 */
function t4b89_259925713(out: MeshBuilder, fit: Fit): void {
  const BEIGE: Rgb = [0.78, 0.74, 0.66]
  tower(out, fit, {
    height: 41,
    base: { height: 4, face: { kind: 'blank', wall: [0.8, 0.77, 0.7], material: 'concrete' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: BEIGE, glass: [0.3, 0.34, 0.38], pitch: 3.2, floor: 3, solid: 0.45, material: 'concrete' } }],
    crown: { kind: 'parapet', height: 1, colour: BEIGE, material: 'concrete' },
  })
}

/**
 * Consulate General of Mexico (way/114709401): a grey and white clad block of about seven storeys, its ground floor
 * a dark brick base, under the freeway in the Transbay district. (Mapillary 1232760783834440, 103954909175739.)
 */
function t4b90_114709401(out: MeshBuilder, fit: Fit): void {
  const CLAD: Rgb = [0.82, 0.82, 0.8]
  tower(out, fit, {
    height: 21,
    base: { height: 3.5, face: { kind: 'blank', wall: [0.5, 0.2, 0.16], material: 'brick' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: CLAD, glass: [0.3, 0.36, 0.42], pitch: 3.6, floor: 3, solid: 0.6, material: 'clapboard' } }],
    crown: { kind: 'parapet', height: 0.8, colour: CLAD, material: 'clapboard' },
  })
}

/**
 * Geary Street hotel block (way/35024386, the Union Square Hotel side): a cream stucco post-fire walk-up of about
 * eight storeys, round bay windows with white balconies and fire escapes, a dark shopfront base. (Mapillary 814837084311042, 3320715811549544.)
 */
function t4b91_35024386(out: MeshBuilder, fit: Fit): void {
  const CREAM: Rgb = [0.9, 0.87, 0.8]
  tower(out, fit, {
    height: 26,
    base: { height: 4.5, face: { kind: 'blank', wall: [0.22, 0.2, 0.2], material: 'granite' } },
    tiers: [{ to: 1, face: { kind: 'bays', wall: CREAM, glass: [0.3, 0.34, 0.38], floor: 3, pitch: 3.6, material: 'stucco', bay: { depth: 0.9, round: true } } }],
    crown: { kind: 'parapet', height: 1, colour: CREAM, material: 'stucco' },
  })
}

/**
 * Sharon Building (way/79377213), 55 New Montgomery Street: a white painted block of about eight storeys, a glazed
 * shopfront under an awning, grid windows in pilasters and a cornice at the top. (Mapillary, photos 01 and 02.)
 */
function t4b92_79377213(out: MeshBuilder, fit: Fit): void {
  const WHITE: Rgb = [0.9, 0.89, 0.86]
  tower(out, fit, {
    height: 33,
    base: { height: 4, face: { kind: 'curtain', wall: [0.3, 0.3, 0.3], glass: [0.3, 0.34, 0.38], pitch: 3.5, floor: 4, material: 'metal' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: WHITE, glass: [0.22, 0.26, 0.3], pitch: 3.2, floor: 3.4, solid: 0.55, material: 'concrete' } }],
    cornices: [{ at: 0.86, depth: 0.6, height: 1, colour: WHITE }],
    crown: { kind: 'parapet', height: 1.2, colour: WHITE, material: 'concrete' },
  })
}

/**
 * Unnamed corner block (way/159280391), at Mission and First: a beige stone block of about five storeys with arched
 * upper windows over a dark shopfront base; the Salesforce Tower rises behind it. (Mapillary, photos 01 and 02.)
 * The OSM height of 32 m is disputed by the photographs, which show a lower block; the model follows them.
 */
function t4b93_159280391(out: MeshBuilder, fit: Fit): void {
  const BEIGE: Rgb = [0.8, 0.73, 0.6]
  tower(out, fit, {
    height: 22,
    base: { height: 4.2, face: { kind: 'blank', wall: [0.22, 0.2, 0.18], material: 'granite' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: BEIGE, glass: [0.22, 0.26, 0.3], pitch: 3.4, floor: 3.6, solid: 0.45, arched: true, material: 'ashlar' } }],
    crown: { kind: 'parapet', height: 1.2, colour: BEIGE, material: 'ashlar' },
  })
}

/**
 * Townsend Building (way/129176911), Townsend Street: red brick of about six storeys, arched windows, the name on a
 * dark board along the gabled parapet, a grey loft to its east. (Mapillary, photos 01 and 02.)
 */
function t4b94_129176911(out: MeshBuilder, fit: Fit): void {
  const RED: Rgb = [0.62, 0.22, 0.14]
  tower(out, fit, {
    height: 23,
    base: { height: 3.5, face: { kind: 'blank', wall: [0.25, 0.25, 0.27], material: 'concrete' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: RED, glass: [0.2, 0.22, 0.26], pitch: 3.4, floor: 3.8, solid: 0.4, arched: true, material: 'brick' } }],
    crown: { kind: 'parapet', height: 1.5, colour: RED, material: 'brick' },
  })
}

/**
 * 128 King Street (way/148547440), the Cooperstown hall of fame block: a red brick block of four storeys with a
 * painted sign band under the cornice, tall dark-framed windows and a dark green garage bay at the side.
 * (Mapillary, photos 02 and 03.)
 */
function t4b94_148547440(out: MeshBuilder, fit: Fit): void {
  const RED: Rgb = [0.6, 0.24, 0.16]
  tower(out, fit, {
    height: 19,
    base: { height: 3.6, face: { kind: 'blank', wall: [0.22, 0.3, 0.27], material: 'brick' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: RED, glass: [0.22, 0.25, 0.28], pitch: 3.2, floor: 3.9, solid: 0.45, material: 'brick' } }],
    crown: { kind: 'parapet', height: 0.9, colour: RED, material: 'brick' },
  })
}

/**
 * 1000 Sutter Street (way/149930902), at Hyde: a grey-cream stucco block of about ten storeys, its bay windows and a
 * ground floor painted grey-green. (Mapillary, photo 02; photo 03 is a neighbour.)
 */
function t4b96_149930902(out: MeshBuilder, fit: Fit): void {
  const CREAM: Rgb = [0.72, 0.7, 0.64]
  tower(out, fit, {
    height: 32,
    base: { height: 4, face: { kind: 'blank', wall: [0.4, 0.46, 0.44], material: 'stucco' } },
    tiers: [{ to: 1, face: { kind: 'bays', wall: CREAM, glass: [0.3, 0.34, 0.38], floor: 3.2, pitch: 3.4, material: 'stucco', bay: { depth: 0.5, round: false } } }],
    crown: { kind: 'parapet', height: 1, colour: CREAM, material: 'stucco' },
  })
}

/**
 * SFMOMA Garage (way/80296754), 147 Minna Street: a dark grey concrete parking garage of about eight decks, its
 * openings in a grid of punched piers, a sheer blank side above. (Mapillary, photo 01.)
 */
function t4b97_80296754(out: MeshBuilder, fit: Fit): void {
  const GREY: Rgb = [0.36, 0.36, 0.37]
  tower(out, fit, {
    height: 26,
    tiers: [{ to: 1, face: { kind: 'punched', wall: GREY, glass: [0.12, 0.13, 0.14], pitch: 4, floor: 3.2, solid: 0.5, material: 'concrete' } }],
    crown: { kind: 'parapet', height: 0.6, colour: GREY, material: 'concrete' },
  })
}

/**
 * 600 Folsom Street (way/112774496), at Second: a taupe four-storey Italianate corner block with a cornice, tall
 * rectangular windows and a white-columned ground floor. The OSM height of 32 m is disputed by the photographs.
 * (Mapillary, photos 01 and 02.)
 */
function t4b98_112774496(out: MeshBuilder, fit: Fit): void {
  const TAUPE: Rgb = [0.5, 0.45, 0.41]
  tower(out, fit, {
    height: 16,
    base: { height: 4, face: { kind: 'blank', wall: [0.9, 0.88, 0.84], material: 'stucco' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: TAUPE, glass: [0.22, 0.24, 0.27], pitch: 3.2, floor: 3.6, solid: 0.55, material: 'stucco' } }],
    cornices: [{ at: 0.9, depth: 0.5, height: 0.7, colour: TAUPE }],
    crown: { kind: 'parapet', height: 0.8, colour: TAUPE, material: 'stucco' },
  })
}

/**
 * 850 Powell Street (way/260517113): a cream stucco block of about twelve storeys, its punched windows and bays in
 * regular rows, a moulded cornice over the top, and a stone-faced ground floor. (Mapillary 1499912270358485, 1164159114081223.)
 */
function t4b100_260517113(out: MeshBuilder, fit: Fit): void {
  const CREAM: Rgb = [0.88, 0.84, 0.74]
  tower(out, fit, {
    height: 37,
    base: { height: 4, face: { kind: 'punched', wall: [0.8, 0.76, 0.66], material: 'stucco', glass: [0.2, 0.22, 0.25], pitch: 4, solid: 0.5, floor: 4 } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: CREAM, material: 'concrete', glass: [0.25, 0.3, 0.35], pitch: 3.4, solid: 0.5, floor: 3.1 } }],
    crown: { kind: 'parapet', height: 1.6, colour: CREAM, material: 'stucco' },
  })
}

/**
 * 720-726 California Street (way/260519112), at Grant: a red-brown brick block of about nine storeys on a cream
 * ground floor, its punched windows in regular rows and fire escapes on the front. (Mapillary 366418025047647, 382623453991404.)
 */
function t4b101_260519112(out: MeshBuilder, fit: Fit): void {
  const BRICK: Rgb = [0.6, 0.33, 0.26]
  tower(out, fit, {
    height: 30,
    base: { height: 4, face: { kind: 'punched', wall: [0.85, 0.8, 0.68], material: 'stucco', glass: [0.2, 0.24, 0.27], pitch: 3.6, solid: 0.5, floor: 4 } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: BRICK, material: 'brick', glass: [0.22, 0.25, 0.28], pitch: 2.8, solid: 0.55, floor: 3.0 } }],
    crown: { kind: 'parapet', height: 1.2, colour: [0.85, 0.8, 0.7], material: 'stucco' },
  })
}

/**
 * 274 Brannan Street (way/112775864): a grey-painted loft block of about seven storeys, large steel-sash windows in
 * a grid, a dark grey garage base with a shopfront. (Mapillary 1734136077263546, 748790084671734.)
 */
function t4b102_112775864(out: MeshBuilder, fit: Fit): void {
  const GREY: Rgb = [0.72, 0.75, 0.77]
  tower(out, fit, {
    height: 24,
    base: { height: 4, face: { kind: 'punched', wall: [0.36, 0.38, 0.41], material: 'concrete', glass: [0.14, 0.15, 0.17], pitch: 4, solid: 0.6, floor: 4 } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: GREY, material: 'concrete', glass: [0.3, 0.35, 0.4], pitch: 3.4, solid: 0.3, floor: 3.3 } }],
    crown: { kind: 'parapet', height: 1.0, colour: GREY, material: 'concrete' },
  })
}

/**
 * 270 Brannan Street (way/113103851): a newer block of orange terracotta panels in bands between ribbon glass,
 * a glazed ground floor behind a timber louvre canopy. OSM says 12 m; the photographs show more storeys, so drawn at 18 m.
 * (Mapillary 1291789729158862, 1149926067156844.)
 */
function t4b102_113103851(out: MeshBuilder, fit: Fit): void {
  const TERRA: Rgb = [0.74, 0.44, 0.28]
  tower(out, fit, {
    height: 18,
    base: { height: 4.5, face: { kind: 'curtain', wall: [0.5, 0.5, 0.52], glass: [0.2, 0.26, 0.3], pitch: 3, floor: 4.5, material: 'metal' } },
    tiers: [{ to: 1, face: { kind: 'bands', wall: TERRA, material: 'terracotta', glass: [0.22, 0.3, 0.34], floor: 3.4, solid: 0.6 } }],
    crown: { kind: 'parapet', height: 0.8, colour: [0.6, 0.5, 0.42], material: 'terracotta' },
  })
}

/**
 * 50 Lansing Street (way/260323193): a dark grey block of about eight storeys with a white moulded cornice at the
 * top. The one photograph is a close-up of the corner and cornice, so the rest is a guess: unsure.
 * (Mapillary 2063491347787026.)
 */
function t4b103_260323193(out: MeshBuilder, fit: Fit): void {
  const DARK: Rgb = [0.3, 0.31, 0.33]
  tower(out, fit, {
    height: 26,
    base: { height: 4, face: { kind: 'punched', wall: [0.22, 0.23, 0.24], material: 'granite', glass: [0.15, 0.17, 0.2], pitch: 4, solid: 0.5, floor: 4 } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: DARK, material: 'concrete', glass: [0.18, 0.2, 0.24], pitch: 3, solid: 0.55, floor: 3.2 } }],
    crown: { kind: 'parapet', height: 1.4, colour: [0.85, 0.85, 0.82], material: 'stucco' },
  })
}

/**
 * Chinese Hospital (way/403167643), 845 Jackson Street: a cream panelled hospital block of about eight storeys, its
 * ground floor a dark driveway under the name in capitals, with a glass-faced side. (Mapillary 1154158446563069, 1799347174353938.)
 */
function t4b104_403167643(out: MeshBuilder, fit: Fit): void {
  const CREAM: Rgb = [0.85, 0.81, 0.72]
  tower(out, fit, {
    height: 30,
    base: { height: 5, face: { kind: 'punched', wall: [0.86, 0.82, 0.73], material: 'concrete', glass: [0.2, 0.22, 0.25], pitch: 4, solid: 0.5, floor: 5 } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: CREAM, material: 'concrete', glass: [0.2, 0.24, 0.28], pitch: 3.4, solid: 0.6, floor: 3.5 } }],
    crown: { kind: 'parapet', height: 1.2, colour: CREAM, material: 'stucco' },
  })
}

/**
 * 150 Hayes Street (way/35176282): a 1968 office block of about seven storeys, its front on Hayes a grid of teal-glazed
 * spandrels in ribbon windows over a grey grilled garage ground floor; the flank a plain green-grey panelled wall.
 * (Mapillary 697124251779660, 1732283854263442.)
 */
function t4b105_35176282(out: MeshBuilder, fit: Fit): void {
  tower(out, fit, {
    height: 24,
    base: { height: 4, face: { kind: 'punched', wall: [0.55, 0.6, 0.58], material: 'concrete', glass: [0.2, 0.22, 0.22], pitch: 4, solid: 0.6, floor: 4 } },
    tiers: [{ to: 1, face: { kind: 'bands', wall: [0.58, 0.7, 0.67], material: 'metal', glass: [0.2, 0.5, 0.48], floor: 3.4, solid: 0.45 } }],
    crown: { kind: 'parapet', height: 0.8, colour: [0.6, 0.7, 0.68], material: 'concrete' },
  })
}

/**
 * The unnamed block at Geary, Grant and Maiden Lane (way/147689076): a cream stone-fronted commercial building of
 * about nine storeys, a dark-framed shopfront under a moulded cornice, tall windows in bays above and a stone parapet.
 * (Mapillary 511173684982876, 207815314643201.)
 */
function t4b106_147689076(out: MeshBuilder, fit: Fit): void {
  const CREAM: Rgb = [0.92, 0.9, 0.85]
  tower(out, fit, {
    height: 30,
    base: { height: 5, face: { kind: 'punched', wall: CREAM, material: 'concrete', glass: [0.2, 0.22, 0.26], pitch: 4, solid: 0.45, floor: 5 } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: CREAM, material: 'concrete', glass: [0.3, 0.35, 0.4], pitch: 4, solid: 0.42, floor: 3.4 } }],
    cornices: [{ at: 5, depth: 0.5, height: 0.6, colour: [0.9, 0.88, 0.82] }],
    crown: { kind: 'parapet', height: 1.5, colour: CREAM, material: 'concrete' },
  })
}

/**
 * O'Farrell Towers (way/260126021), at O'Farrell and Jones: a brown brick-faced lower block under a pale grey
 * modern tower of about twelve storeys, its small square windows in regular rows. (Mapillary 903378613613414, 329199422280129.)
 */
function t4b107_260126021(out: MeshBuilder, fit: Fit): void {
  tower(out, fit, {
    height: 36,
    base: { height: 4, face: { kind: 'punched', wall: [0.42, 0.3, 0.26], material: 'brick', glass: [0.2, 0.22, 0.25], pitch: 4, solid: 0.6, floor: 4 } },
    tiers: [
      { to: 0.7, face: { kind: 'punched', wall: [0.42, 0.3, 0.26], material: 'brick', glass: [0.2, 0.22, 0.25], pitch: 3.2, solid: 0.55, floor: 3.2 } },
      { to: 1, inset: 2, face: { kind: 'punched', wall: [0.8, 0.82, 0.84], material: 'concrete', glass: [0.22, 0.27, 0.32], pitch: 3, solid: 0.5, floor: 3 } },
    ],
    crown: { kind: 'parapet', height: 1, colour: [0.75, 0.77, 0.78], material: 'concrete' },
  })
}

/**
 * Mabrie Facial Institute (way/35536855): a cream-buff terracotta block of about twelve storeys, its punched windows in
 * regular rows over a stone-faced ground floor, a moulded cornice at the top. OSM says 56 m; drawn at 40 m from the
 * photographs, which are unsure. (Mapillary 336952201445013, 455554926531896.)
 */
function t4b108_35536855(out: MeshBuilder, fit: Fit): void {
  const BUFF: Rgb = [0.84, 0.76, 0.6]
  tower(out, fit, {
    height: 40,
    base: { height: 5, face: { kind: 'punched', wall: [0.8, 0.74, 0.62], material: 'ashlar', glass: [0.2, 0.22, 0.24], pitch: 3.5, solid: 0.45, floor: 5 } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: BUFF, material: 'terracotta', glass: [0.22, 0.25, 0.28], pitch: 2.8, solid: 0.5, floor: 3.4 } }],
    cornices: [{ at: 5, depth: 0.5, height: 0.6, colour: [0.82, 0.74, 0.6] }],
    crown: { kind: 'parapet', height: 1.4, colour: [0.75, 0.66, 0.5], material: 'terracotta' },
  })
}

/**
 * 301 (way/113103848), at Delancey: a taupe-grey concrete block of about eleven storeys, its balcony slabs stacked on
 * the front, ribbon glass on the corners, a glazed garage ground floor. (Mapillary 1073578978178962, 4342134639341630.)
 */
function t4b109_113103848(out: MeshBuilder, fit: Fit): void {
  const TAUPE: Rgb = [0.6, 0.58, 0.54]
  tower(out, fit, {
    height: 32,
    base: { height: 4, face: { kind: 'punched', wall: [0.5, 0.48, 0.45], material: 'concrete', glass: [0.2, 0.24, 0.27], pitch: 4, solid: 0.4, floor: 4 } },
    tiers: [
      { to: 0.7, face: { kind: 'punched', wall: TAUPE, material: 'concrete', glass: [0.25, 0.3, 0.35], pitch: 3.2, solid: 0.45, floor: 3.2 } },
      { to: 1, inset: 2.5, face: { kind: 'punched', wall: TAUPE, material: 'concrete', glass: [0.25, 0.3, 0.35], pitch: 3.2, solid: 0.45, floor: 3.2 } },
    ],
    crown: { kind: 'parapet', height: 1, colour: TAUPE, material: 'concrete' },
  })
}

/**
 * Moscone Center Garage (way/24335195), at 3rd Street: a white concrete parking garage of about four storeys, its
 * open parking slots in bands, a glass canopy and a glazed arcade on the ground floor. (Mapillary 318240576658476, 757811780329383.)
 */
function t4b111_24335195(out: MeshBuilder, fit: Fit): void {
  const WHITE: Rgb = [0.94, 0.94, 0.92]
  tower(out, fit, {
    height: 17,
    base: { height: 4, face: { kind: 'punched', wall: WHITE, material: 'concrete', glass: [0.12, 0.13, 0.15], pitch: 6, solid: 0.5, floor: 4 } },
    tiers: [{ to: 1, face: { kind: 'bands', wall: WHITE, material: 'concrete', glass: [0.12, 0.13, 0.15], floor: 3.4, solid: 0.4 } }],
    crown: { kind: 'parapet', height: 0.8, colour: WHITE, material: 'concrete' },
  })
}

/**
 * 1199 Bush Street (way/179746912): a red-brick block of about six storeys, its upper floors set with tall dark glass
 * bays, a brick parapet over. (Mapillary 178869224734193, 738017782149344.) Front on Bush Street.
 */
function t4b112_179746912(out: MeshBuilder, fit: Fit): void {
  const BRICK: Rgb = [0.66, 0.34, 0.26]
  tower(out, fit, {
    height: 26,
    base: { height: 4, face: { kind: 'punched', wall: [0.42, 0.42, 0.42], material: 'granite', glass: [0.2, 0.22, 0.25], pitch: 4, solid: 0.5, floor: 4 } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: BRICK, material: 'brick', glass: [0.16, 0.22, 0.3], pitch: 3.2, solid: 0.4, floor: 3.6 } }],
    crown: { kind: 'parapet', height: 1.2, colour: BRICK, material: 'brick' },
  })
}

/**
 * ABC Broadcast Center, 900 Front Street (way/288481830): a low tan concrete block of three storeys, its horizontal
 * ribbon windows in dark glass bands, the top floor set back. (Mapillary 2 frames.) Front taken as Green Street, where
 * the photographs show the entrance face (the address is Front Street); unsure.
 */
function t4b113_288481830(out: MeshBuilder, fit: Fit): void {
  const TAN: Rgb = [0.8, 0.74, 0.62]
  tower(out, fit, {
    height: 12,
    tiers: [
      { to: 0.75, face: { kind: 'bands', wall: TAN, material: 'concrete', glass: [0.2, 0.25, 0.3], floor: 3.6, solid: 0.45 } },
      { to: 1, inset: 2.5, face: { kind: 'bands', wall: TAN, material: 'concrete', glass: [0.2, 0.25, 0.3], floor: 3.6, solid: 0.45 } },
    ],
    crown: { kind: 'parapet', height: 0.6, colour: TAN, material: 'concrete' },
  })
}

/**
 * 41;77 Van Ness Avenue (way/172111600): a cream stone block of about eight storeys, regular punched windows with
 * a heavy cornice under a parapet, a darker base. (Mapillary 2 frames.) Front on Van Ness Avenue.
 */
function t4b114_172111600(out: MeshBuilder, fit: Fit): void {
  const CREAM: Rgb = [0.84, 0.78, 0.64]
  tower(out, fit, {
    height: 27,
    base: { height: 4, face: { kind: 'punched', wall: [0.7, 0.66, 0.58], material: 'ashlar', glass: [0.2, 0.22, 0.24], pitch: 4, solid: 0.5, floor: 4 } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: CREAM, material: 'ashlar', glass: [0.26, 0.3, 0.34], pitch: 3, solid: 0.55, floor: 3.4 }, cornice: { depth: 0.6, height: 0.8, colour: [0.9, 0.86, 0.76] } }],
    crown: { kind: 'parapet', height: 1.5, colour: CREAM, material: 'ashlar' },
  })
}

/**
 * Warrington Apartments (way/197354892): a buff block of about seven or eight storeys, projecting bay windows stacked
 * all the way up, a fire escape on the front. (Mapillary 2 frames.) Front taken as Post Street; unsure.
 */
function t4b115_197354892(out: MeshBuilder, fit: Fit): void {
  const BUFF: Rgb = [0.84, 0.74, 0.58]
  tower(out, fit, {
    height: 25,
    base: { height: 4, face: { kind: 'punched', wall: [0.4, 0.4, 0.4], material: 'granite', glass: [0.2, 0.22, 0.25], pitch: 4, solid: 0.5, floor: 4 } },
    tiers: [{ to: 1, face: { kind: 'bays', wall: BUFF, material: 'concrete', glass: [0.26, 0.3, 0.34], floor: 3.1, pitch: 3.5, bay: { depth: 0.9 } } }],
    crown: { kind: 'parapet', height: 1, colour: BUFF, material: 'concrete' },
  })
}

/**
 * 180 Jones Street (way/1258513962): a white block of about seven storeys over a dark base, grid windows and balconies
 * in rows. (Mapillary 2 frames.) OSM 36 m disputed by the photographs, drawn 25 m; front on Jones Street; unsure.
 */
function t4b116_1258513962(out: MeshBuilder, fit: Fit): void {
  const WHITE: Rgb = [0.92, 0.91, 0.88]
  tower(out, fit, {
    height: 25,
    base: { height: 4, face: { kind: 'blank', wall: [0.3, 0.3, 0.32], material: 'concrete' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: WHITE, material: 'concrete', glass: [0.2, 0.24, 0.28], pitch: 2.8, solid: 0.5, floor: 3.1 } }],
    crown: { kind: 'parapet', height: 0.8, colour: WHITE, material: 'concrete' },
  })
}

/**
 * Westlake Building (way/206621049): a red-brick block of about five storeys with tall arched upper windows and a
 * parapet over. (Mapillary 2 frames.) Front taken as Pacific Avenue; the photographs are mixed; unsure.
 */
function t4b117_206621049(out: MeshBuilder, fit: Fit): void {
  const BRICK: Rgb = [0.6, 0.28, 0.22]
  tower(out, fit, {
    height: 19,
    base: { height: 4, face: { kind: 'punched', wall: [0.42, 0.42, 0.42], material: 'granite', glass: [0.2, 0.22, 0.25], pitch: 4, solid: 0.5, floor: 4 } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: BRICK, material: 'brick', glass: [0.2, 0.22, 0.26], pitch: 3, solid: 0.55, floor: 3.6, arched: true } }],
    crown: { kind: 'parapet', height: 1.2, colour: BRICK, material: 'brick' },
  })
}

/**
 * Arc Light Co. (way/129176905): a red-brick warehouse of about four storeys, a stepped parapet, a tall arched
 * carriage entrance and a glazed box on the roof. (Mapillary 2 frames.) Front taken as Clarence Place; unsure.
 */
function t4b118_129176905(out: MeshBuilder, fit: Fit): void {
  const RED: Rgb = [0.62, 0.26, 0.2]
  tower(out, fit, {
    height: 17,
    tiers: [{ to: 1, face: { kind: 'punched', wall: RED, material: 'brick', glass: [0.12, 0.14, 0.16], pitch: 3.2, solid: 0.6, floor: 4, arched: true } }],
    crown: { kind: 'parapet', height: 1.6, colour: RED, material: 'brick' },
    penthouse: 1,
  })
}

/**
 * 539 Bryant Street (way/131297949): a tan-buff brick warehouse of five storeys, tall multi-pane windows, arched heads
 * on the upper floors, a corbelled parapet. (Mapillary 859235062280233 and 1261142479144384.) Front taken as Bryant.
 */
function t4b119_131297949(out: MeshBuilder, fit: Fit): void {
  const TAN: Rgb = [0.74, 0.62, 0.46]
  tower(out, fit, {
    height: 19,
    tiers: [{ to: 1, face: { kind: 'punched', wall: TAN, material: 'brick', glass: [0.2, 0.22, 0.24], pitch: 3.4, solid: 0.45, floor: 3.8, arched: true } }],
    crown: { kind: 'parapet', height: 1.2, colour: TAN, material: 'brick' },
  })
}

/**
 * 50 Hawthorne Street (way/80296706): a low office block of five storeys in silver-framed dark glass, the mullions
 * standing proud, a plain metal coping. (Mapillary, two frames.) Front taken as Hawthorne; the photographs are mixed.
 */
function t4b120_80296706(out: MeshBuilder, fit: Fit): void {
  const SILVER: Rgb = [0.62, 0.64, 0.66]
  tower(out, fit, {
    height: 18,
    tiers: [{ to: 1, face: { kind: 'curtain', wall: SILVER, material: 'metal', glass: [0.18, 0.28, 0.3], floor: 3.6, pitch: 1.8 } }],
    crown: { kind: 'parapet', height: 0.8, colour: [0.5, 0.52, 0.54], material: 'metal' },
  })
}

/**
 * 601–615 Second Street (way/112927451): a grey-beige painted brick block of about six storeys; a dark glazed
 * shopfront base, then large steel-sashed windows, a parapet on top. (Mapillary 780662207738651, 1098776455676234.)
 * Front taken as Second Street; unsure.
 */
function t4b121_112927451(out: MeshBuilder, fit: Fit): void {
  const BEIGE: Rgb = [0.7, 0.67, 0.6]
  tower(out, fit, {
    height: 23,
    tiers: [
      { to: 4.6, face: { kind: 'curtain', wall: [0.14, 0.14, 0.15], material: 'glass', glass: [0.14, 0.18, 0.2], floor: 4.6, pitch: 2.6 } },
      { to: 1, face: { kind: 'punched', wall: BEIGE, material: 'concrete', glass: [0.16, 0.18, 0.2], pitch: 3.2, solid: 0.4, floor: 3.6 } },
    ],
    crown: { kind: 'parapet', height: 1.0, colour: BEIGE, material: 'concrete' },
  })
}

/**
 * Gallo Building, 250 Brannan Street (way/113103850): an orange-buff brick block of three storeys with a corbelled
 * arcade cornice, double-hung sash windows and a deep storefront base. (Mapillary, two frames.) Front taken as Brannan.
 */
function t4b122_113103850(out: MeshBuilder, fit: Fit): void {
  const ORANGE: Rgb = [0.8, 0.55, 0.3]
  tower(out, fit, {
    height: 13,
    tiers: [{ to: 1, face: { kind: 'punched', wall: ORANGE, material: 'brick', glass: [0.26, 0.3, 0.34], pitch: 3.6, solid: 0.5, floor: 4.2 } }],
    crown: { kind: 'parapet', height: 1.2, colour: ORANGE, material: 'brick' },
  })
}

/**
 * Unnamed block, way/114709398, between Tehama and First Streets: a dark grey stone-faced art deco block of about six
 * storeys, arched heads on the top floor, pilasters and a lettered band over a glazed ground floor. (Mapillary, two
 * frames.) Front taken as Tehama Street, the nearest; unsure.
 */
function t4b123_114709398(out: MeshBuilder, fit: Fit): void {
  const GREY: Rgb = [0.27, 0.27, 0.28]
  tower(out, fit, {
    height: 24,
    tiers: [{ to: 1, face: { kind: 'punched', wall: GREY, material: 'concrete', glass: [0.16, 0.2, 0.24], pitch: 3.6, solid: 0.5, floor: 3.8, arched: true } }],
    crown: { kind: 'parapet', height: 1.2, colour: GREY, material: 'concrete' },
  })
}

/**
 * WestEd, 730 Harrison Street (way/151979683): an eight-storey block, a patinated green-grey metal skin on its lower
 * three storeys with a stepped Art Deco entry, glass spandrel bands above. (Mapillary, two frames.) Front taken as Harrison.
 */
function t4b124_151979683(out: MeshBuilder, fit: Fit): void {
  const GREEN: Rgb = [0.34, 0.46, 0.44]
  tower(out, fit, {
    height: 25,
    tiers: [
      { to: 3.2, face: { kind: 'blank', wall: GREEN, material: 'metal' }, cornice: { depth: 0.3, height: 0.3, colour: GREEN } },
      { to: 1, face: { kind: 'bands', wall: [0.42, 0.5, 0.48], material: 'glass', glass: [0.25, 0.45, 0.45], floor: 3.4, solid: 0.3 } },
    ],
    crown: { kind: 'parapet', height: 0.9, colour: GREEN, material: 'metal' },
  })
}

/**
 * Gaylord Suites, 620 Jones Street (way/35024322): a white stucco-faced hotel of about eleven storeys, its walls
 * stacked with projecting bay windows all the way up, a deep dentilled cornice and a parapet. (Mapillary, two frames.)
 * Front taken as Jones Street.
 */
function t4b125_35024322(out: MeshBuilder, fit: Fit): void {
  const WHITE: Rgb = [0.92, 0.9, 0.86]
  tower(out, fit, {
    height: 38,
    tiers: [{ to: 1, face: { kind: 'bays', wall: WHITE, material: 'concrete', glass: [0.3, 0.36, 0.4], floor: 3.4, pitch: 3.2, bay: { depth: 0.8 } }, cornice: { depth: 0.6, height: 0.8, colour: WHITE } }],
    crown: { kind: 'parapet', height: 1.4, colour: WHITE, material: 'concrete' },
  })
}

/**
 * 701;711 Van Ness Avenue (way/258127164): a cream-stone office block of four storeys over a shopfront base, a curved
 * corner and a stone band at each floor, with a 1920s-style flat top. (Mapillary, two frames.)
 * Front taken as Van Ness Avenue.
 */
function t4b128_258127164(out: MeshBuilder, fit: Fit): void {
  const CREAM: Rgb = [0.84, 0.8, 0.7]
  const GLASS: Rgb = [0.2, 0.23, 0.26]
  tower(out, fit, {
    height: 21,
    base: { height: 4.6, face: { kind: 'punched', wall: CREAM, glass: GLASS, pitch: 4, solid: 0.25, floor: 4.6, material: 'concrete' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: CREAM, glass: GLASS, pitch: 3.4, floor: 4, solid: 0.35, depth: 0.5, material: 'concrete' }, cornice: { depth: 0.6, height: 0.7, colour: CREAM } }],
    crown: { kind: 'parapet', height: 0.9, colour: CREAM, material: 'concrete' },
  })
}

/**
 * St Anthony's Vera Haile Senior Housing, 121 Golden Gate Avenue (way/35536670): a tan-buff nine-storey corner block,
 * projecting dark bay windows stacked up in strips, a storefront base and a set-back top. (Mapillary, two frames.)
 * Front taken as Golden Gate Avenue.
 */
function t4b126_35536670(out: MeshBuilder, fit: Fit): void {
  const TAN: Rgb = [0.84, 0.78, 0.66]
  const GLASS: Rgb = [0.22, 0.25, 0.29]
  tower(out, fit, {
    height: 32,
    base: { height: 4.2, face: { kind: 'punched', wall: TAN, glass: GLASS, pitch: 3.2, solid: 0.3, floor: 4.2, material: 'concrete' } },
    tiers: [
      { to: 0.8, face: { kind: 'bays', wall: TAN, material: 'concrete', glass: GLASS, floor: 3.2, pitch: 3.2, bay: { depth: 0.8 } }, cornice: { depth: 0.5, height: 0.6, colour: TAN } },
      { to: 1, inset: 1.2, face: { kind: 'bays', wall: TAN, material: 'concrete', glass: GLASS, floor: 3.2, pitch: 3.2, bay: { depth: 0.8 } } },
    ],
    crown: { kind: 'parapet', height: 1, colour: TAN, material: 'concrete' },
  })
}

/**
 * 666;670 Ellis Street (way/259974367): a 1970s grey concrete tower of about eleven storeys, stepped back in
 * successive volumes with heavy cornice bands and small punched windows. (Mapillary, two frames.)
 * Front taken as Ellis Street.
 */
function t4b127_259974367(out: MeshBuilder, fit: Fit): void {
  const GREY: Rgb = [0.5, 0.51, 0.52]
  const GLASS: Rgb = [0.2, 0.22, 0.25]
  const wall = { kind: 'punched' as const, wall: GREY, glass: GLASS, pitch: 3.6, floor: 3.2, solid: 0.6, depth: 0.4, material: 'concrete' as const }
  tower(out, fit, {
    height: 38,
    tiers: [
      { to: 0.45, face: wall, cornice: { depth: 0.6, height: 0.7, colour: GREY } },
      { to: 0.75, inset: 2.5, face: wall, cornice: { depth: 0.5, height: 0.6, colour: GREY } },
      { to: 1, inset: 2.5, face: wall },
    ],
    crown: { kind: 'parapet', height: 1.2, colour: GREY, material: 'concrete' },
  })
}

/**
 * 149 New Montgomery Street (way/79377160): a cream painted block of five storeys and a top floor, arched upper
 * windows, a dentilled cornice over the fourth and a shopfront base. (Mapillary, two frames.)
 * Front taken as New Montgomery Street.
 */
function t4b129_79377160(out: MeshBuilder, fit: Fit): void {
  const CREAM: Rgb = [0.86, 0.8, 0.66]
  const GLASS: Rgb = [0.25, 0.28, 0.32]
  tower(out, fit, {
    height: 27,
    base: { height: 4.2, face: { kind: 'punched', wall: CREAM, glass: [0.2, 0.22, 0.24], pitch: 3, solid: 0.2, floor: 4.2, material: 'concrete' } },
    tiers: [
      { to: 0.8, face: { kind: 'punched', wall: CREAM, glass: GLASS, pitch: 2.8, floor: 4, solid: 0.5, depth: 0.4, arched: true, material: 'concrete' }, cornice: { depth: 0.7, height: 0.8, colour: CREAM } },
      { to: 1, inset: 0.6, face: { kind: 'punched', wall: CREAM, glass: GLASS, pitch: 2.8, floor: 3.4, solid: 0.5, depth: 0.4, material: 'concrete' } },
    ],
    crown: { kind: 'parapet', height: 1.2, colour: CREAM, material: 'concrete' },
  })
}

/**
 * 663;665;679 Sutter Street (way/48995284): a dark charcoal front of about eight storeys, its punched windows and
 * fire escapes running over a black shopfront base. (Mapillary, two frames; the earlier reface note.)
 * Front taken as Sutter Street.
 */
function t4b130_48995284(out: MeshBuilder, fit: Fit): void {
  const CHAR: Rgb = [0.3, 0.29, 0.3]
  tower(out, fit, {
    height: 30,
    base: { height: 4.5, face: { kind: 'punched', wall: [0.18, 0.18, 0.19], glass: [0.16, 0.17, 0.19], pitch: 3, solid: 0.3, floor: 4.5, material: 'granite' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: CHAR, glass: [0.2, 0.22, 0.26], pitch: 2.6, floor: 3.4, solid: 0.5, depth: 0.4, material: 'brick' }, cornice: { depth: 0.6, height: 0.7, colour: CHAR } }],
    crown: { kind: 'parapet', height: 1.2, colour: CHAR, material: 'brick' },
  })
}

/**
 * Hotel Emblem, 80 Sutter Street (way/256733832): a painted ochre brick hotel of about six storeys, a deep bracketed
 * cornice, tall windows in rows, and a black-glass ground floor under a dark awning. (Mapillary, two frames.)
 * Front taken as Sutter Street, the nearest.
 */
function t4b131_256733832(out: MeshBuilder, fit: Fit): void {
  const OCHRE: Rgb = [0.84, 0.72, 0.5]
  tower(out, fit, {
    height: 22,
    base: { height: 4.5, face: { kind: 'punched', wall: [0.78, 0.74, 0.66], glass: [0.18, 0.2, 0.22], pitch: 3.4, solid: 0.25, floor: 4.5, material: 'concrete' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: OCHRE, glass: [0.22, 0.24, 0.26], pitch: 2.6, floor: 3.4, solid: 0.5, depth: 0.35, material: 'brick' }, cornice: { depth: 0.8, height: 0.9, colour: [0.9, 0.86, 0.76] } }],
    crown: { kind: 'parapet', height: 1, colour: OCHRE, material: 'brick' },
  })
}

/**
 * 750 Battery Street (way/32947691): a red-brown brick block of five storeys, arched upper windows, a stepped top
 * floor and a brick parapet on the corner. (Mapillary, two frames.)
 * Front taken as Battery Street.
 */
function t4b132_32947691(out: MeshBuilder, fit: Fit): void {
  const BRICK: Rgb = [0.55, 0.25, 0.18]
  const GLASS: Rgb = [0.2, 0.23, 0.27]
  tower(out, fit, {
    height: 25,
    base: { height: 4.6, face: { kind: 'punched', wall: BRICK, glass: GLASS, pitch: 4, solid: 0.3, floor: 4.6, arched: true, material: 'brick' } },
    tiers: [
      { to: 0.82, face: { kind: 'punched', wall: BRICK, glass: GLASS, pitch: 3, floor: 3.9, solid: 0.5, depth: 0.3, arched: true, material: 'brick' }, cornice: { depth: 0.5, height: 0.6, colour: [0.82, 0.8, 0.74] } },
      { to: 1, inset: 1.5, face: { kind: 'punched', wall: BRICK, glass: GLASS, pitch: 3, floor: 3.9, solid: 0.5, depth: 0.3, arched: true, material: 'brick' } },
    ],
    crown: { kind: 'parapet', height: 0.9, colour: BRICK, material: 'brick' },
  })
}

/**
 * Unnamed block at 665 Third Street and Clarence Place (way/129176908), 21 m: a six-storey loft block in cream
 * painted concrete, big steel-sash windows in a regular grid, a dark brown ground band with a salmon-framed yellow
 * entrance, and a parapet cornice over a smaller top floor. (Mapillary 1098896628431975, 651426494095209.) Front: 3rd Street.
 */
function t4b133_129176908(out: MeshBuilder, fit: Fit): void {
  const CREAM: Rgb = [0.93, 0.91, 0.85]
  const BROWN: Rgb = [0.36, 0.27, 0.2]
  tower(out, fit, {
    height: 21,
    base: { height: 4.2, face: { kind: 'punched', wall: BROWN, glass: [0.22, 0.25, 0.28], pitch: 4.5, floor: 4.2, solid: 0.3, material: 'concrete' } },
    tiers: [
      { to: 0.82, face: { kind: 'punched', wall: CREAM, glass: [0.2, 0.24, 0.3], pitch: 4, floor: 3.4, solid: 0.33, depth: 0.4, material: 'concrete' }, cornice: { depth: 0.6, height: 0.6, colour: CREAM } },
      { to: 1, inset: 0.8, face: { kind: 'punched', wall: CREAM, glass: [0.2, 0.24, 0.3], pitch: 3.4, floor: 3.2, solid: 0.4, depth: 0.4, material: 'concrete' } },
    ],
    crown: { kind: 'parapet', height: 1, colour: CREAM, material: 'concrete' },
  })
}

/**
 * 1 South Park (way/112759870), 18 m: a three-storey block of pale grey painted concrete, its ground floor a row of
 * tall arched openings in dark glass, the upper floors in tall steel-sash windows between piers, under a deep cornice.
 * The 2-storey wing is not drawn (unsure). (Mapillary 628864219907229, 1904252370355670.) Front: South Park, unsure.
 */
function t4b134_112759870(out: MeshBuilder, fit: Fit): void {
  const PALE: Rgb = [0.94, 0.94, 0.92]
  tower(out, fit, {
    height: 18,
    base: { height: 6, face: { kind: 'punched', wall: PALE, glass: [0.14, 0.18, 0.2], pitch: 4.2, floor: 6, solid: 0.3, depth: 0.5, arched: true, material: 'concrete' } },
    tiers: [
      { to: 0.7, face: { kind: 'punched', wall: PALE, glass: [0.2, 0.26, 0.3], pitch: 3.2, floor: 3.3, solid: 0.4, depth: 0.4, material: 'concrete' }, cornice: { depth: 0.8, height: 0.6, colour: PALE } },
      { to: 1, face: { kind: 'punched', wall: PALE, glass: [0.2, 0.26, 0.3], pitch: 3.2, floor: 2.7, solid: 0.4, depth: 0.4, material: 'concrete' } },
    ],
    crown: { kind: 'parapet', height: 0.8, colour: PALE, material: 'concrete' },
  })
}

/**
 * 300 Brannan Street (way/112758589), 21 m: a loft block of about six storeys at the Brannan and Second corner, painted
 * a light grey between dark charcoal window bays, over a two-storey charcoal base of shopfronts and glazing, with
 * arched heads to the upper windows and a dark parapet. (Mapillary 1132433752114253, 754261343983092.) Front: Brannan Street.
 */
function t4b134_112758589(out: MeshBuilder, fit: Fit): void {
  const CHARCOAL: Rgb = [0.27, 0.29, 0.32]
  const LIGHT: Rgb = [0.74, 0.76, 0.75]
  tower(out, fit, {
    height: 21,
    base: { height: 8, face: { kind: 'punched', wall: CHARCOAL, glass: [0.16, 0.18, 0.21], pitch: 3.6, floor: 4, solid: 0.45, depth: 0.3, material: 'concrete' } },
    tiers: [
      { to: 1, face: { kind: 'punched', wall: LIGHT, glass: [0.2, 0.22, 0.26], pitch: 3.2, floor: 3.2, solid: 0.45, depth: 0.6, arched: true, material: 'concrete' } },
    ],
    crown: { kind: 'parapet', height: 1.2, colour: CHARCOAL, material: 'concrete' },
  })
}

/**
 * Mei Lun Yuen (way/260517123), OSM 30 m: a pale pink stucco block with a street-level shopfront and projecting bay
 * boxes stacked up the front. Only two close photographs; the massing is unsure, and the 14-, 20- and 27-metre parts
 * in OSM lie outside its outline. (Mapillary 1103316351698020, 158985976342219.) Front: Sacramento Street (352), unsure.
 */
function t4b135_260517123(out: MeshBuilder, fit: Fit): void {
  const PINK: Rgb = [0.9, 0.84, 0.82]
  tower(out, fit, {
    height: 30,
    base: { height: 4.5, face: { kind: 'punched', wall: PINK, glass: [0.2, 0.22, 0.25], pitch: 4, floor: 4.5, solid: 0.55, depth: 0.3, material: 'concrete' } },
    tiers: [
      { to: 1, face: { kind: 'bays', wall: PINK, glass: [0.2, 0.23, 0.27], pitch: 3.2, floor: 3.2, bay: { depth: 0.8 }, material: 'concrete' } },
    ],
    crown: { kind: 'parapet', height: 1, colour: PINK, material: 'concrete' },
  })
}

/**
 * Metropolitan Club, 640 Sutter Street (way/135620233), 23 m: a red-brown brick palazzo of five storeys, a stone base
 * course with an arched entrance under a dark awning, arched windows with corbelled balconies, and a colonnade of
 * paired columns on the top storey under a deep bracketed eave and a hipped tile roof. (Mapillary 1020868583454860,
 * 525193442027895.) Front: Sutter Street.
 */
function t4b136_135620233(out: MeshBuilder, fit: Fit): void {
  const BRICK: Rgb = [0.46, 0.23, 0.18]
  const STONE: Rgb = [0.84, 0.8, 0.7]
  const TILE: Rgb = [0.45, 0.25, 0.2]
  tower(out, fit, {
    height: 23,
    base: { height: 4, face: { kind: 'punched', wall: STONE, glass: [0.16, 0.18, 0.2], pitch: 3.4, floor: 4, solid: 0.5, depth: 0.5, arched: true, material: 'ashlar' } },
    tiers: [
      { to: 0.82, face: { kind: 'punched', wall: BRICK, glass: [0.2, 0.22, 0.26], pitch: 3, floor: 3.6, solid: 0.45, depth: 0.5, arched: true, material: 'brick' }, cornice: { depth: 0.6, height: 0.5, colour: STONE } },
      { to: 1, face: { kind: 'punched', wall: BRICK, glass: [0.2, 0.22, 0.26], pitch: 3, floor: 3.4, solid: 0.6, depth: 0.4, material: 'brick' } },
    ],
    crown: { kind: 'hip', height: 3, inset: -0.6, colour: TILE, material: 'tile' },
  })
  const ring = towerRing(fit), e = edgeAt(ring, edgeFacing(ring, 180))
  const n = Math.max(4, Math.round(e.L / 2.6))
  colonnade(out, e.a, e.b, 18.9, 3.6, n, { radius: 0.3, out: 0.5, colour: STONE, material: 'concrete' })
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
  t4b71_56723860,
  t4b72_288647982,
  t4b73_421816058,
  t4b74_256499427,
  t4b75_147508936,
  t4b76_256072725,
  t4b77_135174117,
  t4b78_288487237,
  t4b79_93817372,
  t4b80_256047252,
  t4b81_172250614,
  t4b82_151980105,
  t4b83_135174114,
  t4b84_1059931715,
  t4b85_346093777,
  t4b86_260155577,
  t4b87_112927453,
  t4b88_192883910,
  t4b89_259925713,
  t4b90_114709401,
  t4b91_35024386,
  t4b92_79377213,
  t4b93_159280391,
  t4b94_129176911,
  t4b94_148547440,
  t4b96_149930902,
  t4b97_80296754,
  t4b98_112774496,
  t4b100_260517113,
  t4b101_260519112,
  t4b102_112775864,
  t4b102_113103851,
  t4b103_260323193,
  t4b104_403167643,
  t4b105_35176282,
  t4b106_147689076,
  t4b107_260126021,
  t4b108_35536855,
  t4b109_113103848,
  t4b111_24335195,
  t4b112_179746912,
  t4b113_288481830,
  t4b114_172111600,
  t4b115_197354892,
  t4b116_1258513962,
  t4b117_206621049,
  t4b118_129176905,
  t4b119_131297949,
  t4b120_80296706,
  t4b121_112927451,
  t4b122_113103850,
  t4b123_114709398,
  t4b124_151979683,
  t4b125_35024322,
  t4b126_35536670,
  t4b127_259974367,
  t4b128_258127164,
  t4b129_79377160,
  t4b130_48995284,
  t4b131_256733832,
  t4b132_32947691,
  t4b133_129176908,
  t4b134_112759870,
  t4b134_112758589,
  t4b135_260517123,
  t4b136_135620233,
}
