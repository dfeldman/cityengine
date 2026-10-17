/**
 * YERBA BUENA GARDENS — the one block where the ground is not where the terrain says it is.
 *
 * BUGS.md #130 and its two corrections. The gardens are a large open lawn a few metres ABOVE Mission and
 * Howard Streets, reached by a terraced esplanade of alternating grass and paved treads, with the MLK
 * Memorial waterfall cut into the level change and a retaining wall carrying a pergola along the Howard
 * frontage. Nothing in the pipeline can say any of that: terrain comes from elevation tiles (which sample
 * the real ground — measured flat at −74 m right across this block), and `leisure=park` carries no height.
 *
 * ---- how the level change is represented, and why this way
 *
 * As a NONBUILDING placed by lat/lon, drawing its own deck. Not a new ground type, not a terrain change:
 *
 *   - `src/render/city.ts` stacks four NEAR-COPLANAR ground layers separated by rendering ORDER, not height.
 *     A fifth layer at +4 m is not that problem, but it would still mean a new polygon type in the bake, a
 *     new edge treatment vocabulary, and a seam with the road and pavement layers at every kerb. For ONE
 *     block (owner: *"a bizarre SF-only special case block"*) that abstraction is not earned.
 *   - A nonbuilding keeps the whole change inside this file plus one manifest entry. The deck is just
 *     geometry: a capped polygon at `DECK_H`, with a skirt of retaining wall down to the street.
 *   - The ground the city paints underneath is still there at 0. That is correct and cheap: the lawn hides
 *     it, and where it shows through at the edges it is the pavement, which is what is really there.
 *
 * KNOWN CONSEQUENCE, not fixed here: the city's own trees and plantings inside the polygon keep their feet
 * on the terrain at 0, so their trunks are inside the deck and their canopies poke through the lawn. Fixing
 * that means teaching the planting layer about the deck, which is the general mechanism this is deliberately
 * not building. Reported rather than papered over.
 *
 * ---- every dimension here comes from geometry, not from a tape measure
 *
 *   - The polygon is OSM `way/28842443` (`leisure=park`, "Yerba Buena Gardens", addr 750 Howard Street),
 *     read out of `tools/cache/osm/cuts/*.opl` and projected with the city's own origin (37.793, −122.412).
 *     It is embedded here, translated so the model's centre is the polygon's bbox centre, because a park is
 *     not a building and so never reaches a builder as a `fit.ring`.
 *   - `DECK_H` is 4 m, and it is DERIVED: `way/1025650853` and `way/1025650854` (the Joyride Pizza kiosk and
 *     its twin) are `building:part` with `building:min_level=1` and stand ON the gardens, so their floor IS
 *     the lawn. The bake packs that as `minHeight: 4` — `levelHeight = 4` in
 *     `src/vendor/streets-gl/osm/getBuildingParamsFromOSMTags.ts`. So the abutting structures give the deck
 *     level, exactly as BUGS.md #130 "What would help" §2 asks.
 *   - The MLK memorial's wall is the polyline of `way/684190996` (`barrier=wall`, duplicated as
 *     `way/1167668188` `barrier=retaining_wall`); its water is `way/25298444` (`amenity=fountain`,
 *     `natural=water`, `layer=2`, `level=1`) and the two ponds `way/1167668187` and `way/1326136219`.
 *   - The skybridge is `way/940154716` (`bridge=yes`, `highway=footway`, `layer=1`).
 *
 * The three builders are separate entries on purpose. PIPELINE.md §4 records that Salesforce Park — the
 * defect that motivated the whole nonbuilding category — is unreachable by any check because it is drawn
 * INSIDE another landmark's builder. Each piece here is its own manifest entry and its own audit row.
 */
import type { MeshBuilder } from '../../buildings.ts'
import { capPolygon } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { box, prism, strut, type Rgb } from '../../models.ts'
import { boxAlong } from '../parts.ts'
import { sign } from '../signage.ts'
import { surfaceTag } from '../../cartoon-material.ts'

type P2 = { x: number; z: number }

const GRAN_TAG = surfaceTag('granite')
const CONC_TAG = surfaceTag('concrete')
const GLASS_TAG = surfaceTag('glass')
const METAL_TAG = surfaceTag('metal')

const LAWN: Rgb = [0.34, 0.47, 0.24]
const LAWN_DK: Rgb = [0.29, 0.41, 0.2]
const PRECAST: Rgb = [0.74, 0.72, 0.68]
const PRECAST_DK: Rgb = [0.63, 0.61, 0.57]
const PAVING: Rgb = [0.68, 0.66, 0.62]
const PAVING_DK: Rgb = [0.3, 0.29, 0.29]
const GRANITE: Rgb = [0.58, 0.56, 0.53]
const GRANITE_LT: Rgb = [0.72, 0.7, 0.66]
const GRANITE_DK: Rgb = [0.31, 0.3, 0.29]
const WATER: Rgb = [0.46, 0.62, 0.66]
const FOAM: Rgb = [0.78, 0.86, 0.87]
const DARKFRAME: Rgb = [0.14, 0.14, 0.13]
const GREENGLASS: Rgb = [0.18, 0.28, 0.26]
const PALEMETAL: Rgb = [0.78, 0.79, 0.79]
const ORANGE: Rgb = [0.78, 0.26, 0.12]
const DOMEGLASS: Rgb = [0.72, 0.82, 0.84]
const MEMGLASS: Rgb = [0.38, 0.6, 0.5]
const LAVENDER: Rgb = [0.78, 0.77, 0.81]
const SOFFIT: Rgb = [0.33, 0.34, 0.35]
const SOFFIT_LT: Rgb = [0.42, 0.43, 0.44]

/**
 * THE DECK LEVEL, metres above the street. Not typed: see the header — it is `building:min_level=1` on the
 * two kiosks that stand on the lawn, times the bake's own 4 m level height.
 */
export const DECK_H = 4

/**
 * `way/28842443`, the park polygon, in metres relative to its own bbox centre (local x east, z north),
 * anticlockwise as OSM has it. 44 corners; the two long straight runs are the Mission Street frontage on
 * the north-west and the Howard Street frontage on the south-east.
 */
const GARDEN_RING: P2[] = ([
  [84.3, -4.9], [76.5, 3.3], [78.2, 4.9], [52.4, 31.6], [50.5, 33.5], [51.2, 34.4], [44.3, 41.4],
  [41.6, 38.4], [31.3, 48.0], [28.1, 44.7], [17.7, 54.8], [8.9, 63.4], [7.7, 64.6], [8.9, 65.8],
  [-7.7, 82.9], [-6.4, 84.1], [-15.4, 93.3], [-27.6, 81.1], [-36.1, 90.0], [-84.3, 44.1],
  [-71.2, 31.3], [-72.6, 24.2], [-72.9, 20.5], [-72.9, 13.5], [-71.6, 6.5], [-68.0, -3.3],
  [-63.4, -9.9], [-57.1, -16.8], [-52.0, -21.0], [-35.8, -32.1], [-29.2, -37.7], [-20.9, -47.3],
  [-14.6, -56.8], [13.0, -91.8], [13.6, -92.6], [14.4, -93.3], [17.1, -90.7], [19.0, -88.9],
  [21.6, -86.2], [23.1, -84.6], [29.4, -78.2], [12.4, -61.3], [17.0, -56.7], [25.4, -65.5],
] as [number, number][]).map(([x, z]) => ({ x, z }))

/** The Mission Street frontage: ring[18] → ring[19], the long straight north-west run (66 m). */
const MISSION_EDGE = 18
/*
 * The Howard Street frontage is ring[43] → ring[0], the long straight south-east run (85 m). It gets no
 * special treatment here: `way/109141774`, Moscone North, stands along the whole of it, so the frontage a
 * rider sees on Howard is that building's glazed pavilion (`mosconeNorth`), not the park's own wall.
 */

// ---------------------------------------------------------------------------------------------------------
// small shared parts
// ---------------------------------------------------------------------------------------------------------

/**
 * The i-th edge of a ring: its ends, unit tangent, OUTWARD normal (for an anticlockwise ring), length, and
 * the HEADING to hand `boxAlong`.
 *
 * That heading is not `atan2(tz, tx)`, which is what this file used at first and which is wrong. `boxAlong`
 * (landmarks/parts.ts) sends local +x to `(cos h, −sin h)` — Babylon's rotation.y convention, mirrored in z
 * against the maths one. With the maths angle every long part in this file was reflected across the edge it
 * was meant to lie along: the esplanade marched across Mission Street instead of running along it, and the
 * terrace garden landed off its own boundary. Small square parts (wall panels, piers) hid it completely,
 * which is why it survived three rounds of rendering — the render that caught it was the first with a part
 * much longer than it was wide.
 */
