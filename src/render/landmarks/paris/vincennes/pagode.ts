/**
 * THE PAGODE DE VINCENNES (Institut international bouddhique): the Cameroun pavilion of the 1931 Exposition coloniale,
 * rebuilt as a temple in 1977. A timber hall of ochre boarding under a huge steep thatched hip roof, almost a pyramid,
 * with a lower thatched rear roof; the front is a bowed screen of tall slim wooden posts round a glazed bay and a
 * carved roundel. Next door, KAGYU-DZONG (1985): a white two-storey Tibetan temple, red-and-gold painted eaves and
 * frieze, red columns at the porch, a gilt dharma wheel on the roof, with a white stupa beside it.
 * Plans: OSM w62819091 (Pagode), w180597886 (Kagyu-Dzong). Refs: Commons (docs/landmarks/refs/vincennes/pagode/).
 * Local frame: front at −z, origin at the footprint centre.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { box } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { block, hex, prism, type Rgb } from '../../kit.ts'
import { quadN } from '../venues/bowl.ts'

const THATCH: Rgb = hex('#7a7468'), THATCH_D: Rgb = hex('#625d54'), OCHRE: Rgb = hex('#c9a668'), WOOD: Rgb = hex('#8a5a32'),
  GLASS: Rgb = hex('#3a4250'), WHITE: Rgb = hex('#e8e4da'), RED: Rgb = hex('#a8302a'), GOLD: Rgb = hex('#d4a640'),
  BLUE: Rgb = hex('#2f5a78')

// the pagode hall: half width (x), front and back (z), wall height, roof
const P_HW = 10, P_ZF = -11, P_ZB = 9, P_WALL = 7.5
const P_OVER = 1.5, P_RIDGE = 24, P_RIDGE_HL = 2.5     // eaves overhang, ridge height, half-length of ridge (along z)
const P_REAR: [number, number, number] = [6, 14, 17]    // rear roof: half width, back z, ridge height
const BOW_R = 7, BOW_DEPTH = 2.5, BOW_POSTS = 11, POST_H = 9.5, POST_R = 0.22

function hipRoof(out: MeshBuilder, x0: number, x1: number, z0: number, z1: number, yE: number, yR: number, hl: number,
                 c: Rgb, c2: Rgb): void {
  const zm = (z0 + z1) / 2, xm = (x0 + x1) / 2, ra: [number, number, number] = [xm, yR, zm - hl], rb: [number, number, number] = [xm, yR, zm + hl]
  quadN(out, [[x0, yE, z0], [x0, yE, z1], rb, ra], [-1, 1, 0], c)
  quadN(out, [[x1, yE, z0], [x1, yE, z1], rb, ra], [1, 1, 0], c2)
  quadN(out, [[x0, yE, z0], [x1, yE, z0], ra, ra], [0, 1, -1], c)
  quadN(out, [[x0, yE, z1], [x1, yE, z1], rb, rb], [0, 1, 1], c2)
}

export function pagodeVincennes(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0
  const PL = surfaceTag('planks')
  box(out, 0, y + P_WALL / 2, (P_ZF + P_ZB) / 2, P_HW, P_WALL / 2, (P_ZB - P_ZF) / 2, OCHRE, PL)
  box(out, 0, y + (P_WALL - 1) / 2, (P_ZB + P_REAR[1] - 1) / 2, P_REAR[0], (P_WALL - 1) / 2, (P_REAR[1] - 1 - P_ZB) / 2, OCHRE, PL)
  hipRoof(out, -P_REAR[0] - 1, P_REAR[0] + 1, P_ZB - 2, P_REAR[1], y + P_WALL - 1.5, y + P_REAR[2], 1.5, THATCH_D, THATCH_D)
  hipRoof(out, -P_HW - P_OVER, P_HW + P_OVER, P_ZF - P_OVER, P_ZB + P_OVER, y + P_WALL, y + P_RIDGE, P_RIDGE_HL, THATCH, THATCH_D)
  // the bowed front: glazed bay, roundel, a ring of tall posts under a curved lintel
  block(out, -4, 4, P_ZF - 0.3, P_ZF, y, y + 6, GLASS)
  prism(out, 0, P_ZF - 0.35, y + 4, y + 4.1, 1.8, 16, WOOD)
  for (let i = 0; i < BOW_POSTS; i++) {
    const a = Math.PI * (0.15 + 0.7 * i / (BOW_POSTS - 1)), x = -Math.cos(a) * BOW_R, z = P_ZF - Math.sin(a) * BOW_DEPTH
    prism(out, x, z, y, y + POST_H, POST_R, 6, WOOD)
    block(out, x - 0.9, x + 0.9, z - 0.25, z + 0.25, y + POST_H - 0.6, y + POST_H, WOOD)
  }
}

const STUCCO = surfaceTag('stucco')
/** A white rendered block: tagged stucco so the landmark shader does not dress it as ashlar. */
function wblock(out: MeshBuilder, x0: number, x1: number, z0: number, z1: number, y0: number, y1: number): void {
  box(out, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, (x1 - x0) / 2, (y1 - y0) / 2, (z1 - z0) / 2, WHITE, STUCCO)
}

