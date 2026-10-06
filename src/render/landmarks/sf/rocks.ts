/**
 * SEA STACKS (appearance pass, 2026-10-03): Seal Rocks off the Cliff House are steep dark stacks streaked white with
 * guano, the sea breaking round them — drawn as a flat brown patch at the waterline. A cluster of rough faceted
 * crags, deterministic from the seed, standing out of the water (placed with `deckAbove: 0`).
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { surfaceTag } from '../../cartoon-material.ts'

const h = (a: number, b: number): number => { const v = Math.sin(a * 91.3 + b * 47.7) * 43758.5; return v - Math.floor(v) }

export function seaStacks(out: MeshBuilder, fit: Fit): void {
  /*
   * Rebuilt 2026-10-06 (owner: "the small offshore islands" with the cliffs, the rock surface): each stack is a crag
   * of BROKEN BLOCKS in the photographed rock (`surfaceTag('rock')`), heaped into a steep mound highest at its heart —
   * upright jointed faces, ledges, nothing round — with the seabirds' white over the upper ledges and a dark wet band
   * at the waterline. A big stack and a scatter of smaller ones round it, as Seal Rocks stand.
   */
  const R = Math.max(10, Math.min(fit.hx, fit.hz))
  const rock = surfaceTag('rock')
  const stacks: { x: number; z: number; r: number; H: number }[] = [{ x: 0, z: 0, r: R * 0.6, H: R * 0.85 }]
  for (let i = 1; i < 6; i++) {
    const a = h(i, 1) * Math.PI * 2, d = (0.45 + h(i, 2) * 0.5) * R
    stacks.push({ x: Math.cos(a) * d, z: Math.sin(a) * d, r: R * (0.14 + h(i, 3) * 0.2), H: R * (0.2 + h(i, 4) * 0.45) })
  }
  stacks.forEach((st, si) => {
    const n = Math.round(14 + st.r * 3.2)
    for (let k = 0; k < n; k++) {
      // blocks heaped towards the middle: the nearer the heart, the taller
      const a = h(si * 31 + k, 5) * Math.PI * 2, d = Math.sqrt(h(si * 31 + k, 6)) * st.r
      const x = st.x + Math.cos(a) * d, z = st.z + Math.sin(a) * d
      const top = st.H * (1 - (d / st.r) ** 1.6) * (0.7 + 0.45 * h(si * 31 + k, 7))
      if (top < 0.6) continue
      const hx = st.r * (0.14 + 0.18 * h(si * 31 + k, 8)), hz = st.r * (0.12 + 0.16 * h(si * 31 + k, 9))
      crag(out, x, z, -2.5, top, hx, hz, h(si * 31 + k, 10) * Math.PI, top / Math.max(1, st.H), rock)
    }
  })
}

/** One broken block from y0 to y1: corners at their own heights, the top drawn in, white on top if it stands high. */
function crag(out: MeshBuilder, cx: number, cz: number, y0: number, y1: number, hx: number, hz: number, yaw: number, high: number, tag: number): void {
  const c = Math.cos(yaw), s = Math.sin(yaw)
  const P = (lx: number, y: number, lz: number): [number, number, number] => [cx + lx * c + lz * s, y, cz - lx * s + lz * c]
  const j = (k: number): number => h(cx * 0.37 + k, cz * 0.53 + k * 3.1)
  const H = y1 - y0
  const t = [y1 - j(1) * H * 0.15, y1 - j(2) * H * 0.15, y1 - j(3) * H * 0.15, y1 - j(4) * H * 0.15]
  const ix = hx * (0.7 + 0.2 * j(5)), iz = hz * (0.7 + 0.2 * j(6))
  const b = [P(-hx, y0, -hz), P(hx, y0, -hz), P(hx, y0, hz), P(-hx, y0, hz)]
  const u = [P(-ix, t[0], -iz), P(ix, t[1], -iz), P(ix, t[2], iz), P(-ix, t[3], iz)]
  // dark greywacke; the tops of the high ones white with guano
  const side: [number, number, number] = [0.25 + 0.05 * j(7), 0.24 + 0.04 * j(7), 0.23]
  const top: [number, number, number] = high > 0.5 ? [0.62, 0.61, 0.58] : [0.3, 0.29, 0.27]
  const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  const face = (a: [number, number, number], bb: [number, number, number], cc: [number, number, number], d: [number, number, number], col: [number, number, number]): void => {
    const e1 = [bb[0] - a[0], bb[1] - a[1], bb[2] - a[2]], e2 = [d[0] - a[0], d[1] - a[1], d[2] - a[2]]
    const nn = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]]
    const L = Math.hypot(nn[0], nn[1], nn[2]) || 1
    const mx = (a[0] + cc[0]) / 2 - cx, my = (a[1] + cc[1]) / 2 - (y0 + y1) / 2, mz = (a[2] + cc[2]) / 2 - cz
    const sg = nn[0] * mx + nn[1] * my + nn[2] * mz < 0 ? -1 : 1
    out.quad([a, bb, cc, d], [sg * nn[0] / L, sg * nn[1] / L, sg * nn[2] / L], uv, col, tag)
  }
  face(u[0], u[1], u[2], u[3], top)
  face(b[3], b[2], u[2], u[3], side)
  face(b[1], b[0], u[0], u[1], side)
  face(b[2], b[1], u[1], u[2], side)
  face(b[0], b[3], u[3], u[0], side)
}
