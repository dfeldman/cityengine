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
import { GONDOLA_TRACK, SALESFORCE_LIFTS } from '../../../../city/sf/bridges.ts'
import { sign, type SignSpec } from '../../signage.ts'

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
const LAWN: Rgb = [0.27, 0.38, 0.19]
const MEADOW: Rgb = [0.40, 0.42, 0.26]
const BED: Rgb = [0.33, 0.27, 0.21]
const GRAVEL: Rgb = [0.58, 0.52, 0.42]
const WATER: Rgb = [0.28, 0.42, 0.45]
const REED: Rgb = [0.34, 0.40, 0.25]
const PLAY: Rgb = [0.24, 0.30, 0.33]
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
  // the soffit's RIBS: white aluminium fins across the underside every 3.5 m, a light fitting between every other pair —
  // what a rider on Fremont or First looks up at (a flat slab read as an overcast sky)
  for (let x = -a - hz + 6; x < a + hz - 6; x += 3.5) {
    const half = Math.max(2, (Math.abs(x) > a ? Math.sqrt(Math.max(0, hz * hz - (Math.abs(x) - a) ** 2)) : hz) - 4)
    box(out, x, GROUND - 0.22, 0, 0.12, 0.22, half, SKIN, METAL)
    if (Math.round(x / 3.5) % 2 === 0) for (const zl of [-half * 0.5, 0, half * 0.5]) box(out, x + 1.75, GROUND - 0.06, zl, 0.5, 0.05, 0.5, [0.98, 0.96, 0.88], METAL)
  }
  // …and the concourse floor under it, paved: the city's ground is grass, and riders on Fremont and First saw a lawn
  // under the building. Draped by the city (MeshBuilder.grounds) because the street rises 4 m along the block
  out.grounds.push(skinRing(hx, hz, 0.4, 40))
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
    // …and its inside face, a hand's breadth in, facing in: from under the colonnade and from the bus deck the skin is
    // the same white aluminium (drawn once, its back read as an unlit grey wall)
    const k = 0.12
    out.quad([[p.x - n[0] * k, SKIN_BOT, p.z - n[2] * k], [q.x - n[0] * k, SKIN_BOT, q.z - n[2] * k], [q.x - n[0] * k, yq, q.z - n[2] * k], [p.x - n[0] * k, yp, p.z - n[2] * k]],
      [-n[0], 0, -n[2]], [[0, 0], [1, 0], [1, 1], [0, 1]], SKIN_ALT, METAL)
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
 * Salesforce Park's ground plane: the path loop round the edge and the gardens strung along the length, Beale end
 * to Second Street end — the wetland, the oak meadow, the Bus Jet Fountain and the main plaza round the gondola and
 * the Grand Hall's light column, the amphitheatre, the great lawn, the children's play area, the redwood grove and
 * palms, and the desert garden at the far end.
 *
 * Reworked 2026-10-02 (the owner: "the park has tons of interesting plants and architecture too … this is a public
 * square on essentially the most expensive real estate in the world"; docs/SALESFORCE-PARK.md): every colour a good
 * deal darker than it looks on paper — the city's grade brightens them, and the first pass read lime, yellow and pink; every garden a RAISED BED with a concrete curb; the planting put
 * IN the beds — each bed is its own `out.decks` entry, trees only where the real park has its groves, shrubs and
 * flowers in the rest, the paths and the plaza bare — instead of scattered over the whole deck; and the park's
 * furniture: benches and lamps down the loop, pergolas over the plaza, the jets of the Bus Jet Fountain, the
 * playground's climbing frames, a boardwalk through the wetland. The trees themselves are the vegetation layer's.
 */
const PLAZA_PAVING: Rgb = [0.38, 0.37, 0.34]
const LOOP_PATH: Rgb = [0.50, 0.45, 0.37]
const CURB: Rgb = [0.55, 0.54, 0.51]
const TIMBER: Rgb = [0.52, 0.38, 0.25]
const BENCH: Rgb = [0.44, 0.33, 0.22]
const LAMP: Rgb = [0.24, 0.25, 0.26]
const JET: Rgb = [0.80, 0.90, 0.95]
const PLAY_A: Rgb = [0.86, 0.42, 0.18]
const PLAY_B: Rgb = [0.18, 0.52, 0.72]
const FLOWER_A: Rgb = [0.36, 0.26, 0.30]
const FLOWER_B: Rgb = [0.42, 0.34, 0.20]

function park(out: MeshBuilder, fit: Fit): void {
  const hx = Math.max(60, fit.hx)
  const hz = Math.max(12, fit.hz)
  const a = hx - hz
  const deck = skinRing(hx, hz, 2.2)

  // the deck itself, warm paving, and the glass windscreen standing round its edge
  capPolygon(out, deck, DECK, PLAZA_PAVING, STONE)
  faceBand(out, deck, DECK, DECK + 1.3, { kind: 'blank', wall: PALE_GLASS, material: 'glass' })
  // its steel cap rail
  for (let i = 0; i < deck.length; i += 2) box(out, deck[i].x, DECK + 1.32, deck[i].z, 0.06, 0.03, 0.06, STEEL, METAL)

  // ---- the path loop: a half-mile of decomposed granite following the edge the whole way round, edged in steel
  const outer = skinRing(hx, hz, 4.0)
  const inner = skinRing(hx, hz, 8.4)
  for (let i = 0; i < outer.length; i++) {
    const j = (i + 1) % outer.length
    out.quad([[outer[i].x, DECK + 0.04, outer[i].z], [outer[j].x, DECK + 0.04, outer[j].z],
      [inner[j].x, DECK + 0.04, inner[j].z], [inner[i].x, DECK + 0.04, inner[i].z]],
    [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], LOOP_PATH, STONE)
  }

  /*
   * ---- the gardens, in the core inside the loop: RAISED BEDS, each with its curb, its ground, and its planting.
   * `plant`: 'grove' — trees close (and shrubs under them); 'beds' — shrubs and flowers, no trees; 'none' — kept
   * clear (the lawns, the water, the playground's safety surface).
   */
  const core = (x: number): number => Math.max(2, hz * (1 + 0.058 * Math.sin(x / 33)) - 9.2)
  type Plant = 'grove' | 'beds' | 'none'
  const bed = (x0: number, x1: number, c: Rgb, fill: number, off: number, plant: Plant, raise = 0.45, tag = STONE): P2[] => {
    const cx = (x0 + x1) / 2
    const ring = lozenge(cx, off * core(cx), (x1 - x0) / 2, core(cx) * fill)
    if (raise > 0) faceBand(out, ring, DECK, DECK + raise, { kind: 'blank', wall: CURB, material: 'concrete' })
    capPolygon(out, ring, DECK + Math.max(0.06, raise - 0.05), c, tag)
    if (plant !== 'none') out.decks.push({ ring, y: DECK + Math.max(0.06, raise - 0.05), keepOff: plant === 'grove' ? 1.2 : 0.6, trees: plant === 'grove' })
    return ring
  }
  const E = Math.min(a - 6, 184)

  // the WEST (Second Street) end: the desert garden on its gravel, succulent beds worked into it, a few palms
  bed(120, E, GRAVEL, 0.98, 0, 'beds', 0.3)
  bed(142, 178, BED, 0.45, 0.42, 'beds')
  bed(126, 158, BED, 0.38, -0.5, 'beds')
  bed(160, 176, FLOWER_B, 0.3, -0.45, 'beds', 0.5)
  // the palm garden and the redwood grove — the park's tallest trees, close-planted
  bed(86, 118, BED, 0.96, 0, 'grove', 0.6)
  bed(68, 86, MEADOW, 0.8, 0.1, 'grove', 0.6)
  // the children's play area, on its safety surface, with its climbing frames
  bed(38, 64, PLAY, 0.6, -0.15, 'none', 0.2)
  bed(36, 66, BED, 0.25, 0.7, 'grove', 0.5)
  playground(out, 51, -0.15 * core(51), core(51) * 0.55)
  // the great lawn, the largest single thing up here, with a flowering border down one side
  bed(-28, 34, LAWN, 0.96, 0, 'none', 0.15)
  bed(-20, 26, FLOWER_A, 0.18, 0.78, 'grove', 0.5)
  // (−112 → −28 is the main plaza: the amphitheatre, the café, the Grand Hall's light column, the gondola landing —
  //  paving, with groves in planters either side)
  bed(-70, -50, BED, 0.32, 0.62, 'grove', 0.7)
  bed(-70, -50, BED, 0.32, -0.62, 'grove', 0.7)
  bed(-110, -88, BED, 0.3, 0.6, 'grove', 0.7)
  // the oak meadow, the Bus Jet Fountain in it, and the wetland garden at the EAST (Beale Street) end
  bed(-152, -112, MEADOW, 0.96, 0, 'grove', 0.4)
  bed(-144, -118, FLOWER_B, 0.3, -0.5, 'beds', 0.5)
  bed(-E, -150, REED, 0.96, 0, 'beds', 0.25)
  capPolygon(out, lozenge(-172, 0, 18, core(-172) * 0.55), DECK + 0.3, WATER, GLASS)
  boardwalk(out, -E + 6, -154, core(-172) * 0.15)

  /*
   * ---- the GARDEN STRIPS down both sides of the loop path: the path runs THROUGH the gardens, not round a paved rim
   * (a rider's view, 2026-10-02: a half-mile of pale paving with the gardens out of reach in the middle). A planted
   * curb-edged strip along the inside edge of the path, with trees whose crowns lean over it, broken every 26 m for a
   * way in and left out across the main plaza, where the gondola lands and the crowds are.
   */
  const w = (x: number): number => hz * (1 + 0.058 * Math.sin(x / 33) + 0.03 * Math.sin(x / 12.5 + 1.1))
  for (const side of [-1, 1]) {
    for (let x0 = -a + 4; x0 < a - 8; x0 += 26) {
      const x1 = Math.min(a - 4, x0 + 22)
      if (x1 > -114 && x0 < -30) continue
      const strip: P2[] = []
      for (let x = x0; x <= x1 + 0.01; x += 2) strip.push({ x, z: side * (w(x) - 8.7) })
      for (let x = x1; x >= x0 - 0.01; x -= 2) strip.push({ x, z: side * (w(x) - 10.9) })
      if (side > 0) strip.reverse()
      faceBand(out, strip, DECK, DECK + 0.5, { kind: 'blank', wall: CURB, material: 'concrete' })
      capPolygon(out, strip, DECK + 0.45, BED, STONE)
      out.decks.push({ ring: strip, y: DECK + 0.45, keepOff: 0.5, trees: true, spacing: 7 })
    }
  }

  // ---- the amphitheatre: four stepped terraces facing the lawn, west of the plaza
  for (let k = 0; k < 4; k++) {
    const r = 16 - k * 3.2
    const y = DECK + 0.12 + k * 0.62
    const ringK = oval(-45, 0, r, Math.min(r, core(-45)), 16)
    capPolygon(out, ringK, y, k === 3 ? LAWN : CONCRETE, STONE)
    faceBand(out, ringK, y - 0.62, y, { kind: 'blank', wall: CONCRETE, material: 'concrete' })
  }

  // ---- the café pavilion on the plaza: a glass box under a deep white roof, its terrace in front
  box(out, -96, DECK + 2.4, 0, 11, 2.4, 7, PALE_GLASS, GLASS)
  box(out, -96, DECK + 5.0, 0, 13.5, 0.3, 9.5, SKIN, METAL)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(out, -96 + sx * 13, DECK + 2.4, sz * 9, 0.15, 2.4, 0.15, SKIN, METAL)

  // ---- pergolas over the plaza by the gondola landing: timber slats on white posts, the shade the plaza is known for
  pergola(out, -104, MISSION * 12, 14, 6)
  pergola(out, -80, -MISSION * 12, 12, 6)

  // ---- the light wells: glazed lenses standing proud of the deck, each with a rail round it
  for (const [x, rx, rz] of WELLS) {
    const r = oval(x, 0, Math.min(rx, 11), Math.min(rz, core(x) * 0.45), 14)
    faceBand(out, r, DECK + 0.05, DECK + 0.32, { kind: 'blank', wall: PLAZA_PAVING, material: 'concrete' })
    capPolygon(out, r, DECK + 0.62, [0.24, 0.30, 0.34], GLASS)
    for (const p of oval(x, 0, Math.min(rx, 11) + 0.6, Math.min(rz, core(x) * 0.45) + 0.6, 12)) {
      box(out, p.x, DECK + 0.9, p.z, 0.07, 0.55, 0.07, STEEL, METAL)
    }
  }

  // The Grand Hall's oculus: the head of the LIGHT COLUMN that carries daylight down three storeys to the platform —
  // a glazed oval drum standing above everything else on the roof.
  const lensX = GRAND_HALL
  const drum = oval(lensX, 0, 14.5, Math.min(11, core(lensX) + 7), 20)
  faceBand(out, drum, DECK + 0.05, DECK + 3.4, { kind: 'curtain', wall: SKIN, glass: PALE_GLASS, pitch: 3, floor: 3.4, solid: 0.2, material: 'metal' })
  capPolygon(out, drum, DECK + 3.5, PALE_GLASS, GLASS)
  for (const p of oval(lensX, 0, 15.3, Math.min(11, core(lensX) + 7) + 0.8, 16)) {
    box(out, p.x, DECK + 0.6, p.z, 0.07, 0.55, 0.07, STEEL, METAL)
  }

  // ---- the Bus Jet Fountain: a long shallow basin in the meadow, its jets set off by the buses below
  capPolygon(out, lozenge(-130, 0, 16, Math.min(4, core(-130) * 0.3)), DECK + 0.09, WATER, GLASS)
  for (let k = 0; k < 24; k++) {
    const x = -144 + k * 1.2
    const h = 0.8 + 2.6 * Math.abs(Math.sin(k * 1.7))
    box(out, x, DECK + 0.1 + h / 2, (k % 2 ? 1 : -1) * 0.9, 0.05, h / 2, 0.05, JET, GLASS)
  }

  // ---- benches and lamps down both sides of the loop: a bench every 18 m on the inside edge, its back to the garden, a lamp every 24 m
  for (const side of [-1, 1]) {
    for (let x = -a + 6; x < a - 6; x += 18) {
      const w = hz * (1 + 0.058 * Math.sin(x / 33) + 0.03 * Math.sin(x / 12.5 + 1.1))
      // on the path's inner edge, backed against the garden strip (which starts at 8.7 m in)
      const z = side * (w - 8.1)
      box(out, x, DECK + 0.45, z, 0.9, 0.06, 0.25, BENCH, STONE)
      box(out, x, DECK + 0.72, z + side * 0.22, 0.9, 0.22, 0.04, BENCH, STONE)
      for (const dx of [-0.75, 0.75]) box(out, x + dx, DECK + 0.22, z, 0.05, 0.22, 0.22, LAMP, METAL)
    }
    for (let x = -a + 12; x < a - 12; x += 24) {
      const w = hz * (1 + 0.058 * Math.sin(x / 33) + 0.03 * Math.sin(x / 12.5 + 1.1))
      const z = side * (w - 3.6)
      box(out, x, DECK + 2.0, z, 0.06, 2.0, 0.06, LAMP, METAL)
      box(out, x, DECK + 4.05, z, 0.22, 0.08, 0.22, [0.96, 0.94, 0.86], METAL)
    }
  }
}

/** a pergola: timber slats on two beams on white posts, `w` along x and `d` across, centred on (x, z) */
function pergola(out: MeshBuilder, x: number, z: number, w: number, d: number): void {
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) prism(out, x + sx * (w / 2 - 0.4), z + sz * (d / 2 - 0.4), DECK, DECK + 3.2, 0.14, 6, SKIN, METAL)
  for (const sz of [-1, 1]) box(out, x, DECK + 3.25, z + sz * (d / 2 - 0.4), w / 2, 0.12, 0.08, TIMBER, STONE)
  for (let k = 0; k <= Math.floor(w / 0.6); k++) box(out, x - w / 2 + k * 0.6, DECK + 3.42, z, 0.05, 0.06, d / 2, TIMBER, STONE)
}

