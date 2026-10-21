/**
 * Prominent landmarks rebuilt by hand from photographs (2026-10-21), the owner's favourites first: each was a
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
import { GRACE_CATHEDRAL } from './grace-cathedral.ts'
import { RUSS_BUILDING } from './russ-building.ts'
import { EMBARCADERO_CENTER } from './embarcadero-center.ts'
import { ONE_OH_ONE_CALIFORNIA } from './one-oh-one-california.ts'
import { NEW_MONTGOMERY_140 } from './new-montgomery-140.ts'
import { MARK_HOPKINS } from './mark-hopkins.ts'
import { MISSION_DOLORES } from './mission-dolores.ts'
import { PHELAN_BUILDING } from './phelan-building.ts'
import { CUSTOM_HOUSE } from './custom-house.ts'
import { HOLY_VIRGIN } from './holy-virgin.ts'

export const SHOWPIECES: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  ...SHERITH_ISRAEL, ...FAIRMONT, ...PALACE_HOTEL, ...NINTH_CIRCUIT, ...BANK_OF_ITALY, ...BETHLEHEM_STEEL,
  ...GRACE_CATHEDRAL, ...RUSS_BUILDING, ...EMBARCADERO_CENTER, ...ONE_OH_ONE_CALIFORNIA, ...NEW_MONTGOMERY_140, ...MARK_HOPKINS, ...MISSION_DOLORES, ...PHELAN_BUILDING, ...CUSTOM_HOUSE, ...HOLY_VIRGIN,
}
