/**
 * UNESCO'S GARDEN OF PEACE (Isamu Noguchi, 1956–58): the Jardin japonais south of the cube, between the Y's south
 * wing and the avenue de Ségur. Owner, 2026-11-04: "detailed plants and paths … we have the Japanese Garden in San
 * Francisco which has some similar elements" — so the Tea Garden's kit (sf/tea-garden-landscape.ts): the plant
 * library's niwaki, red maples, weeping cherries, karikomi, azaleas, bamboo, irises, mondo grass and ferns, and the
 * rock library's stones, placed by name (MeshBuilder.plants, instanced, nothing against this builder's budget).
 *
 * What this builder draws itself: the POND at the low end, the STREAM coming down to it from the cube's corner, the
 * gravel PATHS laid with flagstones, the STEPPING STONES across the pond and the slab BRIDGE over the stream.
 *
 * The outline is OSM's leisure=garden "Jardin japonais" (way 1565494805), a 39 × 26.5 m parallelogram; every
 * position below is in its own (u, v): u from the west corner A to the north corner B (along the Y's wing), v from A
 * to the south corner D. The pond, stream and paths are read off the IGN orthophoto loosely (the canopy hides most of
 * the floor); tune them here. Local frame x east, z north (front 180), metres about the outline's centroid.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Rgb } from '../../../models.ts'
import { A, B, D, at, jardinPaths, smooth, type UV2 } from '../../../../city/paris/unesco-garden-layout.ts'

// ---- the plan in (u, v) of the outline (city/paris/unesco-garden-layout.ts)

const POND = { c: [0.32, 0.55] as UV2, rx: 5.6, rz: 3.8, wobble: 0.16, n: 22 }
const STREAM: UV2[] = [[0.93, 0.3], [0.8, 0.42], [0.66, 0.36], [0.53, 0.47], [0.42, 0.52]]
const STREAM_W = 0.55 // half-width, m
const PATH_W = 0.7 // half-width
const BRIDGE_PATH = 4 // the bridge path's index in jardinPaths()
const BRIDGE_AT = 1 // the cross path's vertex where it meets the stream
const STEPS: [UV2, UV2] = [[0.3, 0.22], [0.36, 0.84]] // stepping stones across the pond
const STEP_GAP = 0.8

// ---- hero plants: [u, v, species, height, spin°]
const HERO: [number, number, string, number, number][] = [
  [0.24, 0.42, 'black_pine_grand', 6.5, 40], // leaning over the pond
  [0.5, 0.62, 'red_japanese_maple', 4.2, 10], [0.7, 0.48, 'red_japanese_maple', 3.8, 200], [0.16, 0.66, 'red_japanese_maple', 4.5, 120],
  [0.84, 0.36, 'red_japanese_maple', 3.6, 300], [0.44, 0.3, 'red_japanese_maple', 3.4, 80],
  // the cherries Japan sent with the garden
  [0.08, 0.6, 'weeping_cherry', 5.5, 0], [0.54, 0.92, 'weeping_cherry', 5, 150], [0.86, 0.82, 'weeping_cherry', 5.2, 260],
  [0.4, 0.7, 'niwaki', 2.6, 30], [0.75, 0.25, 'niwaki', 2.3, 140], [0.2, 0.25, 'niwaki', 2.8, 220], [0.92, 0.45, 'niwaki', 2.2, 90],
  [0.6, 0.55, 'tamazukuri_juniper', 2.2, 0], [0.12, 0.78, 'tamazukuri_juniper', 2, 70],
]
// the canopy over it all (the orthophoto: the floor is hardly seen)
const CANOPY: [number, number, string, number][] = [
  [0.06, 0.12, 'tree:black_pine', 17], [0.5, 0.06, 'tree:scots_pine', 19], [0.97, 0.12, 'tree:black_pine', 16],
  [0.98, 0.9, 'tree:scots_pine', 18], [0.68, 0.97, 'tree:black_pine', 15], [0.28, 0.97, 'tree:scots_pine', 17],
]
// counts of the scattered planting, placed off the paths and the water
const FILL: { species: string; n: number; h: [number, number]; band?: [number, number] }[] = [
  { species: 'azalea', n: 34, h: [0.6, 1.1] },
  { species: 'karikomi', n: 16, h: [0.7, 1.3] },
  { species: 'fern', n: 45, h: [0.5, 0.9] },
  { species: 'mugo_pine', n: 5, h: [0.8, 1.3] },
  { species: 'bamboo', n: 26, h: [4, 6.5], band: [0, 0.07] }, // the screen against the Y's wing
]
const MOSS_CELL = 2.5 // m: the moss floor's grid
const MOSS: Rgb[] = [[0.16, 0.25, 0.09], [0.14, 0.22, 0.08], [0.18, 0.27, 0.1]]
const MONDO_STEP = 1.3 // m between mondo grass tufts along the paths' edges
const IRIS_N = 12, REED_N = 6, POND_ROCKS = 16, STREAM_ROCK_STEP = 1.4

const GRAVEL: Rgb = [0.5, 0.47, 0.41]
const FLAG: Rgb = [0.3, 0.29, 0.27]
const WATER: Rgb = [0.13, 0.2, 0.22]
const SLAB: Rgb = [0.36, 0.35, 0.32]
const UVQ: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
const ROCK_SPECIES = ['rock:mossy', 'rock:mossy', 'rock:grey', 'rock:lichen', 'rock:dark']

const h1 = (a: number, b: number): number => { const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return v - Math.floor(v) }
type P = { x: number; z: number }
const segDist = (p: P, a: P, b: P): number => {
  const dx = b.x - a.x, dz = b.z - a.z, L2 = dx * dx + dz * dz || 1
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / L2))
  return Math.hypot(p.x - a.x - t * dx, p.z - a.z - t * dz)
}
const lineDist = (p: P, line: P[]): number => { let d = Infinity; for (let i = 0; i + 1 < line.length; i++) d = Math.min(d, segDist(p, line[i], line[i + 1])); return d }

export function unescoJardin(out: MeshBuilder, fit: Fit): void {
  const g = (x: number, z: number): number => fit.groundAt?.(x, z) ?? fit.grade ?? 0
  const ROCK = surfaceTag('rock')
  const rock = (x: number, z: number, h: number, seed: number, y?: number): void => {
    out.plants.push({ x, z, species: ROCK_SPECIES[Math.floor(h1(seed, 5) * ROCK_SPECIES.length)], h, spin: h1(seed, 6) * 6.28, dy: y !== undefined ? y - g(x, z) : undefined })
  }
  const plant = (p: P, species: string, h: number, spin: number): void => { out.plants.push({ x: p.x, z: p.z, species, h, spin }) }
  const flat = (pts: P[], y: (p: P) => number, c: Rgb, tag = 0): void => {
    // a fan from the first point (convex pieces only)
    // (as quads whose last two corners meet: MeshBuilder has no triangle of its own)
    for (let i = 1; i + 1 < pts.length; i++) {
      const v = (q: P): [number, number, number] => [q.x, y(q), q.z]
      out.quad([v(pts[0]), v(pts[i]), v(pts[i + 1]), v(pts[i + 1])], [0, 1, 0], UVQ, c, tag)
    }
  }

  // ---- the moss floor over the whole outline, a grid draped on the ground (the bake's lawn shows through as grass)
  {
    const nu = Math.ceil(Math.hypot(B.x - A.x, B.z - A.z) / MOSS_CELL), nv = Math.ceil(Math.hypot(D.x - A.x, D.z - A.z) / MOSS_CELL)
    const pt = (i: number, j: number): [number, number, number] => { const q = at([i / nu, j / nv]); return [q.x, g(q.x, q.z) + 0.015, q.z] }
    for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) out.quad([pt(i, j), pt(i + 1, j), pt(i + 1, j + 1), pt(i, j + 1)], [0, 1, 0], UVQ, MOSS[Math.floor(h1(i, j) * 3)], 0)
  }
  // ---- the pond: a jittered ellipse, its water at its lowest bank (the bake's rule), rocks and irises round it
  const pc = at(POND.c)
  const ring: P[] = []
  for (let i = 0; i < POND.n; i++) {
    const a = (i / POND.n) * Math.PI * 2, k = 1 + (h1(i, 3) - 0.5) * 2 * POND.wobble
    ring.push({ x: pc.x + Math.cos(a) * POND.rx * k, z: pc.z + Math.sin(a) * POND.rz * k })
  }
  const level = Math.max(g(pc.x, pc.z), ...ring.map((p) => g(p.x, p.z))) + 0.06
  flat([pc, ...ring, ring[0]], () => level, WATER)
  const inPond = (p: P): boolean => ((p.x - pc.x) / (POND.rx * 1.2)) ** 2 + ((p.z - pc.z) / (POND.rz * 1.2)) ** 2 < 1
  for (let i = 0; i < POND_ROCKS; i++) {
    const p = ring[Math.floor((i / POND_ROCKS) * POND.n)]
    rock(p.x, p.z, 0.4 + h1(i, 9) * 0.6, 100 + i)
  }
  for (let i = 0; i < IRIS_N; i++) {
    const p = ring[Math.floor(h1(i, 21) * POND.n)], q = { x: pc.x + (p.x - pc.x) * 1.08, z: pc.z + (p.z - pc.z) * 1.08 }
    plant(q, 'japanese_iris', 0.7 + h1(i, 22) * 0.3, h1(i, 23) * 6.28)
  }
  for (let i = 0; i < REED_N; i++) {
    const p = ring[(Math.floor(POND.n * 0.6) + i) % POND.n]
    plant({ x: pc.x + (p.x - pc.x) * 0.93, z: pc.z + (p.z - pc.z) * 0.93 }, 'reeds', 1 + h1(i, 31) * 0.4, h1(i, 32) * 6.28)
  }

  // ---- the stream: a ribbon of water a little over the ground, stones along its banks
  const stream = smooth(STREAM.map(at), 2)
  for (let i = 0; i + 1 < stream.length; i++) {
    const a = stream[i], b = stream[i + 1], L = Math.hypot(b.x - a.x, b.z - a.z), nx = -(b.z - a.z) / L, nz = (b.x - a.x) / L
    const n = Math.max(1, Math.round(L / 1.5))
    for (let k = 0; k < n; k++) {
      const p0 = { x: a.x + (b.x - a.x) * (k / n), z: a.z + (b.z - a.z) * (k / n) }, p1 = { x: a.x + (b.x - a.x) * ((k + 1) / n), z: a.z + (b.z - a.z) * ((k + 1) / n) }
      const y0 = Math.max(g(p0.x, p0.z), level) + 0.05, y1 = Math.max(g(p1.x, p1.z), level) + 0.05
      out.quad([[p0.x - nx * STREAM_W, y0, p0.z - nz * STREAM_W], [p1.x - nx * STREAM_W, y1, p1.z - nz * STREAM_W], [p1.x + nx * STREAM_W, y1, p1.z + nz * STREAM_W], [p0.x + nx * STREAM_W, y0, p0.z + nz * STREAM_W]], [0, 1, 0], UVQ, WATER, 0)
    }
    for (let s = 0, j = 0; s < L; s += STREAM_ROCK_STEP, j++) {
      const side = j % 2 ? 1 : -1, off = STREAM_W + 0.25 + h1(i, j) * 0.3
      rock(a.x + (b.x - a.x) * (s / L) + nx * off * side, a.z + (b.z - a.z) * (s / L) + nz * off * side, 0.3 + h1(j, i) * 0.45, 200 + i * 40 + j)
    }
  }
  // a rock group (ishigumi) at the stream's head, where it rises from the cube's corner
  const head = stream[0]
  ;[[0, 0, 1.3], [1.1, 0.5, 0.7], [-0.8, 0.9, 0.55], [0.4, -0.9, 0.4]].forEach(([dx, dz, h], i) => rock(head.x + dx, head.z + dz, h, 300 + i))

  // ---- the paths: gravel ribbons, flagstones set along them every other metre, mondo grass at their edges
  const paths = jardinPaths().map((p) => p.points)
  paths.forEach((line, li) => {
    for (let i = 0; i + 1 < line.length; i++) {
      const a = line[i], b = line[i + 1], L = Math.hypot(b.x - a.x, b.z - a.z), tx = (b.x - a.x) / L, tz = (b.z - a.z) / L, nx = -tz, nz = tx
      const n = Math.max(1, Math.round(L / 1.2))
      for (let k = 0; k < n; k++) {
        const s0 = (k / n) * L, s1 = ((k + 1) / n) * L
        const p = (s: number, d: number): [number, number, number] => { const x = a.x + tx * s + nx * d, z = a.z + tz * s + nz * d; return [x, g(x, z) + 0.03, z] }
        out.quad([p(s0, -PATH_W), p(s1, -PATH_W), p(s1, PATH_W), p(s0, PATH_W)], [0, 1, 0], UVQ, GRAVEL, 0)
      }
      for (let s = 0.5, j = 0; s < L; s += 1.05, j++) {
        const w = 0.32 + h1(li * 50 + i, j) * 0.12, l = 0.28 + h1(j, li * 50 + i) * 0.1, d = (h1(i, j + 7) - 0.5) * 0.25
        const c = (ds: number, dd: number): P => ({ x: a.x + tx * (s + ds) + nx * (d + dd), z: a.z + tz * (s + ds) + nz * (d + dd) })
        flat([c(-l, -w), c(l, -w), c(l, w), c(-l, w)], (q) => g(q.x, q.z) + 0.06, FLAG, ROCK)
      }
      for (let s = 0, j = 0; s < L; s += MONDO_STEP, j++) {
        for (const side of [-1, 1]) {
          const q = { x: a.x + tx * s + nx * (PATH_W + 0.25) * side, z: a.z + tz * s + nz * (PATH_W + 0.25) * side }
          if (!inPond(q) && lineDist(q, stream) > STREAM_W + 0.3) plant(q, 'mondo_grass', 0.25, h1(j, side + li) * 6.28)
        }
      }
    }
  })
  // the slab bridge over the stream: one long granite slab, a little arched off the banks
  {
    const cross = paths[BRIDGE_PATH], m = cross[BRIDGE_AT]
    const a = cross[BRIDGE_AT - 1], tx0 = m.x - a.x, tz0 = m.z - a.z, L0 = Math.hypot(tx0, tz0), tx = tx0 / L0, tz = tz0 / L0, nx = -tz, nz = tx
    const half = STREAM_W + 1, w = 0.6, y = Math.max(g(m.x, m.z), level) + 0.28
    const c = (s: number, d: number, yy: number): [number, number, number] => [m.x + tx * s + nx * d, yy, m.z + tz * s + nz * d]
    out.quad([c(-half, -w, y), c(half, -w, y), c(half, w, y), c(-half, w, y)], [0, 1, 0], UVQ, SLAB, ROCK)
    for (const sd of [-1, 1]) out.quad([c(-half, sd * w, y - 0.3), c(half, sd * w, y - 0.3), c(half, sd * w, y), c(-half, sd * w, y)], [nx * sd, 0, nz * sd], UVQ, SLAB, ROCK)
  }
  // the stepping stones across the pond: flat stones just over the water
  {
    const a = at(STEPS[0]), b = at(STEPS[1]), L = Math.hypot(b.x - a.x, b.z - a.z)
    for (let s = 0, j = 0; s <= L; s += STEP_GAP, j++) {
      const p = { x: a.x + (b.x - a.x) * (s / L) + (j % 2 ? 0.25 : -0.25), z: a.z + (b.z - a.z) * (s / L) }
      if (inPond(p)) rock(p.x, p.z, 0.32, 400 + j, level - 0.12)
    }
  }

  // ---- the plants: the hero ones by hand, the canopy, then the scatter kept off paths and water
  for (const [u, v, species, h, spin] of HERO) plant(at([u, v]), species, h, (spin * Math.PI) / 180)
  for (const [u, v, species, h] of CANOPY) plant(at([u, v]), species, h, h1(u, v) * 6.28)
  const clear = (p: P, r: number): boolean => !inPond(p) && lineDist(p, stream) > STREAM_W + r && paths.every((l) => lineDist(p, l) > PATH_W + r)
  FILL.forEach(({ species, n, h, band }, fi) => {
    let placed = 0
    for (let t = 0; placed < n && t < n * 30; t++) {
      const u = 0.03 + h1(fi * 97 + t, 1) * 0.94, v = band ? band[0] + h1(fi * 97 + t, 2) * (band[1] - band[0]) : 0.03 + h1(fi * 97 + t, 2) * 0.94
      const p = at([u, v])
      if (!clear(p, 0.6)) continue
      plant(p, species, h[0] + h1(t, fi) * (h[1] - h[0]), h1(fi, t) * 6.28)
      placed++
    }
  })
}
