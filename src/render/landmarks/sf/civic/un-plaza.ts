/**
 * UNITED NATIONS PLAZA: the Federal Office Building on its north side and Halprin's fountain in the plaza, rebuilt to
 * City Hall's standard (owner, 2026-10-21: "only City Hall looks right").
 *
 * 50 UNITED NATIONS PLAZA (Arthur Brown Jr., 1936; OSM relation/19309896). From Mapillary 689226179478633,
 * 1088745106222340, 1484242949430523, 2243050276126604, 4155905354465062 and Commons "Fountain on UN Plaza -
 * panoramio.jpg", with Wikipedia's description: a granite block of six storeys round a closed courtyard, the plaza
 * (south) front between two CONCAVE quarter-round corners —
 *   - a ROCK-FACED BASE of two storeys, channelled in courses, on a darker water table;
 *   - on the plaza front, a LOGGIA: detached two-storey Doric columns standing on the base's edge, a balustrade
 *     between their feet, pilasters on the recessed wall behind, two windows a bay;
 *   - the MAIN ENTRANCE in the middle of the front, three round arches with a shield over the centre one, and a
 *     broad low flight of steps;
 *   - the CORNERS: the concave arcs, each with an arched doorway and a medallion, and a pair of columns in antis
 *     above the base;
 *   - an ENTABLATURE with a row of small fifth-floor windows in its frieze and a deep cornice, all round;
 *   - a SET-BACK ATTIC of small square windows under a balustrade, and a low HIPPED ROOF of light grey
 *     lead-coated copper;
 *   - the street sides (McAllister, Hyde, Leavenworth): the same base, three rows of windows over it (balconettes
 *     on the third floor), pilaster strips at the corners.
 *
 * Built on the real outline (fit.ring). The plaza front is found by its shape, not its direction: the long edge
 * bracketed by the two runs of short facets that are the concave corners. On a bare box (no outline) the −z side.
 */
