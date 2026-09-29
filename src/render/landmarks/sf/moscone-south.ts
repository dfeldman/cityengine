/**
 * MOSCONE SOUTH BLOCK — the two cheap masses that fix the datums for everything else on it.
 *
 * `docs/MOSCONE-SOUTH.md` is the brief, written by the owner from his own Google Earth captures BEFORE any
 * modelling (`docs/shots/refs/aerials/ms-*.webp`). These two buildings were chosen first because they are the
 * only kit-sayable ones on the block and because between them they establish the heights and frontage lines
 * the expensive work — the curved 3rd Street esplanade, the monumental Folsom stair, the carousel — has to
 * meet.
 *
 * ---- THE DATUMS ESTABLISHED HERE, and where each number comes from
 *
 *   street level                0     the Howard and Folsom pavements
 *   UNDERCROFT_H = 2 * DECK_H   8     the top of the hall's open undercroft = the floor of its glazed band.
 *                                     DERIVED, not measured: both Howard crossings leave the north block at
 *                                     `PATIO_H = DECK_H * 2` (sf/yerba-buena.ts), and a bridge is level, so
 *                                     the floor the enclosed one enters is at 8. `DECK_H` is imported rather
 *                                     than retyped so the two blocks cannot drift apart.
 *   HALL_TOP    = 20                  the middle sub-building's parapet. PROPORTIONAL, off
 *                                     `ms-moscone-hall-1-howard.webp`, with the undercroft pinned at 8:
 *                                     undercroft : glazing : louvre band measures about 8 : 9 : 3 there.
 *   HALL_STEP   = ±1..2               the other two sub-buildings step above it (`ms-aerial-oblique-3`).
 *   RINK_TOP    = fit.height (18)     the ice rink's roof. OSM gives the way height=15; the aerial shows the
 *                                     ribbed roof standing clear above the wall head, so 18 to the ridge.
 *
 * ---- WHAT THE AERIALS ACTUALLY SHOW, versus what is inferred here
 *
 * Evidenced: the open undercroft; the recessed blue-green glazed band with fine mullions; the white parapet
 * carrying a fine fin band the whole length; the solar arrays; the pale chequered screen over the end
 * elevation away from 3rd Street; the rink's box-on-box massing, its pale ribbed metal roof, its tall blank
 * cream end wall and the low white service blocks along its base.
 *
 * Inferred: every dimension in metres except the 8 m datum; the division of the hall into three sub-buildings
 * at the two interior vertices of its own OSM back edge; the depth of the undercroft.
 *
 * ---- FRAME
 *
 * Nothing here reads a compass. Both builders find their frontage with `longestEdge()` and everything else by
 * projecting the ring onto that edge, so they are correct whether the city hands them the min-area frame or
 * `tools/model-shots.ts` hands them the longest-edge-forward one. `boxAlong` is z-MIRRORED against the maths
 * convention (BUGS.md #135), so every call here goes through `headAlong()` below and never through
 * `edgeAt().heading`, which is the direction a wall FACES and a quarter turn from what a long box wants.
 */
