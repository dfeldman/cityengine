/**
 * MARKET STREET AND THE FIDI CORE — the generic buildings left there, modelled one at a time in priority order
 * (docs/GENERIC-MARKET-FIDI.md; owner, 2026-10-07: "start working on them … NOT batching"). Each builder here replaces
 * a `restyle` (reface) or nothing; its manifest entry is in public/landmarks/san-francisco/market-fidi.json, and its
 * notes say which photographs it was drawn from.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { tower, towerRing, type Face } from '../tower.ts'
import { boxAlong, colonnade, edgeAt, signText } from '../parts.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import type { Rgb } from '../../models.ts'

// ---------------------------------------------------------------- Stevenson Place, 71 Stevenson (1980s; way/149840694)
/**
 * Commons "Stevenson Place.jpg" and Mapillary on Stevenson/Jessie: a dark red-brown granite base of five storeys
 * ruled by cream stone bands, then a shaft of cream vertical piers with dark window columns between them and
 * red-brown spandrels, three setbacks stepping in near the top, and a little pitched cream gable block with a
 * louvre on the roof.
 */
function stevensonPlace(out: MeshBuilder, fit: Fit): void {
  const CREAM: Rgb = [0.85, 0.8, 0.7]
  const BROWN: Rgb = [0.4, 0.27, 0.25]
  const GLASS: Rgb = [0.3, 0.27, 0.28]
  const baseFace: Face = { kind: 'punched', wall: BROWN, glass: GLASS, floor: 3.9, pitch: 3.4, solid: 0.55, material: 'granite' }
  const shaft: Face = { kind: 'fins', wall: CREAM, glass: [0.34, 0.26, 0.26], floor: 3.6, pitch: 3.3, solid: 0.62, depth: 0.55, material: 'ashlar' }
  const upper: Face = { ...shaft }
  const bands = [3.9, 7.8, 11.7, 15.6].map((at) => ({ at, depth: 0.25, height: 0.7, colour: CREAM }))
  tower(out, fit, {
    height: 103,
    base: { height: 19.5, face: baseFace },
    cornices: bands,
    tiers: [
      { to: 0.8, face: shaft, cornice: { depth: 0.5, height: 0.8, colour: CREAM } },
      { to: 0.88, face: upper, inset: 2.4, cornice: { depth: 0.4, height: 0.7, colour: CREAM } },
      { to: 0.95, face: upper, inset: 2.4, cornice: { depth: 0.4, height: 0.7, colour: CREAM } },
      { to: 1.0, face: { kind: 'punched', wall: CREAM, glass: GLASS, floor: 3.6, pitch: 3.3, solid: 0.7, material: 'ashlar' }, inset: 4 },
    ],
    roof: [0.5, 0.48, 0.45],
    crown: { kind: 'hip', height: 6, inset: 3, colour: CREAM, material: 'ashlar' },
  })
}

// ---------------------------------------------------------------- 1177 Market at Trinity Place (2010s; way/208345686)
/**
 * Mapillary frames on Market and 8th: a 17-storey flats block of pale tan-beige precast panels, its punched windows
 * stacked in vertical bays with a deep reveal, a glazed curtain-wall strip running up the Market corner, a dark
 * glass shopfront under a low base, and the top two floors set back behind a plain parapet.
 */
function trinityPlace1177(out: MeshBuilder, fit: Fit): void {
  const TAN: Rgb = [0.74, 0.72, 0.67]
  const GLASS: Rgb = [0.25, 0.3, 0.34]
  const punched: Face = { kind: 'punched', wall: TAN, glass: GLASS, floor: 3.2, pitch: 4, solid: 0.45, material: 'concrete' }
  tower(out, fit, {
    height: 61,
    base: { height: 5, face: { kind: 'curtain', wall: [0.18, 0.2, 0.22], glass: [0.2, 0.24, 0.28], pitch: 3, floor: 5, material: 'metal' } },
    tiers: [
      { to: 0.78, face: punched },
      { to: 0.9, face: { kind: 'curtain', wall: TAN, glass: [0.48, 0.55, 0.6], pitch: 2.4, floor: 3.2, material: 'metal' }, inset: 0 },
      { to: 1.0, face: punched, inset: 3, cornice: { depth: 0.4, height: 0.6, colour: TAN } },
    ],
    crown: { kind: 'parapet', height: 1.2, colour: TAN, material: 'concrete' },
  })
}

// ---------------------------------------------------------------- Union Trust Bank, 2 Grant (1910; way/149335980)
/**
 * Mapillary frames at Market and Grant: a two-storey banking hall of pale grey-white granite on a plain pedestal,
 * a giant order of smooth engaged columns (paired at the corner) between tall two-tier windows with a balcony
 * shelf and arched heads, a deep bracketed cornice, and a carved attic parapet above.
 */
function unionTrustBank(out: MeshBuilder, fit: Fit): void {
  const STONE: Rgb = [0.8, 0.78, 0.73]
  const GLASS: Rgb = [0.2, 0.22, 0.22]
  const wall: Face = { kind: 'punched', wall: STONE, glass: GLASS, floor: 7.2, pitch: 6.5, solid: 0.42, arched: true, head: 'architrave', material: 'granite' }
  tower(out, fit, {
    height: 20,
    base: { height: 1.6, face: { kind: 'blank', wall: [0.7, 0.68, 0.64], material: 'granite' } },
    tiers: [
      { to: 17, face: wall, cornice: { depth: 1.3, height: 1.1, colour: STONE } },
      { to: 1.0, face: { kind: 'blank', wall: STONE, material: 'ashlar' }, inset: 0.7 },
    ],
    crown: { kind: 'balustrade', height: 1.0, colour: STONE, material: 'ashlar', pier: true },
  })
  const ring = towerRing(fit)
  for (let i = 0; i < ring.length; i++) {
    const e = edgeAt(ring, i)
    if (e.L < 8) continue
    colonnade(out, e.a, e.b, 1.6, 13.6, Math.max(2, Math.round(e.L / 6.5)), { order: 'ionic', colour: STONE, material: 'granite', radius: 0.6, out: 0.35, entablature: 0.01, tier: 'far' })
  }
}

// ---------------------------------------------------------------- Serif, 960 Market (2021; way/1072899109)
/**
 * Mapillary frames on Market: a 12-storey apartment block of pale grey-white cladding, its wall in deep bowed
 * bay windows stacked one per floor with dark glass, a flat roof with a slight step, and a glazed ground floor
 * under a cream band and dark soffit. Recognisable, not accurate.
 */
function serif960Market(out: MeshBuilder, fit: Fit): void {
  const GREY: Rgb = [0.84, 0.85, 0.84]
  const GLASS: Rgb = [0.22, 0.26, 0.3]
  const DARK: Rgb = [0.18, 0.2, 0.22]
  const bays: Face = { kind: 'punched', wall: GREY, glass: GLASS, floor: 3.1, pitch: 4.2, solid: 0.5, material: 'concrete' }
  tower(out, fit, {
    height: 37,
    base: { height: 4.2, face: { kind: 'curtain', wall: DARK, glass: [0.2, 0.26, 0.3], pitch: 2.6, floor: 4.2, material: 'metal' } },
    cornices: [{ at: 4.6, depth: 0.5, height: 0.6, colour: GREY }],
    tiers: [
      { to: 0.9, face: bays },
      { to: 1.0, face: bays, inset: 1, cornice: { depth: 0.4, height: 0.6, colour: GREY } },
    ],
    roof: [0.7, 0.7, 0.7],
    crown: { kind: 'parapet', height: 1.0, colour: GREY, material: 'concrete' },
  })
}

// ---------------------------------------------------------------- James Bong Building, 1 Market / Fourth (pre-war; way/256029751)
/**
 * Mapillary frames at Fourth and Market: a twelve-storey pre-war office block of pale cream-grey stone, its upper
 * floors ruled by tall pilasters with paired windows between them, a moulded cornice band and carved corbels under
 * the crown, and a red-brown terracotta ground storey of shopfronts with a dark glass band above. Recognisable, not
 * accurate.
 */
function jamesBongBuilding(out: MeshBuilder, fit: Fit): void {
  const STONE: Rgb = [0.8, 0.78, 0.72]
  const TERRA: Rgb = [0.5, 0.28, 0.2]
  const GLASS: Rgb = [0.2, 0.23, 0.25]
  const shops: Face = { kind: 'punched', wall: TERRA, glass: GLASS, floor: 5, pitch: 4, solid: 0.35, material: 'terracotta' }
  const upper: Face = { kind: 'punched', wall: STONE, glass: GLASS, floor: 3.6, pitch: 3.2, solid: 0.42, material: 'ashlar' }
  tower(out, fit, {
    height: 54,
    base: { height: 5, face: shops },
    cornices: [{ at: 5, depth: 0.5, height: 0.7, colour: STONE }],
    tiers: [
      { to: 0.86, face: upper, cornice: { depth: 0.9, height: 0.9, colour: STONE } },
      { to: 1.0, face: upper, inset: 1.5, cornice: { depth: 0.4, height: 0.5, colour: STONE } },
    ],
    roof: [0.55, 0.53, 0.5],
    crown: { kind: 'balustrade', height: 1.6, colour: STONE, material: 'ashlar', pier: true },
  })
}

// ---------------------------------------------------------------- 901 Market Street, the Hale Brothers store (1912; way/332626852)
/**
 * Hale Brothers' department store at Market and Fifth: a five-storey cream terracotta commercial palazzo. Shop
 * windows along the street at ground level, four upper floors of large grouped windows between piers, a strong
 * projecting cornice and a flat parapet. Modelled from the brief's expected gist: the Mapillary frames taken at this
 * site show the rear and side service walls, not the Market Street front, so the massing and colour are not yet
 * checked against a photograph of the front. Recognisable, not accurate.
 */
function haleBrothers901Market(out: MeshBuilder, fit: Fit): void {
  const CREAM: Rgb = [0.9, 0.86, 0.77]
  const GLASS: Rgb = [0.22, 0.26, 0.3]
  const shops: Face = { kind: 'curtain', wall: [0.5, 0.42, 0.34], glass: GLASS, pitch: 4, floor: 6.5, material: 'terracotta' }
  const upper: Face = { kind: 'punched', wall: CREAM, glass: GLASS, floor: 5.5, pitch: 4.4, solid: 0.45, material: 'terracotta' }
  tower(out, fit, {
    height: 29,
    base: { height: 6.5, face: shops },
    cornices: [{ at: 6.5, depth: 0.5, height: 0.6, colour: CREAM }],
    tiers: [{ to: 27, face: upper, cornice: { depth: 1, height: 1, colour: CREAM } }],
    roof: [0.6, 0.6, 0.58],
    crown: { kind: 'parapet', height: 2, colour: CREAM, material: 'terracotta' },
  })
}

// ---------------------------------------------------------------- Prism, 1028 Market Street (2010s flats; way/32864957)
/**
 * Mapillary frames on Market and at Jones: a thirteen-storey apartment block of cream-grey panelled cladding ruled by
 * horizontal joints, its windows in dark-framed ribbons in pairs between narrow vertical reveals. A glazed ground floor
 * of teal shopfront glass under a dark band, a single setback near the top, and a dark roof parapet. Recognisable, not
 * accurate.
 */
function prism1028Market(out: MeshBuilder, fit: Fit): void {
  const CREAM: Rgb = [0.86, 0.84, 0.78]
  const GLASS: Rgb = [0.3, 0.36, 0.4]
  const DARK: Rgb = [0.3, 0.31, 0.33]
  const shops: Face = { kind: 'curtain', wall: DARK, glass: [0.55, 0.78, 0.74], pitch: 4, floor: 4.5, material: 'metal' }
  const upper: Face = { kind: 'punched', wall: CREAM, glass: GLASS, floor: 3.4, pitch: 3.8, solid: 0.5, material: 'metal' }
  tower(out, fit, {
    height: 47,
    base: { height: 5, face: shops },
    tiers: [
      { to: 0.82, face: upper, cornice: { depth: 0.3, height: 0.4, colour: DARK } },
      { to: 1, face: upper, inset: 2.5 },
    ],
    crown: { kind: 'parapet', height: 1, colour: DARK, material: 'metal' },
    penthouse: 1,
  })
}

// ---------------------------------------------------------------- Livat, 945 Market Street (retail mall, c.1980s–2010s; way/332515949)
/**
 * Mapillary frame at the Market front (pick 0): a glazed shopfront of dark-framed panes at street level under a
 * grey painted lintel band, then a band of grey corrugated metal panels cut by long louvred vents, and a grey
 * render cap. Five storeys, a plain flat roof. Recognisable, not accurate. (Pick 1 and 2 were brick alley and
 * neighbours, not this front.)
 */
function livat945Market(out: MeshBuilder, fit: Fit): void {
  const GREY: Rgb = [0.5, 0.52, 0.54]
  const DARK: Rgb = [0.3, 0.31, 0.33]
  const shops: Face = { kind: 'curtain', wall: DARK, glass: [0.22, 0.3, 0.32], pitch: 3.2, floor: 4.5, material: 'metal' }
  const upper: Face = { kind: 'bands', wall: GREY, glass: [0.2, 0.22, 0.24], floor: 3.4, solid: 0.7, material: 'metal' }
  tower(out, fit, {
    height: 18,
    base: { height: 4.5, face: shops },
    tiers: [{ to: 1, face: upper, cornice: { depth: 0.4, height: 0.5, colour: DARK } }],
    crown: { kind: 'parapet', height: 1.2, colour: DARK, material: 'metal' },
    penthouse: 2,
  })
}