function edge(ring: P2[], i: number): { a: P2; b: P2; tx: number; tz: number; nx: number; nz: number; L: number; h: number } {
  const a = ring[i % ring.length]
  const b = ring[(i + 1) % ring.length]
  const L = Math.hypot(b.x - a.x, b.z - a.z) || 1
  const tx = (b.x - a.x) / L
  const tz = (b.z - a.z) / L
  return { a, b, tx, tz, nx: tz, nz: -tx, L, h: Math.atan2(-tz, tx) }
}

/** A vertical wall down the outside of one edge, from `yTop` to `yBot`, in courses of `panel` metres. */
function panelWall(out: MeshBuilder, e: ReturnType<typeof edge>, yBot: number, yTop: number,
                   panel: number, thick: number, c: Rgb, cAlt: Rgb, tag: number): void {
  const n = Math.max(1, Math.round(e.L / panel))
  const w = e.L / n
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) * w
    const cx = e.a.x + e.tx * u - e.nx * thick / 2
    const cz = e.a.z + e.tz * u - e.nz * thick / 2
    // a 3 cm reveal between panels so the joints read at a distance, and alternate shades so they read closer
    boxAlong(out, cx, (yBot + yTop) / 2, cz, w / 2 - 0.03, (yTop - yBot) / 2, thick / 2,
      e.h, i % 2 === 0 ? c : cAlt, tag)
  }
}

/**
 * The pergola along the top of the wall: a comb of slats projecting out over the pavement on a pair of
 * rails, with planting sitting on it. Most of what the wall looks like from the pavement is this comb
 * against the sky, so it is built as real slats rather than one box.
 */
function pergola(out: MeshBuilder, e: ReturnType<typeof edge>, u0: number, u1: number, y: number,
                 reach: number, arch = 0): void {
  const span = u1 - u0
  const n = Math.max(2, Math.round(span / 1.1))
  const ang = e.h
  const lift = (u: number): number => {
    if (arch <= 0) return 0
    const t = (u - u0) / span
    // one shallow arch over the middle of the run — the gate is centred in it
    return arch * Math.max(0, Math.sin(Math.PI * t)) ** 2
  }
  for (let i = 0; i <= n; i++) {
    const u = u0 + (i / n) * span
    const yy = y + lift(u)
    // each slat runs OUT from the wall, over the pavement
    const mx = e.a.x + e.tx * u + e.nx * reach / 2
    const mz = e.a.z + e.tz * u + e.nz * reach / 2
    boxAlong(out, mx, yy, mz, 0.06, 0.16, reach / 2, ang, DARKFRAME, METAL_TAG)
  }
  // the two rails the slats hang from, and a ribbon of planting sitting on top of them
  for (const [off, sh] of [[0.15, 0.0], [reach - 0.25, 0.0]] as const) {
    void sh
    for (let i = 0; i < n; i++) {
      const uA = u0 + (i / n) * span
      const uB = u0 + ((i + 1) / n) * span
      const um = (uA + uB) / 2
      const mx = e.a.x + e.tx * um + e.nx * off
      const mz = e.a.z + e.tz * um + e.nz * off
      boxAlong(out, mx, y + lift(um) + 0.2, mz, (uB - uA) / 2, 0.09, 0.09, ang, DARKFRAME, METAL_TAG)
    }
  }
  for (let i = 0; i < n; i++) {
    const um = u0 + ((i + 0.5) / n) * span
    const mx = e.a.x + e.tx * um + e.nx * reach * 0.55
    const mz = e.a.z + e.tz * um + e.nz * reach * 0.55
    boxAlong(out, mx, y + lift(um) + 0.45, mz, span / n / 2, 0.22, reach * 0.35, ang,
      i % 2 === 0 ? LAWN : LAWN_DK, 0)
  }
}

/** A grille of closely spaced vertical bars filling an opening on an edge. */
function grille(out: MeshBuilder, e: ReturnType<typeof edge>, u0: number, u1: number, y0: number, y1: number): void {
  const ang = e.h
  const n = Math.max(4, Math.round((u1 - u0) / 0.14))
  for (let i = 0; i <= n; i++) {
    const u = u0 + ((u1 - u0) * i) / n
    const mx = e.a.x + e.tx * u
    const mz = e.a.z + e.tz * u
    boxAlong(out, mx, (y0 + y1) / 2, mz, 0.025, (y1 - y0) / 2, 0.025, ang, DARKFRAME, METAL_TAG)
  }
  for (const yy of [y0 + 0.1, y1 - 0.1]) {
    const um = (u0 + u1) / 2
    boxAlong(out, e.a.x + e.tx * um, yy, e.a.z + e.tz * um, (u1 - u0) / 2, 0.05, 0.04, ang, DARKFRAME, METAL_TAG)
  }
}

// ---------------------------------------------------------------------------------------------------------
// 1. the gardens: the raised lawn, its retaining edge, the north esplanade, the Howard wall and the gate
// ---------------------------------------------------------------------------------------------------------

export function yerbaBuenaGardens(out: MeshBuilder, _fit?: Fit): void {
  const ring = GARDEN_RING

  /*
   * ---- THREE LEVELS, not two (owner's close oblique of the memorial area).
   *
   *   street 0  <  garden/lawn DECK_H = 4  <  upper patio PATIO_H = 6
   *
   * `DECK_H` is `building:min_level=1` on the kiosks that stand on the lawn, times the bake's 4 m level.
   * `PATIO_H` is `BRIDGE_H`, the height the bake's OWN ride graph already gives the two Howard crossings
   * (−68.8 against terrain −74.8). That is self-consistent rather than convenient: the patio behind the
   * Moscone entrance is the "North Upper Lobby" level, and the enclosed skybridge leaves from it.
   */

  // ---- the whole polygon is surfaced first, and it is PAVED, not grass. The aerials are unambiguous: the
  // east third of the garden is a hardscape band of steps, the memorial walk and a grid of garden rooms.
  capPolygon(out, notchedForEsplanade(ring), DECK_H, PAVING, CONC_TAG, 6)

  // ---- the OVAL lawn, over the centre and west, with its ring path round it and a path crossing it. An
  // oval, not a rectangle: the ring path and the grass are the shape the four obliques show.
  const lawn = ellipse(LAWN_C.x, LAWN_C.z, LAWN_R.x, LAWN_R.z, 40)
  capPolygon(out, ellipse(LAWN_C.x, LAWN_C.z, LAWN_R.x + 2.4, LAWN_R.z + 2.4, 40), DECK_H + 0.10, PAVING_DK, CONC_TAG, 3)
  capPolygon(out, lawn, DECK_H + 0.20, LAWN, 0, 6)
  for (const [mx, mz, r] of [[-18, 26, 20], [-44, 12, 13]] as const) {
    prism(out, LAWN_C.x + mx, LAWN_C.z + mz, DECK_H + 0.21, DECK_H + 0.6, r, 16, LAWN_DK, 0, r * 0.4)
  }

  // ---- the east hardscape band: the garden rooms, each a low planter with a glass dome skylight in it.
  // The domes light the Moscone hall underneath and are the clearest possible sign of standing on a roof.
  gardenRooms(out)

  // ---- the upper patio behind the Moscone entrance, two metres above the lawn, with its colonnade walk
  upperPatio(out)

  // ---- the retaining edge, all the way round: the garden has to stop somewhere and that edge is a wall.
  for (let i = 0; i < ring.length; i++) {
    const e = edge(ring, i)
    if (e.L < 2) continue
    // the north-east boundary, above the pedestrian cut beside the YBCA theatre, is stepped planters
    if (i <= 3) { terraceGarden(out, e); continue }
    // and the Mission Street frontage is the esplanade and the gated wall, built by missionFrontage below —
    // a plain wall here stood in front of the terraces and hid the whole flight (BUGS.md #134d)
    if (i === MISSION_EDGE) continue
    panelWall(out, e, 0, DECK_H, 4.2, 0.5, PRECAST, PRECAST_DK, CONC_TAG)
    const um = e.L / 2
    boxAlong(out, e.a.x + e.tx * um - e.nx * 0.18, DECK_H + 0.09, e.a.z + e.tz * um - e.nz * 0.18,
      e.L / 2, 0.09, 0.34, e.h, PRECAST_DK, CONC_TAG)
  }

  missionFrontage(out, ring)
  // the light open walkway over the passage, from the deck's north-east edge across to the theatre side
  passageBridge(out, { x: ring[2].x, z: ring[2].z }, { x: ring[2].x + 16, z: ring[2].z + 4 })
}

/** An oval as a ring, in the model's own frame. */
function ellipse(cx: number, cz: number, rx: number, rz: number, n: number): P2[] {
  const out: P2[] = []
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    out.push({ x: cx + Math.cos(a) * rx, z: cz + Math.sin(a) * rz })
  }
  return out
}

/**
 * The oval lawn's centre and radii, in the polygon's own frame. Taken from the Google Earth vector view's
 * drawn ring path, which is explicit about it, rather than inferred from a street frame: it sits over the
 * west and centre of the polygon, with the hardscape band filling the east third toward the Metreon.
 */
const LAWN_C: P2 = { x: -27, z: 22 }
const LAWN_R: P2 = { x: 44, z: 30 }

