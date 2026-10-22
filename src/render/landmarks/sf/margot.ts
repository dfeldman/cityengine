/**
 * The Margot, 1321 Mission Street at 9th (way/227005944): eleven storeys of affordable housing, opened as the
 * Panoramic, renamed the Margot. From the owner's Street View frame (Sep 2026, from across Mission at 1310) and
 * the older Mapillary frames in docs/shots/refs/margot (01: the corner and its blade sign from 9th).
 *
 * What the photographs show: the whole building is clad in flat metal rainscreen panels, two to a storey, and they
 * shine — cream on the corner and the long Mission front, a darker silver-grey on the wing at the 10th Street end.
 * The windows are punched, square-ish, and STAGGERED floor to floor rather than stacked; the middle of the Mission
 * front breaks into a sawtooth of shallow angled bays, each with a pair of windows and a slot of louvres beside it.
 * A tall glass shopfront runs under a thin canopy on Mission and 9th, with a ledge above it; and on the corner
 * stands the tall blue blade sign, edged red, THE MARGOT down it in white.
 *
 * The bake's restyle had it as blue stucco (tierB-2, 2026-10-04), the "bright blue building" the owner flagged.
 * Every panel face is the `panel` surface (cartoon-material.ts): half mirror, each panel a little out of true, so
 * the walls catch the sky and the sun panel by panel.
 *
 * The frame: the real outline. The Mission front is the edge facing local −z (the manifest gives its bearing, 315); the
 * 9th Street front is the edge before it
 * (the outline runs anticlockwise, so the corner is where the front starts), and the rest is the back of the lot.
 */
