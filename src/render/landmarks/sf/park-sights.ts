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
  const R = Math.min(fit.hx, fit.hz) - 0.5
  const rings = 7
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
      box(out, Math.cos(a) * r, s * 0.6, Math.sin(a) * r, s, s * 0.6, s, STONE, 0)
    }
  }
  box(out, 0, 0.12, 0, 0.3, 0.12, 0.3, STONE, 0)
}

const GRANITE: Rgb = [0.62, 0.6, 0.58]
const MARBLE: Rgb = [0.82, 0.8, 0.76]
const PIPE: Rgb = [0.16, 0.17, 0.18]

export function waveOrgan(out: MeshBuilder, fit: Fit): void {
  const hx = Math.max(8, fit.hx), hz = Math.max(6, fit.hz)
  // stepped terraces of salvaged stone, falling toward the water at +z
  for (let t = 0; t < 4; t++) {
    const y = 1.6 - t * 0.45
    const z0 = -hz + t * (hz * 0.45)
    for (let i = 0; i < 9; i++) {
      const x = -hx + (i + 0.5) * ((2 * hx) / 9) + (hash(t * 9 + i, 1) - 0.5) * 0.8
      const w = 0.6 + hash(t * 9 + i, 2) * 0.6
      box(out, x, y / 2, z0 + hash(t * 9 + i, 3) * 1.2, w, y / 2, 0.5 + hash(t * 9 + i, 4) * 0.5, hash(t * 9 + i, 5) < 0.4 ? MARBLE : GRANITE, 0)
    }
  }
  // the pipes' mouths: short dark tubes standing out of the stone
  for (let i = 0; i < 14; i++) {
    const x = (hash(i, 6) * 2 - 1) * hx * 0.85
    const z = (hash(i, 7) * 2 - 1) * hz * 0.8
    prism(out, x, z, 0, 0.5 + hash(i, 8) * 1.4, 0.16, 8, PIPE, 0, 0.16, true)
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

export const PARK_SIGHTS: Record<string, (out: MeshBuilder, fit: Fit) => void> = { bisonPaddock, landsEndLabyrinth, waveOrgan, portalsOfThePast, sutroParapet, tiledSteps, hiddenGardenSteps }
