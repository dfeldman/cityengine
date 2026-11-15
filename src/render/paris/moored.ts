/**
 * The Seine's moored boats, by KIND (render/moored.ts is the shared hull and deck kit). A kind builds one boat
 * fitted to length L and beam B (whole metres, not halves), local +z forward, waterline at y = 0, and returns
 * its main deck's height. `MOORED_SIZES` is what a gap-filled boat of each kind measures (render/paris/ports.ts).
 */
import type { MeshBuilder } from '../buildings.ts'
import { box, prism, strut, wedge, EMIT, type Rgb } from '../models.ts'
import {
  BANDS, BARGE_HULL, BOX_HULL, CABINS, DARK, DUTCH_HULL, GLASS, HULLS, LIGHT, PENICHE_HULL, PLANT, SHIP_HULL, STEEL, TJALK_HULL, VARNISH, WHITE, WOOD, YACHT_HULL,
  F, bicycle, flag, halfWidthAt, hull, lifebuoy, parasol, pick, planter, railing, rnd, stringLights, wheelhouse, windows,
} from '../moored.ts'

export type MooredKind = 'peniche' | 'dutch' | 'cruiser' | 'venue' | 'tourBoat' | 'hotel' | 'workBarge' | 'pusher' | 'pontoon' | 'police' | 'floatHome'
export type Builder = (out: MeshBuilder, L: number, B: number, seed: number) => number

/** a gap-filled boat's [min, max] length and its beam, by kind */
export const MOORED_SIZES: Record<MooredKind, { L: [number, number]; B: number }> = {
  peniche: { L: [30, 38.5], B: 5.05 },
  dutch: { L: [16, 27], B: 4.4 },
  cruiser: { L: [8, 14], B: 3.4 },
  venue: { L: [32, 50], B: 6.5 },
  tourBoat: { L: [28, 45], B: 7 },
  hotel: { L: [100, 125], B: 11.4 },
  workBarge: { L: [38, 60], B: 6.6 },
  pusher: { L: [12, 18], B: 6.5 },
  pontoon: { L: [18, 30], B: 6 },
  police: { L: [10, 14], B: 3.6 },
  floatHome: { L: [18, 30], B: 9 },
}

const FREEBOARD = 1.05        // a péniche's side above the water, m (a loaded barge shows less)
const CABIN_H = 2.15          // a converted péniche's deckhouse
const OLD_HOLD_H = 1.25       // the low rounded hold roof of one still near to the working boat it was

const FR_FLAG: Rgb[] = [[0.1, 0.25, 0.6], [0.95, 0.95, 0.95], [0.8, 0.12, 0.15]]
const NL_FLAG: Rgb[] = [[0.12, 0.25, 0.55], [0.95, 0.95, 0.95], [0.75, 0.12, 0.15]]

/**
 * The PÉNICHE, the Seine's houseboat: a Freycinet barge (38.5 × 5.05) turned home. Three ways it is done —
 * the old hold roof kept low and rounded with the wheelhouse aft; a full-length deckhouse with a roof terrace;
 * a short deckhouse and a glass room, the foredeck a garden — and a life on deck: pots, a bike, a parasol.
 */
