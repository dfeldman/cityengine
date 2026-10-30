import { capPolygonWithHoles, type MeshBuilder } from '../../../buildings.ts'
import { box, strut, type Rgb } from '../../../models.ts'
import { block, hex, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { bar, boxOn, edgeFrame, rect, rib } from '../monuments/gothic.ts'
import { fitted, pts, rectOn } from './common.ts'
import { lettersOn } from './showfront.ts'

const FIXED = 0
/** the design footprint: OSM ways 630511331 (the roof), 630213860, 630222417 (the wings), boxed at 19° (local −z faces bearing 199, the Rue Berger) */
const HX = 64.9
const HZ = 73.8
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

// (set dark and warm: the flat material lights an upward face about 1.6 times, and the first pale yellow-green came out white)
const GLASS_A = hex('#a99a55')
const GLASS_B = hex('#9a8c4a')
const SOFFIT_A = hex('#9c7f35')
const SOFFIT_B = hex('#8c702a')
const RIB = hex('#dcdcd2')
const WING_GLASS = hex('#4c5a55')
const SHOP_GLASS = hex('#2c3431')
const WING_FIN = hex('#dcb25a')
const FASCIA = hex('#d2cdbb')
const WHITE = hex('#e6e6e2')

/** Where the roof comes to: the wings' outer walls and the roof's own edge on the garden, as OSM draws them. */
const OUTLINE = pts([
  -64.7, -69.8, -63.3, -71.4, 27.1, -73.6, 56, -73.3, 61.7, -68.4, 64.5, -57.9, 63.9, -43.3, 59.4, -26.5, 56.9, -23.8, 52, -14.8, 50, -8.4, 50.8, -4.1,
  57.8, 8.9, 59.5, 10.3, 64.5, 30.2, 64.9, 54.3, 63.1, 65.8, 60, 71, 53.4, 73.5, -62.6, 73.7, -64.4, 68.5, -64.9, 52.9, -63.8, 39.6, -62.1, 26.7, -60.5, 6.3,
  -60.4, -1.7, -60.7, -19.1, -61.7, -34.4, -64, -54.4, -64.9, -64.7,
])
/** The two wings, each with what it shows: way 630213860 on the Rue Rambuteau, way 630222417 on the Rue Berger. */
const NORTH = pts([-61.6, 45.8, -60.1, 43.3, -56.7, 42.2, -15.6, 42.1, 32, 9.1, 58.3, 9, 59.5, 10.3, 64.5, 30.2, 64.9, 54.3, 63.1, 65.8, 60, 71, 53.4, 73.5, -62.6, 73.7, -62.8, 51])
const SOUTH = pts([-63.3, -71.4, 27.1, -73.6, 56, -73.3, 61.7, -68.4, 64.5, -57.9, 63.9, -43.3, 59.4, -26.5, 56.9, -23.8, 33.5, -23.9, -14.8, -58, -18.5, -58.8, -60, -58.6, -62.9, -63.4])
/**
 * The void between them: the rim of the hole, in plan, off the wings' faces and, on the garden side, off the IGN lidar's
 * edge (tools/ign-lidar.ts, 2026-10-30: the ground falls 3 m in 10 at local x −60, between z −35 and 25); inside the two
 * footways round it, 173314679 and 409117859, which it comes within about 2 m of at the narrow end.
 */
const PIT = pts([-59, -36, -42, -50, -20, -47, 20, -19, 30, -13, 33, -7, 30, -1.5, 20, 3, -18, 27, -58, 28])

/** The roof's centre: the low point its ribs fall to, over the patio. */
const CX = -6
const CZ = -7
const SECTORS = 64
/** Stations from the centre (0) to the edge (1). */
const STATIONS = [0.1, 0.2, 0.33, 0.47, 0.62, 0.74, 0.86, 0.95, 1]
/** the wings' flat heads: a shop floor and two more, as OSM's building:levels=3, the roof floating clear over them */
const WING_H = 10

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
  return 10.7 + 3.4 * g + 1.6 * l + 0.4 * Math.sin(a * 7)
}

