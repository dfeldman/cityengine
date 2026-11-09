/*
 * BD TOPO DECK ZONES (2026-11-08, pilot on pont-national-mini; BDTOPO_ZONES=1 only, the default bake is unchanged).
 * IGN's BD TOPO gives every road as a 3D line (`troncon_de_route`, NGF z at every vertex, `position_par_rapport_au_sol`
 * '-1' tunnel / '0' ground / '1' bridge) and every quay wall / retaining wall as a 3D open polyline (`construction_lineaire`,
 * nature Quai / Mur de soutènement / Pont / Tunnel). This module fetches both (raw pages cached, nothing computed persisted)
 * and builds a DeckZoneSpec IN MEMORY at bake time for a named bridge's bank, the hand zone's owner facts merged on top:
 *   - outline: the hand zone's ring (the owner's extent);
 *   - levels: ground-road z clustered into tiers (BT_TIER_GAP); a ringed level per low tier, its ring a buffer round its roads;
 *   - ways: each OSM way inside matched by geometry to BD TOPO troncons (BT_MATCH_D, BT_MATCH_DEG) and graded along their z
 *     (a `ramps` entry per way, ends from BD TOPO), so a road climbing to a slip follows the survey not a flat tier;
 *   - the hand zone's _doc, drop, free and pin entries win (pins name levels: they map to the generated tier nearest their alt).
 * See plans/bridgeheads/NOTES.md "BD TOPO pilot".
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import type { DeckZoneSpec } from './deck-zones.ts'
import { BAND_RIVERBED, type SeineBand } from './seine-band.ts'
import { ignLidar, MNS_LAYER } from './ign-lidar.ts'
import type { PackedEdge } from '../src/city/package.ts'

export const BT_WFS = 'https://data.geopf.fr/wfs/ows'
/** tile size in degrees; pages of BT_PAGE features */
export const BT_TILE = 0.01, BT_PAGE = 1500
/** BD TOPO's no-z marker (vertices at or under this have no altitude) */
export const BT_NOZ = -999
/** OSM way ↔ troncon match: nearest-segment distance (m) and bearing difference (deg, either direction) */
export const BT_MATCH_D = 6, BT_MATCH_DEG = 25
/** the upper tier is the median z of ground-road vertices in the zone; a vertex this far (m) or more under it is the LOW tier */
export const BT_LOW_DROP = 1.5
/** the low tier's ring: the convex hull of its roads offset this far (m) either side */
export const BT_TIER_BUF = 7
/** a way takes BD TOPO heights when at least this share of its vertices inside the zone matched; the rest interpolated along it */
export const BT_WAY_FRAC = 0.5
/** BD TOPO road natures never used for tiers (paths and stairs carry poor z) */
export const BT_SKIP_NATURE = /^(Sentier|Escalier)$/
/** ROUND 2 (2026-11-08). LIDAR VETO: a ground-road vertex more than BT_LIDAR_VETO m off IGN's lidar MNT takes the MNT, except
 *  within BT_DECK_HALF m of a bridge (sol 1) where the MNT is interpolated too: there it is cleared and filled along its line.
 *  (Pont National: BD TOPO carried the lid tunnel's 28.3 along 170 m of open Quai de Bercy; the MNT and MNS read 31.7–32.0.) */
export const BT_LIDAR_VETO = 2, BT_DECK_HALF = 10, BT_LIDAR_PX = 1024
/** a oneway OSM way only matches a BD TOPO troncon carrying traffic its way (sens_de_circulation) */
export const BT_ONEWAY_DIR = true
/** THE GROUND (BD TOPO mode): every post takes an inverse-distance blend of the BD TOPO ground roads it can SEE (the sight line
 *  crossing no wall line), one sample per troncon within BT_GROUND_R m, weight 1/(d + BT_IDW_D0)^BT_IDW_POW: plateaus at each
 *  road, a bank half-way between roads with no wall between; rastered at BT_GROUND_STEP m and read bilinearly */
export const BT_GROUND_R = 45, BT_IDW_D0 = 2, BT_IDW_POW = 3, BT_GROUND_STEP = 1
/** the wall lines: construction_lineaire natures that stand as walls (open polylines) */
export const BT_WALL_NATURE = /^(Quai|Mur de soutènement)$/
/** BD TOPO z is ±1.5 m per vertex: a matched way's heights are smoothed along it over a BT_SMOOTH m triangular window */
export const BT_SMOOTH = 40
/** ROUND 3 (2026-11-08, the owner's edge issues). A vertex the MNT vetoes but the lidar SURFACE model (MNS) confirms within
 *  BT_LIDAR_VETO is a road on a structure (Bd Poniatowski's viaduct 39.2 over a 30.4 MNT; the A4 slips 40.8 over 35.8): it keeps its
 *  z for the ways, and its troncon stays out of the ground blend (the ground is under it). */
export const BT_MNS_KEEP = true
/** (round 4) a sol-1 (deck) vertex within BT_DECK_GROUND m of the MNT and BT_DECK_UNDER m or more under the MNS lies on the ground under
 *  its own deck (a BD TOPO error): cleared and refilled along its line */
