/**
 * MARKET STREET AND THE FIDI CORE — the generic buildings left there, modelled one at a time in priority order
 * (docs/GENERIC-MARKET-FIDI.md; owner, 2026-10-07: "start working on them … NOT batching"). Each builder here replaces
 * a `restyle` (reface) or nothing; its manifest entry is in public/landmarks/san-francisco/market-fidi.json, and its
 * notes say which photographs it was drawn from.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { tower, towerRing, type Face } from '../tower.ts'
import { colonnade, edgeAt } from '../parts.ts'
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
}