/**
 * LEVEL 3, metres above the street: the Moscone lobby's second floor, its patio, both Howard skybridges'
 * landings and the south deck. ONE number for all of them, because `docs/YERBA-BUENA.md` ("THE LEVEL MODEL
 * — authoritative") says they are one level.
 *
 * Derived, not typed, and by two routes that agree: the patio is one storey above the garden, and the
 * garden is `DECK_H`; and the level lines up with the YBCA theatre's SECOND floor where the theatre starts
 * at level 2 — a storey above level 2 either way. The storey is the bake's own `levelHeight = 4`
 * (`src/vendor/streets-gl/osm/getBuildingParamsFromOSMTags.ts`), the same quantum `DECK_H` comes from.
 *
 * The ride graph's own bridge heights (−68.8 against terrain −74.8, so 6 m) were the first candidate and
 * are NOT used: `tools/bridges.ts` lifts `layer=1` ways by a rule rather than measuring this one, so the
 * 6 m is the tool's convention, not evidence about this block.
 */
const PATIO_H = DECK_H * 2

function upperPatio(out: MeshBuilder): void {
  const c: P2 = { x: 44, z: -30 }
  const a = Math.PI / 4
  const hx = 26
  const hz = 15
  const ring: P2[] = ([[-1, -1], [1, -1], [1, 1], [-1, 1]] as const).map(([sx, sz]) => ({
    x: c.x + sx * hx * Math.cos(a) - sz * hz * Math.sin(a),
    z: c.z + sx * hx * Math.sin(a) + sz * hz * Math.cos(a),
  }))
  capPolygon(out, ring, PATIO_H, PAVING, CONC_TAG, 5)
  for (let i = 0; i < 4; i++) {
    const e = edge(ring, i)
    panelWall(out, e, DECK_H - 0.2, PATIO_H, 4.0, 0.5, PRECAST, PRECAST_DK, CONC_TAG)
  }
  // the broad flight down to the garden on the lawn side, in bands
  const up = edge(ring, 3)
  const steps = 8
  for (let i = 0; i < steps; i++) {
    const y = DECK_H + ((i + 1) * (PATIO_H - DECK_H)) / steps
    const outw = 0.55 * (steps - i)
    const um = up.L / 2
    boxAlong(out, up.a.x + up.tx * um + up.nx * outw / 2, (DECK_H + y) / 2,
      up.a.z + up.tz * um + up.nz * outw / 2, up.L * 0.35, (y - DECK_H) / 2, outw / 2,
      up.h, i % 2 === 0 ? PAVING : PAVING_DK, CONC_TAG)
  }
  // the long covered walkway along the patio's far edge
  const col = edge(ring, 1)
  const bays = Math.max(3, Math.round(col.L / 4))
  const cang = col.h
  for (let i = 0; i <= bays; i++) {
    const u = (i / bays) * col.L
    prism(out, col.a.x + col.tx * u - col.nx * 2.4, col.a.z + col.tz * u - col.nz * 2.4,
      PATIO_H, PATIO_H + 3.4, 0.22, 8, PRECAST, CONC_TAG)
  }
  boxAlong(out, col.a.x + col.tx * (col.L / 2) - col.nx * 1.6, PATIO_H + 3.6,
    col.a.z + col.tz * (col.L / 2) - col.nz * 1.6, col.L / 2, 0.2, 2.2, cang, PALEMETAL, METAL_TAG)
}

/**
 * THE GARDEN ROOMS on the east band — a repeating grid of small raised planters, each with a low glass dome
 * skylight in it. A loop, not hand geometry, because that is what they are: the same room repeated along
 * the walk between the lawn and the Metreon, in the checkerboard paving the aerials show.
 */
function gardenRooms(out: MeshBuilder): void {
  const a = Math.PI / 4                          // the block's own grid, which the whole site is turned to
  const c = Math.cos(a)
  const sn = Math.sin(a)
  const at = (u: number, v: number): P2 => ({ x: 28 + u * c - v * sn, z: 22 + u * sn + v * c })
  // the checkerboard paving of the band
  for (let i = -3; i < 6; i++) {
    for (let j = -7; j < 7; j++) {
      const p = at(i * 3.0, j * 3.0)
      box(out, p.x, DECK_H + 0.05, p.z, 1.48, 0.03, 1.48, (i + j) % 2 === 0 ? PAVING_DK : PAVING, CONC_TAG)
    }
  }
  // the rooms themselves: a low planted kerb, and a glass dome inside it
  for (let j = -5; j < 5; j++) {
    for (const i of [-1, 3]) {
      const p = at(i * 3.0, j * 6.4)
      for (const [dx, dz, hxx, hzz] of [[-2.4, 0, 0.22, 2.6], [2.4, 0, 0.22, 2.6], [0, -2.6, 2.6, 0.22], [0, 2.6, 2.6, 0.22]] as const) {
        boxAlong(out, p.x + dx * c - dz * sn, DECK_H + 0.3, p.z + dx * sn + dz * c, hxx, 0.3, hzz, a, PRECAST, CONC_TAG)
      }
      box(out, p.x, DECK_H + 0.18, p.z, 2.3, 0.15, 2.3, LAWN_DK, 0)
      // the skylight: one larger dome every third room, the rest small — two sizes, as the frame shows
      const big = ((j + 5) % 3) === 0
      const r = big ? 1.5 : 0.95
      prism(out, p.x, p.z, DECK_H + 0.3, DECK_H + 0.3 + r * 0.75, r, big ? 6 : 12, DOMEGLASS, GLASS_TAG, r * 0.45)
    }
  }
}

/**
 * THE NORTH-WEST (MISSION STREET) FRONTAGE — the way up, and the way in. One 66 m run of wall carries both:
 * the terraced esplanade over its western two-thirds, and the walled, pergola'd, gated section over its
 * eastern third.
 *
 * WHY HERE AND NOT ON HOWARD. The photographs were described to me as the Howard frontage. The geometry
 * says otherwise and the geometry wins: `way/109141774` (Moscone North) occupies the whole of the park's
 * south-east edge — the gate point I first put there measured 12 m INSIDE the pavilion's footprint, and the
 * render showed the grille standing behind Moscone's own curtain wall. The Howard edge is Moscone's
 * frontage; the walled-and-gated edge is Mission's. Only this frontage has a wall with nothing behind it.
 */
function missionFrontage(out: MeshBuilder, ring: P2[]): void {
  const e = edge(ring, MISSION_EDGE)
  const [u0, u1] = esplanadeSpan(e)
  gatedWall(out, e, 1.5, u0 - 3)
  esplanade(out, e, u0, u1)
}

/** where along the Mission edge the esplanade runs: ring[18] is the EAST end, the gated part nearest Third Street */
function esplanadeSpan(e: ReturnType<typeof edge>): [number, number] { return [e.L * 0.40 + 3, e.L - 1.5] }
const ESPL_RISE = 0.67
const ESPL_DEPTH = 1.7
const esplSteps = (): number => Math.max(2, Math.round(DECK_H / ESPL_RISE))

/** The deck's outline with the esplanade's notch cut out of it: the flight steps down INSIDE the garden's edge. */
function notchedForEsplanade(ring: P2[]): P2[] {
  const e = edge(ring, MISSION_EDGE)
  const [u0, u1] = esplanadeSpan(e)
  const d = esplSteps() * ESPL_DEPTH
  const at = (u: number, inward: number): P2 => ({ x: e.a.x + e.tx * u - e.nx * inward, z: e.a.z + e.tz * u - e.nz * inward })
  return [...ring.slice(0, MISSION_EDGE + 1), at(u0, 0), at(u0, d), at(u1, d), at(u1, 0), ...ring.slice(MISSION_EDGE + 1)]
}

/**
 * The esplanade: alternating grass treads and paved nosings climbing from the pavement to the lawn, over
 * the stretch of frontage between `u0` and `u1`.
 *
 * The number of terraces is not typed either: it is `DECK_H` divided by a riser that keeps each tread's
 * slope near 1 in 5, and the run follows from that. Wide, shallow and continuous — which is what makes it
 * something a rider would ride up rather than a stair they carry a bike over.
 */
