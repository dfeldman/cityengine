import { MeshBuilder } from '../../buildings.ts'
import { type Rgb } from '../../models.ts'
import { buildRoof, safeInset, type Pt } from '../../roofs.ts'
import { block, hex, shade } from '../kit.ts'

const FIXED = 0
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
type V3 = [number, number, number]
type P = [number, number]

/**
 * THE HÔTEL LANDOLFO-CARCANO (1 rue de Tilsitt, 8e; now the Qatari embassy; one of Hittorff's twelve "hôtels des Maréchaux" round the Étoile, built 1867 by
 * Rohault de Fleury; monument historique PA00088826, wikidata Q108866707; OSM way/108200345, 4 levels, mansard, roof colour #5C6882).
 * Read off Commons: "Hôtel Landolfo-Carcano - 1 rue de Tilsitt à Paris" (the cour front: arched ground windows, a two-storey rounded oriel with a balustraded
 * top over a corbelled base, iron balconies, a rich cornice, slate mansard with pedimented dormers, black scrolled iron railing on the street), "Paris rue de
 * tilsitt no1.2" (the rusticated Tilsitt pavilion with its corner quoins and blank panels), "Hôtel Landolfo-Carcano from the Arc de Triomphe" (the west face on
 * the Étoile and the long south face on the Champs-Élysées, four floors of ashlar and a hipped mansard).
 * Roofs from tools/ign-mns.ts at 48.8736 N, 2.29706 E: the main mansard peaks 23-24 m, the wings 19-20 m (the 13 m patches and the trees round it are noise).
 *
 * One outline (RING, counter-clockwise) carries the walls; three overlapping mansard blocks (the main block, the two wings carried a little way into it)
 * carry the roofs. Plan frame: x east, z north, metres from 48.8736 N, 2.29706 E. The Étoile is west, the Champs-Élysées south, rue de Tilsitt east
 * (the cour opens on it through the railing), a service lane north.
 */
