/**
 * Small sights along the park and shore routes, none of them buildings, so none of them in OSM's buildings:
 *
 *   - THE BISON PADDOCK in Golden Gate Park (since 1891): a long meadow south of JFK Drive behind a post-and-wire
 *     fence, a dozen American bison grazing — the park's oddest and best-loved sight from the bike lane;
 *   - THE LANDS END LABYRINTH (Eduardo Aguilera, 2004): seven circuits of fist-sized stones laid on the bare top of a
 *     promontory over the Golden Gate, seen from the Coastal Trail below;
 *   - THE WAVE ORGAN (Peter Richards and George Gonzalez, 1986): terraces of carved granite and marble from a
 *     demolished cemetery at the tip of the Marina's jetty, with the dark mouths of the organ's pipes among them.
 *
 * The paddock and the labyrinth are draped on the ground (`"drape": true`): every vertex follows the slope.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { box, prism, type Rgb } from '../../models.ts'
import { placed } from '../kit.ts'
import { surfaceTag } from '../../cartoon-material.ts'

const hash = (i: number, k: number): number => { const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return s - Math.floor(s) }

const POST: Rgb = [0.42, 0.34, 0.26]
const WIRE: Rgb = [0.5, 0.5, 0.5]
const BISON: Rgb = [0.22, 0.16, 0.12]
const MANE: Rgb = [0.34, 0.24, 0.16]
const HORN: Rgb = [0.12, 0.11, 0.1]

/** a bison facing +x turned by `a`: a deep shaggy forequarter and hump, a lower hindquarter, a heavy head held low */
function bison(out: MeshBuilder, x: number, z: number, a: number, grazing: boolean): void {
  const ca = Math.cos(a), sa = Math.sin(a)
  const P = (u: number, v: number): [number, number] => [x + ca * u - sa * v, z + sa * u + ca * v]
  const piece = (u: number, y: number, hu: number, hy: number, hv: number, c: Rgb): void => {
    const [px, pz] = P(u, 0)
    box(out, px, y, pz, Math.abs(ca) * hu + Math.abs(sa) * hv, hy, Math.abs(sa) * hu + Math.abs(ca) * hv, c, 0)
  }
  piece(-0.75, 1.0, 0.7, 0.42, 0.5, BISON)            // hindquarter
  piece(0.3, 1.18, 0.6, 0.62, 0.62, MANE)             // forequarter
  piece(0.25, 1.75, 0.45, 0.2, 0.42, MANE)            // the hump
  const hy = grazing ? 0.45 : 0.95
  piece(1.05, hy, 0.32, 0.3, 0.32, MANE)              // the head
  for (const s of [-1, 1]) { const [hx, hz] = P(1.05, s * 0.36); box(out, hx, hy + 0.3, hz, 0.06, 0.1, 0.06, HORN, 0) }
  // legs
  for (const u of [-1.1, 0.55]) for (const s of [-1, 1]) { const [lx, lz] = P(u, s * 0.3); box(out, lx, 0.32, lz, 0.1, 0.32, 0.1, BISON, 0) }
}

export function bisonPaddock(out: MeshBuilder, fit: Fit): void {
  const hx = fit.hx, hz = fit.hz
  // the fence: posts every 4 m, three wires
  const run = (x0: number, z0: number, x1: number, z1: number): void => {
    const L = Math.hypot(x1 - x0, z1 - z0)
    const n = Math.max(1, Math.round(L / 4))
    for (let i = 0; i <= n; i++) box(out, x0 + ((x1 - x0) * i) / n, 0.7, z0 + ((z1 - z0) * i) / n, 0.07, 0.7, 0.07, POST, 0)
    for (const y of [0.45, 0.85, 1.25]) {
      for (let i = 0; i < n; i++) {
        const ax = x0 + ((x1 - x0) * i) / n, az = z0 + ((z1 - z0) * i) / n
        const bx = x0 + ((x1 - x0) * (i + 1)) / n, bz = z0 + ((z1 - z0) * (i + 1)) / n
        box(out, (ax + bx) / 2, y, (az + bz) / 2, Math.max(0.015, Math.abs(bx - ax) / 2), 0.015, Math.max(0.015, Math.abs(bz - az) / 2), WIRE, 0)
      }
    }
  }
  run(-hx, -hz, hx, -hz); run(hx, -hz, hx, hz); run(hx, hz, -hx, hz); run(-hx, hz, -hx, -hz)
  // the herd, loosely together in the middle of the meadow
  for (let i = 0; i < 12; i++) {
    const x = (hash(i, 1) * 2 - 1) * hx * 0.55
    const z = (hash(i, 2) * 2 - 1) * hz * 0.55
    bison(out, x, z, hash(i, 3) * Math.PI * 2, hash(i, 4) < 0.7)
  }
}

