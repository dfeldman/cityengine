/**
 * The PARC DE LA VILLETTE (Bernard Tschumi, 1982–1998): the red FOLIES and the GRANDE HALLE.
 *
 * - The folies: twenty-six red-enamelled steel pavilions on a 120 m grid (rows J L N P R, columns 1–9), each one a
 *   10.8 m cube divided into a 3 × 3 × 3 frame of 3.6 m cells (Wikipedia fr, "Parc de la Villette": "un cube de
 *   10,80 m de côté", "environ 120 m"), some cells clad in red panels, some glazed, some left as open frame, and to each
 *   its own "deconstruction" — a spiral stair in a drum, a straight flight up one face, a wheel, a canopy wing, a
 *   lift tower, a walkway running out of the frame. Each entry places one folie on its cube's centre (OSM's outline
 *   where the way is the cube alone; where the way also holds an annex or the stair drum, the cube's square read off
 *   the outline), turned to the grid (front 233.7: local +x runs down the columns, bearing 143.7, and +z up the rows,
 *   bearing 53.7 — the grid solved from the 26 named ways' centres, spacing 119.6 × 117.4 m). The cube's cells and
 *   extras per folie are below (FOLIE); the drums and annexes where OSM maps them (N5, N6, P5, R6, L2, L5, L9, P7,
 *   P8), the rest by its name (L4 the bandstand's canopy, N1 the clock, P6 the belvedere's open top, R4 and R5 the
 *   walkways the galerie passes through). Trabendo (R7, a three-storey concert hall built round its folie) is left
 *   to the city.
 * - The Grande Halle (Jules de Mérindol, 1865–67, the Villette cattle market): 245 × 85 m, 19 m high (Wikipedia
 *   fr), white cast iron and glass — an open colonnade of cast-iron columns with fanned brackets round the ground
 *   floor under the great overhanging eaves, the glazed aisles, and the raised clerestory nave down the middle under
 *   its own low gable; the gable end with its clock to the Porte de Pantin (front 144, way/63971649: 241 × 86 m).
 *
 * Local frames: front −z (the manifest's `front` turns it), y up from the model's base.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { box, prism, strut, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { quadN, type V3 } from './bowl.ts'

const RED: Rgb = [0.72, 0.08, 0.07]
const RED_DK: Rgb = [0.52, 0.05, 0.05]
const GLASS: Rgb = [0.16, 0.2, 0.23]
const CELL = 3.6
const HALF = 5.4

/* ------------------------------------------------------------------------------------------------ the folies */

type Side = '-x' | '+x' | '-z' | '+z'
type Extra =
  | { k: 'helix'; x: number; z: number; r?: number; h?: number }       // a spiral stair in an open drum
  | { k: 'drum'; x: number; z: number; r: number; h: number }          // a glazed round annex
  | { k: 'annex'; x0: number; x1: number; z0: number; z1: number; h: number }
  | { k: 'canopy'; side: Side; len: number; y?: number }               // a flat wing cantilevered off a face
  | { k: 'roof'; x0: number; x1: number; z0: number; z1: number; y: number }   // a flat roof on posts
  | { k: 'stair'; side: Side }                                         // a straight flight up a face to the 2nd floor
  | { k: 'wheel'; side: Side }                                         // a quarter wheel over the roof
  | { k: 'tower'; x: number; z: number }                               // a lift cylinder above the roof
  | { k: 'walk'; side: Side; len: number }                             // a walkway out of the frame at 7.2 m
  | { k: 'clock'; side: Side }
  | { k: 'mast' }

/** Three layers, ground up; each 9 cells, rows −z..+z of columns −x..+x. R red panel, G glass, . open frame, ' ' none. */
interface FolieSpec { layers: [string, string, string]; extras?: Extra[] }