// ---- tunable: heights
export const FLOOR = 0.5
export const EAVE = 16.8          // the cornice line, all round
export const STEEP_RISE = 3.4     // the steep lower slope of every mansard
export const STEEP_IN = 2.0       // its run, in from the wall
export const DECK_IN = 2.0        // the main block's shallow upper slope: run
export const MAIN_DECK_RISE = 2.6 // and rise (the wings end on the steep slope's top)
export const MAIN_TOP = EAVE + STEEP_RISE + MAIN_DECK_RISE
export const WING_TOP = EAVE + STEEP_RISE
// ---- tunable: the storeys
export const STRING_1 = 5.2
export const STRING_2 = 9.6
export const STRING_3 = 13.4
export const ARCH: [number, number, number] = [0.7, 4.7, 1.4]      // y0, top, width
export const ROW1: [number, number, number] = [6.0, 9.1, 1.3]
export const ROW2: [number, number, number] = [10.4, 13.0, 1.25]
export const ROW3: [number, number, number] = [14.0, 15.6, 1.15]
export const BAY_TARGET = 3.35
// ---- tunable: the oriel on the cour front
export const ORIEL_BASE = 4.8
export const ORIEL_TOP = 10.0
export const ORIEL_OUT = 0.3
// ---- tunable: the railing on rue de Tilsitt
export const RAIL_H = 2.5
export const RAIL_PLINTH = 0.55
export const RAIL_SPACING = 0.24
// ---- tunable: the plan (counter-clockwise)
export const RING: P[] = [
  [1.6, -1.8], [2.7, -1.0], [3.4, 0.1], [3.8, 2.3], [3.4, 3.9], [2.4, 5.1],            // 0-5: the oriel (A..B)
  [2.8, 8.4], [11.8, 10.0], [12.1, 17.0], [11.7, 17.4], [-3.4, 14.8], [-11.8, 13.4],   // 6-11: north wing south face, Tilsitt, north lane
  [-12.1, 7.4], [-13.0, 0.1], [-13.3, -2.2], [-14.0, -5.3], [-13.5, -6.1], [-10.6, -7.4],   // 12-17: the west face on the Étoile, the chamfer
  [-5.4, -9.9], [7.9, -16.2], [8.1, -16.1], [9.3, -10.6], [9.6, -8.8], [1.2, -5.0],    // 18-23: the Champs-Élysées face, the Tilsitt pavilion, the cour
]
const R = (i: number): P => RING[i]
export const MAIN: P[] = [R(23), R(6), [2.8, 16.0], R(10), R(11), R(12), R(13), R(14), R(15), R(16), R(17), R(18), [1.2, -13.03]]
export const WING_SE: P[] = [[-3.5, -2.9], R(22), R(21), R(20), R(19), [-3.5, -10.8]]
export const WING_NE: P[] = [[-2, 7.55], R(7), R(8), R(9), [-2, 15.04]]
export const BAY: P[] = [R(0), R(1), R(2), R(3), R(4), R(5)]
export const CHIMNEYS: [number, number, boolean][] = [[-6, 9.8, false], [-6.5, -3.2, false], [-2.5, 4.5, false], [7, 13.5, true], [4, -11, true]]   // x, z, on a wing's roof
export const HOTEL_CARCANO_REFS = ['way/108200345']
// ---- tunable: colours (the warm grey-cream limestone of the photographs; slate from OSM's roof:colour)
const STONE: Rgb = hex('#d6ccb4')
const STONE_D: Rgb = hex('#bfb59b')
const STONE_L: Rgb = hex('#e6dec9')
const COURSE: Rgb = hex('#a99e84')
const SLATE: Rgb = hex('#4a5570')
const SLATE_HI: Rgb = hex('#58647f')
const GLASS: Rgb = [0.15, 0.18, 0.2]
const IRON: Rgb = [0.05, 0.05, 0.06]
const BRICK: Rgb = hex('#9c6a52')
const COURT: Rgb = hex('#a9a08c')

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
function normalOf(a: V3, b: V3, c: V3): V3 {
  const u = sub(b, a), v = sub(c, a)
  const n: V3 = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]
  const l = Math.hypot(...n) || 1
  return [n[0] / l, n[1] / l, n[2] / l]
}
function sheet(q: MeshBuilder, p: [V3, V3, V3, V3], col: Rgb): void {
  let n = normalOf(p[0], p[1], p[2])
  if (n[1] < 0) n = [-n[0], -n[1], -n[2]]
  q.quad(p, n, UV, col, FIXED)
}

type Face = { o: P; t: P; n: P; len: number }
const at = (f: Face, s: number, y: number, d: number): V3 => [f.o[0] + f.t[0] * s + f.n[0] * d, y, f.o[1] + f.t[1] * s + f.n[1] * d]
const nrm = (f: Face): V3 => [f.n[0], 0, f.n[1]]
/** The face a -> b of a counter-clockwise outline: the outward normal is to the right. */
function faceAB(a: P, b: P): Face {
  const dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz)
  const t: P = [dx / len, dz / len]
  return { o: a, t, n: [t[1], -t[0]], len }
}
const ringFace = (i: number): Face => faceAB(R(i), R((i + 1) % RING.length))
function rect(q: MeshBuilder, f: Face, s0: number, s1: number, y0: number, y1: number, d: number, col: Rgb): void {
  q.quad([at(f, s0, y0, d), at(f, s1, y0, d), at(f, s1, y1, d), at(f, s0, y1, d)], nrm(f), UV, col, FIXED)
}
function tri(q: MeshBuilder, f: Face, a: P, b: P, c: P, d: number, col: Rgb): void {
  q.quad([at(f, a[0], a[1], d), at(f, b[0], b[1], d), at(f, c[0], c[1], d), at(f, c[0], c[1], d)], nrm(f), UV, col, FIXED)
}
function arch(q: MeshBuilder, f: Face, sc: number, w: number, y0: number, spring: number, top: number, d: number, col: Rgb): void {
  rect(q, f, sc - w / 2, sc + w / 2, y0, spring, d, col)
  const r = w / 2, h = top - spring, N = 6
  for (let i = 0; i < N; i++) {
    const a0 = Math.PI * i / N, a1 = Math.PI * (i + 1) / N
    tri(q, f, [sc, spring], [sc - Math.cos(a0) * r, spring + Math.sin(a0) * h], [sc - Math.cos(a1) * r, spring + Math.sin(a1) * h], d, col)
  }
}
function ledge(q: MeshBuilder, f: Face, s0: number, s1: number, y0: number, y1: number, out: number, col: Rgb): void {
  rect(q, f, s0, s1, y0, y1, out, col)
  sheet(q, [at(f, s0, y1, 0), at(f, s1, y1, 0), at(f, s1, y1, out), at(f, s0, y1, out)], shade(col, 0.92))
}
function obox(q: MeshBuilder, f: Face, s0: number, s1: number, y0: number, y1: number, d0: number, d1: number, col: Rgb): void {
  rect(q, f, s0, s1, y0, y1, d1, col)
  sheet(q, [at(f, s0, y1, d0), at(f, s1, y1, d0), at(f, s1, y1, d1), at(f, s0, y1, d1)], shade(col, 1.04))
  for (const [s, sg] of [[s0, -1], [s1, 1]] as [number, number][]) {
    const n: V3 = [f.t[0] * sg, 0, f.t[1] * sg]
    q.quad([at(f, s, y0, d0), at(f, s, y0, d1), at(f, s, y1, d1), at(f, s, y1, d0)], n, UV, shade(col, 0.9), FIXED)
  }
}

