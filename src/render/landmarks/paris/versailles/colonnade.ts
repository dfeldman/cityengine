/**
 * THE BOSQUET DE LA COLONNADE at Versailles (Jules Hardouin-Mansart, 1685; OSM way/23731243 is its pedestrian ring, 44 m across):
 * a circular peristyle of 32 arches on 64 Ionic columns paired at the piers, in Languedoc red, blue-grey and white marble, a keyed
 * arch in every bay with a white marble basin and a small jet at its foot, a cornice over it and an urn above each pier. The
 * Rape of Proserpine in the middle is a separate GLB: a plain round plinth stands for it.
 *
 * Frame: x east, z north (entry `front: 180`), centred on the ring. Tunables are the COLONNADE constants.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { classicalColumn, disc, hex, prism, shade } from '../../kit.ts'
import { boxAlong } from '../../parts.ts'

const COLONNADE = {
  /** arches round the ring (the columns are twice this, paired at the piers) */
  arches: 32,
  /** radius to the column centres, metres */
  radius: 15.4,
  /** the stylobate's height, the columns' shaft height, a column's foot radius, how far apart a pier's pair stand */
  base: 0.35, shaft: 3.3, col: 0.27, pair: 0.42,
  /** half-width of a pier past the pair, the wall's half-thickness, the entablature's height and how far the cornice juts */
  pier: 0.72, wall: 0.4, frieze: 0.5, cornice: 0.28, jut: 0.45,
  /** the spandrel's height over the arch crown, the slices a bay's spandrel is cut into, the urns' height */
  crown: 0.45, slices: 8, urn: 0.95,
  /** basins: how far inboard of the columns, foot radius, rim radius, height; jet speed (m/s) */
  basinIn: 1.5, basinFoot: 0.32, basinRim: 0.95, basinH: 0.45, jet: 3.2,
  /** the plinth in the middle: step radius and height, plinth radius and height */
  step: [2.8, 0.3] as [number, number], plinth: [1.9, 1.7] as [number, number],
  /** marbles, cycled round the piers: Languedoc red, blue-grey (bleu turquin), white; the stone and the basins */
  marbles: ['#9c4538', '#6c7b8c', '#e6e2d8'], stone: '#d8d0bc', white: '#ece9e0', water: '#6f9bb0',
}

export function versaillesColonnade(out: MeshBuilder, fit: Fit): void {
  const C = COLONNADE, y = Math.max(0, fit.grade ?? 0), N = C.arches, R = C.radius
  const STONE = hex(C.stone), WHITE = hex(C.white), WATER = hex(C.water), MARBLE = C.marbles.map(hex)
  const tag = surfaceTag('ashlar')
  const step = (2 * Math.PI) / N, chord = 2 * R * Math.sin(step / 2), mid = R * Math.cos(step / 2)
  const open = chord / 2 - C.pier, ySpr = y + C.base + C.shaft
  const yWall = ySpr + open + C.crown, yEnt = yWall + C.frieze
  const heading = (a: number): number => Math.atan2(Math.cos(a), -Math.sin(a)) // local x along the tangent at angle a
  const at = (a: number, r: number, u: number): [number, number] => [Math.cos(a) * r - Math.sin(a) * u, Math.sin(a) * r + Math.cos(a) * u]

  for (let i = 0; i < N; i++) {
    const a = i * step, h = heading(a)
    // the stylobate under the bay and the wall's slices over the arch (the arch is their lower edge)
    const [bx, bz] = at(a, mid, 0)
    boxAlong(out, bx, y + C.base / 2, bz, chord / 2, C.base / 2, 0.9, h, shade(STONE, 0.9), tag)
    const K = C.slices, sw = chord / K
    for (let k = 0; k < K; k++) {
      const u = -chord / 2 + (k + 0.5) * sw
      const yb = Math.abs(u) < open ? ySpr + Math.sqrt(open * open - u * u) : ySpr
      const [sx, sz] = at(a, mid, u)
      boxAlong(out, sx, (yb + yWall) / 2, sz, sw / 2 + 0.01, (yWall - yb) / 2, C.wall, h, STONE, tag)
    }
    // the keystone, a little proud on the outer face and the inner
    for (const s of [-1, 1]) {
      const [kx, kz] = at(a, mid + s * (C.wall + 0.04), 0)
      boxAlong(out, kx, ySpr + open - 0.1, kz, 0.2, 0.3, 0.08, h, shade(STONE, 1.08), tag)
    }
    // entablature: a frieze and a cornice that juts both ways
    const [ex, ez] = at(a, mid, 0)
    boxAlong(out, ex, yWall + C.frieze / 2, ez, chord / 2 + 0.02, C.frieze / 2, C.wall + 0.05, h, shade(STONE, 0.96), tag)
    boxAlong(out, ex, yEnt + C.cornice / 2, ez, chord / 2 + 0.05, C.cornice / 2, C.wall + C.jut, h, shade(STONE, 1.06), tag)
    // the basin on the inside, white marble, with its water and its jet
    const [px, pz] = at(a, R - C.basinIn, 0)
    const yb0 = y
    prism(out, px, pz, yb0, yb0 + C.basinH * 0.7, C.basinFoot, 8, WHITE, tag)
    prism(out, px, pz, yb0 + C.basinH * 0.7, yb0 + C.basinH, C.basinFoot * 1.5, 10, WHITE, tag, C.basinRim, false)
    disc(out, px, yb0 + C.basinH - 0.04, pz, C.basinRim * 0.88, WATER, tag, 10)
    out.water.push({ kind: 'jet', at: [px, yb0 + C.basinH - 0.04, pz], v: [0, C.jet, 0], width: 0.05 })

    // the pier half a step on: a pair of Ionic columns on a plinth, an impost over them, and an urn on the cornice
    const ap = a + step / 2, hp = heading(ap)
    const [qx, qz] = at(ap, R, 0)
    boxAlong(out, qx, ySpr + 0.15, qz, C.pier, 0.15, C.wall + 0.12, hp, shade(STONE, 1.05), tag)
    for (const s of [-1, 1]) {
      const [cx, cz] = at(ap, R, s * C.pair)
      // inner and outer columns of the pair are side by side along the ring; their marbles alternate round the ring
      const col = MARBLE[(i * 2 + (s > 0 ? 1 : 0)) % MARBLE.length]
      classicalColumn(out, cx, cz, y + C.base, ySpr, C.col, col, { order: 'ionic', tier: 'mid', heading: Math.PI / 2 - ap, trim: shade(WHITE, 0.98), tag })
    }
    boxAlong(out, qx, yEnt + C.cornice + 0.1, qz, 0.35, 0.1, 0.35, hp, shade(STONE, 1.06), tag)
    prism(out, qx, qz, yEnt + C.cornice + 0.2, yEnt + C.cornice + C.urn * 0.5, 0.22, 8, STONE, tag, 0.3, false)
    prism(out, qx, qz, yEnt + C.cornice + C.urn * 0.5, yEnt + C.cornice + C.urn, 0.3, 8, STONE, tag, 0.16)
  }
  // the plinth for the Rape of Proserpine (its group is a GLB)
  prism(out, 0, 0, y, y + C.step[1], C.step[0], 20, shade(STONE, 0.95), tag)
  prism(out, 0, 0, y + C.step[1], y + C.plinth[1], C.plinth[0], 16, shade(STONE, 1.02), tag, C.plinth[0] * 0.92)
}

export const VERSAILLES_COLONNADE = { versaillesColonnade }
