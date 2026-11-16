/**
 * THE BIG VISITORS to the Bay (owner, 2026-11-15: "a model of the Queen Mary II ocean liner, which occasionally visits";
 * "maybe some realistic US Navy ships in SF since they often visit" — Fleet Week, every October).
 *
 *  - QUEEN MARY 2 (Cunard, 2003): 345 × 41 m. The liner's look, not a cruise ship's: a tall BLACK hull with a red boot
 *    top and a thin white line, the orange lifeboats in a recess above it, the white superstructure stepped back to a
 *    raked front with the bridge and its wings, terraces down the stern, the long foredeck with its breakwater, and the
 *    big raked funnel in Cunard red with a black top and two black bands.
 *  - ARLEIGH BURKE destroyer (DDG-51 class): 155 × 20 m, haze grey. The flared, sharp bow; the 5-inch gun and the VLS
 *    hatches forward; the faceted deckhouse with the SPY-1 radar faces; the raked lattice mast; two squat funnels; the
 *    aft deckhouse and the flight deck at the stern.
 *  - NIMITZ-class carrier: 333 m, the flight deck 77 m wide with its angled deck to port; the island to starboard with
 *    its mast and radars; aircraft parked along the edges.
 *  - AMPHIBIOUS ASSAULT SHIP (Wasp/America class): 257 × 32 m, a full-length rectangular flight deck, the island to
 *    starboard, helicopters and tilt-rotors on deck.
 *
 * Local frame: +z the bow, the waterline y = 0; full length and beam. Each returns nothing (river-traffic takes the size
 * from the kind).
 */
import type { MeshBuilder } from '../buildings.ts'
import { box, prism, strut, wedge, EMIT, type Rgb } from '../models.ts'
import { DARK, GLASS, LIGHT, WHITE, F, hull, planTier, railing, type HullShape } from '../moored.ts'

// ── colours ──────────────────────────────────────────────────────────────────────────────────────────────
const CUNARD_RED: Rgb = [0.72, 0.12, 0.08]
const BOOT: Rgb = [0.55, 0.12, 0.1]
const HAZE: Rgb = [0.52, 0.55, 0.57]
const HAZE_DARK: Rgb = [0.4, 0.42, 0.44]
const NAVY_DECK: Rgb = [0.27, 0.28, 0.29]
const FLIGHT_DECK: Rgb = [0.22, 0.23, 0.24]
const MARK_W: Rgb = [0.9, 0.9, 0.86]
const MARK_Y: Rgb = [0.92, 0.75, 0.15]
const LIFEBOAT: Rgb = [0.97, 0.52, 0.1]

// ── tunables ─────────────────────────────────────────────────────────────────────────────────────────────
export const BIG_SIZES = {
  qm2: { L: 345, B: 41 }, destroyer: { L: 155, B: 20 }, carrier: { L: 333, B: 41 }, amphib: { L: 257, B: 32 },
} as const
/** the carrier's flight deck: its width, how far it overhangs, how many aircraft are parked */
const CARRIER = { deck: 77, angle: 0.16, aircraft: 22, deckY: 19 }
const AMPHIB = { deckY: 17, aircraft: 12 }

/** a flat slab over a convex polygon (x, z), from y0 to y1, its top in `top` and its edge in `side` */
function slab(out: MeshBuilder, poly: [number, number][], y0: number, y1: number, top: Rgb, side: Rgb): void {
  const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  const [cx, cz] = poly.reduce(([a, b], [x, z]) => [a + x / poly.length, b + z / poly.length], [0, 0])
  for (let i = 0; i < poly.length; i++) {
    const [x0, z0] = poly[i], [x1, z1] = poly[(i + 1) % poly.length]
    out.quad([[x0, y1, z0], [x1, y1, z1], [cx, y1, cz], [cx, y1, cz]], [0, 1, 0], UV, top, F)
    const nx = z1 - z0, nz = -(x1 - x0), l = Math.hypot(nx, nz) || 1
    out.quad([[x0, y0, z0], [x1, y0, z1], [x1, y1, z1], [x0, y1, z0]], [-nx / l, 0, -nz / l], UV, side, F)
    out.quad([[x0, y1, z0], [x1, y1, z1], [x1, y0, z1], [x0, y0, z0]], [nx / l, 0, nz / l], UV, side, F)
  }
}

