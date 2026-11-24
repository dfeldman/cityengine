import { MeshBuilder } from '../../../../buildings.ts'
import type { Rgb } from '../../../../models.ts'
import { hex, lathe, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { basin, circle, falls, G } from '../plaza-common.ts'
import { jetRing } from './monument-kit.ts'

/*
 * THE FONTAINE DES POLYPORES (rue Modigliani at the rue Saint-Charles, 15e; Jean-Yves Lechevallier, 1982; Wikidata Q23459533;
 * locals call it "la pile d'assiettes"): a low round basin with a wide stone coping and, in the middle, two heaps of shallow
 * stone dishes (the "bracket fungi") piled up unevenly, each dish a little smaller than the one below and slightly tilted,
 * the water running from dish to dish into the basin. Frame: y up from the pavement at G, the basin's centre at the origin.
 * Basin ~5.3 m outer radius from OSM way 291115567 (19 points, 4.96..5.5 m from their centroid); the heaps' heights (~3.4 m and
 * ~2.6 m) and dish sizes are scaled off two Commons photographs against the basin and the trees, not surveyed. The dishes are
 * a seeded pile of tilted lathe bowls (geometry, not carving), so there is no Modly piece.
 */
export const R = 5.6

// tunables
const BASIN_R = 5.0          // inside of the coping
const COPING = 0.55          // coping width
const BASIN_H = 0.5
const FLOOR_Y = 0.12         // water floor above the pavement
const PLINTH_R = 1.55
const PLINTH_H = 0.5
const SEED = 7
const STACKS: { x: number; z: number; n: number; r0: number; r1: number; h: number; lean: number }[] = [
  { x: -0.2, z: 0.1, n: 24, r0: 1.75, r1: 0.5, h: 3.1, lean: 0.14 },   // the tall heap
  { x: 0.9, z: -0.55, n: 16, r0: 1.25, r1: 0.45, h: 2.25, lean: 0.17 },  // the low heap beside it
]

const STONE: Rgb = hex('#cdb995')
const COPE: Rgb = hex('#c4bba9')
const WATER: Rgb = hex('#6d93a0')
const FALL: Rgb = hex('#d3e3e6')

const rng = (s: number) => () => { s = (s * 16807) % 2147483647; return s / 2147483647 }

/** One shallow stone dish (rim radius r, 0.2 r deep) tilted by (tx, tz) radians and put at (x, y, z), added to q. */
function dish(q: MeshBuilder, x: number, y: number, z: number, r: number, tx: number, tz: number, c: Rgb): void {
  const t = new MeshBuilder()
  const d = Math.max(0.11, r * 0.13)
  lathe(t, 0, 0, [[0.3 * r, 0], [0.65 * r, d * 0.35], [r, d * 1.15], [r, d * 1.5], [0.93 * r, d * 1.5], [0.6 * r, d * 0.8], [0.01, d * 0.55]], 14, c)
  const sx = Math.sin(tx), cx = Math.cos(tx), sz = Math.sin(tz), cz = Math.cos(tz)
  const rot = (a: number, b: number, e: number): [number, number, number] => {
    const y1 = b * cx - e * sx, z1 = b * sx + e * cx          // about x
    return [a * cz - y1 * sz, a * sz + y1 * cz, z1]            // about z
  }
  const base = q.positions.length / 3
  for (let i = 0; i < t.positions.length; i += 3) {
    const p = rot(t.positions[i], t.positions[i + 1], t.positions[i + 2])
    q.positions.push(p[0] + x, p[1] + y, p[2] + z)
    const n = rot(t.normals[i], t.normals[i + 1], t.normals[i + 2])
    q.normals.push(n[0], n[1], n[2])
  }
  for (const u of t.uvs) q.uvs.push(u)
  for (const k of t.colors) q.colors.push(k)
  for (const i of t.indices) q.indices.push(base + i)
}

function draw(q: MeshBuilder): void {
  basin(q, circle(BASIN_R + COPING), circle(BASIN_R), 0, G + BASIN_H, COPE, WATER)
  falls(q, circle(BASIN_R), G + FLOOR_Y, G + BASIN_H - 0.05, FALL)
  const y0 = G + FLOOR_Y
  lathe(q, 0, 0, [[PLINTH_R, y0], [PLINTH_R, y0 + PLINTH_H * 0.8], [PLINTH_R * 0.9, y0 + PLINTH_H]], 20, shade(STONE, 0.9))
  const rnd = rng(SEED)
  for (const s of STACKS) {
    for (let i = 0; i < s.n; i++) {
      const t = i / (s.n - 1)
      const r = s.r0 + (s.r1 - s.r0) * Math.pow(t, 0.85) * (0.9 + rnd() * 0.2)
      const jx = (rnd() - 0.5) * 0.35 * r, jz = (rnd() - 0.5) * 0.35 * r
      const y = y0 + PLINTH_H * 0.8 + t * (s.h - 0.25)
      dish(q, s.x + jx, y, s.z + jz, r, (rnd() - 0.5) * 2 * s.lean, (rnd() - 0.5) * 2 * s.lean, shade(STONE, 0.9 + rnd() * 0.18))
    }
    // water running off the lower dishes into the basin
    jetRing(q, s.x, s.z, 5, s.r0 * 0.9, y0 + PLINTH_H + 0.35, s.r0 * 0.9 + 1.2, y0 + 0.05, { rise: 0.15, c: FALL, phase: s.x })
  }
}

export function fontainePolypores(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, R, R, draw)
}
