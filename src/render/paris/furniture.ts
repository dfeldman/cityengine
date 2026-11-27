/**
 * Paris's pavement furniture, the pieces every street has (owner, 2026-11-03: "put some cycles into Paris street
 * furniture… try to make it more paris-y"): the Haussmann candelabra, the Davioud bench, the Decaux bus shelter and
 * RATP's stop post, the horodateur, the sucette ad panel, the tree pits and the planters. The Vélib' rows
 * (render/models.ts velibStation) stay as they were, by the owner's word; the Wallace fountain keeps its stand-in
 * until the owner's GLB arrives (2026-11-03: "on the wallace fountain, i'll provide a glb").
 *
 * Local frames as render/city.ts places them: +z along the street, the foot at the origin on the pavement. In the
 * lamp loop's slots local +x points AWAY from the road, over the pavement, so a console arm that should hang over the
 * kerb reaches to −x; the bench is long in x and faces +z, which its placer turns toward the road.
 */
import { affiche, AFFICHE_LIFT } from '../affiches.ts'
import { topiaryBall } from '../topiary.ts'
import type { MeshBuilder } from '../buildings.ts'
import { box, EMIT, FIXED, LAMP_LIGHTS, lathe, member, prism, slab, strut, tube, type Rgb } from '../models.ts'

/** the dark green-black the city paints its iron ("vert wagon") */
const IRON: Rgb = [0.1, 0.14, 0.12]
const PARIS_GREEN: Rgb = [0.16, 0.27, 0.21]
const ANTHRACITE: Rgb = [0.2, 0.21, 0.22]
const WHITE: Rgb = [0.94, 0.94, 0.92]

const hash = (seed: number, k: number): number => ((Math.imul((seed ^ Math.imul(k, 0x9e3779b1)) >>> 0, 0x85ebca6b) >>> 0) % 1000) / 1000

/*
 * THE CANDELABRA (owner, 2026-10-30: lamp posts are "a key part of the city's look"). Haussmann's is a cast-iron
 * column: an octagonal plinth, the swell of the base tapering into a fluted shaft, collars, a capital, and the Paris
 * lantern — glass widening upward inside four corner mullions, a flared brim, a pyramidal hat and a finial. Built
 * with lathe/tube (smooth-shaded, so eight sides read round); every figure below is tunable.
 */
const IRON_G: Rgb = [0.12, 0.165, 0.14]
const GLASS: Rgb = [0.95, 0.88, 0.72]
/** lantern dimensions at scale 1 (metres): glass height, corner radius at the bottom / top, brim, hat, finial */
const LN = { base: 0.07, glass: 0.58, r0: 0.145, r1: 0.215, brimR: 0.29, brimH: 0.06, hat: 0.2, fin: 0.14, mull: 0.011 }
/** lantern's overall height at scale 1 */
const LN_H = LN.base + LN.glass + LN.brimH + LN.hat + LN.fin
const COL = { top: 6.75, shaftR0: 0.085, shaftR1: 0.058 }

/** the Paris lantern, base plate at y; `full` false drops the corner mullions (distant / hanging lanterns) */
function lanternParis(out: MeshBuilder, x: number, y: number, z: number, scale = 1, full = true): void {
  const s = scale, q = Math.PI / 4
  const yb = y + LN.base * s, yg = yb + LN.glass * s, yh = yg + LN.brimH * s, yt = yh + LN.hat * s
  lathe(out, x, z, [[0.1 * s, y], [LN.r0 * s * 1.15, y + 0.02 * s], [LN.r0 * s * 1.15, yb]], 4, IRON_G, FIXED, { phase: q, capBottom: full })
  lathe(out, x, z, [[LN.r0 * s, yb], [LN.r1 * s, yg]], 4, GLASS, EMIT, { phase: q, hard: true })
  lathe(out, x, z, [[LN.r1 * s * 1.05, yg], [LN.brimR * s, yg + 0.02 * s], [LN.brimR * s, yh]], 4, IRON_G, FIXED, { phase: q })
  lathe(out, x, z, [[LN.brimR * s * 0.88, yh], [0.045 * s, yt]], 4, IRON_G, FIXED, { phase: q })
  lathe(out, x, z, full ? [[0.05 * s, yt], [0.028 * s, yt + 0.03 * s], [0.04 * s, yt + 0.07 * s], [0.0, yt + LN.fin * s]] : [[0.04 * s, yt], [0.0, yt + LN.fin * s]], 3, IRON_G, FIXED)
  if (full) for (let k = 0; k < 4; k++) {
    const a = q + k * Math.PI / 2, sn = Math.sin(a), cs = Math.cos(a)
    tube(out, [[x + sn * LN.r0 * s, yb, z + cs * LN.r0 * s], [x + sn * LN.r1 * s, yg, z + cs * LN.r1 * s]], LN.mull * 1.6 * s, 3, IRON_G)
  }
}

