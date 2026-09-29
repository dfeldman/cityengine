/**
 * The Metreon, 135 Fourth Street (way/24307421) — a large retail/entertainment box on the Yerba Buena block.
 * Custom-modelled by owner's decision (2026-09-23): *"This is an important, but very strange area. We should
 * do custom modeling."* Not a `facade()` job, for three reasons that are all real and all met here:
 *
 *  - **Two elevations that share nothing.** The street side (Fourth Street, Mission, the Market corner) is a
 *    blank pale metal-panel box with almost no windows and wall-sized signage. The garden side, facing Yerba
 *    Buena Gardens, is "glass on the inside facing the garden" (owner) — a long, largely transparent curtain
 *    wall with a horizontal roofline. `facade()`'s `on` field picks slots on a shared grammar; this is two
 *    different buildings back to back, so the walls are drawn by hand, edge by edge.
 *  - **The garden stands on a deck.** Yerba Buena Gardens sits on the roof of Moscone Center (BUGS.md #130):
 *    the terrain model has no way to say so, so the level change is carried here instead — the garden glazing
 *    starts partway up the wall (`DECK_Y`), and everything below it is a blank retaining wall down to grade,
 *    standing for the deck structure the ground model cannot represent. The podium is therefore taller on the
 *    street than it ever reads from the lawn.
 *  - **The signage is the building.** A wall-sized `METREON` wordmark, a several-storeys-tall Target bullseye,
 *    and `AMC`/`IMAX` over a perforated dot panel on the Market corner are what make this box identifiable at
 *    all, so they are drawn at the scale the photographs show rather than as a nameplate afterthought.
 *
 * Which ring edge is "the garden side" is read off the footprint rather than typed: it is the LONGEST edge
 * of `towerRing(fit)`, matching the owner's description of a long, unbroken glazed wall — nothing here assumes
 * a compass bearing. Every other edge is treated as street frontage.
 *
 * Massing: a blank street-facing main mass up to `ROOF_MAIN`, capped by a shallow inset upper tier to the
 * fitted height (the "flat-ish roofline with setbacks" the owner's photographs show), all derived from
 * `fit.hx`/`fit.hz`/`fit.height` — nothing is a typed footprint dimension.
 *
 * Signage (render/landmarks/signage.ts, landed same day): the wordmark and the AMC/IMAX lettering use the new
 * `flat` sign type — one quad, two triangles, lit per the photographs. The Target bullseye and the dot panel
 * are NOT text, and `SignSpec` currently has no way to give a sign a picture: `SignSource`'s `{ kind: 'image' }`
 * member is declared in signage.ts but is never referenced by `SignSpec` (`SignSpec.text` is a bare string,
 * not a `SignSource`), and `sign-plates.ts`'s `paint()` only ever lays out text glyphs — there is no image
 * branch to feed a url into. So both logos are drawn as small hand-built geometry instead (see `bullseye()`
 * and `mosaic()` below): cheap, but proof that the mural/billboard path this comment block promises is not
 * wired up yet — see the file header of signage.ts, "NOT IMPLEMENTED".
 */
import type { MeshBuilder } from '../../buildings.ts'
import { capPolygon, capPolygonWithHoles } from '../../buildings.ts'
import type { Rgb } from '../../models.ts'
import type { Fit } from '../fit.ts'
import { towerRing, insetRing } from '../tower.ts'
import { edgeAt, longestEdge } from '../parts.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { sign } from '../signage.ts'

type Edge = ReturnType<typeof edgeAt>

