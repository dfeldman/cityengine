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

/**
 * WIND ARROWS (owner, 2026-10-06, photographs: the Exploratorium's piece by the water): a tall white fluted pole and,
 * up one side of it, a column of slim rods on pivots, each tipped with a small red or dark arrowhead vane. Each vane
 * turns on its own pivot (render/rotors.ts) at its own slow pace, so the column flickers as wind does, never in step.
 */
export function windArrows(out: MeshBuilder, _fit: Fit): void {
  const POLE: Rgb = [0.93, 0.93, 0.92]
  const H = 12
  prism(out, 0, 0, 0, H, 0.16, 12, POLE, surfaceTag('metal'), 0.13)
  prism(out, 0, 0, H, H + 0.25, 0.13, 12, POLE, surfaceTag('metal'), 0.02)
  prism(out, 0, 0, -0.05, 0.25, 0.4, 12, [0.75, 0.75, 0.73], surfaceTag('concrete'), 0.36)
  const N = 22
  for (let k = 0; k < N; k++) {
    const y = 3.2 + (k / (N - 1)) * (H - 2.8)
    // the pivot on the pole, and a vane on its rod: drawn about the pivot, turning about the vertical
    const vane = new (out.constructor as new () => MeshBuilder)()
    const L = 0.9
    box(vane, L / 2, 0.25, 0, L / 2, 0.012, 0.012, [0.35, 0.36, 0.38], 0)
    const red = k % 5 === 2 || k % 7 === 4 ? [0.3, 0.12, 0.14] as Rgb : [0.88, 0.32, 0.2] as Rgb
    vane.quad([[L - 0.02, 0.25, 0], [L + 0.32, 0.25, 0], [L + 0.32, 0.25, 0], [L + 0.05, 0.38, 0]], [0, 0, 1], UV, red, 0)
    vane.quad([[L - 0.02, 0.25, 0], [L + 0.05, 0.12, 0], [L + 0.32, 0.25, 0], [L + 0.32, 0.25, 0]], [0, 0, 1], UV, red, 0)
    vane.quad([[L + 0.32, 0.25, 0], [L - 0.02, 0.25, 0], [L + 0.05, 0.38, 0], [L + 0.05, 0.38, 0]], [0, 0, -1], UV, red, 0)
    vane.quad([[L + 0.32, 0.25, 0], [L + 0.05, 0.12, 0], [L - 0.02, 0.25, 0], [L - 0.02, 0.25, 0]], [0, 0, -1], UV, red, 0)
    box(out, 0.17, y, 0, 0.04, 0.05, 0.04, [0.6, 0.6, 0.6], 0)
    out.rotors.push({ x: 0.2, y, z: 0, nx: 0, ny: 1, nz: 0, mb: vane, rpm: (k % 2 ? 1 : -1) * (0.8 + ((k * 0.37) % 1) * 1.6) })
  }
}

/**
 * way/257004417 — the SPRECKELS MANSION, 2080 Washington St (1913, George Applegarth; owner, 2026-10-06: "we do have a
 * custom model of it, but it's not very good"): a white limestone Beaux-Arts palace facing Lafayette Park. Three
 * storeys on a rusticated base; fluted Ionic pilasters through the two upper storeys; tall round-arched French windows
 * with carved cartouches over them and little bowed iron balconies; a deep modillioned cornice over a frieze, and a
 * balustraded parapet; on the garden side a bowed central bay.
 */
export function spreckelsMansion(out: MeshBuilder, fit: Fit): void {
  const ring = towerRing(fit)
  const STONE: Rgb = [0.93, 0.92, 0.88]
  const st = surfaceTag('ashlar')
  const H = 17
  tower(out, { ...fit, ring }, {
    height: H,
    base: { height: 4.6, face: { kind: 'punched', wall: [0.9, 0.89, 0.85], glass: GLASS, floor: 4.6, pitch: 3.4, solid: 0.55, arched: true, material: 'ashlar' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: STONE, glass: GLASS, floor: 5.4, pitch: 3.4, solid: 0.5, arched: true, head: 'architrave', material: 'ashlar' } }],
    cornices: [{ at: 4.7, depth: 0.35, colour: STONE }, { at: H - 1.4, depth: 0.9, height: 0.7, colour: STONE }],
    crown: { kind: 'balustrade', height: 1.1, colour: STONE, material: 'ashlar' },
  })
  const hx = fit.hx, hz = fit.hz
  // the pilasters, fluted (in courses), between the bays of the street front and the garden front
  for (const s of [-1, 1]) {
    for (let x = -hx + 1.7; x <= hx - 1.6; x += 3.4) {
      box(out, x, (4.8 + H - 1.6) / 2, s * (hz + 0.12), 0.3, (H - 1.6 - 4.8) / 2, 0.12, STONE, st)
      box(out, x, H - 1.75, s * (hz + 0.2), 0.42, 0.18, 0.2, STONE, st)                   // the Ionic capital
    }
    // the cartouches and the little bowed balconies at the piano nobile
    for (let x = -hx + 3.4; x <= hx - 3.3; x += 3.4) {
      box(out, x, 10.4, s * (hz + 0.1), 0.45, 0.35, 0.1, [0.88, 0.87, 0.83], st)
      box(out, x, 5.4, s * (hz + 0.35), 0.8, 0.06, 0.35, [0.2, 0.2, 0.2], surfaceTag('metal'))
      for (let k = 0; k < 6; k++) box(out, x - 0.7 + k * 0.28, 5.85, s * (hz + 0.68), 0.015, 0.45, 0.015, [0.15, 0.15, 0.15], 0)
      box(out, x, 6.3, s * (hz + 0.68), 0.8, 0.03, 0.03, [0.15, 0.15, 0.15], 0)
    }
  }
  // the bowed bay in the middle of the garden front (−z): a half drum, its own windows
  prism(out, 0, -hz, 0, H - 1.4, hx * 0.28, 16, STONE, st)
  for (let k = 0; k < 5; k++) {
    const a = Math.PI + (k + 0.5) / 5 * Math.PI
    const r = hx * 0.28 + 0.03
    box(out, Math.cos(a) * r, 8.2, -hz + Math.sin(a) * r, 0.5, 2.0, 0.04, GLASS, surfaceTag('glass'))
  }
}

