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
import { MeshBuilder } from './buildings.ts'
import { cartoonMaterial } from './cartoon-material.ts'
import { unpackPlantings, type Planting } from '../city/plantings.ts'
import type { PlantZones } from '../city/zone-planting.ts'

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
/**
 * A DESIGNED BED, filled (Salesforce Park's gardens, 2026-10-02: "the park has tons of interesting plants"): not the
 * city lattice, which lines a park's edges and leaves its middle to the trees, but a bed planted edge to edge the way a
 * garden designer does — a plant every metre and a half, in drifts: a stretch of one shrub, then a stretch of flowers,
 * from slow noise over the bed so neighbours agree. Only on a deck that asks for it (`MeshBuilder.decks` `shrubs`).
 */
export function bedPlanting(ring: number[], rect: { x0: number; z0: number; x1: number; z1: number }): Planted[] {
  const out: Planted[] = []
  const STEP = 1.5
  for (let x = Math.ceil(rect.x0 / STEP) * STEP; x < rect.x1; x += STEP) {
    for (let z = Math.ceil(rect.z0 / STEP) * STEP; z < rect.z1; z += STEP) {
      const jx = x + (hash(x, z, 21) - 0.5) * STEP * 0.7
      const jz = z + (hash(x, z, 22) - 0.5) * STEP * 0.7
      if (!inside(ring, jx, jz) || edgeDistance(ring, jx, jz) < 0.35) continue
      // the drift: slow, so a patch of flowers is metres across, not every other plant
      const drift = Math.sin(jx / 4.3 + 1.7) + Math.sin(jz / 3.7) + Math.sin((jx + jz) / 6.1)
      if (hash(x, z, 23) < 0.12) continue
      if (drift > 0.6) out.push({ x: jx, z: jz, s: 0.9 + hash(x, z, 24) * 0.4, spin: hash(x, z, 25) * Math.PI * 2, kind: 'flower' })
      else out.push({ x: jx, z: jz, s: 0.6 + hash(x, z, 26) * 0.6, spin: hash(x, z, 27) * Math.PI * 2, kind: 'shrub' })
    }
  }
  return out
}

