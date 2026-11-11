/*
 * DECK ZONES (2026-11-07, pilot: Pont National's right bank; replaces its `levelPlans` entry). A bridgehead drawn as a BUILDING:
 * a few flat LEVELS (terraces at absolute NGF heights), WALLS where one steps down to the next, and ROUTES laid at the right level.
 * Inside the zone ring no ground post keeps its measured height; outside it the levels fade into the survey over `fade` m.
 * Spans over air (the bridge deck, Bd Poniatowski, the Périphérique slip) are not ground: they are left to the bridge/ramp drawing.
 *
 * regions.json `deckZones[]`:
 *   { name, ring: [lat, lon][], fade?: m (DZ_FADE), noFadeBelow?: NGF m (posts outside lower than this — the riverbed — untouched),
 *     levels: [{ name, alt: NGF m, ring?: [lat, lon][], slope?: { from: [lat, lon], to: [lat, lon], altTo: NGF m } }]
 *                                           first level WITHOUT a ring is the default for the rest of the zone; a slope makes it
 *                                           rise from alt at `from` to altTo at `to` (held level beyond the ends): a quay ramp's ground,
 *     drop?: [{ ways?, kinds? }]            ways inside the ring removed (≥ DZ_DROP_FRAC of their points inside): deck↔quai stubs
 *     pin?: [{ ways?, kinds?, level }]      ways whose points inside take the level's height (eased over `fade` m from the ring)
 *     free?: [{ ways?, kinds? }]            ways left as they are (the deck); every other unpinned way inside takes the ground level
 *     lay?: [{ name, kind, level, from: { at: [lat, lon], way }, via: [lat, lon][], to?: { at, way } }]
 *                                           a route laid as a polyline: an end with `way` splits that way at its nearest point
 *     ramps?: level-plan ramps (tools/level-plans.ts) with from/to [lat, lon, NGF?] — graded after the pins }
 * Heights in the bake are NGF − datum (the CitySpec datum, or the one the bake took). Full bake only for ground, walls and laid
 * routes; `bake --rides` re-pins and re-grades only (DECK_ZONES=0 off).
 */
import type { PackedEdge, QuayWall } from '../src/city/package.ts'
import { applyLevelPlans } from './level-plans.ts'
import { deckChains } from './rail-levels.ts'
import { ownLevels } from './bridges.ts'
import type { PackedRail } from '../src/city/package.ts'

export const DZ_FADE = 12, DZ_WALL_STEP = 2, DZ_WALL_PROBE = 1.2, DZ_WALL_MIN = 0.8, DZ_WALL_CAP = 0.5, DZ_DROP_FRAC = 0.5
/** a river wall's foot: this far under the zone's riverbed line (noFadeBelow), the same all along, so the faces line up */
export const DZ_RIVER_DEPTH = 2
/** past a river segment of the outline, the ground within DZ_RIVER_REACH m goes under the water; a segment is the river's when the
 *  ground DZ_RIVER_PROBE m out from its middle is below the riverbed line */
export const DZ_RIVER_REACH = 10, DZ_RIVER_PROBE = 4
/** the parapet along the water (a low stone wall), and along the top of a wall between levels at least DZ_PARAPET_MIN high */
export const DZ_RIVER_PARAPET = 0.7, DZ_LEVEL_PARAPET = 1.0, DZ_PARAPET_MIN = 1.5
/** the ground step shipped on the tiles a deck zone touches (the quays' detail is QD_STEP): fine enough that a wall's foot is a wall */
export const DZ_GROUND_STEP = 1
/** (2026-11-09) a zone's ground is shipped on its 1 m detail posts even where the quay detail has none (bake.ts quayDetail.at) */
/** (2026-11-09) a band wall line with no BD TOPO road in sight of a side reads that side off the lidar MNT, and so does the band's ground
 *  there (bake.ts quayDetail.at): 1209 of the band's 1886 wall pieces on pont-national-mini had been dropped for want of a road */
export const DZ_WALL_MNT = process.env.DZ_WALL_MNT !== '0'
/** BD TOPO walls as runs (DeckZone.runWalls): on; Chaikin passes, and the sharpest bend (degrees) they round; the sides read this far out;
 *  a run holds while the sides differ by KEEP, gaps up to GAP m are filled, runs under RUN_MIN m dropped, top/low smoothed over ±SMOOTH m */
export const DZ_WALL_RUNS = process.env.DZ_WALL_RUNS !== '0', DZ_WALL_CHAIKIN = Number(process.env.DZ_WALL_CHAIKIN ?? 3), DZ_WALL_CORNER = 50, DZ_WALL_READ = 2.4
export const DZ_WALL_SHIPPED = true
export const DZ_WALL_KEEP = 0.4, DZ_WALL_GAP = 8, DZ_WALL_RUN_MIN = 6, DZ_WALL_SMOOTH = 6
/** Chaikin corner cutting of an open polyline (flat x, z), ends kept; a vertex bending more than `maxDeg` is kept sharp */
export function chaikin(r: number[], passes: number, maxDeg: number): number[] {
  let p = r
  for (let it = 0; it < passes; it++) {
    if (p.length < 6) return p
    const q = [p[0], p[1]]
    for (let i = 2; i + 3 < p.length; i += 2) {
      const ax = p[i - 2], az = p[i - 1], bx = p[i], bz = p[i + 1], cx = p[i + 2], cz = p[i + 3]
      const a1 = Math.atan2(bz - az, bx - ax), a2 = Math.atan2(cz - bz, cx - bx)
      let d = Math.abs(a2 - a1) * 180 / Math.PI; if (d > 180) d = 360 - d
      if (d > maxDeg) { q.push(bx, bz); continue }
      q.push(bx + (ax - bx) * 0.25, bz + (az - bz) * 0.25, bx + (cx - bx) * 0.25, bz + (cz - bz) * 0.25)
    }
    q.push(p[p.length - 2], p[p.length - 1]); p = q
  }
  return p
}
/** a run's values: nulls filled linearly from their neighbours, then a ±w moving average */
export function smoothRun(v: (number | null)[], w: number): number[] {
  const n = v.length, f = v.slice()
  const idx = f.map((x, i) => (x === null ? -1 : i)).filter((i) => i >= 0)
  if (!idx.length) return f.map(() => 0)
  for (let i = 0; i < n; i++) if (f[i] === null) {
    const a = [...idx].reverse().find((j) => j < i), b = idx.find((j) => j > i)
    f[i] = a === undefined ? f[b!] : b === undefined ? f[a] : f[a]! + (f[b]! - f[a]!) * (i - a) / (b - a)
  }
  const g = f as number[], o: number[] = []
  for (let i = 0; i < n; i++) { let s = 0, c = 0; for (let j = Math.max(0, i - w); j <= Math.min(n - 1, i + w); j++) { s += g[j]; c++ } o.push(s / c) }
  return o
}
export const DZ_DETAIL_SEED = process.env.DZ_DETAIL_SEED !== '0'
/** a road-tunnel mouth this near a zone's ring is not sunk under the street over it (tools/tunnels.ts sinkRoadMouths) */
export const DZ_SINK_MARGIN = 30
/** BD TOPO mode: a way's end moved to a junction's height is eased back along it over this many m */
export const DZ_NODE_EASE = 15
/** BD TOPO mode: a matched way standing this far over the zone ground somewhere is drawn as a structure (`ramp`), not a bank */
export const DZ_RAMP_ABOVE = 1.5
/** the Seine band: bridges are free (their deck ends the source at junctions) — false: they ease to BD TOPO's junction heights */
export const DZ_BAND_FREE_DECKS = false
/** the Seine band: a bridge way that BD TOPO's sol-1 decks match takes their z (weighted by the band) and is HELD at its junctions:
 *  the ways meeting it ease to it, it is never eased to them (Pont de Sully, 2026-11-08: oneDeck landed its south span on the
 *  survey's 33.0 at the island abutment, where BD TOPO's deck reads 35.2-36.1; the junction pass then only fixed the last 9 m) */
export const DZ_BAND_BT_DECKS = true
/** (2026-11-08, sevres-mini) a matched band deck's vertices past BD TOPO's run take the run end's shift, tapered over
 *  max(DZ_DECK_TAIL_MIN, |shift| / DZ_DECK_TAIL_GRADE) m */
export const DZ_DECK_TAIL = true, DZ_DECK_TAIL_MIN = 20, DZ_DECK_TAIL_GRADE = 0.05
/** (2026-11-08) in the band a way end moved to a junction eases back over max(DZ_NODE_EASE, |dh| / DZ_NODE_GRADE) m, not a flat 15 m
 *  (a 2 m move over 15 m was a 13 % ramp at every deck end where BD TOPO and the OSM guess disagree) */
export const DZ_NODE_GRADE = 0.06
/** BD TOPO mode: a ground track next to the zone rising this far over the ground to BD TOPO's rail z is elevated (bridge + heights);
 *  where it meets a deck track the difference between the two is eased away along it over DZ_RAIL_EASE m */
export const DZ_RAIL_ABOVE = 1.5, DZ_RAIL_EASE = 40
/** a ring segment is the river's when the ground at any of these distances (m) out from its middle is under the riverbed line */
export const DZ_RIVER_PROBES = [4, 6, 8]
/** THE BAND'S UNMATCHED WAYS (2026-11-08, the owner's zigzag on Quai François Mitterrand's riverside footway: the per-vertex sight
 *  blend flipped between the quai road 34.4, the Terrasse 36-37 and the tunnel 30). An at-grade way BD TOPO does not carry takes
 *  ONE reference for the whole way: the matched ground way (by name; no bridge, tunnel, negative layer or structure) nearest along
 *  most of it — within REF_R m of a vertex, the sight line crossing no BD TOPO wall line — covering REF_COVER of its length. Its
 *  heights are the reference's (nearest point, within REF_REACH; interpolated along the way past it) plus ONE offset, the median of
 *  the lidar MNT's difference between the way and the reference's points (the sight blend's where the MNT has none), refused past
 *  REF_OFF_MAX (another tier); then smoothed along the way over a REF_SMOOTH m triangular window. With no reference: the MNT along
 *  the way (the sight blend where it has none), smoothed the same. Ends ease to the junctions as before (DZ_NODE_EASE). */
export const REF_R = 25, REF_REACH = 60, REF_COVER = 0.4, REF_OFF_MAX = 2.5, REF_SMOOTH = 30
/** a way bridgeHeights lifted toward a deck by distance (`ramp`, not a bridge) is graded the same way (the Quai François Mitterrand
 *  footway was one: 32.8..37.8 beside Pont Royal's end, per vertex); an end at a bridge's node then climbs to the deck's end over
 *  max(DZ_NODE_EASE, dh / REF_DECK_GRADE) m of it; `ramp` stays only where it still stands DZ_RAMP_ABOVE over the ground */
export const REF_RAMPS = true, REF_DECK_GRADE = 0.06
/** the band's stairs: their two ends from the ways they meet, linear between (they connect two levels) */
export const DZ_BAND_STEPS_LINEAR = true
/** the band's highway-type ways are never on the bike ride graph (`noBike`; the owner, 2026-11-08: Pont National's left-bank highway
 *  tunnel "is not functional, that's ok, as long as we make sure the user can't bike through it"): these kinds, and road tunnels */
/** the band holds a bridge with its own levels (tools/bridges.ts OWN_LEVELS: the Passerelle Simone de Beauvoir) as the bridge pass
 *  left it: never matched to BD TOPO's decks, never eased at its junctions (the ways meeting it ease to it) */
export const DZ_BAND_OWN_LEVELS = true
/** the band's unmatched foot bridges keep the bridge pass's heights, but one reversing (> 0.2 m) DZ_FOOT_REV or more times is made
 *  monotone between its two ends (the Passerelle's arm 544 had a 1.6 m hump mid-way on a flat arm) */
