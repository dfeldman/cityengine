/**
 * THE TWO WINGS OF THE 1937 PALAIS (Dondel, Aubert, Viard and Dastugue): the Palais de Tokyo west, the Musée d'Art Moderne de Paris east. Until Batch 4 OSM's own parts stood through them: west a restyle of many pieces, east a dozen ways at 28 and 32 m, red brick ones among them: flats, not a palace (2026-10-31, seen from the Seine). This draws each wing off OSM's whole
 * outline, walls of travertine with their tall narrow bays between plain piers, a plain attic, and the great skylit roofs that IGN's aerial has (48.8642 2.297, 0.26 m/px): long glazed lanterns in zinc frames over the galleries, three small round drums at the corners. In world metres: entry front 180, its point the wing's own origin; x east, z north. The court is tokyoParvis's. Colours linear: this stone wants to be darker than it is.
 */
import { MeshBuilder } from '../../../buildings.ts'
import { capPolygonWithHoles } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { hex, placed, prism, roof, type Rgb } from '../../kit.ts'
import { block } from '../batch2/tag.ts'
import { edgeAt } from '../../parts.ts'
import { MAM, TOKYO } from './rings.ts'

const STONE = hex('#b5ad99'), TRIM = hex('#c0b9a6'), DEEP = hex('#958e7c'), GLASS: Rgb = [0.1, 0.12, 0.14], ZINC = hex('#6f787c'), PANE = hex('#7f929b'), LEADS = hex('#7c7f7c')
const ash = surfaceTag('ashlar')
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

/** A long glazed lantern: a low gabled roof of panes on a zinc curb, its ribs and ridge in zinc, read from the aerial as a long pale stripe. Centre (cx, cz), length along bearing `b`. */
function lantern(out: MeshBuilder, cx: number, cz: number, L: number, W: number, b: number, y: number): void {
  const q = new MeshBuilder(), HL = L / 2, HW = W / 2
  block(q, -HW, HW, -HL, HL, y, y + 1.3, ZINC, surfaceTag('metal'))
  roof(q, -HW, HW, -HL, HL, y + 1.3, W * 0.2, HW, 0, PANE)
  for (let z = -HL; z <= HL + 0.01; z += 3.2) {
    for (const s of [-1, 1]) {
      const n: [number, number, number] = [s * 0.4, 1, 0]
      const P = (t: number, dz: number): [number, number, number] => [s * HW * (1 - t), y + 1.3 + (W * 0.2 * t) + 0.04, z + dz]
      q.quad([P(0, -0.09), P(0, 0.09), P(1, 0.09), P(1, -0.09)], n, UV, ZINC, 0)
    }
  }
  block(q, -0.14, 0.14, -HL, HL, y + 1.3 + W * 0.2 - 0.08, y + 1.3 + W * 0.2 + 0.1, ZINC, surfaceTag('metal'))
  const a = ((b - 180) * Math.PI) / 180
  placed(out, q, a, cx, cz)
}