function esplanade(out: MeshBuilder, e: ReturnType<typeof edge>, u0: number, u1: number): void {
  /*
   * HOW STEEP THIS REALLY IS, measured rather than wished for. The lawn is `DECK_H` = 4 m up and there are
   * about 10 m of pavement between the park polygon and the Mission Street kerb. A gradient a rider could
   * ride — say 1 in 7 — would need 28 m and would stand in the carriageway; the first version of this used
   * 2.4 m treads and the render showed grass terraces crossing the road. So the flight is fitted to the
   * pavement it has, which makes it 1 in 2.5: a grand shallow WALK, not a ramp. That is also what it is in
   * life, and saying so is more useful than a ridable esplanade that is in the wrong place.
   */
  /*
   * …and it steps down INSIDE the garden's edge (BUGS.md #319, owner 2026-10-17: "yb center steps extend halfway into the
   * road"). Our Mission Street pavement is 3.2 m, not the 10 m this was fitted to, so ten metres of terraces out from the
   * edge stood across the carriageway. The deck is notched (`notchedForEsplanade`) and the lowest terrace meets the
   * pavement at the garden line, which is where the real flight is.
   */
  const steps = esplSteps()
  const rise = DECK_H / steps
  const DEPTH = ESPL_DEPTH
  const ang = e.h
  const um = (u0 + u1) / 2
  const hw = (u1 - u0) / 2
  for (let i = 0; i < steps; i++) {
    const y = DECK_H - (i + 1) * rise
    const outw = (i + 1 - steps) * DEPTH   // the terrace's outer lip, measured OUT from the garden edge (≤ 0: inside)
    const cx = e.a.x + e.tx * um + e.nx * (outw - DEPTH / 2)
    const cz = e.a.z + e.tz * um + e.nz * (outw - DEPTH / 2)
    // the grass tread. rise/depth here is about 1 in 5 — shallow enough to read as a ramp of terraces
    boxAlong(out, cx, y + rise / 2, cz, hw, rise / 2, DEPTH / 2, ang, i % 2 === 0 ? LAWN : LAWN_DK, 0)
    // and the paved nosing at its lip, the alternation the photograph shows. It stands a few centimetres
    // PROUD of the tread it edges: any less and the two tops are coplanar (tools/nonbuildings.ts flags it)
    const lx = e.a.x + e.tx * um + e.nx * outw
    const lz = e.a.z + e.tz * um + e.nz * outw
    boxAlong(out, lx - e.nx * 0.45, y + rise - 0.02, lz - e.nz * 0.45, hw, 0.07, 0.45, ang, PAVING, CONC_TAG)
    boxAlong(out, lx - e.nx * 0.2, y + rise / 2, lz - e.nz * 0.2, hw, rise / 2, 0.2, ang, PRECAST, CONC_TAG)
  }
  // a low cheek wall at each end so the terraces do not float off the sides of the frontage
  for (const u of [u0, u1]) {
    const outw = steps * DEPTH
    boxAlong(out, e.a.x + e.tx * u - e.nx * outw / 2, DECK_H / 2, e.a.z + e.tz * u - e.nz * outw / 2,
      0.35, DECK_H / 2, outw / 2, ang, PRECAST_DK, CONC_TAG)
  }
}

/**
 * THE WALL, THE PERGOLA AND THE GATE — below the lawn, on the pavement, at the rider's eye: precast panels
 * with the joints showing, a comb of dark slats projecting over the pavement and arching up over the
 * opening, two taller piers, a fine dark grille between them, and the name on it.
 */
function gatedWall(out: MeshBuilder, e: ReturnType<typeof edge>, u0: number, u1: number): void {
  const gate = (u0 + u1) / 2
  const half = 3.2              // the opening's half-width
  const PIER = 1.0
  const ang = e.h

  pergola(out, e, u0, u1, DECK_H - 0.4, 1.9, 0)
  pergola(out, e, gate - half - 3, gate + half + 3, DECK_H - 0.4, 2.3, 0.9)

  // the two piers, standing proud of the wall and taller than it
  for (const s of [-1, 1] as const) {
    const u = gate + s * (half + PIER / 2)
    boxAlong(out, e.a.x + e.tx * u + e.nx * 0.1, (DECK_H + 1.4) / 2, e.a.z + e.tz * u + e.nz * 0.1,
      PIER / 2, (DECK_H + 1.4) / 2, 0.75, ang, PRECAST, CONC_TAG)
  }
  grille(out, e, gate - half, gate + half, 0.05, DECK_H + 0.4)

  // the plain service doors either side of the gate, recessed in the panels
  for (const u of [gate - half - 5, gate + half + 5]) {
    if (u < u0 || u > u1) continue
    boxAlong(out, e.a.x + e.tx * u + e.nx * 0.28, 1.15, e.a.z + e.tz * u + e.nz * 0.28,
      0.62, 1.15, 0.06, ang, DARKFRAME, METAL_TAG)
  }

  /*
   * The name, on the grille above the gate. A `flat` sign — two triangles and a texture, not letters built
   * out of geometry (that is what the signage system replaced). `lit: 'none'`: from the description these
   * are applied orange-red serif letters on a metal grille under a pergola, with no trough, no halo and
   * nothing behind them to glow — a painted sign that goes dark with the wall.
   */
  sign(out, {
    type: 'flat', text: 'YERBA BUENA GARDENS', h: 0.42, face: 'roman', weight: 'bold',
    colour: ORANGE, tracking: 0.1, lit: 'none', w: half * 1.9, standoff: 0.1,
  }, {
    x: e.a.x + e.tx * gate + e.nx * 0.16, y: DECK_H - 1.0, z: e.a.z + e.tz * gate + e.nz * 0.16,
    heading: Math.atan2(e.nx, e.nz),
  })
}

// ---------------------------------------------------------------------------------------------------------
// 2. the MLK Memorial waterfall
// ---------------------------------------------------------------------------------------------------------

/**
 * `way/684190996` (`barrier=wall`, `level=1`) relative to the memorial's own centre — the pier wall's run,
 * 68 m of shallow curve. The water (`way/25298444`) follows the same line; the pools lie on its north-west
 * side, which is the lawn side, and the walk on top of the wall is the terrace you look DOWN from.
 */
const MLK_WALL: P2[] = ([
  [-23.9, -24.0], [-15.6, -19.8], [-9.2, -15.6], [-1.3, -9.2], [6.8, -1.5], [12.6, 5.8], [18.5, 14.5], [23.9, 24.0],
] as [number, number][]).map(([x, z]) => ({ x, z }))

/** `way/1167668187` and `way/1326136219`, the two ponds, same frame — the pool the water falls into. */
const MLK_POOL: P2[] = ([
  [-22.5, -4.9], [-14.4, -12.9], [-2.9, -1.2], [-2.4, -0.7], [15.9, 18.0], [18.4, 20.5], [10.0, 29.0],
  [-10.4, 7.2], [-11.8, 5.8], [-8.8, 2.8], [-18.3, -6.7], [-21.3, -3.8],
] as [number, number][]).map(([x, z]) => ({ x, z }))

/**
 * The memorial, cut into a level change of its own. The lawn arrives at `DECK_H`; the pool is at lawn level
 * and the walk BEHIND the wall is higher, which is why the owner's photograph looks down onto the water.
 *
 * Built along the wall's real polyline: rough-hewn granite piers with water sheeting between them, glazed
 * inscription panels in the gaps, a pool with stepping stones in front, dark/light triangular paving on the
 * apron, and a curved balustrade on the walk above.
 */
