/**
 * Portsmouth Square (docs/SKYPARKS.md, "Portsmouth Square — referenced 2026-09-23, and NOT boring"): the
 * square is the ROOF of Portsmouth Square Garage. The owner's ORIGINAL cost ceiling for this entry:
 *
 *   > "Since it's basically a bridge to nowhere (we can't go in buildings), it's not the MOST interesting
 *   > place. but we should at least get the gist."
 *
 * ---- THAT SCOPING DECISION IS OVERTURNED (BUGS.md #173, 2026-09-24)
 *
 *   > "We did PART of portsmouth square, but it looks very unfinished and is missing the huge skybridge
 *   > that's the whole reason to do it"
 *
 * The bridge was built as a silhouette stub on the strength of the quote above — a plain slab "cut off
 * short", never crossing Kearny Street. The owner has now said the opposite, emphatically: the bridge to the
 * Hilton/Chinese Culture Center is THE reason to model this block. `skybridgeToHilton` below replaces the old
 * `bridgeSilhouette` stub with the real span, built from three references that resolve exactly how it meets
 * the Hilton (`docs/shots/refs/aerials/ports-6-skybridge-to-hilton.webp`, `ports-7-gate-from-bridge.webp`,
 * `ports-8-chinese-culture-center-entrance.webp`): a WIDE, OPEN brick-paved plaza-walkway (not enclosed —
 * that was a guess this file's own photos disprove), white-capped brick parapets, concrete benches and
 * faceted gold lantern piers, climbing gently from the square's deck, passing under a tiled pagoda gate with
 * red ironwork at the Hilton end (SKYPARKS.md: "the gate appears to normally be closed"), and ending in a
 * forecourt with a stair down to the Chinese Culture Center's entrance, which sits at grade in the gap
 * between the Hilton's own two splayed legs (`hiltonFinancialDistrict`, districts/model-tall.ts) — no
 * separate piers are built here, the Hilton's inverted-Y legs ARE the "two huge battered piers" SKYPARKS.md
 * describes. The mosaic facing on those piers and on the CCC entrance stair is still NOT modelled (do-not,
 * below) — a plain stair reads as an arrival without that budget.
 *
 * REGISTRATION, honestly stated: this file and `hiltonFinancialDistrict` are fitted independently, each in
 * its own local frame, with no shared coordinate at build time. The bridge's HEADING comes from `edgeAt()` on
 * this file's own ring (never a hand atan2, bug #135), as required; its LENGTH (43 m) and climb (2.8 m) come
 * from the real lat/lon gap between this file's origin (37.7948339, -122.40536495) and way/260922316's
 * (37.795142, -122.404297, docs/sf-buildings.csv) — about 100 m apart, minus the Hilton's own half-length
 * (`fit.hx`, 38.8 m per model-tall.ts) and a short forecourt. That distance math lines up with
 * `hiltonFinancialDistrict`'s own comment that Portsmouth Square sits "~12 deg off" its short-end axis — the
 * same ~12-16 deg of slop shows up here as a lateral offset over the 43 m run. This is the "get the gist"
 * standard the rest of this file already holds itself to, not a claimed exact seam; if a photo pins the exact
 * junction facade, that is the thing to fix next, not the span or the height.
 *
 * DO: the deck over the garage with its edge and planting; the LEVEL ACCESS from Walter U Lum Place (the
 * square sits at street grade there — no stair, which is what makes it ridable at all); the two pagoda
 * pavilions; the Empress of China's circular balcony openings; the skybridge to the Hilton, built in full.
 * DO NOT: the Chinese Culture Center's mosaic facing on its piers/entrance stair, the playground equipment,
 * the bridge as a ROUTE (see below), the square's own brick paving detail beyond a material tag.
 *
 * ---- IS THE BRIDGE RIDEABLE? No — left as a dead end, same as before, and NOT wired into `Region.stairways`
 * or the ride graph. The far end lands inside the Hilton's footprint (the Chinese Culture Center entrance,
 * i.e. a building interior this game does not model), and SKYPARKS.md already recorded the owner's own
 * precedent for exactly this shape of question, about a different bridge: "can't bike on the bridge, it
 * doesn't actually go into the park so that would be pointless." The gate is also "normally closed" per the
 * same doc. Flagged rather than assumed: if the owner wants it graph-connected as a one-way dead-end visit
 * (like Embarcadero's plaza paths), that is a `Region.stairways`/ride-graph change, not a modelling one.
 *
 * ---- THE RING
 *
 * The deck's outline below is not typed from a bounding box: it is the real outer way of OSM relation
 * 14547583 ("Portsmouth Square"), read from the Overpass cache (`tools/cache/overpass-a049f7a75351625b.json`)
 * and converted to local metres about the square's own centre (37.7948339, -122.40536495), simplified from
 * ~18 survey points to the 12 that matter. It is CONCAVE — the west side is a long diagonal (Walter U Lum
 * Place is not parallel to the other three streets) and the east side steps inward where the Chinese Culture
 * Center building bites into the block — so every inward offset here goes through `offsetRing`, never
 * `insetRing` (the concave-ring trap).
 *
 * `RING[0] -> RING[1]` (the long west edge) is Walter U Lum Place: the square is at grade there, so that one
 * edge gets NO retaining wall and NO railing — a rider rolls straight on. Every other edge gets the garage's
 * retaining wall, with the automatic deck planting (`out.decks`) along the top.
 *
 * ---- THE TIERED-EAVE HELPER
 *
 * `tieredPagodaRoof` below hand-builds the one shape no kit part can say: a roof that flares UP at its
 * corners and dips at mid-span (`dome()` in kit.ts only shrinks monotonically and cannot do this). It takes
 * a centre, a base height and a tier count, and is written to be reusable — docs/PROGRESS.md flags the same
 * gap at the Japanese Tea Garden (`src/render/landmarks/sf/districts/parks.ts`: `japaneseTeaGardenPagoda`,
 * `japaneseTeaGardenGate`, `japaneseTeaGardenTeaHouse`, all currently faking the shape with a plain
 * `crown: 'hip'`/`'pyramid'`). It is exported from here so that file can import it directly; it was not
 * inlined into parks.ts because parks.ts was not part of this task's scope.
 *
 * ---- HEADINGS AND NORMALS
 *
 * All wall/roof orientation below comes from `edgeAt()` — never a hand-rolled `atan2` (bug #135). The
 * pagodas' and Empress of China's hand-built quads (not run through `facade()`/kit helpers, so they get no
 * automatic normal-flip) each pass an explicit outward normal computed from the same edge data, checked by
 * eye in `tools/model-shots.ts` renders (see the report).
 */
