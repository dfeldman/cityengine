/**
 * Three neighbours on Market and Mission between Eighth and Tenth, rebuilt to City Hall's standard (owner,
 * 2026-10-21: "only City Hall looks right") from the Mapillary frames in audit/refs8 (2026-10-21).
 *
 * MARKET SQUARE, the old San Francisco Furniture Mart (Lewis Hobart, 1937), 1355 Market (way/35111960): a whole
 * L-shaped block of WARM BUFF Art Deco terracotta, eleven storeys —
 *   - a dark granite plinth, a TWO-STOREY BASE of big dark shopfronts between the piers, a bronze transom in each;
 *   - over it an ORNAMENTAL FRIEZE, a relief panel a bay, under a string course;
 *   - CONTINUOUS PIERS up the whole shaft, the windows in PAIRS between them (a slim mullion splitting each pair),
 *     over red-brown spandrels, floor after floor;
 *   - a second frieze under the parapet and a plain coping;
 *   - in the middle of the 125 m Market front the TOWER BAY: it stands forward of the wings and rises two storeys
 *     higher, three tall window columns between two broad piers whose tops STEP like an Art Deco shoulder, the
 *     entrance doors at its foot; and the glazed penthouses on the wing roofs either side of it.
 *
 * DOLBY LABORATORIES, 1275 Market (1970s; refitted 2016, way/35176298): sixteen storeys of LIGHT TAUPE precast,
 * the windows in long dark ribbons a floor, a two-storey glazed lobby behind piers, and the white DOLBY blade.
 * Its outline steps in on the Ninth Street side, and each step is lower than the one behind it: the building is
 * a ZIGGURAT from Market, the low wing at the corner climbing in terraces to the full tower behind. (The old
 * builder's "dark red-brown granite" was wrong: the frames show a pale mauve-grey.)
 *
 * MISSION SUBSTATION (PG&E, 8th and Mission, way/35115839): a monumental, nearly windowless granite box —
 *   - on Mission, tall flat grey-green PILASTERS with PALE PANELS between them, between two solid corner masses
 *     (the company's name cut in the one at Eighth), over a black granite base and behind a SPIKED STEEL SCREEN;
 *   - on Eighth, a dark solid wall with two big RELIEFS and an arched door, and between them a tall panel of
 *     horizontal LOUVRES, pale slats on dark;
 *   - the corner masses stand a little above the parapet, the Eighth Street one higher still (a stepped roofline).
 *
 * All three are built on the real outline (fit.ring) and find their fronts on it by shape: the longest edge.
 */