/** The roof's height at angle `a`, station `r`: down to the centre, over the ridge at 0.62, curling down to the edge. */
function roofAt(a: number, r: number): number {
  if (r < 0.62) {
    const t = Math.max(0, r - 0.1) / 0.52
    return 11.2 + (15.4 - 11.2) * (t * t * (3 - 2 * t))
  }
  const t = (r - 0.62) / 0.38
  return 15.4 + (edgeHeight(a) - 15.4) * Math.pow(t, 2.4)
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
 * glass lamellae, 130 × 150 m. The owner, riding by: "another building where we render the canopy but no walls … i guess
 * in this case it really is partially open to the elements … note the two 'buildings' under a huge canopy". What their
 * street view shows, and what is drawn:
 *
 * - the ROOF, pale gold glass on long curved steel ribs, floating about 14 m up, curling down at its edge, OPEN underneath:
 *   it no longer comes down to meet the walls, and stands on slender steel legs;
 * - beneath it TWO SEPARATE LONG CURVED BUILDINGS (OSM's wings) facing each other across the void: a shop floor of dark glass
 *   under a pale fascia, and over it two floors of glass behind tall vertical gold fins, with a flat head at 10 m;
 * - in the VOID between them, the descent to the Place Basse: a glass balustrade round the rim, escalators going down, a
 *   dark floor, and slender white poles with wayfinding boards.
 *
 * THE GROUND. A model cannot dig the city's ground, so the well goes as deep as the ground does. The IGN lidar has the void's
 * garden end 3.3 m under the street (its returns stop under the roof, so it rises back to grade by local x = 0; the real Place
 * Basse is deeper, 13 m from memory). The loader seats a model at the lowest ground under its box, and the first model's floor,
 * a slab level with the seat, stood over that dip and under the streets: so the drawing here stands on the STREETS' grade (`streetGrade`,
 * the same lift as church.ts), its floor is draped on the ground under it (`well`), and the paving under the rest of
 * the roof is the city's (`MeshBuilder.grounds`). Where the ground is flat (the shot tool; the terrarium bake) the well is a
 * painting: bands going darker to the middle, the rim's real balustrade and escalators falling to it from a raised head.
 *
 * The plan is OSM's (osmium, 2026-10-30): the wings ways 630213860 and 630222417 (and the café 663947915 in the second); the
 * roof's edge is way 630511331's. Its section is not mapped: the numbers (10.7 m at the street eaves, 14 on the garden, a
 * 15.4 m ridge, 11.2 at the low point) are from the owner's "about 14 m" and an estimate off their photograph. The roof is 64 sectors from
 * that low point, its ribs falling along them.
 */
export function canopee(out: MeshBuilder, fit: Fit): void {
  const sx = fit.hx > 0 ? fit.hx / HX : 1
  const sz = fit.hz > 0 ? fit.hz / HZ : 1
  // the ground under a point of the design, over the loader's seat; flat where the loader did not say
  const seat = (x: number, z: number): number => fit.groundAt?.(x * sx, z * sz) ?? 0
  const grade = streetGrade(seat)
  fitted(out, fit, HX, HZ, (q) => {
    draw(q, (x, z) => seat(x, z) - grade)
    for (let i = 1; i < q.positions.length; i += 3) q.positions[i] += grade
  })
  // the paving under the rest of the roof, draped by the city's ground pass over the grass it otherwise is
  out.grounds.push(OUTLINE.map((p) => ({ x: p.x * sx, z: p.z * sz })))
}

/** What the streets round it stand at, over the loader's seat: the median of the ground just outside the walls. */
function streetGrade(seat: (x: number, z: number) => number): number {
  const at = [[-68, 40], [-68, -30], [-30, -78], [20, -78], [58, -40], [68, 0], [60, 50], [20, 78], [-30, 78]].map(([x, z]) => seat(x, z)).sort((a, b) => a - b)
  return at[at.length >> 1]
}

type Ground = (x: number, z: number) => number

function draw(out: MeshBuilder, ground: Ground): void {
  well(out, ground)
  for (const w of [NORTH, SOUTH]) wing(out, setBack(w))
  roofField(out)
  // the slender steel legs: on the wings' heads and in the open on the garden side and the Lescot end
  const steel = shade(RIB, 0.92)
  for (const [x, z, y] of [[-58, 41, -1], [-58, -56, -1], [33, 7, -1], [33, -22, -1], [-22, 40, -1], [-22, -56, -1],
    [-30, 55, WING_H], [20, 40, WING_H], [-30, -66, WING_H], [20, -48, WING_H]]) {
    strut(out, [x, y, z], [x, roofOver(x, z), z], 0.5, 0.5, steel, FIXED, false)
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
      // the lamellae run with the ribs: a stripe to a sector, a little lighter in toward the ridge
      const tone = k % 2
      const lit = 0.94 + 0.1 * Math.sin((i / (STATIONS.length - 1)) * Math.PI)
      out.quad(c, n, UV, shade(tone ? GLASS_A : GLASS_B, lit), FIXED)
      soffit(out, c, [-n[0], -n[1], -n[2]], shade(tone ? SOFFIT_A : SOFFIT_B, lit))
    }
  }
  // the low point: a flat lens of glass the ribs fall to, two wedges to the quad
  for (let k = 0; k < SECTORS; k += 2) {
    const c: [number, number, number][] = [[CX, 11.2, CZ], P(k, 0), P(k + 1, 0), P(k + 2, 0)]
    out.quad(c, [0, 1, 0], UV, GLASS_A, FIXED)
    soffit(out, c, [0, -1, 0], SOFFIT_A)
  }
  // the ribs, falling along every third line: one blade straddling the glass, pale steel from above and from under
  for (let k = 0; k < SECTORS; k += 3) {
    for (let i = 0; i + 1 < STATIONS.length; i++) strut(out, P(k, i, -0.1), P(k, i + 1, -0.1), 0.3, 0.62, RIB, FIXED, false)
  }
  // the rings across them, and the heavy edge
  for (const i of [0, 2, 4]) {
    for (let k = 0; k < SECTORS; k += 3) strut(out, P(k, i, 0.02), P(k + 3, i, 0.02), 0.16, 0.2, shade(RIB, 0.96), FIXED, false)
  }
  const last = STATIONS.length - 1
  for (let k = 0; k < SECTORS; k++) strut(out, P(k, last), P(k + 1, last), 0.3, 0.5, RIB, FIXED, false)
}

