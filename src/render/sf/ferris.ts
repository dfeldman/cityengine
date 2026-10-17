/**
 * THE SKYSTAR WHEEL at Fisherman's Wharf (BUGS.md #290c; owner 2026-10-16: "the ferris wheel should be a high quality
 * detailed model… ideally press O to observe from the ferris wheel… or B to board it?" — B, as every other ride).
 *
 * What turns is drawn here, not by the landmark: the twin trussed rims, the cable spokes from the hub's two flanges,
 * the red LED strips along rim and spokes (EMIT: they glow after dark), and the thirty-six capsule gondolas, which hang
 * outboard of the rim and stay UPRIGHT as it turns — each its own instance, placed every frame. What stands still (the
 * A-frame legs, the loading deck, the arched canopy with SKYSTAR on it) is the landmark `skystarWheel`
 * (landmarks/sf/wharf-carnival.ts), placed from the same SKYSTAR constant.
 *
 * Boarding: the gondola at the bottom is a transit vehicle of kind 'wheel' (sim/transit.ts), offered while it stands at
 * the deck. Aboard, the rider rides one turn — two and a half minutes — and is put off at the bottom; B on the way round
 * asks to get off at the bottom, which is the only place there is to get off.
 *
 * Frame: the wheel's own — x across its face (east), y up, z along the axle (north); the hub at (0, HUB, 0).
 * Facing south, to Jefferson Street. Photographs: Commons "SkyStar Wheel - Fisherman's Wharf - January 2024 (8775)",
 * "SkyStar ferris wheel, Golden Gate Park".
 */
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { Matrix, Vector3 } from '@babylonjs/core/Maths/math.vector'
import type { Scene } from '@babylonjs/core/scene'
import { MeshBuilder } from '../buildings.ts'
import { cartoonMaterial, surfaceTag } from '../cartoon-material.ts'
import { box, EMIT, type Rgb } from '../models.ts'
import type { VehicleView } from '../../sim/transit.ts'

/** where it stands: the hub over this point, its face to `heading` (radians, 0 = north, π = south) */
export const SKYSTAR = { lat: 37.80873, lon: -122.413413, heading: Math.PI, hub: 25.8, rim: 18, count: 36 }
/**
 * A gondola's pivot, this far out past the rim: far enough that at the top of the turn, hanging back toward the hub,
 * the cabin's floor still clears the rim (its 2.4 m of cabin hangs 0.75 m under the pivot).
 */
const PIVOT = SKYSTAR.rim + 3.4
/** one turn, in seconds */
const TURN = 150
/** the deck the gondolas are boarded from: its floor over the ground, and how far it stands in front of the face */
export const DECK = { y: 1.2, front: 0 }

type V3 = [number, number, number]
const UVQ: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
const WHITE: Rgb = [0.93, 0.93, 0.92], STEELW: Rgb = [0.86, 0.87, 0.88], LED: Rgb = [1.0, 0.18, 0.22]
const GLASS: Rgb = [0.22, 0.27, 0.32], DARK: Rgb = [0.18, 0.19, 0.2]

/** a square bar from a to b, `w` thick */
function bar(out: MeshBuilder, a: V3, b: V3, w: number, c: Rgb, tag: number): void {
  const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]
  const L = Math.hypot(d[0], d[1], d[2]) || 1
  const f: V3 = [d[0] / L, d[1] / L, d[2] / L]
  const ref: V3 = Math.abs(f[2]) > 0.9 ? [1, 0, 0] : [0, 0, 1]
  let s: V3 = [f[1] * ref[2] - f[2] * ref[1], f[2] * ref[0] - f[0] * ref[2], f[0] * ref[1] - f[1] * ref[0]]
  const sl = Math.hypot(s[0], s[1], s[2]) || 1
  s = [s[0] / sl, s[1] / sl, s[2] / sl]
  const t: V3 = [f[1] * s[2] - f[2] * s[1], f[2] * s[0] - f[0] * s[2], f[0] * s[1] - f[1] * s[0]]
  const h = w / 2
  const P = (p: V3, i: number, j: number): V3 => [p[0] + (s[0] * i + t[0] * j) * h, p[1] + (s[1] * i + t[1] * j) * h, p[2] + (s[2] * i + t[2] * j) * h]
  const sides: [number, number, number, number, V3][] = [[1, -1, 1, 1, s], [-1, 1, -1, -1, [-s[0], -s[1], -s[2]]], [1, 1, -1, 1, t], [-1, -1, 1, -1, [-t[0], -t[1], -t[2]]]]
  for (const [i0, j0, i1, j1, n] of sides) out.quad([P(a, i0, j0), P(b, i0, j0), P(b, i1, j1), P(a, i1, j1)], n, UVQ, c, tag)
}

