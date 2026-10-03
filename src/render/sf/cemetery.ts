/**
 * SAN FRANCISCO NATIONAL CEMETERY (owner, 2026-10-02: "there is a massive military cemetery in the presidio with
 * thousands of identical white headstones that are regularly placed, we should render those as items"; BUGS.md #246).
 *
 * Some 30 000 graves on 28 acres of the Presidio's hillside, under the same white government-issue upright marble
 * stone: rounded top, about 0.33 m wide, 0.1 m thick, 1.1 m high of which a third is in the ground. They stand in
 * straight rows, the rows square to the cemetery's long side, a stone every 1.5 m along a row and a row every 2.4 m.
 * Drawn as items, thin-instanced: one small stone mesh, one matrix per grave, inside the cemetery's own outline
 * (OSM way/158606174, landuse=cemetery), off its drives and paths, each standing on the ground where it is.
 *
 * Built once the rider comes within `NEAR` (it costs a few milliseconds and ~1.5 MB of matrices); the ground is
 * re-read every few seconds until the fine terrain under it has come in, so the stones end up on the drawn hillside.
 * Left out with the furniture (`?without=furniture`, iOS's ultra tier).
 */
import { Matrix, Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import type { Scene } from '@babylonjs/core/scene'
import { MeshBuilder } from '../buildings.ts'
import { cartoonMaterial } from '../cartoon-material.ts'
import type { Projection } from '../../city/geo.ts'

/** the outline, [lat, lon] (OSM way/158606174) */
const RING: [number, number][] = [
  [37.7986106, -122.4671287], [37.7974267, -122.464977], [37.7974382, -122.464966], [37.7996047, -122.4629183],
  [37.7989726, -122.4618476], [37.7989615, -122.4618315], [37.799983, -122.4608464], [37.8004867, -122.4609536],
  [37.8011624, -122.4615228], [37.8012098, -122.4615675], [37.8012531, -122.4616219], [37.8012919, -122.4616888],
  [37.8013267, -122.4617643], [37.8013504, -122.4618405], [37.801367, -122.4619156], [37.8013812, -122.4619962],
  [37.8013925, -122.4620762], [37.8013996, -122.4621548], [37.8014032, -122.4622295], [37.8014006, -122.462308],
  [37.8013861, -122.4625527], [37.8013813, -122.4626604], [37.801381, -122.4627581], [37.8013886, -122.4628625],
  [37.8014007, -122.4629642], [37.8014231, -122.4630632], [37.8014501, -122.4631664], [37.8017051, -122.4640036],
  [37.8017515, -122.4641993], [37.7994182, -122.4663755], [37.7986106, -122.4671287],
]
const ALONG = 1.5
const ACROSS = 2.4
const NEAR = 700
/** metres to keep clear of a drive's or path's edge */
const CLEAR = 1.2

/**
 * Is (x, z) inside the cemetery? For thinning the woods the bake planted over it (game.ts `conformTile`): the real
 * cemetery is open lawn between the rows, with a few old trees, and the Presidio forest planting had the graves
 * standing in a wood.
 */
export function inCemetery(proj: Projection): (x: number, z: number) => boolean {
  const r = RING.map(([lat, lon]) => proj.toLocal({ lat, lon }))
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
  for (const p of r) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z) }
  return (x, z) => {
    if (x < x0 || x > x1 || z < z0 || z > z1) return false
    let hit = false
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      if ((r[i].z > z) !== (r[j].z > z) && x < ((r[j].x - r[i].x) * (z - r[i].z)) / (r[j].z - r[i].z) + r[i].x) hit = !hit
    }
    return hit
  }
}

