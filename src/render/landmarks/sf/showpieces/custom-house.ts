/**
 * The United States Custom House, 555 Battery Street at Washington (Eames & Young, 1906-11), a block from the
 * Transamerica Pyramid. From the Mapillary frames in refs/way-32859013/ (01, 03 and 04 look along the Battery
 * front from Battery Street; 05 is the Washington end close up; 06 the Jackson end past the federal building) and
 * the Commons photograph "U. S. Customhouse (San Francisco).JPG" (the Battery/Washington corner), 2026-10-21.
 *
 * A pale Raymond-granite Beaux-Arts block, U-shaped round light courts open to the west. Wikipedia's three zones,
 * which the frames bear out bay for bay:
 *  - the BASE: one tall storey of deep horizontal (banded) rustication on a plain plinth, a tall square-headed
 *    opening a bay with a bronze grille, and the Battery entrance in the middle under a granite entablature;
 *  - the MIDDLE: three storeys of smooth granite. On Battery, eleven bays of grouped triple windows between flat
 *    pilaster strips, the second-storey windows on balconies under carved cartouche pediments; the two CORNER
 *    PAVILIONS are broad blind piers each carrying a long hanging cartouche. On the Washington and Jackson ends,
 *    the same corner piers frame a GIANT ORDER of engaged columns through the three storeys (frames 05, 06);
 *  - the TOP: the fifth storey as a frieze of small windows three to a bay between carved eagles, the heavy
 *    modillioned cornice, the blocking course with raised blocks over the corner piers, a sculpture group (the
 *    eagle and figures) over the middle of Battery, and a later storey set back on the roof (frame 03).
 *
 * The frame: the real outline as given. The Battery front is its longest edge (79 m); the Washington and Jackson
 * ends are that edge's two neighbours; everything else is the plainer rear and the light-court walls. Each wall is
 * laid out in its own edge frame: u along it, o out of it (negative into the building), y up.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { capPolygon } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { prism, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { classicalColumn } from '../../column.ts'
import { stair } from '../../parts.ts'

type P2 = { x: number; z: number }
const FIXED = 0
const EMIT = 0.5
const T = { granite: surfaceTag('granite'), metal: surfaceTag('metal'), concrete: surfaceTag('concrete') }

// the warm pale grey Raymond granite (frames 03, 05 and the Commons photograph: grey, not white)
const GRANITE: Rgb = [0.77, 0.76, 0.72]
const RUSTIC: Rgb = [0.72, 0.71, 0.67]
const TRIM: Rgb = [0.8, 0.79, 0.75]
const JOINT: Rgb = [0.44, 0.44, 0.42]
const SHADE: Rgb = [0.58, 0.57, 0.54]
const CARVE: Rgb = [0.66, 0.65, 0.61]
const REAR: Rgb = [0.71, 0.7, 0.66]
const GLASS: Rgb = [0.18, 0.2, 0.23]
const BRONZE: Rgb = [0.24, 0.22, 0.18]
const LAMP: Rgb = [1, 0.86, 0.56]
const ROOF: Rgb = [0.5, 0.5, 0.49]
const PENT: Rgb = [0.66, 0.66, 0.64]

/** The heights at OSM's 25 m (the blocking course's top); everything scales with the entry's height. */
const H0 = {
  plinth: 1.0,
  base: 7.0,       // top of the rusticated storey
  string: 7.6,     // top of the string course: the smooth middle zone starts
  mid: 19.2,       // top of the middle zone: the architrave
  arch: 19.7,      // top of the architrave: the frieze storey
  frieze: 22.3,    // top of the frieze: the cornice
  cornice: 24.0,
  top: 25.0,       // the blocking course
}

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

/**
 * A block in a frame: `u0..u1` along, `o0..o1` out, `y0..y1` up. The face at `o0` is left off (it is against the
 * wall) unless `back`: the free-standing pieces on the roof need it; `bottom` false drops the underside.
 */
