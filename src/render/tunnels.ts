/**
 * STREET TUNNELS, drawn (owner, 2026-09-29, the Stockton Tunnel: "it would be so cool if we could zoom through street
 * tunnels"). The ways are `bore` edges (tools/tunnels.ts): ridden like streets, at their own mouth-to-mouth heights,
 * and never drawn by the street renderer — so this draws them, and only this.
 *
 * The difficulty is that the city is drawn in rendering GROUPS with the depth buffer cleared between them (the
 * ground, then the roads, then everything else — ARCHITECTURE-MAP §14): nothing in the last group is hidden by the
 * ground. A tube drawn under a hill would show straight through the hill; so would a car inside it. So:
 *
 *   * the TUBE is drawn only while the camera is INSIDE it — and then it surrounds the camera, covering the ground
 *     and everything beyond it except what shows through the far mouth, which is exactly what a tunnel looks like;
 *   * each MOUTH, seen from in front of it (and near), shows the first ENTRY metres of the tube, darkening into the
 *     hill and ending in black — a tunnel you look into — drawn before the ground occluder (city.ts `rank`);
 *   * each PORTAL faces out and is one-sided: from behind or above it is not drawn at all. A city's own portal (a
 *     region's `TunnelStyle.portal`, e.g. San Francisco's Stockton and Broadway tunnels) replaces the generic one;
 *   * what is INSIDE a tunnel — cars, walkers — is hidden while the camera is outside that tunnel (`hides`).
 *
 * The inside is LIT BY ITS LAMPS, not the sun: an unlit material showing the colours baked in here (warm walls,
 * bright lamps), so a tunnel reads as a tunnel at any time of day.
 *
 * Shared: any city's street tunnels. What a particular tunnel looks like — its cross-section, its colours, its
 * portals — is a `TunnelStyle`, from the region's own file (render/landmarks/sf/tunnels.ts), keyed by name (or by
 * `name#layer`).
 */
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import type { Scene } from '@babylonjs/core/scene'
import { MeshBuilder } from './buildings.ts'
import { cartoonMaterial } from './cartoon-material.ts'
import { unpackPoints, type PackedEdge } from '../city/package.ts'
import type { Terrain } from '../city/terrain.ts'

type P = { x: number; z: number }
export type Rgb = [number, number, number]
export type V3 = [number, number, number]

const ROAD: Rgb = [0.24, 0.24, 0.25]
const PAINT: Rgb = [0.95, 0.8, 0.2]
const KERB: Rgb = [0.55, 0.54, 0.51]
const RAIL: Rgb = [0.35, 0.33, 0.3]
const LAMP: Rgb = [1, 0.96, 0.82]
const CONCRETE: Rgb = [0.66, 0.64, 0.6]
const RING: Rgb = [0.74, 0.72, 0.67]
const DARK: Rgb = [0.02, 0.02, 0.025]
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

/** how far into the tunnel is seen from outside a mouth, fading into the dark, and from how far away */
const ENTRY = 16
const ENTRY_SEEN = 120
const PORTAL_SEEN = 250
/** the generic headwall stands at least this much, and at most this much, over the top of the opening */
const BAND = 1.0
const TALLEST = 4
/** the generic wing walls: how long, and how far they splay back from the portal face */
const WING = 7
const SPLAY = (35 * Math.PI) / 180

/**
 * What a tunnel looks like. Every field optional: the generic style is a single bore with a segmental arch.
 */
