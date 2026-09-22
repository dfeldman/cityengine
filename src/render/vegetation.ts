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
import { DEFAULT_FLORA, type Flora } from './flora.ts'
import { palmModel, type PalmKind } from './palms.ts'
import { formCode, type TreeForm } from '../city/tree-forms.ts'

/** each palm kind's seed family, so the same kind is the same palms everywhere */
const PALM_SEEDS: Record<PalmKind, number> = { canary: 1, fan: 2, queen: 3, spiky: 4 }

// The species a city plants come from its region (render/flora.ts): San Francisco's include generated palms.

interface TreeEntry { species: string; file: string; height: number; bounds?: { top: number }; season?: string; base?: string }
type Model = { parts: Mesh[]; far: Mesh[]; farther: Mesh[]; park: boolean; top: number; palm?: boolean }

/** Where a tree goes, worked out once at load and then never again. */
/** `height` is the tree's height in METRES, not a scale: the models are forest trees of all sizes */
export type { Planting }

/** metres from the eye within which a tree is drawn at its full detail */
const NEAR_LOD = 90

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
  /**
   * Each model's parts at two levels of detail: `parts` (LOD0) near the eye, `far` (the file's own LOD1, or
   * LOD0 when it has none) beyond `NEAR_LOD` metres (PARIS_EXPAND §6 item 7). LOD0 of every tree in view was
   * seven million triangles at the Concorde, half of all there were.
   */
  private models: Model[] = []
  /** the models of each form (city/tree-forms.ts), by its code */
  private formPools = new Map<number, Model[]>()
  /** the palms `palmChance` puts in place of a form-0 planting */
  private districtPalms: Model[] = []
  private focus: { x: number; z: number } | null = null
  private plantedAt: { x: number; z: number } | null = null

  private readonly flora: Flora

  constructor(scene: Scene, terrain: Terrain, assetBase: string, flora: Flora = DEFAULT_FLORA) {
    this.scene = scene
    this.base = assetBase
    this.terrain = terrain
    this.flora = flora
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

  /** Once a frame: re-plant if the tiles changed, or the eye moved far enough to change who is near. */
  update(eye?: { x: number; z: number }): void {
    if (eye) this.focus = { x: eye.x, z: eye.z }
    if (this.focus && this.plantedAt && Math.hypot(this.focus.x - this.plantedAt.x, this.focus.z - this.plantedAt.z) > 30) this.dirty = true
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

    // the library, and the region's own beside it; only trees in leaf: the library has autumn and snow-topped winter
    // trees for Trail Trainer's forests, and a red maple or a bare one in a San Francisco street was a random draw
    const libs = [this.base, ...(this.flora.library ? [new URL(`../${this.flora.library}/`, this.base).href] : [])]
    const index: TreeEntry[] = []
    for (const base of libs) {
      const got = await fetch(`${base}index.json`).then((r) => (r.ok ? r.json() : { trees: [] })).catch(() => ({ trees: [] })) as { trees: TreeEntry[] }
      for (const t of got.trees) if (!t.season || t.season === 'summer') index.push({ ...t, base })
    }

    const pick = (spec: [string, number][], n: number): TreeEntry[] => {
      const out: TreeEntry[] = []
      const total = spec.reduce((t, [, w]) => t + w, 0)
      for (const [species, weight] of spec) {
        const of = index.filter((t) => t.species === species)
        const want = Math.max(1, Math.round((weight / total) * n))
        for (let i = 0; i < want && i < of.length; i++) out.push(of[(i * 7) % of.length])
      }
      return out
    }

    // a model is a group of meshes that must be instanced together
    const models: Model[] = []
    const palmsBase = new URL('../palms/', this.base).href
    const palmCache = new Map<string, Model>()
    const palmOf = (kind: PalmKind, i: number): Model => {
      const key = `${kind}:${i}`
      let m = palmCache.get(key)
      if (!m) {
        m = { ...palmModel(this.scene, palmsBase, kind, 1000 * (PALM_SEEDS[kind] ?? 1) + i * 7919), park: false, palm: true }
        palmCache.set(key, m)
        models.push(m)
      }
      return m
    }
    // the generated palms (render/palms.ts), their textures beside the library's trees
    this.districtPalms = []
    for (const { kind, models: n } of this.flora.palms ?? []) for (let i = 0; i < n; i++) this.districtPalms.push(palmOf(kind, i))
    const fileCache = new Map<string, Model | null>()
    const loadEntry = async (entry: TreeEntry, park: boolean): Promise<Model | null> => {
      const key = `${entry.base}${entry.file}:${park}`
      if (fileCache.has(key)) return fileCache.get(key)!
      fileCache.set(key, null)
      const result = await SceneLoader.ImportMeshAsync('', entry.base ?? this.base, entry.file, this.scene)
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
      const lod1 = all.filter((m) => /LOD1/i.test(m.name))
      const far = lod1.length > 0 ? lod1 : parts
      const lod2 = all.filter((m) => /LOD2/i.test(m.name))
      const farther = lod2.length > 0 ? lod2 : far
      for (const m of all) if (!parts.includes(m) && !far.includes(m) && !farther.includes(m)) m.dispose()
      if (parts.length === 0) return null
      for (const m of new Set([...parts, ...far, ...farther])) {
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
      const model: Model = { parts, far, farther, park, top: entry.bounds?.top ?? entry.height ?? 12 }
      models.push(model)
      fileCache.set(key, model)
      return model
    }
    for (const [entries, park] of [[pick(this.flora.street, 5), false], [pick(this.flora.park, 5), true]] as const) {
      for (const entry of entries) await loadEntry(entry, park)
    }
    // the forms: each its own pool, from the library or the palms
    this.formPools.clear()
    for (const [form, spec] of Object.entries(this.flora.forms ?? {}) as [TreeForm, [string, number][]][]) {
      const n = this.flora.formModels?.[form] ?? 3
      const pool: Model[] = []
      const trees = spec.filter(([sp]) => !sp.startsWith('palm:'))
      for (const [sp, w] of spec) {
        if (!sp.startsWith('palm:')) continue
        const want = Math.max(1, Math.round((w / spec.reduce((t, [, x]) => t + x, 0)) * n))
        for (let i = 0; i < want; i++) pool.push(palmOf(sp.slice(5) as PalmKind, i))
      }
      if (trees.length > 0) for (const entry of pick(trees, n)) { const m = await loadEntry(entry, false); if (m) pool.push(m) }
      if (pool.length > 0) this.formPools.set(formCode(form), pool)
    }
    if (models.length === 0) return
    this.models = models
    this.dirty = true
    this.update()
  }

  /** Every tree of the tiles present on its model: the instance buffers, rewritten whole. */
  private plant(): void {
    const models = this.models

    // (the form-0 pools: the flora's street and park species and its district palms, not the forms' own)
    const inForms = new Set([...this.formPools.values()].flat())
    const street = models.filter((m) => !m.park && !m.palm && !inForms.has(m))
    const parkland = models.filter((m) => m.park)
    const palms = this.districtPalms
    const buckets = new Map<Mesh, Matrix[]>()

    this.plantings.forEach((p) => {
      // a palm where the region plants them (the Embarcadero's row), by the planting's own hash so it is the same
      // tree every session; in parks at half the rate
      const h = plantHash(p.x, p.z)
      const own = p.form ? this.formPools.get(p.form) : undefined
      const palmHere = !own && palms.length > 0 && this.flora.palmChance
        ? ((h >>> 11) % 1000) / 1000 < this.flora.palmChance(p.x, p.z) * (p.park ? 0.5 : 1) : false
      const pool = own ?? (palmHere ? palms : p.park && parkland.length > 0 ? parkland : street.length > 0 ? street : models)
      // by where it stands, not by its place in a list: a streamed tile picks the same model every time
      const model = pool[h % pool.length]
      /*
       * Sized by HEIGHT. The models are generated forest trees, ten to twenty metres and all different, and
       * one scale range for all of them made some street trees as tall as the buildings — which is not what
       * a city plants. A street tree is six to nine metres; each model is scaled to reach its planting's
       * height from its own measured top.
       */
      // (a palm is its own height, give or take: a street palm is taller than the street trees, not squeezed to them)
      // (a palm of a known form was measured too: its height is the city's, within what the model can stretch to)
      const scale = model.palm
        ? own ? Math.min(1.5, Math.max(0.55, p.height / model.top)) : 0.85 + ((h >>> 5) % 100) / 330
        : Math.min(2, Math.max(0.1, p.height / model.top))
      const matrix = Matrix.Compose(
        new Vector3(scale, scale, scale),
        Quaternion.RotationAxis(Vector3.Up(), p.spin),
        // on the ground, not at sea level: a city with any relief left every tree hanging in the air
        new Vector3(p.x, 0.16 + this.terrain.heightAt(p.x, p.z), p.z))
      // near the eye the full tree, beyond it the lighter one
      const d = this.focus ? Math.hypot(p.x - this.focus.x, p.z - this.focus.z) : 0
      for (const part of d < NEAR_LOD ? model.parts : d < 2.5 * NEAR_LOD ? model.far : model.farther) {
        const list = buckets.get(part) ?? []
        list.push(matrix)
        buckets.set(part, list)
      }
    })
    this.plantedAt = this.focus ? { ...this.focus } : null

    // trees do not move, so the matrices are written once and never touched again
    for (const model of models) {
      for (const part of new Set([...model.parts, ...model.far, ...model.farther])) {
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

