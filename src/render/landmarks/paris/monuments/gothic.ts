import type { MeshBuilder } from '../../../buildings.ts'
import { prism, type Rgb } from '../../../models.ts'
import { shade } from '../../kit.ts'
import type { F } from '../palaces/common.ts'
import { domeOf, FIXED, quarter } from './common.ts'

/*
 * The Gothic kit (owner, 2026-10-30: "we need to figure out how to render churches better"; of Saint-Eustache, "incredibly
 * elaborate, and we make a decent attempt, but it doesn't quite get there"). What was wrong with the first attempts is
 * what this is: an opening was a flat dark silhouette on a flat wall, a buttress a straight beam and a pinnacle a spike.
 *
 * Three ideas, and a budget:
 *
 * - A window has DEPTH without a hole in the wall. Everything here is built FORWARD of the block behind it: a thin stone
 *   SCREEN carries the opening, its jambs and soffit running back to the glass, the way an arcade is drawn in
 *   palaces/wall.ts. The block stays solid and cheap.
 * - Tracery is a NET of thin flat bars in front of dark glass (2 triangles a bar), pale on dark, with a few solid bars
 *   (6 triangles) where the eye catches the side of one. A round-headed window of three lights is about 100 triangles
 *   with its screen, 40 without; a rose about 270.
 * - Repeats are the budget: a church has a hundred of these, so `far: true` drops whatever stops reading above the first
 *   storey or across a street. Nothing here makes more than it needs: a fan is drawn two wedges to the quad, a baluster
 *   is two faces, no box has a back or a bottom unless asked.
 *
 * All of it draws on a `Frame`, a wall in the builder's frame: `faceFrame` for the axis-aligned faces of the palaces'
 * convention (`'+x'`, plane; u is then the face's own z or x), `edgeFrame` for any other wall, a chevet's facets or a
 * flank off the axis. `u` along, `y` up, `d` out. `flyingButtress` and `pinnacle` work in the builder's frame directly.
 */

export type V3 = [number, number, number]
type P2 = { x: number; z: number }
type P = [number, number]
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

/** A wall: `P(u, y, d)` is the point `u` along it, `y` up and `d` out of it; `n` its outward normal, `t` the way u runs. */
export interface Frame {
  out: MeshBuilder
  P(u: number, y: number, d: number): V3
  n: V3
  t: V3
}

/** The face `f` of a block at `plane`, u being the plain x (for ±z) or z (for ±x) of the builder's frame. */
export function faceFrame(out: MeshBuilder, f: F, plane: number): Frame {
  const along = f === '-z' || f === '+z'
  const s = f === '-z' || f === '-x' ? -1 : 1
  return {
    out,
    P: along ? (u, y, d) => [u, y, plane + s * d] : (u, y, d) => [plane + s * d, y, u],
    n: along ? [0, 0, s] : [s, 0, 0],
    t: along ? [1, 0, 0] : [0, 0, 1],
  }
}

/** The wall from a to b, u in metres from a, facing away from `inside` (any point within the building). */
export function edgeFrame(out: MeshBuilder, a: P2, b: P2, inside: P2 = { x: 0, z: 0 }): Frame & { L: number } {
  const L = Math.hypot(b.x - a.x, b.z - a.z) || 1
  const tx = (b.x - a.x) / L
  const tz = (b.z - a.z) / L
  let nx = tz
  let nz = -tx
  if (nx * (a.x - inside.x) + nz * (a.z - inside.z) < 0) { nx = -nx; nz = -nz }
  return { out, L, P: (u, y, d) => [a.x + tx * u + nx * d, y, a.z + tz * u + nz * d], n: [nx, 0, nz], t: [tx, 0, tz] }
}

/** A flat rectangle on the wall, `d` out of it. */
export function rect(fr: Frame, u0: number, u1: number, y0: number, y1: number, d: number, c: Rgb): void {
  fr.out.quad([fr.P(u0, y0, d), fr.P(u1, y0, d), fr.P(u1, y1, d), fr.P(u0, y1, d)], fr.n, UV, c, FIXED)
}

/** A bar in the wall's plane from one point to another, `w` wide: flat, 2 triangles. */
export function bar(fr: Frame, a: P, b: P, w: number, d: number, c: Rgb): void {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
  const pu = (-(b[1] - a[1]) / L) * (w / 2)
  const py = ((b[0] - a[0]) / L) * (w / 2)
  fr.out.quad([fr.P(a[0] - pu, a[1] - py, d), fr.P(b[0] - pu, b[1] - py, d), fr.P(b[0] + pu, b[1] + py, d), fr.P(a[0] + pu, a[1] + py, d)], fr.n, UV, c, FIXED)
}

