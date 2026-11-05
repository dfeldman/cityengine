/**
 * THE DONJON DE VINCENNES (1361–1370), its CHEMISE and the CHÂTELET. The tower keep is a square of ashlar some 16 m a side,
 * 52 m high, with a round turret at each corner running up past its corbelled machicolation gallery to its own crenellated
 * top, flat pilaster buttresses down the middle of each face and a square latrine tower against its north side. The chemise
 * round it is a curtain wall with a slate-roofed wall walk and round corner turrets under conical slate caps; the Châtelet,
 * the keep's gatehouse, stands astride its east wall, two round towers on the moat with the bridge between them and a
 * bell turret behind. Plan from OSM way/83817983 (Donjon), relation/1559341 (Châtelet), way/1416530512 (the chemise
 * walk). Refs: Commons, Category:Donjon du Château de Vincennes (docs/landmarks/refs/vincennes/donjon/, 2026-11-04).
 * Local frame: origin the Donjon outline's vertex mean (48.842716, 2.434678); x along bearing 97.6 (the chemise's south
 * wall), +z along 7.6 (north); front 187.6.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { block, hex, prism, type Rgb } from '../../kit.ts'
import { rectOn } from '../palaces/common.ts'
import { quadN } from '../venues/bowl.ts'

const STONE: Rgb = hex('#d8cfbb'), STONE_D: Rgb = hex('#c4baa4'), SLATE: Rgb = hex('#4a5058'), DARK: Rgb = hex('#2e2c2a'),
  WOOD: Rgb = hex('#6e5a44')

// the keep
const DX = 0, DZ = -3.6, DH = 7.6                 // centre and half side of the square
const D_GALLERY = 44, D_PARAPET = 48.5           // corbelled machicolations, then the parapet
const T_R = 3.2, T_TOP = 52, T_CORBEL = 47.5      // corner turrets
const BUTT_W = 2.4, BUTT_D = 0.6
const LAT: [number, number, number, number] = [-6.5, -1.5, DZ + DH, 12]   // latrine tower x0 x1 z0 z1
const LAT_H = 41
const STAIR: [number, number, number, number] = [4, 0, 1.5, 51.5]       // the stair turret on the terrace x z r top
// the chemise
const C: [number, number, number, number] = [-26.3, 29.4, -31.3, 23.4]
const C_H = 15, C_T = 2.6, C_ROOF = 2.4, C_TR = 3.6, C_TH = 18, C_CONE = 7
// the Châtelet
const G: [number, number, number, number] = [24, 33, -12, 3]
const G_H = 20, G_TR = 3.4, G_TH = 23
const G_TOWERS: [number, number][] = [[34.5, -9.5], [34.5, 0.5]]
const BELL: [number, number, number, number] = [24.7, -7.8, 2.0, 27]

const SIDES = 20

/** a crenellated parapet ring of merlons round a circle */
function roundCrenels(out: MeshBuilder, x: number, z: number, r: number, y: number, h: number, n = 10): void {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    block(out, x + Math.sin(a) * r - 0.45, x + Math.sin(a) * r + 0.45, z + Math.cos(a) * r - 0.45, z + Math.cos(a) * r + 0.45, y, y + h, STONE)
  }
}

/** merlons along a straight run */
function crenels(out: MeshBuilder, x0: number, x1: number, z0: number, z1: number, y: number, h: number, step = 1.6): void {
  const len = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.floor(len / step))
  for (let i = 0; i <= n; i += 2) {
    const t = i / n, x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t
    block(out, x - 0.4, x + 0.4, z - 0.4, z + 0.4, y, y + h, STONE)
  }
}

/** machicolation corbels: a band of brackets under a projecting parapet, round a square */
function machicolations(out: MeshBuilder, x0: number, x1: number, z0: number, z1: number, y: number, proj: number): void {
  block(out, x0 - proj, x1 + proj, z0 - proj, z1 + proj, y, y + 0.5, STONE_D)
  for (let x = x0; x <= x1; x += 1.2) for (const z of [z0 - proj / 2, z1 + proj / 2]) block(out, x - 0.2, x + 0.2, z - proj / 2, z + proj / 2, y - 1.2, y, STONE_D)
  for (let z = z0; z <= z1; z += 1.2) for (const x of [x0 - proj / 2, x1 + proj / 2]) block(out, x - proj / 2, x + proj / 2, z - 0.2, z + 0.2, y - 1.2, y, STONE_D)
}

