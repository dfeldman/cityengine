/**
 * GRACE CATHEDRAL (Lewis Hobart, 1928–64; way/32946942) on the top of Nob Hill — French Gothic after Notre-Dame and
 * Amiens, cast in reinforced concrete scored as stone. Rebuilt by hand (2026-10-21) from the Mapillary frames in
 * p3/refs/way-32946942/ and Wikipedia's figures; it replaces grace.ts's `cathedral()` kit call, which read as a
 * generic church (towers of identical stacked windows, a portal the size of a door).
 *
 * What the frames and figures show:
 *  - the ENTRANCE FRONT faces EAST across Taylor Street to Huntington Park (manifest front 81): two square TOWERS,
 *    flat-topped with small corner pinnacles (no spires), 53 m above the street (Wikipedia); each has clasping corner
 *    buttresses, a plain lower shaft, a pierced gallery band, a stage of blind paired lancets and then the BELFRY —
 *    two very tall, deep lancet openings a face, louvred low down, sky through them above;
 *  - between the towers the GREAT ROSE over a projecting gabled PORCH (a steep wimperg between slender pinnacles)
 *    whose deep pointed portal holds the gilded bronze Ghiberti doors; a small arcaded gallery over the rose, the nave
 *    gable above that; a smaller pointed door in each tower's base;
 *  - the floor stands 6.1 m (20 ft) above the street: a GRAND STAIR, two broad flights the full width of the front
 *    with a landing, climbs from the plaza to a terrace before the three doors;
 *  - the long NAVE (frame 03, California Street): a tall plain undercroft, tall aisle bays each of two lancets under a
 *    roundel in one pointed arch, stepped buttresses with pinnacles, a parapet; set back above, a short clerestory under
 *    flying buttresses, and the steep dark slate-grey roof;
 *  - the TRANSEPTS (frame 02): a front each with a pointed portal, a row of lancets and a rose in one great arch, a
 *    gable between octagonal corner turrets;
 *  - the narrower CHOIR and its polygonal APSE (frame 01, Jones Street), the tall apse windows;
 *  - the slender dark FLÈCHE over the crossing, 75 m above the street (Wikipedia) — with the towers, the skyline
 *    signature from all over the city.
 *  - colour: pale warm grey concrete, dark slate roofs, the flèche leaden.
 *
 * The frame: the footprint given supplies only the long axis, which end is the front (the end whose extreme corners
 * spread wide — the tower block — not the narrow apse) and the extents. The city hands this building its CONVEX HULL,
 * so the cross plan (porch, tower block, aisled nave, transept, choir, apse) is laid out from proportions measured on
 * OSM's real outline and scaled to those extents; the showcase's real outline gives the same plan. Everything is laid
 * out in that frame (`u` across, positive to the north; `o` along the axis, positive toward the front), y up from the
 * model's base, the church floor at the front grade plus 6.1 m.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { capPolygon } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { prism, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { faceBand } from '../../tower.ts'
import { stair, clockFace } from '../../parts.ts'
import { beam, pinnacle } from '../../kit.ts'
import { crossFinial } from '../../church.ts'

type P2 = { x: number; z: number }
type V3 = [number, number, number]
const FIXED = 0
const T = { stone: surfaceTag('ashlar'), roof: surfaceTag('tile'), metal: surfaceTag('metal'), granite: surfaceTag('granite') }
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

/** the pale warm grey of the concrete in the frames' sun; its mouldings a shade lighter, its reveals in shade */
const STONE: Rgb = [0.69, 0.68, 0.65]
const TRIM: Rgb = [0.76, 0.74, 0.7]
const REVEAL: Rgb = [0.54, 0.52, 0.49]
const DEEP: Rgb = [0.4, 0.38, 0.35]
const GLASS: Rgb = [0.12, 0.13, 0.17]
const VOID: Rgb = [0.07, 0.07, 0.08]
const LOUVRE: Rgb = [0.3, 0.29, 0.28]
const ROOF: Rgb = [0.31, 0.32, 0.34]
const LEAD: Rgb = [0.2, 0.21, 0.22]
/** the Ghiberti doors: gilded bronze, dark in the porch's shade */
const BRONZE: Rgb = [0.5, 0.39, 0.18]
const BRONZE_LIT: Rgb = [0.66, 0.53, 0.26]
/** the porch, its dressed stone catching the light a shade paler than the walls */
const PORCH: Rgb = [0.79, 0.77, 0.73]
const PAVING: Rgb = [0.6, 0.59, 0.56]

// ------------------------------------------------------------------------------------------- a wall's frame

/** `u` along the wall from the origin, `o` out of it (negative into the building), y up. n = (tz, −tx). */
interface Fr { ox: number; oz: number; tx: number; tz: number; nx: number; nz: number; L: number }

/** a frame through `at` whose outward normal is `n` */
const frN = (n: P2, at: P2, L = 0): Fr => ({ ox: at.x, oz: at.z, tx: -n.z, tz: n.x, nx: n.x, nz: n.z, L })
/** the frame of a wall from a to b, its normal turned away from `inside` */
const frAB = (a: P2, b: P2, inside: P2): Fr => {
  const L = Math.hypot(b.x - a.x, b.z - a.z) || 1
  let tx = (b.x - a.x) / L
  let tz = (b.z - a.z) / L
  let ox = a.x
  let oz = a.z
  if ((inside.x - a.x) * tz - (inside.z - a.z) * tx > 0) { ox = b.x; oz = b.z; tx = -tx; tz = -tz }
  return { ox, oz, tx, tz, nx: tz, nz: -tx, L }
}
const P = (f: Fr, u: number, o: number, y: number): V3 => [f.ox + f.tx * u + f.nx * o, y, f.oz + f.tz * u + f.nz * o]
const pt = (f: Fr, u: number, o: number): P2 => ({ x: f.ox + f.tx * u + f.nx * o, z: f.oz + f.tz * u + f.nz * o })
const inFr = (f: Fr, p: P2): { u: number; o: number } =>
  ({ u: (p.x - f.ox) * f.tx + (p.z - f.oz) * f.tz, o: (p.x - f.ox) * f.nx + (p.z - f.oz) * f.nz })
const dir = (f: Fr, du: number, dy: number, dn: number): V3 => [f.tx * du + f.nx * dn, dy, f.tz * du + f.nz * dn]

/** A block in a frame: `u0..u1` along, `o0..o1` out, `y0..y1` up. */
function slab(out: MeshBuilder, f: Fr, u0: number, u1: number, o0: number, o1: number, y0: number, y1: number, c: Rgb, tag = T.stone, bottom = false): void {
  const Q = (u: number, o: number, y: number) => P(f, u, o, y)
  out.quad([Q(u0, o1, y0), Q(u1, o1, y0), Q(u1, o1, y1), Q(u0, o1, y1)], dir(f, 0, 0, 1), UV, c, tag)
  out.quad([Q(u1, o0, y0), Q(u0, o0, y0), Q(u0, o0, y1), Q(u1, o0, y1)], dir(f, 0, 0, -1), UV, c, tag)
  out.quad([Q(u0, o0, y0), Q(u0, o1, y0), Q(u0, o1, y1), Q(u0, o0, y1)], dir(f, -1, 0, 0), UV, c, tag)
  out.quad([Q(u1, o1, y0), Q(u1, o0, y0), Q(u1, o0, y1), Q(u1, o1, y1)], dir(f, 1, 0, 0), UV, c, tag)
  out.quad([Q(u0, o0, y1), Q(u0, o1, y1), Q(u1, o1, y1), Q(u1, o0, y1)], [0, 1, 0], UV, c, tag)
  if (bottom) out.quad([Q(u0, o1, y0), Q(u0, o0, y0), Q(u1, o0, y0), Q(u1, o1, y0)], [0, -1, 0], UV, c, tag)
}

