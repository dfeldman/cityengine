/**
 * GOLDEN GATE PARK's smaller buildings, from photographs (Golden Gate Park audit, 2026-10-04; PROGRESS.md's queue of
 * "candidates for the same treatment").
 *
 * McLAREN LODGE (1896, Edward R. Swain; the park's headquarters at the Fell/Stanyan entrance), way/159924616 — was a
 * generic box. Commons "McLarenLodge.jpg": walls of rough grey sandstone, red tile hipped roofs with little hipped
 * dormers, a two-storey entrance block standing forward with a round-arched loggia below and an open balcony above it,
 * and a run of round arches along the ground floor of the long wing beside it.
 *
 * THE STOW LAKE BOATHOUSE (way/120479803, "Blue Heron Lake Boathouse & Bike Rental"): a long low log-sided building
 * under a broad dark shingled roof with a gable over its middle, on a timber deck at the water (Commons, "Stow Lake
 * Boathouse.jpg").
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import type { Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { tower, towerRing } from '../tower.ts'
import { boxAlong, edgeAt, edgeFacing } from '../parts.ts'

const SANDSTONE: Rgb = [0.5, 0.49, 0.46]
const TILE: Rgb = [0.42, 0.21, 0.16]
const DARK: Rgb = [0.15, 0.15, 0.16]

export function mclarenLodge(out: MeshBuilder, fit: Fit): void {
  const H = 8
  tower(out, fit, {
    height: H,
    tiers: [{ to: H, face: { kind: 'punched', wall: SANDSTONE, glass: [0.2, 0.21, 0.22], pitch: 3.4, floor: 4, solid: 0.6, arched: true, material: 'ashlar' } }],
    roof: TILE,
    crown: { kind: 'hip', height: 3.5, inset: 0.2, colour: TILE, material: 'tile', dormers: 3 },
  })
  // the entrance block standing forward on the front: two storeys, the loggia's three arches below, the balcony over
  const ring = towerRing(fit)
  const e = edgeAt(ring, edgeFacing(ring))
  const st = surfaceTag('ashlar')
  const at = (u: number, o: number): [number, number] => [e.mid.x + e.tx * u + e.nx * o, e.mid.z + e.tz * u + e.nz * o]
  const u0 = -e.L * 0.18
  let [x, z] = at(u0, 2.5)
  boxAlong(out, x, 4.6, z, 5.5, 4.6, 2.5, e.heading, SANDSTONE, st)
  // its own hip roof
  for (let k = 0; k < 5; k++) {
    ;[x, z] = at(u0, 2.5)
    boxAlong(out, x, 9.4 + k * 0.6, z, 5.9 - k * 1.1, 0.3, 2.9 - k * 0.55, e.heading, TILE, surfaceTag('tile'))
  }
  // the loggia's three arches and the balcony's three openings, dark against the stone
  for (const du of [-3.4, 0, 3.4]) {
    ;[x, z] = at(u0 + du, 5.02)
    boxAlong(out, x, 1.6, z, 1.25, 1.6, 0.04, e.heading, DARK, 0)
    boxAlong(out, x, 3.3, z, 0.9, 0.25, 0.04, e.heading, DARK, 0)
    boxAlong(out, x, 6.3, z, 1.3, 1.3, 0.04, e.heading, DARK, 0)
  }
  // the balustrade across the balcony
  ;[x, z] = at(u0, 5.1)
  boxAlong(out, x, 5.3, z, 5.5, 0.4, 0.12, e.heading, [0.62, 0.6, 0.56], st)
  // the arcade along the long wing's ground floor
  for (let k = 0; k < 5; k++) {
    ;[x, z] = at(e.L * 0.08 + k * 3.2, 0.06)
    boxAlong(out, x, 1.6, z, 1.1, 1.6, 0.04, e.heading, DARK, 0)
  }
}

export function stowLakeBoathouse(out: MeshBuilder, fit: Fit): void {
  const LOG: Rgb = [0.36, 0.27, 0.2], ROOF: Rgb = [0.24, 0.22, 0.2], DECK: Rgb = [0.48, 0.4, 0.32]
  tower(out, fit, {
    height: 3.6,
    tiers: [{ to: 3.6, face: { kind: 'punched', wall: LOG, glass: [0.18, 0.18, 0.18], pitch: 3, floor: 3.6, solid: 0.55, material: 'clapboard' } }],
    roof: ROOF,
    crown: { kind: 'hip', height: 2.6, inset: -0.9, colour: ROOF, material: 'tile' },
  })
  // the gable over the middle of the lake front, and the deck along it at the water
  const ring = towerRing(fit)
  const e = edgeAt(ring, edgeFacing(ring))
  const at = (u: number, o: number): [number, number] => [e.mid.x + e.tx * u + e.nx * o, e.mid.z + e.tz * u + e.nz * o]
  for (let k = 0; k < 4; k++) {
    const [x, z] = at(0, 1.2)
    boxAlong(out, x, 4.0 + k * 0.55, z, 3.6 - k * 0.9, 0.28, 1.6, e.heading, ROOF, surfaceTag('tile'))
  }
  const [dx, dz] = at(0, 3.5)
  boxAlong(out, dx, 0.25, dz, e.L / 2, 0.25, 3, e.heading, DECK, surfaceTag('clapboard'))
  for (let u = -e.L / 2 + 1; u < e.L / 2; u += 3) {
    const [rx, rz] = at(u, 6.4)
    boxAlong(out, rx, 0.95, rz, 0.06, 0.45, 0.06, e.heading, LOG, 0)
  }
  const [rx, rz] = at(0, 6.4)
  boxAlong(out, rx, 1.4, rz, e.L / 2, 0.05, 0.06, e.heading, LOG, 0)
}

export const PARK_BUILDINGS: Record<string, (out: MeshBuilder, fit: Fit) => void> = { mclarenLodge, stowLakeBoathouse }
