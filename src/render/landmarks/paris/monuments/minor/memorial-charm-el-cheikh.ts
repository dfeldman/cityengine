import { MeshBuilder } from '../../../../buildings.ts'
import type { Rgb } from '../../../../models.ts'
import { prism } from '../../../../models.ts'
import { block, hex, placed, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { G } from '../plaza-common.ts'
import { plaque } from './monument-kit.ts'

/*
 * MEMORIAL DES VICTIMES DES CATASTROPHES AERIENNES (Père-Lachaise, division 77; Wikidata Q96099792, the Charm el-Cheikh
 * 2004 crash; OSM names the stele "Vol 708 West Caribbean", the Martinique crash of 16 Aug 2005): a low round disc of
 * grey granite carrying three upright slabs, a black polished one in the middle (a pale map of Martinique, the title
 * and the list of crashes in white) between two taller, slightly angled grey slabs engraved with the victims' names,
 * a small granite stump at the left end of the disc and a dark plaque let into the disc. All procedural, no sculpture.
 * Frame: −z the front, x across, y up from the ground (G). Dimensions scaled by eye off Commons photographs, not surveyed.
 */
export const HX = 1.4
export const HZ = 1.3

// tunables (metres)
const DISC_R = 1.25, DISC_H = 0.14, DISC_SIDES = 28
const BLACK_W = 0.66, BLACK_H = 1.85, BLACK_T = 0.1, BLACK_Z = 0.15
const FLANK_W = 0.62, FLANK_H = 2.05, FLANK_T = 0.12, FLANK_X = 0.68, FLANK_Z = 0.12, FLANK_TURN = 0.17 // radians, outer edges forward
const STUMP_X = -0.9, STUMP_Z = -0.45, STUMP_R = 0.12, STUMP_H = 0.6
const PLATE_W = 0.62, PLATE_D = 0.34, PLATE_Z = -0.85

const GRANITE: Rgb = hex('#aaa9a5')
const DISC_C: Rgb = hex('#b9b8b3')
const BLACK: Rgb = hex('#161719')
const WHITE: Rgb = hex('#e4e2da')
const NAMES: Rgb = hex('#6b6a68')

/** One slab centred on x = 0, front face at z = 0, standing on y0, set at (tx, tz) turned by `turn`. */
function slab(q: MeshBuilder, tx: number, tz: number, turn: number, w: number, h: number, t: number, y0: number, body: Rgb,
              face: (p: MeshBuilder) => void): void {
  const p = new MeshBuilder()
  block(p, -w / 2, w / 2, 0, t, y0, y0 + h, body)
  face(p)
  placed(q, p, turn, tx, tz)
}

function draw(q: MeshBuilder): void {
  const y0 = G + DISC_H
  prism(q, 0, 0, G, y0, DISC_R, DISC_SIDES, DISC_C)
  // dark plaque let into the disc, in front
  block(q, -PLATE_W / 2, PLATE_W / 2, PLATE_Z - PLATE_D / 2, PLATE_Z + PLATE_D / 2, y0, y0 + 0.012, hex('#2d2e30'))
  // the stump
  prism(q, STUMP_X, STUMP_Z, y0, y0 + STUMP_H, STUMP_R, 12, shade(GRANITE, 1.05))
  // black centre slab: map of Martinique, title lines, list of crashes
  slab(q, 0, BLACK_Z, 0, BLACK_W, BLACK_H, BLACK_T, y0, BLACK, p => {
    plaque(p, { x: 0, z: 0, y0: y0 + BLACK_H * 0.82, w: BLACK_W * 0.8, h: 0.2, panel: BLACK, letters: WHITE, lines: [0.7, 0.55, 0.45] })
    block(p, -0.2, 0.13, -0.012, 0, y0 + BLACK_H * 0.5, y0 + BLACK_H * 0.78, shade(WHITE, 0.85))     // the island
    block(p, -0.1, 0.2, -0.012, 0, y0 + BLACK_H * 0.58, y0 + BLACK_H * 0.7, shade(WHITE, 0.85))
    plaque(p, { x: 0, z: 0, y0: y0 + 0.12, w: BLACK_W * 0.78, h: BLACK_H * 0.36, panel: BLACK, letters: WHITE, lines: [0.7, 0.8, 0.8, 0.7, 0.8, 0.7, 0.8, 0.75, 0.8, 0.7, 0.8, 0.5] })
  })
  // the two grey slabs of names, set back and angled inward
  for (const s of [-1, 1]) {
    slab(q, s * FLANK_X, FLANK_Z, s * FLANK_TURN, FLANK_W, FLANK_H, FLANK_T, y0, GRANITE, p => {
      const rows = new Array(22).fill(0).map((_, i) => 0.55 + 0.35 * ((i * 7) % 5) / 5)
      plaque(p, { x: 0, z: 0, y0: y0 + 0.15, w: FLANK_W * 0.78, h: FLANK_H * 0.82, panel: shade(GRANITE, 1.04), letters: NAMES, lines: rows })
    })
  }
}

export function memorialCharmElCheikh(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