const PALE: Rgb = [0.85, 0.85, 0.84]          // the street mass: pale grey/white metal panel
const PALE_HI: Rgb = [0.90, 0.90, 0.89]       // upper setback tier, a shade lighter so the step reads
const DARKGLASS: Rgb = [0.13, 0.16, 0.19]     // shopfront glazing under the canopy
const GARDEN_GLASS: Rgb = [0.46, 0.58, 0.62]  // the long transparent garden wall
const MULLION: Rgb = [0.30, 0.31, 0.33]
const DECK: Rgb = [0.36, 0.35, 0.34]          // the retaining wall down to grade under the raised garden deck
const ROOF: Rgb = [0.32, 0.31, 0.31]
const RED: Rgb = [0.80, 0.09, 0.10]
const WHITE: Rgb = [0.97, 0.97, 0.95]
const BLUE: Rgb = [0.09, 0.27, 0.60]
const INK: Rgb = [0.14, 0.14, 0.15]
const PANEL_MID: Rgb = [0.55, 0.55, 0.55]

const T_METAL = surfaceTag('metal')
const T_GLASS = surfaceTag('glass')
const T_CONC = surfaceTag('concrete')

/** A single flat quad on edge `e`, from `u0..u1` along it and `y0..y1` up it, pushed `off` out along its normal. */
function rect(out: MeshBuilder, e: Edge, u0: number, u1: number, y0: number, y1: number, colour: Rgb, tag: number, off = 0): void {
  const P = (u: number, y: number): [number, number, number] => [e.a.x + e.tx * u + e.nx * off, y, e.a.z + e.tz * u + e.nz * off]
  out.quad([P(u0, y0), P(u1, y0), P(u1, y1), P(u0, y1)], [e.nx, 0, e.nz], [[0, 0], [1, 0], [1, 1], [0, 1]], colour, tag)
}

/** A cheap deterministic "random" in [0,1) from two integers — no seed to carry, same block every load. */
const hash01 = (i: number, j: number): number => {
  const s = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453
  return s - Math.floor(s)
}

/**
 * A grid of small rectangles on a wall — the perforated dot panel and the pixelated glass, both approximated
 * as a mosaic of little quads rather than true circles: a real stipple of a few hundred discs would cost the
 * same triangles as the entire rest of the building for a detail nobody resolves at riding distance, and a
 * grid of squares reads the same from more than about 15 m. `gap` is the fraction of each cell left as a
 * reveal, so the mosaic doesn't merge into one flat colour swatch.
 */
function mosaic(out: MeshBuilder, e: Edge, u0: number, u1: number, y0: number, y1: number,
                cols: number, rows: number, palette: Rgb[], tag: number, off: number, gap = 0.28): void {
  const cw = (u1 - u0) / cols
  const ch = (y1 - y0) / rows
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const colour = palette[Math.floor(hash01(c, r) * palette.length) % palette.length]
      const u = u0 + c * cw
      const y = y0 + r * ch
      rect(out, e, u + cw * gap * 0.5, u + cw * (1 - gap * 0.5), y + ch * gap * 0.5, y + ch * (1 - gap * 0.5), colour, tag, off)
    }
  }
}

/**
 * The Target bullseye: three concentric rings (red, white, red) standing off the wall a hand's width, drawn as
 * a fan of flat wedges — the whole thing is triangles, no texture, because `SignSpec` has no image source to
 * paint a logo into (see the file header). `segs` wedges per ring is plenty at a rider's distance; the centre
 * disc is a degenerate quad (two shared corners) rather than a true triangle primitive, which this mesh
 * builder has no separate call for.
 */
function bullseye(out: MeshBuilder, e: Edge, u: number, y: number, r: number, off: number): void {
  const n: [number, number, number] = [e.nx, 0, e.nz]
  const P = (rad: number, ang: number): [number, number, number] =>
    [e.a.x + e.tx * (u + rad * Math.cos(ang)) + e.nx * off, y + rad * Math.sin(ang), e.a.z + e.tz * (u + rad * Math.cos(ang)) + e.nz * off]
  const segs = 20
  const rings: [number, Rgb][] = [[1.0, RED], [0.62, WHITE], [0.30, RED]]
  for (let k = 0; k < rings.length; k++) {
    const rOut = rings[k][0] * r
    const rIn = k + 1 < rings.length ? rings[k + 1][0] * r : 0
    const colour = rings[k][1]
    for (let s = 0; s < segs; s++) {
      const a0 = (s / segs) * Math.PI * 2
      const a1 = ((s + 1) / segs) * Math.PI * 2
      if (rIn <= 0) {
        const c = P(0, 0)
        out.quad([c, P(rOut, a0), P(rOut, a1), P(rOut, a1)], n, [[0.5, 0.5], [1, 0], [1, 1], [1, 1]], colour, T_METAL)
      } else {
        out.quad([P(rIn, a0), P(rOut, a0), P(rOut, a1), P(rIn, a1)], n, [[0, 0], [1, 0], [1, 1], [0, 1]], colour, T_METAL)
      }
    }
  }
}

