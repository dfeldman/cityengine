import { MeshBuilder } from '../../../buildings.ts'
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

/* ---------------------------------------------------------------------------------------------------------------
 * The rest of a church (Batch 5, 2026-10-31): what Saint-Eustache drew by hand and every other church wants, so that a
 * church is its dimensions and its own few oddities. The classical pieces are here too, because Paris's churches of the
 * 1600s and 1800s wear theirs on a Gothic or basilican body: Saint-Gervais, Saint-Paul, Saint-Roch, La Trinité.
 */

/** The four faces of a box as frames, for the things put round a tower: u0, u1 along it, m its middle. */
export function boxFaces(out: MeshBuilder, x0: number, x1: number, z0: number, z1: number, only: F[] = ['-z', '+z', '-x', '+x']): { f: F; fr: Frame; u0: number; u1: number; m: number }[] {
  return only.map((f) => {
    const along = f === '-z' || f === '+z'
    const plane = f === '-z' ? z0 : f === '+z' ? z1 : f === '-x' ? x0 : x1
    const [u0, u1] = along ? [x0, x1] : [z0, z1]
    return { f, fr: faceFrame(out, f, plane), u0, u1, m: (u0 + u1) / 2 }
  })
}

/** The same frame `d` further out: for what stands on a pier's or a frontispiece's face. */
export function frameAt(fr: Frame, d: number): Frame {
  return { out: fr.out, n: fr.n, t: fr.t, P: (u, y, dd) => fr.P(u, y, d + dd) }
}

/** Draws in a frame long along z, front at −z, and stands the result long along x with its front at −x: the older models' convention. */
export function turned(out: MeshBuilder, draw: (q: MeshBuilder) => void): void {
  const q = new MeshBuilder()
  draw(q)
  const base = out.positions.length / 3
  // (x, z) → (z, −x): a quarter turn, which keeps a face's winding
  for (let i = 0; i < q.positions.length; i += 3) {
    out.positions.push(q.positions[i + 2], q.positions[i + 1], -q.positions[i])
    out.normals.push(q.normals[i + 2], q.normals[i + 1], -q.normals[i])
  }
  for (const u of q.uvs) out.uvs.push(u)
  for (const c of q.colors) out.colors.push(c)
  for (const i of q.indices) out.indices.push(base + i)
}

/**
 * A GABLE on a wall, its foot y0, `w` across and `h` high at `u`: the wall's triangle, the coping up each rake with its top, a finial at the apex, and if asked `crockets` knobs up each rake. 14 triangles and 4 a crocket.
 */
export function gable(fr: Frame, u: number, y0: number, w: number, h: number, stone: Rgb, o: { d?: number; trim?: Rgb; finial?: number; crockets?: number; back?: number } = {}): void {
  const d = o.d ?? 0.08
  const trim = o.trim ?? shade(stone, 1.05)
  const back = o.back ?? -0.5
  const hw = w / 2
  const top: P = [u, y0 + h]
  fr.out.quad([fr.P(u - hw, y0, d), fr.P(u + hw, y0, d), fr.P(u, y0 + h, d), fr.P(u, y0 + h, d)], fr.n, UV, stone, FIXED)
  const L = Math.hypot(hw, h)
  for (const s of [-1, 1]) {
    const foot: P = [u + s * (hw + 0.28), y0 - 0.12]
    bar(fr, foot, top, 0.5, d + 0.22, trim)
    // the coping's top, running back along the roof
    const up = 0.27
    fr.out.quad([fr.P(foot[0], foot[1] + up, d + 0.22), fr.P(top[0], top[1] + up, d + 0.22), fr.P(top[0], top[1] + up, back), fr.P(foot[0], foot[1] + up, back)], [fr.t[0] * s * (h / L), hw / L, fr.t[2] * s * (h / L)], UV, shade(trim, 1.05), FIXED)
    for (let i = 1; i <= (o.crockets ?? 0); i++) {
      const t = i / ((o.crockets ?? 0) + 1)
      const cu = foot[0] + (top[0] - foot[0]) * t + s * 0.2
      const cy = foot[1] + (top[1] - foot[1]) * t + 0.34
      boxOn(fr, cu - 0.14, cu + 0.14, cy, cy + 0.3, d, d + 0.28, trim)
    }
  }
  if (o.finial !== 0) {
    const [fx, , fz] = fr.P(u, 0, d * 0.5)
    pinnacle(fr.out, fx, fz, y0 + h + 0.15, o.finial ?? h * 0.22, Math.max(0.22, h * 0.035), trim)
  }
}