/** The same bar with its two sides running back from `d1` to `d0`: 6 triangles, for the bars whose side is seen. */
export function rib(fr: Frame, a: P, b: P, w: number, d0: number, d1: number, c: Rgb): void {
  bar(fr, a, b, w, d1, c)
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
  const su = -(b[1] - a[1]) / L
  const sy = (b[0] - a[0]) / L
  const dark = shade(c, 0.78)
  for (const s of [-1, 1]) {
    const pu = su * s * (w / 2)
    const py = sy * s * (w / 2)
    const nn: V3 = [fr.t[0] * su * s, sy * s, fr.t[2] * su * s]
    fr.out.quad([fr.P(a[0] + pu, a[1] + py, d0), fr.P(b[0] + pu, b[1] + py, d0), fr.P(b[0] + pu, b[1] + py, d1), fr.P(a[0] + pu, a[1] + py, d1)], nn, UV, dark, FIXED)
  }
}

/** A box out of the wall, front, sides and top (no back, no bottom unless asked): 8 triangles. */
export function boxOn(fr: Frame, u0: number, u1: number, y0: number, y1: number, d0: number, d1: number, c: Rgb, under = false): void {
  rect(fr, u0, u1, y0, y1, d1, c)
  const side = shade(c, 0.86)
  const tn: V3 = fr.t
  fr.out.quad([fr.P(u1, y0, d0), fr.P(u1, y0, d1), fr.P(u1, y1, d1), fr.P(u1, y1, d0)], tn, UV, side, FIXED)
  fr.out.quad([fr.P(u0, y0, d1), fr.P(u0, y0, d0), fr.P(u0, y1, d0), fr.P(u0, y1, d1)], [-tn[0], 0, -tn[2]], UV, side, FIXED)
  fr.out.quad([fr.P(u0, y1, d1), fr.P(u1, y1, d1), fr.P(u1, y1, d0), fr.P(u0, y1, d0)], [0, 1, 0], UV, shade(c, 1.04), FIXED)
  if (under) fr.out.quad([fr.P(u0, y0, d0), fr.P(u1, y0, d0), fr.P(u1, y0, d1), fr.P(u0, y0, d1)], [0, -1, 0], UV, shade(c, 0.6), FIXED)
}

export type Head = 'round' | 'pointed'

/** Where an opening `w` wide and `h` tall from y0 springs. A round head is a half circle; a pointed one rises 0.85 w. */
const springOf = (y0: number, w: number, h: number, head: Head): number => y0 + Math.max(h * 0.4, h - (head === 'round' ? w / 2 : w * 0.85))

/** An arch's edge, from the left springing over to the right: `k` segments (even), `rise` from `spring` to the crown. */
export function archEdge(u: number, spring: number, w: number, rise: number, head: Head, k: number): P[] {
  const pts: P[] = []
  if (head === 'round') {
    for (let i = 0; i <= k; i++) {
      const a = Math.PI * (1 - i / k)
      pts.push([u + Math.cos(a) * (w / 2), spring + Math.sin(a) * rise])
    }
    return pts
  }
  // two arcs, each struck from the opposite springing's side, meeting at the crown
  const R = (w * w / 4 + rise * rise) / w
  const top = Math.asin(Math.min(1, rise / R))
  for (let i = 0; i <= k / 2; i++) {
    const a = (i / (k / 2)) * top
    pts.push([u - w / 2 + R - R * Math.cos(a), spring + R * Math.sin(a)])
  }
  for (let i = k / 2 - 1; i >= 0; i--) {
    const a = (i / (k / 2)) * top
    pts.push([u + w / 2 - R + R * Math.cos(a), spring + R * Math.sin(a)])
  }
  return pts
}

/** The opening's fill: a rectangle under a fan, two wedges to the quad. */
function fillOpening(fr: Frame, u: number, y0: number, spring: number, edge: P[], w: number, d: number, c: Rgb): void {
  rect(fr, u - w / 2, u + w / 2, y0, spring, d, c)
  const m = fr.P(u, spring, d)
  for (let i = 0; i + 2 < edge.length; i += 2) {
    fr.out.quad([m, fr.P(edge[i][0], edge[i][1], d), fr.P(edge[i + 1][0], edge[i + 1][1], d), fr.P(edge[i + 2][0], edge[i + 2][1], d)], fr.n, UV, c, FIXED)
  }
}

/** The stone wall round an arched opening, `d` out: the piers, the sill's part and the spandrels up to `top`. */
function screenRound(fr: Frame, u: number, y0: number, edge: P[], w: number, u0: number, u1: number, base: number, top: number, d: number, c: Rgb): void {
  rect(fr, u0, u - w / 2, base, top, d, c)
  rect(fr, u + w / 2, u1, base, top, d, c)
  if (y0 > base) rect(fr, u - w / 2, u + w / 2, base, y0, d, c)
  // the spandrels, and over a round head the wall between the crown and `top`
  for (let i = 0; i + 1 < edge.length; i++) {
    fr.out.quad([fr.P(edge[i][0], edge[i][1], d), fr.P(edge[i + 1][0], edge[i + 1][1], d), fr.P(edge[i + 1][0], top, d), fr.P(edge[i][0], top, d)], fr.n, UV, c, FIXED)
  }
}

