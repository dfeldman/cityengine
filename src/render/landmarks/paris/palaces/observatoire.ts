import type { MeshBuilder } from '../../../buildings.ts'
import { prism } from '../../../models.ts'
import { block, dome, shade } from '../../kit.ts'
import { edgeAt } from '../../parts.ts'
import type { Fit } from '../../fit.ts'
import { balustrade, fitted, hipRoof, palette, range, rectOn, slab, type Pal } from './common.ts'

const FIXED = 0
/** the design footprint: OSM way 79611305's box, square to the meridian (local +z is north, up the avenue) */
const HX = 47.7
const HZ = 23.1

/**
 * The Observatoire de Paris (Claude Perrault, 1667–72), at the south end of the Avenue de l'Observatoire, the Paris
 * meridian running through its middle. A severe stone block with a flat terrace roof for the instruments, and what makes
 * it read from the end of the avenue and from the Boulevard Arago behind:
 *
 * - the NORTH front on the avenue (local +z): the square tower standing forward in its middle, plain tall windows;
 * - the SOUTH front: the two OCTAGONAL towers at its corners, their faces turned to the solstices and the equinoxes;
 * - on the east tower the great ARAGO DOME (1845–47), the metal hemisphere with its shutter slit;
 * - the low WINGS of 1832–39 east and west, each ending in a round tower with its small dome.
 *
 * Plan: way 79611305 in this frame (osmium, 2026-10-29): the octagons centred x −18.3 / +18.8 at z −8.2, 12 m across;
 * the range between them; the north block x −15…+15.8 to z +14.9 and the square tower to +23.1; the wings out to the
 * round towers at x ±44. Heights are Wikipedia's three storeys and terrace, the wings two.
 */
export function observatoire(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

function draw(out: MeshBuilder): void {
  const p = palette('#ddd3bd', '#4f565b')
  const top = 22
  const st = [{ y: 0, h: 3.4, sill: 1.0 }, { y: 7.2, h: 4.0, sill: 0.8 }, { y: 14.6, h: 3.6, sill: 0.8 }]
  // ---- Perrault's block: the range between the towers, the north block, the square tower on the avenue
  range(out, -12.2, 12.6, -11.7, -1.9, p, { eaves: top, bay: 4.2, win: 1.6, faces: ['-z'], storeys: st, cornice: 0.5 })
  range(out, -15, 15.8, -1.9, 14.9, p, { eaves: top, bay: 4.2, win: 1.6, faces: ['+z', '-x', '+x'], storeys: st, cornice: 0.5 })
  range(out, -5.9, 6.5, 14.9, 23.1, p, { eaves: top + 1.2, bay: 4.0, win: 1.7, faces: ['+z', '-x', '+x'], storeys: st, cornice: 0.5, quoins: true })
  balustrade(out, -15, 15.8, -1.9, 14.9, top, p, { sides: ['-x', '+x'], h: 1.0 })
  balustrade(out, -5.9, 6.5, 14.9, 23.1, top + 1.2, p, { h: 1.0 })
  balustrade(out, -15, -5.9, -1.9, 14.9, top, p, { sides: ['+z'], h: 1.0 })
  balustrade(out, 6.5, 15.8, -1.9, 14.9, top, p, { sides: ['+z'], h: 1.0 })
  // the two bas-reliefs of the south front, globes and instruments, over the middle windows
  for (const x of [-6, 6.4]) rectOn(out, '-z', -11.7, x - 1.6, x + 1.6, 12.4, 14.0, shade(p.stone, 0.88), 0.1)
  // ---- the octagonal towers at the south corners, the terrace over all, the Arago dome on the east one
  octagon(out, -18.3, -8.2, 6.4, top, p)
  octagon(out, 18.8, -8.3, 6.4, top, p)
  const d = { x: 18.8, z: -8.3 }
  prism(out, d.x, d.z, top, top + 1.8, 6.0, 20, shade(p.stone, 0.92), FIXED)
  const metal: [number, number, number] = [0.56, 0.6, 0.6]
  dome(out, d.x, d.z, top + 1.8, 6.0, 6.2, metal, 20)
  // the shutter slit, a dark band over the crown, turned to the south
  for (let k = 0; k < 6; k++) {
    const a0 = (k / 6) * (Math.PI / 2)
    const a1 = ((k + 1) / 6) * (Math.PI / 2)
    const y0 = top + 1.8 + Math.sin(a0) * 6.2
    const y1 = top + 1.8 + Math.sin(a1) * 6.2
    const r0 = Math.cos(a0) * 6.06
    const r1 = Math.cos(a1) * 6.06
    out.quad([[d.x - 0.6, y0, d.z - r0], [d.x + 0.6, y0, d.z - r0], [d.x + 0.6, y1, d.z - r1], [d.x - 0.6, y1, d.z - r1]], [0, 0.6, -0.8], [[0, 0], [1, 0], [1, 1], [0, 1]], p.dark, FIXED)
  }
  // ---- the wings, lower, each ending in a round tower under its little dome
  const ws = [{ y: 0, h: 3.0, sill: 0.9 }, { y: 5.6, h: 3.2, sill: 0.8 }]
  range(out, -43.4, -25.4, -22.3, -3.4, p, { eaves: 11.4, bay: 3.6, win: 1.5, storeys: ws, cornice: 0.45 })
  hipRoof(out, -43.4, -25.4, -22.3, -3.4, 11.4, 2.6, p.slate, 0.3)
  range(out, 26.2, 44, -23, -3.7, p, { eaves: 11.4, bay: 3.6, win: 1.5, storeys: ws, cornice: 0.45 })
  hipRoof(out, 26.2, 44, -23, -3.7, 11.4, 2.6, p.slate, 0.3)
  for (const [x, z, r] of [[-44, -8.0, 3.9], [44, -9.2, 3.7]]) {
    prism(out, x, z, 0, 12.6, r, 16, p.stone, FIXED)
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2 + Math.PI / 4
      block(out, x + Math.sin(a) * r - 0.5, x + Math.sin(a) * r + 0.5, z + Math.cos(a) * r - 0.5, z + Math.cos(a) * r + 0.5, 6.4, 9.4, p.glass)
    }
    prism(out, x, z, 12.4, 12.9, r + 0.3, 16, p.trim, FIXED)
    dome(out, x, z, 12.9, r - 0.2, r * 0.95, metal, 16)
  }
}