export const peniche: Builder = (out, L, B, seed) => {
  const r = rnd(seed)
  const hc = pick(r, HULLS)
  const band = pick(r, BANDS)
  const cab = pick(r, CABINS)
  const roof: Rgb = pick(r, [[0.3, 0.31, 0.33], [0.85, 0.85, 0.82], [0.62, 0.15, 0.13], [0.2, 0.32, 0.5], [0.18, 0.4, 0.25], [0.15, 0.45, 0.5]] as Rgb[])
  const y = FREEBOARD
  hull(out, L, B, -0.4, y, PENICHE_HULL, hc, band, 0.22, r() > 0.4 ? WOOD : [0.35, 0.36, 0.37])
  const h = L / 2
  const hw = B / 2 - 0.45
  const v = r()
  const sternZ = -h + 2.6
  if (v < 0.38) {
    // as it worked: a low hold roof, rounded, over most of the length; the wheelhouse aft on the living quarters
    const z0 = -h + 6.5, z1 = h - 4.5
    box(out, 0, y + OLD_HOLD_H / 2, (z0 + z1) / 2, hw, OLD_HOLD_H / 2, (z1 - z0) / 2, cab, F)
    wedge(out, 0, y + OLD_HOLD_H + 0.2, (z0 + z1) / 2, hw, 0.2, (z1 - z0) / 2, hw * 0.55, roof, F)
    windows(out, hw, y + OLD_HOLD_H * 0.55, z0, z1, 0.5, 0.7, 2.6)
    for (let z = z0 + 3; z < z1 - 2; z += 7) box(out, 0, y + OLD_HOLD_H + 0.45, z, 0.6, 0.1, 0.6, GLASS, F)   // skylights
    box(out, 0, y + 0.9, -h + 4, hw, 0.9, 2.2, cab, F)
    wheelhouse(out, sternZ + 0.6, y + 1.8, 1.25, 1.1, 1.9, cab, roof)
  } else if (v < 0.75) {
    // a full deckhouse, a terrace on its roof behind a railing, a stair up at the stern
    const z0 = -h + 3.4, z1 = h - 3.8
    box(out, 0, y + CABIN_H / 2, (z0 + z1) / 2, hw, CABIN_H / 2, (z1 - z0) / 2, cab, F)
    windows(out, hw, y + CABIN_H * 0.58, z0, z1, 0.95, 1.2, 2.2)
    box(out, 0, y + CABIN_H + 0.05, (z0 + z1) / 2, hw + 0.1, 0.05, (z1 - z0) / 2 + 0.1, roof, F)
    const ty = y + CABIN_H + 0.1
    for (const s of [-1, 1]) railing(out, s * hw, ty, z0 + 0.3, z1 - 0.3, r() > 0.5 ? WHITE : DARK)
    for (let z = z0 + 1.2; z < z1 - 1; z += 2.6 + r() * 3) planter(out, (r() > 0.5 ? 1 : -1) * (hw - 0.5), ty, z, r)
    if (r() > 0.3) parasol(out, 0, ty, (z0 + z1) / 2 + (r() - 0.5) * 8, r)
    if (r() > 0.5) for (let i = 0; i < 3; i++) box(out, -0.6 + i * 0.6, ty + 0.12, z0 + 3 + r() * 6, 0.25, 0.04, 0.5, [0.12, 0.2, 0.42], F)  // solar panels
    if (r() > 0.6) wheelhouse(out, z0 + 1.2, ty, 1.1, 0.9, 1.7, cab, roof)
  } else {
    // a short deckhouse aft, a glass room amidships, the foredeck a garden
    const z0 = -h + 3.2, z1 = -h + 3.2 + L * 0.35
    box(out, 0, y + CABIN_H / 2, (z0 + z1) / 2, hw, CABIN_H / 2, (z1 - z0) / 2, cab, F)
    windows(out, hw, y + CABIN_H * 0.58, z0, z1, 0.95, 1.1, 2.3)
    box(out, 0, y + CABIN_H + 0.05, (z0 + z1) / 2, hw + 0.1, 0.05, (z1 - z0) / 2 + 0.1, roof, F)
    const g1 = z1 + L * 0.2
    box(out, 0, y + 1.1, (z1 + g1) / 2, hw, 1.1, (g1 - z1) / 2, GLASS, F)
    for (let z = z1; z <= g1 + 0.01; z += 1.3) for (const s of [-1, 1]) box(out, s * hw, y + 1.1, z, 0.05, 1.1, 0.05, WHITE, F)
    box(out, 0, y + 2.25, (z1 + g1) / 2, hw + 0.05, 0.05, (g1 - z1) / 2 + 0.05, WHITE, F)
    for (let z = g1 + 1.2; z < h - 2.5; z += 1.4 + r() * 1.4) planter(out, (r() - 0.5) * hw * 1.6, y, z, r)
    if (r() > 0.4) parasol(out, 0, y, g1 + 3, r)
  }
  // the life on deck: a bike, the lifebuoy, the tricolore aft, a dish, a stack of pots at the bow
  if (r() > 0.45) bicycle(out, hw - 0.1, y, -h + 6 + r() * 6, pick(r, [[0.7, 0.1, 0.1], [0.1, 0.3, 0.6], DARK, [0.9, 0.9, 0.85]] as Rgb[]))
  lifebuoy(out, hw + 0.45, y + 0.6, -h + 2.5 + r() * 4, 1)
  if (r() > 0.4) flag(out, 0, y, -h + 0.5, 1.6, FR_FLAG)
  if (r() > 0.6) prism(out, -hw + 0.4, -h + 5, y + CABIN_H + 0.1, y + CABIN_H + 0.6, 0.3, 6, [0.85, 0.85, 0.85], F)
  for (let i = 0, n = Math.floor(r() * 4); i < n; i++) planter(out, (r() - 0.5) * B * 0.5, y, h - 1.2 - r() * 1.5, r)
  return y
}

