import type { MeshBuilder } from '../../../../buildings.ts'
import { type Rgb } from '../../../../models.ts'
import { block, hex, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { FIXED, UV } from '../common.ts'
import { G } from '../plaza-common.ts'
import { roundBasin } from './monument-kit.ts'

/*
 * LA FONTAINE AUX LIONS DU JARDIN DES PLANTES (Q137838758; the retaining wall of Rohault de Fleury's reservoir of 1834 under the
 * Labyrinthe, at the north entrance by 40 rue Geoffroy-Saint-Hilaire, 5e; frwiki: a brick cul-de-four 'grotte' in a stone wall, the
 * round basin before it, a lion's-head spout, and on the two top corners the bronze lions by Henri-Alfred Jacquemart, 1857/1860,
 * restored 2021). OSM way 97183056 (building, 'Fontaine aux Lions', ~8.5 m front edge) is claimed. Frame: origin on the middle of
 * the wall's front face, the face along x on z = 0 facing -z, the recess and wall body behind it (+z). Widths and heights are
 * scaled off the Commons photographs (bollards ~1 m, the wall ~8 m wide), not surveyed. Every number below is a tunable.
 */
export const HX = 4.2
export const HZ = 2.6

const W = 8.3           // wall width along x
const H = 3.0           // wall top above the pavement (cornice on top of this)
const T = 2.2           // wall depth behind the face
const RA = 1.85         // the arch's radius (opening 3.7 m wide)
const SPRING = 0.75     // arch spring above the pavement
const RING = 0.5        // archivolt width
const PLINTH = 0.5      // darker moss-stained base course height
const CORN_H = 0.3
const CORN_OUT = 0.14
const BASIN_R = 2.3
const COURSE = 0.55     // height of an ashlar course
const LION_PAD = [1.45, 0.9] as const   // lion plinth size [along x, along z]
const LION_X = W / 2 - 0.95             // lions' centres, each side
const LION_YAW = 22                     // each turned this much toward the middle off the front

const STONE: Rgb = hex('#cdc6b2')
const MOSS: Rgb = hex('#9d9c86')
const JOINT: Rgb = hex('#9a9482')
const BRICK: Rgb = hex('#7d5c3e')
const WATER: Rgb = hex('#6f8f94')
const DARK: Rgb = hex('#3a3a36')

/** Where the two bronze lions stand (landmark frame: x, y up, z; bearing 0 = +z, 180 = looking out of the front): for the statues manifest */
export const LIONS: { at: [number, number, number]; bearing: number }[] = [-1, 1].map((s) => ({
  at: [s * LION_X, G + H + CORN_H + 0.2, T / 2 - 0.1] as [number, number, number],
  bearing: 180 - s * LION_YAW,
}))

type V3 = [number, number, number]

/** A quad whose winding follows the normal it is given (so it is lit and kept from the side it faces). */
function quadN(q: MeshBuilder, p: V3[], n: V3, c: Rgb): void {
  const ux = p[1][0] - p[0][0], uy = p[1][1] - p[0][1], uz = p[1][2] - p[0][2]
  const vx = p[3][0] - p[0][0], vy = p[3][1] - p[0][1], vz = p[3][2] - p[0][2]
  const d = (uy * vz - uz * vy) * n[0] + (uz * vx - ux * vz) * n[1] + (ux * vy - uy * vx) * n[2]
  q.quad(d >= 0 ? p : [p[3], p[2], p[1], p[0]], n, UV, c, FIXED)
}

function draw(q: MeshBuilder): void {
  const y0 = G
  const yt = y0 + H
  const cy = y0 + SPRING
  const top = (x: number): number => cy + Math.sqrt(Math.max(0, RA * RA - x * x))
  // the wall body: two side piers and, above the opening, strips following the arch's curve
  block(q, -W / 2, -RA, 0, T, y0, yt, STONE)
  block(q, RA, W / 2, 0, T, y0, yt, STONE)
  const N = 24
  for (let i = 0; i < N; i++) {
    const xa = -RA + (2 * RA * i) / N
    const xb = -RA + (2 * RA * (i + 1)) / N
    block(q, xa, xb, 0, T, top((xa + xb) / 2), yt, STONE)
  }
  // the foot course, darker and moss-stained, a little proud
  block(q, -W / 2 - 0.04, -RA, -0.05, T, y0, y0 + PLINTH, MOSS)
  block(q, RA, W / 2 + 0.04, -0.05, T, y0, y0 + PLINTH, MOSS)
  // ashlar courses: thin joint lines on the face, left and right of the archivolt and above it
  const jr = RA + RING + 0.02
  for (let y = y0 + PLINTH + COURSE; y < yt - 0.1; y += COURSE) {
    block(q, -W / 2, -jr, -0.012, 0, y, y + 0.02, JOINT)
    block(q, jr, W / 2, -0.012, 0, y, y + 0.02, JOINT)
    if (y > cy + RA + RING + 0.05) block(q, -jr, jr, -0.012, 0, y, y + 0.02, JOINT)
  }
  // the archivolt: voussoirs alternately lighter, a hair proud of the face
  const M = 22
  for (let i = 0; i < M; i++) {
    const a0 = (i / M) * Math.PI
    const a1 = ((i + 1) / M) * Math.PI
    const P = (r: number, a: number): V3 => [Math.cos(a) * r, cy + Math.sin(a) * r, -0.07]
    quadN(q, [P(RA, a0), P(RA + RING, a0), P(RA + RING, a1), P(RA, a1)], [0, 0, -1], i % 2 ? shade(STONE, 1.05) : shade(STONE, 0.95))
  }
  // the cornice
  block(q, -W / 2 - CORN_OUT, W / 2 + CORN_OUT, -CORN_OUT, T + 0.1, yt, yt + CORN_H, shade(STONE, 1.04))
  block(q, -W / 2 - CORN_OUT * 0.6, W / 2 + CORN_OUT * 0.6, -CORN_OUT * 0.6, T + 0.1, yt - 0.12, yt, shade(STONE, 0.97))
  // the recess: a half-cylinder wall under the arch, then the cul-de-four (a quarter sphere), in rough brick
  const K = 14
  for (let i = 0; i < K; i++) {
    const a0 = (i / K) * Math.PI
    const a1 = ((i + 1) / K) * Math.PI
    const am = (a0 + a1) / 2
    const c = i % 2 ? shade(BRICK, 1.06) : BRICK
    const P = (a: number, y: number): V3 => [Math.cos(a) * RA, y, Math.sin(a) * RA]
    quadN(q, [P(a0, y0 + 0.3), P(a1, y0 + 0.3), P(a1, cy), P(a0, cy)], [-Math.cos(am), 0, -Math.sin(am)], c)
    for (let j = 0; j < 6; j++) {
      const f0 = (j / 6) * (Math.PI / 2)
      const f1 = ((j + 1) / 6) * (Math.PI / 2)
      const D = (f: number, a: number): V3 => [RA * Math.cos(f) * Math.cos(a), cy + RA * Math.cos(f) * Math.sin(a), RA * Math.sin(f)]
      // (f = 0 on the arch plane's rim, f = pi/2 the back pole: here the circle is x-y at z = 0 and the pole is +z)
      const dm = D((f0 + f1) / 2, am)
      quadN(q, [D(f0, a0), D(f0, a1), D(f1, a1), D(f1, a0)], [-(dm[0]), -(dm[1] - cy), -dm[2]], shade(BRICK, 0.92 + 0.1 * ((i + j) % 2)))
    }
  }
  // the low stone dado of the recess, the lion-head spout on it and its thread of water
  const dado = y0 + 0.9
  for (let i = 0; i < K; i++) {
    const a0 = (i / K) * Math.PI
    const a1 = ((i + 1) / K) * Math.PI
    const am = (a0 + a1) / 2
    const r = RA - 0.04
    const P = (a: number, y: number): V3 => [Math.cos(a) * r, y, Math.sin(a) * r]
    quadN(q, [P(a0, y0 + 0.3), P(a1, y0 + 0.3), P(a1, dado), P(a0, dado)], [-Math.cos(am), 0, -Math.sin(am)], MOSS)
  }
  block(q, -0.27, 0.27, RA - 0.2, RA - 0.04, y0 + 0.35, dado + 0.35, shade(STONE, 0.95))   // the spout's stone tablet
  block(q, -0.1, 0.1, RA - 0.24, RA - 0.2, dado + 0.0, dado + 0.2, DARK)                  // the lion mask
  block(q, -0.03, 0.03, RA - 0.24, RA - 0.2, y0 + 0.45, dado, WATER)                      // the thread of water
  // the basin before it, its water and lip; a floor inside the arch under the water
  roundBasin(q, 0, 0, 0, BASIN_R, { rim: 0.42, depth: G + 0.4, lip: 0.08, stone: shade(STONE, 0.93), water: WATER, sides: 36 })
  // the two bronze lions' plinths on the cornice
  for (const s of [-1, 1]) block(q, s * LION_X - LION_PAD[0] / 2, s * LION_X + LION_PAD[0] / 2, T / 2 - 0.1 - LION_PAD[1] / 2, T / 2 - 0.1 + LION_PAD[1] / 2, yt + CORN_H, yt + CORN_H + 0.2, shade(STONE, 0.9))
}

export function fontaineLionsJardinPlantes(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
