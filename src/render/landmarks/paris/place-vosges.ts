import { capPolygonWithHoles, MeshBuilder } from '../../buildings.ts'
import { type Rgb } from '../../models.ts'
import { beam, block, hex, shade } from '../kit.ts'
import { along, cornice } from './louvre-palace.ts'
import { arcade, archRing } from './palaces/common.ts'
import { VOSGES_CORNERS, VOSGES_PARTS, VOSGES_PASSAGES, VOSGES_RINGS, VOSGES_RUNS } from './place-vosges-plan.ts'

const FIXED = 0
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
type V3 = [number, number, number]

/**
 * THE PLACE DES VOSGES (1605–1612): 36 pavilions, nine to a side round a square 140 m across, all one design, read off Commons photographs
 * ("Place des Vosges 2013", the Pavillon du Roi from the garden; "Immeuble sur la Place des Vosges", a house's elevation) and the lidar.
 *
 * - a stone arcade, the arches the width of a window bay, a deep gallery behind (OSM: the upper floors are `building:part`s over it);
 * - two storeys of red brick over it, every window in a stone frame, the first floor's with a balustrade and a pediment or flat-topped hood,
 *   stone string courses, stone quoins up both ends of every house, a stone cornice;
 * - a very steep slate roof per house (the lidar's ridges stand 24–25 m, 10 m over the eaves), two rows of stone-framed dormers, tall brick
 *   stacks on the party walls with the roofs' stone copings between them;
 * - the middle house of the south front (Pavillon du Roi) and of the north (Pavillon de la Reine): taller, five bays, hipped roof, a great
 *   arched passage between two small doors.
 *
 * Plan metres east / north of the garden's centre (the entry stands there). Each front is walked with the garden on its right and drawn by
 * `along` on z = 0 (outside −z, the house behind it +z); the buildings' own OSM outlines are raised behind as plain walls.
 */
// ---- tunable: the plan
export const HOUSES = 9           // per side
export const PAVILION = 4         // which house of the south and the north fronts is the Pavillon
export const BAYS = 4
export const PAV_BAYS = 5
export const DEPTH = 13.2         // the roofed block, front to back
export const OVER = 0.55          // the eaves' overhang
export const FLOOR = 0.5          // the model's ground
// ---- tunable: the elevation (metres over the pavement)
export const G = 5.3              // the arcade's top: the string course's foot
export const ARC_D = 4.8          // the arcade's depth
export const ARCH_FRAC = 0.64
export const ARCH_H = 4.35
export const EAVES = 14.6
export const RIDGE = 24.6
export const PAV_EAVES = 16.3
export const PAV_RIDGE = 26.4
export const BAL = [5.62, 6.4]    // the first floor's balustrade
export const F1 = [6.4, 9.4]
export const BAND = [10.2, 10.5]  // the string course between the floors
export const F2 = [10.9, 13.3]
export const WIN = 0.31           // a window's width over the bay
export const FRAME = 0.3
export const QUOIN = [0.95, 0.55] // alternate quoin widths
export const QUOIN_H = 0.58
export const DORMER_W = 1.5
export const DORMER_H = 2.0
export const DORMER_FOOT = 0.45   // over the eaves
export const UP_FOOT = 4.7        // the upper dormers
export const UP_W = 1.05
export const COPING = 0.12        // the stone edge of a party wall over the slates
export const STACK = 2.6          // how far a chimney stands over the ridge
export const BACK_H = EAVES - 0.4 // the plain backs' wall head
export const BACK_BAY = 4.4
export const BACK_ROWS = [1.4, 5.2, 9.0, 12.2]

// ---- tunable: colours
const BRICK: Rgb = hex('#a9553b')
const STONE: Rgb = hex('#ddd3bd')
const STONE_D: Rgb = shade(STONE, 0.82)
const SLATE: Rgb = hex('#4a505a')
const SLATE_HI: Rgb = hex('#58606b')
const GLASS: Rgb = [0.18, 0.21, 0.26]
const DARK: Rgb = [0.1, 0.09, 0.09]
const IRON: Rgb = [0.12, 0.12, 0.13]

