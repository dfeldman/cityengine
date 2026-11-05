/**
 * Les Gémeaux (Courbevoie, 1974, ~82 m, 22 storeys of flats and offices; OSM way/82322820, no parts): OSM draws one
 * long ring, a fat block at each end joined by a narrow strip. Built as the twins the name says: the two end blocks
 * rise the full 82 m, the strip between is a low link. Ribbon bands of blue-grey glass between pale spandrels, a
 * dark recessed lobby and a plant parapet. From memory of photographs; tones and the cut positions are the thing to check.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower, type TowerSpec } from '../../tower.ts'

const HEIGHT = 82
const LOBBY_H = 5
const WALL = '#b9b5ac', GLASS = '#4d5f6e', ROOF = '#6b6965', LOBBY = '#2a2d30', PARAPET = '#8f8c86'
const FLOOR = 3.5, SOLID = 0.4, PARAPET_H = 2.5
/** where the ring is cut into west tower / link / east tower, as fractions of the half-length along the long axis (-1..1) */
const CUT_W = -0.58, CUT_E = 0.34
/** the link between the twins, metres tall (its lobby is the tower's) */
const LINK_H = 21

type P2 = { x: number; z: number }
/** Sutherland–Hodgman against the half-plane keep(p) >= 0 along x */
const clipX = (ring: P2[], x0: number, keepAbove: boolean): P2[] => {
  const d = (p: P2) => (keepAbove ? p.x - x0 : x0 - p.x)
  const out: P2[] = []
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length]
    const da = d(a), db = d(b)
    if (da >= 0) out.push(a)
    if ((da >= 0) !== (db >= 0)) { const t = da / (da - db); out.push({ x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t }) }
  }
  return out
}

const spec = (height: number, lobby: boolean): TowerSpec => ({
  height, roof: hex(ROOF),
  base: lobby ? { height: LOBBY_H, face: { kind: 'blank', wall: hex(LOBBY), material: 'concrete' } } : undefined,
  tiers: [{ to: 1, face: { kind: 'bands', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, solid: SOLID, material: 'concrete' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET) },
})

export const lesGemeaux = (out: MeshBuilder, fit: Fit): void => {
  const ring = fit.ring
  if (!ring || ring.length < 3) return tower(out, fit, spec(HEIGHT, true))
  const H = fit.height > 0.6 * HEIGHT && fit.height < 1.6 * HEIGHT ? fit.height : HEIGHT
  const xw = CUT_W * fit.hx, xe = CUT_E * fit.hx
  const west = clipX(ring, xw, false), east = clipX(ring, xe, true), link = clipX(clipX(ring, xw, true), xe, false)
  for (const [r, h, lobby] of [[west, H, true], [east, H, true], [link, LINK_H, true]] as const)
    if (r.length >= 3) tower(out, { ...fit, ring: r, height: h }, spec(h, lobby))
}
