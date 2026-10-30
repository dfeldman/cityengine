import type { MeshBuilder } from '../../../buildings.ts'
import type { Rgb } from '../../../models.ts'
import { block, hex, roof, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { archOn, fitted, palette, rectOn, slabOn, type F } from './common.ts'

/** the design footprint: OSM way 30612670's box turned to the Rue Eugène Spuller (local −z faces bearing 308) */
const HX = 33.05
const HZ = 36.15
const EAVES = 13
const APEX = 19

/** the three naves side by side, x0..x1 and how far back each runs: the plan is an L, its back-left quarter open */
const NAVES: [number, number, number][] = [[-33, -11, 14.2], [-11, 11, 14.2], [11, 33, 36]]
const FRONT = -35.8

/**
 * Le Carreau du Temple (Jules de Mérindol, 1863; restored by Milou in 2014), the last of the Temple's clothes-market
 * halls: a cast-iron basilica in the middle of the old 3rd arrondissement. What a rider sees:
 *
 * - the three GABLES in a row on the Rue Eugène Spuller, each a tall triangle of glass on grey iron over five round-headed
 *   lights, a lantern along its ridge with two little arched lights of its own at the apex;
 * - the iron FRAME, posts and lattice frieze, over a low wall of brick and glass;
 * - the flank on the Rue Perrée: one great arch after another, a stone doorway let into the first.
 *
 * Which way the naves run and the three gables are read from Commons "Carreau du Temple, Paris 9 April 2014" (which shows
 * the gables in line and a flank) against OSM's plan, an L of 66 × 72 m: 66 m divides into three gables of the width the
 * photograph shows. Heights scaled off the same photograph, on the doorway: brick to 4 m, frieze 5.2, eaves 13, apex 19.
 */
export function carreauTemple(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

function draw(out: MeshBuilder): void {
  const p = palette('#d9cdb3', '#59625f')
  const iron: Rgb = hex('#4d5655')
  const rib = shade(iron, 1.18)
  const brick = hex('#8c7869')
  const glass: Rgb = [0.34, 0.39, 0.41]
  const zinc = hex('#6f787a')
  // ---- the naves
  for (const [x0, x1, z1] of NAVES) {
    const w = x1 - x0
    block(out, x0, x1, FRONT, z1, 0, EAVES, shade(glass, 0.85))
    roof(out, x0, x1, FRONT, z1, EAVES, APEX - EAVES, w / 2, 0, zinc)
    // the glass strip down each slope under the lantern
    for (const s of [-1, 1]) {
      const a = (x0 + x1) / 2 + s * w * 0.3
      const b = (x0 + x1) / 2 + s * w * 0.1
      const ya = EAVES + (APEX - EAVES) * 0.4
      const yb = EAVES + (APEX - EAVES) * 0.8
      out.quad([[a, ya + 0.08, FRONT + 0.6], [b, yb + 0.08, FRONT + 0.6], [b, yb + 0.08, z1 - 0.6], [a, ya + 0.08, z1 - 0.6]],
        [s * 0.5, 0.86, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], glass, 0)
    }
    gable(out, '-z', FRONT, x0, x1, iron, rib, brick, glass)
    gable(out, '+z', z1, x0, x1, iron, rib, brick, glass)
    // the lantern along the ridge
    const cx = (x0 + x1) / 2
    const lw = 2.4
    const y0 = APEX - 1.05
    block(out, cx - lw, cx + lw, FRONT + 0.2, z1 - 0.2, y0, APEX + 1, shade(glass, 0.95))
    roof(out, cx - lw - 0.2, cx + lw + 0.2, FRONT + 0.1, z1 - 0.1, APEX + 1, 0.9, lw + 0.2, 0, zinc)
    for (const s of [-1, 1]) {
      for (let z = FRONT + 0.3; z < z1 - 0.2; z += 2.4) slabOn(out, s < 0 ? '-x' : '+x', cx + s * lw, z - 0.06, z + 0.06, y0, APEX + 1, 0.05, rib)
    }
    for (const [f, z] of [['-z', FRONT + 0.2], ['+z', z1 - 0.2]] as [F, number][]) {
      archOn(out, f, z, cx - 1.1, APEX - 0.75, 1.4, 1.5, rib, 0.04)
      archOn(out, f, z, cx + 1.1, APEX - 0.75, 1.4, 1.5, rib, 0.04)
      archOn(out, f, z, cx - 1.1, APEX - 0.68, 1.2, 1.34, glass, 0.06)
      archOn(out, f, z, cx + 1.1, APEX - 0.68, 1.2, 1.34, glass, 0.06)
    }
  }
  // the low block filling the back of the L behind the middle nave, up to Rue de Picardie
  block(out, 0, 11, 14.2, 36, 0, 9.5, brick)
  block(out, 0, 11, 14.2, 36, 9.5, 10, iron)
  // ---- the flanks: one great arch after another, on Rue Perrée and on the Dupetit-Thouars side
  flank(out, '+x', 33, FRONT, 36, iron, rib, brick, glass)
  flank(out, '-x', -33, FRONT, 14.2, iron, rib, brick, glass)
  // the stone doorway let into the Rue Perrée flank, by the corner
  const dz = FRONT + 8.8
  slabOn(out, '+x', 33, dz - 2.1, dz + 2.1, 0, 4.3, 0.3, p.stone)
  archOn(out, '+x', 33.3, dz, 4.3, 4.2, 1.5, p.stone, 0)
  archOn(out, '+x', 33.3, dz, 0, 2.5, 3.5, shade(glass, 0.5), 0.05)
  for (const s of [-1, 1]) rectOn(out, '+x', 33.3, dz + s * 1.7 - 0.08, dz + s * 1.7 + 0.08, 0.3, 4.1, p.deep, 0.03)
}

/** One gable end on a face: the brick and glass, the iron posts, the frieze, five lights, the triangle over them. */
function gable(out: MeshBuilder, f: F, z: number, x0: number, x1: number, iron: Rgb, rib: Rgb, brick: Rgb, glass: Rgb): void {
  const w = x1 - x0
  const bay = w / 5
  const cx = (x0 + x1) / 2
  const y = (x: number): number => APEX - ((APEX - EAVES) * Math.abs(x - cx)) / (w / 2)
  rectOn(out, f, z, x0, x1, 0, 4, brick, 0.05)
  rectOn(out, f, z, x0, x1, 4, 5.2, iron, 0.07)
  for (let i = 0; i < 5; i++) {
    const t = x0 + bay * (i + 0.5)
    // the opening in the brick
    rectOn(out, f, z, t - bay * 0.32, t + bay * 0.32, 0, 3.4, shade(glass, 0.6), 0.08)
    // the lattice frieze: a row of little rounds
    for (let k = -1; k <= 1; k++) archOn(out, f, z, t + k * bay * 0.28, 4.3, 0.74, 0.7, rib, 0.09)
    // the round-headed light, climbing with the gable
    const top = Math.min(y(t - bay / 2), y(t + bay / 2)) - 0.6
    archOn(out, f, z, t, 5.4, bay * 0.86, top - 5.4, iron, 0.08)
    archOn(out, f, z, t, 5.55, bay * 0.74, top - 5.65, glass, 0.1)
    rectOn(out, f, z, t - 0.05, t + 0.05, 5.55, top - 0.2, iron, 0.12)
    for (let yy = 7.2; yy < top - 1.4; yy += 1.7) rectOn(out, f, z, t - bay * 0.37, t + bay * 0.37, yy - 0.04, yy + 0.04, iron, 0.12)
  }
  // the glass triangle over the lights, on its iron rakes
  const nz = f === '-z' ? -1 : 1
  const d = nz * 0.09
  for (const [a, b] of [[x0, cx], [x1, cx]] as const) {
    const yb = y(b)
    out.quad([[a, y(a) - 0.75, z + d], [b, yb - 0.75, z + d], [b, yb, z + d], [a, y(a), z + d]], [0, 0, nz], [[0, 0], [1, 0], [1, 1], [0, 1]], rib, 0)
  }
  // the posts, the full height up the gable; thick at the ends where the whole hall's frame comes down
  for (let i = 0; i <= 5; i++) {
    const t = x0 + bay * i
    const e = i === 0 || i === 5 ? 0.42 : 0.17
    slabOn(out, f, z, t - e, t + e, 0, y(t) - 0.2, e === 0.42 ? 0.45 : 0.22, iron)
  }
}

/** A flank: bays of 7.2 m, each a great round-headed window over the brick and the frieze. */
function flank(out: MeshBuilder, f: F, x: number, z0: number, z1: number, iron: Rgb, rib: Rgb, brick: Rgb, glass: Rgb): void {
  const n = Math.max(1, Math.round((z1 - z0) / 7.2))
  const bay = (z1 - z0) / n
  rectOn(out, f, x, z0, z1, 0, 4, brick, 0.05)
  rectOn(out, f, x, z0, z1, 4, 5.2, iron, 0.07)
  for (let i = 0; i < n; i++) {
    const t = z0 + bay * (i + 0.5)
    rectOn(out, f, x, t - bay * 0.34, t + bay * 0.34, 0.2, 3.3, shade(glass, 0.6), 0.08)
    for (let k = -2; k <= 2; k++) archOn(out, f, x, t + (k * bay) / 5, 4.3, bay * 0.18, 0.7, rib, 0.09)
    archOn(out, f, x, t, 5.3, bay * 0.92, EAVES - 5.5, iron, 0.08)
    archOn(out, f, x, t, 5.4, bay * 0.84, EAVES - 5.7, glass, 0.1)
    for (let yy = 6.8; yy < 11.8; yy += 1.25) rectOn(out, f, x, t - bay * 0.4, t + bay * 0.4, yy - 0.03, yy + 0.03, iron, 0.12)
    for (const s of [-0.21, 0, 0.21]) rectOn(out, f, x, t + s * bay - 0.03, t + s * bay + 0.03, 5.4, EAVES - 1.3 - Math.abs(s) * 2, iron, 0.12)
  }
  for (let i = 0; i <= n; i++) {
    const t = z0 + bay * i
    slabOn(out, f, x, t - 0.28, t + 0.28, 0, EAVES + 0.2, 0.3, iron)
  }
  rectOn(out, f, x, z0, z1, EAVES - 0.4, EAVES + 0.15, rib, 0.1)
}