// ── Queen Mary 2 ─────────────────────────────────────────────────────────────────────────────────────────

export function queenMary2(out: MeshBuilder, L: number = BIG_SIZES.qm2.L, B: number = BIG_SIZES.qm2.B): void {
  const h = L / 2
  const shape: HullShape = { bow: L * 0.2, bowN: 1.6, bowTip: 0.03, stern: L * 0.06, sternN: 2.2, sternTip: 0.6, sheer: 3 }
  const free = 16
  hull(out, L, B, -1, free, shape, DARK, WHITE, 0.7, [0.45, 0.42, 0.38])
  box(out, 0, 0.2, -4, B / 2 - 0.05, 0.9, h - L * 0.2, BOOT, F)
  // the hull's portholes, two rows of pale lights along the straight sides
  const zs0 = -h + L * 0.07, zs1 = h - L * 0.2
  for (const y of [free - 7, free - 4]) for (const sd of [-1, 1]) box(out, sd * (B / 2 + 0.02), y, (zs0 + zs1) / 2, 0.03, 0.35, (zs1 - zs0) / 2, [0.85, 0.84, 0.78], F)
  // the lifeboat recess over the black hull
  const lb = 4.2
  planTier(out, L, B, shape, -h + L * 0.1, h - L * 0.21, free, free + lb, 2.6, [0.88, 0.88, 0.85], false)
  for (let z = -h + L * 0.16; z < h - L * 0.3; z += 12) for (const sd of [-1, 1]) {
    box(out, sd * (B / 2 - 1.5), free + 2, z, 1.3, 1.0, 4.8, LIFEBOAT, F)
    box(out, sd * (B / 2 - 1.5), free + 3.1, z, 1.0, 0.12, 4.0, WHITE, F)
  }
  const y0 = free + lb
  planTier(out, L, B, shape, -h + L * 0.08, h - L * 0.2, y0 - 0.3, y0, 0, WHITE)
  // the superstructure: white decks, a glazed band each, raked back at the front and terraced down the stern
  const DH = 2.9, decks = 7
  const front = (d: number): number => h - L * 0.21 - d * 2.4
  const back = (d: number): number => -h + L * 0.07 + d * 5.5
  for (let d = 0; d < decks; d++) {
    const y = y0 + d * DH
    const z0 = back(d), z1 = front(d)
    planTier(out, L, B, shape, z0, z1, y, y + DH, 0.4 + (d > 4 ? 1.5 : 0), WHITE, true)
    for (const sd of [-1, 1]) box(out, sd * (B / 2 - 0.38 - (d > 4 ? 1.5 : 0)), y + 1.5, (z0 + z1) / 2, 0.03, 0.55, (z1 - z0) / 2 - 2, GLASS, F)
    // the stern terraces' rails
    railing(out, 0, y + DH, z0 - 0.2, z0, WHITE)
  }
  const top = y0 + decks * DH
  // the bridge, its wings out past the sides, its windows; the breakwater on the foredeck
  const bz = front(decks - 1) - 3
  box(out, 0, top + 1.5, bz, B / 2 + 1, 1.3, 3, WHITE, F)
  box(out, 0, top + 1.7, bz + 3.02, B / 2 - 1, 0.6, 0.03, GLASS, F)
  wedge(out, 0, free + 1.2, h - L * 0.13, B * 0.34, 1.2, 0.8, 0.5, WHITE, F)
  // the mast over the bridge
  prism(out, 0, bz - 6, top + 2.8, top + 16, 0.6, 4, WHITE, F, 0.3)
  box(out, 0, top + 16, bz - 6, 0.3, 0.3, 0.3, LIGHT, EMIT)
  // the funnel: Cunard red, a black top and two black bands, raked aft, wide
  const fz = -L * 0.1, fh = 15, fw = B * 0.19
  for (let k = 0; k < 4; k++) {
    const y = top + 0.5 + (fh / 4) * (k + 0.5)
    box(out, 0, y, fz - k * 1.4, fw * (1 - k * 0.05), fh / 8, fw * 1.9, CUNARD_RED, F)
  }
  for (const yb of [0.55, 0.68]) box(out, 0, top + fh * yb, fz - 1.4 * (yb * 4 - 0.5), fw + 0.05, 0.35, fw * 1.92, DARK, F)
  box(out, 0, top + fh + 1, fz - 5, fw * 0.95, 0.9, fw * 1.8, DARK, F)
  // the pools and their glass on the aft top deck, the sun decks' loungers
  const pz = back(decks - 1) + 18
  box(out, 0, top + 0.35, pz, B * 0.15, 0.05, 6, [0.25, 0.62, 0.78], F)
  for (const sd of [-1, 1]) railing(out, sd * (B / 2 - 2.2), top, back(decks - 1) + 1, bz - 4, WHITE)
}

