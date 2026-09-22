/**
 * San Francisco's own street furniture (SF_PLAN.md §6; render/us-furniture.ts has what every American city shares).
 *
 * - **The Market Street station entrance** (user, 2026-09-22: "the stairways down to MUNI stations are huge and very
 *   distinctive glass structures, not the small stairways like Paris"): a long opening in the brick, the stair
 *   and escalator going down into the dark between granite cheek walls, under a glass-and-steel canopy that slopes
 *   down with the stair, and the tall BART/Muni pylon at its head.
 *
 * Local frame: the stair runs along +z (the street's direction, as the placer turns it), going DOWN toward −z;
 * the head of the stair, where the pylon stands, at +z. The foot of everything at y = 0 on the pavement.
 */
import type { MeshBuilder } from '../buildings.ts'
import { box, strut, FIXED, EMIT, type Rgb } from '../models.ts'
import { surfaceTag } from '../cartoon-material.ts'

const GRANITE: Rgb = [0.46, 0.45, 0.44]
const STEEL: Rgb = [0.3, 0.32, 0.34]
const GLASS: Rgb = [0.42, 0.5, 0.54]
const VOID: Rgb = [0.05, 0.05, 0.06]
const BART_BLUE: Rgb = [0.1, 0.32, 0.62]
const MUNI_RED: Rgb = [0.84, 0.2, 0.14]

export function bartEntrance(out: MeshBuilder): void {
  const granite = surfaceTag('granite')
  const glass = surfaceTag('glass')
  const metal = surfaceTag('metal')
  const L = 6.5        // half the opening's length
  const W = 1.8        // half its width
  // the well: dark, with the treads going down into it from the head (+z) toward the far end (−z)
  box(out, 0, 0.16, 0, W, 0.005, L, VOID, FIXED)
  for (let k = 0; k < 14; k++) {
    const z = L - 0.5 - k * 0.8
    const y = 0.14 - k * 0.2
    if (y < -1.8) break
    box(out, 0, y, z, W - 0.05, 0.02, 0.2, [0.3, 0.3, 0.31], FIXED)
  }
  // the escalator's steel balustrade down the middle
  box(out, 0, -0.2, 0, 0.12, 0.5, L - 0.4, STEEL, metal)
  // the cheek walls: granite, waist high, down both sides and across the far end
  for (const s of [-1, 1]) box(out, s * (W + 0.2), 0.55, 0, 0.2, 0.55, L + 0.2, GRANITE, granite)
  box(out, 0, 0.55, -L - 0.2, W + 0.4, 0.55, 0.2, GRANITE, granite)
  // the canopy: steel posts on the walls, the glass roof sloping from 4.2 m at the head to 3 m at the far end,
  // glass panels down the sides above the walls
  const yAt = (z: number): number => 3 + ((z + L) / (2 * L)) * 1.2
  for (const s of [-1, 1]) {
    for (let k = 0; k <= 4; k++) {
      const z = -L + (k * 2 * L) / 4
      box(out, s * (W + 0.2), 1.1 + (yAt(z) - 1.1) / 2, z, 0.07, (yAt(z) - 1.1) / 2, 0.07, STEEL, metal)
    }
    // the side glass: a quad from the wall top to the roof, the length of the canopy
    const x = s * (W + 0.2)
    out.quad([[x, 1.12, -L], [x, 1.12, L], [x, yAt(L) - 0.1, L], [x, yAt(-L) - 0.1, -L]], [s, 0, 0], [[0, 0], [4, 0], [4, 1], [0, 1]], GLASS, glass)
    // the roof's edge beam, down the slope with the roof
    strut(out, [x, yAt(-L), -L], [x, yAt(L), L], 0.09, 0.09, STEEL, metal)
  }
  // the roof: glass between steel ribs, sloping
  const roof = (z0: number, z1: number): void => {
    out.quad([[-W - 0.4, yAt(z0), z0], [W + 0.4, yAt(z0), z0], [W + 0.4, yAt(z1), z1], [-W - 0.4, yAt(z1), z1]],
      [0, 0.99, -0.09], [[0, 0], [1, 0], [1, 1], [0, 1]], GLASS, glass)
    out.quad([[-W - 0.4, yAt(z1) - 0.02, z1], [W + 0.4, yAt(z1) - 0.02, z1], [W + 0.4, yAt(z0) - 0.02, z0], [-W - 0.4, yAt(z0) - 0.02, z0]],
      [0, -0.99, 0.09], [[0, 0], [1, 0], [1, 1], [0, 1]], GLASS, glass)
  }
  for (let k = 0; k < 4; k++) {
    const z0 = -L + (k * 2 * L) / 4
    const z1 = -L + ((k + 1) * 2 * L) / 4
    roof(z0, z1)
    box(out, 0, yAt(z1) + 0.04, z1, W + 0.4, 0.05, 0.06, STEEL, metal)
  }
  // the pylon at the head: a tall dark post with the BART panel and Muni's red band, lit
  const pz = L + 0.9
  const px = W - 0.2
  box(out, px, 2.1, pz, 0.28, 2.1, 0.28, [0.16, 0.17, 0.19], metal)
  box(out, px, 3.55, pz, 0.3, 0.45, 0.3, BART_BLUE, EMIT)
  box(out, px, 2.95, pz, 0.3, 0.12, 0.3, MUNI_RED, EMIT)
  box(out, px, 3.55, pz + 0.31, 0.18, 0.1, 0.005, [0.96, 0.96, 0.96], EMIT)     // "BART", as a white bar of type
}

