/**
 * Paris's rolling stock (render/rolling-stock.ts for the shared engine): on the main lines out of the seven
 * termini the RER's double-deck Z 2N and MI09, the Transilien's Francilien, the TER's Régiolis and the TGV
 * Duplex in inOui's and Ouigo's colours (owner, 2026-10-29: "There are a whole lot of train stations, with
 * their trains"); the métro's MP 73 on the Line 2 and 6 viaducts, and the RATP's Citadis trams. Each train has
 * a head car with its headlights lit and a tail with its red lamps; the bodies are tinted per copy.
 */
import type { MeshBuilder } from '../buildings.ts'
import { box, strut, BODY, EMIT, FIXED, type Rgb } from '../models.ts'
import { turned, type RegionStock } from '../rolling-stock.ts'

const LAMP: Rgb = [1.0, 0.95, 0.8]
const RED: Rgb = [0.9, 0.08, 0.06]

/**
 * A Paris tram (BUGS.md #34): an Alstom Citadis, as the RATP's T-lines run them — low floor, a long window
 * band, a raked cab. Articulated: `citadisCab` at each end (nose toward +z) and `citadisMid` between, each
 * module 8.2 m, the body tinted per instance (white, the RATP's pale grey).
 */
function citadisBody(out: MeshBuilder, doors: number[]): void {
  const glass: Rgb = [0.16, 0.2, 0.23]
  const dark: Rgb = [0.13, 0.13, 0.14]
  const roof: Rgb = [0.62, 0.64, 0.66]
  const accent: Rgb = [0.35, 0.6, 0.45]
  box(out, 0, 0.95, 0, 1.32, 0.6, 4.08, [1, 1, 1])
  box(out, 0, 2.02, 0, 1.325, 0.52, 3.96, glass, FIXED)
  for (const k of [-1.33, 1.33]) box(out, k, 1.52, 0, 0.012, 0.03, 3.96, [0.85, 0.86, 0.87], FIXED)
  box(out, 0, 2.78, 0, 1.32, 0.24, 4.08, [1, 1, 1])
  box(out, 0, 3.07, 0, 1.18, 0.07, 4.0, roof, FIXED)
  box(out, 0, 0.3, 0, 1.24, 0.14, 3.95, dark, FIXED)
  // the livery's stripe low down, and the doors: dark glazed leaves in both sides
  for (const k of [-1.33, 1.33]) box(out, k, 0.62, 0, 0.012, 0.06, 4.0, accent, FIXED)
  for (const z of doors) for (const k of [-1.335, 1.335]) box(out, k, 1.45, z, 0.012, 1.0, 0.62, glass, FIXED)
  // the gangway bellows at each end
  for (const e of [-1, 1]) box(out, 0, 1.6, e * 4.14, 1.18, 1.25, 0.08, dark, FIXED)
}

function citadisMid(out: MeshBuilder): void {
  citadisBody(out, [-1.9, 1.9])
  // the pantograph on its roof: a folded arm and the collector bar
  const dark: Rgb = [0.13, 0.13, 0.14]
  box(out, 0, 3.22, 0, 0.6, 0.08, 1.2, [0.5, 0.52, 0.54], FIXED)
  box(out, 0, 3.55, -0.3, 0.04, 0.3, 0.04, dark, FIXED)
  box(out, 0, 3.55, 0.3, 0.04, 0.3, 0.04, dark, FIXED)
  box(out, 0, 3.87, 0, 0.8, 0.03, 0.08, dark, FIXED)
}

function citadisCab(out: MeshBuilder, lamp: Rgb = [1.0, 0.95, 0.8]): void {
  citadisBody(out, [-1.2])
  const glass: Rgb = [0.16, 0.2, 0.23]
  // the raked nose: a lower face, the big windscreen leaning back, the roof carried over it
  box(out, 0, 0.95, 4.45, 1.28, 0.6, 0.4, [1, 1, 1])
  box(out, 0, 2.0, 4.35, 1.22, 0.5, 0.28, glass, FIXED)
  box(out, 0, 2.72, 4.2, 1.26, 0.2, 0.2, [1, 1, 1])
  box(out, 0, 0.5, 4.82, 1.1, 0.12, 0.05, [0.13, 0.13, 0.14], FIXED)
  for (const x of [-0.85, 0.85]) box(out, x, 0.95, 4.86, 0.18, 0.07, 0.02, lamp, EMIT)
  // the destination board over the windscreen
  box(out, 0, 2.62, 4.42, 0.7, 0.09, 0.02, [1.0, 0.72, 0.2], EMIT)
}

