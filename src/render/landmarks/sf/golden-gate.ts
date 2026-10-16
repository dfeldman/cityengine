/**
 * The Golden Gate Bridge (SF_PLAN.md §4; user, 2026-09-22: "we should have good generators for the golden gate
 * bridge, bay bridge, and sutro tower — they are huge icons of the city", "for big well-known structures we should
 * use images as references"). Built at its true dimensions from photographs (Wikimedia Commons: the view from
 * Battery Spencer and from Battery East) and the published figures:
 *
 * - main span 1280 m, side spans 343 m, towers 227 m above the water, the roadway about 67 m up at mid-span and
 *   69 m at the towers, 27.4 m wide between the cable planes;
 * - **the towers**: two cellular steel legs that step in as they rise, fluted with vertical recesses, joined above
 *   the deck by four portal struts whose openings grow shorter toward the top, capped by the cable saddles; below
 *   the deck, the legs braced by two stacked X's. The south tower stands in the strait on a pier ringed by its
 *   oval concrete fender; the north tower on the rocks at Lime Point;
 * - **the cables**: two, over the tops of the legs, sagging to just above the deck at mid-span, and on the side
 *   spans down to the anchorages; vertical suspender ropes in pairs every 15.24 m (50 ft);
 * - **the deck**: the roadway on its Warren stiffening trusses, 7.6 m deep, with the lamp standards along both
 *   edges; the steel arch over Fort Point and the stepped Art Deco concrete pylons at the ends of the side spans;
 *   the approach viaducts.
 *
 * International Orange throughout. Local frame: +z along the bridge toward Marin (north), +x to the east, the
 * origin at the middle of the main span at the water line (y = 0). The manifest or the skyline entry turns it to
 * its bearing (N 7° W).
 */
import type { MeshBuilder } from '../../buildings.ts'
import { box, boxSubdivided, slopedSlab, strut, type Rgb } from '../../models.ts'
import type { Fit } from '../fit.ts'
import { GG_MAIN as MAIN, GG_SIDE as SIDE, GG_DECK_HALF as DECK_HALF, GG_SOUTH_ANCHORAGE, GG_FORT_POINT_ARCH, GG_SOUTH_END, GG_NORTH_END, goldenGateDeckY as deckY } from '../../../city/sf/bridges.ts'

type V3 = [number, number, number]
const F = 0

const ORANGE: Rgb = [0.78, 0.25, 0.14]
const ORANGE_DARK: Rgb = [0.6, 0.19, 0.11]
const CONCRETE: Rgb = [0.8, 0.78, 0.72]
const PYLON_SHADE: Rgb = [0.58, 0.56, 0.52]
const ROAD: Rgb = [0.2, 0.2, 0.21]
const LAMP: Rgb = [0.72, 0.7, 0.62]
const PIER: Rgb = [0.6, 0.6, 0.58]
const ANCHOR: Rgb = [0.66, 0.64, 0.6]

/**
 * The NEAR level (BUGS.md #211). The owner: *"the current FAR model actually LOOKS fine, the towers are
 * great. The issue is that its polys are huge so depth mapping fails. The CLOSE LOD could just be a
 * tessellated version of the FAR LOD."* So there is no second model and no retopology: the same builder,
 * with every box subdivided to `NEAR_EDGE` metres instead of drawn as one quad per face.
 *
 * A module-level flag rather than a parameter because every helper below takes the out-buffer and nothing
 * else, and threading a flag through eight of them buys nothing — the builders run synchronously, one at a
 * time, from `Landmarks`' own constructor and `place()`.
 */
let NEAR = false
const NEAR_EDGE = 4

/** `box`, subdivided when this is the near level: the one change that makes the depth buffer work at 2 m. */
function bx(out: MeshBuilder, cx: number, cy: number, cz: number, hx: number, hy: number, hz: number, c: Rgb, f: number): void {
  if (NEAR) boxSubdivided(out, cx, cy, cz, hx, hy, hz, c, f, NEAR_EDGE)
  else box(out, cx, cy, cz, hx, hy, hz, c, f)
}

/** A straight member of section `w` × `h` from a to b: the shared `strut` (render/models.ts). */
export function beam(out: MeshBuilder, a: V3, b: V3, w: number, h: number, c: Rgb, caps = true): void {
  strut(out, a, b, w, h, c, F, caps)
}

