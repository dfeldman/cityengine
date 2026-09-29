/**
 * MOSCONE SOUTH — THE PARK LEVEL: Yerba Buena Public Square, the Children's Garden, and the level changes
 * that connect them.
 *
 * `docs/MOSCONE-SOUTH.md` is the brief; the evidence is the owner's own hand-captured aerials,
 * `docs/shots/refs/aerials/ms-*.webp` — chiefly `ms-LABELLED-DIAGRAM.webp` (names every structure),
 * `ms-childrens-garden-overhead.webp` (the plan: pond, fountain plaza, play landscape, oval lawn) and
 * `ms-public-square-amphitheatre.webp` (the concentric stepped grass terraces, close).
 *
 * ---- THE PARK IS ITS OWN OSM POLYGON, and this file stands on it (BUGS.md #146)
 *
 * `way/613665502`, `place=square`, "Yerba Buena Public Square" — 59 corners, 148.9 × 108.4 m. Until
 * 2026-09-23 this entry was a free `lat/lon` + `size: [160, 160]` box **22 m west of that polygon and the
 * wrong shape**, which is what made the open skybridge look 45 m short of anything. `PARK_RING` below is
 * that way, measured with the project's own projection and held relative to its bbox centre — the same
 * treatment `GARDEN_RING` and `SOUTH_RING` get in `sf/yerba-buena.ts`, and preferred to a box because the
 * one number this whole file turns on is READ OFF the ring rather than typed: see `JOIN`.
 *
 * The ring is axis-aligned in the BLOCK frame (45°), which is the check that the frame is right.
 *
 * ---- THE JOIN, which is what the block is for
 *
 * `PARK_RING` shares three corners with `way/109141776` (Moscone South). Its north-west boundary over
 * u ∈ [−29.0, +12.6] IS Moscone South's south-east face, a straight 41.6 m run at v = −37.9. `JOIN` finds
 * that edge in the ring (longest run of constant `v` on the north-west side) rather than typing it.
 *
 * `mosconeSouthDeck` (`sf/yerba-buena.ts`) caps Moscone South at `PATIO_H = 8 = LEVELS.wall`, and the open
 * skybridge lands on that deck. So **the wall belongs on the join** — its top walk at `LEVELS.wall` runs
 * right up to the join line, where the deck at the same height begins. A rider comes off the bridge on to
 * the deck at 8, crosses it south-east, and steps on to the wall walk with no change of height at all.
 *
 * The wall is an arc concentric with the amphitheatre, so it cannot BE a straight line: its outer face at
 * `MEZ_R` is tangent to the join in the middle and falls away to 10 m inside it at the two ends. That wedge
 * is not left as a gap — `wallTopPlaza()` caps it at `LEVELS.wall` too, so the walkable surface at 8 reaches
 * the join line along the whole 41.6 m of it. The plaza IS the skybridge's landing; there is no separate
 * bay hung inward over the terraces any more.
 *
 * ---- AND THE HEIGHT OF THAT 8 — the owner's *"the levels between the blocks don't connect"*
 *
 * `LEVELS.wall` is 8 above the MODEL'S BASE, and `render/landmarks.ts` puts a lat/lon landmark's base at the
 * lowest terrain under its `size` box minus 0.5. Two of this park's bbox corners are not park: the
 * south-east one is Folsom Street, 1.7 m below anything the polygon touches. Measured against the baked
 * terrain: the box rule gave base −77.664, so this 8 sat at −69.664 while `mosconeSouthDeck`'s own 8 sat at
 * −67.419 — the 2.25 m step. The terrain under `PARK_RING` itself is −75.44 … −74.77, so the step is an
 * artefact of the box, not of the ground. The entry carries `offset: [0, 2.25, 0]`, derived from those two
 * numbers, and the two surfaces at 8 are now the same surface. The bridge's own deck is at −67.189, 0.23 m
 * above the deck it lands on, and stops 5.7 m short of it: both in `sf/yerba-buena.ts`, both reported.
 *
 * ---- THE HEIGHTS ARE NOT TYPED HERE
 *
 * Every walkable height in this file comes from `LEVELS` in `./moscone-south.ts`. `UNDERCROFT_H` is imported
 * too, and is the one number this file checks rather than uses: it is the height both Howard crossings leave
 * the north block at, and it equals `LEVELS.wall`.
 *
 *     LEVELS.garden     4    level 2    — the bowl's floor and the big lawn at the south-west end
 *     LEVELS.mezzanine  6    level 2.5  — the Children's Garden at the north-east end, and the bowl's rim
 *     LEVELS.wall       8    level 2.75 — the wall walk and its plaza, level with the Moscone South deck
 *     LEVELS.upper     12    level 3    — the museum walkway
 *
 * ---- THE HINGE, in one paragraph
 *
 * The wall sweeps from the park's south-east side round through north-east and north-west to the join's
 * south-west corner. Over the join span (`JOIN_T0`…`JOIN_T1`) its outer edge is the deck. Over the rest
 * (`WALL_T0`…`JOIN_T0`) its outer face is exposed to the Children's Garden at `LEVELS.mezzanine`, and the
 * concrete `ramp` descends off it there — **descent A, to the Children's Park at 6.** Two curved esplanades
 * (`arcStair`, `climb: 'in'`) fall off the INNER face at the wall's two ends to the bowl floor —
 * **descent B, to the grassy circle at 4.** Three more flights climb out of the bowl on to the walk at the
 * angles the terraces are quartered at.
 *
 * ---- FRAME
 *
 * The entry is placed by lat/lon with no `rotateDeg`, so the model's own axes ARE the city's: +x east,
 * +z north. **The origin is the park polygon's bbox centre**, not the amphitheatre's centre — the ring is
 * what is measured, so the ring is what the origin belongs to. The amphitheatre's centre is `C`, derived:
 * its `v` is the join line plus `MEZ_R` (that is what puts the wall on the join) and its `u` is the join's
 * midpoint. `at(u, v)` is the block frame — `u` north-east along the block, `v` south-east across it — and
 * `pol(t, r)` is polar about `C`.
 *
 * ---- WHICH END IS WHICH — read off `ms-LABELLED-DIAGRAM.webp`, and confirmed in OSM
 *
 * The Children's Garden is NORTH-EAST of the Public Square, beyond the wall; the big lawn, the Creativity
 * Museum and the carousel are SOUTH-WEST, and the bowl opens that way. `way/288716388` (Children's
 * Creativity Museum) lands at u −97 … −58 in this frame, and the ice rink `way/27572497` at v ≈ +48 —
 * both agree with the diagram.
 *
 * ---- WHERE THIS COLLIDES WITH OTHER RUNS' WORK, reported and NOT fixed
 *
 * Nothing in this file now crosses `way/109141776`: the wall plaza stops ON the join line and the park's own
 * polygon is entirely south-east of it. The unresolved `mosconeHall` / `mosconeSouthDeck` collision on that
 * way is therefore no longer something this builder is party to — but it still stands between the bridge and
 * this park, and `mosconeSouthDeck` draws a solid parapet along the join edge itself. Both are reported.
 */
