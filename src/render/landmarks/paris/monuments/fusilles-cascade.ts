import type { MeshBuilder } from '../../../buildings.ts'
import { prism } from '../../../models.ts'
import { block, hex, shade, type Rgb } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { fitted } from '../palaces/common.ts'

/*
 * THE MONUMENT AUX FUSILLÉS DE LA CASCADE (Bois de Boulogne, chemin des Réservoirs by the Grande Cascade; Wikidata Q3091182;
 * the 16 young Resistance men shot here 16 August 1944): a squat round stone stele with two crosses and the names cut in the
 * face, on a shallow conical slab, in a ring of green wire-mesh fence with two shallow flower bowls on stands either side.
 * Frame: the stele at the origin, −z the carved front (toward the track). Stele ~2.4 m x 0.9 m across, fence radius ~3.4 m,
 * bowls ~1.1 m wide: all scaled by eye off Commons photographs (Paris 16e 1/2, 13 Nov 2011), not surveyed.
 * No sculpture: no Modly piece (the crosses are shallow relief, drawn as raised bars).
 */
export const HX = 5
export const HZ = 5

// tunables
const STELE_R = 0.46         // radius of the drum
const STELE_H = 2.4
const STELE_Y = 0.52        // top of the slab it stands on
const SLAB_R = 2.3           // the slab's foot radius
const FENCE_R = 3.4
const FENCE_H = 0.95
const POSTS = 48
const GAP = 0.34             // the gap left in the ring at the front (rad half-width)
const BOWL_R = 0.62
const BOWL_Y = 0.55          // bowl rim height
const GRAVEL_R = 5.0
const GRAVEL_Y = 0.4        // top of the gravel court (the ground under a model is not flat)

const STONE: Rgb = hex('#c4c0b2')
const SLAB: Rgb = hex('#aaa699')
const CUT: Rgb = hex('#85816f')
const GRAVEL: Rgb = hex('#b4a98e')
const GREEN: Rgb = hex('#2f5a3c')
const MESH: Rgb = hex('#6a7a6c')
const BOWLC: Rgb = hex('#8a6a58')
const SOIL: Rgb = hex('#4a3a2c')
const FLOWERS: Rgb[] = [hex('#c8403c'), hex('#e6e0e6'), hex('#b45a9c'), hex('#d9a53a')]

function draw(q: MeshBuilder): void {
  // gravel court and the slab
  prism(q, 0, 0, 0, GRAVEL_Y, GRAVEL_R, 32, GRAVEL, undefined, GRAVEL_R * 0.98, true)
  prism(q, 0, 0, GRAVEL_Y, STELE_Y, SLAB_R, 32, SLAB, undefined, STELE_R * 1.5, true)
  // the stele: foot ring, drum, a moulded cap
  prism(q, 0, 0, STELE_Y, STELE_Y + 0.14, STELE_R * 1.1, 20, shade(STONE, 0.93), undefined, STELE_R * 1.1, true)
  prism(q, 0, 0, STELE_Y + 0.14, STELE_Y + STELE_H, STELE_R, 20, STONE, undefined, STELE_R * 0.97, true)
  prism(q, 0, 0, STELE_Y + STELE_H, STELE_Y + STELE_H + 0.07, STELE_R * 1.04, 20, shade(STONE, 1.05), undefined, STELE_R * 1.04, true)
  // two crosses and the lists of names cut in the front (−z), as raised bars on the curve
  const zf = -STELE_R * 0.97
  const y0 = STELE_Y + 0.9
  for (const cx of [-0.14, 0.14]) {
    block(q, cx - 0.025, cx + 0.025, zf - 0.025, zf, y0, y0 + 0.95, CUT)
    block(q, cx - 0.14, cx + 0.14, zf - 0.025, zf, y0 + 0.55, y0 + 0.6, CUT)
  }
  for (const sx of [-1, 1]) block(q, sx * 0.3 - 0.05, sx * 0.3 + 0.05, zf - 0.02, zf, STELE_Y + 0.5, STELE_Y + 1.9, shade(CUT, 1.1))
  // the fence: posts, top and mid rails, wire mesh as a dark band; open at the front
  const ang = (i: number) => Math.PI + GAP + (i / POSTS) * (Math.PI * 2 - GAP * 2) // from just after −z round to just before
  const P = (a: number): [number, number] => [Math.sin(a) * FENCE_R, Math.cos(a) * FENCE_R]
  for (let i = 0; i <= POSTS; i++) {
    const [x, z] = P(ang(i))
    prism(q, x, z, 0, FENCE_H, 0.035, 5, GREEN, undefined, 0.035, true)
    if (i < POSTS) {
      const [x2, z2] = P(ang(i + 1))
      const mx = (x + x2) / 2, mz = (z + z2) / 2, len = Math.hypot(x2 - x, z2 - z), th = Math.atan2(x2 - x, z2 - z)
      const ax = Math.abs(Math.cos(th)), az = Math.abs(Math.sin(th))
      const hx = (len / 2) * az + 0.02, hz = (len / 2) * ax + 0.02
      block(q, mx - hx, mx + hx, mz - hz, mz + hz, FENCE_H - 0.04, FENCE_H, GREEN)
      block(q, mx - hx, mx + hx, mz - hz, mz + hz, 0.12, 0.16, GREEN)
      block(q, mx - hx + 0.01, mx + hx - 0.01, mz - hz + 0.01, mz + hz - 0.01, 0.18, FENCE_H - 0.06, MESH)
    }
  }
  // the two flower bowls on stands, either side of the stele (x = ±)
  for (const sx of [-1, 1]) {
    const x = sx * 2.3, z = 0.3
    prism(q, x, z, GRAVEL_Y, BOWL_Y - 0.3, 0.12, 8, shade(SLAB, 0.95), undefined, 0.12, true)
    prism(q, x, z, BOWL_Y - 0.32, BOWL_Y, BOWL_R * 0.55, 14, BOWLC, undefined, BOWL_R, true)
    prism(q, x, z, BOWL_Y, BOWL_Y + 0.04, BOWL_R * 1.02, 14, shade(BOWLC, 1.1), undefined, BOWL_R * 1.02, true)
    prism(q, x, z, BOWL_Y + 0.01, BOWL_Y + 0.07, BOWL_R * 0.88, 14, SOIL, undefined, BOWL_R * 0.88, true)
    for (let i = 0; i < 9; i++) {
      const a = i * 2.4, r = (0.15 + (i % 3) * 0.17) * BOWL_R * 1.2
      prism(q, x + Math.cos(a) * r, z + Math.sin(a) * r, BOWL_Y + 0.05, BOWL_Y + 0.2 + (i % 2) * 0.06, 0.1, 6, FLOWERS[(i + (sx > 0 ? 1 : 0)) % 4], undefined, 0.12, true)
    }
  }
}

export function fusillesCascade(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