/** The reveal: jambs and soffit from the screen back to the glass; `d0` the back. */
function reveal(fr: Frame, u: number, y0: number, spring: number, edge: P[], w: number, d0: number, d1: number, c: Rgb): void {
  for (const s of [-1, 1]) {
    const nn: V3 = [-s * fr.t[0], 0, -s * fr.t[2]]
    fr.out.quad([fr.P(u + s * w / 2, y0, d0), fr.P(u + s * w / 2, spring, d0), fr.P(u + s * w / 2, spring, d1), fr.P(u + s * w / 2, y0, d1)], nn, UV, c, FIXED)
  }
  for (let i = 0; i + 1 < edge.length; i++) {
    const [ua, ya] = edge[i]
    const [ub, yb] = edge[i + 1]
    const cu = (ua + ub) / 2 - u
    const cy = (ya + yb) / 2 - spring
    const l = Math.hypot(cu, cy) || 1
    const nn: V3 = [(-cu / l) * fr.t[0], -cy / l, (-cu / l) * fr.t[2]]
    fr.out.quad([fr.P(ua, ya, d0), fr.P(ub, yb, d0), fr.P(ub, yb, d1), fr.P(ua, ya, d1)], nn, UV, c, FIXED)
  }
}

export interface Tracery {
  stone: Rgb
  glass: Rgb
  /** round-headed (Saint-Eustache's aisles, its Renaissance dress) or pointed */
  head: Head
  /** lights across, 1 for a plain lancet */
  lights: number
  /** horizontal bars across the lights (default 1 where the window is more than three times as tall as a light) */
  transoms?: number
  /** far: the net without its sub-arches and oculus, for anything high up or across the building */
  far?: boolean
  /**
   * A stone screen standing `d` out of the wall, u0..u1 from `base` to `top`, the window cut through it with its reveal
   * back to the glass: what makes it a window and not a dark shape. Without one the net sits on the wall with a flat rim.
   */
  screen?: { u0: number; u1: number; base: number; top: number; d: number }
}

/**
 * A TRACERY WINDOW centred at `u`, `w` wide, `h` from y0 to the crown: dark glass and a pale stone net. The lights stand
 * under their own little arches, an oculus in what is left of the head and radiating bars to the arch (the net of Saint-
 * Eustache's aisles, on the owner's photograph, and of most churches of its century). 40–100 triangles.
 */
