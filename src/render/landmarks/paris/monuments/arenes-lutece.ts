import { MeshBuilder, capPolygonWithHoles } from '../../../buildings.ts'
import { box, type Rgb } from '../../../models.ts'
import { beam, hex, shade } from '../../kit.ts'
import { railing } from '../../parts.ts'
import { archAlong, ccw, FIXED, ring, UV, type P2, walls } from './common.ts'

/*
 * THE ARÈNES DE LUTÈCE (first century; found in 1869, the rest under a tram depot in 1883, rebuilt by Capitan in 1917), behind
 * the houses between the Rue Monge and the Rue de Navarre: Roman Paris's amphitheatre, and what you see through the
 * trees is a great oval of pale SAND with boys playing football on it, walled by a low ring of rough stone. On the
 * west and north-east the STONE TIERS climb from it in two rebuilt sectors, a railed aisle down each, dark caged doors
 * in the wall under them. Across the sand the arena's wall is lower and railed, and behind it the raised gravel STAGE
 * with the stage wall at its back, its rows of niches cut down to a metre or so. The two passages run out from the ring to
 * the Rue de Navarre and the Rue Monge.
 *
 * The rings are OSM's (the arena's wall and north passage way 406229069, the south passage 406229068, the stage wall
 * 83976056 and 83976105; the tiers from the `Gradins` ways 406229048/9, whose fronts the ellipse follows). The game's ground
 * has no bowl here (a 25 m grid): the floor is at the ground and the tiers rise from it, so a grass bank is drawn behind
 * them down to the ground, where in life the hillside comes up to meet them. Heights are from the photographs. `drape`:
 * the site falls 1.5 m and every vertex follows it, y here is over the ground. Frame: −z the stage, toward bearing 80.
 */
const STONE: Rgb = hex('#9c927a')
const TREAD: Rgb = hex('#ab9f86')
const RISER: Rgb = hex('#7a7260')
const SAND: Rgb = hex('#bda67c')
const GRAVEL: Rgb = hex('#a3967a')
const BANK: Rgb = hex('#5f7f45')
const DARK: Rgb = hex('#1f1f20')
const RAIL: Rgb = hex('#2c3a33')

/** The arena's ellipse, fitted to OSM's inner edges. */
const CX = 0.4
const CZ = 5.9
const A = 27.7
const B = 24.2
const WALL = 1.6
const FLOOR = 0.12

/** The arena's wall on its stage side and the passage to the Rue des Arènes (way 406229069). */
const STAGE_WALL = ring([-23.0, -8.7, -25.4, -10.6, -24.4, -11.8, -23.2, -10.8, -20.9, -12.8, -17.6, -15.2, -14.2, -16.9, -10.1, -18.6, -6.8, -19.5, -3.5, -20.0, 0.6, -20.0, 4.6, -19.6,
  5.4, -22.4, 11.7, -20.6, 11.0, -17.7, 14.2, -16.2, 18.3, -13.5, 22.0, -10.1, 25.0, -6.4, 27.6, -1.9, 29.1, 2.2, 32.6, 1.9, 33.2, 4.9, 33.4, 7.7, 44.4, 10.8, 43.8, 12.4, 28.2, 8.5, 28.0, 7.6, 31.3, 7.1, 30.8, 3.6,
  27.7, 4.2, 26.6, 0.9, 25.2, -2.3, 23.5, -5.1, 21.3, -8.0, 18.6, -10.7, 15.6, -13.1, 12.5, -15.1, 9.1, -16.7, 10.1, -20.1, 6.5, -21.1, 5.7, -17.7, 2.5, -18.2, -1.5, -18.3, -4.8, -18.0, -7.8, -17.4, -11.2, -16.5,
  -14.9, -14.8, -17.8, -13.1, -20.7, -10.9])
/** The south passage's walls to the Rue de Navarre (way 406229068). */
const PASSAGE = ring([-40.8, -0.5, -42.7, -1.0, -42.3, -3.0, -49.1, -4.7, -49.3, -3.8, -50.3, -3.1, -51.6, -3.4, -52.4, -4.4, -52.2, -5.4, -55.6, -6.4, -56.4, -5.2, -57.6, -5.0, -58.8, -5.9, -59.0, -7.3, -62.1, -7.9,
  -61.9, -9.1, -63.5, -9.4, -64.3, -4.3, -62.7, -4.1, -62.5, -5.6, -60.8, -5.3, -59.9, -3.9, -59.0, -3.2, -59.3, -1.4, -58.3, -1.3, -57.4, -4.1, -40.7, 0.1])