import type { MeshBuilder } from '../../buildings.ts'
import { capPolygon, capPolygonWithHoles } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { type Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { arcStair, edgeAt, railing, ramp, stair } from '../parts.ts'
import { LEVELS, UNDERCROFT_H } from './moscone-south.ts'

type P2 = { x: number; z: number }

const CONC = surfaceTag('concrete')

const PAVING: Rgb = [0.79, 0.77, 0.72]
const PAVING_DK: Rgb = [0.64, 0.62, 0.58]
const PRECAST: Rgb = [0.82, 0.81, 0.78]
const PRECAST_DK: Rgb = [0.55, 0.54, 0.52]
const LAWN: Rgb = [0.35, 0.53, 0.26]
const LAWN_DK: Rgb = [0.27, 0.43, 0.2]
const RED_PAVING: Rgb = [0.65, 0.33, 0.26]
const RED_PAVING_DK: Rgb = [0.52, 0.25, 0.2]
const WATER: Rgb = [0.27, 0.56, 0.55]
const WATER_DK: Rgb = [0.18, 0.41, 0.42]
const PLAY_BLUE: Rgb = [0.62, 0.76, 0.82]
const PLAY_GREEN: Rgb = [0.6, 0.72, 0.5]
const BED: Rgb = [0.3, 0.34, 0.22]

/** The block's own axis, 45° — `way/109141776`'s south-east face bears 45.2°, and `PARK_RING` is square to it. */
const AX = Math.PI / 4
/** north-east, ALONG the block */
const UX = Math.cos(AX)
const UZ = Math.sin(AX)
/** south-east, ACROSS the block */
const VX = Math.sin(AX)
const VZ = -Math.cos(AX)

/** A point in the block frame: `u` metres north-east, `v` metres south-east, OF THE PARK'S BBOX CENTRE. */
const at = (u: number, v: number): P2 => ({ x: UX * u + VX * v, z: UZ * u + VZ * v })
/** The same map backwards, for reading the ring. */
const uvOf = (p: P2): { u: number; v: number } => ({ u: p.x * UX + p.z * UZ, v: p.x * VX + p.z * VZ })

/**
 * `way/613665502`, "Yerba Buena Public Square" (`place=square`), in metres relative to its own bbox centre
 * (x east, z north), as OSM has it. 59 corners: the rounded south-west end toward the Creativity Museum,
 * the straight 41.6 m north-west run shared with Moscone South, and the north-east lobe beside Folsom.
 */
const PARK_RING: P2[] = ([
  [-11.9, -49.4], [-14.2, -51.1], [-17.1, -52.5], [-20.3, -53.6], [-23.8, -54.2], [-27.9, -54.2],
  [-31.8, -53.4], [-35.0, -52.2], [-37.5, -50.7], [-40.6, -47.5], [-43.1, -45.1], [-43.4, -42.8],
  [-44.1, -40.0], [-45.4, -37.6], [-46.9, -35.8], [-49.0, -34.0], [-50.9, -33.1], [-52.7, -32.3],
  [-56.1, -31.8], [-57.7, -31.9], [-59.9, -32.3], [-62.2, -32.4], [-65.3, -31.8], [-67.3, -31.0],
  [-69.6, -29.3], [-71.3, -27.6], [-72.9, -25.0], [-73.6, -21.9], [-73.7, -20.0], [-73.5, -16.4],
  [-73.1, -14.4], [-72.4, -12.1], [-72.0, -11.4], [-74.5, -9.7], [-71.9, -7.0], [-62.6, 4.3],
  [-61.2, 5.7], [-60.7, 6.3], [-59.2, 7.7], [-53.7, 12.7], [-47.3, 6.3], [-18.0, 35.8], [-15.1, 32.7],
  [-13.4, 30.0], [-11.2, 27.9], [-9.4, 29.6], [-7.4, 31.6], [-8.6, 32.7], [-5.4, 35.8], [-2.2, 39.0],
  [12.6, 53.9], [13.0, 54.2], [13.7, 53.7], [74.5, -5.7], [69.0, -11.4], [64.3, -15.9], [39.8, 9.1],
  [-8.5, -39.5], [-10.0, -45.2],
] as [number, number][]).map(([x, z]) => ({ x, z }))

/**
 * THE JOIN: the ring edge that Moscone South's deck stands on. Found, not typed — the longest edge of the
 * ring that runs along the block (`v` constant) on the north-west side. `i` is its first corner's index,
 * which is what splits the ring into the level-2 half (walking back from `i`) and the mezzanine half
 * (walking on from `i + 1`).
 */
const JOIN = ((): { v: number; u0: number; u1: number; i: number } => {
  let best: { v: number; u0: number; u1: number; i: number } | null = null
  for (let i = 0; i < PARK_RING.length; i++) {
    const a = uvOf(PARK_RING[i])
    const b = uvOf(PARK_RING[(i + 1) % PARK_RING.length])
    if (Math.abs(a.v - b.v) > 1) continue
    if (Math.abs(a.u - b.u) < 20) continue
    const v = (a.v + b.v) / 2
    if (v > 0 || (best && v > best.v)) continue
    best = { v, u0: Math.min(a.u, b.u), u1: Math.max(a.u, b.u), i }
  }
  return best!
})()

// ---- the amphitheatre's own radii, and where its centre has to be. ---------------------------------------
/** the circular grass floor at `LEVELS.garden` */
const FLOOR_R = 9.5
/** the head of the grass terraces, at `LEVELS.mezzanine`: also the curved wall's inner face */
const RIM_R = 22
/** the curved wall's outer face, and where the Children's Garden mezzanine begins */
const MEZ_R = 27

/**
 * The amphitheatre's centre, DERIVED: `MEZ_R` south-east of the join line, so the wall's outer face is
 * tangent to the deck edge, and on the join's midpoint so the wedge either side of the tangent is even.
 * This single pair of numbers is what puts the wall where the deck meets the park.
 */
const CU = (JOIN.u0 + JOIN.u1) / 2
const CV = JOIN.v + MEZ_R
const C = at(CU, CV)

/** A point at `r` metres and `t` TURNS about `C` (the `arcStair` convention: 0 = +x/east, 0.25 = +z/north). */
const pol = (t: number, r: number): P2 =>
  ({ x: C.x + Math.cos(t * Math.PI * 2) * r, z: C.z + Math.sin(t * Math.PI * 2) * r })

/** North-east, in turns: the direction the block runs. `u` of a polar point is `r·cos(2π(t − NE))`. */
const NE = AX / (Math.PI * 2)

/**
 * The two turns at which the `MEZ_R` circle crosses the join's north-east end, `u = JOIN.u1`. The one on the
 * north-west side (`JOIN_T0`) is where the deck stops being the wall's outer edge; the one on the south-east
 * side (`WALL_T0`) is where the wall itself stops. Both are `acos`, not a reading.
 */
const T_HALF = Math.acos((JOIN.u1 - CU) / MEZ_R) / (Math.PI * 2)
const WALL_T0 = NE - T_HALF
const JOIN_T0 = NE + T_HALF
/** the join's south-west end, and the wall's far end with it */
const JOIN_T1 = NE + Math.acos((JOIN.u0 - CU) / MEZ_R) / (Math.PI * 2)
const WALL_T1 = JOIN_T1

/** The two curved esplanades down the inner face: one at each end of the wall, inside it. */
const ESP_W = 0.055
const ESP: [number, number][] = [[WALL_T0, WALL_T0 + ESP_W], [WALL_T1 - ESP_W, WALL_T1]]
/** the terraces occupy the wall's sweep between the two esplanades */
const TER_T0 = WALL_T0 + ESP_W + 0.012
const TER_T1 = WALL_T1 - ESP_W - 0.012
/** the five radii the terraces are QUARTERED at: the cross paths, and the gaps between the four sweeps */
const CUTS = [0, 1, 2, 3, 4].map((k) => TER_T0 + ((TER_T1 - TER_T0) * k) / 4)
/** the three of them that carry on UP through the wall to `LEVELS.wall` */
const STEP_UP = [CUTS[1], CUTS[2], CUTS[3]]
/** the concrete ramp to the Children's Garden: off the wall's EXPOSED outer face, between `WALL_T0` and `JOIN_T0` */
const RAMP_T = NE - T_HALF * 0.25

export function msGardens(out: MeshBuilder, _fit?: Fit): void {
  // The one consistency check this file makes rather than a number it uses: the open Howard crossing leaves
  // the north block at UNDERCROFT_H and has to arrive level, so the wall it lands on is that height.
  if (UNDERCROFT_H !== LEVELS.wall) console.warn(`ms-gardens: wall ${LEVELS.wall} is not the bridge's ${UNDERCROFT_H}`)

  levelTwo(out)
  mezzanine(out)
  amphitheatre(out)
  dividingWall(out)
  childrensGarden(out)
  museumWalkway(out)
}

// ==========================================================================================================
// surfaces
// ==========================================================================================================

/** An ellipse in the BLOCK frame, as a ring. */
function oval(cu: number, cv: number, ru: number, rv: number, n = 40): P2[] {
  const r: P2[] = []
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    r.push(at(cu + Math.cos(a) * ru, cv + Math.sin(a) * rv))
  }
  return r
}