/** A stepped BUTTRESS up a wall at u: three stages each set back, weathered with a slope at each set-off. 10 triangles a stage. */
export function buttress(fr: Frame, u: number, y0: number, y1: number, w: number, d: number, stone: Rgb, stages = 3): void {
  const hw = w / 2
  const h = (y1 - y0) / stages
  for (let i = 0; i < stages; i++) {
    const a = y0 + h * i
    const b = a + h
    const dd = d * (1 - i / stages)
    const next = d * (1 - (i + 1) / stages)
    const wash = Math.min(0.9, h * 0.25)
    rect(fr, u - hw, u + hw, a, b - wash, dd, stone)
    for (const s of [-1, 1]) {
      const nn: V3 = [fr.t[0] * s, 0, fr.t[2] * s]
      const p0 = fr.P(u + s * hw, a, 0)
      const p1 = fr.P(u + s * hw, a, dd)
      const p2 = fr.P(u + s * hw, b - wash, dd)
      const p3 = fr.P(u + s * hw, b, next)
      const p4 = fr.P(u + s * hw, b, 0)
      fr.out.quad(s > 0 ? [p0, p1, p2, p4] : [p4, p2, p1, p0], nn, UV, shade(stone, 0.84), FIXED)
      fr.out.quad(s > 0 ? [p2, p3, p4, p2] : [p2, p4, p3, p2], nn, UV, shade(stone, 0.84), FIXED)
    }
    // the set-off's wash, catching the sky
    const L = Math.hypot(wash, dd - next) || 1
    fr.out.quad([fr.P(u - hw, b - wash, dd), fr.P(u + hw, b - wash, dd), fr.P(u + hw, b, next), fr.P(u - hw, b, next)], [fr.n[0] * (wash / L), (dd - next) / L, fr.n[2] * (wash / L)], UV, shade(stone, 1.08), FIXED)
  }
}

export interface FlankOpts {
  stone: Rgb
  glass: Rgb
  /** the window's sill and height, its width as a share of the bay (default 0.62) */
  y0: number
  h: number
  head?: Head
  lights?: number
  share?: number
  far?: boolean
  /** a buttress at every division: its head and depth (none if absent), with a pinnacle of this height on it */
  buttress?: { y1: number; d: number; w?: number; pinnacle?: number; stages?: number }
  /** the plinth's height, a string course under the windows, a cornice at this y */
  plinth?: number
  string?: boolean
  cornice?: number
}

/**
 * A FLANK: `n` bays from u0 to u1 on a wall, a window in each, buttresses at the divisions, the plinth, the sill course and the cornice. Windows `far` are about 40 triangles, near about 100; a buttress about 30.
 */
export function flank(fr: Frame, u0: number, u1: number, n: number, o: FlankOpts): void {
  const bay = (u1 - u0) / n
  const trim = shade(o.stone, 1.05)
  const w = bay * (o.share ?? 0.62)
  for (let i = 0; i < n; i++) {
    traceryWindow(fr, u0 + bay * (i + 0.5), o.y0, w, o.h, { stone: o.stone, glass: o.glass, head: o.head ?? 'pointed', lights: o.lights ?? 2, far: o.far ?? true })
  }
  if (o.plinth) boxOn(fr, u0, u1, 0, o.plinth, 0, 0.28, shade(o.stone, 0.92))
  if (o.string) boxOn(fr, u0, u1, o.y0 - 0.35, o.y0 - 0.12, 0, 0.14, trim)
  if (o.cornice) boxOn(fr, u0 - 0.05, u1 + 0.05, o.cornice - 0.45, o.cornice + 0.05, 0, 0.42, trim, true)
  if (o.buttress) {
    const b = o.buttress
    for (let i = 0; i <= n; i++) {
      const u = u0 + bay * i
      buttress(fr, u, 0, b.y1, b.w ?? Math.min(1.1, bay * 0.2), b.d, o.stone, b.stages ?? 3)
      if (b.pinnacle) {
        const [x, , z] = fr.P(u, 0, b.d * 0.34)
        pinnacle(fr.out, x, z, b.y1 - 0.1, b.pinnacle, (b.w ?? 1) * 0.4, trim)
      }
    }
  }
}

