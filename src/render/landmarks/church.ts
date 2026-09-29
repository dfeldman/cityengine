/**
 * `church()` — a place of worship said in SLOTS, in a grammar `facade()` structurally cannot express.
 *
 * Why this exists (docs/INSTITUTIONS.md): San Francisco has **187 places of worship; 15 are modelled, 37 are
 * refaced and 135 have nothing at all**, and in the owner's review of ~240 renders churches failed under every
 * rule that touched them — Old Saint Mary's, Saint Agnes, Nuestra Señora de Guadalupe, the Shrine of St Francis,
 * the Chinese Independent Baptist Church — across three different rules. That is not a tuning problem. The rules
 * pick a STYLE, and a church's problem is MASSING.
 *
 * `facade()` is ground / shaft / top / bands / crown: a grammar for a flat-walled masonry box with a repeating
 * middle. **A church has no shaft.** It is a gabled hall with a tower, the tower rarely shares the hall's bay
 * rhythm, and the front is a gable end rather than the long elevation. So this is a separate grammar with the
 * same discipline:
 *
 *  - **No optional keys.** `tower: null` must be written — a decision made while looking at a photograph.
 *  - **Named vocabulary and counts, never free numbers.** `bays`, `stages`, `'steep'`, `'lancet'`. Nobody types
 *    a height, a pitch angle or a spire length; `fit` and the counts decide every dimension.
 *  - **Flat walls.** Everything is extruded from axis-aligned boxes and polygon rings. A genuinely curved plan
 *    (St Mary of the Assumption's four hyperbolic-paraboloid shells) is the FROM-SCRATCH tier, and the kit's job
 *    there is to make that obvious rather than to produce a bad box.
 *
 * **Never apply this by tag.** `amenity=place_of_worship` on a converted shopfront is still a shopfront, and the
 * right answer for it is `facade()` with no church geometry at all. Choosing between `church()`, `facade()` and
 * from-scratch is the same `kit | custom | bail` triage as everywhere else (docs/PIPELINE.md §1), keyed on **what
 * the photograph shows**. docs/KIT.md §"The church kit" has the decision table.
 *
 * **Facing convention.** Everything in this module is drawn FACING +z and placed with a `heading`, the
 * `parts.ts` convention where `heading: 0` faces +z and `edgeAt(ring, i).heading` is an edge's outward facing.
 * Nothing here uses the `−z` convention of `pediment`, `pane`, `archedPane` and `courtFacade`; where one of those
 * is called, the `+ Math.PI` correction is applied at the call site and said so (BUGS.md #101).
 *
 * **Which way the church points.** The nave runs along the LONG axis of the fitted footprint and the front is the
 * NEGATIVE end of it — so a manifest entry should carry `"front": <bearing of the entrance front>` (or
 * `"front": "street"`), which makes the fit's local −z the street face and the long axis z. Without a bearing the
 * kit still picks the long axis, but which END carries the front is then the footprint's guess, not an
 * observation.
 *
 * Local frame: the fitted footprint's, +y up — the same frame as `tower()`, `facade()` and `parts.ts`.
 */
import { MeshBuilder } from '../buildings.ts'
import { box, prism, type Rgb } from '../models.ts'
import { surfaceTag, type Surface } from '../cartoon-material.ts'
import type { Fit } from './fit.ts'
import { faceBand, towerRing, type Face } from './tower.ts'
import { boxAlong, edgeAt, cupola } from './parts.ts'
import { placed, dome, beam, pediment as pedimentImpl } from './kit.ts'
import { materialColour, materialSurface, type Material } from './facade.ts'

type P2 = { x: number; z: number }

const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
const GLASS: Rgb = [0.14, 0.16, 0.22]

/* ================================================================== the slots */

/**
 * The hall itself. `bays` is the count of window bays along ONE flank — the single most countable thing about a
 * church from the pavement. `storeys` is how many LEVELS of window that flank carries (one for most parish
 * churches, two where there is a clerestory over an aisle). `pitch` is a word, not an angle: the kit turns it
 * into a rise from the nave's own width, which is what actually controls how a roof reads.
 *
 * There is no `height` here on purpose. `fit.height` is the **nave ridge** — what OSM's height means on a church
 * when it means anything — and the eaves are solved back from it through `pitch`. A tower goes ABOVE it, because
 * OSM heights on churches essentially never include the spire.
 */
export interface Nave {
  bays: number
  storeys: number
  roof: 'gable' | 'hip' | 'flat'
  pitch: 'low' | 'moderate' | 'steep'
}

/**
 * Side aisles, lower than the nave, under their own lean-to or flat roof. **Presence means both sides**: a
 * one-aisle church is rare enough that it is the custom tier, not a slot value (this is a change from the
 * proposal in INSTITUTIONS.md, which had a `sides: 'both' | 'none'` that could only ever duplicate `null`).
 */
export interface Aisles { roof: 'lean-to' | 'flat' }

/**
 * A transept crossing the nave near its chancel end. **Presence means both arms.** `ends` is what a photograph
 * shows: `'projecting'` stands the arms out beyond the aisles with their own gables, `'flush'` keeps them within
 * the aisle line so the cross reads only in the roof. (INSTITUTIONS.md proposed a free `length`; this is the
 * observation behind it.)
 */
export interface Transept { ends: 'flush' | 'projecting' }

/** The chancel or sanctuary at the far end from the front: a half-octagon apse, or a plain squared end. */
export interface Chancel { kind: 'apse' | 'square' }

/**
 * The tower. `at` is SPATIAL, not liturgical — the proposal's `'west-centre'` is wrong for San Francisco, where
 * Saints Peter and Paul faces south and almost nothing faces east.
 *
 *  - `'front-centre'`  one tower centred on the front, breaking through the gable (Old Saint Mary's);
 *  - `'front-corner'`  one tower at one front corner, the gable beside it;
 *  - `'twin'`          one at each front corner (Saints Peter and Paul, Grace, Guadalupe);
 *  - `'crossing'`      over the crossing of nave and transept;
 *  - `'detached'`      a campanile standing clear beside the front.
 *
 * `stages` is the count of STOREYS the tower is divided into by its string courses — countable from a
 * photograph, and the only size information the kit takes. The stage height comes from the nave's eaves.
 * `top` is what finishes it; `'belfry'` is an OPEN top stage under a low cap, not a spire.
 */
export interface Tower {
  at: 'front-centre' | 'front-corner' | 'twin' | 'crossing' | 'detached'
  stages: number
  plan: 'square' | 'octagon'
  top: 'spire' | 'steeple' | 'belfry' | 'pyramid' | 'dome' | 'lantern' | 'parapet' | 'flat'
}

/**
 * The front — the gable end that faces the street, and the thing a rider actually sees.
 *
 * `kind` is the SHAPE of its head: `'gable'` follows the roof slope; `'pediment'` is the classical triangle with
 * its cornice; `'baroque'` is the curved, shouldered gable of the Spanish-colonial revival (Nuestra Señora de
 * Guadalupe) — added after the photographs, because the proposal had nothing that could say it; `'mission'` is a
 * flat stuccoed parapet with bell niches in it and no roof showing (Mission Dolores); `'plain'` is a squared
 * parapet across the top.
 *
 * `window` gains `'oculus'` (a plain round window) and `'medallion'` (a round window in a moulded surround) for
 * the same reason — Guadalupe's front has a painted medallion where a Gothic church has a rose.
 */
export interface Front {
  kind: 'gable' | 'pediment' | 'baroque' | 'mission' | 'plain'
  portal: 'single' | 'triple' | 'porch' | 'recessed'
  window: 'rose' | 'wheel' | 'oculus' | 'medallion' | 'lancets' | 'none'
  steps: number
}

/** What the walls are made of and what is cut in them. */
export interface Walls {
  material: Material
  openings: 'lancet' | 'round' | 'square' | 'tracery' | 'blank'
  buttresses: 'none' | 'plain' | 'stepped' | 'flying'
}

