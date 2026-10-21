/**
 * Landmarks the owner has a personal connection with, rebuilt by hand from photographs (2026-10-21): each was a
 * one-line recipe or a short kit call that read as a generic box. One file per building; spread last in sf/index.ts,
 * after the Civic Center, so each replaces the older builder of the same name.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { SHERITH_ISRAEL } from './sherith-israel.ts'
import { FAIRMONT } from './fairmont.ts'
import { PALACE_HOTEL } from './palace-hotel.ts'
import { NINTH_CIRCUIT } from './ninth-circuit.ts'
import { BANK_OF_ITALY } from './bank-of-italy.ts'
import { BETHLEHEM_STEEL } from './bethlehem-steel.ts'

export const SHOWPIECES: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  ...SHERITH_ISRAEL, ...FAIRMONT, ...PALACE_HOTEL, ...NINTH_CIRCUIT, ...BANK_OF_ITALY, ...BETHLEHEM_STEEL,
}