/**
 * A Paris métro car on a viaduct (Line 6, MP 73, rubber-tyred): 15 m, boxy with a gently rounded roof, five
 * doors a side, the body tinted per instance (RATP white) over a blue-green skirt. Faces +z.
 */
function metroCar(out: MeshBuilder): void {
  const glass: Rgb = [0.15, 0.19, 0.22]
  const dark: Rgb = [0.12, 0.12, 0.13]
  const band: Rgb = [0.12, 0.42, 0.5]
  box(out, 0, 1.25, 0, 1.2, 0.95, 7.4, [1, 1, 1])
  box(out, 0, 1.75, 0, 1.205, 0.38, 7.1, glass, FIXED)
  box(out, 0, 2.28, 0, 1.12, 0.1, 7.35, [0.8, 0.81, 0.83], FIXED)
  box(out, 0, 2.42, 0, 0.9, 0.06, 7.2, [0.72, 0.73, 0.75], FIXED)
  for (const k of [-1.205, 1.205]) {
    box(out, k, 0.62, 0, 0.012, 0.16, 7.4, band, FIXED)
    for (const z of [-5.6, -2.8, 0, 2.8, 5.6]) box(out, k, 1.25, z, 0.013, 0.85, 0.55, glass, FIXED)
  }
  // the bogies' rubber tyres and guide wheels, dark under the floor
  box(out, 0, 0.22, 0, 1.0, 0.2, 7.0, dark, FIXED)
  for (const e of [-1, 1]) box(out, 0, 1.3, e * 7.45, 1.0, 0.9, 0.06, dark, FIXED)
}

/**
 * A double-deck RER / Transilien car (Z 2N family): 24 m, two rows of windows, white with the blue and red
 * band, the body tinted per instance. Faces +z.
 */
function rerCar(out: MeshBuilder): void {
  const glass: Rgb = [0.15, 0.19, 0.22]
  const dark: Rgb = [0.12, 0.12, 0.13]
  box(out, 0, 2.05, 0, 1.45, 1.6, 11.9, [1, 1, 1])
  box(out, 0, 3.72, 0, 1.3, 0.12, 11.8, [0.7, 0.71, 0.73], FIXED)
  for (const k of [-1.455, 1.455]) {
    box(out, k, 1.45, 0, 0.012, 0.35, 9.4, glass, FIXED)
    box(out, k, 2.85, 0, 0.012, 0.38, 9.4, glass, FIXED)
    box(out, k, 0.85, 0, 0.012, 0.09, 11.9, [0.13, 0.25, 0.55], FIXED)
    box(out, k, 0.7, 0, 0.012, 0.05, 11.9, [0.75, 0.12, 0.15], FIXED)
    for (const z of [-10.2, 10.2]) box(out, k, 1.65, z, 0.013, 1.05, 0.7, glass, FIXED)
  }
  box(out, 0, 0.35, 0, 1.1, 0.3, 11.2, dark, FIXED)
  for (const e of [-1, 1]) box(out, 0, 2.0, e * 11.95, 1.2, 1.4, 0.06, dark, FIXED)
}

/** a lit front or back on a car of `half` length: two lamps low on the end face */
function lamps(out: MeshBuilder, half: number, y: number, x: number, colour: Rgb): void {
  const z = Math.sign(half) * (Math.abs(half) + 0.09)
  for (const s of [-1, 1]) box(out, s * x, y, z, 0.14, 0.07, 0.02, colour, EMIT)
}