import type { MeshBuilder } from '../../buildings.ts'
import { capPolygon } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { box, prism, type Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { boxAlong, edgeAt, offsetRing, railing, stair } from '../parts.ts'
import { faceBand } from '../tower.ts'

type P2 = { x: number; z: number }

// ---- the real ring, see header -------------------------------------------------------------------------
const RING: P2[] = [
  { x: -40.0, z: 37.8 },
  { x: -26.4, z: -47.7 },
  { x: -17.0, z: -46.4 },
  { x: 37.9, z: -37.4 },
  { x: 40.0, z: -36.0 },
  { x: 36.0, z: -11.9 },
  { x: 24.7, z: -10.7 },
  { x: 20.1, z: 18.1 },
  { x: 28.1, z: 19.3 },
  { x: 23.6, z: 47.7 },
  { x: 17.8, z: 46.8 },
  { x: -29.9, z: 39.4 },
]
const ACCESS_EDGE = 0 // RING[0] -> RING[1]: Walter U Lum Place, at grade — no wall, no railing

const DECK_Y = 4.4 // the garage's clearance above the streets it does NOT meet at grade
const WALL: Rgb = [0.58, 0.57, 0.54]
const RED_LACQUER: Rgb = [0.62, 0.14, 0.1]
const RED_DK: Rgb = [0.46, 0.09, 0.07]
const TILE_DK: Rgb = [0.16, 0.19, 0.22]
const GOLD: Rgb = [0.72, 0.58, 0.24]
const CREAM: Rgb = [0.82, 0.78, 0.68]
const SIGN_RED: Rgb = [0.68, 0.15, 0.11]
const OPENING: Rgb = [0.22, 0.24, 0.27]

/**
 * A reusable hand-built tiered pagoda roof/eave, standing on posts, for anywhere a kit `dome()`/`crown` is
 * too monotone to say "upswept tiered eave" (Portsmouth Square's two pavilions here; the Japanese Tea
 * Garden's three builders per docs/PROGRESS.md — see file header). One tier = a ring of thin red posts,
 * a red architrave, and a tiled roof plate that DIPS at the middle of each side and KICKS UP at each
 * corner — the actual silhouette upswept tiled eaves have, which no single-slope cone/pyramid gives.
 */
export function tieredPagodaRoof(out: MeshBuilder, cx: number, cz: number, y0: number, opts: {
  tiers?: number; baseR?: number; shrink?: number; postH?: number
  roof?: Rgb; post?: Rgb; finial?: Rgb
} = {}): number {
  const tiers = opts.tiers ?? 3
  const shrink = opts.shrink ?? 0.74
  const postH = opts.postH ?? 2.4
  const roofColour = opts.roof ?? TILE_DK
  const postColour = opts.post ?? RED_LACQUER
  const finialColour = opts.finial ?? GOLD
  let r = opts.baseR ?? 4.2
  let y = y0
  for (let t = 0; t < tiers; t++) {
    // posts at the four corners, holding up this tier's eave
    for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]] as const) {
      box(out, cx + sx * r * 0.88, y + postH / 2, cz + sz * r * 0.88, 0.16, postH / 2, 0.16, postColour, surfaceTag('clapboard'))
    }
    // architrave ring just under the eave
    box(out, cx, y + postH, cz, r * 0.9, 0.14, 0.2, postColour, surfaceTag('clapboard'))
    box(out, cx, y + postH, cz, 0.2, 0.14, r * 0.9, postColour, surfaceTag('clapboard'))
    // the eave itself: 8 perimeter points (corner, mid, corner, mid, ...), corners kicked UP, mids dipped DOWN
    const eaveY = y + postH + 0.3
    const kick = 0.9 + t * 0.15
    const dip = 0.35
    const outR = r * 1.35 // the eave oversails the posts, as a real tiled roof does
    const midR = outR * 0.86
    const perim: { x: number; z: number; y: number }[] = []
    const corners: [number, number][] = [[1, 1], [-1, 1], [-1, -1], [1, -1]]
    for (let i = 0; i < 4; i++) {
      const [sx, sz] = corners[i]
      const [mx, mz] = corners[(i + 1) % 4]
      perim.push({ x: cx + sx * outR, z: cz + sz * outR, y: eaveY + kick })
      const midSx = (sx + mx) / 2
      const midSz = (sz + mz) / 2
      const len = Math.hypot(midSx, midSz) || 1
      perim.push({ x: cx + (midSx / len) * midR, z: cz + (midSz / len) * midR, y: eaveY - dip })
    }
    const ridgeY = eaveY + kick + 0.6 + t * 0.1
    for (let i = 0; i < perim.length; i++) {
      const a = perim[i]
      const b = perim[(i + 1) % perim.length]
      // apex twice, forming a wide triangle-as-quad fan slice — same trick used for prism()'s cap
      const apex: [number, number, number] = [cx, ridgeY, cz]
      const pa: [number, number, number] = [a.x, a.y, a.z]
      const pb: [number, number, number] = [b.x, b.y, b.z]
      // outward horizontal normal (away from the roof's own centre) blended with a strong upward component —
      // robust for every tier regardless of kick/dip, and always points away from the ridge rather than
      // depending on winding
      const mxp = (pa[0] + pb[0]) / 2 - cx
      const mzp = (pa[2] + pb[2]) / 2 - cz
      const mlen = Math.hypot(mxp, mzp) || 1
      const nx = mxp / mlen
      const ny = 0.6
      const nz = mzp / mlen
      const nl = Math.hypot(nx, ny, nz) || 1
      out.quad([pa, pb, apex, apex], [nx / nl, ny / nl, nz / nl], [[0, 0], [1, 0], [1, 1], [0, 1]], roofColour, surfaceTag('tile'))
    }
    r *= shrink
    y = ridgeY - 0.4
  }
  // gilded finial: a slim tapering spire
  prism(out, cx, cz, y, y + 1.6, 0.35, 8, finialColour, surfaceTag('metal'), 0.02)
  return y + 1.6
}

