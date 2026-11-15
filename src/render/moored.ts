/**
 * The library of MOORED boats (owner, 2026-11-15: "the seine is almost completely lined with boats … barges,
 * restaurants, many houseboats, a swimming pool … a small low conventional building on the shore connected to
 * the boat"). Each builder draws one boat along local +z (bow forward), centred at the origin, its waterline at
 * y = 0, fitted to the length and beam it is given, and returns the height of its main deck (where a gangway
 * lands). Variants, colours and deck clutter come from the seed, as real boats differ.
 *
 * The hull is one shared shape (`hull`): a plan outline whose bow and stern taper as superellipses — blunt for
 * a péniche's spoon bow, round for a Dutch barge, sharp for a cruiser or a hotel ship — extruded to the
 * freeboard with a coloured sheer strake and a deck.
 *
 * Every number a look depends on is a named constant or a field of the kind's shape, so a look is tuned, not rewritten.
 */
import type { MeshBuilder } from './buildings.ts'
import { box, prism, strut, wedge, EMIT, type Rgb } from './models.ts'

export const F = 0
export const DARK: Rgb = [0.1, 0.11, 0.13]
export const GLASS: Rgb = [0.15, 0.22, 0.28]
export const WHITE: Rgb = [0.93, 0.93, 0.9]
export const WOOD: Rgb = [0.5, 0.33, 0.2]
export const VARNISH: Rgb = [0.58, 0.36, 0.18]
export const STEEL: Rgb = [0.42, 0.44, 0.46]
export const PLANT: Rgb = [0.22, 0.44, 0.2]
export const PLANT2: Rgb = [0.32, 0.52, 0.22]
export const POT: Rgb = [0.62, 0.34, 0.22]
export const LIGHT: Rgb = [1, 0.85, 0.55]

/** péniche hulls: black above all, then the navy, green, maroon and grey they are repainted */
export const HULLS: Rgb[] = [DARK, DARK, [0.1, 0.16, 0.28], [0.12, 0.3, 0.55], [0.1, 0.42, 0.45], [0.15, 0.38, 0.2], [0.6, 0.12, 0.1], [0.4, 0.09, 0.08], [0.12, 0.3, 0.38], [0.55, 0.4, 0.12], [0.3, 0.15, 0.35]]
/** the sheer strake along the top of the hull: white, red, green, yellow, blue */
export const BANDS: Rgb[] = [[0.9, 0.9, 0.86], [0.72, 0.13, 0.11], [0.2, 0.55, 0.3], [0.95, 0.75, 0.15], [0.2, 0.42, 0.75], [0.95, 0.5, 0.15], [0.25, 0.65, 0.7]]
/** deckhouses: cream, white, varnished wood, pale grey, and the odd bold one */
export const CABINS: Rgb[] = [[0.9, 0.87, 0.8], [0.95, 0.94, 0.9], VARNISH, WOOD, [0.95, 0.78, 0.3], [0.5, 0.72, 0.82], [0.85, 0.55, 0.55], [0.5, 0.68, 0.48], [0.9, 0.55, 0.25], [0.2, 0.45, 0.55], [0.62, 0.15, 0.13], [0.2, 0.32, 0.48], [0.88, 0.82, 0.55], [0.6, 0.45, 0.7]]
const PARASOLS: Rgb[] = [[0.85, 0.2, 0.17], [0.92, 0.9, 0.84], [0.2, 0.4, 0.7], [0.3, 0.55, 0.3], [0.95, 0.7, 0.2]]

export const rnd = (seed: number): (() => number) => {
  let s = (seed ^ 0x5bd1e995) >>> 0
  return () => { s = (Math.imul(s ^ (s >>> 15), 0x2c1b3c6d) + 0x9e3779b9) >>> 0; return (s % 10000) / 10000 }
}
export const pick = <T>(r: () => number, a: T[]): T => a[Math.floor(r() * a.length) % a.length]