/** the playground's climbing frames: a net tower, a slide, a ring of posts — bright against the safety surface */
function playground(out: MeshBuilder, x: number, z: number, r: number): void {
  // the tower and its platform
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(out, x - 6 + sx * 1.4, DECK + 1.8, z + sz * 1.4, 0.08, 1.8, 0.08, PLAY_B, METAL)
  box(out, x - 6, DECK + 2.0, z, 1.5, 0.08, 1.5, PLAY_A, STONE)
  box(out, x - 6, DECK + 3.7, z, 1.6, 0.06, 1.6, PLAY_A, STONE)
  // the slide off it
  beam(out, [x - 4.5, DECK + 2.0, z], [x + 1, DECK + 0.4, z], 0.4, 0.06, PLAY_A)
  // the rope net: a pyramid of lines to a mast
  const top: [number, number, number] = [x + 6, DECK + 4.2, z]
  box(out, x + 6, DECK + 2.1, z, 0.07, 2.1, 0.07, PLAY_B, METAL)
  for (let k = 0; k < 8; k++) {
    const t = (k / 8) * Math.PI * 2
    beam(out, [x + 6 + Math.cos(t) * Math.min(4, r), DECK + 0.1, z + Math.sin(t) * Math.min(4, r) * 0.7], top, 0.03, 0.03, [0.85, 0.82, 0.72])
  }
}