function wing(out: MeshBuilder, flat: number[], ox: number, oz: number, top: number): void {
  const ring = Array.from({ length: flat.length / 2 }, (_, i) => ({ x: flat[2 * i] - ox, z: flat[2 * i + 1] - oz }))
  const area = ring.reduce((s, q, i) => { const r = ring[(i + 1) % ring.length]; return s + q.x * r.z - r.x * q.z }, 0)
  const r = area > 0 ? ring : [...ring].reverse()
  const CORN = top - 3.2
  for (let i = 0; i < r.length; i++) {
    const e = edgeAt(r, i), P = (u: number, y: number, d = 0): [number, number, number] => [e.a.x + e.tx * u + e.nx * d, y, e.a.z + e.tz * u + e.nz * d]
    const n: [number, number, number] = [e.nx, 0, e.nz]
    out.quad([P(0, 0), P(e.L, 0), P(e.L, top), P(0, top)], n, UV, STONE, ash)
    // the plinth, the cornice and the attic's plain band (all round, every edge, so a curve keeps its line)
    out.quad([P(0, 0, 0.1), P(e.L, 0, 0.1), P(e.L, 1.6, 0.1), P(0, 1.6, 0.1)], n, UV, DEEP, ash)
    out.quad([P(0, CORN, 0.35), P(e.L, CORN, 0.35), P(e.L, CORN + 0.6, 0.35), P(0, CORN + 0.6, 0.35)], n, UV, TRIM, ash)
    out.quad([P(0, CORN + 0.6, 0.35), P(e.L, CORN + 0.6, 0.35), P(e.L, CORN + 0.6, 0), P(0, CORN + 0.6, 0)], [0, 1, 0], UV, TRIM, 0)
    out.quad([P(0, top, 0.2), P(e.L, top, 0.2), P(e.L, top - 0.4, 0.2), P(0, top - 0.4, 0.2)], n, UV, TRIM, ash)
    if (e.L < 2.6) continue
    // the bays: tall windows from the plinth to the cornice, plain piers proud of the wall
    const nb = Math.max(1, Math.round(e.L / 3.9)), step = e.L / nb
    for (let j = 0; j < nb; j++) {
      const u = (j + 0.5) * step, w = Math.min(1.25, step * 0.34)
      out.quad([P(u - w, 2.4, 0.05), P(u + w, 2.4, 0.05), P(u + w, 5.6, 0.05), P(u - w, 5.6, 0.05)], n, UV, GLASS, 0)
      out.quad([P(u - w, 6.8, 0.05), P(u + w, 6.8, 0.05), P(u + w, CORN - 0.9, 0.05), P(u - w, CORN - 0.9, 0.05)], n, UV, GLASS, 0)
      // its mullions
      for (const k of [-0.34, 0.34]) out.quad([P(u + k * w * 1.4 - 0.05, 6.8, 0.09), P(u + k * w * 1.4 + 0.05, 6.8, 0.09), P(u + k * w * 1.4 + 0.05, CORN - 0.9, 0.09), P(u + k * w * 1.4 - 0.05, CORN - 0.9, 0.09)], n, UV, DEEP, 0)
      // the spandrel between the two tiers
      out.quad([P(u - w, 5.8, 0.03), P(u + w, 5.8, 0.03), P(u + w, 6.6, 0.03), P(u - w, 6.6, 0.03)], n, UV, DEEP, 0)
    }
    for (let j = 0; j <= nb; j++) {
      const u = j * step, hw = 0.42, d = 0.28
      out.quad([P(u - hw, 1.6, d), P(u + hw, 1.6, d), P(u + hw, CORN, d), P(u - hw, CORN, d)], n, UV, TRIM, ash)
      out.quad([P(u - hw, 1.6, 0), P(u - hw, 1.6, d), P(u - hw, CORN, d), P(u - hw, CORN, 0)], [-e.tx, 0, -e.tz], UV, DEEP, 0)
      out.quad([P(u + hw, 1.6, d), P(u + hw, 1.6, 0), P(u + hw, CORN, 0), P(u + hw, CORN, d)], [e.tx, 0, e.tz], UV, DEEP, 0)
    }
  }
  capPolygonWithHoles(out, [r], top, LEADS, 0)
}

/** The Palais de Tokyo, the west wing: outline way/79219351. World (−2595, 400). */
export function palaisTokyoWest(out: MeshBuilder, _fit: Fit): void {
  const ox = -2595, oz = 400, top = 25
  wing(out, TOKYO, ox, oz, top)
  const at = (px: number, py: number): [number, number] => [-2694.5 + px * 0.26 - ox, 541.9 - py * 0.26 - oz]
  const L = (px: number, py: number, len: number, w: number, b: number): void => { const [x, z] = at(px, py); lantern(out, x, z, len, w, b, top) }
  L(362, 450, 22, 9, 162); L(432, 620, 40, 13, 162); L(385, 545, 22, 9, 162)
  L(290, 450, 19, 7, 72); L(310, 540, 19, 7, 72); L(330, 610, 19, 7, 72); L(350, 680, 19, 7, 72); L(280, 345, 40, 9, 72)
  // the round drum at the Avenue Wilson corner
  const [dx, dz] = at(405, 333)
  prism(out, dx, dz, 0, top + 2.4, 4.3, 18, STONE, ash)
  prism(out, dx, dz, top + 2.4, top + 2.8, 4.6, 18, TRIM, ash)
  prism(out, dx, dz, top + 2.8, top + 3.4, 4.2, 18, ZINC, surfaceTag('metal'), 2.2)
}

/** The Musée d'Art Moderne, the east wing: outline way/79219308. World (−2505, 424). */
export function palaisTokyoEast(out: MeshBuilder, _fit: Fit): void {
  const ox = -2505, oz = 424, top = 25
  wing(out, MAM, ox, oz, top)
  const at = (px: number, py: number): [number, number] => [-2694.5 + px * 0.26 - ox, 541.9 - py * 0.26 - oz]
  const L = (px: number, py: number, len: number, w: number, b: number): void => { const [x, z] = at(px, py); lantern(out, x, z, len, w, b, top) }
  L(715, 470, 34, 10, 162); L(610, 385, 24, 9, 162); L(655, 375, 22, 9, 162); L(735, 350, 22, 13, 72); L(790, 480, 19, 7, 72); L(835, 545, 22, 7, 72); L(775, 562, 22, 9, 72)
  for (const [px, py, c] of [[580, 318, ZINC], [885, 540, hex('#4f7d70')]] as const) {
    const [dx, dz] = at(px, py)
    prism(out, dx, dz, 0, top + 2.4, 4.3, 18, STONE, ash)
    prism(out, dx, dz, top + 2.4, top + 2.8, 4.6, 18, TRIM, ash)
    prism(out, dx, dz, top + 2.8, top + 3.4, 4.2, 18, c, surfaceTag('metal'), 2.2)
  }
}