/*
 * THE MAIN LINES' OTHER TRAINS. One thing the engine cannot say per variant is how many cars a train has:
 * `cars` belongs to the kind (rolling-stock.ts), and only the models, liveries, pitch and shadow vary. So every
 * main-line train here is five "cars" long, and a model car is whatever makes a real train of it — the Z 2N
 * and the MI09 a car each (five cars, 112–122 m, the five-car units both are), the Francilien and the Régiolis
 * two short articulated bodies each (ten of 11 m: the long Francilien, 112 m), and the TGV Duplex two trailers
 * each, its head and tail a trailer with the power car on the end — two power cars and eight trailers, 190 m.
 */

/** one cross-section of a lofted body: at `z`, `w` either side, from `y0` up to `y1`, its top corners cut by `c` */
interface Slice { z: number; w: number; y0: number; y1: number; c: number }
type Paint = (x: number, y: number, z: number) => [Rgb, number]

/** the six corners of a slice, round from the bottom left */
function ring(q: Slice): [number, number, number][] {
  return [[-q.w, q.y0, q.z], [q.w, q.y0, q.z], [q.w, q.y1 - q.c, q.z], [q.w - q.c, q.y1, q.z], [-q.w + q.c, q.y1, q.z], [-q.w, q.y1 - q.c, q.z]]
}

/** a slice's face closed over, facing `dir` along z (the ends of a lofted body) */
function capSlice(out: MeshBuilder, q: Slice, dir: 1 | -1, colour: Rgb, tag: number): void {
  const r = ring(q)
  const c: [number, number, number] = [0, (q.y0 + q.y1) / 2, q.z]
  for (let i = 0; i < r.length; i++) out.quad([c, r[i], r[(i + 1) % r.length], r[(i + 1) % r.length]], [0, 0, dir], [[0, 0], [1, 0], [1, 1], [0, 1]], colour, tag)
}

/**
 * A body lofted through its slices (z rising): each panel between two slices painted by `paint` at its middle —
 * the TGV's long nose, and the raked cabs. The panels' normals from their diagonals, turned away from the axis.
 */
function loft(out: MeshBuilder, s: Slice[], paint: Paint): void {
  const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  for (let i = 0; i + 1 < s.length; i++) {
    const a = ring(s[i])
    const b = ring(s[i + 1])
    const cy = (s[i].y0 + s[i].y1 + s[i + 1].y0 + s[i + 1].y1) / 4
    for (let j = 0; j < 6; j++) {
      const k = (j + 1) % 6
      const P = [a[j], a[k], b[k], b[j]]
      const d1 = [P[2][0] - P[0][0], P[2][1] - P[0][1], P[2][2] - P[0][2]]
      const d2 = [P[3][0] - P[1][0], P[3][1] - P[1][1], P[3][2] - P[1][2]]
      let n: [number, number, number] = [d1[1] * d2[2] - d1[2] * d2[1], d1[2] * d2[0] - d1[0] * d2[2], d1[0] * d2[1] - d1[1] * d2[0]]
      const l = Math.hypot(...n)
      if (l < 1e-6) continue
      n = [n[0] / l, n[1] / l, n[2] / l]
      const mx = (P[0][0] + P[1][0] + P[2][0] + P[3][0]) / 4
      const my = (P[0][1] + P[1][1] + P[2][1] + P[3][1]) / 4
      const mz = (P[0][2] + P[1][2] + P[2][2] + P[3][2]) / 4
      if (n[0] * mx + n[1] * (my - cy) < 0) n = [-n[0], -n[1], -n[2]]
      const [colour, tag] = paint(mx, my, mz)
      out.quad(P, n, UV, colour, tag)
    }
  }
}

/** a straight body from z0 to z1, its ends closed (dark, where the gangway meets it): a car's shell, tinted */
function shell(out: MeshBuilder, z0: number, z1: number, w: number, y0: number, y1: number, c: number): void {
  const a = { z: z0, w, y0, y1, c }
  const b = { z: z1, w, y0, y1, c }
  loft(out, [a, b], () => [WHITE, BODY])
  capSlice(out, a, -1, DARK, FIXED)
  capSlice(out, b, 1, DARK, FIXED)
}

const GLASS: Rgb = [0.13, 0.16, 0.19]
const DARK: Rgb = [0.12, 0.12, 0.13]
const ROOF: Rgb = [0.6, 0.61, 0.63]
const WHITE: Rgb = [1, 1, 1]

