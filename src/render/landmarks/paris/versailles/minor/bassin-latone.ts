/*
 * THE BASSIN DE LATONE and the two BASSINS DES LÉZARDS (Parterre de Latone, Versailles; Gaspard and Balthazar Marsy 1668-70,
 * Latona's group on top 1670; OSM way/13645589 and way/40409120, way/40409122). Architecture only: the bake draws the water and
 * tools/versailles-fountains.py the jets, so nothing here is a second pool surface except the thin sheet held in each tier.
 *   * LATONE: a wide low rim along OSM's pool outline (a 29 x 38 m blob), four concentric round marble basins rising as a
 *     pyramid out of it (each a moulded lip, a wall, a shallow water sheet), a rocky pedestal on the top tier, a stand-in for
 *     Latona and her children (replaced by the Modly group, see guided-queue.md), and gilded-lead frogs and lizards as lumps on
 *     the tiers' lips. Radii and heights are by eye off Commons photos (the real pyramid is ~7 m with the group).
 *   * LÉZARDS: a low round coping on OSM's ring (14 m across, wall height tag 0.1), a central rock with lead lizards, frogs, turtles.
 * Frame: the model's own frame about its ring's centroid, y up from the ground.
 */
import type { MeshBuilder } from '../../../../buildings.ts'
import { prism, type Rgb } from '../../../../models.ts'
import { hex, lathe, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { capPolygonWithHoles } from '../../../../buildings.ts'
import { ccw, FIXED, UV, walls, type P2 } from '../../monuments/common.ts'
import { edgeAt } from '../../../parts.ts'
import { circle } from '../../monuments/plaza-common.ts'
import { roundBasin } from '../../monuments/minor/monument-kit.ts'

// tunables (metres)
const POOL_RIM = { w: 0.7, h: 0.45, lipH: 0.08 }
const TIERS = { r: [9.6, 7.0, 4.7, 2.9], depth: [1.1, 1.1, 1.05, 1.0], rim: [0.55, 0.5, 0.45, 0.4], sink: 0.25 }
const ROCK = { r0: 2.0, r1: 1.0, h: 1.0 }
const FIGURE = { on: true, h: 2.9, kids: 0.9 }
const ANIMALS = { perTier: [14, 12, 10, 8], r: 0.22 }
export const LATONE = { STANDIN: FIGURE.on, topY: TIERS.depth.reduce((s, d) => s + d, 0) - TIERS.sink * 3 + ROCK.h }
const LEZ = { rim: 0.4, h: 0.2, rockR: 1.7, rockH: 0.9, animals: 7 }

const STONE: Rgb = hex('#d6d0c3')
const MARBLE: Rgb = hex('#cdc4b6')
const WATER: Rgb = hex('#7fa3ad')
const ROCKC: Rgb = hex('#9a9487')
const GOLD: Rgb = hex('#c9a13a')
const LEAD: Rgb = hex('#6f6f68')
const BRONZE: Rgb = hex('#5a5240')

const hash = (a: number, b: number): number => { const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return v - Math.floor(v) }
const centroid = (r: P2[]): P2 => ({ x: r.reduce((s, p) => s + p.x, 0) / r.length, z: r.reduce((s, p) => s + p.z, 0) / r.length })
const scaled = (r: P2[], c: P2, k: number): P2[] => r.map((p) => ({ x: c.x + (p.x - c.x) * k, z: c.z + (p.z - c.z) * k }))
const ringOf = (fit: Fit, r: number): P2[] => (fit.ring && fit.ring.length > 2 ? fit.ring : circle(r, 32).map((p) => ({ x: p.x, z: p.z })))

/** a wall seen from inside the plan (outward ring, normals face the middle) */
function innerWalls(out: MeshBuilder, plan: P2[], y0: number, y1: number, c: Rgb): void {
  const r = ccw(plan)
  for (let i = 0; i < r.length; i++) {
    const e = edgeAt(r, i)
    if (e.L < 0.01) continue
    out.quad([[e.b.x, y0, e.b.z], [e.a.x, y0, e.a.z], [e.a.x, y1, e.a.z], [e.b.x, y1, e.b.z]], [-e.nx, 0, -e.nz], UV, c, FIXED)
  }
}

/** a flat lump (frog, lizard, turtle) of radius r on a lip: a squashed 6-sided dome plus a head knob */
function lump(q: MeshBuilder, x: number, y: number, z: number, r: number, c: Rgb, seed: number): void {
  const a = hash(seed, 1) * Math.PI * 2
  prism(q, x, z, y, y + r * 0.55, r, 6, c, FIXED, r * 0.55, true, a)
  prism(q, x + Math.sin(a) * r * 0.95, z + Math.cos(a) * r * 0.95, y, y + r * 0.4, r * 0.4, 5, c, FIXED, r * 0.2, true)
}

/** a moulded round tier about (cx, cz), `depth` high from y0 with its lip ringed by gilded animals; returns its lip height */
function tier(q: MeshBuilder, cx: number, cz: number, y0: number, i: number, ring: boolean): number {
  const r = TIERS.r[i]
  const top = roundBasin(q, cx, cz, y0, r, { rim: TIERS.rim[i], depth: TIERS.depth[i], lip: 0.07, stone: MARBLE, water: WATER, sides: 40 })
  // a lower collar under the lip
  prism(q, cx, cz, y0, y0 + 0.12, r + 0.12, 40, shade(MARBLE, 0.92), FIXED, r + 0.12, true)
  if (ring) {
    const n = ANIMALS.perTier[i]
    for (let k = 0; k < n; k++) {
      const a = ((k + 0.5 * hash(i, k)) / n) * Math.PI * 2
      const rr = r - TIERS.rim[i] * 0.45
      lump(q, cx + Math.sin(a) * rr, top + 0.07, cz + Math.cos(a) * rr, ANIMALS.r * (0.8 + 0.4 * hash(k, i)), GOLD, i * 31 + k)
    }
  }
  return top + 0.07
}

/** Latona's stand-in: a robed figure on the rock with two small children kneeling at her feet (Modly replaces it) */
function standIn(q: MeshBuilder, cx: number, cz: number, y: number): void {
  const h = FIGURE.h
  lathe(q, cx, cz, [[0.01, y], [0.55, y], [0.6, y + h * 0.1], [0.4, y + h * 0.55], [0.28, y + h * 0.7], [0.3, y + h * 0.82], [0.01, y + h * 0.82]], 12, BRONZE)
  prism(q, cx, cz, y + h * 0.82, y + h, 0.2, 8, BRONZE, FIXED, 0.17, true)
  for (const s of [-1, 1]) {
    const x = cx + s * 0.9, z = cz + 0.35
    lathe(q, x, z, [[0.01, y], [0.28, y], [0.22, y + FIGURE.kids * 0.5], [0.01, y + FIGURE.kids * 0.62]], 8, BRONZE)
  }
}

export function bassinDeLatone(out: MeshBuilder, fit: Fit): void {
  const q = out, y = fit.grade ?? 0
  const outer = ringOf(fit, 17), c = centroid(outer)
  const P = POOL_RIM
  // the pool's rim along OSM's outline: stone coping with a moulded lip, wall down to the water
  const inner = scaled(outer, c, 1 - P.w / 17)
  walls(q, outer, y - 0.2, y + P.h, STONE)
  capPolygonWithHoles(q, [ccw(outer), [...ccw(inner)].reverse()], y + P.h, shade(STONE, 1.05), FIXED)
  innerWalls(q, inner, y - 0.2, y + P.h, shade(STONE, 0.85))
  // the four tiers
  let yb = y - 0.25
  let lip = yb
  for (let i = 0; i < 4; i++) {
    lip = tier(q, c.x, c.z, yb, i, true)
    yb = yb + TIERS.depth[i] - TIERS.sink
  }
  // the rocky pedestal on the top tier
  const top = yb + TIERS.sink
  lathe(q, c.x, c.z, [[ROCK.r0, top - 0.2], [ROCK.r0 * 0.9, top + ROCK.h * 0.25], [ROCK.r0 * 0.65, top + ROCK.h * 0.55], [ROCK.r1 * 1.1, top + ROCK.h * 0.85], [ROCK.r1, top + ROCK.h], [0.01, top + ROCK.h]], 9, ROCKC)
  if (FIGURE.on) standIn(q, c.x, c.z, top + ROCK.h - 0.05)
  void lip
}

/** a Bassin des Lézards: a low coping ring on OSM's circle, a central rock carrying lead lizards, frogs and turtles */
export function bassinDesLezards(out: MeshBuilder, fit: Fit): void {
  const q = out, y = fit.grade ?? 0
  const outer = ringOf(fit, 7.2), c = centroid(outer)
  const rMean = outer.reduce((s, p) => s + Math.hypot(p.x - c.x, p.z - c.z), 0) / outer.length
  const inner = scaled(outer, c, 1 - LEZ.rim / rMean)
  walls(q, outer, y - 0.2, y + LEZ.h, STONE)
  capPolygonWithHoles(q, [ccw(outer), [...ccw(inner)].reverse()], y + LEZ.h, shade(STONE, 1.05), FIXED)
  innerWalls(q, inner, y - 0.2, y + LEZ.h, shade(STONE, 0.85))
  const R = LEZ.rockR, H = LEZ.rockH
  lathe(q, c.x, c.z, [[R, y - 0.1], [R * 0.92, y + H * 0.3], [R * 0.7, y + H * 0.6], [R * 0.4, y + H * 0.9], [0.01, y + H]], 9, ROCKC)
  for (let k = 0; k < LEZ.animals; k++) {
    const a = (k / LEZ.animals) * Math.PI * 2 + hash(k, 3), t = 0.25 + 0.6 * hash(k, 9)
    const rr = R * (1 - t * 0.7), hy = y + H * t
    lump(q, c.x + Math.sin(a) * rr, hy, c.z + Math.cos(a) * rr, 0.2 + 0.1 * hash(k, 5), LEAD, 70 + k)
  }
}