const TOWER_TOP = 227
const SADDLE = 222
const LEG_X = 16.2            // the legs' centres either side of the axis (the cable planes pass over them)
const CABLE_X = 13.9          // the cable planes: over the inner half of the legs, straight down to the trusses

/** the main cable's height at z (a parabola across the main span; flatter parabolas down the side spans) */
const cableY = (z: number): number => {
  const a = Math.abs(z)
  if (a <= MAIN / 2) {
    const t = a / (MAIN / 2)
    return 72.5 + (SADDLE - 72.5) * t * t
  }
  const t = Math.min(1, (a - MAIN / 2) / SIDE)
  // straight chord from saddle to anchorage, less a small sag (each side to its own anchorage: the deck falls
  // further on the San Francisco side)
  const anchorY = deckY(Math.sign(z) * (MAIN / 2 + SIDE)) + 3
  return SADDLE + (anchorY - SADDLE) * t - 18 * Math.sin(Math.PI * t)
}

/** One tower, centred at z = zc, standing on its pier top at y = y0. */
function tower(out: MeshBuilder, zc: number, y0: number): void {
  const deck = deckY(MAIN / 2)
  // the legs: stepping in at each strut level, the across-face narrowing on the OUTSIDE (the inner faces stay
  // plumb so the roadway passes straight through)
  const steps = [y0, 60, 105, 142, 174, 202, TOWER_TOP - 6]
  for (const side of [-1, 1]) {
    for (let i = 0; i < steps.length - 1; i++) {
      const ya = steps[i]
      const yb = steps[i + 1]
      const across = 11 - i * 0.9               // the leg's width across the bridge
      const along = 17 - i * 1.25               // and along it
      const inner = LEG_X - 5.2
      const cx = side * (inner + across / 2)
      bx(out, cx, (ya + yb) / 2, zc, across / 2, (yb - ya) / 2, along / 2, ORANGE, F)
      // the flutes: two proud ribs up each broad face, which is what makes the leg read as a tall bundle
      for (const f of [-1, 1]) {
        bx(out, cx + f * across * 0.24, (ya + yb) / 2, zc + (along / 2 + 0.25), across * 0.12, (yb - ya) / 2 - 0.4, 0.3, ORANGE_DARK, F)
        bx(out, cx + f * across * 0.24, (ya + yb) / 2, zc - (along / 2 + 0.25), across * 0.12, (yb - ya) / 2 - 0.4, 0.3, ORANGE_DARK, F)
      }
      // the setback's ledge
      bx(out, cx, yb - 0.4, zc, across / 2 + 0.35, 0.4, along / 2 + 0.35, ORANGE, F)
    }
    // the cap over the saddle
    const cx = side * (LEG_X - 5.2 + (11 - 6 * 0.9) / 2)
    bx(out, cx, TOWER_TOP - 3, zc, 3.4, 3, 5, ORANGE, F)
    bx(out, cx, TOWER_TOP + 0.6, zc, 2, 0.6, 3, ORANGE_DARK, F)
  }
  // the portal struts above the deck, the openings between them growing shorter to the top
  const inner = LEG_X - 5.2
  for (const [ya, yb] of [[105, 113], [142, 149], [174, 180], [202, 208], [212, TOWER_TOP - 2]] as const) {
    bx(out, 0, (ya + yb) / 2, zc, inner + 0.5, (yb - ya) / 2, 5.5, ORANGE, F)
    // the strut's own recessed panel, front and back
    bx(out, 0, (ya + yb) / 2, zc + 5.6, inner - 1.5, (yb - ya) / 2 - 1.2, 0.2, ORANGE_DARK, F)
    bx(out, 0, (ya + yb) / 2, zc - 5.6, inner - 1.5, (yb - ya) / 2 - 1.2, 0.2, ORANGE_DARK, F)
  }
  // under the deck: the portal the road sits on, and two X's down to the pier
  bx(out, 0, deck - 9.5, zc, inner + 0.5, 1.8, 5, ORANGE, F)
  const yTop = deck - 11.5
  const yMid = (y0 + yTop) / 2
  for (const [ya, yb] of [[y0 + 2, yMid], [yMid, yTop]] as const) {
    for (const zf of [-4.5, 4.5]) {
      beam(out, [-inner, ya, zc + zf], [inner, yb, zc + zf], 2.2, 2.2, ORANGE)
      beam(out, [inner, ya, zc + zf], [-inner, yb, zc + zf], 2.2, 2.2, ORANGE)
    }
    bx(out, 0, yb, zc, inner, 1.2, 5, ORANGE, F)
  }
}

