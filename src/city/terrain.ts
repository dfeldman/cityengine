/**
 * The ground is not flat, and for a training game that is not a cosmetic point.
 *
 * Everything else here could be argued as decoration; this cannot. The whole contract of the game is that
 * the trainer's resistance follows the hill the rider can see, and a city baked flat asks the machine for 0%
 * from one end of the session to the other. Brooklyn Heights climbs sixty metres from the waterfront. San
 * Francisco is a byword for it. Riding those flat is not a stylisation, it is a lie about the place.
 *
 * Two representations, because they answer different questions:
 *
 *   **A grid**, sampled every few tens of metres over the whole city, for "how high is the ground at this
 *   point" — which the renderer asks for every vertex of the road, the pavement and every shadow.
 *
 *   **A profile per street**, one height per point of its polyline, for "what is the grade here" — which the
 *   ride model asks once a frame and which has to be smooth, because a grade taken by differencing a coarse
 *   grid jumps at every cell boundary and would make the trainer chatter.
 *
 * Elevation is sampled once, offline, from the same public terrain tiles Trail Trainer uses, and is
 * normalised so that the city's own start point sits at zero — the absolute height above sea level is not
 * interesting and large coordinates cost float precision.
 */

export interface PackedTerrain {
  /** south-west corner of the grid, in local metres */
  x0: number
  z0: number
  /** spacing between samples, in metres */
  step: number
  cols: number
  rows: number
  /**
   * Row-major, `cols * rows` heights in metres, relative to the city's start.
   *
   * `ArrayLike`, not `number[]`, because the tiled cities ship this as a BINARY SIDECAR and hand back a
   * `Float32Array` (BUGS.md #176): 2.6 million JS numbers is 20 MB of heap held for the whole session and
   * 330 ms of `JSON.parse` before the first frame, against 10 MB and no parse at all. Everything that
   * reads it only ever indexes it, so nothing downstream had to change.
   */
  heights: ArrayLike<number>
  /** the file beside `index.json` holding the heights as `Int16` decimetres, when they are not inline */
  bin?: string
  /** where the heights came from, e.g. `terrarium z15` */
  src?: string
  /** the SOURCE's true ground resolution in metres, which is not the same as `step` (below) */
  resM?: number
}

/**
 * One tile's patch of ground, carried in the tile rather than the index (BUGS.md #176, #206c).
 *
 * The index's terrain block was 20.5 MB of a 26.2 MB city index — 78% of a file parsed on the main thread
 * before anything renders — and it is the one thing in there that is purely spatial. At `step` 20 the whole
 * city is 20 MB; at `step` 4 it would be 511 MB, which no browser will parse. Per tile the SAME resolution
 * is about 19 KB, and a 15x15 ring holds 4.3 MB. Disk is cheap; the heap is not (#177: a hard ~3 GB ceiling,
 * fatal and silent).
 *
 * **The grid OVERLAPS its neighbours by one sample row and column**, so `cols` is `tile / step + 1` and the
 * last row is the first row of the tile to the north. Two independently-sampled grids that merely abut do
 * not agree to the last bit, and the ground cracks visibly along every tile border; sharing the sample makes
 * them agree by construction.
 *
 * **`step` is per tile, deliberately, and is NOT dead generality.** Terrarium's pyramid bottoms out at zoom
 * 15 — 3.78 m per pixel here, and zoom 16 is a 404 — so a uniform `step` 4 already matches the best source
 * we fetch, and nothing finer would be data rather than interpolation (BUGS.md #206e). But USGS 3DEP has
 * 1 m lidar over San Francisco that is simply not in this pyramid, so when a better source is wired up for
 * an area (#206f/#206g: the parks and the coastal cliffs), a per-tile step lets it be taken WHERE it exists
 * without re-architecting anything. Do not collapse this to a constant.
 *
 * `src`/`resM` record where a tile's heights came from and what the source's TRUE resolution was, so that a
 * tile can never quietly overstate its data: a step-1 grid resampled from a 10 m model is worse than an
 * honest step-4 one, because everything downstream believes it.
 */
export interface TileTerrain {
  /** spacing between samples, in metres */
  step: number
  /** samples per side; `cols * cols` of them, row-major, the row at z = tz * tile first */
  cols: number
  /** DECIMETRES, relative to the city's start — integers, so the tile's JSON stays small */
  dm: number[]
  /** where the heights came from, e.g. `terrarium z15` */
  src?: string
  /** the SOURCE's true ground resolution in metres (`step` is only how finely we store it) */
  resM?: number
}

/** A tile block as the sampler holds it: the heights as an `Int16Array`, which is 4x the JSON array's heap. */
interface Block { step: number; cols: number; dm: Int16Array }

/**
 * Height lookup by bilinear interpolation.
 *
 * Bilinear rather than nearest because a city is covered in long straight things — a kerb, a lane line, a
 * row of shopfronts — and nearest-neighbour sampling turns every one of them into a staircase.
 */
