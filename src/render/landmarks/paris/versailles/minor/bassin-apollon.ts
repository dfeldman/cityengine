import { capPolygonWithHoles, type MeshBuilder } from '../../../../buildings.ts'
import type { Rgb } from '../../../../models.ts'
import type { Fit } from '../../../fit.ts'
import { hex, shade } from '../../../kit.ts'
import { ell, GILT, giltTag, rockPile, type V3 } from './gilt-kit.ts'
import { ccw, FIXED, UV, type P2 } from '../../monuments/common.ts'

/*
 * THE BASSIN D'APOLLON AND THE BASSIN DU MIROIR (Parc de Versailles). Both are stone curbs round OSM's water (the bake draws
 * the water and the jets; never here). Apollon (relation 6356905; outer way/124531624, inner way/224643672 = the island): a
 * quatrefoil-ended basin ~78 x 112 m at the head of the Grand Canal, with Tuby's gilded-lead group (Apollo's chariot rising
 * from the waves, four horses, tritons, dolphins; 1668-70) on the island, here a STAND-IN on a stone drum (the real group is
 * queued for Modly in guided-queue.md, to be attached at APOLLON_STAND_AT). Miroir (way/5013340): a lens-shaped basin on the
 * Ile royale, just a curb (its vases are skipped); the three spike nodes of OSM ring (-13,-44 .. -37,-42) are dropped so the kerb closes all round along the mapped west diagonal. Rings are about each
 * entry's centre (bbox centre of the water), measured with osmium on the Ile-de-France pbf. Curb sizes and the group's
 * proportions are guessed from photographs.
 */
const APOLLON_RING: [number, number][] = [[-1.52, 42.93], [-9.68, 46.28], [-14.27, 34.04], [-16.88, 33.84], [-20.73, 32.90], [-23.68, 31.15], [-26.74, 28.67], [-29.02, 26.39], [-31.67, 23.23], [-33.58, 20.27], [-35.45, 16.64], [-36.91, 12.81], [-38.04, 8.83], [-38.77, 5.15], [-39.14, 0.74], [-38.98, -3.08], [-38.26, -6.82], [-36.59, -10.74], [-35.19, -12.82], [-33.61, -14.70], [-38.57, -26.79], [-30.81, -29.78], [-31.90, -32.59], [-32.65, -35.62], [-32.84, -38.46], [-32.51, -41.82], [-31.75, -45.02], [-30.23, -47.91], [-28.23, -50.42], [-26.01, -52.41], [-23.39, -53.97], [-20.60, -55.09], [-17.51, -55.76], [-14.85, -55.82], [-11.77, -55.46], [-8.55, -54.50], [-5.90, -53.14], [-3.51, -51.35], [-1.45, -49.03], [0.21, -46.44], [1.67, -42.87], [9.44, -46.12], [14.31, -33.77], [17.57, -33.41], [20.88, -32.31], [23.94, -30.75], [26.19, -29.06], [28.45, -26.81], [30.64, -24.25], [33.06, -20.87], [35.26, -17.06], [36.82, -13.78], [37.98, -10.17], [38.70, -7.12], [39.00, -3.37], [39.14, 0.67], [38.79, 4.78], [38.21, 7.07], [37.29, 9.58], [36.21, 11.70], [34.95, 13.38], [33.88, 14.64], [38.99, 26.69], [30.72, 29.89], [31.92, 32.42], [32.62, 34.99], [32.87, 37.21], [32.83, 40.22], [32.34, 42.72], [31.62, 44.94], [30.26, 47.57], [28.77, 49.72], [26.97, 51.49], [24.91, 53.13], [22.51, 54.36], [20.02, 55.21], [17.73, 55.65], [15.09, 55.81], [12.25, 55.60], [10.61, 55.16], [8.18, 54.32], [5.90, 53.13], [3.98, 51.67], [2.64, 50.46], [1.28, 48.80], [0.22, 47.02], [-0.69, 45.16]]
const ISLAND_RING: [number, number][] = [[-5.82, 4.56], [-6.76, 3.06], [-7.32, 1.37], [-7.46, -0.40], [-7.17, -2.15], [-6.48, -3.78], [-5.41, -5.20], [-4.03, -6.32], [-2.42, -7.07], [-0.68, -7.43], [1.10, -7.35], [2.80, -6.85], [4.34, -5.96], [5.62, -4.74], [6.56, -3.24], [7.13, -1.55], [7.27, 0.22], [6.97, 1.97], [6.28, 3.60], [5.21, 5.01], [3.83, 6.14], [2.22, 6.89], [0.48, 7.25], [-1.29, 7.17], [-3.00, 6.67], [-4.53, 5.78]]
const MIROIR_RING: [number, number][] = [[15.42, 26.23], [19.85, 24.07], [25.27, 20.53], [29.55, 16.20], [33.14, 10.79], [36.00, 4.35], [37.13, -2.13], [37.43, -9.12], [36.88, -14.28], [35.36, -19.15], [31.91, -25.38], [28.61, -29.91], [25.32, -33.45], [20.24, -36.74], [15.03, -39.44], [8.77, -41.02], [1.98, -41.74], [-4.00, -41.09], [-11.00, -39.07], [-1.21, 46.96], [11.03, 41.71], [17.69, 31.55]]