function slab(out: MeshBuilder, f: Fr, u0: number, u1: number, o0: number, o1: number, y0: number, y1: number, c: Rgb, tag = FIXED, bottom = true, back = false): void {
  const Q = (u: number, o: number, y: number) => P(f, u, o, y)
  out.quad([Q(u0, o1, y0), Q(u1, o1, y0), Q(u1, o1, y1), Q(u0, o1, y1)], [f.nx, 0, f.nz], UV, c, tag)
  if (back) out.quad([Q(u1, o0, y0), Q(u0, o0, y0), Q(u0, o0, y1), Q(u1, o0, y1)], [-f.nx, 0, -f.nz], UV, c, tag)
  out.quad([Q(u0, o0, y0), Q(u0, o1, y0), Q(u0, o1, y1), Q(u0, o0, y1)], [-f.tx, 0, -f.tz], UV, c, tag)
  out.quad([Q(u1, o1, y0), Q(u1, o0, y0), Q(u1, o0, y1), Q(u1, o1, y1)], [f.tx, 0, f.tz], UV, c, tag)
  out.quad([Q(u0, o0, y1), Q(u0, o1, y1), Q(u1, o1, y1), Q(u1, o0, y1)], [0, 1, 0], UV, c, tag)
  if (bottom) out.quad([Q(u0, o1, y0), Q(u0, o0, y0), Q(u1, o0, y0), Q(u1, o1, y0)], [0, -1, 0], UV, c, tag)
}

/** A flat rectangle facing out of the wall, `o` metres proud of it. */
function panel(out: MeshBuilder, f: Fr, u0: number, u1: number, o: number, y0: number, y1: number, c: Rgb, tag = FIXED): void {
  out.quad([P(f, u0, o, y0), P(f, u1, o, y0), P(f, u1, o, y1), P(f, u0, o, y1)], [f.nx, 0, f.nz], UV, c, tag)
}

/** A disc (or an oval, `ry` tall) on the wall: a cartouche, a medallion. */
function roundel(out: MeshBuilder, f: Fr, u: number, o: number, y: number, r: number, ry: number, c: Rgb, seg = 4): void {
  for (let i = 0; i < seg; i++) {
    const a0 = (i / seg) * Math.PI * 2
    const a1 = ((i + 0.5) / seg) * Math.PI * 2
    const a2 = ((i + 1) / seg) * Math.PI * 2
    out.quad([P(f, u, o, y), P(f, u + Math.cos(a0) * r, o, y + Math.sin(a0) * ry), P(f, u + Math.cos(a1) * r, o, y + Math.sin(a1) * ry), P(f, u + Math.cos(a2) * r, o, y + Math.sin(a2) * ry)],
      [f.nx, 0, f.nz], UV, c, FIXED)
  }
}

/** A low triangular pediment on the wall, `w` wide, `h` tall, its base at `y`. */
function gable(out: MeshBuilder, f: Fr, u: number, o: number, y: number, w: number, h: number, c: Rgb): void {
  out.quad([P(f, u - w / 2, o, y), P(f, u + w / 2, o, y), P(f, u, o, y + h), P(f, u, o, y + h)], [f.nx, 0, f.nz], UV, c, FIXED)
}

/** A carved eagle, wings spread, on the wall: a body, two raised wings, a cartouche on its breast. */
function eagle(out: MeshBuilder, f: Fr, u: number, o: number, y: number, s: number): void {
  out.quad([P(f, u - 0.15 * s, o, y + 0.2 * s), P(f, u - 1.0 * s, o, y + 0.55 * s), P(f, u - 0.9 * s, o, y + 1.0 * s), P(f, u - 0.1 * s, o, y + 0.75 * s)], [f.nx, 0, f.nz], UV, CARVE, FIXED)
  out.quad([P(f, u + 0.1 * s, o, y + 0.75 * s), P(f, u + 0.9 * s, o, y + 1.0 * s), P(f, u + 1.0 * s, o, y + 0.55 * s), P(f, u + 0.15 * s, o, y + 0.2 * s)], [f.nx, 0, f.nz], UV, CARVE, FIXED)
  roundel(out, f, u, o + 0.02, y + 0.5 * s, 0.32 * s, 0.45 * s, TRIM, 4)
}