/** One place of worship, in slots. **Every key is required; any value but `nave`, `front` and `walls` may be null.** */
export interface ChurchSpec {
  nave: Nave
  aisles: Aisles | null
  transept: Transept | null
  chancel: Chancel | null
  tower: Tower | null
  front: Front
  walls: Walls
}

/* ================================================================== the named parts */

/*
 * Every part below is drawn FACING +z and placed by a `heading`, per the module comment. The ones that take an
 * `at: P2` and a `heading` build into their own MeshBuilder at the origin and are turned into place by
 * `placed()`, whose rotation sends local +z to (sin heading, cos heading) — exactly `edgeAt().heading`.
 */

const put = (out: MeshBuilder, part: MeshBuilder, at: P2, heading: number): void => placed(out, part, heading, at.x, at.z)

/*
 * Three helpers that draw IN THE WALL PLANE — the x–y plane of a part that faces +z. `boxAlong` and the rest of
 * parts.ts turn things about the Y axis, which is the wrong axis for anything that follows an arch or a circle:
 * the rose window's first version used `boxAlong` for its spokes and they came out fanned across the pavement
 * instead of across the window (the same class of mistake as BUGS.md #96 and #97, and only a render shows it).
 */

/** A flat bar in the wall plane, its centre at (cx, cy), `a` radians from +x, standing `z` proud. */
function planeBar(out: MeshBuilder, cx: number, cy: number, z: number, hl: number, ht: number, a: number, c: Rgb): void {
  const ca = Math.cos(a)
  const sa = Math.sin(a)
  const p = (u: number, v: number): [number, number, number] => [cx + u * ca - v * sa, cy + u * sa + v * ca, z]
  out.quad([p(-hl, -ht), p(hl, -ht), p(hl, ht), p(-hl, ht)], [0, 0, 1], UV, c, 0)
}

/** A flat annulus in the wall plane between radii r0 and r1: a window's rim, a wheel's inner ring. */
function planeRing(out: MeshBuilder, cx: number, cy: number, z: number, r0: number, r1: number, n: number, c: Rgb): void {
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2
    const a1 = ((i + 1) / n) * Math.PI * 2
    const p = (a: number, r: number): [number, number, number] => [cx + Math.cos(a) * r, cy + Math.sin(a) * r, z]
    out.quad([p(a0, r0), p(a1, r0), p(a1, r1), p(a1, r1)], [0, 0, 1], UV, c, 0)
    out.quad([p(a0, r0), p(a1, r1), p(a0, r1), p(a0, r1)], [0, 0, 1], UV, c, 0)
  }
}

/**
 * The filled silhouette of an opening — a rectangle under a pointed, round or square head — centred on `cx`,
 * standing on `cy`, at depth `z`, facing +z. The shape every window, portal and niche in this module is cut to.
 */
function archFill(out: MeshBuilder, cx: number, cy: number, z: number, w: number, h: number,
                  head: 'pointed' | 'round' | 'square', c: Rgb): void {
  const spring = head === 'square' ? h : Math.max(h * 0.45, h - (head === 'pointed' ? w * 0.85 : w / 2))
  out.quad([[cx - w / 2, cy, z], [cx + w / 2, cy, z], [cx + w / 2, cy + spring, z], [cx - w / 2, cy + spring, z]],
    [0, 0, 1], UV, c, 0)
  if (head === 'pointed') {
    out.quad([[cx - w / 2, cy + spring, z], [cx + w / 2, cy + spring, z], [cx, cy + h, z], [cx, cy + h, z]], [0, 0, 1], UV, c, 0)
  } else if (head === 'round') {
    const n = 8
    const ry = h - spring
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI
      const a1 = ((i + 1) / n) * Math.PI
      out.quad([[cx, cy + spring, z], [cx + Math.cos(a1) * w / 2, cy + spring + Math.sin(a1) * ry, z],
        [cx + Math.cos(a0) * w / 2, cy + spring + Math.sin(a0) * ry, z], [cx, cy + spring, z]], [0, 0, 1], UV, c, 0)
    }
  }
  return
}

/** The MOULDED EDGE of that silhouette: jambs up to the springing, then bars following the head. Facing +z. */
function archOutline(out: MeshBuilder, cx: number, cy: number, z: number, w: number, h: number,
                     head: 'pointed' | 'round' | 'square', t: number, c: Rgb): void {
  const spring = head === 'square' ? h : Math.max(h * 0.45, h - (head === 'pointed' ? w * 0.85 : w / 2))
  for (const s of [-1, 1]) {
    out.quad([[cx + s * (w / 2) - t / 2, cy, z], [cx + s * (w / 2) + t / 2, cy, z],
      [cx + s * (w / 2) + t / 2, cy + spring, z], [cx + s * (w / 2) - t / 2, cy + spring, z]], [0, 0, 1], UV, c, 0)
  }
  if (head === 'square') {
    planeBar(out, cx, cy + h, z, w / 2 + t, t / 2, 0, c)
    return
  }
  if (head === 'pointed') {
    const L = Math.hypot(w / 2, h - spring)
    for (const s of [-1, 1]) {
      const a = Math.atan2(h - spring, -s * (w / 2))
      planeBar(out, cx + s * (w / 4), cy + (spring + h) / 2, z, L / 2, t / 2, a, c)
    }
    return
  }
  const ry = h - spring
  const n = 10
  for (let i = 0; i < n; i++) {
    const a = ((i + 0.5) / n) * Math.PI
    const px = cx + Math.cos(a) * (w / 2)
    const py = cy + spring + Math.sin(a) * ry
    planeBar(out, px, py, z, (Math.PI * (w / 2)) / n / 2 + t * 0.3, t / 2, a - Math.PI / 2, c)
  }
}

/**
 * A pitched roof over the box (x0..x1) × (z0..z1), eaves at `y`, ridge `rise` above them running along **z**
 * (the nave's axis). `hip` pulls the ridge in from both ends instead of leaving open gables. Drawn facing +z in
 * the sense that it is axis-aligned in the canonical frame and rotated with everything else.
 */
export function gableRoof(out: MeshBuilder, x0: number, x1: number, z0: number, z1: number, y: number, rise: number,
                          colour: Rgb, material: Surface = 'tile', hip = false): void {
  const tag = surfaceTag(material)
  const xm = (x0 + x1) / 2
  const hz = hip ? Math.min((z1 - z0) / 3, (x1 - x0) / 2) : 0
  const r0: [number, number, number] = [xm, y + rise, z0 + hz]
  const r1: [number, number, number] = [xm, y + rise, z1 - hz]
  const slope = Math.max(0.2, (x1 - x0) / 2)
  for (const s of [-1, 1]) {
    const xe = s < 0 ? x0 : x1
    out.quad([[xe, y, z0], [xe, y, z1], [r1[0], r1[1], r1[2]], [r0[0], r0[1], r0[2]]],
      s < 0 ? [-rise, slope, 0] : [rise, slope, 0], UV, colour, tag)
    if (s > 0) continue
    // the two slopes wound the other way round, so both faces are correct whichever side the camera is on
    out.quad([[x1, y, z1], [x1, y, z0], [r0[0], r0[1], r0[2]], [r1[0], r1[1], r1[2]]], [rise, slope, 0], UV, colour, tag)
  }
  if (!hip) return
  for (const [ze, rp, n] of [[z0, r0, -1], [z1, r1, 1]] as [number, [number, number, number], number][]) {
    out.quad(n < 0 ? [[x0, y, ze], [x1, y, ze], [rp[0], rp[1], rp[2]], [rp[0], rp[1], rp[2]]]
      : [[x1, y, ze], [x0, y, ze], [rp[0], rp[1], rp[2]], [rp[0], rp[1], rp[2]]], [0, slope, n * rise], UV, colour, tag)
  }
}