export const BT_DECK_GROUND = 1.5, BT_DECK_UNDER = 3
/** (2026-11-08, louvre-mini) a DECK vertex more than BT_DECK_BELOW m UNDER the MNT (a deck cannot sit under the ground it lands on:
 *  Pont Neuf's left-bank end reads 34.5 NGF on a quai the MNT puts at 36.4; the deck's last 23 m fell 8 %) is set to the MNT, and
 *  so is every sol-0 vertex at the same spot (the troncon carrying on off the deck) */
export const BT_DECK_BELOW = 1.0
/** 2026-11-08: a ground OSM way (no tunnel, no negative layer) never matches a sol −1 troncon (see btz) */
export const BT_GROUND_NO_TUNNEL = true
/** THE BAND past the ring (BD TOPO mode): matched ways, the ground and the wall lines take BD TOPO's heights in full out to
 *  BT_OUTER m from the ring, then ease back to the map's own over BT_EASE m (a ring cutting a graded ramp left a 6 m jump) */
export const BT_OUTER = 90, BT_EASE = 40
/** the ground's segment buckets (m) and its raster's lazy tiles (posts a side): a 1 km band would loop every troncon per post */
export const BT_BUCKET = 32, BT_TILE_POSTS = 32
/** segments bucketed on a BT_BUCKET grid: the ones whose box meets [x0, z0, x1, z1] */
export type SegIndex = (x0: number, z0: number, x1: number, z1: number) => BtSeg[]
export function segIndex(segs: BtSeg[]): SegIndex {
  const g = new Map<string, BtSeg[]>(), K = (i: number, j: number) => `${i},${j}`
  for (const sg of segs) for (let j = Math.floor(Math.min(sg.az, sg.bz) / BT_BUCKET); j <= Math.floor(Math.max(sg.az, sg.bz) / BT_BUCKET); j++)
    for (let i = Math.floor(Math.min(sg.ax, sg.bx) / BT_BUCKET); i <= Math.floor(Math.max(sg.ax, sg.bx) / BT_BUCKET); i++) (g.get(K(i, j)) ?? g.set(K(i, j), []).get(K(i, j))!).push(sg)
  return (x0, z0, x1, z1) => {
    const out = new Set<BtSeg>()
    for (let j = Math.floor(z0 / BT_BUCKET); j <= Math.floor(z1 / BT_BUCKET); j++) for (let i = Math.floor(x0 / BT_BUCKET); i <= Math.floor(x1 / BT_BUCKET); i++) for (const sg of g.get(K(i, j)) ?? []) out.add(sg)
    return [...out]
  }
}

const DIRS = { troncon_de_route: resolve(import.meta.dirname, 'cache', 'bdtopo-roads'), construction_lineaire: resolve(import.meta.dirname, 'cache', 'bdtopo-lines'), troncon_de_voie_ferree: resolve(import.meta.dirname, 'cache', 'bdtopo-rails'), surface_hydrographique: resolve(import.meta.dirname, 'cache', 'bdtopo-water') }
export type BtLayer = keyof typeof DIRS
export type BtFeature = { id: string; coords: number[][][]; props: Record<string, unknown> }

async function page(layer: BtLayer, tx: number, ty: number, p: number): Promise<{ features: { id: string; geometry?: { type: string; coordinates: unknown }; properties: Record<string, unknown> }[] }> {
  const file = resolve(DIRS[layer], `t${tx}_${ty}_p${p}.json`)
  if (existsSync(file)) return JSON.parse(readFileSync(file, 'utf8'))
  const s = ty * BT_TILE, w = tx * BT_TILE
  const q = new URLSearchParams({
    SERVICE: 'WFS', VERSION: '2.0.0', REQUEST: 'GetFeature', TYPENAMES: `BDTOPO_V3:${layer}`, OUTPUTFORMAT: 'application/json',
    COUNT: String(BT_PAGE), STARTINDEX: String(p * BT_PAGE), SORTBY: 'cleabs',
    CQL_FILTER: `BBOX(geometrie,${s.toFixed(4)},${w.toFixed(4)},${(s + BT_TILE).toFixed(4)},${(w + BT_TILE).toFixed(4)})`,
  })
  for (let a = 0; ; a++) {
    try {
      const r = await fetch(`${BT_WFS}?${q}`)
      if (!r.ok) throw new Error(String(r.status))
      const txt = await r.text(), d = JSON.parse(txt)
      if (!d.features) throw new Error('no features')
      mkdirSync(DIRS[layer], { recursive: true }); writeFileSync(file, txt)
      return d
    } catch (e) { if (a >= 3) throw e; await new Promise((ok) => setTimeout(ok, 2000 * (a + 1))) }
  }
}

