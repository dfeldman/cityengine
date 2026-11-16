/**
 * SAN FRANCISCO'S SMALL CRAFT (owner, 2026-11-15: "improve the sailboats in san francisco and houseboats in sausalito …
 * varied and interesting, not formulaic boxes, while keeping it simple enough to render large numbers at once (marinas
 * have thousands of boats)"; "a lot of the boats are gray or white … we should have some color variety").
 *
 * The kit is render/moored.ts's (the superellipse hulls, the deck clutter); these are the Bay's kinds:
 *  - SAILBOAT: the marina's forest of masts — sloops and ketches and the odd catamaran, white or coloured hulls, a
 *    coloured sail cover and dodger; under way (`sailing`) with main and jib set. ~170 triangles, from a 3-step hull.
 *  - MOTOR YACHT: a cabin with its windscreen band, a flybridge with a bimini on the bigger ones.
 *  - SPEEDBOAT: low, bright, a raked windscreen, an outboard.
 *  - SMALL FERRY / water taxi: a monohull with a glazed cabin and an open upper deck.
 *  - SAUSALITO HOUSEBOAT: a float with a house on it, in the shingle-and-paint of Waldo Point and Gate 5 — cottages,
 *    two-storey houses with roof decks, A-frames, arks with barrel roofs, shed-roofed studios, a tower now and then.
 *
 * Local frame: +z the bow, the waterline y = 0; each builder takes the full length and beam and returns its deck's height.
 */
import { MeshBuilder } from '../buildings.ts'
import type { BoatLibrary } from '../boats.ts'
import { box, prism, strut, wedge, type Rgb } from '../models.ts'
import {
  BOX_HULL, DARK, F, GLASS, PLANT, POT, STEEL, WHITE, WOOD, YACHT_HULL, flag, hull, pick, planter, railing, rnd, stringLights,
  type HullShape,
} from '../moored.ts'

// ── tunables ─────────────────────────────────────────────────────────────────────────────────────────────
/** the hull's taper steps for the marina's small boats (the shared kit's 6 is for the big ones) */
const SMALL_STEPS = 3
const SAIL = {
  /** mast height over the length */
  mast: [1.2, 1.55] as [number, number],
  ketch: 0.12,
  cat: 0.07,
  dodger: 0.45,
  colourHull: 0.42,
  colourSail: 0.28,
  teak: 0.3,
}
const HB = {
  /** the float's freeboard */
  float: 0.7,
  storey: 2.6,
  /** the deck round the house */
  inset: [0.5, 1.3] as [number, number],
  twoStorey: 0.42,
  tower: 0.12,
  solar: 0.22,
  kayak: 0.35,
  lights: 0.3,
}

// ── palettes: colour before realism ──────────────────────────────────────────────────────────────────────
const NAVY: Rgb = [0.1, 0.16, 0.36]
export const YACHT_HULLS: Rgb[] = [NAVY, [0.08, 0.09, 0.1], [0.6, 0.1, 0.1], [0.1, 0.36, 0.25], [0.15, 0.42, 0.62], [0.95, 0.78, 0.25],
  [0.2, 0.55, 0.58], [0.85, 0.85, 0.8], [0.45, 0.12, 0.2], [0.9, 0.45, 0.15]]
const STRIPES: Rgb[] = [NAVY, [0.7, 0.12, 0.1], [0.12, 0.4, 0.28], [0.2, 0.5, 0.78], [0.95, 0.7, 0.15], [0.1, 0.1, 0.12], [0.25, 0.65, 0.68]]
/** sail covers, dodgers, biminis: Sunbrella blues, a lot of them, and the rest of the chart */
const CANVAS: Rgb[] = [[0.1, 0.25, 0.5], [0.15, 0.35, 0.62], [0.1, 0.4, 0.42], [0.55, 0.12, 0.12], [0.12, 0.32, 0.22], [0.78, 0.72, 0.6],
  [0.35, 0.18, 0.4], [0.2, 0.52, 0.75], [0.9, 0.55, 0.15], [0.12, 0.13, 0.15]]
const SAILS: Rgb[] = [[0.95, 0.93, 0.88], [0.86, 0.6, 0.38], [0.75, 0.2, 0.18], [0.2, 0.4, 0.72], [0.95, 0.8, 0.3], [0.3, 0.3, 0.32]]
const DECK: Rgb = [0.86, 0.84, 0.78]
const TEAK: Rgb = [0.62, 0.44, 0.26]
const SPAR: Rgb = [0.78, 0.79, 0.8]