export const FOLIE: Record<string, FolieSpec> = {
  J5: { layers: ['R.RR.R...', '.........', '...  .   '], extras: [{ k: 'roof', x0: -5.4, x1: 5.4, z0: -5.4, z1: 1.8, y: 7.2 }, { k: 'walk', side: '+x', len: 14 }] },
  L1: { layers: ['RGRRGRRRR', 'R.RGRG...', '..R ....R'], extras: [{ k: 'canopy', side: '-z', len: 6 }] },
  L2: { layers: ['RGRGGGRGR', 'RRR.G.RRR', '..R.  R..'], extras: [{ k: 'drum', x: -11, z: 1, r: 5, h: 4.5 }, { k: 'wheel', side: '+x' }] },
  L3: { layers: ['RRRGGRRRR', 'R.R...R.R', '.. .  ..R'], extras: [{ k: 'stair', side: '+x' }] },
  L4: { layers: ['R.R...R.R', '.........', '.........'], extras: [{ k: 'canopy', side: '-z', len: 8, y: 7.2 }, { k: 'canopy', side: '+z', len: 8, y: 7.2 }] },
  L5: { layers: ['RGRGGGRGR', 'R.RRGR...', 'R.. . ..R'], extras: [{ k: 'helix', x: 6.5, z: -3.4 }, { k: 'annex', x0: -5.4, x1: 5.4, z0: -11.8, z1: -5.5, h: 3.6 }] },
  L6: { layers: ['RRRGGGRRR', '.R.....R.', '. .   . .'], extras: [{ k: 'walk', side: '-z', len: 10 }] },
  L7: { layers: ['RRRRGRRRR', 'RR.R...R.', 'R .   ...'], extras: [{ k: 'tower', x: 3.6, z: 3.6 }] },
  L8: { layers: ['RGRGGGRRR', 'R.RR.R...', '.........'], extras: [{ k: 'wheel', side: '-x' }] },
  L9: { layers: ['RGRGGGRGR', 'RRRGGGRRR', '.R.R.R.R.'], extras: [{ k: 'annex', x0: -20.2, x1: -5.6, z0: -6, z1: 9, h: 4.5 }, { k: 'canopy', side: '+x', len: 5 }] },
  N1: { layers: ['RRRRGRRRR', 'RRRR.RRRR', '. . R . .'], extras: [{ k: 'clock', side: '-z' }, { k: 'mast' }] },
  N4: { layers: ['RRRGGGRRR', '.R.R.R.R.', '.........'], extras: [{ k: 'mast' }, { k: 'stair', side: '-x' }] },
  N5: { layers: ['RGRGGGRGR', 'R.R.R.R.R', '... . ...'], extras: [{ k: 'helix', x: 5.7, z: 6.2, r: 2.2 }] },
  N6: { layers: ['RGRGGGRGR', 'RRR...RRR', 'R.R . R.R'], extras: [{ k: 'helix', x: -4.4, z: -5.8, r: 3.2, h: 8.5 }] },
  N7: { layers: ['RRRGGGRRR', 'R...R...R', '.  ...  .'], extras: [{ k: 'wheel', side: '+z' }, { k: 'roof', x0: -11.9, x1: -5.4, z0: 3.9, z1: 5.9, y: 3.6 }] },
  N8: { layers: ['RRRRRRRGR', 'RRRRGRRRR', '.R.....R.'], extras: [{ k: 'tower', x: -3.6, z: 3.6 }] },
  N9: { layers: ['R.RR.RR.R', 'RRR...RRR', '.........'], extras: [{ k: 'canopy', side: '+z', len: 7 }] },
  P4: { layers: ['RGRRGRRRR', 'R.R...R.R', '.. .  ..R'], extras: [{ k: 'stair', side: '-z' }] },
  P5: { layers: ['RGRGGGRGR', 'R.RRRR...', '. .  ....'], extras: [{ k: 'helix', x: 6.5, z: -4.1, r: 2.5 }, { k: 'walk', side: '-x', len: 8 }] },
  P6: { layers: ['RRRGGGRRR', '.R.....R.', '         '], extras: [{ k: 'stair', side: '+z' }, { k: 'mast' }] },
  P7: { layers: ['GGGGGGRGR', 'R.R...RRR', '. .  ..R.'], extras: [{ k: 'annex', x0: -5.9, x1: 0.1, z0: -16, z1: -5.6, h: 3.6 }] },
  P8: { layers: ['RGRGGGRGR', 'R.RR.RR.R', '.........'], extras: [{ k: 'roof', x0: 5.9, x1: 22, z0: -7.6, z1: 5.4, y: 6 }] },
  R4: { layers: ['R.R...R.R', '.........', '.........'], extras: [{ k: 'walk', side: '+z', len: 16 }, { k: 'walk', side: '-z', len: 16 }, { k: 'stair', side: '-x' }] },
  R5: { layers: ['RRR...RRR', '.........', '.R.R.R.R.'], extras: [{ k: 'walk', side: '-x', len: 14 }, { k: 'walk', side: '+z', len: 12 }] },
  R6: { layers: ['RGRGGGRGR', 'RRR.R.RRR', '. .   . .'], extras: [{ k: 'helix', x: 6.8, z: -2.7, r: 2.6 }] },
}

