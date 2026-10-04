/**
 * PLAYGROUNDS (owner, 2026-10-03: "reusable procedural models for playground equipment — slides, swingsets etc.
 * These are some of the more visible things in parks, and the player will be in parks a lot, and they're fairly
 * generic/repeated like sport courts"). Every OSM `leisure=playground` is fitted at bake as a rectangle (it travels
 * as a court with sport `playground`: city/sports.ts, tools/bake.ts) and furnished here from a small kit:
 *
 *   - the soft surfacing, in one of the colours San Francisco's parks use;
 *   - a play structure: a deck on four posts under a little roof, a ladder up and a slide down;
 *   - a swing set: an A-frame each end, the top bar, two to four seats on chains;
 *   - a climbing net (the "spiderweb" — Civic Center, many others): ropes from a mast to a ring of anchors;
 *   - spring riders, and benches round the edge.
 *
 * What goes in depends on the room, and the choice and the colours on the playground's own position, so the same
 * playground is always furnished the same way. Local frame: x along the long side, z across, y up from the ground;
 * the city drapes it (render/city.ts, with the courts).
 */
import { MeshBuilder } from './buildings.ts'
import { box, prism, strut, FIXED } from './models.ts'
import type { CourtFit } from '../city/sports.ts'

type Rgb = [number, number, number]
type V3 = [number, number, number]

const SURFACES: Rgb[] = [[0.62, 0.3, 0.24], [0.24, 0.4, 0.58], [0.3, 0.5, 0.32], [0.55, 0.47, 0.34]]
const SAND_CHIPS: Rgb = [0.66, 0.58, 0.44]
const PAINTS: Rgb[] = [[0.85, 0.2, 0.15], [0.95, 0.72, 0.12], [0.15, 0.45, 0.8], [0.2, 0.62, 0.35], [0.55, 0.3, 0.7]]
const STEEL: Rgb = [0.6, 0.62, 0.64]
const ROPE: Rgb = [0.75, 0.62, 0.35]
const WOOD: Rgb = [0.5, 0.36, 0.24]
const DARK: Rgb = [0.15, 0.15, 0.16]

const hash = (a: number, b: number): number => {
  let h = (Math.imul(a ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(b, 0xc2b2ae35)) >>> 0
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d) >>> 0
  return ((h ^ (h >>> 13)) >>> 0) / 4294967296
}

/** A play structure at (cx, cz) facing +x: deck, posts, roof, ladder (−x), slide (+x). */
export function playStructure(out: MeshBuilder, cx: number, cz: number, paint: Rgb, roof: Rgb): void {
  const D = 1.5, H = 1.6
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) prism(out, cx + sx * D / 2, cz + sz * D / 2, 0, H + 1.6, 0.07, 6, paint, FIXED)
  box(out, cx, H, cz, D / 2 + 0.05, 0.06, D / 2 + 0.05, WOOD, FIXED)
  // the little roof: a pyramid of four sloped quads
  const y0 = H + 1.6, y1 = H + 2.3, r = D / 2 + 0.25
  const P = (x: number, y: number, z: number): V3 => [cx + x, y, cz + z]
  for (const [a, b] of [[[-r, -r], [r, -r]], [[r, -r], [r, r]], [[r, r], [-r, r]], [[-r, r], [-r, -r]]] as [number, number][][]) {
    const n: V3 = [(a[0] + b[0]) / 2, r, (a[1] + b[1]) / 2]
    out.quad([P(a[0], y0, a[1]), P(b[0], y0, b[1]), P(0, y1, 0), P(0, y1, 0)], n, [[0, 0], [1, 0], [1, 1], [0, 1]], roof, FIXED)
    out.quad([P(0, y1, 0), P(0, y1, 0), P(b[0], y0, b[1]), P(a[0], y0, a[1])], [-n[0], -n[1], -n[2]], [[0, 0], [1, 0], [1, 1], [0, 1]], roof, FIXED)
  }
  // guard rails on the open sides
  for (const sz of [-1, 1]) strut(out, P(-D / 2, H + 0.9, sz * D / 2), P(D / 2, H + 0.9, sz * D / 2), 0.05, 0.05, paint)
  // the ladder up the back
  for (const sz of [-0.3, 0.3]) strut(out, P(-D / 2 - 0.9, 0, sz), P(-D / 2, H, sz), 0.05, 0.05, STEEL)
  for (let k = 1; k <= 4; k++) { const t = k / 5; strut(out, P(-D / 2 - 0.9 * (1 - t), H * t, -0.3), P(-D / 2 - 0.9 * (1 - t), H * t, 0.3), 0.03, 0.03, STEEL) }
  // the slide: a chute down the front with its two side walls
  const s0: V3 = P(D / 2, H, 0), s1: V3 = P(D / 2 + 2.6, 0.3, 0)
  const w = 0.32
  out.quad([[s0[0], s0[1], s0[2] - w], [s1[0], s1[1], s1[2] - w], [s1[0], s1[1], s1[2] + w], [s0[0], s0[1], s0[2] + w]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], paint, FIXED)
  out.quad([[s0[0], s0[1], s0[2] + w], [s1[0], s1[1], s1[2] + w], [s1[0], s1[1], s1[2] - w], [s0[0], s0[1], s0[2] - w]], [0, -1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], paint, FIXED)
  for (const sz of [-w, w]) strut(out, [s0[0], s0[1] + 0.12, s0[2] + sz], [s1[0], s1[1] + 0.12, s1[2] + sz], 0.04, 0.12, paint)
  box(out, s1[0] + 0.25, 0.3, s1[2], 0.25, 0.04, w, paint, FIXED)
}