import type { MeshBuilder } from '../../buildings.ts'
import { capPolygon } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { box, type Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { boxAlong, edgeAt, faceOn, longestEdge, offsetRing } from '../parts.ts'
import { faceBand, towerRing, type Face } from '../tower.ts'
import { facade } from '../facade.ts'
import { DECK_H } from './yerba-buena.ts'

type P2 = { x: number; z: number }

const CONC = surfaceTag('concrete')
const METAL = surfaceTag('metal')

const UNDERCROFT: Rgb = [0.15, 0.16, 0.17]
const SOFFIT: Rgb = [0.21, 0.22, 0.23]
const PIER: Rgb = [0.34, 0.35, 0.36]
const SPANDREL: Rgb = [0.24, 0.26, 0.27]
const BLUEGREEN: Rgb = [0.32, 0.52, 0.53]
const MULLION: Rgb = [0.52, 0.55, 0.56]
const WHITE: Rgb = [0.89, 0.89, 0.87]
const WHITE_DK: Rgb = [0.74, 0.75, 0.74]
const SCREEN: Rgb = [0.79, 0.81, 0.81]
const SOLAR: Rgb = [0.11, 0.12, 0.17]
const SOLAR_FRAME: Rgb = [0.6, 0.61, 0.62]
const SILVER: Rgb = [0.77, 0.79, 0.8]
const SILVER_DK: Rgb = [0.6, 0.62, 0.63]
const CREAM: Rgb = [0.88, 0.85, 0.74]
const PRECAST: Rgb = [0.82, 0.81, 0.78]

/**
 * THE ONE DATUM BOTH BLOCKS SHARE. 8 m: `DECK_H` (4 m, `building:min_level=1` on the kiosks that stand on the
 * north lawn) doubled, which is `PATIO_H`/`BRIDGE_H` in `sf/yerba-buena.ts` — the height both Howard
 * crossings leave the north block at. The enclosed one enters Moscone's upper floor, so that floor is here.
 */
export const UNDERCROFT_H = 2 * DECK_H

/**
 * THE FIVE WALKABLE HEIGHTS OF THIS BLOCK, in metres, all of them multiples of `DECK_H`. PROVISIONAL, and
 * exported so the builders that come next share them rather than retyping them — the harder work on this
 * block (the curved dividing wall, the two esplanades, the concrete ramp, the monumental Folsom stair, the
 * level-3 network) is measured against these.
 *
 * Derived from `docs/MOSCONE-SOUTH.md` plus ONE hard constraint: a bridge is level. Both Howard crossings
 * leave the north block at `PATIO_H = 2 * DECK_H = 8` (`sf/yerba-buena.ts`), and the doc says the open one
 * lands on the TOP OF THE CURVED WALL, which is level 2.75. So 2.75 = 8, and the rest follows from the doc's
 * own words — level 2.5 is "half a storey" above level 2, level 3 is the museum's second floor.
 *
 * ---- THE DISAGREEMENT THIS CREATES, reported rather than resolved
 *
 * `sf/yerba-buena.ts` sets `SOUTH_DECK_H = PATIO_H = 8` and calls that surface the GARDEN level, and
 * `mosconeOpenBridge` lands on it at 8. Under the table below the garden is 4 and 8 is the top of the wall,
 * which is four metres higher than the lawn — so the open bridge currently lands on the lawn rather than on
 * the wall, and the doc's "choose your way down" (to 2.5 or to 2) has nowhere to descend from. That file is
 * owned by another run and is NOT touched here. `yerba-buena.ts:224` also has a comment saying
 * `PATIO_H = 6` where `:304` computes 8; pre-existing, and not this file's to fix either.
 */
export const LEVELS = {
  /** street: Howard, 3rd, Folsom, 4th, and the carousel's true ground */
  street: 0,
  /** level 2 — the grassy part only, the lawn by the Public Square */
  garden: DECK_H,
  /** level 2.5 — the mezzanine most of the park sits on, half a storey up, deep enough for the ponds */
  mezzanine: DECK_H * 1.5,
  /** level 2.75 — the top of the curved dividing wall, where the OPEN skybridge lands */
  wall: DECK_H * 2,
  /** level 3 — the Children's Creativity Museum's second floor, and the upper walkway network */
  upper: DECK_H * 3,
} as const

/** The white parapet band carrying the fine fins, metres. Proportional, `ms-moscone-hall-1-howard.webp`. */
const LOUVRE_H = 3

/** How deep the open undercroft reaches in from the Howard face before it meets solid wall. Inferred. */
const UNDERCROFT_D = 9

/**
 * The heading `boxAlong` wants so that a box's local +x runs along `(dx, dz)`.
 *
 * `boxAlong` sends local +x to `(cos h, −sin h)` — Babylon's rotation.y, mirrored in z against the maths
 * convention — so this is `atan2(−dz, dx)` and NOT `atan2(dz, dx)`. Five bugs in this project have come from
 * the other one, and a square part hides it perfectly: it only shows on something much longer than it is
 * wide, which is every band, fin, rib and parapet in this file.
 */
const headAlong = (dx: number, dz: number): number => Math.atan2(-dz, dx)

/** The ring a builder should work on: the real footprint when there is one, the simplified box when not. */
function planRing(fit: Fit): P2[] {
  const raw = fit.ring && fit.ring.length >= 3 ? fit.ring : towerRing(fit)
  let twice = 0
  for (let i = 0; i < raw.length; i++) {
    const j = (i + 1) % raw.length
    twice += raw[i].x * raw[j].z - raw[j].x * raw[i].z
  }
  // anticlockwise, so `edgeAt`'s n = (tz, −tx) and `faceOn`'s own normal both point OUT
  return twice >= 0 ? raw.map((p) => ({ x: p.x, z: p.z })) : [...raw].reverse().map((p) => ({ x: p.x, z: p.z }))
}

/** A flat rectangular sub-plan: `t0`..`t1` along the frontage `e`, reaching `depth` metres in behind it. */
function slab(e: ReturnType<typeof edgeAt>, t0: number, t1: number, depth: number, front = 0): P2[] {
  const p = (t: number, d: number): P2 => ({
    x: e.a.x + e.tx * t + e.nx * (front - d),
    z: e.a.z + e.tz * t + e.nz * (front - d),
  })
  // p0 → p1 runs along the frontage, so edge 0 is the front, 1 the t1 end, 2 the back, 3 the t0 end
  return [p(t0, 0), p(t1, 0), p(t1, depth), p(t0, depth)]
}

// ==========================================================================================================
// A. way/426708093 — Moscone hall 1, the Howard side
// ==========================================================================================================

/**
 * The corner of Howard and 3rd: 80 m of Howard frontage by 50 m deep, six corners, and — this is the point of
 * it — NOT one box. `ms-moscone-hall-1-side-skybridges.webp` shows three sub-buildings stepping in height
 * along the frontage, and the OSM way puts two spare vertices in the middle of its back edge (they are
 * collinear, so `towerRing`'s simplifier throws them away, which is why this builder works on `fit.ring`).
 * Those two vertices are where the sub-buildings meet, and they are read off the ring rather than typed.
 *
 * From the pavement the striking thing is the DEEP OPEN UNDERCROFT: the mass is lifted 8 m and you see
 * through and under it to the piers and the dark back wall. Drawing a solid wall to the ground is the failure
 * the brief names, and it is invisible from any camera above eye level.
 */
export function mosconeHallHoward(out: MeshBuilder, fit: Fit): void {
  const ring = planRing(fit)
  const e = edgeAt(ring, longestEdge(ring))
  const L = e.L
  const D = depthFrom(ring, e)

  // where the sub-buildings meet: the ring's own interior vertices, projected onto the frontage
  const ts = [...new Set(ring
    .map((p) => Math.round(((p.x - e.a.x) * e.tx + (p.z - e.a.z) * e.tz) * 10) / 10)
    .filter((t) => t > L * 0.12 && t < L * 0.88)
    .map((t) => Math.round(t)))].sort((a, b) => a - b)
  const cuts = ts.length >= 2 ? [0, ts[0], ts[ts.length - 1], L] : [0, L / 3, (2 * L) / 3, L]

  const H = fit.height > 12 ? fit.height : 20
  // stepping in height along Howard: the 3rd Street end stands highest, the middle is the datum
  const tops = [H + 2, H, H + 1]

  for (let k = 0; k < 3; k++) {
    const t0 = cuts[k]
    const t1 = cuts[k + 1]
    if (t1 - t0 < 4) continue
    const top = tops[k]
    const sub = slab(e, t0, t1, D)
    const bandTop = top - LOUVRE_H

    undercroft(out, e, t0, t1, D)

    // ---- the recessed blue-green glazed band, and solid wall everywhere else
    const glazing: Face = { kind: 'curtain', wall: MULLION, glass: BLUEGREEN, pitch: 1.5, floor: 4.2, material: 'metal' }
    const blank: Face = { kind: 'blank', wall: PRECAST, material: 'concrete' }
    for (const i of [1, 2, 3]) faceOn(out, sub, i, UNDERCROFT_H, bandTop, blank)
    faceOn(out, sub, 0, UNDERCROFT_H + 1.0, bandTop, glazing, -0.9)
    // the dark edge beam the glazing sits on, in the plane of the parapet above it — it is what makes the
    // band read as RECESSED rather than as a wall that happens to be glass
    bandOn(out, e, t0, t1, UNDERCROFT_H, UNDERCROFT_H + 1.0, 0.45, SPANDREL, CONC)

    // ---- the white parapet with its fine fin band, the whole length of every elevation
    faceBand(out, offsetRing(sub, 0.35), bandTop, top, { kind: 'blank', wall: WHITE, material: 'concrete' })
    fins(out, e, t0, t1, bandTop + 0.4, top - 0.8)
    coping(out, offsetRing(sub, 0.35), top)

    // ---- the flat roof behind, and the solar arrays on it
    capPolygon(out, offsetRing(sub, -0.6), top - 1.4, WHITE_DK, CONC, 4)
    solar(out, e, t0 + 4, t1 - 4, D, top - 1.0)

    // ---- the pale perforated chequer screen over the end elevation away from 3rd Street
    if (k === 2) chequer(out, sub, 1, UNDERCROFT_H, top - 0.5)
  }
}

/** How far the ring reaches in behind its frontage — the mass's depth, derived rather than typed. */
function depthFrom(ring: P2[], e: ReturnType<typeof edgeAt>): number {
  let d = 0
  for (const p of ring) d = Math.max(d, -((p.x - e.a.x) * e.nx + (p.z - e.a.z) * e.nz))
  return d > 4 ? d : e.L * 0.5
}

/**
 * THE OPEN UNDERCROFT. Nothing stands in the front plane: a dark soffit overhead, free-standing piers under
 * it, and the solid wall set `UNDERCROFT_D` metres back in shadow. A rider on Howard looks straight in.
 */
function undercroft(out: MeshBuilder, e: ReturnType<typeof edgeAt>, t0: number, t1: number, D: number): void {
  const back = slab(e, t0, t1, D - UNDERCROFT_D, -UNDERCROFT_D)
  faceBand(out, back, 0, UNDERCROFT_H, { kind: 'blank', wall: UNDERCROFT, material: 'concrete' })
  // the soffit: a dark plate over the whole void, which is the face you see from the pavement
  capPolygon(out, slab(e, t0, t1, UNDERCROFT_D + 0.4), UNDERCROFT_H - 0.9, SOFFIT, CONC, 4)
  // free-standing piers in the front plane, one every ~9 m
  const n = Math.max(2, Math.round((t1 - t0) / 9))
  const h = headAlong(e.tx, e.tz)
  for (let i = 0; i <= n; i++) {
    const t = t0 + ((t1 - t0) * i) / n
    boxAlong(out, e.a.x + e.tx * t - e.nx * 1.1, (UNDERCROFT_H - 0.9) / 2, e.a.z + e.tz * t - e.nz * 1.1,
      0.7, (UNDERCROFT_H - 0.9) / 2, 0.7, h, PIER, CONC)
  }
}

/** A horizontal band lying on the frontage between `y0` and `y1`, standing `proud` metres out of it. */
function bandOn(out: MeshBuilder, e: ReturnType<typeof edgeAt>, t0: number, t1: number, y0: number, y1: number,
                proud: number, c: Rgb, tag: number): void {
  const t = (t0 + t1) / 2
  boxAlong(out, e.a.x + e.tx * t + e.nx * (proud / 2), (y0 + y1) / 2, e.a.z + e.tz * t + e.nz * (proud / 2),
    (t1 - t0) / 2, (y1 - y0) / 2, proud / 2 + 0.25, headAlong(e.tx, e.tz), c, tag)
}

/**
 * The fine rib inside the white parapet band. The band is horizontal and runs the whole length; the elements
 * in `ms-moscone-hall-1-howard.webp` are closely spaced VERTICAL ticks, which is what these are.
 */
function fins(out: MeshBuilder, e: ReturnType<typeof edgeAt>, t0: number, t1: number, y0: number, y1: number): void {
  const h = headAlong(e.tx, e.tz)
  const n = Math.max(4, Math.round((t1 - t0) / 1.6))
  for (let i = 0; i < n; i++) {
    const t = t0 + ((t1 - t0) * (i + 0.5)) / n
    boxAlong(out, e.a.x + e.tx * t + e.nx * 0.55, (y0 + y1) / 2, e.a.z + e.tz * t + e.nz * 0.55,
      0.14, (y1 - y0) / 2, 0.22, h, WHITE, CONC)
  }
}

/**
 * The parapet's coping: a band round the EDGES of the roof, never a cap over it. A `capPolygon` at parapet
 * height looked right in elevation and was wrong — it lidded the whole roof and the solar arrays behind it
 * vanished, which only the top view showed.
 */
function coping(out: MeshBuilder, ring: P2[], y: number): void {
  for (let i = 0; i < ring.length; i++) {
    const s = edgeAt(ring, i)
    if (s.L < 1.5) continue
    boxAlong(out, s.mid.x, y - 0.3, s.mid.z, s.L / 2, 0.3, 0.55, headAlong(s.tx, s.tz), WHITE, CONC)
  }
}

/**
 * The solar arrays on the flat roof. The brief asks for them because they are seen from the north block's
 * decks and from both bridges looking down, not from the street. Flat panels on short legs, in rows.
 */
function solar(out: MeshBuilder, e: ReturnType<typeof edgeAt>, t0: number, t1: number, D: number, y: number): void {
  if (t1 - t0 < 8 || D < 16) return
  const h = headAlong(e.tx, e.tz)
  const rows = Math.max(1, Math.floor((D - 10) / 6))
  const cols = Math.max(1, Math.floor((t1 - t0) / 7))
  const cw = (t1 - t0) / cols
  for (let r = 0; r < rows; r++) {
    const d = UNDERCROFT_D + 2 + r * 6 + 2.5
    for (let c = 0; c < cols; c++) {
      const t = t0 + cw * (c + 0.5)
      const cx = e.a.x + e.tx * t - e.nx * d
      const cz = e.a.z + e.tz * t - e.nz * d
      boxAlong(out, cx, y + 0.55, cz, cw / 2 - 0.5, 0.09, 2.1, h, SOLAR, METAL)
      boxAlong(out, cx, y + 0.25, cz, cw / 2 - 0.5, 0.25, 0.12, h, SOLAR_FRAME, METAL)
    }
  }
}

/**
 * The pale perforated/translucent screen over one end elevation — a large fine chequer, quite different from
 * the blue-green band. A translucent plane with a grid of pale panels standing off it.
 */
function chequer(out: MeshBuilder, sub: P2[], edge: number, y0: number, y1: number): void {
  const e = edgeAt(sub, edge)
  const h = headAlong(e.tx, e.tz)
  faceOn(out, sub, edge, y0, y1, { kind: 'blank', wall: SCREEN, material: 'metal' }, 0.5)
  const cols = Math.max(4, Math.round(e.L / 2.6))
  const rows = Math.max(3, Math.round((y1 - y0) / 2.6))
  const cw = e.L / cols
  const rh = (y1 - y0) / rows
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if ((r + c) % 2 === 1) continue
      const t = cw * (c + 0.5)
      boxAlong(out, e.a.x + e.tx * t + e.nx * 0.75, y0 + rh * (r + 0.5), e.a.z + e.tz * t + e.nz * 0.75,
        cw / 2 - 0.18, rh / 2 - 0.18, 0.12, h, WHITE, METAL)
    }
  }
}