/** The stage wall's two lengths with their niches (ways 83976105 and 83976056), simplified. */
const SCENE_A = ring([-7.5, -28.4, -7.0, -29.5, -5.2, -29.9, -4.3, -29.3, -4.1, -27.7, -4.6, -26.7, -3.1, -26.3, -2.9, -27.4, -2.7, -29.2, 0.6, -28.4, -0.2, -25.6, 1.3, -25.3, 1.9, -27.3, 3.8, -27.5, 4.8, -26.3,
  4.3, -25.6, 4.2, -24.5, 5.8, -24.1, 6.0, -27.1, 7.3, -27.8, -12.8, -32.6, -13.0, -31.7, -12.4, -31.6, -13.4, -28.8, -13.2, -27.9, -11.6, -28.4, -11.3, -31.3, -8.0, -30.6, -8.8, -27.7, -7.4, -27.4])
const SCENE_B = ring([27.5, -20.1, 28.4, -22.7, 8.9, -27.4, 8.8, -26.4, 9.5, -26.3, 8.6, -23.4, 10.2, -23.1, 10.5, -25.2, 11.8, -25.6, 13.2, -24.9, 13.4, -23.3, 12.9, -22.5, 14.8, -22.0, 15.0, -24.9, 18.2, -24.2,
  17.3, -21.4, 19.1, -21.1, 19.6, -23.1, 21.0, -23.4, 22.2, -22.6, 22.4, -21.3, 21.7, -20.3, 23.6, -19.9, 23.8, -22.8, 27.1, -22.1, 26.0, -19.3, 26.1, -18.4, 27.1, -18.3, 27.9, -20.0])
/** The raised stage: from the wall's back round OSM's site edge. */
const STAGE: P2[] = ring([-24.4, -11.0, -20.8, -13.4, -17.4, -14.7, -14.0, -16.6, -10.0, -18.2, -6.6, -19.1, -3.4, -19.6, 0.6, -19.6, 5.0, -19.3, 10.8, -17.4, 14.2, -15.8, 18.3, -13.1, 22.0, -9.8, 25.0, -6.1, 27.6, -1.6, 29.1, 2.6,
  32.3, 2.3, 32.9, 7.3, 40.1, 9.6, 40.5, -2.7, 38.7, -10.5, 28.4, -22.7, 8.9, -27.4, 7.3, -27.8, -12.8, -32.6, -29.8, -20.8])

/** A point round the ellipse at angle `t` (0 toward +x, π/2 toward +z), `d` out from its edge. */
const E = (t: number, d: number): P2 => ({ x: CX + (A + d) * Math.cos(t), z: CZ + (B + d) * Math.sin(t) })
const DEG = Math.PI / 180

/** A quad over an arc span, from (t0, d0, y0) across to (t1, d0, y0) and out to (…, d1, y1), lit along `n`. */
function span(out: MeshBuilder, t0: number, t1: number, d0: number, d1: number, y0: number, y1: number, n: [number, number, number], c: Rgb): void {
  const a = E(t0, d0)
  const b = E(t1, d0)
  const p = E(t1, d1)
  const q = E(t0, d1)
  out.quad([[a.x, y0, a.z], [b.x, y0, b.z], [p.x, y1, p.z], [q.x, y1, q.z]], n, UV, c, FIXED)
}

/** The tiers over the angles t0..t1: the wall in front, the steps, the top walk, the grass bank behind, the stepped ends, a railed aisle. */
function tiers(out: MeshBuilder, t0: number, t1: number, steps: number): void {
  const seg = Math.max(6, Math.round((t1 - t0) / (6 * DEG)))
  const dp = 0.82
  const rise = 0.36
  const top = WALL + steps * rise
  const front = 0.9
  for (let i = 0; i < seg; i++) {
    const a0 = t0 + ((t1 - t0) * i) / seg
    const a1 = t0 + ((t1 - t0) * (i + 1)) / seg
    const am = (a0 + a1) / 2
    const inx = -Math.cos(am)
    const inz = -Math.sin(am)
    // the wall, its coping, and the walk behind the top tier
    span(out, a0, a1, 0, 0, 0, WALL, [inx, 0, inz], STONE)
    span(out, a0, a1, 0, front, WALL, WALL, [0, 1, 0], shade(TREAD, 1.06))
    for (let k = 0; k < steps; k++) {
      const d = front + k * dp
      const y = WALL + k * rise
      span(out, a0, a1, d, d, y, y + rise, [inx, 0, inz], RISER)
      span(out, a0, a1, d, d + dp, y + rise, y + rise, [0, 1, 0], k % 2 ? TREAD : shade(TREAD, 0.94))
    }
    const d1 = front + steps * dp
    span(out, a0, a1, d1, d1 + 2.2, top, top, [0, 1, 0], GRAVEL)
    span(out, a0, a1, d1 + 2.2, d1 + 2.2 + top * 2, top, 0, [-inx * 0.5, 0.85, -inz * 0.5], BANK)
  }
  // the stepped ends of the sector
  for (const [t, s] of [[t0, -1], [t1, 1]] as const) {
    const nx = -Math.sin(t) * s
    const nz = Math.cos(t) * s
    for (let k = 0; k <= steps; k++) {
      const d = k === 0 ? 0 : front + (k - 1) * dp
      const d2 = k === 0 ? front : front + k * dp
      const y = k === 0 ? WALL : WALL + k * rise
      span(out, t, t, d, d2, 0, 0, [nx, 0, nz], STONE)
      const a = E(t, d)
      const b = E(t, d2)
      out.quad([[a.x, 0, a.z], [b.x, 0, b.z], [b.x, y, b.z], [a.x, y, a.z]], [nx, 0, nz], UV, STONE, FIXED)
    }
    const d = front + steps * dp
    const a = E(t, d)
    const b = E(t, d + 2.2)
    const c = E(t, d + 2.2 + top * 2)
    out.quad([[a.x, 0, a.z], [b.x, 0, b.z], [b.x, top, b.z], [a.x, top, a.z]], [nx, 0, nz], UV, STONE, FIXED)
    out.quad([[b.x, 0, b.z], [c.x, 0, c.z], [b.x, top, b.z], [b.x, top, b.z]], [nx, 0, nz], UV, BANK, FIXED)
  }
  // the aisle down the middle: a paler flight on the tiers and a rail either side
  const m = (t0 + t1) / 2
  const w = 0.75 / ((A + B) / 2)
  for (let k = 0; k < steps; k++) {
    const d = front + k * dp
    const y = WALL + k * rise
    span(out, m - w, m + w, d, d + dp, y + rise + 0.03, y + rise + 0.03, [0, 1, 0], shade(GRAVEL, 1.04))
  }
  for (const s of [-1, 1]) {
    const a = E(m + s * w, front)
    const b = E(m + s * w, front + steps * dp)
    beam(out, [a.x, WALL + 0.95, a.z], [b.x, top + 0.95, b.z], 0.035, RAIL)
    for (let k = 0; k <= 4; k++) {
      const p = E(m + s * w, front + (steps * dp * k) / 4)
      const y = WALL + (steps * rise * k) / 4
      beam(out, [p.x, y, p.z], [p.x, y + 0.95, p.z], 0.03, RAIL)
    }
  }
}

