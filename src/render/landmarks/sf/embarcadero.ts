/**
 * EMBARCADERO CENTER — the elevated plaza NETWORK over the 4 main units, re-authored 2026-09-24 as ONE
 * CONTINUOUS STRUCTURE (see docs/EMBARCADERO-CENTER.md and the owner's own words there). This REPLACES the
 * previous four independently-fitted `embarcaderoUnit1..4` rings.
 *
 * ---- WHY THE OLD SHAPE WAS WRONG (owner, 2026-09-24)
 *
 * "Embarcadero is a large structure that winds through 5 blocks total, and we're not starting from scratch
 * on ALL of those blocks, they have some towers in the right places already. It also crosses right over
 * roads so thinking about it in blocks will be hard." And on the data: "The OSM footprints are incorrect, of
 * course... we need to not rely on OSM data for a structure that OSM doesn't even have the language to
 * model." The previous version built each unit's ring from ad hoc literal numbers, each unit reconciled to
 * its neighbours only after the fact — exactly the "four frames reconciled afterwards" the brief forbids.
 * This file now derives every unit's ring from ONE shared table (`TOWERS`, `NETWORK_ORIGIN` below), computed
 * once, so the units are consistent WITH EACH OTHER and with the five towers by construction, not by hand
 * -tuning. That is also the fix for the reported symptom "NONE of the connections between embarcadero units
 * are rendered": a deck fitted to a wrong ring lands slightly off, and the connections between them then have
 * nothing consistent to attach to.
 *
 * What already exists and is NOT touched here: the 5 towers (`embarcaderoCenter` in
 * showpieces/embarcadero-center.ts — `way/32612608/520/538`, `616812910`, `32947500`), the Hyatt Regency (`market-east.ts`), One
 * Maritime Plaza's own tower (`market-east.ts:1055`), and the Vaillancourt Fountain (`sf/art.ts`). Yerba Buena
 * is a different job entirely (a single block overridden wholesale, which OSM footprints ARE good enough
 * for) and is not touched by anything in this file.
 *
 * ---- THE NETWORK FRAME
 *
 * `NETWORK_ORIGIN` is one lat/lon for the whole network (not per-unit). `TOWERS` gives each of the 5 towers'
 * own centroid and rough footprint extent in that ONE frame, both measured from the real Overpass geometry
 * for `way/32947500` (West), `way/32612608` (EC1), `way/32612520` (EC2), `way/32612538` (EC3) and
 * `way/616812910` (EC4) — `tools/cache/overpass-*.json`, converted 2026-09-24 with the same
 * `111320*cos(lat)` / `110540` metres-per-degree constants `tools/model-shots.ts:fitForEntry` and
 * `tools/bake.ts` use, so this file's frame and the manifest/bake frame agree.
 *
 * Tried and abandoned: chasing the towers' own OSM polygon EDGES to find each tower's "facing facade" and
 * butting the deck against it exactly. The real Overpass rings for these towers are elaborate multi-notch
 * outlines (setbacks, bay recesses — 18 to 24 points each) with no long edge actually facing the plaza; the
 * "closest edge to the neighbour" by midpoint distance came out 4-13 m long, a corner jog, not a facade. That
 * is the concrete shape of the owner's warning that OSM has no language for this structure. So `gapQuad`
 * below uses each tower's CENTROID and its axis-aligned footprint half-extent (a robust, coarse measure that
 * does not depend on which notch happens to face which way) rather than any one polygon edge — real geometry,
 * honestly coarser than facade-level.
 *
 * `gapQuad(A, B, opts)` builds the one deck between two neighbouring towers: along the line joining their
 * centroids, pulled back off each tower's centroid to its own rough face (by that tower's own projected
 * half-extent), then eased a further fraction (`apron`) further IN — landing the deck edge ON each tower's
 * own roof rather than floating in the gap before it, matching "buildings that appear to be at plaza level
 * but are really at the top level of the lower building" (owner) for the tower ends themselves. Because the
 * SAME function with the SAME per-tower numbers is called for both of a tower's neighbouring units, there is
 * no way for the two decks meeting at that tower to disagree about where that tower's own edge is — the
 * single-frame guarantee the brief asked for, structurally, not by eyeballing it after the fact.
 *
 * What is still honestly UNRESOLVED, reported rather than invented (unchanged from before, still true):
 *   - deck HEIGHT: `PLAZA_H` is still one flat number for all four units. The owner: "one goes DOWN to a
 *     footbridge, and the next goes UP to Embarcadero 1" — this file does not resolve which unit is which; no
 *     elevation source at hand ties a specific unit to a specific height;
 *   - the HOLE's exact position/size per unit (`holeFrac`/`holeSize` below) — kept from the previous file's
 *     values, which were varied per unit's own gap/width ratio, not matched photo-to-unit;
 *   - Embarcadero 1's true plan (rectangle + triangle corner, one closed side) — still a plain rectangle,
 *     4-edge colonnade, an acknowledged simplification (see EMBARCADERO-CENTER.md);
 *   - One Maritime Plaza's own court/link and the spiral stairs between units are still not in this file —
 *     One Maritime is a 5th unit on a different footprint (single tower over a garage) with its own,
 *     separately-flagged job (BUGS.md #180, addressed by `oneMaritimeGrassCourt` below, kept minimal).
 *
 * ---- CONNECTIVITY (unchanged finding from the previous pass, still valid): the West↔EC1, EC1↔(toward One
 * Maritime) and EC2↔EC3 gaps are already threaded by real OSM steps/footway-bridge ways (visually wrong per
 * BUGS.md #136, but graph-connected — that is the separate `coversRaised`/mezzanine job, not this one). The
 * EC3↔EC4 gap has NO OSM way crossing it and is closed by one `Region.stairways` entry in
 * `src/city/regions.json` (san-francisco region), as before — not touched again here.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { deckCut, edgeAt, insetRing, boxAlong, railing } from '../parts.ts'
import type { Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { capPolygon } from '../../buildings.ts'
import { EMBARCADERO_PODIUM_DECKS, EC_PODIUM_Y } from '../../../city/sf/bridges.ts'

type P2 = { x: number; z: number }

const BRICK: Rgb = [0.66, 0.4, 0.32]
const BRICK_DK: Rgb = [0.56, 0.32, 0.26]
const PIER: Rgb = [0.42, 0.41, 0.4]
const CANOPY: Rgb = [0.46, 0.45, 0.44]
const FENCE: Rgb = [0.86, 0.86, 0.84]
const WELL_WALL: Rgb = [0.36, 0.35, 0.34]
const FLOOR: Rgb = [0.4, 0.39, 0.38]
const LAWN: Rgb = [0.36, 0.5, 0.3]
const CONC_TAG = surfaceTag('concrete')

// ---------------------------------------------------------------------------------------------------------
// THE NETWORK FRAME — one origin, one table, for the whole complex. See the file header.
// ---------------------------------------------------------------------------------------------------------

/** One lat/lon for the whole network. Every unit's manifest lat/lon below is derived FROM this, not the other way round. */
const NETWORK_ORIGIN = { lat: 37.7946, lon: -122.3985 }
const KX = 111320 * Math.cos((NETWORK_ORIGIN.lat * Math.PI) / 180)
const KZ = 110540

