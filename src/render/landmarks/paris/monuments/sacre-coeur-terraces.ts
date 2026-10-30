import { MeshBuilder } from '../../../buildings.ts'
import { box, prism, type Rgb } from '../../../models.ts'
import { beam, block } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { FIXED } from './common.ts'

/**
 * The stonework of the Square Louise-Michel, the terraced garden that climbs the butte from the Place Saint-Pierre to
 * the basilica's parvis (Jean-Camille Formigé, 1880s–1920s). The flights of steps are OSM's and the city's
 * (render/stairs.ts draws every `highway=steps` way: the 59-, 62- and 48-step flights up the middle, the Rue Foyatier
 * down the west side) and the lawns are the park's; what this adds is what neither draws:
 *
 * - the long BALUSTRADE along the parvis's edge, where everyone stands to look over Paris, broken for the central
 *   stairs, and the low wall under it;
 * - the FOUNTAIN at mid-height (OSM way 570241111): its curved grotto wall with the arched niche and the cascade, the
 *   stone kerb round the basin;
 * - the Paris CANDELABRA up both sides of the central flights.
 *
 * Every piece stands on the ground under it (Fit.groundAt), since the square falls ~35 m in 190 m. The frame is the
 * basilica's (local −z faces bearing 175.6, down the butte) moved to the middle of the square: basilica-local (8, −150)
 * is this model's origin, so its parvis edge is at z = +92, the central flights come down it from x −7.4 at the top to
 * −3.7 above the fountain, and the fountain's basin is centred at (−2.3, +18.6) (OSM's ways turned into this frame).
 */
export function sacreCoeurTerraces(out: MeshBuilder, fit: Fit): void {
  // drawn in the frame above, then moved so the entry's box is just the stonework's (OX, OZ is its middle): a box over
  // the whole square took in the reservoir and the houses beside it
  const q = new MeshBuilder()
  draw(q, (x: number, z: number): number => fit.groundAt?.(x - OX, z - OZ) ?? 0)
  const base = out.positions.length / 3
  for (let i = 0; i < q.positions.length; i += 3) out.positions.push(q.positions[i] - OX, q.positions[i + 1], q.positions[i + 2] - OZ)
  for (const v of q.normals) out.normals.push(v)
  for (const u of q.uvs) out.uvs.push(u)
  for (const c of q.colors) out.colors.push(c)
  for (const i of q.indices) out.indices.push(base + i)
}

/** the middle of the stonework in the square's frame: the entry's lat/lon is this point */
const OX = -6.5
const OZ = 52

function draw(out: MeshBuilder, g: (x: number, z: number) => number): void {
  const stone: Rgb = [0.9, 0.88, 0.83]
  const trim: Rgb = [0.95, 0.94, 0.9]
  const iron: Rgb = [0.13, 0.17, 0.15]
  const lamp: Rgb = [0.95, 0.9, 0.7]

  // ---- the parvis balustrade, in short straight lengths so each sits on its own ground
  const zp = 92
  for (const [a, b] of [[-43, -12.5], [-2.5, 30]]) balustradeRun(out, g, a, b, zp, stone, trim)
  // the piers where the central stairs go down through it, with their lamps
  for (const x of [-12.5, -2.5]) {
    const y = g(x, zp)
    block(out, x - 0.6, x + 0.6, zp - 0.6, zp + 0.6, y - 0.6, y + 1.6, trim)
    candelabrum(out, x, zp, y + 1.6, iron, lamp, 0.7)
  }

  // ---- the fountain's grotto: the curved wall on the uphill side of the basin, its niche and cascade, the kerb
  const fx = -2.3
  const fz = 18.6
  const y0 = g(fx, fz)
  // (the wall's arc is centred 4 m below the basin's middle, so its ends clear the basin's back corners)
  const wz = fz - 4
  const R = 19
  const span = 0.96
  const n = 12
  for (let i = 0; i < n; i++) {
    const a0 = -span + (2 * span * i) / n
    const a1 = -span + (2 * span * (i + 1)) / n
    const am = (a0 + a1) / 2
    const x = fx + Math.sin(am) * R
    const z = wz + Math.cos(am) * R
    const len = 2 * R * Math.sin((a1 - a0) / 2)
    // a segment of wall standing from below the basin's level to 4.5 m over it, facing the basin
    boxAt(out, x, z, am, len / 2 + 0.05, 0.6, y0 - 1.4, y0 + 4.5, stone)
    boxAt(out, x, z, am, len / 2 + 0.1, 0.8, y0 + 4.5, y0 + 5.0, trim)
  }
  // the niche in the middle, the cascade falling from it, the urns on the wall's ends
  const nz = wz + R - 0.7
  block(out, fx - 2.6, fx + 2.6, nz - 0.5, nz + 0.3, y0 - 0.5, y0 + 6.2, trim)
  block(out, fx - 1.7, fx + 1.7, nz - 0.62, nz - 0.5, y0 + 0.6, y0 + 4.6, [0.32, 0.36, 0.38])
  block(out, fx - 1.2, fx + 1.2, nz - 0.75, nz - 0.62, y0 + 0.2, y0 + 4.2, [0.78, 0.86, 0.9])
  for (const s of [-1, 1]) {
    const x = fx + Math.sin(s * span) * R
    const z = wz + Math.cos(s * span) * R
    prism(out, x, z, g(x, z) + 4.5, g(x, z) + 6.0, 0.55, 8, trim, FIXED, 0.3)
  }
  // the basin (OSM's water, way 570241111, in this frame x −19…14.5, z 12.6…24.6): its water laid on the ground in
  // 3 m cells, and the low kerb round it in short lengths, each on its own ground — the square falls ~2 m across it
  const water: Rgb = [0.36, 0.5, 0.56]
  for (let x = -19; x < 14.5; x += 3) {
    for (let z = 12.6; z < 24.6; z += 3) {
      const x1 = Math.min(14.5, x + 3)
      const z1 = Math.min(24.6, z + 3)
      out.quad([[x, g(x, z) + 0.12, z], [x, g(x, z1) + 0.12, z1], [x1, g(x1, z1) + 0.12, z1], [x1, g(x1, z) + 0.12, z]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], water, FIXED)
    }
  }
  for (let x = -19; x < 14.5; x += 3) {
    const x1 = Math.min(14.5, x + 3)
    for (const z of [12.3, 24.9]) block(out, x, x1, z - 0.3, z + 0.3, g((x + x1) / 2, z) - 0.3, g((x + x1) / 2, z) + 0.45, trim)
  }
  for (let z = 12.0; z < 25.2; z += 3) {
    const z1 = Math.min(25.2, z + 3)
    for (const x of [-19.3, 14.8]) block(out, x - 0.3, x + 0.3, z, z1, g(x, (z + z1) / 2) - 0.3, g(x, (z + z1) / 2) + 0.45, trim)
  }

  // ---- the candelabra up both sides of the central flights, every 12 m from the parvis down to the fountain's terrace
  for (let z = 84; z > 36; z -= 12) {
    const axis = -3.7 - ((z - 30) / 62) * 3.7
    for (const d of [-7, 7]) candelabrum(out, axis + d, z, g(axis + d, z), iron, lamp, 1)
  }
}

