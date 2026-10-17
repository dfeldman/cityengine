/**
 * HALLIDIE PLAZA, Market at Powell and Cyril Magnin (BUGS.md #318, owner 2026-10-17: "could use more work", "many
 * stray osm walkways on this bart/muni station"): Halprin, Warnecke and Ciampi's 1973 sunken plaza in front of the
 * Powell Street BART/Muni concourse, about 6 m below the street. Cyril Magnin crosses it on a short bridge, splitting
 * it into an EAST part (the concourse doors, the 1997 perforated-steel lift, the escalators up to the cable-car
 * turntable at Powell) and a smaller WEST part (its own escalators to Market, stairs from Eddy).
 *
 * What the photographs show (Mapillary 1054512646486470, 513847020110230, 1360731937669924, 2065521223587246,
 * 671796615192912; Wikipedia "Hallidie Plaza"): red brick everywhere, the street-level sidewalks and the sunken floor
 * alike; pale granite/concrete retaining walls with a dark bronze railing along every rim; terraced planters on the
 * north side under 1 Powell (Bank of America); a mural-painted coffee kiosk on the floor; escalators running
 * parallel to Market; the lift's stainless cage standing up out of the plaza at the Market edge. The visitor
 * centre under the bridge closed in 2018, so it has no sign here.
 *
 * The terrain cannot be dug (bart-plazas.ts says the same of the Mission Street wells), so the plaza is drawn as
 * what is seen of it: one continuous brick floor (the bake's three overlapping `paved` areas came out as random red
 * and grey patches), the sunken floor a darker, shaded brick inside the rims, the rims as granite parapets with
 * the railing, the stairs and escalators as treads and steel strips with their balustrades, the doors, the lift,
 * the kiosk and the BART/Muni pylons. Draped (`"drape": true`): the baked ground already dips 2–3 m below Market, and
 * the walls are measured up to the street's levelled height (`fit.groundAt` beyond them), so they meet the sidewalk.
 *
 * `coversRaised`: the entry claims the OSM steps and the three BART entrance points (ref A1) inside it, which the
 * city otherwise drew as loose white flights and Market Street glass canopies on the floor. The level −0.5/−0.9
 * footways are suppressed in public/patches/san-francisco.json, and the Cyril Magnin bridge is un-bridged there
 * (its deck stood as a cream block on the undug ground).
 *
 * Local frame: x east, z north (front 180), metres from 37.784258, −122.408329 — OSM's coordinates as they are.
 */
