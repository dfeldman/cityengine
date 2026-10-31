/**
 * What the hospitals and the École normale need that a restyle (public/landmarks/paris/batch1.json) can't say: Lariboisière's gallery, the Georges-Pompidou's glass roofs and drum, the Ernests' pool. Each read off IGN's aerial.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { MeshBuilder as MB } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { block, hex, placed, prism, shade, type Rgb } from '../../kit.ts'
import { arcade, balustrade, palette } from '../palaces/common.ts'

const UVQ: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

/**
 * LARIBOISIÈRE's GALLERY (Gauthier, 1854; aerial 48.8825 2.3535, the pale edge round the cour d'honneur, axis bearing 8.7, 40 × 104 m): the arcade round three sides of the court, one storey, a terrace on it with its
 * balustrade, joining the pavilions so the wards could be reached under cover. Walls toward the court (the arches) only: outside it the pavilions and their gardens come up against it. −z to the south gate. Height from Commons.
 */
export function lariboisiereGallery(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0, S = hex('#ddd3bd'), DK = shade(S, 0.72), BACK = hex('#3b3a36'), H = y + 5.6
  const HX = 20, HZ = 52, D = 4
  const p = palette('#ddd3bd')
  // a side of it, as a wall of arches in its own frame
  const side = (L: number, x: number, z: number, a: number): void => {
    const q = new MB()
    const n = Math.max(1, Math.round(L / 4.2))
    const centres = Array.from({ length: n }, (_, i) => -L / 2 + ((i + 0.5) * L) / n)
    arcade(q, 0, -L / 2, L / 2, y, H, centres, 2.5, 3.9, 0.45, S, DK, BACK, 4)
    placed(out, q, a, x, z)
  }
  side(HZ * 2, -HX, 0, Math.PI / 2)
  side(HZ * 2, HX, 0, -Math.PI / 2)
  side(HX * 2, 0, HZ, Math.PI)
  // the terrace on it, the back of it where a pavilion doesn't cover it, its rail
  block(out, -HX - D, -HX, -HZ, HZ, H - 0.1, H + 0.1, shade(S, 1.04))
  block(out, HX, HX + D, -HZ, HZ, H - 0.1, H + 0.1, shade(S, 1.04))
  block(out, -HX, HX, HZ, HZ + D, H - 0.1, H + 0.1, shade(S, 1.04))
  block(out, -HX - D, -HX - D + 0.3, -HZ, HZ, y, H, DK)
  block(out, HX + D - 0.3, HX + D, -HZ, HZ, y, H, DK)
  block(out, -HX - D, HX + D, HZ + D - 0.3, HZ + D, y, H, DK)
  for (const s of [-1, 1]) block(out, s * (HX + D / 2) - D / 2, s * (HX + D / 2) + D / 2, -HZ - 0.3, -HZ, y, H, S)
  balustrade(out, -HX, HX, -HZ, HZ, H + 0.1, p, { sides: ['-x', '+x', '+z'], h: 0.9 })
}

/**
 * The GEORGES-POMPIDOU's glass (Zublena, 2000; aerial 48.8390 2.2735): the long teal vaults over its halls that are the first thing you see from anywhere higher than the street, and the round drum at the Rue Leblanc corner that is its door.
 * x east, z north about the entry's point, 3 m proud of OSM's 19 m massing.
 */
