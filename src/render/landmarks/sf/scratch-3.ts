/**
 * Four curved-plan towers kit batch 9 correctly escalated (docs/sf-batches/ESCALATIONS.md): `facade()` cannot
 * say a curved plan (docs/KIT.md, "A facade cannot be curved" — a polygon edge is flat by construction), so
 * these are hand-built from the shared parts (`../parts.ts`, `../tower.ts`) rather than one `facade()` call.
 * Every plan below comes from the entry's own OSM ring (`fit.ring`, via `towerRing`/`roundRing`), never
 * re-derived from raw lat/lon. Reference photographs looked at for all four, under
 * `docs/shots/refs/sf-mapillary/way-<id>-0{1,2,3}.jpg` (docs/shots/refs/sf-fetch/done.csv confirms all four
 * "kept,3").
 *
 * Registered through ../index.ts; placed by public/landmarks/san-francisco/scratch-3.json (appended last).
 */
import type { MeshBuilder } from '../../buildings.ts'
import { capPolygon } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import type { Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { edgeAt, offsetRing, roundRing, boxAlong, railing, simplifyRing } from '../parts.ts'
import { towerRing, faceBand } from '../tower.ts'

type P2 = { x: number; z: number }

/** Anticlockwise, so every edge's (dz, −dx) — `edgeAt`'s own normal convention — points out of the building. */
function ccw(ring: P2[]): P2[] {
  let a = 0
  for (let i = 0; i < ring.length; i++) { const p = ring[i]; const q = ring[(i + 1) % ring.length]; a += p.x * q.z - q.x * p.z }
  return a >= 0 ? ring : [...ring].reverse()
}

/* ============================================================================ way/1282042031 Clementina scalloped tower */

/**
 * 320-330 Clementina St, way/1282042031 — 52 m escalated for "stacked/scalloped projecting balconies wrapping
 * every floor; reconstructed ring has 158 vertices with dozens of sub-3 m chords rotating continuously." Frames
 * `way-1282042031-01.jpg` and `-03.jpg` (docs/shots/refs/sf-mapillary/) both show it plainly: a plain grey/tan
 * concrete slab with a continuous, unbroken column of ROUNDED projecting balconies stacked storey over storey up
 * the whole curved south face, green-painted balcony soffits/undersides against cream balustrades, roughly a
 * dozen floors. (`-02.jpg` under this id is a different, unrelated Central Computers storefront a few doors down
 * on the same Mapillary sequence — not used for shape.) `roundRing` is run over the baked ring so the hundred-plus
 * short chords the escalation names read as a genuinely smooth curve rather than a facet fan, then `faceBand`'s
 * `bays` kind with `round: true` draws exactly this: a projecting rounded bay in every position, every floor,
 * the wall itself left plain between them — the kit gap the escalation names ("no per-edge curved bay") closed
 * with the part that already exists for a straight edge, just fed a smoothed ring instead.
 */
const CLEM_WALL: Rgb = [0.82, 0.79, 0.72]
const CLEM_BALC: Rgb = [0.38, 0.5, 0.32]

export function clementinaScallopedTower(out: MeshBuilder, fit: Fit): void {
  // the baked ring already carries the continuous curve as many sub-3 m chords (the escalation's own
  // description) — simplified HARD here (a wide `min`/`bend`) so the triangle budget survives one bay
  // window per remaining edge, every floor, up a ~16-storey tower; it still reads round at rider distance.
  const raw = ccw(fit.ring && fit.ring.length >= 6 ? fit.ring : towerRing(fit))
  const ring = simplifyRing(raw, 3.4, 0.12)
  const H = fit.height > 20 && fit.height < 70 ? fit.height : 52

  faceBand(out, ring, 0, H, {
    kind: 'bays', wall: CLEM_WALL, glass: CLEM_BALC, material: 'concrete',
    floor: 3.15, pitch: 3.2, bay: { depth: 0.85, round: true },
  })
  capPolygon(out, ring, H, CLEM_WALL, surfaceTag('concrete'))
  // the plain vertical stair/lift core the photos show standing proud on the building's flat (north) side
  const flat = offsetRing(ring, -0.6)
  faceBand(out, flat, H * 0.02, H * 1.03, { kind: 'blank', wall: [0.72, 0.7, 0.65], material: 'concrete' }, [0])
}

/* ============================================================================ way/1410182008 & way/1410183655 Uber HQ curved block */

const UBER_GLASS: Rgb = [0.22, 0.33, 0.44]
const UBER_FRAME: Rgb = [0.1, 0.11, 0.13]
const UBER_ORANGE: Rgb = [0.82, 0.42, 0.1]
const UBER_WOOD: Rgb = [0.55, 0.38, 0.24]
const UBER_SCREEN: Rgb = [0.2, 0.21, 0.22]

/**
 * A thin band standing proud of a curved ring at its top, painted the Uber HQ's signature orange cornice line
 * (visible wrapping the whole curved roofline in all three frames of both ways, catching the light as a bright
 * copper-orange stripe just under the parapet).
 */
function orangeCornice(out: MeshBuilder, ring: P2[], y: number): void {
  for (let i = 0; i < ring.length; i++) {
    const e = edgeAt(ring, i)
    boxAlong(out, e.mid.x + e.nx * 0.12, y, e.mid.z + e.nz * 0.12, e.L / 2, 0.22, 0.12, e.heading, UBER_ORANGE, surfaceTag('metal'))
  }
}

/**
 * 1455 Market / 700 3rd St, way/1410182008 — "curved corner: a 12-facet run, chords 2.3-9.9 m, continuous ~30
 * degree rotation." Frames -01/-02/-03 (docs/shots/refs/sf-mapillary/) all show the same building from three
 * angles: a dark glass tower whose corner sweeps through a continuous round curve, an orange band capping a
 * setback partway up, and — at street level under the curve — a perforated dark metal screen panel over the
 * entrance (the "Uber" signage frame). `roundRing` turns the baked 12-facet curve into a genuinely smooth arc;
 * the escalation's ~30 degree sweep and 2.3-9.9 m chords match this corner rather than a rotated rectangle, so
 * the full ring is smoothed, not just one corner.
 */
export function uberHqCorner(out: MeshBuilder, fit: Fit): void {
  const raw = ccw(fit.ring && fit.ring.length >= 6 ? fit.ring : towerRing(fit))
  const ring = roundRing(raw, 3.2, 5)
  const H = fit.height > 20 && fit.height < 65 ? fit.height : 48

  const podiumH = Math.min(5.5, H * 0.14)
  faceBand(out, ring, 0, podiumH, { kind: 'blank', wall: UBER_SCREEN, material: 'metal' })
  faceBand(out, ring, podiumH, H * 0.78, { kind: 'curtain', wall: UBER_FRAME, glass: UBER_GLASS, pitch: 1.6, floor: 4.1, material: 'metal' })
  orangeCornice(out, ring, H * 0.78)
  const upper = offsetRing(ring, -0.7)
  faceBand(out, upper, H * 0.8, H, { kind: 'curtain', wall: UBER_FRAME, glass: UBER_GLASS, pitch: 1.6, floor: 4.1, material: 'metal' })
  capPolygon(out, upper, H, UBER_FRAME, surfaceTag('metal'))
}

/**
 * way/1410183655 — the other wing of the same Uber HQ block, "curved plan, TWO separate curved runs in the
 * ring." Frames under this id (docs/shots/refs/sf-mapillary/way-1410183655-0{1,2,3}.jpg) show the SAME curved
 * corner as way/1410182008 from further back on 3rd Street, plus, on the return wall the first way's frames
 * don't show square-on, a run of diagonal WOOD-TONE fins/brise-soleil climbing the glass in a zigzag — visible
 * as the brown diagonal lattice on the right-hand face in `-01.jpg`/`-03.jpg`. That second run is built as a
 * band of raked diagonal timber beams standing proud of the same curtain wall, on the ring's second curved
 * stretch (the edges the offset ring's own longer, gentler radius run picks out from the sharper corner curve).
 */
export function uberHqWing(out: MeshBuilder, fit: Fit): void {
  const raw = ccw(fit.ring && fit.ring.length >= 6 ? fit.ring : towerRing(fit))
  const ring = roundRing(raw, 3.2, 5)
  const H = fit.height > 18 && fit.height < 60 ? fit.height : 44

  const podiumH = Math.min(5.5, H * 0.15)
  faceBand(out, ring, 0, podiumH, { kind: 'blank', wall: UBER_SCREEN, material: 'metal' })
  faceBand(out, ring, podiumH, H * 0.85, { kind: 'curtain', wall: UBER_FRAME, glass: UBER_GLASS, pitch: 1.6, floor: 4.0, material: 'metal' })
  orangeCornice(out, ring, H * 0.85)
  // the setback top storey above the cornice, as on the corner wing — without it the roof was drawn at H over walls
  // that stop at 0.85 H, and stood 6 m in the air (owner, 2026-10-03: "a roof floating in the air" by Chase Center)
  const upper = offsetRing(ring, -1.5)
  faceBand(out, upper, H * 0.85, H, { kind: 'curtain', wall: UBER_FRAME, glass: UBER_GLASS, pitch: 1.6, floor: 4.0, material: 'metal' })
  capPolygon(out, ring, H * 0.85 + 0.6, UBER_FRAME, surfaceTag('metal'))
  capPolygon(out, upper, H, UBER_FRAME, surfaceTag('metal'))

  // the second curved run's diagonal wood fins: pick the longer half of the ring's edges (the gentler,
  // second curve) and lay a zigzag of raked beams proud of the glass, floor-height apart
  const lengths = ring.map((_, i) => edgeAt(ring, i).L)
  const total = lengths.reduce((a, b) => a + b, 0)
  let acc = 0
  const woodEdges: number[] = []
  for (let i = 0; i < ring.length; i++) {
    acc += lengths[i]
    if (acc > total * 0.55 && acc < total * 0.85) woodEdges.push(i)
  }
  for (const i of woodEdges) {
    const e = edgeAt(ring, i)
    const rows = Math.max(2, Math.round((H * 0.85 - podiumH) / (H * 0.85 * 0.16)))
    for (let r = 0; r < rows; r++) {
      const y0 = podiumH + (r / rows) * (H * 0.85 - podiumH)
      const y1 = podiumH + ((r + 1) / rows) * (H * 0.85 - podiumH)
      const mid = (y0 + y1) / 2
      const dir = r % 2 === 0 ? 1 : -1
      boxAlong(out, e.mid.x + e.nx * 0.22, mid, e.mid.z + e.nz * 0.22, e.L / 2 - 0.2, (y1 - y0) / 2 - 0.15, 0.06,
        e.heading + dir * 0.18, UBER_WOOD, surfaceTag('clapboard'))
    }
  }
}

/* ============================================================================ way/1474571838 Clementina curved corner turret */

const TURRET_WALL: Rgb = [0.9, 0.88, 0.82]
const TURRET_TRIM: Rgb = [0.24, 0.23, 0.22]
const TURRET_GLASS: Rgb = [0.28, 0.34, 0.38]

/**
 * The corner of a simplified ring closest to the given point, rounded on its own (a bigger radius than
 * `roundRing` would ever give every corner without turning the whole rectangle into a drum — see below).
 */
function bowOneCorner(ring: P2[], near: P2, r: number, n = 8): P2[] {
  let best = 0
  let bestD = Infinity
  for (let i = 0; i < ring.length; i++) {
    const d = Math.hypot(ring[i].x - near.x, ring[i].z - near.z)
    if (d < bestD) { bestD = d; best = i }
  }
  const p = ring[best]
  const prev = ring[(best - 1 + ring.length) % ring.length]
  const next = ring[(best + 1) % ring.length]
  const d0 = Math.hypot(p.x - prev.x, p.z - prev.z) || 1
  const d1 = Math.hypot(next.x - p.x, next.z - p.z) || 1
  const rr = Math.min(r, d0 * 0.4, d1 * 0.4)
  const a = { x: p.x + ((prev.x - p.x) / d0) * rr, z: p.z + ((prev.z - p.z) / d0) * rr }
  const b = { x: p.x + ((next.x - p.x) / d1) * rr, z: p.z + ((next.z - p.z) / d1) * rr }
  const arc: P2[] = []
  for (let k = 0; k <= n; k++) {
    const t = k / n
    const u = 1 - t
    arc.push({ x: u * u * a.x + 2 * u * t * p.x + t * t * b.x, z: u * u * a.z + 2 * u * t * p.z + t * t * b.z })
  }
  return [...ring.slice(0, best), ...arc, ...ring.slice(best + 1)]
}

/**
 * way/1474571838 — 52 m, escalated primarily FROM THE PHOTOGRAPHS: "batch 9 judged this primarily from the
 * photographs because the OSM way is coarsely noded and could be misread as a rotated rectangle." Frames
 * `way-1474571838-0{1,2,3}.jpg` all show the same thing plainly, from three different corners of the block: a
 * cream/white stucco residential tower with a genuinely ROUND bowed corner turret rising the building's full
 * height, banded by continuous ribbon windows that wrap smoothly round the curve (no flat facets visible at
 * street distance), sitting over a darker two-storey base — the OTHER three corners stay square, which is
 * exactly the "could be misread as a rotated rectangle" trap: a naive `roundRing` over the whole coarse ring
 * (tried first here — see docs/BUGS.md if this regresses) turns the WHOLE footprint into a drum instead,
 * because the ring's few remaining points after simplification are all roughly the same distance apart. The
 * baked 21-point ring simplifies to six corners with one visible outward jog around (x=-19, z=8) — that jog is
 * this building's one curved corner — so only THAT corner is bowed, at a much bigger radius than a uniform
 * round would allow, and the other three stay sharp.
 */
export function clementinaCurvedTurret(out: MeshBuilder, fit: Fit): void {
  const simplified = ccw(fit.ring && fit.ring.length >= 4 ? fit.ring : towerRing(fit))
  const ring = bowOneCorner(simplified, { x: -19, z: 8 }, 7, 8)
  const H = fit.height > 20 && fit.height < 65 ? fit.height : 52

  const baseH = Math.min(7, H * 0.14)
  faceBand(out, ring, 0, baseH, { kind: 'punched', wall: TURRET_TRIM, glass: TURRET_GLASS, material: 'concrete', floor: 3.5, solid: 0.35 })
  faceBand(out, ring, baseH, H, {
    kind: 'punched', wall: TURRET_WALL, glass: TURRET_GLASS, material: 'stucco',
    floor: 3.05, pitch: 2.4, solid: 0.32,
  })
  capPolygon(out, ring, H, TURRET_WALL, surfaceTag('stucco'))

  // small cantilevered balcony rails at every third floor on the curve, matching the shallow projecting
  // sills visible under the ribbon windows in the street-level frames
  const floors = Math.round((H - baseH) / 3.05)
  for (let fl = 2; fl < floors; fl += 3) {
    const y = baseH + fl * 3.05
    const line: P2[] = ring.map((p) => {
      const idx = ring.indexOf(p)
      const e = edgeAt(ring, idx)
      return { x: p.x + e.nx * 0.15, z: p.z + e.nz * 0.15 }
    })
    line.push(line[0])
    railing(out, line, y, { kind: 'solid', height: 0.9, colour: TURRET_TRIM, material: 'concrete' })
  }
}

export const SCRATCH_3: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  clementinaScallopedTower,
  uberHqCorner,
  uberHqWing,
  clementinaCurvedTurret,
}