const HOUSE_WALLS: Rgb[] = [[0.48, 0.34, 0.22], [0.6, 0.58, 0.53], [0.55, 0.62, 0.5], [0.52, 0.66, 0.78], [0.2, 0.5, 0.52], [0.92, 0.78, 0.35],
  [0.6, 0.18, 0.14], [0.92, 0.88, 0.78], [0.62, 0.55, 0.72], [0.88, 0.5, 0.42], [0.2, 0.36, 0.26], [0.95, 0.94, 0.9], [0.36, 0.42, 0.55]]
const TRIMS: Rgb[] = [[0.95, 0.94, 0.9], [0.92, 0.88, 0.78], [0.12, 0.12, 0.14], [0.7, 0.15, 0.12], [0.15, 0.3, 0.6], [0.95, 0.75, 0.2]]
const ROOFS: Rgb[] = [[0.26, 0.27, 0.29], [0.35, 0.55, 0.48], [0.55, 0.15, 0.12], [0.4, 0.3, 0.22], [0.3, 0.36, 0.48], [0.62, 0.63, 0.64]]
const FLOATS: Rgb[] = [[0.55, 0.55, 0.53], [0.42, 0.42, 0.41], [0.2, 0.32, 0.45], [0.5, 0.2, 0.15], [0.25, 0.3, 0.25]]

// ── small geometry ───────────────────────────────────────────────────────────────────────────────────────
type P3 = [number, number, number]
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
const normal = (a: P3, b: P3, c: P3): P3 => {
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]]
  const n: P3 = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]
  const l = Math.hypot(...n) || 1
  return [n[0] / l, n[1] / l, n[2] / l]
}
/** a flat polygon of 3 or 4 points, both faces (a sail, a gable's end) */
function panel(out: MeshBuilder, p: P3[], c: Rgb, both = true): void {
  const q = (p.length === 3 ? [p[0], p[1], p[2], p[2]] : p) as [P3, P3, P3, P3]
  const n = normal(q[0], q[1], q[2])
  out.quad(q, n, UV, c, F)
  if (both) out.quad([q[3], q[2], q[1], q[0]], [-n[0], -n[1], -n[2]], UV, c, F)
}
/** a pitched roof over [-hx, hx] × [z0, z1] from the eaves at y: ridge along z (or along x), the gable ends in `end` */
function gable(out: MeshBuilder, hx: number, z0: number, z1: number, y: number, rise: number, roof: Rgb, end: Rgb, alongZ = true, over = 0.3): void {
  if (alongZ) {
    const X = hx + over, a = z0 - over, b = z1 + over
    panel(out, [[X, y, a], [X, y, b], [0, y + rise, b], [0, y + rise, a]], roof)
    panel(out, [[-X, y, b], [-X, y, a], [0, y + rise, a], [0, y + rise, b]], roof)
    panel(out, [[-hx, y, z1], [hx, y, z1], [0, y + rise, z1]], end)
    panel(out, [[hx, y, z0], [-hx, y, z0], [0, y + rise, z0]], end)
  } else {
    const zc = (z0 + z1) / 2, hz = (z1 - z0) / 2, Z = hz + over, X = hx + over
    panel(out, [[X, y, zc + Z], [-X, y, zc + Z], [-X, y + rise, zc], [X, y + rise, zc]], roof)
    panel(out, [[-X, y, zc - Z], [X, y, zc - Z], [X, y + rise, zc], [-X, y + rise, zc]], roof)
    panel(out, [[hx, y, zc - hz], [hx, y, zc + hz], [hx, y + rise, zc]], end)
    panel(out, [[-hx, y, zc + hz], [-hx, y, zc - hz], [-hx, y + rise, zc]], end)
  }
}
/** a mono-pitch roof, high along +x, and the wall's triangles under it */
function shed(out: MeshBuilder, hx: number, z0: number, z1: number, y: number, rise: number, roof: Rgb, end: Rgb, s = 1): void {
  const X = hx + 0.3
  panel(out, [[-s * X, y, z0 - 0.3], [-s * X, y, z1 + 0.3], [s * X, y + rise, z1 + 0.3], [s * X, y + rise, z0 - 0.3]], roof, true)
  panel(out, [[-s * hx, y, z1], [s * hx, y, z1], [s * hx, y + rise, z1]], end, true)
  panel(out, [[s * hx, y, z0], [-s * hx, y, z0], [s * hx, y + rise, z0]], end, true)
  box(out, s * hx, y + rise / 2, (z0 + z1) / 2, 0.05, rise / 2, (z1 - z0) / 2, end, F)
}
/** an ark's barrel roof along z, four facets */
function barrel(out: MeshBuilder, hx: number, z0: number, z1: number, y: number, rise: number, roof: Rgb, end: Rgb): void {
  const N = 4
  const pt = (i: number): [number, number] => { const a = Math.PI * (i / N); return [Math.cos(a) * (hx + 0.2), y + Math.sin(a) * rise] }
  for (let i = 0; i < N; i++) {
    const [x0, y0] = pt(i), [x1, y1] = pt(i + 1)
    panel(out, [[x0, y0, z0 - 0.25], [x0, y0, z1 + 0.25], [x1, y1, z1 + 0.25], [x1, y1, z0 - 0.25]], roof, true)
    panel(out, [[0, y, z1], [x0 * 0.98, y0, z1], [x1 * 0.98, y1, z1]], end, true)
    panel(out, [[0, y, z0], [x1 * 0.98, y1, z0], [x0 * 0.98, y0, z0]], end, true)
  }
}
/** copy a part into out, moved by (dx, dy, dz) */
function shift(out: MeshBuilder, part: MeshBuilder, dx: number, dy: number, dz: number): void {
  const base = out.positions.length / 3
  for (let i = 0; i < part.positions.length; i += 3) out.positions.push(part.positions[i] + dx, part.positions[i + 1] + dy, part.positions[i + 2] + dz)
  for (const v of part.normals) out.normals.push(v)
  for (const v of part.uvs) out.uvs.push(v)
  for (const v of part.colors) out.colors.push(v)
  for (const i of part.indices) out.indices.push(base + i)
}