// ── the destroyer ────────────────────────────────────────────────────────────────────────────────────────

export function destroyer(out: MeshBuilder, L: number = BIG_SIZES.destroyer.L, B: number = BIG_SIZES.destroyer.B): void {
  const h = L / 2
  const shape: HullShape = { bow: L * 0.35, bowN: 1.4, bowTip: 0.02, stern: L * 0.05, sternN: 2.5, sternTip: 0.8, sheer: 3 }
  const free = 6
  hull(out, L, B, -1, free, shape, HAZE, null, 0, NAVY_DECK)
  box(out, 0, 0.05, -2, B / 2 - 0.05, 0.35, h - L * 0.3, DARK, F)
  // the 5-inch gun forward, the VLS hatches before and abaft the deckhouse
  const gz = h - L * 0.2
  wedge(out, 0, free + 1.2, gz, 1.8, 1.0, 2.2, 0.6, HAZE, F)
  strut(out, [0, free + 1.4, gz + 1.5], [0, free + 1.9, gz + 8], 0.25, 0.25, HAZE_DARK, F)
  for (const [z, n] of [[h - L * 0.29, 8], [-h + L * 0.22, 8]] as const) for (let i = 0; i < n; i++) box(out, ((i % 4) - 1.5) * 1.6, free + 0.12, z + Math.floor(i / 4) * 1.8, 0.65, 0.08, 0.75, HAZE_DARK, F)
  // the forward deckhouse: faceted, its sides leaning in; the SPY-1 faces; the bridge windows
  const dz0 = -L * 0.1, dz1 = h - L * 0.36
  wedge(out, 0, free + 5, (dz0 + dz1) / 2, B * 0.42, 5, (dz1 - dz0) / 2, 1.4, HAZE, F)
  wedge(out, 0, free + 12, (dz0 + dz1) / 2 - 2, B * 0.3, 2, (dz1 - dz0) / 2 - 5, 0.8, HAZE, F)
  box(out, 0, free + 12.3, dz1 - 5.6, B * 0.25, 0.5, 0.05, DARK, F)
  for (const sd of [-1, 1]) box(out, sd * (B * 0.37), free + 8, dz1 - 7, 0.05, 1.8, 1.8, HAZE_DARK, F)
  box(out, 0, free + 8, dz1 - 0.6, 1.8, 1.8, 0.05, HAZE_DARK, F)
  // the raked mast, its yards
  strut(out, [0, free + 14, dz1 - 12], [0, free + 30, dz1 - 16], 1.0, 1.0, HAZE, F)
  for (const y of [22, 27]) box(out, 0, free + y, dz1 - 13.5 - (y - 14) * 0.25, 3.5 - (y - 22) * 0.3, 0.12, 0.2, HAZE, F)
  // the two funnels: squat, their exhausts black
  for (const z of [-L * 0.06, -L * 0.2]) {
    wedge(out, 0, free + 6.5, z, 2.3, 4, 3.2, 0.5, HAZE, F)
    box(out, 0, free + 10.7, z, 1.5, 0.3, 2.4, DARK, F)
  }
  // the aft deckhouse and the hangar, the flight deck behind them with its markings
  box(out, 0, free + 3, -L * 0.29, B * 0.4, 3, L * 0.06, HAZE, F)
  box(out, 0, free + 0.03, -h + L * 0.08, B * 0.3, 0.02, L * 0.05, MARK_W, F)
  box(out, 0, free + 0.05, -h + L * 0.08, B * 0.27, 0.02, L * 0.045, NAVY_DECK, F)
  for (const sd of [-1, 1]) railing(out, sd * (B / 2 - 0.3), free, -h + 2, h - L * 0.25, HAZE)
}