/**
 * The triangular wall that closes a gable roof at one end: `w` half-width, standing on `y`, `rise` tall, drawn
 * facing +z and turned onto `heading`. `overhang` puts a raking eaves board along both slopes, which is what
 * makes a gable read as a roof edge rather than a painted triangle.
 */
export function gableEnd(out: MeshBuilder, at: P2, heading: number, w: number, y: number, rise: number,
                         colour: Rgb, material: Surface = 'ashlar', trim?: Rgb): void {
  const part = new MeshBuilder()
  const tag = surfaceTag(material)
  const d = 0.35
  for (const [z, n] of [[d / 2, 1], [-d / 2, -1]] as [number, number][]) {
    part.quad(n > 0 ? [[-w, y, z], [w, y, z], [0, y + rise, z], [0, y + rise, z]]
      : [[w, y, z], [-w, y, z], [0, y + rise, z], [0, y + rise, z]], [0, 0, n], UV, colour, tag)
  }
  if (trim) {
    const L = Math.hypot(w, rise)
    for (const s of [-1, 1]) {
      part.quad([[s * w, y, d / 2 + 0.02], [0, y + rise, d / 2 + 0.02], [0, y + rise + (w / L) * 0.5, d / 2 + 0.02],
        [s * w, y + (w / L) * 0.5, d / 2 + 0.02]], [0, 0, 1], UV, trim, tag)
    }
  }
  put(out, part, at, heading)
}

/** A cross on a ridge, a gable apex or a tower: two crossed slabs, so it reads from any side. */
export function crossFinial(out: MeshBuilder, at: P2, y: number, h: number, colour: Rgb): void {
  const t = Math.max(0.07, h * 0.075)
  const arm = h * 0.3
  box(out, at.x, y + h / 2, at.z, t, h / 2, t / 2, colour, 0)
  box(out, at.x, y + h / 2, at.z, t / 2, h / 2, t, colour, 0)
  box(out, at.x, y + h * 0.7, at.z, arm, t, t / 2, colour, 0)
  box(out, at.x, y + h * 0.7, at.z, t / 2, t, arm, colour, 0)
}

/**
 * A rose window: a dark round opening, a moulded rim, and `spokes` radial bars — the one detail that says
 * "church" at two hundred metres. Drawn facing +z and turned onto `heading`. `wheel: true` adds a second,
 * outer ring of bars; `surround` puts a square moulded frame round it (a medallion).
 */
export function roseWindow(out: MeshBuilder, at: P2, heading: number, cy: number, r: number, stone: Rgb,
                           opts: { spokes?: number; wheel?: boolean; surround?: boolean; glass?: Rgb } = {}): void {
  const part = new MeshBuilder()
  const g = opts.glass ?? GLASS
  const n = 20
  // the opening: a fan of triangles in the wall plane
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2
    const a1 = ((i + 1) / n) * Math.PI * 2
    part.quad([[0, cy, 0.02], [Math.cos(a0) * r, cy + Math.sin(a0) * r, 0.02],
      [Math.cos(a1) * r, cy + Math.sin(a1) * r, 0.02], [0, cy, 0.02]], [0, 0, 1], UV, g, 0)
  }
  const t = r * 0.11
  planeRing(part, 0, cy, 0.16, r, r + t, n, stone)          // the rim
  const spokes = Math.max(2, opts.spokes ?? 8)
  for (let i = 0; i < spokes; i++) planeBar(part, 0, cy, 0.1, r, r * 0.045, (i / spokes) * Math.PI, stone)
  planeRing(part, 0, cy, 0.12, 0, r * 0.13, 10, stone)      // the hub
  if (opts.wheel) planeRing(part, 0, cy, 0.12, r * 0.5, r * 0.58, n, stone)
  if (opts.surround) {
    const sq = r * 1.4
    for (const [dx, dy, hx, hy] of [[0, sq, sq, t], [0, -sq, sq, t], [-sq, 0, t, sq], [sq, 0, t, sq]]) {
      box(part, dx, cy + dy, 0.1, hx, hy, 0.16, stone, 0)
    }
  }
  put(out, part, at, heading)
}

/**
 * One window: a dark opening in a moulded surround, with a pointed (lancet), round or square head. Drawn facing
 * +z and turned onto `heading`. This is the +z counterpart of `kit.ts`'s `pointedPane`/`archedPane`, which draw
 * on −z and must not be used here.
 */
export function lancet(out: MeshBuilder, at: P2, heading: number, y0: number, w: number, h: number,
                       head: 'pointed' | 'round' | 'square', stone: Rgb, glass: Rgb = GLASS): void {
  const part = new MeshBuilder()
  archFill(part, 0, y0, 0.02, w, h, head, glass)
  archOutline(part, 0, y0, 0.11, w, h, head, Math.max(0.16, w * 0.16), stone)
  // the sill, which is what stops a window reading as a hole punched in a sheet
  box(part, 0, y0 - 0.07, 0.12, w / 2 + w * 0.2, 0.1, 0.2, stone, 0)
  put(out, part, at, heading)
}

/** `n` evenly spaced `lancet`s along the edge from `a` to `b`, one per bay, facing that edge's way out. */
export function lancetRow(out: MeshBuilder, a: P2, b: P2, y0: number, w: number, h: number, n: number,
                          head: 'pointed' | 'round' | 'square', stone: Rgb, glass: Rgb = GLASS): void {
  const L = Math.hypot(b.x - a.x, b.z - a.z) || 1
  const tx = (b.x - a.x) / L
  const tz = (b.z - a.z) / L
  const heading = Math.atan2(tz, -tx)
  for (let i = 0; i < n; i++) {
    const u = ((i + 0.5) / n) * L
    lancet(out, { x: a.x + tx * u + tz * 0.06, z: a.z + tz * u - tx * 0.06 }, heading, y0, w, h, head, stone, glass)
  }
}

/**
 * A buttress against a wall: a pier standing `d` proud, `w` wide, from `y0` up `h`, with a weathered (sloping)
 * cap. `'stepped'` narrows it once on the way up, which is what a big church's buttress actually does. Drawn
 * facing +z and turned onto `heading`.
 */
export function buttress(out: MeshBuilder, at: P2, heading: number, y0: number, h: number, w: number, d: number,
                         kind: 'plain' | 'stepped', colour: Rgb, material: Surface = 'ashlar'): void {
  const part = new MeshBuilder()
  const tag = surfaceTag(material)
  const stages: [number, number, number][] = kind === 'stepped'
    ? [[y0, y0 + h * 0.62, d], [y0 + h * 0.62, y0 + h, d * 0.6]]
    : [[y0, y0 + h, d]]
  for (const [a, b, dd] of stages) {
    box(part, 0, (a + b) / 2, dd / 2, w / 2, (b - a) / 2, dd / 2, colour, tag)
    // the weathering: a wedge sloping back to the wall
    const cap = Math.min(0.8, dd * 0.6)
    part.quad([[-w / 2, b, dd], [w / 2, b, dd], [w / 2, b + cap, 0], [-w / 2, b + cap, 0]], [0, 0.8, 0.6], UV, colour, tag)
    part.quad([[w / 2, b, dd], [w / 2, b, 0], [w / 2, b + cap, 0], [w / 2, b + cap, 0]], [1, 0, 0], UV, colour, tag)
    part.quad([[-w / 2, b, 0], [-w / 2, b, dd], [-w / 2, b + cap, 0], [-w / 2, b + cap, 0]], [-1, 0, 0], UV, colour, tag)
  }
  put(out, part, at, heading)
}

/** A flying buttress: a pier out from the wall and a sloping arch bar from its head up to the nave wall. */
export function flyingButtress(out: MeshBuilder, at: P2, heading: number, y0: number, pierTop: number, reach: number,
                               to: number, w: number, colour: Rgb, material: Surface = 'ashlar'): void {
  const part = new MeshBuilder()
  const tag = surfaceTag(material)
  box(part, 0, (y0 + pierTop) / 2, reach, w / 2, (pierTop - y0) / 2, w / 2, colour, tag)
  prism(part, 0, reach, pierTop, pierTop + w * 2.2, w * 0.8, 4, colour, tag, 0.02)
  beam(part, [0, pierTop, reach], [0, to, w * 0.4], w * 0.42, colour, w * 0.42)
  put(out, part, at, heading)
}