export function traceryWindow(fr: Frame, u: number, y0: number, w: number, h: number, o: Tracery): void {
  const spring = springOf(y0, w, h, o.head)
  const rise = y0 + h - spring
  const k = o.far ? 6 : 8
  const edge = archEdge(u, spring, w, rise, o.head, k)
  const front = o.screen?.d ?? 0.12
  const glassD = 0.03
  const netD = Math.max(0.06, front * 0.5)
  const sw = Math.max(0.09, w * 0.035)
  fillOpening(fr, u, y0, spring, edge, w, glassD, o.glass)
  if (o.screen) {
    const s = o.screen
    screenRound(fr, u, y0, edge, w, s.u0, s.u1, s.base, s.top, s.d, o.stone)
    reveal(fr, u, y0, spring, edge, w, glassD, s.d, shade(o.stone, 0.66))
    // the sill: what the light catches, sloping out of the window
    rect(fr, u - w / 2 - 0.1, u + w / 2 + 0.1, y0 - 0.14, y0, s.d + 0.06, shade(o.stone, 1.05))
  } else {
    // a rim in place of a screen: the jambs and the arch as bars standing on the wall
    const t = Math.max(0.14, w * 0.06)
    for (const s of [-1, 1]) bar(fr, [u + s * (w / 2 + t / 2), y0], [u + s * (w / 2 + t / 2), spring], t, front, o.stone)
    for (let i = 0; i + 1 < edge.length; i++) {
      const out = (p: P): P => {
        const cu = p[0] - u
        const cy = p[1] - spring
        const l = Math.hypot(cu, cy) || 1
        return [p[0] + (cu / l) * (t / 2), p[1] + (cy / l) * (t / 2)]
      }
      bar(fr, out(edge[i]), out(edge[i + 1]), t, front, o.stone)
    }
    rect(fr, u - w / 2 - t, u + w / 2 + t, y0 - t, y0, front, o.stone)
  }
  if (o.lights <= 1) return
  const lw = w / o.lights
  // the mullions, solid: their sides are the depth a rider sees going by; only the first is worth the sides high up
  for (let i = 1; i < o.lights; i++) {
    const m = u - w / 2 + i * lw
    if (o.far) bar(fr, [m, y0], [m, spring], sw, netD, o.stone)
    else rib(fr, [m, y0], [m, spring], sw, glassD, netD, o.stone)
  }
  const transoms = o.transoms ?? (spring - y0 > lw * 3 ? 1 : 0)
  for (let i = 1; i <= transoms; i++) {
    const y = y0 + ((spring - y0) * i) / (transoms + 1)
    bar(fr, [u - w / 2, y], [u + w / 2, y], sw * 0.8, netD, o.stone)
  }
  if (o.far) {
    // the head: the mullions carried up to the arch, which from far off is the whole of the net
    for (let i = 1; i < o.lights; i++) {
      const m = u - w / 2 + i * lw
      const yTop = spring + rise * Math.sqrt(Math.max(0, 1 - ((m - u) / (w / 2)) ** 2)) * (o.head === 'round' ? 1 : 0.86)
      bar(fr, [m, spring], [m + (m - u) * 0.3, yTop], sw * 0.8, netD, o.stone)
    }
    return
  }
  // each light's own arch
  for (let i = 0; i < o.lights; i++) {
    const m = u - w / 2 + (i + 0.5) * lw
    const a = archEdge(m, spring, lw, o.head === 'round' ? lw / 2 : lw * 0.8, o.head, 4)
    for (let j = 0; j + 1 < a.length; j++) bar(fr, a[j], a[j + 1], sw * 0.7, netD, o.stone)
  }
  // the oculus in what is left of the head, and the bars out to the arch
  const headLeft = rise - (o.head === 'round' ? lw / 2 : lw * 0.8)
  if (headLeft > 0.5) {
    const r = Math.min(headLeft * 0.33, w * 0.17)
    const cy = spring + (o.head === 'round' ? lw / 2 : lw * 0.8) + headLeft * 0.42
    for (let i = 0; i < 6; i++) {
      const a0 = (i / 6) * Math.PI * 2
      const a1 = ((i + 1) / 6) * Math.PI * 2
      bar(fr, [u + Math.cos(a0) * r, cy + Math.sin(a0) * r], [u + Math.cos(a1) * r, cy + Math.sin(a1) * r], sw * 0.7, netD, o.stone)
    }
    for (const s of [-1, 1]) {
      bar(fr, [u + s * r * 0.8, cy - r * 0.6], [u + s * lw * (o.lights % 2 ? 0.5 : 1), spring + lw * 0.42], sw * 0.6, netD, o.stone)
      bar(fr, [u + s * r * 0.8, cy + r * 0.6], [u + s * w * 0.3, spring + rise * 0.8], sw * 0.6, netD, o.stone)
    }
  }
}

export interface Rose {
  stone: Rgb
  glass: Rgb
  /** radiating bars (default 12); fewer on a small rose */
  spokes?: number
  /** how far its frame stands out of the wall (default 0.3) */
  d?: number
  /** a square panel of wall round it, half this wide, at the frame's depth: the rose cut through a stone sheet */
  panel?: number
  far?: boolean
}

/**
 * A ROSE WINDOW at (u, y), `r` to the glass's edge: a moulded rim with its reveal back to the glass, a hub, spokes out of
 * it to a ring, and between the spokes the pointed heads of the petals. 50 triangles `far`, about 270 near.
 */
