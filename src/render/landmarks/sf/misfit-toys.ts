/**
 * Two toy installations by the Bay Area collective Misfit Toys on the lawns either side of the JFK Promenade, Golden Gate
 * Park, at Nancy Pelosi Drive (owner, 2026-10-27, with photographs and a satellite view: "Love blocks at 244 JFK drive.
 * Then giant jacks across the street which are newer").
 *
 * THE LOVE BLOCKS ("Remember When"; OSM node/12641813205, "LOVE blocks, by Misfit Toys"): four giant alphabet blocks of
 * weathered pale wood, each face framed and carrying a raised painted letter — L red, O slate blue, V green, E red, and
 * other letters and numbers round their sides (the photograph shows a red 4 and an F beside the E) — dropped into the
 * lawn north of the Promenade by the Garfield monument, each tipped over and half sunk. In a row along the satellite
 * view's line, L at the west end.
 *
 * WHERE'S THE BALL (Rec & Park, March 2026: "10 large-scale sculptures made of galvanized steel that replicate jacks"):
 * ten jacks across the Promenade on the lawn east of Nancy Pelosi Drive, each six arms with a ball on every end, lying as
 * a thrown jack lies, on three balls with three arms up. Not in OSM and newer than the satellite picture: their spread is
 * by judgement from the owner's photograph (the blocks beyond them across the path, the Conservatory's dome behind).
 *
 * Both in city metres (x east, z north), placed by public/landmarks/san-francisco/parks.json at rotateDeg 0 about the
 * ANCHOR each entry's lat/lon makes.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import type { Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'

type V3 = [number, number, number]
type M3 = [V3, V3, V3]
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

const WOOD: Rgb = [0.74, 0.69, 0.60]
const FRAME: Rgb = [0.82, 0.79, 0.72]
const RED: Rgb = [0.68, 0.17, 0.13]
const SLATE: Rgb = [0.36, 0.43, 0.53]
const GREEN: Rgb = [0.24, 0.45, 0.30]
const GREY: Rgb = [0.55, 0.55, 0.52]
const STEEL: Rgb = [0.70, 0.72, 0.74]

/** the blocks' entry: OSM's node, in city metres */
const BLOCKS_AT: [number, number] = [-4137.9, -2380.4]
/** the jacks' entry: the middle of the lawn they are spread on, in city metres */
const JACKS_AT: [number, number] = [-4133.8, -2434.6]

/** a stroke font for the blocks' faces, in a square ±0.6 */
type Stroke = [number, number, number, number]
const GLYPHS: Record<string, Stroke[]> = {
  L: [[-0.4, 0.6, -0.4, -0.6], [-0.4, -0.6, 0.45, -0.6]],
  O: [[-0.45, -0.6, 0.45, -0.6], [0.45, -0.6, 0.45, 0.6], [0.45, 0.6, -0.45, 0.6], [-0.45, 0.6, -0.45, -0.6]],
  V: [[-0.5, 0.6, 0, -0.6], [0, -0.6, 0.5, 0.6]],
  E: [[-0.4, 0.6, -0.4, -0.6], [-0.4, 0.6, 0.45, 0.6], [-0.4, 0, 0.3, 0], [-0.4, -0.6, 0.45, -0.6]],
  F: [[-0.4, 0.6, -0.4, -0.6], [-0.4, 0.6, 0.45, 0.6], [-0.4, 0, 0.3, 0]],
  '4': [[0.2, 0.6, 0.2, -0.6], [0.2, 0.6, -0.45, -0.15], [-0.45, -0.15, 0.5, -0.15]],
  A: [[-0.5, -0.6, 0, 0.6], [0, 0.6, 0.5, -0.6], [-0.27, -0.1, 0.27, -0.1]],
  C: [[0.45, 0.6, -0.45, 0.6], [-0.45, 0.6, -0.45, -0.6], [-0.45, -0.6, 0.45, -0.6]],
  '7': [[-0.45, 0.6, 0.45, 0.6], [0.45, 0.6, -0.1, -0.6]],
  '2': [[-0.45, 0.6, 0.45, 0.6], [0.45, 0.6, 0.45, 0], [0.45, 0, -0.45, 0], [-0.45, 0, -0.45, -0.6], [-0.45, -0.6, 0.45, -0.6]],
}