/** the turning part, in the wheel's frame with the hub at the origin */
function wheelMesh(): MeshBuilder {
  const out = new MeshBuilder()
  const MT = surfaceTag('metal')
  const R = SKYSTAR.rim, N = SKYSTAR.count, SEG = N * 2
  const at = (a: number, r: number, z: number): V3 => [Math.cos(a) * r, Math.sin(a) * r, z]
  const ZR = 1.3              // the two rims, either side of the centre plane
  const RI = R - 1.7          // the inner chord of the truss
  for (let i = 0; i < SEG; i++) {
    const a0 = (i / SEG) * Math.PI * 2, a1 = ((i + 1) / SEG) * Math.PI * 2
    for (const z of [-ZR, ZR]) {
      bar(out, at(a0, R, z), at(a1, R, z), 0.36, WHITE, MT)                 // the rim
      bar(out, at(a0, RI, z * 0.75), at(a1, RI, z * 0.75), 0.22, WHITE, MT) // the truss's inner chord
      bar(out, at(a0, R + 0.24, z), at(a1, R + 0.24, z), 0.2, LED, EMIT)     // the LED strip on the rim's outer face
      bar(out, at(a0, RI - 0.16, z * 0.75), at(a1, RI - 0.16, z * 0.75), 0.14, LED, EMIT) // and round the inner chord
      // the truss's zigzag between them
      bar(out, at(a0, R, z), at(a1, RI, z * 0.75), 0.1, STEELW, MT)
    }
  }
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2
    // the cross-members between the two rims, and the radial between chord and rim
    bar(out, at(a, R, -ZR), at(a, R, ZR), 0.22, WHITE, MT)
    bar(out, at(a, RI, -ZR * 0.75), at(a, RI, ZR * 0.75), 0.14, WHITE, MT)
    for (const z of [-ZR, ZR]) bar(out, at(a, RI, z * 0.75), at(a, R, z), 0.14, WHITE, MT)
    // the cable spokes, from the hub's flanges crossing to the far rim, as a bicycle wheel's are
    for (const [zh, zr] of [[-2.6, ZR], [2.6, -ZR]] as [number, number][]) bar(out, at(a + (zh > 0 ? 0.04 : -0.04), 1.6, zh), at(a, RI, zr * 0.75), 0.07, STEELW, MT)
    // every other spoke carries a red LED strip, the lines of light that radiate from the hub at night
    if (i % 2 === 0) bar(out, at(a, 1.9, 0), at(a, RI - 0.2, 0), 0.13, LED, EMIT)
    // the gondola's hanger: an arm out from the rim to the pivot
    bar(out, at(a, R, -ZR * 0.6), at(a, PIVOT, 0), 0.14, WHITE, MT)
    bar(out, at(a, R, ZR * 0.6), at(a, PIVOT, 0), 0.14, WHITE, MT)
  }
  // the hub: a drum on the axle, its two spoke flanges, a starburst of light on its face
  for (let i = 0; i < 24; i++) {
    const a0 = (i / 24) * Math.PI * 2, a1 = ((i + 1) / 24) * Math.PI * 2
    out.quad([at(a0, 1.2, -2.8), at(a1, 1.2, -2.8), at(a1, 1.2, 2.8), at(a0, 1.2, 2.8)], [Math.cos((a0 + a1) / 2), Math.sin((a0 + a1) / 2), 0], UVQ, WHITE, MT)
    for (const z of [-2.6, 2.6]) {
      out.quad([at(a0, 0.3, z), at(a1, 0.3, z), at(a1, 1.9, z), at(a0, 1.9, z)], [0, 0, Math.sign(z)], UVQ, WHITE, MT)
      out.quad([at(a0, 1.9, z + 0.12 * Math.sign(z)), at(a1, 1.9, z + 0.12 * Math.sign(z)), at(a1, 1.92, z), at(a0, 1.92, z)], [0, 0, Math.sign(z)], UVQ, LED, EMIT)
    }
    out.quad([at(a0, 0, 2.85), at(a1, 0, 2.85), at(a1, 1.2, 2.85), at(a0, 1.2, 2.85)], [0, 0, 1], UVQ, i % 2 ? LED : WHITE, i % 2 ? EMIT : MT)
    out.quad([at(a0, 0, -2.85), at(a1, 0, -2.85), at(a1, 1.2, -2.85), at(a0, 1.2, -2.85)], [0, 0, -1], UVQ, i % 2 ? LED : WHITE, i % 2 ? EMIT : MT)
  }
  return out
}