/** a timber boardwalk through the wetland, on short posts over the water */
function boardwalk(out: MeshBuilder, x0: number, x1: number, z: number): void {
  const mid = (x0 + x1) / 2
  box(out, mid, DECK + 0.62, z, Math.abs(x1 - x0) / 2, 0.06, 1.0, TIMBER, STONE)
  for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x += 2.5) for (const s of [-1, 1]) {
    box(out, x, DECK + 0.32, z + s * 0.9, 0.06, 0.3, 0.06, TIMBER, STONE)
    box(out, x, DECK + 1.1, z + s * 1.0, 0.04, 0.45, 0.04, STEEL, METAL)
  }
}

/**
 * WHICH SIDE IS MISSION STREET. Placed as the manifest places it (`rotateDeg: 135`), the model's −z faces north-west —
 * the Minna/Mission side, where Salesforce Tower stands — and +z the Natoma/Howard side. Measured 2026-10-02 by putting
 * OSM's gondola stations into the model's frame (src/city/bridge-decks.ts `toModel`, the same arithmetic the game
 * places by) and checked from above. Everything symmetric across z does not care; the gondola and the bridge from the
 * tower do, and until then they stood on the Howard side.
 */
const MISSION = -1
// (MISSION is −1 by the same measurement that put the gondola's stations into this frame — they are on the Mission side)

