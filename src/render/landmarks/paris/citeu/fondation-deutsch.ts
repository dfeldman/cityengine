/**
 * THE FONDATION DEUTSCH DE LA MEURTHE, the Cité Universitaire's first house (Lucien Bechmann, 1925): neo-Norman collegiate
 * pavilions of buff brick dressed in pale stone, three storeys under steep grey slate roofs with stone-coped cross gables.
 * The Pavillon Poincaré (Fondation Émile et Louise, way/52090395) is the main house: lawn front with two cone-roofed
 * turrets, a tall bay over a balcony, and a brick clock tower with belfry and spire; way/260177831 is the Pavillon Appell, plain gabled ranges.
 * Refs: Commons (docs/landmarks/refs/citeu/deutsch/, 2026-11-04). Plans from OSM rotated to their axes.
 * Local frame: x along bearing 108, −z toward bearing 198, origin the OSM outline's vertex mean.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { hex, roof, turret, pinnacle, type Rgb } from '../../kit.ts'
import { block } from '../batch2/tag.ts'
import { rectOn } from '../palaces/common.ts'

export const BRICK: Rgb = hex('#c9a77c'), STONE: Rgb = hex('#e2d8c2'), SLATE: Rgb = hex('#4d5058'), GLASS: Rgb = hex('#2f363d')
const CLOCK: Rgb = hex('#a2483a'), FRAME_C: Rgb = hex('#d9d2c0')
const brick = surfaceTag('brick')

export const G = 3.4, FL = 3.0, LEVELS = 3, EAVES = G + (LEVELS - 1) * FL
const WIN_W = 1.1, WIN_H = 1.7, BAY = 3.2, FRAME = 0.14, PLINTH = 0.8
const ROOF_H = 7, GABLE_W = 6.5, GABLE_H = 5.5, GABLE_PROUD = 0.5, COPE_BACK = 0.15
const TURRET_R = 1.4, TURRET_ROOF = 4.5

export type Face = '-z' | '+z' | '-x' | '+x'
export type Box = [number, number, number, number]   // x0, x1, z0, z1

function faces([x0, x1, z0, z1]: Box): [Face, number, number, number][] {
  return [['-z', z0, x0, x1], ['+z', z1, x0, x1], ['-x', x0, z0, z1], ['+x', x1, z0, z1]]
}

export function windowAt(out: MeshBuilder, f: Face, plane: number, t: number, y: number, w = WIN_W, h = WIN_H, frame: Rgb = FRAME_C, fw = FRAME): void {
  rectOn(out, f, plane, t - w / 2 - fw, t + w / 2 + fw, y - fw, y + h + fw, frame, 0.04)
  rectOn(out, f, plane, t - w / 2, t + w / 2, y, y + h, GLASS, 0.07)
}

/** a brick range with stone plinth and string course, windows on every face not skipped, and a slate roof (ridge along x or z) */
export function range(out: MeshBuilder, y: number, b: Box, ridgeX: boolean, skip: Face[] = [], eaves = EAVES, roofH = ROOF_H, wall: Rgb = BRICK, frame: Rgb = FRAME_C, fw = FRAME): void {
  const [x0, x1, z0, z1] = b
  block(out, x0, x1, z0, z1, y, y + eaves, wall, wall === BRICK ? brick : 0)
  block(out, x0 - 0.08, x1 + 0.08, z0 - 0.08, z1 + 0.08, y, y + PLINTH, STONE)
  block(out, x0 - 0.06, x1 + 0.06, z0 - 0.06, z1 + 0.06, y + G - 0.2, y + G, STONE)
  block(out, x0 - 0.1, x1 + 0.1, z0 - 0.1, z1 + 0.1, y + eaves - 0.3, y + eaves, STONE)
  for (const [f, plane, t0, t1] of faces(b)) {
    if (skip.includes(f)) continue
    const n = Math.max(1, Math.floor((t1 - t0 - 1) / BAY)), step = (t1 - t0) / n
    const levels = Math.round((eaves - G) / FL) + 1
    for (let i = 0; i < n; i++) {
      for (let s = 0; s < levels; s++) windowAt(out, f, plane, t0 + step * (i + 0.5), y + (s === 0 ? 1.1 : G + (s - 1) * FL + 0.55), WIN_W, WIN_H, frame, fw)
    }
  }
  const o = 0.4
  roof(out, x0 - o, x1 + o, z0 - o, z1 + o, y + eaves, roofH, ridgeX ? 0 : (x1 - x0) / 2 + o, ridgeX ? (z1 - z0) / 2 + o : 0, SLATE)
}