/** (round 4) at a band junction the matched CAR roads set the height when there are any (a footway matched to a BD TOPO Sentier
 *  ramping down to the lower quai pulled Quai Aimé Césaire 2.1 m down to the mean at the Passerelle Senghor's foot: 12.9 %) */
export const DZ_NODE_ROAD_FIRST = true
export const DZ_FOOT_MONO = true, DZ_FOOT_REV = 2
/** (round 4) the generic foot bridges' rule counts reversals over DZ_FOOT_REV_DH m and keeps a single maximum (an arch) */
export const DZ_FOOT_REV_DH = 0.3
const FOOT_KIND = /^(footway|cycleway|path|pedestrian|bridleway)$/
/** THE ROAD BED in the band (2026-11-08, owner: cars floating and holes in the road at Pont National's left abutment). The band's
 *  ground is BD TOPO's sight blend, laid BEFORE the routes; it leaves out sol-1 decks, so at a bridge's end (OSM's bridge starting
 *  later than the real abutment) it smears toward whatever low road it sees (a lower-quai passage) and the at-grade road end stood
 *  2.3 m over it: traffic rides the way, the road surface drapes the ground. After the routes, posts inside a car road's corridor
 *  (StreetGrade: half-width + walk) are RAISED to the way less DZ_BED_TOL; never lowered (the lower-quai ramps run under the ground). */
export const DZ_BED = true, DZ_BED_TOL = 0.15, DZ_BED_FOOT = false
/** (2026-11-10) the band's ground never stands more than DZ_MNT_CAP m over the lidar MNT (null: off); and in the band every way's corridor
 *  (foot ways too) is LOWERED to the way where the ground stands DZ_BED_DOWN m over it: no way under the ground (bake.ts) */
export const DZ_MNT_CAP: number | null = 1.0, DZ_BED_DOWN = 0.15
export const DZ_BAND_NO_BIKE = /^(motorway|trunk)(_link)?$/
export const DZ_BAND_NO_BIKE_TUNNEL_OK = /^(footway|cycleway|path|pedestrian|steps)$/
export const DZ_LAY_STEP = 4, DZ_ID0 = 9.7e14, DZ_NODE0 = 9.71e14

type LLp = [number, number]
type Match = { ways?: string; kinds?: string; /** AND: the way's kind must match too */ kind?: string; /** OR: these OSM edge ids (per-edge override) */ ids?: number[] }
export interface DeckZoneSpec {
  name: string; _doc?: string; ring: LLp[]; fade?: number; noFadeBelow?: number
  levels: { name: string; alt: number; ring?: LLp[]; slope?: { from: LLp; to: LLp; altTo: number } }[]
  drop?: Match[]; pin?: (Match & { level: string })[]; free?: Match[]
  lay?: { name: string; kind: string; level: string; width?: number; from: { at: LLp; way: string }; via: LLp[]; to?: { at: LLp; way: string } }[]
  ramps?: { name: string; ways?: string; kinds?: string; from: number[]; to: number[]; snap?: number }[]
  /** in memory only (tools/bdtopo-zones.ts, BDTOPO_ZONES=1): per-vertex NGF heights for a way, or null where it isn't matched; a
   *  matched way takes these inside the zone instead of its pin or level, and hand ramps naming only matched ways are skipped */
  btz?: (toLocal: LL) => (e: PackedEdge, edges: PackedEdge[]) => (number | null)[] | null
  /** in memory only (BDTOPO_ZONES=1, round 2): the ground's NGF height at a local point (null: no road in sight), replacing the
   *  levels for the ground; `exact` skips the raster (wall probes) */
  btGround?: (toLocal: LL) => (x: number, z: number, exact?: boolean) => number | null
  /** in memory only: BD TOPO Quai / Mur de soutènement lines (open polylines); with btGround the walls stand along these */
  btLines?: LLp[][]
  /** in memory only (round 3): BD TOPO's rail z (NGF) at a local point along a bearing, or null */
  btRail?: (toLocal: LL) => (x: number, z: number, ux: number, uz: number) => number | null
  /** in memory only (2026-11-08): the lidar MNT (NGF) at a local point, or null (the band's unmatched ways: REF_*) */
  btMnt?: (toLocal: LL) => (x: number, z: number) => number | null
  /** in memory only (round 3): [full, ease] m — the band past the ring where matched ways, the ground and the walls take BD TOPO */
  band?: [number, number]
  /** in memory only (2026-11-08, the Seine band, tools/seine-band.ts): a zone whose extent is a distance field, not a ring (`ring`
   *  empty). Inside it the ground and every way are BD TOPO's with no levels; it eases out over band[1]; posts under noFadeBelow
   *  (the riverbed) are left alone; the city's quay walls stay (near() is false) */
  shape?: { out(x: number, z: number): number; inside(x: number, z: number): boolean; box: [number, number, number, number]
    /** the riverbed line (NGF) at a local point, per place (tools/seine-band.ts BAND_RIVERBED_OVER); noFadeBelow without it */
    riverbed?(x: number, z: number): number }
}
type LL = (lat: number, lon: number) => { x: number; z: number }

const inRing = (r: number[], x: number, z: number): boolean => {
  let c = false
  for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2)
    if ((r[i + 1] > z) !== (r[j + 1] > z) && x < ((r[j] - r[i]) * (z - r[i + 1])) / (r[j + 1] - r[i + 1]) + r[i]) c = !c
  return c
}
/** distance to the ring's outline and the nearest point on it */
const nearOnRing = (r: number[], x: number, z: number): { d: number; x: number; z: number } => {
  let best = { d: Infinity, x, z }
  for (let i = 0; i < r.length; i += 2) {
    const j = (i + 2) % r.length, dx = r[j] - r[i], dz = r[j + 1] - r[i + 1]
    const t = Math.max(0, Math.min(1, ((x - r[i]) * dx + (z - r[i + 1]) * dz) / (dx * dx + dz * dz || 1)))
    const px = r[i] + dx * t, pz = r[i + 1] + dz * t, d = Math.hypot(px - x, pz - z)
    if (d < best.d) best = { d, x: px, z: pz }
  }
  return best
}
const matcher = (ms?: Match[]) => {
  const rs = (ms ?? []).map((m) => ({ n: m.ways ? new RegExp(m.ways) : null, k: m.kinds ? new RegExp(m.kinds) : null, a: m.kind ? new RegExp(m.kind) : null, ids: m.ids ? new Set(m.ids) : null }))
  return (e: PackedEdge): boolean => rs.some(({ n, k, a, ids }) => !!(ids && ids.has(e.id)) || ((!a || a.test(e.kind ?? '')) && !!((n && n.test(e.name ?? '')) || (k && !e.name && k.test(e.kind ?? '')))))
}
const r2 = (v: number): number => Math.round(v * 100) / 100

