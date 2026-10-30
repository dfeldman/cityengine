/**
 * The monuments, churches and gates beyond the first set: columns, arches, basilicas (PARIS_PARITY.md §4). One file per builder in this folder; each registered here, and named by an entry in
 * public/landmarks/paris/monuments.json (included from paris.json).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { laTrinite, saintEustache, saintGermainAuxerrois, saintGermainDesPres, saintRoch } from './churches.ts'
import { carrouselArch, porteSaintDenis, porteSaintMartin } from './gates.ts'
import { grandeArche, montparnasseFull } from './modern.ts'
import { pantheonFull } from './pantheon.ts'
import { lionDeBelfort, triompheRepublique, troneColumnPhilippeAuguste, troneColumnSaintLouis } from './statues.ts'
import { sacreCoeurFull } from './sacre-coeur.ts'
import { saintSulpice } from './saint-sulpice.ts'
import { sacreCoeurTerraces } from './sacre-coeur-terraces.ts'

export const PARIS_MONUMENTS: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  carrouselArch,
  grandeArche,
  laTrinite,
  lionDeBelfort,
  montparnasseFull,
  pantheonFull,
  porteSaintDenis,
  porteSaintMartin,
  sacreCoeurFull,
  sacreCoeurTerraces,
  saintEustache,
  saintGermainAuxerrois,
  saintGermainDesPres,
  saintRoch,
  saintSulpice,
  triompheRepublique,
  troneColumnPhilippeAuguste,
  troneColumnSaintLouis,
}
