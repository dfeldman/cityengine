/**
 * FORT POINT (1861; relation/5504536), under the Golden Gate Bridge's south arch. Was a generic 3-level brick
 * building. The owner, 2026-10-02: "I do really want to have … Fort Point".
 *
 * The gist: a brick casemate fort, four storeys of it in a trapezoid round an open PARADE GROUND, its bay faces a wall
 * of three tiers of arched gun rooms (the casemates), the landward side the plainer barracks block; a granite course at
 * the foot; the BARBETTE tier on top — the open gun platform behind a parapet — with the little iron LIGHTHOUSE on the
 * parapet; the SEAWALL along the water, where the surf breaks (the `fort-point-surf` zone).
 *
 * Fitted to OSM's outline; the bay-facing sides are the ones away from the fit's centre of land, which for this fort is
 * all but the south-east (landward) side — so the casemate arches go on every face but the one nearest the land, found
 * from the ground.
 */
import type { MeshBuilder } from '../../buildings.ts'
import { capPolygon } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import type { Rgb } from '../../models.ts'
import { prism } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { faceBand, insetRing, towerRing } from '../tower.ts'
import { boxAlong, edgeAt } from '../parts.ts'

const BRICK: Rgb = [0.56, 0.33, 0.25]
const BRICK_DARK: Rgb = [0.42, 0.24, 0.19]
const GRANITE: Rgb = [0.66, 0.64, 0.6]
const ARCH: Rgb = [0.12, 0.1, 0.1]
const PARADE: Rgb = [0.58, 0.55, 0.5]
const IRON: Rgb = [0.18, 0.2, 0.2]

export function fortPoint(out: MeshBuilder, fit: Fit): void {
  const ring = towerRing(fit)
  const court = insetRing(ring, Math.min(fit.hx, fit.hz) * 0.42)
  const H = 18
  const brick = surfaceTag('brick')
  const stone = surfaceTag('granite')
  // the walls, outside and in, with the granite foot
  faceBand(out, ring, 0, 2.2, { kind: 'blank', wall: GRANITE, material: 'granite' })
  faceBand(out, ring, 2.2, H, { kind: 'blank', wall: BRICK, material: 'brick' })
  // the parade ground's walls face in: the same band on the inner ring, reversed so its faces look into the court
  faceBand(out, [...court].reverse(), 0, H, { kind: 'punched', wall: BRICK, glass: ARCH, pitch: 4.2, floor: 4.4, solid: 0.45, material: 'brick' })
  // the roof between them: the barbette tier, and the parade ground's floor
  capPolygon(out, ring, H, [0.5, 0.48, 0.45], stone)
  capPolygon(out, court, 0.15, PARADE, stone)
  // the parapet round the top, and the casemate arches: three tiers on each face
  faceBand(out, ring, H, H + 1.6, { kind: 'blank', wall: BRICK_DARK, material: 'brick' })
  for (let i = 0; i < ring.length; i++) {
    const e = edgeAt(ring, i)
    if (e.L < 8) continue
    const n = Math.max(2, Math.round(e.L / 4.4))
    for (let tier = 0; tier < 3; tier++) {
      const y = 3.2 + tier * 4.8
      for (let k = 0; k < n; k++) {
        const t = (k + 0.5) / n
        // the dark arch, and its round head, set into the brick
        boxAlong(out, e.a.x + e.tx * e.L * t + e.nx * 0.04, y + 1.2, e.a.z + e.tz * e.L * t + e.nz * 0.04, 0.75, 1.2, 0.05, e.heading, ARCH, brick)
        boxAlong(out, e.a.x + e.tx * e.L * t + e.nx * 0.05, y + 2.55, e.a.z + e.tz * e.L * t + e.nz * 0.05, 0.5, 0.18, 0.05, e.heading, ARCH, brick)
      }
      // the string course under each tier
      boxAlong(out, e.a.x + e.tx * e.L * 0.5 + e.nx * 0.1, y - 0.6, e.a.z + e.tz * e.L * 0.5 + e.nz * 0.1, e.L / 2, 0.15, 0.1, e.heading, GRANITE, stone)
    }
  }
  // the lighthouse: a small iron hexagonal tower on the parapet at the bay end
  const far = ring.reduce((a, p) => (Math.hypot(p.x, p.z) > Math.hypot(a.x, a.z) ? p : a), ring[0])
  const lx = far.x * 0.8, lz = far.z * 0.8
  prism(out, lx, lz, H, H + 7, 1.6, 6, IRON, surfaceTag('metal'), 1.0)
  prism(out, lx, lz, H + 7, H + 9, 1.3, 8, [0.85, 0.82, 0.62], surfaceTag('glass'))
  prism(out, lx, lz, H + 9, H + 10, 1.5, 8, IRON, surfaceTag('metal'), 0.2)
  // the seawall round the water side, a little out from the walls
  const wall = insetRing(ring, -9)
  faceBand(out, wall, -2, 1.5, { kind: 'blank', wall: GRANITE, material: 'granite' })
}