/** The main cables over the whole length, as straight segments following the curve. */
function cables(out: MeshBuilder): void {
  const ends = MAIN / 2 + SIDE
  const step = 16
  for (const x of [-CABLE_X, CABLE_X]) {
    for (let z = -ends; z < ends; z += step) {
      const z1 = Math.min(ends, z + step)
      beam(out, [x, cableY(z), z], [x, cableY(z1), z1], 0.95, 0.95, ORANGE, false)
    }
  }
}

/** The suspenders: a pair of ropes every 15.24 m, from the cable down to the truss's top chord. */
function suspenders(out: MeshBuilder): void {
  const P = 15.24
  const ends = MAIN / 2 + SIDE - 10
  for (let z = -ends; z <= ends; z += P) {
    if (Math.abs(Math.abs(z) - MAIN / 2) < 12) continue            // not through the towers
    const top = cableY(z)
    const bottom = deckY(z) + 0.4
    if (top - bottom < 1.5) continue
    // (the pair as one member: 36 cm apart, they are a single line from anywhere a rider stands)
    for (const side of [-1, 1]) bx(out, side * (CABLE_X - 0.2), (top + bottom) / 2, z, 0.07, (top - bottom) / 2, 0.25, ORANGE, F)
  }
}

/** The roadway and its stiffening trusses from z0 to z1, lamp standards along both edges. */
function deck(out: MeshBuilder, z0: number, z1: number, lamps: boolean): void {
  const panel = 15.24          // two of the real 7.6 m panels: seen from kilometres, the rhythm is what shows
  const depth = 7.6
  /*
   * (Until 2026-09-29 the roadway was also pushed to `out.decks` here, for BUGS.md #217. Nothing but the SKYPARK
   * planting read it — which planted a row of trees down the middle of the bridge, taking each 200 m of roadway for a
   * roof garden. The ways are conformed to the deck through `GOLDEN_GATE_DECKS` (src/city/bridge-decks.ts) instead.)
   */
  for (let z = z0; z < z1; z += panel) {
    const za = z
    const zb = Math.min(z1, z + panel)
    const ya = deckY(za)
    const yb = deckY(zb)
    const ym = (ya + yb) / 2
    const zm = (za + zb) / 2
    // skip the stretch that passes through a tower's legs
    const atTower = Math.abs(Math.abs(zm) - MAIN / 2) < 9
    // the roadway slab and its curbs, four panels at a time (the deck's curve is a few metres over a kilometre)
    const group = Math.round(za / panel) % 4 === 0
    if (group) {
      const zg = Math.min(z1, za + 4 * panel)
      const zgm = (za + zg) / 2
      // the roadway slab: a rider crosses this deck, metres above it (BUGS.md #154). Graded, not uniform:
      // the MAIN span is over open water nobody swims out to, so 16 m is plenty there (same target as the
      // shore-banded water fix); the SIDE spans, towers and approaches are close to shore, to the piers and
      // to the towers' own steel, so the depth buffer has to work much harder there — 6 m, the same instinct
      // as the water bake clipping rings to its 200 m tiles, just applied to a deck instead of a shoreline.
      const nearShore = Math.abs(zgm) > MAIN / 2 - 20
      const maxEdge = NEAR ? NEAR_EDGE : nearShore ? 6 : 16
      // (on the profile, not level at the group's middle: at the south side span's 2.9% a 61 m level box was a
      // 1.7 m stair, and the rider — on the profile — sank into one end of it and floated over the other)
      slopedSlab(out, 0, DECK_HALF - 0.4, za, zg + 0.02, deckY, 0.7, ROAD, F, maxEdge)
      slopedSlab(out, 0, DECK_HALF, za, zg + 0.02, (q) => deckY(q) - 0.7, 0.8, ORANGE_DARK, F, maxEdge)
      for (const side of [-1, 1]) beam(out, [side * (DECK_HALF + 0.1), deckY(za) + 0.6, za], [side * (DECK_HALF + 0.1), deckY(zg) + 0.6, zg], 0.12, 1.2, ORANGE, false)
    }
    if (atTower) continue
    for (const side of [-1, 1]) {
      const x = side * (DECK_HALF - 0.2)
      // top and bottom chords
      beam(out, [x, ya - 0.3, za], [x, yb - 0.3, zb], 0.7, 0.9, ORANGE, false)
      beam(out, [x, ya - depth, za], [x, yb - depth, zb], 0.7, 0.9, ORANGE, false)
      // the Warren diagonals and a vertical at each panel point
      const up = Math.round(za / panel) % 2 === 0
      beam(out, [x, (up ? ya - depth : ya - 0.3), za], [x, (up ? yb - 0.3 : yb - depth), zb], 0.45, 0.45, ORANGE, false)
      beam(out, [x, ya - depth, za], [x, ya - 0.3, za], 0.35, 0.35, ORANGE, false)
    }
    // the lamp standards, both sides every 61 m (the real ones stand closer; from the city they are the rhythm)
    if (lamps && Math.round(za / panel) % 4 === 0) {
      for (const side of [-1, 1]) {
        // on the roadway's kerb, the sidewalk between them and the rail — at DECK_HALF − 1.2 they stood in the middle
        // of the walk, and the rider rode through one every 61 m (2026-10-05)
        const x = side * (DECK_HALF - 3.2)
        bx(out, x, ym + 4.5, zm, 0.15, 4.5, 0.15, LAMP, F)
        bx(out, x - side * 0.8, ym + 9, zm, 0.8, 0.12, 0.2, LAMP, F)
      }
    }
  }
}

