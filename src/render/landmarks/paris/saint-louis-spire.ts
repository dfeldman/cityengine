import type { MeshBuilder } from '../../buildings.ts'
import { box, prism } from '../../models.ts'
import { beam, block, hex, shade } from '../kit.ts'

const FIXED = 0

/**
 * Saint-Louis-en-l'Île's two signatures: the slender openwork iron spire (1765), an obelisk pierced right
 * through so the sky shows in it, rising from the church's roof; and the great clock on its iron bracket
 * hanging out over the Rue Saint-Louis-en-l'Île. The church itself is OSM's own massing. Model origin is on
 * the roof (the manifest lifts it); the street is to −z.
 */
export function saintLouisSpire(out: MeshBuilder): void {
  const iron = hex('#55595c')
  const stone = hex('#d8cfbc')
  const gold = hex('#c9a646')
  // a square stone base on the roof
  block(out, -1.6, 1.6, -1.6, 1.6, 0, 3, stone)
  block(out, -1.8, 1.8, -1.8, 1.8, 3, 3.4, shade(stone, 1.05))
  // the pierced obelisk: four slim tapering corner posts and rings every 3 m, the sky through the middle
  const H = 17
  const w = (y: number): number => 1.1 * (1 - y / (H + 1.5))
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    beam(out, [sx * w(0), 3.4, sz * w(0)], [sx * w(H), 3.4 + H, sz * w(H)], 0.08, iron)
  }
  for (let y = 2.4; y < H; y += 2.4) {
    const r = w(y)
    for (const [a, b] of [[[-r, -r], [r, -r]], [[r, -r], [r, r]], [[r, r], [-r, r]], [[-r, r], [-r, -r]]] as const) {
      beam(out, [a[0], 3.4 + y, a[1]], [b[0], 3.4 + y, b[1]], 0.04, iron)
    }
    // the X in each panel, which is what makes it read as openwork at a distance
    beam(out, [-r, 3.4 + y - 2.4, -r], [r, 3.4 + y, -r], 0.03, iron)
    beam(out, [r, 3.4 + y - 2.4, -r], [-r, 3.4 + y, -r], 0.03, iron)
  }
  prism(out, 0, 0, 3.4 + H, 3.4 + H + 2, 0.12, 6, iron, FIXED, 0.03)
  prism(out, 0, 0, 3.4 + H + 2, 3.4 + H + 2.4, 0.18, 8, gold)
  // the clock: a big round face on an iron bracket out over the street, both faces, 14 m below the roofline — about 10 m up
  const y = -14
  const zc = -9
  beam(out, [0, y + 1.4, -1], [0, y + 1.4, zc + 0.3], 0.12, iron)
  beam(out, [0, y - 1.2, -1], [0, y + 1.1, zc + 0.6], 0.08, iron)
  prism(out, 0, zc, y - 1.1, y + 1.1, 0.05, 4, iron)
  for (const s of [-1, 1]) {
    // the face, one each way: the clock hangs out across the pavement, so it is read from up and down the street (±x)
    for (let i = 0; i < 20; i += 2) {
      const at = (k: number): [number, number, number] => [s * 0.16, y + Math.sin((k / 20) * Math.PI * 2) * 1.05, zc + Math.cos((k / 20) * Math.PI * 2) * 1.05]
      out.quad([[s * 0.16, y, zc], at(i), at(i + 1), at(i + 2)], [s, 0, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], hex('#f2eee4'), FIXED)
    }
    box(out, s * 0.18, y + 0.4, zc, 0.01, 0.45, 0.04, iron, FIXED)
    box(out, s * 0.18, y, zc + 0.3, 0.01, 0.04, 0.32, iron, FIXED)
  }
  // the case: a dark ring round both faces
  for (let i = 0; i < 20; i++) {
    const a0 = (i / 20) * Math.PI * 2
    const a1 = ((i + 1) / 20) * Math.PI * 2
    beam(out, [0, y + Math.sin(a0) * 1.12, zc + Math.cos(a0) * 1.12], [0, y + Math.sin(a1) * 1.12, zc + Math.cos(a1) * 1.12], 0.1, iron, 0.2)
  }
}
