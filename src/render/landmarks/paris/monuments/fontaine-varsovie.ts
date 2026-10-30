import { type MeshBuilder, capPolygonWithHoles } from '../../../buildings.ts'
import { prism, type Rgb } from '../../../models.ts'
import { beam, hex, shade } from '../../kit.ts'
import { offsetRing } from '../../parts.ts'
import { ccw, FIXED, ring, walls } from './common.ts'

/*
 * THE FONTAINE DE VARSOVIE (Roger-Henri Expert, 1937), the long basin down the Jardins du Trocadéro on the axis from Chaillot to the Eiffel Tower: 100 m of
 * pale kerb and pale blue water, the cross-basin at its head under the terrace and the round end toward the Pont d'Iéna; and
 * running along it, when it runs, the most water in Paris — the bank of twenty water cannons at the head firing down the
 * length of the pool, the rows of jets along both sides and the tall plumes up the middle. Neither the Parvis (`trocaderoParvis`) nor
 * Chaillot draw any of this.
 *
 * The ring is OSM's (way 79738429, its side channels left out). The cannons and jets are placed by their count and pattern
 * as described and remembered, not by a survey or a photograph: no reference of the running water was found. They stand still.
 * `drape`: the garden falls toward the river and every vertex follows it, y here is over the ground. Frame: −z down the axis
 * toward the river at bearing 134 (osmium, 2026-10-30).
 */
const STONE: Rgb = hex('#b7b0a0')
const WATER: Rgb = hex('#5f8ba0')
const SPRAY: Rgb = hex('#e8f1f4')

const BASIN = ring([12.4, 41.3, 11.7, -52.4, 5.6, -59.4, 0.7, -60.7, -5.5, -59.8, -10.5, -55.7, -12.8, -48.6, -12.1, 41.1, -29.6, 41.2, -29.5, 49.8, 29.6, 49.3, 29.6, 41.2])
const W = 0.14

/** A column of water from (x, z) up `h`, tapering, with a pale ring at its foot. */
function plume(out: MeshBuilder, x: number, z: number, h: number, r: number): void {
  prism(out, x, z, W, W + 0.03, r * 7, 8, shade(WATER, 1.3), FIXED, r * 7, true)
  prism(out, x, z, W, W + h, r, 6, SPRAY, FIXED, r * 0.25, true)
}

/** A cannon's long arc from (x, z), down the pool by `len`, turned out by `dx`, rising `h`. */
function cannon(out: MeshBuilder, x: number, z: number, len: number, dx: number, h: number): void {
  const n = 7
  let p: [number, number, number] = [x, W + 0.5, z]
  for (let i = 1; i <= n; i++) {
    const t = i / n
    const q: [number, number, number] = [x + dx * t, W + 0.5 + 4 * h * t * (1 - t), z - len * t]
    beam(out, p, q, 0.07, SPRAY)
    p = q
  }
  prism(out, x, z - len, W, W + 0.03, 0.8, 8, shade(WATER, 1.3), FIXED, 0.8, true)
}

export function fontaineVarsovie(out: MeshBuilder): void {
  const inner = ccw(BASIN)
  const outer = offsetRing(inner, 0.7)
  walls(out, outer, 0, 0.42, shade(STONE, 0.92))
  capPolygonWithHoles(out, [outer, [...inner].reverse()], 0.42, STONE, FIXED)
  capPolygonWithHoles(out, [inner], W, WATER, FIXED)
  walls(out, inner, W, 0.42, shade(STONE, 0.72))

  // the bank of twenty cannons across the head of the pool, fanning a little
  for (let i = 0; i < 20; i++) {
    const u = (i - 9.5) / 9.5
    cannon(out, u * 10.8, 40, 26 + 8 * (1 - Math.abs(u)), u * 2.2, 5 + 3 * (1 - Math.abs(u)))
  }
  // the rows of low jets along both sides, the plumes up the middle
  for (let z = -46; z <= 8; z += 6) {
    for (const s of [-1, 1]) plume(out, s * 9.6, z, 3.2, 0.11)
  }
  for (const z of [-44, -28, -12, 4]) plume(out, 0, z, 10, 0.22)
}
