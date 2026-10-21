/**
 * The two concert halls south of Civic Center Plaza, rebuilt to City Hall's standard from photographs: the Bill
 * Graham Civic Auditorium on Grove between Polk and Larkin, and Davies Symphony Hall on the Van Ness/Grove corner.
 *
 * Both are drawn from their real OSM outlines and find their own fronts on them, so they come out right whichever
 * edge the city or the showcase happened to turn to −z:
 * - the Auditorium's Grove front is the long side with the two shallow PAVILIONS standing 2.5 m forward of it
 *   (the Hayes side is flat but for a corner notch);
 * - Davies's curved glass front is the longest run of medium edges turning steadily the same way.
 */
import { capPolygon, MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { box, prism, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { pediment, placed, roof } from '../../kit.ts'
import { classicalColumn } from '../../column.ts'
import { faceBand } from '../../tower.ts'

type P2 = { x: number; z: number }
type V3 = [number, number, number]
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
const T = {
  granite: surfaceTag('granite'), stucco: surfaceTag('stucco'), concrete: surfaceTag('concrete'), glass: surfaceTag('glass'),
  metal: surfaceTag('metal'),
}

// ------------------------------------------------------------------------------------------------- shared helpers

/** The footprint, anticlockwise, with OSM's near-duplicate points dropped; the fitted box where there is none. */
function outline(fit: Fit): P2[] {
  const src = fit.ring && fit.ring.length >= 3 ? fit.ring
    : [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  const r: P2[] = []
  for (const p of src) {
    const l = r[r.length - 1]
    if (!l || Math.hypot(p.x - l.x, p.z - l.z) > 0.3) r.push(p)
  }
  if (r.length > 3 && Math.hypot(r[0].x - r[r.length - 1].x, r[0].z - r[r.length - 1].z) < 0.3) r.pop()
  let a = 0
  for (let i = 0; i < r.length; i++) { const p = r[i]; const q = r[(i + 1) % r.length]; a += p.x * q.z - q.x * p.z }
  return a >= 0 ? r : r.reverse()
}

interface Edge { a: P2; b: P2; tx: number; tz: number; nx: number; nz: number; L: number }
function edgeOf(ring: P2[], i: number): Edge {
  const a = ring[i]
  const b = ring[(i + 1) % ring.length]
  const L = Math.hypot(b.x - a.x, b.z - a.z) || 1
  const tx = (b.x - a.x) / L
  const tz = (b.z - a.z) / L
  return { a, b, tx, tz, nx: tz, nz: -tx, L }
}
/** a point u along an edge and o out from it */
const on = (e: Edge, u: number, o: number): P2 => ({ x: e.a.x + e.tx * u + e.nx * o, z: e.a.z + e.tz * u + e.nz * o })

/** A flat rectangle on an edge's face, u0..u1 along it, o out from it. */
function face(out: MeshBuilder, e: Edge, u0: number, u1: number, y0: number, y1: number, o: number, c: Rgb, tag = 0): void {
  const p = on(e, u0, o)
  const q = on(e, u1, o)
  out.quad([[p.x, y0, p.z], [q.x, y0, q.z], [q.x, y1, q.z], [p.x, y1, p.z]], [e.nx, 0, e.nz], UV, c, tag)
}

/** A block standing proud of an edge, o0..o1 out from it: front, top, bottom and both ends (no back). */
function slab(out: MeshBuilder, e: Edge, u0: number, u1: number, o0: number, o1: number, y0: number, y1: number, c: Rgb, tag = 0): void {
  face(out, e, u0, u1, y0, y1, o1, c, tag)
  const A = on(e, u0, o0); const B = on(e, u1, o0); const C = on(e, u1, o1); const D = on(e, u0, o1)
  out.quad([[A.x, y1, A.z], [B.x, y1, B.z], [C.x, y1, C.z], [D.x, y1, D.z]], [0, 1, 0], UV, c, tag)
  out.quad([[A.x, y0, A.z], [B.x, y0, B.z], [C.x, y0, C.z], [D.x, y0, D.z]], [0, -1, 0], UV, c, tag)
  out.quad([[A.x, y0, A.z], [D.x, y0, D.z], [D.x, y1, D.z], [A.x, y1, A.z]], [-e.tx, 0, -e.tz], UV, c, tag)
  out.quad([[B.x, y0, B.z], [C.x, y0, C.z], [C.x, y1, C.z], [B.x, y1, B.z]], [e.tx, 0, e.tz], UV, c, tag)
}

/** An axis box from its extents. */
const blk = (out: MeshBuilder, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, c: Rgb, tag = 0): void =>
  box(out, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, (x1 - x0) / 2, (y1 - y0) / 2, (z1 - z0) / 2, c, tag)

/** A rectangle facing −z at plane z. */
function fq(out: MeshBuilder, x0: number, x1: number, y0: number, y1: number, z: number, c: Rgb, tag = 0): void {
  out.quad([[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]], [0, 0, -1], UV, c, tag)
}

/** A flat disc facing −z: the wreathed roundels of the Auditorium's attic. */
function roundel(out: MeshBuilder, x: number, y: number, z: number, r: number, c: Rgb, n = 8): void {
  for (let i = 0; i < n; i += 2) {
    const p = (k: number): V3 => [x + Math.cos((k / n) * Math.PI * 2) * r, y + Math.sin((k / n) * Math.PI * 2) * r, z]
    out.quad([[x, y, z], p(i), p(i + 1), p(i + 2)], [0, 0, -1], UV, c, 0)
  }
}

/** A semi-annulus facing −z: an arch's voussoirs, or (rIn 0) the glazed half-disc of its head. */
function archBand(out: MeshBuilder, cx: number, spring: number, rIn: number, rOut: number, z: number, c: Rgb, tag = 0, n = 10): void {
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI
    const a1 = ((i + 1) / n) * Math.PI
    const P = (a: number, r: number): V3 => [cx + Math.cos(a) * r, spring + Math.sin(a) * r, z]
    out.quad([P(a0, rIn), P(a0, rOut), P(a1, rOut), P(a1, rIn)], [0, 0, -1], UV, c, tag)
  }
}

// ------------------------------------------------------------------------------------- Bill Graham Civic Auditorium

const GRANITE: Rgb = [0.77, 0.765, 0.74]
const GRANITE_DK: Rgb = [0.66, 0.655, 0.63]
const GRANITE_LT: Rgb = [0.83, 0.825, 0.8]
const JOINT: Rgb = [0.55, 0.55, 0.53]
const BUFF: Rgb = [0.76, 0.68, 0.56]
const BUFF_DK: Rgb = [0.44, 0.4, 0.34]
const BASE_GREY: Rgb = [0.52, 0.53, 0.54]
const WIN: Rgb = [0.2, 0.22, 0.25]
const MULLION: Rgb = [0.5, 0.52, 0.53]
const ROOF: Rgb = [0.46, 0.47, 0.47]
const DECK: Rgb = [0.5, 0.5, 0.49]
const CANOPY: Rgb = [0.3, 0.3, 0.31]

/**
 * The outward normal of the Grove front: of the two long sides (square to the longest edge), the one with points
 * standing 1.5–4 m beyond its own main wall line — the two pavilions. A tie (a fitted box, a convex hull) goes to the
 * side facing −z, which is the city's front.
 */
function groveNormal(ring: P2[]): P2 {
  let best = edgeOf(ring, 0)
  for (let i = 1; i < ring.length; i++) { const e = edgeOf(ring, i); if (e.L > best.L) best = e }
  const cands: P2[] = [{ x: best.nx, z: best.nz }, { x: -best.nx, z: -best.nz }]
  const score = (n: P2): number => {
    const vs = ring.map((p) => p.x * n.x + p.z * n.z)
    const ext = Math.max(...vs)
    const near = vs.filter((v) => v > ext - 5).sort((a, b) => a - b)
    const med = near[Math.floor(near.length / 2)]
    return vs.filter((v) => v - med > 1.5 && v - med < 4).length
  }
  const s = cands.map(score)
  if (s[0] !== s[1]) return s[0] > s[1] ? cands[0] : cands[1]
  return cands[0].z < cands[1].z ? cands[0] : cands[1]
}

/** A segmental hood over a window: a flat arc of stone `w` either side, rising `rise` from y0, `d` deep, facing −z. */
function segmentalHood(out: MeshBuilder, w: number, y0: number, rise: number, d: number, c: Rgb): void {
  const n = 6
  const R = (w * w + rise * rise) / (2 * rise)
  const cy = y0 + rise - R
  const a0 = Math.asin(w / R)
  const P = (k: number): [number, number] => { const a = -a0 + (2 * a0 * k) / n; return [Math.sin(a) * R, cy + Math.cos(a) * R] }
  for (let k = 0; k < n; k++) {
    const [x0, y0a] = P(k)
    const [x1, y1a] = P(k + 1)
    out.quad([[x0, y0, -d], [x1, y0, -d], [x1, y1a, -d], [x0, y0a, -d]], [0, 0, -1], UV, c, 0)
    const nx = (x0 + x1) / 2 / R
    out.quad([[x0, y0a, -d], [x1, y1a, -d], [x1, y1a, 0], [x0, y0a, 0]], [nx, Math.sqrt(Math.max(0, 1 - nx * nx)), 0], UV, c, 0)
  }
}

/**
 * One bay of the granite front, drawn at the origin on a wall at z = 0 facing −z: a rusticated ground-storey
 * window (or an arched door), the piano nobile's tall window under a pediment on a balconette, and the small square
 * window of the storey above.
 */
function bayTemplate(door: boolean, hood: 'tri' | 'seg' = 'tri'): MeshBuilder {
  const q = new MeshBuilder()
  if (door) {
    fq(q, -1.75, 1.75, 0.6, 4.6, -0.1, GRANITE_LT)
    fq(q, -1.3, 1.3, 0.6, 3.9, -0.14, WIN, T.glass)
    archBand(q, 0, 3.9, 0, 1.3, -0.14, WIN, T.glass, 6)
    archBand(q, 0, 3.9, 1.3, 1.85, -0.12, GRANITE_LT, 0, 6)
  } else {
    fq(q, -1.1, 1.1, 1.3, 4.3, -0.1, GRANITE_LT)
    fq(q, -0.85, 0.85, 1.5, 4.1, -0.14, WIN, T.glass)
  }
  // the piano nobile: a moulded surround, the window, its cornice and pediment, the balconette on two consoles
  fq(q, -1.35, 1.35, 8.4, 13.0, -0.1, GRANITE_LT)
  fq(q, -1.0, 1.0, 8.6, 12.7, -0.14, WIN, T.glass)
  blk(q, -1.6, 1.6, 13.0, 13.3, -0.45, 0, GRANITE_LT)
  if (hood === 'tri') pediment(q, -1.6, 1.6, -0.45, 13.3, 0.85, 0.45, GRANITE_LT)
  else segmentalHood(q, 1.6, 13.3, 0.6, 0.45, GRANITE_LT)
  blk(q, -1.6, 1.6, 8.0, 8.4, -0.85, 0, GRANITE_LT)
  blk(q, -1.5, 1.5, 8.4, 9.25, -0.8, -0.6, GRANITE_LT)
  for (const s of [-1, 1]) blk(q, s * 1.2 - 0.18, s * 1.2 + 0.18, 7.3, 8.0, -0.6, 0, GRANITE_LT)
  // the attic storey's square window
  fq(q, -0.95, 0.95, 15.4, 17.6, -0.1, GRANITE_LT)
  fq(q, -0.75, 0.75, 15.6, 17.4, -0.14, WIN, T.glass)
  return q
}

/** A ventilation grille of the plain buff walls: a dark lattice in a frame, the Hayes and side elevations' pattern. */
function grille(out: MeshBuilder, e: Edge, u: number, w: number, y0: number, y1: number): void {
  face(out, e, u - w / 2, u + w / 2, y0, y1, 0.05, BUFF_DK, T.stucco)
  const nv = Math.max(2, Math.round(w / 1.6))
  const nh = Math.max(2, Math.round((y1 - y0) / 1.6))
  for (let i = 1; i < nv; i++) {
    const x = u - w / 2 + (w * i) / nv
    face(out, e, x - 0.14, x + 0.14, y0, y1, 0.08, BUFF, T.stucco)
  }
  for (let j = 1; j < nh; j++) {
    const y = y0 + ((y1 - y0) * j) / nh
    face(out, e, u - w / 2, u + w / 2, y - 0.14, y + 0.14, 0.08, BUFF, T.stucco)
  }
}

function billGrahamAuditorium(out: MeshBuilder, fit: Fit): void {
  const src = outline(fit)
  const H = fit.height > 30 && fit.height < 45 ? fit.height : 37
  // the canonical frame: Grove along x, its front facing −z, the block's centre at the origin
  const n = groveNormal(src)
  const w: P2 = { x: -n.x, z: -n.z }
  const u: P2 = { x: w.z, z: -w.x }
  const X0 = src.map((p) => p.x * u.x + p.z * u.z)
  const Z0 = src.map((p) => p.x * w.x + p.z * w.z)
  const xc = (Math.max(...X0) + Math.min(...X0)) / 2
  const zc = (Math.max(...Z0) + Math.min(...Z0)) / 2
  const ring: P2[] = src.map((_, i) => ({ x: X0[i] - xc, z: Z0[i] - zc }))
  const O: P2 = { x: u.x * xc + w.x * zc, z: u.z * xc + w.z * zc }
  const q = new MeshBuilder()

  // the front's lines: the main wall F, the pavilions' Fp, the front's half-length W, the pavilions' spans
  const zMin = Math.min(...ring.map((p) => p.z))
  const zMax = Math.max(...ring.map((p) => p.z))
  const fronts = ring.filter((p) => p.z < zMin + 5).map((p) => p.z).sort((a, b) => a - b)
  const F = fronts[Math.floor(fronts.length / 2)]
  const W = Math.max(...ring.filter((p) => p.z < F + 3).map((p) => Math.abs(p.x)))
  const proud = ring.filter((p) => p.z < F - 1.2)
  const span = (s: number): [number, number] => {
    const xs = proud.filter((p) => p.x * s > 0).map((p) => Math.abs(p.x))
    return xs.length >= 2 ? [Math.min(...xs), Math.max(...xs)] : [W * 0.46, W * 0.67]
  }
  const pavL = span(-1)
  const pavR = span(1)
  const Fp = proud.length ? Math.min(...proud.map((p) => p.z)) : F - 2.5
  const ci = Math.min(pavL[0], pavR[0])            // the centre's half-width, between the pavilions

  const EAVES = 22.8
  const isCentre = (e: Edge): boolean => e.nz < -0.7 && (e.a.z + e.b.z) / 2 < F + 1 && Math.abs((e.a.x + e.b.x) / 2) < ci - 0.5
  const isGranite = (e: Edge): boolean => {
    const mz = (e.a.z + e.b.z) / 2
    return (e.nz < -0.7 && mz < F + 4) || (Math.abs(e.nx) > 0.7 && mz < F + 13 && (e.L > 3 || mz < F + 1))
      || (e.nz < -0.7 && mz < F + 14 && Math.abs((e.a.x + e.b.x) / 2) > W - 4)
  }
  const tmplWin = bayTemplate(false)
  const tmplSide = bayTemplate(false, 'seg')
  const tmplDoor = bayTemplate(true)

  // ---- every wall of the real outline: granite on the front and its returns, buff behind
  for (let i = 0; i < ring.length; i++) {
    const e = edgeOf(ring, i)
    if (e.L < 0.2) continue
    const g = isGranite(e)
    face(q, e, 0, e.L, 0, EAVES, 0, g ? GRANITE : BUFF, g ? T.granite : T.stucco)
    if (g) {
      // the plinth, the rusticated ground storey's joints, the string course, the frieze and the bracketed cornice
      slab(q, e, -0.25, e.L + 0.25, 0, 0.3, 0, 0.7, GRANITE_DK, T.granite)
      for (let y = 1.7; y < 6; y += 1.05) face(q, e, 0, e.L, y, y + 0.09, 0.03, JOINT, T.granite)
      slab(q, e, -0.35, e.L + 0.35, 0, 0.4, 6.0, 6.7, GRANITE_LT, T.granite)
      slab(q, e, -0.25, e.L + 0.25, 0, 0.25, 20.4, 21.9, GRANITE, T.granite)
      slab(q, e, -1.1, e.L + 1.1, 0, 1.1, 21.9, 22.8, GRANITE_LT, T.granite)
      const nb = Math.floor((e.L - 0.4) / 1.7)
      for (let k = 0; k < nb; k++) {
        const uu = (e.L - (nb - 1) * 1.7) / 2 + k * 1.7
        slab(q, e, uu - 0.17, uu + 0.17, 0.25, 0.95, 21.35, 21.9, GRANITE_LT, T.granite)
      }
      if (isCentre(e)) continue
      // the bays of the wings and the returns: pilasters between, a window aedicule in each
      if (e.L > 5) {
        const pav = e.nz < -0.7 && (e.a.z + e.b.z) / 2 < F - 1
        const bays = pav ? 1 : Math.max(1, Math.round(e.L / 6.6))
        const bw = e.L / bays
        for (let k = 0; k <= bays; k++) {
          const uu = Math.min(e.L - 0.7, Math.max(0.7, k * bw))
          slab(q, e, uu - (pav ? 0.75 : 0.5), uu + (pav ? 0.75 : 0.5), 0, 0.3, 6.7, 20.4, GRANITE, T.granite)
        }
        for (let k = 0; k < bays; k++) {
          const c = on(e, (k + 0.5) * bw, 0)
          placed(q, pav ? tmplDoor : Math.abs(e.nx) > 0.7 ? tmplSide : tmplWin, Math.atan2(-e.nx, -e.nz), c.x, c.z)
        }
      }
    } else {
      // the buff elevations: a grey base, and the big ventilation grilles in two rows
      face(q, e, 0, e.L, 0, 2.4, 0.04, BASE_GREY, T.concrete)
      slab(q, e, -0.2, e.L + 0.2, 0, 0.35, EAVES - 0.6, EAVES, BUFF, T.stucco)
      if (e.L > 7.5) {
        const k = Math.floor(e.L / 9)
        const pitch = e.L / Math.max(1, k)
        for (let j = 0; j < Math.max(1, k); j++) {
          const uu = (j + 0.5) * pitch
          const gw = Math.min(6.4, pitch - 2)
          grille(q, e, uu, gw, 3.4, 7.6)
          grille(q, e, uu, gw, 9.6, 19.4)
        }
      }
    }
  }
  capPolygon(q, ring, EAVES, DECK, T.concrete)

  // ---- the centre: three great arches between paired giant columns, the canopy, the attic with its roundels
  const pitch = (2 * ci) / 3.6
  const aw = pitch * 0.47
  const crown = 17.2
  const spring = crown - aw / 2
  for (const k of [-1, 0, 1]) {
    const cx = k * pitch
    // the glazed arch: dark glass, its grid of mullions, the voussoirs and keystone round it
    fq(q, cx - aw / 2, cx + aw / 2, 6.7, spring, F - 0.05, WIN, T.glass)
    archBand(q, cx, spring, 0, aw / 2, F - 0.05, WIN, T.glass)
    archBand(q, cx, spring, aw / 2, aw / 2 + 0.75, F - 0.12, GRANITE_LT, T.granite)
    for (const s of [-1, 1]) fq(q, cx + s * aw / 2 - (s > 0 ? 0 : 0.75), cx + s * aw / 2 + (s > 0 ? 0.75 : 0), 6.7, spring, F - 0.12, GRANITE_LT, T.granite)
    blk(q, cx - 0.5, cx + 0.5, crown - 0.3, crown + 1.2, F - 0.4, F, GRANITE_LT, T.granite)
    for (const f of [-0.3, -0.1, 0.1, 0.3]) {
      const x = cx + f * aw
      const top = spring + Math.sqrt(Math.max(0, (aw / 2) ** 2 - (x - cx) ** 2))
      fq(q, x - 0.09, x + 0.09, 6.7, top, F - 0.08, MULLION)
    }
    for (const y of [9.4, 12.0, spring, spring + aw * 0.3]) {
      const half = y <= spring ? aw / 2 : Math.sqrt(Math.max(0, (aw / 2) ** 2 - (y - spring) ** 2))
      fq(q, cx - half, cx + half, y - 0.09, y + 0.09, F - 0.08, MULLION)
    }
    // the ground storey under it: three doors behind the canopy
    for (const d of [-2.4, 0, 2.4]) fq(q, cx + d - 0.9, cx + d + 0.9, 0.7, 3.9, F - 0.05, WIN, T.glass)
  }
  // the four pairs of giant columns between and beside the arches, each pair on its pier
  for (const k of [-1.5, -0.5, 0.5, 1.5]) {
    const cx = k * pitch
    blk(q, cx - 2.0, cx + 2.0, 6.7, 20.4, F - 0.2, F, GRANITE, T.granite)
    blk(q, cx - 2.1, cx + 2.1, 6.0, 7.3, F - 0.9, F, GRANITE_LT, T.granite)
    for (const s of [-1, 1]) {
      classicalColumn(q, cx + s * 1.1, F - 0.6, 7.3, 20.4, 0.7, GRANITE_LT,
        { order: 'ionic', tier: 'mid', heading: Math.PI, tag: T.granite })
    }
    blk(q, cx - 2.0, cx + 2.0, 0.7, 6.0, F - 0.15, F, GRANITE, T.granite)
  }
  // the inscription panel on the frieze over the arches
  fq(q, -pitch * 1.1, pitch * 1.1, 20.65, 21.7, F - 0.27, GRANITE_DK, T.granite)
  // the flat modern canopy across the three arch bays, and the low steps under it
  blk(q, -ci + 1.2, ci - 1.2, 4.7, 5.1, F - 3.6, F, CANOPY, T.metal)
  blk(q, -ci + 1.2, ci - 1.2, 4.62, 4.7, F - 3.5, F, GRANITE_LT)
  blk(q, -ci + 0.5, ci - 0.5, 0, 0.16, F - 2.4, F, GRANITE_DK, T.granite)
  blk(q, -ci + 0.5, ci - 0.5, 0.16, 0.32, F - 1.4, F, GRANITE_DK, T.granite)
  // the attic over the centre, the wreathed roundels over the column pairs, flagpoles on it
  blk(q, -ci, ci, EAVES, 25.2, F + 0.3, F + 6, GRANITE, T.granite)
  blk(q, -ci - 0.2, ci + 0.2, 25.2, 25.6, F + 0.05, F + 6.2, GRANITE_LT, T.granite)
  const flags: Rgb[] = [[0.75, 0.15, 0.15], [0.15, 0.25, 0.55], [0.85, 0.7, 0.2], [0.2, 0.5, 0.3]]
  for (const [i, k] of [-1.5, -0.5, 0.5, 1.5].entries()) {
    const cx = k * pitch
    roundel(q, cx, 24.0, F + 0.24, 1.0, GRANITE_LT)
    roundel(q, cx, 24.0, F + 0.2, 0.6, GRANITE_DK)
    prism(q, cx, F + 1.5, 25.6, 34.5, 0.08, 6, [0.88, 0.88, 0.86], 0)
    blk(q, cx + 0.1, cx + 1.9, 33.2, 34.3, F + 1.49, F + 1.51, flags[i])
  }
  for (const k of [-1, 0, 1]) blk(q, k * pitch - 2.6, k * pitch + 2.6, 22.9, 24.9, F + 0.22, F + 0.3, GRANITE_DK, T.granite)

  // ---- the pavilions' attics, the cartouche on each, and the sculpture groups on top
  for (const [s, [p0, p1]] of [[-1, pavL], [1, pavR]] as const) {
    const x0 = Math.min(s * p0, s * p1)
    const x1 = Math.max(s * p0, s * p1)
    const xm = (x0 + x1) / 2
    blk(q, x0, x1, EAVES, 26.0, Fp + 0.2, Fp + 9, GRANITE, T.granite)
    blk(q, x0 - 0.25, x1 + 0.25, 26.0, 26.5, Fp, Fp + 9.2, GRANITE_LT, T.granite)
    roundel(q, xm, 24.4, Fp + 0.14, 1.4, GRANITE_LT, 10)
    roundel(q, xm, 24.4, Fp + 0.1, 0.8, GRANITE_DK, 10)
    // the group: a pedestal, a seated figure either side of a standing one
    blk(q, xm - 3, xm + 3, 26.5, 27.3, Fp + 1, Fp + 4, GRANITE, T.granite)
    prism(q, xm, Fp + 2.5, 27.3, 30.6, 0.75, 6, GRANITE_DK, T.granite, 0.45)
    prism(q, xm, Fp + 2.5, 30.6, 31.3, 0.42, 6, GRANITE_DK, T.granite, 0.2)
    for (const d of [-1, 1]) {
      prism(q, xm + d * 1.9, Fp + 2.5, 27.3, 29.0, 0.85, 6, GRANITE_DK, T.granite, 0.5)
      prism(q, xm + d * 1.9, Fp + 2.5, 29.0, 29.6, 0.38, 6, GRANITE_DK, T.granite, 0.15)
    }
    prism(q, xm, Fp + 6, 26.5, 34.5, 0.08, 6, [0.88, 0.88, 0.86], 0)
    blk(q, xm + 0.1, xm + 1.9, 33.2, 34.3, Fp + 5.99, Fp + 6.01, s < 0 ? [0.85, 0.2, 0.5] : [0.2, 0.35, 0.7])
  }

  // ---- the hall behind: a clerestory wall, the broad hip roof, its lantern
  const hz0 = Math.max(F + 12, zMin + 14)
  const hz1 = Math.min(zMax - 8, hz0 + 52)
  const hx = Math.min(30, W * 0.48)
  const R0 = EAVES + 3.4
  blk(q, -hx, hx, EAVES, R0, hz0, hz1, BUFF, T.stucco)
  const rise = H - 3 - R0
  roof(q, -hx - 0.6, hx + 0.6, hz0 - 0.6, hz1 + 0.6, R0, rise, hx * 0.72, (hz1 - hz0) * 0.36, ROOF)
  const lz = (hz0 + hz1) / 2
  const lx = Math.max(4, hx * 0.32)
  const ld = Math.max(4, (hz1 - hz0) * 0.15)
  blk(q, -lx, lx, R0 + rise, H - 0.8, lz - ld, lz + ld, [0.4, 0.41, 0.42], T.metal)
  for (let x = -lx + 1.2; x < lx - 0.6; x += 1.4) fq(q, x - 0.4, x + 0.4, R0 + rise + 0.4, H - 1.2, lz - ld - 0.02, [0.24, 0.25, 0.27])
  roof(q, -lx - 0.4, lx + 0.4, lz - ld - 0.4, lz + ld + 0.4, H - 0.8, 0.8, lx * 0.9, ld * 0.9, ROOF)

  placed(out, q, Math.atan2(w.x, w.z), O.x, O.z)
}

// ------------------------------------------------------------------------------------------- Davies Symphony Hall

const PRECAST: Rgb = [0.79, 0.78, 0.75]
const PRECAST_DK: Rgb = [0.66, 0.66, 0.64]
const D_GLASS: Rgb = [0.19, 0.26, 0.28]
const RAIL: Rgb = [0.45, 0.6, 0.62]
const FIN: Rgb = [0.88, 0.88, 0.86]
const D_ROOF: Rgb = [0.66, 0.63, 0.56]
const D_ROOF2: Rgb = [0.6, 0.57, 0.5]
const BRONZE: Rgb = [0.3, 0.24, 0.16]

/** The longest run of 3.8–18 m edges turning steadily left: the curved glass front. Indices into the ring. */
function curveRun(ring: P2[]): number[] {
  const N = ring.length
  const ok = (i: number): boolean => { const L = edgeOf(ring, i).L; return L >= 3.8 && L <= 18 }
  const turn = (i: number): number => {
    const a = edgeOf(ring, i)
    const b = edgeOf(ring, (i + 1) % N)
    return Math.atan2(a.tx * b.tz - a.tz * b.tx, a.tx * b.tx + a.tz * b.tz)
  }
  let best: number[] = []
  let bestLen = 0
  for (let s = 0; s < N; s++) {
    // a run starts where the edge before it does not continue it
    if (!ok(s)) continue
    const prev = (s - 1 + N) % N
    if (ok(prev) && turn(prev) > 0.03 && turn(prev) < 0.7) continue
    const run = [s]
    let i = s
    while (run.length < N) {
      const t = turn(i)
      const nx = (i + 1) % N
      if (!(t > 0.03 && t < 0.7) || !ok(nx) || nx === s) break
      run.push(nx)
      i = nx
    }
    const len = run.reduce((t, k) => t + edgeOf(ring, k).L, 0)
    if (run.length >= 3 && len > bestLen) { best = run; bestLen = len }
  }
  return best
}

/** Chaikin's corner cutting, keeping the ends, then resampled every `step` metres along its length. */
function smoothCurve(pts: P2[], step: number): P2[] {
  let p = pts
  for (let it = 0; it < 2; it++) {
    const q: P2[] = [p[0]]
    for (let i = 0; i < p.length - 1; i++) {
      const a = p[i]; const b = p[i + 1]
      q.push({ x: a.x * 0.75 + b.x * 0.25, z: a.z * 0.75 + b.z * 0.25 }, { x: a.x * 0.25 + b.x * 0.75, z: a.z * 0.25 + b.z * 0.75 })
    }
    q.push(p[p.length - 1])
    p = q
  }
  const cum = [0]
  for (let i = 1; i < p.length; i++) cum.push(cum[i - 1] + Math.hypot(p[i].x - p[i - 1].x, p[i].z - p[i - 1].z))
  const total = cum[cum.length - 1]
  const n = Math.max(2, Math.round(total / step))
  const out: P2[] = []
  let j = 0
  for (let k = 0; k <= n; k++) {
    const s = (total * k) / n
    while (j < p.length - 2 && cum[j + 1] < s) j++
    const t = (s - cum[j]) / Math.max(1e-6, cum[j + 1] - cum[j])
    out.push({ x: p[j].x + (p[j + 1].x - p[j].x) * t, z: p[j].z + (p[j + 1].z - p[j].z) * t })
  }
  return out
}

/** Small round bumps in the outline (runs of ≥ 3 edges under 3.5 m turning left): their centres and radii. */
function bumps(ring: P2[]): { c: P2; r: number }[] {
  const N = ring.length
  const res: { c: P2; r: number }[] = []
  let i = 0
  const seen = new Set<number>()
  for (; i < N; i++) {
    if (seen.has(i) || edgeOf(ring, i).L >= 3.5) continue
    const run = [i]
    let k = i
    while (run.length < N) {
      const nx = (k + 1) % N
      const a = edgeOf(ring, k); const b = edgeOf(ring, nx)
      const t = Math.atan2(a.tx * b.tz - a.tz * b.tx, a.tx * b.tx + a.tz * b.tz)
      if (b.L >= 3.5 || t < 0.05 || seen.has(nx)) break
      run.push(nx); k = nx
    }
    run.forEach((r) => seen.add(r))
    if (run.length < 3) continue
    const pts = [...run.map((r) => ring[r]), ring[(k + 1) % N]]
    const c = { x: pts.reduce((t, p) => t + p.x, 0) / pts.length, z: pts.reduce((t, p) => t + p.z, 0) / pts.length }
    res.push({ c, r: pts.reduce((t, p) => t + Math.hypot(p.x - c.x, p.z - c.z), 0) / pts.length })
  }
  return res
}

function daviesSymphonyHall(out: MeshBuilder, fit: Fit): void {
  const ring = outline(fit)
  const H = fit.height > 22 && fit.height < 40 ? fit.height : 30
  const N = ring.length
  let run = curveRun(ring)
  let curve: P2[]
  if (run.length) {
    curve = [...run.map((i) => ring[i]), ring[(run[run.length - 1] + 1) % N]]
  } else {
    // a fitted box: the −z side bowed out as the front
    let f = 0
    for (let i = 1; i < N; i++) if (edgeOf(ring, i).nz < edgeOf(ring, f).nz) f = i
    run = [f]
    const e = edgeOf(ring, f)
    curve = [e.a, on(e, e.L * 0.5, 0), e.b]
  }
  const Q = smoothCurve(curve, 2.4)
  const M = Q.length
  // each segment's outward normal and each point's (the two either side averaged)
  const segN = Q.slice(0, -1).map((a, i) => {
    const b = Q[i + 1]
    const L = Math.hypot(b.x - a.x, b.z - a.z) || 1
    return { x: (b.z - a.z) / L, z: -(b.x - a.x) / L }
  })
  const ptN = Q.map((_, i) => {
    const a = segN[Math.max(0, i - 1)]; const b = segN[Math.min(M - 2, i)]
    const l = Math.hypot(a.x + b.x, a.z + b.z) || 1
    return { x: (a.x + b.x) / l, z: (a.z + b.z) / l }
  })
  const off = (i: number, o: number): P2 => ({ x: Q[i].x + ptN[i].x * o, z: Q[i].z + ptN[i].z * o })
  /** a wall following the curve at offset o */
  const band = (o: number, y0: number, y1: number, c: Rgb, tag = 0, i0 = 0, i1 = M - 1): void => {
    for (let i = i0; i < i1; i++) {
      const a = off(i, o); const b = off(i + 1, o)
      out.quad([[a.x, y0, a.z], [b.x, y0, b.z], [b.x, y1, b.z], [a.x, y1, a.z]], [segN[i].x, 0, segN[i].z], UV, c, tag)
    }
  }
  /** a horizontal strip following the curve between offsets o0 and o1, facing up (or down) */
  const ledge = (o0: number, o1: number, y: number, c: Rgb, up = true, tag = 0): void => {
    for (let i = 0; i < M - 1; i++) {
      const a = off(i, o0); const b = off(i + 1, o0); const cc = off(i + 1, o1); const d = off(i, o1)
      out.quad([[a.x, y, a.z], [b.x, y, b.z], [cc.x, y, cc.z], [d.x, y, d.z]], [0, up ? 1 : -1, 0], UV, c, tag)
    }
  }
  /** a slab band: its face at o1, top and soffit back to o0 */
  const slabBand = (o0: number, o1: number, y0: number, y1: number, c: Rgb, tag = 0): void => {
    band(o1, y0, y1, c, tag)
    ledge(o0, o1, y1, c, true, tag)
    ledge(o0, o1, y0, c, false, tag)
  }
  const TOP = H - 2.6          // the coping of the curved front
  const FASCIA0 = TOP - 7.6    // the bottom of the solid precast band

  // ---- the plain walls of the rest of the outline, the roof deck over all of it
  const curveEdges = new Set(run)
  const rest = ring.map((_, i) => i).filter((i) => !curveEdges.has(i))
  faceBand(out, ring, 0, TOP, { kind: 'bands', material: 'concrete', wall: PRECAST, glass: D_GLASS, solid: 0.9, floor: 6.5 }, rest)
  for (const i of rest) {
    const e = edgeOf(ring, i)
    if (e.L < 1) continue
    slab(out, e, -0.2, e.L + 0.2, 0, 0.45, TOP - 0.6, TOP, PRECAST_DK, T.concrete)
  }
  capPolygon(out, ring, TOP - 0.05, [0.55, 0.55, 0.54], T.concrete)

  // ---- the curved front, storey by storey
  slabBand(-0.4, 0.4, 0, 0.8, PRECAST_DK, T.concrete)                 // the plinth
  band(-1.6, 0.8, 7.0, D_GLASS, T.glass)                              // the lobby's glass, set back
  slabBand(-1.6, 2.6, 7.0, 8.0, PRECAST, T.concrete)                  // the first balcony, flying out as the canopy
  band(-1.0, 8.0, 11.0, D_GLASS, T.glass)
  slabBand(-1.0, 0.7, 11.0, 12.1, PRECAST, T.concrete)                // the second balcony
  band(0.66, 12.1, 13.1, RAIL, T.glass)                               // its glass rail
  band(-1.0, 12.1, FASCIA0, D_GLASS, T.glass)
  // the lobby's round columns under the canopy, and the tube along the canopy's edge
  for (let i = 1; i < M - 1; i += 3) {
    const p = off(i, -0.3)
    prism(out, p.x, p.z, 0.8, 7.0, 0.42, 8, PRECAST, T.concrete)
  }
  for (let i = 0; i < M - 1; i++) {
    const a = off(i, 2.6); const b = off(i + 1, 2.6)
    // a round tube is a prism laid along the segment: approximated by the band's own rounded nose
    out.quad([[a.x, 7.0, a.z], [b.x, 7.0, b.z], [b.x + segN[i].x * 0.35, 7.5, b.z + segN[i].z * 0.35], [a.x + ptN[i].x * 0.35, 7.5, a.z + ptN[i].z * 0.35]],
      [segN[i].x, -0.5, segN[i].z], UV, FIN, T.metal)
    out.quad([[a.x + ptN[i].x * 0.35, 7.5, a.z + ptN[i].z * 0.35], [b.x + segN[i].x * 0.35, 7.5, b.z + segN[i].z * 0.35], [b.x, 8.0, b.z], [a.x, 8.0, a.z]],
      [segN[i].x, 0.5, segN[i].z], UV, FIN, T.metal)
  }
  // the white fins of the tall glazed storey, one at every point of the curve
  for (let i = 1; i < M - 1; i++) {
    const t = { x: -ptN[i].z, z: ptN[i].x }
    const P = (s: number, o: number): P2 => ({ x: Q[i].x + t.x * s + ptN[i].x * o, z: Q[i].z + t.z * s + ptN[i].z * o })
    const a = P(-0.14, 0.25); const b = P(0.14, 0.25); const c = P(0.14, -1.0); const d = P(-0.14, -1.0)
    const y0 = 12.1
    const y1 = FASCIA0
    out.quad([[a.x, y0, a.z], [b.x, y0, b.z], [b.x, y1, b.z], [a.x, y1, a.z]], [ptN[i].x, 0, ptN[i].z], UV, FIN, T.concrete)
    out.quad([[b.x, y0, b.z], [c.x, y0, c.z], [c.x, y1, c.z], [b.x, y1, b.z]], [t.x, 0, t.z], UV, FIN, T.concrete)
    out.quad([[d.x, y0, d.z], [a.x, y0, a.z], [a.x, y1, a.z], [d.x, y1, d.z]], [-t.x, 0, -t.z], UV, FIN, T.concrete)
  }
  // the solid precast band, cantilevered out over the glass, its coping, and the slot windows in its middle
  slabBand(-1.0, 1.2, FASCIA0, TOP - 0.6, PRECAST, T.concrete)
  slabBand(-0.2, 1.45, TOP - 0.6, TOP, PRECAST_DK, T.concrete)
  const mid = Math.floor(M / 2)
  const slots = Math.max(1, Math.round(M * 0.13))
  for (let i = mid - slots; i < mid + slots; i++) {
    if (i < 0 || i >= M - 1) continue
    for (const f of [0.25, 0.75]) {
      const a = { x: Q[i].x + (Q[i + 1].x - Q[i].x) * f, z: Q[i].z + (Q[i + 1].z - Q[i].z) * f }
      const nn = segN[i]
      const t = { x: -nn.z, z: nn.x }
      const p = { x: a.x + nn.x * 1.23 - t.x * 0.28, z: a.z + nn.z * 1.23 - t.z * 0.28 }
      const r = { x: a.x + nn.x * 1.23 + t.x * 0.28, z: a.z + nn.z * 1.23 + t.z * 0.28 }
      out.quad([[p.x, FASCIA0 + 2.2, p.z], [r.x, FASCIA0 + 2.2, r.z], [r.x, FASCIA0 + 5.4, r.z], [p.x, FASCIA0 + 5.4, p.z]], [nn.x, 0, nn.z], UV, D_GLASS, T.glass)
    }
  }
  // the name along the top of the band, in the middle: SYMPHONY HALL in metal letters, drawn as their rhythm
  for (let i = Math.max(0, mid - Math.round(slots * 0.8)); i < Math.min(M - 1, mid + Math.round(slots * 0.8)); i++) {
    const a = off(i, 1.23); const b = off(i + 1, 1.23)
    const p = { x: a.x + (b.x - a.x) * 0.2, z: a.z + (b.z - a.z) * 0.2 }
    const r = { x: a.x + (b.x - a.x) * 0.8, z: a.z + (b.z - a.z) * 0.8 }
    out.quad([[p.x, TOP - 1.45, p.z], [r.x, TOP - 1.45, r.z], [r.x, TOP - 0.75, r.z], [p.x, TOP - 0.75, p.z]], [segN[i].x, 0, segN[i].z], UV, [0.5, 0.47, 0.42], T.metal)
  }

  // ---- the roof: a shallow ribbed fan rising from the coping toward the circle the front is drawn on
  const a0 = Q[0]; const am = Q[mid]; const a1 = Q[M - 1]
  const circ = (() => {
    const d = 2 * (a0.x * (am.z - a1.z) + am.x * (a1.z - a0.z) + a1.x * (a0.z - am.z))
    if (Math.abs(d) < 1e-6) return { x: am.x - ptN[mid].x * 30, z: am.z - ptN[mid].z * 30 }
    const s0 = a0.x ** 2 + a0.z ** 2; const sm = am.x ** 2 + am.z ** 2; const s1 = a1.x ** 2 + a1.z ** 2
    return { x: (s0 * (am.z - a1.z) + sm * (a1.z - a0.z) + s1 * (a0.z - am.z)) / d, z: (s0 * (a1.x - am.x) + sm * (a0.x - a1.x) + s1 * (am.x - a0.x)) / d }
  })()
  // the centre may lie outside a gentle curve's footprint: keep it at most 40 m in from the front's middle
  const toC = Math.hypot(circ.x - am.x, circ.z - am.z)
  const C = toC > 40 ? { x: am.x + (circ.x - am.x) * (40 / toC), z: am.z + (circ.z - am.z) * (40 / toC) } : circ
  const RIDGE = H + 3
  const inner = (i: number): P2 => {
    const p = off(i, 1.45)
    return { x: C.x + (p.x - C.x) * 0.3, z: C.z + (p.z - C.z) * 0.3 }
  }
  for (let i = 0; i < M - 1; i++) {
    const a = off(i, 1.45); const b = off(i + 1, 1.45); const c = inner(i + 1); const d = inner(i)
    const c2 = i % 2 ? D_ROOF : D_ROOF2
    out.quad([[a.x, TOP, a.z], [b.x, TOP, b.z], [c.x, RIDGE - 0.6, c.z], [d.x, RIDGE - 0.6, d.z]], [segN[i].x, 2.2, segN[i].z], UV, c2, T.metal)
    out.quad([[d.x, RIDGE - 0.6, d.z], [c.x, RIDGE - 0.6, c.z], [C.x, RIDGE, C.z], [C.x, RIDGE, C.z]], [0, 1, 0], UV, c2, T.metal)
  }
  // the hall's box behind the fan, square to the front's middle, and its low roof
  const m = ptN[mid]
  const hall = new MeshBuilder()
  const toEnd = Math.max(Math.hypot(a0.x - C.x, a0.z - C.z), Math.hypot(a1.x - C.x, a1.z - C.z))
  const hw = Math.min(24, toEnd * 0.5)
  const hd = Math.min(26, toEnd * 0.55)
  blk(hall, -hw, hw, TOP - 0.1, RIDGE + 1.2, -3, hd, PRECAST, T.concrete)
  for (let y = TOP + 1.8; y < RIDGE + 1; y += 2.2) blk(hall, -hw - 0.05, hw + 0.05, y, y + 0.12, -3.05, hd + 0.05, PRECAST_DK, T.concrete)
  roof(hall, -hw - 0.3, hw + 0.3, -3.3, hd + 0.3, RIDGE + 1.2, 2.2, hw * 0.8, hd * 0.4, D_ROOF2)
  placed(out, hall, Math.atan2(-m.x, -m.z), C.x, C.z)

  // ---- the two round balconies at the ends of the curve, each on its drum
  const found = bumps(ring)
  for (const [end, tan] of [[Q[0], { x: Q[0].x - Q[1].x, z: Q[0].z - Q[1].z }], [Q[M - 1], { x: Q[M - 1].x - Q[M - 2].x, z: Q[M - 1].z - Q[M - 2].z }]] as const) {
    const near = found.find((b) => Math.hypot(b.c.x - end.x, b.c.z - end.z) < 14)
    const tl = Math.hypot(tan.x, tan.z) || 1
    const c = near ? near.c : { x: end.x + (tan.x / tl) * 4, z: end.z + (tan.z / tl) * 4 }
    const r = near ? Math.max(2, Math.min(4, near.r)) : 3
    prism(out, c.x, c.z, 14.4, 15.4, r + 1.2, 16, PRECAST, T.concrete, r + 2.8)
    prism(out, c.x, c.z, 15.4, 16.4, r + 2.65, 16, RAIL, T.glass, r + 2.65, false)
  }

  // ---- Henry Moore's Large Four Piece Reclining Figure on the forecourt, in front of the curve's middle
  const sc = { x: am.x + m.x * 5.5, z: am.z + m.z * 5.5 }
  const tg = { x: -m.z, z: m.x }
  box(out, sc.x, 0.25, sc.z, 3.2, 0.25, 3.2, PRECAST_DK, T.concrete)
  for (const [s, h, r] of [[-2.2, 1.3, 1.0], [-0.7, 1.9, 0.8], [0.8, 1.1, 1.1], [2.2, 1.6, 0.7]] as const) {
    const x = sc.x + tg.x * s
    const z = sc.z + tg.z * s
    prism(out, x, z, 0.5, 0.5 + h * 0.6, r, 6, BRONZE, T.metal, r * 0.9)
    prism(out, x, z, 0.5 + h * 0.6, 0.5 + h, r * 0.9, 6, BRONZE, T.metal, r * 0.35)
  }
}

export const AUDITORIUM_SYMPHONY: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /**
   * The Bill Graham Civic Auditorium (1915, John Galen Howard, Frederick Meyer and John Reid Jr.; the Exposition
   * Auditorium of the PPIE), 99 Grove on Civic Center Plaza. From Commons ("Grahamauditorium.jpg", from City Hall;
   * "…from Larkin and Grove St, SF.jpg") and Mapillary (the Hayes/Larkin rear): a grey granite Grove front of
   * three great glazed ARCHES between four pairs of giant Ionic columns, over a rusticated ground storey and a
   * modern flat canopy; a bracketed cornice and an attic with wreathed roundels and flagpoles; a pavilion either
   * side, stepping 2.5 m forward, carrying a sculpture group; wings of pedimented windows on balconettes out to the
   * corners and round them; buff walls with big ventilation grilles behind; and over the hall a broad hipped roof
   * with a louvred lantern. No grand stair: the doors are at the plaza's level, up two low steps.
   */
  billGrahamAuditorium,
  /**
   * Louise M. Davies Symphony Hall (1980, SOM), Van Ness at Grove. From Mapillary (Van Ness and Grove, 2024–25):
   * the curved front round the corner — a precast plinth, the lobby's glass set back behind round columns under a
   * flying canopy, a second balcony with a glass rail, a tall glazed storey of white fins, and the deep precast band
   * over it with a row of slot windows and the name — under a shallow ribbed metal roof fanning back to the hall's
   * box; a round balcony on a drum at each end of the curve; Henry Moore's bronze on the forecourt.
   */
  daviesSymphonyHall,
}
