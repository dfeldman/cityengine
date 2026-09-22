/**
 * Palms, generated (SF_PLAN.md §5; user, 2026-09-22: "put lots of effort into the palm generators, we've had
 * trouble getting decent looking palms in the past"). The tree library grows broadleaf trees and conifers, and a
 * palm is neither. Shared, because more cities than San Francisco have them.
 *
 * Four species (the first two the city's landmarks, the last two its side streets):
 * - **the Canary Island date palm** (Phoenix canariensis): the Embarcadero's row, and every grand avenue in
 *   California. A thick trunk patterned with diamond leaf scars, a knob of fresh orange leaf bases at the top,
 *   fifty-odd long feather fronds — the upper ones standing up, the lower arching right over.
 * - **the Mexican fan palm** (Washingtonia robusta): a trunk as thin as a lamp post rising twice as high, a
 *   small round head of fan leaves, and under it the skirt of dead leaves the city never quite trims.
 * - **the queen palm** (Syagrus romanzoffiana): a slim smooth grey trunk, a green crownshaft, and soft plumed
 *   fronds that arch right over — the palm of the Mission's front yards and the Marina's medians.
 * - **the windmill palm** (Trachycarpus; Chamaerops the same): the fan palm small, its trunk wrapped in fibre.
 * - **the cabbage tree** (Cordyline australis; yucca stands in the same): a short trunk forking into a few stems,
 *   each topped by a tuft of long strap leaves over its hanging dead ones.
 *
 * What goes into a palm that reads as a palm, learned the hard way on the ones that did not:
 * - **The leaflets are painted, not modelled** (tools/palmgen/paint.py): a frond is a CARD along its curved
 *   rachis wearing a painting of a few hundred leaflets, cut out by alpha test like the rest of the foliage.
 * - **The card is folded into a V** up from the rachis, as Phoenix's leaflets stand in a V, and **twists** along
 *   its length, so the frond has thickness from every side and never vanishes edge-on.
 * - **Every frond is different:** its length, the angle it leaves the crown at, how far it droops, its twist, its
 *   shade. The lowest are the oldest: longer, lower, yellower.
 * - **Normals point out from the crown**, not off the card, so the head is lit as a ball of leaves — the trick
 *   that stops cards from reading as flat planes.
 * - **The trunk carries the species:** the Canary palm's diamond scars and its knob, the fan palm's grey rings,
 *   slight lean and dead skirt.
 *
 * Local +y up, the trunk's foot at the origin. Each palm is three meshes a level of detail (trunk, knob or skirt,
 * leaves) — each its own material — built at three levels of detail for the vegetation's distance bands.
 */
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { Texture } from '@babylonjs/core/Materials/Textures/texture'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import type { Scene } from '@babylonjs/core/scene'
import { MeshBuilder } from './buildings.ts'
import type { Rgb } from './models.ts'

type V3 = [number, number, number]
export type PalmKind = 'canary' | 'fan' | 'queen' | 'spiky' | 'windmill'

const rng = (seed: number): (() => number) => {
  let s = seed >>> 0
  return () => { s = (Math.imul(s ^ (s >>> 15), 0x2c1b3c6d) + 0x9e3779b9) >>> 0; return (s % 100000) / 100000 }
}
const norm = (v: V3): V3 => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l] }
const add = (a: V3, b: V3, k = 1): V3 => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k]
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]

/** A quad with its own four uvs and one normal. */
function quad(out: MeshBuilder, p: V3[], uv: [number, number][], n: V3, c: Rgb): void {
  out.quad(p as [V3, V3, V3, V3], n, uv, c, 0)
}

/**
 * A tapering, possibly leaning column with the bark wrapped round it: u round the trunk (repeating `wraps`
 * times), v up it (one repeat every `tile` metres). `x(y)` leans it.
 */
