/**
 * LE VAU'S PAVILLONS DU ROI AND DE LA REINE (1654–1660) AND THE PORTIQUE: the two long classical wings that close the
 * south half of the enceinte round the cour royale, pale ashlar of three storeys under tall slate hipped roofs with
 * dormers and chimney stacks; the Roi (west) is the deeper, with a pedimented, pilastered frontispiece on the court; the
 * Reine (east) is narrower, with end pavilions reaching the east wall. The portique closes the court to the north: a low
 * arcaded screen between the wings with a triumphal-arch gate in the middle (the OSM roof w1416533435).
 * Plan: OSM w83819059, w1458069802, w1416533435 (osmium). Heights: IGN lidar MNS (2026-11-04) — Roi eaves ~16.5, ridge
 * 29; Reine eaves ~19, ridge 26–27; portique screen ~8, gate roof 9. Refs: docs/landmarks/refs/vincennes/pavillons (Commons photos).
 * Local frame: the donjon's (x along bearing 97.6, +z north), shifted by (OX, OZ) to the south court's middle.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { block, hex, type Rgb } from '../../kit.ts'
import { archOn, rectOn } from '../palaces/common.ts'
import { quadN } from '../venues/bowl.ts'

const STONE: Rgb = hex('#d8cfbb'), STONE_D: Rgb = hex('#c4baa4'), SLATE: Rgb = hex('#4a5058'), DARK: Rgb = hex('#2e2c2a'),
  GLASS: Rgb = hex('#3a4250')

const OX = 95, OZ = -93
type R = [number, number, number, number]
const sh = (r: R): R => [r[0] - OX, r[1] - OX, r[2] - OZ, r[3] - OZ]
// the Roi: body, walls, ridge; the court frontispiece (z span, projection, height)
const ROI = sh([8.5, 35, -148, -55]), ROI_E = 16.5, ROI_R = 29
const ROI_FRONT: [number, number] = [-108 - OZ, -92 - OZ], FRONT_D = 1.5, FRONT_H = 20.5
// the Reine: body and its end pavilions, the east bulge
const REINE = sh([159.5, 171, -148, -55]), REINE_E = 19, REINE_R = 26.5
const REINE_ENDS: R[] = [sh([159.5, 182.2, -62.4, -55]), sh([159.5, 182.2, -147.7, -135])]
const REINE_BULGE = sh([171, 174.1, -108.5, -92.6])
// the portique: screen line, depth, height; the gate block, its roof
const SCREEN = sh([35, 159.5, -47.3, -45.7]), SCREEN_H = 7.5
const GATE = sh([84.7, 108.4, -47.6, -38]), GATE_E = 6.6, GATE_R = 8.8, GATE_ARCH_W = 5.5, GATE_ARCH_H = 5.5
const BAY = 3.6, WIN_W = 1.5, WIN_H = 3.2, STOREYS = [1.3, 6.6, 11.6]
const CHIMNEY_W = 2.2, CHIMNEY_UP = 3.6
// Reine mansard: brisis rise and inset; dormer spacing (bays); portique balustrade height
const BRISIS_UP = 4.5, BRISIS_IN = 1.6, DORMER_EVERY = 1, BALUSTRADE_H = 1.1

/** a hipped roof, ridge along the longer side */
function hip(out: MeshBuilder, [x0, x1, z0, z1]: R, yE: number, yR: number, o = 0.4): void {
  x0 -= o; x1 += o; z0 -= o; z1 += o
  const alongZ = z1 - z0 > x1 - x0, hw = alongZ ? (x1 - x0) / 2 : (z1 - z0) / 2
  const xm = (x0 + x1) / 2, zm = (z0 + z1) / 2
  if (alongZ) {
    const r0 = z0 + hw, r1 = z1 - hw
    quadN(out, [[x0, yE, z0], [x0, yE, z1], [xm, yR, r1], [xm, yR, r0]], [-1, 1, 0], SLATE)
    quadN(out, [[x1, yE, z0], [x1, yE, z1], [xm, yR, r1], [xm, yR, r0]], [1, 1, 0], SLATE)
    quadN(out, [[x0, yE, z0], [x1, yE, z0], [xm, yR, r0], [xm, yR, r0]], [0, 1, -1], SLATE)
    quadN(out, [[x0, yE, z1], [x1, yE, z1], [xm, yR, r1], [xm, yR, r1]], [0, 1, 1], SLATE)
  } else {
    const r0 = x0 + hw, r1 = x1 - hw
    quadN(out, [[x0, yE, z0], [x1, yE, z0], [r1, yR, zm], [r0, yR, zm]], [0, 1, -1], SLATE)
    quadN(out, [[x0, yE, z1], [x1, yE, z1], [r1, yR, zm], [r0, yR, zm]], [0, 1, 1], SLATE)
    quadN(out, [[x0, yE, z0], [x0, yE, z1], [r0, yR, zm], [r0, yR, zm]], [-1, 1, 0], SLATE)
    quadN(out, [[x1, yE, z0], [x1, yE, z1], [r1, yR, zm], [r1, yR, zm]], [1, 1, 0], SLATE)
  }
}

