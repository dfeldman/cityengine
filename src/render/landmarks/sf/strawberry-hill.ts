/**
 * STRAWBERRY HILL, the island in Stow Lake (owner, 2026-10-04: "put some more effort into Strawberry Hill. It's 400
 * feet tall, a dense wood, and has a huge artificial waterfall into the lake, and parts of the tea garden"; "it also
 * has many trails that should be on our trail network").
 *
 *  - HUNTINGTON FALLS (1893): from the reservoir near the summit, a cascade some 30 m down the island's east face
 *    into the lake, white water tumbling over dark boulders in a cleft of rock, widening into a pool at the foot.
 *    Drawn on the ground along OSM's stream (way/120479794, /120479802), its heights from the terrain (`groundAt`).
 *  - The GOLDEN GATE PAVILION (the Chinese Pavilion, a 1981 gift from Taipei; way/120479810), on the island's east
 *    shore: hexagonal, red columns, a concave celadon tile roof (the owner's photograph).
 *
 * The wood and the trails are zones (data/zones: `plant-strawberry-hill`, and `trails: 'bike'` on the hill's own).
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import type { Rgb } from '../../models.ts'
import { box, prism, strut } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'

/** the falls' line follows OSM's stream (way/120479794, /120479802) from the reservoir east to the lake */
export const FALLS_CENTRE = { x: -5464, z: -2693 }

const h = (a: number, b: number): number => { const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return v - Math.floor(v) }

export function huntingtonFalls(out: MeshBuilder, fit: Fit): void {
  /*
   * Straight down over rock (owner: "the falls should be straight down over rocks"): the stream leaves the reservoir
   * and drops in three SHEER falls, each over the face of a great step of rock, a short pool between, the last into
   * a churned pool at the lake's edge. Local frame: the stream's line along +x (rotateDeg 0, centre FALLS_CENTRE).
   */
  const g = fit.groundAt ?? ((x: number): number => Math.max(0, (22 - x) * 0.6))
  const rock = surfaceTag('granite')
  const ROCK: Rgb = [0.44, 0.42, 0.39], WATER: Rgb = [0.55, 0.68, 0.74], FOAM: Rgb = [0.93, 0.95, 0.96]
  const zAt = (x: number): number => -5 + ((x + 26) / 48) * 9
  const both = (q: [number, number, number][], n: [number, number, number], c: Rgb): void => {
    out.quad(q, n, [[0, 0], [1, 0], [1, 1], [0, 1]], c, 0)
    out.quad([...q].reverse() as [number, number, number][], [-n[0], -n[1], -n[2]], [[0, 0], [1, 0], [1, 1], [0, 1]], c, 0)
  }
  // the three faces, where the ground has fallen a third of the way each time
  const faces = [-14, 0, 16]
  let prevX = -26
  for (const [i, fx] of faces.entries()) {
    const topY = g(prevX, zAt(prevX)) + 0.6, baseY = g(fx + 5, zAt(fx + 5))
    const zc = zAt(fx), W = 6.5 - i
    // the step of rock: a mass of boulders from the ground up to the ledge, across the stream and either side
    for (let x = prevX; x <= fx; x += 2.5) for (const side of [-1, -0.4, 0.4, 1]) {
      const k = x * 7 + side * 13 + i
      const cz = zAt(x) + side * (W * 0.55 + h(k, 1))
      const top = topY + (Math.abs(side) > 0.5 ? 0.6 + h(k, 2) * 1.6 : -0.4)
      const r = 2 + h(k, 3) * 1.4
      prism(out, x, cz, g(x, cz) - 1, top, r, 6, [ROCK[0] + h(k, 4) * 0.08, ROCK[1] + h(k, 4) * 0.07, ROCK[2] + h(k, 4) * 0.05], rock, r * 0.75)
    }
    // the pool on the ledge, and the sheet of white water straight down its face
    both([[prevX, topY + 0.1, zAt(prevX) - 2], [prevX, topY + 0.1, zAt(prevX) + 2], [fx + 0.5, topY + 0.1, zc + 2], [fx + 0.5, topY + 0.1, zc - 2]], [0, 1, 0], WATER)
    for (let j = 0; j < 5; j++) {
      const zz = zc - 2 + j * 0.8, c = j % 2 ? FOAM : [0.82, 0.9, 0.94] as Rgb
      both([[fx + 1.6, topY + 0.1, zz], [fx + 1.6, topY + 0.1, zz + 0.8], [fx + 2.2, baseY + 0.3, zz + 0.8], [fx + 2.2, baseY + 0.3, zz]], [1, 0, 0], c)
    }
    prism(out, fx + 3.2, zc, baseY + 0.1, baseY + 0.5, 2.2, 10, FOAM, 0)
    prevX = fx + 3
  }
  // the pool at the foot, by the lake, and boulders round its rim
  const last = faces[faces.length - 1], zl = zAt(last), yl = g(last + 6, zl)
  prism(out, last + 6, zl, yl - 0.2, yl + 0.25, 6, 14, WATER, surfaceTag('glass'))
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 1.4 - 0.7, r = 1 + h(i, 8) * 1.2
    prism(out, last + 6 + Math.cos(a) * 6.5, zl + Math.sin(a) * 6.5, yl - 0.3, yl + r, r, 6, ROCK, rock, r * 0.5)
  }
}

