/**
 * STRAWBERRY HILL, the island in Stow Lake (owner, 2026-10-04: "put some more effort into Strawberry Hill. It's 400
 * feet tall, a dense wood, and has a huge artificial waterfall into the lake, and parts of the tea garden"; "it also
 * has many trails that should be on our trail network").
 *
 *  - HUNTINGTON FALLS (1893): from the reservoir near the summit, a cascade some 30 m down the island's east face
 *    into the lake, white water tumbling over dark boulders in a cleft of rock, widening into a pool at the foot.
 *    Drawn on the ground along OSM's stream (way/120479794, /120479802), its heights from the terrain (`groundAt`).
 *  - The GOLDEN GATE PAVILION (the Chinese Pavilion, a 1981 gift from Taipei; way/120479810), on the island's east
 *    shore: red columns on a stone terrace under a double eave of green glazed tile with upswept corners and a gold
 *    finial — the tea-garden look of the island.
 *
 * The wood and the trails are zones (data/zones: `plant-strawberry-hill`, and `trails: 'bike'` on the hill's own).
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import type { Rgb } from '../../models.ts'
import { box, prism, strut } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { roof } from '../kit.ts'

/** the falls' line follows OSM's stream (way/120479794, /120479802) from the reservoir east to the lake */
export const FALLS_CENTRE = { x: -5464, z: -2693 }

const h = (a: number, b: number): number => { const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return v - Math.floor(v) }

export function huntingtonFalls(out: MeshBuilder, fit: Fit): void {
  /*
   * Straight down over rock (owner: "the falls should be straight down over rocks"): the stream leaves the reservoir
   * and drops in three SHEER falls, each over the face of a great step of rock, a short pool between, the last into
   * a churned pool at the lake's edge. Local frame: the stream's line along +x (rotateDeg 0, centre FALLS_CENTRE).
   */
  const g = fit.groundAt ?? ((x: number): number => Math.max(1, 20 - x * 0.45))
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
  const R = Math.max(3.5, Math.min(fit.hx, fit.hz))
  const stone = surfaceTag('granite'), tile = surfaceTag('tile')
  const RED: Rgb = [0.72, 0.16, 0.12], GREEN: Rgb = [0.18, 0.46, 0.32], GOLD: Rgb = [0.85, 0.68, 0.25]
  // the terrace, two steps of grey stone, and a white balustrade round it
  box(out, 0, 0.3, 0, R + 1.2, 0.6, R + 1.2, [0.62, 0.62, 0.6], stone)
  box(out, 0, 0.75, 0, R + 0.6, 0.15, R + 0.6, [0.68, 0.68, 0.66], stone)
  for (const [sx, sz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) box(out, sx * (R + 1.1), 1.1, sz * (R + 1.1), sx ? 0.1 : R + 1.1, 0.35, sz ? 0.1 : R + 1.1, [0.85, 0.84, 0.8], stone)
  // the red columns, the red frieze over them
  for (const t of [-(R - 0.3), 0, R - 0.3]) for (const s of [-1, 1]) {
    prism(out, t, s * (R - 0.3), 0.9, 4.2, 0.22, 8, RED, 0)
    prism(out, s * (R - 0.3), t, 0.9, 4.2, 0.22, 8, RED, 0)
  }
  box(out, 0, 4.4, 0, R, 0.3, R, RED, 0)
  // two hipped eaves of green glazed tile, each rising from a wide overhang, the upper on a short red drum
  const E1 = R + 1.8, E2 = R * 0.7 + 0.8
  roof(out, -E1, E1, -E1, E1, 4.7, 1.6, E1 * 0.55, E1 * 0.55, GREEN)
  box(out, 0, 6.8, 0, R * 0.62, 0.5, R * 0.62, RED, 0)
  roof(out, -E2, E2, -E2, E2, 7.3, 2.4, E2, E2, GREEN)
  // the upswept corners of both eaves, and the gold finial
  for (const [E, y] of [[E1, 4.7], [E2, 7.3]] as const) for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    strut(out, [sx * (E - 0.6), y + 0.3, sz * (E - 0.6)], [sx * (E + 0.5), y + 0.9, sz * (E + 0.5)], 0.25, 0.18, GREEN, tile)
  }
  prism(out, 0, 0, 9.6, 10.2, 0.35, 8, GOLD, 0)
  prism(out, 0, 0, 10.2, 11.3, 0.25, 8, GOLD, 0, 0.04)
}

export const STRAWBERRY_HILL: Record<string, (out: MeshBuilder, fit: Fit) => void> = { huntingtonFalls, goldenGatePavilion }