/**
 * The four blocks: where (city metres), how big, how each lies (yaw, then the tip about the block's own x and z), and
 * what is on its faces — the first is local −z, which a yaw of ψ turns to face bearing ψ + 180: south-west, towards the
 * Promenade and the photograph's viewpoint.
 */
const BLOCKS: { at: [number, number]; edge: number; yaw: number; tipX: number; tipZ: number; faces: [string, Rgb][] }[] = [
  { at: [-4144.6, -2381.8], edge: 1.8, yaw: 30, tipX: 28, tipZ: -12, faces: [['L', RED], ['A', SLATE], ['7', GREEN], ['C', RED], ['2', SLATE], ['F', GREY]] },
  { at: [-4140.0, -2380.9], edge: 1.6, yaw: 12, tipX: -18, tipZ: 30, faces: [['O', SLATE], ['2', RED], ['C', GREEN], ['A', RED], ['4', GREY], ['E', SLATE]] },
  { at: [-4135.6, -2379.9], edge: 1.6, yaw: 25, tipX: 16, tipZ: 8, faces: [['V', GREEN], ['A', RED], ['2', SLATE], ['L', GREEN], ['7', RED], ['C', SLATE]] },
  { at: [-4129.0, -2378.8], edge: 1.6, yaw: 42, tipX: 10, tipZ: 20, faces: [['E', RED], ['4', RED], ['F', GREY], ['O', GREEN], ['A', SLATE], ['7', RED]] },
]

export function loveBlocks(out: MeshBuilder, fit: Fit): void {
  const wood = surfaceTag('planks')
  for (const b of BLOCKS) {
    const x = b.at[0] - BLOCKS_AT[0], z = b.at[1] - BLOCKS_AT[1]
    const R = mul(rotY(b.yaw), mul(rotX(b.tipX), rotZ(b.tipZ)))
    const h = b.edge / 2
    // sunk so its lowest corner is half a metre under the grass
    let low = Infinity
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) low = Math.min(low, apply(R, [sx * h, sy * h, sz * h])[1])
    const g = fit.groundAt ? fit.groundAt(x, z) : 0.5
    const c: V3 = [x, g - low - 0.5, z]
    const P = (p: V3): V3 => { const q = apply(R, p); return [q[0] + c[0], q[1] + c[1], q[2] + c[2]] }
    const N = (n: V3): V3 => apply(R, n)
    // the six faces: the body, the raised frame round each, and its letter. Face k looks along `n`, with `u` across it
    // and `v` up it — `u` is the viewer's right, or the letters read mirrored; face 0 is local −z
    const FACES: [V3, V3, V3][] = [
      [[0, 0, -1], [1, 0, 0], [0, 1, 0]], [[1, 0, 0], [0, 0, 1], [0, 1, 0]], [[0, 1, 0], [1, 0, 0], [0, 0, 1]],
      [[-1, 0, 0], [0, 0, -1], [0, 1, 0]], [[0, 0, 1], [-1, 0, 0], [0, 1, 0]], [[0, -1, 0], [-1, 0, 0], [0, 0, 1]],
    ]
    FACES.forEach(([n, u, v], k) => {
      const F = (a: number, bb: number, d: number): V3 => P([n[0] * (h + d) + u[0] * a + v[0] * bb, n[1] * (h + d) + u[1] * a + v[1] * bb, n[2] * (h + d) + u[2] * a + v[2] * bb])
      out.quad([F(-h, -h, 0), F(h, -h, 0), F(h, h, 0), F(-h, h, 0)], N(n), UV, WOOD, wood)
      /** a raised bar on this face from (a0, b0) to (a1, b1), `w` wide, `d` proud */
      const bar = (a0: number, b0: number, a1: number, b1: number, w: number, d: number, col: Rgb, tag: number): void => {
        const L = Math.hypot(a1 - a0, b1 - b0) || 1
        const ta = (a1 - a0) / L, tb = (b1 - b0) / L, na = -tb * w / 2, nb = ta * w / 2
        // the ends run on half a width, so strokes meet at the corners
        const e0a = a0 - ta * w / 2, e0b = b0 - tb * w / 2, e1a = a1 + ta * w / 2, e1b = b1 + tb * w / 2
        const q: [number, number][] = [[e0a + na, e0b + nb], [e0a - na, e0b - nb], [e1a - na, e1b - nb], [e1a + na, e1b + nb]]
        out.quad(q.map(([a, bb]) => F(a, bb, d)), N(n), UV, col, tag)
        for (let i = 0; i < 4; i++) {
          const [pa, pb] = q[i], [qa, qb] = q[(i + 1) % 4]
          const sa = (pa + qa) / 2 - (e0a + e1a) / 2, sb = (pb + qb) / 2 - (e0b + e1b) / 2, sl = Math.hypot(sa, sb) || 1
          const side: V3 = [u[0] * sa / sl + v[0] * sb / sl, u[1] * sa / sl + v[1] * sb / sl, u[2] * sa / sl + v[2] * sb / sl]
          out.quad([F(pa, pb, 0), F(qa, qb, 0), F(qa, qb, d), F(pa, pb, d)], N(side), UV, col, tag)
        }
      }
      // the frame round the face, and the letter, scaled to it
      const f = h - 0.07
      bar(-f, -f, f, -f, 0.12, 0.04, FRAME, wood); bar(f, -f, f, f, 0.12, 0.04, FRAME, wood)
      bar(f, f, -f, f, 0.12, 0.04, FRAME, wood); bar(-f, f, -f, -f, 0.12, 0.04, FRAME, wood)
      const [ch, col] = b.faces[k]
      const s = h * 1.1
      for (const [a0, b0, a1, b1] of GLYPHS[ch] ?? []) bar(a0 * s, b0 * s, a1 * s, b1 * s, h * 0.24, 0.06, col, 0)
    })
  }
}

