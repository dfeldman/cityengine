/**
 * Tour Allianz One (ex-PFA / AGF-Athéna, Puteaux, 1984 by Vulic & Willerval, reclad 2012–15; OSM way/64226472):
 * an office shaft in green-grey reflective curtain glass with a fine silver grid, the top storeys set back as a slimmer
 * crown block carrying the Allianz sign (fr.wikipedia photo Tour_Allianz_One_Septembre_2022_1.jpeg).
 * Height: BD TOPO batiment hauteur 99.9 m.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 99.9
const LOBBY_H = 7
const GLASS = '#7b8f8f', MULLION = '#b9c2c2', ROOF = '#7d8383', LOBBY = '#334042'
const FLOOR = 3.6, PITCH = 1.5, SETBACK_AT = 0.86, SETBACK = 2.5, PARAPET_H = 2

export const tourAllianzOne = (out: MeshBuilder, fit: Fit): void => {
  const face = { kind: 'curtain' as const, wall: hex(MULLION), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, material: 'glass' as const }
  tower(out, fit, {
    height: HEIGHT, roof: hex(ROOF),
    base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(MULLION), glass: hex(LOBBY), floor: LOBBY_H, pitch: 3, material: 'glass' } },
    tiers: [{ to: SETBACK_AT, face }, { to: 1, inset: SETBACK, face }],
    crown: { kind: 'parapet', height: PARAPET_H, colour: hex(MULLION), material: 'metal' },
  })
}
