import type { MeshBuilder } from '../../../buildings.ts'
import { box, prism, type Rgb } from '../../../models.ts'

const FIXED = 0

/**
 * The palm garden behind the Médiathèque Françoise-Sagan, in the old Enclos Saint-Lazare (owner, 2026-10-30, 48.875637
 * 2.353635: "on street view I see a tropical plants garden. wasn't expecting that"): a zigzag path between raised beds with
 * low concrete kerbs, ground cover and clipped shrubs, and windmill palms — their shaggy brown trunks and fans — over it.
 * Local frame: the garden about 34 × 24 m, the path running along x. Its plan is from the street-view photograph, not OSM,
 * which maps only a paved court here.
 */
export function enclosSaintLazare(out: MeshBuilder): void {
  const kerb: Rgb = [0.72, 0.7, 0.65]
  const cover: Rgb = [0.09, 0.2, 0.09]
  const shrub: Rgb = [0.1, 0.22, 0.11]
  // the beds either side of the path, each a run of kerbed boxes stepping in and out: the zigzag
  const beds: [number, number, number, number][] = [
    [-17, -8, -12, -2.5], [-8, 1, -12, -3.8], [1, 9, -12, -2.2], [9, 17, -12, -3.4],
    [-17, -9, 3, 12], [-9, -1, 1.8, 12], [-1, 8, 3.4, 12], [8, 17, 2, 12],
  ]
  for (const [x0, x1, z0, z1] of beds) {
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, hx = (x1 - x0) / 2, hz = (z1 - z0) / 2
    box(out, cx, 0.22, cz, hx, 0.22, hz, kerb, FIXED)                                   // the kerbed box
    box(out, cx, 0.47, cz, hx - 0.25, 0.04, hz - 0.25, cover, FIXED)                    // its ground cover
  }
  // clipped shrubs in the beds
  let h = 12345
  const r = (): number => { h = (Math.imul(h ^ (h >>> 13), 0x5bd1e995) + 0x9e3779b9) >>> 0; return h / 4294967296 }
  for (const [x0, x1, z0, z1] of beds) {
    for (let k = 0; k < 4; k++) {
      const x = x0 + 1 + r() * (x1 - x0 - 2), z = z0 + 1 + r() * (z1 - z0 - 2), s = 0.5 + r() * 0.6
      prism(out, x, z, 0.5, 0.5 + s * 1.3, s, 8, shrub, FIXED, s * 0.55)
    }
  }
  // the windmill palms
  const spots: [number, number, number][] = [[-14, -8, 5.2], [-9.5, 7, 6.4], [-4, -8.5, 4.2], [-3, 8.5, 6.8], [3, -7, 7.2], [5, 7.5, 4.6], [11, -8, 5.6], [13.5, 8, 6.2], [-12.5, 9.5, 3.8], [7.5, 9.5, 3.4], [14.5, -5.5, 3.2], [-15, -5, 3.4]]
  for (const [x, z, height] of spots) palm(out, x, z, height, r() * Math.PI * 2)
}

/** A windmill palm: a shaggy dark trunk under a skirt of dead fronds, and its fan leaves in a loose crown. */
function palm(out: MeshBuilder, x: number, z: number, height: number, spin: number): void {
  const trunk: Rgb = [0.24, 0.17, 0.11]
  const skirt: Rgb = [0.42, 0.31, 0.17]
  const leaf: Rgb = [0.09, 0.22, 0.09]
  const pale: Rgb = [0.12, 0.27, 0.11]
  prism(out, x, z, 0.4, height, 0.2, 7, trunk, FIXED, 0.15)
  prism(out, x, z, height - 0.9, height, 0.34, 7, skirt, FIXED, 0.2)
  const n = 17
  for (let i = 0; i < n; i++) {
    const a = spin + (i / n) * Math.PI * 2, up = i % 3 === 0 ? 0.5 : i % 3 === 1 ? 0.1 : -0.35, L = 1.7
    const dx = Math.cos(a), dz = Math.sin(a), px = -dz, pz = dx
    // a fan on its stem: the stem, then a wedge of blade opening out (both faces)
    const ex = x + dx * L * 0.5, ey = height + up * 0.5 + 0.15, ez = z + dz * L * 0.5
    const tip = (w: number, t: number): [number, number, number] => [ex + dx * L * t + px * w, ey + up * t * 0.9 - t * t * 0.45, ez + dz * L * t + pz * w]
    const c = i % 2 ? leaf : pale
    const stem: [number, number, number][] = [[x - px * 0.03, height, z - pz * 0.03], [x + px * 0.03, height, z + pz * 0.03], [ex + px * 0.03, ey, ez + pz * 0.03], [ex - px * 0.03, ey, ez - pz * 0.03]]
    out.quad(stem, [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], c, FIXED)
    for (const n1 of [1, -1]) {
      out.quad([[ex, ey, ez], tip(-0.4, 0.85), tip(0, 1), tip(0.4, 0.85)], [0, n1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], c, FIXED)
    }
  }
}
