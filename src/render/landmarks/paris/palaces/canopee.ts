import type { MeshBuilder } from '../../../buildings.ts'
import { strut, type Rgb } from '../../../models.ts'
import { block, hex, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { fitted, pts, rectOn, slab } from './common.ts'
import { lettersOn } from './showfront.ts'

const FIXED = 0
/** the design footprint: OSM ways 630511331 (the roof), 630213860, 630222417 (the wings), boxed at 19° (local −z faces bearing 199, the Rue Berger) */
const HX = 64.9
const HZ = 73.8
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

const GLASS_A = hex('#c9cb93')
const GLASS_B = hex('#b8c088')
const SOFFIT_A = hex('#f3dc8e')
const SOFFIT_B = hex('#e2c777')
const RIB = hex('#d4d0ab')
const RIB_DARK = hex('#d8b866')
const WING_GLASS = hex('#55655a')
const SHOP_GLASS = hex('#39423f')
const WING_FIN = hex('#c7b27c')

/** Where the roof comes to: the wings' outer walls and the roof's own edge on the garden, as OSM draws them. */
const OUTLINE = pts([
  -64.7, -69.8, -63.3, -71.4, 27.1, -73.6, 56, -73.3, 61.7, -68.4, 64.5, -57.9, 63.9, -43.3, 59.4, -26.5, 56.9, -23.8, 52, -14.8, 50, -8.4, 50.8, -4.1,
  57.8, 8.9, 59.5, 10.3, 64.5, 30.2, 64.9, 54.3, 63.1, 65.8, 60, 71, 53.4, 73.5, -62.6, 73.7, -64.4, 68.5, -64.9, 52.9, -63.8, 39.6, -62.1, 26.7, -60.5, 6.3,
  -60.4, -1.7, -60.7, -19.1, -61.7, -34.4, -64, -54.4, -64.9, -64.7,
])
/** The two wings, each with what it shows: way 630213860 on the Rue Rambuteau, way 630222417 on the Rue Berger. */
const NORTH = pts([-61.6, 45.8, -60.1, 43.3, -56.7, 42.2, -15.6, 42.1, 32, 9.1, 58.3, 9, 59.5, 10.3, 64.5, 30.2, 64.9, 54.3, 63.1, 65.8, 60, 71, 53.4, 73.5, -62.6, 73.7, -62.8, 51])
const SOUTH = pts([-63.3, -71.4, 27.1, -73.6, 56, -73.3, 61.7, -68.4, 64.5, -57.9, 63.9, -43.3, 59.4, -26.5, 56.9, -23.8, 33.5, -23.9, -14.8, -58, -18.5, -58.8, -60, -58.6, -62.9, -63.4])
/** The sunken patio between them: the rim of the hole, in plan (way 630511331's own hollow, off the photographs). */
const PIT = pts([-47, -46, -20, -47, 20, -19, 36, -13.5, 41, -7, 37, -0.5, 20, 3, -18, 31, -47, 30])

/** The roof's centre: the low point its ribs fall to, over the patio. */
const CX = -6
const CZ = -7
const SECTORS = 72
/** Stations from the centre (0) to the edge (1). */
const STATIONS = [0.1, 0.2, 0.33, 0.47, 0.62, 0.74, 0.86, 0.94, 1]

/** The distance from the centre to the outline along the ray at `a` (0 faces −z, positive toward +x). */
function reach(a: number): number {
  const dx = Math.sin(a)
  const dz = -Math.cos(a)
  let best = 1e9
  for (let i = 0; i < OUTLINE.length; i++) {
    const p = OUTLINE[i]
    const q = OUTLINE[(i + 1) % OUTLINE.length]
    const ex = q.x - p.x
    const ez = q.z - p.z
    const det = dx * -ez - dz * -ex
    if (Math.abs(det) < 1e-6) continue
    const fx = p.x - CX
    const fz = p.z - CZ
    const t = (fx * -ez - fz * -ex) / det
    const u = (dx * fz - dz * fx) / det
    if (t > 0 && u >= 0 && u <= 1 && t < best) best = t
  }
  return best
}

/** How high the roof's edge is at `a`: low over the streets, lifted and open on the garden, rippling all round. */
function edgeHeight(a: number): number {
  // the garden is local −x, a = −π/2; the closer to it the more the edge lifts, then a smaller lift at the Rue Lescot end
  const garden = Math.cos(a + Math.PI / 2)
  const lescot = Math.cos(a - Math.PI / 2)
  const g = garden > 0 ? Math.pow(garden, 3) : 0
  const l = lescot > 0 ? Math.pow(lescot, 8) : 0
  return 8 + 4.4 * g + 2.2 * l + 0.45 * Math.sin(a * 7)
}

/** The roof's height at angle `a`, station `r`: down to the centre, over the ridge at 0.62, down to the edge. */
function roofAt(a: number, r: number): number {
  if (r < 0.62) {
    const t = Math.max(0, r - 0.1) / 0.52
    return 9.6 + (14.6 - 9.6) * (t * t * (3 - 2 * t))
  }
  const t = (r - 0.62) / 0.38
  return 14.6 + (edgeHeight(a) - 14.6) * Math.pow(t, 1.7)
}

/** The roof's height over the point (x, z). */
function roofOver(x: number, z: number): number {
  const dx = x - CX
  const dz = z - CZ
  const a = Math.atan2(dx, -dz)
  return roofAt(a, Math.min(1, Math.hypot(dx, dz) / reach(a)))
}

/**
 * La Canopée (Patrick Berger and Jacques Anziutti, 2016), the roof over the Forum des Halles: a great leaf of steel and
 * glass lamellae, 130 × 150 m, pale yellow-green from outside and gold from under it. What a rider sees is:
 *
 * - from the RUES BERGER AND RAMBUTEAU (−z, +z): the roof's low rounded edge, its soffit gold, coming down over two
 *   storeys of shop glass, rising away behind the edge to a long ridge;
 * - from the GARDEN (−x): the edge lifted high and wide open, the whole hollow under it: the ribs radiating down to the
 *   low point over the patio, the two wings' bent faces of green glass and gold fins converging toward the Rue Lescot;
 * - under it: the patio itself, its rim railed, its stepped amphitheatre on the garden side, the pale box of the mall's sign.
 *
 * The plan is OSM's (osmium, 2026-10-30): the wings ways 630213860 and 630222417 (and the café 663947915 in the second);
 * the roof's edge is way 630511331's. Its section is not mapped and is off the architects' model and the photographs: 8 m
 * at the street eaves, 12.5 on the garden, a ridge at 14.6, 9.6 at the low point. The roof is drawn as 72 sectors from
 * that low point, its rib falls along them. THE PATIO IS NOT SUNK: the city's ground has no hole in it (the Place Basse is
 * 13 m down), so it is drawn level at the grade with its rail and its steps as paving; a rider can ride through it.
 */
export function canopee(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

function draw(out: MeshBuilder): void {
  patio(out)
  for (const w of [NORTH, SOUTH]) wing(out, setBack(w))
  roofField(out)
  // the slender steel legs on the garden side and the Lescot end, where no wing is under the edge
  const steel = shade(RIB_DARK, 0.9)
  for (const [x, z] of [[-58, 41], [-58, -58], [33, 7], [33, -22], [-22, 40], [-22, -56]]) {
    strut(out, [x, 0, z], [x, roofOver(x, z), z], 0.55, 0.55, steel, FIXED, false)
  }
}

function roofField(out: MeshBuilder): void {
  const a = (k: number): number => ((k % SECTORS) / SECTORS) * Math.PI * 2 - Math.PI
  const R: number[] = []
  for (let k = 0; k < SECTORS; k++) R.push(reach(a(k)))
  const P = (k: number, i: number, dy = 0): [number, number, number] => {
    const K = (k + SECTORS) % SECTORS
    const r = STATIONS[i]
    const an = a(K)
    return [CX + Math.sin(an) * R[K] * r, roofAt(an, r) + dy, CZ - Math.cos(an) * R[K] * r]
  }
  for (let k = 0; k < SECTORS; k++) {
    for (let i = 0; i + 1 < STATIONS.length; i++) {
      const c = [P(k, i), P(k + 1, i), P(k + 1, i + 1), P(k, i + 1)]
      const u = [c[1][0] - c[0][0], c[1][1] - c[0][1], c[1][2] - c[0][2]]
      const v = [c[3][0] - c[0][0], c[3][1] - c[0][1], c[3][2] - c[0][2]]
      let n: [number, number, number] = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]
      const l = Math.hypot(n[0], n[1], n[2]) || 1
      n = [n[0] / l, n[1] / l, n[2] / l]
      if (n[1] < 0) n = [-n[0], -n[1], -n[2]]
      const tone = (Math.floor(k / 2) + i) % 2
      out.quad(c, n, UV, tone ? GLASS_A : GLASS_B, FIXED)
      out.quad(c, [-n[0], -n[1], -n[2]], UV, tone ? SOFFIT_A : SOFFIT_B, FIXED)
    }
  }
  // the low point: a flat lens of glass the ribs fall to
  for (let k = 0; k < SECTORS; k++) {
    const c: [number, number, number][] = [P(k, 0), P(k + 1, 0), [CX, 9.6, CZ], [CX, 9.6, CZ]]
    out.quad(c, [0, 1, 0], UV, GLASS_A, FIXED)
    out.quad(c, [0, -1, 0], UV, SOFFIT_A, FIXED)
  }
  // the ribs, falling along every third line: a blade straddling the glass, pale over it and gold under it
  for (let k = 0; k < SECTORS; k += 3) {
    for (let i = 0; i + 1 < STATIONS.length; i++) {
      strut(out, P(k, i, 0.12), P(k, i + 1, 0.12), 0.34, 0.26, RIB, FIXED, false)
      strut(out, P(k, i, -0.32), P(k, i + 1, -0.32), 0.28, 0.5, RIB_DARK, FIXED, false)
    }
  }
  // the rings across them, and the heavy edge
  for (const i of [0, 2, 4, 6]) {
    for (let k = 0; k < SECTORS; k += 2) strut(out, P(k, i, 0.06), P(k + 2, i, 0.06), 0.16, 0.14, shade(RIB, 0.96), FIXED, false)
  }
  const last = STATIONS.length - 1
  for (let k = 0; k < SECTORS; k++) strut(out, P(k, last), P(k + 1, last), 0.3, 0.55, RIB, FIXED, false)
}

/** A wing's walls stand back under the roof's overhang wherever they meet the streets. */
function setBack(ring: { x: number; z: number }[]): { x: number; z: number }[] {
  const near = (p: { x: number; z: number }): boolean => {
    for (let i = 0; i < OUTLINE.length; i++) {
      const a = OUTLINE[i]
      const b = OUTLINE[(i + 1) % OUTLINE.length]
      const ex = b.x - a.x
      const ez = b.z - a.z
      const t = Math.max(0, Math.min(1, ((p.x - a.x) * ex + (p.z - a.z) * ez) / (ex * ex + ez * ez || 1)))
      if (Math.hypot(a.x + ex * t - p.x, a.z + ez * t - p.z) < 1.5) return true
    }
    return false
  }
  return ring.map((p) => {
    if (!near(p)) return p
    const d = Math.hypot(CX - p.x, CZ - p.z) || 1
    return { x: p.x + ((CX - p.x) / d) * 3.4, z: p.z + ((CZ - p.z) / d) * 3.4 }
  })
}

/** A wing: its glass walls up to the roof wherever they stand, bands at each floor, gold fins on the long bent faces. */
function wing(out: MeshBuilder, ring: { x: number; z: number }[]): void {
  const n = ring.length
  let area = 0
  for (let i = 0; i < n; i++) area += ring[i].x * ring[(i + 1) % n].z - ring[(i + 1) % n].x * ring[i].z
  const roofY = (x: number, z: number): number => roofOver(x, z) - 0.2
  for (let i = 0; i < n; i++) {
    const a = ring[i]
    const b = ring[(i + 1) % n]
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    if (L < 0.5) continue
    // the wall is cut in lengths of ~8 m, because its head follows the roof
    const cuts = Math.max(1, Math.ceil(L / 8))
    const tx = (b.x - a.x) / L
    const tz = (b.z - a.z) / L
    const s = area > 0 ? 1 : -1
    const nx = tz * s
    const nz = -tx * s
    const N: [number, number, number] = [nx, 0, nz]
    for (let c = 0; c < cuts; c++) {
      const u0 = (L * c) / cuts
      const u1 = (L * (c + 1)) / cuts
      const ax = a.x + tx * u0
      const az = a.z + tz * u0
      const bx = a.x + tx * u1
      const bz = a.z + tz * u1
      const ya = roofY(ax, az)
      const yb = roofY(bx, bz)
      const ya3 = Math.min(3, ya)
      const yb3 = Math.min(3, yb)
      out.quad([[ax, 0, az], [bx, 0, bz], [bx, yb3, bz], [ax, ya3, az]], N, UV, SHOP_GLASS, FIXED)
      out.quad([[ax, ya3, az], [bx, yb3, bz], [bx, yb, bz], [ax, ya, az]], N, UV, WING_GLASS, FIXED)
      // the floor bands where the wall is tall enough to have them
      for (const y of [3.4, 6.8, 10.2]) {
        if (Math.min(ya, yb) < y + 0.5) continue
        const d = 0.25
        out.quad([[ax + nx * d, y, az + nz * d], [bx + nx * d, y, bz + nz * d], [bx + nx * d, y + 0.5, bz + nz * d], [ax + nx * d, y + 0.5, az + nz * d]], N, UV, WING_FIN, FIXED)
        out.quad([[ax + nx * d, y + 0.5, az + nz * d], [bx + nx * d, y + 0.5, bz + nz * d], [bx, y + 0.5, bz], [ax, y + 0.5, az]], [0, 1, 0], UV, shade(WING_FIN, 0.8), FIXED)
      }
      // the fins
      const fins = Math.round((u1 - u0) / 1.9)
      for (let f = 0; f <= fins; f++) {
        const u = u0 + ((u1 - u0) * f) / Math.max(1, fins)
        const fx = a.x + tx * u
        const fz = a.z + tz * u
        const y1 = roofY(fx, fz)
        out.quad([[fx - tx * 0.05 + nx * 0.05, 0, fz - tz * 0.05 + nz * 0.05], [fx + tx * 0.05 + nx * 0.05, 0, fz + tz * 0.05 + nz * 0.05],
          [fx + tx * 0.05 + nx * 0.05, 3, fz + tz * 0.05 + nz * 0.05], [fx - tx * 0.05 + nx * 0.05, 3, fz - tz * 0.05 + nz * 0.05]], N, UV, shade(WING_FIN, 0.7), FIXED)
        out.quad([[fx - tx * 0.09 + nx * 0.14, 3.9, fz - tz * 0.09 + nz * 0.14], [fx + tx * 0.09 + nx * 0.14, 3.9, fz + tz * 0.09 + nz * 0.14],
          [fx + tx * 0.09 + nx * 0.14, y1, fz + tz * 0.09 + nz * 0.14], [fx - tx * 0.09 + nx * 0.14, y1, fz - tz * 0.09 + nz * 0.14]], N, UV, WING_FIN, FIXED)
      }
      // the shop front along the street walls: a pale band over the doors
      if (Math.min(ya, yb) < 10) {
        const d = 0.08
        out.quad([[ax + nx * d, 2.9, az + nz * d], [bx + nx * d, 2.9, bz + nz * d], [bx + nx * d, 3.4, bz + nz * d], [ax + nx * d, 3.4, az + nz * d]], N, UV, shade(RIB, 0.9), FIXED)
      }
    }
  }
}

/** The patio, on the grade: its paving, the rail round the rim, the steps on the garden side, the mall's pale box. */
function patio(out: MeshBuilder): void {
  // the whole hollow's paving, under the roof, then the patio's darker floor set in it
  const floor: Rgb = hex('#a6a39a')
  slab(out, OUTLINE, 0.02, 0.04, floor)
  slab(out, PIT, 0.04, 0.06, hex('#7f7d76'))
  // the steps of the amphitheatre on the garden side: bands in the paving
  for (let k = 0; k < 9; k++) {
    const x = -47 + k * 1.6
    block(out, x, x + 0.8, -36, 26, 0.06, 0.08, hex('#5f5d58'))
  }
  // the rim's rail
  const rail: Rgb = hex('#d9dadb')
  for (let i = 0; i < PIT.length; i++) {
    const a = PIT[i]
    const b = PIT[(i + 1) % PIT.length]
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    strut(out, [a.x, 1.1, a.z], [b.x, 1.1, b.z], 0.07, 0.07, rail, FIXED, false)
    const posts = Math.round(L / 3)
    for (let p = 0; p <= posts; p++) {
      const x = a.x + ((b.x - a.x) * p) / Math.max(1, posts)
      const z = a.z + ((b.z - a.z) * p) / Math.max(1, posts)
      strut(out, [x, 0, z], [x, 1.1, z], 0.05, 0.05, rail, FIXED, false)
    }
  }
  // the box with the mall's name, and the flights of stairs rising to the rim beside it
  const pale = hex('#d9d8cf')
  block(out, 26, 37, -13, -3, 0, 5.4, pale)
  rectOn(out, '-x', 26, -13, -3, 5.1, 5.25, shade(pale, 0.8), 0.03)
  lettersOn(out, '-x', 26, -8, 2.9, 'FORUM', { h: 0.85, c: hex('#26282a'), wide: 0.66, th: 0.13 })
  lettersOn(out, '-x', 26, -8, 1.7, 'DES HALLES', { h: 0.62, c: hex('#26282a'), wide: 0.66, th: 0.1 })
  for (const z of [-25, 14]) block(out, 6, 18, z, z + 2.4, 0.06, 0.2, hex('#b9b6ab'))
}