const STONE: Rgb = [0.6, 0.58, 0.54]

export function landsEndLabyrinth(out: MeshBuilder, fit: Fit): void {
  stoneRings(out, fit, 7, STONE)
}

/**
 * THE BERNAL HILL LABYRINTH (labyrinthlocator.org: 37.7430988, −122.4140468): in the old quarry on the hill's south-west
 * corner, a three-circuit classical labyrinth laid in May 2008 in the hill's own reddish rocks — not in OSM (#278's
 * "a location would let it be drawn like Lands End's", 2026-10-04).
 */
export function bernalLabyrinth(out: MeshBuilder, fit: Fit): void {
  stoneRings(out, fit, 4, [0.56, 0.38, 0.3])
}

/** Rings of loose stones on the ground, each broken where the path turns, the break walking round as they go in. */
function stoneRings(out: MeshBuilder, fit: Fit, rings: number, colour: Rgb): void {
  const R = Math.min(fit.hx, fit.hz) - 0.5
  for (let k = 1; k <= rings; k++) {
    const r = (R * k) / rings
    const n = Math.round((2 * Math.PI * r) / 0.45)
    // each circuit is broken where the path turns: a gap that walks round as the rings go in
    const gap = (k * 2.1) % (Math.PI * 2)
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2
      const d = Math.abs(((a - gap + Math.PI * 3) % (Math.PI * 2)) - Math.PI)
      if (d < 0.9 / r + 0.08) continue
      const s = 0.1 + hash(k * 100 + i, 1) * 0.06
      box(out, Math.cos(a) * r, s * 0.6, Math.sin(a) * r, s, s * 0.6, s, colour, 0)
    }
  }
  box(out, 0, 0.12, 0, 0.3, 0.12, 0.3, colour, 0)
}

/**
 * GRACE CATHEDRAL'S OUTDOOR LABYRINTH (OSM n9010894444, "Grace Cathedral Labyrinth"): the eleven-circuit Chartres
 * pattern laid in terrazzo on the cathedral's plaza — pale stone with the circuits' walls as dark lines and the
 * six-petalled rose at the centre (2026-10-04, the labyrinths queue item; it was not drawn). Flat on the plaza, the
 * lines a hand proud of the pale disc so they do not fight it.
 */
export function graceLabyrinth(out: MeshBuilder, fit: Fit): void {
  const R = Math.max(5, Math.min(fit.hx, fit.hz))
  const PALE: Rgb = [0.62, 0.6, 0.57], LINE: Rgb = [0.3, 0.29, 0.29]
  const disc = (r: number, y: number, c: Rgb): void => {
    const n = 48
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2
      out.quad([[0, y, 0], [Math.cos(a1) * r, y, Math.sin(a1) * r], [Math.cos(a0) * r, y, Math.sin(a0) * r], [0, y, 0]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], c, 0)
    }
  }
  disc(R, 0.04, PALE)
  // the twelve walls of the eleven circuits, each broken where the path turns through it; the entrance at −z
  for (let k = 0; k <= 11; k++) {
    const r = R * (0.25 + (0.73 * k) / 11)
    const n = Math.round((2 * Math.PI * r) / 0.35)
    const turn = k === 11 ? -Math.PI / 2 : ((k * 1.7) % 2) < 1 ? 0 : Math.PI
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2
      const d = Math.abs(((a - turn + Math.PI * 3) % (Math.PI * 2)) - Math.PI)
      if (d * r < 0.45) continue
      const a1 = ((i + 1) / n) * Math.PI * 2
      out.quad([[Math.cos(a) * (r - 0.04), 0.06, Math.sin(a) * (r - 0.04)], [Math.cos(a1) * (r - 0.04), 0.06, Math.sin(a1) * (r - 0.04)], [Math.cos(a1) * (r + 0.04), 0.06, Math.sin(a1) * (r + 0.04)], [Math.cos(a) * (r + 0.04), 0.06, Math.sin(a) * (r + 0.04)]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], LINE, 0)
    }
  }
  // the rose: six petals round the centre
  for (let p = 0; p < 6; p++) {
    const a = (p / 6) * Math.PI * 2
    const cx = Math.cos(a) * R * 0.13, cz = Math.sin(a) * R * 0.13
    const n = 12, r = R * 0.1
    for (let i = 0; i < n; i++) {
      const b0 = (i / n) * Math.PI * 2, b1 = ((i + 1) / n) * Math.PI * 2
      out.quad([[cx + Math.cos(b0) * (r - 0.04), 0.06, cz + Math.sin(b0) * (r - 0.04)], [cx + Math.cos(b1) * (r - 0.04), 0.06, cz + Math.sin(b1) * (r - 0.04)], [cx + Math.cos(b1) * (r + 0.04), 0.06, cz + Math.sin(b1) * (r + 0.04)], [cx + Math.cos(b0) * (r + 0.04), 0.06, cz + Math.sin(b0) * (r + 0.04)]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], LINE, 0)
    }
  }
}

