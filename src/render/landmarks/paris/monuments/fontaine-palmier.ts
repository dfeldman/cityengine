import type { MeshBuilder } from '../../../buildings.ts'
import { prism, type Rgb } from '../../../models.ts'
import { beam, block, hex, lathe, shade } from '../../kit.ts'
import { roundRing } from '../../parts.ts'
import type { Fit } from '../../fit.ts'
import { fitted } from '../palaces/common.ts'
import { FIXED, ring } from './common.ts'
import { basin, blob, circle, G, set, spout } from './plaza-common.ts'

/*
 * THE FONTAINE DU PALMIER (Napoleon's order of 1806, the column of 1808, Louis-Simon Boizot's figures; Gabriel Davioud's
 * lower basin and Henri-Alfred Jacquemart's sphinxes of the Second Empire), the middle of the Place du Châtelet between the two theatres. What the place reads:
 * the thin shaft ringed with bands, its top a tuft of palm leaves, the gilt VICTORY with her wreaths up in both hands; at its
 * foot four allegories against the shaft; the square pedestal with the eagle and four urns; the four SPHINXES, one to a
 * side, spouting into the round basin. OSM (way 261092850, 9.9 × 10 m) is the upper basin; the model's frame is its axes.
 * Heights and the kerb's size by proportion from a Commons elevation (Paris 1 - Fontaine du Palmier.jpg), scaled on OSM's
 * 10 m: the reference gave no height in metres. Four-square: the four faces are alike.
 */
const STONE: Rgb = hex('#c9c2b1')
const PALE: Rgb = hex('#d8d2c4')
const DARK: Rgb = hex('#a9a395')
const WATER: Rgb = hex('#5d8596')
const SPRAY: Rgb = hex('#dbe7ea')
const GILT: Rgb = hex('#d2a632')

const R = 8

/** A sphinx lying on y = 0, facing +z, its head-dress wide at the shoulders, about 2.2 m long. */
function sphinx(q: MeshBuilder): void {
  beam(q, [0, 0.42, -1.0], [0, 0.52, 0.2], 0.5, STONE, 0.4)
  blob(q, 0, 0.45, -0.95, 0.55, 0.45, 0.45, STONE, 7, 4)
  for (const s of [-1, 1]) {
    beam(q, [s * 0.28, 0.12, 0.1], [s * 0.28, 0.1, 1.1], 0.14, STONE, 0.1)     // the paws
  }
  beam(q, [0, 0.55, 0.2], [0, 1.2, 0.42], 0.45, STONE, 0.3)                     // the breast
  blob(q, 0, 1.42, 0.42, 0.56, 0.42, 0.34, PALE, 7, 4)                          // the nemes, wide at the shoulders
  blob(q, 0, 1.68, 0.52, 0.27, 0.34, 0.26, PALE, 6, 4)                          // the face
}

function urn(q: MeshBuilder, x: number, z: number, y: number): void {
  lathe(q, x, z, [[0.2, y], [0.13, y + 0.2], [0.32, y + 0.55], [0.36, y + 0.85], [0.26, y + 1.15], [0.34, y + 1.25]], 8, PALE)
}

