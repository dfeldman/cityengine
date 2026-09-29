/**
 * A PUBLIC STAIRWAY as a built thing, not as a slope with treads on it (BUGS.md #213a; docs/PARKS.md B).
 *
 * The generic `render/stairs.ts` treatment quantises the TERRAIN under every tread, so a stairway comes out
 * as whatever the 20 m height grid happens to say — the treads wobble, the flights have no ends, and there is
 * nothing a decorator can hang anything on. A real civic stairway is the other way round: it is a sequence of
 * FLIGHTS, each with a uniform riser, separated by LEVEL LANDINGS, with cheek walls whose coping steps down in
 * register with the treads. That is what San Francisco's named stairways are and what this builds.
 *
 * It is a DRIVER over `parts.ts` `stair()`, which already draws one solid, closed flight with sloped rails —
 * the part added for Yerba Buena. Nothing here re-derives a step: the riser count, the going rule and the
 * closure are all `stair()`'s, and this decides only where one flight ends and the next begins.
 *
 * **Landings are anchored on the LINEAR HEIGHT PROFILE of the way**, not inserted on top of it. The runner's
 * height comes from the ride edge's own profile (BUGS.md #207), never from this mesh, so a landing that
 * pushed the stone above or below that profile would put feet in concrete. Anchoring every landing on the
 * profile leaves a deviation only WITHIN a flight — about a quarter of a metre on a flight of sixteen — which
 * is under the tolerance and is why flights are kept long and landings short.
 *
 * **It returns its flights and landings** (`StairwayResult`), in the flight's own frame, so a LANDMARK can
 * decorate them in register: hedges clipped level per flight, urns at the landing corners, a balustrade along
 * the rake. Lyon Street's own hedges and urns live in `landmarks/sf/lyon-steps.ts` and deliberately not here —
 * in the kit they would turn up on Filbert and Greenwich, where they do not belong.
 *
 * Shared: any city's stairways. Filbert, Greenwich, Hidden Garden, Lincoln Park, Bancroft and Saturn are all
 * mapped and named and are all this shape.
 */
import type { MeshBuilder } from '../buildings.ts'
import type { Rgb } from '../models.ts'
import { type Surface, surfaceTag } from '../cartoon-material.ts'
import { boxAlong, stair } from './parts.ts'

export interface P2 { x: number; z: number }

/** A point on the stairway's centre line: where it is, and the height the RIDE PROFILE gives it there. */
export interface StairPoint { x: number; z: number; y: number }

/**
 * One flight, in its own frame, for a decorator to work from.
 *  - `foot`/`head` are the centre line's two ends, `y0`/`y1` their heights.
 *  - `tx,tz` points UPHILL along the flight; `nx,nz` is its RIGHT-hand side looking uphill.
 *  - `half` is the flight's half width in metres, to the inside face of the cheek wall.
 *  - `copingY` is the height of the cheek coping at the foot — a decorator wanting to sit ON the wall uses it.
 */
export interface StairwayFlight {
  foot: P2; head: P2
  y0: number; y1: number
  tx: number; tz: number; nx: number; nz: number
  half: number; run: number; steps: number; riser: number
  copingY: number
}

/** A level landing between two flights (or at either end of the run). */
export interface StairwayLanding {
  at: P2; y: number
  /** along the run */ tx: number; tz: number
  /** across it */ nx: number; nz: number
  half: number
  /** half the landing's length along the run */ halfLong: number
  /**
   * `'terrace'`: this whole way is LEVEL and was drawn as one slab rather than as flights — the ornamental
   * cross-arms at the Lyon Street terrace are exactly this. `null`: an ordinary landing between two flights.
   */
  end: 'terrace' | null
}

export interface StairwayResult { flights: StairwayFlight[]; landings: StairwayLanding[] }

