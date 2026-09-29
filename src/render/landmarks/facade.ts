/**
 * `facade()` — a building said in SLOTS rather than in tiers.
 *
 * Why this exists (docs/KIT-DESIGN.md): nine measured modelling runs produced punched boxes on buildings whose
 * whole character was a ground-floor arcade, a giant colonnade, or a frame of corner piers. Every one of those
 * faults was an OMISSION THE API PERMITTED SILENTLY — `tower()` makes the ground floor, the frame and the crown
 * optional, so a model that never considers them still produces a legal, wrong building.
 *
 * The mechanism is one rule: **required keys, nullable values. No optional keys anywhere in `FacadeSpec`.** A
 * model must write `frame: null` — a decision made while looking at a photograph — where today it writes
 * nothing and never looks. TypeScript turns the omission into a compile error.
 *
 * **Use `facade()` unless the building's form cannot be said in slots, in which case model it by hand.** The
 * whole kit stays available and mixes freely with this one: `tower()`, `colonnade()`, `beam()`, `box()` and the
 * rest can be called on the same building, before or after `facade()`. A round or curved plan, a twisted tower,
 * a checkerboard in-and-out grid, a building that is nothing but columns — those are bespoke work, and handing
 * them to raw primitives is the right answer, not a failure. Slots are the default path, never a mandate.
 *
 * Everything a model supplies is an OBSERVATION: counts it can count (storeys, arches, columns), words it can
 * see (`wide`, `rusticated`, `arcade`), materials it can name. **Sections take a `storeys` count, never a
 * height fraction** — the kit divides `fit.height` by the counts. Nobody should ever type `solid: 0.25`.
 *
 * FLAT WALLS ONLY. Every slot is placed per EDGE of `towerRing(fit)`, which may be any polygon (one test
 * building has a 17-corner plan), and a polygon edge is flat by construction. **A facade cannot be curved.**
 * `roundRing()` rounds corners into short straight segments and is the nearest thing to a curve there is; if a
 * building is genuinely round, build it by hand.
 *
 * Local frame: the fitted footprint's, +y up — the same frame as `tower()` and `parts.ts`.
 */
import { MeshBuilder } from '../buildings.ts'
import type { Rgb } from '../models.ts'
import type { Surface } from '../cartoon-material.ts'
import { surfaceTag } from '../cartoon-material.ts'
import type { Fit } from './fit.ts'
import { faceBand, insetRing, towerRing, tower, type Crown, type Face, type Tier, type TowerSpec } from './tower.ts'
import { arcade, colonnade, boxAlong, edgeAt, longestEdge, quoins, dentilCourse, friezeFor, stair, type StairRail } from './parts.ts'
import { classicalColumn, type ColumnOrder } from './column.ts'
import { pediment, placed } from './kit.ts'

type P2 = { x: number; z: number }

/** Which classical order a column, pilaster or arcade wears. */
export type Order = ColumnOrder

/**
 * Where a placed slot goes, on a footprint that is an arbitrary polygon:
 *  - `'front'`   the longest edge — the default, and right for most buildings;
 *  - `'street'`  the front plus every edge at least 75% as long (a corner building's two elevations). A
 *                `Fit` carries no street bearings, so this is a GUESS from the plan: a deep building whose
 *                side street elevation is much shorter than its front needs an explicit edge index instead;
 *  - `'all'`     every edge of the ring;
 *  - a number    one edge index into `towerRing(fit)` (the SIMPLIFIED ring, not `fit.ring` raw).
 */
export type On = 'front' | 'street' | 'all' | number

/**
 * What the wall is made of, as a name rather than a colour and a pattern. A closed set, because the evidence
 * (KIT-DESIGN.md §2) is that a model picks well among named alternatives and writes the middle of any range it
 * is given. Each one carries a colour, a procedural surface and the glass that goes with it.
 */
export type Material =
  | 'granite' | 'limestone' | 'marble' | 'sandstone' | 'terracotta' | 'brick' | 'dark-brick'
  | 'dark-stone' | 'concrete' | 'precast' | 'stucco' | 'bronze' | 'glass'

const MATERIALS: Record<Material, { wall: Rgb; surface: Surface; glass?: Rgb }> = {
  granite: { wall: [0.56, 0.56, 0.58], surface: 'granite' },
  limestone: { wall: [0.84, 0.82, 0.75], surface: 'ashlar' },
  marble: { wall: [0.92, 0.91, 0.87], surface: 'ashlar' },
  sandstone: { wall: [0.78, 0.68, 0.54], surface: 'ashlar' },
  terracotta: { wall: [0.88, 0.85, 0.76], surface: 'terracotta' },
  brick: { wall: [0.62, 0.34, 0.28], surface: 'brick' },
  'dark-brick': { wall: [0.36, 0.22, 0.2], surface: 'brick' },
  'dark-stone': { wall: [0.3, 0.3, 0.32], surface: 'granite' },
  concrete: { wall: [0.72, 0.72, 0.7], surface: 'concrete' },
  precast: { wall: [0.82, 0.81, 0.78], surface: 'concrete' },
  stucco: { wall: [0.88, 0.86, 0.8], surface: 'stucco' },
  bronze: { wall: [0.26, 0.24, 0.2], surface: 'metal' },
  glass: { wall: [0.33, 0.35, 0.39], surface: 'metal', glass: [0.34, 0.45, 0.5] },
}

const DARK_GLASS: Rgb = [0.17, 0.19, 0.22]

