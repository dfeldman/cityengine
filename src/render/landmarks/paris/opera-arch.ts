import type { MeshBuilder } from '../../buildings.ts'
import { block, hex, shade } from '../kit.ts'

/**
 * The Opéra Bastille's great arch: the square frame standing proud of the front over the entrance stairs,
 * the one piece of the building everyone recognises. Lanhélin granite (2026-10-31, the Opéra's own site: a blue-grey stone, and at the charcoal it was it read as a black box on the Place), ~20 m square, 2 m deep, with dark glazing
 * in a grid inside it and the broad flight of steps below. The rest of the Opéra is its own OSM
 * massing, restyled (landmark manifest "opera").
 */
export function operaArch(out: MeshBuilder): void {
  const stone = hex('#73777a')          // grey granite: the one dark thing on a pale building
  const glass = hex('#3d4c58')
  const steps = hex('#c9c9c4')
  const w = 10
  const h = 19
  const t = 2.2
  // the steps: a broad flight up to the doors
  for (let k = 0; k < 8; k++) block(out, -w - 6 + k * 0.5, w + 6 - k * 0.5, -6 + k * 0.45, 4, 0, 0.18 * (k + 1), steps)
  // the posts and lintel of the frame, and a thinner inner frame
  block(out, -w, -w + t, -1, 1, 0, h, stone)
  block(out, w - t, w, -1, 1, 0, h, stone)
  block(out, -w, w, -1, 1, h - t, h, stone)
  block(out, -w + t, w - t, -0.6, 0.6, h - t - 0.8, h - t, shade(stone, 1.05))
  // the glazing inside it, set back, in the facade's square grid
  block(out, -w + t, w - t, 1.2, 1.6, 1.44, h - t, glass)
  for (let x = -w + t; x <= w - t + 0.01; x += (2 * w - 2 * t) / 6) block(out, x - 0.15, x + 0.15, 1, 1.3, 1.44, h - t, stone)
  for (let y = 1.44; y <= h - t + 0.01; y += (h - t - 1.44) / 7) block(out, -w + t, w - t, 1, 1.3, y - 0.15, y + 0.15, stone)
}