// ---------------------------------------------------------------- Bank of America Building, Market at New Montgomery (way/941649434)
/**
 * Mapillary frames on Market and on New Montgomery (picks 0–2): a dark grey granite base of shops and a stone
 * ground floor under the 33 New Montgomery frontage, then a white-cream shaft of punched windows in dark-framed
 * columns, rising well above its neighbours' cornices, with a setback and a dark parapet at the top. OSM: a
 * plain building outline, 14 levels, no height tag; the photographs support the height given in the manifest.
 */
function bofaMarketNewMontgomery(out: MeshBuilder, fit: Fit): void {
  const CREAM: Rgb = [0.9, 0.88, 0.83]
  const GRANITE: Rgb = [0.42, 0.42, 0.43]
  const DARK: Rgb = [0.3, 0.31, 0.33]
  const base: Face = { kind: 'bands', wall: GRANITE, glass: [0.2, 0.23, 0.26], floor: 4, solid: 0.7, material: 'granite' }
  const shaft: Face = { kind: 'punched', wall: CREAM, glass: DARK, floor: 3.4, pitch: 3.6, solid: 0.5, material: 'ashlar' }
  tower(out, fit, {
    height: 50,
    base: { height: 9, face: base },
    tiers: [
      { to: 0.8, face: shaft, cornice: { depth: 0.5, height: 0.6, colour: GRANITE } },
      { to: 1, face: shaft, inset: 2.5 },
    ],
    crown: { kind: 'parapet', height: 1.2, colour: GRANITE, material: 'granite' },
    penthouse: 1,
  })
}

// ---------------------------------------------------------------- 715-719 Market Street, Digital Garage (pre-war; way/149332501)
/**
 * Mapillary on Market (picks 0-1): an eight-storey pre-war office block with a glazed shopfront under a stone band,
 * a grey shaft of ribbon windows in deep spandrels, and a plain stone-capped parapet.
 */
function digitalGarage715Market(out: MeshBuilder, fit: Fit): void {
  const STONE: Rgb = [0.72, 0.7, 0.66]
  const GREY: Rgb = [0.74, 0.74, 0.72]
  const GLASS: Rgb = [0.24, 0.28, 0.32]
  const shopfront: Face = { kind: 'curtain', wall: STONE, glass: GLASS, floor: 4.5, pitch: 2.4, material: 'granite' }
  const shaft: Face = { kind: 'bands', wall: GREY, glass: GLASS, floor: 3.3, solid: 0.45, material: 'concrete' }
  tower(out, fit, {
    height: 33,
    base: { height: 4.5, face: shopfront },
    tiers: [{ to: 1, face: shaft, cornice: { depth: 0.6, height: 0.8, colour: STONE } }],
    crown: { kind: 'parapet', height: 1.0, colour: STONE, material: 'granite' },
  })
}

// ---------------------------------------------------------------- 500 Washington, Public Policy Institute of California (way/32859287)
/**
 * Mapillary frames on Washington and Sansome (picks 0-1): an eight-storey office block of dark red-brown brick or
 * terracotta, its windows cut into deep reveals in a regular grid, a glazed shopfront along the ground floor, and
 * the top storey set back behind a plain brick parapet. Plain massing; the frames show no further distinctive feature.
 */
function ppic500Washington(out: MeshBuilder, fit: Fit): void {
  const BRICK: Rgb = [0.5, 0.27, 0.22]
  const GLASS: Rgb = [0.22, 0.26, 0.3]
  const SHOP: Rgb = [0.2, 0.24, 0.27]
  tower(out, fit, {
    height: 33,
    base: { height: 4.5, face: { kind: 'curtain', wall: [0.3, 0.2, 0.18], glass: SHOP, pitch: 2.6, floor: 4.5, material: 'metal' } },
    tiers: [
      { to: 0.86, face: { kind: 'punched', wall: BRICK, glass: GLASS, floor: 3.4, pitch: 3.2, solid: 0.55, material: 'brick' }, cornice: { depth: 0.4, height: 0.6, colour: BRICK } },
      { to: 1.0, face: { kind: 'punched', wall: BRICK, glass: GLASS, floor: 3.4, pitch: 3.2, solid: 0.55, material: 'brick' }, inset: 1.8 },
    ],
    crown: { kind: 'parapet', height: 1.0, colour: BRICK, material: 'brick' },
  })
}

/**
 * GRANT BUILDING, 1095 Market Street (1905 steel-frame loft, corner of 7th): eight storeys of red brick, arched
 * head windows on the upper floors, a dark shopfront at street level, a corbelled brick crown. Photo: Mapillary,
 * Market Street facing south-east (grant0).
 */
function grantBuilding1095Market(out: MeshBuilder, fit: Fit): void {
  const BRICK: Rgb = [0.55, 0.22, 0.14]
  const GLASS: Rgb = [0.18, 0.2, 0.22]
  const SHOP: Rgb = [0.12, 0.13, 0.14]
  tower(out, fit, {
    height: 35,
    base: { height: 4, face: { kind: 'curtain', wall: [0.3, 0.2, 0.18], glass: SHOP, pitch: 3, floor: 4, material: 'metal' } },
    tiers: [
      { to: 0.9, face: { kind: 'punched', wall: BRICK, glass: GLASS, floor: 3.6, pitch: 3.4, solid: 0.5, arched: true, material: 'brick' }, cornice: { depth: 0.4, height: 0.6, colour: [0.6, 0.55, 0.48] } },
      { to: 1.0, face: { kind: 'punched', wall: BRICK, glass: GLASS, floor: 3.6, pitch: 3.4, solid: 0.5, arched: true, material: 'brick' }, inset: 1.2 },
    ],
    crown: { kind: 'parapet', height: 1.2, colour: BRICK, material: 'brick' },
  })
}

/**
 * AIDA HOTEL, 1083–1087 Market Street (1910s Tenderloin hotel, next door to the Grant Building): a plain light
 * stucco front of about seven storeys over a shopfront at street level, a flat parapet. Photo: Mapillary,
 * foliage hides the upper floors (aida0); massing and colour from the outline and the neighbour's scale.
 */
function aidaHotel1083Market(out: MeshBuilder, fit: Fit): void {
  const STUCCO: Rgb = [0.84, 0.8, 0.7]
  const GLASS: Rgb = [0.2, 0.24, 0.27]
  const SHOP: Rgb = [0.16, 0.18, 0.2]
  tower(out, fit, {
    height: 26,
    base: { height: 4, face: { kind: 'curtain', wall: [0.3, 0.26, 0.22], glass: SHOP, pitch: 3, floor: 4, material: 'metal' } },
    tiers: [
      { to: 1.0, face: { kind: 'punched', wall: STUCCO, glass: GLASS, floor: 3.4, pitch: 3.2, solid: 0.55, material: 'stucco' }, cornice: { depth: 0.35, height: 0.5, colour: STUCCO } },
    ],
    crown: { kind: 'parapet', height: 0.9, colour: STUCCO, material: 'stucco' },
  })
}

/** 1119 Market: four storeys of tan terracotta over a dark shopfront, beside the Strand (Mapillary a0, a1). */
function market1119(out: MeshBuilder, fit: Fit): void {
  const TERRA: Rgb = [0.7, 0.5, 0.36]
  const SHOP: Rgb = [0.16, 0.14, 0.13]
  const GLASS: Rgb = [0.14, 0.17, 0.19]
  tower(out, fit, {
    height: 15.5,
    base: { height: 4, face: { kind: 'curtain', wall: SHOP, glass: GLASS, pitch: 3, floor: 4, material: 'metal' } },
    tiers: [
      { to: 1.0, face: { kind: 'punched', wall: TERRA, glass: GLASS, floor: 3.8, pitch: 3, solid: 0.45, material: 'terracotta' }, cornice: { depth: 0.45, height: 0.6, colour: TERRA } },
    ],
    crown: { kind: 'parapet', height: 0.9, colour: TERRA, material: 'terracotta' },
  })
}

/** Budget Inn, 1139 Market: a brick hotel of about four storeys at 3.2 m, dark shopfront, plain parapet (Mapillary b0, b1). */
function budgetInn1139Market(out: MeshBuilder, fit: Fit): void {
  const BRICK: Rgb = [0.6, 0.38, 0.27]
  const SHOP: Rgb = [0.2, 0.18, 0.17]
  const GLASS: Rgb = [0.2, 0.22, 0.24]
  tower(out, fit, {
    height: 13,
    base: { height: 3.2, face: { kind: 'curtain', wall: SHOP, glass: GLASS, pitch: 3, floor: 3.2, material: 'metal' } },
    tiers: [
      { to: 1.0, face: { kind: 'punched', wall: BRICK, glass: GLASS, floor: 3.2, pitch: 2.6, solid: 0.6, material: 'brick' }, cornice: { depth: 0.3, height: 0.4, colour: BRICK } },
    ],
    crown: { kind: 'parapet', height: 0.8, colour: BRICK, material: 'brick' },
  })
}

/** 1100 Market annexe, north-west side by Leavenworth: six storeys of grey panelled 1920s commercial, arched heads (Mapillary c0). */
function market1100Annexe(out: MeshBuilder, fit: Fit): void {
  const GREY: Rgb = [0.6, 0.6, 0.58]
  const SHOP: Rgb = [0.14, 0.14, 0.15]
  const GLASS: Rgb = [0.18, 0.2, 0.22]
  tower(out, fit, {
    height: 23,
    base: { height: 4, face: { kind: 'curtain', wall: SHOP, glass: GLASS, pitch: 3, floor: 4, material: 'metal' } },
    tiers: [
      { to: 1.0, face: { kind: 'punched', wall: GREY, glass: GLASS, floor: 3.8, pitch: 3.2, solid: 0.5, arched: true, material: 'concrete' }, cornice: { depth: 0.4, height: 0.6, colour: GREY } },
    ],
    crown: { kind: 'parapet', height: 1.2, colour: GREY, material: 'concrete' },
  })
}

/** 979–991 Market: six storeys of brown brick over a dark shopfront (Mapillary frames pA0, pA1). */
export function market979(out: MeshBuilder, fit: Fit): void {
  const BRICK: Rgb = [0.4, 0.22, 0.2]
  const DARK: Rgb = [0.14, 0.14, 0.15]
  tower(out, fit, {
    height: 23,
    base: { height: 4, face: { kind: 'curtain', wall: DARK, glass: [0.18, 0.2, 0.22], pitch: 3, floor: 4, material: 'metal' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: BRICK, glass: [0.22, 0.26, 0.3], floor: 3.8, pitch: 3.2, solid: 0.5, material: 'brick' } }],
    crown: { kind: 'parapet', height: 1.2, colour: BRICK, material: 'brick' },
  })
}

/** 973 Market: brick and grey panels over a dark shopfront, about nine storeys (Mapillary frames pB0, pB1). */
export function market973(out: MeshBuilder, fit: Fit): void {
  const BRICK: Rgb = [0.42, 0.26, 0.22]
  const GREY: Rgb = [0.55, 0.56, 0.57]
  const DARK: Rgb = [0.14, 0.14, 0.15]
  tower(out, fit, {
    height: 34,
    base: { height: 4, face: { kind: 'curtain', wall: DARK, glass: [0.18, 0.2, 0.22], pitch: 3, floor: 4, material: 'metal' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: BRICK, glass: [0.22, 0.26, 0.3], floor: 3.6, pitch: 3.2, solid: 0.5, material: 'brick' } }],
    crown: { kind: 'parapet', height: 1.2, colour: GREY, material: 'concrete' },
  })
}

/** Frontier Tower, 1 Sixth Street: four storeys of white panels with green spandrels over a glazed shopfront (Mapillary frames pC0, pC1). */
export function frontierTower1Sixth(out: MeshBuilder, fit: Fit): void {
  const WHITE: Rgb = [0.9, 0.9, 0.86]
  const GREEN: Rgb = [0.55, 0.75, 0.6]
  const GLASS: Rgb = [0.18, 0.2, 0.22]
  tower(out, fit, {
    height: 16,
    base: { height: 4, face: { kind: 'curtain', wall: GLASS, glass: [0.2, 0.24, 0.27], pitch: 3, floor: 4, material: 'metal' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: WHITE, glass: GREEN, floor: 3.8, pitch: 3, solid: 0.45, material: 'concrete' } }],
    crown: { kind: 'parapet', height: 0.8, colour: WHITE, material: 'concrete' },
  })
}

// ---------------------------------------------------------------- 605 and 607 Market Street (pre-war offices; way/79377175, way/148285587)
/**
 * One buff punched tower on the south-east side of Market, about fourteen storeys: a tan stone grid of square dark
 * windows, a stepped crown and a dark shopfront at street level (Mapillary frames across the street, pA0 and pB1).
 * The photographs show ONE building, so 605 and 607 both call this helper and look identical.
 */
function marketTan14(out: MeshBuilder, fit: Fit): void {
  const TAN: Rgb = [0.72, 0.64, 0.52]
  const DARK: Rgb = [0.14, 0.15, 0.17]
  tower(out, fit, {
    height: 54,
    base: { height: 5, face: { kind: 'punched', wall: [0.3, 0.28, 0.26], glass: DARK, pitch: 3, floor: 5, solid: 0.8, material: 'ashlar' } },
    tiers: [
      { to: 0.9, face: { kind: 'punched', wall: TAN, glass: DARK, pitch: 2.8, floor: 3.6, solid: 0.55, material: 'ashlar' } },
      { to: 1, inset: 1.2, face: { kind: 'punched', wall: TAN, glass: DARK, pitch: 2.8, floor: 3.6, solid: 0.55, material: 'ashlar' }, cornice: { depth: 0.5 } },
    ],
    crown: { kind: 'stepped', steps: 2, height: 3, inset: 1.2, material: 'ashlar' },
  })
}