/** A dark caged door in the arena's wall at angle `t`. */
function door(out: MeshBuilder, t: number): void {
  const p = E(t, -0.04)
  const nx = -Math.cos(t)
  const nz = -Math.sin(t)
  archAlong(out, p.x, p.z, nz, -nx, nx, nz, FLOOR, 1.35, 1.3, DARK)
}

export function arenesLutece(out: MeshBuilder): void {
  // the sand, out under the walls
  const floor: P2[] = []
  for (let i = 0; i < 40; i++) floor.push(E((i / 40) * Math.PI * 2, 0.5))
  capPolygonWithHoles(out, [ccw(floor)], FLOOR, SAND, FIXED)

  // the wall of the stage side with its passage, the raised gravel stage behind it, the stage wall at its back
  walls(out, STAGE, 0, 1.05, shade(STONE, 0.92), GRAVEL)
  walls(out, STAGE_WALL, 0, WALL, STONE, shade(TREAD, 1.06))
  walls(out, PASSAGE, 0, 1.5, STONE, shade(TREAD, 1.06))
  walls(out, SCENE_A, 1.05, 2.25, shade(STONE, 0.96), shade(TREAD, 1.02))
  walls(out, SCENE_B, 1.05, 2.25, shade(STONE, 0.96), shade(TREAD, 1.02))
  railing(out, ring([-21.6, -11.0, -14.5, -15.8, -6.6, -18.6, 0.6, -19.1, 4.8, -18.8, 12.0, -16.4, 18.3, -12.6, 24.0, -6.1, 27.8, 0.4]), WALL, { kind: 'posts', height: 1.0, spacing: 2.4, colour: RAIL })

  // THE TIERS, as OSM's Gradins lie: the western sector and the north-eastern
  tiers(out, 106 * DEG, 186 * DEG, 10)
  tiers(out, 20 * DEG, 62 * DEG, 8)
  for (const t of [122, 150, 176, 28, 54]) door(out, t * DEG)

  // the arena's wall on the rest of the ring: the short returns either side of the gates, and the benches along it
  const bench = (t: number): void => {
    const p = E(t, -1.1)
    const a = Math.atan2(-Math.sin(t) * (A / B), Math.cos(t))
    const c = Math.cos(a)
    const s = Math.sin(a)
    beam(out, [p.x - s * 0.95, FLOOR + 0.42, p.z - c * 0.95], [p.x + s * 0.95, FLOOR + 0.42, p.z + c * 0.95], 0.06, RAIL, 0.2)
    box(out, p.x - s * 0.8, FLOOR + 0.2, p.z - c * 0.8, 0.05, 0.2, 0.05, DARK, FIXED)
    box(out, p.x + s * 0.8, FLOOR + 0.2, p.z + c * 0.8, 0.05, 0.2, 0.05, DARK, FIXED)
  }
  for (const t of [112, 134, 164, 34, 46, 250, 275, 305, 330]) bench(t * DEG)
}