/** A tower's centroid + rough axis-aligned footprint extent, in the network frame — see header for sourcing. */
type Tower = { x: number; z: number; w: number; d: number }
const TOWERS: Record<'West' | 'EC1' | 'EC2' | 'EC3' | 'EC4', Tower> = {
  West: { x: -181.42, z: -85.34, w: 46.5, d: 42.5 }, // way/32947500
  EC1: { x: -98.89, z: -12.69, w: 77.6, d: 37.4 }, // way/32612608
  EC2: { x: -6.94, z: 43.04, w: 82.3, d: 43.9 }, // way/32612520
  EC3: { x: 104.76, z: 59.86, w: 80.4, d: 44.7 }, // way/32612538
  EC4: { x: 204.82, z: 79.99, w: 64.4, d: 45.7 }, // way/616812910
}

/** network-frame (x,z), relative to NETWORK_ORIGIN, to WGS84 — the inverse of the projection used to build TOWERS. */
function toLatLon(x: number, z: number): { lat: number; lon: number } {
  return { lat: NETWORK_ORIGIN.lat + z / KZ, lon: NETWORK_ORIGIN.lon + x / KX }
}

/**
 * The one deck between two neighbouring towers, in NETWORK-frame coordinates (not yet re-centred on a
 * manifest entry). Anticlockwise, matching `Fit.ring`'s convention (checked against the previous file's
 * hand-built rings, same shoelace sign).
 */