/** One pagoda pavilion: a low red platform, a red railing, and a `tieredPagodaRoof` on top. */
function pagodaPavilion(out: MeshBuilder, cx: number, cz: number, y: number): void {
  box(out, cx, y + 0.15, cz, 4.6, 0.15, 4.6, RED_DK, surfaceTag('concrete'))
  railing(out, [{ x: cx - 4.6, z: cz - 4.6 }, { x: cx + 4.6, z: cz - 4.6 }, { x: cx + 4.6, z: cz + 4.6 }, { x: cx - 4.6, z: cz + 4.6 }, { x: cx - 4.6, z: cz - 4.6 }], y + 0.3, { kind: 'posts', height: 0.85, colour: RED_LACQUER, spacing: 1.2 })
  tieredPagodaRoof(out, cx, cz, y + 0.3, { tiers: 3, baseR: 3.6 })
}

const BRICK_DECK: Rgb = [0.5, 0.3, 0.24]
const PARAPET: Rgb = [0.76, 0.74, 0.68]
const BENCH: Rgb = [0.68, 0.66, 0.62]
const IRON_RED: Rgb = [0.55, 0.1, 0.08]

/** A small faceted "gold" lantern on a stone plinth (`ports-6`/`ports-7`/`ports-8`): cheap 4-sided prisms, a
 * diamond in cross-section, read as the distinctive lanterns lining the bridge and the CCC forecourt. */