/**
 * The SPRECKELS MANSION'S GREENHOUSE, behind it (way/257004424; owner: "we render the backyard greenhouse as a partially
 * submerged victorian house, not as a glass building"): a long glass conservatory on a low stone wall, white glazing
 * bars, a curved (barrel) glass roof, and a rounded glass end.
 */
export function spreckelsGreenhouse(out: MeshBuilder, fit: Fit): void {
  const L = Math.max(5, fit.hx - 0.3), W = Math.max(2.5, Math.min(fit.hz - 0.3, 5))
  const GL: Rgb = [0.62, 0.74, 0.76], BAR: Rgb = [0.95, 0.95, 0.93]
  const gt = surfaceTag('glass')
  // the stone sill wall
  box(out, 0, 0.35, 0, L, 0.35, W, [0.86, 0.84, 0.8], surfaceTag('ashlar'))
  // the glass walls, with bars every 0.9 m
  const E = 2.6
  for (const s of [-1, 1]) {
    box(out, 0, 0.7 + E / 2, s * W, L, E / 2, 0.02, GL, gt)
    for (let x = -L; x <= L + 0.01; x += 0.9) box(out, x, 0.7 + E / 2, s * (W + 0.02), 0.03, E / 2, 0.03, BAR, 0)
  }
  box(out, -L, 0.7 + E / 2, 0, 0.02, E / 2, W, GL, gt)
  // the barrel roof: glass panels round a half circle, bars along it
  const N = 10
  for (let k = 0; k < N; k++) {
    const a0 = (k / N) * Math.PI, a1 = ((k + 1) / N) * Math.PI
    const p = (a: number, x: number): [number, number, number] => [x, 0.7 + E + Math.sin(a) * W * 0.65, Math.cos(a) * W]
    const am = (a0 + a1) / 2
    out.quad([p(a0, -L), p(a1, -L), p(a1, L), p(a0, L)], [0, Math.sin(am), Math.cos(am)], UV, GL, gt)
    for (let x = -L; x <= L + 0.01; x += 1.8) box(out, x, 0.7 + E + Math.sin(a0) * W * 0.65, Math.cos(a0) * W, 0.03, 0.03, 0.03, BAR, 0)
  }
  // the rounded end: a half drum of glass and its dome
  prism(out, L, 0, 0.7, 0.7 + E, W, 16, GL, gt)
  prism(out, L, 0, 0.7 + E, 0.7 + E + W * 0.6, W, 16, GL, gt, 0.25)
  prism(out, L, 0, 0, 0.7, W + 0.05, 16, [0.86, 0.84, 0.8], surfaceTag('ashlar'))
}

/**
 * way/28691595 — the BEACH CHALET (1925, Willis Polk), at the park's ocean end (owner: "could use a more detailed
 * model"): a long two-storey block under a red tile hipped roof. Upstairs, the restaurant: a continuous band of small-
 * paned windows in dark red frames looking out to sea. Below, the WPA frescoed lobby behind a colonnade of plain round
 * cream columns in pairs, round-arched doorways in the cream wall behind; planting before it.
 */
export function beachChalet(out: MeshBuilder, fit: Fit): void {
  const st = surfaceTag('stucco')
  const L = Math.max(14, fit.hx), W = Math.max(7, fit.hz)
  const CRM: Rgb = [0.92, 0.88, 0.78], FR: Rgb = [0.48, 0.14, 0.1]
  const G = 4.6, U = 4.2
  // the ground storey set back behind the colonnade on the front (+z) and the sea side, the upper storey over all
  box(out, 0, G / 2, -1.5, L, G / 2, W - 1.5, CRM, st)
  box(out, 0, G + U / 2, 0, L, U / 2, W, CRM, st)
  box(out, 0, G + 0.15, 0, L + 0.2, 0.15, W + 0.2, CRM, st)
  ridgeX(out, -L, L, -W, W, G + U, 3.2, TILE_RED, surfaceTag('tile'), true, 0.9)
  // the upstairs band of windows, all round: small panes in red frames
  for (const s of [-1, 1] as const) {
    box(out, 0, G + U / 2 + 0.1, s * (W + 0.03), L - 0.8, 1.3, 0.03, GLASS, surfaceTag('glass'))
    for (let x = -L + 0.8; x <= L - 0.79; x += 0.75) box(out, x, G + U / 2 + 0.1, s * (W + 0.06), 0.05, 1.3, 0.03, FR, 0)
    for (const y of [G + U / 2 - 1.2, G + U / 2 + 0.1, G + U / 2 + 1.4]) box(out, 0, y, s * (W + 0.06), L - 0.8, 0.05, 0.03, FR, 0)
  }
  for (const s of [-1, 1] as const) {
    box(out, s * (L + 0.03), G + U / 2 + 0.1, 0, 0.03, 1.3, W - 0.8, GLASS, surfaceTag('glass'))
    for (let z = -W + 0.8; z <= W - 0.79; z += 0.75) box(out, s * (L + 0.06), G + U / 2 + 0.1, z, 0.03, 1.3, 0.05, FR, 0)
  }
  // the colonnade along the front: paired round columns, and the arched doorways in the wall behind
  for (let x = -L + 1.5; x <= L - 1.4; x += 4) {
    for (const dx of [-0.35, 0.35]) prism(out, x + dx, W - 0.4, 0, G, 0.24, 10, CRM, st, 0.22)
  }
  for (let x = -L + 3.5; x <= L - 3.4; x += 4) {
    box(out, x, 1.5, W - 3 + 0.03, 0.85, 1.5, 0.03, [0.3, 0.2, 0.14], 0)
    for (let k = 0; k < 4; k++) { const t = (k + 0.5) / 4; box(out, x, 3 + t * 0.85, W - 3 + 0.03, 0.85 * Math.sqrt(1 - t * t), 0.11, 0.03, [0.3, 0.2, 0.14], 0) }
  }
  sign(out, { type: 'flat', text: 'BEACH CHALET', h: 0.4, face: 'roman', colour: [0.4, 0.15, 0.1], tracking: 0.15, lit: 'front' }, { x: 0, y: G - 0.35, z: W + 0.02, heading: 0 })
}