function gapQuad(a: Tower, b: Tower, opts: { widthScale?: number; apron?: number } = {}): { ring: P2[]; centre: P2 } {
  const dx = b.x - a.x
  const dz = b.z - a.z
  const dist = Math.hypot(dx, dz)
  const dnx = dx / dist
  const dnz = dz / dist
  const pnx = -dnz
  const pnz = dnx
  // each tower's own projected half-extent toward the other tower / across the gap — a coarse, robust
  // measure (axis-aligned bbox), not a polygon edge: see the header note on why the real edges do not work.
  const reachA = Math.abs((a.w / 2) * dnx) + Math.abs((a.d / 2) * dnz)
  const reachB = Math.abs((b.w / 2) * dnx) + Math.abs((b.d / 2) * dnz)
  const perpA = Math.abs((a.w / 2) * pnx) + Math.abs((a.d / 2) * pnz)
  const perpB = Math.abs((b.w / 2) * pnx) + Math.abs((b.d / 2) * pnz)
  const gap = dist - reachA - reachB
  const apron = gap * (opts.apron ?? 0.15) // ease the deck edge onto each tower's own roof, not floating before it
  const insetA = reachA - apron
  const insetB = reachB - apron
  const width = Math.min(perpA, perpB) * (opts.widthScale ?? 1.5)
  const endA = { x: a.x + dnx * insetA, z: a.z + dnz * insetA }
  const endB = { x: b.x - dnx * insetB, z: b.z - dnz * insetB }
  const ring: P2[] = [
    { x: endA.x - (pnx * width) / 2, z: endA.z - (pnz * width) / 2 },
    { x: endB.x - (pnx * width) / 2, z: endB.z - (pnz * width) / 2 },
    { x: endB.x + (pnx * width) / 2, z: endB.z + (pnz * width) / 2 },
    { x: endA.x + (pnx * width) / 2, z: endA.z + (pnz * width) / 2 },
  ]
  const cx = ring.reduce((s, p) => s + p.x, 0) / 4
  const cz = ring.reduce((s, p) => s + p.z, 0) / 4
  return { ring: ring.map((p) => ({ x: p.x - cx, z: p.z - cz })), centre: { x: cx, z: cz } }
}

/** The manifest lat/lon each unit MUST use — derived from the same network table as its ring, so the two never disagree. */
export function unitLatLon(pair: 'West-EC1' | 'EC1-EC2' | 'EC2-EC3' | 'EC3-EC4'): { lat: number; lon: number } {
  const [a, b] = pair.split('-') as ['West' | 'EC1' | 'EC2', 'EC1' | 'EC2' | 'EC3' | 'EC4']
  const { centre } = gapQuad(TOWERS[a], TOWERS[b])
  return toLatLon(centre.x, centre.z)
}

/** point-in-polygon (ray cast), for scattering the canopy grid inside a unit's own ring only */
function inRing(ring: P2[], x: number, z: number): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i]
    const b = ring[j]
    if (a.z > z !== b.z > z && x < ((b.x - a.x) * (z - a.z)) / (b.z - a.z) + a.x) inside = !inside
  }
  return inside
}

/**
 * THE COVERED WALKWAY'S CANOPY: a grid of square brutalist piers under a coffered slab, covering most of the
 * deck's interior — the signature element the owner named after seeing the real photographs (`emb-4`, `emb-6`
 * top-down aerials), not an open brick apron. Skips a margin around the hole and near the deck's own edge.
 */