/** A swing set centred at (cx, cz), its bar along z: `seats` seats. */
export function swingSet(out: MeshBuilder, cx: number, cz: number, seats: number, paint: Rgb): void {
  const half = 0.9 * seats + 0.4, H = 2.4, splay = 0.9
  for (const sz of [-half, half]) {
    for (const sx of [-splay, splay]) strut(out, [cx + sx, 0, cz + sz], [cx, H, cz + sz], 0.06, 0.06, paint)
  }
  strut(out, [cx, H, cz - half], [cx, H, cz + half], 0.07, 0.07, paint)
  for (let i = 0; i < seats; i++) {
    const z = cz - half + 0.4 + 0.9 + i * 1.8
    for (const dz of [-0.22, 0.22]) strut(out, [cx, H, z + dz], [cx, 0.5, z + dz], 0.015, 0.015, STEEL)
    box(out, cx, 0.48, z, 0.12, 0.03, 0.25, DARK, FIXED)
  }
}

/** A climbing net: a mast and ropes down to a ring of anchors, with two rings of rope round it. */
export function climbingNet(out: MeshBuilder, cx: number, cz: number, r: number): void {
  const H = Math.min(4.5, r * 1.3)
  prism(out, cx, cz, 0, H + 0.3, 0.09, 8, STEEL, FIXED)
  const n = 8
  const ring = (t: number): V3[] => Array.from({ length: n }, (_, k) => {
    const a = (k / n) * Math.PI * 2
    return [cx + Math.cos(a) * r * (1 - t), H * t, cz + Math.sin(a) * r * (1 - t)]
  })
  for (const p of ring(0)) { strut(out, p, [cx, H, cz], 0.025, 0.025, ROPE); box(out, p[0], 0.1, p[2], 0.12, 0.1, 0.12, STEEL, FIXED) }
  for (const t of [0.35, 0.65]) {
    const rr = ring(t)
    for (let k = 0; k < n; k++) strut(out, rr[k], rr[(k + 1) % n], 0.025, 0.025, ROPE)
  }
}

/** A spring rider: a coloured animal-ish blob on a spring. */
function springRider(out: MeshBuilder, cx: number, cz: number, paint: Rgb): void {
  prism(out, cx, cz, 0, 0.45, 0.1, 6, STEEL, FIXED)
  box(out, cx, 0.62, cz, 0.35, 0.17, 0.14, paint, FIXED)
  box(out, cx + 0.3, 0.85, cz, 0.1, 0.12, 0.1, paint, FIXED)
}

