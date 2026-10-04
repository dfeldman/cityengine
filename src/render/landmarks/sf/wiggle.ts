/**
 * THE WIGGLE (the queue: "The Wiggle (the flat bike route)"), 2026-10-04: the zig-zag of flat streets cyclists take
 * from Market Street to the Panhandle round the hills of the Lower Haight — west on Duboce, right on Steiner, left on
 * Waller, right on Pierce, left on Haight, right on Scott, to Fell. Marked on the road with green-backed SHARROWS (a
 * green panel, a white bike over two chevrons) every few dozen metres, both ways. The corners are OSM's own street
 * intersections; the panels are draped on the ground (`drape`), a hand over the road markings.
 *
 * Built in the world's axes about one point, the Steiner & Waller crossing (front 180: local x east, z north); its
 * entry's footprint is that crossing alone (`drape` lifts every vertex to the ground at its own place), so it claims
 * nothing of the blocks the route passes.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import type { Rgb } from '../../models.ts'

const ORIGIN = { x: -1752, z: -2452 }
/** Duboce & Church → Steiner → Waller → Pierce → Haight → Scott → Fell (OSM intersection nodes) */
const ROUTE: [number, number][] = [[-1509, -2620], [-1723, -2636], [-1752, -2452], [-1897, -2476], [-1913, -2372], [-2058, -2395], [-2108, -2083]]
const GREEN: Rgb = [0.18, 0.5, 0.24]
const WHITE: Rgb = [0.92, 0.92, 0.9]
const Y = 0.1

export function wiggleSharrows(out: MeshBuilder, _fit: Fit): void {
  const up: [number, number, number] = [0, 1, 0]
  const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  // a rectangle in the frame of (along, across) unit vectors, centred at c
  const rect = (cx: number, cz: number, ax: number, az: number, a0: number, a1: number, c0: number, c1: number, y: number, col: Rgb): void => {
    const px = -az, pz = ax
    const p = (a: number, c: number): [number, number, number] => [cx + ax * a + px * c, y, cz + az * a + pz * c]
    out.quad([p(a0, c0), p(a1, c0), p(a1, c1), p(a0, c1)], up, uv, col, 0)
  }
  const sharrow = (cx: number, cz: number, ax: number, az: number): void => {
    rect(cx, cz, ax, az, -1.9, 1.9, -0.75, 0.75, Y, GREEN)
    // two chevrons pointing along the way, and the bike (two wheels and a frame bar) behind them
    for (const k of [0.6, 1.2]) {
      const px = -az, pz = ax
      for (const s of [-1, 1]) {
        const a0 = k - 0.45, a1 = k
        const b = (a: number, c: number): [number, number, number] => [cx + ax * a + px * c, Y + 0.03, cz + az * a + pz * c]
        out.quad([b(a0, s * 0.55), b(a0 + 0.14, s * 0.55), b(a1 + 0.14, 0), b(a1, 0)], up, uv, WHITE, 0)
      }
    }
    for (const a of [-1.45, -0.55]) rect(cx, cz, ax, az, a - 0.22, a + 0.22, -0.22, 0.22, Y + 0.03, WHITE)
    rect(cx, cz, ax, az, -1.25, -0.75, -0.05, 0.05, Y + 0.03, WHITE)
  }
  for (let i = 1; i < ROUTE.length; i++) {
    const [x0, z0] = ROUTE[i - 1], [x1, z1] = ROUTE[i]
    const L = Math.hypot(x1 - x0, z1 - z0)
    const ax = (x1 - x0) / L, az = (z1 - z0) / L
    const px = -az, pz = ax
    for (let t = 14; t < L - 10; t += 35) {
      const x = x0 + ax * t - ORIGIN.x, z = z0 + az * t - ORIGIN.z
      // outbound on its right-hand lane, and homebound the other way on the other side
      sharrow(x - px * 2.6, z - pz * 2.6, ax, az)
      sharrow(x + px * 2.6, z + pz * 2.6, -ax, -az)
    }
  }
}

export const WIGGLE: Record<string, (out: MeshBuilder, fit: Fit) => void> = { wiggleSharrows }
