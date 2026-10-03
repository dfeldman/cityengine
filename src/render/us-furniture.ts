/**
 * The American street's furniture (SF_PLAN.md §6; user: "it's America so it has stoplights, more signs, billboards
 * and ads"), placed where OSM maps it (PackedFurniture kinds `stop`, `busstop`, `billboard`, `postbox`). Shared: New
 * York, Chicago and San Francisco all have them; the colours that differ come in through the region.
 *
 * - **the stop sign**: the red octagon on its pole, turned to face the traffic it stops;
 * - **the bus stop**: the pole with its flag — in San Francisco Muni's yellow band round the pole and the orange-red
 *   sign; a shelter where the stop is a big one;
 * - **the billboard**: a big panel on its steel post and catwalk, the ad on it a composition of colour blocks and
 *   "type" that varies board to board — the rhythm of a billboard, which is all a rider reads at 20 km/h;
 * - **the post box**: the USPS blue box on its legs.
 *
 * Local frames: +z toward the street, the foot at the origin.
 */
import type { MeshBuilder } from './buildings.ts'
import { box, prism, strut, EMIT, FIXED, type Rgb } from './models.ts'

const STEEL: Rgb = [0.5, 0.52, 0.54]
const DARK: Rgb = [0.14, 0.14, 0.15]
const WHITE: Rgb = [0.94, 0.94, 0.92]

export function stopSign(out: MeshBuilder): void {
  box(out, 0, 1.2, 0, 0.035, 1.2, 0.035, STEEL, FIXED)
  // the octagon, a white border and the red face, on the side toward the traffic (+z)
  const oct = (r: number, z: number, c: Rgb): void => {
    for (let i = 0; i < 8; i++) {
      const a0 = (i / 8) * Math.PI * 2 + Math.PI / 8
      const a1 = ((i + 1) / 8) * Math.PI * 2 + Math.PI / 8
      out.quad([[0, 2.25, z], [Math.cos(a0) * r, 2.25 + Math.sin(a0) * r, z], [Math.cos(a1) * r, 2.25 + Math.sin(a1) * r, z], [0, 2.25, z]],
        [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]], c, FIXED)
    }
  }
  oct(0.4, 0.05, WHITE)
  oct(0.36, 0.055, [0.78, 0.1, 0.1])
  // "STOP": a white bar of letters
  box(out, 0, 2.25, 0.06, 0.24, 0.07, 0.005, WHITE, FIXED)
  oct(0.4, 0.035, [0.6, 0.6, 0.62])        // the back
}

/** San Francisco's Muni stop: the yellow band round the pole, the sign flag at the top. */
export function muniStop(out: MeshBuilder): void {
  box(out, 0, 1.5, 0, 0.04, 1.5, 0.04, STEEL, FIXED)
  box(out, 0, 1.9, 0, 0.05, 0.25, 0.05, [0.95, 0.78, 0.1], FIXED)        // the yellow band
  box(out, 0.28, 2.8, 0, 0.26, 0.18, 0.02, [0.86, 0.3, 0.14], FIXED)     // the flag: Muni's orange-red
  box(out, 0.28, 2.8, 0.021, 0.18, 0.05, 0.002, WHITE, FIXED)
}

/** A plain bus stop: the pole and its flag, the city's own colours left to the flag. */
export function plainStop(out: MeshBuilder): void {
  box(out, 0, 1.5, 0, 0.04, 1.5, 0.04, STEEL, FIXED)
  box(out, 0.26, 2.75, 0, 0.24, 0.2, 0.02, [0.2, 0.4, 0.7], FIXED)
  box(out, 0.26, 2.75, 0.021, 0.16, 0.05, 0.002, WHITE, FIXED)
}

/** A glass bus shelter: its roof, the back and end panels, the bench, the lit ad panel at one end. */
export function busShelter(out: MeshBuilder, seed = 0): void {
  const glass: Rgb = [0.55, 0.64, 0.68]
  box(out, 0, 2.5, 0, 1.9, 0.05, 0.8, DARK, FIXED)
  for (const x of [-1.85, 1.85]) box(out, x, 1.25, -0.75, 0.04, 1.25, 0.04, DARK, FIXED)
  box(out, 0, 1.3, -0.78, 1.8, 0.95, 0.02, glass, FIXED)
  box(out, -1.85, 1.3, -0.1, 0.02, 0.95, 0.65, glass, FIXED)
  box(out, 0, 0.45, -0.55, 1.4, 0.04, 0.18, STEEL, FIXED)
  // the ad panel at the open end, lit from inside
  box(out, 1.85, 1.3, -0.1, 0.06, 0.95, 0.6, DARK, FIXED)
  adFace(out, [1.92, 1.3, -0.1], 0.58, 0.9, 'x', seed)
}