/** The wall colour a material name stands for — for hand-placed parts that must match a `facade()` wall. */
export const materialColour = (m: Material): Rgb => MATERIALS[m].wall
/** The procedural surface a material name stands for. */
export const materialSurface = (m: Material): Surface => MATERIALS[m].surface

/**
 * What the STREET-LEVEL storeys do. Nullable, and `null` is an ordinary answer — most streets outside a
 * downtown core are a plain wall meeting the pavement. `storeys` is how many floors the treatment covers, and
 * it may be nearly the whole building: a temple front is `ground` with a big `storeys` and `shaft: null`.
 */
export type Ground =
  /** a wall PIERCED by round-headed openings: a bank, a market hall, a loggia (Leidesdorff Place) */
  | { kind: 'arcade'; arches: number; storeys: number; material: Material | null; on?: On; order?: Order }
  /** FREE-STANDING columns in front of the wall under an entablature (the Pacific Exchange) */
  | { kind: 'colonnade'; columns: number; storeys: number; order: Order; material: Material | null; on?: On }
  /**
   * A GIANT ORDER: columns three or four storeys tall in front of an ORDINARY WINDOWED WALL, with the
   * building carrying on above and behind them. The defining move of a bank, a courthouse, an exchange or a
   * university library, and the thing `colonnade` could not say — `colonnade` stands its columns against a
   * BLANK wall, which is right for a temple and wrong for everything that has offices behind it.
   *
   * `windows` is what that wall behind the columns does, which is the whole point of the kind.
   * `engaged: true` flattens the columns against the wall as three-quarter columns (the commoner, cheaper
   * treatment); `false` stands them free in front of it, with the wall visible between them.
   * `flanks: true` leaves a solid block of wall at each end of the run, the columns recessed between them —
   * an order *in antis*, which is exactly the Pacific Exchange (way/256066230) and an enormous number of
   * 1910s–30s banks. `pediment: true` puts a gable over the whole run; most American examples have none.
   */
  | { kind: 'giant-order'; columns: number; storeys: number; order: Order; windows: Windows
      engaged: boolean; flanks: boolean; pediment: boolean; material: Material | null; on?: On }
  /** a colonnade that is an entrance: optionally pedimented, standing forward of the wall, on steps */
  | { kind: 'portico'; columns: number; storeys: number; order: Order; pediment: boolean; steps: number
      projecting: boolean; material: Material | null; on?: On }
  /** glass between piers at street level, a fascia over it — a retail frontage */
  | { kind: 'shopfronts'; bays: number; storeys: number; material: Material | null }
  /** heavy banded stone with small openings — the podium of a classical block */
  | { kind: 'rusticated'; storeys: number; material: Material | null }
  /** the wall set BACK behind the floors above, which overhang it */
  | { kind: 'recessed'; storeys: number; depth: number; material: Material | null }
  /** nothing special: the wall simply meets the pavement */
  | { kind: 'plain'; storeys: number; material: Material | null }

/**
 * How the windows of a section read from across the street. The kit turns each word into craft.
 *
 * The last three are AEDICULED: every window wears a moulded architrave with a cornice on brackets over it,
 * and `pedimented`/`segmental` add a little gable above that. This is the most visible neoclassical detail
 * after the columns — the US Appraisers Building's piano nobile (way/32965865), and the standard treatment
 * of a bank's or a courthouse's principal storeys. Use `dressed` where the surrounds are mouldings only.
 */
export type Windows =
  | 'wide' | 'balanced' | 'small' | 'continuous' | 'vertical' | 'horizontal' | 'arched' | 'bays'
  | 'dressed' | 'pedimented' | 'segmental'

/** The repeating middle. NULLABLE — a temple or a one-storey pavilion has no repeating middle. */
export interface Shaft {
  storeys: number
  windows: Windows
  material: Material | null
  /**
   * PER-EDGE overrides, same `on` vocabulary and the same partition rule as `Ground`'s `on`: an edge named by
   * an entry here gets that entry's `windows`/`material` instead of the ones above, and an edge no entry names
   * still gets the ones above — never both, so nothing is drawn twice. This is the kit gap batch 6 found on
   * the Walt Disney Family Museum (docs/sf-batches/ESCALATIONS.md): a brick front and a glass curtain rear on
   * one ring, which one `material` per `facade()` call could not say and a second call would double-draw.
   * Optional, and empty/absent draws exactly as before it existed — additive only.
   */
  by?: { on: On; windows: Windows; material: Material | null }[]
}

/** Storeys that DIFFER from the shaft — the thing 550 California's floor-to-ceiling top storey needed. */
export type Top =
  | { kind: 'glazed'; storeys: number; material: Material | null }
  | { kind: 'attic'; storeys: number; material: Material | null }
  | { kind: 'arcaded'; storeys: number; material: Material | null }
  | { kind: 'setback'; storeys: number; by: number; material: Material | null }

/**
 * The horizontal LINES between the sections, and the cornice. Thin bands are what make a pre-war building read
 * as composed rather than extruded. `'string'` is a thin belt course, `'cornice'` a projecting ledge,
 * `'bracketed'` a deep one (Alvinza Hayward's).
 */
export interface Bands {
  aboveGround: 'string' | 'cornice' | null
  belowTop: 'string' | 'cornice' | null
  /**
   * `'cornice'` a plain projecting ledge; `'bracketed'` a deep one; `'dentil'` a cornice with a course of
   * little square teeth under it and `'modillion'` one carried on scrolled brackets. The last two are what
   * a rider actually distinguishes a classical cornice by at street distance — the Curb Exchange's
   * (way/151185875) is dentilled, under its balustrade.
   */
  top: 'cornice' | 'bracketed' | 'dentil' | 'modillion' | null
}