/**
 * A POLYGONAL CHEVET round (cx, cz), its round end to +z: `n` facets of a half-ring radius r, walls y0 to the eaves, a window in each, a buttress at each corner, and the half-cone of slate up to `ridge`. Chapels and an ambulatory are a call each. If `rad` the corners carry a flyer back to the wall from a pier that far out.
 */
export function chevet(out: MeshBuilder, cx: number, cz: number, r: number, y0: number, eaves: number, ridge: number, stone: Rgb, slate: Rgb, glass: Rgb, o: { n?: number; win?: { y0: number; h: number; lights?: number; head?: Head; far?: boolean }; butt?: number; rad?: { out: number; y0: number; y1: number; to: number }; lean?: boolean; cornice?: boolean } = {}): void {
  const n = o.n ?? 7
  const P = (i: number, rr: number): P2 => {
    const a = -Math.PI / 2 + (i / n) * Math.PI
    return { x: cx + Math.sin(a) * rr, z: cz + Math.cos(a) * rr }
  }
  const inner = { x: cx, z: cz }
  const eave = 0.35
  for (let i = 0; i < n; i++) {
    const a = P(i, r)
    const b = P(i + 1, r)
    const fr = edgeFrame(out, a, b, inner)
    rect(fr, 0, fr.L, y0, eaves, 0, stone)
    if (o.win) traceryWindow(fr, fr.L / 2, o.win.y0, fr.L * 0.62, o.win.h, { stone, glass, head: o.win.head ?? 'pointed', lights: o.win.lights ?? 2, far: o.win.far ?? true })
    if (o.cornice !== false) boxOn(fr, 0, fr.L, eaves - 0.45, eaves + 0.05, 0, 0.34, shade(stone, 1.05), true)
    const a2 = P(i, r + eave)
    const b2 = P(i + 1, r + eave)
    const mx = (a.x + b.x) / 2 - cx
    const mz = (a.z + b.z) / 2 - cz
    const l = Math.hypot(mx, mz) || 1
    if (o.lean) {
      // a lean-to, up to `ridge` at a ring of r × 0.55: the chapels' ring against the wall behind
      const a3 = P(i, r * 0.55)
      const b3 = P(i + 1, r * 0.55)
      out.quad([[a2.x, eaves, a2.z], [b2.x, eaves, b2.z], [b3.x, ridge, b3.z], [a3.x, ridge, a3.z]], [mx / l * 0.5, 0.86, mz / l * 0.5], UV, slate, FIXED)
    } else {
      out.quad([[a2.x, eaves, a2.z], [b2.x, eaves, b2.z], [cx, ridge, cz], [cx, ridge, cz]], [mx / l * 0.7, 0.72, mz / l * 0.7], UV, slate, FIXED)
    }
  }
  for (let i = 0; i <= n; i++) {
    const a = P(i, r)
    const ux = (a.x - cx) / r
    const uz = (a.z - cz) / r
    if (o.butt) {
      // a corner's buttress: a pier stood on the corner, turned to the radius
      const p = { x: a.x + ux * o.butt * 0.5, z: a.z + uz * o.butt * 0.5 }
      prism(out, p.x, p.z, y0, eaves - 1.4, o.butt * 0.72, 4, stone, FIXED, o.butt * 0.5, false)
    }
    if (o.rad && i > 0 && i < n) {
      const px = a.x + ux * o.rad.out
      const pz = a.z + uz * o.rad.out
      prism(out, px, pz, o.rad.y0, o.rad.y1, 0.7, 4, stone, FIXED, 0.7, false)
      pinnacle(out, px, pz, o.rad.y1, 4, 0.6, shade(stone, 1.05))
      flyingButtress(out, [px - ux * 0.5, o.rad.y1 - 0.6, pz - uz * 0.5], [a.x + ux * 0.05, o.rad.to, a.z + uz * 0.05], 0.55, shade(stone, 0.97), { drop: 2.8, k: 3 })
    }
  }
}

/**
 * THE FLYERS of a straight bay row: at each z, a pier of width w at (pierX) from y0 to y1 with its pinnacle, and an arch up to (wallX, wallY). The nave's axis is z. 40 triangles apiece.
 */
