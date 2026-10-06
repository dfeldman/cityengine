/**
 * BOULDERS from Trail Trainer's rock library (owner, 2026-10-06: "can we figure out a better system for rocks and
 * boulders? Trailtrainer … has great looking rocks and boulders for natural landscapes. I'm thinking for the cliffs,
 * the small offshore islands, and the waterfall"). A coastal subset of its rockgen GLBs — dark stratified, weathered
 * grey, cracked; singles and small groups — is copied into public/rocks/ (index.json lists them; the GLBs are
 * gitignored, as Trail Trainer's are). Each model's LOD0 is loaded once; per tile, in the zones with `cliffs: true`,
 * boulders lie where the ground is steep or by the water's edge, each turned and scaled its own way and bedded a
 * little into the ground. Per tile, a clone of each model in use (sharing its geometry) carries that tile's instances,
 * so they go with the tile.
 */
import type { Scene } from '@babylonjs/core/scene'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData'
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader'
import { Matrix, Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector'
import '@babylonjs/loaders/glTF/2.0'
import type { Terrain } from '../city/terrain.ts'
import type { TileLayer } from './city.ts'
import { inRing } from '../map/zones.ts'
import { unpackPoints } from '../city/package.ts'
import { inside } from '../city/park-planting.ts'

interface Zone { ring: number[]; bbox: [number, number, number, number]; props: { cliffs?: boolean } }
interface RockEntry { file: string; species: string; form?: string; bounds: { top: number; radius: number; bottom: number } }
interface Model { mesh: Mesh; entry: RockEntry }

const STEP = 5
const STEEP = 0.5

const hash = (a: number, b: number, k: number): number => {
  const v = Math.sin(a * 127.1 + b * 311.7 + k * 74.7) * 43758.5453
  return v - Math.floor(v)
}

export async function bouldersLayer(scene: Scene, zones: Zone[], terrain: Terrain, sea: number | null | undefined, base: string): Promise<TileLayer | null> {
  const cliffs = zones.filter((z) => z.props.cliffs)
  if (!cliffs.length) return null
  let models: Model[] = []
  {
    try {
      const idx = await fetch(`${base}rocks/index.json`).then((r) => r.json()) as { rocks: RockEntry[] }
      for (const entry of idx.rocks) {
        try {
          const res = await SceneLoader.ImportMeshAsync('', `${base}rocks/`, entry.file, scene)
          const all = res.meshes.filter((m): m is Mesh => m instanceof Mesh && m.getTotalVertices() > 0)
          const lod0 = all.filter((m) => !/LOD[1-9]/i.test(m.name))
          const keep = (lod0.length ? lod0 : all)[0]
          if (!keep) continue
          // (the loader's right-handed __root__ baked into the vertices: thin-instance matrices then mean what they say;
          // and out from under the root BEFORE the rest is disposed, or the root takes it with it)
          keep.setParent(null)
          keep.bakeCurrentTransformIntoVertices()
          for (const m of res.meshes) if (m !== keep) m.dispose()
          keep.isPickable = false
          keep.renderingGroupId = 3
          keep.setEnabled(false)
          models.push({ mesh: keep, entry })
        } catch { /* a missing GLB: the others still serve */ }
      }
    } catch { models = [] }
  }
  if (!models.length) return null
  return {
    name: 'boulders',
    range: 2,
    build(near, rect) {
      const here = cliffs.filter((zn) => zn.bbox[0] < rect.x1 && zn.bbox[2] > rect.x0 && zn.bbox[1] < rect.z1 && zn.bbox[3] > rect.z0)
      if (!here.length) return []
      const water = [...near.tile.areas, ...near.around.areas].filter((a) => a.kind === 'water')
        .map((a) => ({ ring: unpackPoints(a.ring), holes: (a.holes ?? []).map(unpackPoints) }))
      const wet = (x: number, z: number): boolean => water.some((w) => inside(w.ring, x, z) && !w.holes.some((h) => inside(h, x, z)))
      const ways = [...near.tile.edges, ...near.around.edges].map((e) => ({ p: unpackPoints(e.points), half: (e.width ?? 2) / 2 + (e.walk ?? 0) }))
      const onWay = (x: number, z: number, r: number): boolean => ways.some(({ p, half }) => {
        for (let i = 1; i < p.length; i++) {
          const a = p[i - 1], b = p[i], dx = b.x - a.x, dz = b.z - a.z, L2 = dx * dx + dz * dz || 1e-6
          const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / L2))
          if (Math.hypot(x - a.x - dx * t, z - a.z - dz * t) < r + half) return true
        }
        return false
      })
      const per = new Map<number, number[]>()
      const m = new Matrix()
      for (let x = rect.x0; x < rect.x1; x += STEP) {
        for (let z = rect.z0; z < rect.z1; z += STEP) {
          const cx = x + STEP * hash(x, z, 1), cz = z + STEP * hash(x, z, 2)
          if (!here.some((zn) => inRing(zn.ring, cx, cz)) || wet(cx, cz)) continue
          const g = terrain.rawHeightAt(cx, cz)
          if (sea != null && g < sea + 0.3) continue
          const gx = (terrain.rawHeightAt(cx + 1, cz) - terrain.rawHeightAt(cx - 1, cz)) / 2
          const gz = (terrain.rawHeightAt(cx, cz + 1) - terrain.rawHeightAt(cx, cz - 1)) / 2
          const slope = Math.hypot(gx, gz)
          const shore = water.length && [[4, 0], [-4, 0], [0, 4], [0, -4], [8, 0], [-8, 0], [0, 8], [0, -8]].some(([dx, dz]) => wet(cx + dx, cz + dz))
          const share = shore ? 0.55 : slope > STEEP ? 0.22 : 0
          if (hash(cx, cz, 3) > share) continue
          const mi = Math.floor(hash(cx, cz, 4) * models.length) % models.length
          const e = models[mi].entry
          const s = (0.6 + hash(cx, cz, 5) * 1.1) * (shore ? 1.2 : 1)
          if (onWay(cx, cz, e.bounds.radius * s + 0.5)) continue
          // bedded: its own bottom below the ground, and a little more on a slope
          const y = g - e.bounds.bottom * s - 0.15 - slope * 0.3 * e.bounds.radius * s
          Matrix.ComposeToRef(new Vector3(s, s * (0.8 + hash(cx, cz, 6) * 0.4), s), Quaternion.RotationYawPitchRoll(hash(cx, cz, 7) * Math.PI * 2, 0, 0), new Vector3(cx, y, cz), m)
          const list = per.get(mi) ?? []
          for (let i = 0; i < 16; i++) list.push(m.m[i])
          per.set(mi, list)
        }
      }
      const out: Mesh[] = []
      for (const [mi, list] of per) {
        // (its own copy of the model's vertices: a geometry-sharing clone per tile drew past the end of its instance
        // buffer — GL_INVALID_OPERATION — and 1 280 triangles a model is nothing to copy)
        const src = models[mi].mesh
        const c = new Mesh(`boulders:${rect.x0},${rect.z0}:${mi}`, scene)
        VertexData.ExtractFromMesh(src, true, true).applyToMesh(c)
        c.material = src.material
        c.thinInstanceSetBuffer('matrix', new Float32Array(list), 16, false)
        c.thinInstanceRefreshBoundingInfo(false)
        c.isPickable = false
        c.renderingGroupId = 3
        out.push(c)
      }
      return out
    },
  }
}
