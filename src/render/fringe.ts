/**
 * The city beyond the box.
 *
 * The rideable city is a square a kilometre and a half across, and past its edge there was nothing — Paris
 * stopped at a field (user: "we should probably have buildings outside the accessible range, so it doesn't
 * look like Paris disappears into a field"). The bake now packs the buildings in a 700 m ring round the box
 * (`pkg.fringe`), and this draws them as plain massing: one quad per wall wearing the style's FAR page — a
 * single window bay, repeating every bay and every storey (tools/facadegen `<style>-far.png`) — and the
 * building's own roof. A fraction of what the facade grammar costs, and from the edge of the box, through
 * the haze, it reads as more city.
 *
 * One mesh per style for the whole ring: it is all far away and all static, so nothing is gained by tiling.
 */
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import type { Scene } from '@babylonjs/core/scene'
import { MeshBuilder } from './buildings.ts'
import { buildRoof } from './roofs.ts'
import { facadeMaterial, KIND_WALL } from './facade-material.ts'
import { style as styleOf, type Palette } from '../city/facade.ts'
import { unpackPoints, type PackedBuilding, type PackedFringe } from '../city/package.ts'
import type { TileLayer } from './city.ts'
import type { Region } from '../city/region.ts'
import type { Terrain } from '../city/terrain.ts'

/** the far page is one bay by one storey */
const BAY = 3
const STOREY = 3.3

const rgb = (h: string): [number, number, number] =>
  [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255]

/**
 * The fringe as a per-tile layer (render/city.ts `TileLayer`): the massing of the tile's fringe buildings.
 * Not a building the city already has: one that straddles the box's edge is fetched by both queries — the
 * city's (it touches the box) and the fringe's (its centre is outside) — and drawn twice in the same place,
 * the fringe's plain walls z-fighting with the real facades (user report at 48.850638, 2.367262). `own` is
 * every city building id (the ids of the whole box, known up front).
 */
export function fringeLayer(scene: Scene, reg: Region, terrain: Terrain, assets: string, own: Set<number>): TileLayer {
  return {
    name: 'fringe',
    build(near) {
      return massing(scene, near.tile.fringe.filter((f) => !own.has(f.id)), reg, terrain, assets, near.key)
    },
  }
}

/** Plain massing — walls in the style's far page, roofs in its own — for buildings seen from afar. */
export function massing(scene: Scene, list: PackedFringe[], reg: Region, terrain: Terrain, assets: string, tag: string): Mesh[] {
  if (list.length === 0) return []
  const byStyle = new Map<string, MeshBuilder>()
  // roofs apart, in the style's ordinary material: sampled from the far page, a mansard grew windows
  const roofs = new Map<string, MeshBuilder>()
  for (const f of list) {
    const ring = unpackPoints(f.ring)
    if (ring.length < 3) continue
    const palettes: Palette[] = reg.palettes[f.style] ?? styleOf(f.style).palettes
    const pal = palettes[Math.abs(f.id) % palettes.length]
    const tint = rgb(pal.wall)
    let foot = Infinity
    for (const q of ring) foot = Math.min(foot, terrain.heightAt(q.x, q.z))
    foot -= 0.3
    const top = foot + f.height
    // a part standing on another (a city building's upper storeys): its walls start at its own floor
    foot += (f as { minHeight?: number }).minHeight ?? 0
    const out = byStyle.get(f.style) ?? new MeshBuilder()
    byStyle.set(f.style, out)
    // the walls: anticlockwise ring, outward normal (uz, −ux); uv in bays and storeys, image v downward
    let run = 0
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i]
      const b = ring[(i + 1) % ring.length]
      const len = Math.hypot(b.x - a.x, b.z - a.z)
      if (len < 0.3) continue
      const ux = (b.x - a.x) / len
      const uz = (b.z - a.z) / len
      const u0 = Math.round(run / BAY * 4) / 4
      const u1 = u0 + len / BAY
      const v = f.height / STOREY
      out.quad([[a.x, foot, a.z], [b.x, foot, b.z], [b.x, top, b.z], [a.x, top, a.z]], [uz, 0, -ux],
        [[u0, v], [u1, v], [u1, 0], [u0, 0]], tint, KIND_WALL)
      run += len
    }
    const roof = roofs.get(f.style) ?? new MeshBuilder()
    roofs.set(f.style, roof)
    buildRoof(roof, ring, { shape: f.roof, y: top, height: f.roofHeight, colour: f.roofColour })
  }
  const done: Mesh[] = []
  const meshes: [string, MeshBuilder, string][] = [
    ...[...byStyle].map(([st, out]): [string, MeshBuilder, string] => [`fringe:${st}:${tag}`, out, `${st}-far`]),
    ...[...roofs].map(([st, out]): [string, MeshBuilder, string] => [`fringe-roof:${st}:${tag}`, out, st]),
  ]
  for (const [name, out, page] of meshes) {
    if (out.triangles === 0) continue
    const m = new Mesh(name, scene)
    out.toVertexData().applyToMesh(m)
    m.material = facadeMaterial(scene, page, assets)
    m.renderingGroupId = 3
    const pick = new URLSearchParams(globalThis.location?.search ?? '').get('pick') === '1'
    m.isPickable = pick
    m.freezeWorldMatrix()
    if (!pick) m.geometry?.clearCachedData()
    done.push(m)
  }
  return done
}

/** A city building as massing: its tagged or inferred height, from its own floor. */
export function asMassing(b: PackedBuilding): PackedFringe & { minHeight?: number } {
  return { id: b.id, ring: b.ring, height: b.height ?? (b.levels ?? 5) * 3.2, minHeight: b.minHeight, style: b.style,
    roof: b.roof, roofHeight: b.roofHeight, roofColour: b.roofColour }
}
