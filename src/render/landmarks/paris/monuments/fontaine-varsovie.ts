import { type MeshBuilder, capPolygonWithHoles } from '../../../buildings.ts'
import { prism, type Rgb } from '../../../models.ts'
import { block, hex, shade } from '../../kit.ts'
import type { P2 } from '../../stairway.ts'
import { offsetRing } from '../../parts.ts'
import { ccw, FIXED, ring, walls } from './common.ts'

/*
 * THE FONTAINE DE VARSOVIE (Roger-Henri Expert, 1937), the long basin down the Jardins du Trocadéro on the axis from Chaillot to the Eiffel Tower: 100 m of
 * pale kerb and pale blue water, the cross-basin at its head under the terrace and the round end toward the Pont d'Iéna; and
 * running along it, when it runs, the most water in Paris — the bank of twenty water cannons at the head firing down the
 * length of the pool, the rows of jets along both sides and the tall plumes up the middle. Neither the Parvis (`trocaderoParvis`) nor
 * Chaillot draw any of this.
 *
 * The ring is OSM's (way 79738429, its side channels left out). The rest from the owner's aerial (2026-11-03): at the head
 * a stepped half-round basin pushing into the pool and a water stair up the head wall between two upper pools, each with
 * its raised square basin and two rows of tall jets; clipped yew cones in a line along both side walls; at the river end
 * a shallow crescent pool round the curved end and a sculpted pylon either side. The water is not drawn here: it is the
 * fountain shader's (public/landmarks/paris-fountains.json, "Fontaine de Varsovie", drawn by tools/varsovie-water.ts),
 * which moves.
 * `drape`: the garden falls toward the river and every vertex follows it, y here is over the ground. Frame: −z down the axis
 * toward the river at bearing 134 (osmium, 2026-10-30).
 */
const STONE: Rgb = hex('#c9c1ae')
const WATER: Rgb = hex('#5f8ba0')
const YEW: Rgb = hex('#3d5a34')

const BASIN = ring([12.4, 41.3, 11.7, -52.4, 5.6, -59.4, 0.7, -60.7, -5.5, -59.8, -10.5, -55.7, -12.8, -48.6, -12.1, 41.1, -29.6, 41.2, -29.5, 49.8, 29.6, 49.3, 29.6, 41.2])
const W = 0.14

/** A pool: kerb walls round `plan`, the water `W` inside, its floor at `y`. */
function pool(out: MeshBuilder, plan: P2[], y: number, kerb = 0.7, h = 0.42): void {
  const inner = ccw(plan)
  const outer = offsetRing(inner, kerb)
  walls(out, outer, y, y + h, shade(STONE, 0.92))
  capPolygonWithHoles(out, [outer, [...inner].reverse()], y + h, STONE, FIXED)
  capPolygonWithHoles(out, [inner], y + W, WATER, FIXED)
  walls(out, inner, y + W, y + h, shade(STONE, 0.72))
}
const rect = (x0: number, z0: number, x1: number, z1: number): P2[] => ring([x0, z0, x1, z0, x1, z1, x0, z1])

export function fontaineVarsovie(out: MeshBuilder): void {
  // ---- the long pool and its head cross-basin (OSM's ring)
  pool(out, BASIN, 0)

  // ---- the walks either side, a low wall along the pool, the yew cones standing on it
  for (const s of [-1, 1]) {
    block(out, s > 0 ? 13.1 : -15.1, s > 0 ? 15.1 : -13.1, -47, 40.5, 0, 0.75, STONE)
    for (let z = -45; z <= 38; z += 6.9) {
      prism(out, s * 14.1, z, 0.75, 0.95, 0.75, 10, shade(STONE, 0.9))
      prism(out, s * 14.1, z, 0.95, 3.2, 0.72, 10, YEW, FIXED, 0.03)
    }
  }

  // ---- the river end: the shallow crescent round the curved end, the low walls out to the two pylons
  const cres: number[] = []
  for (let i = 0; i <= 16; i++) {
    const a = Math.PI + (i / 16) * Math.PI
    cres.push(Math.cos(a) * 21, -44 + Math.sin(a) * 24)
  }
  const crescent = ring(cres)
  capPolygonWithHoles(out, [ccw(crescent)], 0.06, shade(WATER, 0.95), FIXED)
  walls(out, offsetRing(ccw(crescent), 0.5), 0, 0.3, STONE, STONE)
  for (const s of [-1, 1]) {
    block(out, s * 19.5 - 1.3, s * 19.5 + 1.3, -45.5, -42.5, 0, 0.9, STONE)
    block(out, s * 21.5 - 1.1, s * 21.5 + 1.1, -45, -43, 0.9, 5.2, STONE)           // the pylon
    block(out, s * 21.5 - 1.2, s * 21.5 + 1.2, -45.1, -42.9, 5.2, 5.5, shade(STONE, 1.05))
    block(out, s * 21.5 - 0.8, s * 21.5 + 0.8, -45.25, -42.75, 1.6, 4.6, shade(STONE, 0.86))  // its relief, standing proud
    block(out, s > 0 ? 13.1 : -19.5, s > 0 ? 19.5 : -13.1, -44.5, -43.5, 0, 0.75, STONE)
  }

  // ---- the head: the half-round stepped basin pushing into the pool from the cross-basin
  for (const [r, y] of [[6.2, 0.35], [4.6, 0.7], [3.0, 1.05]] as [number, number][]) {
    prism(out, 0, 42.5, 0, y, r, 24, shade(STONE, 0.95), FIXED, r, true)
    prism(out, 0, 42.5, y - 0.02, y + 0.01, r - 0.35, 24, WATER, FIXED, r - 0.35, true)
  }
  // the head wall behind the cross-basin, broken in the middle by the water stair
  const top = 1.6
  for (const s of [-1, 1]) block(out, s > 0 ? 3.4 : -30.3, s > 0 ? 30.3 : -3.4, 49.8, 51.2, 0, top, STONE)
  for (let i = 0; i < 8; i++) {
    const z0 = 49.8 + i * 1.0
    block(out, -3.4, 3.4, z0, z0 + 1.0, 0, 0.2 * (i + 1), shade(STONE, i % 2 ? 0.96 : 1.0))
    block(out, -2.9, 2.9, z0 + 0.05, z0 + 0.95, 0.2 * (i + 1), 0.2 * (i + 1) + 0.02, WATER)
  }
  for (const s of [-1, 1]) block(out, s * 3.4 - 0.35, s * 3.4 + 0.35, 49.8, 58, 0, top + 0.3, STONE)  // the stair's cheeks

  // ---- the two upper pools either side of the stair, each with its raised square basin
  for (const s of [-1, 1]) {
    const x0 = s > 0 ? 5 : -28.5, x1 = s > 0 ? 28.5 : -5
    pool(out, rect(x0, 51.6, x1, 62), top - 0.42)
    pool(out, rect(s * 17 - 3.5, 54, s * 17 + 3.5, 59.5), top - 0.1, 0.5, 0.5)
  }
  // the terrace's retaining wall along the top
  block(out, -30.3, 30.3, 62.6, 63.6, 0, top + 1.6, STONE)
  block(out, -30.6, 30.6, 62.5, 63.7, top + 1.6, top + 1.75, shade(STONE, 1.05))
}