/** A rectangle in the BLOCK frame. */
const rect = (u0: number, v0: number, u1: number, v1: number): P2[] =>
  [at(u0, v0), at(u1, v0), at(u1, v1), at(u0, v1)]

/** A straight paved strip of width `w` from one block-frame point to another. */
function strip(u0: number, v0: number, u1: number, v1: number, w: number): P2[] {
  const du = u1 - u0
  const dv = v1 - v0
  const L = Math.hypot(du, dv) || 1
  const nu = (-dv / L) * (w / 2)
  const nv = (du / L) * (w / 2)
  return [at(u0 + nu, v0 + nv), at(u1 + nu, v1 + nv), at(u1 - nu, v1 - nv), at(u0 - nu, v0 - nv)]
}

/**
 * The vertical face round a ring, from `yTop` down to `yBot`. This is what stops a capped surface reading as
 * a sheet of paper floating in the air, which is the only thing a top-down render cannot show you.
 */
function apron(out: MeshBuilder, ring: P2[], yTop: number, yBot: number, c: Rgb, cD: Rgb, tag = CONC): void {
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]
    const b = ring[(i + 1) % ring.length]
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    if (L < 0.01) continue
    // outward normal in the `edgeAt` sense, so the face lights from the side a rider stands on
    const nx = (b.z - a.z) / L
    const nz = -(b.x - a.x) / L
    out.quad([[a.x, yBot, a.z], [b.x, yBot, b.z], [b.x, yTop, b.z], [a.x, yTop, a.z]],
      [nx, 0, nz], [[0, 0], [L / 4, 0], [L / 4, (yTop - yBot) / 4], [0, (yTop - yBot) / 4]],
      i % 2 === 0 ? c : cD, tag)
  }
}

