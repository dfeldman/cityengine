/**
 * THE OWNER'S 2026-10-06 LIST, from their photographs: small buildings in the Presidio, at Fort Mason and by the beach
 * that were generic boxes. Each is fitted to its OSM outline: local x along the long axis, the front (+z) turned by the
 * manifest's `front`.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { box, prism, type Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { sign } from '../signage.ts'
import { tower, towerRing } from '../tower.ts'

type V = [number, number, number]
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

/** a pitched roof over x0..x1 × z0..z1 with its ridge along X, eaves at y, `rise` up; `hip` closes the ends */
export function ridgeX(out: MeshBuilder, x0: number, x1: number, z0: number, z1: number, y: number, rise: number, c: Rgb, tag: number,
                       hip = false, over = 0.35): void {
  x0 -= over; x1 += over; z0 -= over; z1 += over
  const zm = (z0 + z1) / 2
  const hx = hip ? Math.min((x1 - x0) / 3, (z1 - z0) / 2) : 0
  const a: V = [x0 + hx, y + rise, zm], b: V = [x1 - hx, y + rise, zm]
  const half = (z1 - z0) / 2
  out.quad([[x0, y, z1], [x1, y, z1], b, a], [0, half, rise], UV, c, tag)
  out.quad([[x1, y, z0], [x0, y, z0], a, b], [0, half, -rise], UV, c, tag)
  if (hip) {
    out.quad([[x0, y, z0], [x0, y, z1], a, a], [-rise, half, 0], UV, c, tag)
    out.quad([[x1, y, z1], [x1, y, z0], b, b], [rise, half, 0], UV, c, tag)
  }
}

/** the triangle closing a ridgeX roof at x, facing ±x */
export function gableX(out: MeshBuilder, x: number, z0: number, z1: number, y: number, rise: number, c: Rgb, tag: number, s: 1 | -1): void {
  const zm = (z0 + z1) / 2
  out.quad(s > 0 ? [[x, y, z1], [x, y, z0], [x, y + rise, zm], [x, y + rise, zm]] : [[x, y, z0], [x, y, z1], [x, y + rise, zm], [x, y + rise, zm]],
    [s, 0, 0], UV, c, tag)
}

/** windows along a wall at z (facing ±z), from x0 to x1, `n` of them, sill y0 to head y1 */
function windowsZ(out: MeshBuilder, z: number, s: 1 | -1, x0: number, x1: number, n: number, y0: number, y1: number, w: number,
                  glass: Rgb, frame: Rgb): void {
  for (let k = 0; k < n; k++) {
    const x = x0 + ((k + 0.5) / n) * (x1 - x0)
    box(out, x, (y0 + y1) / 2, z + s * 0.03, w / 2 + 0.08, (y1 - y0) / 2 + 0.08, 0.03, frame, 0)
    box(out, x, (y0 + y1) / 2, z + s * 0.06, w / 2, (y1 - y0) / 2, 0.02, glass, surfaceTag('glass'))
  }
}

/** windows along a wall at x (facing ±x) */
function windowsX(out: MeshBuilder, x: number, s: 1 | -1, z0: number, z1: number, n: number, y0: number, y1: number, w: number,
                  glass: Rgb, frame: Rgb): void {
  for (let k = 0; k < n; k++) {
    const z = z0 + ((k + 0.5) / n) * (z1 - z0)
    box(out, x + s * 0.03, (y0 + y1) / 2, z, 0.03, (y1 - y0) / 2 + 0.08, w / 2 + 0.08, frame, 0)
    box(out, x + s * 0.06, (y0 + y1) / 2, z, 0.02, (y1 - y0) / 2, w / 2, glass, surfaceTag('glass'))
  }
}

/**
 * Turn what was drawn from vertex `v0` on (and its signs from `s0`) a quarter round so local +x becomes +z: a chapel is
 * drawn along x with its door at +x, and a manifest's `front` turns +z to the street.
 */