/** A DUTCH BARGE — a luxemotor, straight-stemmed with a round bow, or a tjalk, round at both ends with leeboards and a mast. */
export const dutch: Builder = (out, L, B, seed) => {
  const r = rnd(seed)
  const tjalk = r() > 0.6
  const hc = pick(r, [[0.1, 0.16, 0.28], [0.1, 0.35, 0.2], DARK, [0.6, 0.12, 0.1], [0.12, 0.3, 0.55], [0.1, 0.42, 0.45]] as Rgb[])
  const band = pick(r, [[0.88, 0.7, 0.18], [0.72, 0.13, 0.11], [0.9, 0.9, 0.86], [0.2, 0.45, 0.25]] as Rgb[])
  const y = 1.0
  const shape = tjalk ? TJALK_HULL : DUTCH_HULL
  hull(out, L, B, -0.4, y, shape, hc, band, 0.28, VARNISH)
  const h = L / 2
  const hw = halfWidthAt(0, L, B, shape) - 0.4
  // the hold, covered with a low varnished roof; the wheelhouse aft, varnished, white-roofed; a doghouse forward
  const z0 = -h + 5.5, z1 = h - 4.5
  box(out, 0, y + 0.55, (z0 + z1) / 2, hw, 0.55, (z1 - z0) / 2, VARNISH, F)
  wedge(out, 0, y + 1.2, (z0 + z1) / 2, hw, 0.1, (z1 - z0) / 2, hw * 0.3, tjalk ? [0.28, 0.36, 0.3] : [0.86, 0.85, 0.8], F)
  windows(out, hw, y + 0.6, z0, z1, 0.35, 0.45, 1.6)
  wheelhouse(out, -h + 3.6, y, 1.25, 1.2, 2.1, VARNISH, WHITE)
  box(out, 0, y + 0.5, -h + 1.3, hw * 0.7, 0.5, 0.9, VARNISH, F)
  if (tjalk) {
    // the mast with its sail furled on the boom, the leeboards on both sides
    prism(out, 0, h - 5.5, y + 1.3, y + 11, 0.12, 6, VARNISH, F, 0.08)
    strut(out, [0, y + 2.4, h - 5.5], [0, y + 2.4, -h + 6], 0.35, 0.35, [0.78, 0.62, 0.42])
    strut(out, [0, y + 11, h - 5.5], [0, y + 0.3, h - 0.3], 0.02, 0.02, DARK)
    for (const s of [-1, 1]) {
      const w = halfWidthAt(h - 6, L, B, shape)
      box(out, s * (w + 0.07), y - 0.2, h - 6, 0.05, 0.9, 1.0, VARNISH, F)
    }
  } else {
    prism(out, 0, h - 3, y, y + 4.5, 0.1, 6, WHITE, F)                  // the lowered mast's stump with its lamp
    box(out, 0, y + 4.5, h - 3, 0.12, 0.12, 0.12, WHITE, F)
  }
  flag(out, 0, y, -h + 0.4, 1.6, r() > 0.5 ? NL_FLAG : FR_FLAG)
  for (let i = 0, n = 1 + Math.floor(r() * 4); i < n; i++) planter(out, (r() - 0.5) * hw, y + 1.25, z0 + 1 + r() * (z1 - z0 - 2), r)
  if (r() > 0.5) bicycle(out, hw * 0.6, y + 1.25, z0 + 3, DARK)
  return y
}

