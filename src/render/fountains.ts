/**
 * Moving water in the fountains (PARIS_EXPAND §6 item 10; user, 2026-09-22: "work on animated fountains").
 *
 * One shader for all of it: translucent, a pale blue-white, with streaks that run along the flow (uv.y is
 * "how far the water has come"), so a jet climbs, a spout arcs and a sheet falls without a single particle.
 * The geometry of each fountain is a list of pieces, in its landmark's own frame:
 *
 *   jet    a column rising from a nozzle to a height, fraying into a plume at the top
 *   arc    a spout on a parabola from a mouth to where it lands (the Trocadéro's cannons, a dragon's mouth)
 *   sheet  a curtain falling over a basin's rim, all the way round (a circle) or along a straight lip
 *   foam   a ring of churned water where something lands
 *
 * Placed when the landmark is (render/landmarks.ts `placed`), or at a lat/lon; the Wallace drinking fountains
 * get a thin trickle each, from the furniture. Built once; each frame only the time moves.
 */
import { Effect } from '@babylonjs/core/Materials/effect'
import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import type { Scene } from '@babylonjs/core/scene'
import { MeshBuilder } from './buildings.ts'
import type { TileLayer } from './city.ts'
import type { Terrain } from '../city/terrain.ts'

type V3 = [number, number, number]

export type Piece =
  | { kind: 'jet'; at: V3; height: number; r: number }
  | { kind: 'arc'; from: V3; to: V3; rise: number; r: number }
  | { kind: 'sheet'; at: V3; radius: number; drop: number; sides?: number }
  | { kind: 'lip'; a: V3; b: V3; drop: number; out: number }
  | { kind: 'foam'; at: V3; r: number }

/** A fountain: at a landmark (by the manifest name) or at a lat/lon, facing `bearing` (degrees) */
export interface FountainSpec { landmark?: string; lat?: number; lon?: number; bearing?: number; onWater?: boolean; pieces: Piece[] }

const VERTEX = `
precision highp float;
attribute vec3 position;
attribute vec2 uv;
attribute vec4 color;
uniform mat4 worldViewProjection;
uniform float time;
varying vec2 vUV;
varying float vKind;
varying float vDepth;
void main(void) {
  vec3 p = position;
  // a shimmer across the flow, stronger far along it (a plume frays, a sheet billows)
  p.x += sin(time * 7.0 + position.y * 3.1 + position.z * 1.7) * 0.03 * color.g;
  p.z += cos(time * 6.0 + position.y * 2.7 + position.x * 1.3) * 0.03 * color.g;
  gl_Position = worldViewProjection * vec4(p, 1.0);
  vUV = uv;
  vKind = color.r;
  vDepth = gl_Position.w;
}
`
const FRAGMENT = `
precision highp float;
varying vec2 vUV;
varying float vKind;
varying float vDepth;
uniform float time;
uniform vec3 fogColour;
uniform float fogDensity;
float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main(void) {
  // streaks moving along the flow: several frequencies, broken up across it
  float along = vUV.y * 6.0 - time * (vKind > 0.5 ? 1.2 : 2.4);
  float lane = floor(vUV.x * 14.0);
  float s = fract(along + h(vec2(lane, 0.0)) * 3.0);
  float streak = smoothstep(0.0, 0.25, s) * (1.0 - smoothstep(0.45, 1.0, s));
  float sparkle = step(0.93, h(vec2(lane, floor(along * 3.0))));
  vec3 water = mix(vec3(0.55, 0.72, 0.82), vec3(0.95, 0.98, 1.0), 0.45 + 0.55 * streak);
  float a = 0.18 + 0.4 * streak + 0.3 * sparkle;
  // foam: whiter, churning
  if (vKind > 1.5 && vKind < 2.5) { water = vec3(0.93, 0.96, 0.98); a = 0.35 + 0.45 * h(floor(vUV * 18.0) + floor(time * 8.0)); }
  // a boat's wake (render/river-traffic.ts): pale streaks on the water, fading out behind it
  if (vKind > 2.5) { water = vec3(0.88, 0.93, 0.96); a = (0.1 + 0.45 * streak + 0.2 * sparkle) * pow(1.0 - vUV.y, 1.5); }
  // thinner at the edges of a column or sheet
  a *= 1.0 - pow(abs(vUV.x * 2.0 - 1.0), 4.0) * 0.6;
  float fog = 1.0 - exp(-vDepth * fogDensity);
  gl_FragColor = vec4(mix(water, fogColour, clamp(fog, 0.0, 1.0)), a * (1.0 - fog * 0.7));
}
`

