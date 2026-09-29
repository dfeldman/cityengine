/**
 * THE LYON STREET STEPS — the landmark, which is to say the GARDEN, not the stair (BUGS.md #213a).
 *
 * The owner rates these in the city's top ten and scores them at *"like 50% good enough"*, and has said where
 * the missing half is: *"for example the steps have unique hedges and decorations."* The flights themselves
 * were close enough; what was absent was the SETTING. On Lyon Street the planting is not decoration added to a
 * stair, it IS what people photograph — a green frame descending in register with the treads, holding the view
 * north down the axis over the Palace of Fine Arts and the bay.
 *
 * ### What the photographs show (Mapillary, fetched through tools/photo.ts, in docs/shots/lyon/)
 *
 *  - `upper-flight.jpg` (frame 916849129608977, from Vallejo looking up the Broadway flight) — a **dense dark
 *    green mass either side of the flight, higher than a person**, its top clipped roughly level and stepping
 *    down with the treads; a **square concrete newel pedestal** at the foot of the flight; a stepped cheek wall
 *    with a pale coping; a **black metal handrail**; pale stucco retaining wall behind the planting.
 *  - `landing.jpg` (419417267071892, the same flight from further back) — the flight framed by two ROUNDED
 *    shrubs standing proud of the clipped hedge, a pedestal at the foot, and the grand houses above.
 *  - `top-broadway.jpg` (972737274131385, the head at Broadway) — **low clipped hedges**, pale yellow-green,
 *    lining the head terrace, with the bay behind them. A different hedge from the tall flanking one: this one
 *    is knee-high and is what frames the view.
 *  - `lower-flight.jpg` (505165738334921, north over the lower run) — mixed garden planting spilling over the
 *    verges, the bay and the Marin headlands beyond. Confirms the axis: the view is NORTH, downhill.
 *
 * ### The one thing that had to be right
 *
 * **The hedges are clipped LEVEL PER FLIGHT.** A hedge whose top follows the slope is what any generic
 * treatment produces and is the single most likely way to get this wrong: it reads as a green ramp beside a
 * stone stair. Here each flight gets a hedge box whose top is ONE height for the whole flight and which steps
 * down at every landing — a staircase in green beside a staircase in stone. That is the whole brief in one
 * loop, and it is why this file consumes `StairwayResult.flights` rather than the centre line.
 *
 * ### Why this is not in the kit
 *
 * The kit (`landmarks/stairway.ts`) gives flights, landings, stepped cheek walls and rake-following rails, and
 * that generalises to Filbert, Greenwich, Hidden Garden, Lincoln Park, Bancroft and Saturn. The hedges, the
 * urns and the balustraded terrace are Lyon Street's own. Pushed into the kit they would turn up on Filbert,
 * which is a wooden stair through cottage gardens and has none of them.
 */
