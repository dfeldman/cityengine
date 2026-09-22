/**
 * Boats under way on a river (user, 2026-09-22: "moving things to make the world feel more alive"). Shared by
 * every region: the region brings its fleet (Paris's is render/paris/boats.ts — bateaux-mouches, the Batobus,
 * sand barges); a small launch is common to all. They follow the river's centre line (tools/river.ts → `cities/<id>/river.json`),
 * each keeping to the right of it in the way it is going — as boats on the Seine do — and turning at the ends,
 * with a wake spreading behind (the fountains' moving-water material, render/fountains.ts), a slow roll, and the water's own level under them (`waterAt`, from the tiles:
 * off the built tiles a boat is not drawn).
 *
 * Each boat is its own mesh, moved every frame — a dozen of them, so a matrix each is nothing.
 */
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import type { Scene } from '@babylonjs/core/scene'
import { MeshBuilder } from './buildings.ts'
import { box, wedge, type Rgb } from './models.ts'
import { cartoonMaterial } from './cartoon-material.ts'
import { waterMaterial } from './fountains.ts'

export const F = 0
export const WHITE: Rgb = [0.93, 0.93, 0.9]
export const GLASS: Rgb = [0.16, 0.24, 0.3]
export const DARK: Rgb = [0.1, 0.11, 0.13]
export const SHIRTS: Rgb[] = [[0.8, 0.2, 0.2], [0.2, 0.35, 0.7], [0.95, 0.85, 0.3], [0.9, 0.9, 0.9], [0.15, 0.15, 0.18], [0.3, 0.6, 0.35], [0.85, 0.5, 0.6]]

export const rnd = (seed: number): (() => number) => {
  let s = seed >>> 0
  return () => { s = (Math.imul(s ^ (s >>> 15), 0x2c1b3c6d) + 0x9e3779b9) >>> 0; return (s % 10000) / 10000 }
}

/** the bow: a hull narrowed in three steps ahead of z0 */
export function bow(out: MeshBuilder, z0: number, B: number, y: number, h: number, c: Rgb, step = 0.9): void {
  for (let k = 0; k < 3; k++) box(out, 0, y, z0 + k * step + step / 2, B * (0.82 - k * 0.24), h, step / 2, c, F)
}

/**
 * A boat's wake, on the water behind it: the two arms of the V from the bow, opening at the Kelvin angle, and
 * the churned water behind the stern. Transparent, streaked, fading to nothing along its length (kind 3 in the
 * fountains' material). Local +z forward, the waterline at y = 0.
 */
function wake(out: MeshBuilder, L: number, B: number): void {
  const y = 0.05
  const q = (p: [number, number, number][]): void => out.quad(p, [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], [3, 0, 0], 0)
  const len = Math.max(14, L * 2.6)
  const k = Math.tan((19.5 * Math.PI) / 180)
  for (const s of [-1, 1]) {
    // the arm: from the bow shoulder back and out, widening
    const x0 = s * B * 0.9
    const z0 = L - 1
    const x1 = s * (B + len * k)
    const z1 = L - 1 - len
    const w0 = 0.5
    const w1 = 2.5 + L * 0.08
    q([[x0 - w0 * s, y, z0], [x0 + w0 * s, y, z0], [x1 + w1 * s, y, z1], [x1 - w1 * s, y, z1]].map(([a, b, c]) => [a, b, c] as [number, number, number]))
  }
  // behind the stern: the propeller's water, a widening strip
  q([[-B * 0.7, y + 0.01, -L], [B * 0.7, y + 0.01, -L], [B * 1.6, y + 0.01, -L - len * 1.2], [-B * 1.6, y + 0.01, -L - len * 1.2]])
}

/** people on a deck: seated blocks with heads, in rows */
export function passengers(out: MeshBuilder, y: number, z0: number, z1: number, halfW: number, r: () => number, fill: number, pitch = 1.1): void {
  for (let z = z0; z < z1; z += pitch) {
    for (let x = -halfW; x <= halfW + 0.01; x += 0.62) {
      if (Math.abs(x) < 0.5 || r() > fill) continue
      const c = SHIRTS[Math.floor(r() * SHIRTS.length)]
      box(out, x, y + 0.35, z, 0.19, 0.3, 0.14, c, F)
      box(out, x, y + 0.82, z, 0.11, 0.12, 0.11, [0.85, 0.66, 0.52], F)
    }
  }
}

/** A small launch: a white motor boat, two or three aboard. */
function launchBoat(out: MeshBuilder, seed: number): { L: number; B: number } {
  const r = rnd(seed)
  const L = 3.8
  const B = 1.25
  box(out, 0, 0.3, -0.3, B, 0.4, L - 0.3, WHITE, F)
  box(out, 0, 0.3, -0.3, B + 0.02, 0.06, L - 0.3, [0.1, 0.25, 0.55], F)
  bow(out, L - 0.6, B, 0.3, 0.38, WHITE, 0.35)
  wedge(out, 0, 0.95, 0.6, B - 0.2, 0.25, 0.7, 0.35, GLASS, F)
  passengers(out, 0.45, -L + 1, -0.2, B - 0.5, r, 0.7)
  return { L, B }
}

/** a kind of boat in a region's fleet: how to build it (local +z forward, waterline y = 0), its pace, its lane */
export interface BoatKind { name: string; build: (out: MeshBuilder, seed: number) => { L: number; B: number }; speed: number; lane: number }

