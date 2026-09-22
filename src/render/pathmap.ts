/**
 * The ride graph, drawn on the ground — an optional overlay (J, the "paths" button, or `?paths=1`).
 *
 * The rider is steered along the RIDE graph (city/ridegraph.ts), not along the streets as drawn: footways
 * dropped, clusters of nodes collapsed into one junction, a boulevard's two carriageways merged into one
 * path. Around the Colonne de Juillet that turns a tangle of OSM ways into a handful of choices, and from
 * the saddle there was no way to see which (user: "it is very hard for me to understand how complex
 * junctions work"). So this shows exactly what the navigator sees:
 *
 *   - every ride edge as a ribbon a hand's width above the ground — blue for streets, green for pedestrian
 *     and cycle ways, with chevrons along a one-way edge pointing the way it may be ridden;
 *   - every junction where there is a real choice as a yellow disc, with a spoke down each way out; a dead
 *     end as a red disc;
 *   - live: the edge being ridden in white, and the exits of the next junction in the HUD's colours —
 *     left violet, straight white, right orange — the requested one brightest.
 *
 * Unlit flat colour, drawn with the buildings so walls hide it, a little above the paint so it never fights.
 */
import { Constants } from '@babylonjs/core/Engines/constants'
import { Effect } from '@babylonjs/core/Materials/effect'
import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import type { Scene } from '@babylonjs/core/scene'
import { MeshBuilder } from './buildings.ts'
import type { CityGraph, Edge, Exit, Turn } from '../city/graph.ts'
import type { Terrain } from '../city/terrain.ts'

type Rgb = [number, number, number]
type P = { x: number; z: number }

const STREET: Rgb = [0.25, 0.55, 1.0]
const PATHWAY: Rgb = [0.3, 0.85, 0.45]
const JUNCTION: Rgb = [1.0, 0.82, 0.2]
const DEAD_END: Rgb = [0.95, 0.25, 0.2]
const RIDING: Rgb = [1, 1, 1]
const TURN: Record<Turn, Rgb> = { left: [0.72, 0.5, 1.0], straight: [0.95, 0.95, 0.95], right: [1.0, 0.6, 0.2] }
const LIFT = 0.25

let registered = false

function flatMaterial(scene: Scene, name: string, zOffset: number): ShaderMaterial {
  if (!registered) {
    Effect.ShadersStore['pathmapVertexShader'] = `
precision highp float;
attribute vec3 position;
attribute vec4 color;
uniform mat4 worldViewProjection;
varying vec3 vColour;
void main(void) { gl_Position = worldViewProjection * vec4(position, 1.0); vColour = color.rgb; }`
    Effect.ShadersStore['pathmapFragmentShader'] = `
precision highp float;
varying vec3 vColour;
void main(void) { gl_FragColor = vec4(vColour, 1.0); }`
    registered = true
  }
  const mat = new ShaderMaterial(name, scene, 'pathmap', { attributes: ['position', 'color'], uniforms: ['worldViewProjection'] })
  mat.backFaceCulling = false
  mat.depthFunction = Constants.LEQUAL
  mat.zOffset = zOffset
  return mat
}

let softRegistered = false

/** A translucent flat material, for the quiet everyday overlay: `alpha` of the vertex colour over the ground. */
function softMaterial(scene: Scene, name: string, alpha: number, zOffset: number): ShaderMaterial {
  if (!softRegistered) {
    Effect.ShadersStore['pathsoftVertexShader'] = `
precision highp float;
attribute vec3 position;
attribute vec4 color;
uniform mat4 worldViewProjection;
varying vec3 vColour;
void main(void) { gl_Position = worldViewProjection * vec4(position, 1.0); vColour = color.rgb; }`
    Effect.ShadersStore['pathsoftFragmentShader'] = `
precision highp float;
varying vec3 vColour;
uniform float alpha;
void main(void) { gl_FragColor = vec4(vColour, alpha); }`
    softRegistered = true
  }
  const mat = new ShaderMaterial(name, scene, 'pathsoft', { attributes: ['position', 'color'], uniforms: ['worldViewProjection', 'alpha'], needAlphaBlending: true })
  mat.setFloat('alpha', alpha)
  mat.backFaceCulling = false
  mat.depthFunction = Constants.LEQUAL
  mat.disableDepthWrite = true
  mat.zOffset = zOffset
  return mat
}

