/**
 * The Salesforce complex: the Transit Center, Salesforce Park on its roof, the gondola and the bridge from
 * Salesforce Tower (Pelli Clarke Pelli with PWP Landscape Architecture, 2018).
 *
 * Four blocks long — 440 m by 50 m, Beale Street to Second — wrapped head to foot in a single skin of white
 * aluminium perforated in a Penrose tiling, undulating in plan and along its top edge, standing clear of a
 * dark glass ground floor on a colonnade of white columns. A row of oval light wells runs down its spine,
 * the largest of them the Grand Hall's oculus. On top, 21 m up, is Salesforce Park: 5.4 acres, a half-mile
 * path loop round the edge, and thirteen gardens strung along the length — the desert garden anchoring the
 * west (Second Street) end, the wetland the east (Beale) end, the great lawn in the middle, and the main
 * plaza with its amphitheatre and restaurant round the Fremont Street entrance where the gondola arrives.
 *
 * **Placed standalone, not on its OSM footprint, and on purpose.** `way/542375290` carries `layer=-1`, so the
 * bake drops it: there is no building in the package here at all, and the RESTYLE that used to claim it never
 * drew anything (see docs/sf-batches/transbay.md). `relation/8524888` is filtered out too. So the manifest
 * entry is a `lat`/`lon`/`size` one and this builder works from `fit.hx`/`fit.hz` alone — it never reads
 * `fit.ring`, so what `tools/model-shots.ts` photographs is what the city gets.
 *
 * Nothing here plants a tree (docs/BUILDINGS.md, "Never plant anything"). The beds, the lawns, the meadow and
 * the reed flats are drawn as ground; what grows on them is the vegetation layer's business — and it now
 * reaches up here, through the one `out.decks` entry `park()` pushes (docs/SKYPARKS.md): the shrubs from
 * render/plants.ts and, since 2026-09-23, the trees from render/vegetation.ts.
 */
import { capPolygon, type MeshBuilder } from '../../../buildings.ts'
import { box, prism, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { faceBand } from '../../tower.ts'
import { beam } from '../golden-gate.ts'

type P2 = { x: number; z: number }

/** the park deck, 70 ft above Mission Street */
const DECK = 21
/** the skin's lower edge (the ground floor stands open below it) and its nominal top, before the wave */
const SKIN_BOT = 6.2
const SKIN_TOP = 22.4
/** the glazed ground floor behind the columns */
const GROUND = 5.4
/** the bus deck, the level under the park */
const BUS = 13.5

const SKIN: Rgb = [0.94, 0.93, 0.90]
/** the panels between: the perforation is a third open, so every other bay sits a shade darker */
const SKIN_ALT: Rgb = [0.86, 0.86, 0.85]
const STEEL: Rgb = [0.80, 0.81, 0.82]
const DARK_GLASS: Rgb = [0.20, 0.23, 0.27]
const PALE_GLASS: Rgb = [0.70, 0.81, 0.83]
const PAVING: Rgb = [0.74, 0.72, 0.67]
const PATH: Rgb = [0.82, 0.79, 0.72]
const LAWN: Rgb = [0.40, 0.54, 0.28]
const MEADOW: Rgb = [0.57, 0.60, 0.36]
const BED: Rgb = [0.33, 0.27, 0.21]
const GRAVEL: Rgb = [0.73, 0.66, 0.53]
const WATER: Rgb = [0.28, 0.42, 0.45]
const REED: Rgb = [0.44, 0.52, 0.33]
const PLAY: Rgb = [0.60, 0.38, 0.30]
const CONCRETE: Rgb = [0.72, 0.71, 0.68]

const METAL = surfaceTag('metal')
const GLASS = surfaceTag('glass')
const STONE = surfaceTag('concrete')

/**
 * The skin's plan: a 440 m stadium whose flanks swell and narrow. Two long waves, about 200 m and 80 m, give
 * roughly ±2 m on a 25 m half-width — which is what the building does, and enough that the wall is never a
 * straight line down four blocks. `inset` draws the same curve in by that many metres (the ground floor, the
 * deck, the path loop), which a centroid inset could not do on a shape this long.
 */
function skinRing(hx: number, hz: number, inset = 0, n = 76): P2[] {
  const a = Math.max(1, hx - hz)
  const r = Math.max(1, hz - inset)
  const w = (x: number): number => Math.max(1, hz * (1 + 0.058 * Math.sin(x / 33) + 0.03 * Math.sin(x / 12.5 + 1.1)) - inset)
  const pts: P2[] = []
  for (let i = 0; i <= n; i++) { const x = -a + (2 * a * i) / n; pts.push({ x, z: -w(x) }) }
  for (let i = 1; i < 10; i++) { const t = (i / 10) * Math.PI; pts.push({ x: a + Math.sin(t) * r, z: -w(a) * Math.cos(t) }) }
  for (let i = n; i >= 0; i--) { const x = -a + (2 * a * i) / n; pts.push({ x, z: w(x) }) }
  for (let i = 1; i < 10; i++) { const t = (i / 10) * Math.PI; pts.push({ x: -a - Math.sin(t) * r, z: w(-a) * Math.cos(t) }) }
  return pts
}

/**
 * The top of the skin at x. It rides ABOUT the park deck, not above it: the scallop rises to 25 m and falls
 * to 20 m, below the deck, and that is the whole point of the building from the street — the white edge
 * dips and the park shows over it, then swells and hides it again.
 */
const skinTop = (x: number): number => SKIN_TOP + 2.3 * Math.sin(x / 41 + 0.4) + 0.7 * Math.sin(x / 17)

/** the outward normal of a stadium at a point — away from the spine, which is exactly right for this shape */
function outward(p: P2, a: number): [number, number, number] {
  const dx = p.x - Math.max(-a, Math.min(a, p.x))
  const L = Math.hypot(dx, p.z) || 1
  return [dx / L, 0, p.z / L]
}

/** an oval ring — the light wells, the fountain basins, the amphitheatre */
function oval(cx: number, cz: number, rx: number, rz: number, n = 14): P2[] {
  const pts: P2[] = []
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2
    pts.push({ x: cx + Math.sin(t) * rx, z: cz + Math.cos(t) * rz })
  }
  return pts
}