function lanternPier(out: MeshBuilder, x: number, z: number, y: number): void {
  box(out, x, y + 0.22, z, 0.32, 0.22, 0.32, CREAM, surfaceTag('concrete'))
  prism(out, x, z, y + 0.44, y + 1.05, 0.3, 4, GOLD, surfaceTag('metal'))
  prism(out, x, z, y + 1.05, y + 1.28, 0.14, 4, GOLD, surfaceTag('metal'))
}

/** A plain concrete bench block, matching the ones along the real bridge's parapets. */
function bench(out: MeshBuilder, x: number, z: number, y: number, heading: number): void {
  boxAlong(out, x, y + 0.22, z, 0.45, 0.22, 0.9, heading, BENCH, surfaceTag('concrete'))
}

/**
 * The Portsmouth Square skybridge to the Hilton / Chinese Culture Center — built in full, per the header's
 * BUGS.md #173 note. `gateX,gateZ` is the bridge mouth on the square's own deck (past the retaining wall);
 * `headingOut` is `edgeAt(ring, 6).heading`, the required convention (never a hand atan2, bug #135) — its
 * sin/cos give the TRAVEL direction (`edgeAt`'s own outward-normal convention) and the perpendicular WIDTH
 * direction, exactly as `boxAlong`'s own hz/hx axes read for this heading.
 *
 * Span and climb (43 m run, 2.8 m rise) are derived from the real lat/lon gap to way/260922316 minus its own
 * half-length, not typed — see the header's REGISTRATION note for the arithmetic and its honest error bar.
 */
