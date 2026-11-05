/**
 * THE PAVILLON GRÉARD, Fondation Deutsch de la Meurthe (Lucien Bechmann, 1925): the north-eastern house of the group, same
 * neo-Norman collegiate vocabulary as Appell/Pasteur — buff brick dressed in pale stone, three storeys under steep slate
 * roofs, stone-coped cross gables, two-storey stone oriels with leaded lights, slate dormers and tall brick chimneys.
 * Plan is a Z of three ranges: a north range, the long east range and a short south wing; the re-entrant fronts face
 * the foundation's lawn (SW), the entrance steps look east to the Maison Internationale (ec.europa.eu photo).
 * Refs: Commons "Pavillon Gréard.jpg", "…Pavillion Greard1/2.jpg", EC renovation page (docs/landmarks/refs/citeu/greard/).
 * Plan: OSM way/260177832, local frame as Appell: x along bearing 108, −z toward bearing 198, origin the vertex mean.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { roof } from '../../kit.ts'
import { rectOn } from '../palaces/common.ts'
import { block } from '../batch2/tag.ts'
import { BRICK, SLATE, STONE, GLASS, EAVES, G, FL, range, gable, windowAt, type Box, type Face } from './fondation-deutsch.ts'

const NORTH: Box = [-20.4, -2.4, 4, 15]         // ridge along x
const EAST: Box = [-2.4, 8.6, -9, 15]           // ridge along z
const SOUTH: Box = [8.6, 14.6, -17, -9]         // ridge along x, the wing's west half lies inside EAST's box below
const SOUTH_W: Box = [-2.4, 8.6, -17, -9]
const GABLES: [Face, Box, number][] = [         // face, range it stands on, position along the face
  ['-z', NORTH, -16], ['-z', NORTH, -8], ['+z', NORTH, -12],
  ['-x', EAST, -3], ['+x', EAST, 1], ['+x', EAST, 10],
  ['-z', SOUTH_W, 3], ['-z', SOUTH, 12],
]
const ORIELS: [Face, Box, number][] = [['-z', NORTH, -12], ['-x', EAST, 9], ['-x', SOUTH_W, -13]]
const ORIEL_W = 3.4, ORIEL_D = 0.9
const DORMERS: [Face, Box, number][] = [['-z', NORTH, -4.5], ['+z', NORTH, -17], ['+z', NORTH, -6], ['-x', EAST, 3]]
const DORMER_W = 1.6, DORMER_H = 1.8
const CHIMNEYS: [number, number][] = [[-14, 9.5], [3.1, 6], [3.1, -12], [12, -13]]
const CHIMNEY_H = 8.4

function plane(f: Face, b: Box): number { return f === '-z' ? b[2] : f === '+z' ? b[3] : f === '-x' ? b[0] : b[1] }

export function pavillonGreard(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0
  range(out, y, EAST, false)
  range(out, y, NORTH, true, ['+x'])
  range(out, y, SOUTH_W, true, ['+z'])
  range(out, y, SOUTH, true, ['-x', '+z'])
  for (const [f, b, t] of GABLES) gable(out, y, f, plane(f, b), t)
  for (const [f, b, t] of ORIELS) {                         // two-storey stone bays, ground and first floors
    const p = plane(f, b), s = f[0] === '-' ? -1 : 1, n0 = p, n1 = p + s * ORIEL_D
    const lo = Math.min(n0, n1), hi = Math.max(n0, n1), h = y + G + FL
    if (f[1] === 'z') block(out, t - ORIEL_W / 2, t + ORIEL_W / 2, lo, hi, y + 0.6, h, STONE)
    else block(out, lo, hi, t - ORIEL_W / 2, t + ORIEL_W / 2, y + 0.6, h, STONE)
    for (const yy of [1.1, G + 0.5]) rectOn(out, f, n1, t - ORIEL_W / 2 + 0.3, t + ORIEL_W / 2 - 0.3, y + yy, y + yy + 1.8, GLASS, 0.05)
  }
  for (const [f, b, t] of DORMERS) {
    const p = plane(f, b), s = f[0] === '-' ? -1 : 1, n0 = p - s * 0.9, n1 = p + s * 0.1
    const lo = Math.min(n0, n1), hi = Math.max(n0, n1), yd = y + EAVES + 0.3, hw = DORMER_W / 2
    if (f[1] === 'z') {
      block(out, t - hw, t + hw, lo, hi, yd, yd + DORMER_H, STONE)
      roof(out, t - hw - 0.15, t + hw + 0.15, lo - 0.1, hi + 0.1, yd + DORMER_H, 1.0, hw + 0.15, 0, SLATE)
    } else {
      block(out, lo, hi, t - hw, t + hw, yd, yd + DORMER_H, STONE)
      roof(out, lo - 0.1, hi + 0.1, t - hw - 0.15, t + hw + 0.15, yd + DORMER_H, 1.0, 0, hw + 0.15, SLATE)
    }
    windowAt(out, f, n1, t, yd + 0.3, 0.9, 1.1)
  }
  for (const [cx, cz] of CHIMNEYS) block(out, cx - 0.6, cx + 0.6, cz - 0.4, cz + 0.4, y + EAVES, y + EAVES + CHIMNEY_H, BRICK)
}