/** A CRUISER: a small white motor yacht, a sharp bow, a dark band of windows, a canopy over the helm. */
export const cruiser: Builder = (out, L, B, seed) => {
  const r = rnd(seed)
  const stripe = pick(r, [[0.12, 0.25, 0.55], [0.1, 0.11, 0.13], [0.55, 0.12, 0.12], [0.2, 0.45, 0.5]] as Rgb[])
  const y = 1.0
  hull(out, L, B, -0.35, y, YACHT_HULL, r() > 0.45 ? WHITE : pick(r, [[0.12, 0.2, 0.4], [0.6, 0.12, 0.1], [0.15, 0.4, 0.25], [0.95, 0.75, 0.2], [0.1, 0.45, 0.55], DARK] as Rgb[]), stripe, 0.18, [0.8, 0.72, 0.58])
  const h = L / 2
  const hw = B / 2 - 0.4
  const z0 = -h + 1.6, z1 = h - L * 0.38
  const top: Rgb = r() > 0.55 ? WHITE : pick(r, [[0.92, 0.88, 0.75], [0.55, 0.75, 0.88], [0.95, 0.8, 0.35], [0.7, 0.85, 0.7], [0.85, 0.6, 0.6]] as Rgb[])
  wedge(out, 0, y + 0.7, (z0 + z1) / 2, hw, 0.7, (z1 - z0) / 2, 0.25, top, F)
  box(out, 0, y + 0.85, (z0 + z1) / 2, hw + 0.01, 0.25, (z1 - z0) / 2 - 0.4, GLASS, F)
  if (r() > 0.25) {
    // a flybridge with a bimini over it
    for (const s of [-1, 1]) for (const z of [z0 + 0.5, z0 + 2.3]) prism(out, s * (hw - 0.2), z, y + 1.4, y + 2.6, 0.03, 4, STEEL, F)
    box(out, 0, y + 2.62, z0 + 1.4, hw, 0.04, 1.1, pick(r, [[0.12, 0.25, 0.55], [0.75, 0.15, 0.12], [0.15, 0.45, 0.3], [0.95, 0.7, 0.15], [0.1, 0.45, 0.55], [0.85, 0.8, 0.7]] as Rgb[]), F)
  }
  for (const s of [-1, 1]) railing(out, s * (hw + 0.25), y, z1, h - 1.5, STEEL, 0.6)
  if (r() > 0.5) flag(out, 0, y, -h + 0.2, 1.2, FR_FLAG)
  return y
}

/**
 * A VENUE: the restaurant, bar or club barge — a péniche hull, a deckhouse glazed all along, a roof terrace under
 * parasols or an awning, guinguette lights strung over it, and a name board.
 */
