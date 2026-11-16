/**
 * Canopy (9 quai du Président Paul Doumer, Courbevoie; ex-Calyon/CACIB offices, 12 levels; OSM way/82467083): a
 * glass office block on OSM's irregular ring, pale green-blue reflective curtain wall in narrow aluminium bays with
 * light floor lines, a taller glazed ground floor under a white canopy, and a recessed plant storey on top.
 * No usable street photo was found (Panoramax had none in range); height 44 m from 12 levels + plant (OSM levels),
 * BD TOPO's 55 m hit uncertain.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 44, LOBBY_H = 5, FLOOR = 3.5, PITCH = 1.5, SOLID = 0.12, PLANT_H = 3, PLANT_INSET = 2.5
const GLASS = '#93acb4', MULLION = '#d4dadb', LOBBY = '#5d7480', CANOPY = '#eef0ef', PLANT = '#b9bfc1', ROOF = '#8b9092'

export const canopy = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(MULLION), glass: hex(LOBBY), floor: LOBBY_H, pitch: 3, material: 'glass' }, canopy: { depth: 1.5, colour: hex(CANOPY) } },
  tiers: [
    { to: HEIGHT - PLANT_H, face: { kind: 'curtain', wall: hex(MULLION), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, solid: SOLID, material: 'glass' } },
    { to: HEIGHT, inset: PLANT_INSET, face: { kind: 'fins', wall: hex(PLANT), glass: hex(PLANT), pitch: 0.6, solid: 0.4, material: 'metal' } },
  ],
  crown: { kind: 'flat' },
})
