/**
 * Pavillon 5 of Paris Expo Porte de Versailles (OSM way/42736338, 195 x 76 m box, 6 levels): the hall with the undulating pale roof over glazed walls.
 * No photo read (2026-11-05); wave count, amplitude and direction are estimates, tunable below. The roof is a sine surface over the OSM ring
 * (`WAVE.DIR` is the angle of the wave's travel from local +x; crests run square to it), walls follow it so the eave rolls too.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { hallWalls, ringOf, scanRoof } from './hall.ts'

export const PAV5 = {
  WAVE: { AMP: 3.2, COUNT: 6, DIR: 0, PHASE: -Math.PI / 2 }, // metres; waves over the box's long axis; degrees of travel direction
  BASE: 4, STEP: 8, STRIP: 3, SAMPLE: 5, MULL: 9,
}

export const pavilion5 = (out: MeshBuilder, fit: Fit): void => {
  const K = PAV5, ring = ringOf(fit)
  const eave = fit.height - 2 * K.WAVE.AMP
  const d = (K.WAVE.DIR * Math.PI) / 180, c = Math.cos(d), s = Math.sin(d)
  const lam = (2 * fit.hx) / K.WAVE.COUNT
  const y = (x: number, z: number): number => eave + K.WAVE.AMP * (1 + Math.sin((2 * Math.PI * (x * c + z * s)) / lam + K.WAVE.PHASE))
  hallWalls(out, ring, y, { base: K.BASE, clad: hex('#cfd3d4'), glass: hex('#9db4c0'), step: K.STEP, mull: K.MULL, mullColour: hex('#8c9498') })
  scanRoof(out, ring, y, K.STRIP, K.SAMPLE, hex('#eceeee'))
}