/** A bench along x at (cx, cz). */
function bench(out: MeshBuilder, cx: number, cz: number, alongX: boolean): void {
  box(out, cx, 0.45, cz, alongX ? 0.9 : 0.22, 0.04, alongX ? 0.22 : 0.9, WOOD, FIXED)
  for (const s of [-0.7, 0.7]) box(out, cx + (alongX ? s : 0), 0.22, cz + (alongX ? 0 : s), 0.05, 0.22, 0.05, DARK, FIXED)
}

/** Furnish one fitted playground. */
export function playground(out: MeshBuilder, fit: CourtFit): void {
  const seed = Math.round(fit.x * 7 + fit.z * 13)
  const r = (k: number): number => hash(seed, k)
  const hl = fit.len / 2, hw = fit.wid / 2
  const local = new MeshBuilder()
  // (a playground mapped far bigger than a play area is a nature-play landscape — the Tunnel Tops' Outpost — and is
  //  laid in sand and wood chips, not coloured rubber: 2026-10-04)
  const nature = fit.len > 60 || fit.wid > 36
  const surface = nature ? SAND_CHIPS : SURFACES[Math.floor(r(1) * SURFACES.length)]
  const paint = PAINTS[Math.floor(r(2) * PAINTS.length)]
  const roof = PAINTS[(Math.floor(r(2) * PAINTS.length) + 1 + Math.floor(r(3) * (PAINTS.length - 1))) % PAINTS.length]
  /*
   * the surfacing, a little proud of the park — no bigger than a play area is (2026-10-04: the Presidio Tunnel Tops'
   * 135 × 47 m `leisure=playground`, a whole nature-play hillside, came out one flat blue slab on the lawn). A large
   * mapped playground keeps its grass; the kit stands on a pad of surfacing round itself, along the box's middle.
   */
  const sl = Math.min(hl, 16), sw = Math.min(hw, 9)
  local.quad([[-sl, 0.12, -sw], [sl, 0.12, -sw], [sl, 0.12, sw], [-sl, 0.12, sw]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], surface, FIXED)
  // the kit along the long side, as room allows: structure, swings, net, riders
  const pieces: { w: number; draw: (x: number) => void }[] = []
  const W = sw * 2
  if (W >= 3.5) pieces.push({ w: 6, draw: (x) => playStructure(local, x - 0.8, 0, paint, roof) })
  if (W >= 5) pieces.push({ w: 4, draw: (x) => swingSet(local, x, 0, Math.max(2, Math.min(4, Math.floor((W - 1.5) / 1.8))), paint) })
  if (W >= 7 && r(4) < 0.6) pieces.push({ w: 7, draw: (x) => climbingNet(local, x, 0, Math.min(3, sw - 0.8)) })
  pieces.push({ w: 2.2, draw: (x) => { springRider(local, x, -sw * 0.4, paint); springRider(local, x, sw * 0.4, roof) } })
  // as many as fit, spread out along the length
  let used = 0
  const fitting: typeof pieces = []
  for (const p of pieces) if (used + p.w <= sl * 2 - 1) { fitting.push(p); used += p.w }
  const gap = (sl * 2 - used) / (fitting.length + 1)
  let x = -sl + gap
  for (const p of fitting) { p.draw(x + p.w / 2); x += p.w + gap }
  // benches on the long sides, outside the kit's way
  if (fit.len > 10) for (const s of [-1, 1]) bench(local, s * (sl - 2.5), sw + 0.6, true)
  // into the world: turned to the playground's heading, moved to its centre
  const c = Math.cos(fit.heading), s = Math.sin(fit.heading)
  const base = out.positions.length / 3
  for (let i = 0; i < local.positions.length; i += 3) {
    const lx = local.positions[i], ly = local.positions[i + 1], lz = local.positions[i + 2]
    out.positions.push(fit.x + lx * c - lz * s, ly, fit.z + lx * s + lz * c)
    const nx = local.normals[i], nz = local.normals[i + 2]
    out.normals.push(nx * c - nz * s, local.normals[i + 1], nx * s + nz * c)
  }
  out.uvs.push(...local.uvs)
  out.colors.push(...local.colors)
  for (const idx of local.indices) out.indices.push(base + idx)
}
