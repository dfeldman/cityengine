import { MeshBuilder } from '../../../buildings.ts'
import { prism, type Rgb } from '../../../models.ts'
import { block, hex, placed, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { rounded } from './bon-marche.ts'
import { extrude, fitted, palette, pts } from './common.ts'
import { lettersOn } from './showfront.ts'

const FIXED = 0
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
const STONE = hex('#e4dcc8')
const NAVY = hex('#1f2a44')
const SLATE = hex('#4d5358')
/** The corner's great radius: five bays on its bend. */
const R = 18
type P2 = { x: number; z: number }
/** the design footprint: OSM way 63454000's box turned to the boulevard (local −z faces bearing 259.4, the Boulevard Raspail) */
const HX = 48.5
const HZ = 24.75
/** The way's outline, its first corner the one on the crossing, drawn sharp here and rounded below. */
const OUTER = pts([-34.8, -24.5, 36.1, -24.6, 48.5, -16.1, 38.1, -0.2, 31.2, -4.6, 28.6, 1.6, 21.3, -1.3, 17.8, 8.9, 11.9, 6.5, 9, 14.3, 16.9, 17.3, 14.1, 24.8, -24.5, 10.6, -21.5, 3.1, -48.5, -5.7])

/**
 * Le Lutetia (Louis-Hippolyte Boileau and Henri Tauzin, 1910), 45 Boulevard Raspail, on the Sèvres-Babylone crossing: the Left
 * Bank's one palace hotel, a great pale wedding-cake with the first breath of Art Deco in its stone. A rider sees:
 *
 * - the ROUND CORNER on the crossing rising to its big arched PEDIMENT with LVTETIA carved in it and a flag over;
 * - the long front down the boulevard: seven floors bowing gently, stone garlands between the windows, iron balconies in tiers;
 * - along the top, the billowing ROUND-HEADED DORMERS one after another against the sky, their stone chimneys and urns;
 * - at the street, the arched openings with their navy awnings, the brasserie's black fascia on the corner.
 *
 * Plan is OSM's (way 63454000, its courts on the north left as its outline). Heights off photographs from the crossing (Commons,
 * 2021–2026): first floor 5.6 m, top balcony 22, cornice 24.5, dormers to 29, pediment to 33. The garlands are only a pale
 * panel between each window pair; they are too fine to draw.
 */
export function lutetia(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

function draw(out: MeshBuilder): void {
  const p = palette('#e4dcc8', '#4d5358')
  const eaves = 24.5
  const n = OUTER.length
  const c = rounded(OUTER[n - 1], OUTER[0], OUTER[1], R)
  const ring: P2[] = [c.q, ...OUTER.slice(1), c.p]
  extrude(out, [ring], p, { eaves, bay: 3.6, win: 1.55, rise: 3.2, inset: 1.7, dormers: false,
    storeys: [{ y: 0, h: 3.6, sill: 0.3 }, { y: 5.4, h: 2.3 }, { y: 8.7, h: 2.3 }, { y: 12, h: 2.3 }, { y: 15.3, h: 2.2 }, { y: 18.5, h: 2.1 }, { y: 21.5, h: 1.8, sill: 0.5 }] })
  // the two street fronts' dressing: balconies, panels, dormers, the street's awnings
  const area = ring.reduce((t, r, i) => t + r.x * ring[(i + 1) % ring.length].z - ring[(i + 1) % ring.length].x * r.z, 0)
  const s = area > 0 ? 1 : -1
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]
    const b = ring[(i + 1) % ring.length]
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    if (L < 15) continue
    front(out, s > 0 ? a : b, s > 0 ? b : a, L, p, eaves)
  }
  // ---- the round corner: its drum, windows, pediment
  const { cx, cz, a0, a1 } = c
  prism(out, cx, cz, 0, eaves, R, 40, STONE, FIXED, R, false)
  prism(out, cx, cz, eaves - 0.7, eaves + 0.05, R + 0.5, 40, shade(STONE, 1.04), FIXED, R + 0.6)
  prism(out, cx, cz, eaves, eaves + 3.2, R + 0.1, 40, SLATE, FIXED, R - 1.8, false)
  prism(out, cx, cz, eaves + 3.2, eaves + 3.4, R - 1.8, 40, shade(SLATE, 0.9), FIXED, 1)
  const mid = (a0 + a1) / 2
  const span = a1 - a0
  for (let i = 0; i < 5; i++) {
    const a = a0 + (span * (i + 0.5)) / 5
    for (const [y, h] of [[5.8, 2.5], [9.1, 2.5], [12.4, 2.5], [15.7, 2.4], [18.9, 2.3], [21.8, 1.8]] as const) pane(out, cx, cz, R, a, y, y + h, 0.85, p.glass)
    if (i !== 2) pane(out, cx, cz, R, a, 0.6, 4.2, 1.15, NAVY)
    else pane(out, cx, cz, R, a, 0, 4.4, 1.3, hex('#2b2826'))
    for (const y of [5.7, 9, 15.6]) band(out, cx, cz, R + 0.32, a - 0.055, a + 0.055, y, y + 0.08, p.dark)
  }
  // the great arched pediment in the corner's roof, on its stone face, the name on it, the flag over
  const P = (u: number, y: number, d: number): [number, number, number] => [cx + Math.sin(mid) * (R + d) + Math.cos(mid) * u, y, cz - Math.cos(mid) * (R + d) + Math.sin(mid) * u]
  const N: [number, number, number] = [Math.sin(mid), 0, -Math.cos(mid)]
  const y0 = eaves
  const hw = 5.4
  out.quad([P(-hw, y0, 0.1), P(hw, y0, 0.1), P(hw, y0 + 3.4, 0.1), P(-hw, y0 + 3.4, 0.1)], N, UV, STONE, FIXED)
  const m = 12
  for (let k = 0; k < m; k++) {
    const b0 = (k / m) * Math.PI
    const b1 = ((k + 1) / m) * Math.PI
    out.quad([P(0, y0 + 3.4, 0.1), P(Math.cos(b0) * hw, y0 + 3.4 + Math.sin(b0) * 4.2, 0.1), P(Math.cos(b1) * hw, y0 + 3.4 + Math.sin(b1) * 4.2, 0.1), P(0, y0 + 3.4, 0.1)], N, UV, STONE, FIXED)
    out.quad([P(Math.cos(b0) * (hw - 0.45), y0 + 3.4 + Math.sin(b0) * 3.75, 0.13), P(Math.cos(b0) * hw, y0 + 3.4 + Math.sin(b0) * 4.2, 0.13), P(Math.cos(b1) * hw, y0 + 3.4 + Math.sin(b1) * 4.2, 0.13), P(Math.cos(b1) * (hw - 0.45), y0 + 3.4 + Math.sin(b1) * 3.75, 0.13)], N, UV, shade(STONE, 1.06), FIXED)
  }
  // cheeks back into the slates, a round lucarne at the crown
  for (const s2 of [-1, 1]) out.quad([P(s2 * hw, y0, 0.1), P(s2 * hw, y0 + 3.4, 0.1), P(s2 * hw * 0.7, y0 + 4.6, -2.6), P(s2 * hw * 0.7, y0, -2.6)], [Math.cos(mid) * s2, 0, Math.sin(mid) * s2], UV, shade(STONE, 0.85), FIXED)
  out.quad([P(-1.5, y0 + 5.2, 0.14), P(1.5, y0 + 5.2, 0.14), P(1.5, y0 + 6.5, 0.14), P(-1.5, y0 + 6.5, 0.14)], N, UV, p.glass, FIXED)
  const name = new MeshBuilder()
  lettersOn(name, '-z', 0, 0, y0 + 3.3, 'LVTETIA', { h: 1.05, c: shade(STONE, 0.58), wide: 0.66, th: 0.14, gap: 0.2, d: 0 })
  const at = P(0, 0, 0.16)
  placed(out, name, -mid, at[0], at[2])
  for (let k = 0; k < 3; k++) {
    const u = (k - 1) * 3.2
    out.quad([P(u - 1.1, y0 + 0.6, 0.14), P(u + 1.1, y0 + 0.6, 0.14), P(u + 1.1, y0 + 2.8, 0.14), P(u - 1.1, y0 + 2.8, 0.14)], N, UV, p.glass, FIXED)
  }
  const fx = cx + Math.sin(mid) * (R + 0.1)
  const fz = cz - Math.cos(mid) * (R + 0.1)
  prism(out, fx, fz, y0 + 7.5, y0 + 11.3, 0.05, 6, p.dark, FIXED, 0.03, false)
  flag(out, fx, fz, y0 + 10.2)
}

