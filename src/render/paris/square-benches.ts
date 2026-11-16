/*
 * THE BENCHES OF THE PARIS SQUARES (owner, 2026-11-16: the low stone benches had gone onto every square; "add benches to
 * plazas that probably have benches", "add different bench patterns and bench types").
 *
 * Which squares, and what kind, is OSM's (tools/square-benches.py writes square-benches.json): a square OSM maps a fair
 * share of benches in gets those, where they stand; one mapped thinly, or a named place=square of some size with none,
 * gets a PATTERN laid out here by its shape — down the middle of a long one, round the middle of a big round one, along
 * the edges, or a few facing pairs in a small one — in the type the benches round about it are.
 */
import type { MeshBuilder } from '../buildings.ts'
import { Projection, type LatLon, type Point } from '../../city/geo.ts'
import { insideRing } from '../garden.ts'
import { parisBench, plankBench, steelBench, stoneBench } from './furniture.ts'
import DATA from './square-benches.json' with { type: 'json' }

export type BenchType = 'stone' | 'davioud' | 'plank' | 'steel' | 'steelBack'
type Pattern = 'edge' | 'rows' | 'ring' | 'pairs'

/* the tunables */
const EDGE_IN = 2            // m in from the edge, for the 'edge' pattern
const EDGE_STEP = 16         // m between places along an edge…
const EDGE_KEEP = 0.5        // …and the share of them that get a bench
const ROW_STEP = 11          // m between back-to-back pairs down a long square's middle
const ROW_ASPECT = 2.5       // long:wide at and above which a square gets 'rows'
const RING_MIN_AREA = 2500   // m² at and above which a compact square may get 'ring'
const RING_FRAC = 0.32       // the ring's radius, of the square's narrower half-width
const RING_STEP = 9          // m of ring between benches
const PAIR_GAP = 3.2         // m between a facing pair's benches
const MIN_FILL_AREA = 300    // m² of a clipped piece below which no pattern is laid

// one closure per model, so placeModel's memo builds each once (a closure made per placement always misses it)
const STONE = Array.from({ length: 4 }, (_, i) => (o: MeshBuilder) => stoneBench(o, i))
const MODELS: Record<BenchType, ((o: MeshBuilder) => void)[]> = {
  stone: STONE,
  davioud: [parisBench],
  plank: [plankBench],
  steel: [(o) => steelBench(o, false)],
  steelBack: [(o) => steelBench(o, true)],
}
const pick = (t: string, h: number): ((o: MeshBuilder) => void) => { const m = MODELS[t as BenchType] ?? MODELS.davioud; return m[Math.floor(h * m.length) % m.length] }

const hash = (x: number, z: number): number => ((Math.imul(Math.round(x * 3 + z * 7) ^ 0x9e3779b9, 0x85ebca6b) >>> 0) % 1000) / 1000

interface Local { squares: { x: number; z: number; type: string; pattern: string }[]; benches: { x: number; z: number; type: string; heading: number }[] }
let memo: { origin: LatLon; local: Local } | undefined
function local(origin: LatLon): Local {
  if (memo?.origin === origin) return memo.local
  const pr = new Projection(origin)
  const at = (lat: number, lon: number): Point => pr.toLocal({ lat, lon })
  const l: Local = {
    squares: DATA.squares.map((s) => ({ ...at(s.at[0], s.at[1]), type: s.type, pattern: s.pattern })),
    benches: (DATA.benches as [number, number, string, number][]).map(([lat, lon, type, f]) => ({ ...at(lat, lon), type, heading: (f * Math.PI) / 180 })),
  }
  memo = { origin, local: l }
  return l
}

/** a pattern for a square by its shape: its long axis from the longest edge, then how long and how big */
function shapeOf(ring: Point[]): { ux: number; uz: number; long: number; wide: number; cx: number; cz: number; area: number } {
  let best = 0, ux = 1, uz = 0, a2 = 0, cx = 0, cz = 0
  for (let i = 0; i < ring.length; i++) {
    const p = ring[i], q = ring[(i + 1) % ring.length], L = Math.hypot(q.x - p.x, q.z - p.z)
    if (L > best) { best = L; ux = (q.x - p.x) / L; uz = (q.z - p.z) / L }
    const c = p.x * q.z - q.x * p.z
    a2 += c; cx += (p.x + q.x) * c; cz += (p.z + q.z) * c
  }
  cx /= 3 * a2 || 1; cz /= 3 * a2 || 1
  let lo = Infinity, hi = -Infinity, wl = Infinity, wh = -Infinity
  for (const p of ring) {
    const s = (p.x - cx) * ux + (p.z - cz) * uz, t = -(p.x - cx) * uz + (p.z - cz) * ux
    lo = Math.min(lo, s); hi = Math.max(hi, s); wl = Math.min(wl, t); wh = Math.max(wh, t)
  }
  // the box's middle, not the centroid, along each axis, so a lopsided square's rows run down its middle
  const ms = (lo + hi) / 2, mt = (wl + wh) / 2
  return { ux, uz, long: hi - lo, wide: wh - wl, cx: cx + ux * ms - uz * mt, cz: cz + uz * ms + ux * mt, area: Math.abs(a2) / 2 }
}