/**
 * way/30680616 — the BAY MODEL VISITOR CENTER, Sausalito (a 1942 Marinship warehouse; owner, 2026-10-06: "a huge
 * warehouse with a series of semicircular roofs", photograph from the water): a long, low pinkish-beige shed whose
 * roof is a row of barrel vaults side by side, each ending on the waterfront in a semicircular arch — the arches open
 * or glazed over deep shadowed porches, plain walls between their feet, a round window or two. Local x along the row
 * of vaults (the long side faces +z, the water).
 */
export function bayModel(out: MeshBuilder, fit: Fit): void {
  const L = Math.max(30, fit.hx), W = Math.max(15, fit.hz)
  const WALL: Rgb = [0.84, 0.72, 0.62], ROOF: Rgb = [0.7, 0.68, 0.64], SHADE: Rgb = [0.25, 0.22, 0.2]
  const st = surfaceTag('stucco'), conc = surfaceTag('concrete')
  const E = 6                                         // the walls' height, where each vault springs
  const n = Math.max(3, Math.round((2 * L) / 22))
  const r = L / n                                     // each vault's radius (its span is 2r)
  box(out, 0, E / 2, 0, L, E / 2, W, WALL, st)
  for (let k = 0; k < n; k++) {
    const cx = -L + r + k * 2 * r
    // the vault, running back from the water (along z), as a half cylinder of panels
    const N = 12
    for (let i = 0; i < N; i++) {
      const a0 = (i / N) * Math.PI, a1 = ((i + 1) / N) * Math.PI
      const P = (a: number, z: number): [number, number, number] => [cx + Math.cos(a) * r, E + Math.sin(a) * r * 0.55, z]
      const am = (a0 + a1) / 2
      out.quad([P(a0, -W), P(a1, -W), P(a1, W), P(a0, W)], [Math.cos(am), Math.sin(am), 0], UV, ROOF, conc)
      // the arch's face on the water front and the back: the lunette, shadowed (a deep porch / tall window)
      for (const s of [-1, 1]) {
        out.quad(s > 0 ? [[cx, E, W], P(a0, W), P(a1, W), [cx, E, W]] : [[cx, E, -W], P(a1, -W), P(a0, -W), [cx, E, -W]], [0, 0, s], UV, s > 0 ? SHADE : WALL, 0)
      }
      // the arch's rim, a thick band
      box(out, cx + Math.cos(am) * r, E + Math.sin(am) * r * 0.55, W + 0.15, 0.25 + Math.abs(Math.sin(am)) * 0.2, 0.25 + Math.abs(Math.cos(am)) * 0.3, 0.2, WALL, st)
    }
    // the porch under each arch: a dark recess with a pale wall and a round window in it
    box(out, cx, E / 2, W - 1.2, r * 0.7, E / 2 - 0.2, 0.05, [0.78, 0.66, 0.56], st)
    box(out, cx - r * 0.3, 3.2, W - 1.1, 0.5, 0.5, 0.03, SHADE, 0)
  }
  // the piers between the arches' feet, standing proud on the water front
  for (let k = 0; k <= n; k++) box(out, -L + k * 2 * r, E / 2, W + 0.2, 0.9, E / 2, 0.4, WALL, st)
}

/**
 * The TAJ MAHAL HOUSEBOAT, Sausalito Yacht Harbor (owner, 2026-10-06: "a funny landmark", photograph down the dock):
 * a white Mughal pavilion on a float. A square two-storey front with a tall cusped (pointed) arch in the middle under
 * a panel of floral relief, smaller pointed arches either side, slim pinnacles at the corners; on the roof two open
 * chhatris — cusped arcades under wide eaves and onion domes — and a flagstaff between them; lattice (jali) rails
 * along the deck. Local frame: the arch faces +z (down the dock).
 */
export function tajMahalHouseboat(out: MeshBuilder, _fit: Fit): void {
  const W: Rgb = [0.95, 0.96, 0.95], SH: Rgb = [0.78, 0.82, 0.8], DARK: Rgb = [0.55, 0.6, 0.58]
  const st = surfaceTag('stucco')
  const hx = 6, hz = 5, H = 6.4
  // the float
  box(out, 0, -0.1, 0, hx + 0.4, 0.45, hz + 0.4, [0.3, 0.3, 0.32], 0)
  box(out, 0, H / 2 + 0.35, 0, hx, H / 2, hz, W, st)
  box(out, 0, H + 0.45, 0, hx + 0.15, 0.12, hz + 0.15, W, st)
  // the front: the big cusped arch, the relief panel over it, side arches
  const arch = (x: number, w: number, y0: number, h: number): void => {
    box(out, x, y0 + h * 0.35, hz + 0.02, w, h * 0.35, 0.03, SH, 0)
    // the pointed head: courses closing to a point
    for (let k = 0; k < 7; k++) {
      const t = (k + 0.5) / 7
      box(out, x, y0 + h * 0.7 + t * h * 0.3, hz + 0.02, w * (1 - t) ** 0.8, h * 0.3 / 14, 0.03, SH, 0)
    }
    box(out, x, y0 + h + 0.15, hz + 0.05, 0.12, 0.12, 0.04, W, 0)
  }
  arch(0, 1.6, 0.6, 4.4)
  for (let k = 0; k < 8; k++) box(out, -1.6 + k * 0.46, 5.75, hz + 0.04, 0.12, 0.12, 0.02, DARK, 0)
  for (const s of [-1, 1]) { arch(s * 3.8, 0.9, 0.6, 2.8); arch(s * 3.8, 0.9, 3.7, 1.9) }
  for (const s of [-1, 1]) box(out, s * 2.3, H / 2 + 0.35, hz + 0.08, 0.12, H / 2, 0.08, W, st)
  // the corner pinnacles
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    prism(out, sx * (hx + 0.1), sz * (hz + 0.1), 0.35, H + 1.4, 0.16, 8, W, st, 0.13)
    prism(out, sx * (hx + 0.1), sz * (hz + 0.1), H + 1.4, H + 1.8, 0.16, 8, W, st, 0.02)
  }
  // the two chhatris on the roof: four posts and a cusped arcade, a wide eave, a drum, the onion dome and finial
  for (const s of [-1, 1]) {
    const cx = s * 3.6, y0 = H + 0.55, C = 1.6
    for (const ax of [-1, 1]) for (const az of [-1, 1]) box(out, cx + ax * C, y0 + 1.1, az * C, 0.12, 1.1, 0.12, W, st)
    for (const [nx, nz] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) box(out, cx + nx * C, y0 + 2.0, nz * C, nz ? C : 0.06, 0.18, nx ? C : 0.06, W, st)
    box(out, cx, y0 + 2.3, 0, C + 0.5, 0.08, C + 0.5, W, st)
    prism(out, cx, 0, y0 + 2.38, y0 + 2.8, 1.25, 16, W, st)
    // the onion: swelling out and drawing in to a point
    const prof: [number, number][] = [[0, 1.25], [0.35, 1.5], [0.75, 1.45], [1.1, 1.1], [1.4, 0.6], [1.65, 0.2], [1.8, 0.02]]
    for (let k = 0; k + 1 < prof.length; k++) prism(out, cx, 0, y0 + 2.8 + prof[k][0], y0 + 2.8 + prof[k + 1][0], prof[k][1], 16, W, st, prof[k + 1][1])
    box(out, cx, y0 + 4.75, 0, 0.04, 0.2, 0.04, W, 0)
  }
  prism(out, 0, 0, H + 0.55, H + 6.5, 0.05, 6, W, surfaceTag('metal'), 0.03)
  // the jali rail along the deck at the front
  for (let x = -hx; x <= hx; x += 0.25) box(out, x, 0.75, hz + 0.35, 0.02, 0.4, 0.02, W, 0)
  box(out, 0, 1.15, hz + 0.35, hx, 0.04, 0.04, W, 0)
}