/** One long front's dressing, walked from a to b. */
function front(out: MeshBuilder, a: P2, b: P2, L: number, p: ReturnType<typeof palette>, eaves: number): void {
  const tx = (b.x - a.x) / L
  const tz = (b.z - a.z) / L
  const nx = tz
  const nz = -tx
  const A = (u: number, y: number, d: number): [number, number, number] => [a.x + tx * u + nx * d, y, a.z + tz * u + nz * d]
  const Q = (u0: number, u1: number, y0: number, y1: number, d: number, c: Rgb): void => out.quad([A(u0, y0, d), A(u1, y0, d), A(u1, y1, d), A(u0, y1, d)], [nx, 0, nz], UV, c, FIXED)
  // the street storey's band, the balcony lines
  Q(0, L, 4.3, 5.2, 0.14, shade(STONE, 1.03))
  Q(0, L, 21.05, 21.25, 0.3, p.dark)
  Q(0, L, 8.3, 8.4, 0.25, p.dark)
  const bays = Math.round((L - 1.2) / 3.6)
  const step = (L - 1.2) / bays
  for (let i = 0; i < bays; i++) {
    const u = 0.6 + step * (i + 0.5)
    // a stone panel of garland between the windows of the upper floors
    for (const y of [14.65, 11.35]) Q(u + step / 2 - 0.34, u + step / 2 + 0.34, y - 1.8, y, 0.08, shade(STONE, 1.08))
    // the balconettes
    for (const y of [12.2, 15.6]) Q(u - 0.82, u + 0.82, y + 0.45, y + 0.53, 0.2, p.dark)
    // an arched opening with its navy awning, every second bay
    if (i % 2 === 0) {
      out.quad([A(u - 1.3, 2.7, 0.9), A(u + 1.3, 2.7, 0.9), A(u + 1.3, 3.9, 0.05), A(u - 1.3, 3.9, 0.05)], [nx * 0.6, 0.8, nz * 0.6], UV, NAVY, FIXED)
    }
    // the billowing round-headed dormers along the top
    if (i % 2 === 0) {
      const d = -0.5
      const y0 = eaves + 0.05
      Q(u - 1.5, u + 1.5, y0, y0 + 2.1, d, STONE)
      Q(u - 0.8, u + 0.8, y0 + 0.4, y0 + 2.2, d + 0.05, p.glass)
      const m = 7
      for (let k = 0; k < m; k++) {
        const b0 = (k / m) * Math.PI
        const b1 = ((k + 1) / m) * Math.PI
        out.quad([A(u, y0 + 2.1, d), A(u + Math.cos(b0) * 1.8, y0 + 2.1 + Math.sin(b0) * 1.7, d), A(u + Math.cos(b1) * 1.8, y0 + 2.1 + Math.sin(b1) * 1.7, d), A(u, y0 + 2.1, d)], [nx, 0, nz], UV, shade(STONE, 1.04), FIXED)
      }
      out.quad([A(u - 1.5, y0, d), A(u - 1.5, y0 + 2.1, d), A(u - 1.5, y0 + 2.1, d - 1.5), A(u - 1.5, y0, d - 1.5)], [-tx, 0, -tz], UV, shade(STONE, 0.84), FIXED)
      out.quad([A(u + 1.5, y0, d), A(u + 1.5, y0 + 2.1, d), A(u + 1.5, y0 + 2.1, d - 1.5), A(u + 1.5, y0, d - 1.5)], [tx, 0, tz], UV, shade(STONE, 0.84), FIXED)
    } else {
      // the stone chimney piers between the dormers
      const cx = a.x + tx * u - nx * 2
      const cz = a.z + tz * u - nz * 2
      block(out, cx - 0.45, cx + 0.45, cz - 0.45, cz + 0.45, eaves, eaves + 4.1, shade(STONE, 0.98))
      block(out, cx - 0.6, cx + 0.6, cz - 0.6, cz + 0.6, eaves + 4.1, eaves + 4.4, shade(STONE, 1.03))
    }
  }
}