// ==========================================================================================================
// B. way/27572497 — Yerba Buena Ice Skating Center
// ==========================================================================================================

/**
 * The owner: *"it's basically a box with a smaller box on top and a roof. this is the easiest of the
 * buildings on this block."* So it goes through `facade()` — a plain precast box, a banded middle, a setback
 * top — and then three things the slot grammar has no word for, all of them visible in
 * `ms-veranda-pink-and-ice-rink.webp`:
 *
 *   - the pale silver STANDING-SEAM metal roof with a strong fine rib over the whole plan;
 *   - the tall blank CREAM wall at the end away from the monumental stair;
 *   - the low white SERVICE BLOCKS along the base.
 *
 * The roof is drawn rib by rib rather than with `stripRoof`, which calls `insetRing` internally: this way has
 * a 6 m re-entrant entrance bump on its south corner, and `insetRing` inverts on a concave ring (the reason
 * `offsetRing` exists). Everything here that offsets the plan uses `offsetRing`.
 */
export function yerbaBuenaIceRink(out: MeshBuilder, fit: Fit): void {
  const ring = planRing(fit)
  const f = longestEdge(ring)
  const e = edgeAt(ring, f)
  const H = fit.height > 8 ? fit.height : 18

  // a box, a smaller box on top, and a roof — in that order and at those heights
  const wallTop = H * 0.6
  /*
   * The smaller box on top, as a clean RECTANGLE inset from the frontage rather than an offset of the plan.
   * This way has a 6 m re-entrant entrance bump on its south corner, and offsetting a ring inward by more
   * than the bump is wide folds it inside out: the first render had a white triangular sliver slashing
   * across the roof, which is that fold seen from above.
   */
  const d = depthFrom(ring, e)
  const upperRing = slab(e, 9, e.L - 9, Math.max(6, d - 18), -9)
  const upperTop = H * 0.86

  /*
   * `facade()` raises the BIG BOX ONLY: it is handed the wall height, not the building's, so its tiers stop
   * under the roof. Letting it run to `fit.height` with a `setback` top put its own upper box in the same
   * space as the smaller box below, and the first render came back as a lid with things sticking through it.
   */
  facade(out, { ...fit, height: wallTop, ring }, {
    ground: { kind: 'plain', storeys: 1, material: 'precast' },
    shaft: { storeys: 2, windows: 'horizontal', material: 'precast' },
    top: null,
    bands: { aboveGround: null, belowTop: null, top: 'cornice' },
    crown: { kind: 'flat' },
    frame: null,
    entrance: { at: 'centre', kind: 'recessed', steps: 0 },
    material: 'precast',
  })

  // the pale silver standing-seam roof over the whole plan, and the smaller box standing out of it
  ribbedRoof(out, offsetRing(ring, -0.3), wallTop, 1.4)
  faceBand(out, upperRing, wallTop, upperTop, { kind: 'blank', wall: PRECAST, material: 'concrete' })
  ribbedRoof(out, upperRing, upperTop, 1.1)

  // ---- the tall blank cream wall at the end away from the monumental Folsom stair
  const west = endEdge(ring, e, 'near')
  if (west >= 0) {
    const w = edgeAt(ring, west)
    boxAlong(out, w.mid.x + w.nx * 0.45, (wallTop + 2.6) / 2, w.mid.z + w.nz * 0.45,
      w.L / 2, (wallTop + 2.6) / 2, 0.5, headAlong(w.tx, w.tz), CREAM, CONC)
  }

  // ---- the low white service blocks along the base, on both long elevations
  for (const i of [f, opposite(ring, e)]) {
    if (i < 0) continue
    const s = edgeAt(ring, i)
    const h = headAlong(s.tx, s.tz)
    const n = Math.max(2, Math.round(s.L / 22))
    for (let k = 0; k < n; k++) {
      const t = (s.L * (k + 0.5)) / n
      boxAlong(out, s.a.x + s.tx * t + s.nx * 2.0, 2.1, s.a.z + s.tz * t + s.nz * 2.0,
        s.L / n / 2 - 3.5, 2.1, 2.4, h, WHITE, CONC)
      box(out, s.a.x + s.tx * t + s.nx * 2.0, 4.3, s.a.z + s.tz * t + s.nz * 2.0, 0.6, 0.1, 0.6, WHITE_DK, CONC)
    }
  }
}