export function mlkWaterfall(out: MeshBuilder, _fit?: Fit): void {
  /*
   * The wall runs from the pool at garden level up to the patio: it IS the Moscone lobby's first-floor
   * inner face, and the walk that looks down onto the water is level 3. So its height is not a choice —
   * it is the gap between the two levels.
   */
  const H = PATIO_H - DECK_H
  const walk = PATIO_H

  // ---- the pool: a shallow basin at lawn level, its water just under the rim
  capPolygon(out, MLK_POOL, DECK_H + 0.04, GRANITE_DK, GRAN_TAG, 4)
  capPolygon(out, MLK_POOL, DECK_H + 0.28, WATER, 0, 4)

  // ---- the wall: piers along the polyline, gaps between them where the water falls
  for (let i = 0; i < MLK_WALL.length - 1; i++) {
    const e = edge(MLK_WALL, i)
    const ang = e.h
    const piers = Math.max(1, Math.round(e.L / 3.0))
    const w = e.L / piers
    for (let k = 0; k < piers; k++) {
      const u = (k + 0.5) * w
      const cx = e.a.x + e.tx * u
      const cz = e.a.z + e.tz * u
      // rough-hewn: each pier is three courses, each a little different in depth and shade
      for (let c = 0; c < 3; c++) {
        const y0 = DECK_H + (c * H) / 3
        const d = 1.1 + 0.12 * ((i + k + c) % 3)
        boxAlong(out, cx + e.nx * d / 2, y0 + H / 6, cz + e.nz * d / 2, w / 2 - 0.45, H / 6, d / 2, ang,
          (i + k + c) % 2 === 0 ? GRANITE_LT : GRANITE, GRAN_TAG)
      }
      /*
       * The fall in the gap to this pier's left. The owner's close oblique settles what this is: a long
       * GREEN GLASS wall with the water behind it, not an open sheet — so the pane is the outer face and
       * the foam is a bright line read through it.
       */
      const ug = k * w
      boxAlong(out, e.a.x + e.tx * ug - e.nx * 0.1, DECK_H + H / 2, e.a.z + e.tz * ug - e.nz * 0.1,
        0.55, H / 2, 0.06, ang, MEMGLASS, GLASS_TAG)
      boxAlong(out, e.a.x + e.tx * ug, DECK_H + H / 2 - 0.2, e.a.z + e.tz * ug,
        0.42, H / 2 - 0.3, 0.05, ang, FOAM, 0)
    }
    // the backing mass behind the piers, holding the walk up
    boxAlong(out, e.a.x + e.tx * (e.L / 2) + e.nx * 1.9, DECK_H + H / 2, e.a.z + e.tz * (e.L / 2) + e.nz * 1.9,
      e.L / 2, H / 2, 0.8, ang, GRANITE_DK, GRAN_TAG)
    // the walk on top, and its balustrade, following the same curve
    // 8 cm proud of the piers' tops, for the same reason as the esplanade's nosings
    boxAlong(out, e.a.x + e.tx * (e.L / 2) + e.nx * 2.6, walk + 0.02, e.a.z + e.tz * (e.L / 2) + e.nz * 2.6,
      e.L / 2, 0.12, 2.2, ang, PAVING, CONC_TAG)
    const posts = Math.max(2, Math.round(e.L / 1.4))
    for (let k = 0; k <= posts; k++) {
      const u = (k / posts) * e.L
      boxAlong(out, e.a.x + e.tx * u + e.nx * 0.55, walk + 0.5, e.a.z + e.tz * u + e.nz * 0.55,
        0.05, 0.5, 0.05, ang, PALEMETAL, METAL_TAG)
    }
    boxAlong(out, e.a.x + e.tx * (e.L / 2) + e.nx * 0.55, walk + 1.02, e.a.z + e.tz * (e.L / 2) + e.nz * 0.55,
      e.L / 2, 0.06, 0.09, ang, PALEMETAL, METAL_TAG)
  }

  // ---- stepping stones across the pool, on the line of the footway that crosses it
  for (let i = 0; i < 7; i++) {
    const t = (i + 0.5) / 7
    const x = -19 + t * 26
    const z = -6 + t * 22
    box(out, x, DECK_H + 0.34, z, 0.75, 0.06, 0.75, GRANITE, GRAN_TAG)
  }

  // ---- the apron in front: dark and light triangular paving, the memorial's own pattern. The grid is
  // turned with the wall (45° here) so it runs parallel to the water, and the tiles just touch.
  const c = Math.SQRT1_2
  for (let i = -9; i < 9; i++) {
    for (let j = 0; j < 4; j++) {
      const u = i * 2.6
      const v = -7 - j * 2.6
      const x = u * c - v * c
      const z = u * c + v * c
      box(out, x, DECK_H + 0.02, z, 1.28, 0.02, 1.28, (i + j) % 2 === 0 ? PAVING_DK : PAVING, CONC_TAG)
    }
  }
}

// ---------------------------------------------------------------------------------------------------------
// 3. Moscone North — the below-grade entrance pavilion on Howard, and the skybridge over the street
// ---------------------------------------------------------------------------------------------------------

/**
 * `way/109141774`, "Moscone Convention Center North" (`height=25 m`, and OSM's own `fixme` says *"Building
 * extends below the gardens"*). Almost all of that 25 m is buried: what a rider sees is a long two-storey
 * glazed pavilion along Howard with the gardens above and behind it. So the entry claims the way — which
 * stops the bake drawing a 25 m brick box in the middle of the lawn — and builds the FRONTAGE only.
 *
 * The entry sets `rotateDeg: 0`, so `fit.ring` arrives in the city's own axes translated to the model's
 * centre. The street side is found geometrically: the footprint's longest edge is the garden side, and the
 * Howard face is every edge whose outward normal opposes it.
 */
export function mosconeNorth(out: MeshBuilder, fit: Fit): void {
  const ring = fit.ring && fit.ring.length >= 3
    ? fit.ring
    : [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]

  /*
   * THREE LEVELS, and they are the BLOCK's three levels, not a second stack of its own:
   *   level 1 = 0 (Howard), level 2 = DECK_H = 4 (the garden level), level 3 = PATIO_H = 8.
   * The curtain wall runs the whole way up, so the building is `PATIO_H + levelHeight` tall and the floor
   * bands fall at 4, 8 and 12 — a rider can read the three levels straight off the facade, which is what
   * the owner's photographs show.
   */
  const LEVELS = [0, DECK_H, PATIO_H]
  const H = PATIO_H + DECK_H

  // the longest edge is the garden side; the street face opposes it
  let longest = 0
  for (let i = 0; i < ring.length; i++) if (edge(ring, i).L > edge(ring, longest).L) longest = i
  const back = edge(ring, longest)

  let first: ReturnType<typeof edge> | null = null
  for (let i = 0; i < ring.length; i++) {
    const e = edge(ring, i)
    if (e.L < 4) continue
    if (e.nx * back.nx + e.nz * back.nz > -0.5) continue
    glazedFront(out, e, H, LEVELS)
    if (!first || e.L > first.L) first = e
  }
  if (!first) return
  const e = first
  const at = (u: number, off: number): P2 => ({ x: e.a.x + e.tx * u + e.nx * off, z: e.a.z + e.tz * u + e.nz * off })

  /*
   * THE TALLER VOLUME AT THE CORNER, and the set-back above it. The lobby is not a plain cube: a glazed
   * mass projects forward at one end, a lower run sits beside it, and the top step back leaves a small
   * terrace. Built from the street edge's own length, so it follows whatever footprint arrives.
   */
  const cornerW = Math.min(e.L * 0.34, 20)
  const cu = e.L - cornerW / 2 - 1
  const cp = at(cu, 1.9)
  boxAlong(out, cp.x, (H + DECK_H * 0.75) / 2, cp.z, cornerW / 2, (H + DECK_H * 0.75) / 2, 1.9, e.h, GREENGLASS, GLASS_TAG)
  mullions(out, e, cu - cornerW / 2, cu + cornerW / 2, 0, H + DECK_H * 0.75, 3.75)
  for (const y of LEVELS.slice(1).concat([H, H + DECK_H * 0.75])) {
    boxAlong(out, cp.x, y - 0.22, cp.z, cornerW / 2 + 0.12, 0.22, 2.0, e.h, PALEMETAL, CONC_TAG)
  }
  // the set-back terrace on top of the lower run, beside the tall volume
  const tw = Math.min(e.L * 0.3, 16)
  const tp = at(tw / 2 + 1, 1.1)
  boxAlong(out, tp.x, H + 0.12, tp.z, tw / 2, 0.12, 1.1, e.h, PAVING, CONC_TAG)
  railing(out, e, 1, tw + 1, H + 0.24, 1.9)

  /*
   * THE LEVEL-2 PLAZA AND ITS OUTDOOR STAIRS — the unusual part, and the reason this cannot be a
   * single-entrance box. The lobby has a street entrance at level 1 AND a second one at level 2; the
   * level-2 doors open onto an outdoor plaza that overlooks the gardens, and that plaza has its own
   * outdoor flight down to the pavement.
   */
  const pu0 = 1.0
  // the plaza takes only the first part of the frontage: it stands 4 m above the pavement, so where it
  // runs it hides the level-1 doors behind its retaining face, and BOTH street entrances have to be visible
  const pu1 = Math.min(e.L * 0.40, e.L - cornerW - 2)
  const pm = (pu0 + pu1) / 2
  const REACH = 7
  const pc = at(pm, REACH / 2)
  boxAlong(out, pc.x, DECK_H - 0.15, pc.z, (pu1 - pu0) / 2, 0.15, REACH / 2, e.h, PAVING, CONC_TAG)
  // its retaining face down to the pavement, and the parapet along its open edge
  const pf = at(pm, REACH)
  boxAlong(out, pf.x, (DECK_H - 0.3) / 2, pf.z, (pu1 - pu0) / 2, (DECK_H - 0.3) / 2, 0.3, e.h, PRECAST, CONC_TAG)
  boxAlong(out, pf.x, DECK_H + 0.55, pf.z, (pu1 - pu0) / 2 - 3.2, 0.55, 0.16, e.h, PRECAST_DK, CONC_TAG)
  // the outdoor flight down to level 1, at the plaza's near end
  const flight = 5.0
  const steps = Math.round(DECK_H / 0.17)
  for (let i = 0; i < steps; i++) {
    const y = (i * DECK_H) / steps
    const depth = (flight * (steps - i)) / steps
    const sp = at(pu1 - 2.6, REACH + depth / 2)
    boxAlong(out, sp.x, y + DECK_H / steps / 2, sp.z, 2.6, DECK_H / steps / 2, depth / 2, e.h,
      i % 2 === 0 ? PAVING : PAVING_DK, CONC_TAG)
  }

  /*
   * THE STAINLESS CRESCENT on the plaza, left of the entrance: a polished part-ring about 6 m across,
   * standing on a low plinth. A ring of short chords, open at the bottom.
   */
  const sc = at(pu0 + 4.5, REACH * 0.72)
  box(out, sc.x, DECK_H + 0.2, sc.z, 1.3, 0.2, 1.3, GRANITE, GRAN_TAG)
  for (let i = 0; i <= 22; i++) {
    const t = -0.14 + (i / 22) * 1.28           // most of a circle, its gap at the foot
    const a0 = t * Math.PI * 2
    const a1 = (t + 1.28 / 22) * Math.PI * 2
    const R = 2.2
    const p0: [number, number, number] = [sc.x + Math.cos(a0) * R * 0.35, DECK_H + 0.4 + R + Math.sin(a0) * R, sc.z + Math.cos(a0) * R * 0.94]
    const p1: [number, number, number] = [sc.x + Math.cos(a1) * R * 0.35, DECK_H + 0.4 + R + Math.sin(a1) * R, sc.z + Math.cos(a1) * R * 0.94]
    strut(out, p0, p1, 0.5, 0.22, [0.82, 0.83, 0.85], METAL_TAG)
  }

  /*
   * The two wordmarks, both `flat` signs — two triangles and a texture each, never letters built out of
   * geometry. `MOSCONE CENTER` is large, widely spaced WHITE capitals high on the glass; `MOSCONE NORTH`
   * is smaller dark capitals on the pale lavender band over the level-1 doors. `lit: 'front'` for the
   * upper one (floodlit applied letters, which do not emit themselves); `lit: 'none'` for the band, which
   * is painted and goes dark with the wall.
   */
  const signAt = (u: number, y: number, off: number): { x: number; y: number; z: number; heading: number } => {
    const p = at(u, off)
    return { x: p.x, y, z: p.z, heading: Math.atan2(e.nx, e.nz) }
  }
  sign(out, {
    type: 'flat', text: 'MOSCONE CENTER', h: 1.2, face: 'grotesque', weight: 'bold',
    colour: [0.96, 0.96, 0.97], tracking: 0.3, lit: 'front', w: Math.min(e.L * 0.62, 30), standoff: 0.12,
  }, signAt(e.L * 0.5, PATIO_H + DECK_H * 0.55, 0.2))
  sign(out, {
    type: 'flat', text: 'MOSCONE NORTH', h: 0.5, face: 'grotesque', weight: 'bold',
    colour: [0.2, 0.2, 0.23], tracking: 0.18, lit: 'none', w: Math.min(e.L * 0.3, 12), standoff: 0.1,
  }, signAt(pu1 + (e.L - pu1) * 0.38, 3.3, 0.34))

  // the pale bollards along the kerb
  for (let i = 0; i < 9; i++) {
    const p = at(pu1 + 1.5 + i * 1.8, REACH + 1.4)
    prism(out, p.x, p.z, 0, 0.9, 0.12, 8, PALEMETAL, METAL_TAG)
  }
}