export class Terrain {
  /**
   * The COARSE grid, from the index: the whole city's footprint, out past the box to the skyline objects.
   * It is what answers for everywhere the rider is not — a landmark base twenty kilometres out, the ride
   * graph beyond the loaded ring, the distant ground mesh and the depth occluder — and it stays coarse on
   * purpose: those two meshes walk it cell by cell at build time, and a finer grid would multiply their
   * quad counts by `(20 / step)^2` and undo the load-time fix of BUGS.md #179.
   */
  private readonly t: PackedTerrain | null
  /** the FINE per-tile blocks, by tile, added as tiles stream in (BUGS.md #206c) */
  private readonly blocks = new Map<number, Block>()
  private readonly tile: number

  constructor(packed: PackedTerrain | null | undefined, tile = 200) {
    this.t = packed && packed.heights.length > 0 ? packed : null
    this.tile = tile
  }

  /** True when the city was baked without elevation, in which case everything here returns zero. */
  get flat(): boolean { return this.t === null && this.blocks.size === 0 }

  /** The coarse grid itself, for the two meshes that must walk it (render/city.ts). */
  get coarse(): PackedTerrain | null { return this.t }

  /*
   * Tiles are keyed by one packed integer rather than a `${tx},${tz}` string. `rawHeightAt` runs once per
   * VERTEX of every draped mesh in the city — the road surface, every pavement, every marking, every shadow
   * — so this lookup is on the hottest path there is here, and building a string per call would allocate
   * millions of them per tile build.
   */
  private static at(tx: number, tz: number): number { return (tx + 32768) * 65536 + (tz + 32768) }

  /** A tile's ground, as its data lands (render/city.ts `ingest`, which runs before anything is built). */
  addTile(tx: number, tz: number, b: TileTerrain | undefined): void {
    if (!b || b.cols < 2 || b.dm.length !== b.cols * b.cols) return
    const k = Terrain.at(tx, tz)
    // game.ts registers every fetched tile and `City.ingest` registers the full ones again; copying the
    // heights twice is pure waste, and `City` is also used without game.ts, so neither call can go
    const had = this.blocks.get(k)
    if (had && had.step === b.step && had.cols === b.cols) return
    this.blocks.set(k, { step: b.step, cols: b.cols, dm: Int16Array.from(b.dm) })
    this.onTile?.(tx, tz)
  }

  /** Forget a tile's ground (game.ts, as the tile leaves the ring). */
  dropTile(tx: number, tz: number): void { if (this.blocks.delete(Terrain.at(tx, tz))) this.onTile?.(tx, tz) }

  /** told when a tile's fine ground arrives or goes (render/city.ts: the depth occluder follows it, BUGS.md #240) */
  onTile: ((tx: number, tz: number) => void) | null = null

  /** How many tiles have their own fine ground right now (for the heap report). */
  get blockCount(): number { return this.blocks.size }

  /** The grid step a tile's ground is stored at, or null when it has none: how finely to subdivide over it. */
  stepIn(key: string): number | null {
    const [tx, tz] = key.split(',').map(Number)
    return this.blocks.get(Terrain.at(tx, tz))?.step ?? null
  }

  /**
   * The streets' own level, where a street is (BUGS.md #38): the bake gives each street the highest ground
   * across its corridor, and inside the corridor everything draped — the road, the pavement, the furniture,
   * a street tree — stands at that level, not tipped with the hill. Null elsewhere.
   */
  grade: ((x: number, z: number) => number | null) | null = null

  /** the level of a street in a cut here (render/city.ts: StreetGrade `cutAt`), which wins over the ground */
  cut: ((x: number, z: number) => number | null) | null = null

  heightAt(x: number, z: number): number {
    // in a street's cut (into a tunnel mouth) what is drawn follows the street, below the ground
    const c = this.cut?.(x, z)
    if (c !== null && c !== undefined) return c
    const raw = this.rawHeightAt(x, z)
    const g = this.grade?.(x, z)
    return g === null || g === undefined ? raw : Math.max(raw, g)
  }

