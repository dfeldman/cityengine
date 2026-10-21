/**
 * The Civic Center round City Hall, rebuilt building by building to City Hall's own standard (the owner, 2026-10-21:
 * "only City Hall looks right"). Each file is one group of neighbours, from Mapillary frames and Commons photographs.
 * Spread LAST in sf/index.ts, so these replace the earlier grammar boxes under the same builder names.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { WAR_MEMORIAL } from './war-memorial.ts'
import { AUDITORIUM_SYMPHONY } from './auditorium-symphony.ts'
import { CIVIC_LIBRARIES } from './libraries.ts'
import { UN_PLAZA } from './un-plaza.ts'
import { STATE_BUILDINGS } from './state.ts'
import { CIVIC_VENUES } from './venues.ts'
import { VAN_NESS_CIVIC } from './van-ness.ts'

export const CIVIC_CORE: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  ...WAR_MEMORIAL, ...AUDITORIUM_SYMPHONY, ...CIVIC_LIBRARIES, ...UN_PLAZA, ...STATE_BUILDINGS, ...CIVIC_VENUES, ...VAN_NESS_CIVIC,
}