/** An ad, painted as blocks: a background, a photo block, a headline, a line of small type, a logo. */
function adFace(out: MeshBuilder, c: [number, number, number], hw: number, hh: number, axis: 'x' | 'z', seed: number): void {
  const r = (k: number): number => ((Math.imul(seed ^ (k * 0x9e3779b1), 0x85ebca6b) >>> 0) % 1000) / 1000
  const palettes: Rgb[][] = [
    [[0.96, 0.84, 0.2], [0.1, 0.1, 0.12], [0.9, 0.2, 0.2]],
    [[0.12, 0.36, 0.72], [0.96, 0.96, 0.94], [0.95, 0.72, 0.2]],
    [[0.92, 0.92, 0.9], [0.8, 0.1, 0.14], [0.14, 0.14, 0.16]],
    [[0.1, 0.12, 0.14], [0.96, 0.96, 0.94], [0.3, 0.8, 0.5]],
    [[0.88, 0.3, 0.5], [0.98, 0.94, 0.9], [0.2, 0.2, 0.3]],
    [[0.2, 0.6, 0.64], [0.98, 0.98, 0.96], [0.98, 0.5, 0.2]],
  ]
  const [bg, ink, accent] = palettes[Math.floor(r(1) * palettes.length)]
  const face = (u: number, v: number, w: number, h: number, col: Rgb, lift: number, glow = false): void => {
    const [x, y, z] = c
    if (axis === 'z') box(out, x + u, y + v, z + lift, w, h, 0.002, col, glow ? EMIT : FIXED)
    else box(out, x + lift, y + v, z + u, 0.002, h, w, col, glow ? EMIT : FIXED)
  }
  face(0, 0, hw, hh, bg, 0, true)
  /*
   * Reworked 2026-10-02 (owner: "billboards look really bad"): what a bulletin reads as from the street is a PHOTO
   * on one side and three or four huge words on the other. The photo: a sky band over a horizon band, and the
   * product in it — a round can or a bottle or a phone, by seed; the words: two heavy ink lines, a lighter third;
   * the brand's mark in a corner.
   */
  const s = r(2) < 0.5 ? -1 : 1
  const px = s * hw * 0.48
  const skies: Rgb[] = [[0.45, 0.7, 0.92], [0.98, 0.72, 0.4], [0.2, 0.22, 0.3], [0.85, 0.88, 0.9]]
  const sky = skies[Math.floor(r(3) * skies.length)]
  face(px, hh * 0.25, hw * 0.5, hh * 0.72, sky, 0.003, true)
  face(px, -hh * 0.5, hw * 0.5, hh * 0.47, accent, 0.004, true)
  const prod = Math.floor(r(4) * 3)
  if (prod === 0) face(px, -hh * 0.05, hw * 0.12, hh * 0.55, ink, 0.006)                                  // a can
  else if (prod === 1) { face(px, -hh * 0.15, hw * 0.08, hh * 0.45, ink, 0.006); face(px, hh * 0.38, hw * 0.035, hh * 0.12, ink, 0.006) } // a bottle
  else face(px, -hh * 0.02, hw * 0.13, hh * 0.62, [0.08, 0.08, 0.1], 0.006)                                // a phone
  const tx = -s * hw * 0.42
  face(tx, hh * 0.42, hw * 0.44, hh * 0.2, ink, 0.004)
  face(tx, hh * 0.0, hw * 0.4, hh * 0.2, ink, 0.004)
  face(tx, -hh * 0.36, hw * 0.3, hh * 0.08, ink, 0.004)
  face(-s * hw * 0.84, -hh * 0.72, hw * 0.1, hh * 0.18, accent, 0.004, true)
}