/**
 * A bed's outline: a lozenge running ALONG the park — straight down its flanks, rounded at both ends. An
 * ellipse was the first try and the park came out as a row of polka dots; a bed in a fifty-metre-wide park
 * runs the width and is soft only at its ends, which is what this draws.
 */
function lozenge(cx: number, cz: number, rx: number, rz: number): P2[] {
  const a = Math.max(0, rx - rz)
  const pts: P2[] = [{ x: cx - a, z: cz - rz }, { x: cx + a, z: cz - rz }]
  for (let i = 1; i < 7; i++) { const t = (i / 7) * Math.PI; pts.push({ x: cx + a + Math.sin(t) * rz, z: cz - rz * Math.cos(t) }) }
  pts.push({ x: cx + a, z: cz + rz }, { x: cx - a, z: cz + rz })
  for (let i = 1; i < 7; i++) { const t = (i / 7) * Math.PI; pts.push({ x: cx - a - Math.sin(t) * rz, z: cz + rz * Math.cos(t) }) }
  return pts
}

/**
 * The light wells down the spine. OSM's park relation traces twelve of them as inner rings; these are their
 * real positions and sizes, measured off that relation in the building's own frame. Drawn as glazed lenses
 * standing a little proud of the deck with a rail round them, which is what they are from the park — a hole
 * in the deck would show an empty building, because the concourse under it is not modelled.
 */
const WELLS: [number, number, number][] = [
  [-195.7, 2.6, 7.0], [-174.3, 6.6, 4.9], [-141.4, 9.8, 6.0], [-103.4, 4.9, 7.0],
  [-23.9, 6.0, 4.4], [-6.6, 17.0, 3.7], [16.1, 4.6, 4.4],
  [84.2, 9.8, 6.0], [120.9, 2.9, 4.7], [160.4, 12.8, 15.3],
]

/**
 * Which way round the building is.
 *
 * The manifest places it at a point with `front: 45`, which turns the model's +z to bearing 315 — the
 * Mission Street side, where the gondola and the bridge are. That same turn puts the model's **+x at bearing
 * 225**, so **local +x is the WEST (Second Street) end and local −x the EAST (Beale Street) end**. Everything
 * measured off OSM in the building's own along-axis — the light wells above, the Grand Hall's oculus, the
 * gondola at Fremont, the bridge from the tower — therefore appears here with its sign flipped. The first
 * pass did not flip it and laid the whole park out back to front.
 */