// tunables (metres)
const CURB_OUT = 0.7, CURB_H = 0.3, CURB_DEPTH = 0.3   // the stone kerb: width outside the water, height over the ground, how far its inner face goes down
const COPE_OVER = 0.06, COPE_H = 0.08                  // the coping's overhang and thickness
const MITER_MAX = 2.2                                  // limit on a corner's offset stretch
const ISLAND_DROP = -1.38                                // the island's level relative to the kerb's ground: the bake's water/island ground is ~1.2 m lower (terrain -21.6 vs -20.4)
const ISLAND_H = 0.05, DRUM_H = 0                      // the group's wet base: height over the water, no drum
const STANDIN = true                                   // the procedural group; false when the Modly group (APOLLON_STAND_AT) replaces it
const ROCK_R = 5.0, ROCK_H = 0.9                       // the waves/rock under the chariot
const GROUP_FACING = 90                                // degrees: the horses face this bearing (east, the chateau)
const HORSE_L = 3.0, HORSE_SPREAD = 2.2 // a horse's body length, withers height, lateral spacing of the four
const STONE: Rgb = hex('#c9c3b2'), ROCK: Rgb = hex('#4a443b')
const WET: Rgb = hex('#25231f')                          // wet dark stone

/** the group's centre, on the island's drum (the Modly group attaches here, x east, z north, y up) */
export const APOLLON_STAND_AT = (): [number, number, number] => [-0.31, ISLAND_H + DRUM_H, 0.08]

/** offset a closed ring by d metres (outward for ccw), mitred at corners with a limit */
function offset(ring: P2[], d: number): P2[] {
  const n = ring.length
  return ring.map((p, i) => {
    const a = ring[(i + n - 1) % n], b = ring[(i + 1) % n]
    const e1x = p.x - a.x, e1z = p.z - a.z, l1 = Math.hypot(e1x, e1z) || 1
    const e2x = b.x - p.x, e2z = b.z - p.z, l2 = Math.hypot(e2x, e2z) || 1
    const n1x = e1z / l1, n1z = -e1x / l1, n2x = e2z / l2, n2z = -e2x / l2
    let mx = n1x + n2x, mz = n1z + n2z
    const ml = Math.hypot(mx, mz)
    if (ml < 1e-6) return { x: p.x + n1x * d, z: p.z + n1z * d }
    mx /= ml; mz /= ml
    const k = Math.min(MITER_MAX, 1 / Math.max(0.01, mx * n1x + mz * n1z))
    return { x: p.x + mx * d * k, z: p.z + mz * d * k }
  })
}

function wall(out: MeshBuilder, ring: P2[], y0: number, y1: number, c: Rgb, inward: boolean): void {
  const n = ring.length
  for (let i = 0; i < n; i++) {
    const a = ring[i], b = ring[(i + 1) % n]
    const dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1
    const s = inward ? -1 : 1
    out.quad([[a.x, y0, a.z], [b.x, y0, b.z], [b.x, y1, b.z], [a.x, y1, a.z]], [(dz / l) * s, 0, (-dx / l) * s], UV, c, FIXED)
  }
}