let registered = false
/** the moving-water material, shared: fountains, and the wakes of boats (colour r = kind, 3 = wake) */
export function waterMaterial(scene: Scene): ShaderMaterial {
  const found = scene.materials.find((m) => m.name === 'fountainwater')
  if (found) return found as ShaderMaterial
  if (!registered) {
    Effect.ShadersStore['fountainVertexShader'] = VERTEX
    Effect.ShadersStore['fountainFragmentShader'] = FRAGMENT
    registered = true
  }
  const mat = new ShaderMaterial('fountainwater', scene, 'fountain', {
    attributes: ['position', 'uv', 'color'],
    uniforms: ['worldViewProjection', 'time', 'fogColour', 'fogDensity'],
    needAlphaBlending: true,
  })
  mat.backFaceCulling = false
  mat.disableDepthWrite = true
  mat.setFloat('time', 0)
  mat.setColor3('fogColour', { r: 0.78, g: 0.83, b: 0.88 } as never)
  mat.setFloat('fogDensity', 0.0009)
  const t0 = performance.now()
  scene.onBeforeRenderObservable.add(() => mat.setFloat('time', (performance.now() - t0) / 1000))
  return mat
}

/** Pieces into a builder, each point through `to` (the landmark's frame to the world). */
export function buildPieces(out: MeshBuilder, pieces: Piece[], to: (p: V3) => V3): void {
  // colour channels: r = kind (0 flowing, 1 slow sheet, 2 foam), g = how much it shimmers
  const quad = (p: V3[], uv: [number, number][], kind: number, shimmer: number): void =>
    out.quad(p.map(to) as [V3, V3, V3, V3], [0, 1, 0], uv, [kind, shimmer, 0], 0)
  for (const q of pieces) {
    if (q.kind === 'jet') {
      const N = 8
      const steps = 10
      for (let s = 0; s < steps; s++) {
        const t0 = s / steps
        const t1 = (s + 1) / steps
        // it narrows as it climbs, then flares into the plume at the top
        const r = (t: number): number => q.r * (t < 0.8 ? 1 - 0.35 * t : 0.72 + (t - 0.8) * 7)
        for (let i = 0; i < N; i++) {
          const a0 = (i / N) * Math.PI * 2
          const a1 = ((i + 1) / N) * Math.PI * 2
          const P = (a: number, t: number): V3 => [q.at[0] + Math.sin(a) * r(t), q.at[1] + q.height * t, q.at[2] + Math.cos(a) * r(t)]
          quad([P(a0, t0), P(a1, t0), P(a1, t1), P(a0, t1)], [[i / N, t0], [(i + 1) / N, t0], [(i + 1) / N, t1], [i / N, t1]], 0, t1)
        }
      }
      // the plume falling back round it
      pieces.length && buildPieces(out, [{ kind: 'sheet', at: [q.at[0], q.at[1] + q.height, q.at[2]], radius: q.r * 2.2, drop: q.height * 0.85, sides: 10 }], to)
    } else if (q.kind === 'arc') {
      const steps = 16
      const N = 6
      const P = (t: number): V3 => [q.from[0] + (q.to[0] - q.from[0]) * t, q.from[1] + (q.to[1] - q.from[1]) * t + 4 * q.rise * t * (1 - t), q.from[2] + (q.to[2] - q.from[2]) * t]
      for (let s = 0; s < steps; s++) {
        const a = P(s / steps)
        const b = P((s + 1) / steps)
        const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2]
        const l = Math.hypot(dx, dy, dz) || 1
        // two axes across the stream
        let sx = -dz, sz = dx
        const hl = Math.hypot(sx, sz) || 1
        sx /= hl; sz /= hl
        const ux = (sz * dy) / l, uy = (sx * dz - sz * dx) / l, uz = (-sx * dy) / l
        const rr = (t: number): number => q.r * (1 + t * 1.6)
        for (let i = 0; i < N; i++) {
          const a0 = (i / N) * Math.PI * 2
          const a1 = ((i + 1) / N) * Math.PI * 2
          const ring = (c: V3, ang: number, r: number): V3 => [c[0] + (sx * Math.cos(ang) + ux * Math.sin(ang)) * r, c[1] + uy * Math.sin(ang) * r, c[2] + (sz * Math.cos(ang) + uz * Math.sin(ang)) * r]
          const t0 = s / steps
          const t1 = (s + 1) / steps
          quad([ring(a, a0, rr(t0)), ring(a, a1, rr(t0)), ring(b, a1, rr(t1)), ring(b, a0, rr(t1))], [[i / N, t0], [(i + 1) / N, t0], [(i + 1) / N, t1], [i / N, t1]], 0, 0.5 + t1)
        }
      }
      buildPieces(out, [{ kind: 'foam', at: q.to, r: q.r * 4 }], to)
    } else if (q.kind === 'sheet') {
      const N = q.sides ?? 24
      for (let i = 0; i < N; i++) {
        const a0 = (i / N) * Math.PI * 2
        const a1 = ((i + 1) / N) * Math.PI * 2
        // the water leaves the rim a little outward and falls on a curve
        const P = (a: number, t: number): V3 => {
          const r = q.radius + 0.35 * Math.sqrt(t)
          return [q.at[0] + Math.sin(a) * r, q.at[1] - q.drop * t, q.at[2] + Math.cos(a) * r]
        }
        for (let s = 0; s < 4; s++) {
          const t0 = s / 4
          const t1 = (s + 1) / 4
          quad([P(a0, t0), P(a1, t0), P(a1, t1), P(a0, t1)], [[i / N, t0], [(i + 1) / N, t0], [(i + 1) / N, t1], [i / N, t1]], 1, t1)
        }
      }
      buildPieces(out, [{ kind: 'foam', at: [q.at[0], q.at[1] - q.drop + 0.02, q.at[2]], r: q.radius + 0.6 }], to)
    } else if (q.kind === 'lip') {
      const dx = q.b[0] - q.a[0]
      const dz = q.b[2] - q.a[2]
      const l = Math.hypot(dx, dz) || 1
      const nx = dz / l * q.out
      const nz = -dx / l * q.out
      const P = (p: V3, t: number): V3 => [p[0] + nx * 0.4 * Math.sqrt(t), p[1] - q.drop * t, p[2] + nz * 0.4 * Math.sqrt(t)]
      for (let s = 0; s < 4; s++) {
        const t0 = s / 4
        const t1 = (s + 1) / 4
        quad([P(q.a, t0), P(q.b, t0), P(q.b, t1), P(q.a, t1)], [[0, t0], [1, t0], [1, t1], [0, t1]], 1, t1)
      }
    } else {
      // foam: a flat ring, lifted a hair above the water
      const N = 16
      for (let i = 0; i < N; i++) {
        const a0 = (i / N) * Math.PI * 2
        const a1 = ((i + 1) / N) * Math.PI * 2
        const P = (a: number, r: number): V3 => [q.at[0] + Math.sin(a) * r, q.at[1] + 0.03, q.at[2] + Math.cos(a) * r]
        quad([P(a0, q.r * 0.35), P(a1, q.r * 0.35), P(a1, q.r), P(a0, q.r)], [[i / N, 0], [(i + 1) / N, 0], [(i + 1) / N, 1], [i / N, 1]], 2, 0)
      }
    }
  }
}