/** the bogies under a car: a dark frame and its wheels' line at each `z` */
function bogies(out: MeshBuilder, zs: number[], w = 1.05): void {
  for (const z of zs) {
    box(out, 0, 0.42, z, w, 0.2, 1.35, DARK, FIXED)
    for (const k of [-w, w]) box(out, k, 0.38, z, 0.03, 0.26, 1.2, [0.2, 0.2, 0.21], FIXED)
  }
}

/** a pantograph folded on the roof at `z`, its frame on insulators and the collector bar over */
function pantograph(out: MeshBuilder, y: number, z: number): void {
  box(out, 0, y + 0.06, z, 0.55, 0.06, 0.7, [0.45, 0.46, 0.48], FIXED)
  strut(out, [0, y + 0.12, z - 0.5], [0, y + 0.7, z + 0.6], 0.05, 0.05, DARK)
  strut(out, [0, y + 0.7, z + 0.6], [0, y + 1.2, z - 0.2], 0.04, 0.04, DARK)
  box(out, 0, y + 1.22, z - 0.2, 0.85, 0.025, 0.06, DARK, FIXED)
}

/** windows as panes along one row, both sides: `n` panes of `len` between `z0` and `z1`, at height `y` ± `hy` */
function panes(out: MeshBuilder, x: number, y: number, hy: number, z0: number, z1: number, n: number, colour: Rgb = GLASS): void {
  const step = (z1 - z0) / n
  for (let i = 0; i < n; i++) for (const k of [-x, x]) box(out, k, y, z0 + step * (i + 0.5), 0.012, hy, step * 0.42, colour, FIXED)
}

/** a TGV's colours: the band low along it, the doors, the window surround, the nose's lower lip */
interface TgvPaint { band: Rgb; door: Rgb; frame: Rgb; lip: Rgb }
/** inOui (the Carmillon livery): pearl grey, a dark grey round the windows, the carmine-violet low and at the doors */
const INOUI: TgvPaint = { band: [0.46, 0.13, 0.3], door: [0.46, 0.13, 0.3], frame: [0.32, 0.33, 0.36], lip: [0.4, 0.4, 0.43] }
/** Ouigo: its sky blue (the tint), pink low and at the doors */
const OUIGO: TgvPaint = { band: [0.92, 0.22, 0.55], door: [0.92, 0.22, 0.55], frame: [0.08, 0.38, 0.62], lip: [0.92, 0.22, 0.55] }

/**
 * A TGV Duplex trailer, centred on `zc`: 18.7 m between the articulations, its bogies shared with the next one
 * (Jacobs bogies, at the ends), two decks of windows between the stairwells and the door over each end's bogie.
 * 4.3 m high, a head taller than the power cars.
 */
function duplexTrailer(out: MeshBuilder, zc: number, p: TgvPaint): void {
  const H = 9.25
  shell(out, zc - H, zc + H, 1.45, 0.62, 4.3, 0.45)
  box(out, 0, 4.31, zc, 0.95, 0.02, H - 0.2, ROOF, FIXED)
  for (const k of [-1.455, 1.455]) {
    // the window surround, a dark band the length of the saloons on each deck, and the panes on it
    box(out, k, 1.62, zc, 0.01, 0.36, 6.5, p.frame, FIXED)
    box(out, k, 3.12, zc, 0.01, 0.38, 7.6, p.frame, FIXED)
    box(out, k, 0.8, zc, 0.01, 0.13, H, p.band, FIXED)
  }
  panes(out, 1.468, 1.62, 0.26, zc - 6.3, zc + 6.3, 8)
  panes(out, 1.468, 3.12, 0.28, zc - 7.4, zc + 7.4, 9)
  // a door at one end, over the bogie, at the platform's height
  for (const k of [-1.46, 1.46]) {
    box(out, k, 1.7, zc + 8.0, 0.012, 1.0, 0.62, p.door, FIXED)
    box(out, k, 1.95, zc + 8.0, 0.016, 0.45, 0.2, GLASS, FIXED)
  }
  // the gangway at the articulation
  box(out, 0, 2.3, zc - H, 1.1, 1.55, 0.12, DARK, FIXED)
}