/** a stone-coped cross gable standing proud of a face, with a tall mullioned window up into it */
export function gable(out: MeshBuilder, y: number, f: Face, plane: number, t: number, w = GABLE_W, h = GABLE_H): void {
  const s = f[0] === '-' ? -1 : 1, yr = y + EAVES, hw = w / 2
  const n0 = plane + s * GABLE_PROUD, n1 = plane - s * 3
  const lo = Math.min(n0, n1), hi = Math.max(n0, n1), along = f[1] === 'z'
  const bx = (a: number, b: number, c: number, d: number): Box => along ? [a, b, c, d] : [c, d, a, b]
  const [ax0, ax1, az0, az1] = bx(t - hw, t + hw, lo, hi)
  block(out, ax0, ax1, az0, az1, y, yr, BRICK, brick)
  // brick gable triangle at the face; the stone coping sits just behind it, showing only as a rim (not a stone face)
  const back = n0 - s * COPE_BACK, lo2 = Math.min(back, n1), hi2 = Math.max(back, n1)
  const [wx0, wx1, wz0, wz1] = bx(t - hw, t + hw, Math.min(n0, back), Math.max(n0, back))
  roof(out, wx0, wx1, wz0, wz1, yr - 0.01, h, along ? hw : 0, along ? 0 : hw, BRICK)
  const [cx0, cx1, cz0, cz1] = bx(t - hw - 0.3, t + hw + 0.3, Math.min(back, back - s * 0.2), Math.max(back, back - s * 0.2))
  roof(out, cx0, cx1, cz0, cz1, yr - 0.2, h + 0.3, along ? hw + 0.3 : 0, along ? 0 : hw + 0.3, STONE)
  const [rx0, rx1, rz0, rz1] = bx(t - hw - 0.2, t + hw + 0.2, lo2, hi2)
  roof(out, rx0, rx1, rz0, rz1, yr - 0.1, h, along ? hw + 0.2 : 0, along ? 0 : hw + 0.2, SLATE)
  for (let s2 = 0; s2 <= LEVELS; s2++) {
    const ys = y + (s2 === 0 ? 1.1 : G + (s2 - 1) * FL + 0.55)
    windowAt(out, f, n0, t, ys, s2 === LEVELS ? 1.0 : 2.2)
  }
}

// ---- the Pavillon Appell (way/260177831, OSM-named 'Fondation Deutsch de la Meurthe'): plain gabled brick ranges ---------------------------
const MAIN: Box = [-14.3, 14.4, -5.2, 8.2]
const FRONT: Box = [-7.6, 7.6, -9.5, -5.2]
const BACK: Box = [-7.2, 9.3, 8.2, 12.4]
const MAIN_GABLES: [Face, number][] = [['-z', -11], ['-z', 11], ['+z', -11], ['-x', 1.5], ['+x', 1.5]]

export function fondationDeutschMeurthe(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0
  range(out, y, MAIN, true)
  range(out, y, FRONT, false, ['+z'])
  range(out, y, BACK, true, ['-z'], EAVES - FL)
  gable(out, y, '-z', FRONT[2], 0)
  for (const [f, t] of MAIN_GABLES) {
    const plane = f === '-z' ? MAIN[2] : f === '+z' ? MAIN[3] : f === '-x' ? MAIN[0] : MAIN[1]
    gable(out, y, f, plane, t)
  }
}

// ---- the Pavillon Poincaré (Fondation Émile et Louise, way/52090395): the main house ------------------------------
// Its lawn front faces the Jardin Senghor (+z): two cone-roofed corner turrets, the tall mullioned bay between, and the
// square brick clock tower behind at the junction with the south wing (owner's photo poincare-lawn.webp, 2026-11-04).
const P_NORTH: Box = [-9.3, 8.0, 1.6, 9.5]
const P_MID: Box = [-3.0, 7.6, -4.2, 1.6]
const P_SOUTH: Box = [-3.1, 7.5, -16.0, -4.2]
const P_STAIR: [number, number, number] = [-3.4, -7.3, 1.1]
const P_TURRETS: [number, number][] = [[-5.2, 9.4], [4.0, 9.4]]
const P_BAY_T = -0.6                                             // the bay's centre along the lawn front
const P_GABLES: [Face, number][] = [['-x', 5.5], ['-z', 2.2], ['+x', -10]]
const TOWER: [number, number, number] = [-6.4, 0.6, 2.2]         // x, z, half-width: behind the right-hand (west) turret
const P_TURRET_HW = 1.6, P_TURRET_H = EAVES + 2, P_BAY_W = 7
const MERLON = 0.9, MERLON_H = 0.6
const CHIMNEYS: [number, number][] = [[-8.6, 5.5], [7.3, 5.5]]
const TOWER_H = 19, BELFRY_R = 2.0, BELFRY_H = 3.2, SPIRE_H = 9