/** A swept cylindrical face about `C` — the curved wall's two faces, and the rim of a sunken pool. */
function arcFace(out: MeshBuilder, r: number, t0: number, t1: number, yBot: number, yTop: number,
                 c: Rgb, outward: boolean, tag = CONC): void {
  const seg = Math.max(8, Math.min(96, Math.round(((t1 - t0) * Math.PI * 2 * r) / 1.6)))
  const s = outward ? 1 : -1
  for (let i = 0; i < seg; i++) {
    const a = pol(t0 + ((t1 - t0) * i) / seg, r)
    const b = pol(t0 + ((t1 - t0) * (i + 1)) / seg, r)
    const mx = ((a.x + b.x) / 2 - C.x) / r * s
    const mz = ((a.z + b.z) / 2 - C.z) / r * s
    out.quad([[a.x, yBot, a.z], [b.x, yBot, b.z], [b.x, yTop, b.z], [a.x, yTop, a.z]],
      [mx, 0, mz], [[0, 0], [1, 0], [1, 1], [0, 1]], c, tag)
  }
}

/** An arc about `C` as a polyline. */
function arc(r: number, t0: number, t1: number): P2[] {
  const seg = Math.max(6, Math.min(96, Math.round((Math.abs(t1 - t0) * Math.PI * 2 * r) / 1.6)))
  const line: P2[] = []
  for (let i = 0; i <= seg; i++) line.push(pol(t0 + ((t1 - t0) * i) / seg, r))
  return line
}

/** An annular sector as a ring, for capping the wall's top walk. */
const annulus = (r0: number, r1: number, t0: number, t1: number): P2[] =>
  [...arc(r1, t0, t1), ...arc(r0, t1, t0)]

/** A full circle about `C` as a ring. */
const disc = (r: number, n = 56): P2[] => Array.from({ length: n }, (_, i) => pol(i / n, r))

/**
 * THE WALL-TOP PLAZA, as a ring: the wedge between the wall's outer face and the join line, which is what
 * makes the walk at `LEVELS.wall` reach the deck along the whole 41.6 m of the join instead of touching it
 * at one tangent point. Its two ends are square across the block (constant `u`), which is not a choice —
 * `JOIN_T0` and `JOIN_T1` are defined as the turns where the circle crosses `JOIN.u1` and `JOIN.u0`.
 */
const plazaRing = (): P2[] =>
  [...arc(MEZ_R, JOIN_T0, JOIN_T1), at(JOIN.u0, JOIN.v), at(JOIN.u1, JOIN.v)]

// ==========================================================================================================
// LEVEL 2 — the bowl's floor and the big lawn at the south-west end
// ==========================================================================================================

/**
 * The level-2 half of the park: everything south-west of the join's north-east end, which is the whole of
 * the Public Square. Walked BACK from the join edge along the real ring until the ring turns north-east
 * again, then closed square across the block — so the plate is the park's own outline, not a box hung over
 * Howard Street as the `size` box was.
 */
/**
 * How many of the ring's corners belong to the level-2 half: walking BACK from the join edge, the run that
 * stays south-west of the join's north-east end. The mezzanine gets exactly the rest, so the two halves
 * share their two cut lines and no corner is used twice or dropped. Counted, not indexed by hand — the
 * north-east lobe dips back below `JOIN.u1` by a metre in three places, and a per-corner test walked into
 * that dip and stopped there, which left the Children's Garden a sixth of its size.
 */
const SPLIT = ((): number => {
  let n = 1
  const N = PARK_RING.length
  while (n < N && uvOf(PARK_RING[(JOIN.i - n + N * 2) % N]).u <= JOIN.u1) n++
  return n
})()

function levelTwoRing(): P2[] {
  const N = PARK_RING.length
  const ring = Array.from({ length: SPLIT }, (_, k) => PARK_RING[(JOIN.i - k + N * 2) % N])
  const last = uvOf(ring[ring.length - 1])
  ring.push(at(JOIN.u1, last.v), at(JOIN.u1, JOIN.v))
  return ring
}

function levelTwo(out: MeshBuilder): void {
  /*
   * The vertical spacing of these caps is not decoration. `tools/nonbuildings.ts` found ELEVEN pairs of
   * horizontal surfaces within 2 cm here on the first pass, the largest 3625 m² — z-fighting, which a still
   * render will not always show and a moving camera always will. Every cap is now at least 4 cm clear of
   * the one under it, and the base plate sits BELOW `LEVELS.garden` because every flight in this file draws
   * its own closed underside at exactly that height.
   */
  const sw = levelTwoRing()
  capPolygon(out, sw, LEVELS.garden - 0.10, PAVING, CONC, 6)
  capPolygon(out, disc(MEZ_R), LEVELS.garden - 0.06, PAVING, CONC, 6)
  // the park stops somewhere, and that edge is a wall. The level-1 Moscone hall under it is sf/moscone-south.ts'.
  apron(out, sw, LEVELS.garden - 0.10, LEVELS.street, PRECAST, PRECAST_DK)

  // ---- the BIG LAWN: the dark oval ringed by a curved walk, south-west of the amphitheatre in the overhead
  // sized to the real west end: at v ≈ +4 the ring's own boundary is u = −62, and a 16 m halo on the old
  // centre put grass 3 m out over Howard at 4 m — the size-box fault again, one scale down
  const lawn = oval(CU - 39, CV + 15, 11, 12)
  capPolygon(out, oval(CU - 39, CV + 15, 13.5, 14.5), LEVELS.garden + 0.09, PAVING_DK, CONC, 4)
  capPolygon(out, lawn, LEVELS.garden + 0.20, LAWN, 0, 6)

  // ---- the amphitheatre's own circular grass floor, and the CROSS of paths over it the aerial shows
  capPolygon(out, disc(FLOOR_R), LEVELS.garden + 0.05, LAWN, 0, 6)
  capPolygon(out, strip(CU - FLOOR_R - 1, CV, CU + FLOOR_R + 1, CV, 3.4), LEVELS.garden + 0.14, PAVING, CONC, 3)
  capPolygon(out, strip(CU, CV - FLOOR_R - 1, CU, CV + FLOOR_R + 1, 3.4), LEVELS.garden + 0.14, PAVING, CONC, 3)

  // ---- the walk that joins the bowl to the lawn, on the open south-west side
  capPolygon(out, strip(CU - 11, CV + 3, CU - 34, CV + 13, 9), LEVELS.garden + 0.14, PAVING, CONC, 4)
}