export function roseWindow(fr: Frame, u: number, y: number, r: number, o: Rose): void {
  const n = o.spokes ?? 12
  const d = o.d ?? 0.3
  const g = 0.04
  const k = o.far ? 12 : 16
  const at = (a: number, rr: number): P => [u + Math.cos(a) * rr, y + Math.sin(a) * rr]
  const net = d * 0.5
  const t = r * 0.09
  // the glass: two wedges to the quad
  for (let i = 0; i < k; i += 2) {
    const [a, b, c] = [i, i + 1, i + 2].map((j) => at((j / k) * Math.PI * 2, r))
    fr.out.quad([fr.P(u, y, g), fr.P(a[0], a[1], g), fr.P(b[0], b[1], g), fr.P(c[0], c[1], g)], fr.n, UV, o.glass, FIXED)
  }
  const dark = shade(o.stone, 0.66)
  for (let i = 0; i < k; i++) {
    const a0 = (i / k) * Math.PI * 2
    const a1 = ((i + 1) / k) * Math.PI * 2
    const [p0, p1] = [at(a0, r), at(a1, r)]
    const [q0, q1] = [at(a0, r + t), at(a1, r + t)]
    // the rim, and its reveal back to the glass
    fr.out.quad([fr.P(p0[0], p0[1], d), fr.P(p1[0], p1[1], d), fr.P(q1[0], q1[1], d), fr.P(q0[0], q0[1], d)], fr.n, UV, shade(o.stone, 1.05), FIXED)
    if (!o.far) {
      const am = (a0 + a1) / 2
      const nn: V3 = [-Math.cos(am) * fr.t[0], -Math.sin(am), -Math.cos(am) * fr.t[2]]
      fr.out.quad([fr.P(p0[0], p0[1], g), fr.P(p1[0], p1[1], g), fr.P(p1[0], p1[1], d), fr.P(p0[0], p0[1], d)], nn, UV, dark, FIXED)
    }
  }
  if (o.panel) {
    // the sheet of wall round it: a fan from each corner to its quarter of the rim
    const w = o.panel
    for (let q = 0; q < 4; q++) {
      const a0 = (q / 4) * Math.PI * 2
      const cu = u + (q === 0 || q === 3 ? w : -w)
      const cy = y + (q < 2 ? w : -w)
      for (let i = 0; i < k / 4; i++) {
        const p0 = at(a0 + (i / k) * Math.PI * 2, r + t * 0.5)
        const p1 = at(a0 + ((i + 1) / k) * Math.PI * 2, r + t * 0.5)
        fr.out.quad([fr.P(cu, cy, d), fr.P(p0[0], p0[1], d), fr.P(p1[0], p1[1], d), fr.P(cu, cy, d)], fr.n, UV, o.stone, FIXED)
      }
    }
  }
  const sw = Math.max(0.08, r * 0.035)
  const hub = r * 0.16
  const ring = r * 0.62
  // the hub, as a disc in stone
  for (let i = 0; i < 6; i += 2) {
    const [a, b, c] = [i, i + 1, i + 2].map((j) => at((j / 6) * Math.PI * 2, hub))
    fr.out.quad([fr.P(u, y, net), fr.P(a[0], a[1], net), fr.P(b[0], b[1], net), fr.P(c[0], c[1], net)], fr.n, UV, shade(o.stone, 1.05), FIXED)
  }
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    const b = ((i + 0.5) / n) * Math.PI * 2
    const c = ((i + 1) / n) * Math.PI * 2
    if (o.far) { bar(fr, at(a, hub), at(a, r), sw, net, o.stone); continue }
    rib(fr, at(a, hub), at(a, r), sw * 1.2, g, net, o.stone)
    // the ring across the spokes, and a petal's pointed head between each pair
    bar(fr, at(a, ring), at(c, ring), sw * 0.8, net, o.stone)
    bar(fr, at(a, r * 0.8), at(b, r * 0.97), sw * 0.7, net, o.stone)
    bar(fr, at(c, r * 0.8), at(b, r * 0.97), sw * 0.7, net, o.stone)
    // the inner bar halving the petal, out from the ring
    bar(fr, at(b, ring), at(b, r * 0.97), sw * 0.6, net, o.stone)
  }
}

export interface BalustradeOpts {
  stone: Rgb
  /** how far its front stands out of the wall (default 0.4) */
  d?: number
  /** baluster spacing (default 0.75; 1.2 and more high up, where they only make a line of shadow) */
  pitch?: number
  /** a pedestal every this many balusters (default 6) */
  every?: number
}

/**
 * A BALUSTRADE along the wall from u0 to u1 standing on y, `h` tall: a plinth, a rail, pedestals, and between them
 * balusters of two faces each. 8 triangles a rail and 4 a baluster: the palaces' version costs a third again as much
 * for what cannot be told apart from here.
 */
export function gothicBalustrade(fr: Frame, u0: number, u1: number, y: number, h: number, o: BalustradeOpts): void {
  const d = o.d ?? 0.4
  const pitch = o.pitch ?? 0.75
  const every = o.every ?? 6
  const plinth = h * 0.16
  const rail = h * 0.14
  boxOn(fr, u0, u1, y, y + plinth, 0, d, o.stone)
  boxOn(fr, u0, u1, y + h - rail, y + h, 0, d + 0.04, shade(o.stone, 1.04), true)
  const n = Math.max(2, Math.round((u1 - u0) / pitch))
  const step = (u1 - u0) / n
  const yb0 = y + plinth
  const yb1 = y + h - rail
  const hw = Math.min(0.12, step * 0.26)
  for (let i = 0; i <= n; i++) {
    const u = u0 + i * step
    if (i % every === 0) {
      boxOn(fr, u - 0.2, u + 0.2, yb0, yb1, 0, d + 0.03, shade(o.stone, 1.02))
      continue
    }
    // two faces meeting at the front: a square baluster set corner-on, lit differently on its two sides
    const dm = d - 0.04
    const nl: V3 = [fr.n[0] * 0.7 - fr.t[0] * 0.7, 0, fr.n[2] * 0.7 - fr.t[2] * 0.7]
    const nr: V3 = [fr.n[0] * 0.7 + fr.t[0] * 0.7, 0, fr.n[2] * 0.7 + fr.t[2] * 0.7]
    fr.out.quad([fr.P(u - hw, yb0, dm - hw), fr.P(u, yb0, dm), fr.P(u, yb1, dm), fr.P(u - hw, yb1, dm - hw)], nl, UV, o.stone, FIXED)
    fr.out.quad([fr.P(u, yb0, dm), fr.P(u + hw, yb0, dm - hw), fr.P(u + hw, yb1, dm - hw), fr.P(u, yb1, dm)], nr, UV, shade(o.stone, 0.92), FIXED)
  }
}