/** the cast-iron column from the pavement to the lantern's seat at `top` */
function column(out: MeshBuilder, top: number): void {
  const R0 = COL.shaftR0, R1 = COL.shaftR1
  // plinth, swelling bulb, and the taper into the shaft (eight sides: it is the part at eye height)
  lathe(out, 0, 0, [
    [0.33, 0], [0.33, 0.12], [0.25, 0.16], [0.25, 0.32],      // octagonal plinth, its moulded top
    [0.2, 0.4], [0.23, 0.62], [0.1, 1.2],                     // the bulb and its taper
    [0.13, 1.3],                                               // base collar
  ], 8, IRON_G, FIXED)
  // the fluted-look shaft with its mid-height collar (six sides, smooth: reads round beyond a few metres)
  lathe(out, 0, 0, [[R0, 1.3], [R0 * 0.92, 3.4], [0.115, 3.4], [0.115, 3.5], [R1, 3.58], [R1 * 0.85, top - 0.5]], 6, IRON_G, FIXED)
  // capital: ring, neck, swell, seat
  lathe(out, 0, 0, [[R1 * 0.85, top - 0.5], [0.1, top - 0.46], [0.1, top - 0.4], [0.07, top - 0.34], [0.12, top - 0.2], [0.12, top - 0.1], [0.17, top - 0.1], [0.17, top]], 6, IRON_G, FIXED)
}

/** the boulevard candelabra with its lantern on top */
export function parisLamp(out: MeshBuilder): void {
  column(out, COL.top)
  lanternParis(out, 0, COL.top, 0, 1)
}
LAMP_LIGHTS.set(parisLamp, [{ at: [0, COL.top + 0.4, 0] }])

/**
 * The same lamp with flyers taped round its shaft at eye height — a lost cat, a guitar teacher (owner, 2026-11-27:
 * "work on the flyers"). A5 sheets: a letter-size one would stand off the 17 cm shaft like a card. The placer swaps it
 * in for one lamp in TAPED_EVERY.
 */
export const TAPED = { every: 4, hw: 0.074, hh: 0.1, y: 1.55 }
export function parisLampTaped(out: MeshBuilder): void {
  parisLamp(out)
  for (let i = 0; i < 2; i++) {
    const a = 0.9 + i * 2.6, r = COL.shaftR0 + 0.008
    affiche(out, 'flyer', Math.sin(a) * r, TAPED.y + i * 0.24, Math.cos(a) * r, Math.sin(a), Math.cos(a), TAPED.hw, TAPED.hh, 11 + i, false).tilt = i ? -0.06 : 0.09
  }
}
LAMP_LIGHTS.set(parisLampTaped, [{ at: [0, COL.top + 0.4, 0] }])

/**
 * The avenue's candelabra: the same column, a lantern on top and two crook arms, a lantern hanging from each — the
 * Rivoli pattern, where the pavement is wide enough that a single top lantern leaves the kerb dark.
 */
export function parisLampConsole(out: MeshBuilder): void {
  const top = 7.1, hs = 0.8
  column(out, top)
  lanternParis(out, 0, top, 0, 0.85)
  for (const s of [-1, 1]) {
    // swan neck: up out of the shaft, over, and down onto the lantern's hook
    const hang = top - 1.75, hy = hang + LN_H * hs + 0.03
    tube(out, [[0, top - 1.2, 0], [s * 0.4, top - 0.9, 0], [s * 0.95, top - 0.72, 0], [s * 1.25, top - 0.95, 0], [s * 1.3, hy, 0]],
      [0.06, 0.045, 0.038, 0.034, 0.025], 5, IRON_G)
    // the scroll under the arm
    tube(out, [[s * 0.1, top - 1.65, 0], [s * 0.45, top - 1.4, 0], [s * 0.62, top - 1.05, 0], [s * 0.5, top - 0.9, 0], [s * 0.4, top - 1.0, 0]], 0.026, 3, IRON_G)
    lanternParis(out, s * 1.3, hang, 0, hs, false)
  }
}
LAMP_LIGHTS.set(parisLampConsole, [{ at: [0, 7.1 + 0.35, 0] }, { at: [-1.3, 5.4, 0] }, { at: [1.3, 5.4, 0] }])

/**
 * The wall console of the narrow rues. Frame: origin at the wall plate's centre, +z away from the wall; the placer
 * sets the height. A scrolled bracket with a diagonal brace, the lantern standing on its end.
 */