function column(out: MeshBuilder, y0: number, y1: number, r0: number, r1: number, sides: number, rings: number,
                tile: number, wraps: number, c: Rgb, x: (y: number) => number = () => 0): void {
  for (let j = 0; j < rings; j++) {
    const ya = y0 + ((y1 - y0) * j) / rings
    const yb = y0 + ((y1 - y0) * (j + 1)) / rings
    const ra = r0 + ((r1 - r0) * j) / rings
    const rb = r0 + ((r1 - r0) * (j + 1)) / rings
    for (let i = 0; i < sides; i++) {
      const a0 = (i / sides) * Math.PI * 2
      const a1 = ((i + 1) / sides) * Math.PI * 2
      const am = (a0 + a1) / 2
      quad(out, [
        [x(ya) + Math.sin(a0) * ra, ya, Math.cos(a0) * ra], [x(ya) + Math.sin(a1) * ra, ya, Math.cos(a1) * ra],
        [x(yb) + Math.sin(a1) * rb, yb, Math.cos(a1) * rb], [x(yb) + Math.sin(a0) * rb, yb, Math.cos(a0) * rb],
      ], [[(i / sides) * wraps, ya / tile], [((i + 1) / sides) * wraps, ya / tile], [((i + 1) / sides) * wraps, yb / tile], [(i / sides) * wraps, yb / tile]],
      [Math.sin(am), (ra - rb) / Math.max(0.01, yb - ya), Math.cos(am)], c)
    }
  }
}

/**
 * A feather frond: a card along a curved rachis from `base`, heading `yaw`, leaving the crown at `pitch` above
 * horizontal and bending down by `droop` radians over its length; `twist` rolls it along the way. The card is
 * folded up into a V by `fold` from the rachis. `centre` is the crown's centre, for the ball normals. The
 * texture has the rachis along its middle line, base at u = 0.
 */
function featherFrond(out: MeshBuilder, base: V3, centre: V3, yaw: number, pitch: number, droop: number, len: number,
                      halfWidth: number, twist: number, fold: number, segs: number, c: Rgb, uOffset: number): void {
  const fwd0: V3 = [Math.sin(yaw), 0, Math.cos(yaw)]
  const side: V3 = [Math.cos(yaw), 0, -Math.sin(yaw)]
  let p = base
  const pts: { p: V3; dir: V3; t: number }[] = []
  for (let i = 0; i <= segs; i++) {
    const t = i / segs
    const a = pitch - droop * t ** 1.4
    const dir: V3 = [fwd0[0] * Math.cos(a), Math.sin(a), fwd0[2] * Math.cos(a)]
    pts.push({ p, dir, t })
    p = add(p, dir, len / segs)
  }
  for (let i = 0; i < segs; i++) {
    const A = pts[i]
    const B = pts[i + 1]
    // the width profile is painted into the texture; the card is a constant width strip, narrowing only at the
    // very base where the frond leaves the knob
    const w = (t: number): number => halfWidth * Math.min(1, 0.35 + t * 5)
    for (const s of [-1, 1] as const) {
      const edge = (q: { p: V3; dir: V3; t: number }): V3 => {
        // across the frond, rolled by the twist, then folded up by `fold`
        const roll = twist * q.t * s
        const up = norm(cross(q.dir, side))
        const across = add(side, up, Math.tan(roll))
        const ac = norm(across)
        return add(add(q.p, ac, s * w(q.t) * Math.cos(fold)), up, w(q.t) * Math.sin(fold) * -1)
      }
      const eA = edge(A)
      const eB = edge(B)
      const mid = add(A.p, B.p)
      const n = norm(add([mid[0] / 2 - centre[0], mid[1] / 2 - centre[1], mid[2] / 2 - centre[2]], [0, 1.2, 0]))
      const v0 = 0.5
      const v1 = s > 0 ? 0 : 1
      quad(out, [A.p, B.p, eB, eA], [[uOffset + A.t, v0], [uOffset + B.t, v0], [uOffset + B.t, v1], [uOffset + A.t, v1]], n, c)
    }
  }
}

/**
 * A fan leaf: a stalk out from the crown, then the round blade on its end — a grid, cupped along its midline
 * (costapalmate: the blade folds on the rib) and drooping at its sides. The texture's disc centre sits at
 * (0.5, 0.44) in uv, radius 0.5.
 */
