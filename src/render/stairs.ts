/**
 * Public stairways (SF_PLAN.md §10; user, 2026-09-22: "there are SO MANY public stairs… we need to have a way to
 * insert stairs"), drawn as stairs: every `highway=steps` edge, and the region's own (tools/bake.ts), as a flight of
 * concrete treads following the ground, the rise quantised to real risers so a steep slope comes out as steps and
 * not a ramp, with a low cheek wall and a handrail each side. A landing where the slope eases. Shared: any
 * city's stairways.
 *
 * A per-tile layer (render/city.ts `TileLayer`), clipped to the tile, in the landmark material so the concrete
 * has its texture.
 */
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import type { Scene } from '@babylonjs/core/scene'
import { MeshBuilder } from './buildings.ts'
import { strut, type Rgb } from './models.ts'
import { cartoonMaterial, surfaceTag } from './cartoon-material.ts'
import type { TileLayer } from './city.ts'
import type { Terrain } from '../city/terrain.ts'
import { unpackPoints } from '../city/package.ts'
import { stairway, type NamedStairway, type StairPoint } from './landmarks/stairway.ts'

const CONCRETE: Rgb = [0.68, 0.67, 0.64]
const NOSING: Rgb = [0.58, 0.57, 0.55]
const RAIL: Rgb = [0.2, 0.22, 0.2]
const TREAD = 0.32
const RISER = 0.17

/**
 * `named` is the region's table of stairways built as LANDMARKS (render/landmarks/stairway.ts), keyed by the
 * OSM name on the way — San Francisco's is `landmarks/sf/stairways.ts`, passed in by `game.ts` so this shared
 * layer never imports a city's own builders (feedback-region-files). Everything not in it gets the generic
 * treatment below, unchanged.
 */
