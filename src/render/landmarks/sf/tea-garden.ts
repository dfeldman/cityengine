/**
 * THE JAPANESE TEA GARDEN, Golden Gate Park (1894; owner, 2026-10-03: "really bad looking. i think maybe the custom model
 * isn't getting used"). It was: two red boxes with green pyramid lids (districts/parks.ts `spec()` placeholders) and the
 * gift shop and Temple Gate as stucco cottages with orange roofs, a wooden bridge as a white plank in the air.
 *
 * What a visitor knows it by: the FIVE-STOREY PAGODA (1915), square, vermilion posts and rails under five dark tiled
 * roofs each a little smaller, eaves kicked out, a gilt finial; the timber GATES (the South Gate's two stacked
 * roofs over natural hinoki posts; the red Temple Gate); the open TEA HOUSE on its deck under a big low grey roof; the
 * steep half-moon DRUM BRIDGE over the water; stone lanterns; the bronze BUDDHA (1790) on its plinth; the bamboo fence.
 *
 * The buildings are fitted to OSM's footprints (way/34221099 pagoda, 136888948 South Gate, 136888944 Temple Gate,
 * 34220947 tea house, 34220963 gift shop); `teaGardenGrounds` is a standalone entry at the garden's middle, DRAPED,
 * its local frame x east / z north (front 180), carrying the bridges, the lanterns, the Buddha and the fence, with
 * the positions copied from OSM in city metres about that middle.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { box, prism, strut, type Rgb } from '../../models.ts'
import { roof } from '../kit.ts'
import { surfaceTag } from '../../cartoon-material.ts'

const VERMILION: Rgb = [0.72, 0.2, 0.12]
const TILE: Rgb = [0.24, 0.26, 0.25]
const HINOKI: Rgb = [0.62, 0.48, 0.32]
const DARKWOOD: Rgb = [0.3, 0.22, 0.15]
const STONE: Rgb = [0.6, 0.59, 0.55]
const BRONZE: Rgb = [0.3, 0.27, 0.18]
const GILT: Rgb = [0.8, 0.64, 0.25]
const PLASTER: Rgb = [0.9, 0.88, 0.82]
const BAMBOO: Rgb = [0.6, 0.55, 0.35]
const WATER: Rgb = [0.16, 0.24, 0.24]

/** a hipped roof with its eaves kicked out: a flat-ish skirt then the steeper hip, both over [−w, w]² + overhang */
function flaredRoof(out: MeshBuilder, hx: number, hz: number, y: number, rise: number, over: number, c: Rgb): void {
  const ex = hx + over, ez = hz + over
  // the skirt: shallow, out to the kicked-up eave
  roof(out, -ex, ex, -ez, ez, y, rise * 0.25, over * 0.7, over * 0.7, c)
  const ix = ex - over * 0.7, iz = ez - over * 0.7
  const m = Math.min(ix, iz)
  roof(out, -ix, ix, -iz, iz, y + rise * 0.25, rise * 0.75, m * 0.92, m * 0.92, c)
  // the kicked-up corners: a short upturned tip at each
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) strut(out, [sx * (ex - 0.4), y + 0.05, sz * (ez - 0.4)], [sx * (ex + 0.25), y + 0.45, sz * (ez + 0.25)], 0.12, 0.08, c)
}

function posts(out: MeshBuilder, hx: number, hz: number, y0: number, y1: number, n: number, r: number, c: Rgb): void {
  for (let i = 0; i <= n; i++) {
    const t = -1 + (2 * i) / n
    for (const s of [-1, 1]) {
      box(out, t * hx, (y0 + y1) / 2, s * hz, r, (y1 - y0) / 2, r, c, 0)
      if (i > 0 && i < n) box(out, s * hx, (y0 + y1) / 2, t * hz, r, (y1 - y0) / 2, r, c, 0)
    }
  }
}

/** the five-storey pagoda: a vermilion storey under a dark flared roof, five times, each smaller; a gilt finial */
export function teaGardenPagoda(out: MeshBuilder, fit: Fit): void {
  const base = Math.max(2.5, Math.min(fit.hx, fit.hz) * 0.6)
  const wood = surfaceTag('clapboard')
  // the stone podium and its steps
  box(out, 0, 0.35, 0, base + 1.2, 0.35, base + 1.2, STONE, surfaceTag('granite'))
  let y = 0.7
  for (let k = 0; k < 5; k++) {
    const w = base * (1 - k * 0.11)
    const h = k === 0 ? 2.6 : 1.7
    // the storey: plastered walls between vermilion posts, a rail round the upper ones
    box(out, 0, y + h / 2, 0, w * 0.86, h / 2, w * 0.86, PLASTER, wood)
    posts(out, w * 0.9, w * 0.9, y, y + h, 2, 0.14, VERMILION)
    box(out, 0, y + h - 0.15, 0, w * 0.92, 0.15, w * 0.92, VERMILION, wood)
    if (k > 0) box(out, 0, y + 0.35, 0, w * 0.98, 0.06, w * 0.98, VERMILION, wood)
    flaredRoof(out, w * 0.9, w * 0.9, y + h, k === 4 ? 1.6 : 0.95, w * 0.45 + 0.5, TILE)
    y += h + (k === 4 ? 1.6 : 0.95)
  }
  // the finial: a stem with nine rings (the sōrin)
  prism(out, 0, 0, y - 0.3, y + 3.2, 0.12, 8, GILT)
  for (let i = 0; i < 9; i++) prism(out, 0, 0, y + 0.4 + i * 0.28, y + 0.48 + i * 0.28, 0.32 - i * 0.015, 10, GILT)
  prism(out, 0, 0, y + 3.2, y + 3.6, 0.2, 8, GILT, 0, 0.02)
}