/**
 * The way in: a recessed arch in a moulded surround, on steps. `kind` is the head shape; `orders` is how many
 * receding rings of moulding the arch has, which is what makes a Gothic portal read as deep. Drawn facing +z.
 */
export function portal(out: MeshBuilder, at: P2, heading: number, w: number, h: number,
                       kind: 'pointed' | 'round' | 'square', stone: Rgb, opts: { orders?: number; steps?: number } = {}): void {
  const part = new MeshBuilder()
  const orders = Math.max(1, opts.orders ?? 3)
  const dark: Rgb = [0.09, 0.09, 0.11]
  const door: Rgb = [0.2, 0.13, 0.09]
  /*
   * A portal is built FORWARD of the wall, not into it. The first version put the dark void and the receding
   * mouldings at negative z — geometrically a recess, and completely invisible, because the church kit's walls
   * are solid `faceBand` and cannot be holed: the wall simply covered the whole thing and the render showed a
   * blank elevation with a flight of steps under it (the #96 failure exactly). So: the void sits just proud of
   * the wall, and each order of moulding is LARGER and stands FURTHER OUT than the one inside it, which is what
   * a stepped archivolt looks like from the pavement anyway.
   */
  archFill(part, 0, 0, 0.03, w * 0.86, h * 0.94, kind, dark)
  archFill(part, 0, 0, 0.05, w * 0.62, h * 0.66, kind, door)
  for (let k = 0; k < orders; k++) {
    const f = 1 + k * 0.12
    const c: Rgb = [stone[0] * (1 - k * 0.04), stone[1] * (1 - k * 0.04), stone[2] * (1 - k * 0.04)]
    archOutline(part, 0, 0, 0.07 + k * 0.1, w * f, h * (1 + k * 0.05), kind, Math.max(0.2, w * 0.1), c)
  }
  // the hood: a squared label over the whole thing, which is what a portal reads as at distance
  // centred at z = 0.36 with a 0.34 half-depth, so the hood too stays entirely PROUD of the wall
  box(part, 0, h * (1 + (orders - 1) * 0.05) + 0.34, 0.36, w * (1 + (orders - 1) * 0.12) / 2 + 0.3, 0.22, 0.34, stone, 0)
  put(out, part, at, heading)
  if (opts.steps) {
    const nx = Math.sin(heading)
    const nz = Math.cos(heading)
    for (let k = 0; k < opts.steps; k++) {
      const o = (opts.steps - k) * 0.34
      boxAlong(out, at.x + nx * (o - 0.17), (k + 0.5) * 0.08, at.z + nz * (o - 0.17),
        w / 2 + 0.6 + (opts.steps - k) * 0.12, (k + 1) * 0.08, 0.17, heading, stone, 0)
    }
  }
}

/** A bell niche: a round-headed recess with a bell in it, in a mission front's parapet. Drawn facing +z. */
export function bellNiche(out: MeshBuilder, at: P2, heading: number, cy: number, w: number, h: number, stone: Rgb): void {
  const part = new MeshBuilder()
  archFill(part, 0, cy, 0.02, w, h, 'round', [0.1, 0.1, 0.12])
  archOutline(part, 0, cy, 0.11, w, h, 'round', Math.max(0.16, w * 0.14), stone)
  prism(part, 0, 0.14, cy + h * 0.32, cy + h * 0.66, w * 0.3, 8, [0.36, 0.3, 0.16], 0, w * 0.15)
  put(out, part, at, heading)
}

/**
 * A curved, shouldered gable — the Spanish-colonial revival front (Nuestra Señora de Guadalupe) and, without a
 * roof behind it, the mission `espadaña`. Built as a stack of flat courses whose width follows a cosine, so the
 * wall stays flat in every facet. Drawn facing +z and turned onto `heading`.
 */
export function curvedGable(out: MeshBuilder, at: P2, heading: number, w: number, y: number, rise: number,
                            colour: Rgb, material: Surface = 'stucco', shoulders = true): void {
  const part = new MeshBuilder()
  const tag = surfaceTag(material)
  const n = 9
  for (let i = 0; i < n; i++) {
    const t0i = i / n
    const t1i = (i + 1) / n
    // a shouldered ogee: wide and flat at the base, drawn in fast at the top
    const wid = (t: number): number => w * (shoulders ? Math.cos(t * Math.PI * 0.5) ** 0.7 : 1 - t)
    const y0 = y + rise * t0i
    const y1 = y + rise * t1i
    const w0 = wid(t0i)
    const w1 = wid(t1i)
    for (const [z, nz] of [[0.18, 1], [-0.18, -1]] as [number, number][]) {
      part.quad(nz > 0 ? [[-w0, y0, z], [w0, y0, z], [w1, y1, z], [-w1, y1, z]]
        : [[w0, y0, z], [-w0, y0, z], [-w1, y1, z], [w1, y1, z]], [0, 0, nz], UV, colour, tag)
    }
    // the raking cornice down each side of the curve
    for (const s of [-1, 1]) {
      part.quad([[s * w0, y0, 0.2], [s * w1, y1, 0.2], [s * w1 + s * 0.45, y1, 0.2], [s * w0 + s * 0.45, y0, 0.2]],
        [s, 0.3, 0], UV, colour, tag)
      part.quad([[s * w0 + s * 0.45, y0, 0.2], [s * w1 + s * 0.45, y1, 0.2], [s * w1 + s * 0.45, y1, -0.2], [s * w0 + s * 0.45, y0, -0.2]],
        [s, 0, 0], UV, colour, tag)
    }
  }
  put(out, part, at, heading)
}

/**
 * A tapering spire on a point, `sides` faces, with an optional ring of corner pinnacles at its foot — the thing
 * that makes a Gothic steeple read as openwork rather than as a cone. Axis-symmetric, so no heading.
 */
export function spire(out: MeshBuilder, at: P2, y0: number, r: number, h: number, sides: number, colour: Rgb,
                      material: Surface = 'tile', pinnacles = 0): void {
  const tag = surfaceTag(material)
  prism(out, at.x, at.z, y0, y0 + h, r, sides, colour, tag, 0.02)
  for (let i = 0; i < pinnacles; i++) {
    const a = ((i + 0.5) / pinnacles) * Math.PI * 2
    const px = at.x + Math.sin(a) * r * 0.95
    const pz = at.z + Math.cos(a) * r * 0.95
    box(out, px, y0 + h * 0.1, pz, r * 0.14, h * 0.1, r * 0.14, colour, tag)
    prism(out, px, pz, y0 + h * 0.2, y0 + h * 0.46, r * 0.18, 4, colour, tag, 0.02)
  }
}

/**
 * A tower standing on ONE point: `stages` storeys of wall divided by string courses, an open belfry stage where
 * the top asks for one, and the finish on top. This is the church kit's own tower — `parts.ts`'s `spireOn` can
 * only do shaft-plus-spire, and `tower()`'s `spire` crown covers a whole footprint.
 *
 * Every dimension is `r` (the shaft's half-width) and `stageH` times the counts. Drawn facing +z per face.
 */