import { capPolygon, type MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { towerRing } from '../../tower.ts'
import { offsetRing } from '../../parts.ts'
import { sign } from '../../signage.ts'

type P2 = { x: number; z: number }
type V3 = [number, number, number]
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
const EMIT = 0.5
const T = {
  terracotta: surfaceTag('terracotta'), granite: surfaceTag('granite'), metal: surfaceTag('metal'),
  glass: surfaceTag('glass'), concrete: surfaceTag('concrete'),
}

// ------------------------------------------------------------------------------------------------ edge frame

interface Edge { a: P2; b: P2; tx: number; tz: number; nx: number; nz: number; L: number; heading: number }
const edgeOf = (a: P2, b: P2): Edge => {
  const L = Math.hypot(b.x - a.x, b.z - a.z) || 1
  const tx = (b.x - a.x) / L
  const tz = (b.z - a.z) / L
  return { a, b, tx, tz, nx: tz, nz: -tx, L, heading: Math.atan2(tz, -tx) }
}
const edges = (ring: P2[]): Edge[] => ring.map((p, i) => edgeOf(p, ring[(i + 1) % ring.length]))
/** a point `u` along an edge and `o` out from it (negative: into the building) */
const at = (e: Edge, u: number, o: number): P2 => ({ x: e.a.x + e.tx * u + e.nx * o, z: e.a.z + e.tz * u + e.nz * o })
/** the same line, `o` metres out and from `u0` to `u1`: a part of a wall as a wall of its own */
const sub = (e: Edge, u0: number, u1: number, o = 0): Edge => edgeOf(at(e, u0, o), at(e, u1, o))

/** a vertical rectangle in the plane `o` out from an edge, facing out */
function quadOn(out: MeshBuilder, e: Edge, u0: number, u1: number, y0: number, y1: number, o: number, c: Rgb, tag = 0): void {
  const A = at(e, u0, o)
  const B = at(e, u1, o)
  out.quad([[A.x, y0, A.z], [B.x, y0, B.z], [B.x, y1, B.z], [A.x, y1, A.z]], [e.nx, 0, e.nz], UV, c, tag)
}

/**
 * A block on an edge: `u0..u1` along, `o0..o1` out, `y0..y1` up. Only the faces that can be seen are drawn by
 * default — the front, the two ends and the top; `back`/`bottom` add the others.
 */
function slab(out: MeshBuilder, e: Edge, u0: number, u1: number, o0: number, o1: number, y0: number, y1: number, c: Rgb, tag = 0,
              o: { back?: boolean; bottom?: boolean; top?: boolean; ends?: boolean } = {}): void {
  const P = (u: number, oo: number, y: number): V3 => [e.a.x + e.tx * u + e.nx * oo, y, e.a.z + e.tz * u + e.nz * oo]
  out.quad([P(u0, o1, y0), P(u1, o1, y0), P(u1, o1, y1), P(u0, o1, y1)], [e.nx, 0, e.nz], UV, c, tag)
  if (o.back) out.quad([P(u1, o0, y0), P(u0, o0, y0), P(u0, o0, y1), P(u1, o0, y1)], [-e.nx, 0, -e.nz], UV, c, tag)
  if (o.ends !== false) {
    out.quad([P(u0, o0, y0), P(u0, o1, y0), P(u0, o1, y1), P(u0, o0, y1)], [-e.tx, 0, -e.tz], UV, c, tag)
    out.quad([P(u1, o1, y0), P(u1, o0, y0), P(u1, o0, y1), P(u1, o1, y1)], [e.tx, 0, e.tz], UV, c, tag)
  }
  if (o.top !== false) out.quad([P(u0, o0, y1), P(u0, o1, y1), P(u1, o1, y1), P(u1, o0, y1)], [0, 1, 0], UV, c, tag)
  if (o.bottom) out.quad([P(u0, o1, y0), P(u0, o0, y0), P(u1, o0, y0), P(u1, o1, y0)], [0, -1, 0], UV, c, tag)
}

const ringArea = (r: P2[]): number => {
  let a = 0
  for (let i = 0; i < r.length; i++) { const p = r[i]; const q = r[(i + 1) % r.length]; a += p.x * q.z - q.x * p.z }
  return a / 2
}

/** the longest edge; among near-equals (a fitted box's two long sides) the one toward −z, the city's front */
function frontEdge(ring: P2[]): number {
  let best = 0
  let score = -Infinity
  edges(ring).forEach((e, i) => {
    const s = e.L - e.nz * 0.5
    if (s > score) { score = s; best = i }
  })
  return best
}

/** the part of a polygon on the inner side of the line through `p` along `d` (Sutherland–Hodgman, one half-plane) */
function clipHalf(poly: P2[], keep: (p: P2) => number): P2[] {
  const res: P2[] = []
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i]
    const q = poly[(i + 1) % poly.length]
    const sp = keep(p)
    const sq = keep(q)
    if (sp >= 0) res.push(p)
    if ((sp >= 0) !== (sq >= 0)) {
      const t = sp / (sp - sq)
      res.push({ x: p.x + (q.x - p.x) * t, z: p.z + (q.z - p.z) * t })
    }
  }
  return res
}

// =========================================================================================== the Furniture Mart

const BUFF: Rgb = [0.88, 0.75, 0.62]
const BUFF_SHADE: Rgb = [0.82, 0.69, 0.57]
const FRIEZE: Rgb = [0.78, 0.65, 0.53]
const ORNAMENT: Rgb = [0.93, 0.82, 0.7]
const SPANDREL: Rgb = [0.5, 0.36, 0.29]
const MART_GLASS: Rgb = [0.24, 0.26, 0.26]
const SHOP: Rgb = [0.12, 0.13, 0.14]
const BRONZE: Rgb = [0.26, 0.22, 0.17]
const PLINTH: Rgb = [0.22, 0.2, 0.2]
const PENTHOUSE: Rgb = [0.36, 0.44, 0.46]
const MART_ROOF: Rgb = [0.5, 0.48, 0.46]

/** the Mart's section: the wall plane is R behind the piers' faces */
const R = 0.42
const M = { plinth: 0.9, base: 9.0, frieze0: 9.1, frieze1: 10.7, course: 11.0, shaft: 11.2 }

/**
 * One run of the Mart's wall, `u0..u1` along the edge: the piers, the paired windows and their spandrels, the
 * shopfronts, both friezes, the string course and the coping. `single` gives one window a bay (beside the tower).
 */