/** San Francisco's public trash can: the dark green steel can with its domed lid and hooded slot. */
export function sfTrashCan(out: MeshBuilder): void {
  const green: Rgb = [0.1, 0.27, 0.17]
  box(out, 0, 0.5, 0, 0.3, 0.5, 0.3, green, surfaceTag('metal'))
  box(out, 0, 1.04, 0, 0.32, 0.05, 0.32, green, FIXED)
  box(out, 0, 1.14, 0, 0.24, 0.07, 0.24, green, FIXED)
  box(out, 0, 0.85, 0.31, 0.18, 0.06, 0.02, [0.03, 0.05, 0.04], FIXED)          // the slot
}

/** Market Street's kerb post: a short dark bollard; the placer hangs a sagging chain between them. */
export function chainBollard(out: MeshBuilder): void {
  const iron: Rgb = [0.12, 0.16, 0.15]
  box(out, 0, 0.42, 0, 0.07, 0.42, 0.07, iron, FIXED)
  box(out, 0, 0.87, 0, 0.09, 0.04, 0.09, iron, FIXED)
}

/** A pair of banners hung from a lamp post's bracket arms, 4–6 m up, in a campaign's two colours. */
export function streetBanners(out: MeshBuilder, seed = 0): void {
  const palettes: [Rgb, Rgb][] = [[[0.86, 0.3, 0.24], [0.12, 0.22, 0.45]], [[0.96, 0.7, 0.16], [0.1, 0.4, 0.5]],
    [[0.16, 0.5, 0.36], [0.94, 0.9, 0.84]], [[0.55, 0.2, 0.5], [0.95, 0.6, 0.3]]]
  const [a, b] = palettes[seed % palettes.length]
  // the pole: Market's tall dark-green standard, which also carries the trolley wires
  box(out, 0, 3.4, 0, 0.09, 3.4, 0.09, [0.12, 0.2, 0.16], FIXED)
  box(out, 0, 0.35, 0, 0.16, 0.35, 0.16, [0.12, 0.2, 0.16], FIXED)
  for (const [s, c] of [[-1, a], [1, b]] as const) {
    box(out, s * 0.35, 6.1, 0, 0.35, 0.02, 0.02, [0.2, 0.2, 0.2], FIXED)
    box(out, s * 0.4, 5.2, 0, 0.28, 0.8, 0.012, c, FIXED)
  }
}