/**
 * A shallow pale roof over `ring` at `y`, with a fine standing-seam rib running down the slope. It finds its
 * OWN long edge: the first version was handed the outer building's, so the ribs of the upper roof were laid
 * out on the outer plan and stuck 9 m out into the air as spikes — visible only from the low street view.
 */
function ribbedRoof(out: MeshBuilder, ring: P2[], y: number, rise: number): void {
  capPolygon(out, ring, y + rise, SILVER, METAL, 4)
  const e = edgeAt(ring, longestEdge(ring))
  let d = 0
  for (const p of ring) d = Math.max(d, -((p.x - e.a.x) * e.nx + (p.z - e.a.z) * e.nz))
  if (d < 2) return
  const h = headAlong(-e.nx, -e.nz)
  const n = Math.max(6, Math.round(e.L / 1.5))
  for (let i = 0; i < n; i++) {
    const t = (e.L * (i + 0.5)) / n
    boxAlong(out, e.a.x + e.tx * t - e.nx * (d / 2), y + rise + 0.1, e.a.z + e.tz * t - e.nz * (d / 2),
      d / 2 - 0.8, 0.1, 0.11, h, SILVER_DK, METAL)
  }
  // the fascia all round, so the roof has an edge rather than floating
  for (let i = 0; i < ring.length; i++) {
    const s = edgeAt(ring, i)
    if (s.L < 1.5) continue
    boxAlong(out, s.mid.x + s.nx * 0.15, y + rise - 0.4, s.mid.z + s.nz * 0.15,
      s.L / 2, 0.5, 0.3, headAlong(s.tx, s.tz), SILVER, METAL)
  }
}

