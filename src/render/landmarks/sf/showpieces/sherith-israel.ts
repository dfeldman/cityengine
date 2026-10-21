/**
 * Congregation Sherith Israel (Albert Pissis, 1905), 2266 California Street at Webster — rebuilt by hand from the
 * Mapillary frames in p2/refs/way-32965008/ (2026-10-21). It replaces kit-churches.ts's `church()` call, which put
 * a Christian cross on top of the synagogue's dome. This is a synagogue: nothing stands on the dome (the frames
 * show it bare), and nothing here is borrowed from the church kit.
 *
 * What the frames show:
 *  - honey-brown rock-faced sandstone, Romanesque / Byzantine Revival, on a square-ish plan with gabled arms;
 *  - the CALIFORNIA FRONT: a broad, low pediment across the whole front over a GREAT ROUND ARCH in stepped orders on
 *    engaged columns, the arch holding a large ROSE window with wheel tracery; under the rose an arcade of five small
 *    arched windows behind a balustraded BALCONY; under that the TRIPLE-ARCHED PORTAL — three deep round arches on
 *    columns standing on pedestals — up a broad flight of granite STEPS; the flanking corner PIERS with pairs of arched
 *    windows a storey, a single tall arched window high up, quoined corners, string courses, a modillioned cornice;
 *  - the WEBSTER SIDE: a second gabled arm with the same great arch, this one round a tall arched window, its arcade
 *    and balcony, three arched windows below;
 *  - the other walls: arched windows in three tiers between pilaster strips, the same courses and cornice;
 *  - the DOME over the sanctuary at the crossing: a drum ringed with small arched windows between pilasters under a
 *    cornice, and a smooth grey metal dome (frames 02, 03, 04, 08 — grey, not terracotta, and not ribbed);
 *  - on the east, a lower annex block (frame 02, right of the main block).
 *
 * The frame: the outline is used as given and its faces are FOUND on it — the portal bay is the most outward of the
 * edges facing −z (the manifest's front, 171° toward California), the Webster arm the most outward of those facing
 * −x — and everything is laid out in the portal edge's own frame: `u` along the front, `o` out of it (negative into
 * the building), y up from the model's base, with street-level work at `fit.grade`.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { capPolygon } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { prism, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { classicalColumn } from '../../column.ts'
import { beam } from '../../kit.ts'
import { stair } from '../../parts.ts'
import { simplifyRing } from '../districts/market-west.ts'

type P2 = { x: number; z: number }
type V3 = [number, number, number]
const FIXED = 0
const T = { stone: surfaceTag('ashlar'), granite: surfaceTag('granite'), metal: surfaceTag('metal') }
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

// the honey-brown sandstone in the frames' sun, its dressed trim a shade paler, its reveals in shadow
const STONE: Rgb = [0.51, 0.45, 0.37]
const TRIM: Rgb = [0.58, 0.52, 0.43]
const RUSTIC: Rgb = [0.46, 0.41, 0.34]
const JOINT: Rgb = [0.38, 0.33, 0.27]
const REVEAL: Rgb = [0.42, 0.37, 0.3]
const GLASS: Rgb = [0.15, 0.16, 0.19]
const DOOR: Rgb = [0.22, 0.15, 0.1]
const GRANITE: Rgb = [0.7, 0.69, 0.66]
/** the dome: grey sheet metal (lead/zinc), smooth */
const DOME: Rgb = [0.48, 0.5, 0.53]
const ROOF: Rgb = [0.44, 0.43, 0.42]

/** Heights over the grade at the front, metres. */
const Y = {
  floor: 1.1,       // the portal's floor, at the head of the steps
  pSpring: 4.6,     // the portal arches spring (crowns at 5.9)
  balc: 7.4,        // the top of the balcony's cornice slab under the great arch
  sill: 7.4,        // the great arch's recess starts (the balcony floor)
  arc0: 9.0,        // the little arcade under the rose
  arc1: 10.3,
  band: 10.75,      // the band between the arcade and the rose
  storey: 6.1,      // the sill course under the piers' first-floor windows
  string: 13.0,     // the piers' string course, at the great arch's springing
  spring: 13.0,     // the great arch springs
  rose: 13.7,       // the rose's centre
  eaves: 19.2,      // the piers' cornice, where the pediment's rakes start
  apex: 23.2,       // the front pediment's apex
  annex: 12.4,      // the east annex's cornice
}

// ------------------------------------------------------------------------------------------- an edge's frame

/** A wall's frame: `u` along it from `o`rigin, `o` outward (negative into the building), y up. */
interface Fr { ox: number; oz: number; tx: number; tz: number; nx: number; nz: number; L: number }

const frameOf = (a: P2, b: P2): Fr => {
  const L = Math.hypot(b.x - a.x, b.z - a.z) || 1
  const tx = (b.x - a.x) / L
  const tz = (b.z - a.z) / L
  return { ox: a.x, oz: a.z, tx, tz, nx: tz, nz: -tx, L }
}
const P = (f: Fr, u: number, o: number, y: number): V3 => [f.ox + f.tx * u + f.nx * o, y, f.oz + f.tz * u + f.nz * o]
const pt = (f: Fr, u: number, o: number): P2 => ({ x: f.ox + f.tx * u + f.nx * o, z: f.oz + f.tz * u + f.nz * o })
/** where a point lies in a frame */
const inFr = (f: Fr, p: P2): { u: number; o: number } =>
  ({ u: (p.x - f.ox) * f.tx + (p.z - f.oz) * f.tz, o: (p.x - f.ox) * f.nx + (p.z - f.oz) * f.nz })
/** a direction in the frame's (u, y, o) made world */
const dir = (f: Fr, du: number, dy: number, dn: number): V3 => [f.tx * du + f.nx * dn, dy, f.tz * du + f.nz * dn]

