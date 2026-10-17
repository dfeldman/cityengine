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
import { PIER39_BRIDGE_PATH, pier39BridgeY } from '../../../city/sf/bridges.ts'

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

/**
 * PIER 39's GATE over the walkway in from the Embarcadero (OSM way 28518695, "Pier 39"), between Buildings A and Q: two
 * heavy posts of weathered salvaged timber with knee braces, a doubled beam across, and on it the pier's sign — white
 * serif PIER 39 on a royal-blue board in a white rule (Commons "Pier 39 sign (TK1)"), both faces, floodlit by two
 * gooseneck lamps. The pier's signs are on its buildings; the gate is the style, set where the rider comes in.
 * Placed at the walkway, rotateDeg 0: the board faces south down the plaza to the Embarcadero.
 */
export function pier39Gate(out: MeshBuilder, _fit: Fit): void {
  const TIMBER: Rgb = [0.38, 0.3, 0.22], DARKT: Rgb = [0.27, 0.21, 0.16], BLUE: Rgb = [0.18, 0.36, 0.72], WHITE: Rgb = [0.95, 0.95, 0.93]
  const WT = surfaceTag('clapboard'), MT = surfaceTag('metal')
  const HALF = 6.2, TOP = 6.4
  for (const sx of [-1, 1]) {
    box(out, sx * HALF, TOP / 2, 0, 0.32, TOP / 2, 0.32, TIMBER, WT)
    box(out, sx * HALF, 0.15, 0, 0.5, 0.15, 0.5, DARKT, WT)
    // the knee brace up to the beam
    tube(out, [sx * HALF, TOP - 2.0, 0], [sx * (HALF - 1.6), TOP - 0.4, 0], 0.13, 4, DARKT, WT)
    // a gooseneck lamp over the board, each face
    for (const sz of [-1, 1]) {
      tube(out, [sx * 3.2, TOP + 2.25, sz * 0.25], [sx * 3.2, TOP + 2.6, sz * 0.25], 0.04, 6, [0.15, 0.15, 0.16], MT)
      tube(out, [sx * 3.2, TOP + 2.6, sz * 0.25], [sx * 3.2, TOP + 2.6, sz * 0.9], 0.04, 6, [0.15, 0.15, 0.16], MT)
      box(out, sx * 3.2, TOP + 2.52, sz * 0.95, 0.18, 0.08, 0.14, [0.15, 0.15, 0.16], MT)
    }
  }
  // the doubled beam, each end run past the posts
  box(out, 0, TOP - 0.15, -0.2, HALF + 0.7, 0.2, 0.14, TIMBER, WT)
  box(out, 0, TOP - 0.15, 0.2, HALF + 0.7, 0.2, 0.14, TIMBER, WT)
  // the board: blue, a white rule round it, the letters on both faces
  box(out, 0, TOP + 1.05, 0, 4.9, 0.95, 0.12, WHITE, MT)
  box(out, 0, TOP + 1.05, 0, 4.75, 0.82, 0.16, BLUE, MT)
  for (const side of [1, -1]) {
    sign(out, { type: 'flat', text: 'PIER 39', h: 1.0, face: 'didone', weight: 'bold', colour: WHITE, lit: 'front', tracking: 0.08 },
      { x: 0, y: TOP + 1.0, z: side * 0.2, heading: side > 0 ? 0 : Math.PI })
  }
}

