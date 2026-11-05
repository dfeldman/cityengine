/**
 * THE PAVILLON PIERRE ET MARIE CURIE, Fondation Deutsch de la Meurthe (Lucien Bechmann, 1925, MH 1998): the group's
 * south-eastern house, one long range (11 × 48 m, ridge NNE–SSW) in the same neo-Norman collegiate vocabulary as
 * Appell/Gréard/Liard — buff brick dressed in pale stone, three storeys under a steep slate roof, stone-coped cross
 * gables over two-storey stone bays, slate dormers, tall brick chimneys. Its long WNW face (−x) looks over the rose
 * garden and pergola toward Appell and Gréard (Commons photo); the ESE face (+x) is on the service road; the NNE end
 * faces Boulevard Jourdan.
 * Refs: docs/landmarks/refs/citeu/curie/commons-curie.jpg.
 * Plan: OSM way/260177833, local frame as Appell: x along bearing 108, −z toward bearing 198, origin the vertex mean.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { roof } from '../../kit.ts'
import { rectOn } from '../palaces/common.ts'
import { block } from '../batch2/tag.ts'
import { BRICK, SLATE, STONE, GLASS, EAVES, G, FL, range, gable, windowAt, type Box, type Face } from './fondation-deutsch.ts'

const MAIN: Box = [-2.8, 7.9, -23.8, 23.8]        // ridge along z
const GABLES: [Face, number][] = [['-x', -15], ['-x', 0], ['-x', 15], ['+x', -9], ['+x', 9]]
const ORIELS: [Face, number][] = [['-x', -15], ['-x', 15]]
const ORIEL_W = 3.2, ORIEL_D = 0.8
const DORMERS: [Face, number][] = [['-x', -7.5], ['-x', 7.5], ['-x', -20.5], ['-x', 20.5], ['+x', 0], ['+x', -18], ['+x', 18]]
const DORMER_W = 1.7, DORMER_H = 1.8, DORMER_GABLE = 1.2
const CHIMNEYS: [number, number][] = [[2.5, -11], [2.5, 4], [2.5, 19]]
const CHIMNEY_H = 8.6

function plane(f: Face): number { return f === '-z' ? MAIN[2] : f === '+z' ? MAIN[3] : f === '-x' ? MAIN[0] : MAIN[1] }

export function pavillonCurie(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0
  range(out, y, MAIN, false)
  for (const [f, t] of GABLES) gable(out, y, f, plane(f), t)
  for (const [f, t] of ORIELS) {                            // two-storey stone bays, ground and first floors
    const p = plane(f), s = f === '-x' ? -1 : 1, n1 = p + s * ORIEL_D
    const lo = Math.min(p, n1), hi = Math.max(p, n1)
    block(out, lo, hi, t - ORIEL_W / 2, t + ORIEL_W / 2, y + 0.6, y + G + FL, STONE)
    for (const yy of [1.1, G + 0.5]) rectOn(out, f, n1, t - ORIEL_W / 2 + 0.3, t + ORIEL_W / 2 - 0.3, y + yy, y + yy + 1.8, GLASS, 0.05)
  }
  for (const [f, t] of DORMERS) {                           // slate-hung dormers with a small gable
    const p = plane(f), s = f === '-x' ? -1 : 1, n0 = p - s * 1.2, n1 = p + s * 0.1
    const lo = Math.min(n0, n1), hi = Math.max(n0, n1), yd = y + EAVES + 0.3, hw = DORMER_W / 2
    block(out, lo, hi, t - hw, t + hw, yd, yd + DORMER_H, SLATE)
    roof(out, lo - 0.1, hi + 0.1, t - hw - 0.15, t + hw + 0.15, yd + DORMER_H, DORMER_GABLE, 0, hw + 0.15, SLATE)
    windowAt(out, f, n1, t, yd + 0.3, 1.0, 1.1)
  }
  for (const [cx, cz] of CHIMNEYS) block(out, cx - 0.6, cx + 0.6, cz - 0.4, cz + 0.4, y + EAVES, y + EAVES + CHIMNEY_H, BRICK)
}