function market605(out: MeshBuilder, fit: Fit): void {
  marketTan14(out, fit)
}

function market607(out: MeshBuilder, fit: Fit): void {
  marketTan14(out, fit)
}

// ---------------------------------------------------------------- 49 Stevenson Street (commercial block behind Market; way/149837256)
/**
 * Behind Market on Stevenson: a pale grey panelled shaft of about seventeen storeys, its panels in horizontal courses
 * with small punched windows, and a dark ground floor with a roller shutter and a glazed base (Mapillary frame pC0).
 */
function stevenson49(out: MeshBuilder, fit: Fit): void {
  const GREY: Rgb = [0.7, 0.69, 0.66]
  tower(out, fit, {
    height: 60,
    base: { height: 5, face: { kind: 'curtain', wall: [0.3, 0.3, 0.3], glass: [0.16, 0.18, 0.2], pitch: 3, floor: 5, material: 'metal' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: GREY, glass: [0.2, 0.26, 0.3], pitch: 3, floor: 3.5, solid: 0.6, material: 'concrete' } }],
    crown: { kind: 'parapet', height: 1, colour: GREY, material: 'concrete' },
  })
}

/**
 * The pre-war Market Street block (725–731 and 735 share the shape, not the colour): a shopfront base, punched
 * windows up the storeys, a string course over the shops and a parapet. Mapillary frames a0 (735) and b0/b1 (725–731).
 */
function marketBlock(out: MeshBuilder, fit: Fit, s: {
  wall: Rgb; trim: Rgb; shop: Rgb; glass: Rgb; material: NonNullable<Face['material']>; base?: Face
}): void {
  tower(out, fit, {
    height: fit.height,
    base: { height: 4.5, face: s.base ?? { kind: 'punched', wall: s.shop, glass: s.glass, pitch: 4, floor: 4.5, solid: 0.25, material: 'granite' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: s.wall, glass: s.glass, pitch: 2.6, floor: 3.8, solid: 0.6, material: s.material } }],
    cornices: [{ at: 4.5, depth: 0.25, height: 0.4, colour: s.trim }],
    crown: { kind: 'parapet', height: 1.2, colour: s.trim, material: s.material },
  })
}

/** 735 Market (way/149332505): buff brick, six storeys over a dark granite shopfront (Mapillary a0). */
function market735(out: MeshBuilder, fit: Fit): void {
  marketBlock(out, fit, { wall: [0.7, 0.6, 0.46], trim: [0.85, 0.8, 0.7], shop: [0.36, 0.33, 0.3], glass: [0.2, 0.23, 0.25], material: 'brick' })
}

/** 725–731 Market (way/149332503): cream terracotta, six storeys; the shop base is painted yellow for the mural (Mapillary b0, b1). */
function market725(out: MeshBuilder, fit: Fit): void {
  marketBlock(out, fit, {
    wall: [0.8, 0.74, 0.62], trim: [0.88, 0.84, 0.74], shop: [0.5, 0.45, 0.38], glass: [0.2, 0.22, 0.24], material: 'terracotta',
    base: { kind: 'punched', wall: [0.86, 0.72, 0.22], glass: [0.14, 0.16, 0.18], pitch: 4, floor: 4.5, solid: 0.3 },
  })
}

/** 30–34 Third Street (way/149332504): a cream stone podium of three storeys, a set-back white block above, a teal canopy (Mapillary c0, c1). */
function third30(out: MeshBuilder, fit: Fit): void {
  const CREAM: Rgb = [0.8, 0.76, 0.64], WHITE: Rgb = [0.9, 0.88, 0.82]
  tower(out, fit, {
    height: fit.height,
    base: { height: 4.5, face: { kind: 'punched', wall: [0.35, 0.34, 0.3], glass: [0.16, 0.2, 0.2], pitch: 4, floor: 4.5, solid: 0.25, material: 'granite' }, canopy: { depth: 1.6, colour: [0.2, 0.42, 0.4] } },
    tiers: [
      { to: 12, face: { kind: 'punched', wall: CREAM, glass: [0.2, 0.22, 0.24], pitch: 2.8, floor: 3.8, solid: 0.55, material: 'ashlar' } },
      { to: 1, inset: 1.2, face: { kind: 'punched', wall: WHITE, glass: [0.22, 0.24, 0.27], pitch: 2.8, floor: 3.8, solid: 0.5, material: 'stucco' } },
    ],
    cornices: [{ at: 4.5, depth: 0.25, height: 0.4, colour: CREAM }, { at: 12, depth: 0.5, height: 0.6, colour: CREAM }],
    crown: { kind: 'parapet', height: 1, colour: WHITE, material: 'stucco' },
  })
}

/** 720 Market (way/149335990): cream stone Chicago-style block, arcaded ground floor, cornice under a parapet (Mapillary a0). */
export function market720(out: MeshBuilder, fit: Fit): void {
  const CREAM: Rgb = [0.84, 0.8, 0.7]
  tower(out, fit, {
    height: 42,
    base: { height: 4.5, face: { kind: 'punched', wall: CREAM, glass: [0.2, 0.36, 0.34], pitch: 3, floor: 4.5, solid: 0.35, arched: true, material: 'ashlar' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: CREAM, glass: [0.2, 0.24, 0.27], pitch: 3, floor: 4, solid: 0.45, material: 'ashlar' } }],
    cornices: [{ at: 4.5, depth: 0.3, height: 0.4, colour: CREAM }],
    crown: { kind: 'parapet', height: 1.2, colour: CREAM, material: 'ashlar' },
  })
}

/** 1 Kearny (way/149335979): 2009 glass corner, dark glass shopfront, bands of dark glass and metal, set-back crown (Mapillary b0). */
export function kearny1(out: MeshBuilder, fit: Fit): void {
  const DARK: Rgb = [0.2, 0.21, 0.23]
  tower(out, fit, {
    height: 47,
    base: { height: 4, face: { kind: 'curtain', wall: [0.12, 0.13, 0.14], glass: [0.14, 0.17, 0.2], pitch: 3, floor: 4, material: 'metal' } },
    tiers: [
      { to: 0.7, face: { kind: 'bands', wall: DARK, glass: [0.18, 0.22, 0.26], floor: 3.6, solid: 0.5, material: 'metal' } },
      { to: 1, inset: 2.5, face: { kind: 'bands', wall: [0.3, 0.31, 0.33], glass: [0.16, 0.2, 0.24], floor: 3.6, solid: 0.5, material: 'metal' } },
    ],
    crown: { kind: 'parapet', height: 1, colour: [0.3, 0.31, 0.33], material: 'metal' },
    penthouse: 1,
  })
}

/** the unnamed block between Geary and Market (way/940203045): dark-glass shopfronts under a cream stone upper block (Mapillary c0). */
export function geary940203045(out: MeshBuilder, fit: Fit): void {
  const STONE: Rgb = [0.78, 0.74, 0.66]
  tower(out, fit, {
    height: 28,
    base: { height: 4.5, face: { kind: 'curtain', wall: [0.14, 0.15, 0.16], glass: [0.16, 0.2, 0.24], pitch: 3, floor: 4.5, material: 'metal' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: STONE, glass: [0.22, 0.26, 0.3], pitch: 3.2, floor: 4.7, solid: 0.4, material: 'ashlar' } }],
    cornices: [{ at: 4.5, depth: 0.3, height: 0.4, colour: STONE }],
    crown: { kind: 'parapet', height: 0.9, colour: STONE, material: 'ashlar' },
  })
}

// ---------------------------------------------------------------- 800-830 Market Street (1910s; relation/4669301)
/**
 * Nine storeys opposite the Flood Building (Mapillary a0, a1): a dark granite shopfront under a green-canopied awning,
 * then a grey-buff Chicago-style shaft of punched windows in tall ribbons, a cornice at the top of the base, and a
 * copper-green parapet on the roof.
 */
function market800(out: MeshBuilder, fit: Fit): void {
  const STONE: Rgb = [0.6, 0.58, 0.55]
  const DARK: Rgb = [0.2, 0.2, 0.21]
  tower(out, fit, {
    height: 32,
    base: { height: 4.6, face: { kind: 'punched', wall: DARK, glass: [0.22, 0.26, 0.3], floor: 4.6, pitch: 3.2, solid: 0.5, material: 'granite' }, canopy: { depth: 2.2, colour: [0.22, 0.3, 0.27] } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: STONE, glass: [0.2, 0.25, 0.3], floor: 3.6, pitch: 3, solid: 0.42, material: 'ashlar' } }],
    cornices: [{ at: 4.6, depth: 0.5, colour: DARK }],
    crown: { kind: 'parapet', height: 1.6, colour: [0.36, 0.46, 0.42], material: 'copper' },
  })
}

// ---------------------------------------------------------------- 742-748 Market Street (1900s; way/35176927)
/**
 * Five storeys of cream stone (Mapillary b0, b1): a black-awninged shopfront at street level, then tall two-storey
 * windows divided by pale muntins under a plain cornice and parapet.
 */
function market742(out: MeshBuilder, fit: Fit): void {
  const CREAM: Rgb = [0.86, 0.83, 0.75]
  const SHOP: Rgb = [0.16, 0.16, 0.17]
  tower(out, fit, {
    height: 21,
    base: { height: 4.2, face: { kind: 'punched', wall: CREAM, glass: [0.14, 0.16, 0.18], floor: 4.2, pitch: 3.6, solid: 0.3, material: 'ashlar' }, canopy: { depth: 2.4, colour: SHOP } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: CREAM, glass: [0.32, 0.4, 0.46], floor: 3.6, pitch: 3.2, solid: 0.38, material: 'ashlar' } }],
    cornices: [{ at: 4.2, depth: 0.45, colour: CREAM }],
    crown: { kind: 'parapet', height: 1.2, colour: CREAM, material: 'ashlar' },
  })
}

// ---------------------------------------------------------------- Garfield Building (way/1259112449)
/**
 * Seven storeys of buff brick (Mapillary c0, c1): a dark granite ground floor, a tan brick shaft with a cornice band
 * under each upper floor group, and a plain parapet on top.
 */
function garfieldBuilding(out: MeshBuilder, fit: Fit): void {
  const TAN: Rgb = [0.74, 0.62, 0.48]
  tower(out, fit, {
    height: 25,
    base: { height: 4.4, face: { kind: 'punched', wall: [0.18, 0.18, 0.19], glass: [0.24, 0.28, 0.3], floor: 4.4, pitch: 3.4, solid: 0.5, material: 'granite' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: TAN, glass: [0.26, 0.3, 0.34], floor: 3.5, pitch: 2.9, solid: 0.4, material: 'brick' } }],
    cornices: [{ at: 4.4, depth: 0.4, colour: TAN }, { at: 0.66, depth: 0.3, colour: TAN }],
    crown: { kind: 'parapet', height: 1.4, colour: TAN, material: 'brick' },
  })
}

/** DONNELLY HOTEL, 1272 Market (1910s): five storeys of cream plaster, arched upper windows, a dark shopfront base, a parapet (Mapillary a0, a1). */
export function donnellyHotel(out: MeshBuilder, fit: Fit): void {
  const CREAM: Rgb = [0.86, 0.82, 0.72]
  tower(out, fit, {
    height: 16,
    base: { height: 3.2, face: { kind: 'curtain', wall: [0.18, 0.18, 0.18], glass: [0.14, 0.17, 0.19], pitch: 3, floor: 3.2, material: 'metal' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: CREAM, glass: [0.26, 0.3, 0.32], floor: 3.2, pitch: 3.2, solid: 0.6, arched: true, material: 'stucco' } }],
    cornices: [{ at: 3.2, depth: 0.35, colour: CREAM }],
    crown: { kind: 'parapet', height: 1, colour: CREAM, material: 'stucco' },
  })
}

/** WELLS FARGO, 1256 Market: a low two-storey bank branch in tan-yellow brick, a row of ground-floor doors, a stepped parapet (Mapillary b0, b1). No logo or sign. */
export function wellsFargo1256Market(out: MeshBuilder, fit: Fit): void {
  const YELLOW: Rgb = [0.8, 0.68, 0.42]
  tower(out, fit, {
    height: 10,
    tiers: [{ to: 1, face: { kind: 'punched', wall: YELLOW, glass: [0.2, 0.22, 0.24], floor: 5, pitch: 4, solid: 0.7, material: 'brick' } }],
    cornices: [{ at: 0.5, depth: 0.2, colour: YELLOW }],
    crown: { kind: 'parapet', height: 1.2, colour: YELLOW, material: 'brick' },
  })
}

/** YULLY BUILDING, 1212 Market: a small four-storey loft in grey-brown brick, piers between the bays, dark-glass shopfront, parapet (Mapillary c0). */
export function yullyBuilding(out: MeshBuilder, fit: Fit): void {
  const BROWN: Rgb = [0.5, 0.46, 0.42]
  tower(out, fit, {
    height: 15,
    base: { height: 3.6, face: { kind: 'curtain', wall: [0.2, 0.2, 0.2], glass: [0.16, 0.18, 0.18], pitch: 3, floor: 3.6, material: 'metal' } },
    tiers: [{ to: 1, face: { kind: 'fins', wall: BROWN, glass: [0.2, 0.22, 0.22], floor: 3.8, pitch: 3.2, solid: 0.55, depth: 0.35, material: 'brick' } }],
    cornices: [{ at: 13.5, depth: 0.4, colour: BROWN }],
    crown: { kind: 'parapet', height: 1.2, colour: BROWN, material: 'brick' },
  })
}

