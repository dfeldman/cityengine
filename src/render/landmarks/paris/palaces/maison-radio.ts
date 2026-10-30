import type { MeshBuilder } from '../../../buildings.ts'
import type { Rgb } from '../../../models.ts'
import { hex, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { fitted, pts, rectOn, slab } from './common.ts'
import { lettersOn } from './showfront.ts'

const FIXED = 0
/** the design footprint: OSM relation 1255782's box turned so the tower's walls are square to it (local −z faces bearing 132.65, the Seine) */
const HX = 76.35
const HZ = 80.75
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

const PALE = hex('#d2d4d2')
const PANEL = hex('#bfc1bf')
const RIBBON = hex('#3c4750')
const DARK = hex('#2a2d33')

/** The building's parts as OSM draws them (osmium, 2026-10-30), in the model's frame. */
const DOME = pts([8.8, -30.5, 7.2, -34.1, 7.8, -48.0, 11.0, -59.5, 16.1, -65.3, 20.0, -66.1, 31.8, -62.1, 41.0, -57.1, 46.6, -52.1, 47.4, -47.6, 43.5, -38.9, 28.9, -23.5, 25.2, -22.9, 16.6, -25.2])
const TOWERMID = pts([-7.5, 45.7, -7.6, 13.6, 6.1, 13.5, 6.1, 45.7])
const BRIDGE = [
  pts([-54.2, 33.7, -55.3, 31.3, -23.3, 16.2, -22.2, 18.6]),
  pts([-48.4, -26.7, -46.8, -28.8, -18.6, -7.8, -20.1, -5.7]),
  pts([21.1, 19.0, 22.4, 16.5, 55.4, 32.7, 54.1, 35.2]),
  pts([20.5, -5.6, 18.8, -7.9, 48.6, -29.6, 50.0, -27.1]),
]
const INNER = pts([-10.0, 13.9, -12.5, 9.4, -13.0, 4.5, -8.8, -3.2, -0.9, -6.1, 3.5, -5.2, 7.9, -2.0, 10.1, 1.6, 10.9, 7.3, 7.2, 14.5, 7.2, 12.6, -8.4, 12.6, -8.4, 14.7])
const TOWER = pts([-8.4, 46.9, -8.4, 12.6, 7.2, 12.6, 7.2, 46.9])
const TOWERTOP = pts([-8.4, 46.9, -8.4, 12.6, 7.2, 12.6, 7.2, 46.9])
const PYLON = [
  pts([-76.3, -37.3, -70.5, -46.0, -62.3, -40.2, -63.6, -38.5, -58.2, -34.9, -61.1, -30.7, -66.7, -34.4, -68.2, -32.3]),
  pts([61.6, -29.3, 58.7, -33.6, 64.2, -37.4, 62.6, -39.9, 70.3, -45.7, 76.3, -36.7, 68.1, -31.0, 66.9, -33.1]),
]
const CORE = pts([-17.8, 24.2, -23.3, 16.2, -24.6, 7.7, -22.9, -0.7, -16.7, -10.0, -9.9, -14.9, -1.7, -17.0, 6.7, -16.1, 16.0, -11.0, 22.1, -2.5, 24.2, 8.0, 22.4, 16.5, 16.5, 24.8, 9.1, 29.5, 7.2, 26.1, 7.2, 14.5, 10.5, 9.0, 10.7, 3.5, 6.1, -3.7, -0.9, -6.1, -8.8, -3.2, -12.4, 2.2, -12.5, 9.4, -8.4, 14.7, -8.4, 25.5, -10.3, 28.9])
const COURT = [
  pts([-38.1, 55.6, -51.0, 40.0, -56.5, 28.2, -59.2, 16.4, -59.5, 5.2, -57.7, -7.1, -52.9, -19.7, -48.4, -26.7, -28.9, -12.3, -32.8, -5.3, -35.2, 3.3, -35.1, 14.1, -32.3, 23.4, -22.2, 34.8, -8.4, 40.8, -8.7, 68.2, -26.6, 62.7]),
  pts([6.7, 68.3, 7.2, 41.4, 17.3, 37.8, 24.1, 32.8, 29.6, 26.4, 33.5, 17.7, 35.1, 9.4, 34.6, 0.9, 29.3, -12.1, 50.0, -27.1, 56.5, -14.4, 60.8, 5.7, 60.0, 18.4, 56.6, 30.0, 50.4, 41.8, 36.2, 56.2, 25.1, 62.9]),
]
const OUTER = pts([-49.3, 61.6, -56.2, 54.4, -64.6, 42.1, -68.8, 33.0, -72.6, 18.5, -73.5, 3.6, -72.4, -6.3, -68.2, -20.7, -63.8, -29.6, -68.2, -32.3, -66.7, -34.4, -61.1, -30.7, -58.2, -34.9, -63.6, -38.5, -62.3, -40.2, -46.8, -28.8, -55.9, -12.8, -59.5, 5.2, -58.0, 22.6, -51.0, 40.0, -43.3, 50.6, -33.2, 59.3, -15.5, 66.7, 1.2, 68.7, 12.9, 67.2, 30.9, 59.8, 45.7, 47.4, 52.6, 38.1, 58.1, 25.9, 61.0, 11.7, 60.8, 5.7, 56.5, -14.4, 48.6, -29.6, 62.6, -39.9, 64.2, -37.4, 58.7, -33.6, 61.6, -29.3, 66.9, -33.1, 68.1, -31.0, 64.4, -28.3, 72.1, -7.6, 73.5, 2.3, 73.0, 17.3, 71.0, 27.0, 65.5, 40.9, 57.4, 53.4, 50.6, 60.7, 38.8, 69.8, 25.3, 76.3, 10.9, 80.0, -0.7, 80.8, -14.0, 79.3, -28.3, 75.0, -37.2, 70.5])
const SPOKE = pts([-4.6, -27.6, -3.5, -62.0, 7.4, -61.9, 6.7, -27.2])
const RIVER = pts([-70.5, -46.0, -57.2, -60.1, -38.1, -72.4, -16.3, -79.5, 4.0, -80.8, 23.3, -77.7, 39.3, -71.5, 58.3, -58.7, 70.3, -45.7, 61.0, -38.7, 54.0, -46.6, 24.9, -17.5, 17.3, -23.3, 6.7, -27.2, 7.4, -61.9, -3.5, -62.0, -4.6, -27.6, -15.5, -24.2, -24.6, -17.5, -53.9, -47.2, -60.8, -39.2])
const S104 = pts([-24.6, -17.5, -53.9, -47.2, -47.0, -53.3, -30.8, -62.6, -16.4, -67.7, -3.9, -69.7, -4.6, -27.6, -15.5, -24.2])
const AUD = pts([6.7, -27.2, 7.9, -70.0, 16.1, -68.6, 34.2, -61.7, 44.4, -55.5, 54.0, -46.6, 24.9, -17.5, 17.3, -23.3])
const BAR = pts([-15.1, -70.3, -16.3, -79.5, 4.0, -80.8, 21.0, -78.3, 19.0, -69.2, 7.9, -71.3, 7.4, -61.9, -3.5, -62.0, -4.0, -71.9])

type P2 = { x: number; z: number }

/**
 * La Maison de la Radio (Henry Bernard, 1963; Architecture-Studio's restructuring, 2017), Quai Kennedy, the great round
 * house by the Seine and the Pont de Grenelle: a drum 160 m across, pale aluminium and concrete, and rising out of its
 * middle the one square tower. What a rider going along the quai sees is:
 *
 * - the OUTER RING, bending away both ways: its ribbon windows, nine floors of them on the far side, six on the river
 *   side under the dark band with the sign, the two dark stair pylons standing up out of the ring at the corners;
 * - the TOWER, 68 m, pale, square-cut against the sky, its floors in ribbons and thin fins, the open storey under its top;
 * - from the Avenue du Président Kennedy between the pylons, the low studios in the courts behind.
 *
 * All of it is OSM's own 3D (relation 1255782 and its fifteen building:part relations and ways): plans and heights are
 * theirs. The windows' rhythm and the colours are from photographs from the Eiffel Tower and the Pont de Grenelle. The
 * sign's letters are upper case here for the stroke alphabet; the real one is lower case.
 */
export function maisonRadio(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

function draw(out: MeshBuilder): void {
  // ---- the ring and its river half
  volume(out, OUTER, 0, 31, { c: PALE, floors: 9, base: 3.6, band: true })
  volume(out, RIVER, 0, 20, { c: PALE, floors: 5, base: 3.6, band: true })
  volume(out, BAR, 20, 23, { c: DARK })
  // the two dark pylons
  for (const r of PYLON) volume(out, r, 0, 34, { c: DARK, floors: 9, base: 3.6, ribbon: shade(DARK, 1.5) })
  // ---- the courts: the low studios, the auditorium's dome, the bridges to the core
  for (const r of COURT) volume(out, r, 0, 10, { c: PANEL, floors: 2, base: 3 })
  volume(out, AUD, 0, 15, { c: PANEL })
  volume(out, S104, 0, 15, { c: PANEL })
  volume(out, SPOKE, 0, 15, { c: PALE, floors: 3, base: 3 })
  slab(out, DOME, 15, 15.6, shade(PANEL, 1.04))
  slabInset(out, DOME, 15.6, 17, shade(PANEL, 1.08))
  for (const r of BRIDGE) volume(out, r, 15, 18, { c: PANEL })
  // ---- the core and the tower
  volume(out, CORE, 0, 24, { c: PALE, floors: 6, base: 3.6 })
  volume(out, INNER, 0, 24, { c: PANEL })
  tower(out)
  sign(out)
}

/**
 * A plan up from y0 to y1: its walls, its ribbon of window to each floor, a pale band at its head, the roof over it.
 * Walls under 2.4 m long take no ribbon: those are the plan's returns.
 */
function volume(out: MeshBuilder, ring: P2[], y0: number, y1: number, o: { c: Rgb; floors?: number; base?: number; band?: boolean; ribbon?: Rgb }): void {
  let area = 0
  const n = ring.length
  for (let i = 0; i < n; i++) area += ring[i].x * ring[(i + 1) % n].z - ring[(i + 1) % n].x * ring[i].z
  const s = area > 0 ? 1 : -1
  for (let i = 0; i < n; i++) {
    const a = ring[i]
    const b = ring[(i + 1) % n]
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    if (L < 0.01) continue
    const tx = (b.x - a.x) / L
    const tz = (b.z - a.z) / L
    const nx = tz * s
    const nz = -tx * s
    const N: [number, number, number] = [nx, 0, nz]
    out.quad([[a.x, y0, a.z], [b.x, y0, b.z], [b.x, y1, b.z], [a.x, y1, a.z]], N, UV, o.c, FIXED)
    if (!o.floors || L < 2.4) continue
    const base = o.base ?? 0
    const fh = (y1 - y0 - base - (o.band ? 0.8 : 0.4)) / o.floors
    const D = 0.07
    const Q = (u0: number, u1: number, y2: number, y3: number, c: Rgb, d = D): void => {
      const A = (u: number, y: number): [number, number, number] => [a.x + tx * u + nx * d, y, a.z + tz * u + nz * d]
      out.quad([A(u0, y2), A(u1, y2), A(u1, y3), A(u0, y3)], N, UV, c, FIXED)
    }
    // the storey at the street: glass to the floor, darker
    if (base > 0 && y0 === 0) Q(0, L, 0.3, base - 0.3, shade(o.ribbon ?? RIBBON, 0.85))
    for (let f = 0; f < o.floors; f++) {
      const y = y0 + base + f * fh
      Q(0.1, L - 0.1, y + fh * 0.36, y + fh * 0.88, o.ribbon ?? RIBBON)
    }
    // the mullions up the ribbons, every few metres on the long walls
    if (L > 5) {
      const m = Math.round(L / 3.4)
      for (let k = 0; k <= m; k++) {
        const u = (L * k) / m
        Q(Math.max(0, u - 0.09), Math.min(L, u + 0.09), y0 + base, y1 - 0.6, PANEL, D + 0.04)
      }
    }
  }
  slab(out, ring, y1 - 0.05, y1, o.c === DARK ? shade(DARK, 1.2) : hex('#9a9c9a'))
  if (o.band) {
    // the white lip of the roof
    for (let i = 0; i < n; i++) {
      const a = ring[i]
      const b = ring[(i + 1) % n]
      const L = Math.hypot(b.x - a.x, b.z - a.z)
      if (L < 2.4) continue
      const tx = (b.x - a.x) / L
      const tz = (b.z - a.z) / L
      const nx = tz * s
      const nz = -tx * s
      const d = 0.16
      out.quad([[a.x + nx * d, y1 - 0.7, a.z + nz * d], [b.x + nx * d, y1 - 0.7, b.z + nz * d], [b.x + nx * d, y1, b.z + nz * d], [a.x + nx * d, y1, a.z + nz * d]],
        [nx, 0, nz], UV, shade(PALE, 1.04), FIXED)
    }
  }
}

/** A slab drawn a little in from its plan: the auditorium's dome, its rise under the roof's lip. */
function slabInset(out: MeshBuilder, ring: P2[], y0: number, y1: number, c: Rgb): void {
  const cx = ring.reduce((t, p) => t + p.x, 0) / ring.length
  const cz = ring.reduce((t, p) => t + p.z, 0) / ring.length
  slab(out, ring.map((p) => ({ x: cx + (p.x - cx) * 0.78, z: cz + (p.z - cz) * 0.78 })), y0, y1, c)
}

/** The tower: pale, ribboned, finned, its open storey at 62–65 m and its flat hat over that. */
function tower(out: MeshBuilder): void {
  const x0 = -8.4
  const x1 = 7.2
  const z0 = 12.6
  const z1 = 46.9
  volume(out, TOWER, 24, 62, { c: PALE, floors: 12, ribbon: hex('#4a5660') })
  // the fins, thin and close, up the long walls
  for (let z = z0 + 1.2; z < z1 - 0.6; z += 2.4) {
    for (const [f, x] of [['-x', x0], ['+x', x1]] as const) rectOn(out, f, x, z - 0.08, z + 0.08, 24, 62, shade(PALE, 1.03), 0.1)
  }
  for (let x = x0 + 1.2; x < x1 - 0.6; x += 2.4) {
    for (const [f, z] of [['-z', z0], ['+z', z1]] as const) rectOn(out, f, z, x - 0.08, x + 0.08, 24, 62, shade(PALE, 1.03), 0.1)
  }
  // the open storey, dark, and the hat
  volume(out, TOWERMID, 62, 65, { c: DARK })
  volume(out, TOWERTOP, 65, 68, { c: PALE })
}

/** The dark band's sign, to the river, and the great lit panel on the river-side pylon. */
function sign(out: MeshBuilder): void {
  // the band's river wall runs from (−9, −81) to (11, −80) or so: the sign stands just proud of its middle
  const white: Rgb = [0.95, 0.95, 0.93]
  const y = 20.75
  lettersOn(out, '-z', -81.1, 2, y, 'RADIOFRANCE', { h: 1.5, c: white, wide: 0.62, th: 0.24, d: 0, gap: 0.2 })
  // the poster on the pylon, on its wall toward the Pont de Grenelle: bright against the dark
  const A = (u: number, y: number, d: number): [number, number, number] => [63.2 + 0.8 * u - 0.6 * d, y, -40.4 - 0.6 * u - 0.8 * d]
  out.quad([A(0, 12, 0.1), A(8, 12, 0.1), A(8, 31, 0.1), A(0, 31, 0.1)], [-0.6, 0, -0.8], UV, hex('#a82c38'), FIXED)
  out.quad([A(1, 15, 0.14), A(7, 15, 0.14), A(7, 25, 0.14), A(1, 25, 0.14)], [-0.6, 0, -0.8], UV, hex('#e7e2d3'), FIXED)
}