/** A course standing proud of a wall: its face, its top and its two ends (the back is in the wall). */
function course(out: MeshBuilder, f: Fr, u0: number, u1: number, o1: number, y0: number, y1: number, c: Rgb, tag = T.stone): void {
  const Q = (u: number, o: number, y: number) => P(f, u, o, y)
  out.quad([Q(u0, o1, y0), Q(u1, o1, y0), Q(u1, o1, y1), Q(u0, o1, y1)], dir(f, 0, 0, 1), UV, c, tag)
  out.quad([Q(u0, 0, y1), Q(u0, o1, y1), Q(u1, o1, y1), Q(u1, 0, y1)], [0, 1, 0], UV, c, tag)
  out.quad([Q(u0, 0, y0), Q(u0, o1, y0), Q(u0, o1, y1), Q(u0, 0, y1)], dir(f, -1, 0, 0), UV, c, tag)
  out.quad([Q(u1, o1, y0), Q(u1, 0, y0), Q(u1, 0, y1), Q(u1, o1, y1)], dir(f, 1, 0, 0), UV, c, tag)
}

/** A flat rectangle facing out of the wall, `o` off it. */
function panel(out: MeshBuilder, f: Fr, u0: number, u1: number, o: number, y0: number, y1: number, c: Rgb, tag = FIXED): void {
  if (u1 - u0 < 0.01 || y1 - y0 < 0.01) return
  out.quad([P(f, u0, o, y0), P(f, u1, o, y0), P(f, u1, o, y1), P(f, u0, o, y1)], dir(f, 0, 0, 1), UV, c, tag)
}

/** A full ring round (u, y), facing out at `o`: a rose's rim, its glass (r0 = 0), its tracery circles. */
function circleRing(out: MeshBuilder, f: Fr, u: number, y: number, r0: number, r1: number, o: number, c: Rgb, seg = 16, tag = FIXED): void {
  for (let i = 0; i < seg; i++) {
    const a0 = (i / seg) * Math.PI * 2
    const a1 = ((i + 1) / seg) * Math.PI * 2
    const at = (r: number, a: number): V3 => P(f, u + Math.cos(a) * r, o, y + Math.sin(a) * r)
    out.quad([at(r0, a0), at(r1, a0), at(r1, a1), at(r0, a1)], dir(f, 0, 0, 1), UV, c, tag)
  }
}

/** A bar in the wall plane from (u0, y0) to (u1, y1), `w` wide, at `o`. */
function bar(out: MeshBuilder, f: Fr, u0: number, y0: number, u1: number, y1: number, w: number, o: number, c: Rgb): void {
  const L = Math.hypot(u1 - u0, y1 - y0) || 1
  const pu = (-(y1 - y0) / L) * w / 2
  const py = ((u1 - u0) / L) * w / 2
  out.quad([P(f, u0 - pu, o, y0 - py), P(f, u1 - pu, o, y1 - py), P(f, u1 + pu, o, y1 + py), P(f, u0 + pu, o, y0 + py)], dir(f, 0, 0, 1), UV, c, FIXED)
}

// ------------------------------------------------------------------------------------------- pointed arches

/*
 * A two-centred (pointed) arch of span W whose arcs have radius R (R = W: equilateral; more: steeper). Each half is
 * an arc about a centre on the springing line, R − W/2 across the axis from the opposite jamb. Concentric pointed
 * arches — a window and its moulding — share those centres: span W + 2t, radius R + t.
 */
const SEG = 3
const rise = (W: number, R: number): number => Math.sqrt(Math.max(0, R * R - (R - W / 2) ** 2))
function arcPt(W: number, R: number, side: number, k: number, n = SEG): [number, number] {
  const c = R - W / 2
  const th = Math.acos(Math.min(1, c / R)) * (k / n)
  return [side * (-c + R * Math.cos(th)), R * Math.sin(th)]
}

/** The filled silhouette of a lancet `W` wide, standing on `y0`, `H` tall to its point. */
function lancetFill(out: MeshBuilder, f: Fr, u: number, o: number, y0: number, W: number, H: number, c: Rgb, R = W): void {
  const sp = y0 + H - rise(W, R)
  panel(out, f, u - W / 2, u + W / 2, o, y0, sp, c)
  for (const s of [-1, 1]) {
    for (let k = 0; k < SEG; k++) {
      const [a0, b0] = arcPt(W, R, s, k)
      const [a1, b1] = arcPt(W, R, s, k + 1)
      out.quad([P(f, u, o, sp), P(f, u + a0, o, sp + b0), P(f, u + a1, o, sp + b1), P(f, u, o, sp)], dir(f, 0, 0, 1), UV, c, FIXED)
    }
  }
}

/** The moulding round that lancet: jambs and the two arcs, `t` wide, at `o`. */
function lancetRing(out: MeshBuilder, f: Fr, u: number, o: number, y0: number, W: number, H: number, t: number, c: Rgb, R = W): void {
  const sp = y0 + H - rise(W, R)
  for (const s of [-1, 1]) {
    panel(out, f, s < 0 ? u - W / 2 - t : u + W / 2, s < 0 ? u - W / 2 : u + W / 2 + t, o, y0, sp, c)
    for (let k = 0; k < SEG; k++) {
      const [a0, b0] = arcPt(W, R, s, k)
      const [a1, b1] = arcPt(W, R, s, k + 1)
      const [c0, d0] = arcPt(W + 2 * t, R + t, s, k)
      const [c1, d1] = arcPt(W + 2 * t, R + t, s, k + 1)
      out.quad([P(f, u + a0, o, sp + b0), P(f, u + c0, o, sp + d0), P(f, u + c1, o, sp + d1), P(f, u + a1, o, sp + b1)], dir(f, 0, 0, 1), UV, c, FIXED)
    }
  }
}

/** A window: the dark glass in its moulding, with a sill. */
function lancet(out: MeshBuilder, f: Fr, u: number, y0: number, W: number, H: number, glass: Rgb = GLASS, o = 0, sill = true): void {
  lancetFill(out, f, u, o + 0.03, y0, W, H, glass)
  lancetRing(out, f, u, o + 0.07, y0, W, H, Math.max(0.14, W * 0.12), TRIM)
  if (sill) course(out, f, u - W / 2 - 0.25, u + W / 2 + 0.25, o + 0.22, y0 - 0.22, y0, TRIM)
}

/**
 * A wall from `y0` to `y1` across `u0..u1` with pointed HOLES in it (each `W` wide from its sill `ys`, `H` to the
 * point): the piers between, the wall under each hole, and the spandrels over each head.
 */
function holedWall(out: MeshBuilder, f: Fr, u0: number, u1: number, y0: number, y1: number,
                   holes: { u: number; W: number; ys: number; H: number }[], o: number, c: Rgb, tag = T.stone): void {
  const hs = [...holes].sort((a, b) => a.u - b.u)
  let at = u0
  for (const h of hs) {
    panel(out, f, at, h.u - h.W / 2, o, y0, y1, c, tag)
    if (h.ys > y0) panel(out, f, h.u - h.W / 2, h.u + h.W / 2, o, y0, h.ys, c, tag)
    const sp = h.ys + h.H - rise(h.W, h.W)
    for (const s of [-1, 1]) {
      for (let k = 0; k < SEG; k++) {
        const [a0, b0] = arcPt(h.W, h.W, s, k)
        const [a1, b1] = arcPt(h.W, h.W, s, k + 1)
        out.quad([P(f, h.u + a0, o, sp + b0), P(f, h.u + a1, o, sp + b1), P(f, h.u + a1, o, y1), P(f, h.u + a0, o, y1)], dir(f, 0, 0, 1), UV, c, tag)
      }
    }
    at = h.u + h.W / 2
  }
  panel(out, f, at, u1, o, y0, y1, c, tag)
}

