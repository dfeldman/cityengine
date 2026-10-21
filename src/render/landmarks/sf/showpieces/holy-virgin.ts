/**
 * Holy Virgin Cathedral (Russian Orthodox Cathedral of the Mother of God "Joy of All Who Sorrow"; Oleg Ivanitsky,
 * 1961–65), 6210 Geary Boulevard at 26th Avenue — rebuilt by hand from Mapillary frames (2026-10-21): 360 frames
 * 1035871818428690, 3861090244182672, 607993872190678, 627888800004765, 1309328924090567, 713706683942799, cut by
 * tools/photo.ts. (The one frame on file under p3/refs/ was a street in Hamburg.) It replaces churches-4.ts's
 * `church()` hall with a single brown dome, built before any photograph was found.
 *
 * What the frames show:
 *  - a cream-white stucco hall on the north side of Geary, its FRONT to the south: seven tall bays — three narrow
 *    round-headed bays either side of a broad centre bay — every bay head a free-standing round arch (kokoshnik)
 *    above the roof line, outlined in coral red; the flank bays hold standing SAINTS in mosaic on a teal ground over
 *    a red band; the centre bay projects a little, rises highest, and holds a large gilded three-bar CROSS on a dark
 *    panel over the PORTAL — a red, round-hooded surround with a gold mosaic tympanum over timber doors, up a short
 *    flight of steps; red base course and red caps on the corner piers;
 *  - the sides: the same round-headed bays as narrow strips, and towards the back a broad round gable over a tall
 *    arched window of blue glass; the front few metres of each side plain under a red parapet band;
 *  - FIVE GILDED ONION DOMES in a quincunx: the central one, by far the largest, on a tall two-stage drum — a red base,
 *    a lower stage of small arched windows, a red band, a taller stage of arched windows, a red cornice — over a
 *    raised central block; four small onions on slender arcaded drums at the corners of that block, standing on the
 *    hall roof; Orthodox three-bar crosses, gilded, on all five. There is no bell tower.
 *
 * Heights are measured off the frames (the front's 18.4 m width and the ~4.4 m doors as rulers): bay heads ~14.5 m,
 * the centre arch ~17.3 m, the central drum 16.4–22.7 m, its onion to ~28.5 m and the cross to ~32 m; the corner
 * onions to ~21 m, their crosses ~23 m. The manifest's 12 m (and OSM's 19 m) are not used.
 *
 * The frame: the outline as given, its faces FOUND on it. The entrance bay is the most outward of the edges facing −z
 * (the city's front, toward Geary), and everything is laid out in that edge's frame: `u` along it, `o` out of it
 * (negative into the building), y up from the model's base, the front's grade added.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { capPolygon } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { prism, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { lathe } from '../../column.ts'
import { beam } from '../../kit.ts'
import { stair } from '../../parts.ts'
import { simplifyRing } from '../districts/market-west.ts'

type P2 = { x: number; z: number }
type V3 = [number, number, number]
const FIXED = 0
const T = { stucco: surfaceTag('stucco'), metal: surfaceTag('metal'), granite: surfaceTag('granite') }
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

// the cream stucco in the frames' overcast, the coral-red trim, the gilding
const WALL: Rgb = [0.86, 0.85, 0.82]
const RECESS: Rgb = [0.8, 0.8, 0.77]
const RED: Rgb = [0.7, 0.33, 0.3]
const GOLD: Rgb = [0.86, 0.68, 0.26]
const TEAL: Rgb = [0.5, 0.64, 0.58]
const ROBE: Rgb = [0.78, 0.42, 0.38]
const ROBE2: Rgb = [0.86, 0.72, 0.62]
const SKIN: Rgb = [0.82, 0.66, 0.52]
const GLASS: Rgb = [0.14, 0.15, 0.18]
const BLUE: Rgb = [0.2, 0.28, 0.4]
const DOOR: Rgb = [0.5, 0.34, 0.2]
const TYMPANUM: Rgb = [0.66, 0.52, 0.32]
const PANEL: Rgb = [0.2, 0.3, 0.26]
const ROOF: Rgb = [0.3, 0.34, 0.33]
const STEP: Rgb = [0.6, 0.55, 0.52]

/** Heights over the front's grade, metres. */
const Y = {
  floor: 0.9,       // the portal's floor, at the head of the steps
  base: 0.6,        // the red base course
  eave: 13.6,       // the hall's roof line, where the bay heads spring
  arch: 17.3,       // the centre bay's crown
  block: 16.4,      // the raised central block under the big drum
  // the central drum and onion
  d0: 17.0, d1: 19.0, d2: 19.5, d3: 22.0, d4: 22.7,
  // a corner drum and onion
  c0: 14.3, c1: 17.6, c2: 18.1,
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
const inFr = (f: Fr, p: P2): { u: number; o: number } =>
  ({ u: (p.x - f.ox) * f.tx + (p.z - f.oz) * f.tz, o: (p.x - f.ox) * f.nx + (p.z - f.oz) * f.nz })
const dir = (f: Fr, du: number, dy: number, dn: number): V3 => [f.tx * du + f.nx * dn, dy, f.tz * du + f.nz * dn]
/** the same line seen from behind: `u` runs the other way, `o` points in */
const flip = (f: Fr, u0: number, u1: number, o: number): Fr => frameOf(pt(f, u1, o), pt(f, u0, o))

function slab(out: MeshBuilder, f: Fr, u0: number, u1: number, o0: number, o1: number, y0: number, y1: number, c: Rgb, tag = FIXED, bottom = false): void {
  const Q = (u: number, o: number, y: number) => P(f, u, o, y)
  out.quad([Q(u0, o1, y0), Q(u1, o1, y0), Q(u1, o1, y1), Q(u0, o1, y1)], dir(f, 0, 0, 1), UV, c, tag)
  out.quad([Q(u1, o0, y0), Q(u0, o0, y0), Q(u0, o0, y1), Q(u1, o0, y1)], dir(f, 0, 0, -1), UV, c, tag)
  out.quad([Q(u0, o0, y0), Q(u0, o1, y0), Q(u0, o1, y1), Q(u0, o0, y1)], dir(f, -1, 0, 0), UV, c, tag)
  out.quad([Q(u1, o1, y0), Q(u1, o0, y0), Q(u1, o0, y1), Q(u1, o1, y1)], dir(f, 1, 0, 0), UV, c, tag)
  out.quad([Q(u0, o0, y1), Q(u0, o1, y1), Q(u1, o1, y1), Q(u1, o0, y1)], [0, 1, 0], UV, c, tag)
  if (bottom) out.quad([Q(u0, o1, y0), Q(u0, o0, y0), Q(u1, o0, y0), Q(u1, o1, y0)], [0, -1, 0], UV, c, tag)
}

function panel(out: MeshBuilder, f: Fr, u0: number, u1: number, o: number, y0: number, y1: number, c: Rgb, tag = FIXED): void {
  if (u1 - u0 < 0.01 || y1 - y0 < 0.01) return
  out.quad([P(f, u0, o, y0), P(f, u1, o, y0), P(f, u1, o, y1), P(f, u0, o, y1)], dir(f, 0, 0, 1), UV, c, tag)
}

/** A round-headed shape `w` wide, `h` tall from `y0`, centred `u`, facing out at `o`. */
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

/** The ring of an arch between radii `r0` and `r1` round (u, spring), facing out at `o`. */
function archRing(out: MeshBuilder, f: Fr, u: number, spring: number, r0: number, r1: number, o: number, c: Rgb, seg = 8, tag = FIXED): void {
  for (let i = 0; i < seg; i++) {
    const a0 = (i / seg) * Math.PI
    const a1 = ((i + 1) / seg) * Math.PI
    const at = (r: number, a: number): V3 => P(f, u + Math.cos(a) * r, o, spring + Math.sin(a) * r)
    out.quad([at(r0, a0), at(r1, a0), at(r1, a1), at(r0, a1)], dir(f, 0, 0, 1), UV, c, tag)
  }
}

/** A disc round (u, y) facing out at `o`. */
function disc(out: MeshBuilder, f: Fr, u: number, y: number, r: number, o: number, c: Rgb, seg = 8): void {
  for (let i = 0; i < seg; i += 2) {
    const at = (k: number): V3 => { const a = (k / seg) * Math.PI * 2; return P(f, u + Math.cos(a) * r, o, y + Math.sin(a) * r) }
    out.quad([at(i), at(i + 1), at(i + 2), P(f, u, o, y)], dir(f, 0, 0, 1), UV, c, FIXED)
  }
}

/**
 * A KOKOSHNIK: the free-standing round head of a bay over the roof line — a half-disc `r` round (u, spring) from
 * the wall face back `d` into the building: its face, its curved top, and its back for the view over the roof.
 */
function kokoshnik(out: MeshBuilder, f: Fr, u: number, spring: number, r: number, d: number, seg = 6): void {
  arch(out, f, u, 0, spring, 2 * r, r, WALL, seg, T.stucco)
  arch(out, flip(f, u - r, u + r, -d), r, 0, spring, 2 * r, r, WALL, seg, T.stucco)
  for (let i = 0; i < seg; i++) {
    const a0 = (i / seg) * Math.PI
    const a1 = ((i + 1) / seg) * Math.PI
    const am = (a0 + a1) / 2
    const at = (a: number, o: number): V3 => P(f, u + Math.cos(a) * r, o, spring + Math.sin(a) * r)
    out.quad([at(a0, 0), at(a0, -d), at(a1, -d), at(a1, 0)], dir(f, Math.cos(am), Math.sin(am), 0), UV, WALL, T.stucco)
  }
  // the coral-red outline round the head
  archRing(out, f, u, spring, r - 0.2, r - 0.07, 0.03, RED, seg)
}

/** A gilded Orthodox three-bar cross `h` tall from `base`, its bars along `t` (a unit vector in plan). */
function cross(out: MeshBuilder, base: V3, h: number, t: P2): void {
  const [x, y, z] = base
  const at = (s: number, dy: number): V3 => [x + t.x * s, y + dy, z + t.z * s]
  const k = h * 0.045
  beam(out, at(0, 0), at(0, h), k, GOLD)
  beam(out, at(-h * 0.17, h * 0.86), at(h * 0.17, h * 0.86), k * 0.8, GOLD)
  beam(out, at(-h * 0.3, h * 0.68), at(h * 0.3, h * 0.68), k * 0.9, GOLD)
  // the footrest, high at −u (the viewer's left from Geary), as the wall cross on the front
  beam(out, at(-h * 0.2, h * 0.34), at(h * 0.2, h * 0.22), k * 0.8, GOLD)
}

/** An onion `H` tall over a drum of radius `R`: swelling to ~1.17 R, drawn in to a point, a little spike on top. */
function onion(out: MeshBuilder, c: P2, y0: number, R: number, H: number, sides: number): number {
  const prof: [number, number][] = [
    [R * 0.98, 0], [R * 1.1, 0.1], [R * 1.17, 0.22], [R * 1.17, 0.33], [R * 1.08, 0.45], [R * 0.88, 0.57],
    [R * 0.62, 0.69], [R * 0.38, 0.79], [R * 0.2, 0.88], [R * 0.09, 0.95], [R * 0.05, 1],
  ].map(([r, t]) => [r, y0 + t * H] as [number, number])
  lathe(out, c.x, c.z, prof, sides, GOLD, T.metal)
  // the neck's knop and the spike the cross stands on
  prism(out, c.x, c.z, y0 + H, y0 + H + 0.12 * R, R * 0.09, 6, GOLD, T.metal, R * 0.04)
  return y0 + H + 0.12 * R
}

/**
 * A drum ring of `sides` faces from y0 to y1, radius r, with a round-arched window of `w` × `h` from `sill` in every
 * `every`-th face (pilasters between, as the frames show).
 */
function drum(out: MeshBuilder, c: P2, y0: number, y1: number, r: number, sides: number, w: number, sill: number, h: number, every = 1): void {
  prism(out, c.x, c.z, y0, y1, r, sides, WALL, T.stucco, r, false)
  for (let i = 0; i < sides; i += every) {
    const a1 = (i / sides) * Math.PI * 2
    const a0 = ((i + 1) / sides) * Math.PI * 2
    let A = { x: c.x + Math.sin(a0) * r, z: c.z + Math.cos(a0) * r }
    let B = { x: c.x + Math.sin(a1) * r, z: c.z + Math.cos(a1) * r }
    let f = frameOf(A, B)
    const m = pt(f, f.L / 2, 0)
    if ((m.x - c.x) * f.nx + (m.z - c.z) * f.nz < 0) { [A, B] = [B, A]; f = frameOf(A, B) }
    arch(out, f, f.L / 2, 0.03, sill, w, h, GLASS, 4)
  }
}

// ------------------------------------------------------------------------------------------- the walls

/** A run of bays (each `w` wide, centred at `us`) on a wall: recess, red lines, pilasters, and the round heads. */
function bays(out: MeshBuilder, f: Fr, us: number[], w: number, G: number, saints: boolean): void {
  const r = w / 2
  for (const u of us) {
    // the recess, framed in red lines, under the head
    panel(out, f, u - r + 0.16, u + r - 0.16, 0.02, G + Y.base, G + Y.eave, RECESS, T.stucco)
    panel(out, f, u - r + 0.16, u - r + 0.24, 0.035, G + Y.base, G + Y.eave, RED)
    panel(out, f, u + r - 0.24, u + r - 0.16, 0.035, G + Y.base, G + Y.eave, RED)
    if (saints) {
      // a standing saint in mosaic: the teal ground, the red band under it, the robe, the face and its halo
      panel(out, f, u - r + 0.26, u + r - 0.26, 0.04, G + 7.2, G + 8.0, RED)
      arch(out, f, u, 0.04, G + 8.0, w - 0.52, Y.eave + r - 0.35 - 8.0, TEAL, 6)
      const rw = Math.min(0.5, r - 0.4)
      panel(out, f, u - rw, u + rw, 0.05, G + 8.15, G + 11.4, ROBE)
      panel(out, f, u - rw * 0.45, u + rw * 0.45, 0.055, G + 8.8, G + 11.2, ROBE2)
      panel(out, f, u - rw * 0.75, u + rw * 0.75, 0.05, G + 11.4, G + 11.7, ROBE)
      disc(out, f, u, G + 12.15, 0.42, 0.05, GOLD, 8)
      disc(out, f, u, G + 12.05, 0.22, 0.056, SKIN, 6)
    } else {
      arch(out, f, u, 0.04, G + Y.eave - 3.2, w - 0.6, 3.2 + r - 0.4, RECESS, 4, T.stucco)
    }
    kokoshnik(out, f, u, G + Y.eave, r, 0.45)
  }
  // the pilaster strips between and beside the bays
  for (const u of [...us.map((x) => x - r), us[us.length - 1] + r]) slab(out, f, u - 0.16, u + 0.16, 0, 0.16, G + Y.base, G + Y.eave, WALL, T.stucco)
}

/** A plain stretch of wall: stucco to the eave, the red base course. */
function wall(out: MeshBuilder, f: Fr, G: number, top: number, u0 = 0, u1 = f.L): void {
  panel(out, f, u0, u1, 0, 0, top, WALL, T.stucco)
  slab(out, f, u0 - 0.04, u1 + 0.04, 0, 0.12, 0, G + Y.base, RED, T.stucco)
}

/** Evenly spaced bay centres across u0..u1, each about `w` wide. */
const spaced = (u0: number, u1: number, w: number): { us: number[]; w: number } => {
  const n = Math.max(1, Math.round((u1 - u0) / w))
  const bw = (u1 - u0) / n
  return { us: Array.from({ length: n }, (_, i) => u0 + (i + 0.5) * bw), w: bw }
}

// ------------------------------------------------------------------------------------------- the building

/**
 * Drop the vertices where the outline runs straight on (a turn under `tol` radians): the entrance bay arrives as two
 * near-collinear edges of 3.2 and 2.7 m that simplifyRing keeps, and either alone is too short to read as the bay.
 */
function mergeCollinear(ring: P2[], tol = 0.05): P2[] {
  let r = ring
  for (let changed = true; changed && r.length > 3;) {
    changed = false
    for (let i = 0; i < r.length; i++) {
      const a = r[(i - 1 + r.length) % r.length]
      const b = r[i]
      const c = r[(i + 1) % r.length]
      const t = Math.atan2(c.z - b.z, c.x - b.x) - Math.atan2(b.z - a.z, b.x - a.x)
      if (Math.abs(Math.atan2(Math.sin(t), Math.cos(t))) < tol) { r = r.filter((_, k) => k !== i); changed = true; break }
    }
  }
  return r
}

const area2 = (r: P2[]): number => {
  let s = 0
  for (let i = 0; i < r.length; i++) { const j = (i + 1) % r.length; s += r[i].x * r[j].z - r[j].x * r[i].z }
  return s
}

function holyVirgin(out: MeshBuilder, fit: Fit): void {
  const raw = fit.ring && fit.ring.length >= 3 ? fit.ring
    : [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  const ring0 = area2(raw) >= 0 ? raw : [...raw].reverse()
  const ring = mergeCollinear(simplifyRing(ring0, 0.4))
  const G = fit.grade ?? 0
  const edges = ring.map((a, i) => ({ i, f: frameOf(a, ring[(i + 1) % ring.length]) }))

  // ---- the faces, found on the outline
  const midZ = (f: Fr) => f.oz + f.tz * f.L / 2
  const fronts = edges.filter((e) => e.f.nz < -0.92 && e.f.L > 1.5)
  const portalE = fronts.filter((e) => e.f.L >= 3.5 && e.f.L <= 9).sort((a, b) => midZ(a.f) - midZ(b.f))[0]
    ?? [...fronts].sort((a, b) => b.f.L - a.f.L)[0] ?? edges[0]
  const Fp = portalE.f
  const uc = Fp.L / 2
  let depth = 0
  let uL = Infinity
  let uR = -Infinity
  for (const p of ring) {
    const q = inFr(Fp, p)
    depth = Math.max(depth, -q.o)
    uL = Math.min(uL, q.u)
    uR = Math.max(uR, q.u)
  }
  // the flanks' plane, a little behind the entrance bay
  const flanks = fronts.filter((e) => e !== portalE && e.f.L > 2.5)
  const o0 = flanks.length ? Math.max(...flanks.map((e) => inFr(Fp, { x: e.f.ox, z: e.f.oz }).o)) : 0
  const oc = o0 - (depth + o0) * 0.48          // the crossing, a shade forward of the middle
  const centre = pt(Fp, uc, oc)
  /** how far back from the flanks' plane a point of the outline lies */
  const back = (p: P2): number => o0 - inFr(Fp, p).o

  // ---- the walls, each by what it is
  for (const e of edges) {
    const f = e.f
    if (e === portalE) continue
    if (flanks.includes(e)) {
      // a front flank: a red-capped corner pier at its outer end, three saint bays
      const outerAtStart = inFr(Fp, { x: f.ox, z: f.oz }).u < uc
      const pier = 0.9
      const [b0, b1] = outerAtStart ? [pier, f.L] : [0, f.L - pier]
      const s = spaced(b0, b1, (b1 - b0) / 3)
      wall(out, f, G, G + Y.eave)
      const pu = outerAtStart ? 0 : f.L - pier
      slab(out, f, pu, pu + pier, 0, 0.12, G + Y.base, G + Y.eave + 0.3, WALL, T.stucco)
      slab(out, f, pu - 0.05, pu + pier + 0.05, -0.4, 0.2, G + Y.eave + 0.3, G + Y.eave + 0.75, RED, T.stucco)
      bays(out, f, s.us, s.w, G, true)
      continue
    }
    const along = Math.abs(f.tz * Fp.nz + f.tx * Fp.nx) > 0.92     // running back from the front
    if (along && f.L > 8) {
      // a side: plain under a red band for the front few metres, then bays, the big window gable towards the back
      const ba = back(pt(f, 0, 0))
      const bb = back(pt(f, f.L, 0))
      const uAt = (d: number) => (d - ba) / (bb - ba) * f.L        // where on this edge a given depth falls
      wall(out, f, G, G + Y.eave)
      const plain = [uAt(0.5), uAt(6.0)].sort((a, b) => a - b)
      panel(out, f, Math.max(0, plain[0]), Math.min(f.L, plain[1]), 0.03, G + Y.eave - 0.7, G + Y.eave, RED)
      slab(out, f, Math.max(0, plain[0]), Math.min(f.L, plain[1]), -0.3, 0.1, G + Y.eave, G + Y.eave + 0.5, WALL, T.stucco)
      panel(out, f, Math.max(0, plain[0]), Math.min(f.L, plain[1]), 0.105, G + Y.eave + 0.3, G + Y.eave + 0.5, RED)
      const gd = depth + o0 - 5.6                                   // the gable's centre, back from the front
      const gu = uAt(gd)
      const gw = 5.0
      const r = gw / 2
      // the gable: wall face, red surround, the tall arched window of blue glass, the round head over the roof
      archRing(out, f, gu, G + Y.eave + 0.3, r - 0.35, r - 0.12, 0.05, RED, 10)
      panel(out, f, gu - r + 0.12, gu - r + 0.35, 0.05, G + Y.base, G + Y.eave + 0.3, RED)
      panel(out, f, gu + r - 0.35, gu + r - 0.12, 0.05, G + Y.base, G + Y.eave + 0.3, RED)
      arch(out, f, gu, 0.04, G + 3.6, 2.0, 10.4, WALL, 8)
      arch(out, f, gu, 0.06, G + 3.8, 1.6, 10.0, BLUE, 8)
      panel(out, f, gu - 0.04, gu + 0.04, 0.07, G + 3.8, G + 13.0, WALL)
      kokoshnik(out, f, gu, G + Y.eave + 0.3, r, 0.5, 10)
      panel(out, f, gu - r, gu + r, 0, G + Y.eave, G + Y.eave + 0.3, WALL, T.stucco)
      panel(out, flip(f, gu - r, gu + r, -0.5), 0, gw, 0, G + Y.eave, G + Y.eave + 0.3, WALL, T.stucco)
      // narrow strip bays between the plain front part and the gable, and behind it
      const ranges: [number, number][] = plain[1] < gu ? [[plain[1], gu - r], [gu + r, f.L]] : [[0, gu - r], [gu + r, plain[0]]]
      for (const [a, b] of ranges) {
        const s0 = Math.max(0, a) + 0.2
        const s1 = Math.min(f.L, b) - 0.2
        if (s1 - s0 > 1.2) { const s = spaced(s0, s1, 1.7); bays(out, f, s.us, s.w, G, false) }
      }
      continue
    }
    const isRear = f.nx * Fp.nx + f.nz * Fp.nz < -0.92
    if (isRear && f.L > 4) {
      wall(out, f, G, G + Y.eave)
      const s = spaced(0.4, f.L - 0.4, 1.9)
      bays(out, f, s.us, s.w, G, false)
      continue
    }
    // the short returns: the entrance bay's sides rise to its arch's springing, the rest to the eave
    const nearPortal = Math.min(...[pt(f, 0, 0), pt(f, f.L, 0)].map((p) => Math.abs(inFr(Fp, p).o))) < 0.3
      && Math.abs(inFr(Fp, pt(f, f.L / 2, 0)).u - uc) < uc + 0.5
    wall(out, f, G, nearPortal ? G + Y.arch - uc : G + Y.eave)
  }

  // ---- the entrance bay: the great round-headed face, the cross, the portal and its steps
  {
    const f = Fp
    const r = uc
    const sp = G + Y.arch - r
    panel(out, f, 0, f.L, 0, 0, sp, WALL, T.stucco)
    slab(out, f, -0.04, f.L + 0.04, 0, 0.12, 0, G + Y.base, RED, T.stucco)
    kokoshnik(out, f, uc, sp, r, 1.2, 12)
    panel(out, flip(f, 0, f.L, -1.2), 0, f.L, 0, G + Y.eave, sp, WALL, T.stucco)
    // the red archivolt down both sides and round the head
    archRing(out, f, uc, sp, r - 0.62, r - 0.32, 0.05, RED, 12)
    panel(out, f, 0.32, 0.62, 0.05, G + Y.base, sp, RED)
    panel(out, f, f.L - 0.62, f.L - 0.32, 0.05, G + Y.base, sp, RED)
    // the gilded three-bar cross on its dark panel
    const cy = G + 10.2
    panel(out, f, uc - 0.95, uc + 0.95, 0.04, cy - 0.2, cy + 4.1, PANEL)
    const g = (u0: number, u1: number, y0: number, y1: number) => panel(out, f, uc + u0, uc + u1, 0.07, cy + y0, cy + y1, GOLD)
    g(-0.17, 0.17, 0, 3.9)
    g(-0.4, 0.4, 3.35, 3.55)
    g(-0.8, 0.8, 2.6, 2.85)
    out.quad([P(f, uc - 0.55, 0.07, cy + 1.02), P(f, uc + 0.55, 0.07, cy + 0.62), P(f, uc + 0.55, 0.07, cy + 0.82), P(f, uc - 0.55, 0.07, cy + 1.22)],
      dir(f, 0, 0, 1), UV, GOLD, FIXED)
    // the portal: the red round-hooded surround, the gold mosaic tympanum, the frieze, the timber doors
    const fl = G + Y.floor
    arch(out, f, uc, 0.06, fl, 4.0, 8.1, RED, 10)
    arch(out, f, uc, 0.08, fl + 4.7, 3.3, 2.95, TYMPANUM, 10)
    panel(out, f, uc - 1.65, uc + 1.65, 0.085, fl + 4.35, fl + 4.65, GOLD)
    panel(out, f, uc - 1.4, uc + 1.4, 0.08, fl, fl + 4.35, DOOR)
    panel(out, f, uc - 0.03, uc + 0.03, 0.09, fl, fl + 4.35, [0.32, 0.22, 0.13])
    // the ogee point of the hood
    out.quad([P(f, uc - 0.5, 0.065, fl + 7.85), P(f, uc + 0.5, 0.065, fl + 7.85), P(f, uc, 0.065, fl + 8.6), P(f, uc, 0.065, fl + 8.6)], dir(f, 0, 0, 1), UV, RED, FIXED)
    // the steps, a little wider than the bay, down to the pavement
    stair(out, pt(f, -0.9, 0), pt(f, f.L + 0.9, 0), G, G + Y.floor, { anchor: 'top', riser: 0.15, colour: STEP, material: 'granite' })
    // the porch floor in front of the doors
    out.quad([P(f, -0.9, 0.01, fl), P(f, f.L + 0.9, 0.01, fl), P(f, f.L + 0.9, -0.01, fl), P(f, -0.9, -0.01, fl)], [0, 1, 0], UV, STEP, T.granite)
  }

  // ---- the hall roof, the raised central block
  capPolygon(out, ring, G + Y.eave, ROOF, T.metal)
  const hb = 3.8
  {
    const fb = frameOf(pt(Fp, uc - hb, oc + hb), pt(Fp, uc + hb, oc + hb))
    slab(out, fb, 0, 2 * hb, -2 * hb, 0, G + Y.eave, G + Y.block - 0.6, WALL, T.stucco)
    slab(out, fb, -0.05, 2 * hb + 0.05, -2 * hb - 0.05, 0.05, G + Y.block - 0.6, G + Y.block, RED, T.stucco)
  }

  // ---- the central drum and onion
  prism(out, centre.x, centre.z, G + Y.block, G + Y.d0, hb - 0.2, 8, RED, T.stucco)
  drum(out, centre, G + Y.d0, G + Y.d1, 3.3, 16, 0.55, G + Y.d0 + 0.45, 1.25, 2)
  prism(out, centre.x, centre.z, G + Y.d1, G + Y.d2, 3.42, 16, RED, T.stucco)
  drum(out, centre, G + Y.d2, G + Y.d3, 2.85, 16, 0.62, G + Y.d2 + 0.4, 1.75, 1)
  prism(out, centre.x, centre.z, G + Y.d3, G + Y.d3 + 0.45, 3.02, 16, RED, T.stucco)
  prism(out, centre.x, centre.z, G + Y.d3 + 0.45, G + Y.d4, 2.95, 16, WALL, T.stucco)
  const t = { x: Fp.tx, z: Fp.tz }
  const tip = onion(out, centre, G + Y.d4, 2.9, 5.5, 18)
  cross(out, [centre.x, tip, centre.z], 3.2, t)

  // ---- the four corner onions on their arcaded drums, on the hall roof round the central block
  for (const [su, so] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const c = pt(Fp, uc + su * 5.0, oc + so * 5.0)
    prism(out, c.x, c.z, G + Y.eave, G + Y.c0, 1.32, 10, RED, T.stucco)
    drum(out, c, G + Y.c0, G + Y.c1, 1.12, 10, 0.4, G + Y.c0 + 0.6, 1.9, 2)
    prism(out, c.x, c.z, G + Y.c1, G + Y.c2, 1.24, 10, RED, T.stucco)
    const ct = onion(out, c, G + Y.c2, 1.18, 2.7, 12)
    cross(out, [c.x, ct, c.z], 1.9, t)
  }
}

export const HOLY_VIRGIN: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /** Holy Virgin Cathedral (way/286435447), Geary at 26th Avenue: the five gilded onions in a quincunx, the
   *  scalloped front of saint mosaics round the great arch, its gold cross and the portal up its steps. */
  holyVirginCathedral: holyVirgin,
}