/** One upright stone, its foot at the origin, its face to ±z: a slab with a rounded top, white marble. */
function stone(out: MeshBuilder): void {
  const w = 0.165
  const d = 0.05
  const h = 0.7
  const white: [number, number, number] = [0.93, 0.93, 0.9]
  const F = 0
  const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  // the shaft, and the rounded head as a half-octagon on top
  const P = (x: number, y: number, z: number): [number, number, number] => [x, y, z]
  const ring: [number, number][] = [[-w, 0], [w, 0], [w, h]]
  for (let k = 1; k < 4; k++) {
    const a = (k / 4) * Math.PI
    ring.push([Math.cos(a) * w, h + Math.sin(a) * w * 0.9])
  }
  ring.push([-w, h])
  for (let i = 0; i < ring.length; i++) {
    const [x0, y0] = ring[i]
    const [x1, y1] = ring[(i + 1) % ring.length]
    const nx = y1 - y0
    const ny = -(x1 - x0)
    const l = Math.hypot(nx, ny) || 1
    // the edge band round the outline
    out.quad([P(x0, y0, -d), P(x1, y1, -d), P(x1, y1, d), P(x0, y0, d)], [nx / l, ny / l, 0], UV, white, F)
  }
  // the two faces, fanned from the middle
  const cy = h * 0.6
  for (const s of [-1, 1]) {
    for (let i = 0; i < ring.length; i++) {
      const [x0, y0] = ring[i]
      const [x1, y1] = ring[(i + 1) % ring.length]
      out.quad([P(0, cy, s * d), P(x0, y0, s * d), P(x1, y1, s * d), P(x1, y1, s * d)], [0, 0, s], UV, white, F)
    }
  }
}

export interface CemeteryWorld {
  proj: Projection
  ground: (x: number, z: number) => number
  /** the drives and paths that cross it: centre lines and half-widths, local metres */
  ways: () => { points: { x: number; z: number }[]; half: number }[]
  /** paved areas: no graves on them */
  paved: () => { x: number; z: number }[][]
  /** changes when more of the streets have streamed in: the rows are laid out again, off the new drives */
  version: () => number
}

export class Cemetery {
  private mesh: Mesh | null = null
  private spots: { x: number; z: number; h: number }[] = []
  private matrices: Float32Array | null = null
  private readonly ring: { x: number; z: number }[]
  private readonly centre: { x: number; z: number }
  private settleUntil = 0
  private lastGround = 0
  private groundSum = NaN
  private builtAt = -1

  constructor(private readonly scene: Scene, private readonly world: CemeteryWorld) {
    this.ring = RING.map(([lat, lon]) => world.proj.toLocal({ lat, lon }))
    let x = 0, z = 0
    for (const p of this.ring) { x += p.x; z += p.z }
    this.centre = { x: x / this.ring.length, z: z / this.ring.length }
  }

  get count(): number { return this.spots.length }

  /** every frame (cheap when far): build when the rider comes near, and set the stones on the ground as it arrives */
  update(at: { x: number; z: number }, now: number): void {
    const near = Math.hypot(at.x - this.centre.x, at.z - this.centre.z) < NEAR
    if (!this.mesh) {
      if (!near) return
      this.build()
      this.settleUntil = now + 60_000
    }
    if (now < this.settleUntil && now - this.lastGround > 3000) {
      this.lastGround = now
      // the streets round it may still be streaming in: lay the rows out again off any drive that has arrived
      if (this.world.version() !== this.builtAt) this.build()
      else this.place()
    }
  }