// ==========================================================================================================
// LEVEL 2.5 — the mezzanine: the Children's Garden, north-east of the wall
// ==========================================================================================================

/**
 * The Children's Garden deck. Its south-west boundary is the wall — the exposed outer face for the wall's
 * whole unjoined sweep, then the plaza's square north-east end — which is why the wall reads as a division
 * rather than as an object standing on a lawn. Everything else is the real ring.
 */
function mezRing(): P2[] {
  const N = PARK_RING.length
  const ring = Array.from({ length: N - SPLIT }, (_, k) => PARK_RING[(JOIN.i + 1 + k) % N])
  const last = uvOf(ring[ring.length - 1])
  ring.push(at(JOIN.u1, last.v))
  // back along the wall's outer face — `WALL_T0` and `JOIN_T0` both sit exactly on u = JOIN.u1
  ring.push(...arc(MEZ_R, WALL_T0, JOIN_T0))
  return ring
}

/**
 * The pond and the play landscape are HOLES in the deck, not shapes drawn on it. The first render of this
 * file capped the mezzanine as one polygon and sank the pond 0.95 m below it: from above, the deck simply
 * covered the water and there was no pond in the park at all. `capPolygonWithHoles` is what makes the half
 * storey the brief calls "depth for the ponds" visible.
 */
function mezzanine(out: MeshBuilder): void {
  const ring = mezRing()
  // the deck is the DARKER paving so the walks over it read: with both the same, the 'along' render showed
  // one unbroken white plane and no route through the park at all
  capPolygonWithHoles(out, [ring, ...sunkRings()], LEVELS.mezzanine - 0.06, PAVING_DK, CONC, 6)
  apron(out, ring, LEVELS.mezzanine - 0.06, LEVELS.street, PRECAST, PRECAST_DK)
}

/** The Children's Garden's own block-frame anchor: the north-east end of the park, beyond the wall. */
const GU = JOIN.u1
/** The two sunk basins, wound the other way round so earcut takes them as holes. */
const POND = (): P2[] => oval(GU + 28.4, CV + 46, 5, 12)
const PLAY = (): P2[] => oval(GU + 13.4, CV + 21, 7, 6)
const sunkRings = (): P2[][] => [POND(), PLAY()].map((r) => [...r].reverse())

// ==========================================================================================================
// THE AMPHITHEATRE — concentric stepped grass terraces, quartered by cross paths
// ==========================================================================================================

/*
 * `tread: 'alternate'` — a grass strip, then a paved strip — and NOT `'grass'`, which the brief asked for.
 * The first top-down render settled it: with every tier grass, the risers are the only thing between them
 * and from directly above a whole quarter is one flat green wedge. `ms-public-square-amphitheatre.webp`
 * shows what is actually there — green tiers separated by pale concrete bands — and that banding is what
 * makes the figure read from the air, which is the whole claim made for it.
 */
const TER_RISER = 0.2
const TER_RUN = RIM_R - FLOOR_R

function amphitheatre(out: MeshBuilder): void {
  const gap = 0.024
  for (let k = 0; k < 4; k++) {
    arcStair(out, C, RIM_R, LEVELS.garden, LEVELS.mezzanine, {
      from: CUTS[k] + gap / 2, to: CUTS[k + 1] - gap / 2,
      anchor: 'top', climb: 'in', tread: 'alternate', riser: TER_RISER, run: TER_RUN,
      colour: PAVING, grass: k % 2 === 0 ? LAWN : LAWN_DK, material: 'concrete',
    })
  }
  // the quartering cross paths, and the two that close the semicircle's flat ends
  for (const t of CUTS) {
    const th = t * Math.PI * 2
    const head = pol(t, RIM_R)
    // the baseline is the HEAD at the rim, and its +normal (tz, −tx) has to point at the centre
    const tx = Math.sin(th)
    const tz = -Math.cos(th)
    const a = { x: head.x - tx * 1.7, z: head.z - tz * 1.7 }
    const b = { x: head.x + tx * 1.7, z: head.z + tz * 1.7 }
    stair(out, a, b, LEVELS.garden, LEVELS.mezzanine, {
      anchor: 'top', riser: TER_RISER, run: TER_RUN, tread: 'paving',
      colour: PAVING, treadColour: PAVING_DK, material: 'concrete',
    })
  }
}

// ==========================================================================================================
// THE CURVED DIVIDING WALL — the hinge, and the three things that leave it
// ==========================================================================================================

/**
 * Where a flight climbs out of the bowl on to the wall-top walk. The same angles the terraces are quartered
 * at, so a rider comes up a cross path and straight on up to `LEVELS.wall` without stepping sideways.
 */
const STEP_W = 0.028

