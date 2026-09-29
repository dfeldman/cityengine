/**
 * The San Francisco Marriott Marquis (Portman/Anshen+Allen, 1989), Mission at 4th (relation/6483285, 133 m, 33
 * levels): "the jukebox". Replaces the `marriottMarquis` `setbacks` preset (ring-tower.ts) with a hand-modelled
 * building — see docs/MARRIOTT-MARQUIS.md for the brief and the four aerial references it was built from.
 *
 * The form is a stepped ziggurat of stacked rectangular masses (not a smooth taper), a smaller L-shaped wing
 * attached to the left, a glass box crowning the ziggurat, vertical window slits with half-round heads
 * repeated on every setback, and — the detail nobody would guess — the final setback (the tower's own core) is
 * OFFSET from the mass below it, opening an enormous full-height slit near the corner.
 *
 * Built with the setback-table loop (`setbackTiers`, parts.ts), `notch` for the offset core and `offsetRing`
 * (never `insetRing`, which is wrong on a notched ring) for every setback. All quantity, no exotic tools.
 */
import type { MeshBuilder } from '../../buildings.ts'
import { capPolygon } from '../../buildings.ts'
import type { Rgb } from '../../models.ts'
import type { Fit } from '../fit.ts'
import { faceBand, towerRing, type Face } from '../tower.ts'
import { edgeAt, longestEdge, notch, offsetRing, setbackTiers } from '../parts.ts'

type P2 = { x: number; z: number }

const WALL: Rgb = [0.68, 0.7, 0.72]
const GLASS: Rgb = [0.24, 0.36, 0.52]
const CROWN_GLASS: Rgb = [0.3, 0.46, 0.6]
const SLIT_GLASS: Rgb = [0.05, 0.07, 0.1]
const SLIT_MOTIF: Rgb = [0.06, 0.09, 0.13]
const ROOF: Rgb = [0.45, 0.45, 0.46]

/** The plausible height, in case the manifest's is missing or off. */
const heightOf = (fit: Fit, h: number): number => (fit.height > 0.6 * h && fit.height < 1.6 * h ? fit.height : h)

/**
 * The signature motif: a tall narrow window slit topped by a half-round (fan) lid, centred on `u` along the
 * edge `e`, recessed slightly into the wall. `archedPane` is its nearest relative but is fixed to a −z plane;
 * this one takes an edge (from `edgeAt`) so it can sit on any wall of the ring at any heading.
 */
function slit(out: MeshBuilder, e: ReturnType<typeof edgeAt>, u: number, y0: number, w: number, h: number, colour: Rgb, frame: Rgb, reveal = 0.9): void {
  const o = -reveal // recessed, i.e. inward along the outward normal
  const px = e.a.x + e.tx * u
  const pz = e.a.z + e.tz * u
  const P = (du: number, y: number, oo = o): [number, number, number] => [px + e.tx * du + e.nx * oo, y, pz + e.tz * du + e.nz * oo]
  const n: [number, number, number] = [e.nx, 0, e.nz]
  const shaftH = h - w / 2
  // the reveal's own cheeks (two side walls and a lintel-less top run into the fan) so the recess actually
  // reads as a hole punched into the mass, not a flat dark decal on the surface
  for (const s of [-1, 1] as const) {
    out.quad([P(s * w / 2, y0, 0), P(s * w / 2, y0, o), P(s * w / 2, y0 + shaftH, o), P(s * w / 2, y0 + shaftH, 0)],
      [e.tx * s, 0, e.tz * s], [[0, 0], [1, 0], [1, 1], [0, 1]], frame, 0)
  }
  // the shaft, at the back of the reveal
  out.quad([P(-w / 2, y0), P(w / 2, y0), P(w / 2, y0 + shaftH), P(-w / 2, y0 + shaftH)], n, [[0, 0], [1, 0], [1, 1], [0, 1]], colour, 0)
  // the half-round lid, a fan of quads at the same recess
  const cy = y0 + shaftH
  const seg = 6
  for (let k = 0; k < seg; k++) {
    const a0 = (k / seg) * Math.PI
    const a1 = ((k + 1) / seg) * Math.PI
    out.quad([
      [px + e.nx * o, cy, pz + e.nz * o],
      [px + e.tx * (Math.cos(a0) * w / 2) + e.nx * o, cy + Math.sin(a0) * w / 2, pz + e.tz * (Math.cos(a0) * w / 2) + e.nz * o],
      [px + e.tx * (Math.cos(a1) * w / 2) + e.nx * o, cy + Math.sin(a1) * w / 2, pz + e.tz * (Math.cos(a1) * w / 2) + e.nz * o],
      [px + e.nx * o, cy, pz + e.nz * o],
    ], n, [[0.5, 0], [0, 1], [1, 1], [0.5, 0]], colour, 0)
  }
}