const N_SIDE = 4
const hash = (n: number): number => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s) }

// ---- the local frame: x along the front, y up, z = 0 the front, outside −z
const face = (q: MeshBuilder, x0: number, x1: number, y0: number, y1: number, d: number, c: Rgb): void => {
  q.quad([[x0, y0, -d], [x1, y0, -d], [x1, y1, -d], [x0, y1, -d]], [0, 0, -1], UV, c, FIXED)
}
const tri = (q: MeshBuilder, a: V3, b: V3, c: V3, n: V3, col: Rgb): void => { q.quad([a, b, c, c], n, UV, col, FIXED) }
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
function normalOf(a: V3, b: V3, c: V3): V3 {
  const u = sub(b, a), v = sub(c, a)
  const n: V3 = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]
  const l = Math.hypot(...n) || 1
  return [n[0] / l, n[1] / l, n[2] / l]
}
/** A quad whose normal is taken from its corners, flipped to point away from `from`. */
function sheet(q: MeshBuilder, p: [V3, V3, V3, V3], col: Rgb, up = true): void {
  let n = normalOf(p[0], p[1], p[2])
  if ((n[1] < 0) === up) n = [-n[0], -n[1], -n[2]]
  q.quad(p, n, UV, col, FIXED)
}

interface House { W: number; pav: boolean; tone: number; endL: boolean; endR: boolean }

function window(q: MeshBuilder, x: number, bw: number, y0: number, y1: number, first: boolean, odd: boolean): void {
  const hw = (bw * WIN) / 2
  const f = FRAME
  // the stone frame, a hand proud of the brick (faces only: there are 300 of these); the glass inside it
  face(q, x - hw - f, x - hw, y0 - 0.05, y1 + f, 0.08, STONE)
  face(q, x + hw, x + hw + f, y0 - 0.05, y1 + f, 0.08, STONE)
  face(q, x - hw, x + hw, y1, y1 + f, 0.1, STONE)
  block(q, x - hw - f - 0.08, x + hw + f + 0.08, -0.2, 0, y0 - 0.2, y0, STONE)
  face(q, x - hw, x + hw, y0, y1, 0.04, GLASS)
  // the mullion and the transom
  face(q, x - 0.035, x + 0.035, y0, y1, 0.07, STONE)
  face(q, x - hw, x + hw, y0 + (y1 - y0) * 0.64, y0 + (y1 - y0) * 0.64 + 0.07, 0.07, STONE)
  if (first) {
    // the pediment or the flat hood over the frame
    const xa = x - hw - f - 0.18, xb = x + hw + f + 0.18, yt = y1 + f
    face(q, xa, xb, yt, yt + 0.16, 0.25, STONE)
    if (odd) q.quad([[xa + 0.05, yt + 0.16, -0.28], [xb - 0.05, yt + 0.16, -0.28], [x, yt + 0.72, -0.28], [x, yt + 0.72, -0.28]], [0, 0, -1], UV, STONE_D, FIXED)
    else q.quad([[xa + 0.05, yt + 0.16, -0.28], [xb - 0.05, yt + 0.16, -0.28], [xb - 0.4, yt + 0.42, -0.28], [xa + 0.4, yt + 0.42, -0.28]], [0, 0, -1], UV, STONE_D, FIXED)
    // the balustrade under it: a plinth, the dark of the balusters, the rail
    face(q, x - hw - f - 0.1, x + hw + f + 0.1, BAL[0], BAL[0] + 0.1, 0.3, STONE)
    face(q, x - hw - f, x + hw + f, BAL[0] + 0.1, BAL[1] - 0.1, 0.3, IRON)
    face(q, x - hw - f - 0.1, x + hw + f + 0.1, BAL[1] - 0.1, BAL[1] + 0.05, 0.34, STONE)
  } else {
    // a keystone over the flat lintel
    face(q, x - 0.16, x + 0.16, y1 + 0.02, y1 + f + 0.18, 0.14, STONE)
  }
}

