/**
 * The planting that is not trees (PARIS_EXPAND §6 item 8): shrubs and flower beds in the parks and gardens,
 * from Trail Trainer's library of low-poly plants (`public/plants` → ~/trailtrainer/public/plants, made by
 * its plantgen; gitignored, like the trees).
 *
 * Decided per tile by where it is, not by chance, so a streamed tile grows the same plants every time: over
 * each park and the lawns inside one, a lattice every 4.5 m, each point kept or not by a hash of its position.
 * Near a park's edge (along its paths and railings) the kept points are shrubs, in the middle a few flower
 * beds — a clump of one kind of flower, as a gardener plants them. Instanced per model for the whole city,
 * like the trees, and only in the tiles round the rider (they are small: past 250 m they are not seen).
 */
import { Matrix, Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader'
import '@babylonjs/loaders/glTF/2.0'
import type { Scene } from '@babylonjs/core/scene'
import { Carriageways } from '../city/carriageways.ts'
import type { TileLayer } from './city.ts'
import type { Terrain } from '../city/terrain.ts'
import type { TileArea } from '../city/tiles.ts'
import type { PackedEdge } from '../city/package.ts'
import { woodAt } from './infill.ts'
import { unpackPlantings, type Planting } from '../city/plantings.ts'

interface PlantEntry { species: string; file: string; height: number }
/**
 * One plant. `y` is OPTIONAL and absent for everything the automatic lattice places: a plant on the ground
 * takes its height from the terrain, which is right for every park in the city.
 *
 * It exists for the one shape the terrain cannot express — a plant on a RAISED DECK. The ground is a
 * heightfield, one elevation per x/z (BUGS.md #130), so a bed on Salesforce Park or on the Moscone South
 * deck has nowhere to say it is 4 or 20 m up, and every plant in it sinks to street level. An explicit
 * height is the smallest thing that fixes that: additive, ignored by every existing caller, and it serves
 * Salesforce Park — thousands of plants in the air, and a standing report of them missing — as well as the
 * Yerba Buena decks.
 */
interface Planted { x: number; z: number; s: number; spin: number; kind: 'shrub' | 'flower'; y?: number }

/** the library's species used, by role */
const SHRUBS = ['bush_green', 'bush_flowering', 'rhododendron', 'hazel']
const FLOWERS = ['tulip', 'daisy', 'wildflower', 'lupine', 'poppy']

const hash = (x: number, z: number, salt: number): number => {
  let h = Math.imul(Math.round(x * 10) ^ 0x27d4eb2d, 0x9e3779b1) ^ Math.imul(Math.round(z * 10) + salt, 0x85ebca77)
  h ^= h >>> 15
  h = Math.imul(h, 0xc2b2ae3d)
  h ^= h >>> 13
  return (h >>> 0) / 4294967296
}

function inside(r: number[], x: number, z: number): boolean {
  let o = false
  for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
    if ((r[i + 1] > z) !== (r[j + 1] > z) && x < ((r[j] - r[i]) * (z - r[i + 1])) / (r[j + 1] - r[i + 1]) + r[i]) o = !o
  }
  return o
}

function edgeDistance(r: number[], x: number, z: number): number {
  let best = Infinity
  for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
    const ax = r[j], az = r[j + 1], bx = r[i], bz = r[i + 1]
    const dx = bx - ax
    const dz = bz - az
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)))
    best = Math.min(best, Math.hypot(ax + dx * t - x, az + dz * t - z))
  }
  return best
}

/**
 * Where the plants of one tile go: parks and gardens only, a lattice thinned by hash.
 *
 * NOTHING GROWS THROUGH ASPHALT (BUGS.md #196). The owner, at 37.759199 -122.509773: *"There are a lot of
 * small plants rendering ON concrete trails or asphalt roads."* The lattice is laid over the whole park
 * polygon, and the park's roads and trails cross it — so every point that lands on something BUILT has to
 * go. `edges` is the tile's own ways; the test is `Carriageways.onPaving`, the same geometry the furniture
 * uses to stay out of the road, taken with `includeFoot` because a park trail is a footway and is precisely
 * where the plants were standing. Optional, so the deck planter and any older caller are unchanged.
 */