import { capPolygonWithHoles, type MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { box, strut, prism, FIXED, EMIT, type Rgb } from '../../models.ts'
import { signText } from '../parts.ts'
import { surfaceTag } from '../../cartoon-material.ts'

type P = [number, number]

const BRICK: Rgb = [0.6, 0.3, 0.24]
const BRICK_LOW: Rgb = [0.47, 0.23, 0.19]      // the sunken floor, in the walls' shade
const GRANITE: Rgb = [0.74, 0.72, 0.68]
const RAIL: Rgb = [0.24, 0.2, 0.16]            // the dark bronze railing
const PLANT: Rgb = [0.26, 0.42, 0.22]
const VOID: Rgb = [0.06, 0.06, 0.07]
const TREAD: Rgb = [0.66, 0.65, 0.62]
const STEEL: Rgb = [0.71, 0.70, 0.66]
const PERF: Rgb = [0.6, 0.61, 0.6]             // the lift's perforated stainless, darker for the holes
const GLASS: Rgb = [0.3, 0.38, 0.42]
const BART_BLUE: Rgb = [0.1, 0.36, 0.7]
const MUNI_RED: Rgb = [0.78, 0.15, 0.15]
const WHITE: Rgb = [0.95, 0.95, 0.93]

// ---- the floors (OSM ways 8919715 and 772766515, the sunken levels; the rims from place=square way/1453030619).
// The east floor runs to the foot of the wall under Market's sidewalk: the line x − z = 18.2, just in front of the
// retaining wall the city already draws where Market's levelled sidewalk stands over the dip (measured off an
// overhead shot at x − z ≈ 18.7, 2026-10-17). Everything beyond it is at the street's level.
const EAST_ALL: P[] = [[3.5, 6], [11, -1], [13.8, -3.8], [49.6, 32], [49, 36], [45, 39], [26, 36.5], [10, 33.5], [-4, 31],
  [-5, 26], [-4.5, 20], [-3.5, 14], [0, 9]]
const EAST_LOW: P[] = [[3.5, 6], [11, -1], [13.8, -3.8], [36.6, 19], [36, 25], [36, 27], [35, 28], [15, 25], [8, 18], [9, 11], [6, 8]]
const WEST_ALL: P[] = [[-27, 0], [-15, -11], [-6, -18], [-1, -24], [-9, -32], [-19, -42], [-24, -38], [-29, -2]]
const WEST_LOW: P[] = [[-3, -15], [-7, -12], [-10, -8], [-14, -12], [-18, -16], [-17, -26], [-16, -27], [-3, -27], [-1, -24], [-6, -18]]

/**
 * The rims: a retaining wall up to the street outside, the granite parapet and the bronze railing on it (OSM's
 * barrier=retaining_wall ways topped at level 0). `side` is which hand of the line the street is on (+1 left), `reach`
 * how far out to look for the street's level.
 */
const RIMS: { line: P[]; side: 1 | -1; reach: number; T?: number; curb?: number }[] = [
  // east: the wall under Market (OSM way 128478756 and the concourse frontage), from the bridge corner to Powell
  { line: [[11, -1], [13.8, -3.8], [49.6, 32]], side: -1, reach: 8, T: 1.3, curb: 1.0 },
  // east: the north edge under 1 Powell (way 128478754), stopping short of the 24-step flight
  { line: [[-2, 24], [7, 29], [36, 33.6]], side: 1, reach: 3 },
  // east: along Cyril Magnin (way 772766541)
  { line: [[4, 7], [-5, 16], [-6, 23]], side: 1, reach: 4 },
  // west: along Cyril Magnin (way 772766542), along Market (way 772766516), and the One Hallidie side (way 128478750)
  { line: [[-26, 1], [-23, -2], [-14, -11]], side: 1, reach: 4 },
  { line: [[-7, -18], [-1, -24], [-9, -32], [-19, -42]], side: 1, reach: 4 },
  { line: [[-26.5, -4.5], [-21, -32], [-22, -34]], side: -1, reach: 3 },
]
// the lower walls inside: the terrace edges, granite planters with shrubs on them (ways 184564846, 184564864)
const PLANTERS: P[][] = [
  [[0, 16], [10, 25], [34, 29.6]],
  [[-18, -31], [-22, -11]],
]
// the stair flights, top first, and their widths (OSM highway=steps)
const FLIGHTS: [P, P, number][] = [
  [[-2, 16], [6, 8], 3.5], [[-4, 24], [-4, 19], 3], [[42, 33], [35, 27], 4],
  [[-27, 0], [-24, -3], 3], [[-21, -6], [-14, -12], 3], [[-18, -34], [-13, -29], 3], [[-22, -37], [-19, -35], 2.5],
]
// the escalator pairs, street end first (east: up to Powell; west: up to Market)
const ESCALATORS: [P, P][] = [[[49, 35.5], [37, 23.5]], [[-20.5, -40.5], [-10.5, -30.5]]]

/** a polyline cut into pieces no longer than `step`, so a draped wall follows the ground */
function pieces(line: P[], step = 2): [P, P][] {
  const out: [P, P][] = []
  for (let i = 1; i < line.length; i++) {
    const [a, b] = [line[i - 1], line[i]]
    const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step))
    for (let k = 0; k < n; k++) {
      const t0 = k / n, t1 = (k + 1) / n
      out.push([[a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0], [a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1]])
    }
  }
  return out
}

const ring = (r: P[]): { x: number; z: number }[] => r.map(([x, z]) => ({ x, z }))

/** the ground over the placement at a local point (0 where the fit has no ground: the kit's demo stage) */
const ground = (fit: Fit, x: number, z: number): number => fit.groundAt?.(x, z) ?? 0

/**
 * Something that must stand UPRIGHT on a draped model (a lift, a door, a pylon): the entry drapes every vertex by the
 * ground under it, so each vertex written by `draw` is lowered by its own ground and raised by the ground at (cx, cz),
 * and the whole thing lands level on that one point instead of shearing with the slope.
 */