const GRAND_HALL = -73.3

function transitCenter(out: MeshBuilder, fit: Fit): void {
  const hx = Math.max(60, fit.hx)
  const hz = Math.max(12, fit.hz)
  const a = hx - hz
  const ring = skinRing(hx, hz)
  const lip = skinRing(hx, hz, 0.8)

  /*
   * ---- the ground floor: OPEN, on columns, with a soffit overhead.
   *
   * There used to be a continuous dark-glass wall here, set back behind the colonnade and running the whole
   * 435 m. The owner rode into it: *"You cannot actually go under salesforce park smoothly, there are walls
   * in the way (that of course you can go right through)"*, and `window.__pick` named this very model. The
   * streets that cross the block — Fremont, 1st — pass UNDER the centre in life, so a wall on its full
   * perimeter is a glitch standing across three roads.
   *
   * Drawn open instead: the soffit stays, so there is a ceiling over the rider and the building still reads
   * as standing on its colonnade, and the columns stay, so it is obviously carried rather than floating.
   * The real ground floor IS glazed in stretches, and putting that glass back means cutting it where a
   * street crosses — which needs the streets, so it belongs with the rest of the block's work
   * (docs/SALESFORCE-PARK.md). An open colonnade is the closer of the two approximations meanwhile.
   */
  capPolygon(out, skinRing(hx, hz, 3.2, 26), GROUND, [0.34, 0.34, 0.33], STONE)
  const col = skinRing(hx, hz, 0.9, 34)
  for (const p of col) prism(out, p.x, p.z, 0, SKIN_BOT + 0.4, 0.55, 6, SKIN, METAL)

  // ---- the skin: white perforated aluminium, from the colonnade's head to an undulating top edge.
  // Alternate panels are shaded a shade apart, which at a distance is what the Penrose perforation reads as.
  for (let i = 0; i < ring.length; i++) {
    const p = ring[i]
    const q = ring[(i + 1) % ring.length]
    const n = outward({ x: (p.x + q.x) / 2, z: (p.z + q.z) / 2 }, a)
    const yp = skinTop(p.x)
    const yq = skinTop(q.x)
    out.quad([[p.x, SKIN_BOT, p.z], [q.x, SKIN_BOT, q.z], [q.x, yq, q.z], [p.x, yp, p.z]],
      n, [[0, 0], [1, 0], [1, 1], [0, 1]], i % 2 === 0 ? SKIN : SKIN_ALT, METAL)
    // the skin's thickness, turned in over the park
    const lp = lip[i]
    const lq = lip[(i + 1) % lip.length]
    out.quad([[p.x, yp, p.z], [q.x, yq, q.z], [lq.x, yq, lq.z], [lp.x, yp, lp.z]],
      [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], SKIN, METAL)
  }

  // ---- the bus deck behind the skin: a dark banded storey, seen through the perforation from the street
  faceBand(out, skinRing(hx, hz, 2.4, 26), GROUND, BUS, { kind: 'bands', wall: [0.42, 0.42, 0.41], glass: DARK_GLASS, floor: 4.2, solid: 0.55, material: 'concrete' })
  faceBand(out, skinRing(hx, hz, 2.4, 26), BUS, DECK, { kind: 'bands', wall: [0.46, 0.46, 0.45], glass: DARK_GLASS, floor: 3.8, solid: 0.6, material: 'concrete' })

  // ---- the bus ramp off the Beale (north-east) end, dropping away from the bus deck towards the Bay Bridge
  for (const s of [-1, 1]) {
    beam(out, [a + hz - 4, BUS, s * 8], [a + hz + 46, 4.5, s * 8], 0.9, 0.7, CONCRETE)
  }
  out.quad([[a + hz - 4, BUS + 0.9, -8], [a + hz + 46, 5.4, -8], [a + hz + 46, 5.4, 8], [a + hz - 4, BUS + 0.9, 8]],
    [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], CONCRETE, STONE)
  for (let x = a + hz + 2; x < a + hz + 44; x += 11) {
    const y = BUS - ((x - (a + hz - 4)) / 50) * 9
    box(out, x, y / 2, 0, 1.1, y / 2, 1.1, CONCRETE, STONE)
  }
}