/** The reveal of a pointed hole from `o0` back to `o1`: the jambs and the soffit, facing in. */
function holeReveal(out: MeshBuilder, f: Fr, u: number, W: number, ys: number, H: number, o0: number, o1: number, c: Rgb): void {
  const sp = ys + H - rise(W, W)
  out.quad([P(f, u - W / 2, o0, ys), P(f, u - W / 2, o1, ys), P(f, u - W / 2, o1, sp), P(f, u - W / 2, o0, sp)], dir(f, 1, 0, 0), UV, c, T.stone)
  out.quad([P(f, u + W / 2, o1, ys), P(f, u + W / 2, o0, ys), P(f, u + W / 2, o0, sp), P(f, u + W / 2, o1, sp)], dir(f, -1, 0, 0), UV, c, T.stone)
  for (const s of [-1, 1]) {
    for (let k = 0; k < SEG; k++) {
      const [a0, b0] = arcPt(W, W, s, k)
      const [a1, b1] = arcPt(W, W, s, k + 1)
      out.quad([P(f, u + a0, o0, sp + b0), P(f, u + a0, o1, sp + b0), P(f, u + a1, o1, sp + b1), P(f, u + a1, o0, sp + b1)],
        dir(f, -s * (b1 - b0), -Math.abs(a1 - a0), 0), UV, c, T.stone)
    }
  }
}

/** A triangle in the wall plane (a gable's face) from u0..u1 at y up to the apex `h` higher, at `o`. */
function gableFace(out: MeshBuilder, f: Fr, u0: number, u1: number, y: number, h: number, o: number, c: Rgb, tag = T.stone): void {
  const um = (u0 + u1) / 2
  out.quad([P(f, u0, o, y), P(f, u1, o, y), P(f, um, o, y + h), P(f, um, o, y + h)], dir(f, 0, 0, 1), UV, c, tag)
}

/** A rose: dark glass, a moulded rim, an inner ring, `n` spokes and a ring of small foils — plate-and-bar tracery. */
function rose(out: MeshBuilder, f: Fr, u: number, y: number, r: number, o: number, n = 12, square = true): void {
  circleRing(out, f, u, y, 0, r, o + 0.02, GLASS, 20)
  circleRing(out, f, u, y, r, r + Math.max(0.3, r * 0.1), o + 0.08, TRIM, 20)
  circleRing(out, f, u, y, r * 0.42, r * 0.42 + 0.14, o + 0.06, TRIM, 14)
  circleRing(out, f, u, y, 0, r * 0.14, o + 0.06, TRIM, 8)
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2
    bar(out, f, u + Math.cos(a) * r * 0.14, y + Math.sin(a) * r * 0.14, u + Math.cos(a) * r, y + Math.sin(a) * r, Math.max(0.1, r * 0.035), o + 0.05, TRIM)
    if (r > 3.5) {
      const b = a + Math.PI / n
      circleRing(out, f, u + Math.cos(b) * r * 0.73, y + Math.sin(b) * r * 0.73, r * 0.15, r * 0.15 + 0.09, o + 0.05, TRIM, 6)
    }
  }
  if (!square) return
  // the square frame the rose is set in, its spandrels a shade darker than the wall
  const q = r + Math.max(0.3, r * 0.1) + 0.35
  for (const [u0, u1, y0, y1] of [[u - q, u + q, y + q - 0.3, y + q], [u - q, u + q, y - q, y - q + 0.3], [u - q, u - q + 0.3, y - q, y + q], [u + q - 0.3, u + q, y - q, y + q]]) {
    course(out, f, u0, u1, o + 0.25, y0, y1, TRIM)
  }
}

/** A pinnacle on a frame point: a square shaft and a tall four-sided spirelet. */
const pin = (out: MeshBuilder, p: P2, y0: number, h: number, w: number, c: Rgb = TRIM): void => pinnacle(out, p.x, p.z, y0, h, w, c)

// ------------------------------------------------------------------------------------------- the outline

type UO = { u: number; o: number }

/** Where the line `o` = const crosses the outline: its extent across. */
function slice(R: UO[], o: number): [number, number] | null {
  let lo = Infinity
  let hi = -Infinity
  for (let i = 0; i < R.length; i++) {
    const a = R[i]
    const b = R[(i + 1) % R.length]
    if (a.o === b.o || (a.o - o) * (b.o - o) > 0) continue
    const u = a.u + ((o - a.o) / (b.o - a.o)) * (b.u - a.u)
    lo = Math.min(lo, u)
    hi = Math.max(hi, u)
  }
  return hi > lo ? [lo, hi] : null
}
const width = (R: UO[], o: number): number => { const s = slice(R, o); return s ? s[1] - s[0] : 0 }

// ------------------------------------------------------------------------------------------- the builder