export interface StairwayStyle {
  /** the going: a riser this tall, near enough (the step count is derived, never typed) */
  riser?: number
  /** at most this many risers before a landing — a long run is broken, a short one is one flight */
  maxRisers?: number
  /**
   * Treat the whole way as LEVEL — one slab, no flights — when it climbs less than this. It exists because
   * the CROSS-ARMS of an ornamental terrace are mapped as `highway=steps` like everything else, and the bake
   * gives them whatever the terrain grid says: the four arms of the Lyon Street terrace carry 0.33–0.47 m
   * over 7.7 m, a 4–6% slope that is the hillside, not a stair. Without this they build as two- and
   * three-step flights running SIDEWAYS across the terrace, complete with newels and a 2.5 m hedge. The
   * default is a slope test as well as an absolute one, so a kit user gets the sane behaviour without
   * knowing this paragraph exists.
   */
  levelBelow?: number
  /** how long a landing is, along the run */
  landing?: number
  /** the cheek wall each side: its height above the nosings, and how many treads share one level of coping */
  cheek?: number
  cheekStep?: number
  /** a handrail down the middle of the flight, as a wide civic flight has */
  centreRail?: boolean
  /** handrails at the flight's two sides */
  sideRails?: boolean
  colour?: Rgb
  treadColour?: Rgb
  copingColour?: Rgb
  material?: Surface
  /** a square newel pedestal at the foot of each flight, outside each cheek */
  newels?: boolean
  newelColour?: Rgb
}

const DEFAULT: Required<Pick<StairwayStyle, 'riser' | 'maxRisers' | 'landing' | 'cheek' | 'cheekStep'>> = {
  riser: 0.165, maxRisers: 16, landing: 1.6, cheek: 0.5, cheekStep: 3,
}

/** Resample a centre line so no gap is longer than `step`, keeping the height profile linear between points. */
function resample(path: StairPoint[], step: number): StairPoint[] {
  const out: StairPoint[] = []
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1]
    const b = path[i]
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    const n = Math.max(1, Math.ceil(L / step))
    for (let k = 0; k < n; k++) {
      const f = k / n
      out.push({ x: a.x + (b.x - a.x) * f, z: a.z + (b.z - a.z) * f, y: a.y + (b.y - a.y) * f })
    }
  }
  out.push(path[path.length - 1])
  return out
}

/** The point `u` metres along a resampled line, with its profile height. */
function along(pts: StairPoint[], cum: number[], u: number): StairPoint {
  const total = cum[cum.length - 1]
  const d = Math.max(0, Math.min(total, u))
  let i = 1
  while (i < cum.length - 1 && cum[i] < d) i++
  const f = cum[i] === cum[i - 1] ? 0 : (d - cum[i - 1]) / (cum[i] - cum[i - 1])
  const a = pts[i - 1]
  const b = pts[i]
  return { x: a.x + (b.x - a.x) * f, z: a.z + (b.z - a.z) * f, y: a.y + (b.y - a.y) * f }
}

/**
 * Build one stairway along `path` (its centre line, with the ride profile's heights) `width` metres wide.
 *
 * The run is broken into flights of at most `maxRisers`, with a level landing between each pair, and every
 * landing sits ON the profile. A run that climbs less than two risers is drawn as a single landing slab
 * rather than as a flight, because a two-step "flight" with cheek walls reads as a wall with a crack in it.
 */
