import type { MeshBuilder } from '../../../buildings.ts'
import type { Rgb } from '../../../models.ts'
import { block, hex, shade } from '../../kit.ts'
import { clockFace, cupola } from '../../parts.ts'
import type { Fit } from '../../fit.ts'
import { extrude, fitted, palette, pts } from './common.ts'
import { baysOf, wallOn, type Wall } from './wall.ts'

/** the design footprint: OSM way 29560121's box turned to the Rue du Louvre (local −z faces bearing 290) */
const HX = 38.3
const HZ = 61.8
const EAVES = 23.6

/** Way 29560121 in the model's frame, its jogs taken out, the corner on the crossing cut as it stands. */
const CORNER_A = { x: -38.3, z: -53 }
const CORNER_B = { x: -29.5, z: -61.4 }
const PLAN = pts([
  36.1, -60.3, 38.1, -58.2, 38.3, 17.1, -31.8, 61.3, -35.3, 61.5, -38.2, 56.6, CORNER_A.x, CORNER_A.z, CORNER_B.x, CORNER_B.z,
])

interface Tones { stone: Rgb; trim: Rgb; deep: Rgb; dark: Rgb; glass: Rgb }

/**
 * La Poste centrale du Louvre (Julien Guadet, 1880–86; converted by Dominique Perrault, reopened 2022), filling its block on the
 * Rue du Louvre and the Rue Étienne-Marcel: a railway-station's worth of stone, the structure stated on every wall. What a
 * rider sees, from the crossing:
 *
 * - the great ARCADE at the street, deep round arches between heavy piers, a low iron fence along it;
 * - over it the storeys in a strict grid: a stone pier to every other window, the windows with their small balconies;
 * - the deep bracketed CORNICE, and hardly a roof at all behind it;
 * - the CUT CORNER on the crossing, with its clock under a little arch and the dark LANTERN standing on the roof over it.
 *
 * Plan is OSM's, with the jogs of its walls smoothed; the cut corner drawn wider than OSM's 4.6 m, to what the photographs show.
 * Commons "Post office street of Louvre (Paris)" and "Bureau Poste Central Louvre - Paris I (FR75) - 2024-09-22 - 1". OSM's
 * height of 28 m stands for the top of the roof; arcade 8 m, cornice 23.6 scaled off the photographs. The Rue
 * Jean-Jacques Rousseau's side at +x and the slant at the back are unchecked and drawn the same.
 */
