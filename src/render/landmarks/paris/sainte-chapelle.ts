import { MeshBuilder } from '../../buildings.ts'
import { box, prism, type Rgb } from '../../models.ts'
import { beam, block, hex, pinnacle, placed, pointedPane, shade } from '../kit.ts'
import type { Fit } from '../fit.ts'

const FIXED = 0

/**
 * The Sainte-Chapelle (1248) in the courtyard of the Palais de Justice (PARIS_EXPAND §5 A). It was a 75 m
 * grey block (OSM gives the spire's height to the whole building). The gist:
 *
 * - a tall narrow Gothic chapel whose walls are nearly all GLASS: fifteen-metre lancets in every bay between
 *   slender buttresses crowned with pinnacles, and a polygonal apse of the same glass;
 * - the very steep lead roof with a gilded cresting along its ridge, and the slender lead SPIRE over the middle
 *   of the roof, gilded at its foot;
 * - the west front: the two-storey porch, the great flamboyant ROSE, the gable, and a turret with its own
 *   spirelet at each corner.
 *
 * Local frame: along z, the west front at −z; about 36 × 17 m.
 */
export function sainteChapelle(out: MeshBuilder, fit: Fit): void {
  const stone = hex('#ddd3bd')
  const deep = shade(stone, 0.82)
  const glass: Rgb = [0.22, 0.2, 0.38]
  const lead = hex('#6f7b83')
  const gold: Rgb = [0.84, 0.66, 0.26]
  const L = Math.min(Math.max(fit.hz, 16), 20)
  const W = Math.min(Math.max(fit.hx, 7.5), 9)
  const zf = -L
  const zApse = L - W
  const eaves = 30
  const bays = 4

  // ---- the chapel's body: a low lower chapel, then the glass upper chapel between buttresses
  block(out, -W, W, zf + 3, zApse, 0, 9, stone)
  block(out, -W - 0.2, W + 0.2, zf + 3, zApse, 9, 10, deep)
  const bayLen = (zApse - (zf + 3)) / bays
  for (const sx of [-1, 1]) {
    // the side wall above the lower chapel: slim piers and tall glass, drawn on a −z face then turned to face out
    const side = new MeshBuilder()
    for (let b = 0; b < bays; b++) {
      // on the −x side the quarter turn maps local x to world −z, so the positions are negated there
      const t = sx * ((zf + 3) + (b + 0.5) * bayLen)
      pointedPane(side, -0.05, t, 10.5, bayLen - 1.2, eaves - 12, deep)
      pointedPane(side, -0.08, t, 11, bayLen - 1.8, eaves - 13, glass)
    }
    block(out, sx > 0 ? W - 0.6 : -W, sx > 0 ? W : -W + 0.6, zf + 3, zApse, 10, eaves, stone)
    // turned: the pane's t runs along −z's x; a turn of ±π/2 lays it along z on the ±x side
    placed(out, side, sx > 0 ? -Math.PI / 2 : Math.PI / 2, sx * W, 0)
    // the buttresses and their pinnacles
    for (let b = 0; b <= bays; b++) {
      const z = (zf + 3) + b * bayLen
      block(out, sx * W - (sx > 0 ? 0 : 1.6), sx * W + (sx > 0 ? 1.6 : 0), z - 0.6, z + 0.6, 0, eaves - 1, stone)
      pinnacle(out, sx * (W + 0.8), z, eaves - 1, 5.5, 1.0, stone)
    }
  }
  // the parapet along the eaves
  block(out, -W - 0.3, W + 0.3, zf + 3, zApse, eaves, eaves + 0.9, shade(stone, 1.03))

  // ---- the apse: seven facets of glass round the east end, each between buttresses
  const facets = 7
  for (let i = 0; i < facets; i++) {
    const a0 = -Math.PI / 2 + (i / facets) * Math.PI
    const a1 = -Math.PI / 2 + ((i + 1) / facets) * Math.PI
    const am = (a0 + a1) / 2
    const x0 = Math.sin(a0) * W
    const z0 = zApse + Math.cos(a0) * W
    const x1 = Math.sin(a1) * W
    const z1 = zApse + Math.cos(a1) * W
    const nx = Math.sin(am)
    const nz = Math.cos(am)
    out.quad([[x0, 0, z0], [x1, 0, z1], [x1, eaves, z1], [x0, eaves, z0]], [nx, 0, nz], [[0, 0], [1, 0], [1, 1], [0, 1]], stone, FIXED)
    const w = new MeshBuilder()
    pointedPane(w, -0.1, 0, 10.5, Math.hypot(x1 - x0, z1 - z0) - 1.2, eaves - 12, glass)
    const r = W * Math.cos(Math.PI / (2 * facets))
    placed(out, w, am + Math.PI, nx * r, zApse + nz * r)
    const bx = Math.sin(a1) * (W + 0.8)
    const bz = zApse + Math.cos(a1) * (W + 0.8)
    if (i < facets - 1) {
      box(out, bx, (eaves - 1) / 2, bz, 0.6, (eaves - 1) / 2, 0.6, stone, FIXED)
      pinnacle(out, bx, bz, eaves - 1, 5.5, 1.0, stone)
    }
  }
  prism(out, 0, zApse, eaves, eaves + 0.9, W + 0.3, facets * 2, shade(stone, 1.03), FIXED)

  // ---- the roof: very steep, lead, with a gilded cresting along the ridge, hipped round the apse
  const ridge = eaves + 13
  for (const sx of [-1, 1]) {
    out.quad([[sx * W, eaves + 0.9, zf + 3], [sx * W, eaves + 0.9, zApse], [0, ridge, zApse], [0, ridge, zf + 3]],
      [sx * 0.85, 0.53, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], lead, FIXED)
  }
  prism(out, 0, zApse, eaves + 0.9, ridge, W, facets * 2, lead, FIXED, 0.05)
  for (let z = zf + 3.4; z < zApse; z += 0.8) box(out, 0, ridge + 0.35, z, 0.05, 0.35, 0.05, gold, FIXED)
  block(out, -0.08, 0.08, zf + 3, zApse, ridge - 0.05, ridge + 0.1, gold)

  // ---- the spire over the middle of the roof: an open lead lantern, then the slender needle
  const zs = (zf + 3 + zApse) / 2 + 2
  prism(out, 0, zs, ridge - 3, ridge + 3, 1.9, 8, lead, FIXED, 1.6)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    prism(out, Math.sin(a) * 1.7, zs + Math.cos(a) * 1.7, ridge + 3, ridge + 7, 0.25, 4, lead, FIXED, 0.03)
  }
  prism(out, 0, zs, ridge + 3, ridge + 4, 1.6, 8, gold, FIXED, 1.5)
  prism(out, 0, zs, ridge + 4, 75, 1.5, 8, lead, FIXED, 0.05)
  prism(out, 0, zs, 74, 75.5, 0.12, 4, gold, FIXED, 0.02)

  // ---- the west front: the porch, the rose, the gable, the corner turrets
  const f = new MeshBuilder()
  // the porch, two storeys of arches, projecting
  block(f, -W + 0.8, W - 0.8, -3, 0, 0, 16, stone)
  block(f, -W + 0.6, W - 0.6, -3.3, 0, 16, 17, deep)
  for (const x of [-4, 0, 4]) {
    pointedPane(f, -3.05, x, 0.4, 3, 7.5, deep)
    pointedPane(f, -3.05, x, 9, 3, 6.5, deep)
  }
  // the rose, in its square, with its flamboyant ring
  block(f, -W, W, -0.2, 0, 17, eaves + 0.9, stone)
  const rose = 5.4
  // its moulded surround: a flat ring on the face
  for (let i = 0; i < 24; i++) {
    const a0 = (i / 24) * Math.PI * 2
    const a1 = ((i + 1) / 24) * Math.PI * 2
    const cy = 23.5
    const R0 = rose
    const R1 = rose + 0.7
    f.quad([[Math.cos(a0) * R1, cy + Math.sin(a0) * R1, -0.3], [Math.cos(a0) * R0, cy + Math.sin(a0) * R0, -0.3],
      [Math.cos(a1) * R0, cy + Math.sin(a1) * R0, -0.3], [Math.cos(a1) * R1, cy + Math.sin(a1) * R1, -0.3]], [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]], deep, FIXED)
  }
  // the rose's glass: a disc of facets, and its tracery as spokes
  for (let i = 0; i < 24; i++) {
    const a0 = (i / 24) * Math.PI * 2
    const a1 = ((i + 1) / 24) * Math.PI * 2
    const cy = 23.5
    f.quad([[Math.cos(a0) * rose, cy + Math.sin(a0) * rose, -0.4], [0, cy, -0.4], [0, cy, -0.4], [Math.cos(a1) * rose, cy + Math.sin(a1) * rose, -0.4]],
      [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]], glass, FIXED)
    // the tracery: a spoke on every other facet, and a ring at half the radius
    if (i % 2 === 0) beam(f, [Math.cos(a0) * 0.9, cy + Math.sin(a0) * 0.9, -0.45], [Math.cos(a0) * rose, cy + Math.sin(a0) * rose, -0.45], 0.07, stone)
    beam(f, [Math.cos(a0) * rose * 0.5, cy + Math.sin(a0) * rose * 0.5, -0.45], [Math.cos(a1) * rose * 0.5, cy + Math.sin(a1) * rose * 0.5, -0.45], 0.07, stone)
    beam(f, [Math.cos(a0) * 0.9, cy + Math.sin(a0) * 0.9, -0.45], [Math.cos(a1) * 0.9, cy + Math.sin(a1) * 0.9, -0.45], 0.08, stone)
  }
  // the gable over it, with a little rose, and the balustrade at its foot
  for (let y = 0; y < 12; y++) {
    const w = W * (1 - y / 12)
    block(f, -w, w, -0.2, 0, eaves + 0.9 + y, eaves + 1.9 + y, stone)
  }
  prism(f, 0, -0.3, eaves + 3.5, eaves + 6.5, 1.5, 12, glass, FIXED)
  // the two turrets at the front corners, with their crocketed spirelets
  for (const sx of [-1, 1]) {
    prism(f, sx * (W - 0.4), -0.6, 0, eaves + 3, 1.3, 8, stone, FIXED)
    prism(f, sx * (W - 0.4), -0.6, eaves + 3, eaves + 4, 1.45, 8, deep, FIXED)
    prism(f, sx * (W - 0.4), -0.6, eaves + 4, eaves + 12, 1.3, 8, stone, FIXED, 0.05)
  }
  placed(out, f, 0, 0, zf + 3)
}