/** A zone projected: the level (bake height) at a point inside, and the fade outside. */
export class DeckZone {
  readonly ring: number[]; readonly fade: number; readonly floor: number
  readonly levels: { name: string; y: number; ring: number[] | null; slope: { ax: number; az: number; bx: number; bz: number; yb: number } | null }[]
  readonly spec: DeckZoneSpec; readonly datum: number; readonly zOf: ((e: PackedEdge, edges: PackedEdge[]) => (number | null)[] | null) | null
  readonly gOf: ((x: number, z: number, exact?: boolean) => number | null) | null; readonly lines: number[][]
  readonly band: [number, number]; readonly rOf: ((x: number, z: number, ux: number, uz: number) => number | null) | null
  constructor(spec: DeckZoneSpec, toLocal: LL, datum: number) {
    this.spec = spec; this.datum = datum; this.zOf = spec.btz ? spec.btz(toLocal) : null
    this.gOf = spec.btGround ? spec.btGround(toLocal) : null; this.band = spec.band ?? [0, 0]
    this.rOf = spec.btRail ? spec.btRail(toLocal) : null
    this.mOf = spec.btMnt ? spec.btMnt(toLocal) : null
    this.shape = spec.shape ?? null
    const loc = (r: LLp[]) => r.flatMap(([lat, lon]) => { const q = toLocal(lat, lon); return [q.x, q.z] })
    this.lines = (spec.btLines ?? []).map(loc)
    this.ring = loc(spec.ring); this.fade = spec.fade ?? DZ_FADE; this.floor = (spec.noFadeBelow ?? -Infinity) - datum
    this.levels = spec.levels.map((l) => {
      const a = l.slope && toLocal(l.slope.from[0], l.slope.from[1]), b = l.slope && toLocal(l.slope.to[0], l.slope.to[1])
      return { name: l.name, y: l.alt - datum, ring: l.ring ? loc(l.ring) : null, slope: l.slope ? { ax: a!.x, az: a!.z, bx: b!.x, bz: b!.z, yb: l.slope.altTo - datum } : null }
    })
  }
  readonly shape: DeckZoneSpec['shape'] | null = null
  readonly mOf: ((x: number, z: number) => number | null) | null = null
  /** (the band, DZ_WALL_MNT) the lidar MNT at a post in the band that no road is in sight of and that is not the riverbed: null elsewhere */
  mntAt(x: number, z: number, h: number): number | null {
    if (!DZ_WALL_MNT || !this.shape || !this.mOf || h < (this.shape.riverbed ? this.shape.riverbed(x, z) - this.datum : this.floor)) return null
    if (this.bandW(x, z) <= 0) return null
    const m = this.mOf(x, z); return m === null ? null : m - this.datum
  }
  inside(x: number, z: number): boolean { return this.shape ? this.shape.inside(x, z) : inRing(this.ring, x, z) }
  /** the band's weight at a point: 1 inside and out to band[0] m, easing to 0 over band[1] m more (0 with no band) */
  bandW(x: number, z: number): number {
    if (this.inside(x, z)) return 1
    const [a, b] = this.band; if (!a && !b) return 0
    const d = this.shape ? this.shape.out(x, z) : nearOnRing(this.ring, x, z).d
    return d <= a ? 1 : d >= a + b ? 0 : 1 - (d - a) / b
  }
  distOut(x: number, z: number): number { return this.inside(x, z) ? 0 : this.shape ? this.shape.out(x, z) : nearOnRing(this.ring, x, z).d }
  /** inside, or within m of the outline (never for the band: the city's quay walls stand in it) */
  near(x: number, z: number, m: number): boolean { return !this.shape && (this.inside(x, z) || nearOnRing(this.ring, x, z).d < m) }
  level(name: string): number { const l = this.levels.find((v) => v.name === name); if (!l) throw new Error(`deck zone ${this.spec.name}: no level ${name}`); return l.y }
  /** a level's height at a point: `alt`, or along its `slope` from `alt` at `from` to `altTo` at `to` (held level beyond either end) */
  private yOf(l: DeckZone['levels'][number], x: number, z: number): number {
    const s = l.slope
    if (!s) return l.y
    const dx = s.bx - s.ax, dz = s.bz - s.az, t = Math.max(0, Math.min(1, ((x - s.ax) * dx + (z - s.az) * dz) / (dx * dx + dz * dz || 1)))
    return l.y + (s.yb - l.y) * t
  }
  levelYAt(name: string, x: number, z: number): number { this.level(name); return this.yOf(this.levels.find((v) => v.name === name)!, x, z) }
  /** the level's height at a point inside the zone (a ringed level first, else the default) */
  levelAt(x: number, z: number, exact = false): number {
    if (this.gOf) { const g = this.gOf(x, z, exact); if (g !== null) return g - this.datum; return this.yOf(this.levels.find((l) => !l.ring) ?? this.levels[0], x, z) }
    for (const l of this.levels) if (l.ring && inRing(l.ring, x, z)) return this.yOf(l, x, z)
    return this.yOf(this.levels.find((l) => !l.ring) ?? this.levels[0], x, z)
  }
  /** the ground at a post: the level inside, eased back to `h` over the fade outside; null where it leaves the post alone */
  groundAt(x: number, z: number, h: number): number | null {
    if (this.shape) {
      // the band: no levels; the BD TOPO ground where a road is in sight, eased out at the edge; the riverbed and the rest left alone
      if (h < (this.shape.riverbed ? this.shape.riverbed(x, z) - this.datum : this.floor) || !this.gOf) return null
      const w = this.bandW(x, z); if (w <= 0) return null
      const g = this.gOf(x, z); if (g === null) return null
      const y = g - this.datum + (h - (g - this.datum)) * (1 - w)
      // (DZ_MNT_CAP, 2026-11-10: the BD TOPO blend plateaus at the height of ramps BD TOPO calls ground — the A4 Bretelles at 5.4–6.0 by
      //  Pont National, over an MNT of 3.0 — and stood 3 m over the lidar's open ground, over the bike path beside them)
      if (DZ_MNT_CAP !== null && this.mOf) { const m = this.mOf(x, z); if (m !== null && y > m - this.datum + DZ_MNT_CAP) return m - this.datum + DZ_MNT_CAP }
      return y
    }
    if (this.inside(x, z)) return this.levelAt(x, z)
    if (h < this.floor) return null
    const n = nearOnRing(this.ring, x, z)
    if (n.d >= Math.max(this.fade, this.band[0] + this.band[1])) return null
    // (out past a river wall: the riverbed, under the water — not the old bank faded back in, a grass slope standing out of the river)
    if (this.river.length && n.d < DZ_RIVER_REACH && nearOnSegs(this.river, x, z) < n.d + 0.5) return Math.min(h, this.floor - DZ_RIVER_DEPTH)
    // BD TOPO mode, the band: the sight-blended ground in full, then eased back to the map's own
    if (this.gOf && this.band[0] + this.band[1] > 0) {
      const g = this.gOf(x, z), w = this.bandW(x, z)
      if (g !== null) return g - this.datum + (h - (g - this.datum)) * (1 - w)
    }
    if (n.d >= this.fade) return null
    // the level just inside the nearest outline point
    const ix = n.x + (n.x - x) / (n.d || 1) * 0.5, iz = n.z + (n.z - z) / (n.d || 1) * 0.5
    const L = this.levelAt(ix, iz), k = n.d / this.fade
    return L + (h - L) * k
  }
  /** The RIVER walls: along the zone's own outline where the ground outside is the riverbed (below `noFadeBelow`), from the level
   *  inside down to it. They replace the city's quay walls inside the zone (tools/bake.ts), which stood on the old bank. */
  /** the zone's box with its fade, local metres */
  box(): [number, number, number, number] {
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
    for (let i = 0; i < this.ring.length; i += 2) { x0 = Math.min(x0, this.ring[i]); x1 = Math.max(x1, this.ring[i]); z0 = Math.min(z0, this.ring[i + 1]); z1 = Math.max(z1, this.ring[i + 1]) }
    const r = Math.max(this.fade, this.band[0] + this.band[1])
    if (this.shape) { const [a, b, c, d] = this.shape.box, q = this.band[0] + this.band[1] + 2; return [a - q, b - q, c + q, d + q] }
    return [x0 - r, z0 - r, x1 + r, z1 + r]
  }
  /** the outline's segments with the river outside them (ring point index pairs, flat x, z), from the ground before levelling */
  private river: number[] = []
  markRiver(ground: (x: number, z: number) => number): number {
    const r = this.ring
    for (let i = 0; i < r.length; i += 2) {
      const j = (i + 2) % r.length, L = Math.hypot(r[j] - r[i], r[j + 1] - r[i + 1]) || 1, ux = (r[j] - r[i]) / L, uz = (r[j + 1] - r[i + 1]) / L
      const mx = (r[i] + r[j]) / 2, mz = (r[i + 1] + r[j + 1]) / 2, sgn = this.inside(mx - uz * DZ_RIVER_PROBE, mz + ux * DZ_RIVER_PROBE) ? -1 : 1
      // (several probes: a ring drawn a few metres off the quay's edge read the old bank's slope at 4 m, and the river wall came in pieces)
      if (DZ_RIVER_PROBES.some((p) => ground(mx - uz * p * sgn, mz + ux * p * sgn) < this.floor)) this.river.push(r[i], r[i + 1], r[j], r[j + 1])
    }
    return this.river.length / 4
  }
  riverWalls(ground: (x: number, z: number) => number): QuayWall[] {
    const out: QuayWall[] = [], r = this.ring
    for (let i = 0; i < r.length; i += 2) {
      const j = (i + 2) % r.length, L = Math.hypot(r[j] - r[i], r[j + 1] - r[i + 1]), n = Math.max(1, Math.round(L / DZ_WALL_STEP))
      const ux = (r[j] - r[i]) / (L || 1), uz = (r[j + 1] - r[i + 1]) / (L || 1)
      for (let k = 0; k < n; k++) {
        const ax = r[i] + (r[j] - r[i]) * k / n, az = r[i + 1] + (r[j + 1] - r[i + 1]) * k / n
        const bx = r[i] + (r[j] - r[i]) * (k + 1) / n, bz = r[i + 1] + (r[j + 1] - r[i + 1]) * (k + 1) / n
        const mx = (ax + bx) / 2, mz = (az + bz) / 2, lx = mx - uz * DZ_WALL_PROBE, lz = mz + ux * DZ_WALL_PROBE, rx = mx + uz * DZ_WALL_PROBE, rz = mz - ux * DZ_WALL_PROBE
        const leftIn = this.inside(lx, lz)
        if (leftIn === this.inside(rx, rz)) continue
        const [ix, iz, ox, oz] = leftIn ? [lx, lz, rx, rz] : [rx, rz, lx, lz]
        // (a second probe further out: at 1.2 m the 1 m ground interpolates with the posts inside on an oblique edge, and the wall came in pieces)
        const fx = ox + (ox - ix) / (2 * DZ_WALL_PROBE) * (DZ_RIVER_PROBE - DZ_WALL_PROBE), fz = oz + (oz - iz) / (2 * DZ_WALL_PROBE) * (DZ_RIVER_PROBE - DZ_WALL_PROBE)
        if (!(ground(ox, oz) < this.floor) && !(this.river.length && nearOnSegs(this.river, mx, mz) < 0.5 && ground(fx, fz) < this.floor)) continue
        const top = this.levelAt(ix, iz), low = Number.isFinite(this.floor) ? this.floor - DZ_RIVER_DEPTH : ground(ox, oz)
        // the low side (the river) on the LEFT of a → b
        if (leftIn) out.push({ ax: r2(bx), az: r2(bz), bx: r2(ax), bz: r2(az), top: r2(top), low: r2(low), cap: DZ_WALL_CAP, parapet: DZ_RIVER_PARAPET })
        else out.push({ ax: r2(ax), az: r2(az), bx: r2(bx), bz: r2(bz), top: r2(top), low: r2(low), cap: DZ_WALL_CAP, parapet: DZ_RIVER_PARAPET })
      }
    }
    return out
  }
  /** THE BD TOPO WALLS AS RUNS (DZ_WALL_RUNS, 2026-11-09; owner: "they stop and start too often and dont curve with the quai"). Each line
   *  is smoothed (Chaikin, corners under DZ_WALL_CORNER only) and cut into DZ_WALL_STEP pieces; each piece's sides are read
   *  DZ_WALL_READ m out (the ground the renderer reads beside the stone, city/wall-ground.ts); a run starts where they differ by
   *  DZ_WALL_MIN and carries on while they differ by DZ_WALL_KEEP the same way; gaps up to DZ_WALL_GAP m between runs facing the same
   *  way are filled, runs under DZ_WALL_RUN_MIN m dropped, and top and low smoothed along each run over ±DZ_WALL_SMOOTH m. */
  private runWalls(tally: (k: string, x: number, z: number) => void, shipped?: (x: number, z: number) => number): QuayWall[] {
    const out: QuayWall[] = []
    // (DZ_WALL_SHIPPED: the sides off the ground as shipped — the band's, a hand zone's over it, the road bed — not the BD TOPO blend alone:
    //  a wall measured on the blend stood where the shipped ground had no step, or none where it had)
    const side = (x: number, z: number, exact: boolean): number | null => {
      if (DZ_WALL_SHIPPED && shipped) return shipped(x, z)
      const g = this.gOf!(x, z, exact) ?? (DZ_WALL_MNT && this.mOf ? this.mOf(x, z) : null)
      return g === null ? null : g - this.datum
    }
    for (const raw of this.lines) {
      const r = chaikin(raw, DZ_WALL_CHAIKIN, DZ_WALL_CORNER)
      // the pieces along the whole line, evenly
      const cum = [0]; for (let i = 2; i < r.length; i += 2) cum.push(cum[cum.length - 1] + Math.hypot(r[i] - r[i - 2], r[i + 1] - r[i - 1]))
      const L = cum[cum.length - 1], n = Math.max(1, Math.round(L / DZ_WALL_STEP))
      if (L < 0.5) continue
      let seg = 0
      const at = (d: number): [number, number] => {
        while (seg < cum.length - 2 && cum[seg + 1] < d) seg++
        const t = (d - cum[seg]) / ((cum[seg + 1] - cum[seg]) || 1)
        return [r[seg * 2] + (r[seg * 2 + 2] - r[seg * 2]) * t, r[seg * 2 + 1] + (r[seg * 2 + 3] - r[seg * 2 + 1]) * t]
      }
      const P: { ax: number; az: number; bx: number; bz: number; mx: number; mz: number; ok: boolean; yl: number; yr: number }[] = []
      let prev = at(0)
      for (let k = 0; k < n; k++) {
        const b = at(L * (k + 1) / n), [ax, az] = prev, [bx, bz] = b; prev = b
        const len = Math.hypot(bx - ax, bz - az) || 1, ux = (bx - ax) / len, uz = (bz - az) / len
        const mx = (ax + bx) / 2, mz = (az + bz) / 2, lx = mx - uz * DZ_WALL_READ, lz = mz + ux * DZ_WALL_READ, rx = mx + uz * DZ_WALL_READ, rz = mz - ux * DZ_WALL_READ
        let ok = true, yl = 0, yr = 0
        if (!(this.inside(lx, lz) && this.inside(rx, rz)) && !(this.distOut(lx, lz) < this.band[0] && this.distOut(rx, rz) < this.band[0])) { tally('outside', mx, mz); ok = false }
        else {
          const l = this.shape || !this.inside(lx, lz) ? side(lx, lz, true) : this.levelAt(lx, lz, true), q = this.shape || !this.inside(rx, rz) ? side(rx, rz, true) : this.levelAt(rx, rz, true)
          if (l === null || q === null) { tally('noGround', mx, mz); ok = false } else { yl = l; yr = q }
        }
        P.push({ ax, az, bx, bz, mx, mz, ok, yl, yr })
      }
      // hysteresis: +1 high on the right, −1 on the left, 0 none
      const dir = new Array<number>(n).fill(0)
      for (let k = 0, cur = 0; k < n; k++) {
        const p = P[k], d = p.ok ? p.yr - p.yl : 0
        if (cur && p.ok && d * cur >= DZ_WALL_KEEP) dir[k] = cur
        else { cur = p.ok && Math.abs(d) >= DZ_WALL_MIN ? Math.sign(d) : 0; dir[k] = cur }
      }
      // (backwards too: a run's start eases in as its end does)
      for (let k = n - 1, cur = 0; k >= 0; k--) {
        const p = P[k], d = p.ok ? p.yr - p.yl : 0
        if (dir[k]) { cur = dir[k]; continue }
        if (cur && p.ok && d * cur >= DZ_WALL_KEEP) dir[k] = cur; else cur = 0
      }
      // fill short gaps between runs facing the same way
      const gapN = Math.round(DZ_WALL_GAP / (L / n))
      for (let k = 0; k < n; k++) {
        if (dir[k] || k === 0 || !dir[k - 1]) continue
        let e = k; while (e < n && !dir[e]) e++
        if (e < n && e - k <= gapN && dir[e] === dir[k - 1]) { for (let j = k; j < e; j++) { dir[j] = dir[k - 1]; P[j].ok = false } }
        k = e - 1
      }
      // the runs: drop the short, smooth top and low, emit
      const runN = Math.round(DZ_WALL_RUN_MIN / (L / n)), sm = Math.max(0, Math.round(DZ_WALL_SMOOTH / (L / n)))
      for (let k = 0; k < n; k++) {
        if (!dir[k]) continue
        let e = k; while (e < n && dir[e] === dir[k]) e++
        const D = dir[k]
        if (e - k < Math.max(1, runN)) { for (let j = k; j < e; j++) tally('short', P[j].mx, P[j].mz); k = e - 1; continue }
        // top and low per piece (gap pieces: none yet), then filled across the gaps and smoothed
        const top: (number | null)[] = [], low: (number | null)[] = []
        for (let j = k; j < e; j++) { const p = P[j]; top.push(p.ok ? Math.max(p.yl, p.yr) : null); low.push(p.ok ? Math.min(p.yl, p.yr) : null) }
        const T = smoothRun(top, sm), Lo = smoothRun(low, sm)
        for (let j = k; j < e; j++) {
          const p = P[j], t = T[j - k], lo = Math.min(Lo[j - k], t - DZ_WALL_KEEP), parapet = t - lo >= DZ_PARAPET_MIN ? DZ_LEVEL_PARAPET : 0
          tally('kept', p.mx, p.mz)
          if (D > 0) out.push({ ax: r2(p.ax), az: r2(p.az), bx: r2(p.bx), bz: r2(p.bz), top: r2(t), low: r2(lo), cap: DZ_WALL_CAP, parapet })
          else out.push({ ax: r2(p.bx), az: r2(p.bz), bx: r2(p.ax), bz: r2(p.az), top: r2(t), low: r2(lo), cap: DZ_WALL_CAP, parapet })
        }
        k = e - 1
      }
    }
    return out
  }
  /** The walls between levels: along every ringed level's outline, where the two sides inside the zone differ by DZ_WALL_MIN;
   *  the low side on the LEFT of a → b (render/quays.ts: the water's side). */
  walls(why?: { near: (x: number, z: number) => boolean; n: Record<string, number> } | null, shipped?: (x: number, z: number) => number): QuayWall[] {
    const out: QuayWall[] = []
    const tally = (k: string, x: number, z: number): void => { if (why && why.near(x, z)) why.n[k] = (why.n[k] ?? 0) + 1 }
    // BD TOPO mode: walls along the Quai / Mur lines (open polylines) where the ground either side differs
    if (this.gOf && DZ_WALL_RUNS) out.push(...this.runWalls(tally, shipped))
    else if (this.gOf) for (const r of this.lines) {
      for (let i = 0; i + 3 < r.length; i += 2) {
        const L = Math.hypot(r[i + 2] - r[i], r[i + 3] - r[i + 1]), n = Math.max(1, Math.round(L / DZ_WALL_STEP))
        const ux = (r[i + 2] - r[i]) / (L || 1), uz = (r[i + 3] - r[i + 1]) / (L || 1)
        for (let k = 0; k < n; k++) {
          const ax = r[i] + (r[i + 2] - r[i]) * k / n, az = r[i + 1] + (r[i + 3] - r[i + 1]) * k / n
          const bx = r[i] + (r[i + 2] - r[i]) * (k + 1) / n, bz = r[i + 1] + (r[i + 3] - r[i + 1]) * (k + 1) / n
          const mx = (ax + bx) / 2, mz = (az + bz) / 2, lx = mx - uz * DZ_WALL_PROBE, lz = mz + ux * DZ_WALL_PROBE, rx = mx + uz * DZ_WALL_PROBE, rz = mz - ux * DZ_WALL_PROBE
          // (inside the ring, or out in the band's full part: a wall line just past the ring stands too)
          if (!(this.inside(lx, lz) && this.inside(rx, rz)) && !(this.distOut(lx, lz) < this.band[0] && this.distOut(rx, rz) < this.band[0])) { tally('outside', mx, mz); continue }
          let yl = this.levelAt(lx, lz, true), yr = this.levelAt(rx, rz, true)
          if (this.shape || !this.inside(lx, lz) || !this.inside(rx, rz)) { const gl = this.gOf(lx, lz, true) ?? (DZ_WALL_MNT && this.mOf ? this.mOf(lx, lz) : null), gr = this.gOf(rx, rz, true) ?? (DZ_WALL_MNT && this.mOf ? this.mOf(rx, rz) : null); if (gl === null || gr === null) { tally('noGround', mx, mz); continue } yl = gl - this.datum; yr = gr - this.datum }
          if (Math.abs(yl - yr) < DZ_WALL_MIN) { tally('flat', mx, mz); continue }
          tally('kept', mx, mz)
          const top = Math.max(yl, yr), low = Math.min(yl, yr), parapet = top - low >= DZ_PARAPET_MIN ? DZ_LEVEL_PARAPET : 0
          if (yl < yr) out.push({ ax: r2(ax), az: r2(az), bx: r2(bx), bz: r2(bz), top: r2(top), low: r2(low), cap: DZ_WALL_CAP, parapet })
          else out.push({ ax: r2(bx), az: r2(bz), bx: r2(ax), bz: r2(az), top: r2(top), low: r2(low), cap: DZ_WALL_CAP, parapet })
        }
      }
    }
    if (!this.gOf) for (const l of this.levels) {
      if (!l.ring) continue
      const r = l.ring
      for (let i = 0; i < r.length; i += 2) {
        const j = (i + 2) % r.length, L = Math.hypot(r[j] - r[i], r[j + 1] - r[i + 1]), n = Math.max(1, Math.round(L / DZ_WALL_STEP))
        const ux = (r[j] - r[i]) / (L || 1), uz = (r[j + 1] - r[i + 1]) / (L || 1)
        for (let k = 0; k < n; k++) {
          const ax = r[i] + (r[j] - r[i]) * k / n, az = r[i + 1] + (r[j + 1] - r[i + 1]) * k / n
          const bx = r[i] + (r[j] - r[i]) * (k + 1) / n, bz = r[i + 1] + (r[j + 1] - r[i + 1]) * (k + 1) / n
          const mx = (ax + bx) / 2, mz = (az + bz) / 2, lx = mx - uz * DZ_WALL_PROBE, lz = mz + ux * DZ_WALL_PROBE, rx = mx + uz * DZ_WALL_PROBE, rz = mz - ux * DZ_WALL_PROBE
          if (!this.inside(lx, lz) || !this.inside(rx, rz)) continue
          const yl = this.levelAt(lx, lz), yr = this.levelAt(rx, rz)
          if (Math.abs(yl - yr) < DZ_WALL_MIN) continue
          const top = Math.max(yl, yr), low = Math.min(yl, yr), parapet = top - low >= DZ_PARAPET_MIN ? DZ_LEVEL_PARAPET : 0
          if (yl < yr) out.push({ ax: r2(ax), az: r2(az), bx: r2(bx), bz: r2(bz), top: r2(top), low: r2(low), cap: DZ_WALL_CAP, parapet })
          else out.push({ ax: r2(bx), az: r2(bz), bx: r2(ax), bz: r2(az), top: r2(top), low: r2(low), cap: DZ_WALL_CAP, parapet })
        }
      }
    }
    // the same piece from two rings: keep one
    const seen = new Set<string>()
    return out.filter((w) => { const k = [Math.round((w.ax + w.bx) * 2), Math.round((w.az + w.bz) * 2)].join(','); if (seen.has(k)) return false; seen.add(k); return true })
  }
}