/** An octagonal tower, faces square to the axes: walls with three storeys of windows, cornice, balustraded top. */
function octagon(out: MeshBuilder, cx: number, cz: number, half: number, top: number, p: Pal): void {
  const R = half / Math.cos(Math.PI / 8)
  const ring = Array.from({ length: 8 }, (_, k) => {
    const a = (k / 8) * Math.PI * 2 + Math.PI / 8
    return { x: cx + Math.cos(a) * R, z: cz + Math.sin(a) * R }
  })
  slab(out, ring, 0, top, p.stone, p.stone)
  for (let i = 0; i < 8; i++) {
    const e = edgeAt(ring, i)
    const P = (u: number, y: number, dd: number): [number, number, number] => [e.a.x + e.tx * u + e.nx * dd, y, e.a.z + e.tz * u + e.nz * dd]
    // (the ring runs anticlockwise, so the edge normal points out)
    const q = (u0: number, u1: number, y0: number, y1: number, dd: number, c: [number, number, number]): void =>
      out.quad([P(u0, y0, dd), P(u1, y0, dd), P(u1, y1, dd), P(u0, y1, dd)], [e.nx, 0, e.nz], [[0, 0], [1, 0], [1, 1], [0, 1]], c, FIXED)
    const m = e.L / 2
    for (const [y, h] of [[1.0, 3.4], [8.0, 4.0], [15.4, 3.6]]) {
      q(m - 1.0, m + 1.0, y - 0.2, y + h + 0.2, 0.05, p.trim)
      q(m - 0.75, m + 0.75, y, y + h, 0.09, p.glass)
    }
    q(-0.1, e.L + 0.1, top - 0.7, top, 0.4, p.trim)
  }
  // the top: leads and a balustrade round the eight edges, as short straight runs
  for (let i = 0; i < 8; i++) {
    const e = edgeAt(ring, i)
    const x0 = Math.min(e.a.x, e.b.x)
    const x1 = Math.max(e.a.x, e.b.x)
    const z0 = Math.min(e.a.z, e.b.z)
    const z1 = Math.max(e.a.z, e.b.z)
    if (x1 - x0 > z1 - z0 + 1) block(out, x0, x1, (z0 + z1) / 2 - 0.2, (z0 + z1) / 2 + 0.2, top, top + 1.0, p.trim)
    else if (z1 - z0 > x1 - x0 + 1) block(out, (x0 + x1) / 2 - 0.2, (x0 + x1) / 2 + 0.2, z0, z1, top, top + 1.0, p.trim)
    else block(out, (x0 + x1) / 2 - 0.9, (x0 + x1) / 2 + 0.9, (z0 + z1) / 2 - 0.9, (z0 + z1) / 2 + 0.9, top, top + 1.0, p.trim)
  }
}
