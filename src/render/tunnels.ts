/**
 * STREET TUNNELS, drawn (owner, 2026-09-29, the Stockton Tunnel: "it would be so cool if we could zoom through street
 * tunnels"). The ways are `bore` edges (tools/tunnels.ts): ridden like streets, at their own mouth-to-mouth heights,
 * and never drawn by the street renderer — so this draws them, and only this.
 *
 * The difficulty is that the city is drawn in rendering GROUPS with the depth buffer cleared between them (the
 * ground, then the roads, then everything else — ARCHITECTURE-MAP §14): nothing in the last group is hidden by the
 * ground. A tube drawn under a hill would show straight through the hill; so would a car inside it. So:
 *
 *   * the TUBE (road, pavements, walls, arched ceiling, lamps) is drawn only while the camera is INSIDE it — and
 *     then it surrounds the camera, covering the ground and everything beyond it except what shows through the
 *     far mouth, which is exactly what a tunnel looks like;
 *   * each MOUTH, seen from in front of it, shows the first ENTRY metres of the tube, darkening into the hill and
 *     ending in black — a tunnel you look into, not a black blob — and only while the camera is in front of it,
 *     so it cannot show through the hill from anywhere else;
 *   * each HEADWALL (the portal face, with wing walls splayed back into the hillside) is one-sided, facing out:
 *     from behind or above it is not drawn at all. Its top is the ground over the tunnel just inside the mouth,
 *     held between a band over the arch and a few metres above it, and the wings follow the slope they hold back;
 *   * what is INSIDE a tunnel — cars, walkers — is hidden while the camera is outside that tunnel (`hides`).
 *
 * (Owner, after the first version: "the portals are really ugly on the outside though and have a lot of rendering
 * glitches" — a flat black arch, visible through the hill from behind, and headwalls standing out of hillsides.)
 *
 * Shared: any city's street tunnels. A recognisable portal for one of them (the Stockton Tunnel's) is a landmark's
 * job, laid over this.
 */
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import type { Scene } from '@babylonjs/core/scene'
import { MeshBuilder } from './buildings.ts'
import { cartoonMaterial } from './cartoon-material.ts'
import { unpackPoints, type PackedEdge } from '../city/package.ts'
import type { Terrain } from '../city/terrain.ts'

type P = { x: number; z: number }
type Rgb = [number, number, number]
type V3 = [number, number, number]

const ROAD: Rgb = [0.2, 0.2, 0.21]
const KERB: Rgb = [0.5, 0.49, 0.47]
const TILE: Rgb = [0.78, 0.74, 0.62]
const LAMP: Rgb = [1, 0.95, 0.78]
const PAINT: Rgb = [0.95, 0.8, 0.2]
const CONCRETE: Rgb = [0.66, 0.64, 0.6]
const RING: Rgb = [0.74, 0.72, 0.67]
const DARK: Rgb = [0.02, 0.02, 0.025]
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

/** the walls stand this high before the arch springs, and the arch rises this much of the half-width */
const WALL = 3.2
const ARCH = 0.35
/** the pavements inside, at most this wide */
const PAVEMENT = 1.8
/** how far into the tunnel is seen from outside a mouth, fading into the dark */
const ENTRY = 14
/** …from this close; and the portals from this close (both are drawn before the ground occluder: city.ts `rank`) */
const ENTRY_SEEN = 120
const PORTAL_SEEN = 250
/** the headwall stands at least this much, and at most this much, over the top of the arch */
const BAND = 1.0
const TALLEST = 4
/** the wing walls: how long, and how far they splay back from the portal face */
const WING = 7
const SPLAY = (35 * Math.PI) / 180

interface Mouth {
  /** the centre of the opening, outward (out of the tunnel), and the road height there */
  p: P
  fx: number
  fz: number
  y: number
  /** the first metres of the tube, seen from in front */
  entry: Mesh
  shown: boolean
}

