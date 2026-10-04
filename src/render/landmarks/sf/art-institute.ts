/**
 * THE SAN FRANCISCO ART INSTITUTE, 800 Chestnut on Russian Hill — two buildings on one block, both generic boxes
 * until 2026-10-04 (university audit: every other campus was modelled, this one was missed).
 *
 *  - The 1926 building (Bakewell & Brown; way/262432827, on Chestnut): Spanish Colonial Revival cast in board-formed
 *    concrete left grey-beige, red clay tile on every coping and roof; on Chestnut a long blank wall lettered
 *    SAN FRANCISCO ART INSTITUTE / 800 CHESTNUT, a carved Churrigueresque portal with a red door at its west end, and
 *    behind it the square bell tower with paired round-arched openings under a low tiled hip. The studio wings show
 *    tall gables, each with one huge round-headed studio window in red frames over a little balcony. (Commons:
 *    "SFAI.jpg", "SFAI Dec 21 2024.jpg", "San Francisco Art Institute courtyard.jpg".)
 *  - The 1969 addition (Paffard Keatinge-Clay; way/262432824, downhill to the north): board-formed concrete, a flat
 *    roof deck people use as a terrace, and on it a row of truncated concrete cones — the studios' skylights, their
 *    round glazed tops tilted to the sky (Commons: "San Francisco Art Institute addition.jpg").
 *
 * Front 180: Chestnut is south. Local +x is east (Jones Street), +z north (the bay).
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import type { Rgb } from '../../models.ts'
import { prism } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { tower, towerRing } from '../tower.ts'
import { roof } from '../kit.ts'
import { boxAlong, edgeAt, edgeFacing, signText } from '../parts.ts'

const CONCRETE: Rgb = [0.63, 0.62, 0.58]
const CARVED: Rgb = [0.8, 0.75, 0.65]
const TILE: Rgb = [0.56, 0.29, 0.21]
const RED: Rgb = [0.55, 0.14, 0.12]
const GLASS: Rgb = [0.2, 0.23, 0.26]
const DARK: Rgb = [0.12, 0.11, 0.1]

/** A wall of the ring and a box ON it: `u` along from its middle, `y` up, `o` proud. */
function wall(ring: ReturnType<typeof towerRing>, i: number) {
  const e = edgeAt(ring, i)
  const on = (out: MeshBuilder, u: number, y: number, o: number, w: number, h: number, d: number, c: Rgb, tag = surfaceTag('concrete')): void =>
    boxAlong(out, e.mid.x + e.tx * u + e.nx * o, y, e.mid.z + e.tz * u + e.nz * o, w / 2, h / 2, d / 2, e.heading, c, tag)
  return { e, on }
}

/** A round-headed opening on a wall: the shaft and the half-round head stepped in boxes. */
function archOn(out: MeshBuilder, on: ReturnType<typeof wall>['on'], u: number, y0: number, w: number, h: number, o: number, c: Rgb, tag = 0): void {
  const r = w / 2, shaft = h - r
  on(out, u, y0 + shaft / 2, o, w, shaft, 0.08, c, tag)
  const n = 6
  for (let k = 0; k < n; k++) {
    const a = ((k + 0.5) / n) * (Math.PI / 2)
    on(out, u, y0 + shaft + (r * k) / n + r / n / 2, o, 2 * r * Math.cos(a), r / n, 0.08, c, tag)
  }
}

