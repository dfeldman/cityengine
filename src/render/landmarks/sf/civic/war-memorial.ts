/**
 * The War Memorial twins on Van Ness (Arthur Brown Jr., 1932): the Opera House (south, by Grove Street) and the
 * Veterans Building (north, by McAllister), facing City Hall across Van Ness and each other across the Memorial
 * Court. From the Mapillary frames in refs/way-32865161-0*.jpg and refs/way-32865757/ (2026-10-21).
 *
 * What both fronts are, bay for bay (counted off the frames):
 *  - a broad flight of low granite steps along Van Ness up to the ground storey, with cheek plinths and lamps;
 *  - the RUSTICATED ground storey: seven bays — five tall round arches between two end doors on the Opera
 *    House, seven arches on the Veterans Building — each arch in a ring of voussoirs with a keystone, and a
 *    bronze lantern on every pier between them;
 *  - over a string course and a balustrade, a GIANT DORIC COLONNADE of eight PAIRS of free-standing columns
 *    through two storeys, in front of a deep loggia whose back wall has a tall arched opening in each bay
 *    (on the Opera House the season's banners hang between the pairs);
 *  - the entablature, an attic with a small window a bay, the heavy cornice, and a grey hip roof behind it;
 *  - solid END PAVILIONS a little behind the arcade's line, rounded where they turn onto the sides, one window
 *    stacked a storey over the next, and a concave sweep back into the side wings (the Veterans frame 01);
 *  - the sides (Grove, McAllister and the two Court sides): the rusticated base with small windows, a row of
 *    tall round-arched windows through the upper storeys, the attic windows, the same cornice;
 *  - the Opera House's stage house: the tall fly tower at the Franklin Street end, OSM's 44 m.
 *
 * The frame: the real outline is used as given (in the city and in tools/model-shots.ts alike), and the Van Ness
 * front is FOUND on it, not assumed — the long straight edge whose building is wider just behind it than far
 * behind it (the pavilioned front block is ~70 m across, the stage and auditorium wings ~50 m). Everything on
 * the front is then laid out in that edge's own frame: u along it, o out of it (negative into the building).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { capPolygon } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { prism, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { classicalColumn } from '../../column.ts'
import { stair } from '../../parts.ts'
import { simplifyRing } from '../districts/market-west.ts'

type P2 = { x: number; z: number }
const FIXED = 0
/** keeps its colour and glows after dark (models.ts EMIT) */
const EMIT = 0.5
const T = { granite: surfaceTag('granite'), metal: surfaceTag('metal'), concrete: surfaceTag('concrete') }

// the warm pale grey Sierra granite of both buildings (not white: the frames read it a little warmer than City Hall's)
const GRANITE: Rgb = [0.79, 0.78, 0.74]
const RUSTIC: Rgb = [0.73, 0.72, 0.68]
const JOINT: Rgb = [0.55, 0.54, 0.52]
const VOUSSOIR: Rgb = [0.68, 0.67, 0.63]
const LOGGIA: Rgb = [0.5, 0.5, 0.48]
const SOFFIT: Rgb = [0.56, 0.55, 0.53]
const DARK: Rgb = [0.17, 0.18, 0.2]
const GLASS: Rgb = [0.22, 0.24, 0.27]
const ROOF: Rgb = [0.53, 0.54, 0.55]
const BRONZE: Rgb = [0.2, 0.19, 0.16]
const LAMP: Rgb = [1, 0.86, 0.56]
/** the pavilions' skylight pyramids: glass in grey glazing bars, lighter than the slate */
const SKY: Rgb = [0.66, 0.69, 0.7]
const STAGE: Rgb = [0.74, 0.73, 0.7]
/** the Opera House's season banners, in the colours of the frames */
const BANNERS: Rgb[] = [[0.62, 0.16, 0.14], [0.17, 0.22, 0.5], [0.7, 0.3, 0.12], [0.55, 0.12, 0.16], [0.2, 0.28, 0.55], [0.6, 0.2, 0.3], [0.18, 0.2, 0.42]]