export function goldenGatePavilion(out: MeshBuilder, fit: Fit): void {
  /*
   * From the owner's photograph (2026-10-04): HEXAGONAL — six red columns on a white-balustraded stone terrace at the
   * water, a carved frieze of blue-green and gold under the eaves, and one sweeping CONCAVE roof of pale celadon
   * glazed tile whose six hips curve up at their ends, a celadon bulb finial on top.
   */
  const R = Math.max(3.2, Math.min(fit.hx, fit.hz) * 0.95)
  const stone = surfaceTag('granite'), tile = surfaceTag('tile')
  const RED: Rgb = [0.74, 0.14, 0.13], CELADON: Rgb = [0.5, 0.76, 0.68], FRIEZE: Rgb = [0.32, 0.55, 0.55], WHITE: Rgb = [0.9, 0.9, 0.87]
  const hex = (r: number, k: number): [number, number] => [Math.cos((k / 6) * Math.PI * 2) * r, Math.sin((k / 6) * Math.PI * 2) * r]
  // the terrace and its white balustrade: a rail on posts round the hexagon
  prism(out, 0, 0, -0.3, 0.6, R + 1.3, 6, [0.6, 0.6, 0.58], stone)
  for (let k = 0; k < 6; k++) {
    const [ax, az] = hex(R + 1.1, k), [bx, bz] = hex(R + 1.1, k + 1)
    strut(out, [ax, 1.45, az], [bx, 1.45, bz], 0.14, 0.12, WHITE, stone)
    for (let t = 0; t < 1; t += 0.25) {
      const px = ax + (bx - ax) * t, pz = az + (bz - az) * t
      box(out, px, 1.05, pz, 0.11, 0.45, 0.11, WHITE, stone)
    }
  }
  // the six red columns, and the frieze ring over them
  for (let k = 0; k < 6; k++) { const [cx, cz] = hex(R, k); prism(out, cx, cz, 0.6, 4.3, 0.24, 10, RED, 0) }
  prism(out, 0, 0, 4.3, 4.85, R + 0.15, 6, FRIEZE, 0)
  prism(out, 0, 0, 4.85, 5.0, R + 0.3, 6, RED, 0)
  // the concave roof: a wide shallow skirt, steepening in bands to the top
  const bands: [number, number, number][] = [[5.0, R + 2.0, R + 1.1], [5.45, R + 1.1, R * 0.62], [6.3, R * 0.62, R * 0.32], [7.4, R * 0.32, 0.25]]
  let y = 5.0
  for (const [y0, r0, r1] of bands) {
    const y1 = y0 === 5.0 ? 5.45 : y0 === 5.45 ? 6.3 : y0 === 6.3 ? 7.4 : 8.3
    prism(out, 0, 0, y0, y1, r0, 6, CELADON, tile, r1)
    y = y1
  }
  // the six hips, curving up at their ends
  for (let k = 0; k < 6; k++) {
    const [ex, ez] = hex(R + 2.0, k), [mx, mz] = hex(R + 1.1, k), [tx, tz] = hex(0.3, k)
    strut(out, [tx, y - 0.1, tz], [mx, 5.5, mz], 0.18, 0.18, CELADON, tile)
    strut(out, [mx, 5.5, mz], [ex * 1.08, 5.75, ez * 1.08], 0.2, 0.2, CELADON, tile)
  }
  // the bulb finial
  prism(out, 0, 0, y, y + 0.4, 0.25, 8, CELADON, tile, 0.4)
  prism(out, 0, 0, y + 0.4, y + 1.0, 0.4, 8, CELADON, tile, 0.12)
  prism(out, 0, 0, y + 1.0, y + 1.3, 0.12, 8, CELADON, tile, 0.04)
}

