import { MeshBuilder, capPolygonWithHoles } from '../../../buildings.ts'
import { prism, type Rgb } from '../../../models.ts'
import { beam, placed } from '../../kit.ts'
import { type P2, ccw, FIXED, UV, walls } from './common.ts'

/*
 * What the fountains and statues of the places share (wave 4): the pavement's level in a model's frame, the round and
 * eight-sided basins, an arc of water, the rounded mass a bronze is made of, and the figures that are not in the monument kit.
 */

/** The pavement in a point entry's frame: the loader sinks every model half a metre. */
export const G = 0.5

/** A ring of `n` points, radius r, anticlockwise. */
export const circle = (r: number, n = 28): P2[] => {
  const out: P2[] = []
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    out.push({ x: Math.cos(a) * r, z: Math.sin(a) * r })
  }
  return out
}

/** A regular octagon whose flats face ±x, ±z and the diagonals, `r` from the centre to a flat. */
export const octagon = (r: number): P2[] => {
  const k = r * Math.tan(Math.PI / 8)
  return ccw([{ x: r, z: -k }, { x: r, z: k }, { x: k, z: r }, { x: -k, z: r }, { x: -r, z: k }, { x: -r, z: -k }, { x: -k, z: -r }, { x: k, z: -r }])
}

/**
 * A basin of any plan: its wall from y0 to y1, a rim `rim` wide on top, and water `drop` under the rim's top. The drop is
 * not modelled as an inner wall (at a basin's depth nothing sees one): the water is a sheet just under the rim's level.
 */
export function basin(out: MeshBuilder, plan: P2[], inner: P2[], y0: number, y1: number, stone: Rgb, water: Rgb): void {
  walls(out, plan, y0, y1, stone)
  capPolygonWithHoles(out, [ccw(plan), [...ccw(inner)].reverse()], y1, stone, FIXED)
  capPolygonWithHoles(out, [ccw(inner)], y1 - 0.07, water, FIXED)
}

/** A sheet of water down a basin's wall: the same plan a few centimetres proud, from y1 down to y0, in a paler colour. */
export function falls(out: MeshBuilder, plan: P2[], y0: number, y1: number, c: Rgb): void {
  const r = ccw(plan)
  const cx = r.reduce((a, p) => a + p.x, 0) / r.length
  const cz = r.reduce((a, p) => a + p.z, 0) / r.length
  walls(out, r.map((p) => ({ x: cx + (p.x - cx) * 1.012, z: cz + (p.z - cz) * 1.012 })), y0, y1, c)
}

/** An arc of water from a to b, rising `rise` over the straight line between them. */
export function spout(out: MeshBuilder, a: [number, number, number], b: [number, number, number], rise: number, r: number, c: Rgb): void {
  const n = 5
  let p = a
  for (let i = 1; i <= n; i++) {
    const t = i / n
    const q: [number, number, number] = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t + 4 * rise * t * (1 - t), a[2] + (b[2] - a[2]) * t]
    beam(out, p, q, r, c)
    p = q
  }
}

/** A ball drawn out to (rx, ry, rz): a haunch, a mane, a head. Few facets: a bronze is read by its mass. */
export function blob(out: MeshBuilder, x: number, y: number, z: number, rx: number, ry: number, rz: number, c: Rgb, sides = 8, rows = 5): void {
  for (let k = 0; k < rows; k++) {
    const p0 = -Math.PI / 2 + (k / rows) * Math.PI
    const p1 = -Math.PI / 2 + ((k + 1) / rows) * Math.PI
    const pm = (p0 + p1) / 2
    for (let i = 0; i < sides; i++) {
      const a0 = (i / sides) * Math.PI * 2
      const a1 = ((i + 1) / sides) * Math.PI * 2
      const am = (a0 + a1) / 2
      const P = (a: number, p: number): [number, number, number] => [x + Math.sin(a) * Math.cos(p) * rx, y + Math.sin(p) * ry, z + Math.cos(a) * Math.cos(p) * rz]
      const n: [number, number, number] = [Math.sin(am) * Math.cos(pm) / rx, Math.sin(pm) / ry, Math.cos(am) * Math.cos(pm) / rz]
      const l = Math.hypot(n[0], n[1], n[2]) || 1
      out.quad([P(a0, p0), P(a1, p0), P(a1, p1), P(a0, p1)], [n[0] / l, n[1] / l, n[2] / l], UV, c, FIXED)
    }
  }
}