import { capPolygon, capPolygonWithHoles, type MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { box, strut, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { faceBand, towerRing } from '../../tower.ts'
import { boxAlong, offsetRing, stripRoof } from '../../parts.ts'
import { classicalColumn } from '../../column.ts'
import { simplifyRing } from '../districts/market-west.ts'

type P2 = { x: number; z: number }
type V3 = [number, number, number]
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

interface Edge { a: P2; b: P2; tx: number; tz: number; nx: number; nz: number; L: number; heading: number }
const edgeOf = (a: P2, b: P2): Edge => {
  const L = Math.hypot(b.x - a.x, b.z - a.z) || 1
  const tx = (b.x - a.x) / L
  const tz = (b.z - a.z) / L
  return { a, b, tx, tz, nx: tz, nz: -tx, L, heading: Math.atan2(tz, -tx) }
}
/** a point `u` along an edge and `o` out from it (negative: into the building) */
const at = (e: Edge, u: number, o: number): P2 => ({ x: e.a.x + e.tx * u + e.nx * o, z: e.a.z + e.tz * u + e.nz * o })

/** a vertical rectangle in the plane `o` out from an edge, facing out */
function quadOn(out: MeshBuilder, e: Edge, u0: number, u1: number, y0: number, y1: number, o: number, c: Rgb, tag = 0): void {
  const A = at(e, u0, o)
  const B = at(e, u1, o)
  out.quad([[A.x, y0, A.z], [B.x, y0, B.z], [B.x, y1, B.z], [A.x, y1, A.z]], [e.nx, 0, e.nz], UV, c, tag)
}
/** a block on an edge: along u0..u1, out o0..o1, up y0..y1 */
function blockOn(out: MeshBuilder, e: Edge, u0: number, u1: number, o0: number, o1: number, y0: number, y1: number, c: Rgb, tag = 0): void {
  const m = at(e, (u0 + u1) / 2, (o0 + o1) / 2)
  boxAlong(out, m.x, (y0 + y1) / 2, m.z, Math.abs(u1 - u0) / 2, (y1 - y0) / 2, Math.abs(o1 - o0) / 2, e.heading, c, tag)
}
/** a round-headed opening on an edge's face: the jambs' rectangle and the head as a fan of slices */
function archOn(out: MeshBuilder, e: Edge, u: number, y0: number, w: number, h: number, o: number, c: Rgb, tag = 0): void {
  const spring = y0 + h - w / 2
  quadOn(out, e, u - w / 2, u + w / 2, y0, spring, o, c, tag)
  const n = 6
  for (let i = 0; i < n; i++) {
    const a0 = Math.PI - (i / n) * Math.PI
    const a1 = Math.PI - ((i + 1) / n) * Math.PI
    const p = (a: number): V3 => { const q = at(e, u + Math.cos(a) * w / 2, o); return [q.x, spring + Math.sin(a) * w / 2, q.z] }
    const c0 = at(e, u, o)
    out.quad([[c0.x, spring, c0.z], p(a0), p(a1), [c0.x, spring, c0.z]], [e.nx, 0, e.nz], UV, c, tag)
  }
}

const GRANITE: Rgb = [0.8, 0.79, 0.76]
const RUSTIC: Rgb = [0.75, 0.74, 0.71]
const PLINTH: Rgb = [0.6, 0.6, 0.58]
const LOGGIA: Rgb = [0.56, 0.56, 0.54]       // the recessed wall in the colonnade's shade
const JOINT: Rgb = [0.52, 0.52, 0.5]
const TRIM: Rgb = [0.86, 0.85, 0.82]
const DARK: Rgb = [0.2, 0.22, 0.25]
const DOOR: Rgb = [0.14, 0.15, 0.17]
const LEAD: Rgb = [0.5, 0.53, 0.55]
const BRONZE: Rgb = [0.42, 0.38, 0.28]

// the section, metres: the base, the colonnade storeys, the entablature, the attic, the roof
const BASE = 10.2
const BELT = 10.8
const COL_TOP = 19.6
const FRIEZE_TOP = 22.4
const CORNICE = 23.4
const ATTIC = 27.0
const BAL = 28.0
const RIDGE = 31.2
const BAY = 4.4

/** the plaza front and the concave corners either side of it */
function findFront(ring: P2[]): { front: number; arcs: number[][] } {
  const n = ring.length
  const len = (i: number): number => { const a = ring[(i + n) % n]; const b = ring[(i + 1 + n) % n]; return Math.hypot(b.x - a.x, b.z - a.z) }
  let front = -1
  let best = 0
  for (let i = 0; i < n; i++) {
    if (len(i) > 25 && len(i - 1) < 6 && len(i + 1) < 6 && len(i) > best) { best = len(i); front = i }
  }
  if (front < 0) {
    // a bare box: the side toward −z
    let lo = Infinity
    for (let i = 0; i < n; i++) { const e = edgeOf(ring[i], ring[(i + 1) % n]); if (e.nz < lo) { lo = e.nz; front = i } }
    return { front, arcs: [] }
  }
  // each arc: the run of short facets off either end of the front, as vertex lists from the front outward
  const arcs: number[][] = []
  for (const dir of [-1, 1]) {
    const verts: number[] = [dir < 0 ? front : (front + 1) % n]
    let i = dir < 0 ? front - 1 : front + 1
    for (let k = 0; k < 8 && len(i) < 6; k++) {
      verts.push(dir < 0 ? (i + n) % n : (i + 1 + n) % n)
      i += dir
    }
    if (verts.length >= 3) arcs.push(verts)
  }
  return { front, arcs }
}

export function unPlazaFederal(out: MeshBuilder, fit: Fit): void {
  const T = { granite: surfaceTag('granite'), metal: surfaceTag('metal'), glass: surfaceTag('glass') }
  const raw = towerRing(fit)
  let ring = simplifyRing(raw, 0.35)
  let area = 0
  for (let i = 0; i < ring.length; i++) { const a = ring[i]; const b = ring[(i + 1) % ring.length]; area += a.x * b.z - b.x * a.z }
  if (area < 0) ring = [...ring].reverse()
  const n = ring.length
  const { front, arcs } = findFront(ring)
  const F = edgeOf(ring[front], ring[(front + 1) % n])
  const arcEdge = new Set<number>()
  for (const arc of arcs) for (let k = 0; k < arc.length - 1; k++) {
    const i = arc[k]; const j = arc[k + 1]
    arcEdge.add((j === (i + 1) % n) ? i : j)
  }

  // the loggia: the front's middle, between its two end bays
  const END = Math.min(9.5, F.L * 0.12)
  const DEEP = 2.8                    // how far the wall behind the columns stands back
  const COL_O = -0.7                  // the columns' line, just inside the base's face
  const nCols = Math.max(4, Math.round((F.L - 2 * END) / BAY) + 1)
  const uc0 = END
  const uc1 = F.L - END
  const pitch = (uc1 - uc0) / (nCols - 1)

  // ---------------------------------------------------------------- the walls
  // the water table, the rock-faced base, the belt course
  faceBand(out, offsetRing(ring, 0.12), 0, 0.9, { kind: 'blank', wall: PLINTH, material: 'granite' })
  faceBand(out, ring, 0.9, BASE, { kind: 'blank', wall: RUSTIC, material: 'granite' })
  faceBand(out, offsetRing(ring, 0.22), BASE, BELT, { kind: 'blank', wall: TRIM, material: 'granite' })
  capPolygon(out, offsetRing(ring, 0.22), BELT, TRIM, T.granite)
  // the upper storeys: the ring with the loggia cut back into the front
  const upper: P2[] = []
  for (let i = 0; i < n; i++) {
    upper.push(ring[i])
    if (i === front) upper.push(at(F, uc0, 0), at(F, uc0, -DEEP), at(F, uc1, -DEEP), at(F, uc1, 0))
  }
  faceBand(out, upper, BELT, COL_TOP, { kind: 'blank', wall: GRANITE, material: 'granite' })
  // (the loggia's back wall, in its shade, over the plain one)
  quadOn(out, F, uc0, uc1, BELT, COL_TOP, -DEEP + 0.02, LOGGIA, T.granite)
  // the entablature and its frieze across the whole front again, the cornice standing out over it all round
  faceBand(out, ring, COL_TOP, FRIEZE_TOP, { kind: 'blank', wall: GRANITE, material: 'granite' })
  // the loggia's ceiling: a solid block, so its underside faces down at the street
  blockOn(out, F, uc0, uc1, -DEEP - 0.05, -0.02, COL_TOP, FRIEZE_TOP - 0.05, LOGGIA, T.granite)
  faceBand(out, offsetRing(ring, 0.2), COL_TOP, COL_TOP + 0.7, { kind: 'blank', wall: TRIM, material: 'granite' })   // the architrave
  faceBand(out, offsetRing(ring, 0.9), FRIEZE_TOP + 0.35, CORNICE, { kind: 'blank', wall: TRIM, material: 'granite' })
  faceBand(out, offsetRing(ring, 0.45), FRIEZE_TOP, FRIEZE_TOP + 0.35, { kind: 'blank', wall: GRANITE, material: 'granite' })
  capPolygon(out, offsetRing(ring, 0.9), CORNICE, GRANITE, T.granite)
  // the attic, set back, its little cornice, and the balustrade on it
  const attic = offsetRing(ring, -1.1)
  faceBand(out, attic, CORNICE, ATTIC, { kind: 'blank', wall: GRANITE, material: 'granite' })
  faceBand(out, offsetRing(ring, -0.8), ATTIC - 0.45, ATTIC, { kind: 'blank', wall: TRIM, material: 'granite' })
  // the hipped roof of lead-coated copper behind the balustrade
  const roofRing = offsetRing(ring, -1.6)
  capPolygon(out, attic, ATTIC, LEAD, T.metal)
  stripRoof(out, roofRing, ATTIC, RIDGE - ATTIC, LEAD, 'metal')

  // ---------------------------------------------------------------- every wall's dress
  for (let i = 0; i < n; i++) {
    const e = edgeOf(ring[i], ring[(i + 1) % n])
    if (e.L < 2.5) continue
    const isArc = arcEdge.has(i)
    // the base's channelled courses (the windows stand proud of them)
    for (let y = 1.5; y < BASE - 0.2; y += 0.62) quadOn(out, e, 0.05, e.L - 0.05, y, y + 0.08, 0.025, JOINT, T.granite)
    const ae = edgeOf(attic[i], attic[(i + 1) % n])
    balustrade(out, ae, 0, ae.L, ATTIC, BAL, 0, true)
    if (isArc) continue
    const nb = Math.max(1, Math.round(e.L / BAY))
    const bw = e.L / nb
    // the corner pilaster strips
    for (const u of [0.7, e.L - 0.7]) blockOn(out, e, u - 0.7, u + 0.7, -0.1, 0.18, BELT, COL_TOP, GRANITE, T.granite)
    for (let k = 0; k < nb; k++) {
      const u = (k + 0.5) * bw
      const inLoggia = i === front && u > uc0 && u < uc1
      const centre = i === front && Math.abs(u - F.L / 2) < bw * 1.6
      // the ground storey: windows, or on the front's middle the three arches of the entrance
      if (!centre) {
        quadOn(out, e, u - 1.05, u + 1.05, 1.3, 4.9, 0.05, TRIM, T.granite)
        quadOn(out, e, u - 0.8, u + 0.8, 1.5, 4.7, 0.07, DARK, T.glass)
      }
      if (!centre) {
        quadOn(out, e, u - 0.95, u + 0.95, 6.3, 9.3, 0.05, TRIM, T.granite)
        quadOn(out, e, u - 0.75, u + 0.75, 6.5, 9.1, 0.07, DARK, T.glass)
      }
      // the third and fourth floors, in the loggia or on the plain wall; the fifth in the frieze
      const o = inLoggia ? -DEEP + 0.03 : 0
      quadOn(out, e, u - 0.95, u + 0.95, 11.3, 14.6, o + 0.04, TRIM, T.granite)
      quadOn(out, e, u - 0.75, u + 0.75, 11.5, 14.4, o + 0.06, DARK, T.glass)
      quadOn(out, e, u - 0.75, u + 0.75, 15.6, 18.6, o + 0.06, DARK, T.glass)
      if (!inLoggia) blockOn(out, e, u - 1.0, u + 1.0, 0, 0.35, 11.0, 11.5, TRIM, T.granite)   // the balconette's ledge
      quadOn(out, e, u - 0.6, u + 0.6, 20.6, 21.8, 0.06, DARK, T.glass)
      // the attic's square window
      quadOn(out, ae, (u / e.L) * ae.L - 0.5, (u / e.L) * ae.L + 0.5, 24.4, 25.6, 0.04, DARK, T.glass)
    }
  }

  // ---------------------------------------------------------------- the loggia
  // the balustrade between the column feet, the pilasters on the wall behind, the columns
  for (let k = 0; k < nCols; k++) {
    const u = uc0 + k * pitch
    const p = at(F, u, COL_O)
    classicalColumn(out, p.x, p.z, BELT, COL_TOP, 0.58, GRANITE, { order: 'doric', tier: 'mid', tag: T.granite, heading: F.heading })
    blockOn(out, F, u - 0.65, u + 0.65, -DEEP, -DEEP + 0.25, BELT, COL_TOP, GRANITE, T.granite)
    if (k < nCols - 1) balustrade(out, F, u + 0.7, u + pitch - 0.7, BELT, BELT + 1.05, COL_O, false)
  }
  // the end bays' piers that close the loggia
  for (const u of [uc0 - 0.9, uc1 + 0.9]) blockOn(out, F, u - 0.9, u + 0.9, -0.05, 0.15, BELT, COL_TOP, GRANITE, T.granite)

  // ---------------------------------------------------------------- the entrance
  for (const s of [-1, 0, 1]) {
    const u = F.L / 2 + s * 4.4
    archOn(out, F, u, 0.6, 3.4, 6.2, 0.06, TRIM, T.granite)
    archOn(out, F, u, 0.6, 2.7, 5.6, 0.09, DOOR, T.glass)
    blockOn(out, F, u - 0.35, u + 0.35, 0, 0.2, 6.2, 7.1, TRIM, T.granite)        // the keystone
  }
  // the shield over the centre arch, and the eagles' roundels over the others
  blockOn(out, F, F.L / 2 - 0.8, F.L / 2 + 0.8, 0, 0.25, 7.3, 9.3, TRIM, T.granite)
  for (const s of [-1, 1]) {
    const m = at(F, F.L / 2 + s * 4.4, 0.12)
    prismOnWall(out, m, F, 7.9, 0.75, BRONZE)
  }
  // the steps: a broad low flight the width of the three arches, with cheek blocks
  const SW = 8.6
  for (let k = 0; k < 4; k++) {
    blockOn(out, F, F.L / 2 - SW, F.L / 2 + SW, 0, 2.6 - k * 0.6, k * 0.15, (k + 1) * 0.15, TRIM, T.granite)
  }
  for (const s of [-1, 1]) blockOn(out, F, F.L / 2 + s * (SW + 0.5) - 0.5, F.L / 2 + s * (SW + 0.5) + 0.5, 0, 2.8, 0, 1.0, GRANITE, T.granite)

  // ---------------------------------------------------------------- the concave corners
  for (const arc of arcs) {
    const pts = arc.map((i) => ring[i])
    // the arc's middle vertex and its outward normal: away from the chord's far side
    const p0 = pts[0]
    const pN = pts[pts.length - 1]
    const chord = edgeOf(p0, pN)
    const mid = pts[Math.floor(pts.length / 2)]
    const facets: Edge[] = []
    for (let k = 0; k < pts.length - 1; k++) {
      // the ring runs anticlockwise; the arc list may run either way, so take each facet in the ring's direction
      const forward = arc[k + 1] === (arc[k] + 1) % n
      facets.push(forward ? edgeOf(pts[k], pts[k + 1]) : edgeOf(pts[k + 1], pts[k]))
    }
    const nrm = { x: -chord.nx, z: -chord.nz }
    // the chord runs between the two ends; the building is on one side, so turn the normal to face away from it
    let cx = 0; let cz = 0
    for (const q of ring) { cx += q.x; cz += q.z }
    cx /= n; cz /= n
    if ((mid.x - cx) * nrm.x + (mid.z - cz) * nrm.z < 0) { nrm.x = -nrm.x; nrm.z = -nrm.z }
    const ce: Edge = { a: { x: mid.x + nrm.z * 1.5, z: mid.z - nrm.x * 1.5 }, b: mid, tx: -nrm.z, tz: nrm.x, nx: nrm.x, nz: nrm.z, L: 1.5, heading: Math.atan2(nrm.x, nrm.z) }
    // the doorway: an arch across the middle vertex, drawn on a plane a little out from it, and its medallion
    archOn(out, ce, 1.5, 0, 3.6, 6.4, 0.25, TRIM, T.granite)
    archOn(out, ce, 1.5, 0, 2.8, 5.8, 0.3, DOOR, T.glass)
    prismOnWall(out, at(ce, 1.5, 0.3), ce, 8.1, 0.95, TRIM)
    // above the base: the window between the two columns in antis, and the columns themselves
    quadOn(out, ce, 0.6, 2.4, 11.4, 14.4, 0.25, DARK, T.glass)
    quadOn(out, ce, 0.6, 2.4, 15.6, 18.6, 0.25, DARK, T.glass)
    quadOn(out, ce, 0.9, 2.1, 20.6, 21.8, 0.25, DARK, T.glass)
    for (const f of facets) {
      if (f.L < 1.2) continue
      quadOn(out, f, f.L / 2 - 0.55, f.L / 2 + 0.55, 6.5, 9.1, 0.07, DARK, T.glass)
    }
    // the columns in antis: on the arc's second and second-last vertices, standing out from the wall
    for (const v of [pts[1], pts[pts.length - 2]]) {
      const q = { x: v.x + nrm.x * 0.75, z: v.z + nrm.z * 0.75 }
      classicalColumn(out, q.x, q.z, BELT, COL_TOP, 0.58, GRANITE, { order: 'doric', tier: 'mid', tag: T.granite, heading: ce.heading })
    }
  }

  // the flagpole on the attic over the entrance
  const fp = at(F, F.L / 2, -6)
  strut(out, [fp.x, BAL, fp.z], [fp.x, BAL + 9, fp.z], 0.14, 0.14, [0.85, 0.85, 0.83], T.metal, false)
  box(out, fp.x, BAL + 9.05, fp.z, 0.16, 0.08, 0.16, [0.8, 0.68, 0.3], T.metal)
}

/**
 * A balustrade along an edge from u0 to u1, `o` out from it: a plinth, a rail, and between them a dark band with
 * the balusters standing in front of it. `piers`: a pier every bay as well (the attic's).
 */
function balustrade(out: MeshBuilder, e: Edge, u0: number, u1: number, y0: number, y1: number, o: number, piers: boolean): void {
  const tag = surfaceTag('granite')
  const L = u1 - u0
  if (L < 0.8) return
  const h = y1 - y0
  blockOn(out, e, u0, u1, o - 0.25, o + 0.25, y0, y0 + h * 0.18, TRIM, tag)
  blockOn(out, e, u0, u1, o - 0.28, o + 0.28, y1 - h * 0.16, y1, TRIM, tag)
  quadOn(out, e, u0, u1, y0 + h * 0.18, y1 - h * 0.16, o - 0.1, JOINT, tag)
  const nB = Math.max(1, Math.round(L / 0.62))
  for (let k = 0; k < nB; k++) {
    const u = u0 + ((k + 0.5) / nB) * L
    quadOn(out, e, u - 0.15, u + 0.15, y0 + h * 0.18, y1 - h * 0.16, o + 0.12, TRIM, tag)
  }
  if (piers) {
    const nP = Math.max(1, Math.round(L / BAY))
    for (let k = 0; k <= nP; k++) {
      const u = u0 + (k / nP) * L
      blockOn(out, e, Math.max(u0, u - 0.3), Math.min(u1, u + 0.3), o - 0.3, o + 0.3, y0, y1 + 0.08, TRIM, tag)
    }
  }
}

/** a roundel on a wall: a short disc whose face looks along the wall's normal */
function prismOnWall(out: MeshBuilder, p: P2, e: Edge, y: number, r: number, c: Rgb): void {
  const n = 10
  const tag = surfaceTag('granite')
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2
    const a1 = ((i + 1) / n) * Math.PI * 2
    const q = (a: number): V3 => [p.x + e.tx * Math.cos(a) * r + e.nx * 0.12, y + Math.sin(a) * r, p.z + e.tz * Math.cos(a) * r + e.nz * 0.12]
    out.quad([[p.x + e.nx * 0.12, y, p.z + e.nz * 0.12], q(a1), q(a0), [p.x + e.nx * 0.12, y, p.z + e.nz * 0.12]], [e.nx, 0, e.nz], UV, c, tag)
  }
}

/**
 * UNITED NATIONS PLAZA FOUNTAIN (Lawrence Halprin, 1975; OSM way/128534058). From Commons "UN Plaza fountain.jpg",
 * "United Nations Plaza.jpg" and "United Nations Plaza 2.jpg" (all 2023-10-01, the fountain running after the 2023
 * skate-and-games redo of the plaza), "UN Plaza Fountain, San Francisco. By Lawrence Halprin. (30389889247).jpg" and
 * "Fountain on UN Plaza - panoramio.jpg":
 *   - a SUNKEN POOL in the brick plaza, its edge a pale granite coping with steps down to the water;
 *   - a composition of big RECTILINEAR GRANITE BLOCKS, square-cut, axis-aligned, as a little mountain range: a
 *     cliff of tall slabs (to ~4.6 m) along one side, stacked and stepped blocks in the middle, broad pale slabs
 *     CANTILEVERED out over the water on the other side, low cuboids standing in the pool;
 *   - the stone buff to pale grey dry, stained ORANGE-BROWN where the water runs;
 *   - water: vertical jets from the tops of the low blocks, arcs from the higher ones, sheets down their faces.
 * The city's ground cannot be cut, so the "sunken" pool is a coping a little above the paving with its steps going
 * down inside to the water. The composition is laid out for a 34 × 25 m box and scaled to the fit.
 */
export function unPlazaFountain(out: MeshBuilder, fit: Fit): void {
  const PALE: Rgb = [0.8, 0.78, 0.73]
  const BUFF: Rgb = [0.76, 0.68, 0.56]
  const WET: Rgb = [0.66, 0.55, 0.42]
  const SPLIT: Rgb = [0.66, 0.63, 0.58]
  const WATER: Rgb = [0.4, 0.5, 0.49]
  const FOAM: Rgb = [0.9, 0.94, 0.96]
  const st = surfaceTag('granite')
  const sx = Math.max(0.6, fit.hx / 17)
  const sz = Math.max(0.6, fit.hz / 12.5)
  const ring = towerRing(fit)

  // the coping and the steps down inside it to the water
  const COPE = 0.5
  faceBand(out, ring, 0, COPE, { kind: 'blank', wall: PALE, material: 'granite' })
  const steps = [offsetRing(ring, -1.0), offsetRing(ring, -1.5), offsetRing(ring, -2.0), offsetRing(ring, -2.4)]
  capPolygonWithHoles(out, [ring, steps[0]], COPE, PALE, st)
  let y = COPE
  for (let k = 0; k < 3; k++) {
    // each step down: its riser facing into the pool (the ring turned clockwise), its tread an annulus
    faceBand(out, [...steps[k]].reverse(), y - 0.12, y, { kind: 'blank', wall: SPLIT, material: 'granite' })
    y -= 0.12
    capPolygonWithHoles(out, [steps[k], steps[k + 1]], y, PALE, st)
  }
  faceBand(out, [...steps[3]].reverse(), y - 0.06, y, { kind: 'blank', wall: SPLIT, material: 'granite' })
  y -= 0.06
  capPolygon(out, steps[3], y, WATER, 0)
  const W = y     // the water's surface

  const blk = (u: number, v: number, hw: number, hd: number, y0: number, y1: number, c: Rgb, tag = st): void =>
    box(out, u * sx, (y0 + y1) / 2 + (y0 === 0 ? W / 2 : 0), v * sz, hw * sx, (y1 - y0) / 2 - (y0 === 0 ? W / 2 : 0), hd * sz, c, tag)
  // [u, v, half-width, half-depth, y0, y1, colour]: laid out from the photographs on a 34 × 25 m plan
  const BLOCKS: [number, number, number, number, number, number, Rgb][] = [
    // the cliff of tall slabs along +z at the −x end
    [-13.6, 8.6, 1.7, 0.6, 0, 4.6, PALE], [-11.0, 9.3, 1.3, 1.1, 0, 3.8, PALE], [-14.9, 4.6, 0.7, 1.9, 0, 4.1, PALE],
    [-12.3, 5.4, 1.7, 1.3, 0, 2.5, BUFF], [-12.5, 5.6, 1.2, 0.9, 2.5, 3.2, BUFF], [-8.7, 6.9, 1.5, 1.2, 0, 2.1, BUFF],
    [-8.3, 10.0, 1.8, 0.8, 0, 3.0, PALE], [-5.2, 9.9, 1.5, 0.9, 0, 3.4, PALE], [-14.0, -1.4, 1.3, 1.9, 0, 2.4, PALE],
    // the stacked middle
    [-6.0, 3.4, 2.0, 1.4, 0, 1.5, WET], [-5.6, 3.6, 1.5, 1.0, 1.5, 2.5, BUFF], [-3.0, 6.1, 1.4, 1.6, 0, 2.8, BUFF],
    [-2.7, 6.3, 1.0, 1.0, 2.8, 3.4, PALE], [0.2, 2.9, 1.2, 1.2, 0, 1.2, WET], [0.6, 7.4, 2.2, 1.2, 0, 2.1, BUFF],
    [-4.4, -0.2, 1.0, 1.0, 0, 0.8, WET], [-1.4, -1.6, 0.9, 1.3, 0, 1.0, WET], [2.9, 0.4, 1.0, 0.8, 0, 0.7, WET],
    // the broad pale slabs cantilevered over the water on the +x side, each on a smaller block
    [7.0, 5.2, 1.1, 1.1, 0, 1.4, WET], [7.6, 4.6, 3.4, 2.2, 1.4, 2.5, PALE], [11.6, 7.6, 1.0, 1.3, 0, 1.0, WET],
    [11.9, 7.0, 3.0, 2.6, 1.0, 1.9, PALE], [13.4, 2.0, 2.2, 1.6, 0, 1.2, PALE], [13.6, 2.2, 1.6, 1.1, 1.2, 1.6, PALE],
    [5.2, 9.7, 2.6, 0.9, 0, 3.1, PALE], [9.8, 10.2, 1.6, 0.8, 0, 2.2, BUFF],
    // the low blocks in the front of the pool, and a step-like slab at its edge
    [-9.0, -2.2, 1.2, 0.9, 0, 0.9, WET], [-11.3, -6.0, 2.4, 1.4, 0, 1.3, BUFF], [5.6, -3.0, 1.3, 1.0, 0, 0.8, WET],
    [9.6, -5.6, 2.8, 1.2, 0, 0.6, PALE], [1.5, -6.5, 1.6, 1.0, 0, 0.5, WET],
    // more of the middle range: the stepped blocks between the cliff and the slabs
    [2.6, 4.6, 1.3, 1.1, 0, 1.8, BUFF], [3.0, 4.9, 0.9, 0.7, 1.8, 2.4, PALE], [-8.6, 2.6, 1.0, 1.4, 0, 1.2, WET],
    [8.6, 0.6, 1.4, 1.2, 0, 1.0, WET], [-0.8, 10.2, 1.4, 0.8, 0, 2.6, PALE], [15.0, 8.8, 1.3, 2.0, 0, 2.7, PALE],
  ]
  for (const [u, v, hw, hd, y0, y1, c] of BLOCKS) {
    blk(u, v, hw, hd, y0, y1, c, st)
    // the stain where the water runs: the foot of every block in the pool
    if (y0 === 0 && c !== WET) blk(u, v, hw + 0.02, hd + 0.02, 0, Math.min(0.7, y1 * 0.4), WET)
    // the split (rough) face of the cantilevered slabs: a darker band along their lips
    if (y0 > 0.5 && c === PALE) blk(u, v, hw + 0.03, hd + 0.03, y0 + 0.05, y0 + 0.35, SPLIT)
  }
  // the long slab tilted down into the water
  strut(out, [-8.2 * sx, 1.7, -4.4 * sz], [-2.6 * sx, W + 0.1, -5.0 * sz], 1.7 * sz, 0.6, WET, st)

  // the water: vertical jets from the low blocks' tops, arcs off the high ones, sheets down the faces
  const jets: [number, number, number, number][] = [[0.2, 2.9, 1.2, 3.4], [-4.4, -0.2, 0.8, 2.6], [-1.4, -1.6, 1.0, 2.2],
    [2.9, 0.4, 0.7, 3.0], [5.6, -3.0, 0.8, 2.4]]
  for (const [u, v, top, h] of jets) {
    // a jet: a thin column of water, and the spray falling off its head in a ring of short arcs
    strut(out, [u * sx, top, v * sz], [u * sx, top + h, v * sz], 0.1, 0.1, FOAM, 0, false)
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2 + 0.4
      strut(out, [u * sx, top + h, v * sz], [u * sx + Math.cos(a) * 0.7, top + h * 0.55, v * sz + Math.sin(a) * 0.7], 0.06, 0.06, FOAM, 0, false)
    }
  }
  const arcsOf: [number, number, number, number, number][] = [[-5.6, 3.6, 2.5, 0.9, 2.6], [7.6, 4.6, 2.5, -2.0, 3.5],
    [-2.7, 6.3, 3.4, -1.0, 4.0], [11.9, 7.0, 1.9, -2.6, 3.0]]
  for (const [u, v, top, du, dv] of arcsOf) {
    const p0: V3 = [u * sx, top, v * sz]
    const pm: V3 = [(u + du * 0.5) * sx, top + 1.1, (v + dv * 0.5) * sz]
    const p1: V3 = [(u + du) * sx, W, (v + dv) * sz]
    strut(out, p0, pm, 0.1, 0.1, FOAM, 0, false)
    strut(out, pm, p1, 0.1, 0.1, FOAM, 0, false)
  }
  // sheets falling over the lips of the stacked blocks
  for (const [u, v, hw, hd, y0, y1] of [[-5.6, 3.6, 1.5, 1.0, W, 2.5], [7.6, 4.6, 3.4, 2.2, W, 1.4], [11.9, 7.0, 3.0, 2.6, W, 1.0], [-12.5, 5.6, 1.2, 0.9, 2.5, 3.2]]) {
    box(out, u * sx, (y0 + y1) / 2, (v - hd - 0.04) * sz, hw * 0.75 * sx, (y1 - y0) / 2, 0.02, FOAM, 0)
  }
}