/**
 * Salesforce Park's ground plane: the path loop round the edge and the gardens strung along the length,
 * Beale end to Second Street end — desert, palms, the plaza and the amphitheatre, the great lawn, the play
 * area and the redwoods, the meadow, and the wetland at the far end. Everything is drawn as SURFACE. The
 * trees the real park has (600 of them) are the vegetation layer's, which reaches up here through `decks`.
 */
function park(out: MeshBuilder, fit: Fit): void {
  const hx = Math.max(60, fit.hx)
  const hz = Math.max(12, fit.hz)
  const a = hx - hz
  const deck = skinRing(hx, hz, 2.2)

  // the deck itself, and the glass windscreen standing round its edge
  capPolygon(out, deck, DECK, PAVING, STONE)
  faceBand(out, deck, DECK, DECK + 1.3, { kind: 'blank', wall: PALE_GLASS, material: 'glass' })

  // thousands of plants live up here (docs/SKYPARKS.md "Planting"): the same ring the deck's own paving is
  // capped with, at the same DECK height — never a size or height typed again, just what is already drawn.
  // Both planting layers read this one entry: the shrubs (render/plants.ts) and the trees (render/vegetation.ts)
  out.decks.push({ ring: deck, y: DECK })

  // ---- the path loop: a half-mile of paving following the edge the whole way round
  const outer = skinRing(hx, hz, 4.0)
  const inner = skinRing(hx, hz, 8.4)
  for (let i = 0; i < outer.length; i++) {
    const j = (i + 1) % outer.length
    out.quad([[outer[i].x, DECK + 0.04, outer[i].z], [outer[j].x, DECK + 0.04, outer[j].z],
      [inner[j].x, DECK + 0.04, inner[j].z], [inner[i].x, DECK + 0.04, inner[i].z]],
    [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], PATH, STONE)
  }

  /*
   * ---- the gardens, in the core inside the loop.
   *
   * Drawn as overlapping lozenges, not as bands across the width. Bands were the first try and the park came
   * out a colour chart: thirteen rectangles butted end to end, every joint a straight line across fifty
   * metres. A bed with a rounded end, lapping over its neighbour and leaving paving to one side of it, is
   * both what PWP drew and what reads as a garden from the deck.
   */
  const core = (x: number): number => Math.max(2, hz * (1 + 0.058 * Math.sin(x / 33)) - 9.2)
  /** a bed: an oval from x0 to x1, `fill` of the core's width, pushed `off` off the spine */
  const bed = (x0: number, x1: number, c: Rgb, fill = 0.95, off = 0, tag = STONE): void => {
    const cx = (x0 + x1) / 2
    capPolygon(out, lozenge(cx, off * core(cx), (x1 - x0) / 2, core(cx) * fill), DECK + 0.05, c, tag)
  }
  const E = Math.min(a - 6, 184)

  // the WEST (Second Street) end: the desert garden on its gravel, with succulent beds worked into it
  bed(120, E, GRAVEL, 0.98)
  bed(142, 178, BED, 0.45, 0.42)
  bed(126, 158, BED, 0.38, -0.5)
  // the redwood grove's bed, and the palm garden — beds, and only beds: the trees are not ours to plant
  bed(68, 118, BED, 0.96)
  bed(78, 112, MEADOW, 0.45, 0.45)
  // the children's play area
  bed(36, 66, PLAY, 0.8, -0.12)
  // the great lawn, the largest single thing up here
  bed(-28, 34, LAWN, 0.96)
  bed(-24, 6, LAWN, 0.72, 0.3)
  // (−112 → −28 is the main plaza: the amphitheatre, the restaurant and the Grand Hall's light column, all
  //  round the Fremont Street entrance where the gondola and the bridge arrive)
  // the oak meadow, and the wetland garden at the EAST (Beale Street) end
  bed(-152, -110, MEADOW, 0.96)
  bed(-144, -116, LAWN, 0.45, -0.38)
  bed(-E, -148, REED, 0.96)
  capPolygon(out, lozenge(-172, 0, 18, core(-172) * 0.55), DECK + 0.07, WATER, GLASS)

  // ---- the amphitheatre: four stepped terraces facing the lawn, west of the plaza
  for (let k = 0; k < 4; k++) {
    const r = 16 - k * 3.2
    const y = DECK + 0.12 + k * 0.62
    const ringK = oval(-45, 0, r, Math.min(r, core(-45)), 16)
    capPolygon(out, ringK, y, k === 3 ? LAWN : CONCRETE, STONE)
    faceBand(out, ringK, y - 0.62, y, { kind: 'blank', wall: CONCRETE, material: 'concrete' })
  }

  // ---- the restaurant and café pavilion on the plaza: a low glass box under a white roof
  box(out, -96, DECK + 2.4, 0, 11, 2.4, 7, PALE_GLASS, GLASS)
  box(out, -96, DECK + 5.0, 0, 11.8, 0.3, 7.8, SKIN, METAL)

  // ---- the light wells: glazed lenses standing proud of the deck, each with a rail round it, and a paved
  // bridge carrying the loop across the two widest of them
  for (const [x, rx, rz] of WELLS) {
    const r = oval(x, 0, Math.min(rx, 11), Math.min(rz, core(x) * 0.45), 14)
    faceBand(out, r, DECK + 0.05, DECK + 0.32, { kind: 'blank', wall: PAVING, material: 'concrete' })
    // a skylight looking down into a hall, not a pool: it reads dark from above, and the pale glass the
    // first pass gave them turned the park into a scatter of blue puddles
    capPolygon(out, r, DECK + 0.62, [0.46, 0.55, 0.58], GLASS)
    for (const p of oval(x, 0, Math.min(rx, 11) + 0.6, Math.min(rz, core(x) * 0.45) + 0.6, 12)) {
      box(out, p.x, DECK + 0.9, p.z, 0.07, 0.55, 0.07, STEEL, METAL)
    }
  }

  /*
   * The Grand Hall's oculus, the big one: not a skylight in the deck but the head of a LIGHT COLUMN that
   * carries daylight from the park down three storeys to the train platform. From the park it is a glazed
   * oval drum standing above everything else on the roof, which is why it gets its own piece.
   */
  const lensX = GRAND_HALL
  const drum = oval(lensX, 0, 14.5, Math.min(11, core(lensX) + 7), 20)
  faceBand(out, drum, DECK + 0.05, DECK + 3.4, { kind: 'curtain', wall: SKIN, glass: PALE_GLASS, pitch: 3, floor: 3.4, solid: 0.2, material: 'metal' })
  capPolygon(out, drum, DECK + 3.5, PALE_GLASS, GLASS)
  for (const p of oval(lensX, 0, 15.3, Math.min(11, core(lensX) + 7) + 0.8, 16)) {
    box(out, p.x, DECK + 0.6, p.z, 0.07, 0.55, 0.07, STEEL, METAL)
  }

  // ---- the Bus Jet Fountain at the Beale end: a shallow basin the buses below set off
  capPolygon(out, oval(-124, 0, 9, Math.min(9, core(-124)), 16), DECK + 0.09, WATER, GLASS)
}