/**
 * 1017–1019 MARKET, the EASTERN OUTFITTING COMPANY building (1909): a furniture store's temple front, the one
 * unmistakable thing on this block. Redrawn 2026-10-25 (owner: "this distinctive green one with white columns", from
 * Apple's 3-D view of the block) — the first version drew a red-brick hotel, from a Mapillary frame (pB0) that showed
 * its neighbour with the fire escapes instead.
 *
 * Over a dark shopfront, TWO COLOSSAL CORINTHIAN COLUMNS stand proud of a white stone front, a fifth of the way in from
 * each side, and between them the whole height of the front is ONE GREAT WINDOW: green-tinted glass in a dark green grid
 * of mullions and transoms, five panes across and six up. Over it a deep plain entablature lettered FURNITURE, a heavy
 * cornice, and a plain parapet. The sides and back are party walls and a plain white box.
 *
 * The manifest gives `front: 313` (Market's side of the block, from the footprint), so local −z faces Market — not
 * `'street'`, which found Stevenson Street: the building runs through the block, and its back is as near a street.
 */
export function market1017(out: MeshBuilder, fit: Fit): void {
  const STONE: Rgb = [0.9, 0.89, 0.85]
  const SHADE: Rgb = [0.78, 0.77, 0.73]
  const GLASS: Rgb = [0.42, 0.55, 0.49]
  const FRAME: Rgb = [0.13, 0.27, 0.2]
  const G = Math.max(0, fit.grade ?? 0)
  const H = 27
  const BASE = 4.6, WIN0 = 5.6, WIN1 = 20.2, ENT0 = 20.6, ENT1 = 23.2
  tower(out, fit, {
    height: H,
    base: { height: BASE, face: { kind: 'curtain', wall: [0.16, 0.16, 0.17], glass: [0.15, 0.17, 0.19], pitch: 3, floor: BASE, material: 'metal' } },
    tiers: [{ to: 1, face: { kind: 'blank', wall: STONE, material: 'ashlar' } }],
    cornices: [{ at: ENT1, depth: 1.2, height: 0.7, colour: STONE }],
    crown: { kind: 'parapet', height: 1.4, colour: STONE, material: 'ashlar' },
  })
  const ring = towerRing(fit)
  // the street front: the longest edge facing most nearly −z
  let k = 0, best = -Infinity
  for (let i = 0; i < ring.length; i++) {
    const e = edgeAt(ring, i)
    const d = -e.nz * Math.min(1, e.L / 8)
    if (d > best) { best = d; k = i }
  }
  const e = edgeAt(ring, k)
  const at = (u: number, out_: number): { x: number; z: number } => ({ x: e.a.x + e.tx * u + e.nx * out_, z: e.a.z + e.tz * u + e.nz * out_ })
  const L = e.L
  // the great window between the columns: the glass, then its grid standing on it
  const w0 = 0.29 * L, w1 = 0.71 * L, wm = (w0 + w1) / 2, ww = w1 - w0
  {
    const c = at(wm, 0.06)
    boxAlong(out, c.x, G + (WIN0 + WIN1) / 2, c.z, ww / 2, (WIN1 - WIN0) / 2, 0.05, e.heading, GLASS, surfaceTag('glass'))
  }
  const fr = surfaceTag('metal')
  for (let i = 0; i <= 5; i++) {
    const c = at(w0 + (i / 5) * ww, 0.16)
    boxAlong(out, c.x, G + (WIN0 + WIN1) / 2, c.z, i === 0 || i === 5 ? 0.22 : 0.12, (WIN1 - WIN0) / 2, 0.08, e.heading, FRAME, fr)
  }
  for (let j = 0; j <= 6; j++) {
    const c = at(wm, 0.17)
    boxAlong(out, c.x, G + WIN0 + (j / 6) * (WIN1 - WIN0), c.z, ww / 2, j === 0 || j === 6 ? 0.22 : 0.11, 0.08, e.heading, FRAME, fr)
  }
  // a sill under it, standing out
  { const c = at(wm, 0.35); boxAlong(out, c.x, G + WIN0 - 0.35, c.z, ww / 2 + 0.6, 0.25, 0.35, e.heading, SHADE, surfaceTag('ashlar')) }
  // the two colossal columns, a fifth of the way in from each side (`colonnade` sets n columns at (i + ½)/n of its run,
  // so a run from −0.1 L to 1.1 L puts two at 0.2 L and 0.8 L); their own entablature is drawn below, across the front
  colonnade(out, at(-0.1 * L, 0), at(1.1 * L, 0), G + BASE + 0.2, ENT0 - BASE - 0.4, 2,
    { order: 'corinthian', colour: STONE, material: 'ashlar', radius: Math.min(1.05, L * 0.065), out: 1.1, entablature: 0.01, flutes: true })
  // the entablature across the whole front, lettered FURNITURE
  { const c = at(L / 2, 0.45); boxAlong(out, c.x, G + (ENT0 + ENT1) / 2, c.z, L / 2, (ENT1 - ENT0) / 2, 0.45, e.heading, STONE, surfaceTag('ashlar')) }
  { const c = at(L / 2, 0.92); signText(out, 'FURNITURE', c.x, G + ENT0 + (ENT1 - ENT0) * 0.4, c.z, 1.0, [0.36, 0.36, 0.34], { heading: e.heading }) }
}

/** 1075 MARKET: an eight-storey grey panel-clad loft (Mapillary pB1): a grey shaft over a shopfront, its top two floors set back behind a parapet. */
export function market1075(out: MeshBuilder, fit: Fit): void {
  const GREY: Rgb = [0.55, 0.57, 0.58]
  const GLASS: Rgb = [0.2, 0.25, 0.3]
  tower(out, fit, {
    height: 29,
    base: { height: 4, face: { kind: 'curtain', wall: [0.2, 0.2, 0.2], glass: [0.16, 0.18, 0.2], pitch: 3, floor: 4, material: 'metal' } },
    tiers: [
      { to: 0.78, face: { kind: 'bands', wall: GREY, glass: GLASS, floor: 3.6, solid: 0.5, material: 'metal' } },
      { to: 1, inset: 2.5, face: { kind: 'bands', wall: GREY, glass: GLASS, floor: 3.6, solid: 0.5, material: 'metal' } },
    ],
    crown: { kind: 'parapet', height: 1, colour: GREY, material: 'metal' },
  })
}

/** ISLAMIC SOCIETY OF SAN FRANCISCO, 20 Jones at Market: a three-storey cream-tan block on a shopfront base, dark window openings between tan piers, a deep cornice and parapet (Mapillary pC1). No dome, no minaret, no signs. */
export function islamicSociety20Jones(out: MeshBuilder, fit: Fit): void {
  const TAN: Rgb = [0.8, 0.76, 0.66]
  tower(out, fit, {
    height: 13,
    base: { height: 4, face: { kind: 'curtain', wall: [0.2, 0.2, 0.2], glass: [0.16, 0.18, 0.2], pitch: 3, floor: 4, material: 'metal' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: TAN, glass: [0.2, 0.22, 0.25], floor: 4.5, pitch: 3.6, solid: 0.6, material: 'stucco' } }],
    cornices: [{ at: 12, depth: 0.6, colour: TAN }],
    crown: { kind: 'parapet', height: 1, colour: TAN, material: 'stucco' },
  })
}

/** THREE TRANSAMERICA CENTER, Mark Twain Place: a nine-storey cream-white office block on a tan base, tall punched bays, a plain parapet (Mapillary frame a0, the Sansome side). */
export function threeTransamericaCenter(out: MeshBuilder, fit: Fit): void {
  const CREAM: Rgb = [0.9, 0.88, 0.82]
  const TAN: Rgb = [0.74, 0.68, 0.56]
  tower(out, fit, {
    height: 32,
    base: { height: 4, face: { kind: 'punched', wall: TAN, glass: [0.2, 0.24, 0.26], floor: 4, pitch: 3.6, solid: 0.5, material: 'stucco' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: CREAM, glass: [0.2, 0.24, 0.28], floor: 3.5, pitch: 3.2, solid: 0.55, material: 'concrete' } }],
    crown: { kind: 'parapet', height: 1.2, colour: CREAM, material: 'concrete' },
  })
}

/** 500 SANSOME STREET: an eight-storey cream-stone office block on a tan ground floor with glazed bays, pale pilasters and a moulded cornice (Mapillary frame b0). */
export function sansome500(out: MeshBuilder, fit: Fit): void {
  const STONE: Rgb = [0.85, 0.82, 0.74]
  const TAN: Rgb = [0.72, 0.66, 0.54]
  tower(out, fit, {
    height: 34,
    base: { height: 5, face: { kind: 'curtain', wall: TAN, glass: [0.16, 0.2, 0.22], pitch: 3, floor: 5, material: 'stucco' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: STONE, glass: [0.2, 0.22, 0.25], floor: 4.2, pitch: 3.6, solid: 0.6, material: 'stucco' } }],
    cornices: [{ at: 0.92, depth: 0.6, colour: STONE }],
    crown: { kind: 'parapet', height: 1.2, colour: STONE, material: 'stucco' },
  })
}

// ---------------------------------------------------------------- Jackson Square, the Hotaling Building, 451 Jackson (1866; way/35537115)
/**
 * Mapillary frames a0, a1 on Jackson: a cream-painted Italianate block of three storeys, tall windows in
 * painted stucco under a moulded cornice, and a dark iron-fronted ground floor. No shop signs.
 */
function hotalingBuilding(out: MeshBuilder, fit: Fit): void {
  const CREAM: Rgb = [0.91, 0.88, 0.8]
  const IRON: Rgb = [0.18, 0.18, 0.19]
  tower(out, fit, {
    height: 14,
    base: { height: 4.2, face: { kind: 'curtain', wall: IRON, glass: [0.2, 0.24, 0.26], pitch: 2.6, floor: 4.2, material: 'metal' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: CREAM, glass: [0.22, 0.24, 0.26], floor: 3.3, pitch: 2.8, solid: 0.5, material: 'stucco' } }],
    cornices: [{ at: 0.92, depth: 0.5, colour: CREAM }],
    crown: { kind: 'parapet', height: 1.0, colour: CREAM, material: 'stucco' },
  })
}

// ---------------------------------------------------------------- Jackson Square, two-storey stucco near Columbus (way/256072726)
/**
 * Mapillary frames b0, b1 near Columbus Avenue and Ils Lane: a two-storey buff painted stucco block, tall punched
 * windows over a plain glazed ground floor, a cornice band and a flat parapet. No shop signs.
 */
function jacksonSquare256072726(out: MeshBuilder, fit: Fit): void {
  const BUFF: Rgb = [0.8, 0.72, 0.6]
  tower(out, fit, {
    height: 9,
    base: { height: 3.2, face: { kind: 'curtain', wall: [0.5, 0.46, 0.4], glass: [0.2, 0.23, 0.25], pitch: 3, floor: 3.2, material: 'stucco' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: BUFF, glass: [0.2, 0.23, 0.26], floor: 2.9, pitch: 2.6, solid: 0.55, material: 'stucco' } }],
    cornices: [{ at: 0.66, depth: 0.4, colour: BUFF }],
    crown: { kind: 'parapet', height: 0.8, colour: BUFF, material: 'stucco' },
  })
}

// ---------------------------------------------------------------- Jackson Square, one-storey brick, Montgomery side (way/930905519)
/**
 * Mapillary frames c0, c1 between Hotaling Place and Montgomery Street: a tall dark glazed shopfront on iron piers,
 * a plain red brick wall above and a parapet. No shop signs.
 */
function jacksonSquare930905519(out: MeshBuilder, fit: Fit): void {
  const RED: Rgb = [0.6, 0.34, 0.3]
  tower(out, fit, {
    height: 10,
    base: { height: 6, face: { kind: 'curtain', wall: [0.2, 0.2, 0.2], glass: [0.2, 0.24, 0.26], pitch: 2.6, floor: 6, material: 'metal' } },
    tiers: [{ to: 1, face: { kind: 'blank', wall: RED, material: 'brick' } }],
    cornices: [{ at: 0.6, depth: 0.4, colour: RED }],
    crown: { kind: 'parapet', height: 1.2, colour: RED, material: 'brick' },
  })
}

/** Sacramento and Front Streets, OSM way/1279452198 (9 levels): a red-brick loft-office block, rust brick with multi-pane sashes in bowed bays, a green-tinted glazed ground floor over a stone base (Mapillary frames a0, a1). */
export function fidi1279452198(out: MeshBuilder, fit: Fit): void {
  const BRICK: Rgb = [0.62, 0.33, 0.24]
  tower(out, fit, {
    height: 32,
    base: { height: 4.5, face: { kind: 'curtain', wall: [0.5, 0.44, 0.38], glass: [0.2, 0.3, 0.26], pitch: 3, floor: 4.5, material: 'ashlar' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: BRICK, glass: [0.22, 0.28, 0.3], pitch: 3.2, floor: 3.5, solid: 0.5, material: 'brick' } }],
    cornices: [{ at: 0.3, depth: 0.35, colour: [0.56, 0.4, 0.32] }],
    crown: { kind: 'parapet', height: 1.2, colour: [0.5, 0.3, 0.22], material: 'brick' },
  })
}

/** 617-633 Battery Street, OSM way/256087377 (25 m): a brick warehouse-loft with arched upper windows, a black steel-framed glazed ground floor (Mapillary frames b0, b1). */
export function battery617(out: MeshBuilder, fit: Fit): void {
  const BRICK: Rgb = [0.55, 0.36, 0.27]
  tower(out, fit, {
    height: 25,
    base: { height: 4.5, face: { kind: 'curtain', wall: [0.18, 0.18, 0.18], glass: [0.14, 0.16, 0.18], pitch: 3.2, floor: 4.5, material: 'metal' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: BRICK, glass: [0.2, 0.24, 0.28], pitch: 3.6, floor: 3.6, solid: 0.6, arched: true, material: 'brick' } }],
    cornices: [{ at: 0.92, depth: 0.25, colour: [0.5, 0.42, 0.36] }],
    crown: { kind: 'parapet', height: 0.9, colour: [0.5, 0.36, 0.28], material: 'brick' },
  })
}