function upright(out: MeshBuilder, fit: Fit, cx: number, cz: number, draw: () => void): void {
  const i0 = out.positions.length
  draw()
  if (!fit.groundAt) return
  const g0 = ground(fit, cx, cz)   // (the caller passes a point on the open floor: inside the street's levelling it would be the street's)
  for (let i = i0; i < out.positions.length; i += 3) out.positions[i + 1] += g0 - ground(fit, out.positions[i], out.positions[i + 2])
}

/** a vertical band between two points of a line, its foot at y0 and its head at y1 at each end */
function band(out: MeshBuilder, a: P, b: P, a0: number, a1: number, b0: number, b1: number, n: [number, number, number], c: Rgb, tag: number): void {
  out.quad([[a[0], a0, a[1]], [b[0], b0, b[1]], [b[0], b1, b[1]], [a[0], a1, a[1]]], n, [[0, 0], [1, 0], [1, 1], [0, 1]], c, tag)
}

/**
 * The retaining wall up to the street, the parapet on it and the bronze railing, piece by piece.
 *
 * ANCHORED, not draped: the street's corridor is levelled (terrain.grade) and that levelling reaches a little way
 * past its kerb, so a wall draped on the ground at its own line came out a street's height too tall. Every vertex
 * of a piece is held to the floor `IN` metres inside it instead, and the wall's head to the street `reach` metres
 * out: the cap is `T` deep, wide enough to meet the wall the city draws along the kerb, and covers the seam.
 */
function rim(out: MeshBuilder, fit: Fit, line: P[], side: 1 | -1, reach: number, T = 0.4, CURB = 0.6): void {
  const granite = surfaceTag('granite')
  const IN = 4, RAIL_UP = CURB > 0.8 ? 0.35 : 0.5
  for (const [a, b] of pieces(line)) {
    const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz)
    const nx = (-dz / L) * side, nz = (dx / L) * side        // toward the street
    const top = (p: P): number => Math.max(0, ground(fit, p[0] + nx * reach, p[1] + nz * reach) - ground(fit, p[0] - nx * IN, p[1] - nz * IN))
    const ta = top(a), tb = top(b)
    const ao: P = [a[0] + nx * T, a[1] + nz * T], bo: P = [b[0] + nx * T, b[1] + nz * T]
    const inward: [number, number, number] = [-nx, 0, -nz], outward: [number, number, number] = [nx, 0, nz]
    const i0 = out.positions.length
    // the wall and its parapet as one: the face to the plaza, the back, the cap
    band(out, a, b, 0, ta + CURB, 0, tb + CURB, inward, GRANITE, granite)
    band(out, ao, bo, ta, ta + CURB, tb, tb + CURB, outward, GRANITE, granite)
    out.quad([[a[0], ta + CURB, a[1]], [b[0], tb + CURB, b[1]], [bo[0], tb + CURB, bo[1]], [ao[0], ta + CURB, ao[1]]], [0, 1, 0],
      [[0, 0], [1, 0], [1, 1], [0, 1]], GRANITE, granite)
    // the railing along the cap's inner edge: top rail, a lower rail, a post at each piece
    const m: P = [a[0] + nx * 0.2, a[1] + nz * 0.2], mb: P = [b[0] + nx * 0.2, b[1] + nz * 0.2]
    strut(out, [m[0], ta + CURB + RAIL_UP, m[1]], [mb[0], tb + CURB + RAIL_UP, mb[1]], 0.07, 0.06, RAIL)
    strut(out, [m[0], ta + CURB + RAIL_UP * 0.55, m[1]], [mb[0], tb + CURB + RAIL_UP * 0.55, mb[1]], 0.04, 0.04, RAIL)
    box(out, m[0], ta + CURB + RAIL_UP / 2, m[1], 0.03, RAIL_UP / 2, 0.03, RAIL, FIXED)
    anchor(out, fit, i0, -nx * IN, -nz * IN)
  }
}

/** hold every vertex written since `i0` to the ground at its own position moved by (ox, oz), against the drape */
function anchor(out: MeshBuilder, fit: Fit, i0: number, ox: number, oz: number): void {
  if (!fit.groundAt) return
  for (let i = i0; i < out.positions.length; i += 3) {
    const x = out.positions[i], z = out.positions[i + 2]
    out.positions[i + 1] += ground(fit, x + ox, z + oz) - ground(fit, x, z)
  }
}