export function plantTile(areas: TileArea[], rect: { x0: number; z0: number; x1: number; z1: number },
  edges?: PackedEdge[], trees?: Planting[]): Planted[] {
  const out: Planted[] = []
  const STEP = 4.5
  /*
   * The FOREST FLOOR, which is the other half of the owner's complaint about the park: *"the groundcover
   * isn't there."*
   *
   * The lattice above puts shrubs along a park's edges and a flower bed here and there, which is right for
   * a square in the Mission and is the whole reason Golden Gate Park's interior came out as mown grass with
   * trees standing on it. Under a closed canopy the ground is not mown and nothing mows it: it is bracken,
   * scrub and seedlings, thick enough that you ride the trail because you cannot ride anywhere else.
   *
   * `woodAt` (render/infill.ts) says how much of a wood each point is in, from the trees the tile is
   * actually carrying — so the understorey appears exactly where the canopy does and stops exactly where it
   * stops. On the meadows and the Polo Field it is zero and the lattice behaves as it always has.
   */
  const wood = trees && trees.length > 0 ? woodAt(trees) : null
  const paved = edges && edges.length > 0 ? new Carriageways(edges, true) : null
  /*
   * And the areas nothing grows on, which are polygons rather than ways: a paved plaza inside a park, the
   * water, and — once #200's ground kinds land in a bake — the SAND. Ocean Beach is mapped inside the park
   * polygon this lattice iterates, so without this the beach would come back planted with rhododendrons the
   * moment it stopped being a lawn. `dirt` is deliberately NOT here: undergrowth on bare duff is exactly
   * what a forest floor should have.
   */
  const pavedAreas = areas.filter((a) => a.kind === 'paved' || a.kind === 'sand' || a.kind === 'water')
    .map((a) => a.ring)
  const built = (x: number, z: number): boolean =>
    (paved?.onPaving(x, z) ?? false) || pavedAreas.some((r) => inside(r, x, z))
  // a park, and the lawns inside one (a garden is mapped as a park with its lawns as grass on top: their edges
  // are the paths, which is where a gardener plants the shrubs)
  const parks = areas.filter((a) => a.kind === 'park')
  const inPark = (a: TileArea): boolean => {
    let x = 0
    let z = 0
    for (let i = 0; i < a.ring.length; i += 2) { x += a.ring[i]; z += a.ring[i + 1] }
    x /= a.ring.length / 2
    z /= a.ring.length / 2
    return parks.some((p) => inside(p.ring, x, z))
  }
  for (const a of areas) {
    if (a.kind !== 'park' && !(a.kind === 'grass' && inPark(a))) continue
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
    for (let i = 0; i < a.ring.length; i += 2) {
      x0 = Math.min(x0, a.ring[i]); x1 = Math.max(x1, a.ring[i]); z0 = Math.min(z0, a.ring[i + 1]); z1 = Math.max(z1, a.ring[i + 1])
    }
    for (let x = Math.ceil(Math.max(x0, rect.x0) / STEP) * STEP; x < Math.min(x1, rect.x1); x += STEP) {
      for (let z = Math.ceil(Math.max(z0, rect.z0) / STEP) * STEP; z < Math.min(z1, rect.z1); z += STEP) {
        // jittered off the lattice, so no rows show
        const jx = x + (hash(x, z, 1) - 0.5) * STEP * 0.8
        const jz = z + (hash(x, z, 2) - 0.5) * STEP * 0.8
        if (!inside(a.ring, jx, jz) || (a.holes ?? []).some((h) => inside(h, jx, jz))) continue
        if (built(jx, jz)) continue
        const edge = edgeDistance(a.ring, jx, jz)
        const r = hash(x, z, 3)
        // under the canopy first: most of the lattice is kept, and what it grows is undergrowth rather than
        // a gardener's shrub — smaller, and scattered instead of lining a path
        const w = wood ? wood(jx, jz) : 0
        // two trunks within fourteen metres before any undergrowth at all: the threshold is deliberately
        // high because the failure it guards against is the one the owner named — *"some areas that DON'T
        // have vegetation, like fields and the polo field"* — and a meadow with scrub scattered over it is
        // the same mistake as a meadow with trees on it
        if (w >= 0.6 && edge > 3.2 && r < 0.75 * (w - 0.4)) {
          out.push({ x: jx, z: jz, s: 0.5 + hash(x, z, 13) * 0.75, spin: hash(x, z, 14) * Math.PI * 2, kind: 'shrub' })
        } else if (edge > 0.9 && edge < 3.2 && r < 0.7) {
          out.push({ x: jx, z: jz, s: 0.8 + hash(x, z, 4) * 0.6, spin: hash(x, z, 5) * Math.PI * 2, kind: 'shrub' })
        } else if (edge >= 8 && r < 0.02) {
          // a flower bed: a clump of one kind, a dozen plants in a ring of about two metres
          for (let k = 0; k < 12; k++) {
            const t = (k / 12) * Math.PI * 2
            const rr = 0.4 + hash(x + k, z, 6) * 1.6
            const fx = jx + Math.cos(t) * rr
            const fz = jz + Math.sin(t) * rr
            // the bed spreads two metres off the kept point, so each plant in it is tested on its own
            if (built(fx, fz)) continue
            out.push({ x: fx, z: fz, s: 0.9 + hash(x, z + k, 7) * 0.4, spin: t, kind: 'flower' })
          }
        } else if (edge >= 5 && r < 0.03) {
          out.push({ x: jx, z: jz, s: 1 + hash(x, z, 8) * 0.8, spin: hash(x, z, 9) * Math.PI * 2, kind: 'shrub' })
        }
      }
    }
  }
  return out
}

export class Plants {
  private readonly scene: Scene
  private readonly terrain: Terrain
  private readonly base: string
  readonly byTile = new Map<string, Planted[]>()
  models: { kind: 'shrub' | 'flower'; parts: Mesh[]; top: number }[] = []
  private dirty = false