/**
 * A FRAME standing forward with the wall recessed behind it — the generalisation of "corner piers"
 * (KIT-DESIGN.md §1f). Vertical only is an expressed structural frame; horizontal only is a midcentury
 * pavilion with a deep roof band; both is the ICA. `at: 'corners'` puts a vertical on every SHARP corner of the
 * ring (a turn of more than about 30°, so a 17-corner plan does not become a picket fence); `at: 'bays'`
 * spreads `count` of them along the front and street edges.
 */
export interface Frame {
  /** `'quoins'` is the classical corner: alternating long and short stone blocks up the angle, no recess */
  verticals: { kind: 'pier' | 'column' | 'pilaster' | 'quoins'; width: number; at: 'corners' | 'bays'; order?: Order; count?: number } | null
  /** the depth the top and base bands stand proud, metres */
  horizontals: { top: number; base: number } | null
  /** how far the wall sits back behind the frame, metres */
  recess: number
  material: Material
}

/** The way in. Small, at eye level, and every building has one — a rider passes within metres of it. */
export interface Entrance {
  at: 'centre' | 'corner' | number
  kind: 'door' | 'portal' | 'recessed'
  steps: number
  /**
   * A STOOP: the door raised `height` metres above the pavement, on a flight built by `stair()` — the stepped
   * entrance most buildings older than fifty years have, and the shape this API could not say. `height` is
   * what you read off a photograph (0.6–1.2 m for a row building, 2–4 m for an institution); the step count,
   * the tread depth and the flight's width all DERIVE from it, so nothing here is a typed step.
   *
   * `splay` widens the foot as a fraction of the flight's width — the civic entrance flight. `rail` puts
   * `stair()`'s own sloped rail up one or both sides.
   *
   * **This is the one OPTIONAL key in the whole spec**, against the doctrine in docs/KIT.md, and deliberately:
   * ~400 existing builders write an `entrance` literal, and a required key would break every one of them. It
   * defaults OFF, and with it absent `steps` draws exactly the boxes it always drew.
   */
  stoop?: { height: number; splay?: number; rail?: StairRail; width?: number } | null
}

/**
 * One building, in slots. **Every key is required; any value but `material` may be `null`.**
 *
 * `crown` is `tower()`'s closed `Crown` set (parapet, hip, mansard, dome, stepped, …) — see docs/KIT.md, which
 * has a picture of each one.
 */
export interface FacadeSpec {
  ground: Ground | null
  shaft: Shaft | null
  top: Top | null
  bands: Bands | null
  crown: Crown | null
  frame: Frame | null
  entrance: Entrance | null
  material: Material
}

/* ------------------------------------------------------------------ translation: words to craft */

/** `windows: 'wide'` means `solid: 0.25`. The model reports what it SEES; the kit converts. */
function faceFor(w: Windows, m: Material, storeyH: number): Face {
  const mat = MATERIALS[m]
  const base = { wall: mat.wall, glass: mat.glass ?? DARK_GLASS, floor: storeyH, material: mat.surface }
  switch (w) {
    case 'wide': return { ...base, kind: 'punched', pitch: 4.2, solid: 0.25 }
    case 'balanced': return { ...base, kind: 'punched', pitch: 3, solid: 0.45 }
    case 'small': return { ...base, kind: 'punched', pitch: 2.6, solid: 0.62 }
    case 'arched': return { ...base, kind: 'punched', pitch: 3, solid: 0.5, arched: true }
    case 'continuous': return { ...base, kind: 'curtain', pitch: 1.6 }
    case 'vertical': return { ...base, kind: 'fins', pitch: 2.4, solid: 0.4, depth: 0.45 }
    case 'horizontal': return { ...base, kind: 'bands', pitch: 3, solid: 0.42 }
    case 'bays': return { ...base, kind: 'bays', pitch: 3, solid: 0.5, bay: { depth: 0.9 } }
    // an aedicule wants a wider bay than a plain punched wall: the surround needs wall to stand on
    case 'dressed': return { ...base, kind: 'punched', pitch: 3.6, solid: 0.5, head: 'architrave' }
    case 'pedimented': return { ...base, kind: 'punched', pitch: 3.8, solid: 0.52, head: 'pediment' }
    case 'segmental': return { ...base, kind: 'punched', pitch: 3.8, solid: 0.52, head: 'segmental' }
  }
}

/** The wall a ground treatment stands on or in: what the tower draws over those storeys. */
function groundFace(g: Ground, m: Material, storeyH: number, frontL: number): Face {
  const mat = MATERIALS[m]
  switch (g.kind) {
    case 'arcade': case 'colonnade': case 'portico':
      // the parts stand against a plain wall; the openings are drawn by the part, not cut by the face
      return { kind: 'blank', wall: mat.wall, floor: storeyH, material: mat.surface }
    case 'giant-order':
      // unlike a colonnade, a giant order stands in front of an ORDINARY WINDOWED WALL — that is the point
      return faceFor(g.windows, m, storeyH)
    case 'shopfronts':
      return { kind: 'fins', wall: mat.wall, glass: mat.glass ?? DARK_GLASS, floor: storeyH, pitch: frontL / Math.max(1, g.bays), solid: 0.26, depth: 0.25, material: mat.surface }
    case 'rusticated':
      return { kind: 'punched', wall: mat.wall, glass: DARK_GLASS, floor: storeyH, pitch: 3.2, solid: 0.66, material: 'ashlar' }
    case 'recessed': case 'plain':
      return { kind: 'punched', wall: mat.wall, glass: mat.glass ?? DARK_GLASS, floor: storeyH, pitch: 3.2, solid: 0.5, material: mat.surface }
  }
}

