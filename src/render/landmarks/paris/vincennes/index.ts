/**
 * The Bois and Château de Vincennes, one bespoke builder each (docs/landmarks/MODEL-VINCENNES.md, 2026-11-04). Each is
 * named by an entry in public/landmarks/paris/vincennes.json (included from paris.json ahead of batch2.json and civic.json,
 * so an entry there wins a way both claim). The Daumesnil temple and the Grand Rocher stay in ../batch4/bois.ts.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { pavillonIndochine, porteChinoise, templeIndochinois } from './agronomie.ts'
import { chapelleVincennes } from './chapelle.ts'
import { donjonVincennes } from './donjon.ts'
import { espaceDelta, pavillonFloral } from './floral.ts'
import { enceinteVincennes } from './enceinte.ts'
import { hippodromeVincennes } from './hippodrome.ts'
import { kagyuDzong, pagodeVincennes } from './pagode.ts'
import { pavillonsVincennes } from './pavillons.ts'
import { grandeSerre } from './zoo.ts'

export const PARIS_VINCENNES: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  chapelleVincennes,
  donjonVincennes,
  enceinteVincennes,
  espaceDelta,
  grandeSerre,
  hippodromeVincennes,
  kagyuDzong,
  pagodeVincennes,
  pavillonsVincennes,
  pavillonFloral,
  pavillonIndochine,
  porteChinoise,
  templeIndochinois,
}
