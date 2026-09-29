/**
 * A BEACH IS A SET OF BANDS, not a sand-coloured polygon (docs/PARKS.md, BUGS.md #200).
 *
 * The owner, on a Mapillary frame of the Great Highway: *"that beach shot on JFK is a great reference for
 * beaches. notice the rocky area leading to sand leading to water."* Adding a `sand` ground kind stops
 * Ocean Beach being a lawn, but one flat tone from the kerb to the surf is a desert, not a beach. From a
 * bike the strip reads, landward to seaward: a rip-rap revetment, dry pale sand, a distinctly DARKER band
 * of wet sand the tide has been over, then water. The apparent shape of the shoreline is drawn by that wet
 * band, not by the geometry — which is exactly why it can be a colour and cost nothing.
 *
 * So this is a DISTANCE-FROM-COASTLINE FUNCTION, not four polygons. The coastline is already one clean ring
 * with its island holes (BUGS.md #159), so every sand vertex can ask how far it is from the water and be
 * tinted accordingly. That needs no new OSM data and generalises to every beach in every city: Ocean Beach,
 * Baker, China, Crissy Field, and the Marin headland coves all get the same treatment without a list of
 * beach names anywhere.
 *
 * TWO THINGS THAT WOULD MAKE IT WRONG, and are handled here:
 *
 *  - **The box edge is not a shore.** The sea ring is CLIPPED to the rideable box (city/tiles.ts
 *    `clipToRect`, and the bake's own clip in `coastlineWater`), so it carries long straight segments that
 *    lie ON the box boundary and are pure artefact. Left in, sand near the west edge of the box would be
 *    "close to water" and paint itself wet. `buildShore` drops any segment lying along the box.
 *  - **Resolution.** Vertex colours interpolate across a triangle, so an 8 m wet band on 8 m triangles is a
 *    gradient rather than a band. The caller subdivides sand finely (`SAND_MAX_EDGE`) and the transition
 *    here is deliberately short.
 *
 * Strip-safe: plain functions and object literals only, no parameter properties — `tools/*` imports from
 * `src/` under `node --experimental-strip-types`.
 */

export interface ShorePoint { x: number; z: number }

/** The coastline, bucketed into a grid of segments so a vertex can ask its distance cheaply. */
export interface ShoreIndex {
  cell: number
  /** the grid's origin and size */
  x0: number
  z0: number
  nx: number
  nz: number
  /** segments per cell, flattened as [ax, az, bx, bz, ...] */
  cells: Float64Array[]
  /** nothing is further from a shore than this, as far as any caller here cares */
  cap: number
}

/** How far from the water a vertex can be before we stop caring: past this, sand is just sand. */
const SHORE_CAP = 140
/** Half the cap, so a query looks at a 5x5 block of cells and is done. */
const SHORE_CELL = 72

/**
 * Build the index from the SEA's rings (outer and island holes alike — a beach on an island faces the water
 * across a hole ring). `box`, when given, is the rideable box: segments lying along it are clip artefacts
 * and are dropped.
 */
