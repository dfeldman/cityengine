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
 *
 * THE DECKS ARE ON A GRADE, and the ways over the bridge take their heights from them (2026-09-30, `lowerY`,
 * `upperY`, `BAY_BRIDGE_DECKS`; src/city/bridge-decks.ts). The bridge was drawn level at 72 m, which is right from
 * across the city and cannot be ridden: the lower deck has to come down to Rincon Hill at one end (the freeway is on
 * the ground there, 26 m above the sea) and to the mouth of the Yerba Buena tunnel at the other (54 m). So both decks
 * crest at the central anchorage and fall each way — 0.7% at the crest, 3% at the San Francisco end — the upper
 * 9.5 m over the lower throughout, and the towers, the truss and the cables follow them.
 */
import type { MeshBuilder } from '../../buildings.ts'
import { box, slopedSlab, type Rgb } from '../../models.ts'
import type { Fit } from '../fit.ts'
import { beam } from './golden-gate.ts'
import { BAY_ANCHOR_HALF as ANCHOR_HALF, BAY_SIDE as SIDE, BAY_MAIN as MAIN, BAY_BETWEEN as BETWEEN, BAY_BIKEWAY, HELIX, bayLowerY as lowerY, bayUpperY as upperY } from '../../../city/sf/bridges.ts'

const STEEL: Rgb = [0.7, 0.72, 0.74]
const STEEL_DARK: Rgb = [0.56, 0.58, 0.6]
const CONCRETE: Rgb = [0.74, 0.72, 0.68]
const RUST: Rgb = [0.46, 0.36, 0.28]
const ROAD: Rgb = [0.24, 0.24, 0.25]

const TRUSS = 11
const TOWER_TOP = 160
const SADDLE = 156
const LEG_X = 14
const CABLE_X = 11.5

/** the towers' positions along the bridge */
const TOWERS = [-(ANCHOR_HALF + SIDE + MAIN), -(ANCHOR_HALF + SIDE), ANCHOR_HALF + SIDE, ANCHOR_HALF + SIDE + MAIN]
const END = ANCHOR_HALF + SIDE + MAIN + SIDE
/**
 * The NEAR level: the bridge as a rider crosses it — the roadways tessellated, the floor beams under the upper deck
 * that a rider on the lower one looks up at, the anchorage on the San Francisco shore, and no island (the real one
 * is there). `bayBridge` is the far level, for the skyline.
 */
let NEAR = false

/**
 * True over open water in the middle of one of the two 704 m main spans, well clear of any tower — the
 * one stretch of this bridge nobody is ever close to anything else near (BUGS.md #154: graded, not uniform,
 * subdivision — see golden-gate.ts for the same rule on the other bridge).
 */
function isMainSpan(z: number): boolean {
  return (z > TOWERS[0] + 20 && z < TOWERS[1] - 20) || (z > TOWERS[2] + 20 && z < TOWERS[3] - 20)
}

/** the cable's height at z: parabolas over the main spans, flatter curves down the side spans */
function cableY(z: number): number {
  const a = Math.abs(z)
  const t2 = ANCHOR_HALF + SIDE                 // the inner tower
  const t3 = t2 + MAIN                          // the outer tower
  // (the low points and the anchorages ride on the deck, which is on a grade)
  const low = upperY(Math.sign(z) * (t2 + t3) / 2) + 2.5
  const anchorY = upperY(a < t2 ? 0 : Math.sign(z) * END) + 1
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
  const top = upperY(zc)
  // the caisson, its rust-stained waterline and the pedestal on it
  box(out, 0, 2, zc, 34, 2, 18, RUST, 0)
  box(out, 0, 7, zc, 30, 3, 15, CONCRETE, 0)
  for (const side of [-1, 1]) {
    const x = side * LEG_X
    legFrame(out, x, zc, 10, top - TRUSS - 2, 2, 3.6)
    legFrame(out, x, zc, top + 2, TOWER_TOP - 10, 4, 3.2)
    // through the deck: the chords continue as solid posts
    for (const zf of [-9, 9]) box(out, x, top - TRUSS / 2, zc + zf, 1.8, TRUSS / 2 + 2, 1.8, STEEL, 0)
    // the cap: the saddle housing, with its openings
    box(out, x, TOWER_TOP - 5, zc, 2.6, 5, 10.5, STEEL, 0)
    box(out, x + side * 2.65, TOWER_TOP - 5, zc, 0.1, 2.2, 4.5, STEEL_DARK, 0)
  }
  // across the bridge: struts under the deck, high up, and an X over the top between the caps
  for (const y of [top - TRUSS - 3, 118, TOWER_TOP - 11]) {
    for (const zf of [-9, 9]) beam(out, [-LEG_X, y, zc + zf], [LEG_X, y, zc + zf], 2, 2.4, STEEL)
  }
  for (const zf of [-9, 9]) {
    beam(out, [-LEG_X, 118, zc + zf], [LEG_X, TOWER_TOP - 11, zc + zf], 1.4, 1.4, STEEL)
    beam(out, [LEG_X, 118, zc + zf], [-LEG_X, TOWER_TOP - 11, zc + zf], 1.4, 1.4, STEEL)
  }
}