function canopy(out: MeshBuilder, ring: P2[], hole: P2[], y: number, opts: { pitch?: number; height?: number } = {}): void {
  const pitch = opts.pitch ?? 7
  const clear = opts.height ?? 3.6
  // the grid follows the DECK'S OWN axes (edge 0's tangent/normal, from `edgeAt`), not world x/z — the units
  // sit at an angle to the city grid, so a world-aligned grid crosses the piers on the diagonal.
  const e0 = edgeAt(ring, 0)
  const ax = { x: e0.tx, z: e0.tz }
  const az = { x: e0.nx, z: e0.nz }
  const toUV = (p: P2): { u: number; v: number } => ({ u: p.x * ax.x + p.z * ax.z, v: p.x * az.x + p.z * az.z })
  const toXZ = (u: number, v: number): P2 => ({ x: u * ax.x + v * az.x, z: u * ax.z + v * az.z })
  let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity
  for (const p of ring) { const q = toUV(p); u0 = Math.min(u0, q.u); u1 = Math.max(u1, q.u); v0 = Math.min(v0, q.v); v1 = Math.max(v1, q.v) }
  let hu0 = Infinity, hu1 = -Infinity, hv0 = Infinity, hv1 = -Infinity
  for (const p of hole) { const q = toUV(p); hu0 = Math.min(hu0, q.u); hu1 = Math.max(hu1, q.u); hv0 = Math.min(hv0, q.v); hv1 = Math.max(hv1, q.v) }
  const nu = Math.max(1, Math.round((u1 - u0) / pitch))
  const nv = Math.max(1, Math.round((v1 - v0) / pitch))
  for (let i = 0; i <= nu; i++) {
    for (let k = 0; k <= nv; k++) {
      const u = u0 + (i / nu) * (u1 - u0)
      const v = v0 + (k / nv) * (v1 - v0)
      const { x, z } = toXZ(u, v)
      if (u < hu0 - 1.5 || u > hu1 + 1.5 || v < hv0 - 1.5 || v > hv1 + 1.5) {
        if (!inRing(ring, x, z)) continue
      } else continue
      boxAlong(out, x, y + clear / 2, z, 0.45, clear / 2, 0.45, e0.heading, PIER, CONC_TAG)
      boxAlong(out, x, y + clear + 0.2, z, pitch / 2 - 0.3, 0.2, pitch / 2 - 0.3, e0.heading, CANOPY, CONC_TAG)
    }
  }
}

/** Deck height above each unit's own local ground — see the header note: one flat number is an acknowledged gap. */
const PLAZA_H = 8

/**
 * A row of heavy square brutalist piers along one edge of the deck, under a plain concrete beam. Square and
 * plain, deliberately NOT `colonnade()`'s round classical columns. Drawn using `edgeAt`'s heading directly.
 */
function pierRow(out: MeshBuilder, ring: P2[], edgeIndex: number, y0: number, y1: number, opts: { pitch?: number; size?: number } = {}): void {
  const e = edgeAt(ring, edgeIndex)
  const size = opts.size ?? 1.1
  const pitch = opts.pitch ?? 5.5
  const n = Math.max(2, Math.round(e.L / pitch))
  const h = (y1 - y0) / 2
  for (let i = 0; i <= n; i++) {
    const u = (i / n) * e.L
    const cx = e.a.x + e.tx * u
    const cz = e.a.z + e.tz * u
    boxAlong(out, cx, y0 + h, cz, size / 2, h, size / 2, e.heading, PIER, CONC_TAG)
  }
  const bx = (e.a.x + e.b.x) / 2 + e.nx * (size * 0.5)
  const bz = (e.a.z + e.b.z) / 2 + e.nz * (size * 0.5)
  boxAlong(out, bx, y1 + 0.35, bz, e.L / 2, 0.35, size * 0.7, e.heading, PIER, CONC_TAG)
}