/** A run of DARK, SLIM, FLUSH mullions — a shadow line in the glass plane, never a post standing off it. */
function mullions(out: MeshBuilder, e: ReturnType<typeof edge>, u0: number, u1: number,
                  y0: number, y1: number, off: number): void {
  const bays = Math.max(2, Math.round((u1 - u0) / 2.2))
  for (let i = 0; i <= bays; i++) {
    const u = u0 + ((u1 - u0) * i) / bays
    boxAlong(out, e.a.x + e.tx * u + e.nx * off, (y0 + y1) / 2, e.a.z + e.tz * u + e.nz * off,
      0.05, (y1 - y0) / 2, 0.02, e.h, DARKFRAME, METAL_TAG)
  }
}

/** A light metal railing along part of an edge, at height `y`, standing `off` out from it. */
function railing(out: MeshBuilder, e: ReturnType<typeof edge>, u0: number, u1: number, y: number, off: number): void {
  const n = Math.max(2, Math.round((u1 - u0) / 1.5))
  for (let i = 0; i <= n; i++) {
    const u = u0 + ((u1 - u0) * i) / n
    boxAlong(out, e.a.x + e.tx * u + e.nx * off, y + 0.5, e.a.z + e.tz * u + e.nz * off,
      0.04, 0.5, 0.04, e.h, PALEMETAL, METAL_TAG)
  }
  const um = (u0 + u1) / 2
  boxAlong(out, e.a.x + e.tx * um + e.nx * off, y + 1.02, e.a.z + e.tz * um + e.nz * off,
    (u1 - u0) / 2, 0.05, 0.07, e.h, PALEMETAL, METAL_TAG)
}

/**
 * One run of the lobby's curtain wall: green-blue tinted glass in a large regular grid, dark slim flush
 * mullions, a pale floor-slab band at every level, glass doors at level 1 and again at level 2, and the
 * escalators read through the glass.
 */
function glazedFront(out: MeshBuilder, e: ReturnType<typeof edge>, H: number, levels: number[]): void {
  const ang = e.h
  const um = e.L / 2
  const face = (off: number, y0: number, y1: number, c: Rgb, tag: number, t = 0.12, shrink = 0): void => {
    boxAlong(out, e.a.x + e.tx * um + e.nx * off, (y0 + y1) / 2, e.a.z + e.tz * um + e.nz * off,
      e.L / 2 - shrink, (y1 - y0) / 2, t, ang, c, tag)
  }
  face(0, 0, H, GREENGLASS, GLASS_TAG, 0.3)
  mullions(out, e, 0, e.L, 0, H, 0.16)
  /*
   * THE FLOOR-SLAB BANDS — pale grey, one per level and one at the parapet. These are what let a rider
   * read three levels off the facade, and they are the reason this must not be a blank glazed slab.
   */
  for (const y of levels.slice(1).concat([H])) face(0.14, y - 0.55, y, PALEMETAL, CONC_TAG, 0.06)

  /*
   * THE ESCALATORS, behind the glass. We build no interiors anywhere else; this is the exception the
   * owner's photographs argue for — crossed diagonals climbing two storeys are visible from the pavement
   * in two of three frames and are the single thing that says "transit-hall lobby".
   */
  for (const [u0, u1] of [[0.3, 0.56], [0.66, 0.4]] as const) {
    const n = 11
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n
      const u = (u0 + (u1 - u0) * t) * e.L
      boxAlong(out, e.a.x + e.tx * u - e.nx * 2.2, 0.6 + t * (levels[2] - 1.2), e.a.z + e.tz * u - e.nz * 2.2,
        (Math.abs(u1 - u0) * e.L) / n / 2, 0.2, 0.85, ang, i % 2 === 0 ? PALEMETAL : [0.64, 0.65, 0.67], METAL_TAG)
    }
  }

  // the doors — TWO sets, one at street level and one at level 2, which is the arrangement that matters
  const band = (y: number): void => face(0.32, y + 2.9, y + 3.8, LAVENDER, CONC_TAG, 0.1, 1)
  for (const y of [levels[0], levels[1]]) {
    band(y)
    const doors = Math.max(2, Math.round(e.L / 2.6))
    for (let i = 0; i < doors; i++) {
      const u = ((i + 0.5) / doors) * e.L
      boxAlong(out, e.a.x + e.tx * u + e.nx * 0.32, y + 1.4, e.a.z + e.tz * u + e.nz * 0.32,
        1.0, 1.4, 0.06, ang, [0.22, 0.33, 0.32], GLASS_TAG)
    }
  }
  // the parapet, so the glass has a top rather than an open edge against the gardens behind
  face(0.08, H, H + 0.5, PALEMETAL, METAL_TAG, 0.55)
}

/**
 * THE SKYBRIDGE over Howard Street — `way/940154716` (`bridge=yes`, `highway=footway`, `layer=1`), from the
 * Moscone North pavilion across to Moscone South. A rider passes under it, so the face that matters is the
 * SOFFIT: a smooth pale panelled underside with a deep fascia at each edge. The glass flanks are seen from
 * further down the street and are built thinner.
 *
 * The line is its own OSM way, in metres relative to its own centre, and its height is `BRIDGE_H` — the
 * height the bake's own ride graph already gives this way, not a measured guess. It is a solid box well clear of the road surface, so the
 * near-coplanar trap `city.ts` documents does not arise: nothing here is within metres of the ground plane.
 */
const SKYBRIDGE: P2[] = ([[-15.5, 15.7], [-14.0, 14.3], [-12.8, 13.0], [15.4, -15.6]] as [number, number][])
  .map(([x, z]) => ({ x, z }))