/**
 * A PILASTER on the wall at u from y0 to y1, `w` wide, standing `d` out: a base, a fluted shaft (two dark lines), and a
 * capital that flares to an abacus, which from the pavement is what a Corinthian cap comes to. About 30 triangles.
 */
export function pilaster(fr: Frame, u: number, y0: number, y1: number, w: number, d: number, stone: Rgb): void {
  const capH = Math.min(1.0, w * 1.05)
  const baseH = w * 0.55
  const hw = w / 2
  boxOn(fr, u - hw - 0.08, u + hw + 0.08, y0, y0 + baseH, 0, d + 0.08, shade(stone, 1.03))
  boxOn(fr, u - hw, u + hw, y0 + baseH, y1 - capH, 0, d, stone)
  for (const s of [-0.3, 0.3]) rect(fr, u + s * w - 0.025, u + s * w + 0.025, y0 + baseH + 0.15, y1 - capH - 0.15, d + 0.01, shade(stone, 0.7))
  // the bell, flaring out of the shaft's head, and the abacus
  const yb = y1 - capH
  const ya = y1 - capH * 0.25
  const flare = w * 0.18
  const c = shade(stone, 1.03)
  fr.out.quad([fr.P(u - hw, yb, d), fr.P(u + hw, yb, d), fr.P(u + hw + flare, ya, d + flare), fr.P(u - hw - flare, ya, d + flare)], fr.n, UV, c, FIXED)
  for (const s of [-1, 1]) {
    fr.out.quad([fr.P(u + s * hw, yb, d), fr.P(u + s * hw, yb, 0), fr.P(u + s * (hw + flare), ya, 0), fr.P(u + s * (hw + flare), ya, d + flare)], [fr.t[0] * s, 0, fr.t[2] * s], UV, shade(c, 0.86), FIXED)
  }
  boxOn(fr, u - hw - flare - 0.05, u + hw + flare + 0.05, ya, y1, 0, d + flare + 0.05, c)
}

/**
 * A stack of niches up a pier's face: a dark round-headed niche under a little canopy, and in it the pale mass of a figure.
 * The "sculpted" of a sculpted buttress, at 26 triangles a niche.
 */
export function niche(fr: Frame, u: number, y0: number, w: number, h: number, d: number, stone: Rgb, dark: Rgb): void {
  const spring = y0 + h - w / 2
  const edge = archEdge(u, spring, w, w / 2, 'round', 4)
  fillOpening(fr, u, y0, spring, edge, w, d + 0.02, dark)
  // the figure, and the canopy over it
  rect(fr, u - w * 0.18, u + w * 0.18, y0 + 0.1, y0 + h * 0.72, d + 0.05, shade(stone, 1.02))
  rect(fr, u - w * 0.1, u + w * 0.1, y0 + h * 0.72, y0 + h * 0.84, d + 0.05, shade(stone, 1.02))
  boxOn(fr, u - w * 0.65, u + w * 0.65, y0 + h, y0 + h + 0.22, 0, d + 0.2, shade(stone, 1.05))
  boxOn(fr, u - w * 0.5, u + w * 0.5, y0 - 0.2, y0, 0, d + 0.14, shade(stone, 1.03))
}

/**
 * A PINNACLE, stacked: a shaft, a wider gabled tier with a dark slit, a slimmer tier, and a needle. Its plain three-prism
 * form (`tiers: 1`, 24 triangles) is the one for a row of them along a wall; 2 stacks one more for the great piers.
 */
export function pinnacle(out: MeshBuilder, x: number, z: number, y0: number, h: number, w: number, c: Rgb, tiers = 1): void {
  const hw = w * 0.72
  const shaft = h * (tiers > 1 ? 0.3 : 0.42)
  prism(out, x, z, y0, y0 + shaft, hw, 4, c, FIXED, hw, false)
  let y = y0 + shaft
  const stage = h * 0.2
  prism(out, x, z, y, y + stage * 0.35, hw, 4, shade(c, 1.05), FIXED, hw * 1.22, false)
  prism(out, x, z, y + stage * 0.35, y + stage, hw * 1.22, 4, shade(c, 0.98), FIXED, hw * 0.72, false)
  y += stage
  if (tiers > 1) {
    prism(out, x, z, y, y + stage * 0.8, hw * 0.62, 4, c, FIXED, hw * 0.62, false)
    y += stage * 0.8
  }
  prism(out, x, z, y, y0 + h, hw * 0.62, 4, shade(c, 1.04), FIXED, 0.03, false)
}