function graceCathedral(out: MeshBuilder, fit: Fit): void {
  const given: P2[] = fit.ring && fit.ring.length >= 3 ? fit.ring
    : [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]

  // ---- the axis, and which end is the front: the tower block's corners spread wide, the apse's do not
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
  for (const p of given) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z) }
  const alongZ = z1 - z0 >= x1 - x0
  const centre: P2 = { x: (x0 + x1) / 2, z: (z0 + z1) / 2 }
  /** how widely the vertices within 2.5 m of one end spread across the axis */
  const spread = (s: number): number => {
    const vals = given.map((p) => (alongZ ? p.z : p.x) * s)
    const m = Math.max(...vals)
    const near = given.filter((_, i) => vals[i] > m - 2.5).map((p) => (alongZ ? p.x : p.z))
    return Math.max(...near) - Math.min(...near)
  }
  const s = spread(1) >= spread(-1) ? 1 : -1
  const A: P2 = alongZ ? { x: 0, z: s } : { x: s, z: 0 }
  const f0 = frN(A, centre)                       // u across (positive: north), o toward the front
  const G0 = given.map((p) => inFr(f0, p))
  const oMax = Math.max(...G0.map((p) => p.o))
  const oMin = Math.min(...G0.map((p) => p.o))
  const Lall = oMax - oMin
  const Wall = Math.max(...G0.map((p) => p.u)) - Math.min(...G0.map((p) => p.u))

  /*
   * The PLAN, drawn from OSM's outline of way/32946942 (measured 2026-10-21 in the model frame: 95.7 m by 43.4 m) and
   * scaled to the extents given. The city hands this building its CONVEX HULL, not its outline (the hull's 14 corners
   * were dumped from the running city): the notches between the nave, the transept and the choir are gone from it, so
   * the cross plan cannot be found on it and is laid out here instead. The real outline gives the same plan, so the
   * showcase and the city agree.
   */
  const sL = Lall / 95.74
  const sW = Wall / 43.4
  const nH = 13.45 * sW                           // the nave with its aisles, half-width
  const cH = 8.83 * sW                            // the choir
  const tH = Wall / 2                             // the transept
  const pH = 5.15 * sW                            // the porch
  const oAp = oMax - 88.2 * sL                    // where the apse starts
  const right: UO[] = [
    { u: pH, o: oMax }, { u: pH, o: oMax - 1.83 * sL }, { u: nH, o: oMax - 1.83 * sL }, { u: nH, o: oMax - 12.66 * sL },
    { u: nH, o: oMax - 54.4 * sL }, { u: tH, o: oMax - 54.4 * sL }, { u: tH, o: oMax - 67.5 * sL },
    { u: cH, o: oMax - 67.5 * sL }, { u: cH, o: oAp },
  ]
  const apsePts: UO[] = []
  for (let k = 1; k < 6; k++) {
    const th = (k / 6) * Math.PI
    apsePts.push({ u: Math.cos(th) * cH, o: oAp - Math.sin(th) * (oAp - oMin) })
  }
  const plan: UO[] = [...right, ...apsePts, ...right.map((p) => ({ u: -p.u, o: p.o })).reverse()]
  let ring: P2[] = plan.map((p) => pt(f0, p.u, p.o))
  let twice = 0
  for (let i = 0; i < ring.length; i++) { const a = ring[i]; const b = ring[(i + 1) % ring.length]; twice += a.x * b.z - b.x * a.z }
  if (twice < 0) ring = ring.reverse()
  const R = ring.map((p) => inFr(f0, p))

  // ---- the parts, found by slicing
  const wRef = width(R, oMax - 6) || 27
  let oF = oMax
  for (let o = oMax; o > oMax - 8; o -= 0.2) if (width(R, o) >= 0.85 * wRef) { oF = o; break }
  const nave = slice(R, oF - 16) ?? [-13, 13]
  const naveW = nave[1] - nave[0]
  const uc = (nave[0] + nave[1]) / 2
  let oX0 = Infinity, oX1 = -Infinity
  for (let o = oF - 12; o > oMin + 4; o -= 0.25) {
    if (width(R, o) > naveW + 5) { oX0 = Math.min(oX0, o); oX1 = Math.max(oX1, o) }
  }
  if (!Number.isFinite(oX0)) { oX1 = oMin + Lall * 0.42; oX0 = oX1 - 12.5 }
  const trans = slice(R, (oX0 + oX1) / 2) ?? [nave[0] - 8, nave[1] + 8]
  const choir = slice(R, oX0 - 4) ?? [uc - 9, uc + 9]
  const choirW = choir[1] - choir[0]
  let oA = oX0 - 6
  for (let o = oX0 - 4; o > oMin; o -= 0.25) { if (width(R, o) < 0.94 * choirW) { oA = o + 0.5; break } }
  const vw = Math.min(6.6, naveW / 2 - 4)        // the half-width of the vessel: nave, crossing, choir
  const tw = Math.min(9, naveW * 0.34)            // a tower's side
  const td = Math.min(11, Math.max(tw, (oF - oX1) * 0.26))  // the tower block's depth
  const oB = oF - td                              // the back of the tower block, where the nave starts
  const oC = oF - 2.2                             // the centre bay's wall, set back between the towers
  const towers: [number, number][] = [[nave[0], nave[0] + tw], [nave[1] - tw, nave[1]]]
  const cu0 = nave[0] + tw
  const cu1 = nave[1] - tw

  // ---- heights: the floor 6.1 m over the front's street, the figures from Wikipedia and frame 04
  const G = Math.max(0, fit.grade ?? 0)
  const ground = (p: P2): number => fit.groundAt?.(p.x, p.z) ?? G
  let gMax = G
  for (const p of ring) gMax = Math.max(gMax, ground(p))
  const F = Math.max(G + 6.1, Math.min(gMax + 0.3, G + 9))
  const yA = F + 14.5                             // the aisle walls' head, under the parapet
  const E = F + 24                                // the clerestory's eaves
  const RIDGE = E + vw * 1.5                      // the steep roof's ridge
  const TOP = Math.max(G + 53, RIDGE + 12)        // the towers' flat tops
  const FLECHE = Math.max(G + 75, RIDGE + 30)

  const stone = { kind: 'blank' as const, wall: STONE, material: 'ashlar' as const }

  // ================================================================ the low walls, round the outline
  const inside = pt(f0, uc, (oB + oX1) / 2)
  const low: number[] = []
  const high: number[] = []
  for (let i = 0; i < ring.length; i++) {
    const a = R[i]
    const b = R[(i + 1) % R.length]
    const mo = (a.o + b.o) / 2
    const mu = (a.u + b.u) / 2
    if (Math.max(a.o, b.o) > oB + 0.5) continue          // the tower block and the porch are built by hand
    const inTransept = mo > oX0 - 0.5 && mo < oX1 + 0.5 && (Math.abs(mu - uc) > naveW / 2 - 0.5 || Math.abs(a.o - b.o) < 0.5)
    ;(inTransept && Math.abs(mu - uc) > Math.min(naveW, choirW) / 2 - 0.5 ? high : low).push(i)
  }
  faceBand(out, ring, 0, yA, stone, low)
  faceBand(out, ring, 0, E, stone, high)
  capPolygon(out, ring, yA, ROOF, T.roof)

  // the dressing of each wall of the outline, by what it is
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]
    const b = ring[(i + 1) % ring.length]
    const ua = R[i]
    const ub = R[(i + 1) % R.length]
    if (Math.max(ua.o, ub.o) > oB + 0.5) continue
    const f = frAB(a, b, inside)
    if (f.L < 1.5) continue
    const n = inFr(f0, { x: f0.ox + f.nx, z: f0.oz + f.nz })   // the wall's normal in (u, o)
    const isHigh = high.includes(i)
    const top = isHigh ? E : yA
    // the water table over the undercroft, and the cornice and parapet at the head
    course(out, f, -0.1, f.L + 0.1, 0.3, F - 0.3, F + 0.1, TRIM)
    course(out, f, -0.2, f.L + 0.2, 0.35, top - 0.2, top + 0.25, TRIM)
    slab(out, f, -0.1, f.L + 0.1, -0.35, 0.1, top + 0.25, top + 1.3, STONE)
    panel(out, f, 0.2, f.L - 0.2, 0.11, top + 0.55, top + 1.0, REVEAL)
    const side = Math.abs(n.u) > 0.85
    if (isHigh && side) { transeptEnd(out, f, F, E, RIDGE, ground); continue }
    if (isHigh) {
      // a transept's east or west wall: one tall window between buttresses
      if (f.L > 4) lancet(out, f, f.L / 2, F + 2.5, Math.min(2.6, f.L * 0.3), 13)
      continue
    }
    if (ub.o < oA + 0.5 && ua.o < oA + 0.5 && !side) {
      // a facet of the apse: one tall window, a buttress at its corner
      if (f.L > 2.4) lancet(out, f, f.L / 2, F + 2.2, Math.min(2.2, f.L * 0.42), 11)
      if (f.L > 2.4) buttressAt(out, f, 0, F, yA, 0.9, 1.2)
      continue
    }
    if (!side) continue
    // an aisle of the nave or the choir: bays of paired lancets under a roundel, stepped buttresses between
    const bays = Math.max(1, Math.round(f.L / 8))
    const bw = f.L / bays
    for (let k = 0; k < bays; k++) {
      const u = (k + 0.5) * bw
      const W = Math.min(5.0, bw - 2.2)
      lancetRing(out, f, u, 0.1, F + 1.6, W, 11.5, 0.3, TRIM)
      lancetFill(out, f, u, 0.02, F + 1.6, W, 11.5, REVEAL)
      for (const sg of [-1, 1]) lancet(out, f, u + sg * W * 0.24, F + 2.0, W * 0.36, 7.4, GLASS, 0.04, false)
      const rr = W * 0.2
      circleRing(out, f, u, F + 2.0 + 7.4 + rr + 0.35, 0, rr, 0.05, GLASS, 8)
      circleRing(out, f, u, F + 2.0 + 7.4 + rr + 0.35, rr, rr + 0.18, 0.08, TRIM, 8)
    }
    for (let k = 0; k <= bays; k++) {
      if ((k === 0 || k === bays) && f.L > 30) continue
      buttressAt(out, f, k * bw, F, yA, 1.3, 1.8)
      // the flying buttress over the aisle roof to the clerestory
      const foot = P(f, k * bw, 0.4, yA + 2.6)
      const head = P(f, k * bw, -(Math.abs((ua.u + ub.u) / 2 - uc) - vw), E - 3.5)
      beam(out, foot, head, 0.32, STONE, 0.45)
    }
  }

  // ================================================================ the clerestory, the apse above, the roofs
  for (const sg of [-1, 1]) {
    const runs: [number, number, number][] = [[oX1, oB, sg > 0 ? nave[1] : nave[0]], [oA, oX0, sg > 0 ? choir[1] : choir[0]]]
    for (const [o0, o1, uo] of runs) {
      if (o1 - o0 < 2) continue
      // the aisle's lean-to roof, behind its parapet
      const ui = uc + sg * vw
      out.quad([P(f0, uo, o0, yA + 0.3), P(f0, uo, o1, yA + 0.3), P(f0, ui, o1, yA + 2.2), P(f0, ui, o0, yA + 2.2)],
        dir(f0, sg * 1.9, Math.abs(uo - ui), 0), UV, ROOF, T.roof)
      const f = frN({ x: f0.tx * sg, z: f0.tz * sg }, pt(f0, uc + sg * vw, 0))
      const ua = inFr(f, pt(f0, 0, o0)).u
      const ub = inFr(f, pt(f0, 0, o1)).u
      const u0 = Math.min(ua, ub)
      const u1 = Math.max(ua, ub)
      panel(out, f, u0, u1, 0, yA, E, STONE, T.stone)
      course(out, f, u0, u1, 0.3, E - 0.2, E + 0.2, TRIM)
      const bays = Math.max(1, Math.round((u1 - u0) / 8))
      const bw = (u1 - u0) / bays
      for (let k = 0; k < bays; k++) {
        const u = u0 + (k + 0.5) * bw
        for (const t of [-1, 1]) lancet(out, f, u + t * 1.0, yA + 2.6, 1.15, 4.6)
        circleRing(out, f, u, yA + 7.0, 0, 0.55, 0.04, GLASS, 8)
        circleRing(out, f, u, yA + 7.0, 0.55, 0.72, 0.07, TRIM, 8)
      }
      for (let k = 0; k <= bays; k++) course(out, f, u0 + k * bw - 0.35, u0 + k * bw + 0.35, 0.35, yA + 1, E - 0.2, STONE)
    }
  }
  // the crossing's walls over the aisle roofs, east and west, between the vessel and the transept's own walls
  for (const [o, nrm, half] of [[oX1, 1, naveW / 2], [oX0, -1, choirW / 2]] as [number, number, number][]) {
    const fx = frN({ x: f0.nx * nrm, z: f0.nz * nrm }, pt(f0, uc, o))
    for (const sg of [-1, 1]) {
      const a = inFr(fx, pt(f0, uc + sg * vw, o)).u
      const b = inFr(fx, pt(f0, uc + sg * (half + 0.2), o)).u
      panel(out, fx, Math.min(a, b), Math.max(a, b), 0, yA, E, STONE, T.stone)
      course(out, fx, Math.min(a, b), Math.max(a, b), 0.3, E - 0.2, E + 0.2, TRIM)
    }
  }
  // the vessel's roof from the apse to the towers, steep and slate grey
  gableRoof(out, f0, uc - vw - 0.5, uc + vw + 0.5, oA, oB, E, RIDGE - E)
  // the transept's, its ridge across
  const fT = frN({ x: -f0.tx, z: -f0.tz }, pt(f0, uc, (oX0 + oX1) / 2))   // o along +u... see below
  {
    // in fT: u runs along f0's +o, o runs along f0's −u; so the transept's span across fT's u is oX0..oX1
    const tu0 = inFr(fT, pt(f0, uc, oX0)).u
    const tu1 = inFr(fT, pt(f0, uc, oX1)).u
    const to0 = inFr(fT, pt(f0, trans[1], 0)).o
    const to1 = inFr(fT, pt(f0, trans[0], 0)).o
    gableRoof(out, fT, Math.min(tu0, tu1) - 0.4, Math.max(tu0, tu1) + 0.4, Math.min(to0, to1) - 0.3, Math.max(to0, to1) + 0.3, E, RIDGE - E)
  }
  // the apse: a half-polygon of the vessel's width, its walls to the eaves, its roof drawn to the ridge's end
  {
    const dA = Math.max(3, Math.min(vw, oA - oMin - 2.5))
    const pts: P2[] = []
    for (let k = 0; k <= 4; k++) {
      const th = (k / 4) * Math.PI
      pts.push(pt(f0, uc + Math.cos(th) * vw, oA - Math.sin(th) * dA))
    }
    const c = pt(f0, uc, oA)
    for (let k = 0; k < 4; k++) {
      const f = frAB(pts[k], pts[k + 1], c)
      panel(out, f, 0, f.L, 0, yA, E, STONE, T.stone)
      course(out, f, -0.1, f.L + 0.1, 0.3, E - 0.2, E + 0.2, TRIM)
      lancet(out, f, f.L / 2, yA + 1.8, Math.min(1.6, f.L * 0.3), 6.2)
      const a = pts[k]
      const b = pts[k + 1]
      out.quad([[a.x, E + 0.2, a.z], [b.x, E + 0.2, b.z], [c.x, RIDGE, c.z], [c.x, RIDGE, c.z]],
        [f.nx, 0.8, f.nz], UV, ROOF, T.roof)
    }
  }

  // ================================================================ the crossing's flèche
  {
    const c = pt(f0, uc, (oX0 + oX1) / 2)
    const yb = RIDGE - 1.5
    prism(out, c.x, c.z, yb, RIDGE + 1.2, 2.9, 8, LEAD, T.metal)
    prism(out, c.x, c.z, RIDGE + 1.2, RIDGE + 6.5, 2.4, 8, LEAD, T.metal, 2.2)
    // the lantern's openings and its ring of pinnacles
    for (let k = 0; k < 8; k++) {
      const a = ((k + 0.5) / 8) * Math.PI * 2
      const fo = frN({ x: Math.sin(a), z: Math.cos(a) }, { x: c.x + Math.sin(a) * 2.3 * Math.cos(Math.PI / 8), z: c.z + Math.cos(a) * 2.3 * Math.cos(Math.PI / 8) })
      lancetFill(out, fo, 0, 0.03, RIDGE + 2, 0.75, 3.8, VOID)
      const pa = (k / 8) * Math.PI * 2
      pin(out, { x: c.x + Math.sin(pa) * 2.5, z: c.z + Math.cos(pa) * 2.5 }, RIDGE + 5.5, 4.2, 0.45, LEAD)
    }
    prism(out, c.x, c.z, RIDGE + 6.5, FLECHE - 1.2, 2.1, 8, LEAD, T.metal, 0.06)
    crossFinial(out, c, FLECHE - 1.3, 1.6, LEAD)
  }

  // ================================================================ the front
  const fF = frN(A, pt(f0, 0, oF))                // the towers' faces (u as f0's)
  // the block behind the front, from the towers' back to the centre wall, up to the gable
  slab(out, f0, cu0, cu1, oB, oC, 0, F + 34, STONE)
  // ---- the towers
  for (const [ta, tb] of towers) towerAt(out, f0, ta, tb, oB, oF, F, TOP, ta < uc)
  // ---- the centre bay: the rose, the gallery, the gable
  {
    const fC = frN(A, pt(f0, 0, oC))
    const um = (cu0 + cu1) / 2
    const cw = cu1 - cu0
    course(out, fC, cu0, cu1, 0.4, F + 19.4, F + 19.8, TRIM)
    rose(out, fC, um, F + 25, Math.min(3.8, cw / 2 - 0.9), 0.05, 16)
    // the arcaded gallery over the rose
    course(out, fC, cu0, cu1, 0.45, F + 30.2, F + 30.6, TRIM)
    const nA = 7
    for (let k = 0; k < nA; k++) {
      const u = cu0 + 0.5 + ((k + 0.5) / nA) * (cw - 1)
      lancetFill(out, fC, u, 0.03, F + 30.8, (cw - 1) / nA - 0.45, 2.6, VOID)
    }
    course(out, fC, cu0, cu1, 0.5, F + 33.4, F + 34, TRIM)
    slab(out, fC, cu0, cu1, -0.2, 0.3, F + 34, F + 34.9, STONE)
    gableFace(out, fC, cu0 + 0.3, cu1 - 0.3, F + 34.9, 4.6, 0.05, STONE)
    gableFace(out, fC, cu0 + 0.3, cu1 - 0.3, F + 34.9, 4.6, -1.0, STONE)
    lancetFill(out, fC, um, 0.09, F + 35.6, 1.0, 2.2, VOID)
    for (const sg of [-1, 1]) {
      const uu = um + sg * (cw / 2 - 0.3)
      bar(out, fC, uu, F + 34.9, um, F + 39.5, 0.5, 0.12, TRIM)
    }
    pin(out, pt(fC, um, -0.3), F + 39.2, 2.6, 0.6)
    // ---- the porch: a deep pointed portal under its wimperg, the Ghiberti doors at the back of it
    const pu0 = cu0 + 0.25
    const pu1 = cu1 - 0.25
    const fP = frN(A, pt(f0, 0, Math.max(oF + 0.6, oMax) + 0.8))
    const depth = Math.max(oF + 0.6, oMax) + 0.8 - oC
    const pTop = F + 13
    const W = Math.min(6.2, (pu1 - pu0) - 3)
    const H = 12
    holedWall(out, fP, pu0, pu1, F, pTop, [{ u: um, W, ys: F, H }], 0, PORCH)
    panel(out, fP, pu0, pu1, 0, 0, F, PORCH, T.stone)
    // the porch's sides and top
    for (const [uu, sg] of [[pu0, -1], [pu1, 1]] as [number, number][]) {
      const fs = frN({ x: f0.tx * sg, z: f0.tz * sg }, pt(f0, uu, 0))
      const a0 = inFr(fs, pt(f0, uu, oC)).u
      const a1 = inFr(fs, pt(f0, uu, oC + depth)).u
      panel(out, fs, Math.min(a0, a1), Math.max(a0, a1), 0, 0, pTop, PORCH, T.stone)
    }
    out.quad([P(f0, pu0, oC, pTop), P(f0, pu1, oC, pTop), P(f0, pu1, oC + depth, pTop), P(f0, pu0, oC + depth, pTop)], [0, 1, 0], UV, PORCH, T.stone)
    // the orders of the arch stepping back to the doors
    const orders = 4
    const back = depth - 0.15
    for (let k = 0; k < orders; k++) {
      const Wk = W - k * 0.55
      const ok0 = -(k * back) / orders
      const ok1 = -((k + 1) * back) / orders
      holeReveal(out, fP, um, Wk, F, H - k * 0.45, ok0, ok1, k % 2 === 0 ? REVEAL : DEEP)
      if (k > 0) {
        // the face of each order, the ring between it and the one outside it
        lancetRing(out, fP, um, ok0, F, Wk, H - k * 0.45, 0.275, k % 2 === 0 ? TRIM : STONE)
      }
    }
    const Wd = W - orders * 0.55
    const Hd = H - orders * 0.45
    // the tympanum over the doors, then the doors themselves: two leaves of gilded panels
    lancetFill(out, fP, um, -back, F, Wd + 0.1, Hd, REVEAL)
    const dh = Math.min(Hd - rise(Wd, Wd) - 0.2, 7.2)
    panel(out, fP, um - Wd / 2 + 0.15, um + Wd / 2 - 0.15, -back + 0.03, F, F + dh, BRONZE, T.metal)
    for (let r = 0; r < 5; r++) {
      for (const sg of [-1, 1]) {
        const cx = um + sg * (Wd / 4 - 0.02)
        const ph = (dh - 0.6) / 5
        panel(out, fP, cx - Wd / 4 + 0.35, cx + Wd / 4 - 0.35, -back + 0.06, F + 0.4 + r * ph + 0.12, F + 0.4 + (r + 1) * ph - 0.12, BRONZE_LIT, T.metal)
      }
    }
    panel(out, fP, um - 0.06, um + 0.06, -back + 0.07, F, F + dh, VOID)
    // the wimperg over the porch, between two slender pinnacles
    course(out, fP, pu0 - 0.1, pu1 + 0.1, 0.35, pTop - 0.4, pTop, TRIM)
    gableFace(out, fP, pu0 + 0.6, pu1 - 0.6, pTop, 8.5, 0.06, PORCH)
    gableFace(out, fP, pu0 + 0.6, pu1 - 0.6, pTop, 8.5, -0.5, STONE)
    for (const sg of [-1, 1]) {
      // the raking coping of the wimperg, thick enough to cast its edge, crocketed by a few small blocks
      const ue = sg < 0 ? pu0 + 0.3 : pu1 - 0.3
      bar(out, fP, ue, pTop, um, pTop + 9.0, 0.75, 0.16, TRIM)
      for (let k = 1; k < 4; k++) {
        const t = k / 4
        course(out, fP, ue + (um - ue) * t - 0.2, ue + (um - ue) * t + 0.2, 0.35, pTop + 9 * t + 0.25, pTop + 9 * t + 0.75, TRIM)
      }
    }
    lancetFill(out, fP, um, 0.1, pTop + 1.4, 2.0, 4.0, REVEAL)
    lancetRing(out, fP, um, 0.12, pTop + 1.4, 2.0, 4.0, 0.16, TRIM)
    pin(out, pt(fP, um, -0.2), pTop + 8.4, 2.4, 0.5)
    for (const uu of [pu0 + 0.1, pu1 - 0.1]) {
      slab(out, f0, uu - 0.5, uu + 0.5, oC + depth - 1.0, oC + depth + 0.35, F, pTop + 3.5, TRIM)
      pin(out, pt(f0, uu, oC + depth - 0.32), pTop + 3.5, 6.5, 0.9)
    }
  }

  // ================================================================ the terrace and the grand stair
  {
    const oT = Math.max(oF + 0.6, oMax) + 0.8 + 1.6
    // the terrace before the three doors, on a plinth
    slab(out, f0, nave[0], nave[1], oF - 0.2, oT, 0, F, PAVING, T.granite)
    course(out, fF, nave[0], nave[1], oT - oF + 0.15, F - 0.05, F + 0.15, TRIM)
    const run = 12.5
    const foot = ground(pt(f0, uc, oT + run + 3))
    const mid = (F + Math.min(foot, F - 0.5)) / 2 + 0.3
    const r1 = run * 0.5
    const land = 2.6
    const su0 = nave[0] + 0.6
    const su1 = nave[1] - 0.6
    stair(out, pt(f0, su0, oT), pt(f0, su1, oT), mid, F, { anchor: 'top', riser: 0.17, run: r1, colour: PAVING, material: 'granite' })
    slab(out, f0, su0, su1, oT + r1, oT + r1 + land, Math.min(foot, mid) - 0.5, mid, PAVING, T.granite)
    stair(out, pt(f0, su0, oT + r1 + land), pt(f0, su1, oT + r1 + land), Math.min(foot, mid - 0.2), mid,
      { anchor: 'top', riser: 0.17, run: run - r1, colour: PAVING, material: 'granite' })
    // the cheek walls down both sides, following the flights
    for (const [ua, ub] of [[nave[0], su0], [su1, nave[1]]] as [number, number][]) {
      const prof: [number, number][] = [[oT, F + 0.9], [oT + r1, mid + 0.9], [oT + r1 + land, mid + 0.9], [oT + run + land, Math.min(foot, mid) + 0.9]]
      for (let k = 0; k < prof.length - 1; k++) {
        const [oa, ya] = prof[k]
        const [ob, yb] = prof[k + 1]
        const yl = Math.min(foot, mid) - 0.5
        out.quad([P(f0, ua, oa, ya), P(f0, ub, oa, ya), P(f0, ub, ob, yb), P(f0, ua, ob, yb)], [0, 1, 0], UV, TRIM, T.granite)
        for (const [uu, sg] of [[ua, -1], [ub, 1]] as [number, number][]) {
          out.quad([P(f0, uu, oa, yl), P(f0, uu, ob, yl), P(f0, uu, ob, yb), P(f0, uu, oa, ya)], dir(f0, sg, 0, 0), UV, STONE, T.stone)
        }
      }
      out.quad([P(f0, ua, oT + run + land, Math.min(foot, mid) - 0.5), P(f0, ub, oT + run + land, Math.min(foot, mid) - 0.5),
        P(f0, ub, oT + run + land, Math.min(foot, mid) + 0.9), P(f0, ua, oT + run + land, Math.min(foot, mid) + 0.9)], dir(f0, 0, 0, 1), UV, STONE, T.stone)
    }
  }
}

