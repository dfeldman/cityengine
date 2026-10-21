/**
 * 140 New Montgomery, the Pacific Telephone & Telegraph Building (Miller & Pflueger with A. A. Cantin, 1925), from
 * the Mapillary frames in p3/refs/way-80296766 (the top from across New Montgomery and down the alleys) and the
 * Wikipedia facts: 26 storeys, the roof at 132.6 m, the top floor at 125.9 m, an L-shaped plan, the setbacks taken
 * from Saarinen's Tribune Tower entry, eight 4 m (13 ft) eagles on the crown, a monumental arched entrance on New
 * Montgomery ringed with bell motifs.
 *
 * What the photographs show: the whole tower is one pale grey-white terracotta; its walls are deep continuous PIERS
 * from the pavement to the parapet, the windows and their dark spandrels recessed between them, so it reads as
 * vertical stripes; at the top the piers run up past the parapet as fins with pointed caps, and the tower steps in
 * — a wide stage, a narrower one, a central crown with the flagpole — the eagles standing on the corners of the
 * setback ledges.
 *
 * The frame: the real outline, simplified. The New Montgomery front is FOUND as its longest edge (the 48.6 m
 * street front; the Minna Street side is 44.8 m); the body rises on the whole L to the first setback, and the
 * setback stages are rectangles on the front bar, as deep as the outline is everywhere behind the front (the light
 * court cuts the bar to ~13 m). Each wall is laid out in its own frame: u along it, o out of it, y up.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { capPolygon } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { prism, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { stair } from '../../parts.ts'
import { simplifyRing } from '../districts/market-west.ts'

type P2 = { x: number; z: number }
type V3 = [number, number, number]
const FIXED = 0
const T = { terra: surfaceTag('terracotta'), granite: surfaceTag('granite'), metal: surfaceTag('metal') }

// the pale grey-white terracotta of the photographs; the spandrels mid grey, the glass dark
const PIER: Rgb = [0.87, 0.87, 0.85]
const TRIM: Rgb = [0.92, 0.92, 0.9]
const SPANDREL: Rgb = [0.62, 0.63, 0.64]
const GLASS: Rgb = [0.15, 0.17, 0.2]
const BASE: Rgb = [0.66, 0.65, 0.62]
const RELIEF: Rgb = [0.76, 0.76, 0.73]
const DOOR: Rgb = [0.2, 0.18, 0.16]
const GILT: Rgb = [0.78, 0.66, 0.36]
const ROOF: Rgb = [0.5, 0.5, 0.5]
const EAGLE: Rgb = [0.9, 0.9, 0.87]

/** The heights, metres over the pavement. */
const Y = {
  plinth: 0.9,
  ground: 8.6,     // the tall ground storey's top: the first office floor
  fh: 4.55,        // an office floor
  body: 104,       // the whole L stops here: the first setback
  a: 113.2,        // stage A's roof: the first eagles
  b: 122.3,        // stage B's roof: the second eagles
  roof: 132.6,     // the crown's roof
  fin: 2.3,        // how far the piers rise past a parapet
}

// ------------------------------------------------------------------------------------------- an edge's frame

interface Fr { ox: number; oz: number; tx: number; tz: number; nx: number; nz: number; L: number }
const frameOf = (a: P2, b: P2): Fr => {
  const L = Math.hypot(b.x - a.x, b.z - a.z) || 1
  const tx = (b.x - a.x) / L
  const tz = (b.z - a.z) / L
  return { ox: a.x, oz: a.z, tx, tz, nx: tz, nz: -tx, L }
}
const P = (f: Fr, u: number, o: number, y: number): V3 => [f.ox + f.tx * u + f.nx * o, y, f.oz + f.tz * u + f.nz * o]
const pt = (f: Fr, u: number, o: number): P2 => ({ x: f.ox + f.tx * u + f.nx * o, z: f.oz + f.tz * u + f.nz * o })
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