// ── the sailboat ─────────────────────────────────────────────────────────────────────────────────────────

/** mast, boom, and either the furled sails (moored) or main and jib set (`sailing`), the sheets out to `tack` (±1) */
function rig(out: MeshBuilder, r: () => number, L: number, fb: number, zm: number, H: number, sailing: boolean, cover: Rgb, tack: number, mast = 0.07): void {
  prism(out, 0, zm, fb, fb + H, mast, 4, SPAR, F)
  const zb = zm - L * 0.36
  const yb = fb + 1.25
  const swing = sailing ? tack * L * 0.12 : 0
  strut(out, [0, yb, zm], [swing, yb, zb], 0.09, 0.09, SPAR, F, false)
  if (sailing) {
    const sail = r() < SAIL.colourSail ? pick(r, SAILS) : SAILS[0]
    panel(out, [[0, fb + H - 0.2, zm], [swing, yb + 0.1, zb], [0, yb + 0.1, zm]], sail)
    const jib = r() < 0.7 ? SAILS[0] : sail
    panel(out, [[0, fb + H * 0.86, zm + 0.05], [0, fb + 0.35, L / 2 - 0.25], [tack * L * 0.1, fb + 0.45, zm - L * 0.14]], jib)
  } else {
    strut(out, [0, yb + 0.17, zm - 0.1], [swing, yb + 0.15, zb + 0.3], 0.3, 0.26, cover, F, false)
    // the jib rolled on its forestay
    strut(out, [0, fb + H * 0.9, zm], [0, fb + 0.15, L / 2 - 0.2], 0.1, 0.1, cover, F, false)
  }
}

