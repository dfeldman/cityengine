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
  /** row-major, `cols * rows` heights in metres, relative to the city's start */
  heights: number[]
}

/**
 * Height lookup by bilinear interpolation.
 *
 * Bilinear rather than nearest because a city is covered in long straight things — a kerb, a lane line, a
 * row of shopfronts — and nearest-neighbour sampling turns every one of them into a staircase.
 */
export class Terrain {
  private readonly t: PackedTerrain | null

  constructor(packed: PackedTerrain | null | undefined) {
    this.t = packed && packed.heights.length > 0 ? packed : null
  }

  /** True when the city was baked without elevation, in which case everything here returns zero. */
  get flat(): boolean { return this.t === null }

  heightAt(x: number, z: number): number {
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
    if (!this.t) return
    for (let i = 0; i < positions.length; i += 3) {
      positions[i + 1] += this.heightAt(positions[i], positions[i + 2])
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
