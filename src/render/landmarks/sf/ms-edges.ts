/**
 * MOSCONE SOUTH — THE REMAINING EDGE STRUCTURES: the 3rd Street curved entrance esplanade (the block's set
 * piece), the monumental Folsom stair-and-walk pair with its pier wall, the Veranda San Francisco (the pink
 * building), and the plain Moscone Ballroom mass.
 *
 * `docs/MOSCONE-SOUTH.md` is the brief. `LEVELS` and `UNDERCROFT_H` come from `./moscone-south.ts`, which
 * owns them; nothing here retypes a level number.
 *
 * ---- CORRECTION 2026-09-23 — the esplanade and the Folsom stair were on the WRONG BUILDING'S ring
 *
 * Both were originally keyed off `way/109141776` (Moscone South, the level-1 hall under most of the block).
 * That hall's own OSM footprint runs x 897.9…991.8, z −1063.2…−970.2 — it never reaches 3rd Street (x≈1115)
 * or Folsom (the ice rink alone runs to z −1151.9), so nothing on ITS ring can be a 3rd-Street or Folsom
 * frontage. Per `docs/MOSCONE-SOUTH.md` both features belong to `way/288716387`, the Moscone Ballroom — "the
 * second Moscone hall" the brief describes on the 3rd Street and Folsom sides — which DOES reach 3rd Street
 * (x up to 1111.6) and sits directly across the canyon from the ice rink (`way/27572497`, closest approach
 * 14.3 m, at a corner it shares exactly with the Public Square, `way/613665502`). The three lat/lon entries
 * were hand-placed near Moscone South's own Howard-corner instead, off by roughly a full building.
 *
 * ---- WHY THE ESPLANADE AND THE FOLSOM WALL ARE HARD-CODED RINGS, NOT `fit.ring`
 *
 * `way/288716387` is already claimed in `san-francisco.json`/here by the `mosconeBallroom` preset below, and a
 * second manifest entry against a way already claimed does not get a `fit.ring` (BUGS.md #146's lesson
 * applied: use the REAL polygon, not a guessed lat/lon box). `BALLROOM_EDGES` below are that way's own OSM
 * vertices at the two relevant corners, copied once here so both edge treatments key off real geometry:
 *
 *   the 3rd Street frontage is the single real edge from the Ballroom's vertex 21 to vertex 22 — vertex 22
 *   (x 1111.6) is the closest point on the whole building to 3rd Street (x≈1115), and the edge's own outward
 *   normal is `(+0.70, +0.71)`, i.e. toward 3rd Street, consistent with this whole block's ~45°-rotated grid
 *   (Moscone South's own 3rd/Folsom-facing edges read the same way — see the corrected note above);
 *   the Folsom-facing wall is the single edge from vertex 34 to vertex 35 (85.0 m), whose outward normal is
 *   `(−0.70, −0.71)` — west and south, i.e. toward Folsom and the ice-rink canyon `ms-west.ts` does not touch,
 *   exactly `docs/MOSCONE-SOUTH.md`'s "canyon between the ice rink (west) and the second Moscone hall (east)".
 *
 * Placed by lat/lon per the file's own header convention (+x east, +z north, no rotateDeg): the model's axes
 * are already the city's.
 *
 * The Veranda has no OSM way of its own (it is a small pink venue standing ON a hall's roof, not a footprint
 * OSM traced) so it is a rectangle set back from the SAME Folsom-facing Ballroom edge used by the monumental
 * stair (`docs/MOSCONE-SOUTH.md`'s own wording), at `LEVELS.wall` (8 m — the built `mosconeHall` box's own
 * roof, the real deck it stands on, not the abstract "garden" 4 m level the brief's prose uses loosely). The
 * Ballroom (`way/288716387`) itself DOES get a real `fit.ring` and is built as a plain mass off it below.
 *
 * ---- HEADINGS
 *
 * `edgeAt().heading` is what a box FACING that edge wants (a band, a canopy lying flat against the wall).
 * `headAlong(dx,dz) = atan2(-dz,dx)` is what a box LYING ALONG a direction wants (a purlin, a brace, a fin).
 * Mixing them is BUGS.md #135 and five other bugs on this project.
 */