/** The region's fountains: built when their landmark is placed (or at once for a lat/lon), each once. */
export class Fountains {
  private readonly built = new Set<number>()
  private readonly mat: ShaderMaterial
  constructor(private readonly scene: Scene, private readonly specs: FountainSpec[],
              private readonly toLocal: (lat: number, lon: number) => { x: number; z: number },
              private readonly terrain: Terrain,
              private readonly waterAt: (x: number, z: number) => number | null,
              private readonly placed: () => { name: string; x: number; y?: number; z: number; rotation?: number }[]) {
    this.mat = waterMaterial(scene)
  }

  private last = 0
  update(): void {
    const now = performance.now()
    if (now - this.last < 500) return
    this.last = now
    this.specs.forEach((f, i) => {
      if (this.built.has(i)) return
      let x: number, y: number, z: number, rot: number
      if (f.landmark) {
        const p = this.placed().find((q) => q.name === f.landmark)
        if (!p || p.rotation === undefined) return
        x = p.x; z = p.z; rot = p.rotation
        y = p.y ?? this.terrain.heightAt(x, z)
      } else if (f.lat !== undefined && f.lon !== undefined) {
        const p = this.toLocal(f.lat, f.lon)
        x = p.x; z = p.z; rot = ((f.bearing ?? 0) * Math.PI) / 180
        if (f.onWater) {
          const w = this.waterAt(x + Math.sin(rot) * 40, z + Math.cos(rot) * 40)
          // the pool's tile is not in yet: try again later
          if (w === null) return
          y = w
        } else y = this.terrain.heightAt(x, z)
      } else return
      this.built.add(i)
      const c = Math.cos(rot)
      const s = Math.sin(rot)
      const out = new MeshBuilder()
      buildPieces(out, f.pieces, ([lx, ly, lz]) => [x + lx * c + lz * s, y + ly, z - lx * s + lz * c])
      const m = new Mesh(`fountain:${f.landmark ?? i}`, this.scene)
      out.toVertexData().applyToMesh(m)
      m.material = this.mat
      m.renderingGroupId = 3
      m.isPickable = false
      m.alwaysSelectAsActiveMesh = false
      m.freezeWorldMatrix()
    })
  }
}