import type { MeshBuilder } from '../../buildings.ts'
import { boxAlong } from '../parts.ts'
import { prism } from '../../models.ts'
import type { Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { stairway, type StairwayResult, type StairwayStyle, type StairwayFlight, type StairwayLanding } from '../stairway.ts'

/* The greens. Two, because the photographs show two different plants doing two different jobs: the tall
 * flanking mass (dark, glossy, a laurel or pittosporum) and the low clipped edging at the head (pale, yellow
 * green, a boxwood or euonymus). Flat colour, tag 0, the way every lawn and hedge cap in the city is. */
const HEDGE_DARK: Rgb = [0.25, 0.39, 0.22]
const HEDGE_LIGHT: Rgb = [0.44, 0.55, 0.26]
const HEDGE_SHADE: Rgb = [0.16, 0.27, 0.16]
const FLOWER: Rgb = [0.60, 0.45, 0.47]
const STONE: Rgb = [0.80, 0.78, 0.74]
const STUCCO: Rgb = [0.84, 0.82, 0.76]

const CONCRETE = surfaceTag('concrete')
const STUCCO_TAG = surfaceTag('stucco')
const LEAF = 0

/**
 * The stair itself, as Lyon Street builds it: a fairly steep concrete flight with stepped cheek walls, a pale
 * coping, handrails at the sides AND down the middle (it is wide enough to need one), and the square newel
 * pedestals the photographs show at every flight foot.
 */
export const LYON_STYLE: StairwayStyle = {
  riser: 0.165,
  maxRisers: 15,
  landing: 1.5,
  cheek: 0.42,
  cheekStep: 3,
  /*
   * A metre. The four cross-arms of the terrace are mapped as `highway=steps` and the bake hands them the
   * hillside's own 4–6% — said outright here rather than left to the kit's slope test, because on THIS
   * stairway a sideways two-step flight across the terrace is the whole feature ruined.
   */
  levelBelow: 1.0,
  centreRail: true,
  sideRails: true,
  newels: true,
  // the RISERS darker than the TREADS: with the two the same pale grey a flight reads as a ramp from any
  // distance, which is exactly what the axis view showed on the first pass
  colour: [0.60, 0.59, 0.56],
  treadColour: [0.80, 0.79, 0.75],
  copingColour: STONE,
  newelColour: STONE,
  material: 'concrete',
}

/**
 * Decorate a built run. `res` is what `stairway()` returned, so every piece here is placed in the flights' own
 * frame and cannot drift out of register with the treads however the run is split.
 */
export function decorateLyon(out: MeshBuilder, res: StairwayResult): void {
  for (const f of res.flights) hedgeBeside(out, f)
  for (const l of res.landings) dressLanding(out, l)
}

/**
 * THE STEPPING HEDGE. One box per side per flight, its top at ONE height for the whole flight — the flight's
 * own head nosing plus the hedge's clipped height — so consecutive flights give a descending green staircase.
 * Behind it a stucco retaining wall, which is what the flanking planting actually stands on here, and in front
 * of it a few rounded shrubs standing proud, so the clipped mass is not a bare extruded rectangle.
 */
function hedgeBeside(out: MeshBuilder, f: StairwayFlight): void {
  const heading = Math.atan2(f.tz, -f.tx)
  const midU = f.run / 2
  /*
   * CLIPPED LEVEL, AND MEASURED FROM THE MIDDLE OF THE FLIGHT. A gardener clips one flight's hedge to one
   * height, so it stands about waist high at the head of the flight and well over a head at its foot — which
   * is exactly what the photographs show, towering when you look UP a flight and low when you look down it.
   * Measuring the clip from the HEAD instead walls the head in and hides the stair from the axis view, which
   * is the shot that matters; measuring it from the foot buries the flight.
   */
  const CLIP = 1.15                 // how far the clipped top stands above the MIDDLE of the flight
  const DEPTH = 1.5                 // how deep the planted verge is, outside the cheek wall
  const WALL = 0.34
  const mid = (f.y0 + f.y1) / 2
  const top = mid + CLIP
  for (const sgn of [-1, 1] as const) {
    const off = sgn * (f.half + WALL + DEPTH / 2)
    const cx = f.foot.x + f.tx * midU + f.nx * off
    const cz = f.foot.z + f.tz * midU + f.nz * off
    /*
     * The hedge: a box, because a CLIPPED hedge is a box — that is what clipping it means. Its base is taken
     * a metre below the flight's foot so it never floats where the verge falls away, and its top is LEVEL.
     */
    const base = f.y0 - 1.2
    boxAlong(out, cx, (base + top) / 2, cz, f.run / 2, (top - base) / 2, DEPTH / 2, heading, HEDGE_DARK, LEAF)
    // the shaded flank facing the stair, so the mass has an edge against the pale stone rather than a seam
    boxAlong(out, f.foot.x + f.tx * midU + f.nx * sgn * (f.half + WALL + 0.06),
      (base + top) / 2, f.foot.z + f.tz * midU + f.nz * sgn * (f.half + WALL + 0.06),
      f.run / 2, (top - base) / 2, 0.06, heading, HEDGE_SHADE, LEAF)
    /*
     * The rounded shrubs standing proud of the clipped line (both photographs show these): three per flight,
     * placed from the flight's own length so they cannot bunch, and never at the very ends where the newels
     * and the landing urns are.
     */
    for (let k = 0; k < 3; k++) {
      const u = f.run * (0.22 + 0.28 * k)
      if (u > f.run - 0.6) break
      const y = f.y0 + (u / f.run) * (f.y1 - f.y0)
      const r = 0.62 + 0.12 * ((k + (sgn > 0 ? 1 : 0)) % 3)
      const sx = f.foot.x + f.tx * u + f.nx * sgn * (f.half + WALL + DEPTH * 0.4)
      const sz = f.foot.z + f.tz * u + f.nz * sgn * (f.half + WALL + DEPTH * 0.4)
      // a squat prism reads as a clipped ball at rider speed and costs a tenth of a sphere
      prism(out, sx, sz, Math.max(y, top - 1.9), top + 0.45, r * 0.55, 8, HEDGE_DARK, LEAF, r, true)
    }
    /*
     * THE RETAINING WALL behind the planting. The verges on Lyon Street are held up by pale stucco walls —
     * they are in every frame — and without one the hedge stands on air wherever the ground falls away.
     */
    const wx = f.foot.x + f.tx * midU + f.nx * sgn * (f.half + WALL + DEPTH)
    const wz = f.foot.z + f.tz * midU + f.nz * sgn * (f.half + WALL + DEPTH)
    // it stops UNDER the hedge: a wall carried up to the flight's head stands above the clipped line and
    // reads as a blank slab, which is what it did on the first shot of this
    const wTop = mid - 0.2
    boxAlong(out, wx, (f.y0 - 0.8 + wTop) / 2, wz, f.run / 2, (wTop - f.y0 + 0.8) / 2, 0.18, heading, STUCCO, STUCCO_TAG)
  }
}

/**
 * THE LANDINGS: a balustrade along the two open sides, an urn on a pedestal at each corner, and a planted bed
 * beyond. The balustrade is `solid` rather than posts — the photographs show a low stucco parapet with a stone
 * coping, not ironwork — and the urns are the "decorations" the owner named.
 */
function dressLanding(out: MeshBuilder, l: StairwayLanding): void {
  const heading = Math.atan2(l.tz, -l.tx)
  for (const sgn of [-1, 1] as const) {
    const bx = l.at.x + l.nx * sgn * (l.half + 0.2)
    const bz = l.at.z + l.nz * sgn * (l.half + 0.2)
    // the parapet, level, along the landing's open side
    /*
     * SHORT OF THE ENDS. A terrace cross-arm runs INTO the main flight at one of its ends, and a parapet run
     * to the junction node pokes through the 4.4 m-wide stair. Which end the junction is on is not knowable
     * from the way alone, so both are held back.
     */
    const pl = Math.max(0.6, l.halfLong - 1.2)
    boxAlong(out, bx, l.y + 0.42, bz, pl, 0.42, 0.14, heading, STUCCO, STUCCO_TAG)
    boxAlong(out, bx, l.y + 0.88, bz, pl, 0.05, 0.19, heading, STONE, CONCRETE)
    // an urn at each end of it
    for (const e of [-1, 1] as const) {
      const ux = bx + l.tx * e * (pl - 0.25)
      const uz = bz + l.tz * e * (pl - 0.25)
      urn(out, ux, uz, l.y + 0.93)
    }
    // the bed beyond the parapet: low clipped edging with flowers behind it, which is the head-terrace planting
    const px = l.at.x + l.nx * sgn * (l.half + 1.1)
    const pz = l.at.z + l.nz * sgn * (l.half + 1.1)
    boxAlong(out, px, l.y + 0.18, pz, l.halfLong, 0.34, 0.55, heading, HEDGE_LIGHT, LEAF)
    boxAlong(out, px + l.nx * sgn * 0.8, l.y + 0.34, pz + l.nz * sgn * 0.8, l.halfLong * 0.9, 0.5, 0.5, heading, HEDGE_DARK, LEAF)
    if (l.end !== null) {
      // at the very head and foot of the run the edging is the KNEE-HIGH clipped hedge of `top-broadway.jpg`,
      // run across the terrace rather than along it, with a little colour behind
      boxAlong(out, px + l.nx * sgn * 1.5, l.y + 0.22, pz + l.nz * sgn * 1.5, l.halfLong * 0.8, 0.22, 0.4, heading, HEDGE_LIGHT, LEAF)
      boxAlong(out, px + l.nx * sgn * 2.0, l.y + 0.16, pz + l.nz * sgn * 2.0, l.halfLong * 0.7, 0.16, 0.35, heading, FLOWER, LEAF)
    }
  }
}

/** A stone urn on the parapet: a square plinth, a tapered bowl, and the planting spilling out of it. */
function urn(out: MeshBuilder, x: number, z: number, y: number): void {
  boxAlong(out, x, y + 0.14, z, 0.26, 0.14, 0.26, 0, STONE, CONCRETE)
  prism(out, x, z, y + 0.28, y + 0.42, 0.13, 8, STONE, CONCRETE, 0.2, false)
  prism(out, x, z, y + 0.42, y + 0.78, 0.2, 8, STONE, CONCRETE, 0.3, false)
  prism(out, x, z, y + 0.78, y + 0.86, 0.3, 8, STONE, CONCRETE, 0.32, true)
  // what is planted in it — a mound over the rim, which is what makes it an urn and not a bollard
  prism(out, x, z, y + 0.84, y + 1.18, 0.31, 8, HEDGE_DARK, LEAF, 0.1, true)
}

/**
 * `?model=lyonStreetSteps` — the whole run on its own, for `tools/model-shots.ts`, which is the cheap way to
 * judge the hedges without rendering the city (and the only way while a bake has the machine).
 *
 * The plan is the REAL geometry: the six OSM ways between Broadway and Green (398849852, 302293949, the two
 * cross arms 302293952/953 of the terrace, 302293951 and the 125-step 398849853), converted to local metres
 * about the middle of the run. The PROFILE here is a straight line over the whole drop rather than the
 * terrain's, because the showcase has no terrain — in the city the heights come from the ride edge's own
 * profile, which is what the runner's feet follow. So this harness judges the SETTING, not the gradient.
 */
const RUN_LL: [number, number][][] = [
  [[37.792949, -122.446467], [37.793186, -122.446504]],
  [[37.793242, -122.446512], [37.793499, -122.446552]],
  [[37.793507, -122.446465], [37.793499, -122.446552], [37.793491, -122.44664]],
  [[37.793626, -122.446659], [37.793634, -122.446573], [37.793643, -122.446485]],
  [[37.793634, -122.446573], [37.793682, -122.44658]],
  [[37.793871, -122.446609], [37.794188, -122.446658], [37.794241, -122.446666]],
]
/* Broadway (south, lat 37.79281) is the HEAD and Green (north, 37.79471) the foot: the run drops ~31 m north,
 * which is why the view down the axis is north, over the Palace of Fine Arts and the bay. */
const MID_LAT = 37.79360
const MID_LON = -122.44657
const DROP_PER_DEG = 31 / 0.0019

export function lyonStreetSteps(out: MeshBuilder): void {
  const mLat = 111320
  const mLon = 111320 * Math.cos((MID_LAT * Math.PI) / 180)
  for (const way of RUN_LL) {
    const line = way.map(([lat, lon]) => ({
      x: (lon - MID_LON) * mLon,
      z: -(lat - MID_LAT) * mLat,
      y: (37.79471 - lat) * DROP_PER_DEG,
    }))
    const res = stairway(out, line, 4.4, LYON_STYLE)
    decorateLyon(out, res)
  }
}