/** A block in a frame: `u0..u1` along, `o0..o1` out, `y0..y1` up; `bottom` false drops the underside. */
function slab(out: MeshBuilder, f: Fr, u0: number, u1: number, o0: number, o1: number, y0: number, y1: number, c: Rgb, tag = FIXED, bottom = true): void {
  const Q = (u: number, o: number, y: number) => P(f, u, o, y)
  out.quad([Q(u0, o1, y0), Q(u1, o1, y0), Q(u1, o1, y1), Q(u0, o1, y1)], dir(f, 0, 0, 1), UV, c, tag)
  out.quad([Q(u1, o0, y0), Q(u0, o0, y0), Q(u0, o0, y1), Q(u1, o0, y1)], dir(f, 0, 0, -1), UV, c, tag)
  out.quad([Q(u0, o0, y0), Q(u0, o1, y0), Q(u0, o1, y1), Q(u0, o0, y1)], dir(f, -1, 0, 0), UV, c, tag)
  out.quad([Q(u1, o1, y0), Q(u1, o0, y0), Q(u1, o0, y1), Q(u1, o1, y1)], dir(f, 1, 0, 0), UV, c, tag)
  out.quad([Q(u0, o0, y1), Q(u0, o1, y1), Q(u1, o1, y1), Q(u1, o0, y1)], [0, 1, 0], UV, c, tag)
  if (bottom) out.quad([Q(u0, o1, y0), Q(u0, o0, y0), Q(u1, o0, y0), Q(u1, o1, y0)], [0, -1, 0], UV, c, tag)
}

/** A small block against a wall (a modillion, a quoin): its face, its two sides and its underside — the faces that show. */
function stub(out: MeshBuilder, f: Fr, u0: number, u1: number, o1: number, y0: number, y1: number, c: Rgb, tag = FIXED, under = true): void {
  const Q = (u: number, o: number, y: number) => P(f, u, o, y)
  out.quad([Q(u0, o1, y0), Q(u1, o1, y0), Q(u1, o1, y1), Q(u0, o1, y1)], dir(f, 0, 0, 1), UV, c, tag)
  out.quad([Q(u0, 0, y0), Q(u0, o1, y0), Q(u0, o1, y1), Q(u0, 0, y1)], dir(f, -1, 0, 0), UV, c, tag)
  out.quad([Q(u1, o1, y0), Q(u1, 0, y0), Q(u1, 0, y1), Q(u1, o1, y1)], dir(f, 1, 0, 0), UV, c, tag)
  if (under) out.quad([Q(u0, o1, y0), Q(u0, 0, y0), Q(u1, 0, y0), Q(u1, o1, y0)], [0, -1, 0], UV, c, tag)
}

/** A flat rectangle facing out of the wall, `o` off it. */
function panel(out: MeshBuilder, f: Fr, u0: number, u1: number, o: number, y0: number, y1: number, c: Rgb, tag = FIXED): void {
  if (u1 - u0 < 0.01 || y1 - y0 < 0.01) return
  out.quad([P(f, u0, o, y0), P(f, u1, o, y0), P(f, u1, o, y1), P(f, u0, o, y1)], dir(f, 0, 0, 1), UV, c, tag)
}

/** A round-headed shape `w` wide, `h` tall from `y0`, centred `u`, facing out at `o`: a rectangle and a half-disc. */
function arch(out: MeshBuilder, f: Fr, u: number, o: number, y0: number, w: number, h: number, c: Rgb, seg = 6, tag = FIXED): void {
  const r = w / 2
  const spring = y0 + h - r
  if (spring > y0) panel(out, f, u - r, u + r, o, y0, spring, c, tag)
  for (let i = 0; i < seg; i++) {
    const a0 = Math.PI - (i / seg) * Math.PI
    const a1 = Math.PI - ((i + 1) / seg) * Math.PI
    out.quad([P(f, u, o, spring), P(f, u + Math.cos(a0) * r, o, spring + Math.sin(a0) * r), P(f, u + Math.cos(a1) * r, o, spring + Math.sin(a1) * r), P(f, u, o, spring)],
      dir(f, 0, 0, 1), UV, c, tag)
  }
}

/** The ring of an arch between radii `r0` and `r1` round (u, spring), facing out at `o`: an archivolt, a hood mould. */
function archRing(out: MeshBuilder, f: Fr, u: number, spring: number, r0: number, r1: number, o: number, c: Rgb, seg = 8, tag = FIXED): void {
  for (let i = 0; i < seg; i++) {
    const a0 = (i / seg) * Math.PI
    const a1 = ((i + 1) / seg) * Math.PI
    const at = (r: number, a: number): V3 => P(f, u + Math.cos(a) * r, o, spring + Math.sin(a) * r)
    out.quad([at(r0, a0), at(r1, a0), at(r1, a1), at(r0, a1)], dir(f, 0, 0, 1), UV, c, tag)
  }
}

/** A full ring (a rose window's frame) round (u, y), facing out at `o`. */
function circleRing(out: MeshBuilder, f: Fr, u: number, y: number, r0: number, r1: number, o: number, c: Rgb, seg = 16, tag = FIXED): void {
  for (let i = 0; i < seg; i++) {
    const a0 = (i / seg) * Math.PI * 2
    const a1 = ((i + 1) / seg) * Math.PI * 2
    const at = (r: number, a: number): V3 => P(f, u + Math.cos(a) * r, o, y + Math.sin(a) * r)
    out.quad([at(r0, a0), at(r1, a0), at(r1, a1), at(r0, a1)], dir(f, 0, 0, 1), UV, c, tag)
  }
}

/**
 * The wall of a face from `y0` to `y1` across `u0..u1` with round-headed HOLES cut in it (each `w` wide from its
 * sill `ys`, springing at `sp`): the piers between the holes, the wall under each, the spandrels over each arch.
 */