function nearOnSegs(s: number[], x: number, z: number): number {
  let d = Infinity
  for (let i = 0; i < s.length; i += 4) {
    const dx = s[i + 2] - s[i], dz = s[i + 3] - s[i + 1], t = Math.max(0, Math.min(1, ((x - s[i]) * dx + (z - s[i + 1]) * dz) / (dx * dx + dz * dz || 1)))
    d = Math.min(d, Math.hypot(s[i] + dx * t - x, s[i + 1] + dz * t - z))
  }
  return d
}

export const deckZonesOf = (specs: DeckZoneSpec[] | undefined, toLocal: LL, datum: number): DeckZone[] => (specs ?? []).map((s) => new DeckZone(s, toLocal, datum))

/** Level a ground grid in place (row-major, post (r, c) at (x0 + c·step, z0 + r·step)). Returns the posts changed. */
export function levelGroundGrid(zones: DeckZone[], h: ArrayLike<number> & { [i: number]: number }, cols: number, rows: number, x0: number, z0: number, step: number): number {
  let n = 0
  for (const zn of zones) {
    const [bx0, bz0, bx1, bz1] = zn.box()
    const c0 = Math.max(0, Math.floor((bx0 - x0) / step)), c1 = Math.min(cols - 1, Math.ceil((bx1 - x0) / step))
    const r0 = Math.max(0, Math.floor((bz0 - z0) / step)), r1 = Math.min(rows - 1, Math.ceil((bz1 - z0) / step))
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
      const i = r * cols + c, y = zn.groundAt(x0 + c * step, z0 + r * step, h[i])
      if (y !== null) { h[i] = r2(y); n++ }
    }
  }
  return n
}

const usable = (e: PackedEdge): boolean => !!e.heights && e.heights.length * 2 === e.points.length

/** split `e` at vertex i (0 < i < n−1): `e` keeps 0..i, a new edge i..n−1; a new node between them. Per-vertex arrays follow. */
function splitAt(edges: PackedEdge[], e: PackedEdge, i: number, edgeId: number, nodeId: number): PackedEdge {
  const n = e.points.length / 2, tail = { ...e, id: edgeId, a: nodeId } as PackedEdge
  for (const [k, v] of Object.entries(e)) {
    if (!Array.isArray(v)) continue
    if (v.length === n) { (tail as any)[k] = v.slice(i); (e as any)[k] = v.slice(0, i + 1) }
    else if (v.length === 2 * n) { (tail as any)[k] = v.slice(2 * i); (e as any)[k] = v.slice(0, 2 * i + 2) }
  }
  e.b = nodeId
  edges.push(tail)
  return tail
}

/** a profile reversing (> 0.2 m) DZ_FOOT_REV or more times replaced by its monotone least-squares fit (pool-adjacent-violators) in the
 *  direction of its ends, the ends held; true if changed */
