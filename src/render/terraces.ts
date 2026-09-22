/**
 * Café terraces: the small round tables and woven chairs set out on the pavement in front of every Paris café
 * and bistro, all facing the street. After the awnings above them they are the most Parisian thing a street
 * has, and nothing else says "somebody lives here" so cheaply.
 *
 * One terrace per café or restaurant OSM names (`kind: 'food'`), on the front of the building it is in, as
 * deep as the pavement allows — one row of tables where it is 2.5 m, two where it is 4 m or more — and never
 * nearer the kerb than a metre and a half, so the pavement stays walkable. A region turns them on
 * (`furniture.terraces`); the chairs are the café-rattan weave of Paris, in the café's own colours.
 */
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import type { Scene } from '@babylonjs/core/scene'
import { MeshBuilder } from './buildings.ts'
import { box, prism } from './models.ts'
import { cartoonMaterial } from './cartoon-material.ts'
import { pavementDepth, streetIndex } from '../city/frontage.ts'
import { unpackPoints, type CityPackage, type PackedBuilding } from '../city/package.ts'
import type { Terrain } from '../city/terrain.ts'
import type { TileLayer } from './city.ts'

type Rgb = [number, number, number]
const FIXED = 0
// mostly pale marble tops; the weave mostly natural rattan, some in a café's colour
const TOP: Rgb[] = [[0.82, 0.81, 0.77], [0.82, 0.81, 0.77], [0.2, 0.2, 0.22]]
const WEAVE: Rgb[] = [[0.5, 0.36, 0.2], [0.5, 0.36, 0.2], [0.44, 0.3, 0.17], [0.16, 0.24, 0.36], [0.4, 0.12, 0.1], [0.16, 0.28, 0.2]]

/** A bistro table: a round top on a single column and a cast foot. At the origin, 0.74 m high. */
function table(out: MeshBuilder, top: Rgb): void {
  const iron: Rgb = [0.12, 0.12, 0.13]
  prism(out, 0, 0, 0, 0.04, 0.24, 6, iron)
  prism(out, 0, 0, 0.04, 0.71, 0.03, 4, iron)
  prism(out, 0, 0, 0.71, 0.74, 0.3, 10, top)
}

/** A woven bistro chair facing +z (toward the street): seat, back, four legs. */
function chair(out: MeshBuilder, weave: Rgb): void {
  const frame: Rgb = [weave[0] * 0.55, weave[1] * 0.55, weave[2] * 0.55]
  // the legs as two thin crossed slabs (8 faces rather than 24): at pavement distance four legs read as two
  box(out, 0, 0.22, 0, 0.18, 0.22, 0.012, frame, FIXED)
  box(out, 0, 0.22, 0, 0.012, 0.22, 0.18, frame, FIXED)
  box(out, 0, 0.45, 0, 0.21, 0.025, 0.21, weave, FIXED)
  box(out, 0, 0.72, -0.2, 0.2, 0.25, 0.02, weave, FIXED)
}

/** A copy of `part` turned by `h` and moved to (x, y, z). */
function stamp(out: MeshBuilder, part: MeshBuilder, x: number, y: number, z: number, h: number): void {
  const c = Math.cos(h)
  const s = Math.sin(h)
  const base = out.positions.length / 3
  for (let i = 0; i < part.positions.length; i += 3) {
    const px = part.positions[i]
    const pz = part.positions[i + 2]
    out.positions.push(x + px * c + pz * s, y + part.positions[i + 1], z - px * s + pz * c)
    const nx = part.normals[i]
    const nz = part.normals[i + 2]
    out.normals.push(nx * c + nz * s, part.normals[i + 1], -nx * s + nz * c)
  }
  out.uvs.push(...part.uvs)
  out.colors.push(...part.colors)
  for (const idx of part.indices) out.indices.push(base + idx)
}

/**
 * Terraces as a per-tile layer (render/city.ts `TileLayer`): the cafés IN the tile, with the buildings and
 * streets of the tile and its neighbours to find their fronts and pavements.
 */
export function terracesLayer(scene: Scene, terrain: Terrain): TileLayer {
  return {
    name: 'terraces',
    build(near) {
      const m = buildTerraces(scene, { edges: near.around.edges, buildings: near.around.buildings, pois: near.tile.pois }, terrain, `terraces:${near.key}`)
      return m ? [m] : []
    },
  }
}

