/**
 * Argenta — way/940206084, 68 m, 12-corner plan (MODEL-A-BATCH-E12.md). The owner: *"Argenta has a
 * complicated corner curve."* The e12 batch's builder read the building correctly in its own comment —
 * *"curved corner plan + distinctive horizontal stacked balcony/band rhythm defining tower"* — and then
 * shipped `facade()` with a plain punched wall on every edge anyway, because `facade()` puts a flat wall on
 * every edge of the ring by construction (facade.ts's own doc comment: "FLAT WALLS ONLY... a facade cannot
 * be curved").
 *
 * CUSTOM, not kit: two features `facade()` cannot say at all — a genuinely curved corner, and balconies that
 * project and stack continuously by the FLOOR rather than sit inside a `bays`/`bands` slot.
 *
 * The curve is not invented: `tools/footprint.ts`'s baked outline already carries it as six short,
 * consistently-turning edges (vertices 3–9 of the 12-corner ring, a ~90° sweep from the north wall onto the
 * west one) — the mapper traced the curve as a fan of short chords rather than one long arc. `curvedRun()`
 * below finds that run the same way `columbus-tower.ts`'s `fitNose()` finds its arc (short edges, turning
 * the same way, by a sane amount) but stops there rather than fitting a circle: six ~5–9° facets already
 * read as round at this size, and the ring's own vertices keep the corner exactly on the footprint the
 * renderer gave us. Those edges get the balcony treatment; the two long straight walls get plain curtain
 * glass, which is what the photographs show away from the curve
 * (`docs/shots/refs/sf-mapillary/way-940206084-01.jpg`).
 *
 * The balconies are `balconyStack()`: a projecting slab and a rail at every floor, the glazing recessed
 * behind it — repeated up the whole height on every edge the curve touches, which is the rhythm the
 * photograph is built from (a stack of dark horizontal bands wrapping the round corner, not a window pattern
 * with balconies added to it).
 *
 * Every dimension is `fit.hx`/`fit.hz`/`fit.height` or `towerRing(fit)`; storeys and facet counts are counts.
 * Local frame: the fitted footprint's, +y up.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Rgb } from '../../models.ts'
import type { Fit } from '../fit.ts'
import { faceBand, towerRing } from '../tower.ts'
import { capPolygon } from '../../buildings.ts'
import { surfaceTag } from '../../cartoon-material.ts'

type P2 = { x: number; z: number }

const WALL: Rgb = [0.58, 0.56, 0.5]
const WALL_DARK: Rgb = [0.42, 0.4, 0.36]
const GLASS: Rgb = [0.16, 0.19, 0.22]
const RAIL: Rgb = [0.14, 0.15, 0.16]
const SLAB: Rgb = [0.66, 0.64, 0.58]
const BASE: Rgb = [0.3, 0.29, 0.27]
const ROOF: Rgb = [0.3, 0.29, 0.29]

const T_CONCRETE = surfaceTag('concrete')
const T_GLASS = surfaceTag('glass')
const T_METAL = surfaceTag('metal')

const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
const UP: [number, number, number] = [0, 1, 0]
const DOWN: [number, number, number] = [0, -1, 0]

/**
 * The run of consecutive edges that trace the plan's curved corner: short (well under the longest edge) and
 * turning the same way by a sane amount, the same test `columbus-tower.ts fitNose()` uses to find its arc.
 * Returns the EDGE indices in the run (as opposed to fitNose's vertex indices), in order, wrapping if the
 * run crosses index 0. Null when the plan has no such run (a plain rectangle).
 */