const SOFT_LINE: Rgb = [0.97, 0.95, 0.88]
const SOFT_JUNCTION: Rgb = [1.0, 0.86, 0.45]
/** how far round the rider the quiet overlay is drawn, and how far they move before it is redrawn */
const SOFT_REACH = 600
const SOFT_REBUILD = 150

/** subtle: the everyday overlay; full: the diagnostic one (colours, chevrons, dead ends); off */
export type PathMode = 'subtle' | 'full' | 'off'

const PLAIN: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

export class PathMap {
  private readonly scene: Scene
  private readonly g: CityGraph
  private readonly terrain: Terrain
  private readonly exitsOf: (g: CityGraph, node: number, arrived: number | null) => Exit[]
  private staticMesh: Mesh | null = null
  private liveMesh: Mesh | null = null
  private liveKey = ''
  private readonly liveMat: ShaderMaterial
  private readonly baseMat: ShaderMaterial
  visible = false
  mode: PathMode = 'off'
  private softMesh: Mesh | null = null
  private softAt: P | null = null
  private readonly softMat: ShaderMaterial
  private readonly softLiveMat: ShaderMaterial

  constructor(scene: Scene, g: CityGraph, terrain: Terrain,
              exitsOf: (g: CityGraph, node: number, arrived: number | null) => Exit[]) {
    this.scene = scene
    this.g = g
    this.terrain = terrain
    this.exitsOf = exitsOf
    this.baseMat = flatMaterial(scene, 'pathmap', -2)
    this.liveMat = flatMaterial(scene, 'pathmap-live', -4)
    this.softMat = softMaterial(scene, 'pathsoft', 0.28, -2)
    this.softLiveMat = softMaterial(scene, 'pathsoft-live', 0.75, -3)
  }

  private routeMesh: Mesh | null = null
  private routeKey = ''
  /**
   * The GPS route on the ground (PARIS_EXPAND §6 item 11): a soft orange ribbon along its edges, each at its own
   * heights (over a bridge, on the deck). Rebuilt only when the route's edges change.
   */
  setRoute(edgeIds: number[] | null): void {
    const key = edgeIds ? edgeIds.join(',') : ''
    if (key === this.routeKey) return
    this.routeKey = key
    this.routeMesh?.dispose()
    this.routeMesh = null
    if (!edgeIds || edgeIds.length === 0) return
    const out = new MeshBuilder()
    for (const id of edgeIds) {
      const e = this.g.edges.get(id)
      if (e) this.ribbon(out, e, e.points, 0.9, [1.0, 0.6, 0.24], 0.03)
    }
    const m = new Mesh('gpsroute', this.scene)
    out.toVertexData().applyToMesh(m)
    m.material = this.softLiveMat
    m.renderingGroupId = 3
    m.isPickable = false
    m.alwaysSelectAsActiveMesh = true
    this.routeMesh = m
  }

  /** J: subtle → full → off → subtle */
  cycle(): PathMode {
    this.setMode(this.mode === 'subtle' ? 'full' : this.mode === 'full' ? 'off' : 'subtle')
    return this.mode
  }

  setMode(mode: PathMode): void {
    this.mode = mode
    this.visible = mode !== 'off'
    if (mode === 'full' && !this.staticMesh) this.staticMesh = this.buildStatic()
    this.staticMesh?.setEnabled(mode === 'full')
    this.softMesh?.setEnabled(mode === 'subtle')
    this.liveMesh?.setEnabled(mode !== 'off')
    this.liveKey = ''
  }

  toggle(on = !this.visible): void { this.setMode(on ? 'full' : 'off') }

  /** The quiet overlay round the rider: thin translucent lines, a soft ring at each junction with a choice. */
  private buildSoft(at: P): Mesh {
    const out = new MeshBuilder()
    const near = (p: P): boolean => Math.abs(p.x - at.x) < SOFT_REACH && Math.abs(p.z - at.z) < SOFT_REACH
    for (const e of this.g.edges.values()) {
      if (!e.points.some(near)) continue
      this.ribbon(out, e, e.points, 0.32, SOFT_LINE)
    }
    for (const [id, node] of this.g.nodes) {
      if (!near(node.at) || node.edges.length < 3) continue
      if (!node.edges.some((arr) => this.exitsOf(this.g, id, arr).length >= 2)) continue
      this.ring(out, node.at, 2.4, 0.35, SOFT_JUNCTION, 0.02)
    }
    const m = new Mesh('pathsoft', this.scene)
    out.toVertexData().applyToMesh(m)
    m.material = this.softMat
    m.renderingGroupId = 3
    m.isPickable = false
    m.alwaysSelectAsActiveMesh = true
    return m
  }