export function churchTower(out: MeshBuilder, at: P2, y0: number, r: number, stages: number, stageH: number,
                            top: Tower['top'], plan: 'square' | 'octagon',
                            o: { wall: Rgb; material: Surface; roof: Rgb; roofMaterial: Surface; trim: Rgb }): void {
  const sides = plan === 'octagon' ? 8 : 4
  const ring = (rr: number, y: number): P2[] => Array.from({ length: sides }, (_, k) => {
    const a = ((k + 0.5) / sides) * Math.PI * 2
    return { x: at.x + Math.cos(a) * rr, z: at.z + Math.sin(a) * rr }
  }).map((p) => ({ ...p, y }))
  const n = Math.max(2, Math.round(stages))
  const openTop = top === 'belfry' || top === 'steeple' || top === 'lantern'
  const shaft = n * stageH
  const walled = openTop ? n - 1 : n
  const wallRing = ring(r, 0)
  faceBand(out, wallRing, y0, y0 + walled * stageH, { kind: 'blank', wall: o.wall, material: o.material })
  // the string courses that make the stages countable, and a pair of tall openings in each upper stage
  for (let k = 1; k <= walled; k++) {
    const y = y0 + k * stageH
    faceBand(out, ring(r + 0.16, 0), y - 0.35, y, { kind: 'blank', wall: o.trim, material: o.material })
    if (k < 2) continue
    for (let i = 0; i < sides; i++) {
      const e = edgeAt(wallRing, i)
      lancet(out, { x: e.mid.x + e.nx * 0.05, z: e.mid.z + e.nz * 0.05 }, e.heading, y - stageH * 0.8,
        Math.min(e.L * 0.34, r * 0.5), stageH * 0.58, plan === 'octagon' ? 'round' : 'pointed', o.trim)
    }
  }
  let y = y0 + walled * stageH
  if (openTop) {
    // the belfry: an OPEN stage — corner piers carrying a cap, with the dark of the bell chamber behind them
    const pier = r * 0.3
    for (let i = 0; i < sides; i++) {
      const a = (i / sides) * Math.PI * 2
      box(out, at.x + Math.sin(a) * (r - pier * 0.5), y + stageH / 2, at.z + Math.cos(a) * (r - pier * 0.5),
        pier, stageH / 2, pier, o.wall, surfaceTag(o.material))
    }
    faceBand(out, ring(r * 0.72, 0), y, y + stageH, { kind: 'blank', wall: [0.1, 0.1, 0.12], material: 'concrete' })
    faceBand(out, ring(r + 0.22, 0), y + stageH - 0.4, y + stageH, { kind: 'blank', wall: o.trim, material: o.material })
    y += stageH
  }
  switch (top) {
    case 'spire':
      spire(out, at, y, r * 1.02, shaft * 0.9, sides === 4 ? 8 : 8, o.roof, o.roofMaterial, sides)
      crossFinial(out, at, y + shaft * 0.9, r * 0.9, o.trim)
      break
    case 'steeple':
      spire(out, at, y, r * 0.98, shaft * 0.8, 8, o.roof, o.roofMaterial, sides)
      crossFinial(out, at, y + shaft * 0.8, r * 0.9, o.trim)
      break
    case 'belfry':
      prism(out, at.x, at.z, y, y + r * 0.9, r * 1.06, sides, o.roof, surfaceTag(o.roofMaterial), 0.02)
      crossFinial(out, at, y + r * 0.9, r * 0.7, o.trim)
      break
    case 'pyramid':
      prism(out, at.x, at.z, y, y + r * 2.2, r * 1.04, sides, o.roof, surfaceTag(o.roofMaterial), 0.02)
      break
    case 'dome':
      dome(out, at.x, at.z, y, r * 1.05, r * 1.25, o.roof, 12)
      crossFinial(out, at, y + r * 1.25, r * 0.7, o.trim)
      break
    case 'lantern':
      // a little open cupola on the tower's head: the Spanish-colonial finish (Guadalupe's two)
      cupola(out, at, y, r * 0.62, { drum: r * 0.9, dome: r * 0.6, colour: o.wall, domeColour: o.roof, material: o.material, lantern: false })
      crossFinial(out, at, y + r * 1.5, r * 0.8, o.trim)
      break
    case 'parapet': {
      faceBand(out, ring(r + 0.2, 0), y, y + r * 0.7, { kind: 'blank', wall: o.wall, material: o.material })
      for (let i = 0; i < sides; i++) {
        const a = ((i + 0.5) / sides) * Math.PI * 2
        const px = at.x + Math.cos(a) * r * 1.02
        const pz = at.z + Math.sin(a) * r * 1.02
        box(out, px, y + r * 0.45, pz, r * 0.16, r * 0.45, r * 0.16, o.wall, surfaceTag(o.material))
        prism(out, px, pz, y + r * 0.9, y + r * 1.5, r * 0.2, 4, o.wall, surfaceTag(o.material), 0.02)
      }
      break
    }
    case 'flat':
      break
  }
}

/**
 * A half-octagon apse off the end of the nave: flat facets, a tall window in each, and a conical roof — the one
 * shape in this kit that looks round and is not. `heading` is the way it faces OUT from the building.
 */
export function apse(out: MeshBuilder, at: P2, heading: number, r: number, y0: number, h: number,
                     wall: Rgb, material: Surface, roof: Rgb, roofMaterial: Surface, openings: 'lancet' | 'round' | 'square' | 'tracery' | 'blank'): void {
  const facets = 5
  const ring: P2[] = []
  for (let k = 0; k <= facets; k++) {
    const a = -Math.PI / 2 + (k / facets) * Math.PI
    ring.push({ x: Math.cos(a) * r, z: Math.sin(a) * r })
  }
  const part = new MeshBuilder()
  const closed = [...ring, { x: ring[ring.length - 1].x, z: -0.2 }, { x: ring[0].x, z: -0.2 }]
  faceBand(part, closed, y0, y0 + h, { kind: 'blank', wall, material })
  if (openings !== 'blank') {
    const head = openings === 'square' ? 'square' : openings === 'round' ? 'round' : 'pointed'
    for (let i = 0; i < facets; i++) {
      const e = edgeAt(ring, i)
      lancet(part, { x: e.mid.x + e.nx * 0.05, z: e.mid.z + e.nz * 0.05 }, e.heading, y0 + h * 0.22,
        Math.min(e.L * 0.45, r * 0.42), h * 0.55, head, wall)
    }
  }
  // the conical roof: the facets drawn up to a point a little in from the wall head
  for (let i = 0; i < facets; i++) {
    const a = ring[i]
    const b = ring[i + 1]
    part.quad([[a.x, y0 + h, a.z], [b.x, y0 + h, b.z], [0, y0 + h + r * 0.75, 0], [0, y0 + h + r * 0.75, 0]],
      [(a.x + b.x) / 2, r * 0.6, (a.z + b.z) / 2], UV, roof, surfaceTag(roofMaterial))
  }
  put(out, part, at, heading)
}

/**
 * A tiered pagoda roof, for a Chinese temple. **This is not part of `church()`** — see the module comment and
 * docs/KIT.md: a San Francisco Chinese temple is usually the upper floors of an ordinary street building, so it
 * is `facade()` with this placed on top by hand, not a free-standing hall. `tiers` is the count of eaves lines.
 * Each tier is a flat-facetted flare, so no wall is curved.
 */
export function pagodaRoof(out: MeshBuilder, ring: P2[], y: number, tiers: number, colour: Rgb, wall: Rgb,
                           material: Surface = 'tile'): void {
  const tag = surfaceTag(material)
  const n = Math.max(1, Math.round(tiers))
  let yy = y
  for (let k = 0; k < n; k++) {
    const shrink = 1 - (k / n) * 0.42
    const eaveOut = 1.1 * shrink
    const rise = 1.5 * shrink
    const scaleRing = (f: number, o: number): P2[] => ring.map((p) => ({ x: p.x * f + Math.sign(p.x) * o, z: p.z * f + Math.sign(p.z) * o }))
    const lo = scaleRing(shrink, eaveOut)
    const hi = scaleRing(shrink * 0.72, 0)
    for (let i = 0; i < lo.length; i++) {
      const j = (i + 1) % lo.length
      // the upturned eave: a short drop, then the slope up to the ridge line
      out.quad([[lo[i].x, yy, lo[i].z], [lo[j].x, yy, lo[j].z], [lo[j].x, yy - 0.35, lo[j].z], [lo[i].x, yy - 0.35, lo[i].z]],
        [lo[i].x, -0.3, lo[i].z], UV, colour, tag)
      out.quad([[lo[i].x, yy, lo[i].z], [lo[j].x, yy, lo[j].z], [hi[j].x, yy + rise, hi[j].z], [hi[i].x, yy + rise, hi[i].z]],
        [lo[i].x, 1, lo[i].z], UV, colour, tag)
    }
    yy += rise
    if (k < n - 1) {
      // the recessed storey between two tiers, which is what a tiered roof actually stands on
      faceBand(out, scaleRing(shrink * 0.72, 0), yy, yy + 1.6, { kind: 'blank', wall, material: 'stucco' })
      yy += 1.6
    }
  }
}