/** Pine and Battery Streets, OSM way/256067720 (29 m): a taupe granite office block on a dark glazed ground floor, with a recessed glass band over the upper floors (Mapillary frames c0, c1). */
export function fidi256067720(out: MeshBuilder, fit: Fit): void {
  const STONE: Rgb = [0.38, 0.36, 0.34]
  tower(out, fit, {
    height: 29,
    base: { height: 4.5, face: { kind: 'curtain', wall: [0.3, 0.29, 0.28], glass: [0.16, 0.18, 0.2], pitch: 3, floor: 4.5, material: 'granite' } },
    tiers: [{ to: 1, face: { kind: 'bands', wall: STONE, glass: [0.18, 0.2, 0.22], floor: 3.6, solid: 0.6, material: 'granite' } }],
    cornices: [{ at: 0.9, depth: 0.6, colour: STONE }],
    crown: { kind: 'parapet', height: 1.0, colour: STONE, material: 'granite' },
  })
}

/** 550 California, the Sacramento Street wing (way/256067724): eleven storeys, two of dark granite over nine of taupe-clad ribbon windows with cross-braces, under a plain parapet. Mapillary pa0 and pa1. */
export function california550Sacramento(out: MeshBuilder, fit: Fit): void {
  const TAUPE: Rgb = [0.74, 0.65, 0.58]
  const GRANITE: Rgb = [0.28, 0.28, 0.3]
  tower(out, fit, {
    height: 36,
    base: { height: 7.5, face: { kind: 'punched', wall: GRANITE, glass: [0.18, 0.22, 0.26], pitch: 6, floor: 3.75, solid: 0.45, material: 'granite' } },
    tiers: [{ to: 1, face: { kind: 'bands', wall: TAUPE, glass: [0.3, 0.34, 0.38], floor: 3, solid: 0.55, material: 'concrete' } }],
    crown: { kind: 'parapet', height: 1, colour: TAUPE, material: 'concrete' },
  })
}

/** Hind Building, 220–230 California Street (way/260286438): six storeys of cream rusticated ground floor and entablature over cream stone and buff brick upper floors, architrave and pedimented heads. Mapillary pb1 (pb0 shows the Tadich Grill neighbour at 240). */
export function hindBuilding(out: MeshBuilder, fit: Fit): void {
  const CREAM: Rgb = [0.86, 0.8, 0.68]
  const BUFF: Rgb = [0.7, 0.58, 0.44]
  tower(out, fit, {
    height: 26,
    base: { height: 5.5, face: { kind: 'punched', wall: CREAM, glass: [0.22, 0.3, 0.28], pitch: 4, floor: 5.5, solid: 0.3, material: 'ashlar' } },
    tiers: [
      { to: 13, face: { kind: 'punched', wall: CREAM, glass: [0.2, 0.24, 0.26], pitch: 3.2, floor: 3.75, solid: 0.5, material: 'ashlar' } },
      { to: 1, face: { kind: 'punched', wall: BUFF, glass: [0.2, 0.24, 0.26], pitch: 3.2, floor: 3.9, solid: 0.5, material: 'brick' } },
    ],
    cornices: [{ at: 5.8, depth: 0.6, height: 0.8, colour: CREAM }, { at: 13, depth: 0.4, height: 0.5, colour: CREAM }],
    crown: { kind: 'parapet', height: 1, colour: CREAM, material: 'ashlar' },
  })
}

// ---------------------------------------------------------------- First National Bank of Northern California (way/32946665)
/**
 * Mapillary frame pa0 (Post Street side): an eleven-storey cream stone bank block. A rusticated ground storey, two tall
 * arched windows storeys between pilasters (the giant order), a deep dentilled cornice, a shaft of small punched
 * windows between pilasters, a second cornice and a balustraded attic. Recognisable, not accurate.
 */
function firstNationalBankNorCal(out: MeshBuilder, fit: Fit): void {
  const STONE: Rgb = [0.84, 0.8, 0.7]
  const DARK: Rgb = [0.2, 0.22, 0.24]
  const hall: Face = { kind: 'punched', wall: STONE, glass: DARK, floor: 7, pitch: 4.6, solid: 0.45, arched: true, material: 'ashlar' }
  const shaft: Face = { kind: 'punched', wall: STONE, glass: DARK, floor: 3.4, pitch: 3.4, solid: 0.5, material: 'ashlar' }
  tower(out, fit, {
    height: 43,
    base: { height: 4.5, face: { kind: 'punched', wall: [0.78, 0.74, 0.65], glass: DARK, floor: 4.5, pitch: 5, solid: 0.4, material: 'granite' } },
    cornices: [{ at: 5, depth: 0.5, height: 0.6, colour: STONE }],
    tiers: [
      { to: 15, face: hall, cornice: { depth: 1.0, height: 1.0, colour: STONE } },
      { to: 38.5, face: shaft, cornice: { depth: 1.2, height: 1.2, colour: STONE } },
      { to: 1.0, face: { kind: 'blank', wall: STONE, material: 'ashlar' }, inset: 0.4 },
    ],
    roof: [0.55, 0.53, 0.5],
    crown: { kind: 'balustrade', height: 1.0, colour: STONE, material: 'ashlar', pier: true },
  })
  const ring = towerRing(fit)
  for (let i = 0; i < ring.length; i++) {
    const e = edgeAt(ring, i)
    if (e.L < 8) continue
    colonnade(out, e.a, e.b, 4.5, 14.5, Math.max(2, Math.round(e.L / 4.6)), { order: 'ionic', colour: STONE, material: 'ashlar', radius: 0.4, out: 0.3, entablature: 0.01, tier: 'far' })
  }
}

/**
 * 570 MARKET STREET (way/148712640): a nine-storey buff masonry block of the 1900s on the north side of Market, over
 * a dark two-storey shopfront base. Mapillary frames p0 and p1 show the punched windows in rows above a glazed
 * ground floor and mezzanine, a moulded cornice and a parapet at the top.
 */
export function market570(out: MeshBuilder, fit: Fit): void {
  const BUFF: Rgb = [0.8, 0.72, 0.6]
  tower(out, fit, {
    height: 31,
    base: { height: 6, face: { kind: 'curtain', wall: [0.26, 0.24, 0.22], glass: [0.2, 0.24, 0.28], pitch: 3, floor: 6, material: 'granite' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: BUFF, glass: [0.24, 0.28, 0.32], pitch: 3.2, floor: 3.4, solid: 0.5, material: 'terracotta' }, cornice: { depth: 0.6, height: 0.8, colour: BUFF } }],
    crown: { kind: 'parapet', height: 1.4, colour: BUFF, material: 'terracotta' },
  })
}

/**
 * CITIBANK, MARKET AT DRUMM (way/436484074): a four-storey stone-faced bank block on a dark glazed base, no sign or
 * logo. The Mapillary frames b0 and b1 show glass towers beside it rather than the block itself, so the storey
 * count and height are OSM's.
 */
export function citibankDrumm(out: MeshBuilder, fit: Fit): void {
  const CREAM: Rgb = [0.84, 0.8, 0.72]
  tower(out, fit, {
    height: 15,
    base: { height: 4.5, face: { kind: 'curtain', wall: [0.22, 0.22, 0.24], glass: [0.18, 0.22, 0.26], pitch: 3, floor: 4.5, material: 'metal' } },
    tiers: [{ to: 1, face: { kind: 'bands', wall: CREAM, glass: [0.2, 0.25, 0.3], floor: 3.6, solid: 0.6, material: 'ashlar' } }],
    crown: { kind: 'parapet', height: 1, colour: CREAM, material: 'ashlar' },
  })
}

/** T3 batch 1, SE side of Market at 6th: the corner block (1001 Market), the terracotta front (1005), the dark modernised front (1009). */
export function market1001Corner(out: MeshBuilder, fit: Fit): void {
  const STONE: Rgb = [0.5, 0.56, 0.6]
  tower(out, fit, {
    height: 19,
    base: { height: 4.6, face: { kind: 'curtain', wall: [0.1, 0.12, 0.16], glass: [0.16, 0.18, 0.2], pitch: 3, floor: 4.6, material: 'metal' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: STONE, glass: [0.2, 0.24, 0.28], pitch: 2.6, floor: 3.6, solid: 0.45, material: 'ashlar' }, cornice: { depth: 1.1, height: 1.0, colour: [0.62, 0.66, 0.68] } }],
    crown: { kind: 'parapet', height: 1.2, colour: [0.55, 0.6, 0.63], material: 'ashlar' },
  })
}

export function market1005(out: MeshBuilder, fit: Fit): void {
  const TERRA: Rgb = [0.62, 0.38, 0.25]
  tower(out, fit, {
    height: 14,
    base: { height: 4.2, face: { kind: 'blank', wall: [0.22, 0.14, 0.12] }, canopy: { depth: 1.2, colour: [0.72, 0.1, 0.1] } },
    tiers: [{ to: 1, face: { kind: 'bays', wall: TERRA, glass: [0.3, 0.24, 0.18], floor: 3.4, material: 'terracotta' } }],
    crown: { kind: 'parapet', height: 1.2, colour: [0.7, 0.45, 0.3], material: 'terracotta' },
  })
}

export function market1009(out: MeshBuilder, fit: Fit): void {
  const DARK: Rgb = [0.3, 0.31, 0.33]
  tower(out, fit, {
    height: 11,
    base: { height: 4.5, face: { kind: 'curtain', wall: [0.14, 0.15, 0.16], glass: [0.2, 0.24, 0.28], pitch: 3.2, floor: 4.5, material: 'glass' } },
    tiers: [{ to: 1, face: { kind: 'bands', wall: DARK, glass: [0.22, 0.26, 0.3], floor: 3.2, solid: 0.8, material: 'metal' } }],
    crown: { kind: 'parapet', height: 1.2, colour: DARK, material: 'metal' },
  })
}

/** T3 batch 2, SE side of Market between 6th and 7th: the narrow cream front (1023), and the International Art Museum of America (1025 and 1035, one facade in the photos: one tall arched window per bay over both upper storeys). */
export function market1023(out: MeshBuilder, fit: Fit): void {
  const CREAM: Rgb = [0.9, 0.87, 0.78]
  tower(out, fit, {
    height: 13,
    base: { height: 4.2, face: { kind: 'curtain', wall: [0.16, 0.14, 0.13], glass: [0.2, 0.22, 0.24], pitch: 3, floor: 4.2, material: 'metal' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: CREAM, glass: [0.2, 0.22, 0.24], pitch: 2.8, floor: 3.4, solid: 0.5, material: 'terracotta' }, cornice: { depth: 0.9, height: 0.8, colour: [0.82, 0.76, 0.62] } }],
    crown: { kind: 'parapet', height: 1, colour: CREAM, material: 'terracotta' },
  })
}

export function artMuseumAmerica1025Market(out: MeshBuilder, fit: Fit): void {
  const CREAM: Rgb = [0.92, 0.9, 0.82]
  tower(out, fit, {
    height: 11,
    base: { height: 4.2, face: { kind: 'curtain', wall: [0.16, 0.14, 0.13], glass: [0.18, 0.2, 0.22], pitch: 3.2, floor: 4.2, material: 'metal' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: CREAM, glass: [0.2, 0.22, 0.24], pitch: 3.8, floor: 6.8, solid: 0.42, arched: true, material: 'terracotta' }, cornice: { depth: 1, height: 0.9, colour: [0.84, 0.78, 0.66] } }],
    crown: { kind: 'balustrade', height: 1.1, colour: CREAM, material: 'terracotta', pier: true },
  })
}

/** T3 batch 3, Sacramento and Leidesdorff: the PG&E Station J (1925), a cream stucco box with a grey base and a plain parapet (way/165480949; fronts Leidesdorff, its west face). */
export function stationJSacramento(out: MeshBuilder, fit: Fit): void {
  const CREAM: Rgb = [0.86, 0.84, 0.76]
  tower(out, fit, {
    height: 12,
    base: { height: 3, face: { kind: 'blank', wall: [0.56, 0.56, 0.52], material: 'stucco' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: CREAM, glass: [0.22, 0.24, 0.26], pitch: 4.5, floor: 4.5, solid: 0.78, material: 'stucco' }, cornice: { depth: 0.5, height: 0.6, colour: [0.9, 0.88, 0.8] } }],
    crown: { kind: 'parapet', height: 0.9, colour: CREAM, material: 'stucco' },
  })
}

/** T3 batch 3, 558 Sacramento (1907): the Wayfare Tavern, a black-painted shopfront under a striped awning, four storeys of tan brick above (way/308339610; fronts Sacramento, its south face). */
export function wayfareTavern558Sacramento(out: MeshBuilder, fit: Fit): void {
  const TAN: Rgb = [0.72, 0.58, 0.42]
  tower(out, fit, {
    height: 16,
    base: { height: 4.2, face: { kind: 'curtain', wall: [0.06, 0.06, 0.06], glass: [0.16, 0.18, 0.2], pitch: 3, floor: 4.2, material: 'metal' }, canopy: { depth: 1.6, colour: [0.1, 0.1, 0.1] } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: TAN, glass: [0.2, 0.22, 0.24], pitch: 2.6, floor: 3.4, solid: 0.5, material: 'brick' }, cornice: { depth: 0.6, height: 0.6, colour: [0.78, 0.7, 0.58] } }],
    crown: { kind: 'parapet', height: 1, colour: TAN, material: 'brick' },
  })
}