/**
 * The gondola — OSM's "STC Aerial Tram", way/573719373: a single glass cabin on an inclined track from Salesforce
 * Plaza at Mission and Fremont (the lower station, node/5509295310) up across Minna Street to a landing on the park
 * deck (node/5509295311). Both stations are put here where OSM has them, in the model's frame (docs/SALESFORCE-PARK.md):
 * 46 m across, 20 m up. The game's runs: its cabin is a transit vehicle, boarded at either station like a cable car.
 */
function gondola(out: MeshBuilder, _fit: Fit): void {
  // (the track's ends are shared with the game, which runs the cabin on it: src/city/sf/bridges.ts)
  const { lower, upper } = GONDOLA_TRACK
  const X = (lower.x + upper.x) / 2
  /** a point a fraction of the way up the track, `dz` across from its line */
  const on = (f: number, dz = 0): [number, number, number] =>
    [lower.x + f * (upper.x - lower.x), lower.y + 1.4 + f * (upper.y - lower.y - 1.4), lower.z + f * (upper.z - lower.z) + dz]

  // ---- the track: a pair of white box girders on straddle piers, the haul cable between them
  for (const s of [-1, 1]) {
    const a = on(0), b = on(1)
    beam(out, [a[0] + s * 2.8, a[1], a[2]], [b[0] + s * 2.8, b[1], b[2]], 0.42, 0.7, SKIN)
  }
  beam(out, on(0, 0), on(1, 0), 0.1, 0.1, STEEL)
  for (const f of [0.25, 0.5, 0.75]) {
    const p = on(f)
    for (const s of [-1, 1]) box(out, p[0] + s * 2.8, (p[1] - 0.7) / 2 + lower.y / 2, p[2], 0.42, (p[1] - 0.7 - lower.y) / 2, 0.42, SKIN, METAL)
    box(out, p[0], p[1] - 0.5, p[2], 3.3, 0.3, 0.5, SKIN, METAL)
  }

  // (the cabin is not drawn here: it is a vehicle — render/sf/trains.ts `gondolaCabin`, run by the game)

  // ---- the lower station in Salesforce Plaza: a platform under a white canopy
  const zs = lower.z + MISSION * 4.5
  box(out, X, lower.y + 0.25, zs, 6.5, 0.25, 5.5, PAVING, STONE)
  box(out, X, lower.y + 5.4, zs, 7.0, 0.3, 6.0, SKIN, METAL)
  for (const s of [-1, 1]) for (const u of [-1, 1]) box(out, X + s * 6.3, lower.y + 2.7, zs + u * 5.2, 0.26, 2.7, 0.26, SKIN, METAL)

  // its name on the canopy's street face, and on the back
  for (const u of [-1, 1]) {
    sign(out, { ...board('SALESFORCE PARK · GONDOLA', 0.55), w: 12.5 }, { x: X, y: lower.y + 5.4, z: zs + u * 6.05, heading: u > 0 ? 0 : Math.PI })
  }

  // ---- the upper landing, in through the skin onto the park deck
  box(out, upper.x, DECK - 0.25, upper.z + MISSION * 1.5, 4, 0.25, 4, PAVING, STONE)
  box(out, upper.x, DECK + 2.6, upper.z - MISSION * 2.4, 2.4, 0.4, 0.08, NAVY, METAL)
  sign(out, board('GONDOLA ↓ SALESFORCE PLAZA', 0.32), { x: upper.x, y: DECK + 2.6, z: upper.z - MISSION * 2.32, heading: MISSION > 0 ? Math.PI : 0 })
}

