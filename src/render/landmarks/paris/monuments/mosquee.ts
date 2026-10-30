import type { MeshBuilder } from '../../../buildings.ts'
import { box, prism, type Rgb } from '../../../models.ts'
import { block, hex, roof, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { archOn } from '../palaces/common.ts'
import { boxAlong, edgeAt } from '../../parts.ts'
import { archesOn, band, ccw, domeOf, FIXED, graded, type P2, quarter, ring, walls } from './common.ts'

/*
 * THE GRANDE MOSQUÉE DE PARIS (Maurice Tranchant de Lunel, Charles Heubès, Robert Fournez, 1922–26), on the Place du
 * Puits-de-l'Ermite by the Jardin des Plantes, in the Hispano-Moorish manner of Fez: what the street sees is a
 * long WHITE WALL coped with GREEN TILES, low white ranges under green-tiled hipped roofs, the gate pavilion, the
 * prayer hall with the green PYRAMID over its square drum (OSM's part 320013175 — 5 levels and a 2-level pyramidal
 * roof, `roof:colour` green), the patio with its arcades, fountain dome and corner kiosks — and at the west corner
 * the square MINARET, 33 m (OSM's 437776176 to 27, its lantern and green pyramid 437776174/5 to 33), white with its
 * panels of lattice relief, a crenellated gallery and a jamur of gilt balls.
 *
 * In the city the complex came out as a Haussmann-styled 4 m slab (relation 569853) with mansarded blocks on it and
 * the prayer hall's pyramid as a 28 m tower; the model replaces the relation and the parts in it. Frame: OSM's
 * relation box at bearing 54.8 (−z toward 234.8), design metres off the bake's rings (2026-10-29).
 */
const HX = 63.95
const HZ = 52.25

const WHITE: Rgb = hex('#efece4')
const TILE: Rgb = hex('#2f7a5c')
const GOLD: Rgb = [0.86, 0.68, 0.27]
const DARK: Rgb = [0.16, 0.16, 0.16]

/** The complex's outer wall, simplified from the relation's (1.2 m). */
const ENCLOSURE: P2[] = ring([
  -60.0, -2.9, -48.8, -8.8, -48.1, -7.3, -39.6, -10.9, -40.2, -12.4, -37.0, -14.9, -23.3, -21.0, -20.2, -12.4, -16.9, -13.8,
  -14.9, -11.6, -13.5, -5.4, 11.7, -15.9, 13.2, -12.3, 18.1, -16.0, 20.2, -15.2, 25.0, -27.3, 25.3, -44.8, 40.3, -52.2,
  45.1, -50.4, 64.0, -0.1, 56.6, 2.9, 55.2, 6.4, 58.4, 13.6, 48.7, 17.5, 42.3, 7.6, 36.1, 4.5, 21.6, 7.1, -3.7, 17.7,
  -0.3, 22.9, -0.1, 26.2, -3.3, 27.6, 0.4, 35.9, -14.3, 41.6, -16.8, 34.8, -31.1, 40.7, -28.6, 47.1, -39.9, 52.2, -64.0, -1.2,
])
/** The institute's long range along the garden (437793032) and the hall beside it (437777020). */
const INSTITUTE: P2[] = ring([-63.8, -1.1, -48.9, -8.6, -48.2, -7.2, -39.5, -10.9, -36.7, -13.8, -34.9, -9.7, -50.6, -3.1,
  -50.0, 2.8, -56.7, 5.6, -42.7, 40.9, -35.7, 38.0, -31.9, 39.0, -28.8, 47.1, -39.8, 52.1])
const HALL2: P2[] = ring([-53.4, 13.4, -47.5, 11.0, -39.9, 30.6, -45.7, 32.9])
/** The prayer hall (437771430), the entrance range on the street (437773724), the gate pavilion (437773727). */
const PRAYER: P2[] = ring([18.6, -11.8, 24.0, -24.3, 44.1, -15.7, 36.0, 4.3, 23.9, -0.4, 18.3, 1.7, 13.6, -9.8])
const ENTRANCE: P2[] = ring([37.1, -33.5, 29.6, -34.6, 25.4, -44.8, 32.7, -48.4, 36.9, -39.4, 47.5, -43.6, 54.4, -25.2,
  52.3, -24.5, 54.6, -18.2, 52.3, -17.3, 51.1, -20.2, 47.6, -18.9, 44.4, -20.1, 38.6, -34.1])
const GATE: P2[] = ring([32.95, -52.15, 47.45, -52.15, 47.45, -42.45, 32.95, -42.45])

export function grandeMosquee(out: MeshBuilder, fit: Fit): void {
  graded(out, fit, HX, HZ, (q) => mosquee(q))
}

/** A white range from 0 to `h` on its plan, under a hipped skirt of green tile and a flat roof inside it. */
function range(out: MeshBuilder, plan: P2[], h: number, skirt = 1.6): void {
  walls(out, plan, 0, h, WHITE, shade(WHITE, 0.92))
  band(out, plan, h - 0.5, 0.5, 0.25, shade(TILE, 0.9))
  // the tiled skirt: one sloping strip per edge, out over the wall and up toward the middle
  const r = ccw(plan)
  for (let i = 0; i < r.length; i++) {
    const e = edgeAt(r, i)
    if (e.L < 0.5) continue
    const o = 0.5
    const a: [number, number, number] = [e.a.x + e.nx * o - e.tx * o, h, e.a.z + e.nz * o - e.tz * o]
    const b: [number, number, number] = [e.b.x + e.nx * o + e.tx * o, h, e.b.z + e.nz * o + e.tz * o]
    const c: [number, number, number] = [e.b.x - e.nx * skirt + e.tx * 0.2, h + skirt * 0.7, e.b.z - e.nz * skirt + e.tz * 0.2]
    const d: [number, number, number] = [e.a.x - e.nx * skirt - e.tx * 0.2, h + skirt * 0.7, e.a.z - e.nz * skirt - e.tz * 0.2]
    out.quad([a, b, c, d], [e.nx, 0.8, e.nz], [[0, 0], [1, 0], [1, 1], [0, 1]], TILE, FIXED)
  }
}

function mosquee(out: MeshBuilder): void {
  // the enclosure: a white wall 5.5 m high coped with green tile, all the way round
  const er = ccw(ENCLOSURE)
  for (let i = 0; i < er.length; i++) {
    const e = edgeAt(er, i)
    if (e.L < 0.3) continue
    boxAlong(out, e.mid.x - e.nx * 0.3, 2.75, e.mid.z - e.nz * 0.3, e.L / 2 + 0.3, 2.75, 0.3, e.heading, WHITE)
    boxAlong(out, e.mid.x - e.nx * 0.3, 5.65, e.mid.z - e.nz * 0.3, e.L / 2 + 0.45, 0.15, 0.55, e.heading, TILE)
  }
  // the ranges inside it
  range(out, INSTITUTE, 9.5)
  archesOn(out, INSTITUTE, 3.5, 1.3, 2.6, 4.0, DARK, 6)
  range(out, HALL2, 8.0, 2.2)
  range(out, ENTRANCE, 8.0)
  archesOn(out, ENTRANCE, 4.0, 1.0, 2.0, 4.5, DARK, 5)
  range(out, GATE, 9.0, 2.6)
  roof(out, 33.4, 47.0, -51.7, -42.9, 9.0, 3.0, 4.0, 4.0, TILE)
  archOn(out, '-z', -52.15, 40.2, 0.2, 2.6, 4.6, DARK)

  // the prayer hall: its white walls, the tiled skirt, and the PAVILION over it — a square drum, a band of arcading,
  // the green pyramid and the jamur
  range(out, PRAYER, 10.0)
  archesOn(out, PRAYER, 5.0, 0.9, 2.0, 3.2, DARK, 4)
  const px = 30.55
  const pz = -8.65
  block(out, px - 4.65, px + 4.65, pz - 4.65, pz + 4.65, 10, 15.2, WHITE)
  for (const f of ['-z', '+z', '-x', '+x'] as const) {
    const plane = f === '-z' ? pz - 4.65 : f === '+z' ? pz + 4.65 : f === '-x' ? px - 4.65 : px + 4.65
    const t = f === '-z' || f === '+z' ? px : pz
    for (const d of [-2.4, -0.8, 0.8, 2.4]) archOn(out, f, plane, t + d, 12.2, 0.7, 1.7, DARK)
  }
  block(out, px - 5.1, px + 5.1, pz - 5.1, pz + 5.1, 15.2, 15.7, shade(TILE, 0.85))
  roof(out, px - 5.2, px + 5.2, pz - 5.2, pz + 5.2, 15.7, 5.6, 5.2, 5.2, TILE)
  for (const [y, r] of [[21.6, 0.32], [22.3, 0.26], [22.9, 0.2]] as const) prism(out, px, pz, y - 0.25, y + 0.25, r, 8, GOLD, FIXED)
  box(out, px, 21.4, pz, 0.05, 0.6, 0.05, GOLD, FIXED)

  // the patio (437773723's court): arcades round it under tiled skirts, a corner kiosk at each corner under its green
  // pyramid, the fountain's white dome in the middle
  const c0x = 48.1
  const c1x = 62.4
  const c0z = -18.7
  const c1z = -0.1
  for (const [ax, az, bx, bz] of [[c0x, c0z, c1x, c0z], [c1x, c0z, c1x, c1z], [c1x, c1z, c0x, c1z], [c0x, c1z, c0x, c0z]]) {
    const L = Math.hypot(bx - ax, bz - az)
    const hd = Math.atan2(bx - ax, bz - az) + Math.PI / 2
    boxAlong(out, (ax + bx) / 2, 3.5, (az + bz) / 2, L / 2, 3.5, 1.2, hd, WHITE)
    boxAlong(out, (ax + bx) / 2, 7.2, (az + bz) / 2, L / 2 + 0.6, 0.2, 1.9, hd, TILE)
  }
  for (let x = c0x + 2; x < c1x - 1; x += 2.4) {
    archOn(out, '-z', c0z - 1.2, x, 0, 1.6, 4.5, DARK)
    archOn(out, '+z', c1z + 1.2, x, 0, 1.6, 4.5, DARK)
  }
  for (const [x, z] of [[c0x + 1.3, c0z + 1.3], [c1x - 1.3, c0z + 1.3], [c0x + 1.3, c1z - 1.3], [c1x - 1.3, c1z - 1.3]]) {
    block(out, x - 1.9, x + 1.9, z - 1.9, z + 1.9, 0, 10.5, WHITE)
    roof(out, x - 2.2, x + 2.2, z - 2.2, z + 2.2, 10.5, 2.6, 2.2, 2.2, TILE)
  }
  prism(out, 54.85, -8.65, 0, 2.8, 3.0, 12, WHITE, FIXED)
  domeOf(out, 54.85, -8.65, 2.8, 3.0, 2.6, WHITE, quarter, { sides: 16, steps: 5 })
  // the hammam's white dome on its drum (437774297)
  prism(out, 46.95, -27.95, 8, 14.5, 2.5, 12, WHITE, FIXED)
  domeOf(out, 46.95, -27.95, 14.5, 2.5, 2.4, WHITE, quarter, { sides: 14, steps: 5 })

  // THE MINARET: a white square shaft to 26.5 with its panels of lattice relief and green bands, the crenellated
  // gallery, the lantern, the green pyramid and the gilt jamur at 34
  const mx = -33.2
  const mz = -13.45
  const w = 3.35
  block(out, mx - w, mx + w, mz - w, mz + w, 0, 25.6, WHITE)
  for (const f of ['-z', '+z', '-x', '+x'] as const) {
    const plane = f === '-z' ? mz - w : f === '+z' ? mz + w : f === '-x' ? mx - w : mx + w
    const t = f === '-z' || f === '+z' ? mx : mz
    // the lattice panel over the upper shaft: a darker field in a frame, a little proud
    const P = (u: number, y: number, d: number): [number, number, number] =>
      f === '-z' ? [t + u, y, plane - d] : f === '+z' ? [t - u, y, plane + d] : f === '-x' ? [plane - d, y, t - u] : [plane + d, y, t + u]
    const n: [number, number, number] = f === '-z' ? [0, 0, -1] : f === '+z' ? [0, 0, 1] : f === '-x' ? [-1, 0, 0] : [1, 0, 0]
    out.quad([P(-2.5, 15.0, 0.06), P(2.5, 15.0, 0.06), P(2.5, 23.5, 0.06), P(-2.5, 23.5, 0.06)], n, [[0, 0], [1, 0], [1, 1], [0, 1]], hex('#c9c3b3'), FIXED)
    for (let k = -2; k <= 2; k++) out.quad([P(k - 0.06, 15.0, 0.09), P(k + 0.06, 15.0, 0.09), P(k + 0.06, 23.5, 0.09), P(k - 0.06, 23.5, 0.09)], n, [[0, 0], [1, 0], [1, 1], [0, 1]], WHITE, FIXED)
    for (const y of [14.4, 24.0]) out.quad([P(-3.0, y, 0.07), P(3.0, y, 0.07), P(3.0, y + 0.45, 0.07), P(-3.0, y + 0.45, 0.07)], n, [[0, 0], [1, 0], [1, 1], [0, 1]], TILE, FIXED)
    archOn(out, f, plane, t, 9.0, 0.9, 2.2, DARK)
    archOn(out, f, plane, t, 0.2, 1.6, 3.2, DARK)
  }
  // the gallery: a projecting cornice, crenellations all round
  block(out, mx - w - 0.35, mx + w + 0.35, mz - w - 0.35, mz + w + 0.35, 25.6, 26.4, WHITE)
  for (let i = 0; i < 6; i++) {
    const u = -w + (i + 0.5) * (2 * w) / 6
    for (const [x, z] of [[mx + u, mz - w - 0.2], [mx + u, mz + w + 0.2], [mx - w - 0.2, mz + u], [mx + w + 0.2, mz + u]]) {
      box(out, x, 27.0, z, 0.32, 0.6, 0.32, WHITE, FIXED)
      box(out, x, 27.8, z, 0.22, 0.22, 0.22, TILE, FIXED)
    }
  }
  // the lantern, its arches, its green pyramid, the jamur
  block(out, mx - 1.9, mx + 1.9, mz - 1.9, mz + 1.9, 26.4, 31.0, WHITE)
  for (const f of ['-z', '+z', '-x', '+x'] as const) {
    const plane = f === '-z' ? mz - 1.9 : f === '+z' ? mz + 1.9 : f === '-x' ? mx - 1.9 : mx + 1.9
    archOn(out, f, plane, f === '-z' || f === '+z' ? mx : mz, 27.6, 1.0, 2.2, DARK)
  }
  block(out, mx - 2.2, mx + 2.2, mz - 2.2, mz + 2.2, 31.0, 31.4, TILE)
  roof(out, mx - 2.2, mx + 2.2, mz - 2.2, mz + 2.2, 31.4, 2.2, 2.2, 2.2, TILE)
  box(out, mx, 34.0, mz, 0.05, 0.6, 0.05, GOLD, FIXED)
  for (const [y, r] of [[33.9, 0.26], [34.5, 0.21], [35.0, 0.16]] as const) prism(out, mx, mz, y - 0.2, y + 0.2, r, 8, GOLD, FIXED)
}