/** `[t0, t1]` minus the two esplanade sectors: where the wall's inner face is solid. */
function openSpans(t0: number, t1: number): [number, number][] {
  let parts: [number, number][] = [[t0, t1]]
  for (const [e0, e1] of ESP) {
    const next: [number, number][] = []
    for (const [a, b] of parts) {
      if (e1 <= a || e0 >= b) { next.push([a, b]); continue }
      if (e0 > a) next.push([a, e0])
      if (e1 < b) next.push([e1, b])
    }
    parts = next
  }
  return parts.filter(([a, b]) => b - a > 0.004)
}

function dividingWall(out: MeshBuilder): void {
  const yW = LEVELS.wall

  /*
   * ---- the wall itself: a top WALK five metres wide, its inner face, and its two ends.
   *
   * The cap and the INNER face are drawn in pieces, with a gap at each of `STEP_UP`. That gap is not a
   * detail: without it every terrace and every cross path climbed to the rim at `LEVELS.mezzanine` and
   * stopped dead against 2 m of wall, and nobody on the wall-top walk could get into the bowl at all — a
   * park whose whole claim is circulation, with its own centrepiece unreachable from its own hinge.
   */
  const spans: [number, number][] = []
  {
    let t = WALL_T0
    for (const g of STEP_UP) { spans.push([t, g - STEP_W / 2]); t = g + STEP_W / 2 }
    spans.push([t, WALL_T1])
  }
  for (const [t0, t1] of spans) {
    if (t1 - t0 < 0.004) continue
    capPolygon(out, annulus(RIM_R, MEZ_R, t0, t1), yW, PAVING, CONC, 5)
    /*
     * The inner face runs from LEVELS.garden, not from the terrace rim: over the ends of the sweep there are
     * no terraces under it, and a face starting at the rim would leave the wall standing on daylight.
     *
     * NOT over the two esplanade sectors. Owner, 2026-09-23: *"the curved esplanade down into the grass
     * circle goes the wrong direction, so it leads nowhere."* The flight's direction was right — `climb:
     * 'in'` off `C` at `RIM_R`, foot at r = 10 on the grass floor (r = FLOOR_R = 9.5), which the
     * verification script confirms. What led nowhere was this face: it was drawn across the whole sweep,
     * so a 4 m wall stood in the esplanade's head, and a railing (now gone, below) ran along its top. The
     * fault was neither `climb` nor the centre nor the side — it was the wall being solid in front of it.
     */
    for (const [a, b] of openSpans(t0, t1)) arcFace(out, RIM_R, a, b, LEVELS.garden, yW, PRECAST, false)
    for (const [t, sg] of [[t0, -1], [t1, 1]] as const) {
      const a = pol(t, RIM_R)
      const b = pol(t, MEZ_R)
      const th = t * Math.PI * 2
      out.quad([[a.x, LEVELS.garden, a.z], [b.x, LEVELS.garden, b.z], [b.x, yW, b.z], [a.x, yW, a.z]],
        [Math.sin(th) * sg, 0, -Math.cos(th) * sg], [[0, 0], [1, 0], [1, 1], [0, 1]], PRECAST_DK, CONC)
    }
  }
  /*
   * The OUTER face, only as far as `JOIN_T0`. Past that the wall's outer edge is the deck, so the face there
   * would be a wall built inside the plaza's own mass — and a horizontal surface under the plaza it would
   * have been the excuse for is exactly the coplanar pair this block keeps producing.
   */
  arcFace(out, MEZ_R, WALL_T0, JOIN_T0, LEVELS.street, yW, PRECAST, true)

  // ---- THE WALL-TOP PLAZA, which is the skybridge's landing and the join itself. Capped at the same
  // `LEVELS.wall` as the walk beside it and as `mosconeSouthDeck` beyond it, and reaching the join line, so
  // the surface at 8 is continuous from the deck to the walk. Its two square ends are retaining walls to
  // LEVELS.street; its north-west edge is the deck and gets no face at all.
  {
    const ring = plazaRing()
    capPolygon(out, ring, yW, PAVING, CONC, 6)
    for (const [a, b] of [[at(JOIN.u0, JOIN.v), pol(JOIN_T1, MEZ_R)], [pol(JOIN_T0, MEZ_R), at(JOIN.u1, JOIN.v)]] as const) {
      apron(out, [a, b, b, a], yW, LEVELS.street, PRECAST, PRECAST_DK)
      railing(out, [a, b], yW, { kind: 'posts', colour: PRECAST_DK })
    }
  }

  // ---- THE FLIGHTS OUT OF THE BOWL: rim (LEVELS.mezzanine) to wall top (LEVELS.wall), in the gaps. Where
  // the flight stands OUTSIDE the join span the walk has to detour round its head over the mezzanine;
  // inside the join span the plaza already is that detour, and a second cap there would be coplanar with it.
  for (const g of STEP_UP) {
    const th = g * Math.PI * 2
    const foot = pol(g, RIM_R)
    // the baseline is the FOOT at the rim, and its +normal (tz, −tx) has to point radially OUTWARD
    const tx = -Math.sin(th)
    const tz = Math.cos(th)
    const half = (STEP_W * Math.PI * 2 * RIM_R) / 2 - 0.4
    stair(out, { x: foot.x - tx * half, z: foot.z - tz * half }, { x: foot.x + tx * half, z: foot.z + tz * half },
      LEVELS.mezzanine, yW, {
        riser: 0.15, run: MEZ_R - RIM_R - 0.6, tread: 'paving',
        colour: PAVING, treadColour: PAVING_DK, material: 'concrete',
      })
    if (g >= JOIN_T0) continue
    capPolygon(out, annulus(MEZ_R, MEZ_R + 4.5, g - STEP_W / 2, g + STEP_W / 2), yW, PAVING, CONC, 4)
    apron(out, annulus(MEZ_R, MEZ_R + 4.5, g - STEP_W / 2, g + STEP_W / 2), yW, LEVELS.mezzanine - 0.06,
      PRECAST, PRECAST_DK)
  }
  for (const t of [WALL_T0, WALL_T1]) {
    const a = pol(t, RIM_R)
    const b = pol(t, MEZ_R)
    const s = t === WALL_T0 ? 1 : -1
    const th = t * Math.PI * 2
    out.quad([[a.x, LEVELS.garden, a.z], [b.x, LEVELS.garden, b.z], [b.x, yW, b.z], [a.x, yW, a.z]],
      [Math.sin(th) * s, 0, -Math.cos(th) * s], [[0, 0], [1, 0], [1, 1], [0, 1]], PRECAST_DK, CONC)
  }

  /*
   * NO parapet on the walk's inner edge. It used to run over `[WALL_T0, CUTS[0]]` and `[CUTS[4], WALL_T1]`,
   * which are the two esplanade sectors exactly — a fence across the head of each descent. The walk's free
   * edges that do need one are the plaza's two square ends, railed above.
   */

  // ---- TWO CURVED ESPLANADES down the INNER face to the bowl floor at LEVELS.garden — DESCENT B, the
  // grassy circle. They stand at the wall's two ends deliberately: those are the only sectors with no
  // terrace beneath, so the flight has the radial room the kit warns it will not be given (BUGS.md #134d).
  for (const [t0, t1] of ESP) {
    arcStair(out, C, RIM_R, LEVELS.garden, LEVELS.wall, {
      from: t0, to: t1, anchor: 'top', climb: 'in', preset: 'esplanade',
      riser: 0.5, run: RIM_R - FLOOR_R - 0.5, rail: 'both', railKind: 'posts',
      colour: PAVING, treadColour: PAVING_DK, grass: LAWN, material: 'concrete',
    })
  }

  // ---- THE CONCRETE RAMP down the OUTER face to the mezzanine — DESCENT A, the Children's Park. 2 m of
  // rise, so the kit's own 1 in 12 gives 24 m of ramp, which is the length it needs and not one a caller
  // chose. It is on the wall's exposed sweep, the only place the outer face has park beneath it.
  {
    const th = RAMP_T * Math.PI * 2
    const head = pol(RAMP_T, MEZ_R)
    // the baseline is the head, on the wall; its +normal (tz, −tx) must point radially OUTWARD
    const tx = -Math.sin(th)
    const tz = Math.cos(th)
    ramp(out, { x: head.x - tx * 4, z: head.z - tz * 4 }, { x: head.x + tx * 4, z: head.z + tz * 4 },
      LEVELS.mezzanine, LEVELS.wall, {
        anchor: 'top', kerb: 0.25, rail: 'both', railKind: 'posts', colour: PAVING, material: 'concrete',
      })
  }
}