function topFace(t: Top, m: Material, storeyH: number): Face {
  const mat = MATERIALS[m]
  switch (t.kind) {
    case 'glazed': return { kind: 'curtain', wall: mat.wall, glass: mat.glass ?? [0.3, 0.4, 0.46], floor: storeyH, pitch: 2, material: 'metal' }
    case 'arcaded': return faceFor('arched', m, storeyH)
    case 'attic': return { ...faceFor('small', m, storeyH), floor: storeyH }
    case 'setback': return faceFor('balanced', m, storeyH)
  }
}

/* ------------------------------------------------------------------ geometry helpers */

/** The edges of `ring` a slot's `on` selects. */
export function edgesFor(ring: P2[], on: On = 'front'): number[] {
  if (typeof on === 'number') return [((on % ring.length) + ring.length) % ring.length]
  const front = longestEdge(ring)
  if (on === 'front') return [front]
  if (on === 'all') return ring.map((_, i) => i)
  const L = edgeAt(ring, front).L
  return ring.map((_, i) => i).filter((i) => edgeAt(ring, i).L >= L * 0.75)
}

/** The ring's SHARP corners — a turn of more than `deg` degrees, so a rounded plan is not all corners. */
function sharpCorners(ring: P2[], deg = 30): { at: P2; heading: number }[] {
  const out: { at: P2; heading: number }[] = []
  for (let i = 0; i < ring.length; i++) {
    const prev = edgeAt(ring, (i - 1 + ring.length) % ring.length)
    const next = edgeAt(ring, i)
    let d = Math.abs(Math.atan2(next.tz, next.tx) - Math.atan2(prev.tz, prev.tx))
    if (d > Math.PI) d = Math.PI * 2 - d
    if (d > (deg * Math.PI) / 180) out.push({ at: ring[i], heading: (prev.heading + next.heading) / 2 })
  }
  return out
}

/** A ledge standing `depth` proud of the ring between y0 and y1: a cornice, a string course, a frame band. */
function ledge(out: MeshBuilder, ring: P2[], y0: number, y1: number, depth: number, c: Rgb, surface: Surface): void {
  const outer = insetRing(ring, -depth)
  faceBand(out, outer, y0, y1, { kind: 'blank', wall: c, material: surface })
  const tag = surfaceTag(surface)
  const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  for (let i = 0; i < ring.length; i++) {
    const j = (i + 1) % ring.length
    out.quad([[ring[i].x, y1, ring[i].z], [ring[j].x, y1, ring[j].z], [outer[j].x, y1, outer[j].z], [outer[i].x, y1, outer[i].z]], [0, 1, 0], UV, c, tag)
    out.quad([[outer[i].x, y0, outer[i].z], [outer[j].x, y0, outer[j].z], [ring[j].x, y0, ring[j].z], [ring[i].x, y0, ring[i].z]], [0, -1, 0], UV, c, tag)
  }
}

/** The underside of an overhang: a downward ring between an inner and an outer outline at y. */
function soffit(out: MeshBuilder, inner: P2[], outer: P2[], y: number, c: Rgb): void {
  const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  for (let i = 0; i < inner.length; i++) {
    const j = (i + 1) % inner.length
    out.quad([[outer[i].x, y, outer[i].z], [outer[j].x, y, outer[j].z], [inner[j].x, y, inner[j].z], [inner[i].x, y, inner[i].z]], [0, -1, 0], UV, c, 0)
  }
}

/** A flight of `n` treads in front of an edge, centred on `u` along it, `w` metres wide. */
function steps(out: MeshBuilder, e: ReturnType<typeof edgeAt>, u: number, w: number, n: number, c: Rgb, surface: Surface): void {
  const tread = 0.34
  const rise = 0.16
  const tag = surfaceTag(surface)
  for (let k = 0; k < n; k++) {
    const o = (n - k) * tread
    const cx = e.a.x + e.tx * u + e.nx * (o - tread / 2)
    const cz = e.a.z + e.tz * u + e.nz * (o - tread / 2)
    boxAlong(out, cx, (k + 0.5) * rise * 0.5, cz, w / 2 + (n - k) * 0.12, (k + 1) * rise / 2, tread / 2, e.heading, c, tag)
  }
}

/* ------------------------------------------------------------------ the slots that draw parts */