/** every feature of a layer touching the box [s, w, n, e], de-duplicated across tiles; lines as arrays of [lon, lat, z] parts */
export async function fetchBdTopo(layer: BtLayer, s: number, w: number, n: number, e: number): Promise<BtFeature[]> {
  const out = new Map<string, BtFeature>()
  for (let ty = Math.floor(s / BT_TILE); ty <= Math.floor(n / BT_TILE); ty++) for (let tx = Math.floor(w / BT_TILE); tx <= Math.floor(e / BT_TILE); tx++) {
    for (let p = 0; ; p++) {
      const d = await page(layer, tx, ty, p)
      for (const f of d.features) {
        const g = f.geometry; if (!g) continue
        const parts = (g.type === 'LineString' ? [g.coordinates] : g.type === 'MultiLineString' || g.type === 'Polygon' ? g.coordinates : g.type === 'MultiPolygon' ? (g.coordinates as number[][][][]).flat() : []) as number[][][]
        const inBox = parts.some((pt) => pt.some(([lo, la]) => la >= s && la <= n && lo >= w && lo <= e))
        if (inBox && parts.length) out.set(f.id, { id: f.id, coords: parts, props: f.properties })
      }
      if (d.features.length < BT_PAGE) break
    }
  }
  return [...out.values()]
}

/** fill −1000 z along each line from its own neighbours (linear by length), then whole-line gaps from shared endpoints; counts */
export function fillNoZ(fs: BtFeature[]): { filled: number; left: number } {
  let filled = 0, left = 0
  const has = (v: number[]) => v[2] > BT_NOZ
  const key = (v: number[]) => `${v[0].toFixed(6)},${v[1].toFixed(6)}`
  const fillPart = (pt: number[][]) => {
    const L = [0]; for (let i = 1; i < pt.length; i++) L.push(L[i - 1] + Math.hypot((pt[i][0] - pt[i - 1][0]) * 73400, (pt[i][1] - pt[i - 1][1]) * 111200))
    for (let i = 0; i < pt.length; i++) if (!has(pt[i])) {
      let a = i - 1; while (a >= 0 && !has(pt[a])) a--
      let b = i + 1; while (b < pt.length && !has(pt[b])) b++
      if (a >= 0 && b < pt.length) pt[i][2] = pt[a][2] + (pt[b][2] - pt[a][2]) * (L[i] - L[a]) / (L[b] - L[a] || 1)
      else if (a >= 0) pt[i][2] = pt[a][2]; else if (b < pt.length) pt[i][2] = pt[b][2]; else continue
      filled++
    }
  }
  for (const f of fs) for (const pt of f.coords) fillPart(pt)
  // lines with no z at all: from endpoints shared with lines that have one (a few passes, so chains fill)
  for (let pass = 0; pass < 4; pass++) {
    const at = new Map<string, number>()
    for (const f of fs) for (const pt of f.coords) for (const v of [pt[0], pt[pt.length - 1]]) if (has(v)) at.set(key(v), v[2])
    for (const f of fs) for (const pt of f.coords) {
      if (pt.some(has)) continue
      const za = at.get(key(pt[0])), zb = at.get(key(pt[pt.length - 1]))
      if (za === undefined && zb === undefined) continue
      pt[0][2] = za ?? zb!; pt[pt.length - 1][2] = zb ?? za!; filled += 2; fillPart(pt); filled += pt.length - 2
    }
  }
  for (const f of fs) for (const pt of f.coords) for (const v of pt) if (!has(v)) left++
  return { filled, left }
}

export const btSol = (f: BtFeature): string => String(f.props.position_par_rapport_au_sol ?? '0')
export const btName = (f: BtFeature): string => String(f.props.nom_collaboratif_gauche ?? f.props.nom_collaboratif_droite ?? '').trim()