/**
 * A hull's plan: the bow and stern tapers, each `len` metres long, narrowing as a superellipse of exponent `n`
 * (1.2 sharp … 2 round … 4 blunt) to `tip` × the half-beam at the very end; `sheer` lifts the deck at the bow.
 */
export interface HullShape { bow: number; bowN: number; bowTip: number; stern: number; sternN: number; sternTip: number; sheer?: number; sternSheer?: number }

export const PENICHE_HULL: HullShape = { bow: 3.2, bowN: 2.6, bowTip: 0.5, stern: 2.2, sternN: 2.2, sternTip: 0.55, sheer: 0.25, sternSheer: 0.1 }
export const DUTCH_HULL: HullShape = { bow: 4, bowN: 1.7, bowTip: 0.12, stern: 3, sternN: 1.8, sternTip: 0.3, sheer: 0.55, sternSheer: 0.25 }
export const TJALK_HULL: HullShape = { bow: 3.5, bowN: 1.5, bowTip: 0.15, stern: 3, sternN: 1.5, sternTip: 0.15, sheer: 0.7, sternSheer: 0.45 }
export const YACHT_HULL: HullShape = { bow: 4, bowN: 1.25, bowTip: 0.04, stern: 0.6, sternN: 3, sternTip: 0.85, sheer: 0.3 }
export const SHIP_HULL: HullShape = { bow: 9, bowN: 1.4, bowTip: 0.06, stern: 4, sternN: 2.4, sternTip: 0.55, sheer: 0.4 }
export const BARGE_HULL: HullShape = { bow: 2.4, bowN: 3, bowTip: 0.62, stern: 1.6, sternN: 2.5, sternTip: 0.65, sheer: 0.1 }
export const BOX_HULL: HullShape = { bow: 0.3, bowN: 4, bowTip: 0.9, stern: 0.3, sternN: 4, sternTip: 0.9 }

const TAPER_STEPS = 6

/** the hull's half-width at z (−L/2 stern … +L/2 bow), and how far its deck rises there */
function station(z: number, L: number, B: number, s: HullShape): { w: number; rise: number } {
  const h = L / 2
  const bowLen = Math.min(s.bow, L * 0.4)
  const sternLen = Math.min(s.stern, L * 0.3)
  if (z > h - bowLen) {
    const t = Math.min(1, (z - (h - bowLen)) / bowLen)
    return { w: (B / 2) * Math.max(s.bowTip, Math.pow(Math.max(0, 1 - Math.pow(t, s.bowN)), 1 / s.bowN)), rise: (s.sheer ?? 0) * t * t }
  }
  if (z < -h + sternLen) {
    const t = Math.min(1, (-h + sternLen - z) / sternLen)
    return { w: (B / 2) * Math.max(s.sternTip, Math.pow(Math.max(0, 1 - Math.pow(t, s.sternN)), 1 / s.sternN)), rise: (s.sternSheer ?? 0) * t * t }
  }
  return { w: B / 2, rise: 0 }
}

function stations(L: number, B: number, s: HullShape): { z: number; w: number; rise: number }[] {
  const h = L / 2
  const bowLen = Math.min(s.bow, L * 0.4)
  const sternLen = Math.min(s.stern, L * 0.3)
  const zs: number[] = []
  for (let i = 0; i <= TAPER_STEPS; i++) zs.push(-h + (sternLen * i) / TAPER_STEPS)
  for (let i = 0; i <= TAPER_STEPS; i++) zs.push(h - bowLen + (bowLen * i) / TAPER_STEPS)
  return zs.map((z) => ({ z, ...station(z, L, B, s) }))
}

/**
 * The hull: from `y0` (below the water) up to `y1` at the sides, in `colour`, the top `bandH` of it in `band`,
 * and a deck over it in `deck` (none when null). Returns nothing; the deck is at y1 (+ the sheer forward).
 */