/** a timber gate: two (or four) posts, tie beams, a gabled roof along local x; `double` stacks a second, smaller roof */
function gate(out: MeshBuilder, fit: Fit, wood: Rgb, double: boolean): void {
  const hx = Math.max(2, fit.hx * 0.8), hz = Math.max(1.2, fit.hz * 0.55)
  const H = 3.6
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(out, sx * hx * 0.8, H / 2, sz * hz * 0.6, 0.18, H / 2, 0.18, wood, 0)
  for (const sz of [-1, 1]) box(out, 0, H - 0.25, sz * hz * 0.6, hx * 0.95, 0.15, 0.12, wood, 0)
  box(out, 0, H - 0.1, 0, hx * 0.9, 0.12, hz * 0.7, wood, 0)
  // the gabled roof, ridge along x, deep eaves front and back
  roof(out, -hx - 0.6, hx + 0.6, -hz - 0.7, hz + 0.7, H, 1.6, 0, hz + 0.7, TILE)
  if (double) {
    box(out, 0, H + 1.9, 0, hx * 0.5, 0.35, hz * 0.4, wood, 0)
    roof(out, -hx * 0.7, hx * 0.7, -hz * 0.6, hz * 0.6, H + 2.2, 1.2, 0, hz * 0.6, TILE)
  }
}
export const teaGardenSouthGate = (out: MeshBuilder, fit: Fit): void => gate(out, fit, HINOKI, true)
export const teaGardenTempleGate = (out: MeshBuilder, fit: Fit): void => gate(out, fit, VERMILION, false)

/** the open tea house: a low timber deck, posts, low dark walls at the back, a big low grey hipped roof */
export function teaGardenTeaHouse(out: MeshBuilder, fit: Fit): void {
  const hx = Math.max(3, fit.hx * 0.9), hz = Math.max(3, fit.hz * 0.9)
  box(out, 0, 0.3, 0, hx, 0.3, hz, DARKWOOD, surfaceTag('clapboard'))
  posts(out, hx * 0.95, hz * 0.95, 0.6, 3.1, 4, 0.12, DARKWOOD)
  box(out, 0, 1.85, -hz * 0.92, hx * 0.95, 1.25, 0.08, HINOKI, surfaceTag('clapboard'))
  flaredRoof(out, hx, hz, 3.1, 1.8, 1.2, TILE)
}

/** the gift shop: a closed version — timber walls and shoji panels under the same roof */
export function teaGardenGiftShop(out: MeshBuilder, fit: Fit): void {
  const hx = Math.max(2.5, fit.hx * 0.9), hz = Math.max(2.5, fit.hz * 0.9)
  box(out, 0, 1.6, 0, hx, 1.6, hz, HINOKI, surfaceTag('clapboard'))
  for (const s of [-1, 1]) box(out, 0, 1.5, s * (hz + 0.02), hx * 0.7, 0.9, 0.02, PLASTER, 0)
  flaredRoof(out, hx, hz, 3.2, 1.5, 0.9, TILE)
}

// the garden's middle, city metres (x east, z north), and what stands in it, about that middle
const MID = { x: -5110, z: -2530 }
const L = (x: number, z: number): [number, number] => [x - MID.x, z - MID.z]
const FENCE: [number, number][] = [[-5032.9, -2503.4], [-5089.4, -2592.8], [-5129.0, -2596.1], [-5145.0, -2595.5], [-5149.6, -2592.9], [-5176.3, -2556.4], [-5180.5, -2543.2], [-5175.0, -2512.3], [-5113.1, -2463.0], [-5093.3, -2448.3], [-5032.9, -2503.4]]
const LANTERNS: [number, number][] = [[-5100, -2540], [-5094, -2550], [-5118, -2548], [-5132, -2540], [-5080, -2525], [-5123, -2566], [-5140, -2560], [-5098, -2510], [-5152, -2548], [-5070, -2515]]

function lantern(out: MeshBuilder, x: number, z: number): void {
  const g = surfaceTag('granite')
  prism(out, x, z, 0, 0.25, 0.35, 6, STONE, g)
  prism(out, x, z, 0.25, 1.0, 0.12, 6, STONE, g)
  box(out, x, 1.2, z, 0.28, 0.2, 0.28, STONE, g)
  box(out, x, 1.2, z, 0.18, 0.12, 0.29, [0.95, 0.85, 0.55], 0)
  prism(out, x, z, 1.4, 1.75, 0.5, 6, STONE, g, 0.08)
  prism(out, x, z, 1.75, 1.9, 0.08, 6, STONE, g, 0.02)
}