/** a side's outward normal and the axis along it */
const SIDE: Record<Side, { n: [number, number]; t: [number, number] }> = {
  '-x': { n: [-1, 0], t: [0, 1] }, '+x': { n: [1, 0], t: [0, -1] }, '-z': { n: [0, -1], t: [-1, 0] }, '+z': { n: [0, 1], t: [1, 0] },
}

function folie(out: MeshBuilder, fit: Fit, spec: FolieSpec): void {
  const met = surfaceTag('metal')
  const gl = surfaceTag('glass')
  const g = fit.groundAt?.(0, 0) ?? 0.5
  const cell = (s: string, ix: number, iz: number): string => s[(iz + 1) * 3 + (ix + 1)] ?? ' '
  // a concrete slab under it, the ground floor's datum
  box(out, 0, g - 0.25, 0, HALF + 0.4, 0.4, HALF + 0.4, [0.62, 0.6, 0.57], surfaceTag('concrete'))
  const y0 = g + 0.15
  // the cells: red panels and glass a little inside the frame lines, so no face lies on a member's
  for (let ly = 0; ly < 3; ly++) {
    for (let iz = -1; iz <= 1; iz++) for (let ix = -1; ix <= 1; ix++) {
      const c = cell(spec.layers[ly], ix, iz)
      if (c !== 'R' && c !== 'G') continue
      const cx = ix * CELL
      const cz = iz * CELL
      const cy = y0 + ly * CELL + CELL / 2
      box(out, cx, cy, cz, CELL / 2 - 0.12, CELL / 2 - 0.12, CELL / 2 - 0.12, c === 'R' ? RED : GLASS, c === 'R' ? met : gl)
    }
  }
  // the frame: every edge of every cell that has one, once
  const seen = new Set<string>()
  const member = (a: V3, b: V3): void => {
    const k = [a, b].map((p) => p.map((v) => v.toFixed(1)).join(',')).sort().join('|')
    if (seen.has(k)) return
    seen.add(k)
    strut(out, a, b, 0.34, 0.34, RED, met, false)
  }
  for (let ly = 0; ly < 3; ly++) {
    for (let iz = -1; iz <= 1; iz++) for (let ix = -1; ix <= 1; ix++) {
      if (cell(spec.layers[ly], ix, iz) === ' ') continue
      const xa = ix * CELL - CELL / 2, xb = xa + CELL
      const za = iz * CELL - CELL / 2, zb = za + CELL
      const ya = y0 + ly * CELL, yb = ya + CELL
      for (const [x, z] of [[xa, za], [xb, za], [xa, zb], [xb, zb]]) member([x, ya, z], [x, yb, z])
      for (const y of [ya, yb]) {
        member([xa, y, za], [xb, y, za]); member([xa, y, zb], [xb, y, zb])
        member([xa, y, za], [xa, y, zb]); member([xb, y, za], [xb, y, zb])
      }
    }
  }
  const top = y0 + 3 * CELL
  for (const e of spec.extras ?? []) {
    if (e.k === 'helix') {
      const r = e.r ?? 2.0
      const h = e.h ?? 10.8
      const gy = fit.groundAt?.(e.x, e.z) ?? g
      // the open drum: eight posts and three rings, and the treads winding up inside it
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2
        strut(out, [e.x + Math.sin(a) * r, gy - 0.3, e.z + Math.cos(a) * r], [e.x + Math.sin(a) * r, y0 + h, e.z + Math.cos(a) * r], 0.22, 0.22, RED, met, false)
      }
      for (const y of [y0 + CELL, y0 + 2 * CELL, y0 + h]) prism(out, e.x, e.z, y - 0.2, y + 0.1, r + 0.08, 16, RED, met, r + 0.08, false)
      const steps = Math.round(h / 0.2)
      for (let s = 0; s < steps; s += 2) {
        const a0 = (s / 16) * Math.PI * 2
        const a1 = ((s + 2) / 16) * Math.PI * 2
        const y = y0 + (s / steps) * h
        quadN(out, [[e.x + Math.sin(a0) * 0.3, y, e.z + Math.cos(a0) * 0.3], [e.x + Math.sin(a0) * (r - 0.2), y, e.z + Math.cos(a0) * (r - 0.2)],
          [e.x + Math.sin(a1) * (r - 0.2), y + 0.4, e.z + Math.cos(a1) * (r - 0.2)], [e.x + Math.sin(a1) * 0.3, y + 0.4, e.z + Math.cos(a1) * 0.3]], [0, 1, 0], [0.55, 0.55, 0.55], met)
      }
      prism(out, e.x, e.z, gy - 0.3, y0 + h, 0.22, 8, RED_DK, met)
    } else if (e.k === 'drum') {
      const gy = fit.groundAt?.(e.x, e.z) ?? g
      prism(out, e.x, e.z, gy - 0.3, y0 + e.h, e.r, 24, GLASS, gl)
      prism(out, e.x, e.z, y0 + e.h, y0 + e.h + 0.5, e.r + 0.3, 24, RED, met)
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2
        strut(out, [e.x + Math.sin(a) * (e.r + 0.05), gy, e.z + Math.cos(a) * (e.r + 0.05)], [e.x + Math.sin(a) * (e.r + 0.05), y0 + e.h, e.z + Math.cos(a) * (e.r + 0.05)], 0.14, 0.14, RED_DK, met, false)
      }
    } else if (e.k === 'annex') {
      const gy = fit.groundAt?.((e.x0 + e.x1) / 2, (e.z0 + e.z1) / 2) ?? g
      box(out, (e.x0 + e.x1) / 2, (gy - 0.3 + y0 + e.h) / 2, (e.z0 + e.z1) / 2, (e.x1 - e.x0) / 2, (y0 + e.h - gy + 0.3) / 2, (e.z1 - e.z0) / 2, GLASS, gl)
      box(out, (e.x0 + e.x1) / 2, y0 + e.h + 0.2, (e.z0 + e.z1) / 2, (e.x1 - e.x0) / 2 + 0.25, 0.25, (e.z1 - e.z0) / 2 + 0.25, [0.78, 0.78, 0.76], met)
      for (let x = e.x0; x <= e.x1 + 0.01; x += (e.x1 - e.x0) / Math.max(1, Math.round((e.x1 - e.x0) / 3.6))) {
        for (const z of [e.z0 - 0.05, e.z1 + 0.05]) strut(out, [x, gy, z], [x, y0 + e.h, z], 0.16, 0.16, RED_DK, met, false)
      }
    } else if (e.k === 'canopy') {
      const s = SIDE[e.side]
      const y = e.y ?? top
      const L = e.len
      const cx = s.n[0] * (HALF + L / 2)
      const cz = s.n[1] * (HALF + L / 2)
      box(out, cx, y + 0.2, cz, s.n[0] !== 0 ? L / 2 : HALF + 0.6, 0.2, s.n[1] !== 0 ? L / 2 : HALF + 0.6, RED, met)
      // two raking struts back to the frame
      for (const t of [-HALF + 0.3, HALF - 0.3]) {
        const tip: V3 = [s.n[0] * (HALF + L * 0.8) + s.t[0] * t, y, s.n[1] * (HALF + L * 0.8) + s.t[1] * t]
        const foot: V3 = [s.n[0] * HALF + s.t[0] * t, y - CELL, s.n[1] * HALF + s.t[1] * t]
        strut(out, foot, tip, 0.22, 0.22, RED, met, false)
      }
    } else if (e.k === 'roof') {
      box(out, (e.x0 + e.x1) / 2, y0 + e.y + 0.2, (e.z0 + e.z1) / 2, (e.x1 - e.x0) / 2, 0.22, (e.z1 - e.z0) / 2, RED, met)
      const nx = Math.max(1, Math.round((e.x1 - e.x0) / 7))
      const nz = Math.max(1, Math.round((e.z1 - e.z0) / 7))
      for (let i = 0; i <= nx; i++) for (let j = 0; j <= nz; j++) {
        if (i > 0 && i < nx && j > 0 && j < nz) continue
        const x = e.x0 + 0.3 + ((e.x1 - e.x0 - 0.6) * i) / nx
        const z = e.z0 + 0.3 + ((e.z1 - e.z0 - 0.6) * j) / nz
        if (Math.abs(x) < HALF + 0.3 && Math.abs(z) < HALF + 0.3) continue
        const gy = fit.groundAt?.(x, z) ?? g
        strut(out, [x, gy - 0.2, z], [x, y0 + e.y, z], 0.26, 0.26, RED, met, false)
      }
    } else if (e.k === 'stair') {
      // a straight flight along the face, from the ground at one corner up to the second floor at the other
      const s = SIDE[e.side]
      const off = HALF + 0.9
      const steps = 24
      for (let i = 0; i < steps; i++) {
        const f = i / steps
        const t = -HALF + 0.6 + f * (2 * HALF - 1.2)
        const x = s.n[0] * off + s.t[0] * t
        const z = s.n[1] * off + s.t[1] * t
        const y = y0 + f * 2 * CELL
        box(out, x, y + 0.1, z, s.n[0] !== 0 ? 0.75 : 0.24, 0.1, s.n[1] !== 0 ? 0.75 : 0.24, RED_DK, met)
      }
      const a: V3 = [s.n[0] * (off + 0.8) + s.t[0] * (-HALF + 0.6), y0 + 1, s.n[1] * (off + 0.8) + s.t[1] * (-HALF + 0.6)]
      const b: V3 = [s.n[0] * (off + 0.8) + s.t[0] * (HALF - 0.6), y0 + 2 * CELL + 1, s.n[1] * (off + 0.8) + s.t[1] * (HALF - 0.6)]
      strut(out, a, b, 0.1, 0.1, RED, met, false)
      strut(out, [a[0], y0, a[2]], a, 0.1, 0.1, RED, met, false)
      strut(out, [b[0], b[1] - 1, b[2]], b, 0.1, 0.1, RED, met, false)
      // the landing it reaches, and the post under it
      box(out, s.n[0] * off + s.t[0] * (HALF - 0.6), y0 + 2 * CELL, s.n[1] * off + s.t[1] * (HALF - 0.6), 0.9, 0.12, 0.9, RED, met)
    } else if (e.k === 'wheel') {
      // a quarter wheel standing on the roof edge, its spokes fanning from the corner
      const s = SIDE[e.side]
      const R = 6.5
      const pivot: V3 = [s.n[0] * HALF, top, s.n[1] * HALF]
      const rim: V3[] = []
      for (let i = 0; i <= 8; i++) {
        const a = (i / 8) * (Math.PI / 2)
        const along = -Math.cos(a) * R
        rim.push([pivot[0] + s.n[0] * along, top + Math.sin(a) * R, pivot[2] + s.n[1] * along])
      }
      for (let i = 0; i < 8; i++) strut(out, rim[i], rim[i + 1], 0.36, 0.36, RED, met, false)
      for (let i = 0; i <= 8; i += 2) strut(out, pivot, rim[i], 0.2, 0.2, RED, met, false)
      for (const t of [-HALF, HALF]) {
        const p0: V3 = [pivot[0] + s.t[0] * t, top, pivot[2] + s.t[1] * t]
        strut(out, p0, [p0[0] - s.n[0] * 1.5, top + 3, p0[2] - s.n[1] * 1.5], 0.2, 0.2, RED, met, false)
      }
    } else if (e.k === 'tower') {
      prism(out, e.x, e.z, top - 0.2, top + CELL + 1.2, 1.5, 14, RED, met)
      prism(out, e.x, e.z, top + CELL + 1.2, top + CELL + 1.5, 1.75, 14, RED_DK, met)
    } else if (e.k === 'walk') {
      const s = SIDE[e.side]
      const y = y0 + 2 * CELL
      const x0 = s.n[0] * HALF, z0 = s.n[1] * HALF
      const x1 = s.n[0] * (HALF + e.len), z1 = s.n[1] * (HALF + e.len)
      const wx = s.n[0] !== 0 ? 0 : 1.4, wz = s.n[1] !== 0 ? 0 : 1.4
      box(out, (x0 + x1) / 2, y + 0.12, (z0 + z1) / 2, Math.abs(x1 - x0) / 2 + wx, 0.18, Math.abs(z1 - z0) / 2 + wz, [0.66, 0.66, 0.64], surfaceTag('concrete'))
      for (const k of [-1, 1]) {
        strut(out, [x0 + s.t[0] * 1.4 * k, y + 1.1, z0 + s.t[1] * 1.4 * k], [x1 + s.t[0] * 1.4 * k, y + 1.1, z1 + s.t[1] * 1.4 * k], 0.08, 0.08, [0.75, 0.75, 0.75], met, false)
      }
      const gy = fit.groundAt?.((x0 + x1) / 2, (z0 + z1) / 2) ?? g
      strut(out, [x1, gy, z1], [x1, y, z1], 0.36, 0.36, RED, met, false)
    } else if (e.k === 'clock') {
      const s = SIDE[e.side]
      const cx = s.n[0] * (HALF + 0.2), cz = s.n[1] * (HALF + 0.2)
      const y = y0 + 2.5 * CELL
      for (let i = 0; i < 16; i++) {
        const a0 = (i / 16) * Math.PI * 2, a1 = ((i + 1) / 16) * Math.PI * 2
        const P = (a: number, r: number): V3 => [cx + s.t[0] * Math.sin(a) * r, y + Math.cos(a) * r, cz + s.t[1] * Math.sin(a) * r]
        quadN(out, [P(a0, 0), P(a0, 1.5), P(a1, 1.5), P(a1, 0)], [s.n[0], 0, s.n[1]], [0.94, 0.93, 0.9])
      }
      strut(out, [cx + s.n[0] * 0.05, y, cz + s.n[1] * 0.05], [cx + s.n[0] * 0.05 + s.t[0] * 0.9, y + 0.4, cz + s.n[1] * 0.05 + s.t[1] * 0.9], 0.1, 0.06, [0.1, 0.1, 0.1], 0, false)
      strut(out, [cx + s.n[0] * 0.05, y, cz + s.n[1] * 0.05], [cx + s.n[0] * 0.05, y + 1.2, cz + s.n[1] * 0.05], 0.08, 0.05, [0.1, 0.1, 0.1], 0, false)
    } else if (e.k === 'mast') {
      strut(out, [HALF - 0.2, top, HALF - 0.2], [HALF - 0.2, top + 6, HALF - 0.2], 0.2, 0.2, RED, met, false)
      box(out, HALF - 0.2 + 0.7, top + 5.3, HALF - 0.2, 0.7, 0.45, 0.03, RED, met)
    }
  }
}