export function hull(out: MeshBuilder, L: number, B: number, y0: number, y1: number, s: HullShape, colour: Rgb, band: Rgb | null, bandH: number, deck: Rgb | null): void {
  const st = stations(L, B, s)
  const side = (ya: (i: number) => number, yb: (i: number) => number, c: Rgb): void => {
    for (let i = 0; i + 1 < st.length; i++) {
      const a = st[i], b = st[i + 1]
      const dz = b.z - a.z, dw = b.w - a.w
      const n = Math.hypot(dz, dw) || 1
      for (const sg of [1, -1]) {
        out.quad([[sg * a.w, ya(i), a.z], [sg * b.w, ya(i + 1), b.z], [sg * b.w, yb(i + 1), b.z], [sg * a.w, yb(i), a.z]],
          [(sg * dz) / n, 0, -dw / n], [[0, 0], [1, 0], [1, 1], [0, 1]], c, F)
      }
    }
    // the flat of the transom and the stem, where the tapers stop short of a point
    for (const [i, nz] of [[0, -1], [st.length - 1, 1]] as const) {
      const p = st[i]
      if (p.w < 0.02) continue
      out.quad([[-p.w, ya(i), p.z], [p.w, ya(i), p.z], [p.w, yb(i), p.z], [-p.w, yb(i), p.z]], [0, 0, nz], [[0, 0], [1, 0], [1, 1], [0, 1]], c, F)
    }
  }
  const top = (i: number): number => y1 + st[i].rise
  if (band) {
    side(() => y0, (i) => top(i) - bandH, colour)
    side((i) => top(i) - bandH, top, band)
  } else side(() => y0, top, colour)
  if (!deck) return
  // the deck: a fan over the outline (convex), a hair under the top so the strake's edge reads
  const dy = 0.01
  for (let i = 0; i + 1 < st.length; i++) {
    const a = st[i], b = st[i + 1]
    out.quad([[-a.w, top(i) - dy, a.z], [a.w, top(i) - dy, a.z], [b.w, top(i + 1) - dy, b.z], [-b.w, top(i + 1) - dy, b.z]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], deck, F)
  }
}

/** the half-width of a hull at z, for laying things along its deck edge */
export const halfWidthAt = (z: number, L: number, B: number, s: HullShape): number => station(z, L, B, s).w

// ── the small things on deck ─────────────────────────────────────────────────────────────────────────────

/** a row of dark windows along both sides of a deckhouse */
export function windows(out: MeshBuilder, hx: number, y: number, z0: number, z1: number, h: number, w: number, pitch: number, c: Rgb = DARK): void {
  for (let z = z0 + pitch / 2; z < z1 - w / 2; z += pitch) for (const s of [-1, 1]) box(out, s * (hx + 0.02), y, z, 0.03, h / 2, w / 2, c, F)
}

export function planter(out: MeshBuilder, x: number, y: number, z: number, r: () => number): void {
  const big = r() > 0.6
  box(out, x, y + 0.2, z, 0.28, 0.2, big ? 0.5 : 0.28, r() > 0.5 ? POT : [0.3, 0.3, 0.3], F)
  const ph = 0.3 + r() * (big ? 1.1 : 0.6)
  prism(out, x, z, y + 0.38, y + 0.38 + ph, big ? 0.5 : 0.36, 6, r() > 0.5 ? PLANT : PLANT2, F, 0.2)
}

export function parasol(out: MeshBuilder, x: number, y: number, z: number, r: () => number): void {
  prism(out, x, z, y, y + 2.2, 0.035, 5, DARK, F)
  prism(out, x, z, y + 1.85, y + 2.35, 1.4, 8, pick(r, PARASOLS), F, 0.05)
  box(out, x, y + 0.36, z, 0.4, 0.03, 0.4, WHITE, F)                         // the table under it
  prism(out, x, z, y, y + 0.36, 0.04, 4, DARK, F)
}

export function railing(out: MeshBuilder, x: number, y: number, z0: number, z1: number, c: Rgb = WHITE, h = 0.95): void {
  box(out, x, y + h, (z0 + z1) / 2, 0.025, 0.025, (z1 - z0) / 2, c, F)
  box(out, x, y + h * 0.5, (z0 + z1) / 2, 0.012, 0.012, (z1 - z0) / 2, c, F)
  for (let z = z0; z <= z1 + 0.01; z += 1.5) box(out, x, y + h / 2, z, 0.02, h / 2, 0.02, c, F)
}