// ── the carrier ──────────────────────────────────────────────────────────────────────────────────────────

/** a parked aircraft: fuselage, swept wings, tail, nose to +z, at (x, y, z) turned by `a` */
function aircraft(out: MeshBuilder, x: number, y: number, z: number, a: number, s = 1, heli = false): void {
  const c = Math.cos(a), sn = Math.sin(a)
  const P = (dx: number, dy: number, dz: number): [number, number, number] => [x + dx * c + dz * sn, y + dy, z - dx * sn + dz * c]
  const col: Rgb = [0.58, 0.6, 0.62]
  strut(out, P(0, 0.9 * s, -7 * s), P(0, 0.9 * s, 7 * s), 1.4 * s, 1.4 * s, col, F)
  if (heli) {
    strut(out, P(-7 * s, 2.1 * s, 0), P(7 * s, 2.1 * s, 0), 0.4 * s, 0.1 * s, DARK, F, false)
    strut(out, P(0, 2.1 * s, -7 * s), P(0, 2.1 * s, 7 * s), 0.4 * s, 0.1 * s, DARK, F, false)
    return
  }
  strut(out, P(-5.5 * s, 0.9 * s, -1.5 * s), P(5.5 * s, 0.9 * s, -1.5 * s), 3.2 * s, 0.25 * s, col, F)
  strut(out, P(0, 1.2 * s, -6 * s), P(0, 3.6 * s, -6.5 * s), 1.6 * s, 0.25 * s, col, F)
}