export function fondationEmileLouise(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0
  range(out, y, P_NORTH, true)
  range(out, y, P_MID, false, ['+z', '-z'])
  range(out, y, P_SOUTH, false, ['+z'])
  const [sx, sz, sr] = P_STAIR
  turret(out, sx, sz, y + 0.01, y + EAVES + 1.5, sr, 3.5, BRICK, SLATE)
  const zf = P_NORTH[3]
  for (const [x] of P_TURRETS) {                                                                    // square stone turrets
    const tx0 = x - P_TURRET_HW, tx1 = x + P_TURRET_HW, tz0 = zf - 1.5, tz1 = zf + 1.2
    block(out, tx0, tx1, tz0, tz1, y, y + P_TURRET_H, STONE)
    for (const yy of [1.4, G + 0.6, G + FL + 0.6]) rectOn(out, '+z', tz1, x - 0.3, x + 0.3, y + yy, y + yy + 1.6, GLASS, 0.07)
    roof(out, tx0 - 0.2, tx1 + 0.2, tz0 - 0.2, tz1 + 0.2, y + P_TURRET_H, TURRET_ROOF, P_TURRET_HW + 0.2, 1.55, SLATE)
  }
  for (let x = P_NORTH[0] + 0.5; x < P_NORTH[1] - 0.5; x += MERLON * 2) {                          // stepped parapet
    if (Math.abs(x - P_BAY_T) < P_BAY_W / 2 + 0.5) continue
    block(out, x, x + MERLON, zf - 0.3, zf + 0.12, y + EAVES, y + EAVES + MERLON_H, STONE)
  }
  for (const [cx, cz] of CHIMNEYS) block(out, cx - 0.6, cx + 0.6, cz - 0.4, cz + 0.4, y + EAVES, y + EAVES + ROOF_H + 1.2, BRICK, brick)
  // the central gable: a huge mullioned window stepped up into it, over a balustraded balcony; door and two arched windows below
  gable(out, y, '+z', zf, P_BAY_T, P_BAY_W, 7.5)
  const bf = zf + GABLE_PROUD
  rectOn(out, '+z', bf, P_BAY_T - 2.6, P_BAY_T + 2.6, y + G + 0.4, y + EAVES + 1.5, STONE, 0.05)
  rectOn(out, '+z', bf, P_BAY_T - 2.3, P_BAY_T + 2.3, y + G + 0.6, y + EAVES + 0.6, GLASS, 0.08)
  rectOn(out, '+z', bf, P_BAY_T - 1.2, P_BAY_T + 1.2, y + EAVES + 0.6, y + EAVES + 2.6, GLASS, 0.08)
  for (const d of [-1.15, 0, 1.15]) rectOn(out, '+z', bf, P_BAY_T + d - 0.07, P_BAY_T + d + 0.07, y + G + 0.6, y + EAVES + (d ? 0.6 : 2.6), STONE, 0.1)
  block(out, P_BAY_T - 3, P_BAY_T + 3, bf, bf + 1.3, y + G - 0.35, y + G, STONE)                 // balcony slab
  block(out, P_BAY_T - 3, P_BAY_T + 3, bf + 1.15, bf + 1.3, y + G, y + G + 1, STONE)              // balustrade
  for (const d of [-2.4, 2.4]) block(out, P_BAY_T + d - 0.25, P_BAY_T + d + 0.25, bf, bf + 1.2, y + G - 1.2, y + G - 0.35, STONE)
  rectOn(out, '+z', bf, P_BAY_T - 0.8, P_BAY_T + 0.8, y, y + 2.8, GLASS, 0.08)                     // the door
  for (const d of [-2, 2]) rectOn(out, '+z', bf, P_BAY_T + d - 0.5, P_BAY_T + d + 0.5, y + 0.9, y + 2.6, GLASS, 0.08)
  for (const [f, t] of P_GABLES) {
    const plane = f === '-x' ? P_NORTH[0] : f === '+x' ? P_SOUTH[1] : P_SOUTH[2]
    gable(out, y, f, plane, t)
  }
  // the clock tower: brick shaft with two clock faces, open belfry with corner pinnacles, tall slate spire
  const [tx, tz, th] = TOWER, yt = y + TOWER_H
  block(out, tx - th, tx + th, tz - th, tz + th, y, yt, BRICK, brick)
  block(out, tx - th - 0.25, tx + th + 0.25, tz - th - 0.25, tz + th + 0.25, yt - 0.5, yt, STONE)
  for (const [f, plane] of faces([tx - th, tx + th, tz - th, tz + th])) {
    const c = f[1] === 'z' ? tx : tz
    if (f === '+z' || f === '-x') rectOn(out, f, plane, c - 1.1, c + 1.1, yt - 4, yt - 1.8, CLOCK, 0.06)
  }
  block(out, tx - BELFRY_R, tx + BELFRY_R, tz - BELFRY_R, tz + BELFRY_R, yt, yt + BELFRY_H, BRICK, brick)
  for (const [f, plane] of faces([tx - BELFRY_R, tx + BELFRY_R, tz - BELFRY_R, tz + BELFRY_R])) {
    const c = f[1] === 'z' ? tx : tz
    for (const d of [-0.7, 0.7]) rectOn(out, f, plane, c + d - 0.3, c + d + 0.3, yt + 0.6, yt + BELFRY_H - 0.5, GLASS, 0.07)
  }
  roof(out, tx - BELFRY_R - 0.3, tx + BELFRY_R + 0.3, tz - BELFRY_R - 0.3, tz + BELFRY_R + 0.3, yt + BELFRY_H, SPIRE_H,
    BELFRY_R + 0.3, BELFRY_R + 0.3, SLATE)
  for (const dx of [-1, 1]) for (const dz of [-1, 1]) pinnacle(out, tx + dx * th, tz + dz * th, yt, 2.2, 0.5, STONE)
}