/** the street's height over the floor beyond a rim point (`n` toward the street), as `rim` measures it */
function streetOver(fit: Fit, p: P, n: P, reach = 6): number {
  return Math.max(0, ground(fit, p[0] + n[0] * reach, p[1] + n[1] * reach) - ground(fit, p[0] - n[0] * 4, p[1] - n[1] * 4))
}

/** a low planter wall with its shrubs, the planting on the higher (left-hand, walking the line) side */
function planter(out: MeshBuilder, line: P[]): void {
  const conc = surfaceTag('concrete'), leaf = surfaceTag('foliage')
  for (const [a, b] of pieces(line)) {
    const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz)
    const nx = -dz / L, nz = dx / L
    strut(out, [a[0], 0.35, a[1]], [b[0], 0.35, b[1]], 0.3, 0.7, GRANITE, conc)
    strut(out, [a[0] + nx * 0.9, 0.75, a[1] + nz * 0.9], [b[0] + nx * 0.9, 0.75, b[1] + nz * 0.9], 1.4, 0.5, PLANT, leaf)
  }
}

/** a flight drawn flat: a granite band with pale treads across it and a handrail each side */
function flight(out: MeshBuilder, top: P, foot: P, w: number): void {
  const dx = foot[0] - top[0], dz = foot[1] - top[1], L = Math.hypot(dx, dz)
  const ux = dx / L, uz = dz / L, nx = -uz, nz = ux
  const conc = surfaceTag('concrete')
  strut(out, [top[0], 0.24, top[1]], [foot[0], 0.24, foot[1]], w, 0.04, [0.5, 0.49, 0.47], conc)
  const n = Math.max(3, Math.round(L / 0.34))
  for (let k = 0; k < n; k++) {
    const t = (k + 0.5) / n
    const cx = top[0] + dx * t, cz = top[1] + dz * t
    strut(out, [cx - nx * (w / 2 - 0.1), 0.33, cz - nz * (w / 2 - 0.1)], [cx + nx * (w / 2 - 0.1), 0.33, cz + nz * (w / 2 - 0.1)], 0.1, 0.05, TREAD, conc)
  }
  for (const s of [-1, 1]) {
    const ox = nx * s * (w / 2), oz = nz * s * (w / 2)
    strut(out, [top[0] + ox, 1.05, top[1] + oz], [foot[0] + ox, 1.05, foot[1] + oz], 0.05, 0.05, RAIL)
    for (const t of [0, 0.5, 1]) box(out, top[0] + ox + dx * t, 0.65, top[1] + oz + dz * t, 0.025, 0.4, 0.025, RAIL, FIXED)
  }
}

/** an escalator pair in its granite-cheeked well: the dark well, two steel step bands, the balustrades */
function escalators(out: MeshBuilder, street: P, floor: P): void {
  const dx = floor[0] - street[0], dz = floor[1] - street[1], L = Math.hypot(dx, dz)
  const nx = -dz / L, nz = dx / L
  const granite = surfaceTag('granite'), metal = surfaceTag('metal')
  strut(out, [street[0], 0.45, street[1]], [floor[0], 0.45, floor[1]], 3.6, 0.04, VOID, FIXED)
  for (const s of [-0.85, 0.85]) {
    const ox = nx * s, oz = nz * s
    strut(out, [street[0] + ox, 0.53, street[1] + oz], [floor[0] + ox, 0.53, floor[1] + oz], 1.0, 0.06, [0.42, 0.43, 0.44], metal)
    // the balustrade either side of each band, its black handrail on top
    for (const e of [-0.6, 0.6]) {
      const bx = nx * (s + e), bz = nz * (s + e)
      strut(out, [street[0] + bx, 0.62, street[1] + bz], [floor[0] + bx, 0.62, floor[1] + bz], 0.12, 0.56, STEEL, metal)
      strut(out, [street[0] + bx, 0.95, street[1] + bz], [floor[0] + bx, 0.95, floor[1] + bz], 0.09, 0.08, [0.08, 0.08, 0.09], FIXED)
    }
  }
  for (const s of [-1, 1]) {
    const ox = nx * s * 2.0, oz = nz * s * 2.0
    for (const [a, b] of pieces([[street[0] + ox, street[1] + oz], [floor[0] + ox, floor[1] + oz]], 2.5)) {
      strut(out, [a[0], 0.45, a[1]], [b[0], 0.45, b[1]], 0.35, 0.9, GRANITE, granite)
      strut(out, [a[0], 1.12, a[1]], [b[0], 1.12, b[1]], 0.07, 0.06, RAIL)
    }
  }
}

