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
 * the two carriageways, the two sidewalks — run dead straight from z −1149 to z 1226 (−1100 and 1275 before the
 * model moved 49 m north onto OSM's towers) and then swing off, east to the
 * toll plaza at the San Francisco end and west to Vista Point at the Marin end, 45 m off the axis within 150 m. The
 * model's deck, and the deck declared for the ways, stop where the straight does; the curved viaducts beyond are
 * the ways' own structure (render/bridges.ts), graded from the deck's end to the ground (src/city/bridge-decks.ts).
 * (Until 2026-09-30 the model ran straight on to −1200: its last hundred metres stood empty beside the road.)
 */
/*
 * The SOUTH END IN OSM'S ORDER (2026-10-04, BUGFIX-2026-10-03.md #272): the side span ends at Pylon S1, against Fort
 * Point's bay wall; the Fort Point ARCH spans the fort's courtyard to Pylon S2 on the bluff; the anchorage lies beyond
 * it. OSM: Pylon S1 (way 1560010162/3) 342 m from the south tower's parts, the Fort Point Arch (1560010166) 112 m to
 * Pylon S2 (1560010164/5), the South Anchorage (1560010167) ~38 m past that. (Was side span → anchorage → arch: the
 * anchorage and its pylon stood inside the fort, the arch on the bluff south of it.) Both ends were fitted in the
 * world with the model 49 m south of OSM's towers; moved by that much, they keep their places on the ground.
 */
export const GG_SOUTH_ANCHORAGE = 38
export const GG_FORT_POINT_ARCH = 112
export const GG_SOUTH_END = -(GG_MAIN / 2 + GG_SIDE) - GG_FORT_POINT_ARCH - GG_SOUTH_ANCHORAGE - 21
export const GG_NORTH_END = 1226
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
  /** its OSM layer (default 1) */
  layer?: number
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

// ---------------------------------------------------------------- Salesforce Park (docs/SALESFORCE-PARK.md)
/** the Transit Center's half-length along its axis (way/542375290: 438 m) and the park deck's height over its base */
export const TRANSBAY_HALF = 219
export const TRANSBAY_DECK = 21
/**
 * The park on the Transit Center's roof, as a deck the ways ON it take their height from: OSM maps the park's paths
 * as footways at layer 3 and 4, and the bake drew them at street level — under the building and through its
 * neighbours (the owner, 2026-10-02: "the routes underneath the transbay are really weird and often intersect
 * buildings"). A way off layer 0 inside is pinned to the deck; Fremont and First, on layer 0, still pass under. The
 * model (render/landmarks/sf/districts/transbay.ts) draws the deck and its paths, so nothing generic is drawn here.
 * The model's long axis is its local x, so the deck runs along a path down x.
 */
/** the bus deck under the park: the level the Bay Bridge's bus ramp arrives at (transbay.ts `BUS`) */
export const TRANSBAY_BUS = 13.5
const parkDeck = (layer: number, y: number): DeckDecl => ({
  from: 0, to: 2 * TRANSBAY_HALF, half: 27, y: () => y, layer,
  path: [{ x: -TRANSBAY_HALF, z: 0 }, { x: TRANSBAY_HALF, z: 0 }],
  model: { from: 0, to: 2 * TRANSBAY_HALF, half: 26 },
  // reached by stairs, lifts and the gondola: nothing round it is ramped up to it
  vertical: true,
})
/** by OSM layer: the park's paths are mapped at 3 and 4, the bus deck's roadways at 2 (−1 is the concourse, left be) */
export const SALESFORCE_PARK_DECKS: DeckDecl[] = [parkDeck(3, TRANSBAY_DECK), parkDeck(4, TRANSBAY_DECK), { ...parkDeck(2, TRANSBAY_BUS), vertical: false }]

/**
/**
 * THE LOOP ON THE DECK: the park's half-mile path round its edge, as the model draws it (transbay.ts `park`: paving
 * between 4.0 and 8.4 m in from the skin), ridden by bike. OSM maps the park's paths as footways, which the bike graph
 * does not ride (src/city/ridegraph.ts); runners keep those, now on the deck too. The skin's plan is the model's
 * `skinRing` — a stadium whose flanks swell ±2 m — reproduced here so the way and the paving agree.
 */
const SKIN_HZ = 28
const LOOP_IN = 6.2
const skinW = (x: number): number => SKIN_HZ * (1 + 0.058 * Math.sin(x / 33) + 0.03 * Math.sin(x / 12.5 + 1.1))
const LOOP_A = TRANSBAY_HALF - SKIN_HZ
const LOOP_Y = TRANSBAY_DECK + 0.05
/** the loop's side at x: −1 the Mission side (the model's −z), +1 the Howard side */
const loopSide = (x: number, side: -1 | 1): { x: number; z: number; y: number } => ({ x, z: side * (skinW(x) - LOOP_IN), y: LOOP_Y })
/** along one side from x0 to x1, a point every ~8 m */
const loopRun = (x0: number, x1: number, side: -1 | 1): { x: number; z: number; y: number }[] => {
  const n = Math.max(1, Math.ceil(Math.abs(x1 - x0) / 8))
  return Array.from({ length: n + 1 }, (_, i) => loopSide(x0 + ((x1 - x0) * i) / n, side))
}
/** round one end (sign of x), from the Mission side to the Howard side */
const loopEnd = (end: -1 | 1): { x: number; z: number; y: number }[] => {
  const r0 = skinW(end * LOOP_A) - LOOP_IN
  return Array.from({ length: 11 }, (_, i) => {
    const t = (i / 10) * Math.PI
    return { x: end * LOOP_A + end * Math.sin(t) * r0, z: -Math.cos(t) * r0, y: LOOP_Y }
  })
}
/**
 * THE LIFTS (the owner, 2026-10-02: "we might add elevators too"): OSM's lift pairs from the concourse to the park
 * (way/1213210772–73 by Shaw Alley, between First and Second — joined to Minna Street, 1213210784–85 by Fremont, 1213210775–76 at the Beale end — `level=0;1;2;3`), in the
 * model's frame: on the building's spine. Each is three authored ways: the approach at street level from the street
 * that passes under or beside the building (joined to its nearest node of that class), the LIFT itself (a short way
 * whose far end is on the deck: never ridden — game.ts holds the rider a few seconds and sets them down at the other
 * end), and a connector on the deck out to the loop. The model draws the glass shafts (transbay.ts).
 */
export const LIFT_NAME = 'Salesforce Park Lift'
/** the Mission side's breaks, from the Second Street end (+x) to the Beale end (−x): the gondola and the lifts' connectors */
const missionBreaks = (): number[] => [LOOP_A, ...[G_X, ...SALESFORCE_LIFTS.map((l) => l.x + 3)].sort((p, q) => q - p), -LOOP_A]
export const SALESFORCE_LIFTS: { name: string; x: number; z: number; ground: number; street: string }[] = [
  { name: 'Shaw Alley lift', x: 122.8, z: -0.1, ground: 3.14, street: 'residential' },
  { name: 'Fremont Street lift', x: -95.6, z: -2.1, ground: 1.64, street: 'secondary' },
  { name: 'Beale Street lift', x: -193.5, z: -1.7, ground: 0.74, street: 'tertiary' },
]
function liftWays(l: { x: number; z: number; ground: number; street: string }): AuthoredWay[] {
  const foot = { x: l.x, z: l.z, y: l.ground }
  const top = { x: l.x + 3, z: l.z, y: TRANSBAY_DECK + 0.05 }
  const loop = loopSide(l.x + 3, -1)
  return [
    { name: 'Salesforce Park', kind: 'cycleway', layer: 0, a: { onto: { kind: l.street, layer: 0 } }, b: FREE, points: [{ ...foot, x: foot.x + 1 }, foot] },
    { name: LIFT_NAME, kind: 'cycleway', layer: 3, a: FREE, b: FREE, points: [foot, top] },
    { name: 'Salesforce Park', kind: 'cycleway', layer: 3, a: FREE, b: FREE, points: [top, loop] },
  ]
}

/** where the gondola lands on the loop: OSM's upper station is 3 m outboard of the path, on the deck's edge */
const G_X = -102
/**
 * The gondola's track, in the Transit Center model's frame: from OSM's lower station (node/5509295310, Salesforce
 * Plaza) to the loop path at the upper (node/5509295311). The model draws it from these (transbay.ts) and the game runs
 * its cabin on it as a transit line (game.ts) — a vehicle boarded like a cable car, not a way the bike rides.
 */
export const GONDOLA_TRACK = { lower: { x: -101.1, z: -67.5, y: 0.94 }, upper: loopSide(G_X, -1) }
const FREE = { free: true } as const
/**
 * The gondola's WAY: what joins the park to the street network (without it the bake keeps only the largest connected
 * network, and the loop up there is an island). Never ridden: a rider who reaches it stops at its station and is put
 * aboard the cabin, which is the transit vehicle (src/game.ts, the gondola).
 */
export const GONDOLA_NAME = 'Salesforce Park Gondola'
export const SALESFORCE_PARK_WAYS: AuthoredWay[] = [
  {
    name: GONDOLA_NAME, kind: 'cycleway', layer: 3, a: { onto: { kind: 'footway', layer: 0 } }, b: FREE,
    points: Array.from({ length: 6 }, (_, i) => {
      const f = i / 5
      const { lower: l, upper: u } = GONDOLA_TRACK
      return { x: l.x + f * (u.x - l.x), z: l.z + f * (u.z - l.z), y: l.y + f * (u.y - l.y) }
    }),
  },
  // the LIFTS (below)
  ...SALESFORCE_LIFTS.flatMap((l) => liftWays(l)),
  // the loop: the Mission side in two (split at the gondola), round the Beale end (−x), the Howard side, the Second
  // Street end
  // (split wherever something joins it — the gondola and the lifts' connectors — so their ends meet a node of it)
  ...missionBreaks().slice(1).map((x1, i, xs) => ({ name: 'Salesforce Park', kind: 'cycleway' as const, layer: 3, a: FREE, b: FREE, points: loopRun(i === 0 ? LOOP_A : xs[i - 1], x1, -1) })),
  { name: 'Salesforce Park', kind: 'cycleway', layer: 3, a: FREE, b: FREE, points: loopEnd(-1) },
  { name: 'Salesforce Park', kind: 'cycleway', layer: 3, a: FREE, b: FREE, points: loopRun(-LOOP_A, LOOP_A, 1) },
  { name: 'Salesforce Park', kind: 'cycleway', layer: 3, a: FREE, b: FREE, points: loopEnd(1).slice().reverse() },
]

/** the decks each bridge model declares, by the `procedural` its manifest entry places it under */
// ---------------------------------------------------------------- Embarcadero Center's podium (docs/EMBARCADERO-CENTER.md)
/**
 * THE PODIUM LEVEL of Embarcadero Center and One Maritime Plaza: the promenade along the four Embarcadero Center
 * blocks, the skybridges over Battery, Front, Davis and Drumm, and the roof of the Golden Gateway Garage (the plaza
 * round One Maritime Plaza), one level 8 m over the street — the garage's own two storeys (way/1177704958), the level
 * Bar Sprezzatura stands on (`base` 8, prominent.json). OSM maps it all as layer-1 footways and pedestrian ways; the
 * bake had the promenade at street level and guessed the skybridges 5.7 m up, so every bridge was a step as tall as
 * a person and the walk ran through the shops (owner, 2026-10-03: "the embarcadero decks are not navigable").
 *
 * Reached by stairs and paths up from the street (`joins`: graded from the deck down to the street); nothing round
 * it is ramped up to it. Authored in the CITY frame round `EC_PODIUM` (the manifest entry `embarcaderoPodium` stands
 * there, unrotated), so these points are OSM's own, read off the bake. Only foot ways on layer 1: Washington Street
 * is layer 1 too, and stays on the street.
 */
export const EC_PODIUM = { x: 1200, z: 250 }
/** the podium's absolute height (city frame): the street here is at −81.2 */
export const EC_PODIUM_Y = -73.3
const ecLocal = (pts: [number, number][]): { x: number; z: number }[] => pts.map(([x, z]) => ({ x: x - EC_PODIUM.x, z: z - EC_PODIUM.z }))
const EC_FOOT = ['footway', 'pedestrian', 'steps', 'path', 'cycleway']
const ecDeck = (more: Partial<DeckDecl>): DeckDecl => ({ from: 0, to: 0, half: 0, y: () => EC_PODIUM_Y, layer: 1, kinds: EC_FOOT, vertical: true, joins: true, ...more })
export const EMBARCADERO_PODIUM_DECKS: DeckDecl[] = [
  // the promenade, from the head of the steps west of Battery (x 1009) to the Embarcadero, along the blocks' south side
  (() => {
    // (to x 1397, where the promenade ENDS above Drumm Street: running on to 1420 pinned the way down to the street at deck
    // height until its last 7 m, which fell 8 m — a wall across the walk under it, owner 2026-10-03 "walls block the way")
    const path = ecLocal([[1009, 173], [1063, 181], [1106, 189], [1157, 195], [1222, 201], [1265, 207], [1296, 218], [1347, 227], [1397, 235]])
    const len = path.reduce((t, q, i) => (i === 0 ? 0 : t + Math.hypot(q.x - path[i - 1].x, q.z - path[i - 1].z)), 0)
    return ecDeck({ path, from: 0, to: len, half: 14 })
  })(),
  // the Golden Gateway Garage's roof: One Maritime Plaza's plaza (way/1177704958's ring)
  ecDeck({ ring: ecLocal([[1206, 341], [1217, 271], [1177, 264], [1147, 259], [1106, 253], [1077, 248], [1037, 241], [1031, 277], [1026, 311], [1067, 318], [1072, 319], [1094, 323], [1096, 323], [1136, 329], [1175, 336]]) }),
  /*
   * GOLDEN GATEWAY CENTER, over Washington Street (2026-10-03): its garden podium, where the townhouses stand — 12 m
   * over the street on the west garage (way/588365127), 13 m on the east one (way/588363943), the heights the
   * townhouse restyles already stand on (prominent.json `base`). The bridges over Washington climb to it from
   * Maritime Plaza's 8 m.
   */
  ecDeck({ y: () => EC_PODIUM_Y + 4, ring: ecLocal([[1199.8, 363.8], [1201.7, 364.1], [1201.3, 367.0], [1203.3, 367.4], [1199.9, 388.3], [1197.9, 401.1], [1194.4, 422.9], [1191.0, 443.7], [1155.3, 437.9], [1116.7, 433.8], [1111.2, 428.5], [1114.6, 407.2], [1117.1, 391.9], [1096.4, 388.6], [1090.1, 427.8], [1042.3, 420.1], [1055.1, 340.3], [1109.3, 349.1], [1152.2, 356.1], [1178.9, 360.3], [1200.0, 362.2]]) }),
  ecDeck({ y: () => EC_PODIUM_Y + 5, ring: ecLocal([[1305.5, 380.2], [1301.5, 406.1], [1302.6, 409.6], [1299.0, 433.4], [1295.0, 445.1], [1292.8, 459.6], [1256.2, 454.0], [1214.5, 447.5], [1217.7, 426.4], [1216.3, 420.1], [1220.0, 396.5], [1222.8, 393.6], [1226.8, 368.0], [1258.0, 372.9], [1305.5, 380.2]]) }),
]

/*
 * PIER 7 (2026-10-04, waterfront audit): its walks were baked at the sea bed under its new model's deck (batches/s1.ts
 * `pier7Promenade`), a metre under the water. The deck is the model's outline (copied there from OSM way/23605169), at
 * the model's deck top: the sea (−84.51) + the entry's `deckAbove` 3.5 + the 0.35 m deck; the walk off the Embarcadero
 * is graded up to it (`joins`).
 */
const PIER7_RING: { x: number; z: number }[] = [{"x": -78.13, "z": -67.46}, {"x": -76.55, "z": -66.26}, {"x": -73.82, "z": -64.16}, {"x": -70.59, "z": -61.62}, {"x": -70.23, "z": -61.03}, {"x": -69.99, "z": -60.41}, {"x": -69.87, "z": -59.74}, {"x": -69.9, "z": -59.06}, {"x": -70.04, "z": -58.42}, {"x": -70.3, "z": -57.82}, {"x": -71.04, "z": -56.81}, {"x": 5.07, "z": -0.88}, {"x": 7.62, "z": -0.52}, {"x": 8.16, "z": -1.27}, {"x": 13.04, "z": -0.73}, {"x": 21.95, "z": 5.79}, {"x": 24.0, "z": 10.48}, {"x": 23.49, "z": 11.19}, {"x": 24.41, "z": 13.37}, {"x": 114.11, "z": 79.12}, {"x": 115.48, "z": 77.34}, {"x": 120.51, "z": 77.82}, {"x": 123.47, "z": 73.95}, {"x": 129.0, "z": 77.84}, {"x": 127.97, "z": 86.73}, {"x": 121.05, "z": 96.27}, {"x": 113.14, "z": 99.71}, {"x": 107.5, "z": 95.68}, {"x": 110.43, "z": 91.79}, {"x": 108.52, "z": 86.93}, {"x": 109.87, "z": 85.2}, {"x": 20.05, "z": 19.41}, {"x": 17.65, "z": 19.15}, {"x": 17.06, "z": 19.91}, {"x": 12.17, "z": 19.42}, {"x": 3.17, "z": 12.66}, {"x": 1.13, "z": 8.29}, {"x": 1.71, "z": 7.44}, {"x": 0.76, "z": 5.3}, {"x": -75.48, "z": -50.66}, {"x": -77.11, "z": -48.9}, {"x": -77.75, "z": -48.6}, {"x": -78.48, "z": -48.48}, {"x": -79.23, "z": -48.59}, {"x": -79.89, "z": -48.8}, {"x": -83.73, "z": -51.46}, {"x": -86.46, "z": -47.85}, {"x": -90.51, "z": -50.84}, {"x": -83.35, "z": -60.43}]
export const PIER7_DECKS: DeckDecl[] = [
  { from: 0, to: 0, half: 0, y: () => -84.51 + 3.5 + 0.35, ring: PIER7_RING, kinds: ['footway', 'path', 'pedestrian'], vertical: true, joins: true },
]

/**
 * THE FERRY GATES' GANGWAYS (E, F, G south of the Ferry Building, BUGFIX-2026-10-03.md #276/#281): each a straight
 * covered bridge from its kiosk on the South Basin deck down to its float. OSM's ways (the package's 80426, 80425, 80424)
 * came out of the generic bridge rule humped in the middle and dipping 2 m at the kiosk, whose node lies on the pier
 * outline's very edge. Declared here as a straight fall from the deck (sea + 3.5, the basin's level) to the float
 * (sea + 0.5); the model (render/landmarks/sf/ferry-gates.ts) draws its trusses and floor on the same line. World
 * x, z; the model's frame is the world's about FERRY_GATES_ORIGIN (front 180, no rotation).
 */
export const FERRY_GATES_ORIGIN = { x: 1831, z: 192.5 }
export const FERRY_GANGWAYS: { gate: string; from: [number, number]; to: [number, number] }[] = [
  { gate: 'E', from: [1750, 202], to: [1778, 223] },
  { gate: 'F', from: [1780, 162], to: [1807, 182] },
  { gate: 'G', from: [1809, 121], to: [1837, 142] },
]
export const FERRY_DECK_Y = -84.51 + 3.5
export const FERRY_FLOAT_Y = -84.51 + 0.5
/** the gangway's floor at fraction t from the kiosk (0) to the float (1) */
export const gangwayY = (t: number): number => FERRY_DECK_Y + (FERRY_FLOAT_Y - FERRY_DECK_Y) * Math.max(0, Math.min(1, t))
const FERRY_GATE_DECKS: DeckDecl[] = FERRY_GANGWAYS.map((g) => {
  const a = { x: g.from[0] - FERRY_GATES_ORIGIN.x, z: g.from[1] - FERRY_GATES_ORIGIN.z }
  const b = { x: g.to[0] - FERRY_GATES_ORIGIN.x, z: g.to[1] - FERRY_GATES_ORIGIN.z }
  const L = Math.hypot(b.x - a.x, b.z - a.z)
  // (the line runs 1.5 m past each end: a way's end node exactly at the line's end fell off it by a rounding)
  const ux = (b.x - a.x) / L, uz = (b.z - a.z) / L, X = 1.5
  const path = [{ x: a.x - ux * X, z: a.z - uz * X }, { x: b.x + ux * X, z: b.z + uz * X }]
  return { from: 0, to: L + 2 * X, half: 2.2, path, y: (s: number) => gangwayY((s - X) / L), kinds: ['footway'] }
})

export const SF_BRIDGE_DECKS: Record<string, DeckDecl[]> = {
  pier7Promenade: PIER7_DECKS,
  ferryGatesEFG: FERRY_GATE_DECKS,
  embarcaderoPodium: EMBARCADERO_PODIUM_DECKS,
  goldenGateBridgeNear: GOLDEN_GATE_DECKS,
  bayBridgeNear: BAY_BRIDGE_DECKS,
  salesforceTransitCenter: SALESFORCE_PARK_DECKS,
}