/** A dormer standing on the front slope, its face flush above a foot `yf`, a pediment (or a round head) over it. */
function dormer(q: MeshBuilder, x: number, w: number, yf: number, hh: number, eaves: number, ridge: number, rz: number, round: boolean): void {
  const k = (ridge - eaves) / (rz + OVER)
  const zs = (y: number): number => -OVER + (y - eaves) / k
  const zf = zs(yf + 0.15)
  const yh = yf + hh
  const ap = yh + (round ? 0.55 : 0.6)
  const zb = zs(ap)
  const hw = w / 2
  // the face: a stone surround with the window in it
  face(q, x - hw, x + hw, yf, yh, -zf, STONE)
  face(q, x - hw + 0.28, x + hw - 0.28, yf + 0.22, yh - 0.3, -zf + 0.04, GLASS)
  face(q, x - 0.03, x + 0.03, yf + 0.22, yh - 0.3, -zf + 0.07, STONE)
  // the pediment (a triangle) or the round head
  if (round) {
    for (let i = 0; i < 4; i++) {
      const a0 = Math.PI * (i / 4), a1 = Math.PI * ((i + 1) / 4)
      tri(q, [x, yh, -zf], [x + Math.cos(a0) * hw, yh + Math.sin(a0) * 0.6, -zf], [x + Math.cos(a1) * hw, yh + Math.sin(a1) * 0.6, -zf], [0, 0, -1], STONE)
    }
  } else tri(q, [x - hw - 0.1, yh, -zf], [x + hw + 0.1, yh, -zf], [x, ap, -zf], [0, 0, -1], STONE)
  // the cheeks and the little roof running back into the slope
  for (const s of [-1, 1]) {
    tri(q, [x + s * hw, yf, -zf], [x + s * hw, yh, -zf], [x + s * hw, yh, -zs(yh)], [s, 0, 0], SLATE)
    sheet(q, [[x + s * hw, yh, -zf], [x, ap, -zf], [x, ap, -zb], [x + s * hw, yh, -zs(yh)]], shade(SLATE, 0.92))
  }
}

function stack(q: MeshBuilder, x: number, rz: number, ridge: number): void {
  block(q, x - 0.45, x + 0.45, rz - 0.85, rz + 0.85, ridge - 3, ridge + STACK, shade(BRICK, 0.88))
  block(q, x - 0.55, x + 0.55, rz - 0.95, rz + 0.95, ridge + STACK, ridge + STACK + 0.3, STONE)
  block(q, x - 0.5, x + 0.5, rz - 0.9, rz + 0.9, ridge + STACK + 0.3, ridge + STACK + 0.5, shade(STONE, 0.9))
}

function roof(q: MeshBuilder, h: House, eaves: number, ridge: number): number {
  const { W } = h
  const rz = DEPTH / 2
  const z0 = -OVER, z1 = DEPTH + OVER
  const k = (ridge - eaves) / (rz + OVER)
  const nF: V3 = [0, 1 / Math.hypot(1, k), -k / Math.hypot(1, k)]
  const nB: V3 = [0, 1 / Math.hypot(1, k), k / Math.hypot(1, k)]
  if (h.pav) {
    // hipped: the ridge is what the plan leaves after the hips (a pyramid when the front is no longer than the roof is deep)
    const hr = Math.min((z1 - z0) / 2, W / 2 - 0.05)
    q.quad([[0, eaves, z0], [W, eaves, z0], [W - hr, ridge, rz], [hr, ridge, rz]], nF, UV, SLATE_HI, FIXED)
    q.quad([[W, eaves, z1], [0, eaves, z1], [hr, ridge, rz], [W - hr, ridge, rz]], nB, UV, SLATE, FIXED)
    tri(q, [0, eaves, z1], [0, eaves, z0], [hr, ridge, rz], [-0.8, 0.6, 0], shade(SLATE, 0.95))
    tri(q, [W, eaves, z0], [W, eaves, z1], [W - hr, ridge, rz], [0.8, 0.6, 0], shade(SLATE, 0.95))
    return hr
  }
  q.quad([[0, eaves, z0], [W, eaves, z0], [W, ridge, rz], [0, ridge, rz]], nF, UV, SLATE_HI, FIXED)
  q.quad([[W, eaves, z1], [0, eaves, z1], [0, ridge, rz], [W, ridge, rz]], nB, UV, SLATE, FIXED)
  return 0
}