/** the BART/Muni pylon: the champagne post, the blue BART panel, the red Muni band, the name on both faces */
function pylon(out: MeshBuilder, fit: Fit, x: number, z: number, heading: number, name: string): void {
  const metal = surfaceTag('metal')
  const fx = Math.sin(heading), fz = Math.cos(heading)
  const g = ground(fit, x, z)
  upright(out, fit, x, z, () => {
    prism(out, x, z, 0, 4.2, 0.32, 4, STEEL, metal)
    for (const s of [1, -1]) {
      box(out, x + fx * 0.25 * s, 3.55, z + fz * 0.25 * s, 0.24, 0.32, 0.24, BART_BLUE, EMIT)
      box(out, x + fx * 0.25 * s, 3.05, z + fz * 0.25 * s, 0.24, 0.1, 0.24, MUNI_RED, EMIT)
    }
  })
  // (signs are not draped with the mesh: they stand on the placement's level, so the ground goes into their height)
  for (const s of [1, -1]) {
    const px = x + fx * 0.5 * s, pz = z + fz * 0.5 * s, h = s > 0 ? heading : heading + Math.PI
    signText(out, 'BART', px, g + 3.55, pz, 0.2, WHITE, { lit: true, heading: h })
    signText(out, name, px, g + 2.3, pz, 0.22, [0.15, 0.16, 0.17], { heading: h })
  }
}

/** the concourse doors in the wall under the Market sidewalk, facing into the plaza (`heading`), with the lintel sign */
function concourseDoors(out: MeshBuilder, fit: Fit, x: number, z: number, heading: number, w: number): void {
  const granite = surfaceTag('granite'), glass = surfaceTag('glass'), metal = surfaceTag('metal')
  const fx = Math.sin(heading), fz = Math.cos(heading), tx = fz, tz = -fx
  // (u along the wall, y up, f out from its face into the plaza)
  const at = (u: number, y: number, f: number): [number, number, number] => [x + tx * u + fx * f, y, z + tz * u + fz * f]
  // the lintel stands as high as the parapet beside it, the doors 2.3 m under it
  const H = Math.max(2.8, streetOver(fit, [x, z], [-fx, -fz]) + 1.0)
  // (levelled on the floor just in front: half a metre behind the face the street's levelling has already begun)
  const g = ground(fit, x + fx * 0.6, z + fz * 0.6)
  upright(out, fit, x + fx * 0.6, z + fz * 0.6, () => {
    // the granite surround, proud of the wall: two jambs and the lintel
    for (const s of [-1, 1]) strut(out, at(s * (w / 2 + 0.3), 0, 0.2), at(s * (w / 2 + 0.3), H, 0.2), 0.6, 0.4, GRANITE, granite)
    strut(out, at(-w / 2 - 0.6, (2.3 + H) / 2, 0.2), at(w / 2 + 0.6, (2.3 + H) / 2, 0.2), 0.4, H - 2.3, GRANITE, granite)
    // the dark concourse behind, the glass doors and their steel frames
    strut(out, at(-w / 2, 1.15, 0.03), at(w / 2, 1.15, 0.03), 0.06, 2.3, VOID, FIXED)
    strut(out, at(-w / 2, 1.1, 0.12), at(w / 2, 1.1, 0.12), 0.03, 2.2, GLASS, glass)
    const n = Math.max(2, Math.round(w / 1.2))
    for (let k = 0; k <= n; k++) strut(out, at(-w / 2 + (k * w) / n, 0, 0.15), at(-w / 2 + (k * w) / n, 2.2, 0.15), 0.06, 0.06, STEEL, metal)
    strut(out, at(-w / 2, 2.22, 0.15), at(w / 2, 2.22, 0.15), 0.06, 0.08, STEEL, metal)
    const [bx, , bz] = at(w / 2 - 0.1, 0, 0.42)
    box(out, bx, (2.3 + H) / 2, bz, 0.2, 0.2, 0.02, BART_BLUE, EMIT)
  })
  // the station's name on the lintel, lit
  const [sx, , sz] = at(-0.4, 0, 0.42)
  signText(out, 'POWELL ST STATION', sx, g + (2.3 + H) / 2, sz, 0.26, WHITE, { lit: true, heading })
}