/** A bronze lantern on a bracket off the wall, its glass lit. */
function wallLantern(out: MeshBuilder, f: Fr, u: number, y: number): void {
  slab(out, f, u - 0.06, u + 0.06, 0, 0.45, y - 0.05, y + 0.05, BRONZE)
  slab(out, f, u - 0.2, u + 0.2, 0.35, 0.75, y - 0.55, y + 0.15, BRONZE)
  slab(out, f, u - 0.16, u + 0.16, 0.39, 0.71, y - 0.45, y + 0.05, LAMP, EMIT)
}

/** A lamp standard on a plinth: a bronze post and a lit lantern. */
function lampStandard(out: MeshBuilder, x: number, z: number, y0: number): void {
  prism(out, x, z, y0, y0 + 0.5, 0.26, 6, BRONZE, T.metal, 0.2)
  prism(out, x, z, y0 + 0.5, y0 + 3.4, 0.08, 6, BRONZE, T.metal, 0.07)
  prism(out, x, z, y0 + 3.4, y0 + 4.1, 0.25, 6, LAMP, EMIT, 0.3)
  prism(out, x, z, y0 + 4.1, y0 + 4.45, 0.32, 6, BRONZE, T.metal, 0.05)
}

// ------------------------------------------------------------------------------------- shared wall courses

/** The rusticated base: plinth, the deep banded joints, the string course over it. */
function baseCourses(out: MeshBuilder, f: Fr, u0: number, u1: number, Y: typeof H0, o = 0): void {
  panel(out, f, u0, u1, o, 0, Y.base, RUSTIC, T.granite)
  slab(out, f, u0 - 0.05, u1 + 0.05, o - 0.3, o + 0.25, 0, Y.plinth, GRANITE, T.granite, false)
  for (let y = Y.plinth + 0.75; y < Y.base - 0.2; y += 0.75) panel(out, f, u0, u1, o + 0.03, y - 0.07, y + 0.07, JOINT)
  slab(out, f, u0 - 0.1, u1 + 0.1, o - 0.3, o + 0.35, Y.base, Y.string, TRIM, T.granite)
}

/** The top: architrave, frieze wall, the modillioned cornice, the blocking course. */
function topCourses(out: MeshBuilder, f: Fr, u0: number, u1: number, Y: typeof H0, rich: boolean): void {
  slab(out, f, u0 - 0.1, u1 + 0.1, -0.3, 0.3, Y.mid, Y.arch, TRIM, T.granite)
  panel(out, f, u0, u1, 0, Y.arch, Y.frieze, GRANITE, T.granite)
  const fz = Y.frieze
  // the bed moulding, the modillions (every 1.1 m on the dressed fronts), the corona and its drip
  slab(out, f, u0 - 0.3, u1 + 0.3, -0.3, 0.35, fz, fz + 0.35, TRIM, T.granite)
  if (rich) {
    panel(out, f, u0 - 1.2, u1 + 1.2, 0.36, fz + 0.35, fz + 0.75, SHADE)
    for (let u = u0 + 0.4; u < u1 - 0.2; u += 1.1) slab(out, f, u - 0.13, u + 0.13, 0.35, 1.2, fz + 0.4, fz + 0.75, TRIM, FIXED)
  }
  const proj = rich ? 1.3 : 0.6
  slab(out, f, u0 - proj, u1 + proj, -0.3, proj, rich ? fz + 0.75 : fz + 0.35, Y.cornice, TRIM, T.granite)
  panel(out, f, u0 - proj, u1 + proj, proj + 0.01, Y.cornice - 0.45, Y.cornice - 0.38, JOINT)
  // the blocking course, set back on the cornice
  slab(out, f, u0, u1, -0.5, 0, Y.cornice, Y.top, GRANITE, T.granite, false, true)
}

// --------------------------------------------------------------------------------------------- the pieces