/** the half-widths of the two roadways, and where the trusses stand outside them */
const UPPER_HALF = 10
const LOWER_HALF = 9.5
const TRUSS_X = 10.2

const PAINT: Rgb = [0.86, 0.86, 0.82]
/** the lanes: five each way, 3.6 m, a broken white line between them (a rider's-eye detail: the near level only) */
function lanes(out: MeshBuilder, half: number, z0: number, z1: number, y: (z: number) => number): void {
  const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  const stripe = (x: number, za: number, zb: number, w: number): void => {
    const ya = y(za) + 0.04
    const yb = y(zb) + 0.04
    out.quad([[x - w, yb, zb], [x + w, yb, zb], [x + w, ya, za], [x - w, ya, za]], [0, 1, 0], uv, PAINT, 0)
  }
  for (let z = Math.ceil(z0 / 12) * 12; z + 3 <= z1; z += 12) for (const x of [-5.4, -1.8, 1.8, 5.4]) stripe(x, z, z + 3, 0.07)
  // the solid edge lines
  for (let z = z0; z < z1; z += 20) for (const side of [-1, 1]) stripe(side * (half - 0.9), z, Math.min(z1, z + 20), 0.07)
}

/**
 * The two roadways from z0 to z1 (the upper from `upperFrom`), and between the anchorages the truss they hang in.
 * Off the span they stand on concrete bents — the approach over the San Francisco shore, the viaduct on Yerba
 * Buena's.
 */
function deck(out: MeshBuilder, z0: number, z1: number, upperFrom = z0): void {
  const panel = 20             // seen from across the city: the truss's rhythm, not its every member
  /*
   * The roadways: each a slab on its profile (`slopedSlab` — a level box every 80 m was a 2.7 m stair at the San
   * Francisco end). Tessellated for a rider (BUGS.md #154, and the near level finer still): 16 m over the open
   * middle of a main span, 6 m near a tower, the anchorage or a shore.
   */
  for (let z = z0; z < z1; z += 4 * panel) {
    const zg = Math.min(z1, z + 4 * panel)
    const maxEdge = NEAR ? 4 : isMainSpan((z + zg) / 2) ? 16 : 6
    const zu = Math.max(z, upperFrom)
    if (zu < zg) slopedSlab(out, 0, UPPER_HALF, zu, zg + 0.02, upperY, 0.6, ROAD, 0, maxEdge)
    slopedSlab(out, 0, LOWER_HALF, z, zg + 0.02, lowerY, 0.6, ROAD, 0, maxEdge)
    for (const side of [-1, 1]) {
      // the upper deck's railing, and the lower's kerb inside the truss
      if (zu < zg) beam(out, [side * (UPPER_HALF + 0.3), upperY(zu) + 0.6, zu], [side * (UPPER_HALF + 0.3), upperY(zg) + 0.6, zg], 0.16, 1.2, STEEL, false)
      if (NEAR) beam(out, [side * (LOWER_HALF + 0.2), lowerY(z) + 0.45, z], [side * (LOWER_HALF + 0.2), lowerY(zg) + 0.45, zg], 0.3, 0.9, CONCRETE, false)
    }
    if (NEAR) {
      if (zu < zg) lanes(out, UPPER_HALF, zu, zg, upperY)
      lanes(out, LOWER_HALF, z, zg, lowerY)
    }
  }
  for (let z = z0; z < z1; z += panel) {
    const za = z
    const zb = Math.min(z1, z + panel)
    const zm = (za + zb) / 2
    const ta = upperY(za)
    const tb = upperY(zb)
    const span = zm > -END && zm < END
    // under the upper roadway, the floor beams a rider on the lower one looks up at
    if (NEAR && za >= upperFrom) beam(out, [-TRUSS_X, ta - 1.1, za], [TRUSS_X, ta - 1.1, za], 0.5, 1, STEEL_DARK, false)
    if (!span) {
      // a bent every other panel: two columns outside the lower roadway up to the upper one, and a beam under each
      if (Math.round(za / panel) % 2 !== 0) continue
      const top = za >= upperFrom ? ta - 0.6 : lowerY(za) - 0.6
      for (const side of [-1, 1]) box(out, side * (TRUSS_X + 1.2), top / 2, za, 1.1, top / 2, 1.1, CONCRETE, 0)
      box(out, 0, lowerY(za) - 1.4, za, TRUSS_X + 2.3, 0.8, 1.2, CONCRETE, 0)
      if (za >= upperFrom) box(out, 0, ta - 1.4, za, TRUSS_X + 2.3, 0.8, 1.2, CONCRETE, 0)
      continue
    }
    if (TOWERS.some((t) => Math.abs(zm - t) < 11)) continue
    // the truss's depth: from the upper roadway down past the lower one
    const bottom = BETWEEN + 1.5
    for (const side of [-1, 1]) {
      const x = side * TRUSS_X
      beam(out, [x, ta, za], [x, tb, zb], 0.8, 1, STEEL, false)
      beam(out, [x, ta - bottom, za], [x, tb - bottom, zb], 0.8, 1, STEEL, false)
      const up = Math.round(za / panel) % 2 === 0
      beam(out, [x, up ? ta - bottom : ta, za], [x, up ? tb : tb - bottom, zb], 0.5, 0.5, STEEL, false)
      beam(out, [x, ta - bottom, za], [x, ta, za], 0.4, 0.4, STEEL_DARK, false)
    }
  }
}