export function flyers(out: MeshBuilder, zs: number[], pierX: number, y0: number, y1: number, wallX: number, wallY: number, stone: Rgb, o: { w?: number; pin?: number; tiers?: number; drop?: number } = {}): void {
  const w = o.w ?? 0.9
  const s = Math.sign(pierX - wallX)
  for (const z of zs) {
    prism(out, pierX, z, y0, y1, w * 0.72, 4, stone, FIXED, w * 0.72, false)
    prism(out, pierX, z, y1 - 0.4, y1, w * 0.86, 4, shade(stone, 1.05), FIXED, w * 0.86, false)
    pinnacle(out, pierX, z, y1, o.pin ?? 4.5, w * 0.6, shade(stone, 1.05), o.tiers ?? 1)
    flyingButtress(out, [pierX - s * w * 0.5, y1 - 0.3, z], [wallX + s * 0.05, wallY, z], w * 0.6, shade(stone, 0.97), { drop: o.drop ?? (y1 - y0) * 0.5, k: 3 })
  }
}

/**
 * A SPIRE: an `sides`-sided needle from (x, y0, z), radius r at the foot, `h` high; a rib up each arris, and `lucarnes` little gabled dormers low on alternate faces; a ball and cross. For the slate ones of Saint-Germain and the stone ones of Sainte-Clotilde: 2 triangles a face, 2 a rib, 8 a lucarne.
 */
export function spire(out: MeshBuilder, x: number, z: number, y0: number, h: number, r: number, c: Rgb, o: { sides?: number; rib?: Rgb; lucarnes?: number; lucarneAt?: number; lucarneW?: number; cross?: Rgb; crockets?: number; dark?: Rgb } = {}): void {
  const n = o.sides ?? 8
  const top = y0 + h
  const off = Math.PI / n
  const at = (i: number, rr: number, y: number): V3 => {
    const a = (i / n) * Math.PI * 2 + off
    return [x + Math.sin(a) * rr, y, z + Math.cos(a) * rr]
  }
  const rt = Math.max(0.03, r * 0.02)
  for (let i = 0; i < n; i++) {
    const am = ((i + 0.5) / n) * Math.PI * 2 + off
    out.quad([at(i, r, y0), at(i + 1, r, y0), at(i + 1, rt, top), at(i, rt, top)], [Math.sin(am) * 0.97, r / h, Math.cos(am) * 0.97], UV, c, FIXED)
    if (o.rib) {
      const a = (i / n) * Math.PI * 2 + off
      const ca = Math.cos(a) * 0.09
      const sa = Math.sin(a) * 0.09
      const p = at(i, r + 0.05, y0)
      const q = at(i, rt + 0.03, top)
      out.quad([[p[0] + ca, p[1], p[2] - sa], [p[0] - ca, p[1], p[2] + sa], [q[0] - ca * 0.3, q[1], q[2] + sa * 0.3], [q[0] + ca * 0.3, q[1], q[2] - sa * 0.3]], [Math.sin(a), r / h, Math.cos(a)], UV, o.rib, FIXED)
      for (let k = 1; k <= (o.crockets ?? 0); k++) {
        const t = k / ((o.crockets ?? 0) + 1)
        const cr = r + (rt - r) * t + 0.14
        const cy = y0 + h * t
        const pa = at(i, cr, cy)
        prism(out, pa[0], pa[2], cy - 0.2, cy + 0.2, 0.17, 4, o.rib, FIXED, 0.02, false)
      }
    }
  }
  for (let k = 0; k < (o.lucarnes ?? 0); k++) {
    const i = (k * n) / (o.lucarnes ?? 1)
    const am = ((i + 0.5) / n) * Math.PI * 2 + off
    const y = y0 + h * (o.lucarneAt ?? 0.14)
    const rr = (r + (rt - r) * (o.lucarneAt ?? 0.14)) * Math.cos(Math.PI / n)
    const nx = Math.sin(am)
    const nz = Math.cos(am)
    const lw = r * 0.26 * (o.lucarneW ?? 1)
    const lh = lw * 2.6
    const P = (u: number, v: number, d: number): V3 => [x + nx * (rr + d) + nz * u, y + v, z + nz * (rr + d) - nx * u]
    const col = o.rib ?? shade(c, 1.2)
    out.quad([P(-lw, 0, 0.45), P(lw, 0, 0.45), P(lw, lh * 0.6, 0.45), P(-lw, lh * 0.6, 0.45)], [nx, 0, nz], UV, o.dark ?? [0.05, 0.05, 0.06], FIXED)
    out.quad([P(-lw * 1.25, lh * 0.55, 0.5), P(lw * 1.25, lh * 0.55, 0.5), P(0, lh * 1.2, 0.5), P(0, lh * 1.2, 0.5)], [nx, 0, nz], UV, col, FIXED)
    out.quad([P(-lw, lh * 0.6, 0.45), P(0, lh * 1.2, 0.45), P(0, lh * 1.2, -0.3), P(-lw, lh * 0.2, -0.3)], [-nz * 0.7, 0.7, nx * 0.7], UV, c, FIXED)
    out.quad([P(0, lh * 1.2, 0.45), P(lw, lh * 0.6, 0.45), P(lw, lh * 0.2, -0.3), P(0, lh * 1.2, -0.3)], [nz * 0.7, 0.7, -nx * 0.7], UV, c, FIXED)
  }
  if (o.cross) {
    prism(out, x, z, top - 0.1, top + 0.16, 0.14, 6, o.cross, FIXED, 0.1, false)
    prism(out, x, z, top + 0.1, top + 1.5, 0.05, 4, o.cross, FIXED, 0.05, false)
    out.quad([[x - 0.42, top + 1, z], [x + 0.42, top + 1, z], [x + 0.42, top + 1.1, z], [x - 0.42, top + 1.1, z]], [0, 0, -1], UV, o.cross, FIXED)
    out.quad([[x + 0.42, top + 1, z], [x - 0.42, top + 1, z], [x - 0.42, top + 1.1, z], [x + 0.42, top + 1.1, z]], [0, 0, 1], UV, o.cross, FIXED)
  }
}