export function mosconeSkybridge(out: MeshBuilder, _fit?: Fit): void {
  const Y = BRIDGE_H - 0.4   // the soffit, just under the ride graph's own deck height for this way
  const W = 5.0        // the enclosed width
  const D = 2.6        // sill to roof
  for (let i = 0; i < SKYBRIDGE.length - 1; i++) {
    const e = edge(SKYBRIDGE, i)
    const ang = e.h
    const um = e.L / 2
    const cx = e.a.x + e.tx * um
    const cz = e.a.z + e.tz * um
    /*
     * THE SOFFIT. From beneath, this is a broad flat DARK-GREY PANELLED plane in a large rectangular grid,
     * and it is the only part of the bridge a rider passing under ever sees. Built as real panels with the
     * grid lines between them: one flat box read as nothing at all in the first render.
     */
    boxAlong(out, cx, Y - 0.2, cz, e.L / 2, 0.2, W / 2 - 0.3, ang, SOFFIT, METAL_TAG)
    const cols = Math.max(2, Math.round(e.L / 2.6))
    for (let a = 0; a < cols; a++) {
      for (const off of [-1, 1] as const) {
        const u = ((a + 0.5) / cols) * e.L
        const p = { x: e.a.x + e.tx * u + e.nx * off * (W / 4 - 0.1), z: e.a.z + e.tz * u + e.nz * off * (W / 4 - 0.1) }
        // the panels hang BELOW the soffit plate, not inside it: at Y − 0.02 their tops were 1 cm proud
        // of the plate's own top and the coplanar check flagged 170 m² of it
        boxAlong(out, p.x, Y - 0.47, p.z, e.L / cols / 2 - 0.07, 0.03, W / 4 - 0.22, e.h, SOFFIT_LT, METAL_TAG)
      }
    }
    for (const s of [-1, 1] as const) {
      boxAlong(out, cx + e.nx * s * W / 2, Y + 0.25, cz + e.nz * s * W / 2, e.L / 2, 0.65, 0.22, ang,
        PALEMETAL, METAL_TAG)
      // the glass flank above the fascia, slightly battered in, with fine vertical mullions
      boxAlong(out, cx + e.nx * s * (W / 2 - 0.22), Y + 0.9 + D / 2, cz + e.nz * s * (W / 2 - 0.22),
        e.L / 2, D / 2, 0.1, ang, GREENGLASS, GLASS_TAG)
      const bays = Math.max(2, Math.round(e.L / 1.5))
      for (let k = 0; k <= bays; k++) {
        const u = (k / bays) * e.L
        boxAlong(out, e.a.x + e.tx * u + e.nx * s * (W / 2 - 0.14), Y + 0.9 + D / 2,
          e.a.z + e.tz * u + e.nz * s * (W / 2 - 0.14), 0.05, D / 2, 0.05, ang, PALEMETAL, METAL_TAG)
      }
    }
    // the roof
    boxAlong(out, cx, Y + 0.9 + D + 0.15, cz, e.L / 2, 0.15, W / 2, ang, PALEMETAL, METAL_TAG)
  }
}

// ---------------------------------------------------------------------------------------------------------
// 4. the SOUTH deck — the second raised ground, on top of Moscone South, across Howard
// ---------------------------------------------------------------------------------------------------------

/**
 * `way/109141776`, "Moscone Convention Center South" (`height=12`), relative to its own bbox centre. The
 * public deck — Children's Garden, carousel, Creativity Museum, terraces — is a single raised surface on
 * top of it, so the roof outline IS the deck outline. Same treatment as the north lawn, one level higher.
 */
/*
 * CORRECTION 2026-09-23 — vertex 0 nudged and a bulge (vertex 9) added to close the gap the report measured:
 * the open bridge's SE end (`OPEN_BRIDGE`, below) sits 5.68 m outside this ring's edge 8→0 (`way/109141776`'s
 * own Howard-facing corner). Both bridge parapet corners at that end, projected into THIS ring's local frame
 * (world metres, subtracting this entry's own lat/lon origin — the same trick `ms-edges.ts` uses on the
 * Ballroom's vertices), land at world (898.1, −1029.3) and (894.4, −1037.3); padded 1.2 m further along the
 * bridge's own axis (matching the +1.2 m the bridge's own slab already extends past its nominal ends) that is
 * (899.2, −1029.8) and (895.5, −1037.8) — deck-local (−46.19, −13.12) and (−49.85, −21.12). The first is a
 * ~2 m nudge of the original vertex 0 (−46.4, −11.3); the second is a new vertex 9, bulging the ring out to
 * meet the bridge rather than moving the bridge (which is correct and untouched — see `OPEN_BRIDGE`).
 * `mosconeSouthDeck`'s parapet loop skips the two new edges (8→9, 9→0) this bulge creates, alongside the
 * park join (edge 6, `MS_GARDENS_JOIN`), so a rider stepping off the bridge finds paved deck, not a wall.
 */
const SOUTH_RING: P2[] = ([
  [-46.19, -13.12], [1.3, 36.7], [11.1, 46.5], [46.4, 11.3], [31.6, -3.6], [31.5, -3.7],
  [18.2, -17.0], [-11.1, -46.5], [-17.5, -40.1], [-49.85, -21.12],
] as [number, number][]).map(([x, z]) => ({ x, z }))

/** Level 3 again: both Howard crossings land on the patio, and the open one lands on the south deck. */
const BRIDGE_H = PATIO_H
const SOUTH_DECK_H = PATIO_H

/*
 * `MS_GARDENS_JOIN` (`sf/ms-gardens.ts`) is the source of truth for the join and is NOT re-derived below —
 * but it cannot be `import`ed here. `ms-gardens.ts` imports `LEVELS`/`UNDERCROFT_H` from `./moscone-south.ts`,
 * which itself imports `DECK_H` from THIS file — importing `ms-gardens.ts` here would close that into a
 * cycle (`yerba-buena.ts` → `ms-gardens.ts` → `moscone-south.ts` → `yerba-buena.ts`), which fails at load
 * with "Cannot access 'DECK_H' before initialization" (checked). None of the three files is this report's to
 * restructure (`moscone-south.ts` and `ms-gardens.ts` are both off-limits — see the task's file list).
 *
 * So the join is READ, not retyped: `MS_GARDENS_JOIN.JOIN` is `{ u0: -29.0(ish), u1: +12.6(ish), v }` in the
 * park's own 45°-rotated local frame, its length is `docs/MOSCONE-SOUTH.md`'s own "41.6 m", and `SOUTH_RING`
 * below has exactly one edge that length — edge 6 (v6=(18.2,-17.0) to v7=(-11.1,-46.5), 41.58 m, matching to
 * 0.02 m). That is the join, confirmed by measurement rather than assumed by position.
 */
/**
 * The edges `mosconeSouthDeck`'s parapet must skip: the park join (`SOUTH_RING`'s edge 6 — see above, matched
 * against `MS_GARDENS_JOIN`'s own 41.6 m length) and the bridge-landing bulge (`SOUTH_RING`'s vertices 8 and
 * 9, the correction above) — both must read as continuous deck, not a wall, for the route bridge → deck →
 * wall → descent to be walkable.
 */
const NO_PARAPET = new Set([6, 8, 9])

/**
 * The south deck: the raised surface, its retaining edge, the broad flight up from the Howard side, the
 * paved public square, the planted patches and the curved terraced planting.
 *
 * What is NOT here, and why — the judgement the report is about. From Howard, Third and Folsom a rider sees
 * the wall, the edge and a SILHOUETTE; the things standing on the deck are 30–60 m back from the parapet
 * and read as massing, nothing more. So the deck surface and its edge are built properly and the objects on
 * it are left to their own entries: the Children's Creativity Museum (`way/288716388`) is already modelled,
 * the Yerba Buena Ice Skating Center (`way/27572497`) stands on a separate structure further south-east and
 * is queued on its own, and the carousel and the painted play surface have no OSM object to place them by.
 */
export function mosconeSouthDeck(out: MeshBuilder, _fit?: Fit): void {
  const ring = SOUTH_RING
  capPolygon(out, ring, SOUTH_DECK_H, PAVING, CONC_TAG, 6)

  // the retaining edge all the way round, and its coping — except where a rider actually crosses it: the
  // park join and the open bridge's landing (`NO_PARAPET`, above), which must stay open, unwalled deck
  for (let i = 0; i < ring.length; i++) {
    const e = edge(ring, i)
    if (e.L < 2) continue
    panelWall(out, e, 0, SOUTH_DECK_H, 5.0, 0.6, PRECAST, PRECAST_DK, CONC_TAG)
    if (NO_PARAPET.has(i)) continue
    const um = e.L / 2
    const ang = e.h
    boxAlong(out, e.a.x + e.tx * um - e.nx * 0.2, SOUTH_DECK_H + 0.1, e.a.z + e.tz * um - e.nz * 0.2,
      e.L / 2, 0.1, 0.4, ang, PRECAST_DK, CONC_TAG)
    // a solid parapet, which is what gives this deck its edge against the sky from the street below
    boxAlong(out, e.a.x + e.tx * um - e.nx * 0.35, SOUTH_DECK_H + 0.65, e.a.z + e.tz * um - e.nz * 0.65,
      e.L / 2, 0.55, 0.22, ang, PRECAST, CONC_TAG)
  }

  // the way up, on the Howard (north-west) edge: one broad flight, the full width of the run
  const up = edge(ring, 0)
  const steps = Math.round(SOUTH_DECK_H / 0.17)
  for (let i = 0; i < steps; i++) {
    const y = (i * SOUTH_DECK_H) / steps
    const outw = 0.32 * (steps - i)
    const um = up.L / 2
    boxAlong(out, up.a.x + up.tx * um + up.nx * outw / 2, y + SOUTH_DECK_H / steps / 2,
      up.a.z + up.tz * um + up.nz * outw / 2, up.L * 0.34, SOUTH_DECK_H / steps / 2, outw / 2,
      up.h, i % 2 === 0 ? PAVING : PAVING_DK, CONC_TAG)
  }

  // the curved terraced planting on the deck — arcs of green steps, which is what the aerial shows
  for (let i = 0; i < 4; i++) {
    prism(out, 6 + i * 1.6, -8 - i * 1.6, SOUTH_DECK_H + 0.05 * i, SOUTH_DECK_H + 0.45 + 0.35 * i,
      13 - i * 2.6, 20, i % 2 === 0 ? LAWN : LAWN_DK, 0, (13 - i * 2.6) * 0.92)
  }
}