function martWall(out: MeshBuilder, e: Edge, u0: number, u1: number, H: number, fh: number, floors: number,
                  o: { single?: boolean; cornerA?: boolean; cornerB?: boolean; pitch?: number } = {}): void {
  const span = u1 - u0
  if (span < 1) return
  const tc = T.terracotta
  const top = H - 0.9
  const hs = M.shaft + floors * fh
  const n = o.single ? 1 : Math.max(1, Math.round(span / (o.pitch ?? 5.1)))
  const pitch = span / n
  // the wall behind everything
  quadOn(out, e, u0, u1, M.plinth, top, -R, BUFF_SHADE, tc)
  // the piers, the end ones wider where the run turns a corner
  for (let k = 0; k <= n; k++) {
    const u = u0 + k * pitch
    const end = k === 0 || k === n
    const w = end ? ((k === 0 ? o.cornerA : o.cornerB) ? 1.9 : 0.8) : 1.6
    const a = k === 0 ? u : u - (end ? w : w / 2)
    const b = k === n ? u : u + (end ? w : w / 2)
    slab(out, e, a, b, -R, 0, M.plinth, top, BUFF, tc, { top: false })
  }
  for (let i = 0; i < n; i++) {
    const b0 = u0 + i * pitch + (i === 0 ? (o.cornerA ? 1.9 : 0.8) : 0.8)
    const b1 = u0 + (i + 1) * pitch - (i === n - 1 ? (o.cornerB ? 1.9 : 0.8) : 0.8)
    if (b1 - b0 < 0.8) continue
    // the base: the shopfront through both storeys, its bronze transom
    quadOn(out, e, b0, b1, M.plinth, M.base - 0.2, -R + 0.03, SHOP, T.glass)
    quadOn(out, e, b0, b1, 4.7, 5.15, -R + 0.07, BRONZE, T.metal)
    // the frieze: a relief panel a bay, two bosses on it
    quadOn(out, e, b0, b1, M.frieze0, M.frieze1, -0.16, FRIEZE, tc)
    const c = (b0 + b1) / 2
    const w4 = (b1 - b0) / 4
    // its carving: a tall lozenge in the middle, a lower one either side, a pair of fluted stubs between
    quadOn(out, e, c - 0.35, c + 0.35, M.frieze0 + 0.2, M.frieze1 - 0.2, -0.12, ORNAMENT, tc)
    for (const s of [-1, 1]) {
      quadOn(out, e, c + s * w4 * 1.35 - 0.4, c + s * w4 * 1.35 + 0.4, M.frieze0 + 0.45, M.frieze1 - 0.45, -0.12, ORNAMENT, tc)
      quadOn(out, e, c + s * w4 * 0.6 - 0.1, c + s * w4 * 0.6 + 0.1, M.frieze0 + 0.3, M.frieze1 - 0.3, -0.12, BUFF_SHADE, tc)
    }
    // the windows: one tall dark column a window, the spandrels laid over it floor by floor
    const m = 0.36
    const g0 = b0 + 0.3
    const g1 = b1 - 0.3
    if (o.single) {
      quadOn(out, e, g0, g1, M.shaft, hs, -R + 0.03, MART_GLASS, T.glass)
    } else {
      const mid = (g0 + g1) / 2
      quadOn(out, e, g0, mid - m / 2, M.shaft, hs, -R + 0.03, MART_GLASS, T.glass)
      quadOn(out, e, mid + m / 2, g1, M.shaft, hs, -R + 0.03, MART_GLASS, T.glass)
      slab(out, e, mid - m / 2, mid + m / 2, -R, -R + 0.24, M.shaft, hs, BUFF, tc, { top: false })
    }
    for (let f = 1; f < floors; f++) {
      const y = M.shaft + f * fh
      quadOn(out, e, g0, g1, y - 1.25, y, -R + 0.09, SPANDREL, tc)
    }
    // the transom bar across each floor's windows, the steel frames' one line that reads from the street
    for (let f = 0; f < floors; f++) {
      const y = M.shaft + f * fh + (fh - 1.25) * 0.68
      quadOn(out, e, g0, g1, y, y + 0.09, -R + 0.07, [0.5, 0.48, 0.44], T.metal)
    }
    // the top frieze
    quadOn(out, e, b0, b1, hs + 0.15, top - 0.1, -0.16, FRIEZE, tc)
    for (const s of [-1, 1]) quadOn(out, e, c + s * w4 - 0.4, c + s * w4 + 0.4, hs + 0.45, top - 0.4, -0.12, ORNAMENT, tc)
  }
  // the plinth, the string course over the frieze, the coping
  slab(out, e, u0, u1, -R, 0.06, 0, M.plinth, PLINTH, T.granite, { ends: false })
  slab(out, e, u0, u1, -R, 0.12, M.frieze1, M.course, BUFF, tc, { bottom: true, ends: false })
  slab(out, e, u0, u1, -R - 0.3, 0.14, top, H, BUFF, tc, { ends: false })
}

function furnitureMart(out: MeshBuilder, fit: Fit): void {
  const ring = towerRing(fit)
  const H = fit.height >= 34 && fit.height <= 46 ? fit.height : 41
  const floors = 9
  const fh = (H - 2.9 - M.shaft) / floors
  const es = edges(ring)
  const fi = frontEdge(ring)
  const F = es[fi]
  // the roof, inside the coping
  capPolygon(out, offsetRing(ring, -0.5), H - 0.05, MART_ROOF, 0)
  // the tower bay at the middle of the Market front, its two single-window bays either side
  const mid = F.L / 2
  const TW = 8
  const SIDE = 3.9
  for (let i = 0; i < es.length; i++) {
    const e = es[i]
    if (e.L < 1.2) continue
    // a corner pier wherever this run turns a convex corner
    const prev = es[(i - 1 + es.length) % es.length]
    const next = es[(i + 1) % es.length]
    const convex = (p: Edge, q: Edge): boolean => p.tx * q.tz - p.tz * q.tx > 0.3
    const cornerA = convex(prev, e)
    const cornerB = convex(e, next)
    if (i === fi && F.L > 60) {
      martWall(out, e, 0, mid - TW - SIDE, H, fh, floors, { cornerA })
      martWall(out, e, mid - TW - SIDE, mid - TW, H, fh, floors, { single: true })
      martWall(out, e, mid + TW, mid + TW + SIDE, H, fh, floors, { single: true })
      martWall(out, e, mid + TW + SIDE, e.L, H, fh, floors, { cornerB })
    } else {
      martWall(out, e, 0, e.L, H, fh, floors, { cornerA, cornerB })
    }
  }
  if (F.L > 60) martTower(out, F, mid, TW, H, fh)
}