  constructor(scene: Scene, terrain: Terrain, assetBase: string) {
    this.scene = scene
    this.terrain = terrain
    this.base = assetBase
  }

  /** how many decks have been planted so far, so game.ts can add only the new ones each frame */
  private planted = 0

  /**
   * Plant a raised deck (`Landmarks.decks`, docs/SKYPARKS.md) — Salesforce Park, and any skypark after it.
   * Reuses `plantTile` unchanged over the deck's own ring, the one thing a deck adds being `y`: every plant
   * it places sits at the deck's height instead of sinking to the terrain below. One call per deck, not per
   * tile, since a hand-modelled landmark does not stream in and out the way the city's own tiles do.
   */
  addDeck(ring: { x: number; z: number }[], y: number): void {
    const flat: number[] = []
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
    for (const p of ring) {
      flat.push(p.x, p.z)
      x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z)
    }
    const area = { kind: 'park', ring: flat, of: -1 } as unknown as TileArea
    const list = plantTile([area], { x0, z0, x1, z1 }).map((p) => ({ ...p, y }))
    this.byTile.set(`deck:${this.planted++}`, list)
    this.dirty = true
  }

  layer(): TileLayer {
    return {
      name: 'plants',
      range: 2,
      build: (near, rect) => {
        this.byTile.set(near.key, plantTile(near.tile.areas, rect, near.tile.edges, unpackPlantings(near.tile.plantings)))
        this.dirty = true
        return []
      },
      release: (k) => { if (this.byTile.delete(k)) this.dirty = true },
    }
  }

  async load(): Promise<void> {
    let index: { trees: PlantEntry[] }
    try {
      index = (await (await fetch(`${this.base}index.json`)).json()) as { trees: PlantEntry[] }
    } catch {
      return
    }
    for (const [kind, list] of [['shrub', SHRUBS], ['flower', FLOWERS]] as const) {
      for (const species of list) {
        const e = index.trees.find((t) => t.species === species)
        if (!e) continue
        const r = await SceneLoader.ImportMeshAsync('', this.base, e.file, this.scene)
        const all = r.meshes.filter((m): m is Mesh => m instanceof Mesh && m.getTotalVertices() > 0)
        const lod = all.filter((m) => /LOD1/i.test(m.name))
        const parts = lod.length ? lod : all.filter((m) => !/LOD[1-9]/i.test(m.name))
        for (const m of all) if (!parts.includes(m)) m.dispose()
        for (const m of parts) {
          // the same fixes as the trees (render/vegetation.ts): the loader's flip baked in, leaves as cutouts
          m.setParent(null)
          m.bakeCurrentTransformIntoVertices()
          m.renderingGroupId = 3
          m.isPickable = false
          m.alwaysSelectAsActiveMesh = true
          const mat = m.material as { transparencyMode?: number | null; alphaCutOff?: number; needDepthPrePass?: boolean } | null
          if (mat) { mat.transparencyMode = 1; mat.alphaCutOff = 0.45; mat.needDepthPrePass = false }
          m.setEnabled(false)
        }
        if (parts.length) this.models.push({ kind, parts, top: e.height || 1 })
      }
    }
    this.dirty = true
  }

  update(): void {
    if (!this.dirty || this.models.length === 0) return
    this.dirty = false
    const buckets = new Map<Mesh, Matrix[]>()
    for (const list of this.byTile.values()) {
      for (const p of list) {
        const pool = this.models.filter((m) => m.kind === p.kind)
        if (!pool.length) continue
        // a flower bed is one kind: pick by the bed's rounded position, a shrub by its own
        const key = p.kind === 'flower' ? hash(Math.round(p.x / 4) * 4, Math.round(p.z / 4) * 4, 11) : hash(p.x, p.z, 12)
        const model = pool[Math.floor(key * pool.length) % pool.length]
        const want = p.kind === 'shrub' ? 1.7 * p.s : 0.5 * p.s
        const k = Math.max(0.2, Math.min(3, want / model.top))
        const mtx = Matrix.Compose(new Vector3(k, k, k), Quaternion.RotationAxis(Vector3.Up(), p.spin),
          new Vector3(p.x, (p.y ?? this.terrain.heightAt(p.x, p.z)) + 0.02, p.z))
        for (const part of model.parts) (buckets.get(part) ?? buckets.set(part, []).get(part)!).push(mtx)
      }
    }
    for (const model of this.models) {
      for (const part of model.parts) {
        const list = buckets.get(part)
        if (!list || !list.length) { part.thinInstanceCount = 0; part.setEnabled(false); continue }
        const buf = new Float32Array(list.length * 16)
        list.forEach((m, i) => m.copyToArray(buf, i * 16))
        part.thinInstanceSetBuffer('matrix', buf, 16)
        part.thinInstanceRefreshBoundingInfo(false)
        part.setEnabled(true)
      }
    }
  }
}