  /**
   * The elevation data itself, without the streets' levelling.
   *
   * The tile's own fine block when there is one, the coarse index grid otherwise. The two agree at the
   * coarse grid's own posts by construction — the bake DECIMATES the coarse grid out of the fine one rather
   * than sampling the source twice — so crossing from a loaded tile to an unloaded one steps by at most the
   * sub-20 m detail the coarse grid cannot carry, and that boundary is only ever at the edge of the ring,
   * more than a kilometre from the rider.
   */
  rawHeightAt(x: number, z: number): number {
    if (this.blocks.size > 0) {
      const b = this.blocks.get(Terrain.at(Math.floor(x / this.tile), Math.floor(z / this.tile)))
      if (b) {
        const fx = (x - Math.floor(x / this.tile) * this.tile) / b.step
        const fz = (z - Math.floor(z / this.tile) * this.tile) / b.step
        const ix = Math.max(0, Math.min(b.cols - 2, Math.floor(fx)))
        const iz = Math.max(0, Math.min(b.cols - 2, Math.floor(fz)))
        const tx = fx - ix
        const tz = fz - iz
        const d = b.dm
        const c = b.cols
        const a0 = d[iz * c + ix] * (1 - tx) + d[iz * c + ix + 1] * tx
        const b0 = d[(iz + 1) * c + ix] * (1 - tx) + d[(iz + 1) * c + ix + 1] * tx
        return (a0 * (1 - tz) + b0 * tz) / 10
      }
    }
    const t = this.t
    if (!t) return 0
    const fx = (x - t.x0) / t.step
    const fz = (z - t.z0) / t.step
    const ix = Math.floor(fx)
    const iz = Math.floor(fz)
    const tx = fx - ix
    const tz = fz - iz
    const h = (cx: number, cz: number): number => {
      const ax = Math.max(0, Math.min(t.cols - 1, cx))
      const az = Math.max(0, Math.min(t.rows - 1, cz))
      return t.heights[az * t.cols + ax]
    }
    const a = h(ix, iz) * (1 - tx) + h(ix + 1, iz) * tx
    const b = h(ix, iz + 1) * (1 - tx) + h(ix + 1, iz + 1) * tx
    return a * (1 - tz) + b * tz
  }

  /**
   * Lift a mesh's vertices onto the ground.
   *
   * The single hook everything flat goes through — the road surface, the pavement, the markings, the
   * shadows. Each keeps the small height it was built at (a kerb is 15 cm above the carriageway) and gains
   * the ground underneath it, so the whole ground stack drapes over the terrain without any of the code that
   * builds it needing to know the terrain exists.
   */
  drape(positions: number[]): void {
    if (this.flat) return
    for (let i = 0; i < positions.length; i += 3) {
      positions[i + 1] += this.heightAt(positions[i], positions[i + 2])
    }
  }

  /** Draped on the raw ground, ignoring the streets' levelling: a park's or a square's few, far-apart vertices
   *  lifted to a street's level where they fall in its corridor made steep planes across the ground. */
  drapeRaw(positions: number[]): void {
    if (this.flat) return
    for (let i = 0; i < positions.length; i += 3) {
      positions[i + 1] += this.rawHeightAt(positions[i], positions[i + 2])
    }
  }
}

/**
 * The height and the grade a street has at a point along it, from that street's own profile.
 *
 * `heights` runs parallel to the polyline's points. The grade is taken over a window rather than between
 * neighbouring points: OSM vertices can be a metre apart, and a two-metre baseline through data quantised to
 * the nearest tenth of a metre produces grades of ±5% on flat ground, which the trainer would faithfully
 * reproduce as chatter.
 */
export function profileAt(points: { x: number; z: number }[], heights: number[] | undefined, s: number):
  { y: number; grade: number } {
  if (!heights || heights.length !== points.length || points.length < 2) return { y: 0, grade: 0 }

  let acc = 0
  let i = 1
  for (; i < points.length; i++) {
    const d = Math.hypot(points[i].x - points[i - 1].x, points[i].z - points[i - 1].z)
    if (acc + d >= s) break
    acc += d
  }
  i = Math.min(i, points.length - 1)
  const seg = Math.hypot(points[i].x - points[i - 1].x, points[i].z - points[i - 1].z)
  const t = seg === 0 ? 0 : Math.max(0, Math.min(1, (s - acc) / seg))
  const y = heights[i - 1] + (heights[i] - heights[i - 1]) * t

  // the grade over a window of about twenty metres either side, which is the scale a rider feels
  const WINDOW = 20
  const { y: back, at: backS } = walk(points, heights, s - WINDOW)
  const { y: fwd, at: fwdS } = walk(points, heights, s + WINDOW)
  const run = fwdS - backS
  return { y, grade: run > 1 ? (fwd - back) / run : 0 }
}

/** Height at a distance along the polyline, clamped to its ends, with the distance actually reached. */
function walk(points: { x: number; z: number }[], heights: number[], s: number): { y: number; at: number } {
  let total = 0
  for (let i = 1; i < points.length; i++) {
    total += Math.hypot(points[i].x - points[i - 1].x, points[i].z - points[i - 1].z)
  }
  const clamped = Math.max(0, Math.min(total, s))
  let acc = 0
  for (let i = 1; i < points.length; i++) {
    const d = Math.hypot(points[i].x - points[i - 1].x, points[i].z - points[i - 1].z)
    if (acc + d >= clamped) {
      const t = d === 0 ? 0 : (clamped - acc) / d
      return { y: heights[i - 1] + (heights[i] - heights[i - 1]) * t, at: clamped }
    }
    acc += d
  }
  return { y: heights[heights.length - 1], at: clamped }
}
