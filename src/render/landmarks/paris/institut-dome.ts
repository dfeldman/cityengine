import type { MeshBuilder } from '../../buildings.ts'
import { box, prism, type Rgb } from '../../models.ts'
import { beam, block, hex, shade } from '../kit.ts'

const FIXED = 0

/**
 * The Institut de France's chapel front and dome (Le Vau, 1662), on the Quai de Conti facing the Louvre over
 * the Pont des Arts (PARIS_EXPAND §5 A, the Seine priority). The curved wings are OSM's (restyled classical);
 * this is the middle: the portico of Corinthian columns and its pediment to the quai, the drum ringed by
 * paired pilasters, the ribbed lead DOME with gilded ribs and garlands, and the lantern.
 *
 * Local frame: the front faces −z (north, to the river); the dome's centre at the origin.
 */
export function institutDome(out: MeshBuilder): void {
  const stone = hex('#e2d8c3')
  const deep = shade(stone, 0.84)
  const lead = hex('#5f6a70')
  const gold: Rgb = [0.84, 0.66, 0.26]
  // the portico standing out to the quai: four columns, the entablature, the pediment
  const pz = -20
  block(out, -11, 11, pz, pz + 12, 0, 17, stone)
  for (const x of [-7.5, -2.5, 2.5, 7.5]) {
    prism(out, x, pz - 1.6, 1.2, 14.6, 0.8, 12, stone, FIXED, 0.7)
    box(out, x, 14.9, pz - 1.6, 1.1, 0.3, 1.1, shade(stone, 1.04), FIXED)
  }
  block(out, -10, 10, pz - 2.6, pz, 0, 1.2, shade(stone, 0.92))
  // the shadowed wall behind the columns, so they stand out against it
  block(out, -9.2, 9.2, pz - 0.05, pz, 1.2, 15, [0.34, 0.33, 0.31])
  block(out, -10.4, 10.4, pz - 2.8, pz, 15.2, 17, shade(stone, 1.03))
  const UVQ: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  for (const z of [pz - 2.8, pz - 0.2]) out.quad([[-10.4, 17, z], [10.4, 17, z], [0, 21, z], [0, 21, z]], [0, 0, z < pz - 1 ? -1 : 1], UVQ, stone, FIXED)
  for (const sx of [-1, 1]) {
    out.quad([[sx * 10.8, 16.9, pz - 3.1], [0, 21.3, pz - 3.1], [0, 21.3, pz + 0.1], [sx * 10.8, 16.9, pz + 0.1]], [sx * 0.35, 0.94, 0], UVQ, shade(stone, 1.06), FIXED)
  }
  // the drum: a square base above the roofs, then the round drum with its paired pilasters and windows
  block(out, -10, 10, -10, 10, 17, 21, deep)
  prism(out, 0, 0, 21, 29, 8.4, 24, stone, FIXED)
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    for (const d of [-0.07, 0.07]) {
      prism(out, Math.sin(a + d) * 8.6, Math.cos(a + d) * 8.6, 21, 28.4, 0.32, 6, shade(stone, 1.04), FIXED)
    }
    const w = a + Math.PI / 12
    box(out, Math.sin(w) * 8.45, 25, Math.cos(w) * 8.45, 0.55, 1.6, 0.55, [0.25, 0.28, 0.31], FIXED)
  }
  prism(out, 0, 0, 29, 29.8, 8.9, 24, shade(stone, 1.05), FIXED)
  // the dome: lead, in bands, with gilded ribs over it
  const H = 11
  const bands = 7
  for (let b = 0; b < bands; b++) {
    const t0 = b / bands
    const t1 = (b + 1) / bands
    const r0 = 8.4 * Math.cos((t0 * Math.PI) / 2)
    const r1 = 8.4 * Math.cos((t1 * Math.PI) / 2)
    prism(out, 0, 0, 29.8 + Math.sin((t0 * Math.PI) / 2) * H, 29.8 + Math.sin((t1 * Math.PI) / 2) * H, Math.max(r0, 1.2), 24, lead, FIXED, Math.max(r1, 1.2))
  }
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    let prev: [number, number, number] | null = null
    for (let b = 0; b <= bands; b++) {
      const t = b / bands
      const r = Math.max(1.2, 8.4 * Math.cos((t * Math.PI) / 2)) + 0.08
      const p: [number, number, number] = [Math.sin(a) * r, 29.8 + Math.sin((t * Math.PI) / 2) * H, Math.cos(a) * r]
      if (prev) beam(out, prev, p, 0.14, gold)
      prev = p
    }
  }
  // the lantern and its finial
  prism(out, 0, 0, 40.6, 43.5, 1.3, 8, stone, FIXED, 1.1)
  prism(out, 0, 0, 43.5, 45, 1.3, 8, lead, FIXED, 0.2)
  prism(out, 0, 0, 45, 46.4, 0.12, 6, gold, FIXED, 0.02)
}