export function stairway(out: MeshBuilder, path: StairPoint[], width: number, style: StairwayStyle = {}): StairwayResult {
  const res: StairwayResult = { flights: [], landings: [] }
  if (path.length < 2) return res
  const riser = Math.max(0.1, style.riser ?? DEFAULT.riser)
  const maxRisers = Math.max(4, style.maxRisers ?? DEFAULT.maxRisers)
  const landLen = Math.max(0.6, style.landing ?? DEFAULT.landing)
  const cheekH = Math.max(0, style.cheek ?? DEFAULT.cheek)
  const cheekStep = Math.max(1, Math.round(style.cheekStep ?? DEFAULT.cheekStep))
  const colour = style.colour ?? [0.76, 0.75, 0.72]
  const tread = style.treadColour ?? [0.72, 0.71, 0.68]
  const coping = style.copingColour ?? [0.82, 0.81, 0.78]
  const material: Surface = style.material ?? 'concrete'
  const tag = surfaceTag(material)
  const half = Math.max(0.7, width / 2)

  const pts = resample(path, 1.5)
  const cum: number[] = [0]
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z))
  const total = cum[cum.length - 1]
  if (total < 1) return res
  const rise = Math.abs(pts[pts.length - 1].y - pts[0].y)

  /*
   * HOW MANY FLIGHTS. From the RISE, not from the length: a stairway is broken where a climber wants to stop,
   * which is every dozen or so steps. The landings then eat `n * landLen` of the run, so the flights are
   * steeper than the mean gradient — that is what a real stairway is, and it is why the landings are anchored
   * on the profile rather than stacked on top of it.
   */
  const risers = Math.max(1, Math.round(rise / riser))
  const level = style.levelBelow ?? Math.max(0.3, 0.08 * total)
  if (risers < 2 || rise < level) {
    // a level link — the cross-arms of a terrace, a landing mapped as its own way
    landingSlab(out, pts, cum, 0, total, half, colour, tread, tag, res, 'terrace')
    return res
  }
  const flightCount = Math.max(1, Math.ceil(risers / maxRisers))
  const landingTotal = Math.min(total * 0.3, (flightCount - 1) * landLen)
  const eachLanding = flightCount > 1 ? landingTotal / (flightCount - 1) : 0
  const flightRun = (total - landingTotal) / flightCount

  let u = 0
  for (let f = 0; f < flightCount; f++) {
    const a = along(pts, cum, u)
    const b = along(pts, cum, u + flightRun)
    buildFlight(out, a, b, half, {
      riser, cheekH, cheekStep, colour, tread, coping, tag, material,
      centreRail: style.centreRail ?? false, sideRails: style.sideRails ?? true,
      newels: style.newels ?? false, newelColour: style.newelColour ?? coping,
    }, res)
    u += flightRun
    if (f < flightCount - 1 && eachLanding > 0.2) {
      landingSlab(out, pts, cum, u, u + eachLanding, half, colour, tread, tag, res, null)
      u += eachLanding
    }
  }
  return res
}

/** A level slab from `u0` to `u1` along the run, at the profile's height in the middle of it. */
function landingSlab(out: MeshBuilder, pts: StairPoint[], cum: number[], u0: number, u1: number, half: number,
                     colour: Rgb, tread: Rgb, tag: number, res: StairwayResult, end: 'terrace' | null): void {
  const a = along(pts, cum, u0)
  const b = along(pts, cum, u1)
  const L = Math.hypot(b.x - a.x, b.z - a.z)
  if (L < 0.2) return
  const tx = (b.x - a.x) / L
  const tz = (b.z - a.z) / L
  const nx = tz
  const nz = -tx
  const y = (a.y + b.y) / 2
  const cx = (a.x + b.x) / 2
  const cz = (a.z + b.z) / 2
  const heading = Math.atan2(tz, -tx)
  // a slab 0.45 m thick, so it has a visible edge and no daylight under it where the ground falls away
  boxAlong(out, cx, y - 0.22, cz, L / 2, 0.24, half, heading, colour, tag)
  boxAlong(out, cx, y + 0.015, cz, L / 2, 0.03, half, heading, tread, tag)
  res.landings.push({ at: { x: cx, z: cz }, y, tx, tz, nx, nz, half, halfLong: L / 2, end })
}

interface FlightOpts {
  riser: number; cheekH: number; cheekStep: number
  colour: Rgb; tread: Rgb; coping: Rgb; tag: number; material: Surface
  centreRail: boolean; sideRails: boolean; newels: boolean; newelColour: Rgb
}

