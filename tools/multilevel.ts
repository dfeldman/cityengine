/*
 * THE MULTI-LEVEL PASS (docs/SEINE-MULTILEVEL.md, 2026-11-15). The last word on heights and ground inside the Seine band.
 *
 * Every earlier pass (lidar drape, plates, the bridges pass, lids, the band's BD TOPO blend, deck zones, the road bed) leaves
 * the band's ways and ground roughly right but mutually inconsistent: a lower quai sunk to the water because it stood under
 * the band's riverbed line, a footway node left 3 m over the ground, a deck end and its street 1.5 m apart, pits under decks.
 * This pass rebuilds both from three plain rules:
 *
 *  1. ONE HEIGHT SOLVE for every way in the band: shared nodes are one unknown; each way is smooth along itself (a membrane,
 *     length scale ML_SMOOTH m); decks, car tunnels and trench roads hold their heights; every other vertex is pulled to the
 *     1 m lidar MNT wherever the lidar can see it (not under a bridge outline or a deck, not in the river, and not more than
 *     ML_TRUST m from the way: further than that the way is under a cover, BD TOPO's height kept). Long segments are first
 *     split every ML_DENSIFY m, so a 40 m segment follows the ground between its ends.
 *  2. ONE GROUND: the lidar MNT, filled smoothly (Laplace) under bridge outlines and decks where the lidar sees the structure;
 *     each at-grade way's corridor laid exactly at the way, easing back to the lidar over ML_SKIRT m. The river (by its outline,
 *     never by a height line) is left to the river.
 *  3. FLAGS FROM GEOMETRY: `ramp` (drawn as a deck) only where a way still stands ML_RAMP_ABOVE m over that ground.
 *
 * It eases into the map over the band's own edge (ML_EASE m) and is persisted nowhere (MULTILEVEL=0 turns it off).
 * Code frame: x east, z north, metres; heights in bake metres.
 */
import type { PackedEdge, PackedRail, PackedArea } from '../src/city/package.ts'
import { onSurface } from '../src/city/package.ts'

/** the membrane's length scale along a way (m): how far a held height (a deck end) reaches into the street beside it */
export const ML_SMOOTH = Number(process.env.ML_SMOOTH ?? 9)
/** a vertex further than this from the lidar (m) is under a cover, or the lidar is wrong there: its own height is kept */
export const ML_TRUST = Number(process.env.ML_TRUST ?? 2.5), ML_TRUST_UP = Number(process.env.ML_TRUST_UP ?? 1.0)
/** weights: the lidar pull, a held height (deck, car tunnel), a trench road, a kept height (covered) */
export const ML_W_MNT = 1, ML_W_HOLD = 60, ML_W_CUT = 20, ML_W_KEEP = Number(process.env.ML_W_KEEP ?? 0.6), ML_W_KEEP_OVER = 0.6, ML_W_PRIOR = 0.05
/** the grade the solve aims under (stairs aside): a steeper segment's membrane is stiffened and the solve re-run, up to ML_GRADE_ITERS times */
export const ML_GRADE_MAX = Number(process.env.ML_GRADE_MAX ?? 0.11), ML_GRADE_ITERS = Number(process.env.ML_GRADE_ITERS ?? 5)
/** a deck holds its height fully only this far (m, along it) from an end that meets a street; nearer, the hold eases to ML_W_MNT */
export const ML_DECK_END = 25, ML_DECK_END_MIN = 0.2
/** segments longer than this are split (m) before the solve */
export const ML_DENSIFY = Number(process.env.ML_DENSIFY ?? 5)
/** the ground's grid (m), its tile (cells), the corridor's pad over the way's half-width (m), the skirt back to the lidar (m) */
export const ML_CELL = 1, ML_TILE = 64, ML_BED_PAD = 0.4, ML_TRENCH_PAD = 1.5, ML_SKIRT = Number(process.env.ML_SKIRT ?? 4)
/** a bridge outline's pad (m) and a deck way's (over its half-width) inside which the lidar is the structure, not the ground */
export const ML_STRUCT_PAD = 1.5, ML_DECK_PAD = 1.5
/** under a deck within this of the lidar there (a lid, a bridge's end on land) the ground is filled to ML_FILL_UNDER under it (m) */
export const ML_FLUSH = 1.5, ML_FILL_UNDER = 0.25
/** the band's edge: the pass fades out over this many metres outside it. (25 m left the Pont National's left-bank approach to the old
 *  passes' ground, 2–3 m under the footways on it: 4 floating footways, 8 steep pieces and the Allée Paris-Ivry's 38 % drop; at 60 m,
 *  1, 4 and none) */
export const ML_EASE = Number(process.env.ML_EASE ?? 60)
export const ML_EASE_FULL = Number(process.env.ML_EASE_FULL ?? 0.5)
/** a way standing this far over the ground (m) keeps `ramp` (a deck is drawn under it); under it the flag goes */
export const ML_RAMP_ABOVE = 1.5
/** inside the river's outline: land if the lidar (seen) stands this far over the water (m); under a structure, land within this of a
 *  way's corridor (m); otherwise the bed, this far under the water (m) */
export const ML_RIVER_LAND = 0.8, ML_RIVER_CORR = 2.5, ML_RIVER_BED = 1.5, ML_BOAT_PAD = 1.5, ML_RIVER_WALL_GAP = 0.8
/** BRIDGE GHOSTS IN THE LIDAR: the MNT's interpolation under a bridge can read near the deck, 6 m over the water, in a strip beside the
 *  OSM outline that spans bank to bank (Pont de la Concorde, 2026-11-15) — so the shore flood fill keeps it. Within ML_BRIDGE_NEAR m of a
 *  bridge outline and more than ML_BANK m from the river's edge, lidar land in the river is the riverbed unless a way runs within
 *  ML_RIVER_CORR m (a lower quay under a bridge has its path) — as under the structure itself. (A height test, ML_PORT_MAX over the
 *  water, left the ghost's 2–5 m down-ramp standing as a lower quay joined to the shore) */
export const ML_BRIDGE_NEAR = 30, ML_BANK = 2.5, ML_PORT_MAX = 0
/** under a structure the ground continues the nearest at-grade way's level out to this far (m); further, the Laplace fill */
export const ML_UNDER_REACH = Number(process.env.ML_UNDER_REACH ?? 25)
/** …but not a level more than this over the lidar there (m; 0: off): see the ground under a structure */
export const ML_UNDER_MNT_DH = Number(process.env.ML_UNDER_MNT_DH ?? 2.5), ML_UNDER_MNT_RIVER = Number(process.env.ML_UNDER_MNT_RIVER ?? 60)
/** a lower-layer way is blind to the lidar this far (m, past the upper way's half-width) from where a higher-layer way crosses it */
export const ML_UNDER_CROSS = 8
/** bridge ways on one structure share its deck: a deck vertex holds the highest deck way within this (m), if within ML_DECK_DH m of it */
export const ML_DECK_SHARE = 10, ML_DECK_DH = 2.2
/** GRADE SEPARATION: a way crossing over another by this much (m) or more is a deck over the lower way's corridor plus ML_SEP_PAD m
 *  each side (straight from end to end); spans within ML_SEP_MERGE m of each other are one deck */
export const ML_SEP = Number(process.env.ML_SEP ?? 3.0), ML_SEP_PAD = 3, ML_SEP_MERGE = 6, ML_NODE0 = 8.8e14
/** GAP JOINS ACROSS LEVELS: tools/gaps.ts joins a dangling way end to a way within reach (new nodes from ML_GAP0), before any heights —
 *  and a path ending at a tunnel's mouth with a longer reach. At the Tunnel des Tuileries' mouth (48.858571,2.340164, owner: "a route
 *  goes through a tunnel entrance") it joined the lower quai's trench path to the Quai du Louvre's sidewalk 3 m over it, and the
 *  sidewalk dived into the mouth to meet it. gaps.ts reaches from a tunnel's mouth because a tunnel "is not ridden"; one that IS
 *  (a bore: the Tunnel des Tuileries carries the promenade) continues the path, so the join is undone there: the joined way's end is
 *  its own node again, ML_GAP_BACK m back. (Heights could not tell: the ways come in at one height at the join — 0.24 m — and part only
 *  in the solve, where the tunnel holds the path's other end 2.7 m lower) */
export const ML_GAP0 = 9e14, ML_GAP1 = 9.7e14, ML_GAP_BACK = 0.3, ML_GAP_NODE0 = 8.9e14
/** …and a join whose last piece CLIMBS in the lidar, more than ML_GAP_LIDAR_DH m at over ML_GAP_LIDAR_GRADE: a flight down to the lower
 *  quai by the Pont d'Arcole was joined at its foot to a way on the upper quai 7.9 m higher and 3 m off, and the solve held the whole
 *  flight level at the top, 8.5 m over the port */
export const ML_GAP_LIDAR_DH = 2, ML_GAP_LIDAR_GRADE = 0.6
/** a node whose ways end more than this far apart in height (m) is split, one node per level (new ids from ML_SPLIT_NODE0) */
export const ML_NODE_SPLIT = 2.0, ML_SPLIT_NODE0 = 8.95e14
/** a tunnel this share of whose length lies under a bridge's outline is a passage under it, at grade */
export const ML_PASSAGE_IN = 0.8
/** a tunnel piece's neighbour running this far (m) under the lidar is a cutting */
export const ML_CUT_MIN = 0.7
/** a lid's level as tools/bake.ts takes it (LID_LEVEL_Q), and the ground held this far (m) under it */
export const ML_LID_Q = 0.1, ML_LID_UNDER = 0.15
/** under a structure, the ground takes the lowest at-grade way within ML_UNDER_REACH (the passage's floor), not the nearest */
export const ML_UNDER_LOW = process.env.ML_UNDER_LOW === '1'
/** a flight of stairs lays the ground under its own width only, no skirt (the Pont d'Iéna's right-bank flights spread the lower quai's
 *  bank into a broad grass ramp up the wall, owner 2026-11-16) */
export const ML_STEPS_NO_SKIRT = process.env.ML_STEPS_NO_SKIRT !== '0'
/** a corridor's skirt blends the ground to the open lidar beyond only where that lies within this (m) of the way */
export const ML_SKIRT_DH = Number(process.env.ML_SKIRT_DH ?? 2.0)
/** inside the drawn width of two ways, the nearer centreline sets the ground */
export const ML_ON_CENTRE = process.env.ML_ON_CENTRE === '1'
/** inside the drawn width of two ways whose half-widths differ by more than ML_NARROW_DIFF m, the narrower sets the ground */
export const ML_ON_NARROW = process.env.ML_ON_NARROW === '1', ML_NARROW_DIFF = 3
/** a stretch of a way this far over (a deck) or under (covered) the lidar it can see, after the solve (m) */
export const ML_RAISE = Number(process.env.ML_RAISE ?? 2.5)
/** a segment rising this much (m) at this grade or steeper across a wall line is a flight of stairs */
/** the ring (m) the open ground under a structure is read in */
export const ML_RING = [8, 12]
export const ML_CLIMB_DH = 2.0, ML_CLIMB_GRADE = 0.25, ML_CLIMB_DH_STEEP = 2.5, ML_CLIMB_GRADE_STEEP = 0.35
/** an elevated track never dips: each node is lifted to at least its neighbours' height less this grade × the distance */
export const ML_RAIL_GRADE = 0.04, ML_RAIL_SPIKE = 1.0, ML_RAIL_PAIR = 6
/** WALL LINES: within ML_WALL_SNAP m of a BD TOPO wall line the lidar is read ML_WALL_READ m out from the line on the cell's own side,
 *  so the ground steps AT the line (the 1 m lidar smears a 4 m wall over two posts, and the wall runs cut from the ground broke up) */
export const ML_WALL_SNAP = Number(process.env.ML_WALL_SNAP ?? 2.0), ML_WALL_READ = Number(process.env.ML_WALL_READ ?? 2.6)
/** the Laplace fill under structures: SOR iterations and factor */
export const ML_FILL_ITERS = 400, ML_FILL_SOR = 1.85
const FOOT = /^(footway|cycleway|path|pedestrian|steps|bridleway|track)$/