/**
 * The roof from under it: wound to face down, but lit as if it faced up, because it is glass with the day coming through it. Lit as what
 * it is, a downward face, the material's ground bounce makes the whole of the gold a dull brown (the owner's photograph has it glowing).
 */
function soffit(out: MeshBuilder, c: [number, number, number][], down: [number, number, number], colour: Rgb): void {
  out.quad(c, down, UV, colour, FIXED)
  const at = out.normals.length - 12
  for (let i = 0; i < 4; i++) {
    out.normals[at + i * 3] = 0
    out.normals[at + i * 3 + 1] = 1
    out.normals[at + i * 3 + 2] = 0
  }
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

/**
 * One of the two buildings: a shop floor of dark glass, mullions and a pale fascia; over it two floors of glass behind tall
 * gold fins, a floor band between them; a flat head at WING_H, clear of the roof. About 10 triangles a metre of wall. The walls run
 * on down past the grade, for the streets' slope.
 */
function wing(out: MeshBuilder, ring: { x: number; z: number }[]): void {
  const n = ring.length
  let area = 0
  for (let i = 0; i < n; i++) area += ring[i].x * ring[(i + 1) % n].z - ring[(i + 1) % n].x * ring[i].z
  const s = area > 0 ? 1 : -1
  const shopTop = 4.3
  const FIN = 1.7
  for (let i = 0; i < n; i++) {
    const a = ring[i]
    const b = ring[(i + 1) % n]
    const L0 = Math.hypot(b.x - a.x, b.z - a.z)
    if (L0 < 0.5) continue
    // (a point just inside this wall, which is all a frame needs to know which way it faces)
    const inside = { x: (a.x + b.x) / 2 - ((b.z - a.z) / L0) * s, z: (a.z + b.z) / 2 + ((b.x - a.x) / L0) * s }
    const fr = edgeFrame(out, a, b, inside)
    const L = fr.L
    rect(fr, 0, L, -2, shopTop, 0, SHOP_GLASS)
    rect(fr, 0, L, shopTop, WING_H, 0, WING_GLASS)
    // the fascia over the shops, the floor band, the head
    boxOn(fr, 0, L, shopTop - 0.4, shopTop + 0.15, 0, 0.4, FASCIA, true)
    rect(fr, 0, L, 7.1, 7.35, 0.1, shade(WING_FIN, 0.82))
    boxOn(fr, 0, L, WING_H - 0.3, WING_H, 0, 0.3, shade(WING_FIN, 0.92))
    // the fins, and the shops' mullions at every other one
    const fins = Math.max(1, Math.round(L / FIN))
    for (let f = 0; f <= fins; f++) {
      const u = (L * f) / fins
      rib(fr, [u, shopTop + 0.15], [u, WING_H - 0.3], 0.2, 0, 0.5, f % 2 ? WING_FIN : shade(WING_FIN, 0.9))
      if (f % 2 === 0) rect(fr, u - 0.05, u + 0.05, 0, shopTop - 0.4, 0.04, shade(FASCIA, 0.7))
    }
  }
  capPolygonWithHoles(out, [ring], WING_H, shade(FASCIA, 0.8), FIXED)
}

/**
 * THE VOID: the floor on the ground under it, going darker to the middle; the wall of the well where the ground has fallen
 * away; the rim's glass balustrade; the escalators; the wayfinding poles; the pale box with the mall's name.
 */
function well(out: MeshBuilder, ground: Ground): void {
  // the rim's extent along x: strips across the hole, from its two walls in
  const zRange = (x: number): [number, number] | null => {
    let lo = Infinity
    let hi = -Infinity
    for (let i = 0; i < PIT.length; i++) {
      const a = PIT[i]
      const b = PIT[(i + 1) % PIT.length]
      if ((a.x <= x) === (b.x <= x)) continue
      const z = a.z + ((x - a.x) / (b.x - a.x)) * (b.z - a.z)
      lo = Math.min(lo, z)
      hi = Math.max(hi, z)
    }
    return lo < hi ? [lo, hi] : null
  }
  const STRIP = 6
  const ROWS = 8
  const DARK: Rgb = hex('#29292a')
  const EDGE: Rgb = hex('#6e6b64')
  for (let x = -59; x < 33; x += STRIP) {
    const x1 = Math.min(33, x + STRIP)
    const r0 = zRange(x + 0.01)
    const r1 = zRange(x1 - 0.01)
    if (!r0 || !r1) continue
    for (let j = 0; j < ROWS; j++) {
      const t0 = j / ROWS
      const t1 = (j + 1) / ROWS
      const corner = (xx: number, r: [number, number], t: number): [number, number, number] => {
        const z = r[0] + (r[1] - r[0]) * t
        return [xx, ground(xx, z) + 0.06, z]
      }
      // the paint: from the rim's pale step down to the dark of the middle, by how far in this cell is on either axis
      const inZ = 1 - Math.abs((t0 + t1) / 2 - 0.5) * 2
      const inX = 1 - Math.abs((x + x1) / 2 + 9) / 50
      const k = Math.min(1, Math.min(inZ * 2.2, Math.max(0, inX) * 2.6))
      const band = (j + Math.floor((x + 59) / STRIP)) % 2 ? 1 : 0.96
      const c: Rgb = [(EDGE[0] + (DARK[0] - EDGE[0]) * k) * band, (EDGE[1] + (DARK[1] - EDGE[1]) * k) * band, (EDGE[2] + (DARK[2] - EDGE[2]) * k) * band]
      out.quad([corner(x, r0, t0), corner(x1, r1, t0), corner(x1, r1, t1), corner(x, r0, t1)], [0, 1, 0], UV, c, FIXED)
    }
  }
  // the garden side's steps, going down into it: bands across the floor
  for (let k = 0; k < 6; k++) {
    const x = -55 + k * 2
    const z0 = -32
    const z1 = 24
    const N = 4
    for (let j = 0; j < N; j++) {
      const za = z0 + ((z1 - z0) * j) / N
      const zb = z0 + ((z1 - z0) * (j + 1)) / N
      const c = hex('#7b7870')
      out.quad([[x, ground(x, za) + 0.1, za], [x + 0.7, ground(x + 0.7, za) + 0.1, za], [x + 0.7, ground(x + 0.7, zb) + 0.1, zb], [x, ground(x, zb) + 0.1, zb]], [0, 1, 0], UV, c, FIXED)
    }
  }
  // the rim: the well's wall, a pale coping, posts and a rail, glass between. Gaps at the escalators' heads
  const glass: Rgb = hex('#9fb4ad')
  const rail: Rgb = WHITE
  const inside = { x: -9, z: -9 }
  const gaps: [number, number][] = [[-58.3, 8], [-58.6, -14], [33, -7]]
  const PANEL = 3.2
  for (let i = 0; i < PIT.length; i++) {
    const a = PIT[i]
    const b = PIT[(i + 1) % PIT.length]
    // the frame faces INTO the hole: the wall of the well is its face, and the glass needs a face each way
    const fr = edgeFrame(out, b, a, { x: 2 * a.x - inside.x, z: 2 * a.z - inside.z })
    const L = fr.L
    const n = Math.max(1, Math.round(L / PANEL))
    for (let p = 0; p < n; p++) {
      const u0 = (L * p) / n
      const u1 = (L * (p + 1)) / n
      const pa = fr.P(u0, 0, 0)
      const pb = fr.P(u1, 0, 0)
      const ma = { x: (pa[0] + pb[0]) / 2, z: (pa[2] + pb[2]) / 2 }
      const yFloor = Math.min(ground(pa[0], pa[2]), ground(pb[0], pb[2])) - 0.1
      // (the wall into the well, only where the ground has fallen far enough to see one)
      if (yFloor < -0.25) rect(fr, u0, u1, yFloor, 0.1, 0, hex('#55534d'))
      if (gaps.some(([x, z]) => Math.hypot(ma.x - x, ma.z - z) < 2.2)) continue
      rect(fr, u0, u1, 0.12, 1.05, 0.02, glass)
      fr.out.quad([fr.P(u0, 0.12, 0.03), fr.P(u1, 0.12, 0.03), fr.P(u1, 1.05, 0.03), fr.P(u0, 1.05, 0.03)], [-fr.n[0], 0, -fr.n[2]], UV, shade(glass, 0.9), FIXED)
      bar(fr, [u0, 0], [u0, 1.12], 0.07, 0.05, rail)
    }
    boxOn(fr, 0, L, 1.05, 1.12, -0.04, 0.04, rail)
    boxOn(fr, 0, L, -0.1, 0.14, -0.3, 0.3, hex('#b5b2a6'))
  }
  // the escalators: a pair at each of two heads on the garden side, where the ground really falls, and one in the narrow end
  const down = (x0: number, z0: number, x1: number, z1: number): void => {
    for (const off of [-1, 1]) {
      const L = Math.hypot(x1 - x0, z1 - z0) || 1
      const sx = -((z1 - z0) / L) * off * 0.85
      const sz = ((x1 - x0) / L) * off * 0.85
      const top: [number, number, number] = [x0 + sx, Math.max(0.5, ground(x0, z0) + 0.5), z0 + sz]
      const bot: [number, number, number] = [x1 + sx, ground(x1, z1) + 0.08, z1 + sz]
      escalator(out, top, bot)
    }
    // the landing at its head
    box(out, x0, 0.25, z0, 2.2, 0.25, 2.2, hex('#a7a59b'), FIXED)
  }
  down(-58.3, 8, -46, 8)
  down(-58.6, -14, -46, -14)
  down(31, -7, 19, -7)
  // the wayfinding poles: slender, white, a dark board near the head
  for (const [x, z] of [[-60, 22], [-60, -24], [-36, 30], [-30, -52], [2, 14], [10, -30], [28, 4], [30, -20]]) {
    const y = Math.max(ground(x, z), 0) - 0.1
    strut(out, [x, y, z], [x, y + 4.6, z], 0.13, 0.13, WHITE, FIXED, false)
    box(out, x, y + 3.9, z, 0.42, 0.62, 0.05, hex('#23272b'), FIXED)
    box(out, x, y + 4.6, z, 0.46, 0.05, 0.08, WHITE, FIXED)
  }
  // the pale box with the mall's name, at the narrow end, off the footway (173314679) that runs out along the axis
  const pale = hex('#d9d8cf')
  block(out, 44, 52, -4, 3.5, -1, 5.4, pale)
  rectOn(out, '-x', 44, -4, 3.5, 5.1, 5.25, shade(pale, 0.8), 0.03)
  lettersOn(out, '-x', 44, -0.25, 2.9, 'FORUM', { h: 0.85, c: hex('#26282a'), wide: 0.66, th: 0.13 })
  lettersOn(out, '-x', 44, -0.25, 1.7, 'DES HALLES', { h: 0.62, c: hex('#26282a'), wide: 0.66, th: 0.1 })
}

/** One escalator from its head to its foot: the steel truss, the dark treads, glass sides and two black handrails. */
function escalator(out: MeshBuilder, top: [number, number, number], bot: [number, number, number]): void {
  const dx = bot[0] - top[0]
  const dz = bot[2] - top[2]
  const L = Math.hypot(dx, dz) || 1
  const sx = -(dz / L) * 0.55
  const sz = (dx / L) * 0.55
  const steel = hex('#aeb1ae')
  const up = (p: [number, number, number], a: number, y: number): [number, number, number] => [p[0] + sx * a, p[1] + y, p[2] + sz * a]
  // the truss under it
  strut(out, up(top, 0, -0.25), up(bot, 0, -0.25), 1.2, 0.5, steel, FIXED, false)
  // the treads
  out.quad([up(top, -1, 0.02), up(top, 1, 0.02), up(bot, 1, 0.02), up(bot, -1, 0.02)], [0, 1, 0], UV, hex('#3b3d3e'), FIXED)
  for (const s of [-1, 1]) {
    // the glass side, both ways, and its handrail
    const n: [number, number, number] = [(sx / 0.55) * s, 0, (sz / 0.55) * s]
    const q: [number, number, number][] = [up(top, s, 0), up(bot, s, 0), up(bot, s, 0.95), up(top, s, 0.95)]
    out.quad(q, n, UV, hex('#a9bdb6'), FIXED)
    out.quad(q, [-n[0], 0, -n[2]], UV, hex('#93a8a1'), FIXED)
    strut(out, up(top, s, 1), up(bot, s, 1), 0.09, 0.09, hex('#1c1d1e'), FIXED, false)
  }
}
