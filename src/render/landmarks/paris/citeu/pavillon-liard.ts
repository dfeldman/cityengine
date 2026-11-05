/**
 * THE PAVILLON LIARD, Fondation Deutsch de la Meurthe (Lucien Bechmann, 1925): the northernmost house of the group, same
 * neo-Norman collegiate vocabulary as Appell/Pasteur/Gréard — buff brick dressed in pale stone, three storeys under steep
 * slate roofs, stone-coped cross gables, a two-storey stone bay under the main gable, a slate dormer with a small gable,
 * tall brick chimneys. Plan is a Z of three ranges: a south-west range, the middle range (ridge N–S) and the north-east
 * range; Boulevard Jourdan runs behind (+z, NNE), the lawn and its footway lie to the SSW (−z). The owner's Street View
 * (May 2018) looks from the lawn into the re-entrant corner of the NE range and middle range: the gabled bay is the
 * 3 m projection on the NE range's lawn face (OSM).
 * Refs: docs/landmarks/refs/citeu/liard/owner-streetview-2018.webp, commons-liard.jpg.
 * Plan: OSM way/52090397, local frame as Appell: x along bearing 108, −z toward bearing 198, origin the vertex mean.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { roof } from '../../kit.ts'
import { rectOn } from '../palaces/common.ts'
import { block } from '../batch2/tag.ts'
import { BRICK, SLATE, STONE, GLASS, EAVES, G, FL, range, gable, windowAt, type Box, type Face } from './fondation-deutsch.ts'

const SW: Box = [-14.3, -7.8, -17.4, -9.5]       // ridge along x; its east half lies under MID_S
const MID_S: Box = [-7.8, 2.8, -17.4, -9.5]      // ridge along x, joins the middle range
const MID: Box = [-7.8, 2.9, -9.5, 14]           // ridge along z
const NE: Box = [2.9, 16, 3.2, 13.9]             // ridge along x
const NE_END: Box = [16, 21.2, 4.1, 12.9]        // the east end, slightly narrower
const GABLES: [Face, Box, number][] = [          // face, range it stands on, position along the face
  ['-z', MID_S, -5.8], ['-z', SW, -11], ['+z', SW, -11],
  ['+x', MID, -5.8], ['-x', MID, -0.5], ['-x', MID, 9],
  ['-z', NE, 12], ['+z', NE, 8],
  ['+z', MID, -0.5],
]
const ORIELS: [Face, Box, number][] = [['-z', NE, 12], ['-z', MID_S, -5.8], ['+x', MID, -5.8]]
const ORIEL_W = 3.1, ORIEL_D = 0.7
const DORMERS: [Face, Box, number][] = [['-z', NE, 16.5], ['-z', NE, 6.5], ['+x', MID, 0], ['-z', MID_S, -1.5], ['+z', NE, 13]]
const DORMER_W = 1.8, DORMER_H = 1.9, DORMER_GABLE = 1.3
const CHIMNEYS: [number, number][] = [[-11, -13.5], [-2.5, 5], [9, 8.6], [16, 8.5]]
const CHIMNEY_H = 8.8

function plane(f: Face, b: Box): number { return f === '-z' ? b[2] : f === '+z' ? b[3] : f === '-x' ? b[0] : b[1] }

export function pavillonLiard(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0
  range(out, y, MID, false)
  range(out, y, MID_S, true, ['+z', '-x'])
  range(out, y, SW, true, ['+x'])
  range(out, y, NE, true, ['-x', '+x'])
  range(out, y, NE_END, true, ['-x'])
  for (const [f, b, t] of GABLES) gable(out, y, f, plane(f, b), t)
  for (const [f, b, t] of ORIELS) {                         // two-storey stone bays, ground and first floors
    const p = plane(f, b) + (f[0] === '-' ? -0.5 : 0.5), s = f[0] === '-' ? -1 : 1, n1 = p + s * ORIEL_D
    const lo = Math.min(p, n1), hi = Math.max(p, n1), h = y + G + FL
    if (f[1] === 'z') block(out, t - ORIEL_W / 2, t + ORIEL_W / 2, lo, hi, y + 0.6, h, STONE)
    else block(out, lo, hi, t - ORIEL_W / 2, t + ORIEL_W / 2, y + 0.6, h, STONE)
    for (const yy of [1.1, G + 0.5]) rectOn(out, f, n1, t - ORIEL_W / 2 + 0.3, t + ORIEL_W / 2 - 0.3, y + yy, y + yy + 1.8, GLASS, 0.05)
  }
  for (const [f, b, t] of DORMERS) {                        // slate-hung dormers with a small gable
    const p = plane(f, b), s = f[0] === '-' ? -1 : 1, n0 = p - s * 1.2, n1 = p + s * 0.1
    const lo = Math.min(n0, n1), hi = Math.max(n0, n1), yd = y + EAVES + 0.3, hw = DORMER_W / 2
    if (f[1] === 'z') {
      block(out, t - hw, t + hw, lo, hi, yd, yd + DORMER_H, SLATE)
      roof(out, t - hw - 0.15, t + hw + 0.15, lo - 0.1, hi + 0.1, yd + DORMER_H, DORMER_GABLE, hw + 0.15, 0, SLATE)
    } else {
      block(out, lo, hi, t - hw, t + hw, yd, yd + DORMER_H, SLATE)
      roof(out, lo - 0.1, hi + 0.1, t - hw - 0.15, t + hw + 0.15, yd + DORMER_H, DORMER_GABLE, 0, hw + 0.15, SLATE)
    }
    windowAt(out, f, n1, t, yd + 0.3, 1.0, 1.2)
  }
  for (const [cx, cz] of CHIMNEYS) block(out, cx - 0.6, cx + 0.6, cz - 0.4, cz + 0.4, y + EAVES, y + EAVES + CHIMNEY_H, BRICK)
}
