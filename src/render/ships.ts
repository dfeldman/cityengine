/**
 * BIG SHIPS (owner, 2026-11-15: "very large container ships and cruise ships as well, in a few varieties … even
 * though these are not fully realistic"): container ships from the Seine's 110 m container barge to a 300 m
 * ocean box ship, and cruise ships from the river hotel boat to the ocean liner. Shared by every region (the Bay's
 * routes, the Seine's traffic). Local +z forward, waterline at y = 0, fitted to the L × B given; varieties by seed.
 *
 * Kept cheap enough to run several at once: containers are drawn a STACK at a time (one box per bay and row,
 * banded by tier with a dark seam), cabins as window bands, not windows.
 */
import type { MeshBuilder } from './buildings.ts'
import { box, prism, EMIT, type Rgb } from './models.ts'
import { DARK, GLASS, LIGHT, SHIP_HULL, STEEL, WHITE, F, hull, pick, planTier, railing, rnd, type HullShape } from './moored.ts'

const BOX_COLOURS: Rgb[] = [
  [0.7, 0.13, 0.11], [0.12, 0.3, 0.6], [0.15, 0.45, 0.3], [0.85, 0.55, 0.12], [0.55, 0.56, 0.58], [0.9, 0.9, 0.88],
  [0.3, 0.18, 0.12], [0.08, 0.22, 0.4], [0.75, 0.3, 0.1], [0.45, 0.12, 0.35], [0.2, 0.55, 0.6], [0.6, 0.15, 0.12],
]
/** container ship liveries: hull, boot top, superstructure */
const LINER_LIVERIES: [Rgb, Rgb, Rgb][] = [
  [[0.12, 0.2, 0.42], [0.55, 0.12, 0.1], WHITE],       // navy, red bottom
  [[0.1, 0.11, 0.13], [0.55, 0.12, 0.1], WHITE],
  [[0.15, 0.45, 0.35], [0.55, 0.12, 0.1], WHITE],      // green
  [[0.55, 0.62, 0.68], [0.55, 0.12, 0.1], WHITE],      // light blue-grey
  [[0.6, 0.1, 0.08], [0.25, 0.25, 0.27], WHITE],       // red
]

const OCEAN_HULL: HullShape = { bow: 30, bowN: 1.6, bowTip: 0.04, stern: 14, sternN: 2.4, sternTip: 0.6, sheer: 2 }
const LINER_HULL: HullShape = { bow: 40, bowN: 1.5, bowTip: 0.03, stern: 16, sternN: 2.6, sternTip: 0.55, sheer: 1.5 }

/** a container: 12.2 × 2.44 × 2.59 m (a 40 ft box) */
const CL = 12.2, CW = 2.44, CH = 2.59

/**
 * A CONTAINER SHIP. Above 150 m an ocean ship — a high dark hull, the bridge aft (or a third of the way forward
 * on the newest, `seed` decides), stacks up to `tiers` high in bays between lashing bridges. Below, the Seine's
 * container barge: low in the water, two or three tiers, the wheelhouse aft on its tall post.
 */
