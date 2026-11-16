/**
 * Manhattan Square (CH14, 1976, Henri-Bernard; OSM way/82467079): cream flats with rounded continuous balcony
 * fronts stepping back in terraces toward the top, over a beige-clad base on the dalle. Height 34.6 m from BD TOPO;
 * look from a Panoramax street frame (cream curved balcony bands, stepped crown).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 34.6, LOBBY_H = 4.5, FLOOR = 2.9, SOLID = 0.5, STEP1 = 0.78, STEP2 = 0.9, INSET1 = 2.5, INSET2 = 5
const BALCONY = '#ece6d8', WINDOW = '#5c6770', BASE = '#c9b393', ROOF = '#9a9690', PARAPET = '#e6e0d2'

export const manhattanSquare = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'blank', wall: hex(BASE), material: 'panel' } },
  tiers: [
    { to: STEP1, face: { kind: 'bands', wall: hex(BALCONY), glass: hex(WINDOW), floor: FLOOR, solid: SOLID, depth: 0.8, material: 'concrete' } },
    { to: STEP2, inset: INSET1, face: { kind: 'bands', wall: hex(BALCONY), glass: hex(WINDOW), floor: FLOOR, solid: SOLID, depth: 0.8, material: 'concrete' } },
    { to: 1, inset: INSET2, face: { kind: 'bands', wall: hex(BALCONY), glass: hex(WINDOW), floor: FLOOR, solid: SOLID, depth: 0.8, material: 'concrete' } },
  ],
  crown: { kind: 'parapet', height: 1, colour: hex(PARAPET), material: 'concrete' },
})