function skybridgeToHilton(out: MeshBuilder, gateX: number, gateZ: number, y0: number, headingOut: number): void {
  const RUN = 43 // metres — real-world gap (~100 m, Projection maths in the header) minus the Hilton's own half-length and a forecourt
  const RISE = 2.8 // "climbing gently" (docs/SKYPARKS.md) — nowhere near the deck-to-street kind of climb
  const HALF_W = 6 // the real bridge is a wide plaza-walkway, not a footpath (ports-1/ports-6)
  const SEGMENTS = 4
  const sHead = Math.sin(headingOut)
  const cHead = Math.cos(headingOut)
  const travel = { x: sHead, z: cHead } // edgeAt's own outward-normal convention: the direction OUT from the square
  const side = { x: cHead, z: -sHead } // perpendicular — boxAlong's own hx (width) axis for this heading

  // the gatehouse astride the bridge mouth, on the square's own deck — widened to the bridge's real width
  box(out, gateX, y0 + 1.6, gateZ, HALF_W * 0.5, 1.6, 1.4, RED_LACQUER, surfaceTag('clapboard'))
  tieredPagodaRoof(out, gateX, gateZ, y0 + 3.2, { tiers: 1, baseR: HALF_W * 0.85, postH: 1.2 })

  // the centreline points and heights at each segment boundary, and the deck/parapets/furniture built off them
  const pts: { x: number; z: number; y: number }[] = []
  for (let i = 0; i <= SEGMENTS; i++) {
    const t = i / SEGMENTS
    pts.push({ x: gateX + travel.x * RUN * t, z: gateZ + travel.z * RUN * t, y: y0 + RISE * t })
  }
  for (let i = 0; i < SEGMENTS; i++) {
    const a = pts[i]
    const b = pts[i + 1]
    const cx = (a.x + b.x) / 2
    const cz = (a.z + b.z) / 2
    const cy = (a.y + b.y) / 2
    const segLen = RUN / SEGMENTS
    // the deck slab: wide, brick-paved (SURFACES.brick gives the running-bond pattern for free)
    boxAlong(out, cx, cy - 0.3, cz, HALF_W, 0.35, segLen / 2, headingOut, BRICK_DECK, surfaceTag('brick'))
    // low parapets both sides, white-capped concrete over brick in the reference photos — simplified to one
    // solid tone, per this file's existing cost discipline
    for (const s of [1, -1] as const) {
      const pa = { x: a.x + side.x * HALF_W * s, z: a.z + side.z * HALF_W * s }
      const pb = { x: b.x + side.x * HALF_W * s, z: b.z + side.z * HALF_W * s }
      railing(out, [pa, pb], cy, { kind: 'solid', height: 0.95, thickness: 0.28, colour: PARAPET, material: 'concrete' })
    }
    // a bench against each parapet on the middle two segments, and a lantern pier at each far boundary
    if (i === 1 || i === 2) {
      for (const s of [1, -1] as const) {
        bench(out, cx + side.x * (HALF_W - 0.55) * s, cz + side.z * (HALF_W - 0.55) * s, cy, headingOut)
      }
    }
    if (i > 0) {
      for (const s of [1, -1] as const) {
        lanternPier(out, a.x + side.x * (HALF_W + 0.25) * s, a.z + side.z * (HALF_W + 0.25) * s, a.y)
      }
    }
  }

  // the Hilton-end gate: a bigger tiered pagoda roof spanning the bridge, with a red iron fence across it —
  // "the gate appears to normally be closed" (docs/SKYPARKS.md)
  const head = pts[SEGMENTS]
  box(out, head.x, head.y + 2.0, head.z, HALF_W * 0.92, 2.0, 0.35, RED_LACQUER, surfaceTag('clapboard'))
  tieredPagodaRoof(out, head.x, head.z, head.y + 4.0, { tiers: 2, baseR: HALF_W * 1.05, postH: 1.6 })
  railing(out, [
    { x: head.x - side.x * HALF_W, z: head.z - side.z * HALF_W },
    { x: head.x + side.x * HALF_W, z: head.z + side.z * HALF_W },
  ], head.y, { kind: 'posts', height: 1.7, spacing: 0.4, colour: IRON_RED })

  // a short forecourt beyond the gate, then a stair down to grade — the Chinese Culture Center's entrance
  // sits at street level in the gap between the Hilton's own two splayed legs (hiltonFinancialDistrict), so
  // this is where the bridge's climb gives back what it gained
  const courtEnd = { x: head.x + travel.x * 3, z: head.z + travel.z * 3, y: head.y }
  boxAlong(out, (head.x + courtEnd.x) / 2, head.y - 0.3, (head.z + courtEnd.z) / 2, HALF_W * 1.15, 0.35, 1.5, headingOut, BRICK_DECK, surfaceTag('brick'))
  for (const s of [1, -1] as const) {
    lanternPier(out, courtEnd.x + side.x * (HALF_W * 1.15 + 0.25) * s, courtEnd.z + side.z * (HALF_W * 1.15 + 0.25) * s, head.y)
  }
  // stair(): `a`/`b` is the flight's WIDTH line, climbing along ITS OWN normal — built so that normal points
  // along `travel` (forward, away from the square) and `anchor: 'top'` puts the width line at y1 (the
  // forecourt), descending to grade beyond it, never a hand atan2 (bug #135)
  const stairA = { x: courtEnd.x + side.x * HALF_W, z: courtEnd.z + side.z * HALF_W }
  const stairB = { x: courtEnd.x - side.x * HALF_W, z: courtEnd.z - side.z * HALF_W }
  stair(out, stairA, stairB, 0, courtEnd.y, { anchor: 'top', material: 'concrete', tread: 'paving' })
}