/** the whole console's size (1 = the first cut, whose 0.78-scale lantern read as a speck on a six-storey facade) */
const WALL_S = 1.3
export function parisWallLamp(out: MeshBuilder): void {
  const S = WALL_S, ls = 0.78 * S, out1 = 0.8 * S
  const P = (y: number, z: number): [number, number, number] => [0, y * S, z * S]
  box(out, 0, 0, 0.02, 0.05 * S, 0.14 * S, 0.02, IRON_G, FIXED)          // the wall plate
  // the arm: out from the plate, a slight rise, ending in a seat
  tube(out, [P(0.1, 0.04), P(0.11, 0.3), P(0.12, 0.6), P(0.12, 0.8)], 0.02 * S, 5, IRON_G)
  lathe(out, 0, out1, [[0.1 * S, 0.1 * S], [0.1 * S, 0.12 * S], [0.07 * S, 0.13 * S]], 6, IRON_G, FIXED, { capBottom: true })
  // the diagonal brace ending in a curl against the arm
  tube(out, [P(-0.2, 0.04), P(-0.12, 0.2), P(-0.02, 0.4), P(0.07, 0.56), P(0.04, 0.64), P(-0.02, 0.6)], 0.022 * S, 4, IRON_G)
  lanternParis(out, 0, 0.13 * S, out1, ls, true)
}
LAMP_LIGHTS.set(parisWallLamp, [{ at: [0, (0.13 + LN_H * 0.78 * 0.5) * WALL_S, 0.8 * WALL_S] }])

/*
 * THE DAVIOUD BENCH: Paris's pavement bench since the 1850s. Two broad slats on the seat and two raked up the back,
 * painted the city's green, on a pair of cast-iron end frames whose legs curve out to their feet; no arms. 1.8 m long,
 * seat 0.45 m up. Long in x, the sitter's back to −z.
 */
export function parisBench(out: MeshBuilder): void {
  const greens: Rgb[] = [[0.13, 0.27, 0.19], [0.12, 0.25, 0.18], [0.14, 0.28, 0.2], [0.12, 0.26, 0.19]]
  const L = 0.9
  box(out, 0, 0.45, 0.17, L, 0.02, 0.075, greens[0], FIXED)
  box(out, 0, 0.445, -0.03, L, 0.02, 0.075, greens[1], FIXED)
  // the back, raked 17°: positive tilt leans a slab's top toward −z
  slab(out, 0, 0.64, -0.195, L, 0.075, 0.02, 0.3, greens[2])
  slab(out, 0, 0.84, -0.256, L, 0.075, 0.02, 0.3, greens[3])
  for (const x of [-0.82, 0.82]) {
    member(out, x, [[0.31, 0.0], [0.27, 0.2], [0.21, 0.42]], 0.05, 0.045, IRON)                     // the front leg
    member(out, x, [[-0.34, 0.0], [-0.28, 0.2], [-0.16, 0.42]], 0.05, 0.045, IRON)                  // the rear leg
    member(out, x, [[0.28, 0.43], [-0.2, 0.43]], 0.05, 0.035, IRON)                                 // the seat rail
    member(out, x, [[-0.16, 0.43], [-0.2, 0.6], [-0.27, 0.8], [-0.3, 0.97]], 0.05, 0.04, IRON)     // the back's upright
    box(out, x, 0.012, 0.32, 0.04, 0.012, 0.06, IRON, FIXED)
    box(out, x, 0.012, -0.35, 0.04, 0.012, 0.06, IRON, FIXED)
  }
  box(out, 0, 0.13, -0.02, L - 0.08, 0.012, 0.012, IRON, FIXED)                                      // the stretcher
}

/**
 * The Wallace fountain, as it was: a stand-in until the owner's GLB (2026-11-03, "i'll provide a glb") takes its
 * place through the statue pool (render/statues.ts).
 */
export function wallaceFountain(out: MeshBuilder): void {
  const g = PARIS_GREEN
  prism(out, 0, 0, 0, 0.35, 0.45, 8, g)
  prism(out, 0, 0, 0.35, 0.95, 0.3, 8, g, FIXED, 0.26)
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4
    prism(out, Math.sin(a) * 0.2, Math.cos(a) * 0.2, 0.95, 1.95, 0.06, 6, g)     // the caryatids
  }
  prism(out, 0, 0, 1.95, 2.15, 0.36, 8, g)
  prism(out, 0, 0, 2.15, 2.55, 0.34, 8, g, FIXED, 0.08)                          // the dome
  prism(out, 0, 0, 2.55, 2.72, 0.05, 6, g, FIXED, 0.0)                           // the finial
}