function monotone(h: number[], minRev = DZ_FOOT_REV, humpOk = false): boolean {
  const dh = humpOk ? DZ_FOOT_REV_DH : 0.2
  let rev = 0, dir = 0, hi = h[0], lo0 = h[0], maxima = 0
  for (let i = 1; i < h.length; i++) {
    hi = Math.max(hi, h[i]); lo0 = Math.min(lo0, h[i])
    if (dir !== -1 && hi - h[i] > dh) { if (dir) { rev++; maxima++ } dir = -1; lo0 = h[i] } else if (dir !== 1 && h[i] - lo0 > dh) { if (dir) rev++; dir = 1; hi = h[i] }
  }
  // (a generic arched footbridge: ONE hump is its arch, kept; a lone dip, or two reversals or more, is flattened)
  if (humpOk && rev === 1 && maxima === 1) return false
  if (rev < (humpOk ? 1 : minRev) || h.length < 3) return false
  const up = h[h.length - 1] >= h[0], v = up ? h.slice(1, -1) : h.slice(1, -1).map((x) => -x)
  const blocks: { s: number; n: number }[] = []
  for (const x of v) { blocks.push({ s: x, n: 1 }); while (blocks.length > 1 && blocks[blocks.length - 2].s / blocks[blocks.length - 2].n > blocks[blocks.length - 1].s / blocks[blocks.length - 1].n) { const b = blocks.pop()!; blocks[blocks.length - 1].s += b.s; blocks[blocks.length - 1].n += b.n } }
  const e0 = Math.min(h[0], h[h.length - 1]), e1 = Math.max(h[0], h[h.length - 1])
  let i = 1
  for (const b of blocks) for (let k = 0; k < b.n; k++) { const y = up ? b.s / b.n : -b.s / b.n; h[i++] = r2(Math.max(e0, Math.min(e1, y))) }
  return true
}
/** arc length along a way's vertices */
const arcOf = (e: PackedEdge): number[] => { const L = [0]; for (let i = 2; i < e.points.length; i += 2) L.push(L[L.length - 1] + Math.hypot(e.points[i] - e.points[i - 2], e.points[i + 1] - e.points[i - 1])); return L }
/** nulls interpolated along the way between known values, held past the ends; null if none is known */
const fillAlong = (L: number[], f: (number | null)[]): number[] | null => {
  if (!f.some((v) => v !== null)) return null
  return f.map((v, i) => {
    if (v !== null) return v
    let a = i - 1; while (a >= 0 && f[a] === null) a--
    let b = i + 1; while (b < f.length && f[b] === null) b++
    return a >= 0 && b < f.length ? f[a]! + (f[b]! - f[a]!) * (L[i] - L[a]) / (L[b] - L[a] || 1) : a >= 0 ? f[a]! : f[b]!
  })
}
/** a triangular low-pass along the way, `win` m wide */
const smoothAlong = (L: number[], f: number[], win: number): number[] => f.map((_, i) => {
  let sw = 0, sz = 0
  for (let j = 0; j < f.length; j++) { const w = 1 - Math.abs(L[j] - L[i]) / (win / 2); if (w > 0) { sw += w; sz += w * f[j] } }
  return sz / sw
})
const segCross = (ax: number, az: number, bx: number, bz: number, cx: number, cz: number, dx: number, dz: number): boolean => {
  const o = (px: number, pz: number, qx: number, qz: number, rx: number, rz: number) => Math.sign((qx - px) * (rz - pz) - (qz - pz) * (rx - px))
  return o(ax, az, bx, bz, cx, cz) * o(ax, az, bx, bz, dx, dz) < 0 && o(cx, cz, dx, dz, ax, az) * o(cx, cz, dx, dz, bx, bz) < 0
}
/** THE BAND'S UNMATCHED AT-GRADE WAYS (REF_*): one reference per way, one offset, smoothed along it; else the MNT along it */
function bandUnmatched(zn: DeckZone, pend: PackedEdge[], matched: Set<PackedEdge>, edges: PackedEdge[]): { moved: PackedEdge[]; pts: number; ref: number; mnt: number; none: number } {
  type Sg = { e: PackedEdge | null; i: number; ax: number; az: number; bx: number; bz: number }
  const B = 32, K = (i: number, j: number) => `${i},${j}`
  const grid = (segs: Sg[]) => {
    const g = new Map<string, Sg[]>()
    for (const q of segs) for (let j = Math.floor(Math.min(q.az, q.bz) / B); j <= Math.floor(Math.max(q.az, q.bz) / B); j++)
      for (let i = Math.floor(Math.min(q.ax, q.bx) / B); i <= Math.floor(Math.max(q.ax, q.bx) / B); i++) (g.get(K(i, j)) ?? g.set(K(i, j), []).get(K(i, j))!).push(q)
    return (x0: number, z0: number, x1: number, z1: number): Set<Sg> => {
      const out = new Set<Sg>()
      for (let j = Math.floor(z0 / B); j <= Math.floor(z1 / B); j++) for (let i = Math.floor(x0 / B); i <= Math.floor(x1 / B); i++) for (const q of g.get(K(i, j)) ?? []) out.add(q)
      return out
    }
  }
  const refs: Sg[] = [], walls: Sg[] = []
  for (const r of matched) {
    if (r.bridge || r.tunnel || (r.layer ?? 0) < 0 || r.ramp || r.kind === 'steps' || !usable(r)) continue
    for (let i = 0; i + 3 < r.points.length; i += 2) refs.push({ e: r, i: i / 2, ax: r.points[i], az: r.points[i + 1], bx: r.points[i + 2], bz: r.points[i + 3] })
  }
  for (const l of zn.lines) for (let i = 0; i + 3 < l.length; i += 2) walls.push({ e: null, i, ax: l[i], az: l[i + 1], bx: l[i + 2], bz: l[i + 3] })
  const rI = grid(refs), wI = grid(walls)
  const keyOf = (r: PackedEdge): string => r.name ?? `#${r.id}`
  // the nearest reference point within R in sight (no wall line between), of the named reference if given
  const near = (x: number, z: number, R: number, want?: string): { k: string; d: number; y: number; px: number; pz: number } | null => {
    let best: { k: string; d: number; y: number; px: number; pz: number } | null = null
    for (const q of rI(x - R, z - R, x + R, z + R)) {
      const k = keyOf(q.e!); if (want !== undefined && k !== want) continue
      const dx = q.bx - q.ax, dz = q.bz - q.az, t = Math.max(0, Math.min(1, ((x - q.ax) * dx + (z - q.az) * dz) / (dx * dx + dz * dz || 1)))
      const px = q.ax + dx * t, pz = q.az + dz * t, d = Math.hypot(px - x, pz - z)
      if (d > R || (best && best.d <= d)) continue
      if ([...wI(Math.min(x, px), Math.min(z, pz), Math.max(x, px), Math.max(z, pz))].some((w) => segCross(x, z, px, pz, w.ax, w.az, w.bx, w.bz))) continue
      const h = q.e!.heights!
      best = { k, d, y: h[q.i] + (h[q.i + 1] - h[q.i]) * t, px, pz }
    }
    return best
  }
  const meas = (x: number, z: number): number | null => { const v = zn.mOf ? zn.mOf(x, z) : null; return v !== null ? v - zn.datum : null }
  // the decks' end heights at their nodes (the highest where several meet)
  const deckAt = new Map<number, number>()
  for (const b of edges) if (b.bridge && !b.tunnel && usable(b) && b.kind !== 'steps') for (const [v, y] of [[b.a, b.heights![0]], [b.b, b.heights![b.heights!.length - 1]]] as const) deckAt.set(v, Math.max(deckAt.get(v) ?? -Infinity, y))
  const moved: PackedEdge[] = []
  let pts = 0, nRef = 0, nMnt = 0, nNone = 0
  for (const e of pend) {
    const h = e.heights!, n = h.length, L = arcOf(e), P = e.points
    const wt = (i: number) => ((L[Math.min(i + 1, n - 1)] - L[Math.max(i - 1, 0)]) / 2) || 1, tot = L[n - 1] || 1
    const vote = new Map<string, number>()
    for (let i = 0; i < n; i++) { const q = near(P[2 * i], P[2 * i + 1], REF_R); if (q) vote.set(q.k, (vote.get(q.k) ?? 0) + wt(i)) }
    const [k, v] = [...vote.entries()].sort((a, b) => b[1] - a[1])[0] ?? ['', 0]
    let prof: number[] | null = null
    if (v >= REF_COVER * (n > 1 ? tot : 1)) {
      const hr: (number | null)[] = [], diff: number[] = []
      for (let i = 0; i < n; i++) {
        const x = P[2 * i], z = P[2 * i + 1], q = near(x, z, REF_REACH, k)
        hr.push(q ? q.y : null); if (!q) continue
        const a = meas(x, z), b = meas(q.px, q.pz), g = zn.gOf ? zn.gOf(x, z) : null
        if (a !== null && b !== null) diff.push(a - b); else if (g !== null) diff.push(g - zn.datum - q.y)
      }
      diff.sort((a, b) => a - b)
      const off = diff.length ? diff[diff.length >> 1] : 0, f = fillAlong(L, hr)
      if (f && Math.abs(off) <= REF_OFF_MAX) { prof = f.map((y) => y + off); nRef++ }
    }
    if (!prof) {
      const f = fillAlong(L, P.filter((_, i) => i % 2 === 0).map((x, i) => { const m = meas(x, P[2 * i + 1]); if (m !== null) return m; const g = zn.gOf ? zn.gOf(x, P[2 * i + 1]) : null; return g !== null ? g - zn.datum : null }))
      if (f) { prof = f; nMnt++ } else { nNone++; continue }
    }
    prof = smoothAlong(L, prof, REF_SMOOTH)
    // an end on a bridge's node climbs to the deck's end (the junction pass would only ease 15 m, and not to an unmatched deck)
    for (const end of [0, 1] as const) {
      const v = end ? e.b : e.a, dk = deckAt.get(v); if (dk === undefined) continue
      const j0 = end ? n - 1 : 0, dh = dk - prof[j0], reach = Math.max(DZ_NODE_EASE, Math.abs(dh) / REF_DECK_GRADE)
      for (let k = 0; k < n; k++) { const i = end ? n - 1 - k : k, s = Math.abs(L[i] - L[j0]), w = 1 - s / reach; if (w <= 0) break; prof[i] += dh * w }
    }
    let any = false
    for (let i = 0; i < n; i++) {
      const w = zn.bandW(P[2 * i], P[2 * i + 1]); if (w <= 0) continue
      const y = r2(h[i] + (prof[i] - h[i]) * w)
      if (Math.abs(y - h[i]) > 0.01) { h[i] = y; any = true; pts++ }
    }
    if (any) moved.push(e)
    if (e.ramp) { let above = 0; for (let i = 0; i < n; i++) { const g = zn.gOf ? zn.gOf(P[2 * i], P[2 * i + 1]) : null; if (g !== null) above = Math.max(above, h[i] - (g - zn.datum)) } if (above <= DZ_RAMP_ABOVE) delete e.ramp }
  }
  return { moved, pts, ref: nRef, mnt: nMnt, none: nNone }
}

/**
 * The zones' routes: drop, split and lay (full bake: `full`), then pin and grade (always). Last edge-height writer for the zone:
 * run after the survey pins and the level plans.
 */