// ---- openings
function sqWin(q: MeshBuilder, f: Face, s: number, y0: number, y1: number, w: number, d: number): void {
  rect(q, f, s - w / 2 - 0.2, s + w / 2 + 0.2, y0 - 0.12, y1 + 0.25, d + 0.03, STONE_L)
  rect(q, f, s - w / 2, s + w / 2, y0, y1, d + 0.08, GLASS)
  rect(q, f, s - 0.025, s + 0.025, y0, y1, d + 0.1, STONE_L)
  const ym = y0 + (y1 - y0) * 0.64
  rect(q, f, s - w / 2, s + w / 2, ym - 0.025, ym + 0.025, d + 0.1, STONE_L)
  ledge(q, f, s - w / 2 - 0.28, s + w / 2 + 0.28, y0 - 0.2, y0 - 0.08, d + 0.14, STONE_L)
}
function archWin(q: MeshBuilder, f: Face, s: number, w: number, d: number): void {
  const [y0, top] = ARCH, spring = top - 1.0
  arch(q, f, s, w + 0.5, y0 - 0.05, spring, top + 0.25, d + 0.03, STONE_L)
  arch(q, f, s, w, y0, spring, top, d + 0.08, GLASS)
  rect(q, f, s - 0.025, s + 0.025, y0, spring, d + 0.1, STONE_L)
  rect(q, f, s - w / 2, s + w / 2, y0 + (spring - y0) * 0.55 - 0.025, y0 + (spring - y0) * 0.55 + 0.025, d + 0.1, STONE_L)
}
function balconyWin(q: MeshBuilder, f: Face, s: number, row: [number, number, number], d: number, depth = 0.22): void {
  const [y0, y1, w] = row
  sqWin(q, f, s, y0, y1, w, d)
  obox(q, f, s - w / 2 - 0.3, s + w / 2 + 0.3, y0 - 0.02, y0 + 0.95, d + 0.02, d + depth, IRON)
  rect(q, f, s - w / 2 - 0.25, s + w / 2 + 0.25, y0 + 0.08, y0 + 0.85, d + depth + 0.02, shade(GLASS, 1.8))
}
/** A pedimented dormer on the mansard, its front inset to meet the slope at its height. */
function dormer(q: MeshBuilder, f: Face, s: number, y: number, w = 0.95, h = 1.45): void {
  const inset = STEEP_IN * Math.min(1, (y - EAVE) / STEEP_RISE)
  const d = -inset + 0.5
  sqWin(q, f, s, y - h / 2, y + h / 2, w, d)
  q.quad([at(f, s - w / 2 - 0.25, y + h / 2 + 0.22, d + 0.05), at(f, s + w / 2 + 0.25, y + h / 2 + 0.22, d + 0.05), at(f, s, y + h / 2 + 0.78, d + 0.05), at(f, s, y + h / 2 + 0.78, d + 0.05)], nrm(f), UV, STONE_L, FIXED)
  obox(q, f, s - w / 2 - 0.3, s + w / 2 + 0.3, y - h / 2 - 0.2, y + h / 2 + 0.2, -inset - 0.1, d - 0.02, SLATE)
}