export function hegpGlass(out: MeshBuilder, fit: Fit): void {
  const y = (fit.grade ?? 0) + 19.5, G: Rgb = hex('#5b95a0'), ST: Rgb = hex('#c7ccc9'), glass = surfaceTag('glass')
  // (a vault from a to b, width w, ribs at 5 m) a, b in the entry's frame
  const vault = (ax: number, az: number, bx: number, bz: number, w: number): void => {
    const L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L, nx = -uz, nz = ux
    const P = (t: number, s: number, h: number): [number, number, number] => [ax + ux * t + nx * s, y + h, az + uz * t + nz * s]
    const prof: [number, number][] = [[-1, 0], [-0.7, 2], [-0.3, 3], [0.3, 3], [0.7, 2], [1, 0]]
    for (let k = 0; k + 1 < prof.length; k++) {
      const [s0, h0] = prof[k], [s1, h1] = prof[k + 1]
      const n: [number, number, number] = [nx * (h0 - h1), Math.abs(s1 - s0) * (w / 2), nz * (h0 - h1)]
      out.quad([P(0, s0 * w / 2, h0), P(0, s1 * w / 2, h1), P(L, s1 * w / 2, h1), P(L, s0 * w / 2, h0)], n, UVQ, shade(G, 0.92 + k * 0.05), glass)
    }
    for (const t of [0, L]) out.quad([P(t, -w / 2, 0), P(t, w / 2, 0), P(t, w * 0.15, 3), P(t, -w * 0.15, 3)], [ux, 0, uz], UVQ, shade(G, 0.85), glass)
    for (let t = 0; t <= L; t += 5) {
      for (let k = 0; k + 1 < prof.length; k++) {
        const [s0, h0] = prof[k], [s1, h1] = prof[k + 1]
        const a = P(t, s0 * w / 2, h0 + 0.05), b = P(t, s1 * w / 2, h1 + 0.05)
        block(out, Math.min(a[0], b[0]) - 0.06, Math.max(a[0], b[0]) + 0.06, Math.min(a[2], b[2]) - 0.06, Math.max(a[2], b[2]) + 0.06, Math.min(a[1], b[1]), Math.max(a[1], b[1]) + 0.06, ST)
      }
    }
  }
  // (grid: the entry stands at (24, −13) of the 48.8390 2.2735 grid)
  const o = (e: number, n: number): [number, number] => [e - 24, n + 13]
  const v = (a: [number, number], b: [number, number], w: number): void => { const A = o(...a), B = o(...b); vault(A[0], A[1], B[0], B[1], w) }
  v([-5, 40], [58, 12], 15)
  v([83, 5], [128, -22], 15)
  v([142, -31], [168, -50], 14)
  // the rotunda
  const [cx, cz] = o(137, -97)
  const y0 = fit.grade ?? 0
  prism(out, cx, cz, y0, y0 + 11, 11.5, 28, hex('#d9d9d2'), surfaceTag('concrete'))
  prism(out, cx, cz, y0, y0 + 9, 11.6, 28, hex('#5f7c88'), glass)
  prism(out, cx, cz, y0 + 11, y0 + 11.6, 12.1, 28, hex('#efece3'), surfaceTag('concrete'))
  prism(out, cx, cz, y0 + 11.6, y0 + 13.5, 6.5, 20, G, glass, 3.5)
}

/** The COUR AUX ERNESTS's pool (École normale supérieure, 45 rue d'Ulm): a round stone-edged basin (the aerial's pale ring, 4.5 m across), the goldfish called Ernest in it, a low rim. */
export function ensErnests(out: MeshBuilder, fit: Fit): void {
  const y = (fit.grade ?? 0) + 0.05, A = 4.5, B = 4.5, ST = hex('#d3c9b4'), n = 24
  const ring = Array.from({ length: n }, (_, k) => {
    const t = (k / n) * Math.PI * 2
    return { x: Math.cos(t) * A, z: Math.sin(t) * B }
  })
  for (let k = 0; k < n; k++) {
    const a = ring[k], b = ring[(k + 1) % n]
    const o = (p: { x: number; z: number }): { x: number; z: number } => ({ x: p.x * 1.1, z: p.z * 1.1 })
    const ao = o(a), bo = o(b)
    out.quad([[a.x, y + 0.3, a.z], [ao.x, y + 0.3, ao.z], [bo.x, y + 0.3, bo.z], [b.x, y + 0.3, b.z]], [0, 1, 0], UVQ, ST, surfaceTag('ashlar'))
    out.quad([[ao.x, y + 0.3, ao.z], [ao.x, y - 0.1, ao.z], [bo.x, y - 0.1, bo.z], [bo.x, y + 0.3, bo.z]], [ao.x, 0, ao.z], UVQ, shade(ST, 0.86), surfaceTag('ashlar'))
  }
  out.water.push({ kind: 'pool', ring, y: y + 0.18, colour: [0.32, 0.42, 0.4] })
  for (const [x, z] of [[-2, 1], [1.4, -1.4], [2.6, 1.5]] as const) block(out, x - 0.2, x + 0.2, z - 0.07, z + 0.07, y + 0.19, y + 0.205, hex('#d9772b'))
}
