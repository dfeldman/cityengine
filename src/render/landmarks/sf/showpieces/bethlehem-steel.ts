/**
 * Building 101, the Bethlehem Steel (Union Iron Works) Administration Building, 20th Street at Illinois, Pier 70
 * (Frederick H. Meyer, 1917; restored 2021-23). From the Commons photographs "OldBethelemSteelHeadquartersIn
 * SanFranciscoAt20thAndIllinois.jpg" and "Bethlehem offices San Francisco.JPG" (both three-quarter views of the
 * corner, 2026-10-21). Mapillary has nothing nearer than 110 m.
 *
 * What the photographs show — NOT red brick: the whole building is one warm cream (painted terracotta and cement)
 * from the pavement to the parapet, its windows dark in white sash:
 *  - the ENTRANCE is on a CHAMFERED CORNER facing the 20th/Illinois crossing (OSM draws the ~8 m diagonal): a short
 *    flight of steps up to an arched doorway in a moulded surround with a keystone, a balustraded balcony on
 *    console brackets over it, a triple window a storey above that, a relief panel between them, the parapet raised
 *    over the corner with a crest, and the flagpole;
 *  - the corner bay is framed by PAIRS of giant fluted pilasters;
 *  - the two street fronts (Illinois ~38 m, 20th Street ~40 m): a channel-rusticated ground storey over a low
 *    plinth with basement lights at the pavement, paired windows a bay; a belt course; then a GIANT ORDER of
 *    fluted pilasters through the two upper storeys, a pair of windows a bay a storey, a relief panel in each
 *    spandrel between them;
 *  - the entablature with a rosette over each pilaster, a dentilled cornice, a plain parapet, a penthouse behind.
 *
 * The frame: the real outline as given. The corner is FOUND on it — the short edge between the two longest ones,
 * at ~45° to both — and the fronts are its neighbours; the rear and the light-well walls get the same rhythm,
 * plainer (no photograph shows them). Each wall is laid out in its own frame: u along it, o out of it, y up.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { capPolygon } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { prism, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { stair } from '../../parts.ts'
import { simplifyRing } from '../districts/market-west.ts'

type P2 = { x: number; z: number }
const FIXED = 0
const T = { stucco: surfaceTag('stucco'), terra: surfaceTag('terracotta'), granite: surfaceTag('granite'), metal: surfaceTag('metal') }

// the warm cream of the photographs, a shade darker where it is in relief or shade
const CREAM: Rgb = [0.86, 0.84, 0.78]
const PLINTH: Rgb = [0.78, 0.75, 0.68]
const TRIM: Rgb = [0.9, 0.89, 0.84]
const JOINT: Rgb = [0.62, 0.6, 0.54]
const FLUTE: Rgb = [0.7, 0.68, 0.61]
const RELIEF: Rgb = [0.76, 0.73, 0.66]
const SHADE: Rgb = [0.55, 0.53, 0.49]
const GLASS: Rgb = [0.17, 0.19, 0.22]
const SASH: Rgb = [0.86, 0.85, 0.8]
const DOOR: Rgb = [0.24, 0.22, 0.2]
const ROOF: Rgb = [0.52, 0.52, 0.51]
const STEP: Rgb = [0.74, 0.72, 0.67]

/** The heights, metres over the pavement. */
const Y = {
  plinth: 1.2,     // the water table: basement lights below it
  floor: 0.9,      // the entrance's threshold, at the head of the steps
  belt: 6.0,       // top of the rusticated ground storey: the belt course starts
  order: 6.6,      // the belt course's top, where the pilasters stand
  cap: 14.5,       // the pilasters' capitals start
  ent: 15.1,       // the entablature starts
  cornice: 16.3,   // the cornice starts
  roof: 17.0,      // the cornice's top and the roof deck
  parapet: 18.2,   // the parapet's top, under its coping
}
/** The window heads and sills of the floors. */
const W = { g0: 1.7, g1: 5.0, s0: 7.3, s1: 10.2, t0: 11.3, t1: 14.1 }

// ------------------------------------------------------------------------------------------- an edge's frame

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

