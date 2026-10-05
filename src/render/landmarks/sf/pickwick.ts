/**
 * THE PICKWICK HOTEL, 85 5th Street at Mission (1926; way/1420679236, its light court way/1420679237). Hotel census
 * 2026-10-04 (Mapillary on 5th): ten storeys of dark red-brown brick, paired sash windows, a ground storey of tall
 * pointed Gothic arches in a buff stone band — and on the corner the tall vertical neon blade, PICKWICK HOTEL, red on
 * white, that the whole of 5th Street steers by. Was a generic `classical` box (and its court a `bauhaus` "2010s
 * residential tower").
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import type { Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { tower, towerRing } from '../tower.ts'
import { bladeSign, boxAlong, edgeAt } from '../parts.ts'

const BRICK: Rgb = [0.42, 0.2, 0.15]
const STONE: Rgb = [0.72, 0.6, 0.45]
const GLASS: Rgb = [0.18, 0.2, 0.22]

function body(out: MeshBuilder, fit: Fit, H: number): void {
  tower(out, fit, {
    height: H,
    base: { height: 5.5, face: { kind: 'punched', wall: STONE, glass: GLASS, pitch: 3.6, solid: 0.35, floor: 5.5, arched: true, material: 'ashlar' } },
    tiers: [{ to: H, face: { kind: 'punched', wall: BRICK, glass: GLASS, pitch: 2.2, solid: 0.5, floor: 3.4, material: 'brick' }, cornice: { depth: 0.4, height: 0.8, colour: STONE } }],
    roof: [0.4, 0.38, 0.36],
    crown: { kind: 'parapet', height: 0.9, colour: BRICK, material: 'brick' },
  })
}

export function pickwickHotel(out: MeshBuilder, fit: Fit): void {
  const H = fit.height > 30 && fit.height < 50 ? fit.height : 40
  body(out, fit, H)
  // the blade on the corner nearest 5th and Mission (the ring's southernmost-easternmost point)
  const ring = towerRing(fit)
  let best = 0
  for (let i = 1; i < ring.length; i++) if (ring[i].x - ring[i].z > ring[best].x - ring[best].z) best = i
  const e = edgeAt(ring, (best - 1 + ring.length) % ring.length)
  const c = ring[best]
  boxAlong(out, c.x, H - 9, c.z, 0.2, 9, 0.2, e.heading, [0.3, 0.3, 0.3], surfaceTag('metal'))
  bladeSign(out, c.x, H - 2, c.z, 22, 'PICKWICK HOTEL', { body: [0.95, 0.93, 0.88], letters: [0.85, 0.12, 0.1], width: 1.8, out: 1.6, heading: e.heading + Math.PI / 4 })
}

export function pickwickCourt(out: MeshBuilder, fit: Fit): void {
  body(out, fit, fit.height > 30 && fit.height < 50 ? fit.height : 40)
}

export const PICKWICK: Record<string, (out: MeshBuilder, fit: Fit) => void> = { pickwickHotel, pickwickCourt }
