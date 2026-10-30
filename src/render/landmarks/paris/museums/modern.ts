/**
 * What the flat-roofed and glass buildings of this folder share (the Tribunal, the Hexagone, the Mobilier National): an OSM
 * outline and its courts raised as walls with no mansard over them, floors drawn as ribbons along the walls, piers on
 * them at a pitch, a tree on a terrace. `extrude` in the palace kit (../palaces/common.ts) is the same plan under slate,
 * one quad pair a window; these cost per edge and not per window, which is what a 200 m glass wall needs. Not a builder —
 * nothing is registered.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { capPolygonWithHoles } from '../../../buildings.ts'
import { prism } from '../../../models.ts'
import { edgeAt } from '../../parts.ts'
import { block, shade, type Rgb } from '../../kit.ts'

const FIXED = 0
type P2 = { x: number; z: number }
type V = [number, number, number]
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

const signed = (r: P2[]): number => r.reduce((a, p, i) => { const q = r[(i + 1) % r.length]; return a + p.x * q.z - q.x * p.z }, 0)

/** Rings wound so every wall's normal faces away from the solid: the outline anticlockwise, its courts the other way. */
export function wound(rings: P2[][]): P2[][] {
  return rings.map((r, i) => ((signed(r) > 0) === (i === 0) ? r : [...r].reverse()))
}

/** Plain walls and a roof over an outline and its courts, from y0 to y1. */
export function hull(out: MeshBuilder, rings: P2[][], y0: number, y1: number, wall: Rgb, top: Rgb): void {
  for (const r of wound(rings)) {
    for (let i = 0; i < r.length; i++) {
      const e = edgeAt(r, i)
      out.quad([[e.a.x, y0, e.a.z], [e.b.x, y0, e.b.z], [e.b.x, y1, e.b.z], [e.a.x, y1, e.a.z]], [e.nx, 0, e.nz], UV, wall, FIXED)
    }
  }
  capPolygonWithHoles(out, wound(rings), y1, top, FIXED)
}

/** A strip `y0..y1` along every wall of 2 m or more, `d` proud, stopping `end` short of each corner: a window ribbon, a band. */
export function ribbons(out: MeshBuilder, rings: P2[][], ys: [number, number][], c: Rgb, d = 0.06, end = 0.3, min = 2): void {
  for (const r of wound(rings)) {
    for (let i = 0; i < r.length; i++) {
      const e = edgeAt(r, i)
      if (e.L < min) continue
      const P = (u: number, y: number): V => [e.a.x + e.tx * u + e.nx * d, y, e.a.z + e.tz * u + e.nz * d]
      for (const [y0, y1] of ys) out.quad([P(end, y0), P(e.L - end, y0), P(e.L - end, y1), P(end, y1)], [e.nx, 0, e.nz], UV, c, FIXED)
    }
  }
}

/** Upright strips at a pitch along every wall of `min` or more, `y0..y1`, `w` wide, `d` proud: piers, mullions, ribs. */
export function piers(out: MeshBuilder, rings: P2[][], y0: number, y1: number, pitch: number, w: number, c: Rgb, d = 0.1, min = 4): void {
  for (const r of wound(rings)) {
    for (let i = 0; i < r.length; i++) {
      const e = edgeAt(r, i)
      if (e.L < min) continue
      const n = Math.max(1, Math.round(e.L / pitch))
      const P = (u: number, y: number): V => [e.a.x + e.tx * u + e.nx * d, y, e.a.z + e.tz * u + e.nz * d]
      for (let j = 0; j <= n; j++) {
        const u = (e.L * j) / n
        out.quad([P(Math.max(0, u - w / 2), y0), P(Math.min(e.L, u + w / 2), y0), P(Math.min(e.L, u + w / 2), y1), P(Math.max(0, u - w / 2), y1)], [e.nx, 0, e.nz], UV, c, FIXED)
      }
    }
  }
}

/** A tree on a terrace: a stem and two stacked masses of leaf, seen from below over a parapet, so no more is needed. */
export function terraceTree(out: MeshBuilder, x: number, z: number, y: number, r: number, leaf: Rgb): void {
  prism(out, x, z, y, y + r * 0.9, r * 0.1, 4, [0.27, 0.22, 0.17], FIXED)
  prism(out, x, z, y + r * 0.6, y + r * 1.5, r * 0.7, 6, shade(leaf, 0.86), FIXED, r)
  prism(out, x, z, y + r * 1.5, y + r * 2.5, r, 6, leaf, FIXED, r * 0.34)
}

/** A flat arch across z0..z1 from x0 to x1, springing at `y`, `rise` to the crown of its soffit and `thick` deep up from it. */
export function archBand(out: MeshBuilder, x0: number, x1: number, z0: number, z1: number, y: number, rise: number, thick: number, c: Rgb): void {
  const n = 12
  const u = (i: number): number => (i / n) * 2 - 1
  const X = (i: number): number => x0 + ((x1 - x0) * i) / n
  const Y = (i: number): number => y + rise * (1 - u(i) * u(i))
  for (let i = 0; i < n; i++) {
    const a = X(i), b = X(i + 1), ya = Y(i), yb = Y(i + 1)
    out.quad([[a, ya, z0], [b, yb, z0], [b, yb + thick, z0], [a, ya + thick, z0]], [0, 0, -1], UV, c, FIXED)
    out.quad([[b, yb, z1], [a, ya, z1], [a, ya + thick, z1], [b, yb + thick, z1]], [0, 0, 1], UV, c, FIXED)
    out.quad([[a, ya + thick, z0], [b, yb + thick, z0], [b, yb + thick, z1], [a, ya + thick, z1]], [0, 1, 0], UV, shade(c, 1.05), FIXED)
    out.quad([[a, ya, z1], [b, yb, z1], [b, yb, z0], [a, ya, z0]], [0, -1, 0], UV, shade(c, 0.7), FIXED)
  }
}

/** An iron rail or a railing along x at z: its top bar, and a bar every `step` under it. */
export function railX(out: MeshBuilder, x0: number, x1: number, z: number, y: number, h: number, step: number, c: Rgb): void {
  block(out, x0, x1, z - 0.04, z + 0.04, y + h - 0.06, y + h, c)
  const n = Math.max(1, Math.round((x1 - x0) / step))
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n
    block(out, x - 0.025, x + 0.025, z - 0.025, z + 0.025, y, y + h, c)
  }
}
