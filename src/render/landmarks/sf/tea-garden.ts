/**
 * THE JAPANESE TEA GARDEN, Golden Gate Park (1894; owner, 2026-10-03: "really bad looking. i think maybe the custom model
 * isn't getting used"). It was: two red boxes with green pyramid lids (districts/parks.ts `spec()` placeholders) and the
 * gift shop and Temple Gate as stucco cottages with orange roofs, a wooden bridge as a white plank in the air.
 *
 * What a visitor knows it by: the FIVE-STOREY PAGODA (1915), square, vermilion fences and rafters under five near-equal
 * shingle roofs with curling corners, a ringed spire (tea-garden-pagoda.ts); the two-storey GATES (the Main Gate in
 * weathered wood under grey tile, tea-garden-main-gate.ts; the red Temple Gate, tea-garden-temple-gate.ts); the open TEA HOUSE on its deck under a big low grey roof; the
 * steep half-moon DRUM BRIDGE over the water; stone lanterns; the bronze BUDDHA (1790) on its plinth; the bamboo fence.
 *
 * The buildings are fitted to OSM's footprints (way/34221099 pagoda, 136888948 Main Gate (OSM: 'South Gate'), 136888944 Temple Gate,
 * 34220947 tea house, 34220963 gift shop); `teaGardenGrounds` is a standalone entry at the garden's middle, DRAPED,
 * its local frame x east / z north (front 180), carrying the bridges, the lanterns, the Buddha and the fence, with
 * the positions copied from OSM in city metres about that middle.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { box, prism, strut, type Rgb } from '../../models.ts'
import { roof } from '../kit.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { teaGardenLandscape } from './tea-garden-landscape.ts'

const TILE: Rgb = [0.24, 0.26, 0.25]
const HINOKI: Rgb = [0.62, 0.48, 0.32]
const DARKWOOD: Rgb = [0.3, 0.22, 0.15]
const STONE: Rgb = [0.6, 0.59, 0.55]
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

// the pagoda: src/render/landmarks/sf/tea-garden-pagoda.ts (the owner's photographs part by part, 2026-10-27;
// the kit stand-in that stood here is gone with the AI GLB it was the far stand-in for)
import { teaGardenPagoda } from './tea-garden-pagoda.ts'
export { teaGardenPagoda }

// the Main Gate (OSM's 'South Gate', way/136888948): src/render/landmarks/sf/tea-garden-main-gate.ts (2026-10-27)
import { teaGardenMainGate } from './tea-garden-main-gate.ts'
export { teaGardenMainGate }
// the Temple Gate: src/render/landmarks/sf/tea-garden-temple-gate.ts (the owner's photographs, 2026-10-27)
import { teaGardenTempleGate } from './tea-garden-temple-gate.ts'
export { teaGardenTempleGate }

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
/** where the fence stops: [x, z, radius] about the garden's middle — the Main Gate (OSM way/136888948's centre) and its 9 m walls */
const FENCE_GAPS: [number, number, number][] = [[L(-5085.4, -2574.0)[0], L(-5085.4, -2574.0)[1], 11.5]]
const FENCE: [number, number][] = [[-5032.9, -2503.4], [-5089.4, -2592.8], [-5129.0, -2596.1], [-5145.0, -2595.5], [-5149.6, -2592.9], [-5176.3, -2556.4], [-5180.5, -2543.2], [-5175.0, -2512.3], [-5113.1, -2463.0], [-5093.3, -2448.3], [-5032.9, -2503.4]]
const HAVE_LANTERN_MODELS = true
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
function drumBridge(out: MeshBuilder, a: [number, number], b: [number, number], withArch = true): void {
  const dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz)
  const tx = dx / len, tz = dz / len, nx = -tz, nz = tx
  const span = len + 3, rise = span * 0.45, half = 0.8
  const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2
  // the pool it crosses
  const pool = 4.2
  out.quad([[mx - tx * pool - nx * pool, 0.06, mz - tz * pool - nz * pool], [mx + tx * pool - nx * pool, 0.06, mz + tz * pool - nz * pool], [mx + tx * pool + nx * pool, 0.06, mz + tz * pool + nz * pool], [mx - tx * pool + nx * pool, 0.06, mz - tz * pool + nz * pool]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], WATER, 0)
  // (the arch itself is the drum-bridge GLB now, assetkit-models-sf/tea-garden-drum-bridge, placed over this pool by
  //  public/landmarks/san-francisco-statues.json, 2026-10-25; `withArch` keeps the planks for a city without it)
  if (!withArch) return
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
  drumBridge(out, L(-5089.7, -2544.9), L(-5088.0, -2538.6), false)
  // (the Long Bridge is the landscape's since 2026-10-27, flat between its banks: this draped one bent with the ground)
  if (!HAVE_LANTERN_MODELS) plankBridge(out, L(-5109.4, -2525.4), L(-5122.2, -2540.0))
  // (the stone lanterns are the owner's GLBs since 2026-10-26 — assetkit-models-sf/tea-garden-stone-lantern and
  //  -small-stone-lantern, placed at these spots by public/landmarks/san-francisco-statues.json; `lantern` and LANTERNS
  //  stay for a city without them)
  if (!HAVE_LANTERN_MODELS) for (const [x, z] of LANTERNS) lantern(out, ...L(x, z))
  // the Buddha's stepped stone plinth; the seated bronze on it is the GLB (assetkit-models-sf/tea-garden-buddha, placed
  // by public/landmarks/san-francisco-statues.json at 1.5 m over this ground, 2026-10-25)
  const [bx, bz] = L(-5105, -2526)
  box(out, bx, 0.5, bz, 1.6, 0.5, 1.6, STONE, surfaceTag('granite'))
  box(out, bx, 1.25, bz, 1.2, 0.25, 1.2, STONE, surfaceTag('granite'))
  // the bamboo fence round the garden: posts every 2.5 m, three rails (the real one is a tall privacy fence; the owner,
  // 2026-10-27, keeps it thin "for game purposes"), with a GAP where the Main Gate and its walls stand on the line
  for (let i = 1; i < FENCE.length; i++) {
    const a = L(...FENCE[i - 1]), b = L(...FENCE[i])
    const n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 2.5))
    const at = (t: number): [number, number] => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
    const open = (p: [number, number]): boolean => FENCE_GAPS.some(([gx, gz, r]) => Math.hypot(p[0] - gx, p[1] - gz) < r)
    for (let k = 0; k < n; k++) {
      const p = at(k / n), q = at((k + 1) / n)
      if (!open(p)) box(out, p[0], 0.95, p[1], 0.06, 0.95, 0.06, BAMBOO, 0)
      if (open(p) || open(q)) continue
      for (const y of [0.4, 1.1, 1.7]) strut(out, [p[0], y, p[1]], [q[0], y, q[1]], 0.05, 0.05, BAMBOO)
    }
  }
}

export const TEA_GARDEN: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  teaGardenPagoda, teaGardenMainGate, teaGardenTempleGate, teaGardenTeaHouse, teaGardenGiftShop, teaGardenGrounds, teaGardenLandscape,
}