const MARBLE: Rgb = [0.82, 0.8, 0.76]

/**
 * THE WAVE ORGAN (Peter Richards and George Gonzalez, 1986), at the tip of the Marina's jetty (OSM n590952130): a
 * little stepped amphitheatre facing the bay, built of carved granite and marble from a demolished cemetery — kerbs,
 * column drums, a fallen fluted shaft, panels with their mouldings still on — and through the stone, at every height
 * and angle, the organ's pipes: grey concrete and PVC, each ending in a flared mouth you put your ear to (owner,
 * 2026-10-03: "there, but not recognizable" — it was a few rows of boxes). Its back (−z) is the jetty, its front (+z)
 * steps down to the water.
 */
export function waveOrgan(out: MeshBuilder, fit: Fit): void {
  /*
   * (Re-cut 2026-10-06 — owner, of the old one: "i'm not sure what it's supposed to be". It was a scatter of white boxes
   * and black posts. Now it reads as what it is: a small grey stone amphitheatre stepping down into the bay, its seats
   * long coursed runs of granite, a horseshoe wall round the back, the pipes standing up through the seats in grey
   * concrete with pale mouths — not black bollards.)
   */
  const R = Math.max(8, Math.min(fit.hx, fit.hz * 1.4))
  const G1: Rgb = [0.5, 0.5, 0.49], G2: Rgb = [0.42, 0.42, 0.41], G3: Rgb = [0.58, 0.57, 0.54]
  const stone = (k: number): Rgb => (hash(k, 5) < 0.15 ? MARBLE : hash(k, 6) < 0.5 ? G1 : hash(k, 7) < 0.5 ? G2 : G3)
  const tag = surfaceTag('granite')
  // the floor of the bowl, stone flags
  box(out, 0, 0.05, -R * 0.05, R * 0.95, 0.05, R * 0.6, [0.47, 0.46, 0.44], tag)
  // the horseshoe wall round the back, two courses of big blocks, open to the bay (+z)
  const ring = (r: number, y0: number, h: number, depth: number, n: number, k0: number): void => {
    for (let i = 0; i < n; i++) {
      const a0 = Math.PI * (1 + (i / n)), a1 = Math.PI * (1 + ((i + 1) / n))
      const am = (a0 + a1) / 2
      const x = Math.cos(am) * r, z = Math.sin(am) * r * 0.72
      const seg = Math.hypot(Math.cos(a1) * r - Math.cos(a0) * r, (Math.sin(a1) - Math.sin(a0)) * r * 0.72) / 2
      const k = k0 + i
      const ang = Math.atan2(-(Math.sin(a1) - Math.sin(a0)) * 0.72, Math.cos(a1) - Math.cos(a0))
      const part = new (out.constructor as new () => MeshBuilder)()
      box(part, 0, y0 + h / 2, 0, seg - 0.04, h / 2 + (hash(k, 3) - 0.5) * 0.08, depth / 2, stone(k), tag)
      placed(out, part, ang, x, z)
    }
  }
  ring(R, 0, 0.55, 0.9, 16, 0)
  ring(R, 0.55, 0.5, 0.75, 13, 40)
  // the seats: three tiers inside the wall, each lower toward the water, long runs of coursed stone
  for (let t = 0; t < 3; t++) ring(R * (0.82 - t * 0.17), 0, 0.85 - t * 0.25, 0.8, 12 - t * 2, 100 + t * 20)
  // the front: steps going down into the bay, the lowest under the water
  for (let k = 0; k < 5; k++) box(out, 0, -0.2 - k * 0.32, R * 0.45 + k * 0.55, R * 0.62 - k * 0.5, 0.16, 0.28, k % 2 ? G2 : G1, tag)
  // cemetery pieces among the stones: column drums standing, a fluted shaft lying, a carved panel
  for (let i = 0; i < 4; i++) {
    const a = Math.PI * (1.15 + 0.7 * hash(i, 11)), r = R * (0.55 + 0.25 * hash(i, 12))
    prism(out, Math.cos(a) * r, Math.sin(a) * r * 0.72, 0, 0.7 + hash(i, 13) * 0.6, 0.32, 12, MARBLE, 0)
  }
  {
    const n = 12, L = 2.4, rad = 0.3, cx = -R * 0.3, cz = R * 0.15
    for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2; box(out, cx, rad + Math.sin(a) * rad, cz + Math.cos(a) * rad, L / 2, 0.07, 0.07, MARBLE, 0) }
  }
  // the pipes: in clusters through the seats, grey concrete and PVC, each ending in a pale flared mouth at ear height
  const PIPES: Rgb[] = [[0.62, 0.62, 0.6], [0.7, 0.7, 0.68], [0.36, 0.37, 0.38]]
  for (let i = 0; i < 22; i++) {
    const cluster = i % 6
    const a = Math.PI * (1.1 + (0.8 * (cluster + 0.5)) / 6) + (hash(i, 21) - 0.5) * 0.15
    const r = R * (0.5 + 0.4 * hash(i, 22))
    const x = Math.cos(a) * r, z = Math.sin(a) * r * 0.72
    const h = 0.9 + hash(i, 23) * 0.9
    const rad = 0.09 + hash(i, 24) * 0.06
    prism(out, x, z, 0, h, rad, 10, PIPES[Math.floor(hash(i, 25) * PIPES.length)], 0)
    prism(out, x, z, h, h + 0.2, rad * 1.1, 10, [0.78, 0.77, 0.74], 0, rad * 2, true)
  }
}