/**
 * THE OPEN SKYBRIDGE over Howard — `way/1116462961` (`bridge=yes`, `layer=1`), with `way/1116462960`
 * (`man_made=bridge`) giving its deck as a polygon. Uncovered: a flat slab with a solid parapet down each
 * side on tapered columns, parallel to the enclosed glazed tube a few tens of metres to the north-east.
 *
 * As with the glazed one, the SOFFIT is the whole of what a rider sees — a broad concrete plane overhead
 * with a deep fascia and daylight past it on both sides — so that is what is built carefully. It is at level 3
 * and the road is at 0, so nothing here is near-coplanar with the ground layers `city.ts` warns about.
 */
const OPEN_BRIDGE: P2[] = ([[-16.6, 7.6], [16.6, -7.6]] as [number, number][]).map(([x, z]) => ({ x, z }))

export function mosconeOpenBridge(out: MeshBuilder, _fit?: Fit): void {
  const Y = SOUTH_DECK_H
  const W = 9.0
  const e = edge(OPEN_BRIDGE, 0)
  const ang = e.h
  const um = e.L / 2
  const cx = e.a.x + e.tx * um
  const cz = e.a.z + e.tz * um
  // the soffit slab: one broad flat plane with a deep fascia at each edge
  boxAlong(out, cx, Y - 0.55, cz, e.L / 2 + 1.2, 0.3, W / 2 - 0.45, ang, PALEMETAL, CONC_TAG)
  for (const s of [-1, 1] as const) {
    boxAlong(out, cx + e.nx * s * W / 2, Y - 0.45, cz + e.nz * s * W / 2, e.L / 2 + 1.2, 0.5, 0.45, ang,
      PRECAST_DK, CONC_TAG)
    // the solid parapet above the deck
    boxAlong(out, cx + e.nx * s * (W / 2 - 0.1), Y + 0.5, cz + e.nz * s * (W / 2 - 0.1),
      e.L / 2 + 1.2, 0.55, 0.2, ang, PRECAST, CONC_TAG)
  }
  // the deck surface between the parapets
  boxAlong(out, cx, Y - 0.06, cz, e.L / 2 + 1.2, 0.06, W / 2 - 0.3, ang, PAVING, CONC_TAG)
  // tapered columns, in from each end so they stand on the pavements and not in the carriageway
  for (const s of [-1, 1] as const) {
    const u = um + s * (e.L / 2 - 2.5)
    for (let k = 0; k < 6; k++) {
      const y0 = (k * (Y - 0.85)) / 6
      const y1 = ((k + 1) * (Y - 0.85)) / 6
      const r = 0.95 - 0.55 * (k / 6)
      prism(out, e.a.x + e.tx * u, e.a.z + e.tz * u, y0, y1, r, 10, PRECAST_DK, CONC_TAG, r)
    }
  }
}

// ---------------------------------------------------------------------------------------------------------
// 5. the passage beside the YBCA theatre, and the terrace garden that climbs out of it
// ---------------------------------------------------------------------------------------------------------

/**
 * THE TERRACE GARDEN on the gardens' north-east edge, above the pedestrian passage that cuts through at
 * grade between the YBCA theatre and Moscone. From the owner's photograph: about five stepped concrete
 * retaining tiers, each planted with low dense shrubs and spiky grasses, climbing from the walkway up to
 * deck level, with a metal railing and a real walkway along the top.
 *
 * This is the whole grade change made visible in one piece of geometry, and stepped planters are boxes, so
 * it is cheap. It stands on the run of edges the OSM retaining walls `way/1167668178` and `way/1167668192`
 * follow — the park's own north-east boundary, which is the passage's south side.
 *
 * The planting is boxed foliage rather than instanced models: `src/render/plants.ts` places from a lattice
 * over ground-level park areas and its `Planted` has no height of its own (this session added an optional
 * `y`, for Salesforce Park), and a landmark builder has no access to the plant pools in any case. Designed
 * beds on a deck want individual placement, which is a planting job and not a modelling one.
 */
function terraceGarden(out: MeshBuilder, e: ReturnType<typeof edge>): void {
  const TIERS = 4
  const rise = DECK_H / TIERS
  const tread = 1.6
  const ang = e.h
  const um = e.L / 2
  for (let i = 0; i < TIERS; i++) {
    const y = DECK_H - (i + 1) * rise
    const outw = (i + 1) * tread
    const cx = e.a.x + e.tx * um + e.nx * (outw - tread / 2)
    const cz = e.a.z + e.tz * um + e.nz * (outw - tread / 2)
    boxAlong(out, cx, y + rise / 2, cz, e.L / 2, rise / 2, tread / 2, ang, PRECAST, CONC_TAG)
    // the planted face of each tier: low, dense and repeated, which is what the photograph shows
    const n = Math.max(2, Math.round(e.L / 1.6))
    for (let k = 0; k < n; k++) {
      const u = ((k + 0.5) / n) * e.L
      const px = e.a.x + e.tx * u + e.nx * (outw - tread * 0.45)
      const pz = e.a.z + e.tz * u + e.nz * (outw - tread * 0.45)
      boxAlong(out, px, y + rise + 0.3, pz, e.L / n / 2 - 0.08, 0.3, tread * 0.32, ang,
        (i + k) % 2 === 0 ? LAWN : LAWN_DK, 0)
    }
  }
  // the walkway along the top, at deck level, and its railing — a real path, not a parapet
  boxAlong(out, e.a.x + e.tx * um - e.nx * 1.4, DECK_H + 0.06, e.a.z + e.tz * um - e.nz * 1.4,
    e.L / 2, 0.06, 1.4, ang, PAVING, CONC_TAG)
  const posts = Math.max(2, Math.round(e.L / 1.5))
  for (let k = 0; k <= posts; k++) {
    const u = (k / posts) * e.L
    boxAlong(out, e.a.x + e.tx * u + e.nx * 0.1, DECK_H + 0.55, e.a.z + e.tz * u + e.nz * 0.1,
      0.04, 0.55, 0.04, ang, PALEMETAL, METAL_TAG)
  }
  boxAlong(out, e.a.x + e.tx * um + e.nx * 0.1, DECK_H + 1.12, e.a.z + e.tz * um + e.nz * 0.1,
    e.L / 2, 0.05, 0.07, ang, PALEMETAL, METAL_TAG)
}

/**
 * The LIGHT bridge over that passage — deliberately not the Howard skybridge. An open steel walkway on
 * slender columns with a curved metal-mesh canopy, crossing above the cut at a lower height than the
 * enclosed glazed tube over Howard. Two bridges of different materials at different heights, kept apart.
 */
function passageBridge(out: MeshBuilder, from: P2, to: P2): void {
  const e = edge([from, to], 0)
  const Y = DECK_H - 0.4
  const cx = (from.x + to.x) / 2
  const cz = (from.z + to.z) / 2
  const along = (u: number, off: number): P2 => ({
    x: e.a.x + e.tx * u + e.nx * off, z: e.a.z + e.tz * u + e.nz * off,
  })
  boxAlong(out, cx, Y, cz, e.L / 2, 0.14, 1.5, e.h, PALEMETAL, METAL_TAG)
  for (const s of [-1, 1] as const) {
    const p = along(e.L / 2, s * 1.5)
    boxAlong(out, p.x, Y + 0.6, p.z, e.L / 2, 0.5, 0.05, e.h, DARKFRAME, METAL_TAG)
  }
  // the curved mesh canopy: chords across, highest in the middle
  for (let i = 0; i <= 6; i++) {
    const t = i / 6
    const h = 2.4 - 0.5 * (2 * t - 1) ** 2
    const p = along(e.L / 2, (t - 0.5) * 3.0)
    boxAlong(out, p.x, Y + h, p.z, e.L / 2, 0.05, 0.28, e.h, PALEMETAL, METAL_TAG)
  }
  for (const u of [1.5, e.L - 1.5]) {
    const p = along(u, 0)
    for (let k = 0; k < 4; k++) {
      prism(out, p.x, p.z, (k * (Y - 0.2)) / 4, ((k + 1) * (Y - 0.2)) / 4, 0.16, 8, PALEMETAL, METAL_TAG)
    }
  }
}