export function metreon_135_fourth(out: MeshBuilder, fit: Fit): void {
  const ring = towerRing(fit)
  const n = ring.length
  const H = fit.height

  // ---- which edge is the garden: the longest, unbroken run — ring-derived, no compass bearing typed in.
  const gardenEdge = longestEdge(ring)

  // ---- heights, all fractions of the fitted height
  const canopyY = H * 0.10     // street-level shopfront canopy
  const deckY = H * 0.17       // Yerba Buena Gardens' deck level (BUGS #130): glass starts here on the garden
                                // side; everything below is the retaining wall down to true street grade
  const roofMain = H * 0.80    // top of the main street mass
  const roofTop = H            // top of the setback tier

  const insetD = fit.hx * 0.05 + fit.hz * 0.05
  const ring2 = insetRing(ring, Math.max(1.5, insetD))

  // ---- main mass, edge by edge
  let streetLenTotal = 0
  const streetEdges: number[] = []
  for (let i = 0; i < n; i++) {
    const e = edgeAt(ring, i)
    if (e.L < 0.5) continue
    if (i === gardenEdge) {
      // the garden elevation: a retaining wall down to grade under the raised deck, then glass the rest of
      // the way up — long, largely transparent, one horizontal roofline
      rect(out, e, 0, e.L, 0, deckY, DECK, T_CONC)
      rect(out, e, 0, e.L, deckY, roofMain, GARDEN_GLASS, T_GLASS)
      const bays = Math.max(4, Math.round(e.L / 4))
      for (let k = 1; k < bays; k++) {
        const u = (e.L * k) / bays
        rect(out, e, u - 0.12, u + 0.12, deckY, roofMain, MULLION, T_METAL, 0.02)
      }
      // the deck's edge reads as a lip where the lawn meets the wall
      rect(out, e, 0, e.L, deckY - 0.4, deckY + 0.1, MULLION, T_METAL, 0.05)
    } else {
      // the street elevation: dark shopfront under a canopy, then a tall pale wall with almost no windows
      rect(out, e, 0, e.L, 0, canopyY, DARKGLASS, T_GLASS)
      rect(out, e, 0, e.L, canopyY - 0.3, canopyY, MULLION, T_METAL, 0.05) // the canopy fascia line
      rect(out, e, 0, e.L, canopyY, roofMain, PALE, T_METAL)
      // very few windows: one or two small dark slits per street edge, not a grid
      const slits = e.L > 30 ? 2 : 1
      for (let k = 0; k < slits; k++) {
        const u = e.L * (slits === 1 ? 0.5 : 0.28 + 0.44 * k)
        rect(out, e, u - 1.1, u + 1.1, canopyY + H * 0.22, canopyY + H * 0.22 + 2.2, DARKGLASS, T_GLASS, 0.04)
      }
      streetEdges.push(i)
      streetLenTotal += e.L
    }
  }

  // ---- the flat roof deck around the setback (ring minus the smaller ring2), and the setback tier itself
  capPolygonWithHoles(out, [ring, ring2], roofMain, ROOF, T_CONC)
  for (let i = 0; i < n; i++) {
    const e = edgeAt(ring2, i)
    if (e.L < 0.5) continue
    rect(out, e, 0, e.L, roofMain, roofTop, PALE_HI, T_METAL)
  }
  capPolygon(out, ring2, roofTop, ROOF, T_CONC)

  // ==== signage — the point of this model ====
  // the main street frontage: the longest street edge that isn't the garden wall
  let mainEdge = streetEdges[0] ?? 0
  let mainL = -1
  for (const i of streetEdges) { const L = edgeAt(ring, i).L; if (L > mainL) { mainL = L; mainEdge = i } }
  // the Market Street corner: the next-longest street edge, for the AMC/IMAX panel
  let cornerEdge = -1
  let cornerL = -1
  for (const i of streetEdges) {
    if (i === mainEdge) continue
    const L = edgeAt(ring, i).L
    if (L > cornerL) { cornerL = L; cornerEdge = i }
  }
  if (cornerEdge < 0) cornerEdge = (mainEdge + 1) % n

  const mainE = edgeAt(ring, mainEdge)

  /*
   * The wordmark: dark letters set high on the white wall, `flat` (one quad, a real bold grotesque, two
   * triangles) instead of the block-font letters this system replaced. `lit: 'front'` — floodlit at night,
   * not self-illuminated tube letters, per the owner's "dark letters ... on the white wall".
   */
  sign(out, { type: 'flat', text: 'METREON', h: Math.max(1.8, H * 0.05), face: 'block', weight: 'bold', colour: INK, lit: 'front' },
    { ring, edge: mainEdge, y: roofMain * 0.88, along: 0.5 })

  /*
   * The bullseye, several storeys across, below the wordmark on the same wall. Geometry, not a sign: see the
   * file header on why `SignSource`'s image member cannot be used here yet.
   */
  bullseye(out, mainE, mainE.L * 0.5, roofMain * 0.42, Math.min(fit.hx, fit.hz) * 0.16, 0.12)

  /*
   * The Market Street corner: AMC over IMAX, both self-lit channel letters, over a perforated dot panel that
   * wraps the corner — approximated as a light/dark mosaic (see `mosaic()`) rather than true circles.
   */
  const cE = edgeAt(ring, cornerEdge)
  const panelY0 = canopyY + 0.5
  const panelY1 = roofMain * 0.72
  const panelU0 = cE.L * 0.12
  const panelU1 = cE.L * 0.88
  mosaic(out, cE, panelU0, panelU1, panelY0, panelY1, Math.max(6, Math.round((panelU1 - panelU0) / 2)),
    Math.max(4, Math.round((panelY1 - panelY0) / 2)), [PALE, PANEL_MID, [0.68, 0.68, 0.67]], T_METAL, 0.03)
  sign(out, { type: 'flat', text: 'AMC', h: Math.max(1.4, H * 0.032), face: 'block', weight: 'bold', colour: RED, lit: 'self' },
    { ring, edge: cornerEdge, y: roofMain * 0.60, along: 0.5 })
  sign(out, { type: 'flat', text: 'IMAX', h: Math.max(1.0, H * 0.022), face: 'condensed', weight: 'bold', colour: BLUE, lit: 'self' },
    { ring, edge: cornerEdge, y: roofMain * 0.60 - Math.max(1.4, H * 0.032) * 1.4, along: 0.5 })

  /*
   * The green pixelated glazed panel, on the other flank — a mosaic of green-toned glass tiles, the
   * "pixelated" reading the owner's photographs show, same mosaic technique as the dot panel.
   */
  const greenEdge = streetEdges.find((i) => i !== mainEdge && i !== cornerEdge) ?? mainEdge
  const gE = edgeAt(ring, greenEdge)
  const gU0 = gE.L * 0.2
  const gU1 = gE.L * 0.8
  mosaic(out, gE, gU0, gU1, canopyY + 1, roofMain * 0.7, Math.max(6, Math.round((gU1 - gU0) / 1.6)),
    Math.max(6, Math.round((roofMain * 0.7 - canopyY) / 1.6)),
    [[0.16, 0.42, 0.22], [0.24, 0.55, 0.28], [0.30, 0.62, 0.32], [0.10, 0.30, 0.16]], T_GLASS, 0.03)
}
