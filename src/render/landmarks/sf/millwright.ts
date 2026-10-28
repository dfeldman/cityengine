/**
 * THE MILLWRIGHT'S COTTAGE (c. 1909; OSM way/287927007, "Millwright Cottage"), the windmill keeper's house beside the
 * Murphy Windmill at Golden Gate Park's ocean end — San Francisco Landmark #210 with the mill (owner, 2026-10-27: "not
 * sure if we have the millwright cottage").
 *
 * San Francisco Public Works: "a two-story building with a slate-covered pitched roof, brick bearing walls", about
 * 2,560 sq ft — OSM's 16.1 × 7.5 m footprint over two floors. The Commons photographs of the mill (March 2018) show it
 * behind, through the mill's gallery struts: red brick, a white frieze under the eaves, a steep hipped grey slate roof
 * with a gabled dormer in white trim, a brick chimney at the ridge, white multi-pane sash windows in white surrounds.
 * The attic under the roof is the second floor.
 *
 * Fitted to OSM's outline with `front` 232, its long side towards the windmill (the side the photographs show): local
 * x along the house, −z that front.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { box, type Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'

type V3 = [number, number, number]
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
const BRICK: Rgb = [0.56, 0.27, 0.19]
const TRIM: Rgb = [0.92, 0.91, 0.87]
const SLATE: Rgb = [0.38, 0.40, 0.43]
const GLASS: Rgb = [0.16, 0.19, 0.21]
const PLINTH: Rgb = [0.62, 0.60, 0.56]

/** the eaves over the plinth, the roof's rise to its ridge, how far the eaves overhang */
const EAVES = 3.9
const RISE = 3.7
const OVER = 0.35

export function millwrightCottage(out: MeshBuilder, fit: Fit): void {
  const brick = surfaceTag('brick'), tile = surfaceTag('tile'), glass = surfaceTag('glass')
  const hx = fit.hx, hz = fit.hz
  // the concrete plinth, the brick walls, the white frieze under the eaves
  box(out, 0, 0.3, 0, hx + 0.05, 0.3, hz + 0.05, PLINTH, surfaceTag('concrete'))
  box(out, 0, (0.6 + EAVES) / 2, 0, hx, (EAVES - 0.6) / 2, hz, BRICK, brick)
  box(out, 0, EAVES - 0.15, 0, hx + 0.06, 0.15, hz + 0.06, TRIM, 0)

  // the hipped roof: two long slopes and two hipped ends, the ridge shortened by the end slopes' run
  const ex = hx + OVER, ez = hz + OVER, rx = Math.max(0.5, ex - ez), top = EAVES + RISE
  const P = (x: number, y: number, z: number): V3 => [x, y, z]
  const slopeN = (nx: number, nz: number): V3 => { const l = Math.hypot(nx, RISE, nz); return [nx / l, (Math.abs(nx) + Math.abs(nz)) / l, nz / l] }
  out.quad([P(-ex, EAVES, -ez), P(ex, EAVES, -ez), P(rx, top, 0), P(-rx, top, 0)], slopeN(0, -ez), UV, SLATE, tile)
  out.quad([P(ex, EAVES, ez), P(-ex, EAVES, ez), P(-rx, top, 0), P(rx, top, 0)], slopeN(0, ez), UV, SLATE, tile)
  out.quad([P(ex, EAVES, -ez), P(ex, EAVES, ez), P(rx, top, 0), P(rx, top, 0)], slopeN(ex - rx, 0), UV, SLATE, tile)
  out.quad([P(-ex, EAVES, ez), P(-ex, EAVES, -ez), P(-rx, top, 0), P(-rx, top, 0)], slopeN(-(ex - rx), 0), UV, SLATE, tile)
  // the soffit under the overhang
  out.quad([P(-ex, EAVES, -ez), P(ex, EAVES, -ez), P(ex, EAVES, ez), P(-ex, EAVES, ez)], [0, -1, 0], UV, TRIM, 0)

  // the dormers: two to a long side, gabled, white, a sash window in each
  for (const side of [-1, 1]) for (const dx of [-hx * 0.42, hx * 0.42]) dormer(out, dx, side, ez, tile, glass)
  // the chimney through the ridge, off-centre
  box(out, hx * 0.3, top - 0.2, 0.3, 0.38, 1.1, 0.3, BRICK, brick)
  box(out, hx * 0.3, top + 0.95, 0.3, 0.44, 0.06, 0.36, PLINTH, 0)

  // the windows: four to a long side (the door in the middle of the front), two to each end, white surrounds, 6-over-6
  const xs = [-0.72, -0.36, 0.36, 0.72].map((f) => f * hx)
  for (const x of xs) { sash(out, x, -hz, 0, -1, glass); sash(out, x, hz, 0, 1, glass) }
  for (const z of [-0.45, 0.45].map((f) => f * hz)) { sash(out, -hx, z, -1, 0, glass); sash(out, hx, z, 1, 0, glass) }
  // the front door, a panelled white door under a transom, on a concrete stoop
  box(out, 0, 1.75, -hz - 0.04, 0.6, 1.15, 0.04, TRIM, 0)
  box(out, 0, 1.55, -hz - 0.07, 0.46, 0.95, 0.03, [0.80, 0.78, 0.72], 0)
  box(out, 0, 2.75, -hz - 0.07, 0.46, 0.12, 0.03, GLASS, glass)
  box(out, 0, 0.32, -hz - 0.6, 0.9, 0.32, 0.55, PLINTH, surfaceTag('concrete'))
}