/** one name per folie (one builder named by two entries reads as a dead duplicate to the audits) */
export const FOLIES: Record<string, (out: MeshBuilder, fit: Fit) => void> = Object.fromEntries(
  Object.entries(FOLIE).map(([code, spec]) => [`folie${code}`, (out: MeshBuilder, fit: Fit): void => folie(out, fit, spec)]))

/* ------------------------------------------------------------------------------------------- the Grande Halle */

export function grandeHalle(out: MeshBuilder, fit: Fit): void {
  const met = surfaceTag('metal')
  const gl = surfaceTag('glass')
  const IRON: Rgb = [0.88, 0.88, 0.86]
  const ROOF: Rgb = [0.4, 0.43, 0.45]
  const GL: Rgb = [0.4, 0.48, 0.52]
  const DARK: Rgb = [0.2, 0.23, 0.25]
  const hx = Math.min(Math.max(fit.hx, 30), 45)        // across the hall (the gables' width)
  const hz = Math.min(Math.max(fit.hz, 80), 124)       // along it; the Porte de Pantin gable at −z
  const g = fit.grade ?? 0.5
  const base = g
  const porch = 4.5                                    // the open colonnade's depth under the eaves
  const wx = hx - porch                                // the glazed wall's half-width
  const wz = hz - porch
  const aisleEaves = base + 9.5
  const naveX = 15                                     // the clerestory's half-width
  const naveEaves = base + 14
  const ridge = base + 19
  // the floor slab
  box(out, 0, base - 0.3, 0, hx, 0.5, hz, [0.62, 0.61, 0.58], surfaceTag('granite'))
  // the glazed walls of the aisles: dark glass behind white mullions, a solid plinth
  for (const [ax, az, nx, nz, L] of [[0, -wz, 0, -1, wx], [0, wz, 0, 1, wx], [-wx, 0, -1, 0, wz], [wx, 0, 1, 0, wz]] as const) {
    const tx = nz !== 0 ? 1 : 0
    const tz = nx !== 0 ? 1 : 0
    quadN(out, [[ax - tx * L, base, az - tz * L], [ax + tx * L, base, az + tz * L], [ax + tx * L, aisleEaves, az + tz * L], [ax - tx * L, aisleEaves, az - tz * L]], [nx, 0, nz], GL, gl)
    box(out, ax, base + 0.5, az, tx * L + Math.abs(nx) * 0.15, 0.5, tz * L + Math.abs(nz) * 0.15, [0.55, 0.53, 0.5], surfaceTag('ashlar'))
    const n = Math.round((2 * L) / 3)
    for (let i = 0; i <= n; i++) {
      const t = -L + (2 * L * i) / n
      strut(out, [ax + tx * t + nx * 0.1, base, az + tz * t + nz * 0.1], [ax + tx * t + nx * 0.1, aisleEaves, az + tz * t + nz * 0.1], 0.12, 0.12, IRON, met, false)
    }
    strut(out, [ax - tx * L + nx * 0.12, base + 4.5, az - tz * L + nz * 0.12], [ax + tx * L + nx * 0.12, base + 4.5, az + tz * L + nz * 0.12], 0.14, 0.14, IRON, met, false)
  }
  // the colonnade round it: cast-iron columns every 6 m under the eaves, each with its fanned bracket
  const colAt: [number, number, number, number][] = []
  for (let z = -hz + 1; z <= hz - 1 + 0.01; z += (2 * hz - 2) / Math.round((2 * hz - 2) / 6)) { colAt.push([-hx + 1, z, -1, 0]); colAt.push([hx - 1, z, 1, 0]) }
  for (let x = -hx + 1; x <= hx - 1 + 0.01; x += (2 * hx - 2) / Math.round((2 * hx - 2) / 6)) { colAt.push([x, -hz + 1, 0, -1]); colAt.push([x, hz - 1, 0, 1]) }
  for (const [x, z, nx, nz] of colAt) {
    prism(out, x, z, base, aisleEaves - 1.4, 0.22, 8, IRON, met)
    prism(out, x, z, aisleEaves - 1.4, aisleEaves - 1.0, 0.22, 8, IRON, met, 0.45)
    // the bracket, a fan of three struts to the eaves beam and back to the wall
    for (const k of [-1, 0, 1]) {
      const along: [number, number] = nx !== 0 ? [0, 1] : [1, 0]
      strut(out, [x, aisleEaves - 2.6, z], [x + along[0] * k * 1.6 - nx * (k === 0 ? 1.5 : 0), aisleEaves - 0.3, z + along[1] * k * 1.6 - nz * (k === 0 ? 1.5 : 0)], 0.1, 0.1, IRON, met, false)
    }
  }
  // the eaves beam
  for (const [a, b] of [[[-hx + 1, -hz + 1], [hx - 1, -hz + 1]], [[-hx + 1, hz - 1], [hx - 1, hz - 1]], [[-hx + 1, -hz + 1], [-hx + 1, hz - 1]], [[hx - 1, -hz + 1], [hx - 1, hz - 1]]]) {
    strut(out, [a[0], aisleEaves - 0.4, a[1]], [b[0], aisleEaves - 0.4, b[1]], 0.35, 0.6, IRON, met, false)
  }
  // the aisles' roof: a low pitch from the eaves (overhanging the colonnade) up to the clerestory wall, both sides
  for (const s of [-1, 1]) {
    quadN(out, [[s * (hx + 0.8), aisleEaves, -hz - 0.8], [s * (hx + 0.8), aisleEaves, hz + 0.8], [s * naveX, base + 12, hz + 0.8], [s * naveX, base + 12, -hz - 0.8]], [s * 0.25, 1, 0], ROOF, met)
    quadN(out, [[s * (hx + 0.8), aisleEaves - 0.25, -hz - 0.8], [s * (hx + 0.8), aisleEaves - 0.25, hz + 0.8], [s * naveX, base + 11.75, hz + 0.8], [s * naveX, base + 11.75, -hz - 0.8]], [0, -1, 0], [0.75, 0.75, 0.73], met)
    // the clerestory: glass from the aisle roof to the nave's eaves, with its mullions
    quadN(out, [[s * naveX, base + 11.8, -hz], [s * naveX, base + 11.8, hz], [s * naveX, naveEaves, hz], [s * naveX, naveEaves, -hz]], [s, 0, 0], GL, gl)
    for (let z = -hz; z <= hz + 0.01; z += (2 * hz) / Math.round(hz / 1.5)) strut(out, [s * (naveX + 0.08), base + 11.8, z], [s * (naveX + 0.08), naveEaves, z], 0.1, 0.1, IRON, met, false)
    // the nave roof: a low gable to the ridge, its skylight band
    quadN(out, [[s * (naveX + 1.2), naveEaves, -hz - 1.2], [s * (naveX + 1.2), naveEaves, hz + 1.2], [0, ridge, hz + 1.2], [0, ridge, -hz - 1.2]], [s * 0.35, 1, 0], ROOF, met)
    quadN(out, [[s * (naveX * 0.55), naveEaves + (ridge - naveEaves) * 0.45 + 0.05, -hz], [s * (naveX * 0.55), naveEaves + (ridge - naveEaves) * 0.45 + 0.05, hz], [s * (naveX * 0.15), ridge - (ridge - naveEaves) * 0.15 + 0.05, hz], [s * (naveX * 0.15), ridge - (ridge - naveEaves) * 0.15 + 0.05, -hz]], [s * 0.35, 1, 0], GL, gl)
  }
  // the gable ends: the aisles' roof line and the nave's, glazed, framed in white; the clock on the Pantin end
  for (const e of [-1, 1]) {
    const z = e * (hz + 0.8)
    // the aisle gable: a band of glass between the roof slopes and the eaves line
    for (const s of [-1, 1]) {
      quadN(out, [[s * wx, aisleEaves, e * wz], [s * naveX, aisleEaves, e * wz], [s * naveX, base + 12, e * wz], [s * wx, aisleEaves, e * wz]], [0, 0, e], GL, gl)
      strut(out, [s * (hx + 0.8), aisleEaves + 0.1, z], [s * naveX, base + 12.1, z], 0.3, 0.45, IRON, met, false)
      strut(out, [s * (naveX + 1.2), naveEaves + 0.1, e * (hz + 1.2)], [0, ridge + 0.1, e * (hz + 1.2)], 0.3, 0.45, IRON, met, false)
    }
    quadN(out, [[-naveX, aisleEaves, e * wz], [naveX, aisleEaves, e * wz], [naveX, naveEaves, e * wz], [-naveX, naveEaves, e * wz]], [0, 0, e], GL, gl)
    quadN(out, [[-naveX, naveEaves, e * hz], [naveX, naveEaves, e * hz], [0, ridge - 0.2, e * hz], [0, ridge - 0.2, e * hz]], [0, 0, e], GL, gl)
    for (let x = -naveX; x <= naveX + 0.01; x += 2.5) {
      const top = naveEaves + (ridge - 0.2 - naveEaves) * (1 - Math.abs(x) / naveX)
      strut(out, [x, aisleEaves, e * (hz + 0.05)], [x, top, e * (hz + 0.05)], 0.12, 0.12, IRON, met, false)
    }
    strut(out, [-naveX, naveEaves, e * (hz + 0.1)], [naveX, naveEaves, e * (hz + 0.1)], 0.22, 0.3, IRON, met, false)
    if (e === -1) {
      // the clock in the gable, and the hall's name above the doors in red
      for (let i = 0; i < 16; i++) {
        const a0 = (i / 16) * Math.PI * 2, a1 = ((i + 1) / 16) * Math.PI * 2
        quadN(out, [[0, naveEaves + 1.6, z - 0.1], [Math.sin(a0) * 1.4, naveEaves + 1.6 + Math.cos(a0) * 1.4, z - 0.1], [Math.sin(a1) * 1.4, naveEaves + 1.6 + Math.cos(a1) * 1.4, z - 0.1], [0, naveEaves + 1.6, z - 0.1]], [0, 0, -1], [0.95, 0.95, 0.92])
      }
      box(out, 0, naveEaves + 3.3, z - 0.1, 2.8, 0.35, 0.06, [0.8, 0.12, 0.1], met)
      // the great doors under the gable, dark
      box(out, 0, base + 3, -wz - 0.05, 9, 3, 0.05, DARK, 0)
    }
  }
}