/** A sailboat, 6–16 m: a sloop (now and then a ketch, or a catamaran), moored with its sails covered or `sailing`. */
export function sailboat(out: MeshBuilder, L: number, B: number, seed: number, sailing = false): number {
  const r = rnd(seed)
  if (L > 9 && r() < SAIL.cat) return catamaran(out, L, B, r, sailing)
  const fb = 0.45 + L * 0.035
  const coloured = r() < SAIL.colourHull
  const hc = coloured ? pick(r, YACHT_HULLS) : WHITE
  const stripe = coloured ? WHITE : pick(r, STRIPES)
  hull(out, L, B, -0.35, fb, YACHT_HULL, hc, stripe, coloured ? 0.08 : 0.14, r() < SAIL.teak ? TEAK : DECK, SMALL_STEPS)
  const cover = pick(r, CANVAS)
  // the coachroof, its windows, the dodger over the companionway
  const zc = -L * 0.02
  const hz = L * 0.2
  wedge(out, 0, fb + 0.3, zc, B * 0.31, 0.3, hz, 0.14, coloured && r() < 0.5 ? DECK : WHITE, F)
  box(out, 0, fb + 0.32, zc + 0.1, B * 0.31 - 0.07, 0.08, hz * 0.6, GLASS, F)
  if (r() < SAIL.dodger) wedge(out, 0, fb + 0.62, zc - hz - 0.25, B * 0.27, 0.2, 0.32, 0.18, cover, F)
  const H = L * (SAIL.mast[0] + r() * (SAIL.mast[1] - SAIL.mast[0])) + 0.8
  const tack = r() < 0.5 ? 1 : -1
  rig(out, r, L, fb, L * 0.1, H, sailing, cover, tack)
  if (L > 11 && r() < SAIL.ketch) prism(out, 0, -L * 0.32, fb, fb + H * 0.55, 0.05, 4, SPAR, F)
  return fb
}

function catamaran(out: MeshBuilder, L: number, B: number, r: () => number, sailing: boolean): number {
  const bw = Math.max(1.1, B * 0.26)
  const hx = B * 0.72 - bw / 2
  const hc = r() < 0.5 ? WHITE : pick(r, YACHT_HULLS)
  const fb = 0.9
  for (const s of [-1, 1]) {
    const p = new MeshBuilder()
    hull(p, L, bw, -0.3, fb, YACHT_HULL, hc, null, 0, DECK, SMALL_STEPS)
    shift(out, p, s * hx, 0, 0)
  }
  // the bridgedeck and the saloon on it, glazed all round
  box(out, 0, fb - 0.05, -L * 0.08, hx, 0.12, L * 0.3, DECK, F)
  box(out, 0, fb + 0.55, -L * 0.1, hx * 0.8, 0.5, L * 0.16, WHITE, F)
  box(out, 0, fb + 0.65, -L * 0.1, hx * 0.81, 0.18, L * 0.14, GLASS, F)
  rig(out, r, L, fb + 1.0, L * 0.1, L * 1.35, sailing, pick(r, CANVAS), r() < 0.5 ? 1 : -1, 0.09)
  return fb
}

// ── motor yachts, speedboats, water taxis ───────────────────────────────────────────────────────────────

/** A motor yacht, 8–20 m: the saloon with its windscreen band, a flybridge with a bimini on the big ones. */
export function motorYacht(out: MeshBuilder, L: number, B: number, seed: number): number {
  const r = rnd(seed)
  const fb = 0.8 + L * 0.04
  const coloured = r() < 0.45
  const hc = coloured ? pick(r, YACHT_HULLS) : WHITE
  hull(out, L, B, -0.4, fb, YACHT_HULL, hc, coloured ? WHITE : pick(r, STRIPES), 0.12, r() < 0.4 ? TEAK : DECK, SMALL_STEPS)
  const cabin = r() < 0.75 ? WHITE : [0.92, 0.88, 0.78] as Rgb
  const hz = L * 0.22, zc = -L * 0.06, hw = B * 0.38, h = 0.9 + L * 0.02
  box(out, 0, fb + h / 2, zc, hw, h / 2, hz, cabin, F)
  wedge(out, 0, fb + h * 0.55, zc + hz + 0.45, hw, h * 0.4, 0.5, 0.45, GLASS, F)
  box(out, 0, fb + h * 0.62, zc, hw + 0.02, h * 0.2, hz * 0.85, GLASS, F)
  if (L > 11) {
    const top = fb + h
    box(out, 0, top + 0.4, zc - hz * 0.3, hw * 0.85, 0.4, hz * 0.6, cabin, F)
    const bim = pick(r, CANVAS)
    box(out, 0, top + 1.9, zc - hz * 0.3, hw * 0.9, 0.05, hz * 0.65, r() < 0.4 ? cabin : bim, F)
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) strut(out, [sx * hw * 0.8, top + 0.8, zc - hz * 0.3 + sz * hz * 0.55], [sx * hw * 0.8, top + 1.85, zc - hz * 0.3 + sz * hz * 0.6], 0.04, 0.04, STEEL, F, false)
    if (r() < 0.5) prism(out, 0, zc - hz * 0.3, top + 1.9, top + 3.2, 0.04, 4, SPAR, F)
  } else if (r() < 0.6) box(out, 0, fb + h + 0.06, zc - hz - 0.6, hw * 0.9, 0.05, 0.9, pick(r, CANVAS), F)
  return fb
}