function pane(out: MeshBuilder, cx: number, cz: number, r: number, a: number, y0: number, y1: number, hw: number, c: Rgb): void {
  const sx = Math.sin(a)
  const sz = -Math.cos(a)
  const P = (u: number, y: number, d: number): [number, number, number] => [cx + sx * (r + d) + Math.cos(a) * u, y, cz + sz * (r + d) + Math.sin(a) * u]
  out.quad([P(-hw - 0.14, y0 - 0.12, 0.02), P(hw + 0.14, y0 - 0.12, 0.02), P(hw + 0.14, y1 + 0.12, 0.02), P(-hw - 0.14, y1 + 0.12, 0.02)], [sx, 0, sz], UV, shade(STONE, 1.05), FIXED)
  out.quad([P(-hw, y0, 0.05), P(hw, y0, 0.05), P(hw, y1, 0.05), P(-hw, y1, 0.05)], [sx, 0, sz], UV, c, FIXED)
}

function band(out: MeshBuilder, cx: number, cz: number, r: number, a0: number, a1: number, y0: number, y1: number, c: Rgb): void {
  const A = (a: number, y: number): [number, number, number] => [cx + Math.sin(a) * r, y, cz - Math.cos(a) * r]
  const m = (a0 + a1) / 2
  out.quad([A(a0, y0), A(a1, y0), A(a1, y1), A(a0, y1)], [Math.sin(m), 0, -Math.cos(m)], UV, c, FIXED)
}

function flag(out: MeshBuilder, x: number, z: number, y: number): void {
  for (const [i, c] of [[0, '#23408e'], [1, '#f2f2f2'], [2, '#d0232b']] as const) {
    const u0 = i * 0.5
    out.quad([[x + u0, y, z], [x + u0 + 0.5, y, z], [x + u0 + 0.5, y + 1, z], [x + u0, y + 1, z]], [0, 0, -1], UV, hex(c), FIXED)
    out.quad([[x + u0, y, z], [x + u0 + 0.5, y, z], [x + u0 + 0.5, y + 1, z], [x + u0, y + 1, z]], [0, 0, 1], UV, hex(c), FIXED)
  }
}
