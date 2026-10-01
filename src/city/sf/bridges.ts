/**
 * SAN FRANCISCO'S BRIDGES, AS THE WAYS OVER THEM NEED THEM: each model's roadway profile and the decks it declares
 * (src/city/bridge-decks.ts). Here, and not beside the models (src/render/landmarks/sf/golden-gate.ts,
 * bay-bridge.ts), because the BAKE conforms the ways to these (tools/deck-conform.ts) and the bake runs under plain
 * node, which cannot load the renderer. The models import their profiles from here, so a model and its declared
 * deck cannot disagree.
 *
 * Frames: each model's own — z along the bridge, x across it, y over the water line.
 */
import type { DeckDecl } from '../bridge-decks.ts'

// ---------------------------------------------------------------- the Golden Gate
export const GG_MAIN = 1280
export const GG_SIDE = 343
export const GG_DECK_HALF = 13.7

/**
 * The roadway's height at z, over the water line: 69.5 m at the towers, sagging to 67 m at mid-span (the published
 * figures), falling 0.4% down the north side span and approach to Marin — and on the SAN FRANCISCO side falling
 * 2.9% from the south tower, over the side span, the Fort Point arch and the approach, to meet the curved approach
 * road near the toll plaza on the bluff (37.8081 −122.4766, 34 m lower than the deck at the tower: the rider rolls
 * down off the bridge into the city, as they do).
 *
 * History: from 2026-09-24 this profile was flattened (0.55 m sag, 0.1% fall) and the model sunk 18 m into the sea
 * (`baseY` −102.86) to meet a ridden sidewalk that the bake had profiled 18 m under the real deck. From 2026-09-29
 * the model is the truth: it stands at the real sea level and the ways are conformed to IT (src/city/bridge-decks.ts,
 * `GOLDEN_GATE_DECKS` below) — the owner: "the paths all need to line up to bike over the bridge models".
 */
const SOUTH_FALL = 0.0286
const NORTH_FALL = 0.004
export const goldenGateDeckY = (z: number): number => {
  const a = Math.abs(z)
  if (a <= GG_MAIN / 2) {
    const t = a / (GG_MAIN / 2)
    return 67 + 2.5 * t * t
  }
  return 69.5 - (z < 0 ? SOUTH_FALL : NORTH_FALL) * (a - GG_MAIN / 2)
}

/**
 * The deck a rider rides, for src/city/bridge-decks.ts: the roadway and its sidewalks from the end of the south
 * approach to the end of the north one, the full width between the railings, at `deckY`. The ways over the bridge
 * (the carriageways, both sidewalks) take their heights from this.
 */
/**
 * Where the STRAIGHT bridge ends, each way (z, this frame). Measured from the ways themselves (OSM): all four —
 * the two carriageways, the two sidewalks — run dead straight from z −1100 to z 1275 and then swing off, east to the
 * toll plaza at the San Francisco end and west to Vista Point at the Marin end, 45 m off the axis within 150 m. The
 * model's deck, and the deck declared for the ways, stop where the straight does; the curved viaducts beyond are
 * the ways' own structure (render/bridges.ts), graded from the deck's end to the ground (src/city/bridge-decks.ts).
 * (Until 2026-09-30 the model ran straight on to −1200: its last hundred metres stood empty beside the road.)
 */
export const GG_SOUTH_ANCHORAGE = 30
export const GG_FORT_POINT_ARCH = 90
export const GG_SOUTH_END = -(GG_MAIN / 2 + GG_SIDE) - GG_SOUTH_ANCHORAGE - GG_FORT_POINT_ARCH - 2
export const GG_NORTH_END = 1275
export const GOLDEN_GATE_DECKS: DeckDecl[] = [
  {
    from: GG_SOUTH_END, to: GG_NORTH_END, half: GG_DECK_HALF, y: goldenGateDeckY,
    // (the slab the model draws: 0.4 m inside the railings, end to end)
    model: { from: GG_SOUTH_END, to: GG_NORTH_END, half: GG_DECK_HALF - 0.4 },
  },
]

// ---------------------------------------------------------------- the Bay Bridge, west span
export const BAY_ANCHOR_HALF = 30          // the central anchorage's half-length along the bridge
export const BAY_SIDE = 353
export const BAY_MAIN = 704
/** the upper roadway at the crest, over the water */
export const BAY_DECK_TOP = 72
/** the upper roadway over the lower */
export const BAY_BETWEEN = 9.5
/**
 * Where the lower deck meets the land, in this frame (z along the bridge, y over the water): on Rincon Hill, where
 * OSM's freeway stops being a bridge and the ground is 24.6 m up — the deck 5.4 m over it, because an exit ramp
 * passes under the last short bridge there, and the freeway comes down to the ground beyond; at the west mouth of the Yerba Buena tunnel; and at
 * the far side of the island, where the tunnel's roadway comes out onto the hillside. Measured from the baked
 * terrain (tools/bridge-chain.ts), which is what the deck has to meet — not from a survey.
 */