/** A box `hx` along and `hz` across, turned so its across-direction points along angle `a` (0 = +z), from y0 to y1. */
function boxAt(out: MeshBuilder, x: number, z: number, a: number, hx: number, hz: number, y0: number, y1: number, c: Rgb): void {
  const s = Math.sin(a)
  const co = Math.cos(a)
  const P = (u: number, v: number, y: number): [number, number, number] => [x + co * u + s * v, y, z - s * u + co * v]
  const faces: [[number, number][], [number, number, number]][] = [
    [[[-hx, hz], [hx, hz]], [s, 0, co]], [[[hx, -hz], [-hx, -hz]], [-s, 0, -co]],
    [[[hx, hz], [hx, -hz]], [co, 0, -s]], [[[-hx, -hz], [-hx, hz]], [-co, 0, s]],
  ]
  for (const [[p, q], nrm] of faces) {
    out.quad([P(p[0], p[1], y0), P(q[0], q[1], y0), P(q[0], q[1], y1), P(p[0], p[1], y1)], nrm, [[0, 0], [1, 0], [1, 1], [0, 1]], c, FIXED)
  }
  out.quad([P(-hx, -hz, y1), P(hx, -hz, y1), P(hx, hz, y1), P(-hx, hz, y1)], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], c, FIXED)
}

/** A balustrade along z = zp from x = a to b, on a low wall, in 4 m lengths each on its own ground. */
function balustradeRun(out: MeshBuilder, g: (x: number, z: number) => number, a: number, b: number, zp: number, stone: Rgb, trim: Rgb): void {
  const n = Math.max(1, Math.round((b - a) / 4))
  const step = (b - a) / n
  for (let i = 0; i < n; i++) {
    const x0 = a + step * i
    const x1 = x0 + step
    const y = g((x0 + x1) / 2, zp)
    block(out, x0, x1, zp - 0.35, zp + 0.35, y - 1.2, y + 0.25, stone)                       // the wall, down into the slope
    block(out, x0, x1, zp - 0.3, zp + 0.3, y + 1.0, y + 1.18, trim)                           // the rail
    block(out, x0, x0 + 0.5, zp - 0.3, zp + 0.3, y + 0.25, y + 1.0, trim)                     // a pedestal
    for (let k = 1; k < 7; k++) box(out, x0 + 0.25 + (step - 0.25) * k / 7, y + 0.62, zp, 0.08, 0.37, 0.08, trim, FIXED)
  }
}

/** A Paris candelabrum: the dark iron post on its base, two arms and their lanterns. */
function candelabrum(out: MeshBuilder, x: number, z: number, y: number, iron: Rgb, lamp: Rgb, s: number): void {
  prism(out, x, z, y, y + 0.6 * s, 0.22 * s, 8, iron, FIXED, 0.15 * s)
  prism(out, x, z, y + 0.6 * s, y + 3.8 * s, 0.08 * s, 6, iron, FIXED, 0.06 * s)
  for (const d of [-1, 1]) {
    beam(out, [x, y + 3.5 * s, z], [x + d * 0.55 * s, y + 3.75 * s, z], 0.04 * s, iron)
    box(out, x + d * 0.55 * s, y + 3.95 * s, z, 0.14 * s, 0.2 * s, 0.14 * s, lamp, 0.5)
  }
  box(out, x, y + 4.05 * s, z, 0.14 * s, 0.22 * s, 0.14 * s, lamp, 0.5)
}
