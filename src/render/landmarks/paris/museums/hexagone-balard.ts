import earcut from 'earcut'
import type { MeshBuilder } from '../../../buildings.ts'
import { edgeAt } from '../../parts.ts'
import { shade, type Rgb } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { fitted, pts } from '../palaces/common.ts'
import { piers, ribbons, wound } from './modern.ts'

const FIXED = 0
type V = [number, number, number]
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
/** the design footprint: OSM relation 4665863's box (local −z faces bearing 17, the Boulevard du Général Martial Valin) */
const HX = 136
const HZ = 84.7

/** OSM's outline and its fourteen courts in this frame (osmium, 2026-10-30): triangles and hexagons, the plan's own geometry */
const OUTER = pts([135.9, 84.7, -135.2, 81.1, -135.9, 38.4, -93.3, 36.7, -69.1, -7.2, -69.7, -37, -51.9, -38, -32.8, -79.6, 37.4, -81.3, 41.4, -76.1, 61, -76.4, 64.5, -82.5, 133.9, -84.7,
  134.4, -48.2, 132.1, -46.5, 132.6, -40.2, 135.4, -38.2, 135.3, -5.5, 132, -2.2, 132.1, 5.1, 135.9, 8.6])
const COURTS = [
  pts([118.6, 63.7, 117.5, 8.6, 89.8, 9.6, 84.6, 18.6, 109.6, 64.3]),
  pts([117.7, -3.1, 117.7, -38.2, 95.5, -37.8, 105.7, -19.9, 96.2, -1.8]),
  pts([97.1, 63.9, 78.1, 30, 68.8, 46.9, 48.2, 47.4, 58.6, 65.6]),
  pts([118.4, -48.7, 118.2, -67.5, 77.6, -66.4, 89.2, -48.4]),
  pts([95, -19.6, 84.1, -38.1, 51.9, -36.6, 72.7, -1.8, 84.6, -1.7]),
  pts([72.1, 19.9, 54, -9.5, 36.4, 27.2, 42.3, 36.7, 62.8, 36.7]),
  pts([42.5, 66.3, 34.9, 49.3, -4.5, 49, -18.3, 31.3, -37.4, 69.2]),
  pts([77.1, -47.9, 65.3, -65.7, 37.3, -65, 28.5, -48]),
  pts([44.5, -20.8, 37.1, -33.8, 21.7, -33.5, 14.5, -19.6, 22.5, -6.7, 37.4, -7.1]),
  pts([32.2, 9.2, -6.5, 9, -12, 19, -0.5, 37.1, 17.8, 37.2]),
  pts([11, -2.6, -28.7, -63.9, -43.6, -34.5, -23.6, -2.5]),
  pts([24.3, -64.6, -15.4, -64.7, 5.4, -30.6]),
  pts([-25.3, 17.7, -49.8, -22.2, -81.5, 36.2, -34, 35.1]),
  pts([-39.7, 45.5, -119.2, 48.8, -119.6, 71.7, -51.9, 69.6]),
]

const WALL: Rgb = [0.72, 0.72, 0.7]
const PIER: Rgb = [0.78, 0.78, 0.76]
const RIBBON: Rgb = [0.22, 0.27, 0.31]
const ZINC: Rgb = [0.2, 0.22, 0.25]
const SOLAR: Rgb = [0.13, 0.42, 0.42]
const SOLAR2: Rgb = [0.5, 0.72, 0.68]

/** the peaks, by their middle, their reach and their height over the courts' edge: the knots of the mesh, the big three the ones the photographs show */
const PEAKS: [number, number, number, number][] = [[-2, 41, 70, 21], [46, -32, 62, 19], [98, 4, 46, 14], [-70, 40, 52, 13], [-30, -45, 42, 12]]

/**
 * L'Hexagone Balard (Nicolas Michelin / ANMA, opened 2015), the Ministry of the Armed Forces, the French Pentagon, between
 * the Boulevard Victor and the ring road. From the boulevard a long pale stone-grey wall of regular windows six storeys
 * high; what makes it unmistakable from anywhere higher or further is the roof:
 *
 * - the plan is a mesh of triangles and hexagons round fourteen courts (OSM draws them all, and they are drawn here);
 * - and over it the roof folds up in a dark zinc range of peaks, faceted, with whole faces of them in a grid of teal solar
 *   panels and pale glass: "mountains" along the skyline of Balard, from the Parc André-Citroën to the Suzanne-Lenglen fields.
 *
 * The plan is OSM's relation 4665863. OSM has no heights: the 24 m wall is an estimate read off the Commons photographs
 * ("Hexagone Balard @ Centre Sportif Suzanne Lenglen", "... @ Ballon de Paris", "View from Ballon Generali, 7 August 2016"),
 * and so are the peaks: the roof is the plan's own triangulation folded up at the courts' corners, a likeness of the real roof's
 * folds and not a survey of them, and which knot each peak stands on I could only judge from those views.
 */