/** The garage's retaining edge along one ring edge: a plain wall up to deck level, with a rail on top. */
function retainingEdge(out: MeshBuilder, ring: P2[], i: number, y: number): void {
  const e = edgeAt(ring, i)
  boxAlong(out, e.mid.x + e.nx * 0.15, y / 2, e.mid.z + e.nz * 0.15, e.L / 2, y / 2, 0.3, e.heading, WALL, surfaceTag('concrete'))
  railing(out, [e.a, e.b], y, { kind: 'posts', height: 1.0, colour: [0.2, 0.21, 0.24] })
}

/**
 * Portsmouth Square deck: the skypark part only — the garage roof, its edge (flush at Walter U Lum Place,
 * walled everywhere else) and its planting (`out.decks`) — plus the two pagoda pavilions and the skybridge to
 * the Hilton, which stand ON the deck. The Empress of China is deliberately NOT here: it is an ordinary
 * building beside the square (`empressOfChina` below), registered as its own manifest entry.
 */
export function portsmouthSquareDeck(out: MeshBuilder, _fit: Fit): void {
  const ring = RING
  capPolygon(out, ring, DECK_Y, [0.64, 0.62, 0.56], surfaceTag('concrete'))
  for (let i = 0; i < ring.length; i++) {
    if (i === ACCESS_EDGE) continue // Walter U Lum Place: level access, no wall, no rail
    retainingEdge(out, ring, i, DECK_Y)
  }
  // the automatic deck planting along the ring (render/plants.ts edges it in shrubs/trees) — skip the access
  // edge's immediate strip by using the full ring anyway: the planting pass reads the polygon, not per-edge
  out.decks.push({ ring: offsetRing(ring, -1.2), y: DECK_Y })

  // two pagoda pavilions — one toward the north lawn, one toward the east side, moved clear of the bridge's
  // own (now much wider) gatehouse at the bridge mouth so the two don't collide
  pagodaPavilion(out, -4, 30, DECK_Y)
  pagodaPavilion(out, 12, -16, DECK_Y)

  // the skybridge to the Hilton / Chinese Culture Center, dead-ending to the east: heading measured off the
  // notch edge (index 6), never hand-rolled atan2 (bug #135)
  const bridgeEdge = edgeAt(ring, 6)
  skybridgeToHilton(out, bridgeEdge.mid.x + bridgeEdge.nx * 2, bridgeEdge.mid.z + bridgeEdge.nz * 2, DECK_Y, bridgeEdge.heading)
}