interface Tunnel {
  edges: Set<number>
  /** the centreline, mouth to mouth, with its heights and running distance */
  line: P[]
  ys: number[]
  cum: number[]
  /** half the road, and half the whole bore (road and pavements) */
  road: number
  half: number
  tube: Mesh
  headwalls: Mesh
  mouths: Mouth[]
  inside: boolean
}

export class Tunnels {
  private readonly scene: Scene
  private readonly terrain: Terrain
  private readonly bores = new Map<number, PackedEdge>()
  private tunnels: Tunnel[] = []
  private dirty = false
  /** which tunnel each bore edge (carriageway and pavements) belongs to */
  private readonly edgeTunnel = new Map<number, Tunnel>()

  constructor(scene: Scene, terrain: Terrain) {
    this.scene = scene
    this.terrain = terrain
  }

  /** A tile's edges arrived: keep its bores. */
  add(edges: PackedEdge[]): void {
    for (const e of edges) if (e.bore && !this.bores.has(e.id)) { this.bores.set(e.id, e); this.dirty = true }
  }

  /** Is this edge inside a tunnel the camera is not in? Then whatever is on it must not be drawn. */
  hides(edgeId: number): boolean {
    const t = this.edgeTunnel.get(edgeId)
    return !!t && !t.inside
  }

  /** Is the camera inside a tunnel? */
  get cameraInside(): boolean { return this.tunnels.some((t) => t.inside) }

  /** Every frame: build what arrived; show each tunnel's inside, or the mouths the camera is in front of. */
  update(camera: { x: number; y: number; z: number }): void {
    if (this.dirty) { this.dirty = false; this.rebuild() }
    for (const t of this.tunnels) {
      const inside = this.contains(t, camera)
      if (inside !== t.inside) { t.inside = inside; t.tube.setEnabled(inside) }
      const near = t.mouths.some((m) => Math.hypot(camera.x - m.p.x, camera.z - m.p.z) < PORTAL_SEEN)
      if (near !== t.headwalls.isEnabled()) t.headwalls.setEnabled(near)
      for (const m of t.mouths) {
        const show = !inside && inFront(m, t.half, camera)
        if (show !== m.shown) { m.shown = show; m.entry.setEnabled(show) }
      }
    }
  }

  /** the camera is in the bore: over its line, between its walls, under its crown */
  private contains(t: Tunnel, c: { x: number; y: number; z: number }): boolean {
    const n = nearest(t.line, t.cum, c)
    // past the mouth, between the walls, and UNDER the crown: at the mouth the crown is about level with the street
    // above, and a camera passing over it on that street is not in the tunnel
    if (n.along <= 1.5 || n.along >= t.cum[t.cum.length - 1] - 1.5 || n.off > t.half) return false
    const y = interp(t.cum, t.ys, n.along)
    return c.y > y - 1 && c.y < y + WALL + t.half * ARCH - 0.3
  }