function house(q: MeshBuilder, h: House): void {
  const { W, pav } = h
  const nb = pav ? PAV_BAYS : BAYS
  const b = W / nb
  const eaves = pav ? PAV_EAVES : EAVES
  const ridge = pav ? PAV_RIDGE : RIDGE
  const lift = eaves - EAVES            // the pavilion's storeys stand taller
  const brick = shade(BRICK, h.tone)
  const y0 = -1.0
  // ---- the arcade: a stone gallery, the arches a window bay wide (the pavilion's: a great arch between two small doors)
  const archSoffit = shade(STONE, 0.7)
  if (!pav) {
    const centres = Array.from({ length: nb }, (_, i) => (i + 0.5) * b)
    arcade(q, 0, 0, W, y0, G, centres, b * ARCH_FRAC, ARCH_H - y0, ARC_D, STONE, archSoffit, DARK, 5)
  } else {
    const c = W / 2
    const big = 3.8
    arcade(q, 0, 0, c - big / 2, y0, G, [1.5 * b], 1.4, 3.2 - y0, ARC_D, STONE, archSoffit, DARK, 4)
    arcade(q, 0, c - big / 2, c + big / 2, y0, G, [c], big, 4.7 - y0, ARC_D, STONE, archSoffit, null, 8)
    arcade(q, 0, c + big / 2, W, y0, G, [3.5 * b], 1.4, 3.2 - y0, ARC_D, STONE, archSoffit, DARK, 4)
    archRing(q, 0, c, 4.7 - big / 2 + 0.0, big / 2, big / 2 + 0.3, 0.12, STONE, STONE, 8)
  }
  // the gallery's ceiling, over the arches
  q.quad([[0, G - 0.05, 0], [W, G - 0.05, 0], [W, G - 0.05, ARC_D], [0, G - 0.05, ARC_D]], [0, -1, 0], UV, shade(STONE, 0.6), FIXED)
  // the rustication: a few courses on the piers
  for (let y = 0.7; y < ARCH_H - 1.2; y += 0.9) face(q, 0, W, y, y + 0.05, 0.02, STONE_D)
  cornice(q, 0, W, G - 0.05, G + 0.3, 0.3, STONE)

  // ---- the upper wall: the brick, the stone chains, the windows
  face(q, 0, W, G + 0.3, eaves, 0, brick)
  // the brick's courses, light lines
  for (let y = G + 0.75; y < eaves - 1; y += 0.9) face(q, 0, W, y, y + 0.04, 0.01, shade(brick, 0.9))
  face(q, 0, W, BAND[0] + lift, BAND[1] + lift, 0.08, STONE)
  for (let i = 0; i < nb; i++) {
    const x = (i + 0.5) * b
    window(q, x, b, F1[0] + (pav ? 0.2 : 0), F1[1] + (pav ? 0.5 : 0), true, i % 2 === 0)
    window(q, x, b, F2[0] + lift, F2[1] + lift + (pav ? 0.2 : 0), false, false)
  }
  // the quoins up both ends
  for (const side of [0, 1]) {
    let k = 0
    for (let y = G + 0.3; y < eaves - 0.6; y += QUOIN_H, k++) {
      const w = QUOIN[k % 2]
      const xa = side === 0 ? 0 : W - w
      face(q, xa, xa + w, y + 0.03, Math.min(y + QUOIN_H - 0.03, eaves - 0.6), 0.07, STONE)
    }
  }
  // the entablature: the frieze band, the cornice over it
  face(q, 0, W, eaves - 1.1, eaves - 0.58, 0.12, STONE)
  cornice(q, -0.05, W + 0.05, eaves - 0.58, eaves, 0.55, STONE)

  // ---- the roof, its dormers, its stacks
  const rz = DEPTH / 2
  roof(q, h, eaves, ridge)
  const k = (ridge - eaves) / (rz + OVER)
  void k
  for (let i = 0; i < nb; i++) dormer(q, (i + 0.5) * b, DORMER_W, eaves + DORMER_FOOT, DORMER_H, eaves, ridge, rz, i % 2 === 1)
  for (let i = 1; i < nb; i += 2) dormer(q, (i + 0.5 - (nb === 4 ? 1 : 0)) * b, UP_W, eaves + UP_FOOT, 1.45, eaves, ridge, rz, true)
  // the party walls rise as a stone coping on each slope, and a stack on the ridge at the left party wall (and the right at a front's end)
  if (!pav) {
    for (const x of [0, W]) {
      beam(q, [x, eaves + 0.05, -OVER], [x, ridge + 0.05, rz], COPING, STONE_D)
      beam(q, [x, ridge + 0.05, rz], [x, eaves + 0.05, DEPTH + OVER], COPING, STONE_D)
    }
    stack(q, 0.45, rz, ridge)
    if (h.endR) stack(q, W - 0.45, rz, ridge)
  } else {
    for (const x of [1.4, W - 1.4]) stack(q, x, rz, ridge - 1.2)
    stack(q, W / 2, rz, ridge)
  }

  // ---- the end walls of a front's last houses, and a gable (the pavilion's roof is hipped)
  for (const [end, x, nx] of [[h.endL, 0, -1], [h.endR, W, 1]] as [boolean, number, number][]) {
    if (!end) continue
    q.quad([[x, y0, 0], [x, y0, DEPTH], [x, eaves, DEPTH], [x, eaves, 0]], [nx, 0, 0], UV, brick, FIXED)
    if (!pav) tri(q, [x, eaves, -OVER], [x, eaves, DEPTH + OVER], [x, ridge, rz], [nx, 0, 0], brick)
    for (const y of BACK_ROWS.slice(1)) for (const zz of [3.2, 9.6]) {
      q.quad([[x + nx * 0.03, y, zz - 0.6], [x + nx * 0.03, y, zz + 0.6], [x + nx * 0.03, y + 1.9, zz + 0.6], [x + nx * 0.03, y + 1.9, zz - 0.6]], [nx, 0, 0], UV, GLASS, FIXED)
    }
  }
}