export function buildShore(rings: ShorePoint[][],
                           box?: { x0: number; x1: number; z0: number; z1: number }): ShoreIndex | null {
  const EPS = 0.75
  const onBox = (a: ShorePoint, b: ShorePoint): boolean => {
    if (!box) return false
    return (Math.abs(a.x - box.x0) < EPS && Math.abs(b.x - box.x0) < EPS)
      || (Math.abs(a.x - box.x1) < EPS && Math.abs(b.x - box.x1) < EPS)
      || (Math.abs(a.z - box.z0) < EPS && Math.abs(b.z - box.z0) < EPS)
      || (Math.abs(a.z - box.z1) < EPS && Math.abs(b.z - box.z1) < EPS)
  }
  const segs: number[] = []
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
  for (const ring of rings) {
    if (ring.length < 2) continue
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const a = ring[j], b = ring[i]
      if (a.x === b.x && a.z === b.z) continue
      if (onBox(a, b)) continue
      segs.push(a.x, a.z, b.x, b.z)
      x0 = Math.min(x0, a.x, b.x); x1 = Math.max(x1, a.x, b.x)
      z0 = Math.min(z0, a.z, b.z); z1 = Math.max(z1, a.z, b.z)
    }
  }
  if (segs.length === 0) return null
  const cell = SHORE_CELL
  const nx = Math.max(1, Math.ceil((x1 - x0) / cell) + 1)
  const nz = Math.max(1, Math.ceil((z1 - z0) / cell) + 1)
  const lists: number[][] = Array.from({ length: nx * nz }, () => [])
  const col = (x: number): number => Math.min(nx - 1, Math.max(0, Math.floor((x - x0) / cell)))
  const row = (z: number): number => Math.min(nz - 1, Math.max(0, Math.floor((z - z0) / cell)))
  for (let s = 0; s < segs.length; s += 4) {
    const cx0 = col(Math.min(segs[s], segs[s + 2])), cx1 = col(Math.max(segs[s], segs[s + 2]))
    const cz0 = row(Math.min(segs[s + 1], segs[s + 3])), cz1 = row(Math.max(segs[s + 1], segs[s + 3]))
    for (let cz = cz0; cz <= cz1; cz++) {
      for (let cx = cx0; cx <= cx1; cx++) {
        const l = lists[cz * nx + cx]
        l.push(segs[s], segs[s + 1], segs[s + 2], segs[s + 3])
      }
    }
  }
  return { cell, x0, z0, nx, nz, cells: lists.map((l) => new Float64Array(l)), cap: SHORE_CAP }
}

function segDist2(px: number, pz: number, ax: number, az: number, bx: number, bz: number): number {
  const dx = bx - ax, dz = bz - az
  const len2 = dx * dx + dz * dz
  let t = len2 > 0 ? ((px - ax) * dx + (pz - az) * dz) / len2 : 0
  if (t < 0) t = 0; else if (t > 1) t = 1
  const qx = ax + dx * t, qz = az + dz * t
  return (px - qx) * (px - qx) + (pz - qz) * (pz - qz)
}

/** Distance from (x, z) to the nearest coastline segment, clamped at the index's cap. */
export function shoreDistance(ix: ShoreIndex, x: number, z: number): number {
  const cx = Math.floor((x - ix.x0) / ix.cell)
  const cz = Math.floor((z - ix.z0) / ix.cell)
  let best = ix.cap * ix.cap
  // one ring of cells is enough while cell >= cap/2; widen if the cell size is ever reduced
  const r = Math.max(1, Math.ceil(ix.cap / ix.cell))
  for (let j = cz - r; j <= cz + r; j++) {
    if (j < 0 || j >= ix.nz) continue
    for (let i = cx - r; i <= cx + r; i++) {
      if (i < 0 || i >= ix.nx) continue
      const seg = ix.cells[j * ix.nx + i]
      for (let s = 0; s < seg.length; s += 4) {
        const d2 = segDist2(x, z, seg[s], seg[s + 1], seg[s + 2], seg[s + 3])
        if (d2 < best) best = d2
      }
    }
  }
  return Math.sqrt(best)
}

/* ------------------------------------------------------------------ the bands, as colours */

/**
 * WET SAND. Darker and a little cooler than dry sand — wet quartz sand is genuinely about 30% darker in
 * value, and the contrast is the whole point: too subtle and the beach is a desert again. Not blue-grey:
 * it is still sand, just soaked.
 */
const WET: [number, number, number] = [0.50, 0.455, 0.385]
/** How far up the beach the tide has been. A real tidal range puts this at a few tens of metres on a flat
 * beach like Ocean Beach, but what the eye reads from a bike is a band a handful of metres wide against the
 * surf — wider and it reads as a flooded car park. */