/**
 * A TGV power car from `z0` to its nose's tip at z0 + 20.2: single-deck, 4.05 m, the long nose sloping down
 * from the roof over 7 m to a lip a metre off the rail, the windscreen wrapped round it. Its headlights or tail
 * lamps low either side of the nose; the louvres along its sides, a pantograph raised at the back.
 */
function powerCar(out: MeshBuilder, z0: number, p: TgvPaint, lamp: Rgb): void {
  const s: Slice[] = [
    { z: z0, w: 1.45, y0: 0.62, y1: 4.05, c: 0.4 },
    { z: z0 + 13.6, w: 1.45, y0: 0.62, y1: 4.05, c: 0.4 },
    { z: z0 + 15.0, w: 1.44, y0: 0.62, y1: 3.86, c: 0.5 },
    { z: z0 + 16.4, w: 1.4, y0: 0.63, y1: 3.36, c: 0.6 },
    { z: z0 + 17.7, w: 1.3, y0: 0.64, y1: 2.72, c: 0.62 },
    { z: z0 + 18.8, w: 1.12, y0: 0.66, y1: 2.06, c: 0.58 },
    { z: z0 + 19.6, w: 0.84, y0: 0.7, y1: 1.52, c: 0.42 },
    { z: z0 + 20.2, w: 0.44, y0: 0.78, y1: 1.12, c: 0.16 },
  ]
  loft(out, s, (x, y, z) => {
    const t = z - z0
    // the windscreen: the top and its shoulders between the roof's end and the nose
    if (t > 14.4 && t < 17.9 && y > 2.55 && (Math.abs(x) < 1.3 || y > 3.0)) return [GLASS, FIXED]
    if (y < 1.0 || (t > 18.4 && y < 1.3)) return [p.lip, FIXED]
    return [WHITE, BODY]
  })
  capSlice(out, s[s.length - 1], 1, p.lip, FIXED)
  capSlice(out, s[0], -1, DARK, FIXED)
  for (const k of [-1.455, 1.455]) {
    box(out, k, 0.8, z0 + 7, 0.01, 0.13, 7, p.band, FIXED)
    // the louvres, and the cab's side window and door behind the windscreen
    for (let i = 0; i < 4; i++) for (const d of [-0.3, 0, 0.3]) box(out, k, 2.95, z0 + 2.6 + i * 2.3 + d, 0.012, 0.42, 0.08, p.frame, FIXED)
    box(out, k, 2.85, z0 + 13.0, 0.012, 0.32, 0.4, GLASS, FIXED)
    box(out, k, 2.05, z0 + 12.3, 0.012, 1.2, 0.03, DARK, FIXED)
  }
  for (const x of [-0.42, 0.42]) box(out, x, 1.0, z0 + 19.95, 0.14, 0.05, 0.2, lamp, EMIT)
  box(out, 0, 4.06, z0 + 6.5, 0.9, 0.02, 6.2, ROOF, FIXED)
  pantograph(out, 4.05, z0 + 3.0)
  bogies(out, [z0 + 3.2, z0 + 16.2])
}

/** the TGV's model cars: two trailers to a car; the head a trailer with the power car ahead of it (nose +z) */
function tgv(p: TgvPaint): { mid: (o: MeshBuilder) => void; head: (o: MeshBuilder) => void; tail: (o: MeshBuilder) => void } {
  const cab = (lamp: Rgb) => (o: MeshBuilder): void => {
    duplexTrailer(o, -9.35, p)
    powerCar(o, 0.15, p, lamp)
    bogies(o, [-18.7])
  }
  return {
    mid: (o) => { duplexTrailer(o, -9.35, p); duplexTrailer(o, 9.35, p); bogies(o, [-18.7, 0]) },
    head: cab(LAMP),
    tail: turned(cab(RED)),
  }
}

/** a single-deck articulated unit's colours */
interface UnitPaint { band: Rgb; door: Rgb; frame: Rgb; face: Rgb; height: number; nose: number }
/**
 * The Francilien (Alstom Z 50000, Transilien lines H, J, K, L, P out of Nord, Est and Saint-Lazare), in Île-de-France
 * Mobilités' colours: the silver body (the tint), a black band of glass the length of it, turquoise round the doors
 * and the cab's black face. 3.16 m wide, the widest train on the network.
 */