/** A row of `count` slits evenly spaced along edge `i` of `ring`, `w` wide and `h` tall, from `y0`. */
function slitsOnEdge(out: MeshBuilder, ring: P2[], i: number, y0: number, h: number, count: number, w: number, colour: Rgb, frame: Rgb): void {
  const e = edgeAt(ring, i)
  if (e.L < w * 2) return
  for (let k = 0; k < count; k++) {
    const u = e.L * ((k + 0.5) / count)
    slit(out, e, u, y0, w, h, colour, frame)
  }
}

/**
 * Slits on every edge of the ring long enough to carry them — the motif repeated at each setback. Centred in
 * the tier's height rather than spanning it, so it reads as a punched window rather than a slot the height of
 * the whole storey band.
 */
function dressTier(out: MeshBuilder, ring: P2[], y0: number, y1: number, colour: Rgb, frame: Rgb): void {
  const tierH = y1 - y0
  const h = Math.min(tierH * 0.5, 9)
  const y0s = y0 + (tierH - h) * 0.45
  for (let i = 0; i < ring.length; i++) {
    const e = edgeAt(ring, i)
    if (e.L < 8) continue
    const count = Math.max(1, Math.round(e.L / 12))
    slitsOnEdge(out, ring, i, y0s, h, count, Math.min(3.2, e.L / count * 0.35), colour, frame)
  }
}