  /** A flat ring of radius r and width w at p. */
  private ring(out: MeshBuilder, p: P, r: number, w: number, colour: Rgb, dy = 0, sides = 18): void {
    const y = this.terrain.heightAt(p.x, p.z) + LIFT + dy
    const at = (k: number, rr: number): [number, number, number] =>
      [p.x + Math.cos((k / sides) * Math.PI * 2) * rr, y, p.z + Math.sin((k / sides) * Math.PI * 2) * rr]
    for (let i = 0; i < sides; i++) out.quad([at(i, r - w / 2), at(i + 1, r - w / 2), at(i + 1, r + w / 2), at(i, r + w / 2)], [0, 1, 0], PLAIN, colour, 0)
  }

  /** Once a frame in subtle mode: redraw round the rider when they have moved far enough. */
  follow(at: P): void {
    if (this.mode !== 'subtle') return
    if (this.softAt && Math.hypot(at.x - this.softAt.x, at.z - this.softAt.z) < SOFT_REBUILD) return
    this.softMesh?.dispose()
    this.softMesh = this.buildSoft(at)
    this.softAt = { x: at.x, z: at.z }
  }

  /** The height of a point on an edge: the edge's own deck heights on a bridge, else the ground. */
  private y(e: Edge | null, i: number, p: P): number {
    if (e?.heights && e.heights.length === e.points.length) return e.heights[i] + LIFT
    return this.terrain.heightAt(p.x, p.z) + LIFT
  }

  /** A ribbon along a polyline, densified so it drapes, `w` wide, `dy` above the lift. */
  private ribbon(out: MeshBuilder, edge: Edge, pts: P[], w: number, colour: Rgb, dy = 0): void {
    // the edge's own deck heights only when drawing the edge itself: a spoke's or a chevron's points do not
    // line up with the edge's, and on a bridge they would take the wrong heights
    const e = pts === edge.points && edge.heights?.length === edge.points.length ? edge : null
    const dense: { p: P; y: number }[] = []
    for (let i = 0; i < pts.length; i++) {
      if (i > 0) {
        const a = pts[i - 1]
        const b = pts[i]
        const n = Math.floor(Math.hypot(b.x - a.x, b.z - a.z) / 4)
        for (let k = 1; k < n; k++) {
          const t = k / n
          const q = { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t }
          const ya = this.y(e, i - 1, a)
          const yb = this.y(e, i, b)
          dense.push({ p: q, y: e ? ya + (yb - ya) * t : this.terrain.heightAt(q.x, q.z) + LIFT })
        }
      }
      dense.push({ p: pts[i], y: this.y(e, i, pts[i]) })
    }
    for (let i = 1; i < dense.length; i++) {
      const a = dense[i - 1]
      const b = dense[i]
      const dx = b.p.x - a.p.x
      const dz = b.p.z - a.p.z
      const l = Math.hypot(dx, dz) || 1
      const nx = (-dz / l) * w / 2
      const nz = (dx / l) * w / 2
      out.quad([[a.p.x - nx, a.y + dy, a.p.z - nz], [a.p.x + nx, a.y + dy, a.p.z + nz],
        [b.p.x + nx, b.y + dy, b.p.z + nz], [b.p.x - nx, b.y + dy, b.p.z - nz]], [0, 1, 0], PLAIN, colour, 0)
    }
  }

  /** A flat disc of `sides`, radius r, at p. */
  private disc(out: MeshBuilder, p: P, r: number, colour: Rgb, dy = 0, sides = 14): void {
    const y = this.terrain.heightAt(p.x, p.z) + LIFT + dy
    for (let i = 0; i < sides; i += 2) {
      const at = (k: number): [number, number, number] =>
        [p.x + Math.cos((k / sides) * Math.PI * 2) * r, y, p.z + Math.sin((k / sides) * Math.PI * 2) * r]
      out.quad([[p.x, y, p.z], at(i), at(i + 1), at(i + 2)], [0, 1, 0], PLAIN, colour, 0)
    }
  }