/** BD TOPO lines projected to local metres, one entry per segment: ends, z at each end, the feature */
export type BtSeg = { ax: number; az: number; bx: number; bz: number; za: number; zb: number; f: BtFeature }
export function btSegs(fs: BtFeature[], toLocal: (lat: number, lon: number) => { x: number; z: number }): BtSeg[] {
  const out: BtSeg[] = []
  for (const f of fs) for (const pt of f.coords) for (let i = 1; i < pt.length; i++) {
    const a = toLocal(pt[i - 1][1], pt[i - 1][0]), b = toLocal(pt[i][1], pt[i][0])
    out.push({ ax: a.x, az: a.z, bx: b.x, bz: b.z, za: pt[i - 1][2], zb: pt[i][2], f })
  }
  return out
}
/** every BD TOPO segment within BT_MATCH_D of a point whose bearing is within BT_MATCH_DEG of (ux, uz): distance and z there */
export function btCandidates(segs: BtSeg[] | SegIndex, x: number, z: number, ux: number, uz: number, filt?: (s: BtSeg) => boolean, oneway = false): { d: number; z: number; s: BtSeg }[] {
  const out: { d: number; z: number; s: BtSeg }[] = [], cosMin = Math.cos(BT_MATCH_DEG * Math.PI / 180)
  // (an index, segIndex: only the buckets within BT_MATCH_D; the city's whole list was brute force, 2026-11-08)
  for (const s of typeof segs === 'function' ? segs(x - BT_MATCH_D, z - BT_MATCH_D, x + BT_MATCH_D, z + BT_MATCH_D) : segs) {
    if (filt && !filt(s)) continue
    const dx = s.bx - s.ax, dz = s.bz - s.az, L = Math.hypot(dx, dz) || 1
    if (Math.abs((dx * ux + dz * uz) / L) < cosMin) continue
    if (oneway && BT_ONEWAY_DIR) {
      const sens = String(s.f.props.sens_de_circulation ?? ''), dir = sens === 'Sens direct' ? 1 : sens === 'Sens inverse' ? -1 : 0
      if (dir && dir * (dx * ux + dz * uz) < 0) continue
    }
    const t = Math.max(0, Math.min(1, ((x - s.ax) * dx + (z - s.az) * dz) / (L * L))), d = Math.hypot(s.ax + dx * t - x, s.az + dz * t - z)
    if (d <= BT_MATCH_D) out.push({ d, z: s.za + (s.zb - s.za) * t, s })
  }
  return out
}
/** another OSM way nearer (by BT_MUTUAL_MARGIN m) than d to the BD TOPO segment's middle, running parallel */
export const BT_MUTUAL_MARGIN = 0.75
function osmNearer(o: PackedEdge, s: BtSeg, d: number, ux: number, uz: number): boolean {
  const mx = (s.ax + s.bx) / 2, mz = (s.az + s.bz) / 2, q = o.points, cosMin = Math.cos(BT_MATCH_DEG * Math.PI / 180)
  for (let i = 2; i < q.length; i += 2) {
    const dx = q[i] - q[i - 2], dz = q[i + 1] - q[i - 1], L = Math.hypot(dx, dz) || 1
    if (Math.abs((dx * ux + dz * uz) / L) < cosMin) continue
    const t = Math.max(0, Math.min(1, ((mx - q[i - 2]) * dx + (mz - q[i - 1]) * dz) / (L * L)))
    const sx = s.ax - mx, sz = s.az - mz, sl = Math.hypot(sx, sz) || 1
    // distance measured across the BD TOPO line (perpendicular), so a long segment's middle doesn't favour whoever passes its centre
    const px = q[i - 2] + dx * t - mx, pz = q[i - 1] + dz * t - mz, perp = Math.abs(px * sz / sl - pz * sx / sl), along = Math.abs(px * sx / sl + pz * sz / sl)
    if (along <= sl && perp + BT_MUTUAL_MARGIN < d) return true
  }
  return false
}
/** a z step between consecutive vertices' picks costs this many metres of distance (the dual carriageways under Pont National are
 *  4 m apart in plan and 3 m in height: nearest-segment alone zigzagged between them, a 15% step) */
export const BT_DZ_COST = 4
/** per vertex of an OSM edge: the matched BD TOPO z (NGF) and segment, or null. The picks along the way are chosen together
 *  (Viterbi: distance + BT_DZ_COST × z change between neighbours) so one way follows one carriageway. */
/** OSM edges bucketed on a BT_BUCKET grid by their box: the ones whose box meets [x0, z0, x1, z1] (the mutual-nearest rule's others) */
export type EdgeIndex = (x0: number, z0: number, x1: number, z1: number) => PackedEdge[]
export function edgeIndex(edges: PackedEdge[]): EdgeIndex {
  const g = new Map<string, PackedEdge[]>(), K = (i: number, j: number) => `${i},${j}`
  for (const e of edges) {
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
    for (let i = 0; i < e.points.length; i += 2) { x0 = Math.min(x0, e.points[i]); x1 = Math.max(x1, e.points[i]); z0 = Math.min(z0, e.points[i + 1]); z1 = Math.max(z1, e.points[i + 1]) }
    for (let j = Math.floor(z0 / BT_BUCKET); j <= Math.floor(z1 / BT_BUCKET); j++) for (let i = Math.floor(x0 / BT_BUCKET); i <= Math.floor(x1 / BT_BUCKET); i++) (g.get(K(i, j)) ?? g.set(K(i, j), []).get(K(i, j))!).push(e)
  }
  return (x0, z0, x1, z1) => {
    const out = new Set<PackedEdge>()
    for (let j = Math.floor(z0 / BT_BUCKET); j <= Math.floor(z1 / BT_BUCKET); j++) for (let i = Math.floor(x0 / BT_BUCKET); i <= Math.floor(x1 / BT_BUCKET); i++) for (const e of g.get(K(i, j)) ?? []) out.add(e)
    return [...out]
  }
}
export function btMatchEdge(e: PackedEdge, segs: BtSeg[] | SegIndex, filt?: (s: BtSeg) => boolean, others?: PackedEdge[] | EdgeIndex): ({ z: number; s: BtSeg } | null)[] {
  const p = e.points, n = p.length / 2
  // (with an index, only the ways near the BD TOPO segment: osmNearer needs one within its length and d of its middle)
  const near = (s: BtSeg): PackedEdge[] => typeof others === 'function' ? others(Math.min(s.ax, s.bx) - BT_MATCH_D, Math.min(s.az, s.bz) - BT_MATCH_D, Math.max(s.ax, s.bx) + BT_MATCH_D, Math.max(s.az, s.bz) + BT_MATCH_D) : others ?? []
  const C = Array.from({ length: n }, (_, i) => {
    const a = Math.max(0, i - 1), b = Math.min(n - 1, i + 1), dx = p[2 * b] - p[2 * a], dz = p[2 * b + 1] - p[2 * a + 1], L = Math.hypot(dx, dz) || 1
    const cs = btCandidates(segs, p[2 * i], p[2 * i + 1], dx / L, dz / L, filt, !!e.oneway)
    // MUTUAL nearest: a candidate is kept only when no other parallel OSM way lies nearer to that BD TOPO line (stacked carriageways)
    return others ? cs.filter((c) => !near(c.s).some((o) => o !== e && !o.bridge && osmNearer(o, c.s, c.d, dx / L, dz / L))) : cs
  })
  const out: ({ z: number; s: BtSeg } | null)[] = new Array(n).fill(null)
  // runs of consecutive vertices with candidates, each solved on its own
  for (let i = 0; i < n;) {
    if (!C[i].length) { i++; continue }
    let j = i; while (j + 1 < n && C[j + 1].length) j++
    let cost = C[i].map((c) => c.d); const back: number[][] = []
    for (let k = i + 1; k <= j; k++) {
      const nc: number[] = [], bk: number[] = []
      for (const c of C[k]) {
        let best = Infinity, bi = 0
        C[k - 1].forEach((q, qi) => { const v = cost[qi] + BT_DZ_COST * Math.abs(c.z - q.z); if (v < best) { best = v; bi = qi } })
        nc.push(best + c.d); bk.push(bi)
      }
      cost = nc; back.push(bk)
    }
    let bi = cost.indexOf(Math.min(...cost))
    for (let k = j; k >= i; k--) { out[k] = C[k][bi]; if (k > i) bi = back[k - i - 1][bi] }
    i = j + 1
  }
  return out
}
const M_LON = 73400, M_LAT = 111200   // metres per degree near 48.83°N (rings built in lat/lon)
const inRingLL = (r: [number, number][], la: number, lo: number): boolean => {
  let c = false
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) if ((r[i][0] > la) !== (r[j][0] > la) && lo < ((r[j][1] - r[i][1]) * (la - r[i][0])) / (r[j][0] - r[i][0]) + r[i][1]) c = !c
  return c
}