/** A block in a frame: `u0..u1` along, `o0..o1` out, `y0..y1` up (no underside unless asked). */
function slab(out: MeshBuilder, f: Fr, u0: number, u1: number, o0: number, o1: number, y0: number, y1: number, c: Rgb, tag = FIXED, bottom = false, back = false): void {
  const Q = (u: number, o: number, y: number) => P(f, u, o, y)
  out.quad([Q(u0, o1, y0), Q(u1, o1, y0), Q(u1, o1, y1), Q(u0, o1, y1)], [f.nx, 0, f.nz], UV, c, tag)
  out.quad([Q(u0, o0, y0), Q(u0, o1, y0), Q(u0, o1, y1), Q(u0, o0, y1)], [-f.tx, 0, -f.tz], UV, c, tag)
  out.quad([Q(u1, o1, y0), Q(u1, o0, y0), Q(u1, o0, y1), Q(u1, o1, y1)], [f.tx, 0, f.tz], UV, c, tag)
  out.quad([Q(u0, o0, y1), Q(u0, o1, y1), Q(u1, o1, y1), Q(u1, o0, y1)], [0, 1, 0], UV, c, tag)
  if (bottom) out.quad([Q(u0, o1, y0), Q(u0, o0, y0), Q(u1, o0, y0), Q(u1, o1, y0)], [0, -1, 0], UV, c, tag)
  if (back) out.quad([Q(u1, o0, y0), Q(u0, o0, y0), Q(u0, o0, y1), Q(u1, o0, y1)], [-f.nx, 0, -f.nz], UV, c, tag)
}
/** A flat rectangle facing out of the wall, `o` metres proud of it. */
function panel(out: MeshBuilder, f: Fr, u0: number, u1: number, o: number, y0: number, y1: number, c: Rgb, tag = FIXED): void {
  out.quad([P(f, u0, o, y0), P(f, u1, o, y0), P(f, u1, o, y1), P(f, u0, o, y1)], [f.nx, 0, f.nz], UV, c, tag)
}
/** A round-headed opening `w` wide, `h` tall from `y0`, centred `u` along, `o` proud. */
function arch(out: MeshBuilder, f: Fr, u: number, o: number, y0: number, w: number, h: number, c: Rgb, seg = 8): void {
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

/**
 * A six-faced solid from its 8 corners — bottom four then the top four above them, in either winding: each face is
 * turned to face away from the middle (the tapered pier caps, the eagles' bodies and wings).
 */
function box8(out: MeshBuilder, p: V3[], c: Rgb, tag = FIXED, bottom = false): void {
  const mid: V3 = [0, 0, 0]
  for (const q of p) { mid[0] += q[0] / 8; mid[1] += q[1] / 8; mid[2] += q[2] / 8 }
  const faces = [[0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7], [4, 5, 6, 7]]
  if (bottom) faces.push([3, 2, 1, 0])
  for (const fc of faces) {
    let q = fc.map((k) => p[k])
    const e1 = [q[1][0] - q[0][0], q[1][1] - q[0][1], q[1][2] - q[0][2]]
    const e2 = [q[2][0] - q[0][0], q[2][1] - q[0][1], q[2][2] - q[0][2]]
    // the builder's winding: the normal is minus (e1 x e2)
    let n: V3 = [-(e1[1] * e2[2] - e1[2] * e2[1]), -(e1[2] * e2[0] - e1[0] * e2[2]), -(e1[0] * e2[1] - e1[1] * e2[0])]
    const cx = (q[0][0] + q[2][0]) / 2 - mid[0]
    const cy = (q[0][1] + q[2][1]) / 2 - mid[1]
    const cz = (q[0][2] + q[2][2]) / 2 - mid[2]
    if (n[0] * cx + n[1] * cy + n[2] * cz < 0) { q = [q[3], q[2], q[1], q[0]]; n = [-n[0], -n[1], -n[2]] }
    const l = Math.hypot(n[0], n[1], n[2]) || 1
    out.quad(q, [n[0] / l, n[1] / l, n[2] / l], UV, c, tag)
  }
}

// ------------------------------------------------------------------------------------------------ the walls

interface WallOpts {
  /** pier positions along the wall; [] for a plain (light-court) wall */
  piers: number[]
  /** the first office floor's level for this wall's grid (all walls share Y.ground + k * Y.fh) */
  ground: boolean
  /** how proud the piers stand */
  proud: number
  /** the stretch of the front the entrance takes (no piers, no shop windows) */
  door?: [number, number]
  /** the ground under the wall's foot, below 0 where the building was raised to the street */
  foot: number
}

/** The piers along a wall `L` long, a bay `bay` metres, the end piers at the corners. */
function pierGrid(L: number, bay: number): number[] {
  const n = Math.max(1, Math.round((L - 1.2) / bay))
  const s = (L - 1.2) / n
  return Array.from({ length: n + 1 }, (_, k) => 0.6 + k * s)
}

/**
 * One wall from `y0` to `y1`: the spandrel face, a dark window a bay a floor, the piers proud of it rising past
 * the parapet as fins with pointed caps, the parapet band; on the ground storey a granite plinth and the tall shop
 * windows. `fins` false stops the piers at the parapet (the body's walls under a setback stage).
 */
function wall(out: MeshBuilder, f: Fr, y0: number, y1: number, w: WallOpts, fins = true): void {
  const L = f.L
  if (L < 1.5) { panel(out, f, 0, L, 0, w.ground ? w.foot : y0, y1 + 1, PIER, T.terra); return }
  const yb = w.ground ? w.foot : y0
  panel(out, f, 0, L, 0, yb, y1, SPANDREL)
  // the parapet band, a little proud, its back face seen from the roof
  slab(out, f, 0, L, -0.3, 0.25, y1 - 0.9, y1 + 1.1, PIER, T.terra, false, true)
  const piers = w.piers
  const bays: [number, number][] = []
  if (piers.length >= 2) for (let k = 0; k + 1 < piers.length; k++) bays.push([piers[k], piers[k + 1]])
  else bays.push([0.4, L - 0.4])
  const pw = 1.0
  // the windows: one a bay a floor
  for (const [a, b] of bays) {
    const u0 = a + (piers.length ? pw / 2 + 0.12 : 0.6)
    const u1 = b - (piers.length ? pw / 2 + 0.12 : 0.6)
    if (u1 - u0 < 0.5) continue
    const inDoor = w.door && b > w.door[0] && a < w.door[1]
    if (w.ground && !inDoor) panel(out, f, u0, u1, 0.03, Y.plinth + 0.3, Y.ground - 1.4, GLASS)
    for (let fl = Y.ground; fl + Y.fh <= y1 - 0.8; fl += Y.fh) {
      if (fl < y0 - 0.1) continue
      panel(out, f, u0, u1, 0.03, fl + 0.95, fl + Y.fh - 0.35, GLASS)
    }
  }
  if (w.ground) slab(out, f, 0, L, -0.2, 0.12, w.foot, Y.plinth, BASE, T.granite)
  // the piers, full height, the corner ones broader; a pointed cap on each fin
  const top = fins ? y1 + Y.fin : y1 + 1.1
  for (let k = 0; k < piers.length; k++) {
    const u = piers[k]
    // over the entrance the piers start on the surround's cornice
    const foot = w.door && u > w.door[0] - 0.6 && u < w.door[1] + 0.6 ? 14.5 : yb
    const end = k === 0 || k === piers.length - 1
    const h = (end ? 1.5 : pw) / 2
    const pr = end ? w.proud + 0.1 : w.proud
    slab(out, f, u - h, u + h, 0, pr, foot, top, PIER, T.terra)
    if (fins) box8(out, [P(f, u - h, 0, top), P(f, u + h, 0, top), P(f, u + h, pr, top), P(f, u - h, pr, top),
      P(f, u - 0.08, 0, top + 0.9), P(f, u + 0.08, 0, top + 0.9), P(f, u + 0.08, pr * 0.5, top + 0.9), P(f, u - 0.08, pr * 0.5, top + 0.9)], TRIM, T.terra)
  }
}

/**
 * The monumental entrance on New Montgomery, centred on the front: a tall round arch through the ground storey and
 * the first floor, a moulded terracotta surround ringed with bell bosses, the dark recess, the bronze doors with a
 * gilt transom grille, a short flight from the street.
 */
function entrance(out: MeshBuilder, f: Fr, m: number, foot: number): void {
  const w = 6.2
  const h = 12.2
  // the surround: a raised field, the archivolt, the keystone
  panel(out, f, m - w / 2 - 1.6, m + w / 2 + 1.6, 0.62, Y.plinth, h + 1.6, TRIM, T.terra)
  slab(out, f, m - w / 2 - 1.9, m + w / 2 + 1.9, 0, 0.75, h + 1.6, h + 2.3, TRIM, T.terra)
  arch(out, f, m, 0.66, Y.plinth, w + 1.2, h + 0.6, RELIEF, 10)
  arch(out, f, m, 0.7, Y.plinth, w, h, DOOR, 10)
  // the bells round the archivolt
  const r = w / 2 + 0.6
  const spring = Y.plinth + h - w / 2
  for (let i = 0; i <= 8; i++) {
    const a = Math.PI - (i / 8) * Math.PI
    const c = pt(f, m + Math.cos(a) * (r + 0.35), 0.75)
    const y = spring + Math.sin(a) * (r + 0.35)
    prism(out, c.x, c.z, y - 0.35, y + 0.3, 0.32, 5, GILT, FIXED, 0.1)
  }
  // the gilt grille over the doors, the doors' frame
  panel(out, f, m - w / 2 + 0.3, m + w / 2 - 0.3, 0.74, Y.plinth + 4.6, spring, GILT)
  for (const k of [-1, 0, 1]) panel(out, f, m + k * 1.3 - 0.06, m + k * 1.3 + 0.06, 0.75, Y.plinth + 4.6, spring, DOOR)
  panel(out, f, m - w / 2 + 0.3, m + w / 2 - 0.3, 0.76, Y.plinth + 4.35, Y.plinth + 4.6, TRIM)
  // the steps up from the pavement
  if (foot < Y.plinth - 0.2) stair(out, pt(f, m - w / 2, 0.8), pt(f, m + w / 2, 0.8), foot, Y.plinth, { anchor: 'top', riser: 0.15, run: 1.6, colour: BASE, material: 'granite' })
  else slab(out, f, m - w / 2, m + w / 2, 0.6, 1.4, foot, Y.plinth, BASE, T.granite)
}

/**
 * An eagle on a setback corner, 4 m tall (drawn 5), facing out along (fx, fz): a plinth, the upright body, the head and
 * hooked beak, the wings half raised either side so their tips stand over the head — the silhouette the photos
 * show against the sky.
 */
function eagle(out: MeshBuilder, x: number, z: number, y: number, fx: number, fz: number): void {
  const rx = fz
  const rz = -fx
  // drawn a quarter over life size: at 115 m a true 4 m bird is lost among the fins
  const k = 1.25
  const E = (a: number, b: number, h: number): V3 => [x + (rx * a + fx * b) * k, y + h * k, z + (rz * a + fz * b) * k]
  const blk = (a0: number, a1: number, b0: number, b1: number, h0: number, h1: number, s = 1, db = 0): V3[] => {
    const am = (a0 + a1) / 2
    const bm = (b0 + b1) / 2
    const A = (a: number) => am + (a - am) * s
    const B = (b: number) => bm + db + (b - bm) * s
    return [E(a0, b0, h0), E(a1, b0, h0), E(a1, b1, h0), E(a0, b1, h0), E(A(a0), B(b0), h1), E(A(a1), B(b0), h1), E(A(a1), B(b1), h1), E(A(a0), B(b1), h1)]
  }
  box8(out, blk(-0.8, 0.8, -0.8, 0.8, 0, 0.55), PIER, T.terra)
  box8(out, blk(-0.6, 0.6, -0.55, 0.55, 0.55, 2.9, 0.75, 0.15), EAGLE, T.terra)
  box8(out, blk(-0.3, 0.3, 0.0, 0.7, 2.85, 3.45, 0.85), EAGLE, T.terra)
  box8(out, blk(-0.12, 0.12, 0.65, 1.05, 2.95, 3.25, 0.6), GILT)
  for (const s of [-1, 1]) {
    // root along the body's side, the tip up and out over the shoulder
    box8(out, [E(s * 0.45, -0.45, 1.1), E(s * 0.45, 0.25, 1.1), E(s * 1.55, 0.05, 2.2), E(s * 1.55, -0.45, 2.2),
      E(s * 0.45, -0.4, 3.1), E(s * 0.45, 0.15, 3.1), E(s * 1.25, -0.1, 4.05), E(s * 1.25, -0.4, 4.05)], EAGLE, T.terra, true)
  }
}

// ------------------------------------------------------------------------------------------- the building

/** How deep the outline runs behind the front everywhere along it: the setback stages may not overhang the court. */
function depthBehind(ring: P2[], F: Fr): number {
  let D = Infinity
  for (let u = 3; u <= F.L - 3; u += 1) {
    const p = pt(F, u, -0.05)
    let best = Infinity
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i]
      const b = ring[(i + 1) % ring.length]
      // ray p + t * (-n) against segment a-b
      const dx = -F.nx
      const dz = -F.nz
      const ex = b.x - a.x
      const ez = b.z - a.z
      const den = dx * ez - dz * ex
      if (Math.abs(den) < 1e-9) continue
      const t = ((a.x - p.x) * ez - (a.z - p.z) * ex) / den
      const s = ((a.x - p.x) * dz - (a.z - p.z) * dx) / den
      if (t > 0.2 && s >= 0 && s <= 1) best = Math.min(best, t)
    }
    if (best < D) D = best
  }
  return Number.isFinite(D) ? D : 14
}