/**
 * THE MUSIC CONCOURSE (1894, rebuilt 2005), between the de Young and the Academy of Sciences, the bandshell at its
 * south-west end — a sunken oval of tan decomposed granite under a GRID of pollarded London plane trees, their
 * knobbed limbs carrying low flat canopies, lawn panels between the rows and fountains down the axis. OSM maps the
 * lawns and the three fountain basins; the city drew the rest as open park with scattered palms (views audit,
 * 2026-10-04). Standalone, centred on the middle fountain; local +x runs along the axis (rotateDeg set in the
 * manifest), +z across it.
 */
export function musicConcourse(out: MeshBuilder, fit: Fit): void {
  const g = fit.groundAt ?? (() => 0)
  const HL = 100, HW = 52
  const DG: Rgb = [0.6, 0.54, 0.44], BARK: Rgb = [0.56, 0.52, 0.45], LEAF: Rgb = [0.26, 0.37, 0.19], STONE: Rgb = [0.78, 0.76, 0.71]
  const inOval = (x: number, z: number): boolean => (x / HL) ** 2 + (z / HW) ** 2 < 1
  const fountains = [-49, 0, 49]
  const nearFountain = (x: number, z: number): boolean => fountains.some((f) => Math.hypot(x - f, z) < 14)
  // the promenade of tan gravel down the axis
  const strip = (x0: number, x1: number, z0: number, z1: number): void => {
    for (let x = x0; x < x1; x += 4) {
      const xa = x, xb = Math.min(x1, x + 4)
      out.quad([[xa, g(xa, z0) + 0.06, z0], [xb, g(xb, z0) + 0.06, z0], [xb, g(xb, z1) + 0.06, z1], [xa, g(xa, z1) + 0.06, z1]].reverse() as [number, number, number][],
        [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], DG, 0)
    }
  }
  strip(-HL * 0.95, HL * 0.95, -7, 7)
  // the grid: rows across the axis every 8 m, trees every 8 m along each, out to the oval, clear of the promenade and
  // the fountains
  for (let x = -HL + 8; x < HL - 4; x += 8) {
    for (let z = -HW + 6; z < HW - 2; z += 8) {
      if (Math.abs(z) < 10 || !inOval(x, z) || nearFountain(x, z)) continue
      const y = g(x, z)
      // the trunk, the knuckled limbs pruned back to knobs, the low flat canopy they carry
      prism(out, x, z, y, y + 3.4, 0.32, 5, BARK, 0, 0.26, false)
      for (let k = 0; k < 3; k++) {
        const a = (k / 3) * Math.PI * 2 + 0.4
        strut(out, [x, y + 3.2, z], [x + Math.cos(a) * 1.2, y + 4.7, z + Math.sin(a) * 1.2], 0.2, 0.2, BARK, 0, false)
      }
      prism(out, x, z, y + 4.6, y + 6.6, 3.6, 6, LEAF, 0, 3.0)
    }
  }
  // the fountains' stone rims and their jets (OSM maps the basins' water)
  for (const [i, f] of fountains.entries()) {
    const r = i === 1 ? 11 : 4.5, y = g(f, 0)
    prism(out, f, 0, y, y + 0.6, r + 0.5, 20, STONE, surfaceTag('granite'), r + 0.5)
    prism(out, f, 0, y, y + 0.7, r, 20, [0.5, 0.62, 0.68], surfaceTag('glass'))
    prism(out, f, 0, y + 0.7, y + (i === 1 ? 4 : 2), 0.35, 8, [0.92, 0.95, 0.97], 0, 0.1)
  }
}

export const STRAWBERRY_HILL: Record<string, (out: MeshBuilder, fit: Fit) => void> = { huntingtonFalls, goldenGatePavilion, musicConcourse }
