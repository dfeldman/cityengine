/**
 * THE TERRE-PLEIN OF THE PONT NEUF (owner, 2026-10-31: "a bunch of stray staircases imported from osm around the statue"). The square Henri IV stands on is
 * level with the bridge, a paved platform on the point of the Cité, with stone walls down to the Vert-Galant and a pair of stairs against the north-western
 * one. The bake levels its ground with the road and takes OSM's steps away; this draws the paving, the walls and the stairs, and the statue stands on it as
 * before. Local −z looks at the road; +z is the Vert-Galant.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { box, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'

const WALL: Rgb = [0.74, 0.69, 0.58]
const PAVING: Rgb = [0.46, 0.44, 0.39]
const COPING: Rgb = [0.82, 0.78, 0.68]

export function terrePlein(out: MeshBuilder, fit: Fit): void {
  const stone = surfaceTag('ashlar')
  const hx = fit.hx, hz = fit.hz
  const g = (x: number, z: number): number => fit.groundAt ? fit.groundAt(x, z) : 0
  const top = g(0, 0) + 0.3
  const bottom = Math.min(top - 9, g(-hx - 3, hz + 3) - 1, g(hx + 3, hz + 3) - 1)
  const mid = (top + bottom) / 2, half = (top - bottom) / 2

  // the paving, and the walls on the three sides away from the road
  box(out, 0, top - 0.15, 0, hx, 0.15, hz, PAVING, stone)
  box(out, -hx - 0.4, mid, 0, 0.4, half, hz, WALL, stone)
  box(out, hx + 0.4, mid, 0, 0.4, half, hz, WALL, stone)
  box(out, 0, mid, hz + 0.4, hx + 0.8, half, 0.4, WALL, stone)
  // a parapet round them, breast high, broken over the stairs
  const gap = 3.2
  box(out, -hx - 0.4, top + 0.45, 0, 0.4, 0.55, hz + 0.8, COPING, stone)
  box(out, hx + 0.4, top + 0.45, 0, 0.4, 0.55, hz + 0.8, COPING, stone)
  for (const s of [-1, 1]) box(out, s * (hx + gap) / 2, top + 0.45, hz + 0.4, (hx + 0.8 - gap) / 2, 0.55, 0.4, COPING, stone)

  // the stairs, a flight each way from the gap, against the wall, down to the garden
  const W = 1.6, RISE = 0.17, GOING = 0.3
  for (const s of [-1, 1]) {
    const foot = g(s * (hx - 2), hz + 2)
    const n = Math.max(3, Math.min(32, Math.ceil((top - foot) / RISE)))
    for (let i = 0; i < n; i++) {
      const y = top - (i + 1) * RISE
      const x = s * (gap / 2 + (i + 0.5) * GOING)
      box(out, x, (y + foot) / 2 - 0.2, hz + 0.8 + W / 2, GOING / 2, (y - foot) / 2 + 0.2, W / 2, WALL, stone)
    }
    box(out, s * (gap / 2 + n * GOING / 2), top - (n * RISE) / 2 + 0.65, hz + 0.8 + W + 0.15, n * GOING / 2, 0.15, 0.15, COPING, stone)
  }
}
