import type { MeshBuilder } from '../../../buildings.ts'
import type { Rgb } from '../../../models.ts'
import { block, hex, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { extrude, fitted, palette, pts, type Pal } from './common.ts'
import { lettersAlong } from './showfront.ts'
import { baysOf, wallOn, type Wall } from './wall.ts'

/** the design footprint: OSM relation 541080's box turned to the Rue Croix-des-Petits-Champs (local −z faces bearing 110) */
const HX = 125.25
const HZ = 56.15
const EAVES = 19.4

/** The relation's outer ring (way 54046037) and its nine courts, in the model's frame. */
const OUTER = pts([
  -121.8, 54.9, -125.3, 51.3, -124.6, -47.7, -118.9, -53.4, -20.4, -52.4, 49.8, -56.1, 125.3, 34.5, 121.7, 38, 110.6, 37.9, 102.6, 28, 91.2, 37.7, 86.3, 37.8, 83.6, 34, 97.5, 22, 81, 2.4, 38.6, 37.2, 32.6, 37.2, 32.3, 56.1,
])
const COURTS = [
  pts([-110.2, 24.3, -103.4, 24.4, -103.5, 10.5, -107.8, 10.5, -107.9, 12.7, -110.1, 12.7]),
  pts([-38.5, 39.5, -24, 39.6, -23.5, -17.6, -37.9, -17.6]),
  pts([-108.3, -11.5, -103, -13.8, -102.9, -25.5, -109.7, -25.4]),
  pts([13.7, 27.5, 25.9, 27.5, 44.8, 11.3, 39.6, 2.8, 40.7, 1.7, 28.9, -10.4, 14, -10.4]),
  pts([-37.8, -25.3, -23.4, -25.2, -23.4, -31.8, -37.8, -31.9]),
  pts([58.1, 1.7, 79.8, -16.3, 74.2, -20.2, 64.9, -33.5, 43.8, -15]),
  pts([44.3, -28, 55.9, -37.9, 49.4, -45.6, 41.1, -38.8, 41, -31.7]),
  pts([65.8, 35.9, 58.3, 26.3, 72.4, 15.2, 74, 17.3, 79.5, 13, 87.6, 23.4, 73.3, 34.6, 71, 31.8]),
]

/**
 * La Banque de France, which took the Hôtel de Toulouse (François Mansart for La Vrillière, 1635–40; the Galerie Dorée inside) in 1808 and
 * grew round it to fill this whole block: 170 m along the Rue Croix-des-Petits-Champs alone. Mansart's house is inside, and what a
 * rider sees is the bank's own ranges in pale stone:
 *
 * - the long street ELEVATION: a banded rusticated base, three storeys with balconies on consoles and triangular heads on the
 *   first floor, a strong cornice, a mansard with its stone lucarnes and tall stacks;
 * - the DOOR at no. 39: a great arched green door between two lesser ones, carved panels either side, the BANQUE DE FRANCE tablet
 *   and balcony over it, the flags;
 * - the shallow frontispiece and pediment in the middle of the long front.
 *
 * Plan is OSM's, with its courts. Commons "Façade principale BDF" (the door) and "Façade de la Banque de France, angle de la rue Baillif
 * et de la rue Croix-des-Petits-Champs" (the corner, an old photograph). Heights scaled off them: base 7.2 m, cornice 19.4, the
 * mansard's top 23.6. The Rue de la Vrillière's and the Rue de Valois's fronts are drawn the same and are unchecked.
 */
export function hotelToulouse(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

function draw(out: MeshBuilder): void {
  const p = palette('#d6cdb6', '#4d5358')
  extrude(out, [OUTER, ...COURTS], p, { eaves: EAVES, bay: 4.6, win: 1.6, rise: 3.8, inset: 2, dormers: true,
    storeys: [{ y: 0.6, h: 3.2 }, { y: 8, h: 3 }, { y: 12.4, h: 2.6 }, { y: 16, h: 1.8 }] })
  const iron: Rgb = [0.12, 0.12, 0.12]
  // ---- the long street front, in two stretches (the wall bends by 3° at the middle), and its corner to Rue Baillif
  const a = wallOn(out, { x: -118.9, z: -53.4 }, { x: -20.4, z: -52.4 })
  const b = wallOn(out, { x: -20.4, z: -52.4 }, { x: 49.8, z: -56.1 })
  long(a, p, iron, null)
  long(b, p, iron, 13)
  // the corner
  const c = wallOn(out, { x: 49.8, z: -56.1 }, { x: 125.3, z: 34.5 })
  long(c, p, iron, null)
  // the frontispiece in the middle of the long front
  pediment(a, a.L * 0.42, p)
  door(out, b, 13, p)
  // the tall stacks along the mansard, on the party walls of the street range
  const stack = shade(p.stone, 0.85)
  for (const [w, n] of [[a, 5], [b, 4]] as const) {
    for (let i = 0; i < n; i++) {
      const q = w.at(((i + 0.5) * w.L) / n, -3.4)
      block(out, q.x - 2.2, q.x + 2.2, q.z - 0.5, q.z + 0.5, EAVES + 2, EAVES + 6, stack)
      block(out, q.x - 2.35, q.x + 2.35, q.z - 0.62, q.z + 0.62, EAVES + 5.8, EAVES + 6.1, p.trim)
    }
  }
}

/** A stretch of the long elevation. `gap`: the u of the door, whose bays are left clear on the ground floor. */
function long(w: Wall, p: Pal, iron: Rgb, gap: number | null): void {
  const d = 0.25
  w.slab(0, w.L, 0, EAVES, d, p.stone, 0.05)
  for (let y = 0.7; y < 7; y += 0.7) w.rect(0, w.L, y - 0.05, y + 0.05, p.deep, d + 0.03)
  w.slab(-0.05, w.L + 0.05, 7, 7.5, 0.3 + d, p.trim)
  const { mids } = baysOf(w.L, 4.6, 0.8)
  mids.forEach((m, i) => {
    if (gap === null || Math.abs(m - gap) > 8) {
      w.rect(m - 1.1, m + 1.1, 0.9, 5.4, shade(p.stone, 1.05), d + 0.04)
      w.rect(m - 0.86, m + 0.86, 1, 5.2, p.glass, d + 0.06)
      w.rect(m - 0.86, m + 0.86, 1, 2, iron, d + 0.08)
      w.slab(m - 1.2, m + 1.2, 5.4, 5.8, d + 0.2, p.trim)
    }
    // the first floor: a balcony on consoles, the head triangular or flat by turns
    w.rect(m - 1.05, m + 1.05, 8.1, 11.6, p.trim, d + 0.03)
    w.rect(m - 0.82, m + 0.82, 8.2, 11.4, p.glass, d + 0.06)
    w.rect(m - 0.04, m + 0.04, 8.2, 11.4, shade(p.stone, 0.85), d + 0.08)
    w.slab(m - 1.2, m + 1.2, 7.9, 8.12, d + 0.5, p.trim)
    w.rect(m - 1.15, m + 1.15, 8.12, 8.95, iron, d + 0.48)
    w.slab(m - 1.3, m + 1.3, 11.6, 11.85, d + 0.25, p.trim)
    if (i % 2 === 0) w.ped(m - 1.3, m + 1.3, 11.85, 0.62, d + 0.22, p.trim)
    // the second floor and the third, plainer
    w.rect(m - 0.98, m + 0.98, 12.8, 15.4, p.trim, d + 0.03)
    w.rect(m - 0.76, m + 0.76, 12.9, 15.3, p.glass, d + 0.06)
    w.slab(m - 1.1, m + 1.1, 15.4, 15.56, d + 0.14, p.trim)
    w.rect(m - 0.9, m + 0.9, 16.3, 18, p.trim, d + 0.03)
    w.rect(m - 0.7, m + 0.7, 16.4, 17.9, p.glass, d + 0.06)
  })
  w.slab(0, w.L, 12.42, 12.6, d + 0.12, p.trim)
  // the cornice
  w.slab(-0.1, w.L + 0.1, EAVES - 1.2, EAVES - 0.75, d + 0.36, shade(p.trim, 0.96))
  w.slab(-0.2, w.L + 0.2, EAVES - 0.75, EAVES, d + 0.82, p.trim)
}

/** The shallow frontispiece and the pediment on the long front. */
function pediment(w: Wall, c: number, p: Pal): void {
  const hw = 8.4
  w.slab(c - hw, c + hw, 7.5, EAVES + 0.1, 0.75, shade(p.stone, 1.02))
  for (const s of [-1, 1]) for (const u of [hw - 0.8, hw - 3]) w.slab(c + s * u - 0.42, c + s * u + 0.42, 7.5, EAVES - 1.2, 1.05, p.trim)
  for (const u of [-3.1, 0, 3.1]) {
    w.rect(c + u - 1, c + u + 1, 8.2, 12, p.trim, 0.8)
    w.rect(c + u - 0.8, c + u + 0.8, 8.3, 11.8, p.glass, 0.84)
    w.rect(c + u - 0.9, c + u + 0.9, 13, 16, p.trim, 0.8)
    w.rect(c + u - 0.7, c + u + 0.7, 13.1, 15.9, p.glass, 0.84)
  }
  w.slab(c - hw - 0.3, c + hw + 0.3, EAVES - 0.1, EAVES + 0.5, 1.2, p.trim)
  w.ped(c - hw - 0.3, c + hw + 0.3, EAVES + 0.5, 3.6, 1.2, p.trim)
  w.ped(c - hw + 1.2, c + hw - 1.2, EAVES + 0.75, 2.7, 1.24, shade(p.stone, 0.92))
}

function door(out: MeshBuilder, w: Wall, c: number, p: Pal): void {
  const d = 0.3
  const green = hex('#26423a')
  w.slab(c - 8.4, c + 8.4, 0, 7.6, d + 0.3, shade(p.stone, 1.02))
  for (let y = 0.7; y < 7; y += 0.7) w.rect(c - 8.4, c + 8.4, y - 0.05, y + 0.05, p.deep, d + 0.33)
  // the great arched door and its surround, the two lesser doors
  w.arch(c, 0, 5.2, 6.6, p.trim, d + 0.34)
  w.arch(c, 0, 4.4, 6.2, green, d + 0.36)
  w.rect(c - 0.05, c + 0.05, 0, 4, shade(green, 1.7), d + 0.38)
  w.rect(c - 2.2, c + 2.2, 3.9, 4.04, shade(green, 1.7), d + 0.38)
  for (const s of [-1, 1]) {
    w.rect(c + s * 5.2 - 1.15, c + s * 5.2 + 1.15, 0, 4.5, p.trim, d + 0.34)
    w.rect(c + s * 5.2 - 0.9, c + s * 5.2 + 0.9, 0, 4.3, green, d + 0.36)
    // the carved panel over it
    w.rect(c + s * 5 - 1.1, c + s * 5 + 1.1, 4.9, 6.9, shade(p.stone, 0.88), d + 0.35)
  }
  // the balcony and the tablet with the name
  w.slab(c - 6.2, c + 6.2, 7.6, 7.9, d + 1.05, p.trim)
  w.rect(c - 6.1, c + 6.1, 7.9, 8.9, shade(p.stone, 0.95), d + 1)
  w.rect(c - 3.6, c + 3.6, 7.98, 8.82, hex('#3c3a33'), d + 1.03)
  lettersAlong(out, w.at(0, d + 1.05), w.at(w.L, d + 1.05), c, 8.15, 'BANQUE DE FRANCE', { h: 0.48, c: hex('#d7c384'), wide: 0.62, th: 0.07, gap: 0.09, d: 0.02 })
  // the flags
  const flag = (u: number, cols: string[]): void => cols.forEach((col, i) => w.slab(c + u + i * 0.5, c + u + (i + 1) * 0.5, 9, 11, d + 1.05, hex(col), -(d + 1)))
  flag(0.4, ['#23408e', '#f2f2f2', '#d0232b'])
  flag(-2, ['#2a4f9d', '#2a4f9d', '#2a4f9d'])
}