/** A BELFRY OPENING: an arched opening, dark behind, with its slate louvres across it and a stone net; head and lights as a window's. 60-odd triangles. */
export function louvred(fr: Frame, u: number, y0: number, w: number, h: number, stone: Rgb, dark: Rgb, o: { head?: Head; lights?: number; slats?: number; slate?: Rgb; d?: number; screen?: Tracery['screen'] } = {}): void {
  traceryWindow(fr, u, y0, w, h, { stone, glass: dark, head: o.head ?? 'pointed', lights: o.lights ?? 2, far: true, screen: o.screen })
  const spring = springOf(y0, w, h, o.head ?? 'pointed')
  const n = o.slats ?? Math.max(3, Math.round((spring - y0) / 0.75))
  const c = o.slate ?? [0.1, 0.11, 0.12]
  for (let i = 0; i < n; i++) rect(fr, u - w / 2 + 0.03, u + w / 2 - 0.03, y0 + ((spring - y0) * (i + 0.42)) / n, y0 + ((spring - y0) * (i + 0.72)) / n, 0.05, c)
}

/** A BLIND ARCADE: `n` round arches on colonnettes between u0 and u1, dark or a shade back behind them, y0 to the crowns at y0 + h; the Romanesque tower's dress. About 22 triangles an arch. */
export function blindArcade(fr: Frame, u0: number, u1: number, y0: number, h: number, n: number, stone: Rgb, back: Rgb, o: { d?: number; head?: Head } = {}): void {
  const bay = (u1 - u0) / n
  const w = bay * 0.72
  const d = o.d ?? 0.14
  const head = o.head ?? 'round'
  const spring = springOf(y0, w, h, head)
  for (let i = 0; i < n; i++) {
    const u = u0 + bay * (i + 0.5)
    const edge = archEdge(u, spring, w, y0 + h - spring, head, 6)
    fillOpening(fr, u, y0, spring, edge, w, 0.02, back)
    for (let j = 0; j + 1 < edge.length; j++) bar(fr, edge[j], edge[j + 1], 0.13, d, stone)
  }
  for (let i = 0; i <= n; i++) {
    const u = u0 + bay * i
    bar(fr, [u, y0], [u, spring], 0.2, d, stone)
    boxOn(fr, u - 0.17, u + 0.17, spring - 0.14, spring + 0.02, 0, d + 0.04, shade(stone, 1.05))
  }
  boxOn(fr, u0 - 0.05, u1 + 0.05, y0 - 0.22, y0, 0, d + 0.06, shade(stone, 1.03))
}

export type Order = 'doric' | 'ionic' | 'corinthian'