export function marriottMarquis_missionAt4th(out: MeshBuilder, fit: Fit): void {
  const H = heightOf(fit, 133)
  /*
   * A CLEAN RECTANGLE, not `fit.ring` traced raw. The real footprint is the "many boxes" ziggurat the brief
   * describes — a genuinely complex, many-cornered outline (32 points baked from `relation/6483285`, and
   * still many-cornered once reduced to the union of its `building:part`s, BUGS.md #171) — and every
   * operation below (`setbackTiers`, `notch`, `offsetRing`) assumes a simple box it can inset and notch
   * uniformly. Fed the raw ring directly, a uniform offset across its reflex corners self-intersects, which
   * is what put detached geometry in the air ("bits flying") rather than a clean setback. `fit.hx`/`fit.hz`
   * (the fitted footprint's own half-extents, already measured from that same ring) give the honest size
   * without the shape that breaks the offset — the "gist" standard the rest of this builder holds to.
   */
  const base = towerRing({ hx: fit.hx || 28, hz: fit.hz || 20, height: H })
  const mainFace: Face = { kind: 'bands', wall: WALL, glass: GLASS, floor: 3.5, solid: 0.35, material: 'concrete' }

  // -----------------------------------------------------------------------------------------------------------
  // 1) the ziggurat: a setback table, each tier drawn in and up from the one below (offsetRing, not insetRing)
  const tiers = [
    { height: H * 0.44, inset: 0 },
    { height: H * 0.16, inset: 3.2 },
    { height: H * 0.12, inset: 3.2 },
    { height: H * 0.1, inset: 3.0 },
  ]
  let topY = 0
  let lastRing: P2[] = base
  for (const t of tiers) {
    const r = setbackTiers(lastRing, topY, [t], (ring, y0, y1) => {
      faceBand(out, ring, y0, y1, mainFace)
      dressTier(out, ring, y0, y1, SLIT_MOTIF, WALL)
    })
    lastRing = r.ring
    topY = r.y
  }
  // the tier-below-the-core's roof, where the ziggurat still reads as full width
  capPolygon(out, lastRing, topY, ROOF, 0)

  // -----------------------------------------------------------------------------------------------------------
  // 5) the final setback: the main tower's CORE, offset from the ziggurat below it, via `notch`. The corner
  // nearest Mission Street (the longest edge) is where the offset opens its enormous full-height slit.
  const cornerEdge = longestEdge(lastRing)
  const cornerIdx = cornerEdge
  const { ring: notched, cut } = notch(lastRing, { corner: cornerIdx }, { wide: 0.22, deep: 0.22 })
  let coreRing = offsetRing(notched, -2.4)
  const coreH0 = topY
  const coreH1 = H - H * 0.06 // leave room for the glass crown
  faceBand(out, coreRing, coreH0, coreH1, mainFace)
  dressTier(out, coreRing, coreH0, coreH1, SLIT_MOTIF, WALL)
  capPolygon(out, coreRing, coreH1, ROOF, 0)

  // the slit itself: the notch's own cut polygon, drawn as a deep, dark, glazed reveal running the full
  // height of the core and the crown above it — the gap nobody would guess from the street. (No cap at its
  // base: the tier below's own roof, already capped above, is the floor of this reveal.)
  const slitTop = H
  faceBand(out, cut, coreH0, slitTop, { kind: 'blank', wall: SLIT_GLASS })

  // -----------------------------------------------------------------------------------------------------------
  // 3) the glass box crowning the ziggurat
  const crownRing = offsetRing(coreRing, -1.2)
  faceBand(out, crownRing, coreH1, H, { kind: 'curtain', wall: CROWN_GLASS, glass: CROWN_GLASS, floor: (H - coreH1), solid: 0.05 })
  capPolygon(out, crownRing, H, CROWN_GLASS, 0)

  // -----------------------------------------------------------------------------------------------------------
  // 2) the smaller L-shaped wing to the left, connected to the main mass, its own (shorter) setbacks
  const front = edgeAt(base, longestEdge(base))
  const wingDepth = Math.min(24, front.L * 0.28)
  const wingWidth = Math.min(30, front.L * 0.34)
  /*
   * Extends past the 'a' end of the frontage (to the left, along −tangent), INWARD (−normal, the same side
   * the main mass's own depth is on) with a generous overlap back across the frontage line — so the wing's
   * footprint genuinely overlaps the main tower's rather than merely touching a single corner, and the two
   * read as one L-shaped building rather than two boxes that happen to kiss.
   */
  const overlap = Math.max(6, wingWidth * 0.25)
  const wingBase: P2[] = [
    { x: front.a.x - front.tx * wingWidth, z: front.a.z - front.tz * wingWidth },
    { x: front.a.x + front.tx * overlap, z: front.a.z + front.tz * overlap },
    { x: front.a.x + front.tx * overlap - front.nx * wingDepth, z: front.a.z + front.tz * overlap - front.nz * wingDepth },
    { x: front.a.x - front.tx * wingWidth - front.nx * wingDepth, z: front.a.z - front.tz * wingWidth - front.nz * wingDepth },
  ]
  const wingH = H * 0.52
  const wingTiers = [
    { height: wingH * 0.62, inset: 0 },
    { height: wingH * 0.22, inset: 2.4 },
    { height: wingH * 0.16, inset: 2.2 },
  ]
  let wy = 0
  let wRing = wingBase
  for (const t of wingTiers) {
    const r = setbackTiers(wRing, wy, [t], (ring, y0, y1) => {
      faceBand(out, ring, y0, y1, mainFace)
      dressTier(out, ring, y0, y1, SLIT_MOTIF, WALL)
    })
    wRing = r.ring
    wy = r.y
  }
  capPolygon(out, wRing, wy, ROOF, 0)
}