/** One elevated plaza unit: a brick deck with a hole, brutalist piers on all 4 edges, and the canopy grid. */
function brickPlaza(out: MeshBuilder, ring: P2[], y: number, opts: { holeFrac: number; holeSize: number; wellDepth?: number }): P2[] {
  let cx = 0
  let cz = 0
  for (const p of ring) { cx += p.x; cz += p.z }
  cx /= ring.length
  cz /= ring.length
  const eAxis = edgeAt(ring, 1)
  const along = { x: -eAxis.nx, z: -eAxis.nz }
  const perp = { x: eAxis.tx, z: eAxis.tz }
  const offset = (opts.holeFrac - 0.5) * 2
  const halfLen = edgeAt(ring, 0).L / 2
  const hx = cx + along.x * (offset * halfLen * 0.35)
  const hz = cz + along.z * (offset * halfLen * 0.35)
  const hw = opts.holeSize
  const hole: P2[] = [
    { x: hx - along.x * hw / 2 - perp.x * hw / 2, z: hz - along.z * hw / 2 - perp.z * hw / 2 },
    { x: hx + along.x * hw / 2 - perp.x * hw / 2, z: hz + along.z * hw / 2 - perp.z * hw / 2 },
    { x: hx + along.x * hw / 2 + perp.x * hw / 2, z: hz + along.z * hw / 2 + perp.z * hw / 2 },
    { x: hx - along.x * hw / 2 + perp.x * hw / 2, z: hz - along.z * hw / 2 + perp.z * hw / 2 },
  ]
  deckCut(out, ring, y, hole, {
    depth: opts.wellDepth ?? 10.8,
    deck: BRICK,
    wall: WELL_WALL,
    floor: FLOOR,
    material: 'brick',
    kerb: 0,
  })
  railingAroundHole(out, hole, y)
  void BRICK_DK
  out.decks.push({ ring, y })
  return hole
}

function railingAroundHole(out: MeshBuilder, hole: P2[], y: number): void {
  const loop = [...hole, hole[0]]
  railing(out, loop, y, { kind: 'posts', height: 1.0, colour: FENCE, spacing: 1.4 })
}

/** Builds one unit from its own ring (already re-centred on the manifest entry's lat/lon) and hole params. */
function unit(out: MeshBuilder, ring: P2[], opts: { holeFrac: number; holeSize: number }): void {
  const hole = brickPlaza(out, ring, PLAZA_H, opts)
  for (let i = 0; i < ring.length; i++) pierRow(out, ring, i, PLAZA_H, PLAZA_H + 3.2, { pitch: 6 })
  canopy(out, ring, hole, PLAZA_H)
}

// ---------------------------------------------------------------------------------------------------------
// the 4 units — each ring now comes from `gapQuad` against the SAME `TOWERS` table, not a hand-typed
// literal. `unitLatLon` (exported above) gives the manifest entries their lat/lon from the same call, so
// code and manifest cannot drift apart independently — see `public/landmarks/san-francisco/embarcadero.json`.
// ---------------------------------------------------------------------------------------------------------

/** Unit West↔EC1 — the widest gap of the four. */
export function embarcaderoUnit1(out: MeshBuilder, _fit?: Fit): void {
  void _fit
  unit(out, gapQuad(TOWERS.West, TOWERS.EC1).ring, { holeFrac: 0.42, holeSize: 17 })
}

/** Unit EC1↔EC2. */
export function embarcaderoUnit2(out: MeshBuilder, _fit?: Fit): void {
  void _fit
  unit(out, gapQuad(TOWERS.EC1, TOWERS.EC2).ring, { holeFrac: 0.58, holeSize: 15 })
}

/** Unit EC2↔EC3 — the narrowest gap of the four, so genuinely the smallest deck and hole. */
export function embarcaderoUnit3(out: MeshBuilder, _fit?: Fit): void {
  void _fit
  unit(out, gapQuad(TOWERS.EC2, TOWERS.EC3).ring, { holeFrac: 0.5, holeSize: 11 })
}

/** Unit EC3↔EC4 — nearest the Hyatt Regency and the Vaillancourt Fountain block; touches neither. */
export function embarcaderoUnit4(out: MeshBuilder, _fit?: Fit): void {
  void _fit
  unit(out, gapQuad(TOWERS.EC3, TOWERS.EC4).ring, { holeFrac: 0.38, holeSize: 16 })
}