/** The heights of the front, in metres over the pavement: both buildings share them. */
const Y = {
  floor: 1.2,      // the arcade's floor, at the head of the steps
  base: 9.6,       // top of the rusticated storey
  string: 10.2,    // top of the string course
  ped: 11.2,       // top of the pedestals and the balustrade
  ent: 20.6,       // the columns' tops: the entablature starts
  attic: 22.8,     // the entablature's top: the attic starts
  cornice: 25.2,   // the attic's top: the main cornice
  eaves: 26.0,     // the cornice's top, where the roof starts
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
const P = (f: Fr, u: number, o: number, y: number): [number, number, number] =>
  [f.ox + f.tx * u + f.nx * o, y, f.oz + f.tz * u + f.nz * o]
const pt = (f: Fr, u: number, o: number): P2 => ({ x: f.ox + f.tx * u + f.nx * o, z: f.oz + f.tz * u + f.nz * o })
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

/** A block in a frame: `u0..u1` along, `o0..o1` out, `y0..y1` up; six faces (`bottom` false drops the underside). */
function slab(out: MeshBuilder, f: Fr, u0: number, u1: number, o0: number, o1: number, y0: number, y1: number, c: Rgb, tag = FIXED, bottom = true): void {
  const Q = (u: number, o: number, y: number) => P(f, u, o, y)
  out.quad([Q(u0, o1, y0), Q(u1, o1, y0), Q(u1, o1, y1), Q(u0, o1, y1)], [f.nx, 0, f.nz], UV, c, tag)
  out.quad([Q(u1, o0, y0), Q(u0, o0, y0), Q(u0, o0, y1), Q(u1, o0, y1)], [-f.nx, 0, -f.nz], UV, c, tag)
  out.quad([Q(u0, o0, y0), Q(u0, o1, y0), Q(u0, o1, y1), Q(u0, o0, y1)], [-f.tx, 0, -f.tz], UV, c, tag)
  out.quad([Q(u1, o1, y0), Q(u1, o0, y0), Q(u1, o0, y1), Q(u1, o1, y1)], [f.tx, 0, f.tz], UV, c, tag)
  out.quad([Q(u0, o0, y1), Q(u0, o1, y1), Q(u1, o1, y1), Q(u1, o0, y1)], [0, 1, 0], UV, c, tag)
  if (bottom) out.quad([Q(u0, o1, y0), Q(u0, o0, y0), Q(u1, o0, y0), Q(u1, o1, y0)], [0, -1, 0], UV, c, tag)
}

/** A flat rectangle facing out of the wall, `o` metres proud of it. */
function panel(out: MeshBuilder, f: Fr, u0: number, u1: number, o: number, y0: number, y1: number, c: Rgb, tag = FIXED): void {
  out.quad([P(f, u0, o, y0), P(f, u1, o, y0), P(f, u1, o, y1), P(f, u0, o, y1)], [f.nx, 0, f.nz], UV, c, tag)
}

/** A round-headed opening `w` wide, `h` tall from `y0`, centred `u` along, `o` proud: a rectangle and a half-disc. */
function arch(out: MeshBuilder, f: Fr, u: number, o: number, y0: number, w: number, h: number, c: Rgb, seg = 6, tag = FIXED): void {
  const r = w / 2
  const spring = y0 + h - r
  if (spring > y0) panel(out, f, u - r, u + r, o, y0, spring, c, tag)
  for (let i = 0; i < seg; i++) {
    const a0 = Math.PI - (i / seg) * Math.PI
    const a1 = Math.PI - ((i + 1) / seg) * Math.PI
    // a fan quad with its fourth corner on the centre (one sliver triangle is degenerate, which is free)
    out.quad([P(f, u, o, spring), P(f, u + Math.cos(a0) * r, o, spring + Math.sin(a0) * r), P(f, u + Math.cos(a1) * r, o, spring + Math.sin(a1) * r), P(f, u, o, spring)],
      [f.nx, 0, f.nz], UV, c, tag)
  }
}

// ----------------------------------------------------------------------------------------- the ring's shape

/** Where a line in the frame `o` out (negative: inside) crosses the ring: the span of `u` it covers, or null. */
function spanAt(ring: P2[], f: Fr, o: number): [number, number] | null {
  let lo = Infinity
  let hi = -Infinity
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]
    const b = ring[(i + 1) % ring.length]
    const oa = (a.x - f.ox) * f.nx + (a.z - f.oz) * f.nz - o
    const ob = (b.x - f.ox) * f.nx + (b.z - f.oz) * f.nz - o
    if ((oa < 0) === (ob < 0)) continue
    const t = oa / (oa - ob)
    const x = a.x + (b.x - a.x) * t
    const z = a.z + (b.z - a.z) * t
    const u = (x - f.ox) * f.tx + (z - f.oz) * f.tz
    lo = Math.min(lo, u)
    hi = Math.max(hi, u)
  }
  return lo < hi ? [lo, hi] : null
}