/** the drum bridge: a steep half-moon arch of planks between two rails, over a little pool */
function drumBridge(out: MeshBuilder, a: [number, number], b: [number, number]): void {
  const dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz)
  const tx = dx / len, tz = dz / len, nx = -tz, nz = tx
  const span = len + 3, rise = span * 0.45, half = 0.8
  const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2
  // the pool it crosses
  const pool = 4.2
  out.quad([[mx - tx * pool - nx * pool, 0.06, mz - tz * pool - nz * pool], [mx + tx * pool - nx * pool, 0.06, mz + tz * pool - nz * pool], [mx + tx * pool + nx * pool, 0.06, mz + tz * pool + nz * pool], [mx - tx * pool + nx * pool, 0.06, mz - tz * pool + nz * pool]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], WATER, 0)
  const N = 14
  const P = (s: number, side: number, up: number): [number, number, number] => {
    const u = (s - 0.5) * span
    const y = rise * Math.sin(Math.PI * s) + up
    return [mx + tx * u + nx * side, y, mz + tz * u + nz * side]
  }
  for (let i = 0; i < N; i++) {
    const s0 = i / N, s1 = (i + 1) / N
    out.quad([P(s0, -half, 0.12), P(s1, -half, 0.12), P(s1, half, 0.12), P(s0, half, 0.12)], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], HINOKI, surfaceTag('clapboard'))
    for (const side of [-half, half]) {
      strut(out, P(s0, side, 0), P(s1, side, 0), 0.1, 0.14, DARKWOOD)
      strut(out, P(s0, side, 0.95), P(s1, side, 0.95), 0.06, 0.06, DARKWOOD)
      strut(out, P(s0, side, 0), P(s0, side, 0.95), 0.05, 0.05, DARKWOOD)
    }
  }
}

/** the zig-zag wooden bridge across the upper pond (OSM way/34218824): a low flat plank deck with a rail */
function plankBridge(out: MeshBuilder, a: [number, number], b: [number, number]): void {
  const dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz)
  const nx = -dz / len, nz = dx / len, w = 0.9
  out.quad([[a[0] - nx * w, 0.6, a[1] - nz * w], [b[0] - nx * w, 0.6, b[1] - nz * w], [b[0] + nx * w, 0.6, b[1] + nz * w], [a[0] + nx * w, 0.6, a[1] + nz * w]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], HINOKI, surfaceTag('clapboard'))
  for (const s of [-1, 1]) strut(out, [a[0] + nx * w * s, 1.5, a[1] + nz * w * s], [b[0] + nx * w * s, 1.5, b[1] + nz * w * s], 0.06, 0.06, DARKWOOD)
  for (let t = 0; t <= 1.001; t += 0.2) for (const s of [-1, 1]) {
    const x = a[0] + dx * t + nx * w * s, z = a[1] + dz * t + nz * w * s
    box(out, x, 0.75, z, 0.07, 0.75, 0.07, DARKWOOD, 0)
  }
}

export function teaGardenGrounds(out: MeshBuilder, _fit: Fit): void {
  drumBridge(out, L(-5089.7, -2544.9), L(-5088.0, -2538.6))
  plankBridge(out, L(-5109.4, -2525.4), L(-5122.2, -2540.0))
  for (const [x, z] of LANTERNS) lantern(out, ...L(x, z))
  // the Buddha: a seated bronze figure on a stepped stone plinth
  const [bx, bz] = L(-5105, -2526)
  box(out, bx, 0.5, bz, 1.6, 0.5, 1.6, STONE, surfaceTag('granite'))
  box(out, bx, 1.25, bz, 1.2, 0.25, 1.2, STONE, surfaceTag('granite'))
  prism(out, bx, bz, 1.5, 2.3, 1.0, 12, BRONZE, surfaceTag('metal'), 0.85)
  prism(out, bx, bz, 2.3, 3.6, 0.7, 10, BRONZE, surfaceTag('metal'), 0.5)
  prism(out, bx, bz, 3.6, 4.3, 0.42, 10, BRONZE, surfaceTag('metal'), 0.3)
  prism(out, bx, bz, 4.3, 4.6, 0.2, 8, BRONZE, surfaceTag('metal'), 0.05)
  // the bamboo fence round the garden: posts every 2.5 m, three rails
  for (let i = 1; i < FENCE.length; i++) {
    const a = L(...FENCE[i - 1]), b = L(...FENCE[i])
    for (const y of [0.4, 1.1, 1.7]) strut(out, [a[0], y, a[1]], [b[0], y, b[1]], 0.05, 0.05, BAMBOO)
    const n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 2.5))
    for (let k = 0; k < n; k++) {
      const t = k / n
      box(out, a[0] + (b[0] - a[0]) * t, 0.95, a[1] + (b[1] - a[1]) * t, 0.06, 0.95, 0.06, BAMBOO, 0)
    }
  }
}

export const TEA_GARDEN: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  teaGardenPagoda, teaGardenSouthGate, teaGardenTempleGate, teaGardenTeaHouse, teaGardenGiftShop, teaGardenGrounds,
}