/** The edge opposite the frontage: the longest one running the other way along the plan. */
function opposite(ring: P2[], e: ReturnType<typeof edgeAt>): number {
  let best = -1
  let L = 0
  for (let i = 0; i < ring.length; i++) {
    const s = edgeAt(ring, i)
    if (s.L < L || s.tx * e.tx + s.tz * e.tz > -0.8) continue
    L = s.L
    best = i
  }
  return best
}

/**
 * An END edge of the plan: long enough to matter, running across the frontage rather than along it, and at
 * the `near` (t ≈ 0) or far (t ≈ L) end of it. Compass-free, so it survives either fitting frame.
 */
function endEdge(ring: P2[], e: ReturnType<typeof edgeAt>, which: 'near' | 'far'): number {
  let best = -1
  let score = which === 'near' ? Infinity : -Infinity
  for (let i = 0; i < ring.length; i++) {
    const s = edgeAt(ring, i)
    if (s.L < e.L * 0.3) continue
    if (Math.abs(s.tx * e.tx + s.tz * e.tz) > 0.6) continue
    const t = (s.mid.x - e.a.x) * e.tx + (s.mid.z - e.a.z) * e.tz
    if (which === 'near' ? t < score : t > score) { score = t; best = i }
  }
  return best
}

export const MOSCONE_SOUTH: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  mosconeHallHoward,
  yerbaBuenaIceRink,
}