function holedWall(out: MeshBuilder, f: Fr, u0: number, u1: number, y0: number, y1: number, holes: { u: number; w: number; ys: number; sp: number }[],
                   o: number, c: Rgb, tag: number, seg = 8): void {
  const hs = [...holes].sort((a, b) => a.u - b.u)
  let at = u0
  for (const h of hs) {
    const r = h.w / 2
    panel(out, f, at, h.u - r, o, y0, y1, c, tag)
    panel(out, f, h.u - r, h.u + r, o, y0, h.ys, c, tag)
    for (let i = 0; i < seg; i++) {
      const a0 = Math.PI - (i / seg) * Math.PI
      const a1 = Math.PI - ((i + 1) / seg) * Math.PI
      const ua0 = h.u + Math.cos(a0) * r
      const ua1 = h.u + Math.cos(a1) * r
      out.quad([P(f, ua0, o, h.sp + Math.sin(a0) * r), P(f, ua1, o, h.sp + Math.sin(a1) * r), P(f, ua1, o, y1), P(f, ua0, o, y1)],
        dir(f, 0, 0, 1), UV, c, tag)
    }
    at = h.u + r
  }
  panel(out, f, at, u1, o, y0, y1, c, tag)
}

/** The reveal of a round-headed hole from `o0` back to `o1`: its two jambs and the arch's soffit, facing in. */
function reveal(out: MeshBuilder, f: Fr, u: number, w: number, ys: number, sp: number, o0: number, o1: number, c: Rgb, seg = 8, tag = FIXED): void {
  const r = w / 2
  if (sp > ys) {
    out.quad([P(f, u - r, o0, ys), P(f, u - r, o1, ys), P(f, u - r, o1, sp), P(f, u - r, o0, sp)], dir(f, 1, 0, 0), UV, c, tag)
    out.quad([P(f, u + r, o1, ys), P(f, u + r, o0, ys), P(f, u + r, o0, sp), P(f, u + r, o1, sp)], dir(f, -1, 0, 0), UV, c, tag)
  }
  for (let i = 0; i < seg; i++) {
    const a0 = (i / seg) * Math.PI
    const a1 = ((i + 1) / seg) * Math.PI
    const am = (a0 + a1) / 2
    const at = (a: number, o: number): V3 => P(f, u + Math.cos(a) * r, o, sp + Math.sin(a) * r)
    out.quad([at(a0, o0), at(a0, o1), at(a1, o1), at(a1, o0)], dir(f, -Math.cos(am), -Math.sin(am), 0), UV, c, tag)
  }
}

/** A window: the dressed surround, the dark glass, its sill. */
function window_(out: MeshBuilder, f: Fr, u: number, y0: number, w: number, h: number): void {
  arch(out, f, u, 0.04, y0 - 0.12, w + 0.36, h + 0.3, TRIM, 6)
  arch(out, f, u, 0.06, y0, w, h, GLASS, 6)
  slab(out, f, u - w / 2 - 0.25, u + w / 2 + 0.25, 0, 0.18, y0 - 0.3, y0 - 0.12, TRIM, T.stone, false)
}

/** A pair of arched windows under one sill, a colonnette between. */
function pair(out: MeshBuilder, f: Fr, u: number, y0: number, w: number, h: number): void {
  for (const s of [-1, 1]) window_(out, f, u + s * (w / 2 + 0.22), y0, w, h)
  panel(out, f, u - 0.1, u + 0.1, 0.07, y0, y0 + h - w / 2, TRIM)
}

/** Quoins up a corner at `u` (the blocks alternating long and short along the wall). */
function quoins(out: MeshBuilder, f: Fr, u: number, side: 1 | -1, y0: number, y1: number): void {
  let k = 0
  for (let y = y0; y < y1 - 0.4; y += 0.7, k++) {
    const len = k % 2 === 0 ? 1.0 : 0.6
    const ua = side > 0 ? u : u - len
    stub(out, f, ua, ua + len, 0.08, y + 0.04, y + 0.66, TRIM, T.stone, false)
  }
}

/** A row of modillions under a cornice from `u0` to `u1`. */
function modillions(out: MeshBuilder, f: Fr, u0: number, u1: number, y: number, o = 0): void {
  const n = Math.max(1, Math.floor((u1 - u0) / 0.85))
  const step = (u1 - u0) / n
  for (let i = 0; i <= n; i++) {
    const u = u0 + i * step
    stub(out, f, u - 0.11, u + 0.11, o + 0.42, y - 0.32, y, TRIM)
  }
}

/** The main cornice along a wall: frieze, modillions, the corona. */
function cornice(out: MeshBuilder, f: Fr, u0: number, u1: number, y: number, rich: boolean): void {
  panel(out, f, u0, u1, 0.03, y - 1.2, y - 0.95, JOINT)
  slab(out, f, u0 - 0.1, u1 + 0.1, -0.2, 0.2, y - 0.95, y - 0.6, TRIM, T.stone, false)
  if (rich) modillions(out, f, u0 + 0.3, u1 - 0.3, y - 0.6, 0.15)
  slab(out, f, u0 - 0.4, u1 + 0.4, -0.3, 0.65, y - 0.6, y, TRIM, T.stone)
}

// ------------------------------------------------------------------------------------------- the walls

/**
 * One plain wall of the outline: the ashlar to its top, the water table and plinth, the string courses, and — if it
 * is long enough — bays of arched windows in three tiers between pilaster strips. `ground` gives the ground under a
 * point of it (the frames show Webster climbing north along the west wall).
 */