export function buildTerraces(scene: Scene, pkg: Pick<CityPackage, 'edges' | 'buildings' | 'pois'>, terrain: Terrain, name = 'terraces'): Mesh | null {
  const streets = streetIndex(pkg.edges.filter((e) => !e.foot && !e.tunnel && (e.layer ?? 0) >= 0))
  const index = new Map<string, PackedBuilding[]>()
  for (const b of pkg.buildings) {
    if ((b.minHeight ?? 0) > 2) continue
    const r = b.ring
    const k = `${Math.floor(r[0] / 100)},${Math.floor(r[1] / 100)}`
    const list = index.get(k)
    if (list) list.push(b)
    else index.set(k, [b])
  }
  const out = new MeshBuilder()
  let n = 0
  for (const poi of pkg.pois) {
    if (poi.kind !== 'food') continue
    // the front of the building the café is in: the nearest street-facing wall within 14 m of the point
    let best: { x: number; z: number; nx: number; nz: number; len: number; depth: number; ux: number; uz: number } | null = null
    let bestD = 14
    const gx = Math.floor(poi.x / 100)
    const gz = Math.floor(poi.z / 100)
    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        for (const b of index.get(`${gx + dx},${gz + dz}`) ?? []) {
          const ring = unpackPoints(b.ring)
          for (let i = 0; i < ring.length; i++) {
            const a = ring[i]
            const c = ring[(i + 1) % ring.length]
            const ex = c.x - a.x
            const ez = c.z - a.z
            const len = Math.hypot(ex, ez)
            if (len < 4) continue
            const t = Math.max(0.15, Math.min(0.85, ((poi.x - a.x) * ex + (poi.z - a.z) * ez) / (len * len)))
            const px = a.x + ex * t
            const pz = a.z + ez * t
            const d = Math.hypot(poi.x - px, poi.z - pz)
            if (d >= bestD) continue
            const nx = ez / len
            const nz = -ex / len
            const depth = pavementDepth(streets, px, pz, nx, nz)
            if (depth === null) continue
            bestD = d
            best = { x: px, z: pz, nx, nz, len, depth, ux: ex / len, uz: ez / len }
          }
        }
      }
    }
    if (!best) continue
    // at least a metre and a half of pavement left between the tables and the kerb
    const usable = best.depth - 1.5
    if (usable < 1.1) continue
    const rows = usable >= 2.6 ? 2 : 1
    const along = Math.min(best.len * 0.7, 9)
    const per = Math.max(1, Math.floor(along / 1.5))
    let seed = Math.imul(Math.round(poi.x * 10) ^ Math.imul(Math.round(poi.z * 10), 0x27d4eb2d), 0x9e3779b1) >>> 0
    const rnd = (): number => ((seed = Math.imul(seed ^ (seed >>> 15), 0x2c1b3c6d) >>> 0) / 4294967296)
    const topColour = TOP[Math.floor(rnd() * TOP.length)]
    const weave = WEAVE[Math.floor(rnd() * WEAVE.length)]
    const t = new MeshBuilder()
    table(t, topColour)
    const ch = new MeshBuilder()
    chair(ch, weave)
    // chairs face the street (+normal): heading so that local +z is the wall's outward normal
    const face = Math.atan2(best.nx, best.nz)
    for (let r = 0; r < rows; r++) {
      const off = 0.75 + r * 1.35
      for (let i = 0; i < per; i++) {
        const a = -along / 2 + (i + 0.5) * (along / per)
        const x = best.x + best.ux * a + best.nx * off
        const z = best.z + best.uz * a + best.nz * off
        const y = terrain.heightAt(x, z) + 0.15
        stamp(out, t, x, y, z, 0)
        // two chairs a table, side by side between it and the wall, both looking out at the street
        for (const s of [-1, 1]) {
          const cx = x + best.ux * s * 0.38 - best.nx * 0.42
          const cz = z + best.uz * s * 0.38 - best.nz * 0.42
          stamp(out, ch, cx, terrain.heightAt(cx, cz) + 0.15, cz, face + (rnd() - 0.5) * 0.5)
        }
      }
    }
    n++
  }
  if (n === 0) return null
  const m = new Mesh(name, scene)
  out.toVertexData().applyToMesh(m)
  m.material = cartoonMaterial(scene, 'cartoonTerrace', false)
  m.renderingGroupId = 3
  m.isPickable = false
  m.freezeWorldMatrix()
  return m
}