/** A speedboat, 5–9 m: low and bright, the windscreen raked back, the seats, an outboard on the transom. */
export function speedboat(out: MeshBuilder, L: number, B: number, seed: number): number {
  const r = rnd(seed)
  const fb = 0.65
  const hc = r() < 0.75 ? pick(r, YACHT_HULLS) : WHITE
  hull(out, L, B, -0.25, fb, YACHT_HULL, hc, hc === WHITE ? pick(r, STRIPES) : WHITE, 0.1, [0.82, 0.8, 0.74], SMALL_STEPS)
  wedge(out, 0, fb + 0.28, L * 0.05, B * 0.4, 0.26, 0.25, 0.22, GLASS, F)
  const seat = r() < 0.5 ? WHITE : [0.85, 0.75, 0.6] as Rgb
  box(out, 0, fb + 0.2, -L * 0.15, B * 0.36, 0.2, L * 0.14, seat, F)
  box(out, 0, fb + 0.1, -L / 2 - 0.15, 0.22, 0.5, 0.2, r() < 0.6 ? [0.12, 0.12, 0.13] as Rgb : WHITE, F)
  return fb
}

/** A small ferry or water taxi, 14–26 m: a monohull, a glazed cabin on the main deck, an open top deck with its rail and wheelhouse. */
export function smallFerry(out: MeshBuilder, L: number, B: number, seed: number): number {
  const r = rnd(seed)
  const fb = 1.1
  const livery = pick(r, [[0.1, 0.25, 0.5], [0.95, 0.75, 0.15], [0.15, 0.45, 0.3], [0.65, 0.12, 0.1], [0.2, 0.55, 0.7]] as Rgb[])
  const hs: HullShape = { ...YACHT_HULL, bow: L * 0.25, stern: 0.6, sternTip: 0.9 }
  hull(out, L, B, -0.6, fb, hs, r() < 0.5 ? livery : WHITE, r() < 0.5 ? WHITE : livery, 0.3, DECK, 4)
  const hz = L * 0.3, zc = -L * 0.05, hw = B / 2 - 0.35
  box(out, 0, fb + 1.1, zc, hw, 1.1, hz, WHITE, F)
  box(out, 0, fb + 1.3, zc, hw + 0.02, 0.5, hz - 0.3, GLASS, F)
  box(out, 0, fb + 0.35, zc, hw + 0.03, 0.12, hz, livery, F)
  const top = fb + 2.2
  railing(out, hw, top, zc - hz, zc + hz, WHITE)
  railing(out, -hw, top, zc - hz, zc + hz, WHITE)
  box(out, 0, top + 0.9, zc + hz * 0.6, hw * 0.6, 0.9, 1.1, WHITE, F)
  box(out, 0, top + 1.1, zc + hz * 0.6 + 0.05, hw * 0.61, 0.35, 1.0, GLASS, F)
  prism(out, 0, zc + hz * 0.6, top + 1.8, top + 3.2, 0.05, 4, SPAR, F)
  return fb
}

// ── the Sausalito houseboat ──────────────────────────────────────────────────────────────────────────────

type Roof = 'gableZ' | 'gableX' | 'shed' | 'flat' | 'barrel' | 'aframe'
const ROOF_KINDS: Roof[] = ['gableZ', 'gableZ', 'gableX', 'shed', 'shed', 'flat', 'barrel', 'aframe']