/** a small launch, anywhere there is a river */
export const LAUNCH: BoatKind = { name: 'launch', build: launchBoat, speed: 6.5, lane: 14 }

interface Boat { mesh: Mesh; kind: string; s: number; dir: 1 | -1; speed: number; lane: number; half: number; phase: number; x: number; z: number; heading: number }

export class RiverTraffic {
  private readonly pts: { x: number; z: number }[] = []
  private readonly cum: number[] = [0]
  private readonly boats: Boat[] = []
  private t = 0

  constructor(scene: Scene, points: number[], private readonly waterAt: (x: number, z: number) => number | null,
              fleet: BoatKind[] = [LAUNCH]) {
    for (let i = 0; i < points.length; i += 2) this.pts.push({ x: points[i], z: points[i + 1] })
    for (let i = 1; i < this.pts.length; i++) this.cum.push(this.cum[i - 1] + Math.hypot(this.pts[i].x - this.pts[i - 1].x, this.pts[i].z - this.pts[i - 1].z))
    const length = this.cum[this.cum.length - 1]
    // a boat every 700 m or so, both ways
    const n = Math.max(2, Math.min(fleet.length, Math.round(length / 700)))
    const mat = cartoonMaterial(scene, 'cartoonBoat', false)
    const water = waterMaterial(scene)
    for (let i = 0; i < n; i++) {
      const kind = fleet[i % fleet.length]
      const out = new MeshBuilder()
      const { L, B } = kind.build(out, 7919 * (i + 1))
      const mesh = new Mesh(`riverboat:${i}`, scene)
      out.toVertexData().applyToMesh(mesh)
      mesh.material = mat
      mesh.renderingGroupId = 3
      mesh.isPickable = false
      mesh.setEnabled(false)
      const w = new MeshBuilder()
      wake(w, L, B)
      const wm = new Mesh(`riverboat:${i}:wake`, scene)
      w.toVertexData().applyToMesh(wm)
      wm.material = water
      wm.renderingGroupId = 3
      wm.isPickable = false
      wm.parent = mesh
      this.boats.push({ mesh, kind: kind.name, x: 0, z: 0, heading: 0, s: ((i + 0.5) / n) * length, dir: i % 2 ? 1 : -1,
        speed: kind.speed, lane: kind.lane, half: L, phase: i * 1.7 })
    }
  }

  get length(): number { return this.cum[this.cum.length - 1] }

  private at(s: number): { x: number; z: number; dx: number; dz: number } {
    const c = this.cum
    let lo = 0
    let hi = c.length - 1
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (c[m] <= s) lo = m; else hi = m }
    const a = this.pts[lo]
    const b = this.pts[hi]
    const t = c[hi] > c[lo] ? Math.max(0, Math.min(1, (s - c[lo]) / (c[hi] - c[lo]))) : 0
    // the direction over a longer chord, so a boat does not twitch at every sample of the line
    const p = this.pts[Math.max(0, lo - 3)]
    const q = this.pts[Math.min(this.pts.length - 1, hi + 3)]
    const l = Math.hypot(q.x - p.x, q.z - p.z) || 1
    return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t, dx: (q.x - p.x) / l, dz: (q.z - p.z) / l }
  }

  /** where each boat is (tools/: the probes aim at them) */
  positions(): { kind: string; x: number; z: number; heading: number; drawn: boolean }[] {
    return this.boats.map((b) => ({ kind: b.kind, x: b.x, z: b.z, heading: b.heading, drawn: b.mesh.isEnabled() }))
  }

  update(dt: number, rider: { x: number; z: number }): void {
    this.t += dt
    const L = this.length
    for (const b of this.boats) {
      b.s += b.dir * b.speed * dt
      // at the end of the line it goes about, crossing to the other side of the channel as it turns
      if (b.s > L - b.half - 30 || b.s < b.half + 30) { b.dir = (b.s > L / 2 ? -1 : 1); b.s = Math.max(b.half + 30, Math.min(L - b.half - 30, b.s)) }
      const p = this.at(b.s)
      const fx = p.dx * b.dir
      const fz = p.dz * b.dir
      // keep right: the right of the way it is going is (fz, −fx)
      const x = p.x + fz * b.lane
      const z = p.z - fx * b.lane
      b.x = x
      b.z = z
      b.heading = Math.atan2(fx, fz)
      const far = Math.hypot(x - rider.x, z - rider.z) > 1600
      const level = far ? null : this.waterAt(x, z)
      if (level === null) { b.mesh.setEnabled(false); continue }
      b.mesh.setEnabled(true)
      b.mesh.position.set(x, level + Math.sin(this.t * 0.9 + b.phase) * 0.04, z)
      b.mesh.rotation.set(Math.sin(this.t * 0.6 + b.phase) * 0.006, Math.atan2(fx, fz), Math.sin(this.t * 0.7 + b.phase) * 0.012)
    }
  }
}

/** The region's river line, if it has one (tools/river.ts). */
export async function riverLine(base: string, city: string): Promise<number[] | null> {
  try {
    const r = await fetch(new URL(`cities/${city}/river.json`, base).href)
    const t = await r.text()
    if (!r.ok || !t.trimStart().startsWith('{')) return null
    return (JSON.parse(t) as { points: number[] }).points
  } catch { return null }
}