  private rebuild(): void {
    for (const t of this.tunnels) { t.tube.dispose(); t.headwalls.dispose(); for (const m of t.mouths) m.entry.dispose() }
    this.tunnels = []
    this.edgeTunnel.clear()
    const roads = [...this.bores.values()].filter((e) => !e.foot)
    const byNode = new Map<number, PackedEdge[]>()
    for (const e of roads) for (const n of [e.a, e.b]) (byNode.get(n) ?? byNode.set(n, []).get(n)!).push(e)
    const seen = new Set<number>()
    for (const start of roads) {
      if (seen.has(start.id)) continue
      const chain: PackedEdge[] = []
      const todo = [start]
      seen.add(start.id)
      while (todo.length) {
        const e = todo.pop()!
        chain.push(e)
        for (const n of [e.a, e.b]) for (const o of byNode.get(n) ?? []) if (!seen.has(o.id)) { seen.add(o.id); todo.push(o) }
      }
      const count = new Map<number, number>()
      for (const e of chain) for (const n of [e.a, e.b]) count.set(n, (count.get(n) ?? 0) + 1)
      const ends = [...count].filter(([, c]) => c === 1).map(([n]) => n)
      // a tunnel whose other end has not streamed in yet is built when it does
      if (ends.length !== 2) continue
      const line: P[] = []
      const ys: number[] = []
      let node = ends[0]
      const used = new Set<number>()
      for (let guard = 0; guard < chain.length; guard++) {
        const e = chain.find((c) => !used.has(c.id) && (c.a === node || c.b === node))
        if (!e) break
        used.add(e.id)
        const rev = e.b === node
        const p = unpackPoints(e.points)
        const h = e.heights ?? p.map((q) => this.terrain.heightAt(q.x, q.z))
        const pts = rev ? [...p].reverse() : p
        const hs = rev ? [...h].reverse() : h
        const skip = line.length === 0 ? 0 : 1
        line.push(...pts.slice(skip))
        ys.push(...hs.slice(skip))
        node = rev ? e.a : e.b
      }
      if (used.size !== chain.length) continue
      const cum = [0]
      for (let i = 1; i < line.length; i++) cum.push(cum[i - 1] + Math.hypot(line[i].x - line[i - 1].x, line[i].z - line[i - 1].z))
      const L = cum[cum.length - 1]
      const road = Math.max(...chain.map((e) => e.width)) / 2
      const walk = Math.min(PAVEMENT, Math.max(...chain.map((e) => e.walk ?? 0)))
      const half = road + walk
      // the tube, whole, for inside (both sides drawn: it only ever surrounds the camera)
      const tube = new MeshBuilder()
      this.bore(tube, line, ys, cum, road, half, 0, L, () => 1)
      const t: Tunnel = { edges: new Set(chain.map((e) => e.id)), line, ys, cum, road, half, inside: false,
        tube: this.mesh(tube, 'tunnel:tube', false), headwalls: this.mesh(this.headwalls(line, ys, half), 'tunnel:headwalls', true),
        mouths: [] }
      t.tube.setEnabled(false)
      // each mouth's first metres, darkening inward, ending in black — one-sided, facing in
      for (const end of [0, 1] as const) {
        const i = end === 0 ? 0 : line.length - 1
        const j = end === 0 ? 1 : line.length - 2
        const l = Math.hypot(line[i].x - line[j].x, line[i].z - line[j].z) || 1
        const fx = (line[i].x - line[j].x) / l
        const fz = (line[i].z - line[j].z) / l
        const from = end === 0 ? 0 : L - ENTRY
        const to = end === 0 ? Math.min(L, ENTRY) : L
        const entry = new MeshBuilder()
        const depth = (d: number): number => (end === 0 ? d : L - d)
        this.bore(entry, line, ys, cum, road, half, Math.max(0, from), to, (d) => Math.max(0.12, 1 - 0.85 * (depth(d) / ENTRY)))
        this.darkEnd(entry, line, ys, cum, half, end === 0 ? Math.min(L, ENTRY) : Math.max(0, L - ENTRY), end === 0 ? 1 : -1)
        const m: Mouth = { p: line[i], fx, fz, y: ys[i], entry: this.mesh(entry, 'tunnel:entry', true), shown: false }
        m.entry.setEnabled(false)
        t.mouths.push(m)
      }
      for (const id of t.edges) this.edgeTunnel.set(id, t)
      // its pavements: the footway bores along it
      for (const f of this.bores.values()) {
        if (!f.foot) continue
        const p = unpackPoints(f.points)
        if (p.every((q) => nearest(line, cum, q).off < half + 4)) this.edgeTunnel.set(f.id, t)
      }
      this.tunnels.push(t)
    }
  }