/** A corner pavilion's blind pier on a dressed face, `u0..u1`: proud, its long hanging cartouche, the frieze eagle. */
function cornerPier(out: MeshBuilder, f: Fr, u0: number, u1: number, Y: typeof H0, outer: 'lo' | 'hi'): void {
  const p = 0.4
  // proud of the wall, wrapping the corner by its projection
  const a = outer === 'lo' ? u0 - p : u0
  const b = outer === 'hi' ? u1 + p : u1
  slab(out, f, a, b, 0, p, Y.string, Y.mid, GRANITE, T.granite, false)
  panel(out, f, a, b, p + 0.01, Y.string, Y.string + 0.3, TRIM)
  const c = (u0 + u1) / 2
  // the hanging cartouche: a long garlanded panel under a carved oval (Commons photograph, frame 01)
  const k = (Y.mid - Y.string) / 11.6
  slab(out, f, c - 0.55, c + 0.55, p, p + 0.2, Y.string + 5.0 * k, Y.string + 9.2 * k, CARVE, FIXED, false)
  panel(out, f, c - 0.3, c + 0.3, p + 0.21, Y.string + 5.4 * k, Y.string + 8.6 * k, SHADE)
  roundel(out, f, c, p + 0.22, Y.string + 9.7 * k, 0.75, 0.6, CARVE, 6)
  roundel(out, f, c, p + 0.24, Y.string + 9.7 * k, 0.4, 0.33, SHADE, 4)
  // the eagle in the frieze over the pier
  eagle(out, f, c, 0.05, Y.arch + 0.3, 1.4)
  // the raised block on the blocking course over the pier
  slab(out, f, u0, u1, -0.6, 0, Y.top, Y.top + 0.9, GRANITE, T.granite, false, true)
}

/** One Battery bay's three storeys of triple windows, `w` wide, centred on `u`; the second storey on a balcony, the top under a cartouche. */
function tripleBay(out: MeshBuilder, f: Fr, u: number, w: number, Y: typeof H0, o: number): void {
  const fl = (Y.mid - Y.string) / 3
  const ww = Math.min(3.0, w * 0.5)
  for (let s = 0; s < 3; s++) {
    const y0 = Y.string + s * fl + (s === 0 ? 0.8 : 0.7)
    const y1 = y0 + fl - (s === 0 ? 1.4 : 1.6)
    panel(out, f, u - ww / 2 - 0.25, u + ww / 2 + 0.25, o + 0.04, y0 - 0.2, y1 + 0.25, TRIM)
    panel(out, f, u - ww / 2, u + ww / 2, o + 0.06, y0, y1, GLASS)
    for (const d of [-1, 1]) panel(out, f, u + d * ww / 6 - 0.12, u + d * ww / 6 + 0.12, o + 0.07, y0, y1, TRIM)
    if (s === 0) {
      // the balcony and its balusters as pale strips on the shade
      slab(out, f, u - ww / 2 - 0.45, u + ww / 2 + 0.45, o, o + 0.5, y0 - 0.3, y0 - 0.1, TRIM, FIXED)
      panel(out, f, u - ww / 2 - 0.35, u + ww / 2 + 0.35, o + 0.3, y0 - 0.95, y0 - 0.3, SHADE)
      for (let b = u - ww / 2 - 0.2; b < u + ww / 2 + 0.3; b += 0.3) panel(out, f, b - 0.07, b + 0.07, o + 0.4, y0 - 0.95, y0 - 0.3, TRIM)
      slab(out, f, u - ww / 2 - 0.45, u + ww / 2 + 0.45, o, o + 0.45, y0 - 1.1, y0 - 0.95, TRIM, FIXED, false)
    }
    if (s === 2) {
      // the top storey's cartouche pediment, up under the architrave (the Commons photograph): a hood and the carved oval
      slab(out, f, u - ww / 2 - 0.4, u + ww / 2 + 0.4, o, o + 0.35, y1 + 0.25, y1 + 0.42, TRIM, FIXED)
      gable(out, f, u, o + 0.05, y1 + 0.42, ww + 0.4, 0.45, TRIM)
      roundel(out, f, u, o + 0.1, y1 + 0.6, 0.45, 0.42, CARVE, 6)
      roundel(out, f, u, o + 0.12, y1 + 0.6, 0.22, 0.2, SHADE, 4)
    }
    if (s > 0) {
      slab(out, f, u - ww / 2 - 0.35, u + ww / 2 + 0.35, o, o + 0.2, y0 - 0.35, y0 - 0.2, TRIM, FIXED)
      // the carved panel under the window: the spandrel between the storeys
      panel(out, f, u - ww / 2, u + ww / 2, o + 0.03, y0 - 1.15, y0 - 0.45, CARVE)
    }
  }
}