function plainWall(out: MeshBuilder, f: Fr, G: number, top: number, ground: (p: P2) => number, opts: { from?: number; rich?: boolean; windows?: boolean } = {}): void {
  const L = f.L
  const from = opts.from ?? 0
  panel(out, f, 0, L, 0, from, top, STONE, T.stone)
  if (L < 2.5) return
  const gHi = Math.max(ground(pt(f, 0, 0)), ground(pt(f, L, 0)), ground(pt(f, L / 2, 0)))
  if (from < 0.5) {
    slab(out, f, -0.05, L + 0.05, 0, 0.18, 0, gHi + 1.2, RUSTIC, T.stone, false)
    slab(out, f, -0.08, L + 0.08, 0, 0.26, gHi + 1.2, gHi + 1.45, TRIM, T.stone, false)
  }
  if (top > G + Y.string + 0.6 && from < G + Y.string) slab(out, f, -0.1, L + 0.1, 0, 0.22, G + Y.string - 0.2, G + Y.string + 0.2, TRIM, T.stone, false)
  if (top > G + Y.storey + 0.4 && from < G + Y.storey) slab(out, f, -0.05, L + 0.05, 0, 0.15, G + Y.storey - 0.12, G + Y.storey + 0.12, TRIM, T.stone, false)
  cornice(out, f, 0, L, top, opts.rich ?? false)
  if (opts.windows === false || L < 3.4) return
  const n = Math.max(1, Math.round(L / 4.6))
  const bay = L / n
  for (let i = 0; i <= n; i++) {
    if (i === 0 || i === n) continue
    slab(out, f, i * bay - 0.3, i * bay + 0.3, 0, 0.14, Math.max(from, gHi + 1.45), top - 1.2, STONE, T.stone, false)
  }
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) * bay
    const gy = ground(pt(f, u, 0))
    const tiers: [number, number, number][] = [[Math.max(G, gy) + 2.5, 1.0, 2.4], [G + 6.6, 1.3, 3.8], [G + 14.4, 1.1, 2.7]]
    for (const [y0, w, h] of tiers) if (y0 > from + 0.4 && y0 + h < top - 1.4) window_(out, f, u, y0, Math.min(w, bay * 0.4), h)
  }
}

/** A corner pier of the front: plinth, quoins at its outer corner, paired windows in two storeys, the high window. */
function pierFace(out: MeshBuilder, f: Fr, G: number, outerAt: 'start' | 'end', ground: (p: P2) => number): void {
  const L = f.L
  const gy = Math.max(G, ground(pt(f, L / 2, 0)))
  panel(out, f, 0, L, 0, 0, G + Y.eaves, STONE, T.stone)
  slab(out, f, -0.05, L + 0.05, 0, 0.22, 0, gy + 1.3, RUSTIC, T.stone, false)
  slab(out, f, -0.08, L + 0.08, 0, 0.3, gy + 1.3, gy + 1.55, TRIM, T.stone, false)
  slab(out, f, -0.05, L + 0.05, 0, 0.18, G + Y.storey - 0.12, G + Y.storey + 0.12, TRIM, T.stone, false)
  // the heavy string course at the great arch's springing, a cornice in its own right
  slab(out, f, -0.1, L + 0.1, 0, 0.3, G + Y.string - 0.35, G + Y.string, TRIM, T.stone, false)
  slab(out, f, -0.15, L + 0.15, 0, 0.45, G + Y.string, G + Y.string + 0.25, TRIM, T.stone)
  quoins(out, f, outerAt === 'start' ? 0 : L, outerAt === 'start' ? 1 : -1, gy + 1.55, G + Y.eaves - 1.2)
  // the pilaster strip at its inner edge, against the centre bay
  const inner = outerAt === 'start' ? L : 0
  slab(out, f, inner - 0.45, inner + 0.45, 0, 0.2, gy + 1.55, G + Y.eaves - 1.2, STONE, T.stone, false)
  if (L < 4) return
  const u = L / 2 + (outerAt === 'start' ? -0.2 : 0.2)
  pair(out, f, u, gy + 2.5, 1.0, 2.5)
  pair(out, f, u, G + 6.5, 1.15, 3.0)
  window_(out, f, u, G + 14.4, 1.0, 2.6)
  // the narrow slit window by the centre bay, over the portal's springing
  window_(out, f, outerAt === 'start' ? L - 1.3 : 1.3, G + 9.0, 0.5, 2.0)
  cornice(out, f, 0, L, G + Y.eaves, true)
}

// ------------------------------------------------------------------------------------------- an arm's face

/**
 * The centre of a gabled arm's face, on its own edge: the great arch in its stepped orders on engaged columns, the
 * recess behind it with the rose (front) or the tall arched window (Webster), the arcade and the balcony under it,
 * and below — the triple portal and its steps on the front, three arched windows on the side.
 */
