/**
 * Pavillon 6 of Paris Expo (OSM way/754205326, ~97 x 212 m): a plain shed, white-grey metal cladding with a darker band under the eaves. Estimates (2026-11-05), no photo.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { shed } from './hall.ts'

export const PAV6 = { H: 13, RISE: 2, CLAD: '#d3d6d6', BAND: '#8d969b', ROOF: '#bfc5c7' }

export const pavilion6 = (out: MeshBuilder, fit: Fit): void =>
  shed(out, fit, { h: PAV6.H, rise: PAV6.RISE, roof: hex(PAV6.ROOF), wall: { base: PAV6.H - 2.5, clad: hex(PAV6.CLAD), glass: hex(PAV6.BAND), step: 60 } })
