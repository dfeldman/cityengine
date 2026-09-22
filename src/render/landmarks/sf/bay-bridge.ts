/**
 * The San Francisco–Oakland Bay Bridge, west span (SF_PLAN.md §4). Built from photographs (Wikimedia Commons: "SF
 * Bay Bridge western tower", "Bay Bridge from Coit Tower") and the published figures: two suspension bridges end to
 * end, each a 704 m main span between 353 m side spans, meeting at the central anchorage — a great concrete block
 * standing in the bay — from the anchorage on Rincon Hill to Yerba Buena Island, 2.8 km. Silver-grey throughout.
 *
 * - **the towers** (W2–W5): about 160 m above the water. Each has two legs, one either side of the deck, and each leg
 *   is itself a braced frame — two chords along the bridge laced with stacked X's, four diamonds above the deck and
 *   two below — which is what makes the Bay Bridge's towers read as lattices where the Golden Gate's are solid. Across
 *   the bridge the legs are tied by struts and an X over the top. They stand on concrete caissons.
 * - **the deck**: double — westbound on top, eastbound inside — so the stiffening truss is deep, about 10 m, a Warren
 *   truss with verticals, and continuous from end to end.
 * - **the cables**, two to a side, over the saddles and down to the anchorages; suspenders every 9 m.
 *
 * Local frame: +z along the bridge toward Yerba Buena Island (bearing 40°), +x to its right, the origin at the
 * middle of the central anchorage at the water line.
 */
import type { MeshBuilder } from '../../buildings.ts'
import { box, type Rgb } from '../../models.ts'
import type { Fit } from '../fit.ts'
import { beam } from './golden-gate.ts'

const STEEL: Rgb = [0.7, 0.72, 0.74]
const STEEL_DARK: Rgb = [0.56, 0.58, 0.6]
const CONCRETE: Rgb = [0.74, 0.72, 0.68]
const RUST: Rgb = [0.46, 0.36, 0.28]
const ROAD: Rgb = [0.24, 0.24, 0.25]

const ANCHOR_HALF = 30          // the central anchorage's half-length along the bridge
const SIDE = 353
const MAIN = 704
const DECK_TOP = 72
const TRUSS = 11
const TOWER_TOP = 160
const SADDLE = 156
const LEG_X = 14
const CABLE_X = 11.5

/** the towers' positions along the bridge */
const TOWERS = [-(ANCHOR_HALF + SIDE + MAIN), -(ANCHOR_HALF + SIDE), ANCHOR_HALF + SIDE, ANCHOR_HALF + SIDE + MAIN]
const END = ANCHOR_HALF + SIDE + MAIN + SIDE

/** the cable's height at z: parabolas over the main spans, flatter curves down the side spans */
function cableY(z: number): number {
  const a = Math.abs(z)
  const t2 = ANCHOR_HALF + SIDE                 // the inner tower
  const t3 = t2 + MAIN                          // the outer tower
  const low = DECK_TOP + 2.5
  const anchorY = DECK_TOP + 1
  if (a < t2) {
    const t = (a - ANCHOR_HALF) / SIDE
    return anchorY + (SADDLE - anchorY) * Math.max(0, t) - 12 * Math.sin(Math.PI * Math.max(0, Math.min(1, t)))
  }
  if (a <= t3) {
    const u = (a - (t2 + t3) / 2) / (MAIN / 2)
    return low + (SADDLE - low) * u * u
  }
  const t = Math.min(1, (a - t3) / SIDE)
  return SADDLE + (anchorY - SADDLE) * t - 12 * Math.sin(Math.PI * t)
}

