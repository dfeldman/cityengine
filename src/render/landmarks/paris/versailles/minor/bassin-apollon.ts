import { capPolygonWithHoles, type MeshBuilder } from '../../../../buildings.ts'
import type { Rgb } from '../../../../models.ts'
import type { Fit } from '../../../fit.ts'
import { beam, hex, prism, shade } from '../../../kit.ts'
import { crag } from '../../batch3/parks.ts'
import { ccw, FIXED, UV, type P2 } from '../../monuments/common.ts'

/*
 * THE BASSIN D'APOLLON AND THE BASSIN DU MIROIR (Parc de Versailles). Both are stone curbs round OSM's water (the bake draws
 * the water and the jets; never here). Apollon (relation 6356905; outer way/124531624, inner way/224643672 = the island): a
 * quatrefoil-ended basin ~78 x 112 m at the head of the Grand Canal, with Tuby's gilded-lead group (Apollo's chariot rising
 * from the waves, four horses, tritons, dolphins; 1668-70) on the island, here a STAND-IN on a stone drum (the real group is
 * queued for Modly in guided-queue.md, to be attached at APOLLON_STAND_AT). Miroir (way/5013340): a lens-shaped basin on the
 * Ile royale, just a curb (its vases are skipped); the long spike in OSM's ring is kept as mapped. Rings are about each
 * entry's centre (bbox centre of the water), measured with osmium on the Ile-de-France pbf. Curb sizes and the group's
 * proportions are guessed from photographs.
 */
const APOLLON_RING: [number, number][] = [[-1.52, 42.93], [-9.68, 46.28], [-14.27, 34.04], [-16.88, 33.84], [-20.73, 32.90], [-23.68, 31.15], [-26.74, 28.67], [-29.02, 26.39], [-31.67, 23.23], [-33.58, 20.27], [-35.45, 16.64], [-36.91, 12.81], [-38.04, 8.83], [-38.77, 5.15], [-39.14, 0.74], [-38.98, -3.08], [-38.26, -6.82], [-36.59, -10.74], [-35.19, -12.82], [-33.61, -14.70], [-38.57, -26.79], [-30.81, -29.78], [-31.90, -32.59], [-32.65, -35.62], [-32.84, -38.46], [-32.51, -41.82], [-31.75, -45.02], [-30.23, -47.91], [-28.23, -50.42], [-26.01, -52.41], [-23.39, -53.97], [-20.60, -55.09], [-17.51, -55.76], [-14.85, -55.82], [-11.77, -55.46], [-8.55, -54.50], [-5.90, -53.14], [-3.51, -51.35], [-1.45, -49.03], [0.21, -46.44], [1.67, -42.87], [9.44, -46.12], [14.31, -33.77], [17.57, -33.41], [20.88, -32.31], [23.94, -30.75], [26.19, -29.06], [28.45, -26.81], [30.64, -24.25], [33.06, -20.87], [35.26, -17.06], [36.82, -13.78], [37.98, -10.17], [38.70, -7.12], [39.00, -3.37], [39.14, 0.67], [38.79, 4.78], [38.21, 7.07], [37.29, 9.58], [36.21, 11.70], [34.95, 13.38], [33.88, 14.64], [38.99, 26.69], [30.72, 29.89], [31.92, 32.42], [32.62, 34.99], [32.87, 37.21], [32.83, 40.22], [32.34, 42.72], [31.62, 44.94], [30.26, 47.57], [28.77, 49.72], [26.97, 51.49], [24.91, 53.13], [22.51, 54.36], [20.02, 55.21], [17.73, 55.65], [15.09, 55.81], [12.25, 55.60], [10.61, 55.16], [8.18, 54.32], [5.90, 53.13], [3.98, 51.67], [2.64, 50.46], [1.28, 48.80], [0.22, 47.02], [-0.69, 45.16]]
const ISLAND_RING: [number, number][] = [[-5.82, 4.56], [-6.76, 3.06], [-7.32, 1.37], [-7.46, -0.40], [-7.17, -2.15], [-6.48, -3.78], [-5.41, -5.20], [-4.03, -6.32], [-2.42, -7.07], [-0.68, -7.43], [1.10, -7.35], [2.80, -6.85], [4.34, -5.96], [5.62, -4.74], [6.56, -3.24], [7.13, -1.55], [7.27, 0.22], [6.97, 1.97], [6.28, 3.60], [5.21, 5.01], [3.83, 6.14], [2.22, 6.89], [0.48, 7.25], [-1.29, 7.17], [-3.00, 6.67], [-4.53, 5.78]]
const MIROIR_RING: [number, number][] = [[15.42, 26.23], [19.85, 24.07], [25.27, 20.53], [29.55, 16.20], [33.14, 10.79], [36.00, 4.35], [37.13, -2.13], [37.43, -9.12], [36.88, -14.28], [35.36, -19.15], [31.91, -25.38], [28.61, -29.91], [25.32, -33.45], [20.24, -36.74], [15.03, -39.44], [8.77, -41.02], [1.98, -41.74], [-4.00, -41.09], [-11.00, -39.07], [-13.11, -44.24], [-25.27, -46.97], [-37.43, -41.73], [-1.21, 46.96], [11.03, 41.71], [17.69, 31.55]]