/**
 * THE CAFÉ AT CIVIC CENTER (WRNS Studio, 2018; Limoncello since 2024), on Civic Center Plaza at Grove and Larkin —
 * the "UN Cafe" the owner asked for, as far as the evidence goes: there is no café structure on UN Plaza itself.
 * OSM maps it as way/941705060, which the city draws as a generic box. From WRNS's project page and the 2017 planning
 * packet (a ~640 sq ft kiosk about 12 ft high, its canopy extending when open): a GLASS BOX under a thin flat roof
 * slab, wrapped in full-height STAINLESS BI-FOLD DOORS that close it into a steel shell and, open, stand folded in
 * pairs at the bays' ends; a warm-lit counter inside. Not yet referenced by any manifest entry (it needs one on
 * way/941705060 with `procedural: "civicCenterCafe"`).
 */
export function civicCenterCafe(out: MeshBuilder, fit: Fit): void {
  const STEEL: Rgb = [0.78, 0.79, 0.8]
  const GLASS: Rgb = [0.32, 0.4, 0.44]
  const FRAME: Rgb = [0.25, 0.26, 0.27]
  const WARM: Rgb = [0.86, 0.72, 0.5]
  const metal = surfaceTag('metal')
  const ring = towerRing(fit)
  const H = 3.7
  // the glass walls and the dark mullions between their panes
  faceBand(out, ring, 0.15, H - 0.35, { kind: 'curtain', wall: FRAME, glass: GLASS, pitch: 1.2, floor: H - 0.5, material: 'metal' })
  faceBand(out, ring, 0, 0.15, { kind: 'blank', wall: FRAME, material: 'metal' })
  // the roof slab, a thin steel fascia standing out over the doors
  const roof = offsetRing(ring, 0.6)
  faceBand(out, roof, H - 0.35, H, { kind: 'blank', wall: STEEL, material: 'metal' })
  capPolygon(out, roof, H, [0.7, 0.71, 0.72], metal)
  capPolygon(out, ring, H - 0.35, [0.9, 0.88, 0.84], 0)
  // the counter inside, lit
  const inner = offsetRing(ring, -0.8)
  faceBand(out, inner, 0, 1.05, { kind: 'blank', wall: WARM, material: 'planks' })
  // the bi-fold doors, open: on every wall a folded pair of stainless leaves standing out at each end
  for (let i = 0; i < ring.length; i++) {
    const e = edgeOf(ring[i], ring[(i + 1) % ring.length])
    if (e.L < 2) continue
    for (const u of [0.25, e.L - 0.25]) blockOn(out, e, u - 0.12, u + 0.12, 0.05, 1.0, 0.05, H - 0.4, STEEL, metal)
  }
  // a few bistro tables in front of the longest side
  let li = 0
  for (let i = 1; i < ring.length; i++) if (edgeOf(ring[i], ring[(i + 1) % ring.length]).L > edgeOf(ring[li], ring[(li + 1) % ring.length]).L) li = i
  const front = edgeOf(ring[li], ring[(li + 1) % ring.length])
  const nT = Math.max(2, Math.floor(front.L / 2.6))
  for (let k = 0; k < nT; k++) {
    const p = at(front, ((k + 0.5) / nT) * front.L, 3.2)
    box(out, p.x, 0.37, p.z, 0.05, 0.37, 0.05, FRAME, metal)
    box(out, p.x, 0.75, p.z, 0.35, 0.02, 0.35, STEEL, metal)
  }
}

export const UN_PLAZA: Record<string, (out: MeshBuilder, fit: Fit) => void> = { unPlazaFederal, unPlazaFountain, civicCenterCafe }