function fanLeaf(out: MeshBuilder, stalkBase: V3, centre: V3, yaw: number, pitch: number, stalk: number, R: number,
                 cup: number, n: number, c: Rgb, stalkC: Rgb, flip: boolean, roll = 0): void {
  const fwd: V3 = [Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)]
  const side: V3 = norm([Math.cos(yaw), 0, -Math.sin(yaw)])
  const up = norm(cross(side, fwd))            // the blade's own "up", in its plane
  const tip = add(stalkBase, fwd, stalk)
  // the stalk: a thin flat strip
  const sw: V3 = [side[0] * 0.04, 0, side[2] * 0.04]
  quad(out, [add(stalkBase, sw, -1), add(stalkBase, sw), add(tip, sw), add(tip, sw, -1)], [[0.49, 0.43], [0.51, 0.43], [0.51, 0.45], [0.49, 0.45]], up, stalkC)
  // the blade: faces out along fwd tilted up; built in (a, b) ∈ [-1, 1]²
  const face = norm(add(fwd, up, -0.2))
  // rolled about its stalk: a real head shows leaves at every angle, many nearly edge-on, which is what makes its
  // outline spiky rather than a dome of parasols
  const pv0 = norm(cross(face, side))
  const planeU = norm(add([side[0] * Math.cos(roll), side[1] * Math.cos(roll), side[2] * Math.cos(roll)], pv0, Math.sin(roll)))
  const planeV = norm(cross(face, planeU))
  const at = (a: number, b: number): V3 => {
    const k = flip ? -1 : 1
    let q = add(add(tip, planeU, a * R * k), planeV, b * R)
    q = add(q, face, -cup * R * (a * a) + 0.12 * R * b)          // the cup, and a little lean back at the top
    q = add(q, [0, 1, 0], -0.35 * R * Math.max(0, Math.abs(a) - 0.3) ** 1.5)   // the sides droop
    return q
  }
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const a0 = -1 + (2 * i) / n
      const a1 = -1 + (2 * (i + 1)) / n
      const b0 = -1 + (2 * j) / n
      const b1 = -1 + (2 * (j + 1)) / n
      const uv = (a: number, b: number): [number, number] => [0.5 + a * 0.5, 0.44 + b * 0.5]
      const nn = norm(add(add(at((a0 + a1) / 2, (b0 + b1) / 2), centre, -1), [0, 0.8, 0]))
      quad(out, [at(a0, b0), at(a1, b0), at(a1, b1), at(a0, b1)], [uv(a0, b0), uv(a1, b0), uv(a1, b1), uv(a0, b1)], nn, c)
    }
  }
}

/** A straight tapering stem from a to b, any direction: the cabbage tree's branches. */
function stem(out: MeshBuilder, a: V3, b: V3, r0: number, r1: number, sides: number, tile: number, c: Rgb): void {
  const ax = norm(add(b, a, -1))
  const ref: V3 = Math.abs(ax[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]
  const u = norm(cross(ax, ref))
  const v = cross(ax, u)
  const L = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])
  for (let i = 0; i < sides; i++) {
    const t0 = (i / sides) * Math.PI * 2
    const t1 = ((i + 1) / sides) * Math.PI * 2
    const ring = (p: V3, r: number, t: number): V3 => add(add(p, u, Math.cos(t) * r), v, Math.sin(t) * r)
    const n = norm(add(add([0, 0, 0], u, Math.cos((t0 + t1) / 2)), v, Math.sin((t0 + t1) / 2)))
    quad(out, [ring(a, r0, t0), ring(a, r0, t1), ring(b, r1, t1), ring(b, r1, t0)],
      [[i / sides, 0], [(i + 1) / sides, 0], [(i + 1) / sides, L / tile], [i / sides, L / tile]], n, c)
  }
}

/** A tuft of strap leaves at `p`: crossed vertical cards wearing the painted tuft, its heart (0.5, 0.62) at p. */
function tuft(out: MeshBuilder, p: V3, size: number, cards: number, spin: number, c: Rgb): void {
  for (let k = 0; k < cards; k++) {
    const a = spin + (k / cards) * Math.PI
    const side: V3 = [Math.cos(a), 0, Math.sin(a)]
    const lo = -0.38 * size
    const hi = 0.62 * size
    const A = add(add(p, side, -size / 2), [0, 1, 0], lo)
    const B = add(add(p, side, size / 2), [0, 1, 0], lo)
    const C = add(add(p, side, size / 2), [0, 1, 0], hi)
    const D = add(add(p, side, -size / 2), [0, 1, 0], hi)
    // (normal up and out: the tuft is lit as a ball, as the palms' heads are)
    quad(out, [A, B, C, D], [[0, 0], [1, 0], [1, 1], [0, 1]], norm([Math.sin(a) * 0.3, 1, -Math.cos(a) * 0.3]), c)
  }
}

export interface PalmBuild { trunk: MeshBuilder; collar: MeshBuilder; leaves: MeshBuilder; top: number }