/** A stepped Art Deco concrete pylon at the end of a side span, straddling the deck. */
function pylon(out: MeshBuilder, zc: number, y0: number): void {
  const top = deckY(zc) + 14
  for (const side of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const ya = y0 + ((top - y0) * i) / 4
      const yb = y0 + ((top - y0) * (i + 1)) / 4
      bx(out, side * (DECK_HALF + 5), (ya + yb) / 2, zc, 5 - i * 0.7, (yb - ya) / 2, 7 - i * 0.9, CONCRETE, F)
    }
    // the Art Deco dress the real pylons wear (2026-10-16, from the bay they read as blank slabs): deep vertical
    // flutes down each face, in shadow, and a stepped crown under the deck
    const x0 = side * (DECK_HALF + 5)
    for (const k of [-0.5, 0, 0.5]) {
      bx(out, x0 + side * 5.02, (y0 + top * 0.75) / 2, zc + k * 7, 0.05, (top * 0.75 - y0) / 2, 0.35, PYLON_SHADE, F)
      bx(out, x0 + k * 5, (y0 + top * 0.75) / 2, zc - 7.02, 0.35, (top * 0.75 - y0) / 2, 0.05, PYLON_SHADE, F)
      bx(out, x0 + k * 5, (y0 + top * 0.75) / 2, zc + 7.02, 0.35, (top * 0.75 - y0) / 2, 0.05, PYLON_SHADE, F)
    }
    bx(out, x0, top + 0.6, zc, 2.9, 0.6, 3.9, CONCRETE, F)
    bx(out, x0, top + 1.6, zc, 2.2, 0.4, 3.0, CONCRETE, F)
  }
}

/**
 * The NEAR level: the same bridge, tessellated (see `NEAR`). Registered as its own `procedural` so the
 * manifest entry that stands at the bridge's own place picks it, while `tools/cities.ts`'s skyline entry —
 * the FAR level, untouched — keeps the cheap one.
 */
export function goldenGateBridgeNear(out: MeshBuilder, fit?: Fit): void {
  NEAR = true
  try { goldenGateBridge(out, fit) } finally { NEAR = false }
}

