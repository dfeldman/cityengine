/**
 * FISHERMAN'S WHARF, the carnival (BUGS.md #290; owner 2026-10-16: "it doesn't have to be exactly true to life, but
 * mimic the style and key places in the area"). The pieces that are not buildings, and the buildings whose look is
 * their signs and their colour: built one at a time from photographs, each with a note of the one it follows.
 *
 * Each builder here is placed by lat/lon with rotateDeg 0 (local x east, z north, y up from the ground) unless its
 * note says otherwise, and turns itself to face where it faces.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { box, prism, EMIT, type Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { sign } from '../signage.ts'
import { SKYSTAR, DECK } from '../../sf/ferris.ts'

export type V3 = [number, number, number]
const UVQ: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

export const add = (a: V3, b: V3, k = 1): V3 => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k]
export const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
export const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
export const norm = (a: V3): V3 => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l] }
const neg = (a: V3): V3 => [-a[0], -a[1], -a[2]]
const mix = (u: V3, v: V3, a: number, b: number): V3 => [u[0] * a + v[0] * b, u[1] * a + v[1] * b, u[2] * a + v[2] * b]

/** a round bar from p0 to p1, radius r (r1 at the far end), `sides` sided, capped */
export function tube(out: MeshBuilder, p0: V3, p1: V3, r: number, sides: number, c: Rgb, tag: number, r1 = r): void {
  const d = norm(sub(p1, p0))
  const s = norm(cross(d, Math.abs(d[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0]))
  const t = cross(d, s)
  const at = (p: V3, rr: number, a: number): V3 => add(add(p, s, Math.cos(a) * rr), t, Math.sin(a) * rr)
  for (let i = 0; i < sides; i++) {
    const a0 = (i / sides) * Math.PI * 2, a1 = ((i + 1) / sides) * Math.PI * 2, am = (a0 + a1) / 2
    out.quad([at(p0, r, a0), at(p0, r, a1), at(p1, r1, a1), at(p1, r1, a0)], mix(s, t, Math.cos(am), Math.sin(am)), UVQ, c, tag)
  }
  for (const [p, rr, sg] of [[p0, r, -1], [p1, r1, 1]] as [V3, number, number][]) {
    if (rr < 0.005) continue
    for (let i = 1; i + 1 < sides; i++) {
      out.quad([at(p, rr, 0), at(p, rr, (i / sides) * Math.PI * 2), at(p, rr, ((i + 1) / sides) * Math.PI * 2), at(p, rr, ((i + 1) / sides) * Math.PI * 2)],
        [d[0] * sg, d[1] * sg, d[2] * sg], UVQ, c, tag)
    }
  }
}

/** a flat ellipse in the plane (u, v) about `centre`, facing n, radii ru along u and rv along v */
export function ellipse(out: MeshBuilder, centre: V3, u: V3, v: V3, n: V3, ru: number, rv: number, sides: number, c: Rgb, tag: number): void {
  const P = (k: number): V3 => { const a = (k / sides) * Math.PI * 2; return add(add(centre, u, Math.cos(a) * ru), v, Math.sin(a) * rv) }
  for (let i = 1; i + 1 < sides; i++) out.quad([P(0), P(i), P(i + 1), P(i + 1)], n, UVQ, c, tag)
}

/** an ellipse with thickness: the crab's body, a hub */
export function lozenge(out: MeshBuilder, centre: V3, u: V3, v: V3, n: V3, ru: number, rv: number, th: number, c: Rgb, tag: number, sides = 20): void {
  ellipse(out, add(centre, n, th / 2), u, v, n, ru, rv, sides, c, tag)
  ellipse(out, add(centre, n, -th / 2), u, v, neg(n), ru, rv, sides, c, tag)
  for (let i = 0; i < sides; i++) {
    const a0 = (i / sides) * Math.PI * 2, a1 = ((i + 1) / sides) * Math.PI * 2, am = (a0 + a1) / 2
    const P = (a: number, s: number): V3 => add(add(add(centre, u, Math.cos(a) * ru), v, Math.sin(a) * rv), n, (s * th) / 2)
    out.quad([P(a0, -1), P(a1, -1), P(a1, 1), P(a0, 1)], mix(u, v, Math.cos(am), Math.sin(am)), UVQ, c, tag)
  }
}

/**
 * A DUNGENESS CRAB, flat-on in the plane (u to the picture's right, v up, n out of it), `s` across: the oval carapace,
 * two big claws raised, four walking legs a side kinked down at the knee, eyes on stalks. Low relief, as a sign's or a
 * statue's crab is.
 */
export function crab(out: MeshBuilder, centre: V3, u: V3, v: V3, n: V3, s: number, shell: Rgb, dark: Rgb, tag: number): void {
  const at = (a: number, b: number, d = 0): V3 => add(add(add(centre, u, a * s), v, b * s), n, d * s)
  const leg = s * 0.06
  for (const side of [-1, 1]) {
    for (let k = 0; k < 4; k++) {
      const y = 0.04 - k * 0.1
      const hip = at(side * 0.34, y, 0.04), knee = at(side * (0.6 + k * 0.03), y + 0.07 - k * 0.025, 0.04), foot = at(side * (0.76 + k * 0.02), y - 0.16 - k * 0.04, 0.04)
      tube(out, hip, knee, leg, 5, shell, tag, leg * 0.85)
      tube(out, knee, foot, leg * 0.85, 5, shell, tag, leg * 0.25)
    }
    const shoulder = at(side * 0.28, 0.18, 0.05), elbow = at(side * 0.5, 0.38, 0.05), wrist = at(side * 0.38, 0.56, 0.05)
    tube(out, shoulder, elbow, s * 0.075, 6, shell, tag)
    tube(out, elbow, wrist, s * 0.075, 6, shell, tag)
    lozenge(out, at(side * 0.3, 0.66, 0.05), u, v, n, s * 0.13, s * 0.17, s * 0.08, shell, tag, 14)
    tube(out, at(side * 0.25, 0.75, 0.07), at(side * 0.15, 0.86, 0.07), s * 0.032, 5, dark, tag, s * 0.01)
    tube(out, at(side * 0.36, 0.77, 0.07), at(side * 0.23, 0.92, 0.07), s * 0.038, 5, shell, tag, s * 0.01)
  }
  lozenge(out, at(0, -0.02, 0.06), u, v, n, s * 0.46, s * 0.31, s * 0.12, shell, tag, 24)
  lozenge(out, at(0, 0.03, 0.12), u, v, n, s * 0.28, s * 0.14, s * 0.02, dark, tag, 18)
  for (const side of [-1, 1]) tube(out, at(side * 0.07, 0.22, 0.09), at(side * 0.09, 0.3, 0.11), s * 0.016, 5, dark, tag, s * 0.026)
}

/**
 * THE FISHERMAN'S WHARF SIGN at Jefferson and Taylor (OSM node 5455630121, "Fishermans Wharf of San Francisco"):
 * a ship's WHEEL four and a half metres across, its brown rim bound in steel, eight turned spokes standing out past it
 * as handles; the face a cream disc, FISHERMANS WHARF round the top and OF SAN FRANCISCO round the bottom in brown
 * serif capitals, an orange-red Dungeness crab in the middle. It stands on a cluster of three tarred timber PILES
 * bound in thick rope above and below the wheel, an anchor hung on the rope, on a round concrete plinth.
 * Commons "California-06102 - Fisherman's Wharf Sign and Tram". Faces the corner, south-west; lettered both sides.
 * (Was a blue-ringed disc on a steel post, 2026-09.)
 */
export function wharfSign(out: MeshBuilder, _fit?: Fit): void {
  const WOOD: Rgb = [0.36, 0.22, 0.13], STEEL: Rgb = [0.66, 0.67, 0.68], PILE: Rgb = [0.25, 0.2, 0.16]
  const ROPE: Rgb = [0.55, 0.47, 0.36], CREAM: Rgb = [0.93, 0.9, 0.78], INK: Rgb = [0.46, 0.17, 0.09], IRON: Rgb = [0.2, 0.2, 0.21]
  const SHELL: Rgb = [0.93, 0.36, 0.14], SHELLD: Rgb = [0.86, 0.27, 0.11], CONC: Rgb = [0.6, 0.59, 0.56]
  const WT = surfaceTag('clapboard'), MT = surfaceTag('metal'), CT = surfaceTag('concrete')
  // the wheel's plane: n its face (south-west), u across it to the reader's right, up
  const H = (-135 * Math.PI) / 180
  const n: V3 = [Math.sin(H), 0, Math.cos(H)], u: V3 = [Math.cos(H), 0, -Math.sin(H)], up: V3 = [0, 1, 0]
  const C: V3 = [0, 5.9, 0], R = 2.25
  const P = (a: number, b: number, d = 0): V3 => add(add(add(C, u, a), up, b), n, d)
  prism(out, 0, 0, 0, 0.55, 1.7, 20, CONC, CT)
  for (const [dx, dz, top] of [[-0.25, 0.1, 10.6], [0.28, 0.05, 11.4], [0.02, -0.3, 10.1]] as [number, number, number][]) {
    const off = add(mix(u, n, dx, dz), [0, 0, 0])
    // (stopped at the wheel and carried on over it: the face is whole, the column behind it, both sides)
    prism(out, off[0], off[2], 0.5, C[1] - R + 0.3, 0.27, 10, PILE, WT)
    prism(out, off[0], off[2], C[1] + R - 0.3, top, 0.27, 10, PILE, WT, 0.25)
  }
  // the rope: coil on coil, under the wheel and over it
  for (const [y0, y1, r] of [[0.55, 3.55, 0.82], [8.05, 9.4, 0.72]]) {
    for (let y = y0; y < y1 - 0.01; y += 0.17) {
      const k = 0.9 + 0.1 * Math.sin(y * 13)
      prism(out, 0, 0, y, Math.min(y1, y + 0.16), r + 0.04 * Math.sin(y * 9), 14, [ROPE[0] * k, ROPE[1] * k, ROPE[2] * k], WT)
    }
  }
  // the anchor hung on the rope, and a bronze plaque under it
  const A = (a: number, b: number): V3 => add(add([0, b, 0], u, a), n, 0.88)
  tube(out, A(0, 3.0), A(0, 1.75), 0.05, 6, IRON, MT)
  tube(out, A(-0.3, 2.7), A(0.3, 2.7), 0.04, 6, IRON, MT)
  for (const s of [-1, 1]) tube(out, A(0, 1.75), A(s * 0.42, 2.05), 0.05, 6, IRON, MT, 0.02)
  const pl = A(0, 1.25)
  box(out, pl[0], pl[1], pl[2], 0.2, 0.25, 0.2, [0.45, 0.36, 0.2], MT)
  // the wheel: the brown rim, its steel band, the spokes and their handles
  const SEG = 40
  for (let i = 0; i < SEG; i++) {
    const a0 = (i / SEG) * Math.PI * 2, a1 = ((i + 1) / SEG) * Math.PI * 2, am = (a0 + a1) / 2
    const q = (a: number, r: number, d: number): V3 => P(Math.cos(a) * r, Math.sin(a) * r, d)
    for (const [r0, r1, c, tg] of [[R - 0.32, R - 0.12, WOOD, WT], [R - 0.12, R, STEEL, MT]] as [number, number, Rgb, number][]) {
      for (const d of [0.2, -0.2]) out.quad([q(a0, r0, d), q(a1, r0, d), q(a1, r1, d), q(a0, r1, d)], d > 0 ? n : neg(n), UVQ, c, tg)
    }
    out.quad([q(a0, R, -0.2), q(a1, R, -0.2), q(a1, R, 0.2), q(a0, R, 0.2)], mix(u, up, Math.cos(am), Math.sin(am)), UVQ, STEEL, MT)
  }
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2 + Math.PI / 8
    const dir = (r: number): V3 => P(Math.cos(a) * r, Math.sin(a) * r, 0)
    tube(out, dir(R - 0.05), dir(R + 0.35), 0.07, 8, WOOD, WT)
    tube(out, dir(R + 0.35), dir(R + 0.5), 0.07, 8, WOOD, WT, 0.11)        // the turned handle: a swell…
    tube(out, dir(R + 0.5), dir(R + 0.82), 0.11, 8, WOOD, WT, 0.06)        // …tapering to a knob
    tube(out, dir(R + 0.82), dir(R + 0.92), 0.08, 8, WOOD, WT, 0.03)
  }
  // the face, both sides: a cream disc, the words round it, the crab standing off it
  for (const side of [1, -1]) {
    const nn: V3 = [n[0] * side, 0, n[2] * side], uu: V3 = [u[0] * side, 0, u[2] * side]
    // (the back of the rim's hole: the disc closes it)
    ellipse(out, add(C, nn, 0.1), uu, up, nn, R - 0.28, R - 0.28, 48, CREAM, CT)
    const f = add(C, nn, 0.12)
    sign(out, { type: 'flat', text: 'FISHERMANS WHARF', ring: { below: 'OF SAN FRANCISCO' }, h: 0.3, w: (R - 0.3) * 2, face: 'didone', weight: 'bold', colour: INK, panel: CREAM, lit: 'front', tracking: 0.05 },
      { x: f[0], y: f[1], z: f[2], heading: side > 0 ? H : H + Math.PI })
    crab(out, add(C, nn, 0.14), uu, up, nn, 1.5, SHELL, SHELLD, CT)
  }
}