/** A leg's braced frame: two chords 18 m apart along the bridge, laced with X's between y0 and y1. */
function legFrame(out: MeshBuilder, x: number, zc: number, y0: number, y1: number, panels: number, chord: number): void {
  const zA = zc - 9
  const zB = zc + 9
  beam(out, [x, y0, zA], [x, y1, zA], chord, chord, STEEL)
  beam(out, [x, y0, zB], [x, y1, zB], chord, chord, STEEL)
  for (let i = 0; i < panels; i++) {
    const ya = y0 + ((y1 - y0) * i) / panels
    const yb = y0 + ((y1 - y0) * (i + 1)) / panels
    beam(out, [x, ya, zA], [x, yb, zB], 1.4, 1.4, STEEL)
    beam(out, [x, ya, zB], [x, yb, zA], 1.4, 1.4, STEEL)
    beam(out, [x, yb, zA], [x, yb, zB], 1.2, 1.2, STEEL_DARK)
  }
}

function tower(out: MeshBuilder, zc: number): void {
  // the caisson, its rust-stained waterline and the pedestal on it
  box(out, 0, 2, zc, 34, 2, 18, RUST, 0)
  box(out, 0, 7, zc, 30, 3, 15, CONCRETE, 0)
  for (const side of [-1, 1]) {
    const x = side * LEG_X
    legFrame(out, x, zc, 10, DECK_TOP - TRUSS - 2, 2, 3.6)
    legFrame(out, x, zc, DECK_TOP + 2, TOWER_TOP - 10, 4, 3.2)
    // through the deck: the chords continue as solid posts
    for (const zf of [-9, 9]) box(out, x, DECK_TOP - TRUSS / 2, zc + zf, 1.8, TRUSS / 2 + 2, 1.8, STEEL, 0)
    // the cap: the saddle housing, with its openings
    box(out, x, TOWER_TOP - 5, zc, 2.6, 5, 10.5, STEEL, 0)
    box(out, x + side * 2.65, TOWER_TOP - 5, zc, 0.1, 2.2, 4.5, STEEL_DARK, 0)
  }
  // across the bridge: struts under the deck, at the deck, high up, and an X over the top between the caps
  for (const y of [DECK_TOP - TRUSS - 3, 118, TOWER_TOP - 11]) {
    for (const zf of [-9, 9]) beam(out, [-LEG_X, y, zc + zf], [LEG_X, y, zc + zf], 2, 2.4, STEEL)
  }
  for (const zf of [-9, 9]) {
    beam(out, [-LEG_X, 118, zc + zf], [LEG_X, TOWER_TOP - 11, zc + zf], 1.4, 1.4, STEEL)
    beam(out, [LEG_X, 118, zc + zf], [-LEG_X, TOWER_TOP - 11, zc + zf], 1.4, 1.4, STEEL)
  }
}

function deck(out: MeshBuilder): void {
  const panel = 10
  for (let z = -END; z < END; z += panel) {
    const za = z
    const zb = Math.min(END, z + panel)
    const zm = (za + zb) / 2
    // the two roadways, one over the other
    box(out, 0, DECK_TOP - 0.3, zm, 10, 0.3, (zb - za) / 2 + 0.02, ROAD, 0)
    box(out, 0, DECK_TOP - TRUSS + 1.2, zm, 9.5, 0.3, (zb - za) / 2 + 0.02, ROAD, 0)
    const atTower = TOWERS.some((t) => Math.abs(zm - t) < 11)
    if (atTower) continue
    for (const side of [-1, 1]) {
      const x = side * 10.2
      beam(out, [x, DECK_TOP, za], [x, DECK_TOP, zb], 0.8, 1, STEEL)
      beam(out, [x, DECK_TOP - TRUSS, za], [x, DECK_TOP - TRUSS, zb], 0.8, 1, STEEL)
      const up = Math.round(za / panel) % 2 === 0
      beam(out, [x, up ? DECK_TOP - TRUSS : DECK_TOP, za], [x, up ? DECK_TOP : DECK_TOP - TRUSS, zb], 0.5, 0.5, STEEL)
      beam(out, [x, DECK_TOP - TRUSS, za], [x, DECK_TOP, za], 0.4, 0.4, STEEL_DARK)
      // the upper deck's railing
      box(out, side * 10.3, DECK_TOP + 0.6, zm, 0.08, 0.6, (zb - za) / 2, STEEL, 0)
    }
  }
}

