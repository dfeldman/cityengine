/**
 * THE ENCEINTE OF THE CHÂTEAU DE VINCENNES (1373–1380): a rectangle of ashlar curtain walls, some 175 × 330 m, with nine
 * square towers projecting from it. In 1808–1820 all but one were cut down to the height of the walls, so they stand as
 * flat-topped square bastions flush with the wall walk; only the TOUR DU VILLAGE, the north gate, keeps its full height —
 * a tall square tower with flat buttresses at its corners and down its faces, a gate arch and a flat leaded top. The
 * Tour du Bois (south gate) was remade by Le Vau and carries a low slate roof. The donjon and its chemise break the west
 * wall (./donjon.ts). Plan: OSM tower ways (w110188215…232, osmium on the local pbf), walls along their inner line.
 * Refs: Commons, Tour du Village 1, "enceinte et douves" (docs/landmarks/refs/vincennes/enceinte/, 2026-11-04).
 * Local frame: the donjon's (x along bearing 97.6, +z north), shifted by (OX, OZ) to the enceinte's middle.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { block, hex, type Rgb } from '../../kit.ts'
import { archOn, rectOn } from '../palaces/common.ts'

const STONE: Rgb = hex('#d8cfbb'), STONE_D: Rgb = hex('#c4baa4'), SLATE: Rgb = hex('#4a5058'), DARK: Rgb = hex('#2e2c2a')

/** the entry's origin, in the donjon's frame */
const OX = 97, OZ = 17
// the curtain wall: its outer line in the donjon frame, thickness, height
const W_W = 8.5 - OX, W_E = 183.5 - OX, W_S = -147.6 - OZ, W_N = 183.2 - OZ
const W_T = 3.2, W_H = 9.5, W_CORNICE = 0.6
const CHEMISE_Z: [number, number] = [-31.3 - OZ, 23.4 - OZ]          // the gap the donjon's chemise fills in the west wall
// towers: x0 x1 z0 z1 height (OSM, donjon frame)
const TOWERS_RAW: [string, number, number, number, number, number][] = [
  ['Salves', 180.5, 194.3, 6.2, 26.5, 11],
  ['Reine', 174.6, 191.2, -159.8, -140.6, 11.2],
  ['Paris', 0.4, 16.8, 176.2, 195.2, 10.5],
  ['Reservoir', 174.8, 191.0, 177.0, 196.3, 10.5],
  ['Roi', 1.4, 17.6, -160.1, -141.0, 9.8],
  ['Surintendants', 180.5, 193.3, -74.1, -60.4, 10.7],
  ['Diable', 179.9, 192.7, 94.0, 107.7, 10.5],
]
const sh = (r: number[]): [number, number, number, number] => [r[0] - OX, r[1] - OX, r[2] - OZ, r[3] - OZ]
const TOWERS = TOWERS_RAW.map(([, a, b, c, d, h]) => [...sh([a, b, c, d]), h])
const BOIS = sh([85.5, 106.2, -159.7, -147.5]), BOIS_H = 12.5, BOIS_ROOF = 3
const VILLAGE = sh([83.3, 109.8, 178.0, 193.9])
const V_H = 40, V_BUTT = 1.0, V_STOREY = 7.5

function tower(out: MeshBuilder, x0: number, x1: number, z0: number, z1: number, y: number, h: number): void {
  block(out, x0, x1, z0, z1, y, y + h, STONE)
  block(out, x0 - 0.3, x1 + 0.3, z0 - 0.3, z1 + 0.3, y + h - W_CORNICE, y + h, STONE_D)
  block(out, x0 - 0.4, x1 + 0.4, z0 - 0.4, z1 + 0.4, y, y + 2.5, STONE_D)              // the battered foot
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2
  rectOn(out, '-z', z0, cx - 0.3, cx + 0.3, y + h * 0.5, y + h * 0.5 + 1.6, DARK, 0.04)
  rectOn(out, '+z', z1, cx - 0.3, cx + 0.3, y + h * 0.5, y + h * 0.5 + 1.6, DARK, 0.04)
  rectOn(out, '-x', x0, cz - 0.3, cz + 0.3, y + h * 0.5, y + h * 0.5 + 1.6, DARK, 0.04)
  rectOn(out, '+x', x1, cz - 0.3, cz + 0.3, y + h * 0.5, y + h * 0.5 + 1.6, DARK, 0.04)
}