/** A stepped buttress at `u` along a wall, from the ground to above the wall's head, with a pinnacle. */
function buttressAt(out: MeshBuilder, f: Fr, u: number, F: number, top: number, w: number, d: number): void {
  slab(out, f, u - w / 2, u + w / 2, 0, d, 0, F + 8, STONE)
  slab(out, f, u - w / 2 + 0.1, u + w / 2 - 0.1, 0, d * 0.65, F + 8, top + 1.6, STONE)
  // the weathering of the lower stage, sloping back
  out.quad([P(f, u - w / 2, d, F + 8), P(f, u + w / 2, d, F + 8), P(f, u + w / 2, d * 0.65, F + 8.6), P(f, u - w / 2, d * 0.65, F + 8.6)],
    dir(f, 0, 0.8, 0.6), UV, STONE, T.stone)
  pin(out, pt(f, u, d * 0.33), top + 1.6, 3.2, Math.min(0.75, w * 0.6))
}

/** A gable roof over u0..u1 × o0..o1 in frame `f`, eaves at `y`, ridge along o, `h` above them. */
function gableRoof(out: MeshBuilder, f: Fr, u0: number, u1: number, o0: number, o1: number, y: number, h: number): void {
  const um = (u0 + u1) / 2
  const half = (u1 - u0) / 2
  for (const sg of [-1, 1]) {
    const ue = sg < 0 ? u0 : u1
    out.quad([P(f, ue, o0, y), P(f, ue, o1, y), P(f, um, o1, y + h), P(f, um, o0, y + h)], dir(f, sg * h, half, 0), UV, ROOF, T.roof)
    // the eaves' underside board, so the roof has an edge
    out.quad([P(f, ue, o0, y), P(f, ue, o1, y), P(f, ue, o1, y - 0.3), P(f, ue, o0, y - 0.3)], dir(f, sg, 0, 0), UV, ROOF, T.roof)
  }
  // a cresting along the ridge: a thin dark strip that catches the sky line
  out.quad([P(f, um - 0.08, o0, y + h), P(f, um + 0.08, o0, y + h), P(f, um + 0.08, o1, y + h + 0.35), P(f, um - 0.08, o1, y + h + 0.35)], [0, 1, 0], UV, LEAD, T.metal)
}