const MARBLE_W: Rgb = [0.9, 0.89, 0.85]

/**
 * PORTALS OF THE PAST (way/1193781040), on Lloyd Lake in Golden Gate Park: the marble portico of the A. N. Towne
 * house on Nob Hill, all that stood after 1906, moved here in 1909 — six slender Ionic columns in a row on a stepped
 * base under a plain entablature, open to the sky, mirrored in the lake. OSM maps it as a building, so the city drew
 * a solid box; it is a frame you can see through.
 */
export function portalsOfThePast(out: MeshBuilder, fit: Fit): void {
  const W = Math.max(5, fit.hx)
  const D = Math.min(Math.max(1.5, fit.hz), 3)
  // the stepped base
  for (let k = 0; k < 3; k++) box(out, 0, 0.18 + k * 0.36, 0, W + 1.2 - k * 0.4, 0.18, D + 1.0 - k * 0.35, MARBLE_W, 0)
  const y0 = 1.08
  const H = 7.2
  // six columns: base, shaft (tapered), the volute capital
  for (let i = 0; i < 6; i++) {
    const x = -W + 0.6 + (i * (2 * W - 1.2)) / 5
    box(out, x, y0 + 0.15, 0, 0.42, 0.15, 0.42, MARBLE_W, 0)
    prism(out, x, 0, y0 + 0.3, y0 + H - 0.4, 0.32, 12, MARBLE_W, 0, 0.27, false)
    box(out, x, y0 + H - 0.25, 0, 0.48, 0.15, 0.3, MARBLE_W, 0)
    for (const s of [-1, 1]) box(out, x + s * 0.42, y0 + H - 0.3, 0, 0.1, 0.16, 0.32, MARBLE_W, 0)
  }
  // the entablature: architrave, frieze, cornice
  box(out, 0, y0 + H + 0.25, 0, W + 0.1, 0.25, 0.45, MARBLE_W, 0)
  box(out, 0, y0 + H + 0.8, 0, W + 0.1, 0.3, 0.42, [0.86, 0.85, 0.81], 0)
  box(out, 0, y0 + H + 1.25, 0, W + 0.45, 0.15, 0.7, MARBLE_W, 0)
}