/** segments a→b and c→d cross (2D, strict) */
const crosses = (ax: number, az: number, bx: number, bz: number, cx: number, cz: number, dx: number, dz: number): boolean => {
  const d = (bx - ax) * (dz - cz) - (bz - az) * (dx - cx); if (!d) return false
  const t = ((cx - ax) * (dz - cz) - (cz - az) * (dx - cx)) / d, u = ((cx - ax) * (bz - az) - (cz - az) * (bx - ax)) / d
  return t > 1e-6 && t < 1 - 1e-6 && u > 0 && u < 1
}

/**
 * The BD TOPO version of a hand zone (BDTOPO_ZONES=1), round 2:
 *   - roads: BD TOPO troncons, z vetted against the lidar MNT (BT_LIDAR_VETO);
 *   - ground (`btGround`): the BD TOPO ground roads blended by sight (BT_GROUND_*), walls (`btLines`) at the BD TOPO Quai and
 *     Mur de soutènement lines wherever their two sides differ; the hand's ringed levels are kept for their NAMES only (pins);
 *   - ways: every matched OSM way takes BD TOPO's z (`btz`); hand pins and ramps only for unmatched ways (deck-zones.ts);
 *   - the hand's _doc, drop and free; NOT its `lay` (the 2026-11-08 reading: Port de Bercy does not pass under the bridge).
 */