function keep(out: MeshBuilder, y: number): void {
  const x0 = DX - DH, x1 = DX + DH, z0 = DZ - DH, z1 = DZ + DH
  block(out, x0, x1, z0, z1, y, y + D_PARAPET, STONE)
  // the corbelled gallery and its parapet
  machicolations(out, x0, x1, z0, z1, y + D_GALLERY, 0.7)
  block(out, x0 - 0.7, x1 + 0.7, z0 - 0.7, z1 + 0.7, y + D_GALLERY + 0.5, y + D_PARAPET, STONE)
  block(out, x0 + 0.3, x1 - 0.3, z0 + 0.3, z1 - 0.3, y + D_PARAPET, y + D_PARAPET + 0.05, STONE_D)    // the terrace
  for (const [a, b, c, d] of [[x0 - 0.7, x1 + 0.7, z0 - 0.7, z0 - 0.7], [x0 - 0.7, x1 + 0.7, z1 + 0.7, z1 + 0.7], [x0 - 0.7, x0 - 0.7, z0 - 0.7, z1 + 0.7], [x1 + 0.7, x1 + 0.7, z0 - 0.7, z1 + 0.7]] as const)
    crenels(out, a, b, c, d, y + D_PARAPET, 1.2)
  // pilaster buttresses down the middle of each face, to the gallery
  block(out, DX - BUTT_W / 2, DX + BUTT_W / 2, z0 - BUTT_D, z0, y, y + D_GALLERY - 1.2, STONE_D)
  block(out, DX - BUTT_W / 2, DX + BUTT_W / 2, z1, z1 + BUTT_D, y, y + D_GALLERY - 1.2, STONE_D)
  block(out, x0 - BUTT_D, x0, DZ - BUTT_W / 2, DZ + BUTT_W / 2, y, y + D_GALLERY - 1.2, STONE_D)
  block(out, x1, x1 + BUTT_D, DZ - BUTT_W / 2, DZ + BUTT_W / 2, y, y + D_GALLERY - 1.2, STONE_D)
  // windows: a pair either side of the buttress on each of the five upper storeys, slits low down
  for (let s = 0; s < 6; s++) {
    const ys = y + 6 + s * 6.4, w = s === 0 ? 0.35 : 1.0, h = s === 0 ? 2.2 : 2.0
    for (const t of [-3.6, 3.6]) {
      rectOn(out, '-z', z0, DX + t - w / 2, DX + t + w / 2, ys, ys + h, DARK, 0.04)
      rectOn(out, '+z', z1, DX + t - w / 2, DX + t + w / 2, ys, ys + h, DARK, 0.04)
      rectOn(out, '-x', x0, DZ + t - w / 2, DZ + t + w / 2, ys, ys + h, DARK, 0.04)
      rectOn(out, '+x', x1, DZ + t - w / 2, DZ + t + w / 2, ys, ys + h, DARK, 0.04)
    }
  }
  // the corner turrets
  for (const [x, z] of [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]) {
    prism(out, x, z, y, y + T_CORBEL, T_R, SIDES, STONE)
    prism(out, x, z, y + T_CORBEL - 1.2, y + T_CORBEL, T_R, SIDES, STONE_D, undefined, T_R + 0.5)
    prism(out, x, z, y + T_CORBEL, y + T_TOP - 1.1, T_R + 0.5, SIDES, STONE)
    roundCrenels(out, x, z, T_R + 0.1, y + T_TOP - 1.1, 1.1)
    for (let s = 1; s < 7; s++) {                                         // arrow slits facing out
      const ys = y + s * 6.5, sx = Math.sign(x - DX), sz = Math.sign(z - DZ)
      block(out, x + sx * T_R * 0.7 - 0.15, x + sx * T_R * 0.7 + 0.15, z + sz * T_R * 0.7 - 0.15, z + sz * T_R * 0.7 + 0.15, ys, ys + 1.8, DARK)
    }
  }
  const [sx, sz, sr, st] = STAIR
  prism(out, sx, sz, y + D_PARAPET, y + st, sr, 12, STONE)
  roundCrenels(out, sx, sz, sr, y + st, 0.9, 6)
  // the latrine tower
  const [lx0, lx1, lz0, lz1] = LAT
  block(out, lx0, lx1, lz0, lz1, y, y + LAT_H, STONE)
  machicolations(out, lx0, lx1, lz0, lz1, y + LAT_H - 1, 0.5)
  crenels(out, lx0 - 0.5, lx1 + 0.5, lz1 + 0.5, lz1 + 0.5, y + LAT_H - 0.5, 1.1)
  for (let s = 1; s < 6; s++) rectOn(out, '+z', lz1, (lx0 + lx1) / 2 - 0.4, (lx0 + lx1) / 2 + 0.4, y + s * 6.5, y + s * 6.5 + 1.6, DARK, 0.04)
}

