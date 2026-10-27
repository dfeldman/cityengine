/**
 * Four buildings `docs/sf-batches/ESCALATIONS.md` names as NOT kit-modellable — the roof form, the massing,
 * or the plan itself defeats `facade()`, so each is hand-built from raw primitives plus the shared
 * shape-part helpers (`../parts.ts`, `../tower.ts`), never `facade()`. No reference photograph exists under
 * `docs/shots/refs/` for any of the four (checked by id), so all four are restrained and plainly massed,
 * using the escalation brief's own architectural description (Moorish Revival fortress, pagoda, round
 * café) for material/period colour only — every plan below comes from the baked ring
 * (`tools/cache/bake/san-francisco/tiles/*.json`) via `fit.ring`, never from a web search or raw lat/lon.
 *
 * The Peace Pagoda, the first of the four, has since been rebuilt from photographs in its own file (./peace-pagoda.ts)
 * and is only registered from here. Registered through ../index.ts; placed by
 * public/landmarks/san-francisco/scratch-1.json (appended last).
 */
import type { MeshBuilder } from '../../buildings.ts'
import { capPolygon } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { box, prism, type Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { edgeAt, offsetRing, longestEdge, boxAlong } from '../parts.ts'
import { towerRing, faceBand } from '../tower.ts'
import { peacePagoda } from './peace-pagoda.ts'

type P2 = { x: number; z: number }

/** Anticlockwise, so every edge's (dz, −dx) — `edgeAt`'s own normal convention — points out of the building. */
function ccw(ring: P2[]): P2[] {
  let a = 0
  for (let i = 0; i < ring.length; i++) { const p = ring[i]; const q = ring[(i + 1) % ring.length]; a += p.x * q.z - q.x * p.z }
  return a >= 0 ? ring : [...ring].reverse()
}

/* ============================================================================= way/35973054 SF Armory */

const BRICK: Rgb = [0.45, 0.19, 0.15]
const BRICK_DK: Rgb = [0.36, 0.15, 0.12]
const TRIM: Rgb = [0.58, 0.5, 0.42]

/**
 * A square castellated corner tower: a plain brick shaft rotated onto the wall it stands on (`heading` from
 * `edgeAt`, never a hand `atan2`), a slightly oversailing parapet slab, and a ring of merlons round the top
 * — the Moorish Revival corner turret this building's own escalation cites. `along`/`across` are the
 * shaft's half-extents along the wall / into the block.
 */
function castellatedTower(out: MeshBuilder, cx: number, cz: number, y0: number, y1: number,
                          along: number, across: number, heading: number): void {
  boxAlong(out, cx, (y0 + y1) / 2, cz, across, (y1 - y0) / 2, along, heading, BRICK_DK, surfaceTag('brick'))
  boxAlong(out, cx, y1 + 0.15, cz, across + 0.2, 0.15, along + 0.2, heading, TRIM, surfaceTag('ashlar'))
  const s = Math.sin(heading)
  const co = Math.cos(heading)
  const merlonH = 1.1
  const n = 5
  for (let side = 0; side < 2; side++) {
    const dz0 = side === 0 ? across - 0.18 : -(across - 0.18)
    for (let i = 0; i < n; i++) {
      if (i % 2 === 1) continue // crenel gap between merlons
      const u = -along + (along * 2) * (i + 0.5) / n
      const wx = cx + dz0 * s + u * co
      const wz = cz + dz0 * co - u * s
      box(out, wx, y1 + 0.3 + merlonH / 2, wz, 0.5, merlonH / 2, 0.5, BRICK_DK, surfaceTag('brick'))
    }
  }
}

/**
 * San Francisco Armory (Kink.com building), 1800 Mission St, way/35973054 — Moorish Revival brick fortress,
 * 19 m tag, no photograph. Escalated on measured plan evidence: the baked 17-vertex ring already carries two
 * distinct 2-3 m bump-outs flanked by chamfered corners along its long north wall — massing `facade()`
 * cannot say with one flat extrusion. That plan is used AS BAKED (`fit.ring`, never re-derived or
 * re-measured from raw lat/lon): the main brick mass is `faceBand` run straight over the real ring, so every
 * bump and chamfer already in the baked outline comes through, and a castellated brick tower rises from each
 * end of the ring's own longest wall — the "castellated corner towers rising above the main roofline" the
 * escalation names — with a plain crenellated parapet on the main roof between them.
 */
export function sfArmory(out: MeshBuilder, fit: Fit): void {
  const ring: P2[] = ccw(fit.ring && fit.ring.length >= 10 ? fit.ring : towerRing(fit))
  const H = fit.height > 8 && fit.height < 30 ? fit.height : 19

  faceBand(out, ring, 0, H, { kind: 'punched', wall: BRICK, material: 'brick', arched: true, floor: 3.4, pitch: 3.4, solid: 0.62 })
  capPolygon(out, ring, H, TRIM, surfaceTag('ashlar'))

  // a plain crenellated parapet round the main roofline, between the towers
  for (let i = 0; i < ring.length; i++) {
    const e = edgeAt(ring, i)
    const merlons = Math.max(2, Math.round(e.L / 2.2))
    for (let k = 0; k < merlons; k += 2) {
      const u = (k + 0.5) / merlons
      const px = e.a.x + e.tx * u * e.L
      const pz = e.a.z + e.tz * u * e.L
      box(out, px + e.nx * 0.1, H + 0.6, pz + e.nz * 0.1, 0.4, 0.6, 0.4, BRICK_DK, surfaceTag('brick'))
    }
  }

  // two castellated towers, one at each end of the ring's own longest wall (the long north wall the
  // escalation measured its bump-outs and chamfers against)
  const li = longestEdge(ring)
  const e = edgeAt(ring, li)
  const towerH = H + 11
  castellatedTower(out, e.a.x + e.nx * 1.6, e.a.z + e.nz * 1.6, 0, towerH, 2.4, 2.4, e.heading)
  castellatedTower(out, e.b.x + e.nx * 1.6, e.b.z + e.nz * 1.6, 0, towerH, 2.4, 2.4, e.heading)
}

/* ============================================================================ way/288717109 Woolf House */

const STUCCO: Rgb = [0.78, 0.73, 0.62]
const STUCCO_TRIM: Rgb = [0.62, 0.58, 0.48]
const RAIL: Rgb = [0.25, 0.26, 0.28]

/**
 * Woolf House, way/288717109 — the owner's own note: "132-corner plan but simple repeating... deserves a
 * little effort," so the ring itself IS the repeat (measured against the baked ring in
 * `tools/cache/bake/san-francisco/tiles/4_-6.json`, in metres — a long sawtooth wall of short alternating
 * chords, roughly a 3-5 m diagonal run then a ~1-2 m return, repeated dozens of times along all four sides,
 * rotated ~45°; NOT read off raw lat/lon, which rounds this into fake diagonals per the brief). The ring is
 * CONCAVE (the sawtooth notches cut inward), so every offset below goes through `offsetRing`, never
 * `insetRing`.
 *
 * `faceBand` run straight over the real 132-point ring already reproduces the sawtooth massing exactly as
 * baked — that is "building it as a loop." On top of that, a second explicit loop over every ring edge picks
 * out the REPEATING UNIT itself (the short ~1-2 m return chords that form each notch) and drops a thin
 * balcony rail across each one, so the repeat actually reads at a glance rather than disappearing into a
 * flat texture.
 */
export function woolfHouse(out: MeshBuilder, fit: Fit): void {
  const ring: P2[] = ccw(fit.ring && fit.ring.length >= 8 ? fit.ring : towerRing(fit))
  const H = fit.height > 6 && fit.height < 60 ? fit.height : 25

  faceBand(out, ring, 0, H, { kind: 'punched', wall: STUCCO, material: 'stucco', floor: 3.1, pitch: 2.6, solid: 0.58 })
  capPolygon(out, ring, H, STUCCO_TRIM, surfaceTag('concrete'))
  // a thin cornice band picking out the roofline, drawn IN from the real (concave) ring via offsetRing
  const cornice = offsetRing(ring, -0.25)
  capPolygon(out, cornice, H + 0.15, STUCCO_TRIM, surfaceTag('concrete'))

  // the repeat: every short "return" chord of the sawtooth gets a thin balcony rail at the 3rd-floor line,
  // making the repeating unit itself legible rather than just implicit in the wall's own zigzag
  const bandY = H * 0.62
  for (let i = 0; i < ring.length; i++) {
    const e = edgeAt(ring, i)
    if (e.L < 0.5 || e.L > 2.3) continue
    boxAlong(out, e.mid.x + e.nx * 0.18, bandY, e.mid.z + e.nz * 0.18, e.L / 2 + 0.05, 0.06, 0.35, e.heading, RAIL, surfaceTag('metal'))
  }
}

/* ============================================================================ way/112072207 Round House */

const ROUND_WALL: Rgb = [0.86, 0.82, 0.7]
const ROUND_TRIM: Rgb = [0.24, 0.22, 0.2]
const ROUND_GLASS: Rgb = [0.32, 0.4, 0.42]
const ROUND_ROOF: Rgb = [0.3, 0.27, 0.24]

/**
 * Round House Café, near the Golden Gate Bridge's Presidio plaza, way/112072207 — a genuinely circular
 * plan: the baked ring is 34 vertices, a continuous 360° heading sweep, 1.4-1.9 m chords (per the
 * escalation brief; measured independently here too — the 34-point ring's own centroid-to-vertex radius is
 * 8.6-9.6 m, i.e. round to within survey noise). A round building deserves to be BUILT round, not faceted
 * to the baked 34-gon, so this ignores the polygon's exact vertices and instead takes only its centre and
 * mean radius from `fit.ring`, then draws true cylinders (`prism` at 32 sides — visually round from any
 * distance a rider gets). The 16 m height tag reads as a full storey count wildly out of scale for a
 * single-room diner and is corrected down to a plain one-storey drum with a low flared roof.
 */
export function roundHouseCafe(out: MeshBuilder, fit: Fit): void {
  let cx = 0
  let cz = 0
  let r = Math.max(fit.hx, fit.hz, 6)
  if (fit.ring && fit.ring.length >= 8) {
    for (const p of fit.ring) { cx += p.x; cz += p.z }
    cx /= fit.ring.length
    cz /= fit.ring.length
    let rs = 0
    for (const p of fit.ring) rs += Math.hypot(p.x - cx, p.z - cz)
    r = rs / fit.ring.length
  }
  const H = 4.2 // a single-storey diner, corrected down from the 16 m tag (see header)
  const sides = 32

  prism(out, cx, cz, 0, H, r, sides, ROUND_WALL, surfaceTag('stucco'), r, false)
  // a round storefront glazing band, built on a 32-gon so `faceBand`'s straight bays still read as a
  // continuous curve at this radius
  const glassRing: P2[] = []
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2
    glassRing.push({ x: cx + Math.sin(a) * (r - 0.02), z: cz + Math.cos(a) * (r - 0.02) })
  }
  faceBand(out, glassRing, 0.6, H - 0.5, { kind: 'curtain', wall: ROUND_TRIM, glass: ROUND_GLASS, pitch: 1.6, floor: H - 1.1, material: 'metal' })
  // a low flared roof-disc oversailing the wall, and a plain cap
  prism(out, cx, cz, H, H + 0.5, r + 0.6, sides, ROUND_ROOF, surfaceTag('metal'), r * 0.85, true)
}

export const SCRATCH_1: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  peacePagoda,
  sfArmory,
  woolfHouse,
  roundHouseCafe,
}