/** One palm at one level of detail (0 near, 1 mid, 2 far): the three builders and its height. */
export function palm(kind: PalmKind, seed: number, lod: 0 | 1 | 2): PalmBuild {
  const r = rng(seed)
  const trunk = new MeshBuilder()
  const collar = new MeshBuilder()
  const leaves = new MeshBuilder()
  const white: Rgb = [1, 1, 1]
  if (kind === 'canary') {
    const h = 8 + r() * 5
    const lean = (r() - 0.5) * 0.04
    const x = (y: number): number => lean * y
    // the trunk: a flared foot, a thick column tapering a little, the scars round it
    column(trunk, 0, 0.6, 0.85, 0.62, lod === 2 ? 6 : 12, 1, 1.4, 2, white, x)
    column(trunk, 0.6, h - 0.9, 0.62, 0.55, lod === 2 ? 6 : 12, lod === 0 ? 4 : 1, 1.4, 2, white, x)
    // the knob: the fresh leaf bases, bulging, orange-brown
    column(collar, h - 0.9, h - 0.3, 0.55, 0.85, lod === 2 ? 6 : 12, 1, 0.6, 3, white, x)
    column(collar, h - 0.3, h + 0.15, 0.85, 0.55, lod === 2 ? 6 : 12, 1, 0.6, 3, white, x)
    const centre: V3 = [x(h), h + 0.4, 0]
    const n = lod === 0 ? 64 : lod === 1 ? 34 : 22
    const golden = 2.39996323
    for (let i = 0; i < n; i++) {
      // (a city palm is trimmed — the "pineapple cut" — so the oldest, hanging fronds are gone: k stops at 0.8)
      const k = (i / n) * 0.8
      // spiralled round the crown: the young fronds (k small) rise from the middle, the older ones leave nearer
      // horizontal and arch right over, the oldest hang — a round head, not a shuttlecock
      const yaw = i * golden + (r() - 0.5) * 0.35
      const pitch = 0.95 - k * 1.05 + (r() - 0.5) * 0.18
      const droop = 0.9 + k * 1.3 + r() * 0.35
      const len = (5.0 + k * 1.2) * (0.9 + r() * 0.2)
      const tone = 0.85 + r() * 0.2
      const age = k * k
      const c: Rgb = [tone * (1 + age * 0.35), tone * (1 - age * 0.08), tone * (1 - age * 0.25)]
      const start = add(centre, [Math.sin(yaw), 0, Math.cos(yaw)], 0.25 + k * 0.3)
      featherFrond(leaves, [start[0], centre[1] - k * 0.45, start[2]], centre, yaw, pitch, droop, len, 0.72 * (0.9 + r() * 0.2) * (lod === 2 ? 1.35 : lod === 1 ? 1.12 : 1),
        (r() - 0.5) * 0.9, 0.3 + r() * 0.25, lod === 0 ? 9 : lod === 1 ? 5 : 3, c, 0)
    }
    return { trunk, collar, leaves, top: h + 3 }
  }
  if (kind === 'queen') {
    // Syagrus: a slim smooth grey trunk, a short green crownshaft, a head of long plumed fronds that arch right over
    const h = 8 + r() * 4
    const lean = (r() - 0.5) * 0.05
    const x = (y: number): number => lean * y * y / h
    column(trunk, 0, 0.5, 0.3, 0.2, lod === 2 ? 5 : 9, 1, 1.4, 2, white, x)
    column(trunk, 0.5, h - 1, 0.2, 0.17, lod === 2 ? 5 : 9, lod === 0 ? 5 : 2, 1.4, 2, white, x)
    column(collar, h - 1, h + 0.2, 0.19, 0.24, lod === 2 ? 5 : 8, 1, 1.2, 1, [0.62, 0.78, 0.5], x)
    const centre: V3 = [x(h), h + 0.3, 0]
    const n = lod === 0 ? 24 : lod === 1 ? 16 : 10
    for (let i = 0; i < n; i++) {
      const k = i / n
      const yaw = i * 2.39996323 + (r() - 0.5) * 0.4
      const pitch = 0.85 - k * 0.9 + (r() - 0.5) * 0.2
      const droop = 1.9 + k * 1.3 + r() * 0.4
      const len = (4.4 + k * 0.9) * (0.9 + r() * 0.2)
      const tone = 0.9 + r() * 0.15
      const c: Rgb = [tone * (1 + k * k * 0.25), tone, tone * (1 - k * k * 0.2)]
      featherFrond(leaves, [centre[0], centre[1] - k * 0.3, centre[2]], centre, yaw, pitch, droop, len, 0.8 * (lod === 2 ? 1.3 : lod === 1 ? 1.1 : 1),
        (r() - 0.5) * 1.4, 0.55 + r() * 0.25, lod === 0 ? 9 : lod === 1 ? 5 : 3, c, 0)
    }
    return { trunk, collar, leaves, top: h + 2.4 }
  }
  if (kind === 'spiky') {
    // the cabbage tree: a short fibrous trunk that forks into a few stems, each with its tuft of straps
    const h = 1.6 + r() * 1.6
    const sides = lod === 2 ? 4 : 7
    stem(trunk, [0, 0, 0], [0, h, 0], 0.22, 0.16, sides, 1.2, white)
    const forks = 2 + Math.floor(r() * 3)
    for (let i = 0; i < forks; i++) {
      const a = (i / forks) * Math.PI * 2 + r() * 0.8
      const out = 0.5 + r() * 0.9
      const up = 0.8 + r() * 1.4
      const tip: V3 = [Math.cos(a) * out, h + up, Math.sin(a) * out]
      stem(trunk, [0, h - 0.1, 0], tip, 0.13, 0.09, sides, 1.2, white)
      // the dead leaves hanging under each tuft
      stem(collar, add(tip, [0, -0.5, 0]), add(tip, [0, 0.05, 0]), 0.2, 0.14, sides, 0.8, white)
      const tone = 0.88 + r() * 0.12
      tuft(leaves, tip, 2.4 + r() * 0.7, lod === 2 ? 2 : 4, r() * Math.PI, [tone, tone, tone])
    }
    return { trunk, collar, leaves, top: h + 2.9 }
  }
  // the fan palm: tall and thin, a slight lean that grows with height. The windmill palm (Trachycarpus) is the
  // same plan small: a short trunk wrapped in brown fibre, a head nearly as big as a Washingtonia's on it
  const small = kind === 'windmill'
  const h = small ? 2.8 + r() * 3.5 : 14 + r() * 8
  const lean = (r() - 0.5) * 0.06
  const x = (y: number): number => lean * y * y / h
  if (small) {
    column(trunk, 0, h - 0.1, 0.17, 0.15, lod === 2 ? 5 : 8, lod === 0 ? 3 : 1, 0.9, 2, white, x)
  } else {
    column(trunk, 0, 0.6, 0.42, 0.3, lod === 2 ? 5 : 9, 1, 1.2, 2, white, x)
    column(trunk, 0.6, h - 0.1, 0.3, 0.21, lod === 2 ? 5 : 9, lod === 0 ? 6 : 2, 1.2, 2, white, x)
  }
  // the skirt of dead leaves under the head: not a cone but dead leaves hanging, each its own card folded down
  // against the trunk, of different lengths — so its outline is ragged and the light gets in between
  // three in five are trimmed to a short petticoat, as the city's street palms are; the rest keep a full skirt
  const trimmed = small || r() < 0.6
  const hang = small ? 0 : lod === 0 ? 30 : lod === 1 ? 16 : 8
  for (let i = 0; i < hang; i++) {
    const a = (i / hang) * Math.PI * 2 + (r() - 0.5) * 0.3
    const L = trimmed ? 0.6 + r() * 0.7 : 2.2 + r() * 1.6
    const top = h - 0.25 - r() * 0.3
    const rt = 0.7 + r() * 0.25
    const rb = 0.3 + r() * 0.1
    const half = 0.32 + r() * 0.12
    const ax: V3 = [Math.sin(a), 0, Math.cos(a)]
    const tan: V3 = [Math.cos(a), 0, -Math.sin(a)]
    const tx = x(top)
    const bx = x(top - L)
    const T: V3 = [tx + ax[0] * rt, top, ax[2] * rt]
    const B: V3 = [bx + ax[0] * rb, top - L, ax[2] * rb]
    const u0 = (i % 4) * 0.25
    const tone = 0.7 + r() * 0.3
    quad(collar, [add(T, tan, -half), add(T, tan, half), add(B, tan, half * 0.7), add(B, tan, -half * 0.7)],
      [[u0, 1], [u0 + 0.25, 1], [u0 + 0.25, 0], [u0, 0]], ax, [tone, tone * 0.95, tone * 0.88])
  }
  const centre: V3 = [x(h), h + 0.6, 0]
  const n = lod === 0 ? 24 : lod === 1 ? 16 : 12
  for (let i = 0; i < n; i++) {
    const k = i / n
    const yaw = i * 2.39996323 + (r() - 0.5) * 0.4
    // an open spray on long stalks: the top leaves stand up, the lowest reach out and down, sky between them
    const pitch = 1.25 - k * 1.55 + (r() - 0.5) * 0.25
    const tone = 0.88 + r() * 0.18
    const age = k * k * 0.5
    const c: Rgb = [tone * (1 + age * 0.4), tone, tone * (1 - age * 0.3)]
    fanLeaf(leaves, [centre[0], h + 0.1 + (1 - k) * (small ? 0.25 : 0.5), centre[2]], centre, yaw, pitch,
      small ? 0.9 + r() * 0.5 : 1.5 + r() * 0.9, (small ? 0.62 + r() * 0.15 : 0.9 + r() * 0.3) * (lod === 2 ? 1.25 : 1),
      0.25 + r() * 0.15, lod === 0 ? 5 : lod === 1 ? 3 : 2, c, [0.6, 0.62, 0.4], r() < 0.5, (r() - 0.5) * 2.2)
  }
  return { trunk, collar, leaves, top: h + (small ? 1.2 : 1.8) }
}