/** The Market front's tower bay: forward of the wings, two storeys higher, its broad piers stepping at the top. */
function martTower(out: MeshBuilder, F: Edge, mid: number, TW: number, H: number, fh: number): void {
  const tc = T.terracotta
  const fwd = 0.7
  const Ht = H + 7
  const E = sub(F, mid - TW, mid + TW, fwd)     // the tower's own front, u from 0 to 2·TW
  const W = 2 * TW
  const BP = 2.7                                // the broad piers
  const floors = Math.floor((Ht - 3.4 - M.shaft) / fh)
  const hs = M.shaft + floors * fh
  // the mass: back into the building, up to the tower's roof (the front is the wall plane drawn below)
  slab(out, E, 0, W, -15, -R, 0, Ht - 0.9, BUFF_SHADE, tc, { back: true })
  quadOn(out, E, 0, W, M.plinth, Ht - 0.9, -R, BUFF_SHADE, tc)
  capPolygon(out, [at(E, 0, -15), at(E, W, -15), at(E, W, -R), at(E, 0, -R)].reverse(), Ht - 0.95, MART_ROOF, 0)
  // the broad piers and their stepped shoulders: the outer half stops short, the inner half rises past the parapet
  for (const a of [0, W - BP]) {
    const inner = a === 0 ? [BP * 0.35, BP] : [W - BP, W - BP * 0.35]
    const outer = a === 0 ? [0, BP * 0.35] : [W - BP * 0.35, W]
    slab(out, E, outer[0], outer[1], -R, 0, M.plinth, Ht + 0.5, BUFF, tc)
    slab(out, E, inner[0], inner[1], -R, 0, M.plinth, Ht + 1.4, BUFF, tc)
  }
  // three window columns between narrow piers
  const x0 = BP + 0.2
  const np = 0.8
  const ww = (W - 2 * BP - 0.4 - 2 * np) / 3
  for (let k = 0; k < 3; k++) {
    const a = x0 + k * (ww + np)
    quadOn(out, E, a, a + ww, M.shaft, hs, -R + 0.03, MART_GLASS, T.glass)
    for (let f = 1; f < floors; f++) {
      const y = M.shaft + f * fh
      quadOn(out, E, a, a + ww, y - 1.05, y, -R + 0.09, SPANDREL, tc)
    }
    // a slim mullion down each
    slab(out, E, a + ww / 2 - 0.1, a + ww / 2 + 0.1, -R, -R + 0.15, M.shaft, hs, BUFF, tc, { top: false })
    if (k < 2) slab(out, E, a + ww, a + ww + np, -R, -0.05, M.plinth, hs + 0.2, BUFF, tc, { top: false })
    // the doors at the foot, deep under the frieze
    quadOn(out, E, a + 0.25, a + ww - 0.25, M.plinth, 7.4, -R + 0.03, SHOP, T.glass)
    quadOn(out, E, a + 0.05, a + ww - 0.05, 7.4, M.base, -R + 0.05, BRONZE, T.metal)
  }
  // the edges of the window field
  slab(out, E, BP, x0, -R, -0.05, M.plinth, Ht - 0.9, BUFF, tc, { top: false })
  slab(out, E, W - BP - 0.2, W - BP, -R, -0.05, M.plinth, Ht - 0.9, BUFF, tc, { top: false })
  // the friezes: over the doors, and the tall carved panel under the parapet
  quadOn(out, E, BP, W - BP, M.frieze0, M.frieze1, -0.12, FRIEZE, tc)
  quadOn(out, E, BP, W - BP, hs + 0.2, Ht - 0.9, -0.12, FRIEZE, tc)
  for (let k = 0; k < 5; k++) {
    const c = BP + ((W - 2 * BP) * (k + 0.5)) / 5
    quadOn(out, E, c - 0.55, c + 0.55, hs + 0.6, Ht - 1.4, -0.08, ORNAMENT, tc)
    quadOn(out, E, c - 0.5, c + 0.5, M.frieze0 + 0.3, M.frieze1 - 0.3, -0.08, ORNAMENT, tc)
  }
  slab(out, E, BP, W - BP, -R, 0.1, M.frieze1, M.course, BUFF, tc, { bottom: true, ends: false })
  slab(out, E, BP - 0.1, W - BP + 0.1, -R - 0.3, 0.12, Ht - 0.9, Ht, BUFF, tc)
  // the tower's sides over the wing roofs: the coping round them, a window column on each
  for (const [u, s] of [[0, -1], [W, 1]] as const) {
    const side = edgeOf(at(E, u, s < 0 ? -15 : 0), at(E, u, s < 0 ? 0 : -15))
    quadOn(out, side, 5, 8, H + 0.2, Ht - 1.6, 0.03, MART_GLASS, T.glass)
    slab(out, side, 0, 15, -0.3, 0.12, Ht - 0.9, Ht, BUFF, tc, { ends: false })
  }
  // the glazed penthouses on the wing roofs either side, set back a little from the parapet
  for (const [a, b] of [[-8.5, -0.2], [W + 0.2, W + 8.5]]) {
    const P = sub(E, a, b, -fwd - 1.6)
    slab(out, P, 0, P.L, -10, 0, H - 0.05, H + 3.4, PENTHOUSE, T.glass, { back: true })
    slab(out, P, -0.15, P.L + 0.15, -10.15, 0.15, H + 3.4, H + 3.75, [0.6, 0.6, 0.58], T.metal, { back: true, bottom: true })
    const n = Math.round(P.L / 1.6)
    for (let k = 1; k < n; k++) quadOn(out, P, (P.L * k) / n - 0.06, (P.L * k) / n + 0.06, H, H + 3.4, 0.03, [0.3, 0.32, 0.33], T.metal)
  }
}