/**
 * AN ENGAGED COLUMN on the wall at u, y0 to y1, radius r: the half-drum in 5 faces, its base, and the capital of its order (a doric's plain cushion; an ionic's scrolls; a corinthian's flaring bell). About 30 triangles; `far` is half.
 */
export function engaged(fr: Frame, u: number, y0: number, y1: number, r: number, stone: Rgb, order: Order = 'corinthian', o: { far?: boolean } = {}): void {
  const sides = o.far ? 3 : 5
  const pt = (i: number, rr: number, y: number): V3 => {
    const a = (i / sides) * Math.PI
    return fr.P(u - Math.cos(a) * rr, y, Math.sin(a) * rr)
  }
  const capH = order === 'doric' ? r * 0.9 : order === 'ionic' ? r * 1.1 : r * 2.1
  const baseH = r * 0.9
  for (let i = 0; i < sides; i++) {
    const am = ((i + 0.5) / sides) * Math.PI
    const nu = -Math.cos(am)
    const nd = Math.sin(am)
    const nn: V3 = [fr.t[0] * nu + fr.n[0] * nd, 0, fr.t[2] * nu + fr.n[2] * nd]
    const col = shade(stone, 0.86 + nd * 0.18)
    fr.out.quad([pt(i, r, y0 + baseH), pt(i + 1, r, y0 + baseH), pt(i + 1, r * 0.92, y1 - capH), pt(i, r * 0.92, y1 - capH)], nn, UV, col, FIXED)
    if (!o.far && order !== 'ionic') {
      // the bell
      fr.out.quad([pt(i, r * 0.92, y1 - capH), pt(i + 1, r * 0.92, y1 - capH), pt(i + 1, r * 1.28, y1 - r * 0.28), pt(i, r * 1.28, y1 - r * 0.28)], nn, UV, shade(col, 1.06), FIXED)
    }
  }
  const hw = r * 1.32
  boxOn(fr, u - hw, u + hw, y0, y0 + baseH, 0, hw, shade(stone, 1.02))
  boxOn(fr, u - hw * 1.02, u + hw * 1.02, y1 - r * 0.28, y1, 0, hw * 1.02, shade(stone, 1.05))
  if (order === 'ionic') for (const s of [-1, 1]) boxOn(fr, u + s * r * 0.9 - r * 0.38, u + s * r * 0.9 + r * 0.38, y1 - capH, y1 - r * 0.28, 0, r + 0.1, shade(stone, 1.08))
  if (order === 'doric' && !o.far) boxOn(fr, u - hw * 0.84, u + hw * 0.84, y1 - capH, y1 - r * 0.28, 0, hw * 0.84, shade(stone, 1.02))
}

/**
 * AN ENTABLATURE across a front at y: architrave, frieze and cornice in three steps with the cornice's soffit, `h` in all. 16 triangles.
 */
export function entablature(fr: Frame, u0: number, u1: number, y: number, h: number, d: number, stone: Rgb, o: { frieze?: Rgb } = {}): void {
  const a = h * 0.36
  const f = h * 0.3
  boxOn(fr, u0, u1, y, y + a, 0, d, shade(stone, 1.02), true)
  rect(fr, u0, u1, y + a, y + a + f, d - 0.05, o.frieze ?? shade(stone, 0.96))
  boxOn(fr, u0 - 0.15, u1 + 0.15, y + a + f, y + h, 0, d + 0.36, shade(stone, 1.06), true)
}

/**
 * A PEDIMENT on a front, its base at y from u0 to u1: triangular, or `curved` (a segment), with its raking cornice standing out, its soffit, and `relief` figures in the tympanum, tall in the middle and lying down to the corners. 20-odd triangles and 10 a figure.
 */