export function applyDeckZoneRoutes(edges: PackedEdge[], zones: DeckZone[], toLocal: LL, full: boolean): { moved: Set<PackedEdge>; log: string[] } {
  const moved = new Set<PackedEdge>(), log: string[] = []
  let eid = DZ_ID0, nid = DZ_NODE0
  for (const e of edges) { if (e.id >= DZ_ID0 && e.id < DZ_NODE0) eid = Math.max(eid, e.id + 1); for (const v of [e.a, e.b]) if (v >= DZ_NODE0) nid = Math.max(nid, v + 1) }
  for (const zn of zones) {
    const S = zn.spec, inside = (e: PackedEdge) => { let k = 0; for (let i = 0; i < e.points.length; i += 2) if (zn.inside(e.points[i], e.points[i + 1])) k++; return k }
    if (full) {
      const drop = matcher(S.drop)
      let dropped = 0
      for (let i = edges.length - 1; i >= 0; i--) {
        const e = edges[i]
        if (e.bridge || !drop(e)) continue
        if (inside(e) >= DZ_DROP_FRAC * e.points.length / 2) { edges.splice(i, 1); dropped++ }
      }
      log.push(`deck zone ${S.name}: ${dropped} ways dropped (deck↔quai stubs)`)
      for (const lay of S.lay ?? []) {
        const end = (q: { at: LLp; way: string }): { x: number; z: number; h: number; n: number } | null => {
          const at = toLocal(q.at[0], q.at[1])
          let best: { e: PackedEdge; i: number; d: number } | null = null
          for (const e of edges) {
            if (!usable(e) || e.bridge || (e.name ?? e.kind) !== q.way) continue
            for (let i = 0; i < e.points.length / 2; i++) { const d = Math.hypot(e.points[2 * i] - at.x, e.points[2 * i + 1] - at.z); if (!best || d < best.d) best = { e, i, d } }
          }
          if (!best || best.d > 25) return null
          const { e, i } = best, n = e.points.length / 2
          const node = i === 0 ? e.a : i === n - 1 ? e.b : (splitAt(edges, e, i, eid++, nid), nid++)
          return { x: e.points[2 * Math.min(i, e.points.length / 2 - 1)], z: e.points[2 * Math.min(i, e.points.length / 2 - 1) + 1], h: 0, n: node }
        }
        const a = end(lay.from), b = lay.to ? end(lay.to) : null
        if (!a) { log.push(`deck zone ${S.name}, ${lay.name}: no ${lay.from.way} within 25 m of its start`); continue }
        const line = [{ x: a.x, z: a.z }, ...lay.via.map(([lat, lon]) => toLocal(lat, lon)), ...(b ? [{ x: b.x, z: b.z }] : [])]
        const pts: number[] = [line[0].x, line[0].z]
        for (let i = 1; i < line.length; i++) {
          const p = line[i - 1], q = line[i], m = Math.max(1, Math.round(Math.hypot(q.x - p.x, q.z - p.z) / DZ_LAY_STEP))
          for (let k = 1; k <= m; k++) pts.push(r2(p.x + (q.x - p.x) * k / m), r2(p.z + (q.z - p.z) * k / m))
        }
        const y = zn.level(lay.level), tpl = edges.find((e) => e.name === lay.from.way && usable(e))!
        const e: PackedEdge = { ...tpl, id: eid++, a: a.n, b: b ? b.n : nid++, points: pts, heights: pts.filter((_, i) => i % 2 === 0).map(() => r2(y)), name: lay.name, kind: lay.kind as PackedEdge['kind'], ...(lay.width ? { width: lay.width } : {}) }
        for (const k of ['bridge', 'tunnel', 'layer', 'ramp', 'bikeRamp'] as const) delete (e as any)[k]
        for (const [k, v] of Object.entries(e)) if (Array.isArray(v) && k !== 'points' && k !== 'heights') delete (e as any)[k]
        edges.push(e); moved.add(e)
        log.push(`deck zone ${S.name}: laid ${lay.name} (${lay.kind}) on ${lay.level}, ${pts.length / 2} points, ${b ? 'joined both ends' : 'a dead end'}`)
      }
    }
    // pin: every way inside to a level (the pinned ones to theirs, the free ones left, the rest to the ground's level there)
    // (DZ_BAND_FREE_DECKS: in the band every bridge is free, the ways meeting its ends ease to it; off, a deck's end eases to the
    //  BD TOPO junction like any other way: Garigliano's right-bank end stood 2.4 m over its quai in 22 m with it on, 2026-11-08)
    const free0 = matcher(S.free), free = (e: PackedEdge): boolean => free0(e) || (!!zn.shape && !!e.bridge && (DZ_BAND_FREE_DECKS || (DZ_BAND_OWN_LEVELS && ownLevels(e.name)))), pins = (S.pin ?? []).map((p) => ({ hit: matcher([p]), level: (zn.level(p.level), p.level) }))
    let n = 0, pts = 0, nbt = 0, nramp = 0
    const btHit = new Set<PackedEdge>(), btDeck = new Set<PackedEdge>()
    // (the band: its unmatched at-grade ways, graded after the matched ones from ONE reference each (REF_*); its stairs, after the
    //  junctions (DZ_BAND_STEPS_LINEAR); its highway-type ways off the bike graph)
    const pend: PackedEdge[] = [], stairs: PackedEdge[] = []
    const pendSet = new Set<PackedEdge>()
    let nNoBike = 0
    if (zn.shape) for (const e of edges) {
      if (e.noBike || !(DZ_BAND_NO_BIKE.test(e.kind ?? '') || (e.tunnel && !DZ_BAND_NO_BIKE_TUNNEL_OK.test(e.kind ?? '')))) continue
      let inb = false; for (let i = 0; i < e.points.length && !inb; i += 2) inb = zn.inside(e.points[i], e.points[i + 1])
      if (inb) { e.noBike = true; nNoBike++ }
    }
    for (const e of edges) {
      // (bridges stay out of a ring zone: matching them to BD TOPO's sol-1 decks was tried in round 2 and broke the Périphérique slip
      //  at the ring; in the band, DZ_BAND_BT_DECKS, a matched deck takes BD TOPO's z: the band eases out over 40 m, not at a ring)
      // (a held own-levels foot bridge in the band is still made monotone, from ONE reversal (ownLevelDecks lays flat or ramped arms): the Passerelle's arm 544 humped 1.6 m on its flat run)
      if (zn.shape && free(e) && e.bridge && usable(e) && DZ_FOOT_MONO && FOOT_KIND.test(e.kind ?? '') && zn.bandW(e.points[0], e.points[1]) > 0 && monotone(e.heights!, 1)) { n++; moved.add(e) }
      if (!usable(e) || (e.bridge && !(zn.shape && DZ_BAND_BT_DECKS)) || free(e) || (e.id >= DZ_ID0 && e.id < DZ_NODE0)) continue
      if (zn.shape) {
        // THE BAND: a matched way takes BD TOPO's z, any other at-grade way the BD TOPO ground (the nearest roads in sight, no
        // levels), both weighted by the band (1 inside, easing out); steps, tunnels, layered and ramped ways only meet junctions
        const [x0, z0, x1, z1] = zn.box()
        if (!e.points.some((_, i) => i % 2 === 0 && e.points[i] >= x0 && e.points[i] <= x1 && e.points[i + 1] >= z0 && e.points[i + 1] <= z1 && zn.bandW(e.points[i], e.points[i + 1]) > 0)) continue
        const bz = zn.zOf!(e, edges) as ((number | null)[] & { span?: [number, number] }) | null
        if (e.bridge) {
          // a deck: BD TOPO's sol-1 z over its matched run, weighted by the band; unmatched decks are left to bridgeHeights, but an
          // unmatched FOOT bridge that reverses DZ_FOOT_REV times is made monotone between its ends (pool-adjacent-violators)
          if (!bz) { if (DZ_FOOT_MONO && FOOT_KIND.test(e.kind ?? '') && monotone(e.heights!, DZ_FOOT_REV, true)) { n++; moved.add(e) } continue }
          let any = false
          const orig = e.heights!.slice()
          for (let i = bz.span![0]; i <= bz.span![1]; i++) {
            const w = zn.bandW(e.points[2 * i], e.points[2 * i + 1]); if (w <= 0 || bz[i] === null) continue
            const y = r2(e.heights![i] + (bz[i]! - zn.datum - e.heights![i]) * w)
            if (Math.abs(y - e.heights![i]) > 0.01) { e.heights![i] = y; any = true; pts++ }
          }
          // (DZ_DECK_TAIL) the way's vertices past BD TOPO's matched run keep bridgeHeights' guess: carry the shift at the run's
          //  end out along them, tapered over max(DZ_DECK_TAIL_MIN, shift / DZ_DECK_TAIL_GRADE) m (Pont de Sèvres: the deck at
          //  BD TOPO's 5.4 for 17 m, then its OSM-guessed 3.2 at the next vertex: a 2.2 m drop in 4 m)
          if (DZ_DECK_TAIL) for (const side of [0, 1] as const) {
            const m = e.heights!.length, i0 = side ? bz.span![1] : bz.span![0]
            if (side ? i0 >= m - 1 : i0 <= 0) continue
            const d = bz[i0] === null ? 0 : e.heights![i0] - orig[i0]; if (Math.abs(d) < 0.05) continue
            // (never past the way's end: a shifted end vertex stepped against the ways meeting it, 8.3 m at a Sèvres footbridge)
            let rest = 0
            for (let i = side ? i0 + 1 : i0 - 1; side ? i < m : i >= 0; i += side ? 1 : -1) { const j = side ? i - 1 : i + 1; rest += Math.hypot(e.points[2 * i] - e.points[2 * j], e.points[2 * i + 1] - e.points[2 * j + 1]) }
            const T = Math.min(rest, Math.max(DZ_DECK_TAIL_MIN, Math.abs(d) / DZ_DECK_TAIL_GRADE))
            let sAcc = 0
            for (let i = side ? i0 + 1 : i0 - 1; side ? i < m : i >= 0; i += side ? 1 : -1) {
              const j = side ? i - 1 : i + 1
              sAcc += Math.hypot(e.points[2 * i] - e.points[2 * j], e.points[2 * i + 1] - e.points[2 * j + 1])
              const w = 1 - sAcc / T; if (w <= 0) break
              e.heights![i] = r2(e.heights![i] + d * w); any = true; pts++
            }
          }
          btHit.add(e); btDeck.add(e); nbt++
          if (any) { n++; moved.add(e) }
          continue
        }
        if (bz) { btHit.add(e); nbt++ }
        const lift = !bz && (e.kind === 'steps' || e.tunnel || (e.layer ?? 0) !== 0 || (e.ramp && !REF_RAMPS) || e.bikeRamp)
        if (!bz && e.kind === 'steps' && DZ_BAND_STEPS_LINEAR) stairs.push(e)
        if (!bz && !lift) { pend.push(e); pendSet.add(e); continue }
        let any = false
        if (!lift) for (let i = 0; i < e.heights!.length; i++) {
          const x = e.points[2 * i], z = e.points[2 * i + 1], w = zn.bandW(x, z); if (w <= 0) continue
          const g = bz && bz[i] !== null ? bz[i]! : zn.gOf!(x, z); if (g === null) continue
          const y = r2(e.heights![i] + (g - zn.datum - e.heights![i]) * w)
          if (Math.abs(y - e.heights![i]) > 0.01) { e.heights![i] = y; any = true; pts++ }
        }
        if (any) {
          n++; moved.add(e)
          let above = 0
          if (bz) for (let i = 0; i < e.heights!.length; i++) { const g = zn.gOf!(e.points[2 * i], e.points[2 * i + 1], true); if (g !== null) above = Math.max(above, e.heights![i] - (g - zn.datum)) }
          if (above > DZ_RAMP_ABOVE) { e.ramp = true; nramp++ } else if (bz) delete e.ramp
        }
        continue
      }
      const pin = pins.find((p) => p.hit(e))
      const inBand = zn.zOf && zn.band[0] + zn.band[1] > 0 && !inside(e) && e.points.some((_, i) => i % 2 === 0 && zn.bandW(e.points[i], e.points[i + 1]) > 0)
      const bz = zn.zOf && (inside(e) || inBand) ? zn.zOf(e, edges) as ((number | null)[] & { span?: [number, number] }) | null : null
      if (bz) { btHit.add(e); nbt++ }
      let any = false
      for (let i = 0; i < e.heights!.length; i++) {
        const x = e.points[2 * i], z = e.points[2 * i + 1]
        const nr = nearOnRing(zn.ring, x, z), ins = zn.inside(x, z)
        if (!ins) {
          // the band: a matched vertex takes BD TOPO's z in full out to band[0], eased back to its own over band[1]
          const w = bz && bz.span && i >= bz.span[0] && i <= bz.span[1] && bz[i] !== null ? zn.bandW(x, z) : 0
          if (w > 0) { const y = r2(e.heights![i] + (bz![i]! - zn.datum - e.heights![i]) * w); if (Math.abs(y - e.heights![i]) > 0.01) { e.heights![i] = y; any = true; pts++ } }
          continue
        }
        // (with a band, a matched vertex is BD TOPO's in full inside: the easing is out in the band)
        const L = bz && bz[i] !== null ? bz[i]! - zn.datum : pin ? zn.levelYAt(pin.level, x, z) : zn.levelAt(x, z), k = bz && bz[i] !== null && zn.band[0] > 0 ? 1 : Math.min(1, nr.d / zn.fade)
        // eased from the way's own height at the ring (no kerb where it crosses at grade) to the level inside
        const y = r2(e.heights![i] + (L - e.heights![i]) * k)
        if (Math.abs(y - e.heights![i]) > 0.01) { e.heights![i] = y; any = true; pts++ }
      }
      if (any) {
        n++; moved.add(e)
        // a matched way standing over the ground (a viaduct BD TOPO and the MNS agree on) is drawn as a structure, not buried in a bank
        let above = 0
        if (bz && zn.gOf) for (let i = 0; i < e.heights!.length; i++) { const g = zn.gOf(e.points[2 * i], e.points[2 * i + 1], true); if (g !== null) above = Math.max(above, e.heights![i] - (g - zn.datum)) }
        if (above > DZ_RAMP_ABOVE) { e.ramp = true; nramp++ } else delete e.ramp
      }
    }
    if (zn.shape && pend.length) {
      const r = bandUnmatched(zn, pend, btHit, edges)
      for (const e of r.moved) { moved.add(e); n++ }
      pts += r.pts
      log.push(`deck zone ${S.name}: ${pend.length} unmatched at-grade ways graded from one reference each: ${r.ref} by a matched road, ${r.mnt} by the MNT along them, ${r.none} left; ${nNoBike} highway-type ways off the bike graph`)
    }
    log.push(`deck zone ${S.name}: ${n} ways pinned to their levels (${pts} points)${zn.zOf ? `, ${nbt} of them to BD TOPO heights (${btDeck.size} decks) (${nramp} standing over the ground drawn as structures)` : ''}`)
    // BD TOPO mode: every node where a BD TOPO way ends takes that height (a free way's, the deck's, first); the other ways' ends
    // there move to it, eased back along them over DZ_NODE_EASE m (crossovers, bridges onto a slip: no step at a junction)
    if (zn.zOf) {
      const at = new Map<number, { e: PackedEdge; end: 0 | 1 }[]>()
      for (const e of edges) if (usable(e)) for (const end of [0, 1] as const) { const v = end ? e.b : e.a; (at.get(v) ?? at.set(v, []).get(v)!).push({ e, end }) }
      let nn = 0
      for (const list of at.values()) {
        const hEnd = (q: { e: PackedEdge; end: 0 | 1 }) => q.end ? q.e.heights![q.e.heights!.length - 1] : q.e.heights![0]
        const held = (e: PackedEdge): boolean => free(e) || btDeck.has(e)
        const fr = list.filter((q) => held(q.e)), bt0 = list.filter((q) => btHit.has(q.e)), btRoad = bt0.filter((q) => !q.e.foot), bt = DZ_NODE_ROAD_FIRST && zn.shape && btRoad.length ? btRoad : bt0
        // (the band: where only unmatched ways meet, each graded from its own reference, they meet at their mean: a footway split
        //  at its junctions otherwise stepped from piece to piece)
        const pe = zn.shape ? list.filter((q) => pendSet.has(q.e)) : [], src = fr.length ? fr : bt.length ? bt : pe.length > 1 ? pe : []
        if (!src.length || src.length === list.length && !fr.length && src.every((q) => Math.abs(hEnd(q) - hEnd(src[0])) < 0.05)) continue
        const q0 = src[0], x = q0.end ? q0.e.points[q0.e.points.length - 2] : q0.e.points[0], z = q0.end ? q0.e.points[q0.e.points.length - 1] : q0.e.points[1]
        if (!zn.inside(x, z) && zn.bandW(x, z) <= 0) continue
        const t = src.reduce((s, q) => s + hEnd(q), 0) / src.length
        for (const q of list) {
          if (held(q.e)) continue
          const h = q.e.heights!, m = h.length, d0 = t - hEnd(q); if (Math.abs(d0) < 0.01) continue
          let s = 0
          // (the longer ease never reaches past the way's far end: on short footways it moved the far end off ITS junction)
          let Lw = 0; for (let i = 2; i < q.e.points.length; i += 2) Lw += Math.hypot(q.e.points[i] - q.e.points[i - 2], q.e.points[i + 1] - q.e.points[i - 1])
          const ease = zn.shape ? Math.max(DZ_NODE_EASE, Math.min(Lw, Math.abs(d0) / DZ_NODE_GRADE)) : DZ_NODE_EASE
          for (let k = 0; k < m; k++) {
            const i = q.end ? m - 1 - k : k
            if (k) { const j = q.end ? i + 1 : i - 1; s += Math.hypot(q.e.points[2 * i] - q.e.points[2 * j], q.e.points[2 * i + 1] - q.e.points[2 * j + 1]) }
            const w = 1 - s / ease; if (w <= 0) break
            h[i] = r2(h[i] + d0 * w)
          }
          moved.add(q.e); nn++
        }
      }
      log.push(`deck zone ${S.name}: ${nn} way ends met at BD TOPO junction heights`)
      // the band's stairs connect two levels: each end at the ways it meets there (not stairs), linear along it between
      let ns = 0
      for (const e of stairs) {
        const h = e.heights!, m = h.length; if (m < 2) continue
        const endAt = (v: number, me: PackedEdge): number | null => {
          const o = (at.get(v) ?? []).filter((q) => q.e !== me && q.e.kind !== 'steps')
          return o.length ? o.reduce((s, q) => s + (q.end ? q.e.heights![q.e.heights!.length - 1] : q.e.heights![0]), 0) / o.length : null
        }
        const ya = endAt(e.a, e) ?? h[0], yb = endAt(e.b, e) ?? h[m - 1]
        const L = [0]; for (let i = 1; i < m; i++) L.push(L[i - 1] + Math.hypot(e.points[2 * i] - e.points[2 * i - 2], e.points[2 * i + 1] - e.points[2 * i - 1]))
        let w = 0; for (let i = 0; i < m; i++) w = Math.max(w, zn.bandW(e.points[2 * i], e.points[2 * i + 1]))
        for (let i = 0; i < m; i++) h[i] = r2(h[i] + (ya + (yb - ya) * L[i] / (L[m - 1] || 1) - h[i]) * w)
        moved.add(e); ns++
      }
      if (stairs.length) log.push(`deck zone ${S.name}: ${ns} band stairs graded linearly between the ways at their ends`)
    }
    const keepRamp = (r: NonNullable<DeckZoneSpec['ramps']>[number]): boolean => {
      if (!zn.zOf) return true
      const hit = matcher([{ ways: r.ways, kinds: r.kinds }]), named = edges.filter((e) => hit(e) && inside(e))
      const ok = named.some((e) => !btHit.has(e))
      if (!ok) log.push(`deck zone ${S.name}: hand ramp "${r.name}" skipped (its ways take BD TOPO heights)`)
      return ok
    }
    const kept = (S.ramps ?? []).filter(keepRamp)
    if (kept.length) {
      const ramps = kept.map((r) => ({ ...r, from: [r.from[0], r.from[1], ...(r.from[2] !== undefined ? [r.from[2] - zn.datum] : [])], to: [r.to[0], r.to[1], ...(r.to[2] !== undefined ? [r.to[2] - zn.datum] : [])] }))
      // BD TOPO mode: a hand ramp never re-grades a way that took BD TOPO heights (only the unmatched ways are offered to it)
      const lp = applyLevelPlans(zn.zOf ? edges.filter((e) => !btHit.has(e)) : edges, [{ name: S.name, ramps } as any], toLocal)
      for (const e of lp.moved) moved.add(e)
      log.push(...lp.log)
    }
  }
  return { moved, log }
}