// ================================================================================================== Dolby

const TAUPE: Rgb = [0.73, 0.69, 0.7]
const TAUPE_LIGHT: Rgb = [0.8, 0.76, 0.76]
const RIBBON: Rgb = [0.19, 0.2, 0.24]
const LOBBY: Rgb = [0.15, 0.17, 0.19]
const DOLBY_ROOF: Rgb = [0.5, 0.48, 0.48]

/** The precast wall of one face of one terrace, from y0 to y1: its ribbon windows a floor, the lobby under them. */
function dolbyWall(out: MeshBuilder, e: Edge, y0: number, y1: number, base: number, fh: number): void {
  const tc = T.concrete
  if (y1 - y0 < 0.5 || e.L < 1) return
  quadOn(out, e, 0, e.L, y0, y1, 0, TAUPE, tc)
  // the lobby: dark glass behind square piers
  if (y0 < base) {
    quadOn(out, e, 0, e.L, y0, base - 0.6, 0.02, LOBBY, T.glass)
    const n = Math.max(1, Math.round(e.L / 7.5))
    for (let k = 0; k <= n; k++) {
      const u = (e.L * k) / n
      slab(out, e, Math.max(0, u - 0.6), Math.min(e.L, u + 0.6), 0, 0.5, y0, base, TAUPE, tc, { top: false })
    }
    slab(out, e, 0, e.L, 0, 0.5, base - 0.6, base, TAUPE_LIGHT, tc, { bottom: true, ends: false })
  }
  // the ribbons: a dark band a floor, broken into runs of four windows by a wider pier
  const seg = Math.max(1, Math.round(e.L / 9))
  const sl = e.L / seg
  for (let y = base; y + fh <= y1 - 1.2 + 0.01; y += fh) {
    if (y + 1.0 < y0) continue
    for (let s = 0; s < seg; s++) {
      const a = s * sl + (s === 0 ? 1.1 : 0.45)
      const b = (s + 1) * sl - (s === seg - 1 ? 1.1 : 0.45)
      if (b - a > 0.8) quadOn(out, e, a, b, y + 1.0, y + 2.75, 0.03, RIBBON, T.glass)
    }
  }
  // the coping at the top of this face
  slab(out, e, 0, e.L, -0.2, 0.12, y1 - 0.5, y1, TAUPE_LIGHT, tc, { ends: false })
}