export function stairsLayer(scene: Scene, terrain: Terrain, named: Record<string, NamedStairway> = {}): TileLayer {
  const concrete = surfaceTag('concrete')
  return {
    name: 'stairs',
    range: 3,
    build(near, rect) {
      const flights = (near.tile.edges ?? []).filter((e) => e.kind === 'steps')
      if (flights.length === 0) return []
      const out = new MeshBuilder()
      const inRect = (x: number, z: number): boolean => x >= rect.x0 && x < rect.x1 && z >= rect.z0 && z < rect.z1
      for (const e of flights) {
        const pts = unpackPoints(e.points)
        if (pts.length < 2) continue
        /*
         * A NAMED landmark stairway. Built WHOLE, from the way's own polyline, and anchored on the tile its
         * midpoint falls in rather than clipped per tread: the flights, the cheek walls' stepped coping and
         * the decoration only make sense as one object, and a piece of a flight is worse than none. The ways
         * are short (the Lyon Street run is six of them over 140 m) and the layer's reach is three tiles, so
         * nothing is ever far enough outside its anchor tile to pop.
         */
        const spec = e.name ? named[e.name] : undefined
        if (spec) {
          const mid = pts[Math.floor(pts.length / 2)]
          if (!inRect(mid.x, mid.z)) continue
          /*
           * The heights are the RIDE EDGE'S OWN PROFILE where the bake gave it one, which is what the runner's
           * feet follow (BUGS.md #207) — the terrain grid is only the fallback for a city baked flat.
           */
          const line: StairPoint[] = pts.map((p, i) => ({ x: p.x, z: p.z, y: e.heights?.[i] ?? terrain.heightAt(p.x, p.z) }))
          const res = stairway(out, line, spec.width ?? Math.max(1.6, e.width || 2.4), spec.style)
          spec.decorate?.(out, res)
          continue
        }
        const half = Math.max(0.8, Math.min(3, (e.width || 2.4) / 2))
        // resample the polyline at the tread's pitch
        const at: { x: number; z: number; dx: number; dz: number }[] = []
        for (let i = 1; i < pts.length; i++) {
          const a = pts[i - 1]
          const b = pts[i]
          const L = Math.hypot(b.x - a.x, b.z - a.z)
          if (L < 0.05) continue
          const n = Math.max(1, Math.round(L / TREAD))
          for (let k = 0; k < n; k++) at.push({ x: a.x + ((b.x - a.x) * k) / n, z: a.z + ((b.z - a.z) * k) / n, dx: (b.x - a.x) / L, dz: (b.z - a.z) / L })
        }
        const last = pts[pts.length - 1]
        at.push({ x: last.x, z: last.z, dx: at[at.length - 1]?.dx ?? 1, dz: at[at.length - 1]?.dz ?? 0 })
        if (at.length < 2) continue
        // the ground under each tread, quantised to risers from the lower end, so the treads step
        const g = at.map((p) => terrain.heightAt(p.x, p.z))
        const base = Math.min(g[0], g[g.length - 1])
        const y = g.map((h) => base + Math.round((h - base) / RISER) * RISER + 0.15)
        for (let i = 0; i < at.length - 1; i++) {
          const p = at[i]
          const q = at[i + 1]
          if (!inRect((p.x + q.x) / 2, (p.z + q.z) / 2)) continue
          const nx = -p.dz
          const nz = p.dx
          const top = Math.max(y[i], y[i + 1])
          const ya = y[i]
          const P = (r: { x: number; z: number }, o: number, h: number): [number, number, number] => [r.x + nx * o, h, r.z + nz * o]
          // the tread, level, from this point to the next
          out.quad([P(p, -half, ya), P(p, half, ya), P(q, half, ya), P(q, -half, ya)], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], CONCRETE, concrete)
          // the riser up to the next tread (or down from it), facing the lower side
          if (Math.abs(y[i + 1] - ya) > 0.01) {
            const lo = Math.min(ya, y[i + 1])
            const hi = Math.max(ya, y[i + 1])
            const f = y[i + 1] > ya ? -1 : 1
            out.quad([P(q, -half, lo), P(q, half, lo), P(q, half, hi), P(q, -half, hi)], [p.dx * f, 0, p.dz * f], [[0, 0], [1, 0], [1, 1], [0, 1]], NOSING, concrete)
          }
          // the cheek walls, from the ground up past the tread, each side
          for (const s of [-1, 1]) {
            const o = s * (half + 0.15)
            const gl = Math.min(g[i], g[i + 1]) - 0.3
            const wn: [number, number, number] = [nx * s, 0, nz * s]
            out.quad([P(p, o, gl), P(q, o, gl), P(q, o, top + 0.35), P(p, o, ya + 0.35)], wn, [[0, 0], [1, 0], [1, 1], [0, 1]], CONCRETE, concrete)
            out.quad([P(q, o - 0.3 * s, gl), P(p, o - 0.3 * s, gl), P(p, o - 0.3 * s, ya + 0.35), P(q, o - 0.3 * s, top + 0.35)],
              [-wn[0], 0, -wn[2]], [[0, 0], [1, 0], [1, 1], [0, 1]], CONCRETE, concrete)
            out.quad([P(p, o - 0.3 * s, ya + 0.35), P(p, o, ya + 0.35), P(q, o, top + 0.35), P(q, o - 0.3 * s, top + 0.35)], [0, 1, 0],
              [[0, 0], [1, 0], [1, 1], [0, 1]], NOSING, concrete)
          }
        }
        // the handrails: a steel tube on posts, 0.9 m over the treads, down each side
        for (const s of [-1, 1]) {
          const o = s * (half - 0.1)
          for (let i = 0; i < at.length - 1; i += 6) {
            const j = Math.min(at.length - 1, i + 6)
            const p = at[i]
            const q = at[j]
            if (!inRect(p.x, p.z)) continue
            const P = (r: { x: number; z: number; dx: number; dz: number }, h: number): [number, number, number] => [r.x - r.dz * o, h, r.z + r.dx * o]
            strut(out, P(p, y[i] + 0.9), P(q, y[j] + 0.9), 0.03, 0.03, RAIL, 0, false)
            strut(out, P(p, y[i]), P(p, y[i] + 0.9), 0.025, 0.025, RAIL, 0, false)
          }
        }
      }
      if (out.triangles === 0) return []
      const m = new Mesh(`stairs:${near.key}`, scene)
      out.toVertexData().applyToMesh(m)
      m.material = cartoonMaterial(scene, 'cartoonLandmark', false)
      m.renderingGroupId = 3
      m.isPickable = false
      m.freezeWorldMatrix()
      return [m]
    },
  }
}