  /**
   * The bore between `from` and `to` metres along: road with its centre lines, kerbs and pavements, walls, the arch
   * and its lamps — every face facing IN (so a one-sided copy is seen only from inside, or from in front of a mouth).
   * `shade` darkens it by distance along (the entry, fading into the hill).
   */
  private bore(out: MeshBuilder, line: P[], ys: number[], cum: number[], road: number, half: number,
    from: number, to: number, shade: (d: number) => number): void {
    const crown = half * ARCH
    const seg = 8
    const arch: [number, number, number][] = []
    for (let i = 0; i <= seg; i++) {
      const a = Math.PI * (i / seg)
      arch.push([-Math.cos(a) * half, WALL + Math.sin(a) * crown, a])
    }
    const L = cum[cum.length - 1]
    const n = Math.max(1, Math.ceil((to - from) / 2))
    const at = (d: number): { p: P; y: number; nx: number; nz: number } => {
      const p = along(line, cum, d)
      const q = along(line, cum, Math.min(L, d + 0.5))
      const r = along(line, cum, Math.max(0, d - 0.5))
      const l = Math.hypot(q.x - r.x, q.z - r.z) || 1
      return { p, y: interp(cum, ys, d), nx: -(q.z - r.z) / l, nz: (q.x - r.x) / l }
    }
    const w = (s: ReturnType<typeof at>, o: number, h: number): V3 => [s.p.x + s.nx * o, s.y + h, s.p.z + s.nz * o]
    const tint = (c: Rgb, k: number): Rgb => [c[0] * k, c[1] * k, c[2] * k]
    for (let k = 0; k < n; k++) {
      const d0 = from + ((to - from) * k) / n
      const d1 = from + ((to - from) * (k + 1)) / n
      const s0 = at(d0)
      const s1 = at(d1)
      const sh = shade((d0 + d1) / 2)
      out.quad([w(s0, -road, 0), w(s0, road, 0), w(s1, road, 0), w(s1, -road, 0)], [0, 1, 0], UV, tint(ROAD, sh), 0)
      for (const o of [-0.12, 0.12]) out.quad([w(s0, o - 0.05, 0.02), w(s0, o + 0.05, 0.02), w(s1, o + 0.05, 0.02), w(s1, o - 0.05, 0.02)], [0, 1, 0], UV, tint(PAINT, sh), 0)
      for (const side of [-1, 1]) {
        const inward: V3 = [-side * s0.nx, 0, -side * s0.nz]
        out.quad([w(s0, side * road, 0), w(s1, side * road, 0), w(s1, side * road, 0.15), w(s0, side * road, 0.15)], inward, UV, tint(KERB, sh), 0)
        out.quad([w(s0, side * road, 0.15), w(s0, side * half, 0.15), w(s1, side * half, 0.15), w(s1, side * road, 0.15)], [0, 1, 0], UV, tint(KERB, sh), 0)
        out.quad([w(s0, side * half, 0.15), w(s1, side * half, 0.15), w(s1, side * half, WALL), w(s0, side * half, WALL)], inward, UV, tint(TILE, sh), 0)
      }
      for (let i = 0; i < seg; i++) {
        const [o0, h0, a0] = arch[i]
        const [o1, h1, a1] = arch[i + 1]
        const am = (a0 + a1) / 2
        // facing the axis: at the left springing that is to the right, at the crown straight down
        const nrm: V3 = [s0.nx * Math.cos(am), -Math.sin(am), s0.nz * Math.cos(am)]
        out.quad([w(s0, o0, h0), w(s0, o1, h1), w(s1, o1, h1), w(s1, o0, h0)], nrm, UV, tint(TILE, sh), 0)
      }
      // a lamp every 8 m, each side of the crown
      if (Math.floor(d0 / 8) !== Math.floor(d1 / 8) || k === 0) {
        for (const side of [-1, 1]) {
          const o = side * half * 0.45
          const hh = WALL + Math.sqrt(Math.max(0, 1 - (o / half) ** 2)) * crown - 0.05
          out.quad([w(s0, o - 0.25, hh), w(s0, o + 0.25, hh), w(s1, o + 0.25, hh), w(s1, o - 0.25, hh)], [0, -1, 0], UV, LAMP, 0)
        }
      }
    }
  }