// tunables (metres)
const CURB_OUT = 0.7, CURB_H = 0.3, CURB_DEPTH = 0.3   // the stone kerb: width outside the water, height over the ground, how far its inner face goes down
const COPE_OVER = 0.06, COPE_H = 0.08                  // the coping's overhang and thickness
const MITER_MAX = 2.2                                  // limit on a corner's offset stretch
const ISLAND_H = 0.08, DRUM_H = 0                      // the group's wet base: height over the water, no drum
const ROCK_R = 5.6, ROCK_H = 0.9                       // the waves/rock under the chariot
const GROUP_FACING = 90                                // degrees: the horses face this bearing (east, the chateau)
const HORSE_L = 2.6, HORSE_H = 1.9, HORSE_SPREAD = 0.95 // a horse's body length, withers height, lateral spacing of the four
const STONE: Rgb = hex('#c9c3b2'), ROCK: Rgb = hex('#8b8475'), LEAD: Rgb = hex('#7d6a36'), GOLD: Rgb = hex('#b8963a')
const WET: Rgb = hex('#4d4a42')                          // wet dark stone

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

/** a stand-in for Tuby's group about (0, y0, 0) heading +x, then turned to GROUP_FACING by the caller's geometry */
function chariotGroup(out: MeshBuilder, cx: number, y0: number, cz: number): void {
  // build in a local frame (+x forward) then rotate each point about the centre: use a MeshBuilder-free wrapper
  const rot = ((90 - GROUP_FACING) * Math.PI) / 180, cs = Math.cos(rot), sn = Math.sin(rot)
  const P = (x: number, z: number): [number, number] => [cx + x * cs - z * sn, cz + x * sn + z * cs]
  const bm = (x0: number, y0_: number, z0: number, x1: number, y1: number, z1: number, r: number, c: Rgb): void => {
    const [ax, az] = P(x0, z0), [bx, bz] = P(x1, z1)
    beam(out, [ax, y0 + y0_, az], [bx, y0 + y1, bz], r, c)
  }
  const pr = (x: number, z: number, h0: number, h1: number, r: number, c: Rgb, sides = 8): void => {
    const [px, pz] = P(x, z)
    prism(out, px, pz, y0 + h0, y0 + h1, r, sides, c, FIXED, r * 0.8)
  }
  const [rx, rz] = P(0, 0)
  crag(out, rx, y0 - 0.1, rz, ROCK_R, ROCK_H, ROCK_R * 0.8, 4, ROCK)    // the waves/rock the group rises from
  const top = ROCK_H * 0.9
  // the chariot: a low car with a high curved front, wheels as discs
  pr(-1.4, 0, top, top + 0.55, 0.9, GOLD, 10)
  bm(-2.3, 0, top + 0.1, -2.3, 0, top + 1.3, 0.1, GOLD)
  for (const side of [-1, 1]) pr(-1.4, side * 1.0, top + 0.1, top + 0.6, 0.5, LEAD, 10)
  // Apollo standing in the car, an arm up
  pr(-1.5, 0, top + 0.5, top + 1.8, 0.2, GOLD, 8)
  pr(-1.5, 0, top + 1.8, top + 2.2, 0.13, GOLD, 8)
  bm(-1.5, 0.1, top + 1.6, -1.2, 0.5, top + 2.5, 0.07, GOLD)
  // four horses abreast in two ranks
  for (let i = 0; i < 4; i++) {
    const zz = (i - 1.5) * HORSE_SPREAD, xx = i % 2 ? 0.6 : 0
    const [hx, hz] = P(xx + 0.3, zz)
    // draw each horse's beams through bm by building in the local frame
    const h = HORSE_H, L = HORSE_L * 0.5
    const lx = (a: number): number => xx + 0.3 + a
    bm(lx(-L), top + h * 0.45, zz, lx(L * 0.7), top + h * 0.75, zz, 0.3, LEAD)
    bm(lx(L * 0.7), top + h * 0.75, zz, lx(L * 1.1), top + h * 1.1, zz, 0.17, LEAD)
    bm(lx(L * 1.1), top + h * 1.1, zz, lx(L * 1.45), top + h * 0.98, zz, 0.12, GOLD)
    bm(lx(L * 0.6), top + h * 0.6, zz + 0.14, lx(L * 1.25), top + h * 0.8, zz + 0.2, 0.07, LEAD)
    bm(lx(L * 0.6), top + h * 0.6, zz - 0.14, lx(L * 1.15), top + h * 0.9, zz - 0.2, 0.07, LEAD)
    bm(lx(-L), top + h * 0.45, zz, lx(-L * 1.1), top + 0.05, zz, 0.09, LEAD)
    void hx; void hz
  }
  // two tritons kneeling at the flanks, blowing conches, and dolphins at the front
  for (const side of [-1, 1]) {
    pr(-0.2, side * 3.0, top - 0.2, top + 0.9, 0.22, LEAD, 8)
    bm(-0.2, side * 3.0, top + 0.9, 0.4, side * 3.0, top + 1.5, 0.08, GOLD)
    bm(-0.6, side * 3.0, top - 0.1, -1.4, side * 3.1, top - 0.1, 0.16, LEAD)
    bm(2.4, side * 2.1, top, 3.2, side * 2.4, top + 0.5, 0.17, GOLD)    // dolphin
  }
}

function apollon(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0
  curbed(out, y, APOLLON_RING)
  // the island: its own kerb round OSM's inner ring, a grass top, the drum and the group
  const isl = ccw(ISLAND_RING.map(([x, z]) => ({ x, z })))
  wall(out, isl, y - 0.3, y + ISLAND_H, WET, false)
  capPolygonWithHoles(out, [isl], y + ISLAND_H, WET, FIXED)
  const [sx, , sz] = APOLLON_STAND_AT()
  chariotGroup(out, sx, y + ISLAND_H + DRUM_H, sz)
}

function miroir(out: MeshBuilder, fit: Fit): void {
  curbed(out, fit.grade ?? 0, MIROIR_RING)
}

export const versaillesBassinApollon = (out: MeshBuilder, fit: Fit): void => apollon(out, fit)
export const versaillesBassinMiroir = (out: MeshBuilder, fit: Fit): void => miroir(out, fit)