function draw(q: MeshBuilder): void {
  // the round kerb and its water
  basin(q, circle(R, 32), circle(R - 0.45, 32), 0, G + 0.45, STONE, WATER)
  // the upper basin: a square with its corners rounded right off (OSM's way), its four spout piers standing out of it
  const up = roundRing(ring([-4.95, -4.95, 4.95, -4.95, 4.95, 4.95, -4.95, 4.95]), 2.6, 5)
  basin(q, up, roundRing(ring([-4.5, -4.5, 4.5, -4.5, 4.5, 4.5, -4.5, 4.5]), 2.4, 5), 0, G + 2.1, STONE, WATER)
  for (const [ax, az] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
    const ux = ax === 0 ? 1.0 : 0
    const uz = az === 0 ? 1.0 : 0
    // the spout's pier, standing a little out of the basin into the kerb's water: a sphinx's bed
    block(q, Math.min(ax * 2.2, ax * 5.45) - ux, Math.max(ax * 2.2, ax * 5.45) + ux, Math.min(az * 2.2, az * 5.45) - uz, Math.max(az * 2.2, az * 5.45) + uz, 0, G + 2.35, shade(STONE, 0.96))
    block(q, Math.min(ax * 2.2, ax * 5.55) - ux - 0.1, Math.max(ax * 2.2, ax * 5.55) + ux + 0.1, Math.min(az * 2.2, az * 5.55) - uz - 0.1, Math.max(az * 2.2, az * 5.55) + uz + 0.1, G + 2.35, G + 2.5, PALE)
  }
  // the pedestal, and over its cornice the shaft's die, with the eagle on each face
  const top = G + 2.5
  block(q, -2.25, 2.25, -2.25, 2.25, 0, top + 2.3, STONE)
  block(q, -2.55, 2.55, -2.55, 2.55, top + 2.3, top + 2.6, PALE)
  const die = top + 2.6
  block(q, -1.2, 1.2, -1.2, 1.2, die, die + 3.0, STONE)
  block(q, -1.55, 1.55, -1.55, 1.55, die + 3.0, die + 3.4, PALE)
  for (let k = 0; k < 4; k++) {
    const a = (k * Math.PI) / 2
    const sx = Math.sin(a)
    const cz = Math.cos(a)
    // the sphinx, its back to the pedestal, on its pier; and the water from its mouth, far out into the basin
    set(q, sx * 3.3, top, cz * 3.3, a, 1.65, sphinx)
    spout(q, [sx * 4.3, top + 2.3, cz * 4.3], [sx * 7.2, G + 0.4, cz * 7.2], 0.5, 0.05, SPRAY)
    // the eagle spread on the die
    const e = 1.24
    const ex = sx * e
    const ez = cz * e
    const tx = cz
    const tz = -sx
    const y = die + 1.6
    beam(q, [ex, y - 0.5, ez], [ex, y + 0.35, ez], 0.17, PALE, 0.08)
    beam(q, [ex, y + 0.25, ez], [ex + tx * 0.95, y + 0.6, ez + tz * 0.95], 0.1, PALE, 0.04)
    beam(q, [ex, y + 0.25, ez], [ex - tx * 0.95, y + 0.6, ez - tz * 0.95], 0.1, PALE, 0.04)
  }
  for (const [x, z] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) urn(q, x * 2.05, z * 2.05, top + 2.6)
  // the four allegories standing against the foot of the shaft
  const y0 = die + 3.4
  for (const [x, z] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
    blob(q, x * 0.92, y0 + 0.95, z * 0.92, 0.46, 1.0, 0.46, DARK, 7, 4)
    blob(q, x * 0.92, y0 + 2.12, z * 0.92, 0.17, 0.21, 0.17, DARK, 6, 3)
  }
  // the shaft, with its rings of names, and the tuft of palm at the top
  const yc = y0 + 9.2
  lathe(q, 0, 0, [[0.68, y0], [0.6, y0 + 0.4], [0.5, yc]], 16, STONE)
  for (let i = 0; i < 8; i++) {
    const y = y0 + 1.0 + i * 1.08
    const r = 0.6 - (i / 8) * 0.09
    lathe(q, 0, 0, [[r, y - 0.1], [r + 0.075, y - 0.05], [r + 0.075, y + 0.12], [r, y + 0.17]], 12, DARK)
  }
  lathe(q, 0, 0, [[0.5, yc], [0.72, yc + 0.5], [0.62, yc + 0.72]], 16, PALE)
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    const sx = Math.sin(a)
    const cz = Math.cos(a)
    beam(q, [sx * 0.45, yc + 0.3, cz * 0.45], [sx * 0.86, yc + 0.72, cz * 0.86], 0.06, PALE, 0.03)
    beam(q, [sx * 0.86, yc + 0.72, cz * 0.86], [sx * 0.98, yc + 0.32, cz * 0.98], 0.05, STONE, 0.025)
  }
  // the Victory, gilt, on her ball: robe, folded wings behind her, both arms up with the wreaths
  const v = yc + 0.72
  blob(q, 0, v + 0.16, 0, 0.26, 0.2, 0.26, GILT, 8, 4)
  lathe(q, 0, 0, [[0.14, v + 0.3], [0.3, v + 0.4], [0.27, v + 1.1], [0.27, v + 1.5], [0.19, v + 1.85], [0.07, v + 1.9]], 8, GILT)
  blob(q, 0, v + 2.03, 0, 0.11, 0.14, 0.12, GILT, 6, 4)
  for (const s of [-1, 1]) {
    beam(q, [s * 0.16, v + 1.8, 0], [s * 0.62, v + 2.42, 0], 0.05, GILT)
    // the wreath held up: a flat ring
    prism(q, s * 0.68, 0, v + 2.42, v + 2.5, 0.24, 8, GILT, FIXED)
    // the wing, closed along her back, its tip past her hip
    q.quad([[s * 0.1, v + 1.82, 0.16], [s * 0.45, v + 1.7, 0.2], [s * 0.5, v + 0.8, 0.26], [s * 0.1, v + 0.5, 0.2]], [s * 0.25, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]], GILT, FIXED)
    q.quad([[s * 0.1, v + 1.82, 0.16], [s * 0.45, v + 1.7, 0.2], [s * 0.5, v + 0.8, 0.26], [s * 0.1, v + 0.5, 0.2]], [-s * 0.25, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]], GILT, FIXED)
  }
}

export function fontaineDuPalmier(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, R, R, draw)
}
