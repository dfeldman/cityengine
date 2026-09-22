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
/*
 * The woven chairs of a Paris terrace come in every colour and pattern (user, BUGS.md #11): a café picks a
 * pair — the weave and the pattern woven into it — from these, so neighbouring terraces rarely match.
 */
const WEAVE: Rgb[] = [[0.5, 0.36, 0.2], [0.44, 0.3, 0.17], [0.16, 0.24, 0.36], [0.4, 0.12, 0.1], [0.16, 0.28, 0.2],
  [0.82, 0.78, 0.68], [0.12, 0.12, 0.13], [0.62, 0.16, 0.14], [0.2, 0.36, 0.52], [0.78, 0.62, 0.22], [0.3, 0.45, 0.3],
  [0.55, 0.2, 0.35], [0.9, 0.88, 0.84]]

/** A bistro table: a round top on a single column and a cast foot. At the origin, 0.74 m high. */
function table(out: MeshBuilder, top: Rgb): void {
  const iron: Rgb = [0.12, 0.12, 0.13]
  prism(out, 0, 0, 0, 0.04, 0.24, 6, iron)
  prism(out, 0, 0, 0.04, 0.71, 0.03, 4, iron)
  // small and round, always: a 60 cm top
  prism(out, 0, 0, 0.71, 0.735, 0.3, 14, top)
}

/**
 * A woven bistro chair facing +z: four thin legs, a thin seat, a lower back on two uprights. The legs were
 * two crossed slabs as wide as the seat, which from a bike read as a solid block (BUGS.md #11).
 */
function chair(out: MeshBuilder, weave: Rgb, pattern: Rgb): void {
  const frame: Rgb = [weave[0] * 0.5, weave[1] * 0.5, weave[2] * 0.5]
  for (const [lx, lz] of [[-0.17, -0.17], [0.17, -0.17], [-0.17, 0.17], [0.17, 0.17]]) {
    box(out, lx, 0.22, lz, 0.016, 0.22, 0.016, frame, FIXED)
  }
  // the seat in the weave with a band of the pattern across it, the back striped the same way
  box(out, 0, 0.455, 0, 0.2, 0.02, 0.2, weave, FIXED)
  box(out, 0, 0.477, 0, 0.2, 0.004, 0.05, pattern, FIXED)
  for (const lx of [-0.17, 0.17]) box(out, lx, 0.66, -0.18, 0.016, 0.2, 0.016, frame, FIXED)
  box(out, 0, 0.75, -0.19, 0.19, 0.08, 0.012, weave, FIXED)
  box(out, 0, 0.64, -0.19, 0.19, 0.03, 0.014, pattern, FIXED)
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
    const per = Math.max(1, Math.floor(along / 1.6))
    let seed = Math.imul(Math.round(poi.x * 10) ^ Math.imul(Math.round(poi.z * 10), 0x27d4eb2d), 0x9e3779b1) >>> 0
    const rnd = (): number => ((seed = Math.imul(seed ^ (seed >>> 15), 0x2c1b3c6d) >>> 0) / 4294967296)
    const topColour = TOP[Math.floor(rnd() * TOP.length)]
    const weave = WEAVE[Math.floor(rnd() * WEAVE.length)]
    let pattern = WEAVE[Math.floor(rnd() * WEAVE.length)]
    if (pattern === weave) pattern = WEAVE[(WEAVE.indexOf(weave) + 5) % WEAVE.length]
    const t = new MeshBuilder()
    table(t, topColour)
    const ch = new MeshBuilder()
    chair(ch, weave, pattern)
    // chairs face the street (+normal): heading so that local +z is the wall's outward normal
    const face = Math.atan2(best.nx, best.nz)
    const along2 = Math.atan2(best.ux, best.uz)
    const place = (cx: number, cz: number, h: number): void =>
      stamp(out, ch, cx, terrain.heightAt(cx, cz) + 0.15, cz, h + (rnd() - 0.5) * 0.16)
    /*
     * Tables in rows along the front (BUGS.md #11), set the Paris way — two chairs side by side between table
     * and wall, both looking out at the street, turned a little toward each other — and one in ten for a
     * conversation, a chair either side across the table. Level, and turned only a few degrees at random: a
     * larger turn read as chairs tipped over.
     */
    for (let r = 0; r < rows; r++) {
      const off = 0.9 + r * 1.45
      for (let i = 0; i < per; i++) {
        const a = -along / 2 + (i + 0.5) * (along / per)
        const x = best.x + best.ux * a + best.nx * off
        const z = best.z + best.uz * a + best.nz * off
        stamp(out, t, x, terrain.heightAt(x, z) + 0.15, z, 0)
        if (rnd() < 0.9) {
          for (const sd of [-1, 1]) {
            place(x + best.ux * sd * 0.34 - best.nx * 0.46, z + best.uz * sd * 0.34 - best.nz * 0.46, face - sd * 0.26)
          }
        } else {
          // across the table, along the front, each turned a little toward the street
          for (const sd of [-1, 1]) {
            place(x + best.ux * sd * 0.5, z + best.uz * sd * 0.5, along2 + (sd > 0 ? Math.PI : 0) + sd * 0.35)
          }
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