function drawGround(out: MeshBuilder, ring: P2[], g: Ground, h: number, wallMat: Material): void {
  const m = (g.material ?? wallMat)
  const mat = MATERIALS[m]
  if (g.kind === 'arcade') {
    /*
     * BUGS.md #96, second half: `edgesFor`'s own default is `'front'` — a single edge — which is right for a
     * `portico` (a projecting piece of the front, not the whole building) but wrong for an arcade, whose own
     * doc comment says it is "a wall PIERCED by round-headed openings" the way `shopfronts`/`rusticated`/
     * `plain` wrap the WHOLE ground floor: none of those three ever call `edgesFor` at all, because their
     * Face is applied to every edge of the ring by the tier-building code below, regardless of length. Left
     * at `'front'`, a corner building's arcade stopped dead at the corner and every other edge kept the plain
     * `blank` wall `groundFace` draws underneath — which read as "arcade() draws no arches" on any elevation
     * but the front one, on kit batch 2 and batch 3 alike. `'street'` (front plus any edge nearly as long)
     * was tried first and still fails on an L-shaped or notched footprint, where a real secondary wing's
     * ground edge is legitimately much shorter than the main frontage's — exactly `way/260162805`'s plan.
     * Default to `'all'`, matching the other three ground kinds edge-for-edge, so an arcade wraps a corner
     * (or a notch) the way a real arcaded ground floor does; an explicit `on` (front, a single edge, or
     * 'street') still wins.
     *
     * `'all'` alone over-corrects on a REAL footprint, though: an OSM ring is full of sub-metre survey-noise
     * jogs (0.6-1 m edges are common — see BUGS.md's own notes on `259925716`'s 0.3 m jog), and cramming
     * `arches` piers into one is meaningless geometry, not a wall worth decorating. `shopfronts` et al. never
     * hit this because their Face is one texture stretched over the whole ring, not per-edge columns and
     * piers. Skip any edge too short to hold even a narrow single bay.
     */
    const minBay = 1.6
    for (const i of edgesFor(ring, g.on ?? 'all')) {
      const e = edgeAt(ring, i)
      if (e.L < minBay) continue
      const n = Math.max(1, Math.min(g.arches, Math.floor(e.L / minBay)))
      arcade(out, e.a, e.b, 0, h * 0.94, n, {
        colour: mat.wall, material: mat.surface, order: g.order, tier: g.order ? 'near' : undefined,
        depth: Math.min(1.1, h * 0.16), piers: !g.order,
      })
    }
    return
  }
  if (g.kind === 'giant-order') {
    /*
     * A giant order: columns spanning ALL of `storeys`, in front of the windowed wall `groundFace` drew.
     * Everything is derived from `h` (the height those storeys occupy) and the edge's length — no typed
     * sizes. Drawn facing +z throughout, except the optional pediment, which is `pediment()` and therefore
     * needs the same `+ Math.PI` correction as the portico's (BUGS.md #101).
     */
    for (const i of edgesFor(ring, g.on)) {
      const e = edgeAt(ring, i)
      // in antis: a solid block of wall at each end, the order recessed between them (the Pacific Exchange)
      // an anta is a pier, not a strip: about a column bay wide, and never more than a fifth of the run
      const flank = g.flanks ? Math.min(0.2, (e.L / Math.max(2, g.columns)) * 0.55 / Math.max(6, e.L)) : 0
      const t0 = flank
      const t1 = 1 - flank
      const A = { x: e.a.x + e.tx * e.L * t0, z: e.a.z + e.tz * e.L * t0 }
      const B = { x: e.a.x + e.tx * e.L * t1, z: e.a.z + e.tz * e.L * t1 }
      const run = Math.hypot(B.x - A.x, B.z - A.z)
      const ent = Math.max(1.2, h * 0.11)
      const colH = h - ent - 0.4
      const r = Math.max(0.42, colH * 0.05 + 0.24)
      // engaged columns are three-quarter round against the wall; free-standing ones stand a bay's depth out
      const o = g.engaged ? r * 0.55 : Math.max(1.3, h * 0.07)
      colonnade(out, A, B, 0, colH, Math.max(2, g.columns), {
        radius: r, out: o, colour: mat.wall, material: mat.surface,
        order: g.order, tier: colH >= 10 ? 'near' : 'mid', entablature: ent, frieze: friezeFor(g.order),
      })
      if (g.flanks) {
        // the antae: full-height blocks of wall, coming out as far as the columns do
        for (const t of [t0, t1]) {
          const bw = e.L * flank
          const u = t === t0 ? bw / 2 : e.L - bw / 2
          // standing a little FORWARD of the columns, which is what makes an order read as recessed
          const d = (o + r) / 2 + 0.1
          boxAlong(out, e.a.x + e.tx * u + e.nx * (d / 2), h / 2, e.a.z + e.tz * u + e.nz * (d / 2),
            bw / 2, h / 2, d / 2 + 0.05, e.heading, mat.wall, surfaceTag(mat.surface))
        }
      }
      if (g.pediment) {
        const part = new MeshBuilder()
        const w = run / 2 + o
        pediment(part, -w, w, -o - 0.5, colH + ent + 0.2, w * 0.3, o * 0.9, mat.wall)
        placed(out, part, e.heading + Math.PI, (A.x + B.x) / 2, (A.z + B.z) / 2)
      }
    }
    return
  }
  if (g.kind === 'colonnade' || g.kind === 'portico') {
    const n = g.kind === 'colonnade' ? g.columns : g.columns
    for (const i of edgesFor(ring, g.on)) {
      const e = edgeAt(ring, i)
      const projecting = g.kind === 'portico' ? g.projecting : false
      const o = projecting ? Math.max(1.8, h * 0.18) : Math.max(1.4, h * 0.16)
      // a portico is a piece of the front, not the whole of it; a colonnade runs the length
      const t0 = g.kind === 'portico' ? 0.5 - Math.min(0.45, (n * 0.09)) : 0
      const t1 = g.kind === 'portico' ? 0.5 + Math.min(0.45, (n * 0.09)) : 1
      const A = { x: e.a.x + e.tx * e.L * t0, z: e.a.z + e.tz * e.L * t0 }
      const B = { x: e.a.x + e.tx * e.L * t1, z: e.a.z + e.tz * e.L * t1 }
      const stepH = g.kind === 'portico' ? g.steps * 0.16 : 0
      const colH = h * 0.86 - stepH
      colonnade(out, A, B, stepH, colH, Math.max(2, n), {
        // a classical column is about a ninth of its height through: thinner than that and it reads as a stick
        radius: Math.max(0.4, colH * 0.055 + 0.28), out: o, colour: mat.wall, material: mat.surface,
        order: g.order, tier: colH >= 7 ? 'near' : 'mid', entablature: Math.max(1, h * 0.12),
        frieze: friezeFor(g.order),
      })
      if (g.kind === 'portico') {
        if (g.steps > 0) steps(out, e, e.L * (t0 + t1) / 2, Math.hypot(B.x - A.x, B.z - A.z) + o, g.steps, mat.wall, mat.surface)
        if (g.pediment) {
          /*
           * BUGS.md #101. `pediment()` draws its front facing −z, but `edgeAt().heading` is the convention
           * for parts that draw facing +z (see parts.ts: "heading is the direction the wall FACES"). Turning
           * a −z part by a +z heading rotates it exactly 180°, so the pediment faced INTO the building and
           * read as a tilted slab pushing up out of the roof. `+ Math.PI` is the same correction the kit
           * demos make by hand for `pane`, `archedPane` and `courtFacade`, which also draw on −z.
           */
          const part = new MeshBuilder()
          const w = Math.hypot(B.x - A.x, B.z - A.z) / 2 + 0.6
          const y = stepH + colH + Math.max(1, h * 0.12) + 0.2
          pediment(part, -w, w, -o - 0.4, y, w * 0.34, o * 0.9, mat.wall)
          placed(out, part, e.heading + Math.PI, (A.x + B.x) / 2, (A.z + B.z) / 2)
        }
      }
    }
  }
}