/** A trickle from every Wallace fountain in the tiles near the rider: from under the dome to the grille. */
export function wallaceLayer(scene: Scene, terrain: Terrain): TileLayer {
  return {
    name: 'wallace-water',
    range: 1,
    build(near, rect) {
      const out = new MeshBuilder()
      for (const f of near.tile.furniture) {
        if (f.kind !== 'fountain' || !(f as { wallace?: boolean }).wallace) continue
        if (f.x < rect.x0 || f.x >= rect.x1 || f.z < rect.z0 || f.z >= rect.z1) continue
        const g = (f.y ?? terrain.heightAt(f.x, f.z)) + 0.15
        buildPieces(out, [{ kind: 'jet', at: [0, 0.35, 0], height: 1.25, r: 0.025 }].map((q) => ({ ...q, kind: 'arc' as const, from: [0, 1.6, 0] as V3, to: [0.02, 0.35, 0] as V3, rise: 0, r: 0.022 })), ([x, y, z]) => [f.x + x, g + y, f.z + z])
      }
      if (out.triangles === 0) return []
      const m = new Mesh(`wallace-water:${near.key}`, scene)
      out.toVertexData().applyToMesh(m)
      m.material = waterMaterial(scene)
      m.renderingGroupId = 3
      m.isPickable = false
      m.freezeWorldMatrix()
      return [m]
    },
  }
}

/** The fountains of a city or its region: `landmarks/<name>-fountains.json`, or none. */
export async function fountainManifest(base: string, names: string[]): Promise<FountainSpec[]> {
  for (const n of names) {
    try {
      const r = await fetch(new URL(`landmarks/${n}-fountains.json`, base).href)
      const t = await r.text()
      if (r.ok && t.trimStart().startsWith('[')) return JSON.parse(t) as FountainSpec[]
    } catch { /* the next */ }
  }
  return []
}