/* ================================================================== the call itself */

const boxRing = (x0: number, x1: number, z0: number, z1: number): P2[] =>
  [{ x: x0, z: z0 }, { x: x1, z: z0 }, { x: x1, z: z1 }, { x: x0, z: z1 }]

/** the roof rise a pitch WORD means, as a multiple of the roofed span's half-width */
const PITCH: Record<Nave['pitch'], number> = { low: 0.42, moderate: 0.8, steep: 1.25 }

/** the flank wall a named opening set means */
function wallFace(openings: Walls['openings'], wall: Rgb, material: Surface, storeyH: number): Face {
  if (openings === 'square') {
    return { kind: 'punched', wall, glass: GLASS, floor: storeyH, pitch: 3.4, solid: 0.6, material }
  }
  // lancet, round, tracery and blank all stand on a BLANK wall: their openings are drawn as parts, because a
  // pointed head is not something `Face` can cut
  return { kind: 'blank', wall, material }
}

/**
 * Raise a place of worship from its fitted footprint, said in slots.
 *
 * The nave runs along the LONG axis of the fit and the front is its negative end (see the module comment: give
 * the manifest entry a `front` bearing). Everything is built in that canonical frame and turned into place, so
 * a church whose long axis is local x comes out the same as one whose long axis is local z.
 *
 * Throws when `nave.bays` is less than one: a hall with no bays is a slip, not a decision, and a silent shed is
 * exactly what this API exists to prevent.
 */
export function church(out: MeshBuilder, fit: Fit, spec: ChurchSpec): void {
  if (!(spec.nave.bays >= 1)) {
    throw new Error('church(): nave.bays must be at least 1 — count the window bays along one flank')
  }
  const ring = towerRing(fit)
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
  for (const p of ring) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z) }
  const ex = x1 - x0
  const ez = z1 - z0
  const alongZ = ez >= ex
  const L = Math.max(6, alongZ ? ez : ex)
  const W = Math.max(5, alongZ ? ex : ez)
  const cx = (x0 + x1) / 2
  const cz = (z0 + z1) / 2

  /*
   * The canonical church is built with its front at −z (see `build`), and then turned half a turn, because a
   * CITY builder's front faces local **+z**: `render/landmarks.ts` rotates a fitted model by `bearing + 180°`,
   * and the two comments that said −z were both checked empirically and corrected on 2026-09-22 (see the note
   * in tools/model-shots.ts). Built without this half turn, Old Saint Mary's presented its chancel wall to
   * California Street and its portal to the car park behind — the shot tools' `front` view showed the back.
   */
  const q = new MeshBuilder()
  build(q, L, W, fit.height > 4 ? fit.height : 14, spec)
  placed(out, q, alongZ ? Math.PI : -Math.PI / 2, cx, cz)
}