function armFace(out: MeshBuilder, f: Fr, G: number, kind: 'front' | 'side', ground: (p: P2) => number): void {
  const L = f.L
  const uc = L / 2
  const R0 = Math.min(5.3, L / 2 - 0.3)         // the great arch's outer opening
  const R1 = R0 - 0.8                           // its inner order
  const sp = G + Y.spring
  const deep = 1.0
  const top = G + Y.eaves
  // ---- the lower storey: the portal arches or three windows, in the wall up to the balcony
  const pw = 2.6
  const pier = (L - 3 * pw) / 4
  const portal = [0, 1, 2].map((k) => ({ u: pier + pw / 2 + k * (pw + pier), w: pw, ys: G + Y.floor, sp: G + Y.pSpring }))
  if (kind === 'front') {
    holedWall(out, f, 0, L, 0, G + Y.balc, portal, 0, STONE, T.stone)
    for (const h of portal) {
      reveal(out, f, h.u, h.w, h.ys, h.sp, 0, -1.5, REVEAL, 8, T.stone)
      arch(out, f, h.u, -1.5, h.ys, h.w, h.sp + h.w / 2 - h.ys, DOOR, 8)
      // the doors' transom and the fanlight over them
      panel(out, f, h.u - h.w / 2, h.u + h.w / 2, -1.45, h.sp - 0.15, h.sp, TRIM)
      // the floor of the porch, at the head of the steps
      out.quad([P(f, h.u - h.w / 2, 0, h.ys), P(f, h.u + h.w / 2, 0, h.ys), P(f, h.u + h.w / 2, -1.5, h.ys), P(f, h.u - h.w / 2, -1.5, h.ys)], [0, 1, 0], UV, GRANITE, T.granite)
      // the archivolt in two orders, and its hood
      archRing(out, f, h.u, h.sp, h.w / 2, h.w / 2 + 0.35, 0.04, TRIM, 8)
      archRing(out, f, h.u, h.sp, h.w / 2 + 0.35, h.w / 2 + 0.6, 0.08, STONE, 8, T.stone)
      archRing(out, f, h.u, h.sp, h.w / 2 + 0.6, h.w / 2 + 0.78, 0.14, TRIM, 8)
    }
    // the pedestals between and beside the arches, each carrying a column whose capital meets the springing
    const heading = Math.atan2(f.nx, f.nz)
    for (let k = 0; k < 4; k++) {
      const u = k * (pw + pier) + pier / 2
      slab(out, f, u - 0.55, u + 0.55, 0, 2.3, 0, G + Y.floor + 0.25, RUSTIC, T.stone)
      slab(out, f, u - 0.62, u + 0.62, -0.05, 2.37, G + Y.floor + 0.25, G + Y.floor + 0.45, TRIM, T.stone, false)
      const c = pt(f, u, 0.45)
      classicalColumn(out, c.x, c.z, G + Y.floor + 0.45, G + Y.pSpring - 0.35, 0.3, TRIM, { order: 'corinthian', tier: 'mid', tag: T.stone, heading })
      slab(out, f, u - 0.5, u + 0.5, -0.05, 0.85, G + Y.pSpring - 0.35, G + Y.pSpring, TRIM, T.stone)
    }
    // the steps: a broad granite flight across the whole portal, up to the porch floor
    stair(out, pt(f, 0, 0), pt(f, L, 0), G, G + Y.floor, { anchor: 'top', riser: 0.16, run: 2.2, colour: GRANITE, material: 'granite' })
    // the plinth under the steps' ends, so the flight does not hang where the street falls away
    const gl = ground(pt(f, 0, 2.2))
    if (gl < G - 0.2) slab(out, f, -0.2, L + 0.2, 0, 2.3, gl, G, RUSTIC, T.stone)
  } else {
    const gy = Math.max(G, ground(pt(f, uc, 0)))
    panel(out, f, 0, L, 0, 0, G + Y.balc, STONE, T.stone)
    slab(out, f, -0.05, L + 0.05, 0, 0.22, 0, gy + 1.3, RUSTIC, T.stone, false)
    slab(out, f, -0.08, L + 0.08, 0, 0.3, gy + 1.3, gy + 1.55, TRIM, T.stone, false)
    for (const h of portal) window_(out, f, h.u, gy + 2.4, 1.3, 3.6)
  }
  // the band over the lower storey, which is the balcony's cornice across the arch
  slab(out, f, -0.1, L + 0.1, -0.2, 0.35, G + Y.balc - 0.4, G + Y.balc, TRIM, T.stone, false)

  // ---- the upper wall with the great arch cut in it, and the recess behind
  holedWall(out, f, 0, L, G + Y.balc, top, [{ u: uc, w: 2 * R0, ys: G + Y.sill, sp }], 0, STONE, T.stone, 12)
  reveal(out, f, uc, 2 * R0, G + Y.sill, sp, 0, -0.4, REVEAL, 12, T.stone)
  // the inner order: a face ring and jambs at −0.4, then the inner reveal back to the recess
  archRing(out, f, uc, sp, R1, R0, -0.4, TRIM, 12)
  panel(out, f, uc - R0, uc - R1, -0.4, G + Y.sill, sp, TRIM)
  panel(out, f, uc + R1, uc + R0, -0.4, G + Y.sill, sp, TRIM)
  reveal(out, f, uc, 2 * R1, G + Y.sill, sp, -0.4, -deep, REVEAL, 12, T.stone)
  // the hood mould round the outside
  archRing(out, f, uc, sp, R0, R0 + 0.3, 0.08, TRIM, 12)
  // the recess's back wall
  arch(out, f, uc, -deep, G + Y.sill, 2 * R1, sp + R1 - (G + Y.sill), STONE, 12, T.stone)
  // the engaged columns in the outer order's jambs, up to the springing, their imposts
  for (const s of [-1, 1]) {
    const c = pt(f, uc + s * (R0 - 0.3), -0.2)
    classicalColumn(out, c.x, c.z, G + Y.sill, sp - 0.4, 0.26, TRIM, { order: 'corinthian', tier: 'mid', tag: T.stone, heading: Math.atan2(f.nx, f.nz) })
    slab(out, f, uc + s * (R0 - 0.3) - 0.45, uc + s * (R0 - 0.3) + 0.45, -0.6, 0.25, sp - 0.4, sp, TRIM, T.stone)
  }
  const back = -deep + 0.02
  // the arcade of five little arched windows on the back wall, colonnettes between
  const aw = Math.min(0.95, (2 * R1 - 1.0) / 5 - 0.5)
  const ap = (2 * R1 - 1.0) / 5
  for (let k = 0; k < 5; k++) {
    const u = uc - R1 + 0.5 + ap * (k + 0.5)
    arch(out, f, u, back + 0.02, G + Y.arc0 - 0.1, aw + 0.3, Y.arc1 - Y.arc0 + 0.25, TRIM, 6)
    arch(out, f, u, back + 0.04, G + Y.arc0, aw, Y.arc1 - Y.arc0, GLASS, 6)
  }
  slab(out, f, uc - R1, uc + R1, back, back + 0.3, G + Y.band - 0.15, G + Y.band + 0.15, TRIM, T.stone, false)
  if (kind === 'front') {
    // the ROSE: a wheel of twelve spokes round a hub, in a moulded ring
    const ry = G + Y.rose
    const rr = Math.min(2.3, R1 - 1.9)
    circleRing(out, f, uc, ry, rr, rr + 0.38, back + 0.05, TRIM, 20)
    circleRing(out, f, uc, ry, 0, rr, back + 0.03, GLASS, 20)
    circleRing(out, f, uc, ry, rr * 0.55, rr * 0.55 + 0.1, back + 0.06, TRIM, 16)
    circleRing(out, f, uc, ry, 0, rr * 0.2, back + 0.07, TRIM, 10)
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2
      const ca = Math.cos(a)
      const sa = Math.sin(a)
      const w = 0.06
      const r0 = rr * 0.2
      const r1 = rr
      out.quad([P(f, uc + ca * r0 - sa * w, back + 0.06, ry + sa * r0 + ca * w), P(f, uc + ca * r0 + sa * w, back + 0.06, ry + sa * r0 - ca * w),
        P(f, uc + ca * r1 + sa * w, back + 0.06, ry + sa * r1 - ca * w), P(f, uc + ca * r1 - sa * w, back + 0.06, ry + sa * r1 + ca * w)], dir(f, 0, 0, 1), UV, TRIM, FIXED)
      // the petal's round head against the outer ring
      circleRing(out, f, uc + Math.cos(a + Math.PI / 12) * rr * 0.78, ry + Math.sin(a + Math.PI / 12) * rr * 0.78, 0.26, 0.33, back + 0.06, TRIM, 6)
    }
    // the carved panels either side of the rose
    for (const s of [-1, 1]) panel(out, f, uc + s * (rr + 0.7) - 0.35, uc + s * (rr + 0.7) + 0.35, back + 0.03, G + Y.band + 0.6, G + Y.rose + 1.6, TRIM)
  } else {
    // a tall round-arched window of three lights under the arch
    const ww = Math.min(4.2, 2 * R1 - 1.2)
    const y0 = G + Y.band + 0.7
    const h = sp + R1 - 0.6 - y0
    arch(out, f, uc, back + 0.03, y0 - 0.15, ww + 0.4, h + 0.3, TRIM, 10)
    arch(out, f, uc, back + 0.05, y0, ww, h, GLASS, 10)
    for (const s of [-1, 1]) panel(out, f, uc + s * ww / 6 - 0.07, uc + s * ww / 6 + 0.07, back + 0.07, y0, y0 + h - ww / 2 + 0.6, TRIM)
    panel(out, f, uc - ww / 2, uc + ww / 2, back + 0.07, y0 + h - ww / 2 - 0.05, y0 + h - ww / 2 + 0.07, TRIM)
  }
  // ---- the balcony across the foot of the recess: its floor, plinth, balusters, rail
  slab(out, f, uc - R0 - 0.2, uc + R0 + 0.2, -deep, 0.55, G + Y.balc, G + Y.sill, TRIM, T.stone)
  const b0 = G + Y.sill
  const b1 = b0 + 1.0
  slab(out, f, uc - R0, uc + R0, 0.1, 0.45, b1 - 0.15, b1, TRIM, T.stone)
  panel(out, f, uc - R0, uc + R0, 0.16, b0, b1 - 0.15, REVEAL)
  for (let u = uc - R0 + 0.15; u <= uc + R0 - 0.1; u += 0.32) panel(out, f, u - 0.07, u + 0.07, 0.4, b0, b1 - 0.15, TRIM)
  for (const s of [-1, 1]) slab(out, f, uc + s * R0 - 0.25, uc + s * R0 + 0.25, 0.05, 0.5, b0, b1 + 0.1, TRIM, T.stone)
  // ---- the top of the face: a coping back to the pediment, no cornice — the great arch rises into the pediment
  slab(out, f, -0.1, L + 0.1, -1.3, 0.25, top - 0.35, top, TRIM, T.stone)
}

