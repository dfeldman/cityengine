/**
 * 30 OTIS STREET (2023; OSM building:part way/1411169908, 26 storeys, 76 m), at Otis and South Van Ness. Tall-building
 * census 2026-10-05, from Mapillary on South Van Ness: a white tower gridded close in a fine white frame of floor bands
 * and mullions, with a full-height slot of blue glass down its South Van Ness (east) face. Was a dark grey `bauhaus`
 * punched box. Front 90.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import type { Rgb } from '../../models.ts'
import { tower, towerRing } from '../tower.ts'
import { edgeAt, edgeFacing, faceOn } from '../parts.ts'

const WHITE: Rgb = [0.9, 0.9, 0.88]
const GLASS: Rgb = [0.3, 0.4, 0.5]
const BLUE: Rgb = [0.32, 0.47, 0.64]

export function thirtyOtis(out: MeshBuilder, fit: Fit): void {
  const H = fit.height > 40 ? fit.height : 76
  tower(out, fit, {
    height: H,
    base: { height: 6, face: { kind: 'curtain', wall: [0.35, 0.36, 0.38], glass: [0.25, 0.3, 0.34], pitch: 3, floor: 6 } },
    tiers: [{ to: H, face: { kind: 'punched', wall: WHITE, glass: GLASS, pitch: 1.6, solid: 0.32, floor: 2.9, material: 'concrete' } }],
    roof: [0.6, 0.6, 0.6],
    crown: { kind: 'parapet', height: 1.2, colour: WHITE },
  })
  // the blue glass slot: a curtain over the middle of the east face, a hand proud of it, base to parapet (which edge
  // is east was measured: edgeFacing's default put it on the south face here)
  const ring = towerRing(fit)
  const e = edgeAt(ring, edgeFacing(ring, 90))
  const w = e.L * 0.4
  const a = { x: e.mid.x - e.tx * w / 2, z: e.mid.z - e.tz * w / 2 }, b = { x: e.mid.x + e.tx * w / 2, z: e.mid.z + e.tz * w / 2 }
  if (e.L > 4) faceOn(out, [a, b], 0, 6, H + 1.2, { kind: 'curtain', wall: BLUE, glass: BLUE, pitch: 1.5, floor: 2.9, material: 'metal' }, 0.12)
}

export const THIRTY_OTIS: Record<string, (out: MeshBuilder, fit: Fit) => void> = { thirtyOtis }