const SF_LAND = { z: -1734, y: 30 }
const YBI_PORTAL = { z: 1684, y: 54.0 }
const YBI_EAST = { z: 1907, y: 56.1 }
/** how much of each fall is a steady grade (the rest steepens away from the crest) */
const STEADY = 0.4

/** The LOWER roadway's height at z (eastbound, inside the truss). */
export const bayLowerY = (z: number): number => {
  const crest = BAY_DECK_TOP - BAY_BETWEEN
  const fall = (t: number): number => STEADY * t + (1 - STEADY) * t * t
  if (z <= 0) return crest - (crest - SF_LAND.y) * fall(Math.min(1, -z / -SF_LAND.z))
  if (z <= YBI_PORTAL.z) return crest - (crest - YBI_PORTAL.y) * fall(z / YBI_PORTAL.z)
  // through the tunnel and out: a steady climb of 1%
  return YBI_PORTAL.y + (YBI_EAST.y - YBI_PORTAL.y) * Math.min(1, (z - YBI_PORTAL.z) / (YBI_EAST.z - YBI_PORTAL.z))
}
/** The UPPER roadway's (westbound, on top): the lower's, and the truss between. */
export const bayUpperY = (z: number): number => bayLowerY(z) + BAY_BETWEEN

/**
 * The decks a rider rides, for src/city/bridge-decks.ts — by OSM layer, since that is what tells the two roadways
 * apart (they are 4 m apart in plan): the lower is layer 1 on the span, a plain motorway on layer 0 for a hundred
 * metres at each end of it (named by kind, so the streets under the bridge are not taken), and layer −2 through
 * the tunnel; the upper is layer 2 on the span, −1 through the tunnel and 3 beyond it. Wider than the roadways,
 * because the approach over Rincon Hill swings 25 m off the axis before it leaves the declared stretch.
 */
/**
 * THE EAST SPAN, from Yerba Buena to the Oakland shore: no model yet (it is outside the city the models were made
 * for), but its ways are ridden — the Bay Bridge Trail runs along it, and the owner wants to ride it — and the bake
 * had all three of them (the two carriageways and the trail) humped a few metres over the water for three
 * kilometres. One deck for all three, along the line they take: 54.5 m up where the carriageways have come
 * together off the island, a steady 1.7% down to the shore at Oakland, as the skyway does. Off its west end the
 * ramps on the island are graded up to the two roadways of the tunnel (src/city/bridge-decks.ts).
 *
 * The line, in the west span's frame: the eastbound carriageway's, from OSM; the westbound is 50 m to its left and
 * the trail 25 m to its right, hence the width.
 */
const EAST_PATH = [
  { x: 53, z: 2500 }, { x: 102, z: 2712 }, { x: 150, z: 2905 }, { x: 201, z: 3101 }, { x: 275, z: 3265 }, { x: 367, z: 3423 },
  { x: 490, z: 3580 }, { x: 622, z: 3735 }, { x: 880, z: 4050 }, { x: 1136, z: 4364 }, { x: 1388, z: 4670 }, { x: 1636, z: 4945 },
  { x: 1690, z: 5005 },
]
const EAST_LENGTH = EAST_PATH.reduce((s, q, i) => (i === 0 ? 0 : s + Math.hypot(q.x - EAST_PATH[i - 1].x, q.z - EAST_PATH[i - 1].z)), 0)
const EAST_FROM = 54.5
const EAST_TO = 3.5
const EAST_SPAN: DeckDecl = {
  from: 0, to: EAST_LENGTH, half: 62, path: EAST_PATH,
  y: (s) => EAST_FROM + (EAST_TO - EAST_FROM) * Math.max(0, Math.min(1, s / EAST_LENGTH)),
}