function cables(out: MeshBuilder): void {
  const step = 16
  for (const x of [-CABLE_X, CABLE_X]) {
    for (let z = -END; z < END; z += step) {
      const z1 = Math.min(END, z + step)
      if (Math.abs(z) < ANCHOR_HALF && Math.abs(z1) < ANCHOR_HALF) continue      // into the anchorage
      // (the two cables side by side, as one member two cables wide)
      beam(out, [x + Math.sign(x) * 0.45, cableY(z), z], [x + Math.sign(x) * 0.45, cableY(z1), z1], 1.7, 0.8, STEEL, false)
    }
  }
  // the suspenders
  for (let z = -END + 6; z < END - 6; z += 18) {
    if (Math.abs(z) < ANCHOR_HALF + 4 || TOWERS.some((t) => Math.abs(z - t) < 11)) continue
    const top = cableY(z)
    const road = upperY(z)
    if (top - road < 1.5) continue
    for (const side of [-1, 1]) box(out, side * (CABLE_X + 0.45), (top + road) / 2, z, 0.08, (top - road) / 2, 0.08, STEEL_DARK, 0)
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
  const crest = upperY(0)
  box(out, 0, 3, 0, 32, 3, ANCHOR_HALF + 4, RUST, 0)
  box(out, 0, (crest - TRUSS - 4) / 2 + 3, 0, 28, (crest - TRUSS - 4) / 2 - 3, ANCHOR_HALF, CONCRETE, 0)
  for (const side of [-1, 1]) box(out, side * 17, crest - 2, 0, 5, 7, ANCHOR_HALF - 4, CONCRETE, 0)
  cables(out)
  if (!NEAR) {
    deck(out, -END, END)
    // Yerba Buena Island, where the west span lands and the tunnel goes through: a wooded hill 105 m high and a
    // kilometre across, so the bridge meets land and not the sky (drawn roughly: it is kilometres off)
    island(out, 0, END + 480, 560, 105)
    return
  }
  /*
   * For a rider. The roadways go on past the span as far as OSM's two long bridge ways do (`NEAR_FROM`…`NEAR_TO`):
   * a way whose middle is inside a model's footprint is drawn by the model and by nothing else (render/city.ts
   * `coverRaised`), so where the model stopped at the anchorages the rider rode the last 150 m of each end on
   * nothing. Beyond those the ways' own structure is drawn (render/bridges.ts), at the heights the decks give.
   * And the anchorage on each shore: the housings the cables run down into, either side of the roadways.
   */
  deck(out, NEAR_FROM, NEAR_TO, NEAR_UPPER_FROM)
  bikeway(out)
  for (const end of [-END, END]) {
    for (const side of [-1, 1]) shoreAnchorage(out, side * 17, end + Math.sign(end) * 22, upperY(end) + 4)
  }
}

/**
 * One housing of a shore anchorage, either side of the roadways (5 × 26 m half-sizes, as the plain box it replaces):
 * the Rincon Hill anchorage is Art Deco concrete — the owner's survey of Harrison Street, 2026-10-07, found it a blank
 * grey slab — so a battered plinth, the walls cut into tall recessed panels between flat pilasters, a band of fluting
 * under a stepped crown, and the cable housing on top.
 */
function shoreAnchorage(out: MeshBuilder, x: number, z: number, H: number): void {
  const HX = 5, HZ = 26, DARK: Rgb = [0.6, 0.6, 0.58], LIGHT: Rgb = [0.8, 0.8, 0.77]
  const P = 2.5                                   // the plinth
  box(out, x, P / 2, z, HX + 0.8, P / 2, HZ + 0.8, DARK, 0)
  const top = H - 4
  box(out, x, (P + top) / 2, z, HX, (top - P) / 2, HZ, CONCRETE, 0)
  // the pilasters standing proud, the recessed panels between them darker
  for (let k = -HZ + 2; k <= HZ - 2 + 1e-6; k += 4) {
    for (const s of [-1, 1]) box(out, x + s * (HX + 0.25), (P + top) / 2, z + k, 0.25, (top - P) / 2, 0.55, LIGHT, 0)
  }
  for (let k = -HX + 1.5; k <= HX - 1.5 + 1e-6; k += 3.5) {
    for (const s of [-1, 1]) box(out, x + k, (P + top) / 2, z + s * (HZ + 0.25), 0.55, (top - P) / 2, 0.25, LIGHT, 0)
  }
  for (const s of [-1, 1]) {
    box(out, x + s * (HX + 0.03), (P + top) / 2 - 1, z, 0.02, (top - P) / 2 - 2, HZ - 1, DARK, 0)
    box(out, x, (P + top) / 2 - 1, z + s * (HZ + 0.03), HX - 1, (top - P) / 2 - 2, 0.02, DARK, 0)
  }
  // a band of fluting under the crown, the crown stepped in twice, and the housing the cables run down into
  box(out, x, top - 0.6, z, HX + 0.6, 0.6, HZ + 0.6, LIGHT, 0)
  box(out, x, top + 1, z, HX + 0.2, 1, HZ + 0.2, CONCRETE, 0)
  box(out, x, top + 2.8, z, HX - 1, 0.8, HZ - 2, LIGHT, 0)
  box(out, x, top + 3.8, z, HX - 2.2, 0.4, HZ - 6, CONCRETE, 0)
}

/** how far the near level's roadways run: the lower from where OSM's plain motorway meets the ramps on Rincon
 *  Hill, the upper from the end of its long bridge way, both to the end of those ways on Yerba Buena */
const NEAR_FROM = -1662
const NEAR_UPPER_FROM = -1636
const NEAR_TO = 1560

const BIKE_LANE: Rgb = [0.52, 0.27, 0.23]
const BIKE_HALF = 2

/**
 * THE BAY BRIDGE BIKEWAY (src/city/sf/bridges.ts `BAY_BIKEWAY`, BRIDGES.md): the bikes-only helix in the bay beside
 * the first tower, the boardwalk out to it from The Embarcadero, and the two bridges across from it to the decks —
 * drawn from the very points the ridden ways are made of, so the rider is on this and nothing else draws it
 * (render/city.ts skips an `authored` way). A red-surfaced ramp on a concrete core, steel posts round the outside.
 */
function bikeway(out: MeshBuilder): void {
  const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  type P = { x: number; z: number; y: number }
  const strip = (pts: P[]): void => {
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i]
      const l = Math.hypot(b.x - a.x, b.z - a.z) || 1
      const rx = (b.z - a.z) / l, rz = -(b.x - a.x) / l
      const at = (q: P, side: number, dy: number): [number, number, number] => [q.x + rx * side * BIKE_HALF, q.y + dy, q.z + rz * side * BIKE_HALF]
      out.quad([at(b, -1, 0), at(b, 1, 0), at(a, 1, 0), at(a, -1, 0)], [0, 1, 0], uv, BIKE_LANE, 0)
      out.quad([at(a, -1, -0.5), at(a, 1, -0.5), at(b, 1, -0.5), at(b, -1, -0.5)], [0, -1, 0], uv, CONCRETE, 0)
      out.quad([at(b, 1, -0.5), at(a, 1, -0.5), at(a, 1, 0), at(b, 1, 0)], [rx, 0, rz], uv, CONCRETE, 0)
      out.quad([at(a, -1, -0.5), at(b, -1, -0.5), at(b, -1, 0), at(a, -1, 0)], [-rx, 0, -rz], uv, CONCRETE, 0)
      for (const side of [-1, 1]) {
        const p0 = at(a, side * 1.03, 1.1), p1 = at(b, side * 1.03, 1.1)
        beam(out, p0, p1, 0.08, 0.08, STEEL, false)
        beam(out, at(a, side * 1.03, 0.5), at(b, side * 1.03, 0.5), 0.05, 0.05, STEEL, false)
        if (i % 2 === 0) beam(out, at(a, side * 1.03, 0), p0, 0.06, 0.06, STEEL, false)
      }
    }
  }
  for (const w of BAY_BIKEWAY) strip(w.points)
  // the helix's structure: a core, posts round the outside, and arms under the ramp to both
  const top = Math.max(...BAY_BIKEWAY.flatMap((w) => w.points.map((q) => q.y))) + 2
  const n = 8
  for (let k = 0; k < n; k++) {
    const a0 = (2 * Math.PI * k) / n, a1 = (2 * Math.PI * (k + 1)) / n
    const P = (a: number, r: number, y: number): [number, number, number] => [HELIX.x + r * Math.cos(a), y, HELIX.z + r * Math.sin(a)]
    out.quad([P(a0, 5, -1), P(a1, 5, -1), P(a1, 5, top), P(a0, 5, top)], [Math.cos((a0 + a1) / 2), 0, Math.sin((a0 + a1) / 2)], uv, CONCRETE, 0)
  }
  const helix = BAY_BIKEWAY.filter((w) => w.points.length > 40)
  const postR = HELIX.r + 0.3 * (HELIX.landTurns + HELIX.upperTurns) + 3
  for (let k = 0; k < 12; k++) {
    const a = (2 * Math.PI * k) / 12
    const px = HELIX.x + postR * Math.cos(a), pz = HELIX.z + postR * Math.sin(a)
    beam(out, [px, -1, pz], [px, top, pz], 0.7, 0.7, STEEL, true)
    // under each pass of the ramp at this angle, an arm from the core to the post
    for (const w of helix) {
      for (let i = 1; i < w.points.length; i++) {
        const q = w.points[i], p = w.points[i - 1]
        const aq = Math.atan2(q.z - HELIX.z, q.x - HELIX.x), ap = Math.atan2(p.z - HELIX.z, p.x - HELIX.x)
        const da = ((aq - a + 3 * Math.PI) % (2 * Math.PI)) - Math.PI, dp = ((ap - a + 3 * Math.PI) % (2 * Math.PI)) - Math.PI
        if (!(da >= 0 && dp < 0)) continue
        beam(out, [HELIX.x + 5 * Math.cos(a), q.y - 0.7, HELIX.z + 5 * Math.sin(a)], [px, q.y - 0.7, pz], 0.35, 0.5, STEEL_DARK, false)
      }
    }
  }
  // the boardwalk on piles
  const walk = BAY_BIKEWAY[0].points
  for (let i = 0; i < walk.length - 1; i++) {
    const a = walk[i], b = walk[i + 1]
    const m = Math.max(1, Math.round(Math.hypot(b.x - a.x, b.z - a.z) / 8))
    for (let j = 0; j < m; j++) {
      const t = j / m
      box(out, a.x + (b.x - a.x) * t, (a.y + (b.y - a.y) * t - 0.5 - 2) / 2, a.z + (b.z - a.z) * t, 0.3, (a.y + (b.y - a.y) * t - 0.5 + 2) / 2, 0.3, RUST, 0)
    }
  }
}

export function bayBridgeNear(out: MeshBuilder, fit?: Fit): void {
  NEAR = true
  try { bayBridge(out, fit) } finally { NEAR = false }
}
