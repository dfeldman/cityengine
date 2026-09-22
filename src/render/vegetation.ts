/**
 * Trees, taken wholesale from Trail Trainer.
 *
 * `public/trees` is a symlink into `trailtrainer/public/trees`: 680 generated GLB models with three levels of
 * detail each, 255 MB of them. Copying would be absurd and regenerating them would be worse — the Blender
 * pipeline that made them is in that project and works. Only the species a city actually plants are loaded:
 * a street tree is a plane, a lime or a maple, not a spruce, and a Paris park is not a pine forest.
 *
 * They are the one realistic thing in a scene of cartoon cars and box people, and that is deliberate rather
 * than sloppy: foliage is the element the eye is least willing to accept stylised, and a generated tree at
 * 1 100 triangles is cheaper than a convincing cartoon one would be. Everything is thin-instanced, so the
 * whole canopy of a neighbourhood is a handful of draw calls.
 *
 * Three places get planted, in descending order of how much they matter:
 *
 *   1. **Individually mapped trees** (`natural=tree`) — 2 179 of them in the Marais, which is the real
 *      street planting of a real neighbourhood, in the real places.
 *   2. **Parks, gardens, grass and wood** — scattered inside the mapped polygons.
 *   3. **Wide streets**, evenly along the pavement, because a boulevard is tree-lined and OSM rarely says so.
 */