function curvedRun(ring: P2[]): number[] | null {
  const n = ring.length
  const len = (i: number): number => {
    const a = ring[i]
    const b = ring[(i + 1) % n]
    return Math.hypot(b.x - a.x, b.z - a.z)
  }
  const longest = Math.max(...ring.map((_, i) => len(i)))
  const short = (i: number): boolean => len(i) < longest * 0.4
  const turn = (i: number): number => {
    const a = ring[(i - 1 + n) % n]
    const b = ring[i]
    const c = ring[(i + 1) % n]
    let d = Math.atan2(c.z - b.z, c.x - b.x) - Math.atan2(b.z - a.z, b.x - a.x)
    while (d > Math.PI) d -= Math.PI * 2
    while (d < -Math.PI) d += Math.PI * 2
    return d
  }
  // vertices whose two incident edges are both short and which turn a sane amount, the same way
  let best: number[] = []
  let cur: number[] = []
  for (let k = 0; k < n * 2; k++) {
    const i = k % n
    const ok = short((i - 1 + n) % n) && short(i) && turn(i) > 0.05 && turn(i) < 0.9
    if (ok && cur.length < n) cur.push(i)
    else { if (cur.length > best.length) best = cur; cur = [] }
  }
  if (cur.length > best.length) best = cur
  if (best.length < 3) return null
  // the edges spanned: one before the first turning vertex, through to the last
  const from = (best[0] - 1 + n) % n
  const to = best[best.length - 1]
  const edges: number[] = []
  for (let i = from; ; i = (i + 1) % n) {
    edges.push(i)
    if (i === to) break
    if (edges.length > n) break
  }
  return edges
}

/**
 * A plain curtain-glass wall on ONE edge, y0..y1: the straight flanks away from the curve. Written directly
 * against the edge's own two points rather than routed through `tower.ts`'s `faceBand()`, which walks every
 * edge of a RING and would double this one edge (out and back) if handed just the two points as a "ring".
 */
function curtainEdge(out: MeshBuilder, a: P2, b: P2, y0: number, y1: number, floor: number, pitch: number,
                     wall: Rgb, glass: Rgb): void {
  const L = Math.hypot(b.x - a.x, b.z - a.z)
  if (L < 0.3) return
  const tx = (b.x - a.x) / L
  const tz = (b.z - a.z) / L
  const nx = tz
  const nz = -tx
  const P = (u: number, y: number, o: number): [number, number, number] => [a.x + tx * u + nx * o, y, a.z + tz * u + nz * o]
  out.quad([P(0, y0, 0), P(L, y0, 0), P(L, y1, 0), P(0, y1, 0)], [nx, 0, nz], UV, glass, T_GLASS)
  const bays = Math.max(1, Math.round(L / pitch))
  const bw = L / bays
  for (let k = 1; k < bays; k++) {
    const u = k * bw
    out.quad([P(u - 0.06, y0, 0.04), P(u + 0.06, y0, 0.04), P(u + 0.06, y1, 0.04), P(u - 0.06, y1, 0.04)], [nx, 0, nz], UV, wall, T_METAL)
  }
  const floors = Math.max(1, Math.round((y1 - y0) / floor))
  const fh = (y1 - y0) / floors
  for (let fl = 1; fl < floors; fl++) {
    const y = y0 + fl * fh
    out.quad([P(0, y - 0.1, 0.04), P(L, y - 0.1, 0.04), P(L, y + 0.1, 0.04), P(0, y + 0.1, 0.04)], [nx, 0, nz], UV, wall, T_METAL)
  }
}

/**
 * A stacked run of balconies on ONE edge: at every floor, a slab projecting `depth` out of the wall, a rail
 * standing on it, and the glazing recessed behind — repeated to the top. This is the operator the photograph
 * is built from: not a window pattern, a wrapped stack of horizontal bands.
 */
