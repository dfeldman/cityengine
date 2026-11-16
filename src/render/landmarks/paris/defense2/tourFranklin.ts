/**
 * Tour Franklin (Puteaux, 1972, 33 storeys of offices; Delb, Chesnau, Verola, Lalande; OSM way/64212582 PB3 +
 * way/64212673 PB4, one union ring, no parts): "a smaller tower merged into a larger one" (en.wikipedia). Photo
 * (en.wikipedia page image File:Franklin.JPG) shows two near-black bronze-smoked glass slabs side by side, the taller
 * one standing a few storeys above the other, with faint vertical mullion lines. One of the owner's genuinely dark
 * towers. Heights: fr.wikipedia 115 m roof; the lower slab estimated from the photo (~6 storeys lower).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower, type TowerSpec } from '../../tower.ts'

const HEIGHT = 115, LOW_H = 98
/** where the union ring is cut along its long axis (local x, -1..1 of hx), and which side is the taller slab */
const SPLIT = 0.15, TALL_POSITIVE = true
const LOBBY_H = 6
const MULLION = '#2d2a27', GLASS = '#1c1d1f', ROOF = '#3d3c3a', LOBBY = '#1a1d20', LOBBY_WALL = '#36332f', PARAPET = '#2a2826'
const FLOOR = 3.4, PITCH = 1.5, PARAPET_H = 2

type P = { x: number; z: number }
/** Sutherland–Hodgman clip of a ring to the half-plane s·(x - c) >= 0. */
function clip(ring: P[], c: number, s: number): P[] {
  const out: P[] = []
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length]
    const da = s * (a.x - c), db = s * (b.x - c)
    if (da >= 0) out.push(a)
    if (da * db < 0) { const t = da / (da - db); out.push({ x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t }) }
  }
  return out
}

const spec = (h: number): TowerSpec => ({
  height: h, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(LOBBY_WALL), glass: hex(LOBBY), floor: LOBBY_H, pitch: 3, material: 'glass' } },
  tiers: [{ to: 1, face: { kind: 'curtain', wall: hex(MULLION), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, material: 'glass' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET), material: 'metal' },
})

export const tourFranklin = (out: MeshBuilder, fit: Fit): void => {
  const ring: P[] = fit.ring && fit.ring.length >= 3 ? fit.ring : [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  const c = SPLIT * fit.hx, s = TALL_POSITIVE ? 1 : -1
  const tall = clip(ring, c, s), low = clip(ring, c, -s)
  if (tall.length >= 3) tower(out, { ...fit, ring: tall, height: HEIGHT }, spec(HEIGHT))
  if (low.length >= 3) tower(out, { ...fit, ring: low, height: LOW_H }, spec(LOW_H))
}