export interface TunnelStyle {
  /**
   * The vault over each bore: `segmental` (a wide, low arch on short walls — the Stockton Tunnel) or `round` (a
   * semicircle on low walls — the Broadway Tunnel's bores).
   */
  vault?: 'segmental' | 'round'
  /** height of the side walls before the vault springs, and of the crown above the road, metres */
  spring?: number
  crown?: number
  /** two bores side by side, one each way, with a pier this wide between them (the Broadway Tunnel) */
  twin?: number
  /** the walls up to this height (tiles), and the vault above */
  wall?: Rgb
  wallTop?: number
  vaultColour?: Rgb
  /** lamps: a line along the crown of each bore, or a row along each springing line */
  lamps?: 'crown' | 'springs'
  /** raised pavements with a railing along their edge (Stockton), or a narrow catwalk on one side only (Broadway) */
  walks?: 'both' | 'catwalk'
  /**
   * A portal of its own at a mouth, facing the way it looks out (`n`/`s`/`e`/`w`, by the nearest compass point), or
   * null for the generic one. Built in the portal's own frame: x across (right, as seen from outside), y up from the
   * road at the mouth, z out of the tunnel towards the viewer; the face of the portal is z = 0.
   */
  portal?: (ctx: PortalContext) => PortalParts | null
}

/**
 * A portal's two parts: the FACE round the opening (drawn before the ground occluder, since a mouth sits in a cut
 * below the ground about it, and only within a few hundred metres) and a MASS standing over it — a building the
 * tunnel runs under (the Broadway Tunnel's east mouth is under the Chinatown Public Health Center) — drawn like any
 * building, hidden by hills, seen from far off.
 */
export interface PortalParts { face?: MeshBuilder; mass?: MeshBuilder }

export interface PortalContext {
  /** which way the mouth looks: 'n' | 's' | 'e' | 'w' */
  facing: 'n' | 's' | 'e' | 'w'
  /** half the width of the whole opening (bores, pier and walks), metres */
  half: number
  /** the opening's top at a distance across from the centre (null where it is solid: between twin bores) */
  opening(x: number): number | null
  /** the top of the opening, metres over the road */
  crown: number
  /** the height over the road of the ground (or a street) standing over the tunnel just inside the mouth, at x */
  over(x: number): number
  /** the height over the road of the ground at a point in the portal's frame (for wing walls) */
  ground(x: number, z: number): number
}

interface Section {
  /** the cross-section: floor pieces, the inside surface of the walls and vaults (left to right), lamps, rails */
  floors: { a: number; b: number; y: number; col: Rgb; paint?: boolean }[]
  kerbs: { o: number; lo: number; hi: number; facing: -1 | 1 }[]
  surface: { a: [number, number]; b: [number, number]; col: Rgb }[]
  lamps: { o: number; y: number; w: number; facing: [number, number] }[]
  rails: { o: number; y: number }[]
  /** the opening's top at o (null where solid), and the highest point */
  top(o: number): number | null
  crown: number
  half: number
}

interface Mouth {
  p: P
  fx: number
  fz: number
  y: number
  entry: Mesh
  shown: boolean
}

interface Tunnel {
  name: string
  edges: Set<number>
  line: P[]
  ys: number[]
  cum: number[]
  section: Section
  tube: Mesh
  portals: Mesh
  mass: Mesh | null
  mouths: Mouth[]
  inside: boolean
}

export class Tunnels {
  private readonly scene: Scene
  private readonly terrain: Terrain
  private readonly styles: Record<string, TunnelStyle>
  private readonly bores = new Map<number, PackedEdge>()
  private tunnels: Tunnel[] = []
  private dirty = false
  private readonly edgeTunnel = new Map<number, Tunnel>()
  private unlit: StandardMaterial | null = null