function dolbyBuilding(out: MeshBuilder, fit: Fit): void {
  const ring = towerRing(fit)
  // sixteen storeys over a two-storey lobby: 81 m (SKYDB); the manifest's 64 is too low, OSM's 95 too high
  const H = fit.height >= 72 && fit.height <= 92 ? fit.height : 80
  const base = 8.5
  const fh = 4.1
  const fi = frontEdge(ring)
  const F = edges(ring)[fi]
  const U = (p: P2): number => (p.x - F.a.x) * F.tx + (p.z - F.a.z) * F.tz
  const O = (p: P2): number => (p.x - F.a.x) * F.nx + (p.z - F.a.z) * F.nz
  // the terraces: the plan cut across the Market front wherever the outline steps
  const us = ring.map(U).sort((a, b) => a - b)
  const cuts: number[] = []
  for (const u of us) if (!cuts.length || u - cuts[cuts.length - 1] > 1.5) cuts.push(u)
  cuts[cuts.length - 1] = us[us.length - 1]
  const strips: { poly: P2[]; u0: number; u1: number; d: number; h: number }[] = []
  for (let i = 0; i + 1 < cuts.length; i++) {
    const u0 = cuts[i]
    const u1 = cuts[i + 1]
    let poly = clipHalf(ring, (p) => U(p) - u0 + 1e-6)
    poly = clipHalf(poly, (p) => u1 - U(p) + 1e-6)
    if (poly.length < 3 || Math.abs(ringArea(poly)) < 4) continue
    // its depth where it is whole, at its middle: OSM's corners are a few centimetres off square, and a corner of
    // the next terrace's outline caught in this one's clip would make it as deep as that one
    const um = (u0 + u1) / 2
    const core = clipHalf(clipHalf(poly, (p) => U(p) - um + 0.05), (p) => um + 0.05 - U(p))
    strips.push({ poly, u0, u1, d: Math.max(...(core.length ? core : poly).map((p) => -O(p))), h: H })
  }
  const dMax = Math.max(...strips.map((s) => s.d))
  const dMin = Math.min(...strips.map((s) => s.d))
  for (const s of strips) {
    // the shallower the terrace, the lower: a whole-depth tower behind, the corner wing four storeys
    const f = dMax - dMin > 4 ? (s.d - dMin) / (dMax - dMin) : 1
    s.h = f >= 0.98 ? H : Math.min(H - fh, base + Math.round(4 + f * 12) * fh + 1.2)
  }
  const near = (a: number, b: number): boolean => Math.abs(a - b) < 0.3
  for (let k = 0; k < strips.length; k++) {
    const s = strips[k]
    capPolygon(out, s.poly, s.h - 0.02, DOLBY_ROOF, 0)
    for (const e of edges(s.poly)) {
      if (e.L < 0.5) continue
      const ua = U(e.a)
      const ub = U(e.b)
      // an edge on a cut between two terraces shows only above the lower one, where the lower one reaches
      const nb = near(ua, ub) ? (near(ua, s.u0) ? strips[k - 1] : near(ua, s.u1) ? strips[k + 1] : undefined) : undefined
      if (!nb) { dolbyWall(out, e, 0, s.h, base, fh); continue }
      if (nb.h >= s.h - 0.5) continue
      // the part of the cut the neighbour covers is its depth from the front; beyond that the wall comes to the ground
      const oa = -O(e.a)
      const ob = -O(e.b)
      const split = Math.abs(ob - oa) > 0.01 ? (nb.d - oa) / (ob - oa) : -1
      if (split <= 0.02 || split >= 0.98) {
        // all on one side of the neighbour's back wall: covered if its middle is
        dolbyWall(out, e, (oa + ob) / 2 < nb.d ? nb.h : 0, s.h, base, fh)
        continue
      }
      const m = { x: e.a.x + (e.b.x - e.a.x) * split, z: e.a.z + (e.b.z - e.a.z) * split }
      const covered = oa < ob ? [edgeOf(e.a, m), edgeOf(m, e.b)] : [edgeOf(m, e.b), edgeOf(e.a, m)]
      dolbyWall(out, covered[0], nb.h, s.h, base, fh)
      dolbyWall(out, covered[1], 0, s.h, base, fh)
    }
  }
  // the plant on the tower's roof, set back from its edges
  const top = strips.reduce((a, b) => (b.h > a.h ? b : a))
  const cx = top.poly.reduce((t, p) => t + p.x, 0) / top.poly.length
  const cz = top.poly.reduce((t, p) => t + p.z, 0) / top.poly.length
  const pe = sub(F, 0, 1)
  const c0 = { x: cx - F.a.x, z: cz - F.a.z }
  const cu = c0.x * F.tx + c0.z * F.tz
  const co = c0.x * F.nx + c0.z * F.nz
  slab(out, pe, cu - 9, cu + 9, co - 7, co + 7, top.h - 0.05, top.h + 4, TAUPE, T.concrete, { back: true })
  // the white DOLBY blade on the Tenth Street side, by the Market corner
  const es = edges(ring)
  const side = es[(fi + 1) % es.length]
  const white: Rgb = [0.94, 0.94, 0.93]
  const ub = 1.6
  slab(out, side, ub - 0.3, ub + 0.3, 0.1, 2.0, 7.5, 27, white, T.metal, { back: true, bottom: true })
  for (const sd of [-1, 1]) {
    const p = at(side, ub + sd * 0.32, 1.05)
    sign(out, { type: 'flat', text: 'DOLBY', h: 1.25, face: 'grotesque', weight: 'bold', colour: [0.18, 0.18, 0.2], vertical: true, lit: 'front' },
      { x: p.x, y: 17.2, z: p.z, heading: Math.atan2(side.tx * sd, side.tz * sd) })
  }
}

// ============================================================================================ Mission Substation