/** the park's wayfinding: white grotesque capitals on a navy board, lit after dark */
const NAVY: Rgb = [0.10, 0.16, 0.30]
const board = (text: string, h: number): SignSpec => ({ type: 'flat', text, h, face: 'grotesque', weight: 'bold', colour: [0.95, 0.95, 0.93], panel: NAVY, lit: 'front' })

/**
 * The pedestrian bridge from Salesforce Tower into the park at deck level, over Minna Street — a glazed tube on a
 * pair of trusses, on the Mission side. The tower's near face is about 10 m beyond Minna (OSM: the tower's parts reach
 * z ≈ −34 in this frame).
 */
function towerBridge(out: MeshBuilder, fit: Fit): void {
  const hz = Math.max(12, fit.hz)
  const X = -50
  const z0 = MISSION * (hz * (1 + 0.058 * Math.sin(X / 33) + 0.03 * Math.sin(X / 12.5 + 1.1)) - 1)
  const z1 = MISSION * 36
  const mid = (z0 + z1) / 2
  const len = Math.abs(z1 - z0) / 2
  // the deck and the glazed tube on it
  box(out, X, DECK - 0.35, mid, 3.0, 0.35, len, CONCRETE, STONE)
  box(out, X, DECK + 1.5, mid, 2.6, 1.5, len - 0.3, PALE_GLASS, GLASS)
  box(out, X, DECK + 3.2, mid, 3.1, 0.22, len, SKIN, METAL)
  // the trusses either side
  for (const s of [-1, 1]) {
    beam(out, [X + s * 3.0, DECK - 0.7, z0], [X + s * 3.0, DECK - 0.7, z1], 0.25, 0.5, STEEL)
    beam(out, [X + s * 3.0, DECK + 3.2, z0], [X + s * 3.0, DECK + 3.2, z1], 0.25, 0.4, STEEL)
    for (let i = 0; i < 4; i++) {
      const za = z0 + ((z1 - z0) * i) / 4
      const zb = z0 + ((z1 - z0) * (i + 1)) / 4
      beam(out, [X + s * 3.0, DECK - 0.7, i % 2 ? zb : za], [X + s * 3.0, DECK + 3.2, i % 2 ? za : zb], 0.18, 0.18, STEEL)
    }
  }
}