/**
 * The gondola on the Mission Street side (local +z): a single glass cabin on an inclined track from a plaza
 * at the foot of the building to a landing on the park deck, at the Fremont Street entrance. It has stood
 * still since 2019, so it is modelled parked halfway up, which is how it is usually seen.
 */
function gondola(out: MeshBuilder, fit: Fit): void {
  const hz = Math.max(12, fit.hz)
  const X = -100
  const zTop = hz * (1 + 0.058 * Math.sin(X / 33) + 0.03 * Math.sin(X / 12.5 + 1.1)) + 1.5
  const zFoot = zTop + 17
  /** a point a fraction of the way up the track: it climbs 20 m over 17, about 50 degrees */
  const on = (f: number, dz = 0): [number, number, number] => [X, 1.4 + f * (DECK - 1.4), zFoot + f * (zTop - zFoot) + dz]

  // ---- the track: a pair of white box girders on two straddle piers, with the haul cable between them
  for (const s of [-1, 1]) {
    beam(out, [X + s * 2.8, ...on(0).slice(1)] as [number, number, number], [X + s * 2.8, ...on(1).slice(1)] as [number, number, number], 0.42, 0.7, SKIN)
  }
  beam(out, on(0, -0.2), on(1, -0.2), 0.1, 0.1, STEEL)
  for (const f of [0.34, 0.68]) {
    const p = on(f)
    for (const s of [-1, 1]) box(out, X + s * 2.8, (p[1] - 0.7) / 2, p[2], 0.42, (p[1] - 0.7) / 2, 0.42, SKIN, METAL)
    box(out, X, p[1] - 0.5, p[2], 3.3, 0.3, 0.5, SKIN, METAL)
  }

  // ---- the cabin, parked partway up as it has been since 2019: glazed all round in a white frame, level
  const c = on(0.46)
  box(out, X, c[1] + 1.9, c[2], 2.6, 1.6, 1.9, PALE_GLASS, GLASS)
  box(out, X, c[1] + 0.5, c[2], 2.8, 0.22, 2.1, SKIN, METAL)     // the floor pan on the rails
  box(out, X, c[1] + 3.6, c[2], 2.8, 0.22, 2.1, SKIN, METAL)     // the roof
  for (const s of [-1, 1]) for (const u of [-1, 1]) box(out, X + s * 2.65, c[1] + 1.9, c[2] + u * 1.95, 0.16, 1.7, 0.16, SKIN, METAL)

  // ---- the lower station on Mission Street: a platform under a white canopy
  box(out, X, 0.5, zFoot + 4.5, 6.5, 0.5, 5.5, PAVING, STONE)
  box(out, X, 5.4, zFoot + 4.5, 7.0, 0.3, 6.0, SKIN, METAL)
  for (const s of [-1, 1]) for (const u of [-1, 1]) box(out, X + s * 6.3, 2.7, zFoot + 4.5 + u * 5.2, 0.26, 2.7, 0.26, SKIN, METAL)
  box(out, X, 1.6, zFoot + 0.2, 3.2, 1.1, 0.16, PALE_GLASS, GLASS)

  // ---- the upper landing, in through the skin onto the park deck
  box(out, X, DECK - 0.25, zTop - 3.5, 4, 0.25, 4, PAVING, STONE)
}