const SUB_GRANITE: Rgb = [0.33, 0.37, 0.35]
const SUB_PILASTER: Rgb = [0.37, 0.41, 0.39]
const SUB_PANEL: Rgb = [0.58, 0.59, 0.56]
const SUB_BASE: Rgb = [0.17, 0.18, 0.19]
const SUB_DARK: Rgb = [0.09, 0.09, 0.09]
const SUB_SLAT: Rgb = [0.6, 0.59, 0.55]
const SUB_RELIEF: Rgb = [0.44, 0.48, 0.45]
const SCREEN: Rgb = [0.2, 0.21, 0.22]
const SUB_ROOF: Rgb = [0.38, 0.4, 0.39]

/** A sculpted relief on a wall: a panel and a cluster of raised masses, centred `u` along, `y` up. */
function relief(out: MeshBuilder, e: Edge, u: number, y: number, w: number, h: number): void {
  const g = T.granite
  quadOn(out, e, u - w / 2, u + w / 2, y - h / 2, y + h / 2, 0.03, [0.36, 0.4, 0.37], g)
  const parts: [number, number, number, number, number][] = [
    // du, dy, half-width, half-height, depth (fractions of w, h)
    [-0.18, 0.1, 0.16, 0.34, 0.35], [0.12, 0.18, 0.2, 0.22, 0.45], [0.05, -0.2, 0.3, 0.12, 0.3],
    [-0.28, -0.3, 0.12, 0.14, 0.25], [0.3, -0.05, 0.1, 0.3, 0.3], [-0.02, 0.38, 0.12, 0.08, 0.25],
  ]
  for (const [du, dy, hw, hh, d] of parts) {
    const c = u + du * w
    slab(out, e, c - hw * w, c + hw * w, 0, d, y + (dy - hh) * h, y + (dy + hh) * h, SUB_RELIEF, g, { bottom: true })
  }
}

