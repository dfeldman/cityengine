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