/** A billboard: 14.6 × 4.3 m (the "bulletin"), on a steel post, with its catwalk and the lamps along it. */
export function billboard(out: MeshBuilder, seed = 0): void {
  const top = 11
  const hw = 7.3
  const hh = 2.15
  strut(out, [0, 0, -0.6], [0, top - hh, -0.6], 0.9, 0.9, STEEL, FIXED)
  box(out, 0, top, -0.35, hw + 0.2, hh + 0.2, 0.2, DARK, FIXED)                 // the frame
  adFace(out, [0, top, -0.13], hw, hh, 'z', seed)
  box(out, 0, top - hh - 0.35, 0.3, hw, 0.05, 0.5, STEEL, FIXED)                // the catwalk
  for (let x = -hw + 1; x < hw; x += 3.2) {
    strut(out, [x, top - hh - 0.3, 0.5], [x, top - hh - 0.1, 1.2], 0.06, 0.06, STEEL, FIXED)
    box(out, x, top - hh - 0.05, 1.25, 0.2, 0.06, 0.12, [1, 0.96, 0.85], EMIT)
  }
  // the back, plain steel
  box(out, 0, top, -0.56, hw, hh, 0.02, [0.42, 0.44, 0.46], FIXED)
}

/** The USPS collection box: the blue box on its four legs, the rounded top, the pull-down slot. */
export function uspsBox(out: MeshBuilder): void {
  const blue: Rgb = [0.12, 0.24, 0.52]
  for (const [x, z] of [[-0.22, -0.2], [0.22, -0.2], [-0.22, 0.2], [0.22, 0.2]]) box(out, x, 0.12, z, 0.03, 0.12, 0.03, blue, FIXED)
  box(out, 0, 0.72, 0, 0.3, 0.48, 0.26, blue, FIXED)
  prism(out, 0, 0, 1.2, 1.36, 0.3, 10, blue, FIXED, 0.22)
  box(out, 0, 1.0, 0.27, 0.18, 0.04, 0.01, [0.72, 0.72, 0.7], FIXED)
  box(out, 0, 0.6, 0.265, 0.12, 0.08, 0.005, WHITE, FIXED)                        // the eagle
}

/**
 * A bank of newspaper racks at a corner: three to six boxes side by side, each a publication's colour, with its
 * window and its coin box, some chained to the next. Along +x; the fronts toward +z (the street).
 */
export function newsRacks(out: MeshBuilder, seed = 0): void {
  const r = (k: number): number => ((Math.imul(seed ^ (k * 0x9e3779b1), 0x85ebca6b) >>> 0) % 1000) / 1000
  const colours: Rgb[] = [[0.12, 0.28, 0.6], [0.78, 0.12, 0.1], [0.95, 0.78, 0.12], [0.9, 0.9, 0.88], [0.1, 0.42, 0.24],
    [0.1, 0.1, 0.11], [0.9, 0.45, 0.1], [0.45, 0.2, 0.55]]
  const n = 3 + Math.floor(r(1) * 4)
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * 0.5
    const c = colours[Math.floor(r(i + 2) * colours.length)]
    const tall = r(i + 20) < 0.3 ? 0.62 : 0.52
    box(out, x, tall, 0, 0.23, tall, 0.2, c, FIXED)
    box(out, x, tall + 0.1, 0.205, 0.17, 0.2, 0.004, [0.62, 0.7, 0.74], FIXED)     // the window
    box(out, x, tall * 2 + 0.03, -0.05, 0.12, 0.03, 0.1, STEEL, FIXED)             // the coin box
  }
}

/** A single-space parking meter on its post (a grey head with its window), at the kerb. */
export function parkingMeter(out: MeshBuilder): void {
  box(out, 0, 0.6, 0, 0.035, 0.6, 0.035, [0.25, 0.26, 0.28], FIXED)
  box(out, 0, 1.3, 0, 0.1, 0.14, 0.08, [0.42, 0.44, 0.47], FIXED)
  box(out, 0, 1.36, 0.081, 0.07, 0.05, 0.003, [0.2, 0.26, 0.3], FIXED)
}

/**
 * A wooden utility pole: the tarred pole, a crossarm with its insulators, a transformer can on one in three, a
 * street-name sign sometimes. 11 m. The wires between poles are strung by the placer. The crossarm along ±x.
 */