/**
 * One gondola, its pivot at the origin: a white capsule — rounded ends, a band of tinted glass all round, a dark floor
 * — hanging on a yoke, the door on the face side. 2.2 wide, 2.4 tall, 1.9 deep.
 */
function gondolaMesh(): MeshBuilder {
  const out = new MeshBuilder()
  const MT = surfaceTag('metal'), GL = surfaceTag('glass')
  const W = 1.1, D = 0.95, top = -0.75, bot = -3.15, gl0 = -2.45, gl1 = -1.15
  // the sides as a rounded rectangle in plan (x, z), extruded in bands up the cabin
  const plan: [number, number][] = []
  const CR = 0.45
  for (const [cx, cz, a0] of [[W - CR, D - CR, 0], [-(W - CR), D - CR, Math.PI / 2], [-(W - CR), -(D - CR), Math.PI], [W - CR, -(D - CR), Math.PI * 1.5]] as [number, number, number][]) {
    for (let k = 0; k <= 3; k++) { const a = a0 + (k / 3) * Math.PI / 2; plan.push([cx + Math.cos(a) * CR, cz + Math.sin(a) * CR]) }
  }
  // the bands: white skirt, glass, white crown — with the crown and skirt drawn in a little (the capsule's curve)
  const bands: [number, number, number, number, Rgb, number][] = [
    [bot, bot + 0.35, 0.82, 0.96, WHITE, MT], [bot + 0.35, gl0, 0.96, 1, WHITE, MT], [gl0, gl1, 1, 1, GLASS, GL],
    [gl1, top - 0.35, 1, 0.97, WHITE, MT], [top - 0.35, top, 0.97, 0.8, WHITE, MT],
  ]
  for (const [y0, y1, k0, k1, c, tag] of bands) {
    for (let i = 0; i < plan.length; i++) {
      const [ax, az] = plan[i], [bx, bz] = plan[(i + 1) % plan.length]
      const nx = (az - bz), nz = (bx - ax)
      out.quad([[bx * k0, y0, bz * k0], [ax * k0, y0, az * k0], [ax * k1, y1, az * k1], [bx * k1, y1, bz * k1]], [-nx, 0, -nz], UVQ, c, tag)
    }
  }
  // the floor and the roof, fans over the plan
  for (const [y, k, c, n] of [[bot, 0.82, DARK, -1], [top, 0.8, WHITE, 1]] as [number, number, Rgb, number][]) {
    for (let i = 1; i + 1 < plan.length; i++) {
      out.quad([[plan[0][0] * k, y, plan[0][1] * k], [plan[i][0] * k, y, plan[i][1] * k], [plan[i + 1][0] * k, y, plan[i + 1][1] * k], [plan[i + 1][0] * k, y, plan[i + 1][1] * k]], [0, n, 0], UVQ, c, MT)
    }
  }
  // the yoke from the pivot down to the roof, the door's frame on the face, a number plate
  for (const s of [-1, 1]) bar(out, [s * 0.35, 0, 0], [s * 0.7, top + 0.05, 0], 0.1, WHITE, MT)
  bar(out, [-0.4, 0, -0.2], [-0.4, 0, 0.2], 0.12, DARK, MT)
  box(out, 0, (gl0 + gl1) / 2 - 0.1, -D - 0.005, 0.42, (gl1 - gl0) / 2 + 0.55, 0.02, STEELW, MT)
  box(out, 0, gl1 + 0.18, -D - 0.02, 0.18, 0.1, 0.01, LED, EMIT)
  return out
}