/** The frieze storey's small windows over a bay, `n` of them. */
function friezeWindows(out: MeshBuilder, f: Fr, u: number, w: number, n: number, Y: typeof H0): void {
  const step = Math.min(1.25, w / (n + 1))
  for (let j = 0; j < n; j++) {
    const c = u + (j - (n - 1) / 2) * step
    panel(out, f, c - 0.38, c + 0.38, 0.05, Y.arch + 0.55, Y.frieze - 0.5, GLASS)
  }
}

/** A tall square-headed base opening with its bronze grille and keystone, centred on `u`. */
function baseOpening(out: MeshBuilder, f: Fr, u: number, w: number, Y: typeof H0, o = 0): void {
  const y0 = Y.plinth
  const y1 = Y.base - 1.1
  panel(out, f, u - w / 2 - 0.3, u + w / 2 + 0.3, o + 0.04, y0, y1 + 0.3, GRANITE)
  panel(out, f, u - w / 2, u + w / 2, o + 0.06, y0, y1, GLASS)
  for (let k = 1; k < 4; k++) panel(out, f, u - w / 2 + (w * k) / 4 - 0.04, u - w / 2 + (w * k) / 4 + 0.04, o + 0.08, y0, y1, BRONZE)
  panel(out, f, u - w / 2, u + w / 2, o + 0.08, y0 + (y1 - y0) * 0.62, y0 + (y1 - y0) * 0.62 + 0.1, BRONZE)
  slab(out, f, u - 0.3, u + 0.3, o, o + 0.2, y1 - 0.1, y1 + 0.6, TRIM, FIXED, false)
}

// ------------------------------------------------------------------------------------------- the Battery front