/**
 * A transept's end wall (the frame's u runs along it): a pointed portal at the floor, a row of lancets and the rose
 * in one great arch, the gable over the eaves between octagonal corner turrets.
 */
function transeptEnd(out: MeshBuilder, f: Fr, F: number, E: number, RIDGE: number, ground: (p: P2) => number): void {
  const L = f.L
  const um = L / 2
  // the gable
  gableFace(out, f, 0, L, E + 1.3, RIDGE - E - 0.8, 0, STONE)
  gableFace(out, f, 0.3, L - 0.3, E + 1.3, RIDGE - E - 1.4, 0.06, STONE)
  for (const sg of [-1, 1]) bar(out, f, sg < 0 ? 0 : L, E + 1.3, um, RIDGE + 0.5, 0.45, 0.12, TRIM)
  circleRing(out, f, um, E + 4.2, 0, 1.0, 0.1, VOID, 10)
  pin(out, pt(f, um, -0.2), RIDGE + 0.2, 2.6, 0.6)
  // the great arch, the lancets and the rose in it
  const W = Math.min(10.5, L - 3.2)
  const y0 = F + 9.5
  const H = Math.min(E + 1 - y0, 17)
  lancetRing(out, f, um, 0.1, y0, W, H, 0.4, TRIM, W * 0.8)
  lancetFill(out, f, um, 0.03, y0, W, H, REVEAL, W * 0.8)
  const nL = 5
  for (let k = 0; k < nL; k++) {
    const u = um - W / 2 + 0.5 + ((k + 0.5) / nL) * (W - 1)
    lancetFill(out, f, u, 0.06, y0 + 0.5, (W - 1) / nL - 0.35, 4.4, GLASS)
  }
  const rr = Math.min(3.4, W / 2 - 1.0)
  rose(out, f, um, y0 + 5.3 + rr + 0.3, rr, 0.07, 12, false)
  // the portal at the floor
  const g = ground(pt(f, um, 1))
  const sill = Math.max(g, Math.min(F, g + 1.2))
  const Wp = Math.min(4.6, L * 0.33)
  lancetFill(out, f, um, 0.04, sill, Wp, 7.6, VOID)
  for (let k = 0; k < 3; k++) lancetRing(out, f, um, 0.08 + k * 0.12, sill, Wp + k * 0.6, 7.6 + k * 0.35, 0.3, k % 2 === 0 ? TRIM : REVEAL)
  panel(out, f, um - Wp / 2 + 0.3, um + Wp / 2 - 0.3, 0.06, sill, sill + 4.8, BRONZE, T.metal)
  gableFace(out, f, um - Wp / 2 - 1.4, um + Wp / 2 + 1.4, sill + 8.4, 3.2, 0.3, TRIM)
  if (sill > g + 0.3) stair(out, pt(f, um - Wp / 2 - 0.6, 0), pt(f, um + Wp / 2 + 0.6, 0), g, sill, { anchor: 'top', riser: 0.17, colour: PAVING, material: 'granite' })
  // the corner turrets, octagonal, standing over the gable's foot
  for (const u of [0.9, L - 0.9]) {
    const c = pt(f, u, 0.5)
    prism(out, c.x, c.z, 0, E + 3, 1.25, 6, STONE, T.stone, 1.25, false)
    prism(out, c.x, c.z, E + 3, E + 3.4, 1.45, 6, TRIM, T.stone)
    prism(out, c.x, c.z, E + 3.4, E + 8.2, 1.0, 6, STONE, T.stone, 1.0, false)
    prism(out, c.x, c.z, E + 8.2, E + 12.5, 1.05, 6, STONE, T.stone, 0.04)
  }
}

