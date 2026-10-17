/**
 * PIER 27's PLAZA, in front of the James R. Herman Cruise Terminal (2014; BUGS.md #289, owner 2026-10-16: "a very nice
 * building with a big elevated plaza in front of it, and a retaining wall separating the plaza from the sidewalk. The
 * shape is correct, the feel is wrong"). From the owner's Street View, Mapillary 849955769226762 / 1416944006039911 /
 * 550030322935500, and OSM's mapping of the site:
 *
 *  - the LAWN (landuse=grass, way 565797500), a long wedge between the Embarcadero and the terminal, RAISED: a metre and
 *    more over the sidewalk along its whole Embarcadero edge, falling back to the apron's level toward the terminal;
 *  - along that edge a long low RETAINING WALL of pale board-formed concrete, the plaza's name in steel letters on it,
 *    and on top of it, behind a lip, a band of golden grasses, yucca and heather (OSM's leaf strip, way 565797499);
 *  - the small PLANTERS by the terminal's front (ways 565797493-498), concrete boxes of grasses;
 *  - the clump of three Monterey CYPRESSES on the lawn is OSM's own trees, given their form in render/sf/flora.ts SEEN.
 *
 * Frame: centred at 37.80434, −122.40158, rotateDeg 0: local x east, z north (OSM projected the same way). Placed with
 * `drape`, so y is height over the ground under each vertex.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import type { Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { sign } from '../signage.ts'
import earcut from 'earcut'

type P2 = [number, number]
type V3 = [number, number, number]

/** way/565797500, the lawn, anticlockwise from its Embarcadero corner; vertices 8-14 are the Embarcadero edge */
const LAWN: P2[] = [[-39.2, 22.6], [-26.3, 36.1], [-21.3, 35.5], [-21.7, 32.7], [32.1, 24.2], [31.3, 18.3], [37.3, 17.6], [28.7, -57.0],
  [27.0, -58.0], [17.7, -42.8], [7.9, -29.3], [-1.1, -17.9], [-10.2, -7.2], [-24.3, 8.0]]
/** the Embarcadero edge, south to north (LAWN 8..13, then 0) */
const EDGE: P2[] = [[27.0, -58.0], [17.7, -42.8], [7.9, -29.3], [-1.1, -17.9], [-10.2, -7.2], [-24.3, 8.0], [-39.2, 22.6]]
/** ways 565797493-498: the planters before the terminal */
const PLANTERS: P2[][] = [
  [[36.4, -33.5], [35.5, -41.2], [34.0, -41.0], [34.9, -33.3]],
  [[41.1, 8.0], [40.4, 0.3], [38.6, 0.4], [39.3, 8.1]],
  [[24.4, 30.3], [43.8, 28.0], [41.4, 10.5], [38.0, 11.0], [39.5, 24.6], [24.1, 26.7]],
  [[14.3, 31.5], [22.1, 30.5], [21.8, 28.9], [14.1, 29.9]],
  [[-18.6, 35.5], [-10.8, 34.5], [-11.0, 32.8], [-18.8, 33.8]],
]

const RISE = 1.25          // the lawn's lift over the sidewalk at the wall
const FALL = 34            // …gone to the apron's level this far in from it
const BAND = 2.6           // the planted band behind the wall
const GRASS: Rgb = [0.19, 0.3, 0.12]
const SOIL: Rgb = [0.42, 0.36, 0.2]      // under the grasses: straw, as the band reads from the street
const CONCRETE: Rgb = [0.7, 0.69, 0.66]
const CAP: Rgb = [0.76, 0.75, 0.72]
const STEEL: Rgb = [0.3, 0.31, 0.32]

const hash = (x: number, z: number, k: number): number => { const s = Math.sin(x * 127.1 + z * 311.7 + k * 74.7) * 43758.5453; return s - Math.floor(s) }

/** distance from the Embarcadero edge (inward positive), and the nearest point's normal outward */
function fromEdge(x: number, z: number): { d: number; nx: number; nz: number } {
  let best = { d: Infinity, nx: 0, nz: 0 }
  for (let i = 0; i + 1 < EDGE.length; i++) {
    const [ax, az] = EDGE[i], [bx, bz] = EDGE[i + 1], dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz)
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (L * L)))
    const d = Math.hypot(ax + dx * t - x, az + dz * t - z)
    // (the edge runs south to north with the lawn on its right: outward is the left normal)
    if (d < best.d) best = { d, nx: -dz / L, nz: dx / L }
  }
  return best
}
/** the lawn's height: RISE at the wall, easing down to 0.1 at FALL in */
const lift = (x: number, z: number): number => {
  const t = Math.min(1, fromEdge(x, z).d / FALL)
  // (and a gentle roll, as a lawn has: never quite flat)
  return 0.1 + (RISE - 0.1) * (1 - t * t * (3 - 2 * t)) + 0.05 * Math.sin(x * 0.31) * Math.sin(z * 0.27) - 0.05
}