function batteryFront(out: MeshBuilder, f: Fr, Y: typeof H0, floor: number): void {
  const L = f.L
  const pw = Math.min(6.5, L * 0.085)
  const n = Math.max(5, Math.round((L - 2 * pw) / 6) | 1)
  const step = (L - 2 * pw) / n
  const mid = (k: number): number => pw + (k + 0.5) * step
  const centre = (n - 1) / 2

  // ---- the base, the smooth middle zone, the top
  baseCourses(out, f, 0, L, Y)
  panel(out, f, 0, L, 0, Y.string, Y.mid, GRANITE, T.granite)
  topCourses(out, f, 0, L, Y, true)
  cornerPier(out, f, 0, pw, Y, 'lo')
  cornerPier(out, f, L - pw, L, Y, 'hi')
  for (const [a, b] of [[0, pw], [L - pw, L]]) baseOpening(out, f, (a + b) / 2, 1.6, Y)

  // ---- the pilaster strips between the bays, with their capitals
  for (let k = 1; k < n; k++) {
    const u = pw + k * step
    slab(out, f, u - 1.0, u + 1.0, 0, 0.3, Y.string, Y.mid, GRANITE, T.granite, false)
    slab(out, f, u - 1.15, u + 1.15, 0, 0.42, Y.mid - 0.6, Y.mid, TRIM, FIXED, false)
    eagle(out, f, u, 0.05, Y.arch + 0.35, 1.0)
  }

  // ---- the bays
  for (let k = 0; k < n; k++) {
    const u = mid(k)
    const isC = k === centre
    const o = isC ? 0.6 : 0
    tripleBay(out, f, u, step, Y, o)
    friezeWindows(out, f, u, step, 3, Y)
    if (!isC) baseOpening(out, f, u, Math.min(2.2, step * 0.38), Y)
  }

  // ---- the entrance: the centre bay brought forward, a deep doorway under a granite entablature, lanterns
  const cu = mid(centre)
  const hw = step / 2 + 0.6
  slab(out, f, cu - hw, cu + hw, 0, 0.6, 0, Y.mid, GRANITE, T.granite, false)
  for (let y = Y.plinth + 0.75; y < Y.base - 0.2; y += 0.75) panel(out, f, cu - hw, cu + hw, 0.63, y - 0.07, y + 0.07, JOINT)
  slab(out, f, cu - hw - 0.15, cu + hw + 0.15, 0.3, 1.0, Y.base, Y.string, TRIM, T.granite)
  const dw = Math.min(3.4, step * 0.6)
  const dTop = Y.base - 0.9
  // the door case: the surround, the deep reveal, the bronze doors and their transom grille
  panel(out, f, cu - dw / 2 - 0.5, cu + dw / 2 + 0.5, 0.64, floor, dTop + 0.4, TRIM)
  panel(out, f, cu - dw / 2, cu + dw / 2, 0.66, floor, dTop, SHADE)
  panel(out, f, cu - dw / 2 + 0.25, cu + dw / 2 - 0.25, 0.67, floor, dTop - 0.25, BRONZE)
  panel(out, f, cu - 0.04, cu + 0.04, 0.68, floor, floor + (dTop - floor) * 0.62, GLASS)
  panel(out, f, cu - dw / 2 + 0.35, cu + dw / 2 - 0.35, 0.68, floor + (dTop - floor) * 0.66, dTop - 0.35, GLASS)
  // the entablature over it on two consoles, and the carved cartouche on it
  slab(out, f, cu - dw / 2 - 0.9, cu + dw / 2 + 0.9, 0.6, 1.25, dTop + 0.4, dTop + 0.95, TRIM, FIXED)
  for (const s of [-1, 1]) slab(out, f, cu + s * (dw / 2 + 0.55) - 0.2, cu + s * (dw / 2 + 0.55) + 0.2, 0.6, 1.1, dTop - 0.6, dTop + 0.4, TRIM, FIXED, false)
  roundel(out, f, cu, 1.0, dTop + 1.35, 0.55, 0.5, CARVE, 6)
  for (const s of [-1, 1]) wallLantern(out, f, cu + s * (dw / 2 + 1.5), floor + 3.0)

  // ---- the steps: a broad flight the width of the pavilion, between cheek plinths with lamp standards
  const run = Math.max(1.2, Math.min(4.2, floor * 2.6))
  const sOut = 0.6
  const a = pt(f, cu - hw + 0.6, sOut)
  const b = pt(f, cu + hw - 0.6, sOut)
  stair(out, a, b, 0, floor, { anchor: 'top', riser: 0.16, run, colour: GRANITE, material: 'granite' })
  slab(out, f, cu - hw + 0.6, cu + hw - 0.6, 0, sOut + 0.01, 0, floor, GRANITE, T.granite, false)
  for (const [u0, u1] of [[cu - hw - 0.2, cu - hw + 0.6], [cu + hw - 0.6, cu + hw + 0.2]]) {
    slab(out, f, u0, u1, sOut, sOut + run + 0.2, 0, floor + 0.5, RUSTIC, T.granite)
    const c = pt(f, (u0 + u1) / 2, sOut + run - 0.3)
    lampStandard(out, c.x, c.z, floor + 0.5)
  }

  // ---- the sculpture group over the cornice: a pedestal, the eagle with spread wings, a seated figure each side
  const sy = Y.top
  slab(out, f, cu - 3.2, cu + 3.2, -1.6, 0.2, sy - 0.2, sy + 1.0, GRANITE, T.granite, false, true)
  const ce = pt(f, cu, -0.7)
  prism(out, ce.x, ce.z, sy + 1.0, sy + 2.6, 0.55, 6, CARVE, T.granite, 0.25)
  slab(out, f, cu - 2.0, cu - 0.3, -0.75, -0.55, sy + 1.9, sy + 3.0, CARVE, T.granite, false, true)
  slab(out, f, cu + 0.3, cu + 2.0, -0.75, -0.55, sy + 1.9, sy + 3.0, CARVE, T.granite, false, true)
  for (const s of [-1, 1]) {
    const c = pt(f, cu + s * 2.3, -0.6)
    prism(out, c.x, c.z, sy + 1.0, sy + 1.9, 0.65, 6, CARVE, T.granite, 0.45)
    prism(out, c.x, c.z, sy + 1.9, sy + 2.9, 0.35, 6, CARVE, T.granite, 0.22)
    prism(out, c.x, c.z, sy + 2.9, sy + 3.3, 0.2, 5, CARVE, T.granite, 0.12)
  }
}

// ------------------------------------------------------------------------------------------- the end fronts