/**
 * the ten jacks: where (city metres) and the yaw each lies at; their size is the photograph's, about a metre and a half.
 * Scattered on the lawn between the Promenade and the trail south of it, each at least 3.2 m from the line of every way
 * OSM maps there (9.5 from the Promenade's), 4 m apart. (Two earlier spreads stood jacks on the roadway and on the trail:
 * the check took only the ways with a VERTEX near the lawn, and the trail's are 30 m off at either end — owner,
 * 2026-10-27: "looks like 2 jacks are in the trail".)
 */
const JACKS: [number, number, number][] = [
  [-4142.4, -2433.9, 15], [-4146.2, -2429.7, 80], [-4147.9, -2437.7, 140], [-4116.0, -2431.3, 200], [-4124.1, -2430.0, 260],
  [-4111.3, -2434.4, 320], [-4137.6, -2440.9, 35], [-4143.1, -2440.9, 110], [-4129.5, -2429.7, 170], [-4140.3, -2437.4, 235],
]
const ARM = 0.82
const BALL = 0.21
const BAR = 0.13

export function wheresTheBall(out: MeshBuilder, fit: Fit): void {
  const metal = surfaceTag('metal')
  // a thrown jack lies on three balls: the diagonal between its +x, +y and +z arms points straight down
  const lie = alignTo(norm([1, 1, 1]), [0, -1, 0])
  for (const [jx, jz, yaw] of JACKS) {
    const x = jx - JACKS_AT[0], z = jz - JACKS_AT[1]
    const R = mul(rotY(yaw), lie)
    const g = fit.groundAt ? fit.groundAt(x, z) : 0.5
    const c: V3 = [x, g + ARM / Math.sqrt(3) + BALL - 0.04, z]
    for (const axis of [[1, 0, 0], [0, 1, 0], [0, 0, 1]] as V3[]) {
      const d = apply(R, axis)
      const a: V3 = [c[0] - d[0] * ARM, c[1] - d[1] * ARM, c[2] - d[2] * ARM]
      const b: V3 = [c[0] + d[0] * ARM, c[1] + d[1] * ARM, c[2] + d[2] * ARM]
      rod(out, a, b, BAR, STEEL, metal)
      ball(out, a, BALL, STEEL, metal)
      ball(out, b, BALL, STEEL, metal)
    }
  }
}