/**
 * USF's main campus (owner, 2026-10-06, photographs: "a boring but very regular architectural style").
 *
 * way/273590288 — HARNEY SCIENCE CENTER: a long cream five-storey block, its wall ribbed by tall thin vertical fins
 * between the windows, each bay closed at the parapet by a shallow scalloped arch; square stair towers at the ends,
 * their open landings screened by patterned grilles.
 */
export function harneyScience(out: MeshBuilder, fit: Fit): void {
  const ring = towerRing(fit)
  const CRM: Rgb = [0.89, 0.83, 0.68]
  const H = Math.max(16, Math.min(22, fit.height || 18))
  tower(out, { ...fit, ring }, {
    height: H,
    tiers: [{ to: 1, face: { kind: 'fins', wall: CRM, glass: GLASS, floor: 3.8, pitch: 1.6, solid: 0.45, depth: 0.35, material: 'stucco' } }],
    crown: { kind: 'parapet', height: 0.9, colour: CRM, material: 'stucco' },
  })
  // the scallops along the parapet, front and back
  for (const s of [-1, 1]) for (let x = -fit.hx + 0.8; x < fit.hx - 0.7; x += 1.6) {
    for (let k = 0; k < 3; k++) { const t = (k + 0.5) / 3; box(out, x + 0.8 * (1 - Math.sqrt(1 - t * t)) * 0, H - 0.6 + t * 0.4, s * (fit.hz + 0.2), 0.75 * Math.sqrt(1 - t * t), 0.07, 0.05, [0.8, 0.74, 0.6], 0) }
  }
  // the stair towers at the ends, a little taller, their grilles
  for (const s of [-1, 1]) {
    const x = s * (fit.hx + 2.2)
    box(out, x, (H + 2) / 2, fit.hz * 0.4, 2.2, (H + 2) / 2, 2.4, CRM, surfaceTag('stucco'))
    for (let f = 1; f < H / 3.8; f++) box(out, x, f * 3.8 - 0.6, fit.hz * 0.4 + 2.42, 1.4, 1.0, 0.03, [0.78, 0.72, 0.58], 0)
  }
}

/**
 * way/273590282 — KALMANOVITZ HALL, 2081 Fulton (1920s, the old St Ignatius school): a long white three-storey block
 * on a tall retaining wall along Fulton. Grouped small-paned windows in threes and fours, end pavilions a storey
 * proud with blind panels, a centre bay rising over the cornice with a pedimented door and a cartouche.
 */
export function kalmanovitzHall(out: MeshBuilder, fit: Fit): void {
  const ring = towerRing(fit)
  const WH: Rgb = [0.94, 0.92, 0.86]
  const H = 15
  tower(out, { ...fit, ring }, {
    height: H,
    tiers: [{ to: 1, face: { kind: 'punched', wall: WH, glass: GLASS, floor: 4.6, pitch: 1.5, solid: 0.35, head: 'architrave', material: 'stucco' } }],
    cornices: [{ at: H - 0.9, depth: 0.6, height: 0.5, colour: WH }],
    crown: { kind: 'parapet', height: 1.0, colour: WH, material: 'stucco' },
  })
  const f = fit.hz
  // the end pavilions, standing proud and a little higher, blind
  for (const s of [-1, 1]) box(out, s * (fit.hx - 4), (H + 1.5) / 2, f + 0.3, 4, (H + 1.5) / 2, 0.4, WH, surfaceTag('stucco'))
  // the centre bay over the cornice, the cartouche, the pedimented door
  box(out, 0, (H + 2.6) / 2, f + 0.35, 3.2, (H + 2.6) / 2, 0.45, WH, surfaceTag('stucco'))
  box(out, 0, H + 2.2, f + 0.85, 0.7, 0.45, 0.08, [0.85, 0.8, 0.66], 0)
  box(out, 0, 1.7, f + 0.82, 1.1, 1.7, 0.04, [0.35, 0.25, 0.18], 0)
  for (let k = 0; k < 4; k++) box(out, 0, 3.6 + k * 0.2, f + 0.85, 1.6 - k * 0.38, 0.1, 0.1, WH, 0)
  // the retaining wall along the street, in front
  box(out, 0, -0.2, f + 5, fit.hx + 2, 1.8, 0.4, [0.9, 0.88, 0.82], surfaceTag('concrete'))
}

/**
 * way/262600160 — KENDRICK HALL, USF School of Law (owner's photograph): a white three-storey block with ribbon windows,
 * and across its entrance a tall portico of square red-granite piers carrying a deep flat canopy lettered KENDRICK
 * HALL; behind them a curved two-storey glass lobby; wide brick steps up to it.
 */