export function plantTile(areas: TileArea[], rect: { x0: number; z0: number; x1: number; z1: number },
  edges?: PackedEdge[], trees?: Planting[], zones?: PlantZones | null): Planted[] {
  // how thick the zone here asks for it (ZonePlant.shrubs.density, 1 where no zone says): scales every keep chance
  const thick = (x: number, z: number): number => zones?.shrubs(x, z)?.density ?? 1
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
  const pavedAreas = areas.filter((a) => a.kind === 'paved' || a.kind === 'lot' || a.kind === 'sand' || a.kind === 'water' || a.kind === 'pitch')
    .map((a) => a.ring)
  const built = (x: number, z: number): boolean =>
    (paved?.onPaving(x, z) ?? false) || pavedAreas.some((r) => inside(r, x, z))
  // a park, and the lawns inside one (a garden is mapped as a park with its lawns as grass on top: their edges
  // are the paths, which is where a gardener plants the shrubs)
  const parks = areas.filter((a) => a.kind === 'park')
  const lawns = areas.filter((a) => a.kind === 'grass').map((a) => a.ring)
  const onLawn = (x: number, z: number): boolean => lawns.some((r) => inside(r, x, z))
  const inPark = (a: TileArea): boolean => {
    let x = 0
    let z = 0
    for (let i = 0; i < a.ring.length; i += 2) { x += a.ring[i]; z += a.ring[i + 1] }
    x /= a.ring.length / 2
    z /= a.ring.length / 2
    return parks.some((p) => inside(p.ring, x, z))
  }
  // (a lawn in a park of planted beds gets nothing of its own: the beds round it are the planting)
  const bedParks = parks.filter((p) => p.beds)
  const inBeds = (a: TileArea): boolean => bedParks.length > 0 && bedParks.some((p) => inside(p.ring, a.ring[0], a.ring[1]))
  for (const a of areas) {
    if (a.kind !== 'park' && !(a.kind === 'grass' && inPark(a) && !inBeds(a))) continue
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
    for (let i = 0; i < a.ring.length; i += 2) {
      x0 = Math.min(x0, a.ring[i]); x1 = Math.max(x1, a.ring[i]); z0 = Math.min(z0, a.ring[i + 1]); z1 = Math.max(z1, a.ring[i + 1])
    }
    /*
     * A flower bed or a lone shrub out in the middle of a lawn is a GARDEN's thing — a square, a small park. On a great
     * meadow (Golden Gate Park's, the Presidio's) the same rule scattered loose clumps far out on the mown grass, which
     * read as broken branches lying on the lawn (views audit, 2026-10-04). Past about 4 ha of bounding box, none.
     */
    // (measured on the piece in this tile: a tile's areas are CLIPPED to it, so a big meadow cut at the tile edge
    //  can still look small — a piece that fills most of a 200 m tile is no garden either)
    // (and, in any park, only by a path — a tile's areas are clipped pieces, so a big lawn can pass for a garden here:
    //  Dolores Park's lawn came out strewn with clumps, 2026-10-04)
    const garden = (x1 - x0) * (z1 - z0) < 40000 && !((x1 - x0) > 120 && (z1 - z0) > 120) && !(a.kind === 'grass' && (x1 - x0) * (z1 - z0) > 6000)
    for (let x = Math.ceil(Math.max(x0, rect.x0) / STEP) * STEP; x < Math.min(x1, rect.x1); x += STEP) {
      for (let z = Math.ceil(Math.max(z0, rect.z0) / STEP) * STEP; z < Math.min(z1, rect.z1); z += STEP) {
        // jittered off the lattice, so no rows show
        const jx = x + (hash(x, z, 1) - 0.5) * STEP * 0.8
        const jz = z + (hash(x, z, 2) - 0.5) * STEP * 0.8
        if (!inside(a.ring, jx, jz) || (a.holes ?? []).some((h) => inside(h, jx, jz))) continue
        if (built(jx, jz)) continue
        const edge = edgeDistance(a.ring, jx, jz)
        /*
         * A park of planted BEDS (PackedArea `beds`: the Tunnel Tops) is shrubs all through — low natives a couple of
         * metres apart in mulch, with a few flowering clumps — everywhere but its mapped lawns and its paths.
         */
        if (a.kind === 'park' && a.beds) {
          if (onLawn(jx, jz)) continue
          const rb = hash(x, z, 3)
          if (rb < 0.62) out.push({ x: jx, z: jz, s: 0.9 + hash(x, z, 13) * 0.8, spin: hash(x, z, 14) * Math.PI * 2, kind: 'shrub' })
          else if (rb < 0.7) out.push({ x: jx, z: jz, s: 0.8 + hash(x, z, 7) * 0.4, spin: hash(x, z, 6) * Math.PI * 2, kind: 'flower' })
          // and a second, smaller, half a step off: the beds are planted close (about one plant every 3 m)
          const kx = jx + STEP * 0.5, kz = jz + (hash(x, z, 15) - 0.5) * STEP * 0.6
          if (hash(x, z, 16) < 0.65 && inside(a.ring, kx, kz) && !onLawn(kx, kz) && !built(kx, kz))
            out.push({ x: kx, z: kz, s: 0.7 + hash(x, z, 17) * 0.6, spin: hash(x, z, 18) * Math.PI * 2, kind: 'shrub' })
          continue
        }
        const r = hash(x, z, 3) / Math.max(1e-6, thick(jx, jz))
        // under the canopy first: most of the lattice is kept, and what it grows is undergrowth rather than
        // a gardener's shrub — smaller, and scattered instead of lining a path
        const w = wood ? wood(jx, jz) : 0
        // two trunks within fourteen metres before any undergrowth at all: the threshold is deliberately
        // high because the failure it guards against is the one the owner named — *"some areas that DON'T
        // have vegetation, like fields and the polo field"* — and a meadow with scrub scattered over it is
        // the same mistake as a meadow with trees on it
        // (never on a mapped LAWN: a mown grass area under a park's scattered trees is not a forest floor — Dolores Park's
        //  lawns came out strewn with undergrowth wherever two trees stood within 14 m, 2026-10-04)
        if (w >= 0.6 && edge > 3.2 && r < 0.75 * (w - 0.4) && !onLawn(jx, jz)) {
          out.push({ x: jx, z: jz, s: 0.5 + hash(x, z, 13) * 0.75, spin: hash(x, z, 14) * Math.PI * 2, kind: 'shrub' })
        // (an EDGE shrub only where a path runs along the edge: OSM cuts a meadow into grass areas whose shared boundary
        //  runs across open lawn, and a row of shrubs planted along it stood mid-meadow — views audit, 2026-10-04)
        // (a mown LAWN's own border gets an occasional shrub, not a hedge: Dolores Park's lawns, each ringed by paths, came
        //  out edged in clumps all round, 72 of the tile's 93 shrubs — 2026-10-04; a park's outer edge keeps its planting)
        } else if (edge > 0.9 && edge < 3.2 && r < (a.kind === 'grass' ? 0.12 : 0.7) && (paved?.onPaving(jx, jz, 4) ?? true)) {
          out.push({ x: jx, z: jz, s: 0.8 + hash(x, z, 4) * 0.6, spin: hash(x, z, 5) * Math.PI * 2, kind: 'shrub' })
        } else if (garden && edge >= 8 && r < 0.02 && (paved?.onPaving(jx, jz, 12) ?? true)) {
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
        } else if (garden && edge >= 5 && r < 0.03 && (paved?.onPaving(jx, jz, 12) ?? true)) {
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
  models: { kind: 'shrub' | 'flower'; species: string; parts: Mesh[]; top: number }[] = []
  /** the city's planting zones, when it has them (map format v3): which shrubs and flowers grow where */
  zones: PlantZones | null = null
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
  addDeck(ring: { x: number; z: number }[], y: number, bed = false): void {
    const flat: number[] = []
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
    for (const p of ring) {
      flat.push(p.x, p.z)
      x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z)
    }
    const area = { kind: 'park', ring: flat, of: -1 } as unknown as TileArea
    const list = (bed ? bedPlanting(flat, { x0, z0, x1, z1 }) : plantTile([area], { x0, z0, x1, z1 })).map((p) => ({ ...p, y }))
    this.byTile.set(`deck:${this.planted++}`, list)
    this.dirty = true
  }

  /**
   * The rings nothing grows in: a landmark's paved ground or footprint (game.ts, as for the trees' `clear`). Kezar
   * Stadium's track came out planted with the park's undergrowth, 2026-10-04. Shared by reference with game.ts.
   */
  clearings: { x: number; z: number }[][] = []
  /** a ring arriving after its tiles were planted: those tiles' plants inside it go */
  clear(ring: { x: number; z: number }[]): void {
    if (!this.clearings.includes(ring)) this.clearings.push(ring)
    for (const [k, ps] of this.byTile) {
      // (a raised deck's planting stands ON a footprint: it is the skypark's own)
      if (k.startsWith('deck:')) continue
      const kept = this.cleared(ps, [ring])
      if (kept.length !== ps.length) { this.byTile.set(k, kept); this.dirty = true }
    }
  }
  private cleared<T extends { x: number; z: number }>(ps: T[], rings = this.clearings): T[] {
    if (rings.length === 0 || ps.length === 0) return ps
    const boxes = rings.map((r) => {
      let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
      for (const q of r) { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); z0 = Math.min(z0, q.z); z1 = Math.max(z1, q.z) }
      return { r: r.flatMap((q) => [q.x, q.z]), x0, x1, z0, z1 }
    })
    return ps.filter((p) => !boxes.some((b) => p.x >= b.x0 && p.x <= b.x1 && p.z >= b.z0 && p.z <= b.z1 && inside(b.r, p.x, p.z)))
  }

  layer(): TileLayer {
    return {
      name: 'plants',
      range: 2,
      build: (near, rect) => {
        this.byTile.set(near.key, this.cleared(plantTile(near.tile.areas, rect, near.tile.edges, unpackPlantings(near.tile.plantings), this.zones)))
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
    // the defaults, and every species a zone names (a zone's "tropical shrubs"): all loaded once, up front
    const wanted = { shrub: new Set<string>(SHRUBS), flower: new Set<string>(FLOWERS) }
    for (const s of this.zones?.allShrubs() ?? []) {
      for (const n of s.shrubs ?? []) wanted.shrub.add(n)
      for (const n of s.flowers ?? []) wanted.flower.add(n)
    }
    for (const [kind, list] of [['shrub', [...wanted.shrub]], ['flower', [...wanted.flower]]] as const) {
      for (const species of list) {
        const e = index.trees.find((t) => t.species === species)
        if (!e) { console.warn(`plants: a zone asks for "${species}", which the plant library does not have`); continue }
        const r = await SceneLoader.ImportMeshAsync('', this.base, e.file, this.scene)
        const all = r.meshes.filter((m): m is Mesh => m instanceof Mesh && m.getTotalVertices() > 0)
        // (LOD0, the full plant: LOD1's thinned leaf cards read at rider height as a few broken twigs lying on the lawn —
        //  Embarcadero survey, 2026-10-06 — and LOD0 is at most a thousand triangles a shrub)
        const lod0 = all.filter((m) => !/LOD[1-9]/i.test(m.name))
        const parts = lod0.length ? lod0 : all
        for (const m of all) if (!parts.includes(m)) m.dispose()
        for (const m of parts) {
          // the same fixes as the trees (render/vegetation.ts): the loader's flip baked in, leaves as cutouts
          m.setParent(null)
          m.bakeCurrentTransformIntoVertices()
          m.renderingGroupId = 3
          m.isPickable = false
          m.alwaysSelectAsActiveMesh = true
          const mat = m.material as { transparencyMode?: number | null; alphaCutOff?: number; needDepthPrePass?: boolean } | null
          if (mat) { mat.transparencyMode = 1; mat.alphaCutOff = 0.35; mat.needDepthPrePass = false }
          m.setEnabled(false)
        }
        if (parts.length) this.models.push({ kind, species, parts, top: e.height || 1 })
      }
    }
    /*
     * A leafy CORE for every shrub: a low, lumpy dome of foliage inside the model's cards. The library's shrubs are a
     * few branches with leaf cards on them, and at rider height across a lawn their cutout cards read as broken twigs
     * lying on the grass (Embarcadero survey, 2026-10-06). The core gives each one a bush's mass; the cards still
     * make its outline. One mesh, instanced on the shrubs' own matrices (unit height: the shrub's is put in `update`).
     */
    {
      const mb = new MeshBuilder()
      const LEAF = [0.3, 0.44, 0.2]
      const R = 8, S = 14
      // a smooth mound: shared vertices with radial normals (one normal per quad shaded it as facets), gentle lumps,
      // its foot just under the ground so no skirt shows
      const at = (i: number, j: number): [number, number, number] => {
        const t = (i / R) * (Math.PI / 2), a = (j / S) * Math.PI * 2
        const bump = 1 + 0.09 * Math.sin(a * 3 + i * 0.9) + 0.06 * Math.cos(a * 5 - i * 0.7)
        return [Math.cos(t) * Math.cos(a) * 0.45 * bump, -0.05 + Math.sin(t) * 0.66 * bump, Math.cos(t) * Math.sin(a) * 0.45 * bump]
      }
      for (let i = 0; i <= R; i++) for (let j = 0; j <= S; j++) {
        const [x, y, z] = at(i, j)
        const L = Math.hypot(x / 0.45, (y + 0.05) / 0.66, z / 0.45) || 1
        mb.positions.push(x, y, z); mb.normals.push(x / 0.45 / L, (y + 0.05) / 0.66 / L, z / 0.45 / L)
        mb.uvs.push((j / S) * 4, (i / R) * 2); mb.colors.push(LEAF[0], LEAF[1], LEAF[2], 0)
      }
      for (let i = 0; i < R; i++) for (let j = 0; j < S; j++) {
        const a = i * (S + 1) + j, b = a + 1, c = a + S + 1, d = c + 1
        mb.indices.push(a, b, d, a, d, c)
      }
      const core = new Mesh('plants:core', this.scene)
      mb.toVertexData().applyToMesh(core)
      // the shrubs' own leaf material, tiled over it: the mound reads as foliage, its cutouts ragging the edge
      const leafPart = this.models.find((m) => m.kind === 'shrub')?.parts.find((q) => /leaf|leaves/i.test(q.material?.name ?? ''))
      core.material = leafPart?.material ?? cartoonMaterial(this.scene, 'cartoonPlantCore', true)
      core.renderingGroupId = 3
      core.isPickable = false
      core.alwaysSelectAsActiveMesh = true
      core.setEnabled(false)
      this.core = core
    }
    this.dirty = true
  }
  private core: Mesh | null = null

  update(): void {
    if (!this.dirty || this.models.length === 0) return
    this.dirty = false
    const buckets = new Map<Mesh, Matrix[]>()
    const cores: Matrix[] = []
    for (const list of this.byTile.values()) {
      for (const p of list) {
        // the zone's own species where it names them, else the defaults
        const z = this.zones?.shrubs(p.x, p.z)
        const names = p.kind === 'shrub' ? z?.shrubs : z?.flowers
        let pool = names && names.length ? this.models.filter((m) => m.kind === p.kind && names.includes(m.species)) : []
        if (!pool.length) pool = this.models.filter((m) => m.kind === p.kind && (p.kind === 'shrub' ? SHRUBS : FLOWERS).includes(m.species))
        if (!pool.length) continue
        // a flower bed is one kind: pick by the bed's rounded position, a shrub by its own
        const key = p.kind === 'flower' ? hash(Math.round(p.x / 4) * 4, Math.round(p.z / 4) * 4, 11) : hash(p.x, p.z, 12)
        const model = pool[Math.floor(key * pool.length) % pool.length]
        const want = p.kind === 'shrub' ? 1.7 * p.s : 0.5 * p.s
        const k = Math.max(0.2, Math.min(3, want / model.top))
        const mtx = Matrix.Compose(new Vector3(k, k, k), Quaternion.RotationAxis(Vector3.Up(), p.spin),
          new Vector3(p.x, (p.y ?? this.terrain.heightAt(p.x, p.z)) + 0.02, p.z))
        for (const part of model.parts) (buckets.get(part) ?? buckets.set(part, []).get(part)!).push(mtx)
        if (p.kind === 'shrub' && this.core) {
          const h = want * 1.0
          cores.push(Matrix.Compose(new Vector3(h * 1.35, h, h * 1.35), Quaternion.RotationAxis(Vector3.Up(), p.spin),
            new Vector3(p.x, (p.y ?? this.terrain.heightAt(p.x, p.z)), p.z)))
        }
      }
    }
    if (this.core) {
      if (!cores.length) { this.core.thinInstanceCount = 0; this.core.setEnabled(false) } else {
        const buf = new Float32Array(cores.length * 16)
        cores.forEach((m, i) => m.copyToArray(buf, i * 16))
        this.core.thinInstanceSetBuffer('matrix', buf, 16)
        // (the instanced cartoon shader reads a colour per copy; alpha 0 keeps the mesh's own)
        this.core.thinInstanceSetBuffer('instColor', new Float32Array(cores.length * 4), 4)
        this.core.thinInstanceRefreshBoundingInfo(false)
        this.core.setEnabled(true)
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