/** the canonical church: nave along z, front at z = −L/2, centred on the origin */
function build(out: MeshBuilder, L: number, W: number, H: number, spec: ChurchSpec): void {
  const { nave, aisles, transept, chancel, tower, front, walls } = spec
  const wall = materialColour(walls.material)
  const surf = materialSurface(walls.material)
  const trim: Rgb = [Math.min(1, wall[0] * 1.1 + 0.05), Math.min(1, wall[1] * 1.1 + 0.05), Math.min(1, wall[2] * 1.1 + 0.05)]
  const roofC: Rgb = walls.material === 'stucco' ? [0.45, 0.28, 0.2] : [0.34, 0.36, 0.4]
  const roofM: Surface = walls.material === 'stucco' ? 'tile' : 'tile'

  /* ---- the plan, in metres, all of it from L, W and the counts */
  const naveHalf = aisles ? W * 0.29 : W * 0.5
  const aisleHalf = W * 0.5
  const chancelLen = chancel ? Math.min(L * 0.2, W * 0.9) : 0
  const zFront = -L / 2
  const zBack = L / 2 - chancelLen
  const bodyLen = zBack - zFront

  /* ---- the heights, solved back from fit.height as the nave RIDGE */
  const rise = nave.roof === 'flat' ? 0 : naveHalf * PITCH[nave.pitch]
  const eaves = Math.max(H * 0.5, H - rise)
  const aisleEaves = Math.max(3, eaves * 0.52)
  const storeyH = eaves / Math.max(1, nave.storeys)

  /* ---- the nave walls */
  faceBand(out, boxRing(-naveHalf, naveHalf, zFront, zBack), 0, eaves, wallFace(walls.openings, wall, surf, storeyH))
  if (aisles) {
    faceBand(out, boxRing(-aisleHalf, aisleHalf, zFront, zBack), 0, aisleEaves, wallFace(walls.openings, wall, surf, storeyH))
  }

  /* ---- the roofs */
  if (nave.roof !== 'flat') {
    gableRoof(out, -naveHalf - 0.3, naveHalf + 0.3, zFront - 0.3, zBack + 0.3, eaves, rise, roofC, roofM, nave.roof === 'hip')
  } else {
    faceBand(out, boxRing(-naveHalf - 0.3, naveHalf + 0.3, zFront, zBack), eaves, eaves + 0.9, { kind: 'blank', wall: trim, material: surf })
  }
  capBox(out, -naveHalf, naveHalf, zFront, zBack, nave.roof === 'flat' ? eaves + 0.9 : eaves, roofC, roofM)
  if (aisles) {
    if (aisles.roof === 'lean-to') {
      for (const s of [-1, 1]) {
        const xi = s * naveHalf
        const xo = s * aisleHalf
        out.quad(s > 0 ? [[xo, aisleEaves, zFront], [xo, aisleEaves, zBack], [xi, aisleEaves + 1.6, zBack], [xi, aisleEaves + 1.6, zFront]]
          : [[xi, aisleEaves + 1.6, zFront], [xi, aisleEaves + 1.6, zBack], [xo, aisleEaves, zBack], [xo, aisleEaves, zFront]],
        [s * 0.5, 0.86, 0], UV, roofC, surfaceTag(roofM))
      }
    } else {
      for (const s of [-1, 1]) {
        capBox(out, Math.min(s * naveHalf, s * aisleHalf), Math.max(s * naveHalf, s * aisleHalf), zFront, zBack, aisleEaves, roofC, roofM)
      }
    }
  }

  /* ---- the flank windows, one per bay */
  const head: 'pointed' | 'round' | 'square' =
    walls.openings === 'round' ? 'round' : walls.openings === 'square' ? 'square' : 'pointed'
  if (walls.openings !== 'blank' && walls.openings !== 'square') {
    const outerHalf = aisles ? aisleHalf : naveHalf
    const low = aisles ? aisleEaves : eaves
    const ww = Math.min((bodyLen / nave.bays) * 0.42, low * 0.34, walls.openings === 'tracery' ? 99 : 2.4)
    for (const s of [-1, 1]) {
      const a = { x: s * outerHalf, z: s > 0 ? zFront : zBack }
      const b = { x: s * outerHalf, z: s > 0 ? zBack : zFront }
      lancetRow(out, a, b, low * 0.22, ww, low * 0.55, nave.bays, head, trim)
      // the clerestory: a second row up on the nave wall, above the aisle roof
      if (nave.storeys > 1 || aisles) {
        const ca = { x: s * naveHalf, z: s > 0 ? zFront : zBack }
        const cb = { x: s * naveHalf, z: s > 0 ? zBack : zFront }
        const cy = aisles ? aisleEaves + 2.4 : eaves * 0.58
        lancetRow(out, ca, cb, cy, ww * 0.8, Math.max(1.4, (eaves - cy) * 0.6), nave.bays, head, trim)
      }
    }
  }

  /* ---- the buttresses, on the bay divisions */
  if (walls.buttresses !== 'none') {
    const outerHalf = aisles ? aisleHalf : naveHalf
    const low = aisles ? aisleEaves : eaves
    const bw = Math.min(1.5, W * 0.09)
    const bd = Math.min(1.4, W * 0.08)
    for (const s of [-1, 1]) {
      const heading = s > 0 ? Math.PI / 2 : -Math.PI / 2
      // the INTERNAL bay divisions: a buttress on the front corner fights the tower and the gable
      for (let k = 1; k < nave.bays; k++) {
        const z = zFront + (k / nave.bays) * bodyLen
        const at = { x: s * outerHalf, z }
        if (walls.buttresses === 'flying' && aisles) {
          flyingButtress(out, at, heading, 0, low * 0.95, bd * 1.4, eaves * 0.86, bw * 1.15, wall, surf)
        } else {
          buttress(out, at, heading, 0, low * 0.9, bw, bd, walls.buttresses === 'stepped' ? 'stepped' : 'plain', wall, surf)
        }
      }
    }
  }

  /* ---- the transept */
  if (transept) {
    const tHalf = transept.ends === 'projecting' ? aisleHalf + W * 0.3 : aisleHalf
    const tz = zBack - bodyLen * 0.22
    const tLen = Math.min(bodyLen * 0.3, W * 0.7)
    const tRise = nave.roof === 'flat' ? 0 : (tLen / 2) * PITCH[nave.pitch]
    const tEaves = Math.max(aisleEaves, eaves - tRise * 0.2)
    faceBand(out, boxRing(-tHalf, tHalf, tz - tLen / 2, tz + tLen / 2), 0, tEaves, wallFace(walls.openings, wall, surf, storeyH))
    // its roof runs ACROSS the nave, so its ridge is along x: drawn as a gable roof in the swapped frame
    const arm = new MeshBuilder()
    gableRoof(arm, -tLen / 2 - 0.3, tLen / 2 + 0.3, -tHalf - 0.3, tHalf + 0.3, tEaves, tRise, roofC, roofM)
    placed(out, arm, Math.PI / 2, 0, tz)
    capBox(out, -tHalf, tHalf, tz - tLen / 2, tz + tLen / 2, tEaves, roofC, roofM)
    for (const s of [-1, 1]) {
      const at = { x: s * tHalf, z: tz }
      gableEnd(out, at, s > 0 ? Math.PI / 2 : -Math.PI / 2, tLen / 2 + 0.3, tEaves, tRise, wall, surf, trim)
      if (transept.ends === 'projecting' && walls.openings !== 'blank') {
        roseWindow(out, { x: s * (tHalf + 0.06), z: tz }, s > 0 ? Math.PI / 2 : -Math.PI / 2, tEaves * 0.68,
          Math.min(tLen * 0.2, tEaves * 0.2), trim, { spokes: 6 })
      }
    }
  }

  /* ---- the chancel */
  if (chancel) {
    const cHalf = naveHalf * 1.02
    const cEaves = Math.max(3.5, eaves * 0.86)
    if (chancel.kind === 'apse') {
      faceBand(out, boxRing(-cHalf, cHalf, zBack - 0.4, zBack + chancelLen * 0.35), 0, cEaves, { kind: 'blank', wall, material: surf })
      capBox(out, -cHalf, cHalf, zBack - 0.4, zBack + chancelLen * 0.35, cEaves, roofC, roofM)
      apse(out, { x: 0, z: zBack + chancelLen * 0.35 }, 0, cHalf, 0, cEaves, wall, surf, roofC, roofM, walls.openings)
    } else {
      faceBand(out, boxRing(-cHalf, cHalf, zBack - 0.4, zBack + chancelLen), 0, cEaves, wallFace(walls.openings, wall, surf, storeyH))
      if (nave.roof !== 'flat') {
        gableRoof(out, -cHalf - 0.3, cHalf + 0.3, zBack - 0.4, zBack + chancelLen + 0.3, cEaves, cHalf * PITCH[nave.pitch], roofC, roofM)
        gableEnd(out, { x: 0, z: zBack + chancelLen + 0.3 }, 0, cHalf + 0.3, cEaves, cHalf * PITCH[nave.pitch], wall, surf, trim)
      }
      capBox(out, -cHalf, cHalf, zBack - 0.4, zBack + chancelLen, cEaves, roofC, roofM)
    }
  } else if (nave.roof === 'gable') {
    gableEnd(out, { x: 0, z: zBack + 0.3 }, 0, naveHalf + 0.3, eaves, rise, wall, surf, trim)
  }

  /* ---- the tower or towers: their own dimensions, from the counts */
  const towers: P2[] = []
  let towerR = 0
  if (tower) {
    // a tower's half-width, from the building's own width: a corner or detached tower is slimmer than a
    // centred one, and a single tower filling half the front (the first try) reads as a gatehouse, not a church
    const r = tower.at === 'twin' ? Math.min(W * 0.14, aisleHalf * 0.4)
      : tower.at === 'front-centre' ? Math.min(W * 0.22, naveHalf * 0.7)
        : tower.at === 'crossing' ? Math.min(W * 0.24, naveHalf * 0.85)
          : Math.min(W * 0.17, naveHalf * 0.55)
    towerR = Math.max(1.6, r)
    const outerHalf = aisles ? aisleHalf : naveHalf
    switch (tower.at) {
      case 'front-centre': towers.push({ x: 0, z: zFront + towerR * 0.6 }); break
      case 'front-corner': towers.push({ x: outerHalf - towerR * 0.85, z: zFront + towerR * 0.55 }); break
      case 'twin': towers.push({ x: -(outerHalf - towerR * 0.9), z: zFront + towerR * 0.6 }, { x: outerHalf - towerR * 0.9, z: zFront + towerR * 0.6 }); break
      case 'crossing': towers.push({ x: 0, z: transept ? zBack - bodyLen * 0.22 : (zFront + zBack) / 2 }); break
      case 'detached': towers.push({ x: outerHalf + towerR * 1.6, z: zFront + towerR }); break
    }
    /*
     * The stage height. `stages` is the only size the spec gives a tower, so the kit has to make a count into a
     * height — and it must clear the roof: at `eaves / 2.3` a four-stage tower on a steeply roofed hall came out
     * SHORTER than its own ridge and its cap poked through the slates halfway up. A tower is a landmark; the
     * floor is the ridge plus a stage.
     */
    const stageH = Math.max(3.2, eaves * 0.52, (H * 1.32) / Math.max(2, Math.round(tower.stages)))
    for (const at of towers) {
      churchTower(out, at, 0, towerR, tower.stages, stageH, tower.top, tower.plan,
        { wall, material: surf, roof: roofC, roofMaterial: roofM, trim })
    }
  }

  /* ---- the front */
  drawFront(out, {
    front, walls, nave, naveHalf, aisleHalf: aisles ? aisleHalf : naveHalf, zFront, eaves, aisleEaves, rise,
    wall, trim, surf, roofC, tower, towers, towerR, aisles: !!aisles,
  })
}

/** a flat roof slab over a box: what the walls close against where no pitched roof covers them */
function capBox(out: MeshBuilder, x0: number, x1: number, z0: number, z1: number, y: number, c: Rgb, m: Surface): void {
  out.quad([[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]].reverse() as [number, number, number][],
    [0, 1, 0], UV, c, surfaceTag(m))
}

interface FrontCtx {
  front: Front
  walls: Walls
  nave: Nave
  naveHalf: number
  aisleHalf: number
  zFront: number
  eaves: number
  aisleEaves: number
  rise: number
  wall: Rgb
  trim: Rgb
  surf: Surface
  roofC: Rgb
  tower: Tower | null
  towers: P2[]
  towerR: number
  aisles: boolean
}