/** a carousel horse, prancing, its nose along +x from (x, y, z) (y the hooves' plane), turned `a` about the vertical */
function horse(mb: MeshBuilder, x: number, y: number, z: number, a: number, coat: Rgb, saddle: Rgb, tag: number): void {
  const c = Math.cos(a), s = Math.sin(a)
  const P = (u: number, v: number, w: number): V3 => [x + u * c - w * s, y + v, z + u * s + w * c]
  const GOLD: Rgb = [0.85, 0.68, 0.25]
  tube(mb, P(-0.42, 0.95, 0), P(0.38, 1.0, 0), 0.2, 8, coat, tag, 0.19)              // the barrel
  tube(mb, P(0.34, 1.02, 0), P(0.55, 1.4, 0), 0.12, 6, coat, tag, 0.09)              // the neck, raised
  tube(mb, P(0.5, 1.42, 0), P(0.82, 1.3, 0), 0.1, 6, coat, tag, 0.06)                // the head
  tube(mb, P(0.36, 1.25, 0), P(0.46, 1.55, 0), 0.05, 4, GOLD, tag, 0.03)             // the gilded mane
  for (const w of [-0.11, 0.11]) {
    tube(mb, P(0.28, 0.85, w), P(0.5, 0.62, w), 0.05, 5, coat, tag, 0.04)            // forelegs, pawing the air
    tube(mb, P(0.5, 0.62, w), P(0.42, 0.42, w), 0.04, 5, coat, tag, 0.03)
    tube(mb, P(-0.36, 0.85, w), P(-0.45, 0.45, w), 0.05, 5, coat, tag, 0.04)         // hind legs
    tube(mb, P(-0.45, 0.45, w), P(-0.4, 0.08, w), 0.04, 5, coat, tag, 0.035)
  }
  tube(mb, P(-0.42, 1.0, 0), P(-0.68, 0.7, 0), 0.06, 5, GOLD, tag, 0.02)             // the tail
  tube(mb, P(-0.12, 1.16, 0), P(0.12, 1.17, 0), 0.17, 8, saddle, tag, 0.17)          // the saddle and its blanket
}

/**
 * The SAN FRANCISCO CAROUSEL at the end of Pier 39 (way/128240118): a two-storey Venetian carousel under a peaked
 * canopy striped blue and white with gilt trim and a red-and-white finial, its rounding boards bright with painted
 * panels and ringed with bulbs, horses on brass poles on both decks — and it TURNS (MeshBuilder.rotors), slowly, the
 * way it does. The stage and booths in front of it are `pier39Stage`. Commons "Pier 39 - July 2025 - Sarah Stierch".
 * (Was the pier's generic timber shop.)
 */