/** a track on a bridge is drawn from its few nodes' heights: one node over a quai at the old ground's 8 m is a hump, its ground end
 *  a dive. Each node of a bridge track that comes within DZ_RAIL_NEAR of a zone takes the height of the nearest bridge way's point
 *  (the road deck beside it, within DZ_RAIL_NEAR) — Pont National's tram and the Petite Ceinture. */
export const DZ_RAIL_NEAR = 15
export function conformDeckRails(rails: { points: number[]; heights?: number[]; bridge?: boolean }[], edges: PackedEdge[], zones: DeckZone[]): string[] {
  const decks = edges.filter((e) => e.bridge && usable(e))
  let n = 0
  const snapped = new Map<object, boolean[]>()
  for (const r of rails) {
    if (!r.bridge || !r.heights || r.heights.length * 2 !== r.points.length) continue
    const near = (x: number, z: number) => zones.some((zn) => zn.inside(x, z) || nearOnRing(zn.ring, x, z).d < DZ_RAIL_NEAR)
    let touches = false
    for (let i = 0; i < r.points.length; i += 2) if (near(r.points[i], r.points[i + 1])) touches = true
    if (!touches) continue
    for (let i = 0; i < r.heights.length; i++) {
      const x = r.points[2 * i], z = r.points[2 * i + 1]
      let best = DZ_RAIL_NEAR, y: number | null = null
      for (const e of decks) for (let k = 0; k < e.heights!.length; k++) { const d = Math.hypot(e.points[2 * k] - x, e.points[2 * k + 1] - z); if (d < best) { best = d; y = e.heights![k] } }
      if (y !== null && Math.abs(y - r.heights[i]) > 0.05) { r.heights[i] = r2(y); n++ }
      if (y !== null) (snapped.get(r) ?? snapped.set(r, []).get(r)!)[i] = true
    }
  }
  /* …and the deck pieces joined to a snapped one hold its level out to the chain's next anchor (a snapped node, or the chain's end): bed-levelled short pieces beside
   * a long viaduct had read the ground under them, the lower quay's trench at 1.8 m, so the train dropped 3.5 m off the deck at the bridgehead (owner: "the train still
   * crashes down the bridge"). Never lowers a node. */
  let held = 0
  if (snapped.size) for (const c of deckChains(rails.filter((r) => r.bridge && r.heights && r.heights.length * 2 === r.points.length) as PackedRail[])) {
    if (!c.ways.some((w) => snapped.has(w.r))) continue
    const h: number[] = [], anchor: boolean[] = []
    for (const w of c.ways) {
      const hs = [...w.r.heights!], an = hs.map((_, i) => !!snapped.get(w.r)?.[i])
      if (w.flip) { hs.reverse(); an.reverse() }
      hs.forEach((v, i) => { if (h.length && i === 0) { anchor[anchor.length - 1] ||= an[0]; return } h.push(v); anchor.push(an[i]) })
    }
    if (h.length !== c.cum.length) continue
    // anchors: the nodes set to the deck, and the chain's two ends (they hold the track's own level there)
    const at = h.map((_, i) => i).filter((i) => anchor[i] || i === 0 || i === h.length - 1)
    for (let j = 1; j < at.length; j++) {
      const a0 = at[j - 1], b0 = at[j]
      if (b0 - a0 < 2 || (!anchor[a0] && !anchor[b0])) continue
      for (let i = a0 + 1; i < b0; i++) {
        const y = h[a0] + ((h[b0] - h[a0]) * (c.cum[i] - c.cum[a0])) / ((c.cum[b0] - c.cum[a0]) || 1)
        if (y > h[i] + 0.05) { h[i] = r2(y); held++ }
      }
    }
    let i0 = 0
    for (const w of c.ways) {
      const m = w.r.heights!.length
      const part = h.slice(i0, i0 + m)
      w.r.heights = w.flip ? part.reverse() : part
      i0 += m - 1
    }
  }
  /* …and past the bridge's own pieces: the track joined on (bridged or not, same kind) climbs from the last deck node to the first node back at that level, within
   * DZ_RAIL_HOLD_REACH, never sagging between — the second T3 track read 2.3–3.5 m over the left-bank quay ramps while its twin, 3 m away, held 5.3 (owner's shot,
   * 2026-11-08: the tram tips off the bridge end). Never lowers a node. */
  let out = 0
  if (snapped.size) for (const c of deckChains(rails.filter((r) => r.heights && r.heights.length * 2 === r.points.length) as PackedRail[])) {
    if (!c.ways.some((w) => snapped.has(w.r))) continue
    const h: number[] = [], anchor: boolean[] = []
    for (const w of c.ways) {
      const hs = [...w.r.heights!], an = hs.map((_, i) => !!snapped.get(w.r)?.[i])
      if (w.flip) { hs.reverse(); an.reverse() }
      hs.forEach((v, i) => { if (h.length && i === 0) { anchor[anchor.length - 1] ||= an[0]; return } h.push(v); anchor.push(an[i]) })
    }
    if (h.length !== c.cum.length) continue
    // (an end anchor well below the next one in is a deck way's foot, not the deck: the left-bank T3 node beside a ramp end read 2.3 between the quay and a 5.8 deck)
    const ats = anchor.map((a, i) => (a ? i : -1)).filter((i) => i >= 0)
    while (ats.length > 1 && h[ats[0]] < h[ats[1]] - DZ_RAIL_FOOT_DROP) ats.shift()
    while (ats.length > 1 && h[ats[ats.length - 1]] < h[ats[ats.length - 2]] - DZ_RAIL_FOOT_DROP) ats.pop()
    const first = ats[0], last = ats[ats.length - 1]
    const climb = (a: number, dir: 1 | -1) => {
      for (let b = a + dir; b >= 0 && b < h.length && Math.abs(c.cum[b] - c.cum[a]) <= DZ_RAIL_HOLD_REACH; b += dir) {
        if (h[b] < h[a] - DZ_RAIL_HOLD_TOL) continue
        for (let i = a + dir; i !== b; i += dir) {
          const y = h[a] + ((h[b] - h[a]) * (c.cum[i] - c.cum[a])) / ((c.cum[b] - c.cum[a]) || 1)
          if (y > h[i] + 0.05) { h[i] = r2(y); out++ }
        }
        return
      }
    }
    climb(first, -1); climb(last, 1)
    let i0 = 0
    for (const w of c.ways) {
      const m = w.r.heights!.length
      const part = h.slice(i0, i0 + m)
      w.r.heights = w.flip ? part.reverse() : part
      i0 += m - 1
    }
  }
  return [`deck zones: ${n} bridge-track nodes set to the deck beside them, ${held} more held up along the chain, ${out} past the bridge's end`]
}
/** BD TOPO mode (round 3): the ground tracks in a zone's band take BD TOPO's rail z (troncon_de_voie_ferree), weighted by the band;
 *  where one meets a deck track's end the difference is eased away along it over DZ_RAIL_EASE m; one that then stands over the
 *  ground by DZ_RAIL_ABOVE somewhere is elevated (bridge + heights: drawn on its own structure, not dropped onto a low ground) */