// ------------------------------------------------------------------------------------------- gables and roofs

/** A gable on the edge frame `f` (its face at o = 0) from u0 to u1, its apex `rise` over `y` at the middle. */
function gable(out: MeshBuilder, f: Fr, u0: number, u1: number, y: number, rise: number, rich: boolean): void {
  const um = (u0 + u1) / 2
  const A = P(f, u0, 0, y)
  const B = P(f, u1, 0, y)
  const C = P(f, um, 0, y + rise)
  out.quad([A, B, C, C], dir(f, 0, 0, 1), UV, STONE, T.stone)
  // the raking cornices, square beams along the slopes, and their modillions
  const half = (u1 - u0) / 2
  const len = Math.hypot(half, rise)
  for (const s of [-1, 1]) {
    const ue = s < 0 ? u0 - 0.4 : u1 + 0.4
    const ye = y - 0.1
    beam(out, P(f, ue, 0.2, ye), P(f, um, 0.2, y + rise + 0.25), 0.48, TRIM, 0.32)
    if (rich) {
      const n = Math.floor(len / 0.85)
      for (let i = 1; i < n; i++) {
        const t = i / n
        const u = (s < 0 ? u0 : u1) + (um - (s < 0 ? u0 : u1)) * t
        const yy = y + rise * t - 0.3
        stub(out, f, u - 0.1, u + 0.1, 0.4, yy - 0.3, yy, TRIM)
      }
    }
  }
}

/** A ridged roof in a frame over u0..u1 × o0..o1, its ridge along `o` at the middle of `u`, rising `rise` from `y`. */
function ridgeRoof(out: MeshBuilder, f: Fr, u0: number, u1: number, o0: number, o1: number, y: number, rise: number, c: Rgb): void {
  const um = (u0 + u1) / 2
  const run = (u1 - u0) / 2
  const k = Math.hypot(run, rise) || 1
  out.quad([P(f, u0, o0, y), P(f, u0, o1, y), P(f, um, o1, y + rise), P(f, um, o0, y + rise)], dir(f, -rise / k, run / k, 0), UV, c, T.metal)
  out.quad([P(f, u1, o1, y), P(f, u1, o0, y), P(f, um, o0, y + rise), P(f, um, o1, y + rise)], dir(f, rise / k, run / k, 0), UV, c, T.metal)
}