function missionSubstation(out: MeshBuilder, fit: Fit): void {
  const ring = towerRing(fit)
  const H = fit.height >= 26 && fit.height <= 42 ? fit.height : 34
  const g = T.granite
  const es = edges(ring)
  const fi = frontEdge(ring)
  const F = es[fi]
  // Eighth Street: the end after the Mission front (anticlockwise, the front runs toward it). The frames put the
  // company's name on the corner mass next to the relief wall, and that wall round the corner from the pilasters
  const E8 = es[(fi + 1) % es.length]
  const PIL = 0.55
  const BASE = 2.6
  const COPE = H - 2.4
  // the box itself: its walls, the roof
  for (const e of es) quadOn(out, e, 0, e.L, 0, H, 0, SUB_GRANITE, g)
  capPolygon(out, offsetRing(ring, -0.3), H - 0.1, SUB_ROOF, 0)
  for (const e of es) {
    slab(out, e, 0, e.L, -0.3, 0.2, H - 0.7, H, SUB_PILASTER, g, { ends: false })                 // the coping
    slab(out, e, 0, e.L, -0.1, 0.12, 0, e === F ? BASE : 1.2, SUB_BASE, g, { ends: false })        // the black base
  }

  // ---- the Mission front: corner masses, the pilasters and pale panels between, the screen in front
  const CM = Math.min(9.5, F.L * 0.14)
  const span0 = CM
  const span1 = F.L - CM
  const n = Math.max(3, Math.round((span1 - span0) / 5.1))
  const pitch = (span1 - span0) / n
  for (let k = 0; k < n; k++) {
    const a = span0 + k * pitch + PIL * 0 + 0.95
    const b = span0 + (k + 1) * pitch - 0.95
    // the panel, very slightly recessed, pale
    quadOn(out, F, a, b, BASE, COPE, 0.02, SUB_PANEL, g)
  }
  for (let k = 0; k <= n; k++) {
    const u = span0 + k * pitch
    slab(out, F, u - 0.95, u + 0.95, 0, PIL, BASE, COPE + 0.6, SUB_PILASTER, g)
  }
  // the band over the panels the pilasters run up into
  slab(out, F, span0, span1, 0, 0.22, COPE, H - 0.7, SUB_PILASTER, g, { bottom: true, ends: false })
  // the corner masses, stepping above the parapet; the one at Eighth higher, the name cut in it
  for (const [u0, u1, up] of [[0, span0, 1.4], [span1, F.L, 3.2]] as const) {
    slab(out, F, u0, u1, -9, 0.3, BASE, H + up, SUB_GRANITE, g, { back: true })
    slab(out, F, u0 - 0.1, u1 + 0.1, -9.1, 0.42, H + up - 0.5, H + up, SUB_PILASTER, g, { back: true, bottom: true })
    slab(out, F, u0, u1, -0.1, 0.42, 0, BASE, SUB_BASE, g, { ends: false })
  }
  quadOn(out, F, span1 + span0 * 0.2, span1 + span0 * 0.8, 9.5, 11.4, 0.33, [0.48, 0.5, 0.47], g)
  for (let k = 0; k < 3; k++) quadOn(out, F, span1 + span0 * 0.28, span1 + span0 * 0.72, 10.0 + k * 0.45, 10.2 + k * 0.45, 0.35, [0.3, 0.32, 0.3], g)
  // the spiked screen: a rail, pickets with points flaring out over the pavement
  const so = PIL + 0.35
  slab(out, F, span0, span1, so - 0.05, so + 0.05, BASE - 0.1, BASE + 0.05, SCREEN, T.metal, { ends: false })
  const pn = Math.round((span1 - span0) / 0.42)
  for (let k = 0; k <= pn; k++) {
    const u = span0 + ((span1 - span0) * k) / pn
    // the screen rises in a gentle crest in each bay
    const ph = ((u - span0) / pitch) % 1
    const top = BASE + 1.6 + Math.sin(ph * Math.PI) * 1.1
    const A = at(F, u - 0.07, so)
    const B = at(F, u + 0.07, so)
    const tip = at(F, u, so + 0.45)
    out.quad([[A.x, BASE, A.z], [B.x, BASE, B.z], [B.x, top, B.z], [A.x, top, A.z]], [F.nx, 0, F.nz], UV, SCREEN, T.metal)
    out.quad([[A.x, top, A.z], [B.x, top, B.z], [tip.x, top + 0.7, tip.z], [tip.x, top + 0.7, tip.z]], [F.nx, 0.5, F.nz], UV, SCREEN, T.metal)
  }

  // ---- Eighth Street: the dark solid wall, two reliefs, the arched door, and the louvres between
  const L8 = E8.L
  const l0 = L8 * 0.45
  const l1 = L8 * 0.72
  // (E8 runs away from the Mission corner: its START is at the front)
  const fromFront = (d: number): number => d
  quadOn(out, E8, fromFront(l0), fromFront(l1), 1.2, H - 1.2, 0.02, SUB_DARK, g)
  for (const s of [-1, 1]) slab(out, E8, s < 0 ? fromFront(l0) - 0.3 : fromFront(l1), s < 0 ? fromFront(l0) : fromFront(l1) + 0.3, 0, 0.3, 1.2, H - 0.7, SUB_GRANITE, g, { top: false })
  for (let y = 2.0; y < H - 1.6; y += 1.0) slab(out, E8, fromFront(l0), fromFront(l1), 0.02, 0.2, y, y + 0.5, SUB_SLAT, g, { bottom: true, ends: false })
  relief(out, E8, fromFront(l0 * 0.45), H * 0.6, Math.min(8, l0 * 0.5), 10)
  relief(out, E8, fromFront((l1 + L8) / 2), H * 0.55, Math.min(6, (L8 - l1) * 0.6), 8)
  // the arched door by the far relief
  const du = fromFront(l0 - 3.2)
  quadOn(out, E8, du - 1.1, du + 1.1, 0, 3.6, 0.13, SUB_DARK, g)
  for (let i = 0; i < 6; i++) {
    const a0 = Math.PI - (i / 6) * Math.PI
    const a1 = Math.PI - ((i + 1) / 6) * Math.PI
    const p = (a: number): V3 => { const q = at(E8, du + Math.cos(a) * 1.1, 0.13); return [q.x, 3.6 + Math.sin(a) * 1.1, q.z] }
    const c = at(E8, du, 0.13)
    out.quad([[c.x, 3.6, c.z], p(a0), p(a1), [c.x, 3.6, c.z]], [E8.nx, 0, E8.nz], UV, SUB_DARK, g)
  }

  // ---- the far end and the back: the same pilasters, plainer, without the screen
  const SW = es[(fi - 1 + es.length) % es.length]
  const nw = Math.max(2, Math.round((SW.L - 10) / 5.1))
  for (let k = 0; k <= nw; k++) {
    const u = 5 + ((SW.L - 10) * k) / nw
    if (k < nw) quadOn(out, SW, u + 0.9, u + (SW.L - 10) / nw - 0.9, 1.2, COPE, 0.02, SUB_PANEL, g)
    slab(out, SW, u - 0.9, u + 0.9, 0, 0.4, 1.2, COPE + 0.6, SUB_PILASTER, g)
  }
  for (let i = 0; i < es.length; i++) {
    if (i === fi || es[i] === E8 || es[i] === SW || es[i].L < 12) continue
    const e = es[i]
    const nb = Math.max(2, Math.round(e.L / 8))
    for (let k = 1; k < nb; k++) slab(out, e, (e.L * k) / nb - 0.7, (e.L * k) / nb + 0.7, 0, 0.3, 1.2, COPE, SUB_PILASTER, g)
  }
  // a little lamp over the door
  const lp = at(E8, du, 0.3)
  slab(out, edgeOf(lp, at(E8, du + 1, 0.3)), -0.15, 0.15, -0.1, 0.15, 4.9, 5.2, [1, 0.88, 0.6], EMIT, { bottom: true })
}

export const MARKET_DECO: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  furnitureMart,
  dolbyBuilding,
  missionSubstation,
}