function walls(out: MeshBuilder, y: number): void {
  const runs: [number, number, number, number][] = [
    [W_W, W_E, W_N - W_T, W_N], [W_W, W_E, W_S, W_S + W_T], [W_E - W_T, W_E, W_S, W_N],
    [W_W, W_W + W_T, W_S, CHEMISE_Z[0]], [W_W, W_W + W_T, CHEMISE_Z[1], W_N],
  ]
  for (const [x0, x1, z0, z1] of runs) {
    block(out, x0, x1, z0, z1, y, y + W_H, STONE)
    block(out, x0 - 0.25, x1 + 0.25, z0 - 0.25, z1 + 0.25, y + W_H - W_CORNICE, y + W_H, STONE_D)
  }
}

function village(out: MeshBuilder, y: number): void {
  const [x0, x1, z0, z1] = VILLAGE, cx = (x0 + x1) / 2
  block(out, x0, x1, z0, z1, y, y + V_H, STONE)
  block(out, x0 - 0.4, x1 + 0.4, z0 - 0.4, z1 + 0.4, y + V_H - 1, y + V_H, STONE_D)
  // flat buttresses at the corners and two down each long face
  for (const x of [x0, x0 + 7, x1 - 7 - V_BUTT * 2, x1 - V_BUTT * 2]) for (const [za, zb] of [[z0 - V_BUTT, z0], [z1, z1 + V_BUTT]])
    block(out, x, x + V_BUTT * 2, za, zb, y, y + V_H - 1, STONE_D)
  for (const xa of [x0 - V_BUTT, x1]) for (const z of [z0, z1 - V_BUTT * 2])
    block(out, xa, xa + V_BUTT, z, z + V_BUTT * 2, y, y + V_H - 1, STONE_D)
  // the gate passage, both faces, and arched windows over it
  archOn(out, '-z', z0 - V_BUTT, cx, y, 4.2, 6.5, DARK)
  archOn(out, '+z', z1 + V_BUTT, cx, y, 4.2, 6.5, DARK)
  for (let s = 1; s < 5; s++) for (const t of [-5.5, 5.5]) {
    const ys = y + 4 + s * V_STOREY
    archOn(out, '-z', z0, cx + t, ys, 1.8, 3.6, DARK, 0.12)
    archOn(out, '+z', z1, cx + t, ys, 1.8, 3.6, DARK, 0.12)
  }
}

function bois(out: MeshBuilder, y: number): void {
  const [x0, x1, z0, z1] = BOIS, cx = (x0 + x1) / 2
  block(out, x0, x1, z0, z1, y, y + BOIS_H, STONE)
  block(out, x0 - 0.3, x1 + 0.3, z0 - 0.3, z1 + 0.3, y + BOIS_H - W_CORNICE, y + BOIS_H, STONE_D)
  for (let i = 0; i < 3; i++) {                               // a low stepped slate roof
    const d = 1.6 * i + 0.4
    block(out, x0 + d, x1 - d, z0 + d, z1 - d, y + BOIS_H + i * (BOIS_ROOF / 3), y + BOIS_H + (i + 1) * (BOIS_ROOF / 3), SLATE)
  }
  archOn(out, '-z', z0, cx, y, 4.5, 7, DARK)
  archOn(out, '+z', z1, cx, y, 4.5, 7, DARK)
}

export function enceinteVincennes(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0
  walls(out, y)
  for (const [x0, x1, z0, z1, h] of TOWERS) tower(out, x0, x1, z0, z1, y, h)
  village(out, y)
  bois(out, y)
}