function chemise(out: MeshBuilder, y: number): void {
  const [x0, x1, z0, z1] = C, t = C_T / 2
  const runs: [number, number, number, number][] = [[x0, x1, z0 - t, z0 + t], [x0, x1, z1 - t, z1 + t], [x0 - t, x0 + t, z0, z1], [x1 - t, x1 + t, z0, z1]]
  for (const [a, b, c, d] of runs) {
    block(out, a, b, c, d, y, y + C_H, STONE)
    block(out, a - 0.4, b + 0.4, c - 0.4, d + 0.4, y + C_H - 0.6, y + C_H, STONE_D)                     // the corbel band
    // the roofed wall walk: a gable of slate along the run
    const along = b - a > d - c, cy = y + C_H
    if (along) {
      const zm = (c + d) / 2
      quadN(out, [[a, cy, c - 0.4], [b, cy, c - 0.4], [b, cy + C_ROOF, zm], [a, cy + C_ROOF, zm]], [0, 0.7, -0.7], SLATE)
      quadN(out, [[b, cy, d + 0.4], [a, cy, d + 0.4], [a, cy + C_ROOF, zm], [b, cy + C_ROOF, zm]], [0, 0.7, 0.7], SLATE)
    } else {
      const xm = (a + b) / 2
      quadN(out, [[a - 0.4, cy, d], [a - 0.4, cy, c], [xm, cy + C_ROOF, c], [xm, cy + C_ROOF, d]], [-0.7, 0.7, 0], SLATE)
      quadN(out, [[b + 0.4, cy, c], [b + 0.4, cy, d], [xm, cy + C_ROOF, d], [xm, cy + C_ROOF, c]], [0.7, 0.7, 0], SLATE)
    }
  }
  for (const [x, z] of [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]) {
    prism(out, x, z, y, y + C_TH, C_TR, SIDES, STONE)
    prism(out, x, z, y + C_TH - 1, y + C_TH, C_TR, SIDES, STONE_D, undefined, C_TR + 0.4)
    prism(out, x, z, y + C_TH, y + C_TH + C_CONE, C_TR + 0.6, SIDES, SLATE, undefined, 0.05)
  }
}

function chatelet(out: MeshBuilder, y: number): void {
  const [x0, x1, z0, z1] = G
  block(out, x0, x1, z0, z1, y, y + G_H, STONE)
  machicolations(out, x0, x1, z0, z1, y + G_H - 2, 0.5)
  block(out, x0 - 0.5, x1 + 0.5, z0 - 0.5, z1 + 0.5, y + G_H - 1.5, y + G_H, STONE)
  for (let s = 0; s < 3; s++) for (const t of [-8, -1.5]) rectOn(out, '-x', x0, t - 0.6, t + 0.6, y + 3 + s * 5.5, y + 5 + s * 5.5, DARK, 0.04)
  for (const [x, z] of G_TOWERS) {
    prism(out, x, z, y, y + G_TH - 2, G_TR, SIDES, STONE)
    prism(out, x, z, y + G_TH - 3, y + G_TH - 2, G_TR, SIDES, STONE_D, undefined, G_TR + 0.4)
    prism(out, x, z, y + G_TH - 2, y + G_TH, G_TR + 0.4, SIDES, STONE)
    for (let s = 1; s < 4; s++) block(out, x + G_TR - 0.2, x + G_TR + 0.05, z - 0.15, z + 0.15, y + s * 5.5, y + s * 5.5 + 1.6, DARK)
  }
  // the gate between the towers, and the bridge over the moat
  const gz = (G_TOWERS[0][1] + G_TOWERS[1][1]) / 2
  rectOn(out, '+x', x1, gz - 1.4, gz + 1.4, y, y + 4.2, DARK, 0.05)
  block(out, x1, x1 + 9, gz - 1.2, gz + 1.2, y + 0.2, y + 0.6, WOOD)
  const [bx, bz, br, bt] = BELL
  prism(out, bx, bz, y + G_H, y + bt, br, 12, STONE)
  prism(out, bx, bz, y + bt, y + bt + 0.6, br + 0.3, 12, STONE_D)
}

export function donjonVincennes(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0
  keep(out, y)
  chemise(out, y)
  chatelet(out, y)
}