/** T3 batch 3, 215 Leidesdorff (1909): a tan brick front with an arched shopfront at the foot, and a black-framed glass box on the roof (way/256067736; fronts Leidesdorff, its east face). */
export function leidesdorff215(out: MeshBuilder, fit: Fit): void {
  const TAN: Rgb = [0.78, 0.64, 0.46]
  tower(out, fit, {
    height: 14,
    tiers: [
      { to: 0.66, face: { kind: 'punched', wall: TAN, glass: [0.2, 0.22, 0.24], pitch: 2.6, floor: 3.4, solid: 0.5, arched: true, material: 'brick' }, cornice: { depth: 0.5, height: 0.5, colour: [0.82, 0.74, 0.6] } },
      { to: 1, inset: 1.2, face: { kind: 'curtain', wall: [0.12, 0.12, 0.12], glass: [0.2, 0.24, 0.28], pitch: 2, floor: 2.8, material: 'glass' } },
    ],
    crown: { kind: 'parapet', height: 0.5, colour: [0.12, 0.12, 0.12], material: 'metal' },
  })
}

/** T3 batch 4, Sacramento at Montgomery (1918): the Anglo Bank, a stone classical block with a granite base, Corinthian-capped windows, a deep dentilled cornice and a balustrade (way/942303806; photos way-942303806-01, -03; the grand face is the Montgomery face, its west side). */
export function angloBankSacramento(out: MeshBuilder, fit: Fit): void {
  const STONE: Rgb = [0.78, 0.74, 0.66]
  tower(out, fit, {
    height: 16,
    base: { height: 3.6, face: { kind: 'blank', wall: [0.3, 0.29, 0.27], material: 'granite' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: STONE, glass: [0.2, 0.22, 0.24], pitch: 3, floor: 3.8, solid: 0.45, head: 'architrave', material: 'ashlar' }, cornice: { depth: 1, height: 1, colour: [0.84, 0.8, 0.72] } }],
    crown: { kind: 'balustrade', height: 1.1, colour: STONE, material: 'ashlar', pier: true },
  })
}

/** T3 batch 4, Station J annex (PG&E, 1925?): a white stucco front of pilasters and tall windows over a dark base, faces east onto Leidesdorff (way/942303807; photo way-942303807-01). */
export function stationJAnnex(out: MeshBuilder, fit: Fit): void {
  const WHITE: Rgb = [0.9, 0.89, 0.84]
  tower(out, fit, {
    height: 16,
    base: { height: 3.6, face: { kind: 'blank', wall: [0.14, 0.14, 0.14], material: 'stucco' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: WHITE, glass: [0.2, 0.22, 0.24], pitch: 3.2, floor: 4, solid: 0.5, head: 'architrave', material: 'stucco' }, cornice: { depth: 0.7, height: 0.8, colour: [0.92, 0.9, 0.86] } }],
    crown: { kind: 'parapet', height: 0.8, colour: WHITE, material: 'stucco' },
  })
}

/** T3 batch 4, the unnamed outline at Sacramento and Commercial (1920): a two-storey white stucco front with a dentilled cornice and a corner shopfront (way/942303804; photos way-942303804-01, -02). */
export function sacramento942303804(out: MeshBuilder, fit: Fit): void {
  const WHITE: Rgb = [0.88, 0.87, 0.82]
  tower(out, fit, {
    height: 12,
    base: { height: 3.2, face: { kind: 'curtain', wall: [0.08, 0.08, 0.08], glass: [0.18, 0.2, 0.22], pitch: 2.6, floor: 3.2, material: 'metal' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: WHITE, glass: [0.2, 0.22, 0.24], pitch: 2.6, floor: 4, solid: 0.5, material: 'stucco' }, cornice: { depth: 0.8, height: 0.8, colour: [0.92, 0.9, 0.86] } }],
    crown: { kind: 'parapet', height: 0.8, colour: WHITE, material: 'stucco' },
  })
}

/** T3 batch 5, Belden Place (27 m, corner): a white stucco block of seven floors over a dark shopfront under a blue awning (way/148741780; photos way-148741780-01, -03). Front bearing uncertain: the photos are taken from the north and north-east. */
export function belden148741780(out: MeshBuilder, fit: Fit): void {
  const WHITE: Rgb = [0.92, 0.91, 0.88]
  tower(out, fit, {
    height: 27,
    base: { height: 4.5, face: { kind: 'blank', wall: [0.12, 0.13, 0.15], material: 'concrete' }, canopy: { depth: 1.6, colour: [0.1, 0.42, 0.55] } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: WHITE, glass: [0.2, 0.24, 0.28], pitch: 4, floor: 3.4, solid: 0.5, material: 'stucco' }, cornice: { depth: 0.6, height: 0.6, colour: [0.9, 0.88, 0.82] } }],
    crown: { kind: 'parapet', height: 1, colour: WHITE, material: 'stucco' },
  })
}

export function kearny260280334(out: MeshBuilder, fit: Fit): void {
  const TAN: Rgb = [0.8, 0.7, 0.52]
  tower(out, fit, {
    height: 34,
    base: { height: 4.5, face: { kind: 'blank', wall: [0.14, 0.13, 0.12], material: 'concrete' }, canopy: { depth: 1.4, colour: [0.12, 0.12, 0.12] } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: TAN, glass: [0.2, 0.22, 0.24], pitch: 3, floor: 3.6, solid: 0.45, material: 'ashlar' }, cornice: { depth: 0.7, height: 0.7, colour: [0.86, 0.8, 0.66] } }],
    cornices: [{ at: 0.33, depth: 0.4, height: 0.4, colour: [0.86, 0.8, 0.66] }],
    crown: { kind: 'parapet', height: 1.4, colour: TAN, material: 'ashlar' },
  })
}

export function fidi151195278(out: MeshBuilder, fit: Fit): void {
  const CREAM: Rgb = [0.84, 0.82, 0.76]
  tower(out, fit, {
    height: 30,
    base: { height: 4.5, face: { kind: 'blank', wall: [0.16, 0.14, 0.12], material: 'concrete' }, canopy: { depth: 1.2, colour: [0.14, 0.13, 0.12] } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: CREAM, glass: [0.22, 0.24, 0.26], pitch: 3.2, floor: 3.4, solid: 0.5, material: 'ashlar' }, cornice: { depth: 1.2, height: 1.2, colour: [0.9, 0.88, 0.82] } }],
    crown: { kind: 'parapet', height: 1.6, colour: CREAM, material: 'ashlar' },
  })
}

export function kearny474354577(out: MeshBuilder, fit: Fit): void {
  const BEIGE: Rgb = [0.68, 0.65, 0.6]
  tower(out, fit, {
    height: 13,
    base: { height: 4, face: { kind: 'curtain', wall: [0.2, 0.2, 0.2], glass: [0.3, 0.34, 0.36], pitch: 3, floor: 4, material: 'metal' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: BEIGE, glass: [0.2, 0.24, 0.28], pitch: 3, floor: 3.2, solid: 0.5, material: 'stucco' }, cornice: { depth: 0.4, height: 0.4, colour: [0.74, 0.71, 0.66] } }],
    crown: { kind: 'parapet', height: 0.8, colour: BEIGE, material: 'stucco' },
  })
}

/** Bush Street at Kearny, the south side: a tan/beige stone office block of six storeys over a brown granite base
 *  with a glass-roofed garage entrance (photos way-151195270-02 and -03; the Bush front is the one drawn). */
export function bush151195270(out: MeshBuilder, fit: Fit): void {
  const TAN: Rgb = [0.84, 0.78, 0.66]
  tower(out, fit, {
    height: 21,
    base: { height: 4.5, face: { kind: 'blank', wall: [0.36, 0.26, 0.2], material: 'granite' }, canopy: { depth: 1.4, colour: [0.22, 0.2, 0.18] } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: TAN, glass: [0.22, 0.25, 0.28], pitch: 3, floor: 3.4, solid: 0.45, material: 'ashlar' }, cornice: { depth: 0.6, height: 0.6, colour: [0.9, 0.85, 0.74] } }],
    crown: { kind: 'parapet', height: 1.2, colour: TAN, material: 'ashlar' },
  })
}

/** 260 Kearny Street: a narrow cream painted-brick block of about five storeys, a bracketed cornice, fire escapes
 *  and a dark ground-floor shopfront (photos way-151195275-01 and -02). */
export function kearny260(out: MeshBuilder, fit: Fit): void {
  const CREAM: Rgb = [0.86, 0.82, 0.72]
  tower(out, fit, {
    height: 17,
    base: { height: 4, face: { kind: 'blank', wall: [0.16, 0.14, 0.13], material: 'concrete' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: CREAM, glass: [0.2, 0.22, 0.24], pitch: 2.8, floor: 3.2, solid: 0.42, material: 'stucco' }, cornice: { depth: 0.6, height: 0.7, colour: [0.9, 0.86, 0.76] } }],
    crown: { kind: 'parapet', height: 1, colour: CREAM, material: 'stucco' },
  })
}

/** T3 batch 8, Buich Building, 240-242 California (11 m, three storeys): a dark green-tiled shopfront (Tadich Grill) under a green bracketed cornice; photo way-260286448-01. */
export function buichBuilding240California(out: MeshBuilder, fit: Fit): void {
  const GREEN: Rgb = [0.16, 0.3, 0.26]
  tower(out, fit, {
    height: 11,
    base: { height: 4, face: { kind: 'blank', wall: [0.12, 0.2, 0.18], material: 'tile' }, canopy: { depth: 1.2, colour: [0.1, 0.16, 0.14] } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: [0.42, 0.36, 0.28], glass: [0.2, 0.24, 0.26], pitch: 2.8, floor: 3.4, solid: 0.4, material: 'brick' }, cornice: { depth: 0.9, height: 0.9, colour: GREEN } }],
    crown: { kind: 'parapet', height: 1, colour: GREEN, material: 'tile' },
  })
}

/** T3 batch 8, 244-256 California (32 m, about eight storeys): a tan brick office block over a cream stone ground floor with an arched entrance and a bracketed cornice; photos way-260286441-01 and -02. */
export function california244(out: MeshBuilder, fit: Fit): void {
  const TAN: Rgb = [0.78, 0.62, 0.42]
  tower(out, fit, {
    height: 32,
    base: { height: 4.5, face: { kind: 'blank', wall: [0.9, 0.86, 0.76], material: 'ashlar' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: TAN, glass: [0.22, 0.24, 0.26], pitch: 3, floor: 3.6, solid: 0.5, material: 'brick' }, cornice: { depth: 0.9, height: 0.9, colour: [0.9, 0.86, 0.76] } }],
    cornices: [{ at: 4.5, depth: 0.7, height: 0.6, colour: [0.9, 0.86, 0.76] }],
    crown: { kind: 'parapet', height: 1.8, colour: TAN, material: 'brick' },
  })
}

/** T3 batch 8, 200-210 California (18 m, corner of Front Street): a buff limestone office block of five storeys with a bay on the corner; photo way-260286442-01. */
export function california200(out: MeshBuilder, fit: Fit): void {
  const LIMESTONE: Rgb = [0.84, 0.8, 0.7]
  tower(out, fit, {
    height: 18,
    base: { height: 4, face: { kind: 'curtain', wall: [0.2, 0.2, 0.2], glass: [0.3, 0.34, 0.36], pitch: 3, floor: 4, material: 'metal' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: LIMESTONE, glass: [0.22, 0.24, 0.26], pitch: 3, floor: 3.4, solid: 0.45, material: 'ashlar' }, cornice: { depth: 0.6, height: 0.6, colour: LIMESTONE } }],
    crown: { kind: 'parapet', height: 1.2, colour: LIMESTONE, material: 'ashlar' },
  })
}

/** T3 batch 9, Clayton (way 260924232, 12 m, three storeys, 1906): pale blue-grey stucco with arched windows over a dark shopfront; faces Commercial Street; photos way-260924232-01 and -02. */
export function claytonClay(out: MeshBuilder, fit: Fit): void {
  const STUCCO: Rgb = [0.66, 0.73, 0.76]
  tower(out, fit, {
    height: 12,
    base: { height: 4, face: { kind: 'blank', wall: [0.16, 0.2, 0.22], material: 'tile' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: STUCCO, glass: [0.2, 0.22, 0.25], pitch: 2.8, floor: 2.7, solid: 0.42, arched: true, material: 'stucco' }, cornice: { depth: 0.8, height: 0.8, colour: [0.42, 0.5, 0.52] } }],
    crown: { kind: 'parapet', height: 1, colour: STUCCO, material: 'stucco' },
  })
}

/** T3 batch 9, unnamed block (way 260924222, 15 m, 1910): a dark red brick block of four storeys over a dark shopfront with a black canopy; faces Commercial Street. Photo way-260924222-01 only, unsure of the upper floors. */
export function clay260924222(out: MeshBuilder, fit: Fit): void {
  const BRICK: Rgb = [0.4, 0.22, 0.18]
  tower(out, fit, {
    height: 15,
    base: { height: 4, face: { kind: 'blank', wall: [0.14, 0.1, 0.09], material: 'tile' }, canopy: { depth: 1, colour: [0.08, 0.08, 0.08] } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: BRICK, glass: [0.2, 0.22, 0.24], pitch: 2.8, floor: 3.3, solid: 0.4, material: 'brick' }, cornice: { depth: 0.8, height: 0.8, colour: [0.5, 0.46, 0.42] } }],
    crown: { kind: 'parapet', height: 1.2, colour: BRICK, material: 'brick' },
  })
}