/** A block in a frame: `u0..u1` along, `o0..o1` out, `y0..y1` up (`bottom` false drops the underside). */
function slab(out: MeshBuilder, f: Fr, u0: number, u1: number, o0: number, o1: number, y0: number, y1: number, c: Rgb, tag = FIXED, bottom = false): void {
  const Q = (u: number, o: number, y: number) => P(f, u, o, y)
  out.quad([Q(u0, o1, y0), Q(u1, o1, y0), Q(u1, o1, y1), Q(u0, o1, y1)], [f.nx, 0, f.nz], UV, c, tag)
  out.quad([Q(u0, o0, y0), Q(u0, o1, y0), Q(u0, o1, y1), Q(u0, o0, y1)], [-f.tx, 0, -f.tz], UV, c, tag)
  out.quad([Q(u1, o1, y0), Q(u1, o0, y0), Q(u1, o0, y1), Q(u1, o1, y1)], [f.tx, 0, f.tz], UV, c, tag)
  out.quad([Q(u0, o0, y1), Q(u0, o1, y1), Q(u1, o1, y1), Q(u1, o0, y1)], [0, 1, 0], UV, c, tag)
  if (bottom) out.quad([Q(u0, o1, y0), Q(u0, o0, y0), Q(u1, o0, y0), Q(u1, o1, y0)], [0, -1, 0], UV, c, tag)
}
/** A block whose back face shows too (the parapet, seen from the roof). */
function wallSlab(out: MeshBuilder, f: Fr, u0: number, u1: number, o0: number, o1: number, y0: number, y1: number, c: Rgb, tag = FIXED): void {
  slab(out, f, u0, u1, o0, o1, y0, y1, c, tag)
  out.quad([P(f, u1, o0, y0), P(f, u0, o0, y0), P(f, u0, o0, y1), P(f, u1, o0, y1)], [-f.nx, 0, -f.nz], UV, c, tag)
}
/** A flat rectangle facing out of the wall, `o` metres proud of it. */
function panel(out: MeshBuilder, f: Fr, u0: number, u1: number, o: number, y0: number, y1: number, c: Rgb, tag = FIXED): void {
  out.quad([P(f, u0, o, y0), P(f, u1, o, y0), P(f, u1, o, y1), P(f, u0, o, y1)], [f.nx, 0, f.nz], UV, c, tag)
}
/** A round-headed opening `w` wide, `h` tall from `y0`, centred `u` along, `o` proud. */
function arch(out: MeshBuilder, f: Fr, u: number, o: number, y0: number, w: number, h: number, c: Rgb, seg = 6): void {
  const r = w / 2
  const spring = y0 + h - r
  if (spring > y0) panel(out, f, u - r, u + r, o, y0, spring, c)
  for (let i = 0; i < seg; i++) {
    const a0 = Math.PI - (i / seg) * Math.PI
    const a1 = Math.PI - ((i + 1) / seg) * Math.PI
    out.quad([P(f, u, o, spring), P(f, u + Math.cos(a0) * r, o, spring + Math.sin(a0) * r), P(f, u + Math.cos(a1) * r, o, spring + Math.sin(a1) * r), P(f, u, o, spring)],
      [f.nx, 0, f.nz], UV, c, FIXED)
  }
}

// ------------------------------------------------------------------------------------------------ the pieces

/**
 * A window `w` wide from `y0` to `y1`: the dark glass in its white sash — `lights` panes across, a transom a
 * third down — and, on the fronts, a projecting sill.
 */
function windowAt(out: MeshBuilder, f: Fr, u: number, w: number, y0: number, y1: number, lights: number, rich: boolean): void {
  panel(out, f, u - w / 2, u + w / 2, 0.04, y0, y1, GLASS)
  for (let k = 1; k < lights; k++) {
    const m = u - w / 2 + (w * k) / lights
    panel(out, f, m - 0.05, m + 0.05, 0.06, y0, y1, SASH)
  }
  if (rich) {
    const tr = y1 - (y1 - y0) * 0.32
    panel(out, f, u - w / 2, u + w / 2, 0.06, tr - 0.05, tr + 0.05, SASH)
    slab(out, f, u - w / 2 - 0.12, u + w / 2 + 0.12, 0, 0.14, y0 - 0.14, y0, TRIM, T.terra)
  }
}

