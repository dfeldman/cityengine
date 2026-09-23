/**
 * Tram track set in the street (SF_PLAN.md §7), as a per-tile layer (render/city.ts `TileLayer`): the two rails, grey
 * steel worn bright on top, at their gauge — the cable cars' 3 ft 6 in, standard gauge for everything else — and,
 * between a cable car's rails, the slot the grip runs in, with the cable under it. Without them a streetcar glides
 * down the asphalt on nothing, which is the one thing a tram never does.
 *
 * Shared: any city's street track. Elevated track has its own deck (render/bridges.ts railDeck), so only track at
 * grade is drawn here, clipped to the tile it is in.
 */
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import type { Scene } from '@babylonjs/core/scene'
import { MeshBuilder } from './buildings.ts'
import type { Rgb } from './models.ts'
import { cartoonMaterial } from './cartoon-material.ts'
import type { TileLayer } from './city.ts'
import type { Terrain } from '../city/terrain.ts'
import { unpackPoints } from '../city/package.ts'

const STEEL: Rgb = [0.62, 0.63, 0.64]
const SLOT: Rgb = [0.1, 0.1, 0.1]
const BALLAST: Rgb = [0.44, 0.42, 0.39]
const SLEEPER: Rgb = [0.3, 0.26, 0.22]

/** A flat strip along a polyline between offsets o0 and o1 (metres to the right), `lift` above the ground. */
function strip(out: MeshBuilder, pts: { x: number; z: number }[], o0: number, o1: number, lift: number, c: Rgb, terrain: Terrain,
               inRect: (x: number, z: number) => boolean): void {
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]
    const b = pts[i]
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    if (L < 0.05) continue
    const n = Math.max(1, Math.ceil(L / 4))
    const nx = (b.z - a.z) / L
    const nz = -(b.x - a.x) / L
    for (let k = 0; k < n; k++) {
      const p = { x: a.x + ((b.x - a.x) * k) / n, z: a.z + ((b.z - a.z) * k) / n }
      const q = { x: a.x + ((b.x - a.x) * (k + 1)) / n, z: a.z + ((b.z - a.z) * (k + 1)) / n }
      if (!inRect((p.x + q.x) / 2, (p.z + q.z) / 2)) continue
      const P = (r: { x: number; z: number }, o: number): [number, number, number] => {
        const x = r.x + nx * o
        const z = r.z + nz * o
        return [x, terrain.heightAt(x, z) + lift, z]
      }
      out.quad([P(p, o0), P(q, o0), P(q, o1), P(p, o1)], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], c, 0)
    }
  }
}

/** Sleepers across a heavy-rail line: a short dark bar every 0.7 m, sitting on the ballast under the rails. */
function sleepers(out: MeshBuilder, pts: { x: number; z: number }[], terrain: Terrain,
                  inRect: (x: number, z: number) => boolean): void {
  const gap = 0.7
  let carry = 0
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]
    const b = pts[i]
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    if (L < 0.05) continue
    const ux = (b.x - a.x) / L
    const uz = (b.z - a.z) / L
    for (let d = carry; d < L; d += gap) {
      const cx = a.x + ux * d
      const cz = a.z + uz * d
      if (!inRect(cx, cz)) continue
      const P = (o: number, t: number): [number, number, number] => {
        const x = cx + uz * o + ux * t
        const z = cz - ux * o + uz * t
        return [x, terrain.heightAt(x, z) + 0.2, z]
      }
      out.quad([P(-1.3, -0.13), P(1.3, -0.13), P(1.3, 0.13), P(-1.3, 0.13)], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], SLEEPER, 0)
    }
    carry = (carry - L) % gap
    if (carry < 0) carry += gap
  }
}

export function streetRailsLayer(scene: Scene, terrain: Terrain): TileLayer {
  return {
    name: 'streetRails',
    range: 3,
    build(near, rect) {
      // tram track AND heavy rail: a Caltrain yard with trains standing on bare asphalt was the giveaway that
      // only trams were drawn here (user, 2026-09-22: "dozens of trains … but no train tracks")
      const rails = (near.tile.rails ?? []).filter((r) => (r.kind === 'tram' || r.kind === 'rail') && !r.heights)
      if (rails.length === 0) return []
      const out = new MeshBuilder()
      const inRect = (x: number, z: number): boolean => x >= rect.x0 && x < rect.x1 && z >= rect.z0 && z < rect.z1
      for (const r of rails) {
        const pts = unpackPoints(r.points)
        const g = r.cable ? 1.067 : 1.435
        // (just proud of the road surface, which is draped a few centimetres over the ground)
        const lift = r.kind === 'rail' ? 0.34 : 0.14
        // heavy rail rides on its own ballast shoulder, with sleepers across it; tram track is set flush in the street
        if (r.kind === 'rail') {
          strip(out, pts, -2.0, 2.0, 0.08, BALLAST, terrain, inRect)
          sleepers(out, pts, terrain, inRect)
        }
        for (const s of [-1, 1]) strip(out, pts, s * g / 2 - 0.04, s * g / 2 + 0.04, lift, STEEL, terrain, inRect)
        if (r.cable) strip(out, pts, -0.03, 0.03, lift, SLOT, terrain, inRect)
      }
      if (out.triangles === 0) return []
      const m = new Mesh(`streetRails:${near.key}`, scene)
      out.toVertexData().applyToMesh(m)
      m.material = cartoonMaterial(scene, 'cartoonStreetRails', false)
      m.renderingGroupId = 3
      m.isPickable = false
      m.freezeWorldMatrix()
      return [m]
    },
  }
}