/** earcut, then each triangle split until no side is longer than `max`, each vertex at height `y(x, z)` */
function surface(out: MeshBuilder, ring: P2[], y: (x: number, z: number) => number, max: number, c: (x: number, z: number) => Rgb, tag: number): void {
  const flat = ring.flatMap((p) => p)
  const idx = earcut(flat)
  const tri = (a: P2, b: P2, d: P2, depth: number): void => {
    const ab = Math.hypot(a[0] - b[0], a[1] - b[1]), bd = Math.hypot(b[0] - d[0], b[1] - d[1]), da = Math.hypot(d[0] - a[0], d[1] - a[1])
    const m = Math.max(ab, bd, da)
    if (m > max && depth < 10) {
      if (m === ab) { const p: P2 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; tri(a, p, d, depth + 1); tri(p, b, d, depth + 1) }
      else if (m === bd) { const p: P2 = [(b[0] + d[0]) / 2, (b[1] + d[1]) / 2]; tri(a, b, p, depth + 1); tri(a, p, d, depth + 1) }
      else { const p: P2 = [(d[0] + a[0]) / 2, (d[1] + a[1]) / 2]; tri(a, b, p, depth + 1); tri(p, b, d, depth + 1) }
      return
    }
    const cx = (a[0] + b[0] + d[0]) / 3, cz = (a[1] + b[1] + d[1]) / 3
    const P = (p: P2): V3 => [p[0], y(p[0], p[1]), p[1]]
    // (earcut's winding is the ring's; the lawn is listed so its triangles face up — degenerate quads as triangles)
    out.quad([P(a), P(d), P(b), P(b)], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [1, 1]], c(cx, cz), tag)
  }
  for (let i = 0; i < idx.length; i += 3) tri(ring[idx[i]], ring[idx[i + 1]], ring[idx[i + 2]], 0)
}

/** a vertical skirt round a ring from its surface down to `y0` */
function skirt(out: MeshBuilder, ring: P2[], top: (x: number, z: number) => number, y0: number, c: Rgb, tag: number, skip?: (i: number) => boolean, inward = false): void {
  // (facing out of the ring whichever way it is listed — anticlockwise, x east and z north, has its outside on the right)
  let area = 0
  for (let i = 0; i < ring.length; i++) { const a = ring[i], b = ring[(i + 1) % ring.length]; area += a[0] * b[1] - b[0] * a[1] }
  const s = (area > 0 ? 1 : -1) * (inward ? -1 : 1)
  for (let i = 0; i < ring.length; i++) {
    if (skip?.(i)) continue
    const a = ring[i], b = ring[(i + 1) % ring.length]
    const nx = s * (b[1] - a[1]), nz = -s * (b[0] - a[0])
    out.quad([[a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], top(b[0], b[1]), b[1]], [a[0], top(a[0], a[1]), a[1]]], [nx, 0, nz], [[0, 0], [1, 0], [1, 1], [0, 1]], c, tag)
  }
}

/** a straight box between two points on the ground, `w` thick, from y0 to y1 */
function wallRun(out: MeshBuilder, a: P2, b: P2, w: number, y0: number, y1: number, c: Rgb, top: Rgb, tag: number): void {
  const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz) || 1
  const ox = (-dz / L) * w / 2, oz = (dx / L) * w / 2
  const q = (u: P2, s: number, y: number): V3 => [u[0] + ox * s, y, u[1] + oz * s]
  const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  out.quad([q(a, 1, y0), q(b, 1, y0), q(b, 1, y1), q(a, 1, y1)], [ox, 0, oz], UV, c, tag)
  out.quad([q(b, -1, y0), q(a, -1, y0), q(a, -1, y1), q(b, -1, y1)], [-ox, 0, -oz], UV, c, tag)
  out.quad([q(a, 1, y1), q(b, 1, y1), q(b, -1, y1), q(a, -1, y1)], [0, 1, 0], UV, top, tag)
  out.quad([q(a, -1, y0), q(a, 1, y0), q(a, 1, y1), q(a, -1, y1)], [-dx, 0, -dz], UV, c, tag)
  out.quad([q(b, 1, y0), q(b, -1, y0), q(b, -1, y1), q(b, 1, y1)], [dx, 0, dz], UV, c, tag)
}