  constructor(scene: Scene, terrain: Terrain, styles: Record<string, TunnelStyle> = {}) {
    this.scene = scene
    this.terrain = terrain
    this.styles = styles
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

  /**
   * The height of the vault over the road at (x, z), metres, if that point is in a tunnel (or within `behind` metres
   * outside a mouth, along its line — the chase camera is behind the rider as they go in); null elsewhere. The lower
   * of the crown and the vault over the point, less a little, so a camera there stays under it.
   */
  headroom(x: number, z: number, behind: number): number | null {
    for (const t of this.tunnels) {
      const n = nearest(t.line, t.cum, { x, z })
      const L = t.cum[t.cum.length - 1]
      if (n.off > t.section.half || n.along < -behind || n.along > L + behind) continue
      // outside the mouth the nearest point is the mouth itself (along clamps to 0 or L): only within the bore's width
      const top = t.section.top(0) ?? t.section.top(t.section.half / 2) ?? t.section.crown
      return Math.min(t.section.crown, top + 0.4)
    }
    return null
  }

  /** Is the camera inside a tunnel? */
  get cameraInside(): boolean { return this.tunnels.some((t) => t.inside) }

  /** the tunnels built so far, for probes: name, length, the two mouths */
  get list(): { name: string; length: number; mouths: { x: number; z: number; y: number; fx: number; fz: number }[] }[] {
    return this.tunnels.map((t) => ({ name: t.name, length: t.cum[t.cum.length - 1],
      mouths: t.mouths.map((m) => ({ x: m.p.x, z: m.p.z, y: m.y, fx: m.fx, fz: m.fz })) }))
  }

  /** Every frame: build what arrived; show each tunnel's inside, or the mouths the camera is in front of. */
  update(camera: { x: number; y: number; z: number }): void {
    if (this.dirty) { this.dirty = false; this.rebuild() }
    for (const t of this.tunnels) {
      const inside = this.contains(t, camera)
      if (inside !== t.inside) { t.inside = inside; t.tube.setEnabled(inside) }
      const near = t.mouths.some((m) => Math.hypot(camera.x - m.p.x, camera.z - m.p.z) < PORTAL_SEEN)
      if (near !== t.portals.isEnabled()) t.portals.setEnabled(near)
      // (a building over a mouth is a building: seen from as far as the city draws them)
      for (const m of t.mouths) {
        const show = !inside && inFront(m, t.section.half, camera)
        if (show !== m.shown) { m.shown = show; m.entry.setEnabled(show) }
      }
    }
  }

  /** the camera is in the bore: over its line, between its walls, under its crown */
  private contains(t: Tunnel, c: { x: number; y: number; z: number }): boolean {
    const n = nearest(t.line, t.cum, c)
    if (n.along <= 1.5 || n.along >= t.cum[t.cum.length - 1] - 1.5 || n.off > t.section.half) return false
    const y = interp(t.cum, t.ys, n.along)
    return c.y > y - 1 && c.y < y + t.section.crown - 0.3
  }

  private rebuild(): void {
    for (const t of this.tunnels) { t.tube.dispose(); t.portals.dispose(); t.mass?.dispose(); for (const m of t.mouths) m.entry.dispose() }
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
      const name = chain.find((e) => e.name)?.name ?? ''
      // (a style may be for one LAYER of a name: the two roadways of a double-deck tunnel are two tunnels here)
      const style = this.styles[`${name}#${chain[0].layer ?? 0}`] ?? this.styles[name] ?? {}
      const road = Math.max(...chain.map((e) => e.width)) / 2
      const walk = Math.min(1.8, Math.max(...chain.map((e) => e.walk ?? 0)))
      const section = sectionFor(style, road, walk)
      const tube = new MeshBuilder()
      this.bore(tube, section, line, ys, cum, 0, L, () => 1)
      const parts = this.portals(style, section, line, ys)
      const t: Tunnel = { name, edges: new Set(chain.map((e) => e.id)), line, ys, cum, section, inside: false,
        tube: this.mesh(tube, 'tunnel:tube', 'unlit'), portals: this.mesh(parts.face, 'tunnel:portals', 'face'),
        mass: parts.mass.triangles > 0 ? this.mesh(parts.mass, 'tunnel:mass', 'face') : null, mouths: [] }
      t.tube.setEnabled(false)
      for (const end of [0, 1] as const) {
        const i = end === 0 ? 0 : line.length - 1
        const j = end === 0 ? 1 : line.length - 2
        const l = Math.hypot(line[i].x - line[j].x, line[i].z - line[j].z) || 1
        const fx = (line[i].x - line[j].x) / l
        const fz = (line[i].z - line[j].z) / l
        const entry = new MeshBuilder()
        const from = end === 0 ? 0 : Math.max(0, L - ENTRY)
        const to = end === 0 ? Math.min(L, ENTRY) : L
        const depth = (d: number): number => (end === 0 ? d : L - d)
        this.bore(entry, section, line, ys, cum, from, to, (d) => Math.max(0.1, 1 - 0.88 * (depth(d) / ENTRY)))
        this.darkEnd(entry, section, line, ys, cum, end === 0 ? to : from, end === 0 ? 1 : -1)
        const m: Mouth = { p: line[i], fx, fz, y: ys[i], entry: this.mesh(entry, 'tunnel:entry', 'unlit'), shown: false }
        m.entry.setEnabled(false)
        t.mouths.push(m)
      }
      for (const id of t.edges) this.edgeTunnel.set(id, t)
      for (const f of this.bores.values()) {
        if (!f.foot) continue
        const p = unpackPoints(f.points)
        if (p.every((q) => nearest(line, cum, q).off < section.half + 4)) this.edgeTunnel.set(f.id, t)
      }
      this.tunnels.push(t)
    }
  }