export function containerShip(out: MeshBuilder, L: number, B: number, seed: number): void {
  const r = rnd(seed)
  const ocean = L > 150
  const [hc, boot, sup] = ocean ? pick(r, LINER_LIVERIES) : [[0.12, 0.13, 0.15] as Rgb, [0.55, 0.12, 0.1] as Rgb, WHITE]
  const free = ocean ? 3 + B * 0.18 : 0.9                  // the hull's side above the water
  hull(out, L, B, -0.6, free, ocean ? OCEAN_HULL : { ...SHIP_HULL, bow: 6 }, hc, ocean ? hc : [0.85, 0.65, 0.15], 0.3, [0.32, 0.34, 0.33])
  box(out, 0, 0.1, -L * 0.02, B / 2 - 0.05, 0.5, L / 2 - (ocean ? 24 : 6), boot, F)
  const h = L / 2
  const forwardBridge = ocean && r() > 0.65
  const bridgeZ = forwardBridge ? h - L * 0.3 : -h + (ocean ? 22 : 7)
  const tiers = ocean ? 4 + Math.floor(r() * 4) : 2 + Math.floor(r() * 2)
  const rows = Math.max(2, Math.floor((B - 1.5) / CW))
  const x0 = -((rows - 1) * CW) / 2
  const fill = 0.75 + r() * 0.25
  // bays from behind the forecastle to the stern, skipping the bridge's own length
  const zFore = h - (ocean ? 28 : 7), zAft = -h + (ocean ? 10 : 12)
  for (let z = zFore - CL / 2; z > zAft; z -= CL + (ocean ? 0.9 : 0.3)) {
    if (Math.abs(z - bridgeZ) < (ocean ? 12 : 6)) continue
    // a stack per row, its height varying; the bow and stern bays lower where the hull narrows
    const taper = ocean ? Math.min(1, (h - Math.abs(z)) / 45) : 1
    for (let i = 0; i < rows; i++) {
      const x = x0 + i * CW
      if (Math.abs(x) > (B / 2 - 0.8) * Math.min(1, taper + 0.3)) continue
      const n = Math.max(0, Math.round(tiers * taper * (r() < fill ? 1 : r())))
      for (let t = 0; t < n; t++) box(out, x, free + CH * t + CH / 2, z, CW / 2 - 0.04, CH / 2 - 0.05, CL / 2 - 0.05, BOX_COLOURS[Math.floor(r() * BOX_COLOURS.length)], F)
    }
    if (ocean) for (const s of [-1, 1]) box(out, s * (B / 2 - 0.3), free + 2, z - CL / 2 - 0.45, 0.25, 2, 0.3, STEEL, F)    // the lashing bridge's ends
  }
  // the bridge: a tall white block, its bridge deck's windows, wings, a funnel behind (or beside, forward-bridged)
  const bh = ocean ? CH * tiers + 12 : 6.5
  const bw = ocean ? B / 2 - 2 : 2
  const bd = ocean ? 7 : 2
  box(out, 0, free + bh / 2, bridgeZ, bw, bh / 2, bd, sup, F)
  for (let y = free + 3; y < free + bh - 3; y += 2.8) box(out, 0, y, bridgeZ + bd + 0.02, bw - 0.6, 0.45, 0.03, GLASS, F)
  box(out, 0, free + bh - 1.2, bridgeZ, bw + 0.03, 0.9, bd + 0.03, GLASS, F)
  if (ocean) box(out, 0, free + bh - 0.5, bridgeZ + 1, B / 2 + 0.6, 0.35, 2.2, sup, F)                   // bridge wings
  const fz = forwardBridge ? -h + 18 : bridgeZ - bd - 4
  if (ocean) {
    box(out, 0, free + bh * 0.55, fz, 3.5, bh * 0.55, 3, pick(r, [boot, DARK, sup, [0.85, 0.65, 0.15]] as Rgb[]), F)
    box(out, 0, free + bh * 1.1 + 0.4, fz, 3.6, 0.4, 3.1, DARK, F)
  }
  prism(out, 0, bridgeZ, free + bh, free + bh + (ocean ? 6 : 2.5), 0.2, 4, sup, F)
  box(out, 0, free + bh + (ocean ? 6 : 2.5), bridgeZ, 0.15, 0.15, 0.15, LIGHT, EMIT)
}

/**
 * A CRUISE SHIP. Three looks:
 * - `modern`: white from the boot top up, a dark band of hull windows, the lifeboats in a recess along both
 *   sides, then a dozen decks of balconies that run out into the bow's curve, raked back at the front and
 *   terraced at the stern; the bridge with its wings at the front of the top, a big raked funnel aft, and on top
 *   the pools behind glass windscreens, the slides, a sports court, a glass dome.
 * - `classic`: a dark hull up to the promenade, fewer decks, stepped back at both ends, windows not balconies,
 *   a tall raked funnel amidships in the company colour.
 * - `expedition` (below 140 m): a dark or red hull, a short white block stepped aft, the bridge forward.
 */
