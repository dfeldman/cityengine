/**
 * Opus 12 (ex-PB12 / Tour Crédit Lyonnais, Puteaux, 1973 by Dubuisson, re-skinned 2002–04 by Valode & Pistre; OSM
 * way/19449852): a 27-storey shaft in bright sky-blue reflective glass with a fine pale grid and a flush flat top
 * (fr.wikipedia photo Tour_Opus_12_Novembre_2021.jpeg). Height: BD TOPO batiment hauteur 103.1 m (Wikipedia 100 m).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 103.1
const LOBBY_H = 7
const GLASS = '#6f9cc4', MULLION = '#b8c8d6', ROOF = '#6c7680', LOBBY = '#2f4252'
const FLOOR = 3.7, PITCH = 1.35, PARAPET_H = 1.8

export const tourOpus12 = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(MULLION), glass: hex(LOBBY), floor: LOBBY_H, pitch: 3, material: 'glass' } },
  tiers: [{ to: 1, face: { kind: 'curtain', wall: hex(MULLION), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, material: 'glass' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(MULLION), material: 'metal' },
})