const FRANCILIEN: UnitPaint = { band: [0.1, 0.62, 0.62], door: [0.1, 0.62, 0.62], frame: [0.08, 0.09, 0.1], face: [0.08, 0.09, 0.1], height: 3.85, nose: 0.9 }
/** the Régiolis (Alstom Coradia Polyvalent) on the TER out of Est and Lazare: grey, the regions' blue low down, a longer snout */
const REGIOLIS: UnitPaint = { band: [0.1, 0.3, 0.62], door: [0.1, 0.3, 0.62], frame: [0.16, 0.17, 0.19], face: [0.1, 0.3, 0.62], height: 3.95, nose: 1.6 }

/** one 11.2 m body of a single-deck articulated unit, centred on `zc`: big windows, one wide door each side mid-body */
function unitBody(out: MeshBuilder, zc: number, p: UnitPaint, cab = false): void {
  const H = 5.5
  const W = 1.56
  const y1 = p.height
  const front = cab ? 4.4 : H
  shell(out, zc - H, zc + front, W, 0.55, y1, 0.35)
  // the roof's fairing over the equipment, and the bellows at the articulation
  box(out, 0, y1 + 0.12, zc, 1.0, 0.12, H - 0.6, ROOF, FIXED)
  box(out, 0, 2.2, zc - H, 1.25, 1.5, 0.12, DARK, FIXED)
  for (const k of [-W - 0.005, W + 0.005]) {
    box(out, k, 2.05, zc + (front - H) / 2, 0.01, 0.6, (front + H) / 2 - 0.3, p.frame, FIXED)
    box(out, k, 1.3, zc + (front - H) / 2, 0.01, 0.06, (front + H) / 2, p.band, FIXED)
    // the wide plug door at mid-body, its two leaves glazed
    box(out, k, 1.6, zc, 0.012, 1.05, 0.98, p.door, FIXED)
    for (const z of [-0.42, 0.42]) box(out, k, 1.95, zc + z, 0.016, 0.55, 0.32, GLASS, FIXED)
  }
  panes(out, W + 0.018, 2.05, 0.48, zc - H + 0.4, zc - 1.1, 2)
  panes(out, W + 0.018, 2.05, 0.48, zc + 1.1, zc + front - 0.4, 2)
}

/**
 * The raked cab on a unit's front body (its face at +z): the windscreen leaning back from the coupler to the
 * roof, black over the whole face, the lamps in a band under it.
 */
function unitCab(out: MeshBuilder, zc: number, p: UnitPaint, lamp: Rgb): void {
  const z = zc + 4.4
  const y1 = p.height
  const n = p.nose
  const s: Slice[] = [
    { z, w: 1.56, y0: 0.55, y1, c: 0.35 },
    { z: z + 0.5, w: 1.55, y0: 0.55, y1: y1 - 0.12, c: 0.42 },
    { z: z + 0.5 + n * 0.55, w: 1.5, y0: 0.58, y1: y1 - 0.75, c: 0.5 },
    { z: z + 0.5 + n, w: 1.38, y0: 0.62, y1: 1.7, c: 0.35 },
    { z: z + 0.62 + n, w: 1.2, y0: 0.66, y1: 1.15, c: 0.2 },
  ]
  loft(out, s, (_x, y, zz) => zz > z + 0.2 && y > 1.55 ? [GLASS, FIXED] : zz > z + 0.2 ? [p.face, FIXED] : [WHITE, BODY])
  capSlice(out, s[s.length - 1], 1, p.face, FIXED)
  for (const x of [-0.8, 0.8]) box(out, x, 0.92, z + 0.64 + n, 0.2, 0.06, 0.03, lamp, EMIT)
  // the destination board over the windscreen
  box(out, 0, y1 - 0.3, z + 0.6, 0.6, 0.08, 0.08, [1.0, 0.72, 0.2], EMIT)
}

