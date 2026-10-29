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
import { deckPlantings } from '../city/park-planting.ts'
import type { TileLayer } from './city.ts'
import { DEFAULT_FLORA, type Flora } from './flora.ts'
import { palmModel, type PalmKind } from './palms.ts'
import { formCode, type TreeForm } from '../city/tree-forms.ts'
import { thicken } from './infill.ts'
import { TILE } from '../city/tiles.ts'
import { assetRootAndFile, fetchAssetJson } from '../assets.ts'

/** each palm kind's seed family, so the same kind is the same palms everywhere */
const PALM_SEEDS: Record<PalmKind, number> = { canary: 1, fan: 2, queen: 3, spiky: 4, windmill: 5, treefern: 6 }

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
  /**
   * Each tile's trees already worked out: the model each one stands on and its 16-float world matrix, laid
   * end to end.
   *
   * A tree never moves, so its matrix is the same every time — but `plant()` runs again every thirty metres
   * the eye travels, because WHICH level of detail each tree is drawn at changes, and it used to rebuild
   * every matrix from scratch to find that out. That cost nothing while a tile held a dozen street trees. It
   * costs 8 ms a rebuild in Golden Gate Park, where a 7 × 7 block of tiles holds fifteen thousand
   * (city/park-planting.ts) — a visible hitch every few seconds. Composing them once a tile and only
   * re-sorting them into buckets afterwards is the same picture for 1 ms.
   */
  private readonly seated = new Map<string, { mats: Float32Array; model: Model[] }>()
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

  /**
   * How many times the baked count a closed wood ends up with (`?veg=`, render/infill.ts). 1 is the package
   * as it was baked; the default closes the canopy, which is what the park actually looks like.
   */
  private readonly thickness: number

  /** the merging of BUGS.md #205, off with `?vegmerge=0` so the two can be measured against each other */
  private readonly merge: boolean

  constructor(scene: Scene, terrain: Terrain, assetBase: string, flora: Flora = DEFAULT_FLORA, thickness = 1, merge = true) {
    this.scene = scene
    this.base = assetBase
    this.terrain = terrain
    this.flora = flora
    this.thickness = thickness
    this.merge = merge
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
        const ps = this.cleared(thicken(unpackPlantings(near.tile.plantings, near.tile.plantingY), near.tile.edges, this.thickness))
        this.byTile.set(near.key, ps)
        this.dirty = true
        const shadow = this.castShadows(ps, `shadow:trees:${near.key}`)
        return shadow ? [shadow] : []
      },
      release: (k) => { this.seated.delete(k); if (this.byTile.delete(k)) this.dirty = true },
    }
  }

  /**
   * CLEARINGS: ground a landmark has paved (MeshBuilder.grounds — a plaza's promenade, a playground) grows no trees.
   * The park scatter planted Civic Center's promenade and its playgrounds full of trees (2026-10-03). A clearing that
   * arrives after a tile's trees takes them out of it too.
   */
  private readonly clearings: { ring: { x: number; z: number }[]; x0: number; x1: number; z0: number; z1: number }[] = []
  clear(ring: { x: number; z: number }[]): void {
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
    for (const q of ring) { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); z0 = Math.min(z0, q.z); z1 = Math.max(z1, q.z) }
    const c = { ring, x0, x1, z0, z1 }
    this.clearings.push(c)
    // (the trees already planted against THIS ring only: hundreds of footprints arrive, one at a time)
    for (const [k, ps] of this.byTile) {
      const kept = this.cleared(ps, [c])
      if (kept.length !== ps.length) { this.byTile.set(k, kept); this.seated.delete(k); this.dirty = true }
    }
  }
  private cleared(ps: Planting[], clearings = this.clearings): Planting[] {
    if (clearings.length === 0) return ps
    const inside = (r: { x: number; z: number }[], x: number, z: number): boolean => {
      let o = false
      for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
        if ((r[i].z > z) !== (r[j].z > z) && x < ((r[j].x - r[i].x) * (z - r[i].z)) / (r[j].z - r[i].z) + r[i].x) o = !o
      }
      return o
    }
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
    for (const p of ps) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z) }
    const near = clearings.filter((c) => c.x1 >= x0 - 2 && c.x0 <= x1 + 2 && c.z1 >= z0 - 2 && c.z0 <= z1 + 2)
    if (near.length === 0) return ps
    return ps.filter((p) => !near.some((c) => p.x >= c.x0 - 2 && p.x <= c.x1 + 2 && p.z >= c.z0 - 2 && p.z <= c.z1 + 2 && inside(c.ring, p.x, p.z)))
  }

  /** how many decks have been planted, so game.ts adds only the new ones (the same bookkeeping Plants does) */
  private decks = 0

  /**
   * Plant a raised deck (`Landmarks.decks`, docs/SKYPARKS.md) — Salesforce Park, and any skypark after it.
   *
   * Everything a ground tile does, on a ring instead: the same `plantParks` scatter (city/park-planting.ts
   * `deckPlantings`), the same `seat()`, the same models and the same thin-instance buffers. The only thing
   * a deck adds is `y` on each planting, which `seat()` uses instead of the terrain. Held for good rather
   * than streamed: a hand-modelled landmark does not come and go the way a tile does.
   */
  addDeck(ring: { x: number; z: number }[], y: number, keepOff?: number, spacing?: number): void {
    const ps = deckPlantings(ring, y, keepOff, undefined, spacing)
    if (!ps.length) return
    const key = `deck:${this.decks++}`
    this.byTile.set(key, ps)
    this.seated.delete(key)
    this.dirty = true
    this.castShadows(ps, `shadow:trees:${key}`, y)
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
    foliageLights(this.scene)

    // the library, and the region's own beside it; only trees in leaf: the library has autumn and snow-topped winter
    // trees for Trail Trainer's forests, and a red maple or a bare one in a San Francisco street was a random draw
    const libs = [this.base, ...(this.flora.library ? [new URL(`../${this.flora.library}/`, this.base).href] : [])]
    const index: TreeEntry[] = []
    for (const base of libs) {
      const got = await fetchAssetJson<{ trees: TreeEntry[] }>(`${base}index.json`).catch(() => ({ trees: [] as TreeEntry[] }))
      for (const t of got.trees) if (!t.season || t.season === 'summer') index.push({ ...t, base })
    }

    // species named by the flora but absent from every index it loaded: a silent empty pick is exactly how a
    // typo or a library mismatch made a species (and the trees planted with it) invisible without a single
    // line printed anywhere, which is what happened here — so this is loud instead of quiet.
    const missingSpecies = new Set<string>()
    const pick = (spec: [string, number][], n: number): TreeEntry[] => {
      const out: TreeEntry[] = []
      const total = spec.reduce((t, [, w]) => t + w, 0)
      for (const [species, weight] of spec) {
        const of = index.filter((t) => t.species === species)
        if (of.length === 0 && !missingSpecies.has(species)) {
          missingSpecies.add(species)
          console.warn(`vegetation: species '${species}' matches nothing in ${libs.join(', ')} — it will plant nothing`)
        }
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
    // (a promise per file, so the forty-odd models load at once rather than one after another)
    const fileCache = new Map<string, Promise<Model | null>>()
    const loadEntry = (entry: TreeEntry, park: boolean): Promise<Model | null> => {
      const key = `${entry.base}${entry.file}:${park}`
      let p = fileCache.get(key)
      if (!p) { p = importEntry(entry, park); fileCache.set(key, p) }
      return p
    }
    const importEntry = async (entry: TreeEntry, park: boolean): Promise<Model | null> => {
      const result = await SceneLoader.ImportMeshAsync('', ...assetRootAndFile(entry.base ?? this.base, entry.file), this.scene)
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
      return model
    }
    const loads: Promise<unknown>[] = []
    const streetAndPark = Promise.all([...pick(this.flora.street, 5).map((e) => loadEntry(e, false)), ...pick(this.flora.park, 5).map((e) => loadEntry(e, true))])
    loads.push(streetAndPark)
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
      // (in the order picked, not the order they arrive: a tree must get the same model every session)
      if (trees.length > 0) {
        const got = Promise.all(pick(trees, n).map((entry) => loadEntry(entry, false)))
        loads.push(got.then((ms) => { for (const m of ms) if (m) pool.push(m) }))
      }
      this.formPools.set(formCode(form), pool)
    }
    await Promise.all(loads)
    for (const [k, pool] of this.formPools) if (pool.length === 0) this.formPools.delete(k)
    // every model in a fixed order (the palms, the street and park pools as picked, then each form's), whatever
    // order the files arrived in: the form-0 pools are filtered from this list, and a planting picks by index
    const ordered = new Set<Model>([...this.districtPalms, ...(await streetAndPark).filter((m): m is Model => !!m), ...[...this.formPools.values()].flat()])
    models.length = 0
    models.push(...ordered)
    if (models.length === 0) {
      // `load()` resolving cleanly with nothing to plant looks identical to success everywhere else — draw()
      // just returns early on an empty `models` array — so this is the one place left to say so out loud.
      console.warn('vegetation: load() finished with zero models; no trees will be drawn')
      return
    }
    this.models = models
    if (this.merge) { this.mergeMaterials(models); this.collapseFarTiers() }
    // anything seated against an earlier set of models is stale
    this.seated.clear()
    this.dirty = true
    this.update()
  }

  /**
   * One material per material, not one per FILE — the first half of the merge BUGS.md #205 asks for.
   *
   * A generated tree GLB carries two materials, a bark and a leaf, and they are shared by NAME across the
   * library: every `oak_0NN.glb` has the same `bark_oak` and `leaves_broad`, built by the same generator
   * from the same textures. The loader has no way to know that, so forty oak files arrive as forty pairs of
   * identical materials, and #205 measured 170 of them alive in one square of Golden Gate Park. Each is a
   * separate shader binding, a separate set of texture uploads and a separate thing for Babylon to check
   * every frame, which is a large part of the ~7 ms that is paid whether or not a plant is visible.
   *
   * Keyed on the material's NAME and the url of its base-colour texture together. The name alone would fold
   * two genuinely different materials that happened to share one, which is how a library with a `bark`
   * called `bark` in two generators would quietly lose one of its textures.
   *
   * Then frozen. A tree's material never changes after this — nothing tints, dissolves or animates it — so
   * the per-frame work of deciding that again is pure waste, and so is recomputing a world matrix for a
   * mesh whose instances carry their own.
   */
  private mergeMaterials(models: Model[]): void {
    const byKey = new Map<string, { freeze(): void; name: string }>()
    let folded = 0
    for (const model of models) {
      for (const m of new Set([...model.parts, ...model.far, ...model.farther])) {
        const mat = m.material as (Mesh['material'] & { albedoTexture?: { url?: string }; freeze(): void }) | null
        if (!mat) continue
        const tex = (mat as { albedoTexture?: { url?: string }; diffuseTexture?: { url?: string } })
        const key = `${mat.name}|${tex.albedoTexture?.url ?? tex.diffuseTexture?.url ?? ''}`
        const first = byKey.get(key)
        if (!first) { byKey.set(key, mat as unknown as { freeze(): void; name: string }); continue }
        if (first !== (mat as unknown as { freeze(): void })) { m.material = first as unknown as Mesh['material']; folded++ }
      }
    }
    for (const mat of byKey.values()) mat.freeze()
    for (const model of models) {
      for (const m of new Set([...model.parts, ...model.far, ...model.farther])) m.freezeWorldMatrix()
    }
    console.info(`vegetation: ${byKey.size} materials over ${models.length} models (${folded} folded)`)
  }

  /**
   * Beyond ninety metres, one tree of a species stands for all of them — the second half of the merge.
   *
   * #205's long tail is the real cost: *"36 meshes draw ONE instance, 63 draw 2–4, 101 draw 5–16. Two
   * hundred of the 324 drawn meshes exist to draw sixteen plants or fewer."* That is not an accident of the
   * planting, it is arithmetic. A form has four or five variants and each carries three levels of detail in
   * two parts, so a form that is planted at all lights up thirty meshes, and the trees are then divided
   * among them by distance as well as by variant — a handful each.
   *
   * The variants are worth their cost where they are seen. PARKS.md: *"a park that repeats four models
   * every 4.5 m reads as wallpaper at rider speed"* — at rider speed, in the near ring. At two hundred
   * metres, under this park's own canopy and its fog, a tree is a dark shape and which of five oaks it is
   * cannot be told. So the near ring keeps every variant and the two far tiers of a pool are all redirected
   * to ONE member of it: the variants stop multiplying with the distance bands, and the tail goes.
   *
   * The representative is the pool's MEDIAN by height rather than its first, because a planting's matrix is
   * scaled from the model it was seated on (`seat()`) and a far tier drawn from a different model is drawn
   * at a slightly wrong size. Taking the median makes the worst case the spread of the pool rather than the
   * distance from one end of it to the other, and it happens at ninety metres in fog.
   */
  private collapseFarTiers(): void {
    const pools: Model[][] = [...this.formPools.values()]
    const inForms = new Set(pools.flat())
    pools.push(this.models.filter((m) => !m.palm && !inForms.has(m) && !m.park))
    pools.push(this.models.filter((m) => !m.palm && !inForms.has(m) && m.park))
    for (const pool of pools) {
      const trees = pool.filter((m) => !m.palm)
      if (trees.length < 2) continue
      const rep = [...trees].sort((a, b) => a.top - b.top)[Math.floor(trees.length / 2)]
      for (const m of trees) { m.far = rep.far; m.farther = rep.farther }
    }
  }

  /**
   * Which model each of a tile's trees stands on, and where — composed once, when the tile arrives.
   *
   * Everything here depends only on the planting and the loaded models, never on the eye, which is what
   * makes it worth keeping.
   */
  private seat(ps: Planting[]): { mats: Float32Array; model: Model[] } {
    const models = this.models
    // (the form-0 pools: the flora's street and park species and its district palms, not the forms' own)
    const inForms = new Set([...this.formPools.values()].flat())
    const street = models.filter((m) => !m.park && !m.palm && !inForms.has(m))
    const parkland = models.filter((m) => m.park)
    const palms = this.districtPalms
    const mats = new Float32Array(ps.length * 16)
    const model: Model[] = []
    ps.forEach((p, i) => {
      // a palm where the region plants them (the Embarcadero's row), by the planting's own hash so it is the same
      // tree every session; in parks at half the rate
      const h = plantHash(p.x, p.z)
      const seen = p.form ? 0 : this.flora.formAt?.(p.x, p.z)
      const own = p.form ? this.formPools.get(p.form) : seen ? this.formPools.get(formCode(seen)) : undefined
      const palmHere = !own && palms.length > 0 && this.flora.palmChance
        ? ((h >>> 11) % 1000) / 1000 < this.flora.palmChance(p.x, p.z) * (p.park ? 0.5 : 1) : false
      const pool = own ?? (palmHere ? palms : p.park && parkland.length > 0 ? parkland : street.length > 0 ? street : models)
      // by where it stands, not by its place in a list: a streamed tile picks the same model every time
      const m = pool[h % pool.length]
      /*
       * Sized by HEIGHT. The models are generated forest trees, ten to twenty metres and all different, and
       * one scale range for all of them made some street trees as tall as the buildings — which is not what
       * a city plants. A street tree is six to nine metres; each model is scaled to reach its planting's
       * height from its own measured top.
       */
      // (a palm is its own height, give or take: a street palm is taller than the street trees, not squeezed to them)
      // (a palm of a known form was measured too: its height is the city's, within what the model can stretch to)
      const scale = m.palm
        ? own ? Math.min(1.5, Math.max(0.25, p.height / m.top)) : 0.85 + ((h >>> 5) % 100) / 330
        : Math.min(2, Math.max(0.1, p.height / m.top))
      Matrix.Compose(
        new Vector3(scale, scale, scale),
        Quaternion.RotationAxis(Vector3.Up(), p.spin),
        // on the ground, not at sea level: a city with any relief left every tree hanging in the air — unless
        // the planting carries its own height, which is a tree on a raised deck (docs/SKYPARKS.md) and must
        // NOT be lifted by the terrain under it: the ground there is the street, twenty metres below.
        // (and the ground itself is baked, map format v3, where the city has it)
        new Vector3(p.x, p.y !== undefined ? p.y + 0.02 : 0.16 + (p.ground ?? this.terrain.heightAt(p.x, p.z)), p.z)).copyToArray(mats, i * 16)
      model.push(m)
    })
    return { mats, model }
  }

  /** Every tree of the tiles present on its model: the instance buffers, rewritten whole. */
  private plant(): void {
    const models = this.models
    const buckets = new Map<Mesh, Float32Array[]>()

    for (const [k, ps] of this.byTile) {
      let seat = this.seated.get(k)
      if (!seat || seat.model.length !== ps.length) { seat = this.seat(ps); this.seated.set(k, seat) }
      ps.forEach((p, i) => {
        const model = seat!.model[i]
        // near the eye the full tree, beyond it the lighter one
        const d = this.focus ? Math.hypot(p.x - this.focus.x, p.z - this.focus.z) : 0
        const mat = seat!.mats.subarray(i * 16, i * 16 + 16)
        for (const part of d < NEAR_LOD ? model.parts : d < 2.5 * NEAR_LOD ? model.far : model.farther) {
          const list = buckets.get(part) ?? []
          list.push(mat)
          buckets.set(part, list)
        }
      })
    }
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
        for (let i = 0; i < list.length; i++) buf.set(list[i], i * 16)
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
  private castShadows(plantings: Planting[], name: string, lift?: number): BMesh | null {
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
    // `drape()` rewrites every vertex wholesale — it ADDS the terrain under each one — so a deck's shadows
    // cannot opt out with a flag on a planting. They are built as their own mesh instead and lifted by the
    // deck's height in place of the ground's.
    if (lift === undefined) this.terrain.drape(out.positions)
    else for (let i = 1; i < out.positions.length; i += 3) out.positions[i] += lift
    const m = new BMesh(name, this.scene)
    out.toVertexData().applyToMesh(m)
    m.material = shadowMaterial(this.scene)
    m.renderingGroupId = 3
    m.isPickable = false
    return m
  }

  get plantedCount(): number { return this.planted }

  /**
   * How much of the straight line from a to b runs through a tree's crown: the fraction of points along it, 0..1.
   * For the chase camera (game.ts), which stood up in the street trees whenever the rider did not steer (owner,
   * 2026-10-29: "without steering the camera is usually up in the trees"). From the trees as they are drawn — each
   * planting's own model at its own matrix (`seated`) — not a ray against the meshes, and not `crownRadius`: that is
   * the bake's figure for keeping a crown off a wall, and the models are half as wide again (a street tree's
   * leaves reach out 0.35–0.7 of its height, a Canary palm's fronds half of it). A crown is a squat round-ended
   * drum about the trunk from its leaves' own extent (`crownOf`), padded by a narrow cone round the line — `pad` at
   * a, `spread` more a metre along it — because a crown that misses the line by a hand's breadth beside the lens
   * still fills a third of the frame (Hayes Street, 2026-10-29: the trunk 2.6 m from the eye, the leaves 2.5 m out).
   * Nothing counts before the models have arrived: nothing is drawn.
   */
  canopyAlong(ax: number, ay: number, az: number, bx: number, by: number, bz: number, samples = 8, pad = 0.4, spread = 0.08): number {
    if (this.models.length === 0) return 0
    const reach = 15
    const x0 = Math.min(ax, bx) - reach, x1 = Math.max(ax, bx) + reach, z0 = Math.min(az, bz) - reach, z1 = Math.max(az, bz) + reach
    // the crowns near the line, in world terms: centre, horizontal radius, vertical half-height
    const near: number[] = []
    for (let tz = Math.floor(z0 / TILE); tz <= Math.floor(z1 / TILE); tz++) {
      for (let tx = Math.floor(x0 / TILE); tx <= Math.floor(x1 / TILE); tx++) {
        const seat = this.seated.get(`${tx},${tz}`)
        if (!seat) continue
        const { mats, model } = seat
        for (let i = 0; i < model.length; i++) {
          const x = mats[i * 16 + 12], z = mats[i * 16 + 14]
          if (x < x0 || x > x1 || z < z0 || z > z1) continue
          const c = crownOf(model[i])
          if (!c) continue
          const k = Math.hypot(mats[i * 16], mats[i * 16 + 1], mats[i * 16 + 2])
          near.push(x, mats[i * 16 + 13] + k * (c.lo + c.hi) / 2, z, k * c.r, k * (c.hi - c.lo) / 2)
        }
      }
    }
    if (near.length === 0) return 0
    let inside = 0
    const length = Math.hypot(bx - ax, by - ay, bz - az)
    for (let i = 0; i < samples; i++) {
      const t = samples === 1 ? 0 : i / (samples - 1)
      const x = ax + (bx - ax) * t, y = ay + (by - ay) * t, z = az + (bz - az) * t
      const p = pad + spread * length * t
      for (let j = 0; j < near.length; j += 5) {
        const dx = x - near[j], dz = z - near[j + 2], r = near[j + 3] + p, ey = (y - near[j + 1]) / (near[j + 4] + p)
        // (ey to the fourth: flat-topped and flat-bottomed, nearer a crown's shape than an egg, which cut its shoulders off)
        if ((dx * dx + dz * dz) / (r * r) + ey * ey * ey * ey < 1) { inside++; break }
      }
    }
    return inside / samples
  }
}

/**
 * A model's crown, in its own units: the radius most of its leaves fall within, and the band they fill — from the
 * widest of its parts (the leaves, or the whole tree where the parts were merged), its vertices off the trunk. Taken
 * once a model, from the geometry; null for a model with nothing to measure.
 */
const crowns = new WeakMap<Model, { r: number; lo: number; hi: number } | null>()
function crownOf(m: Model): { r: number; lo: number; hi: number } | null {
  if (crowns.has(m)) return crowns.get(m)!
  let best: Float32Array | number[] | null = null, wide = 0
  for (const p of m.parts) {
    const v = p.getVerticesData('position')
    if (!v) continue
    let w = 0
    for (let i = 0; i < v.length; i += 3) w = Math.max(w, v[i] * v[i] + v[i + 2] * v[i + 2])
    if (w > wide) { wide = w; best = v }
  }
  let c: { r: number; lo: number; hi: number } | null = null
  if (best && best.length >= 9) {
    const rad: number[] = []
    for (let i = 0; i < best.length; i += 3) rad.push(Math.hypot(best[i], best[i + 2]))
    const sorted = [...rad].sort((a, b) => a - b)
    // (nearly all the leaves, not the one twig that reaches furthest: the 85th percentile was a street tree's crown
    // 1.5 m round whose leaves reached 2.5 m and filled the frame)
    const r = sorted[Math.floor(sorted.length * 0.95)]
    const ys: number[] = []
    for (let i = 0; i < best.length; i += 3) if (rad[i / 3] > 0.35 * r) ys.push(best[i + 1])
    ys.sort((a, b) => a - b)
    if (r > 0 && ys.length > 0) {
      const lo = ys[Math.floor(ys.length * 0.05)], hi = ys[ys.length - 1]
      if (hi > lo) c = { r, lo, hi }
    }
  }
  crowns.set(m, c)
  return c
}

/**
 * The Babylon lights for everything with a PBR material — the trees, and the rider's avatar, which otherwise has
 * none: with the trees left out (iOS's ultra tier) the rider rode as a black silhouette. Idempotent; game.ts makes
 * them at the start, the vegetation again in case it is used alone.
 */
export function foliageLights(scene: Scene): void {
  if (!scene.lights.some((l) => l.name === 'foliage')) {
    const sky = new HemisphericLight('foliage', new V3(0, 1, 0), scene)
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
    const sun = new DirectionalLight('foliage-sun', DAYLIGHT.sun.clone(), scene)
    sun.diffuse = new Color3(DAYLIGHT.sunColour.r, DAYLIGHT.sunColour.g, DAYLIGHT.sunColour.b)
    // matched to the hour: a tree lit for noon under a midnight sky is the one thing that gives a
    // faked night away immediately
    sun.intensity = 1.6 * (0.2 + 0.8 * Math.min(1, DAYLIGHT.sunColour.r))
    sun.specular = new Color3(0.05, 0.05, 0.05)
    sun.excludeWithLayerMask = PEOPLE
  }
}

