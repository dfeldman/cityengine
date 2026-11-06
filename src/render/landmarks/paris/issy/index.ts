/**
 * ISSY batch (2026-11-05): Porte de Versailles / Balard / Issy (plans/expo-area.md). Distance fidelity: shape, colour, size. One file per builder; each entry's madeBy names its maker.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { aquaboulevard } from './aquaboulevard.ts'
import { aquaOffice } from './aquaOffice.ts'
import { heliport } from './heliport.ts'
import { cirqueBormann } from './cirqueBormann.ts'
import { dgac } from './dgac.ts'
import { capgemini } from './capgemini.ts'
import { laBarge } from './laBarge.ts'
import { mirrorPrism } from './mirrorPrism.ts'
import { boatWings } from './boatWings.ts'
import { leLarge, leLargeMain } from './leLarge.ts'

export const PARIS_ISSY: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  boatWings,
  leLarge,
  leLargeMain,
  capgemini,
  laBarge,
  dgac,
  cirqueBormann,
  heliport,
  aquaboulevard,
  aquaOffice,
  mirrorPrism,
}