export function lifebuoy(out: MeshBuilder, x: number, y: number, z: number, s: number): void {
  box(out, x + s * 0.03, y, z, 0.03, 0.28, 0.28, [0.95, 0.45, 0.1], F)
  box(out, x + s * 0.05, y, z, 0.03, 0.14, 0.14, DARK, F)
}

export function bicycle(out: MeshBuilder, x: number, y: number, z: number, c: Rgb): void {
  for (const dz of [-0.5, 0.5]) box(out, x, y + 0.35, z + dz, 0.02, 0.33, 0.33, DARK, F)
  strut(out, [x, y + 0.35, z - 0.5], [x, y + 0.75, z + 0.35], 0.04, 0.04, c)
  strut(out, [x, y + 0.75, z - 0.25], [x, y + 0.75, z + 0.35], 0.04, 0.04, c)
}

export function flag(out: MeshBuilder, x: number, y: number, z: number, h: number, cols: Rgb[]): void {
  prism(out, x, z, y, y + h, 0.035, 4, WHITE, F)
  const w = 0.35
  cols.forEach((c, i) => box(out, x, y + h - 0.25, z - 0.1 - w / 2 - i * w, 0.01, 0.2, w / 2, c, F))
}

/** lights strung along a line (a bar's guinguette lights), glowing after dark */
export function stringLights(out: MeshBuilder, a: [number, number, number], b: [number, number, number], n: number): void {
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const sag = Math.sin(t * Math.PI) * 0.25
    box(out, a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - sag, a[2] + (b[2] - a[2]) * t, 0.06, 0.06, 0.06, LIGHT, EMIT)
  }
}

/** a wheelhouse: a box with a band of windows round its top and a roof that overhangs */
export function wheelhouse(out: MeshBuilder, z: number, y: number, hw: number, hd: number, h: number, c: Rgb, roof: Rgb): void {
  box(out, 0, y + h / 2, z, hw, h / 2, hd, c, F)
  box(out, 0, y + h * 0.72, z, hw + 0.02, h * 0.17, hd + 0.02, GLASS, F)
  box(out, 0, y + h + 0.05, z, hw + 0.15, 0.05, hd + 0.15, roof, F)
}

// ── the shore ────────────────────────────────────────────────────────────────────────────────────────────

const HUT_WALLS: Rgb[] = [[0.95, 0.78, 0.3], [0.5, 0.72, 0.82], [0.62, 0.15, 0.13], [0.5, 0.68, 0.48], [0.9, 0.87, 0.8], [0.95, 0.94, 0.9], WOOD, [0.36, 0.4, 0.34], [0.82, 0.76, 0.62], [0.55, 0.6, 0.62]]
export const HUT = { w: [2.2, 3.6], d: [1.8, 2.6], h: [2.3, 2.8] }

/**
 * The péniche's shore hut: a small low building on the quay beside its boat — a store, a letterbox, a gate in
 * a low fence, a planter. Local +z along the bank, +x towards the water; it stands on y = 0.
 */