export function hexagoneBalard(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

function draw(out: MeshBuilder): void {
  const E = 24
  const rings = wound([OUTER, ...COURTS])
  // the windows: ribbons on the courts, which nobody sees, and piers and ribbons on the street
  const floors: [number, number][] = []
  for (let y = 4.4; y < E - 1; y += 3.8) floors.push([y, y + 2.1])
  ribbons(out, rings, floors, RIBBON, 0.05, 0.4, 3)
  piers(out, [rings[0]], 3.6, E, 2.7, 1.1, PIER, 0.1, 6)
  ribbons(out, [rings[0]], [[0, 3.6]], shade(RIBBON, 1.25), 0.05, 0.5, 6)
  ribbons(out, [rings[0]], [[E - 0.5, E]], PIER, 0.22, 0)

  // the height of the roof at each corner of the plan: the outline at its eaves, the courts' corners pushed up by the peaks
  const up = (p: { x: number; z: number }, k: number): number => {
    if (k === 0) return E + 0.6 + 0.12 * Math.max(0, ...PEAKS.map(([x, z, r, h]) => h * Math.max(0, 1 - Math.hypot(p.x - x, p.z - z) / r)))
    return E + 4 + Math.max(0, ...PEAKS.map(([x, z, r, h]) => h * Math.max(0, 1 - Math.hypot(p.x - x, p.z - z) / r)))
  }
  // the walls, up to the roof's line at each corner: stone to the eaves, zinc over them
  rings.forEach((r, k) => {
    for (let i = 0; i < r.length; i++) {
      const e = edgeAt(r, i)
      const ya = up(e.a, k)
      const yb = up(e.b, k)
      const n: [number, number, number] = [e.nx, 0, e.nz]
      out.quad([[e.a.x, 0, e.a.z], [e.b.x, 0, e.b.z], [e.b.x, E, e.b.z], [e.a.x, E, e.a.z]], n, UV, WALL, FIXED)
      out.quad([[e.a.x, E, e.a.z], [e.b.x, E, e.b.z], [e.b.x, yb, e.b.z], [e.a.x, ya, e.a.z]], n, UV, k === 0 ? ZINC : shade(SOLAR2, 0.72), FIXED)
    }
  })

  // ---- the roof: the plan's own triangulation, folded at those heights, every face flat: dark zinc, or solar facing south
  const flat: number[] = []
  const holes: number[] = []
  const ys: number[] = []
  rings.forEach((r, k) => {
    if (k > 0) holes.push(flat.length / 2)
    for (const p of r) {
      flat.push(p.x, p.z)
      ys.push(up(p, k))
    }
  })
  const tri = earcut(flat, holes)
  for (let i = 0; i < tri.length; i += 3) {
    const v = [tri[i], tri[i + 1], tri[i + 2]].map((j): V => [flat[2 * j], ys[j], flat[2 * j + 1]])
    face(out, v[0], v[1], v[2])
  }
}

/** One face of the folded roof, both sides drawn: zinc, or where it looks south and rakes enough a grid of solar panels and glass. */
function face(out: MeshBuilder, a: V, b: V, c: V): void {
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2]
  const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2]
  let nx = uy * vz - uz * vy
  let ny = uz * vx - ux * vz
  let nz = ux * vy - uy * vx
  const l = Math.hypot(nx, ny, nz) || 1
  nx /= l; ny /= l; nz /= l
  if (ny < 0) { nx = -nx; ny = -ny; nz = -nz }
  const N: V = [nx, ny, nz]
  // (a sliver is the triangulation's, not a roof's: only a face wide enough for its panels gets them)
  const area = l / 2
  const long = Math.max(Math.hypot(ux, uy, uz), Math.hypot(vx, vy, vz), Math.hypot(ux - vx, uy - vy, uz - vz))
  const solar = ny < 0.985 && nz > -0.02 && area > 260 && (2 * area) / long > 9
  const col = solar ? SOLAR : ny < 0.985 ? ZINC : shade(ZINC, 0.9)
  out.quad([a, b, c, c], N, UV, col, FIXED)
  if (!solar) return
  // (the panels: bands across the face from its longest side toward the far corner, every other one pale)
  const sides: [V, V, V][] = [[a, b, c], [b, c, a], [c, a, b]]
  const len = (p: V, q: V): number => Math.hypot(p[0] - q[0], p[2] - q[2])
  const [p, q, t] = sides.sort((m, n) => len(n[0], n[1]) - len(m[0], m[1]))[0]
  const rows = Math.min(6, Math.max(2, Math.round(len(p, q) / 12)))
  const at = (o: V, s: number): V => [o[0] + (t[0] - o[0]) * s + nx * 0.1, o[1] + (t[1] - o[1]) * s + ny * 0.1, o[2] + (t[2] - o[2]) * s + nz * 0.1]
  for (let k = 0; k < rows; k++) {
    const s0 = (k + 0.2) / (rows + 0.5)
    const s1 = (k + 0.72) / (rows + 0.5)
    out.quad([at(p, s0), at(q, s0), at(q, s1), at(p, s1)], N, UV, k % 2 ? SOLAR2 : shade(SOLAR, 0.7), FIXED)
  }
}