/** a square bar from a to b, `w` across, turned about its own axis however the cross product falls */
function rod(out: MeshBuilder, a: V3, b: V3, w: number, c: Rgb, tag: number): void {
  const d = norm(sub(b, a))
  const ref: V3 = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]
  const p = norm(cross(d, ref)), q = cross(d, p)
  const hw = w / 2
  const corner = (o: V3, s: number, t: number): V3 => [o[0] + p[0] * s * hw + q[0] * t * hw, o[1] + p[1] * s * hw + q[1] * t * hw, o[2] + p[2] * s * hw + q[2] * t * hw]
  const sides: [number, number, number, number, V3][] = [[1, -1, 1, 1, p], [1, 1, -1, 1, q], [-1, 1, -1, -1, [-p[0], -p[1], -p[2]]], [-1, -1, 1, -1, [-q[0], -q[1], -q[2]]]]
  for (const [s0, t0, s1, t1, n] of sides) out.quad([corner(a, s0, t0), corner(a, s1, t1), corner(b, s1, t1), corner(b, s0, t0)], n, UV, c, tag)
}

/** a ball, shaded round (each quad's normals set to its corners' own directions) */
function ball(out: MeshBuilder, o: V3, r: number, c: Rgb, tag: number): void {
  const LAT = 6, LON = 10
  const dir = (i: number, j: number): V3 => {
    const th = (i / LAT) * Math.PI, ph = (j / LON) * Math.PI * 2
    return [Math.sin(th) * Math.sin(ph), Math.cos(th), Math.sin(th) * Math.cos(ph)]
  }
  for (let i = 0; i < LAT; i++) for (let j = 0; j < LON; j++) {
    const ds = [dir(i, j), dir(i, j + 1), dir(i + 1, j + 1), dir(i + 1, j)]
    const m = norm(ds.reduce((s, d) => [s[0] + d[0], s[1] + d[1], s[2] + d[2]] as V3, [0, 0, 0] as V3))
    out.quad(ds.map((d) => [o[0] + d[0] * r, o[1] + d[1] * r, o[2] + d[2] * r] as V3), m, UV, c, tag)
    const v0 = out.normals.length - 12
    ds.forEach((d, k) => { out.normals[v0 + k * 3] = d[0]; out.normals[v0 + k * 3 + 1] = d[1]; out.normals[v0 + k * 3 + 2] = d[2] })
  }
}

// small rotation kit: matrices are rows; a bearing turns clockwise seen from above (x east, z north)
const rad = (d: number): number => (d * Math.PI) / 180
const rotY = (deg: number): M3 => { const c = Math.cos(rad(deg)), s = Math.sin(rad(deg)); return [[c, 0, s], [0, 1, 0], [-s, 0, c]] }
const rotX = (deg: number): M3 => { const c = Math.cos(rad(deg)), s = Math.sin(rad(deg)); return [[1, 0, 0], [0, c, -s], [0, s, c]] }
const rotZ = (deg: number): M3 => { const c = Math.cos(rad(deg)), s = Math.sin(rad(deg)); return [[c, -s, 0], [s, c, 0], [0, 0, 1]] }
const mul = (A: M3, B: M3): M3 => A.map((row) => [0, 1, 2].map((j) => row[0] * B[0][j] + row[1] * B[1][j] + row[2] * B[2][j])) as M3
const apply = (A: M3, v: V3): V3 => [A[0][0] * v[0] + A[0][1] * v[1] + A[0][2] * v[2], A[1][0] * v[0] + A[1][1] * v[1] + A[1][2] * v[2], A[2][0] * v[0] + A[2][1] * v[1] + A[2][2] * v[2]]
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const norm = (a: V3): V3 => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l] }
/** the rotation taking unit vector a onto unit vector b (Rodrigues) */
function alignTo(a: V3, b: V3): M3 {
  const k = cross(a, b), s = Math.hypot(k[0], k[1], k[2]), c = a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
  if (s < 1e-9) return [[1, 0, 0], [0, 1, 0], [0, 0, 1]]
  const [x, y, z] = [k[0] / s, k[1] / s, k[2] / s], t = 1 - c
  return [[c + x * x * t, x * y * t - z * s, x * z * t + y * s], [y * x * t + z * s, c + y * y * t, y * z * t - x * s], [z * x * t - y * s, z * y * t + x * s, c + z * z * t]]
}
