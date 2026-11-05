/**
 * THE PAVILLON PASTEUR, Fondation Deutsch de la Meurthe (Lucien Bechmann, 1925): the long south-western range of the
 * group, same neo-Norman collegiate vocabulary as Appell/Poincaré — buff brick dressed in pale stone, three storeys
 * under a steep slate roof broken by stone-coped cross gables and small dormers, leaded windows.
 * Front (−z) looks ESE onto the foundation's lawn; the back faces Avenue David Weill (OSM roads + photo).
 * Refs: Commons "Fondation Deutsch Meurthe - Paris XIV (FR75) - 2025-04-27 - 1" (docs/landmarks/refs/citeu/pasteur/).
 * Plan: OSM way/52090396, ~55 × 10 m, long axis bearing ~19; the range fills the fitted box.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { roof } from '../../kit.ts'
import { block } from '../batch2/tag.ts'
import { BRICK, SLATE, STONE, EAVES, range, gable, windowAt, type Box } from './fondation-deutsch.ts'

const FRONT_GABLES = [-0.62, -0.05, 0.5]      // cross gables on the lawn front, as fractions of the half-length
const BACK_GABLES = [-0.35, 0.3]
const DORMERS = [-0.82, -0.33, 0.22, 0.78]    // small slate dormers between the gables, both faces
const DORMER_W = 1.6, DORMER_H = 1.8, DORMER_IN = 0.9
const CHIMNEYS = [-0.45, 0.12, 0.7], CHIMNEY_UP = 1.2   // above the ridge
const ROOF_PITCH = 1.25                       // roof rise per metre of half-depth

export function pavillonPasteur(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0, hx = fit.hx, hz = Math.min(fit.hz, 6)
  const b: Box = [-hx, hx, -hz, hz]
  const roofH = (hz + 0.4) * ROOF_PITCH
  range(out, y, b, true, [], EAVES, roofH)
  for (const f of FRONT_GABLES) gable(out, y, '-z', -hz, f * hx)
  for (const f of BACK_GABLES) gable(out, y, '+z', hz, f * hx)
  for (const f of DORMERS) {
    for (const s of [-1, 1]) {
      const x = f * hx, z = s * (hz - DORMER_IN), zo = s * (hz + 0.1)
      const z0 = Math.min(z, zo), z1 = Math.max(z, zo), yd = y + EAVES + 0.3
      block(out, x - DORMER_W / 2, x + DORMER_W / 2, z0, z1, yd, yd + DORMER_H, STONE)
      windowAt(out, s < 0 ? '-z' : '+z', zo, x, yd + 0.3, 0.9, 1.1)
      roof(out, x - DORMER_W / 2 - 0.15, x + DORMER_W / 2 + 0.15, z0 - 0.5, z1 + 0.1, yd + DORMER_H, 1.0, DORMER_W / 2 + 0.15, 0, SLATE)
    }
  }
  for (const f of CHIMNEYS) block(out, f * hx - 0.6, f * hx + 0.6, -0.4, 0.4, y + EAVES, y + EAVES + roofH + CHIMNEY_UP, BRICK)
}