/** An ad from the library (render/affiches.ts): the 2 m² sheet, or the 8 m² panel's landscape, facing `dir` (±z) */
function poster(out: MeshBuilder, cx: number, cy: number, cz: number, hw: number, hh: number, dir: 1 | -1, seed: number): void {
  affiche(out, hw / hh > 1.2 ? 'landscape' : 'portrait', cx, cy, cz + dir * AFFICHE_LIFT, 0, dir, hw, hh, seed)
}

/**
 * THE BUS SHELTER (JCDecaux's 2015 design for RATP; owner, 2026-10-30: along the kerb, open to the road): an anthracite
 * frame, the flat roof with the stop's name in white on a dark band along its front, the glass back with its frit band,
 * the route-map panel at one end and the lit poster at the other, a grey slatted bench. Long in x, the back at −z,
 * open to +z; RATP's post past the open end. Without a shelter, the post alone.
 */
export function parisBusStop(out: MeshBuilder, shelter = true, seed = 0): void {
  if (!shelter) { ratpPost(out, 0, 0, seed); return }
  const glass: Rgb = [0.6, 0.68, 0.72]
  const frit: Rgb = [0.72, 0.74, 0.74]
  box(out, 0, 2.52, -0.12, 1.85, 0.05, 0.85, ANTHRACITE, FIXED)
  // the name band along the roof's front edge, a white block of "lettering" on it
  box(out, 0, 2.66, 0.7, 1.4, 0.12, 0.025, ANTHRACITE, FIXED)
  box(out, -0.3, 2.68, 0.73, 0.65, 0.045, 0.006, WHITE, FIXED)
  box(out, 0.9, 2.66, 0.73, 0.14, 0.08, 0.006, [0.95, 0.82, 0.1], FIXED)
  for (const x of [-1.78, 0, 1.78]) box(out, x, 1.25, -0.9, 0.04, 1.25, 0.04, ANTHRACITE, FIXED)
  for (const x of [-1.78, 1.78]) box(out, x, 1.25, 0.6, 0.035, 1.25, 0.035, ANTHRACITE, FIXED)
  box(out, 0, 1.4, -0.93, 1.74, 1.0, 0.012, glass, FIXED)
  box(out, 0, 1.05, -0.95, 1.74, 0.03, 0.004, frit, FIXED)
  // the route map at −x: a dark panel, the pale map on its inner face
  box(out, -1.78, 1.3, -0.15, 0.03, 0.95, 0.7, ANTHRACITE, FIXED)
  box(out, -1.74, 1.4, -0.15, 0.005, 0.7, 0.55, [0.9, 0.9, 0.86], FIXED)
  box(out, -1.74, 1.4, -0.15, 0.007, 0.5, 0.4, [0.78, 0.84, 0.9], FIXED)
  // the poster at +x, lit, both faces; the panel is turned across the shelter, its faces to ±x
  box(out, 1.78, 1.45, -0.15, 0.05, 0.95, 0.68, ANTHRACITE, FIXED)
  for (const d of [1, -1] as const) affiche(out, 'portrait', 1.78 + d * (0.05 + AFFICHE_LIFT), 1.45, -0.15, d, 0, 0.58, 0.86, seed + d)
  // the bench: grey slats on two brackets off the back
  for (const z of [-0.74, -0.58]) box(out, 0.1, 0.47, z, 1.1, 0.025, 0.06, [0.5, 0.52, 0.52], FIXED)
  for (const x of [-0.7, 0.9]) {
    box(out, x, 0.24, -0.84, 0.03, 0.24, 0.03, ANTHRACITE, FIXED)
    box(out, x, 0.45, -0.7, 0.03, 0.015, 0.16, ANTHRACITE, FIXED)
  }
  ratpPost(out, 2.3, 0.3, seed)
}

/**
 * RATP's stop post: a grey pole and, at the top, a flat flag turned across the street (its faces to ±x): the stop's
 * name in white, the route numbers in their colours in a row, the bus pictogram's teal square.
 */