/**
 * ONE FLIGHT OF A FLYING BUTTRESS, from the head of a pier to the wall it holds up: the arch that reads, not a beam. Its
 * top runs STRAIGHT from pier to wall; its underside is an arc that leaves the pier low and steep and flattens into the
 * wall, so the web is deep at the pier and thin at the wall, which is a flyer's silhouette from any distance. `w` its
 * thickness across, `k` the arc's segments. (2k quads of web, k of soffit, one top: 26 triangles at 4.)
 */
export function flyingButtress(out: MeshBuilder, pier: V3, wall: V3, w: number, c: Rgb, o: { k?: number; drop?: number; thin?: number } = {}): void {
  const k = o.k ?? 4
  const dx = wall[0] - pier[0]
  const dz = wall[2] - pier[2]
  const span = Math.hypot(dx, dz) || 1
  const tx = dx / span
  const tz = dz / span
  const sx = tz * (w / 2)
  const sz = -tx * (w / 2)
  const thin = o.thin ?? Math.max(0.3, span * 0.07)
  const drop = o.drop ?? span * 0.55
  const top = (t: number): number => pier[1] + (wall[1] - pier[1]) * t
  // the soffit's quadratic: it starts `drop` under the top at the pier and ends `thin` under it at the wall
  const y0 = pier[1] - drop
  const y2 = wall[1] - thin
  const y1 = y2 - thin * 0.3
  const under = (t: number): number => (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * y1 + t * t * y2
  const pt = (t: number, y: number, s: number): V3 => [pier[0] + dx * t + sx * s, y, pier[2] + dz * t + sz * s]
  const nSide: V3 = [tz, 0, -tx]
  const upN = Math.hypot(wall[1] - pier[1], span)
  const topN: V3 = [(-tx * (wall[1] - pier[1])) / upN, span / upN, (-tz * (wall[1] - pier[1])) / upN]
  out.quad([pt(0, top(0), -1), pt(0, top(0), 1), pt(1, top(1), 1), pt(1, top(1), -1)], topN, UV, shade(c, 1.04), FIXED)
  for (let i = 0; i < k; i++) {
    const a = i / k
    const b = (i + 1) / k
    for (const s of [-1, 1]) {
      out.quad([pt(a, under(a), s), pt(b, under(b), s), pt(b, top(b), s), pt(a, top(a), s)], [nSide[0] * s, 0, nSide[2] * s], UV, c, FIXED)
    }
    const dyu = under(b) - under(a)
    const l = Math.hypot(dyu, span / k)
    const nu: V3 = [(tx * dyu) / l, -(span / k) / l, (tz * dyu) / l]
    out.quad([pt(a, under(a), -1), pt(b, under(b), -1), pt(b, under(b), 1), pt(a, under(a), 1)], nu, UV, shade(c, 0.7), FIXED)
  }
}

/**
 * A ROUND TURRET on a point with a little domed cap and a finial: a drum, a course at its head, the dome, the ball. For a
 * frontispiece's corners. About 90 triangles at the default 8 sides.
 */
export function cappedTurret(out: MeshBuilder, x: number, z: number, y0: number, y1: number, r: number, stone: Rgb, cap: Rgb, sides = 8): void {
  prism(out, x, z, y0 - r * 1.1, y0, r * 0.45, sides, stone, FIXED, r, false)
  prism(out, x, z, y0, y1, r, sides, stone, FIXED, r, false)
  prism(out, x, z, y0 + (y1 - y0) * 0.5, y0 + (y1 - y0) * 0.5 + 0.25, r + 0.1, sides, shade(stone, 1.05), FIXED, r + 0.1, false)
  prism(out, x, z, y1, y1 + 0.35, r + 0.16, sides, shade(stone, 1.05), FIXED, r + 0.16, false)
  domeOf(out, x, z, y1 + 0.35, r + 0.02, r * 1.5, cap, quarter, { sides, steps: 3 })
  prism(out, x, z, y1 + 0.35 + r * 1.45, y1 + 0.35 + r * 1.45 + 1.0, r * 0.14, 4, shade(cap, 0.9), FIXED, 0.02, false)
}

export interface PortalOpts {
  stone: Rgb
  dark: Rgb
  door: Rgb
  /** how deep the arch is, in all (default 1.0): the first order at the wall's face this far out, the last at 0.1 */
  depth?: number
  /** receding orders of moulding (default 3) */
  orders?: number
  head?: Head
}

/**
 * A DEEP ARCHED PORTAL at `u`, `w` wide at its outermost and `h` to its crown: receding orders of moulding, each with its
 * reveal; at the back, paired doors on either side of a central pier under a lintel, and over the lintel a FAN of tracery
 * in dark glass. About 170 triangles at 3 orders.
 */
export function gothicPortal(fr: Frame, u: number, y0: number, w: number, h: number, o: PortalOpts): void {
  const orders = o.orders ?? 3
  const depth = o.depth ?? 1.0
  const head: Head = o.head ?? 'round'
  const k = 8
  const edgeOf = (ww: number, hh: number): { edge: P[]; spring: number } => {
    const spring = springOf(y0, ww, hh, head)
    return { edge: archEdge(u, spring, ww, y0 + hh - spring, head, k), spring }
  }
  const dark = shade(o.stone, 0.62)
  // from the outer order in: each a flat ring of stone at its depth, and a reveal back to the next
  for (let j = 0; j < orders; j++) {
    const f0 = 1 - (j * 0.34) / orders
    const f1 = 1 - ((j + 1) * 0.34) / orders
    const d0 = 0.1 + (depth - 0.1) * (1 - j / orders)
    const d1 = 0.1 + (depth - 0.1) * (1 - (j + 1) / orders)
    const a = edgeOf(w * f0, h * (0.76 + 0.24 * f0))
    const b = edgeOf(w * f1, h * (0.76 + 0.24 * f1))
    const c = shade(o.stone, 1.05 - j * 0.06)
    for (let i = 0; i < k; i++) {
      fr.out.quad([fr.P(a.edge[i][0], a.edge[i][1], d0), fr.P(a.edge[i + 1][0], a.edge[i + 1][1], d0), fr.P(b.edge[i + 1][0], b.edge[i + 1][1], d0), fr.P(b.edge[i][0], b.edge[i][1], d0)], fr.n, UV, c, FIXED)
    }
    for (const s of [-1, 1]) rect(fr, s < 0 ? u - w * f0 / 2 : u + w * f1 / 2, s < 0 ? u - w * f1 / 2 : u + w * f0 / 2, y0, Math.min(a.spring, b.spring), d0, c)
    reveal(fr, u, y0, b.spring, b.edge, w * f1, d1, d0, dark)
  }
  // the back of the arch: the last order's opening
  const fin = 1 - 0.34
  const { edge, spring } = edgeOf(w * fin, h * (0.76 + 0.24 * fin))
  const ww = w * fin
  const back = 0.1
  const lintel = y0 + (spring - y0) * 0.92
  fillOpening(fr, u, lintel, spring, edge, ww, back - 0.02, o.dark)
  rect(fr, u - ww / 2, u + ww / 2, y0, lintel, back - 0.02, o.door)
  // the lintel, the central pier between the doors, and the doors' own panels
  boxOn(fr, u - ww / 2, u + ww / 2, lintel - 0.18, lintel + 0.18, back - 0.02, back + 0.15, shade(o.stone, 1.03))
  boxOn(fr, u - 0.22, u + 0.22, y0, lintel - 0.18, back - 0.02, back + 0.25, o.stone)
  for (const s of [-1, 1]) {
    const c = u + s * ww / 4
    rect(fr, c - 0.03, c + 0.03, y0, lintel - 0.18, back, shade(o.door, 0.55))
    rect(fr, c - ww / 4 + 0.3, c + ww / 4 - 0.3, y0 + (lintel - y0) * 0.5, y0 + (lintel - y0) * 0.53, back, shade(o.door, 0.6))
  }
  // the fan: spokes from the lintel's middle to the arch, a small half-wheel at their foot
  const rise = y0 + h * (0.76 + 0.24 * fin) - lintel
  const m: P = [u, lintel + 0.18]
  for (let i = 1; i < 7; i++) {
    const a = (i / 7) * Math.PI
    const r = Math.sqrt(1 / ((Math.cos(a) / (ww / 2)) ** 2 + (Math.sin(a) / rise) ** 2))
    bar(fr, [m[0] + Math.cos(a) * 0.5, m[1] + Math.sin(a) * 0.5], [m[0] + Math.cos(a) * r, m[1] + Math.sin(a) * r], 0.1, back + 0.02, o.stone)
  }
  for (let i = 0; i < 4; i++) {
    const a0 = (i / 4) * Math.PI
    const a1 = ((i + 1) / 4) * Math.PI
    bar(fr, [m[0] + Math.cos(a0) * 0.55, m[1] + Math.sin(a0) * 0.55], [m[0] + Math.cos(a1) * 0.55, m[1] + Math.sin(a1) * 0.55], 0.12, back + 0.02, o.stone)
  }
}