  /** The first `len` metres of an edge leaving `node`, as points from the node outward. */
  private leaving(e: Edge, node: number, len: number): P[] {
    const pts = e.a === node ? e.points : [...e.points].reverse()
    const out: P[] = [pts[0]]
    let run = 0
    for (let i = 1; i < pts.length; i++) {
      const seg = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z)
      if (run + seg >= len) {
        const t = (len - run) / (seg || 1)
        out.push({ x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * t, z: pts[i - 1].z + (pts[i].z - pts[i - 1].z) * t })
        return out
      }
      run += seg
      out.push(pts[i])
    }
    return out
  }

  private buildStatic(): Mesh {
    const out = new MeshBuilder()
    for (const e of this.g.edges.values()) {
      const colour = e.foot || e.kind === 'pedestrian' || e.kind === 'cycleway' || e.kind === 'living_street' ? PATHWAY : STREET
      this.ribbon(out, e, e.points, 1.1, colour)
      // chevrons along a one-way edge, every 12 m, pointing the way it may be ridden
      if (e.oneway) {
        let run = 6
        for (let i = 1; i < e.points.length; i++) {
          const a = e.points[i - 1]
          const b = e.points[i]
          const seg = Math.hypot(b.x - a.x, b.z - a.z)
          while (run < seg) {
            const t = run / seg
            const c = { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t }
            const ux = (b.x - a.x) / seg
            const uz = (b.z - a.z) / seg
            for (const s of [-1, 1]) {
              this.ribbon(out, e, [{ x: c.x - ux * 1.6 + uz * s * 1.5, z: c.z - uz * 1.6 - ux * s * 1.5 }, c], 0.5, colour, 0.02)
            }
            run += 12
          }
          run -= seg
        }
      }
    }
    for (const [id, node] of this.g.nodes) {
      const degree = node.edges.length
      if (degree === 1) { this.disc(out, node.at, 2, DEAD_END, 0.04); continue }
      // a real choice: more than one way on, from at least one way in
      const choice = node.edges.some((arr) => this.exitsOf(this.g, id, arr).length >= 2)
      if (!choice) continue
      this.disc(out, node.at, 3, JUNCTION, 0.04)
      for (const eid of node.edges) {
        const e = this.g.edges.get(eid)
        if (e) this.ribbon(out, e, this.leaving(e, id, 8), 1.4, JUNCTION, 0.03)
      }
    }
    const m = new Mesh('pathmap', this.scene)
    out.toVertexData().applyToMesh(m)
    m.material = this.baseMat
    m.renderingGroupId = 3
    m.isPickable = false
    m.alwaysSelectAsActiveMesh = true
    return m
  }

  /** The live part: the edge being ridden, and the next junction's exits, the requested one brightest. */
  update(edgeId: number, junction: { nodeId: number; exits: Exit[] } | null, requested: Turn): void {
    if (!this.visible) return
    const key = `${edgeId}|${junction?.nodeId ?? ''}|${requested}|${junction?.exits.map((x) => x.edgeId).join(',') ?? ''}`
    if (key === this.liveKey) return
    this.liveKey = key
    this.liveMesh?.dispose()
    const out = new MeshBuilder()
    const e = this.g.edges.get(edgeId)
    if (this.mode === 'subtle') {
      // quiet: only the next junction's ways on, the one asked for clearest
      if (junction) {
        for (const x of junction.exits) {
          const xe = this.g.edges.get(x.edgeId)
          if (!xe) continue
          const on = x.turn === requested
          this.ribbon(out, xe, this.leaving(xe, junction.nodeId, on ? 22 : 12), on ? 0.7 : 0.4, on ? [1, 0.93, 0.6] : SOFT_LINE, 0.05)
        }
      }
      const m = new Mesh('pathsoft:live', this.scene)
      out.toVertexData().applyToMesh(m)
      m.material = this.softLiveMat
      m.renderingGroupId = 3
      m.isPickable = false
      m.alwaysSelectAsActiveMesh = true
      this.liveMesh = m
      return
    }
    if (e) this.ribbon(out, e, e.points, 1.6, RIDING, 0.06)
    if (junction) {
      this.disc(out, this.g.nodes.get(junction.nodeId)!.at, 2.6, JUNCTION, 0.08)
      for (const x of junction.exits) {
        const xe = this.g.edges.get(x.edgeId)
        if (!xe) continue
        const c = TURN[x.turn]
        const dim = x.turn === requested ? 1 : 0.55
        this.ribbon(out, xe, this.leaving(xe, junction.nodeId, 25), x.turn === requested ? 2.2 : 1.5,
          [c[0] * dim, c[1] * dim, c[2] * dim], 0.1)
      }
    }
    const m = new Mesh('pathmap:live', this.scene)
    out.toVertexData().applyToMesh(m)
    m.material = this.liveMat
    m.renderingGroupId = 3
    m.isPickable = false
    m.alwaysSelectAsActiveMesh = true
    this.liveMesh = m
  }
}