/** How deep the ring runs behind an edge. */
function depthOf(ring: P2[], f: Fr): number {
  let d = 0
  for (const p of ring) d = Math.max(d, -((p.x - f.ox) * f.nx + (p.z - f.oz) * f.nz))
  return d
}

/**
 * The Van Ness front: of the long edges, the one whose building is widest just behind it compared with deep
 * behind it — the pavilioned front block against the narrower auditorium. (The Opera House's Franklin end is
 * as long an edge, and its Grove side longer; neither has a wide block at its back.)
 */
function findFront(ring: P2[]): Fr {
  let best: Fr | null = null
  let score = -Infinity
  for (let i = 0; i < ring.length; i++) {
    const f = frameOf(ring[i], ring[(i + 1) % ring.length])
    if (f.L < 20) continue
    const near = spanAt(ring, f, -8)
    const deep = spanAt(ring, f, -Math.min(40, depthOf(ring, f) * 0.6))
    if (!near) continue
    const s = (near[1] - near[0]) - (deep ? deep[1] - deep[0] : 0) + f.L * 0.05
    if (s > score) { score = s; best = f }
  }
  return best ?? frameOf(ring[0], ring[1])
}

// ---------------------------------------------------------------------------------------------- the pieces

/** A bronze lantern on a bracket off the wall, its glass lit. */
function wallLantern(out: MeshBuilder, f: Fr, u: number, y: number): void {
  slab(out, f, u - 0.06, u + 0.06, 0, 0.45, y - 0.05, y + 0.05, BRONZE)
  slab(out, f, u - 0.2, u + 0.2, 0.35, 0.75, y - 0.55, y + 0.15, BRONZE)
  slab(out, f, u - 0.16, u + 0.16, 0.39, 0.71, y - 0.45, y + 0.05, LAMP, EMIT)
  const c = pt(f, u, 0.55)
  prism(out, c.x, c.z, y + 0.15, y + 0.42, 0.26, 4, BRONZE, FIXED, 0.04)
}

/** A lamp standard on a plinth: a bronze post and a lit lantern. */
function lampStandard(out: MeshBuilder, x: number, z: number, y0: number): void {
  prism(out, x, z, y0, y0 + 0.5, 0.28, 6, BRONZE, T.metal, 0.2)
  prism(out, x, z, y0 + 0.5, y0 + 3.6, 0.09, 6, BRONZE, T.metal, 0.07)
  prism(out, x, z, y0 + 3.6, y0 + 4.3, 0.26, 6, LAMP, EMIT, 0.3)
  prism(out, x, z, y0 + 4.3, y0 + 4.65, 0.34, 6, BRONZE, T.metal, 0.05)
}

/** The rusticated courses of a stretch of the ground storey: the joints as shadow lines. */
function courses(out: MeshBuilder, f: Fr, u0: number, u1: number, y0: number, y1: number): void {
  for (let y = y0 + 0.75; y < y1 - 0.2; y += 0.75) panel(out, f, u0, u1, 0.03, y - 0.05, y + 0.05, JOINT, FIXED)
}

/** A round-arched opening in a rusticated wall: the voussoir ring, the dark opening, the keystone. */
function rusticArch(out: MeshBuilder, f: Fr, u: number, y0: number, w: number, h: number, inner: Rgb): void {
  arch(out, f, u, 0.05, y0, w + 1.1, h + 0.55, VOUSSOIR, 6)
  arch(out, f, u, 0.07, y0, w, h, inner, 6)
  slab(out, f, u - 0.3, u + 0.3, 0, 0.18, y0 + h - 0.15, y0 + h + 0.75, GRANITE)
}

