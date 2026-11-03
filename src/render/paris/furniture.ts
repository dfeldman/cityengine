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
import type { MeshBuilder } from '../buildings.ts'
import { box, EMIT, FIXED, member, prism, slab, strut, type Rgb } from '../models.ts'

/** the dark green-black the city paints its iron ("vert wagon") */
const IRON: Rgb = [0.1, 0.14, 0.12]
const PARIS_GREEN: Rgb = [0.16, 0.27, 0.21]
const ANTHRACITE: Rgb = [0.2, 0.21, 0.22]
const GLOW: Rgb = [1.0, 0.92, 0.7]
const WHITE: Rgb = [0.94, 0.94, 0.92]

const hash = (seed: number, k: number): number => ((Math.imul((seed ^ Math.imul(k, 0x9e3779b1)) >>> 0, 0x85ebca6b) >>> 0) % 1000) / 1000

/*
 * THE CANDELABRA (owner, 2026-10-30: lamp posts are "a key part of the city's look"). The old model was a plain post
 * with a side arm, a modern streetlight. Haussmann's is a cast-iron column: an octagonal plinth, the swell of the
 * base tapering into the shaft, a collar, and the square Paris lantern on top — glass flaring out under a pyramidal
 * hat with its finial. About eight metres. One stands every 22–31 m, so the shaft is six-sided and the stacked
 * pieces have no caps: ~85 quads.
 */
function column(out: MeshBuilder, top: number): void {
  prism(out, 0, 0, 0, 0.12, 0.34, 8, IRON, FIXED, 0.34, true)
  prism(out, 0, 0, 0.12, 0.55, 0.27, 8, IRON, FIXED, 0.27, false)
  prism(out, 0, 0, 0.55, 0.78, 0.3, 8, IRON, FIXED, 0.2, false)
  prism(out, 0, 0, 0.78, 1.45, 0.2, 8, IRON, FIXED, 0.11, false)
  prism(out, 0, 0, 1.45, 1.57, 0.14, 8, IRON, FIXED, 0.14, false)
  prism(out, 0, 0, 1.57, top - 0.32, 0.1, 6, IRON, FIXED, 0.07, false)
  prism(out, 0, 0, top - 0.32, top - 0.2, 0.12, 6, IRON, FIXED, 0.12, false)
  prism(out, 0, 0, top - 0.2, top, 0.065, 6, IRON, FIXED, 0.065, false)
}

/** the Paris lantern, its base plate at y: square glass flaring upward, the hat's brim, the hat, the finial */
function lantern(out: MeshBuilder, x: number, y: number, z: number, s = 1): void {
  const q = Math.PI / 4
  prism(out, x, z, y, y + 0.06 * s, 0.2 * s, 4, IRON, FIXED, 0.2 * s, true, q)
  prism(out, x, z, y + 0.06 * s, y + 0.7 * s, 0.17 * s, 4, GLOW, EMIT, 0.25 * s, false, q)
  prism(out, x, z, y + 0.7 * s, y + 0.78 * s, 0.31 * s, 4, IRON, FIXED, 0.31 * s, false, q)
  prism(out, x, z, y + 0.78 * s, y + 1.06 * s, 0.31 * s, 4, IRON, FIXED, 0.06 * s, false, q)
  prism(out, x, z, y + 1.06 * s, y + 1.22 * s, 0.035 * s, 4, IRON, FIXED, 0, false, q)
}

/** the boulevard candelabra with its lantern on top */
export function parisLamp(out: MeshBuilder): void {
  column(out, 6.9)
  lantern(out, 0, 6.9, 0)
}

/**
 * The avenue's candelabra: the same column, a lantern on top and two crook arms, a lantern hanging from each — the
 * Rivoli pattern, where the pavement is wide enough that a single top lantern leaves the kerb dark.
 */
export function parisLampConsole(out: MeshBuilder): void {
  column(out, 7.1)
  lantern(out, 0, 7.1, 0, 0.85)
  for (const s of [-1, 1]) {
    strut(out, [0, 6.6, 0], [s * 0.55, 7.0, 0], 0.05, 0.05, IRON)
    strut(out, [s * 0.55, 7.0, 0], [s * 1.15, 7.05, 0], 0.045, 0.045, IRON)
    strut(out, [s * 1.15, 7.05, 0], [s * 1.4, 6.85, 0], 0.04, 0.04, IRON)
    // (a scroll under the arm, the bracket's curl)
    strut(out, [s * 0.2, 6.3, 0], [s * 0.7, 6.9, 0], 0.03, 0.03, IRON)
    lantern(out, s * 1.4, 5.65, 0, 0.9)
  }
}

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