  /**
   * The bore between `from` and `to` metres along, swept from its cross-section, every face facing IN (so a
   * one-sided copy is seen only from inside, or from in front of a mouth). `shade` darkens it by distance along.
   */
  private bore(out: MeshBuilder, s: Section, line: P[], ys: number[], cum: number[], from: number, to: number,
    shade: (d: number) => number): void {
    const L = cum[cum.length - 1]
    const n = Math.max(1, Math.ceil((to - from) / 2))
    const at = (d: number): { p: P; y: number; nx: number; nz: number; fx: number; fz: number } => {
      const p = along(line, cum, d)
      const q = along(line, cum, Math.min(L, d + 0.5))
      const r = along(line, cum, Math.max(0, d - 0.5))
      const l = Math.hypot(q.x - r.x, q.z - r.z) || 1
      const fx = (q.x - r.x) / l
      const fz = (q.z - r.z) / l
      return { p, y: interp(cum, ys, d), nx: -fz, nz: fx, fx, fz }
    }
    const w = (a: ReturnType<typeof at>, o: number, h: number): V3 => [a.p.x + a.nx * o, a.y + h, a.p.z + a.nz * o]
    const tint = (c: Rgb, k: number): Rgb => [c[0] * k, c[1] * k, c[2] * k]
    for (let k = 0; k < n; k++) {
      const d0 = from + ((to - from) * k) / n
      const d1 = from + ((to - from) * (k + 1)) / n
      const s0 = at(d0)
      const s1 = at(d1)
      const sh = shade((d0 + d1) / 2)
      for (const f of s.floors) {
        out.quad([w(s0, f.a, f.y), w(s0, f.b, f.y), w(s1, f.b, f.y), w(s1, f.a, f.y)], [0, 1, 0], UV, tint(f.col, sh), 0)
        if (f.paint) {
          const c = (f.a + f.b) / 2
          for (const o of [c - 0.12, c + 0.12]) out.quad([w(s0, o - 0.05, f.y + 0.02), w(s0, o + 0.05, f.y + 0.02), w(s1, o + 0.05, f.y + 0.02), w(s1, o - 0.05, f.y + 0.02)], [0, 1, 0], UV, tint(PAINT, sh), 0)
        }
      }
      for (const kb of s.kerbs) {
        out.quad([w(s0, kb.o, kb.lo), w(s1, kb.o, kb.lo), w(s1, kb.o, kb.hi), w(s0, kb.o, kb.hi)], [s0.nx * kb.facing, 0, s0.nz * kb.facing], UV, tint(KERB, sh), 0)
      }
      for (const sg of s.surface) {
        const [oa, ha] = sg.a
        const [ob, hb] = sg.b
        // inward: the segment's normal pointing to the bore's inside (surfaces run left to right, so rotate −90°)
        const dx = ob - oa
        const dy = hb - ha
        const l = Math.hypot(dx, dy) || 1
        const no = dy / l
        const ny = -dx / l
        out.quad([w(s0, oa, ha), w(s0, ob, hb), w(s1, ob, hb), w(s1, oa, ha)], [s0.nx * no, ny, s0.nz * no], UV, tint(sg.col, sh), 0)
      }
      // rails: a tube's worth of posts and a top rail, every 2 m
      for (const r of s.rails) {
        out.quad([w(s0, r.o, r.y + 0.95), w(s1, r.o, r.y + 0.95), w(s1, r.o, r.y + 1.02), w(s0, r.o, r.y + 1.02)], [s0.nx, 0, s0.nz], UV, tint(RAIL, sh), 0)
        out.quad([w(s0, r.o, r.y + 0.95), w(s1, r.o, r.y + 0.95), w(s1, r.o, r.y + 1.02), w(s0, r.o, r.y + 1.02)], [-s0.nx, 0, -s0.nz], UV, tint(RAIL, sh), 0)
        const post = (a: ReturnType<typeof at>): void => {
          for (const side of [-1, 1]) {
            out.quad([w(a, r.o - 0.03, r.y), [w(a, r.o - 0.03, r.y)[0] + a.fx * 0.06, r.y + a.y, w(a, r.o - 0.03, r.y)[2] + a.fz * 0.06],
              [w(a, r.o - 0.03, r.y + 0.95)[0] + a.fx * 0.06, r.y + a.y + 0.95, w(a, r.o - 0.03, r.y + 0.95)[2] + a.fz * 0.06], w(a, r.o - 0.03, r.y + 0.95)],
            [a.nx * side, 0, a.nz * side], UV, tint(RAIL, sh), 0)
          }
        }
        post(s0)
      }
      // lamps every 6 m (unshaded: a lamp is a lamp)
      if (Math.floor(d0 / 6) !== Math.floor(d1 / 6) || k === 0) {
        for (const lp of s.lamps) {
          const [lo, ly] = lp.facing
          const ax = lp.w * Math.abs(ly)
          const ay = lp.w * Math.abs(lo)
          out.quad([w(s0, lp.o - ax, lp.y - ay), w(s0, lp.o + ax, lp.y + ay), w(s1, lp.o + ax, lp.y + ay), w(s1, lp.o - ax, lp.y - ay)],
            [s0.nx * lo, ly, s0.nz * lo], UV, sh < 0.5 ? tint(LAMP, 0.5 + sh) : LAMP, 0)
        }
      }
    }
  }