export const venue: Builder = (out, L, B, seed) => {
  const r = rnd(seed)
  const hc = pick(r, HULLS)
  const band = pick(r, BANDS)
  const frame: Rgb = pick(r, [WHITE, DARK, [0.15, 0.3, 0.25], [0.55, 0.1, 0.1], VARNISH, [0.12, 0.3, 0.55], [0.9, 0.6, 0.15], [0.1, 0.45, 0.45]] as Rgb[])
  const y = FREEBOARD
  hull(out, L, B, -0.4, y, PENICHE_HULL, hc, band, 0.25, WOOD)
  const h = L / 2
  const hw = B / 2 - 0.35
  const z0 = -h + 3.5, z1 = h - 4.5
  const H = 2.6
  box(out, 0, y + H / 2, (z0 + z1) / 2, hw, H / 2, (z1 - z0) / 2, GLASS, F)
  for (let z = z0; z <= z1 + 0.01; z += 1.6) for (const s of [-1, 1]) box(out, s * hw, y + H / 2, z, 0.06, H / 2, 0.06, frame, F)
  box(out, 0, y + 0.4, (z0 + z1) / 2, hw + 0.02, 0.4, (z1 - z0) / 2, frame, F)                // the dado below the glass
  box(out, 0, y + H + 0.08, (z0 + z1) / 2, hw + 0.25, 0.08, (z1 - z0) / 2 + 0.25, frame, F)
  // the name board along the side, a warm glow inside after dark
  for (const s of [-1, 1]) box(out, s * (hw + 0.27), y + H + 0.08, (z0 + z1) / 2, 0.02, 0.22, Math.min(5, (z1 - z0) / 3), pick(r, [[0.85, 0.75, 0.3], WHITE, [0.7, 0.15, 0.12]] as Rgb[]), F)
  box(out, 0, y + H - 0.2, (z0 + z1) / 2, hw - 0.6, 0.04, (z1 - z0) / 2 - 0.4, LIGHT, EMIT)
  const ty = y + H + 0.16
  for (const s of [-1, 1]) railing(out, s * (hw + 0.2), ty, z0, z1, frame)
  if (r() > 0.45) {
    for (let z = z0 + 2; z < z1 - 1.5; z += 3.2) parasol(out, (r() > 0.5 ? 0.9 : -0.9), ty, z, r)
  } else {
    // a striped awning on posts
    const ac = pick(r, [[0.85, 0.2, 0.17], [0.2, 0.4, 0.7], [0.9, 0.88, 0.8], [0.25, 0.45, 0.3]] as Rgb[])
    for (let z = z0 + 0.5; z <= z1 - 0.4; z += 3) for (const s of [-1, 1]) prism(out, s * (hw - 0.1), z, ty, ty + 2.3, 0.04, 4, DARK, F)
    wedge(out, 0, ty + 2.45, (z0 + z1) / 2, hw + 0.1, 0.15, (z1 - z0) / 2, hw * 0.6, ac, F)
    for (let z = z0 + 2; z < z1 - 1; z += 3) box(out, 0, ty + 0.36, z, 0.5, 0.03, 0.9, WHITE, F)
  }
  for (const s of [-1, 1]) stringLights(out, [s * (hw + 0.2), ty + 2.1, z0], [s * (hw + 0.2), ty + 2.1, z1], Math.round((z1 - z0) / 1.6))
  for (let z = z0; z < z1; z += 5) planter(out, -hw + 0.4, ty, z, r)
  // the foredeck a terrace too
  for (let z = z1 + 1.4; z < h - 1.8; z += 2.2) parasol(out, 0, y, z, r)
  return y
}

/** A TOUR BOAT at its berth: low and long, a white upper hull, a glass saloon, an open top deck of benches. */
export const tourBoat: Builder = (out, L, B, seed) => {
  const r = rnd(seed)
  const livery = pick(r, [[0.1, 0.2, 0.42], [0.55, 0.12, 0.12], [0.12, 0.12, 0.14], [0.12, 0.35, 0.3]] as Rgb[])
  const y = 1.1
  hull(out, L, B, -0.4, y, SHIP_HULL, livery, WHITE, 0.45, [0.6, 0.6, 0.58])
  const h = L / 2
  const hw = B / 2 - 0.2
  const z0 = -h + 2, z1 = h - 6
  box(out, 0, y + 1.1, (z0 + z1) / 2, hw, 1.1, (z1 - z0) / 2, GLASS, F)
  for (let z = z0; z <= z1; z += 2.4) for (const s of [-1, 1]) box(out, s * hw, y + 1.1, z, 0.06, 1.1, 0.08, WHITE, F)
  wedge(out, 0, y + 1.1, z1 + 1.3, hw - 0.5, 1.1, 1.3, 1.0, GLASS, F)
  box(out, 0, y + 2.27, (z0 + z1) / 2, hw + 0.05, 0.07, (z1 - z0) / 2 + 0.2, WHITE, F)
  const ty = y + 2.34
  for (const s of [-1, 1]) railing(out, s * hw, ty, z0, z1, WHITE)
  for (let z = z0 + 1; z < z1 - 3; z += 1.6) for (const s of [-1, 1]) box(out, s * (hw / 2), ty + 0.22, z, hw / 2 - 0.5, 0.15, 0.25, [0.45, 0.3, 0.2], F)
  box(out, 0, ty + 0.65, z1 - 1.5, 1.4, 0.65, 1.1, WHITE, F)
  box(out, 0, ty + 0.85, z1 - 0.38, 1.2, 0.3, 0.03, DARK, F)
  flag(out, 0, ty + 1.3, z1 - 1.5, 1.4, FR_FLAG)
  return y
}