function pacificTelephone(out: MeshBuilder, fit: Fit): void {
  const raw = fit.ring && fit.ring.length >= 3 ? fit.ring
    : [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  let area = 0
  for (let i = 0; i < raw.length; i++) { const a = raw[i]; const b = raw[(i + 1) % raw.length]; area += a.x * b.z - b.x * a.z }
  const ring = simplifyRing(area >= 0 ? raw : [...raw].reverse(), 0.9)
  const n = ring.length
  // the New Montgomery front: the longest edge
  let fi = 0
  for (let i = 0; i < n; i++) if (frameOf(ring[i], ring[(i + 1) % n]).L > frameOf(ring[fi], ring[(fi + 1) % n]).L) fi = i
  const F = frameOf(ring[fi], ring[(fi + 1) % n])
  const m = F.L / 2
  // the street under the entrance: everything is drawn on it, `drop` metres over the model's base
  const at = pt(F, m, 2)
  const drop = fit.groundAt ? Math.max(0, Math.min(6, fit.groundAt(at.x, at.z))) : (fit.grade ?? 0) > 0 ? Math.min(6, fit.grade ?? 0) : 0
  const v0 = out.positions.length

  // the front's bay, shared by every wall parallel to it so the stages' piers stand on the body's
  const bay = (F.L - 1.2) / Math.max(1, Math.round((F.L - 1.2) / 2.75))
  const door: [number, number] = [m - 5, m + 5]

  // ---- the body: the whole L to the first setback
  for (let i = 0; i < n; i++) {
    const f = frameOf(ring[i], ring[(i + 1) % n])
    const along = Math.abs(f.tx * F.tx + f.tz * F.tz) > 0.95
    const street = i === fi || (Math.abs(f.tx * F.nx + f.tz * F.nz) > 0.95 && f.L > 20)
    const piers = f.L < 4 ? [] : along && i === fi ? pierGrid(f.L, bay) : pierGrid(f.L, street ? 2.75 : 3.2)
    wall(out, f, 0, Y.body, { piers, ground: true, proud: street ? 0.55 : 0.35, door: i === fi ? door : undefined, foot: -drop }, true)
  }
  capPolygon(out, ring, Y.body + 0.1, ROOF, T.metal)
  entrance(out, F, m, 0)

  // ---- the setback stages on the front bar, each a rectangle of the front's own frame (d inward)
  const D = Math.max(8, Math.min(22, depthBehind(ring, F)))
  const snap = (u: number) => 0.6 + Math.round((u - 0.6) / bay) * bay
  const stages = [
    { u0: snap(2.6), u1: snap(F.L - 2.6), d0: 1.8, d1: D - 0.4, y0: Y.body, y1: Y.a },
    { u0: snap(8.3), u1: snap(F.L - 8.3), d0: 3.4, d1: D - 0.4, y0: Y.a, y1: Y.b },
    { u0: snap(F.L / 2 - 9.5), u1: snap(F.L / 2 + 9.5), d0: 4.8, d1: D - 0.4, y0: Y.b, y1: Y.roof },
  ]
  for (const s of stages) {
    const c = [pt(F, s.u0, -s.d0), pt(F, s.u1, -s.d0), pt(F, s.u1, -s.d1), pt(F, s.u0, -s.d1)]
    for (let k = 0; k < 4; k++) {
      const f = frameOf(c[k], c[(k + 1) % 4])
      const piers = k % 2 === 0 ? pierGrid(f.L, bay) : pierGrid(f.L, 2.9)
      wall(out, f, s.y0, s.y1, { piers, ground: false, proud: k === 2 ? 0.3 : 0.5, foot: 0 }, true)
    }
    capPolygon(out, c, s.y1 + 0.1, ROOF, T.metal)
  }
  // the crown's lantern and flagpole, at the middle of the top
  const top = stages[2]
  const cm = pt(F, (top.u0 + top.u1) / 2, -(top.d0 + top.d1) / 2)
  const dm = (top.d1 - top.d0) / 2
  slab(out, F, F.L / 2 - 3, F.L / 2 + 3, -(top.d0 + top.d1) / 2 - Math.min(2.5, dm - 0.8), -(top.d0 + top.d1) / 2 + Math.min(2.5, dm - 0.8), Y.roof, Y.roof + 3.6, PIER, T.terra)
  prism(out, cm.x, cm.z, Y.roof + 3.6, Y.roof + 15, 0.12, 6, [0.85, 0.85, 0.83], T.metal, 0.06)
  prism(out, cm.x, cm.z, Y.roof + 15, Y.roof + 15.3, 0.2, 6, GILT, FIXED, 0.05)

  // ---- the eight eagles: on the corners of the two setback ledges, facing out on the diagonals
  for (const [lo, hi] of [[0, 1], [1, 2]]) {
    const a = stages[lo]
    const b = stages[hi]
    const uL = (a.u0 + b.u0) / 2
    const uR = (a.u1 + b.u1) / 2
    for (const [u, d, su, sd] of [[uL, b.d0 + 0.9, -1, -1], [uR, b.d0 + 0.9, 1, -1], [uL, b.d1 - 1.2, -1, 1], [uR, b.d1 - 1.2, 1, 1]] as const) {
      const p = pt(F, u, -d)
      // out: along -u/+u and toward the front (-d = +o) or the back
      const ox = F.tx * su + F.nx * -sd
      const oz = F.tz * su + F.nz * -sd
      const l = Math.hypot(ox, oz)
      eagle(out, p.x, p.z, a.y1 + 0.1, ox / l, oz / l)
    }
  }

  // everything onto the street datum
  if (drop > 0) for (let k = v0 + 1; k < out.positions.length; k += 3) out.positions[k] += drop
}

export const NEW_MONTGOMERY_140: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /** way/80296766 — 140 New Montgomery, the Pacific Telephone & Telegraph Building (1925). */
  oneFortyNewMontgomery: pacificTelephone,
}