// ==========================================================================================================
// THE CHILDREN'S GARDEN — pond, fountain plaza, play landscape, oval lawn, planting
// ==========================================================================================================

/**
 * Laid out off `ms-childrens-garden-overhead.webp`, which is taken from directly above and is the only plan
 * reference there is, and REPROPORTIONED to the real polygon: the garden is the park's north-east third,
 * about 35 m along the block by 50 across plus the lobe toward Folsom, where the old box gave it 76 m of
 * length it never had. Everything here is anchored on `GU` (the join's north-east end, which is where the
 * wall stops) and `CV`, so it moves with the wall rather than with a typed coordinate.
 *
 * The pond and the play landscape are SUNK below the deck. That is not decoration: level 2.5 exists,
 * says the brief, "to give depth for the ponds", and a pond drawn flush with its deck would leave that half
 * storey with no visible motive.
 */
function childrensGarden(out: MeshBuilder): void {
  const y = LEVELS.mezzanine

  // ---- the circular FOUNTAIN PLAZA in red paving, with its basin
  capPolygon(out, oval(GU + 15.4, CV - 8, 7, 7), y + 0.14, RED_PAVING, CONC, 3)
  capPolygon(out, oval(GU + 15.4, CV - 8, 4.6, 4.6), y + 0.22, RED_PAVING_DK, CONC, 2)
  const basin = oval(GU + 15.4, CV - 8, 2.6, 2.6, 28)
  capPolygon(out, basin, y - 0.35, WATER, 0, 3)
  apron(out, basin, y + 0.30, y - 0.35, RED_PAVING_DK, RED_PAVING, CONC)

  // ---- the PLAY LANDSCAPE in pale blue and green surfacing, sunk half a metre behind a kerb
  const play = PLAY()
  capPolygon(out, play, y - 0.45, PLAY_GREEN, 0, 5)
  capPolygon(out, oval(GU + 10, CV + 18, 4, 3), y - 0.30, PLAY_BLUE, 0, 5)
  capPolygon(out, oval(GU + 18, CV + 23, 4, 3), y - 0.26, PLAY_BLUE, 0, 5)
  apron(out, play, y + 0.1, y - 0.45, PAVING_DK, PAVING, CONC)

  // ---- the POND, in the Folsom lobe. Blue-green, and the deepest thing on the deck.
  const pond = POND()
  capPolygon(out, pond, y - 0.95, WATER, 0, 6)
  capPolygon(out, oval(GU + 28.4, CV + 46, 2.8, 8), y - 1.0, WATER_DK, 0, 6)
  apron(out, pond, y + 0.15, y - 0.95, PAVING_DK, PAVING, CONC)

  // ---- the OVAL LAWN at the north-east end
  const ovalLawn = oval(GU + 29.4, CV - 8, 4, 8)
  capPolygon(out, oval(GU + 29.4, CV - 8, 5.5, 9.5), y + 0.14, PAVING_DK, CONC, 4)
  capPolygon(out, ovalLawn, y + 0.22, LAWN, 0, 6)

  // ---- THE PATHS. These are the ride surface, and they are continuous: the ramp's foot, the plaza, the
  // oval lawn, round the play landscape and on into the lobe to the pond.
  const walk: [number, number, number, number, number][] = [
    [GU + 29.5, CV + 9, GU + 15.4, CV - 8, 7],   // off the ramp's foot into the fountain plaza
    [GU + 15.4, CV - 8, GU + 29.4, CV - 8, 6],   // on to the oval lawn at the far end
    [GU + 15.4, CV - 8, GU + 13.4, CV + 21, 5],  // south-east, down the wall side of the play landscape
    [GU + 29.5, CV + 9, GU + 27.4, CV + 23, 6],  // east of the play landscape, toward the lobe
    [GU + 27.4, CV + 23, GU + 24.4, CV + 36, 5], // into the lobe, west of the pond
    [GU + 13.4, CV + 21, GU + 24.4, CV + 36, 4],
  ]
  for (const [u0, v0, u1, v1, w] of walk) capPolygon(out, strip(u0, v0, u1, v1, w), y + 0.06, PAVING, CONC, 4)

  // ---- DENSE PLANTING. Pushed to `out.decks` so the planting system fills them with shrubs AND trees;
  // nothing is hand-placed here, by instruction and because a hand-placed tree does not move with the
  // system that owns them. Every bed is inside `PARK_RING` and outside `MEZ_R` — a containment loop over
  // the built geometry checks it, after the first pass put one bed on the terraces and four over the street.
  const beds: P2[][] = [
    rect(GU + 6.4, CV + 28, GU + 20.4, CV + 32),   // the south-east edge bank, along the ice-rink side
    rect(GU + 23.4, CV + 61, GU + 33.4, CV + 66),  // the dense bank at the Folsom end of the lobe
    oval(GU + 26.4, CV + 25, 4, 4),                // the clump between the play landscape and the pond
    rect(GU + 7.4, CV - 17.5, GU + 21.4, CV - 15.5), // the strip along the Moscone edge
  ]
  for (const b of beds) {
    capPolygon(out, b, y + 0.30, BED, 0, 4)
    out.decks.push({ ring: b, y: y + 0.30 })
  }
}