/**
 * A HOTEL SHIP: the river cruise boats moored for the night (110 m by 11.4 the size the locks allow): white,
 * three decks of windows over a dark boot top, a wheelhouse forward, a sun deck with an awning and loungers.
 */
export const hotel: Builder = (out, L, B, seed) => {
  const r = rnd(seed)
  const accent: Rgb = pick(r, [[0.1, 0.2, 0.45], [0.1, 0.11, 0.13], [0.55, 0.12, 0.12], [0.1, 0.35, 0.45]] as Rgb[])
  const y = 1.2
  hull(out, L, B, -0.5, y, SHIP_HULL, WHITE, accent, 0.25, [0.62, 0.62, 0.6])
  box(out, 0, 0.05, -2, B / 2 - 0.2, 0.25, L / 2 - 6, accent, F)               // the boot top at the water
  const h = L / 2
  const hw = B / 2 - 0.3
  const z0 = -h + 3, z1 = h - 10
  const deckH = 2.6
  // the lower deck's portholes in the hull itself, then two decks of picture windows
  windows(out, B / 2, y - 0.55, z0, z1, 0.35, 0.8, 1.8)
  for (let d = 0; d < 2; d++) {
    const yy = y + d * deckH
    box(out, 0, yy + deckH / 2, (z0 + z1) / 2, hw, deckH / 2, (z1 - z0) / 2, WHITE, F)
    windows(out, hw, yy + deckH * 0.55, z0, z1, 1.5, 1.8, 2.3, GLASS)
    for (const s of [-1, 1]) box(out, s * (hw + 0.05), yy + deckH - 0.1, (z0 + z1) / 2, 0.06, 0.06, (z1 - z0) / 2, accent, F)
  }
  // the wheelhouse forward, the sun deck over it all: an awning aft, loungers, rails
  const sy = y + 2 * deckH
  box(out, 0, sy + 0.05, (z0 + z1) / 2, hw + 0.1, 0.05, (z1 - z0) / 2 + 0.1, [0.55, 0.62, 0.66], F)
  box(out, 0, sy + 1.2, z1 - 3, hw * 0.6, 1.1, 1.6, WHITE, F)
  box(out, 0, sy + 1.6, z1 - 1.38, hw * 0.6, 0.5, 0.03, GLASS, F)
  for (const s of [-1, 1]) railing(out, s * hw, sy + 0.1, z0, z1, WHITE)
  for (let z = z0 + 2; z < z0 + 14; z += 3) for (const s of [-1, 1]) prism(out, s * (hw - 0.3), z, sy, sy + 2.4, 0.05, 4, WHITE, F)
  box(out, 0, sy + 2.45, z0 + 8, hw, 0.05, 6.5, pick(r, [[0.92, 0.9, 0.84], accent] as Rgb[]), F)
  for (let z = z0 + 16; z < z1 - 6; z += 1.4) for (const s of [-1, 1]) if (r() > 0.4) wedge(out, s * (hw - 1.4), sy + 0.25, z, 0.35, 0.15, 0.9, 0.1, WHITE, F)
  box(out, 0, sy + 0.1, (z0 + z1) / 2 + 6, 1.6, 0.05, 3, [0.25, 0.55, 0.7], F)     // the little pool
  return y
}