/** A giant pilaster through the upper storeys: base, shaft (fluted on the fronts), capital. */
function pilaster(out: MeshBuilder, f: Fr, u: number, w: number, proud: number, fluted: boolean): void {
  const h = w / 2
  slab(out, f, u - h - 0.08, u + h + 0.08, 0, proud + 0.08, Y.order, Y.order + 0.45, TRIM, T.terra)
  slab(out, f, u - h, u + h, 0, proud, Y.order + 0.45, Y.cap, CREAM, T.stucco)
  slab(out, f, u - h - 0.12, u + h + 0.12, 0, proud + 0.14, Y.cap, Y.ent, TRIM, T.terra, true)
  if (fluted) {
    for (const k of [-1, 0, 1]) {
      const m = u + k * w * 0.28
      panel(out, f, m - 0.04, m + 0.04, proud + 0.005, Y.order + 0.7, Y.cap - 0.2, FLUTE)
    }
  }
}

/** The relief panel in a spandrel: a raised tablet with a darker sunk field and a boss at its middle. */
function relief(out: MeshBuilder, f: Fr, u: number, w: number, y0: number, y1: number): void {
  panel(out, f, u - w / 2, u + w / 2, 0.05, y0, y1, TRIM)
  panel(out, f, u - w / 2 + 0.15, u + w / 2 - 0.15, 0.06, y0 + 0.15, y1 - 0.15, RELIEF)
  panel(out, f, u - 0.22, u + 0.22, 0.07, (y0 + y1) / 2 - 0.22, (y0 + y1) / 2 + 0.22, TRIM)
}

/** The channel joints of the rusticated ground storey. */
function channels(out: MeshBuilder, f: Fr, u0: number, u1: number): void {
  for (let y = Y.plinth + 0.6; y < Y.belt - 0.2; y += 0.6) panel(out, f, u0, u1, 0.02, y - 0.04, y + 0.04, JOINT)
}

/** What every wall shares: the face, the plinth, the belt course, the entablature, cornice and parapet. */
/**
 * How far the walls run below the street datum: the city sinks a model to the LOWEST ground under its footprint,
 * and at Pier 70 that is ~4 m under 20th Street and Illinois (the first city shot had the ground storey buried to
 * the door's head). The building is drawn on the street at the corner, `drop` metres up, its plinth carried down.
 */
let drop = 0

function shell(out: MeshBuilder, f: Fr, rich: boolean, parapetTop = Y.parapet): void {
  const L = f.L
  panel(out, f, 0, L, 0, -drop, Y.roof, CREAM, T.stucco)
  slab(out, f, -0.12, L + 0.12, -0.2, 0.12, -drop, Y.plinth, PLINTH, T.granite)
  if (rich) channels(out, f, 0, L)
  slab(out, f, -0.25, L + 0.25, -0.3, 0.25, Y.belt, Y.order, TRIM, T.terra)
  // the architrave and frieze, the dentils under the cornice, the cornice
  slab(out, f, -0.2, L + 0.2, -0.3, 0.2, Y.ent, Y.cornice, CREAM, T.stucco)
  panel(out, f, -0.2, L + 0.2, 0.21, Y.ent + 0.42, Y.ent + 0.48, JOINT)
  if (rich) panel(out, f, -0.2, L + 0.2, 0.21, Y.cornice - 0.25, Y.cornice - 0.05, SHADE)
  slab(out, f, -0.85, L + 0.85, -0.3, 0.85, Y.cornice, Y.roof, TRIM, T.terra, true)
  // the parapet and its coping
  wallSlab(out, f, -0.1, L + 0.1, -0.3, 0.05, Y.roof, parapetTop, CREAM, T.stucco)
  slab(out, f, -0.2, L + 0.2, -0.4, 0.15, parapetTop, parapetTop + 0.2, TRIM, T.terra)
}

/**
 * A wall in bays: pilasters between them (fluted on the fronts), a pair of windows a bay a storey, the relief
 * panels in the spandrels, the rosettes in the frieze, the basement lights under the ground floor. `skip0` / `skip1`
 * leave the end pilaster off where the wall meets the corner bay, whose own pairs stand there.
 */