/** One flight from `a` to `b`, plus the cheek walls whose coping steps in register with the treads. */
function buildFlight(out: MeshBuilder, a: StairPoint, b: StairPoint, half: number, o: FlightOpts, res: StairwayResult): void {
  const L = Math.hypot(b.x - a.x, b.z - a.z)
  if (L < 0.5) return
  const up = { x: (b.x - a.x) / L, z: (b.z - a.z) / L }
  // `stair()` climbs along +n of its baseline, where n = (tz, -tx): so the baseline runs (-up.z, up.x)
  const base = { x: -up.z, z: up.x }
  const down = a.y <= b.y
  const foot = down ? a : b
  const head = down ? b : a
  const fdir = down ? up : { x: -up.x, z: -up.z }
  const bdir = down ? base : { x: -base.x, z: -base.z }
  const y0 = Math.min(a.y, b.y)
  const y1 = Math.max(a.y, b.y)
  const p0 = { x: foot.x - bdir.x * half, z: foot.z - bdir.z * half }
  const p1 = { x: foot.x + bdir.x * half, z: foot.z + bdir.z * half }

  const s = stair(out, p0, p1, y0, y1, {
    riser: o.riser, run: L, tread: 'paving', colour: o.colour, treadColour: o.tread, material: o.material,
    rail: o.sideRails ? 'both' : 'none', railKind: 'posts',
  })

  /*
   * THE CHEEK WALLS, and the whole point of them: the coping is LEVEL over a few treads at a time and then
   * steps, so the wall reads as a staircase rather than as a ramp beside one. A continuous raking coping is
   * the single most common way to draw this wrong.
   */
  const rA = (y1 - y0) / s.steps
  const td = s.tread
  const WALL = 0.34
  if (o.cheekH > 0) {
    for (const sgn of [-1, 1] as const) {
      const ox = bdir.x * sgn * (half + WALL / 2)
      const oz = bdir.z * sgn * (half + WALL / 2)
      for (let k = 0; k < s.steps; k += o.cheekStep) {
        const kEnd = Math.min(s.steps, k + o.cheekStep)
        const v0 = k * td
        const v1 = kEnd * td
        // level over these treads, at the height of the HIGHEST nosing under it, plus the wall
        const top = y0 + kEnd * rA + o.cheekH
        const bot = y0 + k * rA - 1.1
        const cx = foot.x + fdir.x * ((v0 + v1) / 2) + ox
        const cz = foot.z + fdir.z * ((v0 + v1) / 2) + oz
        const heading = Math.atan2(fdir.z, -fdir.x)
        boxAlong(out, cx, (bot + top - 0.12) / 2, cz, (v1 - v0) / 2, (top - 0.12 - bot) / 2, WALL / 2, heading, o.colour, o.tag)
        // the coping: a pale cap course, proud of the wall, which is what catches the light down a flight
        boxAlong(out, cx, top - 0.06, cz, (v1 - v0) / 2, 0.06, WALL / 2 + 0.05, heading, o.coping, o.tag)
      }
      if (o.newels) {
        // the square pedestal at the foot of the flight, outside the cheek — the photographs' most distinctive piece
        const nx2 = foot.x + bdir.x * sgn * (half + WALL + 0.24) - fdir.x * 0.1
        const nz2 = foot.z + bdir.z * sgn * (half + WALL + 0.24) - fdir.z * 0.1
        const h = 1.15
        boxAlong(out, nx2, y0 + h / 2 - 0.4, nz2, 0.36, h / 2 + 0.4, 0.36, Math.atan2(fdir.z, -fdir.x), o.colour, o.tag)
        boxAlong(out, nx2, y0 + h - 0.05, nz2, 0.44, 0.09, 0.44, Math.atan2(fdir.z, -fdir.x), o.newelColour, o.tag)
      }
    }
  }
  if (o.centreRail) {
    const line: [number, number, number][] = []
    for (let k = 0; k <= s.steps; k++) line.push([foot.x + fdir.x * (k * td), y0 + k * rA + 0.95, foot.z + fdir.z * (k * td)])
    for (let i = 0; i < line.length - 1; i++) {
      const p = line[i]
      const q = line[i + 1]
      const mid: [number, number, number] = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2]
      const len = Math.hypot(q[0] - p[0], q[2] - p[2], q[1] - p[1])
      boxAlong(out, mid[0], mid[1], mid[2], len / 2, 0.028, 0.028, Math.atan2(fdir.z, -fdir.x), [0.17, 0.18, 0.21], surfaceTag('metal'))
      if (i % 5 === 0) boxAlong(out, p[0], p[1] - 0.48, p[2], 0.03, 0.48, 0.03, 0, [0.17, 0.18, 0.21], surfaceTag('metal'))
    }
  }

  res.flights.push({
    foot: { x: foot.x, z: foot.z }, head: { x: head.x, z: head.z }, y0, y1,
    tx: fdir.x, tz: fdir.z, nx: bdir.x, nz: bdir.z,
    half, run: L, steps: s.steps, riser: rA, copingY: y0 + o.cheekH,
  })
}

/**
 * A stairway that is a LANDMARK: how its stone is built, and what decorates it. Regions keep their own table
 * (`landmarks/sf/stairways.ts`) and `render/stairs.ts` is handed it, so a shared layer never imports a city's
 * builders (feedback-region-files).
 */
export interface NamedStairway {
  style: StairwayStyle
  /** metres, overriding whatever OSM says the way is wide — a showcase stair is measured, not guessed */
  width?: number
  decorate?(out: MeshBuilder, res: StairwayResult): void
}
