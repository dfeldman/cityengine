/**
 * Experiment 6 of MODELING_IMPROVEMENT_1.md — builders written by one experimental run.
 *
 * Each experiment owns exactly ONE of these files so that several can run at once without touching the
 * same lines. The record is already imported and spread into SF_BUILDERS by sf/index.ts, so filling this in
 * is the only edit a run needs to make. Builders here are named `e6_<something>` to keep the flat
 * PROCEDURAL keyspace collision-free (BUGS.md #92).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { tower, towerRing } from '../../tower.ts'
import { colonnade, edgeAt, longestEdge } from '../../parts.ts'

const STONE: [number, number, number] = [0.83, 0.8, 0.72]

export const EXP_6: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /**
   * 301 Pine — Pacific Exchange (former SF Stock Exchange, 1915): a low neoclassical block, giant Ionic
   * colonnade the full height of the front, a plain attic and flat cornice above, pale ashlar. Photos show a
   * single street-facing colonnaded front (way-256066230-01/03/04.jpg); the corner return and rear are plain
   * party-wall stone (04's side view), which the OSM footprint carries on its own.
   */
  e6_pacificExchange_301_Pine: (out: MeshBuilder, fit: Fit): void => {
    tower(out, fit, {
      height: 16,
      tiers: [
        { to: 1, face: { kind: 'blank', wall: STONE, glass: [0.16, 0.17, 0.18], material: 'ashlar' }, cornice: { depth: 0.7, height: 0.8 } },
      ],
      crown: { kind: 'flat' },
      roof: [0.4, 0.39, 0.37],
    })
    const ring = towerRing(fit)
    const e = edgeAt(ring, longestEdge(ring))
    // the giant order: columns run almost the full height, entablature just under the parapet
    colonnade(out, e.a, e.b, 0.3, 11.5, Math.max(6, Math.round(e.L / 3.5)), {
      colour: STONE, material: 'ashlar', out: 1.1, entablature: 1.6, order: 'ionic',
    })
  },
}