function bays(out: MeshBuilder, f: Fr, rich: boolean, skip0: boolean, skip1: boolean): void {
  const L = f.L
  if (L < 2.4) return
  if (L < 5) {
    // a short return or a light-well wall: one column of windows
    const u = L / 2
    const w = Math.min(1.3, L - 1.0)
    windowAt(out, f, u, w, W.g0, W.g1, 2, false)
    windowAt(out, f, u, w, W.s0, W.s1, 2, false)
    windowAt(out, f, u, w, W.t0, W.t1, 2, false)
    return
  }
  const pw = rich ? 0.85 : 0.75
  const e = pw / 2 + 0.05
  const n = Math.max(1, Math.round((L - 2 * e) / 4.3))
  const step = (L - 2 * e) / n
  for (let k = 0; k <= n; k++) {
    if ((k === 0 && skip0) || (k === n && skip1)) continue
    const u = e + k * step
    pilaster(out, f, u, pw, rich ? 0.3 : 0.2, rich)
    // the rosette in the frieze over it
    if (rich) slab(out, f, u - 0.25, u + 0.25, 0.2, 0.32, Y.ent + 0.6, Y.ent + 1.1, TRIM, T.terra)
  }
  for (let k = 0; k < n; k++) {
    const u = e + (k + 0.5) * step
    const clear = step - pw - 0.5
    const two = clear > 2.6
    const ww = two ? Math.min(1.35, (clear - 0.35) / 2) : Math.min(1.6, clear)
    const at = two ? [u - ww / 2 - 0.2, u + ww / 2 + 0.2] : [u]
    for (const wu of at) {
      windowAt(out, f, wu, ww, W.g0, W.g1, 2, rich)
      windowAt(out, f, wu, ww, W.s0, W.s1, 2, rich)
      windowAt(out, f, wu, ww, W.t0, W.t1, 2, rich)
      if (rich) panel(out, f, wu - ww / 2 + 0.1, wu + ww / 2 - 0.1, 0.13, 0.2, Y.plinth - 0.35, GLASS)
    }
    if (rich) relief(out, f, u, Math.min(clear, 2 * ww + 0.6), W.s1 + 0.2, W.t0 - 0.25)
  }
}

/** A balustrade along the frame from u0 to u1 at `o`, from y0 to y1: plinth, rail, balusters against shade. */
function balustrade(out: MeshBuilder, f: Fr, u0: number, u1: number, o: number, y0: number, y1: number): void {
  slab(out, f, u0, u1, o - 0.25, o, y0, y0 + 0.15, TRIM, T.terra)
  slab(out, f, u0 - 0.05, u1 + 0.05, o - 0.3, o + 0.03, y1 - 0.15, y1, TRIM, T.terra)
  panel(out, f, u0, u1, o - 0.2, y0 + 0.15, y1 - 0.15, SHADE)
  for (let u = u0 + 0.2; u < u1 - 0.1; u += 0.3) panel(out, f, u - 0.07, u + 0.07, o - 0.1, y0 + 0.15, y1 - 0.15, TRIM)
}