/** the 1997 accessible lift (Michael Willis): a square cage of perforated stainless on a steel frame, a glass door */
function lift(out: MeshBuilder, fit: Fit, x: number, z: number, heading: number, wall: number): void {
  const metal = surfaceTag('metal'), glass = surfaceTag('glass')
  const r = 1.35
  const fx = Math.sin(heading), fz = Math.cos(heading), tx = fz, tz = -fx
  const at = (u: number, f: number): [number, number] => [x + tx * u + fx * f, z + tz * u + fz * f]
  // it rises to the street's level and on above it, where the little footbridge from Market's sidewalk reaches it
  const deck = streetOver(fit, [x, z], [-fx, -fz], 9)
  // (the wall is the line x − z = `wall`; the bridge spans from the cage's back to over its cap)
  const span = (wall - (x - z)) / Math.SQRT2 - r + 0.4
  const H = Math.max(5.2, deck + 3.2)
  upright(out, fit, x, z, () => {
    for (const [u, f] of [[-r, -r], [r, -r], [r, r], [-r, r]]) {
      const [px, pz] = at(u, f)
      box(out, px, H / 2, pz, 0.09, H / 2, 0.09, STEEL, metal)
    }
    const sides: [P, P][] = [[[-r, -r], [r, -r]], [[r, -r], [r, r]], [[-r, r], [-r, -r]]]
    const bands = Math.round(H / 1.25)
    for (const [a, b] of sides) {
      const [ax, az] = at(a[0], a[1]), [bx, bz] = at(b[0], b[1])
      for (let k = 0; k < bands; k++) {
        const y0 = 0.1 + (k * (H - 0.1)) / bands, hh = (H - 0.1) / bands
        strut(out, [ax, y0 + hh / 2, az], [bx, y0 + hh / 2, bz], 0.05, hh - 0.1, PERF, metal)
        strut(out, [ax, y0 + hh, az], [bx, y0 + hh, bz], 0.08, 0.1, STEEL, metal)
      }
    }
    // the front to the plaza: the glass door at the bottom, perforated above
    const [l0x, l0z] = at(-r, r), [l1x, l1z] = at(r, r)
    strut(out, [l0x, 1.2, l0z], [l1x, 1.2, l1z], 0.04, 2.2, GLASS, glass)
    strut(out, [l0x, (2.4 + H) / 2, l0z], [l1x, (2.4 + H) / 2, l1z], 0.05, H - 2.4, PERF, metal)
    strut(out, [l0x, 2.35, l0z], [l1x, 2.35, l1z], 0.08, 0.1, STEEL, metal)
    box(out, x, H + 0.08, z, r + 0.15, 0.08, r + 0.15, STEEL, metal)
    const [sx, sz] = at(0, r + 0.06)
    box(out, sx, 2.75, sz, 0.28, 0.28, 0.03, BART_BLUE, EMIT)
    // the footbridge from the sidewalk (OSM way/772812595), at the street's level, out of the back toward Market
    if (deck > 0.5) {
      const [f0x, f0z] = at(0, -r), [f1x, f1z] = at(0, -r - span)
      strut(out, [f0x, deck - 0.12, f0z], [f1x, deck - 0.12, f1z], 1.6, 0.24, GRANITE, surfaceTag('concrete'))
      for (const s of [-1, 1]) {
        const ox = tx * s * 0.8, oz = tz * s * 0.8
        strut(out, [f0x + ox, deck + 0.95, f0z + oz], [f1x + ox, deck + 0.95, f1z + oz], 0.06, 0.06, RAIL)
        for (const t of [0, 0.5, 1]) box(out, f0x + ox + (f1x - f0x) * t, deck + 0.5, f0z + oz + (f1z - f0z) * t, 0.03, 0.45, 0.03, RAIL, FIXED)
      }
    }
  })
}