const WET_BAND = 9
/** The transition, short on purpose: this is a tide line, not a gradient. */
const WET_EDGE = 2.5
/** Dune grass at the landward edge: sand with growth in it, never a lawn. */
const DUNE: [number, number, number] = [0.47, 0.51, 0.33]
/**
 * Where the dune tint starts to come in, and where it is fully in. Ocean Beach is about 100-150 m from the
 * surf to the seawall, so this greens only its top strip and leaves the flat itself clean pale sand; a
 * narrow cove (China Beach, and most of Baker) never reaches it at all and is correctly all sand. Sand
 * further from the water than `SHORE_CAP` is a DUNE rather than a beach — the inland sand at the west end
 * of Golden Gate Park — and is fully greened, which is what it looks like.
 */
const DUNE_START = 100
const DUNE_FULL = 138

/** A cheap hash in [0,1) — wind ripple and shell litter, so the flat is not a single flat colour. */
function mottle(x: number, z: number, scale: number): number {
  const s = Math.sin(x * scale) * 43758.5453 + Math.cos(z * scale * 1.31) * 27183.1234
  return s - Math.floor(s)
}

const mix = (a: number, b: number, t: number): number => a + (b - a) * t

/**
 * The tint of a point of sand, given its distance from the water. `dry` is the area's own base tint, so a
 * region that paints its sand differently keeps its own colour and only gains the bands.
 */
export function beachTint(dry: [number, number, number], d: number, x: number, z: number): [number, number, number] {
  let r = dry[0], g = dry[1], b = dry[2]
  // wind ripple: a fraction of a per cent of value, at about a two-metre wavelength, plus a coarser drift
  const ripple = (mottle(x, z, 3.1) - 0.5) * 0.030 + (mottle(x, z, 0.37) - 0.5) * 0.045
  r += ripple; g += ripple; b += ripple
  if (d < WET_BAND + WET_EDGE) {
    // 1 at the water, 0 by the top of the transition
    const w = 1 - Math.min(1, Math.max(0, (d - WET_BAND) / WET_EDGE))
    // the very edge of the water is wettest of all: darken a little further in the last couple of metres
    const surf = 1 - Math.min(1, d / 2.5)
    r = mix(r, WET[0] * (1 - surf * 0.10), w)
    g = mix(g, WET[1] * (1 - surf * 0.10), w)
    b = mix(b, WET[2] * (1 - surf * 0.10), w)
  }
  /*
   * Only BETWEEN the start and the cap. Sand that is exactly at the cap is sand the index gave up measuring,
   * which is sand nowhere near the sea: a golf bunker at Harding Park, which is pale and clean and must not
   * be greened. The dune strip is the landward top of an actual beach, and that is inside the cap.
   */
  if (d > DUNE_START && d < SHORE_CAP) {
    // patchy, not a hard line: the mottle biases where the grass takes hold
    const patch = mottle(x, z, 0.21) * 0.6 + mottle(x, z, 0.73) * 0.4
    const t = Math.min(1, (d - DUNE_START) / (DUNE_FULL - DUNE_START)) * (0.15 + 0.60 * patch)
    r = mix(r, DUNE[0], t); g = mix(g, DUNE[1], t); b = mix(b, DUNE[2], t)
  }
  return [Math.min(1, Math.max(0, r)), Math.min(1, Math.max(0, g)), Math.min(1, Math.max(0, b))]
}

/* ------------------------------------------------------------------ band 1: the revetment */

/**
 * RIP-RAP is a REVETMENT, not a boulder field. Ocean Beach's landward edge is a continuous armoured slope of
 * broken rock and concrete rubble — the seawall — and OSM maps it: `barrier=retaining_wall`, 33 ways along
 * the Ocean Beach strip alone, with no `natural=shingle` and no `natural=bare_rock` anywhere near it. So
 * band 1 is placed from MAPPED data while bands 2-4 are generated, which is the same split as everywhere
 * else in docs/PARKS.md: the man-made edge is mapped because somebody built it.
 *
 * Deliberately NOT scattered boulders: the deferred rock system (docs/SCOPE-GOLDEN-GATE.md) is for natural
 * outcrops, a different thing. A textured band with a rough silhouette reads correctly at rider speed.
 */