/** The corner bay on the chamfer: the pilaster pairs, the doorway and its steps, the balcony, the crest. */
function corner(out: MeshBuilder, f: Fr, ground: number): void {
  const L = f.L
  const m = L / 2
  const crest = Y.parapet + 1.0
  shell(out, f, true, crest)
  // the two pairs of fluted pilasters that frame the bay (stood a little prouder than the fronts')
  const pw = 0.85
  for (const u of [0.5, 0.5 + pw + 0.2, L - 0.5 - pw - 0.2, L - 0.5]) pilaster(out, f, u, pw, 0.35, true)
  for (const u of [0.5 + pw / 2 + 0.1, L - 0.5 - pw / 2 - 0.1]) slab(out, f, u - 0.6, u + 0.6, 0.2, 0.32, Y.ent + 0.6, Y.ent + 1.1, TRIM, T.terra)
  const span = Math.max(2.4, L - 2 * (0.5 + pw + 0.2) - 0.9)
  // the doorway: a moulded arched surround with its keystone, the dark doors, the transom bar
  arch(out, f, m, 0.05, Y.floor, Math.min(3.4, span), 4.6, TRIM, 8)
  arch(out, f, m, 0.07, Y.floor, Math.min(2.4, span - 0.8), 4.1, DOOR, 8)
  panel(out, f, m - 1.2, m + 1.2, 0.09, Y.floor + 2.75, Y.floor + 2.9, TRIM)
  panel(out, f, m - 0.03, m + 0.03, 0.09, Y.floor, Y.floor + 2.75, TRIM)
  slab(out, f, m - 0.3, m + 0.3, 0, 0.2, Y.floor + 4.25, Y.floor + 4.85, TRIM, T.terra)
  // the console brackets and the balcony they carry, balustraded, before the first-floor window
  for (const s of [-1, 1]) slab(out, f, m + s * 1.95 - 0.2, m + s * 1.95 + 0.2, 0, 0.75, Y.belt - 0.9, Y.belt, TRIM, T.terra, true)
  slab(out, f, m - 2.3, m + 2.3, 0, 0.95, Y.belt, Y.belt + 0.3, TRIM, T.terra, true)
  balustrade(out, f, m - 2.2, m + 2.2, 0.9, Y.belt + 0.3, Y.belt + 1.25)
  // the triple windows a storey, the relief panel between them
  const tw = Math.min(3.6, span)
  windowAt(out, f, m, tw, W.s0 + 0.3, W.s1, 3, true)
  windowAt(out, f, m, tw, W.t0, W.t1, 3, true)
  relief(out, f, m, tw, W.s1 + 0.2, W.t0 - 0.25)
  panel(out, f, m - 0.9, m + 0.9, 0.08, W.s1 + 0.45, W.t0 - 0.5, RELIEF)
  // the crest on the raised parapet: a scrolled block, a boss
  slab(out, f, m - 1.3, m + 1.3, -0.2, 0.15, crest + 0.2, crest + 0.55, TRIM, T.terra)
  slab(out, f, m - 0.6, m + 0.6, -0.15, 0.12, crest + 0.55, crest + 1.2, TRIM, T.terra)
  const c = pt(f, m, -0.05)
  prism(out, c.x, c.z, crest + 1.2, crest + 1.6, 0.3, 6, TRIM, T.terra, 0.12)
  // the steps up to the door, between low cheek walls
  const run = 1.9
  stair(out, pt(f, m - 1.9, 0), pt(f, m + 1.9, 0), ground, Y.floor, { anchor: 'top', riser: 0.15, run, colour: STEP, material: 'granite' })
  for (const s of [-1, 1]) slab(out, f, m + s * 2.15 - 0.25, m + s * 2.15 + 0.25, 0, run + 0.1, ground, Y.floor + 0.35, PLINTH, T.granite)
  // the flagpole over the corner
  const fp = pt(f, m, -1.2)
  prism(out, fp.x, fp.z, Y.roof, crest + 9, 0.07, 6, [0.86, 0.86, 0.84], T.metal, 0.05)
  prism(out, fp.x, fp.z, crest + 9, crest + 9.25, 0.13, 6, [0.82, 0.66, 0.3], FIXED, 0.05)
}

// ------------------------------------------------------------------------------------------- the building

/** The corner: the short edge between two long ones, turned ~45° from each. -1 when there is none. */
function findCorner(ring: P2[]): number {
  let best = -1
  let score = -Infinity
  const n = ring.length
  for (let i = 0; i < n; i++) {
    const f = frameOf(ring[i], ring[(i + 1) % n])
    if (f.L < 4 || f.L > 14) continue
    const p = frameOf(ring[(i + n - 1) % n], ring[i])
    const q = frameOf(ring[(i + 1) % n], ring[(i + 2) % n])
    if (p.L < 18 || q.L < 18) continue
    const dp = p.tx * f.tx + p.tz * f.tz
    const dq = q.tx * f.tx + q.tz * f.tz
    if (dp < 0.5 || dp > 0.9 || dq < 0.5 || dq > 0.9) continue
    const s = p.L + q.L
    if (s > score) { score = s; best = i }
  }
  return best
}