/** Washington or Jackson: the corner piers, a giant order of engaged columns between, a window bay between each pair. */
function endFront(out: MeshBuilder, f: Fr, Y: typeof H0): void {
  const L = f.L
  const pw = Math.min(5.5, L * 0.17)
  const n = Math.max(2, Math.round((L - 2 * pw) / 4.4))
  const step = (L - 2 * pw) / n
  baseCourses(out, f, 0, L, Y)
  panel(out, f, 0, L, 0, Y.string, Y.mid, GRANITE, T.granite)
  topCourses(out, f, 0, L, Y, true)
  cornerPier(out, f, 0, pw, Y, 'lo')
  cornerPier(out, f, L - pw, L, Y, 'hi')
  const heading = Math.atan2(f.nx, f.nz)
  const r = 0.5
  for (let k = 0; k <= n; k++) {
    const u = pw + k * step
    const c = pt(f, u, 0.15)
    // engaged, a dozen a building: the mid tier
    classicalColumn(out, c.x, c.z, Y.string + 0.6, Y.mid, r, GRANITE, { order: 'corinthian', tier: 'mid', tag: T.granite, heading })
    slab(out, f, u - 0.75, u + 0.75, 0, 0.75, Y.string, Y.string + 0.6, TRIM, FIXED, false)
    if (k > 0 && k < n) eagle(out, f, u, 0.05, Y.arch + 0.35, 1.0)
  }
  const fl = (Y.mid - Y.string) / 3
  for (let k = 0; k < n; k++) {
    const u = pw + (k + 0.5) * step
    const ww = Math.min(1.9, step * 0.45)
    for (let s = 0; s < 3; s++) {
      const y0 = Y.string + s * fl + (s === 0 ? 0.8 : 0.7)
      const y1 = y0 + fl - (s === 0 ? 1.4 : 1.6)
      panel(out, f, u - ww / 2 - 0.25, u + ww / 2 + 0.25, 0.04, y0 - 0.2, y1 + 0.25, TRIM)
      panel(out, f, u - ww / 2, u + ww / 2, 0.06, y0, y1, GLASS)
      panel(out, f, u - 0.05, u + 0.05, 0.07, y0, y1, TRIM)
      if (s === 0) {
        // the balconette on its consoles, and the small pediment over the window (frame 05)
        slab(out, f, u - ww / 2 - 0.4, u + ww / 2 + 0.4, 0, 0.45, y0 - 0.25, y0 - 0.1, TRIM, FIXED)
        panel(out, f, u - ww / 2 - 0.3, u + ww / 2 + 0.3, 0.25, y0 - 0.85, y0 - 0.25, SHADE)
        for (let b = u - ww / 2 - 0.15; b < u + ww / 2 + 0.25; b += 0.3) panel(out, f, b - 0.07, b + 0.07, 0.35, y0 - 0.85, y0 - 0.25, TRIM)
        slab(out, f, u - ww / 2 - 0.35, u + ww / 2 + 0.35, 0, 0.3, y1 + 0.25, y1 + 0.42, TRIM, FIXED)
        gable(out, f, u, 0.04, y1 + 0.42, ww + 0.7, 0.6, TRIM)
      }
    }
    friezeWindows(out, f, u, step, 2, Y)
    baseOpening(out, f, u, Math.min(1.8, step * 0.4), Y)
  }
}

// ------------------------------------------------------------------------------------------- the rear walls

/** The rear and the light-court walls: granite, the base banded, punched windows, a plain cornice. */
function rearWall(out: MeshBuilder, f: Fr, Y: typeof H0): void {
  const L = f.L
  panel(out, f, 0, L, 0, 0, Y.top, REAR, T.granite)
  for (let y = Y.plinth + 0.75; y < Y.base - 0.2; y += 0.75) panel(out, f, 0, L, 0.02, y - 0.05, y + 0.05, JOINT)
  slab(out, f, -0.05, L + 0.05, -0.2, 0.2, Y.base, Y.string, REAR, T.granite)
  slab(out, f, -0.3, L + 0.3, -0.2, 0.5, Y.frieze + 0.3, Y.cornice, REAR, T.granite)
  slab(out, f, 0, L, -0.4, 0, Y.cornice, Y.top, REAR, T.granite, false, true)
  if (L < 4) return
  const n = Math.max(1, Math.round((L - 2) / 3.4))
  const step = (L - 2) / n
  const fl = (Y.mid - Y.string) / 3
  for (let k = 0; k < n; k++) {
    const u = 1 + step * (k + 0.5)
    panel(out, f, u - 0.65, u + 0.65, 0.04, Y.plinth + 1.6, Y.base - 1.3, GLASS)
    for (let s = 0; s < 3; s++) panel(out, f, u - 0.65, u + 0.65, 0.04, Y.string + s * fl + 0.8, Y.string + (s + 1) * fl - 0.8, GLASS)
    panel(out, f, u - 0.5, u + 0.5, 0.04, Y.arch + 0.5, Y.frieze - 0.4, GLASS)
  }
}