/** stone curb round a water ring, with the optional island (its own low kerb) */
function curbed(out: MeshBuilder, y: number, ring: [number, number][]): P2[] {
  const water = ccw(ring.map(([x, z]) => ({ x, z })))
  const outer = offset(water, CURB_OUT), cope = offset(water, CURB_OUT + COPE_OVER)
  wall(out, outer, y, y + CURB_H, STONE, false)
  wall(out, cope, y + CURB_H - COPE_H, y + CURB_H, shade(STONE, 1.05), false)
  capPolygonWithHoles(out, [cope, [...water].reverse()], y + CURB_H, shade(STONE, 1.08), FIXED)
  wall(out, water, y - CURB_DEPTH, y + CURB_H, shade(STONE, 0.82), true)
  return water
}

/** a stand-in for Tuby's group about (cx, y0, cz), built heading local +x, then turned to GROUP_FACING (the Modly group replaces it: set STANDIN false) */
function chariotGroup(out: MeshBuilder, cx: number, y0: number, cz: number): void {
  const rot = ((90 - GROUP_FACING) * Math.PI) / 180, cs = Math.cos(rot), sn = Math.sin(rot)
  const W = (x: number, h: number, z: number): V3 => [cx + x * cs - z * sn, y0 + h, cz + x * sn + z * cs]
  const E = (a: V3, b: V3, r: number, rv = r, c: Rgb = GILT, n = 6): void => ell(out, W(...a), W(...b), r, c, rv, giltTag, n)
  const [rx, rz] = [W(0, 0, 0)[0], W(0, 0, 0)[2]]
  // the waves/rock the group rises from: a dark heap, wider than the group
  rockPile(out, rx, y0, rz, ROCK_R, ROCK_H, ROCK, 4, 14)
  const t = ROCK_H * 0.9
  // the chariot: a gilded shell with a high scrolled front, two wheels, a pole to the horses
  E([-4.6, t + 0.9, 0], [-2.2, t + 0.8, 0], 0.95, 0.5, GILT, 8)
  E([-2.4, t + 0.9, 0], [-2.1, t + 1.9, 0], 0.9, 0.2, GILT, 8)                    // the high front
  E([-4.8, t + 0.9, 0], [-4.6, t + 1.7, 0], 0.7, 0.2, GILT, 8)                    // the back rail
  for (const s of [-1, 1]) E([-3.6, t + 0.7, s * 1.15], [-3.6, t + 0.7, s * 1.4], 0.7, 0.7, GILT, 10)
  E([-2.2, t + 1.1, 0], [-0.4, t + 1.9, 0], 0.15, 0.15)                          // pole
  // Apollo: robed column, torso, head with a sun crown, one arm raised, one holding the reins
  E([-3.5, t + 1.0, 0], [-3.5, t + 2.4, 0], 0.4, 0.35, GILT, 8)
  E([-3.5, t + 2.3, 0], [-3.4, t + 3.1, 0], 0.32, 0.25, GILT, 8)
  E([-3.4, t + 3.05, 0], [-3.4, t + 3.55, 0], 0.17, 0.17, GILT, 6)
  E([-3.4, t + 3.5, 0], [-3.4, t + 3.8, 0], 0.32, 0.03, GILT, 8)                 // the radiant crown
  E([-3.4, t + 2.9, -0.2], [-3.0, t + 3.9, -0.8], 0.09)
  E([-3.4, t + 2.8, 0.2], [-2.6, t + 2.5, 0.6], 0.09)
  // four rearing horses abreast: barrel, neck, head, mane, raised forelegs, hind legs planted on the waves, tail
  for (let i = 0; i < 4; i++) {
    const z = (i - 1.5) * HORSE_SPREAD, k = HORSE_L / 2.6, lo = i === 1 || i === 2 ? 0 : 0.25   // the two outer horses rear a little less
    const x0 = -0.2 + (i % 2) * 0.3
    E([x0, t + 1.2 * k, z], [x0 + 1.7 * k, t + (2.5 - lo) * k, z], 0.68 * k, 0.62 * k, GILT, 8)               // barrel, chest up
    E([x0 + 1.5 * k, t + (2.3 - lo) * k, z], [x0 + 2.2 * k, t + (3.4 - lo) * k, z], 0.4 * k, 0.36 * k, GILT, 7)         // neck
    E([x0 + 2.0 * k, t + (3.4 - lo) * k, z], [x0 + 2.9 * k, t + (3.15 - lo) * k, z], 0.28 * k, 0.24 * k, GILT, 7)       // head, nose forward and down
    E([x0 + 1.55 * k, t + (3.35 - lo) * k, z], [x0 + 2.1 * k, t + (3.55 - lo) * k, z], 0.12 * k, 0.35 * k)      // mane crest
    for (const s of [-1, 1]) {
      E([x0 + 1.5 * k, t + (2.2 - lo) * k, z + s * 0.22], [x0 + 2.4 * k, t + (2.75 - lo) * k, z + s * 0.28], 0.2 * k)   // forearm, flung up and out
      E([x0 + 2.4 * k, t + (2.75 - lo) * k, z + s * 0.28], [x0 + 2.8 * k, t + (2.3 - lo) * k, z + s * 0.3], 0.14 * k) // folded cannon
      E([x0 - 0.2 * k, t + 1.3 * k, z + s * 0.2], [x0 - 0.5 * k, t + 0.5 * k, z + s * 0.24], 0.28 * k, 0.24 * k)    // thigh
      E([x0 - 0.5 * k, t + 0.5 * k, z + s * 0.24], [x0 - 0.4 * k, t + 0.0, z + s * 0.26], 0.13 * k)               // hind cannon
    }
    E([x0 - 0.3 * k, t + 1.35 * k, z], [x0 - 1.1 * k, t + 0.7 * k, z], 0.15 * k, 0.2 * k)                      // tail
  }
  // two tritons rising at the flanks, one blowing a conch, with fish tails coiled in the waves; dolphins/whales ahead
  for (const s of [-1, 1]) {
    const z = s * 5.1
    E([-0.6, t + 0.0, z], [-1.4, t + 0.5, z + s * 0.5], 0.45, 0.4, GILT)                // tail coil
    E([-0.6, t + 0.0, z], [0.3, t + 1.1, z], 0.5, 0.45, GILT)                             // body
    E([0.3, t + 1.0, z], [0.4, t + 2.1, z], 0.45, 0.4, GILT, 8)                           // torso
    E([0.4, t + 2.1, z], [0.45, t + 2.6, z], 0.28, 0.28)                                   // head
    E([0.5, t + 2.0, z + s * 0.2], [1.2, t + 2.7, z - s * 0.1], 0.15)                     // arm to the conch
    E([1.0, t + 2.55, z - s * 0.1], [1.7, t + 3.0, z - s * 0.3], 0.18, 0.14, GILT, 5)      // conch
    E([3.0, t + 0.4, z * 0.55], [4.3, t + 0.9, z * 0.5], 0.5, 0.45)                       // dolphin body
    E([4.2, t + 0.85, z * 0.5], [4.9, t + 0.7, z * 0.46], 0.25, 0.2)                     // snout
    E([3.0, t + 0.4, z * 0.55], [2.2, t + 0.2, z * 0.6], 0.22, 0.16)                       // tail
  }
}

function apollon(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0
  curbed(out, y, APOLLON_RING)
  // the island: its own kerb round OSM's inner ring, a grass top, the drum and the group
  const isl = ccw(ISLAND_RING.map(([x, z]) => ({ x, z })))
  wall(out, isl, y + ISLAND_DROP - 0.5, y + ISLAND_DROP + ISLAND_H, WET, false)
  capPolygonWithHoles(out, [isl], y + ISLAND_DROP + ISLAND_H, WET, FIXED)
  const [sx, , sz] = APOLLON_STAND_AT()
  if (STANDIN) chariotGroup(out, sx, y + ISLAND_DROP + ISLAND_H + DRUM_H, sz)
}

function miroir(out: MeshBuilder, fit: Fit): void {
  curbed(out, fit.grade ?? 0, MIROIR_RING)
}

export const versaillesBassinApollon = (out: MeshBuilder, fit: Fit): void => apollon(out, fit)
export const versaillesBassinMiroir = (out: MeshBuilder, fit: Fit): void => miroir(out, fit)