export function posteLouvre(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

function draw(out: MeshBuilder): void {
  const p = palette('#d6cab0', '#4d5459')
  const t: Tones = { stone: p.stone, trim: p.trim, deep: p.deep, dark: [0.12, 0.13, 0.14], glass: p.glass }
  extrude(out, [PLAN], p, { eaves: EAVES, storeys: [], bay: 4, rise: 2.8, inset: 3.4, dormers: false })
  // ---- the walls, in ring order (a→b, the outward normal the right way)
  street(wallOn(out, CORNER_B, { x: 36.1, z: -60.3 }), t)                      // the Rue du Louvre
  street(wallOn(out, { x: 38.1, z: -58.2 }, { x: 38.3, z: 17.1 }), t)          // the Rue Jean-Jacques Rousseau
  street(wallOn(out, { x: 38.3, z: 17.1 }, { x: -31.8, z: 61.3 }), t)          // the slant at the back
  street(wallOn(out, { x: -38.2, z: 56.6 }, CORNER_A), t)                      // the Rue Étienne-Marcel, the long one
  // ---- the cut corner
  const c = wallOn(out, CORNER_A, CORNER_B)
  corner(out, c, t, p.slate)
}

function street(w: Wall, t: Tones): void {
  const { mids, step } = baysOf(w.L, 6.6, 0.3)
  // the arcade, a real one, standing out from the mass
  const a = 0.3
  const b = w.L - 0.3
  w.arches(a, b, mids.length, { y0: 0, spring: 5.4, top: 8.4, open: 0.68, front: 1.1, back: 0.06, stone: t.stone, void: shade(t.glass, 1.05) })
  w.slab(a, b, 8.1, 8.75, 1.45, t.trim)
  // the piers' channelled courses, every 0.7 m up to the springing
  for (let y = 0.7; y < 8; y += 0.7) {
    for (let i = 0; i <= mids.length; i++) {
      const u = a + step * i
      w.rect(u - step * 0.16, u + step * 0.16, y - 0.035, y + 0.035, t.deep, 1.13)
    }
  }
  // the iron fence and the arcade's lower lights
  for (const m of mids) {
    w.rect(m - step * 0.3, m + step * 0.3, 0, 1.25, t.dark, 1)
    w.rect(m - 0.05, m + 0.05, 0, 7.6, t.dark, 0.2)
    w.rect(m - step * 0.34, m + step * 0.34, 4.8, 4.94, t.dark, 0.2)
  }
  // ---- the wall over the arcade
  w.rect(a, b, 8.75, EAVES, t.stone, 0.5)
  const rows: [number, number][] = [[9.5, 3], [13.4, 2.8], [17.2, 2.5], [20.6, 1.6]]
  mids.forEach((m, i) => {
    for (const s of [-1, 1]) {
      const u = m + s * step * 0.25
      rows.forEach(([y, h], k) => {
        w.rect(u - 0.92, u + 0.92, y - 0.14, y + h + 0.14, t.trim, 0.54)
        w.rect(u - 0.72, u + 0.72, y, y + h, t.glass, 0.58)
        if (k < 2) w.slab(u - 0.98, u + 0.98, y - 0.2, y - 0.04, 0.95, t.trim)
        if (k === 0) w.rect(u - 0.98, u + 0.98, y - 0.04, y + 0.72, t.dark, 0.93)
      })
    }
    // the pier up the wall, between each pair of windows
    if (i < mids.length) w.slab(m + step * 0.5 - 0.72, m + step * 0.5 + 0.72, 8.75, 22.3, 0.9, shade(t.stone, 1.03))
    w.slab(m - 0.34, m + 0.34, 8.75, 22.3, 0.68, shade(t.stone, 0.98))
  })
  for (const y of [13, 16.85, 20.25]) w.slab(a, b, y - 0.11, y + 0.11, 0.66, t.trim)
  // ---- the bracketed cornice
  w.slab(a - 0.2, b + 0.2, 22.3, 22.75, 0.92, t.deep)
  for (let u = a; u < b; u += 1.55) w.slab(u - 0.2, u + 0.2, 22.75, 23.25, 1.3, t.trim)
  w.slab(a - 0.3, b + 0.3, 23.25, EAVES, 1.65, t.trim)
}

function corner(out: MeshBuilder, w: Wall, t: Tones, slate: Rgb): void {
  const L = w.L
  const c = L / 2
  w.arches(0, L, 1, { y0: 0, spring: 5.4, top: 8.4, open: 0.62, front: 1.1, back: 0.06, stone: t.stone, void: shade(t.glass, 1.05) })
  w.slab(-0.4, L + 0.4, 8.1, 8.75, 1.5, t.trim)
  w.rect(0, L, 8.75, EAVES, t.stone, 1)
  for (const [y, h] of [[9.5, 3], [13.4, 2.8]] as const) {
    w.rect(c - 1.3, c + 1.3, y - 0.14, y + h + 0.14, t.trim, 1.04)
    w.rect(c - 1.05, c + 1.05, y, y + h, t.glass, 1.08)
  }
  w.slab(c - 1.5, c + 1.5, 9.3, 9.46, 1.7, t.trim)
  w.rect(c - 1.5, c + 1.5, 9.46, 10.2, t.dark, 1.68)
  // the clock in its arch
  w.arch(c, 16.6, 5.2, 5.2, t.trim, 1.03)
  const m = w.at(c, 1.1)
  const e = wallEdge(w)
  clockFace(out, m.x, 19, m.z, e.nx, e.nz, 1.25, { dial: hex('#efe9d8'), hands: t.dark, rim: t.dark, out: 0.05 })
  // the cornice carried round it
  w.slab(-0.5, L + 0.5, 22.3, 22.75, 1.92, t.deep)
  for (let u = 0.2; u < L; u += 1.55) w.slab(u - 0.2, u + 0.2, 22.75, 23.25, 2.3, t.trim)
  w.slab(-0.6, L + 0.6, 23.25, EAVES, 2.65, t.trim)
  // the small arched head over the cornice, the lantern standing on the roof behind
  w.slab(c - 3.4, c + 3.4, EAVES, 25.4, 0.6, t.stone)
  w.arch(c, 25.4, 6.8, 1.3, t.stone, 0.6)
  const roofAt = w.at(c, -3.6)
  block(out, roofAt.x - 3, roofAt.x + 3, roofAt.z - 3, roofAt.z + 3, EAVES, 27.2, slate)
  cupola(out, roofAt, 27.2, 2.5, { drum: 2.8, dome: 2.2, colour: shade(slate, 0.72), domeColour: slate, lantern: true })
}

/** The wall's outward normal, from two of its own points. */
function wallEdge(w: Wall): { nx: number; nz: number } {
  const a = w.at(0, 0)
  const b = w.at(0, 1)
  return { nx: b.x - a.x, nz: b.z - a.z }
}