function bethlehemSteel(out: MeshBuilder, fit: Fit): void {
  const raw = fit.ring && fit.ring.length >= 3 ? fit.ring
    : [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  let area = 0
  for (let i = 0; i < raw.length; i++) { const a = raw[i]; const b = raw[(i + 1) % raw.length]; area += a.x * b.z - b.x * a.z }
  const ring0 = area >= 0 ? raw : [...raw].reverse()
  let ring = simplifyRing(ring0, 0.5)
  let ci = findCorner(ring)
  if (ci < 0) {
    // no chamfer drawn (a fitted rectangle): cut one at the corner between the two longest edges
    const n = ring.length
    let li = 0
    for (let i = 0; i < n; i++) {
      const f = frameOf(ring[i], ring[(i + 1) % n])
      const g = frameOf(ring[(i + 1) % n], ring[(i + 2) % n])
      const lf = frameOf(ring[li], ring[(li + 1) % n])
      const lg = frameOf(ring[(li + 1) % n], ring[(li + 2) % n])
      if (f.L + g.L > lf.L + lg.L) li = i
    }
    const v = ring[(li + 1) % n]
    const a = ring[li]
    const b = ring[(li + 2) % n]
    const cut = 4
    const da = Math.hypot(a.x - v.x, a.z - v.z) || 1
    const db = Math.hypot(b.x - v.x, b.z - v.z) || 1
    const p1 = { x: v.x + ((a.x - v.x) / da) * cut, z: v.z + ((a.z - v.z) / da) * cut }
    const p2 = { x: v.x + ((b.x - v.x) / db) * cut, z: v.z + ((b.z - v.z) / db) * cut }
    const vi = (li + 1) % n
    ring = ring.flatMap((p, j) => (j === vi ? [p1, p2] : [p]))
    ci = vi
  }
  const n = ring.length
  const prev = (ci + n - 1) % n
  const next = (ci + 1) % n
  const C = frameOf(ring[ci], ring[next])
  const at = pt(C, C.L / 2, 2)
  drop = fit.groundAt ? Math.max(0, Math.min(8, fit.groundAt(at.x, at.z))) : 0
  const ground = 0
  const v0 = out.positions.length

  for (let i = 0; i < n; i++) {
    const f = frameOf(ring[i], ring[(i + 1) % n])
    if (i === ci) { corner(out, f, Math.max(0, Math.min(Y.floor - 0.15, ground))); continue }
    const front = (i === prev || i === next)
    shell(out, f, front)
    bays(out, f, front, i === next, i === prev)
  }
  // the roof deck behind the parapet
  capPolygon(out, ring, Y.roof, ROOF, T.metal)

  // the penthouse on the roof, square to the 20th Street front, and the stack and vent beside it
  let cx = 0
  let cz = 0
  for (const p of ring) { cx += p.x; cz += p.z }
  cx /= n
  cz /= n
  const F = frameOf(ring[next], ring[(next + 1) % n])
  const cu = (cx - F.ox) * F.tx + (cz - F.oz) * F.tz
  const co = (cx - F.ox) * F.nx + (cz - F.oz) * F.nz
  slab(out, F, cu - 7, cu + 7, co - 3, co + 3, Y.roof, Y.roof + 2.4, CREAM, T.terra)
  slab(out, F, cu - 7.15, cu + 7.15, co - 3.15, co + 3.15, Y.roof + 2.4, Y.roof + 2.6, TRIM, T.terra)
  const cornerward = Math.sign(-cu) || -1
  slab(out, F, cu + cornerward * 9 - 2.2, cu + cornerward * 9 + 2.2, co + 2, co + 6.5, Y.roof, Y.roof + 3.6, CREAM, T.terra)
  slab(out, F, cu + cornerward * 9 - 2.3, cu + cornerward * 9 + 2.3, co + 1.9, co + 6.6, Y.roof + 3.6, Y.roof + 3.8, TRIM, T.terra)
  const vp = pt(F, cu + 4, co - 1)
  prism(out, vp.x, vp.z, Y.roof + 2.6, Y.roof + 4.4, 0.18, 6, [0.6, 0.6, 0.6], T.metal, 0.12)
  // everything onto the street datum
  if (drop > 0) for (let k = v0 + 1; k < out.positions.length; k += 3) out.positions[k] += drop
  drop = 0
}

export const BETHLEHEM_STEEL: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /** way/257338315 — Building 101, Bethlehem Steel / Union Iron Works Administration Building, Pier 70. */
  b4_industrial_257338315: bethlehemSteel,
}
