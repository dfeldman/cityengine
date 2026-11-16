/**
 * Batch 7 of the owner's overnight plan (docs/landmarks/PARIS-BATCHES.md, 2026-10-30): the remaining hospitals and institutes, and La Défense's unusual towers. Most of the hospitals are restyles (public/landmarks/paris/batch7.json); the gardens are `squarePlanting` in render/garden.ts.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { defenseGreen, tourCoupoleFar, tourTriangle } from './defense.ts'
import { hekla } from '../defense-famous/hekla.ts'
import { theLink } from '../defense-famous/theLink.ts'
import { majunga } from '../defense-famous/majunga.ts'
import { areva } from '../defense-famous/areva.ts'
import { granite } from '../defense-famous/granite.ts'
import { engieT1 } from '../defense-famous/engieT1.ts'
import { saintGobain } from '../defense-famous/saintGobain.ts'
import { trinity } from '../defense-famous/trinity.ts'
import { tourD2 } from '../defense-famous/tourD2.ts'
import { carpeDiem } from '../defense-famous/carpeDiem.ts'
import { tourAlto } from '../defense-famous/tourAlto.ts'
import { tourCoupole } from '../defense-famous/tourCoupole.ts'
import { coeurDefense } from '../defense-famous/coeurDefense.ts'
import { cb21 } from '../defense-famous/cb21.ts'
import { legende } from '../defense-famous/legende.ts'
import { hopen } from '../defense-famous/hopen.ts'
import { eqho } from '../defense-famous/eqho.ts'
import { ariane } from '../defense-famous/ariane.ts'
import { ciel } from '../defense-famous/ciel.ts'
import { cbx } from '../defense-famous/cbx.ts'
import { europlaza } from '../defense-famous/europlaza.ts'
import { egee } from '../defense-famous/egee.ts'
import { alicante, chassagne } from '../defense-famous/societeGeneraleTwins.ts'
import { institutArt, institutOceano, ircamTower } from './institutes.ts'

export const PARIS_BATCH7: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  hekla, theLink, majunga, areva, granite, engieT1, saintGobain, trinity, tourD2, carpeDiem, tourAlto, tourTriangle, tourCoupole, tourCoupoleFar, coeurDefense,
  defenseGreen,
  cb21, legende, hopen, eqho, ariane, ciel, cbx, europlaza, egee, alicante, chassagne,
  institutArt, institutOceano, ircamTower,
}