/** A WORK BARGE loading at a concrete plant: black, low, the hold open and heaped with sand, the wheelhouse aft. */
export const workBarge: Builder = (out, L, B, seed) => {
  const r = rnd(seed)
  const trim = pick(r, [[0.7, 0.14, 0.12], [0.14, 0.32, 0.6], [0.85, 0.65, 0.15]] as Rgb[])
  const y = 0.8
  hull(out, L, B, -0.4, y, BARGE_HULL, DARK, trim, 0.12, null)
  const h = L / 2
  const hw = B / 2 - 0.3
  for (const s of [-1, 1]) box(out, s * hw, y + 0.4, 1.5, 0.15, 0.4, h - 6, DARK, F)
  box(out, 0, y - 0.3, 1.5, hw, 0.05, h - 6, [0.25, 0.25, 0.26], F)
  const cargo = pick(r, [[0.72, 0.6, 0.42], [0.55, 0.53, 0.5], [0.62, 0.5, 0.36]] as Rgb[])
  if (r() > 0.25) for (let z = -h + 9; z < h - 4; z += 7) wedge(out, 0, y + 0.3, z, hw - 0.1, 0.6, 3.2, 1.3, cargo, F)
  box(out, 0, y + 1.0, -h + 3.2, hw, 1.0, 2.2, WHITE, F)
  wheelhouse(out, -h + 3.6, y + 2, 1.2, 1.0, 1.8, WHITE, trim)
  return y
}

/** A PUSHER: short, broad, a tall wheelhouse amidships, push knees at the square bow. */
export const pusher: Builder = (out, L, B, seed) => {
  const r = rnd(seed)
  const c = pick(r, [[0.75, 0.15, 0.12], [0.12, 0.3, 0.55], [0.15, 0.4, 0.25]] as Rgb[])
  const y = 1.2
  hull(out, L, B, -0.4, y, BOX_HULL, DARK, c, 0.3, [0.3, 0.3, 0.32])
  const h = L / 2
  box(out, 0, y + 1.0, -1, B / 2 - 0.6, 1.0, L / 4, WHITE, F)
  wheelhouse(out, 0, y + 2, 1.4, 1.3, 2.2, WHITE, c)
  for (const s of [-1, 1]) box(out, s * (B / 2 - 0.8), y + 0.9, h + 0.15, 0.25, 0.9, 0.15, DARK, F)
  prism(out, 0, -1.5, y + 4.2, y + 6, 0.1, 6, DARK, F)
  return y
}

/** A PONTOON: the floating landing stage the tour boats and the Batobus tie to, a gangway to the quay. */
export const pontoon: Builder = (out, L, B, seed) => {
  const r = rnd(seed)
  const y = 0.7
  hull(out, L, B, -0.4, y, BOX_HULL, [0.3, 0.32, 0.34], [0.85, 0.75, 0.2], 0.1, [0.5, 0.5, 0.48])
  for (const s of [-1, 1]) railing(out, s * (B / 2 - 0.1), y, -L / 2 + 0.3, L / 2 - 0.3, STEEL, 1.0)
  if (r() > 0.4) {
    // a shelter with a ticket window
    box(out, -B / 4, y + 1.2, 0, B / 4 - 0.2, 1.2, 2.5, [0.9, 0.9, 0.86], F)
    box(out, -B / 4, y + 2.45, 0, B / 4, 0.06, 2.8, [0.2, 0.32, 0.5], F)
  }
  for (let z = -L / 2 + 2; z < L / 2; z += 6) prism(out, B / 2 - 0.4, z, y, y + 0.5, 0.15, 6, DARK, F)   // bollards
  return y
}

