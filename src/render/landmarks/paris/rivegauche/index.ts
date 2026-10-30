/**
 * Wave 5 (2026-10-30): the Rive Gauche and Bercy, the Jardin des Plantes and its zoo. The owner: "basically the whole area around
 * bercy needs another look, it has many modern buildings that are highly unique architectural pieces in an extremely prominent
 * area"; "for bibliotheque national ... we are not doing anything for the unique surrounding buildings"; and of the Jardin, "we
 * have the conservatory, but no gardens", "some but not all zoo buildings are shown", "this one has no roof". One file for a
 * builder or a family of them in this folder, each registered here and named by an entry in public/landmarks/paris/rivegauche.json
 * (included from paris.json, ahead of civic.json so that its entries win a way both claim).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { cinematheque } from './cinematheque.ts'
import { toursDuo } from './duo.ts'
import { jardinAnnexes, jardinPerspective } from './jardin.ts'
import { leMonde } from './le-monde.ts'
import { bercyVillageNorth, bercyVillageSouth, halleAuxFarines, lesFrigos, mk2Bibliotheque, ugcBercy } from './rive-gauche.ts'
import { grandeRotonde } from './rotonde.ts'
import { fauverie, menagerieHouse, reptiles, singerie, vivarium } from './zoo.ts'

export const PARIS_RIVEGAUCHE: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  toursDuo,
  cinematheque,
  leMonde,
  mk2Bibliotheque,
  lesFrigos,
  halleAuxFarines,
  ugcBercy,
  bercyVillageNorth,
  bercyVillageSouth,
  jardinPerspective,
  jardinAnnexes,
  grandeRotonde,
  fauverie,
  singerie,
  reptiles,
  vivarium,
  menagerieHouse,
}
