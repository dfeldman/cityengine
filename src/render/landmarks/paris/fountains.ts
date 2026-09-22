import { MeshBuilder } from '../../buildings.ts'
import { box, prism, type Rgb } from '../../models.ts'
import { archedPane, block, hex, pane, pediment, placed, shade } from '../kit.ts'

const FIXED = 0

/**
 * The Fontaine des Innocents (Goujon and Lescot, 1549), in the square at Les Halles (PARIS_EXPAND §5 B): a
 * square Renaissance pavilion on a stepped base with water falling down its steps, each face an open arch
 * between paired Corinthian pilasters, a triangular pediment over each, a small dome of scales on top.
 *
 * Local frame: centred, faces ±x and ±z alike.
 */
export function fontaineInnocents(out: MeshBuilder): void {
  const stone = hex('#e3dac6')
  const water: Rgb = [0.4, 0.55, 0.62]
  // the stepped basin with its cascades, four tiers
  for (let i = 0; i < 4; i++) {
    const r = 9 - i * 1.4
    block(out, -r, r, -r, r, i * 0.55, (i + 1) * 0.55, shade(stone, 0.9 + i * 0.02))
    // a skin of water down each step's face
    for (const [x0, x1, z0, z1] of [[-r, r, -r - 0.02, -r], [-r, r, r, r + 0.02], [-r - 0.02, -r, -r, r], [r, r + 0.02, -r, r]]) {
      block(out, x0, x1, z0, z1, i * 0.55, (i + 1) * 0.55, water)
    }
  }
  const b0 = 2.2
  const w = 4.2
  // the pavilion: four corner piers, an arch between each pair, the entablature, the pediment on each face
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) block(out, sx * w - 1, sx * w + 1, sz * w - 1, sz * w + 1, b0, b0 + 9, stone)
  for (let k = 0; k < 4; k++) {
    const f = new MeshBuilder()
    // on a −z face at z = −w: the arch's reveal in shadow, paired pilasters, a relief of a nymph each side
    archedPane(f, -0.05, 0, b0, 6.4, 8.2, [0.34, 0.33, 0.31])
    for (const x of [-3.9, -3.4, 3.4, 3.9]) pane(f, '-z', -0.12, x, b0, 0.35, 8.5, shade(stone, 1.05), 0.02)
    block(f, -w - 1.1, w + 1.1, -1.2, 0.2, b0 + 9, b0 + 10.2, shade(stone, 1.03))
    pediment(f, -w - 1.1, w + 1.1, -1.2, b0 + 10.2, 2.4, 1.4, stone)
    placed(out, f, (k * Math.PI) / 2, Math.sin((k * Math.PI) / 2) * -w, Math.cos((k * Math.PI) / 2) * -w)
  }
  // the dome of scales, and its lantern
  prism(out, 0, 0, b0 + 10.2, b0 + 13.5, w + 0.5, 16, hex('#8a8f8c'), FIXED, 0.6)
  prism(out, 0, 0, b0 + 13.5, b0 + 14.6, 0.6, 8, stone, FIXED, 0.2)
}

/**
 * The Fontaine Saint-Michel (Davioud, 1860), closing the Place Saint-Michel: a triumphal arch as a wall
 * fountain — four red marble columns carrying bronze chimeras' plinths, the archangel slaying the devil in the
 * great niche, the dragons spouting into the basin below, the attic with its statues. Stands against the
 * building behind; the front faces −z.
 */
export function fontaineSaintMichel(out: MeshBuilder): void {
  const stone = hex('#e1d7c2')
  const red: Rgb = [0.58, 0.28, 0.24]
  const bronze: Rgb = [0.3, 0.34, 0.29]
  const water: Rgb = [0.4, 0.55, 0.62]
  // the basin and its stepped cascade
  block(out, -9, 9, -6, 0, 0, 0.6, shade(stone, 0.92))
  block(out, -8.5, 8.5, -5.5, -0.3, 0.55, 0.6, water)
  block(out, -5, 5, -2.8, 0, 0.6, 1.8, shade(stone, 0.95))
  block(out, -4.8, 4.8, -2.82, -2.8, 0.6, 1.8, water)
  // the back wall, the full height of the building, and the four red columns before it
  block(out, -8, 8, -0.8, 0, 0, 26, stone)
  for (const x of [-6.4, -4, 4, 6.4]) {
    prism(out, x, -1.6, 2, 15, 0.55, 12, red, FIXED, 0.5)
    box(out, x, 15.3, -1.6, 0.75, 0.3, 0.75, stone, FIXED)
    // a bronze chimera on the column's entablature
    box(out, x, 16.8, -1.6, 0.5, 0.8, 0.9, bronze, FIXED)
  }
  block(out, -8, 8, -2.4, 0, 15.6, 17.2, shade(stone, 1.03))
  // the niche: the arch in shadow and Saint Michael over the devil, in bronze
  const f = new MeshBuilder()
  archedPane(f, -0.85, 0, 2.2, 5.2, 12.2, [0.3, 0.29, 0.27])
  placed(out, f, 0, 0, 0)
  box(out, 0, 5.3, -1.4, 0.9, 1.2, 0.8, bronze, FIXED)
  prism(out, 0, -1.4, 6.5, 10.5, 0.6, 8, bronze, FIXED, 0.35)
  box(out, 0.9, 10.2, -1.4, 0.9, 0.12, 0.05, bronze, FIXED)                                  // the raised sword, and a wing
  box(out, -0.7, 9.6, -1.2, 0.1, 1.4, 0.6, bronze, FIXED)
  // the dragons spouting either side of the rock
  for (const x of [-3, 3]) box(out, x, 2.2, -2.3, 0.6, 0.45, 0.9, bronze, FIXED)
  // the attic and its four statues, the pediment
  block(out, -7.6, 7.6, -1.6, 0, 17.2, 22, stone)
  for (const x of [-6.4, -4, 4, 6.4]) prism(out, x, -1.9, 17.2, 20.3, 0.45, 8, shade(stone, 0.85), FIXED, 0.35)
  pediment(out, -8, 8, -1.8, 22, 3.4, 1.8, stone)
}

/**
 * The Flamme de la Liberté (1987), above the Alma tunnel: the full-size gilded flame of the Statue of Liberty's
 * torch on its plinth of black granite. Local frame: centred.
 */
export function flammeLiberte(out: MeshBuilder): void {
  const gold: Rgb = [0.9, 0.7, 0.28]
  const granite: Rgb = [0.16, 0.16, 0.17]
  block(out, -1.8, 1.8, -1.8, 1.8, 0, 3.2, granite)
  block(out, -1.95, 1.95, -1.95, 1.95, 3.2, 3.45, shade(granite, 1.3))
  // the torch's cup, and the flame: licks of gilt copper rising to a point
  prism(out, 0, 0, 3.45, 4.1, 0.35, 12, gold, FIXED, 0.7)
  prism(out, 0, 0, 4.1, 5.2, 0.7, 8, gold, FIXED, 0.55)
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2
    prism(out, Math.sin(a) * 0.3, Math.cos(a) * 0.3, 5, 6.3 + (i % 2) * 0.4, 0.28, 5, gold, FIXED, 0.03)
  }
  prism(out, 0, 0, 5.2, 7.3, 0.45, 6, gold, FIXED, 0.02)
}