// ------------------------------------------------------------------------------------------ the building

function customHouse(out: MeshBuilder, fit: Fit): void {
  const raw = fit.ring && fit.ring.length >= 3 ? fit.ring
    : [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  let area = 0
  for (let i = 0; i < raw.length; i++) { const a = raw[i]; const b = raw[(i + 1) % raw.length]; area += a.x * b.z - b.x * a.z }
  const ring = area >= 0 ? raw : [...raw].reverse()

  const k = (fit.height || 25) / 25
  const Y = Object.fromEntries(Object.entries(H0).map(([name, v]) => [name, v * k])) as typeof H0

  // Battery: the longest edge. Washington and Jackson: its two neighbours.
  const N = ring.length
  const len = (i: number): number => { const a = ring[(i + N) % N]; const b = ring[(i + 1) % N]; return Math.hypot(b.x - a.x, b.z - a.z) }
  let front = 0
  for (let i = 1; i < N; i++) if (len(i) > len(front)) front = i
  const ends = new Set([(front - 1 + N) % N, (front + 1) % N])
  const F = frameOf(ring[front], ring[(front + 1) % N])

  // the entrance floor: a few steps over the pavement at the middle of the Battery front
  const cm = pt(F, F.L / 2, 1.5)
  const g = fit.groundAt ? fit.groundAt(cm.x, cm.z) : 0
  const floor = Math.max(0.6, g + 1.0)

  for (let i = 0; i < N; i++) {
    const f = frameOf(ring[i], ring[(i + 1) % N])
    if (i === front) batteryFront(out, f, Y, floor)
    else if (ends.has(i) && f.L > 15) endFront(out, f, Y)
    else rearWall(out, f, Y)
  }
  capPolygon(out, ring, Y.cornice + 0.4, ROOF, T.metal)

  // ---- the storey set back on the roof (frame 03): over the Battery range, behind the blocking course
  const depth = Math.min(10, F.L * 0.13)
  const s0 = F.L * 0.2
  const s1 = F.L * 0.8
  const o0 = -8
  const o1 = -4.5 - depth
  const pent = frameOf(pt(F, s0, o0), pt(F, s1, o0))
  const py0 = Y.cornice + 0.4
  const py1 = Y.top + 2.2 * k
  slab(out, F, s0, s1, o1, o0, py0, py1, PENT, T.concrete, false, true)
  slab(out, F, s0 - 0.2, s1 + 0.2, o1 - 0.2, o0 + 0.2, py1 - 0.35, py1, GRANITE, T.granite, false, true)
  const pn = Math.round((s1 - s0) / 3.6)
  for (let j = 0; j < pn; j++) {
    const u = ((j + 0.5) * (s1 - s0)) / pn
    panel(out, pent, u - 0.5, u + 0.5, 0.04, py0 + 1.0, py1 - 0.6, GLASS)
  }

  // ---- the flagpole on the set-back storey, over the middle (frames 01, 03)
  const fp = pt(F, F.L / 2, o0 - depth / 2)
  prism(out, fp.x, fp.z, py1, py1 + 9, 0.08, 6, [0.86, 0.86, 0.84], T.metal, 0.05)
  prism(out, fp.x, fp.z, py1 + 9, py1 + 9.2, 0.14, 6, [0.82, 0.66, 0.3], FIXED, 0.14)
}

export const CUSTOM_HOUSE: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /** The US Custom House, 555 Battery St (way/32859013): banded base, triple-window bays, giant order on the ends, entrance steps. */
  usCustomHouse_32859013: customHouse,
}