export function pier27Plaza(out: MeshBuilder, _fit: Fit): void {
  const AS = surfaceTag('concrete'), LAWNTAG = 0
  // the lawn, mown stripes faintly; and the planted band behind the wall a darker soil under the grasses
  const shade = (x: number, z: number): Rgb => {
    if (fromEdge(x, z).d < BAND) return SOIL
    const k = 0.94 + 0.08 * hash(Math.round(x / 3), Math.round(z / 3), 1)
    return [GRASS[0] * k, GRASS[1] * k, GRASS[2] * k]
  }
  surface(out, LAWN, lift, 3, shade, LAWNTAG)
  // the lawn's own edge where it is not the wall: a low kerb down to the apron
  skirt(out, LAWN, (x, z) => lift(x, z) + 0.02, -0.3, CONCRETE, AS, (i) => i >= 7)
  /*
   * The wall: the lawn's Embarcadero edge, 0.35 m out, half a metre thick, standing a lip of 0.3 m over the planted band
   * behind it; returned at the north end, where the plaza's walk comes up off the corner.
   */
  const pts = EDGE.map(([x, z], i): P2 => {
    const a = EDGE[Math.max(0, i - 1)], b = EDGE[Math.min(EDGE.length - 1, i + 1)]
    const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz)
    return [x - (dz / L) * 0.35, z + (dx / L) * 0.35]
  })
  for (let i = 0; i + 1 < pts.length; i++) {
    const a = pts[i], b = pts[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1])
    // in panels, as it is poured: a thin shadow joint every 6 m
    const n = Math.max(1, Math.round(L / 6))
    for (let k = 0; k < n; k++) {
      const u0 = k / n, u1 = (k + 1) / n
      const p0: P2 = [a[0] + (b[0] - a[0]) * u0, a[1] + (b[1] - a[1]) * u0], p1: P2 = [a[0] + (b[0] - a[0]) * u1, a[1] + (b[1] - a[1]) * u1]
      const tone = 0.96 + 0.06 * hash(p0[0], p0[1], 2)
      wallRun(out, p0, p1, 0.5, -0.3, RISE + 0.3, [CONCRETE[0] * tone, CONCRETE[1] * tone, CONCRETE[2] * tone], CAP, AS)
    }
  }
  // the north end's return, along the lawn's first edge, stepping down with it
  wallRun(out, pts[pts.length - 1], [-30.6, 31.6], 0.5, -0.3, 0.9, CONCRETE, CAP, AS)
  // the name, in steel letters on the wall's face, at the middle of its longest straight
  {
    const a = pts[3], b = pts[4], mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2
    const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz)
    const nx = -dz / L, nz = dx / L
    sign(out, { type: 'flat', text: 'CRUISE TERMINAL PLAZA', h: 0.32, face: 'grotesque', weight: 'bold', colour: STEEL, lit: 'none' },
      { x: mx + nx * 0.27, y: RISE * 0.62, z: mz + nz * 0.27, heading: Math.atan2(nx, nz) })
    const c = pts[1], d = pts[2]
    sign(out, { type: 'flat', text: 'PORT OF SAN FRANCISCO', h: 0.2, face: 'grotesque', colour: STEEL, lit: 'none' },
      { x: (c[0] + d[0]) / 2 + nx * 0.27, y: RISE * 0.6, z: (c[1] + d[1]) / 2 + nz * 0.27, heading: Math.atan2(nx, nz) })
  }
  /*
   * The band behind the wall: golden grasses in drifts, yucca standing out of them, heather along the front; and the
   * lawn's few shrubs. The library's plants (assetkit plantgen), standing on the lifted ground (`dy`).
   */
  for (let i = 0; i + 1 < EDGE.length; i++) {
    const [ax, az] = EDGE[i], [bx, bz] = EDGE[i + 1], L = Math.hypot(bx - ax, bz - az)
    const ix = -(bz - az) / L, iz = (bx - ax) / L   // the outward normal: the band is stepped in against it
    for (let s = 0; s < L; s += 0.7) {
      for (const off of [0.4, 1.0, 1.6, 2.2]) {
        const h = hash(ax + s, az + off, 3)
        if (h < 0.06) continue
        const x = ax + ((bx - ax) / L) * s - ix * off + (hash(s, off, 4) - 0.5) * 0.4
        const z = az + ((bz - az) / L) * s - iz * off + (hash(off, s, 5) - 0.5) * 0.4
        const species = h > 0.93 ? 'yucca' : off < 0.5 && h > 0.6 ? 'heather' : h > 0.5 ? 'dry_grass' : 'prairie_grass'
        const hh = species === 'yucca' ? 1.3 + h * 0.6 : species === 'heather' ? 0.55 : 0.95 + h * 0.45
        out.plants.push({ x, z, species, h: hh, spin: hash(x, z, 6) * Math.PI * 2, dy: lift(x, z) })
      }
    }
  }
  // the planters: a concrete box 0.55 m tall, soil just under its lip, grasses in it
  for (const ring of PLANTERS) {
    skirt(out, ring, () => 0.55, -0.2, CONCRETE, AS)
    surface(out, ring, () => 0.52, 4, () => SOIL, AS)
    let xs = Infinity, xe = -Infinity, zs = Infinity, ze = -Infinity
    for (const [x, z] of ring) { xs = Math.min(xs, x); xe = Math.max(xe, x); zs = Math.min(zs, z); ze = Math.max(ze, z) }
    for (let x = xs + 0.5; x < xe; x += 0.9) for (let z = zs + 0.5; z < ze; z += 0.9) {
      if (!inside(ring, x, z)) continue
      const h = hash(x, z, 7)
      out.plants.push({ x, z, species: h > 0.5 ? 'dry_grass' : 'prairie_grass', h: 0.6 + h * 0.3, spin: h * 6.28, dy: 0.52 })
    }
  }
}

function inside(r: P2[], x: number, z: number): boolean {
  let o = false
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    if ((r[i][1] > z) !== (r[j][1] > z) && x < ((r[j][0] - r[i][0]) * (z - r[i][1])) / (r[j][1] - r[i][1]) + r[i][0]) o = !o
  }
  return o
}