export function sfCarousel39(out: MeshBuilder, fit: Fit): void {
  const R = Math.max(4.5, Math.min(fit.hx, fit.hz)) - 0.2
  const BLUE: Rgb = [0.2, 0.42, 0.78], WHITE: Rgb = [0.96, 0.95, 0.92], GOLD: Rgb = [0.88, 0.7, 0.28], RED: Rgb = [0.82, 0.14, 0.16]
  const CREAM: Rgb = [0.94, 0.88, 0.72], BRASS: Rgb = [0.86, 0.72, 0.36], DECK: Rgb = [0.55, 0.4, 0.28]
  const MT = surfaceTag('metal'), WT = surfaceTag('clapboard')
  const UP = 4.2, TOP = 8.2
  // the standing parts: the round base and its step, the centre column's housing, the outer posts holding the canopy
  prism(out, 0, 0, 0, 0.35, R + 0.6, 32, [0.62, 0.6, 0.56], surfaceTag('concrete'))
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2
    tube(out, [Math.sin(a) * (R + 0.35), 0.35, Math.cos(a) * (R + 0.35)], [Math.sin(a) * (R + 0.35), TOP, Math.cos(a) * (R + 0.35)], 0.09, 8, k % 2 ? GOLD : WHITE, MT)
  }
  // the rounding boards at each storey: a band of painted panels, gilt edges, a ring of bulbs
  for (const [y0, y1] of [[UP - 0.9, UP], [TOP - 1.1, TOP]] as [number, number][]) {
    const N = 32
    for (let k = 0; k < N; k++) {
      const a0 = (k / N) * Math.PI * 2, a1 = ((k + 1) / N) * Math.PI * 2, am = (a0 + a1) / 2
      const q = (a: number, y: number): V3 => [Math.sin(a) * (R + 0.5), y, Math.cos(a) * (R + 0.5)]
      const panel: Rgb = k % 4 === 0 ? RED : k % 4 === 2 ? BLUE : CREAM
      out.quad([q(a0, y0), q(a1, y0), q(a1, y1), q(a0, y1)], [Math.sin(am), 0, Math.cos(am)], UVQ, panel, WT)
      out.quad([q(a0, y1 - 0.08), q(a1, y1 - 0.08), q(a1, y1 + 0.06), q(a0, y1 + 0.06)], [Math.sin(am), 0, Math.cos(am)], UVQ, GOLD, MT)
      out.quad([q(a0, y0 - 0.06), q(a1, y0 - 0.06), q(a1, y0 + 0.08), q(a0, y0 + 0.08)], [Math.sin(am), 0, Math.cos(am)], UVQ, GOLD, MT)
      const b = q(am, (y0 + y1) / 2)
      box(out, b[0] * 1.012, b[1], b[2] * 1.012, 0.06, 0.06, 0.06, [1, 0.92, 0.6], EMIT)
    }
  }
  // the upper deck's floor (standing: it is the roof of the lower ring), its rail
  prism(out, 0, 0, UP - 0.95, UP - 0.75, R + 0.5, 32, DECK, WT)
  // the canopy: a peaked tent, segments striped blue and white, scalloped gilt valance, the finial with its pennant
  const SEG = 24
  for (let k = 0; k < SEG; k++) {
    const a0 = (k / SEG) * Math.PI * 2, a1 = ((k + 1) / SEG) * Math.PI * 2, am = (a0 + a1) / 2
    const rim = (a: number): V3 => [Math.sin(a) * (R + 0.9), TOP, Math.cos(a) * (R + 0.9)]
    const mid = (a: number): V3 => [Math.sin(a) * (R * 0.5), TOP + 1.7, Math.cos(a) * (R * 0.5)]
    const apex: V3 = [0, TOP + 3.6, 0]
    const col = k % 2 ? BLUE : WHITE
    out.quad([rim(a0), rim(a1), mid(a1), mid(a0)], [Math.sin(am) * 0.6, 1, Math.cos(am) * 0.6], UVQ, col, WT)
    out.quad([mid(a0), mid(a1), apex, apex], [Math.sin(am) * 0.9, 1, Math.cos(am) * 0.9], UVQ, col, WT)
    // a scallop under each segment's edge
    const v: V3 = [Math.sin(am) * (R + 0.92), TOP - 0.45, Math.cos(am) * (R + 0.92)]
    out.quad([rim(a0), rim(a1), v, v], [Math.sin(am), 0, Math.cos(am)], UVQ, GOLD, MT)
  }
  tube(out, [0, TOP + 3.5, 0], [0, TOP + 5.2, 0], 0.06, 6, GOLD, MT)
  lozenge(out, [0, TOP + 3.75, 0], [1, 0, 0], [0, 0, 1], [0, 1, 0], 0.32, 0.32, 0.3, RED, MT, 12)
  out.quad([[0, TOP + 5.15, 0], [1.1, TOP + 4.95, 0.1], [1.1, TOP + 4.95, 0.1], [0, TOP + 4.7, 0]], [0, 0, 1], UVQ, RED, WT)
  out.quad([[0, TOP + 5.15, 0], [0, TOP + 4.7, 0], [1.1, TOP + 4.95, 0.1], [1.1, TOP + 4.95, 0.1]], [0, 0, -1], UVQ, WHITE, WT)
  /*
   * What turns: both decks, the horses on their brass poles (two rings below, one above), the mirrored centre column —
   * drawn about the centre, turning about the vertical at about three turns a minute.
   */
  const turn = new (out.constructor as new () => MeshBuilder)()
  prism(turn, 0, 0, 0.35, 0.55, R, 32, DECK, WT)
  prism(turn, 0, 0, UP - 0.75, UP - 0.6, R - 0.2, 32, DECK, WT)
  prism(turn, 0, 0, 0.55, TOP - 0.3, 1.2, 12, CREAM, WT)
  for (const y of [1.6, UP + 1.6]) prism(turn, 0, 0, y, y + 1.0, 1.24, 12, [0.75, 0.82, 0.88], surfaceTag('glass'))
  const coats: Rgb[] = [[0.95, 0.94, 0.9], [0.55, 0.36, 0.22], [0.25, 0.2, 0.18], [0.92, 0.82, 0.62], [0.7, 0.7, 0.72]]
  const saddles: Rgb[] = [RED, BLUE, [0.2, 0.55, 0.35], GOLD, [0.6, 0.2, 0.55]]
  let n = 0
  for (const [rr, cnt, floor] of [[R - 0.8, 14, 0.55], [R - 2.1, 10, 0.55], [R - 1.0, 12, UP - 0.6]] as [number, number, number][]) {
    for (let k = 0; k < cnt; k++) {
      const a = ((k + (floor > 1 ? 0.5 : rr < R - 1.5 ? 0.25 : 0)) / cnt) * Math.PI * 2
      const x = Math.sin(a) * rr, z = Math.cos(a) * rr
      // each up or down its pole a little, as they ride
      const bob = 0.25 * Math.sin(k * 1.9 + rr)
      tube(turn, [x, floor, z], [x, floor + 3.1, z], 0.035, 6, BRASS, MT)
      // nose pointing the way it goes round (anticlockwise from above: tangent (cos a, −sin a))
      horse(turn, x, floor + 0.35 + bob, z, Math.atan2(-Math.sin(a), Math.cos(a)), coats[n % coats.length], saddles[n % saddles.length], WT)
      n++
    }
  }
  out.rotors.push({ x: 0, y: 0, z: 0, nx: 0, ny: 1, nz: 0, mb: turn, rpm: 3 })
}