/** An ad, 1.2 × 1.76 m, as blocks: a glowing ground, a picture side, the headline's lines, the brand's mark. `dir` is the side it faces (±z). */
function poster(out: MeshBuilder, cx: number, cy: number, cz: number, hw: number, hh: number, dir: 1 | -1, seed: number): void {
  const palettes: Rgb[][] = [
    [[0.96, 0.84, 0.2], [0.1, 0.1, 0.12], [0.9, 0.2, 0.2]],
    [[0.12, 0.36, 0.72], [0.96, 0.96, 0.94], [0.95, 0.72, 0.2]],
    [[0.92, 0.92, 0.9], [0.8, 0.1, 0.14], [0.14, 0.14, 0.16]],
    [[0.1, 0.12, 0.14], [0.96, 0.96, 0.94], [0.3, 0.8, 0.5]],
    [[0.88, 0.3, 0.5], [0.98, 0.94, 0.9], [0.2, 0.2, 0.3]],
    [[0.2, 0.6, 0.64], [0.98, 0.98, 0.96], [0.98, 0.5, 0.2]],
    [[0.97, 0.95, 0.9], [0.3, 0.2, 0.16], [0.85, 0.6, 0.2]],
  ]
  const [bg, ink, accent] = palettes[Math.floor(hash(seed, 1) * palettes.length)]
  // (the layers centimetres apart, not millimetres: they fought from across the street — owner, 2026-10-06)
  const face = (u: number, v: number, w: number, h: number, col: Rgb, lift: number, glow = false): void =>
    box(out, cx + u, cy + v, cz + dir * lift, w, h, 0.004, col, glow ? EMIT : FIXED)
  face(0, 0, hw, hh, bg, 0.012, true)
  const s = hash(seed, 2) < 0.5 ? -1 : 1
  const skies: Rgb[] = [[0.45, 0.7, 0.92], [0.98, 0.72, 0.4], [0.2, 0.22, 0.3], [0.85, 0.88, 0.9]]
  face(0, hh * 0.28, hw * 0.9, hh * 0.6, skies[Math.floor(hash(seed, 3) * skies.length)], 0.024, true)
  face(s * hw * 0.3, hh * 0.1, hw * 0.16, hh * 0.42, ink, 0.036)                          // the product, or the face
  face(0, -hh * 0.62, hw * 0.9, hh * 0.3, accent, 0.024, true)
  face(-s * hw * 0.2, -hh * 0.55, hw * 0.5, hh * 0.07, ink, 0.036)
  face(-s * hw * 0.3, -hh * 0.72, hw * 0.36, hh * 0.05, ink, 0.036)
  face(s * hw * 0.72, -hh * 0.82, hw * 0.12, hh * 0.08, WHITE, 0.036)
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
  for (const d of [1, -1] as const) {
    // (a poster faces ±z in its own frame: this one is drawn turned, the axes swapped)
    const face = (u: number, v: number, w: number, h: number, col: Rgb, lift: number, glow = false): void =>
      box(out, 1.78 + d * (0.05 + lift), 1.45 + v, -0.15 + u, 0.004, h, w, col, glow ? EMIT : FIXED)
    const [bg, ink, accent] = [[[0.12, 0.36, 0.72], [0.96, 0.96, 0.94], [0.95, 0.72, 0.2]], [[0.92, 0.92, 0.9], [0.8, 0.1, 0.14], [0.14, 0.14, 0.16]], [[0.88, 0.3, 0.5], [0.98, 0.94, 0.9], [0.2, 0.2, 0.3]]][Math.floor(hash(seed, 11 + d) * 3)] as Rgb[]
    face(0, 0, 0.58, 0.86, bg, 0.012, true)
    face(0, 0.25, 0.5, 0.45, accent, 0.024, true)
    face(0.1, -0.5, 0.36, 0.06, ink, 0.036)
    face(0.0, -0.64, 0.28, 0.05, ink, 0.036)
  }
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
 * THE SUCETTE: JCDecaux's lit ad panel on its post — 1.2 × 1.76 m of poster in an anthracite frame, a face each way
 * along the pavement (±z), the thing a Paris pavement has on every other block.
 */
export function sucette(out: MeshBuilder, seed = 0): void {
  box(out, 0, 0.3, 0, 0.14, 0.3, 0.06, ANTHRACITE, FIXED)
  box(out, 0, 1.56, 0, 0.68, 0.96, 0.05, ANTHRACITE, FIXED)
  box(out, 0, 2.55, 0, 0.7, 0.03, 0.07, ANTHRACITE, FIXED)
  poster(out, 0, 1.56, 0.05, 0.6, 0.88, 1, seed)
  poster(out, 0, 1.56, -0.05, 0.6, 0.88, -1, seed + 1)
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
  shrub(out, 0, 0.47, 0, 0.3, 0.55, hash(seed, 2) < 0.7 ? [0.18, 0.34, 0.16] : [0.26, 0.42, 0.2])
}