// ---- masses
const toPts = (poly: P[]): Pt[] => poly.map(([x, z]) => ({ x, z }))
function skirt(q: MeshBuilder, lower: Pt[], upper: Pt[], y0: number, y1: number, col: Rgb): void {
  const n = lower.length
  for (let i = 0; i < n; i++) {
    const a = lower[i], b = lower[(i + 1) % n], c = upper[(i + 1) % n], d = upper[i]
    sheet(q, [[a.x, y0, a.z], [b.x, y0, b.z], [c.x, y1, c.z], [d.x, y1, d.z]], col)
  }
}
const flatPoly = (q: MeshBuilder, poly: P[], y: number, col: Rgb): void => { buildRoof(q, toPts(poly), { shape: 'flat', y, height: 0, colour: col }) }
/** A mansard over `poly` from the cornice line: the steep slope, then (if `deck`) the shallow one, then the flat top. */
function mansard(q: MeshBuilder, poly: P[], deck: number): void {
  const ring = toPts(poly), yMid = EAVE + STEEP_RISE
  const steep = safeInset(ring, STEEP_IN)
  if (!steep) { buildRoof(q, ring, { shape: 'flat', y: yMid, height: 0, colour: SLATE }); return }
  skirt(q, ring, steep, EAVE, yMid, SLATE)
  const top = deck > 0 ? safeInset(steep, DECK_IN) : null
  if (!top) { buildRoof(q, steep, { shape: 'flat', y: yMid, height: 0, colour: SLATE_HI }); return }
  skirt(q, steep, top, yMid, yMid + deck, SLATE_HI)
  buildRoof(q, top, { shape: 'flat', y: yMid + deck, height: 0, colour: SLATE_HI })
}
function cornice(q: MeshBuilder, f: Face): void {
  ledge(q, f, 0, f.len, EAVE - 0.55, EAVE + 0.05, 0.5, STONE_L)
  rect(q, f, 0, f.len, EAVE - 1.05, EAVE - 0.55, 0.05, STONE_D)
  for (let s = 0.4; s < f.len - 0.2; s += 0.8) rect(q, f, s, s + 0.3, EAVE - 0.55, EAVE - 0.2, 0.12, STONE_D)    // the modillions
}
const chimney = (q: MeshBuilder, x: number, z: number, y: number, h = 2.3): void => {
  block(q, x - 0.55, x + 0.55, z - 0.45, z + 0.45, y - 0.3, y + h, BRICK)
  block(q, x - 0.7, x + 0.7, z - 0.6, z + 0.6, y + h, y + h + 0.22, STONE_D)
}

