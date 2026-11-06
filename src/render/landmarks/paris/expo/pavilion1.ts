/**
 * Pavillon 1 of Paris Expo (OSM way/404252944, ~191 x 242 m box turned 45 degrees; rebuilt 2017-): a metal-clad hall with a coloured-glass screen
 * on its front (the entry's `front`, local -z). No photo read (2026-11-05): the colour sequence and 24 m height are estimates.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { capPolygon } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { hallWalls, ringOf } from './hall.ts'

export const PAV1 = {
  BASE: 5, STEP: 4, FRONT_NZ: -0.5, PANEL: 8, // wall segments whose outward normal has nz below FRONT_NZ get the screen, a colour every PANEL m
  COLOURS: ['#c8453d', '#e08a2e', '#e8c63a', '#6aa84f', '#3f9fb5', '#3b62a8', '#8a4fa0'],
  SIDE: '#7f9aa8', CLAD: '#aeb4b7', ROOF: '#c6cacc',
}

export const pavilion1 = (out: MeshBuilder, fit: Fit): void => {
  const K = PAV1, ring = ringOf(fit), cols = K.COLOURS.map(hex), side = hex(K.SIDE)
  hallWalls(out, ring, () => fit.height, {
    base: K.BASE, glassTag: 0, clad: hex(K.CLAD), glass: side, step: K.STEP, mull: 0,
    glassFor: (_i, _a, _b, _nx, nz, u) => (nz < K.FRONT_NZ ? cols[Math.floor(u / K.PANEL) % cols.length] : side),
  })
  capPolygon(out, ring, fit.height, hex(K.ROOF), 0)
}