/** `draw` (facing +z, standing on y = 0 at the origin) set at (x, y, z), turned to face `heading` (0 faces +z, π faces −z), scaled by s. */
export function set(out: MeshBuilder, x: number, y: number, z: number, heading: number, s: number, draw: (q: MeshBuilder) => void): void {
  const q = new MeshBuilder()
  draw(q)
  for (let i = 0; i < q.positions.length; i += 3) {
    q.positions[i] *= s
    q.positions[i + 1] = q.positions[i + 1] * s + y
    q.positions[i + 2] *= s
  }
  placed(out, q, heading, x, z)
}

/** A figure seated on a block, 1 unit tall sitting, robed: the block, the lap and the fall of the drapery, the body, the head. Facing +z. */
export function seated(q: MeshBuilder, c: Rgb, block: Rgb = c): void {
  prism(q, 0, -0.1, 0, 0.36, 0.28, 4, block, FIXED)
  blob(q, 0, 0.22, 0.2, 0.25, 0.24, 0.17, c, 7, 4)          // the drapery falling from the knees
  blob(q, 0, 0.41, 0.08, 0.26, 0.11, 0.3, c, 7, 3)          // the lap
  blob(q, 0, 0.62, -0.08, 0.25, 0.28, 0.19, c, 8, 4)        // the body
  blob(q, 0, 0.92, -0.05, 0.095, 0.115, 0.105, c, 6, 4)     // the head
  for (const s of [-1, 1]) beam(q, [s * 0.24, 0.76, -0.06], [s * 0.19, 0.46, 0.16], 0.055, c)   // the arms, on the knees
}

/** A seated lion, 1 unit tall, its forelegs straight, its mouth open toward +z: the shape of Davioud's bronzes. */
export function sittingLion(q: MeshBuilder, c: Rgb): void {
  blob(q, 0, 0.26, -0.3, 0.2, 0.25, 0.28, c, 7, 4)                 // the haunches
  beam(q, [0, 0.34, -0.25], [0, 0.66, 0.08], 0.14, c, 0.17)        // the back
  blob(q, 0, 0.73, 0.12, 0.2, 0.22, 0.2, c, 8, 5)                  // the mane
  blob(q, 0, 0.82, 0.25, 0.1, 0.11, 0.12, c, 6, 4)                 // the head
  beam(q, [0, 0.77, 0.33], [0, 0.76, 0.4], 0.05, c)                // the muzzle
  for (const s of [-1, 1]) {
    beam(q, [s * 0.1, 0.55, 0.15], [s * 0.1, 0, 0.26], 0.05, c)    // the forelegs
    beam(q, [s * 0.1, 0.03, 0.2], [s * 0.1, 0.03, 0.34], 0.055, c, 0.03)
    beam(q, [s * 0.19, 0.08, -0.2], [s * 0.15, 0.04, 0.08], 0.06, c, 0.04)   // the hind paws
  }
  beam(q, [0.14, 0.06, -0.48], [0.26, 0.04, -0.12], 0.025, c)       // the tail
}

/** A lion lying with its head up, 1 unit long and looking toward +z, a little over half a unit high: Visconti's on Saint-Sulpice. */
export function lyingLion(q: MeshBuilder, c: Rgb): void {
  beam(q, [0, 0.18, -0.46], [0, 0.22, 0.12], 0.15, c, 0.17)         // the body
  blob(q, 0, 0.2, -0.42, 0.17, 0.19, 0.2, c, 7, 4)                  // the haunches
  blob(q, 0, 0.36, 0.14, 0.2, 0.24, 0.2, c, 8, 5)                   // the mane
  blob(q, 0, 0.47, 0.27, 0.11, 0.11, 0.11, c, 6, 4)                 // the head
  beam(q, [0, 0.43, 0.34], [0, 0.42, 0.42], 0.05, c)                // the muzzle
  for (const s of [-1, 1]) beam(q, [s * 0.1, 0.05, 0.15], [s * 0.1, 0.04, 0.5], 0.05, c, 0.04)   // the forepaws
  beam(q, [0.14, 0.04, -0.58], [0.2, 0.03, -0.22], 0.02, c)         // the tail
}