function balconyStack(out: MeshBuilder, a: P2, b: P2, y0: number, y1: number, floor: number, depth: number,
                      wall: Rgb, glass: Rgb): void {
  const L = Math.hypot(b.x - a.x, b.z - a.z)
  if (L < 0.3) return
  const tx = (b.x - a.x) / L
  const tz = (b.z - a.z) / L
  const nx = tz
  const nz = -tx
  const floors = Math.max(1, Math.round((y1 - y0) / floor))
  const fh = (y1 - y0) / floors
  const railH = Math.min(1.0, fh * 0.3)
  const slabH = Math.min(0.22, fh * 0.06)
  const P = (u: number, y: number, o: number): [number, number, number] => [a.x + tx * u + nx * o, y, a.z + tz * u + nz * o]
  // mullions in the recessed glazing behind the rail, so the wall reads as rooms rather than one glazed strip
  const mull = Math.max(1, Math.round(L / 2.6))
  const mw = L / mull
  for (let fl = 0; fl < floors; fl++) {
    const yf = y0 + fl * fh
    // the recessed glazed room, set back behind the balcony slab above it, divided into bays
    for (let k = 0; k < mull; k++) {
      out.quad([P(k * mw + 0.05, yf + slabH + railH, -0.06), P((k + 1) * mw - 0.05, yf + slabH + railH, -0.06),
        P((k + 1) * mw - 0.05, yf + fh, -0.06), P(k * mw + 0.05, yf + fh, -0.06)], [nx, 0, nz], UV, glass, T_GLASS)
    }
    // the slab: top, front edge, soffit
    out.quad([P(0, yf + slabH, depth), P(L, yf + slabH, depth), P(L, yf + slabH, 0), P(0, yf + slabH, 0)], UP, UV, SLAB, T_CONCRETE)
    out.quad([P(0, yf, depth), P(L, yf, depth), P(L, yf + slabH, depth), P(0, yf + slabH, depth)], [nx, 0, nz], UV, wall, T_CONCRETE)
    out.quad([P(0, yf, 0), P(L, yf, 0), P(L, yf, depth), P(0, yf, depth)], DOWN, UV, WALL_DARK, T_CONCRETE)
    // the rail: a thin glazed screen standing on the slab's outer edge, with a post at every bay
    out.quad([P(0, yf + slabH, depth), P(L, yf + slabH, depth), P(L, yf + slabH + railH, depth), P(0, yf + slabH + railH, depth)],
      [nx, 0, nz], UV, RAIL, T_METAL)
    for (let k = 0; k <= mull; k++) {
      const u = Math.min(L, k * mw)
      out.quad([P(u - 0.04, yf + slabH, depth + 0.04), P(u + 0.04, yf + slabH, depth + 0.04),
        P(u + 0.04, yf + slabH + railH, depth + 0.04), P(u - 0.04, yf + slabH + railH, depth + 0.04)], [nx, 0, nz], UV, RAIL, T_METAL)
    }
  }
  // the return cheeks at both ends of the run, so the balcony reads as a volume rather than a decal
  for (const [u, s] of [[0, -1], [L, 1]] as const) {
    out.quad([P(u, y0, 0), P(u, y0, depth), P(u, y1, depth), P(u, y1, 0)], [tx * s, 0, tz * s], UV, WALL_DARK, T_CONCRETE)
  }
}

export function e12_argenta_940206084(out: MeshBuilder, fit: Fit): void {
  const H = fit.height > 40 && fit.height < 100 ? fit.height : 68
  const ring = towerRing(fit)
  const curved = new Set(curvedRun(ring) ?? [])

  const baseH = H * 0.08
  const shaftTop = H - H * 0.06
  const storeyH = (shaftTop - baseH) / Math.max(6, Math.round((shaftTop - baseH) / 3.15))

  // the ground floor and lobby, all round — plain and dark, so the balconies above stand out
  faceBand(out, ring, 0, baseH, { kind: 'blank', wall: BASE, material: 'concrete' })

  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]
    const b = ring[(i + 1) % ring.length]
    if (curved.has(i)) balconyStack(out, a, b, baseH, shaftTop, storeyH, Math.min(1.1, fit.hz * 0.045), WALL, GLASS)
    else curtainEdge(out, a, b, baseH, shaftTop, storeyH, 1.8, WALL, GLASS)
  }

  // a plain cap above the balconies (the top floor or two, set back a touch in feel by simply going blank)
  faceBand(out, ring, shaftTop, H, { kind: 'blank', wall: WALL_DARK, material: 'concrete' })
  // a slim parapet above the roofline, following every edge (a thin `faceBand`, not a raw edge)
  const parapetH = Math.max(0.4, H * 0.012)
  faceBand(out, ring, H, H + parapetH, { kind: 'blank', wall: WALL_DARK, material: 'concrete' })
  capPolygon(out, ring, H + parapetH, ROOF, 0)
}