// ------------------------------------------------------------------------------------------- the dome

/** A dome of stacked rings in metal: `r` at its foot, `h` high, smooth. */
function metalDome(out: MeshBuilder, c: P2, y0: number, r: number, h: number, sides: number): void {
  const rings = 7
  for (let k = 0; k < rings; k++) {
    const a0 = (k / rings) * (Math.PI / 2)
    const a1 = ((k + 1) / rings) * (Math.PI / 2)
    prism(out, c.x, c.z, y0 + Math.sin(a0) * h, y0 + Math.sin(a1) * h, Math.cos(a0) * r, sides, DOME, T.metal, Math.max(0.01, Math.cos(a1) * r), k === rings - 1)
  }
}

/**
 * The drum and dome over the crossing: a stone base off the roofs, the drum with an arched window in every face
 * between pilasters, its cornice, the grey dome. Nothing stands on top.
 */
function drumAndDome(out: MeshBuilder, c: P2, y0: number): void {
  const sides = 20
  const r = 8.2
  const yb = y0 + 0.6
  const yt = yb + 3.9
  prism(out, c.x, c.z, y0 - 3, yb, r + 0.5, sides, STONE, T.stone)
  prism(out, c.x, c.z, yb - 0.15, yb + 0.2, r + 0.65, sides, TRIM, T.stone)
  prism(out, c.x, c.z, yb, yt, r, sides, STONE, T.stone)
  for (let i = 0; i < sides; i++) {
    // vertices as prism() lays them, taken in the order that makes each face's frame face out
    const a1 = (i / sides) * Math.PI * 2
    const a0 = ((i + 1) / sides) * Math.PI * 2
    let A = { x: c.x + Math.sin(a0) * r, z: c.z + Math.cos(a0) * r }
    let B = { x: c.x + Math.sin(a1) * r, z: c.z + Math.cos(a1) * r }
    let f = frameOf(A, B)
    const m = pt(f, f.L / 2, 0)
    if ((m.x - c.x) * f.nx + (m.z - c.z) * f.nz < 0) { [A, B] = [B, A]; f = frameOf(A, B) }
    const L = f.L
    arch(out, f, L / 2, 0.03, yb + 0.55, 1.35, 2.65, TRIM, 6)
    arch(out, f, L / 2, 0.05, yb + 0.7, 1.0, 2.35, GLASS, 6)
    stub(out, f, -0.2, 0.2, 0.22, yb + 0.2, yt - 0.5, STONE, T.stone, false)
  }
  // the cornice, its dentils as a shadow band, the dome's foot ring
  prism(out, c.x, c.z, yt - 0.5, yt - 0.3, r + 0.08, sides, JOINT, FIXED)
  prism(out, c.x, c.z, yt - 0.3, yt + 0.3, r + 0.55, sides, TRIM, T.stone)
  prism(out, c.x, c.z, yt + 0.3, yt + 0.75, r + 0.1, 28, DOME, T.metal)
  metalDome(out, c, yt + 0.75, r + 0.1, 7.0, 28)
}

// ------------------------------------------------------------------------------------------- the building

const area2 = (r: P2[]): number => {
  let s = 0
  for (let i = 0; i < r.length; i++) { const j = (i + 1) % r.length; s += r[i].x * r[j].z - r[j].x * r[i].z }
  return s
}