export const RIPRAP: [number, number, number] = [0.42, 0.405, 0.385]
/** How far the armour spreads from the wall's line. A revetment is a SLOPE, so it is wider than a wall. */
export const RIPRAP_HALF = 4.5

/** The colour of a point of the revetment band: grey rubble, coarsely mottled, with dune grass in its
 * pockets where it meets the sand. `t` is 0 at the wall's line and 1 at the outer edge of the band. */
export function riprapTint(x: number, z: number, t: number): [number, number, number] {
  // coarse: individual blocks a couple of metres across, not sand grain
  const m = mottle(x, z, 1.7) * 0.5 + mottle(x, z, 0.6) * 0.5
  const v = (m - 0.5) * 0.16
  let r = RIPRAP[0] + v, g = RIPRAP[1] + v, b = RIPRAP[2] + v
  // grass in the pockets: only in the darker hollows, only in the landward half of the band
  if (m < 0.34 && t < 0.6) {
    const w = (0.34 - m) * 1.6
    r = mix(r, 0.34, w); g = mix(g, 0.40, w); b = mix(b, 0.24, w)
  }
  return [Math.min(1, Math.max(0, r)), Math.min(1, Math.max(0, g)), Math.min(1, Math.max(0, b))]
}

/**
 * The revetment band along a mapped wall, as a flat ribbon of triangles in the ground mesh.
 *
 * Laid into whichever builder draws the mapped areas, so it is draped onto the terrain with them and needs
 * no material of its own. Subdivided along its length and across its width so the mottle has vertices to
 * live on: a rough, blocky silhouette at rider speed is all a revetment needs to read as broken rock rather
 * than as a painted stripe, and it costs a few hundred triangles for the whole of Ocean Beach.
 *
 * `push` is the caller's vertex sink (position, colour) and `tri` its index sink, so this file stays free of
 * the mesh builder's type and of anything Babylon.
 */
export function revetmentBand(points: ShorePoint[], y: number,
                              push: (x: number, y: number, z: number, c: [number, number, number]) => number,
                              tri: (a: number, b: number, c: number) => void,
                              half = RIPRAP_HALF, step = 3): void {
  if (points.length < 2) return
  const ACROSS = 3
  let prev: number[] | null = null
  for (let i = 0; i + 1 < points.length; i++) {
    const a = points[i], b = points[i + 1]
    const len = Math.hypot(b.x - a.x, b.z - a.z)
    if (len < 0.01) continue
    // a unit normal to the segment: the band straddles the wall's line
    const nx = -(b.z - a.z) / len, nz = (b.x - a.x) / len
    const n = Math.max(1, Math.round(len / step))
    for (let s = i === 0 ? 0 : 1; s <= n; s++) {
      const t = s / n
      const px = a.x + (b.x - a.x) * t, pz = a.z + (b.z - a.z) * t
      const row: number[] = []
      for (let k = 0; k <= ACROSS; k++) {
        // −1 at one side, +1 at the other, with the rubble's own ragged edge: the outer vertices wander
        const u = (k / ACROSS) * 2 - 1
        const ragged = 1 - Math.abs(u) < 0.001 ? 0.72 + 0.28 * mottle(px + k, pz - k, 2.3) : 1
        const off = u * half * ragged
        row.push(push(px + nx * off, y, pz + nz * off, riprapTint(px + nx * off, pz + nz * off, Math.abs(u))))
      }
      if (prev) for (let k = 0; k < ACROSS; k++) {
        tri(prev[k], prev[k + 1], row[k])
        tri(row[k], prev[k + 1], row[k + 1])
      }
      prev = row
    }
  }
}