const FREEWAY = ['motorway', 'motorway_link']
export const BAY_BRIDGE_DECKS: DeckDecl[] = [
  // (`ride`: the freeway on these decks is ridden — the only freeway in the city that is, BRIDGES.md)
  // (`model`: the near model draws the lower roadway 9.5 m either side of the axis from −1662 to 1560, the upper
  // 10 m from −1636 — bay-bridge.ts NEAR_FROM, NEAR_UPPER_FROM, NEAR_TO; the rest is the ways' own structure)
  { from: -1745, to: 1559, half: 20, y: bayLowerY, layer: 1, ride: true, model: { from: -1662, to: 1560, half: 9.5 } },
  { from: -1736, to: -1588, half: 20, y: bayLowerY, layer: 0, kinds: FREEWAY, ride: true, model: { from: -1662, to: 1560, half: 9.5 } },
  { from: 1555, to: 1909, half: 12, y: bayLowerY, layer: 0, kinds: FREEWAY, ride: true },
  { from: 1682, to: 1862, half: 12, y: bayLowerY, layer: -2, ride: true },
  { from: -1762, to: 1691, half: 24, y: bayUpperY, layer: 2, ride: true, model: { from: -1636, to: 1560, half: 10 } },
  { from: 1687, to: 1862, half: 12, y: bayUpperY, layer: -1, ride: true },
  { from: 1858, to: 1943, half: 12, y: bayUpperY, layer: 3, ride: true },
  EAST_SPAN,
]

// ---------------------------------------------------------------- the Bay Bridge Bikeway (fictional)
/*
 * THE BAY BRIDGE BIKEWAY (owner, 2026-09-30: "adding a nonexistent bikes-only entrance to the decks of the bridge,
 * because it genuinely is fun to bike on a virtual freeway"). Nobody may ride the real west span; here a rider
 * reaches it by a bikes-only HELIX in the bay beside the first tower, from The Embarcadero at Harrison Street: a
 * boardwalk over the water to its foot, six and a quarter turns up to a bridge across to the LOWER deck
 * (eastbound), two more to a bridge across to the UPPER deck (westbound, coming home). At Yerba Buena the real
 * ramps are ridden off the lower deck to Treasure Island Road and onto the upper from Macalla Road
 * (`BAY_RIDDEN_RAMPS`). Every other freeway way and ramp is out of the ride network (src/city/ridegraph.ts).
 *
 * Authored, not OSM: the bake adds these as ways of its own (tools/bake.ts, like the region's stairways), each
 * end joined to a real junction — a street node, or the deck way's own node nearest the point given. Their heights
 * are these, fixed (src/city/bridge-decks.ts does not regrade them), and the model draws them (bay-bridge.ts
 * `helix`), so the ways and the structure are one geometry. All in the Bay Bridge model's frame.
 */
export interface AuthoredWay {
  name: string
  /** the plan, this model's frame, and the height over the water at each point (model y) */
  points: { x: number; z: number; y: number }[]
  /** what each end joins: a known OSM node, or the nearest node of a way of this kind and layer */
  a: AuthoredEnd
  b: AuthoredEnd
  kind: 'cycleway'
}
export type AuthoredEnd = { node: number } | { onto: { kind: string; layer: number } } | { free: true }

/** the helix: its centre, radius at the foot and how much it opens each turn (so no two turns share a point) */
export const HELIX = { x: -62, z: -1070, r: 18, open: 0.3, foot: 4, landTurns: 6.25, upperTurns: 2 }
/** the deck junctions on the axis, level with the helix's east side */
const HELIX_Z = -1070
const helixAt = (phi: number): { x: number; z: number } => {
  const r = HELIX.r + (HELIX.open * (phi + Math.PI / 2)) / (2 * Math.PI)
  return { x: HELIX.x + r * Math.cos(phi), z: HELIX.z + r * Math.sin(phi) }
}
/** the helix from angle phi0 to phi1, its height straight in arc length from y0 to y1, a point every ~4 m */
function helixRun(phi0: number, phi1: number, y0: number, y1: number): { x: number; z: number; y: number }[] {
  const n = Math.ceil(((phi1 - phi0) * (HELIX.r + 2)) / 4)
  const pts = Array.from({ length: n + 1 }, (_, i) => helixAt(phi0 + ((phi1 - phi0) * i) / n))
  const cum = [0]
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z))
  const L = cum[cum.length - 1]
  return pts.map((q, i) => ({ ...q, y: y0 + ((y1 - y0) * cum[i]) / L }))
}
const LOWER_Y = bayLowerY(HELIX_Z)
const UPPER_Y = bayUpperY(HELIX_Z)
// (angles: 0 is +x, towards the bridge; the climb runs anticlockwise from the south point)
const PHI_FOOT = -Math.PI / 2
const PHI_LOWER = PHI_FOOT + 2 * Math.PI * HELIX.landTurns
const PHI_UPPER = PHI_LOWER + 2 * Math.PI * HELIX.upperTurns
const level = (from: { x: number; z: number }, to: { x: number; z: number }, y: number, step = 4): { x: number; z: number; y: number }[] => {
  const n = Math.max(1, Math.ceil(Math.hypot(to.x - from.x, to.z - from.z) / step))
  return Array.from({ length: n + 1 }, (_, i) => ({ x: from.x + ((to.x - from.x) * i) / n, z: from.z + ((to.z - from.z) * i) / n, y }))
}
const foot = helixAt(PHI_FOOT)
const lowerLanding = helixAt(PHI_LOWER)
const upperLanding = helixAt(PHI_UPPER)
export const BAY_BIKEWAY: AuthoredWay[] = [
  // from The Embarcadero at Harrison Street, out over the water between the piers to the helix's foot
  {
    name: 'Bay Bridge Bikeway', kind: 'cycleway', a: { node: 6311843504 }, b: { free: true },
    points: [{ x: -96, z: -1209, y: 3.2 }, { x: -100, z: -1180, y: 3.4 }, { x: -95, z: -1155, y: 3.6 }, { x: -82, z: -1130, y: 3.8 },
      { x: -70, z: -1106, y: 4 }, { x: foot.x, z: foot.z, y: HELIX.foot }],
  },
  { name: 'Bay Bridge Bikeway', kind: 'cycleway', a: { free: true }, b: { free: true }, points: helixRun(PHI_FOOT, PHI_LOWER, HELIX.foot, LOWER_Y) },
  { name: 'Bay Bridge Bikeway', kind: 'cycleway', a: { free: true }, b: { free: true }, points: helixRun(PHI_LOWER, PHI_UPPER, LOWER_Y, UPPER_Y) },
  // across to the decks, level: the lower roadway on the axis, the upper 3.5 m to its left
  { name: 'Bay Bridge Bikeway', kind: 'cycleway', a: { free: true }, b: { onto: { kind: 'motorway', layer: 1 } }, points: level(lowerLanding, { x: 0, z: HELIX_Z }, LOWER_Y) },
  { name: 'Bay Bridge Bikeway', kind: 'cycleway', a: { free: true }, b: { onto: { kind: 'motorway', layer: 2 } }, points: level(upperLanding, { x: -3.5, z: HELIX_Z }, UPPER_Y) },
]