/**
 * The lifts from the concourse to the park (src/city/sf/bridges.ts `SALESFORCE_LIFTS`, OSM's pairs): two glass shafts in
 * a white frame, rising through the deck to a little glazed head house with a white roof, where the rider steps out.
 */
function lifts(out: MeshBuilder): void {
  for (const l of SALESFORCE_LIFTS) {
    for (const dz of [-1.6, 1.6]) {
      box(out, l.x, (DECK + 3.0) / 2, l.z + dz, 1.3, (DECK + 3.0) / 2, 1.3, PALE_GLASS, GLASS)
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(out, l.x + sx * 1.3, (DECK + 3.0) / 2, l.z + dz + sz * 1.3, 0.08, (DECK + 3.0) / 2, 0.08, SKIN, METAL)
    }
    // the head house on the deck
    box(out, l.x + 1.5, DECK + 3.25, l.z, 3.4, 0.2, 3.6, SKIN, METAL)
    // its name both ways, at the street door and at the deck door
    for (const sx of [-1, 1]) {
      sign(out, board('LIFT · SALESFORCE PARK', 0.3), { x: l.x + sx * 1.42, y: 3.2, z: l.z, heading: sx * Math.PI / 2 })
      sign(out, board('LIFT · STREET', 0.3), { x: l.x + sx * 1.42, y: DECK + 2.7, z: l.z, heading: sx * Math.PI / 2 })
    }
  }
}

export const TRANSBAY: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /** the whole complex: the building, the park on it, the gondola and the bridge from the tower */
  salesforceTransitCenter: (out: MeshBuilder, fit: Fit): void => {
    transitCenter(out, fit)
    park(out, fit)
    gondola(out, fit)
    lifts(out)
    towerBridge(out, fit)
  },
}