/** A hip roof over a rectangle in a frame, `rise` high, its top drawn in by `iu` along and `io` across. */
function hip(out: MeshBuilder, f: Fr, u0: number, u1: number, o0: number, o1: number, y: number, rise: number, iu: number, io: number, c: Rgb): void {
  const tu0 = u0 + iu, tu1 = u1 - iu, to0 = o0 + io, to1 = o1 - io
  const y1 = y + rise
  const q = (a: [number, number, number][], n: [number, number, number]) => out.quad(a, n, UV, c, T.metal)
  const nn = (dx: number, dz: number, run: number): [number, number, number] => {
    const k = Math.hypot(rise, run) || 1
    return [dx * rise / k, run / k, dz * rise / k]
  }
  q([P(f, u0, o1, y), P(f, u1, o1, y), P(f, tu1, to1, y1), P(f, tu0, to1, y1)], nn(f.nx, f.nz, io))
  q([P(f, u1, o0, y), P(f, u0, o0, y), P(f, tu0, to0, y1), P(f, tu1, to0, y1)], nn(-f.nx, -f.nz, io))
  q([P(f, u0, o0, y), P(f, u0, o1, y), P(f, tu0, to1, y1), P(f, tu0, to0, y1)], nn(-f.tx, -f.tz, iu))
  q([P(f, u1, o1, y), P(f, u1, o0, y), P(f, tu1, to0, y1), P(f, tu1, to1, y1)], nn(f.tx, f.tz, iu))
  if (tu1 - tu0 > 0.05 && to1 - to0 > 0.05) q([P(f, tu0, to0, y1), P(f, tu0, to1, y1), P(f, tu1, to1, y1), P(f, tu1, to0, y1)], [0, 1, 0])
}

// -------------------------------------------------------------------------------------------- the walls

/**
 * One wall of the outline, other than the Van Ness front: the plain granite from the ground to the eaves, the
 * rustication, the string course, the entablature band and the cornice, and its windows by what it faces —
 * `side` (Grove, McAllister, the Court: small windows in the base, tall arched windows above, attic windows),
 * `pavilion` (an end pavilion's front: one opening a storey, stacked), `back` (Franklin: punched windows).
 */
function wall(out: MeshBuilder, f: Fr, kind: 'side' | 'pavilion' | 'back' | 'plain', top: number): void {
  const L = f.L
  panel(out, f, 0, L, 0, 0, top, GRANITE, T.granite)
  panel(out, f, 0, L, 0.01, 0, Y.base, RUSTIC, T.granite)
  courses(out, f, 0, L, 0, Y.base)
  // the string course, the band under the attic, and the cornice: carried round the corners a little past each end
  slab(out, f, -0.25, L + 0.25, -0.3, 0.3, Y.base, Y.string, GRANITE, T.granite)
  slab(out, f, -0.1, L + 0.1, -0.3, 0.15, Y.attic - 0.5, Y.attic, GRANITE, T.granite, false)
  slab(out, f, -0.9, L + 0.9, -0.5, 0.9, Y.cornice, Y.eaves, GRANITE, T.granite)
  if (kind === 'plain' || L < 4) return
  if (kind === 'pavilion') {
    const u = L / 2
    if (L > 9) {
      // a door in an arched surround, the tall window over it on its balcony, the attic window
      rusticArch(out, f, u, Y.floor - 1.2, 2.4, 5.2, DARK)
      panel(out, f, u - 1.0, u + 1.0, 0.1, Y.string + 2.0, Y.ent - 2.2, GLASS)
      panel(out, f, u - 1.3, u + 1.3, 0.08, Y.string + 1.7, Y.ent - 1.9, VOUSSOIR)
      slab(out, f, u - 1.6, u + 1.6, 0, 0.6, Y.string + 1.4, Y.string + 1.7, GRANITE, T.granite)
      slab(out, f, u - 1.5, u + 1.5, 0, 0.5, Y.ent - 1.9, Y.ent - 1.5, GRANITE, T.granite)
      panel(out, f, u - 0.7, u + 0.7, 0.06, Y.attic + 0.6, Y.cornice - 0.5, GLASS)
    } else {
      panel(out, f, u - 0.8, u + 0.8, 0.06, 3.2, 6.0, GLASS)
      panel(out, f, u - 0.8, u + 0.8, 0.06, 13.2, 16.2, GLASS)
      panel(out, f, u - 0.6, u + 0.6, 0.06, Y.attic + 0.6, Y.cornice - 0.5, GLASS)
    }
    return
  }
  const pitch = kind === 'side' ? 6.6 : 5.2
  const n = Math.max(1, Math.round((L - 2) / pitch))
  const step = (L - 2) / n
  for (let i = 0; i < n; i++) {
    const u = 1 + step * (i + 0.5)
    // the base: a small window between the courses
    panel(out, f, u - 0.75, u + 0.75, 0.06, 3.0, 5.6, GLASS)
    panel(out, f, u - 0.95, u + 0.95, 0.04, 2.8, 5.8, VOUSSOIR)
    if (kind === 'side') {
      // the tall round-arched window through the two storeys of the colonnade, in its moulded surround
      arch(out, f, u, 0.04, Y.ped + 0.2, 3.0, 8.4, VOUSSOIR, 6)
      arch(out, f, u, 0.06, Y.ped + 0.5, 2.4, 7.8, GLASS, 6)
      slab(out, f, u - 1.7, u + 1.7, 0, 0.35, Y.ped, Y.ped + 0.3, GRANITE, T.granite)
    } else {
      panel(out, f, u - 0.75, u + 0.75, 0.06, 12.0, 14.8, GLASS)
      panel(out, f, u - 0.75, u + 0.75, 0.06, 16.4, 19.2, GLASS)
    }
    panel(out, f, u - 0.6, u + 0.6, 0.06, Y.attic + 0.6, Y.cornice - 0.6, GLASS)
  }
}