/**
 * One west tower on the square u0..u1 × (oF − side)..oF of frame f0 (o toward the front): clasping corner
 * buttresses that set back twice and end in pinnacles; a plain shaft with a pointed door on the front and slit
 * lancets; the pierced gallery band; a stage of blind paired lancets; the belfry of two tall open louvred lancets a
 * face; a corbel table, a parapet and the flat top. `south` puts the clock on its outer face (frame 03).
 */
function towerAt(out: MeshBuilder, f0: Fr, u0: number, u1: number, oB: number, oF: number, F: number, TOP: number, south: boolean): void {
  const side = u1 - u0
  const ob = Math.max(oB, oF - side)
  const um = (u0 + u1) / 2
  const om = (ob + oF) / 2
  const hs = side / 2
  // the block behind the square tower, back to the nave, at the aisles' height
  if (ob > oB + 0.3) slab(out, f0, u0, u1, oB, ob + 0.1, 0, F + 15.8, STONE)
  // the four faces, each in its own frame: u along the face from its left corner, o out
  const faces: { f: Fr; front: boolean; outer: boolean; inner: boolean }[] = []
  for (const [nx, nz] of [[0, 1], [1, 0], [0, -1], [-1, 0]] as [number, number][]) {
    const n = { x: f0.nx * nz + f0.tx * nx, z: f0.nz * nz + f0.tz * nx }
    const mid = pt(f0, um + nx * hs, om + nz * hs)
    const fr = frN(n, mid, side)
    const f: Fr = { ...fr, ox: mid.x - fr.tx * hs, oz: mid.z - fr.tz * hs }
    const outerSide = nx !== 0 && ((um < 0 && nx < 0) || (um > 0 && nx > 0))
    faces.push({ f, front: nz > 0, outer: outerSide, inner: nx !== 0 && !outerSide })
  }
  const yG0 = F + 23.4                           // the gallery band
  const yG1 = F + 25.6
  const yBl = F + 33.2                           // the belfry's string course
  const yB0 = yBl + 0.9                          // the belfry openings' sills
  const yB1 = TOP - 2.6                          // the corbel table
  const pierW = Math.min(2.1, side * 0.24)
  const W = (side - 2 * pierW - 0.9) / 2         // each belfry opening
  const Hb = yB1 - 0.5 - yB0
  for (const { f, front, outer, inner } of faces) {
    const back = !front && !outer && !inner
    // the shaft's face to the belfry's string course (an inner face is hidden behind the centre bay below F+34)
    panel(out, f, 0, side, 0, inner ? F + 33 : 0, yBl, STONE, T.stone)
    // the belfry: piers, the heads of the two openings, the bell chamber's dark behind
    const holes = [{ u: pierW + W / 2, W, ys: yB0, H: Hb }, { u: side - pierW - W / 2, W, ys: yB0, H: Hb }]
    holedWall(out, f, 0, side, yBl, yB1, holes, 0, STONE)
    for (const h of holes) {
      holeReveal(out, f, h.u, h.W, h.ys, h.H, 0, -0.9, REVEAL)
      lancetRing(out, f, h.u, 0.05, h.ys, h.W, h.H, 0.3, TRIM)
      lancetFill(out, f, h.u, -0.9, h.ys, h.W, h.H, VOID)
      // the louvres across the lower openings
      for (let k = 0; k < 4; k++) {
        const y = h.ys + 0.6 + k * 1.1
        out.quad([P(f, h.u - h.W / 2, -0.75, y), P(f, h.u + h.W / 2, -0.75, y), P(f, h.u + h.W / 2, -0.4, y + 0.35), P(f, h.u - h.W / 2, -0.4, y + 0.35)],
          dir(f, 0, 0.7, 0.7), UV, LOUVRE, FIXED)
      }
      course(out, f, h.u - h.W / 2 - 0.3, h.u + h.W / 2 + 0.3, 0.3, h.ys - 0.3, h.ys, TRIM)
    }
    // the mullion pier between the openings, a little proud, and the corbel table, parapet and coping
    course(out, f, side / 2 - 0.35, side / 2 + 0.35, 0.3, yB0, yB1 - 0.6, STONE)
    course(out, f, 0, side, 0.45, yB1 - 0.4, yB1, TRIM)
    slab(out, f, -0.1, side + 0.1, -0.3, 0.3, yB1, TOP - 0.3, STONE)
    for (let k = 0; k < 7; k++) panel(out, f, 0.6 + k * (side - 1.2) / 7 + 0.25, 0.6 + (k + 1) * (side - 1.2) / 7 - 0.25, 0.32, yB1 + 0.5, TOP - 0.9, REVEAL)
    course(out, f, -0.2, side + 0.2, 0.45, TOP - 0.3, TOP, TRIM)
    // the string course under the belfry
    course(out, f, 0, side, 0.4, yBl - 0.3, yBl + 0.15, TRIM)
    if (inner) continue
    // the stage of blind paired lancets
    for (const h of holes) {
      lancetFill(out, f, h.u, 0.03, yG1 + 0.9, W * 0.9, yBl - yG1 - 1.9, REVEAL)
      lancetRing(out, f, h.u, 0.06, yG1 + 0.9, W * 0.9, yBl - yG1 - 1.9, 0.2, TRIM)
    }
    // the gallery band: a ledge with a row of small dark openings, its parapet over
    course(out, f, -0.1, side + 0.1, 0.55, yG0 - 0.35, yG0, TRIM)
    const nG = 7
    for (let k = 0; k < nG; k++) {
      const u = 0.5 + ((k + 0.5) / nG) * (side - 1)
      panel(out, f, u - (side - 1) / nG / 2 + 0.3, u + (side - 1) / nG / 2 - 0.3, 0.04, yG0 + 0.45, yG1 - 0.6, DEEP)
    }
    course(out, f, -0.1, side + 0.1, 0.5, yG1 - 0.25, yG1 + 0.1, TRIM)
    if (back) continue
    // the lower shaft: slit lancets, the door on the front, the clock
    if (!front) {
      for (const y of [F + 4, F + 15]) lancet(out, f, side / 2, y, 1.0, 4.8)
    }
    if (front) {
      lancet(out, f, side / 2, F + 15, 1.3, 5.5)
      // a pointed door in the tower's base, in three orders
      lancetFill(out, f, side / 2, 0.04, F, 2.4, 5.4, VOID)
      panel(out, f, side / 2 - 1.0, side / 2 + 1.0, 0.05, F, F + 3.6, BRONZE, T.metal)
      for (let k = 0; k < 3; k++) lancetRing(out, f, side / 2, 0.08 + k * 0.1, F, 2.4 + k * 0.6, 5.4 + k * 0.32, 0.3, k % 2 === 0 ? TRIM : REVEAL)
      // blind arcading either side of it
      for (const u of [1.6, side - 1.6]) {
        lancetFill(out, f, u, 0.03, F + 0.8, 1.2, 7.5, REVEAL)
        lancetRing(out, f, u, 0.06, F + 0.8, 1.2, 7.5, 0.15, TRIM)
      }
      course(out, f, 0, side, 0.3, F + 12.6, F + 13, TRIM)
    }
    if (south && outer) {
      const p = pt(f, side / 2, 0.05)
      clockFace(out, p.x, F + 20.5, p.z, f.nx, f.nz, 1.5, { dial: [0.82, 0.8, 0.74], rim: TRIM, marks: [0.2, 0.2, 0.2], hands: [0.15, 0.15, 0.15] })
    }
  }
  // the flat roof inside the parapet
  out.quad([P(f0, u0, ob, TOP - 1.2), P(f0, u1, ob, TOP - 1.2), P(f0, u1, oF, TOP - 1.2), P(f0, u0, oF, TOP - 1.2)], [0, 1, 0], UV, ROOF, T.roof)
  // the clasping corner buttresses: set back at the gallery and the belfry, a pinnacle over each corner
  for (const [cx, cz] of [[-1, -1], [-1, 1], [1, -1], [1, 1]] as [number, number][]) {
    const stages: [number, number, number][] = [[0, yG0 - 0.4, 1.15], [yG0 - 0.4, yBl, 0.85], [yBl, TOP + 0.4, 0.6]]
    for (const [ya, yb, d] of stages) {
      const ua = cx < 0 ? u0 - d : u1 - 1.3
      const ub = cx < 0 ? u0 + 1.3 : u1 + d
      const oa = cz < 0 ? ob - d * 0.2 : oF - 1.3
      const obb = cz < 0 ? ob + 1.3 : oF + d
      slab(out, f0, ua, ub, oa, obb, ya, yb, STONE)
    }
    const p = pt(f0, cx < 0 ? u0 + 0.2 : u1 - 0.2, cz < 0 ? ob + 0.4 : oF - 0.2)
    pin(out, p, TOP + 0.4, 3.4, 1.0)
  }
}

export const GRACE_CATHEDRAL: Record<string, (out: MeshBuilder, fit: Fit) => void> = { graceCathedral }