const TEXTURES: Record<PalmKind, { trunk: string; collar: string; leaves: string[] }> = {
  canary: { trunk: 'canary-trunk.png', collar: 'canary-knob.png', leaves: ['canary-frond-a.png', 'canary-frond-b.png'] },
  fan: { trunk: 'fan-trunk.png', collar: 'fan-skirt.png', leaves: ['fan-leaf-a.png', 'fan-leaf-b.png'] },
  queen: { trunk: 'queen-trunk.png', collar: 'queen-trunk.png', leaves: ['queen-frond-a.png', 'queen-frond-b.png'] },
  windmill: { trunk: 'fan-skirt.png', collar: 'fan-skirt.png', leaves: ['fan-leaf-a.png', 'fan-leaf-b.png'] },
  spiky: { trunk: 'fan-trunk.png', collar: 'fan-skirt.png', leaves: ['strap-tuft-a.png', 'strap-tuft-b.png'] },
}

function material(scene: Scene, base: string, file: string, cutout: boolean): StandardMaterial {
  const name = `palm:${file}`
  const found = scene.materials.find((m) => m.name === name)
  if (found) return found as StandardMaterial
  const m = new StandardMaterial(name, scene)
  const t = new Texture(`${base}${file}`, scene)
  t.hasAlpha = cutout
  m.diffuseTexture = t
  m.specularColor = new Color3(0.06, 0.07, 0.05)
  m.backFaceCulling = !cutout
  // (not for the tufts: their crossed cards carry a normal pointing up out of the tuft, and flipping it for the
  // back face left every card seen from behind black)
  m.twoSidedLighting = cutout && !file.startsWith('strap')
  if (cutout) {
    m.transparencyMode = 1         // Material.MATERIAL_ALPHATEST, as the tree library's foliage (vegetation.ts)
    m.alphaCutOff = 0.45
    m.useAlphaFromDiffuseTexture = true
  }
  return m
}