export function bdTopoRails(rails: { points: number[]; heights?: number[]; bridge?: boolean }[], zones: DeckZone[], ground: (x: number, z: number) => number): string[] {
  let lifted = 0, seen = 0
  for (const zn of zones) {
    if (!zn.rOf) continue
    const ends: number[][] = []
    for (const r of rails) if (r.bridge && r.heights && r.heights.length * 2 === r.points.length) {
      const m = r.points.length; ends.push([r.points[0], r.points[1], r.heights[0]], [r.points[m - 2], r.points[m - 1], r.heights[r.heights.length - 1]])
    }
    for (const r of rails) {
      if (r.bridge || r.heights) continue
      const p = r.points, n = p.length / 2
      if (n < 2 || ![...Array(n).keys()].some((i) => zn.bandW(p[2 * i], p[2 * i + 1]) > 0)) continue
      seen++
      const cum = [0]; for (let i = 1; i < n; i++) cum.push(cum[i - 1] + Math.hypot(p[2 * i] - p[2 * i - 2], p[2 * i + 1] - p[2 * i - 1]))
      const g = [...Array(n).keys()].map((i) => ground(p[2 * i], p[2 * i + 1]))
      const t = [...Array(n).keys()].map((i) => {
        const a = Math.max(0, i - 1), b = Math.min(n - 1, i + 1), dx = p[2 * b] - p[2 * a], dz = p[2 * b + 1] - p[2 * a + 1], L = Math.hypot(dx, dz) || 1
        const v = zn.rOf!(p[2 * i], p[2 * i + 1], dx / L, dz / L); return v === null ? null : v - zn.datum
      })
      // a deck end at either end: the track starts at the deck's height and the difference to BD TOPO eases away along it
      const off = [0, n - 1].map((i) => { const e = ends.find((q) => Math.hypot(q[0] - p[2 * i], q[1] - p[2 * i + 1]) < 0.5); return e ? e[2] - (t[i] ?? g[i]) : 0 })
      const h = g.map((gi, i) => {
        const w = zn.bandW(p[2 * i], p[2 * i + 1])
        const o = off[0] * Math.max(0, 1 - cum[i] / DZ_RAIL_EASE) + off[1] * Math.max(0, 1 - (cum[n - 1] - cum[i]) / DZ_RAIL_EASE)
        return r2(gi + ((t[i] ?? gi) + o - gi) * w)
      })
      if (h.some((v, i) => v - g[i] > DZ_RAIL_ABOVE)) { r.heights = h; r.bridge = true; lifted++ }
    }
  }
  return [`deck zones: ${seen} ground tracks in the band read against BD TOPO's rails, ${lifted} elevated to them`]
}
/** how far past a bridge track's last deck node the joined track is held from sagging (m), and how far below the deck node a node may sit and still end the hold */
export const DZ_RAIL_HOLD_REACH = 140, DZ_RAIL_HOLD_TOL = 0.5
/** an end deck node this far below the next one in is a ramp's foot: the hold starts from the next one */
export const DZ_RAIL_FOOT_DROP = 1.5

/** wall pieces from two rings (or a river wall and a level wall) along the same line z-fight: keep the first within DZ_WALL_SAME */
export const DZ_WALL_SAME = 1.0
/** (`bySegment`, the band, 2026-11-09) a piece is the same wall as a kept one when its middle lies within DZ_WALL_SAME of the kept
 *  piece's SEGMENT and it runs within DZ_WALL_SAME_DEG of it: two coincident BD TOPO lines (a Quai and a Mur on one wall) cut at
 *  different phases kept every other piece of the second by middles alone — 2 m pieces 4 m apart z-fighting along the first */
export const DZ_WALL_SAME_DEG = 25
/** the pieces near a segment-wise: does a piece lie (its middle within `r` of a filed piece's segment, within DZ_WALL_SAME_DEG of it)? */
export function wallNear(ws: QuayWall[], r: number): (w: QuayWall) => boolean {
  const C = 4, grid = new Map<string, QuayWall[]>(), cos = Math.cos(DZ_WALL_SAME_DEG * Math.PI / 180)
  for (const w of ws) for (const [x, z] of [[w.ax, w.az], [(w.ax + w.bx) / 2, (w.az + w.bz) / 2], [w.bx, w.bz]]) {
    const key = `${Math.floor(x / C)},${Math.floor(z / C)}`, l = grid.get(key); if (!l) grid.set(key, [w]); else if (l[l.length - 1] !== w) l.push(w)
  }
  return (w) => {
    const mx = (w.ax + w.bx) / 2, mz = (w.az + w.bz) / 2, L = Math.hypot(w.bx - w.ax, w.bz - w.az) || 1, cx = Math.floor(mx / C), cz = Math.floor(mz / C)
    for (let i = cx - 1; i <= cx + 1; i++) for (let j = cz - 1; j <= cz + 1; j++) for (const k of grid.get(`${i},${j}`) ?? []) {
      const dx = k.bx - k.ax, dz = k.bz - k.az, kl = Math.hypot(dx, dz) || 1
      if (Math.abs((dx * (w.bx - w.ax) + dz * (w.bz - w.az)) / (kl * L)) < cos) continue
      const t = ((mx - k.ax) * dx + (mz - k.az) * dz) / (kl * kl)
      if (t < -0.25 || t > 1.25) continue
      const tc = Math.max(0, Math.min(1, t))
      if (Math.hypot(k.ax + dx * tc - mx, k.az + dz * tc - mz) < r) return true
    }
    return false
  }
}
/** (the band) a city quay wall piece this near a zone's wall, segment-wise, yields to it (bake.ts): the zone's walls are cut on the
 *  band's own ground; the old midpoint test kept every other zone piece beside a city wall (4 m and 2 m pieces), both drawn */
export const DZ_WALL_YIELD = 1.5
/** (the band) a city piece within DZ_WALL_PAIR m of a zone wall, parallel, whose top stands DZ_WALL_TOP_TOL m over the shipped ground behind it, goes too */
export const DZ_WALL_PAIR = 6, DZ_WALL_TOP_TOL = 1.0
export function dedupeWalls(ws: QuayWall[], bySegment = false): QuayWall[] {
  if (bySegment) {
    const C = 4, grid = new Map<string, QuayWall[]>(), kept: QuayWall[] = [], cos = Math.cos(DZ_WALL_SAME_DEG * Math.PI / 180)
    for (const w of ws) {
      const mx = (w.ax + w.bx) / 2, mz = (w.az + w.bz) / 2, L = Math.hypot(w.bx - w.ax, w.bz - w.az) || 1
      const cx = Math.floor(mx / C), cz = Math.floor(mz / C)
      let dup = false
      for (let i = cx - 1; i <= cx + 1 && !dup; i++) for (let j = cz - 1; j <= cz + 1 && !dup; j++) for (const k of grid.get(`${i},${j}`) ?? []) {
        const dx = k.bx - k.ax, dz = k.bz - k.az, kl = Math.hypot(dx, dz) || 1
        if (Math.abs((dx * (w.bx - w.ax) + dz * (w.bz - w.az)) / (kl * L)) < cos) continue
        const t = ((mx - k.ax) * dx + (mz - k.az) * dz) / (kl * kl)
        if (t < 0 || t > 1) continue // (the next piece along the same line: its middle projects past this one's end)
        if (Math.hypot(k.ax + dx * t - mx, k.az + dz * t - mz) < DZ_WALL_SAME) { dup = true; break }
      }
      if (dup) continue
      kept.push(w)
      // filed under every cell its segment's ends and middle touch
      for (const [x, z] of [[w.ax, w.az], [mx, mz], [w.bx, w.bz]]) { const key = `${Math.floor(x / C)},${Math.floor(z / C)}`; const l = grid.get(key); if (!l) grid.set(key, [w]); else if (l[l.length - 1] !== w) l.push(w) }
    }
    return kept
  }
  const kept: QuayWall[] = []
  for (const w of ws) {
    const mx = (w.ax + w.bx) / 2, mz = (w.az + w.bz) / 2
    if (kept.some((k) => Math.hypot((k.ax + k.bx) / 2 - mx, (k.az + k.bz) / 2 - mz) < DZ_WALL_SAME)) continue
    kept.push(w)
  }
  return kept
}