function sherith(out: MeshBuilder, fit: Fit): void {
  const raw = fit.ring && fit.ring.length >= 3 ? fit.ring
    : [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  const ring0 = area2(raw) >= 0 ? raw : [...raw].reverse()
  const ring = simplifyRing(ring0, 0.25)
  const G = fit.grade ?? 0
  const ground = (p: P2): number => fit.groundAt?.(p.x, p.z) ?? G
  const edges = ring.map((a, i) => ({ i, f: frameOf(a, ring[(i + 1) % ring.length]) }))

  // ---- the faces, found on the outline
  const fronts = edges.filter((e) => e.f.nz < -0.92 && e.f.L > 2)
  const midZ = (f: Fr) => f.oz + f.tz * f.L / 2
  const midX = (f: Fr) => f.ox + f.tx * f.L / 2
  const portalE = fronts.filter((e) => e.f.L >= 6 && e.f.L <= 16).sort((a, b) => midZ(a.f) - midZ(b.f))[0]
    ?? [...fronts].sort((a, b) => b.f.L - a.f.L)[0] ?? edges[0]
  const Fp = portalE.f
  // the extent of the front along it, and the piers' plane just behind the portal bay
  let uL = 0
  let uR = Fp.L
  for (const p of ring) {
    const q = inFr(Fp, p)
    if (q.o > -3) { uL = Math.min(uL, q.u); uR = Math.max(uR, q.u) }
  }
  const piers = fronts.filter((e) => e !== portalE && e.f.L > 4 && Math.abs(inFr(Fp, { x: midX(e.f), z: midZ(e.f) }).o) < 2.5)
  const pierO = piers.length ? Math.min(...piers.map((e) => inFr(Fp, { x: e.f.ox, z: e.f.oz }).o)) : -1
  let depth = 0
  for (const p of ring) depth = Math.max(depth, -inFr(Fp, p).o)
  // the Webster arm: the most outward of the long edges facing away from the front's start
  const west = edges.filter((e) => e.f.nx * -Fp.tx + e.f.nz * -Fp.tz > 0.92 && e.f.L >= 6 && e.f.L <= 16)
    .sort((a, b) => inFr(Fp, { x: a.f.ox, z: a.f.oz }).u - inFr(Fp, { x: b.f.ox, z: b.f.oz }).u)[0]
  // the east annex: the outline beyond the long east wall's line
  const east = edges.filter((e) => e.f.nx * Fp.tx + e.f.nz * Fp.tz > 0.92).sort((a, b) => b.f.L - a.f.L)[0]
  const eastU = east ? inFr(Fp, { x: east.f.ox, z: east.f.oz }).u : Infinity
  const inAnnex = (p: P2) => inFr(Fp, p).u > eastU + 1.0
  const annexed = (e: { i: number }) => inAnnex(ring[e.i]) || inAnnex(ring[(e.i + 1) % ring.length])
  const mainRing = ring.filter((p) => !inAnnex(p))
  const annexRing = ring.some(inAnnex) ? ring.filter((p, i) => inAnnex(p) || inAnnex(ring[(i + 1) % ring.length]) || inAnnex(ring[(i - 1 + ring.length) % ring.length])) : []
  uR = Math.min(uR, eastU + 0.5)

  // ---- the walls, each by what it is
  for (const e of edges) {
    if (e === portalE) { armFace(out, e.f, G, 'front', ground); continue }
    if (west && e === west) { armFace(out, e.f, G, 'side', ground); continue }
    if (annexed(e)) { plainWall(out, e.f, G, G + Y.annex, ground, { windows: e.f.L > 5 }); continue }
    if (west && e.f.L > 5 && e.f.nx * west.f.nx + e.f.nz * west.f.nz > 0.92) {
      // the Webster side's own corner piers, quoined at the end away from the arm
      const wc = pt(west.f, west.f.L / 2, 0)
      const d0 = Math.hypot(e.f.ox - wc.x, e.f.oz - wc.z)
      const e1 = pt(e.f, e.f.L, 0)
      pierFace(out, e.f, G, d0 > Math.hypot(e1.x - wc.x, e1.z - wc.z) ? 'start' : 'end', ground)
      continue
    }
    if (piers.includes(e)) {
      const startO = inFr(Fp, { x: e.f.ox, z: e.f.oz }).u
      pierFace(out, e.f, G, startO < Fp.L / 2 ? 'start' : 'end', ground)
      continue
    }
    plainWall(out, e.f, G, G + Y.eaves, ground, { rich: Math.abs(e.f.nz) < 0.5 && e.f.nx < 0 })
  }
  // the wall the annex leans on, from its roof up
  if (annexRing.length >= 3) {
    for (let i = 0; i < mainRing.length; i++) {
      const a = mainRing[i]
      const b = mainRing[(i + 1) % mainRing.length]
      const k = ring.indexOf(a)
      if (ring[(k + 1) % ring.length] === b) continue
      plainWall(out, frameOf(a, b), G, G + Y.eaves, ground, { from: G + Y.annex })
    }
    capPolygon(out, annexRing, G + Y.annex, ROOF, T.metal)
  }
  capPolygon(out, mainRing, G + Y.eaves, ROOF, T.metal)

  // ---- the front pediment across the whole front, in the piers' plane
  const ff = frameOf(pt(Fp, uL, pierO), pt(Fp, uR, pierO))
  const rise = Y.apex - Y.eaves
  gable(out, ff, 0, ff.L, G + Y.eaves, rise, true)
  const pitch = rise / (ff.L / 2)
  // the roof behind it, its ridge running back over the middle of the front
  ridgeRoof(out, Fp, uL, uR, -depth + 0.4, pierO - 0.3, G + Y.eaves + 0.02, rise, ROOF)
  // the back gable, plain
  const fb = frameOf(pt(Fp, uR, -depth), pt(Fp, uL, -depth))
  gable(out, fb, 0, fb.L, G + Y.eaves, rise, false)

  // ---- the Webster arm: its gable over the projecting bay, its roof running in to the main ridge
  let ow = -depth * 0.55
  if (west) {
    const wm = pt(west.f, west.f.L / 2, 0)
    ow = inFr(Fp, wm).o
    const wallU = inFr(Fp, { x: west.f.ox, z: west.f.oz }).u + 0.6
    const frontEdge = pierO - 8.8
    const hw = Math.max(5, Math.min(14, frontEdge - ow, ow + depth - 0.5))
    const wr = pitch * hw
    const fg = frameOf(pt(Fp, wallU, ow - hw), pt(Fp, wallU, ow + hw))
    gable(out, fg, 0, fg.L, G + Y.eaves, wr, true)
    // the cornice under it, across the arm
    cornice(out, fg, 0, fg.L, G + Y.eaves, false)
    // the arm's roof: two slopes from the gable in to the main ridge, its own ridge on the arm's axis
    const k = Math.hypot(hw, wr) || 1
    const umid = (uL + uR) / 2
    const Q = (u: number, o: number, y: number) => P(Fp, u, o, y)
    out.quad([Q(wallU, ow + hw, G + Y.eaves + 0.03), Q(umid, ow + hw, G + Y.eaves + 0.03), Q(umid, ow, G + Y.eaves + wr), Q(wallU, ow, G + Y.eaves + wr)],
      dir(Fp, 0, hw / k, wr / k), UV, ROOF, T.metal)
    out.quad([Q(umid, ow - hw, G + Y.eaves + 0.03), Q(wallU, ow - hw, G + Y.eaves + 0.03), Q(wallU, ow, G + Y.eaves + wr), Q(umid, ow, G + Y.eaves + wr)],
      dir(Fp, 0, hw / k, -wr / k), UV, ROOF, T.metal)
  }

  // ---- the drum and the dome over the crossing, behind the front gable on the Webster arm's axis
  const dc = pt(Fp, (uL + uR) / 2, Math.min(ow, pierO - 12))
  drumAndDome(out, dc, G + Y.apex - 1.0)
}

export const SHERITH_ISRAEL: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /** Temple Sherith Israel (way/32965008), California at Webster: the rose in its great arch, the triple portal up
   *  its steps, the Webster arm, the grey dome on its arcaded drum — and no cross. */
  sherithIsrael: sherith,
}