function choose(given: string, sh: ReturnType<typeof shapeOf>): Pattern {
  if (given === 'edge' || given === 'rows' || given === 'ring' || given === 'pairs') return given
  const h = hash(sh.cx, sh.cz)
  if (sh.long / Math.max(sh.wide, 1) >= ROW_ASPECT && sh.wide >= 7) return 'rows'
  if (sh.area >= RING_MIN_AREA) return h < 0.55 ? 'ring' : 'edge'
  return h < 0.6 ? 'pairs' : 'edge'
}

/**
 * Lay the benches of the paved areas given (one tile's), calling `place` with each bench's model, position and heading
 * (the sitter facing (sin h, cos h)). `ok` says whether a spot is free (no road, building, tree, hole).
 */
export function squareBenches(areas: { ring: Point[] }[], origin: LatLon, ok: (x: number, z: number) => boolean,
                              place: (model: (o: MeshBuilder) => void, x: number, z: number, heading: number) => void): void {
  const { squares, benches } = local(origin)
  for (const { ring } of areas) {
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
    for (const p of ring) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z) }
    const inBox = (p: Point): boolean => p.x >= x0 && p.x <= x1 && p.z >= z0 && p.z <= z1 && insideRing(ring, p.x, p.z)
    // OSM's own benches, where they stand (a bench of a neighbouring area's falls in that area's ring, not this one's)
    for (const b of benches) if (inBox(b) && ok(b.x, b.z)) place(pick(b.type, hash(b.x, b.z)), b.x, b.z, b.heading)
    const sq = squares.find((s) => s.pattern !== 'osm' && inBox(s))
    if (!sq) continue
    const sh = shapeOf(ring)
    if (sh.area < MIN_FILL_AREA) continue
    const at = (x: number, z: number, heading: number): void => {
      if (insideRing(ring, x, z) && ok(x, z)) place(pick(sq.type, hash(x, z)), x, z, heading)
    }
    const { ux, uz, cx, cz } = sh
    // the heading that faces along (dx, dz)
    const face = (dx: number, dz: number): number => Math.atan2(dx, dz)
    switch (choose(sq.pattern, sh)) {
      case 'rows': {
        // back-to-back pairs down the middle, each long along the square
        const n = Math.floor((sh.long - 8) / ROW_STEP)
        for (let i = 0; i <= n; i++) {
          const s = (i - n / 2) * ROW_STEP, x = cx + ux * s, z = cz + uz * s
          at(x - uz * 0.45, z + ux * 0.45, face(-uz, ux))
          at(x + uz * 0.45, z - ux * 0.45, face(uz, -ux))
        }
        break
      }
      case 'ring': {
        const r = (Math.min(sh.long, sh.wide) / 2) * RING_FRAC, n = Math.max(4, Math.round((2 * Math.PI * r) / RING_STEP))
        for (let i = 0; i < n; i++) {
          const a = (i / n) * 2 * Math.PI, dx = Math.cos(a), dz = Math.sin(a)
          at(cx + dx * r, cz + dz * r, face(-dx, -dz))         // facing the middle
        }
        break
      }
      case 'pairs': {
        // two facing pairs either side of the middle, across the square's width
        for (const s of sh.long > 14 ? [-sh.long / 5, sh.long / 5] : [0]) {
          const x = cx + ux * s, z = cz + uz * s
          at(x - uz * PAIR_GAP / 2, z + ux * PAIR_GAP / 2, face(uz, -ux))
          at(x + uz * PAIR_GAP / 2, z - ux * PAIR_GAP / 2, face(-uz, ux))
        }
        break
      }
      case 'edge':
        for (let i = 0; i < ring.length; i++) {
          const p = ring[i], q = ring[(i + 1) % ring.length]
          const ex = q.x - p.x, ez = q.z - p.z, L = Math.hypot(ex, ez)
          if (L < 9) continue
          const vx = ex / L, vz = ez / L
          for (let s = 4.5; s < L - 4.5; s += EDGE_STEP) {
            const bx = p.x + vx * s, bz = p.z + vz * s
            if (hash(bx, bz) > EDGE_KEEP) continue
            // EDGE_IN in from the edge, on whichever side is the square, facing away from the edge
            let nx = -vz, nz = vx
            if (!insideRing(ring, bx + nx * EDGE_IN, bz + nz * EDGE_IN)) { nx = -nx; nz = -nz }
            at(bx + nx * EDGE_IN, bz + nz * EDGE_IN, face(nx, nz))
          }
        }
        break
    }
  }
}