/** A palm as the vegetation's model: its three levels of detail as meshes, and its height. */
export function palmModel(scene: Scene, base: string, kind: PalmKind, seed: number): { parts: Mesh[]; far: Mesh[]; farther: Mesh[]; top: number } {
  const tex = TEXTURES[kind]
  const leafFile = tex.leaves[seed % tex.leaves.length]
  const bands: Mesh[][] = []
  let top = 10
  for (const lod of [0, 1, 2] as const) {
    const b = palm(kind, seed, lod)
    top = b.top
    const meshes: Mesh[] = []
    for (const [part, builder, file, cutout] of [
      ['trunk', b.trunk, tex.trunk, false], ['collar', b.collar, tex.collar, kind === 'fan' || kind === 'spiky' || kind === 'windmill'], ['leaves', b.leaves, leafFile, true],
    ] as const) {
      if (builder.triangles === 0) continue
      const m = new Mesh(`palm:${kind}:${seed}:${lod}:${part}`, scene)
      builder.toVertexData().applyToMesh(m)
      // the builder's colour carries a tag in its alpha; here the colour is a tint and nothing else
      const cols = m.getVerticesData('color')
      if (cols) { for (let i = 3; i < cols.length; i += 4) cols[i] = 1; m.setVerticesData('color', cols) }
      m.useVertexColors = true
      m.hasVertexAlpha = false
      m.material = material(scene, base, file, cutout)
      m.isPickable = false
      m.alwaysSelectAsActiveMesh = true
      m.renderingGroupId = 3
      meshes.push(m)
    }
    bands.push(meshes)
  }
  return { parts: bands[0], far: bands[1], farther: bands[2], top }
}