function cables(out: MeshBuilder): void {
  const step = 8
  for (const x of [-CABLE_X, CABLE_X]) {
    for (let z = -END; z < END; z += step) {
      const z1 = Math.min(END, z + step)
      if (Math.abs(z) < ANCHOR_HALF && Math.abs(z1) < ANCHOR_HALF) continue      // into the anchorage
      beam(out, [x, cableY(z), z], [x, cableY(z1), z1], 0.8, 0.8, STEEL)
      beam(out, [x + Math.sign(x) * 0.9, cableY(z), z], [x + Math.sign(x) * 0.9, cableY(z1), z1], 0.8, 0.8, STEEL)
    }
  }
  // the suspenders
  for (let z = -END + 6; z < END - 6; z += 9) {
    if (Math.abs(z) < ANCHOR_HALF + 4 || TOWERS.some((t) => Math.abs(z - t) < 11)) continue
    const top = cableY(z)
    if (top - DECK_TOP < 1.5) continue
    for (const side of [-1, 1]) box(out, side * (CABLE_X + 0.45), (top + DECK_TOP) / 2, z, 0.08, (top - DECK_TOP) / 2, 0.08, STEEL_DARK, 0)
  }
}

/** A rough wooded island: a dome of rings, green above a rocky shore. */
function island(out: MeshBuilder, cx: number, cz: number, r: number, h: number): void {
  const rings = 6
  const sides = 18
  for (let j = 0; j < rings; j++) {
    const t0 = j / rings
    const t1 = (j + 1) / rings
    const r0 = r * Math.cos((t0 * Math.PI) / 2)
    const r1 = r * Math.cos((t1 * Math.PI) / 2)
    const y0 = h * Math.sin((t0 * Math.PI) / 2)
    const y1 = h * Math.sin((t1 * Math.PI) / 2)
    const c: Rgb = j === 0 ? [0.5, 0.46, 0.38] : [0.3, 0.38, 0.24]
    for (let i = 0; i < sides; i++) {
      const a0 = (i / sides) * Math.PI * 2
      const a1 = ((i + 1) / sides) * Math.PI * 2
      const wob = (a: number, k: number): number => 1 + 0.12 * Math.sin(a * 3 + k) + 0.06 * Math.sin(a * 7)
      const P = (a: number, rr: number, y: number, k: number): [number, number, number] => [cx + Math.sin(a) * rr * wob(a, k), y, cz + Math.cos(a) * rr * 0.8 * wob(a, k)]
      out.quad([P(a0, r0, y0, j), P(a1, r0, y0, j), P(a1, r1, y1, j + 1), P(a0, r1, y1, j + 1)], [Math.sin((a0 + a1) / 2), 0.6, Math.cos((a0 + a1) / 2)], [[0, 0], [1, 0], [1, 1], [0, 1]], c, 0)
    }
  }
}

export function bayBridge(out: MeshBuilder, _fit?: Fit): void {
  for (const zc of TOWERS) tower(out, zc)
  // the central anchorage: a tall concrete block, battered, its top at the deck where the four cables go in
  box(out, 0, 3, 0, 32, 3, ANCHOR_HALF + 4, RUST, 0)
  box(out, 0, 38, 0, 28, 32, ANCHOR_HALF, CONCRETE, 0)
  box(out, 0, DECK_TOP + 3, 0, 22, 4, ANCHOR_HALF - 4, CONCRETE, 0)
  deck(out)
  // Yerba Buena Island, where the west span lands and the tunnel goes through: a wooded hill 105 m high and a
  // kilometre across, so the bridge meets land and not the sky (drawn roughly: it is kilometres off)
  island(out, 0, END + 480, 560, 105)
  cables(out)
}
