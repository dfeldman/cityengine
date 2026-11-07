import type { MeshBuilder } from '../../buildings.ts'
import { type Rgb } from '../../models.ts'
import { beam } from '../kit.ts'

const FIXED = 0

/** half the skylight's glass, the stone frame round it (IGN aerial, 2026-11-07: ~14.4 m glass in a ~22.5 m frame) */
export const INV_GLASS_HALF = 7.2
export const INV_FRAME_HALF = 11.4
/** the frame's inner lip over the lawn, sloping to the lawn at its outer edge */
export const INV_RIM_Y = 0.8
/** the frame's outer edge, over the lawn the city drapes */
export const INV_FRAME_Y = 0.5
/** how far the pyramid's tip hangs below the glass */
export const INV_HANG = 7
/** the hall's floor, above the pit regions.json `terrainTweaks` digs (10 m), so the ground there never shows */
export const INV_FLOOR_Y = -9
/** the lid's grid of glazing bars, and the pyramid's diamonds */
export const INV_LID_BARS = 6

/**
 * La Pyramide inversée (I. M. Pei, 1993) under the Place du Carrousel: a glass pyramid hung point-down from a flat skylight in the
 * middle of the roundabout's lawn, lighting the Carrousel du Louvre's hall. From the street it is the skylight — a square of glass in
 * a sloped stone frame — and the funnel of glass seen through it. The ground under it is dug out at runtime (regions.json
 * `terrainTweaks`, city/terrain-tweaks.ts): the pit's posts are the glass's ring, and the ground ramps back up over one 4 m step
 * outside it, under the frame. Faces on ±x and ±z.
 */
export function louvreInverted(out: MeshBuilder): void {
  const glass: Rgb = [0.5, 0.58, 0.62]
  const steel: Rgb = [0.3, 0.32, 0.34]
  const stone: Rgb = [0.6, 0.58, 0.55]
  const hall: Rgb = [0.62, 0.6, 0.56]
  const g = INV_GLASS_HALF, f = INV_FRAME_HALF, y = INV_RIM_Y
  const ceil = y - 0.25
  const corners: [number, number][] = [[-1, -1], [1, -1], [1, 1], [-1, 1]]
  for (let i = 0; i < 4; i++) {
    const [ax, az] = corners[i]
    const [bx, bz] = corners[(i + 1) % 4]
    // outward along this side
    const nx = (ax + bx) / 2, nz = (az + bz) / 2
    // the frame: a sloped band from the glass's lip down to the lawn, and its short outer face
    out.quad([[ax * f, INV_FRAME_Y, az * f], [bx * f, INV_FRAME_Y, bz * f], [bx * g, y, bz * g], [ax * g, y, az * g]],
      [nx * 0.15, 1, nz * 0.15], [[0, 0], [1, 0], [1, 1], [0, 1]], stone, FIXED)
    out.quad([[ax * f, -0.6, az * f], [bx * f, -0.6, bz * f], [bx * f, INV_FRAME_Y, bz * f], [ax * f, INV_FRAME_Y, az * f]],
      [nx, 0, nz], [[0, 0], [1, 0], [1, 1], [0, 1]], stone, FIXED)
    // the pit's wall under the lip, facing in, down to the hall's floor
    out.quad([[bx * g, INV_FLOOR_Y, bz * g], [ax * g, INV_FLOOR_Y, az * g], [ax * g, y, az * g], [bx * g, y, bz * g]],
      [-nx, 0, -nz], [[0, 0], [1, 0], [1, 1], [0, 1]], hall, FIXED)
    // the inverted pyramid's face, from the glass's edge down to the tip, facing up and in
    const tip: [number, number, number] = [0, ceil - INV_HANG, 0]
    const a: [number, number, number] = [ax * g, ceil, az * g]
    const b: [number, number, number] = [bx * g, ceil, bz * g]
    const s = Math.hypot(g, INV_HANG)
    out.quad([b, a, tip, tip], [-nx * INV_HANG / s, g / s, -nz * INV_HANG / s], [[0, 0], [1, 0], [0.5, 1], [0.5, 1]], glass, FIXED)
    // its lattice: diamonds, lines from points along the rim parallel to the two slanting edges
    const up = (p: [number, number, number]): [number, number, number] => [p[0] - nx * 0.05, p[1] + 0.05, p[2] - nz * 0.05]
    for (let k = 1; k < INV_LID_BARS; k++) {
      const t = k / INV_LID_BARS
      const p: [number, number, number] = [a[0] + (b[0] - a[0]) * t, ceil, a[2] + (b[2] - a[2]) * t]
      beam(out, up(p), up([p[0] + (tip[0] - a[0]) * (1 - t), p[1] + (tip[1] - ceil) * (1 - t), p[2] + (tip[2] - a[2]) * (1 - t)]), 0.05, steel)
      beam(out, up(p), up([p[0] + (tip[0] - b[0]) * t, p[1] + (tip[1] - ceil) * t, p[2] + (tip[2] - b[2]) * t]), 0.05, steel)
    }
    beam(out, a, tip, 0.1, steel)
    // the lid's rim
    beam(out, [ax * g, y, az * g], [bx * g, y, bz * g], 0.12, steel)
  }
  // the lid's glazing bars, a square grid over the funnel (the glass itself is left out, so the funnel shows through)
  for (let k = 1; k < INV_LID_BARS; k++) {
    const t = -g + (2 * g * k) / INV_LID_BARS
    beam(out, [t, y, -g], [t, y, g], 0.05, steel)
    beam(out, [-g, y, t], [g, y, t], 0.05, steel)
  }
  // the hall's floor under it, and the small stone pyramid pointing up at the tip
  out.quad([[-g, INV_FLOOR_Y, g], [g, INV_FLOOR_Y, g], [g, INV_FLOOR_Y, -g], [-g, INV_FLOOR_Y, -g]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], hall, FIXED)
  const sp = 1.4, sh = 1.4
  for (let i = 0; i < 4; i++) {
    const [ax, az] = corners[i]
    const [bx, bz] = corners[(i + 1) % 4]
    const nx = (ax + bx) / 2, nz = (az + bz) / 2
    out.quad([[ax * sp, INV_FLOOR_Y, az * sp], [bx * sp, INV_FLOOR_Y, bz * sp], [0, INV_FLOOR_Y + sh, 0], [0, INV_FLOOR_Y + sh, 0]],
      [nx * 0.7, 0.7, nz * 0.7], [[0, 0], [1, 0], [0.5, 1], [0.5, 1]], stone, FIXED)
  }
}