/** T3 batch 9, unnamed block (way 260924242, 16 m, 1909): a tan brick block of about four storeys with a heavy cornice over a dark shopfront under a black awning; faces Commercial Street. Photo way-260924242-01 only. */
export function commercial260924242(out: MeshBuilder, fit: Fit): void {
  const TAN: Rgb = [0.7, 0.58, 0.42]
  tower(out, fit, {
    height: 16,
    base: { height: 4, face: { kind: 'blank', wall: [0.16, 0.14, 0.13], material: 'concrete' }, canopy: { depth: 1.2, colour: [0.1, 0.1, 0.1] } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: TAN, glass: [0.22, 0.24, 0.26], pitch: 2.8, floor: 3.2, solid: 0.4, material: 'brick' }, cornice: { depth: 0.9, height: 0.9, colour: [0.6, 0.5, 0.38] } }],
    crown: { kind: 'parapet', height: 1.4, colour: TAN, material: 'brick' },
  })
}

/** T3 batch 10, 28 2nd Street (way 148285580, 27 m, eight storeys, 1914): a whitewashed concrete office block with ribbon windows in bands over a dark shopfront; faces 2nd Street. Photos way-148285580-01 and -02. */
export function second28(out: MeshBuilder, fit: Fit): void {
  const WHITE: Rgb = [0.9, 0.9, 0.88]
  tower(out, fit, {
    height: 27,
    base: { height: 4.5, face: { kind: 'blank', wall: [0.22, 0.23, 0.24], material: 'tile' } },
    tiers: [{ to: 1, face: { kind: 'bands', wall: WHITE, glass: [0.34, 0.38, 0.4], floor: 3.4, solid: 0.6, material: 'concrete' }, cornice: { depth: 0.5, height: 0.5, colour: WHITE } }],
    crown: { kind: 'parapet', height: 1, colour: WHITE, material: 'concrete' },
  })
}

/** T3 batch 10, unnamed block (way 79377209, 25 m, 1907): a tan brick block of about eight storeys with punched windows and a heavy bracketed cornice over a dark glass shopfront; faces 2nd Street. Photos way-79377209-01 and -02 (the first only, see report). */
export function second79377209(out: MeshBuilder, fit: Fit): void {
  const TAN: Rgb = [0.8, 0.64, 0.44]
  tower(out, fit, {
    height: 25,
    base: { height: 4, face: { kind: 'blank', wall: [0.7, 0.6, 0.46], material: 'ashlar' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: TAN, glass: [0.2, 0.22, 0.25], pitch: 2.8, floor: 3.2, solid: 0.45, material: 'brick' }, cornice: { depth: 0.9, height: 0.9, colour: [0.82, 0.74, 0.6] } }],
    crown: { kind: 'parapet', height: 1.8, colour: TAN, material: 'brick' },
  })
}

/** T3 batch 10, 44 2nd Street (way 79377219, 11 m, three storeys, 1907): a cream stucco front with a moulded cornice and a dark glass shopfront below; faces 2nd Street. Photos way-79377219-01 and -02. */
export function second44(out: MeshBuilder, fit: Fit): void {
  const CREAM: Rgb = [0.9, 0.86, 0.76]
  tower(out, fit, {
    height: 11,
    base: { height: 3.5, face: { kind: 'curtain', wall: [0.2, 0.2, 0.2], glass: [0.26, 0.3, 0.32], pitch: 3, floor: 3.5, material: 'metal' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: CREAM, glass: [0.22, 0.24, 0.26], pitch: 2.6, floor: 2.6, solid: 0.5, material: 'stucco' }, cornice: { depth: 0.9, height: 0.9, colour: CREAM } }],
    crown: { kind: 'parapet', height: 0.8, colour: CREAM, material: 'stucco' },
  })
}

/** Tier 3 batch 11, north side of Jackson between Columbus and Montgomery. Photos: way-32858943-01/-02, way-32858908-01/-02, way-32858912-01/-02. */
export function jackson32858943(out: MeshBuilder, fit: Fit): void {
  const TERRA: Rgb = [0.62, 0.33, 0.25]
  tower(out, fit, {
    height: 19,
    base: { height: 4.5, face: { kind: 'punched', wall: [0.5, 0.26, 0.2], glass: [0.12, 0.14, 0.16], pitch: 3, floor: 4.5, solid: 0.3, material: 'brick' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: TERRA, glass: [0.2, 0.24, 0.28], pitch: 2.6, floor: 3.1, solid: 0.45, arched: true, material: 'brick' }, cornice: { depth: 0.7, height: 0.8, colour: [0.82, 0.72, 0.62] } }],
    crown: { kind: 'parapet', height: 1.2, colour: TERRA, material: 'brick' },
  })
}

export function jacksonColumbus32858908(out: MeshBuilder, fit: Fit): void {
  const BUFF: Rgb = [0.78, 0.68, 0.5]
  tower(out, fit, {
    height: 12,
    base: { height: 3.5, face: { kind: 'curtain', wall: [0.18, 0.18, 0.18], glass: [0.14, 0.16, 0.18], pitch: 3, floor: 3.5, material: 'metal' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: BUFF, glass: [0.22, 0.25, 0.28], pitch: 2.8, floor: 3.0, solid: 0.5, material: 'brick' }, cornice: { depth: 0.5, height: 0.6, colour: [0.6, 0.2, 0.16] } }],
    crown: { kind: 'parapet', height: 0.8, colour: BUFF, material: 'brick' },
  })
}

export function jackson530(out: MeshBuilder, fit: Fit): void {
  const CREAM: Rgb = [0.8, 0.72, 0.58]
  tower(out, fit, {
    height: 14,
    base: { height: 3.2, face: { kind: 'curtain', wall: [0.16, 0.16, 0.16], glass: [0.14, 0.16, 0.18], pitch: 3, floor: 4, material: 'metal' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: CREAM, glass: [0.22, 0.25, 0.28], pitch: 2.8, floor: 3.1, solid: 0.5, material: 'brick' }, cornice: { depth: 0.5, height: 0.6, colour: [0.6, 0.2, 0.16] } }],
    crown: { kind: 'parapet', height: 0.8, colour: CREAM, material: 'brick' },
  })
}

/** Tier 3 batch 12, 16 Elim Street (way 149837286, 18 m, 1906): a four-storey red brick warehouse with arched windows over a dark ground floor, a corbelled cornice and a painted ghost sign reading "Entrance ... Ecker St" on its side; front Ecker Street (178). Photos way-149837286-01 and -02. */
export function elim16(out: MeshBuilder, fit: Fit): void {
  const RED: Rgb = [0.5, 0.27, 0.2]
  tower(out, fit, {
    height: 18,
    base: { height: 3.5, face: { kind: 'blank', wall: [0.2, 0.19, 0.18], material: 'concrete' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: RED, glass: [0.2, 0.22, 0.22], pitch: 3.2, floor: 4.2, solid: 0.6, arched: true, material: 'brick' }, cornice: { depth: 0.6, height: 0.7, colour: [0.6, 0.52, 0.42] } }],
    crown: { kind: 'parapet', height: 1, colour: RED, material: 'brick' },
  })
}

/** Tier 3 batch 12, 40 Jessie Street (way 260298023, 24 m, 2008): a cream stone-clad block of about seven storeys, vertical piers up the front, recessed bronze entrances with red banners at street level; faces Jessie Street (133). Photos way-260298023-01 and -02. */
export function jessie40(out: MeshBuilder, fit: Fit): void {
  const CREAM: Rgb = [0.86, 0.81, 0.7]
  tower(out, fit, {
    height: 24,
    base: { height: 4.5, face: { kind: 'curtain', wall: [0.3, 0.2, 0.16], glass: [0.16, 0.18, 0.2], pitch: 3, floor: 4.5, material: 'metal' } },
    tiers: [{ to: 1, face: { kind: 'fins', wall: CREAM, glass: [0.22, 0.25, 0.28], floor: 3.4, pitch: 3.2, solid: 0.6, depth: 0.5, material: 'ashlar' }, cornice: { depth: 0.6, height: 0.7, colour: CREAM } }],
    crown: { kind: 'parapet', height: 1.2, colour: CREAM, material: 'ashlar' },
  })
}

/** Tier 3 batch 13, 200;220 Kearny Street (way 151195280, 19 m, 1908): the NE corner of Kearny and Sutter, a five-storey cream Beaux-Arts block with a bracketed cornice, a dark glass shopfront and fire escapes; front Kearny (257). Photos way-151195280-01 and -03. */
export function kearny200(out: MeshBuilder, fit: Fit): void {
  const CREAM: Rgb = [0.93, 0.91, 0.85]
  tower(out, fit, {
    height: 19,
    base: { height: 4, face: { kind: 'curtain', wall: [0.2, 0.2, 0.2], glass: [0.16, 0.2, 0.22], pitch: 3, floor: 4, material: 'metal' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: CREAM, glass: [0.22, 0.25, 0.28], pitch: 3.2, floor: 3.6, solid: 0.5, head: 'architrave', material: 'stucco' }, cornice: { depth: 0.8, height: 1, colour: CREAM } }],
    crown: { kind: 'parapet', height: 1, colour: CREAM, material: 'stucco' },
  })
}

/** Tier 3 batch 13, 154-176 Sutter Street (way 151195276, 26 m, 1987): a dark teal-tiled base of two storeys with a green tile cornice band, then white-cream upper storeys in a grid of windows; front Sutter (172). Photos way-151195276-02 and -03. */
export function sutter154(out: MeshBuilder, fit: Fit): void {
  const CREAM: Rgb = [0.9, 0.89, 0.85]
  const TEAL: Rgb = [0.16, 0.26, 0.28]
  tower(out, fit, {
    height: 26,
    base: { height: 7, face: { kind: 'punched', wall: TEAL, glass: [0.2, 0.25, 0.27], pitch: 3.6, floor: 3.4, solid: 0.6, material: 'tile' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: CREAM, glass: [0.24, 0.27, 0.3], pitch: 3, floor: 3.4, solid: 0.5, material: 'stucco' }, cornice: { depth: 0.6, height: 0.8, colour: TEAL } }],
    crown: { kind: 'parapet', height: 1, colour: CREAM, material: 'stucco' },
  })
}

/** Tier 3 batch 13, 215;217 Kearny Street (way 260280331, 12 m, 1907): west side of Kearny, a small three-storey grey stone block with a pediment-like bracketed cornice and a dark shopfront; front Kearny (72). Photos way-260280331-01 and -02. */
export function kearny215(out: MeshBuilder, fit: Fit): void {
  const STONE: Rgb = [0.5, 0.48, 0.45]
  tower(out, fit, {
    height: 12,
    base: { height: 3, face: { kind: 'blank', wall: [0.25, 0.18, 0.14], material: 'granite' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: STONE, glass: [0.2, 0.22, 0.24], pitch: 2.8, floor: 3.2, solid: 0.5, head: 'architrave', material: 'granite' }, cornice: { depth: 0.9, height: 1.2, colour: STONE } }],
    crown: { kind: 'parapet', height: 0.8, colour: STONE, material: 'granite' },
  })
}

/** Tier 3 batch 14, way 256072716 (named only Clay Street, 15 m, about 1910): a four-storey red brick block with a cream bracketed cornice, cream pilasters and window bands, and a blue painted ground floor with shop entrances; front Clay (164). Photos way-256072716-01 and -02. */
export function clay256072716(out: MeshBuilder, fit: Fit): void {
  const BRICK: Rgb = [0.6, 0.27, 0.18]
  const CREAM: Rgb = [0.84, 0.8, 0.7]
  tower(out, fit, {
    height: 15,
    base: { height: 4, face: { kind: 'blank', wall: [0.22, 0.34, 0.62], material: 'stucco' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: BRICK, glass: [0.2, 0.22, 0.25], pitch: 2.8, floor: 3.3, solid: 0.4, head: 'segmental', material: 'brick' }, cornice: { depth: 1, height: 1.2, colour: CREAM } }],
    crown: { kind: 'parapet', height: 1, colour: CREAM, material: 'stucco' },
  })
}

/** Tier 3 batch 14, 643;645;647 Clay Street (way 260924226, 12 m, about 1910): a three-storey peach stucco block with white pilasters and fire escapes over dark shopfronts (yellow awning, black fascia); front Clay (342). Photos way-260924226-01 and -02. */
export function clay643(out: MeshBuilder, fit: Fit): void {
  const PEACH: Rgb = [0.9, 0.68, 0.56]
  const CREAM: Rgb = [0.93, 0.89, 0.82]
  tower(out, fit, {
    height: 12,
    base: { height: 3.5, face: { kind: 'blank', wall: [0.2, 0.18, 0.16], material: 'concrete' }, canopy: { depth: 1, colour: [0.9, 0.78, 0.3] } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: PEACH, glass: [0.22, 0.22, 0.25], pitch: 3, floor: 3, solid: 0.45, material: 'stucco' }, cornice: { depth: 0.7, height: 0.7, colour: CREAM } }],
    crown: { kind: 'parapet', height: 1, colour: CREAM, material: 'stucco' },
  })
}

/** Pine and Battery (Tier 3 batch 15): tan stone corner block over a black shopfront base, south side of Pine. */
export function pine260282395(out: MeshBuilder, fit: Fit): void {
  const TAN: Rgb = [0.78, 0.7, 0.58]
  const BLACK: Rgb = [0.12, 0.12, 0.13]
  const CREAM: Rgb = [0.9, 0.86, 0.76]
  tower(out, fit, {
    height: 25,
    base: { height: 6, face: { kind: 'punched', wall: BLACK, glass: [0.2, 0.22, 0.25], pitch: 3.5, floor: 3, solid: 0.6, material: 'granite' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: TAN, glass: [0.2, 0.22, 0.24], pitch: 3, floor: 3.2, solid: 0.45, material: 'ashlar' }, cornice: { depth: 0.9, height: 1.1, colour: CREAM } }],
    crown: { kind: 'parapet', height: 1.2, colour: CREAM, material: 'ashlar' },
  })
}

