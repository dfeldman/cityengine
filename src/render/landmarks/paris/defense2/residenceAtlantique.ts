/**
 * Atlantique (Courbevoie; OSM way/1311610926, 17 levels; BD TOPO h 52 m): a white residential slab wrapped in continuous
 * balcony slabs every floor, glazed balustrades and blue-grey windows behind, set on a fully glazed ground-floor pavilion
 * (Panoramax street frame). Balcony ledges are tower() cornices, one per floor.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 52
const LOBBY_H = 5
const WALL = '#f1f0eb', GLASS = '#8ea3b3', ROOF = '#9d9b95', LOBBY_GLASS = '#7f97a8', LOBBY_WALL = '#e6e5e0', SLAB = '#f6f5f1'
const FLOOR = 2.75, BALCONY = 1.3, SLAB_H = 0.3, PARAPET_H = 1.2

const balconies = () => Array.from({ length: Math.floor((HEIGHT - LOBBY_H) / FLOOR) }, (_, i) =>
  ({ at: LOBBY_H + FLOOR * (i + 1), depth: BALCONY, height: SLAB_H, colour: hex(SLAB) }))

export const residenceAtlantique = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(LOBBY_WALL), glass: hex(LOBBY_GLASS), floor: LOBBY_H, pitch: 2.5, material: 'glass' } },
  tiers: [{ to: 1, face: { kind: 'bands', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, solid: 0.35, material: 'concrete' } }],
  cornices: balconies(),
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(SLAB) },
})