// Kagyu-Dzong: half length (x), half depth (z), storeys, frieze
const K_HX = 7.5, K_HZ = 5, K_H1 = 4, K_H2 = 8, K_TOP = 10.5, K_EAVE = 0.9
const STUPA_X = -K_HX - 5, STUPA_H = 7

export function kagyuDzong(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0
  wblock(out, -K_HX, K_HX, -K_HZ, K_HZ, y, y + K_H2)
  for (const [yy, d] of [[K_H1, 0.6], [K_H2, K_EAVE]] as const) {          // painted eave bands
    block(out, -K_HX - d, K_HX + d, -K_HZ - d, K_HZ + d, y + yy - 0.5, y + yy, RED)
    block(out, -K_HX - d, K_HX + d, -K_HZ - d, K_HZ + d, y + yy, y + yy + 0.3, BLUE)
  }
  block(out, -K_HX + 2.5, K_HX - 2.5, -K_HZ + 1, K_HZ - 1, y + K_H2 + 0.3, y + K_TOP - 0.6, RED)   // top storey
  block(out, -K_HX + 2, K_HX - 2, -K_HZ + 0.5, K_HZ - 0.5, y + K_TOP - 0.6, y + K_TOP, GOLD)
  block(out, -3.5, 3.5, -K_HZ - 0.05, -K_HZ, y + K_H1 + 0.8, y + K_H2 - 1, GLASS)          // the upper window band
  block(out, -1.2, 1.2, -K_HZ - 0.05, -K_HZ, y, y + 2.8, RED)                              // the door
  for (const x of [-4.5, -2, 2, 4.5]) prism(out, x, -K_HZ - 1.5, y + 0.6, y + K_H1 - 0.5, 0.3, 8, RED)
  block(out, -5.2, 5.2, -K_HZ - 2.2, -K_HZ, y + K_H1 - 0.5, y + K_H1, RED)                 // porch lintel
  wblock(out, -5.5, 5.5, -K_HZ - 3, -K_HZ, y, y + 0.6)                                // steps
  prism(out, 0, 0, y + K_TOP, y + K_TOP + 1.2, 0.6, 12, GOLD)                              // the dharma wheel
  // the stupa: stepped base, dome, spire, gilt finial
  wblock(out, STUPA_X - 2, STUPA_X + 2, -2, 2, y, y + 1.2)
  wblock(out, STUPA_X - 1.5, STUPA_X + 1.5, -1.5, 1.5, y + 1.2, y + 2.2)
  prism(out, STUPA_X, 0, y + 2.2, y + 3.8, 1.4, 12, WHITE, STUCCO, 1.2)
  prism(out, STUPA_X, 0, y + 3.8, y + STUPA_H - 1, 0.5, 8, WHITE, STUCCO, 0.2)
  prism(out, STUPA_X, 0, y + STUPA_H - 1, y + STUPA_H, 0.25, 8, GOLD, undefined, 0.05)
}