/** a unit's model cars: two bodies to a car (bogies under each articulation); the head's front body the cab */
function unit(p: UnitPaint): { mid: (o: MeshBuilder) => void; head: (o: MeshBuilder) => void; tail: (o: MeshBuilder) => void } {
  const cab = (lamp: Rgb) => (o: MeshBuilder): void => {
    unitBody(o, -5.6, p)
    unitBody(o, 5.6, p, true)
    unitCab(o, 5.6, p, lamp)
    bogies(o, [-11.2, 0, 8.4], 1.1)
    pantograph(o, p.height + 0.24, -5.6)
  }
  return {
    mid: (o) => { unitBody(o, -5.6, p); unitBody(o, 5.6, p); bogies(o, [-11.2, 0], 1.1) },
    head: cab(LAMP),
    tail: turned(cab(RED)),
  }
}

/**
 * An MI09 (RER A, its line from La Défense through Auber and the Gare de Lyon to Boissy and Marne-la-Vallée) or
 * its elder the MI2N: double-deck, 22.4 m, three wide doors a side, the RATP's white with the blue band low and the
 * red line over it, the doors blue. Faces +z; the cab (`cab`) a black face leaning back to the roof.
 */
function mi09(cab: Rgb | null): (out: MeshBuilder) => void {
  return (out) => {
    const H = 11.1
    const front = cab ? 10.4 : H
    const BLUE: Rgb = [0.13, 0.27, 0.6]
    const REDL: Rgb = [0.8, 0.12, 0.16]
    shell(out, -H, front, 1.45, 0.6, 4.3, 0.4)
    box(out, 0, 4.31, 0, 0.9, 0.02, H - 0.6, ROOF, FIXED)
    for (const k of [-1.455, 1.455]) {
      box(out, k, 0.82, 0, 0.01, 0.18, H, BLUE, FIXED)
      box(out, k, 1.06, 0, 0.01, 0.035, H, REDL, FIXED)
      for (const z of [-7.6, 0, 7.6]) {
        box(out, k, 1.62, z, 0.012, 1.0, 0.95, BLUE, FIXED)
        for (const d of [-0.4, 0.4]) box(out, k, 1.85, z + d, 0.016, 0.62, 0.3, GLASS, FIXED)
      }
    }
    // the lower deck between the doors, the upper over the whole saloon; at the ends the mid-level windows
    for (const [a, b] of [[-6.4, -1.2], [1.2, 6.4]]) panes(out, 1.468, 1.62, 0.3, a, b, 3)
    panes(out, 1.468, 3.2, 0.32, -9.8, 9.8, 10)
    box(out, 0, 2.3, -H, 1.15, 1.6, 0.1, DARK, FIXED)
    bogies(out, [-8.8, 8.8])
    if (!cab) { box(out, 0, 2.3, H, 1.15, 1.6, 0.1, DARK, FIXED); return }
    const s: Slice[] = [
      { z: front, w: 1.45, y0: 0.6, y1: 4.3, c: 0.4 },
      { z: front + 0.55, w: 1.45, y0: 0.6, y1: 4.15, c: 0.5 },
      { z: front + 1.05, w: 1.38, y0: 0.62, y1: 3.0, c: 0.5 },
      { z: front + 1.25, w: 1.3, y0: 0.66, y1: 1.4, c: 0.25 },
    ]
    loft(out, s, (_x, y, z) => z > front + 0.2 && y > 1.5 ? [GLASS, FIXED] : z > front + 0.2 ? [BLUE, FIXED] : [WHITE, BODY])
    capSlice(out, s[s.length - 1], 1, BLUE, FIXED)
    for (const x of [-0.95, 0.95]) box(out, x, 1.32, front + 1.2, 0.2, 0.06, 0.08, cab, EMIT)
    box(out, 0, 3.85, front + 0.62, 0.65, 0.09, 0.06, [1.0, 0.72, 0.2], EMIT)
    pantograph(out, 4.3, -4)
  }
}

/** the main lines' variants, in PARIS_STOCK.rail.variants' order (the Z 2N, `rail` itself, is 0) */
const TGV_INOUI = tgv(INOUI)
const TGV_OUIGO = tgv(OUIGO)
const FRANCILIEN_UNIT = unit(FRANCILIEN)
const REGIOLIS_UNIT = unit(REGIOLIS)
/** model car indices: 0 the Z 2N, then the variants below */
const V = { z2n: 0, inoui: 1, ouigo: 2, francilien: 3, mi09: 4, regiolis: 5 }