export function sfaiMain(out: MeshBuilder, fit: Fit): void {
  const G = Math.max(0, fit.grade ?? 0)
  const H = G + 9
  tower(out, fit, {
    height: H,
    tiers: [{ to: H, face: { kind: 'blank', wall: CONCRETE, material: 'concrete' } }],
    roof: TILE,
    crown: { kind: 'parapet', height: 0.45, colour: TILE, material: 'tile' },
  })
  const ring = towerRing(fit)
  const front = wall(ring, edgeFacing(ring, 180))
  const { e, on } = front
  // u along Chestnut, east positive
  const east = e.tx >= 0 ? 1 : -1
  const L = e.L
  const at = (u: number): number => u * east
  // the lettering on the long wall, east of the portal
  const lx = e.mid.x + e.tx * at(L * 0.12) + e.nx * 0.06, lz = e.mid.z + e.tz * at(L * 0.12) + e.nz * 0.06
  signText(out, 'SAN FRANCISCO ART INSTITUTE', lx, G + 4.2, lz, 0.75, [0.2, 0.19, 0.17], { heading: e.heading })
  const nx = e.mid.x + e.tx * at(L * 0.02) + e.nx * 0.06, nz = e.mid.z + e.tz * at(L * 0.02) + e.nz * 0.06
  signText(out, '800 CHESTNUT', nx, G + 3, nz, 0.45, [0.2, 0.19, 0.17], { heading: e.heading })
  // the portal at the west end: a carved frame proud of the wall, the red door in a round arch, a broken pediment
  const pu = at(-L / 2 + 6)
  on(out, pu, G + 5.5, 0.6, 7, 11, 1.2, CARVED, surfaceTag('ashlar'))
  for (const s of [-1, 1]) on(out, pu + s * 2.6, G + 4, 1.4, 1, 8, 0.6, CARVED, surfaceTag('ashlar'))
  on(out, pu, G + 8.6, 1.5, 7.6, 0.6, 0.8, CARVED, surfaceTag('ashlar'))
  for (const s of [-1, 1]) {
    on(out, pu + s * 2.4, G + 10, 1.25, 2.6, 0.7, 0.6, CARVED, surfaceTag('ashlar'))
    on(out, pu + s * 1.6, G + 10.6, 1.25, 1, 1.2, 0.6, CARVED, surfaceTag('ashlar'))
  }
  archOn(out, on, pu, G, 3.2, 6.2, 1.25, RED, surfaceTag('clapboard'))
  // the bell tower, set back behind the portal
  const tu = pu + at(7), back = 7, T = 6, top = G + 26
  const tx = e.mid.x + e.tx * tu - e.nx * back, tz = e.mid.z + e.tz * tu - e.nz * back
  boxAlong(out, tx, (top - 4.5) / 2, tz, T / 2, (top - 4.5) / 2, T / 2, e.heading, CONCRETE, surfaceTag('concrete'))
  // the belfry: four corner piers and a centre mullion each side, the openings dark behind red railings
  for (let side = 0; side < 4; side++) {
    const hd = e.heading + (side * Math.PI) / 2
    const sx = Math.sin(hd), cz = Math.cos(hd)
    const P = (u: number, o: number): [number, number] => [tx + Math.cos(hd) * u + sx * o, tz - Math.sin(hd) * u + cz * o]
    const [ox, oz] = P(0, T / 2 - 0.4)
    boxAlong(out, ox, top - 2.4, oz, T / 2 - 0.6, 2, 0.1, hd, DARK, 0)
    for (const u of [-T / 2 + 0.35, 0, T / 2 - 0.35]) {
      const [px, pz] = P(u, T / 2 - 0.35)
      boxAlong(out, px, top - 2.6, pz, u === 0 ? 0.25 : 0.35, 1.9, 0.35, hd, CONCRETE, surfaceTag('concrete'))
    }
    for (const u of [-T / 4, T / 4]) {
      const [px, pz] = P(u, T / 2 - 0.35)
      for (let k = 0; k < 3; k++) boxAlong(out, px, top - 0.75 + k * 0.25, pz, (T / 4 - 0.25) * (1 - k * 0.3), 0.13, 0.35, hd, CONCRETE, surfaceTag('concrete'))
      const [rx, rz] = P(u, T / 2 - 0.1)
      boxAlong(out, rx, top - 4.1, rz, T / 4 - 0.4, 0.4, 0.04, hd, RED, surfaceTag('metal'))
    }
    // the slit windows down the shaft
    const [wx, wz] = P(0, T / 2 + 0.02)
    for (const y of [G + 11, G + 15, G + 18.5]) boxAlong(out, wx, y, wz, 0.3, 0.6, 0.03, hd, DARK, 0)
  }
  boxAlong(out, tx, top + 0.15, tz, T / 2 + 0.3, 0.15, T / 2 + 0.3, e.heading, CONCRETE, surfaceTag('concrete'))
  // a low tiled hip over the belfry (the tower's walls run near enough the world's axes on Chestnut's grid)
  const R = T / 2 + 0.4
  roof(out, tx - R, tx + R, tz - R, tz + R, top + 0.3, 1.6, R, R, TILE)
  // the studio gables on the Jones Street side: two tall gable fronts, each with its great arched window and balcony
  const side = wall(ring, edgeFacing(ring, 90))
  const S = side.e.L
  for (const k of [-1, 1]) {
    const gu = k * S * 0.24, gw = Math.min(14, S * 0.42)
    // the gable itself: a raking triangle of wall over the eaves, its tiled roof running back into the block
    const E = side.e, rise = 5, D = 12
    const W = (u: number, y: number, o: number): [number, number, number] => [E.mid.x + E.tx * u + E.nx * o, y, E.mid.z + E.tz * u + E.nz * o]
    const a = W(gu - gw / 2, H, 0.05), b = W(gu + gw / 2, H, 0.05), t = W(gu, H + rise, 0.05)
    out.quad([a, b, t, t], [E.nx, 0, E.nz], [[0, 0], [1, 0], [0.5, 1], [0.5, 1]], CONCRETE, surfaceTag('concrete'))
    out.quad([t, b, a, a], [-E.nx, 0, -E.nz], [[0, 0], [1, 0], [0.5, 1], [0.5, 1]], CONCRETE, surfaceTag('concrete'))
    for (const sgn of [-1, 1]) {
      const e0 = W(gu + sgn * (gw / 2 + 0.3), H - 0.15, 0.4), e1 = W(gu + sgn * (gw / 2 + 0.3), H - 0.15, -D)
      const r0 = W(gu, H + rise + 0.2, 0.4), r1 = W(gu, H + rise + 0.2, -D)
      const q: [number, number, number][] = sgn > 0 ? [e0, e1, r1, r0] : [e1, e0, r0, r1]
      out.quad(q, [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], TILE, surfaceTag('tile'))
      out.quad([...q].reverse() as [number, number, number][], [0, -1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], TILE, surfaceTag('tile'))
    }
    archOn(out, side.on, gu, H - 4.5, gw * 0.5, 7.5, 0.3, GLASS, surfaceTag('glass'))
    for (let m = -2; m <= 2; m++) side.on(out, gu + (m * gw * 0.5) / 5, H - 1.6, 0.34, 0.08, 6, 0.06, RED, surfaceTag('metal'))
    side.on(out, gu, H - 4.6, 0.8, gw * 0.55, 0.15, 1.2, CONCRETE)
    side.on(out, gu, H - 4.1, 1.35, gw * 0.55, 0.9, 0.06, RED, surfaceTag('metal'))
  }
}

