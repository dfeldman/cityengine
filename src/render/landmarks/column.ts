/**
 * Classical columns, shared (PLAN.md item Z, user 2026-09-22: "we should improve our builder kit to be able to
 * do decent classical columns… there are thousands of places they're needed").
 *
 * There were three implementations and the most-used one — `colonnade()` in parts.ts — drew SQUARE BOXES. This
 * is the one primitive all of them now go through.
 *
 * What it draws, roughly in the order the money buys the most:
 *  1. a ROUND shaft that narrows toward the top on a CURVE (entasis), not a cone and certainly not a box;
 *  2. a real capital per order — Doric (echinus + square abacus), Ionic (a bolster with a scroll either side),
 *     Corinthian (a flared bell with a ring of leaves, which is what the Madeleine, the Panthéon and half of
 *     Civic Center are wearing);
 *  3. a base — plinth, torus, fillet, so the column is not pushed into the ground;
 *  4. flutes, which at any distance a rider sees a column from are just a 16- or 20-sided shaft, so that is
 *     what `flutes` does unless the shaft is already that fine.
 *
 * THE CONSTRAINT: there are thousands of them. A 400-triangle column is fine on the Madeleine's portico and
 * ruinous down a street of bank fronts, and this geometry streams past at 14 m/s (README, the descent). So
 * there are explicit TIERS, in the spirit of the tree LODs:
 *
 *   far   a tapered round prism and a slab      ~28 tris   — a row of bank fronts, a park loggia
 *   mid   + a modelled base and echinus         ~100–150   — a civic building across the street
 *   near  + the full capital of its order       ~220–300   — the portico that IS the building
 *
 * The caller picks; with nothing said the tier follows the column's height (>= 12 m near, >= 6 m mid, else
 * far), which is the right guess for both the dozens of landmark columns and the thousands of district ones.
 *
 * Frame-agnostic: y is up, `heading` follows the kit's `boxAlong` convention (the direction the front FACES,
 * 0 facing +z) and is only used to aim the Ionic volutes. Imports nothing but models.ts, so parts.ts, kit.ts
 * and the Paris/SF builders can all reach it without a cycle.
 */
import type { MeshBuilder } from '../buildings.ts'
import type { Rgb } from '../models.ts'

const FIXED = 0
const UVQ: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

export type ColumnOrder = 'tuscan' | 'doric' | 'ionic' | 'corinthian'
export type ColumnTier = 'near' | 'mid' | 'far'

export interface ColumnOpts {
  /** which order's capital; 'tuscan' is the plain slab, and what the far tier draws whatever is asked */
  order?: ColumnOrder
  /** how much of it to model; omitted, it follows the height */
  tier?: ColumnTier
  /** the surface tag (surfaceTag('ashlar') and friends) */
  tag?: number
  /** the direction the colonnade's front faces (0 = +z), for the Ionic volutes */
  heading?: number
  /** real flutes: a finer shaft with an alternating radius. Only for the handful where the column is the subject. */
  flutes?: boolean
  /** the capital and base stone, when it is dressed lighter than the shaft */
  trim?: Rgb
}

/** Choose a tier from the column's height when the caller did not say. */
export function tierFor(height: number): ColumnTier {
  return height >= 12 ? 'near' : height >= 6 ? 'mid' : 'far'
}

/**
 * A surface of revolution from a profile: consecutive (r, y) rings joined by a band of quads, with the normal
 * taken from the band's slope. Everything below — shaft, torus, echinus, bell — is one of these, which is why
 * entasis and the capitals cost no extra code paths.
 *
 * `flute` alternates the radius vertex by vertex, which is what a fluted shaft looks like from a street.
 */
export function lathe(out: MeshBuilder, cx: number, cz: number, prof: [number, number][], sides: number,
                      colour: Rgb, tag = FIXED, flute = 0): void {
  const rAt = (r: number, i: number): number => (flute > 0 && i % 2 === 1 ? r * (1 - flute) : r)
  for (let k = 0; k < prof.length - 1; k++) {
    const [r0, y0] = prof[k]
    const [r1, y1] = prof[k + 1]
    const slope = (r0 - r1) / Math.max(0.01, Math.abs(y1 - y0))
    for (let i = 0; i < sides; i++) {
      const a0 = (i / sides) * Math.PI * 2
      const a1 = ((i + 1) / sides) * Math.PI * 2
      const am = (a0 + a1) / 2
      const p0 = rAt(r0, i)
      const p1 = rAt(r0, i + 1)
      const q0 = rAt(r1, i)
      const q1 = rAt(r1, i + 1)
      out.quad([
        [cx + Math.sin(a0) * p0, y0, cz + Math.cos(a0) * p0], [cx + Math.sin(a1) * p1, y0, cz + Math.cos(a1) * p1],
        [cx + Math.sin(a1) * q1, y1, cz + Math.cos(a1) * q1], [cx + Math.sin(a0) * q0, y1, cz + Math.cos(a0) * q0],
      ], [Math.sin(am), slope, Math.cos(am)], UVQ, colour, tag)
    }
  }
}

