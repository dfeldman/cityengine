import type { MeshBuilder } from '../../../buildings.ts'
import { beam, block, hex, roof, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { archOn, extrude, fitted, palette, pts, rectOn, slabOn } from '../palaces/common.ts'

const FIXED = 0
/** the design footprint: OSM way 55353486's box turned to its walls (local −z faces bearing 198.5, the Place du Panthéon) */
const HX = 42.65
const HZ = 28.75

/** OSM's back wings behind the reading room, in this frame (osmium, 2026-10-30), the jogs ironed flat */
const WINGS = pts([42.5, -7.4, 18.7, -7.5, 18.5, 10.2, 41.9, 10.3, 41.6, 28.8, 23.4, 28.6, -11.5, 28.0, -14.8, 24.2, -14.8, 17.6, 10.4, 17.8, 10.5, 6.4, -14.8, 6.2, -14.7, -7.3])

/**
 * La Bibliothèque Sainte-Geneviève (Henri Labrouste, 1843–51), the long plain box on the north side of the Place du
 * Panthéon that a generation of architects came to look at, and the one that is right beside the Panthéon's huge flank
 * and looks nothing like it. What a rider sees, all of it on the front (local −z) and the ends:
 *
 * - the BASE: a blank wall of big ashlar, a door in a round arch in the middle, narrow round-headed windows, and along
 *   its head the carved garlands swagged from medallion to medallion;
 * - the UPPER STOREY: nineteen tall arched bays between plain piers, each the reading room's window of iron glazing bars
 *   over a flat stone panel, and the panels cut with 810 authors' names in columns, which from the street is a fine grey
 *   lettered texture;
 * - the heavy flat cornice, and hardly any roof: a low hip of zinc behind it, the iron vaults inside it unseen.
 *
 * From the Mapillary frame along the front (2026-10-30), the dressing and its proportions; the hall's plan is OSM's part
 * 1202493352 (85 × 21 m). OSM gives no height: 7.8 m to the first string course, the cornice at 18 from the frame. The
 * wings behind (the rest of way 55353486) are the plain later building, and nobody sees them from the street.
 */
export function sainteGenevieve(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

function draw(out: MeshBuilder): void {
  const p = palette('#c2baa6', '#596065')
  const line = shade(p.stone, 0.78)
  const iron = hex('#3a3d3e')
  const x0 = -42.65
  const x1 = 42.65
  const z0 = -28.75
  const z1 = -7.4
  const base = 7.8
  const E = 18
  block(out, x0, x1, z0, z1, 0, E, p.stone)
  // the wings behind, lower and plain
  extrude(out, [WINGS], p, { eaves: 14, bay: 3.6, win: 1.4, rise: 2.4, inset: 1.2, storeys: [{ y: 1, h: 2.2 }, { y: 5.2, h: 2.2 }, { y: 9.4, h: 2.2 }] })

  // ---- the plinth and the big ashlar of the base, all round
  block(out, x0 - 0.3, x1 + 0.3, z0 - 0.3, z1 + 0.3, 0, 0.75, shade(p.stone, 0.76))
  block(out, x0 - 0.25, x1 + 0.25, z0 - 0.25, z1 + 0.25, 0.75, 1.1, shade(p.stone, 0.9))
  const faces = [['-z', z0, x0, x1, 19], ['+z', z1, x0, x1, 19], ['-x', x0, z0, z1, 5], ['+x', x1, z0, z1, 5]] as const
  for (const [f, plane, t0, t1, bays] of faces) {
    const bay = (t1 - t0) / bays
    for (let y = 1.1 + 0.62; y < base - 1.5; y += 0.62) rectOn(out, f, plane, t0, t1, y - 0.03, y + 0.03, line, 0.03)
    // the frieze under the string course: the garlands swagged between medallions, a run of them a bay
    rectOn(out, f, plane, t0, t1, base - 1.5, base - 0.2, shade(p.stone, 0.96), 0.03)
    for (let i = 0; i <= bays; i++) {
      const t = t0 + i * bay
      discOn(out, f, plane, t, base - 0.85, 0.34, shade(p.stone, 0.8))
      if (i === bays) break
      for (let k = 0; k < 6; k++) {
        const u0 = k / 6
        const u1 = (k + 1) / 6
        const sag = (u: number): number => base - 0.95 - Math.sin(u * Math.PI) * 0.42
        const a = at(f, plane, t + u0 * bay, sag(u0), 0.05)
        const b = at(f, plane, t + u1 * bay, sag(u1), 0.05)
        beam(out, a, b, 0.05, shade(p.stone, 0.72))
      }
    }
    // the string course, and the storey's sill
    slabOn(out, f, plane, t0 - 0.2, t1 + 0.2, base - 0.2, base + 0.35, 0.3, p.trim)
    slabOn(out, f, plane, t0 - 0.1, t1 + 0.1, base + 0.35, base + 0.6, 0.12, shade(p.trim, 0.95))

    // ---- the upper storey's arched bays: piers, the window, the lettered panel under it
    for (let i = 0; i <= bays; i++) {
      const t = t0 + i * bay
      slabOn(out, f, plane, t - 0.42, t + 0.42, base + 0.6, E - 1.55, 0.22, p.trim)
    }
    for (let i = 0; i < bays; i++) {
      const t = t0 + (i + 0.5) * bay
      const w = bay - 1.15
      const sill = base + 4.0
      const crown = E - 2.0
      // the arch's moulding, the iron window and its bars
      archOn(out, f, plane, t, sill - 0.1, w + 0.45, crown - sill + 0.25, p.trim, 0.06)
      archOn(out, f, plane, t, sill, w, crown - sill, p.glass, 0.1)
      const spring = crown - w / 2
      for (const u of [-1 / 3, 0, 1 / 3]) rectOn(out, f, plane, t + u * w - 0.05, t + u * w + 0.05, sill, spring + Math.sqrt(Math.max(0, 0.25 - u * u)) * w - 0.05, iron, 0.13)
      for (const y of [sill + (spring - sill) * 0.5, spring]) rectOn(out, f, plane, t - w / 2, t + w / 2, y - 0.04, y + 0.04, iron, 0.13)
      // the panel: a sunk flat, the columns of names as lines across it
      rectOn(out, f, plane, t - w / 2, t + w / 2, base + 0.85, sill - 0.3, shade(p.stone, 0.93), 0.04)
      for (let k = 0; k < 6; k++) {
        const y = base + 1.15 + k * 0.33
        rectOn(out, f, plane, t - w / 2 + 0.2, t + w / 2 - 0.2, y, y + 0.09, shade(p.stone, 0.68), 0.05)
      }
    }

    // ---- the base's narrow arched windows, a door on the axis of the front
    for (let i = 0; i < bays; i++) {
      const t = t0 + (i + 0.5) * bay
      if (f === '-z' && i === 9) continue
      archOn(out, f, plane, t, 1.9, 1.0, 3.3, shade(p.glass, 1.15), 0.06)
      rectOn(out, f, plane, t - 0.75, t + 0.75, 1.75, 1.88, p.trim, 0.09)
    }
    // the cornice, deep and flat
    slabOn(out, f, plane, t0 - 0.2, t1 + 0.2, E - 1.55, E - 0.9, 0.35, p.trim)
    slabOn(out, f, plane, t0 - 0.6, t1 + 0.6, E - 0.9, E - 0.35, 0.8, shade(p.trim, 1.03))
    slabOn(out, f, plane, t0 - 0.3, t1 + 0.3, E - 0.35, E + 0.5, 0.15, p.stone)
  }
  // the door in its arch
  const f = '-z'
  rectOn(out, f, z0, -2.3, 2.3, 1.1, 5.2, shade(p.stone, 0.86), 0.04)
  archOn(out, f, z0, 0, 1.1, 3.8, 5.6, shade(p.stone, 0.92), 0.05)
  archOn(out, f, z0, 0, 1.1, 3.0, 5.2, p.dark, 0.08)
  for (let i = 0; i < 3; i++) block(out, -2.6 + i * 0.2, 2.6 - i * 0.2, z0 - 1.2 + i * 0.35, z0, 0, 0.3 + i * 0.25, shade(p.stone, 0.84))

  // ---- the low zinc hip
  roof(out, x0 + 0.3, x1 - 0.3, z0 + 0.3, z1 - 0.3, E + 0.5, 3.4, 10.2, 10.2, p.slate)
}

/** The point on a face, `d` proud. */
const at = (f: '-z' | '+z' | '-x' | '+x', plane: number, t: number, y: number, d: number): [number, number, number] => {
  switch (f) {
    case '-z': return [t, y, plane - d]
    case '+z': return [t, y, plane + d]
    case '-x': return [plane - d, y, t]
    default: return [plane + d, y, t]
  }
}

/** A round medallion on a face. */
function discOn(out: MeshBuilder, f: '-z' | '+z' | '-x' | '+x', plane: number, t: number, y: number, r: number, c: [number, number, number]): void {
  const n: [number, number, number] = f === '-z' ? [0, 0, -1] : f === '+z' ? [0, 0, 1] : f === '-x' ? [-1, 0, 0] : [1, 0, 0]
  for (let k = 0; k < 8; k++) {
    const a0 = (k / 8) * Math.PI * 2
    const a1 = ((k + 1) / 8) * Math.PI * 2
    out.quad([at(f, plane, t, y, 0.06), at(f, plane, t + Math.cos(a0) * r, y + Math.sin(a0) * r, 0.06), at(f, plane, t + Math.cos(a1) * r, y + Math.sin(a1) * r, 0.06), at(f, plane, t, y, 0.06)], n,
      [[0, 0], [1, 0], [1, 1], [0, 1]], c, FIXED)
  }
}