function ratpPost(out: MeshBuilder, x: number, z: number, seed: number): void {
  const LINES: Rgb[] = [[0.0, 0.62, 0.52], [0.95, 0.82, 0.1], [0.84, 0.22, 0.2], [0.2, 0.42, 0.72], [0.9, 0.55, 0.12], [0.55, 0.3, 0.6], [0.45, 0.72, 0.25]]
  box(out, x, 1.45, z, 0.035, 1.45, 0.035, [0.45, 0.47, 0.49], FIXED)
  box(out, x, 2.75, z, 0.02, 0.32, 0.26, ANTHRACITE, FIXED)
  const n = 2 + Math.floor(hash(seed, 5) * 2)
  for (const sx of [-1, 1]) {
    box(out, x + sx * 0.024, 2.96, z, 0.003, 0.05, 0.22, WHITE, FIXED)
    box(out, x + sx * 0.024, 2.62, z - 0.16, 0.003, 0.08, 0.08, [0.0, 0.62, 0.52], FIXED)
    for (let i = 0; i < n; i++) {
      const c = LINES[Math.floor(hash(seed, 7 + i) * LINES.length)]
      box(out, x + sx * 0.024, 2.62, z - 0.02 + i * 0.13, 0.003, 0.055, 0.055, c, FIXED)
      box(out, x + sx * 0.028, 2.62, z - 0.02 + i * 0.13, 0.002, 0.025, 0.03, WHITE, FIXED)
    }
  }
}

/**
 * THE HORODATEUR, the parking pay station every Paris street with a parking lane has: a slim dark grey column, 1.7 m,
 * its head sloped back with the screen and the keypad on the pavement side (+x), the small blue P over it. The nearest
 * thing a Paris pavement has to a vending machine (owner, 2026-11-03: "newsstands/vending machines").
 */
export function horodateur(out: MeshBuilder): void {
  const body: Rgb = [0.3, 0.31, 0.32]
  const dark: Rgb = [0.12, 0.13, 0.14]
  box(out, 0, 0.04, 0, 0.17, 0.04, 0.12, dark, FIXED)
  box(out, 0, 0.8, 0, 0.14, 0.72, 0.1, body, FIXED)
  // the head leans back from the user: a wedge of slabs
  slab(out, 0, 1.68, -0.02, 0.16, 0.18, 0.12, 0, body)
  box(out, 0.165, 1.72, 0, 0.004, 0.09, 0.09, dark, FIXED)                 // the screen
  box(out, 0.165, 1.56, 0, 0.004, 0.04, 0.08, [0.75, 0.75, 0.73], FIXED)   // the keypad
  box(out, 0.165, 1.2, 0, 0.004, 0.06, 0.07, [0.1, 0.5, 0.3], FIXED)       // the card reader's green
  box(out, 0, 1.98, 0, 0.012, 0.12, 0.012, body, FIXED)
  box(out, 0, 2.18, 0, 0.11, 0.11, 0.015, [0.1, 0.3, 0.68], FIXED)         // the P plate
  box(out, 0, 2.18, 0, 0.035, 0.07, 0.018, WHITE, FIXED)
}

/**
 * THE SUCETTE (owner, 2026-11-03, with photographs of two: "here are some panel ads"): the 2 m² panel, 1.2 × 1.76 m of
 * poster in a dark frame with a flat cap, a face each way along the pavement (±z). Two kinds by seed —
 * - the low one (Clear Channel's), the frame standing almost on the pavement on a short fluted base;
 * - the tall one (Cityz's), high on a fluted dark green column over a plain base block, the city's medallion on the column.
 */
export function sucette(out: MeshBuilder, seed = 0): void {
  const frame: Rgb = [0.2, 0.23, 0.22]
  const tall = hash(seed, 9) < 0.4
  const fluted = (y0: number, y1: number, hx: number, hz: number): void => {
    box(out, 0, (y0 + y1) / 2, 0, hx, (y1 - y0) / 2, hz, frame, FIXED)
    // the flutes: ribs down each face
    for (const s of [-1, 1]) {
      for (let i = 0; i < 4; i++) box(out, -hx + (i + 0.5) * (hx * 2 / 4), (y0 + y1) / 2, s * (hz + 0.008), 0.012, (y1 - y0) / 2 - 0.02, 0.008, [0.26, 0.3, 0.28], FIXED)
      for (let i = 0; i < 3; i++) box(out, s * (hx + 0.008), (y0 + y1) / 2, -hz + (i + 0.5) * (hz * 2 / 3), 0.008, (y1 - y0) / 2 - 0.02, 0.012, [0.26, 0.3, 0.28], FIXED)
    }
  }
  const y = tall ? 2.95 : 1.3                                    // the panel's centre
  if (tall) {
    box(out, 0, 0.42, 0, 0.17, 0.42, 0.13, frame, FIXED)         // the base block
    fluted(0.84, 2.07, 0.14, 0.1)
    box(out, 0, 1.7, 0.115, 0.07, 0.07, 0.01, [0.32, 0.36, 0.33], FIXED)   // the medallion, both faces
    box(out, 0, 1.7, -0.115, 0.07, 0.07, 0.01, [0.32, 0.36, 0.33], FIXED)
  } else {
    fluted(0, 0.34, 0.6, 0.08)
  }
  box(out, 0, y, 0, 0.7, 0.98, 0.07, frame, FIXED)
  box(out, 0, y + 1.02, 0, 0.74, 0.04, 0.1, frame, FIXED)        // the cap
  poster(out, 0, y, 0.07, 0.6, 0.88, 1, seed)
  poster(out, 0, y, -0.07, 0.6, 0.88, -1, seed + 1)
}