  /** the black at the back of what a mouth shows: the opening's shape, facing back out (`dir` +1 at mouth 0) */
  private darkEnd(out: MeshBuilder, s: Section, line: P[], ys: number[], cum: number[], d: number, dir: 1 | -1): void {
    const p = along(line, cum, d)
    const q = along(line, cum, Math.max(0, Math.min(cum[cum.length - 1], d + 0.5 * dir)))
    const l = Math.hypot(q.x - p.x, q.z - p.z) || 1
    const bx = -(q.x - p.x) / l
    const bz = -(q.z - p.z) / l
    const nx = -bz * -dir
    const nz = bx * -dir
    const y = interp(cum, ys, d)
    const segs = 32
    for (let k = 0; k < segs; k++) {
      const o0 = -s.half + (2 * s.half * k) / segs
      const o1 = -s.half + (2 * s.half * (k + 1)) / segs
      const t0 = s.top(o0)
      const t1 = s.top(o1)
      if (t0 === null || t1 === null) continue
      const w = (o: number, h: number): V3 => [p.x + nx * o, y + h, p.z + nz * o]
      out.quad([w(o0, 0), w(o1, 0), w(o1, t1), w(o0, t0)], [bx, 0, bz], UV, DARK, 0)
    }
  }

  /** both portals: the style's own where it has one, the generic headwall and wings otherwise */
  private portals(style: TunnelStyle, s: Section, line: P[], ys: number[]): { face: MeshBuilder; mass: MeshBuilder } {
    const face = new MeshBuilder()
    const mass = new MeshBuilder()
    for (const end of [0, 1]) {
      const i = end === 0 ? 0 : line.length - 1
      const j = end === 0 ? 1 : line.length - 2
      const p = line[i]
      const y = ys[i]
      const l = Math.hypot(p.x - line[j].x, p.z - line[j].z) || 1
      const fx = (p.x - line[j].x) / l
      const fz = (p.z - line[j].z) / l
      // the portal's frame, seen from outside: x to the viewer's right, z towards the viewer. The viewer faces −f, so
      // their right is (−fz, fx); the frame then reverses orientation (det −1), hence the winding flip in `put`
      const rx = -fz
      const rz = fx
      const toWorld = (v: V3): V3 => [p.x + rx * v[0] + fx * v[2], y + v[1], p.z + rz * v[0] + fz * v[2]]
      const facing: PortalContext['facing'] = Math.abs(fx) > Math.abs(fz) ? (fx > 0 ? 'e' : 'w') : (fz > 0 ? 'n' : 's')
      const ctx: PortalContext = {
        facing, half: s.half, crown: s.crown,
        // the opening is symmetric, so which way x runs does not matter to it
        opening: (x) => s.top(x),
        over: (x) => this.terrain.heightAt(p.x + rx * x - fx * 4, p.z + rz * x - fz * 4) - y,
        ground: (x, z) => this.terrain.heightAt(p.x + rx * x + fx * z, p.z + rz * x + fz * z) - y,
      }
      const own = style.portal?.(ctx) ?? { face: genericPortal(ctx) }
      // into the world: positions through the frame, normals rotated the same way
      const put = (src: MeshBuilder | undefined, out: MeshBuilder): void => {
        if (!src) return
        const base = out.positions.length / 3
        for (let k = 0; k < src.positions.length; k += 3) {
          const [wx, wy, wz] = toWorld([src.positions[k], src.positions[k + 1], src.positions[k + 2]])
          out.positions.push(wx, wy, wz)
          const nx = src.normals[k]
          const ny = src.normals[k + 1]
          const nz = src.normals[k + 2]
          out.normals.push(rx * nx + fx * nz, ny, rz * nx + fz * nz)
        }
        for (const u of src.uvs) out.uvs.push(u)
        for (const c of src.colors) out.colors.push(c)
        // the frame is left-handed where the world is not (x right, z towards the viewer): flip the winding
        for (let k = 0; k < src.indices.length; k += 3) out.indices.push(base + src.indices[k], base + src.indices[k + 2], base + src.indices[k + 1])
      }
      put(own.face, face)
      put(own.mass, mass)
    }
    return { face, mass }
  }