/**
 * BUGS.md #180, part 2: One Maritime Plaza Park — the lawn with sculptures on the podium roof west of the
 * One Maritime tower (`embarcadero-maritime-aerial.png`), currently missing entirely. Built as its own small
 * standalone entry (own `size`+`lat`+`lon`, no OSM id) rather than folded into the 4 units above: it sits on
 * One Maritime's own podium, not between two of the five main towers, so it is not a `gapQuad` unit — see the
 * file header ("a fifth unit on a different footprint"). Minimal: a raised lawn slab at podium height with a
 * low kerb; the sunken-brick-building half of #180 is a `coversRaised`/terrain-datum problem in whatever
 * places that building (not this file — no such building is built here) and is reported, not fixed here.
 */
export function oneMaritimeGrassCourt(out: MeshBuilder, _fit?: Fit): void {
  void _fit
  const w = 26
  const d = 34
  const y = 8 // matches PLAZA_H / oneMaritimePlaza's own PODIUM=9 order of magnitude — see file header
  const ring: P2[] = [{ x: -w / 2, z: -d / 2 }, { x: w / 2, z: -d / 2 }, { x: w / 2, z: d / 2 }, { x: -w / 2, z: d / 2 }]
  out.decks.push({ ring, y }) // lets the planting pass edge it in shrubs, same as the plaza decks
  boxAlong(out, 0, y - 0.15, 0, w / 2, 0.15, d / 2, 0, LAWN) // the lawn slab itself — plain colour, no SURFACES entry for grass
  railing(out, [...ring, ring[0]], y, { kind: 'posts', height: 0.5, colour: FENCE, spacing: 2 }) // a low kerb rail round it
}

/**
 * The podium level as a whole (2026-10-03): its walks are OSM's, lifted onto the decks declared in
 * src/city/sf/bridges.ts (`EMBARCADERO_PODIUM_DECKS`) and drawn as raised walks by the city. Of its own it draws the
 * plaza on the Golden Gateway Garage's roof round One Maritime Plaza — brick, a hand under the walks on it, with a
 * concrete fascia down its edge — the deck's own ring, so plaza and walks cannot disagree. The entry stands at
 * `EC_PODIUM`, unrotated, with `baseY` 0: this frame is the city's, shifted.
 */
export function embarcaderoPodium(out: MeshBuilder, _fit?: Fit): void {
  const ring = EMBARCADERO_PODIUM_DECKS.find((d) => d.ring)?.ring
  if (!ring) return
  const y = EC_PODIUM_Y - 0.1
  // (anticlockwise for the cap and for outward-facing fascia)
  const area = ring.reduce((s, p, i) => { const q = ring[(i + 1) % ring.length]; return s + p.x * q.z - q.x * p.z }, 0)
  const ccw = area > 0 ? ring : [...ring].reverse()
  capPolygon(out, ccw, y, [0.56, 0.37, 0.31], CONC_TAG)
  for (let i = 0; i < ccw.length; i++) {
    const a = ccw[i], b = ccw[(i + 1) % ccw.length]
    const len = Math.hypot(b.x - a.x, b.z - a.z) || 1
    const n: [number, number, number] = [(b.z - a.z) / len, 0, -(b.x - a.x) / len]
    out.quad([[a.x, y - 1.4, a.z], [b.x, y - 1.4, b.z], [b.x, y, b.z], [a.x, y, a.z]], n, [[0, 0], [1, 0], [1, 1], [0, 1]], PIER, CONC_TAG)
  }
}

/*
 * `embarcaderoUnit1..4` are not registered (2026-10-03): their "gap between two towers" quads landed across Battery,
 * Front, Davis and Drumm streets. Kept for their vocabulary (brick deck, hole, colonnade, canopy), to be re-placed on
 * the low building:part rings south of the promenade.
 */
export const EMBARCADERO: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  oneMaritimeGrassCourt, embarcaderoPodium,
}

void insetRing