/**
 * THE TREE PIT: the square cast-iron grate flush with the pavement round every street tree, and on the young ones
 * the corset — a ring of iron bars that guards the trunk. Two quads for the grate; the corset only where asked.
 */
export function treePit(guard: boolean): (out: MeshBuilder) => void {
  return (out) => {
    const grate: Rgb = [0.14, 0.15, 0.15]
    const H = 0.012
    out.quad([[-0.75, H, -0.75], [-0.75, H, 0.75], [0.75, H, 0.75], [0.75, H, -0.75]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], grate, FIXED)
    out.quad([[-0.55, H + 0.004, -0.55], [-0.55, H + 0.004, 0.55], [0.55, H + 0.004, 0.55], [0.55, H + 0.004, -0.55]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], [0.2, 0.21, 0.2], FIXED)
    if (!guard) return
    const R = 0.36
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 6
      strut(out, [Math.sin(a) * R, 0.01, Math.cos(a) * R], [Math.sin(a) * R, 1.65, Math.cos(a) * R], 0.022, 0.022, IRON, FIXED, false)
    }
    for (const y of [0.35, 1.55]) prism(out, 0, 0, y, y + 0.03, R + 0.012, 8, IRON, FIXED, R + 0.012, false)
  }
}

/** A round of leaves: a clipped shrub as a short flaring prism under a taper, 8 sides */
function shrub(out: MeshBuilder, x: number, y: number, z: number, r: number, h: number, c: Rgb): void {
  prism(out, x, z, y, y + h * 0.45, r * 0.75, 8, c, FIXED, r, false)
  prism(out, x, z, y + h * 0.45, y + h, r, 8, c, FIXED, r * 0.3)
}

/**
 * THE JARDINIÈRE: the city's pavement planter — the long box in the municipal green or in raw concrete, 1.2 × 0.5,
 * clipped box balls and a lavender or a flowering shrub in it. Long along the street (z).
 */
export function jardiniere(out: MeshBuilder, seed = 0): void {
  const green = hash(seed, 1) < 0.6
  const body: Rgb = green ? PARIS_GREEN : [0.62, 0.61, 0.58]
  const trim: Rgb = green ? IRON : [0.55, 0.54, 0.51]
  box(out, 0, 0.3, 0, 0.26, 0.3, 0.62, body, FIXED)
  box(out, 0, 0.6, 0, 0.28, 0.02, 0.64, trim, FIXED)
  box(out, 0, 0.6, 0, 0.22, 0.012, 0.56, [0.22, 0.17, 0.12], FIXED)
  const leaves: Rgb[] = [[0.2, 0.36, 0.17], [0.26, 0.42, 0.2], [0.42, 0.46, 0.34], [0.16, 0.3, 0.16]]
  for (let i = 0; i < 3; i++) {
    const z = -0.4 + i * 0.4
    const k = hash(seed, 3 + i)
    if (k < 0.55) shrub(out, 0, 0.6, z, 0.2 + k * 0.1, 0.42, leaves[Math.floor(hash(seed, 9 + i) * leaves.length)])
    else {
      // lavender: a grey-green mound with its spikes
      shrub(out, 0, 0.6, z, 0.22, 0.3, [0.46, 0.52, 0.4])
      for (let j = 0; j < 5; j++) box(out, (hash(seed, 20 + i * 5 + j) - 0.5) * 0.3, 1.0, z + (hash(seed, 40 + i * 5 + j) - 0.5) * 0.3, 0.012, 0.07, 0.012, [0.48, 0.38, 0.68], FIXED)
    }
  }
  if (hash(seed, 2) < 0.4) for (let j = 0; j < 6; j++) box(out, (hash(seed, 60 + j) - 0.5) * 0.4, 0.86 + hash(seed, 70 + j) * 0.1, (hash(seed, 80 + j) - 0.5) * 1.1, 0.03, 0.03, 0.03, [[0.95, 0.3, 0.3], [0.98, 0.8, 0.2], [0.9, 0.9, 0.88]][j % 3] as Rgb, FIXED)
}