/**
 * The STAGE on the Pier 39 carousel plaza, and the booths round it: a small stage under a peaked tent canopy striped
 * blue and white with a gilt-and-red valance and PIER 39 on its board, flanked by two striped ticket booths with
 * pointed roofs and pennants — the circus-like heart of the pier (owner, 2026-10-16: "a circus-like activity center at
 * pier 39"). Commons "Pier 39 - July 2025 - Sarah Stierch". Placed on the plaza before the carousel, rotateDeg 0, the
 * stage facing south down the pier.
 */
export function pier39Stage(out: MeshBuilder, _fit: Fit): void {
  const BLUE: Rgb = [0.18, 0.4, 0.78], WHITE: Rgb = [0.97, 0.96, 0.93], GOLD: Rgb = [0.92, 0.74, 0.25], RED: Rgb = [0.84, 0.16, 0.18]
  const YEL: Rgb = [0.98, 0.82, 0.2], DECK: Rgb = [0.4, 0.3, 0.22], DARK: Rgb = [0.12, 0.13, 0.16]
  const MT = surfaceTag('metal'), WT = surfaceTag('clapboard')
  // the stage: a deck a metre up, a dark back wall, yellow-and-blue posts, the striped tent roof
  box(out, 0, 0.5, 0, 3.6, 0.5, 2.4, DECK, WT)
  box(out, 0, 0.9, -2.45, 3.6, 0.1, 0.05, YEL, WT)
  box(out, 0, 2.6, 2.3, 3.4, 1.6, 0.1, DARK, WT)
  for (const x of [-3.5, 3.5]) for (const z of [-2.3, 2.3]) tube(out, [x, 1, z], [x, 4.4, z], 0.12, 8, z < 0 ? YEL : BLUE, MT)
  const SEG = 16
  const corner = (k: number): V3 => {
    const t = k / SEG, side = Math.min(3, Math.floor(t * 4)), f = t * 4 - side
    const pts: [number, number][] = [[-3.7, -2.5], [3.7, -2.5], [3.7, 2.5], [-3.7, 2.5]]
    const a = pts[side], b = pts[(side + 1) % 4]
    return [a[0] + (b[0] - a[0]) * f, 4.4, a[1] + (b[1] - a[1]) * f]
  }
  for (let k = 0; k < SEG; k++) {
    const p0 = corner(k), p1 = corner(k + 1)
    out.quad([p0, p1, [0, 6.6, 0], [0, 6.6, 0]], [p0[0] + p1[0], 6, p0[2] + p1[2]], UVQ, k % 2 ? BLUE : WHITE, WT)
    // the valance: a red band, gold scallops
    const m: V3 = [(p0[0] + p1[0]) / 2, 3.95, (p0[2] + p1[2]) / 2]
    out.quad([p0, p1, [p1[0], 4.1, p1[2]], [p0[0], 4.1, p0[2]]], [p0[0] + p1[0], 0, p0[2] + p1[2]], UVQ, RED, WT)
    out.quad([[p0[0], 4.1, p0[2]], [p1[0], 4.1, p1[2]], m, m], [p0[0] + p1[0], 0, p0[2] + p1[2]], UVQ, GOLD, MT)
  }
  tube(out, [0, 6.5, 0], [0, 7.6, 0], 0.05, 6, GOLD, MT)
  lozenge(out, [0, 6.7, 0], [1, 0, 0], [0, 0, 1], [0, 1, 0], 0.2, 0.2, 0.2, GOLD, MT, 10)
  out.quad([[0, 7.55, 0], [0.8, 7.4, 0], [0.8, 7.4, 0], [0, 7.2, 0]], [0, 0, 1], UVQ, RED, WT)
  out.quad([[0, 7.55, 0], [0, 7.2, 0], [0.8, 7.4, 0], [0.8, 7.4, 0]], [0, 0, -1], UVQ, RED, WT)
  // the stage's board over the front: PIER 39, white on blue
  box(out, 0, 4.75, -2.55, 1.6, 0.35, 0.06, BLUE, WT)
  sign(out, { type: 'flat', text: 'PIER 39', h: 0.4, face: 'didone', weight: 'bold', colour: WHITE, lit: 'front' }, { x: 0, y: 4.72, z: -2.62, heading: Math.PI })
  // the booths, either side: striped walls, a pointed roof, a pennant
  for (const sx of [-1, 1]) {
    const bx = sx * 6.2, bz = -0.5
    for (let k = 0; k < 8; k++) {
      const a0 = (k / 8) * Math.PI * 2, a1 = ((k + 1) / 8) * Math.PI * 2
      const q = (a: number, y: number): V3 => [bx + Math.sin(a) * 1.1, y, bz + Math.cos(a) * 1.1]
      out.quad([q(a0, 0), q(a1, 0), q(a1, 2.4), q(a0, 2.4)], [Math.sin((a0 + a1) / 2), 0, Math.cos((a0 + a1) / 2)], UVQ, k % 2 ? RED : WHITE, WT)
      out.quad([q(a0, 2.4), q(a1, 2.4), [bx, 3.9, bz], [bx, 3.9, bz]], [Math.sin((a0 + a1) / 2), 0.8, Math.cos((a0 + a1) / 2)], UVQ, k % 2 ? BLUE : YEL, WT)
    }
    box(out, bx, 1.4, bz - 1.08, 0.5, 0.35, 0.03, [0.25, 0.3, 0.35], surfaceTag('glass'))
    tube(out, [bx, 3.85, bz], [bx, 4.7, bz], 0.03, 5, GOLD, MT)
    out.quad([[bx, 4.65, bz], [bx + 0.55, 4.5, bz], [bx + 0.55, 4.5, bz], [bx, 4.35, bz]], [0, 0, 1], UVQ, sx > 0 ? RED : BLUE, WT)
    out.quad([[bx, 4.65, bz], [bx, 4.35, bz], [bx + 0.55, 4.5, bz], [bx + 0.55, 4.5, bz]], [0, 0, -1], UVQ, sx > 0 ? RED : BLUE, WT)
  }
}