  /** the black at the back of what a mouth shows: the bore's cross-section, facing back out (`dir` +1 at mouth 0) */
  private darkEnd(out: MeshBuilder, line: P[], ys: number[], cum: number[], half: number, d: number, dir: 1 | -1): void {
    const p = along(line, cum, d)
    const q = along(line, cum, Math.max(0, Math.min(cum[cum.length - 1], d + 0.5 * dir)))
    const l = Math.hypot(q.x - p.x, q.z - p.z) || 1
    // the way back to the mouth
    const bx = -(q.x - p.x) / l
    const bz = -(q.z - p.z) / l
    const nx = -bz
    const nz = bx
    const y = interp(cum, ys, d)
    const crown = half * ARCH
    const top = (o: number): number => WALL + Math.sqrt(Math.max(0, 1 - (o / half) ** 2)) * crown
    const segs = 12
    for (let k = 0; k < segs; k++) {
      const o0 = -half + (2 * half * k) / segs
      const o1 = -half + (2 * half * (k + 1)) / segs
      const w = (o: number, h: number): V3 => [p.x + nx * o, y + h, p.z + nz * o]
      out.quad([w(o0, 0), w(o1, 0), w(o1, top(o1)), w(o0, top(o0))], [bx, 0, bz], UV, DARK, 0)
    }
  }

  /**
   * The portal at each mouth, facing out: the headwall round the arch, from the arch (and the road, beside it) up to
   * the ground over the tunnel just inside — never less than a band over the arch, never more than a few metres —
   * with a lighter ring round the opening; and a wing wall each side, splayed back into the hillside, its top
   * following the ground it holds back.
   */
  private headwalls(line: P[], ys: number[], half: number): MeshBuilder {
    const out = new MeshBuilder()
    const crown = half * ARCH
    const arch = (o: number): number => WALL + Math.sqrt(Math.max(0, 1 - (o / half) ** 2)) * crown
    const peak = WALL + crown
    for (const end of [0, 1]) {
      const i = end === 0 ? 0 : line.length - 1
      const j = end === 0 ? 1 : line.length - 2
      const p = line[i]
      const y = ys[i]
      // outward: from the inside of the tunnel towards its mouth
      const l = Math.hypot(p.x - line[j].x, p.z - line[j].z) || 1
      const fx = (p.x - line[j].x) / l
      const fz = (p.z - line[j].z) / l
      const nx = -fz
      const nz = fx
      const face: V3 = [fx, 0, fz]
      const w = (o: number, h: number, back = 0): V3 => [p.x + nx * o - fx * back, y + h, p.z + nz * o - fz * back]
      // the ground standing over the tunnel just inside the mouth, across the portal
      let over = -Infinity
      for (let o = -half; o <= half; o += 1) over = Math.max(over, this.terrain.heightAt(p.x + nx * o - fx * 4, p.z + nz * o - fz * 4) - y)
      const top = Math.max(peak + BAND, Math.min(peak + TALLEST, over))
      const edge = half + 0.8
      const step = 0.5
      for (let o = -edge; o < edge - 1e-6; o += step) {
        const o1 = o + step
        const within = Math.abs(o + step / 2) < half
        out.quad([w(o, within ? arch(o) : 0), w(o1, within ? arch(o1) : 0), w(o1, top), w(o, top)], face, UV, CONCRETE, 0)
      }
      // the ring round the opening, a hand's breadth proud of the face
      const segs = 14
      for (let k = 0; k < segs; k++) {
        const a0 = Math.PI * (k / segs)
        const a1 = Math.PI * ((k + 1) / segs)
        const pt = (a: number, r: number): V3 => w(-Math.cos(a) * r, WALL + Math.sin(a) * crown * (r / half), -0.15)
        const q = (a: number, r: number): V3 => { const v = pt(a, r); return [v[0] + fx * 0.3, v[1], v[2] + fz * 0.3] }
        out.quad([q(a0, half), q(a1, half), q(a1, half + 0.45), q(a0, half + 0.45)], face, UV, RING, 0)
      }
      for (const sx of [-1, 1]) out.quad([w(sx * half, 0, -0.15), w(sx * (half + 0.45), 0, -0.15), w(sx * (half + 0.45), WALL, -0.15), w(sx * half, WALL, -0.15)], face, UV, RING, 0)
      // the wings: from each side of the headwall, back into the hill
      for (const side of [-1, 1]) {
        const ux = nx * side * Math.cos(SPLAY) + fx * Math.sin(SPLAY)
        const uz = nz * side * Math.cos(SPLAY) + fz * Math.sin(SPLAY)
        // facing out from the portal, away from the hill
        const wn: V3 = [fx * Math.cos(SPLAY) - nx * side * Math.sin(SPLAY), 0, fz * Math.cos(SPLAY) - nz * side * Math.sin(SPLAY)]
        const start = { x: p.x + nx * side * edge, z: p.z + nz * side * edge }
        const n = 7
        for (let k = 0; k < n; k++) {
          const t0 = (WING * k) / n
          const t1 = (WING * (k + 1)) / n
          const a = { x: start.x + ux * t0, z: start.z + uz * t0 }
          const b = { x: start.x + ux * t1, z: start.z + uz * t1 }
          // its top: the headwall's at the corner, easing to the ground it holds back
          const ht = (q: P, t: number): number => {
            const g = this.terrain.heightAt(q.x, q.z) - y
            const f = t / WING
            return Math.max(0.6, Math.min(top, top * (1 - f) + g * f))
          }
          out.quad([[a.x, y, a.z], [b.x, y, b.z], [b.x, y + ht(b, t1), b.z], [a.x, y + ht(a, t0), a.z]], wn, UV, CONCRETE, 0)
        }
      }
    }
    return out
  }

