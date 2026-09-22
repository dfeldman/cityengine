import type { MeshBuilder } from '../../buildings.ts'
import { block, courtFacade, courtWalls, hex } from '../kit.ts'
import type { Fit } from '../fit.ts'

/**
 * The Hôtel de Sully's court (Jean Androuet du Cerceau, 1625): the most richly carved courtyard in the Marais
 * — pale stone, pilasters, windows under alternating pediments, and on the piers the reliefs of the Seasons
 * and the Elements, with tall stone lucarnes on the cornice; the carriage passage through the street wing.
 * Drawn on the building's own courtyard (manifest `court: true`); the building is OSM's.
 */
export function sullyCourt(out: MeshBuilder, fit: Fit): void {
  const stone = hex('#cdbfa4')
  const trim = hex('#d9ccb2')
  const dark = hex('#2e2d2b')
  // the city's own wall height for this building (its OSM 12 m) plus the half metre the model is sunk
  const eaves = fit.height + 0.5
  block(out, -fit.hx, fit.hx, -fit.hz, fit.hz, 0, 0.56, hex('#c9bfae'))            // the paved court
  courtWalls(out, fit, (q, len, which) => courtFacade(q, len, eaves, {
    stone, trim, dark, reliefs: which !== 'near', lucarnes: true, passage: which === 'near',
  }))
}