export function goldenGateBridge(out: MeshBuilder, _fit?: Fit): void {
  const zS = -MAIN / 2
  const zN = MAIN / 2
  // the south tower's pier and its oval fender in the strait; the north tower on its rock footing
  // (the fender is a low wall at the water line, weathered grey, round the pier — not a stadium)
  bx(out, 0, 6, zS, 24, 6, 14, PIER, F)
  for (let i = 0; i < 28; i++) {
    const a0 = (i / 28) * Math.PI * 2
    const a1 = ((i + 1) / 28) * Math.PI * 2
    beam(out, [Math.cos(a0) * 62, 2.2, zS + Math.sin(a0) * 34], [Math.cos(a1) * 62, 2.2, zS + Math.sin(a1) * 34], 3, 4.4, PIER)
  }
  bx(out, 0, 7, zN, 23, 7, 13, PIER, F)
  tower(out, zS, 12)
  tower(out, zN, 14)
  cables(out)
  suspenders(out)
  // the deck: the main span and both side spans, then the approaches
  deck(out, -(MAIN / 2 + SIDE), MAIN / 2 + SIDE, true)
  // the pylons at the ends of the side spans (south: Pylon S1, against Fort Point's bay wall)
  const zSa = -(MAIN / 2 + SIDE)
  const zNa = MAIN / 2 + SIDE
  pylon(out, zSa, 0)
  pylon(out, zNa, 0)
  // the Fort Point arch: a steel arch from S1 over the old fort's courtyard to Pylon S2, carrying the deck on posts
  const a0 = zSa
  const a1 = a0 - GG_FORT_POINT_ARCH
  pylon(out, a1, 0)
  for (const x of [-DECK_HALF + 1, DECK_HALF - 1]) {
    let prev: V3 | null = null
    for (let i = 0; i <= 16; i++) {
      const t = i / 16
      const z = a0 + (a1 - a0) * t
      // the arch's crown 3 m under the deck over it (it carried the deck at 60 m when the deck was level)
      const y = 18 + (deckY((a0 + a1) / 2) - 3 - 18) * Math.sin(Math.PI * t)
      const p: V3 = [x, y, z]
      if (prev) beam(out, prev, p, 1.6, 2.4, ORANGE)
      if (i % 2 === 0 && i > 0 && i < 16) beam(out, p, [x, deckY(z) - 1.2, z], 0.6, 0.6, ORANGE)
      prev = p
    }
  }
  // the anchorage blocks, their tops just under the deck they carry: the south one on the bluff past S2 (OSM's order)
  const hS = GG_SOUTH_ANCHORAGE / 2
  const topS = deckY(a1 - hS) - 1.5
  const topN = deckY(zNa + 30) - 1.5
  bx(out, 0, topS / 2, a1 - hS, 24, topS / 2, hS - 1, ANCHOR, F)
  // its Art Deco banding: shadowed vertical recesses down both long faces, a stepped coping
  for (let k = -3; k <= 3; k++) for (const sd of [-1, 1]) bx(out, sd * 24.03, topS * 0.45, a1 - hS + k * (hS - 2) / 3.5, 0.05, topS * 0.42, 0.6, PYLON_SHADE, F)
  bx(out, 0, topS + 0.4, a1 - hS, 24.4, 0.4, hS - 0.6, ANCHOR, F)
  bx(out, 0, topN / 2, zNa + 30, 24, topN / 2, 26, ANCHOR, F)
  /*
   * THE STEEL ENDS WHERE THE STRAIGHT DOES (src/city/sf/bridges.ts `GG_SOUTH_END`, `GG_NORTH_END`). The owner, with
   * aerials (BUGS.md #218b): *"In real life, the real bridge only starts at the very edge of the water. There is a
   * curved elevated segment … that is a connecting road, taking cars in from the bridge and onto land."* Every way
   * over the bridge swings off its axis past the arch at this end and past the viaduct at the other; a straight
   * deck carried on past that stood empty beside the road. The curved viaducts are the ways' own structure.
   */
  deck(out, GG_SOUTH_END, zSa, false)
  pylon(out, GG_SOUTH_END, 10)
  deck(out, zNa, GG_NORTH_END, true)
  for (let z = zNa + 30; z <= GG_NORTH_END; z += 40) {
    const top = deckY(z) - 8
    for (const side of [-1, 1]) bx(out, side * (DECK_HALF - 2), top / 2 + 10, z, 1, top / 2 - 10, 1, ORANGE, F)
    bx(out, 0, top - 0.5, z, DECK_HALF - 1, 0.6, 1, ORANGE, F)
  }
}