import type { MeshBuilder } from '../../buildings.ts'
import { capPolygon } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { type Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { boxAlong, edgeAt, signText } from '../parts.ts'

type P2 = { x: number; z: number }
export type Edge = ReturnType<typeof edgeAt>
const FIXED = 0
const PANEL = surfaceTag('panel')
const GLASS_T = surfaceTag('glass')
const GRANITE = surfaceTag('granite')

const CREAM: Rgb = [0.98, 0.94, 0.85]
const SILVER: Rgb = [0.56, 0.59, 0.63]
const FRAME: Rgb = [0.52, 0.54, 0.56]
const GLASS: Rgb = [0.3, 0.47, 0.72]
const SHOP: Rgb = [0.13, 0.15, 0.17]
const BASE: Rgb = [0.3, 0.31, 0.32]
const LOUVRE: Rgb = [0.38, 0.38, 0.37]
const ROOF: Rgb = [0.5, 0.5, 0.49]
const SIGN_BLUE: Rgb = [0.13, 0.33, 0.72]
const SIGN_RED: Rgb = [0.78, 0.2, 0.14]
const SIGN_WHITE: Rgb = [0.97, 0.97, 0.95]

/** Heights over the pavement: the tall shop storey, then ten floors to the roof. */
const G = 5.2
const FLOORS = 10

/** A point `u` along an edge and `o` out from it. */
export const at = (e: Edge, u: number, o: number): P2 => ({ x: e.a.x + e.tx * u + e.nx * o, z: e.a.z + e.tz * u + e.nz * o })

/** A box on an edge: `u0..u1` along it, `y0..y1` up, standing `o0..o1` out from the wall. */
export function slab(out: MeshBuilder, e: Edge, u0: number, u1: number, y0: number, y1: number, o0: number, o1: number,
              c: Rgb, tag: number, turn = 0): void {
  const p = at(e, (u0 + u1) / 2, (o0 + o1) / 2)
  boxAlong(out, p.x, (y0 + y1) / 2, p.z, (u1 - u0) / 2, (y1 - y0) / 2, (o1 - o0) / 2, e.heading + turn, c, tag)
}

/**
 * One pane of glass flat on a wall, its uv the window's own (column, floor), so after dark the glass surface lights it
 * as one room.
 */
export function pane(out: MeshBuilder, e: Edge, u: number, y0: number, w: number, h: number, o: number, col: number, row: number,
                     glass: Rgb = GLASS): void {
  const a = at(e, u - w / 2, o)
  const b = at(e, u + w / 2, o)
  const uv: [number, number] = [col + 0.5, row + 0.5]
  out.quad([[a.x, y0, a.z], [b.x, y0, b.z], [b.x, y0 + h, b.z], [a.x, y0 + h, a.z]], [e.nx, 0, e.nz], [uv, uv, uv, uv], glass, GLASS_T)
}

/** A punched window: its frame a few centimetres proud of the cladding, the glass on it. */
function window_(out: MeshBuilder, e: Edge, u: number, y0: number, w: number, h: number, base: number, col: number, row: number): void {
  slab(out, e, u - w / 2 - 0.08, u + w / 2 + 0.08, y0 - 0.08, y0 + h + 0.08, base, base + 0.05, FRAME, FIXED)
  pane(out, e, u, y0, w, h, base + 0.12, col, row)
  // the mullion splitting off the opening light
  slab(out, e, u + w * 0.12 - 0.03, u + w * 0.12 + 0.03, y0, y0 + h, base + 0.12, base + 0.16, FRAME, FIXED)
}

/** A wall of cladding from y0 to y1 along a whole edge, with its punched windows staggered floor to floor. */
function wall(out: MeshBuilder, e: Edge, u0: number, u1: number, y0: number, y1: number, base: number, c: Rgb): void {
  slab(out, e, u0, u1, y0, y1, base - 0.3, base, c, PANEL)
}

/** Punched windows across `u0..u1` on every floor, `n` to a floor, each floor's row shifted a quarter step against the last. */
function punched(out: MeshBuilder, e: Edge, u0: number, u1: number, n: number, w: number, h: number, base: number, colBase: number): void {
  const step = (u1 - u0) / n
  for (let f = 0; f < FLOORS; f++) {
    const y = G + f * fh() + 0.8
    const shift = (f % 2 === 0 ? -0.22 : 0.22) * step
    for (let k = 0; k < n; k++) {
      const u = u0 + step * (k + 0.5) + shift
      if (u - w / 2 < u0 + 0.4 || u + w / 2 > u1 - 0.4) continue
      window_(out, e, u, y, w, h, base, colBase + k, f)
    }
  }
}

let FH = 3.3
const fh = (): number => FH

export function theMargot(out: MeshBuilder, fit: Fit): void {
  // ---- the outline: anticlockwise, with the short kinks and straight-through corners taken out
  let R: P2[] = fit.ring && fit.ring.length >= 4 ? fit.ring.slice() : [
    { x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz },
  ]
  if (Math.hypot(R[0].x - R[R.length - 1].x, R[0].z - R[R.length - 1].z) < 0.3) R = R.slice(0, -1)
  let area = 0
  for (let i = 0; i < R.length; i++) { const a = R[i], b = R[(i + 1) % R.length]; area += a.x * b.z - b.x * a.z }
  if (area < 0) R.reverse()
  for (let k = 0; k < 8 && R.length > 4; k++) {
    const i = R.findIndex((p, j) => {
      const a = R[(j + R.length - 1) % R.length], b = R[(j + 1) % R.length]
      const cross = (p.x - a.x) * (b.z - p.z) - (p.z - a.z) * (b.x - p.x)
      return Math.abs(cross) / (Math.hypot(p.x - a.x, p.z - a.z) * Math.hypot(b.x - p.x, b.z - p.z) || 1) < 0.08
    })
    if (i < 0) break
    R.splice(i, 1)
  }
  const n = R.length
  const edges = R.map((_, i) => edgeAt(R, i))
  // the front is the edge the manifest's bearing turned to face local −z (fitSnug) — NOT the longest: with the kink in the back
  // wall straightened out, the back of the lot is as long as the Mission front, to a few centimetres
  let fi = 0
  edges.forEach((e, i) => { if (e.L > 8 && e.nz < edges[fi].nz) fi = i })
  const front = edges[fi]                       // Mission Street
  const ninth = edges[(fi + n - 1) % n]         // 9th Street, ending at the corner
  const wingSide = edges[(fi + 1) % n]          // the 10th Street end, behind the silver wing

  const H = fit.height
  FH = (H - 1.4 - G) / FLOORS
  const g = Math.max(0, Math.min(fit.grade ?? 0, 2))
  const top = H - 1.4

  // ---- the walls: cladding from the ledge up on the two street fronts, from the ground everywhere behind
  for (let i = 0; i < n; i++) {
    const e = edges[i]
    if (e === front || e === ninth) continue
    wall(out, e, 0, e.L, 0, H, 0, e === wingSide ? SILVER : CREAM)
    // the back of the lot is lit through windows too, a few to a floor (the light courts and the neighbours' roofs)
    punched(out, e, 0, e.L, Math.max(1, Math.round(e.L / 5.5)), 1.5, 1.7, 0, 200 + i * 20)
  }
  capPolygon(out, R, H, ROOF, FIXED)

  // the Mission front's three parts: the cream corner, the sawtooth middle, the silver wing
  const L = front.L
  const c1 = L * 0.38
  const c2 = L * 0.73

  // ---- the shopfront, both streets: dark glass between granite piers, a transom, the ledge and the canopy over it
  for (const e of [front, ninth]) {
    wall(out, e, 0, e.L, g + G - 0.9, top + 1.4, 0, CREAM)
    const bays = Math.max(2, Math.round(e.L / 4.6))
    const bw = e.L / bays
    slab(out, e, 0, e.L, 0, g + G - 0.9, -0.5, -0.45, SHOP, GLASS_T)
    for (let k = 0; k <= bays; k++) {
      const u = Math.min(e.L - 0.3, Math.max(0.3, k * bw))
      slab(out, e, u - 0.3, u + 0.3, 0, g + G - 0.9, -0.5, 0, BASE, GRANITE)
      if (k < bays) {
        // the mullions, the transom
        for (const f of [1 / 3, 2 / 3]) slab(out, e, k * bw + bw * f - 0.05, k * bw + bw * f + 0.05, 0, g + G - 0.9, -0.45, -0.4, FRAME, FIXED)
        slab(out, e, k * bw, (k + 1) * bw, g + 3.3, g + 3.42, -0.45, -0.4, FRAME, FIXED)
      }
    }
    // the dark tile plinth under the glass
    slab(out, e, 0, e.L, 0, g + 0.5, -0.45, -0.3, BASE, GRANITE)
    // the canopy, thin and long, and the ledge the cladding stands on
    slab(out, e, 0.6, e.L - 0.6, g + 4.0, g + 4.12, 0, 1.4, FRAME, PANEL)
    slab(out, e, 0, e.L, g + G - 0.9, g + G - 0.5, 0, 0.35, CREAM, PANEL)
  }

  // ---- the cream corner, on both fronts: punched windows, staggered
  punched(out, ninth, 0.8, ninth.L, Math.max(3, Math.round(ninth.L / 4.4)), 1.7, 1.85, 0, 0)
  punched(out, front, 0.6, c1, 3, 1.7, 1.85, 0, 40)

  // ---- the sawtooth middle: each floor three shallow bays turned a little off the wall, a window pair in each and a
  // slot of louvres beside it, the row shifting floor to floor
  const nb = 3
  const sw = (c2 - c1) / nb
  for (let f = 0; f < FLOORS; f++) {
    const y = G + f * FH + 0.65
    const shift = (f % 2 === 0 ? -0.12 : 0.12) * sw
    for (let k = 0; k < nb; k++) {
      const u = c1 + sw * (k + 0.5) + shift
      const bw = Math.min(2.9, sw * 0.72)
      // the bay: a short block of cladding, angled so one jamb stands 0.6 m proud and the other flush
      slab(out, front, u - bw / 2, u + bw / 2, y - 0.25, y + 2.3, 0, 0.3, CREAM, PANEL, 0.2)
      // the bay's own frame, turned with it, its origin the middle of the bay's face
      const c = Math.cos(0.2), s0 = Math.sin(0.2)
      const tx = front.tx * c + front.nx * s0, tz = front.tz * c + front.nz * s0
      const nx = front.nx * c - front.tx * s0, nz = front.nz * c - front.tz * s0
      const mid = at(front, u, 0.15)
      const turnE: Edge = { ...front, heading: front.heading + 0.2, tx, tz, nx, nz, a: { x: mid.x + nx * 0.15, z: mid.z + nz * 0.15 } }
      for (const s of [-1, 1]) {
        slab(out, turnE, s * 0.66 - 0.62, s * 0.66 + 0.62, y - 0.06, y + 1.96, 0, 0.04, FRAME, FIXED)
        pane(out, turnE, s * 0.66, y, 1.16, 1.9, 0.05, 60 + k * 2 + (s + 1) / 2, f)
      }
      // the louvres in the slot beside it
      slab(out, front, u + bw / 2 + 0.3, u + bw / 2 + 0.7, y + 1.7, y + 2.0, 0, 0.05, LOUVRE, FIXED)
    }
  }

  // ---- the silver wing at the 10th Street end, a few centimetres proud of the cream, two staggered stacks of windows
  slab(out, front, c2, L, G - 0.9 + g, H + 0.4, -0.05, 0.3, SILVER, PANEL)
  punched(out, front, c2, L, 2, 1.45, 1.75, 0.3, 80)
  slab(out, front, c2 - 0.12, c2, G - 0.9 + g, H + 0.4, 0, 0.4, FRAME, FIXED)

  // ---- the roof: a parapet cap, a lift overrun and plant
  for (const e of edges) slab(out, e, 0, e.L, H, H + 0.12, -0.35, 0.02, FRAME, FIXED)
  const mid = at(front, L * 0.5, -edges[(fi + 1) % n].L * 0.45)
  boxAlong(out, mid.x, H + 1.7, mid.z, 4, 1.7, 3, front.heading, SILVER, PANEL)

  // ---- the blade sign on the corner: a blue board edged red, standing out from the Mission front, THE MARGOT down it
  const su = 1.6, sy0 = g + G + 1.0, sy1 = g + G + 1.0 + 17.5, sOut = 2.4
  const sc = at(front, su, 0.3 + sOut / 2)
  const sh = Math.atan2(front.tx, front.tz)       // the board faces along the street
  boxAlong(out, sc.x, (sy0 + sy1) / 2, sc.z, sOut / 2, (sy1 - sy0) / 2, 0.2, sh, SIGN_RED, PANEL)
  for (const s of [-1, 1]) {
    const fx = sc.x + front.tx * s * 0.21, fz = sc.z + front.tz * s * 0.21
    boxAlong(out, fx, (sy0 + sy1) / 2, fz, sOut / 2 - 0.16, (sy1 - sy0) / 2 - 0.16, 0.02, sh, SIGN_BLUE, FIXED)
    const lx = sc.x + front.tx * s * 0.24, lz = sc.z + front.tz * s * 0.24
    signText(out, 'THE MARGOT', lx, (sy0 + sy1) / 2, lz, 1.45, SIGN_WHITE, { vertical: true, heading: s > 0 ? sh : sh + Math.PI, lit: true })
  }
  // its brackets back to the wall
  for (const y of [sy0 + 0.6, sy1 - 0.6]) slab(out, front, su - 0.08, su + 0.08, y - 0.08, y + 0.08, 0, 0.35, FRAME, FIXED)
}

export const MARGOT: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  theMargot,
}