const RUBBLE: Rgb = [0.56, 0.54, 0.5]
const CAP: Rgb = [0.7, 0.68, 0.64]

/**
 * THE PARAPET at Sutro Heights (the viewpoint node n1709352211): the raised terrace in front of where Adolph Sutro's
 * house stood, its rough stone retaining walls topped by a crenellated parapet, a flight of steps up from the
 * garden; the view from it is the Cliff House, Seal Rocks and the whole of Ocean Beach. Not in OSM's buildings.
 */
export function sutroParapet(out: MeshBuilder, fit: Fit): void {
  const hx = Math.max(10, fit.hx), hz = Math.max(7, fit.hz)
  const H = 2.6
  // the terrace: walls down past the slope, a gravel top
  box(out, 0, (H - 3) / 2, 0, hx, (H + 3) / 2, hz, RUBBLE, 0)
  box(out, 0, H + 0.02, 0, hx - 0.3, 0.02, hz - 0.3, [0.72, 0.68, 0.6], 0)
  // the parapet round three sides (the garden side is open to the steps): a low wall with merlons
  const wall = (x0: number, z0: number, x1: number, z1: number): void => {
    const L = Math.hypot(x1 - x0, z1 - z0)
    const n = Math.max(2, Math.round(L / 1.6))
    const ax = Math.abs(x1 - x0) > Math.abs(z1 - z0)
    box(out, (x0 + x1) / 2, H + 0.45, (z0 + z1) / 2, ax ? L / 2 : 0.3, 0.45, ax ? 0.3 : L / 2, RUBBLE, 0)
    for (let i = 0; i < n; i += 2) {
      const t = (i + 0.5) / n
      box(out, x0 + (x1 - x0) * t, H + 1.1, z0 + (z1 - z0) * t, ax ? L / n / 2 : 0.33, 0.2, ax ? 0.33 : L / n / 2, CAP, 0)
    }
  }
  wall(-hx, hz, hx, hz)
  wall(-hx, -hz, -hx, hz)
  wall(hx, -hz, hx, hz)
  // the steps up from the garden at −z
  for (let k = 0; k < 8; k++) box(out, 0, (k + 1) * (H / 8) / 2, -hz - 0.35 * (8 - k), 2.2, (k + 1) * (H / 8) / 2, 0.18, CAP, 0)
}

/**
 * THE 16TH AVENUE TILED STEPS (Aileen Barr and Colette Crutcher, 2005), Moraga Street between 15th and 16th: 163
 * steps whose risers are one mosaic read from the bottom — the sea at the foot, rising through blues into the sky,
 * a sun at the top, fish and birds among them. From OSM's steps ways (w39333460…), 67 m from 16th Avenue (low, west)
 * up to 15th (east). Draped on the ground; local +x is uphill (east), each riser faces down the stairs (−x).
 */
export function tiledSteps(out: MeshBuilder, fit: Fit): void { mosaicSteps(out, fit, 163, seaToSun) }

/** the Moraga palette: sea at the foot through sky to a sun near the top */
function seaToSun(t: number, zc: number, i: number, c: number): Rgb {
  const mix = (a: Rgb, b: Rgb, t: number): Rgb => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
  const SEA: Rgb = [0.05, 0.22, 0.42], SEA2: Rgb = [0.1, 0.45, 0.6], SKY: Rgb = [0.45, 0.7, 0.9], SKY2: Rgb = [0.75, 0.85, 0.95]
  const SUN: Rgb = [0.98, 0.78, 0.2], SUN2: Rgb = [0.95, 0.45, 0.15]
  let col: Rgb = t < 0.35 ? mix(SEA, SEA2, t / 0.35) : t < 0.75 ? mix(SKY, SKY2, (t - 0.35) / 0.4) : mix(SKY2, [0.95, 0.9, 0.8], (t - 0.75) / 0.25)
  // the sun, a disc near the top; a few fish low down and birds in the sky, as specks of colour
  const ds = Math.hypot((t - 0.88) * 3.2, zc * 0.9)
  if (ds < 0.45) col = mix(SUN, SUN2, ds / 0.45)
  const h = Math.abs(Math.sin(i * 12.9898 + c * 78.233) * 43758.5) % 1
  if (t < 0.33 && h < 0.08) col = [0.95, 0.55, 0.15]
  if (t > 0.4 && t < 0.75 && h < 0.05) col = [0.2, 0.2, 0.25]
  return col
}