function drawFrame(out: MeshBuilder, ring: P2[], f: Frame, H: number, groundTop: number): void {
  const mat = MATERIALS[f.material]
  const tag = surfaceTag(mat.surface)
  const v = f.verticals
  if (v) {
    const d = Math.max(f.recess + 0.15, v.width * 0.7)
    const put = (at: P2, heading: number): void => {
      if (v.kind === 'quoins') { quoins(out, at, heading, 0, H, mat.wall, mat.surface); return }
      if (v.kind === 'column' || v.kind === 'pilaster') {
        const r = v.width / 2
        const x = at.x + (v.kind === 'pilaster' ? 0 : Math.sin(heading) * r * 0.6)
        const z = at.z + (v.kind === 'pilaster' ? 0 : Math.cos(heading) * r * 0.6)
        classicalColumn(out, x, z, 0, H, r, mat.wall, { order: v.order ?? 'doric', tier: H >= 12 ? 'near' : 'mid', tag, heading })
        if (v.kind === 'pilaster') boxAlong(out, at.x, H / 2, at.z, v.width / 2, H / 2, d * 0.35, heading, mat.wall, tag)
      } else {
        boxAlong(out, at.x, H / 2, at.z, v.width / 2, H / 2, d, heading, mat.wall, tag)
      }
    }
    // quoins are a CORNER treatment by definition — `at: 'bays'` would scatter them up the middle of a wall
    if (v.at === 'corners' || v.kind === 'quoins') for (const c of sharpCorners(ring)) put(c.at, c.heading)
    else {
      for (const i of edgesFor(ring, 'street')) {
        const e = edgeAt(ring, i)
        const n = Math.max(2, v.count ?? Math.round(e.L / 6))
        for (let k = 0; k <= n; k++) {
          const u = (k / n) * e.L
          put({ x: e.a.x + e.tx * u, z: e.a.z + e.tz * u }, e.heading)
        }
      }
    }
  }
  if (f.horizontals) {
    if (f.horizontals.base > 0) ledge(out, ring, 0, Math.max(0.8, groundTop * 0.35), f.horizontals.base, mat.wall, mat.surface)
    if (f.horizontals.top > 0) ledge(out, ring, H - Math.max(1.2, H * 0.06), H, f.horizontals.top, mat.wall, mat.surface)
  }
}

function drawEntrance(out: MeshBuilder, ring: P2[], en: Entrance, storeyH: number, m: Material): void {
  const mat = MATERIALS[m]
  const i = typeof en.at === 'number' ? ((en.at % ring.length) + ring.length) % ring.length : longestEdge(ring)
  const e = edgeAt(ring, i)
  const u = en.at === 'corner' ? e.L * 0.14 : e.L * 0.5
  const h = en.kind === 'portal' ? Math.min(storeyH * 1.5, 7) : Math.min(storeyH * 0.82, 4.2)
  const w = en.kind === 'portal' ? 3.6 : 2.6
  // a stoop raises the door by its own height; without one the old arithmetic (steps x 0.16) is untouched
  const y0 = en.stoop ? en.stoop.height : en.steps * 0.16
  const dark: Rgb = [0.1, 0.1, 0.12]
  const px = e.a.x + e.tx * u
  const pz = e.a.z + e.tz * u
  const inset = en.kind === 'recessed' ? 0.9 : 0.12
  // the opening itself, set into the wall
  boxAlong(out, px - e.nx * inset * 0.5, y0 + h / 2, pz - e.nz * inset * 0.5, w / 2, h / 2, inset, e.heading, dark, 0)
  // a surround standing proud of it
  const t = en.kind === 'portal' ? 0.55 : 0.3
  for (const s of [-1, 1]) {
    boxAlong(out, px + e.tx * s * (w / 2 + t / 2) + e.nx * 0.12, y0 + h / 2, pz + e.tz * s * (w / 2 + t / 2) + e.nz * 0.12,
      t / 2, h / 2 + t / 2, 0.22, e.heading, mat.wall, surfaceTag(mat.surface))
  }
  boxAlong(out, px + e.nx * 0.14, y0 + h + t / 2, pz + e.nz * 0.14, w / 2 + t, t / 2 + 0.1, 0.28, e.heading, mat.wall, surfaceTag(mat.surface))
  /*
   * The STOOP, drawn by `stair()` from the door's own height: `anchor: 'top'` puts the head of the flight on
   * the wall edge, whose normal points at the street, so the steps come DOWN off the doorway toward the
   * pavement with their risers facing the rider. The flight's extent is `from`/`to` fractions of the edge
   * about the door, so it can never span the whole frontage the way the theatre's hand-built steps did.
   */
  if (en.stoop) {
    const fw = Math.max(w + 1.2, en.stoop.width ?? w + 1.2)
    const from = Math.max(0, (u - fw / 2) / e.L)
    const to = Math.min(1, (u + fw / 2) / e.L)
    stair(out, e.a, e.b, 0, en.stoop.height, {
      from, to, anchor: 'top', splay: en.stoop.splay ?? 0, rail: en.stoop.rail ?? 'none',
      colour: mat.wall, material: mat.surface,
    })
  } else if (en.steps > 0) steps(out, e, u, w + 1.2, en.steps, mat.wall, mat.surface)
}

