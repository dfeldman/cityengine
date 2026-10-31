import { MeshBuilder } from '../../buildings.ts'
import { prism } from '../../models.ts'
import { block, fourSides, hex, pane, pinnacle, pointedPane, shade } from '../kit.ts'

const FIXED = 0

/**
 * The Tour Saint-Jacques: the Flamboyant belfry of a church that is gone, standing alone in its square. A
 * white 10 m tower, a stepped buttress at each corner ending in a cluster of pinnacles above the balustrade,
 * tall lancets in three stages, the stair turret at one corner rising higher and Saint James on top of it.
 *
 * Batch 5 (2026-10-31): the square is the plan's now (tools/gardens/paris-batch5.ts), and the model's lawn, a 42 m plate of lime green round the foot, is gone: only the knoll's stone terrace is here, as the 1856 restoration left it, with the railing it has and Pascal's statue in the vault. And white stone in linear is white: darkened.
 */
export function tourSaintJacques(out: MeshBuilder): void {
  const stone = hex('#aaa18e')
  const shadow = hex('#14161b')
  const plinth = hex('#8f8775')
  const h = 46
  const w = 5
  // the knoll's terrace, its three steps and its iron railing
  block(out, -w - 3.4, w + 3.4, -w - 3.4, w + 3.4, 0, 0.35, plinth)
  block(out, -w - 2.6, w + 2.6, -w - 2.6, w + 2.6, 0.35, 0.7, shade(plinth, 1.06))
  block(out, -w - 2, w + 2, -w - 2, w + 2, 0.7, 1.1, shade(stone, 0.9))
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2
    const R = w + 2
    for (let t = -R; t < R; t += 1.6) {
      const c = Math.cos(a), si = Math.sin(a)
      prism(out, c * t - si * R, si * t + c * R, 1.1, 2.3, 0.03, 4, shadow, FIXED, 0.03, false)
    }
    const c = Math.cos(a), si = Math.sin(a)
    block(out, Math.min(c * -R - si * R, c * R - si * R) - 0.03, Math.max(c * -R - si * R, c * R - si * R) + 0.03, Math.min(si * -R + c * R, si * R + c * R) - 0.03, Math.max(si * -R + c * R, si * R + c * R) + 0.03, 2.2, 2.28, shadow)
  }
  // (no trees of its own: the city plants the square's — these were ten-sided lime lollipops among real planes)
  const y0 = 1.1
  // the shaft
  block(out, -w, w, -w, w, y0, h, stone)
  // one face's worth of Gothic, copied round: string courses, lancets in three stages, the belfry openings
  const face = new MeshBuilder()
  for (const y of [16, 29, 38]) block(face, -w - 0.25, w + 0.25, -w - 0.25, -w, y, y + 0.45, shade(stone, 1.04))
  for (const t of [-2.3, 2.3]) {
    pointedPane(face, -w, t, 4, 1.4, 9, shadow)                 // blind lancets below
    pointedPane(face, -w, t, 18, 1.3, 8.5, shadow)
  }
  pointedPane(face, -w, 0, 30.5, 5.6, 7, shade(stone, 0.9))    // the belfry's great opening, in its frame
  for (const t of [-1.4, 1.4]) pointedPane(face, -w - 0.03, t, 30.8, 2.3, 6.4, shadow)
  // the balustrade: a pierced parapet as a rail of small dark openings
  block(face, -w - 0.4, w + 0.4, -w - 0.4, -w + 0.3, h, h + 1.3, stone)
  for (let t = -w + 0.8; t < w - 0.5; t += 1.1) pane(face, '-z', -w - 0.4, t, h + 0.25, 0.55, 0.8, shadow, 0.03)
  fourSides(out, face)
  // the corner buttresses: set diagonally, stepping in three times, each ending in a cluster of pinnacles
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const stages: [number, number, number][] = [[y0, 16, 1.5], [16, 29, 1.25], [29, h, 1.0]]
      for (const [a, b, r] of stages) {
        const cx = sx * (w + r * 0.35)
        const cz = sz * (w + r * 0.35)
        block(out, cx - r, cx + r, cz - r, cz + r, a, b, stone)
        block(out, cx - r - 0.15, cx + r + 0.15, cz - r - 0.15, cz + r + 0.15, b - 0.4, b, shade(stone, 1.04))
      }
      const cx = sx * (w + 0.35)
      const cz = sz * (w + 0.35)
      pinnacle(out, cx, cz, h, 7.5, 1.3, stone)
      for (const [dx, dz] of [[-0.9, 0], [0.9, 0], [0, -0.9], [0, 0.9]]) pinnacle(out, cx + dx, cz + dz, h + 0.8, 4.2, 0.6, stone)
    }
  }
  // the stair turret at one corner, climbing past the parapet, and Saint James standing on it
  const tx = w - 1.2
  const tz = -w + 1.2
  prism(out, tx, tz, h - 6, h + 3.4, 1.9, 8, stone)
  prism(out, tx, tz, h + 3.4, h + 3.9, 2.2, 8, shade(stone, 1.04))
  prism(out, tx, tz, h + 3.9, h + 4.6, 0.9, 8, stone, FIXED, 0.7)      // the pedestal
  prism(out, tx, tz, h + 4.6, h + 7.3, 0.45, 8, stone, FIXED, 0.3)     // the saint
  prism(out, tx, tz, h + 7.3, h + 7.9, 0.28, 8, stone)                 // his head
  prism(out, tx + 0.5, tz, h + 4.6, h + 7.8, 0.06, 4, shade(stone, 0.8)) // his pilgrim's staff
  // Pascal, seated (Cavelier, 1857; OSM's node), a pale mass in the dark of the south face's foot
  pointedPane(out, -w - 0.02, 0, 1.1, 3.4, 5.4, shadow)
  block(out, -0.8, 0.8, -w - 1, -w - 0.1, 1.1, 2, shade(stone, 1.05))
  prism(out, 0, -w - 0.55, 2, 3.5, 0.5, 8, shade(stone, 1.1), FIXED, 0.28, false)
  prism(out, 0, -w - 0.55, 3.5, 3.95, 0.17, 8, shade(stone, 1.1), FIXED, 0.13, false)
}