export class FerrisWheel {
  private wheel: Mesh
  private cabins: Mesh
  private mats: Float32Array
  private wheelMat = new Float32Array(16)
  private cols: Float32Array
  /** the wheel's turn, radians */
  private angle = 0
  /** the gondola the rider is in, and how far round it has come since */
  private riding: { i: number; turned: number; leave: boolean } | null = null
  private readonly base: Vector3
  private readonly face: number

  /** `x`, `z`: the hub's place in the city; `ground`: the ground there */
  constructor(scene: Scene, x: number, z: number, ground: number) {
    this.base = new Vector3(x, ground, z)
    this.face = SKYSTAR.heading
    const mk = (name: string, mb: MeshBuilder, n: number): Mesh => {
      const m = new Mesh(name, scene)
      mb.toVertexData().applyToMesh(m)
      m.material = cartoonMaterial(scene)
      m.isPickable = false
      m.alwaysSelectAsActiveMesh = true
      m.renderingGroupId = 3
      return m
    }
    this.wheel = mk('skystar:wheel', wheelMesh(), 1)
    this.cabins = mk('skystar:gondolas', gondolaMesh(), SKYSTAR.count)
    this.mats = new Float32Array(SKYSTAR.count * 16)
    this.cols = new Float32Array(SKYSTAR.count * 4)
    // (mix 0: the mesh's own colours)
    this.wheel.thinInstanceSetBuffer('matrix', this.wheelMat, 16, false)
    this.wheel.thinInstanceSetBuffer('instColor', new Float32Array(4), 4, true)
    this.cabins.thinInstanceSetBuffer('matrix', this.mats, 16, false)
    this.cabins.thinInstanceSetBuffer('instColor', this.cols, 4, true)
    this.update(0)
  }

  /** the wheel's frame → the city: turned to face `heading` about the vertical, at the hub */
  private toWorld(lx: number, ly: number, lz: number): Vector3 {
    // local +z is the axle, pointing away from the face (the face looks along −z); turned so the face looks along `heading`
    const yaw = this.face + Math.PI
    const c = Math.cos(yaw), s = Math.sin(yaw)
    return new Vector3(this.base.x + lx * c + lz * s, this.base.y + SKYSTAR.hub + ly, this.base.z - lx * s + lz * c)
  }

  /** where gondola `i`'s pivot is now, in the city */
  private pivot(i: number): Vector3 {
    const a = this.angle + (i / SKYSTAR.count) * Math.PI * 2
    return this.toWorld(Math.cos(a) * PIVOT, Math.sin(a) * PIVOT, 0)
  }

  update(dt: number): void {
    const w = (Math.PI * 2) / TURN
    this.angle = (this.angle + w * dt) % (Math.PI * 2)
    if (this.riding) this.riding.turned += w * dt
    const yaw = this.face + Math.PI
    // (row vectors: spun about the axle, then turned to face, then moved to the hub — the order toWorld uses)
    const hub = this.toWorld(0, 0, 0)
    const Y = Matrix.RotationY(yaw)
    Matrix.RotationZ(this.angle).multiply(Y).multiply(Matrix.Translation(hub.x, hub.y, hub.z)).copyToArray(this.wheelMat, 0)
    this.wheel.thinInstanceCount = 1
    this.wheel.thinInstancePartialBufferUpdate('matrix', this.wheelMat, 0)
    for (let i = 0; i < SKYSTAR.count; i++) {
      // hung from its pivot, upright, swaying a little as it goes over the top
      const a = this.angle + (i / SKYSTAR.count) * Math.PI * 2
      const p = this.pivot(i)
      Matrix.RotationZ(0.03 * Math.sin(a * 2 + i)).multiply(Y).multiply(Matrix.Translation(p.x, p.y, p.z)).copyToArray(this.mats, i * 16)
    }
    this.cabins.thinInstanceCount = SKYSTAR.count
    this.cabins.thinInstancePartialBufferUpdate('matrix', this.mats, 0)
  }