/* ------------------------------------------------------------------ the call itself */

/**
 * Raise a building from its fitted footprint, said in slots. Translates to `tower()` — tiers, faces, cornices
 * and the crown — and then places the parts the tower grammar has no word for: the arcade or colonnade at the
 * ground, the frame, the entrance.
 *
 * Throws when `ground`, `shaft` and `top` are ALL null: a building with no storeys anywhere is a slip, not a
 * decision, and a silent slab is exactly what this API exists to prevent.
 */
export function facade(out: MeshBuilder, fit: Fit, spec: FacadeSpec): void {
  const ring = towerRing(fit)
  const H = fit.height > 3 ? fit.height : 12
  const gS = spec.ground?.storeys ?? 0
  const sS = spec.shaft?.storeys ?? 0
  const tS = spec.top?.storeys ?? 0
  const total = gS + sS + tS
  if (total <= 0) {
    throw new Error('facade(): ground, shaft and top are all null (or zero storeys) — a building is at least one of them')
  }
  const storeyH = H / total
  const groundTop = (gS / total) * H
  const recess = Math.max(spec.frame?.recess ?? 0, 0)

  const tiers: TowerSpec['tiers'] = []
  let cum = 0
  // the wall sits back behind its frame: the first tier is drawn in, and everything above stays on that outline
  const firstInset = recess > 0 ? recess : undefined

  if (spec.ground) {
    cum += gS
    const g = spec.ground
    const gm = g.material ?? spec.material
    tiers.push({
      to: cum / total,
      face: groundFace(g, gm, storeyH, edgeAt(ring, longestEdge(ring)).L),
      inset: g.kind === 'recessed' ? g.depth + recess : firstInset,
    })
  }
  if (spec.shaft) {
    cum += sS
    const sh = spec.shaft
    // a recessed ground floor is an OVERHANG: the wall above comes back out to the full outline
    const back = spec.ground?.kind === 'recessed' ? -spec.ground.depth : undefined
    // `by` partitions the shaft's edges: each entry's edges get its own face, everything else gets the base one
    const faceOverrides: NonNullable<Tier['faceOverrides']> | undefined = sh.by?.length
      ? sh.by.map((o) => ({ edges: edgesFor(ring, o.on), face: faceFor(o.windows, o.material ?? spec.material, storeyH) }))
      : undefined
    tiers.push({
      to: cum / total,
      face: faceFor(sh.windows, sh.material ?? spec.material, storeyH),
      inset: back ?? (tiers.length === 0 ? firstInset : undefined),
      faceOverrides,
    })
  }
  if (spec.top) {
    cum += tS
    const back = !spec.shaft && spec.ground?.kind === 'recessed' ? -spec.ground.depth : undefined
    tiers.push({
      to: cum / total,
      face: topFace(spec.top, spec.top.material ?? spec.material, storeyH),
      inset: spec.top.kind === 'setback' ? spec.top.by : back ?? (tiers.length === 0 ? firstInset : undefined),
    })
  }

  const wallMat = MATERIALS[spec.material]
  const cornices: NonNullable<TowerSpec['cornices']> = []
  if (spec.bands) {
    const belowTopAt = (gS + sS) / total
    if (spec.bands.aboveGround && gS > 0 && sS + tS > 0) {
      cornices.push({ at: Math.min(1.49, gS / total), depth: spec.bands.aboveGround === 'string' ? 0.25 : 0.6, height: spec.bands.aboveGround === 'string' ? 0.4 : 0.8, colour: wallMat.wall })
    }
    if (spec.bands.belowTop && tS > 0 && gS + sS > 0) {
      cornices.push({ at: Math.min(1.49, belowTopAt), depth: spec.bands.belowTop === 'string' ? 0.25 : 0.6, height: spec.bands.belowTop === 'string' ? 0.4 : 0.8, colour: wallMat.wall })
    }
    if (spec.bands.top) {
      const deep = spec.bands.top === 'bracketed' || spec.bands.top === 'modillion'
      cornices.push({ at: 0.999, depth: deep ? 1.3 : 0.7, height: deep ? 1.4 : 0.8, colour: wallMat.wall })
    }
  }

  tower(out, fit, {
    height: H,
    tiers,
    cornices,
    roof: [0.42, 0.42, 0.44],
    crown: spec.crown ?? undefined,
  })

  /*
   * The little blocks under the top cornice. `tower()` draws the cornice as a plain ledge; the course beneath
   * it is what lets a rider tell a classical cornice from a shelf at street distance. Drawn on the ring the
   * cornice actually stands on, facing +z per edge.
   */
  if (spec.bands?.top === 'dentil' || spec.bands?.top === 'modillion') {
    const deep = spec.bands.top === 'modillion'
    // the cornice tower() just drew: its height, and how far it projects
    const cH = deep ? 1.4 : 0.8
    const cD = deep ? 1.3 : 0.7
    /*
     * The blocks must sit UNDER the ledge and INSIDE its projection, which is where dentils actually live.
     * The first version put them at the ledge's own height and half its depth and they were completely
     * enclosed by it — invisible on screen at every size, the #96 failure exactly. `art` is the notional
     * entablature height the course is proportioned from; the y is solved back from where the blocks
     * themselves land (0.74 of it for dentils, 0.7 for modillions).
     */
    const art = deep ? 1.9 : 1.5
    const at = H - cH - (deep ? 0.34 : 0.2)
    dentilCourse(out, recess > 0 ? insetRing(ring, recess) : ring, at - art * (deep ? 0.7 : 0.74),
      art, cD * 0.78, wallMat.wall, wallMat.surface, deep ? 'modillion' : 'dentil')
  }

  // the overhang's underside, which tower() does not draw for a tier that comes back OUT
  if (spec.ground?.kind === 'recessed' && (sS > 0 || tS > 0)) {
    const outer = recess > 0 ? insetRing(ring, recess) : ring
    soffit(out, insetRing(outer, spec.ground.depth), outer, groundTop, wallMat.wall)
  }

  // the parts the tower grammar has no word for, on the outline they actually stand on
  const wallRing = recess > 0 ? insetRing(ring, recess) : ring
  if (spec.ground) drawGround(out, spec.ground.kind === 'recessed' ? insetRing(wallRing, spec.ground.depth) : wallRing, spec.ground, groundTop, spec.material)
  if (spec.frame) drawFrame(out, ring, spec.frame, H, groundTop)
  if (spec.entrance) drawEntrance(out, wallRing, spec.entrance, storeyH, spec.material)
}