export function sfaiAddition(out: MeshBuilder, fit: Fit): void {
  const H = fit.height > 6 && fit.height < 20 ? fit.height : 11
  tower(out, fit, {
    height: H,
    tiers: [{ to: H, face: { kind: 'bands', wall: CONCRETE, glass: GLASS, floor: 4.2, solid: 0.7, material: 'concrete' } }],
    roof: [0.66, 0.64, 0.6],
    crown: { kind: 'parapet', height: 1.1, colour: CONCRETE, material: 'concrete' },
  })
  // the skylight cones on the roof deck, in a row across the middle, each top a tilted glazed disc
  const ring = towerRing(fit)
  const e = edgeAt(ring, edgeFacing(ring, 0))
  const n = Math.max(2, Math.min(5, Math.floor(e.L / 9)))
  for (let k = 0; k < n; k++) {
    const u = -e.L / 2 + ((k + 0.5) * e.L) / n
    const x = e.mid.x + e.tx * u - e.nx * (Math.min(fit.hx, fit.hz) * 0.5), z = e.mid.z + e.tz * u - e.nz * (Math.min(fit.hx, fit.hz) * 0.5)
    prism(out, x, z, H, H + 3.2, 2.4, 16, CONCRETE, surfaceTag('concrete'), 1.5)
    prism(out, x, z, H + 3.2, H + 3.3, 1.45, 16, GLASS, surfaceTag('glass'), 1.45)
  }
}

export const ART_INSTITUTE: Record<string, (out: MeshBuilder, fit: Fit) => void> = { sfaiMain, sfaiAddition }