/** The ashlar of a face: the ground storey's joints, the string courses, the cornice. */
function wall(q: MeshBuilder, f: Face, y0 = 0, y1 = EAVE): void {
  rect(q, f, 0, f.len, y0, y1, 0, STONE)
  if (y0 === 0) {
    rect(q, f, 0, f.len, 0, 0.6, 0.04, STONE_D)
    for (let y = 1.4; y < STRING_1 - 0.3; y += 0.85) rect(q, f, 0, f.len, y, y + 0.04, 0.02, COURSE)
  }
}
function strings(q: MeshBuilder, f: Face): void {
  ledge(q, f, 0, f.len, STRING_1 - 0.2, STRING_1 + 0.2, 0.16, STONE_L)
  ledge(q, f, 0, f.len, STRING_2 - 0.12, STRING_2 + 0.1, 0.1, STONE_L)
  ledge(q, f, 0, f.len, STRING_3 - 0.12, STRING_3 + 0.1, 0.1, STONE_L)
  cornice(q, f)
}
/** A bayed face: arched ground windows, balconied piano nobile, two upper rows, dormers. `skip` bays have their middle rows hidden (the oriel). */
function bays(q: MeshBuilder, f: Face, o: { nb?: number; skip?: number[]; balconies?: boolean; dormers?: boolean } = {}): void {
  const nb = o.nb ?? Math.max(1, Math.round(f.len / BAY_TARGET)), b = f.len / nb
  strings(q, f)
  for (let i = 0; i < nb; i++) {
    const s = (i + 0.5) * b, hid = o.skip?.includes(i)
    archWin(q, f, s, ARCH[2], 0.04)
    if (!hid) {
      if (o.balconies === false) sqWin(q, f, s, ROW1[0], ROW1[1], ROW1[2], 0.04)
      else balconyWin(q, f, s, ROW1, 0.04)
    }
    sqWin(q, f, s, ROW2[0], ROW2[1], ROW2[2], 0.04)
    sqWin(q, f, s, ROW3[0], ROW3[1], ROW3[2], 0.04)
    if (o.dormers !== false && (i % 2 === 0 || nb <= 2)) dormer(q, f, s, EAVE + 1.7)
  }
}
/** Alternate quoin stones up a face's end (the Tilsitt pavilion's corners). */
function quoins(q: MeshBuilder, f: Face, atEnd: boolean): void {
  let k = 0
  for (let y = 0.7; y < EAVE - 0.6; y += 0.62, k++) {
    const w = k % 2 ? 0.62 : 0.95
    const [s0, s1] = atEnd ? [f.len - w, f.len] : [0, w]
    rect(q, f, s0, s1, y, y + 0.54, 0.05, k % 2 ? STONE_L : STONE_D)
  }
}

// ---- the oriel: a rounded bay over a corbelled base, a balustraded top
function oriel(q: MeshBuilder): void {
  for (let i = 0; i < BAY.length - 1; i++) {
    const f = faceAB(BAY[i], BAY[i + 1])
    rect(q, f, 0, f.len, ORIEL_BASE, ORIEL_TOP, 0, STONE)
    ledge(q, f, -0.05, f.len + 0.05, ORIEL_BASE - 0.5, ORIEL_BASE, 0.28, STONE_D)           // the corbelled base
    rect(q, f, 0.15, f.len - 0.15, 5.9, 9.5, 0.04, GLASS)
    rect(q, f, f.len / 2 - 0.03, f.len / 2 + 0.03, 5.9, 9.5, 0.06, STONE_L)
    rect(q, f, 0.15, f.len - 0.15, 8.2, 8.26, 0.06, STONE_L)
    ledge(q, f, -0.05, f.len + 0.05, ORIEL_TOP - 0.3, ORIEL_TOP + 0.1, ORIEL_OUT + 0.05, STONE_L)   // the cornice that is the balcony's floor
    rect(q, f, 0, f.len, ORIEL_TOP + 0.1, ORIEL_TOP + 1.0, ORIEL_OUT + 0.05, STONE_L)               // the balustrade
    for (let s = 0.2; s < f.len - 0.1; s += 0.3) rect(q, f, s, s + 0.1, ORIEL_TOP + 0.2, ORIEL_TOP + 0.9, ORIEL_OUT + 0.07, STONE_D)
  }
  flatPoly(q, BAY, ORIEL_TOP + 0.1, STONE_D)
}