type XZ = { x: number; z: number }
export interface MultiLevelInput {
  edges: PackedEdge[]
  rails: PackedRail[]
  areas: PackedArea[]
  /** bridge outlines (OSM man_made=bridge), local */
  bridgeRings: XZ[][]
  /** the band: metres outside it (0 inside), and its local box */
  bandOut: (x: number, z: number) => number
  box: [number, number, number, number]
  /** the lidar MNT in bake metres, null where it has none */
  mnt: (x: number, z: number) => number | null
  /** BD TOPO's quay and retaining wall lines (construction_lineaire Quai / Mur de soutènement), local polylines */
  walls?: XZ[][]
  /** moored boats' outlines (OSM building=boat|houseboat|ship), local rings: the ground under one is the riverbed */
  boats?: XZ[][]
  /** the lids' slab outlines (tools/tunnels.ts lidSlabs): the ground under one lies under the slab */
  lids?: XZ[][]
  log: (s: string) => void
}
export interface MultiLevel {
  /** the band's ground at (x, z) given the ground there before (null: leave it) */
  groundAt(x: number, z: number, prev: number): number
  /** the band weight at (x, z): 1 inside, fading to 0 over ML_EASE */
  weight(x: number, z: number): number
}

const inRing = (r: XZ[], x: number, z: number): boolean => {
  let o = false
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) if ((r[i].z > z) !== (r[j].z > z) && x < ((r[j].x - r[i].x) * (z - r[i].z)) / (r[j].z - r[i].z) + r[i].x) o = !o
  return o
}
const segDist = (x: number, z: number, ax: number, az: number, bx: number, bz: number): { d: number; t: number } => {
  const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1e-9
  const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2))
  return { d: Math.hypot(ax + dx * t - x, az + dz * t - z), t }
}
const halfOf = (e: PackedEdge): number => (e.foot ? e.width / 2 : e.width / 2 + Math.max(e.walk ?? 0, 0.6))

/** a sparse grid of 1 m cells in ML_TILE-cell tiles, allocated where asked */
class TGrid {
  readonly tiles = new Map<number, Float32Array>()
  private key(tx: number, tz: number): number { return (tx + 32768) * 65536 + (tz + 32768) }
  ensure(tx: number, tz: number, fill = NaN): Float32Array {
    const k = this.key(tx, tz); let t = this.tiles.get(k)
    if (!t) { t = new Float32Array(ML_TILE * ML_TILE).fill(fill); this.tiles.set(k, t) }
    return t
  }
  has(tx: number, tz: number): boolean { return this.tiles.has(this.key(tx, tz)) }
  get(i: number, j: number): number {
    const tx = Math.floor(i / ML_TILE), tz = Math.floor(j / ML_TILE), t = this.tiles.get(this.key(tx, tz))
    return t ? t[(j - tz * ML_TILE) * ML_TILE + (i - tx * ML_TILE)] : NaN
  }
  set(i: number, j: number, v: number): void {
    const tx = Math.floor(i / ML_TILE), tz = Math.floor(j / ML_TILE), t = this.tiles.get(this.key(tx, tz))
    if (t) t[(j - tz * ML_TILE) * ML_TILE + (i - tx * ML_TILE)] = v
  }
  *cells(): Generator<[number, number]> {
    for (const k of this.tiles.keys()) {
      const tx = Math.floor(k / 65536) - 32768, tz = (k % 65536) - 32768
      for (let b = 0; b < ML_TILE; b++) for (let a = 0; a < ML_TILE; a++) yield [tx * ML_TILE + a, tz * ML_TILE + b]
    }
  }
  /** bilinear at a local point; NaN if any corner is unset */
  at(x: number, z: number): number {
    const fi = x / ML_CELL, fj = z / ML_CELL, i = Math.floor(fi), j = Math.floor(fj), u = fi - i, v = fj - j
    const a = this.get(i, j), b = this.get(i + 1, j), c = this.get(i, j + 1), d = this.get(i + 1, j + 1)
    if (Number.isNaN(a + b + c + d)) {
      // nearest set corner rather than nothing at the edge of the data
      const q = [[a, (1 - u) * (1 - v)], [b, u * (1 - v)], [c, (1 - u) * v], [d, u * v]].filter(([h]) => !Number.isNaN(h))
      if (!q.length) return NaN
      const w = q.reduce((s, [, k]) => s + k, 0)
      return w > 1e-6 ? q.reduce((s, [h, k]) => s + h * k, 0) / w : q[0][0]
    }
    return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v
  }
}

/** a segment index for corridors (10 m cells) */
interface CSeg { ax: number; az: number; bx: number; bz: number; ha: number; hb: number; half: number; e: PackedEdge; cut?: boolean }
class SegIndex {
  private cells = new Map<number, CSeg[]>()
  private k(gx: number, gz: number): number { return (gx + 32768) * 65536 + (gz + 32768) }
  add(s: CSeg, reach: number): void {
    const x0 = Math.floor((Math.min(s.ax, s.bx) - reach) / 10), x1 = Math.floor((Math.max(s.ax, s.bx) + reach) / 10)
    const z0 = Math.floor((Math.min(s.az, s.bz) - reach) / 10), z1 = Math.floor((Math.max(s.az, s.bz) + reach) / 10)
    for (let gx = x0; gx <= x1; gx++) for (let gz = z0; gz <= z1; gz++) { const k = this.k(gx, gz); const l = this.cells.get(k); if (l) l.push(s); else this.cells.set(k, [s]) }
  }
  near(x: number, z: number): CSeg[] { return this.cells.get(this.k(Math.floor(x / 10), Math.floor(z / 10))) ?? [] }
}

