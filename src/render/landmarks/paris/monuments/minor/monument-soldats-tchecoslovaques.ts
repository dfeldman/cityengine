import type { MeshBuilder } from '../../../../buildings.ts'
import type { Rgb } from '../../../../models.ts'
import { block, hex, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { G } from '../plaza-common.ts'
import { plaque } from './monument-kit.ts'

/*
 * LE MONUMENT AUX SOLDATS TCHECOSLOVAQUES (Père-Lachaise, division 84, avenue des Combattants étrangers; Wikidata
 * Q96035892; unveiled 19 Dec 1934): a wide pink-grey granite stele in three joined panels carrying the Czech and French
 * dedications, with a bronze group on top (Marianne, the dying soldier, the widow, Czechoslovakia: a separate Modly model,
 * paris-statues.json "monument-soldats-tchecoslovaques-groupe") and a small WWII plaque on the ground before it. Read off
 * Commons photos (panoramio "Monument Honoring Czech Volunteers…", Flickr 31328958391); sizes estimated against the
 * bronze figures (~1.8 m). Frame: −z the inscribed front, x across, y up from the ground (G).
 */
export const HX = 2.4
export const HZ = 1.4
/** Top of the granite slab, in the builder frame (y of the bronze group's feet), for the statue attach. */
export const SLAB_TOP = 1.2 + 0.14

// tunables (metres)
const BASE_HW = 2.05, BASE_HD = 0.62, BASE_H = 0.14   // low plinth step under the slab
const SLAB_HW = 1.85, SLAB_HD = 0.27, SLAB_H = 1.2    // the three-panel granite slab
const JOINT_HW = 0.012                                // half-width of the vertical joints between the panels
const GROUP_PLINTH_H = 0.07                            // bronze base plate under the figures
const GRP_HW = 1.7, GRP_HD = 0.3
const GROUND_PLQ_W = 0.95, GROUND_PLQ_D = 0.5, GROUND_PLQ_H = 0.07, GROUND_PLQ_Z = -1.05

const GRANITE: Rgb = hex('#8e8680')
const BRONZE: Rgb = hex('#4f7566')

function draw(q: MeshBuilder): void {
  const y = (v: number): number => G + v
  block(q, -BASE_HW, BASE_HW, -BASE_HD, BASE_HD, y(0), y(BASE_H), shade(GRANITE, 0.9))
  block(q, -SLAB_HW, SLAB_HW, -SLAB_HD, SLAB_HD, y(BASE_H), y(BASE_H + SLAB_H), GRANITE)
  const zf = -SLAB_HD
  for (const jx of [-SLAB_HW / 3, SLAB_HW / 3]) {
    block(q, jx - JOINT_HW, jx + JOINT_HW, zf - 0.004, zf, y(BASE_H), y(BASE_H + SLAB_H), shade(GRANITE, 0.55))
  }
  // dedications: Czech line above, French block below, as rows of cut letters on the polished face
  const panel = shade(GRANITE, 1.05), letters = shade(GRANITE, 0.62)
  plaque(q, { x: 0, z: zf - 0.001, y0: y(BASE_H + 0.62), w: 3.4, h: 0.4, panel, letters, lines: [0.9, 0.7] })
  plaque(q, { x: 0, z: zf - 0.001, y0: y(BASE_H + 0.08), w: 3.2, h: 0.46, panel, letters, lines: [0.9, 0.8, 0.6] })
  // thin bronze base plate carrying the (separate) figure group
  block(q, -GRP_HW, GRP_HW, -GRP_HD, GRP_HD, y(BASE_H + SLAB_H), y(BASE_H + SLAB_H + GROUP_PLINTH_H), BRONZE)
  // WWII memorial plaque set flat on the paving in front
  block(q, -GROUND_PLQ_W / 2, GROUND_PLQ_W / 2, GROUND_PLQ_Z - GROUND_PLQ_D / 2, GROUND_PLQ_Z + GROUND_PLQ_D / 2, y(0), y(GROUND_PLQ_H), shade(GRANITE, 0.55))
}

export function monumentSoldatsTchecoslovaques(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
