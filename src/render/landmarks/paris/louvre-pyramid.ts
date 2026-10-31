import type { MeshBuilder } from '../../buildings.ts'
import { type Rgb } from '../../models.ts'
import { beam } from '../kit.ts'

const FIXED = 0

/**
 * The Louvre Pyramid (I. M. Pei, 1989) in the Cour Napoléon: 35.4 m square, 21.6 m high, glass on a steel
 * lattice — the diamonds of its panes are what makes it read at a glance — with the three small pyramids
 * round it. Faces on ±x and ±z, square to the palace, which is 6° off the historic axis (OSM's outline: bearing 109.4).
 *
 * The small ones (owner, 2026-10-30, 48.860979, 2.336218: "the three small pyramids are in the wrong position. their true positions are
 * represented by two small generic buildings") stand 46 m off on the three sides that are not the Passage Richelieu's way in: OSM's ways
 * 53815259–61, 8.2 m square and 5 m high (paris.json replaces them). Local +z is the east, the Cour Carrée's side; ±x the south and north.
 * The basins round it are OSM's water, at the level of the court; they are the city's now and not this model's.
 */
export function louvrePyramid(out: MeshBuilder): void {
  const glass: Rgb = [0.55, 0.62, 0.66]
  const steel: Rgb = [0.3, 0.32, 0.34]
  pyramid(out, 0, 0, 17.7, 21.6, glass, steel, 0.12)
  for (const [x, z] of [[46, 0], [0, 46], [-46, 0]]) pyramid(out, x, z, 4.1, 5, glass, steel, 0.05)
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
