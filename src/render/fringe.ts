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
import { style as styleOf, STYLES, type Palette } from '../city/facade.ts'
import { unpackPoints, onSurface, steeperThanWall, type PackedBuilding, type PackedEdge, type PackedFringe } from '../city/package.ts'
import { cartoonMaterial } from './cartoon-material.ts'
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
  for (const given of list) {
    let f = given
    const ring = unpackPoints(f.ring)
    if (ring.length < 3) continue
    // a building with no style (a restyle or a v3 style index that did not resolve) takes the region's first, rather
    // than throwing out of the frame loop (owner, 2026-10-02, Sausalito: "Uncaught Error: unknown style undefined")
    if (!f.style || !(f.style in reg.palettes) && !STYLES.some((st) => st.id === f.style)) f = { ...f, style: 'sfapartment' as typeof f.style }
    const palettes: Palette[] = reg.palettes[f.style] ?? styleOf(f.style).palettes
    const pal = palettes[Math.abs(f.id) % palettes.length]
    const tint = rgb(pal.wall)
    // explicit Z (map format v3) when the city was baked with it: the same rule, decided at bake
    let foot = Infinity
    if (f.baseY !== undefined) foot = f.baseY
    else {
      for (const q of ring) foot = Math.min(foot, terrain.heightAt(q.x, q.z))
      foot -= 0.3
    }
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

/**
 * THE ROADS OF A MID-RING TILE, as plain asphalt ribbons (owner, 2026-10-03: "on mobile, due to some memory saving
 * measures, roads don't render at all until you are on top of them … it would be nice if we could render the road at
 * least a little bit ahead of the rider"). On the phone tiers only the rider's own tile is built in full; the rings
 * beyond had massing and no streets, so the road ahead began at the tile's edge. A strip per segment at the street's
 * width and its own (graded) heights — no kerbs, no markings, no junction pads: a few hundred triangles a tile.
 * Not a bridge's or a tunnel's: those are structures, and a ribbon on a tunnel lies across the hill over it.
 */
export function midRoads(scene: Scene, edges: PackedEdge[], terrain: Terrain, tag: string): Mesh[] {
  const out = new MeshBuilder()
  /*
   * The mean colour of the pages these ribbons stand in for, so the mid ring and the textured roads of the
   * rider's own tile agree by construction rather than by eye. (render/road-material.ts stands a page in
   * for itself while it loads, with an inlined 8x8 of the real thing; out here there is no texture at all,
   * so a colour is all there is.)
   * They were darker than the asphalt page by about a third, which put a visible step at the tile border.
   *
   * Measured from directly above, across the tile border, the step in mean road tone goes from 97 against
   * 65 to 100 against 82. Not nothing left, and I tried scaling by the 1.25 the road shader applies to its
   * own sample and the cartoon material does not — it moved the number by one level, so whatever remains
   * is not that, and a factor that does not do what it claims is not worth carrying. The regions either
   * side of a tile border are different streets at different distances under different shadow, so the
   * last few levels are probably the measurement rather than the colour.
   */
  const ASPHALT: [number, number, number] = [0.26, 0.259, 0.263]
  const PATH: [number, number, number] = [0.572, 0.564, 0.549]
  for (const e of edges) {
    /*
     * RAISED ROADS ARE DRAWN HERE TOO, which they were not.
     *
     * Owner, 2026-10-20, on an iPhone: *"I now see cars flying in the air near 514 Townsend. I think
     * that's the freeway! Which renders on desktop but not iOS."* It is the freeway. A raised road's proper
     * deck — with its underside, its pillars and its parapet — is built in the FULL-detail tile pass
     * (render/city.ts `build`), and the ultra tier's full ring is `view: 0`: the rider's own tile and
     * nothing else. Out here this skipped anything raised outright, so the elevated road simply was not
     * there, and the traffic driving along it at its mapped heights hung in the air over a car park.
     *
     * The alternative was to keep cars off raised roads on that tier, which the owner also offered. This is
     * better and costs almost nothing: the quad's height already comes from the edge's own `heights`, so a
     * raised edge lands at the right altitude with no new code, no new material and no new texture — only
     * the few quads the freeway itself is worth. It is a flat ribbon rather than a deck, with no underside
     * and no pillars, which at mid-ring distance reads as a road on an embankment. A road with no visible
     * support reads as unfinished; cars suspended over nothing read as broken.
     *
     * Tunnels still do not qualify: a bore is under the ground, and drawing its surface would lay a ribbon
     * of asphalt across whatever sits on top of it.
     */
    if (!onSurface(e) || e.tunnel) continue
    /*
     * The same two exclusions the full-detail pass makes (render/city.ts `build`), for the same reasons: a
     * way a hand-built landmark draws itself would be drawn twice here and z-fight with the model, and a
     * way that climbs faster than it runs is a lift or a stair core OSM filed as a bridge, which as a road
     * surface is a slab standing on its edge across the path underneath.
     */
    if (e.authored || steeperThanWall(e)) continue
    const pts = unpackPoints(e.points)
    const half = e.foot ? Math.max(0.8, e.width / 2) : e.width / 2
    const y = (i: number): number => (e.heights?.[i] ?? terrain.heightAt(pts[i].x, pts[i].z)) + 0.08
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i]
      const L = Math.hypot(b.x - a.x, b.z - a.z)
      if (L < 0.05) continue
      const nx = -(b.z - a.z) / L * half, nz = (b.x - a.x) / L * half
      out.quad([[a.x - nx, y(i - 1), a.z - nz], [b.x - nx, y(i), b.z - nz], [b.x + nx, y(i), b.z + nz], [a.x + nx, y(i - 1), a.z + nz]],
        [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], e.foot ? PATH : ASPHALT, 0)
    }
  }
  if (out.triangles === 0) return []
  const m = new Mesh(`midroads:${tag}`, scene)
  out.toVertexData().applyToMesh(m)
  const mat = cartoonMaterial(scene, 'cartoonStatic', false)
  m.material = mat
  // the near tiles' asphalt group: after the ground, depth-tested against the buildings
  m.renderingGroupId = 2
  m.isPickable = false
  m.freezeWorldMatrix()
  return [m]
}
