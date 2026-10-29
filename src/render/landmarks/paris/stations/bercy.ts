import type { MeshBuilder } from '../../../buildings.ts'
import { capPolygon } from '../../../buildings.ts'
import type { Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { block, hex, prism, shade } from '../../kit.ts'
import { faceBand } from '../../tower.ts'
import { sign } from '../../parts.ts'
import { clipBox, frontOr } from './front.ts'
import { platforms } from './shed.ts'
import { BERCY_PARTS, BERCY_SHED } from './data.ts'

type P2 = { x: number; z: number }
const METAL = surfaceTag('metal')
const CONCRETE = surfaceTag('concrete')
const toP = (r: [number, number][]): P2[] => r.map(([x, z]) => ({ x, z }))

/**
 * The Gare de Bercy (1977), the low modern hall on the Boulevard de Bercy beside the Gare de Lyon's fan (reference:
 * Wikimedia Commons "Gare de Bercy, Paris 10 March 2011 001"). The gist: a long, low hall of brown brick and raw
 * concrete under a deep concrete fascia, glazed to the boulevard, and the long flat canopies down its platforms —
 * with the auto-train's covered track along its side.
 *
 * One model at its own point: OSM's outline (way 468790339, the hall and the covered track as one way, on layer 2)
 * and its three platform canopies (raised roofs the bake does not draw), in this entry's frame (stations/data.ts),
 * front −z to the boulevard (bearing 302°).
 */
export function gareDeBercy(out: MeshBuilder): void {
  const brick = hex('#8a5f4b')
  const concrete = hex('#bdb8ad')
  const glass: Rgb = [0.24, 0.3, 0.33]
  const ring = toP(BERCY_PARTS.hall[0].ring)
  const zHall = -144
  // ---- the hall along the boulevard, and its arm down the platforms' west side
  for (const [part, eaves] of [[clipBox(ring, -100, 100, -200, zHall), 8.2], [clipBox(ring, -100, -30, zHall, 0), 6.2]] as const) {
    if (part.length < 3) continue
    faceBand(out, part, 0, eaves, { kind: 'bands', wall: brick, glass, floor: eaves, solid: 0.45, material: 'brick' })
    faceBand(out, part, eaves, eaves + 1.6, { kind: 'blank', wall: concrete, material: 'concrete' })
    capPolygon(out, part, eaves + 1.6, hex('#7d7f80'), CONCRETE)
  }
  const zAt = frontOr(clipBox(ring, -100, 100, -200, zHall), -161)
  sign(out, { type: 'flat', text: 'GARE DE BERCY', h: 1.0, face: 'grotesque', weight: 'bold', colour: [0.95, 0.95, 0.92], lit: 'self', w: 30 },
    { x: -8, y: 9.0, z: zAt(-8) - 0.1, heading: Math.PI })
  // ---- the covered track: a flat concrete roof on two rows of columns, open beneath
  const cover = clipBox(ring, 0, 100, zHall, 300)
  if (cover.length >= 3) {
    capPolygon(out, cover, 7.4, shade(concrete, 0.9), CONCRETE)
    capPolygon(out, cover, 8.4, hex('#7d7f80'), CONCRETE)
    faceBand(out, cover, 7.4, 8.4, { kind: 'blank', wall: concrete, material: 'concrete' })
    const xs = cover.map((p) => p.x), zs = cover.map((p) => p.z)
    for (let z = Math.min(...zs) + 4; z < Math.max(...zs) - 2; z += 12) {
      for (const x of [Math.min(...xs) + 0.7, Math.max(...xs) - 0.7]) block(out, x - 0.35, x + 0.35, z - 0.35, z + 0.35, 0, 7.4, concrete)
    }
  }
  // ---- the platform canopies, each on a row of columns down its middle
  for (const c of BERCY_PARTS.canopy) {
    const r = toP(c.ring)
    capPolygon(out, r, 4.6, shade(concrete, 0.85), METAL)
    capPolygon(out, r, 5.0, hex('#9a9c9c'), METAL)
    faceBand(out, r, 4.6, 5.0, { kind: 'blank', wall: concrete, material: 'concrete' })
    const xs = r.map((p) => p.x), zs = r.map((p) => p.z)
    const x = (Math.min(...xs) + Math.max(...xs)) / 2
    for (let z = Math.min(...zs) + 3; z < Math.max(...zs) - 2; z += 10) prism(out, x, z, 0.76, 4.6, 0.18, 6, [0.3, 0.32, 0.33], METAL)
  }
  platforms(out, BERCY_SHED)
}