  private build(): void {
    const inRing = (x: number, z: number): boolean => {
      let hit = false
      const r = this.ring
      for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
        if ((r[i].z > z) !== (r[j].z > z) && x < ((r[j].x - r[i].x) * (z - r[i].z)) / (r[j].z - r[i].z) + r[i].x) hit = !hit
      }
      return hit
    }
    // the rows square to the outline's longest side
    let best = 0, ux = 1, uz = 0
    for (let i = 0; i < this.ring.length; i++) {
      const a = this.ring[i], b = this.ring[(i + 1) % this.ring.length]
      const l = Math.hypot(b.x - a.x, b.z - a.z)
      if (l > best) { best = l; ux = (b.x - a.x) / l; uz = (b.z - a.z) / l }
    }
    const vx = -uz, vz = ux
    const heading = Math.atan2(vx, vz)      // a stone faces across its row
    // the ring's extent in the (u, v) frame
    let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity
    for (const p of this.ring) {
      const u = (p.x - this.centre.x) * ux + (p.z - this.centre.z) * uz
      const v = (p.x - this.centre.x) * vx + (p.z - this.centre.z) * vz
      u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v)
    }
    // (only the ways near it: the whole street graph against thirty thousand spots would take seconds)
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
    for (const p of this.ring) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z) }
    const ways = this.world.ways().filter((w) => w.points.some((p) => p.x > x0 - 30 && p.x < x1 + 30 && p.z > z0 - 30 && p.z < z1 + 30))
    const paved = this.world.paved().filter((r) => r.some((p) => p.x > x0 - 30 && p.x < x1 + 30 && p.z > z0 - 30 && p.z < z1 + 30))
    const inside = (r: { x: number; z: number }[], x: number, z: number): boolean => {
      let hit = false
      for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
        if ((r[i].z > z) !== (r[j].z > z) && x < ((r[j].x - r[i].x) * (z - r[i].z)) / (r[j].z - r[i].z) + r[i].x) hit = !hit
      }
      return hit
    }
    const clear = (x: number, z: number): boolean => {
      for (const r of paved) if (inside(r, x, z)) return false
      for (const w of ways) {
        for (let i = 1; i < w.points.length; i++) {
          const a = w.points[i - 1], b = w.points[i]
          const dx = b.x - a.x, dz = b.z - a.z
          const L2 = dx * dx + dz * dz || 1e-9
          const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / L2))
          if (Math.hypot(a.x + dx * t - x, a.z + dz * t - z) < w.half + CLEAR) return false
        }
      }
      return true
    }
    this.builtAt = this.world.version()
    this.spots = []
    for (let v = v0 + ACROSS; v < v1 - ACROSS / 2; v += ACROSS) {
      for (let u = u0 + ALONG; u < u1 - ALONG / 2; u += ALONG) {
        const x = this.centre.x + ux * u + vx * v
        const z = this.centre.z + uz * u + vz * v
        // a little inside the outline: the boundary is a wall and a hedge, not graves
        if (!inRing(x, z) || !inRing(x + vx * 2, z + vz * 2) || !inRing(x - vx * 2, z - vz * 2) || !clear(x, z)) continue
        this.spots.push({ x, z, h: heading })
      }
    }
    this.mesh?.dispose()
    this.groundSum = NaN
    const mb = new MeshBuilder()
    stone(mb)
    const mesh = new Mesh('cemetery:headstones', this.scene)
    mb.toVertexData().applyToMesh(mesh)
    mesh.material = cartoonMaterial(this.scene)
    mesh.isPickable = false
    mesh.alwaysSelectAsActiveMesh = true
    mesh.renderingGroupId = 3
    this.mesh = mesh
    this.matrices = new Float32Array(this.spots.length * 16)
    const colours = new Float32Array(this.spots.length * 4)
    for (let i = 0; i < this.spots.length; i++) colours.set([1, 1, 1, 1], i * 4)
    this.place()
    mesh.thinInstanceSetBuffer('instColor', colours, 4)
    mesh.setEnabled(this.spots.length > 0)
  }

  /** each stone on the ground where it stands; a no-op once the ground there has stopped changing */
  private place(): void {
    if (!this.mesh || !this.matrices) return
    let sum = 0
    const m = new Matrix()
    const q = new Quaternion()
    const one = new Vector3(1, 1, 1)
    for (let i = 0; i < this.spots.length; i++) {
      const s = this.spots[i]
      const y = this.world.ground(s.x, s.z)
      sum += y
      Quaternion.FromEulerAnglesToRef(0, s.h, 0, q)
      Matrix.ComposeToRef(one, q, new Vector3(s.x, y - 0.02, s.z), m)
      m.copyToArray(this.matrices, i * 16)
    }
    if (sum === this.groundSum) return
    this.groundSum = sum
    this.mesh.thinInstanceSetBuffer('matrix', this.matrices, 16)
  }
}