export function kendrickHall(out: MeshBuilder, fit: Fit): void {
  const ring = towerRing(fit)
  const WH: Rgb = [0.9, 0.89, 0.85], GRAN: Rgb = [0.48, 0.3, 0.27], BRICK: Rgb = [0.66, 0.36, 0.26]
  const H = 13
  tower(out, { ...fit, ring }, {
    height: H,
    tiers: [{ to: 1, face: { kind: 'bands', wall: WH, glass: GLASS, floor: 4.2, solid: 0.45, material: 'concrete' } }],
    crown: { kind: 'parapet', height: 0.6, colour: WH, material: 'concrete' },
  })
  const f = fit.hz, W = Math.min(fit.hx * 0.6, 11)
  // the curved glass lobby
  prism(out, 0, f, 0, 8, W * 0.55, 18, [0.3, 0.36, 0.4], surfaceTag('glass'))
  // the granite piers and the canopy
  for (let k = 0; k < 5; k++) box(out, -W + (k / 4) * 2 * W, 6.6, f + 5, 0.55, 6.6, 0.55, GRAN, surfaceTag('granite'))
  box(out, 0, 13.6, f + 3, W + 0.8, 0.8, 3.4, [0.88, 0.86, 0.82], surfaceTag('concrete'))
  sign(out, { type: 'flat', text: 'KENDRICK  HALL', h: 0.55, face: 'roman', colour: [0.35, 0.33, 0.3], tracking: 0.3, lit: 'none' }, { x: 0, y: 13.6, z: f + 6.42, heading: 0 })
  // the brick steps, the full width
  for (let k = 0; k < 6; k++) box(out, 0, 0.09 + k * 0.17, f + 8 - k * 0.4, W + 2, 0.09 + k * 0.17, 0.2 + k * 0.2, BRICK, surfaceTag('brick'))
}

/**
 * way/273590287 — the WAR MEMORIAL GYM at the SOBRATO CENTER (owner's photograph): a tall hall faced with a wall of pale
 * grey folded panels on a light frame under a thin oversailing roof on exposed beams; at its foot a zig-zag folded-
 * plate canopy over dark doors; a cream end block lettered UNIVERSITY OF SAN FRANCISCO / SOBRATO CENTER; a raised
 * planted terrace with steps up from the street.
 */
export function usfGym(out: MeshBuilder, fit: Fit): void {
  const hx = fit.hx, hz = fit.hz
  const CRM: Rgb = [0.9, 0.86, 0.74], PANEL: Rgb = [0.78, 0.8, 0.8], FRAME: Rgb = [0.6, 0.66, 0.72]
  const H = Math.max(12, Math.min(18, fit.height || 15))
  box(out, 0, H / 2, 0, hx, H / 2, hz, CRM, surfaceTag('stucco'))
  // the folded panel wall on the front: panels angled alternately
  const n = Math.max(4, Math.round(hx / 3))
  for (let k = 0; k < n; k++) {
    const x0 = -hx + 4 + (k / n) * (2 * hx - 6), x1 = -hx + 4 + ((k + 1) / n) * (2 * hx - 6)
    const out1 = k % 2 ? 0.6 : 0.1, out2 = k % 2 ? 0.1 : 0.6
    out.quad([[x0, 4.5, hz + out1], [x1, 4.5, hz + out2], [x1, H - 0.5, hz + out2], [x0, H - 0.5, hz + out1]], [0, 0, 1], UV, PANEL, 0)
    box(out, x0, (H + 4) / 2, hz + out1 + 0.03, 0.05, (H - 4.5) / 2, 0.05, FRAME, 0)
    for (const y of [7, 9.5, 12]) if (y < H - 1) box(out, (x0 + x1) / 2, y, hz + 0.4, (x1 - x0) / 2, 0.04, 0.05, FRAME, 0)
  }
  // the thin roof on its beams
  box(out, 0, H + 0.1, 0.5, hx + 0.5, 0.12, hz + 1.2, [0.85, 0.85, 0.83], 0)
  for (let x = -hx + 1; x < hx; x += 2.2) box(out, x, H - 0.2, hz + 0.9, 0.08, 0.18, 0.5, [0.8, 0.74, 0.6], 0)
  // the zig-zag canopy over the doors
  for (let k = 0; k < n; k++) {
    const x0 = -hx + 4 + (k / n) * (2 * hx - 6), x1 = -hx + 4 + ((k + 1) / n) * (2 * hx - 6), xm = (x0 + x1) / 2
    out.quad([[x0, 4.6, hz], [xm, 4.0, hz], [xm, 4.0, hz + 2.2], [x0, 4.6, hz + 2.2]], [0, 1, 0], UV, [0.88, 0.88, 0.86], 0)
    out.quad([[xm, 4.0, hz], [x1, 4.6, hz], [x1, 4.6, hz + 2.2], [xm, 4.0, hz + 2.2]], [0, 1, 0], UV, [0.88, 0.88, 0.86], 0)
  }
  box(out, 0, 1.9, hz + 0.03, hx - 4, 1.9, 0.03, [0.15, 0.15, 0.16], 0)
  // the end block and its lettering
  box(out, -hx + 2, (H - 2) / 2, hz + 0.4, 2.2, (H - 2) / 2, 0.4, CRM, surfaceTag('stucco'))
  sign(out, { type: 'flat', text: 'UNIVERSITY OF SAN FRANCISCO', h: 0.3, face: 'roman', colour: [0.25, 0.25, 0.25], lit: 'none', w: 3.8 }, { x: -hx + 2, y: H - 4, z: hz + 0.85, heading: 0 })
  sign(out, { type: 'flat', text: 'SOBRATO CENTER', h: 0.25, face: 'roman', colour: [0.25, 0.25, 0.25], lit: 'none', w: 2.6 }, { x: -hx + 2, y: H - 4.6, z: hz + 0.85, heading: 0 })
  // the planted terrace in front, its wall to the street
  box(out, 2, 0.75, hz + 4.5, hx - 2, 0.75, 2.2, CRM, surfaceTag('stucco'))
  for (let k = 0; k < 8; k++) box(out, -hx + 4 + k * 0.05, 0.1 + k * 0.1, hz + 6.4 - k * 0.3, 1.6, 0.1 + k * 0.1, 0.16, [0.7, 0.68, 0.65], surfaceTag('concrete'))
}