function xToZ(out: MeshBuilder, v0: number, s0 = out.signs.length): void {
  const P = out.positions, N = out.normals
  for (let i = v0; i < P.length; i += 3) {
    const x = P[i], z = P[i + 2]; P[i] = -z; P[i + 2] = x
    const nx = N[i], nz = N[i + 2]; N[i] = -nz; N[i + 2] = nx
  }
  for (let i = s0; i < out.signs.length; i++) { const sg = out.signs[i]; const x = sg.x, z = sg.z; sg.x = -z; sg.z = x; sg.heading += -Math.PI / 2 }
}

/**
 * Stand what was drawn from vertex `v0` on the HIGHEST ground under its footprint (±hx, ±hz), with a plinth in `c` down
 * to the model's base: a builder's y = 0 is the lowest ground, and on a slope the walls sank into the uphill side.
 */
function standHigh(out: MeshBuilder, fit: Fit, v0: number, hx: number, hz: number, c: Rgb): void {
  const g = fit.groundAt
  if (!g) return
  let lift = 0
  for (const [a, b] of [[-1, -1], [-1, 1], [1, -1], [1, 1], [0, 0], [0, 1], [0, -1], [1, 0], [-1, 0]]) lift = Math.max(lift, g(a * hx * 0.9, b * hz * 0.9))
  if (lift < 0.05) return
  for (let i = v0; i < out.positions.length; i += 3) out.positions[i + 1] += lift
  box(out, 0, lift / 2 - 0.2, 0, hx, lift / 2 + 0.2, hz, c, surfaceTag('concrete'))
}

const GLASS: Rgb = [0.2, 0.24, 0.27]
const WHITE: Rgb = [0.93, 0.93, 0.9]
const CREAM: Rgb = [0.9, 0.87, 0.78]
const RED_SHINGLE: Rgb = [0.55, 0.2, 0.15]
const TILE_RED: Rgb = [0.72, 0.33, 0.2]

/**
 * way/288325535 — the PRESIDIO RELIGIOUS ACTIVITIES CENTER (owner: "a small church, we render it as two boxy
 * buildings one of which has a spire"; photograph): a white clapboard chapel, a long gabled nave under a red shingle
 * roof, tall narrow windows down its sides, a brick chimney at the back; over the front gable a square belfry with a
 * tall red shingled spire on a flared eave; a little red-roofed porch on posts at the door.
 */
