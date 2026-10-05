/**
 * THE NEW MISSION THEATER, 2550 Mission Street (1916; remodelled by Timothy Pflueger, 1932; now the Alamo Drafthouse;
 * way/173122178). Historic-landmark census 2026-10-05 (it was a generic brick box), from Mapillary frames on Mission
 * Street: the long plain auditorium runs back west from a narrow front on Mission; on that front, square to the
 * street so it reads up and down it, the tall red-brick PYLON with NEW MISSION in cream letters down both faces, and
 * at its foot the red marquee over the entrance.
 *
 * The manifest gives `front: 90` (Mission is east): the fit turns local −z east, and the front is found by its
 * outward normal.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import type { Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { tower, towerRing } from '../tower.ts'
import { boxAlong, edgeAt, marquee, signText } from '../parts.ts'

const BRICK: Rgb = [0.52, 0.19, 0.14]
const CREAM: Rgb = [0.95, 0.9, 0.76]
const STUCCO: Rgb = [0.72, 0.67, 0.6]

export function newMissionTheater(out: MeshBuilder, fit: Fit): void {
  const G = Math.max(0, fit.grade ?? 0)
  const H = G + 14
  tower(out, fit, {
    height: H,
    tiers: [{ to: H, face: { kind: 'blank', wall: STUCCO, material: 'stucco' }, cornice: { depth: 0.3, height: 0.5, colour: STUCCO } }],
    roof: [0.42, 0.42, 0.42],
    crown: { kind: 'flat' },
  })
  const ring = towerRing(fit)
  let k = 0, s = -Infinity
  for (let i = 0; i < ring.length; i++) {
    const e = edgeAt(ring, i)
    const d = -e.nz * Math.min(1, e.L / 6)
    if (d > s) { s = d; k = i }
  }
  const e = edgeAt(ring, k)
  const brick = surfaceTag('brick')
  // the front: a red-brick face over the whole street end, the entrance dark under the marquee
  boxAlong(out, e.mid.x + e.nx * 0.15, G + 7, e.mid.z + e.nz * 0.15, e.L / 2, 7, 0.15, e.heading, BRICK, brick)
  boxAlong(out, e.mid.x + e.nx * 0.32, G + 1.8, e.mid.z + e.nz * 0.32, e.L * 0.32, 1.8, 0.04, e.heading, [0.12, 0.12, 0.13], 0)
  marquee(out, e.mid.x + e.nx * 0.3, G + 4.6, e.mid.z + e.nz * 0.3, Math.min(5.2, e.L / 2 - 0.3), 3, 'NEW MISSION',
    { body: [0.6, 0.17, 0.13], heading: e.heading })
  // the pylon, square to the street, standing out over the pavement from the front's middle
  const P = 4.6
  const cx = e.mid.x + e.nx * (P / 2 - 1), cz = e.mid.z + e.nz * (P / 2 - 1)
  const along = e.heading + Math.PI / 2
  // a brick shaft, not a sign's thin board: NEW small at its top, MISSION big down both faces, lit
  boxAlong(out, cx, G + 13, cz, P / 2, 13, 0.55, along, BRICK, brick)
  boxAlong(out, cx, G + 26.2, cz, P / 2 + 0.2, 0.25, 0.7, along, BRICK, brick)
  for (const sg of [-1, 1]) {
    const tx = cx + Math.sin(along) * sg * 0.58, tz = cz + Math.cos(along) * sg * 0.58
    const hd = sg > 0 ? along : along + Math.PI
    signText(out, 'NEW', tx, G + 24.4, tz, 0.9, CREAM, { lit: true, heading: hd })
    signText(out, 'MISSION', tx, G + 15, tz, 2.1, CREAM, { lit: true, vertical: true, heading: hd })
  }
}

export const NEW_MISSION: Record<string, (out: MeshBuilder, fit: Fit) => void> = { newMissionTheater }