/** Pine (Tier 3 batch 15): buff stone block with tall many-paned windows, north side of Pine. */
export function pine32859888(out: MeshBuilder, fit: Fit): void {
  const BUFF: Rgb = [0.82, 0.74, 0.6]
  const CREAM: Rgb = [0.92, 0.88, 0.8]
  tower(out, fit, {
    height: 40,
    base: { height: 4.5, face: { kind: 'blank', wall: CREAM, material: 'ashlar' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: BUFF, glass: [0.26, 0.3, 0.32], pitch: 3.2, floor: 4, solid: 0.3, material: 'ashlar' }, cornice: { depth: 0.8, height: 1, colour: CREAM } }],
    crown: { kind: 'parapet', height: 1.2, colour: CREAM, material: 'ashlar' },
  })
}

/** 77 Battery Street (Tier 3 batch 15): cream stone block with arched upper windows and a granite entrance base. */
export function battery77(out: MeshBuilder, fit: Fit): void {
  const CREAM: Rgb = [0.84, 0.82, 0.76]
  tower(out, fit, {
    height: 22,
    base: { height: 4, face: { kind: 'blank', wall: [0.2, 0.2, 0.2], material: 'granite' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: CREAM, glass: [0.22, 0.25, 0.28], pitch: 3, floor: 3.4, solid: 0.5, arched: true, material: 'stucco' }, cornice: { depth: 0.8, height: 1, colour: CREAM } }],
    crown: { kind: 'parapet', height: 1.5, colour: CREAM, material: 'stucco' },
  })
}

/** Tier 3 batch 16, 407;411 Sansome Street (way 165480948, 17 m, 1909): a four-storey tan brick block with a dark granite shopfront, punched windows with architraves and a moulded cornice; front Sansome (78). Photos way-165480948-01 and -02 (fetched). */
export function sansome407(out: MeshBuilder, fit: Fit): void {
  const TAN: Rgb = [0.72, 0.6, 0.46]
  tower(out, fit, {
    height: 17,
    base: { height: 4, face: { kind: 'blank', wall: [0.14, 0.13, 0.12], material: 'metal' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: TAN, glass: [0.2, 0.22, 0.24], pitch: 3, floor: 3.4, solid: 0.5, head: 'architrave', material: 'brick' }, cornice: { depth: 0.8, height: 1, colour: [0.8, 0.76, 0.68] } }],
    crown: { kind: 'parapet', height: 1, colour: TAN, material: 'brick' },
  })
}

/** Tier 3 batch 16, way 32947521 (unnamed, the NW corner of Sansome and Sacramento, 16 m, 1906): a three-storey ochre brick corner block with arched upper windows on both faces, a bracketed cornice and an orange-fronted ground floor; front Sansome (78). Photos way-32947521-01 and -02. */
export function sansomeSacramento32947521(out: MeshBuilder, fit: Fit): void {
  const OCHRE: Rgb = [0.74, 0.6, 0.4]
  tower(out, fit, {
    height: 16,
    base: { height: 4, face: { kind: 'blank', wall: [0.62, 0.4, 0.2], material: 'granite' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: OCHRE, glass: [0.2, 0.22, 0.24], pitch: 3, floor: 3.6, solid: 0.5, arched: true, material: 'brick' }, cornice: { depth: 0.9, height: 1, colour: [0.82, 0.74, 0.6] } }],
    crown: { kind: 'parapet', height: 1, colour: OCHRE, material: 'brick' },
  })
}

/** Tier 3 batch 16, 415;429 Sansome Street (way 165480946, about 12 m from OSM, 1908; manifest height 18 m): a four-storey red-brown brick block with a black Wayfare-style shopfront at street level; front Sansome (80). Photos way-165480946-01 (only frame used; it may show the neighbouring tavern, see report). */
export function sansome415(out: MeshBuilder, fit: Fit): void {
  const RED: Rgb = [0.55, 0.3, 0.22]
  tower(out, fit, {
    height: 18,
    base: { height: 4, face: { kind: 'blank', wall: [0.12, 0.1, 0.1], material: 'granite' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: RED, glass: [0.2, 0.22, 0.24], pitch: 3, floor: 3.6, solid: 0.45, head: 'architrave', material: 'brick' }, cornice: { depth: 0.8, height: 1, colour: [0.7, 0.66, 0.6] } }],
    crown: { kind: 'parapet', height: 1, colour: RED, material: 'brick' },
  })
}

// ---------------------------------------------------------------- Tier 3 batch 17: Kearny and Post, west side of Kearny between Post and Sutter
/**
 * 123-133 Kearny (way/255716896, 22 m): a cream stone block of six storeys, a granite-faced ground floor with the
 * Walgreens-style shopfronts, tall punched windows under architraves and a dentilled cornice at the top (Mapillary
 * 2026-10, frame 02, between the dashed lines).
 */
export function kearny123(out: MeshBuilder, fit: Fit): void {
  const CREAM: Rgb = [0.83, 0.78, 0.68]
  tower(out, fit, {
    height: 22,
    base: { height: 4, face: { kind: 'punched', wall: [0.7, 0.66, 0.6], glass: [0.2, 0.23, 0.25], floor: 4, pitch: 3.2, solid: 0.4, material: 'granite' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: CREAM, glass: [0.22, 0.25, 0.28], floor: 3.4, pitch: 2.8, solid: 0.42, head: 'architrave', material: 'ashlar' }, cornice: { depth: 0.5, height: 0.8, colour: [0.72, 0.68, 0.6] } }],
    crown: { kind: 'parapet', height: 1.2, colour: CREAM, material: 'ashlar' },
  })
}

/**
 * 153 Kearny (way/333823795, 39 m): a seven-storey cream classical block, a shopfront ground floor under a painted
 * name board, punched windows with architrave heads and a moulded band at each floor, a dentilled cornice at the
 * top. Drawn from Mapillary frame 02 (between the dashed lines, the cream block with the fire escape and the bay
 * windows) and frame 03; the frames are ambiguous about which facade is bracketed, so verify before trusting.
 */
export function kearny153(out: MeshBuilder, fit: Fit): void {
  const CREAM: Rgb = [0.85, 0.8, 0.7]
  tower(out, fit, {
    height: 39,
    base: { height: 4.5, face: { kind: 'punched', wall: [0.62, 0.58, 0.52], glass: [0.18, 0.22, 0.22], floor: 4.5, pitch: 3.2, solid: 0.4, material: 'granite' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: CREAM, glass: [0.22, 0.25, 0.28], floor: 4, pitch: 3.6, solid: 0.42, material: 'ashlar' }, cornice: { depth: 0.5, height: 0.8, colour: [0.78, 0.74, 0.66] } }],
    cornices: [{ at: 0.33, depth: 0.25, colour: [0.74, 0.7, 0.62] }],
    crown: { kind: 'parapet', height: 1.4, colour: CREAM, material: 'ashlar' },
  })
}

/**
 * 126 Post (way/255716898, 28 m): a cream stone block of eight storeys on Post, a rusticated granite base, plain
 * punched windows under architraves, a dentilled cornice at the top. Drawn from Mapillary frame 03 (the cream
 * block with the dentil cornice, the Chipotle ground floor), which is the nearest frame on Post.
 */
export function post126(out: MeshBuilder, fit: Fit): void {
  const CREAM: Rgb = [0.8, 0.76, 0.68]
  tower(out, fit, {
    height: 28,
    base: { height: 4, face: { kind: 'blank', wall: [0.6, 0.56, 0.5], material: 'granite' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: CREAM, glass: [0.22, 0.25, 0.28], floor: 3.8, pitch: 3.6, solid: 0.42, material: 'ashlar' }, cornice: { depth: 0.6, height: 0.9, colour: [0.74, 0.7, 0.62] } }],
    crown: { kind: 'parapet', height: 1.2, colour: CREAM, material: 'ashlar' },
  })
}

/**
 * Kearny, west side, between Pine and Bush (way/151683977, unnamed, 30 m, 1907): a cream-grey stone block of about
 * nine storeys with architrave-headed punched windows, a dark green marble shopfront under a black roll grille, and a
 * deep moulded cornice at the top. Drawn from Mapillary frame 01 (the cream block with the cornice, the marble
 * shopfront), looking along Kearny; the frame's bearing reads as a north face, so the front is Kearny per the batch.
 */
export function kearny151683977(out: MeshBuilder, fit: Fit): void {
  const CREAM: Rgb = [0.86, 0.84, 0.78]
  tower(out, fit, {
    height: 30,
    base: { height: 4, face: { kind: 'punched', wall: [0.16, 0.26, 0.22], glass: [0.14, 0.18, 0.18], floor: 4, pitch: 3.2, solid: 0.5, material: 'granite' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: CREAM, glass: [0.22, 0.25, 0.28], floor: 3.4, pitch: 4, solid: 0.42, material: 'ashlar' }, cornice: { depth: 0.5, height: 0.9, colour: [0.74, 0.72, 0.66] } }],
    crown: { kind: 'parapet', height: 1.4, colour: CREAM, material: 'ashlar' },
  })
}

/**
 * Kearny at Pine, SW corner (way/151683979, 353-359 Kearny, 18 m, 1907): a painted grey-cream block of five storeys
 * with double-hung punched windows, a dark ground-floor shopfront row, and a dark band of cornice at the roofline.
 * Drawn from Mapillary frame 01 (the five-storey block at the Pine corner with its shopfronts), front Kearny (82).
 */
export function kearny353(out: MeshBuilder, fit: Fit): void {
  const GREY: Rgb = [0.84, 0.83, 0.78]
  tower(out, fit, {
    height: 18,
    base: { height: 4, face: { kind: 'punched', wall: [0.22, 0.22, 0.22], glass: [0.2, 0.22, 0.24], floor: 4, pitch: 3.2, solid: 0.5, material: 'granite' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: GREY, glass: [0.2, 0.22, 0.26], floor: 3.4, pitch: 2.8, solid: 0.42, head: 'architrave', material: 'stucco' }, cornice: { depth: 0.6, height: 0.9, colour: [0.3, 0.3, 0.3] } }],
    crown: { kind: 'parapet', height: 1, colour: GREY, material: 'stucco' },
  })
}

/**
 * Kearny at Pine, east side by Belden Place (way/148741772, 14 m, 1908): a three-storey beige stucco block with tall
 * windows in framed surrounds and a heavy dark cornice, over a dark shopfront row. Drawn from Mapillary frame 01,
 * whose face is the Pine Street front (bearing 346), the main face in view.
 */
export function kearnyPine148741772(out: MeshBuilder, fit: Fit): void {
  const BEIGE: Rgb = [0.85, 0.79, 0.66]
  tower(out, fit, {
    height: 14,
    base: { height: 3.5, face: { kind: 'punched', wall: [0.3, 0.28, 0.26], glass: [0.18, 0.2, 0.22], floor: 3.5, pitch: 3.4, solid: 0.5, material: 'granite' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: BEIGE, glass: [0.2, 0.22, 0.25], floor: 3.5, pitch: 3, solid: 0.45, head: 'architrave', material: 'stucco' }, cornice: { depth: 0.8, height: 1.2, colour: [0.32, 0.24, 0.18] } }],
    crown: { kind: 'parapet', height: 0.8, colour: [0.32, 0.24, 0.18], material: 'stucco' },
  })
}

export const MARKET_FIDI: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  stevensonPlace,
  trinityPlace1177,
  unionTrustBank,
  serif960Market,
  jamesBongBuilding,
  haleBrothers901Market,
  prism1028Market,
  livat945Market,
  bofaMarketNewMontgomery,
  digitalGarage715Market,
  ppic500Washington,
  grantBuilding1095Market,
  aidaHotel1083Market,
  market1119,
  budgetInn1139Market,
  market1100Annexe,
  market979,
  market973,
  frontierTower1Sixth,
  market605,
  market607,
  stevenson49,
  market735,
  market725,
  third30,
  market720,
  kearny1,
  geary940203045,
  market800,
  market742,
  garfieldBuilding,
  donnellyHotel,
  wellsFargo1256Market,
  yullyBuilding,
  market1017,
  market1075,
  islamicSociety20Jones,
  threeTransamericaCenter,
  sansome500,
  hotalingBuilding, jacksonSquare256072726, jacksonSquare930905519,
  fidi1279452198, battery617, fidi256067720,
  california550Sacramento, hindBuilding,
  firstNationalBankNorCal,
  market570, citibankDrumm,
  market1001Corner, market1005, market1009,
  market1023, artMuseumAmerica1025Market,
  stationJSacramento, wayfareTavern558Sacramento, leidesdorff215,
  angloBankSacramento, stationJAnnex, sacramento942303804,
  belden148741780,
  kearny260280334, fidi151195278, kearny474354577,
  bush151195270, kearny260,
  buichBuilding240California, california244, california200,
  claytonClay, clay260924222, commercial260924242,
  second28, second79377209, second44,
  jackson32858943, jacksonColumbus32858908, jackson530,
  elim16, jessie40,
  kearny200, sutter154, kearny215,
  clay256072716, clay643,
  pine260282395, pine32859888, battery77,
  sansome407, sansomeSacramento32947521, sansome415,
  kearny123, kearny153, post126,
  kearny151683977, kearny353, kearnyPine148741772,
}