  private mesh(out: MeshBuilder, name: string, kind: 'unlit' | 'face'): Mesh {
    const m = new Mesh(name, this.scene)
    out.toVertexData().applyToMesh(m)
    if (kind === 'unlit') {
      // lit by its own lamps: the colours as baked, whatever the sun is doing; no haze inside a tunnel
      if (!this.unlit) {
        const mat = new StandardMaterial('tunnel:unlit', this.scene)
        // with lighting off only the emissive term is left, times the vertex colour: emissive white shows the
        // baked colours exactly (black made the whole tunnel black)
        mat.disableLighting = true
        mat.emissiveColor = Color3.White()
        mat.diffuseColor = Color3.Black()
        mat.specularColor = Color3.Black()
        mat.fogEnabled = false
        mat.backFaceCulling = true
        this.unlit = mat
      }
      m.material = this.unlit
    } else {
      const mat = cartoonMaterial(this.scene, 'cartoonTunnelFace', false)
      mat.backFaceCulling = true
      m.material = mat
    }
    m.renderingGroupId = 3
    m.isPickable = false
    m.alwaysSelectAsActiveMesh = true
    m.freezeWorldMatrix()
    return m
  }
}

/**
 * The cross-section for a style: floors (road, pavements), kerbs, the inside surface (walls, vault, pier), lamps
 * and rails, left to right across the bore, heights over the road.
 */
