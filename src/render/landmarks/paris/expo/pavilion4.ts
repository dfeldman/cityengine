/**
 * Pavillon 4 of Paris Expo (OSM way/42736344, ~94 x 248 m): a plain shed, grey-blue metal cladding, a flat roof with a shallow rise. Estimates (2026-11-05), no photo.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { shed } from './hall.ts'

export const PAV4 = { H: 14, RISE: 2.5, CLAD: '#aab4ba', BAND: '#7d8b94', ROOF: '#c9cfd2' }

export const pavilion4 = (out: MeshBuilder, fit: Fit): void =>
  shed(out, fit, { h: PAV4.H, rise: PAV4.RISE, roof: hex(PAV4.ROOF), wall: { base: PAV4.H - 3, clad: hex(PAV4.CLAD), glass: hex(PAV4.BAND), step: 60 } })