export function presidioChapel(out: MeshBuilder, fit: Fit): void {
  const clap = surfaceTag('clapboard'), shingle = surfaceTag('tile')
  const v0 = out.positions.length
  // (drawn along x, the door at +x, then turned so the door faces the manifest's front: the nave runs back along z)
  const L = Math.max(9, fit.hz), W = Math.min(Math.max(4.5, fit.hx), 6.5)
  const E = 4.6, R = W * 0.75
  // the nave, its front at +x
  box(out, 0, E / 2, 0, L, E / 2, W, WHITE, clap)
  ridgeX(out, -L, L, -W, W, E, R, RED_SHINGLE, shingle)
  for (const s of [-1, 1] as const) gableX(out, s * L, -W, W, E, R, WHITE, clap, s)
  for (const s of [-1, 1] as const) windowsZ(out, s * W, s, -L + 1.5, L - 2.5, 5, 1.0, 3.7, 0.7, GLASS, WHITE)
  // the brick chimney at the back
  box(out, -L + 1.2, E + R * 0.6, W * 0.45, 0.35, R * 0.6 + 0.6, 0.35, [0.55, 0.28, 0.22], surfaceTag('brick'))
  // the belfry over the front gable: a square tower, louvred openings, the flared eave and the spire
  const bx = L - 1.6, B = 1.5, by = E + R * 0.5
  box(out, bx, by + 1.6, 0, B, 1.6 + R * 0.5, B, WHITE, clap)
  for (const [nx, nz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) box(out, bx + nx * (B + 0.02), by + 2.4, nz * (B + 0.02), nx ? 0.02 : 0.55, 0.8, nz ? 0.02 : 0.55, [0.25, 0.22, 0.2], 0)
  prism(out, bx, 0, by + 3.2, by + 3.6, B * 1.75, 4, RED_SHINGLE, shingle, B * 1.25)
  prism(out, bx, 0, by + 3.6, by + 11, B * 1.25, 4, RED_SHINGLE, shingle, 0.05)
  box(out, bx, by + 11.4, 0, 0.04, 0.5, 0.04, [0.3, 0.3, 0.3], 0)
  box(out, bx, by + 11.6, 0, 0.04, 0.04, 0.25, [0.3, 0.3, 0.3], 0)
  // the door and its porch: a small gable on four posts
  box(out, L + 0.03, 1.2, 0, 0.03, 1.2, 0.8, [0.35, 0.18, 0.12], 0)
  for (const [px, pz] of [[L + 2.4, -1.4], [L + 2.4, 1.4], [L + 0.3, -1.4], [L + 0.3, 1.4]]) box(out, px, 1.35, pz, 0.09, 1.35, 0.09, WHITE, 0)
  ridgeX(out, L, L + 2.5, -1.6, 1.6, 2.7, 1.1, RED_SHINGLE, shingle, false, 0.15)
  gableX(out, L + 2.5, -1.6, 1.6, 2.7, 1.1, WHITE, clap, 1)
  box(out, L + 1.3, 0.12, 0, 1.4, 0.12, 1.7, [0.66, 0.65, 0.62], surfaceTag('concrete'))
  xToZ(out, v0)
}

/**
 * way/288387369 — Fort Mason's CHAPEL (owner's photograph; OSM has it unnamed, 29 m from the post's flagpole): white stucco Mission style. A gabled front with a
 * moulded coping, a quatrefoil vent high in it, a tiled hood over the round-arched double door up a flight of steps,
 * small-paned windows either side; a square bell tower at the corner, two arched openings and a red tile cap; the
 * walls splayed out a little at their foot. And in front, a flagpole fifty feet high.
 */
export function fortMasonChapel(out: MeshBuilder, fit: Fit): void {
  const st = surfaceTag('stucco'), tile = surfaceTag('tile')
  const v0 = out.positions.length
  const L = Math.max(9, fit.hz), W = Math.min(Math.max(5, fit.hx), 8)
  const E = 6.5, R = W * 0.55
  const STUCCO: Rgb = [0.92, 0.9, 0.86]
  box(out, 0, E / 2, 0, L, E / 2, W, STUCCO, st)
  // the battered foot
  box(out, 0, 0.6, 0, L + 0.25, 0.6, W + 0.25, STUCCO, st)
  ridgeX(out, -L, L, -W, W, E, R, TILE_RED, tile, false, 0.3)
  for (const s of [-1, 1] as const) gableX(out, s * L, -W, W, E, R, STUCCO, st, s)
  // the coping along the front gable's rakes
  const len = Math.hypot(W, R)
  for (const s of [-1, 1]) {
    const steps = 8
    for (let k = 0; k < steps; k++) {
      const t0 = k / steps, t1 = (k + 1) / steps
      const z0 = s * W * (1 - t0), z1 = s * W * (1 - t1), y0 = E + R * t0, y1 = E + R * t1
      box(out, L + 0.12, (y0 + y1) / 2 + 0.15, (z0 + z1) / 2, 0.15, Math.abs(y1 - y0) / 2 + 0.15, Math.abs(z1 - z0) / 2, STUCCO, st)
    }
    void len
  }
  // the quatrefoil, the arched door, its tiled hood, the steps
  box(out, L + 0.05, E + R * 0.55, 0, 0.05, 0.55, 0.55, [0.85, 0.83, 0.8], st)
  box(out, L + 0.08, E + R * 0.55, 0, 0.03, 0.3, 0.3, [0.3, 0.3, 0.32], 0)
  box(out, L + 0.04, 1.9, 0, 0.04, 1.4, 0.9, [0.45, 0.28, 0.16], 0)
  for (let k = 0; k < 5; k++) { const t = (k + 0.5) / 5; box(out, L + 0.05, 3.3 + t * 0.9, 0, 0.05, 0.1, 0.9 * Math.sqrt(1 - t * t) + 0.01, [0.45, 0.28, 0.16], 0) }
  box(out, L + 0.35, 2.4, 0, 0.35, 2.4, 1.6, STUCCO, st)
  ridgeX(out, L, L + 0.8, -1.8, 1.8, 4.8, 0.7, TILE_RED, tile, false, 0.1)
  for (let k = 0; k < 4; k++) box(out, L + 0.9 + k * 0.32, 0.45 - k * 0.12, 0, 0.16, 0.45 - k * 0.12, 1.5, [0.8, 0.79, 0.76], surfaceTag('concrete'))
  windowsX(out, L, 1, -W + 1, -W + 2.2, 1, 2.2, 3.4, 0.6, GLASS, WHITE)
  windowsX(out, L, 1, W - 2.2, W - 1, 1, 2.2, 3.4, 0.6, GLASS, WHITE)
  windowsZ(out, W, 1, -L + 1.5, L - 3, 4, 2.4, 5.0, 0.9, GLASS, WHITE)
  windowsZ(out, -W, -1, -L + 1.5, L - 3, 4, 2.4, 5.0, 0.9, GLASS, WHITE)
  // the bell tower at the front corner, its two arched openings and red tile cap
  const tx = L - 1.6, tz = -W + 1.3, T = 1.45, TH = E + R + 2.6
  box(out, tx, TH / 2, tz, T, TH / 2, T, STUCCO, st)
  for (const k of [-0.6, 0.6]) {
    for (const [nx, nz] of [[1, 0], [0, -1]]) box(out, tx + nx * (T + 0.02) + nz * k * 0, TH - 1.3, tz + nz * (T + 0.02) + (nx ? k : 0), nx ? 0.02 : 0.3, 0.75, nz ? 0.02 : 0.3, [0.12, 0.1, 0.1], 0)
  }
  box(out, tx, TH + 0.12, tz, T + 0.2, 0.12, T + 0.2, STUCCO, st)
  prism(out, tx, tz, TH + 0.24, TH + 1.1, (T + 0.3) * 1.41, 4, TILE_RED, tile, 0.1)
  // the flagpole in front, ~15 m, a ball at the top, a flag
  const fx = L + 9
  prism(out, fx, 0, 0, 15.3, 0.12, 8, [0.92, 0.92, 0.9], surfaceTag('metal'), 0.06)
  prism(out, fx, 0, 15.3, 15.55, 0.13, 8, [0.85, 0.7, 0.3], surfaceTag('metal'), 0.13)
  for (let b = 0; b < 7; b++) box(out, fx, 14.6 - b * 0.16, 1.15, 0.01, 0.08, 1.05, b % 2 ? WHITE : [0.7, 0.12, 0.16], 0)
  box(out, fx, 14.4, 0.62, 0.012, 0.4, 0.52, [0.15, 0.2, 0.45], 0)
  xToZ(out, v0)
}

/**
 * way/288387355 — Fort Mason's GENERAL'S RESIDENCE (owner's photograph): a two-storey cream clapboard house, its deep
 * eaves on paired scrolled brackets, tall double-hung windows in dark red frames, and at the front a timber
 * porte-cochère with X-braced rails over the drive, a low wing to one side.
 */
export function generalsResidence(out: MeshBuilder, fit: Fit): void {
  const v0 = out.positions.length
  const clap = surfaceTag('clapboard')
  const L = Math.max(8, fit.hx * 0.8), W = Math.max(5, fit.hz * 0.8)
  const H = 7.2
  const FRAME: Rgb = [0.38, 0.13, 0.1]
  box(out, 0, H / 2, 0, L, H / 2, W, CREAM, clap)
  ridgeX(out, -L, L, -W, W, H, 1.6, [0.4, 0.4, 0.38], surfaceTag('tile'), true, 0.8)
  // the brackets under the eaves, front and back
  for (const s of [-1, 1]) for (let x = -L + 0.6; x <= L - 0.5; x += 1.2) box(out, x, H - 0.2, s * (W + 0.35), 0.06, 0.2, 0.35, FRAME, 0)
  for (const s of [-1, 1] as const) {
    windowsZ(out, s * W, s, -L + 1, L - 1, 6, 1.0, 2.8, 0.9, GLASS, FRAME)
    windowsZ(out, s * W, s, -L + 1, L - 1, 6, 4.4, 6.2, 0.9, GLASS, FRAME)
  }
  for (const s of [-1, 1] as const) windowsX(out, s * L, s, -W + 1, W - 1, 3, 4.4, 6.2, 0.9, GLASS, FRAME)
  // the low wing
  box(out, -L - 3.5, 1.8, -W * 0.3, 3.5, 1.8, W * 0.6, CREAM, clap)
  box(out, -L - 3.5, 3.65, -W * 0.3, 3.7, 0.1, W * 0.6 + 0.3, [0.4, 0.4, 0.38], 0)
  // the porte-cochère at the front door
  const pz = W + 2.3
  for (const [x, z] of [[-1.6, pz + 1.3], [1.6, pz + 1.3], [-1.6, W + 0.4], [1.6, W + 0.4]]) box(out, x, 1.6, z, 0.12, 1.6, 0.12, CREAM, 0)
  box(out, 0, 3.3, (W + pz + 1.6) / 2, 2.0, 0.1, (pz + 1.6 - W) / 2, CREAM, 0)
  box(out, 0, 3.15, pz + 1.3, 1.7, 0.08, 0.06, CREAM, 0)
  for (const s of [-1, 1]) {
    box(out, s * 0.85, 2.7, pz + 1.3, 0.04, 0.4, 0.04, CREAM, 0)
  }
  for (const [x0, x1] of [[-1.6, 0], [0, 1.6]]) {
    const n = 6
    for (let k = 0; k < n; k++) { const t = (k + 0.5) / n; box(out, x0 + (x1 - x0) * t, 2.5 + 0.6 * Math.abs(t - 0.5) * 2, pz + 1.3, 0.04, 0.04, 0.04, CREAM, 0) }
  }
  box(out, 0, 1.25, W + 0.03, 0.55, 1.25, 0.03, [0.35, 0.15, 0.1], 0)
  standHigh(out, fit, v0, L, W, [0.8, 0.78, 0.72])
}

/**
 * way/288387358 — HASKELL HOUSE, Fort Mason (owner's photograph): a white clapboard house on the slope, two storeys
 * over a raised basement, angled bay windows on brackets, a bracketed cornice, and a long white stair up the side to
 * the porch, its rail in a lattice and the porch skirted in lattice below.
 */
export function haskellHouse(out: MeshBuilder, fit: Fit): void {
  const v0 = out.positions.length
  const clap = surfaceTag('clapboard')
  const L = Math.max(7, fit.hx * 0.85), W = Math.max(5, fit.hz * 0.8)
  const H = 8.6
  box(out, 0, H / 2, 0, L, H / 2, W, WHITE, clap)
  box(out, 0, H + 0.25, 0, L + 0.3, 0.25, W + 0.3, WHITE, 0)
  ridgeX(out, -L, L, -W, W, H + 0.5, 1.4, [0.42, 0.42, 0.4], surfaceTag('tile'), true, 0.3)
  // the bays: angled, on brackets, two storeys
  for (const bx of [-L * 0.45, L * 0.35]) {
    for (const [y0, y1] of [[2.4, 5.2], [5.6, 8.2]]) {
      box(out, bx, (y0 + y1) / 2, W + 0.55, 1.1, (y1 - y0) / 2, 0.55, WHITE, clap)
      box(out, bx, (y0 + y1) / 2 + 0.1, W + 1.12, 0.65, (y1 - y0) / 2 - 0.45, 0.02, GLASS, surfaceTag('glass'))
      for (const s of [-1, 1]) box(out, bx + s * 1.12, (y0 + y1) / 2 + 0.1, W + 0.55, 0.02, (y1 - y0) / 2 - 0.45, 0.35, GLASS, surfaceTag('glass'))
    }
    box(out, bx, 2.2, W + 0.4, 0.8, 0.25, 0.4, WHITE, 0)
  }
  windowsZ(out, W, 1, -L * 0.1, L * 0.05, 1, 5.8, 7.9, 0.8, GLASS, WHITE)
  for (const s of [-1, 1] as const) windowsX(out, s * L, s, -W + 1, W - 1, 3, 3, 4.9, 0.8, GLASS, WHITE)
  for (const s of [-1, 1] as const) windowsX(out, s * L, s, -W + 1, W - 1, 3, 5.8, 7.8, 0.8, GLASS, WHITE)
  // the porch at the side, lattice-skirted, and the stair up to it
  const px = L + 1.6
  box(out, px, 1.2, W * 0.4, 1.6, 1.2, W * 0.45, [0.88, 0.88, 0.85], 0)
  box(out, px, 2.45, W * 0.4, 1.7, 0.08, W * 0.5, WHITE, 0)
  for (let k = 0; k < 12; k++) {
    const t = k / 12
    box(out, px + 2.3 + t * 3.4, 2.4 * (1 - t) / 2 + 0.06, W * 0.4 - 1.2, 0.15, 2.4 * (1 - t) / 2 + 0.06, 0.6, WHITE, 0)
  }
  for (const s of [-1, 1]) box(out, px + 3.8, 1.9, W * 0.4 - 1.2 + s * 0.65, 1.9, 0.04, 0.03, WHITE, 0)
  standHigh(out, fit, v0, L, W, [0.85, 0.85, 0.82])
}

/**
 * way (near 37.779288, -122.512756) — the old PARK RESTAURANT by Sutro Baths (owner: "a red brick building (former
 * park restaurant, now vacant)"): a plain one-and-a-half-storey red brick block, a shallow hipped roof, tall boarded
 * windows in pale surrounds.
 */
export function brickParkRestaurant(out: MeshBuilder, fit: Fit): void {
  const v0 = out.positions.length
  const L = Math.max(5, fit.hx), W = Math.max(4, fit.hz)
  const H = 5.2
  const BRICK: Rgb = [0.46, 0.2, 0.15]
  box(out, 0, H / 2, 0, L, H / 2, W, BRICK, surfaceTag('brick'))
  box(out, 0, H + 0.15, 0, L + 0.15, 0.15, W + 0.15, [0.82, 0.78, 0.7], 0)
  ridgeX(out, -L, L, -W, W, H + 0.3, 1.4, [0.36, 0.34, 0.32], surfaceTag('tile'), true, 0.4)
  const BOARD: Rgb = [0.42, 0.36, 0.3], SURR: Rgb = [0.84, 0.8, 0.72]
  for (const s of [-1, 1] as const) windowsZ(out, s * W, s, -L + 0.8, L - 0.8, Math.max(2, Math.round(L / 1.6)), 1.0, 3.6, 1.0, BOARD, SURR)
  for (const s of [-1, 1] as const) windowsX(out, s * L, s, -W + 0.8, W - 0.8, Math.max(1, Math.round(W / 1.8)), 1.0, 3.6, 1.0, BOARD, SURR)
  standHigh(out, fit, v0, L, W, [0.5, 0.25, 0.2])
}

/**
 * FORT MASON CENTER's Landmark Buildings A–E (owner, 2026-10-06: "we're not really doing the Fort Mason Center, which
 * is old military buildings like the Presidio", photograph): long cream stucco army blocks, three storeys, under red
 * clay tile hipped roofs that oversail on exposed rafters; small-paned windows in dark red frames, evenly down the
 * walls; little gabled roof vents along the ridge; a red steel fire stair zig-zagging down an end wall.
 */
export function fortMasonBlock(out: MeshBuilder, fit: Fit): void {
  const ring = towerRing(fit)
  const H = Math.max(8, Math.min(14, fit.height > 0 ? fit.height - 3 : 11))
  const RED_FRAME: Rgb = [0.5, 0.14, 0.1]
  tower(out, { ...fit, ring }, {
    height: H,
    tiers: [{ to: 1, face: { kind: 'punched', wall: [0.9, 0.87, 0.78], glass: RED_FRAME, floor: 3.6, pitch: 3.2, solid: 0.62, material: 'stucco' } }],
    crown: { kind: 'hip', height: Math.min(4.5, fit.hz * 0.45), inset: -0.6, colour: TILE_RED, material: 'tile' },
  })
  // the roof vents along the ridge: small gabled boxes
  const n = Math.max(1, Math.floor(fit.hx / 14))
  for (let k = 0; k < n; k++) {
    const x = -fit.hx + ((k + 0.5) / n) * 2 * fit.hx
    box(out, x, H + Math.min(4.5, fit.hz * 0.45) * 0.75, 0, 1.0, 0.7, 1.0, [0.9, 0.87, 0.78], surfaceTag('stucco'))
    ridgeX(out, x - 1, x + 1, -1, 1, H + Math.min(4.5, fit.hz * 0.45) * 0.75 + 0.7, 0.6, TILE_RED, surfaceTag('tile'), false, 0.15)
  }
  // a red fire stair down the +x end wall: landings at each floor and flights between
  const FIRE: Rgb = [0.65, 0.12, 0.1]
  for (let f = 1; f * 3.6 < H; f++) {
    const y = f * 3.6
    box(out, fit.hx + 0.7, y, fit.hz * 0.4, 0.7, 0.05, 1.4, FIRE, surfaceTag('metal'))
    box(out, fit.hx + 1.38, y + 0.5, fit.hz * 0.4, 0.02, 0.5, 1.4, FIRE, surfaceTag('metal'))
    // the flight up from the landing below
    const steps = 8
    for (let k = 0; k < steps; k++) {
      const t = k / steps
      box(out, fit.hx + 0.7, y - 3.6 + 3.6 * t, fit.hz * 0.4 + (f % 2 ? -1 : 1) * (1.4 - 2.8 * t), 0.6, 0.03, 0.17, FIRE, surfaceTag('metal'))
    }
  }
}

/**
 * The FORT MASON CENTER GATE on Marina Boulevard (owner's photograph): two pairs of square cream stucco piers, each
 * with a small hipped red tile cap, an arched FORT MASON CENTER plaque and the Park Service arrowhead on the tall
 * inner piers, low tiled walls stepping out either side, the drive between.
 */
export function fortMasonGate(out: MeshBuilder, _fit: Fit): void {
  const st = surfaceTag('stucco'), tile = surfaceTag('tile')
  const CRM: Rgb = [0.9, 0.85, 0.72]
  const pier = (x: number, w: number, h: number): void => {
    box(out, x, h / 2, 0, w, h / 2, w, CRM, st)
    box(out, x, h + 0.1, 0, w + 0.12, 0.1, w + 0.12, CRM, st)
    prism(out, x, 0, h + 0.2, h + 0.2 + w * 0.8, (w + 0.35) * 1.41, 4, TILE_RED, tile, 0.08)
  }
  for (const s of [-1, 1]) {
    pier(s * 6.5, 1.25, 5.4)
    // the plaque, arched, and the arrowhead under it, on the face toward the street (+z)
    box(out, s * 6.5, 4.4, 1.27, 0.95, 0.28, 0.02, [0.22, 0.2, 0.18], 0)
    box(out, s * 6.5, 3.5, 1.27, 0.22, 0.32, 0.02, [0.42, 0.33, 0.24], 0)
    sign(out, { type: 'flat', text: 'FORT MASON CENTER', h: 0.12, face: 'roman', colour: [0.9, 0.88, 0.8], lit: 'none', w: 1.7 }, { x: s * 6.5, y: 4.4, z: 1.3, heading: 0 })
    // the wall stepping out, with its tiled coping, and a small outer pier
    box(out, s * 10, 1.6, 0, 2.3, 1.6, 0.35, CRM, st)
    ridgeX(out, s * 10 - 2.3, s * 10 + 2.3, -0.35, 0.35, 3.2, 0.35, TILE_RED, tile, false, 0.12)
    pier(s * 12.9, 0.7, 3.2)
  }
}