/** A box ball in its pot, the planter a café stands at the ends of its terrace: a terracotta or dark pot, the clipped ball over it */
export function boxwoodPot(out: MeshBuilder, seed = 0): void {
  const pot: Rgb = hash(seed, 1) < 0.5 ? [0.62, 0.38, 0.26] : [0.14, 0.15, 0.15]
  prism(out, 0, 0, 0, 0.42, 0.2, 8, pot, FIXED, 0.25, false)
  prism(out, 0, 0, 0.42, 0.47, 0.27, 8, pot, FIXED, 0.27)
  prism(out, 0, 0, 0.46, 0.475, 0.22, 8, [0.22, 0.17, 0.12])
  topiaryBall(out, 0, 0.45, 0, 0.3, hash(seed, 2) < 0.7 ? [0.18, 0.34, 0.16] : [0.26, 0.42, 0.2], { seed, sink: 0 })
}

/**
 * THE LA POSTE BOX, the yellow post box of every Paris street (owner, 2026-11-03: the bake had 1,618 and Paris drew none):
 * a yellow box on its grey post, its top rounded over, the slot and its lip in the front (+x), the blue plate with the
 * bird under it. 1.3 m to the top.
 */
export function laPosteBox(out: MeshBuilder): void {
  const yellow: Rgb = [1.0, 0.85, 0.12]
  const blue: Rgb = [0.1, 0.24, 0.55]
  box(out, 0, 0.03, 0, 0.12, 0.03, 0.12, ANTHRACITE, FIXED)
  box(out, 0, 0.42, 0, 0.05, 0.4, 0.05, [0.45, 0.46, 0.47], FIXED)
  box(out, 0, 1.02, 0, 0.19, 0.22, 0.24, yellow, FIXED)
  // the top: rounded over front to back, as a prism on its side would be; in three slabs
  slab(out, 0, 1.27, 0, 0.19, 0.03, 0.22, 0, yellow)
  slab(out, 0, 1.3, 0, 0.17, 0.02, 0.17, 0, yellow)
  box(out, 0.192, 1.14, 0, 0.006, 0.02, 0.15, [0.08, 0.08, 0.09], FIXED)                 // the slot
  box(out, 0.2, 1.17, 0, 0.012, 0.012, 0.17, yellow, FIXED)                              // its lip
  box(out, 0.194, 0.96, 0, 0.004, 0.08, 0.13, blue, FIXED)
  box(out, 0.198, 0.96, 0, 0.003, 0.035, 0.06, yellow, FIXED)                           // the bird
  box(out, 0.194, 0.86, 0, 0.004, 0.012, 0.13, [0.92, 0.92, 0.9], FIXED)                // the collection times
}

/**
 * A PARIS AD PANEL, the 8 m² "senior" on one post (the billboard OSM maps on the ground or a pole; owner, 2026-11-03:
 * "tons of advertisement stands… some flat"): an anthracite frame 3.4 × 2.4 m, its foot 2.3 m up on a single column, a
 * poster each way (±z), the lamp hood along the top. Across the pavement, as the sucette stands.
 */
export function parisPanel(out: MeshBuilder, seed = 0): void {
  box(out, 0, 1.2, 0, 0.12, 1.2, 0.12, ANTHRACITE, FIXED)
  box(out, 0, 3.5, 0, 1.75, 1.25, 0.09, ANTHRACITE, FIXED)
  box(out, 0, 4.8, 0, 1.6, 0.04, 0.2, ANTHRACITE, FIXED)                                  // the lamp hood
  poster(out, 0, 3.5, 0.09, 1.6, 1.2, 1, seed)
  poster(out, 0, 3.5, -0.09, 1.6, 1.2, -1, seed + 3)
}

/**
 * THE CAFÉ BOARD (owner, 2026-11-03, with a photograph: "chalkboards in front of cafes - many have a chalkboard menus"):
 * the A-frame on the pavement by a terrace — two leaves splayed at the foot, each a frame with its header panel and,
 * by seed, the slate with the day's menu chalked on it or a printed poster. 0.65 × 1.1 m; its faces to ±z.
 */
