/**
 * Tour Prisma (Courbevoie, 1999, 25 storeys; OSM way/853268366, ring is the prism plan). BD TOPO h 91.9 m.
 * Pale green-blue reflective glass prism (ladefense.fr/en/tour/prisma; renovation by Axel Schoenert, facade kept).
 * Photo fr.wikipedia File:Tour_Prisma_Juillet_2022.jpeg: sharp glass prism, blue-grey glass, a pale diagonal lattice
 * net over the faces, no setbacks.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower, type Face } from '../../tower.ts'

const HEIGHT = 91.9, LOBBY_H = 7
const MULLION = '#c9d0d4', GLASS = '#7f97a6', ROOF = '#8a8d8c', LOBBY = '#4f5e62', PARAPET = '#c4cfcf'
const FLOOR = 3.5, PITCH = 9, BRACE = 4

const glass: Face = { kind: 'xbrace', wall: hex(MULLION), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, brace: BRACE, material: 'glass' }
export const tourPrisma = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(MULLION), glass: hex(LOBBY), floor: LOBBY_H, pitch: 3, material: 'glass' } },
  tiers: [{ to: 1, face: glass }],
  crown: { kind: 'parapet', height: 1.5, colour: hex(PARAPET), material: 'glass' },
})
