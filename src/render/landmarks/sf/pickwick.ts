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
import { bladeSign, boxAlong, clockFace, edgeAt } from '../parts.ts'
import { box, strut } from '../../models.ts'
import { roof } from '../kit.ts'

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

/**
 * JAPANTOWN'S YAGURA CLOCK TOWER, at the Post Street entrance to the Buchanan Street mall (Commons
 * "Japantown-plaza-14jul2005.jpg": "looking across Post Street north on Buchanan Street"; Mapillary at Post and
 * Buchanan, 2026-10-05). A Japanese fire-watch tower in timber: four tall dark-stained legs, cross-braced, carrying a
 * red-brown box with a clock on each of its four faces under a small roof. The clocks tell the time (render/clocks.ts).
 * Standalone, centred between the legs.
 */
export function japantownYagura(out: MeshBuilder, _fit: Fit): void {
  const WOOD: Rgb = [0.3, 0.22, 0.16], BOX: Rgb = [0.48, 0.24, 0.18], ROOF: Rgb = [0.24, 0.22, 0.2]
  const wood = surfaceTag('clapboard')
  const L = 1.5, H = 9
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) box(out, sx * L, H / 2, sz * L, 0.16, H / 2, 0.16, WOOD, wood)
  // cross-bracing on each side, and a rail every few metres
  for (const [ax, az, bx, bz] of [[-1, -1, 1, -1], [1, -1, 1, 1], [1, 1, -1, 1], [-1, 1, -1, -1]]) {
    for (const y of [2, 5.5]) {
      strut(out, [ax * L, y, az * L], [bx * L, y + 3, bz * L], 0.08, 0.08, WOOD, wood)
      strut(out, [bx * L, y, bz * L], [ax * L, y + 3, az * L], 0.08, 0.08, WOOD, wood)
    }
    for (const y of [2, 5.5, H]) strut(out, [ax * L, y, az * L], [bx * L, y, bz * L], 0.1, 0.1, WOOD, wood)
  }
  // the clock box and its roof
  const B = 1.6
  box(out, 0, H + 1.4, 0, B, 1.4, B, BOX, wood)
  roof(out, -B - 0.5, B + 0.5, -B - 0.5, B + 0.5, H + 2.8, 1.2, B + 0.5, B + 0.5, ROOF)
  for (const [nx, nz] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) clockFace(out, nx * (B + 0.02), H + 1.4, nz * (B + 0.02), nx, nz, 1.05, { dial: [0.95, 0.94, 0.9], rim: [0.2, 0.18, 0.16] })
}

export const PICKWICK: Record<string, (out: MeshBuilder, fit: Fit) => void> = { pickwickHotel, pickwickCourt, japantownYagura }
