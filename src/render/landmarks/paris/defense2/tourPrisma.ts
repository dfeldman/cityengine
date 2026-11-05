/**
 * Tour Prisma (Courbevoie, 1988 as Tour GAN Eurocourtage/Kvaerner, 97 m, 25 office storeys; OSM way/853268366, no
 * parts): a faceted glass shaft on OSM's ring in blue-green reflective curtain glass with pale horizontal spandrel
 * bands, a glazed lobby and a low plant parapet. From memory of photographs; the glass tone is the thing to check.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 97
const LOBBY_H = 6
const WALL = '#9aa6a8', GLASS = '#3d6272', ROOF = '#5f686b', LOBBY = '#2b3d46', LOBBY_WALL = '#5d676b'
const FLOOR = 3.7, PITCH = 1.6, PARAPET_H = 2.5, PARAPET = '#707a7d'

export const tourPrisma = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(LOBBY_WALL), glass: hex(LOBBY), floor: LOBBY_H, pitch: 3, material: 'glass' } },
  tiers: [{ to: 1, face: { kind: 'curtain', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, material: 'glass' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET), material: 'metal' },
})
