import type { MeshBuilder } from '../../buildings.ts'
import { box, prism, type Rgb } from '../../models.ts'

const FIXED = 0

/**
 * The Eiffel Tower, for the skyline — it is five kilometres away and is only ever seen from there, so this
 * is a silhouette: four legs following the tower's own taper, braced every 12 m, the first-floor arches, three
 * platforms and the spire. About three thousand triangles.
 */
export function eiffelTower(out: MeshBuilder): void {
  const iron: Rgb = [0.42, 0.33, 0.24]
  const w = (y: number): number => 125 * Math.pow(Math.max(0, 1 - y / 330), 1.8) / 2   // half-width
  const leg = (y: number): number => Math.max(1.5, w(y) * 0.22)                         // leg thickness
  for (let y = 0; y < 276; y += 12) {
    const y1 = Math.min(276, y + 12)
    const h0 = w(y)
    const h1 = w(y1)
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        // a leg segment as a box between the two heights, leaning in
        const cx = sx * (h0 + h1) / 2 - sx * leg(y) / 2
        const cz = sz * (h0 + h1) / 2 - sz * leg(y) / 2
        box(out, cx, (y + y1) / 2, cz, leg(y) / 2, (y1 - y) / 2, leg(y) / 2, iron, FIXED)
      }
    }
    // cross braces on each face, above the arches
    if (y >= 57) {
      const hw = (h0 + h1) / 2
      for (const s of [-1, 1]) {
        box(out, 0, y1, s * hw, hw, 0.6, 0.4, iron, FIXED)
        box(out, s * hw, y1, 0, 0.4, 0.6, hw, iron, FIXED)
      }
    }
  }
  // the arches between the legs under the first floor
  for (let k = 0; k < 9; k++) {
    const a = (k / 8) * Math.PI
    const hw = w(40)
    for (const s of [-1, 1]) {
      box(out, Math.cos(a) * hw * 0.8, 38 + Math.sin(a) * 16, s * w(45), 3, 1, 0.8, iron, FIXED)
      box(out, s * w(45), 38 + Math.sin(a) * 16, Math.cos(a) * hw * 0.8, 0.8, 1, 3, iron, FIXED)
    }
  }
  for (const [y, s] of [[57, 1.08], [115, 1.1], [276, 1.6]] as const) {
    box(out, 0, y, 0, w(y) * s, 2.5, w(y) * s, iron, FIXED)                 // the platforms
  }
  prism(out, 0, 0, 276, 312, 3.2, 8, iron, FIXED, 1.2)                          // the top
  prism(out, 0, 0, 312, 330, 0.6, 6, [0.8, 0.8, 0.8], FIXED, 0.2)               // the antenna
}

/** Tour Montparnasse: a 210 m dark curtain-wall slab, gently convex. */