/**
 * Which train a main line gets, from its length: a long line (a kilometre and more — the open approaches fanning
 * out of the termini, where the TGVs come in) is a TGV half the time, inOui twice as often as Ouigo; a short
 * one (a piece of a station throat, a junction's curve) is suburban stock, which is most of what is in the
 * termini anyway. Which of them, from the line's own ends, so the same line always gets the same train.
 */
function parisMainLine(points: { x: number; z: number }[]): number | null {
  if (points.length < 2) return null
  let length = 0
  for (let i = 1; i < points.length; i++) length += Math.hypot(points[i].x - points[i - 1].x, points[i].z - points[i - 1].z)
  const a = points[0]
  const b = points[points.length - 1]
  const h = Math.abs(Math.floor(a.x * 0.37 + a.z * 0.61 + b.x * 0.23 + b.z * 0.89)) % 97
  const pick = length >= 1000
    ? [V.inoui, V.francilien, V.inoui, V.z2n, V.ouigo, V.mi09, V.inoui, V.regiolis]
    : [V.z2n, V.francilien, V.mi09, V.francilien, V.regiolis, V.z2n]
  return pick[h % pick.length]
}

export const PARIS_STOCK: RegionStock = {
  rail: {
    // the Z 2N (variant 0), and the others — five model cars to a train whatever it is (see above)
    mid: rerCar, head: (o) => { rerCar(o); lamps(o, 11.95, 0.95, 0.9, LAMP) }, tail: (o) => { rerCar(o); lamps(o, -11.95, 0.95, 0.9, RED) },
    cars: 5, pitch: 24.3, speed: 16, colour: [0.93, 0.93, 0.94], shadow: [24, 3.4, 3.4],
    // (each variant its own pools: three middle cars a train, so a dozen trains of each in sight at a terminus)
    capacity: 40,
    variants: [
      { ...TGV_INOUI, liveries: [[0.88, 0.89, 0.91]], pitch: 37.4, shadow: [37.4, 3.3, 3.4] },
      { ...TGV_OUIGO, liveries: [[0.16, 0.6, 0.86]], pitch: 37.4, shadow: [37.4, 3.3, 3.4] },
      { ...FRANCILIEN_UNIT, liveries: [[0.76, 0.78, 0.8], [0.72, 0.74, 0.77]], pitch: 22.4, shadow: [22.4, 3.5, 3.4] },
      { mid: mi09(null), head: mi09(LAMP), tail: turned(mi09(RED)), liveries: [[0.94, 0.94, 0.95]], pitch: 22.4, shadow: [22.4, 3.3, 3.4] },
      { ...REGIOLIS_UNIT, liveries: [[0.7, 0.72, 0.74]], pitch: 22.4, shadow: [22.4, 3.4, 3.4] },
    ],
    variantFor: parisMainLine,
  },
  metro: {
    mid: metroCar, head: (o) => { metroCar(o); lamps(o, 7.45, 0.75, 0.8, LAMP) }, tail: (o) => { metroCar(o); lamps(o, -7.45, 0.75, 0.8, RED) },
    cars: 5, pitch: 15.2, speed: 11, colour: [0.94, 0.94, 0.95], shadow: [15, 2.6, 2.6], capacity: 40,
    // the viaducts' stations (regions.json `viaductStations`): trains stop at them
    stops: true,
  },
  tram: {
    // the cab leads and trails (the last one turned round), the middle modules between; RATP white
    mid: citadisMid, head: (o) => citadisCab(o), tail: turned((o) => citadisCab(o, RED)),
    cars: 4, pitch: 8.3, speed: 7, colour: [0.93, 0.94, 0.95], shadow: [8.3, 2.8, 2.8], capacity: 48,
  },
  // a line, not a scrap: trains shuttling up and down 45 m of track at a tunnel mouth or a station throat
  // (the RER C by the Quai Saint-Bernard) looked like toys (BUGS.md #34)
  minLine: 400,
}