/**
 * ALCATRAZ'S SMOKESTACK, beside the Powerhouse (owner, 2026-10-06, photograph: "a prominent smokestack"): a tall round
 * stack of weathered concrete, streaked rust and grey, tapering a little, with a band near the top and iron ladder
 * rungs up one side.
 */
export function alcatrazSmokestack(out: MeshBuilder, _fit: Fit): void {
  const C1: Rgb = [0.58, 0.52, 0.47], C2: Rgb = [0.5, 0.42, 0.37]
  const H = 30
  for (let k = 0; k < 10; k++) {
    const y0 = (k / 10) * H, y1 = ((k + 1) / 10) * H
    prism(out, 0, 0, y0, y1, 1.45 - k * 0.04, 16, k % 3 === 1 ? C2 : C1, surfaceTag('concrete'), 1.45 - (k + 1) * 0.04)
  }
  prism(out, 0, 0, H - 1.2, H - 0.8, 1.15, 16, [0.4, 0.34, 0.3], surfaceTag('concrete'))
  prism(out, 0, 0, H, H + 0.05, 0.95, 16, [0.08, 0.08, 0.08], 0)
  for (let y = 2; y < H - 1; y += 0.5) box(out, 0, y, 1.45 - (y / H) * 0.4 + 0.12, 0.22, 0.015, 0.015, [0.3, 0.25, 0.22], 0)
}

/**
 * THE GREAT HIGHWAY TOWNHOUSES, 700–798 Great Highway (owner, 2026-10-06: "the beach front townhouses are extremely
 * unique. we display them as office buildings now", photographs): a long row of narrow three-storey houses facing the
 * sea over the dunes, each its own soft pastel (grey-blue, lilac, sage, cream), with a big bay window — a gable or a
 * bow — over a garage at street level, the bay's windows many-paned, white trim, a chimney on the party wall.
 * One builder, its colour and its bay from the house's OSM id.
 */
function beachTownhouse(seed: number) {
  const BODIES: Rgb[] = [[0.66, 0.73, 0.8], [0.74, 0.68, 0.8], [0.7, 0.78, 0.68], [0.9, 0.86, 0.74], [0.82, 0.76, 0.7], [0.62, 0.7, 0.72]]
  return (out: MeshBuilder, fit: Fit): void => {
    const h = (k: number): number => { const v = Math.sin(seed * 12.9898 + k * 78.233) * 43758.5453; return v - Math.floor(v) }
    const body = BODIES[Math.floor(h(1) * BODIES.length)]
    const clap = surfaceTag('clapboard')
    const hx = Math.max(3.5, Math.min(fit.hx, 5)), hz = fit.hz
    const H = 10.5
    box(out, 0, H / 2, 0, hx, H / 2, hz, body, clap)
    // the roof: a gable to the street, or a flat roof with a parapet
    const gable = h(2) < 0.6
    if (gable) {
      const R = 3.2
      for (const s of [-1, 1]) out.quad(s > 0
        ? [[0, H + R, -hz], [0, H + R, hz + 0.3], [hx + 0.3, H, hz + 0.3], [hx + 0.3, H, -hz]]
        : [[-hx - 0.3, H, -hz], [-hx - 0.3, H, hz + 0.3], [0, H + R, hz + 0.3], [0, H + R, -hz]], [s * R, hx, 0], UV, [0.4, 0.4, 0.42], 0)
      out.quad([[-hx, H, hz + 0.2], [hx, H, hz + 0.2], [0, H + R - 0.1, hz + 0.2], [0, H + R - 0.1, hz + 0.2]], [0, 0, 1], UV, body, clap)
    } else box(out, 0, H + 0.4, hz - 0.1, hx + 0.1, 0.4, 0.15, WHITE, 0)
    // the bay over the garage: gabled or bowed, its windows many-paned
    const bw = hx * 0.75
    if (h(3) < 0.5) {
      prism(out, 0, hz, 3.0, H - 0.2, bw, 12, body, clap)
      for (const y of [4.6, 7.8]) prism(out, 0, hz, y - 1.0, y + 1.0, bw + 0.03, 12, GLASS, surfaceTag('glass'))
    } else {
      box(out, 0, (3.0 + H) / 2, hz + 0.7, bw, (H - 3.0) / 2, 0.7, body, clap)
      for (const y of [4.6, 7.8]) {
        box(out, 0, y, hz + 1.42, bw * 0.8, 1.0, 0.03, GLASS, surfaceTag('glass'))
        for (let k = -3; k <= 3; k++) box(out, k * bw * 0.8 / 3.5, y, hz + 1.45, 0.02, 1.0, 0.02, WHITE, 0)
        box(out, 0, y, hz + 1.45, bw * 0.8, 0.02, 0.02, WHITE, 0)
      }
      ridgeX(out, -bw, bw, hz, hz + 1.4, H - 0.2, 0.01, [0.4, 0.4, 0.42], 0, false, 0.1)
    }
    // the garage, the door beside it up a few steps, white trim
    box(out, -hx * 0.15, 1.2, hz + 0.03, hx * 0.6, 1.2, 0.03, [0.92, 0.92, 0.9], 0)
    for (let k = 0; k < 4; k++) box(out, -hx * 0.15, 0.3 + k * 0.6, hz + 0.06, hx * 0.6, 0.02, 0.02, [0.75, 0.75, 0.73], 0)
    box(out, hx * 0.72, 1.6, hz + 0.03, 0.5, 1.1, 0.03, [0.3, 0.25, 0.22], 0)
    for (const s of [-1, 1]) box(out, s * (hx - 0.06), H / 2, hz + 0.05, 0.1, H / 2, 0.06, WHITE, 0)
    // the chimney on the party wall
    box(out, hx - 0.5, H + (gable ? 2.6 : 1.3), -hz * 0.3, 0.35, 1.3, 0.45, [0.6, 0.35, 0.28], surfaceTag('brick'))
  }
}

/**
 * The STEPPED CONDOMINIUMS at 1224–1361 Great Highway (owner, 2026-10-06): cream stucco blocks four storeys high,
 * terraced back from the sea a storey at a time, balconies along each step, glazed sun-room bays with curved glass
 * roofs, square chimney stacks with red caps.
 */