export function utilityPole(out: MeshBuilder, seed = 0): void {
  const wood: Rgb = [0.34, 0.26, 0.18]
  strut(out, [0, 0, 0], [0, 11, 0], 0.14, 0.14, wood, FIXED)
  box(out, 0, 10.2, 0, 1.2, 0.06, 0.06, wood, FIXED)
  for (const x of [-1.05, -0.4, 0.4, 1.05]) box(out, x, 10.35, 0, 0.03, 0.09, 0.03, [0.6, 0.62, 0.6], FIXED)
  box(out, 0, 9.3, 0, 0.9, 0.05, 0.05, wood, FIXED)
  if (seed % 3 === 0) {
    // the transformer: a grey can bolted to the pole
    box(out, 0.28, 8.4, 0, 0.2, 0.45, 0.2, [0.52, 0.54, 0.55], FIXED)
  }
}

/**
 * MARKET STREET'S "PATH OF GOLD" lamp (1908-16, Arthur Putnam's base): a dark green fluted standard ~9 m tall on a
 * sculpted base, a trident head carrying three globes, the centre one highest. Lining Market from the Ferry Building
 * to Castro, they are what makes Market Street look like itself (appearance pass, 2026-10-02).
 */
export function pathOfGold(out: MeshBuilder): void {
  /*
   * The 1916 Path of Gold standard (Arthur Putnam's base, the trident head). Procedural until the GLB the owner asked
   * for (backlog: "render the path of gold lamps as glbs like sculptures"); this is the silhouette a rider reads:
   * a stepped plinth, a fat sculpted drum with relief panels on four sides, a collar, a fluted shaft with a ring
   * part-way up, and the three globes on curved arms.
   */
  const green: Rgb = [0.13, 0.2, 0.16]
  const dark: Rgb = [0.09, 0.14, 0.11]
  const glow: Rgb = [1.0, 0.94, 0.74]
  // the plinth, in two steps, and the sculpted drum
  prism(out, 0, 0, 0, 0.18, 0.52, 8, dark, FIXED, 0.5)
  prism(out, 0, 0, 0.18, 0.34, 0.44, 8, green, FIXED, 0.42)
  prism(out, 0, 0, 0.34, 1.35, 0.38, 8, green, FIXED, 0.3)
  // the relief panels: Putnam's four scenes (the pioneers, the bears, the settlers, the city) as proud tablets
  for (let k = 0; k < 4; k++) {
    const a = (k * Math.PI) / 2
    box(out, Math.sin(a) * 0.36, 0.82, Math.cos(a) * 0.36, Math.abs(Math.cos(a)) * 0.2 + 0.03, 0.34, Math.abs(Math.sin(a)) * 0.2 + 0.03, dark, FIXED)
  }
  prism(out, 0, 0, 1.35, 1.5, 0.34, 8, dark, FIXED, 0.22)
  prism(out, 0, 0, 1.5, 1.75, 0.2, 8, green, FIXED, 0.16)
  // the shaft, fluted (sixteen sides read as flutes at this size), a ring two-thirds up, a capital
  prism(out, 0, 0, 1.75, 8.0, 0.14, 16, green, FIXED, 0.09)
  prism(out, 0, 0, 5.6, 5.8, 0.16, 8, dark, FIXED, 0.16)
  prism(out, 0, 0, 8.0, 8.25, 0.12, 8, dark, FIXED, 0.18)
  // the arms: each a curve out and up in four short steps, a globe on its end; the middle globe higher on a finial
  for (const sx of [-1, 1]) {
    let x = 0.1, y = 8.2
    for (let k = 0; k < 4; k++) {
      const nx = x + 0.2, ny = y + 0.04 + k * 0.05
      box(out, sx * (x + nx) / 2, (y + ny) / 2, 0, 0.11, 0.05, 0.05, green, FIXED)
      x = nx; y = ny
    }
    box(out, sx * x, y + 0.12, 0, 0.05, 0.12, 0.05, green, FIXED)
    prism(out, sx * x, 0, y + 0.22, y + 0.3, 0.12, 8, dark, FIXED, 0.12)
    prism(out, sx * x, 0, y + 0.3, y + 0.78, 0.22, 10, glow, EMIT, 0.2)
  }
  prism(out, 0, 0, 8.25, 9.0, 0.06, 6, green, FIXED, 0.05)
  prism(out, 0, 0, 9.0, 9.08, 0.13, 8, dark, FIXED, 0.13)
  prism(out, 0, 0, 9.08, 9.58, 0.23, 10, glow, EMIT, 0.21)
  prism(out, 0, 0, 9.58, 9.75, 0.06, 6, green, FIXED, 0.01)
}
