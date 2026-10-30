import type { MeshBuilder } from '../../../buildings.ts'
import type { Rgb } from '../../../models.ts'
import { block, classicalColumn, hex, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { extrude, fitted, palette, pts, type Pal } from './common.ts'
import { baysOf, wallOn, type Wall } from './wall.ts'

/** the design footprint: OSM relation 1020065's box turned to the Rue de Grenelle (local −z faces bearing 205) */
const HX = 33.75
const HZ = 41.45
const EAVES = 16.4

/** The relation's outer ring and two courts in the model's frame. */
const OUTER = pts([
  -25, -41.1, 22, -41.2, 23.1, -40.2, 33.8, 31.6, 20.8, 33.3, 21.2, 38.1, -26.7, 41.5, -28.9, 16.8, -14.8, 15.6, -16.4, -4.5, -27.3, -3.7, -26, 14.5, -31.6, 15.1, -33.8, -11.2, -23.1, -12.2, -23.7, -18.9, -15, -19.7, -15.3, -24.1,
  -17.1, -23.9, -17.5, -28.8, -24.5, -28.7,
])
const COURTS = [
  pts([-9.8, -27.6, -9.1, -18.7, 12.5, -20.3, 11.8, -28.7]),
  pts([-8.9, -5, -7.3, 15, -4.2, 14.8, -3.6, 22.5, 14.2, 21, 13.6, 13.3, 16.2, 13.1, 14.7, -6.8, 10.6, -6.5, 10, -14.2, -5.2, -13, -4.7, -5.4]),
]

/**
 * L'Hôtel de Rochechouart (Mathurin Cherpitel, 1776; the Ministry of Education since 1829), 110 Rue de Grenelle. The house is between
 * court and garden behind its street range, so what a rider sees is that range and its gate, on the Rue de Grenelle and round the corner
 * on the Rue de Bellechasse: soot-darkened stone, rusticated at the foot.
 *
 * - the GATE: a carriage opening between two fluted columns under a heavy entablature with the ministry's name, the court's far
 *   wall in daylight through it;
 * - the RUSTICATED ground floor, tall round-headed windows with iron grilles in it;
 * - two storeys of tall windows with iron balconettes on consoles, the cornice, a low slate mansard and its lucarnes.
 *
 * Plan is OSM's with its courts. Commons "Ministère de l'Éducation Nationale - Paris - 1" and "- 2"; heights scaled off the gate's
 * doors. Those show the street range; the 1776 house inside is not drawn in any detail: nothing of it shows from the street.
 */
export function rochechouart(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

function draw(out: MeshBuilder): void {
  const p = palette('#b8aa8f', '#4c5155')
  extrude(out, [OUTER, ...COURTS], p, { eaves: EAVES, bay: 3.8, win: 1.6, rise: 3.4, inset: 1.8,
    storeys: [{ y: 0.4, h: 3.4 }, { y: 6.4, h: 3 }, { y: 11, h: 2.8 }] })
  const iron: Rgb = [0.1, 0.1, 0.1]
  const g = wallOn(out, { x: -25, z: -41.1 }, { x: 22, z: -41.2 })
  street(g, p, iron, 1)
  const b = wallOn(out, { x: 23.1, z: -40.2 }, { x: 33.8, z: 31.6 })
  street(b, p, iron, -1)
  // ---- the gate, on the Rue de Grenelle
  gate(out, g, p)
}

function street(w: Wall, p: Pal, iron: Rgb, gateAt: number): void {
  const d = 0.35
  w.slab(0, w.L, 0, EAVES, d, p.stone, 0.1)
  const { mids } = baysOf(w.L, 3.9, 0.7)
  for (let y = 0.62; y < 5.6; y += 0.62) w.rect(0, w.L, y - 0.04, y + 0.04, p.deep, d + 0.03)
  w.slab(-0.05, w.L + 0.05, 5.5, 6, 0.3 + d, p.trim)
  w.slab(-0.05, w.L + 0.05, 10.55, 10.75, 0.14 + d, p.trim)
  mids.forEach((m) => {
    // leave the gate's three bays clear
    const skip = gateAt > 0 && Math.abs(m - w.L / 2) < 5.2
    if (!skip) {
      w.arch(m, 0.7, 2.2, 4.4, shade(p.stone, 1.06), d + 0.04)
      w.arch(m, 0.8, 1.9, 4.1, p.glass, d + 0.06)
      for (const u of [-0.47, 0, 0.47]) w.rect(m + u - 0.03, m + u + 0.03, 0.8, 4.2, iron, d + 0.08)
    }
    // the first floor: tall, with its balconette on consoles, every third pair under a head
    w.rect(m - 1.1, m + 1.1, 6.4, 10.1, p.trim, d + 0.03)
    w.rect(m - 0.86, m + 0.86, 6.5, 9.9, p.glass, d + 0.06)
    w.rect(m - 0.04, m + 0.04, 6.5, 9.9, shade(p.stone, 0.8), d + 0.08)
    w.slab(m - 1.15, m + 1.15, 6.25, 6.42, d + 0.55, p.trim)
    for (const s of [-1, 1]) w.slab(m + s * 0.9 - 0.12, m + s * 0.9 + 0.12, 5.9, 6.25, d + 0.5, p.trim)
    w.rect(m - 1.1, m + 1.1, 6.42, 7.3, iron, d + 0.53)
    w.slab(m - 1.3, m + 1.3, 10.1, 10.32, d + 0.3, p.trim)
    // the second floor
    w.rect(m - 1.02, m + 1.02, 11, 14, p.trim, d + 0.03)
    w.rect(m - 0.8, m + 0.8, 11.1, 13.9, p.glass, d + 0.06)
    w.rect(m - 0.04, m + 0.04, 11.1, 13.9, shade(p.stone, 0.8), d + 0.08)
    w.slab(m - 1.05, m + 1.05, 10.92, 11.06, d + 0.4, p.trim)
    w.rect(m - 1, m + 1, 11.06, 11.8, iron, d + 0.38)
  })
  // the cornice
  w.slab(-0.2, w.L + 0.2, EAVES - 0.95, EAVES - 0.55, d + 0.34, shade(p.trim, 0.96))
  w.slab(-0.3, w.L + 0.3, EAVES - 0.55, EAVES, d + 0.72, p.trim)
}

function gate(out: MeshBuilder, w: Wall, p: Pal): void {
  const c = w.L / 2
  const d = 0.35
  const hw = 2.7
  // the frontispiece it stands in
  w.slab(c - 5.6, c + 5.6, 0, 6, d + 0.28, shade(p.stone, 0.95))
  for (let y = 0.62; y < 5.6; y += 0.62) w.rect(c - 5.6, c + 5.6, y - 0.04, y + 0.04, p.deep, d + 0.31)
  // the opening, and through it the court in daylight, its far wall pale
  w.rect(c - hw, c + hw, 0, 7.1, shade(p.stone, 0.5), d + 0.32)
  w.rect(c - hw + 0.8, c + hw - 0.8, 0.5, 5.1, hex('#d6d0c0'), d + 0.34)
  w.rect(c - hw + 0.8, c + hw - 0.8, 0, 0.5, shade(p.stone, 0.8), d + 0.34)
  for (const u of [-1, 0, 1]) w.rect(c + u * 1.15 - 0.34, c + u * 1.15 + 0.34, 1.3, 3.8, shade(p.glass, 1.5), d + 0.36)
  // one leaf of the green door folded back on its right
  w.rect(c + hw - 0.7, c + hw, 0, 6.4, hex('#2f4a45'), d + 0.36)
  w.rect(c - hw, c - hw + 0.7, 0, 6.4, hex('#2f4a45'), d + 0.36)
  // the two fluted columns on their plinths
  for (const s of [-1, 1]) {
    const m = w.at(c + s * (hw + 0.95), d + 0.28 + 0.66)
    const b = w.at(c + s * (hw + 0.95), d + 1.1)
    block(out, b.x - 0.95, b.x + 0.95, b.z - 0.95, b.z + 0.95, 0, 1.15, shade(p.stone, 0.88))
    classicalColumn(out, m.x, m.z, 1.15, 7.3, 0.6, shade(p.stone, 0.88), { order: 'doric', tier: 'near', flutes: true, trim: shade(p.stone, 0.95), heading: Math.PI })
  }
  // the entablature, the name on it
  w.slab(c - 5, c + 5, 7.3, 8.5, d + 1.5, shade(p.stone, 0.92))
  w.slab(c - 5.2, c + 5.2, 8.5, 8.85, d + 1.75, p.trim)
  w.rect(c - 4.2, c + 4.2, 7.55, 8.3, shade(p.stone, 0.76), d + 1.52)
  for (let u = -3.9; u < 3.9; u += 0.3) w.rect(c + u, c + u + 0.18, 7.82, 8.04, shade(p.stone, 0.42), d + 1.54)
  // the flag and the tall banners over it
  w.slab(c - 0.45, c + 0.45, 8.85, 15.2, d + 0.25, hex('#3a5a86'))
  for (const s of [-1, 1]) w.slab(c + s * 1.3 - 0.4, c + s * 1.3 + 0.4, 8.85, 14.8, d + 0.25, hex('#4f6f98'))
}