// ---- the plain backs: every claimed building's outline raised to a wall head under the roofs
function area(r: [number, number][]): number {
  let s = 0
  for (let i = 0; i < r.length; i++) { const j = (i + 1) % r.length; s += r[i][0] * r[j][1] - r[j][0] * r[i][1] }
  return s / 2
}
/** Is the edge one of the four fronts (both ends within a metre and a half of a front's line)? Those are the facade's. */
function onFront(a: [number, number], b: [number, number], lines: { p: [number, number]; t: [number, number]; L: number }[]): boolean {
  return lines.some((l) => {
    const d = (p: [number, number]): number => (p[0] - l.p[0]) * l.t[1] - (p[1] - l.p[1]) * l.t[0]
    const s = (p: [number, number]): number => (p[0] - l.p[0]) * l.t[0] + (p[1] - l.p[1]) * l.t[1]
    return Math.abs(d(a)) < 1.5 && Math.abs(d(b)) < 1.5 && s(a) > -2 && s(a) < l.L + 2 && s(b) > -2 && s(b) < l.L + 2
  })
}

function backs(out: MeshBuilder, lines: { p: [number, number]; t: [number, number]; L: number }[]): void {
  for (const ent of VOSGES_RINGS) {
    const head = ent.h ?? BACK_H
    const caps: { x: number; z: number }[][] = []
    ent.rings.forEach((flat, k) => {
      let pts: [number, number][] = []
      for (let i = 0; i < flat.length; i += 2) pts.push([flat[i], flat[i + 1]])
      if ((area(pts) > 0) !== (k === 0)) pts = pts.reverse()
      caps.push(pts.map((p) => ({ x: p[0], z: p[1] })))
      const n = pts.length
      for (let i = 0; i < n; i++) {
        const a = pts[i], c = pts[(i + 1) % n]
        const L = Math.hypot(c[0] - a[0], c[1] - a[1])
        if (L < 0.4 || onFront(a, c, lines)) continue
        const tx = (c[0] - a[0]) / L, tz = (c[1] - a[1]) / L
        const N: V3 = [tz, 0, -tx]
        out.quad([[a[0], -1, a[1]], [c[0], -1, c[1]], [c[0], head, c[1]], [a[0], head, a[1]]], N, UV, shade(BRICK, 0.9), FIXED)
        if (L >= 3) {
          const nbay = Math.max(1, Math.round((L - 1) / BACK_BAY)), step = (L - 1) / nbay
          for (let j = 0; j < nbay; j++) {
            const u = 0.5 + step * (j + 0.5)
            for (const y of BACK_ROWS) {
              const P = (uu: number, yy: number): V3 => [a[0] + tx * uu + N[0] * 0.04, yy, a[1] + tz * uu + N[2] * 0.04]
              out.quad([P(u - 0.8, y), P(u + 0.8, y), P(u + 0.8, y + 1.9), P(u - 0.8, y + 1.9)], N, UV, GLASS, FIXED)
            }
          }
        }
      }
    })
    capPolygonWithHoles(out, caps, head, shade(SLATE, 0.85), FIXED)
  }
}