/** windows on the three storeys of one face, a dormer row on the roof above */
function fenestrate(out: MeshBuilder, f: '+x' | '-x' | '+z' | '-z', plane: number, t0: number, t1: number, y: number,
  yE: number, dormer: number): void {
  const n = Math.floor((t1 - t0) / BAY), step = (t1 - t0) / n, s = f[0] === '+' ? 1 : -1
  for (let i = 0; i < n; i++) {
    const t = t0 + (i + 0.5) * step
    for (const h of STOREYS) if (h + WIN_H < yE - 1) rectOn(out, f, plane, t - WIN_W / 2, t + WIN_W / 2, y + h, y + h + WIN_H, GLASS)
    if (i % DORMER_EVERY) continue
    const d = s * dormer, x = f[1] === 'x', yb = y + yE + 0.8
    const [a0, a1] = [plane + d - s * 1.2, plane + d + s * 0.2].sort((p, q) => p - q)
    if (x) block(out, a0, a1, t - 0.9, t + 0.9, yb, yb + 2.3, STONE)
    else block(out, t - 0.9, t + 0.9, a0, a1, yb, yb + 2.3, STONE)
    rectOn(out, f, plane + d + s * 0.2, t - 0.5, t + 0.5, yb + 0.2, yb + 1.8, GLASS)
    const tp = plane + d + s * 0.2, tb = plane + d - s * 1.2
    if (x) quadN(out, [[tp, yb + 2.3, t - 1], [tp, yb + 2.3, t + 1], [tb, yb + 3.2, t], [tp, yb + 3.2, t]], [s, 1, 0], SLATE)
    else quadN(out, [[t - 1, yb + 2.3, tp], [t + 1, yb + 2.3, tp], [t, yb + 3.2, tb], [t, yb + 3.2, tp]], [0, 1, s], SLATE)
  }
}

function wing(out: MeshBuilder, r: R, y: number, yE: number, yR: number, dormer: number, mansard = false): void {
  const [x0, x1, z0, z1] = r
  block(out, x0, x1, z0, z1, y, y + yE, STONE)
  block(out, x0 - 0.3, x1 + 0.3, z0 - 0.3, z1 + 0.3, y, y + 0.9, STONE_D)                 // plinth
  block(out, x0 - 0.4, x1 + 0.4, z0 - 0.4, z1 + 0.4, y + yE - 0.6, y + yE, STONE_D)       // cornice
  block(out, x0 - 0.1, x1 + 0.1, z0 - 0.1, z1 + 0.1, y + 5.9, y + 6.3, STONE_D)           // string courses
  block(out, x0 - 0.1, x1 + 0.1, z0 - 0.1, z1 + 0.1, y + 11, y + 11.4, STONE_D)
  if (mansard) {
    const [a, b, c, d] = r, i = BRISIS_IN, yb = y + yE + BRISIS_UP
    quadN(out, [[a - 0.4, y + yE, c - 0.4], [b + 0.4, y + yE, c - 0.4], [b - i, yb, c + i], [a + i, yb, c + i]], [0, 0.4, -1], SLATE)
    quadN(out, [[a - 0.4, y + yE, d + 0.4], [b + 0.4, y + yE, d + 0.4], [b - i, yb, d - i], [a + i, yb, d - i]], [0, 0.4, 1], SLATE)
    quadN(out, [[a - 0.4, y + yE, c - 0.4], [a - 0.4, y + yE, d + 0.4], [a + i, yb, d - i], [a + i, yb, c + i]], [-1, 0.4, 0], SLATE)
    quadN(out, [[b + 0.4, y + yE, c - 0.4], [b + 0.4, y + yE, d + 0.4], [b - i, yb, d - i], [b - i, yb, c + i]], [1, 0.4, 0], SLATE)
    hip(out, [a + i, b - i, c + i, d - i], yb, y + yR, 0)
  } else hip(out, r, y + yE, y + yR)
  fenestrate(out, '+x', x1, z0, z1, y, yE, dormer); fenestrate(out, '-x', x0, z0, z1, y, yE, dormer)
  fenestrate(out, '+z', z1, x0, x1, y, yE, dormer); fenestrate(out, '-z', z0, x0, x1, y, yE, dormer)
}

function chimneys(out: MeshBuilder, [x0, x1, z0, z1]: R, y: number, yR: number, n: number): void {
  const xm = (x0 + x1) / 2, hw = (x1 - x0) / 2
  for (let i = 0; i < n; i++) {
    const z = z0 + hw + 2 + (i * (z1 - z0 - 2 * hw - 4)) / (n - 1)
    for (const dx of [-hw * 0.35, hw * 0.35]) {
      block(out, xm + dx - CHIMNEY_W / 2, xm + dx + CHIMNEY_W / 2, z - 1.6, z + 1.6, y + yR - 4, y + yR + CHIMNEY_UP, STONE)
      block(out, xm + dx - CHIMNEY_W / 2 - 0.2, xm + dx + CHIMNEY_W / 2 + 0.2, z - 1.8, z + 1.8, y + yR + CHIMNEY_UP - 0.4,
        y + yR + CHIMNEY_UP, STONE_D)
    }
  }
}

