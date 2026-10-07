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

export const MARKET_FIDI: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  stevensonPlace,
  trinityPlace1177,
  unionTrustBank,
  serif960Market,
  jamesBongBuilding,
  haleBrothers901Market,
  prism1028Market,
}
