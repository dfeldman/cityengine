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

  constructor(scene: Scene, g: CityGraph, terrain: Terrain,
              exitsOf: (g: CityGraph, node: number, arrived: number | null) => Exit[]) {
    this.scene = scene
    this.g = g
    this.terrain = terrain
    this.exitsOf = exitsOf
    this.baseMat = flatMaterial(scene, 'pathmap', -2)
    this.liveMat = flatMaterial(scene, 'pathmap-live', -4)
  }

  toggle(on = !this.visible): void {
    this.visible = on
    if (on && !this.staticMesh) this.staticMesh = this.buildStatic()
    this.staticMesh?.setEnabled(on)
    this.liveMesh?.setEnabled(on)
    if (!on) this.liveKey = ''
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