/**
 * The real ramps at Yerba Buena ridden by bike (`ridden`), by the OSM nodes at their ends: off the lower deck past
 * the tunnel to Treasure Island Road, and from Macalla Road up onto the upper deck.
 */
export const BAY_RIDDEN_RAMPS: [number, number][] = [
  [4377020523, 9531429383], [9531429383, 9531429384], [9531429384, 9531429365], [9531429365, 9531429382], [9531429382, 9531429371],
  [416343071, 3297617250], [3297617250, 5839943915], [5839943915, 2443845209],
]

/**
 * LONG JOBS OVER THE BAY BRIDGE (src/game/delivery.ts `crossings`): near the Bikeway's foot on The Embarcadero, now
 * and then a job is delivered to the islands; on the islands, now and then to the waterfront. Lat, lon; radius m.
 */
export const BAY_CROSSINGS: { name: string; from: { lat: number; lon: number; r: number }; places: { name: string; lat: number; lon: number }[]; chance: number }[] = [
  {
    name: 'to the islands', chance: 0.35, from: { lat: 37.789645, lon: -122.388406, r: 900 },
    places: [
      { name: 'Avenue M & California Avenue, Treasure Island', lat: 37.820875, lon: -122.364028 },
      { name: '6th Street & Avenue I, Treasure Island', lat: 37.824028, lon: -122.36795 },
      { name: 'Seven Seas Avenue & Trade Winds Avenue, Treasure Island', lat: 37.818153, lon: -122.370451 },
      { name: 'Avenue N & Clipper Cove Way, Treasure Island', lat: 37.819393, lon: -122.364335 },
      { name: 'Bristol Court & Macalla Road, Yerba Buena Island', lat: 37.811469, lon: -122.365858 },
      { name: 'Meadow Drive & Yerba Buena Road, Yerba Buena Island', lat: 37.810751, lon: -122.367563 },
    ],
  },
  {
    name: 'to the city', chance: 0.35, from: { lat: 37.817255, lon: -122.367097, r: 1600 },
    places: [
      { name: 'Harrison Street & The Embarcadero', lat: 37.789645, lon: -122.388406 },
      { name: 'Folsom Street & The Embarcadero', lat: 37.790748, lon: -122.390148 },
      { name: 'Howard Street & The Embarcadero', lat: 37.792342, lon: -122.391218 },
      { name: 'Bryant Street & The Embarcadero', lat: 37.787094, lon: -122.388015 },
      { name: 'Mission Street & The Embarcadero', lat: 37.793719, lon: -122.392607 },
    ],
  },
]

/** the decks each bridge model declares, by the `procedural` its manifest entry places it under */
export const SF_BRIDGE_DECKS: Record<string, DeckDecl[]> = {
  goldenGateBridgeNear: GOLDEN_GATE_DECKS,
  bayBridgeNear: BAY_BRIDGE_DECKS,
}