export function cafeBoard(out: MeshBuilder, seed = 0): void {
  const white = hash(seed, 1) < 0.5
  const frame: Rgb = white ? [0.9, 0.9, 0.88] : [0.12, 0.12, 0.13]
  const slate = hash(seed, 2) < 0.65
  const T = 0.2                                                      // the splay of each leaf, radians
  for (const s of [1, -1] as const) {
    const t = s * T
    // a point on the leaf, `v` up it and `d` out from its face: the leaf leans from its foot at z = ±0.2 to the top at z 0
    const z0 = s * 0.2
    const at = (v: number, d: number): [number, number] => [v * Math.cos(T) + 0, z0 - s * v * Math.sin(T) + s * d * Math.cos(T)]
    const [cy, cz] = at(0.56, 0)
    slab(out, 0, cy, cz, 0.33, 0.56, 0.015, t, frame)
    const [fy, fz] = at(0.5, 0.018)
    slab(out, 0, fy, fz, 0.27, 0.4, 0.004, t, slate ? [0.1, 0.12, 0.11] : COLOURS[Math.floor(hash(seed, 3 + (s > 0 ? 0 : 1)) * COLOURS.length)])
    const [hy, hz] = at(1.0, 0.018)
    slab(out, 0, hy, hz, 0.27, 0.06, 0.004, t, white ? [0.25, 0.22, 0.2] : [0.92, 0.9, 0.84])  // the header, with the café's name
    if (slate) for (let k = 0; k < 6; k++) {
      const [ly, lz] = at(0.78 - k * 0.11, 0.024)
      slab(out, -0.05 + (hash(seed, 10 + k) - 0.5) * 0.08, ly, lz, 0.12 + hash(seed, 20 + k) * 0.1, 0.012, 0.003, t, [0.9, 0.9, 0.86])
    }
  }
}
const COLOURS: Rgb[] = [[0.85, 0.3, 0.25], [0.95, 0.78, 0.3], [0.3, 0.5, 0.75], [0.62, 0.42, 0.22], [0.55, 0.25, 0.45], [0.3, 0.55, 0.32]]

/**
 * THE STONE BENCH of the Paris squares (owner, 2026-11-03, with a photograph: "many plazas have these type of low stone
 * benches"): a long granite slab in sections, 0.45 m up on square granite legs, no back. 4.4 m long in x.
 */
export function stoneBench(out: MeshBuilder, seed = 0): void {
  // (a darker grey than it looks: in the noon sun a 0.6 granite read as white marble)
  const tones: Rgb[] = [[0.5, 0.5, 0.48], [0.47, 0.47, 0.46], [0.52, 0.51, 0.49], [0.48, 0.48, 0.47]]
  for (let i = 0; i < 4; i++) box(out, -1.65 + i * 1.1, 0.4, 0, 0.545, 0.075, 0.22, tones[(i + seed) % tones.length], FIXED)
  for (const x of [-1.9, -0.65, 0.65, 1.9]) box(out, x, 0.165, 0, 0.13, 0.165, 0.13, [0.44, 0.44, 0.43], FIXED)
}

/*
 * THE SQUARES' OTHER BENCHES (owner, 2026-11-16: "add different bench patterns and bench types"), by OSM's backrest and
 * material tags (tools/square-benches.py). Each long in x, the sitter facing +z, its seat 0.44 m up.
 */
const WOOD: Rgb[] = [[0.55, 0.38, 0.22], [0.5, 0.34, 0.2], [0.58, 0.41, 0.25], [0.52, 0.36, 0.21], [0.56, 0.39, 0.23]]
const CONCRETE: Rgb = [0.62, 0.61, 0.58]
const STEEL: Rgb = [0.27, 0.29, 0.3]
const STEEL_SEAT: Rgb = [0.34, 0.36, 0.37]

/** A backless wooden PLANK bench: five hardwood slats across two cast-concrete blocks, 2 m long. */
export function plankBench(out: MeshBuilder): void {
  for (let i = 0; i < 5; i++) box(out, 0, 0.44, -0.2 + i * 0.1, 1.0, 0.02, 0.04, WOOD[i], FIXED)
  for (const x of [-0.72, 0.72]) box(out, x, 0.21, 0, 0.13, 0.21, 0.24, CONCRETE, FIXED)
}

/** A modern STEEL bench: thin grey slats on a pair of flat-bar frames, with a raked back of the same or none. 1.9 m long. */
export function steelBench(out: MeshBuilder, back = false): void {
  for (let i = 0; i < 7; i++) box(out, 0, 0.44, -0.2 + i * 0.065, 0.95, 0.012, 0.024, STEEL_SEAT, FIXED)
  if (back) for (let i = 0; i < 4; i++) slab(out, 0, 0.56 + i * 0.1, -0.24 - i * 0.03, 0.95, 0.03, 0.012, 0.28, STEEL_SEAT)
  for (const x of [-0.78, 0.78]) {
    box(out, x, 0.42, 0, 0.02, 0.02, 0.25, STEEL, FIXED)                                       // the seat rail
    box(out, x, 0.21, 0.2, 0.02, 0.21, 0.02, STEEL, FIXED)                                     // the front leg
    box(out, x, back ? 0.45 : 0.21, -0.22, 0.02, back ? 0.45 : 0.21, 0.02, STEEL, FIXED)      // the rear leg (and back post)
  }
}