  /** the gondola nearest the bottom: the one at the deck */
  private bottom(): number {
    let best = 0, bd = Infinity
    for (let i = 0; i < SKYSTAR.count; i++) {
      const a = (this.angle + (i / SKYSTAR.count) * Math.PI * 2) % (Math.PI * 2)
      const d = Math.abs(a - Math.PI * 1.5)
      if (d < bd) { bd = d; best = i }
    }
    return best
  }

  /** a gondola's cabin floor, as a transit vehicle; the rider stands in the middle of it */
  private view(i: number, dwelling: boolean): VehicleView {
    const p = this.pivot(i)
    return { id: `skystar:${i}`, kind: 'wheel', x: p.x, z: p.z, y: p.y - 3.1, heading: this.face, speed: 0, dwelling, name: 'SkyStar wheel' }
  }

  /** what may be boarded: the gondola at the deck — or, aboard, the one being ridden */
  views(): VehicleView[] {
    if (this.riding) return [this.view(this.riding.i, false)]
    const b = this.bottom()
    // offered at the deck itself, where a rider reaches it from Jefferson Street
    const v = this.view(b, true)
    const d = this.toWorld(0, 0, -6)
    return [{ ...v, x: d.x, z: d.z }]
  }

  /** the rider got on (sim/transit.ts accepted `id`) */
  boarded(id: string): void {
    const i = Number(id.split(':')[1])
    this.riding = { i, turned: 0, leave: false }
  }

  /** B on the way round: off at the bottom (true when that is now) */
  askOff(): boolean {
    if (!this.riding) return true
    if (this.atBottom()) return true
    this.riding.leave = true
    return false
  }

  private atBottom(): boolean {
    if (!this.riding) return false
    const a = (this.angle + (this.riding.i / SKYSTAR.count) * Math.PI * 2) % (Math.PI * 2)
    return Math.abs(a - Math.PI * 1.5) < 0.09
  }

  /** time to get off: round once, or asked to and come back to the deck */
  dueOff(): boolean {
    if (!this.riding) return false
    return this.atBottom() && (this.riding.turned > Math.PI * 1.8 || (this.riding.leave && this.riding.turned > 0.3))
  }

  alighted(): void { this.riding = null }

  get aboard(): boolean { return this.riding !== null }

  /**
   * Where the camera rides, aboard: INSIDE the gondola at a standing eye's height, looking out of its window along the
   * axle — north, over the Wharf's piers to the bay and Alcatraz — tipped down as the gondola climbs, so the city is
   * in the picture at the top. (Its walls face out, and are not drawn from inside; the rim and its spokes are inboard.)
   */
  cameraAboard(): { eye: Vector3; look: Vector3 } | null {
    if (!this.riding) return null
    const p = this.pivot(this.riding.i)
    const eye = p.add(new Vector3(0, -1.55, 0))
    const up = (p.y - this.base.y) / (SKYSTAR.hub + PIVOT)
    // panning slowly as it goes round: from the Golden Gate in the west, over Alcatraz, to Pier 39 and the Bay Bridge
    const pan = Math.sin(this.riding.turned * 0.9 - 0.6) * 0.95
    const ahead = this.toWorld(Math.sin(pan) * 60, 0, Math.cos(pan) * 60).subtract(this.toWorld(0, 0, 0))
    return { eye, look: eye.add(ahead).add(new Vector3(0, -6 - 18 * up, 0)) }
  }
}
