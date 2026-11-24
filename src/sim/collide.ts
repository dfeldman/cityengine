/**
 * Collision boxes: the first part of the game where things can hit each other (owner, 2026-09-29: "we'll need a
 * bbox for cars (and the avatar) since this is the first part of the game with collisions").
 *
 * An ORIENTED box on the ground plane — centre, heading, half-length along the heading, half-width across it —
 * because a car in a junction is turning and an axis-aligned box would grow and shrink as it turns. Height is
 * ignored: nothing here passes over anything else at street level (bridges are separate edges with their own
 * heights, and nothing is simulated on two levels of one junction).
 *
 * Code frame: x east, z north, metres; heading 0 is +z (north), π/2 is +x (east) — the same convention as
 * `Vehicle.heading` (sim/traffic.ts) and the navigator's `heading()`.
 */

export interface Box {
  x: number
  z: number
  heading: number
  /** half the length, along the heading */
  halfLen: number
  /** half the width, across it */
  halfWid: number
}

/** Sizes, metres, full length × width. Generous rather than tight: a near miss at a junction should count. */
export const SIZE = {
  car: { len: 4.4, wid: 1.9 },
  bus: { len: 12, wid: 2.55 },
  bike: { len: 1.8, wid: 0.6 },
  runner: { len: 0.6, wid: 0.6 },
  /** a walked dog (render/dog-walks.ts): a lab's length, a little wider than its body */
  dog: { len: 0.9, wid: 0.4 },
} as const

export const boxOf = (x: number, z: number, heading: number, size: { len: number; wid: number }): Box =>
  ({ x, z, heading, halfLen: size.len / 2, halfWid: size.wid / 2 })

/** the box's two axes: along (forward) and across */
function axes(b: Box): [number, number, number, number] {
  const fx = Math.sin(b.heading)
  const fz = Math.cos(b.heading)
  return [fx, fz, fz, -fx]
}

/** half the box's extent projected onto a unit axis */
function radius(b: Box, ax: number, az: number): number {
  const [fx, fz, rx, rz] = axes(b)
  return b.halfLen * Math.abs(fx * ax + fz * az) + b.halfWid * Math.abs(rx * ax + rz * az)
}

/** Do two boxes overlap? Separating-axis test over the four axes the two boxes have. */
export function overlap(a: Box, b: Box): boolean {
  const dx = b.x - a.x
  const dz = b.z - a.z
  // a cheap reject first: further apart than the two boxes' diagonals
  const ra = Math.hypot(a.halfLen, a.halfWid)
  const rb = Math.hypot(b.halfLen, b.halfWid)
  if (dx * dx + dz * dz > (ra + rb) * (ra + rb)) return false
  const [afx, afz, arx, arz] = axes(a)
  const [bfx, bfz, brx, brz] = axes(b)
  for (const [ax, az] of [[afx, afz], [arx, arz], [bfx, bfz], [brx, brz]] as const) {
    if (Math.abs(dx * ax + dz * az) > radius(a, ax, az) + radius(b, ax, az)) return false
  }
  return true
}

/** the lead's thickness for a hit, metres: a bike's bars catch a lead a hand's width off its centre line */
export const LEAD_REACH = 0.08

/** Does a ground segment a→b (a dog's lead) cross box `b`, grown by `reach`? Tested in the box's own frame (slab clip). */
export function segmentHits(b: Box, ax: number, az: number, bx: number, bz: number, reach = LEAD_REACH): boolean {
  const [fx, fz, rx, rz] = axes(b)
  const p0 = [(ax - b.x) * fx + (az - b.z) * fz, (ax - b.x) * rx + (az - b.z) * rz]
  const p1 = [(bx - b.x) * fx + (bz - b.z) * fz, (bx - b.x) * rx + (bz - b.z) * rz]
  const half = [b.halfLen + reach, b.halfWid + reach]
  let t0 = 0, t1 = 1
  for (let i = 0; i < 2; i++) {
    const d = p1[i] - p0[i]
    if (Math.abs(d) < 1e-9) { if (Math.abs(p0[i]) > half[i]) return false; continue }
    let ta = (-half[i] - p0[i]) / d, tb = (half[i] - p0[i]) / d
    if (ta > tb) [ta, tb] = [tb, ta]
    t0 = Math.max(t0, ta); t1 = Math.min(t1, tb)
    if (t0 > t1) return false
  }
  return true
}