/**
 * PIER 39's FOOTBRIDGE over the Embarcadero (BUGS.md #296; owner, 2026-10-16: "we should probably have a custom renderer
 * for that one particular footbridge though since it's so prominent", with a Street View): a deep girder of dark
 * red-brown timber, a blue steel railing of close pickets on each side, carried on PAIRS of round pale concrete columns
 * with square caps, out of the garage's upper floor and across the street. On the deck the ways take their heights from
 * (city/sf/bridges.ts PIER39_BRIDGE_PATH, pier39BridgeY), so the walkers are on it. Placed at the L's corner, rotateDeg
 * 0, baseY the street (PIER39_BRIDGE_GROUND).
 */
export function pier39Footbridge(out: MeshBuilder, _fit: Fit): void {
  const GIRDER: Rgb = [0.4, 0.19, 0.15], DECKT: Rgb = [0.5, 0.45, 0.4], BLUE: Rgb = [0.16, 0.36, 0.62], COL: Rgb = [0.82, 0.8, 0.75]
  const WT = surfaceTag('clapboard'), MT = surfaceTag('metal'), CT = surfaceTag('concrete')
  const path = PIER39_BRIDGE_PATH
  const lens: number[] = [0]
  for (let i = 1; i < path.length; i++) lens.push(lens[i - 1] + Math.hypot(path[i].x - path[i - 1].x, path[i].z - path[i - 1].z))
  const L = lens[lens.length - 1]
  const at = (d: number): { x: number; z: number } => {
    d = Math.max(0, Math.min(L, d))
    let i = 1
    while (i < path.length - 1 && lens[i] < d) i++
    const t = (d - lens[i - 1]) / (lens[i] - lens[i - 1] || 1)
    return { x: path[i - 1].x + (path[i].x - path[i - 1].x) * t, z: path[i - 1].z + (path[i].z - path[i - 1].z) * t }
  }
  const y = (d: number): number => pier39BridgeY(d)
  // the centre line every half metre, the corner eased over a few metres so the girder bends, not kinks
  const S: { x: number; z: number; y: number; nx: number; nz: number }[] = []
  for (let d = 0; d <= L + 0.01; d += 0.5) {
    const a = at(d - 2.5), b = at(d + 2.5), c = at(d)
    const tl = Math.hypot(b.x - a.x, b.z - a.z) || 1
    S.push({ x: c.x, z: c.z, y: y(d), nx: -(b.z - a.z) / tl, nz: (b.x - a.x) / tl })
  }
  const HALF = 1.6, DEEP = 1.35
  const P = (k: number, o: number, dy: number): V3 => [S[k].x + S[k].nx * o, S[k].y + dy, S[k].z + S[k].nz * o]
  for (let k = 0; k + 1 < S.length; k++) {
    const nrm = (o: number): V3 => [S[k].nx * Math.sign(o), 0, S[k].nz * Math.sign(o)]
    // the walking surface, the girder's two faces and its soffit, and the girder's top edge either side
    out.quad([P(k, -HALF, 0), P(k + 1, -HALF, 0), P(k + 1, HALF, 0), P(k, HALF, 0)], [0, 1, 0], UVQ, DECKT, WT)
    for (const o of [-HALF - 0.12, HALF + 0.12]) out.quad([P(k, o, -DEEP), P(k + 1, o, -DEEP), P(k + 1, o, 0.25), P(k, o, 0.25)], nrm(o), UVQ, GIRDER, WT)
    out.quad([P(k, -HALF - 0.12, -DEEP), P(k + 1, -HALF - 0.12, -DEEP), P(k + 1, HALF + 0.12, -DEEP), P(k, HALF + 0.12, -DEEP)], [0, -1, 0], UVQ, GIRDER, WT)
    for (const [o0, o1] of [[-HALF - 0.12, -HALF], [HALF, HALF + 0.12]]) out.quad([P(k, o0, 0.25), P(k + 1, o0, 0.25), P(k + 1, o1, 0.25), P(k, o1, 0.25)], [0, 1, 0], UVQ, GIRDER, WT)
    // the railing: a top rail and a mid rail, pickets every 0.25 m, posts every 2.5 m
    for (const o of [-HALF + 0.05, HALF - 0.05]) {
      for (const h of [1.12, 0.6]) tube(out, P(k, o, h), P(k + 1, o, h), h > 1 ? 0.04 : 0.025, 4, BLUE, MT)
      tube(out, P(k, o, 0.25), P(k, o, 1.12), k % 5 === 0 ? 0.04 : 0.012, 4, BLUE, MT)
      if (k % 5 !== 0) { const m = P(k, o, 0.25); const m1 = P(k + 1, o, 0.25); tube(out, [(m[0] + m1[0]) / 2, m[1], (m[2] + m1[2]) / 2], [(m[0] + m1[0]) / 2, m[1] + 0.87, (m[2] + m1[2]) / 2], 0.012, 4, BLUE, MT) }
    }
  }
  // the columns, in pairs, clear of the carriageways (the Embarcadero crosses the north leg 2.7-15.3 m from the corner,
  // the busway 15.5-18.5, the service road 22.3-27.3): along the garage, at the corner, and between the roads beyond
  const corner = lens[2]
  for (const d of [8, 24, corner - 1, corner + 20.2, corner + 30.5, corner + 40]) {
    const k = Math.round(d / 0.5)
    if (k <= 0 || k >= S.length) continue
    const top = S[k].y - DEEP
    if (top < 0.6) continue
    for (const o of [-1.0, 1.0]) {
      const c = P(k, o, 0)
      prism(out, c[0], c[2], 0, top - 0.5, 0.38, 12, COL, CT)
      box(out, c[0], top - 0.25, c[2], 0.5, 0.25, 0.5, COL, CT)
    }
  }
}

export const WHARF_CARNIVAL: Record<string, (out: MeshBuilder, fit: Fit) => void> = { wharfSign, skystarWheel, pier39Gate, sfCarousel39, pier39Stage, pier39Footbridge }