/** the coffee kiosk on the floor (OSM way/128478751, Cable Car Coffee), its walls painted with murals */
function kiosk(out: MeshBuilder, fit: Fit): void {
  const stucco = surfaceTag('stucco')
  const c: P = [19, 23.6], hx = 3.9, hz = 1.35, rot = Math.atan2(2, 8)
  const ux = Math.cos(rot), uz = Math.sin(rot), nx = -uz, nz = ux
  const at = (u: number, v: number): [number, number] => [c[0] + ux * u + nx * v, c[1] + uz * u + nz * v]
  upright(out, fit, c[0], c[1], () => {
    const [a0x, a0z] = at(-hx, 0), [a1x, a1z] = at(hx, 0)
    strut(out, [a0x, 1.4, a0z], [a1x, 1.4, a1z], hz * 2, 2.8, [0.36, 0.5, 0.68], stucco)
    strut(out, [a0x - ux * 0.2, 2.88, a0z - uz * 0.2], [a1x + ux * 0.2, 2.88, a1z + uz * 0.2], hz * 2 + 0.4, 0.16, [0.2, 0.2, 0.22], FIXED)
    // the murals: big loose panels of colour on both long faces
    const MURAL: Rgb[] = [[0.95, 0.6, 0.18], [0.9, 0.3, 0.45], [0.25, 0.7, 0.62], [0.98, 0.85, 0.3], [0.55, 0.38, 0.8], [0.35, 0.78, 0.35]]
    for (const s of [-1, 1]) {
      for (let k = 0; k < 6; k++) {
        const u0 = -hx + 0.2 + k * ((2 * hx - 0.4) / 6)
        const [p0x, p0z] = at(u0, s * (hz + 0.02)), [p1x, p1z] = at(u0 + (2 * hx - 0.4) / 6, s * (hz + 0.02))
        strut(out, [p0x, 0.4 + (k % 2) * 0.3 + 0.9, p0z], [p1x, 0.4 + (k % 2) * 0.3 + 0.9, p1z], 0.02, 1.5 + (k % 3) * 0.3, MURAL[(k + (s > 0 ? 0 : 3)) % 6], EMIT)
      }
    }
    // the serving hatch on the plaza (south) side
    const [h0x, h0z] = at(-1.2, -hz - 0.04), [h1x, h1z] = at(1.2, -hz - 0.04)
    strut(out, [h0x, 1.5, h0z], [h1x, 1.5, h1z], 0.02, 0.9, VOID, FIXED)
  })
}

export function hallidiePlaza(out: MeshBuilder, fit: Fit): void {
  const brick = surfaceTag('brick')
  // the floors: all of it brick, the sunken parts darker and 8 cm over it (no shimmer between them)
  capPolygonWithHoles(out, [ring(EAST_ALL)], 0.08, BRICK, brick, 2.4, 2.5)
  capPolygonWithHoles(out, [ring(WEST_ALL)], 0.08, BRICK, brick, 2.4, 2.5)
  capPolygonWithHoles(out, [ring(EAST_LOW)], 0.16, BRICK_LOW, brick, 2.4, 2.5)
  capPolygonWithHoles(out, [ring(WEST_LOW)], 0.16, BRICK_LOW, brick, 2.4, 2.5)
  for (const r of RIMS) rim(out, fit, r.line, r.side, r.reach, r.T, r.curb)
  for (const p of PLANTERS) planter(out, p)
  for (const [t, f, w] of FLIGHTS) flight(out, t, f, w)
  for (const [s, f] of ESCALATORS) escalators(out, s, f)
  // the concourse doors (OSM subway_entrance A1 and its steps, ways 184564852 and 184564851) in the Market wall, facing
  // north-west into the plaza; the lift in front of the first
  const NW = -Math.PI / 4
  concourseDoors(out, fit, 24.8, 7.2, NW, 4.2)
  concourseDoors(out, fit, 35.8, 18.2, NW, 4.2)
  lift(out, fit, 27.2, 13.4, NW, 17.6)
  kiosk(out, fit)
  // the pylons on the sidewalk at the two corners, the Cyril Magnin end and the escalators' head, facing Market
  pylon(out, fit, 16.5, -4.8, (3 * Math.PI) / 4, 'POWELL')
  pylon(out, fit, 51.5, 30.5, (3 * Math.PI) / 4, 'POWELL')
}

export const HALLIDIE_PLAZA: Record<string, (out: MeshBuilder, fit: Fit) => void> = { hallidiePlaza }