export function pedimentFront(fr: Frame, u0: number, u1: number, y: number, h: number, d: number, stone: Rgb, o: { curved?: boolean; relief?: number; reliefC?: Rgb; back?: number } = {}): void {
  const m = (u0 + u1) / 2
  const hw = (u1 - u0) / 2
  const k = o.curved ? 8 : 2
  const R = (hw * hw + h * h) / (2 * h)
  const top = (u: number): number => (o.curved ? y + Math.sqrt(Math.max(0, R * R - (u - m) ** 2)) - (R - h) : y + h * (1 - Math.abs(u - m) / hw))
  const back = o.back ?? 0
  const lip = 0.3
  for (let i = 0; i < k; i++) {
    const a = u0 + ((u1 - u0) * i) / k
    const b = u0 + ((u1 - u0) * (i + 1)) / k
    const ta = top(a)
    const tb = top(b)
    // the tympanum
    fr.out.quad([fr.P(a, y, d - 0.3), fr.P(b, y, d - 0.3), fr.P(b, tb, d - 0.3), fr.P(a, ta, d - 0.3)], fr.n, UV, shade(stone, 0.95), FIXED)
    // the raking cornice's face, its top back to the wall and its soffit
    fr.out.quad([fr.P(a, ta, d + 0.05), fr.P(b, tb, d + 0.05), fr.P(b, tb + lip, d + 0.05), fr.P(a, ta + lip, d + 0.05)], fr.n, UV, shade(stone, 1.06), FIXED)
    const su = tb - ta
    const sl = Math.hypot(su, b - a) || 1
    const up: V3 = [fr.t[0] * (-su / sl), (b - a) / sl, fr.t[2] * (-su / sl)]
    fr.out.quad([fr.P(a, ta + lip, d + 0.05), fr.P(b, tb + lip, d + 0.05), fr.P(b, tb + lip, back), fr.P(a, ta + lip, back)], up, UV, shade(stone, 1.1), FIXED)
    fr.out.quad([fr.P(b, tb, d + 0.05), fr.P(a, ta, d + 0.05), fr.P(a, ta, d - 0.3), fr.P(b, tb, d - 0.3)], [-up[0], -up[1], -up[2]], UV, shade(stone, 0.62), FIXED)
  }
  // the group in the tympanum
  const n = o.relief ?? 0
  const c = o.reliefC ?? shade(stone, 1.1)
  for (let i = 0; i < n; i++) {
    const t = ((i + 0.5) / n) * 2 - 1
    const u = m + t * hw * 0.86
    const room = top(u) - y
    // (heights jittered, and a low mass of drapery under them: an even row of figures up a rake reads as a saw's teeth)
    const jit = 0.5 + 0.28 * (Math.sin(i * 12.9898) * 43758.5453 - Math.floor(Math.sin(i * 12.9898) * 43758.5453))
    const fh = Math.max(0.3, room * jit)
    const fw = Math.min(fh * 0.24, ((u1 - u0) / n) * 0.36)
    rect(fr, u - ((u1 - u0) / n) * 0.52, u + ((u1 - u0) / n) * 0.52, y + 0.02, y + Math.min(room * 0.3, 0.9), d - 0.16, shade(c, 0.94))
    // a draped figure, narrow at the shoulder, and its head; low at the corners, where it lies down
    const lying = room < 1.1 ? 1.8 : 1
    fr.out.quad([fr.P(u - fw * 1.25 * lying, y + 0.04, d - 0.1), fr.P(u + fw * 1.25 * lying, y + 0.04, d - 0.1), fr.P(u + fw * 0.8 * lying, y + fh * 0.76, d - 0.1), fr.P(u - fw * 0.8 * lying, y + fh * 0.76, d - 0.1)], fr.n, UV, c, FIXED)
    boxOn(fr, u - fw * 0.42, u + fw * 0.42, y + fh * 0.76, y + fh, d - 0.3, d - 0.1, c)
  }
}

/**
 * A SCROLL joining an upper storey to a lower: the Baroque volute of Saint-Paul and Saint-Roch. It leans from (uFoot, yFoot) to (uHead, yHead): a band whose back is a quarter curve, a coil at its foot and a coil at its head. On the wall, standing `d` out. About 40 triangles.
 */