export function steppedCondo(out: MeshBuilder, fit: Fit): void {
  const st = surfaceTag('stucco')
  const CRM: Rgb = [0.92, 0.88, 0.8]
  const hx = fit.hx, hz = fit.hz
  const F = 2.9, N = 4
  for (let k = 0; k < N; k++) {
    // each storey set back from the one below on the sea side (+z)
    const front = hz - k * (hz * 0.35)
    const d = (front + hz) / 2
    box(out, 0, (k + 0.5) * F, front - d, hx, F / 2, d, CRM, st)
    // the balcony rail along the step
    box(out, 0, (k + 1) * F + 0.5, front - 0.1, hx, 0.05, 0.05, WHITE, 0)
    for (let x = -hx; x <= hx; x += 0.3) box(out, x, (k + 1) * F + 0.25, front - 0.1, 0.015, 0.25, 0.015, WHITE, 0)
    // windows along the storey's face
    box(out, 0, (k + 0.5) * F, front + 0.02, hx - 0.8, 0.8, 0.02, GLASS, surfaceTag('glass'))
    // a sun-room bay every so often: a glazed box with a curved glass roof
    for (let x = -hx + 3; x < hx - 2; x += 7) {
      box(out, x, (k + 0.5) * F, front + 0.7, 1.4, F / 2 - 0.1, 0.7, [0.55, 0.65, 0.7], surfaceTag('glass'))
      prism(out, x, front + 0.7, (k + 1) * F - 0.1, (k + 1) * F + 0.35, 1.4, 8, [0.6, 0.72, 0.76], surfaceTag('glass'), 0.4)
    }
  }
  // the chimneys with their red caps
  for (let x = -hx + 2; x < hx; x += 9) {
    box(out, x, N * F + 0.9, -hz * 0.6, 0.6, 1.2, 0.6, CRM, st)
    box(out, x, N * F + 2.2, -hz * 0.6, 0.75, 0.12, 0.75, [0.72, 0.25, 0.18], 0)
  }
}

export const BEACH_TOWNHOUSES: Record<string, (out: MeshBuilder, fit: Fit) => void> = Object.fromEntries(
  [287283877, 287283863, 287283846, 287283848, 287283852, 287283853, 287283851, 287283857, 287283861, 287283843, 287283856,
    287283862, 287283834, 287283858, 287283844, 287283867, 287283868, 287283869, 287283871, 287283842, 287283860, 287283866,
    287283874, 287283865, 287283876, 287283875].map((id) => [`beachTownhouse_${id}`, beachTownhouse(id)]))

/**
 * ANGEL ISLAND'S LIGHTS (owner, 2026-10-06: "none of the significant Angel Island buildings are there … lighthouse"):
 * Point Blunt and Point Stuart are small white fog-signal stations on the bluffs — a square white building with a
 * hipped red roof, and on its corner a short white post-tower carrying a black lantern.
 */
export function angelLight(out: MeshBuilder, fit: Fit): void {
  const v0 = out.positions.length
  const L = Math.max(3, Math.min(fit.hx, 6)), W = Math.max(3, Math.min(fit.hz, 5))
  box(out, 0, 1.6, 0, L, 1.6, W, WHITE, surfaceTag('clapboard'))
  ridgeX(out, -L, L, -W, W, 3.2, 1.4, TILE_RED, surfaceTag('tile'), true, 0.3)
  windowsZ(out, W, 1, -L + 0.8, L - 0.8, 2, 1.0, 2.4, 0.7, GLASS, WHITE)
  const tx = L + 0.9
  box(out, tx, 2.6, 0, 0.8, 2.6, 0.8, WHITE, surfaceTag('stucco'))
  box(out, tx, 5.3, 0, 1.0, 0.08, 1.0, [0.12, 0.12, 0.13], 0)
  prism(out, tx, 0, 5.38, 6.4, 0.55, 8, [0.6, 0.7, 0.72], surfaceTag('glass'))
  prism(out, tx, 0, 6.4, 7.0, 0.62, 8, [0.1, 0.1, 0.11], 0, 0.1)
  standHigh(out, fit, v0, L, W, [0.8, 0.79, 0.76])
}

/**
 * The ANGEL ISLAND IMMIGRATION STATION's Detention Barracks (way/104694642, now the museum): a long two-storey white
 * clapboard barracks on a raised concrete base, rows of small double-hung windows under a low grey hipped roof,
 * an exterior stair and porch at one end.
 */
export function detentionBarracks(out: MeshBuilder, fit: Fit): void {
  const v0 = out.positions.length
  const L = Math.max(8, fit.hx), W = Math.max(5, fit.hz)
  box(out, 0, 0.6, 0, L + 0.1, 0.6, W + 0.1, [0.7, 0.69, 0.66], surfaceTag('concrete'))
  box(out, 0, 1.2 + 3.3, 0, L, 3.3, W, [0.94, 0.93, 0.89], surfaceTag('clapboard'))
  ridgeX(out, -L, L, -W, W, 7.8, 2.0, [0.42, 0.43, 0.42], surfaceTag('tile'), true, 0.5)
  for (const s of [-1, 1] as const) {
    windowsZ(out, s * W, s, -L + 1, L - 1, Math.round(L / 1.8), 2.0, 3.6, 0.8, GLASS, [0.36, 0.44, 0.38])
    windowsZ(out, s * W, s, -L + 1, L - 1, Math.round(L / 1.8), 5.2, 6.8, 0.8, GLASS, [0.36, 0.44, 0.38])
  }
  for (let k = 0; k < 10; k++) box(out, L + 0.5 + k * 0.3, 0.2 + k * 0.33, W * 0.3, 0.15, 0.2 + k * 0.33, 0.6, [0.9, 0.9, 0.88], 0)
  box(out, L + 0.9, 3.55, W * 0.3, 0.9, 0.06, 1.2, [0.9, 0.9, 0.88], 0)
  standHigh(out, fit, v0, L, W, [0.72, 0.71, 0.68])
}

/**
 * A RESTAURANT ON A PIER (Sausalito's waterfront; owner, 2026-10-06: "there are a number of small piers on the
 * waterfront, which seem to all be restaurants now"): a timber deck on piles over the water, and on it a low shingled
 * house with a wall of windows to the bay, a shallow gable, a deck railing round its seaward end, and the name on a
 * board over the door (the name from the manifest's `label` cannot reach a builder, so each is its own builder).
 * Frame: the water at y = 0 (`deckAbove: 0`), +z toward the bay.
 */