export function cruiseShip(out: MeshBuilder, L: number, B: number, seed: number, only?: 'modern' | 'classic' | 'expedition'): void {
  const r = rnd(seed)
  const picked = L < 140 ? 'expedition' : pick(r, ['modern', 'modern', 'classic'] as const)
  const look = only ?? picked
  const modern = look === 'modern'
  const h = L / 2
  const accent: Rgb = pick(r, [[0.1, 0.2, 0.45], [0.1, 0.11, 0.13], [0.6, 0.1, 0.08], [0.1, 0.4, 0.5], [0.85, 0.65, 0.15]] as Rgb[])
  const hullC: Rgb = modern ? WHITE : look === 'classic' ? pick(r, [DARK, [0.1, 0.2, 0.45]] as Rgb[]) : pick(r, [DARK, [0.6, 0.1, 0.08], [0.1, 0.2, 0.45]] as Rgb[])
  const shape: HullShape = { ...LINER_HULL, bow: L * 0.16, stern: L * 0.05, sternTip: 0.75, sheer: modern ? 0.6 : 1.5 }
  const deckH = 2.9
  const free = (look === 'expedition' ? 2 : 3) * deckH         // the hull: three decks of cabins below the lifeboats
  hull(out, L, B, -0.6, free, shape, hullC, null, 0, [0.42, 0.47, 0.46])
  box(out, 0, 0.3, -2, B / 2 - 0.05, 0.7, h - L * 0.18, look === 'classic' ? [0.55, 0.12, 0.1] : accent, F)   // the boot top
  // the hull's windows: two rows of small dark panes on the straight sides
  const zs0 = -h + L * 0.06, zs1 = h - L * 0.17
  for (const y of [free - 4.3, free - 1.5]) for (const sd of [-1, 1]) box(out, sd * (B / 2 + 0.02), y, (zs0 + zs1) / 2, 0.03, 0.4, (zs1 - zs0) / 2, modern ? [0.22, 0.27, 0.32] : [0.85, 0.85, 0.82], F)
  // the lifeboat deck: a recess along both sides, the boats hung in it, orange
  const lb = 3.6
  planTier(out, L, B, shape, -h + L * 0.08, h - L * 0.11, free, free + lb, 2.2, [0.3, 0.32, 0.34], false)
  for (let z = -h + L * 0.16; z < h - L * 0.26; z += 11) for (const sd of [-1, 1]) {
    box(out, sd * (B / 2 - 1.3), free + 1.7, z, 1.15, 0.95, 4.3, [0.97, 0.52, 0.1], F)
    box(out, sd * (B / 2 - 1.3), free + 2.75, z, 0.9, 0.12, 3.6, WHITE, F)
  }
  const y0 = free + lb
  planTier(out, L, B, shape, -h + L * 0.07, h - L * 0.1, y0 - 0.25, y0, 0, WHITE)                   // the promenade's deckhead
  // the decks above: each a white floor slab and its balcony band set back, the whole raked at the front, terraced aft
  const decks = modern ? Math.max(6, Math.round(B / 3.3)) : look === 'classic' ? 5 + Math.floor(r() * 2) : 4
  const front = (d: number): number => h - L * (modern ? 0.075 : 0.15) - d * (modern ? 1.3 : 2.6)
  const back = (d: number): number => -h + L * 0.06 + (modern ? Math.max(0, d - decks + 5) * 4.5 : d * 3.5 + (look === 'expedition' ? L * 0.15 : 0))
  for (let d = 0; d < decks; d++) {
    const y = y0 + d * deckH
    const z0 = back(d), z1 = front(d)
    if (z1 - z0 < 12) break
    planTier(out, L, B, shape, z0, z1, y, y + 0.45, modern ? 0 : 0.3, WHITE)
    planTier(out, L, B, shape, z0 + 0.6, z1 - 0.6, y + 0.45, y + deckH, modern ? 0.9 : 0.3, modern ? [0.3, 0.37, 0.43] : WHITE, false)
    if (!modern) for (const sd of [-1, 1]) box(out, sd * (B / 2 - 0.27), y + 1.6, (z0 + z1) / 2, 0.03, 0.45, (z1 - z0) / 2 - 2, GLASS, F)
    // the balcony rails, white, a line along each deck's edge
    if (modern) planTier(out, L, B, shape, z0 + 0.3, z1 - 0.3, y + 1.35, y + 1.45, 0.05, WHITE, false)
  }
  const top = y0 + decks * deckH
  if (modern) {
    // the balconies' dividers: white strips down the whole face where every deck reaches, a cabin's width apart
    const zc0 = back(decks - 1) + 1, zc1 = Math.min(front(decks - 1), h - L * 0.16) - 1
    for (let z = zc0; z < zc1; z += 4.2) for (const sd of [-1, 1]) box(out, sd * (B / 2 - 0.45), (y0 + top) / 2, z, 0.45, (top - y0) / 2, 0.09, WHITE, F)
  }
  // the roof of the top deck, out to its edges
  planTier(out, L, B, shape, back(decks - 1), front(decks - 1), top, top + 0.3, 0.2, WHITE)
  // the bridge at the front of the top, its wings out past the sides; the forward lounge's glass under it
  const bz = front(decks - 1) - 4
  box(out, 0, top + 1.4, bz, B / 2 + 1.2, 1.1, 2.4, WHITE, F)
  box(out, 0, top + 1.55, bz + 2.42, B / 2 - 0.5, 0.55, 0.03, GLASS, F)
  // the funnel: raked, in three steps, the company colour on its upper part, black at the top
  const fz = modern ? -h + L * 0.24 : -L * 0.04
  const fh = look === 'expedition' ? 7 : modern ? 19 : 15
  const fw = look === 'expedition' ? 2.4 : B * 0.17
  for (let k = 0; k < 3; k++) {
    box(out, 0, top + 0.3 + (fh / 3) * (k + 0.5), fz - k * 1.6, fw * (1 - k * 0.06), fh / 6, fw * 2.1, k === 2 || look === 'classic' ? accent : WHITE, F)
  }
  box(out, 0, top + 0.5 + fh, fz - 3.4, fw * 0.8, 0.35, fw * 1.9, DARK, F)
  if (look !== 'expedition') {
    // the pool deck between bridge and funnel: pools, glass windscreens round them, loungers, a dome, the slides
    const pz = (fz + bz) / 2
    for (const dz of [-10, 8]) box(out, 0, top + 0.35, pz + dz, B * 0.18, 0.05, 5, [0.25, 0.62, 0.78], F)
    for (const sd of [-1, 1]) box(out, sd * (B / 2 - 1.5), top + 1.3, pz, 0.04, 1.0, 22, GLASS, F)
    for (let z = pz - 20; z < pz + 20; z += 1.6) for (const sd of [-1, 1]) if (r() > 0.35) box(out, sd * (B * 0.3), top + 0.5, z, 0.35, 0.15, 0.8, WHITE, F)
    prism(out, 0, pz - 26, top + 0.3, top + 5, B * 0.2, 10, GLASS, F, B * 0.05)
    if (modern) {
      box(out, B * 0.2, top + 0.4, fz - fw * 2.4 - 10, B * 0.15, 0.08, 7, [0.25, 0.5, 0.3], F)                 // the sports court
      for (let k = 0; k < 8; k++) {
        const a = k * 0.9
        box(out, Math.sin(a) * 3.5 - B * 0.15, top + 1.5 + k * 1.1, fz + fw * 2.4 + 4 + Math.cos(a) * 3.5, 1.4, 0.45, 0.45, pick(r, [[0.95, 0.75, 0.1], [0.2, 0.5, 0.85], [0.9, 0.3, 0.2]] as Rgb[]), F)
      }
    }
    for (const sd of [-1, 1]) railing(out, sd * (B / 2 - 0.4), top + 0.3, back(decks - 1) + 1, bz - 3, WHITE)
  }
  // the mast over the bridge, its light
  prism(out, 0, bz - 1, top + 2.5, top + 9, 0.25, 4, WHITE, F)
  box(out, 0, top + 9, bz - 1, 0.2, 0.2, 0.2, LIGHT, EMIT)
}

/** the sizes the varieties come in, for whoever places them: container (river barge, feeder, panamax, ULCV) and cruise (expedition, mid, mega) */
export const SHIP_SIZES = {
  containerBarge: { L: 110, B: 11.4 }, feeder: { L: 160, B: 25 }, panamax: { L: 290, B: 32 }, ulcv: { L: 360, B: 51 },
  expedition: { L: 120, B: 19 }, cruiseMid: { L: 240, B: 30 }, cruiseMega: { L: 330, B: 40 },
} as const
