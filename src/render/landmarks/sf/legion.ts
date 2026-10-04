/**
 * THE CALIFORNIA PALACE OF THE LEGION OF HONOR (George Applegarth, 1924; relation/21115818): a three-quarter copy
 * of the Palais de la Légion d'Honneur in Paris, white on the cliff in Lincoln Park. Found in the appearance audit
 * (2026-10-02) with no manifest entry at all — a generic block in the trees.
 *
 * The gist, in the order a visitor meets it: a screen of Ionic columns across the front with a TRIUMPHAL ARCH in
 * the middle; the COURT OF HONOR inside, paved, with The Thinker on his plinth; two colonnaded wings down its
 * sides; and across the back the museum itself, a hexastyle Ionic portico under a pediment, a low dome behind.
 *
 * Placed standalone (public/landmarks/san-francisco/parks.json) on OSM's outline: 94 x 60 m, model x along the
 * 94 m front, +z the entrance side (south-east).
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import type { Rgb } from '../../models.ts'
import { box } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { colonnade, cupola } from '../parts.ts'
import { pediment } from '../kit.ts'

const STONE: Rgb = [0.88, 0.86, 0.80]
const SHADE: Rgb = [0.78, 0.76, 0.70]
const ROOF: Rgb = [0.52, 0.52, 0.50]
const PAVING: Rgb = [0.72, 0.70, 0.64]
const BRONZE: Rgb = [0.20, 0.17, 0.14]

export function legionOfHonor(out: MeshBuilder, _fit: Fit): void {
  const stone = surfaceTag('ashlar')
  const W = 47        // half the front
  const D = 30        // half the depth
  const back = 22     // the museum block's depth
  const wing = 13     // the wings' width
  const H = 15

  // the court, paved, and The Thinker on his plinth in the middle of it
  box(out, 0, 0.15, 6, W - wing, 0.15, D - back / 2 + 2, PAVING, surfaceTag('concrete'))
  // (and the same court handed to the city as paved GROUND, draped: the park's slope rose through the slab, 2026-10-04)
  out.grounds.push([{ x: -(W - wing), z: 6 - (D - back / 2 + 2) }, { x: W - wing, z: 6 - (D - back / 2 + 2) }, { x: W - wing, z: 6 + (D - back / 2 + 2) }, { x: -(W - wing), z: 6 + (D - back / 2 + 2) }])
  box(out, 0, 1.2, 8, 1.4, 1.2, 1.4, STONE, stone)
  box(out, 0, 3.2, 8, 0.6, 0.8, 0.5, BRONZE, surfaceTag('metal'))

  // the museum across the back, its roof, and the portico and dome on its court face
  const zb = -D + back / 2
  box(out, 0, H / 2, zb, W, H / 2, back / 2, STONE, stone)
  box(out, 0, H + 0.6, zb, W + 0.4, 0.6, back / 2 + 0.4, SHADE, stone)
  box(out, 0, H + 1.6, zb, W - 2, 0.4, back / 2 - 2, ROOF, surfaceTag('concrete'))
  const zp = -D + back
  colonnade(out, { x: -10, z: zp + 4 }, { x: 10, z: zp + 4 }, 0.6, 13, 6, { order: 'ionic', colour: STONE, entablature: 1.6, radius: 0.7 })
  box(out, 0, 0.3, zp + 2.5, 11.5, 0.3, 3.5, STONE, stone)
  pediment(out, -11, 11, zp + 4.6, 15.2, 4.2, 6.2, STONE)
  cupola(out, { x: 0, z: zb }, H + 2, 9, { drum: 3, dome: 6, colour: STONE, domeColour: [0.70, 0.72, 0.70], domeMaterial: 'concrete', lantern: false })

  // the two wings down the court, colonnaded on the court side
  for (const s of [-1, 1]) {
    const x = s * (W - wing / 2)
    const z0 = zp, z1 = D - 3
    box(out, x, (H - 3) / 2, (z0 + z1) / 2, wing / 2, (H - 3) / 2, (z1 - z0) / 2, STONE, stone)
    box(out, x, H - 2.6, (z0 + z1) / 2, wing / 2 + 0.3, 0.4, (z1 - z0) / 2 + 0.3, SHADE, stone)
    colonnade(out, { x: x - s * (wing / 2 + 2.5), z: z0 + 3 }, { x: x - s * (wing / 2 + 2.5), z: z1 - 3 }, 0, 9, 9, { order: 'ionic', colour: STONE, entablature: 1.2, radius: 0.45 })
  }

  // the screen across the front: Ionic columns either side of the triumphal arch
  const zf = D - 1.5
  for (const s of [-1, 1]) {
    colonnade(out, { x: s * 9, z: zf }, { x: s * (W - wing - 1), z: zf }, 0, 9, 8, { order: 'ionic', colour: STONE, entablature: 1.2, radius: 0.45 })
  }
  // the arch: two piers, the attic over them, the opening between
  for (const s of [-1, 1]) box(out, s * 6.5, 7.5, zf, 2.5, 7.5, 2.2, STONE, stone)
  box(out, 0, 13.5, zf, 9, 1.5, 2.2, STONE, stone)
  box(out, 0, 15.8, zf, 8, 0.8, 2.0, SHADE, stone)
}

/**
 * The GLASS PYRAMID skylight in the Court of Honor (way/393275341, `tourism=artwork`, over the galleries dug under the
 * court in 1995): OSM's little glass building was drawn as a Victorian cottage with a hipped roof. A low glass pyramid
 * on a stone curb, its ridges in dark metal.
 */
export function legionPyramid(out: MeshBuilder, fit: Fit): void {
  const h = Math.max(2.4, Math.min(fit.hx, fit.hz)), y0 = 0.5, y1 = y0 + h * 0.75
  box(out, 0, 0.25, 0, h + 0.3, 0.25, h + 0.3, STONE, surfaceTag('ashlar'))
  const k: [number, number][] = [[-1, -1], [1, -1], [1, 1], [-1, 1]]
  for (let i = 0; i < 4; i++) {
    const [ax, az] = k[i], [bx, bz] = k[(i + 1) % 4]
    const mx = (ax + bx) / 2, mz = (az + bz) / 2, L = Math.hypot(mx, 0.75, mz)
    out.quad([[ax * h, y0, az * h], [bx * h, y0, bz * h], [0, y1, 0], [0, y1, 0]], [mx / L, 0.75 / L, mz / L], [[0, 0], [1, 0], [0.5, 1], [0.5, 1]], [0.55, 0.68, 0.72], surfaceTag('glass'))
  }
}