/**
 * A box turned to a heading — the same arithmetic as parts.ts `boxAlong`, kept local because parts.ts imports
 * this file and a cycle here would be a build error rather than a drawing bug.
 */
function turnBox(out: MeshBuilder, cx: number, cy: number, cz: number, hx: number, hy: number, hz: number,
                 heading: number, c: Rgb, tag: number): void {
  const s = Math.sin(heading)
  const co = Math.cos(heading)
  const P = (dx: number, dy: number, dz: number): [number, number, number] => [cx + dx * co + dz * s, cy + dy, cz - dx * s + dz * co]
  const faces: [[number, number, number][], [number, number, number]][] = [
    [[P(-hx, -hy, hz), P(hx, -hy, hz), P(hx, hy, hz), P(-hx, hy, hz)], [s, 0, co]],
    [[P(hx, -hy, -hz), P(-hx, -hy, -hz), P(-hx, hy, -hz), P(hx, hy, -hz)], [-s, 0, -co]],
    [[P(hx, -hy, hz), P(hx, -hy, -hz), P(hx, hy, -hz), P(hx, hy, hz)], [co, 0, -s]],
    [[P(-hx, -hy, -hz), P(-hx, -hy, hz), P(-hx, hy, hz), P(-hx, hy, -hz)], [-co, 0, s]],
    [[P(-hx, hy, hz), P(hx, hy, hz), P(hx, hy, -hz), P(-hx, hy, -hz)], [0, 1, 0]],
    [[P(-hx, -hy, -hz), P(hx, -hy, -hz), P(hx, -hy, hz), P(-hx, -hy, hz)], [0, -1, 0]],
  ]
  for (const [q, n] of faces) out.quad(q, n, UVQ, c, tag)
}

/** The entasis curve: the radius a fraction `t` of the way up a shaft. A slight bulge, not a straight cone. */
const entasis = (r: number, t: number): number => r * (1 - 0.18 * Math.pow(t, 1.8))

/**
 * ONE classical column, standing at (x, z) from y0 to y1 with shaft radius `r` at the foot.
 *
 * Backwards-compatible with the three things it replaced: called with no options it draws a Tuscan column
 * whose tier follows its height, which is a strict improvement on a square post at no more cost.
 */