/**
 * The pedestrian bridge from Salesforce Tower into the park at deck level, over Minna Street — a glazed tube
 * on a pair of trusses. The tower's near face is about 40 m off this side of the building.
 */
function towerBridge(out: MeshBuilder, fit: Fit): void {
  const hz = Math.max(12, fit.hz)
  const X = -26
  const z0 = hz * (1 + 0.058 * Math.sin(X / 33) + 0.03 * Math.sin(X / 12.5 + 1.1)) - 1
  const z1 = z0 + 38
  const mid = (z0 + z1) / 2
  const len = (z1 - z0) / 2
  // the deck and the glazed tube on it
  box(out, X, DECK - 0.35, mid, 3.0, 0.35, len, CONCRETE, STONE)
  box(out, X, DECK + 1.5, mid, 2.6, 1.5, len - 0.3, PALE_GLASS, GLASS)
  box(out, X, DECK + 3.2, mid, 3.1, 0.22, len, SKIN, METAL)
  // the trusses either side, and a pier at the middle of the span
  for (const s of [-1, 1]) {
    beam(out, [X + s * 3.0, DECK - 0.7, z0], [X + s * 3.0, DECK - 0.7, z1], 0.25, 0.5, STEEL)
    beam(out, [X + s * 3.0, DECK + 3.2, z0], [X + s * 3.0, DECK + 3.2, z1], 0.25, 0.4, STEEL)
    for (let i = 0; i < 6; i++) {
      const za = z0 + ((z1 - z0) * i) / 6
      const zb = z0 + ((z1 - z0) * (i + 1)) / 6
      beam(out, [X + s * 3.0, DECK - 0.7, i % 2 ? zb : za], [X + s * 3.0, DECK + 3.2, i % 2 ? za : zb], 0.18, 0.18, STEEL)
    }
  }
  prism(out, X, mid, 0, DECK - 0.8, 1.1, 8, CONCRETE, STONE)
}

export const TRANSBAY: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /** the whole complex: the building, the park on it, the gondola and the bridge from the tower */
  salesforceTransitCenter: (out: MeshBuilder, fit: Fit): void => {
    transitCenter(out, fit)
    park(out, fit)
    gondola(out, fit)
    towerBridge(out, fit)
  },
}