// --------------------------------------------------------------------------------------------- the front

/** The Van Ness front on its edge: steps, arcade, colonnade and loggia, entablature, attic, cornice. */
function front(out: MeshBuilder, f: Fr, opera: boolean): void {
  const L = f.L
  // the eight pairs of columns over seven bays, the end pairs just inside the arcade's ends
  const inset = 1.3
  const bays = 7
  const bay = (L - 2 * inset) / bays
  const pairAt = (k: number): number => inset + k * bay
  const mid = (k: number): number => inset + (k + 0.5) * bay
  const half = 0.82            // half the spacing within a pair
  const r = 0.56               // the columns' radius
  const loggia = -3.4          // the loggia's back wall
  const colO = -0.75           // the columns' line, just inside the arcade's face

  // ---- the ground storey: the rusticated wall and its seven openings
  panel(out, f, 0, L, 0, 0, Y.base, RUSTIC, T.granite)
  courses(out, f, 0, L, Y.floor, Y.base)
  panel(out, f, 0, L, 0.02, 0, Y.floor, GRANITE, T.granite)
  for (let k = 0; k < bays; k++) {
    const u = mid(k)
    const end = k === 0 || k === bays - 1
    if (opera && end) {
      // the Opera House's end bays: a square-headed door under a small arched window
      panel(out, f, u - 1.25, u + 1.25, 0.05, Y.floor, Y.floor + 4.2, VOUSSOIR)
      panel(out, f, u - 1.0, u + 1.0, 0.07, Y.floor, Y.floor + 3.9, DARK)
      slab(out, f, u - 1.5, u + 1.5, 0, 0.3, Y.floor + 4.2, Y.floor + 4.6, GRANITE, T.granite)
      arch(out, f, u, 0.05, Y.floor + 5.3, 1.9, 2.2, VOUSSOIR, 6)
      arch(out, f, u, 0.07, Y.floor + 5.5, 1.3, 1.8, GLASS, 6)
    } else {
      rusticArch(out, f, u, Y.floor, Math.min(3.8, bay * 0.55), 7.0, DARK)
      // the doors' glazed transom line inside the arch
      panel(out, f, u - 1.5, u + 1.5, 0.09, Y.floor + 4.1, Y.floor + 4.3, BRONZE)
    }
  }
  // a lantern on each pier
  for (let k = 1; k < bays; k++) wallLantern(out, f, pairAt(k), Y.floor + 3.6)
  // the string course over the arcade, its frieze
  slab(out, f, -0.3, L + 0.3, -0.5, 0.35, Y.base, Y.string, GRANITE, T.granite)
  panel(out, f, 0, L, 0.01, Y.base - 0.9, Y.base, GRANITE, T.granite)

  // ---- the loggia: its floor, back wall (an arched opening a bay), side walls and ceiling
  slab(out, f, 0, L, loggia, 0, Y.string - 0.4, Y.string, GRANITE, T.granite, false)
  panel(out, f, 0, L, loggia, Y.string, Y.ent, LOGGIA, T.granite)
  for (let k = 0; k < bays; k++) {
    const u = mid(k)
    arch(out, f, u, loggia + 0.04, Y.ped + 0.4, Math.min(3.6, bay * 0.55), 8.2, DARK, 6)
    // the balcony rail across it, at the upper floor
    panel(out, f, u - 1.8, u + 1.8, loggia + 0.08, Y.ped + 4.3, Y.ped + 4.5, GRANITE)
  }
  out.quad([P(f, 0, loggia, Y.string), P(f, 0, 0, Y.string), P(f, 0, 0, Y.ent), P(f, 0, loggia, Y.ent)], [f.tx, 0, f.tz], UV, LOGGIA, T.granite)
  out.quad([P(f, L, 0, Y.string), P(f, L, loggia, Y.string), P(f, L, loggia, Y.ent), P(f, L, 0, Y.ent)], [-f.tx, 0, -f.tz], UV, LOGGIA, T.granite)
  out.quad([P(f, 0, 0, Y.ent), P(f, L, 0, Y.ent), P(f, L, loggia, Y.ent), P(f, 0, loggia, Y.ent)], [0, -1, 0], UV, SOFFIT, T.granite)

  // ---- the balustrade between the pedestals, the pedestals, and the columns
  for (let k = 0; k <= bays; k++) {
    const u = pairAt(k)
    slab(out, f, u - half - 0.85, u + half + 0.85, colO - 0.85, colO + 0.85, Y.string, Y.ped, GRANITE, T.granite, false)
    for (const s of [-1, 1]) {
      const c = pt(f, u + s * half, colO)
      // free-standing, and the building's face — but sixteen of them a building, two buildings: the mid tier
      classicalColumn(out, c.x, c.z, Y.ped, Y.ent, r, GRANITE, { order: 'doric', tier: 'mid', tag: T.granite, heading: Math.atan2(f.nx, f.nz) })
    }
    if (k < bays) {
      const u0 = u + half + 0.85
      const u1 = pairAt(k + 1) - half - 0.85
      slab(out, f, u0, u1, colO - 0.2, colO + 0.2, Y.string, Y.string + 0.25, GRANITE, T.granite, false)
      slab(out, f, u0, u1, colO - 0.25, colO + 0.25, Y.ped - 0.22, Y.ped, GRANITE, T.granite, false)
      // the balusters, read as the shade between them
      panel(out, f, u0, u1, colO + 0.12, Y.string + 0.25, Y.ped - 0.22, SOFFIT, FIXED)
      for (let uu = u0 + 0.25; uu < u1 - 0.1; uu += 0.42) panel(out, f, uu - 0.09, uu + 0.09, colO + 0.15, Y.string + 0.25, Y.ped - 0.22, GRANITE, FIXED)
      // the season's banners, hung between the pairs on the Opera House
      if (opera) {
        const bu = (u0 + u1) / 2
        panel(out, f, bu - 1.75, bu + 1.75, colO - 0.1, Y.ped + 0.9, Y.ent - 0.8, BANNERS[k % BANNERS.length])
        slab(out, f, bu - 1.85, bu + 1.85, colO - 0.16, colO - 0.08, Y.ent - 0.8, Y.ent - 0.7, BRONZE)
      }
    }
  }

  // ---- the entablature over the columns, the attic, the cornice
  slab(out, f, -0.2, L + 0.2, loggia, colO + r + 0.25, Y.ent, Y.attic, GRANITE, T.granite, false)
  const fo = colO + r + 0.25
  panel(out, f, -0.2, L + 0.2, fo + 0.01, Y.ent + 0.95, Y.ent + 1.02, JOINT)          // architrave | frieze
  slab(out, f, -0.4, L + 0.4, fo - 0.2, fo + 0.35, Y.attic - 0.45, Y.attic, GRANITE, T.granite)
  panel(out, f, 0, L, 0, Y.attic, Y.cornice, GRANITE, T.granite)
  for (let k = 0; k < bays; k++) {
    const u = mid(k)
    // the attic's windows: a small window a bay, with its grille of balusters
    panel(out, f, u - 1.1, u + 1.1, 0.05, Y.attic + 0.55, Y.cornice - 0.55, GLASS)
    for (let j = -2; j <= 2; j++) panel(out, f, u + j * 0.42 - 0.06, u + j * 0.42 + 0.06, 0.08, Y.attic + 0.55, Y.cornice - 0.55, GRANITE)
    // the attic's pilasters over the column pairs
  }
  for (let k = 0; k <= bays; k++) slab(out, f, pairAt(k) - 1.2, pairAt(k) + 1.2, 0, 0.18, Y.attic, Y.cornice, GRANITE, T.granite, false)
  slab(out, f, -1.0, L + 1.0, -1.5, 1.0, Y.cornice, Y.eaves, GRANITE, T.granite)
  panel(out, f, -1.0, L + 1.0, 1.01, Y.cornice + 0.2, Y.cornice + 0.3, JOINT)          // the cornice's drip

  // ---- the steps: a broad flight the whole width of the arcade, cheek plinths and lamps at either end
  const run = 3.6
  stair(out, pt(f, 0.6, 0), pt(f, L - 0.6, 0), 0, Y.floor, { anchor: 'top', riser: 0.15, run, colour: GRANITE, material: 'granite' })
  for (const [u0, u1] of [[-0.6, 0.6], [L - 0.6, L + 0.6]]) {
    slab(out, f, u0, u1, 0, run + 0.2, 0, Y.floor + 0.45, RUSTIC, T.granite)
    const c = pt(f, (u0 + u1) / 2, run - 0.4)
    lampStandard(out, c.x, c.z, Y.floor + 0.45)
  }
}