/** A stair of `N` mosaic risers along local x (uphill +x), each riser `CELLS` tiles across, coloured by `colour`. */
function mosaicSteps(out: MeshBuilder, fit: Fit, N: number, colour: (t: number, zc: number, i: number, c: number) => Rgb): void {
  const L = fit.hx, W = Math.min(fit.hz, 2.2)
  const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  const CELLS = 8
  for (let i = 0; i < N; i++) {
    const x = -L + ((i + 0.5) / N) * 2 * L
    const t = i / (N - 1)
    for (let c = 0; c < CELLS; c++) {
      const z0 = -W + (c / CELLS) * 2 * W, z1 = -W + ((c + 1) / CELLS) * 2 * W
      const zc = (z0 + z1) / 2 / W                              // −1..1 across the stair
      const col = colour(t, zc, i, c)
      // the riser, 17 cm, standing at the step's front, facing down the stairs; and the front of the tread in the
      // same colour — on the draped slope the treads are most of what shows from the foot of the stairs
      const xn = x + (2 * L) / N
      out.quad([[x, 0, z1], [x, 0, z0], [x, 0.17, z0], [x, 0.17, z1]], [-1, 0, 0], uv, col, 0)
      out.quad([[x, 0.17, z0], [x, 0.17, z1], [x + (xn - x) * 0.7, 0.17, z1], [x + (xn - x) * 0.7, 0.17, z0]], [0, 1, 0], uv, col, 0)
    }
    // the back of the tread, pale concrete
    const xn = x + (2 * L) / N
    out.quad([[x + (xn - x) * 0.7, 0.17, -W], [x + (xn - x) * 0.7, 0.17, W], [xn, 0.17, W], [xn, 0.17, -W]], [0, 1, 0], uv, [0.7, 0.69, 0.66], 0)
  }
  // the handrails either side
  for (const s of [-1, 1]) {
    for (let k = 0; k <= 16; k++) box(out, -L + (k * 2 * L) / 16, 0.5, s * (W + 0.1), 0.03, 0.5, 0.03, [0.3, 0.32, 0.3], 0)
    for (let k = 0; k < 16; k++) box(out, -L + ((k + 0.5) * 2 * L) / 16, 1.0, s * (W + 0.1), L / 16, 0.025, 0.025, [0.3, 0.32, 0.3], 0)
  }
}

/**
 * THE HIDDEN GARDEN STEPS (the same artists, 2013), 16th Avenue between Kirkham and Lawton (OSM way/47174862): 148
 * risers of a garden climbing the hill — green stems and leaves rising from dark soil at the foot, a salamander and
 * butterflies, flowers of every colour, a pale sky with a dragonfly at the top.
 */
export function hiddenGardenSteps(out: MeshBuilder, fit: Fit): void { mosaicSteps(out, fit, 148, garden) }

function garden(t: number, zc: number, i: number, c: number): Rgb {
  const h = Math.abs(Math.sin(i * 12.9898 + c * 78.233) * 43758.5) % 1
  const SOIL: Rgb = [0.3, 0.2, 0.12], LEAF: Rgb = [0.2, 0.5, 0.22], LEAF2: Rgb = [0.45, 0.7, 0.3], SKY: Rgb = [0.78, 0.88, 0.92]
  const FLOWERS: Rgb[] = [[0.9, 0.2, 0.3], [0.95, 0.75, 0.15], [0.6, 0.3, 0.75], [0.95, 0.5, 0.2], [0.95, 0.95, 0.9]]
  if (t < 0.12) return h < 0.15 ? LEAF : SOIL
  if (t > 0.85) return h < 0.04 ? [0.2, 0.45, 0.6] : SKY
  // stems in columns, leaves round them, flowers scattered thicker toward the top
  const stem = Math.abs(((zc + 1) * 4 + Math.sin(t * 9) * 0.3) % 1 - 0.5) < 0.12
  if (h < 0.06 + t * 0.16) return FLOWERS[Math.floor(h * 100) % FLOWERS.length]
  return stem ? LEAF : (h < 0.5 ? LEAF2 : [0.32, 0.6, 0.28])
}

export const PARK_SIGHTS: Record<string, (out: MeshBuilder, fit: Fit) => void> = { bisonPaddock, landsEndLabyrinth, bernalLabyrinth, graceLabyrinth, waveOrgan, portalsOfThePast, sutroParapet, tiledSteps, hiddenGardenSteps }