/** The gable end that faces the street: its head, its window and its way in. Drawn facing +z, on heading π. */
function drawFront(out: MeshBuilder, c: FrontCtx): void {
  const H_FRONT = Math.PI
  /*
   * Where the front's WINDOW and PORTAL actually go. A `front-centre` tower stands over the middle of the front
   * wall, so a portal drawn on that wall is behind it and invisible — Old Saint Mary's came out as a blank
   * brick front with a flight of steps leading to nothing. Its door is in the tower's base, as one always is,
   * so the centre line moves forward to the tower's own front face.
   */
  const centreTower = c.tower?.at === 'front-centre' ? c.towers[0] : undefined
  const wallAt = { x: 0, z: c.zFront - 0.02 }
  const at = { x: 0, z: (centreTower ? centreTower.z - c.towerR : c.zFront) - 0.02 }
  /*
   * The width the front's head spans. A GABLE or a PEDIMENT closes the nave's own roof, so it is the nave's
   * width and nothing else — the first version made it the whole front minus the towers, and the nave roof then
   * spilled forward between the twin towers as a bare grey wedge with no stone closing it. A parapet front
   * (baroque, mission, plain) is a screen across the WHOLE building, less whatever the towers take.
   */
  const twin = c.tower?.at === 'twin'
  const screen = Math.max(c.naveHalf + 0.4, twin ? c.aisleHalf - c.towerR * 2 : c.aisleHalf)
  const headHalf = c.front.kind === 'gable' || c.front.kind === 'pediment' ? c.naveHalf + 0.35 : screen
  const gableRise = c.nave.roof === 'flat' ? Math.max(1.2, c.eaves * 0.12) : c.rise

  switch (c.front.kind) {
    case 'gable':
      gableEnd(out, wallAt, H_FRONT, headHalf, c.eaves, gableRise, c.wall, c.surf, c.trim)
      crossFinial(out, { x: 0, z: wallAt.z }, c.eaves + gableRise, Math.max(1.2, c.eaves * 0.13), c.trim)
      break
    case 'pediment': {
      // `pediment()` draws facing −z, so it takes the `+ Math.PI` correction (BUGS.md #101) — the only −z part
      // this module calls
      gableEnd(out, wallAt, H_FRONT, headHalf, c.eaves, gableRise, c.wall, c.surf, c.trim)
      const p = new MeshBuilder()
      pedimentAt(p, headHalf, c.eaves - 0.4, gableRise * 0.62, c.trim)
      placed(out, p, H_FRONT + Math.PI, wallAt.x, wallAt.z)
      break
    }
    case 'baroque':
      curvedGable(out, wallAt, H_FRONT, headHalf, c.eaves - 0.6, gableRise + Math.max(1.5, c.eaves * 0.18), c.wall, c.surf, true)
      crossFinial(out, { x: 0, z: wallAt.z }, c.eaves + gableRise + Math.max(1.5, c.eaves * 0.18) - 0.6, Math.max(1.2, c.eaves * 0.12), c.trim)
      break
    case 'mission': {
      // a flat stuccoed parapet with bell niches in it and no roof showing behind
      curvedGable(out, wallAt, H_FRONT, headHalf, c.eaves - 0.4, Math.max(2, c.eaves * 0.28), c.wall, c.surf, true)
      const nw = Math.min(headHalf * 0.3, 1.8)
      for (const s of [-1, 1]) {
        bellNiche(out, { x: s * headHalf * 0.42, z: wallAt.z - 0.04 }, H_FRONT, c.eaves - 0.1, nw, nw * 1.5, c.trim)
      }
      crossFinial(out, { x: 0, z: wallAt.z }, c.eaves - 0.4 + Math.max(2, c.eaves * 0.28), Math.max(1, c.eaves * 0.1), c.trim)
      break
    }
    case 'plain':
      boxAlong(out, 0, c.eaves + Math.max(0.8, c.eaves * 0.07) / 2, wallAt.z + 0.22, headHalf, Math.max(0.8, c.eaves * 0.07) / 2, 0.4, H_FRONT, c.wall, surfaceTag(c.surf))
      break
  }

  /* ---- the window in the front */
  const wy = c.eaves * (c.front.kind === 'mission' || c.front.kind === 'plain' ? 0.66 : 0.72)
  const r = Math.min(headHalf * 0.46, c.eaves * 0.2)
  switch (c.front.window) {
    case 'rose': roseWindow(out, at, H_FRONT, wy, r, c.trim, { spokes: 8 }); break
    case 'wheel': roseWindow(out, at, H_FRONT, wy, r, c.trim, { spokes: 12, wheel: true }); break
    case 'oculus': roseWindow(out, at, H_FRONT, wy, r * 0.8, c.trim, { spokes: 2 }); break
    case 'medallion': roseWindow(out, at, H_FRONT, wy, r * 0.8, c.trim, { spokes: 2, surround: true }); break
    case 'lancets': {
      const n = 3
      for (let i = 0; i < n; i++) {
        lancet(out, { x: (i - (n - 1) / 2) * r * 0.9, z: at.z - 0.02 }, H_FRONT, wy - r * 0.8, r * 0.5,
          r * 1.7 * (i === (n - 1) / 2 ? 1.15 : 1), c.walls.openings === 'round' ? 'round' : 'pointed', c.trim)
      }
      break
    }
    case 'none': break
  }

  /* ---- the way in */
  const pw = Math.min(headHalf * 0.6, c.eaves * 0.36)
  const ph = pw * 1.7
  const head: 'pointed' | 'round' | 'square' =
    c.walls.openings === 'round' ? 'round' : c.walls.openings === 'square' ? 'square' : 'pointed'
  const steps = c.front.steps
  switch (c.front.portal) {
    case 'single':
      portal(out, { x: 0, z: at.z }, H_FRONT, pw, ph, head, c.trim, { orders: 3, steps })
      break
    case 'triple':
      portal(out, { x: 0, z: at.z }, H_FRONT, pw, ph, head, c.trim, { orders: 3, steps })
      for (const s of [-1, 1]) {
        portal(out, { x: s * (c.aisleHalf * 0.58), z: wallAt.z }, H_FRONT, pw * 0.6, ph * 0.72, head, c.trim, { orders: 2, steps })
      }
      break
    case 'recessed':
      portal(out, { x: 0, z: at.z }, H_FRONT, pw, ph, head, c.trim, { orders: 5, steps })
      break
    case 'porch': {
      // a little gabled porch standing out in front of the door
      const d = Math.max(1.6, pw * 0.8)
      const pr = new MeshBuilder()
      faceBand(pr, boxRing(-pw * 0.8, pw * 0.8, -d, 0.2), 0, ph * 0.95, { kind: 'blank', wall: c.wall, material: c.surf })
      gableRoof(pr, -pw * 0.9, pw * 0.9, -d - 0.3, 0.2, ph * 0.95, pw * 0.5, c.roofC, 'tile')
      portal(pr, { x: 0, z: -d - 0.04 }, Math.PI, pw * 0.9, ph * 0.8, head, c.trim, { orders: 2 })
      placed(out, pr, 0, 0, at.z + 0.02)
      if (steps > 0) {
        for (let k = 0; k < steps; k++) {
          const o = (steps - k) * 0.34
          boxAlong(out, 0, (k + 0.5) * 0.08, at.z + 0.02 - d - o + 0.17, pw + (steps - k) * 0.12, (k + 1) * 0.08, 0.17, H_FRONT, c.trim, 0)
        }
      }
      break
    }
  }
}

/** `kit.ts`'s `pediment()` drawn at the origin on its own −z face: the ONE −z call in this module */
function pedimentAt(out: MeshBuilder, half: number, y: number, h: number, colour: Rgb): void {
  pedimentImpl(out, -half, half, 0, y, h, 0.8, colour)
}