/** a white-trimmed sash window on the wall at (x, z) facing (nx, nz): its surround, dark panes, the meeting rail and bars */
function sash(out: MeshBuilder, x: number, z: number, nx: number, nz: number, glass: number): void {
  const tx = -nz, tz = nx, w = 0.5, y0 = 1.35, y1 = 2.95
  const Q = (u: number, y: number, d: number): V3 => [x + tx * u + nx * d, y, z + tz * u + nz * d]
  const n: V3 = [nx, 0, nz]
  out.quad([Q(-w - 0.1, y0 - 0.12, 0.03), Q(w + 0.1, y0 - 0.12, 0.03), Q(w + 0.1, y1 + 0.12, 0.03), Q(-w - 0.1, y1 + 0.12, 0.03)], n, UV, TRIM, 0)
  out.quad([Q(-w, y0, 0.05), Q(w, y0, 0.05), Q(w, y1, 0.05), Q(-w, y1, 0.05)], n, UV, GLASS, glass)
  const bar = (u0: number, ya: number, u1: number, yb: number): void => out.quad([Q(u0, ya, 0.07), Q(u1, ya, 0.07), Q(u1, yb, 0.07), Q(u0, yb, 0.07)], n, UV, TRIM, 0)
  const mid = (y0 + y1) / 2
  bar(-w, mid - 0.04, w, mid + 0.04)
  for (const u of [-w / 3, w / 3]) bar(u - 0.02, y0, u + 0.02, y1)
  for (const y of [(y0 + mid) / 2, (mid + y1) / 2]) bar(-w, y - 0.02, w, y + 0.02)
  // the sill
  out.quad([Q(-w - 0.14, y0 - 0.14, 0.12), Q(w + 0.14, y0 - 0.14, 0.12), Q(w + 0.14, y0 - 0.14, 0), Q(-w - 0.14, y0 - 0.14, 0)], [0, 1, 0], UV, TRIM, 0)
}

/** a gabled dormer on the long slope `side` (−1 front, +1 back), centred at x: white cheeks and face, a slate gable roof */
function dormer(out: MeshBuilder, x: number, side: number, ez: number, tile: number, glass: number): void {
  const hw = 0.7, y0 = EAVES + 0.5, y1 = y0 + 1.25, peak = y1 + 0.6
  // the slope's depth at y0 (how far in from the eaves the dormer's face stands)
  const zf = side * (ez - (ez * (y0 - EAVES)) / RISE)
  const zb = side * (ez - (ez * (peak - EAVES)) / RISE) - side * 0.05
  const n: V3 = [0, 0, side]
  // the face, white, and its window
  out.quad([[x - hw, y0, zf], [x + hw, y0, zf], [x + hw, y1, zf], [x - hw, y1, zf]], n, UV, TRIM, 0)
  out.quad([[x - hw, y1, zf], [x + hw, y1, zf], [x, peak, zf], [x, peak, zf]], n, UV, TRIM, 0)
  out.quad([[x - 0.42, y0 + 0.18, zf + side * 0.03], [x + 0.42, y0 + 0.18, zf + side * 0.03], [x + 0.42, y1 - 0.12, zf + side * 0.03], [x - 0.42, y1 - 0.12, zf + side * 0.03]], n, UV, GLASS, glass)
  out.quad([[x - 0.42, (y0 + y1) / 2 - 0.03, zf + side * 0.05], [x + 0.42, (y0 + y1) / 2 - 0.03, zf + side * 0.05], [x + 0.42, (y0 + y1) / 2 + 0.03, zf + side * 0.05], [x - 0.42, (y0 + y1) / 2 + 0.03, zf + side * 0.05]], n, UV, TRIM, 0)
  // the cheeks back to the roof
  for (const s of [-1, 1]) out.quad([[x + s * hw, y0, zf], [x + s * hw, y0, zb], [x + s * hw, y1, zb], [x + s * hw, y1, zf]], [s, 0, 0], UV, TRIM, 0)
  // the gable roof, two slopes from the ridge back to the main roof, overhanging the face a little
  const zo = zf + side * 0.15
  for (const s of [-1, 1]) {
    const l = Math.hypot(0.6, hw + 0.1)
    out.quad([[x + s * (hw + 0.1), y1 - 0.05, zo], [x, peak + 0.05, zo], [x, peak + 0.05, zb], [x + s * (hw + 0.1), y1 - 0.05, zb]], [s * 0.6 / l, (hw + 0.1) / l, 0], UV, SLATE, tile)
  }
}