import type { MeshBuilder } from '../../buildings.ts'
import { capPolygon } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { box, type Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { boxAlong, edgeAt, longestEdge, offsetRing, railing, ramp, stair } from '../parts.ts'
import { towerRing } from '../tower.ts'
import { LEVELS, UNDERCROFT_H } from './moscone-south.ts'

type P2 = { x: number; z: number }

const CONC = surfaceTag('concrete')
const METAL = surfaceTag('metal')
const GLASS = surfaceTag('glass')

const WHITE: Rgb = [0.89, 0.89, 0.87]
const PIER_WHITE: Rgb = [0.86, 0.86, 0.84]
const CANOPY_GLASS: Rgb = [0.62, 0.74, 0.76]
const CANOPY_FRAME: Rgb = [0.22, 0.23, 0.25]
const PLANT_BED: Rgb = [0.27, 0.34, 0.22]
const PINK: Rgb = [0.86, 0.6, 0.58]
const PINK_DK: Rgb = [0.74, 0.49, 0.48]
const DARK_ROOF: Rgb = [0.16, 0.16, 0.18]
const PALE_CANOPY: Rgb = [0.92, 0.9, 0.86]
const BLUEGREEN: Rgb = [0.32, 0.52, 0.53]
const SOLAR: Rgb = [0.11, 0.12, 0.17]

/** `boxAlong`'s heading for a box lying ALONG a direction — see file header. */
const headAlong = (dx: number, dz: number): number => Math.atan2(-dz, dx)

/**
 * `way/288716387` (Moscone Ballroom)'s own OSM vertices at the two corners these builders need, indices as in
 * the full 41-vertex ring (world metres, +x east +z north) — see the file header for why these two edges and
 * not others. Only the four vertices actually used are kept; there is no need to carry the whole ring twice
 * when `mosconeBallroom` below already takes it whole via `fit.ring`.
 */
const BALLROOM_V21: P2 = { x: 1084.153, z: -1015.601 }
const BALLROOM_V22: P2 = { x: 1111.616, z: -1042.741 } // closest point on the building to 3rd Street
const BALLROOM_V34: P2 = { x: 1056.091, z: -1075.268 } // shared corner with the Public Square, way/613665502
const BALLROOM_V35: P2 = { x: 995.349, z: -1015.835 }

/**
 * A lat/lon-placed entry is translated by the engine to its own (cx, cz) node position
 * (`src/render/landmarks.ts`, the `e.lat !== undefined` branch) and the builder's geometry is expected in
 * LOCAL coordinates around that node — NOT the absolute world metres the vertices above are written in. Each
 * of the three lat/lon entries below therefore gets its own ORIGIN, subtracted from the relevant vertices once
 * here, and that same origin is what the manifest's `lat`/`lon` for that entry convert back to (checked
 * against `public/cities/san-francisco.json`'s own `origin`). Getting this wrong does not error — it silently
 * doubles the offset and places the model roughly twice as far from the block as it should be, which is
 * exactly the kind of thing `tools/model-shots.ts --views=rider` (camera fixed on local origin) was used to
 * catch here: the first render of all three came back blank sky.
 */
const sub = (p: P2, o: P2): P2 => ({ x: p.x - o.x, z: p.z - o.z })

/** vertex 21 → vertex 22: the single real edge closest to 3rd Street (38.6 m, outward normal +0.70,+0.71). */
const ESPLANADE_ORIGIN: P2 = { x: (BALLROOM_V21.x + BALLROOM_V22.x) / 2, z: (BALLROOM_V21.z + BALLROOM_V22.z) / 2 }
const ESPLANADE_LINE: P2[] = [sub(BALLROOM_V21, ESPLANADE_ORIGIN), sub(BALLROOM_V22, ESPLANADE_ORIGIN)]

/** vertex 34 → vertex 35: the Folsom-facing wall, in the canyon with the ice rink (85.0 m). */
const FOLSOM_ORIGIN: P2 = { x: (BALLROOM_V34.x + BALLROOM_V35.x) / 2, z: (BALLROOM_V34.z + BALLROOM_V35.z) / 2 }
const FOLSOM_LINE: P2[] = [sub(BALLROOM_V34, FOLSOM_ORIGIN), sub(BALLROOM_V35, FOLSOM_ORIGIN)]

/**
 * The Veranda sets back from the SAME Folsom-facing Ballroom edge the monumental stair uses (see file
 * header), so it shares that edge's origin rather than inventing a separate absolute position to guess at.
 */
const VERANDA_ORIGIN: P2 = FOLSOM_ORIGIN
const VERANDA_LINE: P2[] = [sub(BALLROOM_V34, VERANDA_ORIGIN), sub(BALLROOM_V35, VERANDA_ORIGIN)]

// ==========================================================================================================
// 1. THE 3RD STREET CURVED ENTRANCE ESPLANADE — the block's set piece
// ==========================================================================================================

/**
 * A long shallow arc cut into the 3rd Street frontage: stepped seating terraces following the curve, planted
 * beds along it, a glazed canopy on slender columns with exposed diagonal bracing the length of the arc, and
 * `arcStair` flights descending through it to street level.
 *
 * The frontage (81.6 m along `ESPLANADE_LINE`) is the arc's CHORD. A shallow arc across that chord with about
 * 9 m of sagitta gives a gentle bulge toward 3rd Street — enough to read as a curve from above without eating
 * into the pavement, which BUGS.md #134d already burned once on the north block. From chord `c` and sagitta
 * `s`: radius `r = (c*c/4 + s*s) / (2*s)`, centre set back from the chord by `r - s`.
 */
export function msThirdStreetEsplanade(out: MeshBuilder, _fit: Fit): void {
  const e = edgeAt(ESPLANADE_LINE, 0)
  const chord = e.L
  const sag = 9
  const radius = (chord * chord / 4 + sag * sag) / (2 * sag)
  // centre is set back from the chord, on the INSIDE (away from 3rd St, i.e. opposite the outward normal),
  // by (radius - sagitta), so the arc's crown sits `sag` out from the chord toward the street.
  const centre: P2 = { x: e.mid.x - e.nx * (radius - sag), z: e.mid.z - e.nz * (radius - sag) }
  // half-angle subtended by the chord at that radius, so `from`/`to` are symmetric turns either side of the
  // direction from centre through the chord's midpoint.
  const halfAngle = Math.asin(Math.min(1, chord / 2 / radius))
  const midBearing = Math.atan2(e.mid.z - centre.z, e.mid.x - centre.x) / (2 * Math.PI)
  const turn = halfAngle / (2 * Math.PI)
  const from = midBearing - turn
  const to = midBearing + turn

  // The stepped terraces: arcStair from street (0) up to the hall's wall top (LEVELS.wall = 8), anchored on
  // the OUTER radius (the crown, toward 3rd St) so the flight climbs inward toward the hall — the form a
  // curved entrance forecourt actually has, stairs coming DOWN from the building toward the street.
  /*
   * NO FLIGHT (owner, 2026-10-03: "green and white quarter-circle in the street … the green and white area around the
   * rink extending into the street"). The `esplanade` preset makes 40 treads of 1.2 m — a 48 m flight — anchored at the
   * wall top and climbing OUT, which laid striped green-and-white treads across the street to the far pavement. No
   * 48 m flight fits this frontage; until the terraces are measured against photographs the canopy, the beds and the
   * rail along the arc stay, and the flight does not (BUGFIX-2026-10-03 DISABLED MODELS).
   */
  const s = { top: Array.from({ length: 25 }, (_, i) => { const a = 2 * Math.PI * (from + ((to - from) * i) / 24); return { x: centre.x + Math.cos(a) * radius, z: centre.z + Math.sin(a) * radius } }) }

  // Planted beds: a second, shallower arcStair-shaped strip is overkill — a simple ring of `capPolygon`
  // wedges along the outer radius reads as planting from a rider's eye without another solid.
  const bedR0 = radius + 1.2
  const bedR1 = radius + 3.6
  const segs = 24
  for (let i = 0; i < segs; i++) {
    const a0 = 2 * Math.PI * (from + (to - from) * (i / segs))
    const a1 = 2 * Math.PI * (from + (to - from) * ((i + 1) / segs))
    const ring: P2[] = [
      { x: centre.x + Math.cos(a0) * bedR0, z: centre.z + Math.sin(a0) * bedR0 },
      { x: centre.x + Math.cos(a1) * bedR0, z: centre.z + Math.sin(a1) * bedR0 },
      { x: centre.x + Math.cos(a1) * bedR1, z: centre.z + Math.sin(a1) * bedR1 },
      { x: centre.x + Math.cos(a0) * bedR1, z: centre.z + Math.sin(a0) * bedR1 },
    ]
    capPolygon(out, ring, LEVELS.wall + 0.35, PLANT_BED, CONC)
    out.decks.push({ ring, y: LEVELS.wall + 0.35 })
  }

  // The glazed canopy on slender columns with exposed diagonal bracing, carried the length of the arc at the
  // wall top, cantilevered out over the terraces toward the street.
  const canopyR = radius - 1.5
  const colR = radius - 0.4
  const nCols = Math.max(6, Math.round((to - from) * 2 * Math.PI * colR / 6))
  const colH = 4.5
  const y0 = LEVELS.wall
  for (let i = 0; i <= nCols; i++) {
    const a = 2 * Math.PI * (from + (to - from) * (i / nCols))
    const cx = centre.x + Math.cos(a) * colR
    const cz = centre.z + Math.sin(a) * colR
    const h = headAlong(Math.cos(a), Math.sin(a))
    boxAlong(out, cx, y0 + colH / 2, cz, 0.18, colH / 2, 0.18, h, CANOPY_FRAME, METAL)
    // diagonal brace back to the wall, one per bay
    if (i < nCols) {
      const a2 = 2 * Math.PI * (from + (to - from) * ((i + 0.5) / nCols))
      const wx = centre.x + Math.cos(a2) * (radius + 0.2)
      const wz = centre.z + Math.sin(a2) * (radius + 0.2)
      const mx = (cx + wx) / 2
      const mz = (cz + wz) / 2
      const dHead = Math.atan2(-(wz - cz), wx - cx)
      const bLen = Math.hypot(wx - cx, wz - cz)
      boxAlong(out, mx, y0 + colH - 0.6, mz, bLen / 2, 0.08, 0.08, dHead, CANOPY_FRAME, METAL)
    }
  }
  // the glazed roof plane itself, a thin annular wedge
  const roofSegs = Math.max(8, nCols)
  for (let i = 0; i < roofSegs; i++) {
    const a0 = 2 * Math.PI * (from + (to - from) * (i / roofSegs))
    const a1 = 2 * Math.PI * (from + (to - from) * ((i + 1) / roofSegs))
    const rOut = radius + 0.6
    const rIn = canopyR - 1.2
    const y = y0 + colH
    const p0 = { x: centre.x + Math.cos(a0) * rOut, z: centre.z + Math.sin(a0) * rOut }
    const p1 = { x: centre.x + Math.cos(a1) * rOut, z: centre.z + Math.sin(a1) * rOut }
    const p2 = { x: centre.x + Math.cos(a1) * rIn, z: centre.z + Math.sin(a1) * rIn }
    const p3 = { x: centre.x + Math.cos(a0) * rIn, z: centre.z + Math.sin(a0) * rIn }
    out.quad(
      [[p0.x, y, p0.z], [p1.x, y, p1.z], [p2.x, y, p2.z], [p3.x, y, p3.z]],
      [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], CANOPY_GLASS, GLASS,
    )
  }

  railing(out, s.top, LEVELS.wall, { kind: 'posts' })
}

// ==========================================================================================================
// 2. THE MONUMENTAL FOLSOM STAIR — a stair-and-walk PAIR, with the pier-and-terrace wall beside it
// ==========================================================================================================

/**
 * A broad flight, many metres across, running full depth from Folsom (0) to garden level (`LEVELS.garden`,
 * 4 m — the deck this canyon's floor actually reaches, one level short of the hall's own 8 m roof) in one
 * continuous run, with a plain paved walk beside it. `stair()`, solid, closed ends and underside — never
 * `arcStair`, this one is straight, in the canyon between the ice rink (west, `ms-west.ts`) and this hall.
 */
export function msFolsomMonumentalStair(out: MeshBuilder, _fit: Fit): void {
  const e = edgeAt(FOLSOM_LINE, 0)
  // the flight takes the western two-thirds of the wall's frontage, the walk the rest
  const s = stair(out, e.a, e.b, 0, LEVELS.garden, {
    to: 0.62, run: 24, rail: 'right', railKind: 'posts', preset: undefined, riser: 0.16,
  })
  const r = ramp(out, e.a, e.b, 0, LEVELS.garden, {
    from: 0.64, to: 1, gradient: 10, kerb: 0.2, rail: 'both', railKind: 'posts', colour: WHITE, material: 'concrete',
  })

  // the pier wall: big white concrete piers at regular bays with stepped planted terraces between them,
  // stepping up alongside the flight. Set back into the hall from the wall edge.
  const nBays = 6
  const pierW = 1.4
  const pierH = LEVELS.garden + 3
  for (let i = 0; i <= nBays; i++) {
    const t = e.L * (i / nBays)
    const p = { x: e.a.x + e.tx * t - e.nx * 0.6, z: e.a.z + e.tz * t - e.nz * 0.6 }
    boxAlong(out, p.x, pierH / 2, p.z, pierW / 2, pierH / 2, 0.6, e.heading, PIER_WHITE, CONC)
  }
  for (let i = 0; i < nBays; i++) {
    const t0 = e.L * (i / nBays) + pierW
    const t1 = e.L * ((i + 1) / nBays) - pierW
    if (t1 <= t0) continue
    const bayLen = t1 - t0
    const tiers = 3
    for (let k = 0; k < tiers; k++) {
      const y = (k + 1) * (LEVELS.garden / tiers)
      const setback = 1.2 + k * 1.1
      const p = { x: e.a.x + e.tx * (t0 + bayLen / 2) - e.nx * setback, z: e.a.z + e.tz * (t0 + bayLen / 2) - e.nz * setback }
      const tierRing = [
        { x: p.x - e.tx * bayLen / 2 + e.nx * 0.5, z: p.z - e.tz * bayLen / 2 + e.nz * 0.5 },
        { x: p.x + e.tx * bayLen / 2 + e.nx * 0.5, z: p.z + e.tz * bayLen / 2 + e.nz * 0.5 },
        { x: p.x + e.tx * bayLen / 2 - e.nx * 0.5, z: p.z + e.tz * bayLen / 2 - e.nz * 0.5 },
        { x: p.x - e.tx * bayLen / 2 - e.nx * 0.5, z: p.z - e.tz * bayLen / 2 - e.nz * 0.5 },
      ]
      capPolygon(out, tierRing, y, [0.24, 0.3, 0.2], CONC)
      out.decks.push({ ring: tierRing, y })
    }
  }

  railing(out, s.top, LEVELS.garden, { kind: 'posts' })
  railing(out, r.top, LEVELS.garden, { kind: 'posts' })
}

// ==========================================================================================================
// 3. THE VERANDA SAN FRANCISCO — the pink building. CHEAP.
// ==========================================================================================================

/**
 * Salmon-pink rendered parapet walls, flat dark roof, stepped boxy plan, a roof plant enclosure (also pink)
 * at its north end, a curved pale canopy at its south end over the entrance. The colour is the point — see
 * the file header for why it has no OSM way of its own. Deliberately cheap: three stacked boxes and a
 * cylinder-quarter canopy, nothing scratch-modelled.
 */
export function veranda(out: MeshBuilder, _fit: Fit): void {
  const e = edgeAt(VERANDA_LINE, 0)
  const y0 = LEVELS.wall // the built 8 m mosconeHall box's own roof — the real deck this stands on
  const len = 34
  const depth = 16
  const h1 = 4.5
  const h2 = 3.5
  // set back from the Folsom wall, inboard along it, roughly centred on the hall's footprint
  const base = { x: e.a.x + e.tx * (e.L * 0.15) + e.nx * (-9), z: e.a.z + e.tz * (e.L * 0.15) + e.nz * (-9) }
  const heading = e.heading
  // main stepped mass: two boxes at slightly different plan widths, sharing a datum
  boxAlong(out, base.x, y0 + h1 / 2, base.z, len / 2, h1 / 2, depth / 2, heading, PINK, surfaceTag('stucco'))
  const upperCentre = { x: base.x + e.nx * 1.2, z: base.z + e.nz * 1.2 }
  boxAlong(out, upperCentre.x, y0 + h1 + h2 / 2, upperCentre.z, len / 2 - 4, h2 / 2, depth / 2 - 1.2, heading, PINK_DK, surfaceTag('stucco'))
  // flat dark roof cap
  box(out, upperCentre.x, y0 + h1 + h2 + 0.1, upperCentre.z, len / 2 - 4, 0.1, depth / 2 - 1.2, DARK_ROOF, CONC)

  // roof plant enclosure, pink-walled, at the north end
  const plantCentre = { x: base.x + e.tx * (len / 2 - 3), z: base.z + e.tz * (len / 2 - 3) }
  boxAlong(out, plantCentre.x, y0 + h1 + h2 + 1.2, plantCentre.z, 3, 1.2, depth / 2 - 2, heading, PINK, surfaceTag('stucco'))

  // curved pale canopy at the south end over the entrance, plus a low curved wall below it
  const canopyCentre = { x: base.x - e.tx * (len / 2 + 2), z: base.z - e.tz * (len / 2 + 2) }
  const canR = 5
  const segs = 10
  for (let i = 0; i < segs; i++) {
    const a0 = Math.PI * (i / segs - 0.5)
    const a1 = Math.PI * ((i + 1) / segs - 0.5)
    const p = (a: number, r: number) => ({
      x: canopyCentre.x + e.tx * Math.sin(a) * r + e.nx * Math.cos(a) * r,
      z: canopyCentre.z + e.tz * Math.sin(a) * r + e.nz * Math.cos(a) * r,
    })
    const q0 = p(a0, canR), q1 = p(a1, canR)
    out.quad(
      [[q0.x, y0 + h1 - 0.2, q0.z], [q1.x, y0 + h1 - 0.2, q1.z], [q1.x, y0 + h1, q1.z], [q0.x, y0 + h1, q0.z]],
      [e.nx, 0, e.nz], [[0, 0], [1, 0], [1, 1], [0, 1]], PALE_CANOPY, CONC,
    )
    const w0 = p(a0, canR - 0.3), w1 = p(a1, canR - 0.3)
    out.quad(
      [[w0.x, y0, w0.z], [w1.x, y0, w1.z], [w1.x, y0 + 0.9, w1.z], [w0.x, y0 + 0.9, w0.z]],
      [e.nx, 0, e.nz], [[0, 0], [1, 0], [1, 1], [0, 1]], WHITE, CONC,
    )
  }
}

// ==========================================================================================================
// 4. MOSCONE BALLROOM (way/288716387) — plain mass, cheap, Howard hall's language
// ==========================================================================================================

/**
 * Owner: "all pretty basic cubical structures" — a plain box matching the Howard hall's undercroft / glazed
 * band / white parapet layering, but without the three-sub-building stepping or the perforated screen: this
 * is the CHEAP version of that language, for a building nobody asked to see closely.
 */
export function mosconeBallroom(out: MeshBuilder, fit: Fit): void {
  const ring = fit.ring && fit.ring.length >= 3 ? fit.ring : towerRing(fit)
  const ei = longestEdge(ring)
  const e = edgeAt(ring, ei)
  capPolygon(out, ring, UNDERCROFT_H, [0.15, 0.16, 0.17], CONC)
  const bandTop = LEVELS.upper + 4
  for (let i = 0; i < ring.length; i++) {
    const edge = edgeAt(ring, i)
    boxAlong(out, edge.mid.x, (UNDERCROFT_H + bandTop) / 2, edge.mid.z,
      edge.L / 2, (bandTop - UNDERCROFT_H) / 2, 0.3, edge.heading, BLUEGREEN, GLASS)
    boxAlong(out, edge.mid.x + edge.nx * 0.05, bandTop + 0.6, edge.mid.z + edge.nz * 0.05,
      edge.L / 2, 0.6, 0.35, edge.heading, WHITE, CONC)
  }
  capPolygon(out, offsetRing(ring, -1), bandTop + 1.2, SOLAR, CONC)
  void e
}

export const MS_EDGES: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  msThirdStreetEsplanade,
  msFolsomMonumentalStair,
  veranda,
  mosconeBallroom,
}