// ==========================================================================================================
// LEVEL 3 — the walkway that leaves the Children's Creativity Museum and descends to the Public Square
// ==========================================================================================================

/**
 * MY END of it only. The museum is `sf/ms-west.ts`' and `way/288716388`'s, which lands at u −97 … −58 in
 * this frame — so the walkway now runs toward it, at the park's SOUTH-WEST end, which is where the aerial
 * puts the museum, the carousel and the big stairs. The old file ran it north-east over the Children's
 * Garden, because the old box had the park 22 m out of place and the wrong way round.
 *
 * It descends to `LEVELS.garden`, not to the mezzanine: the south-west half of the park is the level-2 half.
 * That is 8 m of fall rather than 6, so the fan is deeper.
 */
const WALK_CU = CU - 40
const WALK_CV = CV - 14

function museumWalkway(out: MeshBuilder): void {
  const c = at(WALK_CU, WALK_CV)
  const headR = 5

  // ---- the curved esplanade: head at LEVELS.upper on the small circle, descending OUTWARD to the square
  arcStair(out, c, headR, LEVELS.garden, LEVELS.upper, {
    // paved, not the esplanade preset's alternating grass: this is the walk out of a museum, and the first
    // render's grass-and-paving bands made it read as a second amphitheatre beside the real one
    // 0.18 of a turn and a 15 m run made a 40 m fan that read as a second amphitheatre beside the real one
    // — the very fault the old file's comment warned about — in the first `join-over` render. Half of both.
    from: NE - 0.05, to: NE + 0.05, anchor: 'top', climb: 'out', tread: 'paving',
    riser: 0.4, run: 11, rail: 'both', railKind: 'posts',
    colour: PAVING, treadColour: PAVING_DK, grass: LAWN, material: 'concrete',
  })

  // ---- the level deck at LEVELS.upper it comes off, running south-west toward the museum on columns, and
  // stopping at a clean railed edge that faces it
  const deck = strip(WALK_CU - 1, WALK_CV, WALK_CU - 18, WALK_CV - 3, 9)
  capPolygon(out, deck, LEVELS.upper + 0.02, PAVING, CONC, 4)
  apron(out, deck, LEVELS.upper, LEVELS.upper - 0.9, PRECAST_DK, PRECAST)
  // `edgeAt().heading` on the deck's own edges, never a hand-rolled atan2 (BUGS.md #135)
  for (let i = 0; i < 4; i++) {
    const e = edgeAt(deck, i)
    if (e.L < 12) continue
    railing(out, [e.a, e.b], LEVELS.upper, { kind: 'posts', colour: PRECAST_DK })
  }
  // the free end, square across, is the edge the museum's own walkway has to meet
  {
    const e = edgeAt(deck, 2)
    railing(out, [e.a, e.b], LEVELS.upper, { kind: 'posts', colour: PRECAST_DK })
  }
  // the columns carrying it over the square
  for (let k = 0; k <= 5; k++) {
    const t = k / 5
    const u = WALK_CU - 1 - t * 17
    for (const dv of [-3.4, 3.4]) {
      const p = at(u, WALK_CV - 3 * t + dv)
      const ring: P2[] = [
        { x: p.x - 0.45, z: p.z - 0.45 }, { x: p.x + 0.45, z: p.z - 0.45 },
        { x: p.x + 0.45, z: p.z + 0.45 }, { x: p.x - 0.45, z: p.z + 0.45 },
      ]
      apron(out, ring, LEVELS.upper - 0.9, LEVELS.garden, PRECAST, PRECAST_DK)
    }
  }
}

/**
 * The measured join, exported for `tools/` and for the report: every number a verification script needs to
 * show that bridge → deck → wall → descent meets, in the model's own frame.
 */
export const MS_GARDENS_JOIN = {
  PARK_RING, JOIN, C, CU, CV, FLOOR_R, RIM_R, MEZ_R,
  WALL_T0, WALL_T1, JOIN_T0, JOIN_T1, RAMP_T, ESP, CUTS, STEP_UP,
  at, uvOf, pol, plazaRing, mezRing, levelTwoRing,
}

export const MS_GARDENS: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  msGardens,
}