export function multiLevel(inp: MultiLevelInput): MultiLevel {
  const { edges, log } = inp
  // (full for the first ML_EASE_FULL of the ease, then fading: a linear fade from the band's edge blended the old passes' ground in
  //  close by, and a footway on the Pont National's approach still stood 1.8 m over a 30 % share of it)
  const e0 = ML_EASE * ML_EASE_FULL
  const weight = (x: number, z: number): number => { const o = inp.bandOut(x, z); return o <= e0 ? 1 : o >= ML_EASE ? 0 : 1 - (o - e0) / (ML_EASE - e0) }

  // ---- masks: the river (by outline) and the structures (bridge outlines, deck corridors)
  const rivers = inp.areas.filter((a) => a.kind === 'water' && a.river).map((a) => ({
    ring: unflat(a.ring), holes: (a.holes ?? []).map(unflat), bb: bbox(unflat(a.ring)), level: a.level ?? null,
  }))
  const riverAt = (x: number, z: number): typeof rivers[0] | undefined => rivers.find((r) => x >= r.bb[0] && x <= r.bb[2] && z >= r.bb[1] && z <= r.bb[3] && inRing(r.ring, x, z) && !r.holes.some((h) => inRing(h, x, z)))
  // (paris-centre: the Seine's outline has thousands of vertices; a point-in-polygon per 1 m cell took minutes. Each river's rows are
  //  scanned once into spans, cached by row, and a point looks up its row)
  const rowSpans = new Map<number, { r: typeof rivers[0]; xs: number[] }[]>()
  const spansAt = (j: number): { r: typeof rivers[0]; xs: number[] }[] => {
    let l = rowSpans.get(j)
    if (l) return l
    l = []
    const z = j * ML_CELL + 0.5 * ML_CELL
    for (const r of rivers) {
      if (z < r.bb[1] || z > r.bb[3]) continue
      const xs: number[] = []
      for (const ring of [r.ring, ...r.holes]) for (let a = 0, b = ring.length - 1; a < ring.length; b = a++) {
        const p = ring[a], q = ring[b]
        if ((p.z > z) !== (q.z > z)) xs.push(p.x + ((z - p.z) * (q.x - p.x)) / (q.z - p.z))
      }
      xs.sort((u, v) => u - v)
      l.push({ r, xs })
    }
    rowSpans.set(j, l)
    return l
  }
  const riverCell = (x: number, z: number): typeof rivers[0] | undefined => {
    for (const { r, xs } of spansAt(Math.floor(z / ML_CELL))) {
      let k = 0; while (k < xs.length && xs[k] <= x) k++
      if (k % 2 === 1) return r
    }
    return undefined
  }
  const riverAt0 = riverAt
  void riverAt0
  const inRiver = (x: number, z: number): boolean => !!riverCell(x, z)
  const decks = new SegIndex()
  for (const e of edges) if (e.bridge && e.heights) for (let i = 2; i < e.points.length; i += 2) decks.add({ ax: e.points[i - 2], az: e.points[i - 1], bx: e.points[i], bz: e.points[i + 1], ha: e.heights[i / 2 - 1], hb: e.heights[i / 2], half: halfOf(e) + ML_DECK_PAD, e }, halfOf(e) + ML_DECK_PAD)
  const rings = inp.bridgeRings.map((r) => ({ r, bb: bbox(r) }))
  const ringCells = new Map<number, typeof rings>()
  const RC = 20, rck = (gx: number, gz: number): number => (gx + 32768) * 65536 + (gz + 32768)
  for (const q of rings) for (let gx = Math.floor((q.bb[0] - ML_STRUCT_PAD) / RC); gx <= Math.floor((q.bb[2] + ML_STRUCT_PAD) / RC); gx++) for (let gz = Math.floor((q.bb[1] - ML_STRUCT_PAD) / RC); gz <= Math.floor((q.bb[3] + ML_STRUCT_PAD) / RC); gz++) {
    const k = rck(gx, gz), l = ringCells.get(k); if (l) l.push(q); else ringCells.set(k, [q])
  }
  const underStructure = (x: number, z: number): boolean => {
    for (const s of decks.near(x, z)) if (segDist(x, z, s.ax, s.az, s.bx, s.bz).d < s.half) return true
    for (const { r, bb } of ringCells.get(rck(Math.floor(x / RC), Math.floor(z / RC))) ?? []) if (x >= bb[0] - ML_STRUCT_PAD && x <= bb[2] + ML_STRUCT_PAD && z >= bb[1] - ML_STRUCT_PAD && z <= bb[3] + ML_STRUCT_PAD && (inRing(r, x, z) || nearRing(r, x, z) < ML_STRUCT_PAD)) return true
    return false
  }

  // A TUNNEL UNDER A BRIDGE IS A PASSAGE (owner, 2026-11-15, the Pont d'Iéna's right bank: a dark block over the lower quai, "likely
  // caused by the tunnel entrance"): OSM tags the Port Debilly's road `tunnel` for the 7 m it runs under the bridge's end, and a tunnel
  // drew its own portal and tube inside the bridge's land arch. A tunnel way ML_PASSAGE_IN of whose length lies within ML_STRUCT_PAD
  // of a bridge outline is at grade, under the bridge's arch.
  let nPass = 0
  for (const e of edges) {
    if (!e.tunnel || !e.heights || e.bridge || !anyIn(e, weight)) continue
    let inL = 0, all = 0
    for (let i = 2; i < e.points.length; i += 2) {
      const mx = (e.points[i - 2] + e.points[i]) / 2, mz = (e.points[i - 1] + e.points[i + 1]) / 2, l = Math.hypot(e.points[i] - e.points[i - 2], e.points[i + 1] - e.points[i - 1])
      all += l
      if ((ringCells.get(rck(Math.floor(mx / RC), Math.floor(mz / RC))) ?? []).some(({ r }) => inRing(r, mx, mz) || nearRing(r, mx, mz) < ML_STRUCT_PAD)) inL += l
    }
    if (all > 0 && inL / all >= ML_PASSAGE_IN) { delete e.tunnel; delete e.bore; if ((e.layer ?? 0) < 0) delete e.layer; nPass++ }
  }
  if (nPass) log(`multi-level: ${nPass} tunnels under a bridge's outline made passages at grade`)

  /** within ML_BRIDGE_NEAR m of a bridge outline */
  const nearBridge = (x: number, z: number): boolean => {
    const gx = Math.floor(x / RC), gz = Math.floor(z / RC)
    for (let a = gx - 2; a <= gx + 2; a++) for (let b = gz - 2; b <= gz + 2; b++) for (const { r, bb } of ringCells.get(rck(a, b)) ?? []) {
      if (x < bb[0] - ML_BRIDGE_NEAR || x > bb[2] + ML_BRIDGE_NEAR || z < bb[1] - ML_BRIDGE_NEAR || z > bb[3] + ML_BRIDGE_NEAR) continue
      if (inRing(r, x, z) || nearRing(r, x, z) < ML_BRIDGE_NEAR) return true
    }
    return false
  }
  /** inside a lid's outline (ML_UNDER_MNT_DH stands down there) */
  const lidBoxes = (inp.lids ?? []).map((r) => ({ r, bb: bbox(r) }))
  const inLid = (x: number, z: number): boolean => lidBoxes.some(({ r, bb }) => x >= bb[0] && x <= bb[2] && z >= bb[1] && z <= bb[3] && inRing(r, x, z))
  /** river within r m (eight directions, every 10 m): ML_UNDER_MNT_RIVER */
  const nearWater = (x: number, z: number, r: number): boolean => {
    if (riverCell(x, z)) return true
    for (let d = 10; d <= r; d += 10) for (let a = 0; a < 8; a++) if (riverCell(x + Math.cos(a * Math.PI / 4) * d, z + Math.sin(a * Math.PI / 4) * d)) return true
    return false
  }
  /** more than ML_BANK m from the river outline's edge, along the axes */
  const offBank = (x: number, z: number): boolean => !!riverCell(x + ML_BANK, z) && !!riverCell(x - ML_BANK, z) && !!riverCell(x, z + ML_BANK) && !!riverCell(x, z - ML_BANK)
  let nGhost = 0

  // ---- 1. densify the band's at-grade ways, then one height solve
  let added = 0
  for (const e of edges) {
    if (!e.heights || e.bridge || e.tunnel || e.bore) continue
    if (!anyIn(e, weight)) continue
    const pts: number[] = [e.points[0], e.points[1]], hs: number[] = [e.heights[0]]
    for (let i = 2; i < e.points.length; i += 2) {
      const ax = e.points[i - 2], az = e.points[i - 1], bx = e.points[i], bz = e.points[i + 1], L = Math.hypot(bx - ax, bz - az)
      const n = Math.floor(L / ML_DENSIFY)
      for (let k = 1; k < n + 1 && L > ML_DENSIFY * 1.5; k++) {
        const t = k / (n + 1); pts.push(ax + (bx - ax) * t, az + (bz - az) * t); hs.push(e.heights[i / 2 - 1] + (e.heights[i / 2] - e.heights[i / 2 - 1]) * t); added++
      }
      pts.push(bx, bz); hs.push(e.heights[i / 2])
    }
    if (hs.length !== e.heights.length) { e.points = pts as unknown as PackedEdge['points']; e.heights = hs }
  }
  // bridge ways on one structure share its deck (an OSM sidewalk mapped 1 m under its roadway hung inside the arch)
  let shared = 0
  for (const e of edges) {
    if (!e.bridge || !e.heights || e.kind === 'steps' || !anyIn(e, weight)) continue
    for (let i = 0; i < e.heights.length; i++) {
      const x = e.points[2 * i], z = e.points[2 * i + 1]; let top = e.heights[i]
      for (const s of decks.near(x, z)) {
        if (s.e === e || s.e.kind === 'steps' || (s.e.layer ?? 0) !== (e.layer ?? 0)) continue
        const q = segDist(x, z, s.ax, s.az, s.bx, s.bz); if (q.d > ML_DECK_SHARE) continue
        const h = s.ha + (s.hb - s.ha) * q.t; if (h > top && h - e.heights[i] < ML_DECK_DH) top = h
      }
      if (top > e.heights[i] + 0.05) { e.heights[i] = Math.round(top * 100) / 100; shared++ }
    }
  }
  // unknowns: one per distinct position (0.1 m) among the band's ways
  const varOf = new Map<string, number>(), vx: number[] = [], vz: number[] = []
  const D: number[] = [], B: number[] = [] // diagonal (observations) and right-hand side
  const nb: Map<number, number>[] = [] // membrane couplings: neighbour → weight
  const keyOf = (x: number, z: number): string => `${Math.round(x * 10)},${Math.round(z * 10)}`
  // (a position two ways share is one unknown only if their heights coming in are within ML_SEP: OSM shares a node between the Pont
  //  d'Iéna's service deck and the lower-quai road 8 m under it, and one unknown pulled the deck down and the road up to meet)
  const levels = new Map<string, { v: number; h: number }[]>()
  const vOf = (x: number, z: number, h = 0): number => {
    const k = keyOf(x, z), l = levels.get(k) ?? levels.set(k, []).get(k)!
    const hit = l.find((q) => Math.abs(q.h - h) < ML_SEP)
    if (hit) return hit.v
    const v = vx.length; l.push({ v, h }); varOf.set(k, v); vx.push(x); vz.push(z); D.push(0); B.push(0); nb.push(new Map())
    return v
  }
  const obs = (v: number, h: number, w: number): void => { D[v] += w; B[v] += w * h }
  const solveEdges = edges.filter((e) => e.heights && anyIn(e, weight))
  {
    const ends = new Map<number, { e: PackedEdge; b: boolean; h: number }[]>()
    const bored = new Set<number>()
    for (const e of edges) if (e.bore || (e.tunnel && onSurface(e))) { bored.add(e.a); bored.add(e.b) }
    for (const e of solveEdges) for (const b of [false, true]) {
      const v = b ? e.b : e.a
      if (v < ML_GAP0 || v >= ML_GAP1) continue
      const l = ends.get(v) ?? ends.set(v, []).get(v)!
      l.push({ e, b, h: b ? e.heights![e.heights!.length - 1] : e.heights![0] })
    }
    let nGap = 0, node = ML_GAP_NODE0
    if (process.env.ML_GAP_UNDO !== '0') for (const l of ends.values()) {
      if (l.length < 2) continue
      // the joined way: the one whose other end a ridden tunnel continues (not every way there: then the join split a tunnel's own way)
      const climbs = (q: typeof l[0]): boolean => {
        // (…turning BACK: the way ran down toward its end and the join climbs back up, or the reverse. A footway that drops 5.8 m from the
        //  Garigliano's footbridge in 5 m, joined at its top to the deck, is a stair mapped as a footway, and its join is good)
        const P = q.e.points, n = P.length / 2
        if (n < 3) return false
        const i = q.b ? n - 1 : 0, j = q.b ? n - 2 : 1, k = q.b ? n - 3 : 2
        const mi = inp.mnt(P[2 * i], P[2 * i + 1]), mj = inp.mnt(P[2 * j], P[2 * j + 1]), mk = inp.mnt(P[2 * k], P[2 * k + 1])
        if (mi === null || mj === null || mk === null) return false
        const L = Math.hypot(P[2 * i] - P[2 * j], P[2 * i + 1] - P[2 * j + 1]) || 1, jump = mi - mj, trend = mj - mk
        return Math.abs(jump) > ML_GAP_LIDAR_DH && Math.abs(jump) / L > ML_GAP_LIDAR_GRADE && Math.abs(trend) > 0.5 && Math.sign(jump) !== Math.sign(trend)
      }
      const joined = l.filter((q) => bored.has(q.b ? q.e.a : q.e.b) || climbs(q))
      if (!joined.length || joined.length === l.length) continue
      for (const q of joined) {
        // (a join up a lidar step: its last vertex IS the extension gaps.ts added, climbing to the other way — dropped, so the way ends
        //  where it did; nudging it back left the Arcole flight's foot 7 m up)
        if (!bored.has(q.b ? q.e.a : q.e.b) && Array.isArray(q.e.points) && q.e.points.length >= 6 && q.e.heights) {
          const n0 = q.e.points.length / 2
          if (q.b) { q.e.points.splice(2 * n0 - 2, 2); q.e.heights.splice(n0 - 1, 1); q.e.b = node++ }
          else { q.e.points.splice(0, 2); q.e.heights.splice(0, 1); q.e.a = node++ }
          nGap++; continue
        }
        const P = q.e.points, n = P.length / 2, i = q.b ? n - 1 : 0, j = q.b ? n - 2 : 1
        const dx = P[2 * j] - P[2 * i], dz = P[2 * j + 1] - P[2 * i + 1], L = Math.hypot(dx, dz), t = Math.min(ML_GAP_BACK, L * 0.3) / (L || 1)
        P[2 * i] += dx * t; P[2 * i + 1] += dz * t
        if (q.b) q.e.b = node++; else q.e.a = node++
        nGap++
      }
    }
    if (nGap) log(`multi-level: ${nGap} near-miss joins from a ridden tunnel's mouth or up a lidar step undone`)
  }
  // the positions where a deck meets a street (an end shared with a way that is not a bridge)
  const streetEnds = new Set<string>()
  for (const e of solveEdges) if (!e.bridge) { streetEnds.add(keyOf(e.points[0], e.points[1])); streetEnds.add(keyOf(e.points[e.points.length - 2], e.points[e.points.length - 1])) }
  // LAYERED CROSSINGS: where two ways cross with no shared node and OSM puts them on different layers, the lidar there sees the upper
  // one (an embankment is earth): the lower way's vertices within ML_UNDER_CROSS m (plus the upper's half-width) of the crossing take
  // no lidar pull. The Allée Paris-Ivry runs through the raised Bd Jean Simon's embankment and was pulled 6 m up onto it.
  const underCross = new Set<string>()
  {
    const ix = new SegIndex()
    for (const e of solveEdges) if (e.heights) for (let i = 2; i < e.points.length; i += 2) ix.add({ ax: e.points[i - 2], az: e.points[i - 1], bx: e.points[i], bz: e.points[i + 1], ha: 0, hb: 0, half: i / 2, e }, 0)
    for (const u of solveEdges) for (let i = 2; i < u.points.length; i += 2) {
      const ax = u.points[i - 2], az = u.points[i - 1], bx = u.points[i], bz = u.points[i + 1]
      for (const l of new Set([...ix.near(ax, az), ...ix.near(bx, bz)])) {
        const lu = u.layer ?? 0, ll = l.e.layer ?? 0
        if (l.e === u || lu <= ll || u.a === l.e.a || u.a === l.e.b || u.b === l.e.a || u.b === l.e.b) continue
        const rx = bx - ax, rz = bz - az, sx = l.bx - l.ax, sz = l.bz - l.az, den = rx * sz - rz * sx
        if (Math.abs(den) < 1e-9) continue
        const t = ((l.ax - ax) * sz - (l.az - az) * sx) / den, w = ((l.ax - ax) * rz - (l.az - az) * rx) / den
        if (t < 0 || t > 1 || w < 0 || w > 1) continue
        const cx = ax + rx * t, cz = az + rz * t, reach = halfOf(u) + ML_UNDER_CROSS
        const lo = l.e
        for (let k = 0; k < lo.heights!.length; k++) if (Math.hypot(lo.points[2 * k] - cx, lo.points[2 * k + 1] - cz) < reach) underCross.add(`${lo.id}:${k}`)
      }
    }
  }
  const cnt = { mnt: 0, keep: 0, hold: 0, covered: 0, foot: 0, blind: 0 }
  const idx: number[][] = []
  const links: [number, number, number, number][] = []
  for (const e of solveEdges) {
    const n = e.heights!.length, ids: number[] = []
    const len = (i: number): number => {
      const a = i > 0 ? Math.hypot(e.points[2 * i] - e.points[2 * i - 2], e.points[2 * i + 1] - e.points[2 * i - 1]) : 0
      const b = i < n - 1 ? Math.hypot(e.points[2 * i + 2] - e.points[2 * i], e.points[2 * i + 3] - e.points[2 * i + 1]) : 0
      return Math.max(0.5, (a + b) / 2)
    }
    const hold = !!(e.bridge || ((e.tunnel || e.bore || e.lid) && !e.foot)), cut = !!(e.cut || e.trench)
    // along-way distance from each vertex to a deck end that meets a street
    const endD = new Array(n).fill(Infinity)
    if (e.bridge) {
      const cumE = [0]; for (let i = 1; i < n; i++) cumE.push(cumE[i - 1] + Math.hypot(e.points[2 * i] - e.points[2 * i - 2], e.points[2 * i + 1] - e.points[2 * i - 1]))
      const a0 = streetEnds.has(keyOf(e.points[0], e.points[1])), b0 = streetEnds.has(keyOf(e.points[2 * n - 2], e.points[2 * n - 1]))
      for (let i = 0; i < n; i++) endD[i] = Math.min(a0 ? cumE[i] : Infinity, b0 ? cumE[n - 1] - cumE[i] : Infinity)
    }
    for (let i = 0; i < n; i++) {
      const x = e.points[2 * i], z = e.points[2 * i + 1], h = e.heights![i], v = vOf(x, z, h), w = weight(x, z), L = len(i)
      ids.push(v)
      if (w <= 0) { obs(v, h, 1e4); continue }
      if (hold) {
        const f = Math.min(1, endD[i] / ML_DECK_END)
        obs(v, h, ML_W_HOLD * Math.max(ML_DECK_END_MIN, f * f) * L); cnt.hold++
        // (no pull to the lidar under a deck: IGN's MNT is the bare earth beneath it, and pulled the Pont au Change's end down 2.6 m)
        continue
      }
      if (cut) { obs(v, h, ML_W_CUT * L); cnt.hold++; continue }
      obs(v, h, ML_W_PRIOR * L)
      // under a bridge the lidar is blind and the way's old height is a guess (a lower-quai road humped 5.7 m under the Pont d'Iéna,
      // matched to the deck): only the weak prior, the level coming from either side along the way
      // (a flight of stairs at grade lies on the ground the lidar sees — under a bridge's outline too, beside its abutment — however far its
      //  incoming height is off: a flight down to the port by the Pont d'Arcole came in level at the upper quai, a near-miss join having
      //  tied its foot up there, and stood 8 m over the port)
      const stairOn = e.kind === 'steps' && !e.tunnel && (e.layer ?? 0) === 0
      if (!stairOn && (underStructure(x, z) || underCross.has(`${e.id}:${i}`))) { cnt.blind++; continue }
      const m = inp.mnt(x, z), rv = riverCell(x, z)
      const seen = m !== null && (!rv || (rv.level !== null && m > rv.level + ML_RIVER_LAND))
      const footUnder = FOOT.test(e.kind) && (e.tunnel || (e.layer ?? 0) < 0)
      // (asymmetric: a way under the lidar is pulled up within ML_TRUST — the band sank the Cygnes quai; one over it only within
      //  ML_TRUST_UP — the bare earth may be under a structure: at the Châtelet end of the Pont au Change the lidar read the tunnel
      //  mouth 2.5 m under the street, and pulled the street and the deck's end down with it)
      // (…down to the water too: a quay stair's foot is in the river's outline, where the lidar reads the surface)
      if ((seen && ((m! - h < ML_TRUST && h - m! < ML_TRUST_UP) || footUnder)) || (stairOn && m !== null)) { obs(v, m!, ML_W_MNT * L); cnt.mnt++; if (footUnder) cnt.foot++ }
      // (a way well under the lidar is covered, its height BD TOPO's: held; one well over it is more often a band error than a deck)
      else { obs(v, h, (seen && m! > h ? ML_W_KEEP : ML_W_KEEP_OVER) * L); cnt.keep++; if (seen) cnt.covered++ }
    }
    // the membrane: λ/d between consecutive vertices (λ = ML_SMOOTH² × the lidar weight); steps bend freely
    const lam = (e.kind === 'steps' ? 0.05 : 1) * ML_SMOOTH * ML_SMOOTH * ML_W_MNT
    for (let i = 1; i < n; i++) {
      const a = ids[i - 1], b = ids[i]; if (a === b) continue
      const d = Math.max(0.3, Math.hypot(e.points[2 * i] - e.points[2 * i - 2], e.points[2 * i + 1] - e.points[2 * i - 1])), k = lam / d
      nb[a].set(b, (nb[a].get(b) ?? 0) + k); nb[b].set(a, (nb[b].get(a) ?? 0) + k)
      if (e.kind !== 'steps') links.push([a, b, d, k])
    }
    idx.push(ids)
  }
  const nv = vx.length, h0 = new Float64Array(nv)
  for (let v = 0; v < nv; v++) h0[v] = D[v] > 0 ? B[v] / D[v] : 0
  const dbgPts = process.env.ML_DEBUG ? process.env.ML_DEBUG.split(';').map((q) => q.split(',').map(Number)) : []
  const dbgV = (tag: string, h: Float64Array | null): void => { for (const [qx, qz] of dbgPts) for (let v = 0; v < nv; v++) if (Math.hypot(vx[v] - qx, vz[v] - qz) < 4) log(`ML_DEBUG ${tag} v${v} @${vx[v].toFixed(1)},${vz[v].toFixed(1)} obs ${(D[v] > 0 ? B[v] / D[v] : NaN).toFixed(2)} w ${D[v].toFixed(2)} links ${[...nb[v]].map(([j, k]) => `${j}:${k.toFixed(0)}`).join(' ')}${h ? ' sol ' + h[v].toFixed(2) : ''}`) }
  let sol = cg(nv, D, B, nb, h0, 2000, 1e-6), stiff = 0
  dbgV('first', sol)
  for (let it = 0; it < ML_GRADE_ITERS; it++) {
    let more = 0
    // (from each link's own weight every pass, never compounding: ×9 five times over made a ramp into the Voie Georges-Pompidou
    //  tunnel rigid, and it dragged the Pont au Change's Châtelet end down 2.6 m)
    for (const [a, b, d, k0] of links) {
      const g = Math.abs(sol[a] - sol[b]) / d
      if (g <= ML_GRADE_MAX) continue
      const cur = nb[a].get(b) ?? 0, k = Math.max(cur, k0 * Math.min(9, (g / ML_GRADE_MAX) ** 2))
      if (k <= cur * 1.01) continue
      const dk = k - cur
      nb[a].set(b, cur + dk); nb[b].set(a, (nb[b].get(a) ?? 0) + dk); more++
    }
    if (!more) break
    stiff += more
    sol = cg(nv, D, B, nb, sol, 2000, 1e-6)
  }
  dbgV('stiffened', sol)
  let moved = 0, maxMove = 0
  solveEdges.forEach((e, k) => {
    const ids = idx[k]
    for (let i = 0; i < ids.length; i++) {
      const x = e.points[2 * i], z = e.points[2 * i + 1], w = weight(x, z); if (w <= 0) continue
      const y = Math.round((e.heights![i] + (sol[ids[i]] - e.heights![i]) * w) * 100) / 100
      if (Math.abs(y - e.heights![i]) > 0.02) { moved++; maxMove = Math.max(maxMove, Math.abs(y - e.heights![i])) }
      e.heights![i] = y
    }
  })
  // a flight of stairs runs one way: straight from end to end (Grenelle's dipped 0.9 m in the middle, off the lidar, and drew as a V)
  let flat = 0
  for (const e of solveEdges) {
    if (e.kind !== 'steps' || e.bridge || !e.heights || e.heights.length < 3) continue
    const n = e.heights.length, c = [0]
    for (let i = 1; i < n; i++) c.push(c[i - 1] + Math.hypot(e.points[2 * i] - e.points[2 * i - 2], e.points[2 * i + 1] - e.points[2 * i - 1]))
    for (let i = 1; i < n - 1; i++) {
      if (weight(e.points[2 * i], e.points[2 * i + 1]) <= 0) continue
      e.heights[i] = Math.round((e.heights[0] + (e.heights[n - 1] - e.heights[0]) * c[i] / (c[n - 1] || 1)) * 100) / 100; flat++
    }
  }
  log(`multi-level: ${flat} stair vertices laid straight; ${stiff} steep links stiffened; ${shared} deck vertices raised to their structure's deck; ${solveEdges.length} ways, ${nv} unknowns (${added} vertices added); lidar-pulled ${cnt.mnt} (foot tunnels ${cnt.foot}), held ${cnt.hold}, blind under structures ${cnt.blind}, kept ${cnt.keep} (of them seen but > ${ML_TRUST} m off: ${cnt.covered}); ${moved} vertices moved, max ${maxMove.toFixed(1)} m`)

  const freeSteps = new Set<PackedEdge>()
  /** the cuttings made at covered pieces' approaches (no trench pad) */
  const approaches = new Set<PackedEdge>()
  /** the open ground near a point under a structure: the median lidar at ML_RING radii round it, outside structures and the river */
  const ringGround = (x: number, z: number): number | null => {
    const v: number[] = []
    for (const r of ML_RING) for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2, px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r
      if (underStructure(px, pz) || riverCell(px, pz)) continue
      const m = inp.mnt(px, pz); if (m !== null) v.push(m)
    }
    if (v.length < 4) return null
    v.sort((p, q) => p - q); return v[Math.floor(v.length / 2)]
  }
  // ---- 1b. grade separation: the upper of two crossing ways is a deck where it passes over the lower
  {
    const surf = edges.filter((e) => e.heights && !e.bridge && !e.tunnel && !e.bore && !e.authored && anyIn(e, weight))
    const cum = new Map<PackedEdge, number[]>()
    const segs = new SegIndex()
    for (const e of surf) {
      const c = [0]; for (let i = 2; i < e.points.length; i += 2) c.push(c[c.length - 1] + Math.hypot(e.points[i] - e.points[i - 2], e.points[i + 1] - e.points[i - 1]))
      cum.set(e, c)
      for (let i = 2; i < e.points.length; i += 2) segs.add({ ax: e.points[i - 2], az: e.points[i - 1], bx: e.points[i], bz: e.points[i + 1], ha: e.heights![i / 2 - 1], hb: e.heights![i / 2], half: i / 2, e }, 0)
    }
    const ends = (e: PackedEdge): string[] => [keyOf(e.points[0], e.points[1]), keyOf(e.points[e.points.length - 2], e.points[e.points.length - 1])]
    const spans = new Map<PackedEdge, [number, number][]>()
    const seen = new Set<string>()
    let nOver = 0
    for (const u of surf) {
      const cu = cum.get(u)!, eu = ends(u)
      for (let i = 2; i < u.points.length; i += 2) {
        const ax = u.points[i - 2], az = u.points[i - 1], bx = u.points[i], bz = u.points[i + 1]
        const cand = new Set([...segs.near(ax, az), ...segs.near(bx, bz), ...segs.near((ax + bx) / 2, (az + bz) / 2)])
        for (const l of cand) {
          if (l.e === u || u.a === l.e.a || u.a === l.e.b || u.b === l.e.a || u.b === l.e.b) continue
          if (ends(l.e).some((k) => eu.includes(k))) continue
          const rx = bx - ax, rz = bz - az, sx = l.bx - l.ax, sz = l.bz - l.az, den = rx * sz - rz * sx
          const k = `${u.id}:${i}:${l.e.id}:${l.half}`; if (seen.has(k)) continue; seen.add(k)
          // OVER A CORRIDOR (2026-11-15, the Pont Neuf's right-bank deck end): a stretch of the upper way inside the lower one's corridor
          // by ML_SEP or more is deck too, crossing or not — footways run on from the deck end 7 m over the lower quai road without
          // crossing its centre line, and their corridors and its corridor fought over one ground (the road drawn jumping up to them)
          {
            const L = Math.hypot(rx, rz), nS = Math.max(1, Math.ceil(L)), reachO = halfOf(l.e) + halfOf(u) * 0.5
            for (let q = 0; q <= nS; q++) {
              const tq = q / nS, px = ax + rx * tq, pz = az + rz * tq, d = segDist(px, pz, l.ax, l.az, l.bx, l.bz)
              if (d.d >= reachO) continue
              const hu = u.heights![i / 2 - 1] + (u.heights![i / 2] - u.heights![i / 2 - 1]) * tq, hl = l.ha + (l.hb - l.ha) * d.t
              if (hu - hl < ML_SEP) continue
              const su = cu[i / 2 - 1] + tq * L, Lu = cu[cu.length - 1]
              ;(spans.get(u) ?? spans.set(u, []).get(u)!).push([Math.max(0, su - ML_SEP_PAD), Math.min(Lu, su + ML_SEP_PAD)]); nOver++
            }
          }
          if (Math.abs(den) < 1e-9) continue
          const t = ((l.ax - ax) * sz - (l.az - az) * sx) / den, w = ((l.ax - ax) * rz - (l.az - az) * rx) / den
          if (t < 0 || t > 1 || w < 0 || w > 1) continue
          const hu = u.heights![i / 2 - 1] + (u.heights![i / 2] - u.heights![i / 2 - 1]) * t, hl = l.ha + (l.hb - l.ha) * w
          if (hu - hl < ML_SEP) continue
          // the deck: over the lower way's corridor and ML_SEP_PAD each side, measured along the upper way at the crossing angle
          const sin = Math.abs(den) / (Math.hypot(rx, rz) * Math.hypot(sx, sz) || 1), reach = (halfOf(l.e) + ML_SEP_PAD) / Math.max(0.3, sin)
          const su = cu[i / 2 - 1] + t * Math.hypot(rx, rz), L = cu[cu.length - 1]
          ;(spans.get(u) ?? spans.set(u, []).get(u)!).push([Math.max(0, su - reach), Math.min(L, su + reach)])
        }
      }
    }
    // HEIGHT SPANS: a stretch standing ML_RAISE m over the lidar it can see is a deck; one ML_RAISE m under it is covered (a tunnel
    // piece: it no longer cuts the ground) — Garigliano's layer −2 passages had carved 5 m holes, a footbridge OSM calls a footway stood
    // 7 m over the ground on nothing
    const tun = new Map<PackedEdge, [number, number][]>()
    let nRaise = 0, nSink = 0
    for (const u of surf) {
      if (u.cut || u.trench || u.lid) continue
      const cu = cum.get(u)!, n = u.heights!.length
      const r0 = [...Array(n).keys()].map((i) => {
        const x = u.points[2 * i], z = u.points[2 * i + 1]
        if (weight(x, z) <= 0) return null
        // (under a structure the lidar is the deck: the open ground is the MEDIAN of the lidar in a ring round the vertex, outside every
        //  structure and the river — the Passerelle Debilly's stairs stood 5 m over the port, never cut as decks, and pulled the ground
        //  up after them into a torn mound)
        if (underStructure(x, z)) { const g = ringGround(x, z); return g === null ? null : u.heights![i] - g }
        const m = inp.mnt(x, z), rv = riverCell(x, z); if (m === null || (rv && (rv.level === null || m <= rv.level + ML_RIVER_LAND))) return null
        return u.heights![i] - m
      })
      // (…but a way under a bridge's outline is never COVERED there: the bridge covers it, and the ring round a bridgehead is mostly the
      //  upper quai — the Port Debilly's road under the Pont d'Iéna's end was cut as a 7 m tunnel, and drew a portal in the land arch)
      const rUnder = r0.map((v, i) => (underStructure(u.points[2 * i], u.points[2 * i + 1]) ? null : v))
      for (const [sign, into] of [[1, spans], [-1, tun]] as const) {
        const r = sign > 0 ? r0 : rUnder
        // (OSM's layer says which side a way is on: a layer 1 cycleway on a raised boulevard was chopped into 2 m "covered" pieces)
        if ((sign < 0 && (u.layer ?? 0) > 0) || (sign > 0 && (u.layer ?? 0) < 0)) continue
        let i = 0
        while (i < n) {
          if (r[i] === null || sign * r[i]! <= ML_RAISE) { i++; continue }
          // (a raised stretch runs on through vertices the lidar cannot see — under the deck it joins — but never starts at one)
          let j = i; while (j + 1 < n && (sign > 0 ? r[j + 1] === null || r[j + 1]! > ML_RAISE : r[j + 1] !== null && -r[j + 1]! > ML_RAISE)) j++
          while (j > i && r[j] === null) j--
          const s0 = Math.max(0, cu[i] - 2), s1 = Math.min(cu[n - 1], cu[j] + 2), whole = i === 0 && j === n - 1
          // (a raised flight of stairs stays stairs, standing free: it is kept out of the ground's corridors, not made a deck)
          if (sign > 0 && u.kind === 'steps') { freeSteps.add(u); i = j + 1; continue }
          if (s1 - s0 >= (sign > 0 ? 3 : 6) || (sign > 0 && whole)) { (into.get(u) ?? into.set(u, []).get(u)!).push([s0, s1]); if (sign > 0) nRaise++; else nSink++ }
          i = j + 1
        }
      }
    }
    // a way the lidar sees nowhere (all under structures) whose both ends are on decks, standing over the ground there, is deck too
    const deckEnds = new Set<string>()
    for (const e of edges) if (e.bridge) { deckEnds.add(keyOf(e.points[0], e.points[1])); deckEnds.add(keyOf(e.points[e.points.length - 2], e.points[e.points.length - 1])) }
    for (const u of surf) {
      if (spans.has(u) || u.cut || u.trench || u.lid) continue
      const n = u.heights!.length, P = u.points
      if (!deckEnds.has(keyOf(P[0], P[1])) || !deckEnds.has(keyOf(P[2 * n - 2], P[2 * n - 1]))) continue
      if (![...Array(n).keys()].every((i) => { const x = P[2 * i], z = P[2 * i + 1]; if (underStructure(x, z)) return true; const m = inp.mnt(x, z); return m === null || u.heights![i] - m > ML_RAISE / 2 })) continue
      const c = cum.get(u)!; (spans.get(u) ?? spans.set(u, []).get(u)!).push([0, c[c.length - 1]]); nRaise++
    }
    // WALL CLIMBS (2026-11-15, the Allée Paris-Ivry): a segment that rises ML_CLIMB_DH m or more at ML_CLIMB_GRADE or steeper while
    // crossing a BD TOPO wall line goes up a retaining wall — OSM joins a lane on an embankment to the quai below it. No street does
    // that; a flight of stairs does. The segment becomes `steps` (drawn as a flight, not ridden by bikes).
    const stair = new Map<PackedEdge, [number, number][]>()
    let nClimb = 0
    {
      const wl = new SegIndex()
      for (const w of inp.walls ?? []) for (let i = 1; i < w.length; i++) wl.add({ ax: w[i - 1].x, az: w[i - 1].z, bx: w[i].x, bz: w[i].z, ha: 0, hb: 0, half: 0, e: null as unknown as PackedEdge }, 0)
      for (const u of surf) {
        if (u.kind === 'steps' || u.cut || u.trench || u.lid) continue
        const cu = cum.get(u)!
        for (let i = 2; i < u.points.length; i += 2) {
          const ax = u.points[i - 2], az = u.points[i - 1], bx = u.points[i], bz = u.points[i + 1], L = Math.hypot(bx - ax, bz - az)
          const dh = Math.abs(u.heights![i / 2] - u.heights![i / 2 - 1])
          if (dh < ML_CLIMB_DH || dh / Math.max(L, 0.5) < ML_CLIMB_GRADE) continue
          const crosses = [...new Set([...wl.near(ax, az), ...wl.near(bx, bz), ...wl.near((ax + bx) / 2, (az + bz) / 2)])].some((w) => {
            const rx = bx - ax, rz = bz - az, sx = w.bx - w.ax, sz = w.bz - w.az, den = rx * sz - rz * sx
            if (Math.abs(den) < 1e-9) return false
            const t = ((w.ax - ax) * sz - (w.az - az) * sx) / den, v = ((w.ax - ax) * rz - (w.az - az) * rx) / den
            return t >= -0.1 && t <= 1.1 && v >= 0 && v <= 1
          })
          // (…or climbs ML_CLIMB_DH_STEEP at ML_CLIMB_GRADE_STEEP with no wall mapped: no street rises 2.5 m at 35 %)
          if (!crosses && !(dh >= ML_CLIMB_DH_STEEP && dh / Math.max(L, 0.5) >= ML_CLIMB_GRADE_STEEP)) continue
          ;(stair.get(u) ?? stair.set(u, []).get(u)!).push([cu[i / 2 - 1], cu[i / 2]]); nClimb++
        }
      }
    }
    let nextNode = ML_NODE0, nextId = edges.reduce((m, e) => Math.max(m, e.id), 0) + 1, made = 0, madeT = 0, nCutApproach = 0
    approaches.clear()
    const named: string[] = []
    for (const e of new Set([...spans.keys(), ...tun.keys(), ...stair.keys()])) {
      const merge = (list: [number, number][]): [number, number][] => {
        list.sort((a, b) => a[0] - b[0]); const out: [number, number][] = []
        for (const sp of list) { const m = out.at(-1); if (m && sp[0] <= m[1] + ML_SEP_MERGE) m[1] = Math.max(m[1], sp[1]); else out.push([...sp]) }
        return out
      }
      const merged = merge(spans.get(e) ?? [])
      // covered stretches, less any deck: a deck wins where both claim
      const mergedT = merge(tun.get(e) ?? []).filter(([a, b]) => !merged.some(([c, d]) => a < d && b > c))
      const c = cum.get(e)!, L = c[c.length - 1]
      const at = (sv: number): { x: number; z: number; h: number } => {
        let i = 1; while (i < c.length - 1 && c[i] < sv) i++
        const t = Math.max(0, Math.min(1, (sv - c[i - 1]) / ((c[i] - c[i - 1]) || 1)))
        return { x: e.points[2 * i - 2] + (e.points[2 * i] - e.points[2 * i - 2]) * t, z: e.points[2 * i - 1] + (e.points[2 * i + 1] - e.points[2 * i - 1]) * t, h: e.heights![i - 1] + (e.heights![i] - e.heights![i - 1]) * t }
      }
      type K = '' | 'bridge' | 'tunnel' | 'steps'
      const mergedS = (stair.get(e) ?? []).filter(([a, b]) => !merged.some(([c, d]) => a < d && b > c) && !mergedT.some(([c, d]) => a < d && b > c))
      const all = [...merged.map(([a, b]) => [a, b, 'bridge'] as const), ...mergedT.map(([a, b]) => [a, b, 'tunnel'] as const), ...mergedS.map(([a, b]) => [a, b, 'steps'] as const)].sort((p, q) => p[0] - q[0])
      const cuts: { s: number; kind: K }[] = []
      for (const [s0, s1, k] of all) { const snap = k === 'steps' ? 0.01 : 3; cuts.push({ s: s0 < snap ? 0 : s0, kind: k }, { s: s1 > L - snap ? L : s1, kind: '' }) }
      const pieces: { from: number; to: number; kind: K }[] = []
      let a0 = 0, br: K = ''
      for (const q of cuts) { if (q.s > a0 + 0.01) pieces.push({ from: a0, to: q.s, kind: br }); a0 = Math.max(a0, q.s); br = q.kind }
      if (L > a0 + 0.01) pieces.push({ from: a0, to: L, kind: br })
      const out: PackedEdge[] = []
      let nodeA = e.a
      for (let k = 0; k < pieces.length; k++) {
        const { from, to, kind } = pieces[k], bridge = kind === 'bridge'
        const pts: number[] = [], hs: number[] = []
        const p0 = at(from), p1 = at(to)
        pts.push(p0.x, p0.z); hs.push(p0.h)
        for (let i = 0; i < c.length; i++) if (c[i] > from + 0.01 && c[i] < to - 0.01) { pts.push(e.points[2 * i], e.points[2 * i + 1]); hs.push(bridge ? p0.h + (p1.h - p0.h) * (c[i] - from) / (to - from || 1) : e.heights![i]) }
        pts.push(p1.x, p1.z); hs.push(p1.h)
        const nodeB = k === pieces.length - 1 ? e.b : nextNode++
        const piece: PackedEdge = { ...e, id: k === 0 ? e.id : nextId++, a: nodeA, b: nodeB, points: pts as unknown as PackedEdge['points'], heights: hs }
        if (bridge) { piece.bridge = true; piece.layer = Math.max(1, e.layer ?? 0); delete piece.ramp; delete piece.cut; delete piece.trench; made++ }
        // (a covered piece of a way that was ridden stays ridden: `tunnel` alone takes a way off the surface and out of the ride graph
        //  (package.ts onSurface); `bore` keeps it, drawn as a tunnel — render/tunnels.ts)
        if (kind === 'tunnel') { const ridden = onSurface(e); piece.tunnel = true; if (ridden) piece.bore = true; piece.layer = Math.min(-1, e.layer ?? 0); delete piece.ramp; delete piece.cut; delete piece.trench; madeT++ }
        if (kind === 'steps') { piece.kind = 'steps'; piece.foot = true; piece.width = Math.min(piece.width, 3); piece.walk = 0; delete piece.ramp; delete piece.oneway }
        out.push(piece); nodeA = nodeB
      }
      // A COVERED PIECE'S APPROACH IS A CUTTING: next to a tunnel piece, a stretch that runs ML_CUT_MIN m or more under the lidar (short
      // of ML_RAISE, where a covered piece starts) is `cut` — the ground follows it down, no skirt. The Pont National's bike ramp went
      // under the railway embankment and lay a metre under the ground on its way in.
      for (let k = 0; k < out.length; k++) {
        const pc = out[k]
        if (pc.tunnel || pc.bridge || pc.cut || pc.kind === 'steps' || !pc.heights) continue
        if (!(out[k - 1]?.tunnel || out[k + 1]?.tunnel)) continue
        let deep = 0
        for (let i = 0; i < pc.heights.length; i++) { const m = inp.mnt(pc.points[2 * i], pc.points[2 * i + 1]); if (m !== null) deep = Math.max(deep, m - pc.heights[i]) }
        if (deep >= ML_CUT_MIN) { pc.cut = true; approaches.add(pc); nCutApproach++ }
      }
      if (out.length > 1 || out[0]?.bridge || out[0]?.tunnel || out[0]?.kind === 'steps') {
        edges.splice(edges.indexOf(e), 1, ...out)
        const si = solveEdges.indexOf(e); if (si >= 0) solveEdges.splice(si, 1, ...out)
        if (e.name && !named.includes(e.name)) named.push(e.name)
      }
    }
    log(`multi-level grade separation: ${made} decks (${nRaise} of them stretches ${ML_RAISE} m+ over the lidar) and ${madeT} covered pieces (${nSink} stretches ${ML_RAISE} m+ under it) cut out of ${new Set([...spans.keys(), ...tun.keys()]).size} ways, ${nClimb} wall climbs made stairs, ${nCutApproach} tunnel approaches made cuttings, ${freeSteps.size} raised flights left standing free, ${nOver} samples over a lower corridor (${named.slice(0, 6).join(', ')})`)
    // the new decks hold the lidar off the ground under them too
    for (const e of edges) if (e.bridge && e.heights && anyIn(e, weight)) for (let i = 2; i < e.points.length; i += 2) decks.add({ ax: e.points[i - 2], az: e.points[i - 1], bx: e.points[i], bz: e.points[i + 1], ha: e.heights[i / 2 - 1], hb: e.heights[i / 2], half: halfOf(e) + ML_DECK_PAD, e }, halfOf(e) + ML_DECK_PAD)
  }

  // ---- 2. the ground: lidar, filled under structures, at-grade corridors laid at their ways
  const grade = new SegIndex(), gradeFar = new SegIndex()
  for (const e of solveEdges) {
    // (nor a way that is not on the surface — not drawn, not ridden: a layer −2 passage carved the ground to 3.5 m under a 7.9 m walkway)
    if (e.bridge || e.tunnel || e.bore || !e.heights || !onSurface(e) || freeSteps.has(e)) continue
    const half = halfOf(e) + ML_BED_PAD
    // (a trench road gives no level beyond its own corridor under a structure: beside it, under a lid, is the tunnel's wall, not a floor
    //  — grass grew beside the Voie Georges-Pompidou inside the Alma mouth)
    if (!e.cut && !e.trench) for (let i = 2; i < e.points.length; i += 2) gradeFar.add({ ax: e.points[i - 2], az: e.points[i - 1], bx: e.points[i], bz: e.points[i + 1], ha: e.heights[i / 2 - 1], hb: e.heights[i / 2], half, e }, half + ML_UNDER_REACH)
    // (a trench road's floor runs ML_TRENCH_PAD past its kerb, so the step up to the street stands behind the trench wall's face, not
    //  in front of it: on a 1 m grid a diagonal corridor edge stood as a row of spikes inside the Iéna tunnel)
    // (not an approach cutting: it has no walls to stand behind, and its padded floor sank the end of the sidewalk beside the Pont
    //  National's bike ramp 2.2 m)
    const tr = !!(e.cut || e.trench), halfT = tr && !approaches.has(e) ? half + ML_TRENCH_PAD : half
    for (let i = 2; i < e.points.length; i += 2) grade.add({ ax: e.points[i - 2], az: e.points[i - 1], bx: e.points[i], bz: e.points[i + 1], ha: e.heights[i / 2 - 1], hb: e.heights[i / 2], half: halfT, e, cut: tr || (ML_STEPS_NO_SKIRT && e.kind === 'steps') }, halfT + ML_SKIRT)
  }
  /** the corridor at (x, z): the nearest at-grade way's height and how far outside its corridor the point is (≤ 0 inside) */
  const ML_TIE = process.env.ML_TIE !== '0'
  // (inside two corridors, the way whose CENTRELINE is nearer: a footway under the Pont au Double lay inside a wider upper way's
  //  corridor, 1.8 m higher, which won on edge distance and buried it). Under a structure only: by the quay walls it moved the step
  //  between a lower and an upper corridor off the wall line, and 14 more wall gaps opened on seine-centre-mini)
  const corridor = (x: number, z: number, reach = ML_SKIRT): { h: number; d: number; cut?: boolean } | null => {
    let best: { h: number; d: number; cut?: boolean; c: number; half: number } | null = null
    for (const s of (reach > ML_SKIRT ? gradeFar : grade).near(x, z)) {
      const q = segDist(x, z, s.ax, s.az, s.bx, s.bz), d = q.d - s.half
      if (d > reach) continue
      // (not across a wall line: a footway along a retaining wall's top, at the Pont d'Iéna's right bank, laid its corridor 1.2 m past
      //  the line and moved the wall's step out over the lower quai's road, a 6 m slope of grass in front of the stone)
      if (d > -ML_BED_PAD && walledOff(x, z, s.ax + (s.bx - s.ax) * q.t, s.az + (s.bz - s.az) * q.t)) continue
      // (…and anywhere, inside the DRAWN width of two ways, the way whose centreline is nearer: a Pont National flight's top and its bike
      //  ramp lay a metre under a wider neighbour's corridor)
      const bothOn = best !== null && d <= -ML_BED_PAD && best.d <= -ML_BED_PAD
      // (the NARROWER way, where one lies inside the other's drawn width: a path inside a wide boulevard's footprint is the more specific
      //  — the Pont National's bike ramp runs inside the Bd Jean Simon's 19 m and a metre under it, and was buried; ML_ON_NARROW)
      const narrower = ML_ON_NARROW && bothOn && Math.abs(s.half - best!.half) > ML_NARROW_DIFF
      if (!best || (narrower ? s.half < best.half : (ML_ON_CENTRE && bothOn) || (ML_TIE && d <= 0 && best.d <= 0 && underStructure(x, z)) ? q.d < best.c : d < best.d)) best = { h: s.ha + (s.hb - s.ha) * q.t, d, cut: s.cut, c: q.d, half: s.half }
    }
    return best
  }
  /** the level of the at-grade way within `reach` of its corridor whose level at (x, z) is nearest `target` (ML_UNDER_MNT_DH) */
  const corridorNear = (x: number, z: number, reach: number, target: number): number | null => {
    let best: number | null = null
    for (const s of gradeFar.near(x, z)) {
      const q = segDist(x, z, s.ax, s.az, s.bx, s.bz)
      if (q.d - s.half > reach) continue
      const h = s.ha + (s.hb - s.ha) * q.t
      if (best === null || Math.abs(h - target) < Math.abs(best - target)) best = h
    }
    return best
  }
  /** does a wall line cross the segment from (x, z) to (px, pz)? */
  const walledOff = (x: number, z: number, px: number, pz: number): boolean => {
    for (const w of wallIdx.near(x, z)) {
      const d1 = (w.bx - w.ax) * (z - w.az) - (w.bz - w.az) * (x - w.ax), d2 = (w.bx - w.ax) * (pz - w.az) - (w.bz - w.az) * (px - w.ax)
      if ((d1 > 0) === (d2 > 0)) continue
      const e1 = (px - x) * (w.az - z) - (pz - z) * (w.ax - x), e2 = (px - x) * (w.bz - z) - (pz - z) * (w.bx - x)
      if ((e1 > 0) !== (e2 > 0)) return true
    }
    return false
  }
  /** the lowest at-grade way within reach (not across a wall line) */
  const corridorLow = (x: number, z: number, reach: number): { h: number; d: number } | null => {
    let best: { h: number; d: number } | null = null
    for (const s of gradeFar.near(x, z)) {
      const q = segDist(x, z, s.ax, s.az, s.bx, s.bz), d = q.d - s.half
      if (d > reach) continue
      const h = s.ha + (s.hb - s.ha) * q.t
      if (!best || h < best.h) best = { h, d }
    }
    return best
  }
  // the wall lines, in 10 m cells
  const wallIdx = new SegIndex()
  for (const w of inp.walls ?? []) for (let i = 1; i < w.length; i++) wallIdx.add({ ax: w[i - 1].x, az: w[i - 1].z, bx: w[i].x, bz: w[i].z, ha: 0, hb: 0, half: 0, e: null as unknown as PackedEdge }, ML_WALL_SNAP + 1)
  let nSnap = 0
  /** the lidar, read clear of a wall line on the point's own side */
  const mntG = (x: number, z: number): number | null => {
    let best: { d: number; px: number; pz: number } | null = null
    for (const w of wallIdx.near(x, z)) {
      const q = segDist(x, z, w.ax, w.az, w.bx, w.bz)
      if (q.d < ML_WALL_SNAP && (!best || q.d < best.d)) best = { d: q.d, px: w.ax + (w.bx - w.ax) * q.t, pz: w.az + (w.bz - w.az) * q.t }
    }
    if (!best) return inp.mnt(x, z)
    let nx = x - best.px, nz = z - best.pz, l = Math.hypot(nx, nz)
    if (l < 0.05) return inp.mnt(x, z) // on the line itself: as read
    nx /= l; nz /= l; nSnap++
    return inp.mnt(best.px + nx * ML_WALL_READ, best.pz + nz * ML_WALL_READ)
  }
  const G = new TGrid(), fixed = new TGrid(), rland = new TGrid()
  let nBoat = 0, nIsle = 0
  // the boats, padded ML_BOAT_PAD, in 10 m cells
  const boatRings = (inp.boats ?? []).map((r) => ({ r, bb: bbox(r) }))
  const boatAt = (x: number, z: number): boolean => boatRings.some(({ r, bb }) => x >= bb[0] - ML_BOAT_PAD && x <= bb[2] + ML_BOAT_PAD && z >= bb[1] - ML_BOAT_PAD && z <= bb[3] + ML_BOAT_PAD && (inRing(r, x, z) || nearRing(r, x, z) < ML_BOAT_PAD))
  const [bx0, bz0, bx1, bz1] = inp.box, T = ML_TILE * ML_CELL
  for (let tz = Math.floor((bz0 - ML_EASE) / T); tz <= Math.floor((bz1 + ML_EASE) / T); tz++) for (let tx = Math.floor((bx0 - ML_EASE) / T); tx <= Math.floor((bx1 + ML_EASE) / T); tx++) {
    const cx = (tx + 0.5) * T, cz = (tz + 0.5) * T
    if (inp.bandOut(cx, cz) > ML_EASE + T * 0.75) continue
    G.ensure(tx, tz); fixed.ensure(tx, tz, 0); rland.ensure(tx, tz)
  }
  // fixed: 1 = lidar, 2 = corridor, 3 = river (left), 4 = under a structure at a way's level, 5 = the riverbed, 0 = unknown
  let nUnder = 0, nCorr = 0, nRiver = 0, nTerr = 0, nFill = 0, nUnderMnt = 0
  const underMntAt = new Map<string, number>()
  for (const [i, j] of G.cells()) {
    const x = i * ML_CELL, z = j * ML_CELL
    const rv0 = riverCell(x, z), boat = boatAt(x, z), rv = rv0 ?? (boat ? rivers[0] : undefined), c = corridor(x, z)
    if (boat && rv && rv.level !== null) { G.set(i, j, rv.level - ML_RIVER_BED); fixed.set(i, j, 5); nBoat++; nRiver++; continue }
    if (rv) {
      const under = underStructure(x, z), m = under ? null : inp.mnt(x, z), lv = rv.level
      let land = lv !== null && (under ? !!c && c.d <= ML_RIVER_CORR : m !== null && m > lv + ML_RIVER_LAND)
      if (land && !under && lv !== null && m !== null && m > lv + ML_PORT_MAX && !(c && c.d <= ML_RIVER_CORR) && nearBridge(x, z) && offBank(x, z)) { land = false; nGhost++ }
      if (!land) { if (lv !== null) { G.set(i, j, lv - ML_RIVER_BED); fixed.set(i, j, 5) } else fixed.set(i, j, 3); nRiver++; continue }
      if (lv !== null) { rland.set(i, j, lv) }
      if (under && c) { G.set(i, j, c.h); fixed.set(i, j, 4); nTerr++; continue }
    }
    if (c && c.d <= 0) { G.set(i, j, c.h); fixed.set(i, j, 2); nCorr++; continue }
    if (underStructure(x, z)) {
      // (a FLUSH deck — a lid over a trench, a bridge's end on land — has the ground filled up under it: the lidar sees the deck there,
      //  within ML_FLUSH m of it. The Place de Varsovie's lid decks stood 1–2 m over a ground smeared down toward the trench, and showed
      //  their grey sides like footings through the plaza)
      const md = inp.mnt(x, z)
      let hd: number | null = null
      for (const sg of decks.near(x, z)) { const q = segDist(x, z, sg.ax, sg.az, sg.bx, sg.bz); if (q.d < sg.half - ML_DECK_PAD) { const h = sg.ha + (sg.hb - sg.ha) * q.t; if (hd === null || h > hd) hd = h } }
      if (hd !== null && md !== null && Math.abs(md - hd) < ML_FLUSH) { G.set(i, j, hd - ML_FILL_UNDER); fixed.set(i, j, 4); nFill++; continue }
      // (the LOWEST way within reach, not the nearest: under the Pont d'Iéna's land arch the nearest was the upper quai, and the ground
      //  rose from the lower quai's road as a grass bank to it under the arch — owner, 2026-11-16; under a bridge the floor is the
      //  passage's, and the abutment stands from it)
      const u = ML_UNDER_LOW ? corridorLow(x, z, ML_UNDER_REACH) : corridor(x, z, ML_UNDER_REACH)
      // (NOT A LEVEL THE LIDAR DENIES, owner 2026-11-16 at 48.889028, 2.254117: under the Défense slab's walkway decks the nearest
      //  at-grade way was up on the slab, 18 m off, and the ground stood under the decks as 9 m ridges, the lidar 12 m lower, "huge
      //  protrusions going into buildings and streets". Over the lidar by ML_UNDER_MNT_DH or more, the floor is the way within reach
      //  nearest the lidar's level, or the lidar itself. Only over: under a bridge the lidar runs across from the deck's ends, so it reads
      //  high, never low, and taken below the way the rule raised the floor under the Pont d'Iéna's left-bank arch and closed it. Nor
      //  within ML_UNDER_MNT_RIVER m of the river: there the structures are its bridges, whose land arches the rule was made for, and
      //  even over-only it reshaped the ground beside the Iéna's left-bank arch. Nor under a lid: there the lidar sees the trench floor
      //  under the slab, the ground went down to it, and the Place de Varsovie's paving was drawn 9 m down in the trench under its slab —
      //  holes that slid about with the eye, owner 2026-11-16)
      if (u && md !== null && ML_UNDER_MNT_DH > 0 && u.h - md > ML_UNDER_MNT_DH && !nearWater(x, z, ML_UNDER_MNT_RIVER) && !inLid(x, z)) {
        const v = corridorNear(x, z, ML_UNDER_REACH, md)
        G.set(i, j, v && Math.abs(v - md) <= ML_UNDER_MNT_DH ? v : md); fixed.set(i, j, 4); nUnderMnt++
        if (process.env.ML_LOG_UNDER_MNT) { const k = `${Math.round(x / 20) * 20},${Math.round(z / 20) * 20}`; underMntAt.set(k, (underMntAt.get(k) ?? 0) + 1) }
        continue
      }
      if (u) { G.set(i, j, u.h); fixed.set(i, j, 4); nTerr++; continue }
      nUnder++; continue
    }
    const m = mntG(x, z)
    if (m === null) continue
    // (no skirt across a wall: a wall line nearer than the corridor's edge stands between them, and the quai road's 4 m skirt had run
    //  over the quay wall's top and blurred the step the walls are cut from)
    const walled = c && wallIdx.near(x, z).some((w) => segDist(x, z, w.ax, w.az, w.bx, w.bz).d < c.d)
    // (and no skirt up a WALL: where the open ground beyond stands ML_SKIRT_DH m or more off the way, a skirt laid a 4 m grass bank from
    //  the lower quai's road up to the plateau beside the Pont d'Iéna; the ground steps at the corridor's edge instead)
    const skirt = c && !walled && !c.cut && Math.abs(m - c.h) < ML_SKIRT_DH
    G.set(i, j, skirt ? c.h + (m - c.h) * Math.min(1, c.d / ML_SKIRT) : m); fixed.set(i, j, 1)
  }
  // LAND IN THE RIVER MUST REACH THE SHORE (2026-11-15, owner: a barge "shouldn't display as grassy land"): the lidar takes some moored
  // barges' decks for ground, 1–2 m over the water, and they stood as grass in the Seine. A blob of land inside the river's outline that
  // no 4-neighbour chain of such cells joins to land outside it is the riverbed.
  {
    // (…nor across a quay wall: a barge moored against one touches the shore, and the wall line is what stands between them)
    const barrier = (i: number, j: number): boolean => { const x = i * ML_CELL, z = j * ML_CELL; return wallIdx.near(x, z).some((w) => segDist(x, z, w.ax, w.az, w.bx, w.bz).d < ML_RIVER_WALL_GAP) }
    const seen = new TGrid(), stack: [number, number][] = []
    for (const [i, j] of rland.cells()) {
      if (Number.isNaN(rland.get(i, j)) || barrier(i, j)) continue
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const f = fixed.get(i + di, j + dj)
        if ((f === 1 || f === 2 || f === 4) && Number.isNaN(rland.get(i + di, j + dj))) { stack.push([i, j]); break }
      }
    }
    for (const [i, j] of stack) { seen.ensure(Math.floor(i / ML_TILE), Math.floor(j / ML_TILE)); seen.set(i, j, 1) }
    while (stack.length) {
      const [i, j] = stack.pop()!
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const a = i + di, b = j + dj
        if (Number.isNaN(rland.get(a, b)) || seen.get(a, b) === 1 || barrier(a, b)) continue
        seen.ensure(Math.floor(a / ML_TILE), Math.floor(b / ML_TILE)); seen.set(a, b, 1); stack.push([a, b])
      }
    }
    for (const [i, j] of rland.cells()) {
      const lv = rland.get(i, j)
      if (Number.isNaN(lv) || seen.get(i, j) === 1 || barrier(i, j)) continue
      G.set(i, j, lv - ML_RIVER_BED); fixed.set(i, j, 5); nIsle++
    }
  }
  // the fill under structures: SOR on the unknown cells; river cells are not a boundary (a slope down into the riverbed)
  const unknown: [number, number][] = []
  for (const [i, j] of G.cells()) if (fixed.get(i, j) === 0) unknown.push([i, j])
  for (const [i, j] of unknown) { // a start: the mean of the fixed cells nearby
    let s = 0, n = 0
    for (let r = 1; r < 30 && !n; r += 3) for (const [di, dj] of [[r, 0], [-r, 0], [0, r], [0, -r]]) { const f = fixed.get(i + di, j + dj); if (f === 1 || f === 2 || f === 4) { s += G.get(i + di, j + dj); n++ } }
    G.set(i, j, n ? s / n : 0)
  }
  for (let it = 0; it < ML_FILL_ITERS; it++) {
    for (const [i, j] of unknown) {
      let s = 0, n = 0
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const f = fixed.get(i + di, j + dj); if (f === 3 || f === 5 || Number.isNaN(f)) continue; const v = G.get(i + di, j + dj); if (!Number.isNaN(v)) { s += v; n++ } }
      if (n) { const g = G.get(i, j); G.set(i, j, g + (s / n - g) * ML_FILL_SOR) }
    }
  }
  if (process.env.ML_LOG_UNDER_MNT) log(`ML_UNDER_MNT cells by 20 m: ${[...underMntAt].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k}:${n}`).join(' ')}`)
  log(`multi-level ground: ${G.tiles.size} tiles of ${ML_TILE} m; ${nCorr} corridor cells, ${nTerr} under structures continuing a way's level (${nUnderMnt} more at the lidar's, ML_UNDER_MNT_DH), ${nFill} filled up under flush decks, ${nUnder} filled, ${nSnap} lidar reads moved clear of ${(inp.walls ?? []).length} wall lines, ${nGhost} bridge-ghost lidar cells and ${nBoat} cells under ${(inp.boats ?? []).length} boats and ${nIsle} of land blobs off the shore laid as riverbed, ${nRiver} river cells left`)

  // UNDER A LID THE GROUND IS UNDER ITS SLAB (owner, 2026-11-16, the Place de Varsovie: "random patches of different pavements"): the
  // slab lies at its low streets' level (tools/bake.ts LID_LEVEL_Q), and plaza ground a quarter metre over it showed through between the
  // streets as khaki wedges in the paving. Inside a lid's outline the ground stands no higher than ML_LID_UNDER under that level.
  {
    let nLid = 0
    for (const ring of inp.lids ?? []) {
      const bb = bbox(ring), hs: number[] = []
      for (const e of edges) {
        if (!e.heights || e.tunnel || e.cut || e.trench || e.foot) continue
        for (let i = 0; i < e.heights.length; i++) { const x = e.points[2 * i], z = e.points[2 * i + 1]; if (x >= bb[0] && x <= bb[2] && z >= bb[1] && z <= bb[3] && inRing(ring, x, z)) hs.push(e.heights[i]) }
      }
      if (hs.length < 3) continue
      hs.sort((a, b) => a - b)
      const top = hs[Math.floor(hs.length * ML_LID_Q)] - ML_LID_UNDER
      for (let j = Math.floor(bb[1] / ML_CELL); j <= Math.ceil(bb[3] / ML_CELL); j++) for (let i = Math.floor(bb[0] / ML_CELL); i <= Math.ceil(bb[2] / ML_CELL); i++) {
        const x = i * ML_CELL, z = j * ML_CELL, g = G.get(i, j)
        if (Number.isNaN(g) || g <= top || !inRing(ring, x, z)) continue
        G.set(i, j, top); nLid++
      }
    }
    if (nLid) log(`multi-level: ${nLid} cells under ${(inp.lids ?? []).length} lids held under their slabs`)
  }

  if (process.env.ML_DEBUG) for (const pt of process.env.ML_DEBUG.split(';')) {
    const [x, z] = pt.split(',').map(Number), c = corridor(x, z), u = corridor(x, z, ML_UNDER_REACH)
    log(`ML_DEBUG ${x},${z}: w ${weight(x, z).toFixed(2)} river ${inRiver(x, z)} under ${underStructure(x, z)} mnt ${inp.mnt(x, z)?.toFixed(2)} corr ${c ? c.h.toFixed(2) + '@' + c.d.toFixed(1) : '-'} far ${u ? u.h.toFixed(2) + '@' + u.d.toFixed(1) : '-'} G ${G.at(x, z).toFixed(2)} fixed ${fixed.get(Math.round(x), Math.round(z))}; rings ${rings.length}`)
  }
  // ---- 2b. elevated tracks: no spikes. A node more than ML_RAIL_SPIKE m under both its neighbours, or over both, goes to the straight
  //  line between them — through shared ends too (two ways' joint is a node with one neighbour on each). Then no dips steeper than
  //  ML_RAIL_GRADE inside the band (lift only). Every elevated track, not just the band's: a track is a structure, not the ground.
  let lifted = 0
  {
    const el = inp.rails.filter((r) => r.bridge && r.heights && r.heights.length * 2 === r.points.length && r.heights.length >= 2)
    const joint = new Map<string, { r: PackedRail; i: number }[]>()
    for (const r of el) for (const i of [0, r.heights!.length - 1]) { const k = keyOf(r.points[2 * i], r.points[2 * i + 1]); (joint.get(k) ?? joint.set(k, []).get(k)!).push({ r, i }) }
    const nbrs = (r: PackedRail, i: number): { h: number; d: number; x: number; z: number }[] => {
      const p = r.points, h = r.heights!, n = h.length, out: { h: number; d: number; x: number; z: number }[] = []
      const add = (rr: PackedRail, j: number, from: number): void => { out.push({ h: rr.heights![j], d: Math.hypot(rr.points[2 * j] - rr.points[2 * from], rr.points[2 * j + 1] - rr.points[2 * from + 1]) || 0.1, x: rr.points[2 * j], z: rr.points[2 * j + 1] }) }
      if (i > 0) add(r, i - 1, i); if (i < n - 1) add(r, i + 1, i)
      if (i === 0 || i === n - 1) for (const q of joint.get(keyOf(p[2 * i], p[2 * i + 1])) ?? []) if (q.r !== r) { const j = q.i === 0 ? 1 : q.r.heights!.length - 2; out.push({ h: q.r.heights![j], d: Math.hypot(q.r.points[2 * j] - p[2 * i], q.r.points[2 * j + 1] - p[2 * i + 1]) || 0.1, x: q.r.points[2 * j], z: q.r.points[2 * j + 1] }) }
      return out
    }
    for (let pass = 0; pass < 4; pass++) for (const r of el) for (let i = 0; i < r.heights!.length; i++) {
      const nb2 = nbrs(r, i); if (nb2.length !== 2) continue
      const [a, b] = nb2, h = r.heights![i], px = r.points[2 * i], pz = r.points[2 * i + 1]
      if (((a.x - px) * (b.x - px) + (a.z - pz) * (b.z - pz)) / (a.d * b.d) > -0.5) continue // both on one side: a turn-back, not a spike
      const lin = a.h + (b.h - a.h) * a.d / (a.d + b.d)
      if ((h < Math.min(a.h, b.h) - ML_RAIL_SPIKE) || (h > Math.max(a.h, b.h) + ML_RAIL_SPIKE)) {
        const y = Math.round(lin * 100) / 100
        r.heights![i] = y; lifted++
        if (i === 0 || i === r.heights!.length - 1) for (const q of joint.get(keyOf(r.points[2 * i], r.points[2 * i + 1])) ?? []) q.r.heights![q.i] = y
      }
    }
    // parallel tracks are one structure: a node within ML_RAIL_PAIR m of another elevated track (running within 20° of it) takes the mean
    for (let pass = 0; pass < 2; pass++) for (const r of el) for (let i = 0; i < r.heights!.length; i++) {
      const x = r.points[2 * i], z = r.points[2 * i + 1], j = Math.min(i + 1, r.heights!.length - 1), k0 = Math.max(0, i - 1)
      const dx = r.points[2 * j] - r.points[2 * k0], dz = r.points[2 * j + 1] - r.points[2 * k0 + 1], dl = Math.hypot(dx, dz) || 1
      let best = ML_RAIL_PAIR, y: number | null = null
      for (const o of el) {
        if (o === r) continue
        for (let m = 1; m < o.heights!.length; m++) {
          const ax = o.points[2 * m - 2], az = o.points[2 * m - 1], bx = o.points[2 * m], bz = o.points[2 * m + 1], q = segDist(x, z, ax, az, bx, bz)
          if (q.d >= best) continue
          const ol = Math.hypot(bx - ax, bz - az) || 1; if (Math.abs((dx * (bx - ax) + dz * (bz - az)) / (dl * ol)) < 0.94) continue
          best = q.d; y = o.heights![m - 1] + (o.heights![m] - o.heights![m - 1]) * q.t
        }
      }
      if (y !== null && Math.abs(y - r.heights![i]) > 0.1) { r.heights![i] = Math.round((r.heights![i] + y) / 2 * 100) / 100; lifted++ }
    }
    for (const r of el) {
      const p = r.points, n = r.heights!.length; if (![...Array(n).keys()].some((i) => weight(p[2 * i], p[2 * i + 1]) > 0)) continue
      const h = r.heights!
      for (let pass = 0; pass < 2; pass++) for (let k = 1; k < n - 1; k++) {
        const i = pass ? n - 1 - k : k, j = pass ? i + 1 : i - 1
        const d = Math.hypot(p[2 * i] - p[2 * j], p[2 * i + 1] - p[2 * j + 1]), lo = h[j] - ML_RAIL_GRADE * d
        if (h[i] < lo - 0.05) { h[i] = Math.round(lo * 100) / 100; lifted++ }
      }
    }
  }
  if (process.env.ML_DEBUG) for (const r of inp.rails) { if (!r.heights) continue; for (let i = 1; i < r.heights.length; i++) if (Math.abs(r.heights[i] - r.heights[i - 1]) > 2.5) log(`ML_DEBUG rail ${r.id} br${r.bridge ? 1 : 0} v${i - 1}→v${i}: ${r.heights[i - 1]} → ${r.heights[i]} (w ${weight(r.points[2 * i], r.points[2 * i + 1]).toFixed(2)}, n ${r.heights.length}, pts ${r.points.length})`) }
  log(`multi-level rails: ${lifted} elevated-track nodes taken off spikes or lifted out of dips`)
  // ---- 3. flags from geometry
  let rampOff = 0, rampKept = 0
  for (const e of solveEdges) {
    if (!e.ramp || e.bridge || !e.heights) continue
    let above = -Infinity
    for (let i = 0; i < e.heights.length; i++) {
      const x = e.points[2 * i], z = e.points[2 * i + 1], m = inp.mnt(x, z)
      if (m !== null && !underStructure(x, z) && !inRiver(x, z)) above = Math.max(above, e.heights[i] - m)
    }
    if (above < ML_RAMP_ABOVE) { delete e.ramp; rampOff++ } else rampKept++
  }
  log(`multi-level flags: ramp taken off ${rampOff} ways standing on the ground, kept on ${rampKept}`)

  // ONE NODE, TWO LEVELS, TWO NODES (owner, 2026-11-15, the Place de Varsovie: "the route in the tunnel also jumps to street level"):
  // OSM shares a node between a street on the place and the Avenue de New York's trench 7 m under it. The solve gave them their own
  // heights, but the node joined them, and the ride graph drew a 7.6 m step from one to the other. Where the ways at a node end more
  // than ML_NODE_SPLIT m apart, the level with the most ways keeps the node; each other level gets one of its own.
  {
    const at = new Map<number, { e: PackedEdge; b: boolean; h: number }[]>()
    for (const e of edges) {
      if (!e.heights || !anyIn(e, weight)) continue
      for (const b of [false, true]) { const v = b ? e.b : e.a, l = at.get(v) ?? at.set(v, []).get(v)!; l.push({ e, b, h: b ? e.heights[e.heights.length - 1] : e.heights[0] }) }
    }
    let nSplit = 0, node = ML_SPLIT_NODE0
    for (const l of at.values()) {
      if (l.length < 2) continue
      l.sort((p, q) => p.h - q.h)
      const groups: (typeof l)[] = [[l[0]]]
      for (let k = 1; k < l.length; k++) { if (l[k].h - l[k - 1].h > ML_NODE_SPLIT) groups.push([]); groups[groups.length - 1].push(l[k]) }
      if (groups.length < 2) continue
      const keep = groups.reduce((m, g) => (g.length > m.length ? g : m))
      for (const g of groups) {
        if (g === keep) continue
        const v = node++
        for (const q of g) { if (q.b) q.e.b = v; else q.e.a = v }
        nSplit++
      }
    }
    log(`multi-level: ${nSplit} nodes shared across levels split`)
  }

  return {
    weight,
    groundAt(x: number, z: number, prev: number): number {
      const w = weight(x, z); if (w <= 0) return prev
      const g = G.at(x, z)
      if (Number.isNaN(g)) return prev
      const f = fixed.get(Math.round(x / ML_CELL), Math.round(z / ML_CELL))
      if (f === 3) return prev
      if (f === 5) return Math.min(prev, g)
      // the corridor exactly (the grid's 1 m bilinear would round a kerb)
      const c = corridor(x, z)
      const y = c && c.d <= 0 ? c.h : g
      return prev + (y - prev) * w
    },
  }
}

function unflat(r: ArrayLike<number>): XZ[] { const o: XZ[] = []; for (let i = 0; i + 1 < r.length; i += 2) o.push({ x: r[i], z: r[i + 1] }); return o }
function bbox(r: XZ[]): [number, number, number, number] {
  let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity
  for (const p of r) { a = Math.min(a, p.x); b = Math.min(b, p.z); c = Math.max(c, p.x); d = Math.max(d, p.z) }
  return [a, b, c, d]
}
function nearRing(r: XZ[], x: number, z: number): number {
  let d = Infinity
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) d = Math.min(d, segDist(x, z, r[j].x, r[j].z, r[i].x, r[i].z).d)
  return d
}
function anyIn(e: PackedEdge, w: (x: number, z: number) => number): boolean {
  for (let i = 0; i < e.points.length; i += 2) if (w(e.points[i], e.points[i + 1]) > 0) return true
  return false
}
/** conjugate gradients, Jacobi-preconditioned, on (diag(D) + membrane Laplacian) h = B */
function cg(n: number, D: number[], B: number[], nb: Map<number, number>[], x0: Float64Array, iters: number, tol: number): Float64Array {
  const diag = new Float64Array(n)
  for (let i = 0; i < n; i++) { let s = D[i]; for (const w of nb[i].values()) s += w; diag[i] = s || 1 }
  const A = (p: Float64Array, out: Float64Array): void => {
    for (let i = 0; i < n; i++) { let s = diag[i] * p[i]; for (const [j, w] of nb[i]) s -= w * p[j]; out[i] = s }
  }
  const x = Float64Array.from(x0), r = new Float64Array(n), z = new Float64Array(n), p = new Float64Array(n), q = new Float64Array(n)
  A(x, q); let bn = 0
  for (let i = 0; i < n; i++) { r[i] = B[i] - q[i]; z[i] = r[i] / diag[i]; p[i] = z[i]; bn += B[i] * B[i] }
  let rz = 0; for (let i = 0; i < n; i++) rz += r[i] * z[i]
  for (let it = 0; it < iters; it++) {
    A(p, q); let pq = 0; for (let i = 0; i < n; i++) pq += p[i] * q[i]
    if (pq <= 0) break
    const a = rz / pq; let rn = 0
    for (let i = 0; i < n; i++) { x[i] += a * p[i]; r[i] -= a * q[i]; rn += r[i] * r[i] }
    if (rn <= tol * tol * (bn || 1)) break
    let rz2 = 0; for (let i = 0; i < n; i++) { z[i] = r[i] / diag[i]; rz2 += r[i] * z[i] }
    const bta = rz2 / rz; rz = rz2
    for (let i = 0; i < n; i++) p[i] = z[i] + bta * p[i]
  }
  return x
}