// ---- the railing and gate on rue de Tilsitt, with the paved cour behind it
function railing(q: MeshBuilder): void {
  const f = faceAB(R(22), R(7))      // the line of the railing, wing to wing
  const l = f.len
  rect(q, f, 0, l, 0, RAIL_PLINTH, 0, STONE_D)
  ledge(q, f, 0, l, RAIL_PLINTH - 0.12, RAIL_PLINTH + 0.06, 0.08, STONE_L)
  rect(q, f, 0, l, RAIL_PLINTH + 0.1, RAIL_PLINTH + 0.2, 0.03, IRON)
  rect(q, f, 0, l, RAIL_H - 0.35, RAIL_H - 0.28, 0.03, IRON)
  rect(q, f, 0, l, RAIL_H - 0.05, RAIL_H + 0.02, 0.03, IRON)
  const gate = l * 0.5
  for (let s = 0.15; s < l - 0.1; s += RAIL_SPACING) {
    const gap = Math.abs(s - gate) < 0.05
    if (gap) continue
    rect(q, f, s - 0.025, s + 0.025, RAIL_PLINTH, RAIL_H, 0.04, IRON)
    tri(q, f, [s - 0.06, RAIL_H], [s + 0.06, RAIL_H], [s, RAIL_H + 0.26], 0.04, IRON)
  }
  for (const s of [0.1, gate - 1.6, gate + 1.6, l - 0.1]) block(q, f.o[0] + f.t[0] * s - 0.2 + f.n[0] * 0.04, f.o[0] + f.t[0] * s + 0.2 + f.n[0] * 0.04, f.o[1] + f.t[1] * s - 0.2, f.o[1] + f.t[1] * s + 0.2, 0, RAIL_H + 0.45, STONE_L)
  // scroll over the gate: an arc of iron
  for (let k = 0; k < 7; k++) {
    const a = (Math.PI * k) / 6
    rect(q, f, gate - 1.4 * Math.cos(a) - 0.04, gate - 1.4 * Math.cos(a) + 0.04, RAIL_H + 0.2 + Math.sin(a) * 0.6, RAIL_H + 0.3 + Math.sin(a) * 0.6, 0.06, IRON)
  }
  // the paved cour inside it
  flatPoly(q, [R(22), R(7), R(6), R(5), R(0), R(23)], 0.12, COURT)
}

function buildings(q: MeshBuilder): void {
  // walls, all round: the oriel's own walls are its own
  for (let i = 0; i < RING.length; i++) {
    if (i <= 4) continue
    const f = ringFace(i)
    wall(q, f)
  }
  const plane = faceAB(R(23), R(6))
  wall(q, faceAB(R(0), R(5)))     // the cour wall behind the oriel
  mansard(q, MAIN, MAIN_DECK_RISE)
  mansard(q, WING_SE, 0)
  mansard(q, WING_NE, 0)
  flatPoly(q, BAY, 0.1, COURT)
  oriel(q)
  railing(q)
  // the cour front: four bays, the middle two behind the oriel
  bays(q, plane, { nb: 4, skip: [1, 2], balconies: true })
  // fronts
  const dormerEdges = [6, 7, 9, 10, 11, 12, 13, 14, 16, 17, 18, 20, 22, 23]
  for (const i of [6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 18, 20, 21, 22]) {
    const f = ringFace(i)
    if (f.len < 2.0) continue
    bays(q, f, { dormers: dormerEdges.includes(i), nb: i === 7 ? 2 : undefined })
  }
  // the west balcony: a stone balustraded balcony on the piano nobile's middle windows (the flagged one of the Arc photograph)
  {
    const f = ringFace(12)
    obox(q, f, f.len * 0.2, f.len * 0.8, STRING_1 - 0.15, STRING_1 + 0.3, 0.1, 1.0, STONE_L)
    rect(q, f, f.len * 0.2, f.len * 0.8, STRING_1 + 0.3, STRING_1 + 1.2, 1.0, STONE_L)
  }
  // quoins on the Tilsitt pavilion's corners
  quoins(q, ringFace(22), false)
  quoins(q, ringFace(20), true)
  quoins(q, ringFace(7), true)
  quoins(q, ringFace(6), false)
  for (const [x, z, wing] of CHIMNEYS) chimney(q, x, z, wing ? WING_TOP : MAIN_TOP)
}

export function hotelLandolfoCarcano(out: MeshBuilder): void {
  const first = out.positions.length / 3
  buildings(out)
  for (let i = first; i < out.positions.length / 3; i++) out.positions[i * 3 + 1] += FLOOR
}
