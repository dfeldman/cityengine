import type { MeshBuilder } from '../../buildings.ts'
import { box, type Rgb } from '../../models.ts'
import { beam } from '../kit.ts'

const FIXED = 0

/**
 * The Louvre Pyramid (I. M. Pei, 1989) in the Cour Napoléon: 35.4 m square, 21.6 m high, glass on a steel
 * lattice — the diamonds of its panes are what makes it read at a glance — with the three small pyramids
 * round it and the triangular basins of its fountains. Faces on ±x and ±z, square to the palace.
 */
export function louvrePyramid(out: MeshBuilder): void {
  const glass: Rgb = [0.55, 0.62, 0.66]
  const steel: Rgb = [0.3, 0.32, 0.34]
  const water: Rgb = [0.22, 0.33, 0.4]
  const stone: Rgb = [0.78, 0.75, 0.68]
  pyramid(out, 0, 0, 17.7, 21.6, glass, steel, 0.12)
  // the three small ones, on the north, south and east sides
  for (const [x, z] of [[0, -26], [0, 26], [26, 0]]) pyramid(out, x, z, 2.8, 3.8, glass, steel, 0.05)
  // the basins: a triangle in each quarter of the court round the pyramid, stone-rimmed, with the water in it
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const n = 7
    for (let i = 0; i < n; i++) {
      // a triangle as strips, widest at the pyramid's corner side
      const t0 = i / n
      const t1 = (i + 1) / n
      const a = 21 + 16 * t0
      const b = 21 + 16 * t1
      const w0 = 16 * (1 - t0)
      const w1 = 16 * (1 - t1)
      const cx = sx * (a + b) / 2
      box(out, cx, 0.35, sz * (w0 + w1) / 4, (b - a) / 2, 0.35, (w0 + w1) / 4 + 0.3, stone, FIXED)
      box(out, cx, 0.72, sz * (w0 + w1) / 4, (b - a) / 2 - 0.1, 0.02, (w0 + w1) / 4, water, FIXED)
    }
  }
}

/** A square pyramid of glass, its four faces with the lattice of diamonds drawn in steel over them. */
function pyramid(out: MeshBuilder, cx: number, cz: number, h: number, height: number, glass: Rgb, steel: Rgb, r: number): void {
  const apex: [number, number, number] = [cx, height, cz]
  const c: [number, number, number][] = [[cx - h, 0, cz - h], [cx + h, 0, cz - h], [cx + h, 0, cz + h], [cx - h, 0, cz + h]]
  for (let i = 0; i < 4; i++) {
    const a = c[i]
    const b = c[(i + 1) % 4]
    // the face, wound to face out
    const mx = (a[0] + b[0]) / 2 - cx
    const mz = (a[2] + b[2]) / 2 - cz
    const len = Math.hypot(mx, mz) || 1
    const nrm: [number, number, number] = [mx / len * 0.84, h / Math.hypot(h, height) * 0.54 + 0.3, mz / len * 0.84]
    out.quad([a, b, apex, apex], nrm, [[0, 0], [1, 0], [0.5, 1], [0.5, 1]], glass, FIXED)
    // the lattice: lines parallel to each slanting edge from points along the base — a diamond grid
    const lines = Math.max(3, Math.round(h / 2.2))
    const lift = (p: [number, number, number]): [number, number, number] => [p[0] + (mx / len) * 0.06, p[1] + 0.03, p[2] + (mz / len) * 0.06]
    const along = (t: number): [number, number, number] => [a[0] + (b[0] - a[0]) * t, 0, a[2] + (b[2] - a[2]) * t]
    const plus = (p: [number, number, number], d: [number, number, number], k: number): [number, number, number] =>
      [p[0] + d[0] * k, p[1] + d[1] * k, p[2] + d[2] * k]
    const upA: [number, number, number] = [apex[0] - a[0], apex[1] - a[1], apex[2] - a[2]]
    const upB: [number, number, number] = [apex[0] - b[0], apex[1] - b[1], apex[2] - b[2]]
    for (let k = 1; k < lines; k++) {
      const t = k / lines
      const p = along(t)
      beam(out, lift(p), lift(plus(p, upA, 1 - t)), r, steel)
      beam(out, lift(p), lift(plus(p, upB, t)), r, steel)
    }
    beam(out, a, apex, r * 2, steel)
  }
}