export function sectionFor(style: TunnelStyle, road: number, walk: number): Section {
  const vault = style.vault ?? 'segmental'
  const twin = style.twin ?? 0
  const half = road + walk
  const wallCol = style.wall ?? [0.86, 0.8, 0.6]
  const vaultCol = style.vaultColour ?? [0.8, 0.77, 0.68]
  const wallTop = style.wallTop ?? 2.2
  const floors: Section['floors'] = []
  const kerbs: Section['kerbs'] = []
  const surface: Section['surface'] = []
  const lamps: Section['lamps'] = []
  const rails: Section['rails'] = []
  // the bores: [left edge, right edge] of each, across
  const bores: [number, number][] = twin > 0 ? [[-half, -twin / 2], [twin / 2, half]] : [[-half, half]]
  const tops: { a: number; b: number; f: (o: number) => number }[] = []
  let crown = 0
  for (const [a, b] of bores) {
    const c = (a + b) / 2
    const r = (b - a) / 2
    const spring = style.spring ?? (vault === 'round' ? 1.2 : 1.6)
    const peak = style.crown ?? (vault === 'round' ? spring + r : 6.0)
    const rise = peak - spring
    // the vault's profile: an ellipse over the springing line, `r` across and `rise` high
    const f = (o: number): number => spring + rise * Math.sqrt(Math.max(0, 1 - ((o - c) / r) ** 2))
    tops.push({ a, b, f })
    crown = Math.max(crown, peak)
    // the inside surface: the wall up from the pavement, then the vault in 16 pieces, then the far wall down
    const floorY = walk > 0 && style.walks !== 'catwalk' ? 0.3 : 0
    const segs = 16
    const pts: [number, number][] = [[a, floorY]]
    for (let k = 0; k <= segs; k++) {
      const o = a + ((b - a) * k) / segs
      pts.push([o, k === 0 || k === segs ? spring : f(o)])
    }
    pts.push([b, floorY])
    for (let k = 1; k < pts.length; k++) {
      const h0 = pts[k - 1][1]
      const h1 = pts[k][1]
      // the walls tiled to `wallTop`, the vault above — darkening towards the crown, away from the lamps: a
      // segment's colour by its middle
      const mid = (h0 + h1) / 2
      const up = Math.max(0, Math.min(1, (mid - wallTop) / Math.max(0.5, peak - wallTop)))
      const shade = 1 - 0.35 * up
      const col: Rgb = mid < wallTop ? wallCol : [vaultCol[0] * shade, vaultCol[1] * shade, vaultCol[2] * shade]
      surface.push({ a: pts[k - 1], b: pts[k], col })
    }
    // floors: the road across the bore, with raised pavements (both) or a catwalk (the side away from the pier)
    if (style.walks === 'catwalk') {
      const cw = 0.9
      const outer = a === -half ? a : b
      const inner = outer === a ? a + cw : b - cw
      floors.push({ a: Math.min(outer, inner), b: Math.max(outer, inner), y: 0.8, col: KERB })
      kerbs.push({ o: inner, lo: 0, hi: 0.8, facing: outer === a ? 1 : -1 })
      rails.push({ o: inner - (outer === a ? 0.05 : -0.05), y: 0.8 })
      floors.push({ a: outer === a ? inner : a, b: outer === a ? b : inner, y: 0, col: ROAD, paint: false })
      lamps.push({ o: c, y: peak - 0.04, w: 0.18, facing: [0, -1] })
    } else {
      const w = walk > 0 ? Math.min(walk, (b - a) / 4) : 0
      if (w > 0) {
        floors.push({ a, b: a + w, y: 0.3, col: KERB }, { a: b - w, b, y: 0.3, col: KERB })
        kerbs.push({ o: a + w, lo: 0, hi: 0.3, facing: 1 }, { o: b - w, lo: 0, hi: 0.3, facing: -1 })
        rails.push({ o: a + w - 0.1, y: 0.3 }, { o: b - w + 0.1, y: 0.3 })
      }
      floors.push({ a: a + w, b: b - w, y: 0, col: ROAD, paint: twin === 0 })
      if (style.lamps === 'crown') lamps.push({ o: c, y: peak - 0.04, w: 0.2, facing: [0, -1] })
      else for (const side of [-1, 1]) {
        // a row just under each springing line, on the upright wall (above it the wall has curved in over the lamp)
        lamps.push({ o: c + side * (r - 0.03), y: spring - 0.3, w: 0.16, facing: [-side, 0] })
      }
    }
  }
  // the pier between twin bores: its two faces
  if (twin > 0) {
    surface.push({ a: [-twin / 2, 0], b: [-twin / 2, tops[0].f(-twin / 2)], col: wallCol })
    surface.push({ a: [twin / 2, tops[1].f(twin / 2)], b: [twin / 2, 0], col: wallCol })
  }
  const top = (o: number): number | null => {
    for (const t of tops) if (o >= t.a - 1e-6 && o <= t.b + 1e-6) return t.f(Math.max(t.a + 1e-3, Math.min(t.b - 1e-3, o)))
    return null
  }
  return { floors, kerbs, surface, lamps, rails, top, crown, half }
}