/** one storey's box over [-hx, hx] × [z0, z1] from y, with windows and its roof; returns the eaves' height */
function storey(out: MeshBuilder, r: () => number, hx: number, z0: number, z1: number, y: number, h: number, wall: Rgb, trim: Rgb, roofC: Rgb, roof: Roof): number {
  const zc = (z0 + z1) / 2, hz = (z1 - z0) / 2
  const wh = roof === 'aframe' ? 0.6 : h
  box(out, 0, y + wh / 2, zc, hx, wh / 2, hz, wall, F)
  if (roof !== 'aframe') {
    // the windows along the long sides, in trim frames, and a glazed end towards the bow (the deck and the view)
    const n = Math.max(1, Math.floor((2 * hz) / 2.4))
    const ww = Math.min(0.75, hz / n * 0.6)
    for (let i = 0; i < n; i++) {
      const z = z0 + (2 * hz) * ((i + 0.5) / n)
      for (const s of [-1, 1]) {
        box(out, s * (hx + 0.02), y + h * 0.55, z, 0.03, h * 0.26, ww + 0.08, trim, F)
        box(out, s * (hx + 0.05), y + h * 0.55, z, 0.03, h * 0.21, ww, GLASS, F)
      }
    }
    box(out, 0, y + h * 0.5, z1 + 0.04, hx * 0.72, h * 0.34, 0.04, GLASS, F)
    box(out, hx * 0.45, y + h * 0.42, z1 + 0.07, 0.42, h * 0.42, 0.03, trim, F)
  }
  const top = y + wh
  const rise = Math.min(2.4, hx * (0.45 + r() * 0.4))
  switch (roof) {
    case 'gableZ': gable(out, hx, z0, z1, top, rise, roofC, wall, true); break
    case 'gableX': gable(out, hx, z0, z1, top, Math.min(2.2, hz * 0.6), roofC, wall, false); break
    case 'shed': shed(out, hx, z0, z1, top, rise * 0.7, roofC, wall, r() < 0.5 ? 1 : -1); break
    case 'barrel': barrel(out, hx, z0, z1, top, rise * 0.8, roofC, wall); break
    case 'aframe': {
      // the A-frame: the roof down to the deck, the bow end all glass
      const R = h + 1.4
      gable(out, hx + 0.3, z0, z1, top - 0.3, R, roofC, wall, true, 0.2)
      panel(out, [[-hx * 0.8, top, z1 + 0.02], [hx * 0.8, top, z1 + 0.02], [0, top + R * 0.85, z1 + 0.02]], GLASS)
      return top + R
    }
    case 'flat':
      box(out, 0, top + 0.12, zc, hx + 0.25, 0.12, hz + 0.25, roofC, F)
      return top + 0.24
  }
  return top
}

/**
 * A SAUSALITO HOUSEBOAT on its float, L along the float's long axis. The house is set back from the bow for a deck;
 * two storeys on some, the lower roof a roof deck; a tower, solar panels, a kayak, planters, lights.
 */
