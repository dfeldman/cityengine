import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { church } from '../../church.ts'

/**
 * Saint-Martin-des-Champs, the priory church that is now the Musée des Arts et Métiers' hall of machines (Foucault's
 * pendulum swings in its choir, Blériot's monoplane hangs in its nave): a long single nave under a steep roof, its west
 * gable to the Rue Saint-Martin with one portal, and at the east end the Romanesque choir — the ambulatory's ring of
 * chapels and buttresses OSM's way 56301534 traces in its outline (75 × 44 m). OSM tags it a 1-level chapel; the
 * entry gives the nave's ridge.
 *
 * The church kit (render/landmarks/church.ts): nave along the fit's long axis, front at −z (the entry's `front`, west).
 * The priory's small Romanesque bell tower on the south flank of the choir is not a slot the kit has, and is left off.
 */
export function saintMartinDesChamps(out: MeshBuilder, fit: Fit): void {
  church(out, fit, {
    nave: { bays: 7, storeys: 1, roof: 'gable', pitch: 'moderate' },
    aisles: null,
    transept: null,
    chancel: { kind: 'apse' },
    tower: null,
    front: { kind: 'gable', portal: 'single', window: 'lancets', steps: 2 },
    walls: { material: 'limestone', openings: 'lancet', buttresses: 'stepped' },
  })
}