/**
 * The SKYSTAR WHEEL's standing parts (the wheel and its gondolas turn in render/sf/ferris.ts, from the same SKYSTAR):
 * two splayed A-frames of white tube either side of the hub, braced, on footings; the boarding DECK under the wheel's
 * foot, railed, with steps up from the front; the arched CANOPY over the queue in front — translucent panels on white
 * ribs, lit violet and red underneath at night — with SKYSTAR in lit gold letters along its crest; and the ticket booth.
 * Commons "SkyStar Wheel - Fisherman's Wharf - January 2024 (8775)". Placed at the hub, rotateDeg 0: the wheel's face
 * looks south (−z), across the lot to Jefferson Street.
 */
export function skystarWheel(out: MeshBuilder, _fit: Fit): void {
  const WHITE: Rgb = [0.93, 0.93, 0.92], GREY: Rgb = [0.62, 0.62, 0.6], DECKC: Rgb = [0.5, 0.5, 0.5], RAIL: Rgb = [0.85, 0.85, 0.86]
  const PANEL: Rgb = [0.86, 0.84, 0.9], RED: Rgb = [0.78, 0.12, 0.16], VIOLET: Rgb = [0.55, 0.35, 0.95], GOLD: Rgb = [1.0, 0.84, 0.45]
  const MT = surfaceTag('metal'), CT = surfaceTag('concrete'), GL = surfaceTag('glass')
  const HUB = SKYSTAR.hub
  // the A-frames: each side of the hub, two legs splayed across the face down to footings, a tie between their feet,
  // a brace part way up; the bearing housing on top
  for (const z of [-3.4, 3.4]) {
    const top: V3 = [0, HUB, z]
    for (const sx of [-1, 1]) {
      const foot: V3 = [sx * 12.5, 0.4, z * 1.7]
      tube(out, foot, top, 0.62, 10, WHITE, MT, 0.42)
      box(out, foot[0], 0.2, foot[2], 1.3, 0.4, 1.3, GREY, CT)
      // the brace, a third of the way up, to the other leg
      const t = 0.35
      const b: V3 = [foot[0] + (top[0] - foot[0]) * t, foot[1] + (top[1] - foot[1]) * t, foot[2] + (top[2] - foot[2]) * t]
      tube(out, b, [0, b[1], b[2]], 0.22, 8, WHITE, MT)
    }
    tube(out, [-12.5, 0.6, z * 1.7], [12.5, 0.6, z * 1.7], 0.3, 8, WHITE, MT)
    box(out, 0, HUB, z, 0.9, 0.9, 0.5, WHITE, MT)
  }
  // the axle through the hub (the drum turns on it)
  tube(out, [0, HUB, -4.0], [0, HUB, 4.0], 0.5, 12, GREY, MT)
  // the deck: a railed platform at the wheel's foot, the bottom gondola's floor level with it, steps up from the front
  const DY = DECK.y, X0 = -6, X1 = 6, Z0 = -5.5, Z1 = 3.5
  box(out, 0, DY / 2, (Z0 + Z1) / 2, (X1 - X0) / 2, DY / 2, (Z1 - Z0) / 2, DECKC, CT)
  for (let k = 0; k < 6; k++) box(out, 0, (k + 0.5) * DY / 6, Z0 - 0.3 * (6 - k) + 0.15, 2.4, (k + 0.5) * DY / 12 + 0.01, 0.15, GREY, CT)
  for (const [ax, az, bx, bz] of [[X0, Z0, -2.4, Z0], [2.4, Z0, X1, Z0], [X1, Z0, X1, Z1], [X0, Z0, X0, Z1], [X0, Z1, -1.6, Z1], [1.6, Z1, X1, Z1]]) {
    tube(out, [ax, DY + 1.05, az], [bx, DY + 1.05, bz], 0.04, 6, RAIL, MT)
    tube(out, [ax, DY + 0.55, az], [bx, DY + 0.55, bz], 0.025, 6, RAIL, MT)
    const L = Math.hypot(bx - ax, bz - az)
    for (let u = 0; u <= L + 0.01; u += 1.5) { const t = L ? u / L : 0; tube(out, [ax + (bx - ax) * t, DY, az + (bz - az) * t], [ax + (bx - ax) * t, DY + 1.05, az + (bz - az) * t], 0.035, 6, RAIL, MT) }
  }
  /*
   * The canopy: a broad shallow arch over the queue in front of the deck, 22 m across and 8 deep, its crest 6.4 m up —
   * translucent panels between white ribs that fan from the back, a white edge beam, the lights under it.
   */
  const CW = 11, CZ0 = -6, CZ1 = -14
  const crest = (x: number, zf: number): number => 2.9 + 3.5 * Math.cos((x / CW) * Math.PI / 2) * (0.55 + 0.45 * zf)
  const NX = 14, NZ = 4
  for (let i = 0; i < NX; i++) for (let j = 0; j < NZ; j++) {
    const x0 = -CW + (2 * CW * i) / NX, x1 = -CW + (2 * CW * (i + 1)) / NX
    const f0 = j / NZ, f1 = (j + 1) / NZ
    const z0 = CZ0 + (CZ1 - CZ0) * f0, z1 = CZ0 + (CZ1 - CZ0) * f1
    const q: V3[] = [[x0, crest(x0, 1 - f0), z0], [x1, crest(x1, 1 - f0), z0], [x1, crest(x1, 1 - f1), z1], [x0, crest(x0, 1 - f1), z1]]
    out.quad(q, [0, 1, 0], UVQ, PANEL, GL)
    out.quad([q[1], q[0], q[3], q[2]], [0, -1, 0], UVQ, (i + j) % 2 ? VIOLET : RED, EMIT)
  }
  for (let i = 0; i <= NX; i++) {
    const x = -CW + (2 * CW * i) / NX
    tube(out, [x, crest(x, 1), CZ0], [x, crest(x, 0), CZ1], 0.09, 6, WHITE, MT)
  }
  for (let i = 0; i < NX * 2; i++) {
    const x0 = -CW + (CW * i) / NX, x1 = -CW + (CW * (i + 1)) / NX
    tube(out, [x0, crest(x0, 0), CZ1], [x1, crest(x1, 0), CZ1], 0.16, 8, WHITE, MT)
    tube(out, [x0, crest(x0, 1), CZ0], [x1, crest(x1, 1), CZ0], 0.12, 8, WHITE, MT)
  }
  // its posts, at the ends and two at the front
  for (const x of [-CW, CW]) for (const z of [CZ0, CZ1]) tube(out, [x, 0, z], [x, crest(x, z === CZ0 ? 1 : 0), z], 0.14, 8, WHITE, MT)
  for (const x of [-4.5, 4.5]) tube(out, [x, 0, CZ1], [x, crest(x, 0), CZ1], 0.12, 8, WHITE, MT)
  // SKYSTAR along the crest, gold and lit, both ways
  for (const side of [1, -1]) sign(out, { type: 'flat', text: 'SKYSTAR', h: 1.1, face: 'grotesque', weight: 'bold', colour: GOLD, lit: 'self', tracking: 0.35 },
    { x: 0, y: crest(0, 0) + 0.85, z: CZ1 + 0.2 * side, heading: side > 0 ? Math.PI : 0 })
  tube(out, [-4.2, crest(0, 0) + 0.2, CZ1], [4.2, crest(0, 0) + 0.2, CZ1], 0.05, 6, WHITE, MT)
  // the ticket booth, by the canopy's west foot
  box(out, -CW - 2.2, 1.3, CZ1 + 2, 1.4, 1.3, 1.2, WHITE, MT)
  box(out, -CW - 2.2, 2.75, CZ1 + 2, 1.6, 0.15, 1.4, RED, MT)
  box(out, -CW - 2.2, 1.6, CZ1 + 0.79, 1.0, 0.5, 0.02, [0.25, 0.3, 0.35], GL)
  sign(out, { type: 'flat', text: 'TICKETS', h: 0.3, face: 'grotesque', weight: 'bold', colour: [1, 1, 1], panel: RED, lit: 'back' },
    { x: -CW - 2.2, y: 2.75, z: CZ1 + 0.58, heading: Math.PI })
}

export const WHARF_CARNIVAL: Record<string, (out: MeshBuilder, fit: Fit) => void> = { wharfSign, skystarWheel }