/** A POLICE or FIRE launch: navy and white (or red), a big wheelhouse, a light bar. */
export const police: Builder = (out, L, B, seed) => {
  const r = rnd(seed)
  const fire = r() > 0.5
  const c: Rgb = fire ? [0.75, 0.1, 0.1] : [0.1, 0.16, 0.35]
  const y = 1.0
  hull(out, L, B, -0.35, y, YACHT_HULL, c, WHITE, 0.2, [0.4, 0.42, 0.44])
  wheelhouse(out, -0.5, y, B / 2 - 0.5, L * 0.18, 2, WHITE, c)
  box(out, 0, y + 2.25, -0.5, 0.5, 0.08, 0.15, fire ? [0.95, 0.3, 0.2] : [0.25, 0.45, 0.95], EMIT)
  return y
}

/**
 * A FLOATING HOME: the wide modern ones (Neuilly, Javel — 9 m and more across, as no péniche is): a pontoon
 * carrying a one- or two-storey house in timber or white render, glazed to the water, a terrace round it.
 */
export const floatHome: Builder = (out, L, B, seed) => {
  const r = rnd(seed)
  const y = 0.8
  hull(out, L, B, -0.4, y, BOX_HULL, [0.28, 0.3, 0.32], null, 0, [0.5, 0.42, 0.32])
  const clad = pick(r, [[0.45, 0.32, 0.22], [0.93, 0.93, 0.9], [0.3, 0.3, 0.32], [0.62, 0.55, 0.45], [0.2, 0.42, 0.55], [0.75, 0.3, 0.2], [0.95, 0.78, 0.3], [0.4, 0.6, 0.45], [0.55, 0.7, 0.8]] as Rgb[])
  const two = r() > 0.45
  const hx = B / 2 - 1.3, hz = L / 2 - 2
  const H = 2.8
  box(out, 0, y + H / 2, 0, hx, H / 2, hz, clad, F)
  for (let z = -hz + 1; z < hz - 0.5; z += 2.4) for (const s of [-1, 1]) if (r() > 0.3) box(out, s * (hx + 0.02), y + 1.35, z + 0.6, 0.03, 1.1, 0.95, GLASS, F)
  if (two) {
    const z1 = hz * (0.3 + r() * 0.4)
    box(out, 0, y + H * 1.5, -hz + z1, hx - 0.4, H / 2, z1, pick(r, [clad, [0.93, 0.93, 0.9], [0.45, 0.32, 0.22]] as Rgb[]), F)
    windows(out, hx - 0.4, y + H * 1.55, -hz, -hz + 2 * z1, 1.3, 1.6, 2.6)
    box(out, 0, y + H * 2 + 0.05, -hz + z1, hx - 0.25, 0.05, z1 + 0.15, [0.3, 0.3, 0.32], F)
    for (const s of [-1, 1]) railing(out, s * hx, y + H, -hz + 2 * z1, hz, DARK)
    for (let z = -hz + 2 * z1 + 1; z < hz - 1; z += 3) planter(out, (r() - 0.5) * hx, y + H + 0.05, z, r)
  } else box(out, 0, y + H + 0.06, 0, hx + 0.3, 0.06, hz + 0.3, [0.3, 0.3, 0.32], F)
  for (const s of [-1, 1]) railing(out, s * (B / 2 - 0.15), y, -L / 2 + 0.4, L / 2 - 0.4, r() > 0.5 ? STEEL : DARK, 0.9)
  for (let i = 0; i < 3; i++) planter(out, (r() - 0.5) * B * 0.7, y, (r() > 0.5 ? 1 : -1) * (hz + 1), r)
  return y
}

export const MOORED: Record<MooredKind, Builder> = { peniche, dutch, cruiser, venue, tourBoat, hotel, workBarge, pusher, pontoon, police, floatHome }

/** green on the bow of so many: a tree in a tub (used by the named boats) */
export const tub = (out: MeshBuilder, x: number, y: number, z: number): void => {
  box(out, x, y + 0.3, z, 0.4, 0.3, 0.4, WOOD, F)
  prism(out, x, z, y + 0.6, y + 2.4, 0.7, 7, PLANT, F, 0.2)
}