function roiFront(out: MeshBuilder, y: number): void {
  const x = ROI[1], [z0, z1] = ROI_FRONT, xf = x + FRONT_D, zm = (z0 + z1) / 2
  block(out, x, xf, z0, z1, y, y + FRONT_H, STONE)
  for (let i = 0; i <= 4; i++) {                                                          // pilasters, two orders
    const z = z0 + 0.6 + (i * (z1 - z0 - 1.2)) / 4
    block(out, xf, xf + 0.35, z - 0.45, z + 0.45, y + 0.9, y + FRONT_H - 1, STONE_D)
  }
  for (const h of [6, 11.2, FRONT_H - 1]) block(out, xf, xf + 0.5, z0, z1, y + h, y + h + 0.5, STONE_D)
  for (let i = 0; i < 4; i++) {
    const t = z0 + 0.6 + ((i + 0.5) * (z1 - z0 - 1.2)) / 4
    archOn(out, '+x', xf, t, y + 1.2, 1.8, 4, i === 1 || i === 2 ? DARK : GLASS)
    for (const h of [6.8, 12]) rectOn(out, '+x', xf, t - 0.8, t + 0.8, y + h, y + h + 3.4, GLASS)
  }
  const yp = y + FRONT_H - 0.5                                                             // the pediment
  quadN(out, [[xf + 0.5, yp, z0 - 0.3], [xf + 0.5, yp, z1 + 0.3], [xf + 0.5, yp + 4, zm], [xf + 0.5, yp + 4, zm]], [1, 0, 0], STONE_D)
  quadN(out, [[xf + 0.5, yp, z0 - 0.3], [xf + 0.5, yp + 4, zm], [x - 2, yp + 4, zm], [x - 2, yp, z0 - 0.3]], [0, 1, -1], SLATE)
  quadN(out, [[xf + 0.5, yp, z1 + 0.3], [xf + 0.5, yp + 4, zm], [x - 2, yp + 4, zm], [x - 2, yp, z1 + 0.3]], [0, 1, 1], SLATE)
}

function portique(out: MeshBuilder, y: number): void {
  const [x0, x1, z0, z1] = SCREEN, [g0, g1, gz0, gz1] = GATE
  for (const [a, b] of [[x0, g0], [g1, x1]]) {
    block(out, a, b, z0, z1, y, y + SCREEN_H, STONE)
    block(out, a, b, z0 - 0.3, z1 + 0.3, y + SCREEN_H - 0.7, y + SCREEN_H, STONE_D)
    block(out, a, b, z0, z0 + 0.25, y + SCREEN_H, y + SCREEN_H + BALUSTRADE_H, STONE_D)   // balustrade
    block(out, a, b, z1 - 0.25, z1, y + SCREEN_H, y + SCREEN_H + BALUSTRADE_H, STONE_D)
    const n = Math.round((b - a) / 4.2), step = (b - a) / n
    for (let i = 0; i < n; i++) {
      const t = a + (i + 0.5) * step
      archOn(out, '+z', z1, t, y, step * 0.62, 5.2, DARK); archOn(out, '-z', z0, t, y, step * 0.62, 5.2, DARK)
    }
  }
  block(out, g0, g1, gz0, gz1, y, y + GATE_E, STONE)
  block(out, g0 - 0.3, g1 + 0.3, gz0 - 0.3, gz1 + 0.3, y + GATE_E - 0.6, y + GATE_E, STONE_D)
  hip(out, GATE, y + GATE_E, y + GATE_R, 0.3)
  const gm = (g0 + g1) / 2
  for (const [f, p] of [['+z', gz1], ['-z', gz0]] as const) {
    const s = f[0] === '+' ? 1 : -1
    archOn(out, f, p, gm, y, GATE_ARCH_W, GATE_ARCH_H, DARK)
    for (const t of [-1, 1]) {
      archOn(out, f, p, gm + t * 7, y, 2.6, 4, DARK)
      for (const c of [4.2, 9.8]) block(out, gm + t * c - 0.4, gm + t * c + 0.4, ...([p, p + s * 0.6].sort((a, b) => a - b) as [number, number]),
        y, y + GATE_E - 0.6, STONE_D)                                                       // engaged columns
    }
  }
}

export function pavillonsVincennes(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0
  wing(out, ROI, y, ROI_E, ROI_R, 3)
  chimneys(out, ROI, y, ROI_R, 5)
  roiFront(out, y)
  wing(out, REINE, y, REINE_E, REINE_R, 1.8, true)
  chimneys(out, REINE, y, REINE_R, 3)
  for (const e of REINE_ENDS) wing(out, e, y, REINE_E, REINE_R + 0.5, 1.8, true)
  block(out, ...REINE_BULGE, y, y + REINE_E, STONE)
  portique(out, y)
}