export async function bdTopoZone(hand: DeckZoneSpec, log: string[], sb?: SeineBand): Promise<DeckZoneSpec> {
  const lats = hand.ring.map((p) => p[0]), lons = hand.ring.map((p) => p[1]), pad = 0.0005
  const padLa = pad + (BT_OUTER + BT_EASE) / M_LAT, padLo = pad + (BT_OUTER + BT_EASE) / M_LON
  // (the Seine band: its own box, the city's; a hand zone: its ring's, with the band past it)
  const [S, W, N, E] = sb ? sb.boxLL : [Math.min(...lats) - padLa, Math.min(...lons) - padLo, Math.max(...lats) + padLa, Math.max(...lons) + padLo]
  const inZoneLL = (la: number, lo: number): boolean => sb ? la >= S && la <= N && lo >= W && lo <= E : inRingLL(hand.ring, la, lo)
  const roads = await fetchBdTopo('troncon_de_route', S, W, N, E), lines = await fetchBdTopo('construction_lineaire', S, W, N, E)
  const fz = fillNoZ(roads); fillNoZ(lines)
  const railsBt = await fetchBdTopo('troncon_de_voie_ferree', S, W, N, E); fillNoZ(railsBt)
  let ground = roads.filter((f) => btSol(f) === '0' && !BT_SKIP_NATURE.test(String(f.props.nature)))
  // lidar veto
  const mnt = await ignLidar({ south: S, north: N, west: W, east: E }, BT_LIDAR_PX)
  const mns = BT_MNS_KEEP ? await ignLidar({ south: S, north: N, west: W, east: E }, BT_LIDAR_PX, MNS_LAYER) : null
  const elevated = new Set<BtFeature>()
  const deckPts: number[][] = []
  for (const f of roads) if (btSol(f) === '1') for (const pt of f.coords) for (let i = 1; i < pt.length; i++) deckPts.push([pt[i - 1][1], pt[i - 1][0], pt[i][1], pt[i][0]])
  // (bucketed on a BT_BUCKET grid in lat/lon metres: the city's whole deck list per vertex was brute force)
  const dG = new Map<string, number[][]>(), dK = (la: number, lo: number) => `${Math.floor(la * M_LAT / BT_BUCKET)},${Math.floor(lo * M_LON / BT_BUCKET)}`
  for (const d of deckPts) {
    const j0 = Math.floor((Math.min(d[0], d[2]) * M_LAT - BT_DECK_HALF) / BT_BUCKET), j1 = Math.floor((Math.max(d[0], d[2]) * M_LAT + BT_DECK_HALF) / BT_BUCKET)
    const i0 = Math.floor((Math.min(d[1], d[3]) * M_LON - BT_DECK_HALF) / BT_BUCKET), i1 = Math.floor((Math.max(d[1], d[3]) * M_LON + BT_DECK_HALF) / BT_BUCKET)
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const k = `${j},${i}`; (dG.get(k) ?? dG.set(k, []).get(k)!).push(d) }
  }
  const nearDeck = (la: number, lo: number): boolean => (dG.get(dK(la, lo)) ?? []).some(([a1, o1, a2, o2]) => {
    const ax = (o1 - lo) * M_LON, az = (a1 - la) * M_LAT, bx = (o2 - lo) * M_LON, bz = (a2 - la) * M_LAT, dx = bx - ax, dz = bz - az
    const t = Math.max(0, Math.min(1, -(ax * dx + az * dz) / (dx * dx + dz * dz || 1)))
    return Math.hypot(ax + dx * t, az + dz * t) < BT_DECK_HALF
  })
  let vet = 0, cleared = 0, worst = 0, kept = 0
  for (const f of ground) for (const pt of f.coords) for (const v of pt) {
    if (v[1] < S || v[1] > N || v[0] < W || v[0] > E) continue
    const h = mnt.at(v[1], v[0]); if (h === null) continue
    const d = v[2] - h; if (Math.abs(d) <= BT_LIDAR_VETO) continue
    const sf = mns?.at(v[1], v[0]) ?? null
    if (sf !== null && d > 0 && Math.abs(v[2] - sf) <= BT_LIDAR_VETO) { elevated.add(f); kept++; continue }
    worst = Math.max(worst, Math.abs(d))
    if (nearDeck(v[1], v[0])) { v[2] = BT_NOZ - 1; cleared++ } else { v[2] = h; vet++ }
  }
  // (round 4) a DECK vertex fallen to the ground under it: Pont Royal's two sol-1 troncons meet mid-river at 28.0 NGF, the Seine's
  //  bed (MNT 26.9), under an MNS of 37.8 — the deck dived 7 m. Cleared and refilled along its line from the deck's other vertices.
  let sunkDeck = 0
  if (mns) for (const f of roads) if (btSol(f) === '1') for (const pt of f.coords) for (const v of pt) {
    if (v[2] <= BT_NOZ || v[1] < S || v[1] > N || v[0] < W || v[0] > E) continue
    const g = mnt.at(v[1], v[0]), sf = mns.at(v[1], v[0])
    if (g !== null && sf !== null && v[2] - g < BT_DECK_GROUND && sf - v[2] > BT_DECK_UNDER) { v[2] = BT_NOZ - 1; sunkDeck++ }
  }
  // (BT_DECK_BELOW) a deck vertex under the ground it lands on goes to the MNT, with the ground vertices at the same spot
  let belowDeck = 0
  const belowAt = new Map<string, number>(), llK = (v: number[]) => `${v[0].toFixed(6)},${v[1].toFixed(6)}`
  for (const f of roads) if (btSol(f) === '1') for (const pt of f.coords) for (const v of pt) {
    if (v[2] <= BT_NOZ || v[1] < S || v[1] > N || v[0] < W || v[0] > E) continue
    const g = mnt.at(v[1], v[0]); if (g === null || g - v[2] <= BT_DECK_BELOW) continue
    v[2] = g; belowAt.set(llK(v), g); belowDeck++
  }
  if (belowAt.size) for (const f of roads) if (btSol(f) === '0') for (const pt of f.coords) for (const v of pt) { const g = belowAt.get(llK(v)); if (g !== undefined) v[2] = g }
  fillNoZ(roads)
  if (belowDeck) log.push(`bdtopo zone ${hand.name}: ${belowDeck} deck vertices more than ${BT_DECK_BELOW} m under the MNT set to it`)
  if (sunkDeck) log.push(`bdtopo zone ${hand.name}: ${sunkDeck} deck vertices on the ground under their deck (MNT + ${BT_DECK_GROUND}, MNS − ${BT_DECK_UNDER}) refilled along their lines`)
  log.push(`bdtopo zone ${hand.name}: lidar veto (> ${BT_LIDAR_VETO} m off the MNT): ${vet} vertices set to the MNT, ${cleared} under bridges cleared and refilled along their lines; worst ${worst.toFixed(1)} m; ${kept} kept on structures (the MNS agrees), ${elevated.size} troncons out of the ground blend`)
  ground = ground.filter((f) => !elevated.has(f))
  const zs: number[] = []
  for (const f of ground) for (const pt of f.coords) for (const v of pt) if (inZoneLL(v[1], v[0])) zs.push(v[2])
  zs.sort((a, b) => a - b)
  const upper = Math.round(zs[zs.length >> 1] * 100) / 100
  const defLevel = hand.levels.find((l) => !l.ring)?.name ?? 'upper quai'
  // the hand's ringed levels stay for their names (hand pins of unmatched ways); the ground and the walls are BD TOPO's
  const levels: DeckZoneSpec['levels'] = [{ name: defLevel, alt: upper }, ...hand.levels.filter((l) => l.ring)]
  const walls = lines.filter((f) => BT_WALL_NATURE.test(String(f.props.nature)))
  const btLines: [number, number][][] = walls.flatMap((f) => f.coords.map((pt) => pt.map((v) => [v[1], v[0]] as [number, number])))
  log.push(`bdtopo zone ${hand.name}: upper tier ${upper} (median of ${zs.length} vertices); ${btLines.length} wall lines (${walls.map((f) => f.props.nature === 'Quai' ? 'Q' : 'M').join('')})`)
  const btGround: NonNullable<DeckZoneSpec['btGround']> = (toLocal) => {
    const rsI = segIndex(btSegs(ground, toLocal)), wsI = segIndex(btSegs(walls, toLocal))
    const exact = (x: number, z: number): number | null => {
      const best = new Map<BtFeature, { d: number; z: number; px: number; pz: number }>()
      for (const s of rsI(x - BT_GROUND_R, z - BT_GROUND_R, x + BT_GROUND_R, z + BT_GROUND_R)) {
        if (Math.min(s.ax, s.bx) > x + BT_GROUND_R || Math.max(s.ax, s.bx) < x - BT_GROUND_R || Math.min(s.az, s.bz) > z + BT_GROUND_R || Math.max(s.az, s.bz) < z - BT_GROUND_R) continue
        const dx = s.bx - s.ax, dz = s.bz - s.az, t = Math.max(0, Math.min(1, ((x - s.ax) * dx + (z - s.az) * dz) / (dx * dx + dz * dz || 1)))
        const px = s.ax + dx * t, pz = s.az + dz * t, d = Math.hypot(px - x, pz - z)
        if (d > BT_GROUND_R) continue
        const b = best.get(s.f); if (b && b.d <= d) continue
        best.set(s.f, { d, z: s.za + (s.zb - s.za) * t, px, pz })
      }
      let sw = 0, sz = 0
      for (const b of best.values()) {
        if (wsI(Math.min(x, b.px), Math.min(z, b.pz), Math.max(x, b.px), Math.max(z, b.pz)).some((w) => crosses(x, z, b.px, b.pz, w.ax, w.az, w.bx, w.bz))) continue
        const wt = 1 / (b.d + BT_IDW_D0) ** BT_IDW_POW; sw += wt; sz += wt * b.z
      }
      return sw ? sz / sw : null
    }
    // the raster: BT_GROUND_STEP posts in lazy BT_TILE_POSTS tiles (only where the bake reads it), bilinear between posts
    const tiles = new Map<string, Float32Array>(), T = BT_TILE_POSTS, st = BT_GROUND_STEP
    const post = (i: number, j: number): number => {
      const ti = Math.floor(i / T), tj = Math.floor(j / T), k = `${ti},${tj}`
      let t = tiles.get(k)
      if (!t) { t = new Float32Array(T * T); for (let b = 0; b < T; b++) for (let a = 0; a < T; a++) t[b * T + a] = exact((ti * T + a) * st, (tj * T + b) * st) ?? NaN; tiles.set(k, t) }
      return t[(j - tj * T) * T + (i - ti * T)]
    }
    return (x, z, ex) => {
      if (ex) return exact(x, z)
      const fx = x / st, fz = z / st, i = Math.floor(fx), j = Math.floor(fz), tx = fx - i, tz = fz - j
      const a = post(i, j), b = post(i + 1, j), c = post(i, j + 1), d = post(i + 1, j + 1)
      if ([a, b, c, d].some(Number.isNaN)) return exact(x, z)
      return (a * (1 - tx) + b * tx) * (1 - tz) + (c * (1 - tx) + d * tx) * tz
    }
  }
  const btz: NonNullable<DeckZoneSpec['btz']> = (toLocal) => {
    // a bridge way matches BD TOPO's bridges (sol 1), any other way the rest (the Périphérique slip's OSM deck stood 2.8 m high)
    const segs = segIndex(btSegs(roads, toLocal)), onBridge = (s: BtSeg) => btSol(s.f) === '1', offBridge = (s: BtSeg) => btSol(s.f) !== '1'
    // (2026-11-08, the band's unmatched ways: a ground way never takes a TUNNEL troncon's z (sol −1: the Tunnel des Tuileries' 30 NGF
    //  under the upper quai's 34); only a way OSM itself puts below grade may)
    const atGrade = (s: BtSeg) => btSol(s.f) !== '1' && btSol(s.f) !== '-1'
    // (the others for the mutual-nearest rule, indexed once per edge list: rebuilt only when ways are added)
    let idxOf: PackedEdge[] | null = null, idxN = -1, idx: { br: EdgeIndex; gr: EdgeIndex } | null = null
    return (e, edges) => {
      if (idxOf !== edges || idxN !== edges.length) { idxOf = edges; idxN = edges.length; idx = { br: edgeIndex(edges.filter((o) => !!o.bridge)), gr: edgeIndex(edges.filter((o) => !o.bridge)) } }
      const m = btMatchEdge(e, segs, e.bridge ? onBridge : e.tunnel || (e.layer ?? 0) < 0 || !BT_GROUND_NO_TUNNEL ? offBridge : atGrade, e.bridge ? idx!.br : idx!.gr), n = m.length, z: (number | null)[] = m.map((v) => v?.z ?? null)
      const k = z.filter((v) => v !== null).length
      if (k < Math.max(1, BT_WAY_FRAC * n)) return null
      // unmatched vertices: interpolated along the way between matched ones, held at the ends
      const L = [0]; for (let i = 1; i < n; i++) L.push(L[i - 1] + Math.hypot(e.points[2 * i] - e.points[2 * i - 2], e.points[2 * i + 1] - e.points[2 * i - 1]))
      const f = z.map((v, i) => {
        if (v !== null) return v
        let a = i - 1; while (a >= 0 && z[a] === null) a--
        let b = i + 1; while (b < n && z[b] === null) b++
        return a >= 0 && b < n ? z[a]! + (z[b]! - z[a]!) * (L[i] - L[a]) / (L[b] - L[a] || 1) : a >= 0 ? z[a]! : z[b]!
      })
      const out = f.map((_, i) => {
        let sw = 0, sz = 0
        for (let j = 0; j < n; j++) { const w = 1 - Math.abs(L[j] - L[i]) / (BT_SMOOTH / 2); if (w > 0) { sw += w; sz += w * f[j] } }
        return sz / sw
      }) as (number | null)[] & { span?: [number, number] }
      // the matched run (vertices outside it only hold an end's z: used inside the ring, not out in the band)
      out.span = [z.findIndex((v) => v !== null), n - 1 - [...z].reverse().findIndex((v) => v !== null)]
      return out
    }
  }
  // the rails: BD TOPO's track z at a point, along a bearing (the same matching as the roads), or null
  const btRail: NonNullable<DeckZoneSpec['btRail']> = (toLocal) => {
    const segs = btSegs(railsBt, toLocal)
    return (x, z, ux, uz) => { const c = btCandidates(segs, x, z, ux, uz); if (!c.length) return null; c.sort((a, b) => a.d - b.d); return c[0].z }
  }
  log.push(`bdtopo zone ${hand.name}: ${railsBt.length} rail troncons; band ${BT_OUTER} m + ${BT_EASE} m ease past the ring`)
  log.push(`bdtopo zone ${hand.name}: ${roads.length} troncons, ${fz.filled} no-z vertices filled, ${fz.left} left; hand lay${(hand.lay ?? []).length ? ` (${hand.lay!.map((l) => l.name).join(', ')})` : ''} not used`)
  // the Seine band: no hand levels, pins, drops, ramps or ring; its shape and the riverbed floor; it eases out over BT_EASE
  // the lidar MNT at a local point (the band's unmatched ways measure their offset from a reference road with it): the local
  // frame inverted by an affine fit of toLocal at three points (an equirectangular projection: exact)
  const btMnt: NonNullable<DeckZoneSpec['btMnt']> = (toLocal) => {
    const la = (S + N) / 2, lo = (W + E) / 2, o = toLocal(la, lo), p = toLocal(la + 0.01, lo), q = toLocal(la, lo + 0.01)
    const a = (p.x - o.x) / 0.01, b = (q.x - o.x) / 0.01, c = (p.z - o.z) / 0.01, d = (q.z - o.z) / 0.01, det = a * d - b * c
    return (x, z) => { const dx = x - o.x, dz = z - o.z; return mnt.at(la + (d * dx - b * dz) / det, lo + (a * dz - c * dx) / det) }
  }
  if (sb) return { name: 'Seine band (BD TOPO)', ring: [], noFadeBelow: BAND_RIVERBED, levels: [{ name: 'band ground', alt: upper }], btz, btGround, btLines, btRail, btMnt, band: [0, BT_EASE], shape: sb }
  return { ...hand, name: `${hand.name} (BD TOPO)`, levels, lay: [], btz, btGround, btLines, btRail, band: [BT_OUTER, BT_EASE] }
}