  private mesh(out: MeshBuilder, name: string, culled: boolean): Mesh {
    const m = new Mesh(name, this.scene)
    out.toVertexData().applyToMesh(m)
    // the tube is seen only from inside, whole; the portals and entries only from in front, one-sided
    const mat = cartoonMaterial(this.scene, culled ? 'cartoonTunnelFace' : 'cartoonTunnel', false)
    mat.backFaceCulling = culled
    m.material = mat
    m.renderingGroupId = 3
    m.isPickable = false
    m.alwaysSelectAsActiveMesh = true
    m.freezeWorldMatrix()
    return m
  }
}

/** the camera is in front of a mouth: outside it, and within a wide cone of its opening */
function inFront(m: Mouth, half: number, c: { x: number; y: number; z: number }): boolean {
  const dx = c.x - m.p.x
  const dz = c.z - m.p.z
  const ahead = dx * m.fx + dz * m.fz
  if (ahead < 0.5) return false
  const side = Math.abs(dx * -m.fz + dz * m.fx)
  // (and near: drawn before the ground occluder, it would show through a hill between a far camera and the mouth)
  return ahead < ENTRY_SEEN && side < half + ahead * 1.5 && c.y < m.y + 40
}

function interp(cum: number[], ys: number[], d: number): number {
  let i = 1
  while (i < cum.length - 1 && cum[i] < d) i++
  const t = Math.max(0, Math.min(1, (d - cum[i - 1]) / (cum[i] - cum[i - 1] || 1)))
  return ys[i - 1] + (ys[i] - ys[i - 1]) * t
}

function along(line: P[], cum: number[], d: number): P {
  let i = 1
  while (i < line.length - 1 && cum[i] < d) i++
  const t = Math.max(0, Math.min(1, (d - cum[i - 1]) / (cum[i] - cum[i - 1] || 1)))
  return { x: line[i - 1].x + (line[i].x - line[i - 1].x) * t, z: line[i - 1].z + (line[i].z - line[i - 1].z) * t }
}

function nearest(line: P[], cum: number[], q: P): { along: number; off: number } {
  let best = { along: 0, off: Infinity }
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1]
    const dx = line[i].x - a.x
    const dz = line[i].z - a.z
    const l2 = dx * dx + dz * dz || 1e-9
    const t = Math.max(0, Math.min(1, ((q.x - a.x) * dx + (q.z - a.z) * dz) / l2))
    const off = Math.hypot(a.x + dx * t - q.x, a.z + dz * t - q.z)
    if (off < best.off) best = { along: cum[i - 1] + (cum[i] - cum[i - 1]) * t, off }
  }
  return best
}