export function carrier(out: MeshBuilder, L: number = BIG_SIZES.carrier.L, B: number = BIG_SIZES.carrier.B): void {
  const h = L / 2
  const shape: HullShape = { bow: L * 0.22, bowN: 1.5, bowTip: 0.05, stern: L * 0.04, sternN: 3, sternTip: 0.85, sheer: 1 }
  const y = CARRIER.deckY
  hull(out, L, B, -1, y - 3, shape, HAZE, null, 0, null)
  box(out, 0, 0, -6, B / 2 - 0.05, 0.6, h - L * 0.22, DARK, F)
  // the hangar's sides up to the flight deck, and the flight deck: wider than the hull, its angled deck out to port
  box(out, 0, y - 2.5, -4, B / 2 + 4, 2.5, h - 30, HAZE, F)
  const W = CARRIER.deck / 2
  const deck: [number, number][] = [[B / 2 + 8, -h + 2], [B / 2 + 10, h - 70], [8, h], [-12, h], [-B / 2 - 1, h - 60],
    [-W, -h + 120], [-W + 4, -h + 30], [-B / 2 - 2, -h + 2]]
  slab(out, deck, y - 1.2, y, FLIGHT_DECK, HAZE)
  // the markings: the angled deck's centreline and edges, the bow cats' tracks
  const ang = CARRIER.angle
  for (let t = -120; t < 120; t += 14) box(out, -12 - Math.sin(ang) * t, y + 0.03, -h + 150 + Math.cos(ang) * t, 0.4, 0.02, 4, MARK_W, F)
  for (const sd of [-1, 1]) box(out, sd * 5 + 2, y + 0.03, h - 50, 0.3, 0.02, 40, MARK_Y, F)
  box(out, -12 + Math.sin(ang) * 0, y + 0.02, -h + 40, 12, 0.02, 0.4, MARK_W, F)
  // the island to starboard: block, bridge glass, mast and radars
  const ix = B / 2 + 4, iz = -L * 0.12
  box(out, ix, y + 9, iz, 4, 9, 14, HAZE, F)
  box(out, ix, y + 15, iz + 6, 4.1, 0.9, 7, DARK, F)
  box(out, ix, y + 18.5, iz + 3, 3, 1.5, 6, HAZE, F)
  prism(out, ix, iz - 2, y + 20, y + 38, 0.8, 4, HAZE, F, 0.4)
  box(out, ix, y + 31, iz - 2, 3.5, 0.2, 0.5, HAZE, F)
  box(out, ix, y + 26, iz - 2, 0.2, 2, 2.6, HAZE_DARK, F)
  box(out, ix - 4.05, y + 12, iz + 3, 0.05, 2, 1.6, MARK_W, F)
  // the air wing parked along the starboard edge forward and aft of the island, and on the bow
  for (let i = 0; i < CARRIER.aircraft; i++) {
    const fwd = i < CARRIER.aircraft / 2
    const z = fwd ? h - 30 - (i % 11) * 14 : -h + 30 + (i % 11) * 13
    const x = fwd ? (i % 2 ? B / 2 - 2 : B / 2 - 14) : B / 2 + 1 - (i % 2) * 11
    if (Math.abs(z - iz) < 22) continue
    aircraft(out, x, y, z, fwd ? -2.3 : 2.4, 1)
  }
}

// ── the amphibious assault ship ──────────────────────────────────────────────────────────────────────────

export function amphib(out: MeshBuilder, L: number = BIG_SIZES.amphib.L, B: number = BIG_SIZES.amphib.B): void {
  const h = L / 2
  const shape: HullShape = { bow: L * 0.15, bowN: 1.8, bowTip: 0.2, stern: L * 0.02, sternN: 4, sternTip: 0.95, sheer: 1.2 }
  const y = AMPHIB.deckY
  hull(out, L, B, -1, y - 1.2, shape, HAZE, null, 0, null)
  box(out, 0, 0, -4, B / 2 - 0.05, 0.6, h - L * 0.16, DARK, F)
  const W = B / 2 + 2
  slab(out, [[W, -h + 1], [W, h - 30], [W - 6, h - 4], [-W + 6, h - 4], [-W, h - 30], [-W, -h + 1]], y - 1.2, y, FLIGHT_DECK, HAZE)
  // the landing spots down the port side
  for (let k = 0; k < 6; k++) {
    const z = h - 40 - k * 36
    box(out, -W + 9, y + 0.03, z, 7, 0.02, 0.25, MARK_W, F)
    box(out, -W + 9, y + 0.03, z, 0.25, 0.02, 7, MARK_W, F)
  }
  box(out, 2, y + 0.02, 0, 0.3, 0.02, h - 12, MARK_Y, F)
  // the island
  const ix = W - 5, iz = -L * 0.02
  box(out, ix, y + 8, iz, 4.2, 8, 22, HAZE, F)
  box(out, ix, y + 12.5, iz + 10, 4.3, 1, 8, DARK, F)
  box(out, ix, y + 17, iz + 4, 3.2, 1.2, 9, HAZE, F)
  prism(out, ix, iz - 4, y + 18, y + 33, 0.7, 4, HAZE, F, 0.35)
  for (const z of [iz - 14, iz - 5]) box(out, ix, y + 17.5, z, 2.8, 1.5, 2.8, HAZE, F)
  // helicopters and tilt-rotors on deck
  for (let i = 0; i < AMPHIB.aircraft; i++) {
    const z = h - 45 - i * 17
    aircraft(out, -W + 9 + (i % 3) * 6, y, z, 0.3, 0.75, i % 2 === 0)
  }
}