/**
 * The generic portal: a concrete headwall round the opening — from the opening up to the ground over the tunnel,
 * never less than a band over it nor more than a few metres — a lighter ring round each bore, and a wing wall each
 * side splayed back into the hillside, its top easing down to the ground it holds back.
 */
export function genericPortal(c: PortalContext): MeshBuilder {
  const out = new MeshBuilder()
  const face: V3 = [0, 0, 1]
  let over = -Infinity
  for (let x = -c.half; x <= c.half; x += 1) over = Math.max(over, c.over(x))
  const top = Math.max(c.crown + BAND, Math.min(c.crown + TALLEST, over))
  const edge = c.half + 0.8
  const step = 0.4
  for (let x = -edge; x < edge - 1e-6; x += step) {
    const x1 = x + step
    const lo0 = Math.abs(x) < c.half ? c.opening(x) ?? 0 : 0
    const lo1 = Math.abs(x1) < c.half ? c.opening(x1) ?? 0 : 0
    // (where the opening is solid — between twin bores — the wall runs down to the road)
    const b0 = Math.abs(x) < c.half && c.opening(x) === null ? 0 : lo0
    const b1 = Math.abs(x1) < c.half && c.opening(x1) === null ? 0 : lo1
    out.quad([[x, b0, 0], [x1, b1, 0], [x1, top, 0], [x, top, 0]], face, UV, CONCRETE, 0)
  }
  // a ring round the opening, a hand's breadth proud
  for (let x = -c.half; x < c.half - 1e-6; x += step) {
    const x1 = Math.min(c.half, x + step)
    const t0 = c.opening(x)
    const t1 = c.opening(x1)
    if (t0 === null || t1 === null) continue
    out.quad([[x, t0, 0.15], [x1, t1, 0.15], [x1, t1 + 0.45, 0.15], [x, t0 + 0.45, 0.15]], face, UV, RING, 0)
  }
  for (const side of [-1, 1]) {
    // the wing: from the portal's corner, back and out into the hill
    const ux = side * Math.cos(SPLAY)
    const uz = -Math.sin(SPLAY)
    const nrm: V3 = [side * Math.sin(SPLAY), 0, Math.cos(SPLAY)]
    const n = 7
    for (let k = 0; k < n; k++) {
      const t0 = (WING * k) / n
      const t1 = (WING * (k + 1)) / n
      const a = { x: side * edge + ux * t0, z: uz * t0 }
      const b = { x: side * edge + ux * t1, z: uz * t1 }
      const ht = (q: { x: number; z: number }, t: number): number => {
        const g = c.ground(q.x, q.z)
        const f = t / WING
        return Math.max(0.6, Math.min(top, top * (1 - f) + g * f))
      }
      out.quad([[a.x, 0, a.z], [b.x, 0, b.z], [b.x, ht(b, t1), b.z], [a.x, ht(a, t0), a.z]], nrm, UV, CONCRETE, 0)
    }
  }
  return out
}

/** the camera is in front of a mouth: outside it, near, and within a wide cone of its opening */
function inFront(m: Mouth, half: number, c: { x: number; y: number; z: number }): boolean {
  const dx = c.x - m.p.x
  const dz = c.z - m.p.z
  const ahead = dx * m.fx + dz * m.fz
  if (ahead < 0.5 || ahead > ENTRY_SEEN) return false
  const side = Math.abs(dx * -m.fz + dz * m.fx)
  return side < half + ahead * 1.5 && c.y < m.y + 40
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