// ------------------------------------------------------------------------------------------ the building

function warMemorial(out: MeshBuilder, fit: Fit, opera: boolean): void {
  const raw = fit.ring && fit.ring.length >= 3 ? fit.ring
    : [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  // anticlockwise, so each edge's (tz, −tx) is outward
  let area = 0
  for (let i = 0; i < raw.length; i++) { const a = raw[i]; const b = raw[(i + 1) % raw.length]; area += a.x * b.z - b.x * a.z }
  const ring0 = area >= 0 ? raw : [...raw].reverse()
  // the walls as OSM draws them, its 1 m notches smoothed (the rounded pavilion corners keep their facets)
  const ring = simplifyRing(ring0, 0.6)
  const F = findFront(ring)
  const deepest = depthOf(ring, F)

  // ---- every wall but the front, dressed by what it faces
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]
    const b = ring[(i + 1) % ring.length]
    const f = frameOf(a, b)
    const mo = ((a.x + b.x) / 2 - F.ox) * F.nx + ((a.z + b.z) / 2 - F.oz) * F.nz
    const sameLine = Math.abs(mo) < 0.3 && f.nx * F.nx + f.nz * F.nz > 0.99
    if (sameLine) continue
    const facing = f.nx * F.nx + f.nz * F.nz
    const kind = f.L < 4 ? 'plain' : facing > 0.7 && -mo < 10 ? 'pavilion' : facing < -0.7 ? 'back' : Math.abs(facing) <= 0.7 ? 'side' : 'plain'
    wall(out, f, kind, Y.cornice)
  }
  // the front edge itself
  front(out, F, opera)
  // the roof deck behind the cornice
  capPolygon(out, ring, Y.eaves, ROOF, T.metal)

  // ---- the roofs: a hip over the front block, a bigger one over the hall behind it
  const span = (o: number): [number, number] => spanAt(ring, F, o) ?? [0, F.L]
  // the front block is where the building is widest (its rounded pavilions stand back, so not at the very front)
  let wDepth = 6
  let widest = span(-6)
  for (let d = 2; d < deepest * 0.6; d += 1) {
    const s = span(-d)
    if (s[1] - s[0] > widest[1] - widest[0]) { widest = s; wDepth = d }
  }
  let blockDepth = wDepth
  for (let d = wDepth; d < deepest - 4; d += 1) {
    const s = span(-d)
    if (s[1] - s[0] < (widest[1] - widest[0]) * 0.88) break
    blockDepth = d
  }
  const fb = span(-(blockDepth - 1.5))
  const fr0 = Math.max(fb[0], 0) + 1.5
  const fr1 = Math.min(fb[1], F.L) - 1.5
  // set back from the attic as the frames show it: the cornice, a walk, then the slope
  hip(out, F, fr0, fr1, -blockDepth + 2, -2.2, Y.eaves, 4.6, 6, 5.5, ROOF)
  // the hall behind: from the front block back to the far end, as wide as the wing between its walls
  const hallMid = span(-(blockDepth + deepest) / 2)
  const hr0 = hallMid[0] + 2.5
  const hr1 = hallMid[1] - 2.5
  if (deepest - blockDepth > 10 && hr1 - hr0 > 8) {
    // a true hip, its ridge running back from Van Ness (the Veterans frame 02 shows its long slopes over the side)
    const hw = (hr1 - hr0) / 2
    hip(out, F, hr0, hr1, -(deepest - 2.5), -(blockDepth - 1), Y.eaves, hw * 0.32, hw - 0.4, hw - 0.4, ROOF)
  }
  // the end pavilions' glazed pyramids, standing up at the front block's corners (the Veterans frame 02)
  for (const [p0, p1] of [[widest[0], 0], [F.L, widest[1]]]) {
    const w = Math.min(5.5, (p1 - p0) / 2 - 0.8)
    if (w < 2) continue
    const cu = (p0 + p1) / 2
    const co = -Math.max(w + 1.5, blockDepth / 2)
    slab(out, F, cu - w, cu + w, co - w, co + w, Y.eaves, Y.eaves + 1.4, GRANITE, T.granite, false)
    hip(out, F, cu - w, cu + w, co - w, co + w, Y.eaves + 1.4, 3.6, w, w, SKY)
  }

  // ---- the Opera House's stage house: the fly tower at the Franklin end, up to OSM's height
  if (opera && deepest > 50) {
    const top = Math.max(38, Math.min(48, fit.height))
    const s = span(-(deepest - 20))
    const c = (s[0] + s[1]) / 2
    const w = Math.min(22, (s[1] - s[0]) / 2 - 3)
    const o0 = -(deepest - 6)
    const o1 = -(deepest - 32)
    slab(out, F, c - w, c + w, o0, o1, Y.eaves - 1, top, STAGE, T.granite, false)
    // its cornice, a plain coping, and the shallow roof
    slab(out, F, c - w - 0.4, c + w + 0.4, o0 - 0.4, o1 + 0.4, top - 1.0, top - 0.4, GRANITE, T.granite)
    hip(out, F, c - w + 0.4, c + w - 0.4, o0 + 0.4, o1 - 0.4, top - 0.4, 1.6, 4, 4, ROOF)
    // a band of small windows high on its Van Ness face and its sides, where the frames show them
    const face = frameOf(pt(F, c - w, o1), pt(F, c + w, o1))
    for (let k = 1; k < 8; k++) panel(out, face, (face.L * k) / 8 - 0.5, (face.L * k) / 8 + 0.5, 0.05, top - 4.5, top - 2.8, GLASS)
  }

  // ---- the flagpole on the roof's ridge over the middle of the front
  const fp = pt(F, F.L / 2, -9)
  prism(out, fp.x, fp.z, Y.eaves + 4.6, Y.eaves + 15, 0.12, 6, [0.85, 0.85, 0.83], T.metal, 0.07)
  prism(out, fp.x, fp.z, Y.eaves + 15, Y.eaves + 15.35, 0.2, 6, [0.82, 0.66, 0.3], FIXED, 0.05)
}

export const WAR_MEMORIAL: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /** The War Memorial Opera House (way/32865161): the front, the season's banners, the stage house behind. */
  warMemorialOperaHouse: (out, fit) => warMemorial(out, fit, true),
  /** The War Memorial Veterans Building (way/32865757), Herbst Theatre: the twin front, seven arches, no stage house. */
  warMemorialVeterans: (out, fit) => warMemorial(out, fit, false),
}