export function shoreHut(out: MeshBuilder, seed: number): void {
  const r = rnd(seed * 7 + 3)
  const w = HUT.w[0] + r() * (HUT.w[1] - HUT.w[0])
  const d = HUT.d[0] + r() * (HUT.d[1] - HUT.d[0])
  const h = HUT.h[0] + r() * (HUT.h[1] - HUT.h[0])
  const wall = pick(r, HUT_WALLS)
  box(out, 0, h / 2, 0, d / 2, h / 2, w / 2, wall, F)
  // a flat roof with a lip, or a mono-pitch one falling to the land
  if (r() > 0.5) box(out, 0, h + 0.06, 0, d / 2 + 0.12, 0.06, w / 2 + 0.12, [0.3, 0.3, 0.32], F)
  else wedge(out, 0, h + 0.15, 0, d / 2 + 0.15, 0.15, w / 2 + 0.15, 0, [0.42, 0.25, 0.18], F)
  box(out, d / 2 + 0.02, 1.0, -w / 4, 0.03, 1.0, 0.45, r() > 0.5 ? DARK : [0.25, 0.4, 0.3], F)   // the door, facing the boat
  box(out, d / 2 + 0.02, 1.5, w / 4, 0.03, 0.35, 0.4, GLASS, F)
  // the letterbox on a post and a gate in a low fence beside the hut, a planter
  box(out, d / 2 + 0.6, 0.6, w / 2 + 0.6, 0.03, 0.6, 0.03, DARK, F)
  box(out, d / 2 + 0.6, 1.25, w / 2 + 0.6, 0.15, 0.12, 0.2, pick(r, [[0.95, 0.8, 0.1], [0.2, 0.3, 0.55], [0.6, 0.15, 0.12]] as Rgb[]), F)
  if (r() > 0.4) {
    for (const z of [-w / 2 - 1.6, w / 2 + 1.6]) box(out, d / 2 + 0.3, 0.5, z, 0.03, 0.5, 1.2, r() > 0.5 ? DARK : [0.3, 0.42, 0.3], F)
  }
  if (r() > 0.3) planter(out, d / 2 + 0.5, 0, -w / 2 - 0.6, r)
}

/** a gangway from (a) on deck to (b) on the bank: a plank with handrails */
export function gangway(out: MeshBuilder, a: [number, number, number], b: [number, number, number], c: Rgb = STEEL): void {
  const dx = b[0] - a[0], dz = b[2] - a[2]
  const L = Math.hypot(dx, dz) || 1
  const px = (-dz / L) * 0.45, pz = (dx / L) * 0.45
  strut(out, a, b, 0.9, 0.06, [0.45, 0.42, 0.38])
  for (const s of [-1, 1]) strut(out, [a[0] + px * s, a[1] + 0.9, a[2] + pz * s], [b[0] + px * s, b[1] + 0.9, b[2] + pz * s], 0.04, 0.04, c)
}

/**
 * The hull's plan, clipped to z0…z1 and `inset` in from its sides, extruded from y0 to y1: a ship's superstructure
 * tier that follows the curve of its bow (a cruise ship's decks run out into the bow's taper, rounded as the hull is).
 */
export function planTier(out: MeshBuilder, L: number, B: number, s: HullShape, z0: number, z1: number, y0: number, y1: number, inset: number, colour: Rgb, top = true): void {
  if (z1 - z0 < 0.5) return
  const st = [z0, ...stations(L, B, s).map((p) => p.z).filter((z) => z > z0 + 0.05 && z < z1 - 0.05), z1].map((z) => ({ z, w: Math.max(0.25, station(z, L, B, s).w - inset) }))
  for (let i = 0; i + 1 < st.length; i++) {
    const a = st[i], b = st[i + 1]
    const dz = b.z - a.z, dw = b.w - a.w
    const n = Math.hypot(dz, dw) || 1
    for (const sg of [1, -1]) out.quad([[sg * a.w, y0, a.z], [sg * b.w, y0, b.z], [sg * b.w, y1, b.z], [sg * a.w, y1, a.z]], [(sg * dz) / n, 0, -dw / n], [[0, 0], [1, 0], [1, 1], [0, 1]], colour, F)
    if (top) out.quad([[-a.w, y1, a.z], [a.w, y1, a.z], [b.w, y1, b.z], [-b.w, y1, b.z]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], colour, F)
  }
  for (const [p, nz] of [[st[0], -1], [st[st.length - 1], 1]] as const) {
    out.quad([[-p.w, y0, p.z], [p.w, y0, p.z], [p.w, y1, p.z], [-p.w, y1, p.z]], [0, 0, nz], [[0, 0], [1, 0], [1, 1], [0, 1]], colour, F)
  }
}