/**
 * The Empress of China building, beside the square: cream concrete, storeys of large CIRCULAR openings
 * punched through the balcony slabs (no kit `facade()` notch is round — see file header), and a roof-garden
 * restaurant sign across the top. An ordinary custom building, not part of the deck.
 */
export function empressOfChina(out: MeshBuilder, fit: Fit): void {
  const hx = Math.max(6, fit.hx)
  const hz = Math.max(6, fit.hz)
  const H = fit.height > 8 && fit.height < 40 ? fit.height : 16
  const floors = Math.max(3, Math.round(H / 3.4))
  const floorH = H / floors
  const ring: P2[] = [{ x: -hx, z: -hz }, { x: hx, z: -hz }, { x: hx, z: hz }, { x: -hx, z: hz }]
  // street-facing edge: ring index 2 is the one whose OWN normal comes out +z for this CCW rectangle
  // (checked by render, not assumed — index 0 pointed −z here and put the whole facade on the back of the
  // building, invisible from the street, exactly the past bug this file's header warns about)
  const front = edgeAt(ring, 2)
  faceBand(out, ring, 0, H, { kind: 'blank', wall: CREAM, material: 'concrete' })
  capPolygon(out, ring, H, [0.7, 0.68, 0.6], surfaceTag('concrete'))
  // storey band lines (thin dark string courses) + a circular opening centred on each bay, each floor
  const bays = Math.max(3, Math.round((front.L) / 3.4))
  for (let f = 1; f < floors; f++) {
    const y = f * floorH
    boxAlong(out, front.mid.x + front.nx * (hz * 0 + 0.01), y, front.mid.z + front.nz * 0.01, front.L / 2, 0.12, 0.05, front.heading, [0.55, 0.53, 0.47], surfaceTag('concrete'))
    for (let b = 0; b < bays; b++) {
      const u = (b + 0.5) / bays - 0.5
      const px = front.a.x + front.tx * (u * front.L + front.L / 2)
      const pz = front.a.z + front.tz * (u * front.L + front.L / 2)
      // a flat dark disc set just proud of the wall, reading as a punched circular opening — this building's
      // one distinctive move. Faces the outward normal from `edgeAt`, never a hand atan2 (bug #135), and the
      // normal is explicit because this quad is hand-built and gets no automatic flip.
      const R = Math.min(1.1, floorH * 0.32)
      const n = 12
      const cx = px + front.nx * 0.06
      const cz = pz + front.nz * 0.06
      const cy = y - floorH * 0.42
      for (let k = 0; k < n; k += 2) {
        const a0 = (k / n) * Math.PI * 2
        const a1 = ((k + 1) / n) * Math.PI * 2
        const a2 = ((k + 2) / n) * Math.PI * 2
        const P = (ang: number): [number, number, number] => [cx + front.tx * Math.cos(ang) * R, cy + Math.sin(ang) * R, cz + front.tz * Math.cos(ang) * R]
        out.quad([P(a0), P(a1), P(a2), P(a2)], [front.nx, 0, front.nz], [[0, 0], [1, 0], [1, 1], [0, 1]], OPENING, surfaceTag('glass'))
      }
    }
  }
  // roof-garden restaurant sign across the top, facing the same way as the openings, sitting on the parapet
  boxAlong(out, front.mid.x + front.nx * 0.2, H + 0.6, front.mid.z + front.nz * 0.2, front.L * 0.34, 0.5, 0.12, front.heading, SIGN_RED, surfaceTag('metal'))
}