export function houseboat(out: MeshBuilder, L: number, B: number, seed: number): number {
  const r = rnd(seed)
  const fy = HB.float
  hull(out, L, B, -0.6, fy, BOX_HULL, pick(r, FLOATS), null, 0, r() < 0.6 ? WOOD : [0.62, 0.6, 0.56], 2)
  const wall = pick(r, HOUSE_WALLS)
  let trim = pick(r, TRIMS)
  if (trim[0] === wall[0]) trim = WHITE
  const roofC = pick(r, ROOFS)
  const inset = HB.inset[0] + r() * (HB.inset[1] - HB.inset[0])
  const hx = B / 2 - inset
  const front = L * (0.12 + r() * 0.18)
  const z0 = -L / 2 + inset * 0.8, z1 = L / 2 - front
  const two = L > 9 && r() < HB.twoStorey
  let roof = pick(r, ROOF_KINDS)
  if (two && roof === 'aframe') roof = 'gableZ'
  let top: number
  if (two) {
    const lower = storey(out, r, hx, z0, z1, fy, HB.storey, wall, trim, roofC, 'flat')
    // the upper storey set back aft, the rest of the lower roof a deck with its rail
    const ux = hx * (0.7 + r() * 0.3)
    const uz1 = z0 + (z1 - z0) * (0.5 + r() * 0.2)
    const wall2 = r() < 0.6 ? wall : pick(r, HOUSE_WALLS)
    top = storey(out, r, ux, z0 + 0.2, uz1, lower, HB.storey * 0.92, wall2, trim, roofC, roof === 'flat' ? 'shed' : roof)
    railing(out, hx, lower, uz1, z1, trim, 0.9)
    railing(out, -hx, lower, uz1, z1, trim, 0.9)
    if (r() < 0.5) planter(out, hx * 0.5, lower, z1 - 0.8, r)
  } else top = storey(out, r, hx, z0, z1, fy, HB.storey + r() * 0.5, wall, trim, roofC, roof)
  // the bow deck: a rail, planters, a chair or two
  railing(out, 0, fy, L / 2 - 0.3, L / 2 - 0.25, trim, 0.9)
  for (let i = 0, n = 1 + Math.floor(r() * 3); i < n; i++) planter(out, (r() - 0.5) * (B - 1.5), fy, z1 + 0.6 + r() * Math.max(0.2, front - 1.4), r)
  if (r() < 0.5) box(out, (r() - 0.5) * B * 0.5, fy + 0.25, z1 + front * 0.5, 0.3, 0.25, 0.3, pick(r, TRIMS), F)
  // the extras
  if (r() < HB.tower) {
    const tx = (r() < 0.5 ? -1 : 1) * hx * 0.55, tz = z0 + 1.4
    box(out, tx, top + 0.9, tz, 0.9, 0.9, 0.9, wall, F)
    box(out, tx, top + 1.05, tz, 0.92, 0.35, 0.6, GLASS, F)
    wedge(out, tx, top + 2.25, tz, 1.1, 0.45, 1.1, 1.08, roofC, F)
  } else if (r() < HB.solar && roof !== 'barrel') box(out, 0, top + 0.08, (z0 + z1) / 2, hx * 0.5, 0.04, (z1 - z0) * 0.25, [0.12, 0.18, 0.32], F)
  if (r() < 0.45) prism(out, -hx * 0.6, z0 + 0.8, top - 0.2, top + 1.0, 0.1, 4, DARK, F)
  if (r() < HB.kayak) box(out, B / 2 - 0.35, fy + 0.15, (z0 + z1) / 2, 0.28, 0.13, Math.min(2.4, L * 0.25), pick(r, [[0.95, 0.75, 0.1], [0.9, 0.3, 0.1], [0.15, 0.5, 0.75], [0.2, 0.6, 0.3]] as Rgb[]), F)
  if (r() < HB.lights) stringLights(out, [-hx, fy + 2.2, z1], [hx, fy + 2.2, L / 2 - 0.4], 5)
  if (r() < 0.25) flag(out, hx, top, z1 - 0.3, 1.6, [pick(r, TRIMS), pick(r, HOUSE_WALLS)])
  if (r() < 0.3) { box(out, -B / 2 + 0.6, fy + 0.3, z1 + 0.5, 0.3, 0.3, 0.3, POT, F); box(out, -B / 2 + 0.6, fy + 0.8, z1 + 0.5, 0.45, 0.35, 0.45, PLANT, F) }
  return fy
}

/** what an OSM boat in the Bay is, by its size: a small one a yacht, the rest houseboats (Sausalito's are nearly all of them) */
export function sfKindOf(len: number, beam: number, id: number): SfKind {
  const r = rnd(id)()
  if (len < 7 && beam < 3) return 'speedboat'
  if (len < 16 && beam < len * 0.42) return r < 0.6 ? 'sailboat' : 'motorYacht'
  return 'houseboat'
}

export type SfKind = 'sailboat' | 'motorYacht' | 'speedboat' | 'smallFerry' | 'houseboat'
export const SF_MOORED: Record<SfKind, (out: MeshBuilder, L: number, B: number, seed: number) => number> = {
  sailboat: (o, L, B, s) => sailboat(o, L, B, s),
  motorYacht, speedboat, smallFerry, houseboat,
}
export const SF_SIZES: Record<SfKind, { L: [number, number]; B: number }> = {
  sailboat: { L: [7, 15], B: 3.4 }, motorYacht: { L: [9, 19], B: 4.2 }, speedboat: { L: [5, 8.5], B: 2.3 },
  smallFerry: { L: [16, 26], B: 6.5 }, houseboat: { L: [10, 18], B: 7 },
}

/** San Francisco's library for render/boats.ts: OSM's boats here are Sausalito's houseboats, and a few yachts */
export const SF_BOATS: BoatLibrary = {
  build: SF_MOORED, sizes: SF_SIZES, huts: {},
  classify(len, beam, id) { const kind = sfKindOf(len, beam, id); return { build: SF_MOORED[kind], kind } },
}