export function volute(fr: Frame, uFoot: number, yFoot: number, uHead: number, yHead: number, d: number, stone: Rgb): void {
  const k = 6
  const pts: P[] = []
  for (let i = 0; i <= k; i++) {
    const t = i / k
    // a concave sweep, flattest at the foot and steepest at the head
    pts.push([uFoot + (uHead - uFoot) * Math.sin((t * Math.PI) / 2), yFoot + (yHead - yFoot) * (1 - Math.cos((t * Math.PI) / 2))])
  }
  const c = shade(stone, 1.03)
  for (let i = 0; i < k; i++) {
    // filled from the curve down to the storey's foot: the scroll's web, against the upper wall
    fr.out.quad([fr.P(pts[i][0], yFoot, d * 0.7), fr.P(pts[i + 1][0], yFoot, d * 0.7), fr.P(pts[i + 1][0], pts[i + 1][1], d * 0.7), fr.P(pts[i][0], pts[i][1], d * 0.7)], fr.n, UV, stone, FIXED)
    rib(fr, pts[i], pts[i + 1], Math.abs(yHead - yFoot) * 0.08 + 0.16, 0, d, c)
  }
  for (const [u, y, r] of [[uFoot, yFoot + 0.38, 0.42], [uHead, yHead, 0.34]] as const) {
    const q: P[] = []
    for (let i = 0; i <= 8; i++) q.push([u + Math.cos((i / 8) * Math.PI * 2) * r, y + Math.sin((i / 8) * Math.PI * 2) * r])
    for (let i = 0; i < 8; i += 2) fr.out.quad([fr.P(u, y, d + 0.08), fr.P(q[i][0], q[i][1], d + 0.08), fr.P(q[i + 1][0], q[i + 1][1], d + 0.08), fr.P(q[i + 2][0], q[i + 2][1], d + 0.08)], fr.n, UV, shade(c, 1.05), FIXED)
    for (let i = 0; i < 8; i += 2) {
      bar(fr, q[i], q[i + 2], 0.07, d + 0.1, shade(stone, 0.7))
    }
  }
}

/** A STATUE on a wall's parapet or a niche's floor, `h` tall at (x, y, z): a draped mass that narrows to the shoulders, and a head: no arms held out, which at this size read as a cross. 22 triangles. */
export function statue(out: MeshBuilder, x: number, y: number, z: number, h: number, c: Rgb): void {
  prism(out, x, z, y, y + h * 0.5, h * 0.14, 6, c, FIXED, h * 0.115, false)
  prism(out, x, z, y + h * 0.5, y + h * 0.82, h * 0.115, 6, shade(c, 1.03), FIXED, h * 0.075, false)
  prism(out, x, z, y + h * 0.82, y + h, h * 0.065, 6, shade(c, 1.05), FIXED, h * 0.045, false)
}

/** A round-headed or flat classical DOOR with its panelled leaves, its architrave round it and a cornice over: for the fronts' side doors. About 30 triangles. */
export function classicalDoor(fr: Frame, u: number, y0: number, w: number, h: number, stone: Rgb, door: Rgb, o: { head?: 'round' | 'flat'; pediment?: boolean } = {}): void {
  const hw = w / 2
  const t = Math.max(0.22, w * 0.11)
  const round = o.head === 'round'
  const spring = round ? y0 + h - hw : y0 + h
  rect(fr, u - hw, u + hw, y0, spring, 0.06, door)
  rect(fr, u - 0.03, u + 0.03, y0, spring, 0.08, shade(door, 0.5))
  for (const s of [-1, 1]) {
    boxOn(fr, u + s * (hw + t / 2) - t / 2, u + s * (hw + t / 2) + t / 2, y0, spring, 0, 0.16, shade(stone, 1.03))
    rect(fr, u + s * hw * 0.5 - hw * 0.28, u + s * hw * 0.5 + hw * 0.28, y0 + (spring - y0) * 0.56, y0 + (spring - y0) * 0.92, 0.08, shade(door, 1.25))
    rect(fr, u + s * hw * 0.5 - hw * 0.28, u + s * hw * 0.5 + hw * 0.28, y0 + (spring - y0) * 0.08, y0 + (spring - y0) * 0.46, 0.08, shade(door, 1.25))
  }
  if (round) {
    const e = archEdge(u, spring, w, hw, 'round', 6)
    fillOpening(fr, u, spring, spring, e, w, 0.05, shade(door, 0.5))
    for (let i = 0; i + 1 < e.length; i++) bar(fr, [u + (e[i][0] - u) * 1.12, spring + (e[i][1] - spring) * 1.12], [u + (e[i + 1][0] - u) * 1.12, spring + (e[i + 1][1] - spring) * 1.12], t, 0.16, shade(stone, 1.03))
  } else {
    boxOn(fr, u - hw - t, u + hw + t, spring, spring + t, 0, 0.18, shade(stone, 1.03))
    boxOn(fr, u - hw - t * 1.4, u + hw + t * 1.4, spring + t, spring + t * 1.5, 0, 0.32, shade(stone, 1.06), true)
    if (o.pediment) pedimentFront(fr, u - hw - t * 1.4, u + hw + t * 1.4, spring + t * 1.5, w * 0.24, 0.32, stone)
  }
}