import { Matrix, Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight'
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight'
import { PEOPLE } from './layers.ts'
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader'
import type { Scene } from '@babylonjs/core/scene'
import '@babylonjs/loaders/glTF/2.0'
import { Vector3 as V3 } from '@babylonjs/core/Maths/math.vector'
import { DAYLIGHT, OVERCAST } from './facade-material.ts'
import { MeshBuilder } from './buildings.ts'
import { addShadow, shadowMaterial, shadowOffset, SHADOW_Y } from './shadows.ts'
import { Mesh as BMesh } from '@babylonjs/core/Meshes/mesh'
import type { Terrain } from '../city/terrain.ts'
import { plantHash, unpackPlantings, type Planting } from '../city/plantings.ts'
import type { TileLayer } from './city.ts'

/** The species a city plants, and how often relative to each other. */
// Street trees are SMALL. A poplar or a mature elm on a pavement is a forest giant leaning over the road;
// what a city actually plants is something that stays under the windows of the first floor.
const STREET_TREES: [string, number][] = [['maple', 4], ['birch', 3], ['ash', 3], ['beech', 1]]
const PARK_TREES: [string, number][] = [['oak', 4], ['beech', 3], ['birch', 3], ['maple', 3], ['willow', 1]]

interface TreeEntry { species: string; file: string; height: number; bounds?: { top: number } }

/** Where a tree goes, worked out once at load and then never again. */
/** `height` is the tree's height in METRES, not a scale: the models are forest trees of all sizes */
export type { Planting }

export class Vegetation {
  private readonly scene: Scene
  private readonly base: string
  private plantings: Planting[] = []
  private loaded = false
  private planted = 0
  private readonly terrain: Terrain
  /** the trees of each tile built now (render/city.ts `TileLayer`): what the instance buffers hold */
  private readonly byTile = new Map<string, Planting[]>()
  private dirty = false
  private models: { parts: Mesh[]; park: boolean; top: number }[] = []

  constructor(scene: Scene, terrain: Terrain, assetBase: string) {
    this.scene = scene
    this.base = assetBase
    this.terrain = terrain
  }

  get count(): number { return this.plantings.length }

  /**
   * The trees as a per-tile layer: a tile brings its trees (decided at bake, city/plantings.ts) and their
   * shadows, and takes them away when dropped. The instance buffers are one per model part for the whole
   * city, rebuilt from the tiles present when that changes — one draw call a part, not one a part a tile.
   */
  layer(): TileLayer {
    return {
      name: 'trees',
      build: (near) => {
        const ps = unpackPlantings(near.tile.plantings)
        this.byTile.set(near.key, ps)
        this.dirty = true
        const shadow = this.castShadows(ps, `shadow:trees:${near.key}`)
        return shadow ? [shadow] : []
      },
      release: (k) => { if (this.byTile.delete(k)) this.dirty = true },
    }
  }

  /** Once a frame: re-plant if the tiles changed and the models are here. */
  update(): void {
    if (!this.dirty || this.models.length === 0) return
    this.dirty = false
    this.plantings = [...this.byTile.values()].flat()
    this.plant()
  }

  /**
   * Load a handful of models and plant everything on them.
   *
   * Only a few models per role: twelve identical trees down a street are far less noticeable than the load
   * time and memory of twelve different ones, because each is rotated and scaled differently and the eye
   * reads the canopy rather than the individual tree.
   *
   * A generated tree arrives as SEVERAL meshes — bark and leaves are separate materials — so a model is
   * tracked as a group and every planting instances all of its parts with the same matrix. Assigning parts
   * independently is how you get a street of bare trunks standing next to floating canopies.
   */
  async load(): Promise<void> {
    if (this.loaded) return
    this.loaded = true
    /**
     * A light, purely for the trees.
     *
     * Everything else in this scene is lit by hand-written shaders that take the sun as a uniform, so the
     * scene has no Babylon light in it at all — and the trees arrive from Trail Trainer with their own PBR
     * materials, which need one. Without it every tree in the city renders as a black silhouette. The two
     * lights here are matched to the same sun and sky the shaders use, so the foliage agrees with the
     * buildings it stands in front of.
     */
    if (!this.scene.lights.some((l) => l.name === 'foliage')) {
      const sky = new HemisphericLight('foliage', new V3(0, 1, 0), this.scene)
      sky.diffuse = DAYLIGHT.skyColour.scale(1.5)
      sky.groundColor = DAYLIGHT.groundColour.scale(1.6)
      /*
       * Dimmed under cloud. Overcast raises the ambient and drops the sun, which is right for the city but
       * leaves the trees — the one thing here lit by real Babylon lights rather than by hand — brighter
       * than they were in sunshine, and a glowing green tree under a grey sky is the first thing the eye
       * picks out as wrong.
       */
      sky.intensity = 1.0 * (1 - 0.35 * OVERCAST)
      sky.excludeWithLayerMask = PEOPLE
      const sun = new DirectionalLight('foliage-sun', DAYLIGHT.sun.clone(), this.scene)
      sun.diffuse = new Color3(DAYLIGHT.sunColour.r, DAYLIGHT.sunColour.g, DAYLIGHT.sunColour.b)
      // matched to the hour: a tree lit for noon under a midnight sky is the one thing that gives a
      // faked night away immediately
      sun.intensity = 1.6 * (0.2 + 0.8 * Math.min(1, DAYLIGHT.sunColour.r))
      sun.specular = new Color3(0.05, 0.05, 0.05)
      sun.excludeWithLayerMask = PEOPLE
    }

    const index = (await (await fetch(`${this.base}index.json`)).json()) as { trees: TreeEntry[] }

    const pick = (spec: [string, number][], n: number): TreeEntry[] => {
      const out: TreeEntry[] = []
      const total = spec.reduce((t, [, w]) => t + w, 0)
      for (const [species, weight] of spec) {
        const of = index.trees.filter((t) => t.species === species)
        const want = Math.max(1, Math.round((weight / total) * n))
        for (let i = 0; i < want && i < of.length; i++) out.push(of[(i * 7) % of.length])
      }
      return out
    }

    // a model is a group of meshes that must be instanced together
    const models: { parts: Mesh[]; park: boolean; top: number }[] = []
    for (const [entries, park] of [[pick(STREET_TREES, 5), false], [pick(PARK_TREES, 5), true]] as const) {
      for (const entry of entries) {
        const result = await SceneLoader.ImportMeshAsync('', this.base, entry.file, this.scene)
        const all = result.meshes.filter((m): m is Mesh => m instanceof Mesh && m.getTotalVertices() > 0)
        /**
         * Only the closest level of detail.
         *
         * Each tree GLB carries three — `LOD0_primitive0`, `LOD1_primitive0` and so on as separate meshes —
         * and instancing every mesh in the file drew each tree three times on top of itself. Worse, any LOD
         * authored at a different scale then appeared at that scale, which is where the occasional tree
         * bigger than the city came from. Using them as real LODs by distance is the improvement; picking
         * one is the fix.
         */
        const lod0 = all.filter((m) => !/LOD[1-9]/i.test(m.name))
        const parts = lod0.length > 0 ? lod0 : all
        for (const m of all) if (!parts.includes(m)) m.dispose()
        if (parts.length === 0) continue
        for (const m of parts) {
          m.isPickable = false
          m.alwaysSelectAsActiveMesh = true
          /**
           * The loader's `__root__` transform is BAKED INTO THE VERTICES, not left on the node.
           *
           * glTF is right-handed and Babylon is not, so the loader parents everything it imports to a
           * `__root__` scaled (1, 1, -1). A thin-instance matrix is combined with the mesh's world matrix,
           * which means the translation in it is read in the PARENT's space — so every instance placed at
           * (x, y, z) was actually planted at (x, y, -z), mirrored across the map.
           *
           * On a flat city that is invisible: the tree lands in the wrong block, but the ground is at the
           * same height either way and nothing looks wrong. On Nob Hill, with a hundred metres of relief, a
           * tree took the height of where it was MEANT to go and the position of somewhere else: of the 203
           * street trees here, 19 landed within three metres of the ground, 125 were buried under it, and
           * 59 were left hanging in the sky. Those are the trees floating over the skyline.
           *
           * `setParent(null)` moves the root's transform down into the mesh's own, and baking then moves it
           * into the vertices, leaving the world matrix an identity — at which point a thin-instance matrix
           * means exactly what it says. Babylon flips the winding itself when it bakes a negative
           * determinant, so the handedness flip survives as geometry and the tree still faces the right way.
           */
          m.setParent(null)
          m.bakeCurrentTransformIntoVertices()
          // the same group as the buildings: the ground layers clear depth, and anything left in group 0 is
          // either buried by the street or, where the street does not reach, shows through the grass
          m.renderingGroupId = 3

          /**
           * Foliage is an alpha CUTOUT, not alpha blending.
           *
           * A leaf card is a texture with holes in it, and the kit's GLBs arrive with those materials set to
           * blend. A blended mesh is not depth-sorted per pixel — it is sorted once, by the distance to its
           * bounding box — and a thin-instanced tree's bounding box covers every copy of it in the city, a
           * box well over a kilometre across. So the whole canopy of the neighbourhood sorted as a single
           * object at the middle of the map and drew over everything in front of it: leaves across the
           * grass, across the road, and a tree that appeared to be standing in front of the entire city.
           *
           * As a cutout the fragments are simply discarded where the texture is transparent, the mesh is
           * opaque, and every leaf depth-tests like anything else.
           */
          const mat = m.material as { transparencyMode?: number | null; needDepthPrePass?: boolean
            alphaCutOff?: number; separateCullingPass?: boolean } | null
          if (mat) {
            mat.transparencyMode = 1          // Material.MATERIAL_ALPHATEST
            mat.alphaCutOff = 0.45
            mat.needDepthPrePass = false
          }
          m.isPickable = false
        }
        models.push({ parts, park, top: entry.bounds?.top ?? entry.height ?? 12 })
      }
    }
    if (models.length === 0) return
    this.models = models
    this.dirty = true
    this.update()
  }

  /** Every tree of the tiles present on its model: the instance buffers, rewritten whole. */
  private plant(): void {
    const models = this.models

    const street = models.filter((m) => !m.park)
    const parkland = models.filter((m) => m.park)
    const buckets = new Map<Mesh, Matrix[]>()

    this.plantings.forEach((p) => {
      const pool = p.park && parkland.length > 0 ? parkland : street.length > 0 ? street : models
      // by where it stands, not by its place in a list: a streamed tile picks the same model every time
      const model = pool[plantHash(p.x, p.z) % pool.length]
      /*
       * Sized by HEIGHT. The models are generated forest trees, ten to twenty metres and all different, and
       * one scale range for all of them made some street trees as tall as the buildings — which is not what
       * a city plants. A street tree is six to nine metres; each model is scaled to reach its planting's
       * height from its own measured top.
       */
      const scale = Math.min(2, Math.max(0.1, p.height / model.top))
      const matrix = Matrix.Compose(
        new Vector3(scale, scale, scale),
        Quaternion.RotationAxis(Vector3.Up(), p.spin),
        // on the ground, not at sea level: a city with any relief left every tree hanging in the air
        new Vector3(p.x, 0.16 + this.terrain.heightAt(p.x, p.z), p.z))
      for (const part of model.parts) {
        const list = buckets.get(part) ?? []
        list.push(matrix)
        buckets.set(part, list)
      }
    })

    // trees do not move, so the matrices are written once and never touched again
    for (const model of models) {
      for (const part of model.parts) {
        const list = buckets.get(part)
        if (!list || list.length === 0) {
          part.thinInstanceCount = 0
          // A thin-instanced mesh with no instances is still DRAWN, once, at the origin — the same trap the
          // vehicle pools fell into. A model that happened to get no plantings left a tree standing in the
          // middle of the city with nothing under it.
          part.setEnabled(false)
          continue
        }
        const buf = new Float32Array(list.length * 16)
        list.forEach((m, i) => m.copyToArray(buf, i * 16))
        part.thinInstanceSetBuffer('matrix', buf, 16)
        // the box round every copy, or the whole model is culled by where its first trees stood
        part.thinInstanceRefreshBoundingInfo(false)
        part.setEnabled(true)
      }
    }
    this.planted = this.plantings.length
  }

  /**
   * A shadow under every tree.
   *
   * A street tree with no shadow reads as a sticker — the one place the eye reliably notices the omission,
   * because a tree is a big object standing on open ground where a shadow has nowhere to hide. The same
   * projection the buildings use works here: a rough crown, slid along the sun by the tree's height.
   *
   * One mesh for the whole city rather than one per tile. Trees do not move, the shadows are flat, and two
   * thousand small polygons in a single buffer is cheaper than the bookkeeping of streaming them.
   */
  private castShadows(plantings: Planting[], name: string): BMesh | null {
    const off = shadowOffset(DAYLIGHT.sun)
    const out = new MeshBuilder()
    for (const p of plantings) {
      // the models average about twelve metres, and the crown is roughly a fifth of that across
      const height = p.height
      const crown = p.height * 0.2
      const ring: { x: number; z: number }[] = []
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2
        ring.push({ x: p.x + Math.cos(a) * crown, z: p.z + Math.sin(a) * crown * 0.92 })
      }
      addShadow(out, ring, height, off, SHADOW_Y)
    }
    if (out.triangles === 0) return null
    this.terrain.drape(out.positions)
    const m = new BMesh(name, this.scene)
    out.toVertexData().applyToMesh(m)
    m.material = shadowMaterial(this.scene)
    m.renderingGroupId = 3
    m.isPickable = false
    return m
  }

  get plantedCount(): number { return this.planted }
}