export function classicalColumn(out: MeshBuilder, x: number, z: number, y0: number, y1: number, r: number,
                                colour: Rgb, opts: ColumnOpts = {}): void {
  const H = Math.max(0.2, y1 - y0)
  /*
   * BUGS.md #97: the `far` tier draws a tuscan slab whatever order was asked for, and it used to be CHOSEN
   * silently for anything under 6 m — every shopfront-height column a model will ever write. An order asked for
   * explicitly is now honoured by promoting the automatic tier to `mid`, which draws a real capital for about
   * 100 triangles. A caller who names `tier: 'far'` still gets `far`: that is a stated cost decision, not an
   * omission, and a row of bank fronts at distance still costs 28 triangles a column.
   */
  const asked = opts.order && opts.order !== 'tuscan'
  const tier = opts.tier ?? (asked && tierFor(H) === 'far' ? 'mid' : tierFor(H))
  const tag = opts.tag ?? FIXED
  const trim = opts.trim ?? colour
  const order: ColumnOrder = tier === 'far' ? 'tuscan' : opts.order ?? 'doric'
  const heading = opts.heading ?? 0

  /* ---- the far tier: a tapered round prism and a slab. Cheaper than the three boxes it replaces, and round. */
  if (tier === 'far') {
    const capH = Math.min(H * 0.1, r * 0.9)
    lathe(out, x, z, [[r, y0], [entasis(r, 1), y1 - capH]], 8, colour, tag)
    turnBox(out, x, y1 - capH / 2, z, r * 1.25, capH / 2, r * 1.25, heading, trim, tag)
    return
  }

  const near = tier === 'near'
  const sides = opts.flutes ? 20 : near ? 16 : 12
  const flute = opts.flutes ? 0.07 : 0
  const baseH = Math.min(H * 0.07, r * 0.8)
  const capH = order === 'corinthian' ? Math.min(H * 0.14, r * 2.2)
    : order === 'ionic' ? Math.min(H * 0.09, r * 1.3)
      : Math.min(H * 0.08, r * 1.0)
  const sy = y0 + baseH                 // the foot of the shaft
  const ty = y1 - capH                  // the neck, where the capital begins
  const rTop = entasis(r, 1)

  /* ---- the base: a square plinth, a torus above it, and a fillet under the shaft. */
  const plinth = baseH * 0.38
  turnBox(out, x, y0 + plinth / 2, z, r * 1.32, plinth / 2, r * 1.32, heading, trim, tag)
  const bp: [number, number][] = near
    ? [[r * 1.26, y0 + plinth], [r * 1.3, y0 + plinth + (baseH - plinth) * 0.45], [r * 1.04, sy]]
    : [[r * 1.28, y0 + plinth], [r * 1.04, sy]]
  lathe(out, x, z, bp, sides, trim, tag)

  /* ---- the shaft: entasis over 3 segments near, 1 mid — the curve is what stops it reading as a cone. */
  const segs = near ? 3 : 1
  const shaft: [number, number][] = []
  for (let k = 0; k <= segs; k++) shaft.push([entasis(r, k / segs), sy + ((ty - sy) * k) / segs])
  lathe(out, x, z, shaft, sides, colour, tag, flute)

  /* ---- the capital. */
  if (order === 'corinthian') {
    // the bell: a concave flare out to the abacus, which is what reads as Corinthian at any street distance
    const bell: [number, number][] = []
    const bh = capH * 0.82
    const segsB = near ? 3 : 2
    for (let k = 0; k <= segsB; k++) {
      const t = k / segsB
      bell.push([rTop * (1 + 0.85 * t * t), ty + bh * t])
    }
    lathe(out, x, z, bell, sides, trim, tag)
    if (near) {
      // two rings of leaves: short tapered tabs standing out of the bell, a suggestion rather than acanthus
      for (const [ring, ry, rh, lr] of [[6, ty + bh * 0.08, bh * 0.42, rTop * 1.12], [6, ty + bh * 0.42, bh * 0.5, rTop * 1.42]] as const) {
        for (let i = 0; i < ring; i++) {
          const a = ((i + 0.5) / ring) * Math.PI * 2
          const lx = x + Math.sin(a) * lr
          const lz = z + Math.cos(a) * lr
          lathe(out, lx, lz, [[rTop * 0.2, ry], [rTop * 0.07, ry + rh]], 3, trim, tag)
        }
      }
    }
    turnBox(out, x, ty + bh + (capH - bh) / 2, z, rTop * 1.95, (capH - bh) / 2, rTop * 1.95, heading, trim, tag)
    return
  }

  if (order === 'ionic') {
    // a shallow echinus, the bolster across the face, and a scroll on each end of it — the volutes
    lathe(out, x, z, [[rTop, ty], [rTop * 1.18, ty + capH * 0.45]], sides, trim, tag)
    const vy = ty + capH * 0.55
    const vr = rTop * 1.25
    turnBox(out, x, vy, z, vr, capH * 0.22, rTop * 0.9, heading, trim, tag)
    const s = Math.sin(heading)
    const co = Math.cos(heading)
    for (const sgn of [-1, 1]) {
      const vx = x + sgn * vr * co
      const vz = z - sgn * vr * s
      // the scroll: a short spiral of quads in the plane of the face, drawn on both cheeks of the bolster
      const turns = near ? 6 : 4
      for (const cheek of [-1, 1]) {
        const ox = cheek * rTop * 0.92 * s
        const oz = cheek * rTop * 0.92 * co
        const pts: [number, number][] = []
        for (let k = 0; k <= turns; k++) {
          const a = (k / turns) * Math.PI * 1.9
          const rr = capH * 0.3 * (1 - (k / turns) * 0.62)
          pts.push([Math.cos(a) * rr * sgn, Math.sin(a) * rr])
        }
        for (let k = 0; k < turns; k++) {
          const [ax, ay] = pts[k]
          const [bx, by] = pts[k + 1]
          out.quad([
            [vx + ax * co + ox, vy + ay, vz - ax * s + oz], [vx + bx * co + ox, vy + by, vz - bx * s + oz],
            [vx + bx * co + ox, vy + by - capH * 0.1, vz - bx * s + oz], [vx + ax * co + ox, vy + ay - capH * 0.1, vz - ax * s + oz],
          ], [cheek * s, 0, cheek * co], UVQ, trim, tag)
        }
      }
    }
    turnBox(out, x, y1 - capH * 0.09, z, rTop * 1.55, capH * 0.09, rTop * 1.1, heading, trim, tag)
    return
  }

  // Doric (and Tuscan at mid/near): the echinus curving out to a square abacus
  const eh = capH * 0.62
  const ech: [number, number][] = near
    // the necking fillet, then the echinus curving out — one profile, so the whole capital is a single band pair
    ? [[rTop * 1.05, ty - capH * 0.1], [rTop * 1.1, ty + eh * 0.4], [rTop * 1.36, ty + eh]]
    : [[rTop, ty], [rTop * 1.34, ty + eh]]
  lathe(out, x, z, ech, sides, trim, tag)
  turnBox(out, x, ty + eh + (capH - eh) / 2, z, rTop * 1.5, (capH - eh) / 2, rTop * 1.5, heading, trim, tag)
}