function pierRestaurant(name: string, wall: Rgb) {
  return (out: MeshBuilder, fit: Fit): void => {
    const hx = Math.max(8, Math.min(fit.hx, 18)), hz = Math.max(6, Math.min(fit.hz, 14))
    const D = 2.2
    box(out, 0, D - 0.15, 0, hx, 0.15, hz, [0.5, 0.42, 0.34], surfaceTag('clapboard'))
    for (let x = -hx + 1; x <= hx; x += 3) for (let z = -hz + 1; z <= hz; z += 3) prism(out, x, z, -1.5, D - 0.3, 0.18, 6, [0.3, 0.26, 0.22], 0)
    const bx = hx * 0.75, bz = hz * 0.6
    box(out, 0, D + 1.9, -hz * 0.25, bx, 1.9, bz, wall, surfaceTag('clapboard'))
    ridgeX(out, -bx, bx, -hz * 0.25 - bz, -hz * 0.25 + bz, D + 3.8, 1.4, [0.38, 0.38, 0.4], surfaceTag('tile'), false, 0.5)
    // the wall of windows to the bay
    box(out, 0, D + 1.8, -hz * 0.25 + bz + 0.03, bx - 0.4, 1.3, 0.03, GLASS, surfaceTag('glass'))
    for (let x = -bx + 0.8; x < bx; x += 1.2) box(out, x, D + 1.8, -hz * 0.25 + bz + 0.06, 0.04, 1.3, 0.03, WHITE, 0)
    // the railing round the deck's bay end
    for (let x = -hx; x <= hx; x += 0.6) box(out, x, D + 0.5, hz - 0.1, 0.03, 0.5, 0.03, WHITE, 0)
    box(out, 0, D + 1.0, hz - 0.1, hx, 0.04, 0.05, WHITE, 0)
    // the name, over the door on the land side
    box(out, 0, D + 3.2, -hz * 0.25 - bz - 0.06, Math.min(bx - 0.5, name.length * 0.22), 0.35, 0.04, [0.12, 0.2, 0.3], 0)
    sign(out, { type: 'flat', text: name, h: 0.32, face: 'roman', colour: [0.95, 0.93, 0.86], lit: 'front', w: Math.min(2 * bx - 1.2, name.length * 0.4) },
      { x: 0, y: D + 3.2, z: -hz * 0.25 - bz - 0.12, heading: Math.PI })
  }
}

export const PIER_RESTAURANTS: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  pierBarrelHouse: pierRestaurant('BARREL HOUSE', [0.58, 0.46, 0.36]),
}

/**
 * The PAVILION at One Front Street's plaza (way/148710885; owner, 2026-10-06, Street View: "actually a silver-clad
 * coffee shop to match the adjacent skyscraper"): a low two-storey wing clad in the tower's silver aluminium panels,
 * its walls curving round the ends. Philz Coffee in a glass front at ground level with café tables and umbrellas on the
 * brick plaza; above, a dark glass band under the green FIRST REPUBLIC BANK board; a curved aluminium canopy
 * reaching out over the tower's entrance at one end, on a round column.
 */
export function oneFrontPavilion(out: MeshBuilder, fit: Fit): void {
  const ring = towerRing(fit)
  const SILVER: Rgb = [0.82, 0.83, 0.84]
  const H = 9
  tower(out, { ...fit, ring }, {
    height: H,
    tiers: [{ to: 1, face: { kind: 'blank', wall: SILVER, material: 'metal' } }],
    crown: { kind: 'parapet', height: 0.4, colour: SILVER, material: 'metal' },
  })
  // the front: the long side toward the plaza (+z)
  const hx = fit.hx, f = fit.hz
  box(out, 0, 1.7, f + 0.03, hx * 0.55, 1.6, 0.03, [0.3, 0.36, 0.38], surfaceTag('glass'))
  for (let x = -hx * 0.55; x <= hx * 0.55 + 0.01; x += 1.5) box(out, x, 1.7, f + 0.06, 0.04, 1.6, 0.03, [0.6, 0.62, 0.64], 0)
  box(out, 0, 3.6, f + 0.1, hx * 0.6, 0.25, 0.1, SILVER, surfaceTag('metal'))
  box(out, 0, 5.4, f + 0.03, hx * 0.75, 1.1, 0.03, [0.12, 0.14, 0.16], surfaceTag('glass'))
  box(out, 0, 7.15, f + 0.12, hx * 0.5, 0.45, 0.06, [0.1, 0.32, 0.24], 0)
  sign(out, { type: 'flat', text: 'FIRST REPUBLIC BANK', h: 0.38, face: 'roman', colour: [0.95, 0.94, 0.88], lit: 'front', w: hx * 0.9 }, { x: 0, y: 7.15, z: f + 0.2, heading: 0 })
  box(out, 0, 3.95, f + 0.12, 1.4, 0.2, 0.05, [0.25, 0.15, 0.1], 0)
  sign(out, { type: 'flat', text: 'Philz Coffee', h: 0.22, face: 'roman', italic: true, colour: [0.95, 0.85, 0.6], lit: 'front', w: 2.6 }, { x: 0, y: 3.95, z: f + 0.18, heading: 0 })
  // the café tables and umbrellas on the plaza
  for (const x of [-hx * 0.3, hx * 0.3]) {
    prism(out, x, f + 3, 0, 2.3, 0.03, 6, [0.5, 0.5, 0.5], 0)
    prism(out, x, f + 3, 2.1, 2.6, 1.3, 8, [0.95, 0.93, 0.86], 0, 0.05)
    for (const dx of [-0.8, 0.8]) box(out, x + dx, 0.38, f + 3, 0.35, 0.02, 0.35, [0.85, 0.85, 0.83], 0)
  }
  // the curved canopy over the tower's entrance at the +x end, on its column
  prism(out, hx + 3, f - 2, 4.6, 5.4, 4.2, 20, SILVER, surfaceTag('metal'))
  prism(out, hx + 3, f - 2, 0, 4.6, 0.35, 12, SILVER, surfaceTag('metal'))
}