/** Every OSM ref the model draws and so claims: the buildings round the square and the parts over the arcades. */
export const VOSGES_REFS: string[] = [...VOSGES_RINGS.map((r) => r.ref), ...VOSGES_PARTS]

/** How many houses the model draws (36 on the real square). */
export const VOSGES_HOUSES = N_SIDE * HOUSES

export function placeVosges(out: MeshBuilder): void {
  const first = out.positions.length / 3
  const lines: { p: [number, number]; t: [number, number]; L: number }[] = []
  for (let k = 0; k < N_SIDE; k++) {
    const A = VOSGES_CORNERS[k], B = VOSGES_CORNERS[(k + 1) % N_SIDE]
    const L = Math.hypot(B[0] - A[0], B[1] - A[1])
    const t: [number, number] = [(B[0] - A[0]) / L, (B[1] - A[1]) / L]
    lines.push({ p: A, t, L })
    const [t0, t1] = VOSGES_RUNS[k]
    const W = (t1 - t0) / HOUSES
    // the pavilion's house stands where the passage goes through, or in the middle
    const pas = VOSGES_PASSAGES.find(([s]) => s === k)
    for (let i = 0; i < HOUSES; i++) {
      const a = t0 + i * W, c = a + W
      const P = (s: number): [number, number] => [A[0] + t[0] * s, A[1] + t[1] * s]
      const pav = !!pas && i === PAVILION
      const hs: House = { W, pav, tone: 0.93 + 0.14 * hash(k * HOUSES + i), endL: i === 0, endR: i === HOUSES - 1 }
      along(out, P(a), P(c), (q) => house(q, hs))
    }
  }
  backs(out, lines)
  // the model's ground is half a metre up (the loader sinks every base by that)
  for (let i = first; i < out.positions.length / 3; i++) out.positions[i * 3 + 1] += FLOOR
}