export type { Crown }

/**
 * `bankTemple()` — the neoclassical bank-and-civic-temple vocabulary as one call: a `giant-order` ground
 * (already the kit's Pacific Exchange move), plus the two things that were missing when the SF review
 * flagged five buildings sharing this language (docs/LADDER.md's verdict-4 batch, 2026-09-24) — a MONUMENTAL
 * stair spanning the whole portico front (not just a door's `stoop`), and a `dome` crown. Both existed in the
 * kit already (`stair()`'s `'esplanade'` preset, `Crown`'s `'dome'` kind) but nothing wired them to a
 * `giant-order` front, so every prior bank temple either had no steps at all or a 3-step door stoop under a
 * six-storey colonnade. A set-back tower behind the temple front (the Old Federal Reserve's Moderne shaft)
 * is NOT this helper's job — that is `setbackTiers`/a second `tower()` call on an inset ring, done by hand
 * per building because how far back and how tall is a judgement call from the photograph, not a parameter
 * worth templating.
 */
export interface BankTempleSpec {
  columns: number
  order: Order
  storeys: number
  windows: Windows
  /** free-standing columns (false) or three-quarter columns flat on the wall (true) */
  engaged: boolean
  /** solid end blocks with the order recessed between them, in antis (the Pacific Exchange, the Old Mint) */
  flanks: boolean
  /** a gable over the whole run — most American examples have none */
  pediment: boolean
  material: Material
  top: Top | null
  bands: Bands
  /**
   * A broad flight across the WHOLE portico front, at podium scale — `stair()`'s `'esplanade'` preset (shallow
   * risers, deep alternating treads), not `entrance.stoop`'s door-width flight. `null` for a temple that
   * meets the pavement directly (the Old Federal Reserve's example: 8 columns on a flat portico with no
   * podium to climb). `height` is the podium's rise in metres, read off the photograph like any other stoop.
   */
  esplanade: { height: number; splay?: number } | null
  /** a dome over the block — `Crown`'s `'dome'` kind, the Savings Union Bank's defining feature */
  dome: { height: number; radius?: number; colour: Rgb; drum?: number } | null
  on?: On
}

export function bankTemple(out: MeshBuilder, fit: Fit, spec: BankTempleSpec): void {
  facade(out, fit, {
    ground: {
      kind: 'giant-order', columns: spec.columns, storeys: spec.storeys, order: spec.order,
      windows: spec.windows, engaged: spec.engaged, flanks: spec.flanks, pediment: spec.pediment,
      material: spec.material, on: spec.on,
    },
    shaft: null,
    top: spec.top,
    bands: spec.bands,
    crown: spec.dome ? { kind: 'dome', height: spec.dome.height, radius: spec.dome.radius, colour: spec.dome.colour, drum: spec.dome.drum } : null,
    frame: null,
    entrance: { at: 'centre', kind: 'portal', steps: spec.esplanade ? 0 : 3 },
    material: spec.material,
  })

  if (spec.esplanade) {
    const ring = towerRing(fit)
    const i = typeof spec.on === 'number' ? spec.on : longestEdge(ring)
    const e = edgeAt(ring, i)
    // anchor 'top': the highest riser sits AT the wall (the portico's own threshold), stepping DOWN and OUT
    // to grade — the flight a rider actually climbs to reach the columns, not one floating in front of them.
    stair(out, e.a, e.b, 0, Math.max(0.3, spec.esplanade.height), {
      preset: 'esplanade', splay: spec.esplanade.splay ?? 0.12, colour: materialColour(spec.material), anchor: 'top',
    })
  }
}
